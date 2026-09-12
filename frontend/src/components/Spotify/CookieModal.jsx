import React, { useState } from 'react';
import { ShieldCheck, Cookie, Lock, X, ExternalLink, Check, AlertCircle, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

export default function CookieModal({
  isOpen,
  onClose,
  onSuccess,
  existingCookieCount = 0
}) {
  const [cookieText, setCookieText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!cookieText.trim()) {
      setError('Please paste your YouTube cookies into the box before continuing.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.saveUserCookies(cookieText.trim());
      setSuccessMsg(`Loaded ${res.count} verification cookies!`);
      if (onSuccess) onSuccess(res.count);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to parse cookies. Ensure valid Netscape or JSON format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCookieText(text);
        setError(null);
      }
    } catch {
      // Clipboard permissions denied, user can paste manually
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(18, 22, 34, 0.96) 0%, rgba(10, 13, 20, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(29, 185, 84, 0.15)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '22px 26px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.25), rgba(30, 215, 96, 0.1))',
                border: '1px solid rgba(29, 185, 84, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1ed760'
              }}
            >
              <Cookie size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                YouTube Verification Cookies
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Bypass YouTube bot checks & rate limits for ultra-fast 320kbps downloads.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px 26px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Privacy Guarantee Box */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.2) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            <ShieldCheck size={22} style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.5 }}>
              <strong style={{ color: '#6ee7b7', display: 'block', marginBottom: '2px' }}>
                100% Privacy Guarantee • Automatic Deletion
              </strong>
              Your cookies are stored strictly in temporary server memory solely to download your songs.
              <strong> As soon as all your songs get downloaded, we immediately and permanently delete your cookies.</strong> We never save or share your credentials.
            </div>
          </div>

          {/* Quick 3-Step Guide */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: '#1ed760' }} />
              How to copy your cookies in 20 seconds:
            </div>
            <ol style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
              <li>Log into <a href="https://www.youtube.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>youtube.com</a> in your browser.</li>
              <li>Use a free extension like <strong>"Get cookies.txt LOCALLY"</strong> or <strong>"Cookie-Editor"</strong>.</li>
              <li>Click <strong>Export</strong> and paste the contents below (Netscape or JSON format).</li>
            </ol>
          </div>

          {/* Textarea for Cookies */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={13} style={{ color: '#a78bfa' }} />
                Paste Cookies Content:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Paste from Clipboard
                </button>
                {cookieText && (
                  <button
                    type="button"
                    onClick={() => setCookieText('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={7}
              placeholder={`# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t2147483647\tLOGIN_INFO\tabc123...\n\n(Or paste JSON format exported from Cookie-Editor)`}
              value={cookieText}
              onChange={(e) => {
                setCookieText(e.target.value);
                setError(null);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#e2e8f0',
                fontSize: '12px',
                fontFamily: 'monospace',
                lineHeight: 1.4,
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: error ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none'
              }}
            />
            {cookieText.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                {cookieText.split('\n').filter(l => l.trim()).length} lines detected
              </div>
            )}
          </div>

          {/* Feedback Messages */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '12.5px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7', fontSize: '12.5px' }}>
              <Check size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 26px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Skip (Try Without Cookies)
          </button>

          <button
            type="button"
            disabled={isSubmitting || !cookieText.trim()}
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              background: isSubmitting || !cookieText.trim()
                ? 'rgba(29, 185, 84, 0.35)'
                : 'linear-gradient(135deg, #1ed760 0%, #16a34a 100%)',
              border: 'none',
              borderRadius: '10px',
              color: isSubmitting || !cookieText.trim() ? 'rgba(255, 255, 255, 0.6)' : '#000',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isSubmitting || !cookieText.trim() ? 'not-allowed' : 'pointer',
              boxShadow: isSubmitting || !cookieText.trim() ? 'none' : '0 4px 18px rgba(29, 185, 84, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Verifying & Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Save & Continue to Downloads
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
