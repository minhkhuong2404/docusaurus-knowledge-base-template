import {
  MusicTrack,
  DEFAULT_TRACKS,
  SpotifyPlaylist,
  DEFAULT_SPOTIFY_PLAYLISTS,
  MusicSource,
  PomodoroState,
} from '../types/focusMusic';

const STORAGE_LEGACY_CUSTOM_TRACKS_KEY = 'kb_focus_music_custom_tracks';
const STORAGE_VOLUME_KEY = 'kb_focus_music_volume';
const STORAGE_MUTED_KEY = 'kb_focus_music_muted';
const STORAGE_LAST_TRACK_KEY = 'kb_focus_music_last_track';

/**
 * Returns the user-scoped storage key for favorite custom tracks.
 * Each authenticated user has their own private playlist key.
 */
export function getUserCustomTracksKey(uid?: string | null): string {
  if (uid && uid.trim()) {
    return `kb_focus_music_custom_tracks_${uid.trim()}`;
  }
  return 'kb_focus_music_custom_tracks_guest';
}

/**
 * Extracts a 11-character YouTube video ID from arbitrary YouTube URLs or returns the input if already an ID.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already 11-char alphanumeric/dash/underscore
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch URLs, short links, embeds, and shorts
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);

  return match && match[1] ? match[1] : null;
}

export function getStoredCustomTracks(uid?: string | null): MusicTrack[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getUserCustomTracksKey(uid);
    let raw = window.localStorage.getItem(key);

    // Fallback: If guest and legacy storage key exists, migrate it
    if (!raw && !uid) {
      const legacyRaw = window.localStorage.getItem(STORAGE_LEGACY_CUSTOM_TRACKS_KEY);
      if (legacyRaw) {
        window.localStorage.setItem(key, legacyRaw);
        raw = legacyRaw;
      }
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomTracks(tracks: MusicTrack[], uid?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserCustomTracksKey(uid);
    window.localStorage.setItem(key, JSON.stringify(tracks));
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredVolume(): number {
  if (typeof window === 'undefined') return 70;
  try {
    const raw = window.localStorage.getItem(STORAGE_VOLUME_KEY);
    if (raw === null) return 70;
    const val = parseInt(raw, 10);
    return isNaN(val) ? 70 : Math.max(0, Math.min(100, val));
  } catch {
    return 70;
  }
}

export function saveStoredVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_VOLUME_KEY, String(volume));
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_MUTED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveStoredMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_MUTED_KEY, String(muted));
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredLastTrackIndex(totalTracks: number): number {
  if (typeof window === 'undefined' || totalTracks <= 0) return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_LAST_TRACK_KEY);
    if (raw === null) return 0;
    const val = parseInt(raw, 10);
    return isNaN(val) || val < 0 || val >= totalTracks ? 0 : val;
  } catch {
    return 0;
  }
}

export function saveStoredLastTrackIndex(index: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_LAST_TRACK_KEY, String(index));
  } catch {
    // Ignore storage quota errors
  }
}

export function getAllInitialTracks(uid?: string | null): MusicTrack[] {
  const custom = getStoredCustomTracks(uid);
  return [...DEFAULT_TRACKS, ...custom];
}

// ==========================================
// Spotify Playlists Storage & Link Parsing
// ==========================================

const STORAGE_LAST_SPOTIFY_INDEX_KEY = 'kb_focus_music_last_spotify_idx';
const STORAGE_MUSIC_SOURCE_KEY = 'kb_focus_music_source';

/**
 * Extracts a 22-character Spotify playlist ID from URLs, URIs, or direct IDs.
 * Examples:
 * - https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ?si=...
 * - spotify:playlist:37i9dQZF1DWZeKCadgRdKQ
 * - 37i9dQZF1DWZeKCadgRdKQ
 */
export function extractSpotifyPlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already 22-char alphanumeric
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering open.spotify.com/playlist/ and spotify:playlist:
  const regExp = /(?:spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]{22})/;
  const match = trimmed.match(regExp);

  return match && match[1] ? match[1] : null;
}

export function getUserCustomSpotifyKey(uid?: string | null): string {
  if (uid && uid.trim()) {
    return `kb_focus_music_spotify_playlists_${uid.trim()}`;
  }
  return 'kb_focus_music_spotify_playlists_guest';
}

export function getStoredCustomSpotifyPlaylists(uid?: string | null): SpotifyPlaylist[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getUserCustomSpotifyKey(uid);
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomSpotifyPlaylists(playlists: SpotifyPlaylist[], uid?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserCustomSpotifyKey(uid);
    window.localStorage.setItem(key, JSON.stringify(playlists));
  } catch {
    // Ignore storage quota errors
  }
}

export function getAllInitialSpotifyPlaylists(uid?: string | null): SpotifyPlaylist[] {
  const custom = getStoredCustomSpotifyPlaylists(uid);
  return [...DEFAULT_SPOTIFY_PLAYLISTS, ...custom];
}

export function getStoredMusicSource(): MusicSource {
  if (typeof window === 'undefined') return 'youtube';
  try {
    const raw = window.localStorage.getItem(STORAGE_MUSIC_SOURCE_KEY);
    return raw === 'spotify' ? 'spotify' : 'youtube';
  } catch {
    return 'youtube';
  }
}

export function saveStoredMusicSource(source: MusicSource): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_MUSIC_SOURCE_KEY, source);
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredLastSpotifyIndex(totalPlaylists: number): number {
  if (typeof window === 'undefined' || totalPlaylists <= 0) return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_LAST_SPOTIFY_INDEX_KEY);
    if (raw === null) return 0;
    const val = parseInt(raw, 10);
    return isNaN(val) || val < 0 || val >= totalPlaylists ? 0 : val;
  } catch {
    return 0;
  }
}

export function saveStoredLastSpotifyIndex(index: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_LAST_SPOTIFY_INDEX_KEY, String(index));
  } catch {
    // Ignore storage quota errors
  }
}

// ==========================================
// Pomodoro State Persistence (Timestamp-based across routes and reloads)
// ==========================================

const STORAGE_POMODORO_KEY = 'kb_focus_music_pomodoro_state';

export interface StoredPomodoroData {
  isRunning: boolean;
  timeLeft: number;
  mode: 'focus' | 'break';
  focusMinutes: number;
  breakMinutes: number;
  sessionsCompleted: number;
  targetEndTime?: number | null;
}

export function getStoredPomodoro(): PomodoroState {
  const defaultState: PomodoroState = {
    isRunning: false,
    timeLeft: 25 * 60,
    mode: 'focus',
    focusMinutes: 25,
    breakMinutes: 5,
    sessionsCompleted: 0,
  };

  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_POMODORO_KEY);
    if (!raw) return defaultState;
    const data: StoredPomodoroData = JSON.parse(raw);
    const focusMins = Math.max(1, Math.min(120, Number(data.focusMinutes) || 25));
    const breakMins = Math.max(1, Math.min(60, Number(data.breakMinutes) || 5));
    const mode: 'focus' | 'break' = data.mode === 'break' ? 'break' : 'focus';
    const sessions = Math.max(0, Number(data.sessionsCompleted) || 0);

    if (data.isRunning && data.targetEndTime) {
      const remaining = Math.round((data.targetEndTime - Date.now()) / 1000);
      if (remaining > 0) {
        return {
          isRunning: true,
          timeLeft: remaining,
          mode,
          focusMinutes: focusMins,
          breakMinutes: breakMins,
          sessionsCompleted: sessions,
        };
      } else {
        // Expired while navigating or away! Advance phase cleanly
        const nextMode = mode === 'focus' ? 'break' : 'focus';
        return {
          isRunning: false,
          timeLeft: (nextMode === 'focus' ? focusMins : breakMins) * 60,
          mode: nextMode,
          focusMinutes: focusMins,
          breakMinutes: breakMins,
          sessionsCompleted: mode === 'focus' ? sessions + 1 : sessions,
        };
      }
    }

    const savedLeft = Math.max(0, Number(data.timeLeft) || focusMins * 60);
    return {
      isRunning: false,
      timeLeft: savedLeft,
      mode,
      focusMinutes: focusMins,
      breakMinutes: breakMins,
      sessionsCompleted: sessions,
    };
  } catch {
    return defaultState;
  }
}

export function saveStoredPomodoro(p: PomodoroState): void {
  if (typeof window === 'undefined') return;
  try {
    const data: StoredPomodoroData = {
      isRunning: p.isRunning,
      timeLeft: p.timeLeft,
      mode: p.mode,
      focusMinutes: p.focusMinutes,
      breakMinutes: p.breakMinutes,
      sessionsCompleted: p.sessionsCompleted,
      targetEndTime: p.isRunning ? Date.now() + p.timeLeft * 1000 : null,
    };
    window.localStorage.setItem(STORAGE_POMODORO_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

