import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, carId, carName } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and Phone Number are required.' }, { status: 400 });
    }

    const serviceClient = await createServiceRoleClient();

    // 1. Create a lead in the leads table
    const { data: lead, error: leadError } = await serviceClient
      .from('leads')
      .insert({
        customer_name: name,
        phone,
        email: email || null,
        source: 'website',
        interested_car: carName || 'Luxury Vehicle',
        lead_status: 'test_drive_scheduled',
      })
      .select()
      .single();

    if (leadError || !lead) {
      console.error('Error creating lead:', leadError);
      return NextResponse.json({ error: `Failed to register lead: ${leadError?.message}` }, { status: 500 });
    }

    // Fetch employee_id from cars if carId is provided
    let employeeId = null;
    if (carId) {
      const { data: carData } = await serviceClient
        .from('cars')
        .select('employee_id')
        .eq('id', carId)
        .single();
      if (carData) {
        employeeId = carData.employee_id;
      }
    }

    // 2. Create a test drive entry in test_drives table
    const { data: testDrive, error: tdError } = await serviceClient
      .from('test_drives')
      .insert({
        lead_id: lead.id,
        car_id: carId || null,
        car_name: carName || 'Luxury Vehicle',
        employee_id: employeeId,
        scheduled_at: new Date().toISOString(),
        status: 'scheduled',
        notes: 'Requested via website Book Test Drive form.',
      })
      .select()
      .single();

    if (tdError) {
      console.error('Error creating test drive:', tdError);
      // Clean up the lead if test drive creation fails
      await serviceClient.from('leads').delete().eq('id', lead.id);
      return NextResponse.json({ error: `Failed to schedule test drive: ${tdError.message}` }, { status: 500 });
    }

    // 3. Log activity in crm_activity_logs
    await serviceClient.from('crm_activity_logs').insert({
      lead_id: lead.id,
      action: 'status_change',
      details: 'Website visitor requested test drive. Status -> test_drive_scheduled',
    });

    // 4. Create an admin notification
    await serviceClient.from('notifications').insert({
      recipient_role: 'admin',
      type: 'new_test_drive_request',
      title: '🚗 Test Drive Requested',
      message: `${name} requested a test drive for the ${carName || 'Luxury Vehicle'}.`,
      metadata: { lead_id: lead.id, test_drive_id: testDrive.id, car_name: carName },
    });

    if (employeeId) {
      await serviceClient.from('notifications').insert({
        recipient_role: 'employee',
        recipient_employee_id: employeeId,
        type: 'new_test_drive_request',
        title: '🚗 Test Drive Requested',
        message: `${name} requested a test drive for your listed vehicle ${carName || 'Luxury Vehicle'}.`,
        metadata: { lead_id: lead.id, test_drive_id: testDrive.id, car_name: carName },
      });
    }

    return NextResponse.json({ success: true, lead, testDrive });
  } catch (err: any) {
    console.error('Unexpected error in test-drives POST API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 });
    }

    // Verify employee or admin status
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (empErr || !emp) {
      return NextResponse.json({ error: 'Forbidden — console access required' }, { status: 403 });
    }

    const serviceClient = await createServiceRoleClient();

    // Fetch all test drives joined with leads and employees
    let query = serviceClient
      .from('test_drives')
      .select('*, lead:leads(customer_name, phone, email, lead_status), employee:employees(name)');

    if (emp.role === 'employee') {
      query = query.eq('employee_id', emp.id);
    }

    const { data: testDrives, error: tdError } = await query.order('created_at', { ascending: false });

    if (tdError) {
      console.error('Error fetching test drives:', tdError);
      return NextResponse.json({ error: tdError.message }, { status: 500 });
    }

    return NextResponse.json({ testDrives });
  } catch (err: any) {
    console.error('Unexpected error in test-drives GET API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 });
    }

    // Verify employee or admin status
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (empErr || !emp) {
      return NextResponse.json({ error: 'Forbidden — console access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, notes, employeeId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Test drive ID is required.' }, { status: 400 });
    }

    const serviceClient = await createServiceRoleClient();

    // Prepare update object
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (employeeId !== undefined) updateData.employee_id = employeeId;

    const { data: updated, error: updateError } = await serviceClient
      .from('test_drives')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating test drive:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If status changed and there's a lead, we can update lead status optionally
    if (status === 'completed' && updated.lead_id) {
      await serviceClient
        .from('leads')
        .update({ lead_status: 'interested' })
        .eq('id', updated.lead_id);
    }

    return NextResponse.json({ success: true, testDrive: updated });
  } catch (err: any) {
    console.error('Unexpected error in test-drives PATCH API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
