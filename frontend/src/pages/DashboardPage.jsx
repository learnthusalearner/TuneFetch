import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle, RefreshCw, LogOut, Laptop, DownloadCloud,
  FileCode, ArrowRight, CheckCircle2, FolderDown, Loader2, ExternalLink
} from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import { ToastContainer } from '../components/ui/Toast';
import AudioPlayer from '../components/AudioPlayer';
import HistoryDrawer from '../components/HistoryDrawer';
import SpotifyConnect from '../components/Spotify/SpotifyConnect';
import SpotifyPlaylists from '../components/Spotify/SpotifyPlaylists';
import PlaylistTracksModal from '../components/Spotify/PlaylistTracksModal';
import BatchProgressCard from '../components/Spotify/BatchProgressCard';
import ProgressCard from '../components/ProgressCard';

import { api, setStoredUserId, isLocalhost } from '../services/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDownloadTask } from '../hooks/useDownloadTask';
import { STORAGE_KEYS } from '../constants';

/* ─── Page-switch animation ──────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -14, transition: { duration: 0.22 } },
};

export default function DashboardPage({ onGoHome }) {
  const [showHistory, setShowHistory] = useState(false);
  const [health, setHealth] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  /* toast queue: [{ id, message, type }] */
  const [toasts, setToasts] = useState([]);

  /* ── Spotify state ─────────────────────────────────────────── */
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [spotifyStatus, setSpotifyStatus] = useState({ connected: false, spotify_user: null });
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [selectedPlaylistForModal, setSelectedPlaylistForModal] = useState(null);
  const [extractedTracks, setExtractedTracks] = useState(null);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isStartingBatchDownload, setIsStartingBatchDownload] = useState(false);
  const [downloadingTrackId, setDownloadingTrackId] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);


  /* ── Batch Job (persisted) ─────────────────────────────────── */
  const [activeJobId, setActiveJobId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB) || null; } catch { return null; }
  });
  const [activeJob, setActiveJob] = useState(null);

  /* ── Local Desktop Batch & Cloud Session State ─────────────── */
  const [sessionInput, setSessionInput] = useState('');
  const [isImportingSession, setIsImportingSession] = useState(false);
  const [localBatchId, setLocalBatchId] = useState(null);
  const [localBatchProgress, setLocalBatchProgress] = useState(null);

  /* ── Persistent history ────────────────────────────────────── */
  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.HISTORY, []);

  /* ── Helpers ───────────────────────────────────────────────── */
  const pushToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* Sync activeJobId to localStorage */
  useEffect(() => {
    try {
      if (activeJobId) {
        localStorage.setItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB, activeJobId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB);
      }
    } catch {}
  }, [activeJobId]);

  /* ── Single task hook ──────────────────────────────────────── */
  const handleTaskCompleted = useCallback((task) => {
    setHistory(prev => [
      {
        file_id: task.file_id, title: task.title, artist: task.artist,
        thumbnail: task.thumbnail, filename: task.filename,
        filesize: task.filesize, timestamp: Date.now(),
      },
      ...prev.filter(h => h.file_id !== task.file_id),
    ]);
  }, [setHistory]);

  const { activeTask, activeTrackIndex, error: taskError, startDownload, resetTask, setError: setTaskError } =
    useDownloadTask(handleTaskCompleted);

  /* ── Health poll ───────────────────────────────────────────── */
  useEffect(() => {
    const check = async () => setHealth(await api.getHealth());
    check();
    const interval = setInterval(check, 20000);
    return () => clearInterval(interval);
  }, []);

  /* ── URL params on mount ───────────────────────────────────── */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlUserId = params.get('user_id');
      if (urlUserId) {
        setStoredUserId(urlUserId);
      }
      if (params.get('spotify') === 'connected') {
        pushToast('Spotify account connected successfully!', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('spotify_error')) {
        let rawErr = params.get('spotify_error') || '';
        try { rawErr = decodeURIComponent(rawErr.replace(/\+/g, ' ')); } catch {}
        setGeneralError(`Spotify authorization: ${rawErr}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check for incoming cloud session code from web app
      const sessionParam = params.get('session') || params.get('code');
      if (sessionParam) {
        const clean = sessionParam.trim().toUpperCase();
        const code = clean.startsWith('TF-') ? clean : `TF-${clean}`;
        api.importSessionToLocalDesktop(code)
          .then((data) => {
            setLocalBatchId(data.batch_id);
            pushToast(`Imported session ${code} (${data.total_tracks} tracks)! Downloading to 'Thanks for downloading' folder...`, 'success');
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            setGeneralError(`Could not auto-import session ${code}: ${err.message}`);
          });
      }
    } catch {}
    refreshSpotifyStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Spotify helpers ───────────────────────────────────────── */
  const refreshSpotifyStatus = async () => {
    setIsCheckingAuth(true);
    try {
      const status = await api.getSpotifyStatus();
      setSpotifyStatus(status);
      if (status.connected) {
        fetchPlaylists();
        try {
          const latestJob = await api.getLatestPlaylistJob();
          if (latestJob && ['COMPLETED', 'PROCESSING', 'QUEUED'].includes(latestJob.status)) {
            setActiveJobId(latestJob.id);
            setActiveJob(latestJob);
          }
        } catch {}
      }
    } catch {
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const fetchPlaylists = async () => {
    setIsLoadingPlaylists(true);
    try {
      const list = await api.getSpotifyPlaylists();
      setSpotifyPlaylists(list);
    } catch (err) {
      setGeneralError(err.message || 'Failed to load Spotify playlists.');
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  /* ── Batch job polling ─────────────────────────────────────── */
  useEffect(() => {
    if (!activeJobId) return;
    let mounted = true;
    const iv = setInterval(async () => {
      try {
        const job = await api.getPlaylistJobStatus(activeJobId);
        if (!mounted) return;
        setActiveJob(job);
        // Add newly completed tracks to history
        const tracksArr = job.tracks || job.track_results || [];
        const finished = tracksArr.filter(t => (t.status || '').toLowerCase() === 'completed' && t.file_id);
        if (finished.length > 0) {
          setHistory(prev => {
            const existing = new Set(prev.map(h => h.file_id));
            const newItems = finished
              .filter(t => !existing.has(t.file_id))
              .map(t => ({
                file_id: t.file_id,
                title: t.song_name || t.title || t.name,
                artist: t.artist_name || t.artist || (Array.isArray(t.artists) ? t.artists.join(', ') : t.artists),
                thumbnail: t.thumbnail,
                filename: t.filename || `${t.song_name || t.name || 'track'}.mp3`,
                filesize: t.filesize || 0,
                timestamp: Date.now(),
              }));
            return [...newItems, ...prev];
          });
        }
        const s = (job.status || '').toLowerCase();
        if (s === 'completed' || s === 'failed') {
          clearInterval(iv);
          if (s === 'completed') {
            pushToast('All playlist songs downloaded successfully!', 'success');
          }
        }
      } catch {}
    }, 1500);
    return () => { mounted = false; clearInterval(iv); };
  }, [activeJobId, setHistory]);

  /* ── Local Desktop Batch Polling ───────────────────────────── */
  useEffect(() => {
    if (!localBatchId) return;
    let active = true;
    const iv = setInterval(async () => {
      try {
        const batch = await api.getLocalBatchProgress(localBatchId);
        if (!active) return;
        setLocalBatchProgress(batch);
        if (batch.status === 'COMPLETED') {
          clearInterval(iv);
          pushToast(`🎉 All ${batch.completed_tracks} songs downloaded to ${batch.target_folder}!`, 'success');
        }
      } catch {}
    }, 1000);
    return () => { active = false; clearInterval(iv); };
  }, [localBatchId, pushToast]);

  /* ── Session Import Handler ────────────────────────────────── */
  const handleImportSessionSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = (sessionInput || '').trim();
    if (!trimmed) return;

    setIsImportingSession(true);
    setGeneralError(null);

    try {
      // 1. Raw JSON array of songs
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const parsedTracks = JSON.parse(trimmed);
        if (!Array.isArray(parsedTracks) || parsedTracks.length === 0) {
          throw new Error('Invalid songs JSON: expected a non-empty array of tracks.');
        }
        const data = await api.sendToLocalDesktop({
          playlist_name: 'Imported Playlist',
          tracks: parsedTracks
        });
        setLocalBatchId(data.batch_id);
        pushToast(`Imported ${parsedTracks.length} songs! Downloading one by one into 'Thanks for downloading'...`, 'success');
        setSessionInput('');
        return;
      }

      // 2. Session Code (e.g. TF-4982 or 4982)
      const code = trimmed.toUpperCase().startsWith('TF-') ? trimmed.toUpperCase() : `TF-${trimmed.toUpperCase()}`;
      const data = await api.importSessionToLocalDesktop(code);
      setLocalBatchId(data.batch_id);
      pushToast(`Loaded session ${code} (${data.total_tracks} tracks)! Downloading one by one into 'Thanks for downloading'...`, 'success');
      setSessionInput('');
    } catch (err) {
      setGeneralError(err.message || 'Failed to import session code or songs JSON.');
    } finally {
      setIsImportingSession(false);
    }
  };

  /* ── Event handlers ────────────────────────────────────────── */
  const handleSpotifyConnect = () => { window.location.href = api.getSpotifyAuthUrl(); };

  const handleSpotifyDisconnect = async () => {
    try {
      await api.logout();
      setSpotifyStatus({ connected: false, spotify_user: null });
      setSpotifyPlaylists([]);
      setExtractedTracks(null);
      setSelectedPlaylistForModal(null);
      pushToast('Logged out of Spotify. You can now connect a different account.');
    } catch (err) {
      setGeneralError(err.message || 'Failed to disconnect Spotify account.');
    }
  };

  const handleSelectPlaylist = async (playlistId) => {
    const pl = spotifyPlaylists.find(p => p.id === playlistId) || { id: playlistId, name: 'Spotify Playlist' };
    setSelectedPlaylistForModal(pl);
    setExtractedTracks(null);
    setIsLoadingTracks(true);
    setGeneralError(null);
    try {
      const data = await api.getPlaylistTracks(playlistId);
      setExtractedTracks(data.tracks || []);
    } catch (err) {
      setGeneralError(err.message || 'Failed to extract playlist tracks.');
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleStartBatchDownload = async (playlistId, format, trackIds) => {
    setIsStartingBatchDownload(true);
    setGeneralError(null);
    resetTask();
    const pl = selectedPlaylistForModal;
    const total = trackIds ? trackIds.length : (extractedTracks?.length || pl?.tracks_total || 0);
    try {
      const jobId = await api.startPlaylistDownload(playlistId, format, trackIds);
      setActiveJobId(jobId);
      setActiveJob({
        id: jobId, playlist_name: pl?.name || 'Spotify Playlist',
        total_tracks: total, processed_tracks: 0,
        successful_tracks: 0, failed_tracks: 0,
        status: 'PROCESSING', tracks: [], zip_filename: 'Thanks_for_downloading.zip',
      });
      setSelectedPlaylistForModal(null);
      setExtractedTracks(null);
      pushToast('Playlist download started! Songs are being packaged on the server.');
    } catch (err) {
      setGeneralError(err.message || 'Failed to start batch download.');
    } finally {
      setIsStartingBatchDownload(false);
    }
  };

  const handleDownloadSingleTrack = async (track, format, trackId) => {
    setDownloadingTrackId(trackId);
    setGeneralError(null);
    try {
      const songName   = track.song_name || track.title || track.name;
      const artistName = track.artist_name || track.artist || (Array.isArray(track.artists) ? track.artists.join(', ') : track.artists) || '';
      const data = await api.downloadSingleSpotifyTrack({
        song_name: songName, artist_name: artistName,
        thumbnail: track.thumbnail, format: format || 'mp3-320',
      });
      if (data?.task_id) {
        pushToast(`Started download for "${songName}"!`);
        await startDownload({
          url: data.candidate_url, format: format || 'mp3-320',
          title: songName, artist: artistName,
          thumbnail: track.thumbnail, existingTaskId: data.task_id,
        });
      }
    } catch (err) {
      setGeneralError(err.message || 'Failed to download single track.');
    } finally {
      setDownloadingTrackId(null);
    }
  };

  const handleDismissBatchJob = () => {
    setActiveJob(null);
    setActiveJobId(null);
    try { localStorage.removeItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB); } catch {}
  };

  const activeError = generalError || taskError;

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <>
      {/* Ambient glow blobs */}
      <div className="glow-blob glow-blob-1" />
      <div className="glow-blob glow-blob-2" />
      <div className="glow-blob glow-blob-3" />

      {/* Toast stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="app-container">
        {/* Navbar */}
        <Navbar
          health={health}
          onToggleHistory={() => setShowHistory(v => !v)}
          historyCount={history.length}
          spotifyUser={spotifyStatus.spotify_user}
          onGoHome={onGoHome}
          onLogout={handleSpotifyDisconnect}
        />

        {/* History drawer */}
        <AnimatePresence>
          {showHistory && (
            <HistoryDrawer
              history={history}
              onPlay={setPlayingTrack}
              onClear={() => setHistory([])}
              onClose={() => setShowHistory(false)}
            />
          )}
        </AnimatePresence>

        {/* Error banner */}
        <AnimatePresence>
          {activeError && (
            <motion.div
              className="error-box"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{activeError}</span>
              <button
                onClick={() => { setGeneralError(null); setTaskError(null); }}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Batch job progress (always visible above tabs) */}
        <AnimatePresence>
          {activeJob && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
            >
              <BatchProgressCard
                job={activeJob}
                onDismiss={handleDismissBatchJob}
                onPlayAudio={setPlayingTrack}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Single track progress card */}
        <AnimatePresence>
          {activeTask && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.28 }}
            >
              <ProgressCard
                task={activeTask}
                onPlayAudio={setPlayingTrack}
                onReset={resetTask}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Local Desktop Batch Progress Card */}
        <AnimatePresence>
          {localBatchProgress && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.08) 0%, rgba(10, 15, 25, 0.7) 100%)',
                border: '1px solid rgba(29, 185, 84, 0.3)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(29, 185, 84, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1DB954' }}>
                    <Laptop size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                      Downloading "{localBatchProgress.playlist_name}" to PC
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Folder: {localBatchProgress.target_folder}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {localBatchProgress.status === 'COMPLETED' ? (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1DB954', background: 'rgba(29, 185, 84, 0.15)', padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Loader2 size={13} className="spinner" /> Downloading ({localBatchProgress.completed_tracks}/{localBatchProgress.total_tracks})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => { setLocalBatchId(null); setLocalBatchProgress(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${localBatchProgress.total_tracks > 0 ? (localBatchProgress.completed_tracks / localBatchProgress.total_tracks) * 100 : 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #1DB954 0%, #10b981 100%)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Current: {localBatchProgress.current_track_title || 'Preparing audio stream...'}</span>
                <span>{localBatchProgress.completed_tracks} of {localBatchProgress.total_tracks} tracks</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── IMPORT SESSION CODE OR SONGS JSON CARD ─────────────── */}
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(29, 185, 84, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1DB954' }}>
              <FileCode size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Have a Session Code or Songs JSON?
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Enter code (e.g. <code>TF-4982</code>) generated from the web app or paste songs JSON.
              </div>
            </div>
          </div>

          <form onSubmit={handleImportSessionSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', maxWidth: '440px' }}>
            <input
              type="text"
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              placeholder="Enter code (TF-XXXX) or paste JSON..."
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '12.5px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isImportingSession || !sessionInput.trim()}
              className="btn-download-action"
              style={{
                padding: '9px 18px',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              {isImportingSession ? <Loader2 size={14} className="spinner" /> : <ArrowRight size={14} />}
              <span>Download</span>
            </button>
          </form>
        </div>

        {/* ── WORKSPACE CONTENT ─────────────────────────────────── */}
        <motion.div key="spotify" {...pageVariants} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {isCheckingAuth ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 24px',
                  gap: 16,
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 16,
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <RefreshCw size={26} className="spinner" style={{ color: 'var(--accent-green)' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Checking Spotify authorization...
                  </span>
                </div>
              ) : !spotifyStatus.connected ? (
                isLocalhost ? (
                  <motion.div
                    className="glass-panel"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '36px 30px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.08) 0%, rgba(15, 23, 42, 0.75) 100%)',
                      border: '1px solid rgba(29, 185, 84, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '26px',
                      textAlign: 'left',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    {/* Status Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(29, 185, 84, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1DB954' }}>
                          <Laptop size={24} />
                        </div>
                        <div>
                          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                            TuneFetch Local Downloader Engine Online
                          </h2>
                          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                            Listening on 127.0.0.1:8000 • Ready for full-speed downloads
                          </span>
                        </div>
                      </div>

                      <div style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)'
                      }}>
                        📁 Destination: <strong style={{ color: '#fff' }}>Downloads/Thanks for downloading</strong>
                      </div>
                    </div>

                    {/* Two-step workflow */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                      {/* Step 1 */}
                      <div style={{
                        padding: '22px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: '#1DB954' }}>
                            STEP 1 • CLOUD AUTH &amp; PLAYLIST SELECTION
                          </span>
                          <h3 style={{ margin: '8px 0', fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                            Select Playlist on Web App
                          </h3>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            To protect your Spotify credentials, authentication &amp; PostgreSQL song link resolution happen securely on our Cloud Web App.
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
                            color: '#fff',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            boxShadow: '0 4px 16px rgba(29, 185, 84, 0.35)'
                          }}
                        >
                          <span>Open Cloud Web Extractor</span>
                          <ExternalLink size={16} />
                        </a>
                      </div>

                      {/* Step 2 */}
                      <div style={{
                        padding: '22px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: '#60a5fa' }}>
                            STEP 2 • LOCAL HIGH-SPEED DOWNLOAD
                          </span>
                          <h3 style={{ margin: '8px 0', fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                            Download Songs to Your PC
                          </h3>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            On the website, click <strong>"Download on My PC"</strong> to transfer songs here automatically, or enter your 4-digit code (e.g. <code>TF-4982</code>) below:
                          </p>
                        </div>

                        <form onSubmit={handleImportSessionSubmit} style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={sessionInput}
                            onChange={(e) => setSessionInput(e.target.value)}
                            placeholder="Enter TF-XXXX code..."
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid var(--border-glass)',
                              color: '#fff',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="submit"
                            disabled={isImportingSession || !sessionInput.trim()}
                            className="btn-download-action"
                            style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}
                          >
                            {isImportingSession ? <Loader2 size={15} className="spinner" /> : <ArrowRight size={15} />}
                            <span>Download</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <SpotifyConnect
                    spotifyStatus={spotifyStatus}
                    onConnect={handleSpotifyConnect}
                    onDisconnect={handleSpotifyDisconnect}
                    isLoading={isLoadingPlaylists}
                  />
                )
              ) : (
                <>
                  {/* Playlists header bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                        Your Playlists
                      </h3>
                      {spotifyStatus.spotify_user && (
                        <span
                          style={{
                            fontSize: '11px', fontWeight: 700,
                            color: 'var(--accent-green)',
                            background: 'rgba(29,185,84,0.1)',
                            border: '1px solid rgba(29,185,84,0.25)',
                            padding: '2px 8px', borderRadius: '10px',
                          }}
                        >
                          {spotifyStatus.spotify_user.display_name || spotifyStatus.spotify_user.id}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="icon-btn"
                        onClick={fetchPlaylists}
                        disabled={isLoadingPlaylists}
                        style={{ fontSize: 12, padding: '6px 14px' }}
                      >
                        <RefreshCw size={13} className={isLoadingPlaylists ? 'spinner' : ''} />
                        <span>Refresh</span>
                      </button>
                      <button
                        className="icon-btn"
                        onClick={handleSpotifyDisconnect}
                        style={{
                          fontSize: 12,
                          padding: '6px 12px',
                          color: '#f87171',
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="Log out or connect a different Spotify account"
                      >
                        <LogOut size={13} />
                        <span>Switch / Logout</span>
                      </button>
                    </div>
                  </div>

                  <SpotifyPlaylists
                    playlists={spotifyPlaylists}
                    onSelectPlaylist={handleSelectPlaylist}
                    isLoading={isLoadingTracks}
                    activePlaylistId={selectedPlaylistForModal?.id}
                    isLoadingPlaylists={isLoadingPlaylists}
                  />
                </>
              )}
            </motion.div>

        {/* Playlist Tracks Modal */}
        {selectedPlaylistForModal && (
          <PlaylistTracksModal
            playlist={selectedPlaylistForModal}
            tracks={extractedTracks}
            isOpen={Boolean(selectedPlaylistForModal)}
            onClose={() => { setSelectedPlaylistForModal(null); setExtractedTracks(null); }}
            onDownloadSingleTrack={handleDownloadSingleTrack}
            isLoadingTracks={isLoadingTracks}
            downloadingTrackId={downloadingTrackId}
          />
        )}

        {/* Audio Player */}
        <AnimatePresence>
          {playingTrack && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
            >
              <AudioPlayer track={playingTrack} onClose={() => setPlayingTrack(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="footer">
          <p>TuneFetch · High-Fidelity Audio Extractor &amp; Spotify Downloader</p>
          <p style={{ fontSize: '11px' }}>Made by Kunal Srivastava with ❤️ · Free to use</p>
        </footer>
      </div>
    </>
  );
}
