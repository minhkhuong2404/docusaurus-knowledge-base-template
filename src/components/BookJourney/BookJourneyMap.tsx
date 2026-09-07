import React from 'react';
import Link from '@docusaurus/Link';
import type { BookJourney } from '../../data/journeys/types';
import { useBookJourneyProgress } from './useJourneyProgress';
import styles from './journeyChrome.module.css';

interface BookJourneyMapProps {
  book: BookJourney;
  /** Optional per-chapter practice links: chapterId → href */
  practiceLinks?: Record<string, string>;
}

export default function BookJourneyMap({ book, practiceLinks = {} }: BookJourneyMapProps) {
  const view = useBookJourneyProgress(book);

  return (
    <div className={styles.map}>
      <div className={styles.mapHeader}>
        <div>
          <h2 className={styles.mapTitle}>
            {book.bookIcon} {book.shortTitle} Journey
          </h2>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--ifm-color-emphasis-700)' }}>
            Flip all flashcards, then pass the Final Exam (≥80%) for a chapter badge. Collect every
            badge to unlock the book skill.
          </p>
        </div>
        <div className={styles.mapStats}>
          {view.badgesEarned} / {view.badgesTotal} badges
        </div>
      </div>

      <div className={styles.nodes}>
        {book.chapters.map((chapter) => {
          const cp = view.chapters.find((c) => c.chapterId === chapter.id)!;
          const href =
            practiceLinks[chapter.id] ||
            (chapter.finalExam.length
              ? `/books/ocp/practice/${chapter.docPath.split('/').pop()}`
              : `/${chapter.docPath}`);
          const nodeClass = cp.badgeEarned
            ? styles.nodeLit
            : cp.stagesDone > 0
              ? styles.nodePartial
              : styles.nodeIdle;

          return (
            <Link key={chapter.id} to={href} className={`${styles.node} ${nodeClass}`}>
              <span className={styles.nodeNum}>Ch {chapter.number}</span>
              <span className={styles.nodeName}>
                {chapter.badgeIcon} {chapter.title}
              </span>
              <span className={styles.nodeBadge}>
                {cp.badgeEarned
                  ? `Badge: ${chapter.badgeName}`
                  : chapter.flashcards?.length
                    ? `Cards ${cp.cardsFlipped}/${cp.cardsTotal}`
                    : chapter.finalExam.length
                      ? `${cp.stagesDone}/${cp.stagesTotal} stages`
                      : 'Reading · practice soon'}
              </span>
            </Link>
          );
        })}
      </div>

      {view.bookComplete ? (
        <div className={styles.trophy}>
          <strong>
            {book.bookIcon} {book.skillsTrophyTitle}
          </strong>
          <p style={{ margin: '0.45rem 0 0' }}>{book.skillsTrophyBlurb}</p>
          <ul className={styles.skillsList}>
            {book.chapters.map((c) => (
              <li key={c.id}>
                <strong>{c.badgeName}:</strong> {c.skillBlurb}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={styles.trophyLocked}>
          Book skill locked — earn all {view.badgesTotal} chapter badges to unlock{' '}
          <strong>{book.skillsTrophyTitle}</strong>.
        </div>
      )}
    </div>
  );
}
