import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { BUG_CHALLENGES, BugSnippetsChallenge } from '../../../data/spotTheBugData';
import { fetchSpotTheBugQuestions, QuizQuestion } from '../../../services/googleSheetQuizService';

type CategoryKey = 'all' | 'concurrency' | 'spring' | 'memory' | 'database' | 'async';

const CATEGORY_TABS: { id: CategoryKey; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Code Arenas (1,024 Qs)', icon: '⚡', color: '#a855f7' },
  { id: 'concurrency', label: 'Java Concurrency & OCP 21', icon: '☕', color: '#f59e0b' },
  { id: 'spring', label: 'Spring Boot Pitfalls', icon: '🍃', color: '#34d399' },
  { id: 'memory', label: 'JVM Memory & GC', icon: '🧠', color: '#ef4444' },
  { id: 'database', label: 'Database & Pools', icon: '🗄️', color: '#38bdf8' },
  { id: 'async', label: 'Async & Reactive', icon: '🔄', color: '#ec4899' },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[j], arr[i]] = [arr[i], arr[j]];
  }
  return arr;
}

export default function SpotTheBugDuelGame(): React.JSX.Element {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [challenges, setChallenges] = useState<BugSnippetsChallenge[]>(BUG_CHALLENGES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [gameState, setGameState] = useState<'playing' | 'revealed'>('playing');
  const [chosenOptionId, setChosenOptionId] = useState<string | null>(null);
  const [clickedLineNumber, setClickedLineNumber] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'fix'>('diagnosis');

  // Fetch 1,024 questions live from Google Sheet tab 'Spot The Bug' (with snapshot fallback)
  useEffect(() => {
    let isMounted = true;
    async function loadSheetData() {
      try {
        setIsLoading(true);
        const questions = await fetchSpotTheBugQuestions();
        if (isMounted && Array.isArray(questions) && questions.length > 0) {
          const mapped: BugSnippetsChallenge[] = questions.map((q) => {
            const topicLower = (q.topic || '').toLowerCase();
            const category: CategoryKey =
              topicLower.includes('spring') ? 'spring'
              : topicLower.includes('memory') || topicLower.includes('gc') || topicLower.includes('nio') || topicLower.includes('sequenced') ? 'memory'
              : topicLower.includes('database') || topicLower.includes('pool') || topicLower.includes('hikari') || topicLower.includes('jpa') ? 'database'
              : topicLower.includes('async') || topicLower.includes('reactive') || topicLower.includes('completable') ? 'async'
              : 'concurrency';

            const options = (q.options || []).map((optText, idx) => ({
              id: `opt-${idx}`,
              text: optText,
              isCorrect: idx === q.correctOptionIndex,
              explanation: idx === q.correctOptionIndex ? q.explanation : 'Incorrect diagnostic analysis.',
            }));

            const diff = q.difficulty === 'Junior' ? 'Junior' : q.difficulty === 'Mid' ? 'Mid' : q.difficulty === 'Staff' ? 'Staff' : 'Senior';
            const diffColor = diff === 'Junior' ? '#38bdf8' : diff === 'Mid' ? '#34d399' : diff === 'Staff' ? '#a855f7' : '#f59e0b';

            return {
              id: q.id,
              title: q.topic || 'Production Defect',
              category,
              categoryLabel: q.topic || 'Code Inspection',
              difficulty: diff,
              difficultyColor: diffColor,
              scenario: q.questionText,
              code: q.codeSnippet || '// No source snippet provided',
              buggyLineNumber: q.buggyLineNumber || 1,
              bugType: q.topic,
              symptom: q.questionText,
              options,
              rootCause: q.explanation,
              fixSnippet: q.fixSnippet || '// See senior architectural best practice',
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

  const currentChallenge = filteredChallenges[currentIdx % filteredChallenges.length];

  // Shuffled options per challenge
  const shuffledOptions = useMemo(() => {
    if (!currentChallenge) return [];
    return shuffle(currentChallenge.options);
  }, [currentChallenge]);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return;

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
  }, [gameState, currentIdx]);

  const handleSelectOption = (option: { id: string; isCorrect: boolean }) => {
    if (gameState !== 'playing') return;

    setChosenOptionId(option.id);
    setGameState('revealed');

    if (option.isCorrect) {
      const timeBonus = Math.round(timeLeft * 10);
      const comboMultiplier = 1 + combo * 0.25;
      const pointsEarned = Math.round((100 + timeBonus) * comboMultiplier);

      const newScore = score + pointsEarned;
      const newCombo = combo + 1;
      setScore(newScore);
      setCombo(newCombo);
      saveMiniGameScore('spot_bug', newScore);

      // Reward EXP
      addExp(25 + newCombo * 5, `Spot The Bug Defect Caught (+${newCombo}x combo)`);

      if (newCombo >= 3) {
        triggerFireworks();
        unlockAchievement('bug_hunter_streak');
      }
    } else {
      setCombo(0);
    }
  };

  const handleNextChallenge = () => {
    setGameState('playing');
    setChosenOptionId(null);
    setClickedLineNumber(null);
    setTimeLeft(30);
    setActiveTab('diagnosis');
    setCurrentIdx((prev) => (prev + 1) % filteredChallenges.length);
  };

  if (!currentChallenge) {
    return <div style={{ color: '#ffffff', padding: '24px' }}>No bug challenges found.</div>;
  }

  const codeLines = currentChallenge.code.split('\n');

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #090d16 0%, #0d121f 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
        padding: '24px',
        color: '#f8fafc',
      }}
    >
      {/* 1. Header Bar with Score, Timer & Rules Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.6rem' }}>🔍</span>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f59e0b' }}>
              Spot The Bug Duel Arena
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Real production code race • Identify concurrency, memory leaks & proxy hazards
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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
                padding: '4px 10px',
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

          {/* Countdown Sprint Timer */}
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

      {/* Rules Explanation Panel */}
      {showRules && (
        <div
          style={{
            padding: '16px 18px',
            borderRadius: '14px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '20px',
            fontSize: '0.85rem',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 800, color: '#f59e0b', marginBottom: '6px' }}>
            🎯 Bug Duel Rules & Scoring:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255, 255, 255, 0.8)' }}>
            <li>Inspect the actual production code snippet and click on any line or pick the architectural root cause.</li>
            <li>Identify subtle concurrency hazards (DCL, volatile), memory leaks (ThreadLocal), and Spring AOP self-invocation traps.</li>
            <li>Earn base points + speed bonus for fast diagnoses. Maintain continuous streaks for up to 3x EXP multipliers!</li>
          </ul>
        </div>
      )}

      {/* 2. Category Switcher */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '18px' }}>
        {CATEGORY_TABS.map((tab) => {
          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedCategory(tab.id);
                setCurrentIdx(0);
                setGameState('playing');
                setTimeLeft(30);
                setChosenOptionId(null);
              }}
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

      {/* 3. Challenge Scenario & Difficulty */}
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
        <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
          🚨 <strong>Incident Scenario:</strong> {currentChallenge.scenario}
        </div>
      </div>

      {/* 4. Interactive Monospace Code Box with Clickable Lines */}
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
        <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '8px' }}>
          📄 Production Source Snippet (Click any line to highlight bug):
        </div>

        {codeLines.map((line, idx) => {
          const lineNum = idx + 1;
          const isBuggy = gameState === 'revealed' && lineNum === currentChallenge.buggyLineNumber;
          const isClicked = clickedLineNumber === lineNum;

          let bg = 'transparent';
          if (isBuggy) bg = 'rgba(239, 68, 68, 0.25)';
          else if (isClicked) bg = 'rgba(245, 158, 11, 0.15)';

          return (
            <div
              key={lineNum}
              onClick={() => setClickedLineNumber(lineNum)}
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

      {/* 5. Diagnostic Choices or Revealed Solution */}
      {gameState === 'playing' ? (
        <div>
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '10px' }}>
            Choose the Architectural Root Cause:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            {shuffledOptions.map((opt, idx) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(opt)}
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                  e.currentTarget.style.borderColor = '#f59e0b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
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
            ))}
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
          {/* Tabs: Diagnostic vs Code Fix */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
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

          {activeTab === 'diagnosis' ? (
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f59e0b', marginBottom: '6px' }}>
                ⚡ Defect: {currentChallenge.bugType}
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
