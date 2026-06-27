export interface LeetCodeProblem {
  id: string;
  title: string;
  url: string;
  difficulty: 'easy' | 'medium' | 'hard';
  keyIdea: string;
  topic: string;
}

export const leetcodeProblems: LeetCodeProblem[] = [
  {
    "id": "1",
    "title": "Two Sum",
    "url": "https://leetcode.com/problems/two-sum/",
    "difficulty": "easy",
    "keyIdea": "HashMap complement lookup",
    "topic": "Array"
  },
  {
    "id": "121",
    "title": "Best Time to Buy and Sell Stock",
    "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    "difficulty": "easy",
    "keyIdea": "Track running min",
    "topic": "Array"
  },
  {
    "id": "15",
    "title": "3Sum",
    "url": "https://leetcode.com/problems/3sum/",
    "difficulty": "medium",
    "keyIdea": "Sort + two pointers",
    "topic": "Array"
  },
  {
    "id": "189",
    "title": "Rotate Array",
    "url": "https://leetcode.com/problems/rotate-array/",
    "difficulty": "medium",
    "keyIdea": "Reverse 3 times",
    "topic": "Array"
  },
  {
    "id": "217",
    "title": "Contains Duplicate",
    "url": "https://leetcode.com/problems/contains-duplicate/",
    "difficulty": "easy",
    "keyIdea": "HashSet",
    "topic": "Array"
  },
  {
    "id": "238",
    "title": "Product of Array Except Self",
    "url": "https://leetcode.com/problems/product-of-array-except-self/",
    "difficulty": "easy",
    "keyIdea": "Left/right pass",
    "topic": "Array"
  },
  {
    "id": "26",
    "title": "Remove Duplicates from Sorted Array",
    "url": "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
    "difficulty": "easy",
    "keyIdea": "Two pointers, in-place",
    "topic": "Array"
  },
  {
    "id": "27",
    "title": "Remove Element",
    "url": "https://leetcode.com/problems/remove-element/",
    "difficulty": "easy",
    "keyIdea": "Overwrite with valid elements",
    "topic": "Array"
  },
  {
    "id": "283",
    "title": "Move Zeroes",
    "url": "https://leetcode.com/problems/move-zeroes/",
    "difficulty": "easy",
    "keyIdea": "Two pointers",
    "topic": "Array"
  },
  {
    "id": "287",
    "title": "Find the Duplicate Number",
    "url": "https://leetcode.com/problems/find-the-duplicate-number/",
    "difficulty": "medium",
    "keyIdea": "Floyd's / negation",
    "topic": "Array"
  },
  {
    "id": "31",
    "title": "Next Permutation",
    "url": "https://leetcode.com/problems/next-permutation/",
    "difficulty": "medium",
    "keyIdea": "Find dip, swap, reverse",
    "topic": "Array"
  },
  {
    "id": "41",
    "title": "First Missing Positive",
    "url": "https://leetcode.com/problems/first-missing-positive/",
    "difficulty": "hard",
    "keyIdea": "Cyclic sort / swap to correct index",
    "topic": "Array"
  },
  {
    "id": "442",
    "title": "Find All Duplicates in an Array",
    "url": "https://leetcode.com/problems/find-all-duplicates-in-an-array/",
    "difficulty": "medium",
    "keyIdea": "Negation trick",
    "topic": "Array"
  },
  {
    "id": "448",
    "title": "Find All Numbers Disappeared in an Array",
    "url": "https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/",
    "difficulty": "easy",
    "keyIdea": "Mark visited with negation",
    "topic": "Array"
  },
  {
    "id": "48",
    "title": "Rotate Image",
    "url": "https://leetcode.com/problems/rotate-image/",
    "difficulty": "medium",
    "keyIdea": "Transpose + reverse",
    "topic": "Array"
  },
  {
    "id": "54",
    "title": "Spiral Matrix",
    "url": "https://leetcode.com/problems/spiral-matrix/",
    "difficulty": "medium",
    "keyIdea": "Layer peeling",
    "topic": "Array"
  },
  {
    "id": "73",
    "title": "Set Matrix Zeroes",
    "url": "https://leetcode.com/problems/set-matrix-zeroes/",
    "difficulty": "medium",
    "keyIdea": "Use first row/col as flags",
    "topic": "Array"
  },
  {
    "id": "84",
    "title": "Largest Rectangle in Histogram",
    "url": "https://leetcode.com/problems/largest-rectangle-in-histogram/",
    "difficulty": "hard",
    "keyIdea": "Monotonic stack",
    "topic": "Array"
  },
  {
    "id": "85",
    "title": "Maximal Rectangle",
    "url": "https://leetcode.com/problems/maximal-rectangle/",
    "difficulty": "hard",
    "keyIdea": "Build histogram row by row",
    "topic": "Array"
  },
  {
    "id": "102",
    "title": "Binary Tree Level Order Traversal",
    "url": "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    "difficulty": "medium",
    "keyIdea": "Classic BFS",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "111",
    "title": "Minimum Depth of Binary Tree",
    "url": "https://leetcode.com/problems/minimum-depth-of-binary-tree/",
    "difficulty": "easy",
    "keyIdea": "BFS \u2014 first leaf",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "1162",
    "title": "As Far from Land as Possible",
    "url": "https://leetcode.com/problems/as-far-from-land-as-possible/",
    "difficulty": "medium",
    "keyIdea": "Multi-source",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "126",
    "title": "Word Ladder II",
    "url": "https://leetcode.com/problems/word-ladder-ii/",
    "difficulty": "hard",
    "keyIdea": "BFS + backtrack all paths",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "127",
    "title": "Word Ladder",
    "url": "https://leetcode.com/problems/word-ladder/",
    "difficulty": "medium",
    "keyIdea": "BFS on word graph",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "200",
    "title": "Number of Islands",
    "url": "https://leetcode.com/problems/number-of-islands/",
    "difficulty": "medium",
    "keyIdea": "Grid BFS/DFS",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "226",
    "title": "Invert Binary Tree",
    "url": "https://leetcode.com/problems/invert-binary-tree/",
    "difficulty": "easy",
    "keyIdea": "BFS swap",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "286",
    "title": "Walls and Gates",
    "url": "https://leetcode.com/problems/walls-and-gates/",
    "difficulty": "medium",
    "keyIdea": "Multi-source",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "317",
    "title": "Shortest Distance from All Buildings",
    "url": "https://leetcode.com/problems/shortest-distance-from-all-buildings/",
    "difficulty": "hard",
    "keyIdea": "Multi-source + sum",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "542",
    "title": "01 Matrix",
    "url": "https://leetcode.com/problems/01-matrix/",
    "difficulty": "medium",
    "keyIdea": "Multi-source",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "637",
    "title": "Average of Levels in Binary Tree",
    "url": "https://leetcode.com/problems/average-of-levels-in-binary-tree/",
    "difficulty": "easy",
    "keyIdea": "Level BFS",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "752",
    "title": "Open the Lock",
    "url": "https://leetcode.com/problems/open-the-lock/",
    "difficulty": "medium",
    "keyIdea": "State BFS",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "847",
    "title": "Shortest Path Visiting All Nodes",
    "url": "https://leetcode.com/problems/shortest-path-visiting-all-nodes/",
    "difficulty": "hard",
    "keyIdea": "BFS + bitmask state",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "994",
    "title": "Rotting Oranges",
    "url": "https://leetcode.com/problems/rotting-oranges/",
    "difficulty": "medium",
    "keyIdea": "Multi-source",
    "topic": "BFS (Breadth-First Search)"
  },
  {
    "id": "131",
    "title": "Palindrome Partitioning",
    "url": "https://leetcode.com/problems/palindrome-partitioning/",
    "difficulty": "medium",
    "keyIdea": "Partition + palindrome",
    "topic": "Backtracking"
  },
  {
    "id": "17",
    "title": "Letter Combinations of a Phone Number",
    "url": "https://leetcode.com/problems/letter-combinations-of-a-phone-number/",
    "difficulty": "medium",
    "keyIdea": "Combinations",
    "topic": "Backtracking"
  },
  {
    "id": "22",
    "title": "Generate Parentheses",
    "url": "https://leetcode.com/problems/generate-parentheses/",
    "difficulty": "medium",
    "keyIdea": "Constrained build",
    "topic": "Backtracking"
  },
  {
    "id": "37",
    "title": "Sudoku Solver",
    "url": "https://leetcode.com/problems/sudoku-solver/",
    "difficulty": "hard",
    "keyIdea": "Constraint satisfaction",
    "topic": "Backtracking"
  },
  {
    "id": "39",
    "title": "Combination Sum",
    "url": "https://leetcode.com/problems/combination-sum/",
    "difficulty": "medium",
    "keyIdea": "Unlimited reuse",
    "topic": "Backtracking"
  },
  {
    "id": "40",
    "title": "Combination Sum II",
    "url": "https://leetcode.com/problems/combination-sum-ii/",
    "difficulty": "medium",
    "keyIdea": "Deduplicate",
    "topic": "Backtracking"
  },
  {
    "id": "401",
    "title": "Binary Watch",
    "url": "https://leetcode.com/problems/binary-watch/",
    "difficulty": "easy",
    "keyIdea": "Enumerate subsets",
    "topic": "Backtracking"
  },
  {
    "id": "46",
    "title": "Permutations",
    "url": "https://leetcode.com/problems/permutations/",
    "difficulty": "medium",
    "keyIdea": "Classic perms",
    "topic": "Backtracking"
  },
  {
    "id": "47",
    "title": "Permutations II",
    "url": "https://leetcode.com/problems/permutations-ii/",
    "difficulty": "medium",
    "keyIdea": "Dedup perms",
    "topic": "Backtracking"
  },
  {
    "id": "51",
    "title": "N-Queens",
    "url": "https://leetcode.com/problems/n-queens/",
    "difficulty": "hard",
    "keyIdea": "Classic N-Queens",
    "topic": "Backtracking"
  },
  {
    "id": "52",
    "title": "N-Queens II",
    "url": "https://leetcode.com/problems/n-queens-ii/",
    "difficulty": "hard",
    "keyIdea": "Count solutions",
    "topic": "Backtracking"
  },
  {
    "id": "78",
    "title": "Subsets",
    "url": "https://leetcode.com/problems/subsets/",
    "difficulty": "medium",
    "keyIdea": "Classic subsets",
    "topic": "Backtracking"
  },
  {
    "id": "79",
    "title": "Word Search",
    "url": "https://leetcode.com/problems/word-search/",
    "difficulty": "medium",
    "keyIdea": "Grid backtrack",
    "topic": "Backtracking"
  },
  {
    "id": "90",
    "title": "Subsets II",
    "url": "https://leetcode.com/problems/subsets-ii/",
    "difficulty": "medium",
    "keyIdea": "Dedup subsets",
    "topic": "Backtracking"
  },
  {
    "id": "1011",
    "title": "Capacity To Ship Packages",
    "url": "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/",
    "difficulty": "medium",
    "keyIdea": "Answer space",
    "topic": "Binary Search"
  },
  {
    "id": "153",
    "title": "Find Minimum in Rotated Sorted Array",
    "url": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    "difficulty": "medium",
    "keyIdea": "Rotated",
    "topic": "Binary Search"
  },
  {
    "id": "162",
    "title": "Find Peak Element",
    "url": "https://leetcode.com/problems/find-peak-element/",
    "difficulty": "medium",
    "keyIdea": "Slope climbing",
    "topic": "Binary Search"
  },
  {
    "id": "278",
    "title": "First Bad Version",
    "url": "https://leetcode.com/problems/first-bad-version/",
    "difficulty": "easy",
    "keyIdea": "Left bound",
    "topic": "Binary Search"
  },
  {
    "id": "33",
    "title": "Search in Rotated Sorted Array",
    "url": "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    "difficulty": "medium",
    "keyIdea": "Rotated",
    "topic": "Binary Search"
  },
  {
    "id": "34",
    "title": "Find First and Last Position",
    "url": "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
    "difficulty": "medium",
    "keyIdea": "Left + Right bound",
    "topic": "Binary Search"
  },
  {
    "id": "35",
    "title": "Search Insert Position",
    "url": "https://leetcode.com/problems/search-insert-position/",
    "difficulty": "easy",
    "keyIdea": "Left bound",
    "topic": "Binary Search"
  },
  {
    "id": "374",
    "title": "Guess Number Higher or Lower",
    "url": "https://leetcode.com/problems/guess-number-higher-or-lower/",
    "difficulty": "easy",
    "keyIdea": "Classic",
    "topic": "Binary Search"
  },
  {
    "id": "4",
    "title": "Median of Two Sorted Arrays",
    "url": "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    "difficulty": "hard",
    "keyIdea": "Partition",
    "topic": "Binary Search"
  },
  {
    "id": "410",
    "title": "Split Array Largest Sum",
    "url": "https://leetcode.com/problems/split-array-largest-sum/",
    "difficulty": "hard",
    "keyIdea": "Answer space",
    "topic": "Binary Search"
  },
  {
    "id": "540",
    "title": "Single Element in Sorted Array",
    "url": "https://leetcode.com/problems/single-element-in-a-sorted-array/",
    "difficulty": "medium",
    "keyIdea": "Parity check",
    "topic": "Binary Search"
  },
  {
    "id": "668",
    "title": "Kth Smallest Number in Multiplication Table",
    "url": "https://leetcode.com/problems/kth-smallest-number-in-multiplication-table/",
    "difficulty": "hard",
    "keyIdea": "Answer space",
    "topic": "Binary Search"
  },
  {
    "id": "69",
    "title": "Sqrt(x)",
    "url": "https://leetcode.com/problems/sqrtx/",
    "difficulty": "easy",
    "keyIdea": "Answer space",
    "topic": "Binary Search"
  },
  {
    "id": "704",
    "title": "Binary Search",
    "url": "https://leetcode.com/problems/binary-search/",
    "difficulty": "easy",
    "keyIdea": "Classic",
    "topic": "Binary Search"
  },
  {
    "id": "875",
    "title": "Koko Eating Bananas",
    "url": "https://leetcode.com/problems/koko-eating-bananas/",
    "difficulty": "medium",
    "keyIdea": "Answer space",
    "topic": "Binary Search"
  },
  {
    "id": "1178",
    "title": "Number of Valid Words for Each Puzzle",
    "url": "https://leetcode.com/problems/number-of-valid-words-for-each-puzzle/",
    "difficulty": "hard",
    "keyIdea": "Bitmask frequency",
    "topic": "Bit Manipulation"
  },
  {
    "id": "136",
    "title": "Single Number",
    "url": "https://leetcode.com/problems/single-number/",
    "difficulty": "easy",
    "keyIdea": "XOR all",
    "topic": "Bit Manipulation"
  },
  {
    "id": "137",
    "title": "Single Number II",
    "url": "https://leetcode.com/problems/single-number-ii/",
    "difficulty": "medium",
    "keyIdea": "Bit counting mod 3",
    "topic": "Bit Manipulation"
  },
  {
    "id": "190",
    "title": "Reverse Bits",
    "url": "https://leetcode.com/problems/reverse-bits/",
    "difficulty": "easy",
    "keyIdea": "Shift + OR",
    "topic": "Bit Manipulation"
  },
  {
    "id": "191",
    "title": "Number of 1 Bits",
    "url": "https://leetcode.com/problems/number-of-1-bits/",
    "difficulty": "easy",
    "keyIdea": "`n & (n-1)`",
    "topic": "Bit Manipulation"
  },
  {
    "id": "201",
    "title": "Bitwise AND of Numbers Range",
    "url": "https://leetcode.com/problems/bitwise-and-of-numbers-range/",
    "difficulty": "medium",
    "keyIdea": "Common prefix",
    "topic": "Bit Manipulation"
  },
  {
    "id": "231",
    "title": "Power of Two",
    "url": "https://leetcode.com/problems/power-of-two/",
    "difficulty": "easy",
    "keyIdea": "`n & (n-1) == 0`",
    "topic": "Bit Manipulation"
  },
  {
    "id": "260",
    "title": "Single Number III",
    "url": "https://leetcode.com/problems/single-number-iii/",
    "difficulty": "medium",
    "keyIdea": "XOR + split by diffBit",
    "topic": "Bit Manipulation"
  },
  {
    "id": "338",
    "title": "Counting Bits",
    "url": "https://leetcode.com/problems/counting-bits/",
    "difficulty": "easy",
    "keyIdea": "DP + lowest bit",
    "topic": "Bit Manipulation"
  },
  {
    "id": "371",
    "title": "Sum of Two Integers",
    "url": "https://leetcode.com/problems/sum-of-two-integers/",
    "difficulty": "medium",
    "keyIdea": "XOR + carry",
    "topic": "Bit Manipulation"
  },
  {
    "id": "476",
    "title": "Number Complement",
    "url": "https://leetcode.com/problems/number-complement/",
    "difficulty": "medium",
    "keyIdea": "XOR with mask",
    "topic": "Bit Manipulation"
  },
  {
    "id": "847",
    "title": "Shortest Path Visiting All Nodes",
    "url": "https://leetcode.com/problems/shortest-path-visiting-all-nodes/",
    "difficulty": "hard",
    "keyIdea": "BFS + bitmask state",
    "topic": "Bit Manipulation"
  },
  {
    "id": "1020",
    "title": "Number of Enclaves",
    "url": "https://leetcode.com/problems/number-of-enclaves/",
    "difficulty": "medium",
    "keyIdea": "Border DFS",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "104",
    "title": "Maximum Depth of Binary Tree",
    "url": "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    "difficulty": "easy",
    "keyIdea": "Tree DFS",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "112",
    "title": "Path Sum",
    "url": "https://leetcode.com/problems/path-sum/",
    "difficulty": "easy",
    "keyIdea": "Tree DFS",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "200",
    "title": "Number of Islands",
    "url": "https://leetcode.com/problems/number-of-islands/",
    "difficulty": "medium",
    "keyIdea": "Grid DFS",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "207",
    "title": "Course Schedule",
    "url": "https://leetcode.com/problems/course-schedule/",
    "difficulty": "medium",
    "keyIdea": "Cycle detection",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "210",
    "title": "Course Schedule II",
    "url": "https://leetcode.com/problems/course-schedule-ii/",
    "difficulty": "medium",
    "keyIdea": "Topo sort",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "329",
    "title": "Longest Increasing Path in Matrix",
    "url": "https://leetcode.com/problems/longest-increasing-path-in-a-matrix/",
    "difficulty": "hard",
    "keyIdea": "DFS + memoization",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "417",
    "title": "Pacific Atlantic Water Flow",
    "url": "https://leetcode.com/problems/pacific-atlantic-water-flow/",
    "difficulty": "medium",
    "keyIdea": "Reverse DFS",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "547",
    "title": "Number of Provinces",
    "url": "https://leetcode.com/problems/number-of-provinces/",
    "difficulty": "medium",
    "keyIdea": "Connected components",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "695",
    "title": "Max Area of Island",
    "url": "https://leetcode.com/problems/max-area-of-island/",
    "difficulty": "medium",
    "keyIdea": "Grid DFS + area",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "733",
    "title": "Flood Fill",
    "url": "https://leetcode.com/problems/flood-fill/",
    "difficulty": "easy",
    "keyIdea": "Grid DFS",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "827",
    "title": "Making A Large Island",
    "url": "https://leetcode.com/problems/making-a-large-island/",
    "difficulty": "hard",
    "keyIdea": "Island labeling + merge",
    "topic": "DFS (Depth-First Search)"
  },
  {
    "id": "10",
    "title": "Regular Expression Matching",
    "url": "https://leetcode.com/problems/regular-expression-matching/",
    "difficulty": "hard",
    "keyIdea": "2D DP",
    "topic": "Dynamic Programming"
  },
  {
    "id": "1143",
    "title": "LCS",
    "url": "https://leetcode.com/problems/longest-common-subsequence/",
    "difficulty": "medium",
    "keyIdea": "LCS",
    "topic": "Dynamic Programming"
  },
  {
    "id": "118",
    "title": "Pascal's Triangle",
    "url": "https://leetcode.com/problems/pascals-triangle/",
    "difficulty": "easy",
    "keyIdea": "2D DP",
    "topic": "Dynamic Programming"
  },
  {
    "id": "121",
    "title": "Best Time to Buy and Sell Stock",
    "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    "difficulty": "easy",
    "keyIdea": "1D DP",
    "topic": "Dynamic Programming"
  },
  {
    "id": "1312",
    "title": "Minimum Insertion Steps to Make Palindrome",
    "url": "https://leetcode.com/problems/minimum-insertion-steps-to-make-a-string-palindrome/",
    "difficulty": "hard",
    "keyIdea": "LCS on palindrome",
    "topic": "Dynamic Programming"
  },
  {
    "id": "139",
    "title": "Word Break",
    "url": "https://leetcode.com/problems/word-break/",
    "difficulty": "medium",
    "keyIdea": "Unbounded knapsack",
    "topic": "Dynamic Programming"
  },
  {
    "id": "152",
    "title": "Maximum Product Subarray",
    "url": "https://leetcode.com/problems/maximum-product-subarray/",
    "difficulty": "medium",
    "keyIdea": "1D with min/max",
    "topic": "Dynamic Programming"
  },
  {
    "id": "198",
    "title": "House Robber",
    "url": "https://leetcode.com/problems/house-robber/",
    "difficulty": "easy",
    "keyIdea": "1D DP",
    "topic": "Dynamic Programming"
  },
  {
    "id": "213",
    "title": "House Robber II",
    "url": "https://leetcode.com/problems/house-robber-ii/",
    "difficulty": "medium",
    "keyIdea": "Circular array DP",
    "topic": "Dynamic Programming"
  },
  {
    "id": "300",
    "title": "Longest Increasing Subsequence",
    "url": "https://leetcode.com/problems/longest-increasing-subsequence/",
    "difficulty": "medium",
    "keyIdea": "1D DP / patience sort",
    "topic": "Dynamic Programming"
  },
  {
    "id": "312",
    "title": "Burst Balloons",
    "url": "https://leetcode.com/problems/burst-balloons/",
    "difficulty": "hard",
    "keyIdea": "Interval DP",
    "topic": "Dynamic Programming"
  },
  {
    "id": "322",
    "title": "Coin Change",
    "url": "https://leetcode.com/problems/coin-change/",
    "difficulty": "medium",
    "keyIdea": "Unbounded knapsack",
    "topic": "Dynamic Programming"
  },
  {
    "id": "416",
    "title": "Partition Equal Subset Sum",
    "url": "https://leetcode.com/problems/partition-equal-subset-sum/",
    "difficulty": "medium",
    "keyIdea": "0/1 Knapsack",
    "topic": "Dynamic Programming"
  },
  {
    "id": "518",
    "title": "Coin Change II",
    "url": "https://leetcode.com/problems/coin-change-ii/",
    "difficulty": "medium",
    "keyIdea": "Combinations",
    "topic": "Dynamic Programming"
  },
  {
    "id": "55",
    "title": "Jump Game",
    "url": "https://leetcode.com/problems/jump-game/",
    "difficulty": "medium",
    "keyIdea": "Greedy / DP",
    "topic": "Dynamic Programming"
  },
  {
    "id": "62",
    "title": "Unique Paths",
    "url": "https://leetcode.com/problems/unique-paths/",
    "difficulty": "medium",
    "keyIdea": "2D grid",
    "topic": "Dynamic Programming"
  },
  {
    "id": "70",
    "title": "Climbing Stairs",
    "url": "https://leetcode.com/problems/climbing-stairs/",
    "difficulty": "easy",
    "keyIdea": "1D Fibonacci",
    "topic": "Dynamic Programming"
  },
  {
    "id": "72",
    "title": "Edit Distance",
    "url": "https://leetcode.com/problems/edit-distance/",
    "difficulty": "hard",
    "keyIdea": "LCS variant",
    "topic": "Dynamic Programming"
  },
  {
    "id": "1192",
    "title": "Critical Connections in a Network",
    "url": "https://leetcode.com/problems/critical-connections-in-a-network/",
    "difficulty": "hard",
    "keyIdea": "Tarjan's bridges",
    "topic": "Graph"
  },
  {
    "id": "133",
    "title": "Clone Graph",
    "url": "https://leetcode.com/problems/clone-graph/",
    "difficulty": "medium",
    "keyIdea": "DFS + HashMap",
    "topic": "Graph"
  },
  {
    "id": "207",
    "title": "Course Schedule",
    "url": "https://leetcode.com/problems/course-schedule/",
    "difficulty": "medium",
    "keyIdea": "Topo / cycle detect",
    "topic": "Graph"
  },
  {
    "id": "210",
    "title": "Course Schedule II",
    "url": "https://leetcode.com/problems/course-schedule-ii/",
    "difficulty": "medium",
    "keyIdea": "Kahn's topo sort",
    "topic": "Graph"
  },
  {
    "id": "269",
    "title": "Alien Dictionary",
    "url": "https://leetcode.com/problems/alien-dictionary/",
    "difficulty": "hard",
    "keyIdea": "Topo sort",
    "topic": "Graph"
  },
  {
    "id": "310",
    "title": "Minimum Height Trees",
    "url": "https://leetcode.com/problems/minimum-height-trees/",
    "difficulty": "medium",
    "keyIdea": "Trim leaves (topo)",
    "topic": "Graph"
  },
  {
    "id": "323",
    "title": "Number of Connected Components",
    "url": "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/",
    "difficulty": "medium",
    "keyIdea": "DFS / Union-Find",
    "topic": "Graph"
  },
  {
    "id": "332",
    "title": "Reconstruct Itinerary",
    "url": "https://leetcode.com/problems/reconstruct-itinerary/",
    "difficulty": "hard",
    "keyIdea": "Hierholzer's Euler path",
    "topic": "Graph"
  },
  {
    "id": "684",
    "title": "Redundant Connection",
    "url": "https://leetcode.com/problems/redundant-connection/",
    "difficulty": "medium",
    "keyIdea": "Union-Find",
    "topic": "Graph"
  },
  {
    "id": "743",
    "title": "Network Delay Time",
    "url": "https://leetcode.com/problems/network-delay-time/",
    "difficulty": "medium",
    "keyIdea": "Dijkstra",
    "topic": "Graph"
  },
  {
    "id": "787",
    "title": "Cheapest Flights Within K Stops",
    "url": "https://leetcode.com/problems/cheapest-flights-within-k-stops/",
    "difficulty": "hard",
    "keyIdea": "Bellman-Ford / BFS",
    "topic": "Graph"
  },
  {
    "id": "802",
    "title": "Find Eventual Safe States",
    "url": "https://leetcode.com/problems/find-eventual-safe-states/",
    "difficulty": "medium",
    "keyIdea": "Color DFS",
    "topic": "Graph"
  },
  {
    "id": "1005",
    "title": "Maximize Sum after K Negations",
    "url": "https://leetcode.com/problems/maximize-sum-of-array-after-k-negations/",
    "difficulty": "easy",
    "keyIdea": "Flip smallest negatives",
    "topic": "Greedy"
  },
  {
    "id": "134",
    "title": "Gas Station",
    "url": "https://leetcode.com/problems/gas-station/",
    "difficulty": "medium",
    "keyIdea": "Greedy reset",
    "topic": "Greedy"
  },
  {
    "id": "135",
    "title": "Candy",
    "url": "https://leetcode.com/problems/candy/",
    "difficulty": "hard",
    "keyIdea": "Two-pass distribution",
    "topic": "Greedy"
  },
  {
    "id": "330",
    "title": "Patching Array",
    "url": "https://leetcode.com/problems/patching-array/",
    "difficulty": "hard",
    "keyIdea": "Extend reachable range",
    "topic": "Greedy"
  },
  {
    "id": "435",
    "title": "Non-overlapping Intervals",
    "url": "https://leetcode.com/problems/non-overlapping-intervals/",
    "difficulty": "medium",
    "keyIdea": "Sort by end",
    "topic": "Greedy"
  },
  {
    "id": "45",
    "title": "Jump Game II",
    "url": "https://leetcode.com/problems/jump-game-ii/",
    "difficulty": "medium",
    "keyIdea": "Greedy farthest reach",
    "topic": "Greedy"
  },
  {
    "id": "452",
    "title": "Minimum Arrows to Burst Balloons",
    "url": "https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/",
    "difficulty": "medium",
    "keyIdea": "Sort by end",
    "topic": "Greedy"
  },
  {
    "id": "455",
    "title": "Assign Cookies",
    "url": "https://leetcode.com/problems/assign-cookies/",
    "difficulty": "easy",
    "keyIdea": "Match smallest sufficient cookie",
    "topic": "Greedy"
  },
  {
    "id": "502",
    "title": "IPO",
    "url": "https://leetcode.com/problems/ipo/",
    "difficulty": "hard",
    "keyIdea": "Max-heap on profits",
    "topic": "Greedy"
  },
  {
    "id": "55",
    "title": "Jump Game",
    "url": "https://leetcode.com/problems/jump-game/",
    "difficulty": "medium",
    "keyIdea": "Track max reachable",
    "topic": "Greedy"
  },
  {
    "id": "605",
    "title": "Can Place Flowers",
    "url": "https://leetcode.com/problems/can-place-flowers/",
    "difficulty": "easy",
    "keyIdea": "Greedy scan",
    "topic": "Greedy"
  },
  {
    "id": "621",
    "title": "Task Scheduler",
    "url": "https://leetcode.com/problems/task-scheduler/",
    "difficulty": "medium",
    "keyIdea": "Schedule most frequent first",
    "topic": "Greedy"
  },
  {
    "id": "763",
    "title": "Partition Labels",
    "url": "https://leetcode.com/problems/partition-labels/",
    "difficulty": "medium",
    "keyIdea": "Last occurrence tracking",
    "topic": "Greedy"
  },
  {
    "id": "860",
    "title": "Lemonade Change",
    "url": "https://leetcode.com/problems/lemonade-change/",
    "difficulty": "easy",
    "keyIdea": "Use larger bills first",
    "topic": "Greedy"
  },
  {
    "id": "1046",
    "title": "Last Stone Weight",
    "url": "https://leetcode.com/problems/last-stone-weight/",
    "difficulty": "easy",
    "keyIdea": "Max-heap",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "215",
    "title": "Kth Largest Element in an Array",
    "url": "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    "difficulty": "medium",
    "keyIdea": "Min-heap / quickselect",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "23",
    "title": "Merge K Sorted Lists",
    "url": "https://leetcode.com/problems/merge-k-lists/",
    "difficulty": "hard",
    "keyIdea": "Min-heap",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "295",
    "title": "Find Median from Data Stream",
    "url": "https://leetcode.com/problems/find-median-from-data-stream/",
    "difficulty": "hard",
    "keyIdea": "Two heaps",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "347",
    "title": "Top K Frequent Elements",
    "url": "https://leetcode.com/problems/top-k-frequent-elements/",
    "difficulty": "medium",
    "keyIdea": "Heap + frequency map",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "373",
    "title": "Find K Pairs with Smallest Sums",
    "url": "https://leetcode.com/problems/find-k-pairs-with-smallest-sums/",
    "difficulty": "medium",
    "keyIdea": "Min-heap",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "378",
    "title": "Kth Smallest in Sorted Matrix",
    "url": "https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/",
    "difficulty": "medium",
    "keyIdea": "Min-heap / binary search",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "480",
    "title": "Sliding Window Median",
    "url": "https://leetcode.com/problems/sliding-window-median/",
    "difficulty": "hard",
    "keyIdea": "Two heaps + window",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "621",
    "title": "Task Scheduler",
    "url": "https://leetcode.com/problems/task-scheduler/",
    "difficulty": "medium",
    "keyIdea": "Max-heap + cooldown",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "632",
    "title": "Smallest Range Covering Elements from K Lists",
    "url": "https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/",
    "difficulty": "hard",
    "keyIdea": "Min-heap + max tracking",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "703",
    "title": "Kth Largest Element in a Stream",
    "url": "https://leetcode.com/problems/kth-largest-element-in-a-stream/",
    "difficulty": "easy",
    "keyIdea": "Min-heap size k",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "973",
    "title": "K Closest Points to Origin",
    "url": "https://leetcode.com/problems/k-closest-points-to-origin/",
    "difficulty": "medium",
    "keyIdea": "Max-heap size k",
    "topic": "Heap (Priority Queue)"
  },
  {
    "id": "1235",
    "title": "Maximum Profit in Job Scheduling",
    "url": "https://leetcode.com/problems/maximum-profit-in-job-scheduling/",
    "difficulty": "hard",
    "keyIdea": "Sort + DP + binary search",
    "topic": "Intervals"
  },
  {
    "id": "1288",
    "title": "Remove Covered Intervals",
    "url": "https://leetcode.com/problems/remove-covered-intervals/",
    "difficulty": "medium",
    "keyIdea": "Sort + coverage check",
    "topic": "Intervals"
  },
  {
    "id": "228",
    "title": "Summary Ranges",
    "url": "https://leetcode.com/problems/summary-ranges/",
    "difficulty": "easy",
    "keyIdea": "Group consecutive",
    "topic": "Intervals"
  },
  {
    "id": "252",
    "title": "Meeting Rooms",
    "url": "https://leetcode.com/problems/meeting-rooms/",
    "difficulty": "easy",
    "keyIdea": "Any overlap?",
    "topic": "Intervals"
  },
  {
    "id": "253",
    "title": "Meeting Rooms II",
    "url": "https://leetcode.com/problems/meeting-rooms-ii/",
    "difficulty": "medium",
    "keyIdea": "Min heap end times",
    "topic": "Intervals"
  },
  {
    "id": "435",
    "title": "Non-overlapping Intervals",
    "url": "https://leetcode.com/problems/non-overlapping-intervals/",
    "difficulty": "medium",
    "keyIdea": "Sort by end, greedy",
    "topic": "Intervals"
  },
  {
    "id": "452",
    "title": "Minimum Arrows to Burst Balloons",
    "url": "https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/",
    "difficulty": "medium",
    "keyIdea": "Sort by end",
    "topic": "Intervals"
  },
  {
    "id": "56",
    "title": "Merge Intervals",
    "url": "https://leetcode.com/problems/merge-intervals/",
    "difficulty": "medium",
    "keyIdea": "Sort + merge",
    "topic": "Intervals"
  },
  {
    "id": "57",
    "title": "Insert Interval",
    "url": "https://leetcode.com/problems/insert-interval/",
    "difficulty": "medium",
    "keyIdea": "3-phase insert",
    "topic": "Intervals"
  },
  {
    "id": "759",
    "title": "Employee Free Time",
    "url": "https://leetcode.com/problems/employee-free-time/",
    "difficulty": "hard",
    "keyIdea": "Flatten + merge",
    "topic": "Intervals"
  },
  {
    "id": "138",
    "title": "Copy List with Random Pointer",
    "url": "https://leetcode.com/problems/copy-list-with-random-pointer/",
    "difficulty": "medium",
    "keyIdea": "HashMap / interleave",
    "topic": "Linked List"
  },
  {
    "id": "141",
    "title": "Linked List Cycle",
    "url": "https://leetcode.com/problems/linked-list-cycle/",
    "difficulty": "easy",
    "keyIdea": "Fast/Slow",
    "topic": "Linked List"
  },
  {
    "id": "142",
    "title": "Linked List Cycle II",
    "url": "https://leetcode.com/problems/linked-list-cycle-ii/",
    "difficulty": "medium",
    "keyIdea": "Floyd's phase 2",
    "topic": "Linked List"
  },
  {
    "id": "143",
    "title": "Reorder List",
    "url": "https://leetcode.com/problems/reorder-list/",
    "difficulty": "medium",
    "keyIdea": "Find mid + reverse + merge",
    "topic": "Linked List"
  },
  {
    "id": "148",
    "title": "Sort List",
    "url": "https://leetcode.com/problems/sort-list/",
    "difficulty": "medium",
    "keyIdea": "Merge sort on list",
    "topic": "Linked List"
  },
  {
    "id": "160",
    "title": "Intersection of Two Linked Lists",
    "url": "https://leetcode.com/problems/intersection-of-two-linked-lists/",
    "difficulty": "easy",
    "keyIdea": "Length equalization",
    "topic": "Linked List"
  },
  {
    "id": "19",
    "title": "Remove Nth Node From End",
    "url": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
    "difficulty": "medium",
    "keyIdea": "Two pointers, n-gap",
    "topic": "Linked List"
  },
  {
    "id": "2",
    "title": "Add Two Numbers",
    "url": "https://leetcode.com/problems/add-two-numbers/",
    "difficulty": "medium",
    "keyIdea": "Carry simulation",
    "topic": "Linked List"
  },
  {
    "id": "206",
    "title": "Reverse Linked List",
    "url": "https://leetcode.com/problems/reverse-linked-list/",
    "difficulty": "easy",
    "keyIdea": "In-place reversal",
    "topic": "Linked List"
  },
  {
    "id": "21",
    "title": "Merge Two Sorted Lists",
    "url": "https://leetcode.com/problems/merge-two-sorted-lists/",
    "difficulty": "easy",
    "keyIdea": "Dummy head",
    "topic": "Linked List"
  },
  {
    "id": "23",
    "title": "Merge K Sorted Lists",
    "url": "https://leetcode.com/problems/merge-k-lists/",
    "difficulty": "hard",
    "keyIdea": "Min-heap",
    "topic": "Linked List"
  },
  {
    "id": "234",
    "title": "Palindrome Linked List",
    "url": "https://leetcode.com/problems/palindrome-linked-list/",
    "difficulty": "easy",
    "keyIdea": "Find mid + reverse",
    "topic": "Linked List"
  },
  {
    "id": "25",
    "title": "Reverse Nodes in k-Group",
    "url": "https://leetcode.com/problems/reverse-nodes-in-k-group/",
    "difficulty": "hard",
    "keyIdea": "Group reversal",
    "topic": "Linked List"
  },
  {
    "id": "61",
    "title": "Rotate List",
    "url": "https://leetcode.com/problems/rotate-list/",
    "difficulty": "medium",
    "keyIdea": "Find new tail",
    "topic": "Linked List"
  },
  {
    "id": "82",
    "title": "Remove Duplicates II",
    "url": "https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii/",
    "difficulty": "medium",
    "keyIdea": "Dummy head",
    "topic": "Linked List"
  },
  {
    "id": "83",
    "title": "Remove Duplicates from Sorted List",
    "url": "https://leetcode.com/problems/remove-duplicates-from-sorted-list/",
    "difficulty": "easy",
    "keyIdea": "Single pass",
    "topic": "Linked List"
  },
  {
    "id": "86",
    "title": "Partition List",
    "url": "https://leetcode.com/problems/partition-list/",
    "difficulty": "medium",
    "keyIdea": "Two dummy heads",
    "topic": "Linked List"
  },
  {
    "id": "92",
    "title": "Reverse Linked List II",
    "url": "https://leetcode.com/problems/reverse-linked-list-ii/",
    "difficulty": "medium",
    "keyIdea": "Partial reversal",
    "topic": "Linked List"
  },
  {
    "id": "221",
    "title": "Maximal Square",
    "url": "https://leetcode.com/problems/maximal-square/",
    "difficulty": "hard",
    "keyIdea": "Square DP",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "240",
    "title": "Search a 2D Matrix II",
    "url": "https://leetcode.com/problems/search-a-2d-matrix-ii/",
    "difficulty": "medium",
    "keyIdea": "Staircase search",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "289",
    "title": "Game of Life",
    "url": "https://leetcode.com/problems/game-of-life/",
    "difficulty": "medium",
    "keyIdea": "In-place encoding",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "329",
    "title": "Longest Increasing Path in Matrix",
    "url": "https://leetcode.com/problems/longest-increasing-path-in-a-matrix/",
    "difficulty": "hard",
    "keyIdea": "DFS + memo",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "48",
    "title": "Rotate Image",
    "url": "https://leetcode.com/problems/rotate-image/",
    "difficulty": "medium",
    "keyIdea": "Transpose + reverse",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "54",
    "title": "Spiral Matrix",
    "url": "https://leetcode.com/problems/spiral-matrix/",
    "difficulty": "medium",
    "keyIdea": "Layer peeling",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "542",
    "title": "01 Matrix",
    "url": "https://leetcode.com/problems/01-matrix/",
    "difficulty": "medium",
    "keyIdea": "Multi-source BFS",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "566",
    "title": "Reshape the Matrix",
    "url": "https://leetcode.com/problems/reshape-the-matrix/",
    "difficulty": "easy",
    "keyIdea": "Index mapping",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "59",
    "title": "Spiral Matrix II",
    "url": "https://leetcode.com/problems/spiral-matrix-ii/",
    "difficulty": "medium",
    "keyIdea": "Fill in spiral",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "62",
    "title": "Unique Paths",
    "url": "https://leetcode.com/problems/unique-paths/",
    "difficulty": "medium",
    "keyIdea": "Matrix DP",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "64",
    "title": "Minimum Path Sum",
    "url": "https://leetcode.com/problems/minimum-path-sum/",
    "difficulty": "medium",
    "keyIdea": "Matrix DP",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "73",
    "title": "Set Matrix Zeroes",
    "url": "https://leetcode.com/problems/set-matrix-zeroes/",
    "difficulty": "medium",
    "keyIdea": "In-place flags",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "832",
    "title": "Flipping an Image",
    "url": "https://leetcode.com/problems/flipping-an-image/",
    "difficulty": "easy",
    "keyIdea": "Row transform",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "85",
    "title": "Maximal Rectangle",
    "url": "https://leetcode.com/problems/maximal-rectangle/",
    "difficulty": "hard",
    "keyIdea": "Histogram + stack",
    "topic": "Matrices (2D Arrays)"
  },
  {
    "id": "1019",
    "title": "Next Greater Node in Linked List",
    "url": "https://leetcode.com/problems/next-greater-node-in-linked-list/",
    "difficulty": "medium",
    "keyIdea": "Next greater on list",
    "topic": "Monotonic Stack"
  },
  {
    "id": "1856",
    "title": "Maximum Subarray Min-Product",
    "url": "https://leetcode.com/problems/maximum-subarray-min-product/",
    "difficulty": "hard",
    "keyIdea": "Span \u00d7 prefix sum",
    "topic": "Monotonic Stack"
  },
  {
    "id": "402",
    "title": "Remove K Digits",
    "url": "https://leetcode.com/problems/remove-k-digits/",
    "difficulty": "medium",
    "keyIdea": "Monotonic increasing",
    "topic": "Monotonic Stack"
  },
  {
    "id": "42",
    "title": "Trapping Rain Water",
    "url": "https://leetcode.com/problems/trapping-rain-water/",
    "difficulty": "hard",
    "keyIdea": "Water between walls",
    "topic": "Monotonic Stack"
  },
  {
    "id": "496",
    "title": "Next Greater Element I",
    "url": "https://leetcode.com/problems/next-greater-element-i/",
    "difficulty": "easy",
    "keyIdea": "Next greater",
    "topic": "Monotonic Stack"
  },
  {
    "id": "503",
    "title": "Next Greater Element II",
    "url": "https://leetcode.com/problems/next-greater-element-ii/",
    "difficulty": "medium",
    "keyIdea": "Circular + monotonic",
    "topic": "Monotonic Stack"
  },
  {
    "id": "682",
    "title": "Baseball Game",
    "url": "https://leetcode.com/problems/baseball-game/",
    "difficulty": "easy",
    "keyIdea": "Stack basics",
    "topic": "Monotonic Stack"
  },
  {
    "id": "739",
    "title": "Daily Temperatures",
    "url": "https://leetcode.com/problems/daily-temperatures/",
    "difficulty": "medium",
    "keyIdea": "Next greater",
    "topic": "Monotonic Stack"
  },
  {
    "id": "84",
    "title": "Largest Rectangle in Histogram",
    "url": "https://leetcode.com/problems/largest-rectangle-in-histogram/",
    "difficulty": "hard",
    "keyIdea": "Width span",
    "topic": "Monotonic Stack"
  },
  {
    "id": "85",
    "title": "Maximal Rectangle",
    "url": "https://leetcode.com/problems/maximal-rectangle/",
    "difficulty": "hard",
    "keyIdea": "Row-by-row histogram",
    "topic": "Monotonic Stack"
  },
  {
    "id": "856",
    "title": "Score of Parentheses",
    "url": "https://leetcode.com/problems/score-of-parentheses/",
    "difficulty": "medium",
    "keyIdea": "Depth tracking",
    "topic": "Monotonic Stack"
  },
  {
    "id": "901",
    "title": "Online Stock Span",
    "url": "https://leetcode.com/problems/online-stock-span/",
    "difficulty": "medium",
    "keyIdea": "Span (prev \u2265)",
    "topic": "Monotonic Stack"
  },
  {
    "id": "907",
    "title": "Sum of Subarray Minimums",
    "url": "https://leetcode.com/problems/sum-of-subarray-minimums/",
    "difficulty": "medium",
    "keyIdea": "Left \u00d7 right spans",
    "topic": "Monotonic Stack"
  },
  {
    "id": "1074",
    "title": "Number of Submatrices That Sum to Target",
    "url": "https://leetcode.com/problems/number-of-submatrices-that-sum-to-target/",
    "difficulty": "hard",
    "keyIdea": "2D prefix + fix 2 rows",
    "topic": "Prefix Sum"
  },
  {
    "id": "1248",
    "title": "Count Number of Nice Subarrays",
    "url": "https://leetcode.com/problems/count-number-of-nice-subarrays/",
    "difficulty": "medium",
    "keyIdea": "Prefix (odd count)",
    "topic": "Prefix Sum"
  },
  {
    "id": "1371",
    "title": "Find the Longest Substring Containing Vowels in Even Counts",
    "url": "https://leetcode.com/problems/find-the-longest-substring-containing-vowels-in-even-counts/",
    "difficulty": "medium",
    "keyIdea": "Bitmask prefix",
    "topic": "Prefix Sum"
  },
  {
    "id": "1480",
    "title": "Running Sum of 1d Array",
    "url": "https://leetcode.com/problems/running-sum-of-1d-array/",
    "difficulty": "easy",
    "keyIdea": "Build prefix in-place",
    "topic": "Prefix Sum"
  },
  {
    "id": "1732",
    "title": "Find the Highest Altitude",
    "url": "https://leetcode.com/problems/find-the-highest-altitude/",
    "difficulty": "easy",
    "keyIdea": "Running max of prefix",
    "topic": "Prefix Sum"
  },
  {
    "id": "303",
    "title": "Range Sum Query - Immutable",
    "url": "https://leetcode.com/problems/range-sum-query-immutable/",
    "difficulty": "easy",
    "keyIdea": "Classic 1D prefix",
    "topic": "Prefix Sum"
  },
  {
    "id": "304",
    "title": "Range Sum Query 2D - Immutable",
    "url": "https://leetcode.com/problems/range-sum-query-2d-immutable/",
    "difficulty": "medium",
    "keyIdea": "2D prefix sum",
    "topic": "Prefix Sum"
  },
  {
    "id": "327",
    "title": "Count of Range Sum",
    "url": "https://leetcode.com/problems/count-of-range-sum/",
    "difficulty": "hard",
    "keyIdea": "Prefix + merge sort",
    "topic": "Prefix Sum"
  },
  {
    "id": "525",
    "title": "Contiguous Array",
    "url": "https://leetcode.com/problems/contiguous-array/",
    "difficulty": "medium",
    "keyIdea": "Prefix + HashMap (0\u2192-1)",
    "topic": "Prefix Sum"
  },
  {
    "id": "560",
    "title": "Subarray Sum Equals K",
    "url": "https://leetcode.com/problems/subarray-sum-equals-k/",
    "difficulty": "medium",
    "keyIdea": "Prefix + HashMap",
    "topic": "Prefix Sum"
  },
  {
    "id": "724",
    "title": "Find Pivot Index",
    "url": "https://leetcode.com/problems/find-pivot-index/",
    "difficulty": "easy",
    "keyIdea": "Total - leftSum",
    "topic": "Prefix Sum"
  },
  {
    "id": "974",
    "title": "Subarray Sums Divisible by K",
    "url": "https://leetcode.com/problems/subarray-sums-divisible-by-k/",
    "difficulty": "medium",
    "keyIdea": "Prefix mod + HashMap",
    "topic": "Prefix Sum"
  },
  {
    "id": "1004",
    "title": "Max Consecutive Ones III",
    "url": "https://leetcode.com/problems/max-consecutive-ones-iii/",
    "difficulty": "medium",
    "keyIdea": "Variable",
    "topic": "Sliding Window"
  },
  {
    "id": "121",
    "title": "Best Time to Buy and Sell Stock",
    "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    "difficulty": "easy",
    "keyIdea": "Variable",
    "topic": "Sliding Window"
  },
  {
    "id": "187",
    "title": "Repeated DNA Sequences",
    "url": "https://leetcode.com/problems/repeated-dna-sequences/",
    "difficulty": "medium",
    "keyIdea": "Fixed",
    "topic": "Sliding Window"
  },
  {
    "id": "209",
    "title": "Minimum Size Subarray Sum",
    "url": "https://leetcode.com/problems/minimum-size-subarray-sum/",
    "difficulty": "medium",
    "keyIdea": "Variable",
    "topic": "Sliding Window"
  },
  {
    "id": "219",
    "title": "Contains Duplicate II",
    "url": "https://leetcode.com/problems/contains-duplicate-ii/",
    "difficulty": "easy",
    "keyIdea": "Fixed",
    "topic": "Sliding Window"
  },
  {
    "id": "239",
    "title": "Sliding Window Maximum",
    "url": "https://leetcode.com/problems/sliding-window-maximum/",
    "difficulty": "hard",
    "keyIdea": "Fixed + Deque",
    "topic": "Sliding Window"
  },
  {
    "id": "3",
    "title": "Longest Substring Without Repeating Characters",
    "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    "difficulty": "medium",
    "keyIdea": "Variable",
    "topic": "Sliding Window"
  },
  {
    "id": "424",
    "title": "Longest Repeating Character Replacement",
    "url": "https://leetcode.com/problems/longest-repeating-character-replacement/",
    "difficulty": "medium",
    "keyIdea": "Variable",
    "topic": "Sliding Window"
  },
  {
    "id": "438",
    "title": "Find All Anagrams in a String",
    "url": "https://leetcode.com/problems/find-all-anagrams-in-a-string/",
    "difficulty": "medium",
    "keyIdea": "Fixed",
    "topic": "Sliding Window"
  },
  {
    "id": "480",
    "title": "Sliding Window Median",
    "url": "https://leetcode.com/problems/sliding-window-median/",
    "difficulty": "hard",
    "keyIdea": "Fixed + Two Heaps",
    "topic": "Sliding Window"
  },
  {
    "id": "567",
    "title": "Permutation in String",
    "url": "https://leetcode.com/problems/permutation-in-string/",
    "difficulty": "medium",
    "keyIdea": "Fixed",
    "topic": "Sliding Window"
  },
  {
    "id": "643",
    "title": "Maximum Average Subarray I",
    "url": "https://leetcode.com/problems/maximum-average-subarray-i/",
    "difficulty": "easy",
    "keyIdea": "Fixed",
    "topic": "Sliding Window"
  },
  {
    "id": "76",
    "title": "Minimum Window Substring",
    "url": "https://leetcode.com/problems/minimum-window-substring/",
    "difficulty": "hard",
    "keyIdea": "Variable",
    "topic": "Sliding Window"
  },
  {
    "id": "904",
    "title": "Fruit Into Baskets",
    "url": "https://leetcode.com/problems/fruit-into-baskets/",
    "difficulty": "medium",
    "keyIdea": "At most 2 distinct",
    "topic": "Sliding Window"
  },
  {
    "id": "992",
    "title": "Subarrays with K Different Integers",
    "url": "https://leetcode.com/problems/subarrays-with-k-different-integers/",
    "difficulty": "medium",
    "keyIdea": "Exactly k trick",
    "topic": "Sliding Window"
  },
  {
    "id": "148",
    "title": "Sort List",
    "url": "https://leetcode.com/problems/sort-list/",
    "difficulty": "medium",
    "keyIdea": "Merge sort on linked list",
    "topic": "Sorting"
  },
  {
    "id": "179",
    "title": "Largest Number",
    "url": "https://leetcode.com/problems/largest-number/",
    "difficulty": "medium",
    "keyIdea": "Custom comparator",
    "topic": "Sorting"
  },
  {
    "id": "217",
    "title": "Contains Duplicate",
    "url": "https://leetcode.com/problems/contains-duplicate/",
    "difficulty": "easy",
    "keyIdea": "Sort then check adjacent",
    "topic": "Sorting"
  },
  {
    "id": "242",
    "title": "Valid Anagram",
    "url": "https://leetcode.com/problems/valid-anagram/",
    "difficulty": "easy",
    "keyIdea": "Sort strings",
    "topic": "Sorting"
  },
  {
    "id": "252",
    "title": "Meeting Rooms",
    "url": "https://leetcode.com/problems/meeting-rooms/",
    "difficulty": "medium",
    "keyIdea": "Sort by start",
    "topic": "Sorting"
  },
  {
    "id": "274",
    "title": "H-Index",
    "url": "https://leetcode.com/problems/h-index/",
    "difficulty": "medium",
    "keyIdea": "Sort descending",
    "topic": "Sorting"
  },
  {
    "id": "315",
    "title": "Count of Smaller Numbers After Self",
    "url": "https://leetcode.com/problems/count-of-smaller-numbers-after-self/",
    "difficulty": "hard",
    "keyIdea": "Merge sort with index tracking",
    "topic": "Sorting"
  },
  {
    "id": "493",
    "title": "Reverse Pairs",
    "url": "https://leetcode.com/problems/reverse-pairs/",
    "difficulty": "hard",
    "keyIdea": "Merge sort",
    "topic": "Sorting"
  },
  {
    "id": "56",
    "title": "Merge Intervals",
    "url": "https://leetcode.com/problems/merge-intervals/",
    "difficulty": "medium",
    "keyIdea": "Sort by start",
    "topic": "Sorting"
  },
  {
    "id": "75",
    "title": "Sort Colors",
    "url": "https://leetcode.com/problems/sort-colors/",
    "difficulty": "medium",
    "keyIdea": "Dutch National Flag",
    "topic": "Sorting"
  },
  {
    "id": "912",
    "title": "Sort an Array",
    "url": "https://leetcode.com/problems/sort-an-array/",
    "difficulty": "medium",
    "keyIdea": "Implement merge/quick sort",
    "topic": "Sorting"
  },
  {
    "id": "976",
    "title": "Largest Perimeter Triangle",
    "url": "https://leetcode.com/problems/largest-perimeter-triangle/",
    "difficulty": "easy",
    "keyIdea": "Sort + greedy",
    "topic": "Sorting"
  },
  {
    "id": "1047",
    "title": "Remove All Adjacent Duplicates",
    "url": "https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/",
    "difficulty": "medium",
    "keyIdea": "Stack collapse",
    "topic": "Stack"
  },
  {
    "id": "150",
    "title": "Evaluate Reverse Polish Notation",
    "url": "https://leetcode.com/problems/evaluate-reverse-polish-notation/",
    "difficulty": "medium",
    "keyIdea": "Expression eval",
    "topic": "Stack"
  },
  {
    "id": "155",
    "title": "Min Stack",
    "url": "https://leetcode.com/problems/min-stack/",
    "difficulty": "easy",
    "keyIdea": "Pair stack",
    "topic": "Stack"
  },
  {
    "id": "20",
    "title": "Valid Parentheses",
    "url": "https://leetcode.com/problems/valid-parentheses/",
    "difficulty": "easy",
    "keyIdea": "Matching brackets",
    "topic": "Stack"
  },
  {
    "id": "224",
    "title": "Basic Calculator",
    "url": "https://leetcode.com/problems/basic-calculator/",
    "difficulty": "hard",
    "keyIdea": "Expression eval",
    "topic": "Stack"
  },
  {
    "id": "225",
    "title": "Implement Stack using Queues",
    "url": "https://leetcode.com/problems/implement-stack-using-queues/",
    "difficulty": "easy",
    "keyIdea": "Design",
    "topic": "Stack"
  },
  {
    "id": "394",
    "title": "Decode String",
    "url": "https://leetcode.com/problems/decode-string/",
    "difficulty": "medium",
    "keyIdea": "Nested structure",
    "topic": "Stack"
  },
  {
    "id": "402",
    "title": "Remove K Digits",
    "url": "https://leetcode.com/problems/remove-k-digits/",
    "difficulty": "medium",
    "keyIdea": "Monotonic",
    "topic": "Stack"
  },
  {
    "id": "42",
    "title": "Trapping Rain Water",
    "url": "https://leetcode.com/problems/trapping-rain-water/",
    "difficulty": "hard",
    "keyIdea": "Monotonic stack",
    "topic": "Stack"
  },
  {
    "id": "496",
    "title": "Next Greater Element I",
    "url": "https://leetcode.com/problems/next-greater-element-i/",
    "difficulty": "easy",
    "keyIdea": "Monotonic",
    "topic": "Stack"
  },
  {
    "id": "682",
    "title": "Baseball Game",
    "url": "https://leetcode.com/problems/baseball-game/",
    "difficulty": "easy",
    "keyIdea": "Simulation",
    "topic": "Stack"
  },
  {
    "id": "739",
    "title": "Daily Temperatures",
    "url": "https://leetcode.com/problems/daily-temperatures/",
    "difficulty": "medium",
    "keyIdea": "Monotonic (next greater)",
    "topic": "Stack"
  },
  {
    "id": "84",
    "title": "Largest Rectangle in Histogram",
    "url": "https://leetcode.com/problems/largest-rectangle-in-histogram/",
    "difficulty": "hard",
    "keyIdea": "Monotonic stack",
    "topic": "Stack"
  },
  {
    "id": "85",
    "title": "Maximal Rectangle",
    "url": "https://leetcode.com/problems/maximal-rectangle/",
    "difficulty": "hard",
    "keyIdea": "Row-by-row histogram",
    "topic": "Stack"
  },
  {
    "id": "856",
    "title": "Score of Parentheses",
    "url": "https://leetcode.com/problems/score-of-parentheses/",
    "difficulty": "medium",
    "keyIdea": "Depth tracking",
    "topic": "Stack"
  },
  {
    "id": "901",
    "title": "Online Stock Span",
    "url": "https://leetcode.com/problems/online-stock-span/",
    "difficulty": "medium",
    "keyIdea": "Monotonic span",
    "topic": "Stack"
  },
  {
    "id": "100",
    "title": "Same Tree",
    "url": "https://leetcode.com/problems/same-tree/",
    "difficulty": "easy",
    "keyIdea": "DFS comparison",
    "topic": "Tree"
  },
  {
    "id": "101",
    "title": "Symmetric Tree",
    "url": "https://leetcode.com/problems/symmetric-tree/",
    "difficulty": "easy",
    "keyIdea": "Mirror DFS",
    "topic": "Tree"
  },
  {
    "id": "102",
    "title": "Binary Tree Level Order Traversal",
    "url": "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    "difficulty": "medium",
    "keyIdea": "BFS",
    "topic": "Tree"
  },
  {
    "id": "104",
    "title": "Maximum Depth of Binary Tree",
    "url": "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    "difficulty": "easy",
    "keyIdea": "DFS",
    "topic": "Tree"
  },
  {
    "id": "105",
    "title": "Construct from Preorder+Inorder",
    "url": "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/",
    "difficulty": "medium",
    "keyIdea": "Divide & conquer",
    "topic": "Tree"
  },
  {
    "id": "114",
    "title": "Flatten Binary Tree to Linked List",
    "url": "https://leetcode.com/problems/flatten-binary-tree-to-linked-list/",
    "difficulty": "medium",
    "keyIdea": "Postorder",
    "topic": "Tree"
  },
  {
    "id": "124",
    "title": "Binary Tree Maximum Path Sum",
    "url": "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
    "difficulty": "hard",
    "keyIdea": "DFS with global max",
    "topic": "Tree"
  },
  {
    "id": "199",
    "title": "Binary Tree Right Side View",
    "url": "https://leetcode.com/problems/binary-tree-right-side-view/",
    "difficulty": "medium",
    "keyIdea": "BFS last in level",
    "topic": "Tree"
  },
  {
    "id": "226",
    "title": "Invert Binary Tree",
    "url": "https://leetcode.com/problems/invert-binary-tree/",
    "difficulty": "easy",
    "keyIdea": "DFS swap",
    "topic": "Tree"
  },
  {
    "id": "230",
    "title": "Kth Smallest in BST",
    "url": "https://leetcode.com/problems/kth-smallest-element-in-a-bst/",
    "difficulty": "medium",
    "keyIdea": "Inorder",
    "topic": "Tree"
  },
  {
    "id": "236",
    "title": "LCA of Binary Tree",
    "url": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
    "difficulty": "medium",
    "keyIdea": "Recursive LCA",
    "topic": "Tree"
  },
  {
    "id": "297",
    "title": "Serialize and Deserialize Binary Tree",
    "url": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
    "difficulty": "hard",
    "keyIdea": "Preorder",
    "topic": "Tree"
  },
  {
    "id": "437",
    "title": "Path Sum III",
    "url": "https://leetcode.com/problems/path-sum-iii/",
    "difficulty": "medium",
    "keyIdea": "Prefix sum DFS",
    "topic": "Tree"
  },
  {
    "id": "543",
    "title": "Diameter of Binary Tree",
    "url": "https://leetcode.com/problems/diameter-of-binary-tree/",
    "difficulty": "easy",
    "keyIdea": "DFS with height",
    "topic": "Tree"
  },
  {
    "id": "572",
    "title": "Subtree of Another Tree",
    "url": "https://leetcode.com/problems/subtree-of-another-tree/",
    "difficulty": "easy",
    "keyIdea": "DFS + same tree",
    "topic": "Tree"
  },
  {
    "id": "94",
    "title": "Binary Tree Inorder Traversal",
    "url": "https://leetcode.com/problems/binary-tree-inorder-traversal/",
    "difficulty": "easy",
    "keyIdea": "DFS",
    "topic": "Tree"
  },
  {
    "id": "968",
    "title": "Binary Tree Cameras",
    "url": "https://leetcode.com/problems/binary-tree-cameras/",
    "difficulty": "hard",
    "keyIdea": "Greedy DFS",
    "topic": "Tree"
  },
  {
    "id": "98",
    "title": "Validate Binary Search Tree",
    "url": "https://leetcode.com/problems/validate-binary-search-tree/",
    "difficulty": "medium",
    "keyIdea": "Range DFS",
    "topic": "Tree"
  },
  {
    "id": "208",
    "title": "Implement Trie (Prefix Tree)",
    "url": "https://leetcode.com/problems/implement-trie-prefix-tree/",
    "difficulty": "medium",
    "keyIdea": "Core Trie implementation",
    "topic": "Trie (Prefix Tree)"
  },
  {
    "id": "211",
    "title": "Design Add and Search Words Data Structure",
    "url": "https://leetcode.com/problems/design-add-and-search-words-data-structure/",
    "difficulty": "medium",
    "keyIdea": "Trie + DFS for `'.'`",
    "topic": "Trie (Prefix Tree)"
  },
  {
    "id": "212",
    "title": "Word Search II",
    "url": "https://leetcode.com/problems/word-search-ii/",
    "difficulty": "hard",
    "keyIdea": "Trie + board backtrack",
    "topic": "Trie (Prefix Tree)"
  },
  {
    "id": "336",
    "title": "Palindrome Pairs",
    "url": "https://leetcode.com/problems/palindrome-pairs/",
    "difficulty": "hard",
    "keyIdea": "Trie + palindrome check",
    "topic": "Trie (Prefix Tree)"
  },
  {
    "id": "421",
    "title": "Maximum XOR of Two Numbers in an Array",
    "url": "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/",
    "difficulty": "medium",
    "keyIdea": "Binary Trie",
    "topic": "Trie (Prefix Tree)"
  },
  {
    "id": "648",
    "title": "Replace Words",
    "url": "https://leetcode.com/problems/replace-words/",
    "difficulty": "medium",
    "keyIdea": "Trie prefix match",
    "topic": "Trie (Prefix Tree)"
  },
  {
    "id": "676",
    "title": "Implement Magic Dictionary",
    "url": "https://leetcode.com/problems/implement-magic-dictionary/",
    "difficulty": "medium",
    "keyIdea": "Trie + fuzzy search",
    "topic": "Trie (Prefix Tree)"
  },
  {
    "id": "720",
    "title": "Longest Word in Dictionary",
    "url": "https://leetcode.com/problems/longest-word-in-dictionary/",
    "difficulty": "medium",
    "keyIdea": "Trie BFS/DFS",
    "topic": "Trie (Prefix Tree)"
  },
  {
    "id": "745",
    "title": "Prefix and Suffix Search",
    "url": "https://leetcode.com/problems/prefix-and-suffix-search/",
    "difficulty": "hard",
    "keyIdea": "Double Trie",
    "topic": "Trie (Prefix Tree)"
  },
  {
    "id": "11",
    "title": "Container With Most Water",
    "url": "https://leetcode.com/problems/container-with-most-water/",
    "difficulty": "medium",
    "keyIdea": "Converging",
    "topic": "Two Pointers"
  },
  {
    "id": "125",
    "title": "Valid Palindrome",
    "url": "https://leetcode.com/problems/valid-palindrome/",
    "difficulty": "easy",
    "keyIdea": "Converging",
    "topic": "Two Pointers"
  },
  {
    "id": "142",
    "title": "Linked List Cycle II",
    "url": "https://leetcode.com/problems/linked-list-cycle-ii/",
    "difficulty": "medium",
    "keyIdea": "Fast/Slow on list",
    "topic": "Two Pointers"
  },
  {
    "id": "15",
    "title": "3Sum",
    "url": "https://leetcode.com/problems/3sum/",
    "difficulty": "medium",
    "keyIdea": "Sort + converging",
    "topic": "Two Pointers"
  },
  {
    "id": "16",
    "title": "3Sum Closest",
    "url": "https://leetcode.com/problems/3sum-closest/",
    "difficulty": "medium",
    "keyIdea": "Sort + converging",
    "topic": "Two Pointers"
  },
  {
    "id": "167",
    "title": "Two Sum II - Input Array is Sorted",
    "url": "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    "difficulty": "easy",
    "keyIdea": "Converging",
    "topic": "Two Pointers"
  },
  {
    "id": "18",
    "title": "4Sum",
    "url": "https://leetcode.com/problems/4sum/",
    "difficulty": "medium",
    "keyIdea": "Sort + two loops + converging",
    "topic": "Two Pointers"
  },
  {
    "id": "283",
    "title": "Move Zeroes",
    "url": "https://leetcode.com/problems/move-zeroes/",
    "difficulty": "easy",
    "keyIdea": "Fast/Slow",
    "topic": "Two Pointers"
  },
  {
    "id": "344",
    "title": "Reverse String",
    "url": "https://leetcode.com/problems/reverse-string/",
    "difficulty": "easy",
    "keyIdea": "Converging",
    "topic": "Two Pointers"
  },
  {
    "id": "42",
    "title": "Trapping Rain Water",
    "url": "https://leetcode.com/problems/trapping-rain-water/",
    "difficulty": "hard",
    "keyIdea": "Converging with max tracking",
    "topic": "Two Pointers"
  },
  {
    "id": "75",
    "title": "Sort Colors",
    "url": "https://leetcode.com/problems/sort-colors/",
    "difficulty": "medium",
    "keyIdea": "3-way partition (Dutch flag)",
    "topic": "Two Pointers"
  },
  {
    "id": "76",
    "title": "Minimum Window Substring",
    "url": "https://leetcode.com/problems/minimum-window-substring/",
    "difficulty": "hard",
    "keyIdea": "Sliding window variant",
    "topic": "Two Pointers"
  },
  {
    "id": "80",
    "title": "Remove Duplicates II",
    "url": "https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/",
    "difficulty": "medium",
    "keyIdea": "Fast/Slow",
    "topic": "Two Pointers"
  },
  {
    "id": "977",
    "title": "Squares of a Sorted Array",
    "url": "https://leetcode.com/problems/squares-of-a-sorted-array/",
    "difficulty": "easy",
    "keyIdea": "Converging",
    "topic": "Two Pointers"
  },
  {
    "id": "986",
    "title": "Interval List Intersections",
    "url": "https://leetcode.com/problems/interval-list-intersections/",
    "difficulty": "medium",
    "keyIdea": "Two list pointers",
    "topic": "Two Pointers"
  },
  {
    "id": "1971",
    "title": "Find if Path Exists in Graph",
    "url": "https://leetcode.com/problems/find-if-path-exists-in-graph/",
    "difficulty": "easy",
    "keyIdea": "Connected check",
    "topic": "Union-Find (Disjoint Set Union)"
  },
  {
    "id": "200",
    "title": "Number of Islands",
    "url": "https://leetcode.com/problems/number-of-islands/",
    "difficulty": "medium",
    "keyIdea": "Union grid cells",
    "topic": "Union-Find (Disjoint Set Union)"
  },
  {
    "id": "261",
    "title": "Graph Valid Tree",
    "url": "https://leetcode.com/problems/graph-valid-tree/",
    "difficulty": "medium",
    "keyIdea": "n-1 edges + no cycle",
    "topic": "Union-Find (Disjoint Set Union)"
  },
  {
    "id": "323",
    "title": "Number of Connected Components",
    "url": "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/",
    "difficulty": "medium",
    "keyIdea": "Classic DSU",
    "topic": "Union-Find (Disjoint Set Union)"
  },
  {
    "id": "547",
    "title": "Number of Provinces",
    "url": "https://leetcode.com/problems/number-of-provinces/",
    "difficulty": "easy",
    "keyIdea": "Count components",
    "topic": "Union-Find (Disjoint Set Union)"
  },
  {
    "id": "684",
    "title": "Redundant Connection",
    "url": "https://leetcode.com/problems/redundant-connection/",
    "difficulty": "medium",
    "keyIdea": "Detect cycle edge",
    "topic": "Union-Find (Disjoint Set Union)"
  },
  {
    "id": "685",
    "title": "Redundant Connection II",
    "url": "https://leetcode.com/problems/redundant-connection-ii/",
    "difficulty": "hard",
    "keyIdea": "Directed graph cycle",
    "topic": "Union-Find (Disjoint Set Union)"
  },
  {
    "id": "721",
    "title": "Accounts Merge",
    "url": "https://leetcode.com/problems/accounts-merge/",
    "difficulty": "medium",
    "keyIdea": "Email grouping",
    "topic": "Union-Find (Disjoint Set Union)"
  },
  {
    "id": "952",
    "title": "Largest Component Size by Common Factor",
    "url": "https://leetcode.com/problems/largest-component-size-by-common-factor/",
    "difficulty": "hard",
    "keyIdea": "Factor union",
    "topic": "Union-Find (Disjoint Set Union)"
  },
  {
    "id": "990",
    "title": "Satisfiability of Equality Equations",
    "url": "https://leetcode.com/problems/satisfiability-of-equality-equations/",
    "difficulty": "medium",
    "keyIdea": "Union equalities",
    "topic": "Union-Find (Disjoint Set Union)"
  }
];
