'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { testimonials, statistics } from '@/data/vehicles';
import { useCountUp } from '@/hooks/useAnimations';
import Image from 'next/image';
import TestimonialCarousel from '@/components/TestimonialCarousel';

function StatItem({ value, suffix, label, index }: { value: number; suffix: string; label: string; index: number }) {
  const { ref, count } = useCountUp(value, 2000);
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
      style={{ textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 200, color: '#2A2A2A', lineHeight: 1 }}>
        {count}<span style={{ color: '#E10613' }}>{suffix}</span>
      </p>
      <p style={{ fontSize: '0.8125rem', color: '#8A8A8A', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    </motion.div>
  );
}

export default function AboutPage() {
  const values = [
    { icon: '✦', title: 'Transparency', desc: 'Complete vehicle history, fair pricing, and honest assessments — no hidden surprises.' },
    { icon: '◆', title: 'Excellence', desc: 'Every vehicle meets our exacting standards of quality, condition, and provenance.' },
    { icon: '●', title: 'Trust', desc: 'Built on integrity, backed by warranties, and supported by genuine customer care.' },
    { icon: '▲', title: 'Innovation', desc: 'Leveraging technology for seamless experiences — from AI search to digital documentation.' },
  ];

  return (
    <>
      {/* Hero */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) 0', background: '#FFFFFF' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(2rem, 6vw, 4rem)', alignItems: 'center' }}>
            {/* Text - Left */}
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ maxWidth: '600px' }}>
              <p className="text-overline" style={{ marginBottom: '0.75rem' }}>About Auto Bourn</p>
              <h1 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: '#2A2A2A', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.5rem' }}>
                Redefining<br />Pre-Owned <span style={{ color: '#E10613' }}>Luxury</span>
              </h1>
              <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', lineHeight: 1.8, color: '#4A4A4A' }}>
                Auto Bourn was founded with a singular vision — to transform the pre-owned luxury car experience in India. 
                We believe every premium vehicle deserves to be presented, sold, and owned with the same reverence as when it first left the showroom.
              </p>
            </motion.div>
            {/* Car Image - Right */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{
                position: 'relative', width: '100%', aspectRatio: '4/3',
                borderRadius: '24px', overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.10)',
                border: '1px solid #ECECEC',
              }}>
                <Image
                  src="/carrr.jpg"
                  alt="Auto Bourn Premium Vehicle"
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder's Note */}
      <section className="section" style={{ background: '#FFFFFF', borderTop: '1px solid #F5F5F5' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(2rem, 6vw, 4rem)', alignItems: 'center' }}>
            {/* Founder Image */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.8 }}
            >
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                aspectRatio: '4/5', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                border: '1px solid #ECECEC'
              }}>
                <Image
                  src="/AutoBourn-Founder.png"
                  alt="Mr. S. Prasanna - Founder of Auto Bourn"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </motion.div>

            {/* Founder Note Text */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.8 }}
            >
              <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Founder&apos;s Note</p>
              <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, color: '#2A2A2A', marginBottom: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Driven by Passion,<br />Built on <span style={{ color: '#E10613' }}>Trust</span>
              </h2>
              <div style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4A4A4A', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p>
                  Welcome to Auto Bourn. Our journey began with a simple but profound observation: the pre-owned luxury car market in India lacked the transparency, precision, and customer-first care that a discerning client deserves. 
                </p>
                <p>
                  At Auto Bourn, we do not just trade premium vehicles; we curate automotive masterpieces. Every car that enters our collection is selected with meticulous attention to detail and undergoes a strict 200+ point quality inspection and certification. We believe that buying a pre-owned car should feel just as prestigious, clean, and exciting as driving a brand-new one out of the showroom.
                </p>
                <p>
                  Thank you for choosing Auto Bourn to be a part of your luxury driving journey. We look forward to offering you the finest experience, built on transparency and absolute commitment.
                </p>
              </div>
              <div style={{ marginTop: '2.5rem', borderTop: '1px solid #F0F0F0', paddingTop: '1.5rem' }}>
                <p style={{ fontFamily: 'var(--font-primary)', fontSize: '1.25rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.25rem' }}>
                  Mr. S. Prasanna
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#E10613', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Founder & Managing Director, Auto Bourn
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{ background: '#F5F5F5' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '3rem' }}>
            {statistics.map((s, i) => <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} index={i} />)}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" style={{ background: '#FFFFFF' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
            <p className="text-overline" style={{ marginBottom: '0.5rem' }}>Our Principles</p>
            <h2 className="headline-section">Core Values</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div style={{ background: '#FAFAFA', borderRadius: '16px', padding: '2rem', border: '1px solid #ECECEC', height: '100%' }}>
                  <span style={{ fontSize: '1.5rem', color: '#E10613', display: 'block', marginBottom: '1rem' }}>{v.icon}</span>
                  <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.125rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.5rem' }}>{v.title}</h3>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: '#4A4A4A' }}>{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="section" style={{ background: '#F5F5F5' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p className="text-overline" style={{ marginBottom: '0.5rem' }}>Testimonials</p>
            <h2 className="headline-section">Client Stories</h2>
          </motion.div>
          <TestimonialCarousel testimonials={testimonials} />
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: '#FFFFFF' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: '#2A2A2A', marginBottom: '1rem' }}>
              Experience the <span style={{ color: '#E10613' }}>Difference</span>
            </h2>
            <p style={{ color: '#8A8A8A', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>Visit our showroom or browse our collection online.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/inventory" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>Browse Collection</Link>
              <Link href="/contact" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>Contact Us</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
