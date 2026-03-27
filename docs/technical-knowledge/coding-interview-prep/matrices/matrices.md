---
id: matrices
title: Matrices (2D Arrays)
sidebar_position: 21
description: Grid traversal, rotation, spiral order, and matrix-based DP patterns
---

# 🔲 Matrices (2D Arrays)

## Concept

A **matrix** is a 2D array `grid[row][col]`. Many real-world problems model data as a grid — from game boards to image processing to pathfinding.

Key operations:
- **Traversal**: row-by-row, column-by-column, diagonal, spiral
- **In-place rotation/reflection**
- **Multi-source BFS/DFS on grid**
- **Matrix DP** (paths, coins, squares)

---

## Java Fundamentals

```java
int[][] grid = new int[m][n];

// Access
grid[row][col]

// Dimensions
int rows = grid.length;
int cols = grid[0].length;

// Four directions
int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};

// Eight directions (including diagonals)
int[][] dirs8 = {{-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}};

// Bounds check
boolean inBounds(int r, int c, int m, int n) {
    return r >= 0 && r < m && c >= 0 && c < n;
}
```

---

## Pattern 1: Rotate Image 90° Clockwise

**Two-step in-place**: Transpose → Reverse each row.

```java
public void rotate(int[][] matrix) {
    int n = matrix.length;

    // Step 1: Transpose (swap [i][j] with [j][i])
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            int tmp = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = tmp;
        }
    }

    // Step 2: Reverse each row
    for (int[] row : matrix) {
        int left = 0, right = row.length - 1;
        while (left < right) {
            int tmp = row[left]; row[left++] = row[right]; row[right--] = tmp;
        }
    }
}
```

**Rotation guide**:
- 90° clockwise = Transpose + reverse rows
- 90° counter-clockwise = Transpose + reverse columns
- 180° = reverse each row + reverse each column

---

## Pattern 2: Spiral Order

```java
public List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> result = new ArrayList<>();
    int top = 0, bottom = matrix.length - 1;
    int left = 0, right = matrix[0].length - 1;

    while (top <= bottom && left <= right) {
        // → right
        for (int c = left; c <= right; c++) result.add(matrix[top][c]);
        top++;

        // ↓ down
        for (int r = top; r <= bottom; r++) result.add(matrix[r][right]);
        right--;

        // ← left
        if (top <= bottom) {
            for (int c = right; c >= left; c--) result.add(matrix[bottom][c]);
            bottom--;
        }

        // ↑ up
        if (left <= right) {
            for (int r = bottom; r >= top; r--) result.add(matrix[r][left]);
            left++;
        }
    }
    return result;
}
```

---

## Pattern 3: Set Matrix Zeroes (In-Place)

```java
public void setZeroes(int[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    boolean firstRowZero = false, firstColZero = false;

    // Check if first row/col themselves need zeroing
    for (int j = 0; j < n; j++) if (matrix[0][j] == 0) firstRowZero = true;
    for (int i = 0; i < m; i++) if (matrix[i][0] == 0) firstColZero = true;

    // Use first row and column as flags
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            if (matrix[i][j] == 0) {
                matrix[i][0] = 0; // flag row
                matrix[0][j] = 0; // flag col
            }
        }
    }

    // Zero out based on flags
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            if (matrix[i][0] == 0 || matrix[0][j] == 0)
                matrix[i][j] = 0;

    if (firstRowZero) Arrays.fill(matrix[0], 0);
    if (firstColZero) for (int i = 0; i < m; i++) matrix[i][0] = 0;
}
```

---

## Pattern 4: Matrix DP — Unique Paths

```java
public int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];
    // First row and column have exactly 1 path each
    for (int i = 0; i < m; i++) dp[i][0] = 1;
    for (int j = 0; j < n; j++) dp[0][j] = 1;

    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[i][j] = dp[i-1][j] + dp[i][j-1]; // from top or left

    return dp[m-1][n-1];
}
```

---

## Pattern 5: Maximal Square

```java
public int maximalSquare(char[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    int[][] dp = new int[m][n]; // dp[i][j] = side length of largest square ending here
    int maxSide = 0;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (matrix[i][j] == '1') {
                if (i == 0 || j == 0) {
                    dp[i][j] = 1;
                } else {
                    dp[i][j] = 1 + Math.min(dp[i-1][j], Math.min(dp[i][j-1], dp[i-1][j-1]));
                }
                maxSide = Math.max(maxSide, dp[i][j]);
            }
        }
    }
    return maxSide * maxSide;
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Pattern |
|---|---|---|
| 566 | [Reshape the Matrix](https://leetcode.com/problems/reshape-the-matrix/) | Index mapping |
| 832 | [Flipping an Image](https://leetcode.com/problems/flipping-an-image/) | Row transform |

### 🟡 Medium
| # | Problem | Pattern |
|---|---|---|
| 48 | [Rotate Image](https://leetcode.com/problems/rotate-image/) | Transpose + reverse |
| 54 | [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/) | Layer peeling |
| 59 | [Spiral Matrix II](https://leetcode.com/problems/spiral-matrix-ii/) | Fill in spiral |
| 62 | [Unique Paths](https://leetcode.com/problems/unique-paths/) | Matrix DP |
| 64 | [Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/) | Matrix DP |
| 73 | [Set Matrix Zeroes](https://leetcode.com/problems/set-matrix-zeroes/) | In-place flags |
| 240 | [Search a 2D Matrix II](https://leetcode.com/problems/search-a-2d-matrix-ii/) | Staircase search |
| 289 | [Game of Life](https://leetcode.com/problems/game-of-life/) | In-place encoding |
| 542 | [01 Matrix](https://leetcode.com/problems/01-matrix/) | Multi-source BFS |

### 🔴 Hard
| # | Problem | Pattern |
|---|---|---|
| 85 | [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/) | Histogram + stack |
| 221 | [Maximal Square](https://leetcode.com/problems/maximal-square/) | Square DP |
| 329 | [Longest Increasing Path in Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) | DFS + memo |
