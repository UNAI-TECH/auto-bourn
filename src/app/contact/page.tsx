'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AlertModal from '@/components/AlertModal';

/* ── SVG Contact Icons ── */
function ContactIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    location: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    phone: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    email: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    clock: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  };
  return <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icons[type]}</span>;
}

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('Select');
  const [message, setMessage] = useState('');
  const [exchangeBrand, setExchangeBrand] = useState('');
  const [exchangeYear, setExchangeYear] = useState('');
  const [exchangeKms, setExchangeKms] = useState('');
  const [exchangeExpectedPrice, setExchangeExpectedPrice] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const interestParam = params.get('interest');
      if (interestParam === 'Insurance') {
        setInterest('Insurance');
      } else if (interestParam === 'Finance') {
        setInterest('Finance');
      } else if (interestParam?.toLowerCase() === 'exchange') {
        setInterest('Exchange Cars');
      }
    }
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    onClose?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info', onClose?: () => void) => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
      onClose,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('hello@autobourncars.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showAlert('Input Required', 'Name and Phone are required.', 'error');
      return;
    }
    if (interest === 'Exchange Cars' && (!exchangeBrand.trim() || !exchangeYear.trim() || !exchangeKms.trim())) {
      showAlert('Input Required', 'Please fill in your exchange car details.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const notesContent = interest === 'Exchange Cars'
        ? `Interest: Exchange Cars\nExchange Car Details:\n- Brand & Model: ${exchangeBrand}\n- Year: ${exchangeYear}\n- Kilometers: ${exchangeKms}\n- Expected Price: ${exchangeExpectedPrice || 'N/A'}\n\nMessage: ${message || 'No message provided.'}`
        : `Interest: ${interest}\nMessage: ${message || 'No message provided.'}`;

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          phone: phone,
          email: email || null,
          source: 'website',
          interested_car: interest !== 'Select' ? `Get In Touch: ${interest}` : 'Get In Touch Message',
          lead_status: 'new',
          notes: notesContent,
        }),
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        console.error('Error submitting contact form:', resData.error);
        showAlert('Submission Error', 'There was a problem sending your message: ' + (resData.error || 'Server error'), 'error');
      } else {
        let waText = `Hi Auto Bourn, I want to get in touch:
*Name:* ${name}
*Phone:* ${phone}
*Email:* ${email || 'N/A'}
*Interest:* ${interest}`;

        if (interest === 'Exchange Cars') {
          waText += `\n\n*Exchange Car Details:*
- Brand & Model: ${exchangeBrand}
- Year: ${exchangeYear}
- Kilometers: ${exchangeKms}
- Expected Price: ${exchangeExpectedPrice || 'N/A'}`;
        }

        waText += `\n\n*Message:* ${message || 'No message provided.'}`;

        const waUrl = `https://wa.me/919176777222?text=${encodeURIComponent(waText)}`;

        showAlert(
          'Redirecting to WhatsApp',
          'Your request has been submitted successfully to our CRM. You will now be redirected to WhatsApp to complete your message.',
          'success',
          () => {
            window.location.href = waUrl;
            setName('');
            setPhone('');
            setEmail('');
            setInterest('Select');
            setMessage('');
            setExchangeBrand('');
            setExchangeYear('');
            setExchangeKms('');
            setExchangeExpectedPrice('');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);
          }
        );
      }
    } catch (err: any) {
      console.error('Unexpected error in contact submission:', err);
      showAlert('Unexpected Error', 'An unexpected error occurred: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem 1rem', border: '1px solid #ECECEC', borderRadius: '10px',
    background: '#FAFAFA', fontSize: '0.9375rem', color: '#2A2A2A', fontFamily: 'var(--font-secondary)',
    outline: 'none', transition: 'border-color 0.3s',
  };

  const contactInfo = [
    {
      icon: 'location',
      label: 'Visit Us',
      value: '137, Jawaharlal Nehru Salai, opposite to sunshine school, AGS Colony, Velachery, Chennai, Tamil Nadu 600042',
      link: 'https://www.google.com/maps/search/?api=1&query=137,+Jawaharlal+Nehru+Salai,+opposite+to+sunshine+school,+AGS+Colony,+Velachery,+Chennai,+Tamil+Nadu+600042'
    },
    {
      icon: 'phone',
      label: 'Call Us',
      value: '+91 91767 77222',
      link: 'tel:+919176777222'
    },
    {
      icon: 'email',
      label: 'Email',
      value: 'hello@autobourncars.com',
      link: 'mailto:hello@autobourncars.com'
    },
    {
      icon: 'clock',
      label: 'Hours',
      value: 'Mon–Sat: 10 AM – 8 PM | Sun: 11 AM – 6 PM'
    },
  ];

  return (
    <>
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: '#FFFFFF' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto clamp(3rem, 5vw, 4rem)' }}>
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Get In Touch</p>
            <h1 className="headline-section">Contact Us</h1>
            <p style={{ fontSize: '1rem', color: '#8A8A8A', marginTop: '1rem', lineHeight: 1.7 }}>
              Schedule a private viewing, book a test drive, or simply have a conversation about your next luxury vehicle.
            </p>
          </motion.div>

          <div className="contact-grid">
            {/* Form */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="contact-form-card">
                <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.25rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '1.5rem' }}>Send a Message</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {success ? (
                    <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '10px', textAlign: 'center', fontWeight: 600 }}>
                      ✓ Message sent successfully! Our team will contact you shortly.
                    </div>
                  ) : null}
                  <div className="contact-name-phone-grid">
                    <div>
                      <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Name *</label>
                      <input required type="text" placeholder="Your name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Phone *</label>
                      <input required type="tel" placeholder="+91" style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input type="email" placeholder="your@email.com" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Interest</label>
                    <select style={inputStyle} value={interest} onChange={e => setInterest(e.target.value)}>
                      <option>Select</option>
                      <option>Buy a Vehicle</option>
                      <option>Sell a Vehicle</option>
                      <option>Exchange Cars</option>
                      <option>Finance</option>
                      <option>Insurance</option>
                      <option>Test Drive</option>
                      <option>General Inquiry</option>
                    </select>
                  </div>
                  <AnimatePresence>
                    {interest === 'Exchange Cars' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #ECECEC', padding: '1.25rem', borderRadius: '14px', background: '#FFFFFF', marginTop: '0.25rem', marginBottom: '0.25rem' }}
                      >
                        <h4 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#E10613', fontWeight: 700 }}>Your Car's Details</h4>
                        <div className="contact-name-phone-grid">
                          <div>
                            <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Brand & Model *</label>
                            <input required type="text" placeholder="e.g. Maruti Swift" style={inputStyle} value={exchangeBrand} onChange={e => setExchangeBrand(e.target.value)} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Manufacturing Year *</label>
                            <input required type="number" placeholder="e.g. 2018" style={inputStyle} value={exchangeYear} onChange={e => setExchangeYear(e.target.value)} />
                          </div>
                        </div>
                        <div className="contact-name-phone-grid">
                          <div>
                            <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Kilometers Driven *</label>
                            <input required type="text" placeholder="e.g. 45,000 km" style={inputStyle} value={exchangeKms} onChange={e => setExchangeKms(e.target.value)} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Expected Price (Optional)</label>
                            <input type="text" placeholder="e.g. ₹ 5,00,000" style={inputStyle} value={exchangeExpectedPrice} onChange={e => setExchangeExpectedPrice(e.target.value)} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div>
                    <label style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A8A', display: 'block', marginBottom: '0.5rem' }}>Message</label>
                    <textarea rows={4} placeholder="How can we help?" style={{ ...inputStyle, resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} />
                  </div>
                  <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ width: '100%', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="contact-info-list">
              {contactInfo.map((c, i) => {
                const isLink = !!c.link;
                const isMail = c.link?.startsWith('mailto:');
                const CardElement = isLink ? 'a' : 'div';
                const extraProps = isLink ? {
                  href: isMail ? undefined : c.link,
                  target: c.link?.startsWith('http') ? '_blank' : undefined,
                  rel: c.link?.startsWith('http') ? 'noopener noreferrer' : undefined,
                } : {};

                const handleClick = (e: React.MouseEvent) => {
                  if (isMail) {
                    e.preventDefault();
                    setEmailModalOpen(true);
                  }
                };

                return (
                  <motion.div
                    key={c.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    whileHover={isLink ? { y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.06)', borderColor: '#E10613' } : undefined}
                    style={{ display: 'block' }}
                  >
                    <CardElement
                      {...(extraProps as any)}
                      onClick={handleClick}
                      className="contact-info-card"
                      style={{ cursor: isLink ? 'pointer' : 'default' }}
                    >
                      <ContactIcon type={c.icon} />
                      <div>
                        <p style={{ fontFamily: 'var(--font-primary)', fontSize: '0.875rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '0.25rem' }}>{c.label}</p>
                        <p style={{ fontSize: '0.9375rem', color: '#4A4A4A', lineHeight: 1.6 }}>{c.value}</p>
                      </div>
                    </CardElement>
                  </motion.div>
                );
              })}

              {/* Interactive Map */}
              <div className="contact-map-container">
                <iframe
                  title="Auto Bourn Location Map"
                  src="https://maps.google.com/maps?q=137%2C%20Jawaharlal%20Nehru%20Salai%2C%20opposite%20to%20sunshine%20school%2C%20AGS%20Colony%2C%20Velachery%2C%20Chennai%2C%20Tamil%20Nadu%20600042&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(2rem, 4vw, 4rem);
          max-width: 1100px;
          margin: 0 auto;
        }
        .contact-form-card {
          background: #FAFAFA;
          border-radius: 20px;
          padding: clamp(2rem, 3vw, 2.5rem);
          border: 1px solid #ECECEC;
        }
        .contact-name-phone-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .contact-info-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .contact-info-card {
          background: #FAFAFA;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #ECECEC;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          height: 100%;
        }
        .contact-map-container {
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 16/9;
          border: 1px solid #ECECEC;
          display: flex;
          flex: 1;
          min-height: 250px;
          background: #FAFAFA;
        }
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 600px) {
          .contact-form-card {
            padding: 1.25rem !important;
            border-radius: 16px !important;
          }
          .contact-name-phone-grid {
            grid-template-columns: 1fr !important;
          }
          .contact-info-card {
            padding: 1.25rem !important;
            border-radius: 12px !important;
            gap: 0.75rem !important;
          }
          .contact-map-container {
            min-height: 200px !important;
            border-radius: 12px !important;
          }
          input, select, textarea {
            font-size: 16px !important;
          }
        }
        input:focus, select:focus, textarea:focus {
          border-color: #E10613 !important;
          box-shadow: 0 0 0 3px rgba(225, 6, 19, 0.08) !important;
        }
      `}</style>

      <AnimatePresence>
        {emailModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '2.25rem',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
                border: '1px solid #EAEAEA',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setEmailModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#F5F5F5',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#4A4A4A',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#EAEAEA'}
                onMouseLeave={e => e.currentTarget.style.background = '#F5F5F5'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(225, 6, 19, 0.08)',
                  color: '#E10613',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.35rem', fontWeight: 700, color: '#2A2A2A', margin: '0 0 0.5rem' }}>
                  Contact via Email
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#8A8A8A', margin: 0, lineHeight: 1.5 }}>
                  Choose your preferred email service to send a message to <strong style={{ color: '#2A2A2A' }}>hello@autobourncars.com</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Gmail */}
                <motion.a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=hello@autobourncars.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1px solid #ECECEC',
                    background: '#FFFFFF',
                    color: '#333333',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  whileHover={{ borderColor: '#2A2A2A', backgroundColor: '#F9F9F9' }}
                  onClick={() => setEmailModalOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  Open in Gmail
                </motion.a>

                {/* Outlook Web */}
                <motion.a
                  href="https://outlook.live.com/default.aspx?rru=compose&to=hello@autobourncars.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1px solid #ECECEC',
                    background: '#FFFFFF',
                    color: '#333333',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  whileHover={{ borderColor: '#2A2A2A', backgroundColor: '#F9F9F9' }}
                  onClick={() => setEmailModalOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.24 11.51l-5.66-5.65-1.41 1.41 4.24 4.24H2v2h11.41l-4.24 4.24 1.41 1.41 5.66-5.65z M20 2H4c-1.1 0-2 .9-2 2v4h2V4h16v16H4v-4H2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                  Open in Outlook Web
                </motion.a>

                {/* Default Mail Client */}
                <motion.a
                  href="mailto:hello@autobourncars.com"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1px solid #ECECEC',
                    background: '#FFFFFF',
                    color: '#333333',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  whileHover={{ borderColor: '#2A2A2A', backgroundColor: '#F9F9F9' }}
                  onClick={() => setEmailModalOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="2" y1="3" x2="12" y2="10" />
                    <line x1="22" y1="3" x2="12" y2="10" />
                  </svg>
                  Default Mail App
                </motion.a>

                {/* Copy to Clipboard */}
                <motion.button
                  onClick={copyToClipboard}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1px solid #E10613',
                    background: copied ? '#E10613' : 'transparent',
                    color: copied ? '#FFFFFF' : '#E10613',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  whileHover={copied ? undefined : { backgroundColor: 'rgba(225, 6, 19, 0.04)' }}
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Email Address
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        <AlertModal
          isOpen={alertConfig.isOpen}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => {
            setAlertConfig(prev => ({ ...prev, isOpen: false }));
            if (alertConfig.onClose) alertConfig.onClose();
          }}
        />
      </AnimatePresence>
    </>
  );
}
