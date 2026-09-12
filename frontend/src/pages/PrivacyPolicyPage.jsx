import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, Trash2, Code2, Server, CheckCircle2, Music } from 'lucide-react';

export default function PrivacyPolicyPage({ onGoHome }) {
  const cardStyle = {
    padding: '28px',
    borderRadius: '20px',
    background: '#ffffff',
    border: '1px solid var(--border, rgba(33, 34, 38, 0.08))',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)'
  };

  const iconStyle = {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(29, 185, 84, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1DB954',
    flexShrink: 0
  };

  const headingStyle = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary, #121317)'
  };

  const textStyle = {
    margin: 0,
    color: 'var(--text-body, #45474d)',
    fontSize: '14.5px',
    lineHeight: '1.7'
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-canvas, #f8f9fc)',
        color: 'var(--text-primary, #121317)',
        fontFamily: 'var(--font-main, Inter, sans-serif)',
        padding: '40px 20px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '840px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Back Navigation & Brand Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <button
            onClick={onGoHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '9999px',
              background: '#ffffff',
              border: '1px solid var(--border, rgba(33, 34, 38, 0.12))',
              color: 'var(--text-primary, #121317)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: '#1DB954',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Music size={16} strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary, #121317)' }}>
              TuneFetch
            </span>
          </div>
        </div>

        {/* Page Title Header */}
        <div style={{ ...cardStyle, background: '#ffffff', border: '1px solid rgba(29, 185, 84, 0.25)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#1DB954',
              fontSize: '12.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}
          >
            <ShieldCheck size={16} />
            <span>Privacy &amp; Security Policy</span>
          </div>

          <h1
            style={{
              margin: '0 0 10px',
              fontSize: 'clamp(26px, 4vw, 34px)',
              fontWeight: 800,
              color: 'var(--text-primary, #121317)',
              letterSpacing: '-0.02em'
            }}
          >
            TuneFetch Privacy Policy
          </h1>

          <p style={{ ...textStyle, fontSize: '14px', color: 'var(--text-muted, #6b6d75)' }}>
            Last updated: March 2026 · Transparent, open-source audio extraction architecture.
          </p>

          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(29, 185, 84, 0.08)',
              border: '1px solid rgba(29, 185, 84, 0.2)',
              fontSize: '13.5px',
              color: 'var(--text-body, #45474d)',
              lineHeight: '1.6'
            }}
          >
            <strong>Core Commitment:</strong> TuneFetch is free, open-source software built to respect your privacy.
            We do NOT sell user data, we do NOT inject tracking advertisements, and we never ask for your Spotify password.
          </div>
        </div>

        {/* 1. Spotify PKCE OAuth */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={iconStyle}><Lock size={20} /></div>
            <h3 style={headingStyle}>1. Spotify Authentication (PKCE OAuth 2.0)</h3>
          </div>
          <p style={textStyle}>
            TuneFetch uses official Spotify OAuth with Proof Key for Code Exchange (PKCE).
            When you connect your Spotify account, the authentication handshake takes place entirely on Spotify's official servers.
            TuneFetch never receives or stores your Spotify account password. We only request read-only access to view authorized playlists and track names.
          </p>
        </div>

        {/* 2. Local Processing */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={iconStyle}><Server size={20} /></div>
            <h3 style={headingStyle}>2. 100% Local Device Processing</h3>
          </div>
          <p style={textStyle}>
            Unlike generic cloud converters that upload your audio to third-party servers, TuneFetch executes conversions directly on your local computer via our lightweight Python CLI engine.
            Downloaded 320 kbps MP3 files are saved directly into your personal <code>Downloads/Thanks for downloading</code> folder and are never stored on TuneFetch servers.
          </p>
        </div>

        {/* 3. Temporary Cloud Sessions */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={iconStyle}><Trash2 size={20} /></div>
            <h3 style={headingStyle}>3. Temporary Session Coordination</h3>
          </div>
          <p style={textStyle}>
            When you start a session on our website (e.g. <code>TF-8429</code>), our Neon PostgreSQL database coordinates the session code and track metadata for 24 hours.
            Expired sessions are automatically cleaned up and purged by our automated retention cycle.
          </p>
        </div>

        {/* 4. Open Source Transparency */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={iconStyle}><Code2 size={20} /></div>
            <h3 style={headingStyle}>4. Open Source &amp; MIT License</h3>
          </div>
          <p style={textStyle}>
            TuneFetch source code is publicly accessible on GitHub. Any developer or security researcher can inspect, audit, and verify our codebase, dependencies, and network requests.
          </p>
        </div>

        {/* 5. User Responsibility */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={iconStyle}><CheckCircle2 size={20} /></div>
            <h3 style={headingStyle}>5. Acceptable Use &amp; Terms</h3>
          </div>
          <p style={textStyle}>
            TuneFetch is provided for personal backup and educational purposes. You are responsible for ensuring that your use of the application complies with applicable copyright laws, local regulations, and the terms of third-party platforms.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid var(--border, rgba(33, 34, 38, 0.1))',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text-muted, #6b6d75)' }}>
            © 2026 TuneFetch Open Source Project. Released under MIT License.
          </span>

          <button
            onClick={onGoHome}
            style={{
              background: 'none',
              border: 'none',
              color: '#1DB954',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Return to Home →
          </button>
        </div>
      </div>
    </div>
  );
}