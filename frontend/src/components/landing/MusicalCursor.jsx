import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CURSOR_MUSICAL_NOTES } from './landingData';

/**
 * MusicalCursor
 * Replaces the system cursor with a custom Spotify emerald pointer
 * and trails 6 musical symbols that vanish one by one in a continuous rhythm.
 */
export default function MusicalCursor({ mousePos, isCursorActive, isClicking }) {
  return (
    <AnimatePresence>
      {isCursorActive && (
        <>
          {/* Primary Spotify Pointer Head (Directly at exact cursor coordinates) */}
          <motion.div
            animate={{
              x: mousePos.x,
              y: mousePos.y,
              scale: isClicking ? 0.78 : 1,
            }}
            transition={{ type: 'spring', damping: 38, stiffness: 750, mass: 0.04 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              zIndex: 100000,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Precision cursor pointer dot & halo */}
            <div style={{ position: 'relative', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Glowing emerald aura */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(29,185,84,0.5) 0%, rgba(29,185,84,0.1) 70%, transparent 100%)',
                  border: '1.5px solid rgba(29,185,84,0.7)',
                  boxShadow: '0 0 16px rgba(29,185,84,0.6)',
                }}
              />
              {/* Center precision pointer core */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 0 8px #1ed760, 0 0 14px #1DB954',
                  border: '1.5px solid #1DB954',
                  zIndex: 2,
                }}
              />
            </div>
          </motion.div>

          {/* 6 Musical notes trailing the cursor: ♪, ♫, ♬, ♩, 🎵, 🎶 */}
          {/* Each note drifts outward and VANISHES ONE BY ONE in a staggered sequence */}
          {CURSOR_MUSICAL_NOTES.map((note, idx) => (
            <motion.div
              key={note.char + idx}
              animate={{
                x: mousePos.x + note.x,
                y: mousePos.y + note.y,
              }}
              transition={{
                type: 'spring',
                damping: 18,
                stiffness: 220,
                mass: note.mass,
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 99999,
                fontSize: note.size,
                color: note.color,
                filter: 'drop-shadow(0 0 8px rgba(29,185,84,0.9)) drop-shadow(0 0 18px rgba(29,185,84,0.5))',
                userSelect: 'none',
                fontWeight: 900,
                lineHeight: 1,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Continuous lifecycle: Fades in, drifts up with micro-rotation, and vanishes one by one */}
              <motion.span
                animate={{
                  opacity: [0, 1, 1, 0, 0],
                  scale: [0.3, 1.25, 1, 0.35, 0],
                  y: [0, -14, -30, -52, -70],
                  x: [0, (idx % 2 === 0 ? -12 : 12), (idx % 2 === 0 ? -22 : 22), (idx % 2 === 0 ? -32 : 32)],
                  rotate: [0, (idx % 2 === 0 ? 14 : -14), (idx % 2 === 0 ? -12 : 12), 24, 40],
                  filter: [
                    'blur(0px)',
                    'blur(0px)',
                    'blur(0px)',
                    'blur(2px)',
                    'blur(6px)'
                  ]
                }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: note.delay,
                }}
                style={{ display: 'inline-block' }}
              >
                {note.char}
              </motion.span>
            </motion.div>
          ))}
        </>
      )}
    </AnimatePresence>
  );
}
