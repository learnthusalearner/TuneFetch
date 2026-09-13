import React from 'react';
import GithubIcon from '../ui/GithubIcon';

/**
 * LandingFooter
 * Clean semantic footer with meta keywords and brand summary.
 */
export default function LandingFooter({ onPrivacy }) {
  const chips = ['320 kbps MP3', 'PKCE OAuth 2.0', 'Neon DB Caching', 'Free Converter', 'Open Source'];

  return (
    <footer className="landing-footer" role="contentinfo">
      <div className="landing-footer-wordmark">TuneFetch</div>
      <p className="landing-footer-sub">
        The #1 High-Fidelity Spotify Downloader &amp; 320 kbps MP3 Converter · Free to use
      </p>
      <div style={{ display: 'flex', gap: 24, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {chips.map((t) => (
          <span key={t} style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
            {t}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 14, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a
          href="https://github.com/learnthusalearner/TuneFetch"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.65)',
            fontSize: 12,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
          title="View TuneFetch Source Code on GitHub"
        >
          <GithubIcon size={14} />
          <span>Star on GitHub</span>
        </a>

        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>•</span>
        <button
          onClick={onPrivacy}
          style={{
            background: 'none',
            border: 'none',
            color: '#1DB954',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0
          }}
        >
          🛡️ Privacy Policy &amp; Security Guarantee
        </button>
      </div>

    </footer>
  );
}
