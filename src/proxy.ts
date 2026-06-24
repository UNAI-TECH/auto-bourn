import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/employee/:path*',
    '/login',
    '/admin',
    '/console',
  ],
};
