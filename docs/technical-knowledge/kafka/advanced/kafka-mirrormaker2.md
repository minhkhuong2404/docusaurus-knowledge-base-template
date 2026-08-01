---
id: kafka-mirrormaker2
title: Kafka MirrorMaker 2 — Cross-Cluster Replication
sidebar_label: MirrorMaker 2
description: MirrorMaker 2 cross-cluster replication for disaster recovery, active-active, and hub-and-spoke. Covers architecture, offset translation, failover, Kubernetes deployment, and monitoring.
tags:
- technical-knowledge
- kafka
- advanced
- mirrormaker
- replication
- disaster-recovery
---

# Kafka MirrorMaker 2: Cross-Cluster Replication

Modern streaming architectures span multiple Kafka clusters across data centers, cloud regions, or cloud providers. Organizations need reliable cross-cluster replication for **disaster recovery**, **regulatory compliance**, **low-latency regional access**, and **data aggregation**. **MirrorMaker 2 (MM2)** is the Apache Kafka project's solution.

MM2 was introduced in Kafka 2.4 (KIP-382) as the successor to the original MirrorMaker 1. It is built on the **Kafka Connect framework**, inheriting Connect's scalability, fault tolerance, and operational model.

**Kafka 4.0+ / KRaft**: MM2 runs on KRaft-based clusters (ZooKeeper was removed in Kafka 4.0). Connectors interact with cluster metadata through the KRaft controller layer, maintaining full replication semantics while benefiting from faster failover and simpler operations.

---

## MirrorMaker 2 Components

MM2 consists of **three connector types** that work together:

| Connector | Purpose |
|-----------|---------|
| **MirrorSourceConnector** | Core data replication — reads from source, writes to target. Preserves keys, values, headers, and timestamps. |
| **MirrorCheckpointConnector** | Synchronizes consumer group offsets between clusters, enabling consumers to resume at the correct position after failover. |
| **MirrorHeartbeatConnector** | Emits heartbeat messages to track replication health and connectivity. |

All three run as standard Kafka Connect connectors in standalone or distributed mode.

### Topic Naming Convention

By default, topics are prefixed with the source cluster alias:

The checkpoint connector ensures consumers resume from the correct translated offset post-failover.

**Example: Financial services** — primary cluster in US-East, standby in US-West. If US-East goes down, trading applications switch to US-West using synchronized consumer offsets.

### Active-Active (Bidirectional)

Both clusters produce and consume, with data mirrored bidirectionally. Enables multi-region writes with low local latency.

**Cycle detection**: MM2 adds headers indicating the source cluster. Before replicating, it checks headers to skip messages that originated from the target cluster — preventing infinite bounce loops.

**Conflict resolution** (application responsibility — MM2 doesn't handle this):
- Timestamp-based: keep the latest update
- Application-level versioning: include version numbers
- Regional authority: designate specific clusters as authoritative per data domain
- CRDTs: Conflict-free Replicated Data Types for commutative operations

### Hub-and-Spoke Aggregation

Multiple regional clusters replicate into a central analytics hub:

### Fan-Out Distribution

A central cluster distributes to regional clusters:

---

## Configuration

### Basic Configuration

```properties
clusters = source, target
source.bootstrap.servers = source-kafka:9092
target.bootstrap.servers = target-kafka:9092

source->target.enabled = true
source->target.topics = orders.*, inventory.*, shipments.*

replication.factor = 3
offset-syncs.topic.replication.factor = 3
checkpoints.topic.replication.factor = 3
```

### Production Configuration (KRaft + Security + EOS)

```properties
# Cluster definitions
clusters = source, target

# Source cluster (Kafka 4.0+ / KRaft)
source.bootstrap.servers = source-kafka-1:9093,source-kafka-2:9093,source-kafka-3:9093
source.security.protocol = SASL_SSL
source.sasl.mechanism = SCRAM-SHA-512
source.sasl.jaas.config = org.apache.kafka.common.security.scram.ScramLoginModule required \
  username="mm2-source-user" \
  password="${file:/etc/mm2/source-password.txt:password}";

# Target cluster
target.bootstrap.servers = target-kafka-1:9093,target-kafka-2:9093,target-kafka-3:9093
target.security.protocol = SASL_SSL
target.sasl.mechanism = SCRAM-SHA-512
target.sasl.jaas.config = org.apache.kafka.common.security.scram.ScramLoginModule required \
  username="mm2-target-user" \
  password="${file:/etc/mm2/target-password.txt:password}";

# Replication flow
source->target.enabled = true
source->target.topics = orders.*, inventory.*, shipments.*
source->target.groups = .*
source->target.topics.blacklist = .*[\-\.]internal, .*\.replica, __.*

# Features
source->target.emit.checkpoints.enabled = true
source->target.emit.heartbeats.enabled = true
source->target.sync.topic.configs.enabled = true
source->target.sync.topic.acls.enabled = true

# Exactly-once semantics (Kafka 2.5+)
source->target.exactly.once.support = enabled
source->target.transaction.timeout.ms = 900000

# Performance tuning
tasks.max = 8
source->target.producer.compression.type = zstd
source->target.producer.batch.size = 32768
source->target.producer.linger.ms = 100
source->target.consumer.max.poll.records = 2000

# Internal topic replication
replication.factor = 3
offset-syncs.topic.replication.factor = 3
checkpoints.topic.replication.factor = 3
heartbeats.topic.replication.factor = 3

# Sync intervals
emit.checkpoints.interval.seconds = 30
emit.heartbeats.interval.seconds = 5
refresh.topics.interval.seconds = 60
```

---

## Kubernetes Deployment with Strimzi

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaMirrorMaker2
metadata:
  name: mm2-cluster
  namespace: kafka
spec:
  version: 3.8.0
  replicas: 3
  connectCluster: "target"

  clusters:
  - alias: "source"
    bootstrapServers: source-kafka-bootstrap.source-ns:9093
    tls:
      trustedCertificates:
      - secretName: source-cluster-ca-cert
        certificate: ca.crt
    authentication:
      type: tls
      certificateAndKey:
        secretName: source-mm2-credentials
        certificate: user.crt
        key: user.key

  - alias: "target"
    bootstrapServers: target-kafka-bootstrap.kafka:9093
    config:
      ssl.enabled.protocols: "TLSv1.3"
    tls:
      trustedCertificates:
      - secretName: target-cluster-ca-cert
        certificate: ca.crt
    authentication:
      type: tls
      certificateAndKey:
        secretName: target-mm2-credentials
        certificate: user.crt
        key: user.key

  mirrors:
  - sourceCluster: "source"
    targetCluster: "target"
    sourceConnector:
      tasksMax: 8
      config:
        replication.factor: 3
        sync.topic.acls.enabled: "true"
        replication.policy.class: "org.apache.kafka.connect.mirror.IdentityReplicationPolicy"
    checkpointConnector:
      tasksMax: 4
      config:
        checkpoints.topic.replication.factor: 3
        sync.group.offsets.enabled: "true"
        emit.checkpoints.interval.seconds: 30
    heartbeatConnector:
      tasksMax: 1
    topicsPattern: "orders.*|inventory.*|shipments.*"
    groupsPattern: ".*"

  resources:
    requests:
      memory: 4Gi
      cpu: 2000m
    limits:
      memory: 8Gi
      cpu: 4000m

  template:
    pod:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app.kubernetes.io/name
                operator: In
                values: [kafka-mirror-maker2]
            topologyKey: "kubernetes.io/hostname"
```

**Resource sizing guidelines:**

| Throughput | CPU | RAM |
|------------|-----|-----|
| < 100 MB/s | 2 cores | 4 GB |
| 100–500 MB/s | 4 cores | 8 GB |
| > 500 MB/s | 8+ cores | 16+ GB |

---

## Failover Procedure

A structured failover checklist for active-passive DR:

1. **Detect primary failure** via monitoring alerts
2. **Verify target cluster health** and current replication lag (ideally < 1 minute)
3. **Stop producers** writing to the primary (redirect via DNS/load balancer)
4. **Wait for replication to catch up** to minimize data loss
5. **Query checkpoint topic** on target to get translated consumer offsets
6. **Reset consumer groups** to translated offsets on target cluster
7. **Start consumers** on target cluster
8. **Redirect producers** to target cluster
9. **Verify data flow** through producer and consumer metrics

```bash
# Step 5: Query checkpoint topic for offset translation
kafka-console-consumer.sh --bootstrap-server target-kafka:9092 \
  --topic source.checkpoints.internal \
  --from-beginning --max-messages 100

# Step 6: Reset consumer group to translated offset
kafka-consumer-groups.sh --bootstrap-server target-kafka:9092 \
  --group order-processing-group \
  --topic us-west.orders \
  --reset-offsets --to-offset <translated-offset> --execute
```

---

## Monitoring

### Key Prometheus Metrics

```promql
# Replication lag alert (> 10 seconds = warning)
kafka_connect_mirror_source_connector_record_age_ms > 10000

# Replication throughput
kafka_connect_mirror_source_connector_byte_rate

# Failed records (should be 0)
kafka_connect_mirror_source_connector_failed_record_count

# Checkpoint lag (> 30 seconds = warning)
kafka_connect_mirror_checkpoint_connector_checkpoint_latency_ms > 30000
```

### Alerting Thresholds

| Alert | Threshold | Severity |
|-------|-----------|---------|
| Replication lag | > 60 seconds | Warning |
| Replication lag | > 300 seconds | Critical |
| Failed record count | > 0 | Warning |
| Connector status not RUNNING | Any | Critical |

---

## Operational Challenges

**Topic configuration drift**: Configurations can diverge over time. Enable `sync.topic.configs.enabled=true` and regularly audit differences.

**Schema Registry sync**: Schemas are not replicated by MM2. Use Schema Registry replication or backup/restore procedures separately.

**Network costs**: Cross-region replication incurs egress charges. Optimize with:
- `zstd` compression (best ratio in Kafka 4.0+)
- Topic blacklists to exclude debug/logging topics
- Dedicated network links (AWS Transit Gateway, Azure ExpressRoute, GCP Interconnect)

**Active-active conflicts**: Design applications for idempotency, use timestamp-based resolution, or designate regional authority per data domain.

---

## Interview Questions

### Q: What are the three connector types in MirrorMaker 2 and what does each do?

> MirrorSourceConnector copies messages from source topics to target topics, preserving keys, values, headers, and timestamps. MirrorCheckpointConnector tracks consumer group offsets and maps source offsets to target offsets, enabling consumers to resume at the correct position after a failover. MirrorHeartbeatConnector emits periodic heartbeat messages to track replication health and connectivity between clusters.

### Q: How does MM2 prevent replication loops in active-active topologies?

> When MM2 replicates a message, the MirrorSourceConnector adds a header identifying the source cluster. Before replicating any message, MM2 checks if the message header shows it originated from the target cluster — if so, the message is skipped. This header-based cycle detection breaks the infinite loop where messages would otherwise bounce back and forth between clusters indefinitely.

### Q: What is offset translation and why is it critical for failover?

> When messages are replicated from source to target, the target cluster assigns new, different offsets starting from 0. This means a consumer's source offset of 1000 might correspond to target offset 998 (if 2 messages failed replication). The MirrorCheckpointConnector maintains this source-to-target offset mapping in the `*.checkpoints.internal` topic. During failover, consumers query this mapping to find their equivalent starting position in the target cluster — without this translation, consumers would start from the wrong offset, causing data loss or duplication.

### Q: What is the difference between MirrorMaker 1 and MirrorMaker 2?

> MM1 was a simple consumer-producer pair with no automatic topic creation, no consumer group offset synchronization, and no ACL replication. MM2 (Kafka 2.4+, KIP-382) addresses all these gaps: automatic topic and partition creation, offset checkpoint synchronization for failover, ACL and topic config replication, bidirectional replication with cycle detection, exactly-once semantics support, and Connect-based fault tolerance and horizontal scaling.

---

## Related Topics

- [Kafka Replication and High Availability](../core/replication.md) — Within-cluster replication (ISR, leader election)
- [Kafka Authentication — SASL, SSL & OAuth](./kafka-security-authentication.md) — Securing cross-cluster connections
- [Kafka Connect Deep Dive](./kafka-connect.md) — The Connect framework that powers MM2
- [Monitoring & Operations](./monitoring-operations.md) — Replication lag alerting and JMX metrics

## Sources

1. [Apache Kafka Documentation: Geo-Replication (MirrorMaker)](https://kafka.apache.org/documentation/#georeplication)
2. [KIP-382: MirrorMaker 2.0](https://cwiki.apache.org/confluence/display/KAFKA/KIP-382%3A+MirrorMaker+2.0)
3. [Strimzi Kafka Operator Documentation](https://strimzi.io/docs/operators/latest/overview.html)
4. [Confluent MirrorMaker 2 Guide](https://docs.confluent.io/platform/current/multi-dc-deployments/mirrormaker.html)
