const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
export const BACKEND_URL = RAW_BACKEND_URL.replace(/\/+$/, '');
export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';
export const SPOTIFY_BASE = BACKEND_URL ? `${BACKEND_URL}/spotify` : '/spotify';

export const CLOUD_WEB_URL = 'https://tune-fetch-tan.vercel.app';
export const CLOUD_BACKEND_URL = 'https://tunefetch-t5mp.onrender.com';

/**
 * Retrieves the persisted client-side user UUID.
 * Bypasses third-party cookie blocking on cross-origin deployments (Vercel <-> Render).
 */
export const getStoredUserId = () => {
  try {
    let id = localStorage.getItem('tunefetch_user_id');
    if (!id || id.trim().length < 5) {
      // Generate standard RFC4122 v4 UUID
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      localStorage.setItem('tunefetch_user_id', id);
    }
    return id;
  } catch {
    return '';
  }
};

/**
 * Persists the confirmed user UUID across sessions.
 */
export const setStoredUserId = (id) => {
  try {
    if (id && typeof id === 'string' && id.trim().length >= 5) {
      localStorage.setItem('tunefetch_user_id', id.trim());
    }
  } catch {}
};

/**
 * High-reliability fetch wrapper with automatic user identification & cookie credentials.
 */
async function secureFetch(url, options = {}) {
  const opts = { ...options };
  opts.credentials = 'include';
  opts.headers = { ...(opts.headers || {}) };

  const userId = getStoredUserId();
  if (userId) {
    opts.headers['X-User-Id'] = userId;
  }

  const res = await fetch(url, opts);

  // Sync session ID if returned from server
  const returnedUserId = res.headers.get('x-user-id');
  if (returnedUserId) {
    setStoredUserId(returnedUserId);
  }

  return res;
}

export const api = {
  /**
   * Health check to detect backend connectivity and ffmpeg availability
   */
  async getHealth() {
    try {
      const res = await secureFetch(`${API_BASE}/health`);
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
    const res = await secureFetch(`${API_BASE}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to extract media information.');
    }
    return data.data;
  },

  /**
   * Resolves direct stream URL and metadata for client-side / distributed playback
   */
  async fetchDirectStreamUrl(url) {
    const res = await secureFetch(`${API_BASE}/stream-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to resolve direct stream URL.');
    }
    return data;
  },

  /**
   * Initiates a single download task
   */
  async startDownload({ url, format = 'mp3-320', title, artist, thumbnail }) {
    const res = await secureFetch(`${API_BASE}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await secureFetch(`${API_BASE}/status/${taskId}`);
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
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    if (filename) {
      const safe = filename.replace(/[<>:"/\\|?*]/g, '_');
      return `${API_BASE}/file/${taskId}/${encodeURIComponent(safe)}${query}`;
    }
    return `${API_BASE}/file/${taskId}${query}`;
  },

  /**
   * Builds audio stream URL for in-browser playback
   */
  getStreamUrl(taskId) {
    if (!taskId) return '';
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return `${API_BASE}/stream/${taskId}${query}`;
  },

  // ==================== SPOTIFY OAUTH & PLAYLIST API ====================

  /**
   * Returns Spotify authorization entrypoint URL bound to user UUID
   */
  getSpotifyAuthUrl() {
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return `${SPOTIFY_BASE}/auth${query}`;
  },

  /**
   * Checks current user's Spotify connection status
   */
  async getSpotifyStatus() {
    try {
      const res = await secureFetch(`${SPOTIFY_BASE}/status`);
      if (!res.ok) return { connected: false, spotify_user: null };
      const data = await res.json();
      if (data.user_id) {
        setStoredUserId(data.user_id);
      }
      return data;
    } catch (e) {
      return { connected: false, spotify_user: null };
    }
  },

  /**
   * Disconnects/unlinks current user's Spotify account
   */
  async disconnectSpotify() {
    const res = await secureFetch(`${SPOTIFY_BASE}/disconnect`, {
      method: 'POST'
    });
    return await res.json();
  },

  /**
   * Fully logs out current user: unlinks Spotify on backend,
   * purges local session identifiers, and generates a fresh UUID
   * so the next login can connect any Spotify account.
   */
  async logout() {
    try {
      await this.disconnectSpotify();
    } catch (e) {
      console.warn('Backend disconnect error:', e);
    }
    try {
      localStorage.removeItem('tunefetch_user_id');
      localStorage.removeItem('tf_spotify_active_job');
      // Generate standard RFC4122 v4 UUID
      const newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      localStorage.setItem('tunefetch_user_id', newId);
    } catch {}
    return true;
  },

  /**
   * Retrieves all playlists for the authenticated Spotify user
   */
  async getSpotifyPlaylists() {
    const res = await secureFetch(`${SPOTIFY_BASE}/playlists`);
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
    const res = await secureFetch(`${SPOTIFY_BASE}/playlists/${playlistId}/tracks`);
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
    const res = await secureFetch(`${SPOTIFY_BASE}/playlists/${playlistId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await secureFetch(`${SPOTIFY_BASE}/track/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await secureFetch(`${SPOTIFY_BASE}/jobs/${jobId}`);
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
      const res = await secureFetch(`${SPOTIFY_BASE}/jobs/latest`);
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
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return `${SPOTIFY_BASE}/jobs/${jobId}/zip${query}`;
  },

  // ==================== CLOUD SESSION & LOCAL DESKTOP HANDOFF API ====================

  /**
   * Pings the local TuneFetch desktop engine on localhost:8000
   */
  async checkLocalDesktopStatus() {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 1800);
      const res = await fetch('http://127.0.0.1:8000/api/local/status', {
        method: 'GET',
        signal: ctrl.signal
      });
      clearTimeout(tid);
      if (!res.ok) return { isRunning: false };
      const data = await res.json();
      return { isRunning: true, ...data };
    } catch {
      return { isRunning: false };
    }
  },

  /**
   * Generates a 24-hour cloud session code (e.g. TF-4982) holding the playlist songs JSON
   * and candidate URLs resolved via PostgreSQL cache and Serper API.
   */
  async createCloudSession({ playlist_name, image = '', tracks = [] }) {
    const url = `${API_BASE}/cloud-session`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlist_name, image, tracks })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to create cloud download session.');
    }
    return data;
  },

  /**
   * Retrieves songs JSON by 6-digit session code (e.g. TF-4982)
   */
  async getCloudSession(code) {
    const clean = encodeURIComponent(code.trim().toUpperCase());
    const url = `${API_BASE}/cloud-session/${clean}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Download session code not found or has expired.');
    }
    return data.session;
  },

  /**
   * Sends the songs JSON directly to local TuneFetch CLI service running on 127.0.0.1:8000
   */
  async sendToLocalDesktop({ playlist_name, tracks, format = 'mp3-320' }) {
    const res = await fetch('http://127.0.0.1:8000/api/local/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlist_name, tracks, format })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to dispatch to local TuneFetch CLI engine.');
    }
    return data;
  },

  /**
   * Tells local TuneFetch CLI to fetch code TF-XXXX from cloud and start downloading
   */
  async importSessionToLocalDesktop(session_code, format = 'mp3-320') {
    const res = await fetch('http://127.0.0.1:8000/api/local/import-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_code, format })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to import session code into local CLI.');
    }
    return data;
  },

  /**
   * Polls local batch download progress
   */
  async getLocalBatchProgress(batchId) {
    const res = await fetch(`http://127.0.0.1:8000/api/local/progress/${batchId}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to fetch local download progress.');
    }
    return data.batch;
  },

  /**
   * Triggers Windows File Explorer to open Downloads/Thanks for downloading
   */
  async openLocalFolder() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/local/open-folder', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn('Could not open local folder:', e);
      return { success: false };
    }
  }
};

