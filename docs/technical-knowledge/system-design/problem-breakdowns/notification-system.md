---
id: notification-system
title: Design an Omni-Channel Distributed Notification System
sidebar_label: 25. Notification System
description: Staff-level system design breakdown for an omni-channel notification platform handling billions of push notifications, emails, and SMS with priority queuing.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design an Omni-Channel Distributed Notification System

An omni-channel notification system (e.g., Apple APNs integration, Firebase Cloud Messaging, Twilio, Amazon SNS, Courier) delivers billions of automated messages daily across multiple channels: Mobile Push, SMS, Email, and In-App Badges. The platform must handle extreme delivery volume, prioritize mission-critical alerts (2FA codes, fraud alerts) over marketing newsletters, respect user preference filters and quiet hours, and gracefully failover across third-party service providers.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Multi-Channel Dispatch**: Support Mobile Push (iOS APNS, Android FCM), SMS (Twilio/Sinch), Email (SendGrid/Amazon SES), and In-App notifications.
2. **Priority Tiers**: High-priority alerts (2FA, security login alerts) must be delivered within `< 5 seconds`. Marketing campaigns can be delivered within minutes or hours.
3. **Template & Localization (i18n)**: Dynamically render messages from parameterized templates localized to the user's preferred language.
4. **User Preferences & Quiet Hours**: Respect user opt-out settings and defer non-critical notifications during local quiet hours (e.g. 10 PM to 8 AM).
5. **Deduplication & Rate Limiting**: Prevent notification storms (e.g., maximum 1 marketing push per day, deduplicate identical notifications within a 1-hour window).

### Non-Functional Requirements
- **High Ingestion & Delivery Throughput**: Handle **100,000+ notification dispatches per second** at peak.
- **Provider Redundancy & Failover**: Automatically reroute traffic to a secondary vendor if the primary SMS or email gateway suffers an outage.
- **At-Least-Once Delivery**: Notifications must never be lost.
- **Auditability**: Maintain full audit logs of delivery attempts, receipt acknowledgments, and bounce errors.

### Capacity Estimations & Sizing
- **Daily Notifications**: 1 Billion notifications/day globally across all channels.
  - Throughput = $1,000,000,000 / 86,400 \approx$ **11,500 dispatches/sec average** (peaking at **60,000 dispatches/sec** during flash sales and breaking news).
- **Channel Breakdown**: 70% Mobile Push, 20% Email, 10% SMS.
- **Payload Sizing**:
  - Notification metadata: `notification_id` (16 bytes) + `user_id` (16 bytes) + `channel` (8 bytes) + `status` (8 bytes) + timestamps $\approx$ **128 bytes**.
  - Daily metadata storage = $1\text{B} \times 128\text{ bytes} \approx$ **128 GB / day** $\implies$ **46.7 TB / year** (stored in ClickHouse or partitioned Cassandra for delivery auditing).

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                   USER_PREFERENCES                     │
├──────────────────┬──────────────┬──────────────────────┤
│ user_id          │ UUID         │ PRIMARY KEY          │
│ email_enabled    │ BOOLEAN      │ DEFAULT TRUE         │
│ sms_enabled      │ BOOLEAN      │ DEFAULT TRUE         │
│ push_enabled     │ BOOLEAN      │ DEFAULT TRUE         │
│ quiet_hours_start│ TIME         │ e.g. "22:00:00"      │
│ quiet_hours_end  │ TIME         │ e.g. "08:00:00"      │
│ timezone         │ VARCHAR(64)  │ e.g. "America/New_...│
│ language_code    │ CHAR(5)      │ e.g. "en-US"         │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     DEVICE_TOKEN                       │
├──────────────────┬──────────────┬──────────────────────┤
│ device_token_id  │ UUID         │ PRIMARY KEY          │
│ user_id          │ UUID         │ INDEX, FK            │
│ platform         │ VARCHAR(16)  │ IOS_APNS / ANDROID_FCM
│ push_token       │ VARCHAR(255) │ Hex / Base64 Token   │
│ is_valid         │ BOOLEAN      │ DEFAULT TRUE         │
│ updated_at       │ TIMESTAMP    │ Token refresh time   │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   NOTIFICATION_LOG                     │
├──────────────────┬──────────────┬──────────────────────┤
│ notification_id  │ UUID         │ PRIMARY KEY          │
│ user_id          │ UUID         │ INDEX, FK            │
│ template_id      │ VARCHAR(64)  │ Template Identifier  │
│ channel          │ VARCHAR(16)  │ PUSH / EMAIL / SMS   │
│ priority         │ VARCHAR(16)  │ HIGH / NORMAL / LOW  │
│ status           │ VARCHAR(16)  │ SENT / FAILED / BOUNC
│ provider         │ VARCHAR(32)  │ TWILIO / SENDGRID /..│
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### Send Notification Request
```http
POST /api/v1/notifications/send
Content-Type: application/json
Authorization: Bearer <service_token>
Idempotency-Key: notif_99a812-1082

{
  "user_id": "usr_88192a01",
  "template_id": "two_factor_auth",
  "priority": "HIGH", // "HIGH", "NORMAL", "LOW"
  "parameters": {
    "otp_code": "841294",
    "expiration_minutes": "5"
  },
  "channels": ["SMS", "PUSH"]
}
```
**Response (`202 Accepted`)**:
```json
{
  "notification_id": "notif_99a812-1082",
  "status": "QUEUED"
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="notification-system" title="Omni-Channel Notification Pipeline & Priority Dispatch Architecture" />

### Core Pipeline Stages

#### 1. Ingestion & Validation
1. Client microservices issue `POST /api/v1/notifications/send` with an `Idempotency-Key`.
2. The **Notification Gateway** validates authentication, verifies rate limits, and checks idempotency in Redis.
3. Returns `202 Accepted` immediately.

#### 2. User Preference & Rule Evaluation
1. The **Rules Engine**:
   - Fetches user notification preferences from Redis cache:
     - Is the channel enabled by the user?
     - Are we currently inside the user's local **Quiet Hours**? (If quiet hours apply and priority is `NORMAL` or `LOW`, defer job until morning).
   - Verifies **User Rate Limits**: Has the user received a marketing push in the last 24 hours?
2. Resolves destination targets (fetches device tokens for Push, phone number for SMS, email address for Email).

#### 3. Priority Queuing & Worker Pools
1. Notification jobs are routed to **Apache Kafka / RabbitMQ** priority queues:
   - **High-Priority Queue**: Dedicated workers for 2FA, fraud alerts, password resets.
   - **Normal-Priority Queue**: Order confirmations, shipping updates.
   - **Low-Priority Queue**: Marketing campaigns, friend recommendations.
2. Channel-specific workers (Push Workers, SMS Workers, Email Workers) consume jobs, render localized templates, and invoke external provider APIs (APNS, FCM, Twilio, SendGrid).

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Priority Queue Inversion & Thread Starvation
What happens when a marketing campaign triggers 10 Million marketing emails at 10:00 AM, and an executive attempts to log in with a 2FA OTP code?

- **The Queue Starvation Trap**: If high-priority and low-priority messages share the same queue or worker thread pool, the 2FA code is queued behind 10 Million marketing emails, resulting in an unacceptable 45-minute delivery delay!
- **Strict Infrastructure Isolation**:
  1. **Physically Independent Topics**: High-priority jobs are published to `notifications.high`; marketing jobs published to `notifications.marketing`.
  2. **Dedicated Worker Pools**: High-priority workers never consume marketing messages.
  3. **Guaranteed SLA**: High-priority queue depth remains near zero, guaranteeing 2FA delivery in `< 3 seconds` regardless of marketing campaign volume.

### Deep Dive 2: Provider Failover & Circuit Breakers (Resilience)
What happens if Twilio experiences an infrastructure outage or drops 50% of API requests?
- **Circuit Breaker Pattern (Resilience4j / Envoy)**:
  - If error rates to primary provider (Twilio) exceed **5% over a 10-second rolling window**:
  - The Circuit Breaker transitions to `OPEN`.
  - The worker immediately falls back to the **Secondary SMS Provider (Sinch / MessageBird)** with zero downtime.
  - After 60 seconds, the breaker enters `HALF-OPEN`, sending a small sample of test traffic to Twilio. If successful, it closes and restores primary routing.

### Deep Dive 3: Invalid Device Token Invalidation (APNS / FCM Cleanup)
When a user uninstalls the mobile app, APNS and FCM return an `UnregisteredDeviceToken` or `DeviceTokenNotForTopic` error.
- **The Waste Hazard**: Continuously sending push notifications to invalid tokens wastes provider bandwidth and slows down queue throughput.
- **Feedback Invalidation Loop**:
  - When a Push Worker receives an invalid token error from APNS/FCM:
  - Publishes a `TokenInvalidatedEvent` to Kafka.
  - A background cleanup worker marks `is_valid = FALSE` on the `DEVICE_TOKEN` table in PostgreSQL and purges the token from the Redis device cache.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Dispatch Model** | Synchronous Third-Party API Call | Asynchronous Message Queue (Kafka) | **Asynchronous Queue**: Third-party APIs have variable latencies (100ms - 2,000ms). Synchronous calls would block caller threads and cause upstream cascading timeouts. |
| **Queue Topology** | Single Shared FIFO Queue | Multi-Tier Priority Queues (High/Med/Low) | **Multi-Tier Priority**: Completely prevents marketing blasts from delaying mission-critical 2FA security codes. |
| **Deduplication** | Database Unique Constraint | In-Memory Redis Idempotency Lock | **Redis Idempotency**: Checking idempotency keys in Redis resolves in `< 1ms`, eliminating database index thrashing during high-volume alert surges. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands multi-channel notification routing (Push, SMS, Email).
- Designs relational schemas for Users, Device Tokens, and Notification Logs.
- Proposes message queues to decouple notification dispatch from application services.
- Implements basic templating and parameter substitution.

### Senior (L5 / IC5)
- Details the **Priority Queue Isolation** architecture to prevent marketing blasts from starving 2FA security codes.
- Implements provider circuit breakers with automated failover across redundant SMS/Email gateways.
- Enforces user preference filters, rate limits, and quiet hour scheduling.
- Designs the APNS/FCM token invalidation feedback loop to purge stale device tokens.

### Staff+ (L6 / Principal)
- Designs global multi-region active-active notification routing: Routing notifications through regional gateways nearest to third-party provider POPs to minimize WAN transit latency.
- Details strict GDPR / CCPA right-to-be-forgotten compliance: Anonymizing delivery logs and audit records while preserving financial billing reconciliations.
- Architects predictive channel fallback: If a high-priority push notification is unacknowledged after 30 seconds, automatically fall back to sending an SMS message.
