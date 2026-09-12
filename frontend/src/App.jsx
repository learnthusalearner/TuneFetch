import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import { api } from './services/api';

/**
 * App — pure router.
 * Renders LandingPage on '/', DashboardPage on '/dashboard', and PrivacyPolicyPage on '/privacy'.
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

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            onLaunch={() => navigate('/dashboard')}
            onPrivacy={() => navigate('/privacy')}
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
        path="/privacy"
        element={
          <PrivacyPolicyPage
            onGoHome={() => navigate('/')}
          />
        }
      />
      <Route
        path="/privacy-policy"
        element={
          <PrivacyPolicyPage
            onGoHome={() => navigate('/')}
          />
        }
      />
      <Route
        path="*"
        element={
          <LandingPage
            onLaunch={() => navigate('/dashboard')}
            onPrivacy={() => navigate('/privacy')}
            spotifyStatus={spotifyStatus}
          />
        }
      />
    </Routes>
  );
}
