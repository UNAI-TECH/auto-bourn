'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// /admin now redirects to the unified /console login page
export default function AdminRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/console'); }, [router]);
  return null;
}
