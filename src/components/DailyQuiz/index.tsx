import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import CodeBlock from '../CodeBlock';

export interface QuizQuestion {
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface DailyQuizProps {
  questions: QuizQuestion[];
  quizKey: string;
}

interface LocalQuizState {
  date: string;
  shuffledIds: string[];
  currentIndex: number;
  userAnswers: Record<string, number>;
  skippedIds: string[];
  isCompleted?: boolean;
}

function fisherYatesShuffle<T>(array: T[], seed?: string): T[] {
  const shuffled = [...array];
  let randomFunc = Math.random;

  if (seed) {
    let seedNum = 0;
    for (let i = 0; i < seed.length; i++) {
      seedNum = seed.charCodeAt(i) + ((seedNum << 5) - seedNum);
    }
    // Mulberry32 generator
    randomFunc = () => {
      let t = (seedNum += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(randomFunc() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

export default function DailyQuiz({ questions, quizKey }: DailyQuizProps) {
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const saveQuizState = (
    idx: number,
    answers: Record<string, number>,
    skipped: string[],
    questionsList: QuizQuestion[],
    completed: boolean = false
  ) => {
    const today = new Date().toDateString();
    const storageKey = `quiz-state-${quizKey}`;
    const state: LocalQuizState = {
      date: today,
      shuffledIds: questionsList.map(q => q.id),
      currentIndex: idx,
      userAnswers: answers,
      skippedIds: skipped,
      isCompleted: completed,
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  useEffect(() => {
    if (!questions || questions.length === 0) return;

    const today = new Date().toDateString();
    const storageKey = `quiz-state-${quizKey}`;
    const savedStateStr = localStorage.getItem(storageKey);

    let state: LocalQuizState | null = null;
    if (savedStateStr) {
      try {
        const parsed = JSON.parse(savedStateStr);
        if (
          parsed.date === today &&
          Array.isArray(parsed.shuffledIds) &&
          parsed.shuffledIds.length === questions.length
        ) {
          state = {
            date: parsed.date,
            shuffledIds: parsed.shuffledIds,
            currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0,
            userAnswers: parsed.userAnswers || (parsed.answeredOption !== undefined && parsed.shuffledIds[parsed.currentIndex] ? { [parsed.shuffledIds[parsed.currentIndex]]: parsed.answeredOption } : {}),
            skippedIds: parsed.skippedIds || [],
            isCompleted: parsed.isCompleted || false,
          };
        }
      } catch (e) {
        // ignore JSON errors
      }
    }

    if (!state) {
      const shuffled = fisherYatesShuffle(questions, `${today}-${quizKey}`);
      state = {
        date: today,
        shuffledIds: shuffled.map(q => q.id),
        currentIndex: 0,
        userAnswers: {},
        skippedIds: [],
        isCompleted: false,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }

    const questionMap = new Map(questions.map(q => [q.id, q]));
    const mapped = state.shuffledIds
      .map(id => questionMap.get(id))
      .filter((q): q is QuizQuestion => !!q);

    setShuffledQuestions(mapped);
    setCurrentIndex(Math.min(state.currentIndex, Math.max(0, mapped.length - 1)));
    setUserAnswers(state.userAnswers);
    setSkippedIds(state.skippedIds);
    setIsCompleted(state.isCompleted || false);
    setIsInitialized(true);
  }, [questions, quizKey]);

  const handleOptionClick = (index: number) => {
    const currentQuestion = shuffledQuestions[currentIndex];
    if (!currentQuestion || userAnswers[currentQuestion.id] !== undefined) return;

    const updatedAnswers = {
      ...userAnswers,
      [currentQuestion.id]: index,
    };
    const updatedSkipped = skippedIds.filter(id => id !== currentQuestion.id);

    setUserAnswers(updatedAnswers);
    setSkippedIds(updatedSkipped);

    const allAnswered = shuffledQuestions.every(q => updatedAnswers[q.id] !== undefined);
    saveQuizState(currentIndex, updatedAnswers, updatedSkipped, shuffledQuestions, allAnswered);
  };

  const advanceToNext = (updatedSkipped: string[] = skippedIds) => {
    if (shuffledQuestions.length === 0) return;

    // First check if all questions are answered
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount === shuffledQuestions.length) {
      setIsCompleted(true);
      saveQuizState(currentIndex, userAnswers, updatedSkipped, shuffledQuestions, true);
      return;
    }

    // Try moving to the next contiguous index in shuffledQuestions
    if (currentIndex + 1 < shuffledQuestions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      saveQuizState(nextIdx, userAnswers, updatedSkipped, shuffledQuestions, false);
      return;
    }

    // At the end of queue: find the first unanswered question
    const firstUnansweredIdx = shuffledQuestions.findIndex(
      q => userAnswers[q.id] === undefined
    );

    if (firstUnansweredIdx !== -1) {
      setCurrentIndex(firstUnansweredIdx);
      saveQuizState(firstUnansweredIdx, userAnswers, updatedSkipped, shuffledQuestions, false);
    } else {
      setIsCompleted(true);
      saveQuizState(currentIndex, userAnswers, updatedSkipped, shuffledQuestions, true);
    }
  };

  const handleNextQuestion = () => {
    advanceToNext();
  };

  const handleSkipQuestion = () => {
    const currentQuestion = shuffledQuestions[currentIndex];
    if (!currentQuestion) return;

    let updatedSkipped = skippedIds;
    if (userAnswers[currentQuestion.id] === undefined && !skippedIds.includes(currentQuestion.id)) {
      updatedSkipped = [...skippedIds, currentQuestion.id];
      setSkippedIds(updatedSkipped);
    }

    advanceToNext(updatedSkipped);
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      saveQuizState(prevIdx, userAnswers, skippedIds, shuffledQuestions, false);
    }
  };

  const handleRandomize = () => {
    if (!questions || questions.length === 0) return;

    // Separate unanswered and answered questions
    const unanswered = questions.filter(q => userAnswers[q.id] === undefined);
    const answered = questions.filter(q => userAnswers[q.id] !== undefined);

    // Perform unbiased Fisher-Yates shuffle on unanswered questions first
    const shuffledUnanswered = fisherYatesShuffle(unanswered);
    const shuffledAnswered = fisherYatesShuffle(answered);
    const newShuffled = [...shuffledUnanswered, ...shuffledAnswered];

    setShuffledQuestions(newShuffled);
    setCurrentIndex(0);
    setIsCompleted(false);

    saveQuizState(0, userAnswers, skippedIds, newShuffled, false);
  };

  const handleRestartQuiz = () => {
    if (!questions || questions.length === 0) return;

    const newShuffled = fisherYatesShuffle(questions);
    setShuffledQuestions(newShuffled);
    setCurrentIndex(0);
    setUserAnswers({});
    setSkippedIds([]);
    setIsCompleted(false);

    saveQuizState(0, {}, [], newShuffled, false);
  };

  if (!isInitialized || shuffledQuestions.length === 0) {
    return <div className={styles.quizContainer}>Loading daily challenge...</div>;
  }

  const answeredCount = Object.keys(userAnswers).length;
  const totalCount = shuffledQuestions.length;
  const correctCount = shuffledQuestions.reduce(
    (acc, q) => (userAnswers[q.id] === q.correctOptionIndex ? acc + 1 : acc),
    0
  );

  // Render Completion Summary Screen when all questions are completed
  if (isCompleted) {
    const percentage = Math.round((correctCount / totalCount) * 100);

    return (
      <div className={styles.quizContainer}>
        <div className={styles.completionCard}>
          <div className={styles.completionBadge}>🏆 Daily Challenge Summary</div>
          <h2 className={styles.completionTitle}>Great Job! You Completed the Challenge</h2>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreNumber}>{correctCount} / {totalCount}</span>
            <span className={styles.scoreLabel}>Correct Answers ({percentage}%)</span>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{correctCount}</span>
              <span className={styles.statLabel}>✅ Correct</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{totalCount - correctCount}</span>
              <span className={styles.statLabel}>❌ Incorrect</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{skippedIds.length}</span>
              <span className={styles.statLabel}>⏭️ Skipped</span>
            </div>
          </div>

          <div className={styles.completionActions}>
            <button className={styles.restartButton} onClick={handleRestartQuiz}>
              🔄 Restart Quiz
            </button>
            <button
              className={styles.reviewButton}
              onClick={() => {
                setIsCompleted(false);
                setCurrentIndex(0);
              }}
            >
              🔍 Review Answers
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentIndex];
  const selectedOptionIndex = userAnswers[currentQuestion.id] ?? null;
  const isAnswered = selectedOptionIndex !== null;
  const isCorrect = isAnswered && selectedOptionIndex === currentQuestion.correctOptionIndex;

  return (
    <div className={styles.quizContainer}>
      <div className={styles.header}>
        <span className={styles.topicBadge}>
          📅 Daily Challenge • Question {currentIndex + 1} of {totalCount} • ({answeredCount}/{totalCount} Answered)
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className={styles.shuffleButton} onClick={handleRandomize} title="Reshuffle unanswered questions with Fisher-Yates algorithm">
            🔀 Shuffle
          </button>
          {currentQuestion.difficulty && (
            <span className={`${styles.difficultyBadge} ${styles[currentQuestion.difficulty]}`}>
              {currentQuestion.difficulty === 'easy' && '🟢 Easy'}
              {currentQuestion.difficulty === 'medium' && '🟡 Medium'}
              {currentQuestion.difficulty === 'hard' && '🔴 Hard'}
            </span>
          )}
        </div>
      </div>

      <div className={styles.questionText}>{currentQuestion.questionText}</div>

      {currentQuestion.codeSnippet && (
        <div className={styles.codeSnippetContainer}>
          <CodeBlock code={currentQuestion.codeSnippet} language="java" />
        </div>
      )}

      <div className={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          let buttonClass = styles.optionButton;
          let icon = '';

          if (isAnswered) {
            if (index === currentQuestion.correctOptionIndex) {
              buttonClass = `${styles.optionButton} ${styles.correctOption}`;
              icon = '✅';
            } else if (index === selectedOptionIndex) {
              buttonClass = `${styles.optionButton} ${styles.incorrectOption}`;
              icon = '❌';
            }
          }

          return (
            <button
              key={index}
              className={buttonClass}
              onClick={() => handleOptionClick(index)}
              disabled={isAnswered}
            >
              <span>{option}</span>
              {icon && <span className={styles.icon}>{icon}</span>}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className={styles.explanationContainer}>
          <div className={styles.explanationTitle}>
            {isCorrect ? '🎉 Correct!' : '💡 Explanation'}
          </div>
          <p className={styles.explanationText}>{currentQuestion.explanation}</p>
        </div>
      )}

      <div className={styles.footer}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {currentIndex > 0 && (
            <button className={styles.skipButton} onClick={handlePrevQuestion}>
              ⬅️ Previous
            </button>
          )}
        </div>
        <div>
          {!isAnswered ? (
            <button className={styles.skipButton} onClick={handleSkipQuestion}>
              Skip Question ➡️
            </button>
          ) : (
            <button className={styles.nextButton} onClick={handleNextQuestion}>
              Next Question ⏭️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

