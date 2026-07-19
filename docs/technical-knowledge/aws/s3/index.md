---
id: index
title: Amazon S3
sidebar_label: "🪣 S3 Fundamentals"
description: >
  Amazon S3 for DVA-C02. Storage classes, versioning, lifecycle policies,
  presigned URLs, encryption (SSE-S3, SSE-KMS, SSE-C), CORS, event notifications,
  multipart uploads, and cross-region replication.
tags:
  - s3
  - storage
  - versioning
  - encryption
  - presigned-url
  - cors
  - lifecycle
  - replication
  - dva-c02
  - domain-1
---

# Amazon S3

> **Key exam themes**: Encryption types, presigned URLs, CORS, event notifications, storage classes, bucket policies.

---

## 🔰 What Is Amazon S3?

Amazon S3 (Simple Storage Service) is an **object storage service** offering virtually unlimited storage with 99.999999999% (11 nines) durability. Objects are stored in **buckets** and accessed via unique keys.

**Analogy**: S3 is like an infinite filing cabinet in the cloud. Each drawer is a bucket, each file inside is an object. You can organize files with "folders" (key prefixes), lock them with encryption, and set rules to automatically archive old files.

### S3 vs Other Storage

| Feature | S3 (Object) | EBS (Block) | EFS (File) |
|---|---|---|---|
| **Access** | HTTP/HTTPS API | Attached to EC2 | NFS mount |
| **Scalability** | Unlimited | Fixed size (up to 64 TB) | Auto-scaling |
| **Sharing** | Any number of clients | Single EC2 (or multi-attach io2) | Multiple EC2 |
| **Use case** | Static files, backups, data lake | Databases, OS volumes | Shared file system |
| **Durability** | 11 nines | Volume-level | 11 nines |

---

## Storage Classes

| Class | Use Case | Min Duration | Retrieval | Availability |
|---|---|---|---|---|
| **Standard** | Frequently accessed | None | Instant | 99.99% |
| **Standard-IA** | Infrequent, fast retrieval needed | 30 days | Instant | 99.9% |
| **One Zone-IA** | Infrequent, recreatable data | 30 days | Instant | 99.5% |
| **Glacier Instant** | Archive, quarterly access | 90 days | Instant | 99.9% |
| **Glacier Flexible** | Archive, hours acceptable | 90 days | 1-12 hours | 99.99% |
| **Glacier Deep Archive** | Long-term (7-10yr) | 180 days | 12-48 hours | 99.99% |
| **Intelligent-Tiering** | Unknown access patterns | None | Instant | 99.9% |

### Glacier Flexible Retrieval Options

| Option | Speed | Cost |
|---|---|---|
| **Expedited** | 1-5 minutes | Highest |
| **Standard** | 3-5 hours | Medium |
| **Bulk** | 5-12 hours | Lowest |

:::tip[Exam: Storage Class Selection]
- "Rarely accessed but needs millisecond retrieval" → **Glacier Instant Retrieval**
- "Unknown access pattern" → **Intelligent-Tiering** (auto-moves between tiers)
- "Can lose one AZ, infrequent access" → **One Zone-IA** (cheapest IA)
- "Legal compliance, 7+ year retention" → **Glacier Deep Archive**
:::

---

## Versioning

- Enable per bucket — objects get a `VersionId`
- `DELETE` without specifying version → adds a **delete marker** (old versions preserved)
- `DELETE` with VersionId → **permanently deletes** that specific version
- Once enabled, versioning can be **suspended** but never fully disabled
- **MFA Delete** — requires MFA to permanently delete or suspend versioning

### Versioning Behavior

```
PUT object.txt (v1) → { VersionId: "abc", Content: "Hello" }
PUT object.txt (v2) → { VersionId: "def", Content: "World" }
DELETE object.txt   → { VersionId: "ghi", DeleteMarker: true }

GET object.txt      → 404 (latest is delete marker)
GET object.txt?versionId=abc → "Hello" (still exists!)
DELETE object.txt?versionId=ghi → Removes delete marker, v2 is latest again
```

---

## Encryption

| Type | Key Management | Who Manages? | Audit Trail |
|---|---|---|---|
| **SSE-S3** | AWS-managed (AES-256) | AWS | ❌ No CloudTrail |
| **SSE-KMS** | KMS key (CMK or AWS-managed) | You + KMS | ✅ CloudTrail |
| **SSE-C** | Customer-provided key | You send key per request | ❌ (your responsibility) |
| **Client-Side** | Key never leaves client | You | ❌ (your responsibility) |

### SSE-KMS Considerations

```
PUT request → S3 → KMS:Encrypt → encrypted object stored
GET request → S3 → KMS:Decrypt → decrypted object returned

Each request counts toward KMS API quotas!
- 5,500 requests/sec (us-east-1) or 10,000/sec (some regions)
- High-throughput buckets with SSE-KMS may need to request quota increase
```

:::tip[Encryption Exam Rules]
- **SSE-KMS** → audit trail in CloudTrail + KMS quota limit
- **SSE-C** → you send key with every request (HTTPS required!)
- **SSE-S3** → default encryption, no extra cost, no audit
- **Bucket keys** (with SSE-KMS) → reduces KMS API calls by 99%
:::

### Force Encryption via Bucket Policy

```json
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::my-bucket/*",
  "Condition": {
    "StringNotEquals": {
      "s3:x-amz-server-side-encryption": "aws:kms"
    }
  }
}
```

### Default Encryption

```json
{
  "ServerSideEncryptionConfiguration": {
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:us-east-1:123:key/abc-def"
      },
      "BucketKeyEnabled": true
    }]
  }
}
```

---

## Presigned URLs

Generate time-limited URLs that grant temporary access to private objects:

```java
// Generate presigned GET URL (download)
S3Presigner presigner = S3Presigner.create();
PresignedGetObjectRequest presigned = presigner.presignGetObject(b -> b
    .signatureDuration(Duration.ofHours(1))
    .getObjectRequest(r -> r.bucket("my-bucket").key("reports/2024-Q4.pdf")));
URL downloadUrl = presigned.url();

// Generate presigned PUT URL (upload directly from client browser)
PresignedPutObjectRequest presignedPut = presigner.presignPutObject(b -> b
    .signatureDuration(Duration.ofMinutes(15))
    .putObjectRequest(r -> r
        .bucket("my-bucket")
        .key("uploads/" + UUID.randomUUID() + ".jpg")
        .contentType("image/jpeg")));
URL uploadUrl = presignedPut.url();
```

| Property | Details |
|---|---|
| **Permissions** | Inherits permissions of the **signer** (IAM user/role) |
| **Default expiry** | Configurable; max **7 days** (IAM user), **12 hours** (STS temp creds) |
| **Use case** | Client-side uploads/downloads without exposing AWS credentials |
| **Security** | If signer's permissions are revoked, URL stops working immediately |

:::tip[Exam: Direct Upload Pattern]
"Allow browser to upload directly to S3 without going through your server"
→ Generate a **presigned PUT URL** on your backend, return it to the client.
:::

---

## Event Notifications

| Destination | Use Case | Setup Complexity |
|---|---|---|
| **SNS** | Fan-out to multiple subscribers | Low |
| **SQS** | Queue for async processing | Low |
| **Lambda** | Direct serverless processing | Low |
| **EventBridge** | Complex routing, filtering, replay | Medium |

### Event Types

```
s3:ObjectCreated:*          — PUT, POST, COPY, CompleteMultipartUpload
s3:ObjectRemoved:*          — DELETE, DeleteMarkerCreated
s3:ObjectRestore:*          — Glacier restore initiated/completed
s3:Replication:*            — Replication success/failure
s3:LifecycleExpiration:*    — Object expired by lifecycle
```

### EventBridge Integration

```json
{ "EventBridgeConfiguration": {} }
```

EventBridge provides: **filtering**, **multiple targets**, **archive & replay**, **schema registry** — much more powerful than native S3 notifications.

---

## CORS (Cross-Origin Resource Sharing)

When a browser at `domain-a.com` requests resources from S3 at `domain-b.com`:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://myapp.example.com</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
    <ExposeHeader>x-amz-request-id</ExposeHeader>
  </CORSRule>
</CORSConfiguration>
```

:::caution[CORS Misconception]
CORS is **NOT a security control** — it only tells browsers whether to allow cross-origin responses. Direct API calls (curl, SDK) bypass CORS entirely. Use bucket policies and IAM for actual access control.
:::

---

## Multipart Upload

| Property | Value |
|---|---|
| **Recommended** | Objects >100 MB |
| **Required** | Objects >5 GB |
| **Max parts** | 10,000 |
| **Part size** | 5 MB – 5 GB |
| **Parallelism** | Parts uploaded in parallel |

```java
// SDK v2 handles multipart automatically with TransferManager
S3TransferManager transferManager = S3TransferManager.create();
FileUpload upload = transferManager.uploadFile(UploadFileRequest.builder()
    .putObjectRequest(PutObjectRequest.builder()
        .bucket("my-bucket")
        .key("large-file.zip")
        .build())
    .source(Paths.get("/path/to/large-file.zip"))
    .build());
upload.completionFuture().join();
```

:::tip[Best Practice]
Always create a **lifecycle rule to abort incomplete multipart uploads** after N days — orphaned parts incur storage costs!
:::

---

## S3 Access Points

Simplify bucket policies for large teams:

```
Bucket "data-lake"
  ├── Access Point "finance-ap" → /finance/* (finance team only)
  ├── Access Point "analytics-ap" → /analytics/* (data scientists)
  └── Access Point "public-ap" → /public/* (read-only, anyone)
```

- Each access point has its own **DNS name** and **IAM policy**
- Can restrict to a specific **VPC** (VPC-only access point)
- Simplifies managing complex bucket policies with many principals

---

## Bucket Policies vs IAM Policies

| Feature | Bucket Policy | IAM Policy |
|---|---|---|
| **Attached to** | S3 bucket | IAM user/role/group |
| **Scope** | Cross-account, anonymous | Same account only |
| **Use case** | Public access, cross-account | User-level permissions |
| **Deny** | Can explicitly deny any principal | Applies to attached principal |

### Common Bucket Policy Patterns

```json
// Force HTTPS only
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": ["arn:aws:s3:::bucket/*", "arn:aws:s3:::bucket"],
  "Condition": { "Bool": { "aws:SecureTransport": "false" } }
}
```

```json
// Cross-account access
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::987654321098:root" },
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::my-bucket/*"
}
```

---

## 🏆 Best Practices

### Security
1. **Block all public access** by default — enable only when explicitly needed
2. **Use SSE-KMS with bucket keys** for audit + cost optimization
3. **Enable versioning + MFA Delete** for critical data
4. **Force HTTPS** via bucket policy condition

### Cost
1. **Use Lifecycle Rules** to transition to cheaper tiers automatically
2. **Abort incomplete multipart uploads** via lifecycle rule
3. **Use Intelligent-Tiering** when access patterns are unknown
4. **S3 Select** — filter data server-side instead of downloading entire objects

### Performance
1. **Multipart upload** for files >100MB — parallel parts
2. **Transfer Acceleration** for distant clients (uses CloudFront edge)
3. **Prefix partitioning** — distribute objects across prefixes for high request rates
4. **S3 supports 3,500 PUT/5,500 GET per prefix per second** — use multiple prefixes

---

## 🎯 DVA-C02 Exam Tips

:::tip[S3 Exam Cheat Sheet]
1. **SSE-KMS** = CloudTrail audit trail but KMS quota limits
2. **SSE-C** = you provide key with every request, HTTPS mandatory
3. **Presigned URL** = temporary access inheriting signer's permissions
4. **CORS** = browser-only, not a security mechanism
5. **Versioning DELETE** = adds delete marker (object not actually deleted)
6. **Multipart** = required >5GB, recommended >100MB
7. **S3 Event → EventBridge** gives more filtering than native notifications
8. **Lifecycle rule** = auto-transition storage class + abort multipart
9. **Bucket keys** with SSE-KMS reduces API calls by 99%
10. **S3 Access Points** simplify complex multi-team bucket policies
:::

---

## Practice Questions

**Q1.** Allow client browser to directly upload to S3 without going through your server. Best approach?

A) API Gateway proxy to S3  
B) **Presigned PUT URL**  
C) Make bucket public  
D) Transfer Acceleration  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Presigned PUT URL lets the client upload directly with time-limited, credential-free access. No server in the upload path.
</details>

---

**Q2.** All objects must use customer-managed KMS key with audit trail. Which encryption?

A) SSE-S3  
B) **SSE-KMS**  
C) SSE-C  
D) Client-Side  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — SSE-KMS uses a CMK in KMS, and every encrypt/decrypt is logged in CloudTrail.
</details>

---

**Q3.** Versioning enabled. User deletes a file. What happens?

A) Permanently deleted  
B) All versions deleted  
C) **Delete marker added; previous versions preserved**  
D) Moved to Glacier  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — DELETE without VersionId adds a delete marker. All previous versions remain intact.
</details>

---

**Q4.** High-throughput application using SSE-KMS encryption starts getting `ThrottlingException`. What should you do?

A) Switch to SSE-S3  
B) Request KMS quota increase  
C) **Enable S3 Bucket Keys**  
D) Both B and C  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — S3 Bucket Keys reduce KMS API calls by ~99% (uses a bucket-level key to derive per-object keys). Also request a KMS quota increase if needed.
</details>

---

**Q5.** A React app on `app.example.com` fetches images from S3. Requests fail with CORS error. What to configure?

A) IAM policy on the React app  
B) S3 bucket policy allowing the domain  
C) **S3 CORS configuration allowing `app.example.com`**  
D) CloudFront distribution  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — CORS is a browser mechanism. Configure S3 CORS rules to allow the origin domain. Bucket policies control access, not CORS headers.
</details>

---

## 🔗 Resources

- [S3 Developer Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/)
- [S3 Storage Classes](https://aws.amazon.com/s3/storage-classes/)
- [S3 Encryption Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingEncryption.html)
- [S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html)
- [S3 Performance Optimization](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html)
