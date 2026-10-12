---
id: resource-modeling-http-semantics
title: Resource Modeling & HTTP Semantics
sidebar_label: Resource Modeling & HTTP
description: Senior API design - modeling resources from domain use-cases, PUT vs PATCH (merge patch vs JSON Patch), safe and idempotent methods, status code selection, conditional requests with ETag, long-running operations, bulk endpoints, and hypermedia trade-offs.
tags:
  - technical-knowledge
  - api-design
  - rest
  - http
---

# Resource Modeling & HTTP Semantics

## 1. Modeling Resources

**Start from consumer tasks, not tables.** A resource is a *concept clients name*, which may span several tables or be computed.

| Smell | Symptom | Better |
|---|---|---|
| CRUD over tables | `/order_items`, `/order_headers` exposed | One `Order` resource with embedded `items` |
| Chatty clients | Mobile needs 6 calls to render a screen | Embedded/expandable fields, or a BFF ([Backend for Frontend](../system-design/backend-for-frontend.md)) |
| RPC in disguise | `POST /doEverything` | Resources + explicit state transitions |
| God resource | 120-field `User` | Split by lifecycle/ownership: `/users/me/profile`, `/users/me/preferences` |
| Leaky internals | Fields named after columns/ORM entities | Stable domain vocabulary |

### Embedding vs Linking vs Expanding

```
Compact:   { "id": "ord_1", "customerId": "cus_9" }
Expanded:  GET /orders/ord_1?expand=customer
           { "id": "ord_1", "customer": { "id": "cus_9", "name": "Ada" } }
```

Rules: default compact; allow `expand` for named relations (with a depth limit); **never change the type of a field** by context without documenting the union (`string | object`).

## 2. HTTP Method Semantics

| Method | Safe | Idempotent | Cacheable | Typical use |
|---|---|---|---|---|
| GET | Yes | Yes | Yes | Read |
| HEAD | Yes | Yes | Yes | Metadata |
| OPTIONS | Yes | Yes | No | Capabilities / CORS preflight |
| PUT | No | **Yes** | No | Full replace / create at known URL |
| DELETE | No | **Yes** | No | Remove (second call returns 404 or 204 - still idempotent in effect) |
| POST | No | **No** (unless keyed) | Rarely | Create in collection, commands |
| PATCH | No | **No** by definition (can be made so) | No | Partial update |

*Safe* = no observable state change requested. *Idempotent* = N identical requests have the same effect as one. Idempotent does **not** mean same response.

> **Gotcha:** GET with side effects (`GET /unsubscribe?token=`) gets triggered by email scanners, crawlers and prefetchers. Always use POST for state changes.

## 3. PUT vs PATCH

| Aspect | PUT | PATCH (JSON Merge Patch, RFC 7396) | PATCH (JSON Patch, RFC 6902) |
|---|---|---|---|
| Semantics | Replace entire resource | Merge sent fields; `null` deletes | Ordered list of operations |
| Content-Type | `application/json` | `application/merge-patch+json` | `application/json-patch+json` |
| Idempotent | Yes | Yes (usually) | Depends (`add` to array is not) |
| Clear a field | Omit it | `{"nickname": null}` | `{"op":"remove","path":"/nickname"}` |
| Array update | Send entire array | Replaces whole array | Index/`test` ops - fragile under concurrency |
| Pitfall | Lost updates; clients drop unknown fields | Cannot set a field to JSON `null` meaningfully | Index-based paths shift |

```http
PATCH /customers/cus_9 HTTP/1.1
Content-Type: application/merge-patch+json
If-Match: "v7"

{ "phone": "+84901234567", "nickname": null }
```

In Java, distinguish **absent** from **null** (`JsonNullable<T>` from jackson-databind-nullable, or `Optional<Optional<T>>`), otherwise PATCH cannot tell "don't touch" from "clear".

## 4. Choosing Status Codes

| Situation | Code | Notes |
|---|---|---|
| Read OK | 200 | |
| Created | **201** + `Location` header | Return the resource or an empty body |
| Accepted for async processing | **202** + status URL | Not finished; see LRO below |
| Success, no body | 204 | DELETE, PUT/PATCH when not returning the entity |
| Not modified (conditional GET) | 304 | Empty body |
| Malformed syntax, unparseable | 400 | Invalid JSON, wrong type |
| Not authenticated | **401** | Misnamed: means *unauthenticated*; include `WWW-Authenticate` |
| Authenticated, not allowed | **403** | Or 404 to hide existence |
| Not found | 404 | |
| Method not supported on resource | 405 + `Allow` | |
| Not acceptable media type | 406 | `Accept` mismatch |
| Conflict with current state | **409** | Duplicate, illegal transition, idempotency-key payload mismatch |
| Precondition failed | **412** | `If-Match` ETag mismatch |
| Unsupported media type | 415 | |
| Semantic validation error | **422** (or 400 - choose and be consistent) | Field-level errors in problem body |
| Precondition required | **428** | Require `If-Match` on updates |
| Too many requests | **429** + `Retry-After` | |
| Server bug | 500 | Never leak stack traces |
| Bad upstream | 502 / 504 | |
| Overloaded / maintenance | 503 + `Retry-After` | |

**400 vs 422:** pick one rule - "400 = request could not be parsed; 422 = parsed but violates business/validation rules" is common and precise.

## 5. Conditional Requests & Optimistic Concurrency

```http
GET /orders/ord_1            ->  200  ETag: "v7"
PUT /orders/ord_1  If-Match: "v7"      ->  200 (new ETag "v8")
PUT /orders/ord_1  If-Match: "v7"      ->  412 Precondition Failed   (someone else updated)
GET /orders/ord_1  If-None-Match: "v8" ->  304 Not Modified  (saves bandwidth)
```

ETag sources: DB row `version` column (JPA `@Version`), a content hash, or `updatedAt` at ms precision. Use **strong** ETags for concurrency and require them with `428`.

```java
@PutMapping("/{id}")
public ResponseEntity<OrderResponse> replace(@PathVariable String id,
        @RequestHeader(value = "If-Match", required = false) String ifMatch,
        @Valid @RequestBody ReplaceOrderRequest body) {
    if (ifMatch == null) {
        throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED, "If-Match header required");
    }
    OrderResponse updated = service.replace(id, parseVersion(ifMatch), body); // throws on mismatch -> 412
    return ResponseEntity.ok().eTag("\"" + updated.version() + "\"").body(updated);
}
```

## 6. Long-Running Operations (LRO)

Never hold an HTTP request open for minutes (gateway/LB timeouts at 30-60 s, thread exhaustion).

```
POST /reports                         -> 202 Accepted
                                          Location: /operations/op_77
                                          Retry-After: 5
GET  /operations/op_77                -> 200 { "status": "RUNNING", "progressPercent": 40 }
GET  /operations/op_77                -> 200 { "status": "SUCCEEDED", "resultUrl": "/reports/rep_5" }
                                          (or 303 See Other -> /reports/rep_5)
DELETE /operations/op_77              -> cancel (best-effort)
```

Operation resource fields: `id`, `status` (`PENDING|RUNNING|SUCCEEDED|FAILED|CANCELLED`), `createdAt`, `error` (problem object), `result`. Alternative: push completion via a [signed webhook](./reliability-idempotency-webhooks.md). Store operations durably (DB/outbox), not in memory, so they survive restarts.

## 7. Bulk & Batch APIs

| Approach | Example | Trade-off |
|---|---|---|
| Native batch endpoint | `POST /orders:batchCreate` with `items[]` | Efficient; define partial-failure semantics |
| JSON:API/OData `$batch` | Multipart of sub-requests | Complex, hard to cache |
| Client-side concurrency | Many single calls | Simple; subject to rate limits |

**Partial failure contract:** return `207 Multi-Status`-style body (per-item status) or all-or-nothing with 422 - state which in the spec. Cap batch size (`maxItems: 100`). Each item needs its own idempotency key or the batch gets one key with deterministic per-item keys.

## 8. Hypermedia (HATEOAS) - Pragmatic View

| Level | Meaning | Reality |
|---|---|---|
| 0 | One endpoint, RPC | SOAP-style |
| 1 | Resources | Most "REST" APIs |
| 2 | HTTP verbs + status codes | The practical target |
| 3 | Hypermedia controls (links) | Valuable for workflow-driven APIs (payments next-actions, pagination `next` links); rarely worth it for CRUD |

Use links where the server must steer the client (state machines: `_links.cancel` present only if cancellable) and for pagination. Don't build a full HAL/Siren client unless consumers genuinely follow links.

## 9. Content Negotiation & Compression

- `Accept` / `Content-Type` for format and versioned media types (`application/vnd.acme.order.v2+json`).
- `Accept-Encoding: gzip, br`: compress JSON (typically 70-90%); avoid compressing responses containing secrets reflected from the request (BREACH).
- `Vary: Accept, Accept-Encoding` so shared caches key correctly.

## 10. Caching

| Header | Use |
|---|---|
| `Cache-Control: private, max-age=60` | Per-user data |
| `Cache-Control: public, max-age=300, stale-while-revalidate=60` | Shared reference data |
| `Cache-Control: no-store` | Sensitive data (tokens, PII) |
| `ETag` + `If-None-Match` | Cheap revalidation |
| `Vary: Authorization` | Prevent cross-user cache poisoning on shared caches |

Next: [Errors, Pagination & Filtering](./errors-pagination-filtering.md).
