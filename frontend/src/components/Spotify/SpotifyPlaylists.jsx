import React, { useState } from 'react';
import { ListMusic, Search, Disc, ArrowRight, Loader2 } from 'lucide-react';

export default function SpotifyPlaylists({ playlists, onSelectPlaylist, isLoading, activePlaylistId }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!playlists || playlists.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
        <ListMusic size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
        <p style={{ fontSize: '14px' }}>No Spotify playlists found on your account.</p>
      </div>
    );
  }

  const filtered = playlists.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.owner && p.owner.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            My Spotify Playlists ({playlists.length})
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Select a playlist to inspect all songs and extract audio.
          </p>
        </div>

        <div style={{ position: 'relative', width: '220px' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Filter playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
        {filtered.map((pl) => {
          const isSelected = activePlaylistId === pl.id;

          return (
            <div
              key={pl.id}
              className="track-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--accent-green)' : undefined,
                background: isSelected ? 'rgba(29, 185, 84, 0.1)' : undefined
              }}
              onClick={() => onSelectPlaylist(pl.id)}
            >
              {pl.image ? (
                <img
                  src={pl.image}
                  alt={pl.name}
                  style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '8px',
                    background: 'rgba(29, 185, 84, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-green)',
                    flexShrink: 0
                  }}
                >
                  <Disc size={24} />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={pl.name}>
                  {pl.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {pl.tracks_total} {pl.tracks_total === 1 ? 'track' : 'tracks'} {pl.owner ? `• ${pl.owner}` : ''}
                </div>
              </div>

              <div style={{ color: isSelected ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                {isSelected && isLoading ? <Loader2 size={16} className="spinner" /> : <ArrowRight size={16} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
