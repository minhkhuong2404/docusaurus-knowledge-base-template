#!/usr/bin/env python3
"""
embed_all_dsa_diagrams.py
Embeds each DsaWeekX...Diagram component into its corresponding markdown file
under the Theory / Core Mental Model section, ensuring no duplicate imports.
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DSA_DIR = os.path.join(BASE_DIR, 'docs', 'technical-knowledge', 'dsa')

MAPPING = [
    (1, 'week-1-arrays-strings-prefix-sums.md', 'DsaWeek1ArraysDiagram'),
    (2, 'week-2-two-pointers-sliding-window.md', 'DsaWeek2TwoPointersDiagram'),
    (3, 'week-3-linked-lists-pointers.md', 'DsaWeek3LinkedListDiagram'),
    (4, 'week-4-hash-tables-sets.md', 'DsaWeek4HashTablesDiagram'),
    (5, 'week-5-stacks-queues-monotonic.md', 'DsaWeek5MonotonicStackDiagram'),
    (6, 'week-6-binary-trees-bst.md', 'DsaWeek6BinaryTreeDiagram'),
    (7, 'week-7-graph-foundations.md', 'DsaWeek7GraphFoundationsDiagram'),
    (8, 'week-8-advanced-graph-concepts.md', 'DsaWeek8TopologicalSortDiagram'),
    (9, 'week-9-binary-search.md', 'DsaWeek9BinarySearchDiagram'),
    (10, 'week-10-recursion-backtracking.md', 'DsaWeek10BacktrackingDiagram'),
    (11, 'week-11-intervals-sweep-line.md', 'DsaWeek11IntervalsDiagram'),
    (12, 'week-12-heaps-greedy.md', 'DsaWeek12HeapGreedyDiagram'),
    (13, 'week-13-dynamic-programming-1d.md', 'DsaWeek13Dp1dDiagram'),
    (14, 'week-14-dynamic-programming-2d.md', 'DsaWeek14Dp2dDiagram'),
    (15, 'week-15-advanced-sliding-windows.md', 'DsaWeek15AdvancedSlidingWindowDiagram'),
    (16, 'week-16-tries-prefix-trees.md', 'DsaWeek16TrieDiagram'),
    (17, 'week-17-shortest-paths-mst.md', 'DsaWeek17ShortestPathMstDiagram'),
    (18, 'week-18-disjoint-set-union.md', 'DsaWeek18DsuDiagram'),
    (19, 'week-19-bit-manipulation-math.md', 'DsaWeek19BitManipulationDiagram'),
    (20, 'week-20-comprehensive-review-systems.md', 'DsaWeek20LruCacheDiagram'),
]

def embed_diagrams():
    print("=" * 70)
    print("Embedding 20 DSA Interactive Diagrams into Markdown...")
    print("=" * 70)

    for week_num, filename, comp_name in MAPPING:
        filepath = os.path.join(DSA_DIR, filename)
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filename}")
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        import_stmt = f"import {comp_name} from '@site/src/components/{comp_name}';\n"

        # 1. Add import statement right after frontmatter
        if comp_name not in content:
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    content = f"---{parts[1]}---\n\n{import_stmt}{parts[2].lstrip()}"
            else:
                content = f"{import_stmt}\n{content}"

        # 2. Place component under Section 2 heading if not already present
        comp_tag = f"<{comp_name} />"
        if comp_tag not in content:
            # Match "## 2. ..."
            pattern = r'(## 2\.[^\n]+\n)'
            match = re.search(pattern, content)
            if match:
                heading_line = match.group(1)
                content = content.replace(heading_line, f"{heading_line}\n{comp_tag}\n\n", 1)
            else:
                # Fallback: place under ## 1. Overview
                pattern1 = r'(## 1\.[^\n]+\n)'
                match1 = re.search(pattern1, content)
                if match1:
                    heading_line = match1.group(1)
                    content = content.replace(heading_line, f"{heading_line}\n{comp_tag}\n\n", 1)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✓ Embedded <{comp_name} /> into {filename}")

if __name__ == '__main__':
    embed_diagrams()
