---
id: producer-overview
title: Kafka Producer
sidebar_label: Producer Overview
---

# Kafka Producer

## What is a Producer?

A **producer** is a client application that publishes (writes) messages to Kafka topics. It is responsible for:

1. Serializing the message key and value
2. Choosing the target partition
3. Batching messages for efficiency
4. Handling retries and errors
5. Managing delivery guarantees via `acks`

---

## Producer Internals

```
Application Code
       │ send(ProducerRecord)
       ▼
  Serializer (key + value)
       │
       ▼
  Partitioner (selects partition)
       │
       ▼
  RecordAccumulator (batches per partition)
       │  [linger.ms / batch.size threshold]
       ▼
  Sender Thread ──► Kafka Broker
       │
       ▼
  Callback / Future (success/failure)
```

The `send()` call is **asynchronous** by default — it adds the record to an in-memory buffer and returns immediately. A background **Sender thread** drains the buffer and sends batches to brokers.

---

## ProducerRecord

```java
// Full constructor
ProducerRecord<String, String> record = new ProducerRecord<>(
    "orders",           // topic
    0,                  // partition (optional, null = use partitioner)
    System.currentTimeMillis(), // timestamp (optional)
    "order-123",        // key (optional)
    "{\"amount\":99.5}" // value
);

// Convenience constructors
new ProducerRecord<>("orders", "key", "value");
new ProducerRecord<>("orders", "value"); // key = null
```

---

## Sending Patterns

### Fire and Forget
```java
kafkaTemplate.send("orders", key, value);
// No result check — fast, may lose messages on error
```

### Synchronous (blocking)
```java
try {
    SendResult<String, String> result =
        kafkaTemplate.send("orders", key, value).get(); // blocks!
    RecordMetadata meta = result.getRecordMetadata();
    log.info("Sent to partition {} offset {}", meta.partition(), meta.offset());
} catch (ExecutionException e) {
    log.error("Send failed: {}", e.getCause().getMessage());
}
```

### Asynchronous with Callback
```java
kafkaTemplate.send("orders", key, value)
    .whenComplete((result, ex) -> {
        if (ex != null) {
            log.error("Send failed for key {}: {}", key, ex.getMessage());
            // retry logic, DLQ routing, alerting...
        } else {
            log.debug("Sent offset={}", result.getRecordMetadata().offset());
        }
    });
```

---

## Key Producer Configurations

```properties
# Required
bootstrap.servers=localhost:9092
key.serializer=org.apache.kafka.common.serialization.StringSerializer
value.serializer=org.apache.kafka.common.serialization.StringSerializer

# Reliability
acks=all                   # Wait for all ISR replicas
retries=2147483647         # Max retries (use with enable.idempotence)
delivery.timeout.ms=120000 # Total time budget for delivery (2 min)
max.in.flight.requests.per.connection=5

# Throughput / Batching
linger.ms=5                # Wait up to 5ms to fill a batch
batch.size=32768           # Max batch size (32 KB)
buffer.memory=33554432     # Total buffer (32 MB)
compression.type=snappy    # none|gzip|snappy|lz4|zstd

# Large messages
max.request.size=1048576   # Max single request size (1 MB)
```

---

## Batching & Throughput Tuning

```
linger.ms=0 (default)  → Each send() flushes immediately → low latency, low throughput
linger.ms=5-20         → Accumulate messages → higher throughput, slight latency increase
batch.size             → Max bytes per partition batch before forced flush
compression.type       → snappy/lz4 for CPU-efficient compression; zstd for best ratio
```

```java
// High-throughput producer config
props.put(ProducerConfig.LINGER_MS_CONFIG, 20);
props.put(ProducerConfig.BATCH_SIZE_CONFIG, 65536);  // 64 KB
props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");
```

---

## Spring Boot Producer Configuration

```java
@Configuration
public class KafkaProducerConfig {

    @Bean
    public ProducerFactory<String, OrderEvent> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
        props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
        props.put(ProducerConfig.LINGER_MS_CONFIG, 5);
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, 32 * 1024);
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, OrderEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

---

## Error Handling & Retry

### Retriable vs Non-Retriable Errors

| Error Type | Examples | Retry? |
|---|---|---|
| Retriable | `NetworkException`, `LeaderNotAvailableException`, `TimeoutException` | ✅ Yes |
| Non-retriable | `MessageTooLargeException`, `RecordTooLargeException`, `SerializationException` | ❌ No |

### Producer Error Handler (Spring)
```java
@Bean
public KafkaTemplate<String, OrderEvent> kafkaTemplate() {
    KafkaTemplate<String, OrderEvent> template = new KafkaTemplate<>(producerFactory());
    template.setProducerListener(new ProducerListener<>() {
        @Override
        public void onError(ProducerRecord<String, OrderEvent> record,
                            RecordMetadata metadata,
                            Exception exception) {
            log.error("Failed to send record: key={}, error={}", record.key(), exception.getMessage());
            // route to DLQ, alert, etc.
        }
    });
    return template;
}
```

---

## Interview Questions — Producer

**Q: What is the RecordAccumulator and why does it exist?**

> The RecordAccumulator is an in-memory buffer that groups records into batches per partition. It exists to improve throughput: instead of sending one message at a time (high overhead), the producer accumulates messages and sends them in bulk. `batch.size` and `linger.ms` control when a batch is flushed.

**Q: What is the difference between `linger.ms=0` and `linger.ms=10`?**

> With `linger.ms=0`, the producer sends messages as soon as they're added to the buffer, maximizing latency responsiveness. With `linger.ms=10`, the producer waits up to 10ms to accumulate more records into the same batch, improving throughput at the cost of slightly higher latency.

**Q: How does the producer choose a partition when no key is provided?**

> Since Kafka 2.4, the **sticky partitioner** is used: the producer sends all keyless messages to the same partition until the batch is full or `linger.ms` expires, then moves to the next. Before 2.4, pure round-robin was used. You can also implement a custom `Partitioner` interface.

**Q: What is `max.in.flight.requests.per.connection`?**

> It controls how many unacknowledged batches can be in-flight to a single broker at once. Higher values increase throughput. When set above 1 with retries enabled (and idempotence disabled), message reordering is possible: a failed batch retried after a successful later batch can result in out-of-order writes. With `enable.idempotence=true`, Kafka handles this safely up to 5 in-flight requests.

**Q: What is `delivery.timeout.ms`?**

> It is the total time budget for a produce operation, including retries. If the message hasn't been delivered within this time, the producer fails the send with a `TimeoutException`. It must satisfy: `delivery.timeout.ms >= linger.ms + request.timeout.ms`. Default is 120 seconds.
