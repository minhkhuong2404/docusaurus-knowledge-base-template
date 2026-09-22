---
id: search-autocomplete
title: "Design Search Autocomplete / Typeahead Suggestion"
sidebar_label: "39. Search Autocomplete"
description: "Staff-level architecture for low-latency (<20ms) typeahead suggestions using serialized prefix Tries, pre-computed frequency ranking, and asynchronous log aggregation pipelines."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design Search Autocomplete / Typeahead Suggestion

Search autocomplete (also called Typeahead Suggestion) provides real-time query recommendations as users type into a search bar. Operating at Google, Amazon, or YouTube scale, the system must process hundreds of thousands of keystrokes per second, returning the **top 5 most relevant, high-frequency query completions in under 20 milliseconds**.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Prefix Autocomplete**: Given a prefix string entered by the user (e.g., `"sys"`), return the top 5 most frequently searched query suggestions (e.g., `"system design"`, `"system of a down"`, `"system requirements"`).
2. **Dynamic Ranking**: Suggestions must be ranked primarily by historical search popularity, freshness, and personal search history.
3. **Fuzzy / Typo Tolerance**: Suggest correct terms even if the user makes a minor typo (e.g., `"systm desgn"` $\implies$ `"system design"`).
4. **Content Filtering**: Filter out offensive, hateful, or explicit search terms in real time.

### Non-Functional Requirements
- **Ultra-Low Latency**: P99 response latency must be **$< 20\text{ms}$** (any slower causes noticeable typing lag for the user).
- **High Availability**: $99.999\%$ availability. If autocomplete fails, the search input must degrade gracefully to regular text typing without crashing.
- **Massive Scalability**: Handle **100,000+ Keystroke Queries per Second (QPS)** during peak hours.
- **Freshness**: New trending search terms (e.g. breaking news topics) should appear in autocomplete within hours, not days.

### Capacity Estimations & Sizing (5 Years)
- **Daily Active Users**: 200 Million DAU.
- **Daily Searches**: 100 Million daily searches.
- **Keystrokes per Search**: On average, a user types 4–6 characters before clicking a suggestion $\implies \mathbf{500\text{ Million keystroke requests/day}}$.
- **Query Throughput**:
  - Average QPS: $500\text{M} / 86,400\text{s} \approx \mathbf{6,000\text{ QPS}}$.
  - Peak QPS (with 10x burst): **$\approx \mathbf{60,000\text{ to } 100,000\text{ QPS}}$**.
- **Storage & Memory Sizing**:
  - Assume 100 Million unique search queries.
  - Average query length: 20 characters (20 bytes).
  - Storing a clean Trie in memory: Each node contains character pointers, frequency counters, and precomputed top-5 strings.
  - Average memory per Trie node: $\sim 30\text{ bytes}$.
  - Total Trie Memory: $100\text{M unique prefixes} \times 300\text{ bytes} \approx \mathbf{30\text{ GB to } 50\text{ GB RAM}}$.
  - The entire search Trie easily fits inside the RAM of a small Redis or Memcached cluster!

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                      TRIE_NODE                         │
├──────────────────┬──────────────┬──────────────────────┤
│ prefix           │ VARCHAR(64)  │ Current Node Prefix  │
│ frequency_score  │ BIGINT       │ Search Count Total   │
│ top_suggestions  │ ARRAY[STRING]│ Precomputed Top 5    │
│ child_nodes      │ MAP[CHAR,PTR]│ Next Letter Pointers │
│ is_word          │ BOOLEAN      │ Complete Word Flag   │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   QUERY_FREQUENCY_LOG                  │
├──────────────────┬──────────────┬──────────────────────┤
│ query_text       │ VARCHAR(128) │ Normalized Query     │
│ count_7d         │ BIGINT       │ Rolling 7-Day Count  │
│ count_24h        │ BIGINT       │ Trending 24h Count   │
│ last_searched_at │ TIMESTAMP    │ Recency Timestamp    │
│ is_blacklisted   │ BOOLEAN      │ Safety Filter Flag   │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Fetch Autocomplete Suggestions
```http
GET /api/v1/search/autocomplete?q=sys&limit=5
Accept: application/json
```
**Response (`200 OK`)**:
```json
{
  "prefix": "sys",
  "latency_ms": 4.2,
  "suggestions": [
    {"query": "system design", "score": 948100},
    {"query": "system of a down", "score": 521400},
    {"query": "system requirements", "score": 381200},
    {"query": "system analysis", "score": 210900},
    {"query": "systematic investment plan", "score": 194300}
  ]
}
```

#### 2. Search Query Telemetry (Click Logging)
```http
POST /api/v1/telemetry/search-click
Content-Type: application/json

{
  "prefix": "sys",
  "selected_query": "system design",
  "position_clicked": 1,
  "user_id": "941a8-..."
}
```
**Response (`202 Accepted`)**

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="url-shortener" title="Search Autocomplete Prefix Trie & Real-Time Typeahead Pipeline" />

### Walkthrough of Core Flows

#### 1. The Real-Time Read Path (Sub-20ms)
1. **Client-Side Debouncing**: As the user types into the input box, the browser debounces keystrokes by **150ms** (if the user types rapidly `"s-y-s-t-e-m"`, it only fires requests when typing pauses, reducing backend QPS by 70%).
2. The request hits the **Edge CDN (Cloudflare / Akamai)**:
   - Popular 1-letter and 2-letter prefixes (e.g. `"a"`, `"am"`, `"yo"`, `"fa"`) are cached at CDN edge nodes with a 1-hour TTL, serving 40% of queries in $< 5\text{ms}$.
3. On CDN miss, the request passes through the **API Gateway** to the **Autocomplete Service**.
4. The service queries the **In-Memory Trie Cluster (Redis / Custom C++ Daemon)**.
5. Because every Trie node stores its **precomputed top-5 suggestions**, the service traverses down the prefix tree in $O(L)$ time (where $L = \text{prefix length} \le 20$), retrieves the list, and returns.

#### 2. The Asynchronous Data Collection & Offline Build Path
1. When users submit searches or click suggestions, events are streamed to **Apache Kafka**.
2. **Log Sampling**: At high scale, sampling 1 out of every 20 queries ($5\%$ sample) is statistically sufficient to track global popularity without bogging down analytics pipelines.
3. **Stream Aggregation (Apache Flink)**: Aggregates search counts over rolling 1-hour and 7-day tumbling windows.
4. **Offline Trie Rebuilder (MapReduce / Spark)**:
   - Once a day, a batch job builds a new, optimized snapshot of the Trie data structure.
   - For every node, it sorts child frequencies and writes the top 5 queries directly into the node metadata.
5. The serialized Trie snapshot is published to Amazon S3 and loaded into the active Redis / In-Memory Trie cluster via a zero-downtime blue/green cache swap.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Trie Data Structure & The Precomputed Top-K Optimization
Why does a standard Trie fail under high load, and how do precomputed nodes fix it?

```
Standard Trie Problem:
User types prefix: "sys"
1. Traverse down root ──► 's' ──► 'y' ──► 's' (Cost: O(L))
2. Traverse ALL descendants of "sys" to find leaf words (Cost: O(Total descendants))
3. Sort all leaf words by frequency (Cost: O(N log K))
✖ Under high concurrency, traversing millions of sub-nodes causes CPU exhaustion!

Optimized Trie Node (Precomputed Top-5):
Every internal node stores its top 5 suggestions right in the node struct:
Node("sys") {
   top_5: ["system design", "system of a down", "system requirements", ...]
}
✓ Traversal cost is strictly O(L), where L is the prefix string length.
✓ Suggestion lookup is an instant O(1) array fetch!
```

```java
// Production-grade Trie Node with Precomputed Top-K
public class AutocompleteTrieNode {
    private final Map<Character, AutocompleteTrieNode> children = new HashMap<>();
    private final List<Suggestion> topSuggestions = new ArrayList<>(5);
    private boolean isWord = false;
    private long searchCount = 0;

    public void updateTopSuggestion(String query, long count) {
        // Insert and keep only top 5 highest frequency queries
        topSuggestions.removeIf(s -> s.query().equals(query));
        topSuggestions.add(new Suggestion(query, count));
        topSuggestions.sort((a, b) -> Long.compare(b.count(), a.count()));
        if (topSuggestions.size() > 5) {
            topSuggestions.remove(5);
        }
    }
}
```

### Deep Dive 2: Sharding the Trie Across Clusters
When the Trie grows beyond the memory of a single server, how should we shard it?

| Sharding Strategy | Mechanics | Hotspot Hazard | Pros & Cons |
|---|---|---|---|
| **Sharding by First Letter (Range-based)** | Shard 1: `[a-c]`, Shard 2: `[d-f]`, ... | **Extreme**: Letters like `s`, `c`, `m` receive 10x more traffic than `q`, `x`, `z`. | Simple routing, but uneven CPU and memory utilization across nodes. |
| **Consistent Hashing by Prefix String** | Route `hash(prefix) % N` to nodes | **Zero Hotspots**: Uniformly distributes memory across all nodes. | **High Overhead**: Searching `"s"`, `"sy"`, `"sys"` queries completely different physical servers for every keystroke. |
| **Full Replication (Selected Best)** | Replicate the complete Trie ($\sim 30\text{ GB}$) across all query nodes | **Zero**: Each read server handles any query independently. | Because 50 GB easily fits in RAM, horizontal scaling is achieved by adding read replicas behind a load balancer! |

### Deep Dive 3: Real-Time Trending Keywords (Fast Path vs Slow Path)
What happens when a sudden breaking news event occurs (e.g., an earthquake or celebrity death)?
- The daily batch MapReduce build is too slow (hours of lag).
- **The Lambda Architecture Solution**:
  - **Slow Path (Base Trie)**: Rebuilt daily with 7-day historical weights for stable queries.
  - **Fast Path (Redis Trending Delta)**: A lightweight Flink stream detects spikes ($Z\text{-score} > 3.0$ standard deviations over 10 minutes) and writes trending keys to a Redis Sorted Set (`trending_prefixes`).
  - **Query Serving Merger**: The Autocomplete Service fetches the top-5 from the Base Trie, queries the trending delta, and dynamically blends them into the final response.

### Deep Dive 4: Typo Tolerance & Fuzzy Search
How do we handle user typos (e.g. typing `"iphne"` instead of `"iphone"`)?
- **Levenshtein Distance ($D \le 1$)**: Allows 1 character insertion, deletion, or substitution.
- **Precomputed Typo Dictionary**: Calculating edit distances dynamically on every keystroke in a live Trie is too slow ($> 50\text{ms}$). Instead:
  - Common typos (e.g. adjacent QWERTY keyboard keys) are pre-mapped to correct canonical terms in an offline reverse map: `{"iphne": "iphone", "googl": "google"}`.
  - If a prefix lookup yields 0 results, the service consults the typo map and redirects to the canonical Trie branch in $< 2\text{ms}$.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Trie Node Optimization** | Dynamic Descendant Traversal | Precomputed Top-5 at Every Node | **Precomputed Top-5**: Slashes query time from $O(\text{subtree})$ to $O(L)$, ensuring sub-20ms P99 responses. |
| **Trie Storage Engine** | Relational Database (`LIKE 'sys%'`) | In-Memory Serialized Trie (RAM/Redis) | **In-Memory Trie**: Relational SQL prefix queries trigger full index scans and cannot sustain 100K QPS. |
| **Frequency Update** | Synchronous Counter on Every Search | Asynchronous Kafka Stream + Sampling | **Asynchronous Sampling**: Decouples write logging from the user-facing search path; protects system against write amplification. |
| **Client Interaction** | Fire HTTP request on every keydown | Client-side 150ms Debouncing | **Client Debouncing**: Filters out 70% of intermediate incomplete keystroke traffic before it touches the network. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the Trie (Prefix Tree) as the ideal foundational data structure for autocomplete.
- Calculates basic storage requirements for unique words and frequencies.
- Proposes caching frequent suggestions to reduce backend load.

### Senior (L5 / IC5)
- Explains why dynamic subtree traversal fails and designs precomputed Top-K lists stored at every Trie node.
- Details the decoupled logging pipeline (Kafka, Flink, and MapReduce batch builds).
- Implements client-side debouncing and CDN edge caching for short prefixes.
- Formulates strategies for filtering offensive or blacklisted search terms.

### Staff+ (L6 / Principal)
- Evaluates Lambda architecture integration for real-time breaking news spikes vs historical base Tries.
- Formulates horizontal scaling strategies (Full replication vs Consistent prefix partitioning).
- Designs personalization algorithms (blending global query frequency with user's past search history and geolocational affinity).
- Evaluates low-memory compact Trie implementations (Radix Tree / Patricia Tree / Marisa-Trie) to minimize memory cache footprint.
