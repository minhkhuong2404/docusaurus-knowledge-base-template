import type { QuizQuestion } from '../../components/DailyQuiz';
import type { QuizStateItem } from '../../services/userProgressService';
import {
  BookJourney,
  ChapterJourneyDef,
  JOURNEY_PASS_THRESHOLD,
  QuizTier,
  cardKey,
  chapterDocHref,
  quizKey,
  reflectKey,
} from '../../data/journeys/types';

export type StageStatus = 'locked' | 'available' | 'done';

export interface ChapterProgressView {
  chapterId: string;
  /** Deep-dive chapter page marked read (optional; not badge gate) */
  read: boolean;
  cardsFlipped: number;
  cardsTotal: number;
  allCardsDone: boolean;
  reflected: boolean;
  easy: StageStatus;
  medium: StageStatus;
  hard: StageStatus;
  finalExam: StageStatus;
  summary: StageStatus;
  cards: StageStatus;
  finalScore: number | null;
  badgeEarned: boolean;
  stagesDone: number;
  stagesTotal: number;
  /** Summary / Review / Final unlock after all flashcards flipped */
  postCardsReady: boolean;
}

export interface BookProgressView {
  badgesEarned: number;
  badgesTotal: number;
  bookComplete: boolean;
  chapters: ChapterProgressView[];
}

function scoreQuiz(
  questions: QuizQuestion[],
  state: QuizStateItem | undefined
): { completed: boolean; score: number } {
  if (!questions.length) {
    return { completed: false, score: 0 };
  }
  const answers = state?.userAnswers || {};
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  if (!allAnswered && !state?.isCompleted) {
    return { completed: false, score: 0 };
  }
  let correct = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctOptionIndex) correct += 1;
  }
  const denom = questions.length || 1;
  return { completed: allAnswered || !!state?.isCompleted, score: correct / denom };
}

function tierDone(
  questions: QuizQuestion[],
  state: QuizStateItem | undefined
): boolean {
  if (!questions.length) return false;
  const { completed } = scoreQuiz(questions, state);
  return completed;
}

export function isCardFlipped(
  bookId: string,
  chapterId: string,
  cardId: string,
  readPages: string[]
): boolean {
  return readPages.includes(cardKey(bookId, chapterId, cardId));
}

export function computeChapterProgress(
  book: BookJourney,
  chapter: ChapterJourneyDef,
  readPages: string[],
  quizStates: Record<string, QuizStateItem> | undefined
): ChapterProgressView {
  const href = chapterDocHref(chapter.docPath);
  const read =
    readPages.includes(href) ||
    readPages.includes(href + '/') ||
    readPages.some((p) => p.replace(/\/$/, '') === href);

  const flashcards = chapter.flashcards || [];
  const cardsTotal = flashcards.length;
  const cardsFlipped = flashcards.filter((c) =>
    isCardFlipped(book.id, chapter.id, c.id, readPages)
  ).length;
  // No cards authored yet → treat as done so later stages aren't permanently locked
  const allCardsDone = cardsTotal === 0 || cardsFlipped === cardsTotal;

  const reflected = readPages.includes(reflectKey(book.id, chapter.id));

  const easyState = quizStates?.[quizKey(book.id, chapter.id, 'easy')];
  const mediumState = quizStates?.[quizKey(book.id, chapter.id, 'medium')];
  const hardState = quizStates?.[quizKey(book.id, chapter.id, 'hard')];
  const finalState = quizStates?.[quizKey(book.id, chapter.id, 'final')];

  const easyComplete = tierDone(chapter.easy, easyState);
  const mediumComplete = tierDone(chapter.medium, mediumState);
  const hardComplete = tierDone(chapter.hard, hardState);

  const finalResult = scoreQuiz(chapter.finalExam, finalState);
  const finalPassed =
    finalResult.completed && finalResult.score >= JOURNEY_PASS_THRESHOLD;

  const postCardsReady = allCardsDone;

  const status = (complete: boolean, availableWhen: boolean): StageStatus => {
    if (complete) return 'done';
    if (availableWhen) return 'available';
    return 'locked';
  };

  const cardsStage: StageStatus =
    cardsTotal === 0 ? 'done' : allCardsDone ? 'done' : 'available';

  const summary = status(reflected, postCardsReady);
  const easy = status(easyComplete, postCardsReady && chapter.easy.length > 0);
  const medium = status(mediumComplete, postCardsReady && chapter.medium.length > 0);
  const hard = status(hardComplete, postCardsReady && chapter.hard.length > 0);
  const finalExam = status(finalPassed, postCardsReady && chapter.finalExam.length > 0);

  const badgeEarned = allCardsDone && finalPassed;

  // Core stages: cards, summary, final (+ optional reviews counted if present)
  let stagesDone = 0;
  let stagesTotal = 3; // cards, summary, final
  if (allCardsDone) stagesDone += 1;
  if (reflected) stagesDone += 1;
  if (finalPassed) stagesDone += 1;
  if (chapter.easy.length || chapter.medium.length || chapter.hard.length) {
    stagesTotal += 1;
    if (easyComplete || mediumComplete || hardComplete) stagesDone += 1;
  }

  return {
    chapterId: chapter.id,
    read,
    cardsFlipped,
    cardsTotal,
    allCardsDone,
    reflected,
    easy,
    medium,
    hard,
    finalExam,
    summary,
    cards: cardsStage,
    finalScore: finalResult.completed ? finalResult.score : null,
    badgeEarned,
    stagesDone,
    stagesTotal,
    postCardsReady,
  };
}

export function computeBookProgress(
  book: BookJourney,
  readPages: string[],
  quizStates: Record<string, QuizStateItem> | undefined
): BookProgressView {
  const chapters = book.chapters.map((c) =>
    computeChapterProgress(book, c, readPages, quizStates)
  );
  const badgesEarned = chapters.filter((c) => c.badgeEarned).length;
  const badgesTotal = book.chapters.length;
  return {
    badgesEarned,
    badgesTotal,
    bookComplete: badgesEarned === badgesTotal && badgesTotal > 0,
    chapters,
  };
}

export function quizQuestionsForTier(
  chapter: ChapterJourneyDef,
  tier: QuizTier
): QuizQuestion[] {
  switch (tier) {
    case 'easy':
      return chapter.easy;
    case 'medium':
      return chapter.medium;
    case 'hard':
      return chapter.hard;
    case 'final':
      return chapter.finalExam;
  }
}
