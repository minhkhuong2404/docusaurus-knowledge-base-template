import { describe, expect, it } from 'vitest'
import { ALL_SCENARIOS, PLAYABLE_IDS, PLAYABLE_SCENARIOS } from '../data/campaign'
import { explainChoices } from '../engine/explainChoices'
import { addComponentToArchitecture } from '../engine/graph'
import { simulate } from '../engine/simulate'
import type { Architecture } from '../types/game'

function applyRecommended(scenarioId: string): {
  scenario: (typeof PLAYABLE_SCENARIOS)[0]
  arch: Architecture
} {
  const scenario = PLAYABLE_SCENARIOS.find((s) => s.id === scenarioId)!
  let arch = scenario.initialArchitecture
  for (const id of scenario.recommended) {
    arch = addComponentToArchitecture(arch, id)
  }
  return { scenario, arch }
}

describe('campaign catalog', () => {
  it('ships 40 playable + 80 skeleton slots', () => {
    expect(PLAYABLE_IDS).toHaveLength(40)
    expect(ALL_SCENARIOS.filter((s) => s.status === 'skeleton')).toHaveLength(80)
    expect(ALL_SCENARIOS).toHaveLength(120)
    expect(ALL_SCENARIOS[0]?.id).toBe('L01')
    expect(ALL_SCENARIOS.at(-1)?.id).toBe('L120')
    expect(PLAYABLE_IDS).toContain('L21')
    expect(PLAYABLE_IDS).toContain('L40')
  })
})

describe('simulate engine', () => {
  it('fails cache level on initial architecture', () => {
    const s = PLAYABLE_SCENARIOS.find((x) => x.id === 'L03')!
    const result = simulate(s, s.initialArchitecture)
    expect(result.pass).toBe(false)
    expect(result.metrics.dbCpu).toBeGreaterThan(80)
  })

  it('passes viral item API with Redis and reviews the choice', () => {
    const { scenario, arch } = applyRecommended('L03')
    const result = simulate(scenario, arch)
    expect(result.sloMet).toBe(true)
    expect(result.pass).toBe(true)
    expect(result.metrics.cacheHitRatio).toBeGreaterThan(0.5)
    expect(result.choiceReviews.some((r) => r.componentId === 'redis' && r.verdict === 'helped')).toBe(
      true,
    )
  })

  it('marks distractors in choice reviews', () => {
    const s = PLAYABLE_SCENARIOS.find((x) => x.id === 'L03')!
    let arch = s.initialArchitecture
    arch = addComponentToArchitecture(arch, 'kafka')
    const reviews = explainChoices(s, arch)
    expect(reviews[0]?.verdict).toBe('distractor')
    expect(reviews[0]?.summary.length).toBeGreaterThan(20)
  })

  it('penalizes Kafka on read-heavy viral API within budget path', () => {
    const s = PLAYABLE_SCENARIOS.find((x) => x.id === 'L03')!
    let arch = s.initialArchitecture
    arch = addComponentToArchitecture(arch, 'kafka')
    arch = addComponentToArchitecture(arch, 'sharding')
    arch = addComponentToArchitecture(arch, 'multi_region')
    const result = simulate(s, arch)
    expect(result.overBudget || !result.pass || result.overengineered).toBe(true)
  })

  it('passes queue level with queue + worker', () => {
    const { scenario, arch } = applyRecommended('L07')
    const result = simulate(scenario, arch)
    expect(result.pass).toBe(true)
  })

  it('passes multi-region recommended set', () => {
    const { scenario, arch } = applyRecommended('L18')
    const result = simulate(scenario, arch)
    expect(result.pass).toBe(true)
  })

  it('passes connection pool and stampede levels', () => {
    const pool = applyRecommended('L21')
    expect(simulate(pool.scenario, pool.arch).pass).toBe(true)
    const stampede = applyRecommended('L24')
    expect(simulate(stampede.scenario, stampede.arch).pass).toBe(true)
  })

  it('all playable recommended sets pass SLO within budget', () => {
    const failures: string[] = []
    for (const s of PLAYABLE_SCENARIOS) {
      const { scenario, arch } = applyRecommended(s.id)
      const result = simulate(scenario, arch)
      if (!result.pass) {
        failures.push(
          `${s.id}: slo=${result.sloMet} budget=${!result.overBudget} rps=${result.metrics.rpsCapable} p95=${result.metrics.p95Ms} err=${result.metrics.errorRate} cost=${result.cost}/${s.budgets.cost} cpx=${result.complexity}/${s.budgets.complexity} modes=${result.activeFailureModes.join('|')}`,
        )
      }
    }
    expect(failures).toEqual([])
  })
})
