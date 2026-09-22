---
id: gopuff
title: Design a Local Quick-Commerce Delivery Service Like Gopuff
sidebar_label: 3. Local Delivery Service (Gopuff)
description: Staff-level system design breakdown for an ultra-fast local delivery platform with dark store inventory reservation and dynamic order batching.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Local Quick-Commerce Delivery Service Like Gopuff

A quick-commerce delivery platform (e.g., Gopuff, Instacart Express, DoorDash DashMart, Getir) delivers groceries, convenience goods, and essentials to customers in under 15–20 minutes. Unlike standard marketplace aggregators, quick-commerce platforms operate their own vertically integrated micro-fulfillment centers (**dark stores**), requiring tight coupling between physical warehouse inventory, sub-second picking workflows, and dynamic driver routing.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Browse Catalog & Dark Store Assignment**: Map the customer's delivery GPS coordinate to the nearest servicing dark store and display real-time in-stock inventory.
2. **Atomic Inventory Reservation**: When a user adds an item to cart or begins checkout, hold inventory for 10 minutes to prevent overselling.
3. **Order Placement & Payment**: Process payment, commit inventory deduction, and route the order to warehouse pickers.
4. **Dark Store Picking & Packing**: Warehouse workers pick and pack items in `< 3 minutes`.
5. **Dynamic Batching & Dispatch**: Group 1 to 3 nearby orders for a single courier based on destination clustering and vehicle capacity.
6. **Real-Time Order & Driver Tracking**: Live GPS tracking of the courier on a map from dispatch to doorstep.

### Non-Functional Requirements
- **Strict Inventory Consistency**: Zero double-selling or negative inventory balances during viral flash demands.
- **Low Latency Catalog Search**: Catalog browsing and search results under `< 50ms`.
- **High Availability**: `99.99%` uptime for the ordering platform; catalog browsing must stay available even if dispatch optimization algorithms experience lag.
- **Real-Time GPS Tracking**: Driver location latency `< 2s` end-to-end.

### Capacity Estimations & Sizing (Global Scale)
- **Dark Stores**: 1,000 active micro-fulfillment centers worldwide.
- **SKUs per Dark Store**: ~4,000 active convenience SKUs per store.
- **Daily Orders**: 1 Million total orders/day $\implies$ ~12 orders/sec average (peaking at **100 orders/sec** during evening rush hours).
- **Cart Add / Reservation QPS**: 10x order volume $\implies$ **1,000 reservation QPS peak**.
- **Driver GPS Pings**:
  - 50,000 active couriers pinging location every 4 seconds.
  - Ingress QPS = $50,000 / 4 =$ **12,500 GPS updates/sec**.
  - Daily location telemetry storage = $12,500 \times 86,400 \times 100\text{ bytes} \approx$ **108 GB/day**.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                       DARK_STORE                       │
├──────────────────┬──────────────┬──────────────────────┤
│ store_id         │ UUID         │ PRIMARY KEY          │
│ name             │ VARCHAR(100) │ NOT NULL             │
│ location         │ GEOMETRY     │ Point (Lat, Lng)     │
│ service_polygon  │ GEOMETRY     │ Polygon / H3 Cells   │
│ is_active        │ BOOLEAN      │ DEFAULT TRUE         │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   STORE_INVENTORY                      │
├──────────────────┬──────────────┬──────────────────────┤
│ store_id         │ UUID         │ COMPOSITE PK, FK     │
│ product_id       │ UUID         │ COMPOSITE PK, FK     │
│ available_stock  │ INT          │ Physical unreserved  │
│ reserved_stock   │ INT          │ Held in checkout     │
│ version          │ BIGINT       │ Optimistic lock      │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     DELIVERY_ORDER                     │
├──────────────────┬──────────────┬──────────────────────┤
│ order_id         │ UUID         │ PRIMARY KEY          │
│ customer_id      │ UUID         │ INDEX, FK            │
│ store_id         │ UUID         │ INDEX, FK            │
│ courier_id       │ UUID         │ NULLABLE, INDEX, FK  │
│ status           │ VARCHAR(32)  │ PLACED / PACKED / ...│
│ delivery_address │ JSONB        │ Coordinates, Apt, ...│
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      ORDER_ITEM                        │
├──────────────────┬──────────────┬──────────────────────┤
│ order_item_id    │ UUID         │ PRIMARY KEY          │
│ order_id         │ UUID         │ INDEX, FK            │
│ product_id       │ UUID         │ FK                   │
│ quantity         │ INT          │ NOT NULL             │
│ unit_price_cents │ INT          │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Hold Inventory for Checkout (Atomic Reservation)
```http
POST /api/v1/stores/{store_id}/inventory/reserve
Content-Type: application/json
Idempotency-Key: c912-4019-b223

{
  "cart_id": "cart_88192",
  "items": [
    {"product_id": "prod_ice_cream", "quantity": 2},
    {"product_id": "prod_energy_drink", "quantity": 1}
  ],
  "ttl_seconds": 600
}
```
**Response (`200 OK`)**:
```json
{
  "reservation_id": "res_55102",
  "expires_at": "2026-09-22T23:10:00Z",
  "status": "HELD"
}
```

#### 2. Confirm Order & Commit Inventory
```http
POST /api/v1/orders/checkout
Content-Type: application/json

{
  "reservation_id": "res_55102",
  "payment_method_id": "pm_visa_9912",
  "delivery_tip_cents": 500
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="inventory-reservation" title="Gopuff Inventory Reservation & Dark Store Dispatch Engine" />

### Core Order Lifecycle Flow
1. **Dark Store Resolution**: Customer app pings `GET /stores/nearby?lat=...&lng=...`. The Geospatial Service queries an in-memory **Uber H3 spatial index** to find which dark store polygon encompasses the delivery address.
2. **Catalog Browsing**: Catalog items and current available quantities are loaded from a **Redis Store Inventory Cache**.
3. **Atomic Cart Hold**: When the user taps "Proceed to Checkout", an atomic **Redis Lua Script** validates that `stock >= quantity` and decrements available inventory while incrementing a reservation key with a 10-minute TTL.
4. **Payment & Commit**: Payment processes via Stripe. The Order Service writes the order to PostgreSQL using an Outbox pattern and sends a message to Kafka.
5. **Dark Store Tablet Dispatch**: The warehouse picking tablet receives the order via WebSockets. The picker scans items; once verified, the order status transitions to `PACKED`.
6. **Batching & Dispatch Engine**: A background optimizer clusters packed orders going to adjacent delivery zones and assigns the batch to a waiting courier.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Preventing Double-Selling via Redis Lua CAS Reservation
Why can't we just run `SELECT stock FROM store_inventory WHERE product_id = ...` in PostgreSQL?
- **Pessimistic Locking Hazard**: Running `SELECT stock ... FOR UPDATE` under high concurrency locks database rows, causing connection pool exhaustion and 500ms+ p99 checkout latency.
- **Optimistic Locking Drawback**: High contention during viral deals causes massive transaction rollback spikes.
- **Production Solution (Redis In-Memory Lua Script)**:
  Redis executes single-threaded Lua scripts atomically, guaranteeing zero race conditions at sub-millisecond speeds:

```lua
-- Keys: 1) store:item:available, 2) store:item:reserved
-- ARGV: 1) requested_quantity, 2) reservation_key, 3) ttl_seconds
local available = tonumber(redis.call('GET', KEYS[1]) or '0')
local qty = tonumber(ARGV[1])

if available >= qty then
    redis.call('DECRBY', KEYS[1], qty)
    redis.call('INCRBY', KEYS[2], qty)
    -- Record reservation hold with TTL
    redis.call('SETEX', ARGV[2], tonumber(ARGV[3]), qty)
    return 1 -- SUCCESS
else
    return 0 -- INSUFFICIENT_STOCK
end
```

### Deep Dive 2: Automatic Rollback on Checkout Abandonment
What happens if the customer reserves the last 2 ice cream pints but closes their browser?
- If the reservation is not checked out within 600 seconds, the key in Redis expires.
- We utilize **Redis Keyspace Notifications** (`__keyevent@0__:expired`) or an external **Hierarchical Timing Wheel / Delayed Queue**:
  - When the expiration triggers, a worker runs a Lua rollback script:
    `available = available + qty` and `reserved = reserved - qty`.
  - Stock is immediately restored to the live dark store catalog without human intervention.

### Deep Dive 3: Real-Time Dark Store Inventory Drift & Physical Reconciliation
In physical retail warehouses, items get dropped, damaged, or misplaced. What happens when the physical count differs from the database count?
- **In-Store Picker Substitution / Void Workflow**:
  - If a picker cannot find an item on the shelf, they press "Out of Stock" on their scanner.
  - The Picking Engine immediately sets the item's digital available count to `0` in Redis and PostgreSQL to stop further orders.
  - The system automatically triggers a customer push notification offering a one-tap substitute or an instant refund on the missing item.
- **Daily Cycle Counts**: Workers perform continuous rotating inventory audits on high-velocity items to recalibrate the Redis and PostgreSQL caches against physical stock.

### Deep Dive 4: Dynamic Order Batching & Travelling Salesperson Optimization
Should every order be dispatched with its own courier?
- **Single Dispatch vs Multi-Order Batching**:
  - 1 driver per order $\implies$ astronomical driver cost and delivery delays.
  - Batching 2-3 orders per trip increases courier earnings while cutting operational cost by ~40%.
- **Clustering Algorithm (Vehicle Routing Problem with Time Windows - VRPTW)**:
  1. Orders in the same dark store are grouped into a spatial k-d tree or Uber H3 cells (Resolution 9 $\approx$ 100m).
  2. Every 60 seconds, the Dispatch Engine evaluates clusters using a modified Clarke-Wright Savings heuristic.
  3. **Hard Constraint**: Maximum travel time for any single customer in the batch must never exceed 15 minutes from pack time.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Inventory Store** | PostgreSQL Transactions | Redis Lua + Async DB Write | **Redis Lua + Outbox DB**: Sub-millisecond latency for thousands of concurrent cart adds. Relational DB handles durable billing ledger. |
| **Dispatch Model** | First-Come-First-Served (FCFS) | Dynamic Window Batching (60s) | **Dynamic Batching**: FCFS leads to driver starvation and massive unit economics losses. 60-second batching windows unlock 2-3x delivery density. |
| **Driver Location Sync** | Polling every 5s | WebSocket Stream + Kalman Filter | **WebSocket**: Reduces cellular battery drain on driver devices; delivers sub-second map marker animation to hungry customers. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the core entities (Dark Store, Product, Store Inventory, Order).
- Designs basic inventory reservation to prevent overselling.
- Understands geospatial matching to find the closest dark store.
- Sets up basic order state machine transitions.

### Senior (L5 / IC5)
- Implements atomic in-memory reservation via Redis Lua scripts with automatic TTL release.
- Distinguishes between dark store inventory (centralized micro-warehouses) vs marketplace models (Instacart retail scraping).
- Solves inventory drift and picker substitution flows gracefully.
- Explains dynamic order batching (VRPTW) and route optimization constraints.

### Staff+ (L6 / Principal)
- Designs an active-active multi-region inventory architecture with localized dark store partitioning (each dark store is an autonomous failure domain).
- Handles edge-case race conditions between picker out-of-stock reports and simultaneous customer checkouts.
- Integrates machine learning predictive pre-picking for top-selling SKUs based on real-time checkout intent signals.
- Establishes offline-first dark store picking operations: if warehouse Wi-Fi drops, local pickers continue scanning via local gateway servers and sync on reconnect.
