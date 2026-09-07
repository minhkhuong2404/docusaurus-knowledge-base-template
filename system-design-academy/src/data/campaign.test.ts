import { describe, expect, it } from 'vitest'
import { ALL_SCENARIOS, PLAYABLE_IDS } from './campaign'

describe('campaign catalog', () => {
  it('ships 40 playable + 80 skeleton slots', () => {
    expect(PLAYABLE_IDS).toHaveLength(40)
    expect(ALL_SCENARIOS.filter((s) => s.status === 'skeleton')).toHaveLength(80)
    expect(ALL_SCENARIOS).toHaveLength(120)
    expect(ALL_SCENARIOS[0]?.id).toBe('L01')
    expect(ALL_SCENARIOS.at(-1)?.id).toBe('L120')
  })
})
