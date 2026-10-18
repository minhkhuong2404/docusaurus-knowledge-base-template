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
        className="arcade-page-container"
        style={{
          minHeight: '100vh',
          background: 'var(--page-bg, #090d16)',
          padding: '36px 16px 80px 16px',
          color: 'var(--ifm-color-content, #ffffff)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          {/* ======================================================== */}
          {/* HERO BANNER */}
          {/* ======================================================== */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              className="arcade-hero-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '16px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <span>🎮 INTERACTIVE SIMULATIONS • OUTAGE BATTLES & DEBUGGING ARENA</span>
            </div>

            <h1
              className="arcade-hero-title"
              style={{
                fontSize: '2.75rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                margin: '0 auto 14px auto',
                lineHeight: 1.25,
                display: 'block',
                width: 'fit-content',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Galactic Engineering Arcade
            </h1>

            <p
              className="arcade-hero-subtitle"
              style={{
                fontSize: '1.15rem',
                maxWidth: '840px',
                margin: '0 auto 24px auto',
                lineHeight: 1.6,
                color: 'var(--ifm-color-content-secondary, #94a3b8)',
                textAlign: 'center',
              }}
            >
              Rèn luyện phản xạ hệ thống phân tán, truy vết lỗi bất đồng bộ &amp; memory leak trong mã nguồn Java, và trực tiếp dập tắt các sự cố sản xuất 2h sáng qua đấu trường giả lập tương tác.
            </p>

            {/* Quick Metrics */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              {[
                { label: '4 Đấu Trường Giáo Dục', desc: 'Outage Boss • Spot Bug • Architecture Puzzle • SQL Crusher', color: '#ec4899' },
                { label: `Ca Trực On-Call (Streak ${dailyStreak} Ngày)`, desc: 'Nhiệm vụ sinh tồn: Thundering Herd Mitigation', color: '#f59e0b' },
                { label: `Cấp Độ Kỹ Sư: Level ${gamification.level}`, desc: `Điểm thưởng: ${gamification.exp || 0} XP • Architect Ranking`, color: '#38bdf8' },
                { label: isAudioMuted ? 'Âm Thanh: Đang Tắt' : 'Âm Thanh: Retro 8-Bit Bật', desc: 'Web Audio API Synth phản hồi thời gian thực', color: '#10b981' },
              ].map((chip, i) => (
                <div
                  key={i}
                  className={`arcade-metric-card arcade-metric-${i}`}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '180px',
                  }}
                >
                  <span className="arcade-metric-label" style={{ fontWeight: 800, color: chip.color }}>{chip.label}</span>
                  <span className="arcade-metric-desc" style={{ fontSize: '12.5px', marginTop: '3px', color: '#94a3b8' }}>{chip.desc}</span>
                </div>
              ))}
            </div>

            {/* Daily On-Call Rotation & Status Bar */}
            <div
              className="arcade-oncall-banner"
              style={{
                marginTop: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '0.85rem',
                color: '#fde68a',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🔥</span>
                <span>
                  <strong>Daily On-Call Rotation:</strong> Streak <strong>{dailyStreak} Days</strong> • Today's Mission:{' '}
                  <em>"P0 Thundering Herd Mitigation"</em>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="arcade-oncall-btn"
                  onClick={() => handleSelectGame('boss')}
                  style={{
                    background: 'rgba(245, 158, 11, 0.25)',
                    border: '1px solid #f59e0b',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Respond ➔
                </button>
                <button
                  type="button"
                  className="arcade-sound-btn"
                  onClick={toggleSound}
                  title={isAudioMuted ? 'Unmute 8-bit Arcade Sound' : 'Mute Sound'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: isAudioMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    border: `1px solid ${isAudioMuted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
                    color: isAudioMuted ? '#f87171' : '#38bdf8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <span>{isAudioMuted ? '🔇 Muted' : '🔊 8-Bit On'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Game Selection Cards */}
          <div style={{ marginBottom: '28px' }}>
            <div
              className="arcade-section-heading"
              style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--ifm-color-content-secondary, #94a3b8)',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              🎮 CHỌN ĐẤU TRƯỜNG THỰC CHIẾN (SELECT EDUCATIONAL ARENA)
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
                    className={`arcade-game-card${isSelected ? ' selected' : ''}`}
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
                          className={`arcade-game-tag tag-${game.id}`}
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

                      <div className="arcade-game-title" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ifm-color-content, #ffffff)', marginBottom: '6px' }}>
                        {game.title}
                      </div>

                      <div className="arcade-game-desc" style={{ fontSize: '0.78rem', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.65))', lineHeight: 1.4 }}>
                        {game.desc}
                      </div>
                    </div>

                    <div className="arcade-game-footer" style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--sidebar-border, rgba(255, 255, 255, 0.06))', display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.5))' }}>
                      <span>High Score:</span>
                      <span style={{ color: game.color, fontWeight: 700 }}>{game.highScore} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Game Arena */}
          <div className="arcade-active-arena">
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
