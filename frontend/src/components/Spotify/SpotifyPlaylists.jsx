import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListMusic, Search, Disc, Loader2 } from 'lucide-react';
import { SkeletonGrid } from '../ui/SkeletonCard';

/**
 * SpotifyPlaylists — glassmorphic cover-art grid with motion stagger entrance.
 * Hover reveals a green glow halo; active playlist card gets a green border.
 */
export default function SpotifyPlaylists({
  playlists,
  onSelectPlaylist,
  isLoading,        // loading tracks for a specific playlist
  activePlaylistId,
  isLoadingPlaylists, // loading the playlist list itself
}) {
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoadingPlaylists) {
    return <SkeletonGrid count={12} />;
  }

  if (!playlists || playlists.length === 0) {
    return (
      <motion.div
        className="glass-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}
      >
        <ListMusic size={40} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
        <p style={{ fontSize: 14 }}>No Spotify playlists found on your account.</p>
      </motion.div>
    );
  }

  const filtered = playlists.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.owner && p.owner.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{playlists.length}</strong> playlists · click to inspect &amp; download
        </p>
        <div className="filter-input-wrapper">
          <Search size={14} className="filter-input-icon" />
          <input
            id="playlist-search"
            type="text"
            className="filter-input"
            placeholder="Filter playlists…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className="playlist-grid"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filtered.map(pl => {
            const isSelected = activePlaylistId === pl.id;
            return (
              <motion.div
                key={pl.id}
                className={`playlist-card${isSelected ? ' active' : ''}`}
                variants={{
                  hidden:   { opacity: 0, y: 16, scale: 0.96 },
                  visible:  { opacity: 1, y: 0,  scale: 1,
                    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                }}
                whileHover={{ y: -5, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectPlaylist(pl.id)}
                layout
              >
                {/* Cover art */}
                {pl.image ? (
                  <img
                    src={pl.image}
                    alt={pl.name}
                    className="playlist-card-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="playlist-card-cover-placeholder">
                    <Disc size={48} />
                  </div>
                )}

                {/* Body */}
                <div className="playlist-card-body">
                  <div className="playlist-card-name" title={pl.name}>
                    {pl.name}
                  </div>
                  <div className="playlist-card-meta">
                    {pl.tracks_total} {pl.tracks_total === 1 ? 'track' : 'tracks'}
                    {pl.owner ? ` · ${pl.owner}` : ''}
                  </div>

                  {/* Loading spinner overlay on the active card */}
                  {isSelected && isLoading && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent-green)' }}>
                      <Loader2 size={12} className="spinner" />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>Loading tracks…</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && searchTerm && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>
          No playlists match "<strong>{searchTerm}</strong>"
        </p>
      )}
    </motion.div>
  );
}
