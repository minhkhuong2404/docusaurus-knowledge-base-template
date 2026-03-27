---
id: trie
title: Trie (Prefix Tree)
sidebar_position: 17
description: Build and query tries for efficient prefix-based string operations
---

# 🌳 Trie (Prefix Tree)

## Concept

A **Trie** (pronounced "try") is a tree where each node represents a character, and paths from root to leaf spell out words. It excels at prefix lookups and is far more efficient than HashMap for prefix-related operations.

```
Words: ["cat", "car", "card", "care", "bat"]

        root
       /    \
      c      b
      |      |
      a      a
     / \     |
    t   r    t
       /|\
      d  e  (end)
```

---

## When to Use

- **Autocomplete** / prefix search
- Check if any word in a list **starts with** a given prefix
- **Word search** in a board (replace HashMap with Trie for efficiency)
- Longest **common prefix**
- Count words with a given prefix

---

## Java Implementation

```java
class Trie {
    private TrieNode root;

    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isEnd = false;
        int count = 0; // optional: track how many words pass through
    }

    public Trie() {
        root = new TrieNode();
    }

    // O(m) — m = word length
    public void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) {
                curr.children[idx] = new TrieNode();
            }
            curr = curr.children[idx];
            curr.count++;
        }
        curr.isEnd = true;
    }

    // O(m)
    public boolean search(String word) {
        TrieNode node = getNode(word);
        return node != null && node.isEnd;
    }

    // O(m)
    public boolean startsWith(String prefix) {
        return getNode(prefix) != null;
    }

    private TrieNode getNode(String s) {
        TrieNode curr = root;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) return null;
            curr = curr.children[idx];
        }
        return curr;
    }

    // Count how many words start with prefix — O(m)
    public int countPrefix(String prefix) {
        TrieNode node = getNode(prefix);
        return node == null ? 0 : node.count;
    }
}
```

---

## Worked Example 1: Word Search II (Trie + Backtracking)

Find all words from a dictionary that exist in a 2D board.

```java
public List<String> findWords(char[][] board, String[] words) {
    Trie trie = new Trie();
    for (String w : words) trie.insert(w);

    int m = board.length, n = board[0].length;
    Set<String> result = new HashSet<>();

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            dfs(board, i, j, trie.root, new StringBuilder(), result);
        }
    }
    return new ArrayList<>(result);
}

private void dfs(char[][] board, int r, int c, Trie.TrieNode node,
                  StringBuilder path, Set<String> result) {
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length
        || board[r][c] == '#') return;

    char ch = board[r][c];
    Trie.TrieNode next = node.children[ch - 'a'];
    if (next == null) return; // no words down this path — PRUNE

    path.append(ch);
    board[r][c] = '#'; // mark visited

    if (next.isEnd) result.add(path.toString());

    int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
    for (int[] d : dirs) {
        dfs(board, r + d[0], c + d[1], next, path, result);
    }

    board[r][c] = ch; // restore
    path.deleteCharAt(path.length() - 1);
}
```

---

## Worked Example 2: Replace Words (Dictionary Prefix)

```java
public String replaceWords(List<String> dictionary, String sentence) {
    Trie trie = new Trie();
    for (String root : dictionary) trie.insert(root);

    StringBuilder sb = new StringBuilder();
    for (String word : sentence.split(" ")) {
        if (sb.length() > 0) sb.append(' ');
        // Walk trie until we hit a word end or exhaust the trie
        Trie.TrieNode curr = trie.root;
        StringBuilder prefix = new StringBuilder();
        boolean replaced = false;
        for (char c : word.toCharArray()) {
            if (curr.children[c - 'a'] == null) break;
            curr = curr.children[c - 'a'];
            prefix.append(c);
            if (curr.isEnd) { sb.append(prefix); replaced = true; break; }
        }
        if (!replaced) sb.append(word);
    }
    return sb.toString();
}
```

---

## LeetCode Problems

### 🟡 Medium
| # | Problem | Key Idea |
|---|---|---|
| 208 | [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/) | Core Trie implementation |
| 211 | [Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | Trie + DFS for `'.'` |
| 421 | [Maximum XOR of Two Numbers in an Array](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/) | Binary Trie |
| 648 | [Replace Words](https://leetcode.com/problems/replace-words/) | Trie prefix match |
| 676 | [Implement Magic Dictionary](https://leetcode.com/problems/implement-magic-dictionary/) | Trie + fuzzy search |
| 720 | [Longest Word in Dictionary](https://leetcode.com/problems/longest-word-in-dictionary/) | Trie BFS/DFS |

### 🔴 Hard
| # | Problem | Key Idea |
|---|---|---|
| 212 | [Word Search II](https://leetcode.com/problems/word-search-ii/) | Trie + board backtrack |
| 336 | [Palindrome Pairs](https://leetcode.com/problems/palindrome-pairs/) | Trie + palindrome check |
| 745 | [Prefix and Suffix Search](https://leetcode.com/problems/prefix-and-suffix-search/) | Double Trie |
