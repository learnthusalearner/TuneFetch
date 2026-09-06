import React, { useState } from 'react';
import { X, Search, Music, Download, Clock, Disc3, Check, Loader2, CheckSquare, Square, FolderDown } from 'lucide-react';
import { AUDIO_FORMATS } from '../../constants';

export default function PlaylistTracksModal({
  playlist,
  tracks,
  isOpen,
  onClose,
  onStartDownload,
  onDownloadSingleTrack,
  isLoadingTracks,
  isStartingDownload,
  downloadingTrackId
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('mp3-320');
  const [selectedTrackIds, setSelectedTrackIds] = useState(new Set());

  if (!isOpen) return null;

  const formatDuration = (ms) => {
    if (!ms) return '--:--';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredTracks = (tracks || []).filter((t) => {
    const title = (t.song_name || t.title || t.name || '').toLowerCase();
    const artist = (t.artist_name || t.artist || (Array.isArray(t.artists) ? t.artists.join(', ') : t.artists) || '').toLowerCase();
    const album = (t.album_name || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return title.includes(q) || artist.includes(q) || album.includes(q);
  });

  const toggleTrackSelection = (trackId) => {
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTrackIds.size === filteredTracks.length && filteredTracks.length > 0) {
      setSelectedTrackIds(new Set());
    } else {
      const allIds = filteredTracks.map((t) => t.id || t.spotifyTrackId);
      setSelectedTrackIds(new Set(allIds));
    }
  };

  const isAllSelected = filteredTracks.length > 0 && selectedTrackIds.size === filteredTracks.length;

  const handleBatchDownloadClick = () => {
    const trackIdsArray = selectedTrackIds.size > 0 ? Array.from(selectedTrackIds) : null;
    onStartDownload(playlist?.id, selectedFormat, trackIdsArray);
  };

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
          maxWidth: '820px',
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

        {/* Search, Format and Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search songs or artists..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Select All Toggle */}
            {tracks && tracks.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  color: isAllSelected ? 'var(--accent-green)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {isAllSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
              </button>
            )}

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
                { id: 'mp3-320', label: 'MP3 • 320 kbps' },
                { id: 'mp3-256', label: 'MP3 • 256 kbps' },
                { id: 'mp3-128', label: 'MP3 • 128 kbps' },
                { id: 'best-audio', label: 'Original Stream' }
              ]).map((fmt) => (
                <option key={fmt.id || fmt.value} value={fmt.id || fmt.value} style={{ background: '#101522', color: '#fff' }}>
                  {fmt.label}
                </option>
              ))}
            </select>

            {/* Batch Folder Download Button */}
            <button
              className="btn-download-action"
              onClick={handleBatchDownloadClick}
              disabled={isLoadingTracks || isStartingDownload || !tracks || tracks.length === 0}
              style={{ padding: '10px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {isStartingDownload ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Preparing Folder...</span>
                </>
              ) : selectedTrackIds.size > 0 ? (
                <>
                  <FolderDown size={16} />
                  <span>Download Selected Folder ({selectedTrackIds.size} Songs)</span>
                </>
              ) : (
                <>
                  <FolderDown size={16} />
                  <span>Download All as Folder ({tracks?.length || 0} Songs)</span>
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
            filteredTracks.map((t, index) => {
              const trackId = t.id || t.spotifyTrackId || String(index);
              const isSelected = selectedTrackIds.has(trackId);
              const isSingleDownloading = downloadingTrackId === trackId;
              const songTitle = t.song_name || t.title || t.name;
              const songArtist = t.artist_name || t.artist || (Array.isArray(t.artists) ? t.artists.join(', ') : t.artists);

              return (
                <div
                  key={trackId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(29, 185, 84, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid rgba(29, 185, 84, 0.3)' : '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Selection Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleTrackSelection(trackId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isSelected ? 'var(--accent-green)' : 'var(--text-muted)',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={isSelected ? 'Deselect song' : 'Select song'}
                  >
                    {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
                  </button>

                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '20px', textAlign: 'right' }}>
                    {index + 1}
                  </span>

                  {t.thumbnail ? (
                    <img
                      src={t.thumbnail}
                      alt={songTitle}
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
                      {songTitle}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {songArtist} {t.album_name ? `• ${t.album_name}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '11px' }}>
                    <Clock size={12} />
                    <span>{formatDuration(t.duration_ms)}</span>
                  </div>

                  {/* Individual Download Song Button */}
                  {onDownloadSingleTrack && (
                    <button
                      className="icon-btn"
                      onClick={() => onDownloadSingleTrack(t, selectedFormat, trackId)}
                      disabled={isSingleDownloading}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-glass)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title="Download only this track as MP3"
                    >
                      {isSingleDownloading ? (
                        <Loader2 size={13} className="spinner" style={{ color: 'var(--accent-green)' }} />
                      ) : (
                        <Download size={13} style={{ color: 'var(--accent-green)' }} />
                      )}
                      <span>Track (.mp3)</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-glass)',
            paddingTop: '14px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {selectedTrackIds.size > 0 ? (
              <span><strong>{selectedTrackIds.size}</strong> of {filteredTracks.length} songs selected</span>
            ) : (
              <span>All <strong>{filteredTracks.length}</strong> songs will be packaged into a single folder</span>
            )}
          </div>

          <button
            className="btn-download-action"
            onClick={handleBatchDownloadClick}
            disabled={isLoadingTracks || isStartingDownload || !tracks || tracks.length === 0}
            style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {isStartingDownload ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Preparing Folder...</span>
              </>
            ) : (
              <>
                <FolderDown size={18} />
                <span>
                  {selectedTrackIds.size > 0
                    ? `Download Selected Folder (${selectedTrackIds.size} Songs)`
                    : `Download All Songs as Folder (${tracks?.length || 0})`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

