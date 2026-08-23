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

interface IncidentDecision {
  question: string;
  codeSnippet?: string;
  chosenText: string;
  correctText: string;
  isCorrect: boolean;
  explanation: string;
}

type SeverityLevel = 'P3' | 'P2' | 'P0';

interface SeverityConfig {
  id: SeverityLevel;
  label: string;
  badge: string;
  color: string;
  timerSeconds: number;
  mistakeDmgPercent: number;
  expReward: number;
  description: string;
}

const SEVERITY_CONFIGS: Record<SeverityLevel, SeverityConfig> = {
  P3: {
    id: 'P3',
    label: 'P3 - Minor Degradation',
    badge: '🟢 P3 Minor',
    color: '#34d399',
    timerSeconds: 75,
    mistakeDmgPercent: 15,
    expReward: 90,
    description: '75s Clock • 15% Error Penalty • Low-stress on-call triage',
  },
  P2: {
    id: 'P2',
    label: 'P2 - Major Outage',
    badge: '🟡 P2 Major',
    color: '#fbbf24',
    timerSeconds: 60,
    mistakeDmgPercent: 25,
    expReward: 120,
    description: '60s Clock • 25% Error Penalty • Production SLA under threat',
  },
  P0: {
    id: 'P0',
    label: 'P0 - Sev-1 Global Blackout',
    badge: '🔴 P0 Sev-1 Critical',
    color: '#f87171',
    timerSeconds: 40,
    mistakeDmgPercent: 35,
    expReward: 200,
    description: '40s Clock • 35% Error Penalty • High-stakes +200 EXP payout',
  },
};

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
      { text: 'Instantly restart all MySQL database replicas', correct: false, explanation: 'Restarting drops the buffer pool cache and worsens downtime.', dmg: 0, selfDmg: 25 },
      { text: 'Increase MySQL max_connections to 50,000', correct: false, explanation: 'Exhausts OS file descriptors and crashes thread scheduler.', dmg: 0, selfDmg: 25 },
      { text: 'Flush Redis cache memory completely', correct: false, explanation: 'Flushing makes 100% of traffic hit the database directly!', dmg: 0, selfDmg: 35 },
    ],
  },
  {
    id: 'em2',
    question: 'Worker threads in ThreadPoolExecutor are getting rejected under burst traffic with CallerRunsPolicy. What happens?',
    options: [
      { text: 'The calling Tomcat HTTP request thread executes the task synchronously, applying natural backpressure.', correct: true, explanation: 'CallerRunsPolicy forces the submitting thread to execute the runnable, slowing down incoming requests.', dmg: 25, selfDmg: 0 },
      { text: 'Tasks are silently dropped into /dev/null.', correct: false, explanation: 'That would be DiscardPolicy.', dmg: 0, selfDmg: 25 },
      { text: 'JVM throws fatal OutOfMemoryError: Metaspace.', correct: false, explanation: 'CallerRuns does not trigger Metaspace allocation.', dmg: 0, selfDmg: 25 },
      { text: 'ThreadPool automatically triples its maxPoolSize on the fly.', correct: false, explanation: 'Standard ThreadPoolExecutor does not dynamically resize beyond maxPoolSize.', dmg: 0, selfDmg: 25 },
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
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>('P2');
  const [questionsPool, setQuestionsPool] = useState<Record<string, QuizQuestion[]>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);

  // Game Engine State
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
  const [showRules, setShowRules] = useState<boolean>(false);

  // Tactical Power-Ups State
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [shieldUsed, setShieldUsed] = useState<boolean>(false);
  const [traceUsed, setTraceUsed] = useState<boolean>(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [failoverUsed, setFailoverUsed] = useState<boolean>(false);

  // Combat Animation & Floating Damage
  const [floatingDamage, setFloatingDamage] = useState<{ text: string; color: string } | null>(null);

  // Incident History & Post-Mortem
  const [incidentLog, setIncidentLog] = useState<IncidentDecision[]>([]);
  const [showPostMortem, setShowPostMortem] = useState<boolean>(true);
  const [copiedPostMortem, setCopiedPostMortem] = useState<boolean>(false);

  // Boss Slayer Mastery Stats (stored in localStorage)
  const [bossMasteryStats, setBossMasteryStats] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('outage_boss_mastery_stats');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const currentTheme = BOSS_THEMES[selectedThemeIdx];
  const severityConfig = SEVERITY_CONFIGS[selectedSeverity];
  const isEnraged = bossHp <= 50 && bossHp > 0;

  const recordBossKill = (themeId: string) => {
    setBossMasteryStats((prev) => {
      const updated = { ...prev, [themeId]: (prev[themeId] || 0) + 1 };
      try {
        localStorage.setItem('outage_boss_mastery_stats', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Fetch quiz questions from Google Sheets service on mount
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

  // Incident timer
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
  const prepareBattleQuestions = useCallback(
    (themeId: QuizCategoryKey, mistakeDmg: number): BattleQuestion[] => {
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
              ? q.explanation || 'Correct architectural mitigation decision!'
              : `Sub-optimal choice. ${q.explanation || 'This action degrades production stability.'}`,
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
    const battleQs = prepareBattleQuestions(currentTheme.id, severityConfig.mistakeDmgPercent);
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
    setFloatingDamage(null);
    setIncidentLog([]);
    setGameState('playing');
  };

  const currentQ = activeQuestions[currentQIdx] || EMERGENCY_FALLBACK_QUESTIONS[0];

  // ── Power-Up 1: Rate Limiter / WAF Shield ──
  const handleUseShield = () => {
    if (shieldUsed || gameState !== 'playing') return;
    setShieldActive(true);
    setShieldUsed(true);
    setFloatingDamage({ text: '🛡️ WAF SHIELD ACTIVATED!', color: '#38bdf8' });
    setTimeout(() => setFloatingDamage(null), 1500);
  };

  // ── Power-Up 2: APM Trace (50/50 Eliminator) ──
  const handleUseTrace = () => {
    if (traceUsed || gameState !== 'playing' || !currentQ) return;
    const incorrectIndices = currentQ.options
      .map((opt, idx) => ({ opt, idx }))
      .filter((item) => !item.opt.correct)
      .map((item) => item.idx);

    const toEliminate = shuffle(incorrectIndices).slice(0, 2);
    setEliminatedOptions(toEliminate);
    setTraceUsed(true);
    setFloatingDamage({ text: '🔍 APM TRACE: 2 BUGS FILTERED!', color: '#c084fc' });
    setTimeout(() => setFloatingDamage(null), 1500);
  };

  // ── Power-Up 3: Autoscaling Failover (+20s Time & +15% Uptime) ──
  const handleUseFailover = () => {
    if (failoverUsed || gameState !== 'playing') return;
    setTimeLeft((prev) => prev + 20);
    setUptimeHp((prev) => Math.min(100, prev + 15));
    setFailoverUsed(true);
    setFloatingDamage({ text: '⏱️ +20s TIME & +15% UPTIME RECOVERED!', color: '#34d399' });
    setTimeout(() => setFloatingDamage(null), 1500);
  };

  const handleAnswer = (optIdx: number) => {
    if (selectedOption !== null || gameState !== 'playing' || !currentQ) return;
    setSelectedOption(optIdx);

    const opt = currentQ.options[optIdx];
    const isCorrect = opt.correct;
    const correctOpt = currentQ.options.find((o) => o.correct) || opt;

    // Log incident decision for post-mortem
    setIncidentLog((prev) => [
      ...prev,
      {
        question: currentQ.question,
        codeSnippet: currentQ.codeSnippet,
        chosenText: opt.text,
        correctText: correctOpt.text,
        isCorrect,
        explanation: opt.explanation,
      },
    ]);

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = 100 + newCombo * 25;
      setScore((prev) => prev + points);

      const nextBossHp = Math.max(0, bossHp - opt.dmg);
      setBossHp(nextBossHp);
      setFloatingDamage({ text: `⚡ CRITICAL HIT! -${opt.dmg} BOSS HP`, color: '#34d399' });
      setFeedback({ isCorrect: true, text: `⚡ CRITICAL HIT! ${opt.explanation}` });

      if (nextBossHp <= 0) {
        setTimeout(() => {
          setGameState('won');
          recordBossKill(currentTheme.id);
          const totalEarnedExp = severityConfig.expReward + newCombo * 10;
          addExp(totalEarnedExp, `Defeated ${currentTheme.bossName} [${severityConfig.id}]!`);
          saveMiniGameScore('boss_battle', score + points);
          unlockAchievement('boss_slayer');
          triggerFireworks(5000);
        }, 1200);
        return;
      }
    } else {
      setCombo(0);
      let nextUptime = uptimeHp;

      if (shieldActive) {
        setShieldActive(false);
        setFloatingDamage({ text: '🛡️ WAF SHIELD ABSORBED DAMAGE! (0% SLA LOST)', color: '#38bdf8' });
        setFeedback({ isCorrect: false, text: `🛡️ WAF SHIELD BROKEN! Damage absorbed. ${opt.explanation}` });
      } else {
        nextUptime = Math.max(0, uptimeHp - opt.selfDmg);
        setUptimeHp(nextUptime);
        setFloatingDamage({ text: `🚨 -${opt.selfDmg}% UPTIME SLA DEGRADATION!`, color: '#f87171' });
        setFeedback({ isCorrect: false, text: `🚨 PRODUCTION DEGRADED! ${opt.explanation}` });
      }

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
      setEliminatedOptions([]);
      setFloatingDamage(null);

      if (currentQIdx + 1 < activeQuestions.length) {
        setCurrentQIdx((prev) => prev + 1);
      } else {
        // Finished all questions without dying
        setGameState('won');
        recordBossKill(currentTheme.id);
        addExp(severityConfig.expReward, `Extinguished outage against ${currentTheme.bossName} [${severityConfig.id}]`);
        saveMiniGameScore('boss_battle', score);
        triggerFireworks(4000);
      }
    }, 2200);
  };

  const handleCopyPostMortem = () => {
    const text = `### 🚨 Production Incident Post-Mortem Report
**Target Incident**: ${currentTheme.title} (${currentTheme.bossName})
**Severity Level**: ${severityConfig.badge}
**Result**: ${gameState === 'won' ? '✅ MITIGATED / RESOLVED' : '❌ OUTAGE CASCADE'}
**Final Uptime SLA**: ${uptimeHp}% | **Score**: ${score} pts

#### 📋 Incident Decision Timeline
${incidentLog
  .map(
    (log, idx) => `
**Incident #${idx + 1}**: ${log.question}
- **Action Taken**: ${log.isCorrect ? '✅' : '❌'} ${log.chosenText}
- **Root Cause & Architectural Insight**: ${log.explanation}
`
  )
  .join('')}

#### 🔑 Key Incident Learnings
- Defense-in-depth and graceful degradation prevent cascading collapses.
- Rate limiting, bounded thread pools, and singleflight cache recomputation maintain 99.999% SLA availability under shock traffic.
`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedPostMortem(true);
        setTimeout(() => setCopiedPostMortem(false), 2500);
      });
    }
  };

  const poolCount = (questionsPool[currentTheme.id] || []).length;
  const currentBossKills = bossMasteryStats[currentTheme.id] || 0;

  return (
    <div
      style={{
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: isEnraged ? '2px solid #ef4444' : `1.5px solid ${currentTheme.color}55`,
        boxShadow: isEnraged
          ? '0 0 45px rgba(239, 68, 68, 0.4), 0 20px 50px rgba(0, 0, 0, 0.7)'
          : `0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px ${currentTheme.color}22`,
        padding: '28px',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Floating Damage Ticker */}
      {floatingDamage && (
        <div
          style={{
            position: 'absolute',
            top: '18px',
            right: '28px',
            zIndex: 30,
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: `1.5px solid ${floatingDamage.color}`,
            color: floatingDamage.color,
            fontWeight: 900,
            fontSize: '0.92rem',
            boxShadow: `0 0 20px ${floatingDamage.color}66`,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {floatingDamage.text}
        </div>
      )}

      {/* ── 1. Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: `${currentTheme.color}22`,
              border: `1.5px solid ${currentTheme.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: `0 0 16px ${currentTheme.color}44`,
            }}
          >
            {currentTheme.bossAvatar}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span>Outage Boss: {currentTheme.bossName}</span>
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: `${currentTheme.color}22`, color: currentTheme.color, border: `1px solid ${currentTheme.color}66` }}>
                {currentTheme.badge} ({poolCount > 0 ? `${poolCount} Questions in Pool` : 'Live Sheet'})
              </span>
              {currentBossKills > 0 && (
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.18)', color: '#34d399', border: '1px solid #34d399' }}>
                  🏆 Defeated: {currentBossKills}x
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              {currentTheme.description}
            </div>
          </div>
        </div>

        {/* Severity Selector & How to Play Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowRules((prev) => !prev)}
            style={{
              padding: '7px 14px',
              borderRadius: '10px',
              border: showRules ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
              background: showRules ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: showRules ? '#38bdf8' : 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.82rem',
              fontWeight: 750,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📖</span>
            <span>{showRules ? 'Hide Rules' : 'How to Play'}</span>
          </button>
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
            <span>Outage Boss Battle — How to Play & Incident Guidelines</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.83rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45 }}>
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>🎯 1. SLA & Outage Clock</div>
              <div>Defend your System Uptime SLA (100%) and deplete Boss HP (100) before the incident clock expires.</div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>🛠️ 2. Tactical Power-Ups</div>
              <div>Deploy WAF Shields (absorb error), APM Traces (50/50 bug filter), and Autoscaling Failover (+20s / +15% HP) mid-battle.</div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>🔥 3. Boss Enrage Phase</div>
              <div>At &le; 50% HP, the Boss enters Enraged mode (CPU / IOPS at 99%). Maintain combo streaks to defeat it quickly!</div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>📋 4. Post-Mortem RCA</div>
              <div>Every match concludes with a detailed RCA post-mortem report and 1-click clipboard export for study.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Boss Theme Selector & Difficulty Selector (Intro) ── */}
      {gameState === 'intro' && (
        <div style={{ marginBottom: '22px' }}>
          {/* Theme Selector */}
          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.65)', marginBottom: '10px' }}>
            Select Outage Scenario:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {BOSS_THEMES.map((theme, idx) => {
              const isSelected = selectedThemeIdx === idx;
              const kills = bossMasteryStats[theme.id] || 0;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedThemeIdx(idx)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isSelected ? `2px solid ${theme.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected ? `${theme.color}25` : 'rgba(255, 255, 255, 0.04)',
                    color: '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 0 16px ${theme.color}33` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{theme.bossAvatar}</span>
                    {kills > 0 && (
                      <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800 }}>
                        🏆 {kills}x
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isSelected ? theme.color : '#ffffff' }}>
                    {theme.bossName}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                    {theme.badge}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Severity Selector */}
          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.65)', marginBottom: '10px' }}>
            Select Incident Severity Tier:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '28px' }}>
            {(Object.keys(SEVERITY_CONFIGS) as SeverityLevel[]).map((sevKey) => {
              const cfg = SEVERITY_CONFIGS[sevKey];
              const isSelected = selectedSeverity === sevKey;
              return (
                <button
                  key={sevKey}
                  type="button"
                  onClick={() => setSelectedSeverity(sevKey)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: isSelected ? `2px solid ${cfg.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected ? `${cfg.color}22` : 'rgba(255, 255, 255, 0.03)',
                    color: '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: cfg.color, marginBottom: '2px' }}>
                    {cfg.badge}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {cfg.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Start Button */}
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <button
              type="button"
              disabled={isLoadingQuestions}
              onClick={startGame}
              style={{
                padding: '14px 36px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${currentTheme.color} 0%, #1e1b4b 100%)`,
                border: `1.5px solid ${currentTheme.color}`,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.1rem',
                cursor: isLoadingQuestions ? 'wait' : 'pointer',
                boxShadow: `0 0 30px ${currentTheme.color}55`,
                transition: 'all 0.2s ease',
              }}
            >
              {isLoadingQuestions ? '⏳ Syncing Live Question Pool...' : `⚔️ Engage Boss Battle [${severityConfig.id}]`}
            </button>
          </div>
        </div>
      )}

      {/* ── 3. ACTIVE BATTLE SCREEN ── */}
      {gameState === 'playing' && currentQ && (
        <div>
          {/* Status Bars: Boss HP vs Uptime HP */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Boss HP Bar */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: isEnraged ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                border: isEnraged ? '1.5px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: isEnraged ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ color: '#f87171' }}>
                  {currentTheme.bossAvatar} {currentTheme.bossName} {isEnraged ? '🔥 [ENRAGED]' : ''}
                </span>
                <span style={{ color: '#f87171' }}>{bossHp} / 100 HP</span>
              </div>
              <div style={{ height: '10px', width: '100%', borderRadius: '5px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${bossHp}%`,
                    borderRadius: '5px',
                    background: isEnraged
                      ? 'linear-gradient(90deg, #f97316, #ef4444)'
                      : 'linear-gradient(90deg, #ef4444, #dc2626)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* System Uptime HP Bar */}
            <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ color: '#34d399' }}>
                  🛡️ System SLA Uptime {shieldActive ? '(Shield Active)' : ''}
                </span>
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

          {/* HUD Info Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.88rem', fontWeight: 700, flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ color: timeLeft < 15 ? '#ef4444' : '#fbbf24' }}>
              ⏱️ Time Remaining: {timeLeft}s
            </span>
            <span style={{ color: '#c084fc' }}>
              🔥 Combo: {combo}x (Score: {score})
            </span>
            <span style={{ color: '#38bdf8' }}>
              Incident {currentQIdx + 1} of {activeQuestions.length} ({severityConfig.badge})
            </span>
          </div>

          {/* Tactical Power-Ups Toolbelt */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.65)', textTransform: 'uppercase' }}>
              🛠️ SRE On-Call Toolbelt (1-Use):
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={shieldUsed || selectedOption !== null}
                onClick={handleUseShield}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: shieldActive ? '1.5px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.4)',
                  background: shieldActive ? 'rgba(56, 189, 248, 0.25)' : shieldUsed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(56, 189, 248, 0.1)',
                  color: shieldUsed ? 'rgba(255, 255, 255, 0.25)' : '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 750,
                  cursor: shieldUsed || selectedOption !== null ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Absorbs the next incorrect answer penalty"
              >
                <span>🛡️</span>
                <span>{shieldActive ? 'Shield Ready' : shieldUsed ? 'Shield Used' : 'WAF Shield'}</span>
              </button>

              <button
                type="button"
                disabled={traceUsed || selectedOption !== null}
                onClick={handleUseTrace}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(192, 132, 252, 0.4)',
                  background: traceUsed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(192, 132, 252, 0.1)',
                  color: traceUsed ? 'rgba(255, 255, 255, 0.25)' : '#c084fc',
                  fontSize: '0.78rem',
                  fontWeight: 750,
                  cursor: traceUsed || selectedOption !== null ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Eliminates 2 wrong answer options"
              >
                <span>🔍</span>
                <span>{traceUsed ? 'Trace Used' : 'APM Trace (50/50)'}</span>
              </button>

              <button
                type="button"
                disabled={failoverUsed || selectedOption !== null}
                onClick={handleUseFailover}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  background: failoverUsed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(52, 211, 153, 0.1)',
                  color: failoverUsed ? 'rgba(255, 255, 255, 0.25)' : '#34d399',
                  fontSize: '0.78rem',
                  fontWeight: 750,
                  cursor: failoverUsed || selectedOption !== null ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Adds +20s to timer and restores +15% Uptime SLA"
              >
                <span>⏱️</span>
                <span>{failoverUsed ? 'Failover Used' : 'Autoscale (+20s/+15% HP)'}</span>
              </button>
            </div>
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

            {/* Code Snippet if present in Quiz */}
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
                const isEliminated = eliminatedOptions.includes(idx);

                let bg = 'rgba(255, 255, 255, 0.05)';
                let border = 'rgba(255, 255, 255, 0.12)';
                let textCol = '#ffffff';

                if (isEliminated) {
                  bg = 'rgba(255, 255, 255, 0.02)';
                  border = '1px dashed rgba(255, 255, 255, 0.08)';
                  textCol = 'rgba(255, 255, 255, 0.2)';
                } else if (selectedOption !== null) {
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
                    disabled={selectedOption !== null || isEliminated}
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
                      cursor: isEliminated ? 'not-allowed' : selectedOption === null ? 'pointer' : 'default',
                      lineHeight: 1.4,
                      transition: 'all 0.2s ease',
                      textDecoration: isEliminated ? 'line-through' : 'none',
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

      {/* ── 4. VICTORY / DEFEAT SCREENS WITH INCIDENT POST-MORTEM ── */}
      {(gameState === 'won' || gameState === 'lost') && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>
            {gameState === 'won' ? '👑' : '💥'}
          </div>
          <h3
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: gameState === 'won' ? '#34d399' : '#ef4444',
              marginBottom: '6px',
            }}
          >
            {gameState === 'won' ? 'VICTORY! Outage Extinguished!' : 'System Outage: Production Cascaded!'}
          </h3>
          <p style={{ maxWidth: '540px', margin: '0 auto 16px auto', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            {gameState === 'won'
              ? `You defeated ${currentTheme.bossName} [${severityConfig.id}] with ${uptimeHp}% SLA uptime intact and a score of ${score} pts!`
              : `System uptime dropped to 0% or incident clock expired under ${severityConfig.badge}. Review the RCA Post-Mortem below!`}
          </p>

          {gameState === 'won' && (
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
                marginBottom: '20px',
              }}
            >
              <span>⚡ +{severityConfig.expReward} EXP Awarded</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={startGame}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                background:
                  gameState === 'won'
                    ? 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Retry / Play Next Round 🔄
            </button>

            <button
              type="button"
              onClick={() => setGameState('intro')}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 750,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              Choose Another Boss ➔
            </button>
          </div>

          {/* 📋 Incident Post-Mortem & RCA Panel */}
          {incidentLog.length > 0 && (
            <div
              style={{
                textAlign: 'left',
                marginTop: '20px',
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📋 Incident Post-Mortem & RCA ({incidentLog.filter((l) => l.isCorrect).length}/{incidentLog.length} Mitigations Resolved)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCopyPostMortem}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{copiedPostMortem ? '✓' : '📋'}</span>
                    <span>{copiedPostMortem ? 'Copied Post-Mortem!' : 'Copy Post-Mortem'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPostMortem(!showPostMortem)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {showPostMortem ? 'Collapse ▲' : 'Expand ▼'}
                  </button>
                </div>
              </div>

              {showPostMortem && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {incidentLog.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: log.isCorrect ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        border: log.isCorrect ? '1px solid rgba(52, 211, 153, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', fontWeight: 750, color: '#ffffff', marginBottom: '6px' }}>
                        #{idx + 1}. {log.question}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: log.isCorrect ? '#34d399' : '#f87171', marginBottom: '4px' }}>
                        <strong>Decision:</strong> {log.isCorrect ? '✅ ' : '❌ '} {log.chosenText}
                      </div>

                      {!log.isCorrect && (
                        <div style={{ fontSize: '0.8rem', color: '#34d399', marginBottom: '4px' }}>
                          <strong>Optimal Fix:</strong> {log.correctText}
                        </div>
                      )}

                      <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
                        <strong>RCA Insight:</strong> {log.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
