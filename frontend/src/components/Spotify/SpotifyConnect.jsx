import React from 'react';
import { motion } from 'motion/react';
import { Music2, LogOut, CheckCircle2 } from 'lucide-react';

/**
 * SpotifyConnect — redesigned hero connect card matching the landing page aesthetic.
 * Shows a rich glassmorphic card when not connected; a compact connected status bar when linked.
 */
export default function SpotifyConnect({ spotifyStatus, onConnect, onDisconnect, isLoading }) {
  const isConnected = spotifyStatus?.connected;
  const user = spotifyStatus?.spotify_user;

  if (isConnected) {
    return (
      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderLeft: '3px solid var(--accent-green)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(29,185,84,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-green)',
          }}>
            <Music2 size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.display_name || user?.id || 'Connected Account'}
              </span>
              <CheckCircle2 size={13} color="var(--accent-green)" />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Spotify Connected · playlist-read scope
            </span>
          </div>
        </div>
        <button
          className="icon-btn"
          onClick={onDisconnect}
          disabled={isLoading}
          style={{
            fontSize: 12,
            padding: '7px 14px',
            color: '#f87171',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Log out or connect a different Spotify account"
        >
          <LogOut size={13} />
          <span>Switch / Logout</span>
        </button>
      </motion.div>
    );
  }

  /* ── Not connected hero card ─────────────────────────────── */
  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: '48px 32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 20, textAlign: 'center',
        background: 'var(--bg-white)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Icon */}
      <motion.div
        style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--accent-green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#000',
          boxShadow: '0 4px 24px rgba(29,185,84,0.35)',
        }}
        animate={{ boxShadow: ['0 4px 20px rgba(29,185,84,0.3)', '0 4px 36px rgba(29,185,84,0.55)', '0 4px 20px rgba(29,185,84,0.3)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Music2 size={34} strokeWidth={2.2} />
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 440 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
          Connect Your Spotify Account
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Authorize TuneFetch via Spotify OAuth to access your private &amp; collaborative
          playlists and start downloading in ultra-high quality.
        </p>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['🔒 PKCE OAuth', '✓ No token storage', '🎵 All playlists', '⚡ 320 kbps'].map(f => (
          <span
            key={f}
            style={{
              fontSize: 12, fontWeight: 500,
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-full)',
              padding: '5px 14px',
              color: 'var(--text-body)',
            }}
          >
            {f}
          </span>
        ))}
      </div>

      <motion.button
        id="spotify-connect-btn"
        className="btn-primary-green"
        onClick={onConnect}
        disabled={isLoading}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        style={{ fontSize: '15px', padding: '15px 36px', marginTop: 4 }}
      >
        <Music2 size={20} />
        Connect with Spotify
      </motion.button>
      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '-8px' }}>
        Log into any Spotify Free or Premium account · Switch accounts anytime
      </span>
    </motion.div>
  );
}
