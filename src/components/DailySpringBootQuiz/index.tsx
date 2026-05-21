import React from 'react';
import DailyQuiz from '../DailyQuiz';
import { springBootQuestions } from '../../data/spring-boot-quiz-questions';

export default function DailySpringBootQuiz() {
  return <DailyQuiz questions={springBootQuestions} quizKey="spring-boot" />;
}
