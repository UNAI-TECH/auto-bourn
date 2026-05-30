import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const isProtectedDashboard = pathname.startsWith('/dashboard');
  const isProtectedEmployee  = pathname.startsWith('/employee');

  // ── 1. Unauthenticated user hitting protected routes ───────────────────────
  if (!user) {
    if (isProtectedDashboard || isProtectedEmployee) {
      const url = request.nextUrl.clone();
      url.pathname = '/console';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ── 2. Authenticated user — fetch role once ────────────────────────────────
  const { data: employee } = await supabase
    .from('employees')
    .select('role, status')
    .eq('auth_user_id', user.id)
    .single();

  // Suspended / inactive accounts — force logout and back to console
  if (employee?.status === 'suspended' || employee?.status === 'inactive') {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/console';
    return NextResponse.redirect(url);
  }

  // ── 3. Any authenticated user visiting /admin → redirect to right place ─────
  if (pathname === '/admin' || pathname === '/console') {
    const url = request.nextUrl.clone();
    url.pathname = employee?.role === 'admin' ? '/dashboard' : '/employee';
    return NextResponse.redirect(url);
  }

  // ── 4. Logged-in employee visiting /console → go to employee panel ──────────
  if (pathname === '/console' && employee?.role === 'employee') {
    const url = request.nextUrl.clone();
    url.pathname = '/employee';
    return NextResponse.redirect(url);
  }

  // ── 5. Logged-in user visiting old /login route ──────────────────────────────
  if (pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = employee?.role === 'admin' ? '/dashboard' : '/employee';
    return NextResponse.redirect(url);
  }

  // ── 6. Role enforcement on protected routes ──────────────────────────────────
  // Non-admin trying to access /dashboard
  if (isProtectedDashboard && employee?.role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/employee';
    return NextResponse.redirect(url);
  }

  // Non-employee (i.e. admin) trying to access /employee — allow it
  // (admin may want to preview the employee panel)

  return supabaseResponse;
}
