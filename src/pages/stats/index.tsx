import React, { useState, useMemo } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useUserProgress } from '../../context/UserProgressContext';
import {
  COSMIC_RANKS,
  getRankForLevel,
  getExpProgressInCurrentLevel,
  ACHIEVEMENTS,
  getTodayDateString,
  getQuestsForDate,
} from '../../data/gamificationData';
import { isTrackableArticle, TOTAL_TRACKABLE_ARTICLES_DEFAULT } from '../../utils/trackablePages';
import CosmicRankBadge from '../../components/gamification/CosmicRankBadge';
import { PROBLEMS } from '../../components/DSADashboard';
import GamificationModal from '../../components/gamification/GamificationModal';

export default function StatsPage(): React.JSX.Element {
  const { progress, gamification, currentUser, totalArticlesCount, formatTimeOnline } = useUserProgress();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'quests' | 'trophies' | 'ranks'>('quests');

  const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Learner';
  const email = currentUser?.email || 'Guest Explorer';

  // Gamification & Level
  const exp = gamification?.exp || 0;
  const { currentLevel, expInLevel, neededInLevel, percent: levelPercent } =
    getExpProgressInCurrentLevel(exp);
  const rank = getRankForLevel(currentLevel);

  // Streak & Shields
  const streakDays = gamification?.streak?.currentStreak || 0;
  const longestStreak = gamification?.streak?.longestStreak || streakDays;
  const shieldsRemaining = Math.max(0, Math.min(3, gamification?.streak?.shieldsRemaining ?? 3));

  // Trackable Articles
  const readPagesList = progress?.readPages || [];
  const readCount = readPagesList.filter(isTrackableArticle).length;
  const totalArticles = totalArticlesCount || TOTAL_TRACKABLE_ARTICLES_DEFAULT;
  const readPercent = Math.min(100, Math.round((readCount / (totalArticles || 1)) * 100));

  // Quizzes (Google Sheets 5,120 per topic = 15,360 total questions)
  const quizTotalAnswered =
    progress?.quizStats?.totalQuestionsAnswered || (progress?.quizStats?.totalCorrectAnswers || 0);
  const quizCorrect = progress?.quizStats?.totalCorrectAnswers || 0;
  const quizAccuracy = quizTotalAnswered > 0 ? Math.round((quizCorrect / quizTotalAnswered) * 100) : 0;
  const totalQuizPool = 15360;

  // DSA Solved
  const solvedProblems = progress?.dsaProgress?.solvedProblems || [];
  const dsaSolvedCount = solvedProblems.length;
  const totalDsaCount = PROBLEMS?.length || 150;
  const dsaPercent = Math.min(100, Math.round((dsaSolvedCount / totalDsaCount) * 100));

  // Difficulty breakdown for DSA
  const solvedSet = useMemo(() => new Set((solvedProblems || []).map(String)), [solvedProblems]);
  const easySolved = (PROBLEMS || []).filter((p) => p.difficulty === 'Easy' && solvedSet.has(String(p.id))).length;
  const mediumSolved = (PROBLEMS || []).filter((p) => p.difficulty === 'Medium' && solvedSet.has(String(p.id))).length;
  const hardSolved = (PROBLEMS || []).filter((p) => p.difficulty === 'Hard' && solvedSet.has(String(p.id))).length;

  // Achievements & Codex
  const unlockedAchievementIds = new Set(gamification?.unlockedAchievements || []);
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedAchievementIds.has(a.id)).length;
  const trophyPercent = Math.round((unlockedCount / (ACHIEVEMENTS.length || 1)) * 100);

  // Domain Breakdown
  const domains = [
    {
      title: 'Java Core',
      icon: '☕',
      count: readPagesList.filter((p) => p.includes('java')).length,
      topics: 'JVM internals, Concurrency, Virtual Threads, Collections',
      color: '#f59e0b',
      pool: '5,120 Qs',
    },
    {
      title: 'Spring Boot',
      icon: '🍃',
      count: readPagesList.filter((p) => p.includes('spring')).length,
      topics: 'AOP, Data JPA, Security, Cloud, WebFlux',
      color: '#4ade80',
      pool: '5,120 Qs',
    },
    {
      title: 'System Design',
      icon: '🏗️',
      count: readPagesList.filter((p) => p.includes('system-design') || p.includes('architecture') || p.includes('kafka')).length,
      topics: 'Kafka, Distributed Sagas, 2PC, CQRS, High-Scale',
      color: '#a855f7',
      pool: '5,120 Qs',
    },
    {
      title: 'DevOps & K8s',
      icon: '☸️',
      count: readPagesList.filter((p) => p.includes('devops') || p.includes('kubernetes') || p.includes('docker')).length,
      topics: 'Docker, Pod Lifecycles, GitOps, Observability',
      color: '#38bdf8',
      pool: 'Containers',
    },
    {
      title: 'Database & Storage',
      icon: '🗄️',
      count: readPagesList.filter((p) => p.includes('database') || p.includes('sql') || p.includes('postgresql')).length,
      topics: 'ACID, WAL, MVCC, B-Trees, Cassandra, Redis',
      color: '#f472b6',
      pool: 'Storage Engine',
    },
    {
      title: 'Core Security',
      icon: '🔐',
      count: readPagesList.filter((p) => p.includes('security') || p.includes('jwt') || p.includes('auth')).length,
      topics: 'JWT Revocation, OAuth2, PKCE, Rate Limiting',
      color: '#2dd4bf',
      pool: 'AuthN/Z',
    },
  ];

  const maxDomainCount = Math.max(1, ...domains.map((d) => d.count));

  const today = getTodayDateString();
  const dailyQuests = getQuestsForDate(today);
  const questState = gamification?.dailyQuests?.date === today ? gamification.dailyQuests : null;
  const completedQuestIds = new Set(questState?.completedQuestIds || []);
  const completedQuestsCount = dailyQuests.filter((q) => completedQuestIds.has(q.id)).length;

  const openGamification = (tab: 'quests' | 'trophies' | 'ranks') => {
    setModalTab(tab);
    setModalOpen(true);
  };

  return (
    <Layout
      title="Engineering Telemetry & Learning Stats"
      description="Comprehensive engineering learning analytics, reading progress, Google Sheets quiz performance, and DSA mastery."
    >
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#070a12',
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.12), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168, 85, 247, 0.08), transparent 70%)',
          color: '#f8fafc',
          padding: '24px 16px 70px',
        }}
      >
        <style>{`
          .stats-hero-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
          .stats-bento-card { transition: transform 0.2s ease, border-color 0.2s ease; }
          .stats-bento-card:hover { transform: translateY(-2px); border-color: rgba(56, 189, 248, 0.4) !important; }
          .domain-row:hover { background: rgba(255, 255, 255, 0.04) !important; }
        `}</style>

        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          {/* ========================================================= */}
          {/* 🌟 1. HERO PROFILE & TELEMETRY HEADER                     */}
          {/* ========================================================= */}
          <div
            style={{
              padding: '22px 24px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(22, 33, 56, 0.65) 0%, rgba(13, 20, 36, 0.85) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '18px',
              marginBottom: '24px',
            }}
          >
            {/* Left User Profile & Rank */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <CosmicRankBadge level={currentLevel} rank={rank} size="lg" showLevelPill={false} hideOrbitRing={true} disableFloat={true} />

              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    {name}
                  </h1>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: `${rank.color}22`,
                      color: rank.color,
                      border: `1px solid ${rank.color}66`,
                      fontWeight: 800,
                      fontSize: '0.78rem',
                    }}
                  >
                    Level {currentLevel} • {rank.title}
                  </span>
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.82rem', marginTop: '3px' }}>
                  {email} • <span style={{ color: '#38bdf8', fontWeight: 600 }}>Active Telemetry</span> • <span style={{ color: '#34d399', fontWeight: 600 }}>⏱️ {formatTimeOnline(progress?.totalTimeOnlineSeconds || 0)}</span>
                </div>

                {/* EXP Bar */}
                <div style={{ marginTop: '10px', width: '100%', maxWidth: '380px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '4px',
                    }}
                  >
                    <span>EXP to Level {currentLevel + 1}</span>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {expInLevel.toLocaleString()} / {neededInLevel.toLocaleString()} EXP ({levelPercent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${levelPercent}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${rank.color}, #38bdf8)`,
                        borderRadius: '3px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => openGamification('quests')}
                className="stats-hero-btn"
                style={{
                  padding: '8px 14px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(59, 130, 246, 0.18) 100%)',
                  border: '1px solid #38bdf8',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🎯</span>
                <span>Mission Control ({completedQuestsCount}/3)</span>
              </button>

              <button
                type="button"
                onClick={() => openGamification('trophies')}
                className="stats-hero-btn"
                style={{
                  padding: '8px 14px',
                  borderRadius: '9px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🏆</span>
                <span>Trophy Codex ({unlockedCount})</span>
              </button>

              <Link
                to="/arcade"
                className="stats-hero-btn"
                style={{
                  padding: '8px 14px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(236, 72, 153, 0.18) 100%)',
                  border: '1px solid #a855f7',
                  color: '#c084fc',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🕹️</span>
                <span>Galactic Arcade</span>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 📊 2. CORE TELEMETRY METRIC CARDS (4 BENTO GRID)          */}
          {/* ========================================================= */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            {/* 1. ARTICLES READ */}
            <div
              className="stats-bento-card"
              style={{
                padding: '16px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  📖 Documentation
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '1px 7px', borderRadius: '6px' }}>
                  {readPercent}% Read
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
                {readCount} <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)' }}>/ {totalArticles} Articles</span>
              </div>
              <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ width: `${readPercent}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* 2. GOOGLE SHEETS DAILY QUIZZES */}
            <div
              className="stats-bento-card"
              style={{
                padding: '16px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🎯 Quizzes (Live Sync)
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '1px 7px', borderRadius: '6px' }}>
                  {quizAccuracy}% Accuracy
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
                {quizTotalAnswered} <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)' }}>({quizCorrect} Correct)</span>
              </div>
              <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ width: `${Math.max(4, Math.min(100, (quizTotalAnswered / totalQuizPool) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* 3. DSA PROBLEM SOLVING */}
            <div
              className="stats-bento-card"
              style={{
                padding: '16px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🧩 DSA Problem Mastery
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', padding: '1px 7px', borderRadius: '6px' }}>
                  {dsaSolvedCount} / {totalDsaCount}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', padding: '2px 7px', borderRadius: '5px', fontWeight: 700 }}>
                  {easySolved} Easy
                </span>
                <span style={{ fontSize: '0.74rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)', padding: '2px 7px', borderRadius: '5px', fontWeight: 700 }}>
                  {mediumSolved} Med
                </span>
                <span style={{ fontSize: '0.74rem', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.12)', padding: '2px 7px', borderRadius: '5px', fontWeight: 700 }}>
                  {hardSolved} Hard
                </span>
              </div>
              <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ width: `${dsaPercent}%`, height: '100%', background: 'linear-gradient(90deg, #c084fc, #a855f7)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* 4. DAILY STREAK RECORD */}
            <div
              className="stats-bento-card"
              style={{
                padding: '16px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🔥 Streak Matrix
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fb923c', background: 'rgba(249, 115, 22, 0.15)', padding: '1px 7px', borderRadius: '6px' }}>
                  🛡️ {shieldsRemaining}/3 Shields
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
                {streakDays}d <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)' }}>Current (Peak: {longestStreak}d)</span>
              </div>
              <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ width: `${Math.min(100, (streakDays / 100) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #ef4444)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* 5. ACTIVE STUDY TIME */}
            <div
              className="stats-bento-card"
              style={{
                padding: '16px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ⏱️ Active Study Time
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 7px', borderRadius: '6px' }}>
                  Live Tracking
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
                {formatTimeOnline(progress?.totalTimeOnlineSeconds || 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '8px', lineHeight: 1.4 }}>
                Active reading, quizzes, algorithms & arcade
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 🧭 3. KNOWLEDGE DOMAIN MASTERY (Modern Unified Matrix)    */}
          {/* ========================================================= */}
          <div
            style={{
              padding: '22px 24px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(22, 33, 56, 0.5) 0%, rgba(13, 20, 36, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 15px 45px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🧭</span>
                  <span>Knowledge Domain Mastery</span>
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
                  Granular reading distribution across engineering core topics.
                </div>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 800, background: 'rgba(52, 211, 153, 0.12)', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                ⚡ 5,120 Questions / Topic Synced
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
              {domains.map((dom) => {
                const percentOfMax = Math.min(100, Math.round((dom.count / maxDomainCount) * 100));
                return (
                  <div
                    key={dom.title}
                    className="domain-row"
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1.1rem' }}>{dom.icon}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>{dom.title}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: dom.color }}>
                          {dom.count} read
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)', background: 'rgba(255, 255, 255, 0.05)', padding: '1px 5px', borderRadius: '4px' }}>
                          {dom.pool}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                      {dom.topics}
                    </div>

                    <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${percentOfMax}%`, height: '100%', background: dom.color, borderRadius: '2px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Modal connected to quick action buttons */}
      {modalOpen && (
        <GamificationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialTab={modalTab}
        />
      )}
    </Layout>
  );
}
