import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
import {
  UserProgressData,
  defaultGamificationState,
} from '../../services/userProgressService';
import { isTrackableArticle, TOTAL_TRACKABLE_ARTICLES_DEFAULT } from '../../utils/trackablePages';
import CosmicRankBadge from '../../components/gamification/CosmicRankBadge';
import StreakBadgeSvg, { STREAK_MILESTONES } from '../../components/gamification/StreakBadgeSvg';
import { PROBLEMS } from '../../components/DSADashboard';

export default function ProfilePage(): React.JSX.Element {
  const {
    progress: myProgress,
    gamification: myGamification,
    currentUser,
    totalArticlesCount,
    formatTimeOnline,
    claimQuestBonus,
    boostToGodLevel,
    isSuperAdmin,
  } = useUserProgress();

  const location = useLocation();

  // Parse query params (tab & target user UID)
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // Support dedicated profile URLs:
  // - /profile?uid=<targetUid>
  // - /profile?user=<targetUid>
  // - /profile?id=<targetUid>
  // - /profile#<targetUid>
  // - /profile/<targetUid> (client-side subpath)
  const targetUid = useMemo(() => {
    const qUid = searchParams.get('uid') || searchParams.get('user') || searchParams.get('id');
    if (qUid) return qUid.trim();
    if (location.hash && location.hash.length > 1 && !location.hash.includes('=')) {
      return location.hash.substring(1).trim();
    }
    const cleanPath = location.pathname.replace(/^\/profile\/?/, '').replace(/\/$/, '').trim();
    if (cleanPath && cleanPath !== 'profile' && !cleanPath.includes('/')) {
      return cleanPath;
    }
    return null;
  }, [searchParams, location.hash, location.pathname]);

  const isViewingOtherUser = Boolean(targetUid && (!currentUser || currentUser.uid !== targetUid));

  // Detect initial tab from URL query params (e.g. /profile?tab=codex or /profile?tab=quests)
  const initialTab = useMemo<'telemetry' | 'codex' | 'quests'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'codex' || tabParam === 'trophies' || tabParam === 'achievements') return 'codex';
    if (tabParam === 'quests' || tabParam === 'ranks' || tabParam === 'missions') return 'quests';
    return 'telemetry';
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<'telemetry' | 'codex' | 'quests'>(initialTab);

  // Sync tab if URL changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: 'telemetry' | 'codex' | 'quests') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'telemetry') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // State for fetching target user profile if viewing another user
  const [otherUserData, setOtherUserData] = useState<UserProgressData | null>(null);
  const [otherUserLoading, setOtherUserLoading] = useState<boolean>(isViewingOtherUser);
  const [otherUserError, setOtherUserError] = useState<string | null>(null);

  useEffect(() => {
    if (!isViewingOtherUser || !targetUid) {
      setOtherUserData(null);
      setOtherUserLoading(false);
      setOtherUserError(null);
      return;
    }

    let isMounted = true;
    setOtherUserLoading(true);
    setOtherUserError(null);

    async function fetchTargetUser() {
      try {
        const userRef = doc(db, 'users', targetUid!);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists() && isMounted) {
          setOtherUserData(snapshot.data() as UserProgressData);
        } else if (isMounted) {
          setOtherUserError('The requested user profile does not exist or has not initialized public progress.');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching user profile:', err);
          setOtherUserError('Unable to load user profile at this time.');
        }
      } finally {
        if (isMounted) setOtherUserLoading(false);
      }
    }

    fetchTargetUser();

    return () => {
      isMounted = false;
    };
  }, [isViewingOtherUser, targetUid]);

  // Resolve effective user data (either the other user or the current logged-in user)
  const effectiveProgress = (isViewingOtherUser && otherUserData) ? otherUserData : myProgress;
  const effectiveGamification = (isViewingOtherUser && otherUserData)
    ? (otherUserData.gamification || defaultGamificationState)
    : myGamification;

  const effectiveName = isViewingOtherUser
    ? otherUserData?.displayName || otherUserData?.email?.split('@')[0] || `Learner_${targetUid?.slice(0, 6)}`
    : currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Learner';

  const effectiveEmail = isViewingOtherUser
    ? (otherUserData?.email ? otherUserData.email.replace(/(?<=.{2}).(?=.*@)/g, '*') : 'Verified Learner')
    : currentUser?.email || 'Guest Explorer';

  const effectiveTimeOnlineSeconds = isViewingOtherUser
    ? (otherUserData?.totalTimeOnlineSeconds || 0)
    : (myProgress?.totalTimeOnlineSeconds || 0);

  // Level & EXP Progress
  const exp = effectiveGamification?.exp || 0;
  const { currentLevel, expInLevel, neededInLevel, percent: levelPercent } =
    getExpProgressInCurrentLevel(exp);
  const rank = getRankForLevel(currentLevel);

  // Daily Streak & Shields
  const streakDays = effectiveGamification?.streak?.currentStreak || 0;
  const longestStreak = effectiveGamification?.streak?.longestStreak || streakDays;
  const shieldsRemaining = Math.max(0, Math.min(3, effectiveGamification?.streak?.shieldsRemaining ?? 3));

  // Articles Read
  const readPagesList = effectiveProgress?.readPages || [];
  const readCount = readPagesList.filter(isTrackableArticle).length;
  const totalArticles = totalArticlesCount || TOTAL_TRACKABLE_ARTICLES_DEFAULT;
  const readPercent = Math.min(100, Math.round((readCount / (totalArticles || 1)) * 100));

  // Quizzes (Live Sync from Google Sheets)
  const quizTotalAnswered =
    effectiveProgress?.quizStats?.totalQuestionsAnswered || (effectiveProgress?.quizStats?.totalCorrectAnswers || 0);
  const quizCorrect = effectiveProgress?.quizStats?.totalCorrectAnswers || 0;
  const quizAccuracy = quizTotalAnswered > 0 ? Math.round((quizCorrect / quizTotalAnswered) * 100) : 0;
  const totalQuizPool = 15360;

  // DSA Solved
  const solvedProblems = effectiveProgress?.dsaProgress?.solvedProblems || [];
  const dsaSolvedCount = solvedProblems.length;
  const totalDsaCount = PROBLEMS?.length || 150;
  const dsaPercent = Math.min(100, Math.round((dsaSolvedCount / totalDsaCount) * 100));

  const solvedSet = useMemo(() => new Set((solvedProblems || []).map(String)), [solvedProblems]);
  const easySolved = (PROBLEMS || []).filter((p) => p.difficulty === 'Easy' && solvedSet.has(String(p.id))).length;
  const mediumSolved = (PROBLEMS || []).filter((p) => p.difficulty === 'Medium' && solvedSet.has(String(p.id))).length;
  const hardSolved = (PROBLEMS || []).filter((p) => p.difficulty === 'Hard' && solvedSet.has(String(p.id))).length;

  // Achievement Codex State
  const unlockedAchievementIds = useMemo(
    () => new Set(effectiveGamification?.unlockedAchievements || []),
    [effectiveGamification?.unlockedAchievements]
  );
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedAchievementIds.has(a.id)).length;
  const trophyPercent = Math.round((unlockedCount / (ACHIEVEMENTS.length || 1)) * 100);

  const [codexCategory, setCodexCategory] = useState<AchievementCategory | 'all'>('all');
  const [codexStatus, setCodexStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [codexSearch, setCodexSearch] = useState('');

  // Daily Quests State
  const today = getTodayDateString();
  const dailyQuests = getQuestsForDate(today);
  const questState = effectiveGamification?.dailyQuests?.date === today ? effectiveGamification.dailyQuests : null;
  const completedQuestIds = useMemo(() => new Set(questState?.completedQuestIds || []), [questState]);
  const completedQuestsCount = dailyQuests.filter((q) => completedQuestIds.has(q.id)).length;
  const dailyCounts = questState?.dailyCounts || {
    readPagesCount: 0,
    quizAnsweredCount: 0,
    dsaSolvedCount: 0,
    gamesPlayedCount: 0,
  };
  const allQuestsDone = dailyQuests.every((q) => completedQuestIds.has(q.id));
  const claimedBonus = !isViewingOtherUser && !!questState?.claimedBonus;

  // Streak Milestones
  const [showAllMilestones, setShowAllMilestones] = useState(false);
  const unlockedMilestones = STREAK_MILESTONES.filter((m) => streakDays >= m.days);
  const highestMilestone = unlockedMilestones.length > 0 ? unlockedMilestones[unlockedMilestones.length - 1] : null;
  const nextMilestone = STREAK_MILESTONES.find((m) => streakDays < m.days) || null;

  // Filtered Achievements List
  const filteredAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter((ach) => {
      const isUnlocked = unlockedAchievementIds.has(ach.id);
      if (codexStatus === 'unlocked' && !isUnlocked) return false;
      if (codexStatus === 'locked' && isUnlocked) return false;
      if (codexCategory !== 'all' && ach.category !== codexCategory) return false;
      if (codexSearch.trim()) {
        const q = codexSearch.toLowerCase().trim();
        const matchTitle = ach.title.toLowerCase().includes(q);
        const matchDesc = ach.description.toLowerCase().includes(q);
        const matchRarity = ach.rarity.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchRarity) return false;
      }
      return true;
    });
  }, [unlockedAchievementIds, codexStatus, codexCategory, codexSearch]);

  // Knowledge Domains
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

  return (
    <Layout
      title={`${effectiveName}'s Engineering Profile | Codex`}
      description={`Engineering learning telemetry, achievement codex, daily missions, and cosmic rank hierarchy for ${effectiveName}.`}
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
          .nav-tab-btn:hover { background: rgba(255, 255, 255, 0.08) !important; color: #ffffff !important; }
          .filter-chip-btn:hover { border-color: #38bdf8 !important; color: #38bdf8 !important; }
          .quest-box:hover { transform: translateY(-2px); border-color: rgba(56, 189, 248, 0.4) !important; }
          .ach-card:hover { transform: translateY(-2px); border-color: rgba(56, 189, 248, 0.4) !important; }
        `}</style>

        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          {/* Banner notification when viewing another user */}
          {isViewingOtherUser && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem' }}>
                <span>👁️</span>
                <span style={{ fontWeight: 800, color: '#38bdf8' }}>Viewing Public Profile:</span>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>{effectiveName}</span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                  Read-Only Mode
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  to="/profile"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: '#38bdf8',
                    color: '#090d16',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>👤</span>
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/leaderboard"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>🏆</span>
                  <span>Leaderboard</span>
                </Link>
              </div>
            </div>
          )}

          {/* Loading state for other user */}
          {otherUserLoading && (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                borderRadius: '18px',
                background: 'rgba(22, 33, 56, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px', animation: 'spin 1s linear infinite' }}>⏳</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>Loading Architect Profile...</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '4px' }}>
                Fetching public telemetry and achievement codex from Firestore
              </div>
            </div>
          )}

          {/* Error state for other user */}
          {!otherUserLoading && otherUserError && (
            <div
              style={{
                padding: '36px 24px',
                textAlign: 'center',
                borderRadius: '18px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f87171' }}>Profile Not Found</div>
              <p style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.65)', maxWidth: '480px', margin: '6px auto 16px' }}>
                {otherUserError}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <Link
                  to="/profile"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#38bdf8',
                    color: '#090d16',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                  }}
                >
                  View My Profile
                </Link>
                <Link
                  to="/leaderboard"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  Back to Leaderboard
                </Link>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 🌟 1. UNIFIED HERO PROFILE & TELEMETRY HEADER             */}
          {/* ========================================================= */}
          {!otherUserLoading && !otherUserError && (
            <>
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
                  marginBottom: '20px',
                }}
              >
                {/* Left User Profile & Rank */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <CosmicRankBadge level={currentLevel} rank={rank} size="lg" showLevelPill={false} hideOrbitRing={true} disableFloat={true} />

                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                        {effectiveName}
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
                      {effectiveEmail} • <span style={{ color: '#38bdf8', fontWeight: 600 }}>Active Telemetry</span> • <span style={{ color: '#34d399', fontWeight: 600 }}>⏱️ {formatTimeOnline(effectiveTimeOnlineSeconds)}</span>
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

                {/* Right Quick Links & Super Admin Controls */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link
                    to="/leaderboard"
                    className="stats-hero-btn"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '9px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>🏆</span>
                    <span>Global Leaderboard</span>
                  </Link>

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

                  {!isViewingOtherUser && isSuperAdmin && (
                    <button
                      type="button"
                      onClick={boostToGodLevel}
                      className="stats-hero-btn"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '9px',
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
                        border: '1.5px solid #fbbf24',
                        color: '#fbbf24',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                      title="Super Admin Debug: Instantly unlock Level 185"
                    >
                      <span>⚡</span>
                      <span>Super God (Lv. 185)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ========================================================= */}
              {/* 🎛️ 2. PRIMARY NAVIGATION TABS (Segmented Control)         */}
              {/* ========================================================= */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(22, 33, 56, 0.75)',
                  borderRadius: '14px',
                  padding: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '22px',
                  gap: '4px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                }}
              >
                {[
                  {
                    id: 'telemetry',
                    label: '📊 Learning Telemetry',
                    count: `${readPercent}% Complete`,
                    activeColor: '#38bdf8',
                  },
                  {
                    id: 'codex',
                    label: '🏆 Achievement Codex',
                    count: `${unlockedCount}/${ACHIEVEMENTS.length}`,
                    activeColor: '#fbbf24',
                  },
                  {
                    id: 'quests',
                    label: '🎯 Daily Quests & Ranks',
                    count: `${completedQuestsCount}/3 Today`,
                    activeColor: '#34d399',
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id as any)}
                      className="nav-tab-btn"
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.88rem',
                        background: isActive ? tab.activeColor : 'transparent',
                        color: isActive ? '#090d16' : 'rgba(255, 255, 255, 0.75)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: isActive ? `0 2px 12px ${tab.activeColor}40` : 'none',
                      }}
                    >
                      <span>{tab.label}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '1px 7px',
                          borderRadius: '6px',
                          background: isActive ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                          color: isActive ? '#090d16' : 'rgba(255, 255, 255, 0.65)',
                          fontWeight: 800,
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ========================================================= */}
              {/* TAB 1: LEARNING TELEMETRY & DOMAIN MASTERY                */}
              {/* ========================================================= */}
              {activeTab === 'telemetry' && (
                <div>
                  {/* 4 Bento Telemetry Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '12px',
                      marginBottom: '20px',
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
                          🧩 DSA Mastery
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
                  </div>

                  {/* Active Study Time Bar */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: 'rgba(52, 211, 153, 0.06)',
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>⏱️</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                          Active Study Telemetry: <span style={{ color: '#34d399' }}>{formatTimeOnline(effectiveTimeOnlineSeconds)}</span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          Continuously tracking focused learning across documentation reading, algorithm exercises, and quiz sessions.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleTabChange('codex')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          background: 'rgba(251, 191, 36, 0.15)',
                          border: '1px solid rgba(251, 191, 36, 0.4)',
                          color: '#fbbf24',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🏆 View Codex ➔
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabChange('quests')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🎯 Daily Quests ➔
                      </button>
                    </div>
                  </div>

                  {/* 🧭 Knowledge Domain Mastery */}
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
              )}

              {/* ========================================================= */}
              {/* TAB 2: ACHIEVEMENT CODEX (Directly on Page)               */}
              {/* ========================================================= */}
              {activeTab === 'codex' && (
                <div>
                  {/* Codex Toolbar */}
                  <div
                    style={{
                      padding: '18px 20px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(22, 33, 56, 0.6) 0%, rgba(13, 20, 36, 0.8) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '16px',
                      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🏆</span>
                          <span>The Engineering Achievement Codex</span>
                          <span style={{ fontSize: '0.8rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                            {unlockedCount} / {ACHIEVEMENTS.length} ({trophyPercent}%)
                          </span>
                        </h2>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '3px' }}>
                          Live milestones across documentation reading, algorithm masteries, daily quiz sprints, and streaks.
                        </div>
                      </div>

                      {/* Status Filter Toggle */}
                      <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        {[
                          { id: 'all', label: `All (${ACHIEVEMENTS.length})` },
                          { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
                          { id: 'locked', label: `Locked (${ACHIEVEMENTS.length - unlockedCount})` },
                        ].map((f) => {
                          const isSel = codexStatus === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setCodexStatus(f.id as any)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: isSel ? '#38bdf8' : 'transparent',
                                color: isSel ? '#090d16' : 'rgba(255, 255, 255, 0.7)',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Search Bar */}
                    <input
                      type="text"
                      value={codexSearch}
                      onChange={(e) => setCodexSearch(e.target.value)}
                      placeholder="🔍 Search achievements (e.g. Kafka, Spring, Streak, 50, Legendary)..."
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        borderRadius: '9px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.86rem',
                        outline: 'none',
                        marginBottom: '10px',
                      }}
                    />

                    {/* Category Filter Chips */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'all', label: 'All Categories' },
                        { id: 'knowledge', label: '📚 Knowledge' },
                        { id: 'java_spring', label: '☕ Java & Spring' },
                        { id: 'architecture', label: '🏗️ Architecture' },
                        { id: 'dsa', label: '🧩 DSA' },
                        { id: 'quiz', label: '🎯 Quizzes' },
                        { id: 'streak', label: '🔥 Streaks' },
                        { id: 'topics', label: '📜 Topics' },
                        { id: 'arcade', label: '🕹️ Arcade' },
                        { id: 'leaderboard', label: '🏆 Leaderboard' },
                      ].map((cat) => {
                        const isSel = codexCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            className="filter-chip-btn"
                            onClick={() => setCodexCategory(cat.id as any)}
                            style={{
                              padding: '4px 11px',
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
                    <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.9rem' }}>
                      No achievements match your search and filter criteria.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      {filteredAchievements.map((ach) => {
                        const isUnlocked = unlockedAchievementIds.has(ach.id);

                        let userCount = 0;
                        if (ach.metric === 'read_pages') userCount = readCount;
                        if (ach.metric === 'quiz_correct') userCount = quizCorrect;
                        if (ach.metric === 'dsa_solved') userCount = dsaSolvedCount;
                        if (ach.metric === 'streak_days') userCount = streakDays;
                        if (ach.metric === 'special' || ach.metric === 'leaderboard_rank') userCount = isUnlocked ? ach.targetCount : 0;
                        if (ach.metric === 'topic_completed' && ach.topicPrefix) {
                          userCount = readPagesList.filter((p) =>
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
                            className="ach-card"
                            style={{
                              padding: '14px',
                              borderRadius: '12px',
                              background: isUnlocked ? 'rgba(30, 41, 59, 0.55)' : 'rgba(15, 23, 42, 0.35)',
                              border: isUnlocked ? `1px solid ${rarityColor}55` : '1px solid rgba(255, 255, 255, 0.06)',
                              boxShadow: isUnlocked ? `0 0 16px ${rarityColor}15` : 'none',
                              opacity: isUnlocked ? 1 : 0.65,
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'flex-start',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '10px',
                                background: isUnlocked ? `${rarityColor}20` : 'rgba(255, 255, 255, 0.04)',
                                border: isUnlocked ? `1px solid ${rarityColor}88` : '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.35rem',
                                flexShrink: 0,
                                filter: isUnlocked ? 'none' : 'grayscale(1)',
                              }}
                            >
                              {ach.category === 'streak' ? (
                                <StreakBadgeSvg days={ach.targetCount} size={32} isUnlocked={isUnlocked} />
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
                                    fontSize: '0.64rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    color: rarityColor,
                                  }}
                                >
                                  {ach.rarity}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px', lineHeight: 1.35 }}>
                                {ach.description}
                              </div>

                              <div style={{ marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px' }}>
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
              {/* TAB 3: DAILY QUESTS & COSMIC RANKS                        */}
              {/* ========================================================= */}
              {activeTab === 'quests' && (
                <div>
                  {/* Daily Missions Header */}
                  <div
                    style={{
                      padding: '18px 20px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(22, 33, 56, 0.6) 0%, rgba(13, 20, 36, 0.8) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '16px',
                      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🎯</span>
                          <span>Daily Missions Control</span>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>({today})</span>
                        </h2>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                          Complete today's 3 missions to unlock the +150 EXP Supernova Bounty Box.
                        </div>
                      </div>

                      <Link
                        to="/arcade"
                        style={{
                          padding: '5px 12px',
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
                        }}
                      >
                        <span>🕹️ Play Arcade</span>
                      </Link>
                    </div>

                    {/* 3 Actionable Daily Quest Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
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
                            className="quest-box"
                            style={{
                              padding: '14px',
                              borderRadius: '12px',
                              background: isDone ? 'rgba(52, 211, 153, 0.08)' : 'rgba(22, 33, 56, 0.45)',
                              border: isDone ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              minHeight: '145px',
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

                    {/* Supernova Bounty Box */}
                    <div
                      style={{
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
                            Supernova Bounty Box ({completedQuestsCount}/3 Completed)
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                            {isViewingOtherUser
                              ? "User's daily quest milestone status."
                              : "Complete all 3 missions to unlock today's +150 bonus EXP!"}
                          </div>
                        </div>
                      </div>

                      {isViewingOtherUser ? (
                        <div
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: allQuestsDone ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                            border: allQuestsDone ? '1px solid #34d399' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: allQuestsDone ? '#34d399' : 'rgba(255, 255, 255, 0.4)',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                          }}
                        >
                          {allQuestsDone ? '✓ All Done' : `${completedQuestsCount}/3 Completed`}
                        </div>
                      ) : claimedBonus ? (
                        <div
                          style={{
                            padding: '6px 14px',
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
                            padding: '8px 18px',
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
                          {allQuestsDone ? '⚡ Claim +150 EXP' : 'Locked (Complete Missions)'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Streak Milestones Showcase */}
                  <div
                    style={{
                      padding: '18px 20px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
                      border: '1px solid rgba(249, 115, 22, 0.25)',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🔥 Streak Mastery</span>
                          <span style={{ fontSize: '0.74rem', color: '#fb923c', background: 'rgba(249, 115, 22, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                            {streakDays} Days Consecutive
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          Daily flame progress towards all 37 celestial streak badges.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAllMilestones(!showAllMilestones)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {showAllMilestones ? 'Hide All Badges ▲' : 'View All 37 Badges ▼'}
                      </button>
                    </div>

                    {/* Milestone Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
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
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                              This learner has unlocked every streak badge in the system.
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
                          maxHeight: '200px',
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

                  {/* Cosmic Engineering Hierarchy Roadmap */}
                  <div
                    style={{
                      padding: '22px 24px',
                      borderRadius: '18px',
                      background: 'linear-gradient(135deg, rgba(22, 33, 56, 0.5) 0%, rgba(13, 20, 36, 0.8) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 15px 45px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>✨</span>
                          <span>Cosmic Engineering Hierarchy</span>
                        </h2>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
                          Progression roadmap from Bronze Cadet to Super God.
                        </div>
                      </div>
                    </div>

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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
