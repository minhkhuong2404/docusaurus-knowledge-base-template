---
id: nearby-friends
title: Design Nearby Friends (Real-Time Location Fan-Out)
sidebar_label: 46. Nearby Friends (Location Fan-Out)
description: Staff-level system design breakdown for a real-time proximity sharing platform like Facebook Nearby Friends using WebSocket connection managers, sharded Redis Pub/Sub clusters, and Geohash spatial boundaries.
---

import NearbyFriendsDiagram from '@site/src/components/NearbyFriendsDiagram';

# Design Nearby Friends (Real-Time Location Fan-Out)

A **Nearby Friends** service (such as Facebook Nearby Friends, Google Find My Friends, or Zenly) enables opt-in mobile users to view their mutual friends' real-time physical locations whenever they are within a specified geographic radius (e.g., 5 miles / 8 kilometers). Unlike static location finders (like Yelp), Nearby Friends involves **continuous bidirectional telemetry from millions of mobile devices**, producing a high-throughput, latency-critical fan-out pipeline where location emissions must be ingested, filtered against friendship graphs, and broadcast to subscribed peers within seconds.

---

## 1. Requirements & System Scale

### Functional Requirements
1. **Real-Time Proximity Visibility**: Users can view all mutual friends located within a 5-mile (8 km) radius along with distance and last-updated timestamp.
2. **Periodic Location Telemetry**: Client devices periodically broadcast their GPS coordinates (latitude, longitude, accuracy) every 30 seconds when active.
3. **Opt-In Privacy Controls**: Users can toggle location sharing on/off, select granular sharing circles (e.g., "All Friends", "Close Friends"), or configure scheduled silences.
4. **Historical Breadcrumb Store**: System retains past location history for trajectory tracking and audit logging.

### Non-Functional Requirements
- **Low Latency**: Location updates must reach online friends' devices within `< 2 seconds` of generation.
- **Battery & Bandwidth Efficiency**: Client protocol must minimize mobile radio wakeups, payload size, and battery drain.
- **High Concurrency & Availability**: `99.99%` uptime during peak commuting and social hours.
- **Graceful Degradation**: If backend fan-out lags, drop intermediate stale coordinates; clients only ever care about the *latest* known position.

---

## 2. Capacity Estimations & Scale Mathematics

Alex Xu's standard benchmark sizing for Nearby Friends targets a hyper-scale deployment:

```
┌─────────────────────────────────────────────────────────────┐
│                    NEARBY FRIENDS SCALE MATH                │
├─────────────────────────────────────────┬───────────────────┤
│ Daily Active Users (DAU)                │ 100 Million       │
│ Concurrent Active Users (Peak)          │ 10 Million        │
│ Location Update Interval                │ Every 30 seconds  │
│ Average Friends per User                │ 400 friends       │
│ Percentage of Friends Online Concurrently│ 10% (~40 friends)│
└─────────────────────────────────────────┴───────────────────┘
```

### Ingestion QPS
$$QPS_{\text{ingest}} = \frac{10,000,000 \text{ concurrent users}}{30 \text{ seconds}} \approx \mathbf{333,333 \text{ updates/sec}}$$

### Fan-Out Broadcast QPS
Each location update must be evaluated against the user's online friends. If 10% of a user's 400 friends are currently active (40 online friends):
$$QPS_{\text{fanout}} = 333,333 \times 40 \approx \mathbf{13.33 \text{ Million broadcasts/sec}}$$

Handling over 13 million message forwards per second requires an architecture that completely avoids relational database joins or heavy message broker offset persistence for ephemeral positions.

---

## 3. High-Level Architecture & Interactive Diagram

<NearbyFriendsDiagram />

---

## 4. Deep-Dive Component Architecture

### 4.1 Client-to-Backend Protocol: Why WebSockets Beat HTTP Polling & P2P

```
┌──────────────┐             ┌──────────────────────────────────────────────────┐
│ Mobile Phone │──WebSocket──▶ WebSocket Connection Server (Stateful, Bounded)  │
└──────────────┘             └──────────────────────────────────────────────────┘
```

1. **Why HTTP Long-Polling / SSE Fails**:
   - HTTP headers (cookies, user-agents, TLS negotiation) add ~500–1000 bytes per request.
   - At 333,333 updates/sec, HTTP headers alone would consume over $333\text{k} \times 800\text{B} \approx \mathbf{266 \text{ MB/sec}}$ of network ingress!
   - Setting up TCP/TLS connections continuously destroys mobile battery life due to mobile cellular radio state machine transitions (RRC Radio Resource Control states: IDLE $\to$ CONNECTED).
2. **Why Peer-to-Peer (WebRTC) Fails at Scale**:
   - If User A has 40 online friends, a P2P mesh requires the mobile phone to maintain 40 concurrent WebRTC mesh channels and transmit its GPS location 40 times over high-meter cellular uplink.
   - Mobile Carrier-Grade NAT (CGNAT) traversal via STUN/TURN relays causes high connection drop rates.
3. **The Optimal Hybrid**:
   - **Persistent Bidirectional WebSocket Connection**: The mobile device maintains exactly **one** persistent WebSocket connection to a WebSocket Connection Gateway.
   - **Lightweight Binary Framing**: Payloads are encoded via Protocol Buffers or FlatBuffers (lat, lng, timestamp, user_id packed into $< 32\text{ bytes}$).

---

### 4.2 State Store & Cache Partitioning

The architecture cleanly decouples **ephemeral real-time state** from **persistent historical records**:

```
                       ┌────────────────────────────┐
                       │   WebSocket Gateways       │
                       └─────────────┬──────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────┐             ┌─────────────────────────────────────┐
│    Location Cache (Redis)   │             │   Location History DB (Cassandra)   │
│ - Key: user_id              │             │ - Append-only time-series           │
│ - Value: {lat, lng, ts}     │             │ - Partition Key: user_id            │
│ - TTL: 10 minutes           │             │ - Cluster Key: timestamp DESC       │
└─────────────────────────────┘             └─────────────────────────────────────┘
```

1. **Redis Location Cache**:
   - Stores only the *current* coordinates of online users.
   - Key: `user:{userId}:loc` $\to$ Value: `{lat: 37.7749, lng: -122.4194, ts: 1717200000}`.
   - Memory footprint: 10M concurrent users $\times 100\text{ bytes} \approx \mathbf{1 \text{ GB}}$. The entire real-time location database easily fits inside the RAM of a single Redis primary node (though sharded for network bandwidth).
   - TTL of 10 minutes automatically expires inactive users who disconnect abruptly without clean logout.
2. **Cassandra / ScyllaDB Location History**:
   - Writes are buffered asynchronously via Kafka to prevent storage spikes from impacting the real-time fan-out pipeline.
   - Partition Key: `(user_id, date)`. Clustering Key: `timestamp DESC`.
   - Used for user trip playback, distance analytics, and privacy compliance exports.

---

### 4.3 Scaled Fan-Out via Redis Pub/Sub & Consistent Hashing

To deliver 13.33M updates/sec, the system assigns **one Pub/Sub channel per user**:

```
Channel Name: "channel:user:{userId}"
```

When User A publishes an updated position:
1. User A's WebSocket server publishes the location update to `channel:user:UserA`.
2. All online friends of User A (User B, User C, User D) are subscribed to `channel:user:UserA`.
3. The Redis Pub/Sub cluster routes the message to the respective WebSocket servers holding connections for User B, C, and D.
4. Each WebSocket server calculates the Haversine distance between User A and the receiving friend:
   $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lng}}{2}\right)}\right)$$
5. If $d \le 5\text{ miles}$, the coordinate is forwarded over the WebSocket to the mobile client; if $d > 5\text{ miles}$, it is silently suppressed.

#### Channel Sharding & ZooKeeper Consistent Hashing
Because no single Redis server can handle 13.33M messages/sec (a single Redis process saturates at ~100k–150k ops/sec due to single-threaded event loop CPU bottleneck), the channels must be distributed across a cluster of **100+ Redis Pub/Sub instances**:

```
WebSocket Server ─── Consistent Hash Ring (ZooKeeper / Ketama) ───▶ Redis Pub/Sub Node N
```

- **Consistent Hash Ring**: Channels are mapped to Redis nodes using consistent hashing with virtual nodes.
- **ZooKeeper / etcd Ring Coordinator**: Monitors node heartbeats. When a Redis node crashes or auto-scales, ZooKeeper broadcasts the updated ring topology to all WebSocket servers.
- **Channel Rebalancing**: Only $K/N$ channels need to be resubscribed when cluster size changes, preventing connection stampedes.

---

## 5. Geohash Boundary Edge Case: The 8-Neighbor Pattern

In variants of Nearby Friends where users can discover **nearby strangers or public venues** (or when partitioning Pub/Sub channels by geographic cell rather than friendship ID), a critical edge case emerges: **The Boundary Problem**.

```
┌──────────────┬──────────────┬──────────────┐
│  Geohash NW  │  Geohash N   │  Geohash NE  │
│    u4pruq    │    u4prup    │    u4pruw    │
├──────────────┼──────────────┼──────────────┤
│  Geohash W   │    Center    │  Geohash E   │
│    u4pruk    │ (User A 📍)   │ (Friend B 📍)│
├──────────────┼──────────────┼──────────────┤
│  Geohash SW  │  Geohash S   │  Geohash SE  │
│    u4prsm    │    u4prsq    │    u4prsv    │
└──────────────┴──────────────┴──────────────┘
```

If User A stands on the eastern edge of cell `u4prup` and Friend B stands 10 meters away across the boundary in cell `u4pruw`, a simple filter querying only `u4prup` will completely fail to detect Friend B.

### The Solution: 8-Neighbor Expansion
Whenever querying or subscribing by spatial grid:
1. Encode User A's coordinate into a Geohash of precision 6 (~1.2 km $\times$ 0.6 km).
2. Compute the **8 adjacent neighbor bounding boxes** (North, North-East, East, South-East, South, South-West, West, North-West).
3. Query / subscribe to the union of all 9 cells:
   $$\text{CellsToQuery} = \{\text{Center}\} \cup \text{Neighbors}(\text{Center})$$
4. Execute exact Haversine distance filtering on the resulting union set to eliminate false positives at the outer corners.

---

## 6. Alternative Architecture: Erlang / Elixir OTP Actor Model

At hyper-scale, several modern real-time companies (including Discord and WhatsApp) avoid heavy external Redis Pub/Sub layers by adopting **Distributed Erlang / Elixir (BEAM)**:

```
┌────────────────────────────────────────────────────────┐
│                   BEAM ACTOR CLUSTER                   │
│                                                        │
│  [Mobile A] ──WS──▶  Actor Process A (Erlang)          │
│                            │                           │
│                            ├── Direct PID Message ──▶  Actor Process B (Friend)
│                            └── Direct PID Message ──▶  Actor Process C (Friend)
└────────────────────────────────────────────────────────┘
```

1. **Lightweight Processes**: Each online user is represented by an Erlang process requiring only ~2.6 KB of RAM. 10 million concurrent users require only ~26 GB of cluster RAM.
2. **Direct Process Messaging**: Instead of Redis channel lookups, Process A queries the distributed Mnesia / ETS registry to find the Process IDs (PIDs) of online friends and sends native binary messages across BEAM cluster nodes.
3. **Trade-Off**: Eliminates the operational complexity of a 100-node Redis cluster, but requires deep specialized expertise in Erlang OTP clustering, netsplit healing, and BEAM VM telemetry.

---

## 7. Architectural Trade-Off Analysis

| Architectural Dimension | Option A: Sharded Redis Pub/Sub | Option B: Erlang / Elixir Actor Model | Option C: Apache Kafka Message Topics |
|---|---|---|---|
| **Latency** | Sub-millisecond ($< 5\text{ms}$) | Nanosecond-range direct process IPC ($< 1\text{ms}$) | Medium (10–50ms due to batching & disk sync) |
| **Operational Simplicity** | Standard Redis tooling, clear team skillset | Requires Erlang/OTP operational competence | High operational overhead (ZooKeeper/KRaft, ISRs) |
| **Memory Footprint** | Moderate (Redis channels + socket descriptors) | Ultra-compact (2.6 KB per active user process) | Heavy (JVM heap + OS page cache + topic metadata) |
| **Delivery Guarantees** | Fire-and-forget (lossy, acceptable for telemetry) | Fire-and-forget (actor mailbox) | Exactly-once / At-least-once with offset tracking |
| **Architectural Verdict** | **Recommended for General Teams** | **Recommended for Extreme Low Latency** | **Unsuitable for 13M Ephemeral Telemetry/sec** |

---

## 8. Failure Modes & Mitigations

### 1. The Hotspot "Celebrity" Problem
- **Scenario**: A user with 5,000 friends (e.g. an influencer) moves location, generating 5,000 fan-out deliveries simultaneously every 30 seconds.
- **Mitigation**: Rate limit location broadcasts for high-fan-out accounts; increase emission interval from 30s to 120s dynamically based on friend count.

### 2. Client Battery Saver Mode & Jitter
- **Scenario**: 10 million mobile phones emit coordinates on exact 30-second synchronized ticks (e.g., :00 and :30 of every minute), creating massive server CPU spikes.
- **Mitigation**: Introduce randomized client-side jitter:
  $$T_{\text{interval}} = 30\text{s} \pm \text{UniformRandom}(0, 5\text{s})$$

### 3. Connection Stampede on Redis Failover
- **Scenario**: A Redis Pub/Sub node crashes, forcing 10,000 WebSocket server instances to resubscribe to hundreds of thousands of channels simultaneously.
- **Mitigation**: Exponential backoff with jitter on channel resubscription, combined with consistent hash ring pre-sharding so that only $1/N$ of total traffic is affected.
