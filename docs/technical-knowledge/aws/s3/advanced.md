---
id: advanced
title: S3 Advanced — Replication, Transfer Acceleration & Object Lambda
sidebar_label: "🪣 S3 Advanced"
description: >
  Advanced S3 topics for DVA-C02. Cross-Region Replication, Same-Region
  Replication, S3 Transfer Acceleration, Object Lambda, MFA Delete,
  S3 Select, Requester Pays, and event processing patterns.
tags:
  - s3
  - replication
  - crr
  - srr
  - transfer-acceleration
  - object-lambda
  - mfa-delete
  - s3-select
  - dva-c02
  - domain-1
---

# S3 Advanced

---

## Replication

### Cross-Region Replication (CRR) vs Same-Region Replication (SRR)

| Feature | CRR | SRR |
|---|---|---|
| **Regions** | Source → different region | Source → same region |
| **Use case** | DR, latency, compliance | Aggregate logs, dev/prod copies |
| **Versioning** | Required on both buckets | Required on both buckets |
| **Existing objects** | ❌ Not replicated by default (use S3 Batch) | ❌ Same |
| **Delete marker** | Not replicated by default (opt-in) | Not replicated by default |

:::caution
Replication does **not** replicate delete markers or object deletions by default — to prevent accidental cross-region deletes. Enable **Delete Marker Replication** explicitly.
:::

---

## S3 Transfer Acceleration

```
Client → CloudFront Edge Location → AWS Backbone → S3 Bucket
```

- Speeds up **uploads** from distant clients
- Uses **CloudFront edge network** as an entry point
- Extra cost per GB transferred
- Separate endpoint: `bucket.s3-accelerate.amazonaws.com`

---

## S3 Select & Glacier Select

Query data **inside** S3 objects without downloading the whole file:

```java
SelectObjectContentRequest request = SelectObjectContentRequest.builder()
    .bucket("my-data-lake")
    .key("orders/2024-01.csv")
    .expressionType(ExpressionType.SQL)
    .expression("SELECT * FROM S3Object s WHERE s.status = 'FAILED'")
    .inputSerialization(InputSerialization.builder()
        .csv(CSVInput.builder().fileHeaderInfo(FileHeaderInfo.USE).build())
        .compressionType(CompressionType.NONE)
        .build())
    .outputSerialization(OutputSerialization.builder()
        .csv(CSVOutput.builder().build())
        .build())
    .build();
```

Reduces data transfer and processing cost significantly.

---

## Object Lambda

Transform S3 objects **on the fly** during a GET request:

```
Client GET request
      ↓
S3 Object Lambda Access Point
      ↓
Lambda function (transform: redact PII, resize image, format conversion)
      ↓
Transformed response to client
```

Use cases: redact SSN/email from CSV, resize images, add watermarks.

---

## MFA Delete

- Requires MFA to **permanently delete** a versioned object or **suspend versioning**
- Only the **bucket owner (root account)** can enable MFA Delete
- CLI only (not console)

---

## Lifecycle Rules

```json
{
  "Rules": [{
    "ID": "ArchiveOldLogs",
    "Status": "Enabled",
    "Filter": { "Prefix": "logs/" },
    "Transitions": [
      { "Days": 30, "StorageClass": "STANDARD_IA" },
      { "Days": 90, "StorageClass": "GLACIER_IR" },
      { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }
    ],
    "Expiration": { "Days": 2555 },
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
  }]
}
```

---

## S3 Object Ownership & ACLs

- **Bucket owner enforced** (recommended): ACLs disabled, bucket owner owns all objects
- ACLs are **legacy** — use bucket policies and IAM instead

---

## 🧪 Practice Questions

**Q1.** A company replicates S3 objects from us-east-1 to eu-west-1 for compliance. A user deletes an object in us-east-1. Will the object be deleted in eu-west-1?

A) Yes — deletions are always replicated  
B) No — **delete markers are not replicated by default**  
C) Yes — if the bucket policy allows cross-region deletes  
D) No — only new objects are replicated, not modifications  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — By default, S3 replication does **not** replicate delete markers. This protects against accidental or malicious cross-region deletes. You must explicitly enable **Delete Marker Replication**.
</details>

---

**Q2.** A developer has a 10GB CSV file in S3. They only need rows where `status = 'ERROR'`. What is the MOST cost-effective approach?

A) Download the file and filter locally  
B) Use Lambda to stream and filter the file  
C) Use **S3 Select** with a SQL expression  
D) Use Athena to query the file  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **S3 Select** executes the filter server-side, returning only matching rows. You only pay for the data scanned and returned, avoiding full file download. Athena is better for complex analytics; S3 Select is simpler for single-object queries.
</details>

---

## 🔗 Resources

- [S3 Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)
- [S3 Object Lambda](https://docs.aws.amazon.com/AmazonS3/latest/userguide/transforming-objects.html)
- [S3 Select](https://docs.aws.amazon.com/AmazonS3/latest/userguide/selecting-content-from-objects.html)
- [S3 Lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
