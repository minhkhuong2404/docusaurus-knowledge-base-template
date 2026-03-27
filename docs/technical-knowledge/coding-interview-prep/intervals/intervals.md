---
id: intervals
title: Intervals
sidebar_position: 22
description: Merge, insert, and schedule intervals using sorting and greedy techniques
---

# 📏 Intervals

## Concept

**Interval problems** involve pairs `[start, end]` and ask you to merge, count overlaps, schedule resources, or insert new intervals efficiently.

The key insight: **sort by start time** first, then process linearly.

---

## When to Use

- Merging overlapping intervals
- Finding free time / gaps between meetings
- Scheduling with limited resources (meeting rooms)
- Checking if intervals overlap or contain each other

---

## Overlap Check

```java
// Two intervals [a,b] and [c,d] overlap if:
boolean overlaps = a[0] <= b[1] && b[0] <= a[1];

// Merged result:
int[] merged = {Math.min(a[0], b[0]), Math.max(a[1], b[1])};
```

---

## Pattern 1: Merge Intervals

```java
public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]); // sort by start
    List<int[]> result = new ArrayList<>();

    for (int[] interval : intervals) {
        // No overlap with last merged interval → add it
        if (result.isEmpty() || result.get(result.size() - 1)[1] < interval[0]) {
            result.add(interval);
        } else {
            // Overlap → extend the last interval's end
            result.get(result.size() - 1)[1] = Math.max(
                result.get(result.size() - 1)[1], interval[1]
            );
        }
    }
    return result.toArray(new int[0][]);
}
```

---

## Pattern 2: Insert Interval

```java
public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> result = new ArrayList<>();
    int i = 0, n = intervals.length;

    // 1. Add all intervals that end BEFORE newInterval starts
    while (i < n && intervals[i][1] < newInterval[0]) {
        result.add(intervals[i++]);
    }

    // 2. Merge all overlapping intervals with newInterval
    while (i < n && intervals[i][0] <= newInterval[1]) {
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }
    result.add(newInterval);

    // 3. Add remaining intervals
    while (i < n) result.add(intervals[i++]);

    return result.toArray(new int[0][]);
}
```

---

## Worked Example: Employee Free Time

```java
// Find free time slots across all employees' schedules
public List<Interval> employeeFreeTime(List<List<Interval>> schedule) {
    // Flatten all intervals and sort by start time
    List<Interval> all = new ArrayList<>();
    for (List<Interval> emp : schedule) all.addAll(emp);
    all.sort((a, b) -> a.start - b.start);

    List<Interval> result = new ArrayList<>();
    Interval prev = all.get(0);

    for (int i = 1; i < all.size(); i++) {
        Interval curr = all.get(i);
        if (prev.end < curr.start) {
            // Gap between prev end and curr start = free time
            result.add(new Interval(prev.end, curr.start));
            prev = curr;
        } else {
            // Merge (extend prev)
            prev = new Interval(prev.start, Math.max(prev.end, curr.end));
        }
    }
    return result;
}
```

---

## Worked Example 2: Minimum Meeting Rooms

```java
public int minMeetingRooms(int[][] intervals) {
    int n = intervals.length;
    int[] starts = new int[n], ends = new int[n];
    for (int i = 0; i < n; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }
    Arrays.sort(starts);
    Arrays.sort(ends);

    int rooms = 0, endIdx = 0;
    for (int i = 0; i < n; i++) {
        if (starts[i] < ends[endIdx]) {
            rooms++; // need a new room
        } else {
            endIdx++; // a meeting ended, reuse the room
        }
    }
    return rooms;
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Key Idea |
|---|---|---|
| 228 | [Summary Ranges](https://leetcode.com/problems/summary-ranges/) | Group consecutive |
| 252 | [Meeting Rooms](https://leetcode.com/problems/meeting-rooms/) | Any overlap? |

### 🟡 Medium
| # | Problem | Key Idea |
|---|---|---|
| 56 | [Merge Intervals](https://leetcode.com/problems/merge-intervals/) | Sort + merge |
| 57 | [Insert Interval](https://leetcode.com/problems/insert-interval/) | 3-phase insert |
| 253 | [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/) | Min heap end times |
| 435 | [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) | Sort by end, greedy |
| 452 | [Minimum Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/) | Sort by end |
| 1288 | [Remove Covered Intervals](https://leetcode.com/problems/remove-covered-intervals/) | Sort + coverage check |

### 🔴 Hard
| # | Problem | Key Idea |
|---|---|---|
| 759 | [Employee Free Time](https://leetcode.com/problems/employee-free-time/) | Flatten + merge |
| 1235 | [Maximum Profit in Job Scheduling](https://leetcode.com/problems/maximum-profit-in-job-scheduling/) | Sort + DP + binary search |
