const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
export const BACKEND_URL = RAW_BACKEND_URL.replace(/\/+$/, '');
export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';
export const SPOTIFY_BASE = BACKEND_URL ? `${BACKEND_URL}/spotify` : '/spotify';

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
   * Returns Spotify authorization entrypoint URL
   */
  getSpotifyAuthUrl() {
    return `${SPOTIFY_BASE}/auth`;
  },

  /**
   * Checks current user's Spotify connection status
   */
  async getSpotifyStatus() {
    try {
      const res = await fetch(`${SPOTIFY_BASE}/status`, { credentials: 'include' });
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
    const res = await fetch(`${SPOTIFY_BASE}/disconnect`, {
      method: 'POST',
      credentials: 'include'
    });
    return await res.json();
  },

  /**
   * Retrieves all playlists for the authenticated Spotify user
   */
  async getSpotifyPlaylists() {
    const res = await fetch(`${SPOTIFY_BASE}/playlists`, { credentials: 'include' });
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
    const res = await fetch(`${SPOTIFY_BASE}/playlists/${playlistId}/tracks`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to fetch playlist tracks.');
    }
    return data.data;
  },

  /**
   * Dispatches Spotify Playlist -> Serper -> Existing yt-dlp Downloader pipeline
   * Supports optional trackIds to download selected subset
   */
  async startPlaylistDownload(playlistId, format = 'mp3-320', trackIds = null) {
    const payload = { format };
    if (trackIds && trackIds.length > 0) {
      payload.track_ids = trackIds;
    }
    const res = await fetch(`${SPOTIFY_BASE}/playlists/${playlistId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to start playlist download.');
    }
    return data.job_id;
  },

  /**
   * Dispatches single track download with DB caching & Serper candidate resolution
   */
  async downloadSingleSpotifyTrack({ song_name, artist_name, thumbnail, format = 'mp3-320' }) {
    const res = await fetch(`${SPOTIFY_BASE}/track/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        song_name,
        artist_name,
        thumbnail,
        format,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to download track.');
    }
    return data;
  },

  /**
   * Polls batch playlist download job progress
   */
  async getPlaylistJobStatus(jobId) {
    const res = await fetch(`${SPOTIFY_BASE}/jobs/${jobId}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to get playlist job status.');
    }
    return data.job;
  },

  /**
   * Retrieves the most recent playlist download batch job for the current user
   */
  async getLatestPlaylistJob() {
    try {
      const res = await fetch(`${SPOTIFY_BASE}/jobs/latest`, { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.job || null;
    } catch {
      return null;
    }
  },

  /**
   * Returns the direct download URL for the packaged playlist ZIP archive
   */
  getPlaylistZipUrl(jobId) {
    if (!jobId) return '';
    return `${SPOTIFY_BASE}/jobs/${jobId}/zip`;
  }
};

