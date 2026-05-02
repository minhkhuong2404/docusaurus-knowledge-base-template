---
id: distributed-locking
title: Distributed Locking
sidebar_label: Distributed Locking
description: Designing safe distributed locks with leases, fencing tokens, and failure handling across Redis, ZooKeeper, and Kubernetes.
tags: [distributed-locking, lease, fencing-token, redis, zookeeper, kubernetes, coordination]
---

# Distributed Locking

> A distributed lock coordinates mutually exclusive work across multiple processes or nodes.

## Table of Contents

- [Beginner View](#beginner-view)
- [Why Naive Locks Fail](#why-naive-locks-fail)
- [Senior Deep Dive](#senior-deep-dive)
  - [Leases and Fencing Tokens](#leases-and-fencing-tokens)
  - [Safety and Liveness Goals](#safety-and-liveness-goals)
  - [Backend Choices](#backend-choices)
- [Patterns](#patterns)
  - [Redis Lease Pattern](#redis-lease-pattern)
  - [Database Advisory Lock Pattern](#database-advisory-lock-pattern)
  - [Leader Election Pattern](#leader-election-pattern)
- [Failure Modes and Mitigations](#failure-modes-and-mitigations)
- [How Distributed Locks Work Internally](#how-distributed-locks-work-internally)
  - [Lock Acquisition](#lock-acquisition)
  - [Lock Renewal](#lock-renewal)
  - [Lock Release](#lock-release)
  - [Failure Detection](#failure-detection)
- [Redis Lock Implementation](#redis-lock-implementation)
  - [Basic Redis Lock](#basic-redis-lock)
  - [RedLock Algorithm](#redlock-algorithm)
  - [RedLock Criticisms](#redlock-criticisms)
- [ZooKeeper Lock Implementation](#zookeeper-lock-implementation)
  - [Basic ZooKeeper Lock](#basic-zookeeper-lock)
  - [ZooKeeper Leader Election](#zookeeper-leader-election)
  - [ZooKeeper Recipes](#zookeeper-recipes)
- [Kubernetes Lease Implementation](#kubernetes-lease-implementation)
  - [Kubernetes Lease Resource](#kubernetes-lease-resource)
  - [Leader Election with Lease](#leader-election-with-lease)
  - [Kubernetes Coordination Patterns](#kubernetes-coordination-patterns)
- [Database Lock Implementation](#database-lock-implementation)
  - [Advisory Locks](#advisory-locks)
  - [Row-Level Locks](#row-level-locks)
  - [Table-Level Locks](#table-level-locks)
- [Leader Election Algorithms](#leader-election-algorithms)
  - [Bully Algorithm](#bully-algorithm)
  - [Ring Algorithm](#ring-algorithm)
  - [Raft-based Election](#raft-based-election)
- [Distributed Coordination Patterns](#distributed-coordination-patterns)
  - [Barrier Synchronization](#barrier-synchronization)
  - [Distributed Semaphore](#distributed-semaphore)
  - [Distributed Counter](#distributed-counter)
  - [Distributed Queue](#distributed-queue)
- [Failure Detection and Recovery](#failure-detection-and-recovery)
  - [Heartbeat Mechanisms](#heartbeat-mechanisms)
  - [Failure Detectors](#failure-detectors)
  - [Recovery Strategies](#recovery-strategies)
- [Lock Metrics and Observability](#lock-metrics-and-observability)
  - [Key Metrics](#key-metrics)
  - [Alerting](#alerting)
  - [Debugging](#debugging)
- [Real-World Implementations](#real-world-implementations)
  - [Redis](#redis)
  - [ZooKeeper](#zookeeper)
  - [etcd](#etcd)
  - [Kubernetes](#kubernetes)
  - [Consul](#consul)
  - [Chubby](#chubby)
- [Integration Patterns](#integration-patterns)
  - [Spring Integration](#spring-integration)
  - [Kubernetes Operator](#kubernetes-operator)
  - [Sidecar Pattern](#sidecar-pattern)
- [Pros and Cons](#pros-and-cons)
  - [Redis Locks](#redis-locks)
  - [ZooKeeper Locks](#zookeeper-locks)
  - [etcd Locks](#etcd-locks)
  - [Kubernetes Leases](#kubernetes-leases)
  - [Database Locks](#database-locks)
- [Interview Questions](#interview-questions)
- [Senior Deep Dive: Advanced Topics](#senior-deep-dive-advanced-topics)
  - [Lock Contention Analysis](#lock-contention-analysis)
  - [Lock Granularity](#lock-granularity)
  - [Lock Hierarchies](#lock-hierarchies)
  - [Distributed Deadlock Detection](#distributed-deadlock-detection)
  - [Lock-Free Algorithms](#lock-free-algorithms)
  - [Optimistic Concurrency](#optimistic-concurrency)
- [Additional Resources](#additional-resources)
- [Best Practices](#best-practices)

---

## Beginner View

Use distributed locking when exactly one worker should perform an operation at a time:
- Scheduled billing job
- Leader-only background compaction
- Single owner of resource migration

Basic pattern:
1. Acquire lock with TTL
2. Execute critical section
3. Renew lease if long-running
4. Release lock

---

## Why Naive Locks Fail

Naive pattern:
```text
SET lock_key = worker-A
...work...
DEL lock_key
```

Problems:
- Worker crash may leave lock stuck forever
- Network pause may let lock expire while worker still writing
- Clock assumptions create split ownership

Always use lease + ownership token checks.

---

## Senior Deep Dive

### Leases and Fencing Tokens

A lease prevents permanent deadlock, but lease alone is not enough.

**Fencing token** (monotonic number) is required for write safety:
- Lock service returns token 101 to worker A
- Later returns token 102 to worker B
- Storage accepts only highest token

If worker A resumes after GC pause, its stale token is rejected.

```java
public record LockGrant(String ownerId, long fencingToken, Instant expiresAt) {}
```

### Safety and Liveness Goals

- **Safety**: at most one valid writer at a time
- **Liveness**: progress continues despite crashes/network delays

### Backend Choices

| Backend | Strengths | Risks |
|---|---|---|
| Redis (`SET NX PX`) | Simple, fast | Requires careful failover semantics |
| ZooKeeper/etcd | Strong coordination primitives | Operational complexity |
| Kubernetes Lease | Native for k8s workloads | Limited beyond k8s control plane context |

---

## Patterns

### Redis Lease Pattern

```text
SET lock:jobA owner-1 NX PX 30000
```
Release only if owner matches value (Lua compare-and-delete).

### Database Advisory Lock Pattern

Useful when lock scope is tightly coupled to DB transaction and throughput is moderate.

### Leader Election Pattern

When many operations are "leader-only," election can replace many fine-grained locks.

---

## Failure Modes and Mitigations

- GC pause exceeds lease TTL -> stale writer risk
- Network partition isolates lock holder
- Lock storm causes thundering retries

Mitigations:
- Fencing token validation in data store
- Jittered retries and bounded retry windows
- Lock metrics: acquisition latency, contention, expiry count
- Avoid long critical sections; split into smaller idempotent units

---

## How Distributed Locks Work Internally

### Lock Acquisition

```
1. Generate unique owner ID
2. Try to set lock key with TTL
3. If successful, record fencing token
4. If failed, wait and retry
```

### Lock Renewal

```
1. Check if lock still owned by current owner
2. Extend TTL if still owned
3. Fail if lock expired or owned by another
```

### Lock Release

```
1. Verify ownership
2. Delete lock key atomically
3. Handle case where lock already expired
```

### Failure Detection

```
1. Monitor lock holder heartbeat
2. Detect timeout or crash
3. Allow new acquisition after grace period
```

---

## Redis Lock Implementation

### Basic Redis Lock

```java
public class RedisLock {
    private final RedisTemplate<String, String> redisTemplate;
    private final String lockKey;
    private final String ownerId;
    private final long leaseTimeMs;

    public boolean tryLock() {
        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, ownerId, leaseTimeMs, TimeUnit.MILLISECONDS);
        return Boolean.TRUE.equals(acquired);
    }

    public void unlock() {
        String script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
            """;
        redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(lockKey),
            ownerId
        );
    }
}
```

### RedLock Algorithm

RedLock uses multiple independent Redis instances for higher safety.

```java
public class RedLock {
    private final List<RedisLock> locks;
    private final int quorum;

    public boolean tryLock() {
        int acquired = 0;
        for (RedisLock lock : locks) {
            if (lock.tryLock()) {
                acquired++;
            }
        }
        return acquired >= quorum;
    }

    public void unlock() {
        locks.forEach(RedisLock::unlock);
    }
}
```

### RedLock Criticisms

- Time assumptions across nodes
- Clock synchronization issues
- Network partition handling
- Not truly linearizable

---

## ZooKeeper Lock Implementation

### Basic ZooKeeper Lock

```java
public class ZooKeeperLock {
    private final ZooKeeper zk;
    private final String lockPath;
    private String currentPath;
    private String watchPath;

    public boolean tryLock() throws Exception {
        // Create ephemeral sequential node
        currentPath = zk.create(lockPath + "/lock-",
            new byte[0],
            ZooDefs.Ids.OPEN_ACL_UNSAFE,
            CreateMode.EPHEMERAL_SEQUENTIAL);

        // Get all children
        List<String> children = zk.getChildren(lockPath, false);
        Collections.sort(children);

        // Check if we're the first
        String firstNode = children.get(0);
        if (currentPath.endsWith(firstNode)) {
            return true; // We have the lock
        }

        // Watch the previous node
        int index = children.indexOf(currentPath.substring(lockPath.length() + 1));
        watchPath = lockPath + "/" + children.get(index - 1);

        // Set watcher and wait
        CountDownLatch latch = new CountDownLatch(1);
        zk.exists(watchPath, event -> {
            if (event.getType() == EventType.NodeDeleted) {
                latch.countDown();
            }
        });

        latch.await();
        return true;
    }

    public void unlock() throws Exception {
        zk.delete(currentPath, -1);
    }
}
```

### ZooKeeper Leader Election

```java
public class LeaderElection {
    private final ZooKeeper zk;
    private final String electionPath;
    private String currentNode;

    public void electLeader() throws Exception {
        // Create ephemeral sequential node
        currentNode = zk.create(electionPath + "/node-",
            new byte[0],
            ZooDefs.Ids.OPEN_ACL_UNSAFE,
            CreateMode.EPHEMERAL_SEQUENTIAL);

        // Check if we're the leader
        List<String> children = zk.getChildren(electionPath, false);
        Collections.sort(children);

        if (currentNode.endsWith(children.get(0))) {
            becomeLeader();
        } else {
            watchPreviousNode(children);
        }
    }

    private void watchPreviousNode(List<String> children) throws Exception {
        int index = children.indexOf(
            currentNode.substring(electionPath.length() + 1));
        String previousNode = electionPath + "/" + children.get(index - 1);

        zk.exists(previousNode, event -> {
            if (event.getType() == EventType.NodeDeleted) {
                try {
                    electLeader();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    private void becomeLeader() {
        System.out.println("I am the leader!");
    }
}
```

### ZooKeeper Recipes

ZooKeeper provides built-in recipes for common coordination patterns:
- **Leader election**: `LeaderElectionSupport`
- **Barrier**: `DistributedBarrier`
- **Queue**: `DistributedQueue`
- **Lock**: `InterProcessMutex` (Curator)

---

## Kubernetes Lease Implementation

### Kubernetes Lease Resource

```yaml
apiVersion: coordination.k8s.io/v1
kind: Lease
metadata:
  name: my-lock
spec:
  holderIdentity: worker-1
  leaseDurationSeconds: 30
  acquireTime: "2024-01-01T00:00:00Z"
  renewTime: "2024-01-01T00:00:25Z"
```

### Leader Election with Lease

```java
public class KubernetesLeaderElection {
    private final KubernetesClient kubernetesClient;
    private final String leaseName;
    private final String namespace;
    private final String identity;

    public boolean tryBecomeLeader() {
        Lease lease = kubernetesClient.leases()
            .inNamespace(namespace)
            .withName(leaseName)
            .get();

        if (lease == null) {
            // Create new lease
            Lease newLease = new LeaseBuilder()
                .withNewMetadata()
                .withName(leaseName)
                .endMetadata()
                .withNewSpec()
                .withHolderIdentity(identity)
                .withLeaseDurationSeconds(30)
                .endSpec()
                .build();

            kubernetesClient.leases()
                .inNamespace(namespace)
                .create(newLease);

            return true;
        }

        // Check if lease is expired
        Instant now = Instant.now();
        Instant renewTime = lease.getSpec().getRenewTime();
        Duration leaseDuration = Duration.ofSeconds(
            lease.getSpec().getLeaseDurationSeconds());

        if (renewTime.plus(leaseDuration).isBefore(now)) {
            // Lease expired, try to acquire
            lease.getSpec().setHolderIdentity(identity);
            lease.getSpec().setRenewTime(now);

            kubernetesClient.leases()
                .inNamespace(namespace)
                .withName(leaseName)
                .replace(lease);

            return true;
        }

        return false;
    }

    public void renewLease() {
        Lease lease = kubernetesClient.leases()
            .inNamespace(namespace)
            .withName(leaseName)
            .get();

        if (lease != null &&
            identity.equals(lease.getSpec().getHolderIdentity())) {
            lease.getSpec().setRenewTime(Instant.now());
            kubernetesClient.leases()
                .inNamespace(namespace)
                .withName(leaseName)
                .replace(lease);
        }
    }
}
```

### Kubernetes Coordination Patterns

Kubernetes provides several coordination primitives:
- **Lease**: Simple leader election
- **ConfigMap**: Shared configuration
- **Endpoints**: Service discovery
- **Resource locks**: `ResourceLock` interface

---

## Database Lock Implementation

### Advisory Locks

PostgreSQL advisory locks are application-level locks not tied to rows.

```sql
-- Acquire lock
SELECT pg_advisory_lock(12345);

-- Try to acquire lock (non-blocking)
SELECT pg_try_advisory_lock(12345);

-- Release lock
SELECT pg_advisory_unlock(12345);

-- Session-level lock
SELECT pg_advisory_xact_lock(12345);
```

```java
@Repository
public class AdvisoryLockRepository {
    @PersistenceContext
    private EntityManager entityManager;

    public boolean tryLock(long lockId) {
        Boolean result = (Boolean) entityManager
            .createNativeQuery("SELECT pg_try_advisory_lock(:lockId)")
            .setParameter("lockId", lockId)
            .getSingleResult();
        return Boolean.TRUE.equals(result);
    }

    public void unlock(long lockId) {
        entityManager
            .createNativeQuery("SELECT pg_advisory_unlock(:lockId)")
            .setParameter("lockId", lockId)
            .executeUpdate();
    }
}
```

### Row-Level Locks

```sql
-- Select for update
SELECT * FROM jobs WHERE id = 1 FOR UPDATE;

-- Select for update skip locked
SELECT * FROM jobs
WHERE status = 'PENDING'
ORDER BY created_at
LIMIT 10
FOR UPDATE SKIP LOCKED;
```

```java
@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT j FROM Job j WHERE j.id = :id")
    Optional<Job> findByIdWithLock(@Param("id") Long id);

    @Query(value = "SELECT * FROM jobs WHERE status = 'PENDING' " +
                   "ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED",
           nativeQuery = true)
    List<Job> findPendingJobsForProcessing();
}
```

### Table-Level Locks

```sql
-- Lock table
LOCK TABLE jobs IN EXCLUSIVE MODE;

-- Lock table in share mode
LOCK TABLE jobs IN SHARE MODE;
```

---

## Leader Election Algorithms

### Bully Algorithm

The bully algorithm selects the highest-ID node as leader.

```java
public class BullyElection {
    private final String nodeId;
    private final Map<String, Node> nodes;
    private String leaderId;

    public void startElection() {
        // Send election message to higher ID nodes
        nodes.values().stream()
            .filter(node -> node.getId().compareTo(nodeId) > 0)
            .forEach(node -> node.sendElection(nodeId));

        // Wait for responses
        waitForResponses();

        // If no higher ID nodes responded, become leader
        if (noHigherIdResponded()) {
            becomeLeader();
        }
    }

    public void onElectionMessage(String fromNodeId) {
        if (nodeId.compareTo(fromNodeId) > 0) {
            // Send OK response
            nodes.get(fromNodeId).sendOk(nodeId);
            // Start new election
            startElection();
        }
    }

    public void onOkMessage(String fromNodeId) {
        // Higher ID node is alive
        recordResponse(fromNodeId);
    }

    private void becomeLeader() {
        leaderId = nodeId;
        nodes.values().forEach(node -> node.sendCoordinator(nodeId));
    }
}
```

### Ring Algorithm

The ring algorithm passes a token around a ring of nodes.

```java
public class RingElection {
    private final String nodeId;
    private final String nextNodeId;
    private String leaderId;
    private boolean electionActive = false;

    public void startElection() {
        electionActive = true;
        sendElectionMessage(nodeId);
    }

    public void onElectionMessage(String candidateId) {
        if (candidateId.compareTo(nodeId) > 0) {
            // Forward election message
            sendElectionMessage(candidateId);
        } else if (candidateId.equals(nodeId)) {
            // Election completed, we are the leader
            becomeLeader();
        } else {
            // Send leader message
            sendLeaderMessage(leaderId);
        }
    }

    public void onLeaderMessage(String newLeaderId) {
        leaderId = newLeaderId;
        electionActive = false;
    }

    private void becomeLeader() {
        leaderId = nodeId;
        sendLeaderMessage(nodeId);
    }
}
```

### Raft-based Election

Raft uses a term-based election with randomized timeouts.

```java
public class RaftNode {
    private final String nodeId;
    private final List<RaftNode> peers;
    private State state = State.FOLLOWER;
    private long currentTerm = 0;
    private String votedFor = null;
    private String leaderId = null;

    private ScheduledFuture<?> electionTimeout;

    public void start() {
        resetElectionTimeout();
    }

    private void resetElectionTimeout() {
        if (electionTimeout != null) {
            electionTimeout.cancel();
        }

        long timeout = ThreadLocalRandom.current()
            .nextLong(150, 300);

        electionTimeout = scheduler.schedule(() -> {
            startElection();
        }, timeout, TimeUnit.MILLISECONDS);
    }

    private void startElection() {
        state = State.CANDIDATE;
        currentTerm++;
        votedFor = nodeId;

        int votes = 1; // Vote for self
        for (RaftNode peer : peers) {
            if (peer.requestVote(currentTerm, nodeId)) {
                votes++;
            }
        }

        if (votes > peers.size() / 2) {
            becomeLeader();
        } else {
            state = State.FOLLOWER;
            resetElectionTimeout();
        }
    }

    public boolean requestVote(long term, String candidateId) {
        if (term > currentTerm) {
            currentTerm = term;
            state = State.FOLLOWER;
            votedFor = null;
        }

        if (votedFor == null || votedFor.equals(candidateId)) {
            votedFor = candidateId;
            return true;
        }

        return false;
    }

    private void becomeLeader() {
        state = State.LEADER;
        leaderId = nodeId;
        sendHeartbeats();
    }

    private void sendHeartbeats() {
        for (RaftNode peer : peers) {
            peer.appendEntries(currentTerm, nodeId);
        }
    }

    public void appendEntries(long term, String leaderId) {
        if (term > currentTerm) {
            currentTerm = term;
            state = State.FOLLOWER;
            votedFor = null;
        }

        this.leaderId = leaderId;
        resetElectionTimeout();
    }
}
```

---

## Distributed Coordination Patterns

### Barrier Synchronization

Barrier synchronization waits for all participants to reach a point.

```java
public class DistributedBarrier {
    private final ZooKeeper zk;
    private final String barrierPath;
    private final int expectedParticipants;

    public void await() throws Exception {
        // Create ephemeral node
        String myNode = zk.create(barrierPath + "/participant-",
            new byte[0],
            ZooDefs.Ids.OPEN_ACL_UNSAFE,
            CreateMode.EPHEMERAL);

        // Wait for all participants
        while (true) {
            List<String> participants = zk.getChildren(barrierPath, false);
            if (participants.size() >= expectedParticipants) {
                break;
            }
            Thread.sleep(100);
        }

        // Delete my node
        zk.delete(myNode, -1);
    }
}
```

### Distributed Semaphore

Distributed semaphore limits concurrent access to a resource.

```java
public class DistributedSemaphore {
    private final RedisTemplate<String, String> redisTemplate;
    private final String semaphoreKey;
    private final int maxPermits;

    public boolean tryAcquire() {
        String script = """
            local current = redis.call("GET", KEYS[1])
            if current == false then
                current = 0
            else
                current = tonumber(current)
            end
            if current < tonumber(ARGV[1]) then
                redis.call("INCR", KEYS[1])
                return 1
            else
                return 0
            end
            """;

        Long result = redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(semaphoreKey),
            String.valueOf(maxPermits)
        );

        return result != null && result == 1;
    }

    public void release() {
        redisTemplate.opsForValue().decrement(semaphoreKey);
    }
}
```

### Distributed Counter

Distributed counter provides atomic increments across nodes.

```java
public class DistributedCounter {
    private final RedisTemplate<String, String> redisTemplate;
    private final String counterKey;

    public long increment() {
        return redisTemplate.opsForValue().increment(counterKey);
    }

    public long incrementBy(long delta) {
        return redisTemplate.opsForValue().increment(counterKey, delta);
    }

    public long get() {
        String value = redisTemplate.opsForValue().get(counterKey);
        return value != null ? Long.parseLong(value) : 0;
    }
}
```

### Distributed Queue

Distributed queue provides FIFO ordering across nodes.

```java
public class DistributedQueue {
    private final RedisTemplate<String, String> redisTemplate;
    private final String queueKey;

    public void push(String item) {
        redisTemplate.opsForList().rightPush(queueKey, item);
    }

    public String pop() {
        return redisTemplate.opsForList().leftPop(queueKey);
    }

    public String pop(long timeout, TimeUnit unit) {
        return redisTemplate.opsForList().leftPop(queueKey, timeout, unit);
    }
}
```

---

## Failure Detection and Recovery

### Heartbeat Mechanisms

```java
public class HeartbeatMonitor {
    private final Map<String, Instant> lastHeartbeat = new ConcurrentHashMap<>();
    private final Duration timeout;

    public void recordHeartbeat(String nodeId) {
        lastHeartbeat.put(nodeId, Instant.now());
    }

    public boolean isAlive(String nodeId) {
        Instant last = lastHeartbeat.get(nodeId);
        return last != null &&
            Duration.between(last, Instant.now()).compareTo(timeout) < 0;
    }

    public Set<String> getAliveNodes() {
        return lastHeartbeat.entrySet().stream()
            .filter(entry -> isAlive(entry.getKey()))
            .map(Map.Entry::getKey)
            .collect(Collectors.toSet());
    }
}
```

### Failure Detectors

**Phi Accrual Failure Detector**:

```java
public class PhiAccrualFailureDetector {
    private final Map<String, ArrivalWindow> arrivalWindows = new ConcurrentHashMap<>();
    private final double phiThreshold = 8.0;

    public void report(String nodeId) {
        arrivalWindows.computeIfAbsent(nodeId, k -> new ArrivalWindow())
            .record(Instant.now());
    }

    public boolean isAlive(String nodeId) {
        ArrivalWindow window = arrivalWindows.get(nodeId);
        if (window == null) {
            return false;
        }

        double phi = window.phi(Instant.now());
        return phi < phiThreshold;
    }

    private static class ArrivalWindow {
        private final Queue<Instant> arrivals = new LinkedList<>();
        private final Duration windowSize = Duration.ofSeconds(10);

        public void record(Instant now) {
            arrivals.add(now);
            while (!arrivals.isEmpty() &&
                   Duration.between(arrivals.peek(), now).compareTo(windowSize) > 0) {
                arrivals.poll();
            }
        }

        public double phi(Instant now) {
            if (arrivals.isEmpty()) {
                return Double.POSITIVE_INFINITY;
            }

            Instant last = arrivals.peekLast();
            Duration elapsed = Duration.between(last, now);
            double meanInterval = calculateMeanInterval();

            if (meanInterval == 0) {
                return Double.POSITIVE_INFINITY;
            }

            return elapsed.toMillis() / meanInterval;
        }

        private double calculateMeanInterval() {
            if (arrivals.size() < 2) {
                return 0;
            }

            List<Instant> list = new ArrayList<>(arrivals);
            long total = 0;
            for (int i = 1; i < list.size(); i++) {
                total += Duration.between(list.get(i - 1), list.get(i)).toMillis();
            }
            return (double) total / (list.size() - 1);
        }
    }
}
```

### Recovery Strategies

```java
public class LockRecoveryService {
    private final LockService lockService;
    private final FailureDetector failureDetector;

    public void recoverStaleLocks() {
        List<LockInfo> locks = lockService.getAllLocks();

        for (LockInfo lock : locks) {
            if (!failureDetector.isAlive(lock.getOwnerId())) {
                // Owner is dead, recover the lock
                lockService.forceRelease(lock.getLockId());
            }
        }
    }

    public void handleLockExpiry(String lockId) {
        LockInfo lock = lockService.getLockInfo(lockId);

        if (lock != null && !failureDetector.isAlive(lock.getOwnerId())) {
            // Lock expired and owner is dead
            lockService.forceRelease(lockId);
        }
    }
}
```

---

## Lock Metrics and Observability

### Key Metrics

```java
public class LockMetrics {
    private final MeterRegistry meterRegistry;
    private final Counter acquisitionCounter;
    private final Counter acquisitionFailureCounter;
    private final Timer acquisitionTimer;
    private final Gauge contentionGauge;

    public LockMetrics(MeterRegistry registry, String lockName) {
        this.meterRegistry = registry;
        this.acquisitionCounter = Counter.builder("lock.acquisitions")
            .tag("lock", lockName)
            .register(registry);
        this.acquisitionFailureCounter = Counter.builder("lock.acquisition.failures")
            .tag("lock", lockName)
            .register(registry);
        this.acquisitionTimer = Timer.builder("lock.acquisition.duration")
            .tag("lock", lockName)
            .register(registry);
        this.contentionGauge = Gauge.builder("lock.contention", this, LockMetrics::calculateContention)
            .tag("lock", lockName)
            .register(registry);
    }

    public void recordAcquisition(Duration duration) {
        acquisitionCounter.increment();
        acquisitionTimer.record(duration);
    }

    public void recordFailure() {
        acquisitionFailureCounter.increment();
    }

    private double calculateContention() {
        // Calculate contention ratio
        return acquisitionFailureCounter.count() /
               (acquisitionCounter.count() + 1.0);
    }
}
```

### Alerting

```yaml
# Prometheus alert rules
groups:
  - name: lock_alerts
    rules:
      - alert: HighLockContention
        expr: lock_contention > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High lock contention for {{ $labels.lock }}

      - alert: LockAcquisitionTimeout
        expr: rate(lock_acquisition_failures[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: Lock acquisition timeouts for {{ $labels.lock }}

      - alert: StaleLockDetected
        expr: lock_stale_count > 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: Stale locks detected
```

### Debugging

```java
public class LockDebugger {
    private final LockService lockService;

    public void debugLock(String lockId) {
        LockInfo info = lockService.getLockInfo(lockId);

        System.out.println("Lock Debug Info:");
        System.out.println("  Lock ID: " + info.getLockId());
        System.out.println("  Owner: " + info.getOwnerId());
        System.out.println("  Acquired at: " + info.getAcquiredAt());
        System.out.println("  Expires at: " + info.getExpiresAt());
        System.out.println("  Fencing token: " + info.getFencingToken());
        System.out.println("  Renewal count: " + info.getRenewalCount());
        System.out.println("  Is expired: " + info.isExpired());
    }

    public void dumpAllLocks() {
        List<LockInfo> locks = lockService.getAllLocks();

        System.out.println("All Locks:");
        for (LockInfo lock : locks) {
            System.out.println("  " + lock.getLockId() +
                " (owner: " + lock.getOwnerId() +
                ", expired: " + lock.isExpired() + ")");
        }
    }
}
```

---

## Real-World Implementations

### Redis

Redis provides distributed locking via `SET NX PX` command.

```bash
# Acquire lock
SET lock:mykey myvalue NX PX 30000

# Release lock (Lua script)
EVAL "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end" 1 lock:mykey myvalue
```

Libraries:
- **Redisson**: Full-featured Redis client with distributed locks
- **Spring Data Redis**: Basic lock support
- **Jedis**: Low-level Redis client

### ZooKeeper

ZooKeeper provides strong consistency guarantees for coordination.

```java
// Using Curator
InterProcessMutex lock = new InterProcessMutex(
    curatorFramework,
    "/locks/mylock"
);

try {
    if (lock.acquire(10, TimeUnit.SECONDS)) {
        // Critical section
    }
} finally {
    lock.release();
}
```

Features:
- Ephemeral nodes for automatic cleanup
- Watchers for event notification
- Sequential nodes for ordering
- Built-in recipes

### etcd

etcd provides distributed key-value store with strong consistency.

```bash
# Acquire lock
etcdctl lock mylock "myvalue"

# Release lock
etcdctl unlock <lock-key>
```

Features:
- Linearizable reads/writes
- Lease mechanism
- Watch API
- Transaction API

### Kubernetes

Kubernetes provides Lease resource for leader election.

```yaml
apiVersion: coordination.k8s.io/v1
kind: Lease
metadata:
  name: my-lease
spec:
  holderIdentity: pod-1
  leaseDurationSeconds: 15
```

Libraries:
- **client-go**: Official Go client
- **Fabric8**: Java client
- **Java Kubernetes Client**: Alternative Java client

### Consul

Consul provides distributed locking via session API.

```bash
# Create session
consul session create -ttl 30s -name mylock

# Acquire lock
consul kv put -acquire -session <session-id> lock/mykey myvalue

# Release lock
consul kv delete -session <session-id> lock/mykey
```

Features:
- Session-based locking
- Health checking
- Service discovery
- KV store

### Chubby

Chubby is Google's internal lock service (inspired ZooKeeper).

Features:
- Paxos-based consensus
- Strong consistency
- File-like interface
- Event notifications

---

## Integration Patterns

### Spring Integration

```java
@Configuration
public class LockConfiguration {

    @Bean
    public LockRegistry lockRegistry(RedisConnectionFactory connectionFactory) {
        return RedisLockRegistry.create(connectionFactory, "lock:");
    }

    @Bean
    public RedisLockTemplate redisLockTemplate(RedisTemplate<String, String> redisTemplate) {
        return new RedisLockTemplate(redisTemplate);
    }
}

@Service
public class OrderService {
    private final LockRegistry lockRegistry;

    @LockRegistryLock(name = "order-#{#orderId}")
    public void processOrder(Long orderId) {
        // Critical section
    }
}
```

### Kubernetes Operator

```go
package main

import (
    "context"
    "fmt"
    "time"

    "k8s.io/client-go/kubernetes"
    "k8s.io/client-go/tools/leaderelection"
    "k8s.io/client-go/tools/leaderelection/resourcelock"
    "k8s.io/client-go/tools/record"
)

func runLeaderElection(clientset *kubernetes.Clientset) {
    lockConfig := resourcelock.ResourceLockConfig{
        Identity:      "my-app",
        EventRecorder: &record.FakeRecorder{},
    }

    lock, err := resourcelock.New(
        resourcelock.LeasesResourceLock,
        "default",
        "my-app",
        clientset.CoreV1(),
        resourcelock.ResourceLockConfig{Identity: "my-app"},
    )
    if err != nil {
        panic(err)
    }

    leaderConfig := leaderelection.LeaderElectionConfig{
        Lock:          lock,
        LeaseDuration: 15 * time.Second,
        RenewDeadline: 10 * time.Second,
        RetryPeriod:   2 * time.Second,
        Callbacks: leaderelection.LeaderCallbacks{
            OnStartedLeading: func(ctx context.Context) {
                fmt.Println("Became leader")
                runLeader(ctx)
            },
            OnStoppedLeading: func() {
                fmt.Println("Stopped leading")
            },
        },
    }

    leaderElection, err := leaderelection.NewLeaderElector(leaderConfig)
    if err != nil {
        panic(err)
    }

    leaderElection.Run(context.Background())
}

func runLeader(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            return
        default:
            // Do leader work
            time.Sleep(time.Second)
        }
    }
}
```

### Sidecar Pattern

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: my-app:latest
  - name: lock-sidecar
    image: lock-sidecar:latest
    env:
    - name: LOCK_KEY
      value: "my-lock"
    - name: LOCK_TTL
      value: "30"
```

---

## Pros and Cons

### Redis Locks

**Pros:**
- Simple and fast
- Low latency
- Easy to set up
- Good for high-throughput scenarios

**Cons:**
- Requires careful failover handling
- Clock synchronization issues
- Not truly linearizable
- RedLock has known issues

### ZooKeeper Locks

**Pros:**
- Strong consistency guarantees
- Automatic cleanup with ephemeral nodes
- Built-in recipes
- Reliable coordination

**Cons:**
- Higher latency
- Operational complexity
- Requires ZooKeeper cluster
- More resource-intensive

### etcd Locks

**Pros:**
- Strong consistency
- Linearizable operations
- Built-in lease mechanism
- Good for Kubernetes environments

**Cons:**
- Higher latency than Redis
- Operational complexity
- Requires etcd cluster
- Limited to key-value operations

### Kubernetes Leases

**Pros:**
- Native to Kubernetes
- Automatic cleanup
- Good for control plane coordination
- No external dependencies

**Cons:**
- Limited to Kubernetes
- Not suitable for high-throughput
- API server dependency
- Limited functionality

### Database Locks

**Pros:**
- Strong consistency
- Transactional
- No external dependencies
- Good for DB-bound operations

**Cons:**
- Database dependency
- Limited scalability
- Potential for deadlocks
- Higher latency

---

## Interview Questions

### Q: Why is lease-based locking safer than permanent locks?

**A:** Leases expire automatically if a holder crashes or gets partitioned, preventing indefinite deadlock. Permanent locks require manual cleanup and are prone to orphaned ownership.

### Q: What problem do fencing tokens solve?

**A:** They prevent stale lock holders from writing after losing lock ownership. Storage accepts only the highest token, so old owners are rejected.

### Q: Is Redis lock enough for critical financial writes? Why or why not?

**A:** Usually no by itself, because failover timing and partition edges can violate strict correctness assumptions. For critical money movement, combine stronger coordination and storage-level safeguards.

### Q: How do you safely release a Redis lock without deleting someone else's lock?

**A:** Store a random owner value at acquire, then release via atomic compare-and-delete Lua script. Never `DEL` by key alone.

### Q: When should you use leader election instead of per-task locks?

**A:** Use leader election when one coordinator should own a stream of tasks or cluster-wide decisions. Use per-task locks when ownership must be fine-grained and parallel.

### Q: How would you design lock observability and SLOs?

**A:** Track acquisition latency, contention rate, lease expiries, and stale-write rejections. Define SLOs on lock success latency and correctness incidents, not just throughput.

### Q: What can still go wrong even with a lease?

**A:** Clock skew, GC pauses, network partitions, and delayed packets can make a client act on an expired lease. Leases reduce risk but must be combined with fencing/idempotency.

### Q: Compare ZooKeeper/etcd locks vs Redis locks for correctness guarantees.

**A:** ZooKeeper/etcd provide stronger linearizable coordination semantics for correctness-critical locking. Redis locks are simpler and fast but better suited to best-effort coordination.

### Q: How do you handle lock renewal for long-running operations?

**A:** Implement a background renewal thread that extends the lease before expiry, with exponential backoff on failure. Monitor renewal success and abort operation if renewal fails.

### Q: What is the RedLock algorithm and what are its criticisms?

**A:** RedLock uses multiple independent Redis instances and requires majority to acquire lock. Criticisms include time assumptions, clock synchronization issues, and not being truly linearizable.

### Q: How do you detect and recover from stale locks?

**A:** Track lock holder heartbeats, use failure detectors, and implement recovery jobs that force-release locks from dead owners after a grace period.

### Q: What is the difference between advisory locks and row locks?

**A:** Advisory locks are application-level locks not tied to any row, while row locks protect specific database rows. Advisory locks are more flexible but require application coordination.

### Q: How do you implement distributed semaphores?

**A:** Use a counter with atomic increments/decrements, or use a queue-based approach where workers wait for their turn. Ensure proper cleanup on worker failure.

### Q: What is the phi accrual failure detector?

**A:** A failure detector that uses a statistical model of inter-arrival times to compute a phi value representing the likelihood of failure. Higher phi means more likely failure.

### Q: How do you handle lock contention in high-throughput systems?

**A:** Use lock striping, reduce critical section size, implement exponential backoff, consider optimistic concurrency, and monitor contention metrics.

### Q: What is the difference between optimistic and pessimistic locking?

**A:** Optimistic locking checks for conflicts at commit time and retries on failure. Pessimistic locking acquires locks before access and blocks others. Choose based on contention level.

### Q: How do you implement distributed barriers?

**A:** Use a counter or set of ephemeral nodes where each participant registers, and wait until all participants have arrived before proceeding.

### Q: What are the tradeoffs between different lock backends?

**A:** Redis is fast but less consistent; ZooKeeper/etcd are consistent but slower; database locks are transactional but limited; Kubernetes leases are native but constrained.

### Q: How do you test distributed locking implementations?

**A:** Use chaos engineering to simulate failures, network partitions, and clock skew. Test with high contention, long-running operations, and crash scenarios.

### Q: What is the CAP theorem's relevance to distributed locking?

**A:** During network partitions, you must choose between consistency (no two holders) and availability (anyone can acquire). Most lock systems choose consistency over availability.

---

## Senior Deep Dive: Advanced Topics

### Lock Contention Analysis

```java
public class LockContentionAnalyzer {
    private final Map<String, ContentionStats> stats = new ConcurrentHashMap<>();

    public void recordAcquisition(String lockId, Duration waitTime) {
        stats.computeIfAbsent(lockId, k -> new ContentionStats())
            .recordAcquisition(waitTime);
    }

    public void recordFailure(String lockId) {
        stats.computeIfAbsent(lockId, k -> new ContentionStats())
            .recordFailure();
    }

    public ContentionReport generateReport(String lockId) {
        ContentionStats stat = stats.get(lockId);
        if (stat == null) {
            return ContentionReport.empty();
        }

        return new ContentionReport(
            lockId,
            stat.getTotalAcquisitions(),
            stat.getFailureRate(),
            stat.getAverageWaitTime(),
            stat.getP95WaitTime(),
            stat.getP99WaitTime(),
            stat.getContentionScore()
        );
    }

    private static class ContentionStats {
        private final AtomicLong totalAcquisitions = new AtomicLong();
        private final AtomicLong failures = new AtomicLong();
        private final LongAdder totalWaitTime = new LongAdder();
        private final LongStreamSummary waitTimeSummary = new LongStreamSummary();

        public void recordAcquisition(Duration waitTime) {
            totalAcquisitions.incrementAndGet();
            totalWaitTime.add(waitTime.toMillis());
            waitTimeSummary.accept(waitTime.toMillis());
        }

        public void recordFailure() {
            failures.incrementAndGet();
        }

        public double getFailureRate() {
            long total = totalAcquisitions.get();
            return total > 0 ? (double) failures.get() / total : 0;
        }

        public Duration getAverageWaitTime() {
            long total = totalAcquisitions.get();
            return total > 0 ?
                Duration.ofMillis(totalWaitTime.sum() / total) :
                Duration.ZERO;
        }

        public Duration getP95WaitTime() {
            return Duration.ofMillis(waitTimeSummary.getQuantile(0.95));
        }

        public Duration getP99WaitTime() {
            return Duration.ofMillis(waitTimeSummary.getQuantile(0.99));
        }

        public double getContentionScore() {
            return getFailureRate() * 100;
        }
    }
}
```

### Lock Granularity

Choosing the right lock granularity is crucial for performance.

```java
// Coarse-grained lock (simple but high contention)
public class CoarseGrainedLock {
    private final Lock lock = new ReentrantLock();

    public void updateAccount(Long accountId, BigDecimal amount) {
        lock.lock();
        try {
            // Update account
        } finally {
            lock.unlock();
        }
    }
}

// Fine-grained lock (complex but low contention)
public class FineGrainedLock {
    private final Striped<Lock> locks = Striped.lock(1024);

    public void updateAccount(Long accountId, BigDecimal amount) {
        Lock lock = locks.get(accountId);
        lock.lock();
        try {
            // Update account
        } finally {
            lock.unlock();
        }
    }
}

// Hierarchical lock (balanced)
public class HierarchicalLock {
    private final Lock globalLock = new ReentrantLock();
    private final Map<Long, Lock> accountLocks = new ConcurrentHashMap<>();

    public void updateAccount(Long accountId, BigDecimal amount) {
        Lock accountLock = accountLocks.computeIfAbsent(
            accountId,
            k -> new ReentrantLock()
        );

        accountLock.lock();
        try {
            // Update account
        } finally {
            accountLock.unlock();
        }
    }

    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        // Lock in consistent order to prevent deadlock
        Long first = Math.min(fromId, toId);
        Long second = Math.max(fromId, toId);

        Lock firstLock = accountLocks.computeIfAbsent(first, k -> new ReentrantLock());
        Lock secondLock = accountLocks.computeIfAbsent(second, k -> new ReentrantLock());

        firstLock.lock();
        secondLock.lock();
        try {
            // Transfer
        } finally {
            secondLock.unlock();
            firstLock.unlock();
        }
    }
}
```

### Lock Hierarchies

Lock hierarchies prevent deadlocks by defining acquisition order.

```java
public class LockHierarchy {
    private final Map<String, Integer> lockLevels = Map.of(
        "global", 1,
        "account", 2,
        "transaction", 3
    );

    private final Map<String, Lock> locks = new ConcurrentHashMap<>();

    public void acquireLocks(List<String> lockNames) {
        // Sort by level to prevent deadlock
        List<String> sorted = lockNames.stream()
            .sorted(Comparator.comparing(this::getLockLevel))
            .toList();

        for (String lockName : sorted) {
            Lock lock = locks.computeIfAbsent(lockName, k -> new ReentrantLock());
            lock.lock();
        }
    }

    public void releaseLocks(List<String> lockNames) {
        // Release in reverse order
        List<String> sorted = lockNames.stream()
            .sorted(Comparator.comparing(this::getLockLevel).reversed())
            .toList();

        for (String lockName : sorted) {
            Lock lock = locks.get(lockName);
            if (lock != null) {
                lock.unlock();
            }
        }
    }

    private int getLockLevel(String lockName) {
        return lockLevels.getOrDefault(lockName, Integer.MAX_VALUE);
    }
}
```

### Distributed Deadlock Detection

```java
public class DistributedDeadlockDetector {
    private final Map<String, Set<String>> waitGraph = new ConcurrentHashMap<>();

    public void recordWait(String waiter, String holder) {
        waitGraph.computeIfAbsent(waiter, k -> new ConcurrentHashSet<>())
            .add(holder);
    }

    public void clearWait(String waiter, String holder) {
        Set<String> holders = waitGraph.get(waiter);
        if (holders != null) {
            holders.remove(holder);
        }
    }

    public Optional<List<String>> detectDeadlock() {
        // Find cycles in wait graph
        for (String node : waitGraph.keySet()) {
            List<String> cycle = findCycle(node, new HashSet<>(), new ArrayList<>());
            if (cycle != null) {
                return Optional.of(cycle);
            }
        }
        return Optional.empty();
    }

    private List<String> findCycle(String node, Set<String> visited, List<String> path) {
        if (visited.contains(node)) {
            // Found cycle
            int index = path.indexOf(node);
            return new ArrayList<>(path.subList(index, path.size()));
        }

        visited.add(node);
        path.add(node);

        Set<String> holders = waitGraph.get(node);
        if (holders != null) {
            for (String holder : holders) {
                List<String> cycle = findCycle(holder, new HashSet<>(visited), new ArrayList<>(path));
                if (cycle != null) {
                    return cycle;
                }
            }
        }

        path.remove(path.size() - 1);
        return null;
    }

    public void resolveDeadlock(List<String> cycle) {
        // Abort the first transaction in the cycle
        String victim = cycle.get(0);
        System.out.println("Aborting transaction: " + victim);
        // Implement abort logic
    }
}
```

### Lock-Free Algorithms

Lock-free algorithms avoid locks entirely using atomic operations.

```java
public class LockFreeCounter {
    private final AtomicLong counter = new AtomicLong(0);

    public long increment() {
        return counter.incrementAndGet();
    }

    public long get() {
        return counter.get();
    }
}

public class LockFreeStack<T> {
    private final AtomicReference<Node<T>> head = new AtomicReference<>();

    public void push(T value) {
        Node<T> newHead = new Node<>(value);
        Node<T> oldHead;
        do {
            oldHead = head.get();
            newHead.next = oldHead;
        } while (!head.compareAndSet(oldHead, newHead));
    }

    public T pop() {
        Node<T> oldHead;
        Node<T> newHead;
        do {
            oldHead = head.get();
            if (oldHead == null) {
                return null;
            }
            newHead = oldHead.next;
        } while (!head.compareAndSet(oldHead, newHead));

        return oldHead.value;
    }

    private static class Node<T> {
        final T value;
        Node<T> next;

        Node(T value) {
            this.value = value;
        }
    }
}
```

### Optimistic Concurrency

Optimistic concurrency checks for conflicts at commit time.

```java
public class OptimisticAccount {
    private final AtomicReference<AccountState> state;

    public OptimisticAccount(AccountState initialState) {
        this.state = new AtomicReference<>(initialState);
    }

    public boolean transfer(BigDecimal amount) {
        while (true) {
            AccountState current = state.get();

            if (current.getBalance().compareTo(amount) < 0) {
                return false; // Insufficient funds
            }

            AccountState newState = current.withBalance(
                current.getBalance().subtract(amount)
            );

            if (state.compareAndSet(current, newState)) {
                return true;
            }
            // Retry if CAS failed
        }
    }

    public BigDecimal getBalance() {
        return state.get().getBalance();
    }

    public static class AccountState {
        private final BigDecimal balance;
        private final long version;

        public AccountState(BigDecimal balance, long version) {
            this.balance = balance;
            this.version = version;
        }

        public AccountState withBalance(BigDecimal newBalance) {
            return new AccountState(newBalance, version + 1);
        }

        public BigDecimal getBalance() {
            return balance;
        }

        public long getVersion() {
            return version;
        }
    }
}
```

---

## Additional Resources

### Books
- "Distributed Systems: Principles and Paradigms" by Andrew Tanenbaum
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Release It!" by Michael Nygard

### Papers
- "Time, Clocks, and the Ordering of Events in a Distributed System" by Leslie Lamport
- "The Chubby lock service for loosely-coupled distributed systems" by Mike Burrows
- "Leases: An Efficient Fault-Tolerant Mechanism for Distributed File Cache Consistency" by Cary Gray and David Cheriton

### Tools
- **Redisson**: Redis distributed locks
- **Apache Curator**: ZooKeeper recipes
- **etcd**: Distributed key-value store
- **Kubernetes**: Lease resources

### Standards
- **XA**: Two-phase commit standard
- **JTA**: Java Transaction API
- **WS-Coordination**: Web services coordination

---

## Best Practices

### Lock Design
1. Always use leases with TTL
2. Implement fencing tokens for write safety
3. Use unique owner IDs
4. Make lock operations atomic

### Lock Acquisition
1. Implement exponential backoff on failure
2. Set reasonable timeouts
3. Monitor acquisition latency
4. Handle lock contention gracefully

### Lock Renewal
1. Renew before lease expires
2. Implement background renewal
3. Abort operation if renewal fails
4. Monitor renewal success rate

### Lock Release
1. Verify ownership before release
2. Use atomic compare-and-delete
3. Handle expired locks gracefully
4. Clean up resources on release

### Failure Handling
1. Detect stale locks automatically
2. Implement recovery mechanisms
3. Use failure detectors
4. Alert on lock issues

### Monitoring
1. Track lock acquisition metrics
2. Monitor contention rates
3. Alert on stale locks
4. Measure lock duration

### Testing
1. Test with network partitions
2. Simulate node failures
3. Test with high contention
4. Verify correctness under load

### Security
1. Use secure random owner IDs
2. Validate fencing tokens
3. Implement access control
4. Audit lock operations
