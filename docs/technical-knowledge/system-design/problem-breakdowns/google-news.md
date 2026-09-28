---
id: google-news
title: Design a Real-Time News Aggregator Like Google News
sidebar_label: 23. News Aggregator (Google News)
description: Staff-level system design breakdown for a real-time news aggregation and story clustering engine using SimHash and embedding vectors.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Real-Time News Aggregator Like Google News

A news aggregator (e.g., Google News, Apple News, Yahoo News) continuously crawls, ingests, and analyzes articles from tens of thousands of global news publishers, clusters articles covering the same breaking event into a single cohesive story package, categorizes content by topic (World, Tech, Business), and delivers a personalized, ranked news feed to millions of readers.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Multi-Source Ingestion**: Continuously fetch articles via RSS feeds, publisher Webhooks, and web crawlers.
2. **Article Extraction & Normalization**: Extract clean article text, headline, author, publication date, and hero image, stripping out ads, navigation headers, and boilerplate.
3. **Story Clustering**: Group hundreds of different publisher articles covering the same event (e.g., `"NASA Artemis II launches"`) into a single master story cluster.
4. **Topic Classification**: Automatically tag articles into categories (Politics, Technology, Science, Sports, Entertainment).
5. **Personalized Feed & Ranking**: Deliver an algorithmically ranked feed based on story importance, freshness, publisher authority, and reader interests.

### Non-Functional Requirements
- **Real-Time Breaking News Latency**: New articles must be ingested, clustered, and visible in news feeds in `< 3 minutes` from publication.
- **High Read Scale**: Serve personalized news feeds to **50 Million Daily Active Users (DAU)** with `< 150ms` response times.
- **Accurate Deduplication**: Prevent feed spamming by grouping syndicated and duplicate news wire articles (Reuters, AP) together.
- **High Ingestion Throughput**: Process **10 Million new articles per day** globally across 50+ languages.

### Capacity Estimations & Sizing
- **Daily Articles Ingested**: 10 Million articles/day $\implies$ ~115 articles/sec average (peaking at 500 articles/sec during breaking world events).
- **Article Metadata & Clean Text**:
  - Clean text + title + author + embeddings $\approx$ 10 KB per article.
  - Daily text storage = $10\text{M} \times 10\text{ KB} \approx$ **100 GB / day** $\implies$ **36.5 TB / year** (stored in document DB / S3).
- **Read Traffic**:
  - 50M DAU $\times$ 4 visits/day = **200 Million feed requests/day** $\implies$ **2,300 QPS average (peaking at 10,000 QPS)**.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        ARTICLE                         │
├──────────────────┬──────────────┬──────────────────────┤
│ article_id       │ UUID         │ PRIMARY KEY          │
│ cluster_id       │ UUID         │ NULLABLE, INDEX, FK  │
│ publisher_id     │ UUID         │ INDEX, FK            │
│ headline         │ VARCHAR(255) │ NOT NULL             │
│ original_url     │ VARCHAR(2048)│ UNIQUE, NOT NULL     │
│ clean_text       │ TEXT         │ Clean body text      │
│ simhash          │ CHAR(16)     │ 64-bit Hex SimHash   │
│ embedding_vector │ VECTOR(768)  │ Semantic text embed  │
│ category         │ VARCHAR(32)  │ TECH, WORLD, ...     │
│ published_at     │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     STORY_CLUSTER                      │
├──────────────────┬──────────────┬──────────────────────┤
│ cluster_id       │ UUID         │ PRIMARY KEY          │
│ cluster_title    │ VARCHAR(255) │ Dominant headline    │
│ primary_category │ VARCHAR(32)  │ TECH, WORLD, ...     │
│ article_count    │ INT          │ Total grouped stories│
│ centroid_vector  │ VECTOR(768)  │ Cluster avg embedding│
│ score            │ FLOAT        │ Virality / Importance│
│ first_seen_at    │ TIMESTAMP    │ Breaking news start  │
│ updated_at       │ TIMESTAMP    │ Last article added   │
└──────────────────┴──────────────┴──────────────────────┘
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="stream-analytics" title="Google News Ingestion, Clustering & Personalized Feed Architecture" />

### Core News Pipeline Stages

#### 1. Ingestion & Boilerplate Extraction
1. Scrapers and RSS workers fetch HTML articles.
2. An **Article Extractor Service** uses DOM tree analysis (Readability / Boilerpipe algorithm) to discard JavaScript, ads, sidebars, and comments, isolating clean title, body text, and publication timestamps.
3. Raw clean articles are written to **Apache Kafka**.

#### 2. Feature Extraction & Embedding Generation
1. A stream worker consumes the article:
   - Computes a 64-bit **SimHash** for fast near-duplicate detection.
   - Passes the headline and first 2 paragraphs through a transformer language model (e.g. MiniLM / BERT) to generate a **768-dimensional dense semantic embedding vector**.
   - Classifies the article into a category (e.g. Technology) using a zero-shot classifier.

#### 3. Real-Time Story Clustering Engine
1. The **Clustering Service** searches an in-memory **Vector Database (Milvus / Qdrant / FAISS)**:
   - Searches for existing clusters within the last 48 hours whose centroid vector has a cosine similarity $> 0.85$.
   - **Case A: Existing Cluster Found**: Adds article to the cluster, increments `article_count`, and recomputes the centroid vector.
   - **Case B: No Cluster Matches**: Creates a brand-new `STORY_CLUSTER` (breaking news event!).
2. Writes the cluster association to PostgreSQL and publishes a `ClusterUpdatedEvent` to Kafka.

#### 4. Feed Ranking & Serving Layer
1. The **Ranking Engine** scores clusters based on:
   - *Importance*: Total number of distinct publishers covering the story.
   - *Freshness*: Exponential time decay ($e^{-\lambda t}$).
   - *User Affinity*: User reading history categories.
2. Pre-computed top clusters are cached in **Redis** and served to users in `< 100ms`.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Real-Time Story Clustering (SimHash vs Dense Vector Embeddings)
How do we cluster articles from 50 different newspapers covering the exact same event with completely different wording?

```
Headline A (NYT): "NASA Astronauts Prepare for Lunar Orbit Mission"
Headline B (BBC): "Artemis Crew Begins Final Training for Moon Flight"

SimHash (Keyword Matching):
- Token overlap is minimal (words "NASA", "Astronauts", "Lunar" vs "Artemis", "Crew", "Moon").
- SimHash Hamming distance is large ➔ FAILS to cluster!

Dense Vector Embeddings (Semantic Cosine Similarity):
- Embeddings project sentences into a high-dimensional conceptual space:
  Vector("NASA Astronauts Lunar") ≈ Vector("Artemis Crew Moon").
- Cosine similarity = 0.91 (> 0.85 threshold).
➔ PERFECT MATCH! Clustered into the same story package!
```
- **Two-Stage Clustering Architecture**:
  1. *SimHash*: Instant $O(1)$ lookup for exact syndicated duplicates (e.g., AP/Reuters copies republished word-for-word across 200 local newspapers).
  2. *Vector Embeddings (HNSW index in Milvus)*: Semantic clustering for independently written articles covering the same event.

### Deep Dive 2: Story Virality & Freshness Decay (Ranking Algorithm)
How does a breaking story rise to the top of Google News and naturally fade as it grows old?

$$\text{Score} = \frac{\sum_{p \in \text{Publishers}} \text{Authority}(p) \times \text{Velocity}}{(t_{\text{current}} - t_{\text{first\_seen}} + 2)^\gamma} \times \text{UserAffinity}$$

- $\text{Authority}(p)$: High weight for verified primary sources (Reuters, AP, Nature); lower weight for unverified blogs.
- $\text{Velocity}$: Number of new articles published in the last 30 minutes (detects surging breaking news).
- **Time Decay $(\gamma \approx 1.5)$**: Rapidly penalizes stories older than 12 hours unless massive new updates arrive.

### Deep Dive 3: Publisher Diversity & Neutrality Guardrails
If 80% of articles in a cluster come from a single partisan publisher network, how do we prevent biased feeds?
- **Domain Deduplication**: A story cluster displays a carousel of perspectives (e.g., "Full Coverage"). The selection algorithm enforces that no single publisher domain can occupy more than 1 of the top 3 featured spots in a cluster.
- **Fact-Check Tagging**: Articles with schema.org `ClaimReview` structured markup are highlighted to provide context on disputed claims.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Clustering Engine** | Batch K-Means every 1 hour | Online Incremental Vector Clustering (HNSW) | **Online Incremental Clustering**: Batch K-Means delays breaking news by 1 hour. Incremental vector search incorporates breaking news into clusters within 30 seconds. |
| **Deduplication** | Exact String MD5 Hash | SimHash + Dense Embeddings | **SimHash + Embeddings**: Captures both exact syndicated copies and independently authored news coverage. |
| **Feed Serving** | Real-time database query | Pre-computed Redis Category Feeds | **Pre-computed Redis Feeds**: 95% of readers read the top general news feed. Pre-computing top clusters in Redis serves 50M DAU with sub-50ms latencies. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands the need to decouple scraping from serving using message queues.
- Designs relational schemas for Articles, Publishers, and Categories.
- Proposes basic keyword matching (TF-IDF) for clustering.
- Uses Redis to cache trending news stories.

### Senior (L5 / IC5)
- Details the **Two-Stage Clustering Pipeline** (SimHash for wire duplicates $\to$ Dense Vector Embeddings for semantic grouping).
- Implements time decay and publisher authority ranking formulas.
- Explains boilerplate removal and DOM text extraction mechanics.
- Designs vector database indexing (HNSW / Milvus) for sub-50ms candidate cluster retrieval.

### Staff+ (L6 / Principal)
- Evaluates multi-lingual cross-lingual clustering: Grouping Spanish, French, and English articles covering the same global earthquake into a single unified event cluster.
- Architects publisher web-crawling politeness budgets and legal copyright compliance (rendering snippets without violating copyright licensing laws).
- Solves cold-start and breaking news spikes: Handling sudden massive event bursts (e.g. global pandemic or election night) with zero message queue loss or latency degradation.
