'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Lock, Eye, Database, Share2, HelpCircle } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      icon: <Lock size={20} style={{ color: '#E10613' }} />,
      title: '1. Information Collection',
      content: 'We collect information you provide directly to us when exploring our luxury collection. This includes your name, email address, phone number, and preferences submitted through contact forms, test drive schedulers, and vehicle appraisal submissions. For premium financing and insurance inquiries, we collect financial records, identity verification documents, and trade-in vehicle specifications.'
    },
    {
      icon: <Eye size={20} style={{ color: '#E10613' }} />,
      title: '2. Usage of Information',
      content: 'Your personal data is used to deliver a tailored automotive client experience. We utilize your details to: facilitate vehicle purchases, process trade-in evaluations, coordinates secure test drive appointments, communicate customized finance and insurance options, manage client wishlists, and send essential administrative notices.'
    },
    {
      icon: <Database size={20} style={{ color: '#E10613' }} />,
      title: '3. Data Security & Storage',
      content: 'Auto Bourn employs enterprise-grade cryptographic standards and secure Supabase database servers to protect your data from unauthorized access, alteration, disclosure, or destruction. Access to personal data is strictly limited to authorized personnel who require the information to execute vehicle transactions and customer relations.'
    },
    {
      icon: <Share2 size={20} style={{ color: '#E10613' }} />,
      title: '4. Information Sharing',
      content: 'We do not sell, rent, or lease your private information to third parties. Information is only shared with authorized financial institutions, credit bureaus, and insurance underwriters when you explicitly request a finance or insurance quote. These partners are legally bound to protect your data with comparable security measures.'
    },
    {
      icon: <HelpCircle size={20} style={{ color: '#E10613' }} />,
      title: '5. Your Rights & Choice',
      content: 'You maintain full control over your data. You may request to review, correct, update, or completely delete your personal information from our active databases at any time. For such requests or inquiries regarding our data protection practices, please contact our privacy compliance officer at hello@autobourn.com.'
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
            <ShieldCheck size={28} />
          </div>

          <h1 style={{
            fontSize: 'clamp(2.25rem, 5vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            lineHeight: 1.1
          }}>
            Privacy <span style={{ color: '#E10613' }}>Policy</span>
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
          At Auto Bourn, we appreciate the trust you place in us when sharing your personal information. We are committed to safeguarding your privacy and ensuring that your premium vehicle acquisition journey remains secure, transparent, and built on trust.
        </motion.div>

        {/* Policy List */}
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
            Questions or Concerns?
          </h3>
          <p style={{ color: '#8A8A8A', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 2rem' }}>
            Our client relationship team is here to help with any inquiries regarding our data handling or security protocols.
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
            Contact Compliance Officer
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
