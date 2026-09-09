import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

/**
 * Toast — AnimatePresence-powered success/error notification.
 *
 * Usage:
 *   <Toast message="Done!" type="success" onDismiss={() => setMsg(null)} />
 *   <Toast message="Oops" type="error"   onDismiss={() => setMsg(null)} />
 *
 * Wrap the parent component with <AnimatePresence> if you want coordinated
 * mount/unmount animations.
 */
export function Toast({ message, type = 'success', onDismiss }) {
  if (!message) return null;

  return (
    <motion.div
      className={`toast ${type}`}
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{    opacity: 0, x: 60, scale: 0.92 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      {type === 'success'
        ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
        : <AlertCircle  size={16} style={{ flexShrink: 0 }} />}

      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>

      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'inherit', display: 'flex', alignItems: 'center', padding: '2px',
            flexShrink: 0,
          }}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}

/**
 * ToastContainer — fixed top-right portal for stacked toasts.
 * Accepts an array of { id, message, type } objects.
 */
export function ToastContainer({ toasts = [], onDismiss }) {
  return (
    <div className="toast-wrapper" role="status" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onDismiss={() => onDismiss?.(t.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
