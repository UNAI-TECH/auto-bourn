'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdinRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="db-loader">
      <div className="db-spinner" />
    </div>
  );
}
