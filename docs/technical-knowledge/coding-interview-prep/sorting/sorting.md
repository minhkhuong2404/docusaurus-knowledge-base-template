---
id: sorting
title: Sorting
sidebar_position: 19
description: All major sorting algorithms implemented in Java with complexity analysis
---

# 🔀 Sorting

## Concept

Sorting is the foundation of many algorithmic patterns — binary search requires sorted input, greedy interval algorithms sort by start/end, and many problems reduce to "sort then scan".

Understanding how to implement and choose the right sorting algorithm is a core interview skill.

---

## Sorting Algorithm Comparison

| Algorithm | Best | Average | Worst | Space | Stable? |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ |
| Counting Sort | O(n+k) | O(n+k) | O(n+k) | O(k) | ✅ |
| Radix Sort | O(nk) | O(nk) | O(nk) | O(n+k) | ✅ |

> Java's `Arrays.sort()` uses **Dual-Pivot Quicksort** for primitives and **TimSort** (merge + insertion) for objects.

---

## Merge Sort

**Divide and conquer**: split in half, sort each half, merge back.

```java
public void mergeSort(int[] arr, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;

    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
}

private void merge(int[] arr, int left, int mid, int right) {
    int[] temp = Arrays.copyOfRange(arr, left, right + 1);
    int i = 0, j = mid - left + 1, k = left;

    while (i <= mid - left && j <= right - left) {
        if (temp[i] <= temp[j]) arr[k++] = temp[i++];
        else arr[k++] = temp[j++];
    }
    while (i <= mid - left) arr[k++] = temp[i++];
    while (j <= right - left) arr[k++] = temp[j++];
}
```

---

## Quick Sort

**Partition** around a pivot, recursively sort sub-arrays.

```java
public void quickSort(int[] arr, int low, int high) {
    if (low >= high) return;
    int pivot = partition(arr, low, high);
    quickSort(arr, low, pivot - 1);
    quickSort(arr, pivot + 1, high);
}

private int partition(int[] arr, int low, int high) {
    int pivot = arr[high];  // choose last element as pivot
    int i = low - 1;

    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
    }
    int tmp = arr[i+1]; arr[i+1] = arr[high]; arr[high] = tmp;
    return i + 1;
}
```

**Avoiding worst case O(n²)**: use random pivot selection:
```java
int randomIdx = low + (int)(Math.random() * (high - low + 1));
int tmp = arr[randomIdx]; arr[randomIdx] = arr[high]; arr[high] = tmp;
```

---

## Counting Sort

Works when values are in a known, small range [0, k].

```java
public int[] countingSort(int[] arr, int maxVal) {
    int[] count = new int[maxVal + 1];
    for (int n : arr) count[n]++;

    // Accumulate counts (prefix sum for stability)
    for (int i = 1; i <= maxVal; i++) count[i] += count[i-1];

    int[] result = new int[arr.length];
    for (int i = arr.length - 1; i >= 0; i--) {
        result[--count[arr[i]]] = arr[i];
    }
    return result;
}
```

---

## Interview Application: Sort Colors (Dutch National Flag)

**Problem**: Sort an array containing only 0, 1, 2 in-place in one pass.

```java
public void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;

    while (mid <= high) {
        if (nums[mid] == 0) {
            swap(nums, low++, mid++);
        } else if (nums[mid] == 1) {
            mid++;
        } else { // nums[mid] == 2
            swap(nums, mid, high--);
            // Don't increment mid! The swapped value is unexamined
        }
    }
}
```

**Invariant**: `[0..low-1]` = 0s, `[low..mid-1]` = 1s, `[high+1..n-1]` = 2s

---

## Custom Comparator Patterns (Java)

```java
// Sort intervals by start time
Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

// Sort strings by length, then lexicographically
Arrays.sort(words, (a, b) -> a.length() != b.length()
    ? a.length() - b.length()
    : a.compareTo(b));

// Sort by absolute value
Arrays.sort(arr, (a, b) -> Math.abs(a) - Math.abs(b));

// Sort 2D array by second column descending
Arrays.sort(matrix, (a, b) -> b[1] - a[1]);

// Sort strings to form largest number
Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Key Idea |
|---|---|---|
| 217 | [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) | Sort then check adjacent |
| 242 | [Valid Anagram](https://leetcode.com/problems/valid-anagram/) | Sort strings |
| 976 | [Largest Perimeter Triangle](https://leetcode.com/problems/largest-perimeter-triangle/) | Sort + greedy |

### 🟡 Medium
| # | Problem | Key Idea |
|---|---|---|
| 56 | [Merge Intervals](https://leetcode.com/problems/merge-intervals/) | Sort by start |
| 75 | [Sort Colors](https://leetcode.com/problems/sort-colors/) | Dutch National Flag |
| 148 | [Sort List](https://leetcode.com/problems/sort-list/) | Merge sort on linked list |
| 179 | [Largest Number](https://leetcode.com/problems/largest-number/) | Custom comparator |
| 252 | [Meeting Rooms](https://leetcode.com/problems/meeting-rooms/) | Sort by start |
| 274 | [H-Index](https://leetcode.com/problems/h-index/) | Sort descending |
| 912 | [Sort an Array](https://leetcode.com/problems/sort-an-array/) | Implement merge/quick sort |

### 🔴 Hard
| # | Problem | Key Idea |
|---|---|---|
| 315 | [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | Merge sort with index tracking |
| 493 | [Reverse Pairs](https://leetcode.com/problems/reverse-pairs/) | Merge sort |
