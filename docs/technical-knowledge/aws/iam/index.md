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

## Core Concepts

### IAM Building Blocks

| Component | Description |
|---|---|
| **User** | Long-term credential for a person or application |
| **Group** | Collection of users — attach policies to group |
| **Role** | Temporary credentials — assumed by services, users, or external identities |
| **Policy** | JSON document defining permissions |

:::tip Think of it this way (Java analogy)
- **User** = a named instance
- **Group** = an interface users implement
- **Role** = a context you `assume()` temporarily
- **Policy** = an `@Authorized` annotation on steroids
:::

---

## Policy Types

### 1. Identity-Based Policies
Attached to **users, groups, or roles**.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

### 2. Resource-Based Policies
Attached directly to the **resource** (S3 bucket, SQS queue, Lambda function).

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::123456789012:role/LambdaRole" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

### 3. Permission Boundaries
Set the **maximum** permissions an entity can have. Used to delegate IAM admin without granting all permissions.

### 4. Service Control Policies (SCPs)
Apply to an **AWS Organization** account — restrict what even account root can do.

### 5. Session Policies
Passed inline when using `AssumeRole` — limits permissions for that session only.

---

## Policy Evaluation Logic

```
Explicit DENY? → DENY ✋
No explicit ALLOW? → DENY ✋  
Explicit ALLOW exists? → ALLOW ✅
```

:::caution
An explicit **Deny always wins** over any Allow — even from a different policy.
:::

---

## IAM Roles & STS

### AssumeRole Flow

```
Your App / Service
      │
      ▼
STS:AssumeRole(RoleArn, Duration, ExternalId?)
      │
      ▼
Temporary Credentials (AccessKey + SecretKey + SessionToken)
      │
      ▼
Call AWS APIs with temp credentials
```

### Key STS APIs

| API | Use Case |
|---|---|
| `AssumeRole` | Cross-account or same-account role assumption |
| `AssumeRoleWithWebIdentity` | Federate with OIDC (Cognito, Google, GitHub) |
| `AssumeRoleWithSAML` | Corporate SSO (AD/LDAP via SAML 2.0) |
| `GetSessionToken` | MFA enforcement for API calls |

### Cross-Account Role Assumption

```
Account A (Trusting)          Account B (Trusted)
┌─────────────────────┐       ┌──────────────────────┐
│  App in Account A   │──────▶│  Role in Account B    │
│  calls AssumeRole   │       │  Trust Policy allows  │
│  with Role ARN      │       │  Account A principal  │
└─────────────────────┘       └──────────────────────┘
```

---

## IAM Best Practices (Exam Favorites)

1. ✅ Use **IAM Roles** for EC2/Lambda — never hardcode credentials
2. ✅ Apply **least privilege** — start with nothing, add as needed
3. ✅ Enable **MFA** for privileged users
4. ✅ Use **Permission Boundaries** to safely delegate IAM
5. ✅ Rotate access keys regularly
6. ✅ Use **AWS Organizations + SCPs** for multi-account governance
7. ❌ Never use root account for daily operations
8. ❌ Never embed credentials in source code

---

## Java SDK — Assuming a Role

```java
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.model.*;

StsClient stsClient = StsClient.create();

AssumeRoleResponse response = stsClient.assumeRole(AssumeRoleRequest.builder()
    .roleArn("arn:aws:iam::123456789012:role/CrossAccountRole")
    .roleSessionName("my-session")
    .durationSeconds(3600)
    .build());

Credentials creds = response.credentials();
// Use creds.accessKeyId(), creds.secretAccessKey(), creds.sessionToken()
```

---

## Common Exam Scenarios

### Scenario 1: Lambda accessing DynamoDB
**Solution**: Create an **IAM Role** with a DynamoDB policy. Attach the role to the Lambda function (Execution Role). Never use access keys.

### Scenario 2: EC2 in Account A reads S3 in Account B
**Solution**: 
1. Create a role in **Account B** with S3 permissions
2. Trust policy allows Account A's EC2 role
3. EC2 calls `AssumeRole` to get temp credentials

### Scenario 3: Third-party SaaS needs access
**Solution**: Use `AssumeRole` with an **ExternalId** condition to prevent the "confused deputy" problem.

---

## 🧪 Practice Questions

**Q1.** A developer's Lambda function needs to read from an S3 bucket. What is the MOST secure and AWS-recommended approach?

A) Store AWS access keys in Lambda environment variables  
B) Hardcode credentials in the Lambda source code  
C) Attach an IAM execution role to the Lambda function with S3 read permissions  
D) Use root account credentials  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Always use IAM execution roles for Lambda. The role provides temporary credentials automatically via the instance metadata service — no keys needed.

`A` and `B` are security anti-patterns. `D` is never acceptable.
</details>

---

**Q2.** Which IAM policy element can DENY a specific action even when another policy grants it?

A) `NotAction`  
B) `Condition`  
C) An explicit `"Effect": "Deny"` statement  
D) `Principal`  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — An explicit Deny always overrides any Allow, regardless of which policy document it comes from.
</details>

---

**Q3.** A company uses a third-party auditing tool that needs read access to their AWS resources. The security team is worried about the **confused deputy problem**. What should they add to the role's trust policy?

A) A condition with `aws:SourceIp`  
B) A condition with `sts:ExternalId`  
C) A Permission Boundary  
D) An SCP  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — `sts:ExternalId` is the standard defense against confused deputy. The external party must supply this secret ID when assuming the role, preventing unauthorized cross-account access.
</details>

---

**Q4.** What is the maximum duration (in hours) for a role session assumed via `AssumeRole` by default?

A) 1 hour  
B) **1 hour** (default), up to 12 hours if configured on the role  
C) 24 hours  
D) 36 hours  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Default is **1 hour**. You can set `MaxSessionDuration` on the role up to **12 hours**. Lambda uses a 1-hour auto-renewed credential.
</details>

---

## 🔗 Resources

- [IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/)
- [IAM Policy Reference](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies.html)
- [STS API Reference](https://docs.aws.amazon.com/STS/latest/APIReference/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
