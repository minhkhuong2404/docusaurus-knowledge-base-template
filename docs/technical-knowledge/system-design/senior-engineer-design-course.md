---
id: senior-engineer-design-course
title: "Design Software Systems Like a Senior Engineer: Framework + Hotel Reservation"
sidebar_label: Senior Engineer Design Course
description: Notes from the freeCodeCamp course on designing systems like a senior engineer. Covers the 5-step framework, tradeoff discussion, and a full Booking.com-style hotel reservation design (idempotency, double-booking, sharding, search, multi-region).
tags: [system-design, interview-prep, framework, hotel-reservation, idempotency, concurrency, freecodecamp]
---

import SeniorDesignCourseDiagram from '@site/src/components/SeniorDesignCourseDiagram';

# Design Software Systems Like a Senior Engineer

> Source: freeCodeCamp course ([YouTube](https://www.youtube.com/watch?v=soTfFFIQQ8U), about 3h 15m). It teaches one repeatable framework and applies it to three systems: a music streaming platform, a hotel reservation system, and a messaging app.

:::note Scope of these notes
The course outline (chapters and topics) drives this page. The architecture details are written to the senior-review standard used across this knowledge base, so they go beyond what a spoken walkthrough covers. The Spotify-style and WhatsApp-style systems already have full pages here, linked at the bottom. This page adds the framework and the **hotel reservation** system.
:::

---

## 1. Why the Framework Matters

Interviewers score **structure, tradeoff reasoning, and communication**, not whether you reproduce a memorised diagram. Real requirements are vague, so a senior engineer first turns ambiguity into numbers and constraints.

### What interviewers actually score

| Signal | What it looks like |
|---|---|
| Problem navigation | You drive the conversation, cut scope explicitly, and state assumptions |
| Technical depth | You explain *why* a component is chosen and how it fails |
| Tradeoff reasoning | You name the cost of each choice (latency, consistency, cost, complexity) |
| Communication | You check in, summarise, and adapt when challenged |

## 2. The 5-Step Framework

<SeniorDesignCourseDiagram initialTab="framework" />

1. **Requirements.** Functional (the 3 core user actions) and non-functional (availability, consistency, latency, scale). State what is out of scope.
2. **Estimation.** Convert DAU into QPS, peak QPS (usually 2 to 5x average), storage per year, and bandwidth. Estimation exists to *choose architecture*, not to be precise.
3. **API and data model.** Endpoints first, then schema and the access patterns that drive indexes.
4. **High-level design.** Boxes and arrows for the happy path, then the async paths.
5. **Deep dives and tradeoffs.** Pick the 2 or 3 riskiest parts (contention, hot keys, failure) and go deep. Close with extensions.

### Tradeoffs and extensions checklist

- Consistency vs availability: which operations need strong consistency (money, inventory) and which tolerate eventual (search, counters)?
- Latency vs cost: caching and replicas buy latency with money and staleness.
- Simplicity vs scale: start with one primary database and justify every step away from it.
- Extensions to mention last: analytics, personalisation, fraud checks, and multi-region.

---

## 3. System: Hotel Reservation (Booking.com Style)

### 3.1 Requirements

**Functional**
- Search hotels by location, dates, guests, and filters.
- View hotel and room details, with live price and availability.
- Reserve a room, pay, and receive confirmation.
- Cancel or modify a reservation.

**Non-functional**
- **Availability over consistency for search** (a slightly stale result is fine).
- **Strong consistency for booking** (a room must never be sold twice).
- Search p99 under 500 ms, booking confirmation under a few seconds.
- Read-heavy: roughly 100:1 search to book.

### 3.2 Capacity Math

Assume 10M DAU, 1% convert to a booking attempt and each user runs about 20 searches per day.

| Metric | Calculation | Result |
|---|---|---|
| Search QPS | 10M x 20 / 86,400 | about 2,300 avg, about 10k peak |
| Bookings/day | 10M x 1% | 100k |
| Booking QPS | 100k / 86,400 | about 1.2 avg, about 10 to 50 peak |
| Inventory rows | 500k hotels x 10 room types x 365 nights | about 1.8B rows/year |

**Insight:** booking write QPS is tiny. The hard part is **correctness under contention**, not throughput. Search is where scale lives.

### 3.3 High-Level Architecture

| Component | Role |
|---|---|
| API gateway | Auth, rate limiting, routing |
| Search service + Elasticsearch | Geo, date, amenity filtering; fed by change events |
| Hotel/Inventory service | Source of truth for rooms and nightly availability |
| Reservation service | Booking state machine and idempotency |
| Payment service | External PSP calls, webhooks |
| Kafka | Outbox events: `reservation.confirmed`, `inventory.changed` |
| Redis | Hot hotel details and price cache |
| Notification service | Email and push confirmations |

### 3.4 API Design and Idempotency

```http
POST /v1/reservations
Idempotency-Key: 7c9e6679-7425-40de-944b-e07fc1f90ae7
Content-Type: application/json

{ "hotelId": "h_123", "roomTypeId": "rt_9", "checkIn": "2026-12-01",
  "checkOut": "2026-12-04", "guests": 2 }
```

Retries are guaranteed (mobile networks, gateway timeouts), so a double-submitted booking or charge is a certain failure unless the API is idempotent.

```sql
CREATE TABLE idempotency_keys (
  key           TEXT PRIMARY KEY,
  request_hash  TEXT NOT NULL,
  response_body JSONB,
  status        TEXT NOT NULL,         -- IN_PROGRESS | DONE
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Flow: `INSERT` the key first. On unique violation, return the stored response (or `409` if the `request_hash` differs). Pass the same key to the payment provider so the charge is also deduplicated.

### 3.5 Data Modeling and Inventory

Model availability **per night**, not as date ranges. It makes the invariant enforceable by the database.

```sql
CREATE TABLE room_inventory (
  hotel_id      BIGINT NOT NULL,
  room_type_id  BIGINT NOT NULL,
  stay_date     DATE   NOT NULL,
  total_rooms   INT    NOT NULL,
  reserved      INT    NOT NULL DEFAULT 0,
  PRIMARY KEY (hotel_id, room_type_id, stay_date),
  CHECK (reserved >= 0 AND reserved <= total_rooms)
);

CREATE TABLE reservations (
  id            UUID PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  hotel_id      BIGINT NOT NULL,
  room_type_id  BIGINT NOT NULL,
  check_in      DATE NOT NULL,
  check_out     DATE NOT NULL,
  status        TEXT NOT NULL,         -- PENDING | CONFIRMED | CANCELLED | EXPIRED
  expires_at    TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE NOT NULL
);
```

The `CHECK` constraint is the **last line of defence**: even if application logic has a bug, the database refuses to oversell.

### 3.6 Concurrency and Double Booking

<SeniorDesignCourseDiagram initialTab="doublebooking" />

The race: two users read `reserved = 9, total = 10`, both decide a room is free, both write `10`... and then both succeed with only one room left.

**Recommended pattern: conditional decrement + hold with TTL.**

```sql
BEGIN;
-- one statement per night in the stay, all in the same transaction
UPDATE room_inventory
   SET reserved = reserved + 1
 WHERE hotel_id = :h AND room_type_id = :rt
   AND stay_date >= :check_in AND stay_date < :check_out
   AND reserved < total_rooms;
-- if rows_updated != number_of_nights, ROLLBACK (some night was full)
INSERT INTO reservations (..., status, expires_at)
VALUES (..., 'PENDING', now() + interval '10 minutes');
COMMIT;
```

Why this works: the `WHERE reserved < total_rooms` predicate and the increment are **one atomic row-level operation**. The row lock is held only for the statement and commit, not across the payment call.

> [!WARNING]
> Never hold a `SELECT ... FOR UPDATE` lock while calling the payment provider. A slow PSP turns one hot hotel into a lock convoy and exhausts the connection pool. Use the PENDING hold instead.

**Deadlock avoidance:** always update nights in ascending `stay_date` order so concurrent multi-night bookings acquire locks in the same order.

### 3.7 Reservation Lifecycle

<SeniorDesignCourseDiagram initialTab="lifecycle" />

- A scheduled sweeper (or delayed queue message) moves expired `PENDING` rows to `EXPIRED` and decrements `reserved`.
- Confirmation must be **idempotent**: a payment webhook may arrive twice.
- Use the **transactional outbox** so `reservation.confirmed` is published exactly when the DB commit happens, never lost and never early. See [Outbox Pattern](./outbox-pattern.md).
- Payment failure after a hold is a **saga compensation**: release inventory. See [Saga Pattern](./saga-pattern.md).

### 3.8 Sharding, Caching and Scaling

- **Shard by `hotel_id`.** All inventory and reservations for a hotel live together, so the booking transaction stays single-shard. Cross-hotel queries go to search, not to the OLTP shards.
- Hot hotels (a festival week) can still overload one shard. Mitigate with per-hotel rate limits and a virtual waiting room.
- **Cache** hotel static details (photos, amenities) aggressively. Cache availability only with a short TTL, and **always re-check against the database at hold time**. The cache is advisory, never authoritative.
- Reference: [Sharding & Partitioning](./sharding-partitioning.md), [Caching Strategies](./caching-strategies.md).

### 3.9 Search at Scale (Elasticsearch)

- Index documents per hotel with `geo_point`, amenities, rating, and a denormalised price/availability summary.
- Feed the index from `inventory.changed` events (CDC or outbox). Lag of seconds is acceptable.
- Geo queries use geo-distance or geohash filters. Date availability is an approximate filter (precomputed "available between X and Y" bitmaps or per-night counters).
- The search result is a **hint**. The booking path re-validates, so staleness costs a rare "just sold out" message, not a double booking.
- Reference: [Search Systems](./search-systems.md), [Proximity Search](./proximity-search-geospatial-indexes.md).

### 3.10 Replication and Global Routing

- Reads and search: route to the nearest region's replicas or index.
- Writes (booking): keep **one primary region per hotel** (home region). Cross-region active-active inventory invites split-brain overselling. See [Split-Brain & Multi-Leader](./split-brain-multi-leader-divergence.md).
- Failover: promote a replica, accept a bounded recovery point, and reconcile pending holds on recovery.
- Trade-off: single-home writes cost cross-region latency for far-away users but preserve the no-oversell invariant. Bookings are rare, so this is the right trade.

### 3.11 Hotel Design Tradeoff Matrix

| Decision | Choice | Benefit | Cost |
|---|---|---|---|
| Inventory granularity | Per night rows | DB-enforced invariant | More rows, multi-row transaction |
| Concurrency | Conditional decrement + TTL hold | No long locks | Expiry job, temporary unavailability |
| Search consistency | Eventual | Fast, scalable | Rare stale result |
| Booking consistency | Strong, single home region | No oversell | Cross-region latency |
| Payment | Idempotency key + saga | Safe retries | More states to test |

---

## 4. The Other Two Systems in the Course

| Course system | Key topics | Page here |
|---|---|---|
| Music streaming (Spotify-like) | Capacity, CDN, metadata vs audio storage, API, scaling to millions | [Spotify](./problem-breakdowns/spotify.md) |
| Messaging app (WhatsApp-like) | WebSockets, message state (sent/delivered/read), offline delivery, fanout, E2E encryption, rate limiting, sharding, cleanup jobs | [WhatsApp](./problem-breakdowns/whatsapp.md) |

### Cross-cutting lessons from the messaging section

- **Delivery semantics:** at-least-once delivery plus client-side dedupe by message ID gives effectively-once.
- **Multi-device and offline:** store messages per recipient inbox with a monotonic sequence, and sync from the last acknowledged sequence.
- **Group fanout:** fan out on write for small groups, fan out on read for very large ones.
- **Operations:** feature flags for safe rollouts ([Feature Toggle](./feature-toggle.md)), graceful degradation, and cleanup jobs for retention.

## 5. How to Actually Get Better

1. Practise the framework out loud on a timer (35 to 45 minutes).
2. After each design, write the failure modes you skipped.
3. Read real postmortems ([Outage Case Studies](./case-studies-outages-reliability.md)).
4. Build one small piece (an idempotent endpoint, a rate limiter) for real.

## Related Guides

- [Interview Framework (RADIO)](./interview-framework.md)
- [Capacity Planning](./capacity-planning.md)
- [Inventory Reservation System](./inventory-reservation-system.md)
- [Handling Contention](./handling-contention.md)
- [Full System Design Course](./full-system-design-course.md)
