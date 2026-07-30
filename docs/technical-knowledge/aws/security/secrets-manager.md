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

> **Exam hook**: These two services overlap — the exam tests your ability to choose the right one for each scenario.

---

## 🔰 When to Use Which?

**Quick rule**: Need **automatic rotation** for database credentials? → **Secrets Manager**. Need **cheap configuration storage**? → **SSM Parameter Store**.

---

## Side-by-Side Comparison

| Feature | **Secrets Manager** | **SSM Parameter Store** |
|---|---|---|
| **Primary use** | Application secrets (DB passwords, API keys) | Configuration & secrets |
| **Automatic Rotation** | ✅ Native (RDS, Redshift, DocumentDB, custom) | ❌ Manual (custom Lambda) |
| **Cost** | $0.40/secret/month + $0.05/10K API calls | Free (Standard), $0.05/advanced/month |
| **Max value size** | 64 KB | 4 KB (Standard), 8 KB (Advanced) |
| **Cross-account** | ✅ Resource policy | ❌ Limited |
| **Versioning** | ✅ (AWSCURRENT, AWSPREVIOUS, AWSPENDING) | ✅ (by version number/label) |
| **Encryption** | KMS (always encrypted) | Optional KMS (SecureString) |
| **CloudFormation** | `{{resolve:secretsmanager:...}}` | `{{resolve:ssm:...}}` |
| **Lambda Extension** | ✅ Caching extension available | ✅ Same extension |

---

## Secrets Manager Deep Dive

### Secret Rotation Lifecycle

```
1. createSecret    → Generate new credentials (AWSPENDING stage)
2. setSecret       → Update database with new credentials
3. testSecret      → Verify new credentials work against database
4. finishSecret    → Promote AWSPENDING → AWSCURRENT
                     Demote old AWSCURRENT → AWSPREVIOUS
```

### Supported Auto-Rotation

| Database | Rotation Lambda | Managed By |
|---|---|---|
| RDS (MySQL, PostgreSQL, Oracle, SQL Server) | AWS-provided template | AWS |
| Aurora | AWS-provided template | AWS |
| Redshift | AWS-provided template | AWS |
| DocumentDB | AWS-provided template | AWS |
| **Any other** (API keys, 3rd-party) | Custom Lambda you write | You |

### Java — Reading Secrets

```java
// Static init — cache at INIT time (runs once per cold start)
private static final SecretsManagerClient smClient = SecretsManagerClient.create();
private static final ObjectMapper mapper = new ObjectMapper();

private static final DbConfig DB_CONFIG;
static {
    String secretString = smClient.getSecretValue(GetSecretValueRequest.builder()
        .secretId("prod/myapp/db-credentials")
        .build())
        .secretString();
    DB_CONFIG = mapper.readValue(secretString, DbConfig.class);
}

// Handler uses cached DB_CONFIG — no API call on warm invocations
public String handleRequest(Object event, Context context) {
    Connection conn = DriverManager.getConnection(
        DB_CONFIG.getHost(), DB_CONFIG.getUsername(), DB_CONFIG.getPassword());
    // ...
}
```

### Secrets Manager Caching Client

```java
// Reduces API calls by caching secrets in memory with TTL
// Dependency: software.amazon.awssdk:aws-secretsmanager-caching-java
SecretCache cache = new SecretCache(
    SecretCacheConfiguration.builder()
        .maxCacheSize(1000)
        .expiryInMs(300_000)  // 5 minutes
        .build());

String secretString = cache.getSecretString("prod/myapp/db-credentials");
```

### AWS Parameters and Secrets Lambda Extension

```yaml
# No SDK code needed! Use localhost HTTP endpoint
# Add the extension layer
MyFunction:
  Type: AWS::Serverless::Function
  Properties:
    Layers:
      - arn:aws:lambda:us-east-1:177933569100:layer:AWS-Parameters-and-Secrets-Lambda-Extension:11
    Environment:
      Variables:
        SECRETS_MANAGER_TTL: 300  # Cache for 5 minutes
```

```java
// Read secret via HTTP (uses extension's local cache)
HttpClient client = HttpClient.newHttpClient();
HttpResponse<String> response = client.send(
    HttpRequest.newBuilder()
        .uri(URI.create("http://localhost:2773/secretsmanager/get?secretId=prod/myapp/db-credentials"))
        .header("X-Aws-Parameters-Secrets-Token", System.getenv("AWS_SESSION_TOKEN"))
        .build(),
    HttpResponse.BodyHandlers.ofString());
```

### Cross-Account Secret Sharing

```json
// Secret resource policy allowing another account
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::987654321098:role/AppRole" },
  "Action": ["secretsmanager:GetSecretValue"],
  "Resource": "*"
}
```

---

## SSM Parameter Store Deep Dive

### Parameter Types

| Type | Encryption | Use Case |
|---|---|---|
| `String` | None | URLs, feature flags, non-sensitive config |
| `StringList` | None | Comma-separated values |
| `SecureString` | KMS encrypted | Passwords, API keys, tokens |

### Parameter Tiers

| Tier | Max Size | Policies | Throughput | Cost |
|---|---|---|---|---|
| Standard | 4 KB | ❌ | 40 TPS (shared) | Free |
| Advanced | 8 KB | ✅ Expiration, notification | 10,000 TPS | $0.05/month |

### Hierarchical Naming

```
/prod/myapp/db-url          ← String
/prod/myapp/db-password     ← SecureString
/prod/myapp/feature-flags   ← StringList
/dev/myapp/db-url           ← String
/shared/certificates/ssl    ← SecureString
```

```java
// Get all parameters under a path
GetParametersByPathResponse response = ssmClient.getParametersByPath(
    GetParametersByPathRequest.builder()
        .path("/prod/myapp/")
        .withDecryption(true)
        .recursive(true)
        .build());

response.parameters().forEach(p ->
    System.out.println(p.name() + " = " + p.value()));
```

### Parameter Policies (Advanced Tier)

```json
[
  {
    "Type": "Expiration",
    "Version": "1.0",
    "Attributes": { "Timestamp": "2025-12-31T00:00:00.000Z" }
  },
  {
    "Type": "ExpirationNotification",
    "Version": "1.0",
    "Attributes": { "Before": "15", "Unit": "Days" }
  },
  {
    "Type": "NoChangeNotification",
    "Version": "1.0",
    "Attributes": { "After": "90", "Unit": "Days" }
  }
]
```

### CloudFormation Dynamic References

```yaml
# SSM String/StringList
MasterUserPassword: "{{resolve:ssm:/prod/myapp/db-url}}"

# SSM SecureString (MUST use ssm-secure)
MasterUserPassword: "{{resolve:ssm-secure:/prod/myapp/db-password:1}}"

# Secrets Manager
MasterUserPassword: "{{resolve:secretsmanager:prod/myapp/db-creds:SecretString:password}}"
```

:::caution[CloudFormation + SecureString]
You CANNOT use `AWS::SSM::Parameter::Value<String>` parameter type for SecureString. You MUST use dynamic references `{{resolve:ssm-secure:...}}`.
:::

---

## Choosing the Right Service

| Scenario | Best Choice | Why |
|---|---|---|
| RDS password with auto-rotation | **Secrets Manager** | Native rotation support |
| 50 config values, mostly non-sensitive | **SSM Parameter Store** | Free, hierarchical |
| API key rotating every 30 days | **Secrets Manager** | Auto-rotation |
| Feature flags | **SSM Parameter Store (String)** | Free, simple |
| Sensitive config, no rotation | **SSM Parameter Store (SecureString)** | Free with KMS |
| Cross-account secret sharing | **Secrets Manager** | Resource policies |
| CloudFormation template values | **SSM Parameter Store** | Native integration |
| Database connection strings | **Either** | SM if rotation needed, SSM if not |

---

## 🎯 DVA-C02 Exam Tips

:::tip[Secrets & Parameters Exam Cheat Sheet]
1. **Auto-rotation** = Secrets Manager (SSM has no native rotation)
2. **Free storage** = SSM Parameter Store Standard
3. **SecureString** in CloudFormation = `{{resolve:ssm-secure:...}}` (NOT parameter type)
4. **Secrets Manager caching** = use caching client or Lambda extension
5. **Cross-account** = Secrets Manager with resource policy
6. **Reading SecureString** needs both `ssm:GetParameter` AND `kms:Decrypt`
7. **Lambda extension** caches both secrets and parameters locally
8. **Advanced tier** supports parameter policies (expiration, notification)
9. **Secret versions**: AWSCURRENT (active), AWSPREVIOUS (old), AWSPENDING (rotating)
10. **Cost**: $0.40/secret/month (SM) vs Free (SSM Standard)
:::

---

## Practice Questions

**Q1.** RDS password with automatic 30-day rotation. Best service?

A) SSM Parameter Store (SecureString)  
B) **Secrets Manager**  
C) KMS encrypted env variable  
D) S3 encrypted file  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Secrets Manager has native rotation for RDS with AWS-provided Lambda templates.
</details>

---

**Q2.** 50 config values, mostly non-sensitive. Most cost-effective?

A) Secrets Manager (one per value)  
B) **SSM Parameter Store (String + SecureString)**  
C) Environment variables  
D) S3 config file  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — SSM Standard is free. 50 secrets in Secrets Manager = $20/month. Use String for non-sensitive, SecureString for sensitive.
</details>

---

**Q3.** Lambda reads DB secret every invocation — high API costs. Best fix?

A) Cache in DynamoDB  
B) **Secrets Manager caching client or Lambda extension**  
C) Store in env variable  
D) Read only in cold start  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Caching client caches in memory with TTL. Lambda extension provides HTTP-based caching at `localhost:2773`. Both reduce API calls dramatically.
</details>

---

**Q4.** CloudFormation needs SecureString from SSM. How to reference?

A) `AWS::SSM::Parameter::Value<SecureString>`  
B) **`{{resolve:ssm-secure:/path/to/param}}`**  
C) Direct parameter section default  
D) Custom resource Lambda  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — SecureString MUST use dynamic references. The Parameters section doesn't support SecureString type.
</details>

---

## 🔗 Resources

- [Secrets Manager User Guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/)
- [SSM Parameter Store Guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Lambda Secrets Extension](https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html)
- [Rotation Templates](https://docs.aws.amazon.com/secretsmanager/latest/userguide/reference_available-rotation-templates.html)
- [CloudFormation Dynamic References](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references.html)
