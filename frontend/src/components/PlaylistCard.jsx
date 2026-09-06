import React, { useState } from 'react';
import { ListMusic, Download, Search } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

export default function PlaylistCard({ playlist, onDownloadTrack, activeTaskId, activeTrackIndex }) {
  const [search, setSearch] = useState('');
  const [selectedFormat] = useState('mp3-320');

  if (!playlist || !playlist.tracks) return null;

  const filteredTracks = playlist.tracks.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q))
    );
  });

  return (
    <div className="glass-panel playlist-container">
      <div className="playlist-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {playlist.thumbnail ? (
            <img
              src={playlist.thumbnail}
              alt={playlist.title}
              style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '8px',
                background: 'rgba(29, 185, 84, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-green)'
              }}
            >
              <ListMusic size={28} />
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {playlist.title}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {playlist.track_count} tracks • {playlist.platform.toUpperCase()} Playlist
            </p>
          </div>
        </div>

        {/* Track search filter */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
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

      <div className="track-list">
        {filteredTracks.map((track, idx) => {
          const isDownloadingThis = activeTrackIndex === track.id;

          return (
            <div key={track.id ?? idx} className="track-item">
              <div className="track-left">
                <span className="track-index">{(idx + 1).toString().padStart(2, '0')}</span>
                <div className="track-details">
                  <span className="track-name">{track.title}</span>
                  <span className="track-artist">
                    {track.artist || 'Unknown Artist'} {track.duration ? `• ${formatDuration(track.duration)}` : ''}
                  </span>
                </div>
              </div>

              <button
                className="btn-track-dl"
                disabled={Boolean(activeTaskId)}
                onClick={() =>
                  onDownloadTrack({
                    url: track.url || track.search_query || track.title,
                    format: selectedFormat,
                    title: track.title,
                    artist: track.artist,
                    thumbnail: track.thumbnail || playlist.thumbnail,
                    trackId: track.id
                  })
                }
              >
                {isDownloadingThis ? (
                  <>
                    <div className="spinner" style={{ width: '12px', height: '12px' }} />
                    <span>Processing</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
