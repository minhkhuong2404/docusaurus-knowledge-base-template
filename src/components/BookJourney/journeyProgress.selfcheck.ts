/**
 * Self-check for journey progress gating (no test framework).
 * Run: npx --yes tsx src/components/BookJourney/journeyProgress.selfcheck.ts
 */
import assert from 'node:assert/strict';
import type { BookJourney, ChapterJourneyDef } from '../../data/journeys/types';
import { JOURNEY_PASS_THRESHOLD, cardKey } from '../../data/journeys/types';
import { computeChapterProgress, computeBookProgress } from './journeyProgress';
import type { QuizQuestion } from '../DailyQuiz';

function q(id: string, correct: number): QuizQuestion {
  return {
    id,
    topic: 't',
    questionText: id,
    options: ['a', 'b', 'c', 'd'],
    correctOptionIndex: correct,
    explanation: 'e',
  };
}

const chapter: ChapterJourneyDef = {
  id: 'ch01',
  number: 1,
  title: 'Test',
  docPath: 'books/ocp/chapters/chapter-01',
  badgeName: 'Test Badge',
  badgeIcon: '🧱',
  skillBlurb: 'skill',
  reflectionSummary: 'sum',
  flashcards: [
    { id: 'c1', section: 'S1', front: 'f1', back: 'b1', notes: 'n1' },
    { id: 'c2', section: 'S2', front: 'f2', back: 'b2' },
  ],
  easy: [q('e1', 0)],
  medium: [q('m1', 1)],
  hard: [q('h1', 2)],
  finalExam: [q('f1', 0), q('f2', 1), q('f3', 2), q('f4', 3), q('f5', 0)],
};

const book: BookJourney = {
  id: 'ocp',
  title: 'OCP',
  shortTitle: 'OCP',
  bookIcon: '☕',
  skillsTrophyTitle: 'Trophy',
  skillsTrophyBlurb: 'done',
  chapters: [chapter],
};

const finalPass = {
  'journey-ocp-ch01-final': {
    date: 'x',
    totalQuestions: 5,
    answeredQuestionIds: ['f1', 'f2', 'f3', 'f4', 'f5'],
    userAnswers: { f1: 0, f2: 1, f3: 2, f4: 3, f5: 1 }, // 4/5 = 80%
    skippedIds: [],
    shuffledIds: ['f1', 'f2', 'f3', 'f4', 'f5'],
    currentIndex: 0,
    isCompleted: true,
  },
};

// Without cards flipped → later stages locked
{
  const p = computeChapterProgress(book, chapter, [], {});
  assert.equal(p.allCardsDone, false);
  assert.equal(p.postCardsReady, false);
  assert.equal(p.summary, 'locked');
  assert.equal(p.easy, 'locked');
  assert.equal(p.finalExam, 'locked');
  assert.equal(p.badgeEarned, false);
}

// Partial cards → still locked
{
  const pages = [cardKey('ocp', 'ch01', 'c1')];
  const p = computeChapterProgress(book, chapter, pages, {});
  assert.equal(p.cardsFlipped, 1);
  assert.equal(p.allCardsDone, false);
  assert.equal(p.finalExam, 'locked');
}

// All cards flipped → summary/review/final available; no badge yet
{
  const pages = [cardKey('ocp', 'ch01', 'c1'), cardKey('ocp', 'ch01', 'c2')];
  const p = computeChapterProgress(book, chapter, pages, {});
  assert.equal(p.allCardsDone, true);
  assert.equal(p.postCardsReady, true);
  assert.equal(p.summary, 'available');
  assert.equal(p.easy, 'available');
  assert.equal(p.finalExam, 'available');
  assert.equal(p.badgeEarned, false);
}

// Cards + final pass → badge (read page not required)
{
  const pages = [cardKey('ocp', 'ch01', 'c1'), cardKey('ocp', 'ch01', 'c2')];
  const p = computeChapterProgress(book, chapter, pages, finalPass);
  assert.equal(p.finalScore, 0.8);
  assert.ok(p.finalScore! >= JOURNEY_PASS_THRESHOLD);
  assert.equal(p.badgeEarned, true);

  const bookView = computeBookProgress(book, pages, finalPass);
  assert.equal(bookView.badgesEarned, 1);
  assert.equal(bookView.bookComplete, true);
}

console.log('journeyProgress.selfcheck: OK');
