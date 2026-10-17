import React, { useState } from 'react';

export type ConcurrencyDiagramMode =
  | 'hierarchy'
  | 'race-condition'
  | 'deadlock'
  | 'fencing-tokens';

interface Props {
  initialMode?: ConcurrencyDiagramMode;
}

interface ModeMeta {
  id: ConcurrencyDiagramMode;
  label: string;
  accent: string;
  subtitle: string;
}

const MODES: ModeMeta[] = [
  {
    id: 'hierarchy',
    label: 'The 16 Concepts 5-Tier Stack',
    accent: '#38bdf8',
    subtitle: 'From CPU registers and in-memory threads up to database row locks and distributed fencing tokens',
  },
  {
    id: 'race-condition',
    label: 'Booking The Last Seat (Race Condition)',
    accent: '#f87171',
    subtitle: 'Check-then-act interleaved hazard when two concurrent threads book the final available ticket',
  },
  {
    id: 'deadlock',
    label: 'Deadlock & The 4 Coffman Rules',
    accent: '#fbbf24',
    subtitle: 'Circular wait resource graph and how strict lock hierarchy breaking prevents system deadlocks',
  },
  {
    id: 'fencing-tokens',
    label: 'Distributed Locks & Fencing Tokens',
    accent: '#34d399',
    subtitle: "Martin Kleppmann's GC pause proof: Why TTL leases expire and how monotonic fencing tokens guard storage",
  },
];

interface ConceptDetail {
  id: number;
  name: string;
  tier: string;
  tagline: string;
  hazard: string;
  solution: string;
  accent: string;
}

const CONCEPTS_LIST: ConceptDetail[] = [
  {
    id: 1,
    name: 'Processes vs. Threads',
    tier: 'Tier 1: Hardware & OS',
    tagline: 'Processes own isolated memory; threads share heap memory within the same process.',
    hazard: 'Thread data sharing is fast, but uncoordinated writes corrupt shared memory pointers.',
    solution: 'Use processes for fault-isolation; use threads with synchronization for high-throughput.',
    accent: '#38bdf8',
  },
  {
    id: 2,
    name: 'Concurrency vs. Parallelism',
    tier: 'Tier 1: Hardware & OS',
    tagline: 'Concurrency is dealing with lots of things at once; parallelism is doing lots of things at once.',
    hazard: 'Assuming multi-threading on a single CPU core is parallel; it creates CPU context-switch churn.',
    solution: 'Structure apps concurrently; scale parallel execution across physical CPU cores.',
    accent: '#38bdf8',
  },
  {
    id: 3,
    name: 'Race Conditions',
    tier: 'Tier 1: Hardware & OS',
    tagline: 'Uncontrolled thread interleaving makes outcome dependent on non-deterministic CPU scheduling.',
    hazard: 'Check-then-act bug: Thread A and Thread B both see seat=1 and double-book the final seat.',
    solution: 'Enclose read-modify-write operations inside atomic critical sections or CAS loops.',
    accent: '#f87171',
  },
  {
    id: 4,
    name: 'Critical Sections',
    tier: 'Tier 1: Hardware & OS',
    tagline: 'The protected code block accessing shared mutable state that must execute atomically.',
    hazard: 'Making critical sections too large causes extreme lock contention and thread queue pileup.',
    solution: 'Keep critical sections minimal: calculate outside, lock only during the shared state mutation.',
    accent: '#f87171',
  },
  {
    id: 5,
    name: 'Locks / Mutexes',
    tier: 'Tier 2: In-Memory Sync',
    tagline: 'Mutual exclusion primitive guaranteeing at most one thread enters the critical section.',
    hazard: 'Forgetting to release locks in error paths causes permanent thread lockouts.',
    solution: 'Always acquire locks with try-finally blocks or language RAII constructs.',
    accent: '#fbbf24',
  },
  {
    id: 6,
    name: 'Deadlocks',
    tier: 'Tier 2: In-Memory Sync',
    tagline: 'Two or more threads blocked forever, each holding a lock the other thread needs.',
    hazard: 'Thread 1 locks A then wants B; Thread 2 locks B then wants A (Circular Wait).',
    solution: 'Acquire locks in a globally deterministic order, or use tryLock with timeouts.',
    accent: '#fbbf24',
  },
  {
    id: 7,
    name: 'Semaphores',
    tier: 'Tier 2: In-Memory Sync',
    tagline: 'A counting synchronization primitive regulating access to N shared resource permits.',
    hazard: 'Leaking permits when tasks throw uncaught exceptions, permanently shrinking pool capacity.',
    solution: 'Use semaphores for rate-limiting, connection pools, and bulkhead concurrency throttling.',
    accent: '#fbbf24',
  },
  {
    id: 8,
    name: 'Compare-And-Swap (CAS)',
    tier: 'Tier 2: In-Memory Sync',
    tagline: 'Hardware CPU atomic instruction (CMPXCHG) updating memory only if value matches expected.',
    hazard: 'Under extreme contention, CAS retry loops spin-burn 100% CPU without making progress.',
    solution: 'Use LongAdder / padded cell arrays or back off exponentially under high contention.',
    accent: '#fbbf24',
  },
  {
    id: 9,
    name: 'Thread Pools',
    tier: 'Tier 3: Scaling Runtime',
    tagline: 'Reusing a bounded pool of pre-warmed worker threads to prevent thread creation overhead.',
    hazard: 'Unbounded task queues (LinkedBlockingQueue) buffer millions of requests until JVM Heap OOM.',
    solution: 'Bound queues strictly, configure custom RejectedExecutionHandler, and apply Little\'s Law.',
    accent: '#a78bfa',
  },
  {
    id: 10,
    name: 'Event Loops & Async I/O',
    tier: 'Tier 3: Scaling Runtime',
    tagline: 'Single thread multiplexing thousands of non-blocking sockets via OS epoll/kqueue.',
    hazard: 'Executing synchronous CPU-heavy work on the event loop freezes all other client connections.',
    solution: 'Offload CPU-intensive encryption or hashing to a separate worker thread pool.',
    accent: '#a78bfa',
  },
  {
    id: 11,
    name: 'Database Locking',
    tier: 'Tier 4: Database ACID',
    tagline: 'RDBMS Shared (S) and Exclusive (X) page/row locks managing concurrent transaction isolation.',
    hazard: 'Long-running transactions holding row locks block hot rows, causing thread pool exhaustion.',
    solution: 'Keep database transactions short; never make external HTTP calls inside an open SQL transaction.',
    accent: '#2dd4bf',
  },
  {
    id: 12,
    name: 'Pessimistic Locking',
    tier: 'Tier 4: Database ACID',
    tagline: 'SELECT ... FOR UPDATE locks the row immediately upon read until COMMIT/ROLLBACK.',
    hazard: 'High contention causes lock wait timeouts (504 Gateway Timeout) and database queue buildup.',
    solution: 'Use FOR UPDATE NOWAIT or SKIP LOCKED for high-throughput reservation pipelines.',
    accent: '#2dd4bf',
  },
  {
    id: 13,
    name: 'Optimistic Locking',
    tier: 'Tier 4: Database ACID',
    tagline: 'Reads without locking; updates only if version matches: UPDATE ... WHERE version = expected.',
    hazard: 'At 10,000 req/sec on 1 hot seat, 9,999 transactions fail and abort, wasting massive compute.',
    solution: 'Best for low-to-medium contention; switch to queue serialization or pessimistic under extreme hot spots.',
    accent: '#2dd4bf',
  },
  {
    id: 14,
    name: 'Distributed Locks',
    tier: 'Tier 5: Distributed Network',
    tagline: 'Mutual exclusion across multiple servers using external consensus (Redis Redlock, etcd, ZooKeeper).',
    hazard: 'Network partitions and GC pauses invalidate lease TTL while worker still believes it owns lock.',
    solution: 'Set adequate TTL, run renewal heartbeats (watchdog), and always combine with fencing tokens.',
    accent: '#34d399',
  },
  {
    id: 15,
    name: 'Fencing Tokens',
    tier: 'Tier 5: Distributed Network',
    tagline: 'Monotonically increasing sequence numbers issued with locks; storage rejects stale tokens.',
    hazard: 'Client 1 pauses on GC; lock expires; Client 2 gets lock; Client 1 wakes up and overwrites Client 2!',
    solution: 'Storage validates: UPDATE storage SET val=x, last_token=34 WHERE last_token < 34.',
    accent: '#34d399',
  },
  {
    id: 16,
    name: 'Idempotency & Message Queues',
    tier: 'Tier 5: Distributed Network',
    tagline: 'Ensures repeating the exact same request produces identical side effects without duplicates.',
    hazard: 'Network timeout causes client to retry checkout; without idempotency, user is billed twice!',
    solution: 'Store idempotency keys in Redis/DB with unique constraints and use transactional outbox queues.',
    accent: '#34d399',
  },
];

export default function ConcurrencySixteenConceptsDiagram({
  initialMode = 'hierarchy',
}: Props): React.ReactElement {
  const [activeMode, setActiveMode] = useState<ConcurrencyDiagramMode>(initialMode);
  const [selectedConceptId, setSelectedConceptId] = useState<number>(3);
  const [activeTabSub, setActiveTabSub] = useState<'race' | 'mutex' | 'cas'>('race');

  const currentMode = MODES.find((m) => m.id === activeMode) || MODES[0];
  const selectedConcept =
    CONCEPTS_LIST.find((c) => c.id === selectedConceptId) || CONCEPTS_LIST[2];

  const renderHierarchySvg = () => (
    <svg
      viewBox="0 0 880 400"
      style={{
        width: '100%',
        height: 'auto',
        background: '#0d0f1e',
        borderRadius: '10px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
      }}
    >
      <defs>
        <pattern id="csc-grid-1" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.12)" />
        </pattern>
        <marker id="csc-arrow-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
        <marker id="csc-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
        </marker>
      </defs>

      <rect width="880" height="400" fill="url(#csc-grid-1)" />

      {/* Tier 1: Hardware & OS */}
      <rect x="20" y="16" width="840" height="66" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.6" />
      <text x="35" y="38" fill="#38bdf8" fontSize="11" fontWeight="700">TIER 1: HARDWARE, OS &amp; RACE HAZARDS</text>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(1)}>
        <rect x="35" y="46" width="185" height="26" rx="4" fill={selectedConceptId === 1 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#38bdf8" />
        <text x="45" y="63" fill="#ffffff" fontSize="10" fontWeight="600">1. Processes vs. Threads</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(2)}>
        <rect x="235" y="46" width="195" height="26" rx="4" fill={selectedConceptId === 2 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#38bdf8" />
        <text x="245" y="63" fill="#ffffff" fontSize="10" fontWeight="600">2. Concurrency vs. Parallelism</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(3)}>
        <rect x="445" y="46" width="185" height="26" rx="4" fill={selectedConceptId === 3 ? 'rgba(248, 113, 113, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#f87171" />
        <text x="455" y="63" fill="#f87171" fontSize="10" fontWeight="700">3. Race Conditions</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(4)}>
        <rect x="645" y="46" width="200" height="26" rx="4" fill={selectedConceptId === 4 ? 'rgba(248, 113, 113, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#f87171" />
        <text x="655" y="63" fill="#f87171" fontSize="10" fontWeight="700">4. Critical Sections</text>
      </g>

      {/* Tier 2: In-Memory Synchronization */}
      <rect x="20" y="92" width="840" height="66" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#fbbf24" strokeWidth="1.6" />
      <text x="35" y="114" fill="#fbbf24" fontSize="11" fontWeight="700">TIER 2: IN-MEMORY SYNCHRONIZATION &amp; LOCKS</text>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(5)}>
        <rect x="35" y="122" width="185" height="26" rx="4" fill={selectedConceptId === 5 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#fbbf24" />
        <text x="45" y="139" fill="#ffffff" fontSize="10" fontWeight="600">5. Locks / Mutexes</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(6)}>
        <rect x="235" y="122" width="195" height="26" rx="4" fill={selectedConceptId === 6 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#fbbf24" />
        <text x="245" y="139" fill="#ffffff" fontSize="10" fontWeight="600">6. Deadlocks (Coffman)</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(7)}>
        <rect x="445" y="122" width="185" height="26" rx="4" fill={selectedConceptId === 7 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#fbbf24" />
        <text x="455" y="139" fill="#ffffff" fontSize="10" fontWeight="600">7. Semaphores</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(8)}>
        <rect x="645" y="122" width="200" height="26" rx="4" fill={selectedConceptId === 8 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#fbbf24" />
        <text x="655" y="139" fill="#ffffff" fontSize="10" fontWeight="600">8. Compare-And-Swap (CAS)</text>
      </g>

      {/* Tier 3: Scaling Single Process */}
      <rect x="20" y="168" width="840" height="66" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#a78bfa" strokeWidth="1.6" />
      <text x="35" y="190" fill="#a78bfa" fontSize="11" fontWeight="700">TIER 3: APPLICATION SCALING &amp; EVENT LOOPS</text>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(9)}>
        <rect x="35" y="198" width="395" height="26" rx="4" fill={selectedConceptId === 9 ? 'rgba(167, 139, 250, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#a78bfa" />
        <text x="45" y="215" fill="#ffffff" fontSize="10" fontWeight="600">9. Thread Pools &amp; Bounded Queues (Little's Law)</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(10)}>
        <rect x="445" y="198" width="400" height="26" rx="4" fill={selectedConceptId === 10 ? 'rgba(167, 139, 250, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#a78bfa" />
        <text x="455" y="215" fill="#ffffff" fontSize="10" fontWeight="600">10. Event Loops &amp; Non-Blocking I/O (epoll / kqueue)</text>
      </g>

      {/* Tier 4: Database ACID Concurrency */}
      <rect x="20" y="244" width="840" height="66" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#2dd4bf" strokeWidth="1.6" />
      <text x="35" y="266" fill="#2dd4bf" fontSize="11" fontWeight="700">TIER 4: DATABASE CONCURRENCY &amp; ROW LOCKS</text>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(11)}>
        <rect x="35" y="274" width="250" height="26" rx="4" fill={selectedConceptId === 11 ? 'rgba(45, 212, 191, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#2dd4bf" />
        <text x="45" y="291" fill="#ffffff" fontSize="10" fontWeight="600">11. Database Locks (S vs X)</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(12)}>
        <rect x="300" y="274" width="265" height="26" rx="4" fill={selectedConceptId === 12 ? 'rgba(45, 212, 191, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#2dd4bf" />
        <text x="310" y="291" fill="#ffffff" fontSize="10" fontWeight="600">12. Pessimistic (FOR UPDATE)</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(13)}>
        <rect x="580" y="274" width="265" height="26" rx="4" fill={selectedConceptId === 13 ? 'rgba(45, 212, 191, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#2dd4bf" />
        <text x="590" y="291" fill="#ffffff" fontSize="10" fontWeight="600">13. Optimistic (Version CAS)</text>
      </g>

      {/* Tier 5: Distributed Systems */}
      <rect x="20" y="320" width="840" height="66" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" strokeWidth="1.6" />
      <text x="35" y="342" fill="#34d399" fontSize="11" fontWeight="700">TIER 5: DISTRIBUTED CONCURRENCY &amp; CONSENSUS</text>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(14)}>
        <rect x="35" y="350" width="250" height="26" rx="4" fill={selectedConceptId === 14 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#34d399" />
        <text x="45" y="367" fill="#ffffff" fontSize="10" fontWeight="600">14. Distributed Locks (Redis/etcd)</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(15)}>
        <rect x="300" y="350" width="265" height="26" rx="4" fill={selectedConceptId === 15 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#34d399" />
        <text x="310" y="367" fill="#34d399" fontSize="10" fontWeight="700">15. Fencing Tokens (Kleppmann)</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedConceptId(16)}>
        <rect x="580" y="350" width="265" height="26" rx="4" fill={selectedConceptId === 16 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(30, 41, 59, 0.9)'} stroke="#34d399" />
        <text x="590" y="367" fill="#ffffff" fontSize="10" fontWeight="600">16. Idempotency &amp; Async Queues</text>
      </g>
    </svg>
  );

  const renderRaceConditionSvg = () => (
    <svg
      viewBox="0 0 880 390"
      style={{
        width: '100%',
        height: 'auto',
        background: '#0d0f1e',
        borderRadius: '10px',
        border: '1px solid rgba(248, 113, 113, 0.25)',
      }}
    >
      <defs>
        <pattern id="csc-grid-2" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.12)" />
        </pattern>
        <marker id="rc-arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
        </marker>
        <marker id="rc-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
        </marker>
        <marker id="rc-arrow-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
      </defs>

      <rect width="880" height="390" fill="url(#csc-grid-2)" />

      {/* Title */}
      <text x="24" y="28" fill="#f87171" fontSize="12" fontWeight="700">
        THE CONCERT TICKET DILEMMA: 1 SEAT REMAINING, 2 USERS CLICKING "BOOK" AT T = 0
      </text>

      {/* Shared Resource in Center */}
      <rect x="360" y="44" width="160" height="60" rx="8" fill="rgba(30, 41, 59, 0.95)" stroke="#fbbf24" strokeWidth="2" />
      <text x="440" y="66" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Shared Database / RAM</text>
      <text x="440" y="86" textAnchor="middle" fill="#ffffff" fontSize="12" fontFamily="monospace">available_seats = 1</text>

      {/* Flowing Conduits linking Alice and Bob to Shared State */}
      <path d="M 270 173 Q 315 74 358 74" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#rc-arrow-cyan)" />
      <path d="M 270 173 Q 315 74 358 74" className="interactive-diagram-flowing-path" stroke="#38bdf8" strokeWidth="2.2" fill="none" />

      <path d="M 610 173 Q 565 74 522 74" stroke="#f87171" strokeWidth="2" fill="none" markerEnd="url(#rc-arrow-red)" />
      <path d="M 610 173 Q 565 74 522 74" className="interactive-diagram-flowing-path" stroke="#f87171" strokeWidth="2.2" fill="none" />

      {/* User Alice Lane */}
      <rect x="30" y="118" width="240" height="240" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.8" />
      <text x="150" y="142" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">User Alice (Thread A)</text>
      <rect x="46" y="156" width="208" height="34" rx="4" fill="rgba(30, 41, 59, 0.8)" />
      <text x="56" y="177" fill="#e2e8f0" fontSize="9.5">T1: Read seats → Sees 1</text>
      <rect x="46" y="200" width="208" height="34" rx="4" fill="rgba(30, 41, 59, 0.8)" />
      <text x="56" y="221" fill="#e2e8f0" fontSize="9.5">T2: Check: (seats &gt; 0) = TRUE</text>
      <rect x="46" y="244" width="208" height="44" rx="4" fill="rgba(30, 41, 59, 0.8)" />
      <text x="56" y="261" fill="#e2e8f0" fontSize="9">T3: Charge Card: $150</text>
      <text x="56" y="277" fill="#34d399" fontSize="9">Payment SUCCESS</text>
      <rect x="46" y="298" width="208" height="44" rx="4" fill="rgba(6, 78, 59, 0.35)" stroke="#34d399" />
      <text x="56" y="316" fill="#34d399" fontSize="9.5" fontWeight="700">T4: seats = seats - 1 (0)</text>
      <text x="56" y="332" fill="#ffffff" fontSize="9">Alice Confirmed Seat #42</text>

      {/* User Bob Lane */}
      <rect x="610" y="118" width="240" height="240" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#f87171" strokeWidth="1.8" />
      <text x="730" y="142" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">User Bob (Thread B)</text>
      <rect x="626" y="156" width="208" height="34" rx="4" fill="rgba(30, 41, 59, 0.8)" />
      <text x="636" y="177" fill="#e2e8f0" fontSize="9.5">T1.5: Read seats → Sees 1 !</text>
      <rect x="626" y="200" width="208" height="34" rx="4" fill="rgba(30, 41, 59, 0.8)" />
      <text x="636" y="221" fill="#e2e8f0" fontSize="9.5">T2.5: Check: (seats &gt; 0) = TRUE</text>
      <rect x="626" y="244" width="208" height="44" rx="4" fill="rgba(30, 41, 59, 0.8)" />
      <text x="636" y="261" fill="#e2e8f0" fontSize="9">T3.5: Charge Card: $150</text>
      <text x="636" y="277" fill="#34d399" fontSize="9">Payment SUCCESS</text>
      <rect x="626" y="298" width="208" height="44" rx="4" fill="rgba(127, 29, 29, 0.45)" stroke="#f87171" />
      <text x="636" y="316" fill="#f87171" fontSize="9.5" fontWeight="700">T5: seats = seats - 1 (-1!)</text>
      <text x="636" y="332" fill="#fca5a5" fontSize="9">Bob ALSO Confirmed Seat #42!</text>

      {/* Center Interleaved Disaster Callout */}
      <rect x="290" y="130" width="300" height="228" rx="8" fill="rgba(127, 29, 29, 0.28)" stroke="#f87171" strokeWidth="2" />
      <text x="440" y="155" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">💥 THE CHECK-THEN-ACT HAZARD</text>
      <text x="305" y="180" fill="#e2e8f0" fontSize="9.5">1. Between Alice checking "seats &gt; 0"</text>
      <text x="305" y="196" fill="#e2e8f0" fontSize="9.5">   and writing "seats = 0", the thread</text>
      <text x="305" y="212" fill="#e2e8f0" fontSize="9.5">   is context-switched out!</text>
      <text x="305" y="234" fill="#fbbf24" fontSize="9.5">2. Bob reads the STALE value (1)</text>
      <text x="305" y="250" fill="#fbbf24" fontSize="9.5">   and passes the eligibility check.</text>
      <text x="305" y="272" fill="#f87171" fontSize="9.5">3. Outcome: 1 physical seat sold twice,</text>
      <text x="305" y="288" fill="#f87171" fontSize="9.5">   two credit cards charged, system</text>
      <text x="305" y="304" fill="#f87171" fontSize="9.5">   now has available_seats = -1!</text>
      <text x="440" y="338" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">Fix: Mutex / DB Lock / CAS Loop</text>
    </svg>
  );

  const renderDeadlockSvg = () => (
    <svg
      viewBox="0 0 880 390"
      style={{
        width: '100%',
        height: 'auto',
        background: '#0d0f1e',
        borderRadius: '10px',
        border: '1px solid rgba(251, 191, 36, 0.25)',
      }}
    >
      <defs>
        <pattern id="csc-grid-3" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.12)" />
        </pattern>
        <marker id="dl-arrow-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
        </marker>
        <marker id="dl-arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
        </marker>
        <marker id="dl-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
        </marker>
      </defs>

      <rect width="880" height="390" fill="url(#csc-grid-3)" />

      {/* Header */}
      <text x="24" y="28" fill="#fbbf24" fontSize="12" fontWeight="700">
        THE DEADLOCK CYCLE (CIRCULAR WAIT) &amp; THE 4 COFFMAN CONDITIONS
      </text>

      {/* Thread 1 Node */}
      <circle cx="200" cy="110" r="48" fill="rgba(30, 41, 59, 0.95)" stroke="#38bdf8" strokeWidth="2.5" />
      <text x="200" y="106" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Thread 1</text>
      <text x="200" y="122" textAnchor="middle" fill="#94a3b8" fontSize="9">(Transfer $100)</text>

      {/* Resource A Node */}
      <rect x="380" y="70" width="120" height="60" rx="6" fill="rgba(6, 78, 59, 0.45)" stroke="#34d399" strokeWidth="2" />
      <text x="440" y="96" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Lock Account A</text>
      <text x="440" y="114" textAnchor="middle" fill="#e2e8f0" fontSize="9">(Held by Thread 1)</text>

      {/* Thread 2 Node */}
      <circle cx="680" cy="110" r="48" fill="rgba(30, 41, 59, 0.95)" stroke="#f87171" strokeWidth="2.5" />
      <text x="680" y="106" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">Thread 2</text>
      <text x="680" y="122" textAnchor="middle" fill="#94a3b8" fontSize="9">(Transfer $50)</text>

      {/* Resource B Node */}
      <rect x="380" y="170" width="120" height="60" rx="6" fill="rgba(127, 29, 29, 0.45)" stroke="#f87171" strokeWidth="2" />
      <text x="440" y="196" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Lock Account B</text>
      <text x="440" y="214" textAnchor="middle" fill="#e2e8f0" fontSize="9">(Held by Thread 2)</text>

      {/* Directed Arrows showing Circular Wait Cycle */}
      {/* Thread 1 holds A */}
      <path d="M 248 100 L 372 100" stroke="#34d399" strokeWidth="2.5" fill="none" markerEnd="url(#dl-arrow-green)" />
      <text x="310" y="92" fill="#34d399" fontSize="9" fontWeight="700">HOLDS</text>

      {/* Thread 1 WAITS for B */}
      <path d="M 235 145 Q 310 200 372 200" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" fill="none" markerEnd="url(#dl-arrow-amber)" />
      <path d="M 235 145 Q 310 200 372 200" className="interactive-diagram-flowing-path" stroke="#fbbf24" strokeWidth="2" fill="none" />
      <text x="260" y="190" fill="#fbbf24" fontSize="9" fontWeight="700">WAITS FOR</text>

      {/* Thread 2 holds B */}
      <path d="M 632 200 L 508 200" stroke="#f87171" strokeWidth="2.5" fill="none" markerEnd="url(#dl-arrow-red)" />
      <text x="560" y="192" fill="#f87171" fontSize="9" fontWeight="700">HOLDS</text>

      {/* Thread 2 WAITS for A */}
      <path d="M 645 100 Q 580 80 508 80" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" fill="none" markerEnd="url(#dl-arrow-amber)" />
      <path d="M 645 100 Q 580 80 508 80" className="interactive-diagram-flowing-path" stroke="#fbbf24" strokeWidth="2" fill="none" />
      <text x="540" y="72" fill="#fbbf24" fontSize="9" fontWeight="700">WAITS FOR</text>

      {/* Bottom Breakdown of 4 Coffman Conditions */}
      <rect x="24" y="250" width="832" height="125" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(251, 191, 36, 0.3)" />
      <text x="38" y="272" fill="#fbbf24" fontSize="11" fontWeight="700">THE 4 COFFMAN CONDITIONS (ALL 4 REQUIRED FOR DEADLOCK)</text>
      
      <rect x="38" y="284" width="190" height="78" rx="5" fill="rgba(30, 41, 59, 0.7)" />
      <text x="48" y="302" fill="#ffffff" fontSize="9.5" fontWeight="700">1. Mutual Exclusion</text>
      <text x="48" y="318" fill="#94a3b8" fontSize="8.5">Resource cannot be</text>
      <text x="48" y="332" fill="#94a3b8" fontSize="8.5">shared; only 1 thread</text>
      <text x="48" y="346" fill="#94a3b8" fontSize="8.5">can hold it at a time.</text>

      <rect x="242" y="284" width="190" height="78" rx="5" fill="rgba(30, 41, 59, 0.7)" />
      <text x="252" y="302" fill="#ffffff" fontSize="9.5" fontWeight="700">2. Hold and Wait</text>
      <text x="252" y="318" fill="#94a3b8" fontSize="8.5">Thread holds 1 lock</text>
      <text x="252" y="332" fill="#94a3b8" fontSize="8.5">while actively waiting</text>
      <text x="252" y="346" fill="#94a3b8" fontSize="8.5">for another lock.</text>

      <rect x="446" y="284" width="190" height="78" rx="5" fill="rgba(30, 41, 59, 0.7)" />
      <text x="456" y="302" fill="#ffffff" fontSize="9.5" fontWeight="700">3. No Preemption</text>
      <text x="456" y="318" fill="#94a3b8" fontSize="8.5">Locks cannot be</text>
      <text x="456" y="332" fill="#94a3b8" fontSize="8.5">forcibly taken away;</text>
      <text x="456" y="346" fill="#94a3b8" fontSize="8.5">released only voluntarily.</text>

      <rect x="650" y="284" width="190" height="78" rx="5" fill="rgba(6, 78, 59, 0.35)" stroke="#34d399" />
      <text x="660" y="302" fill="#34d399" fontSize="9.5" fontWeight="700">4. Circular Wait (Break It!)</text>
      <text x="660" y="318" fill="#e2e8f0" fontSize="8.5">Cycle: T1→A→T2→B→T1.</text>
      <text x="660" y="334" fill="#34d399" fontSize="8.5" fontWeight="700">Fix: Sort keys before lock!</text>
      <text x="660" y="348" fill="#94a3b8" fontSize="8">Always lock min(A,B) first!</text>
    </svg>
  );

  const renderFencingTokensSvg = () => (
    <svg
      viewBox="0 0 880 390"
      style={{
        width: '100%',
        height: 'auto',
        background: '#0d0f1e',
        borderRadius: '10px',
        border: '1px solid rgba(52, 211, 153, 0.25)',
      }}
    >
      <defs>
        <pattern id="csc-grid-4" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.12)" />
        </pattern>
        <marker id="fc-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
        </marker>
        <marker id="fc-arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
        </marker>
        <marker id="fc-arrow-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
      </defs>

      <rect width="880" height="390" fill="url(#csc-grid-4)" />

      {/* Header */}
      <text x="24" y="28" fill="#34d399" fontSize="12" fontWeight="700">
        MARTIN KLEPPMANN'S DISTRIBUTED LOCK FLAW &amp; FENCING TOKEN DEFENSE
      </text>

      {/* Lock Service (Redis / ZooKeeper) */}
      <rect x="330" y="48" width="220" height="66" rx="8" fill="rgba(30, 41, 59, 0.95)" stroke="#fbbf24" strokeWidth="2" />
      <text x="440" y="70" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Lock Service (etcd / Redis)</text>
      <text x="440" y="88" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Issues Monotonic Fencing Token</text>
      <text x="440" y="104" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="monospace">token = ++counter</text>

      {/* Client 1 (Zombie Node after GC Pause) */}
      <rect x="30" y="140" width="235" height="140" rx="8" fill="rgba(127, 29, 29, 0.25)" stroke="#f87171" strokeWidth="1.8" />
      <text x="147" y="164" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Client 1 (Zombie)</text>
      <text x="42" y="184" fill="#e2e8f0" fontSize="9">1. Acquires lock with token = 33</text>
      <text x="42" y="200" fill="#fca5a5" fontSize="9">2. HITS 60-SEC STOP-THE-WORLD GC!</text>
      <text x="42" y="218" fill="#94a3b8" fontSize="8.5">   (Lock TTL of 10s silently expires)</text>
      <text x="42" y="238" fill="#f87171" fontSize="9">3. Wakes up, believes it still has lock,</text>
      <text x="42" y="254" fill="#f87171" fontSize="9">   sends write with token = 33!</text>

      {/* Client 2 (Active Node) */}
      <rect x="615" y="140" width="235" height="140" rx="8" fill="rgba(6, 78, 59, 0.25)" stroke="#34d399" strokeWidth="1.8" />
      <text x="732" y="164" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Client 2 (Healthy)</text>
      <text x="627" y="184" fill="#e2e8f0" fontSize="9">1. Acquires lock after TTL expiry</text>
      <text x="627" y="200" fill="#34d399" fontSize="9">2. Receives new token = 34</text>
      <text x="627" y="218" fill="#e2e8f0" fontSize="9">3. Writes successfully to storage</text>
      <text x="627" y="236" fill="#34d399" fontSize="9" fontWeight="700">   with token = 34</text>
      <text x="627" y="254" fill="#94a3b8" fontSize="8.5">4. Storage records max_token = 34</text>

      {/* Arrows from Lock Service to Clients */}
      <path d="M 360 114 L 230 144" stroke="#f87171" strokeWidth="1.8" fill="none" markerEnd="url(#fc-arrow-red)" />
      <path d="M 520 114 L 650 144" stroke="#34d399" strokeWidth="2.2" fill="none" markerEnd="url(#fc-arrow-green)" />

      {/* Storage Service in Bottom Center */}
      <rect x="300" y="270" width="280" height="106" rx="8" fill="rgba(15, 23, 42, 0.95)" stroke="#38bdf8" strokeWidth="2" />
      <text x="440" y="294" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Storage / Database (Validation Gate)</text>
      <text x="315" y="314" fill="#34d399" fontSize="9.5">✓ Client 2 (token=34 &gt; 0): ACCEPTED</text>
      <text x="315" y="332" fill="#94a3b8" fontSize="9">   Storage updates last_token = 34</text>
      <text x="315" y="352" fill="#f87171" fontSize="9.5" fontWeight="700">✗ Client 1 (token=33 &lt; 34): REJECTED!</text>
      <text x="315" y="368" fill="#fca5a5" fontSize="8.5">   Stale token error thrown (Corrupt Write Prevented!)</text>

      {/* Client 1 and Client 2 writing to Storage */}
      <path d="M 265 240 L 320 274" stroke="#f87171" strokeWidth="2.2" strokeDasharray="4 4" fill="none" markerEnd="url(#fc-arrow-red)" />
      <path d="M 615 240 L 560 274" stroke="#34d399" strokeWidth="2.5" fill="none" markerEnd="url(#fc-arrow-green)" />
      <path d="M 615 240 L 560 274" className="interactive-diagram-flowing-path" stroke="#34d399" strokeWidth="2.5" fill="none" />
    </svg>
  );

  return (
    <div
      className="interactive-diagram-container"
      style={{
        fontFamily: 'var(--ifm-font-family-base)',
        background: '#0b0f19',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '12px',
        padding: '1.25rem',
        margin: '1.5rem 0',
        color: '#f8fafc',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .csc-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={currentMode.accent} strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff' }}>
              Concurrency Was HARD Until I Learned These 16 Concepts
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{currentMode.subtitle}</div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {MODES.map((m) => {
            const isActive = m.id === activeMode;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMode(m.id)}
                style={{
                  background: isActive ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.85)',
                  color: isActive ? m.accent : '#cbd5e1',
                  border: `1px solid ${isActive ? m.accent : 'rgba(148, 163, 184, 0.25)'}`,
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main SVG Canvas */}
      <div style={{ marginBottom: '1.1rem' }}>
        {activeMode === 'hierarchy'
          ? renderHierarchySvg()
          : activeMode === 'race-condition'
            ? renderRaceConditionSvg()
            : activeMode === 'deadlock'
              ? renderDeadlockSvg()
              : renderFencingTokensSvg()}
      </div>

      {/* Bottom Interactive Concept Deep-Dive Grid */}
      <div
        className="csc-split-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '46% 52%',
          justifyContent: 'space-between',
          alignItems: 'start',
          gap: '1rem',
        }}
      >
        {/* Left: Scrollable Concept Directory */}
        <div
          style={{
            background: '#0c0e17',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            padding: '0.75rem',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
            Click Any Concept to Inspect Hazard &amp; Principal Solution
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {CONCEPTS_LIST.map((c) => {
              const isSelected = c.id === selectedConcept.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedConceptId(c.id)}
                  style={{
                    textAlign: 'left',
                    background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.7)',
                    border: `1px solid ${isSelected ? c.accent : 'rgba(148, 163, 184, 0.18)'}`,
                    borderRadius: '5px',
                    padding: '0.38rem 0.55rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? c.accent : '#e2e8f0' }}>
                    {c.id}. {c.name}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                    {c.tier.split(':')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Concept Deep Inspection Card */}
        <div
          style={{
            background: '#0c0e17',
            borderRadius: '8px',
            border: `1px solid ${selectedConcept.accent}`,
            padding: '0.9rem 1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
              Concept #{selectedConcept.id}: {selectedConcept.name}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: selectedConcept.accent,
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${selectedConcept.accent}`,
                borderRadius: '999px',
                padding: '0.12rem 0.5rem',
              }}
            >
              {selectedConcept.tier}
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.55rem', fontStyle: 'italic' }}>
            "{selectedConcept.tagline}"
          </div>

          <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginBottom: '0.4rem' }}>
            <strong>Production Hazard:</strong> {selectedConcept.hazard}
          </div>

          <div
            style={{
              fontSize: '0.78rem',
              color: '#6ee7b7',
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '0.5rem 0.65rem',
              borderRadius: '6px',
              borderLeft: `3px solid ${selectedConcept.accent}`,
            }}
          >
            <strong>Principal Solution:</strong> {selectedConcept.solution}
          </div>
        </div>
      </div>
    </div>
  );
}
