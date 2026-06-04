'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Shield, Car, DollarSign, Key, Award, Scale } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      icon: <Shield size={20} style={{ color: '#E10613' }} />,
      title: '1. Agreement to Terms',
      content: 'By accessing, browsing, or utilizing the Auto Bourn digital platform, you agree to compile with and be bound by these Terms & Conditions. These terms govern all website interactions, digital collections browsing, test drive appointments, vehicle appraisals, and reservation inquiries with Autobourn Cars, Chennai.'
    },
    {
      icon: <Car size={20} style={{ color: '#E10613' }} />,
      title: '2. Vehicle Listings & Specifications',
      content: 'We make every effort to ensure museum-grade accuracy in all vehicle options, specifications, structural highlights, history summaries, and pricing listings. However, technical data, availability, and final pricing are subject to physical validation and confirmation at our physical showroom in Chennai. Auto Bourn reserves the right to correct listing discrepancies without prior liability.'
    },
    {
      icon: <DollarSign size={20} style={{ color: '#E10613' }} />,
      title: '3. Reservations & Valuation Appraisals',
      content: 'A digital vehicle reservation or deposit serves as a temporary hold and does not constitute a completed sale or transfer of ownership. Initial trade-in or sell-your-car valuations calculated online are preliminary estimates. Final valuation offers are subject to a physical 200+ point inspection and approval by our certified automotive technicians.'
    },
    {
      icon: <Key size={20} style={{ color: '#E10613' }} />,
      title: '4. Third-Party Finance & Insurance',
      content: 'Auto Bourn coordinates with leading credit institutions and insurance underwriters to present premium financial support. All estimated interest rates, EMI figures, insurance premiums, and loan approvals shown on our platform are subject to the underwriting criteria, credit evaluations, and final approval of our partnered financial firms.'
    },
    {
      icon: <Award size={20} style={{ color: '#E10613' }} />,
      title: '5. Intellectual Property Rights',
      content: 'All original content, UI features, logos, system configurations, high-definition car photography, visual assets, text structures, and code integrations on the Auto Bourn platform are the exclusive intellectual property of Autobourn Cars. Unauthorized reproduction, modification, or distribution is strictly prohibited.'
    },
    {
      icon: <Scale size={20} style={{ color: '#E10613' }} />,
      title: '6. Governing Law & Jurisdiction',
      content: 'These Terms & Conditions are governed by and construed in accordance with the laws of the Republic of India. Any legal disputes or claims arising out of the use of this website or our digital reservation services shall be subject to the exclusive jurisdiction of the competent courts of Chennai, Tamil Nadu.'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      fontFamily: "'Outfit', sans-serif",
      color: '#2A2A2A',
      padding: 'clamp(3rem, 6vw, 6rem) 0'
    }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: '3.5rem' }}
        >
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#8A8A8A',
            textDecoration: 'none',
            fontSize: '0.9375rem',
            fontWeight: 500,
            marginBottom: '2rem',
            transition: 'color 0.2s'
          }} className="back-link">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(225, 6, 19, 0.06)',
            color: '#E10613',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <FileText size={28} />
          </div>

          <h1 style={{
            fontSize: 'clamp(2.25rem, 5vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            lineHeight: 1.1
          }}>
            Terms &amp; <span style={{ color: '#E10613' }}>Conditions</span>
          </h1>
          
          <p style={{ color: '#8A8A8A', fontSize: '0.9375rem', margin: 0 }}>
            Last Updated: June 2026 | Autobourn Cars, Chennai
          </p>
        </motion.div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            background: '#FAFAFA',
            border: '1px solid #ECECEC',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '3rem',
            lineHeight: 1.7,
            color: '#4A4A4A',
            fontSize: '1.05rem'
          }}
        >
          Welcome to Auto Bourn. Please review these Terms & Conditions carefully. They outline the guidelines, rules, and mutual commitments governing your use of our digital platform and physical dealership transactions.
        </motion.div>

        {/* Terms List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              style={{
                borderBottom: '1px solid #F0F0F0',
                paddingBottom: '2rem'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(225, 6, 19, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {section.icon}
                </div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#2A2A2A',
                  margin: 0
                }}>
                  {section.title}
                </h2>
              </div>
              <p style={{
                fontSize: '1rem',
                lineHeight: 1.7,
                color: '#4A4A4A',
                margin: 0,
                paddingLeft: '48px'
              }}>
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Outro */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            marginTop: '4rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #FAFAFA 0%, #FFFFFF 100%)',
            border: '1px solid #ECECEC',
            borderRadius: '24px',
            padding: '3rem 2rem'
          }}
        >
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
            Terms Inquiries
          </h3>
          <p style={{ color: '#8A8A8A', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 2rem' }}>
            If you have any questions regarding our terms, agreements, or transactional structures, please feel free to reach out to us.
          </p>
          <a href="mailto:hello@autobourn.com" style={{
            display: 'inline-block',
            background: '#E10613',
            color: '#FFFFFF',
            textDecoration: 'none',
            padding: '0.875rem 2rem',
            borderRadius: '12px',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(225, 6, 19, 0.2)',
            transition: 'all 0.2s'
          }} className="btn-contact">
            Email Support
          </a>
        </motion.div>
      </div>

      <style jsx global>{`
        .back-link:hover {
          color: #E10613 !important;
        }
        .btn-contact:hover {
          background: #c70511 !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
