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

> **Senior-level topics**: Replication architecture, Object Lambda for on-the-fly transformations, S3 Batch Operations, and event-driven architectures.

---

## Replication

### Cross-Region Replication (CRR) vs Same-Region Replication (SRR)

| Feature | CRR | SRR |
|---|---|---|
| **Regions** | Source → different region | Source → same region |
| **Use case** | DR, compliance, latency reduction | Log aggregation, dev/prod copies |
| **Versioning** | Required on both buckets | Required on both buckets |
| **Existing objects** | ❌ Not replicated (use S3 Batch Replication) | ❌ Same |
| **Delete markers** | Not replicated by default (opt-in) | Not replicated by default |
| **Chaining** | ❌ No — A→B→C not supported (A→B and A→C separately) | ❌ Same |

### Replication Configuration

```json
{
  "Role": "arn:aws:iam::123456789012:role/s3-replication-role",
  "Rules": [{
    "ID": "ReplicateAll",
    "Status": "Enabled",
    "Filter": { "Prefix": "" },
    "Destination": {
      "Bucket": "arn:aws:s3:::dest-bucket",
      "StorageClass": "STANDARD_IA",
      "EncryptionConfiguration": {
        "ReplicaKmsKeyID": "arn:aws:kms:eu-west-1:123:key/dest-key-id"
      },
      "ReplicationTime": {
        "Status": "Enabled",
        "Time": { "Minutes": 15 }
      },
      "Metrics": { "Status": "Enabled" }
    },
    "DeleteMarkerReplication": { "Status": "Enabled" }
  }]
}
```

### S3 Replication Time Control (RTC)

- Guarantees **99.99%** of objects replicated within **15 minutes**
- Provides CloudWatch metrics and S3 events for monitoring
- Extra cost but important for compliance/DR requirements

:::caution[Replication Gotchas]
1. **No chaining** — if Bucket A → B, and B → C, changes from A do NOT automatically reach C
2. **Delete markers** not replicated by default — enable explicitly
3. **Existing objects** not replicated — use S3 Batch Replication
4. **SSE-C encrypted objects** are NOT replicated
5. **Lifecycle rules** are NOT replicated (must configure separately)
:::

---

## S3 Transfer Acceleration

```
Without acceleration:
  Client (Australia) ──── public internet ────→ S3 (us-east-1)
  Latency: ~200ms

With acceleration:
  Client (Australia) → Edge (Sydney) ──── AWS backbone ────→ S3 (us-east-1)
  Latency: ~80ms
```

| Property | Details |
|---|---|
| **How it works** | Uses CloudFront edge network as entry point |
| **Best for** | Long-distance uploads (cross-continent) |
| **Endpoint** | `bucket.s3-accelerate.amazonaws.com` |
| **Cost** | Additional per-GB transfer fee |
| **NOT useful** | Same-region clients, small files |

```bash
# Test if acceleration helps your use case
aws s3api put-bucket-accelerate-configuration \
    --bucket my-bucket \
    --accelerate-configuration Status=Enabled

# Speed comparison tool
# https://s3-accelerate-speedtest.s3-accelerate.amazonaws.com
```

---

## S3 Select & Glacier Select

Query data **inside** objects using SQL without downloading the entire file:

```java
// Filter a CSV file server-side — only matching rows are returned
SelectObjectContentRequest request = SelectObjectContentRequest.builder()
    .bucket("data-lake")
    .key("orders/2024-01.csv.gz")
    .expressionType(ExpressionType.SQL)
    .expression("SELECT orderId, amount FROM S3Object s WHERE s.status = 'FAILED' AND CAST(s.amount AS DECIMAL) > 1000")
    .inputSerialization(InputSerialization.builder()
        .csv(CSVInput.builder().fileHeaderInfo(FileHeaderInfo.USE).build())
        .compressionType(CompressionType.GZIP)  // Supports GZIP, BZIP2
        .build())
    .outputSerialization(OutputSerialization.builder()
        .json(JSONOutput.builder().build())  // Output as JSON
        .build())
    .build();
```

### S3 Select vs Athena

| Feature | S3 Select | Athena |
|---|---|---|
| **Scope** | Single object | Multiple objects, partitioned data |
| **Query** | Simple SQL (SELECT, WHERE) | Full SQL (JOINs, GROUP BY, window functions) |
| **Format** | CSV, JSON, Parquet | CSV, JSON, Parquet, ORC, Avro |
| **Use case** | Quick filter on one file | Data lake analytics |
| **Cost** | Per data scanned/returned | Per data scanned |

---

## S3 Object Lambda

Transform objects **on the fly** during GET requests:

```
Client GET → S3 Object Lambda Access Point → Lambda function → Transformed response
                                               ↓
                                       S3 Supporting Access Point (original object)
```

### Use Cases
- **Redact PII** — remove SSN, email from CSV/JSON before returning
- **Resize images** — return thumbnails without storing them
- **Convert formats** — XML → JSON on the fly
- **Add watermarks** — overlay watermark on images
- **Decompress** — return decompressed data

### Setup with CloudFormation

```yaml
Resources:
  SupportingAccessPoint:
    Type: AWS::S3::AccessPoint
    Properties:
      Bucket: !Ref DataBucket
      Name: supporting-ap

  ObjectLambdaAccessPoint:
    Type: AWS::S3ObjectLambda::AccessPoint
    Properties:
      Name: pii-redaction-ap
      ObjectLambdaConfiguration:
        SupportingAccessPoint: !GetAtt SupportingAccessPoint.Arn
        TransformationConfigurations:
          - Actions: [GetObject]
            ContentTransformation:
              AwsLambda:
                FunctionArn: !GetAtt RedactFunction.Arn
```

---

## S3 Batch Operations

Run large-scale operations on billions of objects:

```
S3 Inventory Report (source list)
    ↓
S3 Batch Job
    ↓
Operations: Copy, Invoke Lambda, Restore from Glacier,
            Replace tags, Replace ACLs, Object Lock
```

| Feature | Details |
|---|---|
| **Input** | S3 Inventory report or CSV manifest |
| **Retry** | Automatic retry of failed operations |
| **Tracking** | Job progress, completion reports |
| **Use cases** | Batch replication, bulk encryption, mass tagging |

```bash
# Create batch job to copy objects to another bucket
aws s3control create-job \
    --account-id 123456789012 \
    --operation '{"S3PutObjectCopy": {"TargetResource": "arn:aws:s3:::dest-bucket"}}' \
    --manifest '{"Spec": {"Format": "S3InventoryReport_CSV_20211130"}, "Location": {"ObjectArn": "arn:aws:s3:::source-bucket/inventory/manifest.json", "ETag": "abc123"}}' \
    --report '{"Bucket": "arn:aws:s3:::report-bucket", "Prefix": "batch-reports/", "Format": "Report_CSV_20180820", "Enabled": true, "ReportScope": "AllTasks"}' \
    --role-arn arn:aws:iam::123456789012:role/batch-operations-role \
    --priority 10
```

---

## MFA Delete

Adds an extra layer of protection for versioned buckets:

| Action | MFA Required? |
|---|---|
| Permanently delete a specific version | ✅ Yes |
| Suspend versioning | ✅ Yes |
| Enable versioning | ❌ No |
| List versions | ❌ No |
| Add delete marker | ❌ No |

- Only the **root account** can enable/disable MFA Delete
- Must use **CLI** or **API** (cannot configure via console)
- Requires versioning to be enabled

---

## Lifecycle Rules

### Example: Cost-Optimized Log Retention

```json
{
  "Rules": [{
    "ID": "LogRetentionPolicy",
    "Status": "Enabled",
    "Filter": { "Prefix": "logs/" },
    "Transitions": [
      { "Days": 30, "StorageClass": "STANDARD_IA" },
      { "Days": 90, "StorageClass": "GLACIER_IR" },
      { "Days": 180, "StorageClass": "GLACIER" },
      { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }
    ],
    "NoncurrentVersionTransitions": [
      { "NoncurrentDays": 30, "StorageClass": "GLACIER" }
    ],
    "NoncurrentVersionExpiration": { "NoncurrentDays": 90 },
    "Expiration": { "Days": 2555 },
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
  }]
}
```

### Transition Constraints

```
Standard → Standard-IA (min 30 days)
Standard → Glacier Instant (min 90 days)
Standard-IA → Glacier (allowed)
One Zone-IA → Glacier (allowed)
Any → Deep Archive (allowed)

❌ Cannot transition "backwards" (Deep Archive → Standard)
```

---

## S3 Object Lock & Legal Hold

### Retention Modes

| Mode | Description |
|---|---|
| **Governance** | Users with `s3:BypassGovernanceRetention` can override/delete |
| **Compliance** | NO ONE can delete or override — not even root account |

### Legal Hold

- Independent of retention period — applies or removes manually
- When active, object **cannot be deleted** regardless of retention settings
- Requires `s3:PutObjectLegalHold` permission

---

## Requester Pays

- The **requester** pays for data transfer and request costs (not the bucket owner)
- Use case: Sharing large public datasets (genomics, satellite imagery)
- Requester must be an authenticated AWS user (no anonymous access)

---

## Event-Driven Architecture Patterns

### Pattern 1: Image Processing Pipeline

```
User uploads → S3 (PutObject) → Lambda (resize + generate thumbnails)
                                    → S3 (thumbnails/)
                                    → DynamoDB (metadata)
```

### Pattern 2: Fan-Out with SNS

```
S3 (PutObject) → SNS Topic → SQS Queue 1 (process A)
                            → SQS Queue 2 (process B)
                            → Lambda (process C)
```

### Pattern 3: EventBridge for Complex Routing

```
S3 (PutObject) → EventBridge → Rule 1: if prefix="orders/" → Lambda A
                              → Rule 2: if suffix=".pdf" → Step Functions
                              → Rule 3: if size > 100MB → SQS
                              → Archive (replay up to 90 days)
```

---

## 🏆 Best Practices

### Cost
1. **Use lifecycle rules aggressively** — transition old data to cheaper tiers
2. **Abort incomplete multipart uploads** — orphaned parts cost money
3. **S3 Select** for filtering — avoid downloading entire objects
4. **Requester Pays** for shared datasets

### Security
1. **Enable S3 Block Public Access** at account level
2. **Use VPC Gateway Endpoints** for private S3 access from VPC
3. **Enable access logging** to track bucket access
4. **Object Lock** for compliance/regulatory requirements

### Reliability
1. **Cross-Region Replication** for DR (enable RTC for SLA)
2. **Versioning** for accidental delete protection
3. **MFA Delete** for critical buckets

---

## 🎯 DVA-C02 Exam Tips

:::tip[S3 Advanced Exam Cheat Sheet]
1. **Replication** requires versioning on both buckets
2. **Delete markers NOT replicated** by default
3. **No chaining** — A→B, B→C does NOT replicate A→C
4. **Existing objects** NOT replicated — use S3 Batch Replication
5. **S3 Select** = single object SQL filter. **Athena** = data lake SQL
6. **Object Lambda** = transform on GET (redact PII, resize images)
7. **Transfer Acceleration** = CloudFront edge for fast uploads
8. **MFA Delete** = root account only, CLI only
9. **Lifecycle** cannot transition backwards (Deep Archive → Standard)
10. **Object Lock Compliance mode** = NOBODY can delete, not even root
:::

---

## Practice Questions

**Q1.** Company replicates S3 from us-east-1 to eu-west-1. User deletes in us-east-1. Deleted in eu-west-1?

A) Yes — always replicated  
B) **No — delete markers not replicated by default**  
C) Yes — if bucket policy allows  
D) No — only new objects replicate  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Delete markers are NOT replicated by default. Enable Delete Marker Replication explicitly to protect against accidental cross-region deletes.
</details>

---

**Q2.** 10GB CSV in S3, need only rows where `status = 'ERROR'`. Most cost-effective?

A) Download and filter locally  
B) Lambda stream processing  
C) **S3 Select**  
D) Athena  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — S3 Select runs SQL server-side on a single object, returning only matching rows. Much cheaper than downloading 10GB.
</details>

---

**Q3.** API returns user data from S3 CSV. For GDPR, PII must be redacted before delivery. Best approach without storing duplicate files?

A) Pre-process and store redacted copies  
B) **S3 Object Lambda to redact on GET**  
C) CloudFront function to redact  
D) API Gateway response mapping  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — S3 Object Lambda transforms data on-the-fly during GET requests. No need to store separate redacted copies.
</details>

---

**Q4.** Bucket A replicates to B, B replicates to C. Does data from A reach C?

A) Yes — replication chains automatically  
B) **No — replication does not chain**  
C) Yes — if all buckets have versioning  
D) Only for SSE-S3 encrypted objects  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Replication does NOT chain. Objects replicated from A→B are not re-replicated B→C. Configure A→B and A→C separately.
</details>

---

**Q5.** Legal compliance requires that objects in a bucket CANNOT be deleted by anyone, including root account, for 7 years. What to use?

A) MFA Delete  
B) Object Lock — Governance Mode  
C) **Object Lock — Compliance Mode**  
D) Bucket policy with explicit Deny  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Compliance Mode prevents deletion by ALL users, including root. Governance Mode can be bypassed with special permissions.
</details>

---

## Interview Questions

1. How do you choose between CRR and SRR for compliance, latency, and operational recovery?
2. When is S3 Object Lambda superior to preprocessing pipelines, and when is it a bad fit?
3. How would you design lifecycle and retention to control cost without violating legal hold requirements?
4. Transfer Acceleration is enabled but performance gains are inconsistent. What do you investigate?

---

## 🔗 Resources

- [S3 Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)
- [S3 Object Lambda](https://docs.aws.amazon.com/AmazonS3/latest/userguide/transforming-objects.html)
- [S3 Select](https://docs.aws.amazon.com/AmazonS3/latest/userguide/selecting-content-from-objects.html)
- [S3 Lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [S3 Batch Operations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/batch-ops.html)
- [S3 Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)
