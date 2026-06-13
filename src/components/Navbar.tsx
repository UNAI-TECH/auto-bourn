'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/sell', label: 'Sell Your Car' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav id="main-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.80)',
        backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
        borderBottom: scrolled ? '1px solid #ECECEC' : '1px solid transparent',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.04)' : 'none',
      }}>
        <div style={{
          maxWidth: '1600px', margin: '0 auto',
          padding: '0 clamp(1.5rem, 4vw, 3rem)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: scrolled ? '70px' : '80px',
          transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
              <Image src="/logo.jpg" alt="Auto Bourn Logo" fill style={{ objectFit: 'cover' }} sizes="42px" priority />
            </div>
            <span style={{
              fontFamily: 'var(--font-primary)', fontSize: '1.25rem',
              fontWeight: 700, color: '#2A2A2A', letterSpacing: '-0.02em', whiteSpace: 'nowrap',
            }}>
              AUTO <span style={{ color: '#E10613' }}>BOURN</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }} className="desktop-nav">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link" style={{
                textDecoration: 'none', color: '#2A2A2A', fontSize: '0.875rem',
                fontWeight: 500, fontFamily: 'var(--font-secondary)',
                letterSpacing: '0.01em', position: 'relative', padding: '4px 0',
                transition: 'color 0.3s ease',
              }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="desktop-nav">
            <Link href="/inventory" className="btn btn-primary btn-sm btn-no-shadow" style={{ textDecoration: 'none', boxShadow: 'none' }}>
              Explore Collection
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', zIndex: 1001 }}>
            <div style={{ width: '24px', height: '18px', position: 'relative' }}>
              <span style={{ display: 'block', width: '24px', height: '2px', background: '#2A2A2A', borderRadius: '2px', position: 'absolute', transition: 'all 0.3s ease', top: mobileOpen ? '8px' : '0', transform: mobileOpen ? 'rotate(45deg)' : 'none' }} />
              <span style={{ display: 'block', width: '24px', height: '2px', background: '#2A2A2A', borderRadius: '2px', position: 'absolute', top: '8px', opacity: mobileOpen ? 0 : 1, transition: 'opacity 0.3s ease' }} />
              <span style={{ display: 'block', width: '24px', height: '2px', background: '#2A2A2A', borderRadius: '2px', position: 'absolute', transition: 'all 0.3s ease', top: mobileOpen ? '8px' : '16px', transform: mobileOpen ? 'rotate(-45deg)' : 'none' }} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px', background: '#FFFFFF', zIndex: 999, padding: '100px 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '-10px 0 40px rgba(0,0,0,0.08)' }}>
            {navLinks.map((link, i) => (
              <motion.div key={link.href} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <Link href={link.href} onClick={() => setMobileOpen(false)} style={{
                  textDecoration: 'none', color: '#2A2A2A', fontSize: '1.25rem',
                  fontWeight: 500, fontFamily: 'var(--font-primary)',
                  display: 'block', padding: '1rem 0', borderBottom: '1px solid #ECECEC',
                  transition: 'color 0.3s ease',
                }}>
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ marginTop: 'auto', paddingTop: '2rem' }}>
              <Link href="/inventory" className="btn btn-primary btn-lg btn-no-shadow" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none', width: '100%', boxShadow: 'none' }}>
                Explore Collection
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 998, backdropFilter: 'blur(4px)' }} />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .nav-link::after {
          content: ''; position: absolute; bottom: 0; left: 50%;
          transform: translateX(-50%) scaleX(0); width: 100%; height: 2px;
          background: #E10613; transform-origin: center;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); border-radius: 999px;
        }
        .nav-link:hover::after { transform: translateX(-50%) scaleX(1); }
        .nav-link:hover { color: #E10613 !important; }
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </>
  );
}
