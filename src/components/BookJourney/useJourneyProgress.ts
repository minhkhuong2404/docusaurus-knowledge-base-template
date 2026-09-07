import { useMemo } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import type { BookJourney, ChapterJourneyDef } from '../../data/journeys/types';
import {
  computeBookProgress,
  computeChapterProgress,
  type BookProgressView,
  type ChapterProgressView,
} from './journeyProgress';

export function useBookJourneyProgress(book: BookJourney): BookProgressView {
  const { progress } = useUserProgress();
  return useMemo(
    () =>
      computeBookProgress(
        book,
        progress.readPages || [],
        progress.quizStats?.quizStates
      ),
    [book, progress.readPages, progress.quizStats?.quizStates]
  );
}

export function useChapterJourneyProgress(
  book: BookJourney,
  chapter: ChapterJourneyDef
): ChapterProgressView {
  const { progress } = useUserProgress();
  return useMemo(
    () =>
      computeChapterProgress(
        book,
        chapter,
        progress.readPages || [],
        progress.quizStats?.quizStates
      ),
    [book, chapter, progress.readPages, progress.quizStats?.quizStates]
  );
}
