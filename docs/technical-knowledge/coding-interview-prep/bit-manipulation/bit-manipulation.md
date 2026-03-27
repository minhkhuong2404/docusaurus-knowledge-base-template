---
id: bit-manipulation
title: Bit Manipulation
sidebar_position: 16
description: Bitwise operators, tricks, and common interview patterns in Java
---

# ⚡ Bit Manipulation

## Concept

Bit manipulation operates directly on binary representations of integers. It's blazingly fast (single CPU instruction) and often enables elegant O(1) or O(n) solutions where other approaches need more space.

In Java, integers are **32-bit signed** two's complement numbers.

---

## Bit Operators Reference

| Operator | Symbol | Example | Result |
|---|---|---|---|
| AND | `&` | `5 & 3` = `101 & 011` | `001` = 1 |
| OR | `\|` | `5 \| 3` = `101 \| 011` | `111` = 7 |
| XOR | `^` | `5 ^ 3` = `101 ^ 011` | `110` = 6 |
| NOT | `~` | `~5` = `~00000101` | `11111010` = -6 |
| Left Shift | `<<` | `5 << 1` | `10` = 10 (×2) |
| Right Shift | `>>` | `5 >> 1` | `2` (÷2) |
| Unsigned Right Shift | `>>>` | `-1 >>> 1` | `2147483647` |

---

## Essential Bit Tricks

```java
// Check if bit i is set
boolean isSet = (n & (1 << i)) != 0;

// Set bit i
n = n | (1 << i);

// Clear bit i
n = n & ~(1 << i);

// Toggle bit i
n = n ^ (1 << i);

// Get lowest set bit (isolate rightmost 1)
int lsb = n & (-n);           // -n = ~n + 1

// Clear lowest set bit
n = n & (n - 1);              // KEY TRICK: counts set bits, checks power of 2

// Check if n is power of 2
boolean isPow2 = n > 0 && (n & (n - 1)) == 0;

// Count set bits (Brian Kernighan)
int count = 0;
while (n != 0) { n &= (n - 1); count++; }

// Check if n is even/odd
boolean isOdd = (n & 1) == 1;

// Swap two numbers without temp
a ^= b; b ^= a; a ^= b;

// Absolute value (branchless)
int mask = n >> 31;            // all 0s if positive, all 1s if negative
int abs = (n + mask) ^ mask;
```

---

## XOR Properties (Critical for Interviews)

```
a ^ 0 = a        (XOR with 0 is identity)
a ^ a = 0        (XOR with self cancels)
a ^ b ^ a = b    (XOR is associative and commutative)
```

These properties make XOR perfect for finding the unique element in a list of duplicates.

---

## Worked Example 1: Single Number

```java
// Every element appears twice except one. Find it.
public int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) result ^= num;
    return result;
}
// All pairs cancel (a^a=0), single remains (0^a=a)
```

---

## Worked Example 2: Count Bits (DP + Bit Trick)

```java
// For every number from 0 to n, count how many 1 bits it has
public int[] countBits(int n) {
    int[] dp = new int[n + 1];
    for (int i = 1; i <= n; i++) {
        // i has one more 1-bit than (i with lowest set bit cleared)
        dp[i] = dp[i & (i - 1)] + 1;
    }
    return dp;
}
// Example: i=6 (110), i&(i-1)=4 (100), dp[4]=1, so dp[6]=2 ✓
```

---

## Worked Example 3: Single Number III (Two Unique Numbers)

```java
// Every element appears twice except two numbers a and b. Find both.
public int[] singleNumber(int[] nums) {
    int xor = 0;
    for (int n : nums) xor ^= n; // xor = a ^ b

    // Find any bit where a and b differ (use rightmost set bit)
    int diffBit = xor & (-xor);

    int a = 0;
    for (int n : nums) {
        if ((n & diffBit) != 0) a ^= n; // group that has this bit set
    }
    return new int[]{a, xor ^ a}; // b = xor ^ a
}
```

---

## Bitmask DP (Subset Enumeration)

Used for problems involving small sets (n ≤ 20 typically):

```java
// Enumerate all subsets of a set of size n
for (int mask = 0; mask < (1 << n); mask++) {
    for (int i = 0; i < n; i++) {
        if ((mask & (1 << i)) != 0) {
            // Element i is in this subset
        }
    }
}

// Enumerate all subsets of a given mask
for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
    // process sub
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Key Trick |
|---|---|---|
| 136 | [Single Number](https://leetcode.com/problems/single-number/) | XOR all |
| 190 | [Reverse Bits](https://leetcode.com/problems/reverse-bits/) | Shift + OR |
| 191 | [Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/) | `n & (n-1)` |
| 231 | [Power of Two](https://leetcode.com/problems/power-of-two/) | `n & (n-1) == 0` |
| 338 | [Counting Bits](https://leetcode.com/problems/counting-bits/) | DP + lowest bit |

### 🟡 Medium
| # | Problem | Key Trick |
|---|---|---|
| 137 | [Single Number II](https://leetcode.com/problems/single-number-ii/) | Bit counting mod 3 |
| 201 | [Bitwise AND of Numbers Range](https://leetcode.com/problems/bitwise-and-of-numbers-range/) | Common prefix |
| 260 | [Single Number III](https://leetcode.com/problems/single-number-iii/) | XOR + split by diffBit |
| 371 | [Sum of Two Integers](https://leetcode.com/problems/sum-of-two-integers/) | XOR + carry |
| 476 | [Number Complement](https://leetcode.com/problems/number-complement/) | XOR with mask |

### 🔴 Hard
| # | Problem | Key Trick |
|---|---|---|
| 847 | [Shortest Path Visiting All Nodes](https://leetcode.com/problems/shortest-path-visiting-all-nodes/) | BFS + bitmask state |
| 1178 | [Number of Valid Words for Each Puzzle](https://leetcode.com/problems/number-of-valid-words-for-each-puzzle/) | Bitmask frequency |
