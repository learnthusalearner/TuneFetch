import React from 'react';
import { History, Download, Play, Trash2, X, Music } from 'lucide-react';
import { api } from '../services/api';
import { formatTimestamp, sanitizeClientFilename } from '../utils/formatters';

export default function HistoryDrawer({ history, onPlay, onClear, onClose }) {
  const handleSaveItem = async (e, item) => {
    e.preventDefault();
    const fileName = sanitizeClientFilename(item.filename || item.title || 'audio', '.mp3');
    const downloadUrl = api.getDownloadUrl(item.file_id, fileName);
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.location.href = downloadUrl;
    }
  };

  return (
    <div className="glass-panel history-modal">
      <div className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} color="var(--accent-green)" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Recent Downloads
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {history.length > 0 && (
            <button
              className="icon-btn"
              onClick={onClear}
              style={{ fontSize: '12px', padding: '6px 10px' }}
              title="Clear download history"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}

          <button
            className="icon-btn"
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
          <Music size={32} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
          <p style={{ fontSize: '14px' }}>No download history yet. Paste a link to get started!</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item, idx) => {
            const fileName = sanitizeClientFilename(item.filename || item.title || 'audio', '.mp3');

            return (
              <div key={item.file_id || idx} className="history-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-green)'
                      }}
                    >
                      <Music size={18} />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.artist || 'Audio'} • {item.format || 'MP3'} {item.timestamp ? `• ${formatTimestamp(item.timestamp)}` : ''}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="icon-btn"
                    onClick={() => onPlay(item)}
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                    title="Preview in browser"
                  >
                    <Play size={13} />
                  </button>

                  <button
                    onClick={(e) => handleSaveItem(e, item)}
                    className="btn-track-dl"
                    style={{ textDecoration: 'none', border: 'none', cursor: 'pointer' }}
                    title={`Save ${fileName}`}
                  >
                    <Download size={13} />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
