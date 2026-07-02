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
      serviceClient.from('leads').select('*, assigned_employee:employees!assigned_to(name)').eq('id', id).maybeSingle(),
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

    // 3. Parse action and update fields from request body
    const body = await request.json();
    const { action, updateData, note, activityLog, inspectionData } = body;

    const serviceClient = await createServiceRoleClient();

    // 4. Build updates payload
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (action === 'claim') {
      updatePayload.assigned_to = emp.id;
    } else if (action === 'release') {
      updatePayload.assigned_to = null;
    }

    if (updateData) {
      if (updateData.lead_status) updatePayload.lead_status = updateData.lead_status;
      if (updateData.budget !== undefined) updatePayload.budget = updateData.budget;
      if (updateData.interested_car !== undefined) updatePayload.interested_car = updateData.interested_car;
      if (updateData.assigned_to) updatePayload.assigned_to = updateData.assigned_to;
    }

    // Perform database update
    const { error: updateErr } = await serviceClient
      .from('leads')
      .update(updatePayload)
      .eq('id', id);

    if (updateErr) throw updateErr;

    // Sync pending follow-ups with the new assignee
    if (updatePayload.assigned_to) {
      await serviceClient
        .from('follow_ups')
        .update({ employee_id: updatePayload.assigned_to })
        .eq('lead_id', id)
        .eq('status', 'pending');
    }

    // 5. Insert note if provided
    if (note) {
      const { error: noteErr } = await serviceClient
         .from('customer_notes')
         .insert({
           lead_id: id,
           employee_id: emp.id,
           note: note
         });
      if (noteErr) throw noteErr;
    }

    // 5b. Insert structured inspection details if provided
    if (inspectionData) {
      const dbInspection = {
        lead_id: id,
        employee_id: emp.id,
        
        overall_condition: (inspectionData.overallCondition || 'good').toLowerCase(),
        recommended_action: (inspectionData.recommendedAction || 'approve').toLowerCase(),
        estimated_value: inspectionData.estimatedValue ? parseFloat(String(inspectionData.estimatedValue).replace(/[^0-9.]/g, '')) : null,
        inspector_name: inspectionData.inspectorName || 'Employee',
        inspection_date: inspectionData.inspectionDate || new Date().toISOString().split('T')[0],

        reg_no: inspectionData.regNo || null,
        vin: inspectionData.vin || null,
        brand: inspectionData.brand || '',
        model: inspectionData.model || '',
        variant: inspectionData.variant || null,
        year: inspectionData.year ? parseInt(inspectionData.year) : null,
        fuel_type: inspectionData.fuelType || null,
        transmission_type: inspectionData.transmissionType || null,
        odometer: inspectionData.odometer ? parseInt(inspectionData.odometer) : null,
        owners: inspectionData.owners ? parseInt(inspectionData.owners) : null,

        paint_condition: inspectionData.paintCondition || null,
        rust_inspection: inspectionData.rustInspection || null,
        body_condition: inspectionData.bodyCondition || [],
        windshield_condition: inspectionData.windshieldCondition || null,
        lights_working: inspectionData.lightsWorking || [],
        tread_fl: inspectionData.treadFL ? parseInt(inspectionData.treadFL) : null,
        tread_fr: inspectionData.treadFR ? parseInt(inspectionData.treadFR) : null,
        tread_rl: inspectionData.treadRL ? parseInt(inspectionData.treadRL) : null,
        tread_rr: inspectionData.treadRR ? parseInt(inspectionData.treadRR) : null,
        spare_tyre: inspectionData.spareTyre || null,
        exterior_notes: inspectionData.exteriorNotes || null,

        odour: inspectionData.odour || null,
        seat_condition: inspectionData.seatCondition || null,
        seatbelt_check: inspectionData.seatbeltCheck || null,
        ac_working: inspectionData.acWorking || null,
        info_working: inspectionData.infoWorking || null,
        win_working: inspectionData.winWorking || null,
        lock_working: inspectionData.lockWorking || null,
        horn_working: inspectionData.hornWorking || null,
        warning_lights: inspectionData.warningLights || [],
        interior_remarks: inspectionData.interiorRemarks || null,

        engine_oil: inspectionData.engineOil || null,
        coolant: inspectionData.coolant || null,
        brake_fluid: inspectionData.brakeFluid || null,
        steering_fluid: inspectionData.steeringFluid || null,
        leakages: inspectionData.leakages || [],
        battery_age: inspectionData.batteryAge ? parseInt(inspectionData.batteryAge) : null,
        battery_terminal: inspectionData.batteryTerminal || null,
        transmission_response: inspectionData.transmissionResponse || null,
        bounce_test: inspectionData.bounceTest || null,
        frame_condition: inspectionData.frameCondition || null,
        alignment: inspectionData.alignment || null,
        suspension_noise: inspectionData.suspensionNoise || null,
        mechanical_comments: inspectionData.mechanicalComments || null,

        cold_start: inspectionData.coldStart || null,
        steering_performance: inspectionData.steeringPerformance || null,
        brake_performance: inspectionData.brakePerformance || null,
        acceleration: inspectionData.acceleration || null,
        test_drive_noises: inspectionData.testDriveNoises || [],
        test_drive_notes: inspectionData.testDriveNotes || null,
        docs_verified: inspectionData.docsVerified || [],
        vehicle_type: inspectionData.vehicleType || null,
        warranty_available: inspectionData.warrantyAvailable || null,

        uploads: inspectionData.uploads || {}
      };

      const { error: inspectErr } = await serviceClient
        .from('car_inspections')
        .insert(dbInspection);

      if (inspectErr) {
        console.error('Error inserting structured inspection:', inspectErr);
      }
    }

    // 6. Log activity
    if (activityLog) {
      await serviceClient.from('crm_activity_logs').insert({
        lead_id: id,
        employee_id: emp.id,
        action: activityLog.action,
        details: activityLog.details
      });
    } else if (action === 'claim') {
      await serviceClient.from('crm_activity_logs').insert({
        lead_id: id,
        employee_id: emp.id,
        action: 'claim_lead',
        details: `Claimed by ${emp.role === 'admin' ? 'Admin' : 'Employee'}`
      });
    } else if (action === 'release') {
      await serviceClient.from('crm_activity_logs').insert({
        lead_id: id,
        employee_id: emp.id,
        action: 'release_lead',
        details: `Released by ${emp.role === 'admin' ? 'Admin' : 'Employee'}`
      });
    }

    return NextResponse.json({ success: true, message: 'Lead updated successfully' });
  } catch (err: any) {
    console.error('Error in PATCH leads/[id] API:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
