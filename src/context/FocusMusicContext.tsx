import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  MusicTrack,
  PomodoroState,
  DEFAULT_TRACKS,
  SpotifyPlaylist,
  DEFAULT_SPOTIFY_PLAYLISTS,
  MusicSource,
} from '../types/focusMusic';
import { useUserProgress } from '../context/UserProgressContext';
import { saveFavoriteTracksToFirestore } from '../services/userProgressService';
import {
  extractYouTubeVideoId,
  getStoredCustomTracks,
  saveStoredCustomTracks,
  getStoredVolume,
  saveStoredVolume,
  getStoredMuted,
  saveStoredMuted,
  getStoredLastTrackIndex,
  saveStoredLastTrackIndex,
  getAllInitialTracks,
  extractSpotifyPlaylistId,
  getStoredCustomSpotifyPlaylists,
  saveStoredCustomSpotifyPlaylists,
  getAllInitialSpotifyPlaylists,
  getStoredMusicSource,
  saveStoredMusicSource,
  getStoredLastSpotifyIndex,
  saveStoredLastSpotifyIndex,
  getStoredPomodoro,
  saveStoredPomodoro,
} from '../utils/focusMusicStorage';

interface FocusMusicContextType {
  musicSource: MusicSource;
  setMusicSource: (src: MusicSource) => void;
  // YouTube Tracks
  tracks: MusicTrack[];
  currentTrackIndex: number;
  currentTrack: MusicTrack;
  isPlaying: boolean;
  isPlayerOpen: boolean;
  isMiniPlayerOpen: boolean;
  setIsMiniPlayerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openMiniPlayer: () => void;
  closeMiniPlayer: () => void;
  toggleMiniPlayer: () => void;
  volume: number;
  isMuted: boolean;
  pomodoro: PomodoroState;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  selectTrack: (index: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  openPlayer: () => void;
  closePlayer: () => void;
  togglePlayer: () => void;
  addCustomTrack: (url: string, title?: string) => boolean;
  removeCustomTrack: (id: string) => void;
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  setPomodoroTimes: (focusMins: number, breakMins: number) => void;
  // Error & Status handling
  trackError: string | null;
  clearTrackError: () => void;
  // Spotify Playlists
  spotifyPlaylists: SpotifyPlaylist[];
  currentSpotifyIndex: number;
  currentSpotifyPlaylist: SpotifyPlaylist;
  isSpotifyPlaying: boolean;
  setIsSpotifyPlaying: (playing: boolean) => void;
  toggleSpotifyPlay: () => void;
  selectSpotifyPlaylist: (index: number) => void;
  addCustomSpotifyPlaylist: (url: string, title?: string) => boolean;
  removeCustomSpotifyPlaylist: (id: string) => void;
}

const FocusMusicContext = createContext<FocusMusicContextType | null>(null);

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Gentle Web Audio API chime for Pomodoro transitions
function playGentleChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Two gentle notes (C5 -> G5)
    [523.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.25);
      gain.gain.setValueAtTime(0, now + idx * 0.25);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.25 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.25 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.25);
      osc.stop(now + idx * 0.25 + 0.85);
    });
  } catch {
    // Audio context may be restricted by autoplay policy
  }
}

export function getSpotifyVideoId(playlist?: SpotifyPlaylist): string {
  if (!playlist) return 'xAR6N9N8e6U';
  if (playlist.videoId) return playlist.videoId;
  const categoryFallback: Record<string, string> = {
    study: '0JvAPwUHLNk',
    pomodoro: 'YdtBEFK_HgI',
    relax: '5yx6BWlEVcY',
    ambient: '1ZYbU82GVz4',
    synthwave: 'xAR6N9N8e6U',
  };
  return categoryFallback[playlist.category] || 'xAR6N9N8e6U';
}

export function FocusMusicProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { currentUser, progress } = useUserProgress();
  const [tracks, setTracks] = useState<MusicTrack[]>(DEFAULT_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(70);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Spotify state
  const [musicSource, setMusicSourceState] = useState<MusicSource>('youtube');
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>(DEFAULT_SPOTIFY_PLAYLISTS);
  const [currentSpotifyIndex, setCurrentSpotifyIndex] = useState<number>(0);
  const [isSpotifyPlaying, setIsSpotifyPlaying] = useState<boolean>(false);
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState<boolean>(false);

  const openMiniPlayer = useCallback(() => setIsMiniPlayerOpen(true), []);
  const closeMiniPlayer = useCallback(() => setIsMiniPlayerOpen(false), []);
  const toggleMiniPlayer = useCallback(() => setIsMiniPlayerOpen((prev) => !prev), []);

  // Pomodoro state (restores live countdown & settings across routes and reloads)
  const [pomodoro, setPomodoro] = useState<PomodoroState>(() => getStoredPomodoro());

  const [trackError, setTrackError] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const shouldAutoPlayRef = useRef<boolean>(false);
  const currentTrackIndexRef = useRef<number>(0);
  const tracksRef = useRef<MusicTrack[]>(DEFAULT_TRACKS);
  const musicSourceRef = useRef<MusicSource>('youtube');
  const spotifyPlaylistsRef = useRef<SpotifyPlaylist[]>(DEFAULT_SPOTIFY_PLAYLISTS);
  const currentSpotifyIndexRef = useRef<number>(0);
  const volumeRef = useRef<number>(70);
  const isMutedRef = useRef<boolean>(false);
  const consecutiveErrorsRef = useRef<number>(0);
  const autoAdvanceTimerRef = useRef<any>(null);

  const clearTrackError = useCallback(() => setTrackError(null), []);

  // Initialize tracks & stored preferences on mount & whenever user changes
  useEffect(() => {
    const uid = currentUser?.uid || null;
    const localCustom = getStoredCustomTracks(uid);
    const firestoreCustom = Array.isArray((progress as any)?.favoriteCustomTracks)
      ? (progress as any).favoriteCustomTracks
      : [];

    // Deduplicate and merge user-specific custom favorites
    const idMigrationMap: Record<string, string> = {
      'U0aL_f_yB80': 'xAR6N9N8e6U',
      'R9K1G5D211s': '0JvAPwUHLNk',
      'h2P3M10d540': 'yeLAayXmozI',
      'n59h-m2rS5s': 'PTMFErX4PR4',
    };
    const mergedMap = new Map<string, MusicTrack>();
    [...firestoreCustom, ...localCustom].forEach((t) => {
      if (t && t.videoId) {
        const vid = idMigrationMap[t.videoId] || t.videoId;
        mergedMap.set(vid, {
          ...t,
          videoId: vid,
          isCustom: true,
          isFavorite: true,
          addedByUid: uid || 'guest',
          categoryLabel: t.categoryLabel || '⭐ My Favorite',
        });
      }
    });

    const userCustomTracks = Array.from(mergedMap.values());
    saveStoredCustomTracks(userCustomTracks, uid);

    const mergedAll = [...DEFAULT_TRACKS, ...userCustomTracks];
    setTracks(mergedAll);
    tracksRef.current = mergedAll;

    const storedVol = getStoredVolume();
    const storedMute = getStoredMuted();
    const lastIdx = getStoredLastTrackIndex(mergedAll.length);

    setVolumeState(storedVol);
    volumeRef.current = storedVol;

    setIsMuted(storedMute);
    isMutedRef.current = storedMute;

    setCurrentTrackIndex(lastIdx);
    currentTrackIndexRef.current = lastIdx;

    // Spotify initialization
    const initialSource = getStoredMusicSource();
    setMusicSourceState(initialSource);

    const localSpotify = getStoredCustomSpotifyPlaylists(uid);
    const mergedSpotify = [...DEFAULT_SPOTIFY_PLAYLISTS, ...localSpotify];
    setSpotifyPlaylists(mergedSpotify);
    const lastSpotifyIdx = getStoredLastSpotifyIndex(mergedSpotify.length);
    setCurrentSpotifyIndex(lastSpotifyIdx);
  }, [currentUser?.uid, (progress as any)?.favoriteCustomTracks]);

  // Sync refs when states change
  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
    saveStoredLastTrackIndex(currentTrackIndex);
  }, [currentTrackIndex]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    musicSourceRef.current = musicSource;
  }, [musicSource]);

  useEffect(() => {
    currentSpotifyIndexRef.current = currentSpotifyIndex;
    saveStoredLastSpotifyIndex(currentSpotifyIndex);
  }, [currentSpotifyIndex]);

  useEffect(() => {
    spotifyPlaylistsRef.current = spotifyPlaylists;
  }, [spotifyPlaylists]);

  // Pomodoro Countdown Timer (persisted to localStorage across navigation and reloads)
  useEffect(() => {
    if (!pomodoro.isRunning) return;

    const timer = setInterval(() => {
      setPomodoro((prev) => {
        if (!prev.isRunning) return prev;
        if (prev.timeLeft > 1) {
          const next = { ...prev, timeLeft: prev.timeLeft - 1 };
          saveStoredPomodoro(next);
          return next;
        }

        // Timer completed! Switch modes
        playGentleChime();
        if (prev.mode === 'focus') {
          const next: PomodoroState = {
            ...prev,
            mode: 'break',
            timeLeft: prev.breakMinutes * 60,
            sessionsCompleted: prev.sessionsCompleted + 1,
          };
          saveStoredPomodoro(next);
          return next;
        } else {
          const next: PomodoroState = {
            ...prev,
            mode: 'focus',
            timeLeft: prev.focusMinutes * 60,
          };
          saveStoredPomodoro(next);
          return next;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pomodoro.isRunning]);

  // Sync Pomodoro state across window tabs and route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kb_focus_music_pomodoro_state') {
        const stored = getStoredPomodoro();
        setPomodoro(stored);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initYouTubePlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      const container = document.getElementById('youtube-focus-iframe-container');
      if (!container) return;

      const currentVid = tracksRef.current[currentTrackIndexRef.current]?.videoId || 'nZtFlrwCbs4';

      try {
        playerRef.current = new window.YT.Player('youtube-focus-iframe-container', {
          height: '180',
          width: '240',
          videoId: currentVid,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' && window.location.protocol === 'https:' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              isPlayerReadyRef.current = true;
              event.target.setVolume(volumeRef.current);
              if (isMutedRef.current) {
                event.target.mute();
              } else {
                event.target.unMute();
              }
              const targetVideoId =
                musicSourceRef.current === 'spotify'
                  ? getSpotifyVideoId(spotifyPlaylistsRef.current[currentSpotifyIndexRef.current])
                  : tracksRef.current[currentTrackIndexRef.current]?.videoId;

              if (targetVideoId) {
                if (shouldAutoPlayRef.current) {
                  event.target.loadVideoById(targetVideoId);
                  event.target.playVideo();
                  setIsPlaying(true);
                  if (musicSourceRef.current === 'spotify') {
                    setIsSpotifyPlaying(true);
                  }
                } else {
                  event.target.cueVideoById(targetVideoId);
                }
              }
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
              if (event.data === 1) {
                setIsPlaying(true);
                if (musicSourceRef.current === 'spotify') {
                  setIsSpotifyPlaying(true);
                }
                setTrackError(null);
                consecutiveErrorsRef.current = 0;
              } else if (event.data === 2) {
                setIsPlaying(false);
                setIsSpotifyPlaying(false);
              } else if (event.data === 0) {
                // When a track completes, automatically play next track in playlist
                if (shouldAutoPlayRef.current) {
                  if (musicSourceRef.current === 'spotify') {
                    const nextIdx = (currentSpotifyIndexRef.current + 1) % spotifyPlaylistsRef.current.length;
                    selectSpotifyPlaylist(nextIdx);
                  } else {
                    const nextIdx = (currentTrackIndexRef.current + 1) % tracksRef.current.length;
                    selectTrack(nextIdx);
                  }
                } else {
                  setIsPlaying(false);
                  setIsSpotifyPlaying(false);
                }
              }
            },
            onError: (event: any) => {
              const code = event?.data;
              console.warn(`[FocusMusic] YouTube player error ${code} on track index ${currentTrackIndexRef.current}`);
              setIsPlaying(false);
              consecutiveErrorsRef.current += 1;

              const isEmbedRestricted = code === 101 || code === 150;
              const errorMsg = isEmbedRestricted
                ? 'Video embedding restricted by creator. Skipping to next track...'
                : 'Track unavailable on YouTube. Skipping to next track...';
              setTrackError(errorMsg);

              if (autoAdvanceTimerRef.current) {
                clearTimeout(autoAdvanceTimerRef.current);
              }

              if (consecutiveErrorsRef.current < 4) {
                autoAdvanceTimerRef.current = setTimeout(() => {
                  setTrackError(null);
                  const nextIdx = (currentTrackIndexRef.current + 1) % tracksRef.current.length;
                  selectTrack(nextIdx, true);
                }, 1400);
              } else {
                setTrackError('Multiple tracks failed to load. Please choose another playlist or source.');
              }
            },
          },
        });
      } catch {
        // Fallback gracefully
      }
    };

    if (window.YT && window.YT.Player) {
      initYouTubePlayer();
    } else {
      const prevHandler = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevHandler) prevHandler();
        initYouTubePlayer();
      };

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.head.appendChild(tag);
      }
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  const selectSpotifyPlaylist = useCallback((index: number) => {
    setMusicSourceState('spotify');
    saveStoredMusicSource('spotify');
    musicSourceRef.current = 'spotify';
    setSpotifyPlaylists((curr) => {
      if (index >= 0 && index < curr.length) {
        setCurrentSpotifyIndex(index);
        currentSpotifyIndexRef.current = index;
        saveStoredLastSpotifyIndex(index);
        setIsSpotifyPlaying(true);
        setIsPlaying(true);
        setIsMiniPlayerOpen(true);
        shouldAutoPlayRef.current = true;

        const targetPlaylist = curr[index];
        const targetVideoId = getSpotifyVideoId(targetPlaylist);

        if (playerRef.current && isPlayerReadyRef.current && targetVideoId) {
          try {
            playerRef.current.loadVideoById(targetVideoId);
          } catch {
            // ignore
          }
        }
      }
      return curr;
    });
  }, []);

  const play = useCallback(() => {
    shouldAutoPlayRef.current = true;
    setIsPlaying(true);
    setTrackError(null);

    const isSpotify = musicSource === 'spotify';
    setIsSpotifyPlaying(isSpotify);

    const targetVideoId = isSpotify
      ? getSpotifyVideoId(spotifyPlaylistsRef.current[currentSpotifyIndexRef.current])
      : tracksRef.current[currentTrackIndexRef.current]?.videoId;

    if (playerRef.current && isPlayerReadyRef.current && targetVideoId) {
      try {
        const state = typeof playerRef.current.getPlayerState === 'function' ? playerRef.current.getPlayerState() : -1;
        const currentTargetId = typeof playerRef.current.getVideoData === 'function' ? playerRef.current.getVideoData()?.video_id : null;
        if (state === -1 || state === 5 || (currentTargetId && currentTargetId !== targetVideoId)) {
          playerRef.current.loadVideoById(targetVideoId);
        } else {
          playerRef.current.playVideo();
        }
      } catch {
        // Handle browser autoplay policy restrictions
      }
    }
  }, [musicSource]);

  const pause = useCallback(() => {
    shouldAutoPlayRef.current = false;
    setIsPlaying(false);
    setIsSpotifyPlaying(false);
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch {
        // Ignore
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const toggleSpotifyPlay = useCallback(() => {
    if (musicSource !== 'spotify') {
      setMusicSourceState('spotify');
      saveStoredMusicSource('spotify');
      musicSourceRef.current = 'spotify';
    }
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [musicSource, isPlaying, play, pause]);

  const selectTrack = useCallback((index: number, isAutoAdvance = false) => {
    if (index < 0 || index >= tracksRef.current.length) return;
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    setMusicSourceState('youtube');
    saveStoredMusicSource('youtube');
    musicSourceRef.current = 'youtube';
    setIsSpotifyPlaying(false);
    setCurrentTrackIndex(index);
    currentTrackIndexRef.current = index;
    saveStoredLastTrackIndex(index);
    shouldAutoPlayRef.current = true;
    setIsPlaying(true);
    setTrackError(null);
    if (!isAutoAdvance) {
      consecutiveErrorsRef.current = 0;
    }

    const targetTrack = tracksRef.current[index];
    if (!targetTrack) return;

    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        if (typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById(targetTrack.videoId);
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  const nextTrack = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (musicSource === 'spotify') {
      const nextIdx = (currentSpotifyIndexRef.current + 1) % spotifyPlaylistsRef.current.length;
      selectSpotifyPlaylist(nextIdx);
    } else {
      const nextIdx = (currentTrackIndexRef.current + 1) % tracksRef.current.length;
      selectTrack(nextIdx);
    }
  }, [musicSource, selectSpotifyPlaylist, selectTrack]);

  const prevTrack = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (musicSource === 'spotify') {
      const prevIdx = (currentSpotifyIndexRef.current - 1 + spotifyPlaylistsRef.current.length) % spotifyPlaylistsRef.current.length;
      selectSpotifyPlaylist(prevIdx);
    } else {
      const prevIdx = (currentTrackIndexRef.current - 1 + tracksRef.current.length) % tracksRef.current.length;
      selectTrack(prevIdx);
    }
  }, [musicSource, selectSpotifyPlaylist, selectTrack]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    saveStoredVolume(clamped);

    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        playerRef.current.setVolume(clamped);
        if (isMutedRef.current && clamped > 0) {
          playerRef.current.unMute();
          setIsMuted(false);
          isMutedRef.current = false;
          saveStoredMuted(false);
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMutedRef.current;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;
    saveStoredMuted(nextMuted);

    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        if (nextMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volumeRef.current);
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  const openPlayer = useCallback(() => setIsPlayerOpen(true), []);
  const closePlayer = useCallback(() => setIsPlayerOpen(false), []);
  const togglePlayer = useCallback(() => setIsPlayerOpen((prev) => !prev), []);

  const addCustomTrack = useCallback((url: string, title?: string): boolean => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return false;

    const uid = currentUser?.uid || null;
    const userLabel = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'My Favorite');

    const newTrack: MusicTrack = {
      id: `custom-${Date.now()}-${videoId}`,
      title: title?.trim() || `Favorite Video (${videoId})`,
      category: 'study',
      categoryLabel: '⭐ My Favorite',
      videoId,
      channel: `⭐ ${userLabel}`,
      isCustom: true,
      isFavorite: true,
      addedByUid: uid || 'guest',
    };

    // Filter out if this video already exists in user custom list
    const existingCustom = tracksRef.current.filter((t) => t.isCustom && t.videoId !== videoId);
    const updatedCustom = [...existingCustom, newTrack];

    saveStoredCustomTracks(updatedCustom, uid);
    if (uid) {
      saveFavoriteTracksToFirestore(uid, updatedCustom);
    }

    const updated = [...DEFAULT_TRACKS, ...updatedCustom];
    setTracks(updated);
    tracksRef.current = updated;

    // Auto-select and play the newly added track
    selectTrack(updated.length - 1);
    return true;
  }, [selectTrack, currentUser]);

  const removeCustomTrack = useCallback((id: string) => {
    const uid = currentUser?.uid || null;
    const remainingCustom = tracksRef.current.filter((t) => t.isCustom && t.id !== id);

    saveStoredCustomTracks(remainingCustom, uid);
    if (uid) {
      saveFavoriteTracksToFirestore(uid, remainingCustom);
    }

    const updated = [...DEFAULT_TRACKS, ...remainingCustom];
    setTracks(updated);
    tracksRef.current = updated;

    if (currentTrackIndexRef.current >= updated.length) {
      selectTrack(0);
    }
  }, [selectTrack, currentUser]);

  // Pomodoro Controls (persisted to localStorage)
  const startPomodoro = useCallback(() => {
    setPomodoro((prev) => {
      const next = { ...prev, isRunning: true };
      saveStoredPomodoro(next);
      return next;
    });
  }, []);

  const pausePomodoro = useCallback(() => {
    setPomodoro((prev) => {
      const next = { ...prev, isRunning: false };
      saveStoredPomodoro(next);
      return next;
    });
  }, []);

  const resetPomodoro = useCallback(() => {
    setPomodoro((prev) => {
      const next: PomodoroState = {
        ...prev,
        isRunning: false,
        timeLeft: prev.focusMinutes * 60,
        mode: 'focus',
      };
      saveStoredPomodoro(next);
      return next;
    });
  }, []);

  const setPomodoroTimes = useCallback((focusMins: number, breakMins: number) => {
    const validFocus = Math.max(1, Math.min(120, focusMins));
    const validBreak = Math.max(1, Math.min(60, breakMins));
    setPomodoro((prev) => {
      const next: PomodoroState = {
        ...prev,
        focusMinutes: validFocus,
        breakMinutes: validBreak,
        timeLeft: prev.mode === 'focus' ? validFocus * 60 : validBreak * 60,
      };
      saveStoredPomodoro(next);
      return next;
    });
  }, []);

  const setMusicSource = useCallback((source: MusicSource) => {
    setMusicSourceState(source);
    saveStoredMusicSource(source);
    musicSourceRef.current = source;
    if (source === 'spotify') {
      setIsSpotifyPlaying(isPlaying);
      const targetVideoId = getSpotifyVideoId(spotifyPlaylistsRef.current[currentSpotifyIndexRef.current]);
      if (isPlaying && playerRef.current && isPlayerReadyRef.current && targetVideoId) {
        try {
          playerRef.current.loadVideoById(targetVideoId);
        } catch {
          // ignore
        }
      }
    } else {
      setIsSpotifyPlaying(false);
      const targetTrack = tracksRef.current[currentTrackIndexRef.current];
      if (isPlaying && playerRef.current && isPlayerReadyRef.current && targetTrack?.videoId) {
        try {
          playerRef.current.loadVideoById(targetTrack.videoId);
        } catch {
          // ignore
        }
      }
    }
  }, [isPlaying]);

  const addCustomSpotifyPlaylist = useCallback((url: string, title?: string): boolean => {
    const playlistId = extractSpotifyPlaylistId(url);
    if (!playlistId) return false;
    const uid = currentUser?.uid || null;
    const newPlaylist: SpotifyPlaylist = {
      id: `spotify-custom-${Date.now()}`,
      title: title && title.trim() ? title.trim() : 'Custom Spotify Playlist',
      category: 'study',
      categoryLabel: '⭐ My Favorite',
      playlistId,
      videoId: '0JvAPwUHLNk',
      curator: currentUser?.displayName || currentUser?.email || 'My Spotify Playlist',
      description: 'Custom user-saved Spotify playlist for deep work.',
      isCustom: true,
      addedByUid: uid || 'guest',
    };
    setMusicSourceState('spotify');
    saveStoredMusicSource('spotify');
    musicSourceRef.current = 'spotify';
    setSpotifyPlaylists((prev) => {
      const updated = [newPlaylist, ...prev];
      spotifyPlaylistsRef.current = updated;
      const customOnly = updated.filter((p) => p.isCustom);
      saveStoredCustomSpotifyPlaylists(customOnly, uid);
      return updated;
    });
    setCurrentSpotifyIndex(0);
    currentSpotifyIndexRef.current = 0;
    saveStoredLastSpotifyIndex(0);
    setIsSpotifyPlaying(true);
    setIsPlaying(true);
    setIsMiniPlayerOpen(true);
    shouldAutoPlayRef.current = true;
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        playerRef.current.loadVideoById('0JvAPwUHLNk');
      } catch {
        // ignore
      }
    }
    return true;
  }, [currentUser]);

  const removeCustomSpotifyPlaylist = useCallback((id: string) => {
    const uid = currentUser?.uid || null;
    setSpotifyPlaylists((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      const customOnly = updated.filter((p) => p.isCustom);
      saveStoredCustomSpotifyPlaylists(customOnly, uid);
      return updated;
    });
    setCurrentSpotifyIndex(0);
    saveStoredLastSpotifyIndex(0);
  }, [currentUser]);

  const currentTrack = tracks[currentTrackIndex] || tracks[0] || DEFAULT_TRACKS[0];
  const currentSpotifyPlaylist =
    spotifyPlaylists[currentSpotifyIndex] || spotifyPlaylists[0] || DEFAULT_SPOTIFY_PLAYLISTS[0];

  const value: FocusMusicContextType = {
    musicSource,
    setMusicSource,
    tracks,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    isPlayerOpen,
    isMiniPlayerOpen,
    setIsMiniPlayerOpen,
    openMiniPlayer,
    closeMiniPlayer,
    toggleMiniPlayer,
    volume,
    isMuted,
    pomodoro,
    play,
    pause,
    togglePlay,
    nextTrack,
    prevTrack,
    selectTrack,
    setVolume,
    toggleMute,
    openPlayer,
    closePlayer,
    togglePlayer,
    addCustomTrack,
    removeCustomTrack,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    setPomodoroTimes,
    trackError,
    clearTrackError,
    spotifyPlaylists,
    currentSpotifyIndex,
    currentSpotifyPlaylist,
    isSpotifyPlaying,
    setIsSpotifyPlaying,
    toggleSpotifyPlay,
    selectSpotifyPlaylist,
    addCustomSpotifyPlaylist,
    removeCustomSpotifyPlaylist,
  };

  return (
    <FocusMusicContext.Provider value={value}>
      {children}
      {/* Persistent Background Audio Container for YouTube Player */}
      <div
        id="youtube-focus-player-wrapper"
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: '0px',
          right: '0px',
          width: '240px',
          height: '180px',
          overflow: 'hidden',
          opacity: 0.02,
          pointerEvents: 'none',
          zIndex: -9999,
        }}
      >
        <div id="youtube-focus-iframe-container" style={{ width: '100%', height: '100%' }} />
      </div>
    </FocusMusicContext.Provider>
  );
}

export function useFocusMusicSafe(): FocusMusicContextType | null {
  return useContext(FocusMusicContext);
}

export function useFocusMusic(): FocusMusicContextType {
  const context = useContext(FocusMusicContext);
  if (!context) {
    throw new Error('useFocusMusic must be used within a FocusMusicProvider');
  }
  return context;
}

