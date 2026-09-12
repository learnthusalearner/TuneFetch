import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, Trash2, Code2, Server, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage({ onGoHome }) {
  const cardStyle = {
    padding: '24px',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  };

  const iconStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(29, 185, 84, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1DB954',
    flexShrink: 0
  };

  const headingStyle = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700
  };

  const textStyle = {
    margin: 0,
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: '14px',
    lineHeight: '1.7'
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080c14',
        color: '#fff',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(29, 185, 84, 0.12) 0%, rgba(8, 12, 20, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '28px'
        }}
      >
        {/* Back Navigation */}
        <button
          onClick={onGoHome}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        {/* Header */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(29, 185, 84, 0.12)',
              border: '1px solid rgba(29, 185, 84, 0.3)',
              borderRadius: '20px',
              color: '#1DB954',
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            <ShieldCheck size={14} />
            <span>Privacy & Security</span>
          </div>

          <h1
            style={{
              margin: '14px 0 6px',
              fontSize: '36px',
              fontWeight: 800,
              letterSpacing: '-0.5px'
            }}
          >
            Privacy Policy
          </h1>

          <p
            style={{
              margin: 0,
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '15px'
            }}
          >
            Last Updated: September 2026 · TuneFetch v1.3.0
          </p>
        </div>

        {/* Introduction */}
        <div style={cardStyle}>
          <h3 style={{ ...headingStyle, marginBottom: '10px' }}>
            About TuneFetch
          </h3>

          <p style={textStyle}>
            TuneFetch is an open-source project designed to simplify playlist
            processing and audio extraction workflows. This Privacy Policy
            explains what information TuneFetch processes, why it is processed,
            how long it may be retained, and how the application handles
            third-party services.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            We aim to collect and retain only the information necessary for the
            application to function.
          </p>
        </div>

        {/* 1. Spotify Authentication */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '10px'
            }}
          >
            <div style={iconStyle}>
              <Lock size={20} />
            </div>

            <h3 style={headingStyle}>
              1. Spotify Authentication
            </h3>
          </div>

          <p style={textStyle}>
            TuneFetch uses Spotify's OAuth 2.0 authorization flow to allow users
            to connect their Spotify account and access playlists permitted by
            Spotify.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            TuneFetch does not ask for or store your Spotify password.
            Authentication is handled through Spotify's authorization system.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            TuneFetch only requests the permissions required for the features
            provided by the application.
          </p>
        </div>

        {/* 2. Information Processed */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '10px'
            }}
          >
            <div style={iconStyle}>
              <Server size={20} />
            </div>

            <h3 style={headingStyle}>
              2. Information We Process
            </h3>
          </div>

          <p style={textStyle}>
            Depending on how you use TuneFetch, the application may temporarily
            process information such as:
          </p>

          <ul
            style={{
              margin: '12px 0 0',
              paddingLeft: '20px',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '14px',
              lineHeight: '1.8'
            }}
          >
            <li>Spotify account identifier</li>
            <li>Playlist identifiers and playlist names</li>
            <li>Track names and artist names</li>
            <li>Temporary session identifiers</li>
            <li>Information required to process playlist requests</li>
          </ul>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            We do not intentionally collect your Spotify password, payment
            information, or the contents of files stored on your computer.
          </p>
        </div>

        {/* 3. Database and Caching */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '10px'
            }}
          >
            <div style={iconStyle}>
              <Server size={20} />
            </div>

            <h3 style={headingStyle}>
              3. Database, Temporary Storage & Caching
            </h3>
          </div>

          <p style={textStyle}>
            TuneFetch uses a hosted PostgreSQL database provided by Neon to
            manage application data and temporary playlist-processing
            information.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            We may also use caching to reduce repeated requests, improve
            performance, and avoid unnecessary processing of the same playlist
            or track information.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            Temporary session data is intended to be automatically removed
            after the applicable retention period. Cached information may be
            retained only for as long as necessary for application performance
            and operation.
          </p>
        </div>

        {/* 4. Local Processing */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '10px'
            }}
          >
            <div style={iconStyle}>
              <CheckCircle2 size={20} />
            </div>

            <h3 style={headingStyle}>
              4. Local Desktop Processing
            </h3>
          </div>

          <p style={textStyle}>
            Certain TuneFetch functionality may run locally on your computer.
            When using the TuneFetch desktop application, downloaded files are
            saved to the location selected or configured on your device.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            TuneFetch does not intentionally upload your locally downloaded
            audio files to our servers.
          </p>
        </div>

        {/* 5. Open Source */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '10px'
            }}
          >
            <div style={iconStyle}>
              <Code2 size={20} />
            </div>

            <h3 style={headingStyle}>
              5. Open-Source Software & Third-Party Components
            </h3>
          </div>

          <p style={textStyle}>
            TuneFetch is built using open-source software and third-party
            services. These components help provide functionality such as
            authentication, database access, caching, playlist processing,
            media extraction, and application infrastructure.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            The TuneFetch source code is publicly available so that users and
            developers can inspect how the application works.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            Individual open-source dependencies remain subject to their
            respective licenses and terms. A complete list of dependencies and
            their licenses can be found in the project's source repository.
          </p>
        </div>

        {/* 6. Third Party Services */}
        <div style={cardStyle}>
          <h3 style={{ ...headingStyle, marginBottom: '10px' }}>
            6. Third-Party Services
          </h3>

          <p style={textStyle}>
            TuneFetch relies on certain third-party services to operate.
            Depending on the features you use, these may include:
          </p>

          <ul
            style={{
              margin: '12px 0 0',
              paddingLeft: '20px',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '14px',
              lineHeight: '1.8'
            }}
          >
            <li>
              <strong>Spotify</strong> for account authorization and playlist
              information.
            </li>
            <li>
              <strong>Neon</strong> for hosted PostgreSQL database
              infrastructure.
            </li>
            <li>
              <strong>Open-source libraries</strong> used throughout the
              TuneFetch application and processing pipeline.
            </li>
          </ul>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            These third-party providers operate under their own privacy
            policies, terms, and service agreements.
          </p>
        </div>

        {/* 7. Data Security */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '10px'
            }}
          >
            <div style={iconStyle}>
              <ShieldCheck size={20} />
            </div>

            <h3 style={headingStyle}>
              7. Data Security
            </h3>
          </div>

          <p style={textStyle}>
            We take reasonable technical measures to protect information
            processed by TuneFetch. Authentication credentials and sensitive
            configuration values are intended to be handled through secure
            server-side mechanisms and environment variables rather than being
            exposed in the client application.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            However, no internet-connected application can guarantee absolute
            security. TuneFetch is provided as an open-source project and users
            should review the source code and third-party services for their
            own requirements.
          </p>
        </div>

        {/* 8. Data Retention */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '10px'
            }}
          >
            <div style={iconStyle}>
              <Trash2 size={20} />
            </div>

            <h3 style={headingStyle}>
              8. Data Retention & Deletion
            </h3>
          </div>

          <p style={textStyle}>
            TuneFetch is designed to minimize long-term storage of user-related
            information. Temporary session and playlist-processing data may be
            stored for a limited period to allow the application to complete
            requested operations.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            Where automatic cleanup is implemented, temporary records are
            deleted according to the application's configured retention period.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            We do not claim that all data is immediately deleted from every
            third-party infrastructure layer, as providers may maintain backups
            or operational logs according to their own policies.
          </p>
        </div>

        {/* 9. No Ads / Tracking */}
        <div style={cardStyle}>
          <h3 style={{ ...headingStyle, marginBottom: '10px' }}>
            9. Advertising & Analytics
          </h3>

          <p style={textStyle}>
            TuneFetch does not intentionally use third-party advertising
            networks or sell user information for advertising purposes.
          </p>

          <p style={{ ...textStyle, marginTop: '12px' }}>
            If analytics, error monitoring, or other telemetry services are
            introduced in the future, this Privacy Policy will be updated to
            describe the relevant data collection and processing.
          </p>
        </div>

        {/* 10. User Responsibility */}
        <div style={cardStyle}>
          <h3 style={{ ...headingStyle, marginBottom: '10px' }}>
            10. User Responsibility
          </h3>

          <p style={textStyle}>
            Users are responsible for ensuring that their use of TuneFetch
            complies with applicable laws, copyright requirements, and the
            terms of the services they use. TuneFetch does not grant users any
            rights to content they do not otherwise have permission to access,
            download, or use.
          </p>
        </div>

        {/* 11. Changes */}
        <div style={cardStyle}>
          <h3 style={{ ...headingStyle, marginBottom: '10px' }}>
            11. Changes to This Policy
          </h3>

          <p style={textStyle}>
            This Privacy Policy may be updated as TuneFetch evolves, including
            when new features, third-party services, or data-processing
            mechanisms are introduced. The "Last Updated" date at the top of
            this page will be changed whenever material updates are made.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >
          <span
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.5)'
            }}
          >
            © 2026 TuneFetch Open Source Project.
          </span>

          <button
            onClick={onGoHome}
            style={{
              background: 'none',
              border: 'none',
              color: '#1DB954',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Return to Home →
          </button>
        </div>
      </div>
    </div>
  );
}