---
id: redis-advanced-data-structures
title: "Advanced Data Structures & Algorithms"
slug: redis-advanced-data-structures
description: A senior deep dive into advanced Redis data types for massive scale, covering Bitmaps, HyperLogLog, and Geospatial.
tags: [redis, bitmap, hyperloglog, geospatial, backend, architecture]
---

# 🚀 Advanced Data Structures & Algorithms

While standard Redis Strings, Lists, and Hashes cover 90% of use cases, operating at massive scale (millions of users, billions of events) requires mathematical ingenuity. Using standard Sets to count unique website visitors will bankrupt your infrastructure costs in RAM.

Senior engineers utilize advanced, highly esoteric Redis data structures specifically designed for these edge cases.

---

## 🗺️ 1. Geospatial Indexes (GEO)

If you are building an Uber clone or a "Local Doctors Near Me" app, you need to calculate distances on a curved earth (Haversine Formula) and find all targets within a 5-mile radius.

Redis `GEO` commands are technically just a specialized Sorted Set (ZSET) where the "score" is a **Geohash**.

### How it Works
1. You insert a member with their Longitude and Latitude.
2. Redis instantly converts those coordinates into a 52-bit integer Geohash and stores it in the ZSET.
3. You query radius points natively.

```bash
# syntax: GEOADD key longitude latitude member
GEOADD drivers -122.4194 37.7749 "driver:john"
GEOADD drivers -122.4221 37.7739 "driver:jane"

# Find drivers within 5km of my location requesting 10 nearby
GEORADIUS drivers -122.41 37.77 5 km WITHDIST COUNT 10 ASC
```

---

## 🧩 2. Bitmaps (Bit arrays)

If you need to track "Daily Active Users" (DAU) or "User Login Streaks" for 100 Million users, storing "User 123 logged in today" as a string is completely unsustainable.

**Bitmaps** are not an actual data type in Redis; they are just String commands executed on the absolute binary level. A Redis String can be 512 Megabytes long, meaning it can store 4.29 Billion individual bits.

### 👶 Beginner Concept: The "Attendance Checklist"
Imagine a giant piece of grid paper with 100 million tiny boxes.
- **Set vs Bitmap:** A standard SET stores the ID of the user. "User #450,000 logged in." If 1 million users log in, you store 1 million distinct 10-byte strings (10 MB).
- **The Bitmap:** Every user is assigned a specific box number. User 450,000 is box 450,000. When he logs in, you just take a pencil and check the box (change a `0` to a `1`).
- **The Math:** 1 million users logging in only takes 1 million bits of space = **122 Kilobytes**!

### Example: Daily Active Users
```bash
# User ID 450000 logs in on Jan 1st
SETBIT dau:2026-01-01 450000 1

# User ID 450000 logs in on Jan 2nd
SETBIT dau:2026-01-02 450000 1

# How many total users logged in on Jan 1st?
BITCOUNT dau:2026-01-01      # Instantly returns 1

# How many users logged in on BOTH Jan 1st AND Jan 2nd?
# Perform an extremely fast binary AND operation across the two bit streams
BITOP AND retained_users dau:2026-01-01 dau:2026-01-02
BITCOUNT retained_users
```

---

## 🔮 3. HyperLogLog (HLL)

If you need to count the exact number of **Unique Views** on a YouTube video, how do you do it?
- You can't use a simple counter (`INCR`), because if I refresh the page 10 times, the count goes up 10 times. I am not "unique".
- You can use a `SET`. Add my user ID to the set. If I refresh 10 times, the set deduplicates me. `SCARD` counts the set.

**The Problem:** What if the video gets 1 Billion unique views? A Set with 1 billion UUID strings will consume **Gigabytes of RAM** just for ONE video's view counter!

### The HyperLogLog Algorithm
Redis implements the HyperLogLog probabilistic algorithm to solve this (`PFADD`, `PFCOUNT`).

A HyperLogLog estimates the cardinality (number of unique elements) of a set with a standard error of **0.81%**, while consuming an absolute maximum of **12 Kilobytes of memory, regardless of whether you count 1 element or 100 Billion elements.**

### 🧠 Senior Deep Dive: How HyperLogLog Does Magic

HLL relies on the mathematical probability of observing consecutive zeroes in the binary representation of a completely randomized hash.

```text
Flip a coin:
- Getting "Tails" (0) once is a 50% chance. (You probably flipped 2 coins).
- Getting 5 "Tails" in a row (00000) is a 3% chance. (You probably flipped 32 coins).
- Getting 20 "Tails" in a row (00000000000000000000) is a 0.00009% chance. 
  (You must have flipped 1,048,576 coins to finally hit that run!)
```

1. When you insert `user123` via `PFADD`, Redis mathematically hashes the string into a binary number `010010000`.
2. Redis looks for the longest run of consecutive zeroes at the end of the hash. Let's say it finds 4 zeroes.
3. According to probability theory, to see a run of exactly 4 zeroes, the system estimates it has "flipped the coin" (hashed unique items) approximately `2^4 = 16` times.
4. Using 16,384 internal registers to smooth out outliers, it calculates the harmonic mean of these zero-runs to output an insanely accurate count.

```bash
# Add unique user IPs visiting a site today
PFADD unique_visitors:2026-01-01 "192.168.1.5"
PFADD unique_visitors:2026-01-01 "10.0.0.1"

# Get the count (e.g. 5,432,194 unique visitors using just 12KB)
PFCOUNT unique_visitors:2026-01-01

# Merge 7 days of daily visitors into a weekly count!
PFMERGE unique_weekly unique_visitors:2026-01-01 unique_visitors:2026-01-02
```

**Senior Heuristic:** When exact counts aren't completely necessary (like a YouTube view counter), abandon `SET` and use `HyperLogLog`. If you absolutely must have exact un-deduplicated tracking where 0.81% error is illegal (like Bank Transactions), stick to the Database or massive scale out architectures.
