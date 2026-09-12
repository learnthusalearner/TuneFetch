import React from 'react';

/**
 * LandingFooter
 * Clean semantic footer with meta keywords and brand summary.
 */
export default function LandingFooter() {
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
      <div style={{ marginTop: 12 }}>
        <a href="/privacy" style={{ fontSize: 12, color: '#1DB954', fontWeight: 600, textDecoration: 'none' }}>
          🛡️ Privacy Policy &amp; Security Guarantee
        </a>
      </div>
    </footer>
  );
}
