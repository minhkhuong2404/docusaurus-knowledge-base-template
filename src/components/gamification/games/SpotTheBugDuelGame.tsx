import React, { useState, useEffect, useMemo } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { arcadeAudio } from '../../../utils/arcadeAudio';
import { BUG_CHALLENGES, BugSnippetsChallenge } from '../../../data/spotTheBugData';
import { fetchSpotTheBugQuestions, QuizQuestion } from '../../../services/googleSheetQuizService';
import { Highlight, Prism } from 'prism-react-renderer';
import prismTheme from '../../../theme/prismTheme';

// Ensure Java support is registered in Prism if available
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Prism = Prism;
} else if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('prismjs/components/prism-java');
} catch {
  // fallback if already loaded or in browser bundle
}

function findCommentIndex(line: string): number {
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;

  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    const prev = i > 0 ? line[i - 1] : '';

    if (ch === "'" && !inDouble && !inBacktick && prev !== '\\') {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle && !inBacktick && prev !== '\\') {
      inDouble = !inDouble;
    } else if (ch === '`' && !inSingle && !inDouble && prev !== '\\') {
      inBacktick = !inBacktick;
    } else if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '/' && line[i + 1] === '/') {
        return i;
      }
    }
  }
  return -1;
}

const ERROR_COMMENT_REGEX = /(line\s*\d+|missing|hazard|leak|vulnerabilit|bypass|defect|bug|crash|fail|race|deadlock|starvation|overflow|slow|lost update|swallow|never reached|throws|pins|corrupt|reorder|wildcard|untrusted|rce|self-invocation|clean\s*up|decrement|stampede|simultaneous|attacker|null|ttl|exceed|subsequent|enforce|signing key|unvalidated|gadget|cold publisher|nothing happens|auto-commit|without|attempting to read|check-then-act|mutates list|connection is never returned)/i;

export function sanitizeBugCode(code: string): string {
  if (!code) return '';
  const lines = code.split('\n');

  const cleaned = lines.map((line) => {
    const commentIdx = findCommentIndex(line);
    if (commentIdx === -1) {
      return line;
    }

    const before = line.slice(0, commentIdx);
    const commentPart = line.slice(commentIdx);

    // Standalone comment line (only whitespace before //)
    if (before.trim().length === 0) {
      if (ERROR_COMMENT_REGEX.test(commentPart) || /^\/\/\s*Line\s*\d+/i.test(commentPart.trim())) {
        return ''; // Blank line preserves line numbering
      }
      return line;
    }

    // Trailing inline comment on a line of code: strip it so errors are not spoiled
    return before.trimEnd();
  });

  return cleaned.join('\n');
}

function detectCodeLanguage(code: string, category: string): string {
  const trimmed = code.trim();
  if (category === 'database' || trimmed.startsWith('SELECT') || trimmed.startsWith('CREATE') || trimmed.startsWith('INSERT') || trimmed.startsWith('UPDATE') || trimmed.startsWith('DELETE') || trimmed.startsWith('ALTER')) {
    return 'sql';
  }
  if (category === 'devops' && (trimmed.startsWith('apiVersion:') || trimmed.startsWith('services:') || trimmed.startsWith('version:'))) {
    return 'yaml';
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }
  if (trimmed.startsWith('#!/bin/bash') || trimmed.startsWith('kubectl ') || trimmed.startsWith('docker ')) {
    return 'bash';
  }
  return 'java';
}

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
            const rawCode = (q.codeSnippet && q.codeSnippet.trim().length > 0)
              ? q.codeSnippet.replace(/\\n/g, '\n')
              : '// No source snippet provided';
            const codeContent = sanitizeBugCode(rawCode);

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
    if (pool.length === 0) {
      pool = selectedCategory === 'all' ? BUG_CHALLENGES : BUG_CHALLENGES.filter((c) => c.category === selectedCategory);
    }
    if (pool.length === 0) {
      pool = BUG_CHALLENGES;
    }
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
  const currentChallengeIndex = safeIdx;

  const shuffledOptions = useMemo(() => {
    if (!currentChallenge || !Array.isArray(currentChallenge.options)) return [];
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

  // Inspection tabs & Thread stepper
  const [activeInspectorTab, setActiveInspectorTab] = useState<'code' | 'threads' | 'diff'>('code');
  const [threadStep, setThreadStep] = useState<number>(0);

  const resetRoundState = () => {
    setChosenOptionId(null);
    setClickedLineNumber(null);
    setLineIdentifiedBonus(false);
    setAnalyzerUsed(false);
    setEliminatedOptionIds([]);
    setBreakpointHintUsed(false);
    setTimeWarpUsed(false);
    setTimeLeft(activeModeConfig.timerSecs || 30);
    setActiveInspectorTab('code');
    setThreadStep(0);
  };

  const handleStartGame = () => {
    arcadeAudio.playLaser();
    setGameState('playing');
    resetRoundState();
  };

  const handleNextChallenge = () => {
    arcadeAudio.playFlip();
    setCategoryIndexMap((prev) => ({
      ...prev,
      [selectedCategory]: (prev[selectedCategory] ?? 0) + 1,
    }));
    setGameState('playing');
    resetRoundState();
  };

  const handleSkipChallenge = () => {
    arcadeAudio.playBlip();
    handleNextChallenge();
  };

  const handleSelectOption = (option: { id: string; isCorrect: boolean; text: string; explanation: string }) => {
    if (gameState === 'revealed' || chosenOptionId) return;

    setChosenOptionId(option.id);
    setGameState('revealed');

    if (option.isCorrect) {
      arcadeAudio.playCorrect();
      const lineBonus = lineIdentifiedBonus ? 50 : 0;
      const speedBonus = activeModeConfig.timerSecs ? Math.max(0, timeLeft * 2) : 10;
      const earnedScore = 100 + lineBonus + speedBonus;
      const newScore = score + earnedScore;
      const newCombo = combo + 1;

      setScore(newScore);
      setCombo(newCombo);
      if (currentChallenge?.id) {
        markBugSolved(currentChallenge.id);
      }

      const expGain = 25 + (newCombo > 2 ? 15 : 0);
      addExp(expGain, `Spotted bug: ${currentChallenge?.title || 'Defect'}`);
      saveMiniGameScore('spot_bug', newScore);

      if (newCombo >= 3) {
        unlockAchievement('bug_hunter');
      }
      triggerFireworks(2000);
    } else {
      arcadeAudio.playError();
      setCombo(0);
    }
  };

  const handleLineClick = (lineNum: number) => {
    if (gameState === 'revealed') return;
    setClickedLineNumber(lineNum);
    if (lineNum === currentChallenge?.buggyLineNumber) {
      arcadeAudio.playCorrect();
      setLineIdentifiedBonus(true);
    } else {
      arcadeAudio.playBlip();
      setLineIdentifiedBonus(false);
    }
  };

  const handleUseAnalyzer = () => {
    if (analyzerUsed || gameState === 'revealed') return;
    arcadeAudio.playBlip();
    setAnalyzerUsed(true);
    const incorrectOptions = shuffledOptions.filter((o) => !o.isCorrect);
    const toEliminate = shuffle(incorrectOptions).slice(0, 2).map((o) => o.id);
    setEliminatedOptionIds(toEliminate);
  };

  const handleUseBreakpoint = () => {
    if (breakpointHintUsed || gameState === 'revealed') return;
    arcadeAudio.playLaser();
    setBreakpointHintUsed(true);
    if (currentChallenge?.buggyLineNumber) {
      setClickedLineNumber(currentChallenge.buggyLineNumber);
      setLineIdentifiedBonus(true);
    }
  };

  const handleUseTimeWarp = () => {
    if (timeWarpUsed || gameState === 'revealed') return;
    arcadeAudio.playLaser();
    setTimeWarpUsed(true);
    setTimeLeft((prev) => prev + 15);
  };

  const cleanedCode = useMemo(() => {
    return sanitizeBugCode(currentChallenge?.code || '');
  }, [currentChallenge?.code]);

  const targetLanguage = useMemo(() => {
    const detected = detectCodeLanguage(cleanedCode, currentChallenge?.category || 'concurrency');
    return Prism.languages[detected] ? detected : (Prism.languages.java ? 'java' : 'clike');
  }, [cleanedCode, currentChallenge?.category]);

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
            {/* Left: Setup & Category & Question Counter */}
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
                ⚙️ Setup
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

              <span
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 750,
                }}
              >
                Bug {currentChallengeIndex + 1} / {filteredChallenges.length}
              </span>
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
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      background: breakpointHintUsed ? 'transparent' : 'rgba(251, 191, 36, 0.1)',
                      color: breakpointHintUsed ? 'rgba(255, 255, 255, 0.3)' : '#fbbf24',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: breakpointHintUsed ? 'not-allowed' : 'pointer',
                    }}
                    title="Highlight Suspect Line"
                  >
                    💡 Hint
                  </button>
                  {gameMode !== 'zen' && (
                    <button
                      type="button"
                      disabled={timeWarpUsed}
                      onClick={handleUseTimeWarp}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        background: timeWarpUsed ? 'transparent' : 'rgba(52, 211, 153, 0.1)',
                        color: timeWarpUsed ? 'rgba(255, 255, 255, 0.3)' : '#34d399',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: timeWarpUsed ? 'not-allowed' : 'pointer',
                      }}
                      title="Add 15 Seconds"
                    >
                      ⏳ +15s
                    </button>
                  )}
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
                    title="Skip Question"
                  >
                    ⏭️ Skip
                  </button>
                </>
              )}

              {combo >= 2 && (
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)',
                    border: '1px solid #f59e0b',
                    color: '#fde68a',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                  }}
                >
                  🔥 {combo}x
                </div>
              )}

              {gameMode !== 'zen' && (
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: timeLeft <= 5 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${timeLeft <= 5 ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: timeLeft <= 5 ? '#f87171' : '#fbbf24',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                  }}
                >
                  ⏱️ {timeLeft}s
                </div>
              )}

              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(52, 211, 153, 0.15)',
                  color: '#34d399',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                }}
              >
                🏆 {score} pts
              </div>
            </div>
          </div>

          {/* Question Title & Prompt */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
                {currentChallenge?.title || 'Code Challenge'}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {lineIdentifiedBonus && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                    🎯 Line Precision Match!
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${currentChallenge?.difficultyColor || '#f59e0b'}22`, color: currentChallenge?.difficultyColor || '#f59e0b' }}>
                  {currentChallenge?.difficulty || 'Senior'}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
              {currentChallenge?.scenario || ''}
            </div>
          </div>

          {/* Inspector Mode Tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {[
              { id: 'code', label: '💻 Code Inspector', icon: '🔍' },
              { id: 'threads', label: '🔀 Step Race Condition', icon: '⚡' },
              { id: 'diff', label: '✨ Senior Solution Diff', icon: '📝' },
            ].map((tab) => {
              const isSelected = activeInspectorTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    arcadeAudio.playBlip();
                    setActiveInspectorTab(tab.id as any);
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Code Editor Box */}
          {activeInspectorTab === 'code' && (
            <Highlight
              theme={prismTheme}
              code={cleanedCode}
              language={targetLanguage}
              prism={Prism}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <div
                  className={className}
                  style={{
                    ...style,
                    background: '#0a0d16',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '12px 14px',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    overflowX: 'auto',
                    marginBottom: '14px',
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {/* Editor Header */}
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.45)',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                      paddingBottom: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      <span style={{ marginLeft: '4px', fontWeight: 700, letterSpacing: '0.5px' }}>
                        Source Editor ({targetLanguage.toUpperCase()}) — Click line to isolate bug:
                      </span>
                    </div>
                    {clickedLineNumber && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: clickedLineNumber === currentChallenge?.buggyLineNumber ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: clickedLineNumber === currentChallenge?.buggyLineNumber ? '#34d399' : '#fbbf24',
                          border: `1px solid ${clickedLineNumber === currentChallenge?.buggyLineNumber ? 'rgba(52, 211, 153, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                        }}
                      >
                        Line #{clickedLineNumber} {clickedLineNumber === currentChallenge?.buggyLineNumber ? '✓ Match (+50 pts)' : 'Marked'}
                      </span>
                    )}
                  </div>

                  {tokens.map((lineTokens, idx) => {
                    const lineNum = idx + 1;
                    const isBuggy = (gameState === 'revealed' || breakpointHintUsed) && lineNum === currentChallenge?.buggyLineNumber;
                    const isClicked = clickedLineNumber === lineNum;

                    let bg = 'transparent';
                    let borderLeft = '3px solid transparent';
                    if (isBuggy) {
                      bg = 'rgba(239, 68, 68, 0.22)';
                      borderLeft = '3px solid #ef4444';
                    } else if (isClicked) {
                      bg = 'rgba(245, 158, 11, 0.15)';
                      borderLeft = '3px solid #f59e0b';
                    }

                    const lineProps = getLineProps({ line: lineTokens, key: idx });

                    return (
                      <div
                        {...lineProps}
                        key={idx}
                        onClick={() => handleLineClick(lineNum)}
                        style={{
                          ...lineProps.style,
                          display: 'flex',
                          alignItems: 'center',
                          background: bg,
                          borderLeft,
                          borderRadius: '4px',
                          padding: '1.5px 6px',
                          cursor: gameState === 'playing' ? 'pointer' : 'default',
                          transition: 'background 0.15s ease',
                          minHeight: '22px',
                        }}
                      >
                        <span
                          style={{
                            width: '34px',
                            userSelect: 'none',
                            color: isBuggy ? '#ef4444' : isClicked ? '#f59e0b' : 'rgba(255, 255, 255, 0.3)',
                            fontWeight: isBuggy || isClicked ? 800 : 400,
                            fontSize: '0.78rem',
                            flexShrink: 0,
                          }}
                        >
                          {lineNum}
                        </span>
                        <span style={{ whiteSpace: 'pre', flex: 1, fontFamily: 'inherit' }}>
                          {lineTokens.map((token, key) => (
                            <span {...getTokenProps({ token, key })} key={key} />
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Highlight>
          )}

          {/* TAB 2: Visual Thread Interleaving Stepper */}
          {activeInspectorTab === 'threads' && (
            <div
              style={{
                marginBottom: '14px',
                padding: '16px',
                borderRadius: '12px',
                background: '#0a0d16',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔀 Concurrency Stepper: Interleaved Thread Execution</span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                    Step {threadStep + 1} of 5
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={threadStep === 0}
                    onClick={() => {
                      arcadeAudio.playBlip();
                      setThreadStep((p) => Math.max(0, p - 1));
                    }}
                    style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#fff', fontSize: '0.74rem', fontWeight: 750, cursor: threadStep === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    ◀ Prev Step
                  </button>
                  <button
                    type="button"
                    disabled={threadStep === 4}
                    onClick={() => {
                      arcadeAudio.playLaser();
                      setThreadStep((p) => Math.min(4, p + 1));
                    }}
                    style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.25)', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '0.74rem', fontWeight: 750, cursor: threadStep === 4 ? 'not-allowed' : 'pointer' }}
                  >
                    Next Step ▶
                  </button>
                </div>
              </div>

              {/* Hardware Cores & Shared RAM Visualizer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                {/* Thread 1 Box */}
                <div style={{ padding: '10px', borderRadius: '8px', background: threadStep === 1 || threadStep === 4 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: `1px solid ${threadStep === 1 || threadStep === 4 ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}` }}>
                  <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800 }}>CPU Core 0 (Thread 1)</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                    {threadStep === 0 ? 'STATUS: IDLE' : threadStep === 1 ? 'LOAD [val] ➔ R1 = 0' : threadStep === 2 || threadStep === 3 ? 'PREEMPTED (Waiting)' : threadStep === 4 ? 'RESUMED: STORE R1 (1) ➔ [val]' : 'COMPLETED'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                    Local Register R1: {threadStep >= 1 ? '0' : 'null'} {threadStep === 4 ? '(Stale!)' : ''}
                  </div>
                </div>

                {/* Shared RAM Box */}
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 800 }}>Shared Heap Memory (RAM)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: threadStep === 4 || threadStep === 5 ? '#ef4444' : '#fbbf24', marginTop: '4px' }}>
                    val = {threadStep <= 2 ? 0 : 1}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                    Expected: {threadStep >= 4 ? '2' : '0'}
                  </div>
                </div>

                {/* Thread 2 Box */}
                <div style={{ padding: '10px', borderRadius: '8px', background: threadStep === 2 || threadStep === 3 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: `1px solid ${threadStep === 2 || threadStep === 3 ? '#a855f7' : 'rgba(255, 255, 255, 0.08)'}` }}>
                  <div style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 800 }}>CPU Core 1 (Thread 2)</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                    {threadStep === 0 || threadStep === 1 ? 'STATUS: WAITING' : threadStep === 2 ? 'LOAD [val] ➔ R2 = 0' : threadStep === 3 ? 'STORE R2 (1) ➔ [val]' : 'COMPLETED'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                    Local Register R2: {threadStep >= 2 ? (threadStep === 2 ? '0' : '1') : 'null'}
                  </div>
                </div>
              </div>

              {/* Step Explanatory Banner */}
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: threadStep === 4 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)', border: `1px solid ${threadStep === 4 ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`, fontSize: '0.8rem', color: threadStep === 4 ? '#fca5a5' : '#ffffff', lineHeight: 1.4 }}>
                {threadStep === 0 && '👉 Initial state: Two parallel threads are dispatched without memory barriers or synchronizers.'}
                {threadStep === 1 && '👉 Step 1: Thread 1 reads shared memory value 0 into CPU register R1.'}
                {threadStep === 2 && '🚨 Step 2 (Context Switch): OS interrupts Thread 1 before writeback! Thread 2 reads the same un-updated value 0.'}
                {threadStep === 3 && '👉 Step 3: Thread 2 increments R2 to 1 and writes it back to Main RAM (val = 1).'}
                {threadStep === 4 && '💥 Hazard Exploded: Thread 1 wakes up with stale R1=0, increments to 1, and overwrites Thread 2\'s write! Total increments: 2, but val is 1 (Lost Update).'}
              </div>
            </div>
          )}

          {/* TAB 3: Side-by-Side / Unified Solution Diff */}
          {activeInspectorTab === 'diff' && (
            <div
              style={{
                marginBottom: '14px',
                padding: '14px',
                borderRadius: '10px',
                background: '#07090e',
                border: '1px solid rgba(52, 211, 153, 0.3)',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', marginBottom: '8px', textTransform: 'uppercase' }}>
                ✨ Verified Solution Diff (Line #{currentChallenge?.buggyLineNumber || 1}):
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', borderLeft: '3px solid #ef4444', padding: '6px 12px', borderRadius: '4px', marginBottom: '6px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#fca5a5' }}>
                - // Defective Line #{currentChallenge?.buggyLineNumber || 1}: Lacks thread-safety / atomicity
              </div>
              <div style={{ background: 'rgba(52, 211, 153, 0.12)', borderLeft: '3px solid #34d399', padding: '6px 12px', borderRadius: '4px', marginBottom: '10px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#86efac' }}>
                + {currentChallenge?.fixSnippet?.trim() || '// Recommended patch'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.45 }}>
                {currentChallenge?.rootCause || ''}
              </div>
            </div>
          )}

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
                ⚡ Root Cause: Line #{currentChallenge?.buggyLineNumber || 1}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45, marginBottom: '12px' }}>
                {currentChallenge?.rootCause || ''}
              </div>

              {currentChallenge.fixSnippet && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    💡 Verified Senior Solution:
                  </div>
                  <Highlight
                    theme={prismTheme}
                    code={currentChallenge.fixSnippet.trim()}
                    language={targetLanguage}
                    prism={Prism}
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <pre
                        className={className}
                        style={{
                          ...style,
                          background: '#07090e',
                          borderRadius: '8px',
                          border: '1px solid rgba(52, 211, 153, 0.25)',
                          padding: '10px 12px',
                          fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '0.8rem',
                          lineHeight: 1.45,
                          margin: 0,
                          overflowX: 'auto',
                        }}
                      >
                        {tokens.map((line, i) => (
                          <div {...getLineProps({ line, key: i })} key={i}>
                            {line.map((token, key) => (
                              <span {...getTokenProps({ token, key })} key={key} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </div>
              )}
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
