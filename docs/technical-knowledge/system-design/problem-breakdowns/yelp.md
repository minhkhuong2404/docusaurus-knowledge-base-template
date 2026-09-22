---
id: yelp
title: Design a Local Business & Review Platform Like Yelp
sidebar_label: 17. Yelp (Proximity & Reviews)
description: Staff-level system design breakdown for a local business discovery and review service using geospatial indexing and real-time rating rollups.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Local Business & Review Platform Like Yelp

A local business discovery and review platform (e.g., Yelp, Google Maps, TripAdvisor) allows users to search for nearby restaurants, shops, and services based on proximity, rating, price, and category. Users can read reviews, view business details, and post ratings and photos. The system requires fast geospatial proximity queries combined with full-text filters and real-time review aggregations.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Search Businesses**: Search for businesses by location (current GPS coordinates or named city/neighborhood) and keyword/category (e.g., `"Italian restaurants"`, `"open now"`).
2. **View Business Details**: Display business profile, hours, photos, address, and overall aggregated rating.
3. **Leave Reviews & Ratings**: Authenticated users can write a review, upload photos, and assign a 1 to 5 star rating (strictly one review per user per business).
4. **Real-Time Average Rating Rollup**: Business average rating and total review count must update promptly upon new review submissions.
5. **Business Management**: Business owners can create and update business listings, operational hours, and menus.

### Non-Functional Requirements
- **Low Search Latency**: Proximity search queries must return results in `< 100ms` (P95).
- **Read-Heavy Scale**: 100:1 read-to-write ratio (millions of searches and profile views for every review posted).
- **High Availability**: `99.99%` availability for searches and business profile pages.
- **Review Integrity & Spam Defense**: Defend against fake review rings, review bombing, and sybil attacks.

### Capacity Estimations & Sizing
- **Total Businesses Listed**: 200 Million businesses worldwide.
- **Total Reviews**: 2 Billion reviews.
- **Daily Active Users (DAU)**: 50 Million users.
- **Search QPS**: 50,000 searches/sec at peak.
- **Review Submission QPS**: ~50 reviews/sec average (peaking at 200 writes/sec).
- **Storage Calculation (5 Years)**:
  - Business record: `business_id` (16 bytes) + `name` (100 bytes) + `location` (16 bytes) + `details` (500 bytes) $\approx$ **700 bytes**.
  - 200 Million businesses $\times$ 700 bytes $\approx$ **140 GB** (fits easily in database storage and memory cache).
  - Reviews: 2 Billion reviews $\times$ 1 KB text $\approx$ **2 TB** storage.
  - Photos: 500 Million photos $\times$ 500 KB $\approx$ **250 TB** on Amazon S3.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        BUSINESS                        │
├──────────────────┬──────────────┬──────────────────────┤
│ business_id      │ UUID         │ PRIMARY KEY          │
│ name             │ VARCHAR(255) │ NOT NULL             │
│ address          │ VARCHAR(255) │ NOT NULL             │
│ location         │ GEOMETRY     │ Point (Lat, Lng)     │
│ geohash          │ VARCHAR(12)  │ Spatial Index        │
│ category         │ VARCHAR(64)  │ RESTAURANT, BAR, ... │
│ price_tier       │ SMALLINT     │ 1 to 4 ($, $$, ...)  │
│ average_rating   │ DECIMAL(3,2) │ Pre-aggregated       │
│ review_count     │ INT          │ Pre-aggregated       │
│ opening_hours    │ JSONB        │ Operational schedule │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                         REVIEW                         │
├──────────────────┬──────────────┬──────────────────────┤
│ review_id        │ UUID         │ PRIMARY KEY          │
│ business_id      │ UUID         │ COMPOSITE UNIQUE, FK │
│ user_id          │ UUID         │ COMPOSITE UNIQUE, FK │
│ rating_stars     │ SMALLINT     │ 1 to 5               │
│ review_text      │ TEXT         │ UTF-8                │
│ photo_urls       │ JSONB/ARRAY  │ S3 links             │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
│ updated_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Search Businesses by Location & Filters
```http
GET /api/v1/businesses/search?latitude=37.7749&longitude=-122.4194&radius_km=5&category=coffee&open_now=true&sort_by=rating
```
**Response (`200 OK`)**:
```json
{
  "total_results": 142,
  "businesses": [
    {
      "business_id": "biz_88102-991",
      "name": "Sightglass Coffee",
      "distance_km": 1.2,
      "average_rating": 4.65,
      "review_count": 1842,
      "price_tier": 2,
      "is_open_now": true,
      "photo_url": "https://cdn.yelp.com/biz/sightglass.jpg"
    }
  ]
}
```

#### 2. Submit or Update a Review
```http
POST /api/v1/businesses/{business_id}/reviews
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "rating_stars": 5,
  "review_text": "Incredible pour-over and airy atmosphere. Highly recommended!"
}
```
**Response (`201 Created` or `200 OK`)**:
```json
{
  "review_id": "rev_44109",
  "status": "PUBLISHED",
  "business_new_average": 4.65,
  "business_new_count": 1843
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="geospatial-dispatch" title="Yelp Geospatial Proximity Search & Review Rollup Architecture" />

### Walkthrough of Core Workflows

#### 1. Proximity Search Execution (Read Path)
1. User searches for coffee near their current GPS coordinate `(37.7749, -122.4194)`.
2. The **Search Gateway** converts the coordinate into a **Geohash (e.g. 6-character precision, ~1.2 km radius)** or Google S2 cell.
3. Queries the **Search Engine (Elasticsearch / Redis Geo)**:
   - Evaluates spatial distance: `ST_DWithin(location, point, 5000)`.
   - Filters boolean criteria: `category == "coffee"` AND `is_open == true`.
   - Ranks candidate businesses based on a composite score: `Score = w1 * average_rating + w2 * (1 / distance) + w3 * review_count`.
4. Returns top 20 businesses in `< 50ms`.

#### 2. Review Submission & Real-Time Rating Rollup (Write Path)
1. User writes a review $\implies$ `POST /api/v1/businesses/{id}/reviews`.
2. The **Review Service** persists the review in PostgreSQL.
   - Enforces the unique constraint: `UNIQUE (business_id, user_id)` (if user previously reviewed, updates the existing row).
3. Executes atomic rating counter increment or fires a `ReviewSubmittedEvent` to Kafka.
4. **Rating Aggregator Worker**:
   - Calculates the new average:
     $\text{New Avg} = \frac{\text{Old Avg} \times N + \text{New Stars}}{N + 1}$.
   - Updates `average_rating` and `review_count` on the `BUSINESS` table in PostgreSQL and updates the Elasticsearch search index.
   - Primes the Redis Business Profile Cache.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Efficient Average Rating Rollup (Avoiding Table Scans)
If a popular hotel has 50,000 reviews, running `SELECT AVG(rating_stars) FROM reviews WHERE business_id = ?` on every review submission or search query will thrash database CPU and disk I/O!

- **Solution: Denormalized Pre-Aggregated Counters**:
  - We store `total_rating_sum` and `review_count` directly on the `BUSINESS` table.
  - When a new review is submitted:
    ```sql
    UPDATE business
    SET total_rating_sum = total_rating_sum + :new_stars,
        review_count = review_count + 1,
        average_rating = (total_rating_sum + :new_stars)::decimal / (review_count + 1)
    WHERE business_id = :biz_id;
    ```
  - **Handling Updates**: If an existing review is edited (e.g. changed from 2 stars to 5 stars):
    $\Delta = \text{new\_stars} - \text{old\_stars} = +3$.
    `total_rating_sum = total_rating_sum + 3`, while `review_count` remains unchanged.
  - **Runtime Complexity**: $O(1)$ single-row update; eliminates table scans entirely.

### Deep Dive 2: Enforcing Strictly One Review Per User Per Business
How do we ensure a user cannot submit multiple reviews for the same business, even if they click "Submit" concurrently across multiple devices?

```sql
-- Database-Level Idempotency & Unique Composite Constraint
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business(business_id),
    user_id UUID NOT NULL REFERENCES users(user_id),
    rating_stars SMALLINT CHECK (rating_stars BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_business_review UNIQUE (business_id, user_id)
);
```
- **Upsert Semantics**:
  ```sql
  INSERT INTO reviews (review_id, business_id, user_id, rating_stars, review_text, created_at, updated_at)
  VALUES (:id, :biz_id, :user_id, :stars, :text, NOW(), NOW())
  ON CONFLICT (business_id, user_id)
  DO UPDATE SET
      rating_stars = EXCLUDED.rating_stars,
      review_text = EXCLUDED.review_text,
      updated_at = NOW();
  ```
  Guarantees physical deduplication at the storage engine level with zero duplicate review leakage.

### Deep Dive 3: Searching by Named Locations ("SoHo", "Manhattan", "San Francisco")
Users often do not search by raw GPS coordinates; they type named locations: `"Sushi in SoHo, New York"`. How does the system resolve named places?

1. **Geocoding & Location Normalizer**:
   - The query string `"Sushi in SoHo"` is tokenized by a Location Entity Extractor.
   - Recognizes `"SoHo"` as a predefined neighborhood polygon.
   - Resolves `"SoHo"` into its bounding box / geographic polygon via an in-memory **Polygon Spatial Index (R-Tree / PostGIS)**.
2. **Elasticsearch Geospatial Filter**:
   - Executes a `geo_polygon` or `geo_shape` filter matching businesses whose `(lat, lng)` points fall within the SoHo boundary polygon.
   - Applies the keyword query `"Sushi"` against business names, menus, and review texts concurrently.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Rating Calculation** | On-demand `AVG(stars)` SQL query | Denormalized running counters on Business row | **Denormalized Running Counters**: $O(1)$ read and write. Eliminates expensive 50,000-row aggregation queries during peak search traffic. |
| **Search Engine** | PostGIS SQL Queries | Elasticsearch / OpenSearch | **Elasticsearch**: Combines geospatial radial bounding boxes with BM25 full-text keyword search and faceted filtering (`open_now`, `price`) in a single query. |
| **Cache Invalidation** | Cache-Aside with TTL | Cache-Aside + CDC (Debezium) | **CDC Event-Driven**: When a business updates its hours or average rating, Debezium captures the WAL change and evicts the Redis cache immediately, eliminating stale business info. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Designs relational schemas for Businesses, Reviews, and Users.
- Enforces the one-review-per-user constraint using a unique database index.
- Uses Geohash or QuadTree for radius-based search.
- Understands the need to pre-compute average ratings to avoid slow `AVG()` queries.

### Senior (L5 / IC5)
- Details the denormalized atomic counter update math handling both inserts and rating edits.
- Combines full-text search with geospatial proximity in Elasticsearch.
- Solves named location searches using geocoding and polygon containment queries (R-Tree).
- Implements high-throughput read caching (Redis) for popular business profiles.

### Staff+ (L6 / Principal)
- Designs anti-fraud and fake review detection pipelines: Graph clustering algorithms to detect coordinated review-bombing syndicates.
- Architects multi-region business search: Maintaining synchronized search clusters across global regions with localized master-replica routing.
- Details operational data pipeline resilience: How to recalculate and reconcile millions of business ratings from raw reviews during database corruption or schema migration without downtime.
