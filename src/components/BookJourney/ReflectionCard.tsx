import React from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import type { BookJourney, ChapterJourneyDef } from '../../data/journeys/types';
import { reflectKey } from '../../data/journeys/types';
import { useChapterJourneyProgress } from './useJourneyProgress';
import styles from './styles.module.css';

interface ReflectionCardProps {
  book: BookJourney;
  chapter: ChapterJourneyDef;
  locked?: boolean;
}

export default function ReflectionCard({ book, chapter, locked = false }: ReflectionCardProps) {
  const { togglePageRead } = useUserProgress();
  const view = useChapterJourneyProgress(book, chapter);
  const key = reflectKey(book.id, chapter.id);

  if (locked) {
    return (
      <div className={styles.wrap}>
        <div className={styles.lockedNote}>Flip all flashcards first to unlock the chapter summary.</div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.tierBadge}>Summary</span>
        {view.reflected && <span className={styles.progress}>Done</span>}
      </div>
      <p style={{ marginTop: 0, lineHeight: 1.55 }}>{chapter.reflectionSummary}</p>
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={() => togglePageRead(key)}
        style={{
          background: view.reflected ? 'rgba(34, 197, 94, 0.2)' : undefined,
          color: view.reflected ? '#16a34a' : undefined,
          border: view.reflected ? '1px solid #22c55e' : undefined,
        }}
      >
        {view.reflected ? 'Summary marked — tap to undo' : 'I’ve read the summary'}
      </button>
    </div>
  );
}
