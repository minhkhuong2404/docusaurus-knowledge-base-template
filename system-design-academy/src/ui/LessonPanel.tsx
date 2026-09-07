import type { SimulationResult } from '../types/game'

const VERDICT_STYLE: Record<string, string> = {
  helped: 'border-[var(--good)] bg-[var(--accent-soft)] text-[var(--accent)]',
  distractor: 'border-[var(--danger)] bg-[#f8e8e8] text-[var(--danger)]',
  side_effect: 'border-[var(--line)] bg-[var(--bg-deep)] text-[var(--muted)]',
}

const VERDICT_LABEL: Record<string, string> = {
  helped: 'Helped',
  distractor: 'Distractor',
  side_effect: 'Side effect',
}

export function LessonPanel({
  result,
  solvedText,
  failedText,
  overText,
  onContinue,
  onRetry,
}: {
  result: SimulationResult
  solvedText: string
  failedText: string
  overText: string
  onContinue: () => void
  onRetry: () => void
}) {
  const body = result.pass
    ? result.overengineered
      ? overText
      : solvedText
    : failedText

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="display text-xl">
          {result.pass ? 'Load test passed' : 'Load test failed'}
        </h3>
        <div className="text-sm text-[var(--muted)]">
          {'★'.repeat(result.stars)}
          {'☆'.repeat(3 - result.stars)} · cost {result.cost} · complexity{' '}
          {result.complexity}
        </div>
      </div>
      <p className="mt-3 leading-relaxed text-[var(--ink)]">{body}</p>
      {result.explanations.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
          {result.explanations.slice(0, 4).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {result.bottlenecks.length > 0 && (
        <p className="mt-3 text-sm text-[var(--warn)]">
          Remaining signals: {result.bottlenecks.join(', ')}
        </p>
      )}

      {result.choiceReviews.length > 0 && (
        <div className="mt-5 border-t border-[var(--line)] pt-4">
          <h4 className="display text-lg">Your choices</h4>
          <p className="mt-1 text-sm text-[var(--muted)]">
            English debrief for each component you added.
          </p>
          <ul className="mt-3 space-y-3">
            {result.choiceReviews.map((review) => (
              <li
                key={review.componentId}
                className="rounded-xl border border-[var(--line)] px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{review.name}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VERDICT_STYLE[review.verdict]}`}
                  >
                    {VERDICT_LABEL[review.verdict]}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">
                  {review.summary}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  + {review.pros.slice(0, 2).join(' · ')}
                  {review.cons[0] ? ` · − ${review.cons[0]}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        {result.pass ? (
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white"
          >
            Continue
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-[var(--line)] px-5 py-2 text-sm font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
