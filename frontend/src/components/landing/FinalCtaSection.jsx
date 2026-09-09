import React from 'react';
import { motion } from 'motion/react';
import { Music, ArrowRight, Disc } from 'lucide-react';

/**
 * FinalCtaSection
 * High-conversion bottom call-to-action banner with spinning vinyl disc.
 */
export default function FinalCtaSection({ onLaunch, isConnected }) {
  return (
    <section className="section-white" aria-label="Final Conversion Call To Action" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="section-wrap">
        <motion.div
          style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          {/* Spinning vinyl disk icon */}
          <div className="vinyl-disk" style={{ width: 64, height: 64, borderRadius: '50%', background: 'radial-gradient(circle, #121317 40%, #1DB954 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(29,185,84,0.3)' }}>
            <Disc size={32} color="#ffffff" />
          </div>

          <p className="section-eyebrow">Ready for 320 kbps Audio?</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Convert &amp; Download Your<br />
            <span className="text-animated-gradient">Spotify Music Free Today.</span>
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-body)', lineHeight: 1.65, maxWidth: 460 }}>
            Join music lovers across India enjoying high-fidelity 320 kbps MP3s directly on their PCs.
            No software required.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.button
              id="final-cta-btn"
              className="btn-primary-green"
              onClick={onLaunch}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{ fontSize: '16px', padding: '15px 40px' }}
            >
              <Music size={20} />
              {isConnected ? 'Open Dashboard Workspace' : 'Fetch My Playlists Free ⚡'}
              <ArrowRight size={17} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
