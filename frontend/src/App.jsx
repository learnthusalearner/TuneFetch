import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import ProgressCard from "./components/ProgressCard";
import AudioPlayer from "./components/AudioPlayer";
import HistoryDrawer from "./components/HistoryDrawer";

// Spotify components
import SpotifyConnect from "./components/Spotify/SpotifyConnect";
import SpotifyPlaylists from "./components/Spotify/SpotifyPlaylists";
import PlaylistTracksModal from "./components/Spotify/PlaylistTracksModal";
import BatchProgressCard from "./components/Spotify/BatchProgressCard";

import { api } from "./services/api";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useDownloadTask } from "./hooks/useDownloadTask";
import { STORAGE_KEYS } from "./constants";

import {
  AlertCircle,
  Music,
  Link2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Home,
  ArrowRight,
  Database,
  Clock,
  Archive,
  Layers,
  Zap,
  CheckCircle,
  LogOut,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("home"); // 'home' | 'spotify'
  const [playingTrack, setPlayingTrack] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [health, setHealth] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Spotify state
  const [spotifyStatus, setSpotifyStatus] = useState({
    connected: false,
    spotify_user: null,
  });
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [selectedPlaylistForModal, setSelectedPlaylistForModal] =
    useState(null);
  const [extractedTracks, setExtractedTracks] = useState(null);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isStartingBatchDownload, setIsStartingBatchDownload] = useState(false);
  const [downloadingTrackId, setDownloadingTrackId] = useState(null);

  // Batch Job state with background persistence across tab closures / refresh
  const [activeJobId, setActiveJobId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB) || null;
    } catch {
      return null;
    }
  });

  const [activeJob, setActiveJob] = useState(null);

  // Persistent download history
  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.HISTORY, []);

  // Sync activeJobId to localStorage
  useEffect(() => {
    try {
      if (activeJobId) {
        localStorage.setItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB, activeJobId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB);
      }
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
  }, [activeJobId]);

  // Completion callback when single audio finishes converting & downloading
  const handleTaskCompleted = useCallback(
    (completedTask) => {
      setHistory((prev) => [
        {
          file_id: completedTask.file_id,
          title: completedTask.title,
          artist: completedTask.artist,
          thumbnail: completedTask.thumbnail,
          filename: completedTask.filename,
          filesize: completedTask.filesize,
          timestamp: Date.now(),
        },
        ...prev.filter((item) => item.file_id !== completedTask.file_id),
      ]);
    },
    [setHistory],
  );

  // Dedicated single task hook
  const {
    activeTask,
    activeTrackIndex,
    error: taskError,
    startDownload,
    resetTask,
    setError: setTaskError,
  } = useDownloadTask(handleTaskCompleted);

  // Health poll on mount
  useEffect(() => {
    const checkHealth = async () => {
      const res = await api.getHealth();
      setHealth(res);
    };

    checkHealth();

    const interval = setInterval(checkHealth, 20000);

    return () => clearInterval(interval);
  }, []);

  // Check Spotify status & URL search params on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      if (params.get("spotify") === "connected") {
        setActiveTab("spotify");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      } else if (params.get("spotify_error")) {
        setActiveTab("spotify");

        let rawErr = params.get("spotify_error") || "";

        try {
          rawErr = decodeURIComponent(rawErr.replace(/\+/g, " "));
        } catch {
          // Keep raw string if malformed
        }

        setGeneralError(`Spotify authorization: ${rawErr}`);

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    } catch (e) {
      console.warn("URL search params parsing error:", e);
    }

    refreshSpotifyStatus();
  }, []);

  const refreshSpotifyStatus = async () => {
    try {
      const status = await api.getSpotifyStatus();

      setSpotifyStatus(status);

      if (status.connected) {
        fetchPlaylists();

        // Automatically retrieve the user's latest or completed batch job
        try {
          const latestJob = await api.getLatestPlaylistJob();

          if (
            latestJob &&
            (latestJob.status === "COMPLETED" ||
              latestJob.status === "PROCESSING" ||
              latestJob.status === "QUEUED")
          ) {
            setActiveJobId(latestJob.id);
            setActiveJob(latestJob);
          }
        } catch {}
      }
    } catch (e) {
      console.warn("Spotify status error:", e);
    }
  };

  const fetchPlaylists = async () => {
    setIsLoadingPlaylists(true);

    try {
      const list = await api.getSpotifyPlaylists();
      setSpotifyPlaylists(list);
    } catch (err) {
      setGeneralError(err.message || "Failed to load Spotify playlists.");
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // Poll active Spotify batch download job
  useEffect(() => {
    if (!activeJobId) return;

    let isMounted = true;

    const pollInterval = setInterval(async () => {
      try {
        const job = await api.getPlaylistJobStatus(activeJobId);

        if (!isMounted) return;

        setActiveJob(job);

        // Update history with any completed tracks
        const tracksArray = job.tracks || job.track_results || [];

        if (tracksArray.length > 0) {
          const finishedTracks = tracksArray.filter(
            (t) => (t.status || "").toLowerCase() === "completed" && t.file_id,
          );

          if (finishedTracks.length > 0) {
            setHistory((prev) => {
              const existingIds = new Set(prev.map((h) => h.file_id));

              const newItems = finishedTracks
                .filter((t) => !existingIds.has(t.file_id))
                .map((t) => ({
                  file_id: t.file_id,
                  title: t.song_name || t.title || t.name,
                  artist:
                    t.artist_name ||
                    t.artist ||
                    (Array.isArray(t.artists)
                      ? t.artists.join(", ")
                      : t.artists),
                  thumbnail: t.thumbnail,
                  filename:
                    t.filename || `${t.song_name || t.name || "track"}.mp3`,
                  filesize: t.filesize || 0,
                  timestamp: Date.now(),
                }));

              return [...newItems, ...prev];
            });
          }
        }

        const normStatus = (job.status || "").toLowerCase();

        if (normStatus === "completed" || normStatus === "failed") {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.warn("Error polling playlist job:", err);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [activeJobId, setHistory]);

  const handleSpotifyConnect = () => {
    window.location.href = "/spotify/auth";
  };

  const handleSpotifyDisconnect = async () => {
    try {
      await api.disconnectSpotify();

      setSpotifyStatus({
        connected: false,
        spotify_user: null,
      });

      setSpotifyPlaylists([]);
      setExtractedTracks(null);
      setSelectedPlaylistForModal(null);

      setSuccessNotice("Spotify account disconnected.");
    } catch (err) {
      setGeneralError(err.message || "Failed to disconnect Spotify account.");
    }
  };

  const handleSelectSpotifyPlaylist = async (playlistId) => {
    const pl = spotifyPlaylists.find((p) => p.id === playlistId) || {
      id: playlistId,
      name: "Spotify Playlist",
    };

    setSelectedPlaylistForModal(pl);
    setExtractedTracks(null);
    setIsLoadingTracks(true);
    setGeneralError(null);

    try {
      const data = await api.getPlaylistTracks(playlistId);
      setExtractedTracks(data.tracks || []);
    } catch (err) {
      setGeneralError(err.message || "Failed to extract playlist tracks.");
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleStartPlaylistBatchDownload = async (
    playlistId,
    format,
    trackIds,
  ) => {
    setIsStartingBatchDownload(true);
    setGeneralError(null);

    resetTask();

    const selectedPl = selectedPlaylistForModal;

    const totalCount = trackIds
      ? trackIds.length
      : extractedTracks?.length || selectedPl?.tracks_total || 0;

    try {
      const jobId = await api.startPlaylistDownload(
        playlistId,
        format,
        trackIds,
      );

      setActiveJobId(jobId);

      setActiveJob({
        id: jobId,
        playlist_name: selectedPl?.name || "Spotify Playlist",
        total_tracks: totalCount,
        processed_tracks: 0,
        successful_tracks: 0,
        failed_tracks: 0,
        status: "PROCESSING",
        tracks: [],
        zip_filename: "Thanks_for_downloading.zip",
      });

      setSelectedPlaylistForModal(null);
      setExtractedTracks(null);

      setSuccessNotice(
        "Started playlist folder download! All songs are being packaged into Thanks_for_downloading folder.",
      );
    } catch (err) {
      setGeneralError(
        err.message || "Failed to start batch playlist download.",
      );
    } finally {
      setIsStartingBatchDownload(false);
    }
  };

  // Download a single song individually from the Spotify tracks list
  const handleDownloadSingleTrack = async (track, format, trackId) => {
    setDownloadingTrackId(trackId);
    setGeneralError(null);

    try {
      const songName = track.song_name || track.title || track.name;

      const artistName =
        track.artist_name ||
        track.artist ||
        (Array.isArray(track.artists)
          ? track.artists.join(", ")
          : track.artists) ||
        "";

      const data = await api.downloadSingleSpotifyTrack({
        song_name: songName,
        artist_name: artistName,
        thumbnail: track.thumbnail,
        format: format || "mp3-320",
      });

      if (data?.task_id) {
        setSuccessNotice(
          `Started download for "${songName}"! Track progress below.`,
        );

        await startDownload({
          url: data.candidate_url,
          format: format || "mp3-320",
          title: songName,
          artist: artistName,
          thumbnail: track.thumbnail,
          existingTaskId: data.task_id,
        });
      }
    } catch (err) {
      setGeneralError(err.message || "Failed to download single track.");
    } finally {
      setDownloadingTrackId(null);
    }
  };

  const handleDismissBatchJob = () => {
    setActiveJob(null);
    setActiveJobId(null);

    try {
      localStorage.removeItem(STORAGE_KEYS.SPOTIFY_ACTIVE_JOB);
    } catch {}
  };

  const activeError = generalError || taskError;

  return (
    <>
      <div className="glow-blob glow-blob-1" />
      <div className="glow-blob glow-blob-2" />

      <div className="app-container">
        {/* ================= HEADER ================= */}

        <Header
          health={health}
          currentPage={activeTab}
          onHistory={() => setShowHistory(!showHistory)}
          onSpotify={() => setActiveTab("spotify")}
          onHome={() => setActiveTab("home")}
        />

        {showHistory && (
          <HistoryDrawer
            history={history}
            onPlay={(track) => setPlayingTrack(track)}
            onClear={() => setHistory([])}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* 
          The duplicate navigation bar that was previously
          rendered here has intentionally been removed.

          Navigation is now visually handled by the top header.
        */}

        {/* ================= GLOBAL NOTIFICATIONS ================= */}

        {successNotice && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              color: "#16A34A",
              fontSize: "13px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successNotice}</span>
            </div>

            <button
              onClick={() => setSuccessNotice(null)}
              style={{
                background: "none",
                border: "none",
                color: "#16A34A",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {activeError && (
          <div className="error-box">
            <AlertCircle size={18} />

            <span style={{ flex: 1 }}>{activeError}</span>

            <button
              onClick={() => {
                setGeneralError(null);
                setTaskError(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* ================= ACTIVE JOB ================= */}

        {activeJob && (
          <BatchProgressCard
            job={activeJob}
            onDismiss={handleDismissBatchJob}
            onPlayAudio={(track) => setPlayingTrack(track)}
          />
        )}

        {/* ================= SINGLE DOWNLOAD ================= */}

        {activeTask && (
          <ProgressCard
            task={activeTask}
            onPlayAudio={(task) => setPlayingTrack(task)}
            onReset={resetTask}
          />
        )}

        {/* =========================================================
            MODE 1: HOMEPAGE LANDING
        ========================================================= */}

        {activeTab === "home" && (
          <div
            className="home-landing"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              marginTop: "0",
            }}
          >
            {/* ================= HERO ================= */}

            <div
              className="glass-panel"
              style={{
                padding: "34px 32px 38px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "20px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Badge */}

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 15px",
                  borderRadius: "999px",
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  color: "#16A34A",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.1px",
                  marginBottom: "26px",
                }}
              >
                <Sparkles size={15} />

                <span>
                  Next-Gen Spotify Downloader • 320 kbps & Neon DB Caching
                </span>
              </div>

              {/* Main Heading */}

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(44px, 5vw, 68px)",
                  fontWeight: 900,
                  lineHeight: "1.04",
                  color: "#17233D",
                  maxWidth: "950px",
                  letterSpacing: "-2.8px",
                  textWrap: "balance",
                }}
              >
                Download Any Spotify Playlist or Song in Ultra-HQ Audio
              </h1>

              {/* Description */}

              <p
                style={{
                  margin: "26px 0 0",
                  fontSize: "18px",
                  fontWeight: 500,
                  color: "#64748B",
                  maxWidth: "680px",
                  lineHeight: "1.55",
                  letterSpacing: "-0.1px",
                }}
              >
                Log in securely via Spotify OAuth, explore your entire playlist
                library, and download either individual songs or complete
                playlists packaged into a clean folder with exact artist and
                song filenames.
              </p>

              {/* Main CTA */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "28px",
                }}
              >
                <button
                  onClick={() => setActiveTab("spotify")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "11px",
                    minWidth: "310px",
                    padding: "16px 30px",
                    borderRadius: "999px",
                    background:
                      "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "16px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 10px 28px rgba(29, 185, 84, 0.28)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 14px 34px rgba(29, 185, 84, 0.34)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 28px rgba(29, 185, 84, 0.28)";
                  }}
                >
                  <Music size={19} />

                  <span>Launch Spotify Downloader</span>

                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Quick Status Pill */}

              {spotifyStatus.connected && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 16px",
                    borderRadius: "999px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                    color: "#475569",
                    marginTop: "18px",
                  }}
                >
                  <CheckCircle size={14} color="#1DB954" />

                  <span>
                    Linked as{" "}
                    <strong>
                      {spotifyStatus.spotify_user?.display_name ||
                        "Spotify User"}
                    </strong>{" "}
                    • {spotifyPlaylists.length} playlists ready
                  </span>
                </div>
              )}
            </div>

            {/* =====================================================
                3-STEP FLOW
            ===================================================== */}

            <div
              className="steps-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "8px",
                padding: "6px 6px 4px",
                marginTop: "-2px",
              }}
            >
              {/* STEP 1 */}

              <div
                className="step-item"
                style={{
                  padding: "20px 20px 18px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "#1DB954",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                    boxShadow: "0 5px 14px rgba(29, 185, 84, 0.22)",
                  }}
                >
                  <Zap size={23} />
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 850,
                    color: "#0F172A",
                    lineHeight: "1.2",
                    letterSpacing: "-0.5px",
                  }}
                >
                  1. Connect Spotify
                </h3>

                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#475569",
                    lineHeight: "1.55",
                    maxWidth: "360px",
                  }}
                >
                  Authenticate via PKCE OAuth to access your private and public
                  playlists with zero token storage risks.
                </p>
              </div>

              {/* STEP 2 */}

              <div
                className="step-item"
                style={{
                  padding: "20px 20px 18px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "#EFF6FF",
                    color: "#3B82F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                  }}
                >
                  <Layers size={27} />
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 850,
                    color: "#0F172A",
                    lineHeight: "1.2",
                    letterSpacing: "-0.5px",
                  }}
                >
                  2. Select Playlist & Songs
                </h3>

                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#475569",
                    lineHeight: "1.55",
                    maxWidth: "390px",
                  }}
                >
                  Extract full tracklists (up to 1,400+ songs). Select specific
                  songs or download the complete playlist.
                </p>
              </div>

              {/* STEP 3 */}

              <div
                className="step-item"
                style={{
                  padding: "20px 20px 18px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "#EFF6FF",
                    color: "#60A5FA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                  }}
                >
                  <Archive size={27} />
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 850,
                    color: "#0F172A",
                    lineHeight: "1.2",
                    letterSpacing: "-0.5px",
                  }}
                >
                  3. Folder on PC
                </h3>

                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#475569",
                    lineHeight: "1.55",
                    maxWidth: "390px",
                  }}
                >
                  Save all playlist songs directly into a folder{" "}
                  <code>Thanks_for_downloading</code> on your PC with exact
                  titles.
                </p>
              </div>
            </div>

            {/* =====================================================
                ARCHITECTURE HIGHLIGHTS
            ===================================================== */}

            <div
              className="architecture-highlights"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "14px",
                marginTop: "0",
              }}
            >
              {/* DATABASE CARD */}

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "17px",
                  padding: "22px 26px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "16px",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
                  minHeight: "112px",
                }}
              >
                <Database
                  size={30}
                  style={{
                    color: "#3B82F6",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}
                />

                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: 850,
                      color: "#0F172A",
                      lineHeight: "1.2",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Neon DB Smart Caching
                  </h4>

                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#475569",
                      lineHeight: "1.5",
                    }}
                  >
                    Matches both song title and artist. Repeated searches skip
                    Serper API entirely and load directly from PostgreSQL.
                  </p>
                </div>
              </div>

              {/* ETA CARD */}

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "17px",
                  padding: "22px 26px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "16px",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
                  minHeight: "112px",
                }}
              >
                <Clock
                  size={30}
                  style={{
                    color: "#3B82F6",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}
                />

                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: 850,
                      color: "#0F172A",
                      lineHeight: "1.2",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Live ETA Timer & Persistence
                  </h4>

                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#475569",
                      lineHeight: "1.5",
                    }}
                  >
                    Calculates real-time completion countdown. You can close the
                    page, do other things, and come back later to save your
                    folder.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            MODE 2: SPOTIFY OAUTH & PLAYLISTS
        ========================================================= */}

        {activeTab === "spotify" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Show OAuth connect message ONLY when NOT connected */}

            {!spotifyStatus.connected ? (
              <SpotifyConnect
                spotifyStatus={spotifyStatus}
                onConnect={handleSpotifyConnect}
                onDisconnect={handleSpotifyDisconnect}
                isLoading={isLoadingPlaylists}
              />
            ) : (
              /* When ALREADY connected:
                 OAuth message is completely hidden,
                 just the playlist appears */

              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#0F172A",
                      }}
                    >
                      Your Spotify Playlists
                    </h3>

                    {spotifyStatus?.spotify_user && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#16A34A",
                          background: "#ECFDF5",
                          border: "1px solid #A7F3D0",
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        {spotifyStatus.spotify_user.display_name ||
                          spotifyStatus.spotify_user.id}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      className="icon-btn"
                      onClick={fetchPlaylists}
                      disabled={isLoadingPlaylists}
                      style={{
                        fontSize: "12px",
                        padding: "6px 14px",
                      }}
                    >
                      <RefreshCw
                        size={14}
                        className={isLoadingPlaylists ? "spinner" : ""}
                      />

                      <span>Refresh Playlists</span>
                    </button>

                    <button
                      className="icon-btn"
                      onClick={handleSpotifyDisconnect}
                      disabled={isLoadingPlaylists}
                      style={{
                        fontSize: "12px",
                        padding: "6px 12px",
                        color: "#64748B",
                      }}
                      title="Disconnect Spotify account"
                    >
                      <LogOut size={13} />

                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>

                <SpotifyPlaylists
                  playlists={spotifyPlaylists}
                  onSelectPlaylist={handleSelectSpotifyPlaylist}
                  isLoading={isLoadingTracks}
                  activePlaylistId={selectedPlaylistForModal?.id}
                />
              </>
            )}
          </div>
        )}

        {/* Spotify Playlist Tracks Inspection Modal */}

        {selectedPlaylistForModal && (
          <PlaylistTracksModal
            playlist={selectedPlaylistForModal}
            tracks={extractedTracks}
            isOpen={Boolean(selectedPlaylistForModal)}
            onClose={() => {
              setSelectedPlaylistForModal(null);
              setExtractedTracks(null);
            }}
            onStartDownload={handleStartPlaylistBatchDownload}
            onDownloadSingleTrack={handleDownloadSingleTrack}
            isLoadingTracks={isLoadingTracks}
            isStartingDownload={isStartingBatchDownload}
            downloadingTrackId={downloadingTrackId}
          />
        )}

        {/* In-browser Audio Player Preview */}

        {playingTrack && (
          <AudioPlayer
            track={playingTrack}
            onClose={() => setPlayingTrack(null)}
          />
        )}

        {/* ================= FOOTER ================= */}

        <footer className="footer">
          <p>TuneFetch • High-Fidelity Audio Extractor & Spotify Downloader</p>

          <p
            style={{
              fontSize: "11px",
              color: "#94A3B8",
            }}
          >
            Made by Kunal Srivastava with ❤️ • Free to use if anyone wants it!
          </p>
        </footer>
      </div>
    </>
  );
}
