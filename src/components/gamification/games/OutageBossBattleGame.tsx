import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { fetchAllTabQuestions, QuizQuestion, QuizCategoryKey } from '../../../services/googleSheetQuizService';

interface BossOption {
  text: string;
  correct: boolean;
  explanation: string;
  dmg: number;
  selfDmg: number;
}

interface BattleQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: BossOption[];
}

interface BossTheme {
  id: QuizCategoryKey;
  title: string;
  bossName: string;
  bossAvatar: string;
  badge: string;
  color: string;
  description: string;
}

const BOSS_THEMES: BossTheme[] = [
  {
    id: 'system-design',
    title: 'Distributed Outage',
    bossName: 'Thundering Herd Behemoth',
    bossAvatar: '🦬',
    badge: 'System Design',
    color: '#a855f7',
    description: 'Cache avalanches, distributed transactions, database lock contention, and Kafka partitions.',
  },
  {
    id: 'java',
    title: 'JVM Memory Crisis',
    bossName: 'Memory Leak Monster',
    bossAvatar: '👾',
    badge: 'Core Java',
    color: '#fbbf24',
    description: 'Stop-the-world GC pauses, thread pool starvation, volatile reordering, and JMM barriers.',
  },
  {
    id: 'spring-boot',
    title: 'Spring CrashLoop Incident',
    bossName: 'Circular Dependency Demon',
    bossAvatar: '🍃',
    badge: 'Spring Boot',
    color: '#34d399',
    description: 'Auto-configuration failures, connection pool timeouts, filter chains, and transaction rollbacks.',
  },
  {
    id: 'all',
    title: 'Universal Blackout',
    bossName: 'Chaos Engineering Titan',
    bossAvatar: '👑',
    badge: 'All Topics',
    color: '#38bdf8',
    description: 'A chaotic cross-disciplinary gauntlet spanning all technical domains in the knowledge base.',
  },
];

// Fallback emergency questions if offline
const EMERGENCY_FALLBACK_QUESTIONS: BattleQuestion[] = [
  {
    id: 'em1',
    question: 'High-traffic flash sale causes cache TTL expiry simultaneously across 10,000 requests. What pattern mitigates DB collapse?',
    options: [
      { text: 'Singleflight / Mutex locking per key + Stale-While-Revalidate', correct: true, explanation: 'Only 1 DB fetch runs concurrently; others await or serve stale cache with probabilistic early recomputation (XFetch).', dmg: 25, selfDmg: 0 },
      { text: 'Instantly restart all MySQL database replicas', correct: false, explanation: 'Restarting drops the buffer pool cache and worsens downtime.', dmg: 0, selfDmg: 20 },
      { text: 'Increase MySQL max_connections to 50,000', correct: false, explanation: 'Exhausts OS file descriptors and crashes thread scheduler.', dmg: 0, selfDmg: 25 },
      { text: 'Flush Redis cache memory completely', correct: false, explanation: 'Flushing makes 100% of traffic hit the database directly!', dmg: 0, selfDmg: 35 },
    ],
  },
  {
    id: 'em2',
    question: 'Worker threads in ThreadPoolExecutor are getting rejected under burst traffic with CallerRunsPolicy. What happens?',
    options: [
      { text: 'The calling Tomcat HTTP request thread executes the task synchronously, applying natural backpressure.', correct: true, explanation: 'CallerRunsPolicy forces the submitting thread to execute the runnable, slowing down incoming requests.', dmg: 25, selfDmg: 0 },
      { text: 'Tasks are silently dropped into /dev/null.', correct: false, explanation: 'That would be DiscardPolicy.', dmg: 0, selfDmg: 20 },
      { text: 'JVM throws fatal OutOfMemoryError: Metaspace.', correct: false, explanation: 'CallerRuns does not trigger Metaspace allocation.', dmg: 0, selfDmg: 20 },
      { text: 'ThreadPool automatically triples its maxPoolSize on the fly.', correct: false, explanation: 'Standard ThreadPoolExecutor does not dynamically resize beyond maxPoolSize.', dmg: 0, selfDmg: 20 },
    ],
  },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function OutageBossBattleGame() {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [selectedThemeIdx, setSelectedThemeIdx] = useState<number>(0);
  const [questionsPool, setQuestionsPool] = useState<Record<string, QuizQuestion[]>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'won' | 'lost'>('intro');
  const [activeQuestions, setActiveQuestions] = useState<BattleQuestion[]>([]);
  const [bossHp, setBossHp] = useState<number>(100);
  const [uptimeHp, setUptimeHp] = useState<number>(100);
  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [combo, setCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [showRules, setShowRules] = useState<boolean>(true);

  const currentTheme = BOSS_THEMES[selectedThemeIdx];

  // Fetch all quiz questions from Google Sheets service on mount
  useEffect(() => {
    let isMounted = true;
    async function loadQuizQuestions() {
      try {
        setIsLoadingQuestions(true);
        const data = await fetchAllTabQuestions();
        if (isMounted) {
          setQuestionsPool(data);
        }
      } catch (err) {
        console.error('Failed loading questions for boss battle:', err);
      } finally {
        if (isMounted) {
          setIsLoadingQuestions(false);
        }
      }
    }
    loadQuizQuestions();
    return () => {
      isMounted = false;
    };
  }, []);

  // 60-second game timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) {
      setGameState('lost');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Convert raw QuizQuestion into BattleQuestion with dynamic options & damage
  const prepareBattleQuestions = useCallback((themeId: QuizCategoryKey): BattleQuestion[] => {
    const rawList = questionsPool[themeId] || questionsPool.all || [];

    if (rawList.length === 0) {
      return EMERGENCY_FALLBACK_QUESTIONS;
    }

    // Pick 5 random unique questions from the pool
    const sampled = shuffle(rawList).slice(0, 5);

    return sampled.map((q) => {
      const correctIdx = q.correctOptionIndex;
      const opts: BossOption[] = q.options.map((optText, idx) => {
        const isCorrect = idx === correctIdx;
        return {
          text: optText,
          correct: isCorrect,
          explanation: isCorrect
            ? q.explanation || 'Correct mitigation decision!'
            : `Sub-optimal choice. ${q.explanation || 'This action degrades production stability.'}`,
          dmg: 25,
          selfDmg: isCorrect ? 0 : 25,
        };
      });

      return {
        id: q.id,
        question: q.questionText,
        codeSnippet: q.codeSnippet,
        options: shuffle(opts), // Shuffle options so A/B/C/D is randomized every round!
      };
    });
  }, [questionsPool]);

  const startGame = () => {
    const battleQs = prepareBattleQuestions(currentTheme.id);
    setActiveQuestions(battleQs);
    setBossHp(100);
    setUptimeHp(100);
    setCurrentQIdx(0);
    setTimeLeft(60);
    setCombo(0);
    setScore(0);
    setSelectedOption(null);
    setFeedback(null);
    setGameState('playing');
  };

  const currentQ = activeQuestions[currentQIdx] || EMERGENCY_FALLBACK_QUESTIONS[0];

  const handleAnswer = (optIdx: number) => {
    if (selectedOption !== null || gameState !== 'playing' || !currentQ) return;
    setSelectedOption(optIdx);

    const opt = currentQ.options[optIdx];
    const isCorrect = opt.correct;

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = 100 + newCombo * 25;
      setScore((prev) => prev + points);

      const nextBossHp = Math.max(0, bossHp - opt.dmg);
      setBossHp(nextBossHp);
      setFeedback({ isCorrect: true, text: `⚡ CRITICAL HIT! ${opt.explanation}` });

      if (nextBossHp <= 0) {
        setTimeout(() => {
          setGameState('won');
          const totalEarnedExp = 120 + newCombo * 10;
          addExp(totalEarnedExp, `Defeated ${currentTheme.bossName}!`);
          saveMiniGameScore('boss_battle', score + points);
          unlockAchievement('boss_slayer');
          triggerFireworks(5000);
        }, 1200);
        return;
      }
    } else {
      setCombo(0);
      const nextUptime = Math.max(0, uptimeHp - opt.selfDmg);
      setUptimeHp(nextUptime);
      setFeedback({ isCorrect: false, text: `🚨 PRODUCTION DEGRADED! ${opt.explanation}` });

      if (nextUptime <= 0) {
        setTimeout(() => {
          setGameState('lost');
        }, 1200);
        return;
      }
    }

    // Advance question after viewing feedback
    setTimeout(() => {
      setSelectedOption(null);
      setFeedback(null);
      if (currentQIdx + 1 < activeQuestions.length) {
        setCurrentQIdx((prev) => prev + 1);
      } else {
        // Finished all questions without dying
        setGameState('won');
        addExp(100, `Completed incident round against ${currentTheme.bossName}`);
        saveMiniGameScore('boss_battle', score);
        triggerFireworks(4000);
      }
    }, 2200);
  };

  const poolCount = (questionsPool[currentTheme.id] || []).length;

  return (
    <div
      style={{
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: `1px solid ${currentTheme.color}55`,
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px ${currentTheme.color}22`,
        padding: '24px',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: `${currentTheme.color}22`,
              border: `1.5px solid ${currentTheme.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
            }}
          >
            {currentTheme.bossAvatar}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Outage Boss Battle: {currentTheme.bossName}</span>
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: `${currentTheme.color}22`, color: currentTheme.color, border: `1px solid ${currentTheme.color}66` }}>
                {currentTheme.badge} ({poolCount > 0 ? `${poolCount} Questions in Pool` : 'Live Sheet'})
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              {currentTheme.description}
            </div>
          </div>
        </div>

        {/* Boss Theme Switcher & Rules Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowRules((prev) => !prev)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: showRules ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
              background: showRules ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: showRules ? '#38bdf8' : 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📖</span>
            <span>{showRules ? 'Hide Guidelines' : 'How to Play & Rules'}</span>
          </button>

          {gameState === 'intro' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {BOSS_THEMES.map((theme, idx) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedThemeIdx(idx)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: selectedThemeIdx === idx ? `1px solid ${theme.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                    background: selectedThemeIdx === idx ? `${theme.color}25` : 'rgba(255, 255, 255, 0.05)',
                    color: selectedThemeIdx === idx ? theme.color : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {theme.bossAvatar} {theme.bossName.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 📖 HOW TO PLAY GUIDELINES ACCORDION PANEL */}
      {showRules && (
        <div
          style={{
            padding: '18px 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📖</span>
            <span>Outage Boss Battle — How to Play & Combat Guidelines</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.83rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45 }}>
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>🎯 1. Mission Objective</div>
              <div>Defend your 99.999% SLA Uptime and deplete the Outage Boss (100 HP) before the 60-second incident clock runs out.</div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>⚔️ 2. Architectural Countermeasures</div>
              <div>Pick the production-grade fix to deal <strong>+25 Boss Damage</strong> and recover stability. Questions are dynamically drawn from your live quiz repository.</div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>💥 3. Penalties & Self-Damage</div>
              <div>Selecting anti-patterns (e.g. flushing all Redis memory or restarting replicas) inflicts <strong>-25% Uptime Damage</strong> to your SLA.</div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#c084fc', marginBottom: '4px' }}>🔥 4. Combo Streaks & EXP Multiplier</div>
              <div>Chain consecutive correct answers without mistakes to activate combo multipliers (+100, +125, +150 pts) and earn massive EXP toward Cosmic Ranks.</div>
            </div>
          </div>
        </div>
      )}

      {/* INTRO SCREEN */}
      {gameState === 'intro' && (
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '14px' }}>{currentTheme.bossAvatar}</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: currentTheme.color, marginBottom: '8px' }}>
            Emergency Alert: {currentTheme.bossName} Detected!
          </h3>
          <p style={{ maxWidth: '600px', margin: '0 auto 20px auto', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>
            Each battle dynamically pulls <strong>5 randomized questions from your live Daily Quiz repository</strong> ({poolCount > 0 ? `${poolCount} questions loaded` : 'Connecting...'}). Options are shuffled every round!
          </p>

          <button
            type="button"
            disabled={isLoadingQuestions}
            onClick={startGame}
            style={{
              padding: '12px 32px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${currentTheme.color} 0%, #1e1b4b 100%)`,
              border: `1.5px solid ${currentTheme.color}`,
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.05rem',
              cursor: isLoadingQuestions ? 'wait' : 'pointer',
              boxShadow: `0 0 25px ${currentTheme.color}55`,
              transition: 'all 0.2s ease',
            }}
          >
            {isLoadingQuestions ? '⏳ Syncing Questions...' : '⚔️ Engage Boss Battle (Start 60s Round)'}
          </button>
        </div>
      )}

      {/* ACTIVE BATTLE SCREEN */}
      {gameState === 'playing' && currentQ && (
        <div>
          {/* Status Bars: Boss HP vs Uptime HP */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Boss HP Bar */}
            <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ color: '#f87171' }}>{currentTheme.bossAvatar} {currentTheme.bossName}</span>
                <span style={{ color: '#f87171' }}>{bossHp} / 100 HP</span>
              </div>
              <div style={{ height: '10px', width: '100%', borderRadius: '5px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${bossHp}%`,
                    borderRadius: '5px',
                    background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* System Uptime HP Bar */}
            <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ color: '#34d399' }}>🛡️ System Uptime Health</span>
                <span style={{ color: '#34d399' }}>{uptimeHp}% Uptime</span>
              </div>
              <div style={{ height: '10px', width: '100%', borderRadius: '5px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${uptimeHp}%`,
                    borderRadius: '5px',
                    background: 'linear-gradient(90deg, #34d399, #10b981)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Timer & HUD Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.88rem', fontWeight: 700 }}>
            <span style={{ color: timeLeft < 15 ? '#ef4444' : '#fbbf24' }}>
              ⏱️ Time Remaining: {timeLeft}s
            </span>
            <span style={{ color: '#c084fc' }}>
              🔥 Combo: {combo}x (Score: {score})
            </span>
            <span style={{ color: '#38bdf8' }}>
              Incident {currentQIdx + 1} of {activeQuestions.length}
            </span>
          </div>

          {/* Question Card */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.45, marginBottom: currentQ.codeSnippet ? '12px' : '16px' }}>
              {currentQ.question}
            </div>

            {/* Optional Code Snippet if present in Quiz */}
            {currentQ.codeSnippet && (
              <pre
                style={{
                  background: '#0d1117',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  color: '#e6edf3',
                  overflowX: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '16px',
                }}
              >
                <code>{currentQ.codeSnippet}</code>
              </pre>
            )}

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQ.options.map((opt, idx) => {
                const isChosen = selectedOption === idx;
                let bg = 'rgba(255, 255, 255, 0.05)';
                let border = 'rgba(255, 255, 255, 0.12)';
                let textCol = '#ffffff';

                if (selectedOption !== null) {
                  if (opt.correct) {
                    bg = 'rgba(52, 211, 153, 0.2)';
                    border = '#34d399';
                    textCol = '#34d399';
                  } else if (isChosen) {
                    bg = 'rgba(239, 68, 68, 0.25)';
                    border = '#ef4444';
                    textCol = '#f87171';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={selectedOption !== null}
                    onClick={() => handleAnswer(idx)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: bg,
                      border: `1.5px solid ${border}`,
                      color: textCol,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      cursor: selectedOption === null ? 'pointer' : 'default',
                      lineHeight: 1.4,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontWeight: 800, marginRight: '8px' }}>
                      {['A', 'B', 'C', 'D', 'E'][idx] || `${idx + 1}`}.
                    </span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Instant Feedback Alert */}
            {feedback && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: feedback.isCorrect ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: feedback.isCorrect ? '1px solid #34d399' : '1px solid #ef4444',
                  color: feedback.isCorrect ? '#34d399' : '#f87171',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                {feedback.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VICTORY SCREEN */}
      {gameState === 'won' && (
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '12px' }}>👑</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
            VICTORY! Outage Extinguished!
          </h3>
          <p style={{ maxWidth: '500px', margin: '0 auto 16px auto', fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            You defeated {currentTheme.bossName} with {uptimeHp}% uptime intact and a score of {score} points!
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '10px',
              background: 'rgba(251, 191, 36, 0.2)',
              border: '1px solid #fbbf24',
              color: '#fbbf24',
              fontWeight: 800,
              fontSize: '0.95rem',
              marginBottom: '24px',
            }}
          >
            <span>⚡ +120 EXP Awarded</span>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setGameState('intro')}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
                border: '1px solid #38bdf8',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Play Another Battle (New Randomized Questions) 🔄
            </button>
          </div>
        </div>
      )}

      {/* DEFEAT SCREEN */}
      {gameState === 'lost' && (
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '12px' }}>💥</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginBottom: '8px' }}>
            System Outage: Production Cascaded!
          </h3>
          <p style={{ maxWidth: '500px', margin: '0 auto 20px auto', fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            System uptime dropped to 0% or time ran out. Review the incident runbook and try again!
          </p>

          <button
            type="button"
            onClick={startGame}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: '1px solid #f87171',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Retry Incident (New Questions) 🔄
          </button>
        </div>
      )}
    </div>
  );
}
