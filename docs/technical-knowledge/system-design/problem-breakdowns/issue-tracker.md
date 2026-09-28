---
id: issue-tracker
title: "Design an Issue Tracker & Project Management System (Jira / Linear)"
sidebar_label: "42. Issue Tracker (Jira / Linear)"
description: "Staff-level architecture for dynamic workflow state machines, optimistic concurrency control, real-time Kanban board updates via WebSockets, and high-performance issue search engines."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design an Issue Tracker & Project Management System (Jira / Linear)

Modern issue tracking platforms like Jira and Linear manage the development lifecycles of thousands of organizations. The system must support **customizable, enterprise-grade workflow state machines (e.g. Backlog $\to$ In Progress $\to$ Code Review $\to$ Done)** with custom transition guards, sub-millisecond local-first or real-time Kanban board synchronization across distributed teams, and complex filtering capabilities (e.g., Jira Query Language - JQL) over hundreds of millions of tickets.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Issue Lifecycle Management**: Create, edit, assign, prioritize, and delete issues with rich text, attachments, and hierarchical sub-tasks.
2. **Configurable Workflow State Machine**: Organizations can define arbitrary states and valid directed transitions with authorization guards and automated post-functions.
3. **Real-Time Kanban & Sprint Boards**: Multiple users dragging and dropping cards across board columns must see updates reflected in real time across all open client browsers.
4. **Issue Audit Trail (Activity History)**: Maintain an immutable chronological changelog of all field mutations, comments, and state changes.
5. **Advanced Search & Filtering (JQL)**: Filter issues by complex multi-clause expressions (e.g. `project = INFRA AND status = 'In Review' AND assignee = currentUser() ORDER BY priority DESC`).

### Non-Functional Requirements
- **Sub-50ms Board Rendering & Move Latency**: Dragging a card must reflect immediately on the screen and broadcast to peers in $< 100\text{ms}$.
- **Optimistic Concurrency Control**: Prevent concurrent conflicting updates when two team members edit the same issue simultaneously.
- **Multi-Tenant Data Isolation**: Strict tenant isolation across thousands of enterprise organizations.
- **Scale**: Support **50 Million active users** across 100,000 organizations managing **1+ Billion issues**.

### Capacity Estimations & Sizing (5 Years)
- **Active Tenants**: 100,000 organizations.
- **Total Issues**: 1 Billion issues across 5 years.
- **Issue Mutations**: 20 Million issue updates, status moves, and comments per day.
- **Storage Calculations**:
  - Issue metadata (title, status, assignee, priority, timestamps): $\sim 1\text{ KB}$ per record.
  - 1 Billion issues $\times 1\text{ KB} = \mathbf{1\text{ Terabyte}}$ base table storage.
  - Audit history & JSON changelogs: Average 15 updates per issue $\implies 15\text{ Billion audit entries} \times 200\text{ bytes} \approx \mathbf{3\text{ Terabytes}}$.
  - Attachments (images, logs, PR attachments): $50\text{ Petabytes}$ stored in Amazon S3 / Google Cloud Storage.
- **Throughput Sizing**:
  - Read QPS (board views, searches): Average 15,000 QPS, peaking at **40,000 QPS**.
  - Write QPS (card moves, comments): Average 250 QPS, peaking at **2,000 QPS**.

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                         ISSUE                          │
├──────────────────┬──────────────┬──────────────────────┤
│ issue_id         │ UUID         │ PRIMARY KEY          │
│ organization_id  │ UUID         │ Tenant Shard Key     │
│ project_key      │ VARCHAR(10)  │ E.g. "ENG", "INFRA"  │
│ issue_number     │ INT          │ Sequential per proj  │
│ title            │ VARCHAR(256) │ Summary Text         │
│ current_state_id │ UUID         │ FK to WORKFLOW_STATE │
│ assignee_id      │ UUID         │ User FK              │
│ priority         │ ENUM         │ LOW, MED, HIGH, URG  │
│ fractional_pos   │ DOUBLE       │ Board Order Rank     │
│ version          │ INT          │ Optimistic Lock Ver  │
│ updated_at       │ TIMESTAMP    │ Modification Time    │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   WORKFLOW_TRANSITION                  │
├──────────────────┬──────────────┬──────────────────────┤
│ transition_id    │ UUID         │ PRIMARY KEY          │
│ organization_id  │ UUID         │ Tenant Scope         │
│ from_state_id    │ UUID         │ Source State         │
│ to_state_id      │ UUID         │ Destination State    │
│ required_role    │ VARCHAR(64)  │ Authorization Guard  │
│ post_action_hook │ VARCHAR(128) │ Webhook / CI Trigger │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     ISSUE_AUDIT_LOG                    │
├──────────────────┬──────────────┬──────────────────────┤
│ log_id           │ INT64        │ Auto-Increment ID    │
│ issue_id         │ UUID         │ Target Issue         │
│ actor_user_id    │ UUID         │ Author of Change     │
│ field_name       │ VARCHAR(64)  │ "status", "assignee" │
│ old_value        │ TEXT         │ JSON snapshot        │
│ new_value        │ TEXT         │ JSON snapshot        │
│ created_at       │ TIMESTAMP    │ Immutable Timestamp  │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Transition Issue Status (Card Move)
```http
POST /api/v1/issues/{issue_id}/transitions
Content-Type: application/json
Authorization: Bearer <user_token>
If-Match: "version_42"

{
  "to_state_id": "state_done_4910",
  "board_id": "board_sprint_12",
  "prev_fractional_pos": 4.0,
  "next_fractional_pos": 5.0,
  "comment": "Merged in PR #412"
}
```
**Response (`200 OK`)**:
```json
{
  "issue_id": "ENG-1042",
  "new_status": "DONE",
  "version": 43,
  "new_fractional_pos": 4.5,
  "updated_at": "2026-10-01T14:22:00Z"
}
```

#### 2. Advanced Search Query (JQL)
```http
POST /api/v1/search/jql
Content-Type: application/json

{
  "jql": "project = 'ENG' AND status != 'DONE' AND priority in ('HIGH', 'URGENT') ORDER BY updated_at DESC",
  "limit": 50,
  "cursor": "eyJpZCI6IDEwNDJ9"
}
```
**Response (`200 OK`)**:
```json
{
  "total_matches": 142,
  "issues": [
    {
      "key": "ENG-1042",
      "title": "Fix memory leak in Netty WebSocket gateway",
      "status": "IN_REVIEW",
      "priority": "URGENT",
      "assignee": "alice@company.com"
    }
  ]
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="job-scheduler" title="Issue Tracker Workflow State Machine & Real-Time Sync Architecture" />

### Walkthrough of Core Flows

#### 1. The Issue State Transition & Card Move Flow
1. User drags card `ENG-1042` from *"In Review"* to *"Done"* on a Kanban board.
2. The client checks local optimistic state, rendering the card in *"Done"* immediately (0ms user lag).
3. The client sends `POST /issues/{id}/transitions` with the optimistic version header `If-Match: "42"`.
4. **The Workflow State Machine Engine**:
   - Queries the tenant's workflow schema to verify that transition `(IN_REVIEW -> DONE)` is valid.
   - Evaluates **Transition Guards** (e.g., verifying that the user has the `Developer` role and that required fields like "Resolution" are provided).
5. **Database Transaction**:
   - Updates `current_state_id`, `fractional_pos = 4.5`, increments `version = 43` in PostgreSQL/Spanner.
   - Appends a new immutable row in `ISSUE_AUDIT_LOG`.
6. **Real-Time Fanout**:
   - Publishes an `IssueUpdatedEvent` to **Redis Pub/Sub** or **Apache Kafka**.
   - Connected **WebSocket Gateway Pods** broadcast the mutation down persistent duplex sockets to all teammates currently viewing the board, smoothly animating the card into the new column.

#### 2. The Search Ingestion & Query Flow (JQL)
1. Every write to the issue table triggers a **Transactional Outbox / CDC (Change Data Capture)** event via Debezium.
2. The event stream updates the **Elasticsearch / OpenSearch** issue index within 200ms.
3. When users execute complex JQL queries, the request is parsed by a Lexer/Parser into an AST (Abstract Syntax Tree), translated into an Elasticsearch Bool/Filter query, and executed against the search cluster in $< 30\text{ms}$.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Configurable Workflow State Machine Engine
How do enterprise systems support custom customer workflows without hardcoding transitions in code?

```
┌────────────────────────────────────────────────────────┐
│             WORKFLOW DIRECTED GRAPH ENGINE             │
├────────────────────────────────────────────────────────┤
│                                                        │
│   [Backlog] ──(Start Work)──► [In Progress]            │
│       ▲                            │                   │
│       │                      (Submit PR)               │
│       │                            ▼                   │
│   (Reject) ◄─────────────── [Code Review]              │
│                                    │                   │
│                                (Merge)                 │
│                                    ▼                   │
│                                 [Done]                 │
│                                                        │
│  State Machine Verification Pipeline:                  │
│  1. Check: Does edge (Current_State -> Target) exist?  │
│  2. Evaluate Guards: User Role, Branch Rules, Approval │
│  3. Execute Atomic State Mutation                      │
│  4. Fire Post-Functions: Webhooks, Jira Automations    │
│                                                        │
└────────────────────────────────────────────────────────┘
```
- **Directed Graph Representation**: The workflow is stored as an adjacency list of transitions. Transitions specify `from_state`, `to_state`, `guard_expression`, and `post_actions`.
- **Validation**: Adding or editing a workflow requires running **Cycle and Deadlock Detectors** (Tarjan's strongly connected components algorithm) to ensure the workflow contains at least one path from Initial to Terminal state without unreachable orphan nodes.

### Deep Dive 2: Real-Time Board Concurrency & Conflict Resolution
What happens when User A and User B drag the exact same card to different columns simultaneously?
- **Optimistic Concurrency Control (OCC)**:
  - Every issue row has an integer `version` column.
  - The update query executes:
    ```sql
    UPDATE issues 
    SET current_state_id = :new_state, version = version + 1 
    WHERE issue_id = :id AND version = :expected_version;
    ```
  - **Outcome**: User A's transaction succeeds (`version` becomes 43). User B's transaction matches 0 rows and fails with HTTP `412 Precondition Failed`.
- **Client Reconciliation**: User B's client receives the `412` error, snaps the card back to its actual position, and displays a toast notification: *"Issue was moved by User A"*.

### Deep Dive 3: Fractional Indexing for Board Column Ordering
How do we support inserting an issue between two existing cards in a 5,000-issue backlog without updating 5,000 database rows?
- Same as Spotify playlists, issues use **Floating-Point Fractional Indices**:
  - Card 1: `pos = 1.0`
  - Card 2: `pos = 2.0`
  - Insert between Card 1 and 2 $\implies \mathbf{pos = 1.5}$.
- Only a single row is updated in the database.

### Deep Dive 4: JQL Lexer, Parser & Search Indexing
How is a query like `project = 'ENG' AND (labels in ('infra', 'perf') OR priority = 'HIGH')` evaluated?

```
User JQL String ──► [Lexer (Tokenize)] ──► [Recursive Descent Parser] ──► AST
                                                                          │
                                                                          ▼
                                                               Elasticsearch Query
```
1. **Lexical Analysis (Lexer)**: Breaks query string into tokens (`IDENTIFIER`, `OPERATOR`, `LPAREN`, `STRING_LITERAL`).
2. **Abstract Syntax Tree (AST)**: A recursive-descent parser builds a binary expression tree respecting operator precedence (`AND` over `OR`).
3. **Elasticsearch Translation**:
   - `project = 'ENG'` maps to `{ "term": { "project_key": "ENG" } }`.
   - `priority in ('HIGH', 'URGENT')` maps to `{ "terms": { "priority": ["HIGH", "URGENT"] } }`.
   - Wrapped in an outer `{ "bool": { "must": [...] } }` query executed against index shards.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Board Sync Protocol** | Client HTTP Polling every 5s | Stateful WebSockets via Redis Pub/Sub | **WebSockets**: Slashes server bandwidth and database read QPS by 90%; delivers immediate sub-100ms card drag animations. |
| **Search Engine** | PostgreSQL SQL `LIKE` / JSONB | Dedicated Elasticsearch / OpenSearch | **Elasticsearch**: Relational databases fail on multi-clause dynamic faceted filtering and text tokenization across millions of issues. |
| **Card Ordering** | Array Index Shifting | Fractional Indexing (`1.0, 1.5, 2.0`) | **Fractional Indexing**: Turns an $O(N)$ row-shifting write cascade into a single $O(1)$ atomic row update. |
| **Changelog Tracking** | Shadow Tables with Entire Row Duplication | JSON Patch (RFC 6902) Diff Log | **JSON Patch**: Stores only the specific field mutated, cutting audit log database storage by 80%. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Designs basic schemas for issues, projects, users, and audit logs.
- Understands status changes and proposes WebSockets or polling for board synchronization.
- Proposes standard indexing on `(project_id, status)` for list queries.

### Senior (L5 / IC5)
- Designs configurable workflow state machines with validation guards and post-action hooks.
- Implements optimistic concurrency control (`version` / `If-Match`) to resolve race conditions during concurrent moves.
- Details fractional indexing to avoid massive row-shifting write cascades.
- Explains asynchronous search indexing using transactional outbox and Elasticsearch.

### Staff+ (L6 / Principal)
- Evaluates Local-First architecture (e.g. Linear's sync engine using client-side SQLite/IndexedDB and CRDT reconciliation).
- Formulates multi-tenant data partitioning (tenant-per-schema vs shared database with row-level security).
- Designs distributed WebSocket presence systems showing avatar cursors and real-time viewing indicators across thousands of concurrent teammates.
- Formulates JQL query cost estimation engines to abort pathological user queries that could cause search cluster denial-of-service.
