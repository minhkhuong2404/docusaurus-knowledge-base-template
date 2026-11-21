---
id: large-blobs
title: Handling Large Blobs & Object Storage
sidebar_label: Large Blob Storage
description: Senior-level patterns for storing and delivering large binary objects (images, videos). Covers object storage mechanics, chunked uploads, CDN delivery, and presigned URLs.
sidebar_position: 2
tags: [System Design, Storage, Blob, S3, CDN, Chunking, Multipart, File Upload]
---

import ObjectStorageArchitectureDiagram from '@site/src/components/ObjectStorageArchitectureDiagram';

# Handling Large Blobs

> **Reference**: [Sujeet Pro — Blob Storage Design](https://sujeet.pro/articles/blob-storage-design)
>
> **The Golden Rule:** Never store large binary files in your relational database. Use purpose-built object storage.

When designing large-scale systems like Instagram, Dropbox, or Netflix, handling Binary Large Objects (BLOBs) requires specific architectural patterns to avoid crippling your application servers and databases.

---

# Object Storage in System Design: A Senior Engineer's Deep Dive

Object storage is functionally a database optimized specifically for handling Binary Large Objects (BLOBs). While traditional databases manage highly structured data, object stores are built to handle unstructured data like images, videos, JSON documents, log files, and machine learning training sets. 

## Why Not Store Files in a Relational Database?

For junior engineers, storing a user's profile image right next to their user record in a relational database (like PostgreSQL) might seem logically convenient. However, traditional OLTP databases are built for small, frequently changing records and rich query patterns (joins, aggregations). 

Here is what happens at the storage-engine level when you cram BLOBs into an RDBMS:

* **Page Bloat & Memory Pressure:** PostgreSQL internally packs rows into 8-kilobyte pages. If you store a 4-megabyte image, that single asset spans roughly 500 database pages. When running a seemingly simple query (e.g., fetching the top 50 users), the database must manage these massive rows, blowing out the buffer cache, increasing memory pressure, and destroying query performance.
* **Replication Lag & Bandwidth:** In distributed environments, every write goes to a Write-Ahead Log (WAL) and is streamed to read-replicas. A 4MB blob write consumes massive internal network bandwidth and aggressively spikes replication lag across your database cluster.
* **Backup and Restore Paralysis:** Database snapshots become bloated with static binary files. A restoration process that should optimally take minutes in a disaster recovery scenario will take long hours.

## Under the Hood: The Mechanics of Object Storage

Under the hood, object storage abstracts away standard block/file system hierarchies, persisting data across clusters of cheap, commodity storage nodes (standard disks on standard racks). 

When a client requests a file, they interact with a **Metadata Service**. This service maintains a highly optimized index mapping object keys to the specific physical servers (e.g., Server A, Server B) holding the data. The target server then streams the byte array directly back to the client.

### The Three Pillars of Cost & Durability

1. **Flat Namespaces (O(1) Lookups):** Traditional file systems use hierarchical directory trees (POSIX), requiring traversal. Object storage utilizes a completely flat structure—a single string key. *Note: The "folders" or "directories" you see in AWS S3 or GCP interfaces are purely UI syntactic sugar parsing the `/` delimiter in the string name.* This flat nature makes index lookups blazingly fast.
2. **Immutable Writes:** You cannot mutate bytes in the middle of a file in object storage; you can only overwrite the entire file or create a newly versioned object. *Senior Context:* By sacrificing POSIX-style random-write capabilities, the storage engine completely eliminates the need for distributed locks and race-condition handling. Lock-free architecture equals massive horizontal scalability.
3. **Massive Redundancy (11 Nines):** To achieve 99.999999999% durability, files are distributed across multiple servers, racks, and often availability zones. 
    * *Senior Deep Dive - Erasure Coding:* The video touches upon Erasure Coding. Rather than naive 3x replication (which has a 300% storage overhead), modern object stores use algorithms like Reed-Solomon. An object is broken into *data fragments* and *parity fragments*. If an object is split into 4 data chunks and 2 parity chunks, it can survive the loss of *any* 2 drives while only incurring a 50% storage overhead. When a node fails, the system automatically heals in the background.

## Critical System Design Interview Patterns

When designing large-scale systems (e.g., Instagram, Dropbox, or Twitter), three architectural patterns are vital.

### 1. The Separation of Metadata and Blob Data
Never store metadata inside object storage. Object stores lack secondary indexing and query capabilities. 
* **The Pattern:** Store the actual file (image, video) in the Object Store (e.g., Amazon S3, Azure Blob Storage). Store the file's metadata (User ID, creation date, permissions, and the S3 URI/URL) in your relational database or NoSQL store.

### 2. Pre-Signed URLs (The "Direct-to-Cloud" Pattern)
Having a client upload a 1GB video to your backend API server, only for your server to upload it to S3, is an anti-pattern. It doubles network bandwidth, wastes expensive compute memory, and chokes your API gateways.
* **The Pattern:** The client requests a **Pre-Signed URL** from your backend. Your backend validates the user's session, checks permissions, and generates a time-bound URL (e.g., valid for 30 minutes) using IAM credentials. The client then performs an HTTP `PUT` directly to the Object Store, completely bypassing your application servers.

### 3. Multipart Uploads

<ObjectStorageArchitectureDiagram initialTab="multipart" />

Transferring large files over unreliable networks (like mobile connections) via a single stream is prone to failure. Furthermore, many load balancers and APIs have strict HTTP payload limits.
* **The Pattern:** Use **Multipart Upload**. The client chunks a massive file into smaller, fixed-size pieces (e.g., 5MB chunks). These chunks can be uploaded sequentially, or even in parallel to maximize throughput. Once all chunks are received, the object store stitches them back together into the contiguous file. *Senior Context:* If a chunk upload fails due to network partition, only that specific 5MB chunk needs to be retried, not the entire 10GB file.

---

## 1. Storage Options

<ObjectStorageArchitectureDiagram initialTab="comparison" />

| Storage Type       | Examples                 | Use For                             | Characteristics                                             |
| ------------------ | ------------------------ | ----------------------------------- | ----------------------------------------------------------- |
| **Object Storage** | S3, GCS, Azure Blob      | Images, videos, ML data, backups    | Flat namespace, RESTful API, high latency, highly scalable. |
| **Block Storage**  | EBS, GCP Persistent Disk | Databases, VM OS disks              | Attached directly to instances, low latency, raw blocks.    |
| **File System**    | EFS, NFS                 | Shared filesystems across instances | Hierarchical tree (POSIX), attached to multiple instances.  |
| **CDN**            | CloudFront, Fastly       | Read-heavy delivery at the edge     | Caches static assets geographically closer to users.        |

---

## 2. Under the Hood: Object Storage Mechanics

Object storage is fundamentally different from a standard file system. It relies on three core pillars:

1. **Flat Namespaces (O(1) Lookups):** Unlike standard file systems with nested directory trees, object storage uses a completely flat key-value structure. (The "folders" you see in the S3 UI are just syntactic sugar parsing the `/` character). This allows for blazingly fast index lookups.
2. **Immutable Writes:** You cannot modify a few bytes in the middle of an object. You must overwrite the entire file or create a new version. By sacrificing random-write capabilities, the storage engine eliminates distributed locks, allowing for massive horizontal scalability.
3. **Erasure Coding & Durability:** To achieve 11 nines (99.999999999%) of durability, objects aren't simply replicated 3x (which wastes space). They are split into data and parity fragments using Erasure Coding (e.g., Reed-Solomon) and distributed across servers and data centers. 

### Why Not Store Blobs in a Relational DB?
It might seem convenient to store a profile picture next to a user's record, but it will destroy your database performance:
* **Page Bloat:** Databases like PostgreSQL pack rows into 8-kilobyte pages. A 4MB image spans ~500 pages. Fetching a list of users now requires the DB to pull massive amounts of data into memory, destroying the buffer cache.
* **Replication Lag:** Every write goes to a Write-Ahead Log (WAL). Streaming multi-megabyte blob writes to read-replicas consumes massive internal bandwidth and spikes replication lag.
* **Backup Paralysis:** Database snapshots become bloated with static binary files, turning a 5-minute disaster recovery restoration into a multi-hour nightmare.

---

## 3. The Core Architecture: Separation of Concerns

<ObjectStorageArchitectureDiagram initialTab="presigned" />

Always separate your **Metadata** from your **Blob Data**.

---

## 4. The Direct Upload Pattern (Presigned URLs)

For large files, **never proxy uploads through your API server**. It doubles network bandwidth, wastes memory, and blocks concurrent connections.

1. Client requests a presigned URL from the API server.
2. API server validates permissions and generates a time-bound URL (temporary auth token).
3. Client performs an HTTP `PUT` directly to S3.
4. Client notifies the API server of completion to update metadata.

### Spring Boot Example: Generating Presigned URLs

```java
@Service
public class FileUploadService {
    @Autowired private S3Presigner presigner;

    public String generatePresignedUploadUrl(String fileName, String contentType) {
        String key = UUID.randomUUID() + "/" + fileName;

        PutObjectPresignRequest request = PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(15)) // Time-bound security
            .putObjectRequest(r -> r
                .bucket("my-uploads")
                .key(key)
                .contentType(contentType)
            )
            .build();

        PresignedPutObjectRequest presigned = presigner.presignPutObject(request);
        return presigned.url().toString();
    }
}
```

---

## 5. Chunked / Multipart Upload

For files > 100 MB, a single network stream is prone to failure and API payload limits. 

**The Pattern:** Split the file into chunks (e.g., 5MB), upload them in parallel, and have the object store stitch them together.

```text
File (5 GB)
  ├── Chunk 1 (5 MB) ──→ S3 UploadPart 1
  ├── Chunk 2 (5 MB) ──→ S3 UploadPart 2  (parallel)
  ├── Chunk N (5 MB) ──→ S3 UploadPart N  (parallel)
        ↓
    CompleteMultipartUpload → S3 merges chunks
```

**Benefits:**
* **Resumable:** If the network drops at chunk 30, retry *only* chunk 30.
* **Parallel:** High throughput via simultaneous uploads.

### S3 Multipart Upload with AWS SDK v2

```java
@Service
public class MultipartUploadService {
    @Autowired private S3AsyncClient s3;

    public CompletableFuture<String> uploadLargeFile(String bucket, String key, Path file) {
        return s3.createMultipartUpload(r -> r.bucket(bucket).key(key))
            .thenCompose(initResponse -> {
                String uploadId = initResponse.uploadId();
                // Split file into chunks and upload in parallel
                return uploadParts(bucket, key, uploadId, file)
                    .thenCompose(parts -> s3.completeMultipartUpload(r -> r
                        .bucket(bucket).key(key).uploadId(uploadId)
                        .multipartUpload(u -> u.parts(parts))
                    ));
            })
            .thenApply(r -> "s3://" + bucket + "/" + key);
    }
}
```

---

## 6. Edge Delivery (CDN)

To serve assets globally with low latency, place a CDN (Content Delivery Network) in front of your Object Store.

### Read Path
* **Cache Hit:** `Client → CDN Edge → Return cached file`
* **Cache Miss:** `Client → CDN Edge → Origin (S3) → CDN caches → Client`

### Cache Control Strategies
```text
Cache-Control: public, max-age=31536000, immutable   # Versioned assets (1 year)
Cache-Control: public, max-age=3600                  # Profile images (1 hour)
Cache-Control: private, no-store                     # Private/sensitive documents
```

*Pro Tip:* Use **Content-Addressed Storage (Hash-based URLs)** like `https://cdn.example.com/img/abc123hash.jpg`. Because the URL is tied to the file's exact contents, you can set the cache to immutable. If the image changes, the hash changes, generating a new URL and naturally busting the cache.

---

## 7. Asynchronous Image Processing Pipeline

Don't process heavy images synchronously during the user request. Use an event-driven architecture.

```text
Upload → S3 Raw Bucket
           ↓ 
      (S3 Event triggers SQS/Lambda Worker)
           ↓
      Image Processor
           ├── Resize to thumbnails (128p, 256p, 1024p)
           ├── Convert format (e.g., JPEG to WebP)
           └── Store in S3 Processed Bucket
                    ↓
               Update Metadata DB (image_url, formats)
```

### Spring + SQS Event Listener

```java
@SqsListener("image-processing-queue")
public void processImage(S3EventNotification event) {
    String key = event.getRecords().get(0).getS3().getObject().getKey();
    BufferedImage original = imageLoader.load(key);

    for (ImageSize size : ImageSize.values()) {
        BufferedImage resized = imageResizer.resize(original, size);
        String processedKey = "processed/" + size.name().toLowerCase() + "/" + key;
        s3.putObject("processed-bucket", processedKey, toInputStream(resized));
    }
}
```

---

## 8. Advanced Download & Storage Strategies

### Deduplication
Save storage costs by avoiding duplicate uploads using content-based addressing. Hash the file content on the client or server. If the hash already exists as a key in S3, link the new user to the existing object instead of uploading it again.

### Range Requests
For streaming video or pausing downloads, clients use the `Range` HTTP header to request specific byte ranges.
```text
GET /video/movie.mp4
Range: bytes=1048576-2097151   → Returns 206 Partial Content
```

### Resumable Upload Protocol (TUS)
For highly unstable connections, consider an open protocol like [TUS](https://tus.io/) which standardizes resumable uploads.
```text
POST   /files                    → Create upload resource, get Location
PATCH  /files/{id}?offset=0      → Upload bytes 0 to N
PATCH  /files/{id}?offset=N      → Upload bytes N to M (resume)
```

---

## 9. Hyperscale Blob Storage Internals (Amazon S3, Meta Haystack & Tectonic, Azure Blob)

> **Reference**: [Sujeet Pro — Blob Storage Design](https://sujeet.pro/articles/blob-storage-design)

When an interviewer asks *"Design Amazon S3 or Azure Blob Storage from scratch"* (rather than merely consuming S3 via Presigned URLs), a Staff/Principal candidate must break down the internal storage engine across five architectural pillars:

### 1. Strict Separation of Metadata Plane vs. Data Plane

Hyperscale object stores decouple **namespace/index lookups** from **raw byte streaming** so neither becomes a bottleneck for the other:

```
                      ┌─────────────────────────────────────────┐
                      │         Client / API Gateway            │
                      │   (Auth, Rate Limiting, Multipart API)  │
                      └────────────────────┬────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │ 1. Resolve Key -> Block Placement           │ 2. Stream Raw Byte Chunks
                    ▼                                             ▼
    ┌───────────────────────────────────────┐     ┌───────────────────────────────────────┐
    │       CONTROL / METADATA PLANE        │     │              DATA PLANE               │
    │  • Partitioned Distributed KV Store   │     │  • Stateless Placement / Stream Nodes │
    │    (Spanner / CockroachDB / Shard KV) │     │  • Append-Only Superblocks / Volumes  │
    │  • Maps: (Bucket, Key, Version) ──►   │     │  • Reed-Solomon / LRC Erasure Coding  │
    │    [ChunkID_1, ChunkID_2, ...]        │     │  • Background Scrubbing & Compaction  │
    │  • Tracks Volume->DataNode Placement  │     │  • Direct NVMe / HDD Extent Storage   │
    └───────────────────────────────────────┘     └───────────────────────────────────────┘
```

- **Metadata Plane (Partitioned Key-Value Index)**: Stores `Bucket + ObjectKey + VersionID -> {Size, ETag, ACLs, List<ChunkID>}`. Because S3 keys are lexicographically indexed, legacy systems suffered hot partitions when users used sequential prefixes (e.g., `2026-11-14/...`). Modern metadata stores automatically split hot key-ranges across distributed range/hash shards on SSDs, sustaining millions of metadata lookups per second.
- **Data Plane (Extent / Volume Storage Nodes)**: Stores immutable blocks (Chunks/Extents, typically `4 MB – 64 MB` each) across thousands of commodity storage servers. The API gateway or placement coordinator streams chunks directly to/from the Data Nodes without routing gigabytes of payload through the Metadata DB.

---

### 2. The Small-File Metadata Amplification Problem & Meta Haystack / Tectonic Superblocks

Why can't a hyperscale object store simply save each uploaded photo as an individual file (`/mnt/disk1/bucket/photo123.jpg`) on a standard POSIX filesystem like `ext4` or `XFS`?

- **The POSIX Inode Bottleneck (3 Disk Seeks per Read)**:
  1. Reading `/bucket/photo123.jpg` on POSIX requires reading the directory entry, then reading the **inode metadata** (`128–256 bytes`) from disk into RAM, and finally seeking to the **data block** on disk.
  2. At **100 billion small photos**, the inodes alone consume **25+ TB of RAM**, making it impossible to fit all filesystem metadata in memory. Every cache miss on an inode incurs **2–3 rotational disk seeks (~20–30 ms)**, collapsing throughput to `< 100 IOPS` per drive.
- **The Haystack / Superblock Solution (1 Disk Seek per Read)**:
  - **Append-Only Physical Volumes (Superblocks)**: Instead of creating millions of tiny OS files, the storage node pre-allocates massive **10 GB – 100 GB append-only Volume files** (`/data/volume_402`—a single POSIX inode!).
  - **Needle Packing**: Millions of small blobs (**"Needles"**) are appended sequentially inside the Superblock:
    ```
    ┌──────────────┬───────────┬────────┬───────────┬─────────────────────┬──────────┬──────────┐
    │ Magic Header │ Cookie    │ Key ID │ Flags/Del │ Size (Bytes)        │ Payload  │ Checksum │
    │ (4 Bytes)    │ (Random)  │ (64b)  │ (8b)      │ (32b)               │ (N Bytes)│ (CRC32)  │
    └──────────────┴───────────┴────────┴───────────┴─────────────────────┴──────────┴──────────┘
    ```
  - **Compact In-Memory Index (~10 Bytes per Blob)**: Because the Data Node only tracks `BlobKey -> (VolumeID, ByteOffset, ByteSize, Flags)`, the in-memory index entry shrinks to **~10–12 bytes per object**. Ten million blobs on a disk require only **~100 MB of RAM**!
  - **Result**: Every blob read knows its exact `(VolumeFD, Offset, Length)` from RAM and executes a single `pread(fd, buf, length, offset)` syscall—achieving **strictly 1 disk seek per read**!
  - **Meta Tectonic Evolution**: Consolidates Haystack (hot small files) and f4 (warm/cold blobs) into a unified exabyte-scale storage fabric where small appends are buffered into log-structured partial blocks for instant read-after-write visibility before asynchronous sealing into erasure-coded stripes.

---

### 3. Content-Defined Chunking (Rabin Fingerprinting) & SHA-256 Deduplication

When storing large files that undergo small edits (e.g., VM images, container layers, video projects, or Dropbox/S3 backup archives), **Fixed-Size Chunking** (`split every 4 MB`) fails catastrophically:

- **The Byte-Shift Catastrophe of Fixed Chunking**: If a user inserts **1 single byte** at offset `0` of a `1 GB` file, every subsequent 4 MB boundary shifts by 1 byte. All **250 chunks produce completely new SHA-256 hashes**, resulting in **0% deduplication** and re-uploading the entire `1 GB`!
- **Content-Defined Chunking (CDC) via Rabin Fingerprinting**:
  - Instead of slicing at static byte offsets, the client slides a **48-byte rolling window** byte-by-byte across the stream and computes a fast **Rabin Karp Polynomial Rolling Hash** $R(w)$.
  - Whenever the lowest $k$ bits of the rolling hash equal zero (e.g., $R(w) \bmod 2^{22} == 0$, yielding an average chunk size of $4\text{ MB}$, bounded between `min=1MB` and `max=8MB`), a **natural content cut-point** is declared!
  - Each variable-length chunk is then hashed with **cryptographic `SHA-256`**. If a byte is inserted at the start of the file, **only the first chunk changes**—all subsequent chunk boundaries re-synchronize automatically at the next rolling hash match!

```java
// Simplified Content-Defined Chunking (Rolling Hash Cut-Point Detector)
public final class ContentDefinedChunker {
    private static final int MIN_CHUNK = 1024 * 1024;      // 1 MB minimum
    private static final int MAX_CHUNK = 8 * 1024 * 1024;  // 8 MB maximum
    private static final long MASK = (1L << 22) - 1;       // Avg 4 MB cut boundary (2^22)

    public List<ChunkDescriptor> chunkAndHash(byte[] data) throws Exception {
        List<ChunkDescriptor> chunks = new ArrayList<>();
        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
        int chunkStart = 0;
        long rollingHash = 0;

        for (int i = 0; i < data.length; i++) {
            rollingHash = ((rollingHash << 1) + (data[i] & 0xFF)) ^ 0x5bd1e995L;
            int currentLen = i - chunkStart + 1;

            boolean isBoundary = (currentLen >= MIN_CHUNK && (rollingHash & MASK) == 0)
                                 || (currentLen >= MAX_CHUNK)
                                 || (i == data.length - 1);

            if (isBoundary) {
                sha256.reset();
                sha256.update(data, chunkStart, currentLen);
                String chunkSha256 = HexFormat.of().formatHex(sha256.digest());
                chunks.add(new ChunkDescriptor(chunkSha256, chunkStart, currentLen));
                chunkStart = i + 1;
                rollingHash = 0;
            }
        }
        return chunks;
    }

    public record ChunkDescriptor(String sha256, int offset, int length) {}
}
```

---

### 4. Durability Math: 3x Replication vs. Reed-Solomon ($k+m$) vs. Local Reconstruction Codes (LRC)

How do cloud providers guarantee **11 Nines ($99.999999999\%$) of annual durability** across exabytes of disk drives without bankrupting themselves on hardware?

| Redundancy Scheme | Configuration Example | Storage Overhead | Fault Tolerance | Single-Node Rebuild Network I/O Cost | Production Users |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **3x Replication** | 3 full copies across 3 racks/AZs | **3.0x (+200%)** | Survives **2** failures | **1x** (Read 1 surviving copy over network) | Hot WALs, metadata logs, HDFS |
| **Reed-Solomon ($RS(k, m)$)** | $k=10$ data + $m=4$ parity (`RS(10,4)`) | **1.4x (+40%)** | Survives **any 4** failures | **10x** (Must read all **10 surviving chunks** across racks to reconstruct 1 lost chunk!) | S3 Standard, Meta f4, Backblaze Vaults |
| **Local Reconstruction Codes ($LRC(k, l, r)$)** | $k=12$ data split into $l=2$ local groups (6+6) + $2$ local parities + $r=2$ global parities (`12+2+2 = 16`) | **1.33x (+33%)** | Survives **any 3** failures (and up to 4) | **6x (50% less network I/O!)** Single-disk failure is repaired using only the **6 local group blocks** instead of all 12! | **Azure Blob Storage**, **Meta Tectonic** |

- **Why LRC (Locally Repairable Codes) Beats Classical Reed-Solomon at Exabyte Scale**:
  - In a datacenter with 500,000 hard drives, **single-disk failures account for >90% of all repair events**.
  - With `RS(10, 4)`, repairing one dead $16\text{ TB}$ drive requires reading $10 \times 16\text{ TB} = \mathbf{160\text{ TB}}$ across top-of-rack switches, saturating cluster bisection bandwidth.
  - **LRC** divides the $k=12$ data fragments into two local subgroups of 6 fragments (`D1..D6` with Local Parity `LP1`, and `D7..D12` with Local Parity `LP2`), plus 2 Global Parities (`GP1, GP2`). If `D3` dies, the repair worker reads only `D1, D2, D4, D5, D6, LP1` (**6 chunks instead of 12**), cutting cross-rack reconstruction network traffic and repair latency in half!

---

### 5. Storage Tiering, Lifecycle Engines & Background Garbage Collection

1. **Automated Storage Tiering (Hot $\rightarrow$ Warm $\rightarrow$ Cold)**:
   - **Hot Tier (NVMe / High-IOPS SSD)**: Newly written small blobs and frequently accessed metadata; often 3x replicated or LRC-coded with aggressive caching.
   - **Warm / Cool Tier (High-Density SMR HDD + LRC/RS)**: Objects untouched for $\ge 30$ days are transparently migrated to high-density 20+ TB spinning hard drives encoded with `LRC(12,2,2)` or `RS(10,4)`.
   - **Cold / Archive Tier (Glacier / Power-Gated HDDs / Optical / Tape)**: Objects untouched for $\ge 90\text{–}365$ days are packed into ultra-wide stripes with spun-down disks (requiring minutes to hours for retrieval rehydration).
2. **Background Compaction & Garbage Collection (Mark-and-Sweep + Reference Counting)**:
   - Because Superblocks and Erasure-Coded extents are **strictly immutable and append-only**, deleting or overwriting an object **does NOT erase bytes in-place**:
     1. **Logical Tombstone**: `DELETE /bucket/file.mp4` marks the object entry as `DELETED` in the Metadata DB and flips the `deleted` flag in the Data Node's in-memory index.
     2. **Reference Count Decrement**: In deduplicated stores, the chunk's `ref_count` is decremented. Only when `ref_count == 0` (plus a grace period to avoid racing with in-flight uploads) is the chunk eligible for reclamation.
     3. **Volume Compaction (Copy-and-Compact)**: When a 10 GB Superblock accumulates $> 30\%$ deleted/dead needles, a background Compactor streams only the **live 70% needles** into a fresh Superblock, updates the Metadata Plane pointers atomically, and unlinks the old 10 GB volume to reclaim disk space.

---

## System Design Interview Questions to Master

### Q: Why shouldn't you store large files in a relational database? Explain the impact on memory pages and replication.

**A:** Large blobs bloat table pages, degrade cache efficiency, and slow backups/replication log shipping. Keep metadata in relational DB and store file bytes in object storage.

### Q: How do presigned URLs work, and what security considerations apply?

**A:** Server signs a short-lived URL granting scoped object access without exposing permanent credentials. Restrict method/path/content-type, set tight expiry, and audit usage.

### Q: Explain chunked/multipart upload. What are its specific benefits for large files on mobile networks?

**A:** Multipart upload splits a file into independently retriable parts that are committed at the end. On unstable mobile links, only failed chunks retry, reducing wasted bandwidth/time.

### Q: How would you design an image upload and delivery system for 10M uploads/day?

**A:** Use presigned direct uploads to object storage, queue async processing for thumbnails/virus scan, and serve via CDN. Store metadata/status in DB and make processing idempotent.

### Q: How does a CDN work, and what headers determine the cache hit rate?

**A:** CDN caches origin content at edge PoPs and serves nearby users on cache hits. `Cache-Control`, `ETag`, `Last-Modified`, `Vary`, and URL cache key strategy drive hit ratio.

### Q: How do you handle file deduplication at scale to save storage costs?

**A:** Compute strong content hashes and map identical payloads to one stored object with reference counting. Use chunk-level dedupe for very large or partially similar files.

### Q: How do you efficiently stream a 10 GB file from S3 to a client without loading it all into your backend server's RAM?

**A:** Prefer direct signed URL download from client to S3/CDN. If proxying is required, stream in chunks with range support and backpressure rather than buffering whole files.

### Q: What are the trade-offs between synchronous and asynchronous image processing pipelines?

**A:** Synchronous processing gives immediate availability but higher upload latency and tighter timeout risk. Asynchronous processing improves throughput and resiliency but requires status tracking and eventual consistency.

### Q: How would you implement resumable uploads for a mobile app with spotty connectivity?

**A:** Use multipart upload sessions with persisted upload IDs and per-part checkpoints on client. Resume from missing parts after reconnect and finalize with integrity checks.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Blob & Object Storage Interviews

> **Reference**: [Sujeet Pro — Blob Storage Design](https://sujeet.pro/articles/blob-storage-design)

### 1. The Senior Framing Strategy (First 60 Seconds)
Whether asked to *"Design Dropbox / Google Drive"* or *"Design Amazon S3 / Distributed Blob Storage"*, establish these four architectural foundations in the opening 60 seconds:
- **State Non-Negotiable Invariants Upfront**:
  1. **Strict Control/Data Plane Separation**: API/Metadata servers never proxy raw binary bytes; clients stream directly to/from Data Nodes (or via Presigned URLs + Multipart Uploads).
  2. **Immutability (Write-Once-Read-Many Extents)**: Blobs and chunks are immutable once sealed; edits create new versions or append new chunks, completely eliminating distributed byte-range lock contention.
  3. **11 Nines ($99.999999999\%$) Durability + Read-After-Write Strong Consistency**: A `200 OK` on `PUT` guarantees the data is durably persisted across fault domains (AZs/racks) and immediately visible to subsequent reads.
- **Back-of-the-Envelope Capacity & Storage Physics**: Contrast **3x Replication (200% storage overhead)** against **Reed-Solomon `RS(10,4)` (40% overhead)** and **Local Reconstruction Codes `LRC(12,2,2)` (33% overhead)**. At 100 PB of logical data, switching from 3x replication (300 PB raw) to LRC (133 PB raw) saves **167 Petabytes of physical drives (\~\$4M+/year)**. Also calculate **Inode RAM amplification**: 50 billion small files $\times 12\text{ bytes}$ in a Haystack index requires only $600\text{ GB}$ cluster RAM, whereas POSIX inodes ($256\text{ B}$) would consume $12.8\text{ TB}$ of RAM.
- **Proactive Failure-Mode Identification**: Call out the four failure modes of distributed blob stores:
  1. **Small-File IOPS Collapse**: Storing millions of 4 KB–64 KB blobs as individual OS files exhausts POSIX inodes and causes 3 disk seeks per read (solved via **Append-Only Superblocks / Haystack Volumes**).
  2. **Reconstruction Network Storms**: Rebuilding a failed 20 TB HDD under standard Reed-Solomon pulls $k \times 20\text{ TB}$ across top-of-rack switches (solved via **LRC local parity groups**).
  3. **Orphaned Multipart Chunks & Unreferenced Blocks**: Interrupted uploads leaving terabytes of zombie data (solved via **TTL-based Multipart Abort Policies** and **Mark-and-Sweep / Compaction GC**).
  4. **Fixed-Chunk Byte-Shift Amplification**: A 1-byte header edit invalidating every subsequent 4 MB chunk hash (solved via **Rabin Fingerprinting Content-Defined Chunking**).
- **Day-2 Operational Realism**: Detail background **Data Scrubbing** (periodic CRC32/SHA-256 verification to detect silent bit-rot on spinning disks before a second disk fails), **Superblock Compaction** when dead space exceeds 30%, and automated **Hot $\rightarrow$ Warm $\rightarrow$ Cold Tiering**.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "On our Data Nodes, can't we just store each uploaded blob as a regular file on Linux `ext4` or `XFS` using its `blob_id` as the filename?"
* **Junior/Mid Answer:** *"Yes, Linux filesystems are very mature and fast. We can organize files into subdirectories like `/ab/cd/blob_id` so no single folder gets too large."*
* **Principal Rebuttal:**
  > *"Subdirectory sharding still fails at billions of small files due to **POSIX Inode Metadata Amplification**. On `XFS`/`ext4`, reading a file requires traversing the directory dentry, loading a 256-byte inode from disk, and then seeking to the data extent—costing **2 to 3 disk seeks per read**. Worse, caching billions of 256-byte inodes in RAM is economically impossible, so nearly every small-file read misses the OS page cache and hits rotational disk latency (~10ms).*
  >
  > *In production (Meta's **Haystack** and **Tectonic**), Data Nodes append thousands of small blobs ('Needles') sequentially into massive **10 GB–100 GB Superblock Volume files** (which consume just 1 OS inode per 100 GB!). Each Data Node keeps an ultra-compact in-memory hash table mapping `BlobID -> (VolumeID, Offset, Size)` in just **~10 bytes per blob**. Reading any blob requires **zero directory lookups** and executes a single `pread(fd, offset, size)`—guaranteeing **1 disk seek per read**."*

#### Trap 2: "To deduplicate large files in Dropbox or backup storage, we split every file into fixed 4 MB chunks and hash each chunk with SHA-256. What happens if a user inserts a single sentence at the top of a 1 GB document?"
* **Junior/Mid Answer:** *"Only the first 4 MB chunk changes and gets uploaded; the remaining 249 chunks are already in storage and get deduplicated!"*
* **Principal Rebuttal:**
  > *"With **fixed-size 4 MB chunking**, inserting even **1 single byte** at offset 0 shifts the byte alignment of every single 4 MB boundary across the entire 1 GB file! Consequently, **all 250 chunks produce completely different SHA-256 hashes**, causing 0% deduplication and forcing a full 1 GB re-upload.*
  >
  > *To solve the boundary-shift problem, we must use **Content-Defined Chunking (CDC)** powered by **Rabin Fingerprinting** (or FastCDC). A sliding 48-byte window computes a rolling polynomial hash over the byte stream and declares a chunk cut-point whenever the lower $k$ bits match a target pattern ($R(w) \bmod 2^{22} == 0$). Because chunk boundaries are anchored to the **local byte content** rather than static offsets, inserting text at the top of the file mutates only Chunk 1—Chunk 2 immediately re-aligns at the very next natural content boundary, preserving >99% deduplication."*

#### Trap 3: "Reed-Solomon `RS(10, 4)` gives us 11 nines of durability with only 40% storage overhead. Why did Azure Blob Storage and Meta replace standard Reed-Solomon with Local Reconstruction Codes (LRC)?"
* **Junior/Mid Answer:** *"LRC compresses the files better than Reed-Solomon so it uses much less disk space."*
* **Principal Rebuttal:**
  > *"LRC does not compress payloads; it solves the **Single-Node Rebuild Network & I/O Amplification Crisis** of Reed-Solomon. In `RS(10, 4)`, if **one single disk** fails (which represents >90% of all hardware failures in a datacenter), reconstructing that 1 lost fragment requires reading **all 10 surviving fragments** over the cross-rack network—a **10x network and disk read amplification** that saturates top-of-rack switches and degrades p99 client read latency.*
  >
  > ***Local Reconstruction Codes (`LRC(12, 2, 2)`)** divide the 12 data chunks into **2 local groups of 6**, adding 1 **Local Parity** per group (2 total) alongside 2 **Global Parities**. When any single disk fails, we reconstruct it by reading **only the 6 chunks in its local group**—slashing rebuild network bandwidth and disk IOPS by **50%** while still tolerating up to 3–4 concurrent failures via the global parities."*

#### Trap 4: "Since Superblocks and Erasure-Coded stripes are immutable, how do we delete an object when a user calls `DELETE /bucket/key` or complies with GDPR right-to-erasure?"
* **Junior/Mid Answer:** *"We open the volume file, zero out the bytes at that offset, and free the space immediately."*
* **Principal Rebuttal:**
  > *"Zeroing bytes in-place inside an erasure-coded stripe would invalidate the parity fragments across 14 other drives, requiring an expensive read-modify-write across the entire stripe; furthermore, zeroing bytes inside the middle of a 100 GB Superblock does not shrink the file on disk.*
  >
  > *Instead, deletion is a **two-phase LSM-style lifecycle**:*
  > 1. ***Synchronous Logical Delete***: *The Metadata Plane marks the object key as `TOMBSTONED` (or decrements its chunk `ref_count` to 0) and sets the `deleted` bit in the Data Node's in-memory index, immediately blocking all future reads.*
  > 2. ***Asynchronous Compaction & Cryptographic Erasure***: *A background **Compactor** periodically scans Superblocks whose dead/deleted needle ratio exceeds a threshold (e.g., 30%), sequentially copies only the remaining live needles into a new Superblock, atomically swaps the volume pointer in the Metadata service, and deletes the old volume file. For strict GDPR compliance before compaction runs, per-object **Envelope Encryption (DEK)** allows instant cryptographic erasure by destroying the object's Data Encryption Key in KMS."*

---

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Upload / Download Data Path** | *"Upload the file to our backend API, which saves it to S3."* | *"Strictly separates **Control/Metadata Plane** from **Data Plane**: issues short-lived **Presigned URLs** with **Multipart Parallel Upload** directly to Data Nodes."* |
| **Small-File Storage Engine** | *"Store each photo as a file in Linux directories."* | *"Exposes the **POSIX Inode 3-seek bottleneck**; packs small blobs as **Needles** inside append-only **100 GB Haystack Superblocks** with a 10-byte/blob RAM index for **1-seek `pread()`**."* |
| **Chunking & Deduplication** | *"Split files into fixed 4 MB chunks and hash with SHA-256."* | *"Explains fixed-chunk byte-shift amplification; uses **Rabin Fingerprinting Content-Defined Chunking (CDC)** + SHA-256 reference-counted extents."* |
| **Durability & Erasure Coding** | *"Replicate every file 3 times across servers."* | *"Compares **3x Replication (200% tax)** vs. **Reed-Solomon `RS(10,4)` (40% tax, 10x repair I/O)** vs. **Local Reconstruction Codes `LRC(12,2,2)` (33% tax, 6x local repair I/O)**."* |
| **Deletes & Disk Reclamation** | *"Delete the file from disk when `DELETE` is called."* | *"Uses immutable append-only extents with **Logical Tombstones**, **Per-Object KMS Key Destruction**, and background **Copy-and-Compact Garbage Collection**."* |

