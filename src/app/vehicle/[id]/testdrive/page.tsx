'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function VehicleTestDriveRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/vehicle/${params.id}?testdrive=true`);
    } else {
      router.replace('/inventory');
    }
  }, [params, router]);

  return (
    <div className="container" style={{ textAlign: 'center', padding: '8rem 0' }}>
      <div className="shimmer" style={{ width: '200px', height: '24px', borderRadius: '8px', margin: '0 auto 1rem' }} />
      <div className="shimmer" style={{ width: '300px', height: '16px', borderRadius: '8px', margin: '0 auto' }} />
    </div>
  );
}
