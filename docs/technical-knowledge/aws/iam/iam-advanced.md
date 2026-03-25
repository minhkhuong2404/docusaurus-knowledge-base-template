---
id: iam-advanced
title: Advanced IAM Security
sidebar_label: "🛡️ Advanced IAM"
description: Advanced IAM concepts for DVA-C02. Evaluation logic, SCPs, permissions boundaries, Cross-Account Access, and Web Identity Federation.
tags: [iam, security, scp, cross-account, federation, cognito, dva-c02]
---

# Advanced IAM & Security

IAM is arguably the most complex and critical service in AWS. 

---

## IAM Evaluation Logic

When AWS decides whether to allow or deny an API request, it evaluates policies in a strict order.

1. **Default Deny**: By default, all requests are denied.
2. **Explicit Deny**: If *any* policy anywhere in the chain explicitly says `"Effect": "Deny"`, the request is **immediately rejected**. Explicit Deny always overrides any Allow.
3. **Service Control Policies (SCPs)**: Evaluated first at the AWS Organizations level.
4. **Permissions Boundaries**: Evaluated on the IAM Role.
5. **Resource Policies**: Attached directly to the resource (e.g., S3 Bucket Policy, KMS Key Policy).
6. **Identity Policies**: Attached to the user or role making the request.

*(To grant an `Allow`, the SCP, Permissions Boundary, and Identity/Resource policy must **ALL** allow it).*

---

## Identity Policies vs Resource Policies

| Characteristic | Identity Policy | Resource Policy |
|---|---|---|
| **Attached to** | IAM User, Group, or Role | S3 Bucket, KMS Key, SQS Queue |
| **Defines** | What this identity can do | Who can access this resource |
| **Principal element** | ❌ Cannot have a `Principal` | ✅ MUST have a `Principal` |

**Example:** Giving an EC2 instance access to an S3 bucket in the *same account*.
- You can either attach an Identity Policy to the EC2 Role allowing `s3:GetObject`.
- OR you can attach a Resource Policy to the S3 Bucket allowing the EC2 Role.
- *(You only need one or the other).*

**Exception - Cross Account Access:**
If account A wants to access a bucket in account B, Account A's Identity Policy must allow it, **AND** Account B's Resource Policy must allow it.

---

## Permissions Boundaries

A Permissions Boundary sets the **maximum** permissions an IAM entity can have. It does not grant permissions on its own.

**Use Case (Delegated Administration):**
You are a Senior Admin. You want to allow a junior developer to create their own IAM roles for their Lambda functions, but you want to ensure they don't give their Lambda functions `AdministratorAccess`.

1. You create a Permissions Boundary policy restricting access to only specific S3 buckets and DynamoDB tables.
2. You grant the developer `iam:CreateRole`, but with a `iam:PermissionsBoundary` condition.
3. The developer can now create roles, but the roles **must** have that rigid boundary attached, preventing privilege escalation.

---

## Cross-Account Role Assumption (STS)

To access resources in another AWS account securely, never share long-term Access Keys. Use `STS AssumeRole`.

1. **Account Dev** has `DevUser`.
2. **Account Prod** creates a role called `CrossAccountAdminRole`.
3. **Account Prod** configures the Trust Policy (Resource Policy for the Role) of `CrossAccountAdminRole` to set the `Principal` to `arn:aws:iam::DevAccountID:user/DevUser`.
4. `DevUser` calls `sts:AssumeRole` providing the ARN of the Prod role.
5. AWS returns temporary credentials (Access Key, Secret Key, Session Token) valid for 15 mins to 12 hours.

---

## Web Identity Federation (OIDC/SAML)

If you have users logging in from Google, Facebook, or a corporate Active Directory, you do not create standard IAM users for them. You federate them.

**Corporate App (SAML 2.0)**
1. User logs via Microsoft Active Directory.
2. AD returns a SAML assertion.
3. App calls `sts:AssumeRoleWithSAML` sending the assertion.
4. AWS returns temporary credentials.

**Mobile App (OIDC/Cognito)**
1. User logs into your iOS app via Apple/Google.
2. Apple returns a JSON Web Token (JWT).
3. App sends JWT to **Amazon Cognito Identity Pools** (Federated Identities).
4. Cognito calls `sts:AssumeRoleWithWebIdentity` behind the scenes and returns temporary AWS credentials directly to the mobile device allowing it to read from an S3 bucket safely.

---

## 🧪 Practice Questions

**Q1.** A developer created an IAM user and attached a policy granting `s3:*` on all buckets. However, the user receives an `AccessDenied` error when trying to delete an S3 bucket. What is the most likely cause?

A) Amazon S3 bucket deletion requires Root credentials.  
B) An AWS Organizations Service Control Policy (SCP) is explicitly denying bucket deletion for the account.  
C) The S3 bucket doesn't have a resource policy explicitly allowing the user.  
D) The IAM user needs `s3:DeleteBucket` explicitly defined, not just `s3:*`.  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **SCPs** sit above everything. Even if an Identity Policy allows `s3:*`, if an SCP explicitly denies `s3:DeleteBucket`, the explicit deny always wins. (A Resource Policy isn't required if the Identity Policy allows it in the same account).
</details>

---

**Q2.** An application needs to access an S3 bucket in a different AWS account. Which mechanism is the most secure and scalable?

A) Generate long-term Access Key and Secret Key in the target account and store them in the application code.  
B) Use VPC Peering to route the traffic privately.  
C) Create an IAM Role in the target account with cross-account access and use `sts:AssumeRole` to retrieve temporary credentials.  
D) Open the S3 bucket to public access and use pre-signed URLs.  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **STS AssumeRole** is the best practice for cross-account access because it uses temporary, short-lived credentials.
</details>
