import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useUserProgress } from '../../context/UserProgressContext';
import {
  COSMIC_RANKS,
  getRankForLevel,
  getExpProgressInCurrentLevel,
  ACHIEVEMENTS,
  getTodayDateString,
  getQuestsForDate,
  AchievementCategory,
} from '../../data/gamificationData';
import { isTrackableArticle, TOTAL_TRACKABLE_ARTICLES_DEFAULT } from '../../utils/trackablePages';
import CosmicRankBadge from './CosmicRankBadge';
import StreakBadgeSvg, { STREAK_MILESTONES } from './StreakBadgeSvg';

interface GamificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'quests' | 'trophies' | 'ranks';
}

export default function GamificationModal({ isOpen, onClose, initialTab = 'quests' }: GamificationModalProps) {
  const { progress, gamification, claimQuestBonus, totalArticlesCount, boostToGodLevel, isSuperAdmin } = useUserProgress();
  const [activeTab, setActiveTab] = useState<'quests' | 'trophies' | 'ranks'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllMilestones, setShowAllMilestones] = useState(false);

  // Sync activeTab when initialTab prop updates
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const exp = gamification.exp || 0;
  const { currentLevel, expInLevel, neededInLevel, percent } = getExpProgressInCurrentLevel(exp);
  const rank = getRankForLevel(currentLevel);

  const today = getTodayDateString();
  const dailyQuests = getQuestsForDate(today);
  const questState = gamification.dailyQuests?.date === today ? gamification.dailyQuests : null;
  const completedQuestIds = new Set(questState?.completedQuestIds || []);
  const dailyCounts = questState?.dailyCounts || { readPagesCount: 0, quizAnsweredCount: 0, dsaSolvedCount: 0, gamesPlayedCount: 0 };
  const allQuestsDone = dailyQuests.every((q) => completedQuestIds.has(q.id));
  const claimedBonus = !!questState?.claimedBonus;

  const unlockedAchievementIds = new Set(gamification.unlockedAchievements || []);
  const readCount = (progress.readPages || []).filter(isTrackableArticle).length;
  const totalArticles = totalArticlesCount || TOTAL_TRACKABLE_ARTICLES_DEFAULT;

  const quizCorrect = progress.quizStats?.totalCorrectAnswers || 0;
  const dsaSolved = (progress.dsaProgress?.solvedProblems || []).length;

  const streakDays = gamification.streak?.currentStreak || 0;
  const shieldsRemaining = Math.max(0, Math.min(3, gamification.streak?.shieldsRemaining ?? 3));

  // Current Streak Milestones calculation
  const unlockedMilestones = STREAK_MILESTONES.filter((m) => streakDays >= m.days);
  const highestMilestone = unlockedMilestones.length > 0 ? unlockedMilestones[unlockedMilestones.length - 1] : null;
  const nextMilestone = STREAK_MILESTONES.find((m) => streakDays < m.days) || null;

  // Filter achievements based on category, status, and search query
  const filteredAchievements = ACHIEVEMENTS.filter((ach) => {
    const isUnlocked = unlockedAchievementIds.has(ach.id);
    if (statusFilter === 'unlocked' && !isUnlocked) return false;
    if (statusFilter === 'locked' && isUnlocked) return false;
    if (selectedCategory !== 'all' && ach.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = ach.title.toLowerCase().includes(q);
      const matchDesc = ach.description.toLowerCase().includes(q);
      const matchRarity = ach.rarity.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchRarity) return false;
    }
    return true;
  });

  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedAchievementIds.has(a.id)).length;
  const trophyPercent = Math.round((unlockedCount / (ACHIEVEMENTS.length || 1)) * 100);

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 999999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .tab-btn:hover { background: rgba(255, 255, 255, 0.08) !important; color: #ffffff !important; }
        .filter-chip:hover { border-color: #38bdf8 !important; color: #38bdf8 !important; }
        .quest-card:hover { transform: translateY(-2px); border-color: rgba(56, 189, 248, 0.4) !important; }
        .action-link-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .scrollable-body::-webkit-scrollbar { width: 6px; }
        .scrollable-body::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .scrollable-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .scrollable-body::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          borderRadius: '20px',
          background: 'linear-gradient(180deg, #0d1424 0%, #070a12 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(56, 189, 248, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Absolute Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 20,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'rgba(255, 255, 255, 0.75)',
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '15px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = '#ef4444';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
          }}
        >
          ✕
        </button>

        {/* ========================================================= */}
        {/* 🌟 STREAMLINED HEADER BAR                                */}
        {/* ========================================================= */}
        <div
          style={{
            padding: '20px 56px 16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(90deg, rgba(22, 33, 56, 0.6) 0%, rgba(13, 20, 36, 0.85) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            {/* Left: Level, Rank Pill, Description */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CosmicRankBadge level={currentLevel} rank={rank} size="sm" showLevelPill={false} hideOrbitRing={true} disableFloat={true} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
                    Level {currentLevel}
                  </span>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: `${rank.color}22`,
                      color: rank.color,
                      border: `1px solid ${rank.color}66`,
                    }}
                  >
                    {rank.tierRoman.replace(/•.*/, '').trim()} • {rank.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                  {rank.description.replace(/^Level [^:]+:\s*/, '')}
                </div>
              </div>
            </div>

            {/* Right: Clean Streak Pill */}
            <div
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                background: 'rgba(249, 115, 22, 0.12)',
                border: '1px solid rgba(249, 115, 22, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              title={`${streakDays} days continuous streak. Shields protect against missed days.`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800, fontSize: '0.86rem', color: '#fb923c' }}>
                <span>🔥</span>
                <span>{streakDays}d Streak</span>
              </div>
              <div style={{ height: '14px', width: '1px', background: 'rgba(249, 115, 22, 0.3)' }} />
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }} title={`${shieldsRemaining} of 3 streak shields available`}>
                {[1, 2, 3].map((shieldNum) => (
                  <span
                    key={shieldNum}
                    style={{
                      fontSize: '11px',
                      opacity: shieldNum <= shieldsRemaining ? 1 : 0.25,
                      filter: shieldNum <= shieldsRemaining ? 'drop-shadow(0 0 4px rgba(251, 146, 60, 0.5))' : 'none',
                    }}
                  >
                    🛡️
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Clean EXP Progress Bar */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.65)', marginBottom: '5px', fontWeight: 600 }}>
              <span>Progress to Level {currentLevel + 1}</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                {expInLevel.toLocaleString()} / {neededInLevel.toLocaleString()} EXP ({percent}%)
              </span>
            </div>
            <div style={{ height: '6px', width: '100%', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${percent}%`,
                  borderRadius: '3px',
                  background: 'linear-gradient(90deg, #38bdf8, #818cf8, #a855f7)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {/* Clean Segmented Tab Navigation */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
            {[
              { id: 'quests', label: '🎯 Daily Quests', badge: `${completedQuestIds.size}/3` },
              { id: 'trophies', label: '🏆 Trophy Codex', badge: `${unlockedCount}/${ACHIEVEMENTS.length}` },
              { id: 'ranks', label: '✨ Cosmic Ranks' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className="tab-btn"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '9px',
                    border: isActive ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid rgba(255, 255, 255, 0.06)',
                    background: isActive ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                        color: isActive ? '#090d16' : 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 800,
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 📜 SCROLLABLE BODY CONTENT                                */}
        {/* ========================================================= */}
        <div className="scrollable-body" style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {/* ========================================================= */}
          {/* TAB 1: DAILY QUESTS & STREAKS                             */}
          {/* ========================================================= */}
          {activeTab === 'quests' && (
            <div>
              {/* Daily Quests Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎯 Today's Missions</span>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>({today})</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Complete all 3 missions to unlock today's +150 EXP Supernova Bounty Box.
                  </div>
                </div>

                <a
                  href="/arcade"
                  className="action-link-btn"
                  style={{
                    padding: '5px 11px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#c084fc',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>🕹️ Galactic Arcade</span>
                </a>
              </div>

              {/* 3 Actionable Daily Quest Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {dailyQuests.map((quest) => {
                  const isDone = completedQuestIds.has(quest.id);
                  let currentProgress = 0;
                  if (quest.type === 'read_article') currentProgress = dailyCounts.readPagesCount;
                  if (quest.type === 'quiz_answer') currentProgress = dailyCounts.quizAnsweredCount;
                  if (quest.type === 'solve_dsa') currentProgress = dailyCounts.dsaSolvedCount;
                  if (quest.type === 'play_game') currentProgress = dailyCounts.gamesPlayedCount;
                  const progressClamped = Math.min(quest.target, currentProgress);
                  const questPercent = Math.min(100, Math.round((progressClamped / quest.target) * 100));

                  return (
                    <div
                      key={quest.id}
                      className="quest-card"
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: isDone ? 'rgba(52, 211, 153, 0.08)' : 'rgba(22, 33, 56, 0.45)',
                        border: isDone ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '150px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '1.4rem' }}>{quest.icon}</span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: isDone ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.15)',
                              color: isDone ? '#34d399' : '#fbbf24',
                              border: isDone ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(251, 191, 36, 0.4)',
                            }}
                          >
                            +{quest.expReward} EXP
                          </span>
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff', marginBottom: '3px' }}>
                          {quest.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.35, marginBottom: '10px' }}>
                          {quest.description}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px', fontWeight: 600 }}>
                          <span>Progress</span>
                          <span style={{ color: isDone ? '#34d399' : '#38bdf8', fontWeight: 700 }}>
                            {progressClamped} / {quest.target} {isDone ? '✓' : ''}
                          </span>
                        </div>
                        <div style={{ height: '5px', width: '100%', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${questPercent}%`,
                              borderRadius: '3px',
                              background: isDone
                                ? 'linear-gradient(90deg, #34d399, #10b981)'
                                : 'linear-gradient(90deg, #38bdf8, #3b82f6)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Supernova Bounty Box (Compact & Rewarding) */}
              <div
                style={{
                  marginBottom: '20px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: allQuestsDone
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: allQuestsDone ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.6rem' }}>🎁</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                      Supernova Bounty Box ({completedQuestIds.size}/3 Completed)
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                      Complete all 3 missions to unlock +150 bonus EXP!
                    </div>
                  </div>
                </div>

                {claimedBonus ? (
                  <div
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1px solid #34d399',
                      color: '#34d399',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                    }}
                  >
                    ✓ Claimed Today
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!allQuestsDone}
                    onClick={claimQuestBonus}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: allQuestsDone ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: allQuestsDone
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'rgba(255, 255, 255, 0.04)',
                      color: allQuestsDone ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: allQuestsDone ? 'pointer' : 'not-allowed',
                      boxShadow: allQuestsDone ? '0 0 16px rgba(245, 158, 11, 0.45)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {allQuestsDone ? '⚡ Claim +150 EXP' : 'Incomplete (3/3 Required)'}
                  </button>
                )}
              </div>

              {/* STREAMLINED STREAK MILESTONES (Replaces Endless 37 Ribbon) */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>🔥</span>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>
                      Streak Milestones ({streakDays} Days Active)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#fb923c', fontWeight: 700 }}>
                      {unlockedMilestones.length} / {STREAK_MILESTONES.length} Unlocked
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAllMilestones((v) => !v)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '2px 6px',
                    }}
                  >
                    {showAllMilestones ? 'Collapse ▲' : 'View All 37 Badges ▼'}
                  </button>
                </div>

                {/* Featured Milestones Spotlight (Highest Unlocked & Next Target) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {highestMilestone && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: `linear-gradient(135deg, ${highestMilestone.color}15 0%, rgba(15, 23, 42, 0.7) 100%)`,
                        border: `1px solid ${highestMilestone.color}55`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <StreakBadgeSvg days={highestMilestone.days} size={42} isUnlocked={true} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: highestMilestone.color, fontWeight: 800, textTransform: 'uppercase' }}>
                          Current Milestone ✓
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {highestMilestone.title} ({highestMilestone.days}d)
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.55)' }}>
                          +{highestMilestone.expReward} EXP claimed
                        </div>
                      </div>
                    </div>
                  )}

                  {nextMilestone ? (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(30, 41, 59, 0.3)',
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <StreakBadgeSvg days={nextMilestone.days} size={42} isUnlocked={false} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 800, textTransform: 'uppercase' }}>
                          Next Target ({nextMilestone.days - streakDays}d left)
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {nextMilestone.title} ({nextMilestone.days}d)
                        </div>
                        <div style={{ fontSize: '0.7rem', color: nextMilestone.color }}>
                          +{nextMilestone.expReward} EXP reward
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>👑</span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fbbf24' }}>
                          Max Streak Zenith Reached!
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          You have unlocked every streak badge in the system.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Full Milestone Drawer */}
                {showAllMilestones && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                      gap: '8px',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}
                  >
                    {STREAK_MILESTONES.map((m) => {
                      const isUnlocked = streakDays >= m.days;
                      return (
                        <div
                          key={m.id}
                          style={{
                            padding: '6px 4px',
                            borderRadius: '8px',
                            background: isUnlocked ? `${m.color}15` : 'rgba(255, 255, 255, 0.02)',
                            border: isUnlocked ? `1px solid ${m.color}44` : '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                          }}
                          title={`${m.title} (${m.days} days): ${m.subtitle}`}
                        >
                          <StreakBadgeSvg days={m.days} size={30} isUnlocked={isUnlocked} />
                          <div style={{ fontSize: '0.66rem', fontWeight: 800, color: isUnlocked ? '#ffffff' : 'rgba(255, 255, 255, 0.35)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                            {m.days}d
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: TROPHY CODEX (Searchable, Filterable, Organized)   */}
          {/* ========================================================= */}
          {activeTab === 'trophies' && (
            <div>
              {/* Codex Stats & Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🏆 Achievement Codex</span>
                    <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 800, background: 'rgba(52, 211, 153, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                      {unlockedCount} / {ACHIEVEMENTS.length} ({trophyPercent}%)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Track milestones across knowledge guides, quizzes, DSA drills, and streak milestones.
                  </div>
                </div>

                {/* Status Toggle (All / Unlocked / Locked) */}
                <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
                    { id: 'locked', label: `Locked (${ACHIEVEMENTS.length - unlockedCount})` },
                  ].map((filter) => {
                    const isSel = statusFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setStatusFilter(filter.id as any)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: isSel ? '#38bdf8' : 'transparent',
                          color: isSel ? '#090d16' : 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Bar & Category Chips */}
              <div style={{ marginBottom: '14px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search achievements (e.g. Kafka, Spring, Streak, 50)..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '9px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    outline: 'none',
                    marginBottom: '10px',
                  }}
                />

                {/* Category Filter Chips */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'knowledge', label: '📚 Knowledge' },
                    { id: 'quiz', label: '🎯 Quizzes' },
                    { id: 'dsa', label: '🧩 DSA' },
                    { id: 'streak', label: '🔥 Streaks' },
                    { id: 'topics', label: '📜 Topics' },
                    { id: 'arcade', label: '🕹️ Arcade' },
                    { id: 'leaderboard', label: '🏆 Leaderboard' },
                  ].map((cat) => {
                    const isSel = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className="filter-chip"
                        onClick={() => setSelectedCategory(cat.id as any)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '7px',
                          border: isSel ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: isSel ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          color: isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.65)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Achievements Grid */}
              {filteredAchievements.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.86rem' }}>
                  No achievements match your search filter.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
                  {filteredAchievements.map((ach) => {
                    const isUnlocked = unlockedAchievementIds.has(ach.id);

                    let userCount = 0;
                    if (ach.metric === 'read_pages') userCount = readCount;
                    if (ach.metric === 'quiz_correct') userCount = quizCorrect;
                    if (ach.metric === 'dsa_solved') userCount = dsaSolved;
                    if (ach.metric === 'streak_days') userCount = streakDays;
                    if (ach.metric === 'special' || ach.metric === 'leaderboard_rank') userCount = isUnlocked ? ach.targetCount : 0;
                    if (ach.metric === 'topic_completed' && ach.topicPrefix) {
                      userCount = (progress.readPages || []).filter((p) =>
                        p.toLowerCase().includes(ach.topicPrefix!.toLowerCase())
                      ).length;
                    }

                    const countClamped = Math.min(ach.targetCount, userCount);
                    const achPercent = Math.min(100, Math.round((countClamped / ach.targetCount) * 100));

                    const rarityColor =
                      ach.rarity === 'legendary'
                        ? '#fbbf24'
                        : ach.rarity === 'epic'
                        ? '#a855f7'
                        : ach.rarity === 'rare'
                        ? '#38bdf8'
                        : '#94a3b8';

                    return (
                      <div
                        key={ach.id}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          background: isUnlocked ? 'rgba(30, 41, 59, 0.55)' : 'rgba(15, 23, 42, 0.35)',
                          border: isUnlocked ? `1px solid ${rarityColor}55` : '1px solid rgba(255, 255, 255, 0.05)',
                          boxShadow: isUnlocked ? `0 0 12px ${rarityColor}15` : 'none',
                          opacity: isUnlocked ? 1 : 0.6,
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            background: isUnlocked ? `${rarityColor}20` : 'rgba(255, 255, 255, 0.04)',
                            border: isUnlocked ? `1px solid ${rarityColor}88` : '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0,
                            filter: isUnlocked ? 'none' : 'grayscale(1)',
                          }}
                        >
                          {ach.category === 'streak' ? (
                            <StreakBadgeSvg days={ach.targetCount} size={30} isUnlocked={isUnlocked} />
                          ) : (
                            ach.icon
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ach.title}
                            </span>
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                color: rarityColor,
                              }}
                            >
                              {ach.rarity}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px', lineHeight: 1.3 }}>
                            {ach.description}
                          </div>

                          <div style={{ marginTop: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px' }}>
                              <span>+{ach.expReward} EXP</span>
                              <span style={{ color: isUnlocked ? '#34d399' : 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>
                                {isUnlocked ? 'Unlocked ✓' : `${countClamped}/${ach.targetCount}`}
                              </span>
                            </div>
                            <div style={{ height: '3px', width: '100%', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${achPercent}%`,
                                  borderRadius: '2px',
                                  background: isUnlocked ? rarityColor : 'rgba(255, 255, 255, 0.25)',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: COSMIC RANKS ROADMAP                               */}
          {/* ========================================================= */}
          {activeTab === 'ranks' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✨ Cosmic Engineering Hierarchy</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Level up through daily reading, algorithmic training, and architectural simulations.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href="/stats"
                    onClick={() => onClose()}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>📊 Stats ➔</span>
                  </a>

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={boostToGodLevel}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
                        border: '1.5px solid #fbbf24',
                        color: '#fbbf24',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>⚡ Super God (Lv. 185)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* CELESTIAL RANKS ROADMAP LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {COSMIC_RANKS.map((r) => {
                  const isCurrent = currentLevel >= r.minLevel && currentLevel <= r.maxLevel;
                  const isAchieved = currentLevel > r.maxLevel;

                  return (
                    <div
                      key={r.title}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: isCurrent
                          ? `linear-gradient(90deg, ${r.color}20 0%, rgba(15, 23, 42, 0.75) 100%)`
                          : 'rgba(22, 33, 56, 0.25)',
                        border: isCurrent
                          ? `1.5px solid ${r.color}`
                          : isAchieved
                          ? '1px solid rgba(52, 211, 153, 0.25)'
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: isCurrent ? `0 0 16px ${r.borderGlow}` : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CosmicRankBadge level={r.minLevel} rank={r} size="sm" showLevelPill={false} hideOrbitRing={true} disableFloat={true} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isCurrent ? r.color : '#ffffff' }}>
                              {r.tierRoman.replace(/•.*/, '').trim()} • {r.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.07)', color: 'rgba(255, 255, 255, 0.65)' }}>
                              Levels {r.minLevel}–{r.maxLevel === 999 ? '∞' : r.maxLevel}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
                            {r.description.replace(/^Level [^:]+:\s*/, '')}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isCurrent ? (
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: r.color,
                              color: '#090d16',
                              fontWeight: 800,
                              fontSize: '0.74rem',
                            }}
                          >
                            Current Rank
                          </span>
                        ) : isAchieved ? (
                          <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.76rem' }}>✓ Mastered</span>
                        ) : (
                          <span style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '0.74rem' }}>Locked 🔒</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
