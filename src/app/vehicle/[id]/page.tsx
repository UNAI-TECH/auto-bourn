'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, formatPrice, formatMileage } from '@/data/vehicles';
import { useState, useEffect } from 'react';
import { fetchDbVehicleById, fetchDbVehicles } from '@/lib/supabase/vehicles';

export default function VehicleDetailPage() {
  const params = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [similar, setSimilar] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [emiMonths, setEmiMonths] = useState(60);
  const [downPayment, setDownPayment] = useState(20);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [formSent, setFormSent] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveName, setReserveName] = useState('');
  const [reservePhone, setReservePhone] = useState('');
  const [reserveEmail, setReserveEmail] = useState('');
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveError, setReserveError] = useState('');
  const [reserveSuccess, setReserveSuccess] = useState(false);

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveName || !reservePhone || !reserveEmail) {
      setReserveError('Name, Phone Number, and Email ID are required.');
      return;
    }
    setReserveLoading(true);
    setReserveError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reserveName,
          phone: reservePhone,
          email: reserveEmail,
          carId: vehicle?.id,
          carName: `${vehicle?.brand} ${vehicle?.model}`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit reservation request.');
      }
      setReserveSuccess(true);
      setReserveName('');
      setReservePhone('');
      setReserveEmail('');
      setTimeout(() => {
        setShowReserveModal(false);
        setReserveSuccess(false);
      }, 3000);
    } catch (err: any) {
      setReserveError(err.message || 'An error occurred. Please try again.');
    } finally {
      setReserveLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          carId: vehicle?.id,
          carName: `${vehicle?.brand} ${vehicle?.model}`
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
      setTimeout(() => {
        setShowModal(false);
        setBookingSuccess(false);
      }, 3000);
    } catch (err: any) {
      setBookingError(err.message || 'An error occurred. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };


  useEffect(() => {
    async function load() {
      if (!params?.id) return;
      const data = await fetchDbVehicleById(params.id as string);
      setVehicle(data);
      if (data) {
        const allDb = await fetchDbVehicles();
        const sim = allDb.filter(v => v.id !== data.id && v.bodyType === data.bodyType).slice(0, 3);
        setSimilar(sim);

        // Increment views count asynchronously
        fetch('/api/cars/views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: params.id })
        }).catch(err => console.error('Failed to increment views:', err));
      }
      setLoading(false);
    }
    load();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '8rem 0' }}>
        <div className="shimmer" style={{ width: '200px', height: '24px', borderRadius: '8px', margin: '0 auto 1rem' }} />
        <div className="shimmer" style={{ width: '300px', height: '16px', borderRadius: '8px', margin: '0 auto' }} />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '8rem 0' }}>
        <h1 className="headline-section">Vehicle Not Found</h1>
        <p style={{ color: '#8A8A8A', margin: '1rem 0 2rem' }}>The vehicle you&apos;re looking for is no longer available.</p>
        <Link href="/inventory" className="btn btn-primary" style={{ textDecoration: 'none' }}>Browse Collection</Link>
      </div>
    );
  }

  const loanAmount = vehicle.price * (1 - downPayment / 100);
  const rate = 8.5 / 12 / 100;
  const emi = Math.round(loanAmount * rate * Math.pow(1 + rate, emiMonths) / (Math.pow(1 + rate, emiMonths) - 1));
  const whatsappMsg = encodeURIComponent(`Hi Auto Bourn, I'm interested in the ${vehicle.year} ${vehicle.brand} ${vehicle.model} ${vehicle.variant} (${formatPrice(vehicle.price)}). Please share more details.`);

  return (
    <>
      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={{ width: '90vw', maxWidth: '1000px', aspectRatio: '16/10', position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
              <Image src={vehicle.images[activeImg]} alt={vehicle.model} fill style={{ objectFit: 'contain' }} sizes="90vw" />
            </motion.div>
            <button onClick={(e) => { e.stopPropagation(); setLightbox(false); }} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '1.5rem', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      <div className="container" style={{ padding: '1.5rem clamp(1.5rem, 4vw, 3rem)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: '#B0B0B0' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#B0B0B0', transition: 'color 0.3s' }}>Home</Link><span>/</span>
          <Link href="/inventory" style={{ textDecoration: 'none', color: '#B0B0B0', transition: 'color 0.3s' }}>Inventory</Link><span>/</span>
          <span style={{ color: '#2A2A2A' }}>{vehicle.brand} {vehicle.model}</span>
        </div>
      </div>

      {/* Gallery + Info */}
      <section style={{ padding: '0 0 clamp(3rem, 6vw, 5rem)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'clamp(2rem, 4vw, 4rem)', alignItems: 'start' }} className="vehicle-detail-grid">
            {/* Gallery */}
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div onClick={() => setLightbox(true)} style={{ borderRadius: '20px', overflow: 'hidden', aspectRatio: '16/10', position: 'relative', marginBottom: '1rem', cursor: 'zoom-in', background: '#FAFAFA', border: '1px solid #ECECEC' }}>
                <Image src={vehicle.images[activeImg]} alt={`${vehicle.brand} ${vehicle.model}`} fill style={{ objectFit: 'contain', transition: 'transform 0.5s ease' }} priority sizes="(max-width: 768px) 100vw, 60vw" />
                {vehicle.tags[0] && (
                  <span style={{ position: 'absolute', top: '16px', left: '16px', background: '#E10613', color: '#fff', fontSize: '0.6875rem', fontWeight: 600, padding: '6px 14px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{vehicle.tags[0]}</span>
                )}
                {vehicle.originalPrice && (
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', borderRadius: '10px', padding: '6px 14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4ADE80' }}>Save {formatPrice(vehicle.originalPrice - vehicle.price)}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {vehicle.images.map((img, i) => (
                  <div key={i} onClick={() => setActiveImg(i)} style={{ borderRadius: '12px', aspectRatio: '16/10', position: 'relative', overflow: 'hidden', cursor: 'pointer', border: i === activeImg ? '2px solid #E10613' : '2px solid transparent', transition: 'all 0.3s ease', opacity: i === activeImg ? 1 : 0.7, background: '#FAFAFA' }}>
                    <Image src={img} alt={`View ${i + 1}`} fill style={{ objectFit: 'contain' }} sizes="200px" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <p className="text-overline">{vehicle.brand}</p>
              </div>
              <h1 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 700, color: '#2A2A2A', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>{vehicle.model}</h1>
              <p style={{ fontSize: '1rem', color: '#8A8A8A', marginBottom: '0.75rem' }}>{vehicle.variant} · {vehicle.year}</p>


              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-primary)', fontSize: '2rem', fontWeight: 700, color: '#2A2A2A' }}>{formatPrice(vehicle.price)}</p>
                {vehicle.originalPrice && <p style={{ fontSize: '1rem', color: '#B0B0B0', textDecoration: 'line-through' }}>{formatPrice(vehicle.originalPrice)}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { l: 'Mileage', v: formatMileage(vehicle.mileage), show: vehicle.mileage !== null && vehicle.mileage !== undefined },
                  { l: 'Fuel', v: vehicle.fuelType, show: !!vehicle.fuelType && vehicle.fuelType !== '—' && vehicle.fuelType !== '-' },
                  { l: 'Transmission', v: vehicle.transmission, show: !!vehicle.transmission && vehicle.transmission !== '—' && vehicle.transmission !== '-' },
                  { l: 'Drivetrain', v: vehicle.drivetrain, show: !!vehicle.drivetrain && vehicle.drivetrain !== '—' && vehicle.drivetrain !== '-' },
                  { l: 'Power', v: `${vehicle.horsepower} HP`, show: !!vehicle.horsepower && vehicle.horsepower > 0 },
                  { l: '0-100 km/h', v: vehicle.acceleration, show: !!vehicle.acceleration && vehicle.acceleration !== '—' && vehicle.acceleration !== '-' && vehicle.acceleration !== '0' && vehicle.acceleration !== '0s' },
                  { l: 'Ownership', v: vehicle.ownership, show: !!vehicle.ownership && vehicle.ownership !== '—' && vehicle.ownership !== '-' },
                  { l: 'Registration', v: vehicle.registration, show: !!vehicle.registration && vehicle.registration !== '—' && vehicle.registration !== '-' },
                ].filter(s => s.show).map(s => (
                  <div key={s.l} style={{ padding: '0.75rem', background: '#FAFAFA', borderRadius: '10px', transition: 'all 0.3s', border: '1px solid transparent' }} className="spec-chip">
                    <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B0B0B0', marginBottom: '4px' }}>{s.l}</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#2A2A2A' }}>{s.v}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {vehicle.status === 'reserved' ? (
                  <button className="btn btn-secondary btn-lg" style={{ flex: 1, minWidth: '160px', background: '#f59e0b', borderColor: '#f59e0b', color: '#fff', cursor: 'not-allowed' }} disabled>
                    🔒 Booked
                  </button>
                ) : vehicle.status === 'sold' ? (
                  <button className="btn btn-secondary btn-lg" style={{ flex: 1, minWidth: '160px', background: '#7f7f7f', borderColor: '#7f7f7f', color: '#fff', cursor: 'not-allowed' }} disabled>
                    🚫 Sold Out
                  </button>
                ) : (
                  <>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary btn-lg" style={{ flex: 1, minWidth: '160px' }}>
                      Book Test Drive
                    </button>
                    <button onClick={() => setShowReserveModal(true)} className="btn btn-secondary btn-lg" style={{ flex: 1, minWidth: '160px' }}>Reserve Vehicle</button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a
                  href="tel:+919176777222"
                  className="btn btn-ghost btn-sm"
                  style={{
                    flex: 1,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Call Now
                </a>
                <a
                  href={`https://wa.me/919176777222?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{
                    flex: 1,
                    textDecoration: 'none',
                    color: '#25D366',
                    borderColor: '#25D366',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Description & Features */}
      <section className="section" style={{ background: '#F5F5F5' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem, 4vw, 4rem)' }} className="vehicle-detail-grid">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '1rem' }}>About This Vehicle</h2>
              <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4A4A4A' }}>{vehicle.description}</p>
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#2A2A2A' }}>Specifications</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {[
                    { l: 'Engine', v: vehicle.engine, show: !!vehicle.engine && vehicle.engine !== '—' && vehicle.engine !== '-' },
                    { l: 'Horsepower', v: `${vehicle.horsepower} HP`, show: !!vehicle.horsepower && vehicle.horsepower > 0 },
                    { l: 'Torque', v: vehicle.torque, show: !!vehicle.torque && vehicle.torque !== '—' && vehicle.torque !== '-' },
                    { l: 'Top Speed', v: `${vehicle.topSpeed} km/h`, show: !!vehicle.topSpeed && vehicle.topSpeed > 0 },
                    { l: 'Body Type', v: vehicle.bodyType, show: !!vehicle.bodyType && vehicle.bodyType !== '—' && vehicle.bodyType !== '-' },
                    { l: 'Seats', v: `${vehicle.seatingCapacity}`, show: !!vehicle.seatingCapacity && vehicle.seatingCapacity > 0 },
                    { l: 'Color', v: vehicle.color, show: !!vehicle.color && vehicle.color !== '—' && vehicle.color !== '-' },
                    { l: 'Interior', v: vehicle.interiorColor, show: !!vehicle.interiorColor && vehicle.interiorColor !== '—' && vehicle.interiorColor !== '-' },
                  ].filter(s => s.show).map(s => (
                    <div key={s.l} style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #ECECEC' }}>
                      <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B0B0B0', marginBottom: '2px' }}>{s.l}</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#2A2A2A' }}>{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '1rem' }}>Features & Amenities</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {vehicle.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #ECECEC', transition: 'all 0.3s' }} className="feature-row">
                    <span style={{ color: '#E10613', fontSize: '0.875rem' }}>✓</span>
                    <span style={{ fontSize: '0.9375rem', color: '#2A2A2A' }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* EMI Calculator */}
              <div style={{ marginTop: '2rem', background: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #ECECEC' }}>
                <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#2A2A2A' }}>EMI Calculator</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Down Payment: {downPayment}%</label>
                  <input type="range" min={10} max={50} value={downPayment} onChange={e => setDownPayment(+e.target.value)} style={{ width: '100%', accentColor: '#E10613' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Tenure: {emiMonths} months</label>
                  <input type="range" min={12} max={84} step={12} value={emiMonths} onChange={e => setEmiMonths(+e.target.value)} style={{ width: '100%', accentColor: '#E10613' }} />
                </div>
                <div style={{ background: '#FAFAFA', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A8A', marginBottom: '0.25rem' }}>Estimated EMI</p>
                  <p style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 700, color: '#E10613' }}>₹ {emi.toLocaleString('en-IN')}/mo</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Similar Vehicles */}
      {similar.length > 0 && (
        <section className="section" style={{ background: '#FFFFFF' }}>
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
              <p className="text-overline" style={{ marginBottom: '0.5rem' }}>You May Also Like</p>
              <h2 className="headline-section">Similar Vehicles</h2>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {similar.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Link href={`/vehicle/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card" style={{ cursor: 'pointer' }}>
                      <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden', background: '#F5F5F5' }}>
                        <Image src={v.images[0]} alt={`${v.brand} ${v.model}`} fill style={{ objectFit: 'contain', transition: 'transform 0.6s ease' }} className="vehicle-card-img" sizes="400px" />
                      </div>
                      <div style={{ padding: '1.25rem 1.5rem' }}>
                        <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#E10613', marginBottom: '0.25rem' }}>{v.brand}</p>
                        <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.125rem', fontWeight: 700, color: '#2A2A2A' }}>{v.model} <span style={{ fontWeight: 400, color: '#8A8A8A', fontSize: '0.875rem' }}>· {v.year}</span></h3>
                        <p style={{ fontFamily: 'var(--font-primary)', fontSize: '1.125rem', fontWeight: 700, color: '#2A2A2A', marginTop: '0.75rem' }}>{formatPrice(v.price)}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Test Drive Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 3000,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
            onClick={() => !bookingLoading && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                border: '1px solid rgba(0, 0, 0, 0.05)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                disabled={bookingLoading}
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#A0A0A0',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E10613')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
              >
                ✕
              </button>

              {bookingSuccess ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(34, 197, 94, 0.1)',
                      color: '#22C55E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      margin: '0 auto 1.5rem',
                      fontWeight: 'bold',
                    }}
                  >
                    ✓
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.5rem' }}>
                    Request Submitted!
                  </h2>
                  <p style={{ fontSize: '0.9375rem', color: '#8A8A8A', lineHeight: 1.6 }}>
                    Thank you. Our luxury consultant will contact you shortly to schedule your test drive.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.25rem' }}>
                    Book a Test Drive
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: '#8A8A8A', marginBottom: '1.75rem' }}>
                    For the {vehicle?.brand} {vehicle?.model}
                  </p>

                  <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                        style={{
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
                        }}
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
                        style={{
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
                        }}
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
                        style={{
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
                        }}
                      />
                    </div>

                    {bookingError && (
                      <div style={{ color: '#E10613', fontSize: '0.8125rem', fontWeight: 500 }}>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reserve Vehicle Modal */}
      <AnimatePresence>
        {showReserveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 3000,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
            onClick={() => !reserveLoading && setShowReserveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                border: '1px solid rgba(0, 0, 0, 0.05)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                disabled={reserveLoading}
                onClick={() => setShowReserveModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#A0A0A0',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E10613')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
              >
                ✕
              </button>

              {reserveSuccess ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(34, 197, 94, 0.1)',
                      color: '#22C55E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      margin: '0 auto 1.5rem',
                      fontWeight: 'bold',
                    }}
                  >
                    ✓
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.5rem' }}>
                    Reservation Requested!
                  </h2>
                  <p style={{ fontSize: '0.9375rem', color: '#8A8A8A', lineHeight: 1.6 }}>
                    Thank you. Our luxury consultant will contact you shortly to confirm your reservation.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.25rem' }}>
                    Reserve Vehicle
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: '#8A8A8A', marginBottom: '1.75rem' }}>
                    For the {vehicle?.brand} {vehicle?.model}
                  </p>

                  <form onSubmit={handleReserveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={reserveLoading}
                        placeholder="Your full name"
                        value={reserveName}
                        onChange={(e) => setReserveName(e.target.value)}
                        style={{
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
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        disabled={reserveLoading}
                        placeholder="Your 10-digit number"
                        value={reservePhone}
                        onChange={(e) => setReservePhone(e.target.value)}
                        style={{
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
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Email ID *
                      </label>
                      <input
                        type="email"
                        required
                        disabled={reserveLoading}
                        placeholder="your@email.com"
                        value={reserveEmail}
                        onChange={(e) => setReserveEmail(e.target.value)}
                        style={{
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
                        }}
                      />
                    </div>

                    {reserveError && (
                      <div style={{ color: '#E10613', fontSize: '0.8125rem', fontWeight: 500 }}>
                        ⚠️ {reserveError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={reserveLoading}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', marginTop: '0.5rem', border: 'none', cursor: 'pointer' }}
                    >
                      {reserveLoading ? 'Submitting...' : 'Reserve Now'}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media (max-width: 768px) { .vehicle-detail-grid { grid-template-columns: 1fr !important; } }
        .spec-chip:hover { background: #fff !important; border-color: #E10613 !important; }
        .feature-row:hover { border-color: #E10613 !important; transform: translateX(4px); }
        .modal-input:focus { border-color: #E10613 !important; background: #ffffff !important; }
      `}</style>
    </>
  );
}
