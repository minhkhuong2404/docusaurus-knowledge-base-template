---
id: tinder
title: Design a Proximity Dating App Like Tinder
sidebar_label: 6. Tinder (Proximity Matchmaking)
description: Staff-level system design breakdown for a location-based dating and matchmaking app handling millions of concurrent swipes and real-time match notifications.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Proximity Dating App Like Tinder

A proximity-based dating app (e.g., Tinder, Bumble, Hinge) matches users based on geographic proximity, mutual attraction, and age/gender preferences. Users swipe right to like or left to pass. When two users mutually like each other, the system triggers an immediate match notification and unlocks a direct messaging channel.

---

## 1. Understanding the Problem

### Functional Requirements
1. **User Profile & Preferences**: Users configure photos, bio, gender, sexual orientation, target age range, and maximum search distance (e.g. within 25 miles).
2. **Recommendation Deck**: Generate a continuous deck of candidate profiles matching the user's discovery filters and location radius.
3. **Swipe Ingestion**: Record user swipes (Right = Like, Left = Pass, Up = Super Like) with low latency.
4. **Mutual Match Detection**: Detect instant mutual likes and notify both users in real-time (`"It's a Match!"`).
5. **Location Updates**: Update user geographic coordinates periodically when the app is active.

### Non-Functional Requirements
- **Low Latency Swipe Processing**: Swipes must be acknowledged in `< 50ms` so user swiping feels instantaneous.
- **Instant Match Notification**: Match alert delivered to both clients in `< 1s` via WebSockets / APNS.
- **High Throughput**: Support up to **2 Billion swipes per day** worldwide.
- **Fair Recommendation Distribution**: Candidate decks must be dynamically refreshed without showing the same profile repeatedly or showing inactive accounts.

### Capacity Estimations & Sizing
- **Daily Active Users (DAU)**: 50 Million users.
- **Average Swipes per User**: 40 swipes/day $\implies 50\text{M} \times 40 = \mathbf{2\text{ Billion swipes/day}}$.
  - Average Swipe QPS = $2\text{B} / 86,400 \approx$ **23,000 QPS** (peaking at **60,000 QPS** during evening hours).
- **Match Rate**: ~1% of right swipes result in a mutual match $\implies$ **10 Million matches/day** (~115 matches/sec).
- **Storage Calculation (5 Years)**:
  - Swipe records: 2B swipes/day $\times$ 365 $\times$ 5 = **3.65 Trillion swipes**.
  - Storing every swipe permanently in relational DB is cost-prohibitive.
  - Stored as compact key-value pairs or partitioned Cassandra rows: `(swiper_id, target_id, decision, timestamp)` $\approx$ 32 bytes $\implies$ **116 TB storage over 5 years**.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                      USER_PROFILE                      │
├──────────────────┬──────────────┬──────────────────────┤
│ user_id          │ UUID         │ PRIMARY KEY          │
│ name             │ VARCHAR(64)  │ NOT NULL             │
│ birth_date       │ DATE         │ Age calculation      │
│ gender           │ VARCHAR(16)  │ M / F / NON_BINARY   │
│ preference       │ VARCHAR(16)  │ Preferred gender     │
│ min_age          │ INT          │ Preference filter    │
│ max_age          │ INT          │ Preference filter    │
│ max_distance_km  │ INT          │ e.g. 50 km           │
│ last_location    │ GEOMETRY     │ Point (Lat, Lng)     │
│ last_active_at   │ TIMESTAMP    │ Activity filter      │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                         SWIPE                          │
├──────────────────┬──────────────┬──────────────────────┤
│ swiper_id        │ UUID         │ COMPOSITE PK, FK     │
│ target_id        │ UUID         │ COMPOSITE PK, FK     │
│ decision         │ CHAR(1)      │ 'L' (Like), 'P'(Pass)│
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                         MATCH                          │
├──────────────────┬──────────────┬──────────────────────┤
│ match_id         │ UUID         │ PRIMARY KEY          │
│ user_a_id        │ UUID         │ INDEX, FK (Lesser ID)│
│ user_b_id        │ UUID         │ INDEX, FK (Greater ID│
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Ingest Swipe (Right or Left)
```http
POST /api/v1/swipes
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "target_user_id": "usr_78a10-9281",
  "decision": "LIKE" // "LIKE" or "PASS"
}
```
**Response (`200 OK`)**:
```json
{
  "status": "RECORDED",
  "is_match": true,
  "match_details": {
    "match_id": "match_99018",
    "matched_user": {
      "user_id": "usr_78a10-9281",
      "name": "Sarah",
      "photos": ["https://cdn.tinder.com/photos/sarah_1.jpg"]
    }
  }
}
```

#### 2. Fetch Recommendation Deck
```http
GET /api/v1/recommendations?limit=20
Authorization: Bearer <jwt_token>
```
**Response (`200 OK`)**:
```json
{
  "candidates": [
    {
      "user_id": "usr_10284",
      "name": "Alex",
      "age": 27,
      "distance_km": 4.2,
      "bio": "Coffee lover & mountaineer",
      "photos": ["https://cdn.tinder.com/photos/alex_1.jpg"]
    }
  ]
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="geospatial-dispatch" title="Tinder Proximity Discovery & Matchmaking Pipeline" />

### Walkthrough of Core Flows

#### 1. Swipe Ingestion & Instant Mutual Match Detection
1. User A swipes Right on User B $\implies$ `POST /api/v1/swipes`.
2. The **Swipe Service** queries an in-memory **Redis Like Cache** to check if User B has already swiped right on User A:
   - Check key: `HEXISTS likes:UserB UserA`.
3. **If NO (Single Like)**:
   - Records User A's like in Redis: `HSET likes:UserA UserB timestamp`.
   - Asynchronously publishes the swipe event to **Kafka** to update persistent storage (Cassandra/DynamoDB) and machine learning ranking models.
   - Returns `{is_match: false}` immediately to User A in `< 25ms`.
4. **If YES (Mutual Match!)**:
   - Both users have liked each other!
   - Creates a new `MATCH` record in the relational database.
   - Publishes a `MatchCreatedEvent` to Kafka.
   - The **Notification Service** pushes real-time WebSocket alerts to both User A and User B concurrently.
   - Returns `{is_match: true}` in the HTTP response.

#### 2. Recommendation Deck Generation
1. When User A opens the app, the **Recommendation Service**:
   - Determines User A's current **Geohash / S2 Cell**.
   - Queries the **Geospatial Index (Redis Geo / ElasticSearch)** to retrieve active users within User A's search radius (e.g. 25 miles).
   - Filters candidate IDs against User A's past swipe history (`SISMEMBER swiped:UserA candidate_id`) to ensure users never see someone they already swiped on.
   - Filters by age and gender preferences.
   - Ranks the remaining candidate pool using an ML desirability / compatibility score.
2. Returns top 20 candidate profiles.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Mutual Match Concurrency & Race Conditions
What happens if User A and User B swipe right on each other at the exact same millisecond across two different application servers?

```
User A swipes Right on B                     User B swipes Right on A
         │                                            │
         ▼                                            ▼
Check: Did B like A? (No)                   Check: Did A like B? (No)
         │                                            │
Write: A likes B                             Write: B likes A
         │                                            │
   NO MATCH DETECTED!                           NO MATCH DETECTED!
   ➔ CATASTROPHIC BUG: A mutual match was created, but neither user was notified!
```

#### The Atomic Solution: Redis Distributed Lock / Lua Script
To eliminate this race condition, we order the evaluation using a deterministic key lock:

```lua
-- Lua script executed atomically on Redis
-- KEYS[1]: likes:UserA, KEYS[2]: likes:UserB
-- ARGV[1]: UserA_ID, ARGV[2]: UserB_ID

local b_liked_a = redis.call('HEXISTS', KEYS[2], ARGV[1])

if b_liked_a == 1 then
    -- It's a match!
    redis.call('HSET', KEYS[1], ARGV[2], ARGV[3])
    return 1 -- MUTUAL_MATCH
else
    -- Not yet a match; record single like
    redis.call('HSET', KEYS[1], ARGV[2], ARGV[3])
    return 0 -- SINGLE_LIKE
end
```
By locking on `min(UserA, UserB):max(UserA, UserB)`, concurrent swipes are serialized, guaranteeing that exactly one worker detects the mutual match and triggers the notification.

### Deep Dive 2: Geospatial Indexing (Geohash vs Google S2 vs QuadTree)
How do we find potential candidates within a 25-mile radius without performing slow geospatial joins across 50 Million users?

| Indexing Scheme | Representation | Precision & Boundary Handling | Selected Choice |
|---|---|---|---|
| **Geohash (Base32)** | Rectangular hierarchical grid string (e.g. `9q8yy`) | Boundary problem: Points 1 meter apart can have completely different geohash prefixes across cell boundaries. Requires querying 8 neighboring cells. | Good for simple point caching. |
| **QuadTree** | Hierarchical 2D space partition tree in memory | Dynamic sub-division based on population density. | Excellent in-memory search, but complex cross-server synchronization. |
| **Google S2 (Recommended)** | Projects Earth onto 6 cube faces using Hilbert Space-Filling Curve (64-bit integers) | Minimal distortion at poles; spatial locality is preserved linearly. Sub-millisecond radius search. | **Google S2 / Uber H3**: Fast 64-bit integer comparisons fit perfectly into Redis Sorted Sets. |

### Deep Dive 3: Efficiently Excluding Previously Swiped Profiles
If an active user has swiped on 50,000 profiles, how do we exclude those 50,000 users when generating a new recommendation deck?
- **Naive Approach**: `SELECT * FROM users WHERE user_id NOT IN (SELECT target_id FROM swipes WHERE swiper_id = UserA)`.
  - **Fatal Flaw**: Massive SQL query latency, full index scans, completely unscalable.
- **Production Solution**:
  1. **User Swiped Set (Redis Set)**: Store swiped IDs in Redis: `swiped:{user_id}`.
  2. **Bloom Filter per User**: For long-time users with 10,000+ swipes, maintain a **Counting Bloom Filter** in memory. If `bloomFilter.contains(candidate_id) == true`, discard immediately. False positives mean a user is skipped occasionally, which is completely acceptable in a dating app.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Swipe Ingestion** | Synchronous Relational DB Write | In-Memory Redis + Async Kafka | **Redis + Kafka**: Acknowledges swipes in `< 20ms`. Eliminates relational write bottlenecks during peak evening swiping hours. |
| **Match Notifications** | Polling every 10s | Persistent WebSocket Connections | **WebSockets**: Delivers instant dopamine rush of `"It's a Match!"` while both users are actively engaged in the app. |
| **Recommendation Strategy** | Pre-compute all decks offline | Hybrid: Pre-fetch spatial candidates + Real-time filter | **Hybrid**: Pure pre-computation wastes compute on users who change locations; real-time filtering ensures recommendations adapt to current GPS position. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Designs data model for Users, Swipes, and Matches.
- Understands the basic two-way like logic for match creation.
- Implements basic geospatial filtering using bounding boxes or spatial databases.
- Proposes push notifications for match alerts.

### Senior (L5 / IC5)
- Solves the mutual match race condition using Redis Lua scripts or atomic key locking.
- Explains geospatial indexing trade-offs (Geohash vs Google S2 cells vs QuadTree).
- Optimizes recommendation deck generation by filtering previously swiped profiles via Bloom filters or Redis Sets.
- Handles peak evening traffic spikes (60K+ QPS) using message queues for asynchronous durability.

### Staff+ (L6 / Principal)
- Designs global multi-region location roaming: When a user flies from New York to London, how does the system migrate their spatial index without losing pending likes?
- Analyzes shadow-banning, bot detection, and spam prevention architectures (swiping cadence analysis, facial recognition hash verification).
- Details cold-start mitigation for new users to give them immediate profile exposure (algorithmic boost) while maintaining fairness for existing users.
