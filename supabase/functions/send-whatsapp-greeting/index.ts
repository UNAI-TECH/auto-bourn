import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    
    // Support both direct payloads and Supabase Database Webhook trigger payloads
    const record = payload.record || payload

    const customerName = record.customer_name || record.name
    const customerPhone = record.whatsapp || record.phone
    const interestedCar = record.interested_car

    if (!customerName || !customerPhone) {
      return new Response(
        JSON.stringify({ error: 'Customer name and phone number are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Retrieve Twilio Environment Variables from Deno secrets
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    let fromWhatsApp = Deno.env.get('TWILIO_WHATSAPP_FROM')

    if (!accountSid || !authToken || !fromWhatsApp) {
      const errorMsg = 'Missing Twilio credentials in Deno secrets.'
      console.error(errorMsg)
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

    // Construct the WhatsApp Message body
    const carDetails = interestedCar ? `inquiry regarding *${interestedCar}*` : 'inquiry'
    const messageBody = `Hello *${customerName}*,\n\n` +
      `Thank you for choosing *AUTOBOURN Cars*! 🚗✨\n\n` +
      `We have received your ${carDetails}. Our luxury car consultant will get in touch with you shortly to assist you.\n\n` +
      `In the meantime, feel free to browse our latest certified inventory at:\n` +
      `🌐 www.autobourncars.com\n\n` +
      `Best regards,\n` +
      `*AUTOBOURN Cars*\n` +
      `Velachery, Chennai\n` +
      `📞 +91 91767 77222`

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
      console.error('Twilio API returned HTTP error:', result)
      return new Response(
        JSON.stringify({ error: 'Twilio API returned error.', details: result }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Edge Function crash log:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
