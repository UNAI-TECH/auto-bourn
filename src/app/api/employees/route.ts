import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the caller is an authenticated admin
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized — please log in as admin' }, { status: 401 });
    }

    const { data: admin, error: adminCheckErr } = await supabase
      .from('employees')
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single();

    if (adminCheckErr || admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    // 2. Parse body
    const body = await request.json();
    const { name, email, phone, password, employee_id, avatar_url } = body;

    if (!name || !email || !password || !employee_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password, employee_id' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // 3. Check if the service role key is configured
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey.trim() === '') {
      return NextResponse.json(
        {
          error:
            'SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local. ' +
            'Go to your Supabase project → Settings → API → Service Role key, ' +
            'copy it, and add it to your .env.local file, then restart the dev server.',
        },
        { status: 500 }
      );
    }

    // 4. Check for duplicate employee_id or email
    const serviceClient = await createServiceRoleClient();

    const { data: existing } = await serviceClient
      .from('employees')
      .select('id, employee_id, email')
      .or(`employee_id.eq.${employee_id},email.eq.${email}`)
      .maybeSingle();

    if (existing) {
      if (existing.email === email) {
        return NextResponse.json({ error: `Email "${email}" is already registered` }, { status: 400 });
      }
      if (existing.employee_id === employee_id) {
        return NextResponse.json({ error: `Employee ID "${employee_id}" is already taken` }, { status: 400 });
      }
    }

    // 5. Create Supabase auth user (service role required)
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email verification
    });

    if (authError) {
      // Handle common Supabase auth errors with friendly messages
      let msg = authError.message;
      if (msg.includes('already been registered') || msg.includes('already exists')) {
        msg = `An account with email "${email}" already exists in Supabase Auth.`;
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (!authData?.user) {
      return NextResponse.json({ error: 'Failed to create auth user — no user returned' }, { status: 500 });
    }

    // 6. Insert employee record
    const { data: empData, error: empError } = await serviceClient
      .from('employees')
      .insert({
        employee_id,
        name,
        email,
        phone: phone || null,
        avatar_url: avatar_url || null,
        role: 'employee',
        status: 'active',
        auth_user_id: authData.user.id,
      })
      .select()
      .single();

    if (empError) {
      // Rollback: delete the auth user we just created
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: `DB insert failed: ${empError.message}` }, { status: 400 });
    }

    // 7. Log the admin activity
    await serviceClient.from('activity_logs').insert({
      employee_id: admin.id,
      action: 'employee_added',
      details: `Admin added employee ${name} (ID: ${employee_id}, Email: ${email})`,
    });

    return NextResponse.json({
      success: true,
      employee: empData,
      credentials: {
        employee_id,
        email,
        password, // returned so admin can share with employee
      },
    });
  } catch (err: unknown) {
    console.error('[POST /api/employees] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 1. Verify the caller is an authenticated admin
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized — please log in as admin' }, { status: 401 });
    }

    const { data: admin, error: adminCheckErr } = await supabase
      .from('employees')
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single();

    if (adminCheckErr || admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    // 2. Parse body
    const body = await request.json();
    const { id, password } = body;

    if (!id || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: id, password' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // 3. Check for service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey.trim() === '') {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local' },
        { status: 500 }
      );
    }

    const serviceClient = await createServiceRoleClient();

    // 4. Find the employee to get auth_user_id
    const { data: emp, error: findError } = await serviceClient
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (!emp.auth_user_id) {
      return NextResponse.json({ error: 'Employee has no associated auth user' }, { status: 400 });
    }

    // 5. Update user password in Supabase auth (requires service role client)
    const { error: authUpdateError } = await serviceClient.auth.admin.updateUserById(
      emp.auth_user_id,
      { password }
    );

    if (authUpdateError) {
      return NextResponse.json({ error: `Auth update failed: ${authUpdateError.message}` }, { status: 400 });
    }

    // 6. Log the admin activity
    await serviceClient.from('activity_logs').insert({
      employee_id: admin.id,
      action: 'employee_password_reset',
      details: `Admin reset password for employee ${emp.name} (ID: ${emp.employee_id})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err: unknown) {
    console.error('[PUT /api/employees] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 });
    }

    const body = await request.json();
    const { avatar_url } = body;

    if (!avatar_url) {
      return NextResponse.json({ error: 'Missing avatar_url' }, { status: 400 });
    }

    const serviceClient = await createServiceRoleClient();
    const { data, error } = await serviceClient
      .from('employees')
      .update({ avatar_url })
      .eq('auth_user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Failed to update avatar: ${error.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, employee: data });
  } catch (err: unknown) {
    console.error('[PATCH /api/employees] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify the caller is an authenticated admin
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized — please log in as admin' }, { status: 401 });
    }

    const { data: admin, error: adminCheckErr } = await supabase
      .from('employees')
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single();

    if (adminCheckErr || admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    // 2. Get employee ID from query params
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');

    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employee id parameter' }, { status: 400 });
    }

    const serviceClient = await createServiceRoleClient();

    // 3. Find the employee to get their auth_user_id
    const { data: emp, error: findError } = await serviceClient
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (findError || !emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // 4. Delete the Supabase Auth user (this cascades to delete the employees row due to ON DELETE CASCADE)
    if (emp.auth_user_id) {
      const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(emp.auth_user_id);
      if (authDeleteError) {
        console.error('Failed to delete auth user:', authDeleteError.message);
        // Even if auth delete fails, still try to delete the DB record
      }
    }

    // 5. Delete the employee record (in case auth cascade didn't handle it)
    const { error: dbDeleteError } = await serviceClient
      .from('employees')
      .delete()
      .eq('id', employeeId);

    if (dbDeleteError) {
      // The row may already be deleted by cascade — that's okay
      console.log('DB delete note:', dbDeleteError.message);
    }

    // 6. Log the admin activity
    await serviceClient.from('activity_logs').insert({
      employee_id: admin.id,
      action: 'employee_deleted',
      details: `Admin deleted employee ${emp.name} (ID: ${emp.employee_id}, Email: ${emp.email})`,
    });

    return NextResponse.json({
      success: true,
      message: `Employee ${emp.name} has been permanently deleted from the system`,
    });
  } catch (err: unknown) {
    console.error('[DELETE /api/employees] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
