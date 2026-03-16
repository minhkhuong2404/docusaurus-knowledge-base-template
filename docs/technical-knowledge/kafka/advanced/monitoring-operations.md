---
id: monitoring-operations
title: Monitoring & Operations
sidebar_label: Monitoring & Operations
---

# Kafka Monitoring & Operations

## Key Metrics to Monitor

### Broker Metrics

| Metric (JMX) | Target | Alert If |
|---|---|---|
| `kafka.server:UnderReplicatedPartitions` | 0 | > 0 |
| `kafka.controller:ActiveControllerCount` | 1 (cluster total) | ≠ 1 |
| `kafka.server:OfflinePartitionsCount` | 0 | > 0 |
| `kafka.network:RequestsPerSec` | Varies | Sudden spike/drop |
| `kafka.server:BytesInPerSec` | Varies | Throttled |
| `kafka.server:BytesOutPerSec` | Varies | Throttled |
| `kafka.server:RequestHandlerAvgIdlePercent` | > 0.3 | < 0.2 |
| `kafka.log:LogFlushRateAndTimeMs` | Low | High = I/O bottleneck |

### Producer Metrics

| Metric | Description |
|--------|-------------|
| `record-error-rate` | Rate of failed sends |
| `record-retry-rate` | Rate of retries |
| `request-latency-avg` | Average request time |
| `buffer-available-bytes` | Free space in RecordAccumulator |
| `batch-size-avg` | Average batch size (tuning signal) |

### Consumer Metrics

| Metric | Description |
|--------|-------------|
| `records-lag-max` | Maximum lag across all assigned partitions |
| `fetch-rate` | Rate of fetch requests |
| `records-consumed-rate` | Records processed per second |
| `commit-latency-avg` | Time to commit offsets |

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
- **Burrow** (LinkedIn): standalone lag monitoring with alerting rules
- **Kafka Exporter** + Prometheus + Grafana: popular open-source stack
- **Confluent Control Center**: commercial UI with built-in lag dashboards
- **AWS CloudWatch** / **Datadog**: cloud-native integrations

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

## Recommended Grafana Dashboards

- **Kafka Overview**: Bytes in/out per broker, under-replicated partitions, offline partitions
- **Producer Dashboard**: Batch size, error rate, retry rate, request latency
- **Consumer Dashboard**: Lag per group/partition, records consumed rate, commit latency
- **Topic Dashboard**: Partition leader distribution, log size per partition

---

## Interview Questions — Monitoring & Operations

**Q: What metrics indicate a Kafka cluster is unhealthy?**

> Critical health signals: `UnderReplicatedPartitions > 0` (replication lagging), `OfflinePartitionsCount > 0` (partitions unavailable), `ActiveControllerCount ≠ 1` (split-brain or no controller), high `RequestHandlerAvgIdlePercent` below 0.2 (broker under heavy load), and growing consumer lag without a corresponding increase in producer throughput.

**Q: How do you reset a consumer group offset to replay messages?**

> Stop all consumers in the group first. Then use `kafka-consumer-groups.sh --reset-offsets` with options like `--to-earliest`, `--to-offset`, `--to-datetime`, or `--shift-by`. After resetting, restart consumers — they'll read from the new offset.

**Q: What happens if you delete a topic that has active consumers?**

> Consumers will encounter `UnknownTopicOrPartitionException` on their next poll. Most consumer frameworks handle this gracefully by logging an error, but the consumers effectively stop processing. If the topic is recreated, consumers with `auto.offset.reset=earliest` will start from the beginning of the new topic.

**Q: How do you handle a partition that becomes under-replicated?**

> First check which broker is the lagging replica — use `kafka-topics.sh --describe` to see ISR vs replica list. Investigate that broker's performance (GC pauses, disk I/O, network). If the broker has recovered, it will automatically catch up and rejoin the ISR. If it's permanently dead, reassign the partition replica to a healthy broker using `kafka-reassign-partitions.sh`.

**Q: What is preferred leader election?**

> When Kafka reassigns partition leaders due to broker failures, the load may become unbalanced — some brokers end up with more leaders than others. Preferred leader election (`auto.leader.rebalance.enable=true`) periodically checks if the originally-assigned (preferred) broker for each partition can reclaim leadership, and triggers an election if leader imbalance exceeds `leader.imbalance.per.broker.percentage` (default 10%).
