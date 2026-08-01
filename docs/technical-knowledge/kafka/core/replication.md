---
id: replication
title: Replication, ISR & Fault Tolerance
sidebar_label: Replication & ISR
description: The replication factor defines how many copies of each partition exist across the cluster to guarantee fault tolerance and high availability.
tags:
  - technical-knowledge
  - kafka
  - core
  - replication
---

import KafkaReplicationIsrDiagram from '@site/src/components/KafkaReplicationIsrDiagram';

# Replication, ISR & Fault Tolerance

<KafkaReplicationIsrDiagram />

---

:::info[Kafka 4.0+ / KRaft Mode]
All replication mechanics apply identically in KRaft mode. The key difference: partition leader election is coordinated by the **KRaft Controller** quorum instead of ZooKeeper — achieving sub-second failover times and eliminating external ZooKeeper cluster management.
:::

---

## Replication Factor (RF)

The **Replication Factor** defines the total number of physical copies of a partition distributed across distinct brokers in a cluster.

| Replication Factor | Fault Tolerance | Minimum Recommended Brokers |
|:---:|---|:---:|
| **1** | None — any single broker crash causes data unavailability. | 1 |
| **2** | Tolerates 1 broker failure. | 2 |
| **3** (Production Standard) | Tolerates 2 simultaneous broker failures without data loss. | 3 |

---

## In-Sync Replicas (ISR) & Offset Boundaries

The **In-Sync Replicas (ISR)** set contains all partition replicas (leader + active followers) that are actively fetching and keeping up with the leader within `replica.lag.time.max.ms` (default 30 seconds).

```
Leader Partition (Broker 1):  [ Offset 0 | Offset 1 | Offset 2 | Offset 3 (LEO=4) ]
Follower 1 (Broker 2 - ISR): [ Offset 0 | Offset 1 | Offset 2 | Offset 3 (LEO=4) ]
Follower 2 (Broker 3 - Lag): [ Offset 0 | Offset 1 | (LEO=2) ]

High Watermark (HW) = min(ISR LEOs) = Offset 3
Consumers can only read up to Offset 2 (HW - 1)
```

- **Log End Offset (LEO)**: The next logical offset to be written on a specific replica.
- **High Watermark (HW)**: The highest offset replicated across **all current ISR members**. Consumers can *only* read up to the High Watermark, guaranteeing that consumers never read uncommitted data that could be lost in a leader failover.

---

## Zero Data Loss Configuration (`acks=all` + MISR)

To guarantee zero data loss under broker failure scenarios, three settings must be configured together:

```properties
# 1. Producer Config
acks=all
enable.idempotence=true

# 2. Topic/Broker Config
replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false
```

### What Happens When ISR < `min.insync.replicas`?
If two brokers in a 3-replica cluster fail, leaving only 1 active ISR member, the broker rejects incoming producer writes with a `NotEnoughReplicasException`. Kafka prioritizes **consistency and durability over availability**.

---

## Follower Reads & Rack-Aware Placement

In multi-AZ cloud deployments (e.g., AWS MSK spanning `us-east-1a`, `us-east-1b`, `us-east-1c`):
- **Rack-Aware Placement (`broker.rack`)**: Ensures partition replicas are distributed across separate physical racks/AZs so an entire AZ failure does not take down all replicas of a partition.
- **Follower Reads (Kafka 2.4+)**: Consumers configured with `client.rack=us-east-1b` fetch messages directly from the local follower replica in `us-east-1b` rather than crossing AZ boundaries to read from the leader in `us-east-1a`, eliminating cross-AZ data egress charges.

---

## Interview Questions

### Q1. What is the difference between Log End Offset (LEO) and High Watermark (HW)?
> **Log End Offset (LEO)** is the offset of the next record to be appended to a specific replica's log. **High Watermark (HW)** is the maximum offset that has been successfully replicated to *all* current members of the In-Sync Replicas (ISR) set. Consumers are strictly restricted to reading records below the High Watermark to ensure they never consume uncommitted data that could be lost if a leader fails.

### Q2. What happens when a follower broker falls behind and gets removed from the ISR?
> If a follower fails to send fetch requests within `replica.lag.time.max.ms` (default 30s), the leader removes it from the ISR and updates cluster metadata. The High Watermark is recalculated across the remaining ISR members so writes can continue. When the lagging follower recovers and fetches up to the leader's LEO, the leader automatically adds it back into the ISR set.

### Q3. Why is setting `unclean.leader.election.enable=false` mandatory for production financial pipelines?
> If all ISR members crash, `unclean.leader.election.enable=false` prevents Kafka from electing an out-of-sync follower (which is missing historical writes) as the new leader. The partition remains unavailable until an ISR member recovers, sacrificing availability to guarantee **zero data loss**. Setting it to `true` allows an out-of-sync follower to become leader, truncating un-replicated records and causing silent data loss.

### Q4. How does `min.insync.replicas` interact with producer `acks=all`?
> When a producer sends a record with `acks=all`, the partition leader will not return a successful acknowledgement until the record has been written to the local log and replicated to all current ISR members. `min.insync.replicas` sets the minimum number of ISR members required to acknowledge the write. If the current ISR count drops below `min.insync.replicas`, the leader throws a `NotEnoughReplicasException` and rejects further writes.

---

## See Also

- [Kafka Broker Architecture](./broker.md)
- [KRaft vs ZooKeeper Consensus](./kraft-vs-zookeeper.md)
- [Producer Acks & Idempotency](../producer/producer-acks.md)
