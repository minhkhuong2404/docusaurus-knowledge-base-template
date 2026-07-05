import React from 'react';
import DailyQuiz from '../DailyQuiz';
import { systemDesignQuestions } from '../../data/system-design-quiz-questions';

export default function DailySystemDesignQuiz() {
  return <DailyQuiz questions={systemDesignQuestions} quizKey="system-design" />;
}
