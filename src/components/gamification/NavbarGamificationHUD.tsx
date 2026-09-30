import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import { useUserProgress } from '../../context/UserProgressContext';
import { getRankForLevel, getExpProgressInCurrentLevel } from '../../data/gamificationData';
import { subscribeToOnlineUsers } from '../../services/presenceService';
import { useFocusMusicSafe } from '../../context/FocusMusicContext';
import CosmicRankBadge from './CosmicRankBadge';



// Singleton presence listener across all route navigations
let globalOnlineCount = 1;
const globalOnlineListeners = new Set<(count: number) => void>();
let globalPresenceUnsub: (() => void) | null = null;
let globalPresenceTimer: ReturnType<typeof setTimeout> | null = null;

function ensureGlobalOnlinePresence() {
  if (typeof window === 'undefined') return;
  if (globalPresenceUnsub || globalPresenceTimer) return;

  globalPresenceTimer = setTimeout(() => {
    globalPresenceTimer = null;
    globalPresenceUnsub = subscribeToOnlineUsers((users) => {
      globalOnlineCount = users.length || 1;
      globalOnlineListeners.forEach((callback) => callback(globalOnlineCount));
    });
  }, 1000);
}

export default function NavbarGamificationHUD() {
  const { gamification } = useUserProgress();
  const [onlineCount, setOnlineCount] = useState<number>(() => globalOnlineCount);

  const exp = gamification?.exp || 0;
  const { currentLevel, expInLevel, neededInLevel } = getExpProgressInCurrentLevel(exp);
  const rank = getRankForLevel(currentLevel);
  const streak = gamification?.streak?.currentStreak || 0;

  // Real-time listener for total online count (persistent across route transitions)
  useEffect(() => {
    ensureGlobalOnlinePresence();
    const handleUpdate = (nextCount: number) => setOnlineCount(nextCount);
    globalOnlineListeners.add(handleUpdate);
    if (globalOnlineCount !== onlineCount) {
      setOnlineCount(globalOnlineCount);
    }
    return () => {
      globalOnlineListeners.delete(handleUpdate);
    };
  }, []);


  const focusMusic = useFocusMusicSafe();
  const pomodoro = focusMusic?.pomodoro;
  const isPomodoroActive = !!pomodoro && (pomodoro.isRunning || pomodoro.timeLeft < pomodoro.focusMinutes * 60 || pomodoro.sessionsCompleted > 0);
  const isFocus = pomodoro?.mode === 'focus';

  const formatPomodoroTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div
        className="gamification-hud-container"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {/* Dynamic Live Pomodoro Pill (Visible Across Website When Active) */}
        {isPomodoroActive && (
          <button
            type="button"
            onClick={() => focusMusic?.openPlayer()}
            title={`Pomodoro ${isFocus ? 'Focus' : 'Break'}: ${formatPomodoroTime(pomodoro.timeLeft)}. Click to open focus player.`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              height: '30px',
              borderRadius: '10px',
              backgroundColor: isFocus ? 'rgba(239, 68, 68, 0.14)' : 'rgba(245, 158, 11, 0.14)',
              border: isFocus ? '1px solid #ef4444' : '1px solid #f59e0b',
              color: isFocus ? '#ef4444' : '#f59e0b',
              fontSize: '11.5px',
              fontWeight: 800,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              cursor: 'pointer',
              boxShadow: isFocus ? '0 0 10px rgba(239, 68, 68, 0.25)' : '0 0 10px rgba(245, 158, 11, 0.25)',
              transition: 'transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
              outline: 'none',
            }}
          >
            <span>{isFocus ? '🍅' : '☕'}</span>
            <span>{formatPomodoroTime(pomodoro.timeLeft)}</span>
            <span style={{ fontSize: '10px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {pomodoro.isRunning ? (isFocus ? 'Focus' : 'Break') : 'Paused'}
            </span>
          </button>
        )}

        {/* Consolidated Gamification Level/Streak Pill */}
        <Link
          to="/profile"
          className="gamification-hud-pill"
          title={`Active Streak: ${streak}d • Level ${currentLevel} ${rank.title} (${expInLevel}/${neededInLevel} EXP). Click to view your Profile & Codex.`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 10px',
            height: '30px',
            borderRadius: '10px',
            background: 'var(--hud-pill-bg, linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%))',
            border: '1px solid var(--sidebar-border, rgba(255, 255, 255, 0.12))',
            color: 'var(--ifm-color-content, #ffffff)',
            fontSize: '12px',
            fontWeight: 700,
            textDecoration: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
          }}
        >
          {streak > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#fb923c', fontWeight: 800 }}>
              <span className="gamification-hud-num">{streak}</span>
              <span>🔥</span>
            </span>
          )}

          {streak > 0 && <span className="gamification-hud-dot" style={{ opacity: 0.35, fontSize: '10px' }}>•</span>}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <CosmicRankBadge level={currentLevel} rank={rank} size="xs" showLevelPill={false} hideOrbitRing={true} disableFloat={true} />
            <span className="gamification-hud-num" style={{ color: rank.color, fontWeight: 800 }}>{currentLevel}</span>
          </div>
        </Link>

        {/* Real-time Total Online Users Counter (Count Only) */}
        <div
          title={`${onlineCount} user${onlineCount === 1 ? '' : 's'} currently active`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 9px',
            height: '30px',
            borderRadius: '10px',
            backgroundColor: 'var(--sidebar-active-bg, rgba(52, 211, 153, 0.12))',
            border: '1px solid var(--sidebar-border, rgba(52, 211, 153, 0.3))',
            color: 'var(--brand-green, #34d399)',
            fontSize: '11.5px',
            fontWeight: 700,
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-green, #34d399)',
              boxShadow: '0 0 6px var(--brand-green, #34d399)',
              animation: 'pulse 1.8s infinite',
            }}
          />
          <span>{onlineCount} Online</span>
        </div>

        {/* Global Leaderboard Launcher Icon Button */}
        <Link
          to="/leaderboard"
          title="Global Architect Leaderboard & Rankings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '30px',
            height: '30px',
            borderRadius: '10px',
            backgroundColor: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            color: '#fbbf24',
            fontSize: '13px',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(251, 191, 36, 0.15)',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
        >
          🏆
        </Link>
      </div>
    </>
  );
}

