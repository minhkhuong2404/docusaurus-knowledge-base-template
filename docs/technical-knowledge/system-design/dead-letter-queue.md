---
id: dead-letter-queue
title: Dead Letter Queue (DLQ) Pattern
sidebar_label: Dead Letter Queue
description: A comprehensive guide to the Dead Letter Queue (DLQ) pattern — covering poison pill handling, retry strategies, alternatives comparison, AWS SQS / Kafka / RabbitMQ implementations, and production deep dives for senior engineers.
tags: [dead-letter-queue, dlq, poison-pills, system-design, retry-policies, messaging, reliability, kafka, rabbitmq, sqs, spring, java]
---
import DlqLifecycleSequenceDiagram from '@site/src/components/DlqLifecycleSequenceDiagram';
import DlqTimeoutRetryDiagram from '@site/src/components/DlqTimeoutRetryDiagram';
import DlqOrderingThroughputDiagram from '@site/src/components/DlqOrderingThroughputDiagram';
import SchemaEvolutionDlqSpikeDiagram from '@site/src/components/SchemaEvolutionDlqSpikeDiagram';
import DlqIncidentRunbookDiagram from '@site/src/components/DlqIncidentRunbookDiagram';

# Dead Letter Queue (DLQ) Pattern

> A **Dead Letter Queue (DLQ)** is a secondary message queue that receives messages that could not be successfully processed by a consumer after a configured number of attempts. It acts as a safety valve: isolating failed, malformed, or permanently unprocessable messages so they cannot block healthy traffic, exhaust consumer threads, or silently disappear.

The DLQ is not just an error bin — it is a **reliability contract**. It guarantees that no message is silently dropped and that every failure can be investigated, fixed, and replayed.

:::info[Who this guide is for]
- **New learners** — start at [The Post Office Analogy](#the-post-office-analogy) and [Core Concepts](#core-concepts).
- **Senior engineers** — jump to [Retry Strategy Deep Dive](#core-concepts), [Alternatives Comparison](#alternatives-and-when-to-choose-what), [Ordering vs. Throughput Trade-off](#1-the-ordering-vs-throughput-trade-off), or [Production Playbooks](#6-production-incident-runbook).
:::

---

## The Post Office Analogy

Imagine a high-volume post office. Letters flow down a conveyor belt to automated sorting machines. Most letters are stamped, sorted, and routed correctly.

But occasionally a letter arrives that the machine cannot handle:
- The address is illegible (malformed payload — bad JSON, missing required fields).
- The recipient no longer exists at that address (invalid entity reference — message references a deleted order).
- The envelope is physically damaged (deserialization error — corrupted bytes).
- The letter requires a signature but no one is home after 3 attempts (transient failure that exhausted retries).

**Without a DLQ:** The sorting machine gets stuck on the unprocessable letter. It tries the same letter over and over. The conveyor belt backs up. Healthy mail piles up behind it. The entire post office grinds to a halt — a **poison pill** scenario.

**With a DLQ:** The machine ejects the unprocessable letter into a labeled "Undeliverable Mail" bin after N failed attempts. The main belt keeps moving at full speed. At the end of the day, a human postal worker (the on-call engineer) inspects the bin, diagnoses each letter, fixes the issue, and re-routes the letter for another delivery attempt.

The conveyor belt is your **message queue**. The sorting machine is your **consumer**. The undeliverable bin is your **DLQ**. The re-routing is **DLQ redrive**.

---

## How It Works: The Full Lifecycle

<DlqLifecycleSequenceDiagram />

### Step-by-Step

**1. Message published.** Producer sends a message to the main queue. Everything looks normal.

**2. Consumer receives and fails.** The consumer dequeues the message, attempts to process it, and throws an exception (malformed data, downstream timeout, logic bug).

**3. Negative acknowledgement (NACK).** The consumer signals failure. In Kafka this means not committing the offset. In SQS this means letting the visibility timeout expire. In RabbitMQ this means calling `channel.basicNack()`.

**4. Backoff and retry.** The broker waits for the configured backoff period, then re-delivers the message. This repeats up to `maxAttempts` times, with exponential backoff between attempts.

**5. DLQ routing.** After all retry attempts are exhausted, the broker automatically routes the message to the configured DLQ. The message is no longer on the main queue — it cannot block further processing.

**6. Alert fires.** Monitoring detects the DLQ depth > 0 and pages the on-call engineer.

**7. Diagnose and fix.** The engineer inspects the DLQ message, identifies the root cause (schema mismatch? null pointer? downstream service bug?), and deploys a fix.

**8. Redrive.** Once the consumer code is fixed, the engineer triggers a redrive — moving DLQ messages back to the main queue for reprocessing.

---

## Core Concepts

### Poison Pills vs. Transient Failures

The most important distinction in DLQ design. The retry strategy and DLQ routing differ completely depending on the failure type.

| Failure Type | Examples | Correct Response |
|---|---|---|
| **Transient** | DB connection timeout, downstream HTTP 503, thread pool exhausted | Retry with exponential backoff + jitter. DO NOT route to DLQ immediately. |
| **Permanent (Poison Pill)** | Malformed JSON, null required field, invalid enum value, schema mismatch | Route to DLQ after N attempts — retrying will never succeed |
| **Business Logic Error** | Insufficient funds, order already cancelled, invalid state transition | Depends: either DLQ for human review, or send compensating event |
| **Idempotency Duplicate** | Message already processed (at-least-once redelivery) | Detect and discard — do NOT DLQ or retry |

```java
// ✅ Good: distinguish failure types before deciding how to handle
@KafkaListener(topics = "orders")
public void processOrder(Order order) {
    try {
        orderService.process(order);
    } catch (JsonProcessingException e) {
        // Permanent — malformed payload, retrying will never help
        // Throw to trigger DLQ routing immediately (after configured maxAttempts)
        throw new DeserializationException("Malformed order payload", e);
    } catch (OrderAlreadyProcessedException e) {
        // Idempotency duplicate — discard silently, no DLQ
        log.warn("Duplicate order event, skipping: {}", order.getId());
        // Do NOT throw — ACK the message to remove it from the queue
    } catch (InventoryServiceUnavailableException e) {
        // Transient — retry is appropriate, will eventually succeed
        // Throw to trigger retry with backoff
        throw new RetryableException("Inventory service temporarily unavailable", e);
    }
}
```

### Visibility Timeout (SQS) / Acknowledgement Timeout (RabbitMQ)

When a consumer takes a message, the broker hides it from other consumers for a **visibility timeout** period. This gives the consumer time to process and acknowledge it.

<DlqTimeoutRetryDiagram />

**Choosing the right maxReceiveCount:**
- **Too low (1–2):** Transient failures (brief network blip, momentary DB unavailability) send messages to DLQ prematurely — these would have succeeded on attempt 3.
- **Too high (10+):** Poison pills spend excessive time blocking consumer threads across many retries before reaching the DLQ. The main queue backs up.
- **Recommended range: 3–5** for most systems. Use 5 for external API calls (more transient failure possibility), 3 for internal service calls.

---

## Alternatives and When to Choose What

A DLQ is not the only error-handling strategy. Understanding the full landscape prevents over-engineering and ensures the right tool for each failure scenario.

### Comparison Matrix

| Strategy | Delivery Guarantee | Message Preserved? | Ordering Preserved? | Operational Overhead | Best For |
|---|---|---|---|---|---|
| **DLQ** | At-least-once | ✅ Yes | ⚠️ Broken on failure | Low | Most production systems; diagnosable failures |
| **Discard on failure** | At-most-once | ❌ No | ✅ Yes | None | Non-critical events (click tracking, metrics) |
| **Infinite retry** | Exactly-once attempt | ✅ Yes | ✅ Yes | None upfront | ❌ Almost never — causes consumer starvation |
| **Retry topic (Kafka)** | At-least-once | ✅ Yes | ⚠️ Partial | Medium | High-throughput Kafka; non-blocking retries |
| **Pause partition** | Exactly-once ordering | ✅ Yes | ✅ Yes | High | Strict ordering required (financial ledgers) |
| **Compensating event** | At-least-once | ✅ Via event | ✅ Yes | Medium | Business-logic failures needing rollback |
| **Circuit breaker** | At-least-once + backpressure | ✅ Yes | ⚠️ Partial | Medium | Downstream service unavailability |

---

### 1. Discard on Failure (Drop the Message)

Simply log the error and acknowledge (ACK) the message regardless of outcome. It is permanently gone.

```java
@KafkaListener(topics = "click-events")
public void processClickEvent(ClickEvent event) {
    try {
        analyticsService.record(event);
    } catch (Exception e) {
        // Non-critical: losing a click event is acceptable
        log.warn("Failed to record click event {}, discarding: {}", event.getId(), e.getMessage());
        // Do NOT rethrow — Kafka will ACK and move on
    }
}
```

**Choose discard when:** The message is non-critical (UI analytics, A/B test impressions, feature flag telemetry). The cost of investigation and redrive exceeds the value of the lost event. **Never discard financial transactions, order state changes, or any message that represents an irreversible business event.**

---

### 2. Retry Topic Pattern (Kafka Non-Blocking Retry)

Instead of blocking the main partition on failure, the message is routed to a series of retry topics with increasing delays. After exhausting all retry topics, it goes to the DLQ topic.

```
Main topic: orders
    → Fail → orders.retry.2s   (retry after 2 second delay)
    → Fail → orders.retry.30s  (retry after 30 second delay)
    → Fail → orders.retry.5m   (retry after 5 minute delay)
    → Fail → orders.DLQ        (give up — route to DLQ)
```

```java
@Configuration
public class KafkaRetryConfig {

    @Bean
    public CommonErrorHandler nonBlockingRetryHandler(KafkaTemplate<Object, Object> template) {
        // Routes to: topic.retry.2000, topic.retry.30000, topic.retry.300000, topic.DLQ
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(template,
                (record, ex) -> {
                    // Distinguish retryable vs. non-retryable — skip retries for poison pills
                    if (ex.getCause() instanceof DeserializationException) {
                        return new TopicPartition(record.topic() + ".DLQ", record.partition());
                    }
                    return new TopicPartition(record.topic() + ".retry.2000", record.partition());
                });

        ExponentialBackOffWithMaxRetries backOff = new ExponentialBackOffWithMaxRetries(3);
        backOff.setInitialInterval(2_000L);
        backOff.setMultiplier(15.0); // 2s → 30s → 300s
        backOff.setMaxInterval(300_000L);

        return new DefaultErrorHandler(recoverer, backOff);
    }
}
```

**Choose retry topics when:** You are using Kafka and cannot afford to block the main partition during retries. High-throughput consumers where a single slow retry holds up the entire partition.

---

### 3. Pause Partition (Kafka Strict Ordering)

On failure, pause the Kafka partition — stop consuming from it entirely until the issue is resolved. No messages are skipped, reordered, or DLQ'd.

```java
@Component
@RequiredArgsConstructor
public class OrderingAwareConsumer {

    private final KafkaListenerEndpointRegistry registry;
    private final AlertService alertService;

    @KafkaListener(topics = "account-transactions", groupId = "ledger-processor",
                   id = "ledger-listener")
    public void process(ConsumerRecord<String, Transaction> record) {
        try {
            ledgerService.applyTransaction(record.value());
        } catch (Exception e) {
            log.error("FATAL: Failed to process transaction at offset {}, partition {} — PAUSING",
                    record.offset(), record.partition());

            // Pause this specific partition — no further messages consumed
            MessageListenerContainer container = registry.getListenerContainer("ledger-listener");
            container.pause();

            // Page on-call immediately — human must intervene
            alertService.pageOnCall("Ledger partition paused — manual intervention required",
                    record.topic(), record.partition(), record.offset());

            throw e; // Do not ACK — offset not committed
        }
    }
}
```

**Choose pause partition when:** Message ordering is an absolute requirement (banking ledgers, account balance updates, inventory adjustments where sequence matters). DLQ + redrive would destroy the ordering guarantee and potentially corrupt business state.

---

### 4. Compensating Event

For business-logic failures that require domain-level rollback rather than technical retry.

```java
@KafkaListener(topics = "payment-requests")
public void processPayment(PaymentRequest request) {
    try {
        paymentService.charge(request);
    } catch (InsufficientFundsException e) {
        // This is a business failure, not a technical failure
        // Do NOT DLQ — publish a compensating event instead
        eventPublisher.publish(new PaymentFailedEvent(
                request.getOrderId(),
                request.getCustomerId(),
                PaymentFailureReason.INSUFFICIENT_FUNDS,
                e.getMessage()
        ));
        // ACK the original message — it was processed correctly (just failed business logic)
    }
}
```

**Choose compensating events when:** The failure is a business-domain outcome, not a technical error. Downstream services need to react to the failure (e.g., order service must cancel the order when payment fails).

---

## Implementation: Spring Boot and Kafka

### Production-Grade Configuration

```java
@Configuration
@EnableKafka
@RequiredArgsConstructor
public class KafkaDlqConfig {

    private final KafkaTemplate<Object, Object> kafkaTemplate;

    @Bean
    public CommonErrorHandler errorHandler() {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
                kafkaTemplate,
                // Route to <topic>.DLQ on the same partition for traceability
                (record, ex) -> new TopicPartition(record.topic() + ".DLQ", record.partition())
        );

        // Enrich DLQ message with diagnostic headers
        recoverer.setHeadersFunction((record, ex) -> {
            Map<String, Object> headers = new LinkedHashMap<>();
            headers.put("dlq-original-topic",     record.topic());
            headers.put("dlq-original-partition",  String.valueOf(record.partition()));
            headers.put("dlq-original-offset",     String.valueOf(record.offset()));
            headers.put("dlq-exception-class",     ex.getClass().getName());
            headers.put("dlq-exception-message",   ex.getMessage());
            headers.put("dlq-failed-at",           Instant.now().toString());
            headers.put("dlq-consumer-group",      "order-processor");
            return new RecordHeaders(
                    headers.entrySet().stream()
                            .map(e -> new RecordHeader(e.getKey(),
                                    e.getValue().toString().getBytes()))
                            .toList()
            );
        });

        // Exponential backoff: 1s → 2s → 4s → 8s (4 total attempts, then DLQ)
        ExponentialBackOffWithMaxRetries backOff = new ExponentialBackOffWithMaxRetries(3);
        backOff.setInitialInterval(1_000L);
        backOff.setMultiplier(2.0);
        backOff.setMaxInterval(30_000L);

        DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, backOff);

        // Classify non-retryable exceptions — route to DLQ immediately without retries
        handler.addNotRetryableExceptions(
                JsonProcessingException.class,       // Malformed JSON — retrying won't help
                DeserializationException.class,      // Schema mismatch
                IllegalArgumentException.class,      // Invalid business data
                NullPointerException.class           // Programming error — fix the code, not the retry
        );

        // Classify retryable exceptions explicitly
        handler.addRetryableExceptions(
                TransientDataAccessException.class,  // DB transient error
                ResourceAccessException.class,       // Network timeout to downstream service
                OptimisticLockingFailureException.class // Concurrency conflict
        );

        return handler;
    }
}
```

### DLQ Consumer (Inspector + Reprocess)

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderDlqConsumer {

    private final ObjectMapper objectMapper;
    private final DlqIncidentRepository incidentRepository;
    private final MeterRegistry meterRegistry;

    @KafkaListener(
            topics = "orders.DLQ",
            groupId = "orders-dlq-inspector",
            // Consume from beginning on startup — don't miss pre-existing DLQ messages
            properties = {"auto.offset.reset=earliest"}
    )
    public void inspect(ConsumerRecord<String, String> record) {
        String originalTopic   = getHeader(record, "dlq-original-topic");
        String exceptionClass  = getHeader(record, "dlq-exception-class");
        String exceptionMsg    = getHeader(record, "dlq-exception-message");
        String failedAt        = getHeader(record, "dlq-failed-at");

        log.error("DLQ message received | topic={} partition={} offset={} | error={}: {}",
                originalTopic,
                getHeader(record, "dlq-original-partition"),
                getHeader(record, "dlq-original-offset"),
                exceptionClass,
                exceptionMsg);

        // Persist DLQ incident for dashboard + audit trail
        DlqIncident incident = DlqIncident.builder()
                .originalTopic(originalTopic)
                .payload(record.value())
                .exceptionClass(exceptionClass)
                .exceptionMessage(exceptionMsg)
                .failedAt(Instant.parse(failedAt))
                .status(DlqStatus.PENDING)
                .build();
        incidentRepository.save(incident);

        // Increment counter for Grafana alerting
        meterRegistry.counter("dlq.messages.received",
                "topic", originalTopic,
                "exception", exceptionClass).increment();
    }

    private String getHeader(ConsumerRecord<?, ?> record, String key) {
        Header header = record.headers().lastHeader(key);
        return header != null ? new String(header.value()) : "unknown";
    }
}
```

### Redrive Service (Replay DLQ → Main Queue)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class DlqRedriveService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final DlqIncidentRepository incidentRepository;

    /**
     * Redrive a single DLQ incident back to the original topic.
     * Called manually by an engineer after the root cause is fixed.
     */
    @Transactional
    public void redriveIncident(UUID incidentId) {
        DlqIncident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IncidentNotFoundException(incidentId));

        if (incident.getStatus() != DlqStatus.PENDING) {
            throw new InvalidIncidentStateException(
                    "Can only redrive PENDING incidents, current status: " + incident.getStatus());
        }

        try {
            // Send back to the original topic
            kafkaTemplate.send(incident.getOriginalTopic(), incident.getPayload()).get();
            incident.setStatus(DlqStatus.REDRIVEN);
            incident.setRedrivenAt(Instant.now());
            log.info("Redriven DLQ incident {} to topic {}", incidentId, incident.getOriginalTopic());
        } catch (Exception e) {
            incident.setStatus(DlqStatus.REDRIVE_FAILED);
            incident.setLastError(e.getMessage());
            throw new RedriveException("Redrive failed for incident " + incidentId, e);
        } finally {
            incidentRepository.save(incident);
        }
    }

    /**
     * Bulk redrive — redrive all PENDING incidents for a given topic.
     * Use after deploying a fix that addresses a batch of failures.
     */
    @Transactional
    public RedriveResult bulkRedrive(String topic, int batchSize) {
        List<DlqIncident> pending = incidentRepository
                .findPendingByTopicOrderByFailedAt(topic, PageRequest.of(0, batchSize));

        int succeeded = 0, failed = 0;
        for (DlqIncident incident : pending) {
            try {
                redriveIncident(incident.getId());
                succeeded++;
            } catch (Exception e) {
                log.error("Failed to redrive incident {}: {}", incident.getId(), e.getMessage());
                failed++;
            }
        }

        return new RedriveResult(topic, succeeded, failed, pending.size());
    }
}
```

---

## Implementation: RabbitMQ

### Queue Declaration with DLX (Dead Letter Exchange)

RabbitMQ routes failed messages via a **Dead Letter Exchange (DLX)** — a regular exchange configured as the dead letter destination for another queue.

```java
@Configuration
public class RabbitMqDlqConfig {

    // ── Main infrastructure ──────────────────────────────────────────────
    @Bean
    public TopicExchange mainExchange() {
        return new TopicExchange("orders.exchange");
    }

    @Bean
    public TopicExchange deadLetterExchange() {
        return new TopicExchange("orders.dlx"); // DLX — routes to DLQ
    }

    @Bean
    public Queue mainQueue() {
        return QueueBuilder.durable("orders.queue")
                // Any rejected/expired message routes to the DLX
                .withArgument("x-dead-letter-exchange", "orders.dlx")
                .withArgument("x-dead-letter-routing-key", "orders.dead")
                // Optional: per-message TTL — message goes to DLQ if not consumed in 24h
                .withArgument("x-message-ttl", 86_400_000L)
                // Optional: max queue length before head is dead-lettered
                .withArgument("x-max-length", 100_000)
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable("orders.dlq")
                // DLQ has a longer retention than the main queue
                .withArgument("x-message-ttl", 1_209_600_000L) // 14 days
                .build();
    }

    // ── Bindings ─────────────────────────────────────────────────────────
    @Bean
    public Binding mainBinding() {
        return BindingBuilder.bind(mainQueue())
                .to(mainExchange())
                .with("orders.#");
    }

    @Bean
    public Binding dlqBinding() {
        return BindingBuilder.bind(deadLetterQueue())
                .to(deadLetterExchange())
                .with("orders.dead");
    }
}
```

### RabbitMQ Consumer with Manual Acknowledgement

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderRabbitConsumer {

    private final OrderService orderService;
    private final MeterRegistry meterRegistry;

    @RabbitListener(queues = "orders.queue")
    public void consume(Message message, Channel channel,
                        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
        String payload = new String(message.getBody());
        try {
            Order order = objectMapper.readValue(payload, Order.class);
            orderService.process(order);

            // ✅ ACK — message successfully processed, remove from queue
            channel.basicAck(deliveryTag, false);
            meterRegistry.counter("orders.processed").increment();

        } catch (JsonProcessingException e) {
            // Permanent failure — malformed JSON, retrying won't help
            // requeue=false → message routes to DLX → DLQ
            log.error("Malformed order payload, routing to DLQ: {}", e.getMessage());
            channel.basicNack(deliveryTag, false, false); // false = do NOT requeue
            meterRegistry.counter("orders.dlq.routed", "reason", "deserialization_error").increment();

        } catch (TransientServiceException e) {
            // Transient failure — requeue for retry
            // requeue=true → message goes back to the head of the queue
            log.warn("Transient failure processing order, requeueing: {}", e.getMessage());
            channel.basicNack(deliveryTag, false, true); // true = requeue
            // Note: RabbitMQ spring-retry handles exponential backoff before requeue
        }
    }
}
```

```yaml
# application.yml — RabbitMQ retry with exponential backoff
spring:
  rabbitmq:
    listener:
      simple:
        acknowledge-mode: manual       # Manual ACK gives full control
        retry:
          enabled: true
          max-attempts: 4
          initial-interval: 1000ms     # 1s first retry
          multiplier: 2.0              # 1s → 2s → 4s → DLQ
          max-interval: 30000ms
          stateless: false             # Stateful retry tracks per-message state
```

---

## Implementation: AWS SQS

### Terraform Configuration

```hcl
# Main queue with DLQ redrive policy
resource "aws_sqs_queue" "orders" {
  name                       = "orders-queue"
  visibility_timeout_seconds = 150    # 6× average processing time of 25s
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.orders_dlq.arn
    maxReceiveCount     = 4  # 4 delivery attempts before DLQ
  })
}

resource "aws_sqs_queue" "orders_dlq" {
  name                      = "orders-queue-dlq"
  message_retention_seconds = 1209600 # 14 days — longer than main queue
}

# CloudWatch alarm — alert the moment DLQ receives any message
resource "aws_cloudwatch_metric_alarm" "orders_dlq_not_empty" {
  alarm_name          = "orders-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Messages in DLQ indicate consumer failures requiring investigation"
  alarm_actions       = [aws_sns_topic.on_call_alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.orders_dlq.name
  }
}
```

### Spring Boot SQS Consumer

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class SqsOrderConsumer {

    private final OrderService orderService;
    private final SqsTemplate sqsTemplate;

    @SqsListener(value = "${aws.sqs.orders-queue-url}", acknowledgementMode = AcknowledgementMode.MANUAL)
    public void consume(Order order, Acknowledgement ack,
                        @Header("ApproximateReceiveCount") int receiveCount,
                        @Header("MessageId") String messageId) {
        log.info("Processing order {} (attempt {})", order.getId(), receiveCount);

        try {
            orderService.process(order);
            ack.acknowledge(); // ✅ Delete from SQS
        } catch (NonRetryableException e) {
            // Permanent failure — let the message exhaust its receiveCount
            // and route to DLQ naturally (do not ACK)
            log.error("Permanent failure for order {}, attempt {}/{}: {}",
                    order.getId(), receiveCount, 4, e.getMessage());
            // Not acknowledging → visibility timeout expires → message reappears
            // After maxReceiveCount (4) it moves to DLQ automatically
        } catch (Exception e) {
            // Transient failure — same as above, but log differently
            log.warn("Transient failure for order {}, attempt {}/{}: {}",
                    order.getId(), receiveCount, 4, e.getMessage());
        }
    }
}
```

### SQS Redrive (AWS CLI + Java SDK)

```bash
# List messages in the DLQ for inspection
aws sqs receive-message \
    --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/orders-queue-dlq \
    --attribute-names All \
    --message-attribute-names All \
    --max-number-of-messages 10

# Start a redrive task — moves all DLQ messages back to the source queue
aws sqs start-message-move-task \
    --source-arn arn:aws:sqs:us-east-1:123456789012:orders-queue-dlq \
    --destination-arn arn:aws:sqs:us-east-1:123456789012:orders-queue \
    --max-number-of-messages-per-second 10 # Throttle to avoid overwhelming the consumer
```

```java
// Programmatic SQS redrive via AWS SDK v2
@Service
@RequiredArgsConstructor
public class SqsRedriveService {

    private final SqsClient sqsClient;

    @Value("${aws.sqs.orders-dlq-arn}")
    private String dlqArn;

    @Value("${aws.sqs.orders-queue-arn}")
    private String sourceQueueArn;

    public String startRedrive(int messagesPerSecond) {
        StartMessageMoveTaskResponse response = sqsClient.startMessageMoveTask(r -> r
                .sourceArn(dlqArn)
                .destinationArn(sourceQueueArn)
                .maxNumberOfMessagesPerSecond(messagesPerSecond)
        );

        log.info("Started SQS redrive task: {}", response.taskHandle());
        return response.taskHandle();
    }

    public MessageMoveTaskStatus checkRedriveStatus(String taskHandle) {
        ListMessageMoveTasksResponse response = sqsClient.listMessageMoveTasks(r ->
                r.sourceArn(dlqArn));

        return response.results().stream()
                .filter(t -> t.taskHandle().equals(taskHandle))
                .findFirst()
                .map(t -> new MessageMoveTaskStatus(
                        t.status(), t.approximateNumberOfMessagesMoved(),
                        t.approximateNumberOfMessagesToMove()))
                .orElseThrow();
    }
}
```

---

## Senior Deep Dive

### 1. The Ordering vs. Throughput Trade-off

Routing a failed message to the DLQ breaks the processing order for messages that follow it. For most systems this is acceptable. For some, it is catastrophic.

<DlqOrderingThroughputDiagram />

**Decision framework:**

| System Type | Ordering Requirement | Recommended Strategy |
|---|---|---|
| Notification service | ❌ None | DLQ — order doesn't matter |
| Search index sync | ❌ None (idempotent upserts) | DLQ — last write wins |
| E-commerce order status | ⚠️ Soft (within order) | DLQ + per-aggregate ordering via partition key |
| Bank account ledger | ✅ Strict | Pause partition — no DLQ |
| Inventory adjustments | ✅ Strict | Pause partition or saga compensation |

**Kafka partition key for per-aggregate ordering:**

```java
// Ensure all events for the same aggregate go to the same partition
// → Ordering is preserved per aggregate, DLQ is safe
kafkaTemplate.send(
    new ProducerRecord<>(
        "orders",
        order.getOrderId().toString(), // partition key = order ID
        order
    )
);
// Events for orderId=123 always go to the same partition → in-order processing
// A failure on orderId=123 does NOT affect orderId=456 on a different partition
```

---

### 2. Idempotent DLQ Consumers

When a message is redriven from the DLQ, the consumer processes it again. If the first processing attempt partially succeeded (e.g., the DB write succeeded but the downstream API call failed), a naive consumer will try to create the same record again.

```java
// ❌ Non-idempotent consumer — safe for first delivery, unsafe for redrive
@KafkaListener(topics = "orders")
public void process(Order order) {
    orderRepository.save(order);        // If first attempt: succeeds
                                        // If redriven: DUPLICATE KEY VIOLATION ❌
    paymentService.charge(order);
}

// ✅ Idempotent consumer — safe for both first delivery and redrive
@KafkaListener(topics = "orders")
@Transactional
public void process(ConsumerRecord<String, Order> record) {
    String eventId = record.topic() + "-" + record.partition() + "-" + record.offset();

    // Check if already successfully processed (from first delivery attempt)
    if (processedEventRepository.existsById(eventId)) {
        log.info("Event {} already processed, skipping (idempotent)", eventId);
        return; // ACK and move on
    }

    Order order = record.value();
    orderRepository.save(order);         // Idempotent: upsert by business ID
    paymentService.charge(order);        // Idempotent: check if charge already exists

    // Record successful processing — prevents duplicate on redrive
    processedEventRepository.save(new ProcessedEvent(eventId, Instant.now()));
}
```

---

### 3. Schema Evolution and the DLQ Spike Pattern

One of the most common causes of mass DLQ spikes in production: a schema change that breaks existing consumers.

<SchemaEvolutionDlqSpikeDiagram />

**Defense in layers:**

**Layer 1 — Schema Registry compatibility check:**

```bash
# Register the new schema and check backward compatibility BEFORE deploying
curl -X POST http://schema-registry:8081/compatibility/subjects/orders-value/versions/latest \
  -H "Content-Type: application/json" \
  -d @order_schema_v2.avsc
# {"is_compatible":false} → DO NOT DEPLOY — will break existing consumers
```

**Layer 2 — Never remove optional fields; only add:**

```java
// ❌ Breaking change — removes a field consumers rely on
public class OrderV2 {
    private UUID id;
    private BigDecimal totalAmount;
    // private String customerId; ← REMOVED — breaks consumers that read this field
}

// ✅ Backward compatible — adds an optional field with a default
public class OrderV2 {
    private UUID id;
    private BigDecimal totalAmount;
    private String customerId;
    private String currency = "USD"; // New field — nullable/defaulted
}
```

**Layer 3 — Classify deserialization errors as non-retryable:**

```java
// Route schema errors directly to DLQ without wasting retries
handler.addNotRetryableExceptions(
        DeserializationException.class,
        JsonMappingException.class,
        InvalidFormatException.class
);
```

**Layer 4 — DLQ spike runbook:**

```
1. Check DLQ message headers for "dlq-exception-class"
2. If DeserializationException:
   a. Pull a sample DLQ message payload
   b. Compare schema against current consumer version
   c. Identify the breaking field
   d. Rollback consumer OR deploy a schema-tolerant version
   e. Redrive DLQ messages after fix is deployed

3. If NullPointerException or IllegalArgumentException:
   a. Check if a new required field was added to the message
   b. Identify the producer that sends incomplete payloads
   c. Fix producer to include the field
   d. Redrive DLQ after fix
```

---

### 4. DLQ Metrics, Alerting, and Dashboards

The DLQ should be empty under normal operating conditions. Any non-zero depth is a production incident.

```java
@Component
@RequiredArgsConstructor
public class DlqMetricsCollector {

    private final DlqIncidentRepository incidentRepository;
    private final MeterRegistry registry;

    @Scheduled(fixedDelay = 10_000)
    public void collectMetrics() {
        // 1. DLQ depth per topic — alert on ANY value > 0
        Map<String, Long> depthByTopic = incidentRepository
                .countPendingGroupedByTopic();
        depthByTopic.forEach((topic, count) ->
                registry.gauge("dlq.depth", Tags.of("topic", topic), count));

        // 2. Age of oldest pending DLQ message — alert if > 30 minutes
        incidentRepository.findOldestPendingByTopic().forEach((topic, oldest) -> {
            long ageMinutes = Duration.between(oldest.getFailedAt(), Instant.now()).toMinutes();
            registry.gauge("dlq.oldest.message.age.minutes",
                    Tags.of("topic", topic), ageMinutes);
        });

        // 3. DLQ ingestion rate — spike indicates a breaking change
        registry.summary("dlq.ingestion.rate"); // Updated by DlqConsumer per message
    }
}
```

**Prometheus alerting rules:**

```yaml
groups:
  - name: dlq_alerts
    rules:
      # P1: Any message in DLQ — immediate investigation required
      - alert: DLQNotEmpty
        expr: dlq_depth > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "DLQ has {{ $value }} pending messages on topic {{ $labels.topic }}"
          runbook: "https://wiki.company.com/runbooks/dlq-investigation"

      # P2: Old unresolved DLQ messages approaching expiration
      - alert: DLQMessageApproachingExpiry
        expr: dlq_oldest_message_age_minutes > 180   # 3 hours
        labels:
          severity: warning
        annotations:
          summary: "DLQ messages on {{ $labels.topic }} are {{ $value }} minutes old"

      # P2: DLQ spike — many messages arriving in a short window (schema break?)
      - alert: DLQIngestionSpike
        expr: rate(dlq_messages_received_total[5m]) > 10
        labels:
          severity: warning
        annotations:
          summary: "DLQ receiving {{ $value }} messages/sec — possible schema change"
```

---

### 5. The DLQ Across Broker Technologies

The DLQ concept is universal, but implementation details differ across brokers.

| Aspect | Kafka | RabbitMQ | AWS SQS |
|---|---|---|---|
| **DLQ mechanism** | Separate topic (`orders.DLQ`) written to by consumer | Dead Letter Exchange (DLX) → Dead Letter Queue | Separate SQS queue via redrive policy |
| **Routing trigger** | Application-level (`DeadLetterPublishingRecoverer`) | Broker-level (NACK with `requeue=false`, TTL, max-length) | Broker-level (`maxReceiveCount` exceeded) |
| **Message ordering** | Preserved within partition | Not guaranteed after DLQ | Not guaranteed (Standard queue) |
| **DLQ message metadata** | Added as Kafka headers by recoverer | Added as message properties by RabbitMQ | Available via `ApproximateReceiveCount`, `MessageId` attributes |
| **Redrive mechanism** | Re-publish to original topic (manual or automated) | Re-queue via shovel plugin or management API | `StartMessageMoveTask` API |
| **Retention** | Configurable topic retention (days) | Configurable queue TTL | Up to 14 days |
| **FIFO ordering support** | ✅ Per-partition | ❌ | ✅ FIFO queues |
| **Multi-level DLQ** | ✅ Retry topics → DLQ | ✅ Multiple DLX hops | ❌ Single level |

**Kafka-specific: multi-level retry topic chain:**

```
orders (main topic)
    ↓ fail attempt 1
orders.retry.1s      (1 second delay via consumer pause)
    ↓ fail attempt 2
orders.retry.30s     (30 second delay)
    ↓ fail attempt 3
orders.retry.5m      (5 minute delay)
    ↓ fail attempt 4
orders.DLQ           (no more retries — engineer must intervene)
```

```java
// Consumer for each retry topic applies the configured delay
@KafkaListener(topics = "orders.retry.1s", groupId = "orders-retry-1s")
public void retryAfter1s(ConsumerRecord<String, Order> record) {
    long publishedAt = Long.parseLong(
            new String(record.headers().lastHeader("retry-publish-time").value()));
    long delayMs = 1_000L - (System.currentTimeMillis() - publishedAt);

    if (delayMs > 0) {
        Thread.sleep(delayMs); // Enforce the delay
    }
    // Re-route to main topic for reprocessing
    kafkaTemplate.send("orders", record.key(), record.value());
}
```

---

### 6. Production Incident Runbook

A structured decision tree for diagnosing and resolving DLQ incidents.

<DlqIncidentRunbookDiagram />

---

## Interview Decision Matrix

| Scenario | Recommended Strategy | Why |
|---|---|---|
| General microservice event processing | DLQ with exponential backoff (3–5 retries) | Balances retry for transient failures, safety net for permanent ones |
| Financial ledger / account balance updates | Pause partition — no DLQ | Ordering is a business invariant; DLQ breaks it |
| Search index synchronization | DLQ — safe | Consumers are idempotent upserts; ordering doesn't matter |
| Non-critical analytics events | Discard on failure | Investigation cost exceeds value of a lost click event |
| Schema mismatch causing mass failures | DLQ + immediate non-retryable classification | No retries on deserialization errors; inspect and fix schema first |
| Downstream service temporarily down | Exponential backoff without DLQ (3 retries) | Transient — will recover; DLQ introduces unnecessary manual work |
| Business logic failure (insufficient funds) | Compensating event — no DLQ | Technical retry will always fail; domain-level response is correct |
| Kafka high-throughput, cannot block partition | Retry topics → DLQ | Non-blocking retry preserves main partition throughput |

:::tip[Interview Phrasing — DLQ Fundamentals]
*"A DLQ is a reliability guarantee, not just an error bin. Its job is to ensure that no message is silently dropped. When a consumer encounters a permanent failure — malformed payload, schema mismatch, invalid state — retrying will never succeed. The message must be isolated into the DLQ so the main queue keeps flowing. After fixing the root cause, we redrive the DLQ messages back to the main queue. The two things I always make sure to get right: classifying failures as retryable vs. non-retryable so we don't waste time retrying poison pills, and making consumers idempotent so redrives are safe even if the first delivery partially succeeded."*
:::

:::tip[Interview Phrasing — When NOT to DLQ]
*"For a financial ledger where message ordering is an absolute business invariant, a DLQ is the wrong pattern. If TXN-101 fails and routes to the DLQ while TXN-102 is processed, the account balance is computed in the wrong order — potentially approving a withdrawal that should have been rejected. For these systems, the correct pattern is to pause the Kafka partition on failure, page on-call immediately, and block all further processing until the issue is manually resolved. Throughput takes a back seat to correctness."*
:::

---

## Further Reading

- [Spring Kafka — Error Handling and Retries](https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html) — Official Spring Kafka docs covering `DefaultErrorHandler`, `DeadLetterPublishingRecoverer`, and retry configuration.
- [AWS SQS — Dead Letter Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html) — AWS documentation on DLQ setup, redrive policy, and the `StartMessageMoveTask` API.
- [RabbitMQ — Dead Letter Exchanges](https://www.rabbitmq.com/dlx.html) — Official RabbitMQ docs on DLX routing arguments, per-message TTL, and queue-length-based dead lettering.
- [Confluent — Error Handling in Kafka Streams](https://docs.confluent.io/platform/current/streams/developer-guide/error-handling.html) — Covers DLQ integration patterns for Kafka Streams applications.
- [Designing Data-Intensive Applications — Chapter 11 (Stream Processing)](https://dataintensive.net/) — Kleppmann's treatment of exactly-once semantics, fault tolerance, and ordering guarantees; foundational context for DLQ trade-offs.
- [Transactional Outbox Pattern](./outbox-pattern.md) — The companion pattern: ensuring messages are reliably published to the queue in the first place, so the DLQ only handles genuine processing failures rather than publish failures.
- [Resilience4j Documentation](https://resilience4j.readme.io/docs/retry) — Circuit breakers, retry policies, and bulkheads that work alongside DLQs to handle transient failures without unnecessary DLQ routing.