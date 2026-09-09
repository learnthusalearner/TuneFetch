import React from 'react';
import { motion } from 'motion/react';
import { CAPABILITIES, stagger, cardVariant } from './landingData';

/**
 * CapabilitiesSection
 * Quick-scan technical capability pills (PKCE 2.0, 320 kbps, Neon DB, etc.).
 */
export default function CapabilitiesSection() {
  return (
    <section
      aria-label="Core Technical Capabilities"
      style={{
        background: 'var(--bg-white)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
        <motion.div className="capability-row" {...stagger}>
          {CAPABILITIES.map((c) => (
            <motion.div
              key={c.label}
              className="capability-pill"
              variants={cardVariant}
              whileHover={{ y: -2, borderColor: 'var(--accent-green)' }}
            >
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span>{c.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
