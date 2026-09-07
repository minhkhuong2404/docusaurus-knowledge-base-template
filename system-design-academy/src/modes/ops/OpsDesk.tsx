import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getScenario } from '../../data/campaign'
import {
  addComponentToArchitecture,
  cloneArchitecture,
  removeComponentFromArchitecture,
} from '../../engine/graph'
import {
  architectureCost,
  placedComponentIds,
  simulate,
} from '../../engine/simulate'
import { useProgress } from '../../progress/useProgress'
import type { Architecture, SimulationResult, SystemMetrics } from '../../types/game'
import { ArchitectureCanvas } from '../../ui/ArchitectureCanvas'
import { ComponentTray } from '../../ui/ComponentTray'
import { LessonPanel } from '../../ui/LessonPanel'
import { MetricsBar } from '../../ui/MetricsBar'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function tweenMetrics(
  from: SystemMetrics,
  to: SystemMetrics,
  t: number,
): SystemMetrics {
  return {
    rpsCapable: Math.round(lerp(from.rpsCapable, to.rpsCapable, t)),
    p95Ms: Math.round(lerp(from.p95Ms, to.p95Ms, t)),
    errorRate: Number(lerp(from.errorRate, to.errorRate, t).toFixed(4)),
    dbCpu: Number(lerp(from.dbCpu, to.dbCpu, t).toFixed(1)),
    cacheHitRatio: Number(lerp(from.cacheHitRatio, to.cacheHitRatio, t).toFixed(3)),
    queueLag: Number(lerp(from.queueLag, to.queueLag, t).toFixed(1)),
    connections: Math.round(lerp(from.connections, to.connections, t)),
    reliability: Number(lerp(from.reliability, to.reliability, t).toFixed(3)),
  }
}

export function OpsDesk() {
  const { levelId = 'L03' } = useParams()
  const scenario = getScenario(levelId)
  const navigate = useNavigate()
  const completeLevel = useProgress((s) => s.completeLevel)
  const unlocked = useProgress((s) => s.unlocked)

  const [architecture, setArchitecture] = useState<Architecture | null>(null)
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (!scenario) return
    const arch = cloneArchitecture(scenario.initialArchitecture)
    setArchitecture(arch)
    const baseline = simulate(scenario, arch)
    setMetrics(baseline.metrics)
    setResult(null)
    setSimulating(false)
  }, [scenario])

  const costInfo = useMemo(() => {
    if (!scenario || !architecture) return { cost: 0, complexity: 0 }
    return architectureCost(scenario, architecture)
  }, [scenario, architecture])

  if (!scenario) {
    return <p>Unknown level.</p>
  }

  if (scenario.status === 'skeleton') {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6">
        <h1 className="display text-3xl">{scenario.title}</h1>
        <p className="mt-3 text-[var(--muted)]">
          Coming soon — catalog slot {scenario.id}. Concepts:{' '}
          {scenario.conceptsTaught.join(', ')}.
        </p>
        <Link to="/" className="mt-4 inline-block text-[var(--accent)]">
          Back to campaign
        </Link>
      </div>
    )
  }

  if (!unlocked.includes(scenario.id) && scenario.id !== 'L01') {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6">
        <h1 className="display text-3xl">Locked</h1>
        <p className="mt-3 text-[var(--muted)]">
          Clear the previous incident to unlock {scenario.id}.
        </p>
        <Link to="/" className="mt-4 inline-block text-[var(--accent)]">
          Back to campaign
        </Link>
      </div>
    )
  }

  if (!architecture || !metrics) return null

  const placed = placedComponentIds(architecture).filter(
    (id) => !['client', 'api', 'postgres'].includes(id),
  )

  const runLoadTest = () => {
    if (simulating) return
    const final = simulate(scenario, architecture)
    const from = metrics
    const to = final.metrics
    setSimulating(true)
    setResult(null)
    const start = performance.now()
    const duration = 6500

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setMetrics(tweenMetrics(from, to, eased))
      if (t < 1) {
        raf.current = requestAnimationFrame(tick)
      } else {
        setSimulating(false)
        setResult(final)
        if (final.pass) {
          completeLevel(
            scenario.id,
            final,
            scenario.xpReward ?? 100,
            scenario.unlockNext,
          )
        }
      }
    }
    raf.current = requestAnimationFrame(tick)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            {scenario.id} · {scenario.conceptsTaught.join(' · ')}
          </p>
          <h1 className="display text-3xl">{scenario.title}</h1>
        </div>
        <Link to="/" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          Campaign map
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
        <h2 className="display text-lg">Incident</h2>
        <p className="mt-2 leading-relaxed">{scenario.incident}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <span>
            SLO ≥ {scenario.targetSlo.minRps / 1000}k RPS · p95 ≤{' '}
            {scenario.targetSlo.maxP95Ms}ms · err ≤{' '}
            {(scenario.targetSlo.maxErrorRate * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <MetricsBar metrics={metrics} simulating={simulating} />
      <ArchitectureCanvas architecture={architecture} />

      <ComponentTray
        availableIds={scenario.availableComponentIds}
        placedIds={placed}
        cost={costInfo.cost}
        complexity={costInfo.complexity}
        budgets={scenario.budgets}
        onAdd={(id) => setArchitecture(addComponentToArchitecture(architecture, id))}
        onRemove={(id) =>
          setArchitecture(removeComponentFromArchitecture(architecture, id))
        }
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={simulating}
          onClick={runLoadTest}
          className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {simulating ? 'Running load test…' : 'Run load test'}
        </button>
        <button
          type="button"
          disabled={simulating}
          onClick={() => {
            const arch = cloneArchitecture(scenario.initialArchitecture)
            setArchitecture(arch)
            setMetrics(simulate(scenario, arch).metrics)
            setResult(null)
          }}
          className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold"
        >
          Reset architecture
        </button>
      </div>

      {result && !simulating && (
        <LessonPanel
          result={result}
          solvedText={scenario.lesson.ifSolved}
          failedText={scenario.lesson.ifFailed}
          overText={scenario.lesson.ifOverengineered}
          onRetry={() => setResult(null)}
          onContinue={() => {
            if (scenario.unlockNext) navigate(`/ops/${scenario.unlockNext}`)
            else navigate('/')
          }}
        />
      )}
    </div>
  )
}
