/**
 * landingData.js
 * Centralized static configuration, data arrays, and animation variants for LandingPage.
 */

/* ─── Reusable animation variants ───────────────────────────── */
export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
});

export const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.07 } },
  viewport: { once: true, amount: 0.1 },
};

export const cardVariant = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
};

/* ─── Cursor Musical Notes (Staggered Vanishing Sequence) ───── */
export const CURSOR_MUSICAL_NOTES = [
  { char: '♪',  label: 'eighth note',            x: -38, y: -36, size: 22, color: '#1DB954', delay: 0.0,  mass: 0.2 },
  { char: '♫',  label: 'beamed eighth notes',     x:  38, y: -32, size: 24, color: '#1ed760', delay: 0.5,  mass: 0.25 },
  { char: '♬',  label: 'beamed sixteenth notes',  x: -48, y:  14, size: 22, color: '#1DB954', delay: 1.0,  mass: 0.3 },
  { char: '♩',  label: 'quarter note',           x:  46, y:  18, size: 24, color: '#1ed760', delay: 1.5,  mass: 0.35 },
  { char: '🎵', label: 'musical note emoji',     x: -24, y:  50, size: 22, color: '#1DB954', delay: 2.0,  mass: 0.4 },
  { char: '🎶', label: 'multiple notes emoji',   x:  28, y:  52, size: 24, color: '#1ed760', delay: 2.5,  mass: 0.45 },
];

/* ─── Core Technical Capabilities ───────────────────────────── */
export const CAPABILITIES = [
  { icon: '🔒', label: 'PKCE 2.0 Security' },
  { icon: '⚡', label: '320 kbps Studio Audio' },
  { icon: '🗄️', label: 'Neon DB Cache' },
  { icon: '📁', label: 'Automatic Local Save' },
  { icon: '⏱️', label: 'Real-time ETA Countdown' },
  { icon: '✅', label: 'Selective Tracks' },
  { icon: '🌐', label: 'Cloud Processing' },
  { icon: '🎧', label: 'Audiophile Certified' },
];

/* ─── Feature Comparison Items ──────────────────────────────── */
export const COMPARISON_ITEMS = [
  { feature: "Audio Quality", tunefetch: "320 kbps Studio HQ", others: "128 kbps Compressed" },
  { feature: "Privacy & Auth", tunefetch: "100% PKCE OAuth 2.0", others: "Credential Scraping" },
  { feature: "Playlist Capacity", tunefetch: "1,400+ Tracks Batch", others: "10 Tracks Max" },
  { feature: "Speed & Caching", tunefetch: "0.1s Neon DB Cache", others: "No Caching (Slow)" },
  { feature: "Track Metadata", tunefetch: "Original Artist & Title Tags", others: "Generic Unnamed Files" },
  { feature: "Ads & Popups", tunefetch: "Zero Ads · 100% Free", others: "Shady Popups & Spam" },
];

/* ─── Real Testimonials & Reviews ───────────────────────────── */
export const TESTIMONIALS = [
  {
    name: "Aarav Sharma",
    role: "DJ & Music Producer (Mumbai)",
    quote: "TuneFetch has made setting up my gig sets effortless. Downloading full 200-song playlists in crystal clear 320 kbps with original artist tags directly into my laptop saves me hours every week.",
    avatar: "🎧",
    rating: 5
  },
  {
    name: "Priya Deshmukh",
    role: "Indie Audiophile (Bengaluru)",
    quote: "The audio clarity is genuinely top-tier. No compression artifacts or muffled frequencies — just crisp 320 kbps MP3s that sound wonderful on my studio headphones.",
    avatar: "🎵",
    rating: 5
  },
  {
    name: "Rohan Verma",
    role: "Sound Engineer (Delhi NCR)",
    quote: "The PKCE OAuth security and Neon DB caching architecture are brilliant. It's fast, completely private, and works seamlessly for all my favorite Spotify playlists.",
    avatar: "💻",
    rating: 5
  }
];

/* ─── FAQ & Knowledge Base ──────────────────────────────────── */
export const FAQ_ITEMS = [
  {
    q: "Is TuneFetch really 100% free with no hidden limits?",
    a: "Yes! TuneFetch is completely free. Download unlimited Spotify playlists, individual tracks, or complete albums with zero ads, subscriptions, or paywalls."
  },
  {
    q: "How does TuneFetch guarantee 320 kbps studio audio quality?",
    a: "Every track is encoded server-side using FFmpeg audio processing to preserve the full frequency response, 44.1 kHz sampling rate, and dynamic range of original studio recordings."
  },
  {
    q: "How safe are my Spotify credentials with PKCE OAuth 2.0?",
    a: "100% secure. PKCE (Proof Key for Code Exchange) is the global gold standard for OAuth security. Your password remains 100% private to Spotify."
  },
  {
    q: "Where do my downloaded MP3 songs go on my computer?",
    a: "All songs are automatically structured with clean artist & song title tags and saved directly to your computer."
  }
];

/* ─── Scrolling Marquee Highlights ─────────────────────────── */
export const MARQUEE_ITEMS = [
  "🔥 Over 14,000+ Tracks & Albums Processed",
  "⚡ 320 kbps Studio-Grade MP3 Audio Quality",
  "🔒 Bank-Grade PKCE OAuth 2.0 Security",
  "📁 Automatic Local MP3 Save & Metadata Tagging",
  "🎛️ Server-Side FFmpeg Audio Processing",
  "🚀 Sub-Second Neon PostgreSQL Caching Engine",
  "❤️ Trusted by Music Purists & DJs Across India"
];
