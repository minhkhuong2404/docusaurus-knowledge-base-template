import React, { useState, useEffect, useMemo } from 'react';
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
type DifficultyLevel = 'all' | 'easy' | 'medium' | 'hard';
type GameMode = 'sprint' | 'zen' | 'hardcore';

const DIFFICULTY_TABS: { id: DifficultyLevel; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Levels', icon: '⭐', color: '#a855f7' },
  { id: 'easy', label: 'Easy', icon: '🟢', color: '#38bdf8' },
  { id: 'medium', label: 'Medium', icon: '🟡', color: '#34d399' },
  { id: 'hard', label: 'Hard', icon: '🔴', color: '#f59e0b' },
];

const CATEGORY_TABS: { id: CategoryKey; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Arenas', icon: '⚡', color: '#a855f7' },
  { id: 'concurrency', label: 'Java Concurrency', icon: '☕', color: '#f59e0b' },
  { id: 'spring', label: 'Spring Boot', icon: '🍃', color: '#34d399' },
  { id: 'kafka', label: 'Kafka & Streaming', icon: '🌊', color: '#06b6d4' },
  { id: 'devops', label: 'DevOps & K8s', icon: '🐳', color: '#38bdf8' },
  { id: 'system-design', label: 'System Design & Redis', icon: '🏗️', color: '#ec4899' },
  { id: 'database', label: 'SQL Databases', icon: '🗄️', color: '#eab308' },
  { id: 'security', label: 'Security & Auth', icon: '🔐', color: '#f43f5e' },
  { id: 'async', label: 'Async & Reactive', icon: '🔄', color: '#8b5cf6' },
];

const GAME_MODES: { id: GameMode; label: string; icon: string; timerSecs: number | null }[] = [
  { id: 'sprint', label: 'Sprint (30s)', icon: '⚡', timerSecs: 30 },
  { id: 'zen', label: 'Zen (Untimed)', icon: '🧘', timerSecs: null },
  { id: 'hardcore', label: 'Hardcore (15s)', icon: '🔥', timerSecs: 15 },
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('all');
  const [gameMode, setGameMode] = useState<GameMode>('sprint');
  const [challenges, setChallenges] = useState<BugSnippetsChallenge[]>(BUG_CHALLENGES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categoryIndexMap, setCategoryIndexMap] = useState<Record<string, number>>({ all: 0 });
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'revealed'>('intro');
  const [chosenOptionId, setChosenOptionId] = useState<string | null>(null);
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);
  const [clickedLineNumber, setClickedLineNumber] = useState<number | null>(null);
  const [lineIdentifiedBonus, setLineIdentifiedBonus] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);

  // Lifelines
  const [analyzerUsed, setAnalyzerUsed] = useState<boolean>(false);
  const [eliminatedOptionIds, setEliminatedOptionIds] = useState<string[]>([]);
  const [breakpointHintUsed, setBreakpointHintUsed] = useState<boolean>(false);
  const [timeWarpUsed, setTimeWarpUsed] = useState<boolean>(false);

  // Solved tracking
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

  // Load Google Sheet questions
  useEffect(() => {
    let isMounted = true;
    async function loadSheetData() {
      try {
        setIsLoading(true);
        let questions = await fetchSpotTheBugQuestions();
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

  // Filter challenges by category AND difficulty
  const filteredChallenges = useMemo(() => {
    let pool = selectedCategory === 'all' ? challenges : challenges.filter((c) => c.category === selectedCategory);
    if (selectedDifficulty === 'easy') {
      const match = pool.filter((c) => c.difficulty === 'Junior');
      if (match.length > 0) pool = match;
    } else if (selectedDifficulty === 'medium') {
      const match = pool.filter((c) => c.difficulty === 'Mid');
      if (match.length > 0) pool = match;
    } else if (selectedDifficulty === 'hard') {
      const match = pool.filter((c) => c.difficulty === 'Senior' || c.difficulty === 'Staff');
      if (match.length > 0) pool = match;
    }
    return pool;
  }, [selectedCategory, selectedDifficulty, challenges]);

  const currentIdx = categoryIndexMap[selectedCategory] ?? 0;
  const safeIdx = filteredChallenges.length > 0 ? currentIdx % filteredChallenges.length : 0;
  const currentChallenge = filteredChallenges[safeIdx] || BUG_CHALLENGES[0];

  const shuffledOptions = useMemo(() => {
    if (!currentChallenge) return [];
    return shuffle(currentChallenge.options);
  }, [currentChallenge]);

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
  }, [gameState, activeModeConfig.timerSecs]);

  const resetRoundState = () => {
    setChosenOptionId(null);
    setClickedLineNumber(null);
    setLineIdentifiedBonus(false);
    setAnalyzerUsed(false);
    setEliminatedOptionIds([]);
    setBreakpointHintUsed(false);
    setTimeWarpUsed(false);
    setTimeLeft(activeModeConfig.timerSecs || 30);
  };

  const handleStartGame = () => {
    setGameState('playing');
    resetRoundState();
  };

  const handleNextChallenge = () => {
    setCategoryIndexMap((prev) => ({
      ...prev,
      [selectedCategory]: (prev[selectedCategory] ?? 0) + 1,
    }));
    setGameState('playing');
    resetRoundState();
  };

  const handleSkipChallenge = () => {
    handleNextChallenge();
  };

  const handleSelectOption = (option: { id: string; isCorrect: boolean; text: string; explanation: string }) => {
    if (gameState === 'revealed' || chosenOptionId) return;

    setChosenOptionId(option.id);
    setGameState('revealed');

    if (option.isCorrect) {
      const lineBonus = lineIdentifiedBonus ? 50 : 0;
      const speedBonus = activeModeConfig.timerSecs ? Math.max(0, timeLeft * 2) : 10;
      const earnedScore = 100 + lineBonus + speedBonus;
      const newScore = score + earnedScore;
      const newCombo = combo + 1;

      setScore(newScore);
      setCombo(newCombo);
      markBugSolved(currentChallenge.id);

      const expGain = 25 + (newCombo > 2 ? 15 : 0);
      addExp(expGain, `Spotted bug: ${currentChallenge.title}`);
      saveMiniGameScore('spot_bug', newScore);

      if (newCombo >= 3) {
        unlockAchievement('bug_hunter');
      }
      triggerFireworks(2000);
    } else {
      setCombo(0);
    }
  };

  const handleLineClick = (lineNum: number) => {
    if (gameState === 'revealed') return;
    setClickedLineNumber(lineNum);
    if (lineNum === currentChallenge.buggyLineNumber) {
      setLineIdentifiedBonus(true);
    } else {
      setLineIdentifiedBonus(false);
    }
  };

  const handleUseAnalyzer = () => {
    if (analyzerUsed || gameState === 'revealed') return;
    setAnalyzerUsed(true);
    const incorrectOptions = shuffledOptions.filter((o) => !o.isCorrect);
    const toEliminate = shuffle(incorrectOptions).slice(0, 2).map((o) => o.id);
    setEliminatedOptionIds(toEliminate);
  };

  const handleUseBreakpoint = () => {
    if (breakpointHintUsed || gameState === 'revealed') return;
    setBreakpointHintUsed(true);
    setClickedLineNumber(currentChallenge.buggyLineNumber);
    setLineIdentifiedBonus(true);
  };

  const codeLines = useMemo(() => {
    return currentChallenge.code.split('\n');
  }, [currentChallenge.code]);

  const activeCategoryTab = CATEGORY_TABS.find((c) => c.id === selectedCategory) || CATEGORY_TABS[0];

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        color: '#f8fafc',
      }}
    >
      {/* ── 1. INTRO / START SCREEN ── */}
      {gameState === 'intro' && (
        <div style={{ textAlign: 'center', padding: '16px 10px' }}>
          {/* Header */}
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {activeCategoryTab.icon}
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
            Spot The Bug Duel: {activeCategoryTab.label}
          </div>
          <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '560px', margin: '0 auto 18px auto', lineHeight: 1.45 }}>
            Inspect full code snippets, click to mark the suspect defect line for bonus points, and diagnose the architectural root cause.
          </div>

          {/* Quick Selectors Row */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {/* Arena Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryKey)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                background: '#0f172a',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#f59e0b',
                fontSize: '0.82rem',
                fontWeight: 800,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {CATEGORY_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.icon} {tab.label}
                </option>
              ))}
            </select>

            {/* Difficulty Pills */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {DIFFICULTY_TABS.map((diff) => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: isSelected ? `${diff.color}25` : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isSelected ? diff.color : 'rgba(255, 255, 255, 0.08)'}`,
                      color: isSelected ? diff.color : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.78rem',
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{diff.icon}</span> <span>{diff.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mode Pills */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {GAME_MODES.map((mode) => {
                const isSelected = gameMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setGameMode(mode.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.78rem',
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{mode.icon}</span> <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count Chip */}
          <div style={{ marginBottom: '22px' }}>
            <span style={{ fontSize: '0.82rem', padding: '4px 12px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', fontWeight: 800 }}>
              📚 {filteredChallenges.length} Code Challenges Ready in Pool
            </span>
          </div>

          {/* 🚀 START BUTTON */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleStartGame}
            style={{
              padding: '14px 44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.1rem',
              cursor: isLoading ? 'wait' : 'pointer',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.5)',
              transition: 'all 0.15s ease',
            }}
          >
            {isLoading ? '⏳ Syncing Questions...' : '🚀 Start Spot The Bug Duel'}
          </button>
        </div>
      )}

      {/* ── 2. IN-GAME SCREEN (PLAYING / REVEALED) ── */}
      {gameState !== 'intro' && (
        <>
          {/* Top Control Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '14px',
            }}
          >
            {/* Arena & Difficulty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setGameState('intro')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.75rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                ⚙️ Arena Setup
              </button>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as CategoryKey);
                  resetRoundState();
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: '#0f172a',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#f59e0b',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {CATEGORY_TABS.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.icon} {tab.label}
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '4px' }}>
                {DIFFICULTY_TABS.map((diff) => {
                  const isSelected = selectedDifficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => {
                        setSelectedDifficulty(diff.id);
                        resetRoundState();
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: isSelected ? `${diff.color}25` : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${isSelected ? diff.color : 'rgba(255, 255, 255, 0.08)'}`,
                        color: isSelected ? diff.color : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.74rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                      }}
                    >
                      {diff.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Lifelines & Timer & Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {gameState === 'playing' && (
                <>
                  <button
                    type="button"
                    disabled={analyzerUsed}
                    onClick={handleUseAnalyzer}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(192, 132, 252, 0.3)',
                      background: analyzerUsed ? 'transparent' : 'rgba(192, 132, 252, 0.1)',
                      color: analyzerUsed ? 'rgba(255, 255, 255, 0.3)' : '#c084fc',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: analyzerUsed ? 'not-allowed' : 'pointer',
                    }}
                    title="50/50 Static Analyzer"
                  >
                    🔍 50/50
                  </button>
                  <button
                    type="button"
                    disabled={breakpointHintUsed}
                    onClick={handleUseBreakpoint}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      background: breakpointHintUsed ? 'transparent' : 'rgba(56, 189, 248, 0.1)',
                      color: breakpointHintUsed ? 'rgba(255, 255, 255, 0.3)' : '#38bdf8',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: breakpointHintUsed ? 'not-allowed' : 'pointer',
                    }}
                    title="Highlight Line Hint"
                  >
                    ⚡ Hint
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipChallenge}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ⏭️ Skip
                  </button>
                </>
              )}

              {/* Timer */}
              {activeModeConfig.timerSecs !== null && (
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: timeLeft <= 5 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${timeLeft <= 5 ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: timeLeft <= 5 ? '#ef4444' : '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                  }}
                >
                  ⏱️ {timeLeft}s
                </div>
              )}

              {/* Score */}
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#f59e0b',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                🏆 {score}
              </div>
            </div>
          </div>

          {/* Question Title & Prompt */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
                {currentChallenge.title}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {lineIdentifiedBonus && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                    🎯 Line Precision Match!
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${currentChallenge.difficultyColor}22`, color: currentChallenge.difficultyColor }}>
                  {currentChallenge.difficulty}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
              {currentChallenge.scenario}
            </div>
          </div>

          {/* Monospace Code Box */}
          <div
            style={{
              background: '#07090e',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '12px 14px',
              fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.82rem',
              lineHeight: 1.5,
              overflowX: 'auto',
              marginBottom: '14px',
            }}
          >
            <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Source Code (Click suspect line to verify defect):</span>
              {clickedLineNumber && (
                <span style={{ color: clickedLineNumber === currentChallenge.buggyLineNumber ? '#34d399' : '#fbbf24' }}>
                  Line #{clickedLineNumber} {clickedLineNumber === currentChallenge.buggyLineNumber ? '✓ Match' : ''}
                </span>
              )}
            </div>

            {codeLines.map((line, idx) => {
              const lineNum = idx + 1;
              const isBuggy = (gameState === 'revealed' || breakpointHintUsed) && lineNum === currentChallenge.buggyLineNumber;
              const isClicked = clickedLineNumber === lineNum;

              let bg = 'transparent';
              if (isBuggy) bg = 'rgba(239, 68, 68, 0.2)';
              else if (isClicked) bg = 'rgba(245, 158, 11, 0.12)';

              return (
                <div
                  key={idx}
                  onClick={() => handleLineClick(lineNum)}
                  style={{
                    display: 'flex',
                    background: bg,
                    borderRadius: '4px',
                    padding: '1px 4px',
                    cursor: gameState === 'playing' ? 'pointer' : 'default',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '32px',
                      userSelect: 'none',
                      color: isBuggy ? '#ef4444' : isClicked ? '#f59e0b' : 'rgba(255, 255, 255, 0.3)',
                      fontWeight: isBuggy || isClicked ? 800 : 400,
                    }}
                  >
                    {lineNum}
                  </span>
                  <span style={{ color: isBuggy ? '#fca5a5' : '#e2e8f0', whiteSpace: 'pre' }}>
                    {line}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Option Cards: 1 Option per Line */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {shuffledOptions.map((opt, idx) => {
              const isEliminated = eliminatedOptionIds.includes(opt.id);
              const isChosen = chosenOptionId === opt.id;
              const isRevealed = gameState === 'revealed';
              const isHovered = hoveredOptionId === opt.id && !isRevealed && !isEliminated;
              const letterBadge = ['A', 'B', 'C', 'D'][idx] || `${idx + 1}`;

              let border = isHovered ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)';
              let bg = isHovered ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)';
              let color = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.88)';
              let shadow = isHovered ? '0 4px 14px rgba(245, 158, 11, 0.25)' : 'none';
              let transform = isHovered ? 'translateY(-1px)' : 'none';

              if (isEliminated) {
                bg = 'transparent';
                border = '1px dashed rgba(255, 255, 255, 0.06)';
                color = 'rgba(255, 255, 255, 0.2)';
                shadow = 'none';
                transform = 'none';
              } else if (isRevealed) {
                if (opt.isCorrect) {
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
                  key={opt.id}
                  type="button"
                  disabled={isEliminated || isRevealed}
                  onMouseEnter={() => setHoveredOptionId(opt.id)}
                  onMouseLeave={() => setHoveredOptionId(null)}
                  onClick={() => {
                    setHoveredOptionId(null);
                    handleSelectOption(opt);
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
                    cursor: isEliminated || isRevealed ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: isChosen
                        ? opt.isCorrect
                          ? '#34d399'
                          : '#ef4444'
                        : isHovered
                        ? 'rgba(245, 158, 11, 0.25)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: isChosen && (opt.isCorrect || isChosen) ? '#0f172a' : isHovered ? '#f59e0b' : 'rgba(255, 255, 255, 0.65)',
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

          {/* Feedback & Next Button */}
          {gameState === 'revealed' && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 800, marginBottom: '4px' }}>
                ⚡ Root Cause: Line #{currentChallenge.buggyLineNumber}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45, marginBottom: '12px' }}>
                {currentChallenge.rootCause}
              </div>
              <button
                type="button"
                onClick={handleNextChallenge}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  color: '#0f172a',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Next Bug Challenge ➔
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
