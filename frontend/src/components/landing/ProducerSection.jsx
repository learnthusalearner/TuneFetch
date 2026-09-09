import React from 'react';
import { motion } from 'motion/react';
import { fadeUp } from './landingData';
import indianProducerPng from '../../assets/indian_producer.png';

/**
 * ProducerSection
 * Features Indian artist and sound engineer studio showcase with bullet highlights.
 */
export default function ProducerSection() {
  const highlights = [
    "Lossless-Grade 320 kbps MP3 Encoding",
    "Complete Original Artist & Album Tagging",
    "Instant Sub-Second Neon DB Caching"
  ];

  return (
    <section
      className="section-white"
      aria-label="Indian Artist Spotlight & Studio Production"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="section-wrap">
        <div className="section-inner">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>
            <motion.div {...fadeUp(0)}>
              <p className="section-eyebrow">Studio to Stage</p>
              <h2 className="section-title">
                Over 14,000+ Tracks.<br />
                <span className="text-animated-gradient">Engineered for pure audio precision.</span>
              </h2>
              <p style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.7, marginTop: 16, maxWidth: 480 }}>
                From Bollywood melodies, Indian indie tunes, and classical fusion to global EDM festival anthems, TuneFetch extracts every song in true 320 kbps MP3 format.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
                {highlights.map((text, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(29,185,84,0.15)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✓
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              style={{ borderRadius: 32, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
            >
              <img
                src={indianProducerPng}
                alt="Indian Music Producer & Sound Designer in Modern Studio"
                loading="lazy"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/indian_producer.png'; }}
                style={{ width: '100%', height: 380, objectFit: 'cover' }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
