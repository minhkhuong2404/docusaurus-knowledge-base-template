import React, { useState, useEffect } from 'react';
import { javaQuestions, QuizQuestion } from '../../data/java-quiz-questions';
import styles from './styles.module.css';
import { useColorMode } from '@docusaurus/theme-common';

export default function DailyJavaQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isDaily, setIsDaily] = useState<boolean>(true);
  
  // To handle hydration mismatch in Docusaurus, we set the initial question in useEffect
  useEffect(() => {
    loadDailyQuestion();
  }, []);

  const loadDailyQuestion = () => {
    // Generate a deterministic index based on today's date
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % javaQuestions.length;
    setCurrentQuestion(javaQuestions[index]);
    setSelectedOptionIndex(null);
    setIsDaily(true);
  };

  const loadRandomQuestion = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * javaQuestions.length);
    } while (currentQuestion && nextIndex === javaQuestions.findIndex(q => q.id === currentQuestion.id) && javaQuestions.length > 1);
    
    setCurrentQuestion(javaQuestions[nextIndex]);
    setSelectedOptionIndex(null);
    setIsDaily(false);
  };

  const handleOptionClick = (index: number) => {
    if (selectedOptionIndex !== null) return; // Prevent changing answer
    setSelectedOptionIndex(index);
  };

  if (!currentQuestion) {
    return <div className={styles.quizContainer}>Loading question...</div>;
  }

  const isAnswered = selectedOptionIndex !== null;
  const isCorrect = selectedOptionIndex === currentQuestion.correctOptionIndex;

  return (
    <div className={styles.quizContainer}>
      <div className={styles.header}>
        <span className={styles.topicBadge}>
          {isDaily ? '📅 Daily Challenge' : '🎲 Practice Mode'} • {currentQuestion.topic}
        </span>
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
          <button className={styles.nextButton} onClick={loadRandomQuestion}>
            Next Random Question ⏭️
          </button>
        </div>
      )}
    </div>
  );
}
