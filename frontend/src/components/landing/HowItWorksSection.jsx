import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, 
  Check, 
  Copy, 
  RotateCcw, 
  FolderDown, 
  Music2, 
  Cpu, 
  ShieldCheck, 
  Sparkles,
  DownloadCloud
} from 'lucide-react';
import { api } from '../../services/api';

/**
 * HowItWorksSection
 * Demonstrates the 3-step download flow with an interactive animated terminal video-like simulator.
 */
export default function HowItWorksSection({ onLaunch }) {
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [simStep, setSimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Command to run
  const commandText = "tunefetch TF-8429";

  // Handle command copy
  const handleCopy = () => {
    navigator.clipboard.writeText(commandText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Automated terminal simulation ticker
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSimStep((prev) => (prev < 6 ? prev + 1 : 0));
    }, 1800);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const restartSimulation = () => {
    setSimStep(0);
    setIsPlaying(true);
  };

  const steps = [
    {
      number: '01',
      title: 'Pick Your Playlist',
      sub: 'Connect Spotify or paste any playlist URL in the web dashboard.',
      badge: 'Zero-login or OAuth 2.0',
      icon: Music2,
      color: '#1DB954'
    },
    {
      number: '02',
      title: 'Get Cloud Session Code',
      sub: 'Click "Download" to generate your instant session key (e.g. TF-8429).',
      badge: 'Neon DB Sync',
      icon: Sparkles,
      color: '#38bdf8'
    },
    {
      number: '03',
      title: 'Run 1-Line Command',
      sub: 'Open CMD or PowerShell: type "tunefetch TF-8429" and hit Enter.',
      badge: '320 kbps Studio Audio',
      icon: Terminal,
      color: '#a855f7'
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works-section" style={{ padding: '90px 24px', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'rgba(29, 185, 84, 0.1)',
              border: '1px solid rgba(29, 185, 84, 0.25)',
              borderRadius: '999px',
              marginBottom: '16px'
            }}
          >
            <Sparkles size={15} color="#1DB954" />
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1DB954', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Lightning 3-Step Workflow
            </span>
          </div>

          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 800, color: 'var(--text-primary, #ffffff)', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px' }}>
            How TuneFetch Works. <br />
            <span style={{ background: 'linear-gradient(135deg, #1DB954 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Web Brain. Desktop Muscle.
            </span>
          </h2>

          <p style={{ maxWidth: '640px', margin: '0 auto', fontSize: '16px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6 }}>
            No browser timeouts, no rate limits, and zero malware popups. Select your songs comfortably on the web, then let your own machine rip pristine 320 kbps audio at maximum multi-threaded speed.
          </p>
        </div>

        {/* 3 Step Visual Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '22px', marginBottom: '50px' }}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx + 1;
            return (
              <motion.div
                key={step.number}
                onClick={() => setActiveStep(idx + 1)}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                style={{
                  background: isSelected ? 'rgba(26, 27, 32, 0.95)' : 'rgba(20, 21, 26, 0.75)',
                  border: isSelected ? `1.5px solid ${step.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '24px',
                  padding: '30px 26px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isSelected ? `0 12px 40px -10px ${step.color}25` : 'none',
                  transition: 'border-color 0.25s, box-shadow 0.25s'
                }}
              >
                {/* Step indicator header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: `${step.color}15`,
                      border: `1px solid ${step.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={22} color={step.color} />
                  </div>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.15)', fontFamily: 'Outfit, sans-serif' }}>
                    {step.number}
                  </span>
                </div>

                <div
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: step.color,
                    marginBottom: '12px'
                  }}
                >
                  {step.badge}
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  {step.title}
                </h3>

                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.55 }}>
                  {step.sub}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Terminal Video Simulation Frame */}
        <div
          style={{
            background: '#121317',
            border: '1px solid #2a2c35',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(29, 185, 84, 0.06)'
          }}
        >
          {/* Terminal Window Header Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              background: '#181920',
              borderBottom: '1px solid #262832',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            {/* Traffic Lights & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '7px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={15} color="#9a9da8" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', fontFamily: 'Consolas, monospace' }}>
                  TuneFetch Engine Terminal — PowerShell / CMD
                </span>
              </div>
            </div>

            {/* Simulation Controls & Copy Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  background: 'rgba(29, 185, 84, 0.12)',
                  borderRadius: '12px',
                  border: '1px solid rgba(29, 185, 84, 0.3)'
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1DB954', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1DB954' }}>SIMULATION READY</span>
              </div>

              <button
                onClick={restartSimulation}
                title="Replay Terminal Demonstration"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#22242c',
                  border: '1px solid #2f323e',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={13} />
                <span>Replay Demo</span>
              </button>

              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: copied ? '#1DB954' : '#22242c',
                  border: '1px solid #2f323e',
                  color: copied ? '#000000' : '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
                <span>{copied ? 'Copied Command!' : 'Copy: tunefetch TF-8429'}</span>
              </button>
            </div>
          </div>

          {/* Terminal Screen Body */}
          <div
            style={{
              padding: '24px 28px',
              fontFamily: '"JetBrains Mono", Consolas, "Courier New", monospace',
              fontSize: '13.5px',
              lineHeight: 1.7,
              color: '#d1d5db',
              minHeight: '340px',
              overflowX: 'auto',
              background: '#0d0e12'
            }}
          >
            {/* Prompt Line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>PS C:\Users\KIIT&gt;</span>
              <span style={{ color: '#1ed760', fontWeight: 700, fontSize: '15px' }}>
                tunefetch TF-8429
              </span>
              <span style={{ display: 'inline-block', width: '8px', height: '18px', background: '#1DB954', verticalAlign: 'middle' }} />
            </div>

            {/* Simulated Banner */}
            <div style={{ color: '#1DB954', opacity: 0.9, marginBottom: '14px', whiteSpace: 'pre', fontSize: '12px' }}>
{`======================================================================
                 TuneFetch Desktop Engine v1.3.0                     
         Spotify Playlist & High-Fidelity Audio Downloader            
======================================================================`}
            </div>

            {/* Real-time Simulated Stages */}
            {simStep >= 1 && (
              <div style={{ color: '#38bdf8', marginBottom: '6px' }}>
                [+] Contacting Neon Cloud Session API for code: <strong style={{ color: '#ffffff' }}>TF-8429</strong>...
              </div>
            )}

            {simStep >= 2 && (
              <div style={{ color: '#a855f7', marginBottom: '6px' }}>
                [✓] Session Verified: &quot;Late Night Lo-Fi Chillout&quot; (24 Tracks Verified)
              </div>
            )}

            {simStep >= 3 && (
              <div style={{ color: '#9a9da8', marginBottom: '14px' }}>
                [+] Destination Folder: <span style={{ color: '#f3f4f6' }}>C:\Users\KIIT\Downloads\Late Night Lo-Fi Chillout</span>
              </div>
            )}

            {simStep >= 4 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', marginBottom: '4px', fontSize: '13px' }}>
                  <span>[+] [1/24] Sunset Lover - Petit Biscuit</span>
                  <span style={{ color: '#1DB954', fontWeight: 700 }}>[COMPLETED ✓]</span>
                </div>
                <div style={{ color: '#6b7280', fontSize: '12px', paddingLeft: '16px' }}>
                  ↳ 320 kbps CBR MP3 · 8.4 MB · Album Art Embedded · Saved
                </div>
              </div>
            )}

            {simStep >= 5 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', marginBottom: '4px', fontSize: '13px' }}>
                  <span>[+] [2/24] Midnight City - M83</span>
                  <span style={{ color: '#38bdf8' }}>92% | 9.4 MB/s | ETA: 00:01</span>
                </div>
                {/* Live Ascii Progress Bar */}
                <div style={{ color: '#1DB954', letterSpacing: '0.08em', fontSize: '12.5px' }}>
                  [████████████████████████████████████░░] 92%
                </div>
              </div>
            )}

            {simStep >= 6 && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: 'rgba(29, 185, 84, 0.08)',
                  border: '1px solid rgba(29, 185, 84, 0.3)',
                  color: '#e2e8f0'
                }}
              >
                <div style={{ color: '#1ed760', fontWeight: 700, marginBottom: '4px' }}>
                  [✓] 24 of 24 tracks converted successfully at 320 kbps!
                </div>
                <div style={{ fontSize: '12px', color: '#9a9da8' }}>
                  Total Time: 01:14 · Destination: C:\Users\KIIT\Downloads\Late Night Lo-Fi Chillout
                </div>
              </div>
            )}
          </div>

          {/* Terminal Bottom Explainer Banner */}
          <div
            style={{
              padding: '16px 24px',
              background: '#14151c',
              borderTop: '1px solid #22242c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderDown size={18} color="#1DB954" />
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                Files download directly into your official <strong>Windows Downloads</strong> folder.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Need the 1-click Windows Installer?
              </span>
              <a
                href={api.getInstallerDownloadUrl()}
                download="TuneFetch_Setup.exe"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: '#1DB954',
                  color: '#000000',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <DownloadCloud size={14} />
                <span>Get TuneFetch_Setup.exe</span>
              </a>
            </div>
          </div>
        </div>

        {/* Why this flow is 10x better Callout Grid */}
        <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ color: '#1DB954', fontWeight: 700, fontSize: '15px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} /> Zero Shady Extensions
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.5, margin: 0 }}>
              No spam extensions reading your browsing history. Clean open-source Python engine with zero adware.
            </p>
          </div>

          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '15px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} /> Uncapped Multithread Speed
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.5, margin: 0 }}>
              Downloads stream concurrently on your own network with instant retry logic and multi-source fallbacks.
            </p>
          </div>

          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ color: '#a855f7', fontWeight: 700, fontSize: '15px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music2 size={18} /> Pristine 320 kbps &amp; ID3
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.5, margin: 0 }}>
              Embedded high-res Spotify cover art, artist tags, album year, and genre information directly into each MP3.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
