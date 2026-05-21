import React from 'react';
import DailyQuiz from '../DailyQuiz';
import { javaQuestions } from '../../data/java-quiz-questions';

export default function DailyJavaQuiz() {
  return <DailyQuiz questions={javaQuestions} quizKey="java" />;
}
