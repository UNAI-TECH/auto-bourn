'use client';

import Link from 'next/link';
import Image from 'next/image';

const footerLinks = {
  inventory: [
    { label: 'Browse Collection', href: '/inventory' },
    { label: 'Mercedes-Benz', href: '/inventory?brand=mercedes-benz' },
    { label: 'BMW', href: '/inventory?brand=bmw' },
    { label: 'Audi', href: '/inventory?brand=audi' },
    { label: 'Land Rover', href: '/inventory?brand=land-rover' },
    { label: 'Jaguar', href: '/inventory?brand=jaguar' },
  ],
  services: [
    { label: 'Finance', href: '/finance' },
    { label: 'Insurance', href: '/insurance' },
    { label: 'Sell Your Car', href: '/sell' },
    { label: 'Trade-In', href: '/sell' },
    { label: 'Warranty', href: '/about' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Testimonials', href: '/about#testimonials' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
};

export default function Footer() {
  return (
    <footer
      id="site-footer"
      style={{
        background: '#FAFAFA',
        borderTop: '1px solid #ECECEC',
      }}
    >
      {/* Main Footer */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(2rem, 4vw, 4rem)',
          }}
        >
          {/* Brand Column */}
          <div style={{ maxWidth: '320px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0,
              }}>
                <Image
                  src="/logo.jpg"
                  alt="Auto Bourn Logo"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="42px"
                />
              </div>
              <span style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#2A2A2A',
              }}>
                AUTO <span style={{ color: '#E10613' }}>BOURN</span>
              </span>
            </Link>
            <p style={{
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              color: '#8A8A8A',
              marginBottom: '1.5rem',
            }}>
              India&apos;s premier luxury pre-owned automotive platform. 
              Every vehicle curated, certified, and presented with museum-quality precision.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* Instagram */}
              <a href="https://www.instagram.com/autobourncars/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid #DADADA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8A8A', textDecoration: 'none', transition: 'all 0.3s ease' }}
                className="social-icon"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              {/* WhatsApp */}
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid #DADADA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8A8A', textDecoration: 'none', transition: 'all 0.3s ease' }}
                className="social-icon"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>


          {/* Services */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#2A2A2A',
              marginBottom: '1.25rem',
            }}>
              Services
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {footerLinks.services.map((link) => (
                <li key={link.label} style={{ marginBottom: '0.625rem' }}>
                  <Link
                    href={link.href}
                    className="footer-link"
                    style={{
                      textDecoration: 'none',
                      color: '#8A8A8A',
                      fontSize: '0.9375rem',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#2A2A2A',
              marginBottom: '1.25rem',
            }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {footerLinks.company.map((link) => (
                <li key={link.label} style={{ marginBottom: '0.625rem' }}>
                  <Link
                    href={link.href}
                    className="footer-link"
                    style={{
                      textDecoration: 'none',
                      color: '#8A8A8A',
                      fontSize: '0.9375rem',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Presented by UNAI TECH */}
            <a
              href="https://www.unaitech.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '14px',
                background: '#1F1E1D',
                borderRadius: '18px',
                padding: '12px 24px',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginTop: '1.75rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
              className="unai-badge"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9E9185', textTransform: 'uppercase', letterSpacing: '0.15em', lineHeight: 1.2 }}>Presented by</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.04em', fontFamily: 'var(--font-primary)', lineHeight: 1.1 }}>
                  <span style={{ color: '#E5B549' }}>UNAI</span> <span style={{ color: '#FFFFFF' }}>TECH</span>
                </span>
              </div>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(229, 181, 73, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.3s ease'
              }} className="unai-arrow-circle">
                <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                  <path d="M2 8L8 2M8 2H3M8 2V7" stroke="#E5B549" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: '1px solid #ECECEC',
          padding: '1.25rem clamp(1.5rem, 4vw, 3rem)',
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <p style={{ fontSize: '0.8125rem', color: '#B0B0B0' }}>
          © {new Date().getFullYear()} Auto Bourn. All rights reserved.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/privacy" className="footer-link" style={{ textDecoration: 'none', color: '#B0B0B0', fontSize: '0.8125rem', transition: 'color 0.3s ease' }}>Privacy Policy</Link>
          <Link href="/terms" className="footer-link" style={{ textDecoration: 'none', color: '#B0B0B0', fontSize: '0.8125rem', transition: 'color 0.3s ease' }}>Terms &amp; Conditions</Link>
        </div>
      </div>

      <style jsx global>{`
        .footer-link:hover {
          color: #E10613 !important;
        }
        .social-icon:hover {
          border-color: #E10613 !important;
          color: #E10613 !important;
          transform: translateY(-2px);
        }
        .unai-badge:hover {
          background: #151413 !important;
          transform: translateY(-2px);
          border-color: rgba(229, 181, 73, 0.4) !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.2) !important;
        }
        .unai-badge:hover .unai-arrow-circle {
          background: rgba(229, 181, 73, 0.3) !important;
          transform: scale(1.05);
        }
      `}</style>
    </footer>
  );
}
