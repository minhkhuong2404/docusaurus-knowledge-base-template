import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const exp = gamification.exp || 0;
  const { currentLevel, nextLevelExp, currentLevelExp, expInLevel, neededInLevel, percent } = getExpProgressInCurrentLevel(exp);
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
  const readPercent = Math.min(100, Math.round((readCount / (totalArticles || 1)) * 100));

  const quizTotalAnswered = progress.quizStats?.totalQuestionsAnswered || (progress.quizStats?.totalCorrectAnswers || 0);
  const quizCorrect = progress.quizStats?.totalCorrectAnswers || 0;
  const quizAccuracy = quizTotalAnswered > 0 ? Math.round((quizCorrect / quizTotalAnswered) * 100) : 0;

  const dsaSolved = (progress.dsaProgress?.solvedProblems || []).length;
  const totalDsaProblems = 150;
  const dsaPercent = Math.min(100, Math.round((dsaSolved / totalDsaProblems) * 100));

  const streakDays = gamification.streak?.currentStreak || 0;
  const longestStreak = gamification.streak?.longestStreak || streakDays;
  const shieldsRemaining = gamification.streak?.shieldsRemaining ?? 1;

  const filteredAchievements = ACHIEVEMENTS.filter((a) => {
    if (selectedCategory === 'all') return true;
    return a.category === selectedCategory;
  });

  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedAchievementIds.has(a.id)).length;
  const trophyPercent = Math.round((unlockedCount / (ACHIEVEMENTS.length || 1)) * 100);

  const readPagesList = progress.readPages || [];
  const javaReadCount = readPagesList.filter((p) => p.includes('java') || p.includes('spring')).length;
  const systemDesignReadCount = readPagesList.filter((p) => p.includes('system-design') || p.includes('architecture') || p.includes('kafka')).length;
  const devOpsReadCount = readPagesList.filter((p) => p.includes('devops') || p.includes('kubernetes') || p.includes('docker')).length;
  const databaseReadCount = readPagesList.filter((p) => p.includes('database') || p.includes('sql') || p.includes('postgresql')).length;
  const dsaReadCount = readPagesList.filter((p) => p.includes('dsa') || p.includes('leetcode')).length;

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
        @keyframes scaleUp { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .tab-btn:hover { background: rgba(255, 255, 255, 0.08) !important; color: #ffffff !important; }
        .filter-chip:hover { border-color: #38bdf8 !important; color: #38bdf8 !important; }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          borderRadius: '20px',
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(56, 189, 248, 0.15)',
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

        {/* Header Bar */}
        <div
          style={{
            padding: '20px 56px 16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <CosmicRankBadge level={currentLevel} rank={rank} size="sm" showLevelPill={false} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff' }}>
                    Level {currentLevel}
                  </span>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: `${rank.color}22`,
                      color: rank.color,
                      border: `1px solid ${rank.color}66`,
                    }}
                  >
                    {rank.tierRoman} • {rank.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                  {rank.description}
                </div>
              </div>
            </div>

            {/* Streak Badge */}
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '12px',
                background: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                fontSize: '0.9rem',
                color: '#fb923c',
              }}
            >
              <span>🔥</span>
              <span
                title="Earn +1 extra shield every 3 continuous learning days to protect your streak if missed"
                style={{ fontSize: '0.75rem', opacity: 0.9, marginLeft: '4px' }}
              >
                (🛡️ {gamification.streak?.shieldsRemaining ?? 3} / 3 Shields)
              </span>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', fontWeight: 600 }}>
              <span>EXP Progress to Level {currentLevel + 1}</span>
              <span style={{ color: '#38bdf8' }}>
                {expInLevel} / {neededInLevel} EXP ({percent}%)
              </span>
            </div>
            <div style={{ height: '8px', width: '100%', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${percent}%`,
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #38bdf8, #818cf8, #a855f7)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
            {[
              { id: 'quests', label: '🎯 Mission Control (Daily Quests)', badge: `${completedQuestIds.size}/3` },
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
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: isActive ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid transparent',
                    background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                        color: isActive ? '#0f172a' : 'rgba(255, 255, 255, 0.8)',
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

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: DAILY QUESTS & STREAKS */}
          {activeTab === 'quests' && (
            <div>
              {/* STREAK MILESTONE BADGES RIBBON */}
              <div
                style={{
                  marginBottom: '22px',
                  padding: '16px 18px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.5) 100%)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔥</span>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                      Continuous Streak Badges ({streakDays} Days Active)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#fb923c', fontWeight: 700 }}>
                    {STREAK_MILESTONES.filter((m) => streakDays >= m.days).length} / {STREAK_MILESTONES.length} Unlocked
                  </span>
                </div>

                {/* Horizontal Scrolling Badges Row */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                  }}
                >
                  {STREAK_MILESTONES.map((m) => {
                    const isUnlocked = streakDays >= m.days;
                    return (
                      <div
                        key={m.id}
                        style={{
                          minWidth: '110px',
                          maxWidth: '110px',
                          padding: '10px 8px',
                          borderRadius: '10px',
                          background: isUnlocked
                            ? `linear-gradient(180deg, ${m.color}22 0%, rgba(15, 23, 42, 0.85) 100%)`
                            : 'rgba(30, 41, 59, 0.35)',
                          border: isUnlocked ? `1px solid ${m.color}77` : '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                          boxShadow: isUnlocked ? `0 0 12px ${m.glow}` : 'none',
                        }}
                      >
                        <StreakBadgeSvg days={m.days} size={46} isUnlocked={isUnlocked} />
                        <div
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            color: isUnlocked ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                            marginTop: '6px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            width: '100%',
                          }}
                          title={m.title}
                        >
                          {m.title}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: isUnlocked ? m.color : 'rgba(255, 255, 255, 0.3)', fontWeight: 700, marginTop: '2px' }}>
                          +{m.expReward} EXP
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                    Today's Cosmic Missions ({today})
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Missions reset daily at 00:00 UTC. Complete all 3 to claim the Supernova Bounty Box!
                  </div>
                </div>

                <a
                  href="/arcade"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#c084fc',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>🕹️ Open Galactic Arcade</span>
                </a>
              </div>

              {/* Quest Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
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
                      style={{
                        padding: '16px',
                        borderRadius: '14px',
                        background: isDone ? 'rgba(52, 211, 153, 0.08)' : 'rgba(30, 41, 59, 0.45)',
                        border: isDone ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.6rem' }}>{quest.icon}</span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: isDone ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.15)',
                              color: isDone ? '#34d399' : '#fbbf24',
                              border: isDone ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(251, 191, 36, 0.4)',
                            }}
                          >
                            +{quest.expReward} EXP
                          </span>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', marginBottom: '4px' }}>
                          {quest.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.35, marginBottom: '14px' }}>
                          {quest.description}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px', fontWeight: 600 }}>
                          <span>Progress</span>
                          <span style={{ color: isDone ? '#34d399' : '#38bdf8' }}>
                            {progressClamped} / {quest.target} {isDone ? '✓' : ''}
                          </span>
                        </div>
                        <div style={{ height: '6px', width: '100%', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
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

              {/* 3/3 Supernova Bonus Box */}
              <div
                style={{
                  marginTop: '20px',
                  padding: '18px 20px',
                  borderRadius: '16px',
                  background: allQuestsDone
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: allQuestsDone ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '2rem' }}>🎁</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>
                      Supernova Bounty Box (3/3 Complete Bonus)
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                      Complete all 3 missions above to unlock +150 bonus EXP & cosmic glory!
                    </div>
                  </div>
                </div>

                {claimedBonus ? (
                  <div
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1px solid #34d399',
                      color: '#34d399',
                      fontWeight: 800,
                      fontSize: '0.85rem',
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
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: allQuestsDone ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: allQuestsDone
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: allQuestsDone ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: allQuestsDone ? 'pointer' : 'not-allowed',
                      boxShadow: allQuestsDone ? '0 0 20px rgba(245, 158, 11, 0.5)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {allQuestsDone ? '⚡ Claim +150 EXP Box' : 'Complete All Quests'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TROPHY CABINET */}
          {activeTab === 'trophies' && (
            <div>
              {/* Category Filter Bar */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'topics', label: '📜 Topics Codex' },
                  { id: 'knowledge', label: '📚 Knowledge' },
                  { id: 'quiz', label: '🎯 Quizzes' },
                  { id: 'dsa', label: '🧩 DSA' },
                  { id: 'streak', label: '🔥 Streaks' },
                  { id: 'arcade', label: '🕹️ Arcade' },
                ].map((cat) => {
                  const isSel = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className="filter-chip"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        border: isSel ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSel ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                        color: isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.78rem',
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

              {/* Achievement Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {filteredAchievements.map((ach) => {
                  const isUnlocked = unlockedAchievementIds.has(ach.id);

                  let userCount = 0;
                  if (ach.metric === 'read_pages') userCount = readCount;
                  if (ach.metric === 'quiz_correct') userCount = quizCorrect;
                  if (ach.metric === 'dsa_solved') userCount = dsaSolved;
                  if (ach.metric === 'streak_days') userCount = streakDays;
                  if (ach.metric === 'special') userCount = isUnlocked ? 1 : 0;
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
                        padding: '14px',
                        borderRadius: '12px',
                        background: isUnlocked ? 'rgba(30, 41, 59, 0.65)' : 'rgba(15, 23, 42, 0.4)',
                        border: isUnlocked ? `1px solid ${rarityColor}77` : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: isUnlocked ? `0 0 15px ${rarityColor}22` : 'none',
                        opacity: isUnlocked ? 1 : 0.65,
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: isUnlocked ? `${rarityColor}22` : 'rgba(255, 255, 255, 0.05)',
                          border: isUnlocked ? `1px solid ${rarityColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          flexShrink: 0,
                          filter: isUnlocked ? 'none' : 'grayscale(1)',
                        }}
                      >
                        {ach.category === 'streak' ? (
                          <StreakBadgeSvg days={ach.targetCount} size={36} isUnlocked={isUnlocked} />
                        ) : (
                          ach.icon
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ach.title}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              color: rarityColor,
                            }}
                          >
                            {ach.rarity}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px', lineHeight: 1.3 }}>
                          {ach.description}
                        </div>

                        <div style={{ marginTop: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '3px' }}>
                            <span>+{ach.expReward} EXP</span>
                            <span style={{ color: isUnlocked ? '#34d399' : 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>
                              {isUnlocked ? 'Unlocked ✓' : `${countClamped}/${ach.targetCount}`}
                            </span>
                          </div>
                          <div style={{ height: '4px', width: '100%', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${achPercent}%`,
                                borderRadius: '2px',
                                background: isUnlocked ? rarityColor : 'rgba(255, 255, 255, 0.3)',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: COSMIC RANKS */}
          {activeTab === 'ranks' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✨</span>
                    <span>Cosmic Engineering Hierarchy</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Level up your celestial rank through daily reading, algorithmic training, and architectural simulations.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <a
                    href="/stats"
                    onClick={() => onClose()}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>📊</span>
                    <span>Statistics and Telemetry ➔</span>
                  </a>

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={boostToGodLevel}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)',
                        border: '1.5px solid #fbbf24',
                        color: '#fbbf24',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 0 14px rgba(251, 191, 36, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span>⚡</span>
                      <span>Activate Super God Level (Lv. 185)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ========================================================= */}
              {/* 👑 CELESTIAL RANKS ROADMAP                               */}
              {/* ========================================================= */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {COSMIC_RANKS.map((r, idx) => {
                  const isCurrent = currentLevel >= r.minLevel && currentLevel <= r.maxLevel;
                  const isAchieved = currentLevel > r.maxLevel;

                  return (
                    <div
                      key={r.title}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: isCurrent
                          ? `linear-gradient(90deg, ${r.color}22 0%, rgba(15, 23, 42, 0.8) 100%)`
                          : 'rgba(30, 41, 59, 0.3)',
                        border: isCurrent
                          ? `1.5px solid ${r.color}`
                          : isAchieved
                          ? '1px solid rgba(52, 211, 153, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        boxShadow: isCurrent ? `0 0 20px ${r.borderGlow}` : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <CosmicRankBadge level={r.minLevel} rank={r} size="sm" showLevelPill={false} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.98rem', color: isCurrent ? r.color : '#ffffff' }}>
                              {r.tierRoman} • {r.title}
                            </span>
                            <span style={{ fontSize: '0.74rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'rgba(255, 255, 255, 0.7)' }}>
                              Levels {r.minLevel}–{r.maxLevel === 999 ? '∞' : r.maxLevel}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                            {r.description}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isCurrent ? (
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: r.color,
                              color: '#0f172a',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                            }}
                          >
                            Current Rank
                          </span>
                        ) : isAchieved ? (
                          <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.82rem' }}>✓ Mastered</span>
                        ) : (
                          <span style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '0.8rem' }}>Locked 🔒</span>
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
