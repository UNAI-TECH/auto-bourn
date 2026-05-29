import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // If it's already an email (contains @), return it directly
    if (username.includes('@')) {
      return NextResponse.json({ email: username.trim() });
    }

    // Otherwise, treat as employee_id and resolve the email
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from('employees')
      .select('email')
      .eq('employee_id', username.trim().toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Employee ID not found' }, { status: 404 });
    }

    return NextResponse.json({ email: data.email });
  } catch (err) {
    console.error('Resolution error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
