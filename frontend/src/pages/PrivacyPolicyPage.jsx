import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowLeft, Lock, Trash2, Code2, Server, CheckCircle2 } from 'lucide-react';

/**
 * PrivacyPolicyPage
 * Dedicated transparent Open-Source Privacy Policy & Data Protection notice.
 */
export default function PrivacyPolicyPage({ onGoHome }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080c14',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(29, 185, 84, 0.12) 0%, rgba(8, 12, 20, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        width: '100%',
        maxWidth: '820px',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '28px'
      }}>
        {/* Top Back Navigation */}
        <button
          onClick={onGoHome}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        {/* Header Title */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(29, 185, 84, 0.12)', border: '1px solid rgba(29, 185, 84, 0.3)', borderRadius: '20px', color: '#1DB954', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <ShieldCheck size={14} />
            <span>Open-Source Data Protection Guarantee</span>
          </div>
          <h1 style={{ margin: '14px 0 6px 0', fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Privacy Policy &amp; Security
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.65)', fontSize: '15px' }}>
            Last Updated: September 2026 · TuneFetch Open Source Project v1.3.0
          </p>
        </div>

        {/* Policy Section Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card 1: Open Source License */}
          <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29, 185, 84, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1DB954' }}>
                <Code2 size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>1. 100% Free &amp; Open-Source (MIT License)</h3>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', lineHeight: '1.6' }}>
              TuneFetch is non-commercial, free software licensed under the MIT License. Anyone can inspect, audit, fork, or run the complete source code on GitHub. We have zero hidden trackers, zero third-party ads, and zero analytics scripts.
            </p>
          </div>

          {/* Card 2: Zero Personal Data Retention */}
          <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(96, 165, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <Lock size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>2. Zero Data Retention &amp; Password Safety</h3>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', lineHeight: '1.6' }}>
              We value your privacy above everything. We <strong>never</strong> ask for, view, or store your Spotify passwords or personal credentials. Spotify authentication takes place strictly on official Spotify servers via OAuth 2.0 with PKCE security.
            </p>
          </div>

          {/* Card 3: 24-Hour Database Session Purge */}
          <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
                <Trash2 size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>3. 24-Hour Database Session Auto-Purge</h3>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', lineHeight: '1.6' }}>
              When you generate a session code (e.g. <code>TF-8907</code>) to download playlists on your PC, temporary session metadata (playlist title, song names, and track counts) is stored in our database. All database records and session tokens are **automatically deleted after 24 hours**.
            </p>
          </div>

          {/* Card 4: Local Computer Executable Safety */}
          <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                <Server size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>4. Local Desktop Executable Security</h3>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', lineHeight: '1.6' }}>
              The <code>TuneFetch_Setup.exe</code> installer runs locally on your computer to download 320 kbps MP3 files directly into your <code>Downloads/Thanks for downloading</code> folder. It does not transmit any files to remote servers or log your downloaded music.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
            © 2026 TuneFetch Open Source Project. All rights reserved.
          </span>
          <button
            onClick={onGoHome}
            style={{ background: 'none', border: 'none', color: '#1DB954', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            Return to Home →
          </button>
        </div>
      </div>
    </div>
  );
}
