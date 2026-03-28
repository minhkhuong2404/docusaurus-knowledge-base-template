---
id: redis-clustering-replication
title: "Redis Clustering, Replication & High Availability"
slug: redis-clustering-replication
description: Redis replication mechanics, Sentinel for HA failover, Redis Cluster sharding, and production deployment patterns for senior engineers.
tags: [redis, cluster, replication, sentinel, high-availability, backend]
---

# Redis Clustering, Replication & High Availability

---

## Replication

Redis uses **asynchronous master-replica replication**. All writes go to the master; replicas receive a copy asynchronously.

```
Master (read + write)
  ├── Replica 1 (read-only)  ← async replication stream
  ├── Replica 2 (read-only)
  └── Replica 3 (read-only)
```

### How Replication Works

```
1. Replica connects to master
2. Master sends RDB snapshot (FULLRESYNC)
3. While snapshot is being transferred, master buffers new write commands
4. Replica loads RDB, then applies buffered commands
5. Ongoing: master streams commands to replica via replication backlog
```

```bash
# redis.conf on replica
replicaof master-host 6379
replica-read-only yes

# Monitor replication lag
INFO replication
# replica_lag: seconds behind master
# master_repl_offset vs replica_repl_offset
```

### Replication Lag and Consistency

Redis replication is **asynchronous** by default — replicas may be behind the master. A failover during lag causes data loss.

```bash
# Semi-synchronous: master waits for at least N replicas to acknowledge writes
# (Best effort — not true synchronous)
min-replicas-to-write 1        # Must have 1 replica acknowledge before ACKing client
min-replicas-max-lag 10        # Replica must respond within 10 seconds
# If condition not met → master refuses writes (protects consistency)
```

**Read replicas for read scaling:**
```java
// Lettuce (Spring) read from replicas for read-heavy workloads
LettuceClientConfiguration config = LettuceClientConfiguration.builder()
    .readFrom(ReadFrom.REPLICA_PREFERRED)  // Prefer replica, fallback to master
    .build();
```

---

## Redis Sentinel — High Availability

Sentinel provides automatic failover for Redis without sharding. Consists of 3+ Sentinel processes (odd number for quorum).

```
                    ┌──────────────────────────────┐
                    │  Sentinel Cluster (quorum)   │
                    │  Sentinel 1                  │
                    │  Sentinel 2  ← majority vote │
                    │  Sentinel 3                  │
                    └──────────────────────────────┘
                              │ monitors
                              ↓
                         [ Master ]
                        /          \
               [Replica 1]      [Replica 2]
```

### Failover Process

```
1. Sentinel detects master is unreachable (subjective down)
2. If quorum Sentinels agree → objective down (ODOWN)
3. Sentinels elect a leader Sentinel
4. Leader promotes the most up-to-date replica to master
5. Other replicas reconfigure to follow new master
6. Old master (if it recovers) becomes a replica
```

```bash
# sentinel.conf
sentinel monitor mymaster 127.0.0.1 6379 2   # Quorum = 2
sentinel down-after-milliseconds mymaster 5000  # Unreachable for 5s = SDOWN
sentinel failover-timeout mymaster 10000        # Failover must complete in 10s
sentinel parallel-syncs mymaster 1             # 1 replica syncs at a time during failover
```

**Failover time:** Typically 15–30 seconds (detection + election + promotion). During this time: no writes (old master is down, new not yet promoted).

```java
// Spring Boot Sentinel configuration
@Bean
public RedisConnectionFactory redisConnectionFactory() {
    RedisSentinelConfiguration sentinelConfig = new RedisSentinelConfiguration()
        .master("mymaster")
        .sentinel("sentinel1", 26379)
        .sentinel("sentinel2", 26379)
        .sentinel("sentinel3", 26379);
    return new LettuceConnectionFactory(sentinelConfig);
}
```

---

## Redis Cluster — Horizontal Sharding

Redis Cluster shards data across multiple master nodes using **hash slots** — 16384 slots are distributed evenly.

```
16384 slots distributed across 3 masters:
┌────────────────┬────────────────┬────────────────┐
│ Master A       │ Master B       │ Master C       │
│ Slots 0–5460   │ Slots 5461–10922│ Slots 10923–16383│
│ └── Replica A  │ └── Replica B  │ └── Replica C  │
└────────────────┴────────────────┴────────────────┘
```

### How Slot Assignment Works

```bash
# Key → Slot mapping (CRC16 hash)
CLUSTER KEYSLOT mykey      # → e.g., 14328

# Keys with hash tags go to same slot
CLUSTER KEYSLOT "{user:123}.profile"  # Same slot as {user:123}.orders
CLUSTER KEYSLOT "{user:123}.orders"
```

**This matters for:** Multi-key commands, MGET, MSET, and Lua scripts — all keys must be in the same slot.

### MOVED and ASK Redirects

```
Client → Node A: GET mykey
← MOVED 14328 redis-node-c:6379   # Client must reconnect to correct node
Client → Node C: GET mykey
← "myvalue"
```

**Smart clients** (Lettuce, Jedis) handle redirects automatically and cache the slot routing table.

```bash
ASK 14328 redis-node-d:6379   # Temporary redirect during slot migration (resharding)
```

### Cluster Configuration

```bash
# Create cluster (minimum 3 masters, recommended 3 masters + 3 replicas)
redis-cli --cluster create \
  node1:6379 node2:6379 node3:6379 \
  node4:6379 node5:6379 node6:6379 \
  --cluster-replicas 1

# Check cluster status
CLUSTER INFO
CLUSTER NODES
CLUSTER SLOTS   # Shows slot→node mapping
```

### Cross-Slot Operations

```bash
# ❌ These fail in Cluster — keys on different slots
MSET user:1 "Alice" user:2 "Bob"       # Different slots!
MGET user:1 user:2
SUNIONSTORE result set1 set2

# ✅ Use hash tags to co-locate keys
MSET {user}.1 "Alice" {user}.2 "Bob"   # Same slot → works!
MGET {user}.1 {user}.2

# Or: accept the constraint and use per-key operations
GET user:1
GET user:2    # Two round-trips, but cluster-safe
```

### Spring Boot with Cluster

In production, enable topology refresh to handle slot migrations or node failures gracefully:

```java
@Configuration
public class ClusterConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisClusterConfiguration clusterConfig =
            new RedisClusterConfiguration(Arrays.asList(
                "redis-node1:6379", "redis-node2:6379", "redis-node3:6379"
            ));
        
        clusterConfig.setMaxRedirects(3);

        ClusterTopologyRefreshOptions topologyRefreshOptions =
            ClusterTopologyRefreshOptions.builder()
                .enablePeriodicRefresh(Duration.ofSeconds(60))
                .enableAllAdaptiveRefreshTriggers()
                .build();

        ClusterClientOptions clientOptions = ClusterClientOptions.builder()
            .topologyRefreshOptions(topologyRefreshOptions)
            .build();

        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
            .clientOptions(clientOptions)
            .readFrom(ReadFrom.REPLICA_PREFERRED)  // Read scaling
            .build();

        return new LettuceConnectionFactory(clusterConfig, clientConfig);
    }
}
```

---

## Sentinel vs Cluster

| | Sentinel | Cluster |
|---|---|---|
| Purpose | HA failover | HA + horizontal scaling |
| Data sharding | ❌ (all data on every node) | ✅ (sharded across nodes) |
| Max dataset size | Bounded by RAM of single node | N × RAM |
| Write throughput | Single node | N × (single node) |
| Multi-key operations | ✅ Always possible | ❌ Same-slot only |
| Operational complexity | Medium | High |
| Minimum nodes | 1 master + 2 replicas + 3 Sentinels | 6 (3 masters + 3 replicas) |
| Client complexity | Sentinel discovery | Cluster routing |

**Choose Sentinel** when: dataset fits comfortably in RAM of one node, operations are simple, want predictable multi-key behavior.

**Choose Cluster** when: dataset exceeds single-node RAM, need write throughput scaling, building for large scale.

---

## Production Deployment Best Practices

### Anti-Affinity

Always place master and its replica on **different hosts** (ideally different AZs):

```yaml
# Kubernetes: anti-affinity for Redis master + replica
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          app: redis
      topologyKey: kubernetes.io/hostname
```

### Network Partition Handling

In a network partition, multiple Sentinels on the same network segment may elect a new master — causing **split brain** (two masters). Protect with:

```bash
min-replicas-to-write 1    # Master refuses writes if it can't see any replicas
# → In isolated partition, master stops accepting writes → no split brain
```

### Slow Log

```bash
slowlog-log-slower-than 10000   # Log commands taking > 10ms (in microseconds)
slowlog-max-len 128             # Keep last 128 slow commands

SLOWLOG GET 10    # See last 10 slow commands
SLOWLOG RESET
```

### Spring Boot Custom Health Check

```java
@Component
public class RedisHealthIndicator extends AbstractHealthIndicator {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        try {
            redisTemplate.execute((RedisCallback<String>) conn -> {
                conn.ping();
                return "PONG";
            });
            builder.up().withDetail("status", "Reachable");
        } catch (Exception e) {
            builder.down(e).withDetail("error", e.getMessage());
        }
    }
}
```

---

## Interview Questions

### Q: How do you decide between Sentinel and Cluster for a new platform?
**A:** Use Sentinel for simpler HA when data fits one primary; use Cluster for horizontal write and memory scaling.

### Q: What failure behavior should teams expect during Sentinel failover?
**A:** A short write interruption during detection, election, promotion, and client re-discovery.

### Q: Why do hash tags matter in Redis Cluster design?
**A:** They co-locate related keys in one slot, enabling safe multi-key operations.

### Q: How do you reduce data loss risk with async replication?
**A:** Tune min-replicas constraints, monitor lag, and pair with durable persistence strategy.

### Q: What is a common operational anti-pattern in Redis HA setups?
**A:** Placing primaries and replicas on the same failure domain, defeating failover objectives.

### Q: Which cluster metrics should trigger urgent investigation?
**A:** Replication lag growth, failed failovers, slot migration instability, and elevated client redirect errors.
