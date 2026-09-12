import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Laptop, FolderOpen, ExternalLink, Download, CheckCircle2,
  Clock, Zap, Music, AlertCircle, ArrowRight, Loader2, Sparkles,
  RefreshCw, Check, FileText, Activity, Layers, Radio
} from 'lucide-react';
import { api } from '../services/api';

export default function LocalDesktopPage() {
  const [sessionInput, setSessionInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [localBatchId, setLocalBatchId] = useState(null);
  const [batchProgress, setBatchProgress] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Local live timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  const pushToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTimer = (totalSec) => {
    const sec = Math.max(0, Math.floor(totalSec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Open destination folder on local PC
  const handleOpenFolder = async () => {
    try {
      const res = await api.openLocalFolder();
      if (res && res.success) {
        pushToast('Opened "Thanks for downloading" folder in File Explorer!');
      } else {
        pushToast('Downloads folder: Downloads/Thanks for downloading', 'info');
      }
    } catch {
      pushToast('Folder: Downloads/Thanks for downloading', 'info');
    }
  };

  // Auto-import from URL param (?session=TF-XXXX or ?code=TF-XXXX)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session') || params.get('code');
      if (sessionParam) {
        const clean = sessionParam.trim().toUpperCase();
        const code = clean.startsWith('TF-') ? clean : `TF-${clean}`;
        setIsImporting(true);
        api.importSessionToLocalDesktop(code)
          .then((data) => {
            setLocalBatchId(data.batch_id);
            pushToast(`Imported playlist "${data.playlist_name}" (${data.total_tracks} tracks)! Starting download...`);
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            setGeneralError(`Could not auto-import session: ${err.message}`);
          })
          .finally(() => setIsImporting(false));
      }
    } catch {}
  }, [pushToast]);

  // Batch progress polling with high-frequency (500ms) for snappy real-time updates
  useEffect(() => {
    if (!localBatchId) return;

    let active = true;
    const interval = setInterval(async () => {
      try {
        const progress = await api.getLocalBatchProgress(localBatchId);
        if (!active) return;
        setBatchProgress(progress);

        if (progress.status === 'COMPLETED') {
          clearInterval(interval);
          pushToast(`🎉 All ${progress.completed_tracks} songs downloaded into "Downloads/Thanks for downloading"!`, 'success');
        }
      } catch {}
    }, 500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [localBatchId, pushToast]);

  // Live client-side seconds timer during download
  useEffect(() => {
    if (batchProgress && batchProgress.status === 'DOWNLOADING') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (batchProgress?.status === 'COMPLETED' && batchProgress?.elapsed_seconds) {
        setElapsedSeconds(Math.round(batchProgress.elapsed_seconds));
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [batchProgress]);

  // Form submit for session code or JSON
  const handleImportSubmit = async (e) => {
    if (e) e.preventDefault();
    const val = (sessionInput || '').trim();
    if (!val) return;

    setIsImporting(true);
    setGeneralError(null);

    try {
      if (val.startsWith('[') && val.endsWith(']')) {
        const parsed = JSON.parse(val);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Invalid JSON: expected array of tracks');
        }
        const res = await api.sendToLocalDesktop({
          playlist_name: 'Imported Playlist',
          tracks: parsed
        });
        setLocalBatchId(res.batch_id);
        setElapsedSeconds(0);
        pushToast(`Imported ${parsed.length} tracks! Starting download...`);
        setSessionInput('');
        return;
      }

      const code = val.toUpperCase().startsWith('TF-') ? val.toUpperCase() : `TF-${val.toUpperCase()}`;
      const res = await api.importSessionToLocalDesktop(code);
      setLocalBatchId(res.batch_id);
      setElapsedSeconds(0);
      pushToast(`Imported session ${code} (${res.total_tracks} tracks)! Starting download...`);
      setSessionInput('');
    } catch (err) {
      setGeneralError(err.message || 'Failed to import session code or songs JSON');
    } finally {
      setIsImporting(false);
    }
  };

  const isDownloading = batchProgress?.status === 'DOWNLOADING';
  const isCompleted = batchProgress?.status === 'COMPLETED';
  const total = batchProgress?.total_tracks || 0;
  const completed = batchProgress?.completed_tracks || 0;
  const failed = batchProgress?.failed_tracks || 0;
  
  // Real-time progress values
  const currentTrackProgress = Math.min(100, Math.max(0, Math.round(batchProgress?.current_track_progress || 0)));
  const currentSpeed = batchProgress?.current_track_speed || '0 KB/s';
  const currentEta = batchProgress?.current_track_eta || '--';
  const overallPercent = batchProgress?.overall_progress !== undefined
    ? Math.min(100, Math.max(0, Math.round(batchProgress.overall_progress)))
    : (total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0);
    
  const etaSec = batchProgress?.estimated_remaining_seconds ?? (total > 0 ? Math.max(0, (total - completed) * 10) : 0);
  const secondsPerTrack = batchProgress?.seconds_per_track || 10.0;

  const handleResetForNextPlaylist = () => {
    setLocalBatchId(null);
    setBatchProgress(null);
    setElapsedSeconds(0);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080c14',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Dynamic Keyframe Styles for Live Equalizer & Pulses */}
      <style>{`
        @keyframes liveEq {
          0%, 100% { height: 4px; }
          50% { height: 18px; }
        }
        .live-eq-bar {
          width: 3px;
          background: #1DB954;
          border-radius: 2px;
          animation: liveEq 0.75s ease-in-out infinite;
        }
        .live-eq-bar:nth-child(2) { animation-delay: 0.15s; }
        .live-eq-bar:nth-child(3) { animation-delay: 0.3s; }
        .live-eq-bar:nth-child(4) { animation-delay: 0.45s; }
        .live-eq-bar:nth-child(5) { animation-delay: 0.6s; }

        @keyframes subtlePulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        .pulse-badge {
          animation: subtlePulse 2s ease-in-out infinite;
        }

        @keyframes neonGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(29, 185, 84, 0.25); }
          50% { box-shadow: 0 0 35px rgba(29, 185, 84, 0.55); }
        }
        .card-active-glow {
          animation: neonGlow 3s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient background glow */}
      <div style={{
        position: 'fixed',
        top: '-15%',
        left: '20%',
        width: '650px',
        height: '650px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(29, 185, 84, 0.14) 0%, rgba(8, 12, 20, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Toast notifications */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              background: t.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
              color: '#fff',
              fontSize: '13.5px',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              cursor: 'pointer'
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Header bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(8, 12, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1DB954 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            boxShadow: '0 0 20px rgba(29, 185, 84, 0.4)'
          }}>
            <Music size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px' }}>
              TuneFetch Desktop
            </h1>
            <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Local Engine Active (127.0.0.1:8000)
            </span>
          </div>
        </div>

        {/* Quick action: open folder */}
        <button
          onClick={handleOpenFolder}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title="Open downloads folder in File Explorer"
        >
          <FolderOpen size={16} color="#1DB954" />
          <span>Downloads/Thanks for downloading</span>
        </button>
      </header>

      {/* Main content container */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '940px',
        margin: '0 auto',
        padding: '36px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        zIndex: 1
      }}>
        {/* Error banner if any */}
        {generalError && (
          <div style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} />
              <span>{generalError}</span>
            </div>
            <button
              onClick={() => setGeneralError(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}
            >
              ×
            </button>
          </div>
        )}

        {/* ─── LIVE DOWNLOADING MONITOR & METRICS CARD ───────────────── */}
        <div
          className={isDownloading ? 'card-active-glow' : ''}
          style={{
            borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(18, 26, 43, 0.8) 0%, rgba(10, 15, 26, 0.9) 100%)',
            border: isDownloading ? '1px solid rgba(29, 185, 84, 0.45)' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '32px 28px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            transition: 'border 0.3s'
          }}
        >
          {/* Top Title and Live Audio Status Bar */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  fontWeight: 800,
                  color: isDownloading ? '#1DB954' : isCompleted ? '#10b981' : '#94a3b8'
                }}>
                  {isDownloading ? '● DOWNLOADING PLAYLIST LIVE' : isCompleted ? '✓ ALL DOWNLOADS FINISHED' : 'READY TO DOWNLOAD'}
                </span>
                {isDownloading && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '16px', marginLeft: '4px' }}>
                    <span className="live-eq-bar" />
                    <span className="live-eq-bar" />
                    <span className="live-eq-bar" />
                    <span className="live-eq-bar" />
                    <span className="live-eq-bar" />
                  </div>
                )}
              </div>
              <h2 style={{ margin: '6px 0 0 0', fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.4px' }}>
                {batchProgress?.playlist_name || 'Spotify Playlist Downloader'}
              </h2>
            </div>

            {/* Reset / Clear button when finished */}
            {isCompleted && (
              <button
                onClick={handleResetForNextPlaylist}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} />
                <span>Download Another Playlist</span>
              </button>
            )}
          </div>

          {/* ─── LIVE HUD METRICS GRID ───────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px'
          }}>
            {/* 1. Elapsed Time */}
            <div style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="#1DB954" />
                <span>ELAPSED TIME</span>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: '#1DB954',
                marginTop: '4px',
                letterSpacing: '1px'
              }}>
                {formatTimer(elapsedSeconds)}
              </div>
            </div>

            {/* 2. Estimated Time Remaining */}
            <div style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: isDownloading ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radio size={13} color="#60a5fa" />
                <span>ESTIMATED REMAINING</span>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: isDownloading ? '#60a5fa' : '#94a3b8',
                marginTop: '4px',
                letterSpacing: '1px'
              }}>
                {isDownloading ? `~${formatTimer(etaSec)}` : isCompleted ? '00:00' : '--:--'}
              </div>
            </div>

            {/* 3. Live Download Speed */}
            <div style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: isDownloading ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} color="#fbbf24" />
                <span>DOWNLOAD SPEED</span>
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: isDownloading ? '#fbbf24' : '#94a3b8',
                marginTop: '4px'
              }}>
                {isDownloading ? currentSpeed : isCompleted ? 'Complete' : '0 KB/s'}
              </div>
            </div>

            {/* 4. Songs Counter */}
            <div style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={13} color="#a855f7" />
                <span>SONGS COMPLETED</span>
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#fff',
                marginTop: '4px'
              }}>
                {completed} <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 600 }}>/ {total}</span>
              </div>
            </div>
          </div>

          {/* ─── MASTER PROGRESS BAR ───────────────────────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>
                {isDownloading
                  ? `Overall Playlist Progress (${completed} of ${total} tracks)`
                  : isCompleted
                  ? `All ${completed} of ${total} tracks downloaded`
                  : 'Awaiting playlist session code...'}
              </span>
              <span style={{ fontWeight: 800, color: '#1DB954', fontSize: '15px' }}>
                {overallPercent}%
              </span>
            </div>

            <div style={{
              width: '100%',
              height: '12px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${overallPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #1DB954 0%, #10b981 100%)',
                boxShadow: '0 0 18px rgba(29, 185, 84, 0.7)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* ─── CURRENT ACTIVE TRACK CARD WITH LIVE SPEED & TRACK BUFFER BAR ──── */}
          {isDownloading && (
            <div style={{
              padding: '18px 22px',
              borderRadius: '14px',
              background: 'rgba(29, 185, 84, 0.09)',
              border: '1px solid rgba(29, 185, 84, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(29, 185, 84, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1DB954',
                    flexShrink: 0
                  }}>
                    <Loader2 size={22} className="spinner" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1DB954', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={12} />
                      <span>DOWNLOADING TRACK {batchProgress?.current_index || completed + 1} OF {total}</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                      {batchProgress?.current_track_title || 'Connecting high-speed audio stream...'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1', textAlign: 'right' }}>
                  <div>Live Speed: <strong style={{ color: '#fbbf24' }}>{currentSpeed}</strong></div>
                  <div>Track ETA: <strong style={{ color: '#60a5fa' }}>{currentEta}</strong></div>
                </div>
              </div>

              {/* Mini track progress indicator */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8', marginBottom: '5px' }}>
                  <span>Buffering high-fidelity 320 kbps MP3 stream</span>
                  <span style={{ fontWeight: 700, color: '#1DB954' }}>{currentTrackProgress}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${currentTrackProgress}%`,
                    height: '100%',
                    background: '#1DB954',
                    transition: 'width 0.25s linear'
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* ─── SUCCESS CELEBRATION CARD ──────────────────────────── */}
          {isCompleted && (
            <div style={{
              padding: '20px 24px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <CheckCircle2 size={32} color="#10b981" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>
                    All {completed} Songs Saved Successfully!
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)' }}>
                    Saved into <code>Downloads/Thanks for downloading</code> in {formatTimer(elapsedSeconds)} (~{secondsPerTrack}s per song).
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenFolder}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1DB954 0%, #10b981 100%)',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(29, 185, 84, 0.35)'
                }}
              >
                <FolderOpen size={17} />
                <span>Open Destination Folder</span>
              </button>
            </div>
          )}

          {/* ─── LIVE TRACKS QUEUE & STATUS FEED ─────────────────────── */}
          {batchProgress?.tracks_progress && batchProgress.tracks_progress.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)' }}>
                  Playlist Tracks Queue ({batchProgress.tracks_progress.length} Songs)
                </h4>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {completed} Completed · {batchProgress.tracks_progress.length - completed - failed} Remaining
                </span>
              </div>

              <div style={{
                maxHeight: '280px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '6px'
              }}>
                {batchProgress.tracks_progress.map((t, i) => {
                  const isCur = t.status === 'DOWNLOADING';
                  const isDone = t.status === 'COMPLETED';
                  const isErr = t.status === 'ERROR' || t.status === 'TIMEOUT';

                  return (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isCur
                          ? 'rgba(29, 185, 84, 0.12)'
                          : isDone
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isCur
                          ? '1px solid rgba(29, 185, 84, 0.4)'
                          : isDone
                          ? '1px solid rgba(255, 255, 255, 0.07)'
                          : '1px solid rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{
                          color: isCur ? '#1DB954' : 'rgba(255, 255, 255, 0.4)',
                          fontWeight: 700,
                          width: '24px',
                          fontSize: '12px'
                        }}>
                          #{t.index}
                        </span>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{t.title}</span>
                          {t.artist && (
                            <span style={{ color: 'rgba(255, 255, 255, 0.55)', marginLeft: '6px' }}>
                              • {t.artist}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                        {isDone ? (
                          <span style={{
                            color: '#10b981',
                            fontWeight: 700,
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            <Check size={13} /> Saved
                          </span>
                        ) : isCur ? (
                          <span style={{
                            color: '#1DB954',
                            fontWeight: 700,
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(29, 185, 84, 0.18)',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            <Loader2 size={12} className="spinner" /> {t.progress ? `${Math.round(t.progress)}%` : 'Streaming...'}
                          </span>
                        ) : isErr ? (
                          <span style={{
                            color: '#f87171',
                            fontWeight: 600,
                            fontSize: '12px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            Skipped
                          </span>
                        ) : (
                          <span style={{
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontSize: '11.5px',
                            fontWeight: 600
                          }}>
                            Queued
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── STANDBY / SELECTION TWO-STEP ACTION CARDS ───────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {/* Method 1: Web App Connection */}
          <div style={{
            borderRadius: '18px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '26px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: '#1DB954' }}>
                STEP 1 • SELECT PLAYLIST
              </span>
              <h3 style={{ margin: '8px 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                Open Web Dashboard
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6 }}>
                Connect your Spotify account on our web app. When you click <strong>"Download on My PC"</strong>, all songs are routed directly here to download one-by-one into your Downloads folder!
              </p>
            </div>

            <a
              href="https://tune-fetch-tan.vercel.app/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1DB954 0%, #10b981 100%)',
                color: '#000',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 18px rgba(29, 185, 84, 0.3)'
              }}
            >
              <span>1. Open TuneFetch Web App</span>
              <ExternalLink size={16} />
            </a>
          </div>

          {/* Method 2: Session Code / Raw JSON */}
          <div style={{
            borderRadius: '18px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '26px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: '#60a5fa' }}>
                STEP 2 • SESSION CODE
              </span>
              <h3 style={{ margin: '8px 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                Enter Session Code
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6 }}>
                Have a 4-digit code (e.g. <code>TF-4982</code>) from the website or a songs JSON? Enter it below to start downloading immediately:
              </p>
            </div>

            <form onSubmit={handleImportSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                placeholder="Enter TF-XXXX code or JSON..."
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={isImporting || !sessionInput.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '11px 18px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isImporting || !sessionInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: isImporting || !sessionInput.trim() ? 0.6 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                {isImporting ? <Loader2 size={16} className="spinner" /> : <Download size={16} />}
                <span>Download</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        TuneFetch Desktop Engine • High-Fidelity MP3 Audio Downloader • Saved into <code>Downloads/Thanks for downloading</code>
      </footer>
    </div>
  );
}
