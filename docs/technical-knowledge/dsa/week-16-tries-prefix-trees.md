---
id: week-16-tries-prefix-trees
title: "Week 16: Tries (Prefix Trees)"
description: Master the Trie data structure for lightning-fast string manipulation. Learn to build Autocomplete systems, handle wildcard searches, and optimize multi-word grid searches in Java.
tags: [dsa, java, tries, prefix-trees, strings, algorithms, week-16]
sidebar_position: 16
---

import DsaWeek16TrieDiagram from '@site/src/components/DsaWeek16TrieDiagram';

# Week 16: Tries (Prefix Trees)

## 1. Overview

Welcome to Week 16! You have officially entered the final week of Phase 4. We are returning to trees, but with a highly specialized focus: **Tries** (pronounced "tries" or "trees").

A Trie, or Prefix Tree, is an $N$-ary tree designed specifically for string storage and retrieval. If you have ever wondered how Google Search provides instant autocomplete suggestions as you type, or how a spell-checker highlights a misspelled word in milliseconds, you are looking at a Trie.

**Goals for this week:**
- Understand the architecture of a `TrieNode` and how paths spell words.
- Master the fundamental operations: `insert()`, `search()`, and `startsWith()`.
- Learn the memory vs. speed trade-off between using an Array vs. a HashMap inside your nodes.
- Master the "Trie + DFS" pattern to solve complex word search problems.

### Knowledge You Need Before Starting

- String and character indexing fluency from Week 1.
- Tree traversal confidence from Week 6.
- HashMap-vs-array trade-off intuition from Week 4.
- Comfort with recursive DFS for dictionary/grid word search.

---

## 2. Theory & Fundamentals

<DsaWeek16TrieDiagram />


### 2.1 Mental Model: Why Tries Exist

Consider searching a dictionary of 100,000 words for all words starting with "pre". With a HashMap, you must check all 100,000 keys — $O(N)$. With a sorted array + binary search, you find the range in $O(\log N)$ but then must scan. With a **Trie**, you jump directly to the "pre" node in $O(3)$ — constant in the prefix length, independent of dictionary size.

```
Dictionary: ["apple", "app", "ape", "api", "apply", "bat", "ball"]

HashMap lookup for prefix "ap":
  Check "apple" -> starts with "ap"? Yes
  Check "app"   -> starts with "ap"? Yes
  Check "ape"   -> starts with "ap"? Yes
  Check "api"   -> starts with "ap"? Yes
  Check "apply" -> starts with "ap"? Yes
  Check "bat"   -> starts with "ap"? No
  Check "ball"  -> starts with "ap"? No
  -> O(N * L) time

Trie lookup for prefix "ap":
  root -> 'a' -> 'p'  (2 steps, done!)
  From this node, all descendants are "ap" words.
  -> O(L) time, completely independent of N
```

**The core insight:** A Trie physically organizes strings by their shared prefixes. Every node on the path from root to a leaf is a character in a word, and all words sharing a prefix share the same physical path.

---

### 2.2 The Structure of a Trie Node

Unlike a BST node that stores a complete value, a **TrieNode represents a single character** through its position in the tree. The path from the root to any node spells a prefix.

```
Trie containing: "ape", "api", "app", "apple", "apply"

         root
          |
          a
          |
          p
         /|\
        e  i  p
        |  |  |\ 
       [*] [*] [*] l
                    |
                    e       y
                    |       |
                   [*]     [*]

[*] = isEndOfWord = true

Path root→a→p→p = "app" (isEnd=true)
Path root→a→p→p→l→e = "apple" (isEnd=true)
"ap" exists as a path but isEnd=false → only a prefix, not a word
```

**Three critical fields in a TrieNode:**

| Field           | Type                                           | Purpose                            |
| --------------- | ---------------------------------------------- | ---------------------------------- |
| `children`      | `TrieNode[26]` or `Map<Character, TrieNode>`   | Links to child nodes               |
| `isEndOfWord`   | `boolean`                                      | Marks if a complete word ends here |
| Optional extras | `String word`, `int freq`, `List<String> top3` | Problem-specific data              |

**The `isEndOfWord` flag is critical.** Without it, you cannot distinguish between "app" (a word) and "ap" (just a prefix in the path to "ape"). Both have a valid path in the trie, but only "app" has `isEndOfWord = true` at position 'p'.

---

### 2.3 Time and Space Complexity

**Time — $O(L)$ for all operations** where $L$ is the length of the word/prefix:

| Operation                  | Time       | Why                                        |
| -------------------------- | ---------- | ------------------------------------------ |
| `insert(word)`             | $O(L)$     | Traverse/create L nodes                    |
| `search(word)`             | $O(L)$     | Traverse L nodes, check `isEndOfWord`      |
| `startsWith(prefix)`       | $O(L)$     | Traverse L nodes, no end check             |
| Find all words with prefix | $O(L + W)$ | Traverse to prefix + DFS subtree of size W |

**This is astonishing:** A trie with 1 million words searches in $O(L)$ — the same time as a trie with 10 words. The dictionary size is irrelevant.

**Space — $O(N \times L \times 26)$ worst case:**

Each of the $N$ words of average length $L$ creates up to $L$ nodes. Each node has 26 pointers. For a small dictionary this is acceptable; for large diverse datasets, it is very memory-heavy.

```
10 words of avg length 8, no shared prefixes:
  10 * 8 = 80 nodes
  80 * 26 pointers = 2,080 TrieNode references
  At 8 bytes per reference: ~16KB

10 million words: ~16GB — too large for a single machine
→ Real systems shard tries or use compressed variants (Patricia tries, radix trees)
```

---

### 2.4 Array vs. HashMap Children: The Fundamental Trade-off

```java
// Option 1: Fixed-size array
TrieNode[] children = new TrieNode[26]; // index = c - 'a'

// Option 2: HashMap
Map<Character, TrieNode> children = new HashMap<>();
```

|                        | `TrieNode[26]` array                     | `HashMap<Character, TrieNode>`       |
| ---------------------- | ---------------------------------------- | ------------------------------------ |
| Access speed           | $O(1)$, cache-friendly                   | $O(1)$ average, but hashing overhead |
| Memory per node        | 26 pointers × 8 bytes = 208 bytes always | Only stores existing children        |
| Memory for sparse trie | Wasteful (26 slots, most null)           | Efficient                            |
| Character set          | Fixed: lowercase a-z                     | Any: Unicode, digits, symbols        |
| Use in interviews      | ✅ Preferred (simple, fast)               | For mixed character sets             |
| Use in production      | Only for constrained alphabets           | General-purpose search engines       |

**Interview rule of thumb:** If the problem specifies "lowercase English letters", use `TrieNode[26]`. For anything else (digits, uppercase, mixed), use `HashMap<Character, TrieNode>`.

---

### 2.5 The "Trie + DFS" Pattern for Word Search

The single most important Trie interview technique: instead of doing a separate DFS for each word in a dictionary, **insert all words into a Trie first**, then do ONE DFS on the grid while simultaneously stepping through the Trie.

**Word Search II — why this matters:**

```
Dictionary: 10,000 words, each length 10
Grid: 10×10 = 100 cells

Naive (DFS per word): 10,000 words × O(4^10 × 100 cells) = astronomical
Trie approach: ONE DFS on grid, O(4^10 × 100 cells) — same DFS, finds ALL words simultaneously
```

**How it works:**
```
Grid DFS + Trie traversal simultaneously:

At cell (row, col) with character 'c':
  1. Try to step to trie.children['c' - 'a']
  2. If null → no dictionary word starts/continues this way → prune (return)
  3. If not null → continue DFS on grid neighbors + advance in trie
  4. If trieNode.isEndOfWord → found a complete word! Add to results.

Key insight: The Trie prunes the grid DFS automatically.
When no dictionary word continues with the current path's characters,
the Trie node is null → we stop exploring that direction immediately.
```

**Critical optimization — pruning the Trie after finding a word:**
```java
// After adding a found word to results, mark the trie node to prevent duplicates
trieNode.word = null; // clear the word so it's not added again
```

If the same word appears multiple times in the grid, this prevents adding it to results twice.

---

### 2.6 Inserting Additional Data into Trie Nodes

A TrieNode can carry any extra metadata needed for the problem. This is a key insight for system design problems:

```java
// Minimal node (standard)
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEndOfWord;
}

// Node storing the complete word (avoid reconstructing during DFS)
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    String word; // null unless a word ends here; set to the actual word string
}

// Node for autocomplete with frequencies
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    String word;
    int frequency;
    List<String> top3 = new ArrayList<>(); // pre-cached top 3 results
}

// Node for wildcard / approximate matching
class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEndOfWord;
    int count; // how many words pass through this node (for frequency ranking)
}
```

**Storing `word` directly at the end node** is a critical optimization for Word Search II. Instead of reconstructing the word by tracking the DFS path, you can retrieve it instantly: `if (trieNode.word != null) results.add(trieNode.word)`.

---

## 3. Code Templates (Java)

### Template 1: Standard Trie (Array-based)

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEndOfWord = false;
}

class Trie {
    private final TrieNode root = new TrieNode();

    // O(L) — traverse/create one node per character
    public void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) {
                curr.children[idx] = new TrieNode();
            }
            curr = curr.children[idx];
        }
        curr.isEndOfWord = true;
    }

    // O(L) — must reach end AND isEndOfWord must be true
    public boolean search(String word) {
        TrieNode node = traverse(word);
        return node != null && node.isEndOfWord;
    }

    // O(L) — only needs to reach end of prefix, ignores isEndOfWord
    public boolean startsWith(String prefix) {
        return traverse(prefix) != null;
    }

    // Shared traversal logic — returns null if path doesn't exist
    private TrieNode traverse(String s) {
        TrieNode curr = root;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) return null;
            curr = curr.children[idx];
        }
        return curr;
    }
}
```

### Template 2: Trie with HashMap Children (General Character Set)

```java
class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEndOfWord = false;
}

class Trie {
    private final TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            curr.children.putIfAbsent(c, new TrieNode());
            curr = curr.children.get(c);
        }
        curr.isEndOfWord = true;
    }

    public boolean search(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            if (!curr.children.containsKey(c)) return false;
            curr = curr.children.get(c);
        }
        return curr.isEndOfWord;
    }

    public boolean startsWith(String prefix) {
        TrieNode curr = root;
        for (char c : prefix.toCharArray()) {
            if (!curr.children.containsKey(c)) return false;
            curr = curr.children.get(c);
        }
        return true;
    }
}
```

### Template 3: Wildcard Search (DFS on Trie)

```java
// For patterns like "b.d" matching "bad", "bed", "bid"
public boolean searchWithWildcard(String pattern) {
    return dfsSearch(pattern, 0, root);
}

private boolean dfsSearch(String pattern, int index, TrieNode node) {
    if (index == pattern.length()) return node.isEndOfWord;

    char c = pattern.charAt(index);

    if (c == '.') {
        // Try all 26 possible children
        for (TrieNode child : node.children) {
            if (child != null && dfsSearch(pattern, index + 1, child)) {
                return true;
            }
        }
        return false;
    } else {
        int idx = c - 'a';
        if (node.children[idx] == null) return false;
        return dfsSearch(pattern, index + 1, node.children[idx]);
    }
}
```

### Template 4: Trie + DFS for Word Search II

```java
// Insert all words, storing the word string at the end node
private void insert(TrieNode root, String word) {
    TrieNode curr = root;
    for (char c : word.toCharArray()) {
        int idx = c - 'a';
        if (curr.children[idx] == null) curr.children[idx] = new TrieNode();
        curr = curr.children[idx];
    }
    curr.word = word; // store actual word instead of boolean
}

// DFS on grid, simultaneously traversing the trie
private void dfs(char[][] board, boolean[][] visited, int row, int col,
                 TrieNode node, List<String> results) {
    // Bounds + visited + trie pruning
    if (row < 0 || row >= board.length || col < 0 || col >= board[0].length
            || visited[row][col]
            || node.children[board[row][col] - 'a'] == null) {
        return;
    }

    TrieNode next = node.children[board[row][col] - 'a'];
    visited[row][col] = true;

    if (next.word != null) {
        results.add(next.word);
        next.word = null; // prune: prevent duplicate findings
    }

    int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
    for (int[] dir : dirs) {
        dfs(board, visited, row + dir[0], col + dir[1], next, results);
    }

    visited[row][col] = false; // un-choose (backtrack)
}
```

### Template 5: Collect All Words Under a Prefix (Autocomplete DFS)

```java
// Traverse to prefix node, then DFS to collect all words
public List<String> getWordsWithPrefix(String prefix) {
    TrieNode curr = root;
    for (char c : prefix.toCharArray()) {
        int idx = c - 'a';
        if (curr.children[idx] == null) return new ArrayList<>();
        curr = curr.children[idx];
    }

    List<String> results = new ArrayList<>();
    collectAllWords(curr, new StringBuilder(prefix), results);
    return results;
}

private void collectAllWords(TrieNode node, StringBuilder current, List<String> results) {
    if (node.isEndOfWord) results.add(current.toString());

    for (int i = 0; i < 26; i++) {
        if (node.children[i] != null) {
            current.append((char) ('a' + i));
            collectAllWords(node.children[i], current, results);
            current.deleteCharAt(current.length() - 1); // backtrack
        }
    }
}
```

### Template 6: Trie Deletion

```java
// Delete a word from the trie (only remove nodes not shared with other words)
public boolean delete(String word) {
    return deleteHelper(root, word, 0);
}

private boolean deleteHelper(TrieNode curr, String word, int index) {
    if (index == word.length()) {
        if (!curr.isEndOfWord) return false; // word doesn't exist
        curr.isEndOfWord = false;
        return isLeaf(curr); // true if this node can be deleted (no other children)
    }

    int idx = word.charAt(index) - 'a';
    if (curr.children[idx] == null) return false;

    boolean shouldDeleteChild = deleteHelper(curr.children[idx], word, index + 1);
    if (shouldDeleteChild) {
        curr.children[idx] = null; // detach the child
        return !curr.isEndOfWord && isLeaf(curr); // can we also delete curr?
    }
    return false;
}

private boolean isLeaf(TrieNode node) {
    for (TrieNode child : node.children) {
        if (child != null) return false;
    }
    return true;
}
```

---

## 4. Problem-Solving Framework

### Step 1 — Recognize the Trie Signal

Ask:
- "Do I need prefix-based lookup or matching?" → Trie
- "Do I need to find ALL words from a dictionary in a grid?" → Trie + DFS
- "Do I need wildcard or fuzzy matching?" → Trie + DFS with branch exploration
- "Can the query be decomposed into a prefix traversal?" → Trie

### Step 2 — Choose Node Design

| Scenario                    | Node fields to add                |
| --------------------------- | --------------------------------- |
| Basic search/prefix         | `isEndOfWord` only                |
| Word retrieval during DFS   | `String word` (avoid rebuilding)  |
| Counting words under prefix | `int count` (increment on insert) |
| Autocomplete with ranking   | `List<String> top3` (pre-cached)  |
| Frequency weighting         | `int frequency`                   |

### Step 3 — Choose Children Representation

- Lowercase a-z only → `TrieNode[26]`, index = `c - 'a'`
- Mixed/unknown charset → `HashMap<Character, TrieNode>`

### Step 4 — Implement in This Order

1. `TrieNode` class with fields
2. `insert()` — build the trie
3. `search()` — exact match (check `isEndOfWord`)
4. `startsWith()` — prefix match (no end check)
5. Problem-specific operation (DFS, autocomplete, wildcard)

### Step 5 — Edge Cases to Always Check

- Empty string input to insert/search
- Single character words
- Prefix that is itself a complete word (e.g., "app" in ["app", "apple"])
- Searching for a word not in the trie but whose prefix exists
- Duplicate words in the input

---

## 5. Pattern Recognition Guide

### Signal → Pattern Mapping

| Problem signal                                    | Pattern                  | Key technique                                |
| ------------------------------------------------- | ------------------------ | -------------------------------------------- |
| "Autocomplete", "typeahead", "search suggestions" | Trie + prefix traversal  | Traverse to prefix, DFS subtree              |
| "Find all dictionary words in a grid"             | Trie + grid DFS          | Insert words, DFS grid + trie simultaneously |
| "Wildcard matching (`.` = any char)"              | Trie + DFS branching     | On `.`, try all 26 children                  |
| "Longest common prefix"                           | Trie traversal           | Walk until first branch or end               |
| "Word starts with prefix?"                        | `startsWith()`           | Simple trie traversal                        |
| "Spell check / closest word"                      | Trie + edit distance DFS | Branch on mismatch                           |
| "Max XOR of two numbers"                          | Binary Trie              | 32-bit integers as paths                     |
| "Replace words with roots"                        | Trie prefix match        | Stop at first `isEndOfWord`                  |
| "Stream of characters, find any dictionary word"  | Reversed Trie            | Insert reversed words, search backward       |
| "Count words with prefix"                         | Trie with `count` field  | Increment count on insert                    |

---

### Detailed Recognition Walkthroughs

#### Recognizing Word Search II (Trie + Grid DFS)

When you see: *"find all words from a dictionary that exist in a 2D grid"*
1. "Running one DFS per word is too slow (10,000 words × grid DFS)."
2. "Insert all words into a Trie. Now do ONE grid DFS while walking the Trie simultaneously."
3. "At each cell, check `trie.children[board[r][c] - 'a']` — if null, prune immediately."
4. "When `trieNode.word != null`, a complete word is found. Set `word = null` to prevent duplicates."
5. "Use `visited[][]` to prevent reusing a cell in the same path (backtracking grid DFS)."

#### Recognizing Wildcard Search (LC 211)

When you see: *"search for a word where `.` can match any character"*
1. "Standard trie traversal can't handle `.` — it needs to try all branches."
2. "Use recursive DFS on the trie. For `.`, loop all 26 children. For normal char, follow that one child."
3. "Base case: when `index == word.length()`, return `node.isEndOfWord`."
4. "The recursion mirrors the trie structure — it IS a DFS on the trie."

#### Recognizing Replace Words (Trie Prefix Priority)

When you see: *"replace each word with the shortest matching root from a dictionary"*
1. "Insert all roots into the Trie."
2. "For each word in the sentence, traverse the Trie character by character."
3. "The moment you hit a node where `word != null` (or `isEndOfWord = true`), stop — that's the shortest root."
4. "If you traverse the entire word without hitting a root, keep the original word."

#### Recognizing the "Count Under Prefix" Pattern

When you see: *"how many words start with this prefix?"*
1. "Maintain a `count` field in each `TrieNode`."
2. "Increment `count` at every node visited during `insert()`."
3. "To answer a prefix query: traverse to the prefix node, return `node.count`."
4. "No DFS needed — the count is maintained incrementally."

---

## 6. Common Mistakes & How to Avoid Them

### Mistake 1: Confusing `search()` and `startsWith()`

```java
// search("app") should return true only if "app" was inserted as a complete word
// startsWith("app") should return true if ANY inserted word begins with "app"

// WRONG — search that doesn't check isEndOfWord
public boolean search(String word) {
    TrieNode node = traverse(word);
    return node != null; // WRONG: this is startsWith behavior!
}

// CORRECT — must check isEndOfWord for search
public boolean search(String word) {
    TrieNode node = traverse(word);
    return node != null && node.isEndOfWord; // <- critical difference
}
```

### Mistake 2: Forgetting to Set `isEndOfWord` After Insert

```java
// WRONG — traverses correctly but never marks the end
public void insert(String word) {
    TrieNode curr = root;
    for (char c : word.toCharArray()) {
        int idx = c - 'a';
        if (curr.children[idx] == null) curr.children[idx] = new TrieNode();
        curr = curr.children[idx];
    }
    // forgot: curr.isEndOfWord = true;
}
// After this, search("word") always returns false!
```

### Mistake 3: Not Backtracking `visited` in Grid DFS

```java
// WRONG — visited never restored, blocks future paths using the same cell
private void dfs(char[][] board, boolean[][] visited, int r, int c, TrieNode node, List<String> res) {
    visited[r][c] = true;
    // explore neighbors...
    // forgot: visited[r][c] = false;
}

// CORRECT — un-choose after exploring
visited[r][c] = true;
for (int[] dir : DIRS) dfs(board, visited, r + dir[0], c + dir[1], next, res);
visited[r][c] = false; // restore for other paths
```

### Mistake 4: Not Pruning Duplicate Words in Word Search II

```java
// WRONG — same word added multiple times if it appears in multiple grid paths
if (node.word != null) res.add(node.word);

// CORRECT — clear word after finding it to prevent duplicates
if (node.word != null) {
    res.add(node.word);
    node.word = null; // prune: mark as found, won't be added again
}
```

### Mistake 5: Wrong Character-to-Index Mapping

```java
// WRONG for uppercase letters
int idx = c - 'a'; // 'A' - 'a' = -32! -> ArrayIndexOutOfBoundsException

// CORRECT: use c - 'a' for lowercase only
// For uppercase: c - 'A'
// For mixed: use HashMap<Character, TrieNode> instead of array

// WRONG for digit characters
int idx = c - 'a'; // '5' - 'a' is meaningless

// CORRECT for digits:
int idx = c - '0'; // '0'=0, '1'=1, ..., '9'=9
// and use TrieNode[10] children
```

### Mistake 6: Allocating HashMap in Every Node (Memory Overhead)

```java
// EXPENSIVE — every node allocates a HashMap even if empty
class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>(); // allocates even for leaves
}

// BETTER — lazy initialization
class TrieNode {
    Map<Character, TrieNode> children = null;

    public TrieNode getOrCreate(char c) {
        if (children == null) children = new HashMap<>();
        return children.computeIfAbsent(c, k -> new TrieNode());
    }
}
// Saves memory for leaf nodes (most nodes in a trie are leaves)
```

---

## 7. Worked Examples

### Example 1: LeetCode 208 — Implement Trie

**Thinking process:**
1. Each node represents one character. The path spells a word.
2. `insert`: walk the path, create nodes as needed, mark `isEndOfWord` at the final node.
3. `search`: walk the path, return `node.isEndOfWord` at the end.
4. `startsWith`: walk the path, return `node != null` at the end.

```java
class Trie {
    private final TrieNode root = new TrieNode();

    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isEndOfWord = false;
    }

    public void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) curr.children[idx] = new TrieNode();
            curr = curr.children[idx];
        }
        curr.isEndOfWord = true;
    }

    public boolean search(String word) {
        TrieNode node = traverse(word);
        return node != null && node.isEndOfWord;
    }

    public boolean startsWith(String prefix) {
        return traverse(prefix) != null;
    }

    private TrieNode traverse(String s) {
        TrieNode curr = root;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) return null;
            curr = curr.children[idx];
        }
        return curr;
    }
}
```

Trace for insert("app"), insert("apple"), search("app"), startsWith("appl"), search("appl"):
```
Insert "app":
  root -> create 'a' -> create 'p' -> create 'p'
  Mark last 'p' as isEndOfWord=true

Insert "apple":
  root -> 'a' (exists) -> 'p' (exists) -> 'p' (exists, isEnd=true)
       -> create 'l' -> create 'e'
  Mark 'e' as isEndOfWord=true

search("app"):
  traverse("app") -> reaches last 'p' node
  node.isEndOfWord = true -> return true ✅

startsWith("appl"):
  traverse("appl") -> reaches 'l' node (not null)
  return true ✅

search("appl"):
  traverse("appl") -> reaches 'l' node
  node.isEndOfWord = false -> return false ✅
```

---

### Example 2: LeetCode 211 — Design Add and Search Words

**Thinking process:**
1. Standard insert for `addWord`.
2. For `search`: when encountering `.`, must explore ALL children recursively.
3. DFS through the trie, branching at every `.`.

```java
class WordDictionary {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isWord = false;
    }

    private final TrieNode root = new TrieNode();

    public void addWord(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) curr.children[idx] = new TrieNode();
            curr = curr.children[idx];
        }
        curr.isWord = true;
    }

    public boolean search(String word) {
        return dfs(word, 0, root);
    }

    private boolean dfs(String word, int idx, TrieNode node) {
        if (idx == word.length()) return node.isWord;

        char c = word.charAt(idx);
        if (c == '.') {
            // Try every possible child
            for (TrieNode child : node.children) {
                if (child != null && dfs(word, idx + 1, child)) return true;
            }
            return false;
        } else {
            TrieNode next = node.children[c - 'a'];
            return next != null && dfs(word, idx + 1, next);
        }
    }
}
```

Trace for `search(".ad")` with words ["bad", "dad", "mad"]:
```
dfs(".ad", 0, root):
  c = '.' -> try all children of root
  child 'b': dfs(".ad", 1, b_node)
    c = 'a' -> go to a_node under b
    dfs(".ad", 2, a_node):
      c = 'd' -> go to d_node under a
      dfs(".ad", 3, d_node): idx=3=len -> d_node.isWord=true -> return true ✅
```

*Time: $O(L)$ average, $O(26^L)$ worst case (all wildcards). Space: $O(N \times L)$.*

---

### Example 3: LeetCode 212 — Word Search II

**Thinking process:**
1. "Find all dictionary words in a grid" → Trie + Grid DFS.
2. Insert all words (store the word string at end nodes).
3. Start DFS from every cell. Simultaneously traverse the trie.
4. Prune: if `trie.children[board[r][c] - 'a'] == null`, no word continues here.
5. When `node.word != null`, add to results and set `node.word = null` (prevent duplicates).

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        String word = null;
    }

    private static final int[][] DIRS = {{0,1},{0,-1},{1,0},{-1,0}};

    public List<String> findWords(char[][] board, String[] words) {
        TrieNode root = buildTrie(words);
        List<String> results = new ArrayList<>();
        int m = board.length, n = board[0].length;
        boolean[][] visited = new boolean[m][n];

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                dfs(board, visited, r, c, root, results);
            }
        }
        return results;
    }

    private TrieNode buildTrie(String[] words) {
        TrieNode root = new TrieNode();
        for (String word : words) {
            TrieNode curr = root;
            for (char c : word.toCharArray()) {
                int idx = c - 'a';
                if (curr.children[idx] == null) curr.children[idx] = new TrieNode();
                curr = curr.children[idx];
            }
            curr.word = word; // store word at end node
        }
        return root;
    }

    private void dfs(char[][] board, boolean[][] visited, int r, int c,
                     TrieNode node, List<String> results) {
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length
                || visited[r][c]) return;

        int idx = board[r][c] - 'a';
        TrieNode next = node.children[idx];
        if (next == null) return; // no word continues this way — prune!

        visited[r][c] = true;

        if (next.word != null) {
            results.add(next.word);
            next.word = null; // prevent duplicate adds
        }

        for (int[] dir : DIRS) {
            dfs(board, visited, r + dir[0], c + dir[1], next, results);
        }

        visited[r][c] = false; // backtrack
    }
}
```

*Time: $O(M \times N \times 4^L)$ where $L$ = max word length, with Trie pruning greatly reducing actual calls. Space: $O(W \times L)$ for trie + $O(M \times N)$ for visited.*

---

### Example 4: LeetCode 648 — Replace Words

**Thinking process:**
1. "Replace word with shortest matching root" → insert roots, traverse until first `isEndOfWord`.
2. Store the root string at the end node for easy retrieval.
3. For each word in sentence, traverse trie until either the root ends or the path ends.

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        String rootWord = null; // stores the actual root if a root ends here
    }

    public String replaceWords(List<String> dictionary, String sentence) {
        TrieNode root = new TrieNode();
        for (String rootWord : dictionary) {
            TrieNode curr = root;
            for (char c : rootWord.toCharArray()) {
                int idx = c - 'a';
                if (curr.children[idx] == null) curr.children[idx] = new TrieNode();
                curr = curr.children[idx];
            }
            curr.rootWord = rootWord; // mark root end
        }

        StringBuilder sb = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (sb.length() > 0) sb.append(' ');

            TrieNode curr = root;
            String replacement = word; // default: keep original

            for (char c : word.toCharArray()) {
                int idx = c - 'a';
                if (curr.children[idx] == null) break; // root path ends, use original
                curr = curr.children[idx];
                if (curr.rootWord != null) {
                    replacement = curr.rootWord; // found shortest root
                    break;
                }
            }
            sb.append(replacement);
        }
        return sb.toString();
    }
}
```

*Time: $O(D \times L + S \times L)$ where $D$ = dictionary size, $S$ = sentence words, $L$ = avg word length. Space: $O(D \times L)$.*

---

## 8. Decision Tree: Trie or Something Else?

```
Is the problem about strings with shared prefixes?
└── YES -> Consider Trie

What operation is needed?
├── "Does word exist?" or "Does prefix exist?"
│   -> Standard Trie (insert + search/startsWith)
│
├── "Find all words with a given prefix"
│   -> Trie + DFS subtree collection
│
├── "Wildcard matching (. matches any char)"
│   -> Trie + recursive DFS branching
│
├── "Find dictionary words in a 2D grid"
│   -> Trie + Grid DFS (insert words, DFS grid simultaneously)
│
├── "Autocomplete with ranking"
│   -> Trie with pre-cached top-K at each node
│
└── "Count words with prefix"
    -> Trie with count field (increment on every insert)

Does the character set go beyond a-z?
├── a-z only    -> TrieNode[26] array
└── Other chars -> HashMap<Character, TrieNode>

Is memory a primary concern?
├── Memory-sensitive  -> HashMap (sparse nodes only)
└── Speed-sensitive   -> Array (O(1) index lookup, cache-friendly)
```

---

## 9. Complexity Cheat Sheet

| Operation                       | Time                                    | Space                       |
| ------------------------------- | --------------------------------------- | --------------------------- |
| Insert word of length L         | $O(L)$                                  | $O(L)$ new nodes worst case |
| Search word of length L         | $O(L)$                                  | $O(1)$                      |
| Check prefix of length L        | $O(L)$                                  | $O(1)$                      |
| Find all words under prefix P   | $O(L_P + W)$                            | $O(W)$ for results          |
| Wildcard search (k wildcards)   | $O(26^k \times L)$ worst                | $O(L)$ call stack           |
| Build trie (N words, avg len L) | $O(N \times L)$                         | $O(N \times L \times 26)$   |
| Word Search II grid DFS         | $O(M \times N \times 4^L)$ with pruning | $O(W \times L)$ trie        |
| Insert with count field         | $O(L)$                                  | —                           |

---

## 10. 7-Day Practice Plan (21 Problems)

For each problem, follow this ritual:
1. Identify: standard trie, wildcard, prefix-count, or trie+DFS?
2. Design your TrieNode fields: what extra data does this problem need?
3. Choose array vs. HashMap children.
4. Implement insert first, then the query operation.
5. Test with: empty string, single char, prefix that is itself a word, word not in trie.

**Day 1: Trie Fundamentals**
1. [Implement Trie (LC 208)](https://leetcode.com/problems/implement-trie-prefix-tree/) — build the foundation
2. [Design Add and Search Words (LC 211)](https://leetcode.com/problems/design-add-and-search-words-data-structure/) ⭐ — wildcard DFS
3. [Replace Words (LC 648)](https://leetcode.com/problems/replace-words/) — prefix matching with root storage

**Day 2: Multi-Word Search (Trie + DFS)**
4. [Word Search II (LC 212)](https://leetcode.com/problems/word-search-ii/) ⭐ — the canonical Trie interview problem
5. [Implement Magic Dictionary (LC 676)](https://leetcode.com/problems/implement-magic-dictionary/) — exactly one char mismatch
6. [Longest Word in Dictionary (LC 720)](https://leetcode.com/problems/longest-word-in-dictionary/) — build character by character

**Day 3: HashMap Nodes & Advanced State**
7. [Map Sum Pairs (LC 677)](https://leetcode.com/problems/map-sum-pairs/) — sum of values under prefix
8. [Prefix and Suffix Search (LC 745)](https://leetcode.com/problems/prefix-and-suffix-search/) — insert `suffix + '#' + prefix`
9. [Camelcase Matching (LC 1023)](https://leetcode.com/problems/camelcase-matching/) — character subsequence in trie

**Day 4: Autocomplete & System Design**
10. [Search Suggestions System (LC 1268)](https://leetcode.com/problems/search-suggestions-system/) — top 3 lexicographic suggestions
11. [Design Search Autocomplete System (LC 642)](https://leetcode.com/problems/design-search-autocomplete-system/) ⭐ — frequency ranking
12. [Palindrome Pairs (LC 336)](https://leetcode.com/problems/palindrome-pairs/) — reversed words in trie

**Day 5: Bitwise Tries (XOR Pattern)**
13. [Maximum XOR of Two Numbers in an Array (LC 421)](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/) — binary trie on 32-bit ints
14. [Maximum XOR With an Element From Array (LC 1707)](https://leetcode.com/problems/maximum-xor-with-an-element-from-array/) — offline queries + sorted trie
15. [Maximum Strong Pair XOR I (LC 2932)](https://leetcode.com/problems/maximum-strong-pair-xor-i/) — XOR with constraints

**Day 6: String Combinations & Word Break**
16. [Word Break (LC 139)](https://leetcode.com/problems/word-break/) — DP + trie for O(1) word lookup
17. [Word Break II (LC 140)](https://leetcode.com/problems/word-break-ii/) — backtracking + trie
18. [Concatenated Words (LC 472)](https://leetcode.com/problems/concatenated-words/) — word made of other words

**Day 7: Advanced Patterns**
19. [Stream of Characters (LC 1032)](https://leetcode.com/problems/stream-of-characters/) ⭐ — reversed trie, search backward
20. [Count Words With a Given Prefix (LC 2185)](https://leetcode.com/problems/count-words-with-a-given-prefix/) — prefix count field
21. [Longest Common Prefix (LC 14)](https://leetcode.com/problems/longest-common-prefix/) — walk trie until first branch

---

## 11. Mock Interview Module

### Problem: The Real-Time Typeahead Engine

**Context:** You are building the search bar for an e-commerce platform. When a user types a prefix (e.g., "lap"), the system must instantly return the **top 3 most searched historical queries** that start with that prefix (e.g., "laptop", "laptop stand", "lap desk"). You have historical `queries[]` and their corresponding `frequencies[]`.

**Question:** Implement class `Typeahead` with `getTop3(String prefix)` returning top 3 by frequency descending, then alphabetically ascending on ties. The constructor is called once a day. `getTop3` is called millions of times per second.

---

#### Step 1: Clarifying Questions & Expected Answers

| Candidate asks                                    | Interviewer answers      | Why it matters                           |
| ------------------------------------------------- | ------------------------ | ---------------------------------------- |
| "Can two queries have the same frequency?"        | Yes, sort alphabetically | Defines tie-breaking in comparator       |
| "How many historical queries?"                    | Millions                 | Space matters — nodes are shared         |
| "Can queries have spaces or only single words?"   | Can have spaces          | Use HashMap children, not array          |
| "How often is the data refreshed?"                | Once a day               | Static after build → pre-caching is safe |
| "Is `getTop3` always called with a valid prefix?" | No, prefix may not exist | Return empty list if prefix not found    |

---

#### Step 2: Brute Force — Too Slow

```
For each getTop3(prefix) call:
  1. Scan all N queries: find those starting with prefix -> O(N * L)
  2. Sort by frequency -> O(N log N)
  3. Return top 3

With millions of QPS: completely infeasible.
```

---

#### Step 3: Standard Trie — Better, Still Slow for Dense Tries

```
Build: insert all queries into trie. Each end node stores frequency.
getTop3(prefix):
  1. Traverse to prefix node -> O(L)
  2. DFS from that node to collect all words -> O(W) where W = words under prefix
  3. Sort by frequency -> O(W log W)
  4. Return top 3

If prefix = "a": W = millions of words, DFS is too slow for realtime QPS.
```

---

#### Step 4: Hyper-Optimized Solution — Pre-Cached Top-3 at Every Node

**Key insight:** Since the trie is built once and read millions of times, pre-compute the top-3 at EVERY node during insertion. `getTop3` becomes a pure $O(L)$ lookup with zero computation.

```java
class Query implements Comparable<Query> {
    String word;
    int freq;
    Query(String w, int f) { word = w; freq = f; }

    @Override
    public int compareTo(Query other) {
        if (this.freq != other.freq) return Integer.compare(other.freq, this.freq); // desc freq
        return this.word.compareTo(other.word); // asc alphabetical on tie
    }
}

class Typeahead {
    static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>(); // queries can have spaces
        List<Query> top3 = new ArrayList<>(3); // pre-cached at this node
    }

    private final TrieNode root = new TrieNode();

    public Typeahead(String[] queries, int[] frequencies) {
        for (int i = 0; i < queries.length; i++) {
            insert(new Query(queries[i], frequencies[i]));
        }
    }

    private void insert(Query q) {
        TrieNode curr = root;
        for (char c : q.word.toCharArray()) {
            curr.children.putIfAbsent(c, new TrieNode());
            curr = curr.children.get(c);

            // Update this node's top3 cache
            curr.top3.add(q);
            Collections.sort(curr.top3);           // sort by our comparator
            if (curr.top3.size() > 3) curr.top3.remove(3); // keep only top 3
        }
    }

    // O(L) — pure traversal, no computation at query time
    public List<String> getTop3(String prefix) {
        TrieNode curr = root;
        for (char c : prefix.toCharArray()) {
            if (!curr.children.containsKey(c)) return new ArrayList<>();
            curr = curr.children.get(c);
        }

        List<String> result = new ArrayList<>();
        for (Query q : curr.top3) result.add(q.word);
        return result;
    }
}
```

**Time analysis:**
- Build: $O(N \times L \times 3 \log 3) = O(N \times L)$ — constant factor for sort of size ≤ 3
- `getTop3`: $O(L)$ — pure traversal, pre-cached result

---

#### Step 5: Follow-up Questions & Expected Answers

**Q1:** "What if frequencies update in real-time as users click suggestions? How does pre-caching break down?"

*Expected answer:*
"If a word's frequency changes, every node along its path in the trie has a potentially stale `top3` cache. Updating them requires finding and re-sorting the `top3` list at $O(L)$ nodes, each with $O(3) = O(1)$ sort. That's $O(L)$ per update — manageable if update rate is low.

But in a highly concurrent system with millions of updates per second, locking the trie for updates while reads are happening causes massive contention. The solution is to **decouple frequency storage from the trie**:
- Trie: stores word → node mapping only (static)
- Redis Sorted Sets: for each prefix node ID, a ZSET keyed by frequency stores the top results
- On frequency update: one `ZADD` + `ZREMRANGEBYRANK` to maintain top-K in Redis at $O(\log N)$
- On query: trie traversal $O(L)$ to get node ID → Redis `ZREVRANGE` $O(\log N + K)$

This is how production typeahead systems at scale (Elasticsearch, Solr) actually work."

**Q2:** "If the character set includes spaces, digits, and uppercase letters, what breaks in your implementation?"

*Expected answer:*
"The `TrieNode[26]` array and the `c - 'a'` index calculation both assume lowercase a-z. For a richer character set:
1. Replace `TrieNode[]` with `HashMap<Character, TrieNode>` — already done in the Typeahead solution above.
2. Remove the `c - 'a'` index and use the character directly as a HashMap key.
3. Memory increases since HashMap has overhead, but correctness is maintained for any Unicode character."

**Q3:** "A user types very slowly. After each character, we call `getTop3`. Can you avoid re-traversing the prefix from root every time?"

*Expected answer:*
"Yes — pass the current `TrieNode` state between keystrokes instead of the full prefix string:
```java
// Stateful session approach
class TypeaheadSession {
    TrieNode currentNode;
    String currentPrefix = "";

    TypeaheadSession(TrieNode root) { this.currentNode = root; }

    // O(1) per additional character — just advance one step in the trie
    public List<String> type(char c) {
        if (currentNode.children.containsKey(c)) {
            currentNode = currentNode.children.get(c);
            currentPrefix += c;
        } else {
            currentNode = null; // no words match
        }
        if (currentNode == null) return new ArrayList<>();
        return currentNode.top3.stream().map(q -> q.word).collect(toList());
    }

    // O(1) for backspace — need to rebuild from scratch or cache parent pointers
}
```
This reduces `getTop3` from $O(L)$ to $O(1)$ per additional keystroke. The tradeoff: backspace requires either re-traversal from root or maintaining parent pointers in each node."

---

## 12. Quick Reference: Trie Java Idioms

```java
// ── NODE DEFINITIONS ──────────────────────────────────────────────────────
// Lowercase a-z only (fastest)
static class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEndOfWord = false;
}

// General character set
static class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEndOfWord = false;
}

// With word storage (avoid path reconstruction in DFS)
static class TrieNode {
    TrieNode[] children = new TrieNode[26];
    String word = null; // null unless a complete word ends here
}

// ── CHARACTER TO INDEX ────────────────────────────────────────────────────
int idx = c - 'a';      // lowercase a=0, z=25
int idx = c - 'A';      // uppercase A=0, Z=25
int idx = c - '0';      // digits 0=0, 9=9

// ── INSERT PATTERN ────────────────────────────────────────────────────────
TrieNode curr = root;
for (char c : word.toCharArray()) {
    int idx = c - 'a';
    if (curr.children[idx] == null) curr.children[idx] = new TrieNode();
    curr = curr.children[idx];
}
curr.isEndOfWord = true;    // ALWAYS set this after the loop

// ── TRAVERSE PATTERN (returns null if path doesn't exist) ─────────────────
TrieNode curr = root;
for (char c : s.toCharArray()) {
    int idx = c - 'a';
    if (curr.children[idx] == null) return null; // path broken
    curr = curr.children[idx];
}
return curr; // node at end of s

// ── SEARCH vs STARTSWITH ──────────────────────────────────────────────────
boolean search(String word) {
    TrieNode node = traverse(word);
    return node != null && node.isEndOfWord;    // <- isEndOfWord check
}
boolean startsWith(String prefix) {
    return traverse(prefix) != null;            // <- no isEndOfWord check
}

// ── WILDCARD DFS ──────────────────────────────────────────────────────────
boolean dfs(String word, int idx, TrieNode node) {
    if (idx == word.length()) return node.isEndOfWord;
    char c = word.charAt(idx);
    if (c == '.') {
        for (TrieNode child : node.children)
            if (child != null && dfs(word, idx + 1, child)) return true;
        return false;
    }
    TrieNode next = node.children[c - 'a'];
    return next != null && dfs(word, idx + 1, next);
}

// ── GRID DFS WITH TRIE ────────────────────────────────────────────────────
// Check trie before committing to explore
TrieNode next = node.children[board[r][c] - 'a'];
if (next == null) return; // prune immediately
visited[r][c] = true;
if (next.word != null) { results.add(next.word); next.word = null; }
for (int[] dir : DIRS) dfs(board, visited, r+dir[0], c+dir[1], next, results);
visited[r][c] = false; // backtrack

// ── COLLECT ALL WORDS UNDER NODE ──────────────────────────────────────────
void collectAll(TrieNode node, StringBuilder sb, List<String> results) {
    if (node.isEndOfWord) results.add(sb.toString());
    for (int i = 0; i < 26; i++) {
        if (node.children[i] != null) {
            sb.append((char)('a' + i));
            collectAll(node.children[i], sb, results);
            sb.deleteCharAt(sb.length() - 1); // backtrack
        }
    }
}
```