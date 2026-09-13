import React from 'react';
import { motion } from 'motion/react';
import { Music } from 'lucide-react';
import GithubIcon from '../ui/GithubIcon';
import { api } from '../../services/api';


/**
 * LandingNav
 * Frosted top navigation bar with brand icon, status radar, and action buttons.
 */
export default function LandingNav({ onLaunch, onPrivacy, isConnected }) {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="landing-nav" aria-label="Main Navigation">
      <div className="landing-nav-logo" onClick={onLaunch} style={{ cursor: 'pointer' }}>
        <div className="landing-nav-logo-icon">
          <Music size={18} strokeWidth={2.5} />
        </div>
        <span className="landing-nav-wordmark">TuneFetch</span>
      </div>

      <div className="landing-nav-links">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(29,185,84,0.08)', borderRadius: 20, border: '1px solid rgba(29,185,84,0.2)' }}>
          <span className="radar-dot" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-green)' }}>Engine Online</span>
        </div>

        <button className="landing-nav-link" onClick={scrollToHowItWorks}>
          How It Works
        </button>

        <button className="landing-nav-link" onClick={onPrivacy}>
          Privacy Policy
        </button>

        <button className="landing-nav-link" onClick={onLaunch}>
          Dashboard Workspace
        </button>

        <a
          href="https://github.com/learnthusalearner/TuneFetch"
          target="_blank"
          rel="noopener noreferrer"
          className="landing-nav-link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          title="Star and view on GitHub"
        >
          <GithubIcon size={15} />
          <span>GitHub</span>
        </a>



        <motion.button
          className="btn-primary"
          onClick={onLaunch}
          style={{ padding: '9px 22px', fontSize: '13px' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isConnected ? 'Open App' : 'Get Started Free'}
        </motion.button>
      </div>
    </nav>
  );
}
