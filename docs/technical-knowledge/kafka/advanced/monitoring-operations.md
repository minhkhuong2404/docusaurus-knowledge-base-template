---
id: monitoring-operations
title: Monitoring & Operations
sidebar_label: Monitoring & Operations
description: 'Consumer lag is the most important consumer metric:'
tags:
- technical-knowledge
- kafka
- advanced
- monitoring-operations
---
# Kafka Monitoring & Operations

:::info[Kafka 4.0+ / KRaft Mode]
In KRaft mode, the ZooKeeper metrics (`zookeeper.*`) are replaced by KRaft controller metrics. Monitor `kafka.controller:ActiveControllerCount` and `kafka.controller:EventQueueTimeMs` for controller health. The `__cluster_metadata` topic replaces ZooKeeper as the metadata store.
:::

## The Four Layers of Kafka Monitoring

| Layer | What to Monitor | Primary Tools |
|-------|-----------------|---------------|
| **Infrastructure** | CPU, RAM, disk I/O, network | Prometheus node_exporter, CloudWatch |
| **Broker** | Replication, leadership, request throughput | JMX Exporter, Kafka Exporter |
| **Producers/Consumers** | Lag, error rates, throughput | Consumer group metrics, Micrometer |
| **Application** | End-to-end latency, processing errors | APM (Datadog, Dynatrace), custom metrics |

---

## Key Metrics to Monitor

### Broker Health Metrics

| Metric (JMX MBean) | Healthy Value | Alert If | Severity |
|---|---|---|---|
| `kafka.server:UnderReplicatedPartitions` | 0 | > 0 | Warning |
| `kafka.server:UnderMinIsrPartitionCount` | 0 | > 0 | Critical |
| `kafka.controller:ActiveControllerCount` | 1 (cluster total) | ≠ 1 | Critical |
| `kafka.server:OfflinePartitionsCount` | 0 | > 0 | Critical |
| `kafka.network:RequestsPerSec` | Varies | Sudden ±50% change | Warning |
| `kafka.server:BytesInPerSec` | Baseline | > 90% network capacity | Warning |
| `kafka.server:BytesOutPerSec` | Baseline | > 90% network capacity | Warning |
| `kafka.server:RequestHandlerAvgIdlePercent` | > 0.3 | < 0.2 | Warning |
| `kafka.log:LogFlushRateAndTimeMs` | Low | p99 > 1000ms | Warning |

### KRaft Controller Metrics (Kafka 4.0+)

| Metric | Description | Alert If |
|--------|-------------|----------|
| `kafka.controller:ActiveControllerCount` | Should be exactly 1 across cluster | ≠ 1 |
| `kafka.controller:EventQueueTimeMs` | Time events wait in controller queue | p99 > 1000ms |
| `kafka.controller:EventQueueSize` | Backlog of controller events | > 100 |
| `kafka.controller:MetadataErrorCount` | KRaft metadata log errors | > 0 |

### Producer Metrics

| Metric | Description | Alert If |
|--------|-------------|----------|
| `record-error-rate` | Rate of failed sends | > 0 |
| `record-retry-rate` | Rate of retries | > 10/sec |
| `request-latency-avg` | Average produce request time | > 500ms |
| `buffer-available-bytes` | Free space in RecordAccumulator | < 10% of `buffer.memory` |
| `batch-size-avg` | Average batch size | < 1KB (under-batching) |
| `record-queue-time-avg` | Time records wait in accumulator | > `linger.ms` × 2 |

### Consumer Metrics

| Metric | Description | Alert If |
|--------|-------------|----------|
| `records-lag-max` | Maximum lag across all partitions | > 1000 (threshold varies by SLA) |
| `records-lag` | Lag per partition | Growing trend |
| `fetch-rate` | Rate of fetch requests | Sudden drop |
| `records-consumed-rate` | Records processed per second | Drops unexpectedly |
| `commit-latency-avg` | Time to commit offsets | > 500ms |

---

## Consumer Lag Monitoring

Consumer lag is the most important consumer metric:

```bash
# Check lag per group
kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group order-service

# Output:
# GROUP         TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG  CONSUMER-ID
# order-service orders  0          1050            1100            50   consumer-1
# order-service orders  1          980             980             0    consumer-2
# order-service orders  2          1200            1250            50   consumer-3
```

### Tools for Lag Monitoring
- **Burrow** (LinkedIn): standalone lag monitoring with alerting rules per consumer group
- **Kafka Exporter** + Prometheus + Grafana: popular open-source stack (community dashboards available)
- **Confluent Control Center**: commercial UI with built-in lag dashboards and alerting
- **AWS CloudWatch** / **Datadog** / **Dynatrace**: cloud-native integrations with Kafka metrics
- **Conduktor Platform**: end-to-end monitoring, governance, and alerting

### Lag Alert Example (Prometheus)

```yaml
# Alert when consumer lag grows for 5 minutes
groups:
- name: kafka_consumer
  rules:
  - alert: KafkaConsumerGroupLag
    expr: kafka_consumergroup_lag{consumergroup="order-service"} > 10000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Consumer group lag too high"
      description: "Group {{ $labels.consumergroup }} lag is {{ $value }} on {{ $labels.topic }}/{{ $labels.partition }}"

  - alert: KafkaConsumerGroupLagGrowing
    expr: rate(kafka_consumergroup_lag{consumergroup="order-service"}[10m]) > 100
    for: 10m
    labels:
      severity: critical
    annotations:
      summary: "Consumer group lag is continuously growing — consumer cannot keep up"

---

## Spring Boot Actuator Metrics

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus,metrics
  metrics:
    tags:
      application: ${spring.application.name}
```

Access metrics at `/actuator/prometheus` — includes all Kafka producer/consumer metrics automatically via Micrometer.

---

## Common Operational Commands

### Topic Management
```bash
# Create topic
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic orders --partitions 6 --replication-factor 3

# List topics
kafka-topics.sh --bootstrap-server localhost:9092 --list

# Describe topic
kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic orders

# Increase partitions (only increase, never decrease)
kafka-topics.sh --bootstrap-server localhost:9092 \
  --alter --topic orders --partitions 12

# Delete topic
kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic orders
```

### Message Inspection
```bash
# Consume from beginning
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic orders --from-beginning

# Consume with key printed
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic orders --from-beginning \
  --property print.key=true --property key.separator=":"

# Consume specific partition and offset range
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic orders --partition 2 --offset 100 --max-messages 50
```

### Consumer Group Management
```bash
# List all groups
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list

# Describe group (lag check)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group order-service

# Reset offsets to earliest (stop consumers first!)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-service --topic orders \
  --reset-offsets --to-earliest --execute

# Reset to specific offset
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-service --topic orders \
  --reset-offsets --to-offset 500 --execute

# Reset to specific datetime
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-service --topic orders \
  --reset-offsets --to-datetime 2024-01-01T00:00:00.000 --execute
```

### Partition Reassignment
```bash
# Generate reassignment plan
kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \
  --topics-to-move-json-file topics.json \
  --broker-list "1,2,3" \
  --generate

# Execute reassignment
kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \
  --reassignment-json-file reassign.json \
  --execute

# Verify reassignment
kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \
  --reassignment-json-file reassign.json \
  --verify
```

---

## Log Retention & Compaction Management

```bash
# Alter retention for existing topic
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name orders \
  --alter --add-config retention.ms=86400000  # 1 day

# Enable log compaction
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name user-profiles \
  --alter --add-config cleanup.policy=compact

# Check current topic configs
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name orders --describe
```

---

## Quotas

Protect your cluster from noisy producers/consumers:

```bash
# Set producer quota per client
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type clients --entity-name batch-importer \
  --alter --add-config producer_byte_rate=1048576  # 1 MB/s

# Set consumer quota
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type clients --entity-name analytics-app \
  --alter --add-config consumer_byte_rate=5242880  # 5 MB/s
```

---

## Performance Testing

```bash
# Producer performance test
kafka-producer-perf-test.sh \
  --topic perf-test \
  --num-records 1000000 \
  --record-size 1000 \
  --throughput 100000 \
  --producer-props bootstrap.servers=localhost:9092 acks=all

# Consumer performance test
kafka-consumer-perf-test.sh \
  --bootstrap-server localhost:9092 \
  --topic perf-test \
  --messages 1000000 \
  --group perf-consumer-group
```

---

## End-to-End Latency Monitoring

Broker-level metrics alone don't tell the full story. Track **end-to-end message latency** — the time from producer `send()` to consumer processing completion:

```java
// Producer: embed timestamp as header
long produceTime = System.currentTimeMillis();
ProducerRecord<String, OrderEvent> record = new ProducerRecord<>("orders", key, event);
record.headers().add("produce-time", Long.toString(produceTime).getBytes());
producer.send(record);

// Consumer: calculate end-to-end latency
@KafkaListener(topics = "orders")
public void consume(ConsumerRecord<String, OrderEvent> record) {
    long produceTime = Long.parseLong(
        new String(record.headers().lastHeader("produce-time").value())
    );
    long e2eLatencyMs = System.currentTimeMillis() - produceTime;
    meterRegistry.timer("kafka.e2e.latency", "topic", record.topic())
        .record(e2eLatencyMs, TimeUnit.MILLISECONDS);

    processOrder(record.value());
}
```

Target e2e latency thresholds (typical SLAs):

| Workload | p50 | p99 | p999 |
|---------|-----|-----|------|
| Payment processing | < 50ms | < 200ms | < 1s |
| Inventory updates | < 200ms | < 1s | < 5s |
| Analytics events | < 1s | < 10s | < 30s |

---

## Observability Stack

### Prometheus + Grafana (Open Source)

```yaml
# docker-compose.yml — Kafka monitoring stack
services:
  kafka-exporter:
    image: danielqsj/kafka-exporter:latest
    command:
      - --kafka.server=kafka:9092
    ports:
      - "9308:9308"

  jmx-exporter:
    # Exposes Kafka broker JMX metrics as Prometheus
    image: bitnami/jmx-exporter:latest
    volumes:
      - ./jmx-kafka-config.yml:/etc/jmx-exporter/config.yml

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    # Import dashboard IDs:
    # 7589 — Kafka Overview
    # 12483 — Kafka Consumer Groups
    # 9628 — Kafka Broker Metrics
```

### Key Grafana Dashboards

- **Kafka Overview** (ID: 7589): Bytes in/out per broker, under-replicated partitions, offline partitions, request rate
- **Consumer Groups** (ID: 12483): Lag per group/partition, lag trend, consumer count
- **Producer Dashboard**: Batch size avg, error rate, retry rate, request latency p99
- **Topic Dashboard**: Partition leader distribution, log size per partition, message rate
- **KRaft Controller** (Kafka 4.0+): Controller queue size, event queue time, metadata errors

---

## Interview Questions

### Q: What metrics indicate a Kafka cluster is unhealthy?

> Critical health signals: `UnderReplicatedPartitions > 0` (replication lagging), `OfflinePartitionsCount > 0` (partitions unavailable), `ActiveControllerCount ≠ 1` (split-brain or no controller), high `RequestHandlerAvgIdlePercent` below 0.2 (broker under heavy load), and growing consumer lag without a corresponding increase in producer throughput.

### Q: How do you reset a consumer group offset to replay messages?

> Stop all consumers in the group first. Then use `kafka-consumer-groups.sh --reset-offsets` with options like `--to-earliest`, `--to-offset`, `--to-datetime`, or `--shift-by`. After resetting, restart consumers — they'll read from the new offset.

### Q: What happens if you delete a topic that has active consumers?

> Consumers will encounter `UnknownTopicOrPartitionException` on their next poll. Most consumer frameworks handle this gracefully by logging an error, but the consumers effectively stop processing. If the topic is recreated, consumers with `auto.offset.reset=earliest` will start from the beginning of the new topic.

### Q: How do you handle a partition that becomes under-replicated?

> First check which broker is the lagging replica — use `kafka-topics.sh --describe` to see ISR vs replica list. Investigate that broker's performance (GC pauses, disk I/O, network). If the broker has recovered, it will automatically catch up and rejoin the ISR. If it's permanently dead, reassign the partition replica to a healthy broker using `kafka-reassign-partitions.sh`.

### Q: What is preferred leader election?

> When Kafka reassigns partition leaders due to broker failures, the load may become unbalanced — some brokers end up with more leaders than others. Preferred leader election (`auto.leader.rebalance.enable=true`) periodically checks if the originally-assigned (preferred) broker for each partition can reclaim leadership, and triggers an election if leader imbalance exceeds `leader.imbalance.per.broker.percentage` (default 10%).
