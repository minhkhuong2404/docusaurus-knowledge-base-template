---
id: bloom-filters
title: Bloom Filters
sidebar_label: Bloom Filters
description: Probabilistic data structure for efficient membership testing with O(1) lookup time, constant space usage, and controlled false positive rates. Covers implementation, use cases, Java examples, and interview patterns.
tags: [bloom-filter, data-structures, probabilistic, caching, performance, space-efficiency]
---

# Bloom Filters

> A **Bloom filter** is a space-efficient, probabilistic data structure for testing whether an element is a member of a set. It trades **memory efficiency** for a small **false positive rate** (but zero false negatives).

---

## Problem Bloom Filters Solve

Without Bloom filters:
```
Check if user_id exists in database?
→ Query DB (~100ms) → High latency
→ Query cache → Cache miss on new users
→ Query DB anyway → Wasted resources
```

With Bloom filters:
```
Check if user_id might exist?
→ Bloom filter (~1μs) → "Definitely not" or "Maybe"
→ If "Maybe" → Query DB (amortized lower DB load)
→ Zero false negatives → Never miss real data
```

---

## How Bloom Filters Work

### Core Concept
A Bloom filter uses **k independent hash functions** to map elements into **m bit positions** in a bit array.

```
Insertion:
┌─────────────────────────────────────┐
│ Bit Array (initially all 0s)        │
├─────────────────────────────────────┤
│ [0][0][0][1][0][1][0][1][0][0][...]│
│        ↑         ↑         ↑
│        hash1     hash2     hash3
└─────────────────────────────────────┘

Insert "user_123":
  hash1("user_123") % m = 3  → set bit[3] = 1
  hash2("user_123") % m = 5  → set bit[5] = 1
  hash3("user_123") % m = 7  → set bit[7] = 1
```

### Lookup
```
Lookup "user_456":
  hash1("user_456") % m = 3  → bit[3] = 1 ✓
  hash2("user_456") % m = 5  → bit[5] = 0 ✗
  
  Result: "Definitely NOT in set" (false positive impossible)

Lookup "user_123":
  hash1("user_123") % m = 3  → bit[3] = 1 ✓
  hash2("user_123") % m = 5  → bit[5] = 1 ✓
  hash3("user_123") % m = 7  → bit[7] = 1 ✓
  
  Result: "Probably in set" (but small chance of false positive)
```

---

## Java Implementation

### Using Guava Library (Recommended)
```java
import com.google.common.hash.BloomFilter;
import com.google.common.hash.Funnels;

@Service
public class UserBloomFilterService {
    // Create a Bloom filter for 100k users with 1% false positive rate
    private final BloomFilter<Long> userIdFilter = BloomFilter.create(
        Funnels.longFunnel(),    // Hash funnel for Long
        100_000,                  // Expected insertions
        0.01                      // False positive probability (1%)
    );

    public void initializeFilter(List<Long> userIds) {
        userIds.forEach(userIdFilter::put);
    }

    // Check before expensive DB query
    public User getUserIfExists(Long userId) {
        if (!userIdFilter.mightContain(userId)) {
            // Definitely not in DB → early return
            return null;
        }
        
        // Might be in DB → check DB
        return userRepository.findById(userId).orElse(null);
    }
}
```

### Custom Implementation with Apache Commons
```java
import org.apache.commons.collections4.BloomFilter;
import org.apache.commons.collections4.functors.ByteTransformer;

public class BasicBloomFilter<T> {
    private final int size;
    private final byte[] bitArray;
    private final int hashCount;

    public BasicBloomFilter(int expectedElements, double falsePositiveRate) {
        // Calculate optimal bit array size
        this.size = optimalBitArraySize(expectedElements, falsePositiveRate);
        // Calculate optimal number of hash functions
        this.hashCount = optimalHashCount(size, expectedElements);
        this.bitArray = new byte[(size + 7) / 8];
    }

    public void add(T element) {
        for (int i = 0; i < hashCount; i++) {
            int hashCode = hash(element, i);
            int position = Math.abs(hashCode % size);
            setBit(position);
        }
    }

    public boolean mightContain(T element) {
        for (int i = 0; i < hashCount; i++) {
            int hashCode = hash(element, i);
            int position = Math.abs(hashCode % size);
            if (!isBitSet(position)) {
                return false; // Definitely not present
            }
        }
        return true; // Probably present (or false positive)
    }

    private int hash(T element, int seed) {
        return element.hashCode() ^ seed * 31;
    }

    private void setBit(int position) {
        int byteIndex = position / 8;
        int bitIndex = position % 8;
        bitArray[byteIndex] |= (byte)(1 << bitIndex);
    }

    private boolean isBitSet(int position) {
        int byteIndex = position / 8;
        int bitIndex = position % 8;
        return (bitArray[byteIndex] & (1 << bitIndex)) != 0;
    }

    private static int optimalBitArraySize(int n, double p) {
        // m = -(n * ln(p)) / (ln(2)^2)
        return (int)(-n * Math.log(p) / (Math.log(2) * Math.log(2)));
    }

    private static int optimalHashCount(int m, int n) {
        // k = (m / n) * ln(2)
        return Math.max(1, (int)(m / n * Math.log(2)));
    }
}
```

---

## Real-World Use Cases

### 1. Cache Penetration Prevention
```java
// Prevent repeated lookups for non-existent users
@Service
public class CacheService {
    private final BloomFilter<Long> deletedUserIds = BloomFilter.create(
        Funnels.longFunnel(), 10_000_000, 0.001
    );

    public User getUser(Long userId) {
        // Skip DB entirely for known-deleted users
        if (deletedUserIds.mightContain(userId)) {
            return null;
        }
        return cache.getOrFetch(userId, () -> db.findUser(userId));
    }

    @Transactional
    public void deleteUser(Long userId) {
        db.delete(userId);
        deletedUserIds.put(userId); // Add to filter
    }
}
```

### 2. Duplicate Prevention in Stream Processing
```java
// Kafka consumer: prevent processing duplicate events
@Service
public class EventProcessor {
    private final BloomFilter<String> processedEvents = BloomFilter.create(
        Funnels.stringFunnel(StandardCharsets.UTF_8),
        1_000_000,
        0.0001  // 0.01% false positive rate for critical deduplication
    );

    @KafkaListener(topics = "events")
    public void processEvent(Event event) {
        if (processedEvents.mightContain(event.getId())) {
            log.warn("Duplicate event: {}", event.getId());
            return; // Skip if already processed
        }
        
        // Safe to process
        service.handle(event);
        processedEvents.put(event.getId());
    }
}
```

### 3. URL Deduplication in Web Crawlers
```java
// HyperLogLog + Bloom filters in URL deduplication
@Service
public class WebCrawler {
    private final BloomFilter<String> crawledUrls = BloomFilter.create(
        Funnels.stringFunnel(StandardCharsets.UTF_8),
        100_000_000, // 100M URLs
        0.0001       // 0.01% false positive
    );

    public void crawlPage(String url) {
        if (crawledUrls.mightContain(url)) {
            return; // Already crawled
        }

        // Fetch and parse
        Page page = fetchPage(url);
        processPage(page);

        // Mark as processed
        crawledUrls.put(url);
    }
}
```

### 4. User ID Existence Check
```java
// LinkedIn-like: bulk operations checking which users exist
@Service
public class UserService {
    private final BloomFilter<Long> activeUserIds;

    @PostConstruct
    public void loadUserIds() {
        List<Long> allUserIds = userRepository.findAllIds();
        this.activeUserIds = BloomFilter.create(
            Funnels.longFunnel(),
            allUserIds.size(),
            0.001  // 0.1% false positive
        );
        allUserIds.forEach(activeUserIds::put);
    }

    public List<Long> filterExistingUsers(List<Long> userIds) {
        return userIds.stream()
            .filter(activeUserIds::mightContain)
            .filter(id -> userRepository.existsById(id)) // Double-check
            .collect(Collectors.toList());
    }
}
```

---

## Space Complexity Analysis

### Bloom Filter vs Alternatives

| Data Structure | Space (1M elements) | Lookup |
|---|---|---|
| **HashSet< Long >** | ~32 MB (8 bytes × 1M + overhead) | O(1) avg |
| **Bloom Filter**  | ~1.2 MB (with 1% FP rate) | O(k) hashing |
| **TreeSet< Long >** | ~40 MB (per-node overhead) | O(log n) |

**Savings**: Bloom filter uses **96% less space** than HashSet with under 1% false positive rate.

### Formula for Optimal Parameters
```
Given:
  n = expected number of elements
  p = desired false positive rate

Optimal bit array size:
  m = -(n * ln(p)) / (ln(2)²)  ≈ 1.44 * n * log₂(1/p) bits

Optimal number of hash functions:
  k = (m / n) * ln(2)

Example: n=1,000,000, p=0.01 (1%)
  m = -(1M * ln(0.01)) / 0.48 ≈ 9.6 million bits ≈ 1.2 MB
  k = (9.6M / 1M) * 0.693 ≈ 7 hash functions
```

---

## Tradeoffs & Limitations

### Advantages
✅ **Space-efficient**: 1-2 bits per element vs 64+ bits per element in HashSet  
✅ **O(1) lookup**: Constant time regardless of set size  
✅ **Zero false negatives**: "Definitely not" is always correct  
✅ **Predictable memory**: No dynamic resizing  

### Disadvantages
❌ **False positives**: Cannot be eliminated, only controlled  
❌ **No deletion**: Standard Bloom filters don't support efficient removal  
❌ **Counting Bloom filters**: Support deletion but use more space  
❌ **Hash collision risk**: Quality of hash functions affects accuracy  

---

## Variants

### Counting Bloom Filter (with deletions)
```java
// Supports add() and remove() operations
public class CountingBloomFilter<T> {
    private final int[] counts; // Use 4-bit counters instead of bits
    
    public void put(T element) {
        for (int i = 0; i < hashCount; i++) {
            int position = hash(element, i) % size;
            counts[position]++; // Increment counter
        }
    }

    public void remove(T element) {
        for (int i = 0; i < hashCount; i++) {
            int position = hash(element, i) % size;
            if (counts[position] > 0) {
                counts[position]--; // Decrement counter
            }
        }
    }

    public boolean mightContain(T element) {
        for (int i = 0; i < hashCount; i++) {
            int position = hash(element, i) % size;
            if (counts[position] == 0) {
                return false;
            }
        }
        return true;
    }
}
```

### Scalable Bloom Filter
```java
// Dynamically grows without full rebuild
public class ScalableBloomFilter<T> {
    private final List<BloomFilter<T>> filters = new ArrayList<>();
    private final double scalingFactor = 2.0;

    public void add(T element) {
        if (filters.isEmpty() || !getCurrentFilter().put(element)) {
            // Create new larger Bloom filter
            addNewFilter();
            getCurrentFilter().put(element);
        }
    }

    public boolean mightContain(T element) {
        return filters.stream()
            .anyMatch(filter -> filter.mightContain(element));
    }
}
```

---

## Interview Questions (Senior Level)

### Q: Design a cache that prevents cache penetration (queries for non-existent keys inflating DB load).

**A:** Use a Bloom filter for known-missing or valid IDs and check it before hitting DB. This trades a small false-positive rate for a large reduction in useless database reads.

### Q: Given 1 billion URLs, design a duplicate-detection system for a web crawler with 100 servers.

**A:** Partition URLs by consistent hash and use distributed Bloom filters per partition to avoid global coordination. Persist canonical seen-URLs in durable storage and periodically rebuild filters as they saturate.

### Q: Compare Bloom filter vs Redis cache for tracking processed event IDs in Kafka.

**A:** Bloom filters are far more memory-efficient but allow false positives; Redis Sets are precise but expensive in memory. A common approach is Bloom filter for fast pre-check plus a precise fallback for critical paths.

### Q: Design a Bloom filter that supports deletions efficiently.

**A:** Use a Counting Bloom filter with small counters instead of bits, increment on insert and decrement on delete. It enables removal at the cost of higher memory usage and collision-related caveats.

:::info[Interview Focus]
Position Bloom filters as a **memory optimization tool** for permission checks, existence verification, and preventing unnecessary downstream queries. Emphasize the **zero false negatives guarantee** (precision: never miss real data) and acceptable **low false positive rates** (recall: occasionally check DB on false positive). Practice articulating **space vs. accuracy tradeoffs** and real-world scenarios (cache penetration, dedup, URL crawling).
:::

:::danger[Interview Trap]
- **Trap: "Bloom filters support efficient deletion."** Reality: Only Counting Bloom filters support deletion; standard filters don't. Trade space for this capability.
- **Trap: "False positives can be completely eliminated."** Reality: Trade-off with size. Reducing FP rate to 0.001% requires 3× more bits. Know the formula: m ∝ -n*log(p) / (ln2)².
- **Trap: "Use Bloom filters when you need fast removal of old elements."** Reality: Standard Bloom doesn't support removal. Use Counting Bloom (4× space) or periodically rebuild with active data only.
- **Trap: "Bloom filters are better than caching everywhere."** Reality: They're only useful when false positive handling is acceptable (e.g., recheck DB rare cases). Not suitable for precise answers (e.g., authorization checks without fallback).
:::
