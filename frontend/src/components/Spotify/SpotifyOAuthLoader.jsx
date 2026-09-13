import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Music2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * SpotifyOAuthLoader
 * High-aesthetic animated state shown while Spotify PKCE OAuth is processing,
 * exchanging access tokens, or synchronizing the user's playlists.
 */
export default function SpotifyOAuthLoader({
  title = "Connecting to Spotify...",
  subtitle = "Exchanging encrypted PKCE tokens & retrieving your library...",
  stage = 2
}) {
  // Cycle animated status tips to keep user entertained
  const tips = [
    "Establishing end-to-end PKCE SHA-256 handshake...",
    "Securing session tokens in encrypted local storage...",
    "Fetching your public, private & collaborative playlists...",
    "Preparing 320 kbps high-bitrate conversion engine..."
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: '52px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(29, 185, 84, 0.06) 0%, rgba(18, 18, 18, 0.95) 100%)',
        border: '1px solid rgba(29, 185, 84, 0.25)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(29, 185, 84, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        maxWidth: '560px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Background ambient light orb */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(29,185,84,0.22) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Glowing Radar & Equalizer Audio Visualizer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Pulsing Outer Ripple Ring */}
        <motion.div
          style={{
            position: 'absolute',
            top: -14,
            left: -14,
            right: -14,
            bottom: -14,
            borderRadius: '50%',
            border: '2px solid rgba(29, 185, 84, 0.4)',
          }}
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Second Ring */}
        <motion.div
          style={{
            position: 'absolute',
            top: -6,
            left: -6,
            right: -6,
            bottom: -6,
            borderRadius: '50%',
            border: '2px solid rgba(29, 185, 84, 0.7)',
          }}
          animate={{
            scale: [1, 1.18, 1],
            opacity: [0.8, 0.2, 0.8],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />

        {/* Center Emerald Icon Badge */}
        <motion.div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1ed760 0%, #1db954 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            boxShadow: '0 8px 32px rgba(29, 185, 84, 0.55)',
          }}
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Music2 size={38} strokeWidth={2.4} />
        </motion.div>
      </div>

      {/* Title & Stage Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Sparkles size={16} color="var(--accent-green)" />
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent-green)'
          }}>
            OAuth Authorization in Progress
          </span>
        </div>

        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.4px',
          margin: 0
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: 420,
          margin: '0 auto'
        }}>
          {subtitle}
        </p>
      </div>

      {/* Animated Equalizer Waveform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, position: 'relative', zIndex: 1 }}>
        {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.7].map((heightRatio, i) => (
          <motion.div
            key={i}
            style={{
              width: 5,
              background: 'linear-gradient(180deg, var(--accent-green) 0%, #10b981 100%)',
              borderRadius: 4,
            }}
            animate={{
              height: [10, 32 * heightRatio, 8],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.14,
            }}
          />
        ))}
      </div>

      {/* Interactive Progress Steps */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '16px',
        padding: '16px 20px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Step 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} color="var(--accent-green)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              PKCE OAuth Handshake
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-green)' }}>
            Verified
          </span>
        </div>

        {/* Step 2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid var(--accent-green)',
                borderTopColor: 'transparent',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Token Exchange &amp; Session Sync
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-green)' }}>
            Processing...
          </span>
        </div>

        {/* Step 3 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: stage >= 3 ? 1 : 0.45 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={16} color={stage >= 3 ? "var(--accent-green)" : "var(--text-muted)"} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Import Playlists &amp; Audio Library
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            {stage >= 3 ? 'Syncing...' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Dynamic Status Tip Banner */}
      <motion.div
        key={currentTipIndex}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35 }}
        style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--accent-green)',
        }} />
        <span>{tips[currentTipIndex]}</span>
      </motion.div>
    </motion.div>
  );
}
