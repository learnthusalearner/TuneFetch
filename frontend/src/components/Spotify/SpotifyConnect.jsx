import React from 'react';
import { Music2, LogOut, CheckCircle2, Disc3 } from 'lucide-react';

export default function SpotifyConnect({ spotifyStatus, onConnect, onDisconnect, isLoading }) {
  const isConnected = spotifyStatus?.connected;
  const user = spotifyStatus?.spotify_user;

  if (isConnected) {
    return (
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderLeft: '4px solid var(--accent-green)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(29, 185, 84, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)'
            }}
          >
            <Music2 size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.display_name || user?.id || 'Connected Account'}
              </span>
              <CheckCircle2 size={14} color="var(--accent-green)" />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Spotify Connected • Scopes: playlist-read
            </span>
          </div>
        </div>

        <button
          className="icon-btn"
          onClick={onDisconnect}
          disabled={isLoading}
          style={{ fontSize: '12px', padding: '8px 14px' }}
          title="Disconnect Spotify account"
        >
          <LogOut size={14} />
          <span>Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.08) 0%, rgba(16, 21, 34, 0.8) 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            boxShadow: '0 0 20px rgba(29, 185, 84, 0.3)'
          }}
        >
          <Music2 size={22} strokeWidth={2.5} />
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Connect Your Spotify Account
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Authorize TuneFetch to access your private & collaborative playlists for bulk downloading.
          </p>
        </div>
      </div>

      <button
        className="btn-download-action"
        onClick={onConnect}
        disabled={isLoading}
        style={{ padding: '10px 20px', fontSize: '13px' }}
      >
        <Music2 size={16} />
        <span>Connect Spotify</span>
      </button>
    </div>
  );
}
