/**
 * Formats seconds into MM:SS or HH:MM:SS string
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Formats byte size into human readable string (e.g. 5.42 MB)
 */
export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

/**
 * Formats timestamps into readable localized time
 */
export function formatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Clean filename to ensure safety
 */
export function sanitizeClientFilename(name, ext = '.mp3') {
  if (!name) return `audio${ext}`;
  let clean = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
  if (!clean.toLowerCase().endsWith(ext.toLowerCase())) {
    clean = `${clean}${ext}`;
  }
  return clean;
}
