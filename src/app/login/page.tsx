'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/console');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FAF8F6'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(225, 6, 19, 0.15)',
        borderTopColor: '#E10613',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
