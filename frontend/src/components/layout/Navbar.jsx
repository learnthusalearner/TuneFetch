import React from 'react';
import { motion } from 'motion/react';
import { Music, History, CheckCircle2, AlertCircle, Home } from 'lucide-react';

/**
 * Navbar — top bar used inside DashboardPage.
 * Shows brand logo, health status pill, optional Spotify user avatar, and history button.
 */
export default function Navbar({ health, onToggleHistory, historyCount, spotifyUser, onGoHome }) {
  const isOnline   = health?.status === 'healthy';
  const hasFfmpeg  = health?.ffmpeg_available;

  const initials = spotifyUser?.display_name
    ? spotifyUser.display_name.slice(0, 2).toUpperCase()
    : null;

  return (
    <motion.header
      className="navbar"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Brand */}
      <div
        className="brand-wrapper"
        onClick={onGoHome}
        style={{ cursor: onGoHome ? 'pointer' : 'default' }}
        title="Return to Landing Page"
      >
        <div className="brand-logo-icon">
          <Music size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="brand-title">TuneFetch</h1>
          <p className="brand-subtitle">High-Fidelity Spotify Downloader</p>
        </div>
      </div>

      {/* Actions */}
      <div className="header-actions">
        {/* Landing page link */}
        {onGoHome && (
          <button
            className="icon-btn"
            onClick={onGoHome}
            title="Go to Landing Page"
          >
            <Home size={16} />
            <span>Landing Page</span>
          </button>
        )}
        {/* Engine health pill */}
        <div
          className="badge-tag"
          style={{
            background: isOnline ? 'rgba(29,185,84,0.1)'  : 'rgba(240,71,71,0.1)',
            color:      isOnline ? 'var(--accent-green-bright)' : '#fda4af',
            border: `1px solid ${isOnline ? 'rgba(29,185,84,0.25)' : 'rgba(240,71,71,0.25)'}`,
            padding: '6px 12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title={
            isOnline
              ? hasFfmpeg ? 'Engine Ready (FFmpeg active)' : 'Backend Ready'
              : 'Backend offline'
          }
        >
          {isOnline
            ? <CheckCircle2 size={13} />
            : <AlertCircle  size={13} />}
          <span style={{ fontSize: '11px', fontWeight: 700 }}>
            {isOnline ? (hasFfmpeg ? 'MP3 Engine' : 'Online') : 'Offline'}
          </span>
        </div>

        {/* History button */}
        <button
          id="history-btn"
          className="icon-btn"
          onClick={onToggleHistory}
          title="View download history"
        >
          <History size={16} />
          <span>History</span>
          {historyCount > 0 && (
            <span
              style={{
                background: 'var(--accent-green)',
                color: '#000',
                borderRadius: '50%',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: 800,
              }}
            >
              {historyCount}
            </span>
          )}
        </button>

        {/* Spotify user avatar */}
        {spotifyUser && (
          <div
            title={spotifyUser.display_name || 'Spotify User'}
            style={{ cursor: 'default' }}
          >
            {spotifyUser.images?.[0]?.url ? (
              <img
                src={spotifyUser.images[0].url}
                alt={spotifyUser.display_name}
                className="user-avatar"
              />
            ) : (
              <div className="user-avatar-placeholder">
                {initials || '♪'}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.header>
  );
}
