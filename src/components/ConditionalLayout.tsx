'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClientProviders from '@/components/ClientProviders';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const isEmployee = pathname?.startsWith('/employee');
  const isLogin = pathname?.startsWith('/login');
  const isAdminArea = isDashboard || isEmployee || isLogin;

  if (isAdminArea) {
    return <>{children}</>;
  }

  return (
    <ClientProviders>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: '80px' }}>
        {children}
      </main>
      <Footer />
    </ClientProviders>
  );
}
