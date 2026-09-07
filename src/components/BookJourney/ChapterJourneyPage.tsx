import React from 'react';
import type { BookJourney, ChapterJourneyDef } from '../../data/journeys/types';
import { quizKey } from '../../data/journeys/types';
import ChapterJourneyWidget from './ChapterJourneyWidget';
import FlashcardDeck from './FlashcardDeck';
import ReflectionCard from './ReflectionCard';
import ChapterQuiz from './ChapterQuiz';
import BadgeUnlock from './BadgeUnlock';
import { useChapterJourneyProgress } from './useJourneyProgress';

interface ChapterJourneyPageProps {
  book: BookJourney;
  chapter: ChapterJourneyDef;
}

/** Full practice page: Flashcards → Summary → Review (optional) → Final (mandatory). */
export default function ChapterJourneyPage({ book, chapter }: ChapterJourneyPageProps) {
  const view = useChapterJourneyProgress(book, chapter);
  const locked = !view.postCardsReady;
  const lockedReason = 'Flip every flashcard in this chapter first to unlock this stage.';

  return (
    <>
      <ChapterJourneyWidget book={book} chapter={chapter} />
      <BadgeUnlock
        storageKey={`badge-unlock:${book.id}:${chapter.id}`}
        show={view.badgeEarned}
        icon={chapter.badgeIcon}
        title={`Badge earned: ${chapter.badgeName}`}
        subtitle={chapter.skillBlurb}
      />

      <h2 id="cards">Flashcards</h2>
      <FlashcardDeck book={book} chapter={chapter} />

      <h2 id="summary">Summary</h2>
      <ReflectionCard book={book} chapter={chapter} locked={locked} />

      <h2 id="review">Review (optional)</h2>
      <p style={{ color: 'var(--ifm-color-emphasis-700)', marginTop: 0 }}>
        Light content review — skip anytime. The badge only requires flashcards + Final Exam.
      </p>

      <h3 id="easy">Review · Easy</h3>
      <ChapterQuiz
        quizKey={quizKey(book.id, chapter.id, 'easy')}
        tier="easy"
        questions={chapter.easy}
        locked={locked}
        lockedReason={lockedReason}
      />

      <h3 id="medium">Review · Medium</h3>
      <ChapterQuiz
        quizKey={quizKey(book.id, chapter.id, 'medium')}
        tier="medium"
        questions={chapter.medium}
        locked={locked}
        lockedReason={lockedReason}
      />

      <h3 id="hard">Review · Hard</h3>
      <ChapterQuiz
        quizKey={quizKey(book.id, chapter.id, 'hard')}
        tier="hard"
        questions={chapter.hard}
        locked={locked}
        lockedReason={lockedReason}
      />

      <h2 id="final">Final exam (mandatory)</h2>
      <ChapterQuiz
        quizKey={quizKey(book.id, chapter.id, 'final')}
        tier="final"
        questions={chapter.finalExam}
        locked={locked}
        lockedReason={lockedReason}
        isFinal
      />
    </>
  );
}
