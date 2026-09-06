import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProgressCard from './components/ProgressCard';
import AudioPlayer from './components/AudioPlayer';
import HistoryDrawer from './components/HistoryDrawer';

// Spotify components
import SpotifyConnect from './components/Spotify/SpotifyConnect';
import SpotifyPlaylists from './components/Spotify/SpotifyPlaylists';
import PlaylistTracksModal from './components/Spotify/PlaylistTracksModal';
import BatchProgressCard from './components/Spotify/BatchProgressCard';

import { api } from './services/api';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDownloadTask } from './hooks/useDownloadTask';
import { STORAGE_KEYS } from './constants';
import {
  AlertCircle,
  Music,
  Link2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Home,
  ArrowRight,
  Database,
  Clock,
  Archive,
  Layers,
  Zap,
  CheckCircle,
  LogOut
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'spotify'
  const [playingTrack, setPlayingTrack] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [health, setHealth] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Spotify state
  const [spotifyStatus, setSpotifyStatus] = useState({ connected: false, spotify_user: null });
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [selectedPlaylistForModal, setSelectedPlaylistForModal] = useState(null);
  const [extractedTracks, setExtractedTracks] = useState(null);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isStartingBatchDownload, setIsStartingBatchDownload] = useState(false);
  const [downloadingTrackId, setDownloadingTrackId] = useState(null);

  // Batch Job state with background persistence across tab closures / refresh
  const [activeJobId, setActiveJobId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB) || null;
    } catch {
      return null;
    }
  });
  const [activeJob, setActiveJob] = useState(null);

  // Persistent download history
  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.HISTORY, []);

  // Sync activeJobId to localStorage
  useEffect(() => {
    try {
      if (activeJobId) {
        localStorage.setItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB, activeJobId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB);
      }
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [activeJobId]);

  // Completion callback when single audio finishes converting & downloading
  const handleTaskCompleted = useCallback((completedTask) => {
    setHistory((prev) => [
      {
        file_id: completedTask.file_id,
        title: completedTask.title,
        artist: completedTask.artist,
        thumbnail: completedTask.thumbnail,
        filename: completedTask.filename,
        filesize: completedTask.filesize,
        timestamp: Date.now()
      },
      ...prev.filter((item) => item.file_id !== completedTask.file_id)
    ]);
  }, [setHistory]);

  // Dedicated single task hook
  const {
    activeTask,
    activeTrackIndex,
    error: taskError,
    startDownload,
    resetTask,
    setError: setTaskError
  } = useDownloadTask(handleTaskCompleted);

  // Health poll on mount
  useEffect(() => {
    const checkHealth = async () => {
      const res = await api.getHealth();
      setHealth(res);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  // Check Spotify status & URL search params on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('spotify') === 'connected') {
        setActiveTab('spotify');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('spotify_error')) {
        setActiveTab('spotify');
        let rawErr = params.get('spotify_error') || '';
        try {
          rawErr = decodeURIComponent(rawErr.replace(/\+/g, ' '));
        } catch {
          // Keep raw string if malformed
        }
        setGeneralError(`Spotify authorization: ${rawErr}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn('URL search params parsing error:', e);
    }

    refreshSpotifyStatus();
  }, []);

  const refreshSpotifyStatus = async () => {
    try {
      const status = await api.getSpotifyStatus();
      setSpotifyStatus(status);
      if (status.connected) {
        fetchPlaylists();
        // Automatically retrieve the user's latest or completed batch job
        try {
          const latestJob = await api.getLatestPlaylistJob();
          if (latestJob && (latestJob.status === 'COMPLETED' || latestJob.status === 'PROCESSING' || latestJob.status === 'QUEUED')) {
            setActiveJobId(latestJob.id);
            setActiveJob(latestJob);
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Spotify status error:', e);
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

  // Poll active Spotify batch download job
  useEffect(() => {
    if (!activeJobId) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const job = await api.getPlaylistJobStatus(activeJobId);
        if (!isMounted) return;
        setActiveJob(job);

        // Update history with any completed tracks
        const tracksArray = job.tracks || job.track_results || [];
        if (tracksArray.length > 0) {
          const finishedTracks = tracksArray.filter(
            (t) => (t.status || '').toLowerCase() === 'completed' && t.file_id
          );
          if (finishedTracks.length > 0) {
            setHistory((prev) => {
              const existingIds = new Set(prev.map((h) => h.file_id));
              const newItems = finishedTracks
                .filter((t) => !existingIds.has(t.file_id))
                .map((t) => ({
                  file_id: t.file_id,
                  title: t.song_name || t.title || t.name,
                  artist: t.artist_name || t.artist || (Array.isArray(t.artists) ? t.artists.join(', ') : t.artists),
                  thumbnail: t.thumbnail,
                  filename: t.filename || `${t.song_name || t.name || 'track'}.mp3`,
                  filesize: t.filesize || 0,
                  timestamp: Date.now()
                }));
              return [...newItems, ...prev];
            });
          }
        }

        const normStatus = (job.status || '').toLowerCase();
        if (normStatus === 'completed' || normStatus === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.warn('Error polling playlist job:', err);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [activeJobId, setHistory]);

  const handleSpotifyConnect = () => {
    window.location.href = '/spotify/auth';
  };

  const handleSpotifyDisconnect = async () => {
    try {
      await api.disconnectSpotify();
      setSpotifyStatus({ connected: false, spotify_user: null });
      setSpotifyPlaylists([]);
      setExtractedTracks(null);
      setSelectedPlaylistForModal(null);
      setSuccessNotice('Spotify account disconnected.');
    } catch (err) {
      setGeneralError(err.message || 'Failed to disconnect Spotify account.');
    }
  };

  const handleSelectSpotifyPlaylist = async (playlistId) => {
    const pl = spotifyPlaylists.find((p) => p.id === playlistId) || { id: playlistId, name: 'Spotify Playlist' };
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

  const handleStartPlaylistBatchDownload = async (playlistId, format, trackIds) => {
    setIsStartingBatchDownload(true);
    setGeneralError(null);
    resetTask(); // Clear any single track card to avoid confusion
    const selectedPl = selectedPlaylistForModal;
    const totalCount = trackIds ? trackIds.length : (extractedTracks?.length || selectedPl?.tracks_total || 0);

    try {
      const jobId = await api.startPlaylistDownload(playlistId, format, trackIds);
      setActiveJobId(jobId);
      setActiveJob({
        id: jobId,
        playlist_name: selectedPl?.name || 'Spotify Playlist',
        total_tracks: totalCount,
        processed_tracks: 0,
        successful_tracks: 0,
        failed_tracks: 0,
        status: 'PROCESSING',
        tracks: [],
        zip_filename: 'Thanks_for_downloading.zip'
      });
      setSelectedPlaylistForModal(null);
      setExtractedTracks(null);
      setSuccessNotice('Started playlist folder download! All songs are being packaged into Thanks_for_downloading folder.');
    } catch (err) {
      setGeneralError(err.message || 'Failed to start batch playlist download.');
    } finally {
      setIsStartingBatchDownload(false);
    }
  };

  // Download a single song individually from the Spotify tracks list
  const handleDownloadSingleTrack = async (track, format, trackId) => {
    setDownloadingTrackId(trackId);
    setGeneralError(null);
    try {
      const songName = track.song_name || track.title || track.name;
      const artistName = track.artist_name || track.artist || (Array.isArray(track.artists) ? track.artists.join(', ') : track.artists) || '';
      
      const data = await api.downloadSingleSpotifyTrack({
        song_name: songName,
        artist_name: artistName,
        thumbnail: track.thumbnail,
        format: format || 'mp3-320',
      });

      if (data?.task_id) {
        setSuccessNotice(`Started download for "${songName}"! Track progress below.`);
        await startDownload({
          url: data.candidate_url,
          format: format || 'mp3-320',
          title: songName,
          artist: artistName,
          thumbnail: track.thumbnail,
          existingTaskId: data.task_id
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
    try {
      localStorage.removeItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB);
    } catch {}
  };

  const activeError = generalError || taskError;

  return (
    <>
      <div className="glow-blob glow-blob-1" />
      <div className="glow-blob glow-blob-2" />

      <div className="app-container">
        <Header
          health={health}
          onToggleHistory={() => setShowHistory(!showHistory)}
          historyCount={history.length}
        />

        {showHistory && (
          <HistoryDrawer
            history={history}
            onPlay={(track) => setPlayingTrack(track)}
            onClear={() => setHistory([])}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* Primary Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid var(--border-glass)',
            gap: '6px'
          }}
        >
          <button
            onClick={() => setActiveTab('home')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              background: activeTab === 'home' ? 'linear-gradient(135deg, rgba(29, 185, 84, 0.2) 0%, rgba(56, 189, 248, 0.15) 100%)' : 'transparent',
              color: activeTab === 'home' ? 'var(--accent-green)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'home' ? '0 0 15px rgba(29, 185, 84, 0.15)' : 'none'
            }}
          >
            <Home size={16} />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('spotify')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              background: activeTab === 'spotify' ? 'linear-gradient(135deg, rgba(29, 185, 84, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'transparent',
              color: activeTab === 'spotify' ? 'var(--accent-green)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'spotify' ? '0 0 15px rgba(29, 185, 84, 0.2)' : 'none'
            }}
          >
            <Music size={16} />
            <span>Spotify Downloader</span>
            {spotifyStatus.connected && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }} />
            )}
          </button>
        </div>

        {/* Global Notifications */}
        {successNotice && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(29, 185, 84, 0.12)',
              border: '1px solid rgba(29, 185, 84, 0.3)',
              color: '#1ed760',
              fontSize: '13px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{successNotice}</span>
            </div>
            <button
              onClick={() => setSuccessNotice(null)}
              style={{ background: 'none', border: 'none', color: '#1ed760', cursor: 'pointer', fontSize: '16px' }}
            >
              ×
            </button>
          </div>
        )}

        {activeError && (
          <div className="error-box">
            <AlertCircle size={18} />
            <span style={{ flex: 1 }}>{activeError}</span>
            <button
              onClick={() => {
                setGeneralError(null);
                setTaskError(null);
              }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Active Spotify Batch Job Progress Card (Persistent & Visible across tabs) */}
        {activeJob && (
          <BatchProgressCard
            job={activeJob}
            onDismiss={handleDismissBatchJob}
            onPlayAudio={(track) => setPlayingTrack(track)}
          />
        )}

        {/* Progress Card when downloading single track */}
        {activeTask && (
          <ProgressCard
            task={activeTask}
            onPlayAudio={(task) => setPlayingTrack(task)}
            onReset={resetTask}
          />
        )}

        {/* ================= MODE 1: HOMEPAGE LANDING ================= */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Hero Card */}
            <div
              className="glass-panel"
              style={{
                padding: '40px 32px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                background: 'linear-gradient(180deg, rgba(16, 21, 34, 0.8) 0%, rgba(10, 13, 20, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 60px rgba(29, 185, 84, 0.12)'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'rgba(29, 185, 84, 0.12)',
                  border: '1px solid rgba(29, 185, 84, 0.3)',
                  color: 'var(--accent-green)',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <Sparkles size={14} />
                <span>Next-Gen Spotify Downloader • 320 kbps & Neon DB Caching</span>
              </div>

              <h1
                style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  lineHeight: '1.2',
                  color: 'var(--text-primary)',
                  maxWidth: '650px',
                  letterSpacing: '-0.5px'
                }}
              >
                Download Any Spotify Playlist or Song in Ultra-HQ Audio
              </h1>

              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  maxWidth: '560px',
                  lineHeight: '1.6'
                }}
              >
                Log in securely via Spotify OAuth, explore your entire playlist library, and download either individual songs or complete playlists packaged into a clean folder with exact artist and song filenames.
              </p>

              {/* Main Call to Action Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => setActiveTab('spotify')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1ed760 0%, #10b981 100%)',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: '15px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(29, 185, 84, 0.35)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <Music size={18} />
                  <span>Launch Spotify Downloader</span>
                  <ArrowRight size={17} />
                </button>
              </div>

              {/* Quick Status Pill if Spotify Already Connected */}
              {spotifyStatus.connected && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <CheckCircle size={14} color="var(--accent-green)" />
                  <span>
                    Linked as <strong>{spotifyStatus.spotify_user?.display_name || 'Spotify User'}</strong> • {spotifyPlaylists.length} playlists ready
                  </span>
                </div>
              )}
            </div>

            {/* 3-Step Flow Diagram Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29, 185, 84, 0.15)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>1. Connect Spotify</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Authenticate via PKCE OAuth to access your private and public playlists with zero token storage risks.
                </p>
              </div>

              <div
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={20} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>2. Select Playlist & Songs</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Extract full tracklists (up to 1,400+ songs). Select specific songs or download the complete playlist.
                </p>
              </div>

              <div
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Archive size={20} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>3. Folder on PC</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Save all playlist songs directly into a folder <code>Thanks_for_downloading</code> on your PC with exact titles.
                </p>
              </div>
            </div>

            {/* Architecture Highlights */}
            <div
              className="glass-panel"
              style={{
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Database size={22} style={{ color: 'var(--accent-green)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Neon DB Smart Caching</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Matches both song title and artist. Repeated searches skip Serper API entirely and load directly from PostgreSQL.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Clock size={22} style={{ color: 'var(--accent-purple)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Live ETA Timer & Persistence</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Calculates real-time completion countdown. You can close the page, do other things, and come back later to save your folder.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODE 2: SPOTIFY OAUTH & PLAYLISTS ================= */}
        {activeTab === 'spotify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Show OAuth connect message ONLY when NOT connected */}
            {!spotifyStatus.connected ? (
              <SpotifyConnect
                spotifyStatus={spotifyStatus}
                onConnect={handleSpotifyConnect}
                onDisconnect={handleSpotifyDisconnect}
                isLoading={isLoadingPlaylists}
              />
            ) : (
              /* When ALREADY connected: OAuth message is completely hidden, just the playlist appears */
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Your Spotify Playlists
                    </h3>
                    {spotifyStatus?.spotify_user && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--accent-green)',
                          background: 'rgba(29, 185, 84, 0.12)',
                          border: '1px solid rgba(29, 185, 84, 0.25)',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}
                      >
                        {spotifyStatus.spotify_user.display_name || spotifyStatus.spotify_user.id}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="icon-btn"
                      onClick={fetchPlaylists}
                      disabled={isLoadingPlaylists}
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                    >
                      <RefreshCw size={14} className={isLoadingPlaylists ? 'spinner' : ''} />
                      <span>Refresh Playlists</span>
                    </button>
                    <button
                      className="icon-btn"
                      onClick={handleSpotifyDisconnect}
                      disabled={isLoadingPlaylists}
                      style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--text-muted)' }}
                      title="Disconnect Spotify account"
                    >
                      <LogOut size={13} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>

                <SpotifyPlaylists
                  playlists={spotifyPlaylists}
                  onSelectPlaylist={handleSelectSpotifyPlaylist}
                  isLoading={isLoadingTracks}
                  activePlaylistId={selectedPlaylistForModal?.id}
                />
              </>
            )}
          </div>
        )}

        {/* Spotify Playlist Tracks Inspection Modal */}
        {selectedPlaylistForModal && (
          <PlaylistTracksModal
            playlist={selectedPlaylistForModal}
            tracks={extractedTracks}
            isOpen={Boolean(selectedPlaylistForModal)}
            onClose={() => {
              setSelectedPlaylistForModal(null);
              setExtractedTracks(null);
            }}
            onStartDownload={handleStartPlaylistBatchDownload}
            onDownloadSingleTrack={handleDownloadSingleTrack}
            isLoadingTracks={isLoadingTracks}
            isStartingDownload={isStartingBatchDownload}
            downloadingTrackId={downloadingTrackId}
          />
        )}

        {/* In-browser Audio Player Preview */}
        {playingTrack && (
          <AudioPlayer
            track={playingTrack}
            onClose={() => setPlayingTrack(null)}
          />
        )}

        <footer className="footer">
          <p>TuneFetch • High-Fidelity Audio Extractor & Spotify Downloader</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Made by Kunal Srivastava with ❤️ • Free to use if anyone wants it!
          </p>
        </footer>
      </div>
    </>
  );
}
