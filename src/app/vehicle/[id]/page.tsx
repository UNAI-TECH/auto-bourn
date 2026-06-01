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


  useEffect(() => {
    async function load() {
      if (!params?.id) return;
      const data = await fetchDbVehicleById(params.id as string);
      setVehicle(data);
      if (data) {
        const allDb = await fetchDbVehicles();
        const sim = allDb.filter(v => v.id !== data.id && v.bodyType === data.bodyType).slice(0, 3);
        setSimilar(sim);
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
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={{ width: '90vw', maxWidth: '1000px', aspectRatio: '16/10', position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
              <Image src={vehicle.images[activeImg]} alt={vehicle.model} fill style={{ objectFit: 'cover' }} sizes="90vw" />
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
              <div onClick={() => setLightbox(true)} style={{ borderRadius: '20px', overflow: 'hidden', aspectRatio: '16/10', position: 'relative', marginBottom: '1rem', cursor: 'zoom-in' }}>
                <Image src={vehicle.images[activeImg]} alt={`${vehicle.brand} ${vehicle.model}`} fill style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }} priority sizes="(max-width: 768px) 100vw, 60vw" />
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
                  <div key={i} onClick={() => setActiveImg(i)} style={{ borderRadius: '12px', aspectRatio: '16/10', position: 'relative', overflow: 'hidden', cursor: 'pointer', border: i === activeImg ? '2px solid #E10613' : '2px solid transparent', transition: 'all 0.3s ease', opacity: i === activeImg ? 1 : 0.7 }}>
                    <Image src={img} alt={`View ${i + 1}`} fill style={{ objectFit: 'cover' }} sizes="200px" />
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
                  { l: 'Mileage', v: formatMileage(vehicle.mileage) }, { l: 'Fuel', v: vehicle.fuelType },
                  { l: 'Transmission', v: vehicle.transmission }, { l: 'Drivetrain', v: vehicle.drivetrain },
                  { l: 'Power', v: `${vehicle.horsepower} HP` }, { l: '0-100 km/h', v: vehicle.acceleration },
                  { l: 'Ownership', v: vehicle.ownership }, { l: 'Registration', v: vehicle.registration },
                ].map(s => (
                  <div key={s.l} style={{ padding: '0.75rem', background: '#FAFAFA', borderRadius: '10px', transition: 'all 0.3s', border: '1px solid transparent' }} className="spec-chip">
                    <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B0B0B0', marginBottom: '4px' }}>{s.l}</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#2A2A2A' }}>{s.v}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <button onClick={() => { setFormSent(true); setTimeout(() => setFormSent(false), 3000); }} className="btn btn-primary btn-lg" style={{ flex: 1, minWidth: '160px' }}>
                  {formSent ? '✓ Request Sent!' : 'Book Test Drive'}
                </button>
                <button className="btn btn-secondary btn-lg" style={{ flex: 1, minWidth: '160px' }}>Reserve Vehicle</button>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href="tel:+919876543210" className="btn btn-ghost btn-sm" style={{ flex: 1, textDecoration: 'none' }}>📞 Call Now</a>
                <a href={`https://wa.me/919876543210?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ flex: 1, textDecoration: 'none', color: '#25D366', borderColor: '#25D366' }}>💬 WhatsApp</a>
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
                    { l: 'Engine', v: vehicle.engine }, { l: 'Horsepower', v: `${vehicle.horsepower} HP` },
                    { l: 'Torque', v: vehicle.torque }, { l: 'Top Speed', v: `${vehicle.topSpeed} km/h` },
                    { l: 'Body Type', v: vehicle.bodyType }, { l: 'Seats', v: `${vehicle.seatingCapacity}` },
                    { l: 'Color', v: vehicle.color }, { l: 'Interior', v: vehicle.interiorColor },
                  ].map(s => (
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
                      <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden' }}>
                        <Image src={v.images[0]} alt={`${v.brand} ${v.model}`} fill style={{ objectFit: 'cover', transition: 'transform 0.6s ease' }} className="vehicle-card-img" sizes="400px" />
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

      <style jsx global>{`
        @media (max-width: 768px) { .vehicle-detail-grid { grid-template-columns: 1fr !important; } }
        .spec-chip:hover { background: #fff !important; border-color: #E10613 !important; }
        .feature-row:hover { border-color: #E10613 !important; transform: translateX(4px); }
      `}</style>
    </>
  );
}
