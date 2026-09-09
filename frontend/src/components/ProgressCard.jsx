import React, { useEffect } from 'react';
import { Download, CheckCircle2, AlertTriangle, Loader2, Music, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { formatFileSize, sanitizeClientFilename } from '../utils/formatters';

export default function ProgressCard({ task, onPlayAudio }) {
  const [hasDownloaded, setHasDownloaded] = React.useState(false);

  const isCompleted = task?.status === 'completed';
  const isError = task?.status === 'error';
  const isConverting = task?.status === 'converting';
  const isDownloading = task?.status === 'downloading' || task?.status === 'pending';

  useEffect(() => {
    if (isCompleted) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti non-fatal
      }
    }
  }, [isCompleted]);

  if (!task) return null;

  const handleDirectDownload = async () => {
    if (!task.file_id) return;
    const finalFilename = sanitizeClientFilename(task.filename || task.title || 'audio', '.mp3');
    const downloadUrl = api.getDownloadUrl(task.file_id, finalFilename);

    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Download request failed');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setHasDownloaded(true);
    } catch {
      // Fallback
      window.location.href = downloadUrl;
      setHasDownloaded(true);
    }
  };

  return (
    <div className="glass-panel progress-card">
      <div className="progress-header">
        <div className="status-badge">
          {isDownloading && <div className="spinner" />}
          {isConverting && <Loader2 size={18} className="spinner" color="var(--accent-purple)" />}
          {isCompleted && <CheckCircle2 size={20} color="var(--accent-green)" />}
          {isError && <AlertTriangle size={20} color="var(--accent-rose)" />}

          <span>
            {isDownloading && 'Downloading Audio Stream...'}
            {isConverting && 'Extracting Audio & Converting to MP3...'}
            {isCompleted && 'Ready! Conversion Complete'}
            {isError && 'Download Failed'}
          </span>
        </div>

        <div style={{ fontSize: '13px', fontWeight: 700, color: isCompleted ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
          {isCompleted ? '100%' : `${task.progress || 0}%`}
        </div>
      </div>

      {/* Progress Bar Fill */}
      <div className="progress-bar-bg">
        <div
          className="progress-bar-fill"
          style={{
            width: `${task.progress || 0}%`,
            background: isError
              ? 'var(--accent-rose)'
              : isCompleted
              ? 'var(--accent-green)'
              : undefined
          }}
        />
      </div>

      {/* Meta indicators */}
      {!isCompleted && !isError && (
        <div className="progress-meta">
          <span>{task.title || 'Processing track...'}</span>
          <span>
            {task.speed ? `Speed: ${task.speed}` : ''} {task.eta ? `• ETA: ${task.eta}` : ''}
          </span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="error-box">
          <AlertTriangle size={18} />
          <div>
            <strong>Error: </strong>
            <span>{task.error || 'Failed to process audio download.'}</span>
          </div>
        </div>
      )}

      {/* Completed State Actions */}
      {isCompleted && (
        <div className="download-ready-panel">
          <div className="ready-left">
            <Sparkles size={24} className="ready-icon" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                {task.filename || task.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {task.filesize ? `${formatFileSize(task.filesize)} • MP3 Audio Ready` : 'MP3 Audio Ready'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {task.file_id && (
              <button
                className="icon-btn"
                onClick={() => onPlayAudio(task)}
                title="Preview Audio in Browser"
              >
                <Music size={16} />
                <span>Preview</span>
              </button>
            )}

            <button
              className="btn-download-action"
              onClick={handleDirectDownload}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                background: hasDownloaded ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : undefined
              }}
            >
              {hasDownloaded ? <CheckCircle2 size={16} /> : <Download size={16} />}
              <span>{hasDownloaded ? 'Downloaded to Device' : 'Save MP3 File'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
