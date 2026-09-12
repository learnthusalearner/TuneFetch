import React from 'react';
import { motion } from 'motion/react';
import { Music, Home, LogOut, Download } from 'lucide-react';
import { api } from '../../services/api';

/**
 * Navbar — top bar used inside DashboardPage.
 * Shows brand logo, navigation links, and Spotify user avatar.
 */
export default function Navbar({ spotifyUser, onGoHome, onLogout }) {

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


        {/* Spotify user avatar & Switch/Logout button */}
        {spotifyUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              title={`Logged in as ${spotifyUser.display_name || 'Spotify User'}`}
              style={{ cursor: 'default', display: 'flex', alignItems: 'center', gap: '6px' }}
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
              {spotifyUser.display_name && (
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {spotifyUser.display_name}
                </span>
              )}
            </div>

            {onLogout && (
              <button
                className="icon-btn"
                onClick={onLogout}
                title="Log out or switch Spotify account"
                style={{
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.header>
  );
}
