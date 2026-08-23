import React, { useState } from 'react';
import Layout from '@theme/Layout';
import { useUserProgress } from '../../context/UserProgressContext';
import OutageBossBattleGame from '../../components/gamification/games/OutageBossBattleGame';
import ArchitecturePuzzleGame from '../../components/gamification/games/ArchitecturePuzzleGame';
import SpotTheBugDuelGame from '../../components/gamification/games/SpotTheBugDuelGame';
import FlashcardArenaGame from '../../components/gamification/games/FlashcardArenaGame';
import LevelUpToast from '../../components/gamification/LevelUpToast';

export default function ArcadePage(): React.JSX.Element {
  const { gamification } = useUserProgress();
  const [activeGame, setActiveGame] = useState<'boss' | 'puzzle' | 'bug' | 'flashcards'>('boss');
  const scores = gamification?.miniGameScores || {};

  return (
    // @ts-ignore
    <Layout
      title="Galactic Arcade - Gamified Engineering Arena"
      description="Learn distributed systems, Java concurrency, and system design by playing interactive educational games."
    >
      <LevelUpToast />
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #090d16 0%, #0d1117 100%)',
          padding: '36px 20px 80px 20px',
          color: '#ffffff',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Clean Arcade Page Title Header */}
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <h1
              style={{
                margin: '0 0 8px 0',
                fontSize: '2.2rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              🕹️ Galactic Engineering Arcade
            </h1>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '680px', marginInline: 'auto' }}>
              Sharpen your distributed systems instincts, debug concurrency race conditions, and battle production outages through interactive simulations.
            </p>
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
                  id: 'puzzle',
                  title: 'Architecture Pipe Puzzle',
                  tag: 'System Design Arena',
                  icon: '⚙️',
                  desc: 'Design Bitly, Netflix, Uber, Twitter, and Stripe pipelines with HelloInterview deep breakdowns.',
                  color: '#38bdf8',
                  highScore: scores.architecture_puzzle || 0,
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
                  id: 'flashcards',
                  title: 'Concept Flashcards',
                  tag: 'Spaced Repetition',
                  icon: '📇',
                  desc: 'Master ACID isolation, Paxos vs Raft, CAP theorem, and JVM Metaspace in seconds.',
                  color: '#10b981',
                  highScore: scores.flashcards || 0,
                },
              ].map((game) => {
                const isSelected = activeGame === game.id;
                return (
                  <div
                    key={game.id}
                    onClick={() => setActiveGame(game.id as any)}
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
            {activeGame === 'boss' && <OutageBossBattleGame />}
            {activeGame === 'puzzle' && <ArchitecturePuzzleGame />}
            {activeGame === 'bug' && <SpotTheBugDuelGame />}
            {activeGame === 'flashcards' && <FlashcardArenaGame />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
