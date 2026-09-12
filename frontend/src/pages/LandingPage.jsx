import React, { useState } from 'react';

// Modular landing components
import MusicalCursor from '../components/landing/MusicalCursor';
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import TickerMarquee from '../components/landing/TickerMarquee';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import CapabilitiesSection from '../components/landing/CapabilitiesSection';
import ProducerSection from '../components/landing/ProducerSection';
import GenreGallerySection from '../components/landing/GenreGallerySection';
import AudiophileSection from '../components/landing/AudiophileSection';
import ComparisonSection from '../components/landing/ComparisonSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FaqSection from '../components/landing/FaqSection';
import FinalCtaSection from '../components/landing/FinalCtaSection';
import LandingFooter from '../components/landing/LandingFooter';

/**
 * LandingPage
 * High-performance Antigravity-style showcase page composed of modular sections.
 */
export default function LandingPage({ onLaunch, onPrivacy, spotifyStatus }) {
  const isConnected = spotifyStatus?.connected;
  const displayName = spotifyStatus?.spotify_user?.display_name;

  /* ── Mouse position & cursor state for Spotify interactive cursor ── */
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const [isCursorActive, setIsCursorActive] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (!isCursorActive) setIsCursorActive(true);
  };

  const handleMouseLeave = () => {
    setIsCursorActive(false);
  };

  const scrollToComparison = () => {
    document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="landing-root"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => setIsClicking(true)}
      onMouseUp={() => setIsClicking(false)}
      style={{ position: 'relative', overflowX: 'hidden' }}
    >
      {/* Interactive Spotify Musical Cursor with Staggered Vanishing Notes */}
      <MusicalCursor
        mousePos={mousePos}
        isCursorActive={isCursorActive}
        isClicking={isClicking}
      />

      {/* Frosted Sticky Navigation Bar */}
      <LandingNav
        onLaunch={onLaunch}
        onPrivacy={onPrivacy}
        isConnected={isConnected}
      />

      {/* Hero Showcase with 4-Card Preview */}
      <HeroSection
        onLaunch={onLaunch}
        scrollToComparison={scrollToComparison}
        isConnected={isConnected}
        displayName={displayName}
      />

      {/* Continuous Ticker Marquee */}
      <TickerMarquee />

      {/* How TuneFetch Works: 3-Step Lightning Workflow & Interactive Terminal Video Simulation */}
      <HowItWorksSection
        onLaunch={onLaunch}
      />

      {/* Core Technical Capabilities */}
      <CapabilitiesSection />

      {/* Indian Producer & Studio Feature */}
      <ProducerSection />

      {/* Visual Genre Gallery (Lo-Fi, Synthwave, Catalog) */}
      <GenreGallerySection />

      {/* Professional DJ & Audiophile Equipment */}
      <AudiophileSection />

      {/* Side-by-Side Comparison Matrix */}
      <ComparisonSection />

      {/* Genuine Indian Audiophile Testimonials */}
      <TestimonialsSection />

      {/* SEO Frequently Asked Questions */}
      <FaqSection />

      {/* Final Conversion Call To Action */}
      <FinalCtaSection
        onLaunch={onLaunch}
        isConnected={isConnected}
      />

      {/* Semantic Footer */}
      <LandingFooter onPrivacy={onPrivacy} />
    </div>
  );
}
