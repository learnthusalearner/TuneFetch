const API_BASE = '/api';

export const api = {
  /**
   * Health check to detect backend connectivity and ffmpeg availability
   */
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable:', e);
      return { status: 'offline', ffmpeg_available: false, version: '0.0.0' };
    }
  },

  /**
   * Fetches metadata for tracks or playlists
   */
  async fetchInfo(url) {
    const res = await fetch(`${API_BASE}/info`, {
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
   * Initiates a download task
   */
  async startDownload({ url, format = 'mp3-320', title, artist, thumbnail }) {
    const res = await fetch(`${API_BASE}/download`, {
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
   * Polls task status
   */
  async getStatus(taskId) {
    const res = await fetch(`${API_BASE}/status/${taskId}`);
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
  }
};
