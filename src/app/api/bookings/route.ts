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
        lead_status: 'booking_done',
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

    // 2. Create a booking entry in the bookings table
    const { data: booking, error: bkError } = await serviceClient
      .from('bookings')
      .insert({
        lead_id: lead.id,
        car_id: carId || null,
        car_name: carName || 'Luxury Vehicle',
        employee_id: employeeId,
        payment_status: 'pending',
        delivery_status: 'pending',
        notes: 'Requested reservation via website Reserve Vehicle form.',
      })
      .select()
      .single();

    if (bkError) {
      console.error('Error creating booking:', bkError);
      // Clean up the lead if booking creation fails
      await serviceClient.from('leads').delete().eq('id', lead.id);
      return NextResponse.json({ error: `Failed to create booking: ${bkError.message}` }, { status: 500 });
    }

    // 3. Log activity in crm_activity_logs
    await serviceClient.from('crm_activity_logs').insert({
      lead_id: lead.id,
      action: 'status_change',
      details: 'Website visitor requested vehicle reservation. Status -> booking_done',
    });

    // 4. Create an admin notification
    await serviceClient.from('notifications').insert({
      recipient_role: 'admin',
      type: 'new_booking_request',
      title: '🔑 Vehicle Reservation Requested',
      message: `${name} requested to reserve the ${carName || 'Luxury Vehicle'}.`,
      metadata: { lead_id: lead.id, booking_id: booking.id, car_name: carName },
    });

    return NextResponse.json({ success: true, lead, booking });
  } catch (err: any) {
    console.error('Unexpected error in bookings POST API:', err);
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

    // Fetch all bookings joined with leads and employees
    let query = serviceClient
      .from('bookings')
      .select('*, lead:leads(customer_name, phone, email, lead_status), employee:employees(name)');

    if (emp.role === 'employee') {
      query = query.eq('employee_id', emp.id);
    }

    const { data: bookings, error: bkError } = await query.order('created_at', { ascending: false });

    if (bkError) {
      console.error('Error fetching bookings:', bkError);
      return NextResponse.json({ error: bkError.message }, { status: 500 });
    }

    return NextResponse.json({ bookings });
  } catch (err: any) {
    console.error('Unexpected error in bookings GET API:', err);
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
    const { id, deliveryStatus, paymentStatus, employeeId, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    const serviceClient = await createServiceRoleClient();

    // Get the current booking first to know the car_id and lead_id
    const { data: booking, error: getErr } = await serviceClient
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (getErr || !booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Prepare update object
    const updateData: any = {};
    if (deliveryStatus !== undefined) updateData.delivery_status = deliveryStatus;
    if (paymentStatus !== undefined) updateData.payment_status = paymentStatus;
    if (employeeId !== undefined) updateData.employee_id = employeeId;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updated, error: updateError } = await serviceClient
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Perform car status changes based on deliveryStatus transition
    if (booking.car_id) {
      if (deliveryStatus === 'processing') {
        // Acceptance of reservation -> mark car as reserved (Booked)
        await serviceClient.from('cars').update({ status: 'reserved' }).eq('id', booking.car_id);
      } else if (deliveryStatus === 'cancelled') {
        // Cancellation of reservation -> mark car as available again
        await serviceClient.from('cars').update({ status: 'available' }).eq('id', booking.car_id);
      } else if (deliveryStatus === 'completed') {
        // Final completion/delivery -> mark car as sold
        await serviceClient.from('cars').update({ status: 'sold' }).eq('id', booking.car_id);
        // Also update corresponding lead status to 'sold' if it exists
        if (booking.lead_id) {
          await serviceClient.from('leads').update({ lead_status: 'sold' }).eq('id', booking.lead_id);
        }
      }
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    console.error('Unexpected error in bookings PATCH API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
