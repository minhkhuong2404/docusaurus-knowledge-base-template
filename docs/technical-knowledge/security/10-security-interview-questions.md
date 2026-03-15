---
id: security-interview-questions
title: Common Security Interview Questions
sidebar_label: Interview Questions
description: Comprehensive security interview question bank for software engineers, covering authentication, web vulnerabilities, cryptography, network security, cloud security, and secure design scenarios.
tags: [security, interview-prep, questions, authentication, owasp, cryptography, devsecops]
---

# Common Security Interview Questions

> Questions are grouped by topic and include the key points interviewers expect in your answer.

---

## Authentication & Authorization

### Q1: What is the difference between authentication and authorization? Give an example where they are independent.

**Key points:**
- AuthN = verifying identity ("Who are you?"). AuthZ = verifying permissions ("What can you do?").
- Example: A valid JWT (authenticated) can access `/api/orders` but get a 403 (not authorized) on `/api/admin` — identity verified, permission denied.
- HTTP status codes: 401 = unauthenticated, 403 = unauthorized.

---

### Q2: Explain how JWT works. What are the security concerns?

**Key points:**
- Three parts: header (algorithm), payload (claims), signature.
- Server validates signature only — no DB lookup needed (stateless).
- **Concerns:**
  - Cannot be revoked before expiry (use blocklist or short TTL)
  - Payload is Base64 encoded, not encrypted (don't put sensitive data in payload unless using JWE)
  - Algorithm confusion attacks: if server accepts `alg: none`, attacker can forge token
  - Use RS256 (asymmetric) over HS256 in multi-service environments

---

### Q3: How does OAuth 2.0 differ from OIDC?

**Key points:**
- OAuth 2.0 = authorization framework (delegated access to resources). Does NOT define identity.
- OIDC = identity layer on top of OAuth 2.0. Adds `id_token` (JWT with user claims like email, name).
- OAuth 2.0: "Can this app access your Google Drive?" → returns `access_token`
- OIDC: "Who are you? Login with Google" → returns `id_token` + `access_token`

---

### Q4: How do you implement the refresh token rotation pattern and why?

**Key points:**
- Access token: short TTL (15 min). Refresh token: long TTL (30 days), stored server-side.
- On each use of refresh token: issue NEW refresh token + invalidate old one.
- **Why rotation?** If refresh token is stolen, the legitimate user's next use triggers invalidation of the stolen token, and the attacker's next use is detected (token already used = theft indicator).

---

### Q5: What is the difference between RBAC, ABAC, and ReBAC?

**Key points:**
- RBAC: Access based on assigned role (Admin, User). Simple, widely supported.
- ABAC: Access based on attributes of user, resource, environment (department match, time of day). More flexible, more complex.
- ReBAC: Access based on relationships between entities (used in Google Zanzibar, OPA). "Alice is an editor of Document X because she is a member of Team Y which owns Folder Z."
- Trade-off: RBAC is simple but coarse-grained; ABAC is fine-grained but complex to manage.

---

## Web Vulnerabilities

### Q6: Explain SQL injection with an example and how to prevent it in Spring Boot.

**Key points:**
- Attack: Injecting SQL into user input that gets concatenated into a query.
- Example: `email = "' OR '1'='1"` returns all users.
- **Fixes in Spring Boot:**
  - JPA/Spring Data: parameterized automatically
  - `@Query` with `:param` named parameters
  - JdbcTemplate: `?` placeholder, not string concatenation
  - For dynamic ORDER BY: whitelist column names
- Defense in depth: DB user should not have DROP permission.

---

### Q7: What is CSRF? When does it NOT apply and why?

**Key points:**
- Attack: Attacker tricks authenticated user's browser into making state-changing request using their existing session cookie.
- Defenses: CSRF tokens (synchronizer token), `SameSite=Strict` or `SameSite=Lax` cookie attribute.
- **Does NOT apply when:**
  - Using JWT in `Authorization: Bearer` header (not a cookie) — browser won't auto-send it cross-site
  - API consumed only by mobile apps (no browser context)
  - `SameSite=Strict` cookies are used
- Spring Security's default CSRF protection is designed for cookie-based sessions.

---

### Q8: What is SSRF? Give an attack scenario involving cloud metadata.

**Key points:**
- Server-Side Request Forgery: server makes HTTP request to attacker-controlled URL.
- **Cloud metadata attack:** App accepts image URL → attacker provides `http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role` → server fetches and returns AWS IAM credentials.
- **Defenses:**
  - Block private IP ranges (127.x.x.x, 10.x.x.x, 169.254.x.x, etc.)
  - Allowlist domains for external requests
  - Resolve DNS and re-check IP after resolution (DNS rebinding)
  - Use HTTPS only

---

### Q9: What is the difference between Stored, Reflected, and DOM-based XSS?

**Key points:**
- **Stored XSS:** Malicious script stored in DB (e.g., comment), executed when other users view it. Highest impact.
- **Reflected XSS:** Script in URL parameter, reflected in response. User must click crafted link.
- **DOM-based XSS:** Client-side JavaScript reads from URL/location, writes to DOM without escaping. Never touches the server.
- **Defenses:** Output encoding (Thymeleaf's `th:text`), CSP (Content Security Policy), HttpOnly cookies (protect from script access to cookies).

---

## Cryptography

### Q10: Why is AES-GCM preferred over AES-CBC?

**Key points:**
- CBC provides only confidentiality. Vulnerable to padding oracle attacks without separate MAC.
- **GCM = AES + GHASH (authenticated encryption).** Provides confidentiality AND integrity in one operation.
- AES-GCM detects tampering — if ciphertext is modified, decryption throws `AEADBadTagException`.
- Both require unique IV per encryption. GCM IVs are 96-bit; reusing IV with the same key in GCM completely breaks security (never reuse).

---

### Q11: What is the difference between hashing and encryption?

**Key points:**
- **Hashing:** One-way, no key, same input = same output. Cannot reverse. Use for integrity, password storage (with salt+slow function).
- **Encryption:** Two-way, requires key. Can decrypt with right key. Use for confidentiality.
- Password storage: use **slow hash** (BCrypt, Argon2id) — fast hashes (SHA-256) are too easy to brute force with GPUs.

---

### Q12: What is a timing attack and how do you prevent it in string comparison?

**Key points:**
- Normal `String.equals()` returns false on first mismatching character — takes less time for shorter matching prefix → leaks information about the secret.
- Attacker measures response time to infer characters of a secret (e.g., API key, HMAC).
- **Fix:** `MessageDigest.isEqual()` or `Arrays.equals(mac1, mac2)` — always takes constant time regardless of where mismatch occurs.

---

### Q13: Explain Perfect Forward Secrecy. Why does it matter?

**Key points:**
- PFS ensures that **past sessions cannot be decrypted** even if the server's private key is later compromised.
- Achieved with ephemeral Diffie-Hellman key exchange (ECDHE): session key derived from ephemeral keys, which are discarded after the session.
- Without PFS: if attacker recorded encrypted traffic and later gets the private key, they can decrypt all past sessions retroactively.
- TLS 1.3 mandates PFS. TLS 1.2 with ECDHE cipher suites also provides it.

---

## Secure Design

### Q14: What is Defense in Depth? Give 3 concrete layers for a web API.

**Key points:**
- Multiple independent security controls at different layers so that failure of one doesn't compromise the system.
- **Three layers for a web API:**
  1. **Network layer:** WAF, firewall, TLS, DDoS protection
  2. **Application layer:** Authentication, authorization, input validation, rate limiting
  3. **Data layer:** Encryption at rest, field-level access control, audit logging

---

### Q15: How would you design a secure password reset flow?

**Key points:**
- Generate a cryptographically random token (not sequential, not guessable).
- Store **hashed** token in DB with expiry (15–60 minutes).
- Send link to verified email only.
- Token is single-use — invalidate on use.
- Rate-limit reset requests per email per hour.
- Show same success message whether email exists or not (prevent user enumeration).
- On successful reset: invalidate all existing sessions.

---

## Privacy & Compliance

### Q16: How do you implement GDPR's Right to Erasure in a microservices system?

**Key points:**
- Publish `UserErasureRequested` event to a Kafka topic.
- Each service subscribes and erases/anonymizes their own data.
- Challenge: what data is "legally required" to keep (billing records, fraud evidence) — retain but dissociate from user identity.
- Challenge: backup data — document that backups will be overwritten within your backup retention window.
- Track erasure completion across services with a saga/process manager.
- Acknowledge to user within 30 days (GDPR requirement).

---

### Q17: What data must never be stored under PCI-DSS?

**Key points:**
- CVV/CVC codes (3–4 digit security code)
- Full magnetic stripe data
- PIN or encrypted PIN block
- Even with encryption, these are prohibited after authorization.
- **What can be stored (with protection):** PAN (masked, e.g., last 4 digits), cardholder name, expiry date, service code.
- Best practice: use payment tokenization (Stripe, Braintree) — card never hits your servers, only tokens.

---

## Cloud & Infrastructure Security

### Q18: What is the principle of least privilege in AWS IAM and how do you apply it?

**Key points:**
- Grant only the minimum permissions needed to perform a function.
- Avoid wildcard `*` resource ARNs in policies.
- Use IAM roles for services (not long-lived access keys).
- Use Service Control Policies (SCPs) in AWS Organizations to enforce guardrails.
- Regularly audit IAM with AWS IAM Access Analyzer.
- Apply to humans: break-glass for emergency access, JIT provisioning otherwise.

---

### Q19: How do you secure sensitive configuration (DB passwords, API keys) in a Spring Boot microservice?

**Key points:**
- Never hardcode in source code or `application.properties` committed to git.
- Options (ranked best to worst for production):
  1. **HashiCorp Vault / AWS Secrets Manager** — dynamic, rotatable secrets (best)
  2. **Kubernetes Secrets** — base64 encoded, protect with RBAC + etcd encryption at rest
  3. **Environment variables** via CI/CD secrets (acceptable)
  4. **application-prod.properties** excluded from git (acceptable but manual rotation)
- Rotate secrets regularly. Vault can rotate dynamically (generate temporary DB credentials).
- Audit all secret accesses.

---

## Scenario Questions

### Q20: You discover a critical SQL injection vulnerability in production. Walk me through your response.

**Expected approach:**
1. **Assess impact** — is it being exploited? Check logs for `OR 1=1`, `UNION SELECT`, unusual query patterns.
2. **Immediate containment** — if active exploitation: block attacker IP at WAF, consider WAF virtual patch (block requests with SQL patterns to that endpoint).
3. **Fix** — deploy parameterized query fix as hotfix (bypass normal sprint cycle for P1).
4. **Verify** — confirm fix works, run DAST scan against staging.
5. **Assess data exposure** — what data was accessible? Notify legal/DPO if PII exposed.
6. **Post-incident** — add SAST rule for SQL injection, add pentest to pre-release checklist.

---

### Q21: A user reports their account was "hacked" and they didn't do it. How do you investigate?

**Expected approach:**
1. **Verify the claim** — check login logs for the account: suspicious IPs, unusual times, unknown devices.
2. **Check for credential compromise** — was the email/password in a known breach (HaveIBeenPwned)?
3. **Check for session hijacking** — look for concurrent sessions from different locations.
4. **Immediate action** — if confirmed: lock account, invalidate all sessions, help user regain access.
5. **Determine how** — phishing? Password reuse? Malware on device? SIM swap?
6. **Advise user** — change password on all sites (password reuse), enable MFA, check for unauthorized changes.
7. **System improvements** — consider anomaly detection (impossible travel alerts), enforce MFA.

---

## Quick-Fire Questions

| Question | Key Answer |
|---|---|
| What HTTP status code means "not authenticated"? | 401 |
| What HTTP status code means "authenticated but not authorized"? | 403 |
| Which cookie flag prevents JavaScript from reading the cookie? | HttpOnly |
| What is a rainbow table? | Pre-computed hash lookup table; defeated by salting |
| What does `SameSite=Lax` prevent? | CSRF on cross-site POST requests |
| What is a salt in password hashing? | Random value added to password before hashing; ensures same password → different hash |
| What cipher mode provides authenticated encryption? | GCM (Galois/Counter Mode) |
| What is the purpose of a nonce in CSP? | Allow specific inline scripts; prevents XSS by blocking inline scripts without the nonce |
| What does mTLS stand for? | Mutual TLS — both sides verify each other's certificate |
| What is a CVE? | Common Vulnerabilities and Exposures — public database of known security flaws |
| What is STRIDE? | Threat modeling framework: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation |
| What is the difference between symmetric and asymmetric encryption? | Symmetric: same key both ways (fast, for data). Asymmetric: public/private pair (slow, for key exchange and signatures) |
