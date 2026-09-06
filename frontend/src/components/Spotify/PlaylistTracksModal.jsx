import React, { useState } from 'react';
import { X, Search, Music, Download, Clock, Disc3, Check, Loader2 } from 'lucide-react';
import { AUDIO_FORMATS } from '../../constants';

export default function PlaylistTracksModal({
  playlist,
  tracks,
  isOpen,
  onClose,
  onStartDownload,
  isLoadingTracks,
  isStartingDownload
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('mp3');

  if (!isOpen) return null;

  const formatDuration = (ms) => {
    if (!ms) return '--:--';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredTracks = (tracks || []).filter((t) =>
    (t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.artists && t.artists.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.album_name && t.album_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 13, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          background: 'var(--bg-card)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(29, 185, 84, 0.15)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {playlist?.image ? (
              <img
                src={playlist.image}
                alt={playlist.name}
                style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '10px',
                  background: 'rgba(29, 185, 84, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-green)'
                }}
              >
                <Disc3 size={28} />
              </div>
            )}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {playlist?.name || 'Spotify Playlist'}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {tracks ? `${tracks.length} tracks extracted` : 'Loading tracks...'} • Owner: {playlist?.owner || 'Spotify User'}
              </p>
            </div>
          </div>

          <button
            className="icon-btn"
            onClick={onClose}
            style={{ borderRadius: '50%', padding: '8px' }}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search and Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search extracted tracks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Format Selector */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              style={{
                padding: '9px 14px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {(AUDIO_FORMATS || [
                { value: 'mp3', label: 'MP3' },
                { value: 'm4a', label: 'M4A / AAC' },
                { value: 'flac', label: 'FLAC' },
                { value: 'wav', label: 'WAV' },
                { value: 'opus', label: 'OPUS' }
              ]).map((fmt) => (
                <option key={fmt.value} value={fmt.value} style={{ background: '#101522', color: '#fff' }}>
                  {fmt.label}
                </option>
              ))}
            </select>

            {/* Download All Button */}
            <button
              className="btn-download-action"
              onClick={() => onStartDownload(playlist?.id, selectedFormat)}
              disabled={isLoadingTracks || isStartingDownload || !tracks || tracks.length === 0}
              style={{ padding: '9px 20px', fontSize: '13px' }}
            >
              {isStartingDownload ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download All ({tracks?.length || 0})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '420px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            paddingRight: '4px'
          }}
        >
          {isLoadingTracks ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="spinner" style={{ margin: '0 auto 12px auto', color: 'var(--accent-green)' }} />
              <p style={{ fontSize: '14px' }}>Extracting all songs & metadata via Spotify API pagination...</p>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Music size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <p style={{ fontSize: '14px' }}>No tracks match your search.</p>
            </div>
          ) : (
            filteredTracks.map((t, index) => (
              <div
                key={t.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  transition: 'background 0.2s ease'
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '24px', textAlign: 'right' }}>
                  {index + 1}
                </span>

                {t.thumbnail ? (
                  <img
                    src={t.thumbnail}
                    alt={t.title}
                    style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      flexShrink: 0
                    }}
                  >
                    <Music size={16} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.artists} {t.album_name ? `• ${t.album_name}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  <Clock size={12} />
                  <span>{formatDuration(t.duration_ms)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
