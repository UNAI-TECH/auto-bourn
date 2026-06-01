'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Vehicle, brands, testimonials, statistics, whyAutoBourn, formatPrice } from '@/data/vehicles';
import VehicleCard from '@/components/VehicleCard';
import TestimonialCarousel from '@/components/TestimonialCarousel';
import { useScrollReveal, useCountUp, useMouseTilt } from '@/hooks/useAnimations';
import { fetchDbVehicles } from '@/lib/supabase/vehicles';

/* ── SVG Feature Icons ── */
function FeatureIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    shield: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    search: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <path d="m11 8v6M8 11h6" />
      </svg>
    ),
    warranty: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
    finance: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
        <line x1="6" y1="15" x2="10" y2="15" />
      </svg>
    ),
    insurance: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" />
      </svg>
    ),
    crown: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" />
        <path d="M5 16h14v4H5z" />
      </svg>
    ),
  };
  return <span style={{ display: 'inline-flex' }}>{iconMap[icon] || <span style={{ fontSize: '2rem', color: '#E10613' }}>✦</span>}</span>;
}

/* ── Stat counter ── */
function StatItem({ value, suffix, label, index }: { value: number; suffix: string; label: string; index: number }) {
  const { ref, count } = useCountUp(value, 2000);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.15 }}
      style={{ textAlign: 'center' }}
    >
      <p style={{
        fontFamily: 'var(--font-primary)', fontSize: 'clamp(3rem, 8vw, 6rem)',
        fontWeight: 200, color: '#2A2A2A', lineHeight: 1, letterSpacing: '-0.04em',
      }}>
        {count}<span style={{ color: '#E10613' }}>{suffix}</span>
      </p>
      <p style={{ fontSize: '0.875rem', color: '#8A8A8A', marginTop: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>
        {label}
      </p>
    </motion.div>
  );
}

/* ── Floating Social Icons Component ── */

export default function HomePage() {
  const heroTilt = useMouseTilt(2);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchDbVehicles();
      setVehiclesList(data);
      setLoading(false);
    }
    load();
  }, []);

  const featuredVehicles = vehiclesList.filter(v => v.featured).slice(0, 4);
  const recentVehicles = vehiclesList.filter(v => v.recentlyAdded).slice(0, 4);
  const section2 = useScrollReveal();
  const section3 = useScrollReveal();
  const section4 = useScrollReveal();

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle background accents */}
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(225,6,19,0.03) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(245,245,245,0.8) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="container-wide" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem, 6vw, 6rem)', alignItems: 'center', width: '100%', padding: 'clamp(2rem, 4vw, 4rem) clamp(1.5rem, 4vw, 3rem)' }}>
          {/* Left */}
          <div>
            <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#E10613', marginBottom: '1.5rem' }}>
                Premium Pre-Owned Collection
              </p>
              <h1 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(3rem, 7vw, 6.5rem)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em', color: '#2A2A2A', marginBottom: '1.5rem' }}>
                DRIVE<br />BEYOND<br /><span style={{ color: '#E10613' }}>LUXURY</span>
              </h1>
              <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', lineHeight: 1.7, color: '#4A4A4A', maxWidth: '480px', marginBottom: '2.5rem' }}>
                Curated collection of certified premium pre-owned vehicles. 
                Every car inspected, every detail perfected, every drive exceptional.
              </p>
            </motion.div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link 
                href="/inventory" 
                className="btn btn-primary btn-lg" 
                style={{ 
                  textDecoration: 'none', 
                  transition: 'transform var(--duration-normal) var(--ease-luxury), box-shadow var(--duration-normal) var(--ease-luxury)' 
                }}
              >
                Explore Collection
              </Link>
              <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} style={{ display: 'inline-flex' }}>
                <Link href="/contact" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>Book Test Drive</Link>
              </motion.div>
            </div>
          </div>

          {/* Right — Vehicle Display with REAL IMAGE */}
          <motion.div
            ref={heroTilt}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hero-vehicle-container"
            style={{ position: 'relative' }}
          >
            <div className="animate-float-slow" style={{
              width: '100%', aspectRatio: '4/3', borderRadius: '24px',
              overflow: 'hidden', position: 'relative',
            }}>
              <Image
                src="/vehicles/hero-showroom.png"
                alt="Auto Bourn Premium Showroom"
                fill
                style={{ objectFit: 'cover' }}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Price tag */}
              <div style={{
                position: 'absolute', bottom: '24px', right: '24px',
                background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)',
                borderRadius: '12px', padding: '12px 20px', border: '1px solid #ECECEC',
              }}>
                <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A8A', marginBottom: '2px' }}>Starting from</p>
                <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.125rem', color: '#2A2A2A' }}>{formatPrice(3800000)}</p>
              </div>
              {/* Brand badge */}
              <div style={{
                position: 'absolute', top: '24px', left: '24px',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)',
                borderRadius: '999px', padding: '8px 16px',
              }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Premium Showroom
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* ═══ FEATURED INVENTORY ═══ */}
      <section ref={section2.ref} className="section" style={{ background: '#FFFFFF' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 5vw, 4rem)' }}>
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Featured Collection</p>
            <h2 className="headline-section">Handpicked Luxury</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'clamp(1.5rem, 2vw, 2rem)' }}>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="shimmer" style={{ height: '380px', borderRadius: '16px' }} />
              ))
            ) : featuredVehicles.length === 0 ? (
              <p style={{ textAlign: 'center', gridColumn: '1/-1', color: '#8A8A8A', padding: '2rem 0' }}>No featured vehicles available.</p>
            ) : (
              featuredVehicles.map((v, i) => <VehicleCard key={v.id} vehicle={v} index={i} />)
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/inventory" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>View All Vehicles</Link>
          </div>
        </div>
      </section>

      {/* ═══ BRAND SHOWCASE — CAROUSEL ═══ */}
      <section ref={section3.ref} className="section" style={{ background: '#F5F5F5', overflow: 'hidden' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 5vw, 4rem)' }}>
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Luxury Brands</p>
            <h2 className="headline-section">World&apos;s Finest Marques</h2>
          </motion.div>
        </div>
        {/* Infinite scroll carousel — logos only */}
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          {/* Fade edge left */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to right, #F5F5F5, transparent)', zIndex: 2, pointerEvents: 'none' }} />
          {/* Fade edge right */}
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to left, #F5F5F5, transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div className="brand-carousel-track">
            {[...brands, ...brands, ...brands].map((brand, i) => (
              <Link key={`${brand.slug}-${i}`} href={`/inventory?brand=${brand.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div className="brand-logo-card">
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    width={130}
                    height={130}
                    style={{ objectFit: 'contain', width: '130px', height: '130px' }}
                    className="brand-logo-img"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ═══ WHY AUTO BOURN ═══ */}
      <section ref={section4.ref} className="section" style={{ background: '#FFFFFF' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 5vw, 4rem)' }}>
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>The Auto Bourn Difference</p>
            <h2 className="headline-section">Why Choose Us</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {whyAutoBourn.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}>
                <div className="card-glass" style={{ padding: '2rem', height: '100%' }}>
                  <FeatureIcon icon={item.icon} />
                  <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.125rem', fontWeight: 700, color: '#2A2A2A', margin: '1rem 0 0.5rem' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: '#4A4A4A' }}>{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ RECENTLY ADDED ═══ */}
      <section className="section" style={{ background: '#F5F5F5' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'clamp(2rem, 4vw, 3rem)', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="text-overline" style={{ marginBottom: '0.5rem' }}>Just Arrived</p>
              <h2 className="headline-section">Recently Added</h2>
            </div>
            <Link href="/inventory" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>View All →</Link>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'clamp(1.5rem, 2vw, 2rem)' }}>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="shimmer" style={{ height: '380px', borderRadius: '16px' }} />
              ))
            ) : recentVehicles.length === 0 ? (
              <p style={{ textAlign: 'center', gridColumn: '1/-1', color: '#8A8A8A', padding: '2rem 0' }}>No vehicles recently added.</p>
            ) : (
              recentVehicles.map((v, i) => <VehicleCard key={v.id} vehicle={v} index={i} />)
            )}
          </div>
        </div>
      </section>

      {/* ═══ STATISTICS ═══ */}
      <section className="section" style={{ background: '#FFFFFF' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'clamp(2rem, 4vw, 4rem)' }}>
            {statistics.map((stat, i) => (
              <StatItem key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="section" style={{ background: '#F5F5F5' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Testimonials</p>
            <h2 className="headline-section">What Our Clients Say</h2>
          </motion.div>
          <TestimonialCarousel testimonials={testimonials} />
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="section" style={{ background: '#FFFFFF' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{
              textAlign: 'center', padding: 'clamp(3rem, 6vw, 5rem)',
              background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)',
              borderRadius: '24px', border: '1px solid #ECECEC',
            }}
          >
            <p className="text-overline" style={{ marginBottom: '1rem' }}>Ready to Begin?</p>
            <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#2A2A2A', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
              Your Next Luxury Drive<br /><span style={{ color: '#E10613' }}>Starts Here</span>
            </h2>
            <p style={{ fontSize: '1rem', color: '#8A8A8A', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
              Schedule a private showing or browse our curated collection from the comfort of your home.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/inventory" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>Explore Collection</Link>
              <Link href="/sell" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>Sell Your Car</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Floating Social Icons ── */}

      {/* ── Global page styles ── */}
      <style jsx global>{`
        .brand-carousel-track {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding: 0.5rem clamp(1.5rem, 4vw, 3rem) 1.5rem;
          animation: brandScroll 25s linear infinite;
          width: max-content;
        }
        .brand-carousel-track:hover {
          animation-play-state: paused;
        }
        @keyframes brandScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        .brand-logo-card {
          background: #FFFFFF;
          border-radius: 20px;
          width: 170px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ECECEC;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          padding: 0.75rem;
        }
        .brand-logo-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.10);
          border-color: #E10613;
        }
        .brand-logo-img {
          opacity: 1;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          mix-blend-mode: multiply;
        }
        .brand-logo-card:hover .brand-logo-img { transform: scale(1.08); }

        @media (max-width: 768px) {
          .hero-vehicle-container { display: none; }
          section:first-of-type > div { grid-template-columns: 1fr !important; }
          .brand-logo-card { width: 110px; height: 100px; padding: 1rem; }
        }
      `}</style>
    </>
  );
}
