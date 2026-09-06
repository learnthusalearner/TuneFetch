import React from 'react';
import { Music, History, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Header({ health, onToggleHistory, historyCount }) {
  const isOnline = health?.status === 'healthy';
  const hasFfmpeg = health?.ffmpeg_available;

  return (
    <header className="header">
      <div className="brand-wrapper">
        <div className="brand-logo-icon">
          <Music size={26} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="brand-title">TuneFetch</h1>
          <p className="brand-subtitle">Universal Audio & MP3 Extractor</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Engine status indicator */}
        <div
          className="badge-tag"
          style={{
            background: isOnline ? 'rgba(29, 185, 84, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            color: isOnline ? '#1ed760' : '#fda4af',
            border: `1px solid ${isOnline ? 'rgba(29, 185, 84, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '12px'
          }}
          title={isOnline ? (hasFfmpeg ? 'Engine Ready (Embedded FFmpeg active)' : 'Engine Ready (Direct Stream)') : 'Backend offline'}
        >
          {isOnline ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          <span>{isOnline ? (hasFfmpeg ? 'MP3 Engine Ready' : 'Backend Ready') : 'Connecting...'}</span>
        </div>

        {/* History button */}
        <button
          className="icon-btn"
          onClick={onToggleHistory}
          title="View recent download history"
        >
          <History size={17} />
          <span>History</span>
          {historyCount > 0 && (
            <span
              style={{
                background: 'var(--accent-green)',
                color: '#000',
                borderRadius: '50%',
                padding: '1px 6px',
                fontSize: '11px',
                fontWeight: 800
              }}
            >
              {historyCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
