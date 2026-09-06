import React from 'react';
import { PlayCircle, CheckCircle, AlertTriangle, Loader2, X, Music, Check, Disc3 } from 'lucide-react';

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
    error
  } = job;

  const percentage = total_tracks > 0 ? Math.min(100, Math.round((processed_tracks / total_tracks) * 100)) : 0;
  const isCompleted = status === 'completed';
  const isProcessing = status === 'processing' || status === 'pending';
  const isFailed = status === 'failed';

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
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>
            Progress: {processed_tracks} / {total_tracks} tracks ({percentage}%)
          </span>
          <span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{successful_tracks} succeeded</span>
            {failed_tracks > 0 && (
              <span style={{ color: 'var(--accent-rose)', fontWeight: 600, marginLeft: '8px' }}>
                • {failed_tracks} failed
              </span>
            )}
          </span>
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
      </div>

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
              {current_track.title}
            </strong>
            <span style={{ color: 'var(--text-secondary)' }}> — {current_track.artists}</span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', fontSize: '12px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Processed Tracks Log Preview */}
      {track_results && track_results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Extracted Tracks ({track_results.length})
          </div>
          {track_results.map((res, idx) => (
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
                {res.status === 'completed' ? (
                  <Check size={14} color="var(--accent-green)" />
                ) : res.status === 'failed' ? (
                  <AlertTriangle size={14} color="var(--accent-rose)" />
                ) : (
                  <Loader2 size={14} className="spinner" color="var(--accent-purple)" />
                )}
                <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {res.title}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  — {res.artists}
                </span>
              </div>

              {res.status === 'completed' && onPlayAudio && res.file_id && (
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
          ))}
        </div>
      )}
    </div>
  );
}
