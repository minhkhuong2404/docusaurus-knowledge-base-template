import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

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
  answeredOption: number | null;
}

function shuffleArray<T>(array: T[], seed: string): T[] {
  const shuffled = [...array];
  let seedNum = 0;
  for (let i = 0; i < seed.length; i++) {
    seedNum = seed.charCodeAt(i) + ((seedNum << 5) - seedNum);
  }
  
  // Mulberry32 generator
  const random = () => {
    let t = seedNum += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

export default function DailyQuiz({ questions, quizKey }: DailyQuizProps) {
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (!questions || questions.length === 0) return;
    
    const today = new Date().toDateString();
    const storageKey = `quiz-state-${quizKey}`;
    const savedStateStr = localStorage.getItem(storageKey);
    
    let state: LocalQuizState | null = null;
    if (savedStateStr) {
      try {
        const parsed = JSON.parse(savedStateStr);
        if (parsed.date === today && parsed.shuffledIds && parsed.shuffledIds.length === questions.length) {
          state = parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    
    if (!state) {
      const shuffled = shuffleArray(questions, `${today}-${quizKey}`);
      state = {
        date: today,
        shuffledIds: shuffled.map(q => q.id),
        currentIndex: 0,
        answeredOption: null,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
    
    const questionMap = new Map(questions.map(q => [q.id, q]));
    const mapped = state.shuffledIds.map(id => questionMap.get(id)).filter((q): q is QuizQuestion => !!q);
    
    setShuffledQuestions(mapped);
    setCurrentIndex(state.currentIndex);
    setSelectedOptionIndex(state.answeredOption);
    setIsAnswered(state.answeredOption !== null);
    setIsInitialized(true);
  }, [questions, quizKey]);

  const handleOptionClick = (index: number) => {
    if (selectedOptionIndex !== null || shuffledQuestions.length === 0) return;
    setSelectedOptionIndex(index);
    setIsAnswered(true);
    
    const today = new Date().toDateString();
    const storageKey = `quiz-state-${quizKey}`;
    const state: LocalQuizState = {
      date: today,
      shuffledIds: shuffledQuestions.map(q => q.id),
      currentIndex: currentIndex,
      answeredOption: index,
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const handleNextQuestion = () => {
    if (shuffledQuestions.length === 0) return;
    const nextIndex = (currentIndex + 1) % shuffledQuestions.length;
    setCurrentIndex(nextIndex);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    
    const today = new Date().toDateString();
    const storageKey = `quiz-state-${quizKey}`;
    const state: LocalQuizState = {
      date: today,
      shuffledIds: shuffledQuestions.map(q => q.id),
      currentIndex: nextIndex,
      answeredOption: null,
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  if (!isInitialized || shuffledQuestions.length === 0) {
    return <div className={styles.quizContainer}>Loading daily challenge...</div>;
  }

  const currentQuestion = shuffledQuestions[currentIndex];
  const isCorrect = selectedOptionIndex === currentQuestion.correctOptionIndex;

  return (
    <div className={styles.quizContainer}>
      <div className={styles.header}>
        <span className={styles.topicBadge}>
          📅 Daily Challenge • Question {currentIndex + 1} of {shuffledQuestions.length} • {currentQuestion.topic}
        </span>
        {currentQuestion.difficulty && (
          <span className={`${styles.difficultyBadge} ${styles[currentQuestion.difficulty]}`}>
            {currentQuestion.difficulty === 'easy' && '🟢 Easy'}
            {currentQuestion.difficulty === 'medium' && '🟡 Medium'}
            {currentQuestion.difficulty === 'hard' && '🔴 Hard'}
          </span>
        )}
      </div>

      <div className={styles.questionText}>
        {currentQuestion.questionText}
      </div>

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
          <p className={styles.explanationText}>
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {isAnswered && (
        <div className={styles.footer}>
          <button className={styles.nextButton} onClick={handleNextQuestion}>
            Next Question ⏭️
          </button>
        </div>
      )}
    </div>
  );
}
