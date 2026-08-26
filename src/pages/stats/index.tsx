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

export default function StatsPage(): React.JSX.Element {
  const { progress, gamification, currentUser, totalArticlesCount } = useUserProgress();
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Learner';
  const email = currentUser?.email || 'Guest Explorer';

  // Gamification & Level
  const exp = gamification?.exp || 0;
  const { currentLevel, nextLevelExp, currentLevelExp, expInLevel, neededInLevel, percent: levelPercent } =
    getExpProgressInCurrentLevel(exp);
  const rank = getRankForLevel(currentLevel);

  // Streak & Shields
  const streakDays = gamification?.streak?.currentStreak || 0;
  const longestStreak = gamification?.streak?.longestStreak || streakDays;
  const shieldsRemaining = gamification?.streak?.shieldsRemaining ?? 1;

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
  const javaReadCount = readPagesList.filter((p) => p.includes('java')).length;
  const springReadCount = readPagesList.filter((p) => p.includes('spring')).length;
  const systemDesignReadCount = readPagesList.filter(
    (p) => p.includes('system-design') || p.includes('architecture') || p.includes('kafka')
  ).length;
  const devOpsReadCount = readPagesList.filter(
    (p) => p.includes('devops') || p.includes('kubernetes') || p.includes('docker')
  ).length;
  const databaseReadCount = readPagesList.filter(
    (p) => p.includes('database') || p.includes('sql') || p.includes('postgresql')
  ).length;
  const securityReadCount = readPagesList.filter(
    (p) => p.includes('security') || p.includes('jwt') || p.includes('auth')
  ).length;
  const dsaReadCount = readPagesList.filter((p) => p.includes('dsa') || p.includes('leetcode')).length;

  const today = getTodayDateString();
  const dailyQuests = getQuestsForDate(today);
  const questState = gamification?.dailyQuests?.date === today ? gamification.dailyQuests : null;
  const completedQuestIds = new Set(questState?.completedQuestIds || []);
  const completedQuestsCount = dailyQuests.filter((q) => completedQuestIds.has(q.id)).length;

  return (
    <Layout
      title="Engineering Telemetry & Learning Stats"
      description="Comprehensive engineering learning analytics, reading progress, Google Sheets quiz performance, and DSA mastery."
    >
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#090d16',
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.15), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168, 85, 247, 0.1), transparent 70%)',
          color: '#f8fafc',
          padding: '28px 16px 80px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* ========================================================= */}
          {/* 🌟 1. HERO PROFILE & TELEMETRY HEADER                     */}
          {/* ========================================================= */}
          <div
            style={{
              padding: '24px 20px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
              marginBottom: '28px',
            }}
          >
            {/* Left User Profile & Rank */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <CosmicRankBadge level={currentLevel} rank={rank} size="lg" showLevelPill={false} />

              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 900, color: '#ffffff' }}>{name}</h1>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '8px',
                      background: `${rank.color}22`,
                      color: rank.color,
                      border: `1px solid ${rank.color}66`,
                      fontWeight: 800,
                      fontSize: '0.82rem',
                    }}
                  >
                    Level {currentLevel} • {rank.title}
                  </span>
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', marginTop: '4px', wordBreak: 'break-word' }}>
                  {email} • <span style={{ color: '#38bdf8' }}>Engineering Telemetry Active</span>
                </div>

                {/* EXP Bar */}
                <div style={{ marginTop: '12px', width: '100%', maxWidth: '400px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '4px',
                    }}
                  >
                    <span>EXP to Level {currentLevel + 1}</span>
                    <span style={{ fontWeight: 800, color: '#ffffff' }}>
                      {expInLevel.toLocaleString()} / {neededInLevel.toLocaleString()} EXP ({levelPercent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${levelPercent}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${rank.color}, #38bdf8)`,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Quick Actions */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', maxWidth: '380px' }}>
              <Link
                to="/intro"
                style={{
                  flex: 1,
                  minWidth: '140px',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                  border: '1px solid #38bdf8',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.2)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>📚</span>
                <span>Continue Reading</span>
              </Link>

              <Link
                to="/arcade"
                style={{
                  flex: 1,
                  minWidth: '140px',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                  border: '1px solid #a855f7',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(168, 85, 247, 0.2)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>🕹️</span>
                <span>Galactic Arcade</span>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 📊 2. LIFETIME TELEMETRY METRIC CARDS (6 GRIDS)           */}
          {/* ========================================================= */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px',
              marginBottom: '32px',
            }}
          >
            {/* 1. ARTICLES READ */}
            <div
              style={{
                padding: '20px 22px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  📖 Trackable Articles
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.18)', padding: '2px 10px', borderRadius: '12px' }}>
                  {readPercent}% Completed
                </span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
                {readCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)' }}>/ {totalArticles} Total Pages</span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ width: `${readPercent}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '8px' }}>
                Eligible technical guides, deep-dives & architecture books.
              </div>
            </div>

            {/* 2. GOOGLE SHEETS DAILY QUIZZES */}
            <div
              style={{
                padding: '20px 22px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🎯 Google Sheets Quizzes
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.18)', padding: '2px 10px', borderRadius: '12px' }}>
                  {quizAccuracy}% Accuracy
                </span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
                {quizTotalAnswered} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)' }}>({quizCorrect} Correct)</span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ width: `${Math.max(4, Math.min(100, (quizTotalAnswered / totalQuizPool) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '8px' }}>
                Synced with Google Sheets: 5,120 Qs per topic (15,360 total questions).
              </div>
            </div>

            {/* 3. DSA PROBLEM SOLVING */}
            <div
              style={{
                padding: '20px 22px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🧩 DSA Problem Mastery
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c084fc', background: 'rgba(168, 85, 247, 0.18)', padding: '2px 10px', borderRadius: '12px' }}>
                  {dsaPercent}% Mastery
                </span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
                {dsaSolvedCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)' }}>/ {totalDsaCount} Solved</span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ width: `${dsaPercent}%`, height: '100%', background: 'linear-gradient(90deg, #c084fc, #a855f7)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '0.75rem' }}>
                <span style={{ color: '#34d399' }}>🟢 {easySolved} Easy</span>
                <span style={{ color: '#fbbf24' }}>🟡 {mediumSolved} Medium</span>
                <span style={{ color: '#f43f5e' }}>🔴 {hardSolved} Hard</span>
              </div>
            </div>

            {/* 4. DAILY STREAK RECORD */}
            <div
              style={{
                padding: '20px 22px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🔥 Daily Streak Matrix
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fb923c', background: 'rgba(249, 115, 22, 0.18)', padding: '2px 10px', borderRadius: '12px' }}>
                  🛡️ {shieldsRemaining} / 3 Shields
                </span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
                {streakDays}d <span style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)' }}>Current (Peak: {longestStreak}d)</span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ width: `${Math.min(100, (streakDays / 100) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #ef4444)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '8px' }}>
                Learn 3 continuous days to earn +1 extra shield. Shields automatically recover your streak if a day is missed!
              </div>
            </div>

            {/* 5. TROPHIES CODEX */}
            <div
              style={{
                padding: '20px 22px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🏆 Trophies Codex
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.18)', padding: '2px 10px', borderRadius: '12px' }}>
                  {trophyPercent}% Unlocked
                </span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
                {unlockedCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)' }}>/ {ACHIEVEMENTS.length} Badges</span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ width: `${trophyPercent}%`, height: '100%', background: 'linear-gradient(90deg, #34d399, #10b981)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '8px' }}>
                Includes Legendary, Epic, and Celestial engineering achievements.
              </div>
            </div>

            {/* 6. TOTAL EXP ENERGY */}
            <div
              style={{
                padding: '20px 22px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ⚡ Total EXP Energy
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f472b6', background: 'rgba(236, 72, 153, 0.18)', padding: '2px 10px', borderRadius: '12px' }}>
                  Lv.{currentLevel}
                </span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
                {exp.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)' }}>EXP Accumulated</span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ width: `${levelPercent}%`, height: '100%', background: 'linear-gradient(90deg, #f472b6, #db2777)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '8px' }}>
                Daily Quests today: {completedQuestsCount} / {dailyQuests.length} completed.
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 🧭 3. KNOWLEDGE DOMAIN MASTERY & SYNC BREAKDOWN            */}
          {/* ========================================================= */}
          <div
            style={{
              padding: '28px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 15px 45px rgba(0, 0, 0, 0.5)',
              marginBottom: '36px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🧭</span>
                  <span>Knowledge Domain Mastery</span>
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                  Granular reading distribution and Google Sheets questions across core engineering domains.
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 800, background: 'rgba(52, 211, 153, 0.15)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                ⚡ 5,120 Questions / Topic Synced
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
              {/* Java Core */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#f59e0b' }}>☕ Java Core</span>
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '1px 6px', borderRadius: '6px' }}>5,120 Qs</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>{javaReadCount} Articles Read</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>JVM, Concurrency, Collections & Streams</div>
              </div>

              {/* Spring Boot */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(74, 222, 128, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#4ade80' }}>🍃 Spring Boot</span>
                  <span style={{ fontSize: '0.72rem', color: '#4ade80', background: 'rgba(74, 222, 128, 0.15)', padding: '1px 6px', borderRadius: '6px' }}>5,120 Qs</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>{springReadCount} Articles Read</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>AOP, Data JPA, Security, Cloud & Starters</div>
              </div>

              {/* System Design */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#a855f7' }}>🏗️ System Design</span>
                  <span style={{ fontSize: '0.72rem', color: '#a855f7', background: 'rgba(168, 85, 247, 0.15)', padding: '1px 6px', borderRadius: '6px' }}>5,120 Qs</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>{systemDesignReadCount} Articles Read</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>Kafka, Distributed Sagas, 2PC & High Scale</div>
              </div>

              {/* DevOps & Kubernetes */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#38bdf8' }}>☸️ DevOps & K8s</span>
                  <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '1px 6px', borderRadius: '6px' }}>Containers</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>{devOpsReadCount} Articles Read</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>Docker, ArgoCD, Observability & Terraform</div>
              </div>

              {/* Database & Storage */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(244, 114, 182, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#f472b6' }}>🗄️ Database & Storage</span>
                  <span style={{ fontSize: '0.72rem', color: '#f472b6', background: 'rgba(244, 114, 182, 0.15)', padding: '1px 6px', borderRadius: '6px' }}>PostgreSQL</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>{databaseReadCount} Articles Read</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>ACID, WAL, MVCC, Heap Storage & Indexing</div>
              </div>

              {/* Security & Auth */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#34d399' }}>🔐 Core Security</span>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 6px', borderRadius: '6px' }}>AuthN & Z</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>{securityReadCount} Articles Read</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>JWT, Invalidation, OAuth2 & PKCE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
