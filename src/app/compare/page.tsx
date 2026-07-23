'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { vehicles, formatPrice, formatMileage } from '@/data/vehicles';

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') || [];
  const compareVehicles = ids.map(id => vehicles.find(v => v.id === id)).filter(Boolean);

  if (compareVehicles.length < 2) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '8rem 0' }}>
        <h1 className="headline-section">Compare Vehicles</h1>
        <p style={{ color: '#8A8A8A', margin: '1rem 0 2rem' }}>
          Select at least 2 vehicles from the inventory to compare.
        </p>
        <Link href="/inventory" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Browse Collection
        </Link>
      </div>
    );
  }

  const specRows = [
    { label: 'Year', key: 'year' },
    { label: 'Body Type', key: 'bodyType' },
    { label: 'Engine', key: 'engine' },
    { label: 'Horsepower', key: 'horsepower', suffix: ' HP' },
    { label: 'Torque', key: 'torque' },
    { label: '0-100 km/h', key: 'acceleration' },
    { label: 'Top Speed', key: 'topSpeed', suffix: ' km/h' },
    { label: 'Fuel Type', key: 'fuelType' },
    { label: 'Transmission', key: 'transmission' },
    { label: 'Drivetrain', key: 'drivetrain' },
    { label: 'KM Driven', key: 'mileage', format: 'mileage' },
    { label: 'Seats', key: 'seatingCapacity' },
    { label: 'Color', key: 'color' },
    { label: 'Interior', key: 'interiorColor' },
    { label: 'Ownership', key: 'ownership' },
    { label: 'Registration', key: 'registration' },
  ];

  return (
    <>
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: '#FFFFFF' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 5vw, 4rem)' }}>
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Side by Side</p>
            <h1 className="headline-section">Compare Vehicles</h1>
          </motion.div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              minWidth: compareVehicles.length * 280 + 200,
            }}>
              <thead>
                <tr>
                  <th style={{ width: '200px', padding: '1rem', textAlign: 'left' }}></th>
                  {compareVehicles.map(v => v && (
                    <th key={v.id} style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'bottom' }}>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{
                          width: '100%', aspectRatio: '16/10', borderRadius: '16px',
                          overflow: 'hidden', position: 'relative', marginBottom: '1rem',
                          border: '1px solid #ECECEC', background: '#F5F5F5',
                        }}>
                          <Image
                            src={v.images[0]}
                            alt={`${v.brand} ${v.model}`}
                            fill
                            style={{ objectFit: 'contain' }}
                            sizes="300px"
                          />
                        </div>
                        <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E10613', fontWeight: 600 }}>{v.brand}</p>
                        <p style={{ fontFamily: 'var(--font-primary)', fontSize: '1.25rem', fontWeight: 700, color: '#2A2A2A', margin: '0.25rem 0' }}>
                          {v.model}
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: '#8A8A8A', marginBottom: '0.5rem' }}>{v.variant}</p>
                        <p style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 700, color: '#2A2A2A' }}>
                          {formatPrice(v.price)}
                        </p>
                        {v.originalPrice && (
                          <p style={{ fontSize: '0.75rem', color: '#B0B0B0', textDecoration: 'line-through' }}>
                            {formatPrice(v.originalPrice)}
                          </p>
                        )}
                      </motion.div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specRows.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? '#FAFAFA' : '#FFFFFF' }}>
                    <td style={{
                      padding: '0.875rem 1rem', fontSize: '0.8125rem', fontWeight: 600,
                      color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid #F0F0F0',
                    }}>
                      {row.label}
                    </td>
                    {compareVehicles.map(v => {
                      if (!v) return null;
                      const val = v[row.key as keyof typeof v];
                      let display: string;
                      if (row.format === 'mileage') {
                        display = formatMileage(val as number);
                      } else {
                        display = `${val}${row.suffix || ''}`;
                      }
                      return (
                        <td key={v.id} style={{
                          padding: '0.875rem 1rem', textAlign: 'center',
                          fontSize: '0.9375rem', fontWeight: 500, color: '#2A2A2A',
                          borderBottom: '1px solid #F0F0F0',
                        }}>
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Features row */}
                <tr style={{ background: '#FAFAFA' }}>
                  <td style={{
                    padding: '0.875rem 1rem', fontSize: '0.8125rem', fontWeight: 600,
                    color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid #F0F0F0', verticalAlign: 'top',
                  }}>
                    Key Features
                  </td>
                  {compareVehicles.map(v => v && (
                    <td key={v.id} style={{
                      padding: '0.875rem 1rem', textAlign: 'left',
                      borderBottom: '1px solid #F0F0F0', verticalAlign: 'top',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {v.features.slice(0, 6).map(f => (
                          <span key={f} style={{ fontSize: '0.8125rem', color: '#4A4A4A' }}>
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                {/* CTA row */}
                <tr>
                  <td style={{ padding: '1.5rem 1rem' }}></td>
                  {compareVehicles.map(v => v && (
                    <td key={v.id} style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                      <Link
                        href={`/vehicle/${v.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        View Details
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ textAlign: 'center', padding: '8rem 0' }}>
        <p style={{ color: '#8A8A8A' }}>Loading comparison...</p>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
