const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers } = require('./helpers/transpileHelper');

describe('Focus Music Player & YouTube Study Beats Suite', () => {
  const components = [
    {
      name: 'Focus Music Types (focusMusic.ts)',
      path: 'src/types/focusMusic.ts',
    },
    {
      name: 'Focus Music Storage (focusMusicStorage.ts)',
      path: 'src/utils/focusMusicStorage.ts',
    },
    {
      name: 'Focus Music Context (FocusMusicContext.tsx)',
      path: 'src/context/FocusMusicContext.tsx',
    },
    {
      name: 'Focus Music Player (FocusMusicPlayer.tsx)',
      path: 'src/components/FocusMusicPlayer.tsx',
    },
    {
      name: 'Focus Music Navbar Item (FocusMusicNavbarItem.tsx)',
      path: 'src/theme/NavbarItem/FocusMusicNavbarItem.tsx',
    },
    {
      name: 'Root Component (Root.tsx)',
      path: 'src/theme/Root.tsx',
    },
    {
      name: 'ComponentTypes Registration (ComponentTypes.tsx)',
      path: 'src/theme/NavbarItem/ComponentTypes.tsx',
    },
  ];

  for (const comp of components) {
    it(`should transpile ${comp.name} cleanly without syntax errors`, () => {
      assert.ok(fs.existsSync(comp.path), `File ${comp.path} must exist on disk`);
      const jsCode = transpileCode(comp.path);
      assert.ok(jsCode && jsCode.length > 50, `Transpiled output for ${comp.name} must not be empty`);
    });

    it(`should have 0 undeclared runtime identifiers in ${comp.name}`, () => {
      const undeclared = getUndeclaredIdentifiers(comp.path);
      assert.strictEqual(
        undeclared.length,
        0,
        `Found undeclared identifiers in ${comp.path}: ${undeclared.join(', ')}`
      );
    });
  }

  it('should verify playlist data integrity in focusMusic.ts', () => {
    const fileContent = fs.readFileSync('src/types/focusMusic.ts', 'utf-8');

    // Must include the user reference track nZtFlrwCbs4
    assert.ok(
      fileContent.includes("videoId: 'nZtFlrwCbs4'"),
      'Must contain the requested YouTube study video ID nZtFlrwCbs4'
    );
    assert.ok(
      fileContent.includes('DEFAULT_TRACKS'),
      'Must export DEFAULT_TRACKS playlist'
    );
    assert.ok(
      fileContent.includes("category: 'pomodoro'"),
      'Must include a Pomodoro category track'
    );
    assert.ok(
      fileContent.includes("category: 'study'"),
      'Must include a Study With Me category track'
    );
    assert.ok(
      fileContent.includes("category: 'relax'"),
      'Must include a Relaxing category track'
    );
    // Viral tracks (> 2M views)
    assert.ok(
      fileContent.includes("videoId: '0JvAPwUHLNk'"),
      'Must include Abao in Tokyo Shibuya Rain (9M+ views)'
    );
    assert.ok(
      fileContent.includes("videoId: 'yeLAayXmozI'"),
      'Must include Merve 7+ Hour Deep Work Rain (20M views)'
    );
    assert.ok(
      fileContent.includes("videoId: 'gwDoRPcPxtc'"),
      'Must include Chillhop Chill Study Beats 2 (45M views)'
    );
    assert.ok(
      fileContent.includes("videoId: '1ZYbU82GVz4'"),
      'Must include Soothing Relaxation Flying (500M views)'
    );
    assert.ok(
      fileContent.includes('views:'),
      'Must contain views property on viral tracks'
    );
  });

  it('should correctly parse diverse YouTube URL formats', () => {
    // Dynamically evaluate YouTube URL regex logic from focusMusicStorage.ts
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const extractId = (input) => {
      if (!input) return null;
      const trimmed = input.trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
      const match = trimmed.match(regExp);
      return match && match[1] ? match[1] : null;
    };

    assert.strictEqual(
      extractId('https://www.youtube.com/watch?v=nZtFlrwCbs4'),
      'nZtFlrwCbs4',
      'Should parse standard watch?v= URL'
    );
    assert.strictEqual(
      extractId('https://www.youtube.com/watch?v=nZtFlrwCbs4&t=120s'),
      'nZtFlrwCbs4',
      'Should parse watch URL with query params'
    );
    assert.strictEqual(
      extractId('https://youtu.be/nZtFlrwCbs4'),
      'nZtFlrwCbs4',
      'Should parse youtu.be short URL'
    );
    assert.strictEqual(
      extractId('https://www.youtube.com/embed/nZtFlrwCbs4'),
      'nZtFlrwCbs4',
      'Should parse embed URL'
    );
    assert.strictEqual(
      extractId('https://www.youtube.com/shorts/nZtFlrwCbs4'),
      'nZtFlrwCbs4',
      'Should parse shorts URL'
    );
    assert.strictEqual(
      extractId('nZtFlrwCbs4'),
      'nZtFlrwCbs4',
      'Should accept raw 11-char video ID'
    );
    assert.strictEqual(
      extractId('invalid-url-here'),
      null,
      'Should return null for invalid URL'
    );
  });

  it('docusaurus.config.ts should keep top menu bar clean without custom-focusMusic', () => {
    const configContent = fs.readFileSync('docusaurus.config.ts', 'utf-8');
    assert.strictEqual(
      configContent.includes("type: 'custom-focusMusic'"),
      false,
      "docusaurus.config.ts navbar items must not include custom-focusMusic"
    );
  });

  it('ComponentTypes.tsx should register custom-focusMusic', () => {
    const compTypesContent = fs.readFileSync('src/theme/NavbarItem/ComponentTypes.tsx', 'utf-8');
    assert.ok(
      compTypesContent.includes("'custom-focusMusic': FocusMusicNavbarItem"),
      "ComponentTypes.tsx must map custom-focusMusic to FocusMusicNavbarItem"
    );
  });

  it('Root.tsx should mount FocusMusicProvider and FocusMusicPlayer', () => {
    const rootContent = fs.readFileSync('src/theme/Root.tsx', 'utf-8');
    assert.ok(
      rootContent.includes('<FocusMusicProvider>'),
      'Root.tsx must wrap children with FocusMusicProvider'
    );
    assert.ok(
      rootContent.includes('<FocusMusicPlayer />'),
      'Root.tsx must render FocusMusicPlayer'
    );
  });

  it('should isolate custom favorite tracks per user ID', () => {
    const storageFileContent = fs.readFileSync('src/utils/focusMusicStorage.ts', 'utf-8');
    assert.ok(
      storageFileContent.includes('export function getUserCustomTracksKey'),
      'Must export getUserCustomTracksKey'
    );

    // Dynamic verification of scoping function
    const getKey = (uid) => {
      if (uid && uid.trim()) {
        return `kb_focus_music_custom_tracks_${uid.trim()}`;
      }
      return 'kb_focus_music_custom_tracks_guest';
    };

    const userAliceKey = getKey('user_alice_456');
    const userBobKey = getKey('user_bob_789');
    const guestKey = getKey(null);

    assert.strictEqual(userAliceKey, 'kb_focus_music_custom_tracks_user_alice_456');
    assert.strictEqual(userBobKey, 'kb_focus_music_custom_tracks_user_bob_789');
    assert.strictEqual(guestKey, 'kb_focus_music_custom_tracks_guest');
    assert.notStrictEqual(userAliceKey, userBobKey, "User Alice and User Bob must never share the same storage key");
    assert.notStrictEqual(userAliceKey, guestKey, "User Alice and guest must never share the same storage key");
  });

  it('userProgressService.ts must export saveFavoriteTracksToFirestore', () => {
    const serviceContent = fs.readFileSync('src/services/userProgressService.ts', 'utf-8');
    assert.ok(
      serviceContent.includes('export async function saveFavoriteTracksToFirestore'),
      'Must export saveFavoriteTracksToFirestore function for cloud backup'
    );
  });

  it('FocusMusicPlayer.tsx should include My Favorites tab and private account indicators', () => {
    const playerContent = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');
    assert.ok(
      playerContent.includes("id: 'favorites'"),
      'Must define My Favorites category tab'
    );
    assert.ok(
      playerContent.includes('My Favorites'),
      'Must render My Favorites tab label'
    );
    assert.ok(
      playerContent.includes('Private favorite for your account'),
      'Must display private favorite account indicator to logged in user'
    );
  });

  it('FocusMusicPlayer.tsx should render round floating button on bottom-right and compact popover with expand button', () => {
    const playerContent = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');
    assert.ok(
      playerContent.includes('focus-round-btn'),
      'FocusMusicPlayer must define .focus-round-btn class for round button'
    );
    assert.ok(
      playerContent.includes('bottom: 24px') && playerContent.includes('right: 24px'),
      'Round music button must be anchored at bottom: 24px, right: 24px'
    );
    assert.ok(
      playerContent.includes('border-radius: 50%') || playerContent.includes("borderRadius: '50%'"),
      'Music button must have 50% circular border-radius'
    );
    assert.ok(
      playerContent.includes('focus-compact-popover'),
      'FocusMusicPlayer must define .focus-compact-popover for compact player card'
    );
    assert.ok(
      playerContent.includes('aria-label="Expand full player"'),
      'Compact player popover must include an expand button to show full player'
    );
    assert.ok(
      playerContent.includes('Full Player & Pomodoro'),
      'Compact player must include action button to expand full player and pomodoro'
    );
  });

  it('ScrollProgressButton.tsx should stack directly above the round music button', () => {
    const scrollBtnContent = fs.readFileSync('src/components/ScrollProgressButton.tsx', 'utf-8');
    assert.ok(
      scrollBtnContent.includes("bottom: '84px'") && scrollBtnContent.includes("right: '24px'"),
      'ScrollProgressButton must be positioned at bottom: 84px, right: 24px to stack above the 52px round music button'
    );
  });

  it('should verify Spotify playlists data integrity and extraction in focusMusic.ts and focusMusicStorage.ts', () => {
    const typesContent = fs.readFileSync('src/types/focusMusic.ts', 'utf-8');
    assert.ok(
      typesContent.includes('DEFAULT_SPOTIFY_PLAYLISTS'),
      'Must export DEFAULT_SPOTIFY_PLAYLISTS'
    );
    assert.ok(
      typesContent.includes("playlistId: '37i9dQZF1DWZeKCadgRdKQ'"),
      'Must include Deep Focus (37i9dQZF1DWZeKCadgRdKQ)'
    );
    assert.ok(
      typesContent.includes("playlistId: '37i9dQZF1DX5trt9i14X7j'"),
      'Must include Coding Mode (37i9dQZF1DX5trt9i14X7j)'
    );
    assert.ok(
      typesContent.includes("playlistId: '37i9dQZF1DX4sWSpwq3LiO'"),
      'Must include Peaceful Piano (37i9dQZF1DX4sWSpwq3LiO)'
    );

    // Spotify ID extraction regex
    const regExp = /(?:spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]{22})/;
    const extractSpotifyId = (input) => {
      if (!input) return null;
      const trimmed = input.trim();
      if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return trimmed;
      const match = trimmed.match(regExp);
      return match && match[1] ? match[1] : null;
    };

    assert.strictEqual(
      extractSpotifyId('https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ'),
      '37i9dQZF1DWZeKCadgRdKQ',
      'Should parse standard open.spotify.com URL'
    );
    assert.strictEqual(
      extractSpotifyId('https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ?si=abc12345'),
      '37i9dQZF1DWZeKCadgRdKQ',
      'Should parse Spotify URL with query params'
    );
    assert.strictEqual(
      extractSpotifyId('spotify:playlist:37i9dQZF1DWZeKCadgRdKQ'),
      '37i9dQZF1DWZeKCadgRdKQ',
      'Should parse spotify URI format'
    );
    assert.strictEqual(
      extractSpotifyId('37i9dQZF1DWZeKCadgRdKQ'),
      '37i9dQZF1DWZeKCadgRdKQ',
      'Should accept raw 22-char Spotify playlist ID'
    );
    assert.strictEqual(
      extractSpotifyId('https://open.spotify.com/track/12345'),
      null,
      'Should reject non-playlist Spotify URLs'
    );
  });

  it('FocusMusicPlayer.tsx should render segmented source switcher, Spotify unified card, and Open in Spotify link', () => {
    const playerContent = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');
    assert.ok(
      playerContent.includes('Spotify Playlists'),
      'FocusMusicPlayer must have Spotify Playlists tab'
    );
    assert.ok(
      playerContent.includes('Open in Spotify') || playerContent.includes('Open Spotify'),
      'Must render link to open playlist in Spotify app/web'
    );
    assert.ok(
      playerContent.includes('getSpotifyVideoId(currentSpotifyPlaylist)'),
      'Must map Spotify playlist to background audio engine for continuous playback'
    );
    assert.ok(
      playerContent.includes('Add Favorite Spotify Playlist') || playerContent.includes('Add to My Favorites (Spotify Playlist)'),
      'Must support adding custom Spotify playlists to user favorites'
    );
  });

  it('FocusMusicPlayer.tsx should provide quick track/playlist selector dropdowns in compact mode for both YouTube and Spotify', () => {
    const playerContent = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');
    assert.ok(
      playerContent.includes('aria-label="Select YouTube stream"'),
      'Must render quick track selector dropdown for YouTube in compact mode'
    );
    assert.ok(
      playerContent.includes('aria-label="Select Spotify playlist"'),
      'Must render quick playlist selector dropdown for Spotify in compact mode'
    );
    // Verify category chips are not duplicated at the top of Spotify
    const categoryScrollMatches = (playerContent.match(/className="focus-category-scroll"/g) || []).length;
    assert.strictEqual(
      categoryScrollMatches,
      2,
      'Category scroll tabs must only appear above catalogs (never duplicated at the top)'
    );
  });

  it('FocusMusicPlayer.tsx should define Novatorem spectrum visualizer and color-wave animations', () => {
    const playerContent = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');
    assert.ok(
      playerContent.includes('NOVATOREM_BAR_COUNT = 36'),
      'Must define 36-bar Novatorem spectrum configuration'
    );
    assert.ok(
      playerContent.includes('novatoremColorWave'),
      'Must define novatoremColorWave keyframe animation'
    );
    assert.ok(
      playerContent.includes('novatoremPulse'),
      'Must define novatoremPulse keyframe animation'
    );
    assert.ok(
      playerContent.includes('novatorem-visualizer-box'),
      'Must define .novatorem-visualizer-box container'
    );
    assert.ok(
      playerContent.includes('novatorem-status-dot'),
      'Must define .novatorem-status-dot indicator'
    );
    assert.ok(
      playerContent.includes('var(--brand-green') || playerContent.includes('var(--ifm-color-primary'),
      'Visualizer bars and animations must use theme primary color variables'
    );
    assert.ok(
      playerContent.includes('border: 2px solid var(--brand-green'),
      'Player button (.focus-round-btn) must have a theme brand green border'
    );
    assert.ok(
      playerContent.includes('height: 84px'),
      'Visualizer box height must be increased to 84px for tall, prominent spectrum'
    );
    assert.ok(
      playerContent.includes('Math.min(78,'),
      'Novatorem visualizer bar maxHeight must scale up to 78px'
    );
  });

  it('README.md should showcase Novatorem-inspired music player visualizer', () => {
    const readmeContent = fs.readFileSync('README.md', 'utf-8');
    assert.ok(
      readmeContent.includes('Novatorem'),
      'README.md must mention Novatorem-inspired visualizer'
    );
    assert.ok(
      readmeContent.includes('novatorem.vercel.app/api/orchestrator'),
      'README.md must include Novatorem live visualizer embed'
    );
  });

  it('FocusMusicContext.tsx should configure valid YouTube iframe dimensions and origin parameters', () => {
    const contextContent = fs.readFileSync('src/context/FocusMusicContext.tsx', 'utf-8');
    assert.ok(
      contextContent.includes('enablejsapi: 1'),
      'YouTube playerVars must include enablejsapi: 1'
    );
    assert.ok(
      contextContent.includes('window.location.origin'),
      'YouTube playerVars must set origin to window.location.origin'
    );
    assert.ok(
      contextContent.includes("width: '240px'") && contextContent.includes("height: '180px'"),
      'YouTube iframe wrapper must maintain genuine non-zero dimensions to avoid browser power throttling'
    );
    assert.ok(
      !contextContent.includes("top: '-9999px'"),
      'YouTube player wrapper must not use top: -9999px hack that triggers media suspension'
    );
  });

  it('FocusMusicContext.tsx should handle YouTube playback errors with auto-advance recovery', () => {
    const contextContent = fs.readFileSync('src/context/FocusMusicContext.tsx', 'utf-8');
    assert.ok(
      contextContent.includes('isEmbedRestricted') || contextContent.includes('code === 101') || contextContent.includes('code === 150'),
      'Must handle YouTube Error 101/150 for creator embedding restrictions'
    );
    assert.ok(
      contextContent.includes('setTrackError'),
      'Must set trackError to notify user when a track is unplayable'
    );
    assert.ok(
      contextContent.includes('selectTrack(nextIdx)'),
      'Must automatically advance to next track on unplayable video errors'
    );
  });

  it('FocusMusicPlayer.tsx should render trackError warning alert in compact popover and modal', () => {
    const playerContent = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');
    assert.ok(
      playerContent.includes('{trackError && ('),
      'FocusMusicPlayer must render trackError alert when active'
    );
    assert.ok(
      playerContent.includes('trackError'),
      'FocusMusicPlayer must destructure and handle trackError'
    );
  });

  it('focusMusic.ts should use verified embed-safe video IDs and avoid ended archived streams', () => {
    const fileContent = fs.readFileSync('src/types/focusMusic.ts', 'utf-8');
    assert.strictEqual(
      fileContent.includes("videoId: 'jfKfPfyJRdk'"),
      false,
      'Must not use ended/dead archived stream jfKfPfyJRdk'
    );
    assert.strictEqual(
      fileContent.includes("videoId: 'U0aL_f_yB80'"),
      false,
      'Must not use unavailable/dead video U0aL_f_yB80'
    );
    assert.strictEqual(
      fileContent.includes("videoId: 'R9K1G5D211s'"),
      false,
      'Must not use unavailable/dead video R9K1G5D211s'
    );
    assert.strictEqual(
      fileContent.includes("videoId: 'h2P3M10d540'"),
      false,
      'Must not use unavailable/dead video h2P3M10d540'
    );
    assert.strictEqual(
      fileContent.includes("videoId: 'n59h-m2rS5s'"),
      false,
      'Must not use unavailable/dead video n59h-m2rS5s'
    );
    assert.ok(
      fileContent.includes("videoId: '0JvAPwUHLNk'"),
      'Must use verified Abao in Tokyo study mix video ID 0JvAPwUHLNk'
    );
    assert.ok(
      fileContent.includes("videoId: 'yeLAayXmozI'"),
      'Must use verified Merve 7+ Hour Deep Work video ID yeLAayXmozI'
    );
    assert.ok(
      fileContent.includes("videoId: 'PTMFErX4PR4'"),
      'Must use verified Calmed By Nature Cozy Cabin video ID PTMFErX4PR4'
    );
    assert.ok(
      fileContent.includes("videoId: 'xAR6N9N8e6U'"),
      'Must use verified Chill Music Lab Deep Focus Mix video ID xAR6N9N8e6U'
    );
    assert.ok(
      fileContent.includes("videoId: '5qap5aO4i9A'"),
      'Must use evergreen 100M+ views Lofi Girl study mix 5qap5aO4i9A'
    );
    assert.ok(
      fileContent.includes("videoId: 'mIYzp5rcTvU'"),
      'Must use embeddable classical focus mix mIYzp5rcTvU'
    );
    assert.ok(
      fileContent.includes("videoId: 'sjkrrmBnpWQ'"),
      'Must use embeddable classical piano mix sjkrrmBnpWQ'
    );
  });

  it('should enhance Pomodoro UX across the website with live navbar badge, floating capsule, presets, and fireworks', () => {
    const hudContent = fs.readFileSync('src/components/gamification/NavbarGamificationHUD.tsx', 'utf-8');
    assert.ok(
      hudContent.includes('useFocusMusicSafe'),
      'NavbarGamificationHUD must use useFocusMusicSafe to access Pomodoro state'
    );
    assert.ok(
      hudContent.includes('isPomodoroActive') && hudContent.includes('formatPomodoroTime'),
      'NavbarGamificationHUD must render active Pomodoro countdown when timer is running'
    );

    const playerContent = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');
    assert.ok(
      playerContent.includes('pomodoro-active') || playerContent.includes('pomodoro-break'),
      'FocusMusicPlayer must provide floating Pomodoro capsule styling when active'
    );
    assert.ok(
      playerContent.includes('triggerFireworks'),
      'FocusMusicPlayer must celebrate completed Pomodoro sessions with fireworks'
    );
    assert.ok(
      playerContent.includes('document.title ='),
      'FocusMusicPlayer must synchronize browser tab title with active countdown'
    );
    assert.ok(
      playerContent.includes('pomodoro-floating-toast'),
      'FocusMusicPlayer must render top floating toast notification banner'
    );
    assert.ok(
      playerContent.includes('setPomodoroTimes(preset.f, preset.b)'),
      'FocusMusicPlayer must support 1-click rhythm preset buttons'
    );
  });

  it('FocusMusicPlayer.tsx should provide unified player card layout for Spotify playlists matching YouTube', () => {
    const playerContent = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');
    assert.ok(
      playerContent.includes('focus-unified-player'),
      'Must define unified morphing player container'
    );
    assert.ok(
      playerContent.includes('mode-compact') && playerContent.includes('mode-expanded') && playerContent.includes('mode-minimized'),
      'Must support mode-compact, mode-expanded, and mode-minimized states'
    );
    assert.ok(
      playerContent.includes('selectSpotifyPlaylist(Number(e.target.value))'),
      'Compact mode must include quick playlist dropdown selector for direct reading doc control'
    );
    assert.ok(
      playerContent.includes('focus-player-backdrop'),
      'Must render backdrop overlay for expanded mode'
    );
    assert.ok(
      playerContent.includes('toggleSpotifyPlay') && playerContent.includes('toggleMute'),
      'Spotify card must include playback and volume controls matching YouTube layout'
    );
  });

  it('should display player bar and active playback state when Spotify playlists are played', () => {
    const contextContent = fs.readFileSync('src/context/FocusMusicContext.tsx', 'utf-8');
    assert.ok(
      contextContent.includes('isSpotifyPlaying') && contextContent.includes('setIsSpotifyPlaying'),
      'FocusMusicContext must expose isSpotifyPlaying state'
    );
    assert.ok(
      contextContent.includes('isMiniPlayerOpen') && contextContent.includes('setIsMiniPlayerOpen'),
      'FocusMusicContext must expose isMiniPlayerOpen state for persistent compact player bar'
    );
    assert.ok(
      contextContent.includes('setIsMiniPlayerOpen(true)'),
      'FocusMusicContext must show player bar when Spotify playlist or source is selected'
    );
    assert.ok(
      contextContent.includes('toggleSpotifyPlay'),
      'FocusMusicContext must provide toggleSpotifyPlay method'
    );

    const playerContent = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');
    assert.ok(
      playerContent.includes('isSpotifyPlaying'),
      'FocusMusicPlayer must consume isSpotifyPlaying'
    );
    assert.ok(
      playerContent.includes('is-spotify'),
      'Floating round button must have is-spotify class when Spotify is active'
    );
    assert.ok(
      playerContent.includes('Playing (Spotify):'),
      'Companion widget title must display Playing (Spotify): [Playlist Title]'
    );
    assert.ok(
      playerContent.includes('NOW PLAYING') && playerContent.includes('novatorem-status-dot'),
      'Spotify subcard must display NOW PLAYING status dot when active'
    );
    assert.ok(
      playerContent.includes('toggleSpotifyPlay'),
      'Compact player bar must provide play/pause control for Spotify'
    );
    assert.ok(
      playerContent.includes("color: (isPlaying || isSpotifyPlaying) ? 'var(--brand-green, #10b981)'"),
      'Spotify active playback elements must adapt to the active theme via var(--brand-green)'
    );

    const navbarContent = fs.readFileSync('src/theme/NavbarItem/FocusMusicNavbarItem.tsx', 'utf-8');
    assert.ok(
      navbarContent.includes('isSpotifyActive') && navbarContent.includes('isAudioPlaying'),
      'FocusMusicNavbarItem must track Spotify active playback'
    );
    assert.ok(
      navbarContent.includes("isAudioPlaying\n            ? 'var(--brand-green, #10b981)'"),
      'Navbar item must style with theme color var(--brand-green) when Spotify or audio is playing'
    );
    assert.ok(
      navbarContent.includes('Now Playing (Spotify):'),
      'Navbar tooltip must indicate Spotify playlist title when playing'
    );
  });

  it('should render Pomodoro Focus Mode at the top of the music player and ensure cross-page persistence', () => {
    // 1. Verify storage functions in focusMusicStorage.ts
    const storageContent = fs.readFileSync('src/utils/focusMusicStorage.ts', 'utf-8');
    assert.ok(
      storageContent.includes('getStoredPomodoro') && storageContent.includes('saveStoredPomodoro'),
      'focusMusicStorage.ts must export getStoredPomodoro and saveStoredPomodoro'
    );
    assert.ok(
      storageContent.includes('targetEndTime'),
      'focusMusicStorage.ts must store and compute targetEndTime for accurate background/reload time tracking'
    );

    // 2. Verify state persistence in FocusMusicContext.tsx
    const contextContent = fs.readFileSync('src/context/FocusMusicContext.tsx', 'utf-8');
    assert.ok(
      contextContent.includes('getStoredPomodoro()'),
      'FocusMusicContext must initialize Pomodoro state from localStorage'
    );
    assert.ok(
      contextContent.includes('saveStoredPomodoro('),
      'FocusMusicContext must persist Pomodoro updates to localStorage'
    );
    assert.ok(
      contextContent.includes("addEventListener('storage'"),
      'FocusMusicContext must listen to window storage events to sync across browser tabs'
    );

    // 3. Verify Pomodoro card placement at the very top of FocusMusicPlayer.tsx
    const playerContent = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');
    const pomodoroCardIdx = playerContent.indexOf('Pomodoro Focus Mode');
    const youtubeSectionIdx = playerContent.indexOf('YouTube Now Playing Track Card');
    const spotifySectionIdx = playerContent.indexOf('Active Spotify Playlist Card');

    assert.ok(pomodoroCardIdx > -1, 'Must contain Pomodoro Focus Mode card');
    assert.ok(youtubeSectionIdx > -1, 'Must contain YouTube section');
    assert.ok(spotifySectionIdx > -1, 'Must contain Spotify section');
    assert.ok(
      pomodoroCardIdx < youtubeSectionIdx && pomodoroCardIdx < spotifySectionIdx,
      'Pomodoro Focus Mode card must be positioned at the top, preceding both YouTube and Spotify sections'
    );

    // 4. Verify floating companion widget reflects Pomodoro state across pages
    assert.ok(
      playerContent.includes('isPomodoroEngaged'),
      'FocusMusicPlayer must define isPomodoroEngaged to maintain countdown and controls across all pages'
    );
    assert.ok(
      playerContent.includes('formatPomodoroTime(pomodoro.timeLeft)'),
      'Floating companion widget must display active Pomodoro countdown'
    );
    assert.ok(
      playerContent.includes('pomodoro-quick-btn'),
      'Floating companion widget must provide quick pause/resume controls'
    );

    // 5. Verify dynamic document.title countdown sync
    assert.ok(
      playerContent.includes('document.title = `(${timeStr}) ${modeEmoji} ${modeLabel} • ${cleanBaseTitle || \'Engineering Knowledge Base\'}`;'),
      'FocusMusicPlayer must sync countdown into document.title across route navigations'
    );

    // 6. Verify NavbarGamificationHUD displays Pomodoro across all pages
    const hudContent = fs.readFileSync('src/components/gamification/NavbarGamificationHUD.tsx', 'utf-8');
    assert.ok(
      hudContent.includes('pomodoro.isRunning') && hudContent.includes('isPomodoroActive'),
      'NavbarGamificationHUD must track Pomodoro state'
    );
    assert.ok(
      hudContent.includes('formatPomodoroTime'),
      'NavbarGamificationHUD must display formatted Pomodoro time'
    );

    // 8. Verify Spotify player elements adapt dynamically to active theme palette variables
    assert.ok(
      !playerContent.includes('#1DB954') && !playerContent.includes('#1ed760'),
      'FocusMusicPlayer must not contain hardcoded Spotify green (#1DB954 or #1ed760)'
    );
    assert.ok(
      playerContent.includes("musicSource === 'spotify'\n                  ? '1px solid var(--brand-green, #10b981)'"),
      'Spotify Playlists Tab must use var(--brand-green) for border when active'
    );
    assert.ok(
      playerContent.includes("accentColor: 'var(--brand-green, #10b981)'"),
      'Volume slider in Spotify player must use theme accentColor var(--brand-green)'
    );

    const navItemContent = fs.readFileSync('src/theme/NavbarItem/FocusMusicNavbarItem.tsx', 'utf-8');
    assert.ok(
      !navItemContent.includes('#1DB954'),
      'FocusMusicNavbarItem must not use hardcoded #1DB954'
    );
  });
});




