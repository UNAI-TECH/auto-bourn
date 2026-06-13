// the opening body shop is only in the painting and tent repaire only

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Palette, Wrench, AlertTriangle } from 'lucide-react';

export default function BodyShopPage() {
  const services = [
    {
      icon: <Palette size={42} strokeWidth={1.5} color="#E10613" />,
      title: 'Premium Painting & Refinishing',
      desc: 'Factory-grade multi-stage painting utilizing premium PPG paint systems. Handled in a dust-free pressurized downdraft booth to guarantee a mirror-like luxury finish.',
    },
    {
      icon: <Wrench size={42} strokeWidth={1.5} color="#E10613" />,
      title: 'Dent & Panel Alignment (Tent Repair)',
      desc: 'Precision paintless dent removal and structural sheet metal alignment. Restoring original contours and body lines of your premium vehicle back to factory specifications.',
    },
  ];

  const highlights = [
    { title: 'Computerized Color Matching', desc: 'Advanced spectrophotometer technology ensures 100% color accuracy matching the original factory coat.' },
    { title: 'Premium Paint Booth', desc: 'State-of-the-art baking oven and clean-air filtration system for an immaculate, dust-free paint execution.' },
    { title: 'Luxury Standard Materials', desc: 'Only high-solid primers, clear coats, and base coats designed specifically for luxury marques.' },
    { title: 'Expert Craftsmen', desc: 'Certified technicians with decades of experience handling premium aluminum and steel body panels.' },
  ];

  return (
    <>
      {/* Hero Section */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0 2rem', background: '#FFFFFF' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto clamp(3rem, 6vw, 4.5rem)' }}
          >
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Auto Bourn Services</p>
            <h1 className="headline-section" style={{ marginBottom: '1rem' }}>Premium Body Shop & Paint Care</h1>
            <p style={{ fontSize: '1.125rem', color: '#8A8A8A', lineHeight: 1.7 }}>
              Precision body repair and painting services designed exclusively for luxury vehicles. Restore your car to showroom floor glory.
            </p>
          </motion.div>

          {/* Core Services Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto 5rem' }}>
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <div style={{
                  background: '#FAFAFA',
                  borderRadius: '20px',
                  padding: '2.5rem',
                  border: '1px solid #ECECEC',
                  height: '100%',
                  transition: 'all 0.4s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
                }}
                className="body-shop-card"
                >
                  <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>{s.icon}</div>
                  <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.25rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.75rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: '#4A4A4A' }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights & Standards */}
      <section className="section" style={{ background: '#F5F5F5' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '4rem' }}
          >
            <p className="text-overline" style={{ marginBottom: '0.5rem' }}>Our Standards</p>
            <h2 className="headline-section">Why Choose Auto Bourn</h2>
          </motion.div>

          <div className="highlights-grid">
            {highlights.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '2rem',
                  border: '1px solid #ECECEC',
                  height: '100%',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.01)'
                }}>
                  <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.05rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.5rem' }}>{h.title}</h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#8A8A8A' }}>{h.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{ background: '#FFFFFF' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{
              textAlign: 'center',
              padding: 'clamp(3rem, 6vw, 5rem)',
              background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)',
              borderRadius: '24px',
              border: '1px solid #ECECEC',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: '#2A2A2A', marginBottom: '1rem' }}>
              Restore Your Car to <span style={{ color: '#E10613' }}>Showroom Finish</span>
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#8A8A8A', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
              Book an appointment with our specialist painters and technicians for dent correction or a custom repaint quote.
            </p>
            <Link href="/contact" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
              Schedule Appointment
            </Link>
          </motion.div>
        </div>
      </section>

      <style jsx global>{`
        .body-shop-card:hover {
          transform: translateY(-5px);
          border-color: #E10613 !important;
          box-shadow: 0 12px 30px rgba(0,0,0,0.05) !important;
        }
        .highlights-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (max-width: 1024px) {
          .highlights-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .highlights-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
