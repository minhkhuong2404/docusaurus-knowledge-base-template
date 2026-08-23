import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { BUG_CHALLENGES, BugSnippetsChallenge } from '../../../data/spotTheBugData';
import { fetchSpotTheBugQuestions, QuizQuestion } from '../../../services/googleSheetQuizService';

type CategoryKey =
  | 'all'
  | 'concurrency'
  | 'spring'
  | 'kafka'
  | 'devops'
  | 'system-design'
  | 'database'
  | 'security'
  | 'async';
type GameMode = 'sprint' | 'zen' | 'hardcore';

const CATEGORY_TABS: { id: CategoryKey; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Arenas', icon: '⚡', color: '#a855f7' },
  { id: 'concurrency', label: 'Java & Concurrency', icon: '☕', color: '#f59e0b' },
  { id: 'spring', label: 'Spring Boot Pitfalls', icon: '🍃', color: '#34d399' },
  { id: 'kafka', label: 'Kafka & Streaming', icon: '🌊', color: '#06b6d4' },
  { id: 'devops', label: 'DevOps & K8s/Docker', icon: '🐳', color: '#38bdf8' },
  { id: 'system-design', label: 'System Design & Redis', icon: '🏗️', color: '#ec4899' },
  { id: 'database', label: 'SQL & Databases', icon: '🗄️', color: '#eab308' },
  { id: 'security', label: 'Security & Web Auth', icon: '🔐', color: '#f43f5e' },
  { id: 'async', label: 'Async & Reactive', icon: '🔄', color: '#8b5cf6' },
];

const GAME_MODES: { id: GameMode; label: string; icon: string; timerSecs: number | null; expMultiplier: number; description: string }[] = [
  { id: 'sprint', label: 'Sprint Duel', icon: '⚡', timerSecs: 30, expMultiplier: 1.0, description: '30s Clock • Time speed bonus • Standard EXP' },
  { id: 'zen', label: 'Zen Study', icon: '🧘', timerSecs: null, expMultiplier: 0.8, description: 'Untimed • Deep dive into Java 21 & Spring internals' },
  { id: 'hardcore', label: 'Hardcore', icon: '🔥', timerSecs: 15, expMultiplier: 2.0, description: '15s Blitz • 2x EXP payout • High streak stakes' },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function SpotTheBugDuelGame(): React.JSX.Element {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [gameMode, setGameMode] = useState<GameMode>('sprint');
  const [challenges, setChallenges] = useState<BugSnippetsChallenge[]>(BUG_CHALLENGES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Per-category index map so switching arenas always starts at q#0 of that category
  const [categoryIndexMap, setCategoryIndexMap] = useState<Record<string, number>>({ all: 0 });
  const [gameState, setGameState] = useState<'playing' | 'revealed'>('playing');
  const [revealedStudyMode, setRevealedStudyMode] = useState<boolean>(false);
  const [chosenOptionId, setChosenOptionId] = useState<string | null>(null);
  const [clickedLineNumber, setClickedLineNumber] = useState<number | null>(null);
  const [lineIdentifiedBonus, setLineIdentifiedBonus] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'fix'>('diagnosis');

  // Tactical Debugger Lifelines
  const [analyzerUsed, setAnalyzerUsed] = useState<boolean>(false);
  const [eliminatedOptionIds, setEliminatedOptionIds] = useState<string[]>([]);
  const [breakpointHintUsed, setBreakpointHintUsed] = useState<boolean>(false);
  const [timeWarpUsed, setTimeWarpUsed] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Solved challenges tracking in localStorage
  const [solvedBugIds, setSolvedBugIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('spot_bug_solved_challenges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markBugSolved = (bugId: string) => {
    setSolvedBugIds((prev) => {
      if (prev.includes(bugId)) return prev;
      const updated = [...prev, bugId];
      try {
        localStorage.setItem('spot_bug_solved_challenges', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Fetch questions from Google Sheet tab 'Spot The Bug'
  useEffect(() => {
    let isMounted = true;
    async function loadSheetData() {
      try {
        setIsLoading(true);
        let questions = await fetchSpotTheBugQuestions();
        // If cached questions in IndexedDB had old single-line snippets matching questionText, force fresh fetch from Google Sheet
        if (Array.isArray(questions) && questions.length > 0 && questions[0].codeSnippet === questions[0].questionText) {
          questions = await fetchSpotTheBugQuestions(true);
        }
        if (isMounted && Array.isArray(questions) && questions.length > 0) {
          const mapped: BugSnippetsChallenge[] = questions.map((q) => {
            const topicLower = (q.topic || '').toLowerCase();
            const category: CategoryKey =
              topicLower.includes('kafka') || (topicLower.includes('stream') && !topicLower.includes('reactive')) ? 'kafka'
              : topicLower.includes('docker') || topicLower.includes('k8s') || topicLower.includes('kubernetes') || topicLower.includes('devops') ? 'devops'
              : topicLower.includes('redis') || topicLower.includes('cache') || topicLower.includes('system design') || topicLower.includes('distributed lock') ? 'system-design'
              : topicLower.includes('security') || topicLower.includes('jwt') || topicLower.includes('cors') || topicLower.includes('auth') || topicLower.includes('vulnerability') ? 'security'
              : topicLower.includes('spring') ? 'spring'
              : topicLower.includes('database') || topicLower.includes('sql') || topicLower.includes('hikari') || topicLower.includes('jpa') || topicLower.includes('query') ? 'database'
              : topicLower.includes('async') || topicLower.includes('reactive') || topicLower.includes('completable') || topicLower.includes('webflux') ? 'async'
              : 'concurrency';

            const options = (q.options || []).map((optText, idx) => ({
              id: `opt-${idx}`,
              text: optText,
              isCorrect: idx === q.correctOptionIndex,
              explanation: idx === q.correctOptionIndex ? q.explanation : 'Incorrect diagnostic analysis.',
            }));

            const diff = q.difficulty === 'Junior' ? 'Junior' : q.difficulty === 'Mid' ? 'Mid' : q.difficulty === 'Staff' ? 'Staff' : 'Senior';
            const diffColor = diff === 'Junior' ? '#38bdf8' : diff === 'Mid' ? '#34d399' : diff === 'Staff' ? '#a855f7' : '#f59e0b';

            const codeContent = (q.codeSnippet && q.codeSnippet.trim().length > 0)
              ? q.codeSnippet.replace(/\\n/g, '\n')
              : '// No source snippet provided';

            return {
              id: q.id,
              title: q.topic || 'Production Defect',
              category,
              categoryLabel: q.topic || 'Code Inspection',
              difficulty: diff,
              difficultyColor: diffColor,
              scenario: q.questionText,
              code: codeContent,
              buggyLineNumber: q.buggyLineNumber || 1,
              bugType: q.topic,
              symptom: q.questionText,
              options,
              rootCause: q.explanation,
              fixSnippet: q.fixSnippet ? q.fixSnippet.replace(/\\n/g, '\n') : '// See senior architectural best practice',
              interviewTip: q.interviewTip || 'Master Java 21 specification and concurrency invariants.',
            };
          });

          setChallenges(mapped);
        }
      } catch (err) {
        console.error('Failed to load Spot The Bug questions from Google Sheet:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadSheetData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter challenges by category
  const filteredChallenges = useMemo(() => {
    if (selectedCategory === 'all') return challenges;
    return challenges.filter((c) => c.category === selectedCategory);
  }, [selectedCategory, challenges]);

  // Current index for this category (defaults to 0)
  const currentIdx = categoryIndexMap[selectedCategory] ?? 0;
  const safeIdx = filteredChallenges.length > 0 ? currentIdx % filteredChallenges.length : 0;
  const currentChallenge = filteredChallenges[safeIdx] || BUG_CHALLENGES[0];

  // Shuffled options per challenge
  const shuffledOptions = useMemo(() => {
    if (!currentChallenge) return [];
    return shuffle(currentChallenge.options);
  }, [currentChallenge]);

  // Mode config
  const activeModeConfig = GAME_MODES.find((m) => m.id === gameMode) || GAME_MODES[0];

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing' || activeModeConfig.timerSecs === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('revealed');
          setCombo(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentIdx, activeModeConfig.timerSecs]);

  // ── Power-Up 1: Static Code Analyzer (50/50) ──
  const handleUseAnalyzer = () => {
    if (analyzerUsed || gameState !== 'playing' || !currentChallenge) return;
    const incorrectIds = currentChallenge.options
      .filter((o) => !o.isCorrect)
      .map((o) => o.id);

    const eliminated = shuffle(incorrectIds).slice(0, 2);
    setEliminatedOptionIds(eliminated);
    setAnalyzerUsed(true);
  };

  // ── Power-Up 2: JDB Breakpoint (Line Hint) ──
  const handleUseBreakpoint = () => {
    if (breakpointHintUsed || gameState !== 'playing' || !currentChallenge) return;
    setClickedLineNumber(currentChallenge.buggyLineNumber);
    setBreakpointHintUsed(true);
  };

  // ── Power-Up 3: Time Warp (+15s) ──
  const handleUseTimeWarp = () => {
    if (timeWarpUsed || gameState !== 'playing' || activeModeConfig.timerSecs === null) return;
    setTimeLeft((prev) => prev + 15);
    setTimeWarpUsed(true);
  };

  // ── Click-to-Verify Line ──
  const handleLineClick = (lineNum: number) => {
    setClickedLineNumber(lineNum);
    if (gameState === 'playing' && currentChallenge && lineNum === currentChallenge.buggyLineNumber && !lineIdentifiedBonus) {
      setLineIdentifiedBonus(true);
      setScore((prev) => prev + 50);
    }
  };

  const handleSelectOption = (option: { id: string; isCorrect: boolean }) => {
    if (gameState !== 'playing') return;

    setChosenOptionId(option.id);
    setGameState('revealed');
    setRevealedStudyMode(false);

    if (option.isCorrect) {
      markBugSolved(currentChallenge.id);
      const timeBonus = activeModeConfig.timerSecs !== null ? Math.round(timeLeft * 10) : 50;
      const lineBonus = lineIdentifiedBonus ? 50 : 0;
      const comboMultiplier = 1 + combo * 0.25;
      const pointsEarned = Math.round((100 + timeBonus + lineBonus) * comboMultiplier * activeModeConfig.expMultiplier);

      const newScore = score + pointsEarned;
      const newCombo = combo + 1;
      setScore(newScore);
      setCombo(newCombo);
      saveMiniGameScore('spot_bug', newScore);

      const earnedExp = Math.round((25 + newCombo * 5) * activeModeConfig.expMultiplier);
      addExp(earnedExp, `Spot The Bug Defect Caught [${gameMode.toUpperCase()}] (+${newCombo}x combo)`);

      if (newCombo >= 3) {
        triggerFireworks(3500);
        unlockAchievement('bug_hunter_streak');
      }
    } else {
      setCombo(0);
    }
  };

  const handleShowAnswer = () => {
    if (gameState !== 'playing') return;
    setGameState('revealed');
    setRevealedStudyMode(true);
    setClickedLineNumber(currentChallenge.buggyLineNumber);
    setActiveTab('diagnosis');
  };

  const resetRoundState = () => {
    setGameState('playing');
    setRevealedStudyMode(false);
    setChosenOptionId(null);
    setClickedLineNumber(null);
    setLineIdentifiedBonus(false);
    setAnalyzerUsed(false);
    setEliminatedOptionIds([]);
    setBreakpointHintUsed(false);
    setTimeWarpUsed(false);
    setTimeLeft(activeModeConfig.timerSecs || 30);
    setActiveTab('diagnosis');
  };

  const handleNextChallenge = () => {
    const len = filteredChallenges.length || 1;
    const nextIdx = (currentIdx + 1) % len;
    setCategoryIndexMap((prev) => ({ ...prev, [selectedCategory]: nextIdx }));
    resetRoundState();
  };

  const handleSkipChallenge = () => {
    setCombo(0);
    handleNextChallenge();
  };

  const handleSelectCategory = (catId: CategoryKey) => {
    // Preserve per-category position — start at 0 if never visited
    setSelectedCategory(catId);
    resetRoundState();
  };

  const handleCopyFix = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(currentChallenge.fixSnippet).then(() => {
      setCopiedText('fix');
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  const handleCopyRca = () => {
    if (!navigator.clipboard) return;
    const rcaText = `### Defect RCA: ${currentChallenge.title} (${currentChallenge.difficulty} Level)
**Scenario**: ${currentChallenge.scenario}
**Defect Line**: Line #${currentChallenge.buggyLineNumber}
**Root Cause**: ${currentChallenge.rootCause}

#### Recommended Fix:
\`\`\`java
${currentChallenge.fixSnippet}
\`\`\`

#### Senior Interview Insight:
${currentChallenge.interviewTip}
`;
    navigator.clipboard.writeText(rcaText).then(() => {
      setCopiedText('rca');
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  if (!currentChallenge) {
    return <div style={{ color: '#ffffff', padding: '24px' }}>No bug challenges found.</div>;
  }

  const codeLines = currentChallenge.code.split('\n');
  const isCurrentSolved = solvedBugIds.includes(currentChallenge.id);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #090d16 0%, #0d121f 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
        padding: '28px',
        color: '#f8fafc',
      }}
    >
      {/* ── 1. Header Bar with Score, Timer & Rules Toggle ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          paddingBottom: '18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem' }}>🔍</span>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>Spot The Bug Duel Arena</span>
              {isCurrentSolved && (
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid #34d399' }}>
                  ✓ Defect Mastered
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              Real production code race • Concurrency, thread safety, memory leaks & Spring AOP hazards
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Solved Mastery Pill */}
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🏆</span>
            <span>Mastery: {solvedBugIds.length} / {filteredChallenges.length || 1024}</span>
          </div>

          {/* Rules Toggle */}
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: showRules ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#f59e0b',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📖</span>
            <span>{showRules ? 'Hide Rules' : 'How to Play'}</span>
          </button>

          {/* Combo Multiplier */}
          {combo > 1 && (
            <span
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 900,
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
              }}
            >
              🔥 {combo}x COMBO!
            </span>
          )}

          {/* Countdown Sprint Timer (hidden in Zen mode) */}
          {activeModeConfig.timerSecs !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '10px',
                background: timeLeft <= 5 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${timeLeft <= 5 ? '#ef4444' : 'rgba(255, 255, 255, 0.12)'}`,
                color: timeLeft <= 5 ? '#ef4444' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              <span>⏱️</span>
              <span>{timeLeft}s</span>
            </div>
          )}

          {/* Score Counter */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#f59e0b',
              fontWeight: 900,
              fontSize: '0.92rem',
            }}
          >
            🏆 Score: {score.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── Rules Explanation Panel ── */}
      {showRules && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '20px',
            fontSize: '0.85rem',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 800, color: '#f59e0b', marginBottom: '8px' }}>
            🎯 Spot The Bug Duel Rules & Scoring:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', color: 'rgba(255, 255, 255, 0.85)' }}>
            <div>1. <strong>Code Inspection</strong>: Click any source code line to highlight the suspect bug location (+50 Line Precision bonus).</div>
            <div>2. <strong>Root Cause Selection</strong>: Pick the correct architectural explanation to trigger critical fixes.</div>
            <div>3. <strong>Debugger Lifelines</strong>: Use Static Analyzer (50/50), JDB Breakpoint hint, and Time Warp to assist tough snippets.</div>
          </div>
        </div>
      )}

      {/* ── 2. Mode Selector & Category Switcher ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        {/* Game Mode Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {GAME_MODES.map((mode) => {
            const isSelected = gameMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setGameMode(mode.id);
                  setTimeLeft(mode.timerSecs || 30);
                  setGameState('playing');
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: isSelected ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.78rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={mode.description}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Toolbar (Show Answer / Lifelines) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {gameState === 'playing' && (
            <>
              <button
                type="button"
                disabled={analyzerUsed}
                onClick={handleUseAnalyzer}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(192, 132, 252, 0.4)',
                  background: analyzerUsed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(192, 132, 252, 0.12)',
                  color: analyzerUsed ? 'rgba(255, 255, 255, 0.3)' : '#c084fc',
                  fontSize: '0.76rem',
                  fontWeight: 750,
                  cursor: analyzerUsed ? 'not-allowed' : 'pointer',
                }}
                title="Eliminates 2 incorrect options"
              >
                🔍 {analyzerUsed ? 'Analyzer Used' : 'Static Analyzer (50/50)'}
              </button>

              <button
                type="button"
                disabled={breakpointHintUsed}
                onClick={handleUseBreakpoint}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  background: breakpointHintUsed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(56, 189, 248, 0.12)',
                  color: breakpointHintUsed ? 'rgba(255, 255, 255, 0.3)' : '#38bdf8',
                  fontSize: '0.76rem',
                  fontWeight: 750,
                  cursor: breakpointHintUsed ? 'not-allowed' : 'pointer',
                }}
                title="Highlights the exact buggy line number"
              >
                ⚡ {breakpointHintUsed ? 'Line Marked' : 'JDB Line Hint'}
              </button>

              {activeModeConfig.timerSecs !== null && (
                <button
                  type="button"
                  disabled={timeWarpUsed}
                  onClick={handleUseTimeWarp}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    background: timeWarpUsed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(52, 211, 153, 0.12)',
                    color: timeWarpUsed ? 'rgba(255, 255, 255, 0.3)' : '#34d399',
                    fontSize: '0.76rem',
                    fontWeight: 750,
                    cursor: timeWarpUsed ? 'not-allowed' : 'pointer',
                  }}
                  title="Adds +15s to timer"
                >
                  ⏱️ {timeWarpUsed ? '+15s Used' : '+15s Warp'}
                </button>
              )}

              <button
                type="button"
                onClick={handleShowAnswer}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  background: 'rgba(251, 191, 36, 0.08)',
                  color: '#fbbf24',
                  fontSize: '0.76rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
                title="Reveal explanation and fix without gaining EXP"
              >
                👁️ Show Answer
              </button>

              <button
                type="button"
                onClick={handleSkipChallenge}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  color: '#38bdf8',
                  fontSize: '0.76rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Skip to next code defect question"
              >
                ⏭️ Skip
              </button>
            </>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '18px' }}>
        {CATEGORY_TABS.map((tab) => {
          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectCategory(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                background: isSelected ? `${tab.color}25` : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isSelected ? tab.color : 'rgba(255, 255, 255, 0.08)'}`,
                color: isSelected ? tab.color : 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Challenge Scenario & Difficulty ── */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: '14px',
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff' }}>
            {currentChallenge.title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {lineIdentifiedBonus && (
              <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid #34d399' }}>
                🎯 Line Precision +50 pts
              </span>
            )}
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                background: `${currentChallenge.difficultyColor}22`,
                color: currentChallenge.difficultyColor,
                border: `1px solid ${currentChallenge.difficultyColor}55`,
              }}
            >
              {currentChallenge.difficulty} Level
            </span>
          </div>
        </div>
        <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
          🚨 <strong>Incident Scenario:</strong> {currentChallenge.scenario}
        </div>
      </div>

      {/* ── 4. Interactive Monospace Code Box with Clickable Lines ── */}
      <div
        style={{
          background: '#07090e',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px',
          fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          overflowX: 'auto',
          marginBottom: '20px',
          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>📄 Source Snippet (Click suspect line to verify defect location):</span>
          {clickedLineNumber && (
            <span style={{ color: clickedLineNumber === currentChallenge.buggyLineNumber ? '#34d399' : '#fbbf24' }}>
              Selected: Line #{clickedLineNumber} {clickedLineNumber === currentChallenge.buggyLineNumber ? '✓ (Match!)' : ''}
            </span>
          )}
        </div>

        {codeLines.map((line, idx) => {
          const lineNum = idx + 1;
          const isBuggy = (gameState === 'revealed' || breakpointHintUsed) && lineNum === currentChallenge.buggyLineNumber;
          const isClicked = clickedLineNumber === lineNum;

          let bg = 'transparent';
          if (isBuggy) bg = 'rgba(239, 68, 68, 0.25)';
          else if (isClicked) bg = 'rgba(245, 158, 11, 0.15)';

          return (
            <div
              key={lineNum}
              onClick={() => handleLineClick(lineNum)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: '4px',
                background: bg,
                borderLeft: isBuggy ? '3px solid #ef4444' : isClicked ? '3px solid #f59e0b' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <span
                style={{
                  width: '32px',
                  color: isBuggy ? '#ef4444' : 'rgba(255, 255, 255, 0.3)',
                  userSelect: 'none',
                  fontSize: '0.78rem',
                  fontWeight: isBuggy ? 800 : 400,
                }}
              >
                {lineNum}
              </span>
              <span style={{ color: isBuggy ? '#fca5a5' : '#e2e8f0', whiteSpace: 'pre' }}>
                {line}
              </span>
              {isBuggy && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.2)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  ⚡ DEFECT LOCATION
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 5. Diagnostic Choices or Revealed Solution ── */}
      {gameState === 'playing' ? (
        <div>
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '10px' }}>
            Choose the Architectural Root Cause:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            {shuffledOptions.map((opt, idx) => {
              const isEliminated = eliminatedOptionIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isEliminated}
                  onClick={() => handleSelectOption(opt)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: isEliminated ? 'rgba(255, 255, 255, 0.02)' : 'rgba(30, 41, 59, 0.6)',
                    border: isEliminated ? '1px dashed rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isEliminated ? 'rgba(255, 255, 255, 0.25)' : '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: isEliminated ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: isEliminated ? 'line-through' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isEliminated) {
                      e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                      e.currentTarget.style.borderColor = '#f59e0b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isEliminated) {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#f59e0b',
                      flexShrink: 0,
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Revealed Post-Mortem Solution Panel */
        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          {revealedStudyMode && (
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.12)', border: '1px solid #fbbf24', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 800, marginBottom: '14px' }}>
              👁️ SOLUTION REVEALED (Study Mode — No EXP Awarded)
            </div>
          )}

          {/* Tabs: Diagnostic vs Code Fix & Copy Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('diagnosis')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: activeTab === 'diagnosis' ? '#f59e0b25' : 'transparent',
                  border: `1px solid ${activeTab === 'diagnosis' ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: activeTab === 'diagnosis' ? '#f59e0b' : 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                🧠 Root Cause Analysis
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('fix')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: activeTab === 'fix' ? '#34d39925' : 'transparent',
                  border: `1px solid ${activeTab === 'fix' ? '#34d399' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: activeTab === 'fix' ? '#34d399' : 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                🛠️ Code Patch & Fix
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCopyFix}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  color: '#34d399',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{copiedText === 'fix' ? '✓' : '📋'}</span>
                <span>{copiedText === 'fix' ? 'Patch Copied!' : 'Copy Patch'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyRca}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{copiedText === 'rca' ? '✓' : '📋'}</span>
                <span>{copiedText === 'rca' ? 'RCA Copied!' : 'Copy RCA'}</span>
              </button>
            </div>
          </div>

          {activeTab === 'diagnosis' ? (
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f59e0b', marginBottom: '6px' }}>
                ⚡ Defect: {currentChallenge.bugType} (Line #{currentChallenge.buggyLineNumber})
              </div>
              <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, marginBottom: '12px' }}>
                {currentChallenge.rootCause}
              </div>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '0.8rem',
                  color: '#7dd3fc',
                  lineHeight: 1.4,
                }}
              >
                💡 <strong>Senior Interview Insight:</strong> {currentChallenge.interviewTip}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>
                ✅ Recommended Production Fix:
              </div>
              <pre
                style={{
                  background: '#07090e',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  fontSize: '0.82rem',
                  color: '#a7f3d0',
                  margin: 0,
                  overflowX: 'auto',
                }}
              >
                {currentChallenge.fixSnippet}
              </pre>
            </div>
          )}

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNextChallenge}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              color: '#0f172a',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            }}
          >
            Next Bug Challenge ➔
          </button>
        </div>
      )}
    </div>
  );
}
