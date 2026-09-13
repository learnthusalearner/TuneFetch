import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const makeBar = (pct, width = 26) => {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const filled = Math.round((clamped / 100) * width);
  const empty = Math.max(0, width - filled);
  return '█'.repeat(filled) + '░'.repeat(empty);
};

/**
 * TuneFetchTerminal
 * Ultra-realistic, high-frame-rate PowerShell / CMD terminal simulator.
 * Supports character-by-character typing, real-time downloading progress bars,
 * rotating spinners, speed fluctuations, and seamless looping.
 */
export default function TuneFetchTerminal({
  sessionCode = 'TF-8429',
  playlistName = 'Late Night Lo-Fi Chillout',
  trackCount = 24,
  destinationPath = 'Downloads/Thanks for downloading/Late Night Lo-Fi Chillout',
  tracks = null,
  showControls = true,
  staticMode = false,
  replayKey = 0,
  onStatusUpdate = null,
  className = ''
}) {
  const [copied, setCopied] = useState(false);
  const commandText = `tunefetch ${sessionCode}`;

  // If in staticMode, render completed output immediately without animations
  const [phase, setPhase] = useState(staticMode ? 'done' : 'typing');
  const [typedCount, setTypedCount] = useState(staticMode ? commandText.length : 0);
  const [track1Pct, setTrack1Pct] = useState(staticMode ? 100 : 0);
  const [track2Pct, setTrack2Pct] = useState(staticMode ? 100 : 0);
  const [track3Pct, setTrack3Pct] = useState(staticMode ? 100 : 0);
  const [spinnerIdx, setSpinnerIdx] = useState(0);

  const firstTrack = tracks?.[0]
    ? `${tracks[0].artist_name || tracks[0].artist || ''} - ${tracks[0].song_name || tracks[0].title || tracks[0].name}`
    : 'Petit Biscuit - Sunset Lover';

  const secondTrack = tracks?.[1]
    ? `${tracks[1].artist_name || tracks[1].artist || ''} - ${tracks[1].song_name || tracks[1].title || tracks[1].name}`
    : 'M83 - Midnight City';

  const thirdTrack = tracks?.[2]
    ? `${tracks[2].artist_name || tracks[2].artist || ''} - ${tracks[2].song_name || tracks[2].title || tracks[2].name}`
    : 'The Weeknd - Starboy';

  // Copy handler
  const handleCopy = () => {
    navigator.clipboard.writeText(commandText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset when replayKey changes
  useEffect(() => {
    if (staticMode) return;
    setPhase('typing');
    setTypedCount(0);
    setTrack1Pct(0);
    setTrack2Pct(0);
    setTrack3Pct(0);
    setSpinnerIdx(0);
  }, [replayKey, staticMode]);

  // High-frame-rate live engine ticker
  useEffect(() => {
    if (staticMode) return;

    let timer = null;
    let holdTimer = null;

    if (phase === 'typing') {
      onStatusUpdate?.({ phase: 'typing', label: 'TYPING COMMAND...' });
      timer = setInterval(() => {
        setTypedCount((prev) => {
          if (prev < commandText.length) {
            return prev + 1;
          } else {
            clearInterval(timer);
            holdTimer = setTimeout(() => setPhase('resolving'), 350);
            return prev;
          }
        });
      }, 45);
    } else if (phase === 'resolving') {
      onStatusUpdate?.({ phase: 'resolving', label: 'CONNECTING TO CLOUD...' });
      let ticks = 0;
      timer = setInterval(() => {
        ticks += 1;
        setSpinnerIdx((s) => (s + 1) % SPINNER_FRAMES.length);
        if (ticks > 16) {
          clearInterval(timer);
          setPhase('track1');
        }
      }, 70);
    } else if (phase === 'track1') {
      timer = setInterval(() => {
        setTrack1Pct((prev) => {
          const next = prev + Math.floor(Math.random() * 4) + 3;
          onStatusUpdate?.({ phase: 'track1', label: `DOWNLOADING TRACK 1/24 (${Math.min(100, next)}%)` });
          if (next >= 100) {
            clearInterval(timer);
            holdTimer = setTimeout(() => setPhase('track2'), 250);
            return 100;
          }
          return next;
        });
      }, 45);
    } else if (phase === 'track2') {
      timer = setInterval(() => {
        setTrack2Pct((prev) => {
          const next = prev + Math.floor(Math.random() * 4) + 3;
          onStatusUpdate?.({ phase: 'track2', label: `DOWNLOADING TRACK 2/24 (${Math.min(100, next)}%)` });
          if (next >= 100) {
            clearInterval(timer);
            holdTimer = setTimeout(() => setPhase('track3'), 250);
            return 100;
          }
          return next;
        });
      }, 45);
    } else if (phase === 'track3') {
      timer = setInterval(() => {
        setTrack3Pct((prev) => {
          const next = prev + Math.floor(Math.random() * 4) + 3;
          onStatusUpdate?.({ phase: 'track3', label: `DOWNLOADING TRACK 3/24 (${Math.min(100, next)}%)` });
          if (next >= 100) {
            clearInterval(timer);
            holdTimer = setTimeout(() => setPhase('done'), 300);
            return 100;
          }
          return next;
        });
      }, 45);
    } else if (phase === 'done') {
      onStatusUpdate?.({ phase: 'done', label: 'CONVERTED 24 TRACKS (100%)' });
      // Pause at completed view for 4.2s, then loop seamlessly
      holdTimer = setTimeout(() => {
        setPhase('typing');
        setTypedCount(0);
        setTrack1Pct(0);
        setTrack2Pct(0);
        setTrack3Pct(0);
      }, 4200);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [phase, commandText, staticMode]);

  const displayedCommand = commandText.slice(0, typedCount);
  const showBanner = phase !== 'typing';
  const showResolving = phase !== 'typing';
  const showVerified = phase !== 'typing' && (phase !== 'resolving' || spinnerIdx > 6);
  const showTrack1 = phase === 'track1' || phase === 'track2' || phase === 'track3' || phase === 'done';
  const showTrack2 = phase === 'track2' || phase === 'track3' || phase === 'done';
  const showTrack3 = phase === 'track3' || phase === 'done';
  const showCompleted = phase === 'done';

  return (
    <div
      className={className}
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#060b0e',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.08)',
        transition: 'all 0.3s ease'
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
          minHeight: '360px',
          fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, "Courier New", monospace',
          fontSize: '13.5px',
          lineHeight: 1.65,
          color: '#d1d5db',
          background: '#060b0e',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap'
        }}
      >
        {/* Dynamic Prompt Line with Character Typing & Blinking Cursor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: showBanner ? '16px' : '0px', flexWrap: 'wrap' }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>$</span>
          <span style={{ color: '#10b981', fontWeight: 700, fontSize: '14.5px' }}>
            {displayedCommand}
          </span>
          <span
            style={{
              display: 'inline-block',
              width: '8.5px',
              height: '17px',
              background: '#10b981',
              verticalAlign: 'middle',
              animation: 'pulse 0.9s infinite',
              opacity: phase === 'typing' || typedCount === commandText.length ? 1 : 0.4
            }}
          />
        </div>

        {/* Modern Rounded Box Banner */}
        {showBanner && (
          <div style={{ color: '#1db954', marginBottom: '16px', whiteSpace: 'pre', fontSize: '13px', lineHeight: 1.4, fontFamily: 'monospace' }}>
{` ╭────────────────────────────────────────────────────────────╮
 │  ♫ TuneFetch CLI Engine v1.3.0                             │
 │  High-Fidelity Spotify Playlist & 320 kbps MP3 Downloader  │
 ╰────────────────────────────────────────────────────────────╯`}
          </div>
        )}

        {/* Stage 1 & 2: Resolving & Verified */}
        {showResolving && (
          <>
            <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
              {showVerified ? (
                <span style={{ color: '#38bdf8', fontWeight: 700 }}> [•]</span>
              ) : (
                <span style={{ color: '#38bdf8', fontWeight: 700 }}> [{SPINNER_FRAMES[spinnerIdx]}]</span>
              )}{' '}
              Resolving download session: <strong style={{ color: '#ffffff' }}>{sessionCode}</strong>...
            </div>

            {showVerified && (
              <>
                <div style={{ color: '#e2e8f0', marginBottom: '8px' }}>
                  <span style={{ color: '#1db954', fontWeight: 700 }}> [✓]</span> Session Verified:{' '}
                  <span style={{ color: '#c084fc', fontWeight: 700 }}>&quot;{playlistName}&quot;</span>{' '}
                  <span style={{ color: '#38bdf8' }}>({trackCount} Tracks Verified)</span>
                </div>

                <div style={{ color: '#94a3b8', marginBottom: '18px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}> [→]</span> Destination:{' '}
                  <span style={{ color: '#f8fafc' }}>{destinationPath}</span>
                </div>
              </>
            )}
          </>
        )}

        {/* Track 1: Live Progress Bar -> Completed */}
        {showTrack1 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ color: '#ffffff' }}>
                <span style={{ color: track1Pct >= 100 ? '#1db954' : '#38bdf8', fontWeight: 700 }}>
                  {track1Pct >= 100 ? ' [+]' : ' [↓]'}
                </span>{' '}
                <span style={{ color: '#64748b' }}>[1/{trackCount}]</span> {firstTrack}
              </span>
              {track1Pct >= 100 ? (
                <span style={{ color: '#1db954', fontWeight: 700, fontSize: '12.5px', background: 'rgba(29, 185, 84, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(29, 185, 84, 0.3)' }}>
                  ✓ COMPLETED
                </span>
              ) : (
                <span style={{ fontSize: '12.5px' }}>
                  <strong style={{ color: '#1db954' }}>{track1Pct}%</strong>{' '}
                  <span style={{ color: '#475569' }}>|</span>{' '}
                  <strong style={{ color: '#facc15' }}>{(9.2 + (track1Pct % 6) * 0.4).toFixed(1)} MB/s</strong>{' '}
                  <span style={{ color: '#475569' }}>|</span>{' '}
                  <span style={{ color: '#38bdf8' }}>ETA: {track1Pct > 65 ? '00:01' : '00:02'}</span>
                </span>
              )}
            </div>

            {track1Pct < 100 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', paddingLeft: '14px', marginTop: '5px' }}>
                <span style={{ color: '#475569' }}>[</span>
                <span style={{ color: '#1db954', letterSpacing: '0.02em' }}>
                  {makeBar(track1Pct).slice(0, Math.round((track1Pct / 100) * 26))}
                </span>
                <span style={{ color: '#334155', letterSpacing: '0.02em' }}>
                  {'░'.repeat(26 - Math.round((track1Pct / 100) * 26))}
                </span>
                <span style={{ color: '#475569' }}>]</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {((track1Pct / 100) * 8.4).toFixed(1)} / 8.4 MB
                </span>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '12px', paddingLeft: '22px', marginTop: '3px' }}>
                <span style={{ color: '#1db954' }}>↳</span> <span style={{ color: '#1ed760' }}>320 kbps CBR MP3</span> · 8.4 MB · Album Art Embedded · Saved
              </div>
            )}
          </div>
        )}

        {/* Track 2: Live Progress Bar -> Completed */}
        {showTrack2 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ color: '#ffffff' }}>
                <span style={{ color: track2Pct >= 100 ? '#1db954' : '#38bdf8', fontWeight: 700 }}>
                  {track2Pct >= 100 ? ' [+]' : ' [↓]'}
                </span>{' '}
                <span style={{ color: '#64748b' }}>[2/{trackCount}]</span> {secondTrack}
              </span>
              {track2Pct >= 100 ? (
                <span style={{ color: '#1db954', fontWeight: 700, fontSize: '12.5px', background: 'rgba(29, 185, 84, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(29, 185, 84, 0.3)' }}>
                  ✓ COMPLETED
                </span>
              ) : (
                <span style={{ fontSize: '12.5px' }}>
                  <strong style={{ color: '#1db954' }}>{track2Pct}%</strong>{' '}
                  <span style={{ color: '#475569' }}>|</span>{' '}
                  <strong style={{ color: '#facc15' }}>{(9.8 + (track2Pct % 5) * 0.4).toFixed(1)} MB/s</strong>{' '}
                  <span style={{ color: '#475569' }}>|</span>{' '}
                  <span style={{ color: '#38bdf8' }}>ETA: {track2Pct > 65 ? '00:01' : '00:02'}</span>
                </span>
              )}
            </div>

            {track2Pct < 100 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', paddingLeft: '14px', marginTop: '5px' }}>
                <span style={{ color: '#475569' }}>[</span>
                <span style={{ color: '#1db954', letterSpacing: '0.02em' }}>
                  {makeBar(track2Pct).slice(0, Math.round((track2Pct / 100) * 26))}
                </span>
                <span style={{ color: '#334155', letterSpacing: '0.02em' }}>
                  {'░'.repeat(26 - Math.round((track2Pct / 100) * 26))}
                </span>
                <span style={{ color: '#475569' }}>]</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {((track2Pct / 100) * 9.8).toFixed(1)} / 9.8 MB
                </span>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '12px', paddingLeft: '22px', marginTop: '3px' }}>
                <span style={{ color: '#1db954' }}>↳</span> <span style={{ color: '#1ed760' }}>320 kbps CBR MP3</span> · 9.8 MB · Album Art Embedded · Saved
              </div>
            )}
          </div>
        )}

        {/* Track 3: Live Progress Bar -> Completed */}
        {showTrack3 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ color: '#ffffff' }}>
                <span style={{ color: track3Pct >= 100 ? '#1db954' : '#38bdf8', fontWeight: 700 }}>
                  {track3Pct >= 100 ? ' [+]' : ' [↓]'}
                </span>{' '}
                <span style={{ color: '#64748b' }}>[3/{trackCount}]</span> {thirdTrack}
              </span>
              {track3Pct >= 100 ? (
                <span style={{ color: '#1db954', fontWeight: 700, fontSize: '12.5px', background: 'rgba(29, 185, 84, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(29, 185, 84, 0.3)' }}>
                  ✓ COMPLETED
                </span>
              ) : (
                <span style={{ fontSize: '12.5px' }}>
                  <strong style={{ color: '#1db954' }}>{track3Pct}%</strong>{' '}
                  <span style={{ color: '#475569' }}>|</span>{' '}
                  <strong style={{ color: '#facc15' }}>{(10.4 + (track3Pct % 4) * 0.4).toFixed(1)} MB/s</strong>{' '}
                  <span style={{ color: '#475569' }}>|</span>{' '}
                  <span style={{ color: '#38bdf8' }}>ETA: {track3Pct > 70 ? '00:01' : '00:02'}</span>
                </span>
              )}
            </div>

            {track3Pct < 100 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', paddingLeft: '14px', marginTop: '5px' }}>
                <span style={{ color: '#475569' }}>[</span>
                <span style={{ color: '#1db954', letterSpacing: '0.02em' }}>
                  {makeBar(track3Pct).slice(0, Math.round((track3Pct / 100) * 26))}
                </span>
                <span style={{ color: '#334155', letterSpacing: '0.02em' }}>
                  {'░'.repeat(26 - Math.round((track3Pct / 100) * 26))}
                </span>
                <span style={{ color: '#475569' }}>]</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {((track3Pct / 100) * 7.9).toFixed(1)} / 7.9 MB
                </span>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '12px', paddingLeft: '22px', marginTop: '3px' }}>
                <span style={{ color: '#1db954' }}>↳</span> <span style={{ color: '#1ed760' }}>320 kbps CBR MP3</span> · 7.9 MB · Album Art Embedded · Saved
              </div>
            )}
          </div>
        )}

        {/* Completion Card */}
        {showCompleted && (
          <div style={{ color: '#1db954', marginTop: '20px', whiteSpace: 'pre', fontSize: '12.5px', lineHeight: 1.45, fontFamily: 'monospace' }}>
{` ╭────────────────────────────────────────────────────────────╮
 │  ✓ All ${trackCount} of ${trackCount} tracks converted successfully at 320 kbps!  │
 │  ⏱  Total Time: 00:14 · Bitrate: 320 kbps CBR              │
 │  📂 Saved To: Downloads/Thanks for downloading/...         │
 ╰────────────────────────────────────────────────────────────╯`}
          </div>
        )}
      </div>
    </div>
  );
}
