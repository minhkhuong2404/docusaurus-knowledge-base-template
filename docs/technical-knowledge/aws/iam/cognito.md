---
id: cognito
title: Amazon Cognito
sidebar_label: "👤 Cognito"
description: >
  AWS Cognito for DVA-C02 — User Pools vs Identity Pools, JWT tokens,
  hosted UI, federation with social providers, Cognito Sync, and all
  common exam patterns. Java SDK examples included.
tags:
  - cognito
  - security
  - authentication
  - user-pools
  - identity-pools
  - jwt
  - oauth
  - federation
  - dva-c02
  - domain-2
---

# Amazon Cognito

> **Core concept**: Cognito handles **AuthN** (who are you?) via User Pools and **AuthZ** (what can you access in AWS?) via Identity Pools.

---

## User Pools vs Identity Pools

| Feature | **User Pool** | **Identity Pool** |
|---|---|---|
| **Purpose** | Authenticate users (sign up / sign in) | Grant AWS credentials to authenticated users |
| **Returns** | JWT tokens (ID, Access, Refresh) | Temporary AWS credentials (via STS) |
| **Use case** | Log into your **app** | Call AWS services (S3, DynamoDB) directly |
| **Think of it as** | Your app's user directory + OAuth server | AWS IAM role vending machine |

:::tip Analogy
- **User Pool** = Your bouncer — checks the guest list
- **Identity Pool** = The VIP key card — unlocks AWS services
:::

---

## User Pool Deep Dive

### What It Provides
- Sign-up / Sign-in UI (Hosted UI)
- Email/phone verification
- MFA (TOTP, SMS)
- Password policies
- Lambda triggers (pre-signup, post-confirmation, pre-token generation...)
- Federation with social IdPs: Google, Facebook, Apple, Amazon
- Federation with corporate IdPs: SAML 2.0, OIDC

### JWT Token Types

| Token | Expiry | Use |
|---|---|---|
| **ID Token** | 1 hour | User identity claims (email, sub, custom attributes) |
| **Access Token** | 1 hour | Authorize API calls (used with API Gateway Cognito Authorizer) |
| **Refresh Token** | Up to 10 years | Get new ID/Access tokens without re-login |

### Lambda Triggers (Exam Favorite!)

| Trigger | When fired | Common Use |
|---|---|---|
| `Pre Sign-up` | Before user is confirmed | Block certain email domains |
| `Post Confirmation` | After user confirms email | Add user to DynamoDB |
| `Pre Authentication` | Before sign-in | Custom validation |
| `Post Authentication` | After sign-in | Audit logging |
| `Pre Token Generation` | Before issuing tokens | Add custom claims to JWT |
| `Custom Message` | Before sending verification email/SMS | Brand the message |
| `User Migration` | When user doesn't exist in User Pool | Migrate from legacy auth |

---

## Identity Pool Deep Dive

### Flow

```
User authenticates with User Pool (or Google/Facebook)
         │
         ▼
Gets JWT token
         │
         ▼
Calls Cognito Identity Pool with JWT
         │
         ▼
Identity Pool calls STS:AssumeRoleWithWebIdentity
         │
         ▼
Returns temporary AWS credentials (AccessKey + SecretKey + SessionToken)
         │
         ▼
User calls AWS APIs directly (S3, DynamoDB, etc.)
```

### IAM Roles in Identity Pools

- **Authenticated Role** — permissions for logged-in users
- **Unauthenticated Role** — permissions for guest/anonymous users
- **Role Mapping** — assign different roles based on user attributes (group membership, custom claims)

---

## API Gateway + Cognito Authorizer

```
Client → API Gateway → Cognito User Pool Authorizer → Validates JWT → Lambda
```

- API Gateway extracts the **Bearer token** from the `Authorization` header
- Verifies signature against User Pool's JWKS endpoint
- Returns 401 if invalid/expired

---

## Java SDK — Authenticating a User

```java
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

var client = CognitoIdentityProviderClient.create();

var authResult = client.initiateAuth(InitiateAuthRequest.builder()
    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
    .clientId("your-app-client-id")
    .authParameters(Map.of(
        "USERNAME", "user@example.com",
        "PASSWORD", "SecretPass123!"
    ))
    .build());

String idToken = authResult.authenticationResult().idToken();
String accessToken = authResult.authenticationResult().accessToken();
String refreshToken = authResult.authenticationResult().refreshToken();
```

---

## 🧪 Practice Questions

**Q1.** A mobile app stores photos in S3. Users authenticate with Google Sign-In. The app needs to upload directly to S3. Which Cognito component provides the temporary AWS credentials?

A) Cognito User Pool  
B) Cognito Identity Pool  
C) Cognito Sync  
D) Cognito Lambda Trigger  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — The **Identity Pool** federates the Google JWT and calls STS to return temporary AWS credentials. The User Pool handles authentication; the Identity Pool handles AWS authorization.
</details>

---

**Q2.** A developer wants to add custom attributes (e.g., `tenant_id`) to JWT tokens issued by Cognito. Which Lambda trigger should they use?

A) Post Confirmation  
B) Pre Authentication  
C) Pre Token Generation  
D) Custom Message  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Pre Token Generation** fires just before Cognito issues tokens, allowing you to add/override claims in the ID and Access tokens.
</details>

---

**Q3.** What is the default expiry of a Cognito User Pool Access Token?

A) 5 minutes  
B) 30 minutes  
C) **1 hour**  
D) 24 hours  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Access and ID tokens expire in **1 hour** by default. Refresh tokens can last up to 10 years (configurable).
</details>

---

**Q4.** A company wants to allow unauthenticated (guest) users to read public content from S3 via the mobile app. Which feature enables this?

A) User Pool Guest Mode  
B) Identity Pool Unauthenticated Identities  
C) S3 Public Access  
D) Lambda@Edge  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Enable **Unauthenticated Identities** in the Identity Pool. Assign a limited IAM role (e.g., S3 read-only on public prefix) to the unauthenticated role.
</details>

---

## 🔗 Resources

- [Cognito User Pools Docs](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools.html)
- [Cognito Identity Pools Docs](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html)
- [JWT.io — Decode JWTs](https://jwt.io)
- [Cognito Lambda Triggers Reference](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-aws-lambda-triggers.html)
