import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import MediaCard from './components/MediaCard';
import PlaylistCard from './components/PlaylistCard';
import ProgressCard from './components/ProgressCard';
import AudioPlayer from './components/AudioPlayer';
import HistoryDrawer from './components/HistoryDrawer';

import { api } from './services/api';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDownloadTask } from './hooks/useDownloadTask';
import { STORAGE_KEYS } from './constants';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [health, setHealth] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  // Persistent download history
  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.HISTORY, []);

  // Completion callback when audio finishes converting & downloading
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

  // Dedicated task hook
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

        <UrlInput
          url={url}
          setUrl={setUrl}
          onSubmit={handleFetchInfo}
          isLoading={isLoadingInfo}
        />

        {activeError && (
          <div className="error-box">
            <AlertCircle size={18} />
            <span>{activeError}</span>
          </div>
        )}

        {/* Progress Card when downloading */}
        {activeTask && (
          <ProgressCard
            task={activeTask}
            onPlayAudio={(task) => setPlayingTrack(task)}
            onReset={resetTask}
          />
        )}

        {/* In-browser Audio Player Preview */}
        {playingTrack && (
          <AudioPlayer
            track={playingTrack}
            onClose={() => setPlayingTrack(null)}
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

        <footer className="footer">
          <p>TuneFetch • High-Fidelity Audio Extractor</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Powered by Python <code>yt-dlp</code> & React
          </p>
        </footer>
      </div>
    </>
  );
}
