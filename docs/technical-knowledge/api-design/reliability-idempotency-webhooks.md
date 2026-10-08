---
id: reliability-idempotency-webhooks
title: API Reliability - Idempotency, Concurrency, Retries & Webhooks
sidebar_label: Idempotency & Webhooks
description: Designing reliable APIs - Idempotency-Key server implementation with Postgres, optimistic locking, safe retries with backoff and jitter, timeouts, webhook delivery with HMAC signing and replay protection, and AsyncAPI for event contracts.
tags:
  - technical-knowledge
  - api-design
  - idempotency
  - webhooks
  - reliability
---

# API Reliability: Idempotency, Concurrency, Retries & Webhooks

Networks fail *after* the server committed but *before* the client heard back. Clients will retry. If your API cannot tell a retry from a new request, you charge twice.

## 1. Idempotency-Key Pattern

Client generates a unique key per **logical operation** (UUID v4) and sends it on every retry of the same operation.

```http
POST /payments
Idempotency-Key: 7c9e6679-7425-40de-944b-e07fc1f90ae7
Content-Type: application/json

{ "amount": "1999", "currency": "USD", "customerId": "cus_9" }
```

### Server Semantics

| Situation | Response |
|---|---|
| First time seen | Process, store result, return it |
| Same key, same payload, original **completed** | Return the **stored** response (same status and body), header `Idempotent-Replayed: true` |
| Same key, same payload, original **in progress** | `409 Conflict` (or wait/poll) with `Retry-After` |
| Same key, **different** payload | `422`/`409` - key reuse is a client bug (compare a request fingerprint hash) |
| Key expired (e.g. > 24h) | Treat as new (document the TTL) |

### Storage Schema (PostgreSQL)

```sql
CREATE TABLE idempotency_keys (
  tenant_id        text        NOT NULL,
  key              text        NOT NULL,
  request_hash     bytea       NOT NULL,          -- SHA-256 of method + path + canonical body
  status           text        NOT NULL,          -- IN_PROGRESS | COMPLETED
  response_status  int,
  response_body    jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, key)                    -- uniqueness is the lock
);
```

```java
import java.time.Duration;
import java.util.Optional;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.transaction.support.TransactionTemplate;

public final class IdempotentExecutor {
    private final IdempotencyRepository repo;
    private final TransactionTemplate tx;

    public IdempotentExecutor(IdempotencyRepository repo, TransactionTemplate tx) {
        this.repo = repo;
        this.tx = tx;
    }

    public StoredResponse execute(String tenant, String key, byte[] requestHash, java.util.function.Supplier<StoredResponse> action) {
        return tx.execute(status -> {
            try {
                repo.insertInProgress(tenant, key, requestHash, Duration.ofHours(24));  // PK violation if exists
            } catch (DuplicateKeyException dup) {
                Optional<IdempotencyRecord> existing = repo.find(tenant, key);
                IdempotencyRecord rec = existing.orElseThrow();
                if (!java.util.Arrays.equals(rec.requestHash(), requestHash)) {
                    throw new IdempotencyKeyReusedException(key);                       // -> 422
                }
                if (rec.completed()) {
                    return rec.toStoredResponse();                                      // replay
                }
                throw new RequestInProgressException(key);                              // -> 409 + Retry-After
            }
            StoredResponse result = action.get();          // business write in the SAME transaction
            repo.complete(tenant, key, result);
            return result;
        });
    }
}
```

**Key design points**

- **Business write and key completion in one DB transaction** - otherwise a crash between them re-executes the side effect.
- External side effects (calling a PSP, sending email) need *their own* idempotency key derived from yours (`payment-provider-key = idempotencyKey + ":charge"`), or use the [transactional outbox](../kafka/advanced/exactly-once-vs-dedup.md) pattern.
- Scope keys per tenant/user (never global) to prevent cross-tenant replay/leak.
- Keep stored responses small; purge with a TTL job.
- Natural idempotency beats keys when possible: `PUT /orders/{id}` with client-chosen id, unique business constraints (`UNIQUE (order_id, payment_attempt)`).

See also [Data Consistency](../system-design/data-consistency.md) for the broader treatment.

## 2. Optimistic Concurrency (Lost Update Prevention)

```
Client A GET order (v7)         Client B GET order (v7)
Client A PUT If-Match: "v7" -> 200 (v8)
                                Client B PUT If-Match: "v7" -> 412 Precondition Failed
```

```java
@Entity
public class OrderEntity {
    @Id String id;
    @Version long version;     // Hibernate adds "WHERE version = ?" and increments on UPDATE
}
// OptimisticLockException -> map to 412 (if client sent If-Match) or 409
```

Use pessimistic locks (`SELECT ... FOR UPDATE`) only for short, high-contention critical sections (inventory decrement); prefer conditional updates:

```sql
UPDATE inventory SET quantity = quantity - :n WHERE sku = :sku AND quantity >= :n;  -- 0 rows -> out of stock
```

## 3. Client Retry Policy

| Rule | Detail |
|---|---|
| Retry only **safe/idempotent** operations (or ones with idempotency keys) | Never blindly retry non-idempotent POST |
| Retry on | Network errors, 408, 429, 502, 503, 504 (honour `Retry-After`) |
| Do not retry | 4xx other than 408/429 (will fail identically), 501 |
| Backoff | Exponential with **full jitter**: `sleep = random(0, min(cap, base * 2^attempt))` |
| Budget | Max attempts (3-5) AND a total deadline; **retry budget** (`<= 10%` extra traffic) to avoid retry storms |
| Timeouts | Always set connect + read timeouts; propagate deadlines downstream (`grpc-timeout`-style) |

```java
// Resilience4j
RetryConfig cfg = RetryConfig.custom()
    .maxAttempts(4)
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(200, 2.0, 0.5, 5_000))
    .retryOnException(e -> e instanceof java.net.SocketTimeoutException || e instanceof java.io.IOException)
    .build();
```

Retries multiply across layers: 3 retries x 3 layers = 27 calls on the leaf. Retry at **one** layer (the edge/client) and use circuit breakers elsewhere ([Circuit Breaker](../system-design/circuit-breaker-pattern.md)).

## 4. Webhooks: Designing Event Delivery

Webhooks invert the flow: **you** call the customer's endpoint. You are now the client of an unreliable server.

### Delivery Semantics

- **At-least-once** with retries; consumers must dedupe by `event.id`.
- No ordering guarantee - include `createdAt` and a monotonically increasing `sequence` per resource; recommend "fetch latest state via API" on receipt.
- Respond `2xx` fast (< 5-10 s); heavy work async. Non-2xx or timeout -> retry.

```json
{
  "id": "evt_1NfK2",
  "type": "order.shipped",
  "apiVersion": "2025-03-01",
  "createdAt": "2025-03-04T09:12:45Z",
  "data": { "orderId": "ord_8f3kd92k", "trackingNumber": "1Z999" }
}
```

### Retry Schedule

Exponential backoff over ~72 hours (e.g. 5 s, 5 min, 30 min, 2 h, 6 h, 12 h, 24 h), then mark endpoint **disabled** and notify the owner. Provide a dashboard/API to **replay** events and list delivery attempts.

### Signing (Authenticity, Integrity, Replay Protection)

```
header:  Webhook-Signature: t=1709548365,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
signed payload = timestamp + "." + rawBody
v1 = HMAC_SHA256(endpointSecret, signedPayload)   (hex)
```

```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

public static boolean verify(String secret, String timestamp, String rawBody, String providedHex, long toleranceSeconds)
        throws Exception {
    long age = Math.abs(System.currentTimeMillis() / 1000 - Long.parseLong(timestamp));
    if (age > toleranceSeconds) {
        return false;                                              // replay protection (e.g. 300 s)
    }
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    byte[] expected = mac.doFinal((timestamp + "." + rawBody).getBytes(StandardCharsets.UTF_8));
    byte[] provided = HexFormat.of().parseHex(providedHex);
    return MessageDigest.isEqual(expected, provided);              // constant-time comparison
}
```

Consumer rules: verify against the **raw bytes** (not re-serialised JSON), constant-time compare, enforce timestamp tolerance, support **secret rotation** (accept two secrets during rollover), dedupe by event id, and return 2xx only after durably enqueuing.

### Provider-Side Safeguards (SSRF)

Webhook URLs are attacker-controlled input: block private/link-local/metadata IP ranges (`169.254.169.254`, `10/8`, `127/8`), re-resolve DNS at delivery time (DNS rebinding), limit redirects, set short timeouts, and send from an isolated egress proxy.

## 5. AsyncAPI: Contracts for Events

OpenAPI describes request/response; **AsyncAPI** describes channels and messages (Kafka, AMQP, MQTT, WebSocket).

```yaml
asyncapi: 3.0.0
info: { title: Orders Events, version: 1.0.0 }
channels:
  orderShipped:
    address: orders.shipped.v1
    messages:
      OrderShipped:
        payload: { $ref: '#/components/schemas/OrderShipped' }
operations:
  publishOrderShipped:
    action: send
    channel: { $ref: '#/channels/orderShipped' }
components:
  schemas:
    OrderShipped:
      type: object
      required: [orderId, shippedAt]
      properties:
        orderId: { type: string }
        shippedAt: { type: string, format: date-time }
```

Pair with a schema registry and compatibility modes (see [Schema Registry](../kafka/advanced/schema-registry.md)). The same rules apply: events are public contracts; version and evolve additively.

## 6. Reliability Checklist

- [ ] Every unsafe POST accepts `Idempotency-Key` (or is naturally idempotent) and the spec documents TTL and conflict behaviour
- [ ] Idempotency record and business write commit atomically
- [ ] Updates require `If-Match` / version; 412 documented
- [ ] Clients use jittered backoff, deadlines, retry budgets
- [ ] Webhooks signed with timestamp, retried for days, replayable, and SSRF-hardened
- [ ] Event ids unique; consumers documented as at-least-once

Next: [Contract Governance & Testing](./contract-governance-testing.md).
