import React from 'react';
import { motion } from 'motion/react';
import { FAQ_ITEMS, fadeUp, cardVariant } from './landingData';

/**
 * FaqSection
 * Frequently asked questions targeted at high-intent SEO queries.
 */
export default function FaqSection() {
  return (
    <section className="section-light" aria-label="Frequently Asked Questions" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="section-wrap">
        <div className="section-inner" style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.p className="section-eyebrow" style={{ textAlign: 'center' }} {...fadeUp(0)}>
            FAQ &amp; Knowledge Base
          </motion.p>
          <motion.h2 className="section-title" style={{ textAlign: 'center' }} {...fadeUp(0.06)}>
            Frequently Asked Questions
          </motion.h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40 }}>
            {FAQ_ITEMS.map((item) => (
              <motion.div
                key={item.q}
                className="feature-card"
                variants={cardVariant}
                style={{ padding: 24 }}
              >
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 900 }}>Q:</span>
                  {item.q}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6, paddingLeft: 26 }}>
                  {item.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
