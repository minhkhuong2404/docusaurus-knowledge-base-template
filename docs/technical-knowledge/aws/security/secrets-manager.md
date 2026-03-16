---
id: secrets-manager
title: Secrets Manager & SSM Parameter Store
sidebar_label: "🔒 Secrets & Parameters"
description: >
  AWS Secrets Manager vs SSM Parameter Store for DVA-C02. Automatic rotation,
  Lambda integration, cross-account access, SecureString, versioning,
  and the key differences tested on the exam.
tags:
  - secrets-manager
  - ssm
  - parameter-store
  - rotation
  - security
  - dva-c02
  - domain-2
---

# Secrets Manager vs SSM Parameter Store

> **Exam hook**: These two services overlap — the exam will ask you to choose the right one for a given scenario.

---

## Side-by-Side Comparison

| Feature | **Secrets Manager** | **SSM Parameter Store** |
|---|---|---|
| **Primary use** | Application secrets (DB passwords, API keys) | Configuration & secrets |
| **Automatic Rotation** | ✅ Native (RDS, Redshift, DocumentDB, custom Lambda) | ❌ Manual (use custom Lambda) |
| **Cost** | $0.40/secret/month + API calls | Free (Standard), $0.05/advanced/month |
| **Max value size** | 64KB | 4KB (Standard), 8KB (Advanced) |
| **Cross-account** | ✅ Resource policy | Limited |
| **Versioning** | ✅ (AWSCURRENT, AWSPREVIOUS, AWSPENDING) | ✅ (by version number/label) |
| **Encryption** | KMS (required) | SSE with KMS (optional for SecureString) |
| **AWS SDK** | Separate Secrets Manager SDK calls | SSM SDK calls |

---

## Secrets Manager — Deep Dive

### Secret Rotation

```
Application reads secret → AWSCURRENT version

Rotation triggers Lambda:
  1. CreateSecret  → generate new credentials (AWSPENDING)
  2. SetSecret     → update credentials in the database
  3. TestSecret    → verify new credentials work
  4. FinishSecret  → promote AWSPENDING → AWSCURRENT
                     demote old AWSCURRENT → AWSPREVIOUS
```

### Java — Reading a Secret

```java
SecretsManagerClient client = SecretsManagerClient.create();

GetSecretValueResponse response = client.getSecretValue(
    GetSecretValueRequest.builder()
        .secretId("prod/myapp/db-password")
        .build());

String secretString = response.secretString();
// Or parse as JSON for structured secrets
var dbConfig = objectMapper.readValue(secretString, DbConfig.class);
```

### Caching (Important for Lambda!)

```java
// Use the caching client to avoid calling Secrets Manager on every invocation
// Add: software.amazon.awssdk.secretsmanager:aws-secretsmanager-caching-java
SecretsManagerCachingClient cachingClient = new SecretsManagerCachingClient(
    SecretsManagerClient.create(),
    SecretCacheConfiguration.builder()
        .maxCacheSize(1000)
        .build());

String secret = cachingClient.getSecretString("prod/myapp/db-password");
```

---

## SSM Parameter Store — Deep Dive

### Parameter Types

| Type | Description |
|---|---|
| `String` | Plain text, no encryption |
| `StringList` | Comma-separated list |
| `SecureString` | Encrypted with KMS |

### Parameter Tiers

| Tier | Max size | Advanced features | Cost |
|---|---|---|---|
| Standard | 4KB | No | Free |
| Advanced | 8KB | Parameter policies, larger | $0.05/month |

### Java — Reading Parameters

```java
SsmClient ssm = SsmClient.create();

// Read single parameter
GetParameterResponse response = ssm.getParameter(
    GetParameterRequest.builder()
        .name("/prod/myapp/db-url")
        .withDecryption(true)  // Decrypt SecureString
        .build());

String dbUrl = response.parameter().value();

// Read multiple parameters at once (efficient for config loading at startup)
GetParametersByPathResponse allParams = ssm.getParametersByPath(
    GetParametersByPathRequest.builder()
        .path("/prod/myapp/")
        .withDecryption(true)
        .recursive(true)
        .build());
```

### Hierarchical Naming

```
/prod/myapp/db-url
/prod/myapp/db-password   ← SecureString
/prod/myapp/feature-flags
/dev/myapp/db-url
```

`GetParametersByPath("/prod/myapp/")` returns all parameters in that hierarchy.

---

## Choosing the Right Service

| Scenario | Use |
|---|---|
| Database password with **auto-rotation** | **Secrets Manager** |
| Store 10+ app config values cheaply | **SSM Parameter Store** |
| API key that must rotate every 30 days | **Secrets Manager** |
| Feature flags / non-sensitive config | **SSM Parameter Store (String)** |
| Sensitive config, no rotation needed | **SSM Parameter Store (SecureString)** |
| Cross-account secret sharing | **Secrets Manager** |

---

## 🧪 Practice Questions

**Q1.** A developer needs to store an RDS password and have it automatically rotated every 30 days. Which service is the BEST choice?

A) SSM Parameter Store (SecureString)  
B) AWS Secrets Manager  
C) KMS encrypted environment variable  
D) S3 encrypted file  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **Secrets Manager** has built-in native rotation for RDS. It calls a rotation Lambda that creates new DB credentials, updates them in the database, then updates the secret — all automatically.
</details>

---

**Q2.** An application stores 50 configuration values (database URLs, feature flags, thresholds). Most are non-sensitive. What is the MOST cost-effective storage?

A) Secrets Manager — one secret per value  
B) SSM Parameter Store — String type for non-sensitive, SecureString for sensitive  
C) Environment variables  
D) S3 config file  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **SSM Parameter Store Standard** is **free** for standard parameters. Secrets Manager costs $0.40/secret/month, which adds up for 50 values. Use SecureString for sensitive values, String for the rest.
</details>

---

**Q3.** A Lambda function reads a database secret on every invocation, causing high Secrets Manager API costs. What is the BEST fix?

A) Cache the secret in a DynamoDB table  
B) Use the **Secrets Manager caching client** in the Lambda initialization code  
C) Store the secret in an environment variable  
D) Call `GetSecretValue` only in the warm-up phase  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — The **Secrets Manager Caching Client** library caches secrets in memory with a configurable TTL. Since Lambda reuses execution environments (warm invocations), the cached value is used for subsequent calls, drastically reducing API calls.
</details>

---

## 🔗 Resources

- [Secrets Manager User Guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/)
- [SSM Parameter Store User Guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Secrets Manager Java Caching Client](https://github.com/aws/aws-secretsmanager-caching-java)
- [Rotation Lambda Templates](https://docs.aws.amazon.com/secretsmanager/latest/userguide/reference_available-rotation-templates.html)
