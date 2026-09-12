import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import LocalDesktopPage from './pages/LocalDesktopPage';
import { api, isLocalhost } from './services/api';

/**
 * App — pure router.
 * - On Localhost (Desktop Mode): Renders the ultra-clean LocalDesktopPage with live digital timer, ETA & folder manager.
 * - On Production Web (Vercel): Renders LandingPage on '/' and DashboardPage on '/dashboard'.
 *   Users can freely browse the landing page without being hijacked to OAuth!
 */
export default function App() {
  const [spotifyStatus, setSpotifyStatus] = useState({ connected: false, spotify_user: null });
  const navigate = useNavigate();
  const location = useLocation();

  // Load Spotify status on mount without violent auto-navigation
  useEffect(() => {
    api.getSpotifyStatus().then((status) => {
      setSpotifyStatus(status);
    }).catch(() => {});

    // Only redirect if explicitly returning from Spotify OAuth callback query
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify') === 'connected' || params.get('spotify_error')) {
      if (location.pathname !== '/dashboard') {
        navigate(`/dashboard${window.location.search}`, { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  // When running locally on PC, show the dedicated desktop download interface
  if (isLocalhost) {
    return (
      <Routes>
        <Route path="*" element={<LocalDesktopPage />} />
      </Routes>
    );
  }

  // When running on production cloud website (Vercel)
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            onLaunch={() => navigate('/dashboard')}
            spotifyStatus={spotifyStatus}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <DashboardPage
            onGoHome={() => navigate('/')}
          />
        }
      />
      <Route
        path="*"
        element={
          <LandingPage
            onLaunch={() => navigate('/dashboard')}
            spotifyStatus={spotifyStatus}
          />
        }
      />
    </Routes>
  );
}
