import { Link } from 'react-router-dom'
import { LIBRARY } from '../../data/library/chapters'
import { useProgress } from '../../progress/useProgress'

export function LibraryHome() {
  const read = useProgress((s) => s.libraryRead)
  const readChapter = useProgress((s) => s.readChapter)

  return (
    <div className="space-y-4">
      <h1 className="display text-3xl">Library</h1>
      <p className="text-[var(--muted)]">
        Short notes that feed incidents. Read → challenge → XP.
      </p>
      <div className="space-y-3">
        {LIBRARY.map((ch) => (
          <article
            key={ch.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="display text-2xl">{ch.title}</h2>
                <p className="text-sm text-[var(--muted)]">{ch.source}</p>
              </div>
              {read.includes(ch.id) ? (
                <span className="text-xs text-[var(--accent)]">Read · +XP</span>
              ) : (
                <button
                  type="button"
                  onClick={() => readChapter(ch.id)}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold"
                >
                  Mark read (+15 XP)
                </button>
              )}
            </div>
            <pre className="mt-4 whitespace-pre-wrap font-[var(--font-body)] text-sm leading-relaxed text-[var(--ink)]">
              {ch.body}
            </pre>
            {ch.startChallenge && (
              <Link
                to={`/ops/${ch.startChallenge}`}
                className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
              >
                Start challenge {ch.startChallenge}
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
