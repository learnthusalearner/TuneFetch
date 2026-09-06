import React, { useState, useEffect } from 'react';
import { Link, Clipboard, X, Sparkles, Video, Music2, Globe } from 'lucide-react';
import { PLATFORMS, EXAMPLE_URLS } from '../constants';

export default function UrlInput({ url, setUrl, onSubmit, isLoading }) {
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    const trimmed = url.trim().toLowerCase();
    if (trimmed.includes('spotify.com') || trimmed.startsWith('spotify:')) {
      setPlatform(PLATFORMS.SPOTIFY);
    } else if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      setPlatform(PLATFORMS.YOUTUBE);
    } else if (trimmed.includes('soundcloud.com')) {
      setPlatform(PLATFORMS.SOUNDCLOUD);
    } else if (trimmed.length > 5 && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
      setPlatform(PLATFORMS.GENERIC);
    } else {
      setPlatform(null);
    }
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch (e) {
      console.warn('Clipboard read permission denied:', e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && url.trim() && !isLoading) {
      onSubmit();
    }
  };

  return (
    <div className="search-section">
      <div className="url-input-wrapper">
        <div className="url-icon">
          {platform === PLATFORMS.SPOTIFY && <Music2 size={20} color="#1ed760" />}
          {platform === PLATFORMS.YOUTUBE && <Video size={20} color="#ff4e4e" />}
          {platform === PLATFORMS.SOUNDCLOUD && <Music2 size={20} color="#ff7700" />}
          {platform === PLATFORMS.GENERIC && <Globe size={20} color="#a78bfa" />}
          {!platform && <Link size={20} />}
        </div>

        <input
          type="text"
          className="url-input"
          placeholder="Paste Spotify track/playlist, YouTube, or audio URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <div className="input-actions">
          {platform && (
            <span className={`badge-tag badge-${platform}`}>
              {platform}
            </span>
          )}

          {url && (
            <button
              className="icon-btn"
              style={{ padding: '6px', borderRadius: '50%' }}
              onClick={() => setUrl('')}
              title="Clear input"
            >
              <X size={15} />
            </button>
          )}

          <button
            className="btn-paste"
            onClick={handlePaste}
            type="button"
            title="Paste from clipboard"
          >
            <Clipboard size={14} />
            <span>Paste</span>
          </button>

          <button
            className="btn-submit"
            onClick={onSubmit}
            disabled={!url.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Get Audio</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="examples-bar">
        <span className="examples-label">Try Examples:</span>
        {EXAMPLE_URLS.map((ex, idx) => (
          <button
            key={idx}
            className="example-chip"
            onClick={() => setUrl(ex.url)}
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
