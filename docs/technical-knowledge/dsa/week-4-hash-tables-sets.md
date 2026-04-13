---
id: week-4-hash-tables-sets
title: "Week 4: Hash Tables & Sets"
description: Master Hash Maps and Hash Sets in Java. Learn about O(1) lookups, collision resolution, frequency counting, and the equals() and hashCode() contract.
tags: [dsa, java, hash-tables, hash-sets, algorithms, week-4]
sidebar_position: 4
---

# Week 4: Hash Tables & Sets

## 1. Overview
Welcome to Week 4! This week concludes our first phase on Core Data Structures. We are diving into **Hash Tables** (specifically `HashMap` and `HashSet` in Java). This is arguably the most important data structure for coding interviews. Hash tables allow us to trade space for time, achieving lightning-fast $O(1)$ lookups and inserts. They are the backbone of caching, frequency counting, and relational mapping.

**Goals for this week:**
- Understand how Hash Functions map arbitrary keys to array indices.
- Learn how Java handles hash collisions under the hood.
- Master the `equals()` and `hashCode()` contract for custom objects.
- Recognize patterns where $O(N^2)$ brute-force solutions can be reduced to $O(N)$ using a Hash Map.

---

## 2. Theory & Fundamentals

### Hash Tables
A Hash Table uses a **hash function** to compute an index into an array of buckets or slots, from which the desired value can be found.
- **Time Complexity:** - Average Case: $O(1)$ for Search, Insert, and Delete.
  - Worst Case: $O(N)$ (if many keys hash to the same index, causing massive collisions).
- **Collisions:** Two different keys can generate the same hash code. This is typically resolved via **Chaining** (storing a Linked List at that array index) or **Open Addressing** (finding the next empty slot).

### Java Specifics: `HashMap` and `HashSet`
- **Under the Hood:** In Java 8 and above, `HashMap` uses an array of Nodes (Linked Lists) for chaining. However, to prevent $O(N)$ worst-case lookups during heavy collisions, if a bucket grows beyond 8 elements, Java converts the Linked List into a **Red-Black Tree**, improving worst-case search time to $O(\log N)$.
- **Load Factor:** The default load factor is `0.75`. When the map becomes 75% full, it automatically resizes (doubles the underlying array), which is an $O(N)$ operation but averages out to $O(1)$ amortized.
- **The Contract:** If you use custom objects as keys in a `HashMap`, you **must** override both `equals()` and `hashCode()`. If two objects are equal according to `equals()`, they must return the identical `hashCode()`.

---

## 3. Code Templates (Java)

### Template 1: Frequency Counting
A very common pattern for strings or arrays where you need to count occurrences.
```java
public Map<Integer, Integer> buildFrequencyMap(int[] nums) {
    Map<Integer, Integer> freqMap = new HashMap<>();
    
    for (int num : nums) {
        // getOrDefault is highly optimized and cleaner than checking containsKey
        freqMap.put(num, freqMap.getOrDefault(num, 0) + 1);
    }
    
    return freqMap;
}
```

### Template 2: The Fast Lookup / Complement Strategy
Used when you are searching for a specific pair of elements (like Two Sum).
```java
public boolean findComplement(int[] nums, int target) {
    Set<Integer> seen = new HashSet<>();
    
    for (int num : nums) {
        int complement = target - num;
        if (seen.contains(complement)) {
            return true; // We found the pair
        }
        // Add the current number to the set for future iterations
        seen.add(num);
    }
    
    return false;
}
```

---

## 4. Pattern Recognition Guide

**How to spot Hash Table & Set problems:**
1. **"Find a pair" or "Find a complement":** If the problem requires you to match elements based on a mathematical operation (e.g., $A + B = Target$, so $B = Target - A$), a HashSet/HashMap tracking previously seen elements is the standard approach.
2. **"Group by" or "Categorize":** When you need to group items by a shared characteristic (like anagrams sharing the same sorted characters), use a `Map<String, List<String>>`.
3. **"Unique elements" or "Duplicates":** Any mention of tracking unique values or finding the first non-repeating character screams for a `HashSet` or a frequency `HashMap`.
4. **"In-place" modifications with O(1) extra space:** If you need to modify an array or string in place and track seen elements, a `HashSet` can help you achieve this without additional data structures.
5. **"Design a data structure":** If the problem asks you to implement a custom HashMap or HashSet, focus on the underlying mechanics of hashing, collision resolution, and resizing.
6. **"Count occurrences" or "Frequency":** If you need to count how many times each element appears, a `HashMap` is the go-to solution for building a frequency map.
7. **"Find the longest/shortest substring with X unique characters":** This is a strong signal for using a `HashMap` to track character frequencies within a sliding window.
8. **"Find pairs with a specific difference":** If the problem asks for pairs of numbers that have a specific difference (e.g., `A - B = K`), you can use a `HashSet` to check for the existence of `A - K` or `A + K`.
9. **"Find the first non-repeating character":** Use a `LinkedHashMap` to maintain insertion order while counting frequencies, allowing you to find the first unique character efficiently.
10. **"Design a cache with O(1) access and eviction":** This is a classic use case for a combination of `HashMap` (for O(1) access) and a doubly linked list (for O(1) eviction), as seen in LRU Cache implementations.

---

## 5. Worked Examples

### Example 1: LeetCode 1. Two Sum
**Problem:** Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.
**Solution:**
```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Map stores <Number, Index>
        Map<Integer, Integer> map = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            
            map.put(nums[i], i);
        }
        
        return new int[] {}; // Should not reach here if exactly one solution exists
    }
}
```

### Example 2: LeetCode 49. Group Anagrams
**Problem:** Given an array of strings `strs`, group the anagrams together.
**Solution:**
```java
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        if (strs == null || strs.length == 0) return new ArrayList<>();
        
        Map<String, List<String>> map = new HashMap<>();
        
        for (String s : strs) {
            // Create a unique key for anagrams by counting characters
            char[] hashKey = new char[26];
            for (char c : s.toCharArray()) {
                hashKey[c - 'a']++;
            }
            // Convert the frequency array to a string to use as a HashMap key
            String key = String.valueOf(hashKey);
            
            map.putIfAbsent(key, new ArrayList<>());
            map.get(key).add(s);
        }
        
        return new ArrayList<>(map.values());
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Hash Set Basics**
1. Contains Duplicate (LC 217)
2. Intersection of Two Arrays (LC 349)
3. Happy Number (LC 202)

**Day 2: Hash Map Fundamentals**
4. Two Sum (LC 1)
5. Isomorphic Strings (LC 205)
6. Word Pattern (LC 290)

**Day 3: Frequency Counting Patterns**
7. Valid Anagram (LC 242)
8. Ransom Note (LC 383)
9. First Unique Character in a String (LC 387)

**Day 4: Grouping & Matrix Mapping**
10. Group Anagrams (LC 49)
11. Valid Sudoku (LC 36)
12. Top K Frequent Elements (LC 347)

**Day 5: Advanced Search & Subarrays**
13. Longest Consecutive Sequence (LC 128)
14. Subarray Sum Equals K (LC 560) - *Review from Week 1, combining Map + Prefix Sum*
15. Contiguous Array (LC 525)

**Day 6: Design Challenges**
16. Design HashMap (LC 706)
17. Design HashSet (LC 705)
18. Insert Delete GetRandom O(1) (LC 380)

**Day 7: Complex Implementations & Review**
19. Find All Numbers Disappeared in an Array (LC 448) - *Solve with and without extra space.*
20. Minimum Window Substring (LC 76) - *Hard sliding window relying on HashMaps.*
21. Longest Palindrome (LC 409)

---

## 7. Mock Interview Module

### Problem: The Fraudulent Transaction Detector
**Context:** You are building a risk-analysis engine for a fintech company. You are provided with a real-time stream of `Transaction` objects. Each transaction contains a `transactionId`, an `accountId`, and a `timestamp` (in seconds). 
A user's account is flagged for review if they make two separate transactions within `K` seconds of each other.

**Question:** Write a function `public boolean hasFraudulentActivity(Transaction[] txs, int k)` that returns `true` if *any* account violates this rule, and `false` otherwise.

*Note: The `Transaction` class is provided as:*
```java
class Transaction {
    int id;
    String accountId;
    int timestamp;
}
```

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Is the array of transactions sorted by timestamp?" -> *Interviewer:* You can assume they are roughly chronological, but you shouldn't rely on perfect sorting.
- *Candidate:* "Can an account have more than two transactions?" -> *Interviewer:* Yes. Any two transactions within `K` seconds trigger the flag.

#### Step 2: The Brute Force Solution
Explain that we could compare every transaction against every other transaction. If they share the same `accountId` and their timestamps are within `K` seconds, we flag it.
```java
// Time: O(N^2), Space: O(1)
public boolean hasFraudulentActivity(Transaction[] txs, int k) {
    for (int i = 0; i < txs.length; i++) {
        for (int j = i + 1; j < txs.length; j++) {
            if (txs[i].accountId.equals(txs[j].accountId)) {
                if (Math.abs(txs[i].timestamp - txs[j].timestamp) <= k) {
                    return true;
                }
            }
        }
    }
    return false;
}
```
*Interviewer Critique:* "Our system processes millions of transactions a day. $O(N^2)$ will immediately crash our servers. How can we optimize this to a single pass?"

#### Step 3: The Optimized Solution (HashMap)
Recognize that we only care about the *most recent* transaction for any given account. If we track the last seen timestamp for every `accountId` in a HashMap, we can check for fraud in $O(1)$ time per transaction.
```java
// Time: O(N), Space: O(U) where U is the number of unique accounts
public boolean hasFraudulentActivity(Transaction[] txs, int k) {
    // Map stores <AccountId, Most Recent Timestamp>
    Map<String, Integer> lastSeen = new HashMap<>();
    
    for (Transaction tx : txs) {
        if (lastSeen.containsKey(tx.accountId)) {
            int previousTime = lastSeen.get(tx.accountId);
            if (tx.timestamp - previousTime <= k) {
                return true; // Fraud detected
            }
        }
        // Update the map with the most recent transaction time for this account
        lastSeen.put(tx.accountId, tx.timestamp);
    }
    
    return false;
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "Great optimization. Now, imagine this risk-analysis engine is distributed across 50 different microservices because the data volume is too massive for one server. A standard Java `HashMap` only lives in the RAM of one server. How would you design this to work in a distributed system?"
*Candidate's expected thought process:*
- A single Java `HashMap` cannot be shared across different JVMs.
- To solve this, we would use an **external distributed cache** like **Redis** or **Memcached**. 
- When a transaction comes into any of the 50 microservices, the service queries Redis: `GET <accountId>`. 
- If it exists and is within `K` seconds, we trigger the flag. Otherwise, we `SET <accountId> <timestamp>`.
- *Bonus points:* Mention that to save memory in Redis, we could set a TTL (Time-To-Live) on the keys equal to `K` seconds. If the key expires, it means no fraudulent transaction can happen relative to it anyway, automatically keeping the cache clean.