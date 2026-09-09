import React, { useMemo } from 'react';

/**
 * StarfieldBg — CSS-animated ambient starfield for the landing page.
 * Renders ~70 tiny dots at random positions with staggered twinkle animations.
 * Kept intentionally subtle (very low opacity) so it never competes with content.
 */
export default function StarfieldBg() {
  const stars = useMemo(() => {
    const items = [];
    const count = 70;
    for (let i = 0; i < count; i++) {
      const size  = Math.random() * 2 + 0.5;          // 0.5–2.5 px
      const x     = Math.random() * 100;
      const y     = Math.random() * 100;
      const dur   = (Math.random() * 5 + 3).toFixed(1);  // 3–8s
      const delay = (Math.random() * 8).toFixed(1);       // 0–8s
      const maxOp = (Math.random() * 0.4 + 0.15).toFixed(2); // 0.15–0.55
      items.push({ id: i, size, x, y, dur, delay, maxOp });
    }
    return items;
  }, []);

  return (
    <div className="starfield" aria-hidden="true">
      {/* Gradient mesh overlay */}
      <div className="landing-gradient-mesh" />

      {/* Stars */}
      {stars.map(s => (
        <span
          key={s.id}
          className="star"
          style={{
            left:  `${s.x}%`,
            top:   `${s.y}%`,
            width:  `${s.size}px`,
            height: `${s.size}px`,
            '--dur':         `${s.dur}s`,
            '--delay':       `-${s.delay}s`,
            '--max-opacity': s.maxOp,
          }}
        />
      ))}
    </div>
  );
}
