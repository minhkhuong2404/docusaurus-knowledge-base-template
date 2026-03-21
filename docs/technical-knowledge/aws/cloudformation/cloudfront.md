---
id: cloudfront
title: Amazon CloudFront
sidebar_label: "🌍 CloudFront"
description: >
  Amazon CloudFront for DVA-C02. Origins, distributions, cache behaviors,
  TTL, signed URLs vs signed cookies, OAC/OAI for S3, Lambda@Edge,
  CloudFront Functions, and HTTPS enforcement.
tags:
  - cloudfront
  - cdn
  - caching
  - signed-url
  - lambda-edge
  - s3
  - dva-c02
  - domain-1
  - domain-2
---

# Amazon CloudFront

> **Core concept**: CloudFront is a global **CDN** — caches content at 400+ edge locations worldwide, reducing latency and origin load.

---

## Key Concepts

| Term | Description |
|---|---|
| **Distribution** | A CloudFront deployment with origins + behaviors |
| **Origin** | Where CloudFront fetches content from (S3, ALB, EC2, API Gateway, custom HTTP) |
| **Edge Location** | Cache server close to end users (400+ worldwide) |
| **Cache Behavior** | URL path pattern → cache settings (e.g., `/api/*` = no cache, `/static/*` = 1 day) |
| **TTL** | How long content stays cached (default 24h, min 0s, max 1 year) |
| **Invalidation** | Force-purge cached content (`/*` or `/path/file.js`) |

---

## Origins

```
Distribution
  ├── Origin 1: S3 Bucket (static assets)
  ├── Origin 2: ALB (dynamic API)
  └── Origin 3: Custom HTTP (on-premises)

Cache Behaviors:
  /api/*      → Origin 2 (ALB), cache TTL = 0
  /static/*   → Origin 1 (S3), cache TTL = 86400
  /*          → Origin 1 (S3) [default]
```

---

## S3 + CloudFront — Origin Access Control (OAC)

Keep S3 bucket **private** — only CloudFront can access it:

```json
// S3 Bucket Policy — allow only CloudFront OAC
{
  "Effect": "Allow",
  "Principal": {
    "Service": "cloudfront.amazonaws.com"
  },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::my-bucket/*",
  "Condition": {
    "StringEquals": {
      "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/EDFDVBD6EXAMPLE"
    }
  }
}
```

:::note OAC vs OAI
**OAC** (Origin Access Control) is the **newer, recommended** replacement for OAI (Origin Access Identity). OAC supports SSE-KMS encrypted S3 buckets; OAI does not.
:::

---

## Signed URLs vs Signed Cookies

| Feature | Signed URL | Signed Cookie |
|---|---|---|
| **Scope** | Single file | Multiple files / entire distribution |
| **Use case** | Presigned download link | Premium video streaming, gated content |
| **Implementation** | Per URL | Set once in browser cookie |

```java
// Generate CloudFront Signed URL (Java SDK)
CloudFrontUtilities cloudFrontUtilities = CloudFrontUtilities.create();

SignedUrl signedUrl = cloudFrontUtilities.getSignedUrlWithCannedPolicy(
    SignUrlRequest.builder()
        .resourceUrl("https://d111111abcdef8.cloudfront.net/private/video.mp4")
        .keyPairId("APKAEIBAERJR2EXAMPLE")
        .privateKey(Path.of("/path/to/private-key.pem"))
        .expirationDate(Instant.now().plus(Duration.ofHours(2)))
        .build());
```

---

## Cache Invalidation

```bash
# Invalidate specific path
aws cloudfront create-invalidation \
    --distribution-id EDFDVBD6EXAMPLE \
    --paths "/index.html" "/css/*"

# Invalidate everything (first 1000 paths/month free, then $0.005/path)
aws cloudfront create-invalidation \
    --distribution-id EDFDVBD6EXAMPLE \
    --paths "/*"
```

:::tip Version files instead of invalidating
Use cache-busting filenames (`app.v2.js`, `style.abc123.css`) instead of invalidations — faster, cheaper, no propagation delay.
:::

---

## Lambda@Edge vs CloudFront Functions

| | CloudFront Functions | Lambda@Edge |
|---|---|---|
| **Runtime** | JavaScript (ES5.1) | Node.js, Python |
| **Triggers** | Viewer request/response only | Viewer + Origin request/response |
| **Execution location** | 400+ edge locations | Regional edge (13 locations) |
| **Max execution time** | 1 ms | 5 seconds (viewer), 30s (origin) |
| **Max memory** | 2 MB | 128 MB – 10 GB |
| **Use case** | URL rewrites, header manipulation, A/B routing, simple auth | Complex auth, body modification, DB lookups |
| **Cost** | ~6× cheaper | More expensive |

### CloudFront Functions — URL Rewrite Example

```javascript
// CloudFront Function — rewrite /blog/post-1 → /blog/index.html
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Add index.html to paths without extension
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    } else if (!uri.includes('.')) {
        request.uri += '/index.html';
    }
    
    return request;
}
```

---

## HTTPS Enforcement

```json
// Force HTTPS redirect at CloudFront level
{
  "ViewerProtocolPolicy": "redirect-to-https",
  // Options: allow-all, https-only, redirect-to-https
}
```

---

## Cache Key Customization

```json
// Cache based on query string, headers, cookies
{
  "CachePolicyConfig": {
    "ParametersInCacheKeyAndForwardedToOrigin": {
      "EnableAcceptEncodingGzip": true,
      "QueryStringsConfig": {
        "QueryStringBehavior": "whitelist",
        "QueryStrings": { "Items": ["version", "locale"] }
      },
      "HeadersConfig": {
        "HeaderBehavior": "none"  // Don't cache per-header (unless needed)
      }
    }
  }
}
```

---

## 🧪 Practice Questions

**Q1.** A developer hosts a React SPA in S3, served via CloudFront. The S3 bucket must remain private. How should they configure this?

A) Make the S3 bucket public  
B) Use a signed URL for every request  
C) Configure **Origin Access Control (OAC)** on the distribution and a bucket policy allowing only CloudFront  
D) Enable S3 static website hosting  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **OAC** (or legacy OAI) makes CloudFront the only allowed origin for the private S3 bucket. The bucket policy allows `s3:GetObject` only from the specific CloudFront distribution's service principal.
</details>

---

**Q2.** Users need time-limited access to a private video (single file) stored behind CloudFront. What feature should the developer use?

A) S3 Presigned URL  
B) CloudFront **Signed URL** with an expiration  
C) CloudFront Signed Cookie  
D) S3 Bucket Policy with IP restriction  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **CloudFront Signed URL** grants time-limited access to a single resource (specific file). Signed Cookies are better for multiple files (e.g., an entire video library). S3 Presigned URL bypasses CloudFront, losing CDN benefits.
</details>

---

**Q3.** A team needs to perform a simple URL rewrite (add `/index.html` to directory paths) at the CloudFront edge. Which is the MOST cost-effective option?

A) Lambda@Edge  
B) API Gateway with redirect  
C) **CloudFront Functions**  
D) S3 Static Website Hosting redirect rules  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **CloudFront Functions** execute at 400+ edge locations with sub-millisecond latency and are ~6× cheaper than Lambda@Edge. They're perfect for simple URL manipulations, header rewrites, and lightweight auth checks.
</details>

---

## 🔗 Resources

- [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/)
- [CloudFront Functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html)
- [Lambda@Edge](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html)
- [Signed URLs and Cookies](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html)
