import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import MediaCard from './components/MediaCard';
import PlaylistCard from './components/PlaylistCard';
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
import { AlertCircle, Music, Link2, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'spotify'
  const [url, setUrl] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);
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

  // Batch Job state
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeJob, setActiveJob] = useState(null);

  // Persistent download history
  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.HISTORY, []);

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
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify') === 'connected') {
      setActiveTab('spotify');
      setSuccessNotice('Successfully connected your Spotify account!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('spotify_error')) {
      setActiveTab('spotify');
      setGeneralError(`Spotify authorization failed: ${params.get('spotify_error')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    refreshSpotifyStatus();
  }, []);

  const refreshSpotifyStatus = async () => {
    try {
      const status = await api.getSpotifyStatus();
      setSpotifyStatus(status);
      if (status.connected) {
        fetchPlaylists();
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
        if (job.track_results && job.track_results.length > 0) {
          const finishedTracks = job.track_results.filter((t) => t.status === 'completed' && t.file_id);
          if (finishedTracks.length > 0) {
            setHistory((prev) => {
              const existingIds = new Set(prev.map((h) => h.file_id));
              const newItems = finishedTracks
                .filter((t) => !existingIds.has(t.file_id))
                .map((t) => ({
                  file_id: t.file_id,
                  title: t.title,
                  artist: t.artists,
                  thumbnail: t.thumbnail,
                  filename: t.filename || `${t.title}.mp3`,
                  filesize: t.filesize || 0,
                  timestamp: Date.now()
                }));
              return [...newItems, ...prev];
            });
          }
        }

        if (job.status === 'completed' || job.status === 'failed') {
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

  const handleStartPlaylistBatchDownload = async (playlistId, format) => {
    setIsStartingBatchDownload(true);
    setGeneralError(null);
    try {
      const jobId = await api.startPlaylistDownload(playlistId, format);
      setActiveJobId(jobId);
      setSelectedPlaylistForModal(null);
      setExtractedTracks(null);
    } catch (err) {
      setGeneralError(err.message || 'Failed to start batch playlist download.');
    } finally {
      setIsStartingBatchDownload(false);
    }
  };

  const handleFetchInfo = async () => {
    if (!url.trim()) return;
    setGeneralError(null);
    setIsLoadingInfo(true);
    setMediaInfo(null);

    try {
      const data = await api.fetchInfo(url.trim());
      setMediaInfo(data);
    } catch (err) {
      setGeneralError(err.message || 'Failed to extract media information.');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleDownloadTrigger = async (params) => {
    setGeneralError(null);
    try {
      await startDownload(params);
    } catch (err) {
      setGeneralError(err.message || 'Could not start download task.');
    }
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

        {/* Tab Navigation */}
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
            onClick={() => setActiveTab('direct')}
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
              background: activeTab === 'direct' ? 'linear-gradient(135deg, rgba(29, 185, 84, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)' : 'transparent',
              color: activeTab === 'direct' ? 'var(--accent-green)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'direct' ? '0 0 15px rgba(29, 185, 84, 0.15)' : 'none'
            }}
          >
            <Link2 size={16} />
            <span>Direct URL / Search</span>
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
            <span>Spotify OAuth & Playlists</span>
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

        {/* Active Spotify Batch Job Progress Card */}
        {activeJob && (
          <BatchProgressCard
            job={activeJob}
            onDismiss={() => {
              if (activeJob.status === 'completed' || activeJob.status === 'failed') {
                setActiveJob(null);
                setActiveJobId(null);
              }
            }}
            onPlayAudio={(track) => setPlayingTrack(track)}
          />
        )}

        {/* ================= MODE: DIRECT URL / SEARCH ================= */}
        {activeTab === 'direct' && (
          <>
            <UrlInput
              url={url}
              setUrl={setUrl}
              onSubmit={handleFetchInfo}
              isLoading={isLoadingInfo}
            />

            {/* Progress Card when downloading single track */}
            {activeTask && (
              <ProgressCard
                task={activeTask}
                onPlayAudio={(task) => setPlayingTrack(task)}
                onReset={resetTask}
              />
            )}

            {/* Media Preview (Single Track) */}
            {mediaInfo && !mediaInfo.is_playlist && (
              <MediaCard
                media={mediaInfo}
                onDownload={handleDownloadTrigger}
                isDownloading={Boolean(activeTask && activeTask.status !== 'completed' && activeTask.status !== 'error')}
              />
            )}

            {/* Playlist / Album Preview */}
            {mediaInfo && mediaInfo.is_playlist && (
              <PlaylistCard
                playlist={mediaInfo}
                onDownloadTrack={handleDownloadTrigger}
                activeTaskId={activeTask?.id}
                activeTrackIndex={activeTrackIndex}
              />
            )}
          </>
        )}

        {/* ================= MODE: SPOTIFY OAUTH & PLAYLISTS ================= */}
        {activeTab === 'spotify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SpotifyConnect
              spotifyStatus={spotifyStatus}
              onConnect={handleSpotifyConnect}
              onDisconnect={handleSpotifyDisconnect}
              isLoading={isLoadingPlaylists}
            />

            {spotifyStatus.connected && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="icon-btn"
                    onClick={fetchPlaylists}
                    disabled={isLoadingPlaylists}
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    <RefreshCw size={14} className={isLoadingPlaylists ? 'spinner' : ''} />
                    <span>Refresh Playlists</span>
                  </button>
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
            isLoadingTracks={isLoadingTracks}
            isStartingDownload={isStartingBatchDownload}
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
            Integrated with Neon PostgreSQL, Spotify Web API & Serper Candidate Resolution
          </p>
        </footer>
      </div>
    </>
  );
}
