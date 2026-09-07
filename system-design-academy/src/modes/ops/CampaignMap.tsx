import { Link } from 'react-router-dom'
import { ALL_SCENARIOS, CAMPAIGN, PLAYABLE_IDS } from '../../data/campaign'
import { useProgress } from '../../progress/useProgress'

export function CampaignMap() {
  const unlocked = useProgress((s) => s.unlocked)
  const levels = useProgress((s) => s.levels)
  const xp = useProgress((s) => s.xp)

  const playable = ALL_SCENARIOS.filter((s) => s.status === 'playable')
  const skeletons = ALL_SCENARIOS.filter((s) => s.status === 'skeleton')
  const playableDone = PLAYABLE_IDS.filter((id) => (levels[id]?.stars ?? 0) > 0).length

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          A little garden of bottlenecks
        </p>
        <h1 className="display mt-2 text-4xl md:text-5xl">{CAMPAIGN.name}</h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--muted)]">{CAMPAIGN.tagline}</p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">
            {playableDone}/{PLAYABLE_IDS.length} playable cleared
          </span>
          <span className="rounded-full border border-[var(--line)] px-3 py-1">
            {ALL_SCENARIOS.length} catalog slots · target {CAMPAIGN.totalTarget}
          </span>
          <span className="rounded-full border border-[var(--line)] px-3 py-1">{xp} XP</span>
        </div>
      </section>

      <section>
        <h2 className="display mb-3 text-2xl">Playable campaign</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {playable.map((s) => {
            const isUnlocked = unlocked.includes(s.id) || s.id === 'L01'
            const stars = levels[s.id]?.stars ?? 0
            return (
              <div
                key={s.id}
                className={`rounded-2xl border p-4 ${
                  isUnlocked
                    ? 'border-[var(--line)] bg-[var(--card)] shadow-sm'
                    : 'border-[var(--line)] bg-[var(--bg-deep)] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {s.id}
                  </span>
                  <span className="text-sm text-[var(--accent)]">
                    {'★'.repeat(stars)}
                    {'☆'.repeat(3 - stars)}
                  </span>
                </div>
                <h3 className="display mt-2 text-lg">{s.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                  {s.conceptsTaught.join(' · ')}
                </p>
                {isUnlocked ? (
                  <Link
                    to={`/ops/${s.id}`}
                    className="mt-3 inline-flex rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Enter incident
                  </Link>
                ) : (
                  <p className="mt-3 text-xs text-[var(--muted)]">Locked</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="display mb-2 text-2xl">Catalog spine (L41–L120)</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          {skeletons.length} skeleton incidents reserved — titles locked as Coming soon.
        </p>
        <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto rounded-2xl border border-dashed border-[var(--line)] bg-[color-mix(in_srgb,var(--bg-deep)_40%,white)] p-3 sm:grid-cols-3 lg:grid-cols-4">
          {skeletons.map((s) => (
            <Link
              key={s.id}
              to={`/ops/${s.id}`}
              className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-2 text-xs hover:border-[var(--accent)]"
            >
              <div className="font-semibold text-[var(--muted)]">{s.id}</div>
              <div className="line-clamp-2">{s.title}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
