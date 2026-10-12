---
id: errors-pagination-filtering
title: Errors, Pagination, Filtering & Rate-Limit Headers
sidebar_label: Errors & Pagination
description: Production-grade API error design with RFC 9457 problem details, offset vs keyset cursor pagination with SQL, sorting and filtering, sparse fieldsets, and rate-limit headers, with Spring Boot code.
tags:
  - technical-knowledge
  - api-design
  - errors
  - pagination
---

# Errors, Pagination, Filtering & Rate-Limit Headers

## 1. Error Model: RFC 9457 Problem Details

RFC 9457 (obsoletes RFC 7807) standardises `application/problem+json`:

```json
{
  "type": "https://api.example.com/problems/insufficient-funds",
  "title": "Insufficient funds",
  "status": 422,
  "detail": "Account acc_1 has 20.00 USD available; 35.00 USD required.",
  "instance": "/payments/pay_77",
  "code": "INSUFFICIENT_FUNDS",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "errors": [
    { "pointer": "/amount", "message": "must be <= available balance" }
  ]
}
```

| Member | Purpose | Rule |
|---|---|---|
| `type` | URI identifying the problem class (documentation link) | Stable; clients switch on this or `code`, never on `title`/`detail` |
| `title` | Short human summary | Same for every instance of the type |
| `status` | HTTP status | Mirrors the response status |
| `detail` | Instance-specific explanation | Safe for display; **no secrets, SQL, stack traces** |
| `instance` | URI of this occurrence | Optional |
| Extensions | `code`, `traceId`, `errors[]` | Document in the spec; additive only |

### Design Principles

1. **One envelope everywhere** (gateway-generated errors too, e.g. 401/429/502).
2. **Machine-readable `code`** (`UPPER_SNAKE`) distinct from message; messages can be localised, codes cannot.
3. **Field errors as a list** with JSON Pointer (`/items/0/quantity`) so UIs can highlight inputs.
4. **Include a correlation id** (`traceId`) that matches your logs/traces; support will ask for it.
5. **Never leak internals:** 500 body is generic; details go to logs.
6. **Retry guidance:** `Retry-After` for 429/503; document which codes are retryable.
7. **Security:** same 404 for "doesn't exist" and "not yours" when existence is sensitive; uniform timing and message for login failures.

### Spring Boot 3 Implementation

```java
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    public record FieldProblem(String pointer, String message) {}

    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail notFound(OrderNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setType(URI.create("https://api.example.com/problems/order-not-found"));
        pd.setTitle("Order not found");
        pd.setProperty("code", "ORDER_NOT_FOUND");
        return pd;
    }

    @Override
    protected org.springframework.http.ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, org.springframework.http.HttpHeaders headers,
            org.springframework.http.HttpStatusCode status, org.springframework.web.context.request.WebRequest request) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        pd.setType(URI.create("https://api.example.com/problems/validation-failed"));
        pd.setTitle("Validation failed");
        List<FieldProblem> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> new FieldProblem("/" + fe.getField().replace('.', '/'), fe.getDefaultMessage()))
            .toList();
        pd.setProperty("code", "VALIDATION_FAILED");
        pd.setProperty("errors", errors);
        return org.springframework.http.ResponseEntity.unprocessableEntity().body(pd);
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception ex) {
        // log with traceId here; return nothing sensitive
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error");
        pd.setProperty("code", "INTERNAL_ERROR");
        return pd;
    }
}
// application.yml: spring.mvc.problemdetails.enabled: true  (RFC 9457 for built-in Spring exceptions)
```

## 2. Pagination

| Strategy | Request | Strengths | Weaknesses |
|---|---|---|---|
| **Offset/limit** | `?offset=40&limit=20` or `?page=3&size=20` | Simple, random access, total pages | `OFFSET N` scans and discards N rows (O(N)); duplicates/skips when data changes between pages |
| **Keyset / seek (cursor)** | `?limit=20&cursor=<opaque>` | O(log n) with index; stable under inserts | No random page jump; needs deterministic sort with unique tiebreaker |
| **Time/ID range** | `?createdBefore=...` | Easy for feeds | Ties on identical timestamps |
| **Token-based (opaque)** | `pageToken` | Server free to change internals; can encode filter/sort snapshot | Tokens expire; can't build "page 7" links |

### Why OFFSET Degrades

```sql
-- Page 50,000 of size 20: DB reads and throws away 1,000,000 rows
SELECT id, created_at, total FROM orders ORDER BY created_at DESC, id DESC LIMIT 20 OFFSET 1000000;

-- Keyset: seeks directly using the (created_at, id) index
SELECT id, created_at, total
FROM orders
WHERE (created_at, id) < (:lastCreatedAt, :lastId)
ORDER BY created_at DESC, id DESC
LIMIT 21;                -- fetch limit+1 to know if another page exists
-- index: CREATE INDEX idx_orders_created_id ON orders (created_at DESC, id DESC);
```

Rules for keyset:
- Sort key must be **total order**: add `id` as tiebreaker.
- Encode the cursor as opaque base64 of `{createdAt, id, sortSignature}`; **sign or validate** it (tampering must not enable SQL injection or cross-tenant reads).
- Cursor includes the filter/sort hash so a cursor from one query can't be reused with another.
- Fetch `limit + 1` rows to compute `hasMore` without a `COUNT(*)`.

### Response Shape

```json
{
  "items": [ { "id": "ord_9" }, { "id": "ord_8" } ],
  "page": { "limit": 2, "nextCursor": "eyJjIjoiMjAyNS0wMy0wMVQxMDoxNTozMFoiLCJpIjoib3JkXzgifQ", "hasMore": true }
}
```

Optionally add `Link: <...?cursor=...>; rel="next"` (RFC 8288). Offer `totalCount` only when cheap (it forces `COUNT(*)`; on huge tables return an estimate or omit).

```java
public record Page<T>(List<T> items, String nextCursor, boolean hasMore) {}

public Page<OrderResponse> list(int limit, String cursor) {
    int capped = Math.min(Math.max(limit, 1), 100);
    CursorKey key = cursor == null ? null : cursorCodec.decode(cursor);   // verifies HMAC
    List<OrderRow> rows = repo.findPage(key, capped + 1);
    boolean hasMore = rows.size() > capped;
    List<OrderRow> pageRows = hasMore ? rows.subList(0, capped) : rows;
    String next = hasMore ? cursorCodec.encode(CursorKey.from(pageRows.get(pageRows.size() - 1))) : null;
    return new Page<>(pageRows.stream().map(OrderResponse::from).toList(), next, hasMore);
}
```

## 3. Sorting & Filtering

| Need | Convention | Security note |
|---|---|---|
| Sort | `sort=-createdAt,name` | **Allow-list** sortable fields; map to column names yourself |
| Equality filter | `status=PAID` | Validate against enum |
| Range | `createdAfter`, `createdBefore` (RFC 3339) or `amount[gte]=10` | Bound ranges to avoid full scans |
| Multi-value | `status=PAID,SHIPPED` | Cap list size |
| Full-text | `q=` | Delegate to search engine; paginate by cursor too |
| Complex | RSQL/OData `$filter`, GraphQL | Cost-limit queries; indexes must exist for each allowed filter |

Every filterable/sortable field needs a supporting index and a documented maximum; otherwise a single ad-hoc query takes the database down. Prefer a small set of well-indexed filters over a generic query language.

## 4. Sparse Fieldsets & Expansion

`fields=id,status,total` reduces payload and joins; `expand=customer` opts into heavier loads. Enforce an allow-list and a maximum expansion depth (usually 2) to prevent N+1 explosions and accidental data exposure.

## 5. Rate Limit Headers

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 37
RateLimit-Reset: 22          # seconds until the window resets (IETF draft: delta, not epoch)

HTTP/1.1 429 Too Many Requests
Retry-After: 22
Content-Type: application/problem+json
```

Document quotas per plan, scope (per key, per user, per IP), and algorithm ([Rate Limiting Algorithms](../system-design/api-design.md)). Clients should use **exponential backoff with jitter** and honour `Retry-After`. Return limits on every response so clients can self-throttle.

## 6. Checklist

- [ ] All errors (including gateway) use one Problem Details shape with stable `code`
- [ ] Validation errors list JSON Pointers
- [ ] Lists default to keyset/cursor pagination with a max `limit`
- [ ] Sort/filter fields allow-listed, indexed, documented
- [ ] No `COUNT(*)` on hot list endpoints by default
- [ ] 429/503 carry `Retry-After`; rate-limit headers on success
- [ ] Error responses are in the OpenAPI spec as reusable `components/responses`

Next: [Versioning & Evolution](./versioning-evolution.md).
