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

import { useUserProgress } from '../../context/UserProgressContext';
import { QuizStateItem } from '../../services/userProgressService';

export default function DailyQuiz({ questions, quizKey }: DailyQuizProps) {
  const { progress, saveQuiz, isLoading: isProgressLoading } = useUserProgress();

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
    completed: boolean = false,
    answeredDelta: number = 0,
    correctDelta: number = 0
  ) => {
    const today = new Date().toDateString();
    const answeredQuestionIds = Object.keys(answers);
    const stateItem: QuizStateItem = {
      date: today,
      totalQuestions: questions.length,
      answeredQuestionIds,
      userAnswers: answers,
      skippedIds: skipped,
      shuffledIds: questionsList.map(q => q.id),
      currentIndex: idx,
      isCompleted: completed,
    };
    saveQuiz(quizKey, stateItem, answeredDelta, correctDelta);
  };

  const savedState = progress.quizStats?.quizStates?.[quizKey];
  const savedStateSerialized = savedState ? JSON.stringify(savedState) : '';

  // Reset initialization when quizKey changes
  useEffect(() => {
    setIsInitialized(false);
  }, [quizKey]);

  useEffect(() => {
    if (isProgressLoading || !questions || questions.length === 0) return;
    if (isInitialized) return;

    const existingAnswers = savedState?.userAnswers || {};
    const existingSkipped = savedState?.skippedIds || [];

    // Filter out answered questions completely to ensure they are NEVER shown again
    const unanswered = questions.filter((q) => existingAnswers[q.id] === undefined);
    const shuffledUnanswered = fisherYatesShuffle(unanswered);
    const completedState = unanswered.length === 0 && questions.length > 0;

    setShuffledQuestions(shuffledUnanswered);
    setCurrentIndex(0);
    setUserAnswers(existingAnswers);
    setSkippedIds(existingSkipped);
    setIsCompleted(completedState);
    setIsInitialized(true);
  }, [questions, quizKey, isProgressLoading, savedStateSerialized, isInitialized]);

  // Sync userAnswers when Firestore finishes loading saved progress over network
  useEffect(() => {
    if (!savedState?.userAnswers) return;
    const firestoreAnswers = savedState.userAnswers;
    const firestoreAnswerCount = Object.keys(firestoreAnswers).length;
    const localAnswerCount = Object.keys(userAnswers).length;

    if (firestoreAnswerCount > localAnswerCount) {
      setUserAnswers(firestoreAnswers);
      // Filter out newly fetched answered questions from active queue
      setShuffledQuestions((prev) => prev.filter((q) => firestoreAnswers[q.id] === undefined));
    }
  }, [savedStateSerialized]);

  const handleOptionClick = (index: number) => {
    const currentQuestion = shuffledQuestions[currentIndex];
    if (!currentQuestion || userAnswers[currentQuestion.id] !== undefined) return;

    const isCorrect = index === currentQuestion.correctOptionIndex;
    const updatedAnswers = {
      ...userAnswers,
      [currentQuestion.id]: index,
    };
    const updatedSkipped = skippedIds.filter(id => id !== currentQuestion.id);

    setUserAnswers(updatedAnswers);
    setSkippedIds(updatedSkipped);

    saveQuizState(
      currentIndex,
      updatedAnswers,
      updatedSkipped,
      shuffledQuestions,
      false,
      1, // answeredDelta
      isCorrect ? 1 : 0 // correctDelta
    );
  };

  const advanceToNext = (updatedSkipped: string[] = skippedIds) => {
    if (shuffledQuestions.length === 0) return;

    // Filter out answered questions from remaining queue
    const remainingUnanswered = shuffledQuestions.filter((q) => userAnswers[q.id] === undefined);

    if (remainingUnanswered.length === 0) {
      setIsCompleted(true);
      saveQuizState(currentIndex, userAnswers, updatedSkipped, shuffledQuestions, true);
      return;
    }

    setShuffledQuestions(remainingUnanswered);
    const nextIdx = Math.min(currentIndex, remainingUnanswered.length - 1);
    setCurrentIndex(nextIdx);
    saveQuizState(nextIdx, userAnswers, updatedSkipped, remainingUnanswered, false);
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

    const unanswered = questions.filter(q => userAnswers[q.id] === undefined);
    const newShuffled = fisherYatesShuffle(unanswered);

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

  if (!isInitialized || (shuffledQuestions.length === 0 && !isCompleted)) {
    return <div className={styles.quizContainer}>Loading daily challenge...</div>;
  }

  const answeredCount = Object.keys(userAnswers).length;
  const totalCapacity = Math.max(500, questions.length);
  const remainingCount = shuffledQuestions.length;
  const correctCount = Object.entries(userAnswers).reduce((acc, [qId, ansIdx]) => {
    const q = questions.find(item => item.id === qId);
    return q && ansIdx === q.correctOptionIndex ? acc + 1 : acc;
  }, 0);

  // Render Completion Summary Screen when all questions are completed
  if (isCompleted) {
    const percentage = totalCapacity > 0 ? Math.round((correctCount / totalCapacity) * 100) : 0;

    return (
      <div className={styles.quizContainer}>
        <div className={styles.completionCard}>
          <div className={styles.completionBadge}>🏆 Daily Challenge Summary</div>
          <h2 className={styles.completionTitle}>Great Job! You Completed All Questions</h2>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreNumber}>{correctCount} / {answeredCount}</span>
            <span className={styles.scoreLabel}>Correct Answers ({percentage}%)</span>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{correctCount}</span>
              <span className={styles.statLabel}>✅ Correct</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{answeredCount - correctCount}</span>
              <span className={styles.statLabel}>❌ Incorrect</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{skippedIds.length}</span>
              <span className={styles.statLabel}>⏭️ Skipped</span>
            </div>
          </div>

          <div className={styles.completionActions}>
            <button className={styles.restartButton} onClick={handleRestartQuiz}>
              🔄 Reset & Restart Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentIndex];
  const selectedOptionIndex = currentQuestion ? userAnswers[currentQuestion.id] ?? null : null;
  const isAnswered = selectedOptionIndex !== null;
  const isCorrect = isAnswered && currentQuestion && selectedOptionIndex === currentQuestion.correctOptionIndex;

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className={styles.quizContainer}>
      <div className={styles.header}>
        <span className={styles.topicBadge}>
          📅 Daily Challenge • Question #{answeredCount + Math.min(currentIndex + 1, remainingCount)} of {totalCapacity} • ({answeredCount}/{totalCapacity} Answered)
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
            {isCorrect ? '🎉 Correct!' : '💡 Explanation & Correct Answer'}
          </div>
          <p className={styles.explanationText}>
            {!isCorrect && (
              <strong style={{ display: 'block', color: '#4ade80', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                ✅ Correct Answer: {currentQuestion.options[currentQuestion.correctOptionIndex]}
              </strong>
            )}
            {currentQuestion.explanation}
          </p>
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

