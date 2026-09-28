---
id: uber
title: Design a Real-Time Ride-Hailing & Dynamic Dispatch Service Like Uber
sidebar_label: 13. Uber (Ride-Hailing & Dispatch)
description: Staff-level system design breakdown for a real-time ride-hailing and dynamic dispatch platform using Uber H3 geospatial indexing.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Real-Time Ride-Hailing & Dynamic Dispatch Service Like Uber

A ride-hailing platform (e.g., Uber, Lyft, Grab) connects passengers needing transportation with nearby independent drivers in real-time. The platform requires high-frequency driver telemetry ingestion, spatial index searching using hexagonal grid indexing (Uber H3), dynamic pricing (surge), and a transactional trip state machine with atomic dispatch locking.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Driver Location Streaming**: Active drivers stream real-time GPS locations every 4 seconds.
2. **Rider Request & Fare Estimation**: Riders view nearby available cars, enter drop-off destination, and receive upfront fare and ETA estimates.
3. **Dispatch & Matching**: Match a rider request with the optimal nearby driver within 15 seconds.
4. **Trip Lifecycle State Machine**: Manage trip transitions (`REQUESTED` $\to$ `DISPATCHED` $\to$ `ARRIVED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED`).
5. **Dynamic Surge Pricing**: Calculate regional surge multipliers based on real-time supply and demand imbalances.

### Non-Functional Requirements
- **High Concurrency & Real-Time Telemetry**: Ingest millions of location pings per second with `< 2s` end-to-end location freshness.
- **Strict Transactional Matching**: A driver must never be double-dispatched to two different riders simultaneously.
- **High Availability**: Core ride booking and driver tracking must maintain `99.99%` uptime.
- **Resilience to Cellular Disconnections**: Seamlessly handle mobile drops in tunnels or underground garages.

### Capacity Estimations & Sizing (Global Scale)
- **Active Drivers**: 5 Million drivers worldwide; **1 Million active concurrently** at peak hours.
- **Active Riders**: 100 Million monthly active riders; **20 Million daily trips**.
- **Driver GPS Ingress QPS**:
  - 1 Million concurrent drivers pinging location every 4 seconds:
    $\text{Ingress QPS} = 1,000,000 / 4 = \mathbf{250,000\text{ GPS updates/sec}}$.
- **Location Telemetry Bandwidth & Storage**:
  - Each GPS ping: `driver_id` (16 bytes) + `lat/lng` (16 bytes) + `heading` (4 bytes) + `status` (2 bytes) $\approx$ **50 bytes**.
  - Network Ingress = $250,000 \times 50\text{ bytes} \approx$ **12.5 MB/s (100 Mbps)**.
  - Daily GPS raw telemetry = $250,000 \times 86,400 \times 50\text{ bytes} \approx$ **1.08 TB / day**.
- **Rider Trip Request QPS**:
  - 20M trips/day $\implies$ ~230 requests/sec average (peaking at **2,000 QPS**).

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                         DRIVER                         │
├──────────────────┬──────────────┬──────────────────────┤
│ driver_id        │ UUID         │ PRIMARY KEY          │
│ name             │ VARCHAR(100) │ NOT NULL             │
│ vehicle_type     │ VARCHAR(32)  │ UBER_X / BLACK / XL  │
│ status           │ VARCHAR(16)  │ OFFLINE / AVAILABLE /│
│                  │              │ ON_TRIP              │
│ current_h3_index │ BIGINT       │ Uber H3 Resolution 8 │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                          TRIP                          │
├──────────────────┬──────────────┬──────────────────────┤
│ trip_id          │ UUID         │ PRIMARY KEY          │
│ rider_id         │ UUID         │ INDEX, FK            │
│ driver_id        │ UUID         │ NULLABLE, INDEX, FK  │
│ status           │ VARCHAR(32)  │ REQUESTED/ASSIGNED/..│
│ pickup_lat_lng   │ GEOMETRY     │ Point (Lat, Lng)     │
│ dropoff_lat_lng  │ GEOMETRY     │ Point (Lat, Lng)     │
│ fare_cents       │ INT          │ Calculated Fare      │
│ surge_multiplier │ DECIMAL(3,2) │ e.g. 1.50x           │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Ingest Driver Location Ping (gRPC / WebSocket)
```protobuf
message DriverLocationPing {
  string driver_id = 1;
  double latitude = 2;
  double longitude = 3;
  float bearing_degrees = 4;
  enum DriverStatus status = 5; // AVAILABLE, BUSY
  int64 timestamp_ms = 6;
}
```

#### 2. Request a Ride
```http
POST /api/v1/trips/request
Content-Type: application/json
Authorization: Bearer <jwt_token>
Idempotency-Key: trip_req_991823

{
  "pickup_location": {"latitude": 37.7749, "longitude": -122.4194},
  "dropoff_location": {"latitude": 37.7833, "longitude": -122.4167},
  "vehicle_type": "UBER_X"
}
```
**Response (`202 Accepted`)**:
```json
{
  "trip_id": "trp_991203",
  "status": "SEARCHING_FOR_DRIVER",
  "estimated_pickup_minutes": 4,
  "fare_cents": 1850,
  "surge_multiplier": 1.2
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="geospatial-dispatch" title="Uber Real-Time Location Ingestion & Dynamic Dispatch Topology" />

### Walkthrough of the Real-Time Dispatch Pipeline

#### 1. Driver Location Ingestion Path
1. Driver mobile app streams GPS location every 4 seconds over persistent **gRPC / WebSocket connections** to edge **Location Ingestion Gateways**.
2. Location Gateway converts coordinates into a 64-bit integer representing an **Uber H3 Hexagonal Cell** (typically Resolution 8, radius $\approx$ 460m).
3. Writes the updated location into **Redis Geospatial / In-Memory Location Cache**:
   - Updates `HSET driver:loc:{driver_id} lat, lng, h3_cell, updated_at`.
   - Adds `driver_id` to the H3 cell's active driver set: `SADD h3:{cell_id} driver_id`.
4. Emits a location event to **Kafka** for background surge pricing and trip route auditing.

#### 2. Rider Request & Matching Path
1. Rider requests a pickup at `(lat, lng)`.
2. **Dispatch Matching Service**:
   - Converts pickup coordinate into its corresponding H3 cell ID.
   - Performs a **k-ring expansion** (querying the pickup cell plus its 6 immediately adjacent hexagonal neighbors) to find candidate drivers.
   - Filters candidate drivers by `status == AVAILABLE` and matching `vehicle_type`.
3. **Candidate Ranking & ETA Routing Engine**:
   - Computes actual street-network ETAs for the top 5 candidates using road topology graphs (OSRM / custom routing engine).
   - Selects the optimal driver (lowest ETA + highest acceptance rating).
4. **Atomic Dispatch Offer**:
   - Emits a dispatch offer to the chosen driver via WebSocket with a **15-second acceptance countdown**.
   - Driver accepts $\implies$ Trip transitions to `ASSIGNED`; candidate is locked to prevent double dispatch.
   - Driver rejects or times out $\implies$ Dispatcher falls back to candidate #2.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Geospatial Indexing (Why Uber Built H3 Hexagons)
Why did Uber build its own hexagonal hierarchical spatial index instead of using standard Geohashes or square grids?

```
SQUARE GRID / GEOHASH:
A square has two types of neighbors:
- 4 orthogonal neighbors (distance = 1.0)
- 4 diagonal neighbors (distance = √2 ≈ 1.414)
➔ Distortions in distance calculations! Finding "nearest" points requires
   uneven circular approximations.

UBER H3 HEXAGONAL GRID:
Every hexagon has exactly 6 neighbors, and every neighbor is at the
EXACT SAME DISTANCE (uniform centroid distance)!
➔ True radial expansion: A k-ring of radius 1 is a perfect symmetric circle!
➔ Minimizes projection distortion and simplifies geospatial smoothing.
```
- **Hierarchical Indexing**: A resolution 8 hexagon contains 7 finer resolution 9 sub-hexagons. Hex cell IDs are encoded as compact **64-bit integers**, enabling lightning-fast bitwise operations and in-memory set lookups in Redis.

### Deep Dive 2: Atomic Dispatch Locking & Race Conditions
What happens if two riders in the same neighborhood request rides at the exact same second, and Driver D1 is the closest vehicle for both?

```
Rider 1 Dispatcher                       Rider 2 Dispatcher
        │                                        │
Finds D1 (ETA 2 mins)                    Finds D1 (ETA 2 mins)
        │                                        │
Send offer to D1?                        Send offer to D1?
   ➔ CATASTROPHIC RACE: D1 is offered two trips simultaneously!
```

#### The Atomic Solution: Redis Distributed Lock / State CAS
The Dispatcher must acquire an atomic exclusive lock on the `driver_id` before dispatching the offer:

```lua
-- Lua script to atomically reserve driver for dispatch
-- KEYS[1]: driver:state:D1
-- ARGV[1]: trip_id, ARGV[2]: lock_ttl_seconds (15)

local current_state = redis.call('HGET', KEYS[1], 'status')

if current_state == 'AVAILABLE' then
    redis.call('HSET', KEYS[1], 'status', 'OFFERED', 'trip_id', ARGV[1])
    redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
    return 1 -- LOCK ACQUIRED
else
    return 0 -- DRIVER BUSY / ALREADY OFFERED
end
```
If Driver D1 rejects or times out after 15 seconds, the key expires and resets to `AVAILABLE`, allowing other riders to be matched.

### Deep Dive 3: Real-Time Dynamic Surge Pricing Engine
How does Uber compute surge multipliers dynamically during rainstorms or sports events?
- **Supply / Demand Monitoring**:
  - Every 10 seconds, a streaming Flink job calculates:
    - $\text{Supply} = \text{Count of AVAILABLE drivers in H3 cell } C$.
    - $\text{Demand} = \text{Count of riders viewing fares in H3 cell } C$.
- **Surge Multiplier Formula**:
  $\text{Surge} = \max\left(1.0, f\left(\frac{\text{Demand}}{\text{Supply}}\right)\right)$.
- **Spatial Surge Smoothing**:
  - If Cell A has a 2.5x surge while adjacent Cell B has 1.0x, riders will walk across the street, creating artificial demand cliffs.
  - Uber applies a **Gaussian spatial filter** across neighboring H3 cells to ensure smooth, continuous gradient transitions in surge pricing.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Geospatial Index** | PostGIS `ST_DWithin` Queries | In-Memory Uber H3 Hexagonal Sets | **In-Memory H3**: PostGIS queries under 250K location writes/sec thrash disk I/O. In-memory H3 integer lookups resolve in `< 1ms`. |
| **Driver Connection** | HTTP Polling (every 4s) | Bi-Directional gRPC / WebSockets | **gRPC / WebSockets**: Eliminates TLS handshake and HTTP header overhead for 250,000 pings/sec, slashing battery drain on mobile phones. |
| **Candidate Routing** | Straight-line Euclidean Distance | Road Network Graph (OSRM / Custom) | **Road Network Routing**: Straight-line distance fails in cities with rivers, bridges, and one-way streets. Road graph routing delivers realistic ETAs. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the need for geospatial indexing (Geohash or QuadTree).
- Understands persistent driver connection requirements (WebSockets).
- Designs database schemas for Drivers, Riders, and Trips.
- Implements basic trip state transitions.

### Senior (L5 / IC5)
- Details the advantages of Uber H3 hexagonal spatial indexing over square Geohashes.
- Solves double-dispatch race conditions using atomic Redis distributed locks with 15-second TTL.
- Explains the streaming supply-and-demand pipeline for real-time surge pricing.
- Outlines road-network routing graph algorithms for realistic ETA calculations.

### Staff+ (L6 / Principal)
- Designs active-active multi-region failover for stateful WebSocket connections and trip state machines without dropping live rides in progress.
- Solves location telemetry GPS jitter, noise, and urban canyon signal loss using Kalman filtering and map-matching algorithms.
- Evaluates marketplace equilibrium dynamics: How surge pricing dampens demand while incentivizing driver repositioning across neighboring H3 cells.
