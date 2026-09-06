import React from 'react';
import { PlayCircle, CheckCircle, AlertTriangle, Loader2, X, Music, Check, Disc3, Download, Archive, Clock, Sparkles, FolderDown } from 'lucide-react';

import { isDirectoryPickerSupported, saveZipAsFolder } from '../../utils/folderSaver';

function formatEta(seconds) {
  if (seconds == null || isNaN(seconds)) return null;
  if (seconds <= 0) return 'Finishing up...';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `~${hours}h ${remMins}m`;
  }
  if (mins > 0) {
    return `~${mins}m ${secs}s`;
  }
  return `~${secs}s`;
}

export default function BatchProgressCard({ job, onDismiss, onPlayAudio }) {
  if (!job) return null;

  const {
    id,
    playlist_name,
    total_tracks = 0,
    processed_tracks = 0,
    successful_tracks = 0,
    failed_tracks = 0,
    status = 'pending',
    current_track,
    track_results = [],
    tracks = [],
    zip_available = false,
    zip_filename,
    eta_seconds,
    error
  } = job;

  const normalizedStatus = (status || 'pending').toLowerCase();
  const percentage = total_tracks > 0 ? Math.min(100, Math.round((processed_tracks / total_tracks) * 100)) : 0;
  const isCompleted = normalizedStatus === 'completed';
  const isProcessing = ['processing', 'queued', 'pending'].includes(normalizedStatus);
  const isFailed = normalizedStatus === 'failed';

  const trackList = tracks.length > 0 ? tracks : track_results;
  const etaFormatted = formatEta(eta_seconds);

  const [isDownloadingFolder, setIsDownloadingFolder] = React.useState(false);
  const [isSavingToPC, setIsSavingToPC] = React.useState(false);
  const [pcSaveProgress, setPcSaveProgress] = React.useState(null);
  const [pcSaveSuccess, setPcSaveSuccess] = React.useState(false);
  const hasDirectoryPicker = isDirectoryPickerSupported();

  const handleSaveDirectlyToFolder = async () => {
    setIsSavingToPC(true);
    setPcSaveSuccess(false);
    setPcSaveProgress({ current: 0, total: successful_tracks || 1, filename: 'Preparing folder...' });
    try {
      const res = await fetch(`/spotify/jobs/${id}/zip`);
      if (!res.ok) throw new Error('Could not download playlist folder archive');
      const blob = await res.blob();
      await saveZipAsFolder(blob, 'Thanks_for_downloading', (prog) => {
        setPcSaveProgress(prog);
      });
      setPcSaveSuccess(true);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Direct folder save failed or canceled:', err);
        // Fallback to standard zip download
        handleDownloadFolder();
      }
    } finally {
      setIsSavingToPC(false);
    }
  };

  const handleDownloadFolder = async (e) => {
    e?.preventDefault?.();
    setIsDownloadingFolder(true);
    try {
      const res = await fetch(`/spotify/jobs/${id}/zip`);
      if (!res.ok) throw new Error('Download request failed');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = zip_filename || 'Thanks_for_downloading.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Direct blob download fallback to navigation:', err);
      window.location.href = `/spotify/jobs/${id}/zip`;
    } finally {
      setIsDownloadingFolder(false);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        borderLeft: isCompleted
          ? '4px solid var(--accent-green)'
          : isFailed
          ? '4px solid var(--accent-rose)'
          : '4px solid var(--accent-purple)',
        position: 'relative'
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isCompleted
                ? 'rgba(29, 185, 84, 0.15)'
                : isFailed
                ? 'rgba(244, 63, 94, 0.15)'
                : 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isCompleted
                ? 'var(--accent-green)'
                : isFailed
                ? 'var(--accent-rose)'
                : 'var(--accent-purple)'
            }}
          >
            {isProcessing && <Loader2 size={22} className="spinner" />}
            {isCompleted && <CheckCircle size={22} />}
            {isFailed && <AlertTriangle size={22} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {playlist_name || 'Spotify Playlist Download'}
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isCompleted
                    ? 'rgba(29, 185, 84, 0.2)'
                    : isFailed
                    ? 'rgba(244, 63, 94, 0.2)'
                    : 'rgba(139, 92, 246, 0.2)',
                  color: isCompleted
                    ? 'var(--accent-green)'
                    : isFailed
                    ? 'var(--accent-rose)'
                    : 'var(--accent-purple)'
                }}
              >
                {status}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Job ID: <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{id}</code>
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            className="icon-btn"
            onClick={onDismiss}
            style={{ padding: '6px' }}
            title="Dismiss card"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Progress Bar & Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '8px' }}>
          <span>
            Progress: <strong>{processed_tracks} / {total_tracks}</strong> tracks ({percentage}%)
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isProcessing && etaFormatted && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: 'var(--accent-purple)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '11px'
              }}>
                <Clock size={12} />
                <span>Est. time remaining: {etaFormatted}</span>
              </span>
            )}
            <span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{successful_tracks} succeeded</span>
              {failed_tracks > 0 && (
                <span style={{ color: 'var(--accent-rose)', fontWeight: 600, marginLeft: '8px' }}>
                  • {failed_tracks} failed
                </span>
              )}
            </span>
          </div>
        </div>

        <div
          style={{
            height: '8px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: isCompleted
                ? 'linear-gradient(90deg, var(--accent-green) 0%, #10b981 100%)'
                : 'linear-gradient(90deg, var(--accent-purple) 0%, var(--accent-green) 100%)',
              borderRadius: '4px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>

        {/* User reassurance banner when downloading */}
        {isProcessing && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            marginTop: '2px'
          }}>
            <Sparkles size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <span>
              <strong>Server-side processing:</strong> You can safely leave this tab or come back later. Your download continues running in the background and your folder will be waiting for you!
            </span>
          </div>
        )}
      </div>

      {/* Download Folder Banner when completed */}
      {isCompleted && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.18) 0%, rgba(16, 21, 34, 0.95) 100%)',
            border: '1px solid rgba(29, 185, 84, 0.4)',
            boxShadow: '0 0 30px rgba(29, 185, 84, 0.18)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'var(--accent-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  boxShadow: '0 0 15px rgba(29, 185, 84, 0.4)'
                }}
              >
                <FolderDown size={22} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Folder: Thanks_for_downloading
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  All {successful_tracks} songs ready inside <code>Thanks_for_downloading</code> folder.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={hasDirectoryPicker ? handleSaveDirectlyToFolder : handleDownloadFolder}
                disabled={isSavingToPC || isDownloadingFolder}
                className="btn-download-action"
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 6px 25px rgba(16, 185, 129, 0.4)'
                }}
                title="Save all songs directly into a folder named Thanks_for_downloading"
              >
                {isSavingToPC ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>
                      Writing {pcSaveProgress?.current || 0} / {pcSaveProgress?.total || successful_tracks}...
                    </span>
                  </>
                ) : isDownloadingFolder ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Saving Folder...</span>
                  </>
                ) : (
                  <>
                    <FolderDown size={18} />
                    <span>Save as Folder on PC</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success notice after saving directly to PC folder */}
          {pcSaveSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(29, 185, 84, 0.15)',
                border: '1px solid rgba(29, 185, 84, 0.35)',
                color: '#1ed760',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <CheckCircle size={15} />
              <span>
                All songs have been saved into your PC folder <code>Thanks_for_downloading</code>!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Current Track Being Processed */}
      {isProcessing && current_track && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed rgba(255, 255, 255, 0.12)'
          }}
        >
          <Loader2 size={16} className="spinner" style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Resolving & downloading: </span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {typeof current_track === 'object' ? (current_track.title || current_track.name || current_track.song_name) : current_track}
            </strong>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', fontSize: '12px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Processed Tracks Log Preview */}
      {trackList && trackList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Playlist Songs ({trackList.length})
          </div>
          {trackList.map((res, idx) => {
            const trackStatus = (res.status || 'pending').toLowerCase();
            const trackTitle = res.song_name || res.title || res.name || 'Song';
            const trackArtist = res.artist_name || res.artist || (Array.isArray(res.artists) ? res.artists.join(', ') : res.artists) || '';

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  {trackStatus === 'completed' ? (
                    <Check size={14} color="var(--accent-green)" />
                  ) : trackStatus === 'failed' ? (
                    <AlertTriangle size={14} color="var(--accent-rose)" />
                  ) : trackStatus === 'searching' || trackStatus === 'downloading' ? (
                    <Loader2 size={14} className="spinner" color="var(--accent-purple)" />
                  ) : (
                    <Music size={14} color="var(--text-muted)" />
                  )}
                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {trackTitle}
                  </span>
                  {trackArtist && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      — {trackArtist}
                    </span>
                  )}
                  {res.candidate_url && (
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '10px', marginLeft: '6px', opacity: 0.8 }}>
                      [Resolved]
                    </span>
                  )}
                </div>

                {trackStatus === 'completed' && onPlayAudio && res.file_id && (
                  <button
                    className="icon-btn"
                    onClick={() => onPlayAudio(res)}
                    style={{ padding: '4px', marginLeft: '8px' }}
                    title="Play audio preview"
                  >
                    <PlayCircle size={14} color="var(--accent-green)" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

