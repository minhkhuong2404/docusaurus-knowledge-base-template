---
id: api-design-interview-questions
title: API Design & OpenAPI Interview Questions (Junior to Staff)
sidebar_label: Interview Questions
description: Tiered API design and Swagger/OpenAPI interview questions with model answers - REST fundamentals, naming, status codes, idempotency, pagination, versioning, contract testing, governance, and design exercises.
tags:
  - technical-knowledge
  - api-design
  - interview
---

# API Design & OpenAPI Interview Questions

## Level 1 - Fundamentals

**Q1. What is the difference between Swagger and OpenAPI?**
OpenAPI is the specification (formerly "Swagger Specification", donated to the Linux Foundation in 2015). Swagger now refers to SmartBear's tooling: Swagger UI (interactive docs), Editor, Codegen. Current spec version: 3.1.

**Q2. Which HTTP methods are safe and which are idempotent?**
Safe: GET, HEAD, OPTIONS. Idempotent: those plus PUT and DELETE. POST and PATCH are not idempotent by default.

**Q3. 401 vs 403?**
401: not authenticated (missing/invalid credentials, send `WWW-Authenticate`). 403: authenticated but not permitted. Sometimes 404 is returned instead of 403 to hide resource existence.

**Q4. PUT vs PATCH?**
PUT replaces the whole resource (idempotent). PATCH applies a partial change (merge-patch or JSON Patch). Omitting a field in PUT means it is cleared/defaulted.

**Q5. Why plural nouns in URLs?**
Collection/item symmetry (`/orders`, `/orders/42`); HTTP method is the verb.

**Q6. What does `operationId` do?**
Unique name for an operation; generators use it as method name in SDKs, so it must be stable.

**Q7. What status code on successful creation?**
`201 Created` with a `Location` header (and usually the representation).

## Level 2 - Practitioner

**Q8. How do you document an API in Spring Boot?**
`springdoc-openapi-starter-webmvc-ui`; annotate with `@Operation`, `@ApiResponse`, `@Schema`; group with `GroupedOpenApi`; customise globally with `OpenApiCustomizer`; disable UI in prod; export spec in CI.

**Q9. Offset vs cursor pagination?**
Offset is simple but O(N) for deep pages and unstable under concurrent writes. Cursor/keyset uses `WHERE (created_at, id) < (:c, :i)` with a covering index: O(log n), stable, but no random jump. Use an opaque, validated cursor and `limit+1` to detect more pages.

**Q10. How do you make `POST /payments` safe to retry?**
`Idempotency-Key` header; unique constraint `(tenant, key)`; store request hash + response; same key + same payload returns stored result; different payload returns 422; business write and key record in one transaction; downstream calls use derived idempotency keys.

**Q11. What's in an error response?**
RFC 9457 `application/problem+json`: `type`, `title`, `status`, `detail`, `instance`, plus extensions `code`, `traceId`, `errors[]` with JSON Pointers. Stable `code` for programmatic handling; no internals leaked.

**Q12. How do you prevent lost updates?**
ETag + `If-Match` (412 on mismatch; 428 if missing) backed by a version column (`@Version`), or conditional SQL updates.

**Q13. `oneOf` vs `anyOf` vs `allOf`? What's `discriminator` for?**
`allOf`: all schemas (composition/inheritance); `oneOf`: exactly one; `anyOf`: at least one. `discriminator` names the property that selects the subtype so deserialisers don't try all branches.

**Q14. Naming conventions you enforce?**
kebab-case plural paths, camelCase properties, `...At` timestamps (RFC 3339 UTC), `is/has` booleans, UPPER_SNAKE open enums, opaque string ids, `Idempotency-Key`/`traceparent` headers, `verbNoun` operationIds, PascalCase schema names with `Request/Response` suffix. Enforced with Spectral in CI.

## Level 3 - Senior

**Q15. List five breaking changes that tools can't detect.**
Changed meaning of a field, changed default sort/page size, changed rounding/units, relaxed ordering guarantees, altered side effects/timing (e.g. now async), changed idempotency semantics, tightened rate limits.

**Q16. Design your versioning and deprecation strategy.**
Major in URI (`/v1`), strictly additive within a major, tolerant-reader requirement documented, expand-contract for renames, `deprecated: true` + `Deprecation`/`Sunset` headers + `Link` successor, per-client telemetry, 6-12 month notice, brownouts, then `410 Gone`. Support at most two majors; backport security fixes.

**Q17. Design-first or code-first?**
Design-first for public/multi-team APIs (consumer review, mocks, generated interfaces, no drift); code-first with committed spec snapshot and CI diff for small internal services. Either way: Spectral + oasdiff + conformance tests in CI.

**Q18. How would you stop a client from fetching other users' orders?**
Object-level authorization in the query (`findByIdAndCustomerId`), 404 on miss, tenant column + RLS, automated two-user authorization tests for every id-bearing endpoint (OWASP API1).

**Q19. Webhook design pitfalls?**
At-least-once and unordered; sign with HMAC over `timestamp.rawBody`, constant-time compare, tolerance window, secret rotation; exponential retry for days; replay UI; dedupe by event id; SSRF defenses; fast 2xx then async processing.

**Q20. How do you handle long-running operations?**
`202 Accepted` + `Location: /operations/{id}`, poll with `Retry-After`, durable operation resource with status/result/error, cancel via DELETE, optional webhook completion; `303 See Other` to result resource.

**Q21. How do you model partial failures in a batch endpoint?**
Either atomic (all-or-nothing, 422 with item errors) or per-item results (`207`-style array with status per element). Document which; cap size; per-item idempotency keys; return stable item correlation (`clientRef`).

**Q22. REST vs gRPC vs GraphQL - how to choose?**
REST/OpenAPI: public, cacheable, broad tooling. gRPC: internal low-latency, streaming, strict IDL. GraphQL: varied client data needs (mobile/web), needs cost limiting and caching strategy. See [API Design overview](../system-design/api-design.md).

## Level 4 - Staff / Design Exercises

### Exercise 1: Design a Public Payments API
Cover: resources (`customers`, `payment-intents`, `refunds`, `webhook-endpoints`), state machine and transitions as custom actions (`:confirm`, `:cancel`), Idempotency-Key, date-based versioning with account pinning, expandable relations, cursor pagination, Problem Details with stable codes, signed webhooks, rate limits per key, sandbox + test cards, SDK generation, deprecation policy, OWASP controls, spec governance pipeline.

### Exercise 2: Migrate 30 Teams to One Style Guide
Approach: publish style guide + shared components repo; Spectral ruleset as a reusable GitHub Action; start with `warn`, ratchet to `error` per rule over quarters; baseline existing violations (new code must comply); catalog and scorecards per team; office hours; pre-approved exceptions with expiry.

### Exercise 3: Roll Out a Breaking Change to 200 Integrators
Dual-write/expand phase, `Deprecation`/`Sunset`, usage dashboard per API key, targeted emails, migration guide + codemod/SDK release, sandbox with new behaviour, brownouts, executive escalation for stragglers, final `410` with migration link, post-mortem.

### Exercise 4: Review This Endpoint
`GET /getUsers?page=2&size=50&orderBy=name desc` returns `{"data":[{"user_id":12,"Name":"Ann","created":"03/01/25"}],"total":9100}`.

Findings: verb in path, pluralisation/collection naming, raw SQL-like `orderBy` (injection/unindexed sorts), offset pagination + `total` count cost, inconsistent casing (`user_id` vs `Name`), numeric id (enumeration/BOLA), ambiguous date format and no timezone, no error contract, no auth/scope documented, no `limit` cap, envelope key `data` unversioned. Fix: `GET /users?limit=50&cursor=...&sort=name`, camelCase, `id` as opaque string, `createdAt` RFC 3339, Problem Details, spec with `security` and caps.

## Rapid-Fire

| Question | Answer |
|---|---|
| Is DELETE idempotent if the second call returns 404? | Yes - server state is the same; responses may differ |
| Can GET have a body? | Technically allowed, semantically undefined; avoid (use POST for search with complex criteria or `QUERY` method) |
| Where should the API version go? | One consistent place; URI major is the pragmatic default |
| What's HATEOAS good for? | Steering clients through workflows; links for pagination and permitted actions |
| 400 or 422 for validation errors? | Pick a rule: 400 malformed, 422 semantic - and stay consistent |
| What does `Vary: Accept` do? | Tells caches the representation depends on `Accept` |
| What is a tolerant reader? | Client ignores unknown fields/enum values so additive changes are safe |
| What is `x-` prefix in OpenAPI? | Vendor extensions (valid); but `X-` HTTP headers are deprecated (RFC 6648) |
| Why not expose auto-increment ids? | Enumeration, count leaks, BOLA targets |
| Contract testing vs integration testing? | Contract tests verify interface compatibility per consumer/provider independently, fast and isolated; integration tests exercise whole systems |

## Self-Assessment

- [ ] I can write an OpenAPI 3.1 document with reusable components, oneOf/discriminator, and security schemes
- [ ] I can implement problem-details errors and cursor pagination with SQL
- [ ] I can explain and implement Idempotency-Key semantics end to end
- [ ] I can classify any change as breaking or non-breaking and run a deprecation
- [ ] I can set up Spectral + oasdiff + Schemathesis + Pact in CI
- [ ] I can map OWASP API Top 10 to concrete controls
