'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

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
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Name and Phone are required.');
      return;
    }
    setSubmitting(true);
    try {
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
          notes: `Interest: ${interest}\nMessage: ${message || 'No message provided.'}`,
        }),
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        console.error('Error submitting contact form:', resData.error);
        alert('There was a problem sending your message: ' + (resData.error || 'Server error'));
      } else {
        setSuccess(true);
        setName('');
        setPhone('');
        setEmail('');
        setInterest('Select');
        setMessage('');
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err: any) {
      console.error('Unexpected error in contact submission:', err);
      alert('An unexpected error occurred: ' + err.message);
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem, 4vw, 4rem)', maxWidth: '1100px', margin: '0 auto' }} className="contact-grid">
            {/* Form */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div style={{ background: '#FAFAFA', borderRadius: '20px', padding: 'clamp(2rem, 3vw, 2.5rem)', border: '1px solid #ECECEC' }}>
                <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.25rem', fontWeight: 700, color: '#2A2A2A', marginBottom: '1.5rem' }}>Send a Message</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {success ? (
                    <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '10px', textAlign: 'center', fontWeight: 600 }}>
                      ✓ Message sent successfully! Our team will contact you shortly.
                    </div>
                  ) : null}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                      <option>Finance</option>
                      <option>Insurance</option>
                      <option>Test Drive</option>
                      <option>General Inquiry</option>
                    </select>
                  </div>
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
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {contactInfo.map((c, i) => {
                const isLink = !!c.link;
                const CardElement = isLink ? 'a' : 'div';
                const extraProps = isLink ? {
                  href: c.link,
                  target: c.link.startsWith('http') ? '_blank' : undefined,
                  rel: c.link.startsWith('http') ? 'noopener noreferrer' : undefined,
                } : {};

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
                      style={{
                        background: '#FAFAFA',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        border: '1px solid #ECECEC',
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'flex-start',
                        textDecoration: 'none',
                        color: 'inherit',
                        cursor: isLink ? 'pointer' : 'default',
                        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                        height: '100%',
                      }}
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
              <div style={{
                borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9',
                border: '1px solid #ECECEC', display: 'flex', flex: 1, minHeight: '250px',
                background: '#FAFAFA'
              }}>
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
        @media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr !important; } }
        input:focus, select:focus, textarea:focus { border-color: #E10613 !important; }
      `}</style>
    </>
  );
}
