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

> **Key exam themes**: Encryption types, presigned URLs, CORS, event notifications, storage classes.

---

## Storage Classes

| Class | Use Case | Min Duration | Retrieval |
|---|---|---|---|
| **Standard** | Frequently accessed | None | Instant |
| **Standard-IA** | Infrequently accessed, still fast | 30 days | Instant |
| **One Zone-IA** | Infrequent, can lose one AZ | 30 days | Instant |
| **Glacier Instant** | Archive, rare access | 90 days | Instant |
| **Glacier Flexible** | Archive, hours acceptable | 90 days | Minutes–hours |
| **Glacier Deep Archive** | Long-term (7-10yr), very rare | 180 days | Up to 12 hours |
| **Intelligent-Tiering** | Unknown/changing access patterns | None | Instant (frequent tier) |

---

## Versioning

- Enable on bucket — objects get a `VersionId`
- `DELETE` adds a **delete marker** — old versions still exist
- **MFA Delete** — requires MFA to permanently delete a version
- Once enabled, versioning can be **suspended** but not disabled

---

## Encryption

| Type | Key Management | Who manages? |
|---|---|---|
| **SSE-S3** | AWS-managed key (AES-256) | AWS |
| **SSE-KMS** | KMS key (CMK or AWS-managed) | AWS KMS + you |
| **SSE-C** | Customer-provided key | You supply key in request header |
| **Client-Side Encryption** | Key never leaves client | You |

:::tip Exam tip
- `SSE-KMS` → audit trail in CloudTrail + KMS usage cost + throttling (KMS has limits)
- `SSE-C` → you send the key with every request (HTTPS required)
- `SSE-S3` → default, no extra cost
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

---

## Presigned URLs

```java
S3Presigner presigner = S3Presigner.create();

// Generate presigned GET URL (valid for 1 hour)
PresignedGetObjectRequest presigned = presigner.presignGetObject(b -> b
    .signatureDuration(Duration.ofHours(1))
    .getObjectRequest(r -> r
        .bucket("my-bucket")
        .key("reports/2024-Q4.pdf")));

URL url = presigned.url();
```

- URL inherits the permissions of the **signer** (IAM role/user)
- Can also presign `PutObject` for direct client uploads
- Default expiry: **1 hour** (max: 7 days)

---

## Event Notifications

| Destination | Use Case |
|---|---|
| **SNS** | Fan-out notifications |
| **SQS** | Queue for async processing |
| **Lambda** | Direct serverless processing |
| **EventBridge** | Complex routing, filtering |

### Enabling EventBridge
```json
// Bucket notification configuration
{ "EventBridgeConfiguration": {} }
```

EventBridge gives you more filtering options than native S3 notifications.

---

## CORS

When your browser (domain A) calls S3 (domain B) — S3 needs a CORS rule:

```xml
<CORSRule>
  <AllowedOrigin>https://myapp.example.com</AllowedOrigin>
  <AllowedMethod>GET</AllowedMethod>
  <AllowedMethod>PUT</AllowedMethod>
  <AllowedHeader>*</AllowedHeader>
  <MaxAgeSeconds>3000</MaxAgeSeconds>
</CORSRule>
```

:::caution
CORS is not a security control — it only tells browsers whether to allow cross-origin responses. It doesn't prevent direct API calls.
:::

---

## Multipart Upload

- Recommended for objects **> 100MB**
- Required for objects **> 5GB**
- Parts can be uploaded in **parallel**
- Must call `CompleteMultipartUpload` or `AbortMultipartUpload`
- Use **S3 Lifecycle rule to abort incomplete multipart uploads** (avoid costs)

---

## S3 Access Points

- Simplify bucket policies for large teams
- Each access point has its own DNS name and policy
- Can restrict access to a specific VPC

---

## 🧪 Practice Questions

**Q1.** A developer needs to allow a client browser to **directly upload** a file to S3. The app server should not be in the upload path. What is the BEST approach?

A) Use an API Gateway proxy to stream to S3  
B) Generate a **presigned PUT URL** and return it to the client  
C) Make the bucket public  
D) Use S3 Transfer Acceleration  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — A **presigned PUT URL** lets the client upload directly to S3 without going through your server, with a time-limited permission that inherits the signer's IAM credentials.
</details>

---

**Q2.** A team wants all objects in an S3 bucket to be encrypted using a **customer-managed KMS key**, and wants API calls to be auditable. Which encryption option should they use?

A) SSE-S3  
B) SSE-KMS  
C) SSE-C  
D) Client-Side Encryption  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **SSE-KMS** uses a CMK (Customer Managed Key) in AWS KMS, and every encrypt/decrypt call is logged in **CloudTrail**, giving a full audit trail. SSE-S3 is auditable but uses AWS-managed keys.
</details>

---

**Q3.** An S3 bucket has versioning enabled. A user deletes a file. What actually happens?

A) The file is permanently deleted  
B) The file and all versions are deleted  
C) A **delete marker** is added; the previous versions still exist  
D) The file is moved to Glacier  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — With versioning enabled, a `DELETE` without specifying a VersionId adds a **delete marker**. The object appears deleted to normal GET requests but all previous versions are preserved.
</details>

---

## 🔗 Resources

- [S3 Developer Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/)
- [S3 Storage Classes](https://aws.amazon.com/s3/storage-classes/)
- [S3 Encryption Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingEncryption.html)
- [S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html)
