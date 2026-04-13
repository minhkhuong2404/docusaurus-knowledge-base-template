---
id: week-16-tries-prefix-trees
title: "Week 16: Tries (Prefix Trees)"
description: Master the Trie data structure for lightning-fast string manipulation. Learn to build Autocomplete systems, handle wildcard searches, and optimize multi-word grid searches in Java.
tags: [dsa, java, tries, prefix-trees, strings, algorithms, week-16]
sidebar_position: 16
---

# Week 16: Tries (Prefix Trees)

## 1. Overview
Welcome to Week 16! You have officially entered the final week of Phase 4. We are returning to trees, but with a highly specialized focus: **Tries** (pronounced "tries" or "trees"). 

A Trie, or Prefix Tree, is an $N$-ary tree designed specifically for string storage and retrieval. If you have ever wondered how Google Search provides instant autocomplete suggestions as you type, or how a spell-checker highlights a misspelled word in milliseconds, you are looking at a Trie.

**Goals for this week:**
- Understand the architecture of a `TrieNode`.
- Master the fundamental operations: `insert()`, `search()`, and `startsWith()`.
- Learn the memory vs. speed trade-off between using an Array vs. a HashMap inside your nodes.
- Master the "Trie + DFS" pattern to solve complex word search problems.

---

## 2. Theory & Fundamentals

### The Structure of a Trie
Unlike a Binary Search Tree where a node stores a complete value, a Trie node typically represents a **single character**. The path from the root to a node spells out a word.
- **Root Node:** Always empty (or represents a dummy character).
- **Edges/Children:** Each node contains links to its possible children (e.g., 26 links for lowercase English letters).
- **End of Word Flag:** A boolean `isEndOfWord` (or `isWord`) is crucial. If we insert the word "APPLE", we must mark 'E' as the end. If we then search for "APP", the path exists, but 'P' is not marked as an end, so "APP" is only a prefix, not a complete word in our dictionary.

### Time and Space Complexity
- **Time Complexity:** $O(L)$ for insertion and search, where $L$ is the length of the word. This is breathtakingly fast—independent of how many millions of words are in the dictionary!
- **Space Complexity:** $O(N \times L)$ in the worst case, where $N$ is the number of words. Tries can be incredibly memory-heavy.

### Java Specifics: Array vs. HashMap Children
To represent the children of a node, you have two choices:
1. **`TrieNode[] children = new TrieNode[26];`**
   - *Pros:* Blazing fast array lookups ($O(1)$).
   - *Cons:* Huge memory waste if the tree is sparse (many null pointers).
2. **`Map<Character, TrieNode> children = new HashMap<>();`**
   - *Pros:* Memory efficient for diverse character sets (e.g., full Unicode).
   - *Cons:* Slower due to hashing overhead. 
   - *Rule of Thumb:* Use arrays for $a-z$ LeetCode problems. Use HashMaps for real-world system design.

---

## 3. Code Templates (Java)

### Template 1: The Standard Trie Implementation
```java
class TrieNode {
    TrieNode[] children;
    boolean isEndOfWord;
    
    public TrieNode() {
        children = new TrieNode[26]; // For lowercase English letters
        isEndOfWord = false;
    }
}

class Trie {
    private TrieNode root;

    public Trie() {
        root = new TrieNode();
    }
    
    // Time: O(L)
    public void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int index = c - 'a';
            if (curr.children[index] == null) {
                curr.children[index] = new TrieNode();
            }
            curr = curr.children[index];
        }
        curr.isEndOfWord = true;
    }
    
    // Time: O(L)
    public boolean search(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int index = c - 'a';
            if (curr.children[index] == null) return false;
            curr = curr.children[index];
        }
        return curr.isEndOfWord; // Must be a complete word
    }
    
    // Time: O(L)
    public boolean startsWith(String prefix) {
        TrieNode curr = root;
        for (char c : prefix.toCharArray()) {
            int index = c - 'a';
            if (curr.children[index] == null) return false;
            curr = curr.children[index];
        }
        return true; // We don't care if it's the end of a word
    }
}
```

---

## 4. Pattern Recognition Guide

**How to spot Trie problems:**
1. **"Autocomplete", "Typeahead", "Search Suggestions":** The textbook use case for a Trie.
2. **"Find all words from a dictionary in a grid":** Instead of doing a DFS for every single word (which takes forever), put all dictionary words into a Trie, then do a single DFS on the grid, stepping through the Trie as you move.
3. **"Prefix matching" or "Wildcard searches":** If you need to search for words like `"b.d"` matching `"bad"` or `"bed"`, a Trie allows you to recursively explore all non-null children when you hit a wildcard.
4. **"Maximum XOR of two numbers":** A hyper-advanced pattern where you treat the 32 bits of an integer as a string of 1s and 0s and insert them into a Binary Trie to find the path of maximum opposite bits.
5. **"Design a data structure for dynamic string storage and retrieval":** If the problem asks you to design a system that can efficiently store and retrieve strings, especially with prefix-based queries, this is a strong signal for using a Trie.
6. **"Find the longest common prefix among a list of strings":** If the problem asks for the longest common prefix among a list of strings, this is a strong signal for using a Trie to efficiently find the shared prefix.
7. **"Find all words with a given prefix":** If the problem asks for all words in a dictionary that start with a certain prefix, this is a direct application of the Trie data structure, where you can traverse to the end of the prefix and then collect all descendant words.
8. **"Implement a spell checker":** If the problem asks you to implement a spell checker that can suggest corrections for misspelled words, this is a strong signal for using a Trie to store the dictionary and perform efficient lookups and suggestions based on prefixes.
9. **"Find the longest word in a dictionary that can be built one character at a time":** If the problem asks for the longest word in a dictionary that can be built one character at a time by other words in the dictionary, this is a strong signal for using a Trie to efficiently check for the existence of prefixes and build up valid words.
10. **"Design a search autocomplete system":** If the problem asks you to design a search autocomplete system that provides suggestions based on user input, this is a direct application of the Trie data structure, where you can store the search history and provide suggestions based on the current input prefix.

---

## 5. Worked Examples

### Example 1: LeetCode 211. Design Add and Search Words Data Structure
**Problem:** Design a data structure that supports adding new words and finding if a string matches any previously added string. The search string may contain `'.'` characters which can be matched with any letter.
**Solution (Trie + DFS for Wildcards):**
```java
class WordDictionary {
    private class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isWord = false;
    }
    
    private TrieNode root;

    public WordDictionary() {
        root = new TrieNode();
    }
    
    public void addWord(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            if (curr.children[c - 'a'] == null) {
                curr.children[c - 'a'] = new TrieNode();
            }
            curr = curr.children[c - 'a'];
        }
        curr.isWord = true;
    }
    
    public boolean search(String word) {
        return searchHelper(word, 0, root);
    }
    
    private boolean searchHelper(String word, int index, TrieNode node) {
        if (index == word.length()) return node.isWord;
        
        char c = word.charAt(index);
        
        if (c == '.') {
            // Wildcard: Try all 26 possible children
            for (int i = 0; i < 26; i++) {
                if (node.children[i] != null && searchHelper(word, index + 1, node.children[i])) {
                    return true;
                }
            }
            return false; // None of the paths worked
        } else {
            // Normal character
            if (node.children[c - 'a'] == null) return false;
            return searchHelper(word, index + 1, node.children[c - 'a']);
        }
    }
}
```

### Example 2: LeetCode 648. Replace Words
**Problem:** You are given a dictionary of roots. If a word in a sentence starts with a root, replace the word with the root. Return the modified sentence.
**Solution (Trie Prefix Matching):**
```java
class Solution {
    class TrieNode {
        TrieNode[] children = new TrieNode[26];
        String word = null; // Store the actual word at the end node for easy retrieval
    }
    
    public String replaceWords(List<String> dictionary, String sentence) {
        TrieNode root = new TrieNode();
        for (String rootWord : dictionary) {
            TrieNode curr = root;
            for (char c : rootWord.toCharArray()) {
                if (curr.children[c - 'a'] == null) curr.children[c - 'a'] = new TrieNode();
                curr = curr.children[c - 'a'];
            }
            curr.word = rootWord; // Mark the end of the root
        }
        
        StringBuilder result = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (result.length() > 0) result.append(" ");
            
            TrieNode curr = root;
            for (char c : word.toCharArray()) {
                if (curr.children[c - 'a'] == null || curr.word != null) {
                    break; // Stop if path ends or we found the shortest root
                }
                curr = curr.children[c - 'a'];
            }
            // If we found a root, append it. Otherwise, append the original word.
            result.append(curr.word != null ? curr.word : word);
        }
        
        return result.toString();
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Trie Fundamentals**
1. Implement Trie (Prefix Tree) (LC 208)
2. Design Add and Search Words Data Structure (LC 211)
3. Replace Words (LC 648)

**Day 2: Multi-Word Search (Trie + DFS/Backtracking)**
4. Word Search II (LC 212) - *The definitive Trie interview question.*
5. Implement Magic Dictionary (LC 676)
6. Longest Word in Dictionary (LC 720)

**Day 3: HashMaps & Advanced Trie Node States**
7. Map Sum Pairs (LC 677)
8. Prefix and Suffix Search (LC 745) - *Trick: Insert `suffix + { + prefix` into the Trie.*
9. Camelcase Matching (LC 1023)

**Day 4: Autocomplete & System Design Patterns**
10. Search Suggestions System (LC 1268)
11. Design Search Autocomplete System (LC 642 / Premium or Neetcode)
12. Palindrome Pairs (LC 336) - *Hard, relies on storing reversed words in a Trie.*

**Day 5: Bitwise Tries (The XOR Pattern)**
13. Maximum XOR of Two Numbers in an Array (LC 421)
14. Maximum XOR With an Element From Array (LC 1707)
15. Maximum Strong Pair XOR I (LC 2932)

**Day 6: String Combinations & Dictionaries**
16. Word Break (LC 139) - *Solve using DP, but understand how a Trie could optimize the dictionary lookup.*
17. Word Break II (LC 140)
18. Concatenated Words (LC 472)

**Day 7: Advanced String Streams**
19. Stream of Characters (LC 1032) - *Trick: Build the Trie backwards and search backwards!*
20. Multi-Search (CTCI / Custom)
21. Finding the Users Active Minutes (LC 1817) - *Cooldown Hash/String problem.*

---

## 7. Mock Interview Module

### Problem: The Real-Time Typeahead Engine
**Context:** You are building the search bar for an e-commerce platform. When a user types a prefix (e.g., "lap"), the system must instantly return the **top 3 most searched historical queries** that start with that prefix (e.g., "laptop", "laptop stand", "lap desk").
You are given an array of historical `queries` and an array of their corresponding `frequencies`. 

**Question:** Implement a class `Typeahead` with a constructor that takes the historical data, and a method `public List<String> getTop3(String prefix)` that returns the top 3 queries ordered by frequency (descending). 

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "What if two queries have the same frequency?" -> *Interviewer:* Order them alphabetically.
- *Candidate:* "How often is `getTop3` called compared to the constructor?" -> *Interviewer:* The constructor is called once a day. `getTop3` is called millions of times a second. Optimize heavily for the search.

#### Step 2: The Brute Force Idea
Explain that a brute force approach would be to iterate through all historical queries, find those that `startsWith(prefix)`, put them in a list, and sort them by frequency.
*Interviewer Critique:* "That's an $O(N \log N)$ operation every single time a user types a character. It's too slow."

#### Step 3: The Standard Trie (Good, but not great)
*Candidate's thought process:*
- I can put all words in a Trie. The final node of each word will store its `frequency`.
- When `getTop3(prefix)` is called, I traverse to the end of the prefix.
- Then, I run a DFS from that node to find *all* possible words, dump them into a Priority Queue, and pull the top 3.
*Interviewer Critique:* "If the user types 'a', you are running a DFS on almost the entire dictionary. We can do better."

#### Step 4: The Hyper-Optimized Solution (State-Caching Trie)
Recognize that since the tree is static (built once a day), we can **pre-calculate** the top 3 answers for every single node during initialization. 
Instead of running a DFS at search time, every `TrieNode` will hold a `List<String> top3`. As we insert a word, we update the `top3` list of every node we pass through.

```java
// Time: O(Prefix_Length) for search! 
// Space: O(N * L * 3) for the Trie

class Query implements Comparable<Query> {
    String word;
    int freq;
    
    public Query(String w, int f) { word = w; freq = f; }
    
    public int compareTo(Query other) {
        if (this.freq != other.freq) return Integer.compare(other.freq, this.freq); // Descending frequency
        return this.word.compareTo(other.word); // Ascending alphabetical
    }
}

class Typeahead {
    class TrieNode {
        TrieNode[] children = new TrieNode[26]; // Assuming lowercase a-z
        List<Query> top3 = new ArrayList<>(); // Cache the top 3 queries at this exact node
    }
    
    private TrieNode root;

    public Typeahead(String[] queries, int[] frequencies) {
        root = new TrieNode();
        for (int i = 0; i < queries.length; i++) {
            insert(new Query(queries[i], frequencies[i]));
        }
    }
    
    private void insert(Query q) {
        TrieNode curr = root;
        for (char c : q.word.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) curr.children[idx] = new TrieNode();
            curr = curr.children[idx];
            
            // Add the query to this node's cache
            curr.top3.add(q);
            Collections.sort(curr.top3); // Sort the list
            
            // If the list exceeds 3, evict the lowest priority item
            if (curr.top3.size() > 3) {
                curr.top3.remove(3);
            }
        }
    }
    
    public List<String> getTop3(String prefix) {
        TrieNode curr = root;
        for (char c : prefix.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) return new ArrayList<>(); // Prefix doesn't exist
            curr = curr.children[idx];
        }
        
        // Return the pre-calculated cache instantly
        List<String> res = new ArrayList<>();
        for (Query q : curr.top3) {
            res.add(q.word);
        }
        return res;
    }
}
```

#### Step 5: Follow-up Questions
*Interviewer:* "This is incredibly fast for reading. But what if this was a live system where frequencies update in real-time every time a user clicks a suggestion? How does caching the top 3 at every node break down?"
*Candidate's expected thought process:*
- If a frequency updates, the `top3` list at every node along the path might need to change. 
- Finding and updating a specific string inside the cached lists across the Trie would be extremely slow and complex to synchronize in a multi-threaded environment.
- To handle real-time updates, we would likely need to decouple the frequency data from the Trie. The Trie would only be used to find the endpoints, and we would use an external distributed cache (like Redis) backed by Sorted Sets (`ZSET`) to query the live top 3 results for a given prefix key.