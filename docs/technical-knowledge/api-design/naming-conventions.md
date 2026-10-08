---
id: naming-conventions
title: API Naming Conventions & Style Guide
sidebar_label: Naming Conventions
description: Comprehensive REST API naming conventions - URLs, query parameters, JSON fields, headers, enums, IDs, dates, money, operationIds and schema names - compared across Google AIP, Microsoft, Zalando, and Stripe guidelines, with a searchable rule book.
tags:
  - technical-knowledge
  - api-design
  - naming-conventions
  - style-guide
---

import ApiNamingConventionsDiagram from '@site/src/components/ApiNamingConventionsDiagram';

# API Naming Conventions & Style Guide

Naming is the **cheapest-to-get-right, most-expensive-to-fix** part of an API. A bad name is permanent. Pick a documented style guide, encode it as Spectral rules, and never debate it in code review again.

## Searchable Rule Book

<ApiNamingConventionsDiagram />

## 1. URL Design

| Rule | Example | Rationale |
|---|---|---|
| Nouns, not verbs | `GET /orders` not `GET /getOrders` | HTTP method carries the verb |
| Plural collections | `/orders`, `/orders/ord_42` | Uniform shape for list vs item |
| kebab-case | `/shipping-addresses` | Path is case-sensitive; hyphen readable |
| Lowercase only | `/orders` | Avoid `/Orders` vs `/orders` duplicates and cache misses |
| No trailing slash, no extension | `/orders/42` | One canonical URL per resource |
| Identify with stable opaque ids | `/orders/ord_8f3kd92k` | Do not leak sequence/count; prevents enumeration |
| Limit nesting to 2 levels | `/orders/42/items` | Deep paths couple clients to hierarchy |
| Sub-resources only for true composition | `/orders/42/items` ok; `/customers/7/orders` vs `/orders?customerId=7` - prefer the filter | A resource should have ONE canonical location |
| Singleton sub-resource singular | `/users/me/profile`, `/orders/42/cancellation` | Exactly one per parent |
| Version in a single, consistent place | `/v1/...` or header | See [Versioning](./versioning-evolution.md) |

### Non-CRUD Operations (Actions)

REST models state, but real systems have commands. Options, in order of preference:

1. **Model the action as a resource** - `POST /orders/42/cancellations` creates a cancellation (auditable, retrievable, idempotent by key).
2. **Colon custom method (Google AIP-136)** - `POST /orders/42:cancel`. Compact, clearly not CRUD.
3. **State field update** - `PATCH /orders/42` with `{"status":"CANCELLED"}` only when transitions are trivial and validated.
4. **Controller sub-resource verb** - `POST /orders/42/cancel` acceptable if consistent; never `GET` for state changes.

## 2. Query Parameters

| Concern | Convention | Example |
|---|---|---|
| Case | Same as JSON fields (camelCase) | `pageSize`, `createdAfter` |
| Pagination | Cursor: `limit`, `cursor`; or `pageSize`, `pageToken` (AIP-158) | `?limit=25&cursor=eyJpZCI6...` |
| Sorting | Comma list, `-` prefix for desc | `?sort=-createdAt,name` |
| Filtering | Field name = value; range via suffix/prefix | `?status=PAID&createdAfter=...&createdBefore=...` |
| Multi-value | Repeat or comma (document one) | `?status=PAID&status=SHIPPED` |
| Sparse fields | `fields` | `?fields=id,status,total` |
| Expansion | `expand` | `?expand=customer,items.product` |
| Search | `q` | `?q=wireless+headphones` |
| Booleans | `true`/`false` literals | `?includeDeleted=true` |

Reserve these names across **every** API in the company so SDKs and gateways can treat them uniformly.

## 3. JSON Property Naming

| Rule | Good | Avoid |
|---|---|---|
| Choose ONE case org-wide (camelCase default; snake_case if you are Stripe/GitHub-style) | `firstName` | Mixed `first_name` and `lastName` |
| Boolean as predicate | `isActive`, `hasChildren`, `canEdit` | `active`, `flag`, `notDisabled` |
| Timestamps end in `At`, dates in `On` | `createdAt`, `dueOn` | `created`, `date1` |
| Durations include unit or use ISO-8601 | `timeoutSeconds`, `"PT15M"` | `timeout: 30` |
| Arrays plural | `items`, `tags` | `item`, `tagList` |
| Foreign keys end in `Id` | `customerId` | `customer` (ambiguous id vs object) |
| Embedded object vs id | `customer: {id, name}` when expanded | Changing the type of a field between calls |
| Money | `{ "amount": "1999", "currency": "USD" }` or integer minor units | `19.99` float |
| No abbreviations unless universal | `quantity`, `url`, `id` | `qty`, `desc`, `addr1` |
| No redundant prefix | `order.status` | `order.orderStatus` |
| Null vs absent documented | absent = unchanged (PATCH), `null` = clear | Treating them identically |

### Identifiers

| Style | Example | Notes |
|---|---|---|
| Prefixed random | `ord_8f3kd92k` (Stripe) | Self-describing in logs; safe to expose |
| UUIDv4 | `3f2b...` | Opaque; poor B-tree locality as PK |
| UUIDv7 / ULID | `01HV...` | Time-ordered: better index locality, leaks creation time |
| Auto-increment | `12345` | Never expose: enumeration, count leaks, BOLA targets |

Ids are **strings** in JSON even if numeric internally (JavaScript loses precision above 2^53).

### Enums

- Strings in `UPPER_SNAKE_CASE`: `PENDING_PAYMENT` (or lowercase `pending_payment` consistently).
- **Open enum rule:** clients must treat unknown values as "other" - adding a value must not be a breaking change. Declare this in the description.
- Never use ordinal numbers; they cannot be reordered or reused.

## 4. HTTP Headers

| Purpose | Use | Don't |
|---|---|---|
| Idempotency | `Idempotency-Key` (IETF draft) | `X-Idempotency-Token` |
| Tracing | `traceparent`, `tracestate` (W3C) | `X-Request-Trace-Id-V2` |
| Rate limits | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` | Bespoke names per team |
| Deprecation | `Deprecation`, `Sunset` (RFC 8594), `Link: rel="successor-version"` | Docs-only notice |
| Pagination | `Link` header (RFC 8288) or body `nextCursor` | Undocumented `X-Next` |
| Concurrency | `ETag`, `If-Match`, `If-None-Match` | `version` query param |
| Custom headers | Org prefix without `X-` (RFC 6648), e.g. `Acme-Tenant-Id` | `X-` prefix for new headers |

Header names are case-insensitive; docs use Title-Case.

## 5. OpenAPI Document Naming

| Element | Convention | Example |
|---|---|---|
| `operationId` | camelCase `verbNoun`, unique, stable | `listOrders`, `getOrderById`, `cancelOrder` |
| Tags | Resource names, PascalCase/Title | `Orders`, `Shipping Addresses` |
| Schemas | PascalCase nouns with role suffix | `Order`, `CreateOrderRequest`, `UpdateOrderRequest`, `OrderPage`, `ProblemDetail` |
| Parameters (components) | PascalCase | `Limit`, `Cursor`, `IdempotencyKey` |
| Responses (components) | HTTP semantic names | `NotFound`, `Unauthorized`, `ValidationError` |
| Security schemes | camelCase | `bearerAuth`, `oauth2` |
| Files | `openapi.yaml`, split by domain: `orders.openapi.yaml` | Keep one spec per deployable API |

**operationId verbs:** `list` (collection GET), `get` (single), `create` (POST), `replace` (PUT), `update` (PATCH), `delete` (DELETE), then domain verbs (`cancel`, `capture`, `refund`).

## 6. Style Guide Comparison

| Topic | Google AIP | Microsoft REST | Zalando | Stripe |
|---|---|---|---|---|
| Path case | lowerCamelCase collection ids (`userEvents`) | camelCase/kebab | kebab-case | snake_case (`payment_intents`) |
| Property case | camelCase (JSON) | camelCase | snake_case | snake_case |
| Custom methods | `POST /v1/resources/id:verb` | `POST .../action` | sub-resource | `POST /v1/charges/id/capture` |
| Pagination | `pageSize`, `pageToken` | `$top`, `$skip`, `nextLink` | cursor `limit`/`cursor` | `limit`, `starting_after` |
| Errors | `google.rpc.Status` | `error{code,message}` | RFC 7807 problem | `error{type,code,message,param}` |
| Versioning | Major in path, stable | Path or query | Media-type versioning | Date-based header `Stripe-Version` |
| Enums | UPPER_SNAKE | PascalCase string | lower_snake | lowercase_snake |

There is no universal winner; **copy a mature guide, then diverge in writing**, enforcing it with Spectral.

## 7. Spectral Ruleset Example

```yaml
# .spectral.yaml
extends: ["spectral:oas"]
rules:
  paths-kebab-case:
    description: Path segments must be kebab-case
    severity: error
    given: $.paths[*]~
    then:
      function: pattern
      functionOptions:
        match: "^(/([a-z0-9]+(-[a-z0-9]+)*|\\{[a-zA-Z0-9]+\\}))+$"
  property-camel-case:
    description: Schema properties must be camelCase
    severity: error
    given: $..properties[*]~
    then:
      function: casing
      functionOptions: { type: camel }
  operation-id-camel-case:
    severity: error
    given: $.paths[*][*].operationId
    then:
      function: casing
      functionOptions: { type: camel }
  error-responses-problem-json:
    description: 4xx/5xx must use application/problem+json
    severity: warn
    given: $.paths[*][*].responses[?(@property.match(/^[45]/))].content
    then:
      field: application/problem+json
      function: truthy
```

## 8. Naming Review Checklist

- [ ] Every path is a plural noun in kebab-case with at most two levels
- [ ] No verbs in paths except documented custom actions
- [ ] All property names follow one case; booleans are predicates; timestamps end with `At`
- [ ] Ids are opaque strings; enums are strings and open
- [ ] Money, durations, and dates use unambiguous formats
- [ ] `operationId`s are unique, stable, and verb-first
- [ ] Standard parameter names (`limit`, `cursor`, `sort`, `fields`, `expand`) reused
- [ ] Headers use standard names or an org prefix (no `X-`)

Next: [Resource Modeling & HTTP Semantics](./resource-modeling-http-semantics.md).
