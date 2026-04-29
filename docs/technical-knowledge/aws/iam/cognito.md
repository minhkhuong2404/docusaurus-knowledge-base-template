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

> **Core concept**: Cognito handles **AuthN** (who are you?) via User Pools and **AuthZ** (what AWS resources can you access?) via Identity Pools.

---

## 🔰 What Is Cognito?

Cognito provides **authentication, authorization, and user management** for web/mobile apps without building your own identity system.

**Analogy**:
- **User Pool** = hotel front desk that checks your ID and gives you a room key (JWT token)
- **Identity Pool** = the hotel concierge who gives you a VIP pass (AWS credentials) to access the gym, pool, and spa (S3, DynamoDB, etc.)

---

## User Pools vs Identity Pools

| Feature | **User Pool** | **Identity Pool** (Federated Identities) |
|---|---|---|
| **Purpose** | Authenticate users (sign up/sign in) | Grant temporary AWS credentials |
| **Returns** | JWT tokens (ID, Access, Refresh) | AWS credentials (via STS) |
| **Use case** | Log into your **app** | Call AWS services (S3, DynamoDB) directly from client |
| **Think of it as** | OAuth 2.0 / OIDC server | AWS IAM role vending machine |
| **Can work alone** | ✅ Yes | ✅ Yes (with external IdP) |
| **Can work together** | ✅ User Pool → Identity Pool | ✅ Identity Pool validates User Pool JWT |

### Combined Flow (Most Common)

```
1. User → Cognito User Pool → Sign In → JWT Tokens (ID, Access, Refresh)
2. App → Cognito Identity Pool → Exchange JWT for AWS Credentials
3. App → Call S3/DynamoDB directly with temporary AWS credentials
```

---

## User Pool Deep Dive

### Features

| Feature | Description |
|---|---|
| **Sign-up/Sign-in** | Email, phone, username, or social login |
| **Hosted UI** | Pre-built login page (customizable) |
| **MFA** | TOTP (authenticator app) or SMS |
| **Password policies** | Min length, special chars, etc. |
| **Email/phone verification** | Automatic confirmation workflow |
| **Lambda triggers** | Customize auth flow at every step |
| **Social federation** | Google, Facebook, Apple, Amazon |
| **Corporate federation** | SAML 2.0, OIDC |
| **User groups** | Group-based access control |
| **Custom attributes** | Add custom user fields |

### JWT Token Types

| Token | Expiry | Content | Use |
|---|---|---|---|
| **ID Token** | 5 min – 1 day (default 1h) | User identity claims (email, sub, custom attributes) | Identify the user |
| **Access Token** | 5 min – 1 day (default 1h) | Scopes, groups, client_id | Authorize API calls |
| **Refresh Token** | 60 min – 10 years (default 30 days) | Opaque token | Get new ID/Access tokens |

### Lambda Triggers (Exam Favorite!)

| Trigger | When Fired | Common Use |
|---|---|---|
| `Pre Sign-up` | Before user is created | Block disposable email domains |
| `Post Confirmation` | After email/phone verification | Add user to DynamoDB, send welcome email |
| `Pre Authentication` | Before sign-in | Custom validation, rate limiting |
| `Post Authentication` | After successful sign-in | Audit logging, update last-login |
| `Pre Token Generation` | Before issuing JWT | Add/modify custom claims |
| `Custom Message` | Before sending verification email/SMS | Brand the message |
| `User Migration` | When user doesn't exist in pool | Migrate from legacy auth system |
| `Define Auth Challenge` | Custom auth flow | Implement CAPTCHA, magic links |
| `Create Auth Challenge` | Generate challenge | Send OTP, CAPTCHA |
| `Verify Auth Challenge` | Verify challenge response | Check OTP, CAPTCHA |

### Custom Auth Flows

```
Standard: USERNAME_PASSWORD_AUTH → Cognito validates → tokens
Custom:   CUSTOM_AUTH → Define Auth Challenge → Create Challenge
          → User responds → Verify Challenge → tokens

Use cases: Magic link login, CAPTCHA, biometrics, passwordless
```

---

## Identity Pool Deep Dive

### Flow

```
User authenticates (User Pool / Google / Facebook / SAML)
    ↓ JWT Token
Cognito Identity Pool
    ↓ GetId → GetCredentialsForIdentity (or AssumeRoleWithWebIdentity)
Temporary AWS Credentials (AccessKey + SecretKey + SessionToken)
    ↓
Client calls AWS APIs directly (S3, DynamoDB, etc.)
```

### IAM Roles in Identity Pools

| Role | Purpose |
|---|---|
| **Authenticated** | Permissions for logged-in users |
| **Unauthenticated** | Permissions for guest/anonymous users |

### Role Mapping

Assign different IAM roles based on user attributes:

```json
// User in "admins" group → AdminRole
// User in "users" group → UserRole
// Default → BasicRole

{
  "Type": "Token",
  "AmbiguousRoleResolution": "AuthenticatedRole",
  "RulesConfiguration": {
    "Rules": [{
      "Claim": "cognito:groups",
      "MatchType": "Contains",
      "Value": "admins",
      "RoleARN": "arn:aws:iam::123:role/AdminRole"
    }]
  }
}
```

### Fine-Grained Access with Policy Variables

```json
// Each user can only access THEIR OWN S3 prefix
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::user-data/${cognito-identity.amazonaws.com:sub}/*"
}
```

`${cognito-identity.amazonaws.com:sub}` = unique Cognito identity ID for each user.

---

## API Gateway + Cognito

### Cognito User Pool Authorizer (REST API)

```
Client → Authorization: Bearer <Access Token>
    → API Gateway → Cognito Authorizer → Validates JWT
    → ✅ Valid → Forward to Lambda
    → ❌ Invalid → 401 Unauthorized
```

- Built-in, no Lambda needed
- Validates JWT signature against User Pool's JWKS
- Can check scopes: `aws.cognito.signin.user.admin`

### JWT Authorizer (HTTP API)

```yaml
# HTTP API with Cognito JWT authorizer
Authorizer:
  Type: JWT
  IdentitySource: "$request.header.Authorization"
  JwtConfiguration:
    Issuer: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123"
    Audience: ["your-app-client-id"]
```

---

## Java SDK Examples

### Authenticate User

```java
CognitoIdentityProviderClient client = CognitoIdentityProviderClient.create();

InitiateAuthResponse authResult = client.initiateAuth(InitiateAuthRequest.builder()
    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
    .clientId("your-app-client-id")
    .authParameters(Map.of(
        "USERNAME", "user@example.com",
        "PASSWORD", "SecretPass123!"))
    .build());

String idToken = authResult.authenticationResult().idToken();
String accessToken = authResult.authenticationResult().accessToken();
String refreshToken = authResult.authenticationResult().refreshToken();
```

### Refresh Tokens

```java
InitiateAuthResponse refreshResult = client.initiateAuth(InitiateAuthRequest.builder()
    .authFlow(AuthFlowType.REFRESH_TOKEN_AUTH)
    .clientId("your-app-client-id")
    .authParameters(Map.of("REFRESH_TOKEN", refreshToken))
    .build());

String newAccessToken = refreshResult.authenticationResult().accessToken();
```

### Sign Up User

```java
client.signUp(SignUpRequest.builder()
    .clientId("your-app-client-id")
    .username("newuser@example.com")
    .password("StrongPass123!")
    .userAttributes(
        AttributeType.builder().name("email").value("newuser@example.com").build(),
        AttributeType.builder().name("custom:tenant_id").value("TENANT-001").build())
    .build());
```

---

## Hosted UI

Cognito provides a pre-built, customizable login page:

```
https://<your-domain>.auth.<region>.amazoncognito.com/login?
  response_type=code&
  client_id=<app-client-id>&
  redirect_uri=https://myapp.com/callback
```

**Customization**: Logo, CSS, custom domain (requires ACM certificate in us-east-1)

---

## 🏆 Best Practices

1. **Use Identity Pool** for direct AWS service access from mobile/browser
2. **Use User Pool Authorizer** with API Gateway — simplest auth setup
3. **Pre Token Generation trigger** — add custom claims for authorization logic
4. **Short token TTL** (15-60 min) for sensitive apps
5. **Use groups** for role-based access control
6. **Enable MFA** for sensitive operations
7. **User Migration trigger** for seamless migration from legacy auth

---

## 🎯 DVA-C02 Exam Tips

:::tip[Cognito Exam Cheat Sheet]
1. **User Pool** = authentication (JWT tokens). **Identity Pool** = AWS credentials
2. **Pre Token Generation** trigger = add custom claims to JWT
3. **User Migration** trigger = migrate from legacy auth on first login
4. **Identity Pool** can work with User Pool, Google, Facebook, SAML, OIDC
5. **Unauthenticated identities** = guest access with limited IAM role
6. **Fine-grained access** = use `${cognito-identity.amazonaws.com:sub}` in policies
7. **Access Token** for API authorization. **ID Token** for user identity
8. **Refresh Token** can last up to 10 years
9. **Hosted UI** provides login page without building your own
10. **Custom Auth Flow** = CUSTOM_AUTH for passwordless, CAPTCHA, magic links
:::

---

## 🧪 Practice Questions

**Q1.** Mobile app uploads photos to S3. Users authenticate with Google. Which provides temporary AWS credentials?

A) User Pool  
B) **Identity Pool**  
C) Cognito Sync  
D) Lambda Trigger  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Identity Pool federates the Google JWT and returns temporary AWS credentials via STS.
</details>

---

**Q2.** Add custom `tenant_id` to JWT tokens. Which trigger?

A) Post Confirmation  
B) Pre Authentication  
C) **Pre Token Generation**  
D) Custom Message  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Pre Token Generation fires before token issuance, allowing custom claim injection.
</details>

---

**Q3.** Each user should only access their own S3 prefix. How?

A) Separate bucket per user  
B) **IAM policy with `${cognito-identity.amazonaws.com:sub}` variable**  
C) Lambda@Edge to filter requests  
D) S3 access points per user  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Use the Cognito identity ID as a policy variable to scope S3 access to user-specific prefixes.
</details>

---

**Q4.** Guest users need read-only access to public content. Which feature?

A) User Pool Guest Mode  
B) **Identity Pool Unauthenticated Identities**  
C) S3 Public Access  
D) CloudFront signed URLs  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Enable Unauthenticated Identities in Identity Pool with a limited IAM role.
</details>

---

**Q5.** Company migrating from legacy auth to Cognito. Users should log in without re-registering. Which trigger?

A) Pre Sign-up  
B) Post Confirmation  
C) **User Migration**  
D) Define Auth Challenge  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — User Migration trigger fires when a user doesn't exist in the User Pool. It validates credentials against the legacy system and creates the user transparently.
</details>

---

## 🔗 Resources

- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools.html)
- [Cognito Identity Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html)
- [Lambda Triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-aws-lambda-triggers.html)
- [JWT.io — Decode JWTs](https://jwt.io)
