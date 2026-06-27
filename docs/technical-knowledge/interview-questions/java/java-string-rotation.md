---
id: java-string-rotation
title: Java String Rotation Programming
sidebar_label: String Rotation
description: "Programming-focused Java interview problems on string rotation checks and transformations."
tags: [java, interview, strings, algorithms]
---

# Java String Rotation Interview Questions & Answers

This guide covers logic and code for checking and performing string rotations in Java, a common interview coding problem.

## 1. How to check if one string is a rotation of another?

The elegant solution uses the **concatenation trick**: if B is a rotation of A, then B must be a substring of A+A.

### The Logic
1. **Pre-check:** Both strings must have the **same length** (rotations don't change length).
2. Concatenate the original with itself: `concatenated = A + A`
3. Check if the target is a substring: `concatenated.contains(B)`

### Why this works
A rotation is just moving characters from one end to the other. Concatenating the string with itself creates a "window" that contains ALL possible rotations:

```
Original:     "DECODE"
Concatenated: "DECODEDECODE"
                ↓               ↓
Contains:     "DECODE"        (rotation by 0)
               "ECODED"       (rotation by 1)
                "CODEDE"      (rotation by 2)
                 "ODEDEC"     (rotation by 3)
                  "DEDECO"    (rotation by 4)
                   "DECODE"   (rotation by 5 = back to start)
```

### Implementation
```java
public static boolean isRotation(String original, String target) {
    if (original == null || target == null) return false;
    if (original.length() != target.length()) return false;
    if (original.isEmpty()) return true; // Empty strings are rotations of each other
    
    String concatenated = original + original;
    return concatenated.contains(target);
}
```

### Complexity Analysis
| Metric | Value |
|:-------|:------|
| **Time** | O(n) — `String.contains()` uses an optimized algorithm |
| **Space** | O(n) — for the concatenated string |

**Alternative O(1) space approach:** Use two-pointer (Rabin-Karp or manual rotation check), but the concatenation approach is preferred in interviews for its elegance and simplicity.

## 2. Left Rotation Logic

Left rotation moves characters from the **beginning** to the **end**.

```
Original:    D E C O D E    (rotate left by 2)
             └─┘ → moved to end
Result:      C O D E D E
```

**Formula:** `result = str.substring(r) + str.substring(0, r)`

```java
public static String leftRotate(String str, int r) {
    if (str == null || str.isEmpty()) return str;
    r = r % str.length(); // Handle rotation > string length
    return str.substring(r) + str.substring(0, r);
}
```

**Edge case handling:** If `r > str.length()`, use modulo. Rotating by 8 positions on a 6-character string is the same as rotating by 2 (`8 % 6 = 2`).

## 3. Right Rotation Logic

Right rotation moves characters from the **end** to the **front**.

```
Original:    D E C O D E    (rotate right by 2)
                     └─┘ → moved to front
Result:      D E D E C O
```

**Logic:**
1. Calculate the partition point: `P = length - r`
2. Apply the same split: `result = str.substring(P) + str.substring(0, P)`

```java
public static String rightRotate(String str, int r) {
    if (str == null || str.isEmpty()) return str;
    r = r % str.length(); // Handle rotation > string length
    int partition = str.length() - r;
    return str.substring(partition) + str.substring(0, partition);
}
```

### Insight: Right rotation is just a left rotation in disguise
```java
// Right rotate by r = Left rotate by (length - r)
rightRotate(str, r) == leftRotate(str, str.length() - r)
```

## 4. Complete Java Implementation with Edge Cases

```java
public class StringRotation {

    public static void main(String[] args) {
        String str = "DECODE";
        int r = 2;

        System.out.println("Original:       " + str);
        System.out.println("Left Rotation:  " + leftRotate(str, r));   // CODEDE
        System.out.println("Right Rotation: " + rightRotate(str, r));  // DEDECO

        // Edge cases
        System.out.println("Rotate by 0:    " + leftRotate(str, 0));   // DECODE
        System.out.println("Rotate by len:  " + leftRotate(str, 6));   // DECODE
        System.out.println("Rotate > len:   " + leftRotate(str, 8));   // CODEDE (8%6=2)
        
        // Rotation check
        System.out.println("Is rotation:    " + isRotation("DECODE", "CODEDE")); // true
        System.out.println("Not rotation:   " + isRotation("DECODE", "ABCDEF")); // false
    }

    public static String leftRotate(String str, int r) {
        if (str == null || str.isEmpty()) return str;
        r = r % str.length();
        if (r == 0) return str;
        return str.substring(r) + str.substring(0, r);
    }

    public static String rightRotate(String str, int r) {
        if (str == null || str.isEmpty()) return str;
        r = r % str.length();
        if (r == 0) return str;
        int partition = str.length() - r;
        return str.substring(partition) + str.substring(0, partition);
    }

    public static boolean isRotation(String original, String target) {
        if (original == null || target == null) return false;
        if (original.length() != target.length()) return false;
        if (original.isEmpty()) return true;
        return (original + original).contains(target);
    }
}
```

## 5. Array Rotation (Follow-up)

The same logic applies to array rotation, but arrays are mutable so we can do it **in-place** using the **reversal algorithm** (O(1) extra space):

```java
// In-place left rotation using three reversals
public static void leftRotateArray(int[] arr, int r) {
    r = r % arr.length;
    reverse(arr, 0, r - 1);           // Reverse first r elements
    reverse(arr, r, arr.length - 1);  // Reverse remaining elements
    reverse(arr, 0, arr.length - 1);  // Reverse entire array
}

// Example: [1,2,3,4,5], rotate left by 2
// Step 1: [2,1, 3,4,5]   (reverse [0..1])
// Step 2: [2,1, 5,4,3]   (reverse [2..4])
// Step 3: [3,4,5, 1,2]   (reverse [0..4]) → Done!

private static void reverse(int[] arr, int start, int end) {
    while (start < end) {
        int temp = arr[start];
        arr[start++] = arr[end];
        arr[end--] = temp;
    }
}
```

| Metric | String rotation | Array reversal algorithm |
|:-------|:---------------|:------------------------|
| **Time** | O(n) | O(n) |
| **Space** | O(n) — new string created | **O(1)** — in-place |

---
