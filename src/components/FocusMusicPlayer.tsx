import React, { useState, useEffect, useRef } from 'react';
import { useFocusMusic, getSpotifyVideoId } from '../context/FocusMusicContext';
import { useUserProgress } from '../context/UserProgressContext';
import { triggerFireworks } from '../utils/fireworks';
import {
  MusicCategory,
  MusicTrack,
  SpotifyPlaylist,
  MusicSource,
} from '../types/focusMusic';

const CATEGORY_TABS: { id: 'all' | 'favorites' | MusicCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🎧' },
  { id: 'favorites', label: 'My Favorites', icon: '⭐' },
  { id: 'study', label: 'Study With Me', icon: '☕' },
  { id: 'pomodoro', label: 'Pomodoro', icon: '🍅' },
  { id: 'relax', label: 'Relaxing', icon: '🌧️' },
  { id: 'ambient', label: 'Ambient & Piano', icon: '🌿' },
  { id: 'synthwave', label: 'Coding Beats', icon: '🚀' },
];

function getCategoryBadgeStyle(item: {
  category?: MusicCategory;
  isFavorite?: boolean;
  isCustom?: boolean;
}): { bg: string; border: string; text: string } {
  if (item.isFavorite || item.isCustom) {
    return { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' };
  }
  switch (item.category) {
    case 'study':
      return { bg: '#dcfce7', border: '#86efac', text: '#166534' };
    case 'pomodoro':
      return { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' };
    case 'relax':
      return { bg: '#e0e7ff', border: '#c7d2fe', text: '#3730a3' };
    case 'ambient':
      return { bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8' };
    case 'synthwave':
      return { bg: '#fce7f3', border: '#fbcfe8', text: '#9d174d' };
    default:
      return { bg: '#F2F2F2', border: '#98A2B3', text: '#1e293b' };
  }
}

// Novatorem-style Audio Spectrum Visualizer Bar Configurations (synced to rhythm curve & theme pulse)
const NOVATOREM_BAR_COUNT = 36;
const NOVATOREM_BARS = Array.from({ length: NOVATOREM_BAR_COUNT }, (_, i) => {
  const x = i / (NOVATOREM_BAR_COUNT - 1);
  const bell = Math.sin(x * Math.PI);
  const variance = 0.8 + ((i * 7) % 5) * 0.08;
  const maxHeight = Math.round(18 + (60 * bell * variance));
  const pulseDur = Math.round(600 + ((i * 13) % 7) * 90);
  const pulseDelay = Math.round((i / NOVATOREM_BAR_COUNT) * 450);
  const waveDelay = Math.round(((i / NOVATOREM_BAR_COUNT) * 12000));
  return { id: i, maxHeight: Math.min(78, Math.max(18, maxHeight)), pulseDur, pulseDelay, waveDelay };
});

const MINI_NOVATOREM_BAR_COUNT = 20;
const MINI_NOVATOREM_BARS = Array.from({ length: MINI_NOVATOREM_BAR_COUNT }, (_, i) => {
  const x = i / (MINI_NOVATOREM_BAR_COUNT - 1);
  const bell = Math.sin(x * Math.PI);
  const variance = 0.8 + ((i * 5) % 4) * 0.1;
  const maxHeight = Math.round(10 + (28 * bell * variance));
  const pulseDur = Math.round(550 + ((i * 11) % 6) * 80);
  const pulseDelay = Math.round((i / MINI_NOVATOREM_BAR_COUNT) * 350);
  const waveDelay = Math.round(((i / MINI_NOVATOREM_BAR_COUNT) * 10000));
  return { id: i, maxHeight: Math.min(38, Math.max(10, maxHeight)), pulseDur, pulseDelay, waveDelay };
});

export default function FocusMusicPlayer(): React.JSX.Element | null {
  const { currentUser } = useUserProgress();
  const {
    musicSource,
    setMusicSource,
    tracks,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    isPlayerOpen,
    volume,
    isMuted,
    pomodoro,
    togglePlay,
    nextTrack,
    prevTrack,
    selectTrack,
    setVolume,
    toggleMute,
    openPlayer,
    closePlayer,
    addCustomTrack,
    removeCustomTrack,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    setPomodoroTimes,
    spotifyPlaylists,
    currentSpotifyIndex,
    currentSpotifyPlaylist,
    selectSpotifyPlaylist,
    addCustomSpotifyPlaylist,
    removeCustomSpotifyPlaylist,
    trackError,
    isMiniPlayerOpen,
    setIsMiniPlayerOpen,
    isSpotifyPlaying,
    toggleSpotifyPlay,
  } = useFocusMusic();

  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | MusicCategory>('all');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Custom Spotify playlist state
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [spotifyTitle, setSpotifyTitle] = useState('');
  const [spotifyAddError, setSpotifyAddError] = useState<string | null>(null);
  const [showSpotifyAddForm, setShowSpotifyAddForm] = useState(false);

  const [showPomodoroCard, setShowPomodoroCard] = useState(true);
  const isPomodoroEngaged = pomodoro.isRunning || (pomodoro.timeLeft < pomodoro.focusMinutes * 60) || pomodoro.sessionsCompleted > 0;

  const modalRef = useRef<HTMLDivElement>(null);
  const miniPlayerRef = useRef<HTMLDivElement>(null);
  const roundBtnRef = useRef<HTMLButtonElement>(null);

  // Close / collapse on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPlayerOpen) {
          closePlayer();
          setIsMiniPlayerOpen(true);
        } else if (isMiniPlayerOpen) {
          setIsMiniPlayerOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerOpen, isMiniPlayerOpen, closePlayer]);

  // Click outside player to collapse or close
  useEffect(() => {
    if (!isPlayerOpen && !isMiniPlayerOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        miniPlayerRef.current &&
        !miniPlayerRef.current.contains(target) &&
        roundBtnRef.current &&
        !roundBtnRef.current.contains(target)
      ) {
        if (isPlayerOpen) {
          closePlayer();
          setIsMiniPlayerOpen(true);
        } else if (isMiniPlayerOpen) {
          setIsMiniPlayerOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isPlayerOpen, isMiniPlayerOpen, closePlayer]);

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!customUrl.trim()) {
      setAddError('Please enter a YouTube video URL or ID');
      return;
    }

    const success = addCustomTrack(customUrl, customTitle);
    if (success) {
      setCustomUrl('');
      setCustomTitle('');
      setShowAddForm(false);
    } else {
      setAddError('Invalid YouTube URL or Video ID. Example: https://www.youtube.com/watch?v=nZtFlrwCbs4');
    }
  };

  const handleAddSpotifyPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    setSpotifyAddError(null);
    if (!spotifyUrl.trim()) {
      setSpotifyAddError('Please enter a Spotify playlist link or URI');
      return;
    }

    const success = addCustomSpotifyPlaylist(spotifyUrl, spotifyTitle);
    if (success) {
      setSpotifyUrl('');
      setSpotifyTitle('');
      setShowSpotifyAddForm(false);
    } else {
      setSpotifyAddError(
        'Invalid Spotify Playlist link. Example: https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ'
      );
    }
  };

  const filteredTracks = tracks.filter((t) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'favorites') return t.isFavorite || t.isCustom;
    return t.category === activeTab;
  });

  const filteredSpotifyPlaylists = spotifyPlaylists.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'favorites') return p.isCustom;
    return p.category === activeTab;
  });

  const formatPomodoroTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pomodoro Toast Banner State
  const [pomodoroToast, setPomodoroToast] = useState<{
    title: string;
    subtext: string;
    icon: string;
  } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const triggerPomodoroToast = (title: string, subtext: string, icon: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setPomodoroToast({ title, subtext, icon });
    toastTimeoutRef.current = setTimeout(() => {
      setPomodoroToast(null);
    }, 4500);
  };

  // Track session completion and mode transitions
  const prevSessionsRef = useRef<number>(pomodoro.sessionsCompleted);
  const prevModeRef = useRef<string>(pomodoro.mode);
  const prevRunningRef = useRef<boolean>(pomodoro.isRunning);
  const documentTitleOriginalRef = useRef<string | null>(null);

  useEffect(() => {
    // When Pomodoro just started
    if (pomodoro.isRunning && !prevRunningRef.current) {
      triggerPomodoroToast(
        pomodoro.mode === 'focus' ? 'Focus Session Started' : 'Break Time Started',
        pomodoro.mode === 'focus'
          ? `Deep work mode activated for ${pomodoro.focusMinutes} minutes. Stay in the zone!`
          : `Rest session started for ${pomodoro.breakMinutes} minutes. Hydrate and stretch!`,
        pomodoro.mode === 'focus' ? '🍅' : '☕'
      );
    }

    // When Pomodoro finished a session
    if (pomodoro.sessionsCompleted > prevSessionsRef.current) {
      triggerFireworks();
      triggerPomodoroToast(
        'Focus Session Completed! 🎉',
        `Outstanding focus! You finished Pomodoro cycle #${pomodoro.sessionsCompleted}. Enjoy your break.`,
        '🏆'
      );
    } else if (prevModeRef.current === 'break' && pomodoro.mode === 'focus' && pomodoro.isRunning) {
      triggerPomodoroToast(
        'Break Finished — Back to Work! 🚀',
        'Re-focusing now. Time to tackle your next milestone.',
        '⚡'
      );
    }

    prevSessionsRef.current = pomodoro.sessionsCompleted;
    prevModeRef.current = pomodoro.mode;
    prevRunningRef.current = pomodoro.isRunning;
  }, [pomodoro.sessionsCompleted, pomodoro.mode, pomodoro.isRunning, pomodoro.focusMinutes, pomodoro.breakMinutes]);

  // Synchronize Pomodoro countdown to document title across routes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const currentTitle = document.title || 'Engineering Knowledge Base';
    const cleanBaseTitle = currentTitle
      .replace(/^\([0-9:]+\)\s+[🍅☕]\s+[A-Za-z]+\s+[•|]\s+/, '')
      .trim();

    if (!pomodoro.isRunning) {
      document.title = cleanBaseTitle || 'Engineering Knowledge Base';
      return;
    }

    const timeStr = formatPomodoroTime(pomodoro.timeLeft);
    const modeEmoji = pomodoro.mode === 'focus' ? '🍅' : '☕';
    const modeLabel = pomodoro.mode === 'focus' ? 'Focus' : 'Break';

    document.title = `(${timeStr}) ${modeEmoji} ${modeLabel} • ${cleanBaseTitle || 'Engineering Knowledge Base'}`;
  }, [pomodoro.isRunning, pomodoro.timeLeft, pomodoro.mode]);

  return (
    <>
      <style>{`
        @keyframes soundWave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .focus-equalizer-bar {
          width: 3px;
          border-radius: 2px;
          background: var(--gradient-brand, linear-gradient(180deg, var(--brand-green-mid, #86efac) 0%, var(--brand-green, #10b981) 100%));
          box-shadow: 0 0 6px var(--neon-glow-color, rgba(16, 185, 129, 0.3));
          animation: soundWave 1.2s ease-in-out infinite;
        }
        .focus-equalizer-bar:nth-child(1) { animation-delay: 0.1s; height: 6px; }
        .focus-equalizer-bar:nth-child(2) { animation-delay: 0.3s; height: 14px; }
        .focus-equalizer-bar:nth-child(3) { animation-delay: 0.2s; height: 10px; }
        .focus-equalizer-bar:nth-child(4) { animation-delay: 0.4s; height: 16px; }

        /* Novatorem Theme-Synced Spectrum Visualizer Animations */
        @keyframes novatoremColorWave {
          0%, 100% {
            background-color: var(--brand-green, #10b981);
            box-shadow: 0 0 6px var(--neon-glow-color, rgba(16, 185, 129, 0.3));
            filter: brightness(1);
          }
          50% {
            background-color: var(--brand-green-mid, #86efac);
            box-shadow: 0 0 12px var(--neon-glow-color, rgba(16, 185, 129, 0.5));
            filter: brightness(1.22);
          }
        }

        @keyframes novatoremPulse {
          0%, 100% {
            height: 4px;
            opacity: 0.7;
          }
          50% {
            height: var(--pulse-max-height, 48px);
            opacity: 1;
          }
        }

        @keyframes novatoremDotBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.75); }
        }

        .novatorem-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--brand-green, #10b981);
          box-shadow: 0 0 8px var(--neon-glow-color, var(--brand-green, #10b981));
          animation: novatoremDotBlink 1.2s ease-in-out infinite;
          display: inline-block;
        }

        .novatorem-bar {
          flex: 1;
          max-width: 5px;
          min-width: 2.5px;
          margin: 0 1.5px;
          border-radius: 3px 3px 0 0;
          background: var(--gradient-brand, linear-gradient(180deg, var(--brand-green-mid, #86efac) 0%, var(--brand-green, #10b981) 100%));
          background-color: var(--brand-green, #10b981);
          transform-origin: bottom;
          transition: height 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 0 4px var(--neon-glow-color, rgba(16, 185, 129, 0.25));
        }

        .novatorem-bar.is-playing {
          animation-name: novatoremPulse, novatoremColorWave;
          animation-timing-function: ease-in-out, linear;
          animation-iteration-count: infinite, infinite;
        }

        .novatorem-visualizer-box {
          height: 84px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 6px 10px;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        [data-theme="light"] .novatorem-visualizer-box {
          background: #F2F2F2;
          border: 1px solid #D9D9D9;
        }
        [data-theme="dark"] .novatorem-visualizer-box {
          background: #090d16;
          border: 1px solid #1e293b;
        }

        .novatorem-mini-bar {
          flex: 1;
          max-width: 3.5px;
          min-width: 2px;
          margin: 0 1px;
          border-radius: 2px 2px 0 0;
          background: var(--gradient-brand, linear-gradient(180deg, var(--brand-green-mid, #86efac) 0%, var(--brand-green, #10b981) 100%));
          background-color: var(--brand-green, #10b981);
          transform-origin: bottom;
          transition: height 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 0 3px var(--neon-glow-color, rgba(16, 185, 129, 0.2));
        }
        .novatorem-mini-bar.is-playing {
          animation-name: novatoremPulse, novatoremColorWave;
          animation-timing-function: ease-in-out, linear;
          animation-iteration-count: infinite, infinite;
        }

        .focus-music-btn {
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          outline: none;
        }
        .focus-music-btn:hover {
          transform: translateY(-1px);
        }

        /* Explicit Light & Dark Theme Overrides for Buttons */
        [data-theme="light"] .focus-music-btn {
          background: #ffffff !important;
          border: 1px solid #D9D9D9 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .focus-music-btn:hover {
          border-color: var(--brand-green, #10b981) !important;
          background: #F7FDF9 !important;
        }
        [data-theme="dark"] .focus-music-btn {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
        }
        [data-theme="dark"] .focus-music-btn:hover {
          border-color: var(--brand-green, #10b981) !important;
          background: #334155 !important;
        }

        /* Category Filter Tabs Scrollable Row */
        .focus-category-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 4px 2px 8px 2px;
          flex-shrink: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .focus-category-scroll::-webkit-scrollbar {
          display: none;
        }

        .focus-category-tab {
          flex-shrink: 0;
          height: 32px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          border-radius: 20px;
          font-size: 0.76rem;
          font-weight: 500;
          line-height: 1;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          outline: none;
          box-sizing: border-box;
        }
        .focus-category-tab.active {
          background: var(--gradient-brand, var(--brand-green, #10b981)) !important;
          border: 1px solid var(--brand-green, #10b981) !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          box-shadow: 0 2px 8px var(--neon-glow-color, rgba(16, 185, 129, 0.35)) !important;
        }
        [data-theme="light"] .focus-category-tab:not(.active) {
          background: #F2F2F2 !important;
          border: 1px solid #98A2B3 !important;
          color: #1e293b !important;
        }
        [data-theme="light"] .focus-category-tab:not(.active):hover {
          background: #e2e8f0 !important;
          color: #0f172a !important;
          border-color: #64748b !important;
        }
        [data-theme="dark"] .focus-category-tab:not(.active) {
          background: #1e293b !important;
          border: 1px solid #475569 !important;
          color: #e2e8f0 !important;
        }
        [data-theme="dark"] .focus-category-tab:not(.active):hover {
          background: #334155 !important;
          color: #ffffff !important;
          border-color: #94a3b8 !important;
        }

        [data-theme="light"] .focus-modal-surface {
          background: #F7FDF9 !important;
          border: 1px solid #D9D9D9 !important;
          color: #0f172a !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12) !important;
        }
        [data-theme="dark"] .focus-modal-surface {
          background: #0f172a !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
        }

        [data-theme="light"] .focus-subcard {
          background: #F2F2F2 !important;
          border: 1px solid #D9D9D9 !important;
        }
        [data-theme="dark"] .focus-subcard {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
        }

        .focus-input {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          outline: none;
          box-sizing: border-box;
          width: 100%;
        }
        [data-theme="light"] .focus-input {
          background: #ffffff !important;
          border: 1px solid #D9D9D9 !important;
          color: #0f172a !important;
        }
        [data-theme="dark"] .focus-input {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
        }

        .focus-track-item {
          transition: all 0.15s ease;
          border-radius: 8px;
        }
        .focus-track-item:hover {
          background: rgba(16, 185, 129, 0.08) !important;
        }

        @media (max-width: 640px) {
          .focus-music-drawer {
            width: 95vw !important;
            max-width: 95vw !important;
            right: 2.5vw !important;
            bottom: 12px !important;
            max-height: 88vh !important;
          }
        }

        /* Round floating button on bottom-right directly under scroll progress button */
        .focus-round-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          height: 52px;
          border-radius: 50%;
          z-index: 99998;
          display: flex;
          align-items: center;
          justifyContent: center;
          cursor: pointer;
          padding: 0;
          margin: 0;
          outline: none;
          touch-action: manipulation;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
        }
        .focus-round-btn:not(.pomodoro-active):not(.pomodoro-break) {
          width: 52px;
        }
        .focus-round-btn.pomodoro-active,
        .focus-round-btn.pomodoro-break {
          border-radius: 26px;
          padding: 0 12px 0 8px;
          gap: 6px;
        }
        .focus-round-btn:hover {
          transform: translateY(-2px) scale(1.03);
        }
        .focus-round-btn:active {
          transform: translateY(0) scale(0.97);
        }
        .focus-round-btn .pomodoro-quick-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justifyContent: center;
          border: none;
          cursor: pointer;
          padding: 0;
          font-size: 0.72rem;
          font-weight: 900;
          transition: transform 0.15s ease, background-color 0.15s ease;
        }
        .focus-round-btn .pomodoro-quick-btn:hover {
          transform: scale(1.15);
        }
        .focus-round-btn .pomodoro-quick-btn:active {
          transform: scale(0.92);
        }

        [data-theme="light"] .focus-round-btn {
          background: rgba(255, 255, 255, 0.96);
          border: 2px solid var(--brand-green, #10b981);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 0 10px var(--neon-glow-color, rgba(16, 185, 129, 0.25));
          color: #0f172a;
        }
        [data-theme="light"] .focus-round-btn.pomodoro-active {
          border-color: #ef4444;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2), 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        [data-theme="light"] .focus-round-btn.pomodoro-break {
          border-color: #f59e0b;
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.2), 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        [data-theme="light"] .focus-round-btn .pomodoro-quick-btn {
          background-color: rgba(239, 68, 68, 0.12);
          color: #b91c1c;
        }
        [data-theme="light"] .focus-round-btn.pomodoro-break .pomodoro-quick-btn {
          background-color: rgba(245, 158, 11, 0.14);
          color: #b45309;
        }

        [data-theme="dark"] .focus-round-btn {
          background: rgba(15, 23, 42, 0.94);
          border: 2px solid var(--brand-green, #10b981);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 10px var(--neon-glow-color, rgba(16, 185, 129, 0.3));
          color: #f8fafc;
        }
        [data-theme="dark"] .focus-round-btn.pomodoro-active {
          border-color: #ef4444;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.6), 0 0 16px rgba(239, 68, 68, 0.35);
        }
        [data-theme="dark"] .focus-round-btn.pomodoro-break {
          border-color: #f59e0b;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.6), 0 0 16px rgba(245, 158, 11, 0.35);
        }
        [data-theme="dark"] .focus-round-btn .pomodoro-quick-btn {
          background-color: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }
        [data-theme="dark"] .focus-round-btn.pomodoro-break .pomodoro-quick-btn {
          background-color: rgba(245, 158, 11, 0.2);
          color: #fcd34d;
        }

        [data-theme="light"] .focus-round-btn.is-playing:not(.pomodoro-active):not(.pomodoro-break) {
          border: 2.5px solid var(--brand-green, #10b981);
          box-shadow: 0 6px 22px rgba(16, 185, 129, 0.35), 0 0 16px var(--neon-glow-color, rgba(16, 185, 129, 0.4));
        }
        [data-theme="dark"] .focus-round-btn.is-playing:not(.pomodoro-active):not(.pomodoro-break) {
          border: 2.5px solid var(--brand-green, #10b981);
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.45), 0 0 18px var(--neon-glow-color, rgba(16, 185, 129, 0.5));
        }
        [data-theme="light"] .focus-round-btn.is-playing.is-spotify:not(.pomodoro-active):not(.pomodoro-break) {
          border: 2.5px solid var(--brand-green, #10b981);
          box-shadow: 0 6px 22px var(--neon-glow-color, rgba(16, 185, 129, 0.35)), 0 0 16px var(--neon-glow-color, rgba(16, 185, 129, 0.4));
        }
        [data-theme="dark"] .focus-round-btn.is-playing.is-spotify:not(.pomodoro-active):not(.pomodoro-break) {
          border: 2.5px solid var(--brand-green, #10b981);
          box-shadow: 0 6px 24px var(--neon-glow-color, rgba(16, 185, 129, 0.45)), 0 0 18px var(--neon-glow-color, rgba(16, 185, 129, 0.5));
        }

        /* Top Pomodoro Banner Toast */
        @keyframes pomodoroToastSlideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        .pomodoro-floating-toast {
          position: fixed;
          top: 72px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999999;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 18px;
          border-radius: 12px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          animation: pomodoroToastSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: auto;
        }
        [data-theme="light"] .pomodoro-floating-toast {
          background: #ffffff;
          border: 1.5px solid #fca5a5;
          box-shadow: 0 12px 32px rgba(239, 68, 68, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06);
          color: #0f172a;
        }
        [data-theme="dark"] .pomodoro-floating-toast {
          background: rgba(15, 23, 42, 0.96);
          border: 1.5px solid #ef4444;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7), 0 0 16px rgba(239, 68, 68, 0.35);
          color: #f8fafc;
        }

        /* Backdrop overlay for expanded modal */
        .focus-player-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 999990;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.22s ease;
        }
        .focus-player-backdrop.is-active {
          opacity: 1;
          pointer-events: auto;
        }

        /* Unified Persistent Player (Morphs between Compact Reading Mode and Full Expanded Modal) */
        .focus-unified-player {
          position: fixed;
          z-index: 999995;
          border-radius: 16px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.22s ease;
        }

        /* Compact Reading Mode (docked at bottom-right directly above round button) */
        .focus-unified-player.mode-compact {
          bottom: 86px;
          right: 24px;
          top: auto;
          left: auto;
          width: 340px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 110px);
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0) scale(1);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18);
        }

        /* Expanded Full Player Mode (centered dialog modal) */
        .focus-unified-player.mode-expanded {
          top: 50%;
          left: 50%;
          bottom: auto;
          right: auto;
          transform: translate(-50%, -50%) scale(1);
          width: 480px;
          max-width: 96vw;
          max-height: 90vh;
          opacity: 1;
          pointer-events: auto;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
        }

        /* Minimized Mode (reading doc with round button only) */
        .focus-unified-player.mode-minimized {
          bottom: 86px;
          right: 24px;
          top: auto;
          left: auto;
          width: 340px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 110px);
          opacity: 0;
          pointer-events: none;
          transform: translateY(16px) scale(0.96);
          box-shadow: none !important;
        }

        @media (max-width: 640px) {
          .focus-unified-player.mode-expanded {
            top: auto;
            left: 2.5vw;
            right: 2.5vw;
            bottom: 12px;
            transform: none;
            width: 95vw;
            max-width: 95vw;
            max-height: 88vh;
          }
        }

        /* Compact Player Popover surface tokens */
        .focus-compact-popover {
          border-radius: 16px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        [data-theme="light"] .focus-compact-popover {
          background: rgba(247, 253, 249, 0.98);
          border: 1px solid #D9D9D9;
          color: #0f172a;
        }
        [data-theme="dark"] .focus-compact-popover {
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid #334155;
          color: #f8fafc;
        }
      `}</style>

      {/* Top Pomodoro Banner Toast */}
      {pomodoroToast && (
        <div className="pomodoro-floating-toast" role="alert">
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{pomodoroToast.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.86rem', lineHeight: 1.2 }}>
              {pomodoroToast.title}
            </div>
            <div style={{ fontSize: '0.74rem', opacity: 0.85, marginTop: '2px', lineHeight: 1.2 }}>
              {pomodoroToast.subtext}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPomodoroToast(null)}
            aria-label="Close notification"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              opacity: 0.65,
              padding: '2px 4px',
              fontSize: '0.9rem',
              marginLeft: '4px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Music & Pomodoro Companion Widget on Bottom-Right */}
      {!isPlayerOpen && (
        <div
          ref={roundBtnRef as any}
          className={`focus-round-btn${isPomodoroEngaged ? (pomodoro.mode === 'focus' ? ' pomodoro-active' : ' pomodoro-break') : ''}${isPlaying || (musicSource === 'spotify' && isSpotifyPlaying) ? ' is-playing' : ''}${musicSource === 'spotify' && isSpotifyPlaying ? ' is-spotify' : ''}`}
          onClick={() => setIsMiniPlayerOpen((prev) => !prev)}
          title={
            isPomodoroEngaged
              ? `Pomodoro ${pomodoro.mode === 'focus' ? 'Focus' : 'Break'}${pomodoro.isRunning ? '' : ' (Paused)'}: ${formatPomodoroTime(pomodoro.timeLeft)} — Click to toggle player`
              : musicSource === 'spotify' && isSpotifyPlaying
              ? `Playing (Spotify): ${currentSpotifyPlaylist?.title || 'Spotify Playlist'} — Click to open player`
              : isPlaying
              ? `Playing: ${currentTrack?.title || 'Focus Music'} — Click to open player`
              : 'Study With Me — Focus Music & Pomodoro'
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsMiniPlayerOpen((prev) => !prev);
            }
          }}
          aria-label={
            isPomodoroEngaged
              ? `Pomodoro ${pomodoro.mode === 'focus' ? 'Focus' : 'Break'} active. Time left: ${formatPomodoroTime(pomodoro.timeLeft)}`
              : musicSource === 'spotify' && isSpotifyPlaying
              ? `Spotify playing: ${currentSpotifyPlaylist?.title || 'Spotify Playlist'}. Click to toggle player`
              : isPlaying
              ? 'Focus Music playing. Click to toggle player'
              : 'Focus Music player. Click to toggle player'
          }
        >
          {/* Animated soundwaves or headphone icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: isPomodoroEngaged ? '28px' : '100%',
              height: isPomodoroEngaged ? '28px' : '100%',
              flexShrink: 0,
            }}
          >
            {isPlaying || (musicSource === 'spotify' && isSpotifyPlaying) ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '2px',
                  height: '20px',
                  paddingBottom: '2px',
                }}
              >
                {[12, 18, 14, 20, 15].map((h, idx) => (
                  <div
                    key={idx}
                    className="novatorem-bar is-playing"
                    style={{
                      width: '2.5px',
                      height: '3px',
                      '--pulse-max-height': `${h}px`,
                      animationDuration: `${550 + idx * 80}ms, 8000ms`,
                      animationDelay: `-${idx * 90}ms, -${idx * 1600}ms`,
                      ...(musicSource === 'spotify' && isSpotifyPlaying
                        ? {
                            background: 'var(--gradient-brand, linear-gradient(180deg, var(--brand-green, #10b981) 0%, var(--brand-green-mid, #86efac) 100%))',
                            boxShadow: '0 0 6px var(--neon-glow-color, rgba(16, 185, 129, 0.6))',
                          }
                        : {}),
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            ) : (
              <svg
                width={isPomodoroEngaged ? "18" : "22"}
                height={isPomodoroEngaged ? "18" : "22"}
                viewBox="0 0 24 24"
                fill="none"
                stroke={isPomodoroEngaged ? (pomodoro.mode === 'focus' ? '#ef4444' : '#f59e0b') : 'var(--brand-green, #10b981)'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            )}
          </div>

          {/* Pomodoro Expanded Countdown & Quick Controls */}
          {isPomodoroEngaged && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingLeft: '2px',
                paddingRight: '2px',
              }}
            >
              {/* Vertical divider */}
              <div
                style={{
                  width: '1px',
                  height: '22px',
                  backgroundColor: 'rgba(150, 150, 150, 0.25)',
                }}
              />

              {/* Countdown Digits & Mode */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: '70px', textAlign: 'left' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontWeight: 900,
                    fontSize: '0.96rem',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    color: pomodoro.mode === 'focus' ? '#ef4444' : '#f59e0b',
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{pomodoro.mode === 'focus' ? '🍅' : '☕'}</span>
                  <span>{formatPomodoroTime(pomodoro.timeLeft)}</span>
                </div>
                <div
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--ifm-color-content-secondary, #64748b)',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    lineHeight: 1,
                  }}
                >
                  <span>{pomodoro.isRunning ? (pomodoro.mode === 'focus' ? 'Focus' : 'Break') : 'Paused'}</span>
                  {pomodoro.sessionsCompleted > 0 && (
                    <span>• #{pomodoro.sessionsCompleted}</span>
                  )}
                </div>
              </div>

              {/* Quick Pause / Play Button */}
              <button
                type="button"
                className="pomodoro-quick-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (pomodoro.isRunning) {
                    pausePomodoro();
                  } else {
                    startPomodoro();
                  }
                }}
                title={pomodoro.isRunning ? 'Pause Pomodoro' : 'Resume Pomodoro'}
                aria-label={pomodoro.isRunning ? 'Pause Pomodoro' : 'Resume Pomodoro'}
              >
                {pomodoro.isRunning ? '⏸' : '▶'}
              </button>
            </div>
          )}

          {/* Linear countdown progress underline */}
          {isPomodoroEngaged && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '12px',
                right: '12px',
                height: '3px',
                borderRadius: '3px',
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, 100 - (pomodoro.timeLeft / ((pomodoro.mode === 'focus' ? pomodoro.focusMinutes : pomodoro.breakMinutes) * 60)) * 100))}%`,
                  backgroundColor: pomodoro.mode === 'focus' ? '#ef4444' : '#f59e0b',
                  transition: 'width 1s linear',
                  borderRadius: '3px',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Backdrop overlay for expanded modal */}
      <div
        className={`focus-player-backdrop${isPlayerOpen ? ' is-active' : ''}`}
        onClick={() => {
          closePlayer();
          setIsMiniPlayerOpen(true);
        }}
        aria-hidden="true"
      />

      {/* Unified Persistent Player (Morphs between Compact Reading Mode and Full Expanded Modal) */}
      <div
        ref={miniPlayerRef}
        className={`focus-modal-surface focus-music-drawer focus-compact-popover focus-unified-player ${
          isPlayerOpen ? 'mode-expanded' : isMiniPlayerOpen ? 'mode-compact' : 'mode-minimized'
        }`}
        role="dialog"
        aria-label={isPlayerOpen ? 'Focus Music & Study Beats' : 'Study With Me Player'}
        aria-modal={isPlayerOpen}
      >
        {/* Header */}
        {isPlayerOpen ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--sidebar-border, #D9D9D9)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Focus Music & Study Beats</h3>
                <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.75 }}>
                  Lofi, Pomodoro & relaxing sounds for deep work
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Collapse to Compact Reading Mode Button */}
              <button
                type="button"
                onClick={() => {
                  closePlayer();
                  setIsMiniPlayerOpen(true);
                }}
                aria-label="Collapse to compact player"
                title="Collapse to compact player for reading docs"
                className="focus-music-btn"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>

              {/* Close to Background Button */}
              <button
                type="button"
                onClick={() => {
                  closePlayer();
                  setIsMiniPlayerOpen(false);
                }}
                aria-label="Close Focus Music Player"
                title="Close to background (music keeps playing)"
                className="focus-music-btn"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px 10px 14px',
              borderBottom: '1px solid var(--sidebar-border, #D9D9D9)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>🎧</span>
              <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--ifm-color-content, #0f172a)' }}>
                Study With Me
              </span>
              {pomodoro.isRunning && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                    color: '#991b1b',
                    fontWeight: 600,
                  }}
                >
                  🍅 {formatPomodoroTime(pomodoro.timeLeft)}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Expand to Full Player Button */}
              <button
                type="button"
                onClick={() => {
                  setIsMiniPlayerOpen(false);
                  openPlayer();
                }}
                aria-label="Expand full player"
                title="Expand full player"
                className="focus-music-btn"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>

              {/* Close Popover */}
              <button
                type="button"
                onClick={() => setIsMiniPlayerOpen(false)}
                aria-label="Close compact player"
                title="Minimize to background (music keeps playing)"
                className="focus-music-btn"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Player Body */}
        <div
          style={{
            overflowY: 'auto',
            padding: isPlayerOpen ? '16px 20px' : '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: isPlayerOpen ? '14px' : '10px',
            flex: 1,
          }}
        >
          {/* Pomodoro Focus Mode Card - Top of Music Player */}
          <div
            className="focus-subcard"
            style={{
              padding: isPlayerOpen ? '12px 14px' : '10px 12px',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setShowPomodoroCard(!showPomodoroCard)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem' }}>🍅</span>
                <span style={{ fontSize: isPlayerOpen ? '0.82rem' : '0.78rem', fontWeight: 700 }}>
                  Pomodoro Focus Mode ({pomodoro.mode === 'focus' ? `${pomodoro.focusMinutes}m Focus` : `${pomodoro.breakMinutes}m Break`})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: isPlayerOpen ? '0.9rem' : '0.84rem',
                    color: pomodoro.mode === 'focus' ? '#166534' : '#92400e',
                  }}
                >
                  {formatPomodoroTime(pomodoro.timeLeft)}
                </span>
                <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>
                  {showPomodoroCard ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Progress Track */}
            <div
              style={{
                width: '100%',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, (((pomodoro.mode === 'focus' ? pomodoro.focusMinutes : pomodoro.breakMinutes) * 60 - pomodoro.timeLeft) / ((pomodoro.mode === 'focus' ? pomodoro.focusMinutes : pomodoro.breakMinutes) * 60 || 1)) * 100))}%`,
                  height: '100%',
                  backgroundColor: pomodoro.mode === 'focus' ? '#ef4444' : '#f59e0b',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {showPomodoroCard && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                {/* Preset selectors and cycle counter */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                    <span style={{ opacity: 0.7 }}>Rhythm:</span>
                    {[
                      { label: '25/5', f: 25, b: 5 },
                      { label: '50/10', f: 50, b: 10 },
                      { label: '15/3', f: 15, b: 3 },
                    ].map((preset) => {
                      const isCur = pomodoro.focusMinutes === preset.f && pomodoro.breakMinutes === preset.b;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setPomodoroTimes(preset.f, preset.b)}
                          className="focus-music-btn"
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '5px',
                            fontWeight: isCur ? 700 : 500,
                            border: isCur ? '1px solid var(--brand-green, #10b981)' : undefined,
                            backgroundColor: isCur ? 'rgba(16, 185, 129, 0.12)' : undefined,
                            color: isCur ? 'var(--brand-green, #10b981)' : undefined,
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: '0.72rem', opacity: 0.75 }}>
                    Completed: <strong>{pomodoro.sessionsCompleted}</strong> cycles
                  </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={pomodoro.isRunning ? pausePomodoro : startPomodoro}
                    className="focus-music-btn"
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: '6px',
                    }}
                  >
                    {pomodoro.isRunning ? '⏸ Pause' : '▶ Start Timer'}
                  </button>
                  <button
                    type="button"
                    onClick={resetPomodoro}
                    className="focus-music-btn"
                    style={{
                      fontSize: '0.72rem',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      opacity: 0.8,
                    }}
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Source Switcher (YouTube vs Spotify Playlists) - Positioned directly under Pomodoro */}
          <div
            className="focus-platform-tabs"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '3px',
              borderRadius: '10px',
              backgroundColor: 'var(--ifm-color-emphasis-100, #F2F2F2)',
              border: '1px solid var(--sidebar-border, #D9D9D9)',
              gap: '4px',
              flexShrink: 0,
            }}
          >
            {/* YouTube Stream Tab */}
            <button
              type="button"
              onClick={() => setMusicSource('youtube')}
              aria-label="Switch to YouTube streams"
              style={{
                flex: 1,
                padding: isPlayerOpen ? '8px 12px' : '5px 8px',
                border: musicSource === 'youtube'
                  ? '1px solid var(--brand-green, #10b981)'
                  : '1px solid transparent',
                borderRadius: '8px',
                background: musicSource === 'youtube'
                  ? 'var(--ifm-card-background-color, #ffffff)'
                  : 'transparent',
                boxShadow: musicSource === 'youtube'
                  ? '0 1px 3px rgba(0, 0, 0, 0.08)'
                  : 'none',
                cursor: 'pointer',
                fontWeight: musicSource === 'youtube' ? 700 : 600,
                fontSize: isPlayerOpen ? '0.82rem' : '0.74rem',
                color: musicSource === 'youtube'
                  ? 'var(--brand-green, #10b981)'
                  : 'var(--ifm-color-content-secondary, #475569)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
            >
              <span>📺</span>
              <span>YouTube</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  opacity: 0.75,
                  fontWeight: 500,
                }}
              >
                ({tracks.length})
              </span>
              {musicSource === 'youtube' && isPlaying && (
                <span
                  title="Playing audio"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-green, #10b981)',
                    display: 'inline-block',
                    boxShadow: '0 0 6px var(--brand-green, #10b981)',
                    marginLeft: '2px',
                  }}
                />
              )}
            </button>

            {/* Spotify Playlists Tab */}
            <button
              type="button"
              onClick={() => setMusicSource('spotify')}
              aria-label="Switch to Spotify playlists"
              style={{
                flex: 1,
                padding: isPlayerOpen ? '8px 12px' : '5px 8px',
                border: musicSource === 'spotify'
                  ? '1px solid var(--brand-green, #10b981)'
                  : '1px solid transparent',
                borderRadius: '8px',
                background: musicSource === 'spotify'
                  ? 'var(--ifm-card-background-color, #ffffff)'
                  : 'transparent',
                boxShadow: musicSource === 'spotify'
                  ? '0 1px 3px rgba(0, 0, 0, 0.08)'
                  : 'none',
                cursor: 'pointer',
                fontWeight: musicSource === 'spotify' ? 700 : 600,
                fontSize: isPlayerOpen ? '0.82rem' : '0.74rem',
                color: musicSource === 'spotify'
                  ? 'var(--brand-green, #10b981)'
                  : 'var(--ifm-color-content-secondary, #475569)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
            >
              <svg
                width={isPlayerOpen ? "15" : "13"}
                height={isPlayerOpen ? "15" : "13"}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.468-1.026.252-2.812-1.718-6.352-2.106-10.523-1.152-.403.092-.806-.157-.899-.56-.092-.403.157-.806.56-.899 4.568-1.044 8.502-.601 11.636 1.333.352.216.467.674.252 1.026zm1.467-3.262c-.272.443-.854.582-1.297.31-3.218-1.978-8.125-2.55-11.932-1.393-.497.151-1.026-.134-1.177-.63-.151-.497.134-1.026.63-1.177 4.354-1.321 9.775-.681 13.466 1.593.443.272.582.854.31 1.297zm.126-3.41c-3.858-2.29-10.222-2.502-13.916-1.38-.592.18-1.222-.158-1.402-.75-.18-.592.158-1.222.75-1.402 4.252-1.291 11.282-1.042 15.717 1.59.533.316.708 1.008.392 1.541-.316.533-1.008.708-1.541.392z" />
              </svg>
              <span>Spotify Playlists</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  opacity: 0.75,
                  fontWeight: 500,
                }}
              >
                ({spotifyPlaylists.length})
              </span>
              {musicSource === 'spotify' && (isPlaying || isSpotifyPlaying) && (
                <span
                  title="Playing audio"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-green, #10b981)',
                    display: 'inline-block',
                    boxShadow: '0 0 6px var(--neon-glow-color, rgba(16, 185, 129, 0.6))',
                    marginLeft: '2px',
                  }}
                />
              )}
            </button>
          </div>

          {musicSource === 'spotify' ? (
            <div>
              {/* Active Spotify Playlist Card - ALWAYS MOUNTED IN DOM */}
              {currentSpotifyPlaylist && (
                <div
                  className="focus-subcard"
                  style={{
                    padding: isPlayerOpen ? '16px' : '10px 12px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isPlayerOpen ? '12px' : '8px',
                    marginBottom: isPlayerOpen ? '14px' : '6px',
                  }}
                >
                  {/* Category Badge, Play Status & Open in Spotify Link */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: isPlayerOpen ? '0.68rem' : '0.64rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: getCategoryBadgeStyle(currentSpotifyPlaylist).bg,
                        border: `1px solid ${getCategoryBadgeStyle(currentSpotifyPlaylist).border}`,
                        color: getCategoryBadgeStyle(currentSpotifyPlaylist).text,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      ● {currentSpotifyPlaylist.categoryLabel}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: isPlayerOpen ? '0.68rem' : '0.64rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: (isPlaying || isSpotifyPlaying) ? 'var(--brand-green, #10b981)' : 'var(--ifm-color-content-secondary, #64748b)',
                        }}
                      >
                        {(isPlaying || isSpotifyPlaying) ? (
                          <>
                            <span className="novatorem-status-dot" style={{ backgroundColor: 'var(--brand-green, #10b981)', boxShadow: '0 0 8px var(--neon-glow-color, rgba(16, 185, 129, 0.5))' }} />
                            <span>NOW PLAYING</span>
                          </>
                        ) : (
                          <span>PAUSED</span>
                        )}
                      </span>

                      <a
                        href={`https://open.spotify.com/playlist/${currentSpotifyPlaylist.playlistId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'var(--brand-green, #10b981)',
                          textDecoration: 'none',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--sidebar-active-bg, rgba(16, 185, 129, 0.12))',
                          border: '1px solid var(--sidebar-border, rgba(16, 185, 129, 0.25))',
                          transition: 'all 0.15s ease',
                        }}
                        title="Open in Spotify"
                      >
                        <span>Open in Spotify</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Album Art & Playlist Info Row */}
                  <div style={{ display: 'flex', gap: isPlayerOpen ? '14px' : '10px', alignItems: 'center' }}>
                    <div
                      style={{
                        position: 'relative',
                        width: isPlayerOpen ? '68px' : '42px',
                        height: isPlayerOpen ? '68px' : '42px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        backgroundColor: '#0f172a',
                        boxShadow: (isPlaying || isSpotifyPlaying) ? '0 4px 14px var(--neon-glow-color, rgba(16, 185, 129, 0.4))' : 'none',
                        border: '1px solid var(--sidebar-border, #D9D9D9)',
                      }}
                    >
                      <img
                        src={
                          currentSpotifyPlaylist.coverImage ||
                          `https://img.youtube.com/vi/${getSpotifyVideoId(currentSpotifyPlaylist)}/mqdefault.jpg`
                        }
                        alt={currentSpotifyPlaylist.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: (isPlaying || isSpotifyPlaying) ? 'scale(1.06)' : 'scale(1)',
                          transition: 'transform 0.4s ease',
                        }}
                      />
                      {/* Spotify Logo Badge Overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--brand-green, #10b981)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.468-1.026.252-2.812-1.718-6.352-2.106-10.523-1.152-.403.092-.806-.157-.899-.56-.092-.403.157-.806.56-.899 4.568-1.044 8.502-.601 11.636 1.333.352.216.467.674.252 1.026zm1.467-3.262c-.272.443-.854.582-1.297.31-3.218-1.978-8.125-2.55-11.932-1.393-.497.151-1.026-.134-1.177-.63-.151-.497.134-1.026.63-1.177 4.354-1.321 9.775-.681 13.466 1.593.443.272.582.854.31 1.297zm.126-3.41c-3.858-2.29-10.222-2.502-13.916-1.38-.592.18-1.222-.158-1.402-.75-.18-.592.158-1.222.75-1.402 4.252-1.291 11.282-1.042 15.717 1.59.533.316.708 1.008.392 1.541-.316.533-1.008.708-1.541.392z" />
                        </svg>
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          margin: '0 0 4px 0',
                          fontSize: isPlayerOpen ? '0.96rem' : '0.84rem',
                          fontWeight: 700,
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={currentSpotifyPlaylist.title}
                      >
                        {currentSpotifyPlaylist.title}
                      </h4>
                      <div style={{ fontSize: '0.72rem', opacity: 0.78, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Curated by {currentSpotifyPlaylist.curator}</span>
                        {currentSpotifyPlaylist.likes && (
                          <span style={{ color: 'var(--brand-green, #10b981)', fontWeight: 600 }}>• ❤️ {currentSpotifyPlaylist.likes}</span>
                        )}
                        {currentSpotifyPlaylist.isCustom && <span style={{ color: '#d97706' }}>• Favorite</span>}
                      </div>
                      {isPlayerOpen && currentSpotifyPlaylist.description && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.72rem', opacity: 0.75, lineHeight: 1.4 }}>
                          {currentSpotifyPlaylist.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Compact Mode Quick Playlist Selector Dropdown */}
                  {!isPlayerOpen && (
                    <select
                      value={currentSpotifyIndex}
                      onChange={(e) => selectSpotifyPlaylist(Number(e.target.value))}
                      className="focus-input"
                      aria-label="Select Spotify playlist"
                      style={{ fontSize: '0.74rem', padding: '5px 8px' }}
                    >
                      {spotifyPlaylists.map((pl, idx) => (
                        <option key={pl.id} value={idx}>
                          {pl.categoryLabel ? `[${pl.categoryLabel}] ` : ''}{pl.title}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Novatorem Spectrum Visualizer */}
                  {isPlayerOpen ? (
                    <div className="novatorem-visualizer-box">
                      {NOVATOREM_BARS.map((bar) => (
                        <div
                          key={bar.id}
                          className={`novatorem-bar${(isPlaying || isSpotifyPlaying) ? ' is-playing' : ''}`}
                          style={{
                            height: (isPlaying || isSpotifyPlaying) ? '4px' : '3px',
                            maxHeight: `${bar.maxHeight}px`,
                            '--pulse-max-height': `${bar.maxHeight}px`,
                            animationDuration: (isPlaying || isSpotifyPlaying) ? `${bar.pulseDur}ms, 12000ms` : 'none',
                            animationDelay: (isPlaying || isSpotifyPlaying) ? `-${bar.pulseDelay}ms, -${bar.waveDelay}ms` : '0s',
                          } as React.CSSProperties}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="novatorem-visualizer-box" style={{ height: '42px', padding: '3px 6px' }}>
                      {MINI_NOVATOREM_BARS.map((bar) => (
                        <div
                          key={bar.id}
                          className={`novatorem-mini-bar${(isPlaying || isSpotifyPlaying) ? ' is-playing' : ''}`}
                          style={{
                            height: (isPlaying || isSpotifyPlaying) ? '4px' : '3px',
                            '--pulse-max-height': `${bar.maxHeight}px`,
                            animationDuration: (isPlaying || isSpotifyPlaying) ? `${bar.pulseDur}ms, 10000ms` : 'none',
                            animationDelay: (isPlaying || isSpotifyPlaying) ? `-${bar.pulseDelay}ms, -${bar.waveDelay}ms` : '0s',
                          } as React.CSSProperties}
                        />
                      ))}
                    </div>
                  )}

                  {/* Playback Controls Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    {/* Prev / Play / Next */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={prevTrack}
                        aria-label="Previous Spotify playlist"
                        title="Previous playlist"
                        className="focus-music-btn"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="19 20 9 12 19 4 19 20" />
                          <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2.5" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={toggleSpotifyPlay}
                        aria-label={(isPlaying || isSpotifyPlaying) ? 'Pause Spotify' : 'Play Spotify'}
                        title={(isPlaying || isSpotifyPlaying) ? 'Pause Spotify playback' : 'Play Spotify'}
                        style={{
                          width: isPlayerOpen ? '44px' : '38px',
                          height: isPlayerOpen ? '44px' : '38px',
                          borderRadius: '50%',
                          border: '2px solid var(--brand-green-mid, var(--brand-green, #86efac))',
                          background: 'var(--gradient-brand, linear-gradient(135deg, var(--brand-green, #10b981) 0%, var(--brand-green-mid, #86efac) 100%))',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px var(--neon-glow-color, rgba(16, 185, 129, 0.45))',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                      >
                        {(isPlaying || isSpotifyPlaying) ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={nextTrack}
                        aria-label="Next Spotify playlist"
                        title="Next playlist"
                        className="focus-music-btn"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 4 15 12 5 20 5 4" />
                          <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5" />
                        </svg>
                      </button>
                    </div>

                    {/* Volume Slider & Mute Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={toggleMute}
                        aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
                        className="focus-music-btn"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        {isMuted || volume === 0 ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        aria-label="Volume slider"
                        style={{
                          width: isPlayerOpen ? '75px' : '55px',
                          accentColor: 'var(--brand-green, #10b981)',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{ fontSize: '0.7rem', width: '24px', opacity: 0.8, textAlign: 'right' }}>
                        {isMuted ? '0%' : `${volume}%`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* In Expanded Mode: Add Favorite Spotify Playlist & Full Playlist Catalog */}
              {isPlayerOpen && (
                <>
                  {/* Playlist Filter Tabs */}
                  <div className="focus-category-scroll">
                    {CATEGORY_TABS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`focus-category-tab${isActive ? ' active' : ''}`}
                        >
                          <span style={{ fontSize: '0.88rem' }}>{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Spotify Playlists Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {filteredSpotifyPlaylists.map((playlist) => {
                      const isCurrent = playlist.playlistId === currentSpotifyPlaylist?.playlistId;
                      const badge = getCategoryBadgeStyle(playlist);
                      const originalIndex = spotifyPlaylists.findIndex((p) => p.id === playlist.id);

                      return (
                        <div
                          key={playlist.id}
                          onClick={() => selectSpotifyPlaylist(originalIndex)}
                          className="focus-track-item"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: isCurrent ? '1px solid var(--brand-green, #10b981)' : '1px solid transparent',
                            backgroundColor: isCurrent ? 'var(--sidebar-active-bg, rgba(16, 185, 129, 0.08))' : 'transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            {/* Spotify Icon Indicator */}
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isCurrent ? 'var(--brand-green, #10b981)' : 'var(--ifm-color-emphasis-100, #F2F2F2)',
                                color: isCurrent ? '#ffffff' : 'var(--brand-green, #10b981)',
                                flexShrink: 0,
                              }}
                            >
                              {isCurrent && isSpotifyPlaying ? (
                                <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>▶</span>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.468-1.026.252-2.812-1.718-6.352-2.106-10.523-1.152-.403.092-.806-.157-.899-.56-.092-.403.157-.806.56-.899 4.568-1.044 8.502-.601 11.636 1.333.352.216.467.674.252 1.026zm1.467-3.262c-.272.443-.854.582-1.297.31-3.218-1.978-8.125-2.55-11.932-1.393-.497.151-1.026-.134-1.177-.63-.151-.497.134-1.026.63-1.177 4.354-1.321 9.775-.681 13.466 1.593.443.272.582.854.31 1.297zm.126-3.41c-3.858-2.29-10.222-2.502-13.916-1.38-.592.18-1.222-.158-1.402-.75-.18-.592.158-1.222.75-1.402 4.252-1.291 11.282-1.042 15.717 1.59.533.316.708 1.008.392 1.541-.316.533-1.008.708-1.541.392z" />
                                </svg>
                              )}
                            </div>

                            {/* Title & Metadata */}
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.82rem',
                                  fontWeight: isCurrent ? 700 : 500,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  color: isCurrent ? 'var(--brand-green, #10b981)' : 'inherit',
                                }}
                              >
                                {playlist.title}
                              </div>
                              <div style={{ fontSize: '0.68rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{playlist.curator}</span>
                                {playlist.likes && (
                                  <span style={{ color: 'var(--brand-green, #10b981)', fontWeight: 600 }}>
                                    • ❤️ {playlist.likes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Tag + Delete if Custom */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '10px',
                                backgroundColor: badge.bg,
                                border: `1px solid ${badge.border}`,
                                color: badge.text,
                              }}
                            >
                              {playlist.categoryLabel}
                            </span>

                            {playlist.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomSpotifyPlaylist(playlist.id);
                                }}
                                title="Remove custom Spotify playlist"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  fontSize: '0.8rem',
                                  padding: '2px 4px',
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Spotify Playlist Toggle / Form */}
                  <div style={{ marginTop: '8px', borderTop: '1px solid var(--sidebar-border, #D9D9D9)', paddingTop: '10px', flexShrink: 0 }}>
                    {!showSpotifyAddForm ? (
                      <button
                        type="button"
                        onClick={() => setShowSpotifyAddForm(true)}
                        className="focus-music-btn"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          gap: '8px',
                        }}
                      >
                        <span style={{ color: 'var(--brand-green, #10b981)' }}>🟢</span>
                        <span>Add to My Favorites (Spotify Playlist)</span>
                      </button>
                    ) : (
                      <form onSubmit={handleAddSpotifyPlaylist} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-green, #10b981)' }}>
                            🟢 Add Favorite Spotify Playlist
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowSpotifyAddForm(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', opacity: 0.7 }}
                          >
                            Cancel
                          </button>
                        </div>

                        <div style={{ fontSize: '0.72rem', opacity: 0.9, color: 'var(--brand-green, #10b981)' }}>
                          {currentUser
                            ? `🔒 Private favorite for your account (${currentUser.displayName || currentUser.email})`
                            : '👤 Private favorite for this browser session'}
                        </div>

                        <input
                          type="text"
                          className="focus-input"
                          placeholder="https://open.spotify.com/playlist/... or spotify:playlist:..."
                          value={spotifyUrl}
                          onChange={(e) => setSpotifyUrl(e.target.value)}
                        />

                        <input
                          type="text"
                          className="focus-input"
                          placeholder="Optional playlist title (e.g. My Coding Sanctuary)"
                          value={spotifyTitle}
                          onChange={(e) => setSpotifyTitle(e.target.value)}
                        />

                        {spotifyAddError && (
                          <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{spotifyAddError}</span>
                        )}

                        <button
                          type="submit"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'var(--brand-green, #10b981)',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px var(--neon-glow-color, rgba(16, 185, 129, 0.3))',
                          }}
                        >
                          Save & Listen
                        </button>
                      </form>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              {trackError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fcd34d',
                    color: '#92400e',
                    fontSize: isPlayerOpen ? '0.78rem' : '0.72rem',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>⚠️</span>
                  <span style={{ flex: 1, lineHeight: 1.3 }}>{trackError}</span>
                </div>
              )}

              {/* YouTube Now Playing Track Card */}
              {currentTrack && (
                <div
                  className="focus-subcard"
                  style={{
                    padding: isPlayerOpen ? '16px' : '10px 12px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isPlayerOpen ? '12px' : '8px',
                    marginBottom: isPlayerOpen ? '14px' : '6px',
                  }}
                >
                  {/* Top Status & Category Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: isPlayerOpen ? '0.68rem' : '0.64rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: getCategoryBadgeStyle(currentTrack).bg,
                        border: `1px solid ${getCategoryBadgeStyle(currentTrack).border}`,
                        color: getCategoryBadgeStyle(currentTrack).text,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      ● {currentTrack.categoryLabel}
                    </span>

                    <span
                      style={{
                        fontSize: isPlayerOpen ? '0.68rem' : '0.64rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: isPlaying ? 'var(--brand-green, #10b981)' : 'var(--ifm-color-content-secondary, #64748b)',
                      }}
                    >
                      {isPlaying ? (
                        <>
                          <span className="novatorem-status-dot" />
                          <span>NOW PLAYING</span>
                        </>
                      ) : (
                        <span>PAUSED</span>
                      )}
                    </span>
                  </div>

                  {/* Album Art & Track Info Row */}
                  <div style={{ display: 'flex', gap: isPlayerOpen ? '14px' : '10px', alignItems: 'center' }}>
                    <div
                      style={{
                        position: 'relative',
                        width: isPlayerOpen ? '68px' : '42px',
                        height: isPlayerOpen ? '68px' : '42px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        backgroundColor: '#0f172a',
                        boxShadow: isPlaying ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                        border: '1px solid var(--sidebar-border, #D9D9D9)',
                      }}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${currentTrack.videoId}/mqdefault.jpg`}
                        alt={currentTrack.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: isPlaying ? 'scale(1.06)' : 'scale(1)',
                          transition: 'transform 0.4s ease',
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          margin: '0 0 4px 0',
                          fontSize: isPlayerOpen ? '0.96rem' : '0.84rem',
                          fontWeight: 700,
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={currentTrack.title}
                      >
                        {currentTrack.title}
                      </h4>
                      <div style={{ fontSize: '0.72rem', opacity: 0.78, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📺 {currentTrack.channel}</span>
                        {currentTrack.duration && <span>• {currentTrack.duration}</span>}
                        {currentTrack.views && (
                          <span style={{ color: 'var(--brand-green, #10b981)', fontWeight: 600 }}>
                            • 🔥 {currentTrack.views}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compact Mode Quick YouTube Track Selector Dropdown */}
                  {!isPlayerOpen && (
                    <select
                      value={currentTrackIndex}
                      onChange={(e) => selectTrack(Number(e.target.value))}
                      className="focus-input"
                      aria-label="Select YouTube stream"
                      style={{ fontSize: '0.74rem', padding: '5px 8px' }}
                    >
                      {tracks.map((t, idx) => (
                        <option key={t.id} value={idx}>
                          [{t.categoryLabel}] {t.title}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Novatorem Spectrum Visualizer */}
                  {isPlayerOpen ? (
                    <div className="novatorem-visualizer-box">
                      {NOVATOREM_BARS.map((bar) => (
                        <div
                          key={bar.id}
                          className={`novatorem-bar${isPlaying ? ' is-playing' : ''}`}
                          style={{
                            height: isPlaying ? '4px' : '3px',
                            maxHeight: `${bar.maxHeight}px`,
                            '--pulse-max-height': `${bar.maxHeight}px`,
                            animationDuration: isPlaying ? `${bar.pulseDur}ms, 12000ms` : 'none',
                            animationDelay: isPlaying ? `-${bar.pulseDelay}ms, -${bar.waveDelay}ms` : '0s',
                          } as React.CSSProperties}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="novatorem-visualizer-box" style={{ height: '42px', padding: '3px 6px' }}>
                      {MINI_NOVATOREM_BARS.map((bar) => (
                        <div
                          key={bar.id}
                          className={`novatorem-mini-bar${isPlaying ? ' is-playing' : ''}`}
                          style={{
                            height: isPlaying ? '4px' : '3px',
                            '--pulse-max-height': `${bar.maxHeight}px`,
                            animationDuration: isPlaying ? `${bar.pulseDur}ms, 10000ms` : 'none',
                            animationDelay: isPlaying ? `-${bar.pulseDelay}ms, -${bar.waveDelay}ms` : '0s',
                          } as React.CSSProperties}
                        />
                      ))}
                    </div>
                  )}

                  {/* Playback Controls Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    {/* Prev / Play / Next */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={prevTrack}
                        aria-label="Previous track"
                        className="focus-music-btn"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="19 20 9 12 19 4 19 20" />
                          <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2.5" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={togglePlay}
                        aria-label={isPlaying ? 'Pause track' : 'Play track'}
                        style={{
                          width: isPlayerOpen ? '44px' : '38px',
                          height: isPlayerOpen ? '44px' : '38px',
                          borderRadius: '50%',
                          border: '2px solid var(--brand-green-mid, #86efac)',
                          background: 'var(--gradient-brand, linear-gradient(135deg, #10b981 0%, #34d399 100%))',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px var(--neon-glow-color, rgba(16, 185, 129, 0.4))',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                      >
                        {isPlaying ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={nextTrack}
                        aria-label="Next track"
                        className="focus-music-btn"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 4 15 12 5 20 5 4" />
                          <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5" />
                        </svg>
                      </button>
                    </div>

                    {/* Volume Slider & Mute Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={toggleMute}
                        aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
                        className="focus-music-btn"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        {isMuted || volume === 0 ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        aria-label="Volume slider"
                        style={{
                          width: isPlayerOpen ? '75px' : '55px',
                          accentColor: 'var(--brand-green, #10b981)',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{ fontSize: '0.7rem', width: '24px', opacity: 0.8, textAlign: 'right' }}>
                        {isMuted ? '0%' : `${volume}%`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* In Expanded Mode: Full Track Catalog */}
              {isPlayerOpen && (
                <>
                  {/* Playlist Filter Tabs */}
                  <div className="focus-category-scroll">
                    {CATEGORY_TABS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`focus-category-tab${isActive ? ' active' : ''}`}
                        >
                          <span style={{ fontSize: '0.88rem' }}>{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Playlist Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {filteredTracks.map((track) => {
                      const isCurrent = track.videoId === currentTrack.videoId;
                      const trackBadge = getCategoryBadgeStyle(track);
                      const originalIndex = tracks.findIndex((t) => t.id === track.id);

                      return (
                        <div
                          key={track.id}
                          onClick={() => selectTrack(originalIndex)}
                          className="focus-track-item"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: isCurrent ? '1px solid var(--brand-green, #10b981)' : '1px solid transparent',
                            backgroundColor: isCurrent ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            {/* Play Indicator / Icon */}
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isCurrent ? 'var(--brand-green, #10b981)' : 'var(--ifm-color-emphasis-100, #F2F2F2)',
                                color: isCurrent ? '#ffffff' : 'var(--ifm-color-content, #0f172a)',
                                fontSize: '0.65rem',
                                flexShrink: 0,
                              }}
                            >
                              {isCurrent && isPlaying ? '▶' : '♫'}
                            </div>

                            {/* Title & Metadata */}
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.82rem',
                                  fontWeight: isCurrent ? 700 : 500,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  color: isCurrent ? 'var(--brand-green, #10b981)' : 'inherit',
                                }}
                              >
                                {track.title}
                              </div>
                              <div style={{ fontSize: '0.68rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{track.channel}</span>
                                {track.duration && <span>• {track.duration}</span>}
                                {track.views && (
                                  <span style={{ color: 'var(--brand-green, #10b981)', fontWeight: 600 }}>
                                    • 🔥 {track.views}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Tag + Delete if Custom */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '10px',
                                backgroundColor: trackBadge.bg,
                                border: `1px solid ${trackBadge.border}`,
                                color: trackBadge.text,
                              }}
                            >
                              {track.categoryLabel}
                            </span>

                            {track.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomTrack(track.id);
                                }}
                                title="Remove custom track"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  fontSize: '0.8rem',
                                  padding: '2px 4px',
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Track Toggle / Form */}
                  <div style={{ marginTop: '8px', borderTop: '1px solid var(--sidebar-border, #D9D9D9)', paddingTop: '10px', flexShrink: 0 }}>
                    {!showAddForm ? (
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="focus-music-btn"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          gap: '8px',
                        }}
                      >
                        <span>⭐ Add to My Favorites (YouTube Video)</span>
                      </button>
                    ) : (
                      <form onSubmit={handleAddTrack} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            ⭐ Add Favorite YouTube Video
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', opacity: 0.7 }}
                          >
                            Cancel
                          </button>
                        </div>

                        <div style={{ fontSize: '0.72rem', opacity: 0.9, color: 'var(--brand-green, #10b981)' }}>
                          {currentUser
                            ? `🔒 Private favorite for your account (${currentUser.displayName || currentUser.email})`
                            : '👤 Private favorite for this browser session'}
                        </div>

                        <input
                          type="text"
                          className="focus-input"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                        />

                        <input
                          type="text"
                          className="focus-input"
                          placeholder="Optional track title (e.g. My Favorite Study Stream)"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                        />

                        {addError && (
                          <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{addError}</span>
                        )}

                        <button
                          type="submit"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'var(--brand-green, #10b981)',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          Save & Play
                        </button>
                      </form>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Compact Mode Action Button (Expand Full Player & Pomodoro) */}
        {!isPlayerOpen && (
          <div style={{ padding: '0 12px 10px 12px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                setIsMiniPlayerOpen(false);
                openPlayer();
              }}
              aria-label="Expand full player"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--ifm-color-emphasis-200, #F2F2F2)',
                border: '1px solid var(--sidebar-border, #D9D9D9)',
                color: 'var(--ifm-color-content, #0f172a)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Full Player & Pomodoro</span>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
        )}

        {/* Expanded Mode Footer with Hint */}
        {isPlayerOpen && (
          <div
            style={{
              padding: '10px 20px',
              borderTop: '1px solid var(--sidebar-border, #D9D9D9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              opacity: 0.7,
              flexShrink: 0,
            }}
          >
            <span>Audio continues playing across doc pages</span>
            <span>ESC to minimize</span>
          </div>
        )}
      </div>
    </>
  );
}
