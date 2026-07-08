import { Buffer } from 'buffer';

/**
 * Sends a WhatsApp auto-greeting to a customer using Twilio.
 * 
 * @param customerName Name of the customer
 * @param phoneNumber WhatsApp/phone number of the customer
 * @param interestedCar Name of the car they are interested in (optional)
 */
export async function sendWhatsAppGreeting(
  customerName: string,
  phoneNumber: string,
  interestedCar?: string | null
) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  let fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromWhatsApp) {
    console.warn('[TWILIO] Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_FROM in environment. Skipping WhatsApp auto-greeting.');
    return { success: false, error: 'Config missing' };
  }

  try {
    // 1. Format "From" number
    let cleanFrom = fromWhatsApp.trim();
    if (cleanFrom.startsWith('whatsapp:')) {
      cleanFrom = cleanFrom.replace('whatsapp:', '').trim();
    }
    if (!cleanFrom.startsWith('+')) {
      cleanFrom = `+${cleanFrom}`;
    }
    fromWhatsApp = `whatsapp:${cleanFrom}`;

    // 2. Format "To" number
    let cleanTo = phoneNumber.trim();
    if (cleanTo.startsWith('whatsapp:')) {
      cleanTo = cleanTo.replace('whatsapp:', '').trim();
    }
    if (!cleanTo.startsWith('+')) {
      // Default to +91 (India) country code if no code is provided
      cleanTo = `+91${cleanTo}`;
    }
    const toWhatsApp = `whatsapp:${cleanTo}`;

    // 3. Construct the premium greeting message
    const carDetails = interestedCar ? `inquiry regarding *${interestedCar}*` : 'inquiry';
    const messageBody = `Hello *${customerName}*,\n\n` +
      `Thank you for choosing *AUTOBOURN Cars*! 🚗✨\n\n` +
      `We have received your ${carDetails}. Our luxury car consultant will get in touch with you shortly to assist you.\n\n` +
      `In the meantime, feel free to browse our latest certified inventory at:\n` +
      `🌐 www.autobourncars.com\n\n` +
      `Best regards,\n` +
      `*AUTOBOURN Cars*\n` +
      `Velachery, Chennai\n` +
      `📞 +91 91767 77222`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const formData = new URLSearchParams();
    formData.append('From', fromWhatsApp);
    formData.append('To', toWhatsApp);
    formData.append('Body', messageBody);

    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: formData.toString()
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[TWILIO] API error response:', result);
      return { success: false, error: result.message || 'Twilio API error' };
    }

    console.log(`[TWILIO] WhatsApp greeting sent successfully to ${toWhatsApp}! SID: ${result.sid}`);
    return { success: true, messageSid: result.sid };
  } catch (error: any) {
    console.error('[TWILIO] Failed to send WhatsApp greeting:', error);
    return { success: false, error: error.message };
  }
}
