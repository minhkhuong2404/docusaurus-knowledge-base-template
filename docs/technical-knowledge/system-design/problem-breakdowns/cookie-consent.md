---
id: cookie-consent
title: "Design an Enterprise Cookie & Consent Management Platform (CMP)"
sidebar_label: "45. Cookie Consent Platform"
description: "Staff-level architecture for global GDPR/CCPA consent banner evaluation at CDN edge, sub-10ms latency, tamper-evident cryptographic audit logs, and IAB TCF v2.2 compliance."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design an Enterprise Cookie & Consent Management Platform (CMP)

A Consent Management Platform (CMP)—such as OneTrust, Didomi, or Usercentrics—is a mission-critical compliance system that governs data privacy for enterprise websites and mobile apps. Under global privacy frameworks (**GDPR in the EU, CCPA/CPRA in California, LGPD in Brazil**), websites are legally prohibited from executing tracking scripts or dropping non-essential cookies without prior consent. The platform must evaluate regional legal policies at the **CDN Edge in under 10 milliseconds**, dynamically block third-party scripts, encode standardized **IAB TCF v2.2 consent strings**, and generate **tamper-evident cryptographic audit trails** to withstand regulatory audits.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Geo-Targeted Policy Evaluation**: Automatically determine which legal jurisdiction applies based on user Geo-IP (e.g., EU requires strict opt-in prior consent; California requires opt-out; other regions require standard notification).
2. **Dynamic Script & Cookie Blocking**: Intercept and block third-party analytics and marketing scripts (Google Analytics, Meta Pixel, TikTok) until user consent is granted.
3. **Standardized Consent Encoding (IAB TCF v2.2)**: Encode user consent into standardized binary strings (TC Strings) for advertising tech vendors.
4. **Cross-Domain Consent Sharing**: Synchronize user consent across related subdomains and properties (e.g. `*.brand.com`).
5. **Tamper-Evident Audit Trail**: Maintain an immutable, legally verifiable log of consent receipts (timestamp, IP, categories accepted, policy version) for up to 5 years.

### Non-Functional Requirements
- **Ultra-Low Edge Latency**: Evaluating whether to show a banner must resolve in **$< 10\text{ms}$** at the CDN edge so it does not degrade Core Web Vitals (Largest Contentful Paint - LCP).
- **Extreme Availability**: $99.999\%$ uptime. If the consent service fails, it must fail safe according to regional laws (e.g., default to blocking in EU, default to allowing in US).
- **High Concurrency**: Handle **100,000+ Requests per Second (QPS)** across thousands of customer websites.
- **Data Integrity & Non-Repudiation**: Consent receipts must be mathematically tamper-proof using cryptographic hashing.

### Capacity Estimations & Sizing (5 Years)
- **Scale**:
  - Daily Global Pageviews Evaluated: 1 Billion pageviews/day.
  - Peak Evaluation QPS: **50,000 to 100,000 QPS**.
  - Daily Consent Mutations (user clicks "Accept" or changes preferences): 50 Million actions/day $\implies$ **600 writes/second** average.
- **Storage Calculations (5-Year Audit Log)**:
  - 50M consent records/day $\times$ 365 days $\times$ 5 years $\approx \mathbf{91\text{ Billion Audit Records}}$.
  - Audit Record Size: `consent_id` (UUID), `user_pseudonym_id` (UUID), `geo_country` (2B), `policy_version` (4B), `purposes_accepted_bitmask` (8B), `sha256_signature` (32B), `timestamp` (8B) $\approx$ **128 bytes**.
  - Total Storage: $91\text{ Billion} \times 128\text{ bytes} \approx \mathbf{11.6\text{ Terabytes}}$.
  - Easily stored in an append-only analytical store like ClickHouse, BigQuery, or Amazon QLDB!

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                   REGULATORY_POLICY                    │
├──────────────────┬──────────────┬──────────────────────┤
│ policy_id        │ VARCHAR(32)  │ PRIMARY KEY          │
│ jurisdiction     │ VARCHAR(16)  │ "EU_GDPR", "US_CCPA" │
│ country_codes    │ ARRAY[CHAR(2)│ ISO 3166 Country List│
│ consent_model    │ ENUM         │ OPT_IN, OPT_OUT, INFO│
│ banner_required  │ BOOLEAN      │ Display UI Flag      │
│ vendor_framework │ ENUM         │ IAB_TCF_V2, CUSTOM   │
│ policy_version   │ INT          │ Legal Rev Number     │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     CONSENT_RECEIPT                    │
├──────────────────┬──────────────┬──────────────────────┤
│ receipt_id       │ UUID         │ PRIMARY KEY          │
│ user_token       │ UUID         │ 1st-party cookie ID  │
│ domain           │ VARCHAR(128) │ "shop.example.com"   │
│ jurisdiction     │ VARCHAR(16)  │ "EU_GDPR"            │
│ accepted_purposes│ BIGINT       │ 64-bit Bitmask       │
│ tc_string        │ VARCHAR(256) │ IAB TCF Encoded Base64│
│ sha256_hash      │ CHAR(64)     │ Cryptographic Hash   │
│ prev_hash        │ CHAR(64)     │ Blockchain/Merkle Link│
│ created_at       │ TIMESTAMP    │ Legal Audit Time     │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Edge Policy Evaluation API
```http
GET /api/v1/consent/evaluate?domain=shop.example.com
CF-IPCountry: DE // Injected by Cloudflare / Edge CDN
```
**Response (`200 OK`)**:
```json
{
  "jurisdiction": "EU_GDPR",
  "consent_model": "STRICT_OPT_IN",
  "banner_required": true,
  "default_purposes": {
    "necessary": true,
    "analytics": false,
    "marketing": false
  },
  "tcf_vendor_list_version": 142
}
```

#### 2. Submit Consent Choice
```http
POST /api/v1/consent/submit
Content-Type: application/json

{
  "user_token": "u_9481a829104",
  "domain": "shop.example.com",
  "accepted_purposes": ["necessary", "analytics"],
  "rejected_purposes": ["marketing"],
  "policy_version": 4,
  "client_timestamp": 1727020800000
}
```
**Response (`201 Created`)**:
```json
{
  "receipt_id": "rcpt_7a81094b",
  "tc_string": "CP9481A09481AAACABENA...",
  "audit_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "cookie_directive": "Set-Cookie: euconsent-v2=CP948...; Domain=.example.com; Max-Age=31536000; Secure; SameSite=Lax"
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="rate-limiter" title="Enterprise Cookie Consent Evaluation & Cryptographic Audit Pipeline" />

### Walkthrough of Core Flows

#### 1. The Edge Evaluation Flow (Sub-10ms)
1. User visits `https://shop.example.com`.
2. The request hits the **Edge CDN (Cloudflare Workers / Fastly Varnish)**.
3. The Edge Worker inspects the request headers:
   - Evaluates the incoming 1st-party cookie `euconsent-v2`. If valid, user preferences are already known $\implies$ page loads with no banner!
   - If cookie is missing, inspects the **Edge Geo-IP header** (`CF-IPCountry` / `X-Country-Code`).
4. The Edge Worker matches the country against an in-memory **Regional Policy Map** stored in Edge KV (e.g. Cloudflare Workers KV):
   - User in Germany (`DE`) $\implies$ Match `EU_GDPR` $\to$ Returns config requiring strict opt-in banner.
   - User in California (`US-CA`) $\implies$ Match `US_CCPA` $\to$ Returns config with "Do Not Sell My Info" footer link.
5. Injects the lightweight **CMP Client Loader Script** ($< 8\text{ KB}$) directly into the HTML `<head>`.

#### 2. The Client-Side Script Blocking Flow
1. Third-party tracking scripts on the page are marked with custom MIME types:
   ```html
   <script type="text/plain" data-consent-category="marketing" src="https://connect.facebook.net/en_US/fbevents.js"></script>
   ```
2. The browser treats `type="text/plain"` as raw text and **does not execute it**.
3. When the user clicks *"Accept All"* on the banner, the CMP SDK:
   - Changes the script `type` to `text/javascript`, dynamically executing the tag.
   - Sets the `euconsent-v2` cookie locally.
   - Dispatches an asynchronous Beacon `POST /api/v1/consent/submit` to the backend.

#### 3. The Immutable Audit Trail Ingestion
1. The consent submission hits the **Consent Ingestion Gateway**.
2. Encodes the choice into an **IAB TCF v2.2 Base64 TC String**.
3. Computes a **SHA-256 Merkle Hash** over the payload and writes the receipt to **Apache Kafka**.
4. Stream workers append the receipt into an **Append-Only Analytical Ledger (ClickHouse / Amazon QLDB)**.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Geo-IP Regulatory Policy Engine at the CDN Edge
How do we evaluate privacy regulations without hitting origin database servers?

```
┌────────────────────────────────────────────────────────┐
│                CDN EDGE GEO-IP EVALUATION              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  User Request ──► Cloudflare / Fastly CDN Edge Worker  │
│                        │                               │
│                        ├─► Reads `CF-IPCountry`: "FR"  │
│                        │                               │
│                        ▼                               │
│               Edge Memory Key-Value                    │
│           ┌─────────────────────────────┐              │
│           │ "FR": GDPR Strict Opt-In    │              │
│           │ "US-CA": CCPA Opt-Out Only  │              │
│           │ "BR": LGPD Opt-In           │              │
│           │ "GLOBAL": Default Notice    │              │
│           └─────────────────────────────┘              │
│                        │                               │
│  Latency: < 2ms! ◄─────┘                               │
│                                                        │
└────────────────────────────────────────────────────────┘
```
- **Edge KV Sync**: The regulatory matrix (a few kilobytes of JSON mapping 240 countries and US state regions to policies) is replicated globally across all 300+ CDN edge datacenters. Zero origin database queries occur on page load!

### Deep Dive 2: The IAB TCF v2.2 Compact Bitfield Encoding
How do ad tech networks (Google AdSense, Prebid, Criteo) read user consent in milliseconds without database queries?

```
┌────────────────────────────────────────────────────────┐
│           IAB TCF V2.2 TC STRING BITFIELD LAYOUT       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [6 bits]  Version = 2                                 │
│  [36 bits] Created Timestamp (Epoch Deci-seconds)      │
│  [36 bits] Last Updated Timestamp                      │
│  [12 bits] CMP ID = 142                                │
│  [12 bits] CMP Version = 4                             │
│  [2 bits]  Consent Screen ID                           │
│  [24 bits] Special Purposes Bitmask                    │
│  [N bits]  Vendor Consent Bit Range (1000+ Ad Tech IDs)│
│                                                        │
│  Result: Compact Base64 String:                        │
│  "CP9481A09481AAACABENAYCgAAAAAEAAA..."               │
│                                                        │
└────────────────────────────────────────────────────────┘
```
- By packing hundreds of vendor consents and 10 legal processing purposes into a compact **binary bitfield encoded as Base64**, the entire consent state is passed directly inside HTTP Cookie headers and OpenRTB bid requests, requiring zero network lookups by downstream advertising platforms.

### Deep Dive 3: Tamper-Evident Cryptographic Audit Receipts
When a privacy regulator (e.g. the French CNIL or Irish DPC) issues a formal inquiry demanding proof that a specific user consented to tracking on March 12:

```
Audit Block Structure:
Receipt N:
  Payload: { User: U1, Domain: D1, Choices: [Analytics, Marketing], Time: T }
  SHA-256 Hash = Hash(Payload + Prev_Hash) ──┐
                                             │ Linked Hash Chain
Receipt N+1:                                 ▼
  Payload: { User: U2, Domain: D2, ... }
  SHA-256 Hash = Hash(Payload + Hash_N)
```
- **Cryptographic Immutability**: Each consent receipt incorporates the cryptographic hash of the preceding receipt, forming a **Merkle DAG / Hash Chain**.
- If a malicious insider modifies a database record in an attempt to retroactively forge consent, the hash chain breaks, immediately proving data tampering during legal discovery.

### Deep Dive 4: Script Blocking Techniques (Network Interception vs DOM Rewriting)
How does a CMP prevent tracking scripts that are hardcoded into customer HTML from firing?
1. **MutationObserver (DOM Interception)**:
   - The CMP loader script registers a `MutationObserver` on the HTML document root before any other script runs.
   - When the browser's HTML parser attempts to append a `<script>` tag matching known tracker domains (e.g., `google-analytics.com/analytics.js`), the observer intercepts the node and changes its `type` to `text/plain`, preventing execution.
2. **Network Proxy / Service Worker**:
   - On progressive web apps, a Service Worker intercepts all outgoing HTTP requests; if an analytics request is made without a valid `euconsent` token, the Service Worker aborts the fetch.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Policy Evaluation** | Origin Database Query | CDN Edge Worker (KV Cache) | **CDN Edge Worker**: Slashes evaluation latency from 150ms to $< 2\text{ms}$; protects Core Web Vitals (LCP). |
| **Script Blocking** | Manual Customer Code Integration | Automatic DOM MutationObserver | **Automatic MutationObserver**: Prevents tracking leaks caused by developer human error or third-party tag managers. |
| **Consent Storage** | Client-Only LocalStorage / Cookie | Dual-Store (1st-Party Cookie + Cloud Audit Log) | **Dual-Store**: Cookies provide instant zero-network reads for client scripts; cloud ledger provides non-repudiation during regulatory audits. |
| **Audit Storage Engine** | Standard Relational SQL (Postgres) | Append-Only Columnar TSDB (ClickHouse) | **ClickHouse**: 10x higher write ingestion throughput; columnar compression slashes 5-year audit storage costs by 80%. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands GDPR opt-in vs CCPA opt-out differences.
- Designs basic schemas for consent records and cookie categories (Necessary, Analytics, Marketing).
- Explains how cookies and LocalStorage store user choices in the browser.

### Senior (L5 / IC5)
- Designs Edge CDN policy evaluation using Geo-IP headers to achieve sub-10ms response times.
- Explains third-party script interception mechanics (DOM `MutationObserver` and MIME type manipulation).
- Details the IAB TCF v2.2 binary bitfield encoding and why ad tech ecosystems rely on it.
- Implements asynchronous audit logging using Kafka and append-only datastores.

### Staff+ (L6 / Principal)
- Evaluates cryptographic tamper-evidence (Merkle DAGs / SHA-256 hash chaining) for legal non-repudiation during regulatory investigations.
- Formulates cross-domain and cross-device consent synchronization architectures using first-party identity stitching.
- Designs fail-safe mechanisms ensuring that system degradation defaults to legal compliance (strict blocking in GDPR territories).
- Analyzes privacy-preserving analytics alternatives (e.g., Differential Privacy, Google Consent Mode V2 pings).
