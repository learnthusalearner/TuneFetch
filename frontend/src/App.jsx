import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import { api } from './services/api';

/**
 * App — pure router.
 * Manages top-level routes:
 *   /          -> LandingPage
 *   /dashboard -> DashboardPage
 */
export default function App() {
  const [spotifyStatus, setSpotifyStatus] = useState({ connected: false, spotify_user: null });
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fetch Spotify status and auto-route to dashboard if already connected
  useEffect(() => {
    api.getSpotifyStatus().then((status) => {
      setSpotifyStatus(status);
      if (status?.connected && location.pathname === '/') {
        // User already connected Spotify! Jump straight to dashboard
        navigate('/dashboard', { replace: true });
      }
    }).catch(() => {});

    // If redirected back from Spotify OAuth, jump straight to /dashboard
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify') === 'connected' || params.get('spotify_error')) {
      if (location.pathname !== '/dashboard') {
        navigate(`/dashboard${window.location.search}`, { replace: true });
      }
    }
  }, [navigate, location.pathname]);

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
