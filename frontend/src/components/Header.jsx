import React from "react";
import { History, Music2, Activity } from "lucide-react";
import "./Header.css";

export default function Header({
  onHistory,
  onSpotify,
  onHome,
  currentPage = "home",
  health,
}) {
  const isReady = health?.status !== "offline";

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand */}
        <div
          className="brand"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="brand-mark">
            <Music2 size={25} strokeWidth={2.4} />
          </div>

          <div className="brand-copy">
            <div className="brand-name">TuneFetch</div>
            <div className="brand-tagline">Universal Audio & MP3 Extractor</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="main-nav">
          <button
            className={`nav-link ${currentPage === "home" ? "active" : ""}`}
            onClick={() => {
              onHome?.();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Home
          </button>

          <button
            className={`nav-link ${currentPage === "spotify" ? "active" : ""}`}
            onClick={onSpotify}
          >
            <Music2 size={18} />
            Spotify Downloader
          </button>
        </nav>

        {/* Header actions */}
        <div className="header-actions">
          <div className={`engine-status ${isReady ? "ready" : "offline"}`}>
            <Activity size={16} />
            <span>{isReady ? "MP3 Engine Ready" : "Engine Offline"}</span>
          </div>

          <button className="history-button" onClick={onHistory}>
            <History size={18} />
            <span>History</span>
          </button>
        </div>
      </div>
    </header>
  );
}
