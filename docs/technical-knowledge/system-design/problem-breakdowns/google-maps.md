---
id: google-maps
title: "Design Google Maps (Navigation & Routing Engine)"
sidebar_label: "38. Google Maps"
description: "Staff-level architecture for vector map tiles, spatial quadtree/H3 indexing, Contraction Hierarchies, A* pathfinding, and real-time live traffic speed overlays."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design Google Maps (Navigation & Routing Engine)

Google Maps serves over 1 billion monthly active users, providing global interactive map navigation, shortest path routing, live traffic overlays, and local place discovery. The architecture must solve two radically distinct technical challenges: **high-throughput, ultra-low-latency vector tile rendering** ($< 20\text{ms}$) and **computationally intensive graph pathfinding over hundreds of millions of road segments** ($< 50\text{ms}$).

---

## 1. Understanding the Problem

### Functional Requirements
1. **Shortest Route Calculation**: Compute the fastest driving route between origin and destination coordinates, taking into account road restrictions, turn penalties, and live traffic.
2. **Turn-by-Turn Navigation**: Provide step-by-step guidance instructions with dynamic re-routing when drivers miss a turn.
3. **Interactive Map Rendering**: Deliver map assets smoothly across 23 zoom levels ($z = 0$ to $22$).
4. **Real-Time Traffic Overlays**: Visualize live traffic congestion (green, orange, red) and factor congestion into route ETAs.
5. **Offline Maps**: Allow users to download designated geographic bounding boxes for offline navigation.

### Non-Functional Requirements
- **Sub-50ms Routing Latency**: Complex cross-country routes must compute in $< 50\text{ms}$ (P95).
- **Sub-20ms Tile Latency**: Map tiles must stream to mobile devices in $< 20\text{ms}$ at 60 FPS scrolling.
- **Accuracy & Recency**: Live traffic updates must reflect real-world road conditions within 60 seconds.
- **Global High Availability**: $99.999\%$ uptime for mission-critical emergency and logistics navigation.

### Capacity Estimations & Sizing (5 Years)
- **Active User Base**: 1 Billion Monthly Active Users (MAU), 200 Million Daily Active Users (DAU).
- **Route Calculations**: 50 Million route requests/day $\implies$ **600 QPS average** (peaking at **5,000 QPS** during rush hours).
- **Map Tile Requests**: Each user scroll or zoom loads $\sim 15$ tiles. 20 Billion tile requests/day $\implies$ **250,000 QPS peak read load**.
- **Vector Tile Storage**:
  - The globe is mapped across 23 zoom levels using the Web Mercator projection ($z/x/y$).
  - Zoom levels 0 to 14 contain the entire global road network in vector format (Protocol Buffers).
  - Total compressed global vector tile dataset: $\approx \mathbf{200\text{ Terabytes}}$.
  - Fully replicable across edge CDN SSDs and RAM caches!

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                      ROAD_SEGMENT                      │
├──────────────────┬──────────────┬──────────────────────┤
│ segment_id       │ INT64        │ Unique Edge ID       │
│ start_node_id    │ INT64        │ Start Intersection   │
│ end_node_id      │ INT64        │ End Intersection     │
│ length_meters    │ FLOAT        │ Physical Distance    │
│ speed_limit_kph  │ INT          │ Legal Speed Limit    │
│ road_class       │ ENUM         │ MOTORWAY, PRIMARY... │
│ is_oneway        │ BOOLEAN      │ Directionality       │
│ geometry_geojson │ LINESTRING   │ Exact Polyline GPS   │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   LIVE_TRAFFIC_STATE                   │
├──────────────────┬──────────────┬──────────────────────┤
│ segment_id       │ INT64        │ PRIMARY KEY          │
│ current_speed_kph│ FLOAT        │ Real-time Aggregated │
│ historical_speed │ FLOAT        │ Time-of-day baseline │
│ congestion_level │ ENUM         │ NORMAL, MODERATE, JAM│
│ updated_at       │ TIMESTAMP    │ Expiry TTL: 60s      │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                       MAP_TILE                         │
├──────────────────┬──────────────┬──────────────────────┤
│ tile_key         │ VARCHAR(32)  │ Format: "z/x/y"      │
│ zoom_level       │ INT          │ 0 to 22              │
│ s2_cell_id       │ INT64        │ Google S2 Spatial Key│
│ protobuf_payload │ BLOB         │ Vector Geometries    │
│ version          │ INT          │ Tile Generation Rev  │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Calculate Route
```http
POST /api/v1/routes/calculate
Content-Type: application/json

{
  "origin": {"lat": 37.7749, "lng": -122.4194},      // San Francisco
  "destination": {"lat": 34.0522, "lng": -118.2437}, // Los Angeles
  "preference": "FASTEST",
  "avoid_tolls": false
}
```
**Response (`200 OK`)**:
```json
{
  "route_id": "rt_8410294b",
  "distance_meters": 615400,
  "duration_seconds": 20820, // 5 hours 47 mins (accounting for live traffic)
  "overview_polyline": "encoded_polyline_string...",
  "turn_by_turn": [
    {
      "instruction": "Merge onto I-80 E",
      "distance_meters": 1200,
      "maneuver": "MERGE_RIGHT"
    }
  ]
}
```

#### 2. Fetch Vector Map Tile
```http
GET /api/v1/tiles/14/2624/6331.mvt
Accept: application/vnd.mapbox-vector-tile
```
**Response (`200 OK`)**:
```http
HTTP/1.1 200 OK
Content-Type: application/vnd.mapbox-vector-tile
Content-Encoding: gzip
Cache-Control: public, max-age=604800, immutable

<binary protobuf vector geometry>
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="vector-tiles" title="Google Maps Vector Tiles & Contraction Hierarchies Routing Topology" />

### Walkthrough of Core Flows

#### 1. The Interactive Map Tile Rendering Flow
1. The client browser or mobile app requests vector tiles based on its viewport coordinates and zoom level ($z/x/y$).
2. The request hits the **Edge CDN (Cloudflare / Google Front End)**:
   - **Cache Hit (95%+)**: Returns pre-generated Mapbox Vector Tile (`.mvt` Protocol Buffer) in $< 10\text{ms}$.
   - **Cache Miss**: Routes to the **Vector Tile Service**, which extracts geometry layers (roads, water, buildings) from a **Spatial Database (PostGIS / Spanner)**, encodes into Protobuf, and caches in Redis/S3.
3. The client's GPU renders the vector geometry locally using WebGL or Metal at **60 FPS**, dynamically styling colors and rotating text labels without redownloading images.

#### 2. The Route Calculation & Navigation Flow
1. Client requests a route from Origin to Destination.
2. The **Graph Routing Engine** loads the precomputed road graph partitioned in memory across memory-optimized clusters.
3. **Map Matching**: Converts raw GPS coordinates into the nearest valid road segment IDs (`start_edge`, `end_edge`).
4. **Contraction Hierarchies (CH) Search**: Executes a bidirectional search across the hierarchical road graph in $< 30\text{ms}$.
5. The engine queries the in-memory **Live Traffic Cache** to adjust edge weights with real-time speeds, computing the final ETA and polyline.
6. Returns the complete navigation itinerary to the client.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Vector Tiles vs Raster PNG Tiles
Why did the industry abandon traditional raster image tiles (256x256 PNGs)?

```
┌────────────────────────────────────────────────────────┐
│              RASTER TILES VS VECTOR TILES              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Raster PNG Tiles:                                     │
│  • Server renders bitmap images on the backend.        │
│  • Size: ~30 KB per tile.                              │
│  • Rotating the map blurs text; zooming pixelates.     │
│  • Requires separate tiles for night/satellite mode.   │
│                                                        │
│  Vector Protobuf Tiles (.mvt):                         │
│  • Server sends mathematical vectors (lines, polygons).│
│  • Size: ~5 KB per tile (80% bandwidth reduction!).    │
│  • Client GPU renders at native display DPI.           │
│  • Smooth 3D tilt, smooth pinch-to-zoom, dynamic text. │
│                                                        │
└────────────────────────────────────────────────────────┘
```
- **Tile Pyramid Indexing ($z/x/y$)**:
  - Zoom 0 represents the entire earth in a single tile ($2^0 \times 2^0 = 1$ tile).
  - Each step in zoom level quadruples the number of tiles ($2^z \times 2^z$).
  - At Zoom 14 (street level), the world is divided into $2^{14} \times 2^{14} = 268\text{ Million tiles}$. Vector tiles allow compression of sparse rural areas while packing dense urban vector detail into Protobuf blobs.

### Deep Dive 2: Graph Routing Algorithms: Why Dijkstra & Standard A* Fail at Scale
A naive Dijkstra search explores nodes uniformly in all directions like a growing circle. Calculating a route from New York to Los Angeles would require evaluating over **100 Million road intersections**, taking 10–30 seconds—completely unacceptable!

```
Comparison of Graph Search Algorithms:

1. Dijkstra:
   Explores radially in all directions.
   Evaluates: ~100,000,000 nodes. Latency: ~15,000ms.

2. Bidirectional A* (Euclidean Distance Heuristic):
   Directs search toward target from both ends.
   Evaluates: ~500,000 nodes. Latency: ~500ms.

3. Contraction Hierarchies (CH - Google Maps Standard):
   Precomputes "shortcut" edges across highway networks.
   Evaluates: ~1,500 nodes. Latency: ~15ms (1,000x faster!).
```

#### Contraction Hierarchies (CH) Mechanics:
1. **Offline Precomputation Phase**:
   - Order all road intersections by importance (residential dead-end = low importance; major highway junction = high importance).
   - "Contract" (remove) low-importance nodes one by one.
   - If removing node $v$ destroys the shortest path between its neighbors $u$ and $w$, insert a precomputed **shortcut edge** $(u, w)$ with length $\text{dist}(u,v) + \text{dist}(v,w)$.
2. **Online Query Phase**:
   - Execute a bidirectional Dijkstra search restricted to **upward edges only** (only traversing from lower-importance nodes to higher-importance nodes).
   - Forward search from Origin climbs the hierarchy to major freeways; backward search from Destination climbs to freeways.
   - The two searches meet at the highest-level highway node in milliseconds, reducing search spaces from millions of nodes to just a few hundred!

### Deep Dive 3: Real-Time Traffic Speed Estimation from GPS Probes
How does Google Maps know a traffic jam just formed on Highway 101?
- **GPS Telemetry Probes**: Millions of Android phones and active Google Maps navigation sessions emit anonymized GPS telemetry pings every 5–10 seconds: `(lat, lng, heading, speed, timestamp)`.
- **Map Matching (Hidden Markov Models - HMM)**: Raw GPS points jitter due to satellite multipath interference in urban areas. An HMM matches noisy GPS coordinate sequences onto physical road segments.
- **Kalman Filter Smoothing**: Eliminates sensor noise and calculates the true vehicle velocity.
- **Tumbling Window Aggregation**: A distributed streaming engine (Apache Flink) calculates the median velocity across all vehicles on each road segment over a rolling 60-second window.
- **Dynamic Edge Weight Re-weighting**: If segment 8492's speed drops from $100\text{ km/h}$ to $20\text{ km/h}$, its traversal weight is updated in the routing graph's dynamic overlay cache.

### Deep Dive 4: Offline Maps Architecture
How can navigation function with zero cellular connectivity?
- **Bounding Box S2 Cell Extraction**: When a user selects an area to download, the system calculates the minimum set of **Google S2 hierarchical spatial cells** that cover the bounding box.
- **Bundled SQLite Archive**: The server packages the vector tiles, road navigation graph (with precomputed CH shortcuts for that region), and place geocoding index into a single compressed `.sqlite` file.
- **Client Embedded Routing Engine**: The mobile app runs a lightweight C++ navigation engine compiled via WebAssembly or native C++ that executes bidirectional A* directly against the local SQLite database.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Map Rendering** | Server-side Raster PNGs | Client-side Vector Tiles (Protobuf) | **Vector Tiles**: Slashes network egress bandwidth by 80%; enables smooth 60 FPS GPU vector styling and tilt. |
| **Pathfinding Engine** | Pure Real-Time Dijkstra / A* | Precomputed Contraction Hierarchies (CH) | **Contraction Hierarchies**: Delivers 1,000x faster routing queries ($< 30\text{ms}$), enabling real-time interactive route previewing. |
| **Spatial Indexing** | R-Tree / PostGIS Geometry | Google S2 / Uber H3 Hexagonal Grid | **Google S2 / H3**: Maps 2D spherical coordinates into 64-bit integers; enables $O(1)$ spatial lookups and hierarchical cache keys. |
| **Traffic Integration** | Full Graph Recomputation on Traffic Spike | Static CH Base Graph + Dynamic Weight Delta | **Static Graph + Delta Overlay**: Precomputing CH takes hours; using an in-memory dynamic weight delta applies live traffic in milliseconds without re-contracting the graph. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands spatial coordinates, zoom levels ($z/x/y$ tile pyramids), and vector tile benefits over raster images.
- Proposes standard graph search algorithms (Dijkstra or A*) for shortest path calculation.
- Designs schemas for road segments, intersections, and traffic speeds.

### Senior (L5 / IC5)
- Explains why Dijkstra/A* fail on continental-scale road networks and proposes hierarchical techniques (Contraction Hierarchies or Custom Highway Hierarchies).
- Details map matching (Hidden Markov Models) and GPS probe aggregation for real-time speed estimation.
- Designs spatial cell indexing using Google S2 or Uber H3.
- Formulates offline map bundling and local on-device routing.

### Staff+ (L6 / Principal)
- Evaluates dynamic real-time traffic updates against precomputed Contraction Hierarchies (e.g. Customizable Contraction Hierarchies - CCH or Multi-Level Dijkstra).
- Designs multi-modal routing algorithms (combining walking, transit schedules, rideshare, and driving).
- Formulates strategies for handling massive traffic rerouting feedback loops (preventing Google Maps from overwhelming quiet residential side streets with highway detours).
- Evaluates GPU-accelerated pathfinding over massive road networks.
