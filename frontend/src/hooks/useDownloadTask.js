import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export function useDownloadTask(onComplete) {
  const [activeTask, setActiveTask] = useState(null);
  const [activeTrackIndex, setActiveTrackIndex] = useState(null);
  const [error, setError] = useState(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    if (!activeTask?.id || activeTask.status === 'completed' || activeTask.status === 'error') {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const updated = await api.getStatus(activeTask.id);
        setActiveTask(updated);

        if (updated.status === 'completed') {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          setActiveTrackIndex(null);
          if (onComplete) onComplete(updated);
        } else if (updated.status === 'error') {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          setActiveTrackIndex(null);
          setError(updated.error || 'Download failed during conversion.');
        }
      } catch (err) {
        console.error('Error polling task status:', err);
      }
    }, 750);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [activeTask?.id, activeTask?.status, onComplete]);

  const startDownload = async ({ url, format, title, artist, thumbnail, trackId, existingTaskId }) => {
    setError(null);
    if (trackId !== undefined) {
      setActiveTrackIndex(trackId);
    }

    try {
      const taskId = existingTaskId || await api.startDownload({ url, format, title, artist, thumbnail });
      setActiveTask({
        id: taskId,
        url,
        title: title || 'Starting audio download...',
        artist: artist || '',
        thumbnail: thumbnail || '',
        status: 'pending',
        progress: 0,
        speed: '0 KB/s',
        eta: '--'
      });
      return taskId;
    } catch (err) {
      setError(err.message || 'Failed to start download.');
      setActiveTrackIndex(null);
      throw err;
    }
  };

  const resetTask = () => {
    setActiveTask(null);
    setActiveTrackIndex(null);
    setError(null);
  };

  return {
    activeTask,
    activeTrackIndex,
    error,
    startDownload,
    resetTask,
    setError
  };
}
