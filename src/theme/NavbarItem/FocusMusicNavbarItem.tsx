import React from 'react';
import { useFocusMusic } from '../../context/FocusMusicContext';

export default function FocusMusicNavbarItem({
  className,
}: {
  mobile?: boolean;
  className?: string;
}): React.JSX.Element {
  const {
    togglePlayer,
    isPlaying,
    isPlayerOpen,
    currentTrack,
    pomodoro,
    musicSource,
    currentSpotifyPlaylist,
    isSpotifyPlaying,
  } = useFocusMusic();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isPomodoroActive = pomodoro.isRunning;
  const isFocus = pomodoro.mode === 'focus';
  const isSpotifyActive = musicSource === 'spotify' && !!isSpotifyPlaying;
  const isAudioPlaying = isPlaying || isSpotifyActive;

  return (
    <div
      className={`navbar__item ${className || ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        margin: '0 2px',
        padding: 0,
      }}
    >
      <button
        type="button"
        onClick={togglePlayer}
        aria-label="Toggle Focus Music & Pomodoro Player"
        aria-expanded={isPlayerOpen}
        title={
          isPomodoroActive
            ? `Pomodoro ${isFocus ? 'Focus' : 'Break'}: ${formatTime(pomodoro.timeLeft)}${
                isAudioPlaying
                  ? ` • Playing: ${isSpotifyActive ? currentSpotifyPlaylist?.title || 'Spotify' : currentTrack?.title || ''}`
                  : ''
              }`
            : isSpotifyActive
            ? `Now Playing (Spotify): ${currentSpotifyPlaylist?.title || 'Spotify Playlist'}`
            : isPlaying
            ? `Now Playing: ${currentTrack?.title || 'Focus Music'}`
            : 'Focus Music & Pomodoro'
        }
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          height: '34px',
          padding: isPomodoroActive ? '0 10px 0 8px' : '0 8px',
          borderRadius: '8px',
          cursor: 'pointer',
          background: isPomodoroActive
            ? isFocus
              ? 'rgba(239, 68, 68, 0.12)'
              : 'rgba(245, 158, 11, 0.12)'
            : isAudioPlaying
            ? 'var(--sidebar-active-bg, rgba(16, 185, 129, 0.12))'
            : 'transparent',
          border: isPomodoroActive
            ? isFocus
              ? '1px solid #ef4444'
              : '1px solid #f59e0b'
            : isAudioPlaying
            ? '1px solid var(--brand-green, #10b981)'
            : '1px solid transparent',
          color: isPomodoroActive
            ? isFocus
              ? '#ef4444'
              : '#f59e0b'
            : isAudioPlaying
            ? 'var(--brand-green, #10b981)'
            : 'var(--ifm-navbar-link-color, currentColor)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none',
        }}
      >
        {/* Headphones SVG Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>

        {/* Dynamic Equalizer soundwave */}
        {isAudioPlaying && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              height: '12px',
            }}
          >
            <span
              style={{
                width: '2px',
                height: '6px',
                background: 'currentColor',
                borderRadius: '1px',
                animation: 'soundWave 1.2s ease-in-out infinite 0.1s',
              }}
            />
            <span
              style={{
                width: '2px',
                height: '11px',
                background: 'currentColor',
                borderRadius: '1px',
                animation: 'soundWave 1.2s ease-in-out infinite 0.3s',
              }}
            />
            <span
              style={{
                width: '2px',
                height: '5px',
                background: 'currentColor',
                borderRadius: '1px',
                animation: 'soundWave 1.2s ease-in-out infinite 0.2s',
              }}
            />
          </div>
        )}

        {/* Live Pomodoro Countdown in Navbar */}
        {isPomodoroActive && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 800,
              fontSize: '0.78rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            <span>{isFocus ? '🍅' : '☕'}</span>
            <span>{formatTime(pomodoro.timeLeft)}</span>
          </div>
        )}
      </button>
    </div>
  );
}
