'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #ffffff 0%, #f9f9f9 100%)',
      fontFamily: "'Outfit', sans-serif",
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '600px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(225, 6, 19, 0.08)',
          color: '#E10613',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <ShieldCheck size={32} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1A1A1A', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#8A8A8A', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem', textAlign: 'left' }}>
          At Auto Bourn, we take your privacy seriously. We collect and process personal data solely to deliver the highest quality luxury vehicle transaction experience. This includes search queries, preference settings, and contact information submitted via our forms. We secure your details and never sell them to third parties.
        </p>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#E10613',
          color: '#FFFFFF',
          textDecoration: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '0.9375rem',
          boxShadow: '0 4px 14px rgba(225, 6, 19, 0.2)',
          transition: 'all 0.2s'
        }}>
          <ArrowLeft size={16} /> Back to Homepage
        </Link>
      </div>
    </div>
  );
}
