import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // 3. Fetch lead details using service role client to bypass client RLS for unassigned leads
    const serviceClient = await createServiceRoleClient();
    const [{ data: lead, error: leadError }, { data: followUps }, { data: notes }] = await Promise.all([
      serviceClient.from('leads').select('*').eq('id', id).maybeSingle(),
      serviceClient.from('follow_ups').select('*, employee:employees!employee_id(name)').eq('lead_id', id).order('scheduled_at', { ascending: false }),
      serviceClient.from('customer_notes').select('*, employee:employees!employee_id(name)').eq('lead_id', id).order('created_at', { ascending: false }),
    ]);

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead, followUps, notes });
  } catch (err: any) {
    console.error('Error in leads/[id] API:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // 3. Parse action from request body
    const body = await request.json();
    const { action } = body;

    if (action !== 'claim') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const serviceClient = await createServiceRoleClient();

    // 4. Update assigned_to to employee's ID
    const { error: claimErr } = await serviceClient
      .from('leads')
      .update({ assigned_to: emp.id, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (claimErr) throw claimErr;

    // 5. Log activity
    await serviceClient.from('crm_activity_logs').insert({
      lead_id: id,
      employee_id: emp.id,
      action: 'claim_lead',
      details: `Claimed by ${emp.role === 'admin' ? 'Admin' : 'Employee'}`
    });

    return NextResponse.json({ success: true, message: 'Lead claimed successfully' });
  } catch (err: any) {
    console.error('Error claiming lead:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
