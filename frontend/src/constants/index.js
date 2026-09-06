export const STORAGE_KEYS = {
  HISTORY: 'tunefetch_download_history',
};

export const AUDIO_FORMATS = [
  { id: 'mp3-320', label: 'MP3 • 320 kbps', badge: 'Ultra HQ', ext: '.mp3' },
  { id: 'mp3-256', label: 'MP3 • 256 kbps', badge: 'High', ext: '.mp3' },
  { id: 'mp3-128', label: 'MP3 • 128 kbps', badge: 'Fast', ext: '.mp3' },
  { id: 'best-audio', label: 'Original Stream', badge: 'Direct', ext: '' },
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
