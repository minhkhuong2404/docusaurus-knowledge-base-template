import { getComponent } from '../data/components/catalog'
import type {
  Architecture,
  Scenario,
  SimulationResult,
  SystemMetrics,
} from '../types/game'
import { explainChoices } from './explainChoices'

const CORE_IDS = new Set(['client', 'api', 'postgres'])

export function placedComponentIds(architecture: Architecture): string[] {
  return [...new Set(architecture.nodes.map((n) => n.componentId))]
}

export function addedComponentIds(
  scenario: Scenario,
  architecture: Architecture,
): string[] {
  const initial = new Set(placedComponentIds(scenario.initialArchitecture))
  return placedComponentIds(architecture).filter(
    (id) => !initial.has(id) && !CORE_IDS.has(id),
  )
}

export function architectureCost(
  scenario: Scenario,
  architecture: Architecture,
): { cost: number; complexity: number } {
  let cost = 0
  let complexity = 0
  for (const id of addedComponentIds(scenario, architecture)) {
    const c = getComponent(id)
    if (!c) continue
    cost += c.cost
    complexity += c.complexity
  }
  return { cost, complexity }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function simulate(
  scenario: Scenario,
  architecture: Architecture,
): SimulationResult {
  const ids = new Set(placedComponentIds(architecture))
  const added = addedComponentIds(scenario, architecture)
  const { cost, complexity } = architectureCost(scenario, architecture)
  const wl = scenario.workload
  const base = scenario.baselinePressure

  let apiCapacity = base.apiCapacity
  let dbCapacity = base.dbCapacity
  let cacheHit = 0
  let queueLag = 0
  let reliability = 0.55
  let consistencyTax = 0
  let throughputMul = 1
  let latencyMul = 1
  let dbCpuMul = 1
  let readOffload = 0
  let writeBuffer = 0
  let hasInvalidation = false
  let hasIdempotency = false
  let hasLock = false
  let hasDr = false
  let hasRateLimit = false
  const hasLb = ids.has('load_balancer')
  const hasHorizontal = ids.has('horizontal_scale')
  let searchOffload = 0
  let geoMul = 1
  let shardMul = 1
  let eventualMode = false

  let hasPool = false
  let hasBatch = false
  let hasTenantIso = false
  let hasCoalesce = false
  let hasTtlJitter = false
  let hasCacheAside = false
  let hasAsyncMv = false
  let hasCdc = false
  let hasOutbox = false
  let hasSaga = false
  let hasTimeoutBudget = false
  let hasCircuit = false
  let hasRetryBudget = false
  let hasBulkhead = false
  let hasGateway = false
  let hasBff = false
  let hasDataloader = false
  let hasPubsub = false
  let hasSse = false
  let hasLongPollLimit = false

  const activeFailureModes: string[] = []
  const bottlenecks: string[] = []
  const explanations: string[] = []

  for (const id of ids) {
    const c = getComponent(id)
    if (!c || CORE_IDS.has(id)) continue
    const e = c.effects

    if (e.apiScale) apiCapacity *= e.apiScale
    if (e.throughputBonus) throughputMul *= e.throughputBonus
    if (e.latencyFactor) latencyMul *= e.latencyFactor
    if (e.dbCpuFactor) dbCpuMul *= e.dbCpuFactor
    if (e.cacheHitBonus) {
      cacheHit = Math.max(
        cacheHit,
        e.cacheHitBonus * (0.35 + wl.hotKeyFraction * 0.65),
      )
    }
    if (e.readOffload) {
      readOffload = Math.min(0.95, readOffload + e.readOffload * 0.65)
    }
    if (e.writeBuffer) {
      writeBuffer = Math.min(0.95, writeBuffer + e.writeBuffer)
      queueLag = Math.max(queueLag, e.queueLagBase ?? 3)
    }
    if (e.queueLagBase && !e.writeBuffer) {
      queueLag = Math.max(queueLag, e.queueLagBase)
    }
    if (e.geoLatencyFactor) geoMul *= e.geoLatencyFactor
    if (e.searchOffload) searchOffload = Math.max(searchOffload, e.searchOffload)
    if (e.shardWriteBonus) shardMul *= e.shardWriteBonus
    if (e.indexLatencyFactor) latencyMul *= e.indexLatencyFactor
    if (e.consistencyPenalty) consistencyTax += e.consistencyPenalty
    if (e.reliabilityDelta) reliability += e.reliabilityDelta
    if (e.invalidation) hasInvalidation = true
    if (e.idempotency) hasIdempotency = true
    if (e.distributedLock) hasLock = true
    if (e.disasterRecovery) hasDr = true
    if (e.rateLimitCap) hasRateLimit = true
    if (e.spofReduction) reliability += e.spofReduction * 0.15
    if (id === 'eventual_consistency') eventualMode = true

    if (e.connectionPool) {
      hasPool = true
      apiCapacity *= 1.6
      dbCapacity *= 1.75
      latencyMul *= 0.55
      throughputMul *= 1.35
    }
    if (e.queryBatching) {
      hasBatch = true
      dbCpuMul *= 0.45
      latencyMul *= 0.5
      throughputMul *= 1.8
    }
    if (e.tenantIsolation) {
      hasTenantIso = true
      dbCpuMul *= 0.55
      reliability += 0.1
      throughputMul *= 1.5
    }
    if (e.requestCoalescing) {
      hasCoalesce = true
      dbCpuMul *= 0.5
      latencyMul *= 0.55
      throughputMul *= 1.6
    }
    if (e.ttlJitter) {
      hasTtlJitter = true
      dbCpuMul *= 0.6
      latencyMul *= 0.7
    }
    if (e.cacheAside) {
      hasCacheAside = true
      cacheHit = Math.max(cacheHit, 0.7 * (0.4 + wl.hotKeyFraction * 0.6))
      dbCpuMul *= 0.55
      latencyMul *= 0.6
      throughputMul *= 1.7
    }
    if (e.writeThrough) {
      latencyMul *= wl.writeHeavy ? 1.2 : 1.05
      throughputMul *= 1.15
    }
    if (e.asyncMv) {
      hasAsyncMv = true
      dbCpuMul *= 0.55
      latencyMul *= 0.65
      queueLag = Math.max(queueLag, 2)
    }
    if (e.cdc) {
      hasCdc = true
      reliability += 0.08
      throughputMul *= 1.35
      latencyMul *= 0.85
    }
    if (e.transactionalOutbox) {
      hasOutbox = true
      reliability += 0.12
    }
    if (e.saga) {
      hasSaga = true
      reliability += 0.1
      latencyMul *= 0.9
    }
    if (e.timeoutBudget) {
      hasTimeoutBudget = true
      latencyMul *= 0.65
      reliability += 0.08
    }
    if (e.circuitBreaker) {
      hasCircuit = true
      reliability += 0.14
      latencyMul *= 0.8
    }
    if (e.retryBudget) {
      hasRetryBudget = true
      reliability += 0.12
      throughputMul *= 1.25
      latencyMul *= 0.75
    }
    if (e.bulkhead) {
      hasBulkhead = true
      reliability += 0.12
      apiCapacity *= 1.85
      throughputMul *= 1.4
      latencyMul *= 0.75
    }
    if (e.apiGateway) {
      hasGateway = true
      apiCapacity *= 1.5
      latencyMul *= 0.85
      reliability += 0.06
    }
    if (e.bff) {
      hasBff = true
      latencyMul *= 0.8
      throughputMul *= 1.3
    }
    if (e.dataloader) {
      hasDataloader = true
      dbCpuMul *= 0.4
      latencyMul *= 0.45
      throughputMul *= 2
    }
    if (e.pubsub) {
      hasPubsub = true
      apiCapacity *= 1.8
      latencyMul *= 0.7
      throughputMul *= 1.9
    }
    if (e.sse) {
      hasSse = true
      apiCapacity *= 1.6
      latencyMul *= 0.6
      throughputMul *= 1.7
    }
    if (e.longPollLimit) {
      hasLongPollLimit = true
      apiCapacity *= 1.55
      latencyMul *= 0.7
      reliability += 0.08
    }
  }

  if (hasHorizontal && !hasLb) {
    activeFailureModes.push('spof_without_lb')
    reliability -= 0.15
    explanations.push(
      'Horizontal replicas without a load balancer leave traffic pinned and create SPOF behavior.',
    )
  }
  if (ids.has('consistent_hashing') && !ids.has('sharding')) {
    activeFailureModes.push('hash_without_shards')
    explanations.push('Consistent hashing needs a sharded fleet to matter.')
    latencyMul *= 1.15
  }
  if (ids.has('worker') && !ids.has('message_queue') && !ids.has('kafka')) {
    activeFailureModes.push('worker_without_queue')
  }

  const effectiveReadOffload =
    readOffload * wl.readRatio + (wl.searchHeavy ? searchOffload * 0.7 : 0)
  dbCapacity *= 1 + effectiveReadOffload * 2.2 + cacheHit * wl.readRatio * 2.5
  if (wl.writeHeavy) {
    dbCapacity *= 1 + writeBuffer * 1.2 + (shardMul - 1) * 0.65
  } else {
    dbCapacity *= 1 + (shardMul - 1) * 0.2
  }
  dbCapacity *= 1 / Math.max(0.25, dbCpuMul)

  if (cacheHit > 0) {
    dbCpuMul *= 1 - cacheHit * wl.readRatio * 0.9
    apiCapacity *= 1 + cacheHit * 0.5
  }

  if (wl.searchHeavy) {
    if (searchOffload >= 0.5) {
      dbCpuMul *= 0.55
      latencyMul *= 0.7
    } else {
      dbCpuMul *= 1.4
      latencyMul *= 1.3
      bottlenecks.push('search_on_oltp')
    }
  }

  let demand = wl.rps * (wl.burstFactor ?? 1)
  const organicDemand = wl.rps
  if (hasRateLimit && (wl.burstFactor ?? 1) > 1.2) {
    demand = organicDemand * 1.1
    explanations.push(
      'Rate limiter shed the abusive burst and protected the core path.',
    )
    reliability += 0.05
    latencyMul *= 0.55
  }

  if (wl.geoUsers) {
    latencyMul *= geoMul === 1 ? 1.55 : Math.min(geoMul * 1.05, 1.1)
  }

  if (eventualMode) {
    latencyMul *= 0.55
    consistencyTax = Math.max(0, consistencyTax - 0.25)
    activeFailureModes.push('stale_reads')
    explanations.push(
      'Eventual consistency trades immediate agreement for latency and availability.',
    )
  }

  if (hasInvalidation && ids.has('redis')) {
    consistencyTax = Math.max(0, consistencyTax - 0.2)
    explanations.push('Invalidation keeps the hot cache honest under writes.')
  }

  const pathCapacity = Math.min(apiCapacity, dbCapacity) * throughputMul
  let rpsCapable = pathCapacity
  const overload = demand / Math.max(1, rpsCapable)

  let p95: number
  let errorRate: number
  let dbCpu: number

  if (added.length === 0) {
    rpsCapable = Math.min(base.apiCapacity, base.dbCapacity)
    p95 = base.p95Ms
    errorRate = base.errorRate
    dbCpu = base.dbCpu
    cacheHit = ids.has('redis') || hasCacheAside ? cacheHit : 0
    queueLag = 0
    reliability = 0.5
  } else if (overload > 1) {
    errorRate = clamp(0.04 + (overload - 1) * 0.28, 0.02, 0.95)
    p95 = base.p95Ms * latencyMul * (0.9 + (overload - 1) * 1.4)
    dbCpu = clamp(base.dbCpu * dbCpuMul * Math.min(overload, 1.8), 0, 100)
    bottlenecks.push(apiCapacity <= dbCapacity ? 'api_capacity' : 'db_capacity')
  } else {
    rpsCapable = Math.max(pathCapacity, demand * 1.15)
    errorRate = clamp(0.004 + Math.max(0, consistencyTax) * 0.025, 0.001, 0.2)
    p95 = Math.max(28, 55 + base.p95Ms * latencyMul * 0.22)
    dbCpu = clamp(18 + base.dbCpu * dbCpuMul * 0.35 * overload, 8, 95)
  }

  // Domain failure modes
  if (
    ids.has('redis') &&
    !hasInvalidation &&
    scenario.conceptsTaught.includes('Cache Invalidation')
  ) {
    activeFailureModes.push('stale_reads')
    errorRate += 0.045
    explanations.push('Cache without invalidation returns stale data under writes.')
  }

  if (wl.contestedWrites && !hasLock) {
    activeFailureModes.push('lost_updates')
    errorRate += 0.09
    reliability -= 0.12
    bottlenecks.push('write_contention')
    explanations.push(
      'Contested writes collide without a lock or compare-and-set story.',
    )
  } else if (wl.contestedWrites && hasLock) {
    errorRate = Math.min(errorRate, 0.015)
    explanations.push('Distributed lock serializes the hot inventory updates.')
  }

  if (wl.duplicateRisk && !hasIdempotency) {
    activeFailureModes.push('duplicate_side_effects')
    errorRate += 0.08
    reliability -= 0.1
    explanations.push('Retries duplicate side effects without idempotency keys.')
  } else if (wl.duplicateRisk && hasIdempotency) {
    errorRate = Math.min(errorRate, 0.012)
    explanations.push('Idempotency keys make client retries safe.')
  }

  if (hasHorizontal && !hasLb) errorRate += 0.1

  if (
    scenario.conceptsTaught.some((c) => c.toLowerCase().includes('disaster')) &&
    added.length > 0 &&
    !hasDr
  ) {
    errorRate += 0.04
    reliability -= 0.1
    explanations.push('Without a DR plan, failover stays a wiki page.')
  }

  if (
    ids.has('kafka') &&
    !wl.writeHeavy &&
    wl.readRatio > 0.8 &&
    !scenario.conceptsTaught.some((c) => c.includes('Kafka'))
  ) {
    activeFailureModes.push('ops_overhead')
    explanations.push(
      'Kafka on a read-heavy path adds cost without fixing the bottleneck.',
    )
  }

  // Batch-2 workload flags
  if (added.length > 0) {
    if (wl.poolExhaustion && !hasPool) {
      activeFailureModes.push('pool_exhaustion')
      errorRate += 0.1
      latencyMul *= 1.4
      p95 = Math.max(p95, base.p95Ms * 0.85)
      bottlenecks.push('db_connections')
      explanations.push('Without pool limits, connections stampede the database.')
    } else if (wl.poolExhaustion && hasPool) {
      errorRate = Math.min(errorRate, 0.015)
      p95 = Math.min(p95, 180)
      rpsCapable = Math.max(rpsCapable, demand * 1.2)
      explanations.push('Connection pooling and backpressure stopped the stampede.')
    }

    if (wl.nPlusOne && !hasBatch && !hasDataloader) {
      activeFailureModes.push('n_plus_one')
      errorRate += 0.08
      p95 = Math.max(p95, base.p95Ms * 0.9)
      dbCpu = Math.max(dbCpu, 88)
      explanations.push('N+1 queries still multiply round-trips per request.')
    } else if (wl.nPlusOne && (hasBatch || hasDataloader)) {
      errorRate = Math.min(errorRate, 0.015)
    }

    if (wl.noisyNeighbor && !hasTenantIso) {
      activeFailureModes.push('noisy_neighbor')
      errorRate += 0.09
      dbCpu = Math.max(dbCpu, 90)
      explanations.push('One hot tenant still crowds out everyone else.')
    } else if (wl.noisyNeighbor && hasTenantIso) {
      errorRate = Math.min(errorRate, 0.018)
    }

    if (wl.cacheStampede && !hasCoalesce) {
      activeFailureModes.push('cache_stampede')
      errorRate += 0.1
      p95 = Math.max(p95, base.p95Ms * 0.85)
      explanations.push('Cache misses stampede the origin without coalescing.')
    } else if (wl.cacheStampede && hasCoalesce) {
      errorRate = Math.min(errorRate, 0.015)
    }

    if (wl.ttlThrash && !hasTtlJitter) {
      activeFailureModes.push('ttl_thrash')
      errorRate += 0.07
      dbCpu = Math.max(dbCpu, 86)
      explanations.push('Aligned TTLs expire together and thrash the origin.')
    } else if (wl.ttlThrash && hasTtlJitter) {
      errorRate = Math.min(errorRate, 0.015)
    }

    if (wl.dualWriteRisk && !hasOutbox && !hasCdc) {
      activeFailureModes.push('dual_write')
      errorRate += 0.1
      reliability -= 0.12
      explanations.push('Dual writes drift when DB and queue disagree.')
    } else if (wl.dualWriteRisk && (hasOutbox || hasCdc)) {
      errorRate = Math.min(errorRate, 0.015)
    }

    if (wl.sagaFail && !hasSaga) {
      activeFailureModes.push('saga_fail')
      errorRate += 0.09
      explanations.push('Partial multi-step failures need compensation, not hope.')
    } else if (wl.sagaFail && hasSaga) {
      errorRate = Math.min(errorRate, 0.018)
    }

    if (wl.twoPcTimeouts && !hasTimeoutBudget && !hasSaga) {
      activeFailureModes.push('2pc_timeout')
      errorRate += 0.11
      p95 = Math.max(p95, base.p95Ms * 0.9)
      explanations.push('Distributed locks/2PC timeouts cascade under latency.')
    } else if (wl.twoPcTimeouts && (hasTimeoutBudget || hasSaga)) {
      errorRate = Math.min(errorRate, 0.02)
    }

    if (wl.retryStorm && !hasRetryBudget && !hasCircuit) {
      activeFailureModes.push('retry_storm')
      errorRate += 0.12
      demand *= 1.3
      explanations.push('Unbounded retries amplify load into a storm.')
    } else if (wl.retryStorm && (hasRetryBudget || hasCircuit)) {
      errorRate = Math.min(errorRate, 0.015)
    }

    if (wl.bulkheadSat && !hasBulkhead) {
      activeFailureModes.push('bulkhead_sat')
      errorRate += 0.09
      explanations.push('One saturated pool blocks unrelated traffic.')
    } else if (wl.bulkheadSat && hasBulkhead) {
      errorRate = Math.min(errorRate, 0.015)
      p95 = Math.min(p95, 200)
      rpsCapable = Math.max(rpsCapable, demand * 1.2)
    }

    if (wl.fanOutTimeout && !(hasTimeoutBudget && (hasBff || hasGateway))) {
      if (!hasTimeoutBudget) {
        activeFailureModes.push('fanout_timeout')
        errorRate += 0.1
        p95 = Math.max(p95, base.p95Ms * 0.88)
        explanations.push('Unbounded fan-out waits on the slowest dependency.')
      }
    } else if (wl.fanOutTimeout && hasTimeoutBudget) {
      errorRate = Math.min(errorRate, 0.018)
    }

    if (wl.graphqlN1 && !hasDataloader) {
      activeFailureModes.push('graphql_n1')
      errorRate += 0.08
      p95 = Math.max(p95, base.p95Ms * 0.9)
      explanations.push('GraphQL resolvers still fire N+1 without DataLoader.')
    } else if (wl.graphqlN1 && hasDataloader) {
      errorRate = Math.min(errorRate, 0.015)
    }

    if (wl.wsFanout && !hasPubsub) {
      activeFailureModes.push('ws_fanout')
      errorRate += 0.09
      apiCapacity *= 0.6
      explanations.push('One API process cannot fan-out websockets at this scale.')
    } else if (wl.wsFanout && hasPubsub) {
      errorRate = Math.min(errorRate, 0.015)
    }

    if (wl.pollingHeavy && !hasSse && !hasPubsub) {
      activeFailureModes.push('polling_heavy')
      errorRate += 0.07
      apiCapacity *= 0.65
      explanations.push('Client polling burns capacity versus push (SSE/pubsub).')
    } else if (wl.pollingHeavy && (hasSse || hasPubsub)) {
      errorRate = Math.min(errorRate, 0.015)
    }

    if (wl.longPollStampede && !hasLongPollLimit && !hasCoalesce) {
      activeFailureModes.push('long_poll_stampede')
      errorRate += 0.1
      apiCapacity *= 0.55
      explanations.push('Unbounded long-polls pin workers until the fleet stalls.')
    } else if (wl.longPollStampede && (hasLongPollLimit || hasCoalesce)) {
      errorRate = Math.min(errorRate, 0.015)
    }

    if (wl.twoPcTimeouts === undefined && scenario.conceptsTaught.includes('Materialized Views') && !hasAsyncMv && added.length > 0) {
      // handled by recommended async mv via effects
    }
  }

  // Recompute lightly if failure modes crushed capacity after healthy path
  if (added.length > 0 && overload <= 1) {
    rpsCapable = Math.max(
      Math.min(apiCapacity, dbCapacity) * throughputMul,
      demand * (errorRate < 0.03 ? 1.15 : 0.9),
    )
    if (errorRate < 0.03) {
      p95 = Math.min(p95, Math.max(28, 55 + base.p95Ms * latencyMul * 0.22))
      dbCpu = Math.min(dbCpu, clamp(18 + base.dbCpu * dbCpuMul * 0.35, 8, 95))
    }
  }

  if (writeBuffer > 0 && queueLag > 0) {
    queueLag *= overload > 1 ? 1 + (overload - 1) * 2 : 1
  }

  if (ids.has('consistent_hashing') && ids.has('sharding')) {
    errorRate = Math.min(errorRate, 0.025)
    explanations.push(
      'Consistent hashing limits how many keys move when the ring changes.',
    )
  }

  if (hasAsyncMv && added.length > 0) {
    explanations.push('Async MV refresh keeps OLTP off the reporting path.')
  }

  errorRate = clamp(errorRate, 0, 0.99)
  reliability = clamp(reliability, 0.05, 0.99)
  p95 = Math.round(Math.max(20, p95))

  const connections = clamp(
    Math.round((demand / 120) * (1 - readOffload * 0.5) * dbCpuMul * 10),
    10,
    5000,
  )

  const metrics: SystemMetrics = {
    rpsCapable: Math.round(rpsCapable),
    p95Ms: p95,
    errorRate: Number(errorRate.toFixed(4)),
    dbCpu: Number(dbCpu.toFixed(1)),
    cacheHitRatio: Number(clamp(cacheHit, 0, 1).toFixed(3)),
    queueLag: Number(queueLag.toFixed(1)),
    connections,
    reliability: Number(reliability.toFixed(3)),
  }

  if (metrics.dbCpu > 85) bottlenecks.push('db_cpu')
  if (metrics.p95Ms > scenario.targetSlo.maxP95Ms) bottlenecks.push('latency')
  if (metrics.errorRate > scenario.targetSlo.maxErrorRate) bottlenecks.push('errors')
  if (metrics.rpsCapable < scenario.targetSlo.minRps) bottlenecks.push('throughput')

  const sloMet =
    metrics.rpsCapable >= scenario.targetSlo.minRps &&
    metrics.p95Ms <= scenario.targetSlo.maxP95Ms &&
    metrics.errorRate <= scenario.targetSlo.maxErrorRate

  const overBudget =
    cost > scenario.budgets.cost || complexity > scenario.budgets.complexity

  const distractorUsed = added.some((id) => scenario.distractors.includes(id))
  const recommendedSet = new Set(scenario.recommended)
  const hasAllRecommended =
    scenario.recommended.length === 0 ||
    scenario.recommended.every((id) => ids.has(id))
  const extraJunk = added.filter((id) => !recommendedSet.has(id))
  const overengineered =
    distractorUsed ||
    extraJunk.length >= 2 ||
    (added.length > scenario.recommended.length + 1 &&
      scenario.recommended.length > 0)

  const pass = sloMet && !overBudget

  let stars: 0 | 1 | 2 | 3 = 0
  if (pass) {
    stars = 1
    if (cost <= scenario.budgets.cost * 0.7) stars = 2
    if (
      hasAllRecommended &&
      !distractorUsed &&
      extraJunk.length === 0 &&
      metrics.reliability >= 0.55
    ) {
      stars = 3
    }
  }

  if (pass && overengineered) {
    explanations.push(
      'It works, but the design carries unnecessary distributed pieces.',
    )
  }
  if (!pass && overBudget) {
    explanations.push('Architecture exceeds cost or complexity budget.')
  }
  if (!sloMet && added.length > 0) {
    explanations.push(
      'SLO not met — find the real bottleneck before adding more boxes.',
    )
  }

  return {
    metrics,
    bottlenecks: [...new Set(bottlenecks)],
    activeFailureModes: [...new Set(activeFailureModes)],
    pass,
    stars,
    cost,
    complexity,
    overBudget,
    overengineered,
    explanations,
    sloMet,
    choiceReviews: explainChoices(scenario, architecture),
  }
}
