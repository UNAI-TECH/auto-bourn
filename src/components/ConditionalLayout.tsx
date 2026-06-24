'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClientProviders from '@/components/ClientProviders';
import FloatingIcons from '@/components/FloatingIcons';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const isEmployee = pathname?.startsWith('/employee');
  const isLogin = pathname?.startsWith('/login');
  const isConsole = pathname?.startsWith('/console');
  const isAdmin = pathname?.startsWith('/admin');
  const isAdminArea = isDashboard || isEmployee || isLogin || isConsole || isAdmin;

  if (mounted && isAdminArea) {
    return <>{children}</>;
  }

  return (
    <ClientProviders>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: '80px' }}>
        {children}
      </main>
      <Footer />
      <FloatingIcons />
    </ClientProviders>
  );
}
