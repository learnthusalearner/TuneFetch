import React, { useState } from 'react';
import {
  X, Search, Music, Download, Clock, Disc3, Loader2, CheckSquare,
  Square, Laptop, Copy, Check, ExternalLink, ShieldCheck, Sparkles
} from 'lucide-react';
import { AUDIO_FORMATS } from '../../constants';
import { api } from '../../services/api';

export default function PlaylistTracksModal({
  playlist,
  tracks,
  isOpen,
  onClose,
  onDownloadSingleTrack,
  isLoadingTracks,
  downloadingTrackId
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('mp3-320');
  const [selectedTrackIds, setSelectedTrackIds] = useState(new Set());
  const [isDispatchingDesktop, setIsDispatchingDesktop] = useState(false);
  const [desktopSuccessMsg, setDesktopSuccessMsg] = useState(null);
  const [cloudSessionCode, setCloudSessionCode] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [liveBatchStatus, setLiveBatchStatus] = useState(null);

  // Poll local desktop engine for live progress if session modal is open
  React.useEffect(() => {
    if (!showSessionModal || !cloudSessionCode) {
      setLiveBatchStatus(null);
      return;
    }

    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/local/progress/${cloudSessionCode}`, { mode: 'cors' });
        if (res.ok) {
          const data = await res.json();
          if (active && data?.batch) {
            setLiveBatchStatus(data.batch);
          }
        }
      } catch {}
    }, 750);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [showSessionModal, cloudSessionCode]);

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

  const getActiveTrackList = () => {
    if (selectedTrackIds.size > 0) {
      return (tracks || []).filter((t) => selectedTrackIds.has(t.id || t.spotifyTrackId));
    }
    return tracks || [];
  };

  const handleDesktopDownloadClick = async () => {
    setIsDispatchingDesktop(true);
    setDesktopSuccessMsg(null);
    const targetTracks = getActiveTrackList();

    try {
      // 1. Check if TuneFetch Desktop is open on localhost:8000
      const desktop = await api.checkLocalDesktopStatus();
      if (desktop.isRunning) {
        await api.sendToLocalDesktop({
          playlist_name: playlist?.name || 'Spotify Playlist',
          tracks: targetTracks,
          format: selectedFormat
        });
        setDesktopSuccessMsg(`⚡ Successfully sent ${targetTracks.length} tracks to TuneFetch Desktop! Files are downloading one by one to your PC's 'Downloads/Thanks for downloading' folder.`);
        return;
      }

      // 2. If desktop not directly responding via fetch, generate cloud session code (resolved via PostgreSQL)
      const sessionData = await api.createCloudSession({
        playlist_name: playlist?.name || 'Spotify Playlist',
        image: playlist?.image || '',
        tracks: targetTracks
      });
      setCloudSessionCode(sessionData.session_code);
      setShowSessionModal(true);
    } catch (err) {
      console.warn('Local desktop check failed, generating session code:', err);
      try {
        const sessionData = await api.createCloudSession({
          playlist_name: playlist?.name || 'Spotify Playlist',
          image: playlist?.image || '',
          tracks: targetTracks
        });
        setCloudSessionCode(sessionData.session_code);
        setShowSessionModal(true);
      } catch (err2) {
        alert('Could not start download: ' + (err2.message || err.message));
      }
    } finally {
      setIsDispatchingDesktop(false);
    }
  };

  const handleCopyCode = () => {
    if (!cloudSessionCode) return;
    navigator.clipboard.writeText(cloudSessionCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyJson = () => {
    const targetTracks = getActiveTrackList();
    const jsonStr = JSON.stringify(targetTracks, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
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

            {/* Quality Badge (Best Quality Forced) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(29, 185, 84, 0.1)',
                border: '1px solid rgba(29, 185, 84, 0.3)',
                borderRadius: '8px',
                color: '#1DB954',
                fontSize: '12px',
                fontWeight: 700
              }}
              title="All audio streams are automatically extracted at maximum 320 kbps bitrate"
            >
              <Sparkles size={14} />
              <span>320 kbps Ultra HQ MP3</span>
            </div>

            {/* Desktop Direct Local Download Button (Recommended) */}
            <button
              className="btn-download-action"
              onClick={handleDesktopDownloadClick}
              disabled={isLoadingTracks || isDispatchingDesktop || !tracks || tracks.length === 0}
              style={{
                padding: '10px 18px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #1DB954 0%, #10b981 100%)',
                boxShadow: '0 4px 18px rgba(29, 185, 84, 0.4)'
              }}
              title="Download on your PC via TuneFetch Desktop (Zero bot limits & 100% full speed)"
            >
              {isDispatchingDesktop ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Connecting Desktop...</span>
                </>
              ) : (
                <>
                  <Laptop size={16} />
                  <span>
                    {selectedTrackIds.size > 0
                      ? `Download on My PC (${selectedTrackIds.size})`
                      : `Download on My PC (${tracks?.length || 0})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Success Alert Banner */}
        {desktopSuccessMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <span>{desktopSuccessMsg}</span>
            <button
              type="button"
              onClick={() => setDesktopSuccessMsg(null)}
              style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer', fontSize: '16px' }}
            >
              ×
            </button>
          </div>
        )}

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Desktop Direct Local Download Button */}
            <button
              className="btn-download-action"
              onClick={handleDesktopDownloadClick}
              disabled={isLoadingTracks || isDispatchingDesktop || !tracks || tracks.length === 0}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #1DB954 0%, #10b981 100%)',
                boxShadow: '0 4px 20px rgba(29, 185, 84, 0.4)'
              }}
              title="Download full playlist directly onto your computer with zero bot blocks"
            >
              {isDispatchingDesktop ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Connecting Desktop...</span>
                </>
              ) : (
                <>
                  <Laptop size={18} />
                  <span>
                    {selectedTrackIds.size > 0
                      ? `Download on My PC (${selectedTrackIds.size} Songs)`
                      : `Download on My PC (${tracks?.length || 0} Songs)`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── CLOUD SESSION CODE POPUP MODAL ───────────────────────── */}
      {showSessionModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 7, 12, 0.92)',
            backdropFilter: 'blur(16px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowSessionModal(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              background: '#111726',
              border: '1px solid rgba(29, 185, 84, 0.35)',
              borderRadius: '16px',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 40px rgba(29, 185, 84, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(29, 185, 84, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1DB954' }}>
                  <Laptop size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Download on Your PC
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                    Zero setup • No bot blocks • 320kbps MP3
                  </p>
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={() => setShowSessionModal(false)}
                style={{ borderRadius: '50%', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Code Box */}
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(29, 185, 84, 0.08)',
                border: '1.5px dashed rgba(29, 185, 84, 0.4)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: '#1DB954' }}>
                YOUR DOWNLOAD SESSION CODE
              </span>
              <div style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '4px', color: '#fff', fontFamily: 'monospace' }}>
                {cloudSessionCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  background: copiedCode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  border: copiedCode ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.2)',
                  color: copiedCode ? '#6ee7b7' : '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copiedCode ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Live Synchronized Progress Banner if Desktop Engine is Active */}
            {liveBatchStatus && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(29, 185, 84, 0.12)',
                  border: '1px solid rgba(29, 185, 84, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#1DB954', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ● LIVE DOWNLOADING ON LOCAL PC
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#1DB954' }}>
                    {liveBatchStatus.overall_progress || 0}%
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  {liveBatchStatus.current_track_title || 'Downloading songs...'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <span>Completed: <strong>{liveBatchStatus.completed_tracks || 0} / {liveBatchStatus.total_tracks || 0}</strong></span>
                  <span>Speed: <strong style={{ color: '#fbbf24' }}>{liveBatchStatus.current_track_speed || '0 KB/s'}</strong></span>
                  <span>ETA: <strong style={{ color: '#60a5fa' }}>~{Math.round(liveBatchStatus.estimated_remaining_seconds || 0)}s</strong></span>
                </div>
                <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{ width: `${liveBatchStatus.overall_progress || 0}%`, height: '100%', background: '#1DB954', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  1
                </span>
                <span>
                  Launch <strong>TuneFetch.exe</strong> on your computer.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  2
                </span>
                <span>
                  Enter Code <strong>{cloudSessionCode}</strong> into the TuneFetch window.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  3
                </span>
                <span>
                  All songs will download at full home speed directly into your <code>Downloads\Thanks for downloading</code> folder!
                </span>
              </div>
            </div>

            {/* 1-Click Launch Local Engine */}
            <a
              href={`http://127.0.0.1:8000/?session=${cloudSessionCode}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1DB954 0%, #10b981 100%)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(29, 185, 84, 0.35)'
              }}
            >
              <ExternalLink size={15} />
              <span>Open Local Engine &amp; Download (http://127.0.0.1:8000)</span>
            </a>

            {/* Alternative Copy JSON Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
              <button
                type="button"
                onClick={handleCopyJson}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copiedJson ? '#6ee7b7' : 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {copiedJson ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedJson ? 'Copied Songs JSON!' : 'Copy raw Songs JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

