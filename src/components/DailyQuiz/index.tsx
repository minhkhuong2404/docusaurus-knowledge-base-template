import React from 'react';
import DailyQuizGallery from '../DailyQuizGallery';
import { QuizCategoryKey } from '../../services/googleSheetQuizService';

interface DailyQuizProps {
  quizKey?: string;
  category?: QuizCategoryKey;
  initialViewMode?: 'gallery' | 'practice' | 'sheet';
}

export default function DailyQuiz({ quizKey = 'java', category, initialViewMode = 'gallery' }: DailyQuizProps) {
  const resolvedCategory = category || (quizKey === 'spring-boot' || quizKey === 'system-design' || quizKey === 'all' ? quizKey : 'java');
  return <DailyQuizGallery initialCategory={resolvedCategory} initialViewMode={initialViewMode} />;
}

export { default as DailyQuizGallery } from '../DailyQuizGallery';
