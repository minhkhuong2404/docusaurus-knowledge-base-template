import type { SystemMetrics } from '../types/game'

function fmtRps(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`
  return String(n)
}

function fmtErr(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export function MetricsBar({
  metrics,
  simulating,
}: {
  metrics: SystemMetrics
  simulating?: boolean
}) {
  const items = [
    { label: 'RPS capable', value: fmtRps(metrics.rpsCapable) },
    { label: 'p95', value: `${metrics.p95Ms}ms` },
    { label: 'Errors', value: fmtErr(metrics.errorRate) },
    { label: 'DB CPU', value: `${metrics.dbCpu}%` },
    { label: 'Cache hit', value: `${Math.round(metrics.cacheHitRatio * 100)}%` },
    { label: 'Queue lag', value: `${metrics.queueLag}s` },
    { label: 'DB conns', value: String(metrics.connections) },
    { label: 'Reliability', value: `${Math.round(metrics.reliability * 100)}%` },
  ]

  return (
    <div
      className={`grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8 ${simulating ? 'simulating' : ''}`}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 shadow-sm"
        >
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
            {item.label}
          </div>
          <div className="metric-value mt-1 text-lg font-semibold tabular-nums">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}
