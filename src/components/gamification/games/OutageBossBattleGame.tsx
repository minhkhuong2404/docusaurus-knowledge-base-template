import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { arcadeAudio } from '../../../utils/arcadeAudio';
import { fetchAllTabQuestions, QuizQuestion, QuizCategoryKey } from '../../../services/googleSheetQuizService';
import { parseSnippetLines } from '../../../utils/codeSnippetHelper';
import { pickRandomUnseenBatch, pickRandomUnseenItem, readSeenIds, writeSeenIds } from '../../../utils/arcadeRandomizer';

const SEEN_BOSS_BATTLE_STORAGE_KEY = 'arcade_seen_boss_battle_ids_v1';

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
  gradientEnd: string;
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
  { id: 'system-design', title: 'Distributed Outage', bossName: 'Thundering Herd Behemoth', bossAvatar: '🦬', badge: 'System Design', color: '#9333ea', gradientEnd: '#c084fc', description: 'Cache avalanches & lock contention' },
  { id: 'java', title: 'JVM Memory Crisis', bossName: 'Memory Leak Monster', bossAvatar: '👾', badge: 'Core Java', color: '#d97706', gradientEnd: '#fbbf24', description: 'GC pauses & thread starvation' },
  { id: 'spring-boot', title: 'Spring CrashLoop', bossName: 'Circular Dependency Demon', bossAvatar: '🍃', badge: 'Spring Boot', color: '#059669', gradientEnd: '#34d399', description: 'Connection pools & rollbacks' },
  { id: 'all', title: 'Universal Blackout', bossName: 'Chaos Titan', bossAvatar: '👑', badge: 'All Topics', color: '#0284c7', gradientEnd: '#38bdf8', description: 'Cross-disciplinary gauntlet' },
];

const EMERGENCY_FALLBACK_QUESTIONS: Record<QuizCategoryKey, BattleQuestion[]> = {
  'system-design': [
    {
      id: 'sd-em1',
      question: 'Simultaneous cache expiry across 10,000 requests threatens database collapse. Inspect the code snippet below. What mitigation fixes Line 4?',
      codeSnippet: `1: public String getCachedUserProfile(String userId) {
2:   String profile = redis.get("user:" + userId);
3:   if (profile == null) {
4:     profile = database.fetchUserProfile(userId); // LINE 4: Hot key expires
5:     redis.setex("user:" + userId, 300, profile);
6:   }
7:   return profile;
8: }`,
      options: [
        { text: 'Singleflight mutex locking per key or Probabilistic Early Expiration (XFetch)', correct: true, explanation: 'Only 1 DB query executes concurrently per key; all other threads await or use stale cache.', dmg: 25, selfDmg: 0 },
        { text: 'Instantly restart all MySQL replicas', correct: false, explanation: 'Drops buffer pool cache and worsens downtime.', dmg: 0, selfDmg: 25 },
        { text: 'Increase max_connections to 50,000', correct: false, explanation: 'Exhausts OS file descriptors and crashes thread scheduler.', dmg: 0, selfDmg: 25 },
        { text: 'Flush Redis cache completely', correct: false, explanation: 'Forces 100% of traffic to hit database directly.', dmg: 0, selfDmg: 35 },
      ],
    },
    {
      id: 'sd-em2',
      question: 'Payment webhook delivery experiences cascading failures. Inspect the event processor below. Which architectural change resolves Line 6 retry exhaustion?',
      codeSnippet: `1: @RabbitListener(queues = "payment-events")
2: public void onPaymentEvent(PaymentEvent event) {
3:   try {
4:     callThirdPartyBank(event);
5:   } catch (BankTimeoutException ex) {
6:     throw new AmqpRejectAndDontRequeueException(ex); // LINE 6
7:   }
8: }`,
      options: [
        { text: 'Route failed events to a Dead Letter Queue (DLQ) with exponential backoff and jitter', correct: true, explanation: 'Isolates poison messages without blocking queue consumption.', dmg: 25, selfDmg: 0 },
        { text: 'Catch the exception and drop the payment record silently', correct: false, explanation: 'Causes ledger inconsistencies and lost funds.', dmg: 0, selfDmg: 35 },
        { text: 'Set thread count to 1000 in consumer container', correct: false, explanation: 'Overwhelms the third-party banking API.', dmg: 0, selfDmg: 25 },
        { text: 'Disable ACK acknowledgments on the queue', correct: false, explanation: 'Risks unacknowledged message storms upon restart.', dmg: 0, selfDmg: 25 },
      ],
    },
  ],
  java: [
    {
      id: 'java-em1',
      question: 'Under high concurrency in a thread pool, Old Gen heap grows monotonically until OutOfMemoryError. Inspect the snippet below. Which line causes the memory leak?',
      codeSnippet: `1: public class OrderProcessor {
2:   private static final ThreadLocal<RequestContext> ctx = new ThreadLocal<>();
3:   public void handleOrder(OrderRequest req) {
4:     ctx.set(new RequestContext(req.getUserId()));
5:     executePayment(req);
6:     // Thread returns to worker pool without ctx.remove()
7:   }
8: }`,
      options: [
        { text: 'Line 6: ThreadLocal is never cleared with ctx.remove(), leaking context on pooled threads', correct: true, explanation: 'Thread pool worker threads live indefinitely; unremoved ThreadLocal entries leak along with their ClassLoaders.', dmg: 25, selfDmg: 0 },
        { text: 'Line 2: ThreadLocal must be marked volatile', correct: false, explanation: 'volatile does not fix memory leaks in ThreadLocal maps.', dmg: 0, selfDmg: 25 },
        { text: 'Line 4: RequestContext must implement Cloneable', correct: false, explanation: 'Cloneable is completely irrelevant to GC retention.', dmg: 0, selfDmg: 25 },
        { text: 'Line 1: Class must implement Serializable', correct: false, explanation: 'Serialization is unrelated to JVM thread pool memory leaks.', dmg: 0, selfDmg: 25 },
      ],
    },
    {
      id: 'java-em2',
      question: 'During peak flash sale, threads read half-initialized objects from getHelper(). Which fix prevents instruction reordering on Line 7?',
      codeSnippet: `1: public class LazyInitService {
2:   private static Helper helper;
3:   public static Helper getHelper() {
4:     if (helper == null) {
5:       synchronized (LazyInitService.class) {
6:         if (helper == null) {
7:           helper = new Helper(); // LINE 7
8:         }
9:       }
10:    }
11:    return helper;
12:  }
13: }`,
      options: [
        { text: "Line 2: Declare 'private static volatile Helper helper' to introduce StoreStore/StoreLoad barriers", correct: true, explanation: 'volatile prevents JVM instruction reordering where memory allocation is published before constructor finishes.', dmg: 25, selfDmg: 0 },
        { text: 'Line 4: Remove the outer null check', correct: false, explanation: 'Fixes race condition but introduces severe lock contention on every single read.', dmg: 0, selfDmg: 25 },
        { text: 'Line 5: Synchronize on helper instead of LazyInitService.class', correct: false, explanation: 'helper is null initially, throwing NullPointerException.', dmg: 0, selfDmg: 35 },
        { text: 'Line 7: Replace new Helper() with Helper.class.newInstance()', correct: false, explanation: 'Reflection does not establish memory visibility barriers.', dmg: 0, selfDmg: 25 },
      ],
    },
  ],
  'spring-boot': [
    {
      id: 'sb-em1',
      question: 'When payment fails, chargeCard() fails to execute in an isolated transaction and rollback independently. Inspect the code snippet below. Which line causes the transactional proxy bypass?',
      codeSnippet: `1: @Service
2: public class BillingService {
3:   public void processInvoice(Invoice invoice) {
4:     validateInvoice(invoice);
5:     chargeCard(invoice); // LINE 5: Internal self-invocation
6:   }
7:   @Transactional(propagation = Propagation.REQUIRES_NEW)
8:   public void chargeCard(Invoice invoice) {
9:     paymentGateway.charge(invoice);
10:  }
11: }`,
      options: [
        { text: "Line 5: Direct 'this' self-invocation bypasses the Spring CGLIB proxy, ignoring @Transactional", correct: true, explanation: 'Spring AOP proxies intercept calls from outside the bean; self-invocation calls the raw target method directly.', dmg: 25, selfDmg: 0 },
        { text: 'Line 7: Spring Boot 3 does not support REQUIRES_NEW propagation', correct: false, explanation: 'REQUIRES_NEW is fully supported in Spring Boot.', dmg: 0, selfDmg: 25 },
        { text: 'Line 1: @Service classes cannot contain @Transactional methods', correct: false, explanation: '@Service is the standard place for transactional boundaries.', dmg: 0, selfDmg: 25 },
        { text: 'Line 8: chargeCard must be declared private', correct: false, explanation: 'Spring proxies cannot intercept private methods at all.', dmg: 0, selfDmg: 25 },
      ],
    },
    {
      id: 'sb-em2',
      question: 'During transient database slow queries, connection pool is saturated and application drops requests. Inspect Line 8 below. What is the root cause?',
      codeSnippet: `1: @Configuration
2: public class DatabaseConfig {
3:   @Bean
4:   public DataSource dataSource() {
5:     HikariConfig cfg = new HikariConfig();
6:     cfg.setJdbcUrl("jdbc:postgresql://db.prod/app");
7:     cfg.setMaximumPoolSize(100);
8:     cfg.setConnectionTimeout(250); // LINE 8: 250ms connection timeout
9:     return new HikariDataSource(cfg);
10:  }
11: }`,
      options: [
        { text: 'Line 8: 250ms connectionTimeout is too aggressive; any transient lock causes SQLTransientConnectionException', correct: true, explanation: 'HikariCP recommends at least 30,000ms connectionTimeout to handle temporary database load spikes.', dmg: 25, selfDmg: 0 },
        { text: 'Line 7: maximumPoolSize cannot exceed 10 in HikariCP', correct: false, explanation: 'HikariCP supports arbitrary pool sizes, although pool sizing formula is pool = (core_count * 2) + disk_spindle.', dmg: 0, selfDmg: 25 },
        { text: 'Line 4: Return type must be HikariDataSource instead of DataSource', correct: false, explanation: 'Polymorphic DataSource return type is idiomatic Spring.', dmg: 0, selfDmg: 25 },
        { text: 'Line 9: HikariDataSource cannot be instantiated manually', correct: false, explanation: 'Programmatic HikariDataSource instantiation is completely valid.', dmg: 0, selfDmg: 25 },
      ],
    },
  ],
  'spot-the-bug': [],
  all: [],
};

// Populate aggregate fallback lists
EMERGENCY_FALLBACK_QUESTIONS.all = [
  ...EMERGENCY_FALLBACK_QUESTIONS['system-design'],
  ...EMERGENCY_FALLBACK_QUESTIONS.java,
  ...EMERGENCY_FALLBACK_QUESTIONS['spring-boot'],
];
EMERGENCY_FALLBACK_QUESTIONS['spot-the-bug'] = EMERGENCY_FALLBACK_QUESTIONS.all;

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
  const [seenBossIds, setSeenBossIds] = useState<string[]>(() => readSeenIds(SEEN_BOSS_BATTLE_STORAGE_KEY));

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

  const getFilteredPool = useCallback(
    (themeId: QuizCategoryKey, difficulty: BattleDifficulty): QuizQuestion[] => {
      let rawList = questionsPool[themeId] || questionsPool.all || [];
      if (rawList.length === 0) return [];
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
      return rawList;
    },
    [questionsPool]
  );

  const mapQuizToBattleQuestion = useCallback((q: QuizQuestion, mistakeDmg: number): BattleQuestion => {
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
  }, []);

  const prepareBattleQuestions = useCallback(
    (themeId: QuizCategoryKey, mistakeDmg: number, difficulty: BattleDifficulty): BattleQuestion[] => {
      const rawList = getFilteredPool(themeId, difficulty);

      if (rawList.length === 0) {
        const fallbacks = EMERGENCY_FALLBACK_QUESTIONS[themeId] || EMERGENCY_FALLBACK_QUESTIONS.all;
        const { batch, nextSeenIds } = pickRandomUnseenBatch(fallbacks, 5, seenBossIds);
        setSeenBossIds(nextSeenIds);
        writeSeenIds(SEEN_BOSS_BATTLE_STORAGE_KEY, nextSeenIds);
        return batch;
      }

      const { batch, nextSeenIds } = pickRandomUnseenBatch(rawList, 5, seenBossIds);
      setSeenBossIds(nextSeenIds);
      writeSeenIds(SEEN_BOSS_BATTLE_STORAGE_KEY, nextSeenIds);

      return batch.map((q) => mapQuizToBattleQuestion(q, mistakeDmg));
    },
    [getFilteredPool, mapQuizToBattleQuestion, seenBossIds]
  );

  const handleRandomSwapQuestion = () => {
    if (selectedOption !== null) return;
    arcadeAudio.playFlip();
    const rawList = getFilteredPool(currentTheme.id, selectedDifficulty);
    const activeIds = new Set(activeQuestions.map((q) => q.id));

    if (rawList.length > 0) {
      const available = rawList.filter((q) => !activeIds.has(q.id));
      const poolToUse = available.length > 0 ? available : rawList;
      const { item, nextSeenIds } = pickRandomUnseenItem(poolToUse, seenBossIds, activeQuestions[currentQIdx]?.id);
      setSeenBossIds(nextSeenIds);
      writeSeenIds(SEEN_BOSS_BATTLE_STORAGE_KEY, nextSeenIds);
      const mapped = mapQuizToBattleQuestion(item, severityConfig.mistakeDmgPercent);
      setActiveQuestions((prev) => prev.map((q, idx) => (idx === currentQIdx ? mapped : q)));
    } else {
      const fallbacks = EMERGENCY_FALLBACK_QUESTIONS[currentTheme.id] || EMERGENCY_FALLBACK_QUESTIONS.all;
      const { item, nextSeenIds } = pickRandomUnseenItem(fallbacks, seenBossIds, activeQuestions[currentQIdx]?.id);
      setSeenBossIds(nextSeenIds);
      writeSeenIds(SEEN_BOSS_BATTLE_STORAGE_KEY, nextSeenIds);
      setActiveQuestions((prev) => prev.map((q, idx) => (idx === currentQIdx ? item : q)));
    }
    setEliminatedOptions([]);
  };

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
  const parsedSnippetLines = useMemo(() => {
    return parseSnippetLines(currentQ?.codeSnippet);
  }, [currentQ?.codeSnippet]);

  // 3-Phase Incident label
  const incidentPhaseLabel = useMemo(() => {
    if (currentQIdx < 2) return { phase: 'Phase 1', title: 'Triage & Blast Radius Containment', color: '#38bdf8' };
    if (currentQIdx < 4) return { phase: 'Phase 2', title: 'Root Cause Isolation & Diagnostic', color: '#a855f7' };
    return { phase: 'Phase 3', title: 'Prevention & Architectural Hardening', color: '#34d399' };
  }, [currentQIdx]);

  return (
    <div
      className="arcade-game-arena outage-boss-game"
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
                    className={`arcade-pill-btn sev-btn sev-${sevKey.toLowerCase()}${isSelected ? ' selected' : ''}`}
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
                    className={`arcade-pill-btn diff-btn diff-${diff.id}${isSelected ? ' selected' : ''}`}
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
                  className={`arcade-boss-card boss-${theme.id}${isSelected ? ' selected' : ''}`}
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
                      <div className={`boss-name${isSelected ? ' selected' : ''}`} style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? theme.color : '#ffffff' }}>
                        {theme.bossName}
                      </div>
                      <div className="boss-badge" style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {theme.badge}
                      </div>
                    </div>
                  </div>
                  <div className="boss-desc" style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.65)' }}>{theme.description}</div>
                </div>
              );
            })}
          </div>

          {/* Launch Button */}
          <button
            type="button"
            className="arcade-start-btn"
            disabled={isLoadingQuestions}
            onClick={startGame}
            style={{
              padding: '14px 44px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${currentTheme.color} 0%, ${currentTheme.gradientEnd} 100%)`,
              border: `1.5px solid ${currentTheme.color}`,
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.05rem',
              cursor: isLoadingQuestions ? 'wait' : 'pointer',
              boxShadow: `0 4px 20px ${currentTheme.color}44`,
              transition: 'all 0.15s ease',
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
                disabled={selectedOption !== null}
                onClick={handleRandomSwapQuestion}
                style={{ padding: '6px 8px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid #fbbf24', color: '#fbbf24', fontSize: '0.74rem', fontWeight: 700, cursor: selectedOption !== null ? 'not-allowed' : 'pointer' }}
                title="Pick Random Unseen Question"
              >
                🎲 Random
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

          {/* Incident Source Code Snippet with Line Numbers */}
          {parsedSnippetLines.length > 0 && (
            <div
              style={{
                marginBottom: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: '#070913',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: 'monospace',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  <span style={{ marginLeft: '4px', fontWeight: 700, color: '#38bdf8' }}>
                    💻 INCIDENT SOURCE CODE (Line Numbers Referenced In Options):
                  </span>
                </div>
                <span style={{ color: '#94a3b8' }}>{parsedSnippetLines.length} lines</span>
              </div>
              <div
                style={{
                  padding: '10px 14px',
                  overflowX: 'auto',
                  fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: '0.82rem',
                  lineHeight: 1.55,
                  color: '#e2e8f0',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {parsedSnippetLines.map((line) => (
                  <div key={line.lineNum} style={{ display: 'flex', gap: '12px', minWidth: 'fit-content' }}>
                    <span
                      style={{
                        minWidth: '28px',
                        textAlign: 'right',
                        color: '#64748b',
                        userSelect: 'none',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                      }}
                    >
                      {line.lineNum}
                    </span>
                    <span style={{ color: '#334155', userSelect: 'none' }}>│</span>
                    <span style={{ whiteSpace: 'pre', color: '#f1f5f9' }}>{line.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  className={`arcade-answer-btn ${isHovered ? 'hovered' : ''} ${isChosen ? (opt.correct ? 'correct' : 'wrong') : ''}`}
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
                    className="arcade-option-badge"
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
                  <span className="arcade-option-text" style={{ flex: 1 }}>{opt.text}</span>
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

          {/* Incident Retrospective & Post-Mortem Root Cause Analysis */}
          {incidentLog.length > 0 && (
            <div
              style={{
                marginTop: '20px',
                marginBottom: '24px',
                textAlign: 'left',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>📋 Incident Retrospective & Root Cause Analysis</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {incidentLog.filter((i) => i.isCorrect).length} / {incidentLog.length} Mitigations Resolved
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {incidentLog.map((item, idx) => {
                  const logSnippetLines = parseSnippetLines(item.codeSnippet);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${item.isCorrect ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '10px',
                        padding: '14px 16px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            color: item.isCorrect ? '#34d399' : '#f87171',
                          }}
                        >
                          Incident #{idx + 1} {item.isCorrect ? '✓ MITIGATED' : '✗ SLA BREACHED'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px', lineHeight: 1.4 }}>
                        {item.question}
                      </div>

                      {/* Code Snippet in Post-Mortem with Line Numbers */}
                      {logSnippetLines.length > 0 && (
                        <div
                          style={{
                            background: '#070913',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '0.78rem',
                            fontFamily: 'monospace',
                            color: '#cbd5e1',
                            overflowX: 'auto',
                            marginBottom: '10px',
                            maxHeight: '180px',
                            overflowY: 'auto',
                          }}
                        >
                          {logSnippetLines.map((line) => (
                            <div key={line.lineNum} style={{ display: 'flex', gap: '10px', minWidth: 'fit-content' }}>
                              <span
                                style={{
                                  minWidth: '24px',
                                  textAlign: 'right',
                                  color: '#64748b',
                                  userSelect: 'none',
                                  fontWeight: 600,
                                }}
                              >
                                {line.lineNum}
                              </span>
                              <span style={{ color: '#334155', userSelect: 'none' }}>│</span>
                              <span style={{ whiteSpace: 'pre', color: '#f1f5f9' }}>{line.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                        <div style={{ color: item.isCorrect ? '#34d399' : '#fca5a5' }}>
                          <strong>Your Action:</strong> {item.chosenText}
                        </div>
                        {!item.isCorrect && (
                          <div style={{ color: '#34d399' }}>
                            <strong>Optimal Mitigation:</strong> {item.correctText}
                          </div>
                        )}
                        <div style={{ color: 'rgba(255, 255, 255, 0.65)', marginTop: '4px', lineHeight: 1.45 }}>
                          💡 <em>{item.explanation}</em>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
