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

  // Pre-fetch Spotify status so LandingPage can show "connected" pill
  useEffect(() => {
    api.getSpotifyStatus().then(setSpotifyStatus).catch(() => {});

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
