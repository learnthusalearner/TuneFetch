import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Check } from 'lucide-react';
import { COMPARISON_ITEMS, fadeUp } from './landingData';

/**
 * ComparisonSection
 * Clear side-by-side comparison table between TuneFetch and generic converters.
 */
export default function ComparisonSection() {
  return (
    <section id="comparison-section" className="section-light" aria-label="Feature Comparison Matrix">
      <div className="section-wrap">
        <div className="section-inner">
          <motion.p className="section-eyebrow" {...fadeUp(0)}>
            Why TuneFetch Wins
          </motion.p>
          <motion.h2 className="section-title" {...fadeUp(0.06)}>
            Don't settle for bad sound.<br />
            <span className="text-animated-gradient-light">See how TuneFetch compares.</span>
          </motion.h2>

          <motion.div
            style={{
              marginTop: 40,
              borderRadius: 28,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              background: 'var(--bg-white)',
              boxShadow: 'var(--shadow-card)'
            }}
            {...fadeUp(0.12)}
          >
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '20px 24px', background: 'var(--bg-section)', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: 14 }}>
              <div>Feature</div>
              <div style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} /> TuneFetch
              </div>
              <div style={{ color: 'var(--text-muted)' }}>Generic Converters</div>
            </div>

            {/* Comparison Rows */}
            {COMPARISON_ITEMS.map((item, idx) => (
              <div
                key={item.feature}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr',
                  padding: '18px 24px',
                  borderBottom: idx === COMPARISON_ITEMS.length - 1 ? 'none' : '1px solid var(--border)',
                  fontSize: 14,
                  alignItems: 'center',
                  background: idx % 2 === 0 ? 'var(--bg-white)' : 'rgba(0,0,0,0.01)'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.feature}</div>
                <div style={{ fontWeight: 800, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={16} strokeWidth={3} /> {item.tunefetch}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{item.others}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
