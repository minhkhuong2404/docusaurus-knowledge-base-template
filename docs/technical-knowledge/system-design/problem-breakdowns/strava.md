---
id: strava
title: Design a Fitness Tracking & Segment Leaderboard App Like Strava
sidebar_label: 19. Strava (GPS & Leaderboards)
description: Staff-level system design breakdown for a GPS activity tracking and competitive segment leaderboard platform like Strava.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Fitness Tracking & Segment Leaderboard App Like Strava

A fitness tracking platform (e.g., Strava, Garmin Connect, Nike Run Club) allows athletes to record GPS activities (runs, bike rides, hikes), automatically detects when athletes pass through competitive road or trail sections (**segments**), ranks athletes on real-time segment leaderboards (e.g. King/Queen of the Mountain - KOM/QOM), and shares workouts on a social activity feed.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Record & Upload Activity**: Athletes record GPS traces and upload standard FIT/GPX files or stream live telemetry.
2. **GPS Polyline Processing**: Smooth GPS jitter, elevation noise, and generate map route visuals.
3. **Automated Segment Matching**: Detect all predefined segments intersected during an activity and calculate exact elapsed split times.
4. **Segment Leaderboards**: Maintain real-time global, gender-based, and age-group leaderboards for every segment.
5. **Social Activity Feed & Kudos**: Athletes view friends' activities, give "Kudos" (likes), and leave comments.

### Non-Functional Requirements
- **High Ingestion Scale**: Process millions of GPS activity uploads daily without losing recorded splits.
- **Accurate Spatial Matching**: Millisecond-accurate start/finish detection on segments despite GPS sensor drift.
- **Low Leaderboard Query Latency**: Display segment rankings in `< 50ms`.
- **Data Durability**: Raw GPS coordinates must be preserved permanently for route audits.

### Capacity Estimations & Sizing
- **Total Registered Athletes**: 100 Million athletes.
- **Daily Active Athletes (DAU)**: 10 Million athletes.
- **Daily Activities Uploaded**: 15 Million activities/day $\implies$ ~175 uploads/sec average (peaking at **2,000 uploads/sec** on Sunday mornings).
- **GPS Telemetry Sizing**:
  - An average 1-hour bike ride records 1 GPS point per second = 3,600 points.
  - Each point: `lat` (8 bytes) + `lng` (8 bytes) + `elevation` (4 bytes) + `timestamp` (8 bytes) + `heart_rate/cadence` (4 bytes) $\approx$ **32 bytes**.
  - Average activity size $\approx$ 115 KB (compressed to ~30 KB in binary protocol buffer or FIT format).
  - Daily raw GPS storage = $15\text{M} \times 30\text{ KB} \approx$ **450 GB / day** $\implies$ **164 TB / year** (stored in S3 / cloud blob storage).
- **Segments**: 50 Million active global segments.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        ACTIVITY                        │
├──────────────────┬──────────────┬──────────────────────┤
│ activity_id      │ UUID         │ PRIMARY KEY          │
│ athlete_id       │ UUID         │ INDEX, FK            │
│ sport_type       │ VARCHAR(16)  │ RIDE, RUN, HIKE      │
│ total_distance_m │ FLOAT        │ Meters               │
│ elapsed_time_sec │ INT          │ Seconds              │
│ elevation_gain_m │ FLOAT        │ Meters               │
│ polyline_summary │ TEXT         │ Encoded Polyline     │
│ raw_fit_s3_url   │ VARCHAR(255) │ S3 Storage Link      │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                         SEGMENT                        │
├──────────────────┬──────────────┬──────────────────────┤
│ segment_id       │ UUID         │ PRIMARY KEY          │
│ name             │ VARCHAR(120) │ e.g. "Hawk Hill"     │
│ start_point      │ GEOMETRY     │ Point (Lat, Lng)     │
│ end_point        │ GEOMETRY     │ Point (Lat, Lng)     │
│ bounding_box     │ GEOMETRY     │ Envelope Polygon     │
│ distance_m       │ FLOAT        │ Length of segment    │
│ avg_grade        │ DECIMAL(4,2) │ Incline percentage   │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      SEGMENT_EFFORT                    │
├──────────────────┬──────────────┬──────────────────────┤
│ effort_id        │ UUID         │ PRIMARY KEY          │
│ segment_id       │ UUID         │ COMPOSITE INDEX, FK  │
│ athlete_id       │ UUID         │ INDEX, FK            │
│ activity_id      │ UUID         │ FK                   │
│ elapsed_time_ms  │ INT          │ Milliseconds         │
│ rank_position    │ INT          │ Historical Rank      │
│ start_time       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="geospatial-dispatch" title="Strava Activity Ingestion, Polyline Matching & Leaderboard Topology" />

### Core Data & Matching Workflows

#### 1. Activity Upload Path
1. Mobile app or GPS bike computer uploads FIT/GPX file $\implies$ `POST /api/v1/activities/upload`.
2. The **Upload Gateway** stores the raw binary file in **Raw Activity S3 Storage** and publishes an `ActivityUploadedEvent` to **Apache Kafka**.
3. Returns `202 Accepted` to the client.

#### 2. GPS Processing & Segment Matching Pipeline
1. **Activity Processing Worker** consumes the event from Kafka:
   - **Step 1: Jitter Filtering**: Applies a Kalman filter to smooth GPS drift and removes erroneous spikes (e.g. GPS jumping across buildings).
   - **Step 2: Metrics Calculation**: Calculates total distance, average speed, moving time, and elevation gain.
   - **Step 3: Polyline Simplification**: Runs the Douglas-Peucker algorithm to generate a compressed polyline string for map rendering.
2. **Segment Matching Engine**:
   - Queries a spatial **R-Tree / PostGIS Index** using the activity's bounding box:
     `SELECT segment_id FROM segments WHERE bounding_box && ST_Envelope(activity_geometry)`.
   - For each candidate segment, performs detailed vector projection to determine if the athlete followed the segment path within a 15-meter buffer.
   - Computes split time: $T_{\text{finish}} - T_{\text{start}}$.
3. Writes matched efforts to PostgreSQL and updates **Redis Leaderboards**.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Scalable Segment Matching (Bounding Box Filtering + Fréchet Distance)
How do we match an activity containing 4,000 GPS points against 50 Million global segments without performing slow, brute-force geometric comparisons?

```
Two-Stage Spatial Filtering Architecture:

Stage 1: Coarse Filtering (Spatial Bounding Box / R-Tree):
- Each segment has a pre-computed bounding box envelope.
- Query PostGIS / Spatial R-Tree in memory:
  ST_Intersects(activity_bounding_box, segment_bounding_box).
➔ Filters 50 Million global segments down to ~5-15 local candidate segments in < 5ms!

Stage 2: Fine-Grained Path Traversal (Discrete Fréchet Distance):
- Candidate segment has ordered polyline: S = [p1, p2, ..., pn].
- Activity has ordered GPS points: A = [a1, a2, ..., am].
- We verify:
  1. Athlete passed within 15m of start_point (Interpolate exact millisecond crossing).
  2. Athlete traversed the segment in the correct direction (bearing check).
  3. Discrete Fréchet distance between S and A sub-track is <= 20 meters.
  4. Athlete passed within 15m of end_point.
➔ Precise elapsed time calculated with sub-second interpolation!
```

### Deep Dive 2: Real-Time Segment Leaderboards (Redis Sorted Sets)
How do we maintain instant leaderboards (e.g. Top 10, personal bests, King of the Mountain) for 50 Million segments?

- **Redis Sorted Set (ZSET) Per Segment**:
  - Key: `leaderboard:{segment_id}`
  - Score: `elapsed_time_ms` (lower is better; ascending order).
  - Member: `athlete_id`
- **Recording a New Effort**:
  - Worker runs: `ZADD leaderboard:{segment_id} GT 142050 athlete_101` (only updates if it beats the athlete's existing personal record).
- **Querying Top 10 Athletes (KOM / QOM)**:
  - `ZRANGE leaderboard:{segment_id} 0 9 WITHSCORES` $\implies$ Returns top 10 in **0.5ms**!
- **Querying Athlete's Rank**:
  - `ZRANK leaderboard:{segment_id} athlete_101` $\implies$ Returns exact global position ($O(\log N)$).

### Deep Dive 3: Digital Doping & Anomaly Detection (GPS Cheating)
What happens when someone drives a car or rides an electric motorcycle and uploads it as a bicycle ride, stealing the King of the Mountain title?
- **Speed & Acceleration Thresholds**:
  - If cycling segment speed exceeds 75 km/h on a steep uphill grade $\implies$ Flagged automatically.
  - If instantaneous acceleration exceeds human physical limits ($> 15\text{ m/s}^2$).
- **Cadence & Heart Rate Sensor Correlation**:
  - Compare speed against connected ANT+ Bluetooth sensor data (zero cadence or resting heart rate of 60 bpm while climbing at 40 km/h indicates vehicle travel).
- **Automated Flagging**: Flagged efforts are excluded from the public leaderboard pending community or automated review.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Activity Processing** | Synchronous on Upload | Asynchronous Kafka Worker Pool | **Asynchronous Worker Pool**: Parsing raw binary FIT files and running spatial geometric algorithms takes 2–4 seconds per file. Decoupling upload returns `202 Accepted` in `< 100ms`. |
| **Leaderboard Storage** | SQL `ORDER BY elapsed_time ASC` | In-Memory Redis Sorted Sets (ZSET) | **Redis ZSET**: Relational database queries across millions of efforts take hundreds of milliseconds. Redis provides sub-millisecond leaderboard retrieval and instant rank lookups. |
| **Spatial Indexing** | Full Vector Geometry Traversal | Two-Stage (R-Tree Bounding Box $\to$ Fréchet) | **Two-Stage**: Eliminates 99.999% of non-intersecting segments instantly via fast bounding box indexing, preserving CPU capacity. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Designs data schemas for Athletes, Activities, Segments, and Efforts.
- Understands GPS data formats (GPX/FIT) and asynchronous file processing.
- Uses basic bounding boxes to find candidate segments.
- Uses Redis Sorted Sets for basic leaderboard rankings.

### Senior (L5 / IC5)
- Details the two-stage segment matching pipeline (Coarse R-Tree bounding box $\to$ Fine Fréchet distance).
- Solves GPS sensor drift using Kalman filtering and sub-second endpoint timestamp interpolation.
- Implements Redis ZSET leaderboards with conditional updates (`ZADD GT`) to track personal records.
- Explains anti-cheating anomaly detection rules (heart rate/cadence sensor correlation and gradient physics).

### Staff+ (L6 / Principal)
- Designs historical segment backfilling: When a user creates a brand new segment today, how does the system retrospectively match it against 10 years of historical activities (billions of workouts) without melting the cluster?
- Architects multi-region athlete data residency and GDPR compliance for sensitive biometric GPS location tracking.
- Optimizes social feed fanout for endurance athletes followed by millions of fans (celebrity athlete hybrid timeline model).
