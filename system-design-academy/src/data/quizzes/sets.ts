export interface QuizQuestion {
  id: string
  stem: string
  choices: string[]
  answerIndex: number
  explain: string
}

export interface QuizSet {
  id: string
  title: string
  xp: number
  relatedLevel?: string
  questions: QuizQuestion[]
}

export const QUIZZES: QuizSet[] = [
  {
    id: 'quiz-cache',
    title: 'Hot reads & cache pressure',
    xp: 60,
    relatedLevel: 'L03',
    questions: [
      {
        id: 'q1',
        stem: 'DB CPU is 97% and 92% of reads hit the same 5% of keys. What is the binding constraint?',
        choices: [
          'Need Kafka for all reads',
          'Hot-key read amplification on the primary',
          'Missing multi-region failover',
          'Lack of consistent hashing',
        ],
        answerIndex: 1,
        explain:
          'A tiny hot set hammering the primary is a caching / offload problem before a global redesign.',
      },
      {
        id: 'q2',
        stem: 'You added Redis and latency crashed nicely — then price updates look wrong for minutes. What did you defer?',
        choices: [
          'CDN purge for HTML',
          'Cache invalidation / freshness',
          'Shard rebalancing',
          'Load balancer health checks',
        ],
        answerIndex: 1,
        explain: 'Caching without a freshness story creates stale business data.',
      },
      {
        id: 'q3',
        stem: 'Which change is most likely overengineering for a pure hot-read incident?',
        choices: [
          'Redis in front of the hot SKUs',
          'Read replica for broad analytics reads',
          'Immediate cross-region active-active with sharding',
          'An index on the lookup column',
        ],
        answerIndex: 2,
        explain: 'Reach for the lever that matches the bottleneck; logos are not progress.',
      },
    ],
  },
  {
    id: 'quiz-async',
    title: 'Queues, bursts, abuse',
    xp: 60,
    relatedLevel: 'L07',
    questions: [
      {
        id: 'q1',
        stem: 'Receipt upload inside the purchase HTTP request spikes p95 on bursts. Best first move?',
        choices: [
          'Shard Postgres immediately',
          'Accept quickly and process via queue + worker',
          'Add Elasticsearch',
          'Turn on multi-region',
        ],
        answerIndex: 1,
        explain: 'Pull slow work off the request thread; watch lag as the new SLO input.',
      },
      {
        id: 'q2',
        stem: 'Bots hit public search at 10× organic RPS. Scaling the fleet 10× is expensive. What protects the core?',
        choices: ['Rate limiting', 'Bigger single VM only', 'More replicas with no front door', 'Disabling indexes'],
        answerIndex: 0,
        explain: 'Shed abusive traffic; do not pay to serve scrapers.',
      },
      {
        id: 'q3',
        stem: 'When is Kafka a better fit than a simple queue?',
        choices: [
          'One background email per hour',
          'High-throughput durable streams with multiple consumers',
          'Caching HTML at the edge',
          'Adding a B-tree index',
        ],
        answerIndex: 1,
        explain: 'Kafka shines at fan-out and retention at volume — not every async job.',
      },
    ],
  },
  {
    id: 'quiz-geo',
    title: 'Consistency, region, recovery',
    xp: 70,
    relatedLevel: 'L18',
    questions: [
      {
        id: 'q1',
        stem: 'APAC users see 900ms p95 to a us-east-only API mostly from RTT. What actually moves the needle?',
        choices: [
          'Another Postgres index',
          'Bring compute/data closer (CDN / multi-region)',
          'Kafka on the read path',
          'Removing the load balancer',
        ],
        answerIndex: 1,
        explain: 'Distance is physics; place bytes and compute nearer to users.',
      },
      {
        id: 'q2',
        stem: 'Product accepts brief cart-count mismatch to keep global latency down. What did they choose?',
        choices: [
          'Strict serializability everywhere',
          'Eventual consistency as a product trade-off',
          'Turning off replicas',
          'Synchronous cross-region 2PC on every click',
        ],
        answerIndex: 1,
        explain: 'Consistency is a product knob, not a moral absolute.',
      },
      {
        id: 'q3',
        stem: 'Nightly backups and an outdated wiki do not meet a 15-minute RTO. You still need…',
        choices: [
          'A practiced DR/failover path with named RPO/RTO',
          'Only a prettier status page',
          'More frontend animations',
          'Deleting monitoring',
        ],
        answerIndex: 0,
        explain: 'DR is rehearsal + replication, not documentation cosplay.',
      },
    ],
  },
]
