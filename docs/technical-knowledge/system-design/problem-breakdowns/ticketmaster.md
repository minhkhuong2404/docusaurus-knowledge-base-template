---
id: ticketmaster
title: Design a High-Concurrency Ticket Booking Platform Like Ticketmaster
sidebar_label: 4. Ticketmaster (Ticket Booking)
description: Staff-level system design breakdown for a high-concurrency event ticketing platform handling viral surges without double booking.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a High-Concurrency Ticket Booking Platform Like Ticketmaster

An event ticketing platform (e.g., Ticketmaster, Live Nation, StubHub) manages high-demand ticket sales for concerts, sporting events, and theater performances. The critical architectural challenge is surviving catastrophic traffic spikes (e.g., millions of fans competing for 50,000 stadium seats at 10:00 AM) while guaranteeing **zero double booking** and low-latency interactive seat selection.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Browse & Search Events**: Users can search for events by artist, venue, city, and date.
2. **Interactive Seat Map**: View real-time seating charts with live seat availability status (Available, Reserved, Booked).
3. **Temporary Seat Hold**: Users select seats and hold them for **10 minutes** to complete checkout.
4. **Checkout & Payment**: Process payment, generate cryptographically signed digital tickets (QR/Barcodes), and mark seats as permanently booked.
5. **Virtual Waiting Room**: During massive viral sales, queue surplus users fairly to prevent backend overload.

### Non-Functional Requirements
- **Strict Consistency (Zero Double Booking)**: A seat must never be sold to more than one person under any circumstances.
- **Extreme Peak Surge Tolerance**: System must survive traffic surges up to 100x–500x normal baseline load.
- **Seat Hold Expiration Reliability**: Expired holds must immediately return to the available inventory pool.
- **High Availability for Browsing**: Event browsing and general info must remain accessible even if ticket purchase queues are throttled.

### Capacity Estimations & Peak Surge Sizing
- **Total Registered Users**: 50 Million users.
- **Major Stadium Concert**: 50,000 seats.
- **Viral Surge Demand**: 5 Million fans hitting the sale at 10:00:00 AM.
- **Traffic Spike**: 5,000,000 users / 10 seconds $\approx$ **500,000 QPS** at peak.
- **Database Sizing (5 Years)**:
  - 100,000 events/year $\times$ 5 years = 500,000 events.
  - Average seats per event: 10,000 seats $\implies$ 5 Billion total seat records.
  - 5 Billion $\times$ 200 bytes $\approx$ **1 TB storage** (easily manageable in partitioned relational storage).
- **Core Problem**: This is not a big data volume problem; it is an **extreme write-contention and concurrency problem**.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                         EVENT                          │
├──────────────────┬──────────────┬──────────────────────┤
│ event_id         │ UUID         │ PRIMARY KEY          │
│ venue_id         │ UUID         │ INDEX, FK            │
│ title            │ VARCHAR(255) │ NOT NULL             │
│ start_time       │ TIMESTAMP    │ NOT NULL             │
│ sale_start_time  │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                          SEAT                          │
├──────────────────┬──────────────┬──────────────────────┤
│ seat_id          │ UUID         │ PRIMARY KEY          │
│ event_id         │ UUID         │ COMPOSITE INDEX, FK  │
│ section          │ VARCHAR(32)  │ e.g. "Section 102"   │
│ row_number       │ VARCHAR(16)  │ e.g. "Row A"         │
│ seat_number      │ INT          │ e.g. 14              │
│ price_cents      │ INT          │ NOT NULL             │
│ status           │ VARCHAR(16)  │ AVAILABLE / HELD / ..│
│ held_until       │ TIMESTAMP    │ NULLABLE             │
│ user_id          │ UUID         │ NULLABLE (Holder)    │
│ version          │ BIGINT       │ Optimistic Version   │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                        BOOKING                         │
├──────────────────┬──────────────┬──────────────────────┤
│ booking_id       │ UUID         │ PRIMARY KEY          │
│ event_id         │ UUID         │ INDEX, FK            │
│ user_id          │ UUID         │ INDEX, FK            │
│ total_amount     │ INT          │ In cents             │
│ status           │ VARCHAR(32)  │ PENDING / PAID / ... │
│ idempotency_key  │ VARCHAR(64)  │ UNIQUE               │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Hold Seats (Temporary 10-Minute Lock)
```http
POST /api/v1/events/{event_id}/seats/hold
Content-Type: application/json
Authorization: Bearer <queue_jwt_token>
Idempotency-Key: hold_9a8f2-1082

{
  "seat_ids": [
    "seat_sec102_rowA_14",
    "seat_sec102_rowA_15"
  ],
  "hold_duration_seconds": 600
}
```
**Response (`200 OK`)**:
```json
{
  "reservation_id": "res_8819203",
  "held_until": "2026-09-22T23:10:00Z",
  "seats": [
    {"seat_id": "seat_sec102_rowA_14", "price_cents": 12000},
    {"seat_id": "seat_sec102_rowA_15", "price_cents": 12000}
  ],
  "total_price_cents": 24000
}
```

#### 2. Confirm Booking & Purchase
```http
POST /api/v1/bookings/checkout
Content-Type: application/json

{
  "reservation_id": "res_8819203",
  "payment_method_id": "pm_card_visa_4421"
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="inventory-reservation" title="Ticketmaster High-Concurrency Seat Booking Pipeline" />

### Walkthrough of the Traffic Influx Architecture

#### 1. Traffic Absorption & Virtual Waiting Room
1. 30 minutes before 10:00 AM, users entering the event page are routed to an edge **Virtual Waiting Room** (powered by Cloudflare Workers or a dedicated Go queuing cluster).
2. Users are assigned a signed cryptographic **Queue Token (JWT)** containing their randomized arrival position.
3. The Waiting Room throttles the downstream admission rate to precisely match the backend capacity (e.g. 500 checkout sessions admitted per second).
4. When a user reaches the front of the queue, their JWT token is upgraded with an `admit: true` claim, granting access to the seat selection service.

#### 2. Real-Time Seat Selection & Reservation
1. The user views the stadium seat map. The frontend polls or streams seat state via **WebSockets** backed by a **Redis Bitmap / Set** representing seat availability for that event.
2. User selects Seat 14 and 15 and clicks "Reserve".
3. An atomic **Redis Lua Script** executes:
   - Validates that both seats are currently `AVAILABLE`.
   - Atomically transitions them to `HELD` and stores a reservation record with a 600-second TTL.
4. Returns confirmation to the user; countdown timer starts in the browser.

#### 3. Checkout, Payment & Ticket Generation
1. User enters payment info. The **Order Service** calls the Payment Gateway (Stripe/Adyen) with an `Idempotency-Key`.
2. Upon payment success, a relational database transaction commits the booking:
   - Updates `SEAT` status to `BOOKED` in PostgreSQL.
   - Inserts `BOOKING` record and creates digital ticket barcodes.
   - Emits an event to Kafka for PDF email generation.
3. The Redis seat status is transitioned from `HELD` to `BOOKED`.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Concurrency Control (Pessimistic vs Optimistic vs Redis Lua)
How do we prevent double-booking when 50,000 users click the same row of seats simultaneously?

| Approach | Implementation | Under-the-Hood Behavior | Bottleneck / Production Gotcha |
|---|---|---|---|
| **Pessimistic Locking** | `SELECT ... FOR UPDATE` | Locks database row in InnoDB buffer pool. Subsequent transactions queue up. | Catastrophic database lock wait timeouts (`Lock wait timeout exceeded`). Connection pool exhausted in seconds. |
| **Optimistic Locking** | `UPDATE seat SET status='HELD', version=v+1 WHERE seat_id=? AND version=v` | Relies on row version check. First writer wins; remaining writers get `0 rows updated`. | Prevents corruption, but high contention causes 99.9% of threads to fail and retry, thrashing database CPU. |
| **Redis Distributed Lock (Redlock)** | Acquire lock per seat via `SET seat:id lock_token NX PX 600000` | In-memory key reservation. Fast, but multi-seat transactions require acquiring multiple distributed locks. | Partial lock deadlocks (User A locks Seat 14 and wants 15; User B locks Seat 15 and wants 14). |
| **Atomic Redis Lua Script (Recommended)** | Execute multi-seat verification and reservation in a single Lua execution | Single-threaded Redis thread runs all seat updates atomically without network pauses. | **Zero race conditions, sub-millisecond execution**. Survives 200K+ QPS per Redis shard. |

#### Production Redis Lua Script for Atomic Multi-Seat Reservation:
```lua
-- KEYS: List of seat keys (e.g. event:101:seat:14, event:101:seat:15)
-- ARGV: [1] user_id, [2] reservation_id, [3] ttl_seconds (600)

-- Step 1: Verify ALL requested seats are available
for i, key in ipairs(KEYS) do
    local status = redis.call('HGET', key, 'status')
    if status ~= false and status ~= 'AVAILABLE' then
        return {0, key} -- Fail: At least one seat is unavailable
    end
end

-- Step 2: Atomically reserve ALL requested seats
for i, key in ipairs(KEYS) do
    redis.call('HSET', key, 'status', 'HELD', 'user_id', ARGV[1], 'res_id', ARGV[2])
    redis.call('EXPIRE', key, tonumber(ARGV[3]))
end

return {1, 'SUCCESS'}
```

### Deep Dive 2: Handling Seat Hold Expiration Reliably
What happens when a fan reserves seats but closes their laptop without paying?
- **Problem**: If expired seats are not returned immediately, venue capacity is artificially suppressed, leaving empty seats at showtime.
- **Solution Architecture**:
  1. **Passive Expiration (Lazy Check)**: Whenever a user inspects a seat, if `status == 'HELD'` and `held_until < NOW()`, immediately treat it as `AVAILABLE`.
  2. **Active Expiration (Redis Keyspace Notifications + Delayed Queue)**:
     - Upon reservation, push a delayed message `{"res_id": "res_8819203", "event_id": 101}` into a **Redis Sorted Set (ZSET)** where `score = expiration_timestamp`.
     - A background sweeper worker continuously polls `ZRANGEBYSCORE delay_queue 0 <current_timestamp>`.
     - If the reservation has not been completed, the sweeper resets the seats in Redis and PostgreSQL back to `AVAILABLE`.

### Deep Dive 3: Sharding & Database Partitioning Strategy
How do we shard the database when one event has extreme traffic while others have minimal activity?
- **Partition Key**: Partitioning strictly by `event_id` creates a **massive hot partition / hotspot** when tickets for a superstar concert go on sale, overwhelming the single shard hosting that `event_id`.
- **Composite Sharding Key**: `(event_id, section_id)`
  - A stadium is composed of 50+ independent sections (Section 101, Section 102, Floor, Balcony).
  - Sharding by `(event_id, section_id)` distributes the 50,000 seats across multiple database shards and Redis nodes.
  - Fans browsing Floor tickets hit Shard A, while fans browsing Balcony tickets hit Shard B.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Spike Ingress Management** | Direct API Gateway Influx | Edge Virtual Waiting Room (Queue-It) | **Virtual Waiting Room**: Dropping 5 Million concurrent requests directly onto backend services causes immediate cascading failure. The waiting room smooths ingress to match DB capacity. |
| **Seat Hold Storage** | In-Memory Redis Lua | Relational Database Row Locks | **Redis Lua**: Relational row locks under 100K QPS freeze connection pools. Redis handles atomic checks in sub-millisecond memory. |
| **Consistency vs Availability** | High Availability (AP) | Strict Consistency (CP) | **Strict Consistency (CP)**: Double booking leads to severe brand damage, legal liability, and customer outrage. Rejecting a reservation is always preferred over selling the same seat twice. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the need for temporary seat holding with a countdown timer.
- Designs the data schema linking Events, Venues, Seats, and Bookings.
- Understands the difference between optimistic and pessimistic locking.
- Proposes basic database updates to mark seats as reserved.

### Senior (L5 / IC5)
- Implements atomic multi-seat reservation using Redis Lua scripts to eliminate deadlocks.
- Designs the Virtual Waiting Room architecture with cryptographic JWT tokens to absorb 500x traffic surges.
- Handles automated expiration and rollback using delayed message queues or Redis sorted sets.
- Explains composite sharding on `(event_id, section_id)` to prevent hot partition meltdown.

### Staff+ (L6 / Principal)
- Designs an end-to-end anti-bot and scalper mitigation defense (Cloudflare Turnstile, browser fingerprinting, behavioral analysis).
- Details 2-phase payment reconciliation: Handling situations where payment succeeds at Stripe but the client connection drops before seat confirmation.
- Evaluates multi-region failover trade-offs: Explains why cross-region active-active seat reservation is prone to split-brain double bookings and justifies active-passive single-leader per event.
