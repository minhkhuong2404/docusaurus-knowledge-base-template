import React, { useState, useEffect, useMemo } from 'react';
import styles from './styles.module.css';
import {
  QuizQuestion,
  QuizCategoryKey,
  SPREADSHEET_URL,
  fetchAllTabQuestions,
  fetchAllTabQuestionsWithRevalidate,
} from '../../services/googleSheetQuizService';
import { useUserProgress } from '../../context/UserProgressContext';
import { QuizStateItem } from '../../services/userProgressService';

interface DailyQuizGalleryProps {
  initialCategory?: QuizCategoryKey;
}

const CATEGORIES = [
  { id: 'java' as const, label: '☕ Java', color: '#fbbf24' },
  { id: 'spring-boot' as const, label: '🍃 Spring Boot', color: '#34d399' },
  { id: 'system-design' as const, label: '🏗️ System Design', color: '#a855f7' },
  { id: 'all' as const, label: '🌐 All Questions', color: '#38bdf8' },
];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function DailyQuizGallery({
  initialCategory = 'java',
}: DailyQuizGalleryProps): React.JSX.Element {
  const { progress, saveQuiz, isAdmin } = useUserProgress();

  // State
  const [activeCategory, setActiveCategory] = useState<QuizCategoryKey>(initialCategory);
  const [questionsMap, setQuestionsMap] = useState<Record<string, QuizQuestion[]>>({
    java: [],
    'spring-boot': [],
    'system-design': [],
    all: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [practiceQueue, setPracticeQueue] = useState<QuizQuestion[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch from Google Sheet (Single Source of Truth with Stale-While-Revalidate)
  const loadQuestions = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
      try {
        const data = await fetchAllTabQuestions(true);
        setQuestionsMap(data);
      } catch (err) {
        console.error('Failed to load quiz questions from Google Sheet:', err);
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setIsLoading(true);
      try {
        const data = await fetchAllTabQuestionsWithRevalidate((freshData) => {
          setQuestionsMap(freshData);
        });
        setQuestionsMap(data);
      } catch (err) {
        console.error('Failed to load quiz questions from Google Sheet:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadQuestions(false);
  }, []);

  const categoryQuestions = useMemo(() => {
    return questionsMap[activeCategory] || [];
  }, [questionsMap, activeCategory]);

  // Extract all unique topics for dropdown filter
  const topicsList = useMemo(() => {
    const set = new Set<string>();
    categoryQuestions.forEach((q) => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set).sort();
  }, [categoryQuestions]);

  // User answered states from progress context (aggregates all categories when 'all' is selected)
  const userAnswers: Record<string, number> = useMemo(() => {
    if (activeCategory === 'all') {
      const allAns: Record<string, number> = {};
      const states = progress.quizStats?.quizStates || {};
      Object.values(states).forEach((st) => {
        if (st?.userAnswers) {
          Object.assign(allAns, st.userAnswers);
        }
      });
      return allAns;
    }
    const savedQuizState = progress.quizStats?.quizStates?.[activeCategory];
    return savedQuizState?.userAnswers || {};
  }, [progress.quizStats, activeCategory]);

  // List of valid question IDs in the current category that have been answered
  const answeredQuestionIds = useMemo(() => {
    return categoryQuestions
      .map((q) => q.id)
      .filter((qId) => userAnswers[qId] !== undefined);
  }, [categoryQuestions, userAnswers]);

  // Filter questions based on selected Topic and Difficulty
  const filteredQuestions = useMemo(() => {
    return categoryQuestions.filter((q) => {
      if (selectedTopic !== 'all' && q.topic !== selectedTopic) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
      return true;
    });
  }, [categoryQuestions, selectedTopic, selectedDifficulty]);

  // Build the practice queue (unanswered questions prioritized, with Fisher-Yates shuffle)
  useEffect(() => {
    if (filteredQuestions.length > 0) {
      const unanswered = filteredQuestions.filter((q) => userAnswers[q.id] === undefined);
      const queue = unanswered.length > 0 ? shuffleArray(unanswered) : shuffleArray(filteredQuestions);
      setPracticeQueue(queue);
      setCurrentIndex(0);
    } else {
      setPracticeQueue([]);
      setCurrentIndex(0);
    }
  }, [filteredQuestions, activeCategory]);

  const activeCategoryObj = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  const currentQuestion = practiceQueue[currentIndex] || null;
  const isCompleted = practiceQueue.length > 0 && currentIndex >= practiceQueue.length;

  const selectedOptionIndex = currentQuestion ? userAnswers[currentQuestion.id] : undefined;
  const isAnswered = selectedOptionIndex !== undefined;
  const isCorrect = isAnswered && currentQuestion && selectedOptionIndex === currentQuestion.correctOptionIndex;

  // Handle Option Click with explicit ID-based state recording
  const handleOptionClick = (optionIndex: number) => {
    if (!currentQuestion || isAnswered) return;

    const isOptionCorrect = optionIndex === currentQuestion.correctOptionIndex;
    const targetKey = currentQuestion.category
      ? (currentQuestion.category.toLowerCase().replace(/\s+/g, '-') as QuizCategoryKey)
      : (activeCategory === 'all' ? 'java' : activeCategory);

    const prevCategoryState = progress.quizStats?.quizStates?.[targetKey];
    const categoryUserAnswers = {
      ...(prevCategoryState?.userAnswers || {}),
      [currentQuestion.id]: optionIndex,
    };

    const updatedSkipped = skippedIds.filter((id) => id !== currentQuestion.id);
    setSkippedIds(updatedSkipped);

    const targetCategoryQuestions = questionsMap[targetKey] || categoryQuestions;
    const targetAnsweredIds = targetCategoryQuestions
      .map((q) => q.id)
      .filter((qId) => categoryUserAnswers[qId] !== undefined);

    const stateItem: QuizStateItem = {
      date: new Date().toDateString(),
      totalQuestions: targetCategoryQuestions.length || categoryQuestions.length,
      answeredQuestionIds: targetAnsweredIds,
      userAnswers: categoryUserAnswers,
      skippedIds: updatedSkipped,
      shuffledIds: practiceQueue.map((q) => q.id),
      currentIndex,
      isCompleted: targetAnsweredIds.length >= (targetCategoryQuestions.length || categoryQuestions.length),
    };

    saveQuiz(targetKey, stateItem, 1, isOptionCorrect ? 1 : 0);
  };

  const handleNext = () => {
    if (currentIndex < practiceQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(practiceQueue.length);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    if (!currentQuestion) return;
    if (!skippedIds.includes(currentQuestion.id)) {
      setSkippedIds([...skippedIds, currentQuestion.id]);
    }
    handleNext();
  };

  const handleReshuffle = () => {
    if (filteredQuestions.length > 0) {
      const unanswered = filteredQuestions.filter((q) => userAnswers[q.id] === undefined);
      setPracticeQueue(shuffleArray(unanswered.length > 0 ? unanswered : filteredQuestions));
      setCurrentIndex(0);
    }
  };

  const handleRestart = () => {
    if (filteredQuestions.length > 0) {
      setPracticeQueue(shuffleArray(filteredQuestions));
      setCurrentIndex(0);
      setSkippedIds([]);
    }
  };

  const handleCopyQuestion = () => {
    if (!currentQuestion) return;
    const text = `${currentQuestion.questionText}\n\n${currentQuestion.options
      .map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`)
      .join('\n')}\n\nCorrect Answer: Option ${String.fromCharCode(65 + currentQuestion.correctOptionIndex)} - ${
      currentQuestion.options[currentQuestion.correctOptionIndex]
    }\n\nExplanation: ${currentQuestion.explanation}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stats calculation strictly matching current category question IDs
  const answeredCount = answeredQuestionIds.length;
  const correctCount = useMemo(() => {
    return categoryQuestions.reduce((acc, q) => {
      const ansIdx = userAnswers[q.id];
      return ansIdx !== undefined && ansIdx === q.correctOptionIndex ? acc + 1 : acc;
    }, 0);
  }, [categoryQuestions, userAnswers]);
  const accuracyPct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const progressPercent =
    categoryQuestions.length > 0
      ? Math.min(100, Math.round((answeredCount / categoryQuestions.length) * 100))
      : 0;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* ── 1. Standard Diagram Header Bar (DESIGNS.md compliant) ── */}
      <div className="interactive-diagram-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={activeCategoryObj.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M9 7h6M9 11h6" />
        </svg>

        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Interactive Practice Challenge
        </span>

        {isAdmin && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '5px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}
            >
              🛡️ Admin
            </span>

            <button
              onClick={() => loadQuestions(true)}
              disabled={isRefreshing}
              style={{
                padding: '5px 12px',
                borderRadius: '7px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '11.5px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--ifm-color-content)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Admin: Pull live updates directly from Google Sheet"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isRefreshing ? styles.syncSpin : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {isRefreshing ? 'Syncing…' : 'Sync Sheet'}
            </button>

            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '5px 12px',
                borderRadius: '7px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                fontWeight: 600,
                fontSize: '11.5px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              Google Sheet ↗
            </a>
          </div>
        )}
      </div>

      {/* ── 2. Category Switcher Tabs (Archetype C compliant) ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0 4px' }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count =
            cat.id === 'all'
              ? (questionsMap.java?.length || 1024) +
                (questionsMap['spring-boot']?.length || 1024) +
                (questionsMap['system-design']?.length || 1024)
              : questionsMap[cat.id]?.length || 1024;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedTopic('all');
                setSelectedDifficulty('all');
              }}
              style={{
                flex: '1 1 140px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12.5px',
                background: isActive ? `${cat.color}18` : 'rgba(255,255,255,0.04)',
                color: isActive ? cat.color : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive
                  ? `0 0 0 1.5px ${cat.color}50`
                  : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>{cat.label}</span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  background: isActive ? `${cat.color}30` : 'rgba(255,255,255,0.08)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Multi-Filter Toolbar & Quick Metrics ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Topic Dropdown */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={{
              background: '#090b14',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--ifm-color-content)',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Topics ({topicsList.length})</option>
            {topicsList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Difficulty Filter Pills */}
          <div style={{ display: 'inline-flex', gap: '4px' }}>
            {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => {
              const isActive = selectedDifficulty === diff;
              const color =
                diff === 'easy'
                  ? '#34d399'
                  : diff === 'medium'
                  ? '#fbbf24'
                  : diff === 'hard'
                  ? '#f87171'
                  : '#38bdf8';
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isActive ? `${color}20` : 'rgba(255,255,255,0.04)',
                    color: isActive ? color : 'var(--ifm-color-content-secondary)',
                    boxShadow: isActive ? `0 0 0 1px ${color}60` : '0 0 0 1px rgba(255,255,255,0.06)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {diff === 'all'
                    ? 'All Levels'
                    : diff === 'easy'
                    ? '🟢 Easy'
                    : diff === 'medium'
                    ? '🟡 Medium'
                    : '🔴 Hard'}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleReshuffle}
            style={{
              padding: '5px 11px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--ifm-color-content)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Fisher-Yates random shuffle of questions"
          >
            🔀 Reshuffle Queue
          </button>
        </div>
      </div>

      {/* ── 4. Progress & Streak Bar ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <span>
            Queue: <strong style={{ color: 'var(--ifm-color-content)' }}>{currentIndex + 1}</strong> of{' '}
            <strong style={{ color: 'var(--ifm-color-content)' }}>{practiceQueue.length}</strong> questions
          </span>
          <span>
            Total Answered:{' '}
            <strong style={{ color: '#34d399' }}>{answeredCount}</strong> / {categoryQuestions.length} ({progressPercent}%) • Accuracy:{' '}
            <strong style={{ color: accuracyPct >= 70 ? '#34d399' : '#fbbf24' }}>{accuracyPct}%</strong>
          </span>
        </div>

        <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${practiceQueue.length > 0 ? Math.min(100, Math.round(((currentIndex + 1) / practiceQueue.length) * 100)) : 0}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${activeCategoryObj.color}, #34d399)`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* ── 5. Main Practice Question Card (DESIGNS.md details-card structure) ── */}
      {isLoading ? (
        <div className="interactive-diagram-details-card details-gray" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="interactive-diagram-helper-text">Fetching latest quiz questions directly from Google Sheet...</div>
        </div>
      ) : isCompleted ? (
        /* Completion Summary Card */
        <div className="interactive-diagram-details-card details-green" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399', margin: '0 0 8px' }}>
            Outstanding Job! Challenge Queue Completed
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 1.5rem' }}>
            You have answered all available questions in this practice set.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '1.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '10px', padding: '10px 18px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>{correctCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Correct Answers</div>
            </div>

            <div style={{ background: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '10px', padding: '10px 18px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171' }}>{answeredCount - correctCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Incorrect</div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '10px 18px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>{accuracyPct}%</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Accuracy Rate</div>
            </div>
          </div>

          <button
            onClick={handleRestart}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#34d399',
              color: '#090b14',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🔄 Reset & Restart Practice Set
          </button>
        </div>
      ) : currentQuestion ? (
        <div
          className="interactive-diagram-details-card details-blue"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            padding: '1.5rem',
            borderRadius: '12px',
          }}
        >
          {/* Card Meta Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--ifm-font-family-monospace, monospace)',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--ifm-color-content-secondary)',
                }}
              >
                {currentQuestion.id}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                {currentQuestion.topic}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background:
                    currentQuestion.difficulty === 'easy'
                      ? 'rgba(52, 211, 153, 0.12)'
                      : currentQuestion.difficulty === 'hard'
                      ? 'rgba(248, 113, 113, 0.12)'
                      : 'rgba(251, 191, 36, 0.12)',
                  color:
                    currentQuestion.difficulty === 'easy'
                      ? '#34d399'
                      : currentQuestion.difficulty === 'hard'
                      ? '#f87171'
                      : '#fbbf24',
                  border:
                    currentQuestion.difficulty === 'easy'
                      ? '1px solid rgba(52, 211, 153, 0.3)'
                      : currentQuestion.difficulty === 'hard'
                      ? '1px solid rgba(248, 113, 113, 0.3)'
                      : '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                {currentQuestion.difficulty === 'easy'
                  ? '🟢 Easy'
                  : currentQuestion.difficulty === 'hard'
                  ? '🔴 Hard'
                  : '🟡 Medium'}
              </span>
            </div>

            <button
              onClick={handleCopyQuestion}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'var(--ifm-color-content-secondary)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Copy question and explanation"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>

          {/* Question Text */}
          <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.5, color: 'var(--ifm-color-content)' }}>
            {currentQuestion.questionText}
          </div>

          {/* Code Snippet (if present) */}
          {currentQuestion.codeSnippet && (
            <div
              style={{
                background: '#070913',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontFamily: 'var(--ifm-font-family-monospace, monospace)',
                fontSize: '12.5px',
                lineHeight: 1.5,
                color: '#e2e8f0',
                overflowX: 'auto',
                whiteSpace: 'pre',
                maxHeight: '260px',
              }}
            >
              <code>{currentQuestion.codeSnippet}</code>
            </div>
          )}

          {/* Interactive Option List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentQuestion.options.map((opt, oIdx) => {
              let bg = 'rgba(255, 255, 255, 0.03)';
              let border = '1px solid rgba(255, 255, 255, 0.10)';
              let color = 'var(--ifm-color-content)';
              let icon = null;

              if (isAnswered) {
                if (oIdx === currentQuestion.correctOptionIndex) {
                  bg = 'rgba(52, 211, 153, 0.15)';
                  border = '1px solid #34d399';
                  color = '#34d399';
                  icon = '✅';
                } else if (selectedOptionIndex === oIdx) {
                  bg = 'rgba(248, 113, 113, 0.15)';
                  border = '1px solid #f87171';
                  color = '#f87171';
                  icon = '❌';
                }
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => handleOptionClick(oIdx)}
                  disabled={isAnswered}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border,
                    background: bg,
                    color,
                    fontSize: '13px',
                    lineHeight: 1.45,
                    textAlign: 'left',
                    cursor: isAnswered ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>
                    <strong style={{ opacity: 0.9 }}>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                  </span>
                  {icon && <span style={{ fontSize: '13px' }}>{icon}</span>}
                </button>
              );
            })}
          </div>

          {/* Solution & Explanation Panel */}
          {isAnswered && (
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.07)',
                borderLeft: '3px solid #38bdf8',
                borderRadius: '0 8px 8px 0',
                padding: '12px 14px',
                fontSize: '12.5px',
                lineHeight: 1.55,
                color: 'var(--ifm-color-content)',
                marginTop: '4px',
              }}
            >
              <div style={{ fontWeight: 700, color: isCorrect ? '#34d399' : '#38bdf8', marginBottom: '4px' }}>
                {isCorrect ? '🎉 Correct Answer!' : '💡 Explanation & Solution:'}
              </div>
              {!isCorrect && (
                <div style={{ color: '#34d399', fontWeight: 600, marginBottom: '6px' }}>
                  Correct: Option {String.fromCharCode(65 + currentQuestion.correctOptionIndex)} -{' '}
                  {currentQuestion.options[currentQuestion.correctOptionIndex]}
                </div>
              )}
              <div style={{ color: 'var(--ifm-color-content-secondary)' }}>{currentQuestion.explanation}</div>
            </div>
          )}

          {/* Navigation Controls Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              marginTop: '4px',
            }}
          >
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: currentIndex === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
                color: currentIndex === 0 ? 'var(--ifm-color-content-secondary)' : 'var(--ifm-color-content)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentIndex === 0 ? 0.4 : 1,
              }}
            >
              ⬅️ Previous
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              {!isAnswered && (
                <button
                  onClick={handleSkip}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '7px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'transparent',
                    color: 'var(--ifm-color-content-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Skip ⏭️
                </button>
              )}

              <button
                onClick={handleNext}
                style={{
                  padding: '6px 16px',
                  borderRadius: '7px',
                  border: 'none',
                  background: isAnswered ? '#34d399' : 'rgba(56, 189, 248, 0.18)',
                  color: isAnswered ? '#090b14' : '#38bdf8',
                  boxShadow: isAnswered ? 'none' : '0 0 0 1px rgba(56, 189, 248, 0.4)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {currentIndex < practiceQueue.length - 1 ? 'Next Question ➡️' : 'Finish Challenge 🏁'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="interactive-diagram-details-card details-gray" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div className="interactive-diagram-helper-text">No questions found matching the selected filters.</div>
          <button
            onClick={() => {
              setSelectedTopic('all');
              setSelectedDifficulty('all');
            }}
            style={{
              marginTop: '10px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--ifm-color-content)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
