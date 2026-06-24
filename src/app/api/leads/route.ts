import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, phone, email, whatsapp, city, state, source, interested_car, preferred_brand, budget, lead_status, notes } = body;

    if (!customer_name || !phone) {
      return NextResponse.json({ error: 'Name and Phone Number are required.' }, { status: 400 });
    }

    const serviceClient = await createServiceRoleClient();

    const { data: lead, error: leadError } = await serviceClient
      .from('leads')
      .insert({
        customer_name,
        phone,
        email: email || null,
        whatsapp: whatsapp || null,
        city: city || null,
        state: state || null,
        source: source || 'website',
        interested_car: interested_car || null,
        preferred_brand: preferred_brand || null,
        budget: budget ? parseInt(String(budget).replace(/[^0-9]/g, '')) : null,
        lead_status: lead_status || 'new',
      })
      .select()
      .single();

    if (leadError || !lead) {
      console.error('Error creating lead in database:', leadError);
      return NextResponse.json({ error: `Failed to register lead: ${leadError?.message}` }, { status: 500 });
    }

    // Insert notes into customer_notes linked to the lead
    if (notes) {
      const { data: adminEmp } = await serviceClient
        .from('employees')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      let empId = adminEmp?.id;
      if (!empId) {
        const { data: fallbackEmp } = await serviceClient
          .from('employees')
          .select('id')
          .limit(1)
          .maybeSingle();
        empId = fallbackEmp?.id;
      }

      if (empId) {
        await serviceClient
          .from('customer_notes')
          .insert({
            lead_id: lead.id,
            employee_id: empId,
            note: notes,
          });
      }
    }

    const isContactUs = interested_car && interested_car.startsWith('Get In Touch');

    // Create an admin/employee notification
    await serviceClient.from('notifications').insert({
      recipient_role: 'admin',
      type: isContactUs ? 'new_contact_message' : 'new_lead',
      title: isContactUs ? '✉️ New Contact Message' : '📞 New Lead Received',
      message: isContactUs 
        ? `${customer_name} sent a message via Get In Touch.` 
        : `${customer_name} submitted a listing via Sell Your Car.`,
      metadata: { lead_id: lead.id, type: isContactUs ? 'contact_us' : 'sell_car' },
    });

    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    console.error('Unexpected error in leads API POST:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
