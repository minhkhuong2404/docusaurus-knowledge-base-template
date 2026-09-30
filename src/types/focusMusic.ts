export type MusicCategory = 'study' | 'pomodoro' | 'relax' | 'ambient' | 'synthwave';

export interface MusicTrack {
  id: string;
  title: string;
  category: MusicCategory;
  categoryLabel: string;
  videoId: string;
  channel: string;
  duration?: string;
  views?: string;
  isCustom?: boolean;
  isFavorite?: boolean;
  addedByUid?: string;
}

export interface PomodoroState {
  isRunning: boolean;
  timeLeft: number; // in seconds
  mode: 'focus' | 'break';
  focusMinutes: number;
  breakMinutes: number;
  sessionsCompleted: number;
}

export const DEFAULT_TRACKS: MusicTrack[] = [
  // --- Study & Deep Work ---
  {
    id: 'track-study-yokohama',
    title: '2-Hour Study With Me • Calm Piano (A Rainy Day in Shibuya, Tokyo)',
    category: 'study',
    categoryLabel: 'Study With Me',
    videoId: '0JvAPwUHLNk',
    channel: 'Abao in Tokyo',
    duration: '2:00:00',
    views: '9M+ views',
  },
  {
    id: 'track-study-merve-rain',
    title: '7+ Hour Deep Work Study With Me on a Rainy Day • No Music',
    category: 'study',
    categoryLabel: 'Deep Work',
    videoId: 'yeLAayXmozI',
    channel: 'Merve',
    duration: '7:00:00',
    views: '20M views',
  },
  {
    id: 'track-chill-study-beats-2',
    title: 'Chill Study Beats 2 • Instrumental & Jazz Hip Hop',
    category: 'study',
    categoryLabel: 'Chillhop',
    videoId: 'gwDoRPcPxtc',
    channel: 'Chillhop Music',
    duration: '1:40:00',
    views: '45M views',
  },
  {
    id: 'track-study-coffee',
    title: 'Coffee Shop Radio ☕ - 24/7 Lofi & Chill Beats',
    category: 'study',
    categoryLabel: 'Study With Me',
    videoId: 'nZtFlrwCbs4',
    channel: 'Lofi Coffee & Beats',
    duration: 'Live / 24/7',
    views: '2M+ views',
  },
  {
    id: 'track-deep-study-lofigirl',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    category: 'study',
    categoryLabel: 'Deep Work',
    videoId: '5qap5aO4i9A',
    channel: 'Lofi Girl',
    duration: '1:00:00',
    views: '100M+ views',
  },
  {
    id: 'track-ghibli-coffee',
    title: 'Cozy Anime Coffee Shop ☕️ • Warm Lofi Study Beats',
    category: 'study',
    categoryLabel: 'Anime Lofi',
    videoId: 'TURbeWK2wwg',
    channel: 'Lofi Everyday',
    duration: '3:00:00',
    views: '12M views',
  },

  // --- Pomodoro Structured Sessions ---
  {
    id: 'track-pomodoro-tokyo-skyline',
    title: '5-Hour Sunset Pomodoro (50/10) • Tokyo Skyline at Sunset',
    category: 'pomodoro',
    categoryLabel: 'Pomodoro 50/10',
    videoId: 'YdtBEFK_HgI',
    channel: 'Abao in Tokyo',
    duration: '5:00:00',
    views: '7.9M views',
  },
  {
    id: 'track-pomodoro-sunset-3h',
    title: '3-Hour Golden Hour Pomodoro • Calm Lofi Beats',
    category: 'pomodoro',
    categoryLabel: 'Pomodoro Lofi',
    videoId: 'x0qcqPcEfoc',
    channel: 'Abao in Tokyo',
    duration: '3:00:00',
    views: '4.7M views',
  },
  {
    id: 'track-pomodoro-25-5',
    title: '25-Minute Pomodoro Study Session with Lofi Beats',
    category: 'pomodoro',
    categoryLabel: 'Pomodoro 25/5',
    videoId: 'WPni755-Krg',
    channel: 'Abao in Tokyo',
    duration: '25:00',
    views: '3M+ views',
  },

  // --- Relax & Cozy Ambience ---
  {
    id: 'track-cozy-cabin',
    title: 'Cozy Cabin Ambience • Rain & Fireplace Sounds at Night',
    category: 'relax',
    categoryLabel: 'Cozy Cabin',
    videoId: 'PTMFErX4PR4',
    channel: 'Calmed By Nature',
    duration: '8:00:00',
    views: '22M views',
  },
  {
    id: 'track-rainy-jazz-cafe',
    title: 'Rainy Day Cozy Coffee Shop - Calm Piano & Soft Rain',
    category: 'relax',
    categoryLabel: 'Rainy Jazz',
    videoId: '5yx6BWlEVcY',
    channel: 'Calm Cafe Beats',
    duration: '3:00:00',
    views: '3M+ views',
  },
  {
    id: 'track-mozart-brain-power',
    title: 'Classical Music for Brain Power • Mozart Study Mix',
    category: 'relax',
    categoryLabel: 'Classical Focus',
    videoId: 'mIYzp5rcTvU',
    channel: 'Classical Focus',
    duration: '2:30:00',
    views: '25M views',
  },
  {
    id: 'track-chopin-classical',
    title: 'Classical Masterpieces for Deep Concentration',
    category: 'relax',
    categoryLabel: 'Classical Focus',
    videoId: 'sjkrrmBnpWQ',
    channel: 'Classical Masterpieces',
    duration: '2:15:00',
    views: '15M views',
  },

  // --- Ambient & Piano ---
  {
    id: 'track-flying-piano',
    title: 'Flying: Relaxing Sleep & Study Music • Soft Piano & Strings',
    category: 'ambient',
    categoryLabel: 'Calm Piano',
    videoId: '1ZYbU82GVz4',
    channel: 'Soothing Relaxation',
    duration: '3:15:00',
    views: '500M+ views',
  },
  {
    id: 'track-ambient-piano',
    title: 'Beautiful Relaxing Piano for Deep Focus & Reading',
    category: 'ambient',
    categoryLabel: 'Calm Piano',
    videoId: '77ZozI0rw7w',
    channel: 'Soothing Relaxation',
    duration: '3:00:00',
    views: '10M+ views',
  },

  // --- Coding & Synthwave Beats ---
  {
    id: 'track-coding-deep-focus',
    title: 'Music for Work — Deep Focus Mix for Programming, Coding',
    category: 'synthwave',
    categoryLabel: 'Coding Beats',
    videoId: 'xAR6N9N8e6U',
    channel: 'Chill Music Lab',
    duration: '2:30:00',
    views: '6.9M views',
  },
  {
    id: 'track-endless-sunday',
    title: 'Endless Sunday • Chillhop & Instrumental Beats',
    category: 'synthwave',
    categoryLabel: 'Chillhop',
    videoId: 'D_uLM5i0Z4c',
    channel: 'Chillhop Music',
    duration: '1:15:00',
    views: '15M views',
  },
  {
    id: 'track-synthwave-badlands',
    title: 'B A D L A N D S • A Synthwave Mix for Galactic Explorers',
    category: 'synthwave',
    categoryLabel: 'Retrowave',
    videoId: '6aouLxiL4Cw',
    channel: 'INEXED',
    duration: '1:05:00',
    views: '2.5M views',
  },
  {
    id: 'track-synthwave-coding',
    title: 'Synthwave Radio 🌌 - Chill / Retro Beats to Code to',
    category: 'synthwave',
    categoryLabel: 'Coding Beats',
    videoId: '4xDzrJKXOOY',
    channel: 'Lofi Girl - Synthwave',
    duration: 'Live / 24/7',
    views: 'Millions / Live',
  },
];

export type MusicSource = 'youtube' | 'spotify';

export interface SpotifyPlaylist {
  id: string;
  title: string;
  category: MusicCategory;
  categoryLabel: string;
  playlistId: string;
  videoId?: string;
  coverImage?: string;
  curator: string;
  description: string;
  likes?: string;
  isCustom?: boolean;
  addedByUid?: string;
}

export const DEFAULT_SPOTIFY_PLAYLISTS: SpotifyPlaylist[] = [
  {
    id: 'spotify-deep-focus',
    title: 'Deep Focus',
    category: 'study',
    categoryLabel: 'Deep Work',
    playlistId: '37i9dQZF1DWZeKCadgRdKQ',
    videoId: '0JvAPwUHLNk',
    curator: 'Spotify Editorial',
    description: 'Keep calm and focus with ambient, post-rock, and atmospheric study music.',
    likes: '3.6M likes',
  },
  {
    id: 'spotify-lofi-beats',
    title: 'Lofi Beats',
    category: 'study',
    categoryLabel: 'Study With Me',
    playlistId: '37i9dQZF1DXdLEN7aqioXM',
    videoId: '5qap5aO4i9A',
    curator: 'Spotify Editorial',
    description: 'The definitive collection of chill lofi beats to relax, study, and focus.',
    likes: '5.4M likes',
  },
  {
    id: 'spotify-peaceful-piano',
    title: 'Peaceful Piano',
    category: 'ambient',
    categoryLabel: 'Calm Piano',
    playlistId: '37i9dQZF1DX4sWSpwq3LiO',
    videoId: '1ZYbU82GVz4',
    curator: 'Spotify Editorial',
    description: 'Peaceful solo piano to help you slow down, breathe, and concentrate.',
    likes: '7.3M likes',
  },
  {
    id: 'spotify-intense-studying',
    title: 'Intense Studying',
    category: 'pomodoro',
    categoryLabel: 'Pomodoro Focus',
    playlistId: '37i9dQZF1DX8NTLI2TtZa6',
    videoId: 'YdtBEFK_HgI',
    curator: 'Spotify Editorial',
    description: 'Deep focus instrumental piano for intense study sessions and revisions.',
    likes: '2.5M likes',
  },
  {
    id: 'spotify-brain-food',
    title: 'Brain Food',
    category: 'study',
    categoryLabel: 'Deep Work',
    playlistId: '37i9dQZF1DXdaF693bSZD4',
    videoId: 'mIYzp5rcTvU',
    curator: 'Spotify Editorial',
    description: 'Hypnotic electronic and downtempo beats for engineering and deep work.',
    likes: '3.2M likes',
  },
  {
    id: 'spotify-coding-mode',
    title: 'Coding Mode',
    category: 'synthwave',
    categoryLabel: 'Coding Beats',
    playlistId: '37i9dQZF1DX5trt9i14X7j',
    videoId: 'xAR6N9N8e6U',
    curator: 'Spotify Editorial',
    description: 'High-focus electronic and progressive tech soundscapes for programming.',
    likes: '800K+ likes',
  },
  {
    id: 'spotify-jazz-background',
    title: 'Jazz in the Background',
    category: 'relax',
    categoryLabel: 'Rainy Jazz',
    playlistId: '37i9dQZF1DWV7EzJMK2F7S',
    videoId: '5yx6BWlEVcY',
    curator: 'Spotify Editorial',
    description: 'Soft, vintage background jazz for coffee breaks, reading, and calm evenings.',
    likes: '2.7M likes',
  },
];
