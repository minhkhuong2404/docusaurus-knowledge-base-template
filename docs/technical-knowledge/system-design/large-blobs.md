---
id: large-blobs
title: Handling Large Blobs & Object Storage
sidebar_label: Large Blob Storage
description: Senior-level patterns for storing and delivering large binary objects (images, videos). Covers object storage mechanics, chunked uploads, CDN delivery, and presigned URLs.
sidebar_position: 2
tags: [System Design, Storage, Blob, S3, CDN, Chunking, Multipart, File Upload]
---

# Handling Large Blobs

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
Transferring large files over unreliable networks (like mobile connections) via a single stream is prone to failure. Furthermore, many load balancers and APIs have strict HTTP payload limits.
* **The Pattern:** Use **Multipart Upload**. The client chunks a massive file into smaller, fixed-size pieces (e.g., 5MB chunks). These chunks can be uploaded sequentially, or even in parallel to maximize throughput. Once all chunks are received, the object store stitches them back together into the contiguous file. *Senior Context:* If a chunk upload fails due to network partition, only that specific 5MB chunk needs to be retried, not the entire 10GB file.

---

## 1. Storage Options

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

Always separate your **Metadata** from your **Blob Data**.

```text
Client → API Server 
           ↓
    Relational DB (Stores: id, s3_key, user_id, size, created_at)
           ↓
Client → Object Store (Stores: actual bytes via S3)
           ↓
          CDN (Caches reads at edge locations)
```

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
