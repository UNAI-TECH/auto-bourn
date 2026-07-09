import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify caller is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify caller is an active employee or admin
    const { data: emp, error: empCheckErr } = await supabase
      .from('employees')
      .select('role, id, status')
      .eq('auth_user_id', user.id)
      .single();

    if (empCheckErr || !emp || emp.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Parse request payload
    const body = await request.json();
    const { leadId, force, messageBody } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required.' }, { status: 400 });
    }

    // 4. Trigger the Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njvgqybtgakgevnxmetf.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      console.error('[API] SUPABASE_SERVICE_ROLE_KEY is missing in server environment.');
      return NextResponse.json({ error: 'Service config error.' }, { status: 500 });
    }

    console.log(`[API] Proxying WhatsApp request to edge function for lead ${leadId} (force: ${force})`);
    
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-whatsapp-greeting`;
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ leadId, force, messageBody })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[API] Edge function call failed:', result);
      return NextResponse.json(
        { error: result.error || 'Failed to send WhatsApp greeting.', details: result.details },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, ...result });

  } catch (err: any) {
    console.error('[API] Unexpected error in whatsapp-greeting API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
