---
id: refresh-token-security-invalidation
title: "Refresh Token Security & Multi-Device Session Invalidation"
sidebar_label: "Refresh Token & Session Invalidation"
sidebar_position: 2
description: "Comprehensive guide to securing long-lived refresh tokens, handling account compromise incident response, closing access token revocation gaps, and managing single vs multi-device password reset session invalidation."
tags:
  - security
  - authentication
  - jwt
  - refresh-token
  - session-management
  - incident-response
  - redis
  - spring-boot
---

import TokenInvalidationFlowDiagram from '@site/src/components/TokenInvalidationFlowDiagram';
import RefreshTokenRotationDiagram from '@site/src/components/RefreshTokenRotationDiagram';
import AccountHackedResponseDiagram from '@site/src/components/AccountHackedResponseDiagram';
import PasswordInvalidationDiagram from '@site/src/components/PasswordInvalidationDiagram';

# Refresh Token Security & Multi-Device Session Invalidation

In modern distributed architectures, authentication relies on a two-token system: **short-lived Access Tokens** (stateless, 5–15 minute TTL) and **long-lived Refresh Tokens** (stateful/rotatable, 7–30 day TTL). 

While short-lived access tokens limit exposure if intercepted, long-lived refresh tokens present a major security surface: **if a refresh token is stolen, an attacker can maintain unauthorized access to a victim's account for weeks or months.**

This guide covers:
- **Securing long-lived refresh tokens** via Rotation (RTR), Reuse Detection, Token Families, and Token Binding (DPoP/mTLS).
- **Account compromise incident response** when a user account is hacked.
- **Closing the ~15-minute Access Token Revocation Gap** without introducing database bottlenecks.
- **Single-device vs. Multi-device session invalidation** during password updates.
- **Production schemas, Spring Boot filters, and Redis revocation patterns.**

---

## Interactive Architecture & Invalidation Flows

The diagram below illustrates how Refresh Token Rotation, Selective Single-Device Invalidation, and Emergency Global Account Invalidation operate across clients, API gateways, databases, and distributed Redis caches.

<TokenInvalidationFlowDiagram />

---

## Part 1: How Refresh Tokens Work & Securing Long-Lived Tokens

### Access Token vs Refresh Token Lifecycles

| Dimension | Access Token (JWT) | Refresh Token |
| --- | --- | --- |
| **Purpose** | Authorizes specific API requests | Issues new Access & Refresh tokens |
| **Lifespan** | Short (5–15 minutes) | Long (7 to 30 days) |
| **Verification** | Stateless (cryptographic signature check) | Stateful / Verified against DB or Redis |
| **Storage Location** | In-memory / JS runtime state | `HttpOnly`, `Secure` Cookie or Mobile OS Keychain |
| **Exposure Impact** | Low (expires quickly) | Critical (enables long-term account takeover) |

---

### Threat Vectors of Long-Lived Refresh Tokens

1. **XSS Exfiltration**: Storing tokens in `localStorage` or `sessionStorage` leaves them vulnerable to malicious JavaScript scripts.
2. **Stolen Devices**: Unlocked phones or laptops retain long-lived tokens in disk cache.
3. **Database Leaks**: Plaintext refresh tokens stored in database tables expose all active user sessions if the DB is dumped.
4. **Token Replay / Man-in-the-Middle**: Stolen tokens used from unauthorized IP addresses or networks.

---

### Core Security Controls for Long-Lived Tokens

#### 1. Refresh Token Rotation (RTR) & Token Families (OAuth 2.0 BCP / RFC 6749)

Under **Refresh Token Rotation (RTR)**, every time a client requests a new access token, the auth server **invalidates the submitted refresh token** and returns a **brand-new token pair**.

To detect theft, tokens are grouped into a **Token Family** (`family_id`):

```
Initial Login:
  [Refresh Token v1 (Family: fam_100, Parent: NULL, Used: FALSE)]

First Refresh (Legitimate Client):
  [Refresh Token v1] → Marked USED
  [Refresh Token v2 (Family: fam_100, Parent: v1, Used: FALSE)] Issued to Client

Replay Attack (Attacker uses stolen v1):
  Auth server sees Refresh Token v1 is ALREADY MARKED USED!
  🚨 REUSE DETECTED! Auth server immediately revokes ALL tokens in Family fam_100!
```

```sql
-- Schema for Refresh Token Family Tracking
CREATE TABLE refresh_tokens (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash    VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of token
    family_id     UUID NOT NULL,
    parent_id     UUID REFERENCES refresh_tokens(id),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id    VARCHAR(64) NOT NULL,        -- Device / Browser Session ID
    is_used       BOOLEAN DEFAULT FALSE,
    is_revoked    BOOLEAN DEFAULT FALSE,
    expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

#### 2. Secure Storage Guidelines

- **Web Applications**: Always store Refresh Tokens in **`HttpOnly`**, **`Secure`**, **`SameSite=Strict`** (or `SameSite=Lax`) HTTP cookies with path limited to `/api/v1/auth/refresh`. Never expose refresh tokens to client-side JavaScript.
- **Mobile Applications (iOS/Android)**: Store in OS-provided secure hardware keystores (**Keychain** on iOS, **EncryptedSharedPreferences / Android KeyStore** on Android).
- **Database Hashing**: Never store raw refresh token strings in DB/Redis. Store only the `SHA-256` digest (`token_hash`), protecting session stores against SQL injection or DB dump leaks.

#### 3. Sender-Constrained Tokens & Token Binding

To prevent stolen tokens from being replayed on different machines, bind the token to the client's identity:

- **DPoP (Demonstrating Proof-of-Possession - RFC 9449)**: The client generates an asymmetric key pair and signs a DPoP proof header (`DPoP: <jwt_proof>`) on every token request. The auth server binds the access/refresh token to the client's public key (`cnf` claim). Even if an attacker steals the token, they cannot sign requests without the client's private key.
- **mTLS (Mutual TLS Token Binding)**: Binds tokens to the client's TLS certificate.
- **IP & User-Agent Fingerprinting**: Binding refresh tokens to subnet (`192.168.1.0/24`) and User-Agent. If the refresh request originates from a drastically different GEO-location or OS, trigger step-up MFA re-authentication.

---

## Part 2: Incident Response — What to Do When a User Account is Hacked

When an account compromise is flagged (via user report *"I've been hacked"*, automated anomaly detection, credential stuffing alert, or stolen phone notification), the security system must execute **Emergency Account Containment**.

<AccountHackedResponseDiagram />

### The Access Token Revocation Gap Problem

Stateless JWT access tokens are validated cryptographically by microservices without hitting the database. If an access token has 10 minutes remaining on its `exp` claim, **deleting the user's refresh token from the database DOES NOT invalidate the existing access token!** For the next 10 minutes, the hacker can still access protected APIs.

---

### 3 Methods to Invalidate Stateless Access Tokens Immediately

#### Method 1: `token_version` Column (Database + JWT Claim)

Add a `token_version` integer column to the `users` table and include `"ver"` in the JWT payload.

```json
// Access Token Payload
{
  "sub": "usr_9988",
  "ver": 3,
  "iat": 1700000000,
  "exp": 1700000900
}
```

- **Normal Flow**: API Gateway checks JWT signature and verifies `jwt.ver == cached_user_version`.
- **On Account Compromise**: 
  ```sql
  UPDATE users SET token_version = token_version + 1 WHERE id = :user_id;
  ```
  Updating `token_version` invalidates **all** active access tokens bearing version `3`. Version `4` is required for future requests.

#### Method 2: `pwd_updated_at` / `revoked_before` Timestamp Validation

Embed `iat` (Issued At timestamp) in every JWT. When an account is compromised or password is reset, set `pwd_updated_at = NOW()`.

```java
// Spring Security Filter / API Gateway Check
long jwtIssuedAt = claims.getIssuedAt().getTime() / 1000;
long revokedBefore = redisService.getRevokedBeforeTimestamp(userId); // cached in Redis

if (jwtIssuedAt < revokedBefore) {
    throw new JwtAuthenticationException("Token has been revoked due to security event");
}
```

- **Redis Key Structure**: `user:revoked_before:<user_id> = <timestamp>`
- **TTL**: Set key TTL equal to max access token lifespan (e.g. 15 minutes). After 15 minutes, all old access tokens have naturally expired, so Redis auto-evicts the key, freeing memory.

#### Method 3: Centralized Redis JWT Blacklist (`jti` Revocation)

Every JWT access token includes a unique identifier `jti` (`JWT ID`). When revoking specific tokens:

```bash
# Push jti to Redis Blacklist with TTL equal to remaining token lifetime
SETEX blacklist:jti:8a3f91b2 600 "revoked_hacked_account"
```

Gateway or Security Filter checks `EXISTS blacklist:jti:<jti>`.

---

## Part 3: Password Update Invalidation — Single Device vs Multi-Device

When a user changes their password, application UX typically offers two options:
1. **Single Device ("Update password and stay logged in on this device")**
2. **Multi-Device ("Update password and log out of all devices / emergency reset")**

<PasswordInvalidationDiagram />

---

## Part 4: Production Implementation (Spring Boot & Redis)

### 1. Spring Security JWT Authentication Filter with Redis Revocation Check

```java
package com.example.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, StringRedisTemplate redisTemplate) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String token = extractBearerToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            Claims claims = jwtTokenProvider.getClaims(token);
            String userId = claims.getSubject();
            long issuedAtEpoch = claims.getIssuedAt().getTime() / 1000;

            // 1. Check Redis for Instant Revocation (Password Reset / Account Hacked)
            String revokedBeforeStr = redisTemplate.opsForValue().get("user:revoked_before:" + userId);
            if (revokedBeforeStr != null) {
                long revokedBeforeEpoch = Long.parseLong(revokedBeforeStr);
                if (issuedAtEpoch < revokedBeforeEpoch) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token revoked due to password update or security reset.");
                    return;
                }
            }

            // 2. Check token_version claim against user context if needed
            Integer tokenVersion = claims.get("ver", Integer.class);
            // ... Optional DB/Redis version match check ...

            UsernamePasswordAuthenticationToken auth = 
                new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
```

---

### 2. Service Layer: Refresh Token Rotation & Theft Detection

```java
package com.example.service;

import com.example.exception.TokenReuseException;
import com.example.model.RefreshToken;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repo;
    private final JwtTokenProvider jwtProvider;

    public RefreshTokenService(RefreshTokenRepository repo, JwtTokenProvider jwtProvider) {
        this.repo = repo;
        this.jwtProvider = jwtProvider;
    }

    @Transactional
    public TokenPairResponse rotateToken(String incomingRawRefreshToken, String sessionId) {
        String hash = DigestUtils.sha256Hex(incomingRawRefreshToken);

        RefreshToken token = repo.findByTokenHash(hash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid Refresh Token"));

        // 🚨 REUSE DETECTION TRIGGERED!
        if (token.isUsed() || token.isRevoked()) {
            // Revoke ENTIRE family to protect user against theft
            repo.revokeTokenFamily(token.getFamilyId());
            throw new TokenReuseException("Security Alert: Refresh token reuse detected! All family sessions revoked.");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Refresh token expired");
        }

        // Mark current token as USED
        token.setUsed(true);
        repo.save(token);

        // Generate brand new Rotated Refresh Token under SAME family_id
        String newRawRefresh = UUID.randomUUID().toString();
        String newHash = DigestUtils.sha256Hex(newRawRefresh);

        RefreshToken newToken = RefreshToken.builder()
                .tokenHash(newHash)
                .familyId(token.getFamilyId())
                .parentId(token.getId())
                .userId(token.getUserId())
                .sessionId(sessionId)
                .isUsed(false)
                .isRevoked(false)
                .expiresAt(Instant.now().plusSeconds(30 * 24 * 3600)) // 30 days
                .build();

        repo.save(newToken);

        String newAccessToken = jwtProvider.createAccessToken(token.getUserId());
        return new TokenPairResponse(newAccessToken, newRawRefresh);
    }
}
```

---

## Part 5: Decision Matrix & Architectural Trade-offs

| Strategy | Speed / Latency | Revocation Delay | Infrastructure Overhead | Best For |
| --- | --- | --- | --- | --- |
| **Short TTL Access Token Only** | High (0 ms) | 5–15 minutes (TTL window) | Zero extra storage | Standard web apps with low security sensitivity |
| **`token_version` in DB / Redis** | High (Cached in Redis) | Instant (0 ms) | Small Redis key per user | SaaS platforms, Banking, E-commerce |
| **Redis Blacklist (`jti`)** | High (0–1 ms) | Instant (0 ms) | Redis memory for revoked tokens | High-security APIs requiring targeted token revocation |
| **DPoP (Proof of Possession)** | High (0 ms DB lookup) | Cryptographically bound to client key | Key management complexity on client | Mobile banking apps, Open Banking OAuth |

---

## Part 6: Senior Engineering Interview Q&A

### Q1: How do you handle JWT revocation in a fully stateless microservice architecture when an account is reported hacked?

**Answer:**
In a purely stateless JWT architecture, access tokens cannot be revoked server-side without adding a verification lookup. To achieve instant revocation without creating a relational database bottleneck:
1. Revoke all stateful refresh tokens in DB/Redis so no new access tokens can be minted.
2. Publish an **Account Security Event** via Redis Pub/Sub or Kafka containing `(user_id, revocation_timestamp)`.
3. API Gateways and Edge Routers store `revoked_before` timestamps in local Redis caches.
4. On every API request, the Gateway verifies if `jwt.iat < revoked_before`. If true, the request is rejected with `401 Unauthorized` in under 1ms without hitting downstream microservices or databases.

---

### Q2: What is Refresh Token Rotation (RTR) and how does it detect token theft?

**Answer:**
Refresh Token Rotation invalidates the refresh token on every single refresh request and returns a new rotated token pair. 

The auth server tracks token lineage using a `family_id`. If an attacker steals `RefreshToken_v1` and the legitimate client has already used `v1` to rotate to `v2`, `v1` is marked `used = true` in the DB. When the attacker attempts to exchange `v1`, the server detects that a used token was replayed. The server triggers **Automatic Family Revocation**, marking all tokens linked to `family_id` as revoked. This terminates both the attacker's and victim's sessions, forcing a full re-login and neutralizing the breach.

---

### Q3: During a password reset, how do you allow a user to stay logged in on their current device while invalidating all other sessions?

**Answer:**
Pass the current session ID (`current_session_id`) alongside the password update request.
1. Update the password hash in the `users` table.
2. Perform a targeted deletion on the refresh tokens table:
   `DELETE FROM refresh_tokens WHERE user_id = :uid AND session_id != :current_session_id;`
3. Issue a fresh rotated access + refresh token pair for `:current_session_id` reflecting the updated credentials.
4. Other devices (bearing different `session_id` values) will fail when attempting their next refresh call.

---

## Related References & Guides

- [Cookies vs Sessions vs JWT](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/security/cookies-vs-sessions-vs-jwt.md) — Deep dive into client vs server state, cookie security flags, and JWT structure.
- [Authentication & Authorization](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/security/01-authentication-authorization.md) — OAuth 2.0, PKCE, OpenID Connect, and Spring Security setup.
- [API Authentication & Security](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/networking/api-authentication-security.md) — HMAC, API keys, rate limiting, and gateway authentication patterns.
