import React from 'react';
import { MARQUEE_ITEMS } from './landingData';

/**
 * TickerMarquee
 * Infinite horizontal scrolling ticker with core product highlights.
 */
export default function TickerMarquee() {
  return (
    <section
      aria-label="Feature Highlights Ticker"
      style={{
        background: 'var(--bg-dark)',
        padding: '16px 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <div className="marquee-wrapper">
        <div className="marquee-content">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <span
              key={idx}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '0.5px'
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
