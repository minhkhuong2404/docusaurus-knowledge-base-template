import { describe, expect, it } from 'vitest'
import { ALL_SCENARIOS, PLAYABLE_IDS } from '../data/campaign'

describe('campaign catalog', () => {
  it('ships 20 playable + 100 skeleton slots', () => {
    expect(PLAYABLE_IDS).toHaveLength(20)
    expect(ALL_SCENARIOS.filter((s) => s.status === 'skeleton')).toHaveLength(100)
    expect(ALL_SCENARIOS).toHaveLength(120)
    expect(ALL_SCENARIOS[0]?.id).toBe('L01')
    expect(ALL_SCENARIOS.at(-1)?.id).toBe('L120')
  })
})
