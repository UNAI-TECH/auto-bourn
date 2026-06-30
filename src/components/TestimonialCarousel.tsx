'use client';

import React from 'react';
import { Testimonial } from '@/data/vehicles';

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

export default function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  if (!testimonials || testimonials.length === 0) return null;

  // Duplicate testimonials array 3 times to make the infinite scroll smooth
  const tripledTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '1rem 0' }}>
      {/* Gradient Fades for Left/Right Edges */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px',
        background: 'linear-gradient(to right, #F5F5F5, transparent)', zIndex: 2, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px',
        background: 'linear-gradient(to left, #F5F5F5, transparent)', zIndex: 2, pointerEvents: 'none'
      }} />

      <div className="testimonial-carousel-track">
        {tripledTestimonials.map((t, i) => (
          <div
            key={`${t.id}-${i}`}
            className="testimonial-card-marquee"
          >
            <div>
              {/* Quote Mark Accent */}
              <div className="quote-mark-accent">“</div>
              
              {/* Rating stars */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', position: 'relative', zIndex: 2 }}>
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} style={{ color: '#E10613', fontSize: '1rem' }}>★</span>
                ))}
              </div>

              {/* Review Text */}
              <p style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                color: '#2A2A2A',
                fontWeight: 300,
                marginBottom: '1.5rem',
                fontStyle: 'italic',
                position: 'relative',
                zIndex: 2,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                height: '96px' // Keep height consistent
              }}>
                &ldquo;{t.content}&rdquo;
              </p>
            </div>

            {/* Customer Details */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #F0F0F0',
              paddingTop: '1.25rem',
              position: 'relative',
              zIndex: 2,
              gap: '1rem'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2A2A2A', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</p>
                <p style={{ fontSize: '0.75rem', color: '#8A8A8A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.role}</p>
              </div>
              <div style={{
                background: 'rgba(225,6,19,0.06)',
                color: '#E10613',
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '999px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                {t.vehicle}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .testimonial-carousel-track {
          display: flex;
          gap: 2rem;
          padding: 1rem clamp(1.5rem, 4vw, 3rem) 2rem;
          animation: testimonialScroll 75s linear infinite;
          width: max-content;
        }
        .testimonial-carousel-track:hover {
          animation-play-state: paused;
        }
        @keyframes testimonialScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        .testimonial-card-marquee {
          background: #FFFFFF;
          border-radius: 24px;
          width: 380px;
          min-height: 290px;
          height: auto;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid #ECECEC;
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 2rem;
          position: relative;
        }
        .testimonial-card-marquee:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.08);
          border-color: #E10613;
        }
        .quote-mark-accent {
          position: absolute;
          top: 0.5rem;
          right: 2rem;
          font-size: 6rem;
          line-height: 1;
          font-family: var(--font-primary), serif;
          color: rgba(225,6,19,0.03);
          user-select: none;
          pointer-events: none;
          font-weight: 900;
        }
      `}</style>
    </div>
  );
}
