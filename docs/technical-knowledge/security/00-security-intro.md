---
id: security-intro
title: Security Knowledge Base
sidebar_label: Overview
slug: /security
description: A comprehensive security reference for software engineers covering authentication, authorization, cryptography, web vulnerabilities, privacy, compliance, secure SDLC, and incident response.
tags: [security, overview, authentication, cryptography, owasp, privacy, devsecops]
---

# Security Knowledge Base

> Security is not a feature you add at the end — it's a property you design in from the start.

---

## Why Security Matters for Engineers

Security vulnerabilities are almost always caused by **engineering decisions**, not bad luck:

- A parameterized query prevents SQL injection
- An HttpOnly cookie flag prevents XSS-based session theft
- A short JWT expiry limits the blast radius of a token leak
- A GDPR-compliant erasure flow protects users and avoids €20M fines

You don't need to be a security specialist. You need to know **enough to write safe code** and **enough to ask the right questions** in a design review.

---

## What's Covered

| Topic | Description |
|---|---|
| [Authentication & Authorization](/technical-knowledge/security/authentication-authorization) | Sessions, JWT, OAuth 2.0, OIDC, MFA, RBAC, ABAC, passkeys |
| [Web Vulnerabilities & Defenses](/technical-knowledge/security/web-vulnerabilities) | OWASP Top 10 — SQL injection, XSS, CSRF, SSRF, IDOR and mitigations |
| [Cryptography & Secure Design](/technical-knowledge/security/cryptography-secure-design) | AES-GCM, RSA, HMAC, signatures, TLS internals, key management |
| [Privacy & Compliance](/technical-knowledge/security/privacy-compliance) | GDPR, CCPA, PCI-DSS, HIPAA, data classification, right to erasure |
| [Network Security](/technical-knowledge/security/network-security) | Firewalls, WAF, DDoS, DNS security, zero trust, mTLS |
| [Secure SDLC & DevSecOps](/technical-knowledge/security/secure-sdlc) | Threat modeling, SAST, DAST, SCA, secrets scanning, container security |
| [Identity & Access Management](/technical-knowledge/security/identity-access-management) | SSO, SAML, LDAP, service accounts, Vault, JIT access, cloud IAM |
| [API Security](/technical-knowledge/security/api-security) | OWASP API Top 10, input validation, rate limiting, GraphQL security |
| [Incident Response](/technical-knowledge/security/incident-response) | IR lifecycle, detection, containment, recovery, post-mortem |
| [Interview Questions](/technical-knowledge/security/interview-questions) | 21 deep-dive answers + quick-fire reference table |

---

## Security Mental Model

Think of security in **layers** — every layer can fail, so you never rely on just one.

```
┌─────────────────────────────────────────────────────┐
│  PERIMETER        WAF · DDoS protection · Firewall   │
├─────────────────────────────────────────────────────┤
│  TRANSPORT        TLS 1.3 · mTLS · Certificate mgmt  │
├─────────────────────────────────────────────────────┤
│  IDENTITY         AuthN · MFA · SSO · Token rotation  │
├─────────────────────────────────────────────────────┤
│  APPLICATION      AuthZ · Input validation · OWASP    │
├─────────────────────────────────────────────────────┤
│  DATA             Encryption at rest · Masking · PII   │
├─────────────────────────────────────────────────────┤
│  AUDIT            Immutable logs · SIEM · Alerting     │
└─────────────────────────────────────────────────────┘
```

Attackers **always find the weakest layer**. Defence in depth means there is no single point of failure.

---

## The OWASP Top 10 at a Glance

| # | Risk | One-Line Fix |
|---|---|---|
| A01 | Broken Access Control | Always verify ownership server-side |
| A02 | Cryptographic Failures | AES-256-GCM at rest, TLS in transit |
| A03 | Injection (SQL, Command) | Parameterized queries, never concatenate |
| A04 | Insecure Design | Threat model before you build |
| A05 | Security Misconfiguration | Disable defaults, no verbose errors |
| A06 | Vulnerable Components | SCA scan in CI, auto-update patches |
| A07 | Auth Failures | MFA, short tokens, account lockout |
| A08 | Integrity Failures | Never deserialize untrusted data |
| A09 | Logging Failures | Log every auth event, no PII in logs |
| A10 | SSRF | Block private IPs, allowlist domains |

---

## Key Security Principles

| Principle | In Practice |
|---|---|
| **Least Privilege** | Grant only the minimum permissions needed — to users, services, and DB accounts alike |
| **Defense in Depth** | Assume every control can fail; never rely on a single layer |
| **Fail Secure** | Default to deny; errors should lock down, not open up |
| **Don't Roll Your Own Crypto** | Use BCrypt, AES-GCM, TLS 1.3 — not home-grown algorithms |
| **Secure by Default** | Secure configuration out of the box, not opt-in |
| **Minimize Attack Surface** | Every unused endpoint, port, and dependency is a liability |
| **Assume Breach** | Design so that a compromised component limits blast radius |
| **Zero Trust** | Verify every request — network location is not a trust boundary |

---

## Common Vulnerabilities by Layer

### Code Level
- SQL / NoSQL / Command injection
- XSS (Stored, Reflected, DOM)
- Insecure deserialization
- Hardcoded secrets

### Authentication / Session
- Weak passwords, no MFA
- Token leakage (logging, error messages)
- Session fixation, no logout invalidation
- JWT `alg: none` acceptance

### Authorization
- IDOR (Insecure Direct Object Reference)
- Privilege escalation via mass assignment
- Missing function-level authorization
- Overly broad IAM permissions

### Infrastructure
- Misconfigured cloud storage (public S3 buckets)
- Exposed admin endpoints (Actuator, Swagger)
- Unencrypted data at rest
- Outdated dependencies with CVEs

---

## Learning Path

### For Interview Preparation
1. [Authentication & Authorization](/technical-knowledge/security/authentication-authorization) — most common interview topic
2. [Web Vulnerabilities](/technical-knowledge/security/web-vulnerabilities) — OWASP Top 10 is expected knowledge
3. [Cryptography](/technical-knowledge/security/cryptography-secure-design) — hashing vs encryption, TLS basics
4. [Privacy & Compliance](/technical-knowledge/security/privacy-compliance) — GDPR basics, PCI-DSS rules
5. [Interview Questions](/technical-knowledge/security/interview-questions) — practise with answers

### For Production Systems
1. Start with [Secure SDLC](/technical-knowledge/security/secure-sdlc) — embed security early
2. [API Security](/technical-knowledge/security/api-security) — your primary attack surface
3. [IAM](/technical-knowledge/security/identity-access-management) — get service identities right
4. [Incident Response](/technical-knowledge/security/incident-response) — prepare before you need it

### For Compliance Projects
1. [Privacy & Compliance](/technical-knowledge/security/privacy-compliance) — regulatory requirements
2. [Cryptography](/technical-knowledge/security/cryptography-secure-design) — encryption obligations
3. [Audit Logging](/technical-knowledge/security/incident-response#phase-1-preparation) — evidence trail
4. [Network Security](/technical-knowledge/security/network-security) — infrastructure controls

---

## Quick Reference: Technology Choices

| Need | Recommended |
|---|---|
| Password hashing | Argon2id (best) · BCrypt (standard) |
| Symmetric encryption | AES-256-GCM |
| Asymmetric encryption / signing | RS256 / ES256 (JWT), RSA-OAEP (encryption) |
| TLS | TLS 1.3 (minimum TLS 1.2) |
| Token format | JWT (RS256) + short TTL + refresh rotation |
| SSO protocol (enterprise) | SAML 2.0 or OIDC |
| SSO protocol (consumer) | OAuth 2.0 + OIDC |
| Secrets management | HashiCorp Vault · AWS Secrets Manager |
| SAST (Java) | SpotBugs + Find Security Bugs · SonarQube |
| Dependency scanning | OWASP Dependency-Check · Snyk |
| Secrets scanning | Gitleaks |
| Container scanning | Trivy |
| DAST | OWASP ZAP |
| WAF | AWS WAF · Cloudflare · nginx ModSecurity |

---

:::tip Interview tip
Security questions in system design interviews almost always touch one of three areas: **how do you authenticate/authorize**, **how do you protect sensitive data**, and **what do you do when something goes wrong**. Make sure you can answer all three confidently.
:::

:::warning Never do this
- Store passwords in plaintext or MD5
- Concatenate user input into SQL queries
- Commit secrets to version control
- Return stack traces in API error responses
- Trust the `user_id` sent by the client — always derive it from the validated token
:::
