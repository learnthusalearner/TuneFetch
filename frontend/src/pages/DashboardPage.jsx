import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw, LogOut, Cookie } from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import { ToastContainer } from '../components/ui/Toast';
import AudioPlayer from '../components/AudioPlayer';
import HistoryDrawer from '../components/HistoryDrawer';
import SpotifyConnect from '../components/Spotify/SpotifyConnect';
import SpotifyPlaylists from '../components/Spotify/SpotifyPlaylists';
import PlaylistTracksModal from '../components/Spotify/PlaylistTracksModal';
import BatchProgressCard from '../components/Spotify/BatchProgressCard';
import ProgressCard from '../components/ProgressCard';
import CookieModal from '../components/Spotify/CookieModal';

import { api } from '../services/api';
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
  const [spotifyStatus, setSpotifyStatus] = useState({ connected: false, spotify_user: null });
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [selectedPlaylistForModal, setSelectedPlaylistForModal] = useState(null);
  const [extractedTracks, setExtractedTracks] = useState(null);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isStartingBatchDownload, setIsStartingBatchDownload] = useState(false);
  const [downloadingTrackId, setDownloadingTrackId] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);

  /* ── Ephemeral YouTube Cookie State ────────────────────────── */
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookieStatus, setCookieStatus] = useState({ has_cookies: false, count: 0 });

  /* ── Batch Job (persisted) ─────────────────────────────────── */
  const [activeJobId, setActiveJobId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB) || null; } catch { return null; }
  });
  const [activeJob, setActiveJob] = useState(null);

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
    api.getUserCookieStatus().then(setCookieStatus).catch(() => {});
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
      if (params.get('spotify') === 'connected') {
        pushToast('Spotify account connected successfully!', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
        setShowCookieModal(true);
      } else if (params.get('spotify_error')) {
        let rawErr = params.get('spotify_error') || '';
        try { rawErr = decodeURIComponent(rawErr.replace(/\+/g, ' ')); } catch {}
        setGeneralError(`Spotify authorization: ${rawErr}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {}
    refreshSpotifyStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Spotify helpers ───────────────────────────────────────── */
  const refreshSpotifyStatus = async () => {
    try {
      const status = await api.getSpotifyStatus();
      setSpotifyStatus(status);
      api.getUserCookieStatus().then(setCookieStatus).catch(() => {});
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
    } catch {}
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
          api.getUserCookieStatus().then(setCookieStatus).catch(() => {});
          if (s === 'completed') {
            pushToast('All playlist songs downloaded! Temporary cookies safely deleted from server.', 'info');
          }
        }
      } catch {}
    }, 1500);
    return () => { mounted = false; clearInterval(iv); };
  }, [activeJobId, setHistory]);

  /* ── Event handlers ────────────────────────────────────────── */
  const handleSpotifyConnect = () => { window.location.href = api.getSpotifyAuthUrl(); };

  const handleSpotifyDisconnect = async () => {
    try {
      await api.disconnectSpotify();
      setSpotifyStatus({ connected: false, spotify_user: null });
      setSpotifyPlaylists([]);
      setExtractedTracks(null);
      setSelectedPlaylistForModal(null);
      pushToast('Spotify account disconnected.');
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

        {/* ── WORKSPACE CONTENT ─────────────────────────────────── */}
        <motion.div key="spotify" {...pageVariants} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {!spotifyStatus.connected ? (
                <SpotifyConnect
                  spotifyStatus={spotifyStatus}
                  onConnect={handleSpotifyConnect}
                  onDisconnect={handleSpotifyDisconnect}
                  isLoading={isLoadingPlaylists}
                />
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
                        type="button"
                        onClick={() => setShowCookieModal(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: cookieStatus.has_cookies ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          border: cookieStatus.has_cookies ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                          color: cookieStatus.has_cookies ? '#6ee7b7' : 'var(--text-secondary)',
                          transition: 'all 0.2s'
                        }}
                        title="Click to configure or view temporary YouTube verification cookies"
                      >
                        <Cookie size={13} />
                        <span>{cookieStatus.has_cookies ? `Cookies Active (${cookieStatus.count})` : 'Paste Cookies (Recommended)'}</span>
                      </button>

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
                        style={{ fontSize: 12, padding: '6px 12px', color: 'var(--text-muted)' }}
                        title="Disconnect Spotify"
                      >
                        <LogOut size={13} />
                        <span>Disconnect</span>
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
            onStartDownload={handleStartBatchDownload}
            onDownloadSingleTrack={handleDownloadSingleTrack}
            isLoadingTracks={isLoadingTracks}
            isStartingDownload={isStartingBatchDownload}
            downloadingTrackId={downloadingTrackId}
          />
        )}

        {/* Ephemeral YouTube Cookie Verification Modal */}
        <CookieModal
          isOpen={showCookieModal}
          onClose={() => setShowCookieModal(false)}
          existingCookieCount={cookieStatus.count}
          onSuccess={(count) => {
            setCookieStatus({ has_cookies: true, count });
            pushToast(`Loaded ${count} verification cookies! They will be wiped after your download.`, 'success');
          }}
        />

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
