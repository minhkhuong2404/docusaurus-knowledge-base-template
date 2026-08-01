---
id: producer-acks
title: Producer Acknowledgements (acks)
sidebar_label: Producer Acks
description: The `acks` configuration controls how many broker acknowledgements the producer requires before considering a send successful, trading off throughput, latency, and durability.
tags:
  - technical-knowledge
  - kafka
  - producer
  - producer-acks
---

import KafkaProducerAcksDiagram from '@site/src/components/KafkaProducerAcksDiagram';

# Producer Acknowledgements (`acks`)

<KafkaProducerAcksDiagram />

---

## What are Producer Acks?

The `acks` parameter dictates **how many cluster replicas must write a record to their local log segments before the broker returns a success response to the producer**.

---

## The Three Acknowledgement Modes

### 1. `acks=0` — Fire and Forget
- **Mechanism**: The producer transmits records over the network socket and immediately considers the write successful without waiting for a broker response.
- **Latency & Throughput**: Maximum throughput, lowest latency.
- **Data Loss Risk**: **Extremely High**. If the leader broker is offline, socket buffers drop, or network partitions occur, data is lost silently without errors.
- **Use Cases**: High-volume telemetry, metrics gathering, clickstream logging where occasional data loss is acceptable.

### 2. `acks=1` — Leader Acknowledgement (Historical Default)
- **Mechanism**: The producer waits for the partition leader broker to append the record to its local `.log` file before returning success.
- **Latency & Throughput**: High throughput, low latency ($\approx 1\text{--}3\text{ ms}$).
- **Data Loss Risk**: **Moderate**. If the leader acknowledges the write and crashes *before* follower replicas fetch the record, the newly elected leader will be missing the record, causing silent data loss.
- **Use Cases**: Standard application logging and non-financial event streams.

### 3. `acks=all` (or `acks=-1`) — Full ISR Acknowledgement
- **Mechanism**: The producer waits until the record has been written to the local log of the partition leader AND replicated to **all active members of the In-Sync Replicas (ISR) set**.
- **Latency & Throughput**: Slightly higher latency (governed by the slowest follower in the ISR set).
- **Data Loss Risk**: **Zero Data Loss** (when paired with `min.insync.replicas >= 2`).
- **Use Cases**: Financial transactions, order processing, stateful CDC, core business events.

---

## The Zero-Data-Loss Safety Formula

Setting `acks=all` alone is insufficient if `min.insync.replicas` is set to `1` (because an ISR set of size 1 reduces `acks=all` to `acks=1`).

```properties
# Producer Configuration (Producer Client)
acks=all
enable.idempotence=true
retries=2147483647
delivery.timeout.ms=120000

# Topic / Broker Configuration (Cluster)
replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false
```

---

## Interview Questions

### Q1. What is the risk of using `acks=1` in production?
> With `acks=1`, the partition leader acknowledges the producer write as soon as it appends the record to its local Page Cache/log file, *before* follower replicas fetch the byte batch. If the leader crashes immediately after acknowledging, the follower elected as the new leader will not possess that record, resulting in silent data loss despite the producer receiving a success acknowledgement.

### Q2. Does `acks=all` alone guarantee zero data loss?
> No. If `min.insync.replicas=1` and two followers fall out of the ISR set due to network lag, the ISR set shrinks to 1 member (the leader). `acks=all` will return success as soon as the leader writes locally. If that single broker crashes, data is lost. Zero data loss requires: `acks=all` + `min.insync.replicas=2` + `replication.factor=3` + `unclean.leader.election.enable=false`.

### Q3. What error does a producer receive when the ISR size drops below `min.insync.replicas`?
> When the active ISR set size is less than `min.insync.replicas` and a producer sends a record with `acks=all`, the broker rejects the request with a `NotEnoughReplicasException` (or `NotEnoughReplicasAfterAppendException`). This is a retriable exception — the producer retries until `delivery.timeout.ms` expires.

---

## See Also

- [Producer Idempotency & Transactions](./producer-idempotency.md)
- [Kafka Replication & ISR Mechanics](../core/replication.md)
- [Kafka Producer Internals](./producer-overview.md)
