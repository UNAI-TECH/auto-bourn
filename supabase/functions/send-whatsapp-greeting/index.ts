// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

// Declare Deno namespace globally to satisfy VS Code editor warnings
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    const payload = await req.json()
    console.log('[WHATSAPP] Received webhook payload:', JSON.stringify(payload))
    
    // Support both direct payloads, custom resends, and Supabase Database Webhook trigger payloads
    const record = payload.record || payload
    const leadId = record.id || payload.leadId
    const isForce = payload.force || false

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'Lead ID is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase Client using Service Role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      const errorMsg = 'Missing Supabase URL or Service Role Key in environment.'
      console.error(errorMsg)
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Retrieve the most up-to-date lead record from database
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (fetchError || !lead) {
      console.error('[WHATSAPP] Lead not found for ID:', leadId, fetchError)
      return new Response(
        JSON.stringify({ error: 'Lead not found.', details: fetchError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if greeting has already been sent to prevent duplicates (unless force resending)
    if (lead.wa_greeting_sent && !isForce) {
      console.log(`[WHATSAPP] Greeting already sent for lead ${leadId}. Skipping.`)
      return new Response(
        JSON.stringify({ success: true, message: 'Greeting already sent, skipped.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customerName = lead.customer_name
    const customerPhone = lead.whatsapp || lead.phone
    const interestedCar = lead.interested_car
    const source = lead.source

    if (!customerName || !customerPhone) {
      const errorMsg = `Customer name (${customerName}) and phone number (${customerPhone}) are required to send message.`
      console.error('[WHATSAPP]', errorMsg)
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Classify Lead & Select Template
    let classifiedType: string = 'crm_welcome'
    let messageBody = ''

    const isContactUs = interestedCar && interestedCar.toLowerCase().startsWith('get in touch')

    if (isContactUs) {
      classifiedType = 'contact_greeting'
      const interestArea = interestedCar.replace(/^Get In Touch:\s*/i, '') || 'our services'
      messageBody = `Hello *${customerName}*,\n\n` +
        `Thank you for reaching out to *AUTOBOURN Cars*! 👋\n\n` +
        `We have received your inquiry regarding *${interestArea}*. A member of our team will respond to you shortly.\n\n` +
        `We look forward to helping you find your perfect luxury car!\n\n` +
        `🌐 www.autobourncars.com\n` +
        `📞 +91 91767 77222\n\n` +
        `Warm regards,\n` +
        `*AUTOBOURN Cars* — Velachery, Chennai`
    } else if (source === 'manual' || source === 'walk_in' || source === 'referral') {
      classifiedType = 'crm_welcome'
      const carDetailSuffix = interestedCar ? ` in *${interestedCar}*` : ''
      messageBody = `Hello *${customerName}*,\n\n` +
        `Welcome to *AUTOBOURN Cars*! 🎉\n\n` +
        `We are delighted to have you as a valued prospect. Our luxury car consultant has noted your interest${carDetailSuffix} and will be in touch to assist you.\n\n` +
        `Browse our premium certified inventory anytime:\n` +
        `🌐 www.autobourncars.com\n\n` +
        `📞 +91 91767 77222\n\n` +
        `Best regards,\n` +
        `*AUTOBOURN Cars* — Velachery, Chennai`
    } else {
      classifiedType = 'sell_car_greeting'
      const carDetails = interestedCar || 'your vehicle'
      messageBody = `Hello *${customerName}*,\n\n` +
        `Thank you for choosing *AUTOBOURN Cars* to sell your luxury vehicle! 🚗✨\n\n` +
        `We have received your listing details for *${carDetails}*. Our certified expert will contact you within 24 hours to schedule a free inspection and provide you with the best valuation.\n\n` +
        `📋 What happens next:\n` +
        `  1. Our team reviews your submission\n` +
        `  2. We schedule a convenient inspection\n` +
        `  3. You receive a competitive offer\n\n` +
        `🌐 www.autobourncars.com\n` +
        `📞 +91 91767 77222\n\n` +
        `Best regards,\n` +
        `*AUTOBOURN Cars* — Velachery, Chennai`
    }

    // Override message body if a custom messageBody is sent in the payload
    let isCustomMessage = false
    if (payload.messageBody && payload.messageBody.trim()) {
      messageBody = payload.messageBody.trim()
      isCustomMessage = true
    }

    const messageType = isCustomMessage ? 'custom' : classifiedType

    // 2. Resolve Twilio Environment Variables based on lead classification
    let accountSid = ''
    let authToken = ''
    let fromWhatsApp = ''

    if (classifiedType === 'contact_greeting') {
      accountSid = Deno.env.get('TWILIO_ACCOUNT_SID_CONTACT') || Deno.env.get('TWILIO_ACCOUNT_SID')
      authToken = Deno.env.get('TWILIO_AUTH_TOKEN_CONTACT') || Deno.env.get('TWILIO_AUTH_TOKEN')
      fromWhatsApp = Deno.env.get('TWILIO_WHATSAPP_FROM_CONTACT') || Deno.env.get('TWILIO_WHATSAPP_FROM')
    } else if (classifiedType === 'crm_welcome') {
      accountSid = Deno.env.get('TWILIO_ACCOUNT_SID_CRM') || Deno.env.get('TWILIO_ACCOUNT_SID')
      authToken = Deno.env.get('TWILIO_AUTH_TOKEN_CRM') || Deno.env.get('TWILIO_AUTH_TOKEN')
      fromWhatsApp = Deno.env.get('TWILIO_WHATSAPP_FROM_CRM') || Deno.env.get('TWILIO_WHATSAPP_FROM')
    } else { // sell_car_greeting
      accountSid = Deno.env.get('TWILIO_ACCOUNT_SID_SELL_CAR') || Deno.env.get('TWILIO_ACCOUNT_SID')
      authToken = Deno.env.get('TWILIO_AUTH_TOKEN_SELL_CAR') || Deno.env.get('TWILIO_AUTH_TOKEN')
      fromWhatsApp = Deno.env.get('TWILIO_WHATSAPP_FROM_SELL_CAR') || Deno.env.get('TWILIO_WHATSAPP_FROM')
    }

    if (!accountSid || !authToken || !fromWhatsApp) {
      const missingSecrets = []
      if (!accountSid) missingSecrets.push('TWILIO_ACCOUNT_SID')
      if (!authToken) missingSecrets.push('TWILIO_AUTH_TOKEN')
      if (!fromWhatsApp) missingSecrets.push('TWILIO_WHATSAPP_FROM')
      
      const errorMsg = `Missing Twilio credentials in Deno secrets for ${classifiedType} leads: ${missingSecrets.join(', ')}.`
      console.error('[WHATSAPP]', errorMsg)
      
      // Log failure in whatsapp_message_logs
      await supabase.from('whatsapp_message_logs').insert({
        lead_id: leadId,
        phone: customerPhone,
        message_type: messageType,
        message_body: messageBody,
        status: 'failed',
        error_message: errorMsg
      })

      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format "From" number
    let cleanFrom = fromWhatsApp.trim()
    if (cleanFrom.startsWith('whatsapp:')) {
      cleanFrom = cleanFrom.replace('whatsapp:', '').trim()
    }
    if (!cleanFrom.startsWith('+')) {
      cleanFrom = `+${cleanFrom}`
    }
    fromWhatsApp = `whatsapp:${cleanFrom}`

    // Format "To" number
    let cleanTo = customerPhone.trim()
    if (cleanTo.startsWith('whatsapp:')) {
      cleanTo = cleanTo.replace('whatsapp:', '').trim()
    }
    if (!cleanTo.startsWith('+')) {
      // Default to +91 (India) if no country code is provided
      cleanTo = `+91${cleanTo}`
    }
    const toWhatsApp = `whatsapp:${cleanTo}`

    console.log(`[WHATSAPP] Selected template [${messageType}] for lead [${leadId}]`)

    // Prepare Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('From', fromWhatsApp)
    formData.append('To', toWhatsApp)
    formData.append('Body', messageBody)

    const basicAuth = btoa(`${accountSid}:${authToken}`)

    // Post to Twilio API
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: formData.toString()
    })

    const result = response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text()

    if (!response.ok) {
      console.error('[WHATSAPP] Twilio API returned error:', result)
      
      // Log failure to whatsapp_message_logs
      await supabase.from('whatsapp_message_logs').insert({
        lead_id: leadId,
        phone: cleanTo,
        message_type: messageType,
        message_body: messageBody,
        status: 'failed',
        error_message: typeof result === 'object' ? JSON.stringify(result) : result
      })

      return new Response(
        JSON.stringify({ error: 'Twilio API returned error.', details: result }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[WHATSAPP] Twilio message sent successfully! SID: ${result.sid}`)

    // Log success to whatsapp_message_logs
    await supabase.from('whatsapp_message_logs').insert({
      lead_id: leadId,
      phone: cleanTo,
      message_type: messageType,
      message_body: messageBody,
      twilio_message_sid: result.sid,
      status: 'sent'
    })

    // Update wa_greeting_sent = TRUE in leads table
    const { error: updateError } = await supabase
      .from('leads')
      .update({ wa_greeting_sent: true })
      .eq('id', leadId)

    if (updateError) {
      console.error('[WHATSAPP] Error updating wa_greeting_sent flag:', updateError)
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid, messageType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[WHATSAPP] Edge Function crash log:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
