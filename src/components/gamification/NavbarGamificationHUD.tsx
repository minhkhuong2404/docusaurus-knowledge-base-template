import React, { useState } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import { getRankForLevel, getExpProgressInCurrentLevel } from '../../data/gamificationData';
import CosmicRankBadge from './CosmicRankBadge';
import GamificationModal from './GamificationModal';

export default function NavbarGamificationHUD() {
  const { gamification } = useUserProgress();
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'quests' | 'trophies' | 'ranks'>('quests');

  const exp = gamification.exp || 0;
  const { currentLevel, expInLevel, neededInLevel, percent } = getExpProgressInCurrentLevel(exp);
  const rank = getRankForLevel(currentLevel);
  const streak = gamification.streak?.currentStreak || 0;

  const handleOpen = (tab: 'quests' | 'trophies' | 'ranks' = 'quests') => {
    setModalTab(tab);
    setShowModal(true);
  };

  return (
    <>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          marginRight: '8px',
        }}
      >
        {/* Consolidated Single Gamification Pill */}
        <button
          type="button"
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
              <span>{streak}</span>
              <span>🔥</span>
            </span>
          )}

          {streak > 0 && <span style={{ opacity: 0.35, fontSize: '10px' }}>•</span>}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <CosmicRankBadge level={currentLevel} rank={rank} size="xs" showLevelPill={false} hideOrbitRing={true} disableFloat={true} />
            <span style={{ color: rank.color, fontWeight: 800 }}>{currentLevel}</span>
          </div>
        </button>
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
