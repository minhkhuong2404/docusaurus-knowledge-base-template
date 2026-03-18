---
id: interview-questions
title: Security Interview Questions — Master Reference
sidebar_label: 🎯 Interview Questions
description: Comprehensive security interview question bank for Java/Spring engineers — covering authentication, JWT, JWKS, MLE, payload signing, TLS, web vulnerabilities, cryptography, network security, cloud security, and secure design.
tags: [security, interview-prep, jwt, jwks, mle, tls, oauth2, owasp, cryptography, spring-security, java]
---

# Security Interview Questions — Master Reference

> Grouped by topic. Each question includes the key points interviewers expect. Aim to answer in 2–3 minutes per question.

---

## Authentication & Authorization

### Q1: What is the difference between authentication and authorization?

- **AuthN** = verifying identity ("Who are you?") — answered by login, JWT, session
- **AuthZ** = verifying permissions ("What can you do?") — answered by RBAC, ABAC checks
- HTTP codes: **401** = unauthenticated (no/invalid credentials), **403** = authenticated but no permission
- Example: valid JWT (authenticated) + `/api/admin` returns 403 (not authorized)

---

### Q2: Explain how JWT works. What are its security concerns?

- Three parts: `Base64Url(header).Base64Url(payload).Base64Url(signature)`
- Server validates signature only — **no DB lookup** needed (stateless)
- Payload is Base64Url encoded, NOT encrypted — never store passwords or sensitive PII in payload
- **Concerns:**
  - Cannot be revoked before expiry → use jti blocklist or short TTL
  - Algorithm confusion: if server accepts `alg: none`, attacker can forge tokens
  - HS256 with weak shared secret is brute-forceable
  - Use RS256/ES256 (asymmetric) in multi-service environments

---

### Q3: Explain the `kid` (Key ID) claim and why it matters

- `kid` in the JWT header tells the verifier **which public key** to use for signature verification
- Without `kid`: if multiple keys exist (e.g., during rotation), verifier doesn't know which key to try
- With `kid`: verifier looks up `kid` in the JWKS endpoint and uses the matching public key
- **Key rotation flow:** publish new key in JWKS → new tokens use new `kid` → old tokens (old `kid`) still verifiable until expiry → remove old key from JWKS

---

### Q4: How does OAuth 2.0 differ from OIDC?

- **OAuth 2.0** = authorization framework (delegated resource access). Does NOT define identity.
- **OIDC** = identity layer on top of OAuth 2.0. Adds `id_token` (JWT with user claims: email, name, sub)
- Rule: use `access_token` to call APIs; use `id_token` to establish user identity in your app

---

### Q5: How does the refresh token rotation pattern work and what attack does it detect?

- **Access token:** short TTL (5–15 min). **Refresh token:** long TTL (7–30 days), stored server-side.
- On each refresh: issue **new** refresh token, **invalidate** old one
- **Detection:** if the old (already rotated) refresh token is used again → **theft indicator** → lock account
- Without rotation: stolen refresh token gives permanent access until expiry

---

### Q6: What is PKCE and what attack does it prevent?

- Proof Key for Code Exchange — used in Authorization Code flow
- Client generates `code_verifier` (random), sends `code_challenge = SHA256(code_verifier)` to auth server
- On token exchange, client sends `code_verifier` — auth server hashes and compares
- **Prevents:** authorization code interception — stolen code is useless without `code_verifier`
- Required for all public clients (SPAs, mobile apps)

---

### Q7: What is the difference between RBAC, ABAC, and ReBAC?

- **RBAC:** access based on assigned roles (Admin, User). Simple, widely supported. Coarse-grained.
- **ABAC:** access based on attributes of user, resource, environment (department match, clearance level, time of day). Fine-grained, complex to manage.
- **ReBAC:** access based on entity relationships (Google Zanzibar). "Alice can view Document D because she's a member of Team Y which owns Folder Z."
- Trade-off: RBAC is simple but inflexible; ABAC is powerful but policy management is complex.

---

## Keys, Signing, JWKS & MLE

### Q8: Explain the difference between encrypting and signing a payload

| | Encryption | Signing |
|---|---|---|
| Goal | Confidentiality (hide content) | Authenticity + integrity (prove sender, detect tampering) |
| Key used to send | **Recipient's public key** | **Sender's private key** |
| Key used to receive | **Recipient's private key** | **Sender's public key** |
| Reversible? | Yes (decrypt to get plaintext) | No (hash is one-way) |

- **Sign:** hash the payload → encrypt hash with private key → send payload + signature
- **Verify:** hash received payload → decrypt signature with public key → compare hashes

---

### Q9: What is JWKS and how does a resource server use it to verify a JWT?

- JWKS = JSON Web Key Set — a public endpoint (`/.well-known/jwks.json`) where an auth server publishes its **public keys**
- Resource server fetches JWKS (cached), reads JWT `kid` header, finds matching public key, verifies signature
- **Security benefit:** auth server keeps private key secret; only public keys are distributed — no shared secret needed
- In Spring Boot: `JwtDecoders.fromIssuerLocation()` handles JWKS fetch + caching automatically

---

### Q10: How do you do zero-downtime JWT key rotation with JWKS?

1. **Generate** new key pair, assign new `kid` (e.g., `key-2024-02`)
2. **Publish** both old and new keys in JWKS (resource servers can now verify both)
3. **Switch signing** — new tokens issued with new `kid`
4. **Wait** for old tokens to expire naturally (≥ max access token TTL, e.g., 15 min)
5. **Remove** old key from JWKS
- Zero coordination needed between services — JWKS handles discovery automatically

---

### Q11: What is Message-Level Encryption (MLE) and why is it needed if you already have TLS?

- **TLS** protects in-transit only up to the TLS termination point (often a proxy or API gateway)
- Inside the data center, if TLS terminates at the gateway, traffic travels in **plaintext**
- **MLE** encrypts the payload itself — end-to-end, regardless of transport
- Used in: payment APIs (card data), open banking (regulatory), healthcare (PHI), any data that must be protected even from internal infrastructure
- Standard: **JWE** (JSON Web Encryption) — typically RSA-OAEP for key wrapping + AES-GCM for content

---

### Q12: Walk through a JWE (Message-Level Encryption) operation

```
Encryption (client):
  1. Generate random AES-256 key (CEK — Content Encryption Key)
  2. Encrypt payload with CEK using AES-GCM → ciphertext + auth_tag
  3. Encrypt CEK with server's RSA public key (RSA-OAEP) → encrypted_key
  4. Package: Base64(header).Base64(encrypted_key).Base64(iv).Base64(ciphertext).Base64(tag)

Decryption (server):
  1. Decrypt encrypted_key with server's RSA private key → CEK
  2. Decrypt ciphertext with CEK → plaintext
  3. Verify auth_tag (AEADBadTagException if tampered)
```

- Why hybrid (RSA + AES)? RSA is slow for large payloads. AES is fast. Use RSA only to protect the AES key.

---

### Q13: What is Perfect Forward Secrecy? Why does it matter for TLS?

- **Without PFS:** session key derived from server's long-term private key → if private key is later stolen, all past sessions decryptable
- **With PFS (ECDHE):** session key derived from ephemeral keys discarded after session → even with private key, past sessions safe
- TLS 1.3 mandates PFS (all cipher suites use ECDHE)
- TLS 1.2 requires ECDHE/DHE cipher suites explicitly for PFS

---

### Q14: Walk through the TLS 1.3 handshake

```
1. ClientHello — supported ciphers, client ECDH ephemeral public key
2. ServerHello — chosen cipher, server ECDH ephemeral public key
   {Certificate} — server's X.509 cert (encrypted in TLS 1.3)
   {CertificateVerify} — signature over handshake transcript (proves private key)
   {Finished} — HMAC over entire transcript
3. Client verifies cert chain → verifies CertificateVerify signature
4. {Finished} — client HMAC
5. Both sides derive session keys from ECDH shared secret
6. Encrypted application data exchange begins
```

- 1 round-trip in TLS 1.3 vs 2 in TLS 1.2
- Certificate is encrypted (only after key exchange completes)

---

## Web Vulnerabilities

### Q15: Explain SQL injection with an example and prevention in Spring Boot

- Attack: user input concatenated into SQL query → attacker injects SQL logic
- Example: `email = "' OR '1'='1"` → returns ALL users
- **Prevention:** parameterized queries (JPA Spring Data auto-parameterizes; `@Query` with `:param`; `JdbcTemplate` with `?` placeholders)
- Dynamic ORDER BY: whitelist column names — cannot be parameterized
- Defense in depth: DB user should not have DROP permission

---

### Q16: What is CSRF? When does it NOT apply?

- Attack: attacker's page auto-submits form using victim's session cookie to a trusted site
- **Does NOT apply when:**
  - Using JWT in `Authorization: Bearer` header (not a cookie — browser won't auto-send)
  - API consumed only by mobile apps
  - `SameSite=Strict` cookies are used
- Spring Security's CSRF protection is for cookie-based sessions; disable for stateless JWT APIs

---

### Q17: What is SSRF? Give a cloud metadata attack example

- Server fetches attacker-controlled URL → attacker provides internal URLs
- Attack: `imageUrl = "http://169.254.169.254/latest/meta-data/iam/credentials"` → server returns AWS IAM keys
- **Defense:** block private IP ranges (127.x, 10.x, 169.254.x), allowlist domains, validate scheme (HTTPS only), re-check IP after DNS resolution

---

## Cryptography

### Q18: Why is AES-GCM preferred over AES-CBC?

- **CBC** = confidentiality only. Vulnerable to padding oracle attacks if no separate MAC
- **GCM** = authenticated encryption. Provides confidentiality + integrity tag in one operation
- If GCM ciphertext is tampered, decryption throws `AEADBadTagException` — tampering detected
- Never reuse IV with same key in GCM — makes plaintext recoverable

---

### Q19: What is a timing attack and how do you prevent it?

- Normal `String.equals()` returns false on first mismatch — longer matching prefix takes slightly longer
- Attacker measures response times to infer characters of secret (API key, HMAC, token)
- **Fix:** `MessageDigest.isEqual(a, b)` — always takes constant time regardless of mismatch position
- Spring Security's `PasswordEncoder.matches()` is already constant-time

---

## Privacy & Compliance

### Q20: How do you implement GDPR's Right to Erasure in microservices?

- Publish `UserErasedEvent` to Kafka topic
- Each service subscribes, erases/anonymizes its own data
- Keep legally required records (billing, fraud evidence) but dissociate from user identity
- Acknowledge user within **30 days** (GDPR requirement)
- Challenge: backups — document that backups overwrite within backup retention window

---

### Q21: What card data must NEVER be stored under PCI-DSS?

- CVV/CVC (3–4 digit security code) — **never**, even encrypted
- Full magnetic stripe data — never
- PIN or encrypted PIN block — never
- Best practice: use Stripe/Braintree tokenization — card data never hits your servers

---

## Cloud & Infrastructure

### Q22: How do you secure sensitive config (DB passwords, API keys) in Spring Boot microservices?

1. **HashiCorp Vault / AWS Secrets Manager** — dynamic secrets, auto-rotation (best)
2. **Kubernetes Secrets** with etcd encryption at rest + RBAC
3. **CI/CD environment variables** via GitHub Secrets / GitLab CI variables
4. Never: hardcode in `application.properties` committed to git
5. Never: `ENV API_KEY=secret123` in Dockerfile (baked into image layers)

---

## Scenario Questions

### Q23: Critical SQL injection found in production. Walk through your response.

1. **Assess** — is it being exploited? Check logs for `OR 1=1`, `UNION SELECT`
2. **Contain** — WAF virtual patch (block SQLi pattern to that endpoint), optionally take endpoint offline
3. **Fix** — parameterized query hotfix, bypass normal sprint cycle for P1
4. **Verify** — DAST scan on staging confirms fix
5. **Assess exposure** — what data was accessible? Notify legal/DPO if PII exposed
6. **Post-incident** — add SAST rule, add to pre-release pentest checklist

---

### Q24: User reports their account was "hacked". How do you investigate?

1. **Verify** — check login logs: suspicious IPs, unusual times, unknown devices
2. **Check** — was email/password in a known breach (HaveIBeenPwned)?
3. **Check** — concurrent sessions from different geolocations (impossible travel)
4. **Immediate action** — lock account, invalidate all sessions, help user regain access
5. **Determine how** — phishing? Password reuse? Malware? SIM swap?
6. **System improvements** — anomaly detection (impossible travel alerts), enforce MFA

---

### Q25: How would you design a secure password reset flow?

1. Generate cryptographically random token (32 bytes, SecureRandom)
2. Store **hashed** token in DB with 15–60 minute expiry
3. Send reset link to **verified email only**
4. Token is **single-use** — invalidate on use
5. **Rate-limit** reset requests per email per hour
6. Show **same success message** whether email exists or not (prevent user enumeration)
7. On successful reset: **invalidate all existing sessions**

---

## Quick-Fire Reference

| Question | Answer |
|---|---|
| HTTP 401 vs 403 | 401 = unauthenticated, 403 = authenticated but not authorized |
| Cookie flag that blocks JavaScript | `HttpOnly` |
| Cookie flag that prevents CSRF | `SameSite=Strict` or `SameSite=Lax` |
| What `kid` does in JWT | Identifies which public key to use for verification |
| JWKS endpoint path | `/.well-known/jwks.json` |
| JWT payload encoding | Base64Url — NOT encrypted (use JWE for encryption) |
| AES mode that includes integrity | GCM (Galois/Counter Mode) |
| Why IV must be unique in AES-GCM | Reuse with same key = plaintext recoverable |
| What PKCE prevents | Authorization code interception by malicious app |
| TLS 1.3 round trips | 1 (vs 2 in TLS 1.2) |
| What MLE adds vs TLS | End-to-end payload encryption beyond TLS termination point |
| mTLS vs TLS | mTLS = both sides authenticate with certificates |
| STRIDE | Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation |
| CVE | Common Vulnerabilities and Exposures — public database of known flaws |
| PCI-DSS data never stored | CVV, magnetic stripe, PIN |
| Password algorithm choice | Argon2id (best) or BCrypt — never MD5/SHA-1 |
| Constant-time comparison (Java) | `MessageDigest.isEqual()` |
| Symmetric vs Asymmetric | Symmetric: same key (fast, data). Asymmetric: key pair (slow, signing/key exchange) |
| Sign with which key? | **Private** key — others verify with your **public** key |
| Encrypt for recipient: which key? | Recipient's **public** key — they decrypt with their **private** key |
