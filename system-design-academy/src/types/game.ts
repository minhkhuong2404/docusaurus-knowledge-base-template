export type ComponentId = string

export interface ComponentEffects {
  /** Multiplies DB CPU pressure (lower is better). */
  dbCpuFactor?: number
  /** Adds to cache hit ratio (0–1). */
  cacheHitBonus?: number
  /** Fraction of reads removed from DB path. */
  readOffload?: number
  /** Absorbs write spikes; raises queue lag. */
  writeBuffer?: number
  /** Multiplies geo / RTT latency. */
  geoLatencyFactor?: number
  /** Offloads search-shaped traffic from primary DB. */
  searchOffload?: number
  /** Caps inbound accepted RPS (rate limit). */
  rateLimitCap?: number
  /** Multiplies query latency when indexes help. */
  indexLatencyFactor?: number
  /** Write throughput multiplier for shards. */
  shardWriteBonus?: number
  /** Consistency / staleness tax on errors. */
  consistencyPenalty?: number
  /** Base queue lag in seconds when buffering. */
  queueLagBase?: number
  /** Multiplies API RPS capacity (scale-out). */
  apiScale?: number
  /** Multiplies overall capable RPS. */
  throughputBonus?: number
  /** Multiplies p95 latency. */
  latencyFactor?: number
  /** Additive reliability (-1..1). */
  reliabilityDelta?: number
  /** Reduces SPOF risk. */
  spofReduction?: number
  /** Marks cache-invalidation story present. */
  invalidation?: boolean
  /** Idempotent write handling. */
  idempotency?: boolean
  /** Distributed lock for contended writes. */
  distributedLock?: boolean
  /** DR / failover readiness. */
  disasterRecovery?: boolean
  /** CDN edge caching for static / public reads. */
  edgeCache?: boolean
  /** Vertical scale (bigger box). */
  verticalScale?: boolean
  /** Connection pool / backpressure. */
  connectionPool?: boolean
  /** Batches N+1 / ORM queries. */
  queryBatching?: boolean
  /** Isolates noisy tenants. */
  tenantIsolation?: boolean
  /** Singleflight / request coalescing. */
  requestCoalescing?: boolean
  /** Jittered TTLs. */
  ttlJitter?: boolean
  /** Cache-aside pattern. */
  cacheAside?: boolean
  /** Write-through cache. */
  writeThrough?: boolean
  /** Async MV refresh. */
  asyncMv?: boolean
  /** Change data capture. */
  cdc?: boolean
  /** Transactional outbox. */
  transactionalOutbox?: boolean
  /** Saga orchestration. */
  saga?: boolean
  /** Explicit timeout budgets. */
  timeoutBudget?: boolean
  /** Circuit breaker. */
  circuitBreaker?: boolean
  /** Retry budget / backoff. */
  retryBudget?: boolean
  /** Bulkhead isolation. */
  bulkhead?: boolean
  /** API gateway. */
  apiGateway?: boolean
  /** BFF layer. */
  bff?: boolean
  /** GraphQL DataLoader. */
  dataloader?: boolean
  /** Pub/sub fan-out broker. */
  pubsub?: boolean
  /** Server-sent events. */
  sse?: boolean
  /** Cap long-poll concurrency. */
  longPollLimit?: boolean
}

export interface ArchComponent {
  id: ComponentId
  name: string
  category: 'compute' | 'data' | 'network' | 'messaging' | 'resilience'
  cost: number
  complexity: number
  effects: ComponentEffects
  prerequisites?: ComponentId[]
  conflicts?: ComponentId[]
  tradeoffs: { pros: string[]; cons: string[] }
  failureModes?: string[]
}

export interface Workload {
  rps: number
  readRatio: number
  hotKeyFraction: number
  writeHeavy?: boolean
  geoUsers?: boolean
  searchHeavy?: boolean
  burstFactor?: number
  contestedWrites?: boolean
  duplicateRisk?: boolean
  poolExhaustion?: boolean
  nPlusOne?: boolean
  noisyNeighbor?: boolean
  cacheStampede?: boolean
  ttlThrash?: boolean
  dualWriteRisk?: boolean
  sagaFail?: boolean
  twoPcTimeouts?: boolean
  retryStorm?: boolean
  bulkheadSat?: boolean
  fanOutTimeout?: boolean
  graphqlN1?: boolean
  wsFanout?: boolean
  longPollStampede?: boolean
  pollingHeavy?: boolean
}

export interface TargetSlo {
  minRps: number
  maxP95Ms: number
  maxErrorRate: number
}

export interface GraphNode {
  id: string
  componentId: ComponentId
  label: string
}

export interface GraphEdge {
  id: string
  source: string
  target: string
}

export interface Architecture {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface Scenario {
  id: string
  order: number
  title: string
  incident: string
  conceptsTaught: string[]
  initialArchitecture: Architecture
  workload: Workload
  baselinePressure: {
    dbCpu: number
    p95Ms: number
    errorRate: number
    apiCapacity: number
    dbCapacity: number
  }
  targetSlo: TargetSlo
  budgets: { cost: number; complexity: number }
  availableComponentIds: ComponentId[]
  distractors: ComponentId[]
  /** Components that count toward a clean 3-star solve. */
  recommended: ComponentId[]
  lesson: {
    ifSolved: string
    ifFailed: string
    ifOverengineered: string
  }
  unlockNext: string | null
  status: 'playable' | 'skeleton'
  xpReward?: number
  skeletonHint?: string
}

export interface SystemMetrics {
  rpsCapable: number
  p95Ms: number
  errorRate: number
  dbCpu: number
  cacheHitRatio: number
  queueLag: number
  connections: number
  reliability: number
}

export type ChoiceVerdict = 'helped' | 'distractor' | 'side_effect'

export interface ChoiceReview {
  componentId: ComponentId
  name: string
  verdict: ChoiceVerdict
  summary: string
  pros: string[]
  cons: string[]
}

export interface SimulationResult {
  metrics: SystemMetrics
  bottlenecks: string[]
  activeFailureModes: string[]
  pass: boolean
  stars: 0 | 1 | 2 | 3
  cost: number
  complexity: number
  overBudget: boolean
  overengineered: boolean
  explanations: string[]
  sloMet: boolean
  choiceReviews: ChoiceReview[]
}
