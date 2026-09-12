export const STORAGE_KEYS = {
  HISTORY: 'tunefetch_download_history',
  SPOTIFY_ACTIVE_JOB: 'tunefetch_active_spotify_job',
};

export const AUDIO_FORMATS = [
  { id: 'mp3-320', label: '320 kbps MP3 (Best Quality)', badge: 'Ultra HQ', ext: '.mp3' },
];

export const PLATFORMS = {
  SPOTIFY: 'spotify',
  YOUTUBE: 'youtube',
  SOUNDCLOUD: 'soundcloud',
  GENERIC: 'generic',
};

export const EXAMPLE_URLS = [
  { label: 'YouTube Music', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { label: 'Spotify Track (Rick Astley)', url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT' },
  { label: 'Spotify Playlist (Today\'s Top Hits)', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M' },
];
