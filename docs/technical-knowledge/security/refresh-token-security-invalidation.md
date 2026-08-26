---
id: refresh-token-security-invalidation
title: "JWT Multi-Device Session Management, Invalidation & Security"
sidebar_label: "JWT Multi-Device & Session Invalidation"
sidebar_position: 2
description: "Master guide to multi-device JWT authentication, isolated single-device logout, global session eviction, password updates, account locking, and token theft containment."
tags:
  - security
  - authentication
  - jwt
  - refresh-token
  - multi-device
  - session-management
  - incident-response
  - redis
  - spring-boot
  - nodejs
---

import JwtMultiDeviceSessionDiagram from '@site/src/components/JwtMultiDeviceSessionDiagram';
import JwtCoreDilemmaDiagram from '@site/src/components/JwtCoreDilemmaDiagram';
import MultiDeviceRegistryPatternDiagram from '@site/src/components/MultiDeviceRegistryPatternDiagram';
import SingleDeviceLogoutFlowDiagram from '@site/src/components/SingleDeviceLogoutFlowDiagram';
import AccountLockedLifecycleDiagram from '@site/src/components/AccountLockedLifecycleDiagram';
import TokenTheftContainmentDiagram from '@site/src/components/TokenTheftContainmentDiagram';
import TokenInvalidationFlowDiagram from '@site/src/components/TokenInvalidationFlowDiagram';
import RefreshTokenRotationDiagram from '@site/src/components/RefreshTokenRotationDiagram';
import AccountHackedResponseDiagram from '@site/src/components/AccountHackedResponseDiagram';
import PasswordInvalidationDiagram from '@site/src/components/PasswordInvalidationDiagram';

# JWT Multi-Device Session Management, Invalidation & Security

In modern distributed web and mobile applications, users stay logged in concurrently across multiple devices (e.g. iPhone, MacBook, iPad, work desktop). While stateless **JWT Access Tokens** (5–15 minute TTL) provide zero-database-lookup performance, managing multi-device lifecycles introduces complex architectural challenges:

- **Isolated Single-Device Logout**: How do you log a user out of their mobile phone without terminating their active desktop or tablet sessions?
- **Global Multi-Device Logout ("Sign Out Everywhere")**: How do you terminate all active devices simultaneously without leaving a 15-minute access token window?
- **Password Updates**: How do you allow a user to update their password while selectively choosing to remain logged in on the current device?
- **Account Locked / Suspended**: How do admins or anti-fraud systems lock an account and achieve **0-millisecond revocation** across all microservices?
- **Token Theft & Account Compromise**: How do you detect when a hacker replays a stolen refresh token and automatically quarantine the account?

---

## Interactive Multi-Device Lifecycle Simulator

The simulator below demonstrates how session states, Redis caches, token versions, and database records react across multiple devices during **Single-Device Logout**, **Global Logout**, **Account Lock**, and **Token Theft Detection**:

<JwtMultiDeviceSessionDiagram />

---

## 1. The Core Dilemma: Stateless JWT vs Multi-Device Control

A purely stateless JWT is self-contained: any microservice holding the public key can verify its cryptographic signature and extract user claims (`sub`, `roles`, `exp`) with **zero database calls**.

<JwtCoreDilemmaDiagram />

### The Solution: Device-Scoped Hybrid Architecture
To achieve isolated device management without sacrificing API performance:
1. **Short-Lived Access Tokens (5–15m)**: Include `sub` (User ID), `device_id` (or `session_id`), and `ver` (Token Version).
2. **Stateful Refresh Tokens / KeyStores (7–30d)**: Stored per device in a **Session Registry** (Database + Redis cache).
3. **Selective Invalidation**: Single-device actions modify only that device's session record. Global actions bump the user's root `token_version` or set a Redis `revoked_before` watermark.

---

## 2. Multi-Device Architecture & Session Registry Patterns

<MultiDeviceRegistryPatternDiagram />

### Pattern A: Relational Session Registry (PostgreSQL / MySQL)

```sql
-- Refresh Token & Device Session Table
CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id       VARCHAR(64) NOT NULL,        -- Client hardware/browser fingerprint
    device_name     VARCHAR(100),                -- "iPhone 15 Pro", "MacBook Pro Chrome"
    session_id      VARCHAR(64) NOT NULL UNIQUE, -- Unique per login instance
    family_id       UUID NOT NULL,               -- Token Family for RTR theft detection
    token_hash      VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of refresh token
    parent_token_id UUID REFERENCES user_sessions(id),
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    is_used         BOOLEAN DEFAULT FALSE,
    is_revoked      BOOLEAN DEFAULT FALSE,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_lookup ON user_sessions(user_id, device_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_family ON user_sessions(family_id);
```

### Pattern B: Redis Hash Device Map (High-Throughput Caching)

In high-write environments, active sessions are stored in Redis Hashes for sub-millisecond lookups:

```bash
# Store active session for Device A
HSET user:usr_404:sessions sess_mob_101 '{"deviceId":"mob_1","familyId":"fam_A","tokenHash":"sha256...","issuedAt":1700000000}'
EXPIRE user:usr_404:sessions 2592000 # 30 days TTL

# Query all active devices for a user profile UI
HGETALL user:usr_404:sessions

# Invalidate single device (Mobile)
HDEL user:usr_404:sessions sess_mob_101

# Invalidate ALL devices (Logout Everywhere)
DEL user:usr_404:sessions
```

### Pattern C: The KeyStore / Key-Token Pattern (Anonystick Model)

In this pattern, each device login generates a dedicated **KeyStore** record containing:
- `publicKey` & `privateKey` (or asymmetric key pair) specific to that device's session.
- `refreshToken`: The current active refresh token hash.
- `refreshTokensUsed`: An array tracking all historical rotated tokens in the current token family.

```typescript
// KeyStore Structure per Device Login:
interface DeviceKeyStore {
  userId: string;
  deviceId: string;
  publicKey: string;
  refreshToken: string;
  refreshTokensUsed: string[];
  updatedAt: Date;
}
```

---

## 3. Deep-Dive: The 5 Invalidation Workflows

### 3.1 Scenario 1: Single-Device Logout (Isolated Device Invalidation)

When a user taps **"Logout"** on their mobile phone, only that device's session is terminated:

<SingleDeviceLogoutFlowDiagram />

#### Why Other Devices Are Unaffected:
1. The Laptop (`sess_lap_202`) and Tablet (`sess_tab_303`) records in `user_sessions` or Redis remain **untouched**.
2. The user's root `token_version` is **not modified**.
3. When the Laptop makes API calls, its Access Token is validated normally. When it calls `/auth/refresh`, its session record exists and rotates cleanly.

---

### 3.2 Scenario 2: Global Logout ("Sign Out of All Devices")

When a user clicks **"Log out of all devices"**:

```sql
-- 1. Invalidate all refresh tokens in DB
UPDATE user_sessions 
SET is_revoked = TRUE 
WHERE user_id = :userId;

-- 2. Increment user token version
UPDATE users 
SET token_version = token_version + 1 
WHERE id = :userId;
```

```bash
# 3. Wipe all sessions in Redis
DEL user:usr_404:sessions

# 4. Set revocation timestamp to immediately invalidate all in-flight access tokens
SET user:usr_404:revoked_before 1700000000 EX 900
```

#### The Access Token Revocation Check:
Every API Gateway or Security Filter checks:
$$\text{if } (\text{jwt.iat} < \text{redis.get("user:revoked\_before:" + userId)}) \implies \text{HTTP 401 Unauthorized}$$

---

### 3.3 Scenario 3: Password Update & Password Reset

Applications offer two distinct UX choices when a user updates their password:

<PasswordInvalidationDiagram />

#### SQL Implementation:
```sql
-- Option A: Retain current device (sess_current), revoke all others
UPDATE user_sessions
SET is_revoked = TRUE
WHERE user_id = :userId
  AND session_id != :currentSessionId;
```

---

### 3.4 Scenario 4: Account Locked / Suspended (Admin / Anti-Fraud)

When an account is flagged for fraud, billing default, or security violation, access must be revoked **immediately across all microservices**:

<AccountLockedLifecycleDiagram />

:::warning
The Redis lock check takes **< 1 millisecond** and intercepts requests at the API Gateway before any downstream microservice, database, or business logic executes.
:::

---

### 3.5 Scenario 5: Token Theft & Automatic Compromise Containment

Under **Refresh Token Rotation (RTR)**, refresh tokens can only be used **once**. If an attacker steals an already-rotated token ($RT_1$) and attempts to exchange it:

<TokenTheftContainmentDiagram />

---

## 4. Production Code Implementations

### 4.1 Node.js / Express KeyStore & Multi-Device Service

```typescript
// auth.service.ts
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { redisClient } from './redis';

export class MultiDeviceAuthService {
  // 1. Login on a specific device
  static async login(userId: string, deviceId: string, deviceName: string) {
    const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
    const familyId = crypto.randomUUID();
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    // Store session in PostgreSQL
    await db.query(
      `INSERT INTO user_sessions (user_id, device_id, device_name, session_id, family_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 days')`,
      [userId, deviceId, deviceName, sessionId, familyId, tokenHash]
    );

    // Cache active session in Redis Hash
    await redisClient.hSet(`user:${userId}:sessions`, sessionId, JSON.stringify({
      deviceId,
      familyId,
      tokenHash,
      createdAt: Date.now()
    }));

    // Mint short-lived access token scoped to device & session
    const accessToken = jwt.sign(
      { sub: userId, deviceId, sessionId, ver: 1 },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    return { accessToken, refreshToken: rawRefreshToken, sessionId };
  }

  // 2. Single-Device Logout (Isolated)
  static async logoutSingleDevice(userId: string, sessionId: string, accessTokenJti?: string) {
    // Revoke only this session in DB
    await db.query(
      `UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = $1 AND session_id = $2`,
      [userId, sessionId]
    );

    // Remove from Redis device registry
    await redisClient.hDel(`user:${userId}:sessions`, sessionId);

    // Optional: Blacklist access token JTI for remaining 15 minutes
    if (accessTokenJti) {
      await redisClient.setEx(`blacklist:jti:${accessTokenJti}`, 900, 'logged_out');
    }

    return { success: true, message: 'Logged out of this device successfully' };
  }

  // 3. Global Logout ("Sign out of all devices")
  static async logoutAllDevices(userId: string) {
    // Revoke all sessions in DB
    await db.query(`UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = $1`, [userId]);

    // Increment user token version
    await db.query(`UPDATE users SET token_version = token_version + 1 WHERE id = $1`, [userId]);

    // Wipe Redis session map
    await redisClient.del(`user:${userId}:sessions`);

    // Set revoked_before watermark to kill all in-flight access tokens
    const nowEpoch = Math.floor(Date.now() / 1000);
    await redisClient.setEx(`user:${userId}:revoked_before`, 900, String(nowEpoch));

    return { success: true, message: 'All devices logged out' };
  }
}
```

### 4.2 API Gateway Verification Middleware (Express / Fastify)

```typescript
// auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redisClient } from './redis';

export async function verifyJwtAndDeviceState(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      deviceId: string;
      sessionId: string;
      iat: number;
      jti?: string;
    };

    const userId = payload.sub;

    // Fast-Check 1: Is Account Locked / Suspended?
    const isLocked = await redisClient.get(`user:${userId}:is_locked`);
    if (isLocked) {
      return res.status(403).json({ error: 'Account is locked. Contact support.' });
    }

    // Fast-Check 2: Was a Global Logout / Password Reset triggered after token iat?
    const revokedBefore = await redisClient.get(`user:${userId}:revoked_before`);
    if (revokedBefore && payload.iat < parseInt(revokedBefore, 10)) {
      return res.status(401).json({ error: 'Session expired due to security reset. Re-login required.' });
    }

    // Fast-Check 3: Is this specific Access Token JTI blacklisted?
    if (payload.jti) {
      const isBlacklisted = await redisClient.get(`blacklist:jti:${payload.jti}`);
      if (isBlacklisted) {
        return res.status(401).json({ error: 'Token has been logged out.' });
      }
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

---

## 5. Architectural Decision & Comparison Matrix

| Mechanism | Scope | Latency | Redis Memory | Cross-Device Impact | Best For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`device_id` / `session_id` DB Deletion** | Single Device | 0 ms (at next refresh) | Zero | 🟢 None (Other devices stay active) | Routine app logout |
| **Redis `jti` Blacklist** | Single Token | < 1 ms | Small (~50B per active logout) | 🟢 None | High-security instant single-token revocation |
| **Redis `revoked_before` Timestamp** | Global User | < 1 ms | Minimal (1 key per user, 15m TTL) | 🔴 All devices logged out | Password reset, "Logout all" |
| **Redis `user:locked` Flag** | Global User | < 1 ms | Minimal (1 key per user) | 🔴 All requests blocked (403) | Anti-fraud freeze, Admin ban |
| **RTR Token Family Invalidation** | Token Family | < 1 ms | Zero | 🔴 Specific device + stolen token revoked | Refresh token theft containment |

---

## 6. Senior Engineering Interview Questions & Answers

### Q1: If JWTs are stateless, how can you implement single-device logout without affecting the user's other logged-in devices?
**Answer:**
You adopt a **device-scoped hybrid model**:
1. Assign a unique `device_id` and `session_id` during login and embed them into the Access Token claims.
2. Maintain individual session records (or KeyStores) in the database/Redis keyed by `(user_id, session_id)`.
3. When the user logs out on Device A, delete **only** Device A's session record from Redis/DB and optionally blacklist Device A's `jti`.
4. Do not modify the user's root `token_version`. Device B and Device C's sessions remain valid and continue refreshing independently.

---

### Q2: An admin locks a malicious user's account. How do you prevent their active 15-minute JWT access tokens from accessing microservices for the next 15 minutes?
**Answer:**
Relying on database updates alone leaves a 15-minute vulnerability gap because stateless microservices do not query the DB on every request.
To solve this with zero latency:
1. When locking the account, write a fast Redis key: `SET user:locked:<userId> 1 EX 86400`.
2. The API Gateway / Security Filter inspects `EXISTS user:locked:<userId>` in Redis on every incoming request.
3. If the key exists, the Gateway returns `403 Forbidden` in < 1ms, terminating access across all microservices immediately.

---

### Q3: What happens when a user changes their password and selects "Stay logged in on this device"?
**Answer:**
1. Update the password hash in the database.
2. Execute a scoped session cleanup: `DELETE FROM user_sessions WHERE user_id = :uid AND session_id != :currentSessionId;`.
3. Rotate and issue a fresh access + refresh token pair for `:currentSessionId`.
4. Other devices (bearing older session IDs) will fail on their next refresh attempt and be forced to re-authenticate with the new password.

---

## Related References & Guides

- [Cookies vs Sessions vs JWT](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/security/cookies-vs-sessions-vs-jwt.md) — Fundamental tradeoffs between cookie session state and stateless JWTs.
- [Authentication & Authorization](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/security/01-authentication-authorization.md) — OAuth 2.0, OpenID Connect, and Spring Security.
- [PostgreSQL Heap Storage & Internals](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/database/postgresql-heap-storage-architecture.md) — How PostgreSQL stores and indexes session and token tables.
