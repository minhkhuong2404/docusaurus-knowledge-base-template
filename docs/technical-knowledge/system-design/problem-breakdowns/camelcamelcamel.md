---
id: camelcamelcamel
title: Design a Price Tracking & Alerting Service Like CamelCamelCamel
sidebar_label: 24. Price Tracker (CamelCamelCamel)
description: Staff-level system design breakdown for an e-commerce price history tracker and real-time price drop alerting engine.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Price Tracking & Alerting Service Like CamelCamelCamel

A price tracking service (e.g., CamelCamelCamel, Keepa, Honey) monitors millions of e-commerce products (Amazon, Walmart, Best Buy), records their historical price fluctuations over time, visualizes price charts, and automatically fires real-time alerts (email, push, SMS) when a product drops below a user's desired price threshold.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Track Product Prices**: Continuously ingest current prices, stock status, and seller details for millions of products.
2. **Historical Price Charts**: Provide complete historical price graphs (1 month, 1 year, all-time) with lowest, highest, and average price indicators.
3. **Set Price Drop Alerts**: Users set target threshold alerts (e.g., *"Notify me if Apple AirPods drop below \$150"*).
4. **Trigger Notifications**: When a price drop is detected, fire multi-channel notifications (Email, Mobile Push, Browser Extension, Webhook) within minutes.
5. **Product Search & Discovery**: Search tracked products by title, ASIN/SKU, or product URL.

### Non-Functional Requirements
- **High Ingestion Efficiency**: Track **50 Million active products** without getting IP-banned by e-commerce platforms.
- **Adaptive Crawl Scheduling**: Products with volatile prices must be checked frequently (e.g. every 1 hour); static products checked less often (e.g. every 24 hours).
- **Fast Price Chart Serving**: Visual price history charts must load in `< 50ms`.
- **Reliable Alert Delivery**: Price drops are time-sensitive; alerts must be delivered in `< 5 minutes` before items sell out.

### Capacity Estimations & Sizing
- **Total Tracked Products**: 50 Million products.
- **Price Checks per Day**:
  - Adaptive scheduling averages 4 checks per product per day:
    $50\text{M} \times 4 = \mathbf{200\text{ Million price checks/day}} \approx \mathbf{2,300\text{ scrapes/sec}}$.
- **Time-Series Storage Sizing (5 Years)**:
  - Storing only price *changes* (run-length compression):
  - On average, a product price changes twice per month = 24 changes/year.
  - 50M products $\times$ 24 changes $\times$ 5 years = **6 Billion historical data points**.
  - Each point: `product_id` (16 bytes) + `timestamp` (8 bytes) + `price_cents` (4 bytes) + `in_stock` (1 byte) $\approx$ **30 bytes**.
  - 6 Billion $\times$ 30 bytes $\approx$ **180 GB storage** (stored in a specialized Time-Series Database like TimescaleDB or ClickHouse).
- **Active User Alerts**: 10 Million registered price drop alerts.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        PRODUCT                         │
├──────────────────┬──────────────┬──────────────────────┤
│ product_id       │ UUID         │ PRIMARY KEY          │
│ store_name       │ VARCHAR(32)  │ AMAZON, WALMART, ... │
│ external_sku     │ VARCHAR(64)  │ ASIN / SKU           │
│ title            │ VARCHAR(255) │ NOT NULL             │
│ current_price    │ INT          │ In cents             │
│ all_time_low     │ INT          │ In cents             │
│ all_time_high    │ INT          │ In cents             │
│ poll_interval_min│ INT          │ Dynamic: 60 to 1440  │
│ next_check_at    │ TIMESTAMP    │ Scheduler Index      │
│ last_checked_at  │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      PRICE_HISTORY                     │
├──────────────────┬──────────────┬──────────────────────┤
│ product_id       │ UUID         │ COMPOSITE PK, FK     │
│ timestamp        │ TIMESTAMP    │ COMPOSITE PK (TSDB)  │
│ price_cents      │ INT          │ Not null             │
│ is_in_stock      │ BOOLEAN      │ Availability status  │
│ seller_type      │ VARCHAR(16)  │ 1st-Party / 3rd-Party│
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      PRICE_ALERT                       │
├──────────────────┬──────────────┬──────────────────────┤
│ alert_id         │ UUID         │ PRIMARY KEY          │
│ user_id          │ UUID         │ INDEX, FK            │
│ product_id       │ UUID         │ COMPOSITE INDEX, FK  │
│ target_price     │ INT          │ Trigger threshold    │
│ channel          │ VARCHAR(16)  │ EMAIL / PUSH / SMS   │
│ is_triggered     │ BOOLEAN      │ DEFAULT FALSE        │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="crawler-frontier" title="CamelCamelCamel Price Scraping, Time-Series & Alerting Pipeline" />

### Core Data & Alerting Flow

#### 1. Adaptive Crawl Scheduling
1. An **Adaptive Polling Scheduler** queries products where `next_check_at <= NOW()`.
2. Push scrape jobs into a **Scraper Queue (Kafka / RabbitMQ)**.
3. Distributed **Headless Scraper Workers** (Playwright / Puppeteer / Retail APIs):
   - Rotate residential proxy IP addresses to bypass anti-bot detection (Cloudflare / PerimeterX).
   - Parse product detail page HTML, extract current price and stock status.
4. Returns result payload `{product_id, current_price, is_in_stock}` to the Ingestion Service.

#### 2. Price Change Detection & Time-Series Archival
1. The **Ingestion Service** compares the newly scraped price against `product.current_price`:
   - **Case A: Price Has NOT Changed**: Updates `last_checked_at` and recalibrates `next_check_at`. Does **not** write redundant rows to the time-series store!
   - **Case B: Price Changed**:
     - Inserts a new data point into the **TimescaleDB / ClickHouse Time-Series Store**.
     - Updates `current_price`, `all_time_low`, and `all_time_high` on the `PRODUCT` table.
     - Emits a `PriceChangedEvent` to the **Alert Evaluation Engine**.

#### 3. Alert Evaluation & Notification Dispatch
1. The **Alert Evaluation Engine** consumes the `PriceChangedEvent`:
   - Queries matching alerts in memory or database:
     `SELECT * FROM price_alert WHERE product_id = ? AND target_price >= :new_price AND is_triggered = FALSE`.
2. For each matched alert, pushes notification job to **Kafka Notification Topic**.
3. **Notification Worker Pool** dispatches templated emails (SendGrid), push notifications (APNS/FCM), or Discord webhooks.
4. Marks `is_triggered = TRUE` to prevent spamming the user on subsequent minor price adjustments.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Adaptive Crawl Scheduling (Minimizing Scrape Overhead)
If we scrape all 50 Million products every hour, we need **14,000 scrapes/sec**, which triggers aggressive IP bans and costs millions in proxy fees. How do we schedule smartly?

- **Volatile Products vs Static Products**:
  - 80% of products change price less than once a month (e.g. cables, screws, books).
  - 5% of products change price multiple times a day (e.g. video game consoles, GPUs, holiday deals).
- **Dynamic Polling Algorithm**:
  ```
  IF price_changed_today == true:
      poll_interval = max(60 mins, poll_interval / 2)  -- Check more frequently!
  ELSE:
      poll_interval = min(1440 mins, poll_interval * 1.5) -- Back off to 24 hours!
  ```
  - **High-Demand Boost**: If a product has 100+ active user alerts watching it, its maximum interval is capped at 60 minutes.
  - **Result**: Reduces total scraping volume by **80%** while improving price-drop detection latency on high-value products!

### Deep Dive 2: Fast Time-Series Compression & Downsampling
How do we serve interactive price charts with 5 years of historical data in `< 50ms` on mobile screens?

- **Run-Length Compression**: Only record a row when the price physically changes. If a price stays \$199.99 for 6 months, it occupies **exactly one row**, not 4,320 hourly rows!
- **Rollup Materialization (LTTB Downsampling)**:
  - A 4K monitor or mobile screen only has 1,000 horizontal pixels; returning 50,000 data points to the browser wastes bandwidth and freezes the DOM.
  - The API uses the **Largest Triangle Three Buckets (LTTB)** downsampling algorithm to reduce 5,000 points down to **300 visually representative points** in memory.
  - Charts load in **0.02 seconds**!

### Deep Dive 3: Thundering Herd Alert Notifications
When Amazon drops the price of a PlayStation 5 by \$100, **500,000 users** may have active alerts set for that product simultaneously. How do we dispatch 500,000 emails without melting our notification infrastructure?
- **Priority Tiering**:
  - Immediate Push / Webhook alerts dispatched first (cheap, lightweight).
  - Email alerts batched and throttled through an asynchronous worker pool with token-bucket rate limiters per email provider domain (e.g. max 500 emails/sec to Gmail to prevent IP reputation blacklisting).
- **Deduplication Guard**:
  - If a price bounces rapidly between \$399 and \$401 within 10 minutes, the alert engine uses an in-memory Redis cool-down lock (`SET alert:sent:usr_1:prod_2 1 EX 86400 NX`) to ensure a user is alerted at most once per 24 hours for the same price drop.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Crawl Strategy** | Fixed 1-hour interval for all products | Adaptive Velocity-Based Scheduling | **Adaptive Scheduling**: Saves 80% of proxy bandwidth and crawler CPU costs while maintaining `< 1 hour` detection on volatile items. |
| **History Storage** | Standard MySQL Rows | Columnar Time-Series (TimescaleDB / ClickHouse) | **TimescaleDB / ClickHouse**: 10:1 data compression on price floats and sub-10ms historical range queries across billions of rows. |
| **Alert Matching** | Continuous DB Polling | Event-Driven Kafka Consumer | **Event-Driven**: Alert checks trigger only when a price physically changes, eliminating millions of wasted database queries. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the role of scrapers and asynchronous workers.
- Designs relational schemas for Products, Price History, and Alerts.
- Understands basic email/push notification integration.
- Proposes storing price history points sequentially.

### Senior (L5 / IC5)
- Details the **Adaptive Polling Algorithm** to optimize scraper throughput and proxy costs.
- Implements run-length time-series storage and downsampling algorithms (LTTB) for fast chart rendering.
- Solves thundering herd notification bursts when viral products drop in price.
- Handles anti-scraping defenses (residential proxy rotation and browser fingerprinting).

### Staff+ (L6 / Principal)
- Designs an affiliate monetization and checkout attribution tracking engine: Ensuring generated buy links include affiliate tags (`tag=camel...`) with zero tampering.
- Architects multi-retailer inventory mapping: Automatically matching the exact same physical product across Amazon, Walmart, and Target using UPC/EAN universal barcodes and text embeddings.
- Details operational scraper resilience: Circuit breakers that detect when an e-commerce platform silently changes its HTML DOM structure, preventing corrupted price updates from contaminating historical data.
