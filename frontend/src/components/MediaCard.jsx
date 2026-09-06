import React, { useState } from 'react';
import { Download, Music, User, Disc3 } from 'lucide-react';
import { AUDIO_FORMATS } from '../constants';
import { formatDuration } from '../utils/formatters';

export default function MediaCard({ media, onDownload, isDownloading }) {
  const [selectedFormat, setSelectedFormat] = useState('mp3-320');

  if (!media) return null;

  const handleDownloadClick = () => {
    onDownload({
      url: media.original_url,
      format: selectedFormat,
      title: media.title,
      artist: media.artist,
      thumbnail: media.thumbnail
    });
  };

  return (
    <div className="glass-panel media-card">
      <div className="media-header-info">
        <div className="thumbnail-wrapper">
          {media.thumbnail ? (
            <img
              src={media.thumbnail}
              alt={media.title}
              className="media-thumbnail"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)'
              }}
            >
              <Music size={40} />
            </div>
          )}
          {media.duration > 0 && (
            <div className="duration-tag">
              {formatDuration(media.duration)}
            </div>
          )}
        </div>

        <div className="media-meta">
          <h2 className="media-title" title={media.title}>
            {media.title}
          </h2>

          <div className="media-artist">
            <User size={15} />
            <span>{media.artist || 'Unknown Artist'}</span>
          </div>

          <div className="media-platform-badge">
            <Disc3 size={14} color="var(--accent-cyan)" />
            <span>Source: {media.platform ? media.platform.toUpperCase() : 'WEB'}</span>
            {media.search_query && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                (Spotify track matched via YouTube audio)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="options-bar">
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
            SELECT AUDIO FORMAT & BITRATE:
          </div>
          <div className="quality-pills">
            {AUDIO_FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`quality-pill ${selectedFormat === f.id ? 'active' : ''}`}
                onClick={() => setSelectedFormat(f.id)}
              >
                <span>{f.label}</span>
                <span
                  style={{
                    fontSize: '10px',
                    opacity: 0.8,
                    background: selectedFormat === f.id ? 'rgba(29, 185, 84, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    padding: '2px 5px',
                    borderRadius: '4px'
                  }}
                >
                  {f.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-download-action"
          onClick={handleDownloadClick}
          disabled={isDownloading}
        >
          <Download size={18} />
          <span>{isDownloading ? 'Processing...' : 'Download MP3'}</span>
        </button>
      </div>
    </div>
  );
}
