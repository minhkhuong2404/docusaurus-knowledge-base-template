---
id: crdt-collaborative-systems
title: "CRDTs & Collaborative Systems: Operational Transformation vs Conflict-Free Replicated Data Types"
sidebar_label: 📝 CRDTs & Collaborative Systems
description: Deep dive into real-time collaborative architectures — State-based vs Operation-based CRDTs, the Join-Semilattice mathematical proof, Sequence CRDTs (RGA, Yjs, Automerge), Operational Transformation (OT in Google Docs), and tombstone garbage collection.
tags: [distributed-systems, crdt, operational-transformation, collaborative-editing, join-semilattice, yjs, system-design]
---

import CrdtCollaborativeDiagram from '@site/src/components/CrdtCollaborativeDiagram';

# CRDTs & Collaborative Systems: Operational Transformation vs CRDTs

---

When multiple users simultaneously edit a document, modify a Figma design canvas, or increment distributed counters while offline on airplanes or poor cellular connections, traditional database locking models fail. Synchronous distributed 2PC locking incurs hundreds of milliseconds of cross-continental latency, rendering real-time collaborative typing impossible.

Real-time collaborative systems solve this through two primary paradigms: **Operational Transformation (OT)** (used by Google Docs) and **Conflict-free Replicated Data Types (CRDTs)** (used by Figma, Apple Notes, Yjs, Automerge, and modern Local-First architectures).

<CrdtCollaborativeDiagram />

---

## 1. Why Collaborative Systems Are Hard

In a naive collaborative system, two users concurrently edit the text `"CAT"`:
- **User A** types `"H"` at the beginning: intended result `"CHAT"`.
- **User B** deletes the character at index 2 (`"T"`): intended result `"CA"`.

If updates are broadcast as simple character indices:
1. User A sends: `insert('H', index=1)`.
2. User B sends: `delete(index=2)`.

When User A receives User B's delete command, deleting index 2 deletes the newly inserted `'H'` instead of the intended `'T'`! The document permanently diverges into garbled text across clients.

---

## 2. Operational Transformation (OT)

Pioneered in the late 1980s and popularized by **Google Wave** and **Google Docs**, Operational Transformation resolves concurrency by transforming operation parameters against concurrently committed operations before applying them.

```
Client 1: Op1 = Insert('A', 1) ───────────┐
                                          ▼
                               [ Central OT Server ]
                               Re-indexes Op2 relative to Op1:
                               Op2' = Transform(Op2, Op1)
                                          │
Client 2: Op2 = Insert('B', 1) ───────────┘
```

### The Transformation Function $T(op1, op2)$
When two operations $op_1$ and $op_2$ are generated concurrently from the same document state:
- Client 1 applies $op_1$, then applies $T(op_2, op_1)$.
- Client 2 applies $op_2$, then applies $T(op_1, op_2)$.
- The transformation function must satisfy **Transformation Property 1 (TP1)**:
  $$op_1 \circ T(op_2, op_1) \equiv op_2 \circ T(op_1, op_2)$$

### Why OT Requires a Centralized Server
In theory, OT can operate in a peer-to-peer mesh if it satisfies **Transformation Property 2 (TP2)** (which guarantees transformation consistency regardless of execution order across 3+ peers). 

> ⚠️ **The Historical Trap**: Over 20 published peer-to-peer OT algorithms were mathematically proven flawed. In practice, **every production OT implementation (including Google Docs) relies on a single authoritative central server**. The server acts as a sequencer, establishing a canonical total order of operations. This makes pure offline, peer-to-peer, or local-first OT virtually impossible.

---

## 3. Conflict-Free Replicated Data Types (CRDT)

Formulated by Marc Shapiro et al. in 2011, **CRDTs** eliminate the need for an authoritative central server. By embedding mathematical ordering metadata into the data structure itself, CRDT replicas can independently accept mutations locally and merge concurrent updates in any order, mathematically guaranteed to converge to identical states.

### The Mathematical Proof: Join-Semilattice ($\sqcup$)
A state-based CRDT (**CvRDT**) defines a partial order $(\mathcal{S}, \le)$ and a merge operator **$\sqcup$** that forms a **bounded join-semilattice**. 

To guarantee deterministic convergence without coordination, the merge function must satisfy three algebraic properties:

$$\begin{aligned}
\text{1. Commutativity:} & \quad A \sqcup B = B \sqcup A \\
\text{2. Associativity:} & \quad (A \sqcup B) \sqcup C = A \sqcup (B \sqcup C) \\
\text{3. Idempotency:} & \quad A \sqcup A = A
\end{aligned}$$

#### Why These Properties Matter in Production:
- **Commutativity**: Network packets can arrive in any order ($A$ before $B$, or $B$ before $A$); replicas reach the exact same state.
- **Associativity**: Messages can be buffered, batched, or partitioned; intermediate grouping does not affect the outcome.
- **Idempotency**: Network retransmissions, message duplicates, and replayed Kafka streams cause zero state corruption.

---

## 4. CRDT Variants

```
                            CRDT VARIANTS
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       ▼                          ▼                          ▼
STATE-BASED (CvRDT)        OPERATION-BASED (CmRDT)     DELTA-STATE CRDTs
• Transmits entire state   • Transmits operations      • Transmits mutated deltas
• Requires semilattice ⊔   • Requires causal FIFO net  • Bounded network bandwidth
• O(State Size) bandwidth  • Smaller payloads          • Production standard (Yjs)
```

### 1. State-Based CRDTs (CvRDT / Convergent)
- Replicas transmit their **entire local state** over the network.
- The receiver applies the merge function $S_{\text{local}} = S_{\text{local}} \sqcup S_{\text{remote}}$.
- *Drawback*: Bandwidth overhead. Merging a 10MB document requires transmitting 10MB on every keystroke!

### 2. Operation-Based CRDTs (CmRDT / Commutative)
- Replicas transmit discrete **mutations/operations** rather than full state.
- Operations must commute with all concurrent operations ($o_1 \circ o_2 = o_2 \circ o_1$).
- *Drawback*: Requires an underlying causal, reliable broadcast network layer (e.g. vector clocks). If an operation is dropped or delivered out-of-order, state can permanently desynchronize.

### 3. Delta-State CRDTs (The Modern Hybrid Standard)
- Instead of transmitting the entire state (CvRDT) or relying on fragile causal message networks (CmRDT), replicas accumulate recent mutations in small **delta states** ($\Delta$).
- Only the delta state is transmitted across the wire.
- Merging deltas satisfies semilattice properties:
  $$S = S \sqcup \Delta_1 \sqcup \Delta_2$$
- This architecture powers modern high-performance libraries like **Yjs** and **Automerge**.

---

## 5. Sequence CRDTs: Real-Time Collaborative Text

Text documents are sequences of characters. In a collaborative text CRDT, characters **never use absolute array indices** (e.g., "character at index 5"). Instead, each character is assigned an immutable, globally unique, fractional position identifier:

$$\text{Character Item} = \langle \text{Position ID}, \text{Client ID}, \text{Clock}, \text{Value} \rangle$$

### Fractional Indexing & RGA (Replicated Growable Array)
When a user types between position $0.1$ and position $0.2$, the algorithm allocates an intermediate position:

$$\text{Position} = 0.15$$

If two users concurrently type at the same position, ties are deterministically broken using the unique Client ID:
$$\langle 0.15, \text{Client } A \rangle < \langle 0.15, \text{Client } B \rangle$$

All replicas sort characters by their position IDs, producing identical rendered text without consulting a central coordinator.

---

## 6. The Tombstone Problem & Garbage Collection

When a user presses Backspace to delete a character, the character **cannot simply be deleted from memory**. 

If it were purged, a concurrent packet in transit that references the deleted character as its left sibling anchor would become an orphan, corrupting text placement.

```
Original: [ H ] ──► [ E ] ──► [ L ] ──► [ L ] ──► [ O ]
User 1 deletes 'E': [ H ] ──► [ E (TOMBSTONE) ] ──► [ L ] ──► [ L ] ──► [ O ]
Concurrent User 2 inserts 'A' after 'E':
Can still anchor to 'E'! Result: [ H ] ──► [ E (TOMBSTONE) ] ──► [ A ] ──► [ L ] ...
```

### Tombstone Bloat
In long-lived collaborative documents (e.g. a legal contract edited over 6 months), deleted characters accumulate as invisible **tombstones**. A document with 5,000 visible words can easily accumulate **500,000 tombstones**, causing severe memory bloat and slow load times.

### Garbage Collection Strategies:
1. **State Vector Horizons**: Tombstones can be safely pruned when a state vector confirms that *all participating peers have acknowledged the deletion beyond the causality horizon*.
2. **Run-Length Encoding (Yjs Optimization)**: Yjs compacts sequential character insertions and deletions into continuous byte blocks, reducing tombstone memory overhead by up to 90%.

---

## 7. Operational Transformation vs CRDT Comparison

| Architectural Dimension | Operational Transformation (OT) | Conflict-Free Replicated Data Types (CRDT) |
|---|---|---|
| **Topology** | **Client-Server Centralized** | **Peer-to-Peer / Local-First / Decentralized** |
| **Network Dependency** | Constant connection to central coordinator | Fully offline-first; syncs asynchronously |
| **Correctness Proof** | Fragile (TP1 satisfied, TP2 historically flawed) | Mathematically proven (Join-Semilattice $\sqcup$) |
| **Memory Footprint** | Extremely low (No metadata per character) | Higher (Position IDs + Tombstones require RLE) |
| **Industry Deployments** | **Google Docs**, Etherpad, Microsoft Office 365 | **Figma**, Apple Notes, Yjs, Automerge, Linear |

---

## 8. Senior Interview Scenarios

### Q1: How does Figma use CRDTs for collaborative design canvases?
> **Answer**:
> Figma's multiplayer engine models a design canvas as a tree of immutable objects (frames, rectangles, text nodes). Each object has a unique ID and properties (color, dimensions, position). Figma uses a **Last-Write-Wins Register (LWW-Element-Set) CRDT** per property, combined with Fractional Indexing for layer ordering. If two designers edit the same rectangle's color concurrently, the LWW merge function resolves to the highest timestamp deterministically without server-side locking.

### Q2: Why is Last-Write-Wins (LWW) dangerous for collaborative text editing?
> **Answer**:
> LWW works for independent attributes (e.g., user profile status or shape background color), but is catastrophic for text. In text, concurrent keystrokes are additive, not mutually exclusive. If User A types "Foo" and User B concurrently types "Bar", an LWW strategy overwrites one user's typing entirely, causing silent data loss. Text editing requires **Sequence CRDTs** (like RGA or YATA) that preserve both users' characters using fractional position ordering.

---

### Compare Next
- [Time, Ordering & Unique IDs](./time-and-ordering-and-unique-ids.md)
- [CAP Theorem & PACELC](./cap-theorem.md)
- [Sharded Counters & Leaderboards](./sharded-counters-and-leaderboards.md)
