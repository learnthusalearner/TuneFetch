const API_BASE = '/api';

export const api = {
  /**
   * Health check to detect backend connectivity and ffmpeg availability
   */
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { credentials: 'include' });
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable:', e);
      return { status: 'offline', ffmpeg_available: false, version: '0.0.0' };
    }
  },

  /**
   * Fetches metadata for single tracks or URL
   */
  async fetchInfo(url) {
    const res = await fetch(`${API_BASE}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url: url.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to extract media information.');
    }
    return data.data;
  },

  /**
   * Initiates a single download task
   */
  async startDownload({ url, format = 'mp3-320', title, artist, thumbnail }) {
    const res = await fetch(`${API_BASE}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        url: url.trim(),
        format,
        title,
        artist,
        thumbnail
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to initiate download task.');
    }
    return data.task_id;
  },

  /**
   * Polls single task status
   */
  async getStatus(taskId) {
    const res = await fetch(`${API_BASE}/status/${taskId}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Task status check failed.');
    }
    return data.task;
  },

  /**
   * Builds direct file download URL with target filename preserved in the URI
   */
  getDownloadUrl(taskId, filename = '') {
    if (!taskId) return '';
    if (filename) {
      const safe = filename.replace(/[<>:"/\\|?*]/g, '_');
      return `${API_BASE}/file/${taskId}/${encodeURIComponent(safe)}`;
    }
    return `${API_BASE}/file/${taskId}`;
  },

  /**
   * Builds audio stream URL for in-browser playback
   */
  getStreamUrl(taskId) {
    if (!taskId) return '';
    return `${API_BASE}/stream/${taskId}`;
  },

  // ==================== SPOTIFY OAUTH & PLAYLIST API ====================

  /**
   * Checks current user's Spotify connection status
   */
  async getSpotifyStatus() {
    try {
      const res = await fetch(`/spotify/status`, { credentials: 'include' });
      if (!res.ok) return { connected: false, spotify_user: null };
      return await res.json();
    } catch (e) {
      return { connected: false, spotify_user: null };
    }
  },

  /**
   * Disconnects/unlinks current user's Spotify account
   */
  async disconnectSpotify() {
    const res = await fetch(`/spotify/disconnect`, {
      method: 'POST',
      credentials: 'include'
    });
    return await res.json();
  },

  /**
   * Retrieves all playlists for the authenticated Spotify user
   */
  async getSpotifyPlaylists() {
    const res = await fetch(`/spotify/playlists`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to fetch Spotify playlists.');
    }
    return data.playlists || [];
  },

  /**
   * Retrieves normalized tracklist for a playlist without starting download
   */
  async getPlaylistTracks(playlistId) {
    const res = await fetch(`/spotify/playlists/${playlistId}/tracks`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to fetch playlist tracks.');
    }
    return data.data;
  },

  /**
   * Dispatches Spotify Playlist -> Serper -> Existing yt-dlp Downloader pipeline
   */
  async startPlaylistDownload(playlistId, format = 'mp3-320') {
    const res = await fetch(`/spotify/playlists/${playlistId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ format }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to start playlist download.');
    }
    return data.job_id;
  },

  /**
   * Polls batch playlist download job progress
   */
  async getPlaylistJobStatus(jobId) {
    const res = await fetch(`/spotify/jobs/${jobId}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to get playlist job status.');
    }
    return data.job;
  }
};
