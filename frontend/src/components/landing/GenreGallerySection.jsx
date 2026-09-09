import React from 'react';
import { motion } from 'motion/react';
import { fadeUp } from './landingData';
import lofiChillBeatsPng from '../../assets/lofi_chill_beats.png';
import albumArtNeonVibesPng from '../../assets/album_art_neon_vibes.png';
import albumGridPng from '../../assets/album_grid.png';

/**
 * GenreGallerySection
 * Visual showcase of diverse genres (Lo-Fi, Synthwave, Multi-genre album catalog).
 */
export default function GenreGallerySection() {
  const cards = [
    {
      img: lofiChillBeatsPng,
      alt: "Cozy Lo-Fi Study Beats Studio Illustration",
      title: "Lo-Fi & Chill Beats",
      tag: "Study & Relax",
      tagColor: "var(--accent-green)",
      tagBg: "rgba(29,185,84,0.1)",
      desc: "Download aesthetic rainy night chillhop and study sessions for offline focus sessions."
    },
    {
      img: albumArtNeonVibesPng,
      alt: "Cyberpunk Synthwave Neon Album Art",
      title: "Synthwave & Electronic",
      tag: "EDM & Retro",
      tagColor: "var(--accent-indigo)",
      tagBg: "rgba(108,92,231,0.1)",
      desc: "High-voltage electronic synthesizers and retro cyberpunk tracks extracted with zero clipping."
    },
    {
      img: albumGridPng,
      alt: "Multi-Genre Spotify Album Art Catalog",
      title: "Multi-Genre Playlists",
      tag: "Full Catalog",
      tagColor: "var(--accent-blue)",
      tagBg: "rgba(59,130,246,0.1)",
      desc: "Pop, acoustic folk, disco funk, and rap playlists — saved directly to your local PC."
    }
  ];

  return (
    <section className="section-light" aria-label="Visual Sound Gallery Showcase">
      <div className="section-wrap">
        <div className="section-inner">
          <motion.p className="section-eyebrow" {...fadeUp(0)}>
            Explore Every Genre
          </motion.p>
          <motion.h2 className="section-title" {...fadeUp(0.06)}>
            Curated Sound &amp; Album Artworks.<br />
            <span className="text-animated-gradient-light">Downloaded in high resolution.</span>
          </motion.h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, marginTop: 40 }}>
            {cards.map((c, idx) => (
              <motion.div
                key={c.title}
                className="feature-card"
                style={{ padding: 0, overflow: 'hidden', borderRadius: 28 }}
                whileHover={{ y: -6 }}
                {...fadeUp(0.1 + idx * 0.08)}
              >
                <img
                  src={c.img}
                  alt={c.alt}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `/assets/${c.img.split('/').pop()}`; }}
                  style={{ width: '100%', height: 220, objectFit: 'cover' }}
                />
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{c.title}</h3>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.tagColor, background: c.tagBg, padding: '2px 8px', borderRadius: 10 }}>
                      {c.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5 }}>
                    {c.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
