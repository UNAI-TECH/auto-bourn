'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function FinancePage() {
  const partners = [
    { name: 'HDFC Bank', logo: '/assets/hdfc.png' },
    { name: 'ICICI Bank', logo: '/assets/icici.png' },
    { name: 'Axis Bank', logo: '/assets/axis.png' },
    { name: 'Kotak Mahindra', logo: '/assets/kotak.png' },
    { name: 'Bajaj Finance', logo: '/assets/bajaj.png' },
    { name: 'Tata Capital', logo: '/assets/tata.png' },
  ];

  const benefits = [
    { icon: '✦', title: 'Quick Approval', desc: 'Get loan approval within 24 hours with perfect documentation.' },
    { icon: '◆', title: 'Flexible Tenure', desc: 'Choose repayment tenure from 12 to 84 months to suit your budget.' },
    { icon: '●', title: 'Competitive Rates', desc: 'Best-in-class interest rates starting from just 8.25% p.a.' },
    { icon: '▲', title: 'Hassle-Free Process', desc: 'End-to-end digital processing with dedicated relationship manager.' },
  ];

  return (
    <>
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: '#FFFFFF' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto clamp(3rem, 5vw, 4rem)' }}>
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Finance Solutions</p>
            <h1 className="headline-section">Premium Vehicle Financing</h1>
            <p style={{ fontSize: '1rem', color: '#8A8A8A', marginTop: '1rem', lineHeight: 1.7 }}>
              Competitive rates from India&apos;s leading banks and NBFCs. Hassle-free processing with quick approvals.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <div className="benefits-grid">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ height: '100%' }}>
                <div style={{ background: '#FAFAFA', borderRadius: '16px', padding: '2rem', border: '1px solid #ECECEC', height: '100%' }}>
                  <span style={{ fontSize: '1.5rem', color: '#E10613', display: 'block', marginBottom: '1rem' }}>{b.icon}</span>
                  <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.125rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.5rem' }}>{b.title}</h3>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: '#4A4A4A' }}>{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            style={{
              textAlign: 'center', padding: 'clamp(2.5rem, 5vw, 4rem)',
              background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)',
              borderRadius: '24px', border: '1px solid #ECECEC', maxWidth: '700px', margin: '0 auto 4rem',
            }}>
            <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.75rem' }}>
              Ready to <span style={{ color: '#E10613' }}>Finance</span> Your Dream Car?
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#8A8A8A', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
              Get in touch with our finance team for a personalized quote and pre-approval.
            </p>
            <Link href="/contact?interest=Finance" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>Apply for Finance</Link>
          </motion.div>
        </div>
      </section>

      {/* Partners */}
      <section className="section" style={{ background: '#F5F5F5', overflow: 'hidden', padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="text-overline" style={{ marginBottom: '0.5rem' }}>Our Partners</p>
            <h2 className="headline-section">Finance Partners</h2>
          </motion.div>
        </div>

        {/* Infinite scroll carousel — logos only */}
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          {/* Fade edge left */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to right, #F5F5F5, transparent)', zIndex: 2, pointerEvents: 'none' }} />
          {/* Fade edge right */}
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to left, #F5F5F5, transparent)', zIndex: 2, pointerEvents: 'none' }} />
          
          <div className="partner-carousel-track">
            {[...partners, ...partners, ...partners].map((p, i) => (
              <div key={`${p.name}-${i}`} className="partner-logo-card">
                <Image
                  src={p.logo}
                  alt={`${p.name} logo`}
                  width={160}
                  height={50}
                  style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                  className="partner-logo-img"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx global>{`
        .partner-carousel-track {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          padding: 0.5rem clamp(1.5rem, 4vw, 3rem) 1.5rem;
          animation: partnerScroll 25s linear infinite;
          width: max-content;
        }
        .partner-carousel-track:hover {
          animation-play-state: paused;
        }
        @keyframes partnerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        .partner-logo-card {
          background: #FFFFFF;
          border-radius: 16px;
          width: 200px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ECECEC;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 1.25rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }
        .partner-logo-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
          border-color: #E10613;
        }
        .partner-logo-img {
          opacity: 0.85;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .partner-logo-card:hover .partner-logo-img {
          opacity: 1;
          transform: scale(1.05);
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          max-width: 1100px;
          margin: 0 auto 4rem;
        }
        @media (max-width: 1024px) {
          .benefits-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .benefits-grid {
            grid-template-columns: 1fr;
          }
          .partner-logo-card {
            width: 160px;
            height: 80px;
            padding: 1rem;
          }
        }
      `}</style>
    </>
  );
}
