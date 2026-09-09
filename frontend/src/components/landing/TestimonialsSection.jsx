import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { TESTIMONIALS, fadeUp, cardVariant } from './landingData';

/**
 * TestimonialsSection
 * Verified user reviews and social proof from producers, DJs, and audiophiles.
 */
export default function TestimonialsSection() {
  return (
    <section className="section-white" aria-label="User Reviews" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="section-wrap">
        <div className="section-inner">
          <motion.p className="section-eyebrow" {...fadeUp(0)}>
            Loved By Music Purists
          </motion.p>
          <motion.h2 className="section-title" {...fadeUp(0.06)}>
            Trusted by DJs, producers,<br />and audiophiles across India.
          </motion.h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 40 }}>
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                className="feature-card"
                variants={cardVariant}
                whileHover={{ y: -4 }}
                style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 4, color: '#f59e0b', marginBottom: 16 }}>
                    {[...Array(t.rating)].map((_, idx) => (
                      <Star key={idx} size={16} fill="#f59e0b" />
                    ))}
                  </div>
                  <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 20 }}>
                    "{t.quote}"
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
