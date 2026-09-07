import React, { useEffect, useState } from 'react';
import CodeBlock from '../CodeBlock';
import { useUserProgress } from '../../context/UserProgressContext';
import type { QuizStateItem } from '../../services/userProgressService';
import type { QuizQuestion } from '../DailyQuiz';
import {
  JOURNEY_PASS_THRESHOLD,
  type QuizTier,
} from '../../data/journeys/types';
import styles from './styles.module.css';

const TIER_LABEL: Record<QuizTier, string> = {
  easy: 'Review · Easy',
  medium: 'Review · Medium',
  hard: 'Review · Hard',
  final: 'Final Exam',
};

interface ChapterQuizProps {
  quizKey: string;
  tier: QuizTier;
  questions: QuizQuestion[];
  locked?: boolean;
  lockedReason?: string;
  /** When true, show pass/fail against JOURNEY_PASS_THRESHOLD */
  isFinal?: boolean;
}

export default function ChapterQuiz({
  quizKey,
  tier,
  questions,
  locked = false,
  lockedReason,
  isFinal = false,
}: ChapterQuizProps) {
  const { progress, saveQuiz, isLoading } = useUserProgress();
  const saved = progress.quizStats?.quizStates?.[quizKey];

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    const existing = saved?.userAnswers || {};
    setAnswers(existing);
    const allDone =
      questions.length > 0 &&
      questions.every((q) => existing[q.id] !== undefined);
    setCompleted(allDone || !!saved?.isCompleted);
    const firstUnanswered = questions.findIndex((q) => existing[q.id] === undefined);
    setIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
    setReady(true);
  }, [quizKey, isLoading, saved, questions]);

  const persist = (
    nextAnswers: Record<string, number>,
    nextIndex: number,
    done: boolean,
    answeredDelta = 0,
    correctDelta = 0
  ) => {
    const state: QuizStateItem = {
      date: new Date().toDateString(),
      totalQuestions: questions.length,
      answeredQuestionIds: Object.keys(nextAnswers),
      userAnswers: nextAnswers,
      skippedIds: [],
      shuffledIds: questions.map((q) => q.id),
      currentIndex: nextIndex,
      isCompleted: done,
    };
    saveQuiz(quizKey, state, answeredDelta, correctDelta);
  };

  if (!questions.length) {
    return (
      <div className={styles.wrap}>
        <p className={styles.emptyNote}>
          Practice questions for this tier are not authored yet. Reading still counts toward the
          journey; quizzes will unlock when the bank is filled.
        </p>
      </div>
    );
  }

  if (locked) {
    return (
      <div className={styles.wrap}>
        <div className={styles.lockedNote}>
          {lockedReason || 'Mark the chapter as read to unlock practice.'}
        </div>
      </div>
    );
  }

  if (!ready) {
    return <div className={styles.wrap}>Loading practice…</div>;
  }

  const correctCount = questions.reduce((acc, q) => {
    return answers[q.id] === q.correctOptionIndex ? acc + 1 : acc;
  }, 0);
  const score = questions.length ? correctCount / questions.length : 0;
  const passed = score >= JOURNEY_PASS_THRESHOLD;

  if (completed) {
    return (
      <div className={`${styles.wrap} ${styles.pulse}`}>
        <div className={styles.results}>
          <div className={styles.tierBadge}>
            {isFinal ? `${TIER_LABEL[tier]} result` : `${TIER_LABEL[tier]} complete`}
          </div>
          <h3 style={{ margin: '0.75rem 0 0.25rem' }}>
            {isFinal
              ? passed
                ? 'Final exam passed'
                : 'Final exam — try again'
              : 'Review complete'}
          </h3>
          <div className={`${styles.scoreRing} ${isFinal ? (passed ? styles.pass : styles.fail) : styles.pass}`}>
            {Math.round(score * 100)}%
          </div>
          <p style={{ margin: '0 0 1rem', color: 'var(--ifm-color-emphasis-700)' }}>
            {correctCount} / {questions.length} correct
            {isFinal ? ` · need ${Math.round(JOURNEY_PASS_THRESHOLD * 100)}% to earn the badge` : ''}
          </p>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              setAnswers({});
              setIndex(0);
              setCompleted(false);
              persist({}, 0, false);
            }}
          >
            Retake
          </button>
        </div>

        <div className={styles.answerReview}>
          <h4 className={styles.answerReviewTitle}>Answer review — explanations</h4>
          {questions.map((q, i) => {
            const picked = answers[q.id];
            const ok = picked === q.correctOptionIndex;
            return (
              <div key={q.id} className={`${styles.reviewItem} ${ok ? styles.reviewOk : styles.reviewBad}`}>
                <div className={styles.reviewQ}>
                  <strong>Q{i + 1}.</strong> {q.questionText}
                </div>
                {q.codeSnippet && (
                  <div style={{ margin: '0.5rem 0' }}>
                    <CodeBlock code={q.codeSnippet} language="java" />
                  </div>
                )}
                <div className={styles.reviewAns}>
                  <span>
                    Your answer:{' '}
                    {picked === undefined ? '—' : q.options[picked]}
                  </span>
                  {!ok && (
                    <span className={styles.reviewCorrect}>
                      Correct: {q.options[q.correctOptionIndex]}
                    </span>
                  )}
                </div>
                <div className={styles.reviewExplain}>
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const current = questions[index];
  const selected = answers[current.id];
  const isAnswered = selected !== undefined;
  const isCorrect = isAnswered && selected === current.correctOptionIndex;

  const onPick = (opt: number) => {
    if (isAnswered) return;
    const next = { ...answers, [current.id]: opt };
    setAnswers(next);
    persist(next, index, false, 1, opt === current.correctOptionIndex ? 1 : 0);
  };

  const onNext = () => {
    if (index >= questions.length - 1) {
      setCompleted(true);
      persist(answers, index, true);
      return;
    }
    const nextIdx = index + 1;
    setIndex(nextIdx);
    persist(answers, nextIdx, false);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.tierBadge}>
          {TIER_LABEL[tier]} · Q{index + 1}/{questions.length}
        </span>
        <span className={styles.progress}>{Object.keys(answers).length} answered</span>
      </div>
      <p className={styles.question}>{current.questionText}</p>
      {current.codeSnippet && (
        <div style={{ marginBottom: '1rem' }}>
          <CodeBlock code={current.codeSnippet} language="java" />
        </div>
      )}
      <div className={styles.options}>
        {current.options.map((opt, i) => {
          let cls = styles.option;
          if (isAnswered) {
            if (i === current.correctOptionIndex) cls = `${styles.option} ${styles.correct}`;
            else if (i === selected) cls = `${styles.option} ${styles.incorrect}`;
          }
          return (
            <button key={i} type="button" className={cls} onClick={() => onPick(i)} disabled={isAnswered}>
              {opt}
            </button>
          );
        })}
      </div>
      {isAnswered && (
        <div className={styles.explain}>
          <strong>{isCorrect ? 'Correct' : 'Not quite'} — </strong>
          {current.explanation}
        </div>
      )}
      <div className={styles.footer}>
        {isAnswered && (
          <button type="button" className={styles.nextBtn} onClick={onNext}>
            {index >= questions.length - 1 ? 'See results' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}
