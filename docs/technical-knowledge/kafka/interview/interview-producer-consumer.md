---
id: interview-producer-consumer
title: Interview Questions — Producer & Consumer
sidebar_label: Producer & Consumer Q&A
description: '**Q1: Walk me through what happens when a producer calls `send()`.**'
tags:
- technical-knowledge
- kafka
- interview
- interview-producer-consumer
---
# Interview Questions — Producer & Consumer

---

## Producer Deep Dive

**Q1: Walk me through what happens when a producer calls `send()`.**

> 1. The `ProducerRecord` is passed to the configured **Serializer** (key + value).
> 2. The **Partitioner** determines the target partition (key hash, round-robin, or custom).
> 3. The record is added to the **RecordAccumulator** — an in-memory buffer organized as a deque of batches per `TopicPartition`.
> 4. A background **Sender thread** drains the accumulator when `batch.size` is full or `linger.ms` has elapsed.
> 5. The Sender groups batches by broker (leader for each partition) and sends `ProduceRequest`s.
> 6. The broker appends to its partition log and (if `acks=all`) replicates to ISR followers.
> 7. The broker sends a `ProduceResponse` back to the producer.
> 8. The producer invokes the `Callback` or resolves the `Future` passed with the original `send()`.

---

**Q2: What is the difference between `acks=0`, `acks=1`, and `acks=all`?**

> - `acks=0`: Fire-and-forget. No acknowledgement waited for. Maximum throughput, no durability. A network blip silently loses messages.
> - `acks=1`: Leader acknowledges after writing to its local log, before replication. Fast, but if the leader crashes before replication, the message is lost despite being acknowledged.
> - `acks=all` (or `-1`): Leader acknowledges only after all ISR members have replicated the message. Combined with `min.insync.replicas=2`, this is the strongest guarantee with no data loss.

---

**Q3: How does idempotent producer work? What are its limitations?**

> The broker assigns a unique **Producer ID (PID)** and the producer tags each batch with a monotonically increasing **Sequence Number** per `(PID, TopicPartition)`. If a retried batch arrives at the broker with a previously-seen sequence number, the broker silently deduplicates it.
>
> Limitations: (1) Only covers duplicates within the **same session** — a restarted producer gets a new PID. (2) Only prevents duplicates caused by retries, not application-level double-sends. (3) Requires `acks=all` and `max.in.flight.requests.per.connection ≤ 5`.

---

**Q4: How do producer transactions work end-to-end?**

> 1. Producer calls `initTransactions()` — registers a stable `transactional.id` with the Transaction Coordinator, gets a PID + epoch.
> 2. `beginTransaction()` marks the start locally.
> 3. `send()` calls buffer records tagged with the transaction.
> 4. `commitTransaction()` or `abortTransaction()` sends the decision to the coordinator.
> 5. The coordinator writes a PREPARE_COMMIT to `__transaction_state`.
> 6. Transaction markers (COMMIT or ABORT) are written to every partition touched by the transaction.
> 7. Consumers with `isolation.level=read_committed` only see records whose partition has received a COMMIT marker.

---

**Q5: What is zombie fencing and why is it critical?**

> In distributed systems, a crashed instance may recover and still be running when a new instance with the same logical identity has started. Without fencing, the old "zombie" instance could commit a stale transaction that contradicts the new instance's work.
>
> Kafka fences zombies via the **epoch** in the `transactional.id` registration. When a new producer registers the same `transactional.id`, the epoch is incremented. Any message from an old instance with a lower epoch is rejected with `ProducerFencedException`. The old instance must close and not retry.

---

**Q6: What is `max.in.flight.requests.per.connection` and what is its impact?**

> It controls how many unacknowledged `ProduceRequest` batches can be outstanding to a single broker at once. Higher values increase throughput (more batches pipelined). However:
> - Without idempotence: retrying a failed batch when later batches succeeded can result in **out-of-order messages**.
> - With `enable.idempotence=true`: safe up to 5 (Kafka enforces this limit).
> - For strict ordering without idempotence: set to 1 (at the cost of throughput).

---

**Q7: What is `delivery.timeout.ms` and how does it interact with retries?**

> `delivery.timeout.ms` (default 120s) is the total time budget for a produce operation from initial send to final success or failure, including all retries. Kafka will keep retrying transient failures until this deadline passes, then fail with `TimeoutException`. This is the primary lever for controlling retry duration; `retries` with `Integer.MAX_VALUE` means "retry until timeout."

---

## Consumer Deep Dive

**Q8: Explain the consumer group rebalance process.**

> When group membership changes (consumer join/leave/timeout, or partition count change): (1) The **Group Coordinator** receives a `JoinGroup` request from all group members. (2) The Coordinator waits for all members to join (up to `rebalance.timeout.ms`). (3) It designates the first member as **Group Leader**. (4) The Leader runs the partition assignor algorithm and sends the result via `SyncGroup`. (5) The Coordinator distributes assignments. (6) Consumers receive their assigned partitions and resume polling.
>
> With `CooperativeStickyAssignor`, only partitions that need to move are revoked; others continue processing — eliminating the full stop-the-world.

---

**Q9: What is the difference between at-most-once, at-least-once, and exactly-once consumer semantics?**

> - **At-most-once**: Commit offset before processing. If processing fails, the message is lost — never reprocessed. Risk: data loss.
> - **At-least-once**: Commit offset only after successful processing. If the consumer crashes after processing but before committing, the message is reprocessed. Risk: duplicate processing. Requires idempotent downstream.
> - **Exactly-once**: Use Kafka Transactions — atomically commit the offset and the output records. If anything fails, both are rolled back, and the message is retried exactly once.

---

**Q10: What happens when `max.poll.interval.ms` is exceeded?**

> The broker's Group Coordinator considers the consumer dead and triggers a group rebalance, revoking its partition assignments. In Spring Kafka, this typically surfaces as `CommitFailedException` or a rebalance log event. The consumer must finish processing and call `poll()` within `max.poll.interval.ms`. To fix: increase the timeout or reduce `max.poll.records` so each poll batch finishes faster.

---

**Q11: What is the `__consumer_offsets` topic?**

> It's an internal, compacted Kafka topic (50 partitions by default) where all consumer group offsets are stored. When a consumer commits, the key is `(groupId, topic, partition)` and the value is the offset + metadata. Compaction ensures only the latest committed offset per key is retained. The target partition for a group's offsets is determined by `hash(groupId) % 50`.

---

**Q12: How do you implement exactly-once in a consume → process → produce pipeline?**

> 1. Configure the producer with `enable.idempotence=true` and `transactional.id`.
> 2. Configure the consumer with `isolation.level=read_committed` and `enable.auto.commit=false`.
> 3. In the processing loop, wrap produce + offset commit in a transaction:
>    ```java
>    producer.beginTransaction();
>    producer.send(outputRecord);
>    producer.sendOffsetsToTransaction(offsets, groupMetadata);
>    producer.commitTransaction();
>    ```
> 4. On failure, call `abortTransaction()` — neither the output nor the offset commit is visible.

---

**Q13: What is `auto.offset.reset=none` and when would you use it?**

> With `none`, Kafka throws `NoOffsetForPartitionException` if a committed offset is not found for the assigned partition (e.g., first time a new group runs, or if offsets were deleted). It's a **safety net** — instead of silently starting from `earliest` or `latest`, the application fails loudly. Use it when starting from an unintended offset would have serious consequences, forcing developers to explicitly handle offset initialization.

---

**Q14: How does static group membership improve Kafka performance?**

> By default, every consumer restart triggers a group rebalance (all partitions reassigned). With `group.instance.id`, each consumer has a stable identity. When it restarts within `session.timeout.ms`, it reclaims its previous partition assignment without triggering a rebalance. This is especially valuable in Kubernetes environments where pod restarts are common, and in stateful consumers where partition assignment is tied to local state (e.g., Kafka Streams tasks).

---

**Q15: What is the difference between `commitSync()` and `commitAsync()`?**

> `commitSync()` blocks until the commit succeeds or throws a retriable exception — guaranteed to commit but adds latency. `commitAsync()` is non-blocking — submits the commit request and continues. If it fails, it does NOT automatically retry (because a later commit may have already succeeded, and retrying could overwrite it). Best practice: use `commitAsync()` in the poll loop for performance, and call `commitSync()` in the shutdown hook to ensure the final batch is committed.

---

**Q16: Why doesn't Kafka support native per-message consumer retries, and how do you implement non-blocking retries?**

> Kafka's fundamental architecture is an immutable, append-only sequential commit log with a single monotonically increasing offset cursor per partition. Unlike AWS SQS or RabbitMQ, which maintain state per individual message, Kafka cannot skip offset #42, mark it as "unacknowledged", and process #43 while waiting to retry #42.
>
> If a consumer attempts an in-place retry (e.g. sleeping inside the thread), it causes **Head-of-Line (HoL) Blocking**: all subsequent records on that partition are halted, and if processing exceeds `max.poll.interval.ms`, the consumer is evicted, triggering a rebalance storm.
>
> **The Enterprise Solution**: Implement **Non-Blocking Retry Topics**:
> 1. Publish the failed record to a delayed retry topic (`topic-retry-10s`) with headers tracking attempt count and original offset.
> 2. Immediately commit the original offset on the main topic, freeing the thread to process succeeding records at wire speed.
> 3. Dedicated retry consumer groups poll the retry topics with appropriate backoff delays.
> 4. If all retry attempts fail, publish to a **Dead Letter Queue (`topic-dlq`)** for SRE triage.

---

**Q17: When should a consumer commit its offsets in an event processing pipeline?**

> Offsets must **only be committed AFTER all external, durable side-effects are finalized**.
>
> For instance, in a distributed Web Crawler:
> - **Anti-Pattern**: Committing the URL offset immediately upon downloading the HTML into memory. If the consumer crashes before saving the HTML to S3 or a database, the URL is permanently skipped without being indexed (data loss).
> - **Best Practice**: Commit the offset only after Amazon S3 returns HTTP 200 OK. If the consumer crashes beforehand, the partition rebalance safely delivers the URL to another worker (at-least-once).
> - **The 2-Phase Pattern**: Keep consumer tasks minimal. Split monolithic workflows into discrete stages connected by intermediate Kafka topics (e.g., Phase 1: Download HTML to S3; Phase 2: Parse DOM links). This prevents repeating heavy computation if a crash occurs late in the pipeline.

---

**Q18: What is the Claim Check Pattern in Kafka and why is it used for large media files (e.g. YouTube transcoding)?**

> Kafka's maximum throughput and sub-millisecond latencies depend on the Linux OS Page Cache and Zero-Copy `sendfile()` network transfers. Large payloads (> 1 MB, such as video files, raw audio, or images) pollute the page cache, trigger frequent stop-the-world JVM garbage collection cycles during buffer allocation, and overwhelm broker network buffers.
>
> The **Claim Check Pattern** decouples payload storage from event orchestration:
> 1. The client uploads the raw blob directly to distributed object storage (**Amazon S3** or Google Cloud Storage) via a presigned URL.
> 2. Once durable, an event producer publishes a lightweight JSON record (< 1 KB) to Kafka containing the S3 URI pointer and processing metadata.
> 3. Downstream worker pools (e.g. video transcoders) consume the pointer from Kafka and stream binary data directly from S3.
