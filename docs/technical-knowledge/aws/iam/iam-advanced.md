---
id: iam-advanced
title: Advanced IAM Security
sidebar_label: "🛡️ Advanced IAM"
description: Advanced IAM concepts for DVA-C02. Evaluation logic, SCPs, permissions boundaries, Cross-Account Access, and Web Identity Federation.
tags: [iam, security, scp, cross-account, federation, cognito, dva-c02]
---

import AwsIamPolicyEvaluationDiagram from '@site/src/components/AwsIamPolicyEvaluationDiagram';

# Advanced IAM & Security

> IAM is arguably the most complex and critical service in AWS. These advanced topics appear frequently on the DVA-C02 exam.

---

## IAM Policy Evaluation Logic (Complete Flow)

When AWS evaluates an API request, it follows a strict order:

<AwsIamPolicyEvaluationDiagram />

**Key rule**: For an action to be allowed, ALL applicable policy types must allow it. ONE explicit Deny anywhere = denied.

---

## Identity Policies vs Resource Policies

| Characteristic | Identity Policy | Resource Policy |
|---|---|---|
| **Attached to** | IAM User, Group, or Role | S3 Bucket, KMS Key, SQS Queue, Lambda |
| **Defines** | What this identity can do | Who can access this resource |
| **Principal element** | ❌ Cannot have | ✅ MUST have |
| **Cross-account** | Grants outbound access | Grants inbound access |

### Same-Account Access

```
Either identity policy OR resource policy can grant access.
You don't need both — just one Allow is sufficient.
```

### Cross-Account Access

```
Account A's identity policy must allow the action
    AND
Account B's resource policy must allow Account A's principal

EXCEPTION: If the resource policy specifies the exact role ARN
(not just the account), the identity policy is not strictly needed.
```

### Resource Policies That Support Cross-Account

| Service | Resource Policy Name |
|---|---|
| S3 | Bucket Policy |
| SQS | Queue Policy |
| SNS | Topic Policy |
| Lambda | Function Policy |
| KMS | Key Policy |
| ECR | Repository Policy |
| API Gateway | Resource Policy |
| Secrets Manager | Resource Policy |

---

## Permissions Boundaries

A Permissions Boundary sets the **maximum** permissions. It does NOT grant permissions on its own.

### Effective Permissions = Intersection

| Policy Type | Declared Allowed Actions | Set Logic | Effective Runtime Result |
|---|---|---|---|
| **Identity-Based Policy** | `s3:*`, `dynamodb:*`, `lambda:*` | Requested Privileges | — |
| **Permissions Boundary** | `s3:Get*`, `dynamodb:*` | **$\cap$ Maximum Allow Ceiling** | — |
| **Effective Permissions** | `s3:Get*`, `dynamodb:*` | **$Identity \cap Boundary$** | `lambda:*` and `s3:Put*` are **strictly blocked**! |

### Delegated Administration Use Case

**Problem**: Senior admin wants to let junior dev create Lambda execution roles, but prevent privilege escalation.

```json
// Step 1: Create Permission Boundary policy
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "dynamodb:GetItem", "dynamodb:PutItem", "logs:*"],
    "Resource": "*"
  }]
}

// Step 2: Allow junior dev to create roles WITH boundary attached
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["iam:CreateRole", "iam:PutRolePolicy", "iam:AttachRolePolicy"],
    "Resource": "*",
    "Condition": {
      "StringEquals": {
        "iam:PermissionsBoundary": "arn:aws:iam::123456789012:policy/LambdaBoundary"
      }
    }
  }]
}
```

Now the junior dev can create roles, but every role MUST have the boundary — preventing them from creating overly permissive roles.

---

## Service Control Policies (SCPs)

SCPs are **guardrails** for AWS Organizations:

```
AWS Organization
├── Root
│   └── SCP: "DenyDeleteS3" (applied to all accounts)
│       ├── OU: Production
│       │   └── SCP: "DenyNonApprovedRegions"
│       │       ├── Account: prod-us-east-1
│       │       └── Account: prod-eu-west-1
│       └── OU: Development
│           └── No additional SCP (inherits root)
│               └── Account: dev-sandbox
```

**Key rules**:
- SCPs do NOT grant permissions — they only restrict
- SCPs apply to all users/roles in the account (including root!)
- Management account is NOT affected by SCPs
- SCPs must explicitly Allow actions (deny-by-default)

### Common SCP Patterns

```json
// Deny all regions except approved ones
{
  "Effect": "Deny",
  "Action": "*",
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "aws:RequestedRegion": ["us-east-1", "eu-west-1"]
    }
  }
}
```

```json
// Prevent disabling CloudTrail
{
  "Effect": "Deny",
  "Action": ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail"],
  "Resource": "*"
}
```

---

## Cross-Account Role Assumption (STS) Deep Dive

### Step-by-Step

```
1. Account B (target) creates a role: CrossAccountRole
2. Account B's Trust Policy allows Account A:

   {
     "Effect": "Allow",
     "Principal": { "AWS": "arn:aws:iam::111111111111:root" },
     "Action": "sts:AssumeRole",
     "Condition": {
       "StringEquals": { "sts:ExternalId": "shared-secret-123" }
     }
   }

3. Account A's identity policy allows sts:AssumeRole on Account B's role ARN
4. Account A calls sts:AssumeRole with ExternalId
5. STS returns temporary credentials valid for 1-12 hours
```

### Confused Deputy Prevention

```
Without ExternalId:
  Attacker (Account C) tricks Service into assuming role in Account B
  → Service uses its own credentials to assume the role
  → Attacker gains access to Account B's resources

With ExternalId:
  Role requires ExternalId that only legitimate caller knows
  → Attacker can't provide the correct ExternalId
  → AssumeRole fails
```

---

## Web Identity Federation

### OIDC Federation (Mobile/Web Apps)

```
User → Login with Google/Apple → JWT Token
    → Cognito Identity Pool (or direct AssumeRoleWithWebIdentity)
    → STS returns temporary AWS credentials
    → App calls S3/DynamoDB directly
```

### SAML 2.0 Federation (Corporate)

```
Employee → Login via AD/Okta → SAML Assertion
    → App calls sts:AssumeRoleWithSAML
    → STS returns temporary AWS credentials
    → Employee accesses AWS Console or APIs
```

### IAM Identity Center (SSO)

- Modern replacement for manual SAML federation
- Centralized access management for all AWS accounts
- Integrates with AD, Okta, Azure AD
- Provides temporary credentials via SSO portal

---

## Attribute-Based Access Control (ABAC)

Instead of creating separate policies per team, use **tags** as policy conditions:

```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::company-data/*",
  "Condition": {
    "StringEquals": {
      "s3:ExistingObjectTag/department": "${aws:PrincipalTag/department}"
    }
  }
}
```

**Benefits**: One policy works for all teams. New team? Just tag the user — no policy changes.

---

## 🎯 DVA-C02 Exam Tips

:::tip[Advanced IAM Exam Cheat Sheet]
1. **Explicit Deny** always wins — no exceptions
2. **SCP** doesn't grant — only restricts (and doesn't affect management account)
3. **Permission Boundary** = max permissions ceiling (intersection with identity policy)
4. **Cross-account** = identity policy + resource policy (both needed)
5. **Same-account** = either identity OR resource policy sufficient
6. **ExternalId** = confused deputy prevention for third-party access
7. **Resource policies** with specific principal can grant cross-account independently
8. **ABAC** = tag-based policies scale better than role-per-team
9. **AssumeRole** default 1h, max 12h (configured on the role)
10. **IAM Identity Center** = modern SSO for organizations
:::

---

## Practice Questions

**Q1.** IAM user has `s3:*` policy. SCP denies `s3:DeleteBucket`. User tries to delete. Result?

A) Allowed — identity policy permits  
B) **Denied — SCP explicit deny wins**  
C) Allowed — SCP doesn't affect users  
D) Depends on bucket policy  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — SCPs restrict ALL principals in the account. Explicit Deny in SCP overrides any Allow.
</details>

---

**Q2.** Cross-account: Account A needs S3 access in Account B. Most secure approach?

A) Share access keys  
B) VPC Peering  
C) **IAM Role in Account B + AssumeRole from Account A**  
D) Public bucket  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — AssumeRole provides temporary credentials. VPC Peering is for network connectivity, not S3 access control.
</details>

---

**Q3.** Junior dev creates a Lambda role with `AdministratorAccess`. How to prevent this?

A) Remove `iam:CreateRole` from the dev  
B) **Require a Permission Boundary on all created roles**  
C) SCP denying `iam:CreateRole`  
D) Enable MFA  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Permission Boundaries ensure any role the dev creates is capped at the boundary's permissions, preventing privilege escalation.
</details>

---

**Q4.** Role in Account B has trust policy allowing Account A. Account A's user has NO identity policy for AssumeRole. Can the user assume the role?

A) **No — identity policy must also allow sts:AssumeRole**  
B) Yes — trust policy is sufficient  
C) Yes — if ExternalId matches  
D) Depends on SCP  

<details>
<summary>✅ Answer & Explanation</summary>

**A** — Cross-account access requires BOTH the resource policy (trust policy) AND the identity policy. The user needs `sts:AssumeRole` permission on the target role ARN.
</details>

---

## 🔗 Resources

- [IAM Policy Evaluation Logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [Permission Boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)
- [SCPs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)
- [ABAC in AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction_attribute-based-access-control.html)
- [Confused Deputy Problem](https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html)
