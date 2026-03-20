---
id: java-string-rotation
title: Java String Rotation Programming
sidebar_label: String Rotation
description: "Programming-focused Java interview problems on string rotation checks and transformations."
tags: [java, interview, strings, algorithms]
---

# Java String Rotation Interview Questions & Answers

This guide covers logic and code for checking and performing string rotations (left and right) in Java.

## 1. How to check if one string is a rotation of another?
The simplest logic to check if `String B` is a rotation of `String A` is to concatenate `A` with itself and check if `B` is a substring of the result.

### The Logic:
1.  Concatenate the original string with itself: `concatenated = original + original`.
2.  Check if the target string is a substring: `concatenated.contains(target)`.
3.  **Constraint:** Both strings must be of the same length.

**Example:**
* Original: `DECODE`
* Rotated (Left 2): `CODEDE`
* Concatenated: `DECODE` + `DECODE` = `DECODEDECODE`
* Result: `DECODEDECODE` contains `CODEDE` → **True**.

## 2. Left Rotation Logic
Left rotation moves characters from the beginning of the string to the end.

**Formula:**
`Result = original.substring(r) + original.substring(0, r)`
*(where `r` is the number of characters to rotate)*

**Example (Rotate Left by 2):**
* String: `DECODE` (Length 6, r = 2)
* `substring(2)` → `CODE`
* `substring(0, 2)` → `DE`
* **Result:** `CODEDE`

## 3. Right Rotation Logic
Right rotation moves characters from the end of the string to the front. To simplify this, we calculate a "partition" point.

**Logic:**
1.  **Partition (P):** `length - r`
2.  **Formula:** `Result = original.substring(P) + original.substring(0, P)`

**Example (Rotate Right by 2):**
* String: `DECODE` (Length 6, r = 2)
* **Partition (P):** `6 - 2 = 4`
* `substring(4)` → `DE`
* `substring(0, 4)` → `DECO`
* **Result:** `DEDECO`


## Java Implementation

```java
public class StringRotation {
    public static void main(String[] args) {
        String str = "DECODE";
        int r = 2;

        System.out.println("Left Rotation: " + leftRotate(str, r));
        System.out.println("Right Rotation: " + rightRotate(str, r));
    }

    public static String leftRotate(String str, int r) {
        return str.substring(r) + str.substring(0, r);
    }

    public static String rightRotate(String str, int r) {
        int partition = str.length() - r;
        return str.substring(partition) + str.substring(0, partition);
    }
}
