import type { QuizQuestion } from '../../components/DailyQuiz';

export type QuizTier = 'easy' | 'medium' | 'hard' | 'final';

export interface ChapterFlashcard {
  id: string;
  section: string;
  front: string;
  back: string;
  notes?: string;
}

export interface ChapterJourneyDef {
  id: string;
  number: number;
  title: string;
  /** Doc id path without leading slash, e.g. books/ocp/chapters/chapter-01 */
  docPath: string;
  badgeName: string;
  badgeIcon: string;
  skillBlurb: string;
  /** Chapter summary only (shown after all flashcards flipped) */
  reflectionSummary: string;
  /** @deprecated kept optional for older configs; UI no longer shows prompts */
  reflectionPrompts?: string[];
  flashcards: ChapterFlashcard[];
  easy: QuizQuestion[];
  medium: QuizQuestion[];
  hard: QuizQuestion[];
  finalExam: QuizQuestion[];
}

export interface BookJourney {
  id: string;
  title: string;
  shortTitle: string;
  bookIcon: string;
  skillsTrophyTitle: string;
  skillsTrophyBlurb: string;
  chapters: ChapterJourneyDef[];
}

export const JOURNEY_PASS_THRESHOLD = 0.8;

export function chapterDocHref(docPath: string): string {
  return `/${docPath}`.replace(/\/+/g, '/');
}

export function reflectKey(bookId: string, chapterId: string): string {
  return `journey:${bookId}:${chapterId}:reflect`;
}

export function cardKey(bookId: string, chapterId: string, cardId: string): string {
  return `journey:${bookId}:${chapterId}:card:${cardId}`;
}

export function quizKey(bookId: string, chapterId: string, tier: QuizTier): string {
  return `journey-${bookId}-${chapterId}-${tier}`;
}
