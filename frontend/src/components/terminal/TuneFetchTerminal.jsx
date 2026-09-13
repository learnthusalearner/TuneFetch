import React, { useState } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';

/**
 * TuneFetchTerminal
 * Pixel-perfect PowerShell terminal replica matching the TuneFetch desktop CLI appearance.
 */
export default function TuneFetchTerminal({
  sessionCode = 'TF-8429',
  playlistName = 'Late Night Lo-Fi Chillout',
  trackCount = 24,
  destinationPath = 'Downloads/Thanks for downloading/Late Night Lo-Fi Chillout',
  tracks = null,
  showControls = true,
  className = ''
}) {
  const [copied, setCopied] = useState(false);
  const commandText = `tunefetch ${sessionCode}`;

  const firstTrack = tracks?.[0]
    ? `${tracks[0].artist_name || tracks[0].artist || ''} - ${tracks[0].song_name || tracks[0].title || tracks[0].name}`
    : 'Sunset Lover - Petit Biscuit';

  const secondTrack = tracks?.[1]
    ? `${tracks[1].artist_name || tracks[1].artist || ''} - ${tracks[1].song_name || tracks[1].title || tracks[1].name}`
    : 'Midnight City - M83';

  const handleCopy = () => {
    navigator.clipboard.writeText(commandText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={className}
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#060b0e',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.08)'
      }}
    >
      {/* Optional Top Bar with Controls */}
      {showControls && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            background: '#0d1318',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
              PowerShell - TuneFetch CLI
            </span>
          </div>

          <button
            onClick={handleCopy}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '7px',
              background: copied ? '#10b981' : '#1a232b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: copied ? '#000000' : '#e2e8f0',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {copied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : `Copy: ${commandText}`}</span>
          </button>
        </div>
      )}

      {/* Terminal Screen Body */}
      <div
        style={{
          padding: '24px 28px',
          fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, "Courier New", monospace',
          fontSize: '13.5px',
          lineHeight: 1.65,
          color: '#d1d5db',
          background: '#060b0e',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap'
        }}
      >
        {/* Prompt Line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>$</span>
          <span style={{ color: '#10b981', fontWeight: 700, fontSize: '14.5px' }}>
            {commandText}
          </span>
          <span
            style={{
              display: 'inline-block',
              width: '8.5px',
              height: '17px',
              background: '#10b981',
              verticalAlign: 'middle',
              animation: 'pulse 1.2s infinite'
            }}
          />
        </div>

        {/* Modern Rounded Box Banner */}
        <div style={{ color: '#1db954', marginBottom: '16px', whiteSpace: 'pre', fontSize: '13px', lineHeight: 1.4, fontFamily: 'monospace' }}>
{` ╭────────────────────────────────────────────────────────────╮
 │  ♫ TuneFetch CLI Engine v1.3.0                             │
 │  High-Fidelity Spotify Playlist & 320 kbps MP3 Downloader  │
 ╰────────────────────────────────────────────────────────────╯`}
        </div>

        {/* Stage 1: Resolving Session */}
        <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}> [•]</span> Resolving download session:{' '}
          <strong style={{ color: '#ffffff' }}>{sessionCode}</strong>...
        </div>

        {/* Stage 2: Session Verified */}
        <div style={{ color: '#e2e8f0', marginBottom: '8px' }}>
          <span style={{ color: '#1db954', fontWeight: 700 }}> [✓]</span> Session Verified:{' '}
          <span style={{ color: '#c084fc', fontWeight: 700 }}>&quot;{playlistName}&quot;</span>{' '}
          <span style={{ color: '#38bdf8' }}>({trackCount} Tracks Verified)</span>
        </div>

        {/* Stage 3: Destination Folder */}
        <div style={{ color: '#94a3b8', marginBottom: '18px' }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}> [→]</span> Destination:{' '}
          <span style={{ color: '#f8fafc' }}>{destinationPath}</span>
        </div>

        {/* Track 1: Completed */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ color: '#ffffff' }}>
              <span style={{ color: '#1db954', fontWeight: 700 }}> [+]</span>{' '}
              <span style={{ color: '#64748b' }}>[1/{trackCount}]</span> {firstTrack}
            </span>
            <span style={{ color: '#1db954', fontWeight: 700, fontSize: '12.5px', background: 'rgba(29, 185, 84, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(29, 185, 84, 0.25)' }}>
              ✓ COMPLETED
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: '12px', paddingLeft: '22px', marginTop: '3px' }}>
            <span style={{ color: '#1db954' }}>↳</span> <span style={{ color: '#1ed760' }}>320 kbps CBR MP3</span> · 8.4 MB · Album Art Embedded · Saved
          </div>
        </div>

        {/* Track 2: Downloading Progress */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '6px' }}>
            <span style={{ color: '#ffffff' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}> [↓]</span>{' '}
              <span style={{ color: '#64748b' }}>[2/{trackCount}]</span> {secondTrack}
            </span>
            <span style={{ fontSize: '12.5px' }}>
              <strong style={{ color: '#1db954' }}>92%</strong>{' '}
              <span style={{ color: '#475569' }}>|</span>{' '}
              <strong style={{ color: '#facc15' }}>9.4 MB/s</strong>{' '}
              <span style={{ color: '#475569' }}>|</span>{' '}
              <span style={{ color: '#38bdf8' }}>ETA: 00:01</span>
            </span>
          </div>
          {/* Visual Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', paddingLeft: '14px' }}>
            <span style={{ color: '#475569' }}>[</span>
            <span style={{ color: '#1db954', letterSpacing: '0.02em' }}>
              ██████████████████████████████████
            </span>
            <span style={{ color: '#334155', letterSpacing: '0.02em' }}>
              ░░░░
            </span>
            <span style={{ color: '#475569' }}>]</span>
            <span style={{ color: '#1db954', fontWeight: 700 }}>92%</span>
          </div>
        </div>

        {/* Modern Completion Card */}
        <div style={{ color: '#1db954', marginTop: '20px', whiteSpace: 'pre', fontSize: '12.5px', lineHeight: 1.45, fontFamily: 'monospace' }}>
{` ╭────────────────────────────────────────────────────────────╮
 │  ✓ All ${trackCount} of ${trackCount} tracks converted successfully at 320 kbps!  │
 │  ⏱  Total Time: 01:14 · Bitrate: 320 kbps CBR              │
 │  📂 Saved To: Downloads/Thanks for downloading/...         │
 ╰────────────────────────────────────────────────────────────╯`}
        </div>

      </div>
    </div>
  );
}
