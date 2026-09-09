import React from 'react';

/**
 * SkeletonCard — shimmer placeholder shown while playlists are loading.
 * Renders a grid of CSS-animated shimmer cards that match the playlist card dimensions.
 */
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      {/* Cover art placeholder */}
      <div
        className="skeleton"
        style={{ width: '100%', aspectRatio: '1', borderRadius: '0' }}
      />
      {/* Text lines */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton" style={{ height: '13px', width: '80%' }} />
        <div className="skeleton" style={{ height: '11px', width: '50%' }} />
      </div>
    </div>
  );
}

/**
 * SkeletonGrid — renders n skeleton cards in the playlist grid layout.
 */
export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="playlist-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
