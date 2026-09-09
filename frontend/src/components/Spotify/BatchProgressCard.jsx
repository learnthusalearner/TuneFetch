import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlayCircle, CheckCircle, AlertTriangle, Loader2, X,
  Music, Check, Download, Clock, Sparkles, FolderDown,
} from 'lucide-react';
import { isDirectoryPickerSupported, saveZipAsFolder } from '../../utils/folderSaver';
import { api } from '../../services/api';

/* ─── Helpers ────────────────────────────────────────────────── */
function formatEta(seconds) {
  if (seconds == null || isNaN(seconds)) return null;
  if (seconds <= 0) return 'Finishing up…';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 60) { const h = Math.floor(mins / 60); return `~${h}h ${mins % 60}m`; }
  if (mins > 0)  return `~${mins}m ${secs}s`;
  return `~${secs}s`;
}

/* ─── Equalizer bars component ───────────────────────────────── */
function EqualizerBars() {
  return (
    <div className="equalizer" aria-hidden="true">
      {[
        { h: '0.55s', d: '0s'   },
        { h: '0.7s',  d: '0.1s' },
        { h: '0.5s',  d: '0.2s' },
        { h: '0.8s',  d: '0.05s'},
        { h: '0.6s',  d: '0.15s'},
      ].map((b, i) => (
        <div
          key={i}
          className="eq-bar"
          style={{ '--duration': b.h, '--delay': b.d }}
        />
      ))}
    </div>
  );
}

/* ─── Stat pill ──────────────────────────────────────────────── */
function StatPill({ icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 14px',
      borderRadius: 'var(--radius-md)',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--border-glass)',
    }}>
      <span style={{ color }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function BatchProgressCard({ job, onDismiss, onPlayAudio }) {
  const [isDownloadingFolder, setIsDownloadingFolder] = React.useState(false);
  const [isSavingToPC, setIsSavingToPC]               = React.useState(false);
  const [pcSaveProgress, setPcSaveProgress]           = React.useState(null);
  const [pcSaveSuccess, setPcSaveSuccess]             = React.useState(false);
  const hasDirectoryPicker = isDirectoryPickerSupported();

  if (!job) return null;

  const {
    id,
    playlist_name,
    total_tracks     = 0,
    processed_tracks = 0,
    successful_tracks = 0,
    failed_tracks    = 0,
    status           = 'pending',
    current_track,
    track_results    = [],
    tracks           = [],
    zip_available    = false,
    zip_filename,
    eta_seconds,
    error,
  } = job;

  const normalizedStatus = (status || 'pending').toLowerCase();
  const percentage   = total_tracks > 0 ? Math.min(100, Math.round((processed_tracks / total_tracks) * 100)) : 0;
  const isCompleted  = normalizedStatus === 'completed';
  const isProcessing = ['processing', 'queued', 'pending'].includes(normalizedStatus);
  const isFailed     = normalizedStatus === 'failed';
  const trackList    = tracks.length > 0 ? tracks : track_results;
  const etaFormatted = formatEta(eta_seconds);

  const handleSaveDirectlyToFolder = async () => {
    setIsSavingToPC(true);
    setPcSaveSuccess(false);
    setPcSaveProgress({ current: 0, total: successful_tracks || 1, filename: 'Preparing…' });
    try {
      const zipUrl = api.getPlaylistZipUrl(id);
      const res  = await fetch(zipUrl);
      if (!res.ok) throw new Error('Could not download archive');
      const blob = await res.blob();
      await saveZipAsFolder(blob, 'TuneFetch_Music', prog => setPcSaveProgress(prog));
      setPcSaveSuccess(true);
    } catch (err) {
      if (err.name !== 'AbortError') handleDownloadFolder();
    } finally {
      setIsSavingToPC(false);
    }
  };

  const handleDownloadFolder = async (e) => {
    e?.preventDefault?.();
    setIsDownloadingFolder(true);
    const zipUrl = api.getPlaylistZipUrl(id);
    try {
      const res    = await fetch(zipUrl);
      if (!res.ok) throw new Error('Download failed');
      const blob   = await res.blob();
      const url    = window.URL.createObjectURL(blob);
      const link   = document.createElement('a');
      link.href    = url;
      link.download = zip_filename || 'TuneFetch_Playlist.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.location.href = zipUrl;
    } finally {
      setIsDownloadingFolder(false);
    }
  };

  /* Accent colour based on state */
  const accent = isCompleted ? 'var(--accent-green)' : isFailed ? 'var(--color-error)' : 'var(--accent-indigo)';

  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        borderLeft: `3px solid ${accent}`,
        position: 'relative',
      }}
    >
      {/* ── Header row ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* State icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: isCompleted ? 'rgba(29,185,84,0.15)' : isFailed ? 'rgba(240,71,71,0.15)' : 'rgba(108,92,231,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent,
          }}>
            {isProcessing && <Loader2 size={22} className="spinner" />}
            {isCompleted  && <CheckCircle size={22} />}
            {isFailed     && <AlertTriangle size={22} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {playlist_name || 'Spotify Playlist Download'}
              </h3>
              <span style={{
                fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: 10,
                background: isCompleted ? 'rgba(29,185,84,0.2)' : isFailed ? 'rgba(240,71,71,0.2)' : 'rgba(108,92,231,0.2)',
                color: accent,
              }}>
                {status}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Job <code style={{ fontSize: 10 }}>{id}</code>
            </p>
          </div>
        </div>

        {onDismiss && (
          <button className="icon-btn" onClick={onDismiss} style={{ padding: 6 }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Progress bar ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap', gap: 8 }}>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{processed_tracks}</strong>
            {' / '}
            <strong style={{ color: 'var(--text-primary)' }}>{total_tracks}</strong>
            {' tracks — '}
            <strong style={{ color: accent }}>{percentage}%</strong>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isProcessing && etaFormatted && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)',
                color: 'var(--accent-indigo)', padding: '2px 8px', borderRadius: 6,
                fontWeight: 600, fontSize: 11,
              }}>
                <Clock size={11} />
                {etaFormatted}
              </span>
            )}
            <span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{successful_tracks} ✓</span>
              {failed_tracks > 0 && (
                <span style={{ color: 'var(--color-error)', fontWeight: 700, marginLeft: 8 }}>
                  {failed_tracks} ✗
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="progress-bar-bg">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              background: isCompleted
                ? 'linear-gradient(90deg, var(--accent-green) 0%, #10b981 100%)'
                : 'linear-gradient(90deg, var(--accent-indigo) 0%, var(--accent-green) 100%)',
              animation: isCompleted ? 'none' : undefined,
            }}
          />
        </div>

        {/* Server-side reassurance */}
        {isProcessing && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            color: 'var(--text-secondary)', fontSize: 11,
          }}>
            <Sparkles size={12} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
            <span>
              <strong>Server-side processing:</strong> Safe to close this tab — your download
              keeps running and the folder will be waiting when you return.
            </span>
          </div>
        )}
      </div>

      {/* ── Currently processing track ───────────────────────── */}
      <AnimatePresence>
        {isProcessing && current_track && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.1)',
            }}
          >
            <EqualizerBars />
            <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Now processing: </span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {typeof current_track === 'object'
                  ? (current_track.title || current_track.name || current_track.song_name)
                  : current_track}
              </strong>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMPLETED STATE ─────────────────────────────────── */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex', flexDirection: 'column', gap: 16,
              padding: '20px 24px', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(29,185,84,0.14) 0%, rgba(10,10,12,0.95) 100%)',
              border: '1px solid rgba(29,185,84,0.35)',
              boxShadow: '0 0 40px rgba(29,185,84,0.12)',
            }}
          >
            {/* Checkmark + stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {/* Glowing checkmark */}
              <motion.div
                className="checkmark-glow"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Check size={36} strokeWidth={3} />
              </motion.div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                  Download Complete!
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--accent-green)' }}>{successful_tracks}</strong> songs saved
                  {failed_tracks > 0 && (
                    <span> · <span style={{ color: 'var(--color-error)' }}>{failed_tracks} failed</span></span>
                  )}
                </div>
              </div>
            </div>

            {/* Stat pills row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill icon={<Check size={14} />} label="Completed" value={successful_tracks} color="var(--accent-green)" />
              {failed_tracks > 0 && (
                <StatPill icon={<AlertTriangle size={14} />} label="Failed" value={failed_tracks} color="var(--color-error)" />
              )}
              <StatPill icon={<Music size={14} />} label="Total" value={total_tracks} color="var(--text-secondary)" />
            </div>

            {/* Folder info + download button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--accent-green)', color: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(29,185,84,0.4)',
                }}>
                  <FolderDown size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Thanks_for_downloading
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    All {successful_tracks} songs ready inside the folder
                  </div>
                </div>
              </div>

              <motion.button
                className="btn-download-action"
                onClick={hasDirectoryPicker ? handleSaveDirectlyToFolder : handleDownloadFolder}
                disabled={isSavingToPC || isDownloadingFolder}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{ padding: '12px 24px', fontSize: 14, fontWeight: 700 }}
              >
                {isSavingToPC ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Writing {pcSaveProgress?.current ?? 0}/{pcSaveProgress?.total ?? successful_tracks}…</span>
                  </>
                ) : isDownloadingFolder ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Download ZIP</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* PC folder success notice */}
            <AnimatePresence>
              {pcSaveSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(29,185,84,0.15)', border: '1px solid rgba(29,185,84,0.3)',
                    color: 'var(--accent-green-bright)', fontSize: 12, fontWeight: 600,
                  }}
                >
                  <CheckCircle size={14} />
                  <span>All songs saved into <code>Thanks_for_downloading</code> on your PC!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error message ────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(240,71,71,0.1)', color: 'var(--color-error)', fontSize: 12,
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── Track results log ────────────────────────────────── */}
      {trackList && trackList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Track Log ({trackList.length})
          </div>
          {trackList.map((res, idx) => {
            const ts = (res.status || 'pending').toLowerCase();
            const name = res.song_name || res.title || res.name || 'Song';
            const artist = res.artist_name || res.artist || (Array.isArray(res.artists) ? res.artists.join(', ') : res.artists) || '';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 10px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)', fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
                  {ts === 'completed' && <Check size={13} color="var(--accent-green)" />}
                  {ts === 'failed' && <AlertTriangle size={13} color="var(--color-error)" />}
                  {(ts === 'searching' || ts === 'downloading') && <Loader2 size={13} className="spinner" color="var(--accent-indigo)" />}
                  {!['completed','failed','searching','downloading'].includes(ts) && <Music size={13} color="var(--text-muted)" />}
                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                  </span>
                  {artist && <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>— {artist}</span>}
                </div>
                {ts === 'completed' && onPlayAudio && res.file_id && (
                  <button
                    className="icon-btn"
                    onClick={() => onPlayAudio(res)}
                    style={{ padding: 4, marginLeft: 8 }}
                    title="Preview"
                  >
                    <PlayCircle size={13} color="var(--accent-green)" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
