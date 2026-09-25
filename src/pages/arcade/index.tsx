import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useUserProgress } from '../../context/UserProgressContext';
import OutageBossBattleGame from '../../components/gamification/games/OutageBossBattleGame';
import ArchitecturePuzzleGame from '../../components/gamification/games/ArchitecturePuzzleGame';
import SpotTheBugDuelGame from '../../components/gamification/games/SpotTheBugDuelGame';
import SqlIndexOptimizerGame from '../../components/gamification/games/SqlIndexOptimizerGame';
import { arcadeAudio } from '../../utils/arcadeAudio';

export default function ArcadePage(): React.JSX.Element {
  const { gamification } = useUserProgress();
  const [activeGame, setActiveGame] = useState<'boss' | 'puzzle' | 'bug' | 'sql_optimizer'>('boss');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => arcadeAudio.isMuted());
  const [dailyStreak, setDailyStreak] = useState<number>(() => {
    if (typeof window === 'undefined') return 3;
    try {
      const saved = localStorage.getItem('arcade_daily_streak');
      return saved ? parseInt(saved, 10) : 3;
    } catch {
      return 3;
    }
  });

  const toggleSound = () => {
    const nextMute = arcadeAudio.toggleMute();
    setIsAudioMuted(nextMute);
    if (!nextMute) {
      arcadeAudio.playCorrect();
    }
  };

  const handleSelectGame = (gameId: 'boss' | 'puzzle' | 'bug' | 'sql_optimizer') => {
    arcadeAudio.playFlip();
    setActiveGame(gameId);
  };

  const scores = gamification?.miniGameScores || {};

  return (
    // @ts-ignore
    <Layout
      title="Galactic Arcade - Gamified Engineering Arena"
      description="Learn distributed systems, Java concurrency, and system design by playing interactive educational games."
    >
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #090d16 0%, #0d1117 100%)',
          padding: '36px 20px 80px 20px',
          color: '#ffffff',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header Controls & Title */}
          <div style={{ marginBottom: '24px', textAlign: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={toggleSound}
                title={isAudioMuted ? 'Unmute 8-bit Arcade Sound' : 'Mute Sound'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isAudioMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  border: `1px solid ${isAudioMuted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
                  color: isAudioMuted ? '#f87171' : '#38bdf8',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{isAudioMuted ? '🔇 Audio Muted' : '🔊 8-Bit Audio On'}</span>
              </button>
            </div>

            <h1
              style={{
                margin: '0 0 8px 0',
                fontSize: '2.2rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <span style={{ WebkitTextFillColor: 'initial', filter: 'none' }}>🕹️</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Galactic Engineering Arcade
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '680px', marginInline: 'auto' }}>
              Sharpen your distributed systems instincts, debug concurrency race conditions, and battle production outages through interactive simulations.
            </p>

            {/* Daily On-Call Banner */}
            <div
              style={{
                marginTop: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '0.82rem',
                color: '#fde68a',
              }}
            >
              <span style={{ fontSize: '1rem' }}>🔥</span>
              <span>
                <strong>Daily On-Call Rotation:</strong> Streak <strong>{dailyStreak} Days</strong> • Today's Mission:{' '}
                <em>"P0 Thundering Herd Mitigation"</em>
              </span>
              <button
                type="button"
                onClick={() => handleSelectGame('boss')}
                style={{
                  background: 'rgba(245, 158, 11, 0.25)',
                  border: '1px solid #f59e0b',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Respond ➔
              </button>
            </div>
          </div>

          {/* Game Selection Cards */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '12px' }}>
              Select Educational Arena:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {[
                {
                  id: 'boss',
                  title: 'Outage Boss Battle',
                  tag: '60s Incident Round',
                  icon: '👾',
                  desc: 'Defend system uptime against Thundering Herds and Deadlock Dragons.',
                  color: '#ef4444',
                  highScore: scores.boss_battle || 0,
                },
                {
                  id: 'bug',
                  title: 'Spot The Bug Duel',
                  tag: '30s Code Race',
                  icon: '🔍',
                  desc: 'Click the exact buggy line in Java concurrency and memory leak snippets.',
                  color: '#f59e0b',
                  highScore: scores.spot_bug || 0,
                },
                {
                  id: 'puzzle',
                  title: 'Architecture Pipe Puzzle',
                  tag: 'System Design Arena',
                  icon: '⚙️',
                  desc: 'Design Bitly, Netflix, Uber, Twitter, and Stripe pipelines with HelloInterview deep breakdowns.',
                  color: '#38bdf8',
                  highScore: scores.architecture_puzzle || 0,
                },
                {
                  id: 'sql_optimizer',
                  title: 'SQL Index & Query Crusher',
                  tag: 'Database Tuning',
                  icon: '🗄️',
                  desc: 'Analyze slow EXPLAIN plans, design B-Tree composite indices, and crush query cost by 99%.',
                  color: '#10b981',
                  highScore: scores.sql_optimizer || 0,
                },
              ].map((game) => {
                const isSelected = activeGame === game.id;
                return (
                  <div
                    key={game.id}
                    onClick={() => handleSelectGame(game.id as any)}
                    style={{
                      padding: '16px 18px',
                      borderRadius: '16px',
                      background: isSelected
                        ? `linear-gradient(135deg, ${game.color}22 0%, rgba(15, 23, 42, 0.95) 100%)`
                        : 'rgba(30, 41, 59, 0.4)',
                      border: isSelected ? `2px solid ${game.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isSelected ? `0 0 25px ${game.color}44` : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '1.8rem' }}>{game.icon}</span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: `${game.color}22`,
                            color: game.color,
                            border: `1px solid ${game.color}44`,
                          }}
                        >
                          {game.tag}
                        </span>
                      </div>

                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                        {game.title}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
                        {game.desc}
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      <span>High Score:</span>
                      <span style={{ color: game.color, fontWeight: 700 }}>{game.highScore} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Game Arena */}
          <div>
            <BrowserOnly fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>Loading Educational Arena...</div>}>
              {() => (
                <>
                  {activeGame === 'boss' && <OutageBossBattleGame />}
                  {activeGame === 'bug' && <SpotTheBugDuelGame />}
                  {activeGame === 'puzzle' && <ArchitecturePuzzleGame />}
                  {activeGame === 'sql_optimizer' && <SqlIndexOptimizerGame />}
                </>
              )}
            </BrowserOnly>
          </div>
        </div>
      </div>
    </Layout>
  );
}
