export interface LibraryChapter {
  id: string
  title: string
  source: string
  body: string
  startChallenge?: string
}

export const LIBRARY: LibraryChapter[] = [
  {
    id: 'caching-hot-keys',
    title: 'Hot keys before logos',
    source: 'Notes from system-design caching docs',
    startChallenge: 'L03',
    body: `When a tiny key set owns most reads, the primary dies of repetition, not of "not enough microservices".

Measure hit potential. Put a cache on the hot path. Then own invalidation.

Wrong move: sharding or multi-region before you know whether the working set fits in memory.`,
  },
  {
    id: 'queues-vs-kafka',
    title: 'Queue when work is slow; log when fan-out is the product',
    source: 'Message queues / event-driven notes',
    startChallenge: 'L07',
    body: `Synchronous heavy work on the request thread loses to bursts. A queue + worker buys latency back and invents lag as a metric.

Kafka earns its keep for durable high-throughput streams with multiple independent consumers — not for every email job.`,
  },
  {
    id: 'geo-consistency',
    title: 'RTT, consistency, and DR are different levers',
    source: 'Distributed systems / CAP / DR notes',
    startChallenge: 'L18',
    body: `One region cannot be close to everyone. CDN and multi-region move bytes and compute.

Eventual consistency is a product decision under that physics.

Disaster recovery is practiced failover with RPO/RTO — backups alone are not a plan.`,
  },
  {
    id: 'drop-your-book',
    title: 'Add your own book notes',
    source: 'User library slot',
    body: `Drop chapter notes here later (markdown/TS config). Link each chapter to a startChallenge level id to keep the study → incident → reward loop.`,
  },
]
