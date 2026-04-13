---
id: week-19-bit-manipulation-math
title: "Week 19: Bit Manipulation & Math"
description: Shift from high-level data structures to low-level CPU operations. Master XOR properties, Bit Masking, signed vs. unsigned shifts, and core Number Theory in Java.
tags: [dsa, java, bit-manipulation, math, algorithms, week-19]
sidebar_position: 19
---

# Week 19: Bit Manipulation & Math

## 1. Overview
Welcome to Week 19! You are almost at the finish line. After spending months building massive abstract data structures, we are zooming all the way in to the raw metal of the CPU: **Bits and Bytes**.

Bit manipulation is about performing operations directly on the binary representation of numbers. These algorithms are incredibly fast because they execute in single CPU cycles. While pure math and bit problems are slightly less common than graphs or trees in general interviews, they frequently appear as optimal, $O(1)$ space "trick" questions.

**Goals for this week:**
- Understand Java's 32-bit two's complement integer representation.
- Master the difference between Signed Right Shift (`>>`) and Unsigned Right Shift (`>>>`).
- Master the magical properties of XOR (`^`).
- Use Bit Masks to track state and generate subsets.
- Review core Math patterns: Fast Exponentiation, GCD, and Prime generation.

---

## 2. Theory & Fundamentals

### Bitwise Operators
- **AND (`&`):** 1 if both bits are 1. Useful for checking if a specific bit is set.
- **OR (`|`):** 1 if either bit is 1. Useful for setting a specific bit.
- **XOR (`^`):** 1 if bits are different. 0 if they are the same.
- **NOT (`~`):** Flips all bits. (In Java, `~x` equals `-x - 1`).

### The Magic of XOR
XOR is essentially addition without carrying over. It has three incredible properties:
1. $X \oplus X = 0$ (A number XOR'd with itself cancels out).
2. $X \oplus 0 = X$ (XOR with 0 leaves the number unchanged).
3. **Associativity:** $A \oplus B \oplus A = B$ (Order doesn't matter, duplicates cancel out).

### Bit Masking Tricks
A "mask" is a binary number used to keep, change, or drop specific bits of another number.
- **Is it a Power of 2?** If a number is a power of 2, it has exactly one `1` bit (e.g., 8 is `1000`). The expression `x & (x - 1) == 0` instantly checks this.
- **Drop the lowest set bit:** `x = x & (x - 1)` (Brian Kernighan's Algorithm).

### Java Specifics: Shifting
- **Left Shift (`<<`):** `x << 1` multiplies $x$ by 2.
- **Signed Right Shift (`>>`):** `x >> 1` divides $x$ by 2. It *preserves the sign bit*. If the number was negative, it pads the left side with 1s.
- **Unsigned Right Shift (`>>>`):** Shifts right but *always* pads the left side with 0s, regardless of the sign. (C++ does not have this; it is unique to Java and JavaScript).

---

## 3. Code Templates (Java)

### Template 1: Brian Kernighan’s Algorithm (Count Set Bits)
Instead of checking all 32 bits, this algorithm jumps from one set bit to the next, skipping all zeros.
```java
public int countBits(int n) {
    int count = 0;
    while (n != 0) {
        // Drops the lowest '1' bit
        n = n & (n - 1); 
        count++;
    }
    return count;
}
```

### Template 2: Bitmask Subset Generation
If you have an array of size $N$ (where $N \le 20$), you can use an integer from $0$ to $2^N - 1$ to represent every possible subset.
```java
public List<List<Integer>> generateSubsets(int[] nums) {
    int n = nums.length;
    int totalSubsets = 1 << n; // 2^n
    List<List<Integer>> result = new ArrayList<>();
    
    for (int mask = 0; mask < totalSubsets; mask++) {
        List<Integer> currentSubset = new ArrayList<>();
        
        for (int i = 0; i < n; i++) {
            // Check if the i-th bit is set in the current mask
            if ((mask & (1 << i)) != 0) {
                currentSubset.add(nums[i]);
            }
        }
        result.add(currentSubset);
    }
    return result;
}
```

---

## 4. Pattern Recognition Guide

**How to spot Bit & Math problems:**
1. **"Find the missing number" or "Find the single number":** If you are constrained to $O(1)$ extra space, the answer is almost always **XOR**.
2. **"Return the number of 1 bits" or "Hamming Distance":** Standard bitwise AND masking.
3. **Array sizes of $N \le 20$:** If recursion is too complex to write, use a bitmask loop to iterate through all $2^N$ states.
4. **"Modulo $10^9 + 7$":** A massive hint that the answer will exceed `Long.MAX_VALUE`. You must apply `(a * b) % MOD` at *every* step of your math loop, not just at the end.
5. **"Can we do better than O(N)?":** If the problem asks for a solution faster than O(N) and involves finding extremums, this is a strong signal that you can use Bit Manipulation to optimize down to O(1) or O(log N).
6. **"Is this problem asking for a yes/no answer about feasibility?":** If the problem asks if a certain configuration is possible (e.g., can we make the target sum with these numbers?), this is often a strong signal that a Bit Manipulation approach may work, and you should try to prove the necessary properties to determine feasibility.
7. **"Find the k-th smallest/largest":** If the problem asks for the k-th smallest or largest element in a sorted structure, this is often a hint that you can use binary search to find the correct index or value efficiently, or a Bit Manipulation approach to build up to the solution.
8. **"Find the longest/shortest substring with X unique characters":** This is a strong signal for using a Bit Manipulation approach, where you can track character frequencies and use a sliding window to find the optimal substring.
9. **"Find pairs with a specific difference":** If the problem asks for pairs of numbers that have a specific difference (e.g., `A - B = K`), you can use a Bit Manipulation approach to check for the existence of `A - K` or `A + K` efficiently.
10. **"Find the first non-repeating character":** Use a Bit Manipulation approach to maintain a frequency map and track the first unique character efficiently.

---

## 5. Worked Examples

### Example 1: LeetCode 136. Single Number
**Problem:** Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single one. You must implement a solution with a linear runtime complexity and use only constant extra space.
**Solution (XOR):**
```java
class Solution {
    public int singleNumber(int[] nums) {
        int result = 0;
        // Because X ^ X = 0, and X ^ 0 = X, all duplicates will cancel each other out.
        for (int num : nums) {
            result ^= num; 
        }
        return result; // Only the unique number remains
    }
}
```

### Example 2: LeetCode 191. Number of 1 Bits
**Problem:** Write a function that takes the binary representation of an unsigned integer and returns the number of '1' bits it has (also known as the Hamming weight).
**Solution (Unsigned Shift):**
```java
class Solution {
    // Note: Java doesn't have an unsigned int type, so we must treat the signed int carefully
    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) {
            count += (n & 1); // Add 1 if the rightmost bit is 1
            n >>>= 1;         // Unsigned right shift (fills left with 0s)
        }
        return count;
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Bit Basics & XOR**
1. Single Number (LC 136)
2. Number of 1 Bits (LC 191)
3. Counting Bits (LC 338)

**Day 2: Bit Shifting & Masking**
4. Reverse Bits (LC 190)
5. Missing Number (LC 268) - *Solve using both Gauss's Math Formula and XOR.*
6. Hamming Distance (LC 461)

**Day 3: Advanced XOR Patterns**
7. Find the Difference (LC 389)
8. Single Number III (LC 260) - *Trick: Use `x & -x` to find the rightmost set bit to partition the array.*
9. Maximum XOR of Two Numbers in an Array (LC 421) - *Review from Trie week!*

**Day 4: Bitmasks for State Tracking**
10. Subsets (LC 78) - *Solve again using Template 2 instead of Backtracking.*
11. Maximum Length of a Concatenated String with Unique Characters (LC 1239)
12. Bitwise AND of Numbers Range (LC 201)

**Day 5: Fundamental Math Algorithms**
13. Power of Two (LC 231)
14. Pow(x, n) (LC 50) - *Fast Exponentiation in $O(\log n)$.*
15. Count Primes (LC 204) - *Sieve of Eratosthenes.*

**Day 6: Matrix & Geometry Math**
16. Rotate Image (LC 48)
17. Set Matrix Zeroes (LC 73)
18. Max Points on a Line (LC 149) - *Requires calculating slopes and handling precision/GCD.*

**Day 7: Advanced Bit/Math Puzzles**
19. Divide Two Integers (LC 29) - *Divide without using multiplication, division, or mod operator (uses bit shifts).*
20. Sum of Two Integers (LC 371) - *Add without using the `+` operator.*
21. Find the Duplicate Number (LC 287) - *Review: Try solving it with Bit Manipulation!*

---

## 7. Mock Interview Module

### Problem: The Triplicate Database Shards
**Context:** You are working on the reliability team for a distributed database. To ensure no data is lost, every single data block is replicated across **3 different server shards**. 
A massive network failure occurs, and thousands of shards go offline. You manage to scrape together a recovery array of `blockIDs`. 
Because of the failure, every `blockID` in the array appears exactly **3 times**, EXCEPT for one specific `blockID` which lost its backups and only appears **1 time**.

**Question:** Write a function `public int findCorruptedBlock(int[] blockIDs)` that returns the `blockID` of the single un-replicated block. 
*Constraint:* The array contains billions of integers. Your solution must run in $O(N)$ time and use strictly $O(1)$ auxiliary space.

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Can I use a HashSet to count the frequencies?" -> *Interviewer:* No, a HashSet for billions of integers will exceed our memory limits. You must use $O(1)$ space.
- *Candidate:* "Can I just XOR everything like the standard 'Single Number' problem?" -> *Interviewer:* Try it mentally. If a number appears 3 times, $A \oplus A \oplus A = A$. The final XOR result would be the XOR sum of *every* unique number, not just the single one. XOR only cancels out pairs.

#### Step 2: The Logic (Bit Counting Modulo 3)
*Candidate's thought process:*
- Since XOR cancels out multiples of 2, and I need to cancel out multiples of 3, I need to look at the numbers at the bit level.
- An integer has exactly 32 bits.
- If I look at the 0th bit of every number in the array and sum them up, that sum must be a multiple of 3 (from the numbers that appear 3 times) PLUS the 0th bit of the unique number.
- Therefore, if `sum(0th bits) % 3 == 1`, the unique number has a `1` at the 0th bit. If it is `0`, the unique number has a `0`.
- I can repeat this process for all 32 bits and perfectly reconstruct the missing number!

#### Step 3: The Optimized Solution
```java
// Time: O(32 * N) -> O(N)
// Space: O(1)
public int findCorruptedBlock(int[] blockIDs) {
    int uniqueBlockId = 0;
    
    // Iterate over all 32 bit positions
    for (int i = 0; i < 32; i++) {
        int sum = 0;
        
        // Count how many numbers have the i-th bit set
        for (int block : blockIDs) {
            // Right shift the block to put the i-th bit at the 0th position
            // Then bitwise AND with 1 to extract it
            if (((block >> i) & 1) == 1) {
                sum++;
            }
        }
        
        // If the sum is not a multiple of 3, the unique number must have a 1 here
        if (sum % 3 != 0) {
            // Set the i-th bit in our result
            uniqueBlockId |= (1 << i);
        }
    }
    
    return uniqueBlockId;
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "This is a brilliant $O(N)$ solution. However, notice that there is an inner loop executing $32 \times N$ times. Is there a way to solve this using pure digital logic circuits (simulating hardware gates) to process all 32 bits simultaneously without the outer loop?"
*Candidate's expected thought process:*
- Yes, this is the legendary "Single Number II" digital logic optimization.
- We can design a state machine using two integers, `ones` and `twos`, to track the bits that have appeared exactly once and exactly twice.
- When a bit appears a third time, it clears itself from both `ones` and `twos`.
- The code looks like this:
  `ones = (ones ^ num) & ~twos;`
  `twos = (twos ^ num) & ~ones;`
- This processes the entire array in exactly $O(N)$ time with no inner loops, simulating parallel bit processing at the hardware level.