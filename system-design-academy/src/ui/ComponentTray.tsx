import { getComponent } from '../data/components/catalog'

export function ComponentTray({
  availableIds,
  placedIds,
  cost,
  complexity,
  budgets,
  onAdd,
  onRemove,
}: {
  availableIds: string[]
  placedIds: string[]
  cost: number
  complexity: number
  budgets: { cost: number; complexity: number }
  onAdd: (id: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="display text-lg">Architecture components</h3>
          <p className="text-sm text-[var(--muted)]">
            Soft warn on spend — budgets fail on load test if exceeded.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span
            className={
              cost > budgets.cost ? 'text-[var(--danger)]' : 'text-[var(--muted)]'
            }
          >
            Cost {cost}/{budgets.cost}
          </span>
          <span
            className={
              complexity > budgets.complexity
                ? 'text-[var(--danger)]'
                : 'text-[var(--muted)]'
            }
          >
            Complexity {complexity}/{budgets.complexity}
          </span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {availableIds.map((id) => {
          const c = getComponent(id)
          if (!c) return null
          const placed = placedIds.includes(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => (placed ? onRemove(id) : onAdd(id))}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                placed
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'border-[var(--line)] hover:border-[var(--accent)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{c.name}</span>
                <span className="text-xs text-[var(--muted)]">
                  ${c.cost} · c{c.complexity}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {c.tradeoffs.pros[0]}
                {c.tradeoffs.cons[0] ? ` · − ${c.tradeoffs.cons[0]}` : ''}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
