---
id: dropbox
title: Design a Distributed File Storage & Sync Service Like Dropbox
sidebar_label: 2. Dropbox (File Storage & Sync)
description: Staff-level system design breakdown for a cloud file storage and synchronization service like Dropbox or Google Drive.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Distributed File Storage & Sync Service Like Dropbox

A cloud storage and synchronization service allows users to store files on remote servers, access them from any device, and synchronize file changes automatically across multiple desktop and mobile clients in real-time.

---

## 1. Understanding the Problem

### Functional Requirements
1. **File Upload & Download**: Users can upload, download, and delete files (documents, images, videos, archives) up to 50 GB.
2. **Real-Time Cross-Device Sync**: Changes made to a file on Device A must propagate to Device B and C in near real-time (< 3s).
3. **Delta Synchronization (Chunking)**: When an existing file is modified, only the modified blocks/chunks should be uploaded, saving bandwidth.
4. **File Versioning & Revision History**: Support up to 30 days of file version history and rollback capabilities.
5. **Offline File Edits**: Users can view and edit files offline; synchronization resumes automatically upon reconnection.

### Non-Functional Requirements
- **Data Durability**: `99.999999999%` (11 9s) durability. Zero data loss on stored files.
- **Strong Consistency for Metadata**: Users must never see stale or contradictory file revision states.
- **Bandwidth & Storage Optimization**: Efficient deduplication and compression at the chunk level across the entire storage layer.
- **High Concurrency & Throughput**: Support parallel chunk uploads and downloads over unstable networks.

### Capacity Estimations & Sizing (5 Years)
- **Total Registered Users**: 500 Million users.
- **Daily Active Users (DAU)**: 100 Million users.
- **Average Files per User**: 200 files $\implies$ $500\text{M} \times 200 =$ **100 Billion total files**.
- **Average File Size**: 500 KB (accounting for text, docs, and compressed photos).
- **Total Storage (5 Years)**:
  - Raw storage = $100\text{B} \times 500\text{ KB} =$ **50 Petabytes (PB)**.
  - With 3x replication / erasure coding (EC 8+4) $\approx$ **75 PB**.
- **Metadata Storage**:
  - Each file record (path, namespace, chunk list, version, permissions) $\approx$ 1 KB.
  - $100\text{B files} \times 1\text{ KB} =$ **100 TB** in metadata database.
- **Upload / Download QPS**:
  - 100M DAU edit/sync 2 files daily $\implies$ 200M sync operations/day $\approx$ **2,300 writes/sec average (10,000 QPS peak)**.
  - Read/download QPS $\approx$ **25,000 QPS peak**.
  - Network Ingress = $2,300 \text{ writes/s} \times 500\text{ KB} \approx$ **1.15 GB/s (9.2 Gbps)**.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        USER_ACCOUNT                    │
├──────────────────┬──────────────┬──────────────────────┤
│ user_id          │ UUID         │ PRIMARY KEY          │
│ email            │ VARCHAR(255) │ UNIQUE, NOT NULL     │
│ storage_used     │ BIGINT       │ NOT NULL (Bytes)     │
│ storage_limit    │ BIGINT       │ NOT NULL (e.g. 2 TB) │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                        FILE_METADATA                   │
├──────────────────┬──────────────┬──────────────────────┤
│ file_id          │ UUID         │ PRIMARY KEY          │
│ user_id          │ UUID         │ INDEX, FK            │
│ parent_dir_id    │ UUID         │ INDEX (Hierarchy)    │
│ file_name        │ VARCHAR(255) │ NOT NULL             │
│ is_directory     │ BOOLEAN      │ DEFAULT FALSE        │
│ current_version  │ BIGINT       │ NOT NULL (Monotonic) │
│ updated_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                        FILE_VERSION                    │
├──────────────────┬──────────────┬──────────────────────┤
│ version_id       │ UUID         │ PRIMARY KEY          │
│ file_id          │ UUID         │ INDEX, FK            │
│ version_number   │ BIGINT       │ NOT NULL             │
│ total_size       │ BIGINT       │ NOT NULL             │
│ chunk_list       │ JSONB/ARRAY  │ Ordered Chunk Hashes │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                         FILE_CHUNK                     │
├──────────────────┬──────────────┬──────────────────────┤
│ chunk_hash       │ CHAR(64)     │ PRIMARY KEY (SHA-256)│
│ size_bytes       │ INT          │ Max 4 MB             │
│ s3_object_key    │ VARCHAR(255) │ S3 Path              │
│ ref_count        │ INT          │ Deduplication Count  │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Initiate File Upload (Chunk Negotiation)
```http
POST /api/v1/files/upload/initiate
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "parent_dir_id": "8f3b2a10-8021-4a56-b088-299cb84f679e",
  "file_name": "quarterly_presentation.key",
  "total_size": 16777216,
  "chunk_hashes": [
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
  ]
}
```
**Response (`200 OK`)**:
```json
{
  "upload_session_id": "sess_9128301923",
  "existing_chunks": [
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  ],
  "missing_chunks": [
    {
      "hash": "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      "upload_url": "https://storage.dropbox.com/blocks/upload?token=abc..."
    },
    {
      "hash": "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
      "upload_url": "https://storage.dropbox.com/blocks/upload?token=def..."
    },
    {
      "hash": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      "upload_url": "https://storage.dropbox.com/blocks/upload?token=ghi..."
    }
  ]
}
```
*(Notice deduplication: The client only uploads the 3 missing chunks, skipping the chunk that already exists globally in storage!)*

#### 2. Commit File Version
```http
POST /api/v1/files/upload/commit
Content-Type: application/json

{
  "upload_session_id": "sess_9128301923",
  "file_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "base_version": 4,
  "chunk_hashes": ["e3b0...", "ca97...", "4e07...", "4b22..."]
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="blob-sync" title="Dropbox Distributed File Sync & Storage Architecture" />

### Core Client & Server Subsystems

#### Client Architecture (Desktop / Mobile Client)
- **File Watcher**: Native OS kernel file system event monitor (`FSEvents` on macOS, `ReadDirectoryChangesW` on Windows, `inotify` on Linux). Detects file creation, modification, and deletion in local sync folders.
- **Chunker & Rolling Hasher**: Splits large files into deterministic 4 MB blocks using Rabin Fingerprinting.
- **Local Index DB (SQLite)**: Stores local file paths, chunk hashes, timestamps, and synchronization state.
- **Upload / Download Transfer Manager**: Manages multi-threaded parallel chunk transfers with exponential backoff and resume support.

#### Server Architecture
- **Block Storage (Amazon S3 / Custom Ceph)**: Immutable, content-addressable storage for raw encrypted 4 MB chunks.
- **Metadata Database (PostgreSQL / CockroachDB)**: Strongly consistent distributed SQL store holding file names, paths, permissions, and chunk lists.
- **Sync / Notification Service (WebSockets / Long-Polling)**: Notifies online clients when a file they watch is modified by another device.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Fixed Chunking vs Variable-Length Rolling Hash (Rabin Fingerprinting)
How do we split files to optimize delta sync when a user inserts bytes at the beginning of a 1 GB file?

```
FIXED CHUNKING (4 MB):
[Chunk 1: 0 - 4MB] [Chunk 2: 4MB - 8MB] [Chunk 3: 8MB - 12MB]
User inserts 1 byte at index 0 ➔
Every boundary shifts by 1 byte ➔ ALL chunk hashes change!
Total upload required: 1 GB (Catastrophic)

VARIABLE-LENGTH CHUNKING (Rabin Fingerprint):
Uses a sliding 48-byte window to calculate rolling checksum.
Boundary condition: if (checksum & 0x1FFFFF == 0) ➔ declare boundary.
Average chunk size: 4 MB.
User inserts 1 byte at index 0 ➔
Only Chunk 1's boundary shifts!
Chunk 2, 3, 4 remain 100% IDENTICAL hashes!
Total upload required: 4 MB (99.6% bandwidth saved!)
```

### Deep Dive 2: Cross-Device Concurrency & Merge Conflicts
What happens if User edits `presentation.key` on their laptop while offline, while simultaneously editing it on their phone?

1. **Detection Mechanism**: Every commit includes a `base_version`.
   - Laptop sends: `base_version = 5`. Server version is currently `5` $\implies$ Commit succeeds, increments to version `6`.
   - Phone was offline, now reconnects and sends: `base_version = 5`.
   - Server detects version conflict: Server is already at `6`!
2. **Conflict Resolution Strategy**:
   - The server **never silently overwrites** data (LWW is unacceptable for file storage).
   - The server rejects the phone's direct overwrite and commits the phone's version as a separate conflict branch:
     `presentation (lukes-iPhone's conflicted copy 2026-09-22).key`.
   - Both files are synced to all devices, empowering the user to inspect and merge manually.

### Deep Dive 3: Global Chunk Deduplication & Security
If two different users upload the exact same 2 GB movie file, can we store it only once?
- **Global Deduplication**: Before uploading chunks, the client queries `POST /upload/initiate` with the SHA-256 hashes of all chunks. If a chunk hash exists in the global `FILE_CHUNK` table, the server increments `ref_count` and instructs the client to skip uploading it.
- **Convergent Encryption (Security Hazard)**:
  - If chunks are encrypted with user-specific keys, two users with identical files generate different ciphertext, preventing deduplication!
  - **Solution (Convergent Encryption)**: Key = $H(\text{plaintext chunk})$. Encrypt chunk with this key. Now identical plaintext yields identical ciphertext globally, allowing deduplication while maintaining zero-knowledge at rest.

### Deep Dive 4: Notification Service Scaling (Millions of Connections)
How does Device B find out within 500ms that Device A modified a file?
- **Protocol**: HTTP Long-Polling or persistent WebSockets managed by a specialized gateway cluster (Netty / Go).
- **Pub/Sub Bus (Redis Pub/Sub / Apache Kafka)**:
  - When the Sync Service commits a file revision for `user_id = 1234`, it publishes a lightweight payload:
    `{ "user_id": 1234, "event": "METADATA_UPDATE" }` to Redis Pub/Sub.
  - The WebSocket Gateway holding open sockets for Device B receives the event and sends a poke message: `{"action": "SYNC_CHECK"}`.
  - Device B immediately contacts the Metadata Service (`GET /api/v1/files/changes?cursor=last_sync_timestamp`) to fetch the delta chunk list.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Alternative A | Alternative B | Selected Choice & Rationale |
|---|---|---|---|
| **File Chunking** | Fixed 4 MB Chunks | Content-Defined (Rabin Fingerprint) | **Rabin Fingerprinting**: Prevents shift-amplification on prepended edits. Saves massive ingress bandwidth. |
| **Storage Separation** | Monolithic File Storage | Separate Metadata DB + Block S3 | **Separation**: S3 provides 11 9s durability and cheap tiered storage ($0.023/GB); Metadata DB provides sub-10ms transactional directory traversal. |
| **Metadata Consistency** | Eventual Consistency (Cassandra) | Strong Consistency (PostgreSQL / Spanner) | **Strong Consistency**: Prevents phantom file overwrites, split-brain version numbers, and directory corruption. |
| **Client Notification** | Periodic Polling (every 30s) | Persistent WebSockets / Long-Polling | **WebSockets / Long-Polling**: Eliminates 30s latency lag; cuts battery drain and server CPU overhead from empty polling loops. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Separates file metadata from actual raw binary blob storage (S3).
- Proposes fixed-size chunking (e.g. 4 MB blocks) to handle large file uploads.
- Understands basic versioning using a version counter.
- Implements basic polling or WebSockets for cross-device sync.

### Senior (L5 / IC5)
- Explains the critical boundary shift problem of fixed-size chunking and proposes variable-length chunking (Rabin Fingerprinting).
- Designs global chunk deduplication using SHA-256 content-addressable storage.
- Handles concurrent edits gracefully via optimistic locking and conflicted copy generation.
- Sizes metadata caching and explains desktop file watcher integration (`inotify`/`FSEvents`).

### Staff+ (L6 / Principal)
- Evaluates convergent encryption security trade-offs (e.g. confirmation-of-file attacks) vs storage cost savings.
- Designs multi-datacenter cross-region metadata replication using CockroachDB or Google Spanner with Raft quorums.
- Details local desktop engine concurrency (SQLite locking, thread pool management for I/O transfers, CPU throttling during chunk hashing).
- Discusses edge acceleration (Cloudflare Direct-to-S3 pre-signed chunk uploads) bypassing application server CPU entirely.
