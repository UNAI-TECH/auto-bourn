'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, formatPrice, formatMileage } from '@/data/vehicles';
import { fetchDbVehicles } from '@/lib/supabase/vehicles';

export default function TestDrivePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Check if there is a carId in search params
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const carId = params.get('carId');
          if (carId) {
            router.replace(`/vehicle/${carId}?testdrive=true`);
            return;
          }
        }

        const data = await fetchDbVehicles();
        setVehicles(data);

        // Check sessionStorage fallback
        let targetCarId: string | null = null;
        if (typeof window !== 'undefined') {
          targetCarId = sessionStorage.getItem('bookingCarId');
        }

        if (targetCarId && data.length > 0) {
          const matched = data.find(v => v.id === targetCarId);
          if (matched) {
            setSelectedVehicle(matched);
          }
        } else if (data.length > 0) {
          // Default to the first vehicle if none selected
          setSelectedVehicle(data[0]);
        }
      } catch (err) {
        console.error('Failed to load vehicles for test drive booking:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) {
      setBookingError('Please select a vehicle for your test drive.');
      return;
    }
    if (!bookingName || !bookingPhone || !bookingEmail) {
      setBookingError('Name, Phone Number, and Email ID are required.');
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await fetch('/api/test-drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookingName,
          phone: bookingPhone,
          email: bookingEmail,
          carId: selectedVehicle.id,
          carName: `${selectedVehicle.brand} ${selectedVehicle.model}`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking request.');
      }
      setBookingSuccess(true);
      setBookingName('');
      setBookingPhone('');
      setBookingEmail('');
      
      // Clear session storage selected vehicle
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('bookingCarId');
      }
    } catch (err: any) {
      setBookingError(err.message || 'An error occurred. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1.125rem',
    border: '1px solid #ECECEC',
    borderRadius: '12px',
    background: '#FAFAFA',
    fontSize: '0.9375rem',
    color: '#2A2A2A',
    outline: 'none',
    transition: 'all 0.3s',
    boxSizing: 'border-box',
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '8rem 0' }}>
        <div className="shimmer" style={{ width: '200px', height: '24px', borderRadius: '8px', margin: '0 auto 1rem' }} />
        <div className="shimmer" style={{ width: '300px', height: '16px', borderRadius: '8px', margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="container" style={{ padding: '1.5rem clamp(1.5rem, 4vw, 3rem)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: '#B0B0B0' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#B0B0B0', transition: 'color 0.3s' }}>Home</Link><span>/</span>
          {selectedVehicle && (
            <>
              <Link href={`/vehicle/${selectedVehicle.id}`} style={{ textDecoration: 'none', color: '#B0B0B0', transition: 'color 0.3s' }}>
                {selectedVehicle.brand} {selectedVehicle.model}
              </Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: '#2A2A2A' }}>Book Test Drive</span>
        </div>
      </div>

      <section style={{ padding: '0 0 clamp(3rem, 6vw, 5rem)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'clamp(2rem, 4vw, 4rem)', alignItems: 'start' }} className="testdrive-grid">
            
            {/* Left: Vehicle Details Panel */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8 }}
              style={{
                background: '#FAFAFA',
                borderRadius: '24px',
                padding: '2rem',
                border: '1px solid #ECECEC',
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.25rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '1.5rem' }}>
                Vehicle Selection
              </h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Choose a Different Luxury Vehicle
                </label>
                <select 
                  style={{ ...inputStyle, background: '#FFFFFF', cursor: 'pointer' }}
                  value={selectedVehicle?.id || ''}
                  onChange={(e) => {
                    const matched = vehicles.find(v => v.id === e.target.value);
                    if (matched) {
                      setSelectedVehicle(matched);
                    }
                  }}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.year}) - {formatPrice(v.price)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVehicle && (
                <div style={{ borderTop: '1px solid #EAEAEA', paddingTop: '1.5rem' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF', border: '1px solid #ECECEC', marginBottom: '1rem' }}>
                    <Image 
                      src={selectedVehicle.images[0]} 
                      alt={`${selectedVehicle.brand} ${selectedVehicle.model}`} 
                      fill 
                      style={{ objectFit: 'contain' }}
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                  </div>
                  
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#E10613', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {selectedVehicle.brand}
                  </span>
                  <h4 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 700, color: '#2A2A2A', margin: '0.25rem 0 0.5rem' }}>
                    {selectedVehicle.model}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#8A8A8A', marginBottom: '1rem' }}>
                    {selectedVehicle.variant} · {selectedVehicle.year}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-primary)', fontSize: '1.625rem', fontWeight: 700, color: '#2A2A2A' }}>
                      {formatPrice(selectedVehicle.price)}
                    </span>
                    {selectedVehicle.originalPrice && (
                      <span style={{ fontSize: '0.9375rem', color: '#B0B0B0', textDecoration: 'line-through' }}>
                        {formatPrice(selectedVehicle.originalPrice)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem 0.75rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #ECECEC' }}>
                      <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: '#B0B0B0', marginBottom: '2px' }}>KM DRIVEN</p>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2A2A2A' }}>{formatMileage(selectedVehicle.mileage)}</p>
                    </div>
                    <div style={{ padding: '0.5rem 0.75rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #ECECEC' }}>
                      <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: '#B0B0B0', marginBottom: '2px' }}>TRANSMISSION</p>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2A2A2A' }}>{selectedVehicle.transmission}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right: Booking Form Panel */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8, delay: 0.1 }}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '3rem 2.5rem',
                border: '1px solid #ECECEC',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
              }}
            >
              {bookingSuccess ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'rgba(34, 197, 94, 0.1)',
                      color: '#22C55E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      margin: '0 auto 1.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    ✓
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '2rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.75rem' }}>
                    Request Submitted!
                  </h2>
                  <p style={{ fontSize: '1rem', color: '#8A8A8A', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto 2rem' }}>
                    Thank you. Our luxury consultant will contact you shortly to schedule your test drive.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    {selectedVehicle && (
                      <Link href={`/vehicle/${selectedVehicle.id}`} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                        Back to Vehicle
                      </Link>
                    )}
                    <Link href="/inventory" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                      Browse Collection
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '2rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.5rem' }}>
                    Book a Test Drive
                  </h2>
                  <p style={{ fontSize: '0.9375rem', color: '#8A8A8A', marginBottom: '2.5rem' }}>
                    Experience the unmatched luxury and performance. Complete the form below to request your exclusive private drive session.
                  </p>

                  <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={bookingLoading}
                        placeholder="Your full name"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        style={inputStyle}
                        className="modal-input"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        disabled={bookingLoading}
                        placeholder="Your 10-digit number"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        style={inputStyle}
                        className="modal-input"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Email ID *
                      </label>
                      <input
                        type="email"
                        required
                        disabled={bookingLoading}
                        placeholder="your@email.com"
                        value={bookingEmail}
                        onChange={(e) => setBookingEmail(e.target.value)}
                        style={inputStyle}
                        className="modal-input"
                      />
                    </div>

                    {bookingError && (
                      <div style={{ color: '#E10613', fontSize: '0.875rem', fontWeight: 500 }}>
                        ⚠️ {bookingError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', marginTop: '0.5rem', border: 'none', cursor: 'pointer' }}
                    >
                      {bookingLoading ? 'Submitting...' : 'Schedule Test Drive'}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </section>

      <style jsx global>{`
        .testdrive-grid {
          grid-template-columns: 1fr 1.2fr;
        }
        @media (max-width: 900px) {
          .testdrive-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .modal-input:focus {
          border-color: #E10613 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(225, 6, 19, 0.08) !important;
        }
      `}</style>
    </>
  );
}
