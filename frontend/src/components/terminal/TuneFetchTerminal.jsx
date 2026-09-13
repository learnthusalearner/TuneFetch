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

        {/* Double-Line Green Banner */}
        <div style={{ color: '#10b981', marginBottom: '16px', whiteSpace: 'pre', fontSize: '13px', lineHeight: 1.45 }}>
{`============================================================
           TuneFetch CLI Engine v1.3.0
   Spotify Playlist & High-Fidelity Audio Downloader
============================================================`}
        </div>

        {/* Stage 1: Contacting API */}
        <div style={{ color: '#38bdf8', marginBottom: '8px' }}>
          [+] Contacting Neon Cloud Session API for code:{' '}
          <strong style={{ color: '#ffffff' }}>{sessionCode}</strong>...
        </div>

        {/* Stage 2: Session Verified */}
        <div style={{ color: '#c084fc', marginBottom: '8px' }}>
          [✓] Session Verified: &quot;{playlistName}&quot; ({trackCount} Tracks Verified)
        </div>

        {/* Stage 3: Destination Folder */}
        <div style={{ color: '#38bdf8', marginBottom: '16px' }}>
          [+] Destination Folder:{' '}
          <span style={{ color: '#ffffff' }}>{destinationPath}</span>
        </div>

        {/* Track 1: Completed */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ color: '#ffffff' }}>
              <span style={{ color: '#38bdf8' }}>[+]</span> [1/{trackCount}] {firstTrack}
            </span>
            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '13px' }}>
              [COMPLETED ✓]
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: '12px', paddingLeft: '18px', marginTop: '2px' }}>
            ↳ 320 kbps CBR MP3 · 8.4 MB · Album Art Embedded · Saved
          </div>
        </div>

        {/* Track 2: Downloading Progress */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '6px' }}>
            <span style={{ color: '#ffffff' }}>
              <span style={{ color: '#38bdf8' }}>[+]</span> [2/{trackCount}] {secondTrack}
            </span>
            <span style={{ color: '#38bdf8', fontSize: '13px' }}>
              92% | 9.4 MB/s | ETA: 00:01
            </span>
          </div>
          {/* Visual Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#10b981' }}>[</span>
            <span style={{ color: '#10b981', letterSpacing: '0.02em' }}>
              ██████████████████████████████████
            </span>
            <span style={{ color: 'rgba(16, 185, 129, 0.25)', letterSpacing: '0.02em' }}>
              ░░░░
            </span>
            <span style={{ color: '#10b981' }}>]</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>92%</span>
          </div>
        </div>

        {/* Completion Box */}
        <div
          style={{
            marginTop: '22px',
            padding: '14px 20px',
            borderRadius: '10px',
            background: 'rgba(6, 78, 59, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ color: '#10b981', fontWeight: 700, fontSize: '13.5px' }}>
            [✓] {trackCount} of {trackCount} tracks converted successfully at 320 kbps!
          </div>
          <div style={{ fontSize: '12px', color: '#6ee7b7', opacity: 0.85 }}>
            Total Time: 01:14 · Destination: {destinationPath}
          </div>
        </div>
      </div>
    </div>
  );
}
