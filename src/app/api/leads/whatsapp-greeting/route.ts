import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendWhatsAppGreeting } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user is authenticated to call this backend route
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request payload
    const body = await request.json();
    const { customer_name, phone, interested_car } = body;

    if (!customer_name || !phone) {
      return NextResponse.json({ error: 'Missing customer_name or phone' }, { status: 400 });
    }

    // 3. Send the WhatsApp greeting using Twilio
    const twilioResult = await sendWhatsAppGreeting(customer_name, phone, interested_car);

    if (!twilioResult.success) {
      return NextResponse.json({ error: twilioResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageSid: twilioResult.messageSid });
  } catch (err: any) {
    console.error('Unexpected error in whatsapp-greeting API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
