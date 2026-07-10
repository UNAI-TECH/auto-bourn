// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
}

// ==========================================
// Boxtel Response Helper
// The Boxtel Attendance Monitor middleware expects this EXACT JSON shape.
// Without it, the middleware retries the same punch forever.
// ==========================================
function boxtelResponse(status: boolean, message: string, value: string = "") {
  return new Response(
    JSON.stringify({
      returnStatus: status ? "true" : "false",
      returnMessage: message,
      returnValue: value
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ==========================================
// Date Parser - handles Boxtel's DD-MM-YYYY HH:mm:ss format
// Also handles DD/MM/YYYY, ISO strings, and 2-digit years
// ==========================================
function parseBoxtelDate(dateString: string): Date {
  try {
    const trimmed = dateString.trim();

    // If already ISO or YYYY-MM-DD
    if (trimmed.includes('T') || (trimmed.includes('-') && trimmed.indexOf('-') === 4)) {
      const hasOffset = trimmed.includes('+') || trimmed.includes('Z') || (trimmed.lastIndexOf('-') > trimmed.indexOf('T'));
      const suffix = hasOffset ? '' : '+05:30';
      const parsed = new Date(trimmed + suffix);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Parse dd/MM/yyyy HH:mm:ss or dd-MM-yyyy HH:mm:ss
    const [datePart, timePart] = trimmed.split(' ');
    const separator = datePart.includes('/') ? '/' : '-';
    const [day, month, year] = datePart.split(separator);
    const fullYear = year.length === 2 ? `20${year}` : year;
    const isoString = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}+05:30`;
    
    console.log(`[BIOMETRIC] Parsed date: ${dateString} -> ${isoString}`);
    return new Date(isoString);
  } catch (e) {
    console.error(`[BIOMETRIC] Date parse failed for: ${dateString}`, e);
    return new Date(); // fallback to now
  }
}

serve(async (req: Request) => {
  const url = new URL(req.url);
  const method = req.method;

  console.log(`[BIOMETRIC] ===== [${method}] ${url.pathname}${url.search} =====`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ==========================================
  // 1. Gather payload from ALL sources (query string + body)
  // ==========================================
  let payload: any = {};

  // Read query params
  url.searchParams.forEach((value, key) => {
    payload[key] = value;
  });

  // Read body (POST/PUT)
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const rawBody = await req.text();
      console.log(`[BIOMETRIC] Raw Body: ${rawBody}`);

      if (rawBody) {
        try {
          const jsonBody = JSON.parse(rawBody);
          payload = { ...payload, ...jsonBody };
        } catch (_) {
          // Fallback: try URL-encoded form data
          const params = new URLSearchParams(rawBody);
          params.forEach((v, k) => { payload[k] = v; });
        }
      }
    } catch (e) {
      console.error(`[BIOMETRIC] Error reading body:`, e);
    }
  }

  console.log(`[BIOMETRIC] Payload:`, JSON.stringify(payload));

  // ==========================================
  // 2. Normalize keys to lowercase for case-insensitive lookup
  // ==========================================
  const norm: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    norm[key.toLowerCase()] = value;
  }

  // Extract key fields (case-insensitive with exact-case fallback)
  const clockDateTime = norm['clockdatetimed'] || payload.clockDateTimeD;
  const biometricUserId = norm['biometricuseridc'] || payload.biometricUserIDC;
  const cloudId = norm['cloudidc'] || payload.cloudIDC;
  const statusC = norm['statusc'] || payload.statusC || payload.StatusC;
  const verifyC = norm['verifyc'] || payload.verifyC;

  // ==========================================
  // A. ATTENDANCE LOG — when we have punch data
  // ==========================================
  if (clockDateTime && biometricUserId && cloudId) {
    try {
      console.log(`[BIOMETRIC] >>> ATTENDANCE LOG for user: ${biometricUserId}, device: ${cloudId}`);

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const punchTime = parseBoxtelDate(clockDateTime);
      const deviceUserId = String(biometricUserId).trim();

      // Determine punch type (0 = check-in, 1 = check-out)
      let punchType = 0;
      if (statusC) {
        const st = String(statusC).toLowerCase().trim();
        if (st === 'out' || st === 'checkout' || st === 'check_out' || st === '1') {
          punchType = 1;
        }
      }

      // Determine verification type
      let verifyType = 1; // default fingerprint
      if (verifyC) {
        const v = String(verifyC).toUpperCase().trim();
        if (v === 'FP' || v === 'FINGERPRINT') verifyType = 1;
        else if (v === 'FACE') verifyType = 2;
        else if (v === 'CARD' || v === 'RFID') verifyType = 4;
      }

      // Authenticate device
      const { data: device, error: deviceErr } = await supabase
        .from('biometric_devices')
        .select('*')
        .eq('device_id', cloudId)
        .eq('status', 'active')
        .maybeSingle();

      if (deviceErr) {
        console.error(`[BIOMETRIC] Device lookup error:`, JSON.stringify(deviceErr));
        return boxtelResponse(true, "Device error (accepted)");
      }

      if (!device) {
        console.warn(`[BIOMETRIC] Device not registered: ${cloudId}`);
        // Return TRUE so the middleware clears the punch from its queue
        return boxtelResponse(true, "Device not registered (accepted)");
      }

      // Update device heartbeat
      await supabase
        .from('biometric_devices')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('id', device.id);

      // Insert punch into biometric_punches (ignore duplicates via unique constraint)
      const { data: insertedPunch, error: insertErr } = await supabase
        .from('biometric_punches')
        .upsert({
          device_id: cloudId,
          device_user_id: deviceUserId,
          punch_time: punchTime.toISOString(),
          punch_type: punchType,
          verify_type: verifyType,
          raw_payload: payload
        }, {
          onConflict: 'device_id,device_user_id,punch_time',
          ignoreDuplicates: true
        })
        .select()
        .maybeSingle();

      if (insertErr) {
        // Handle unique constraint violation (duplicate)
        if (insertErr.code === '23505') {
          console.log(`[BIOMETRIC] Duplicate punch ignored for ${deviceUserId} at ${punchTime.toISOString()}`);
          return boxtelResponse(true, "Already recorded");
        }
        console.error(`[BIOMETRIC] Insert error:`, JSON.stringify(insertErr));
        return boxtelResponse(true, "Insert error (accepted)");
      }

      if (insertedPunch) {
        console.log(`[BIOMETRIC] NEW punch inserted: ${deviceUserId} at ${punchTime.toISOString()}, employee_id: ${insertedPunch.employee_id}`);

        // Create activity log if punch was mapped to an employee
        if (insertedPunch.employee_id) {
          const isCheckIn = punchType === 0;
          const typeLabels: Record<number, string> = { 1: 'Fingerprint', 2: 'Face', 4: 'Card' };
          const verifyLabel = typeLabels[verifyType] || 'Biometric';

          await supabase.from('activity_logs').insert({
            employee_id: insertedPunch.employee_id,
            action: isCheckIn ? 'login' : 'logout',
            details: `Biometric ${isCheckIn ? 'Check-in' : 'Check-out'} via ${device.device_name} (${verifyLabel})`,
            metadata: {
              biometric: true,
              punch_id: insertedPunch.id,
              device_id: device.device_id,
              verify_type: verifyType
            },
            created_at: punchTime.toISOString()
          });
        }

        return boxtelResponse(true, "Successfully added");
      }

      // Upsert returned no data = it was a duplicate (ignoreDuplicates: true)
      console.log(`[BIOMETRIC] Duplicate punch for ${deviceUserId} at ${punchTime.toISOString()}`);
      return boxtelResponse(true, "Already recorded");

    } catch (err: any) {
      console.error(`[BIOMETRIC] CRASH in attendance handler:`, err.message, err.stack);
      // ALWAYS return true so the middleware moves on
      return boxtelResponse(true, "Server error (accepted)");
    }
  }

  // ==========================================
  // B. HEARTBEAT — device status check (StatusC: "New", CloudIDC: "...")
  // ==========================================
  if (cloudId) {
    try {
      console.log(`[BIOMETRIC] >>> HEARTBEAT for device: ${cloudId}`);

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await supabase
        .from('biometric_devices')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('device_id', cloudId);

      return boxtelResponse(true, "Heartbeat received");
    } catch (err: any) {
      console.error(`[BIOMETRIC] CRASH in heartbeat handler:`, err.message);
      return boxtelResponse(true, "Heartbeat error (accepted)");
    }
  }

  // ==========================================
  // C. DEFAULT — test connection
  // ==========================================
  console.log(`[BIOMETRIC] >>> DEFAULT handler (test connection)`);
  return boxtelResponse(true, "Successfully connected");
})
