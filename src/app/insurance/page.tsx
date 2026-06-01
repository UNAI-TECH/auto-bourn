'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function InsurancePage() {
  const features = [
    { title: 'Insurance Comparison', desc: 'Compare premiums from top insurers side by side to find the best coverage for your luxury vehicle.' },
    { title: 'Premium Calculator', desc: 'Instant premium estimates based on your vehicle model, year, IDV, and coverage requirements.' },
    { title: 'Renewal Reminder', desc: 'Never miss a renewal deadline. Automated reminders ensure continuous protection for your vehicle.' },
    { title: 'Claim Assistance', desc: 'Dedicated claim support team to guide you through the entire process from filing to settlement.' },
  ];

  const partners = [
    { name: 'Cibil Score', logo: '/cibilscore.jpeg' },
    { name: 'IDFC First Bank', logo: '/idfcbank.png' },
    { name: 'Tata Capital', logo: '/tatacapital.png' },
    { name: 'Shriram Finance', logo: '/shriram.png' },
    { name: 'Kuwy', logo: '/kuwy.jpeg' },
  ];

  return (
    <>
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: '#FFFFFF' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto clamp(3rem, 5vw, 4rem)' }}>
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Protection Plans</p>
            <h1 className="headline-section">Luxury Vehicle Insurance</h1>
            <p style={{ fontSize: '1rem', color: '#8A8A8A', marginTop: '1rem', lineHeight: 1.7 }}>
              Comprehensive coverage solutions for your premium vehicle. Best rates, seamless claims, complete peace of mind.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: 'clamp(3rem, 5vw, 4rem)' }}>
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div style={{ background: '#FAFAFA', borderRadius: '16px', padding: '2rem', border: '1px solid #ECECEC', height: '100%', transition: 'all 0.4s ease' }} className="insurance-card">
                  {/* <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>{f.icon}</span> */}
                  <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.125rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.5rem' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: '#4A4A4A' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Insurers */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ background: '#F5F5F5', borderRadius: '20px', padding: 'clamp(2rem, 4vw, 3rem)', textAlign: 'center' }}>
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Trusted Partners</p>
            <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.5rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '2rem' }}>Our Partners</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>
              {partners.map(partner => (
                <div key={partner.name} style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #ECECEC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '180px',
                  height: '80px',
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  overflow: 'hidden',
                }}>
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={150}
                    height={60}
                    style={{ objectFit: 'contain', marginTop: '6px' }}
                  />
                </div>
              ))}
            </div>
            <Link href="/contact" className="btn btn-primary btn-lg" style={{ textDecoration: 'none', marginTop: '2rem', display: 'inline-flex' }}>Get Insurance Quote</Link>
          </motion.div>
        </div>
      </section>

      <style jsx global>{`.insurance-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,0.06); }`}</style>
    </>
  );
}
