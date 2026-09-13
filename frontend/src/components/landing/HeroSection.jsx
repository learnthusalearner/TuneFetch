import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, ArrowRight, CheckCircle, Zap, Layers, Radio } from 'lucide-react';
import StarfieldBg from '../layout/StarfieldBg';
import { api } from '../../services/api';

// Direct 100% reliable PNG imports
import image1Png from '../../assets/image.png';
import image2Png from '../../assets/image2.png';
import heroAlbumsPng from '../../assets/hero_albums.png';
import playerWidgetPng from '../../assets/player_widget.png';

/**
 * HeroSection
 * Primary above-the-fold showcase with animated typography, CTAs, and 4-card UI preview.
 */
export default function HeroSection({ onLaunch, scrollToComparison, isConnected, displayName }) {
  return (
    <header style={{ position: 'relative' }}>
      <StarfieldBg />

      <div className="landing-hero">
        {/* Animated equalizer badge */}
        <motion.div
          className="landing-badge"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div className="equalizer-container">
            <div className="equalizer-bar" />
            <div className="equalizer-bar" />
            <div className="equalizer-bar" />
            <div className="equalizer-bar" />
          </div>
          <span>#1 High-Fidelity Spotify Downloader · 320 kbps MP3</span>
        </motion.div>

        {/* H1 SEO Headline */}
        <motion.h1
          className="landing-headline"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          Unleash Your Spotify Playlists.{' '}
          <br />
          <span className="text-animated-gradient">320 kbps Studio Sound.</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          className="landing-sub"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
        >
          Convert your favorite Spotify tracks into pristine 320 kbps MP3 audio in seconds.
          Zero ads, zero subscriptions, and 100% private PKCE OAuth security. Over 14,000+ songs processed.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="landing-cta-row"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
          style={{ flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}
        >
          <motion.button
            id="hero-cta-main"
            className="btn-primary"
            onClick={onLaunch}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontSize: '15.5px',
              padding: '15px 32px',
              gap: '10px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1DB954 0%, #10b981 100%)',
              color: '#000',
              borderRadius: '14px',
              border: 'none',
              boxShadow: '0 8px 30px rgba(29, 185, 84, 0.45)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <Music size={18} />
            <span>{isConnected ? 'Open Dashboard Workspace' : 'Launch Web App Dashboard'}</span>
            <ArrowRight size={16} />
          </motion.button>

          <motion.div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 22px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          >
            <span style={{ color: '#94a3b8' }}>CLI Command:</span>
            <code style={{ color: '#10b981', fontWeight: 700 }}>tunefetch TF-XXXX</code>
          </motion.div>
        </motion.div>

        {/* Connected indicator */}
        <AnimatePresence>
          {isConnected && (
            <motion.div
              className="connected-pill"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ marginBottom: 0 }}
            >
              <CheckCircle size={14} color="var(--accent-green)" />
              Logged in as <strong style={{ color: 'var(--text-primary)' }}>{displayName}</strong>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4-IMAGE HERO GRID SHOWCASE */}
        <motion.div
          className="landing-hero-image-wrapper"
          style={{ marginTop: 56, position: 'relative' }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.44, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Floating chips */}
          <div className="hero-chip hero-chip-1" style={{ zIndex: 10 }}>
            <span style={{ color: 'var(--accent-green)', fontSize: 16 }}>✓</span>
            <span>320 kbps Studio Quality</span>
          </div>
          <div className="hero-chip hero-chip-2" style={{ zIndex: 10 }}>
            <span style={{ fontSize: 16 }}>📁</span>
            <span>Direct Local Save</span>
          </div>
          <div className="hero-chip hero-chip-3" style={{ zIndex: 10 }}>
            <Radio size={14} color="var(--accent-green)" />
            <span className="hero-chip-green">Neon DB Cache Hit</span>
          </div>

          <div className="hero-showcase-grid">
            {/* CARD 1: Spotify Connect UI */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--bg-white)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '8px 14px', background: 'var(--bg-section)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                <Music size={13} color="var(--accent-green)" />
                <span>Spotify Connect View</span>
              </div>
              <img
                src={image1Png}
                alt="TuneFetch Spotify Interface Showcase"
                loading="eager"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/image.png'; }}
                style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
              />
            </motion.div>

            {/* CARD 2: Download Controls */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--bg-white)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '8px 14px', background: 'var(--bg-section)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                <Zap size={13} color="var(--accent-green)" />
                <span>Download Controls</span>
              </div>
              <img
                src={image2Png}
                alt="TuneFetch Spotify Downloader Stats & Controls"
                loading="eager"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/image2.png'; }}
                style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
              />
            </motion.div>

            {/* CARD 3: 14,000+ Playlist Library */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--bg-white)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '8px 14px', background: 'var(--bg-section)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                <Layers size={13} color="var(--accent-green)" />
                <span>14,000+ Playlist Library</span>
              </div>
              <img
                src={heroAlbumsPng}
                alt="TuneFetch Spotify Playlist Grid Showcase"
                loading="eager"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/hero_albums.png'; }}
                style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
              />
            </motion.div>

            {/* CARD 4: 320 kbps Studio Player */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--bg-white)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '8px 14px', background: 'var(--bg-section)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                <Radio size={13} color="var(--accent-green)" />
                <span>320 kbps Studio Player</span>
              </div>
              <img
                src={playerWidgetPng}
                alt="TuneFetch 320kbps Spotify Player Interface"
                loading="eager"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/player_widget.png'; }}
                style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
