---
id: index
title: IAM – Identity & Access Management
sidebar_label: "🔐 IAM"
description: >
  Deep dive into AWS IAM for the DVA-C02 exam. Covers users, groups, roles,
  policies (identity vs resource-based), STS, cross-account access, best
  practices, and common exam scenarios.
tags:
  - iam
  - security
  - roles
  - policies
  - sts
  - cross-account
  - dva-c02
  - domain-2
---

# IAM – Identity & Access Management

> **Exam Weight**: Domain 2 (Security) — 26% of exam  
> **Key Theme**: "Who can do what, on which resources, under what conditions?"

---

## 🔰 What Is IAM?

IAM controls **who** (authentication) can do **what** (authorization) on **which AWS resources**. Every AWS API call goes through IAM for permission checks.

**Analogy**: IAM is like building security. **Users** are employees with badges. **Groups** are departments (engineering, finance). **Roles** are temporary visitor passes. **Policies** are the rules posted on each door saying who can enter.

---

## Core Concepts

| Component | Description | Example |
|---|---|---|
| **User** | Long-term credentials for a person/application | Developer Jane |
| **Group** | Collection of users with shared permissions | "BackendDevs" group |
| **Role** | Temporary credentials assumed by services/users | Lambda execution role |
| **Policy** | JSON document defining permissions | "Allow S3 read" |

### IAM Principals

A **principal** is an entity that can make API calls:
- IAM Users
- IAM Roles (assumed by services, users, or federated identities)
- AWS Services (e.g., Lambda, EC2)
- Federated users (SAML, OIDC, Cognito)
- Root account (avoid!)

---

## Policy Structure

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ReadWrite",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "IpAddress": { "aws:SourceIp": "10.0.0.0/24" },
        "StringEquals": { "s3:x-amz-server-side-encryption": "aws:kms" }
      }
    }
  ]
}
```

### Policy Elements

| Element | Required | Description |
|---|---|---|
| **Version** | ✅ | Always `"2012-10-17"` |
| **Statement** | ✅ | Array of permission rules |
| **Effect** | ✅ | `Allow` or `Deny` |
| **Action** | ✅ | API actions (e.g., `s3:GetObject`) |
| **Resource** | ✅* | ARN of resources (* = all) |
| **Principal** | Resource policies only | Who is allowed/denied |
| **Condition** | ❌ Optional | When the rule applies |

### Common Condition Keys

| Key | Purpose | Example |
|---|---|---|
| `aws:SourceIp` | Restrict by IP | Office IP ranges only |
| `aws:PrincipalTag` | Attribute-based access (ABAC) | `department = engineering` |
| `aws:RequestedRegion` | Restrict by region | Only `us-east-1` |
| `aws:MultiFactorAuthPresent` | Require MFA | `true` |
| `s3:prefix` | S3 key prefix | Only `logs/` prefix |

---

## Policy Types

### 1. Identity-Based Policies

Attached to **users, groups, or roles**:

| Subtype | Description |
|---|---|
| **AWS Managed** | Created by AWS (e.g., `AmazonS3ReadOnlyAccess`) |
| **Customer Managed** | Created by you — reusable across entities |
| **Inline** | Embedded directly in a single user/role — not reusable |

### 2. Resource-Based Policies

Attached to the **resource** (S3 bucket, SQS queue, Lambda, KMS key):

```json
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::987654321098:root" },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::shared-bucket/*"
}
```

**Key difference**: Resource policies have a `Principal` element; identity policies don't.

### 3. Permission Boundaries

Set the **maximum** permissions an entity can have — does not grant permissions:

```
Identity Policy: Allow s3:*, dynamodb:*, lambda:*
Permission Boundary: Allow s3:*, dynamodb:*
Effective: Allow s3:*, dynamodb:* (lambda:* denied by boundary)
```

**Use case**: Safely delegate IAM admin to junior devs — they can create roles but only within the boundary.

### 4. Service Control Policies (SCPs)

Account-level restrictions via AWS Organizations:
- Apply to entire accounts or OUs
- Restrict what even root can do
- Do NOT grant permissions — only restrict

### 5. Session Policies

Passed inline during `AssumeRole` — limits that specific session only.

---

## Policy Evaluation Logic

```
1. Is there an explicit DENY?          → DENY ✋ (game over)
2. Is there an SCP that doesn't allow? → DENY ✋
3. Is there a Permission Boundary?     → Must also allow
4. Is there a Resource-Based Policy?   → If allows cross-account, sufficient*
5. Is there an Identity-Based Policy?  → Must allow
6. None of the above allow?            → DENY ✋ (implicit deny)

* Resource-based policies can independently grant cross-account access
  without the caller's identity policy needing to allow it.
```

:::caution[Explicit Deny Always Wins]
An explicit `"Effect": "Deny"` overrides ANY Allow — from any policy, anywhere in the evaluation chain.
:::

### Same-Account vs Cross-Account

| Scenario | What's needed |
|---|---|
| **Same account** | Identity policy OR resource policy (either one) |
| **Cross-account** | Identity policy AND resource policy (both needed) |
| **Exception** | If resource policy specifies the **principal** (not just account), identity policy can be skipped |

---

## IAM Roles & STS

### AssumeRole Flow

```
Your App/Service
    ↓
STS:AssumeRole(RoleArn, SessionName, Duration, ExternalId?)
    ↓
Temporary Credentials (AccessKey + SecretKey + SessionToken)
    ↓
Call AWS APIs with temp credentials (auto-expire)
```

### Key STS APIs

| API | Use Case | Max Duration |
|---|---|---|
| `AssumeRole` | Cross-account or same-account | 1h default, up to 12h |
| `AssumeRoleWithWebIdentity` | OIDC federation (Cognito, Google) | 1h default, up to 12h |
| `AssumeRoleWithSAML` | Corporate SSO (AD/LDAP) | 1h default, up to 12h |
| `GetSessionToken` | MFA-protected API calls | Up to 36h |
| `GetFederationToken` | Temporary access for federated users | Up to 36h |

### Cross-Account Role Assumption

```
Account A (Source)                Account B (Target)
┌──────────────────┐             ┌──────────────────────────┐
│ EC2 Instance     │─AssumeRole─▶│ CrossAccountRole         │
│ with Role A      │             │ Trust Policy:            │
│                  │             │   Principal: Account A   │
│                  │◀─TempCreds──│ Permissions:             │
│                  │             │   s3:GetObject on bucket │
└──────────────────┘             └──────────────────────────┘
```

### Java SDK — Assuming a Role

```java
StsClient stsClient = StsClient.create();

AssumeRoleResponse response = stsClient.assumeRole(AssumeRoleRequest.builder()
    .roleArn("arn:aws:iam::123456789012:role/CrossAccountRole")
    .roleSessionName("my-session")
    .durationSeconds(3600)
    .externalId("unique-external-id")  // Prevents confused deputy
    .build());

Credentials creds = response.credentials();

// Create S3 client with assumed role credentials
S3Client s3 = S3Client.builder()
    .credentialsProvider(StaticCredentialsProvider.create(
        AwsSessionCredentials.create(
            creds.accessKeyId(),
            creds.secretAccessKey(),
            creds.sessionToken())))
    .build();
```

---

## Common Exam Scenarios

### Scenario 1: Lambda accessing DynamoDB
**Answer**: Create IAM **execution role** with DynamoDB permissions. Attach to Lambda. Never use access keys.

### Scenario 2: EC2 in Account A reads S3 in Account B
**Answer**: Create role in Account B with S3 permissions + trust policy for Account A. EC2 calls `AssumeRole`.

### Scenario 3: Third-party SaaS access
**Answer**: Use `AssumeRole` with **ExternalId** condition — prevents confused deputy attack.

### Scenario 4: Developer needs temporary admin access
**Answer**: Create admin role with MFA condition. Developer assumes role with MFA token via `GetSessionToken` first.

---

## 🏆 Best Practices

1. ✅ **IAM Roles** for EC2/Lambda — never hardcode credentials
2. ✅ **Least privilege** — start with nothing, add as needed
3. ✅ **MFA** for privileged users and API calls
4. ✅ **Permission Boundaries** for delegated IAM admin
5. ✅ **Rotate access keys** regularly (or avoid them entirely)
6. ✅ **AWS Organizations + SCPs** for multi-account governance
7. ✅ **Use tags** for ABAC (Attribute-Based Access Control)
8. ❌ Never use root account for daily operations
9. ❌ Never embed credentials in source code
10. ❌ Never share IAM users — one user per person

---

## 🎯 DVA-C02 Exam Tips

:::tip[IAM Exam Cheat Sheet]
1. **Explicit Deny** always wins over any Allow
2. **Cross-account** needs BOTH identity + resource policy
3. **Same-account** needs EITHER identity OR resource policy
4. **ExternalId** prevents confused deputy attack
5. **Permission Boundary** = max permissions (doesn't grant)
6. **SCP** = organization-level guardrails (doesn't grant)
7. **Roles > Users** for services (temporary > long-term creds)
8. **Session duration**: AssumeRole default 1h, max 12h
9. **MFA condition**: `aws:MultiFactorAuthPresent: true`
10. **Resource policies** have `Principal`; identity policies don't
:::

---

## 🧪 Practice Questions

**Q1.** Lambda needs S3 read access. Most secure approach?

A) Store access keys in env variables  
B) Hardcode credentials  
C) **Attach IAM execution role with S3 read permissions**  
D) Use root credentials  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — IAM execution roles provide auto-rotating temporary credentials. Keys and root are anti-patterns.
</details>

---

**Q2.** Identity policy allows `s3:*` but user gets AccessDenied on delete. Most likely cause?

A) S3 needs root for delete  
B) **SCP explicitly denies s3:DeleteBucket**  
C) Missing resource policy  
D) `s3:*` doesn't include delete  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — SCPs sit above identity policies. An explicit Deny in an SCP overrides any Allow.
</details>

---

**Q3.** Third-party needs read access. Security team worried about confused deputy. What to add?

A) `aws:SourceIp` condition  
B) **`sts:ExternalId` condition**  
C) Permission Boundary  
D) SCP  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — `ExternalId` is the standard defense against confused deputy. Third party must supply this ID when assuming the role.
</details>

---

**Q4.** Same-account: Lambda has identity policy allowing S3. No bucket policy. Will it work?

A) No — both policies needed  
B) **Yes — same account needs only ONE policy**  
C) No — bucket policy always required  
D) Only for public buckets  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — In the same account, an Allow in EITHER identity OR resource policy is sufficient. Cross-account requires both.
</details>

---

## 🔗 Resources

- [IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/)
- [IAM Policy Reference](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies.html)
- [STS API Reference](https://docs.aws.amazon.com/STS/latest/APIReference/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Policy Evaluation Logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
