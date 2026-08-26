import React, { useState, useEffect, useMemo } from 'react';
import Link from '@docusaurus/Link';
import { useUserProgress } from '../../context/UserProgressContext';
import { subscribeToLeaderboard, LeaderboardEntry, LeaderboardTimeframe } from '../../services/leaderboardService';
import { isSuperAdminUser } from '../../config/adminConfig';

interface LeaderboardViewProps {
  initialTimeframe?: LeaderboardTimeframe;
}

export default function LeaderboardView({ initialTimeframe = 'alltime' }: LeaderboardViewProps) {
  const { currentUser } = useUserProgress();
  const isSuperAdmin = currentUser?.email ? isSuperAdminUser(currentUser.email) : false;
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>(initialTimeframe);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to leaderboard based on timeframe
  useEffect(() => {
    setLoading(true);
    const unsubLeaderboard = subscribeToLeaderboard(
      timeframe,
      (data) => {
        setEntries(data);
        setLoading(false);
      }
    );
    return () => unsubLeaderboard();
  }, [timeframe]);

  // Top 3 Podium
  const topThree = useMemo(() => entries.slice(0, 3), [entries]);

  // Current user entry
  const currentUserEntry = useMemo(() => {
    if (!currentUser) return null;
    return entries.find((e) => e.uid === currentUser.uid);
  }, [entries, currentUser]);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Header & Subtitle */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '30px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <span>🏆</span> GLOBAL ARCHITECT RANKINGS
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem', background: 'linear-gradient(135deg, #38bdf8 0%, #34d399 50%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Engineering Leaderboard
        </h1>
        <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Rankings updated in real time based on Level progression, quiz masteries, DSA challenges, and learning consistency.
        </p>
      </div>

      {/* Timeframe Selectors */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--ifm-color-emphasis-100)', padding: '6px', borderRadius: '12px', border: '1px solid var(--ifm-color-emphasis-200)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <button
            type="button"
            onClick={() => setTimeframe('alltime')}
            style={{
              padding: '9px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              backgroundColor: timeframe === 'alltime' ? 'var(--ifm-color-primary)' : 'transparent',
              color: timeframe === 'alltime' ? 'white' : 'var(--ifm-color-emphasis-700)',
              transition: 'all 0.2s',
            }}
          >
            🏆 All-Time
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('weekly')}
            style={{
              padding: '9px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              backgroundColor: timeframe === 'weekly' ? 'var(--ifm-color-primary)' : 'transparent',
              color: timeframe === 'weekly' ? 'white' : 'var(--ifm-color-emphasis-700)',
              transition: 'all 0.2s',
            }}
          >
            ⚡ This Week
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('monthly')}
            style={{
              padding: '9px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              backgroundColor: timeframe === 'monthly' ? 'var(--ifm-color-primary)' : 'transparent',
              color: timeframe === 'monthly' ? 'white' : 'var(--ifm-color-emphasis-700)',
              transition: 'all 0.2s',
            }}
          >
            📅 This Month
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 1 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: topThree.length === 1 ? '1fr' : topThree.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '1.25rem',
            alignItems: 'flex-end',
            marginBottom: '2.5rem',
          }}
        >
          {/* 2nd Place (Silver) */}
          {topThree[1] && (
            <div
              style={{
                backgroundColor: 'var(--ifm-background-surface-color)',
                border: '1.5px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '20px',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(148, 163, 184, 0.15)',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🥈</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                2ND PLACE
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>
                {topThree[1].displayName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, marginBottom: '8px' }}>
                {topThree[1].rankBadge} Lv.{topThree[1].level} • {topThree[1].rankTitle}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ifm-font-color-base)' }}>
                {topThree[1].timeframeExp.toLocaleString()}{' '}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ifm-color-emphasis-600)' }}>EXP</span>
              </div>
            </div>
          )}

          {/* 1st Place (Gold Champion) */}
          {topThree[0] && (
            <div
              style={{
                backgroundColor: 'var(--ifm-background-surface-color)',
                border: '2px solid rgba(251, 191, 36, 0.7)',
                borderRadius: '24px',
                padding: '2rem 1.25rem',
                textAlign: 'center',
                boxShadow: '0 12px 36px rgba(251, 191, 36, 0.25)',
                position: 'relative',
                transform: topThree.length > 1 ? 'translateY(-12px)' : 'none',
                background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.08) 0%, var(--ifm-background-surface-color) 100%)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>🥇👑</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
                GRAND CHAMPION
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: '4px' }}>
                {topThree[0].displayName}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 800, marginBottom: '8px' }}>
                {topThree[0].rankBadge} Lv.{topThree[0].level} • {topThree[0].rankTitle}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24' }}>
                {topThree[0].timeframeExp.toLocaleString()}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ifm-color-emphasis-600)' }}>EXP</span>
              </div>
            </div>
          )}

          {/* 3rd Place (Bronze) */}
          {topThree[2] && (
            <div
              style={{
                backgroundColor: 'var(--ifm-background-surface-color)',
                border: '1.5px solid rgba(217, 119, 6, 0.4)',
                borderRadius: '20px',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(217, 119, 6, 0.15)',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🥉</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                3RD PLACE
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>
                {topThree[2].displayName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 700, marginBottom: '8px' }}>
                {topThree[2].rankBadge} Lv.{topThree[2].level} • {topThree[2].rankTitle}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ifm-font-color-base)' }}>
                {topThree[2].timeframeExp.toLocaleString()}{' '}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ifm-color-emphasis-600)' }}>EXP</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Super Admin Notice (Excluded from public rankings) */}
      {isSuperAdmin && (
        <div
          style={{
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            border: '1.5px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '16px',
            padding: '0.9rem 1.4rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(168, 85, 247, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#c084fc' }}>
                Super Admin Account
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ifm-color-emphasis-600)' }}>
                You are currently viewing the leaderboard in administrative mode. Your account is excluded from the ranking table.
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#c084fc',
              backgroundColor: 'rgba(168, 85, 247, 0.18)',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            EXCLUDED
          </span>
        </div>
      )}

      {/* Your Rank Floating Bar (If logged in & not admin) */}
      {!isSuperAdmin && currentUserEntry && (
        <div
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '1.5px solid var(--ifm-color-primary)',
            borderRadius: '16px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(56, 189, 248, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--ifm-color-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1rem',
              }}
            >
              #{currentUserEntry.rankPosition}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{currentUserEntry.displayName}</span>
                <span style={{ backgroundColor: 'var(--ifm-color-primary)', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                  YOU
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)' }}>
                {currentUserEntry.rankBadge} Lv.{currentUserEntry.level} • {currentUserEntry.rankTitle}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ifm-color-primary)' }}>
              {currentUserEntry.timeframeExp.toLocaleString()} EXP
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ifm-color-emphasis-600)' }}>
              🔥 {currentUserEntry.streak}d Streak • 🧩 {currentUserEntry.quizzesCorrect} Quizzes
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div
        style={{
          backgroundColor: 'var(--ifm-background-surface-color)',
          borderRadius: '16px',
          border: '1px solid var(--ifm-color-emphasis-200)',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '70px 1fr 140px 120px 140px',
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--ifm-color-emphasis-100)',
            borderBottom: '1px solid var(--ifm-color-emphasis-200)',
            fontWeight: 800,
            fontSize: '0.82rem',
            color: 'var(--ifm-color-emphasis-600)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          <div>Rank</div>
          <div>Learner</div>
          <div style={{ textAlign: 'center' }}>Cosmic Rank</div>
          <div style={{ textAlign: 'center' }}>Stats</div>
          <div style={{ textAlign: 'right' }}>EXP Score</div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ifm-color-emphasis-600)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'spin 1s linear infinite' }}>⏳</div>
            <p style={{ fontWeight: 600 }}>Syncing latest global rankings...</p>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ifm-color-emphasis-600)' }}>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>No learners found.</p>
          </div>
        ) : (
          entries.map((entry) => {
            const isUser = currentUser && entry.uid === currentUser.uid;
            return (
              <div
                key={entry.uid}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 1fr 140px 120px 140px',
                  padding: '1rem 1.25rem',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                  backgroundColor: isUser ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {/* Rank # */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {entry.rankPosition === 1 ? (
                    <span style={{ fontSize: '1.3rem' }}>🥇</span>
                  ) : entry.rankPosition === 2 ? (
                    <span style={{ fontSize: '1.3rem' }}>🥈</span>
                  ) : entry.rankPosition === 3 ? (
                    <span style={{ fontSize: '1.3rem' }}>🥉</span>
                  ) : (
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ifm-color-emphasis-600)' }}>
                      #{entry.rankPosition}
                    </span>
                  )}
                </div>

                {/* Learner & Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--ifm-color-primary)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      flexShrink: 0,
                    }}
                  >
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {entry.displayName}
                      </span>
                      {isUser && (
                        <span
                          style={{
                            backgroundColor: 'var(--ifm-color-primary)',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 5px',
                            borderRadius: '4px',
                          }}
                        >
                          YOU
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-500)' }}>
                      🔥 {entry.streak}d streak • 📖 {entry.readPagesCount} articles read
                    </div>
                  </div>
                </div>

                {/* Cosmic Rank */}
                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--ifm-color-emphasis-100)',
                      color: 'var(--ifm-color-emphasis-800)',
                    }}
                  >
                    {entry.rankBadge} Lv.{entry.level}
                  </span>
                </div>

                {/* Stats */}
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-700)' }}>
                  <div>🧩 {entry.quizzesCorrect} quizzes</div>
                  <div>💻 {entry.dsaSolved} DSA</div>
                </div>

                {/* EXP */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--ifm-color-primary)' }}>
                    {entry.timeframeExp.toLocaleString()}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-500)' }}>EXP</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
