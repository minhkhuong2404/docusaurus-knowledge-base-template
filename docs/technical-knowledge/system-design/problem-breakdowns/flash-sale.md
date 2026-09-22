---
id: flash-sale
title: Design a High-Concurrency Flash Sale System
sidebar_label: 32. Flash Sale System
description: Staff-level system design breakdown for an extreme-concurrency flash sale and limited-drop e-commerce platform with token gating and atomic inventory deduction.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a High-Concurrency Flash Sale System

A flash sale system (e.g., Nike SNKRS sneaker drops, Xiaomi flash sales, Amazon Prime Day lightning deals) sells a strictly limited quantity of high-demand items (e.g., 10,000 items) at steep discounts. At the exact second the sale begins (e.g., 12:00:00 PM), millions of users and automated botnets hit the system simultaneously, creating an extreme write-contention spike that would instantly incinerate standard relational e-commerce databases.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Flash Sale Landing Page**: Display real-time countdown, item details, and sale status (Upcoming, Live, Sold Out).
2. **Atomic Inventory Reservation**: Deduct inventory with zero overselling (selling 10,001 items when stock is 10,000 is an unacceptable failure).
3. **Bot & Scalper Defense**: Filter out automated bot scripts, multi-account ballot stuffing, and click-spamming tools.
4. **Asynchronous Order Creation**: Once inventory is reserved, allow the user 10 minutes to complete payment and shipping details.
5. **Inventory Rollback**: If a user reserves an item but fails to pay within 10 minutes, the stock is automatically returned to the sale pool.

### Non-Functional Requirements
- **Extreme Peak Surge Tolerance**: System must survive traffic spikes of **100x to 500x normal baseline load** in a single second.
- **Strict Consistency (Zero Overselling)**: Inventory deduction must be strictly atomic and deterministic.
- **Sub-Second Reservation Latency**: Users receive immediate confirmation (*"You've secured an item! Complete payment in 10:00"*) or (*"Sold Out"*) in `< 500ms`.
- **System Isolation**: A flash sale event must never degrade or crash the general marketplace, login services, or unrelated product catalog browsing.

### Capacity Estimations & Sizing
- **Total Registered Shoppers**: 10 Million users waiting for the sale.
- **Total Stock**: 10,000 units.
- **Traffic Spike at 12:00:00 PM**:
  - 1 Million concurrent shoppers clicking "Buy Now" within the first 3 seconds:
    $\text{Peak Ingress} \approx \mathbf{300,000\text{ to 500,000 requests/sec}}$!
- **Database Reality**:
  - A standard PostgreSQL or MySQL database server handles ~5,000 to 10,000 queries/sec.
  - Sending 500,000 concurrent transactions trying to update the exact same inventory row (`UPDATE products SET stock = stock - 1 WHERE id = ?`) causes immediate row-lock exhaustion, connection pool starvation, and total server collapse within 500 milliseconds.
  - *Architectural Mandate*: **Multi-tier traffic shedding, edge token gating, and in-memory Redis atomic Lua execution** are non-negotiable.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                    FLASH_SALE_ITEM                     │
├──────────────────┬──────────────┬──────────────────────┤
│ sale_id          │ UUID         │ PRIMARY KEY          │
│ product_id       │ UUID         │ INDEX, FK            │
│ total_stock      │ INT          │ e.g. 10,000          │
│ available_stock  │ INT          │ Physical available   │
│ flash_price_cents│ INT          │ Discounted Price     │
│ start_time       │ TIMESTAMP    │ e.g. 12:00:00 PM     │
│ end_time         │ TIMESTAMP    │ e.g. 12:30:00 PM     │
│ status           │ VARCHAR(16)  │ UPCOMING/ACTIVE/ENDED│
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                    SALE_RESERVATION                    │
├──────────────────┬──────────────┬──────────────────────┤
│ reservation_id   │ UUID         │ PRIMARY KEY          │
│ sale_id          │ UUID         │ COMPOSITE INDEX, FK  │
│ user_id          │ UUID         │ COMPOSITE UNIQUE, FK │
│ status           │ VARCHAR(16)  │ HELD / PAID / EXPIRED│
│ expires_at       │ TIMESTAMP    │ 10-Minute Hold TTL   │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      FLASH_ORDER                       │
├──────────────────┬──────────────┬──────────────────────┤
│ order_id         │ UUID         │ PRIMARY KEY          │
│ reservation_id   │ UUID         │ UNIQUE, FK           │
│ user_id          │ UUID         │ INDEX, FK            │
│ total_cents      │ INT          │ Final Billed Amount  │
│ status           │ VARCHAR(16)  │ PENDING / PAID       │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Attempt Flash Sale Purchase (Request Token)
```http
POST /api/v1/flash-sales/{sale_id}/reserve
Content-Type: application/json
Authorization: Bearer <jwt_token>
Idempotency-Key: fls_99a812-4019-b201

{
  "user_id": "usr_88192a01",
  "captcha_token": "cf_turnstile_response_token..."
}
```
**Response (`200 OK` - Success)**:
```json
{
  "status": "RESERVED",
  "reservation_id": "res_441029",
  "checkout_url": "/checkout?reservation_id=res_441029",
  "expires_at": "2026-09-22T23:10:00Z"
}
```
**Response (`200 OK` - Sold Out)**:
```json
{
  "status": "SOLD_OUT",
  "message": "All items have been claimed."
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="inventory-reservation" title="Flash Sale Multi-Tier Traffic Shedding & Atomic Lua Engine" />

### Multi-Tier Traffic Absorption Architecture

```
500,000 QPS (100% Raw Traffic)
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ TIER 1: CDN Edge Caching (Cloudflare / Fastly)         │
│ - Static assets and product images 100% cached.        │
│ - Edge Turnstile CAPTCHA filters 70% of bots.          │
└────────────────────────────────────────────────────────┘
       │ 150,000 QPS Remaining
       ▼
┌────────────────────────────────────────────────────────┐
│ TIER 2: API Gateway Token Gating & Rate Limiting       │
│ - 1 request per user account limit.                    │
│ - Token bucket sheds traffic exceeding 2x total stock. │
└────────────────────────────────────────────────────────┘
       │ 20,000 QPS Remaining
       ▼
┌────────────────────────────────────────────────────────┐
│ TIER 3: In-Memory Redis Atomic Lua Reservation         │
│ - Atomic stock decrement via single-threaded script.   │
│ - Emits 10,000 successful reservations to Kafka.       │
│ - Remaining requests get instant "Sold Out".           │
└────────────────────────────────────────────────────────┘
       │ Exactly 10,000 Successful Orders!
       ▼
┌────────────────────────────────────────────────────────┐
│ TIER 4: Asynchronous Database & Order Worker Pool      │
│ - Smoothly writes 10,000 orders to PostgreSQL at 50/s. │
│ - ZERO database CPU spikes or lock contention!         │
└────────────────────────────────────────────────────────┘
```

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Atomic Inventory Deduction (Redis Lua Script)
How do we guarantee that exactly 10,000 units are sold with zero race conditions at 50,000 QPS?

- **Why Redis Lua**: Redis executes Lua scripts as a single atomic unit. No other command can read or write to the keys while the script executes.
- **One User, One Item Constraint**: The script checks a Redis Set (`sale:{id}:users`) to ensure a user cannot claim two items.

```lua
-- KEYS[1]: sale:inventory (Number of items remaining)
-- KEYS[2]: sale:users (Set of user IDs who already reserved)
-- ARGV[1]: user_id
-- ARGV[2]: reservation_id
-- ARGV[3]: hold_ttl_seconds (600)

-- Step 1: Check if user already reserved an item
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then
    return {0, "ALREADY_RESERVED"}
end

-- Step 2: Check available inventory
local stock = tonumber(redis.call('GET', KEYS[1]) or '0')
if stock <= 0 then
    return {0, "SOLD_OUT"}
end

-- Step 3: Atomically decrement stock and record user
redis.call('DECR', KEYS[1])
redis.call('SADD', KEYS[2], ARGV[1])

-- Step 4: Record temporary reservation hold
local res_key = "reservation:" .. ARGV[2]
redis.call('HSET', res_key, 'user_id', ARGV[1], 'status', 'HELD')
redis.call('EXPIRE', res_key, tonumber(ARGV[3]))

return {1, "SUCCESS"}
```
- **Execution Speed**: This Lua script executes in **0.05 milliseconds**! A single Redis primary node can process over 50,000 reservations per second with zero race conditions.

### Deep Dive 2: Token Gating (The "Sold Out" Short-Circuit)
What happens to the 990,000 users who clicked "Buy Now" but didn't get one of the 10,000 items?
- **The Problem**: If 990,000 users keep hitting Redis, network interfaces and CPU will be exhausted on pointless queries.
- **The Global Sold-Out Flag**:
  1. As soon as the Redis inventory reaches `0`, the Lua script sets an in-memory key: `sale:{id}:is_sold_out = true`.
  2. The API Gateways cache this flag locally in their process RAM (using a 1-second TTL).
  3. Once the gateway sees `is_sold_out == true`, it **immediately short-circuits all subsequent requests** at the API Gateway layer, returning `{"status": "SOLD_OUT"}` without ever contacting Redis or the database!

### Deep Dive 3: Automatic Rollback on Checkout Abandonment
What if 500 users claim an item in Redis but their credit card fails or they abandon their cart?
- **The Rollback Pipeline**:
  1. When a reservation is created, an event `{reservation_id, user_id, sale_id}` is placed into a **Delayed Queue (Redis Sorted Set)** where `score = expiration_timestamp (now + 600s)`.
  2. If the user completes payment within 10 minutes, the order service marks the reservation as `PAID` in PostgreSQL and deletes it from the delayed queue.
  3. A background **Rollback Worker** polls the delayed queue:
     - For any reservations reaching their 10-minute expiration without being paid:
     - Executes an atomic rollback script in Redis:
       `INCR sale:inventory` and `SREM sale:users user_id`.
     - Stock is immediately restored to the active sale pool, allowing other waiting users to purchase!

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Inventory Store** | PostgreSQL `SELECT FOR UPDATE` | In-Memory Redis Lua Atomic CAS | **Redis Lua**: Relational row locks under 500K QPS freeze connection pools in 500ms. Redis handles atomic checks in sub-millisecond memory. |
| **Order Creation** | Synchronous DB insert during click | Asynchronous Kafka Queue to Worker Pool | **Asynchronous Queue**: Buffers the 10,000 orders and writes them to PostgreSQL at a steady, sustainable 50 orders/sec, completely protecting the database. |
| **Page Rendering** | Dynamic Server-Side Render (SSR) | Static CDN HTML + Dynamic Token API | **Static CDN**: CDN absorbs 99% of page traffic and image assets; origin servers only handle the tiny lightweight `/reserve` JSON endpoint. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the critical bottleneck of database row-level locking during flash sales.
- Proposes caching stock in Redis.
- Understands the need to prevent double buying (one item per user).
- Designs basic asynchronous order creation using message queues.

### Senior (L5 / IC5)
- Details the multi-tier traffic shedding architecture (CDN $\to$ API Gateway Token Bucket $\to$ Redis Lua $\to$ Async DB).
- Implements atomic stock verification and user deduplication using a single-threaded Redis Lua script.
- Solves checkout abandonment using delayed queues and automatic stock rollbacks.
- Designs the "Sold Out" short-circuit flag at the API gateway layer to protect Redis from redundant queries.

### Staff+ (L6 / Principal)
- Designs advanced bot mitigation and fairness algorithms: Device fingerprinting, Proof-of-Work (PoW) client hashing challenges, and lottery-based ballot drops (Nike SNKRS draw model).
- Architects multi-region inventory sharding: Handling global flash sales across US, Europe, and Asia without cross-region WAN replication race conditions (regional stock allocation quotas).
- Details failure mode resilience: Handling Redis master node failure midway through a sale with zero inventory over-allocation or phantom reservations.
