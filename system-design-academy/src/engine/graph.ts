import type { Architecture, GraphEdge, GraphNode } from '../types/game'

let edgeSeq = 0

export function resetEdgeSeq(): void {
  edgeSeq = 0
}

export function node(
  id: string,
  componentId: string,
  label?: string,
): GraphNode {
  return { id, componentId, label: label ?? componentId }
}

export function edge(source: string, target: string): GraphEdge {
  edgeSeq += 1
  return { id: `e${edgeSeq}`, source, target }
}

/** Classic Client → API → Postgres */
export function baseStack(): Architecture {
  resetEdgeSeq()
  return {
    nodes: [
      node('n-client', 'client', 'Client'),
      node('n-api', 'api', 'API'),
      node('n-db', 'postgres', 'PostgreSQL'),
    ],
    edges: [edge('n-client', 'n-api'), edge('n-api', 'n-db')],
  }
}

export function cloneArchitecture(a: Architecture): Architecture {
  return {
    nodes: a.nodes.map((n) => ({ ...n })),
    edges: a.edges.map((e) => ({ ...e })),
  }
}

/** Insert a component between API and DB (cache / queue pattern). */
export function withBetweenApiAndDb(
  base: Architecture,
  componentId: string,
  label: string,
): Architecture {
  const arch = cloneArchitecture(base)
  const id = `n-${componentId}`
  arch.nodes.push(node(id, componentId, label))
  arch.edges = arch.edges.filter(
    (e) => !(e.source === 'n-api' && e.target === 'n-db'),
  )
  arch.edges.push(edge('n-api', id), edge(id, 'n-db'))
  return arch
}

export function withExtraNode(
  base: Architecture,
  componentId: string,
  label: string,
  linkFrom = 'n-api',
): Architecture {
  const arch = cloneArchitecture(base)
  const id = `n-${componentId}`
  if (arch.nodes.some((n) => n.componentId === componentId)) return arch
  arch.nodes.push(node(id, componentId, label))
  arch.edges.push(edge(linkFrom, id))
  return arch
}

export function withLoadBalancer(base: Architecture): Architecture {
  const arch = cloneArchitecture(base)
  if (arch.nodes.some((n) => n.componentId === 'load_balancer')) return arch
  const id = 'n-lb'
  arch.nodes.push(node(id, 'load_balancer', 'Load Balancer'))
  arch.edges = arch.edges.filter(
    (e) => !(e.source === 'n-client' && e.target === 'n-api'),
  )
  arch.edges.push(edge('n-client', id), edge(id, 'n-api'))
  return arch
}

export function addComponentToArchitecture(
  base: Architecture,
  componentId: string,
): Architecture {
  const labels: Record<string, string> = {
    redis: 'Redis',
    cache_invalidation: 'Invalidation',
    read_replica: 'Read Replica',
    message_queue: 'Queue',
    kafka: 'Kafka',
    load_balancer: 'Load Balancer',
    horizontal_scale: 'API Replicas',
    vertical_scale: 'Bigger Box',
    rate_limiter: 'Rate Limiter',
    db_index: 'DB Index',
    partitioning: 'Partitioning',
    sharding: 'Sharding',
    consistent_hashing: 'Consistent Hash',
    cdn: 'CDN',
    elasticsearch: 'Elasticsearch',
    eventual_consistency: 'Eventual Consistency',
    distributed_lock: 'Distributed Lock',
    idempotency_keys: 'Idempotency',
    multi_region: 'Multi-region',
    disaster_recovery: 'DR',
    worker: 'Worker',
    connection_pool: 'Conn Pool',
    query_batching: 'Query Batch',
    tenant_isolation: 'Tenant Iso',
    request_coalescing: 'Coalesce',
    ttl_jitter: 'TTL Jitter',
    cache_aside: 'Cache-Aside',
    write_through_cache: 'Write-Through',
    async_materialized_view: 'Async MV',
    cdc: 'CDC',
    transactional_outbox: 'Outbox',
    saga_orchestrator: 'Saga',
    timeout_budget: 'Timeouts',
    circuit_breaker: 'Circuit Breaker',
    retry_budget: 'Retry Budget',
    bulkhead: 'Bulkhead',
    api_gateway: 'API Gateway',
    bff: 'BFF',
    dataloader: 'DataLoader',
    pubsub_broker: 'Pub/Sub',
    sse: 'SSE',
    long_poll_limit: 'LP Limit',
  }
  const label = labels[componentId] ?? componentId

  if (componentId === 'load_balancer') return withLoadBalancer(base)
  if (componentId === 'cdn') {
    const arch = cloneArchitecture(base)
    const id = 'n-cdn'
    arch.nodes.push(node(id, 'cdn', label))
    arch.edges = arch.edges.filter(
      (e) => !(e.source === 'n-client' && (e.target === 'n-api' || e.target === 'n-lb')),
    )
    const apiOrLb = arch.nodes.some((n) => n.id === 'n-lb') ? 'n-lb' : 'n-api'
    arch.edges.push(edge('n-client', id), edge(id, apiOrLb))
    return arch
  }
  if (
    ['redis', 'message_queue', 'kafka', 'read_replica'].includes(componentId)
  ) {
    return withBetweenApiAndDb(base, componentId, label)
  }
  return withExtraNode(base, componentId, label)
}

const CORE = ['client', 'api', 'postgres']

export function removeComponentFromArchitecture(
  base: Architecture,
  componentId: string,
): Architecture {
  if (CORE.includes(componentId)) return base
  const arch = cloneArchitecture(base)
  const removing = arch.nodes.filter((n) => n.componentId === componentId)
  if (removing.length === 0) return arch
  const removeIds = new Set(removing.map((n) => n.id))
  arch.nodes = arch.nodes.filter((n) => !removeIds.has(n.id))
  arch.edges = arch.edges.filter(
    (e) => !removeIds.has(e.source) && !removeIds.has(e.target),
  )

  const has = (id: string) => arch.nodes.some((n) => n.id === id)
  const hasOut = (id: string) => arch.edges.some((e) => e.source === id)

  if (has('n-client') && !hasOut('n-client')) {
    const next = has('n-cdn') ? 'n-cdn' : has('n-lb') ? 'n-lb' : 'n-api'
    if (has(next)) arch.edges.push(edge('n-client', next))
  }
  if (has('n-cdn') && !hasOut('n-cdn')) {
    const next = has('n-lb') ? 'n-lb' : 'n-api'
    if (has(next)) arch.edges.push(edge('n-cdn', next))
  }
  if (has('n-lb') && !hasOut('n-lb') && has('n-api')) {
    arch.edges.push(edge('n-lb', 'n-api'))
  }
  if (has('n-api') && !hasOut('n-api') && has('n-db')) {
    arch.edges.push(edge('n-api', 'n-db'))
  }
  return arch
}
