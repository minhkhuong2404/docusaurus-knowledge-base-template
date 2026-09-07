import { PLAYABLE_SCENARIOS } from './scenarios/playable'
import { SKELETON_SCENARIOS } from './scenarios/skeleton'
import type { Scenario } from '../types/game'

export const ALL_SCENARIOS: Scenario[] = [
  ...PLAYABLE_SCENARIOS,
  ...SKELETON_SCENARIOS,
].sort((a, b) => a.order - b.order)

export function getScenario(id: string): Scenario | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id)
}

export const PLAYABLE_IDS = PLAYABLE_SCENARIOS.map((s) => s.id)

export const CAMPAIGN = {
  name: 'System Design Academy',
  tagline: 'Bottleneck first. Trade-offs second. Logos last.',
  totalTarget: 120,
}
