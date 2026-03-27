---
id: greedy
title: Greedy
sidebar_position: 15
description: Make the locally optimal choice at each step for globally optimal results
---

# 🤑 Greedy

## Concept

A **Greedy** algorithm makes the **locally optimal choice** at each step with the hope that it leads to the **globally optimal** solution. Unlike DP, it does not reconsider past choices.

**Greedy works when**: the problem has the **greedy choice property** — a local optimum can be extended to a global optimum — AND **optimal substructure** — an optimal solution to the whole problem contains optimal solutions to subproblems.

---

## When to Use

- You can always make a "best next step" without revisiting past decisions
- Sorting and then processing in a specific order often enables greedy
- Interval problems (scheduling, merging)
- Keywords: "minimum number of", "maximum number of", "jump", "meeting rooms"
- When DP gives O(n²) but greedy gives O(n log n)

---

## Pattern 1: Intervals — Sort by End Time

```java
// Activity Selection: maximum non-overlapping intervals
public int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]); // sort by END time

    int count = 0;          // number of intervals to remove
    int end = Integer.MIN_VALUE;

    for (int[] interval : intervals) {
        if (interval[0] >= end) {
            // Non-overlapping: take this interval
            end = interval[1];
        } else {
            // Overlapping: remove it (we keep the one with earlier end)
            count++;
        }
    }
    return count;
}
```

**Why sort by end time?** Taking the interval that ends earliest leaves the most room for future intervals.

---

## Pattern 2: Jump Game

```java
// Can you reach the last index?
public boolean canJump(int[] nums) {
    int maxReach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;  // can't reach position i
        maxReach = Math.max(maxReach, i + nums[i]);
    }
    return true;
}

// Minimum jumps to reach last index
public int jump(int[] nums) {
    int jumps = 0, currEnd = 0, farthest = 0;
    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);
        if (i == currEnd) {       // exhausted current jump range
            jumps++;
            currEnd = farthest;   // jump to the farthest reachable
        }
    }
    return jumps;
}
```

---

## Worked Example: Meeting Rooms II (Minimum Meeting Rooms)

**Problem**: Given intervals representing meetings, find the minimum number of conference rooms needed.

```java
public int minMeetingRooms(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]); // sort by start time

    // Min-heap tracks end times of active meetings
    PriorityQueue<Integer> endTimes = new PriorityQueue<>();

    for (int[] interval : intervals) {
        // If earliest-ending meeting is done, reuse that room
        if (!endTimes.isEmpty() && endTimes.peek() <= interval[0]) {
            endTimes.poll();
        }
        endTimes.offer(interval[1]);
    }

    return endTimes.size(); // rooms in use = total rooms needed
}
```

**Trace** for `[[0,30],[5,10],[15,20]]`:
```
Sort by start: [[0,30],[5,10],[15,20]]

[0,30]:  heap empty → add 30    → heap=[30], rooms=1
[5,10]:  peek=30 > 5 → new room, add 10  → heap=[10,30], rooms=2
[15,20]: peek=10 ≤ 15 → reuse! remove 10, add 20 → heap=[20,30], rooms=2

Answer: 2
```

---

## Worked Example 2: Gas Station

```java
public int canCompleteCircuit(int[] gas, int[] cost) {
    int totalGas = 0, currentGas = 0, startStation = 0;

    for (int i = 0; i < gas.length; i++) {
        int net = gas[i] - cost[i];
        totalGas += net;
        currentGas += net;

        // If we can't reach next station, reset start
        if (currentGas < 0) {
            startStation = i + 1;
            currentGas = 0;
        }
    }

    // If total gas is non-negative, a solution exists (and it's startStation)
    return totalGas >= 0 ? startStation : -1;
}
```

**Key insight**: If sum of all `(gas[i] - cost[i]) >= 0`, a solution exists. The valid starting point is wherever we "gave up" last.

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Greedy idea |
|---|---|---|
| 455 | [Assign Cookies](https://leetcode.com/problems/assign-cookies/) | Match smallest sufficient cookie |
| 605 | [Can Place Flowers](https://leetcode.com/problems/can-place-flowers/) | Greedy scan |
| 860 | [Lemonade Change](https://leetcode.com/problems/lemonade-change/) | Use larger bills first |
| 1005 | [Maximize Sum after K Negations](https://leetcode.com/problems/maximize-sum-of-array-after-k-negations/) | Flip smallest negatives |

### 🟡 Medium
| # | Problem | Greedy idea |
|---|---|---|
| 45 | [Jump Game II](https://leetcode.com/problems/jump-game-ii/) | Greedy farthest reach |
| 55 | [Jump Game](https://leetcode.com/problems/jump-game/) | Track max reachable |
| 134 | [Gas Station](https://leetcode.com/problems/gas-station/) | Greedy reset |
| 435 | [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) | Sort by end |
| 452 | [Minimum Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/) | Sort by end |
| 621 | [Task Scheduler](https://leetcode.com/problems/task-scheduler/) | Schedule most frequent first |
| 763 | [Partition Labels](https://leetcode.com/problems/partition-labels/) | Last occurrence tracking |

### 🔴 Hard
| # | Problem | Greedy idea |
|---|---|---|
| 135 | [Candy](https://leetcode.com/problems/candy/) | Two-pass distribution |
| 330 | [Patching Array](https://leetcode.com/problems/patching-array/) | Extend reachable range |
| 502 | [IPO](https://leetcode.com/problems/ipo/) | Max-heap on profits |
