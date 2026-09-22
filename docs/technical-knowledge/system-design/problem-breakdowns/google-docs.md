---
id: google-docs
title: Design a Collaborative Document Editor Like Google Docs
sidebar_label: 27. Google Docs (Collaborative Editor)
description: Staff-level system design breakdown for a real-time collaborative text editor comparing Operational Transformation (OT) and CRDT algorithms.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Collaborative Document Editor Like Google Docs

A real-time collaborative document editor (e.g., Google Docs, Notion, Figma, Overleaf) allows multiple users in different geographic locations to simultaneously view and edit the same document. Edits made by User A must appear on User B's screen in sub-100ms time without cursor jumping, overwriting text, or losing character positions, even under concurrent keystrokes and intermittent offline reconnections.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Multi-User Real-Time Editing**: Multiple collaborators can type, format, delete, and insert text in the same document concurrently.
2. **Conflict Resolution & Convergence**: All connected clients must converge on the exact same character sequence regardless of network latency or arrival order.
3. **Cursor & Selection Presence**: Display other collaborators' live cursor positions and highlighted text selections in real-time with distinct user colors.
4. **Document Revision History**: Track complete edit history; allow users to inspect historical snapshots and restore previous revisions.
5. **Offline Editing & Re-sync**: Users can continue typing while disconnected; upon reconnecting, offline edits merge cleanly without corrupting the document.

### Non-Functional Requirements
- **Sub-100ms Latency**: Local keystrokes render instantaneously ($0\text{ms}$ optimistic UI); remote keystrokes synchronize in $< 100\text{ms}$.
- **Consistency Model**: Eventual Strong Convergence (all clients viewing document $D$ at version $V$ see 100% identical characters).
- **High Concurrency per Document**: Support up to 100 simultaneous active typers in a single document without performance degradation.
- **High Scalability**: Store and serve hundreds of millions of active documents.

### Capacity Estimations & Sizing
- **Total Documents**: 500 Million active documents.
- **Active Document Sessions**: 5 Million documents open simultaneously.
- **Operation Ingress Rate**:
  - 10 Million concurrent typers typing at 3 characters/second $\implies$ **30 Million operation packets/sec** peak.
- **Operation Payload Sizing**:
  - Each edit operation: `doc_id` (16 bytes) + `user_id` (16 bytes) + `client_seq` (4 bytes) + `server_seq` (4 bytes) + `op_type` (1 byte) + `position` (4 bytes) + `char` (2 bytes) $\approx$ **50 bytes**.
  - 30M ops/sec $\times$ 50 bytes $\approx$ **1.5 GB/s (12 Gbps network ingress)**.
- **Document Snapshotting (Storage Optimization)**:
  - Storing every individual keystroke permanently consumes Petabytes of storage.
  - Documents are checkpointed every 100 operations into a compressed full-text snapshot; older raw operations are compacted and archived to cold S3 storage.

---

## 2. The Set Up

### Operational Transformation (OT) vs CRDT Comparison

```
┌───────────────────────────┬──────────────────────────────────┬──────────────────────────────────┐
│ ARCHITECTURE              │ OPERATIONAL TRANSFORMATION (OT)  │ CRDT (Conflict-free Replicated)  │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ Primary Implementation    │ Google Docs, Apache Wave         │ Figma, Apple Notes, Yjs, Notion  │
│ Topology                  │ Centralized Server Required      │ Peer-to-Peer or Client-Server    │
│ Mechanics                 │ Transforms operation coordinates │ Assigns globally unique fractional│
│                           │ based on concurrent operations.  │ IDs to every character position. │
│ Memory Overhead           │ Minimal (small operation logs)   │ Higher (each char has 32-byte ID)│
│ Implementation Complexity │ High server transform logic      │ High client data structure logic │
└───────────────────────────┴──────────────────────────────────┴──────────────────────────────────┘
```

### The API / WebSocket Wire Protocol

#### 1. Real-Time Edit Operation Frame (Client $\leftrightarrow$ Server)
```json
{
  "type": "OPERATION",
  "doc_id": "doc_88192a01",
  "client_version": 42,
  "operation": {
    "type": "INSERT", // "INSERT", "DELETE", "REPLACE"
    "position": 14,
    "text": "Hello ",
    "attributes": {"bold": true}
  }
}
```

#### 2. Live Cursor Telemetry Frame
```json
{
  "type": "CURSOR_UPDATE",
  "user_id": "usr_441029",
  "cursor_position": 20,
  "selection_range": [20, 26],
  "color": "#38bdf8"
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="blob-sync" title="Google Docs Real-Time Collaborative Editing & OT Architecture" />

### Walkthrough of the Operational Transformation (OT) Pipeline

#### 1. Local Optimistic Execution (0ms)
1. User A types a character at index 14.
2. The client editor renders the character **instantaneously** on screen without waiting for the network.
3. The operation is placed into the local client buffer waiting for server acknowledgment.

#### 2. Server Coordination & Transformation (The Jupiter Model)
1. User A's operation arrives at the **Document Session Server** over a persistent WebSocket.
2. The Session Server holds the **Authoritative Document Log**:
   - Compares User A's `client_version` against the current `server_version`.
   - **Case A: Versions Match (No Concurrent Edits)**:
     - Applies operation directly to the document state.
     - Increments `server_version`.
     - Broadcasts operation to all other connected collaborators.
   - **Case B: Concurrent Edits Occurred (Version Divergence)**:
     - User B also inserted text while User A was typing!
     - The server executes the **Transformation Function**: $T(\text{Op}_A, \text{Op}_B)$.
     - Adjusts the index coordinates of User A's operation to account for User B's preceding insertion.
     - Applies the transformed operation $\text{Op}_A'$ to the document.
     - Broadcasts $\text{Op}_A'$ to all collaborators.

#### 3. Client Acknowledgment & Convergence
1. User A receives the server ACK and empties their local buffer.
2. User B receives the transformed operation $\text{Op}_A'$, transforms it against their own local pending buffer, and updates the editor DOM.
3. Both User A and User B now have **100% identical character strings** on their screens.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Operational Transformation (OT) Transformation Function $T(op_1, op_2)$
How does OT mathematically shift character indexes to preserve user intent?

```
Initial Document State: "CAT" (Indices: C=0, A=1, T=2)

User A inserts "H" at index 0 ➔ Wants: "HCAT"
User B inserts "S" at index 3 ➔ Wants: "CATS"

Operations sent concurrently to Server:
Op_A: Insert("H", at: 0) [based on version 0]
Op_B: Insert("S", at: 3) [based on version 0]

Server receives Op_A first:
- Applies Op_A ➔ Server state becomes "HCAT" (length 4).
- Now Op_B arrives! If we apply Op_B naively at index 3, it inserts "S" BEFORE "T" ➔ "HCST"! (CORRUPTED!)

Transformation Function T(Op_B, Op_A):
- Since Op_A inserted 1 character at index 0 (which is BEFORE Op_B's index 3):
- Op_B's index must be shifted forward by +1!
➔ Transformed Op_B' = Insert("S", at: 3 + 1 = 4).
- Server applies Op_B' ➔ Final Server state: "HCATS"!
➔ Perfect convergence! User intent is 100% preserved.
```

### Deep Dive 2: Document Session Affinity & WebSockets Routing
How do 100 users collaborating on the same document ensure all their operations hit the exact same server?
- **The Single-Leader Requirement in OT**:
  - In Operational Transformation, an authoritative single leader is required per active document to sequence operations deterministically.
- **Consistent Hashing by `doc_id`**:
  - When User A opens `doc_123`, the API Gateway routes the WebSocket connection to the **Document Session Server** owning `hash("doc_123") % N`.
  - All other users opening `doc_123` are routed to the **exact same server instance**.
- **Server Failover (ZooKeeper / Redis Ephemeral Locks)**:
  - If the session server hosting `doc_123` crashes, an adjacent server in the consistent hash ring takes over, loads the last snapshot from S3, replays any uncommitted operations from Redis, and resumes the session within 2 seconds.

### Deep Dive 3: Document Compaction & Snapshotting Strategy
If a team collaborates on a 50-page document for 3 months, it accumulates over **10 Million individual operations**.
- **The Cold-Start Trap**: If a new collaborator opens the document, fetching and replaying 10 Million individual keystrokes in the browser would take 15 minutes and freeze the browser tab!
- **Compaction Architecture**:
  1. Every **100 operations**, the Document Session Server writes an in-memory snapshot of the full document text to Redis.
  2. Every **1,000 operations**, a compressed snapshot is persisted to PostgreSQL and Amazon S3.
  3. When a new user opens the document:
     - Server sends the **latest snapshot** (e.g. Version 10,000).
     - Server appends only the recent operations since that snapshot (Operations 10,001 to 10,042).
     - Initial load finishes in **under 200ms**!

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Concurrency Model** | Operational Transformation (OT) | CRDT (e.g. Yjs / Automerge) | **Operational Transformation (OT)**: Google Docs uses OT because text character memory overhead is negligible (0 bytes overhead per char) compared to CRDTs which require 32+ bytes of metadata per character. |
| **Session Routing** | Any Gateway Node (Multi-Leader) | Consistent Hash Affinity to Single Leader | **Single-Leader Affinity**: OT requires a strict global ordering sequence for operations. Single-node ownership per active document simplifies transformation and avoids distributed consensus pauses. |
| **History Storage** | Store every raw keystroke forever | Periodic Checkpoint Snapshots + Compaction | **Periodic Snapshots**: Reduces document loading time from minutes to milliseconds and slashes storage costs by 98%. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the challenges of concurrent typing and race conditions.
- Designs schemas for Documents, Users, and Operations.
- Understands persistent WebSocket connections for real-time synchronization.
- Proposes optimistic local UI rendering for instant typing feedback.

### Senior (L5 / IC5)
- Details the **Operational Transformation (OT)** algorithm and demonstrates index shifting math ($T(op_1, op_2)$).
- Compares OT with CRDTs (memory overhead vs architectural complexity).
- Designs consistent hashing session affinity to route all document collaborators to the same server.
- Implements periodic document snapshotting and compaction to prevent slow cold-start loading times.

### Staff+ (L6 / Principal)
- Evaluates offline-to-online reconciliation: Merging large offline branches without creating catastrophic transformation latency storms on the session server.
- Designs multi-region active-active document collaboration: Handling cross-continental document collaboration (e.g. US and Tokyo engineers editing simultaneously) with sub-100ms local edge responses.
- Details cursor jitter smoothing and differential broadcast throttling: Compressing live cursor position broadcasts to 30Hz to prevent mobile DOM reflow thrashing.
