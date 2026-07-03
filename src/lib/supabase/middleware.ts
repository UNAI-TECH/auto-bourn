import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Helper to redirect while preserving any updated or cleared cookies in supabaseResponse
  const redirect = (toPath: string) => {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = toPath;
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      });
    });
    
    return redirectResponse;
  };

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // If there is an auth error (e.g. invalid refresh token), sign out to clear cookies
      await supabase.auth.signOut();
    } else {
      user = data?.user;
    }
  } catch (err) {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
  }

  const pathname = request.nextUrl.pathname;

  const isProtectedDashboard = pathname.startsWith('/dashboard');
  const isProtectedEmployee  = pathname.startsWith('/employee');

  // ── 1. Unauthenticated user hitting protected routes ───────────────────────
  if (!user) {
    if (isProtectedDashboard || isProtectedEmployee) {
      return redirect('/console');
    }
    return supabaseResponse;
  }

  // ── 2. Authenticated user — fetch role once ────────────────────────────────
  const { data: employee } = await supabase
    .from('employees')
    .select('role, status')
    .eq('auth_user_id', user.id)
    .single();

  // Suspended, inactive, or non-existent employee accounts — force logout and back to console
  if (!employee || employee.status === 'suspended' || employee.status === 'inactive') {
    await supabase.auth.signOut();
    return redirect('/console');
  }

  // ── 3. Any authenticated user visiting /admin or /console → redirect to right place
  if (pathname === '/admin' || pathname === '/console') {
    return redirect(employee?.role === 'admin' ? '/dashboard' : '/employee');
  }

  // ── 4. Logged-in employee visiting /console → go to employee panel
  if (pathname === '/console' && employee?.role === 'employee') {
    return redirect('/employee');
  }

  // ── 5. Logged-in user visiting old /login route ──────────────────────────────
  if (pathname === '/login') {
    return redirect(employee?.role === 'admin' ? '/dashboard' : '/employee');
  }

  // ── 6. Role enforcement on protected routes ──────────────────────────────────
  // Non-admin trying to access /dashboard
  if (isProtectedDashboard && employee?.role !== 'admin') {
    return redirect('/employee');
  }

  // Non-employee (i.e. admin) trying to access /employee — allow it
  // (admin may want to preview the employee panel)

  return supabaseResponse;
}
