import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import { useUserProgress } from '../../context/UserProgressContext';
import { getRankForLevel, getExpProgressInCurrentLevel } from '../../data/gamificationData';
import { subscribeToOnlineUsers } from '../../services/presenceService';
import CosmicRankBadge from './CosmicRankBadge';
import GamificationModal from './GamificationModal';

export default function NavbarGamificationHUD() {
  const { gamification } = useUserProgress();
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'quests' | 'trophies' | 'ranks'>('quests');
  const [onlineCount, setOnlineCount] = useState<number>(1);

  const exp = gamification?.exp || 0;
  const { currentLevel, expInLevel, neededInLevel } = getExpProgressInCurrentLevel(exp);
  const rank = getRankForLevel(currentLevel);
  const streak = gamification?.streak?.currentStreak || 0;

  // Real-time listener for total online count (no individual details exposed)
  useEffect(() => {
    const unsub = subscribeToOnlineUsers((users) => {
      setOnlineCount(users.length || 1);
    });
    return () => unsub();
  }, []);

  const handleOpen = (tab: 'quests' | 'trophies' | 'ranks' = 'quests') => {
    setModalTab(tab);
    setShowModal(true);
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
        {/* Consolidated Gamification Level/Streak Pill */}
        <button
          type="button"
          className="gamification-hud-pill"
          onClick={() => handleOpen('quests')}
          title={`Active Streak: ${streak}d • Level ${currentLevel} ${rank.title} (${expInLevel}/${neededInLevel} EXP). Click for Mission Control.`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 10px',
            height: '30px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)`,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
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
        </button>

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
            backgroundColor: 'rgba(52, 211, 153, 0.12)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            color: '#34d399',
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
              backgroundColor: '#34d399',
              boxShadow: '0 0 6px #34d399',
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

      {showModal && (
        <GamificationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          initialTab={modalTab}
        />
      )}
    </>
  );
}

