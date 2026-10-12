---
id: versioning-evolution
title: API Versioning, Breaking Changes & Deprecation
sidebar_label: Versioning & Evolution
description: How to evolve APIs safely - catalog of breaking and non-breaking changes, versioning strategies (URI, header, media type, date-based), tolerant reader, expand-contract, deprecation with Sunset headers, and sunset governance.
tags:
  - technical-knowledge
  - api-design
  - versioning
  - deprecation
---

# API Versioning, Breaking Changes & Deprecation

> The best version strategy is *not needing a new version*. Evolve additively, use versions only for unavoidable breaks, and make breaking changes rare, announced and tool-detected.

## 1. Breaking vs Non-Breaking Changes

Judge from the **consumer's** perspective: requests that used to succeed must still succeed, and responses must still parse and mean the same thing.

| Change | Breaking? | Why / Mitigation |
|---|---|---|
| Add new endpoint | No | |
| Add optional request field/param | No | Default must preserve old behaviour |
| Add response field | **Usually No** | Breaks strict deserialisers (`FAIL_ON_UNKNOWN_PROPERTIES`), schemas with `additionalProperties: false` -> mandate tolerant readers |
| Add enum value in a **response** | **Yes (risky)** | Clients with exhaustive `switch` break; declare enums open |
| Add enum value in a **request** | No | |
| Add **required** request field | **Yes** | Add optional with default instead |
| Remove/rename field, endpoint, param | **Yes** | Add new + deprecate old |
| Change type (`int` -> `string`), format, or units | **Yes** | New field name |
| Narrow validation (shorter `maxLength`, stricter regex) | **Yes** | |
| Widen validation | No (for requests); **Yes** for response ranges clients depend on | |
| Change status code (200 -> 201), error code, or error shape | **Yes** | Clients branch on them |
| Change default sort/page size | **Yes** (behavioural) | Pin defaults in the contract |
| Change meaning of existing field | **Yes** (silent!) | Worst kind - tools can't detect |
| Make nullable -> non-null | No (response) | |
| Make non-null -> nullable | **Yes** (response) | |
| Change auth requirements/scopes | **Yes** | |
| Tighten rate limits | Possibly | Announce |
| Reorder JSON properties | No (clients must not depend on order) | |

Detect the mechanical ones with `oasdiff`/`openapi-diff` in CI ([Governance](./contract-governance-testing.md)); review the semantic ones manually.

## 2. Versioning Strategies

| Strategy | Example | Pros | Cons |
|---|---|---|---|
| **URI path** | `/v1/orders` | Visible, cacheable, trivial routing and docs | "Version" applies to the whole API; URLs change; encourages big-bang v2 |
| **Query param** | `/orders?version=2` | Easy to add | Cache/CDN keys, easy to forget |
| **Custom header** | `Api-Version: 2025-03-01` | Clean URLs, per-request | Hidden, harder to test in a browser, must `Vary` |
| **Media type** | `Accept: application/vnd.acme.order.v2+json` | Per-resource versioning, pure HTTP | Tooling friction, discoverability |
| **Date-based (Stripe)** | `Stripe-Version: 2024-06-20` | Continuous small changes; account pinned to a version; changelog per date | Requires a transformation layer per change (backward-compat "version change modules") |
| **No version, evolve only** (GraphQL style) | Deprecate fields with `@deprecated` | No fragmentation | Needs strong telemetry and discipline |

**Pragmatic default:** major version in the URI (`/v1`) + strictly additive changes inside a major version + deprecation policy. Large platforms with many integrators adopt date-based versioning with compat layers.

### Semantic Versioning for APIs

- `info.version` = `MAJOR.MINOR.PATCH` of the **contract**; the URI exposes only `MAJOR`.
- MINOR = backward-compatible additions; PATCH = docs/fixes; MAJOR = breaking.
- Tag spec releases in git and publish an immutable artifact.

## 3. Tolerant Reader & Robustness Principle

Be conservative in what you send, liberal in what you accept:

```java
// Jackson: clients ignore unknown response properties and unknown enum values
ObjectMapper mapper = JsonMapper.builder()
    .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
    .enable(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE)
    .build();

public enum OrderStatus {
    PENDING_PAYMENT, PAID, SHIPPED, CANCELLED,

    @com.fasterxml.jackson.annotation.JsonEnumDefaultValue
    UNKNOWN
}
```

Servers should also be tolerant on requests where harmless, but strict on security-relevant fields (mass assignment, see [Security checklist](./api-security-owasp-checklist.md)).

## 4. Expand-Contract (Parallel Change) for Field Renames

Renaming `fullName` -> `displayName` safely:

| Phase | Server behaviour | Client behaviour |
|---|---|---|
| 1. **Expand** | Return BOTH `fullName` and `displayName`; accept either on write | Unchanged |
| 2. **Migrate** | Mark `fullName` `deprecated: true` in OpenAPI; emit `Deprecation` header; track usage per client | Move to `displayName` |
| 3. **Contract** | After usage hits ~0 and the sunset date passes, remove `fullName` | - |

Same pattern for endpoints (`/v1/orders/search` -> `/v1/orders?q=`) and enums.

## 5. Deprecation & Sunset

```yaml
# OpenAPI
/orders/{id}/legacy-status:
  get:
    deprecated: true
    description: Deprecated since 2025-03-01, removed 2025-12-01. Use GET /orders/{id}.
```

```http
HTTP/1.1 200 OK
Deprecation: @1740787200                                     # RFC 9745 - deprecation date (Unix time)
Sunset: Mon, 01 Dec 2025 00:00:00 GMT                        # RFC 8594 - removal date
Link: <https://docs.example.com/migrate/orders>; rel="deprecation"; type="text/html"
Link: </v2/orders/ord_1>; rel="successor-version"
```

### Sunset Policy (write it down)

| Element | Typical standard |
|---|---|
| Notice period | >= 6-12 months for public/partner APIs; 1-3 months internal |
| Channels | Changelog, email to registered client owners (use API keys to know who), dashboard banners, response headers |
| Telemetry | Per-client, per-version, per-endpoint traffic; alert on clients still calling after notice |
| Brownouts | Short scheduled failures (e.g. 1 h/week, increasing) before final removal to flush out forgotten callers |
| Removal | Respond `410 Gone` with a problem body pointing to migration docs (not 404) |
| Governance | Owner signs off; exceptions are time-boxed |

## 6. Operating Multiple Versions

| Approach | Implementation | Cost |
|---|---|---|
| Shared core, version adapters | Domain model stays single; `v1`/`v2` controllers map to/from it | Best: one business logic, N thin mappers |
| Branch per version | Separate deployables | Duplicated fixes, security patches multiply |
| Transformation pipeline (Stripe) | Request/response transformers chained from latest back to pinned version | Elegant but needs rigorous tests |

Keep the number of concurrently supported majors small (2). Security fixes must backport to all supported versions.

## 7. Consumer-Driven Evolution

- Collect consumer contracts (Pact) so you know which fields real clients rely on.
- Use feature flags/capability negotiation for risky behaviour changes.
- Provide **sandboxes** and **changelogs** (generated from `oasdiff changelog`).

## 8. Interview One-Liners

| Question | Short answer |
|---|---|
| Is adding a response field safe? | Only if clients are tolerant readers - say so in the contract |
| Header vs URI versioning? | URI: visible/cacheable/simple; header: cleaner but hidden. Choose consistency; mandate `Vary` for headers |
| How do you remove an endpoint? | Deprecate, telemetry, Sunset header, notice, brownouts, 410 |
| What's the worst breaking change? | Silent semantic change of an existing field |
| How to rename a field? | Expand-contract with deprecation and usage tracking |

Next: [Reliability: Idempotency, Concurrency & Webhooks](./reliability-idempotency-webhooks.md).
