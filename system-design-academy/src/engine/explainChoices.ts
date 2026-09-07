import { getComponent } from '../data/components/catalog'
import type {
  Architecture,
  ChoiceReview,
  ChoiceVerdict,
  Scenario,
} from '../types/game'

const CORE_IDS = new Set(['client', 'api', 'postgres'])

function addedIds(scenario: Scenario, architecture: Architecture): string[] {
  const initial = new Set(
    scenario.initialArchitecture.nodes.map((n) => n.componentId),
  )
  const placed = [...new Set(architecture.nodes.map((n) => n.componentId))]
  return placed.filter((id) => !initial.has(id) && !CORE_IDS.has(id))
}

const HELPED_BLURBS: Record<string, string> = {
  redis:
    'Offloaded repeated hot reads from the primary. You now own cache freshness.',
  cache_invalidation:
    'Kept the hot cache honest after writes so latency wins do not become stale bugs.',
  load_balancer:
    'Spread traffic across instances so replicas actually receive work.',
  horizontal_scale:
    'Added API headroom by scaling out instead of relying on one fat box.',
  vertical_scale:
    'Bought capacity quickly on a bigger box — useful short-term, hard ceiling later.',
  read_replica:
    'Moved read load off the primary so writers stop competing with heavy SELECTs.',
  db_index:
    'Fixed the access path so the database stops paying full-table scan tax.',
  message_queue:
    'Pulled slow work off the request thread and smoothed write bursts.',
  worker: 'Processed deferred jobs without blocking the user-facing API.',
  kafka: 'Absorbed high-throughput durable streams with fan-out consumers.',
  rate_limiter: 'Shed abusive or bursty traffic so the core path stayed healthy.',
  partitioning: 'Pruned old data from query plans without a full shard redesign.',
  sharding: 'Raised write throughput by splitting the primary — with cross-shard cost.',
  consistent_hashing:
    'Limited how many keys move when the shard ring changes.',
  cdn: 'Moved static or edge-friendly bytes closer to users.',
  elasticsearch: 'Took search-shaped work off the OLTP primary.',
  eventual_consistency:
    'Traded immediate global agreement for latency and availability.',
  distributed_lock:
    'Serialized contested updates so parallel workers stop losing writes.',
  idempotency_keys:
    'Made client retries safe so side effects are not applied twice.',
  multi_region: 'Cut RTT and failure blast radius by placing compute nearer users.',
  disaster_recovery:
    'Named RPO/RTO and a practiced failover path instead of a wiki page.',
  connection_pool:
    'Stopped connection storms from exhausting the database pool.',
  query_batching:
    'Collapsed N+1 query patterns into batched round-trips.',
  tenant_isolation:
    'Capped or isolated the noisy tenant so others keep capacity.',
  request_coalescing:
    'Collapsed stampedes so one miss rebuilds the value for waiters.',
  ttl_jitter:
    'Spread expiry times so the cache does not miss in lockstep.',
  cache_aside:
    'Let the app load on miss — better for write-heavy paths than write-through.',
  write_through_cache:
    'Wrote cache and store together — fresher reads, slower writes.',
  async_materialized_view:
    'Refreshed derived data asynchronously so OLTP stays responsive.',
  cdc: 'Streamed changes reliably instead of dual-writing by hand.',
  transactional_outbox:
    'Published events in the same transaction as the business write.',
  saga_orchestrator:
    'Coordinated multi-step work with compensation instead of brittle 2PC.',
  timeout_budget:
    'Bound fan-out and downstream waits so one slow call cannot freeze the request.',
  circuit_breaker:
    'Failed fast when a dependency was sick instead of amplifying retries.',
  retry_budget:
    'Capped retry amplification with budgets and backoff.',
  bulkhead:
    'Isolated thread/connection pools so one dependency cannot starve others.',
  api_gateway:
    'Terminated and routed at the edge so many services do not each face the internet.',
  bff: 'Shaped responses for the client while keeping fan-out bounded.',
  dataloader:
    'Batched GraphQL resolver loads so field resolution is not N+1.',
  pubsub_broker:
    'Fan-out realtime messages through a broker instead of one API process.',
  sse: 'Pushed updates over SSE instead of expensive client polling.',
  long_poll_limit:
    'Capped concurrent long-polls so waiting clients cannot exhaust workers.',
}

const DISTRACTOR_BLURBS: Record<string, string> = {
  kafka:
    'A durable log does not fix this bottleneck; you paid ops cost without matching the failure mode.',
  sharding:
    'Splitting the database is a heavy hammer when a cheaper access-path or isolation fix exists.',
  multi_region:
    'Another region does not repair the local bottleneck that is burning CPU or connections.',
  elasticsearch:
    'A search cluster will not heal pool exhaustion, N+1, or retry storms by itself.',
  cdn: 'Edge caching does not fix OLTP contention, dual-writes, or app-layer fan-out bugs.',
  write_through_cache:
    'Write-through added write latency without solving the incident you were facing.',
  vertical_scale:
    'A bigger box masks the symptom briefly but does not fix the structural failure mode.',
}

function scenarioHelpedLine(scenario: Scenario, id: string): string {
  const concept = scenario.conceptsTaught[0] ?? 'this incident'
  const custom = HELPED_BLURBS[id]
  if (custom) return custom
  return `Matched the ${concept} bottleneck better than scaling logos at random.`
}

function scenarioDistractorLine(id: string, name: string): string {
  return (
    DISTRACTOR_BLURBS[id] ??
    `${name} was a tempting logo for this incident, but it does not address the binding constraint.`
  )
}

function sideEffectLine(name: string, pros: string[], cons: string[]): string {
  const pro = pros[0] ?? `${name} changes capacity or latency on some paths`
  const con = cons[0] ?? 'Adds cost and operational surface'
  return `${pro}. Trade-off: ${con.toLowerCase()}.`
}

export function explainChoices(
  scenario: Scenario,
  architecture: Architecture,
): ChoiceReview[] {
  const added = addedIds(scenario, architecture)
  const recommended = new Set(scenario.recommended)
  const distractors = new Set(scenario.distractors)

  return added.map((id) => {
    const c = getComponent(id)
    const name = c?.name ?? id
    const pros = c?.tradeoffs.pros ?? []
    const cons = c?.tradeoffs.cons ?? []

    let verdict: ChoiceVerdict = 'side_effect'
    let summary: string

    if (recommended.has(id)) {
      verdict = 'helped'
      summary = scenarioHelpedLine(scenario, id)
    } else if (distractors.has(id)) {
      verdict = 'distractor'
      summary = scenarioDistractorLine(id, name)
    } else {
      summary = sideEffectLine(name, pros, cons)
    }

    return { componentId: id, name, verdict, summary, pros, cons }
  })
}
