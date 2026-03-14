---
id: large-blobs
title: Handling Large Blobs
sidebar_label: Large Blob Storage
description: Patterns for storing and delivering large binary objects including images, videos, and files. Covers object storage, chunked uploads, multipart transfers, CDN delivery, and presigned URLs.
tags: [storage, blob, s3, object-storage, cdn, chunking, multipart, file-upload]
---

# Handling Large Blobs

> Never store large files in your relational database. Use purpose-built object storage.

---

## Storage Options

| Storage Type | Examples | Use For |
|---|---|---|
| **Object Storage** | S3, GCS, Azure Blob | Images, videos, documents, backups |
| **Block Storage** | EBS, GCP Persistent Disk | Databases, VM disks |
| **File System (NFS)** | EFS, NFS | Shared filesystems across instances |
| **CDN** | CloudFront, Fastly, Akamai | Read-heavy delivery at edge |

---

## Object Storage Architecture

```
Client → API Server → S3 (store metadata + file)
                   ↓
              DB (store: filename, s3_key, size, user_id)
              ↓
          CDN (serve reads, cache at edge)
```

### Why Not Store in DB?
- Blobs saturate DB I/O bandwidth
- DB backups become enormous
- No CDN acceleration possible
- ACID overhead wasted on binary data

---

## Direct Upload Pattern (Presigned URLs)

For large files, never proxy through your server.

```
1. Client requests presigned URL from API server
2. API server generates presigned URL (S3 temporary auth token)
3. Client uploads directly to S3 (bypasses your server)
4. Client notifies API server of completion
5. API server stores metadata in DB
```

```java
// Spring Boot — generate presigned upload URL
@Service
public class FileUploadService {
    @Autowired private S3Presigner presigner;

    public String generatePresignedUploadUrl(String fileName, String contentType) {
        String key = UUID.randomUUID() + "/" + fileName;

        PutObjectPresignRequest request = PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(15))
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

// REST endpoint
@PostMapping("/files/upload-url")
public UploadUrlResponse getUploadUrl(@RequestBody UploadRequest req) {
    String url = fileUploadService.generatePresignedUploadUrl(
        req.getFileName(), req.getContentType());
    return new UploadUrlResponse(url);
}
```

---

## Chunked / Multipart Upload

For files > 100 MB. Split into chunks, upload in parallel, merge on server.

```
File (5 GB)
  ├── Chunk 1 (100 MB) ──→ S3 UploadPart 1
  ├── Chunk 2 (100 MB) ──→ S3 UploadPart 2  (parallel)
  ├── Chunk 3 (100 MB) ──→ S3 UploadPart 3  (parallel)
  └── ...
        ↓
    CompleteMultipartUpload → S3 merges chunks
```

### Benefits
- Resumable: if upload fails at chunk 30, retry only chunk 30
- Parallel: upload chunks simultaneously for higher throughput
- Streaming: start processing before all chunks arrive

```java
// S3 Multipart Upload with AWS SDK v2
@Service
public class MultipartUploadService {
    @Autowired private S3AsyncClient s3;

    public CompletableFuture<String> uploadLargeFile(
            String bucket, String key, Path file) {
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

## CDN Delivery

### Read Path (CDN Cache Hit)
```
Client → CDN Edge (cache hit) → Return cached file
```

### Read Path (CDN Cache Miss)
```
Client → CDN Edge → Origin (S3) → CDN caches → Client
```

### Cache Control for Media
```
Cache-Control: public, max-age=31536000, immutable   # Versioned assets (1 year)
Cache-Control: public, max-age=3600                   # Profile images (1 hour)
Cache-Control: private, no-store                      # Private documents
```

### URL Strategies
- **Versioned URLs**: `https://cdn.example.com/img/profile-v2.jpg` — cache forever, change URL on update
- **Hash-based**: `https://cdn.example.com/img/abc123.jpg` — content-addressed, immutable

---

## Image Processing Pipeline

```
Upload → S3 raw bucket
           ↓ (S3 event → Lambda / worker)
      Image Processor
           ├── Resize to thumbnails (128x128, 256x256, 1024x1024)
           ├── Convert to WebP (smaller, better quality)
           ├── Extract metadata (EXIF, dimensions)
           └── Store in S3 processed bucket
                    ↓
               Update DB (image_url, dimensions, formats)
                    ↓
               CDN invalidation (if updating existing)
```

```java
// Spring + S3 event listener (via SQS)
@SqsListener("image-processing-queue")
public void processImage(S3EventNotification event) {
    String key = event.getRecords().get(0).getS3().getObject().getKey();
    BufferedImage original = imageLoader.load(key);

    for (ImageSize size : ImageSize.values()) {
        BufferedImage resized = imageResizer.resize(original, size);
        String processedKey = "processed/" + size.name().toLowerCase() + "/" + key;
        s3.putObject(processedKey, toInputStream(resized));
    }
}
```

---

## Resumable Upload Protocol (TUS)

Open protocol for resumable uploads.

```
POST   /files                    → Create upload resource, get Location URL
PATCH  /files/{id}?offset=0      → Upload bytes 0 to N
PATCH  /files/{id}?offset=N      → Upload bytes N to M (resume)
HEAD   /files/{id}               → Get current offset (for resume)
```

---

## Large File Download Strategies

### Range Requests
Clients can request specific byte ranges (seek in video).

```
GET /video/movie.mp4
Range: bytes=1048576-2097151   → Returns 206 Partial Content
```

### Streaming Download
```java
@GetMapping("/download/{fileId}")
public ResponseEntity<StreamingResponseBody> download(@PathVariable String fileId) {
    FileMetadata meta = fileService.getMetadata(fileId);

    StreamingResponseBody body = outputStream -> {
        try (S3ObjectInputStream s3Stream = s3.getObject(meta.getBucket(), meta.getKey())) {
            s3Stream.transferTo(outputStream);
        }
    };

    return ResponseEntity.ok()
        .header("Content-Disposition", "attachment; filename=" + meta.getFileName())
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .body(body);
}
```

---

## Deduplication

Avoid storing same file twice using content-based addressing.

```java
public String storeWithDedup(byte[] content) {
    String contentHash = DigestUtils.sha256Hex(content);
    String key = "files/" + contentHash;

    if (!s3.doesObjectExist(bucket, key)) {
        s3.putObject(bucket, key, new ByteArrayInputStream(content), metadata);
    }
    // Multiple users can reference same S3 key
    return key;
}
```

---

## Interview Questions

1. Why shouldn't you store large files in a relational database?
2. How do presigned URLs work and what security considerations apply?
3. Explain chunked/multipart upload. What are its benefits for large files?
4. How would you design an image upload and delivery system for 10M uploads/day?
5. How does a CDN work and what determines cache hit rate?
6. How do you handle file deduplication at scale?
7. What is a resumable upload protocol and when is it necessary?
8. How do you efficiently stream a 10 GB file from S3 to a client without loading it all into memory?
