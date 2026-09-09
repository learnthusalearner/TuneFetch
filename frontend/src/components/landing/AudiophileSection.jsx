import React from 'react';
import { motion } from 'motion/react';
import { fadeUp } from './landingData';
import djTurntablePng from '../../assets/dj_turntable.png';
import audiophileHeadphonesPng from '../../assets/audiophile_headphones.png';

/**
 * AudiophileSection
 * Hardware suitability showcase for professional DJs, live performers, and studio audiophiles.
 */
export default function AudiophileSection() {
  return (
    <section
      className="section-white"
      aria-label="Audiophile Gear & DJ Equipment Showcase"
      style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="section-wrap">
        <div className="section-inner">
          <motion.p className="section-eyebrow" {...fadeUp(0)}>Pro Equipment Ready</motion.p>
          <motion.h2 className="section-title" {...fadeUp(0.06)}>
            Tested on high-end hardware.<br />
            Approved by pro DJs and audiophiles.
          </motion.h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, marginTop: 40 }}>
            {/* DJ Equipment Card */}
            <motion.div
              whileHover={{ y: -6 }}
              style={{ borderRadius: 28, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-white)' }}
            >
              <img
                src={djTurntablePng}
                alt="Professional DJ Mixing Console & Turntable Setup"
                loading="lazy"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/dj_turntable.png'; }}
                style={{ width: '100%', height: 260, objectFit: 'cover' }}
              />
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>For DJs &amp; Performers</h3>
                <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6 }}>
                  Extract full 200+ track DJ sets with exact song names and artist tags. Perfect for Rekordbox, Serato, and Traktor gig prep.
                </p>
              </div>
            </motion.div>

            {/* Audiophile Headphones Card */}
            <motion.div
              whileHover={{ y: -6 }}
              style={{ borderRadius: 28, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-white)' }}
            >
              <img
                src={audiophileHeadphonesPng}
                alt="Studio Audiophile Headphones Resting on Desk"
                loading="lazy"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/audiophile_headphones.png'; }}
                style={{ width: '100%', height: 260, objectFit: 'cover' }}
              />
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>For Studio Audiophiles</h3>
                <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6 }}>
                  Experience pristine soundstage clarity through planar magnetic headphones and external DACs without distortion.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
