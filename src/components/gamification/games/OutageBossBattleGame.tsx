import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { arcadeAudio } from '../../../utils/arcadeAudio';
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

interface IncidentDecision {
  question: string;
  codeSnippet?: string;
  chosenText: string;
  correctText: string;
  isCorrect: boolean;
  explanation: string;
}

type SeverityLevel = 'P3' | 'P2' | 'P0';
type BattleDifficulty = 'all' | 'easy' | 'medium' | 'hard';

const BATTLE_DIFFICULTY_TABS: { id: BattleDifficulty; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Levels', icon: '⭐', color: '#a855f7' },
  { id: 'easy', label: 'Easy (Junior)', icon: '🟢', color: '#38bdf8' },
  { id: 'medium', label: 'Medium (Mid)', icon: '🟡', color: '#34d399' },
  { id: 'hard', label: 'Hard (Senior/Staff)', icon: '🔴', color: '#f59e0b' },
];

interface SeverityConfig {
  id: SeverityLevel;
  label: string;
  badge: string;
  color: string;
  timerSeconds: number;
  mistakeDmgPercent: number;
  expReward: number;
}

const SEVERITY_CONFIGS: Record<SeverityLevel, SeverityConfig> = {
  P3: { id: 'P3', label: 'P3 Minor', badge: '🟢 P3 Minor', color: '#34d399', timerSeconds: 75, mistakeDmgPercent: 15, expReward: 90 },
  P2: { id: 'P2', label: 'P2 Major', badge: '🟡 P2 Major', color: '#fbbf24', timerSeconds: 60, mistakeDmgPercent: 25, expReward: 120 },
  P0: { id: 'P0', label: 'P0 Sev-1 Critical', badge: '🔴 P0 Sev-1 Critical', color: '#f87171', timerSeconds: 40, mistakeDmgPercent: 35, expReward: 200 },
};

const BOSS_THEMES: BossTheme[] = [
  { id: 'system-design', title: 'Distributed Outage', bossName: 'Thundering Herd Behemoth', bossAvatar: '🦬', badge: 'System Design', color: '#a855f7', description: 'Cache avalanches & lock contention' },
  { id: 'java', title: 'JVM Memory Crisis', bossName: 'Memory Leak Monster', bossAvatar: '👾', badge: 'Core Java', color: '#fbbf24', description: 'GC pauses & thread starvation' },
  { id: 'spring-boot', title: 'Spring CrashLoop', bossName: 'Circular Dependency Demon', bossAvatar: '🍃', badge: 'Spring Boot', color: '#34d399', description: 'Connection pools & rollbacks' },
  { id: 'all', title: 'Universal Blackout', bossName: 'Chaos Titan', bossAvatar: '👑', badge: 'All Topics', color: '#38bdf8', description: 'Cross-disciplinary gauntlet' },
];

const EMERGENCY_FALLBACK_QUESTIONS: BattleQuestion[] = [
  {
    id: 'em1',
    question: 'Simultaneous cache expiry across 10,000 requests threatens DB collapse. What pattern mitigates this?',
    options: [
      { text: 'Singleflight mutex locking per key + Stale-While-Revalidate', correct: true, explanation: 'Only 1 DB fetch executes concurrently; others serve stale cache.', dmg: 25, selfDmg: 0 },
      { text: 'Instantly restart all MySQL replicas', correct: false, explanation: 'Drops buffer pool cache and worsens downtime.', dmg: 0, selfDmg: 25 },
      { text: 'Increase max_connections to 50,000', correct: false, explanation: 'Exhausts OS file descriptors and crashes thread scheduler.', dmg: 0, selfDmg: 25 },
      { text: 'Flush Redis cache completely', correct: false, explanation: 'Forces 100% of traffic to hit database directly.', dmg: 0, selfDmg: 35 },
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

// Sparkline SVG renderer
function Sparkline({ data, color, minVal, maxVal }: { data: number[]; color: string; minVal: number; maxVal: number }) {
  const width = 110;
  const height = 30;
  if (data.length < 2) return null;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const norm = (val - minVal) / Math.max(1, maxVal - minVal);
    const y = height - norm * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function OutageBossBattleGame() {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [selectedThemeIdx, setSelectedThemeIdx] = useState<number>(0);
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>('P2');
  const [selectedDifficulty, setSelectedDifficulty] = useState<BattleDifficulty>('all');
  const [questionsPool, setQuestionsPool] = useState<Record<string, QuizQuestion[]>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);

  // Game state
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'won' | 'lost'>('intro');
  const [activeQuestions, setActiveQuestions] = useState<BattleQuestion[]>([]);
  const [bossHp, setBossHp] = useState<number>(100);
  const [uptimeHp, setUptimeHp] = useState<number>(100);
  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [combo, setCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  // Telemetry Sparkline History
  const [latencyHistory, setLatencyHistory] = useState<number[]>([6800, 7200, 6900, 7400]);
  const [errorRateHistory, setErrorRateHistory] = useState<number[]>([18.5, 21.0, 19.2, 23.4]);
  const [dbPoolHistory, setDbPoolHistory] = useState<number[]>([89, 93, 91, 95]);

  // Lifelines
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [shieldUsed, setShieldUsed] = useState<boolean>(false);
  const [traceUsed, setTraceUsed] = useState<boolean>(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [failoverUsed, setFailoverUsed] = useState<boolean>(false);

  // Post Mortem
  const [incidentLog, setIncidentLog] = useState<IncidentDecision[]>([]);

  const currentTheme = BOSS_THEMES[selectedThemeIdx];
  const severityConfig = SEVERITY_CONFIGS[selectedSeverity];
  const isEnraged = bossHp <= 50 && bossHp > 0;

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
        console.error('Failed fetching quiz questions:', err);
      } finally {
        if (isMounted) setIsLoadingQuestions(false);
      }
    }
    loadQuizQuestions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Timer: Runs ONLY when playing AND no option is currently chosen
  useEffect(() => {
    if (gameState !== 'playing' || selectedOption !== null) return;
    if (timeLeft <= 0) {
      setGameState('lost');
      arcadeAudio.playError();
      return;
    }
    const intervalMs = isEnraged ? 750 : 1000; // 1.33x faster when Enraged!
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [gameState, timeLeft, selectedOption, isEnraged]);

  // Audio siren when Enraged triggered
  useEffect(() => {
    if (isEnraged && gameState === 'playing') {
      arcadeAudio.playAlarm();
    }
  }, [isEnraged, gameState]);

  const prepareBattleQuestions = useCallback(
    (themeId: QuizCategoryKey, mistakeDmg: number, difficulty: BattleDifficulty): BattleQuestion[] => {
      let rawList = questionsPool[themeId] || questionsPool.all || [];

      if (rawList.length === 0) {
        return EMERGENCY_FALLBACK_QUESTIONS;
      }

      if (difficulty === 'easy') {
        const match = rawList.filter((q) => q.difficulty === 'Junior');
        if (match.length > 0) rawList = match;
      } else if (difficulty === 'medium') {
        const match = rawList.filter((q) => q.difficulty === 'Mid');
        if (match.length > 0) rawList = match;
      } else if (difficulty === 'hard') {
        const match = rawList.filter((q) => q.difficulty === 'Senior' || q.difficulty === 'Staff');
        if (match.length > 0) rawList = match;
      }

      const sampled = shuffle(rawList).slice(0, 5);

      return sampled.map((q) => {
        const correctIdx = q.correctOptionIndex;
        const opts: BossOption[] = q.options.map((optText, idx) => {
          const isCorrect = idx === correctIdx;
          return {
            text: optText,
            correct: isCorrect,
            explanation: isCorrect ? q.explanation || 'Correct mitigation!' : q.explanation || 'Sub-optimal choice.',
            dmg: 25,
            selfDmg: isCorrect ? 0 : mistakeDmg,
          };
        });

        return {
          id: q.id,
          question: q.questionText,
          codeSnippet: q.codeSnippet,
          options: shuffle(opts),
        };
      });
    },
    [questionsPool]
  );

  const startGame = () => {
    arcadeAudio.playLaser();
    const battleQs = prepareBattleQuestions(currentTheme.id, severityConfig.mistakeDmgPercent, selectedDifficulty);
    setActiveQuestions(battleQs);
    setBossHp(100);
    setUptimeHp(100);
    setCurrentQIdx(0);
    setTimeLeft(severityConfig.timerSeconds);
    setCombo(0);
    setScore(0);
    setSelectedOption(null);
    setFeedback(null);
    setShieldActive(false);
    setShieldUsed(false);
    setTraceUsed(false);
    setEliminatedOptions([]);
    setFailoverUsed(false);
    setIncidentLog([]);
    setLatencyHistory([6800, 7200, 6900, 7400]);
    setErrorRateHistory([18.5, 21.0, 19.2, 23.4]);
    setDbPoolHistory([89, 93, 91, 95]);
    setGameState('playing');
  };

  const handleUseShield = () => {
    if (shieldUsed || selectedOption !== null) return;
    arcadeAudio.playShield();
    setShieldActive(true);
    setShieldUsed(true);
  };

  const handleUseTrace = () => {
    if (traceUsed || selectedOption !== null) return;
    arcadeAudio.playBlip();
    setTraceUsed(true);
    const q = activeQuestions[currentQIdx];
    if (!q) return;
    const incorrectIndices = q.options.map((opt, idx) => ({ opt, idx })).filter((x) => !x.opt.correct).map((x) => x.idx);
    const eliminated = shuffle(incorrectIndices).slice(0, 2);
    setEliminatedOptions(eliminated);
  };

  const handleUseFailover = () => {
    if (failoverUsed || selectedOption !== null) return;
    arcadeAudio.playCorrect();
    setFailoverUsed(true);
    setTimeLeft((prev) => prev + 20);
    setUptimeHp((prev) => Math.min(100, prev + 15));
  };

  const handleChooseOption = (idx: number) => {
    if (selectedOption !== null || feedback !== null) return;
    const q = activeQuestions[currentQIdx];
    if (!q) return;

    setSelectedOption(idx);
    const opt = q.options[idx];
    const correctOpt = q.options.find((o) => o.correct);

    setIncidentLog((prev) => [
      ...prev,
      {
        question: q.question,
        codeSnippet: q.codeSnippet,
        chosenText: opt.text,
        correctText: correctOpt?.text || '',
        isCorrect: opt.correct,
        explanation: opt.explanation,
      },
    ]);

    const curLatency = latencyHistory[latencyHistory.length - 1] || 7000;
    const curErr = errorRateHistory[errorRateHistory.length - 1] || 20;
    const curPool = dbPoolHistory[dbPoolHistory.length - 1] || 90;

    if (opt.correct) {
      arcadeAudio.playLaser();
      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = 100 * newCombo + Math.floor(timeLeft * 1.5);
      setScore((prev) => prev + points);

      const nextBossHp = Math.max(0, bossHp - opt.dmg);
      setBossHp(nextBossHp);
      setFeedback({ isCorrect: true, text: `⚡ Direct hit! ${opt.explanation}` });

      // Telemetry recovers towards nominal
      setLatencyHistory((prev) => [...prev.slice(-5), Math.max(12, Math.floor(curLatency * 0.4))]);
      setErrorRateHistory((prev) => [...prev.slice(-5), Math.max(0.01, +(curErr * 0.25).toFixed(2))]);
      setDbPoolHistory((prev) => [...prev.slice(-5), Math.max(18, Math.floor(curPool * 0.55))]);
    } else {
      arcadeAudio.playError();
      setCombo(0);
      let nextUptime = uptimeHp;
      if (shieldActive) {
        setShieldActive(false);
        setFeedback({ isCorrect: false, text: `🛡️ Shield absorbed penalty! ${opt.explanation}` });
      } else {
        nextUptime = Math.max(0, uptimeHp - opt.selfDmg);
        setUptimeHp(nextUptime);
        setFeedback({ isCorrect: false, text: `🚨 Degradation (-${opt.selfDmg}%): ${opt.explanation}` });
      }

      // Telemetry degrades into red zone
      setLatencyHistory((prev) => [...prev.slice(-5), Math.min(9999, curLatency + 2200)]);
      setErrorRateHistory((prev) => [...prev.slice(-5), Math.min(85, +(curErr + 14).toFixed(1))]);
      setDbPoolHistory((prev) => [...prev.slice(-5), Math.min(100, curPool + 10)]);
    }
  };

  const handleAdvanceNext = () => {
    if (bossHp <= 0) {
      setGameState('won');
      addExp(severityConfig.expReward, `Defeated ${currentTheme.bossName}`);
      saveMiniGameScore('boss_battle', score);
      unlockAchievement('boss_slayer');
      arcadeAudio.playVictory();
      triggerFireworks(3000);
      return;
    }

    if (uptimeHp <= 0) {
      setGameState('lost');
      arcadeAudio.playError();
      return;
    }

    if (currentQIdx + 1 < activeQuestions.length) {
      arcadeAudio.playBlip();
      setCurrentQIdx((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
      setEliminatedOptions([]);
    } else {
      setGameState('won');
      addExp(severityConfig.expReward, `Extinguished outage against ${currentTheme.bossName}`);
      saveMiniGameScore('boss_battle', score);
      arcadeAudio.playVictory();
      triggerFireworks(3000);
    }
  };

  const currentQ = activeQuestions[currentQIdx];

  // 3-Phase Incident label
  const incidentPhaseLabel = useMemo(() => {
    if (currentQIdx < 2) return { phase: 'Phase 1', title: 'Triage & Blast Radius Containment', color: '#38bdf8' };
    if (currentQIdx < 4) return { phase: 'Phase 2', title: 'Root Cause Isolation & Diagnostic', color: '#a855f7' };
    return { phase: 'Phase 3', title: 'Prevention & Architectural Hardening', color: '#34d399' };
  }, [currentQIdx]);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
        borderRadius: '18px',
        border: isEnraged ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
        padding: '22px',
        color: '#ffffff',
        transition: 'border 0.3s ease',
      }}
    >
      {/* ── 1. INTRO SCREEN ── */}
      {gameState === 'intro' && (
        <div style={{ textAlign: 'center', padding: '10px 6px' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '6px' }}>👾</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
            Outage Boss Battle
          </div>
          <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '580px', margin: '0 auto 18px auto', lineHeight: 1.45 }}>
            Defend SLA uptime against cascading outages, memory leaks, and distributed failures. Triage root causes under pressure before your SLA breaches!
          </div>

          {/* Quick Selectors Row */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {/* Severity Selector */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(Object.keys(SEVERITY_CONFIGS) as SeverityLevel[]).map((sevKey) => {
                const cfg = SEVERITY_CONFIGS[sevKey];
                const isSelected = selectedSeverity === sevKey;
                return (
                  <button
                    key={sevKey}
                    type="button"
                    onClick={() => {
                      arcadeAudio.playBlip();
                      setSelectedSeverity(sevKey);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? cfg.color : 'rgba(255, 255, 255, 0.1)'}`,
                      background: isSelected ? `${cfg.color}25` : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? cfg.color : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.76rem',
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    {cfg.badge}
                  </button>
                );
              })}
            </div>

            {/* Difficulty Selector */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {BATTLE_DIFFICULTY_TABS.map((diff) => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => {
                      arcadeAudio.playBlip();
                      setSelectedDifficulty(diff.id);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? diff.color : 'rgba(255, 255, 255, 0.08)'}`,
                      background: isSelected ? `${diff.color}25` : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? diff.color : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.76rem',
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{diff.icon}</span> <span>{diff.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Boss Cards Selection Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '20px', textAlign: 'left' }}>
            {BOSS_THEMES.map((theme, idx) => {
              const isSelected = selectedThemeIdx === idx;
              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    arcadeAudio.playBlip();
                    setSelectedThemeIdx(idx);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isSelected ? `2px solid ${theme.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? `${theme.color}20` : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{theme.bossAvatar}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? theme.color : '#ffffff' }}>
                        {theme.bossName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {theme.badge}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.65)' }}>{theme.description}</div>
                </div>
              );
            })}
          </div>

          {/* Launch Button */}
          <button
            type="button"
            disabled={isLoadingQuestions}
            onClick={startGame}
            style={{
              padding: '14px 44px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${currentTheme.color} 0%, #1e1b4b 100%)`,
              border: `1.5px solid ${currentTheme.color}`,
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.05rem',
              cursor: isLoadingQuestions ? 'wait' : 'pointer',
              boxShadow: `0 0 25px ${currentTheme.color}44`,
            }}
          >
            {isLoadingQuestions ? '⏳ Syncing Incident Pool...' : `⚔️ Engage ${currentTheme.bossName} [${severityConfig.id}]`}
          </button>
        </div>
      )}

      {/* ── 2. ACTIVE BATTLE SCREEN ── */}
      {gameState === 'playing' && currentQ && (
        <div>
          {/* Top Status: Boss HP & SLA Uptime & Timer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
            {/* Boss HP */}
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>
                <span>{currentTheme.bossAvatar} {currentTheme.bossName} {isEnraged ? '🔥 ENRAGED' : ''}</span>
                <span>{bossHp} HP</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bossHp}%`, background: '#ef4444', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Uptime SLA */}
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
                <span>🛡️ SLA Uptime {shieldActive ? '(Shield Active)' : ''}</span>
                <span>{uptimeHp}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${uptimeHp}%`, background: '#34d399', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Timer & Lifelines & Exit */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: selectedOption !== null ? 'rgba(56, 189, 248, 0.15)' : timeLeft <= 15 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedOption !== null ? '#38bdf8' : timeLeft <= 15 ? '#ef4444' : '#fbbf24',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                }}
              >
                {selectedOption !== null ? '⏸️ Paused' : `⏱️ ${timeLeft}s`}
              </div>
              <button
                type="button"
                disabled={shieldUsed || selectedOption !== null}
                onClick={handleUseShield}
                style={{ padding: '6px 8px', borderRadius: '6px', background: shieldActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.08)', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '0.74rem', fontWeight: 700, cursor: shieldUsed || selectedOption !== null ? 'not-allowed' : 'pointer' }}
                title="WAF Shield"
              >
                🛡️
              </button>
              <button
                type="button"
                disabled={traceUsed || selectedOption !== null}
                onClick={handleUseTrace}
                style={{ padding: '6px 8px', borderRadius: '6px', background: 'rgba(192, 132, 252, 0.08)', border: '1px solid #c084fc', color: '#c084fc', fontSize: '0.74rem', fontWeight: 700, cursor: traceUsed || selectedOption !== null ? 'not-allowed' : 'pointer' }}
                title="APM Filter 50/50"
              >
                🔍
              </button>
              <button
                type="button"
                disabled={failoverUsed || selectedOption !== null}
                onClick={handleUseFailover}
                style={{ padding: '6px 8px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid #34d399', color: '#34d399', fontSize: '0.74rem', fontWeight: 700, cursor: failoverUsed || selectedOption !== null ? 'not-allowed' : 'pointer' }}
                title="Failover (+20s / +15% SLA)"
              >
                ⚡
              </button>
              <button
                type="button"
                onClick={() => {
                  arcadeAudio.playBlip();
                  setGameState('intro');
                }}
                style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem', fontWeight: 750, cursor: 'pointer' }}
                title="Exit to Setup"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Enraged PagerDuty Warning Banner */}
          {isEnraged && (
            <div
              style={{
                marginBottom: '12px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.25) 100%)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🚨</span>
              <span>
                <strong>CRITICAL SEV-1 ALARM:</strong> Boss has entered ENRAGE MODE! Cascading timeouts active — countdown clock running 1.3x faster!
              </span>
            </div>
          )}

          {/* Question Prompt with Phase Badge */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: `${incidentPhaseLabel.color}20`,
                  border: `1px solid ${incidentPhaseLabel.color}40`,
                  color: incidentPhaseLabel.color,
                }}
              >
                {incidentPhaseLabel.phase}: {incidentPhaseLabel.title}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                Incident {currentQIdx + 1} of {activeQuestions.length}
              </span>
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.4 }}>
              {currentQ.question}
            </div>
          </div>

          {/* Options: 1 Option per Line */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {currentQ.options.map((opt, idx) => {
              const isEliminated = eliminatedOptions.includes(idx);
              const isChosen = selectedOption === idx;
              const isHovered = hoveredOption === idx && selectedOption === null && !isEliminated;
              const letterBadge = ['A', 'B', 'C', 'D'][idx] || `${idx + 1}`;

              let border = isHovered ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)';
              let bg = isHovered ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)';
              let color = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.88)';
              let shadow = isHovered ? '0 4px 14px rgba(56, 189, 248, 0.25)' : 'none';
              let transform = isHovered ? 'translateY(-1px)' : 'none';

              if (isEliminated) {
                bg = 'transparent';
                border = '1px dashed rgba(255, 255, 255, 0.05)';
                color = 'rgba(255, 255, 255, 0.2)';
                shadow = 'none';
                transform = 'none';
              } else if (selectedOption !== null) {
                if (opt.correct) {
                  bg = 'rgba(52, 211, 153, 0.15)';
                  border = '1.5px solid #34d399';
                  color = '#34d399';
                  shadow = '0 0 16px rgba(52, 211, 153, 0.3)';
                } else if (isChosen) {
                  bg = 'rgba(239, 68, 68, 0.15)';
                  border = '1.5px solid #ef4444';
                  color = '#fca5a5';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isEliminated || selectedOption !== null}
                  onMouseEnter={() => setHoveredOption(idx)}
                  onMouseLeave={() => setHoveredOption(null)}
                  onClick={() => {
                    setHoveredOption(null);
                    handleChooseOption(idx);
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: bg,
                    border,
                    color,
                    boxShadow: shadow,
                    transform,
                    fontSize: '0.84rem',
                    fontWeight: 650,
                    textAlign: 'left',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: isEliminated || selectedOption !== null ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: isChosen
                        ? opt.correct
                          ? '#34d399'
                          : '#ef4444'
                        : isHovered
                        ? 'rgba(56, 189, 248, 0.25)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: isChosen && (opt.correct || isChosen) ? '#0f172a' : isHovered ? '#38bdf8' : 'rgba(255, 255, 255, 0.65)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {letterBadge}
                  </span>
                  <span style={{ flex: 1 }}>{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback & Manual Next Button */}
          {feedback && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: feedback.isCorrect ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1.5px solid ${feedback.isCorrect ? '#34d399' : '#ef4444'}`,
                marginBottom: '8px',
              }}
            >
              <div style={{ color: feedback.isCorrect ? '#34d399' : '#fca5a5', fontSize: '0.85rem', lineHeight: 1.45, marginBottom: '12px' }}>
                {feedback.text}
              </div>

              <button
                type="button"
                onClick={handleAdvanceNext}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: bossHp <= 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : uptimeHp <= 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                }}
              >
                {bossHp <= 0
                  ? '🏆 Boss Defeated! Claim Victory ➔'
                  : uptimeHp <= 0
                  ? '🚨 SLA Breached! View Incident Report ➔'
                  : currentQIdx + 1 >= activeQuestions.length
                  ? '🏆 Outage Extinguished! Finish Round ➔'
                  : 'Next Incident Question ➔'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 3. VICTORY / DEFEAT SCREEN ── */}
      {(gameState === 'won' || gameState === 'lost') && (
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
            {gameState === 'won' ? '🏆' : '💀'}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: gameState === 'won' ? '#34d399' : '#f87171', marginBottom: '6px' }}>
            {gameState === 'won' ? 'Production Incident Resolved!' : 'Outage Cascade Triggered'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '16px' }}>
            Final SLA: <strong>{uptimeHp}%</strong> • Score: <strong>{score} pts</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              arcadeAudio.playBlip();
              setGameState('intro');
            }}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Play Another Incident ➔
          </button>
        </div>
      )}
    </div>
  );
}
