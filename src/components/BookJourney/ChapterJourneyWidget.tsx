import React from 'react';
import Link from '@docusaurus/Link';
import type { BookJourney, ChapterJourneyDef } from '../../data/journeys/types';
import { chapterDocHref } from '../../data/journeys/types';
import { useChapterJourneyProgress } from './useJourneyProgress';
import type { StageStatus } from './journeyProgress';
import styles from './journeyChrome.module.css';

function StagePill({
  label,
  status,
  href,
}: {
  label: string;
  status: StageStatus | boolean;
  href?: string;
}) {
  const mapped: StageStatus =
    typeof status === 'boolean' ? (status ? 'done' : 'available') : status;
  const className =
    mapped === 'done'
      ? styles.pillDone
      : mapped === 'available'
        ? styles.pillOpen
        : styles.pillLocked;
  const inner = (
    <span className={`${styles.pill} ${className}`}>
      {mapped === 'done' ? '✓ ' : mapped === 'locked' ? '· ' : '○ '}
      {label}
    </span>
  );
  return href && mapped !== 'locked' ? <Link to={href}>{inner}</Link> : inner;
}

interface ChapterJourneyWidgetProps {
  book: BookJourney;
  chapter: ChapterJourneyDef;
}

export default function ChapterJourneyWidget({ book, chapter }: ChapterJourneyWidgetProps) {
  const view = useChapterJourneyProgress(book, chapter);
  const readHref = chapterDocHref(chapter.docPath);

  return (
    <div className={styles.widget}>
      <div className={styles.widgetTop}>
        <div>
          <div className={styles.widgetEyebrow}>
            Chapter {chapter.number} · {book.shortTitle}
          </div>
          <h2 className={styles.widgetTitle}>
            {chapter.badgeIcon} {chapter.title}
          </h2>
        </div>
        <div className={styles.widgetMeta}>
          <span>
            {view.stagesDone}/{view.stagesTotal} stages
          </span>
          {view.badgeEarned ? (
            <span className={styles.badgeChip}>Badge earned</span>
          ) : (
            <span className={styles.badgeChipMuted}>Badge locked</span>
          )}
        </div>
      </div>
      <div className={styles.pillRow}>
        <StagePill label="Cards" status={view.cards} href="#cards" />
        <StagePill label="Summary" status={view.summary} href="#summary" />
        <StagePill label="Review" status={view.easy} href="#review" />
        <StagePill label="Final" status={view.finalExam} href="#final" />
      </div>
      <p className={styles.hint}>
        Flip all flashcards (Pareto core + take notes) → Summary → optional Review → mandatory Final
        Exam (≥80%) for the badge. Deep-dive reading is optional:{' '}
        <Link to={readHref}>Chapter {chapter.number} notes</Link>.
      </p>
      {!view.allCardsDone && (
        <p className={styles.cta}>
          Start with the flashcards below — Summary and Final unlock after every card is flipped (
          {view.cardsFlipped}/{view.cardsTotal}).
        </p>
      )}
    </div>
  );
}
