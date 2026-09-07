import React, { useState } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import type { BookJourney, ChapterJourneyDef } from '../../data/journeys/types';
import { cardKey } from '../../data/journeys/types';
import { useChapterJourneyProgress } from './useJourneyProgress';
import { isCardFlipped } from './journeyProgress';
import styles from './flashcards.module.css';

interface FlashcardDeckProps {
  book: BookJourney;
  chapter: ChapterJourneyDef;
}

export default function FlashcardDeck({ book, chapter }: FlashcardDeckProps) {
  const { progress, togglePageRead } = useUserProgress();
  const view = useChapterJourneyProgress(book, chapter);
  const cards = chapter.flashcards || [];
  const [index, setIndex] = useState(0);
  const [flippedUi, setFlippedUi] = useState(false);

  if (!cards.length) {
    return (
      <div className={styles.wrap}>
        <p className={styles.empty}>Flashcards for this chapter are not authored yet.</p>
      </div>
    );
  }

  const card = cards[Math.min(index, cards.length - 1)];
  const seen = isCardFlipped(book.id, chapter.id, card.id, progress.readPages || []);
  const key = cardKey(book.id, chapter.id, card.id);

  const go = (next: number) => {
    setIndex(Math.max(0, Math.min(cards.length - 1, next)));
    setFlippedUi(false);
  };

  const markSeen = async () => {
    if (!seen) await togglePageRead(key);
  };

  const onFlip = async () => {
    setFlippedUi((v) => !v);
    if (!flippedUi && !seen) await markSeen();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <span className={styles.badge}>Flashcards · Pareto core</span>
        <span className={styles.count}>
          {view.cardsFlipped}/{view.cardsTotal} flipped
        </span>
      </div>
      <p className={styles.section}>{card.section}</p>

      <button
        type="button"
        className={`${styles.card} ${flippedUi ? styles.cardBackFace : ''}`}
        onClick={onFlip}
        aria-label={flippedUi ? 'Show front' : 'Flip card'}
      >
        <div className={styles.cardInner}>
          {!flippedUi ? (
            <>
              <span className={styles.faceLabel}>Front</span>
              <p className={styles.faceText}>{card.front}</p>
              <span className={styles.tapHint}>Tap to flip</span>
            </>
          ) : (
            <>
              <span className={styles.faceLabel}>Back</span>
              <p className={styles.faceText}>{card.back}</p>
            </>
          )}
        </div>
      </button>

      {flippedUi && card.notes && (
        <div className={styles.notes}>
          <strong>Take note</strong>
          <p>{card.notes}</p>
        </div>
      )}

      <div className={styles.nav}>
        <button type="button" className={styles.navBtn} disabled={index === 0} onClick={() => go(index - 1)}>
          Previous
        </button>
        <button
          type="button"
          className={styles.navBtn}
          onClick={async () => {
            await markSeen();
            if (index < cards.length - 1) go(index + 1);
          }}
        >
          {seen ? 'Seen' : 'Mark flipped'}
        </button>
        <button
          type="button"
          className={styles.navBtnPrimary}
          disabled={index >= cards.length - 1}
          onClick={() => go(index + 1)}
        >
          Next
        </button>
      </div>

      {view.allCardsDone && (
        <p className={styles.ready}>All cards flipped — Summary, Review, and Final Exam are unlocked.</p>
      )}
    </div>
  );
}
