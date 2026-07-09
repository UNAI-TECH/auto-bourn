// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  // Allow GET requests for simple status checks (e.g. from biometric test server utility)
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', message: 'Biometric Attendance Edge Function is online' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Only allow POST requests for punch data
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Initialize Supabase Client using Service Role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('[BIOMETRIC] Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse payload body
    let body;
    try {
      body = await req.json()
    } catch (jsonErr) {
      console.error('[BIOMETRIC] Failed to parse JSON body:', jsonErr)
      return new Response(
        JSON.stringify({ error: 'Bad Request: Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log request details to activity_logs table for remote debugging
    try {
      await supabase.from('activity_logs').insert({
        action: 'upload',
        details: `BIOMETRIC DEBUG: Raw payload received`,
        metadata: {
          biometric_debug: true,
          method: req.method,
          url: req.url,
          headers: Object.fromEntries(req.headers.entries()),
          raw_body: body
        }
      });
      console.log('[BIOMETRIC] Successfully logged debug info to database activity_logs');
    } catch (logErr) {
      console.error('[BIOMETRIC] Failed to write debug log to DB:', logErr);
    }

    console.log('[BIOMETRIC] Received raw body payload:', JSON.stringify(body))

    // Handle case where body itself is an array of punches, or flat object
    const firstPunch = Array.isArray(body) ? body[0] : body;

    // Extract device ID / Cloud ID from payload
    const deviceIdFromBody = firstPunch?.cloudIDC ||
                             firstPunch?.device_id || 
                             firstPunch?.['Cloud ID'] || 
                             firstPunch?.cloud_id || 
                             firstPunch?.CloudID || 
                             firstPunch?.serial_number || 
                             firstPunch?.device_sn ||
                             (firstPunch?.punch && (firstPunch.punch.device_id || firstPunch.punch.cloudIDC || firstPunch.punch['Cloud ID'])) ||
                             (Array.isArray(firstPunch?.punches) && firstPunch.punches[0] && (firstPunch.punches[0].device_id || firstPunch.punches[0].cloudIDC || firstPunch.punches[0]['Cloud ID']))

    // Authenticate the device using api_key OR device_id (Cloud ID)
    const apiKey = req.headers.get('x-api-key') || new URL(req.url).searchParams.get('api_key')
    
    let device = null
    let deviceError = null
    
    if (apiKey) {
      const res = await supabase
        .from('biometric_devices')
        .select('*')
        .eq('api_key', apiKey)
        .eq('status', 'active')
        .single()
      device = res.data
      deviceError = res.error
    } else if (deviceIdFromBody) {
      const res = await supabase
        .from('biometric_devices')
        .select('*')
        .eq('device_id', deviceIdFromBody)
        .eq('status', 'active')
        .single()
      device = res.data
      deviceError = res.error
    }

    if (deviceError || !device) {
      console.warn(`[BIOMETRIC] Authentication failed. API Key: ${apiKey ? 'Provided' : 'None'}, Device ID: ${deviceIdFromBody || 'None'}`)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing API Key or Unregistered Device ID' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update heartbeat of the authenticated device
    await supabase
      .from('biometric_devices')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', device.id)

    // Normalize payload to handle single punch or batch punches
    const punches = Array.isArray(body.punches) ? body.punches : (body.punch ? [body.punch] : (Array.isArray(body) ? body : [body]))
    
    if (punches.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Bad Request: No punch data found in payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter out heartbeat pings (e.g. {"StatusC":"New","CloudIDC":"..."}) that don't contain punch data
    const validPunches = punches.filter(p => p.biometricUserIDC || p.user_id || p.device_user_id || p.employee_id)
    if (validPunches.length === 0) {
      console.log('[BIOMETRIC] Received heartbeat ping, no punch data. Returning ok.')
      return new Response(
        JSON.stringify({ success: true, message: 'Heartbeat received successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const punchesToInsert = []
    const invalidPunches = []

    for (const p of validPunches) {
      // Extract device user ID (Support 'biometricUserIDC', 'Biometric User ID', 'BiometricUserID', 'user_id', 'device_user_id', 'employee_id')
      const deviceUserId = p.biometricUserIDC || p['Biometric User ID'] || p.BiometricUserID || p.user_id || p.device_user_id || p.employee_id
      
      // Extract log time (Support 'clockDateTimeD', 'Log', 'log', 'log_time', 'punch_time', 'timestamp')
      const logTimeRaw = p.clockDateTimeD || p.Log || p.log || p.log_time || p.punch_time || p.timestamp
      
      // Determine punch type (0 = check-in, 1 = check-out)
      let punchType = 0
      if (p.punch_type !== undefined) {
        punchType = parseInt(p.punch_type, 10)
      } else if (p.statusC !== undefined) {
        const st = p.statusC.toString().toLowerCase().trim();
        if (st === 'out' || st === 'checkout' || st === 'check_out' || st === '1') {
          punchType = 1
        }
      } else if (p.status === 'out' || p.action === 'logout' || p.punch_type_str === 'check_out') {
        punchType = 1
      }

      // Determine verification type (1 = Fingerprint, 2 = Face, 4 = Card)
      let verifyType = 1
      if (p.verifyC !== undefined) {
        const v = p.verifyC.toString().toUpperCase().trim();
        if (v === 'FP' || v === 'FINGERPRINT') verifyType = 1;
        else if (v === 'FACE') verifyType = 2;
        else if (v === 'CARD' || v === 'RFID') verifyType = 4;
      } else if (p.verify_type !== undefined) {
        verifyType = parseInt(p.verify_type, 10)
      }

      // Validate mandatory fields
      if (!deviceUserId || !logTimeRaw) {
        invalidPunches.push({ payload: p, reason: 'Missing user_id / biometricUserIDC or log_time / clockDateTimeD' })
        continue
      }

      let punchTime: string
      try {
        // Handle format like "06-07-2026 12:10:53" (DD-MM-YYYY HH:MM:SS)
        let parseableTime = logTimeRaw
        if (typeof logTimeRaw === 'string' && logTimeRaw.includes('-') && !logTimeRaw.includes('T')) {
          const parts = logTimeRaw.split(' ')
          const dateParts = parts[0].split('-')
          if (dateParts[0].length === 2 && dateParts[2].length === 4) {
            parseableTime = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
            if (parts[1]) parseableTime += `T${parts[1]}`
          }
        }
        punchTime = new Date(parseableTime).toISOString()
      } catch (dateErr) {
        invalidPunches.push({ payload: p, reason: `Invalid log_time format: ${logTimeRaw}` })
        continue
      }

      punchesToInsert.push({
        device_id: p.device_id || p.cloudIDC || p['Cloud ID'] || device.device_id,
        device_user_id: deviceUserId.toString().trim(),
        punch_time: punchTime,
        punch_type: punchType,
        verify_type: parseInt(verifyType, 10),
        raw_payload: p
      })
    }

    if (punchesToInsert.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'All punches failed validation', 
          invalid: invalidPunches 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Insert punches into biometric_punches table (ignore duplicate logs if they are re-sent)
    const { data: insertedPunches, error: insertError } = await supabase
      .from('biometric_punches')
      .upsert(punchesToInsert, { 
        onConflict: 'device_id,device_user_id,punch_time', 
        ignoreDuplicates: true 
      })
      .select()

    if (insertError) {
      console.error('[BIOMETRIC] Database insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Database insert failed', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Create backward-compatible activity logs for dashboard/audit trail
    // Since the daily attendance trigger handles updating the `attendance_records` table,
    // we only insert into `activity_logs` so the old logs viewer and other modules keep showing check-in events.
    if (insertedPunches && insertedPunches.length > 0) {
      const activityLogs = []
      
      for (const p of insertedPunches) {
        if (!p.employee_id) {
          // If employee_id is null (unregistered card/fingerprint), skip activity logs
          continue
        }

        const isCheckIn = p.punch_type === 0
        const action = isCheckIn ? 'biometric_checkin' : 'biometric_checkout'
        const typeLabels = { 1: 'Fingerprint', 2: 'Face', 4: 'Card' }
        const verifyLabel = typeLabels[p.verify_type] || 'Biometric'
        
        activityLogs.push({
          employee_id: p.employee_id,
          action: isCheckIn ? 'login' : 'logout', // Keep 'login'/'logout' action to maintain compatibility with legacy UI
          details: `Biometric ${isCheckIn ? 'Check-in' : 'Check-out'} via ${device.device_name} (${verifyLabel})`,
          metadata: {
            biometric: true,
            punch_id: p.id,
            device_id: device.device_id,
            verify_type: p.verify_type
          },
          created_at: p.punch_time
        })
      }

      if (activityLogs.length > 0) {
        const { error: activityError } = await supabase
          .from('activity_logs')
          .insert(activityLogs)
        if (activityError) {
          console.error('[BIOMETRIC] Failed to insert activity logs:', activityError)
        }
      }
    }

    // 5. Response report
    const processedCount = punchesToInsert.length
    const insertedCount = insertedPunches ? insertedPunches.length : 0
    const skippedCount = processedCount - insertedCount

    console.log(`[BIOMETRIC] Successfully processed ${processedCount} punches. New: ${insertedCount}, Skipped (Duplicate): ${skippedCount}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        inserted: insertedCount,
        skipped: skippedCount,
        invalid: invalidPunches.length > 0 ? invalidPunches : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error('[BIOMETRIC] Unexpected edge function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
