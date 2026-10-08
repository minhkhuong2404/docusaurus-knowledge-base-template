---
id: openapi-swagger-fundamentals
title: OpenAPI & Swagger Fundamentals
sidebar_label: OpenAPI & Swagger
description: Deep dive into the OpenAPI 3.x specification - document structure, components, JSON Schema 3.1, polymorphism with oneOf and discriminator, security schemes, callbacks and webhooks, Swagger UI/Editor/Codegen tooling, and common spec pitfalls.
tags:
  - technical-knowledge
  - api-design
  - openapi
  - swagger
---

# OpenAPI & Swagger Fundamentals

## 1. Swagger 2.0 vs OpenAPI 3.0 vs 3.1

| Feature | Swagger 2.0 | OAS 3.0 | OAS 3.1 |
|---|---|---|---|
| Server definition | `host`, `basePath`, `schemes` | `servers[]` with variables | same |
| Request body | `in: body` parameter | `requestBody` with per-media-type schema | same |
| Reusable pieces | `definitions`, `parameters`, `responses` | `components/*` (schemas, parameters, responses, examples, headers, securitySchemes, links, callbacks) | adds `pathItems` |
| Nullable | `x-nullable` vendor ext. | `nullable: true` | `type: ["string","null"]` (JSON Schema) |
| Polymorphism | `allOf` + `discriminator` | `oneOf`/`anyOf`/`allOf` + `discriminator` | same |
| Callbacks / Webhooks | - | `callbacks` | top-level `webhooks` |
| JSON Schema | Subset draft 4 | Modified subset draft 5 | **Full 2020-12** |
| Auth | basic, apiKey, oauth2 | + `http` (bearer), `openIdConnect` | + `mutualTLS` |

**Choose 3.1** for new APIs; check your generators (some still lag on 3.1 - verify before standardising).

## 2. Anatomy of an OpenAPI Document

```yaml
openapi: 3.1.0
info:
  title: Orders API
  version: 1.4.0                # version of YOUR API, not of OpenAPI
  description: Order lifecycle for the Checkout domain.
  contact: { name: Checkout Team, email: checkout@example.com }
  license: { name: Apache-2.0, identifier: Apache-2.0 }
servers:
  - url: https://api.example.com/{basePath}
    variables:
      basePath: { default: v1 }
tags:
  - name: Orders
    description: Create and manage orders
paths:
  /orders:
    get:
      operationId: listOrders
      summary: List orders
      tags: [Orders]
      parameters:
        - $ref: '#/components/parameters/Limit'
        - $ref: '#/components/parameters/Cursor'
        - name: status
          in: query
          schema: { $ref: '#/components/schemas/OrderStatus' }
      responses:
        '200':
          description: A page of orders
          headers:
            X-RateLimit-Remaining: { schema: { type: integer } }
          content:
            application/json:
              schema: { $ref: '#/components/schemas/OrderPage' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '429': { $ref: '#/components/responses/TooManyRequests' }
    post:
      operationId: createOrder
      summary: Create an order
      tags: [Orders]
      parameters:
        - name: Idempotency-Key
          in: header
          required: true
          schema: { type: string, maxLength: 64 }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CreateOrderRequest' }
            examples:
              basic:
                value: { customerId: cus_91, items: [{ sku: SKU-1, quantity: 2 }] }
      responses:
        '201':
          description: Created
          headers:
            Location: { schema: { type: string, format: uri } }
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Order' }
        '409': { $ref: '#/components/responses/Conflict' }
        '422': { $ref: '#/components/responses/ValidationError' }
  /orders/{orderId}:
    parameters:
      - name: orderId
        in: path
        required: true
        schema: { type: string, pattern: '^ord_[A-Za-z0-9]{8,}$' }
    get:
      operationId: getOrderById
      tags: [Orders]
      responses:
        '200':
          description: The order
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Order' }
        '404': { $ref: '#/components/responses/NotFound' }
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/authorize
          tokenUrl: https://auth.example.com/token
          scopes:
            orders:read: Read orders
            orders:write: Create and modify orders
  parameters:
    Limit: { name: limit, in: query, schema: { type: integer, minimum: 1, maximum: 100, default: 25 } }
    Cursor: { name: cursor, in: query, schema: { type: string } }
  schemas:
    OrderStatus:
      type: string
      enum: [PENDING_PAYMENT, PAID, SHIPPED, CANCELLED]
    Order:
      type: object
      required: [id, status, createdAt]
      properties:
        id: { type: string, readOnly: true, examples: [ord_8f3kd92k] }
        status: { $ref: '#/components/schemas/OrderStatus' }
        createdAt: { type: string, format: date-time, readOnly: true }
    OrderPage:
      type: object
      required: [items]
      properties:
        items: { type: array, items: { $ref: '#/components/schemas/Order' } }
        nextCursor: { type: [string, 'null'] }
  responses:
    NotFound:
      description: Resource not found
      content:
        application/problem+json:
          schema: { $ref: '#/components/schemas/ProblemDetail' }
security:
  - bearerAuth: []
```

### Key Objects

| Object | Purpose | Senior note |
|---|---|---|
| `operationId` | Unique id; becomes SDK method name | Never auto-generate from class names; renaming it is a breaking SDK change |
| `parameters` (`path`/`query`/`header`/`cookie`) | Inputs with `style` and `explode` | Arrays: `style: form, explode: true` gives `?id=1&id=2` |
| `requestBody` | Per media type schema | Document `application/json` AND error `application/problem+json` |
| `responses` | Status -> content/headers/links | Always include default error and 401/403/429 where applicable |
| `components` | Reuse | Anything used twice belongs here |
| `security` | Global/operation-level requirements | `security: []` on an operation explicitly makes it public |
| `x-*` | Vendor extensions | Useful (`x-internal`, `x-codegen-*`) but tool-specific |

## 3. Schemas (JSON Schema 2020-12 in OAS 3.1)

```yaml
Money:
  type: object
  required: [amount, currency]
  properties:
    amount:   { type: string, pattern: '^-?\d+(\.\d{1,8})?$', description: Decimal as string }
    currency: { type: string, pattern: '^[A-Z]{3}$', description: ISO 4217 }
  additionalProperties: false
```

| Keyword | Meaning | Gotcha |
|---|---|---|
| `required` | Property MUST be present | Lives on the parent object, not the property |
| `nullable` (3.0) vs `type: [x, "null"]` (3.1) | Value may be null | Null is distinct from absent |
| `readOnly` / `writeOnly` | Only in responses / only in requests | Many validators ignore; prefer separate request/response schemas |
| `additionalProperties: false` | Reject unknown fields | Hurts forward compatibility for **responses**; fine for requests |
| `format` | Hint (`date-time`, `uuid`, `int64`, `uri`) | Annotation only unless validator enforces it |
| `example` / `examples` | Documentation and mock data | 3.1 prefers `examples` (array) |
| `minimum`, `maxLength`, `pattern`, `enum` | Validation | Put limits in the spec so gateways can reject early |
| `default` | Server applies if omitted | Not "client sends this" |

### Composition & Polymorphism

```yaml
Payment:
  oneOf:
    - $ref: '#/components/schemas/CardPayment'
    - $ref: '#/components/schemas/BankTransferPayment'
  discriminator:
    propertyName: type
    mapping:
      CARD: '#/components/schemas/CardPayment'
      BANK_TRANSFER: '#/components/schemas/BankTransferPayment'
CardPayment:
  allOf:
    - $ref: '#/components/schemas/PaymentBase'
    - type: object
      required: [type, last4]
      properties:
        type: { type: string, const: CARD }
        last4: { type: string, pattern: '^\d{4}$' }
```

- `allOf` = inheritance/mixins (all must match). `oneOf` = exactly one. `anyOf` = at least one.
- `discriminator` is an optimisation/hint for code generators and validators, so they pick the subtype by the `type` property instead of trying every branch.
- **Pitfall:** `oneOf` with overlapping branches (both match) is invalid - make branches mutually exclusive via `const`/required fields.
- **Client compatibility:** adding a new subtype is a *breaking change* for clients with exhaustive deserialisers; document that clients must handle unknown discriminator values.

## 4. Security Schemes

| Type | Spec fragment | Use |
|---|---|---|
| API key | `type: apiKey, in: header, name: X-API-Key` | Server-to-server identification (not strong auth) |
| HTTP bearer | `type: http, scheme: bearer, bearerFormat: JWT` | Access tokens |
| OAuth 2.0 | flows: `authorizationCode`, `clientCredentials`, `implicit` (deprecated), `password` (deprecated) | Scopes per operation |
| OpenID Connect | `type: openIdConnect, openIdConnectUrl: .../.well-known/openid-configuration` | Discovery |
| mTLS (3.1) | `type: mutualTLS` | Service mesh/B2B |

Apply per operation with scopes: `security: [{ oauth2: [orders:write] }]`. Remember: the spec **documents** security; it does not enforce it.

## 5. Links, Callbacks & Webhooks

```yaml
paths:
  /subscriptions:
    post:
      callbacks:
        onPaymentFailed:
          '{$request.body#/callbackUrl}':
            post:
              requestBody:
                content:
                  application/json:
                    schema: { $ref: '#/components/schemas/PaymentFailedEvent' }
              responses:
                '204': { description: Acknowledged }
webhooks:                          # OAS 3.1: events not tied to a prior request
  order.shipped:
    post:
      requestBody:
        content:
          application/json:
            schema: { $ref: '#/components/schemas/OrderShippedEvent' }
      responses:
        '200': { description: Acknowledged }
```

For event-driven/async protocols (Kafka, MQTT, WebSocket) use **AsyncAPI**, the sibling spec; see [Reliability: Idempotency, Concurrency & Webhooks](./reliability-idempotency-webhooks.md).

## 6. The Tooling Landscape

| Tool | Purpose | Notes |
|---|---|---|
| **Swagger UI** | Interactive docs + "Try it out" | Executes real calls from the browser (CORS needed); disable or protect in production |
| **Swagger Editor** | Browser spec editor with live validation | Good for learning; use IDE + linters for teams |
| **Swagger Codegen / OpenAPI Generator** | Server stubs and client SDKs in 50+ languages | OpenAPI Generator is the more active community fork |
| **Redoc / Scalar / Stoplight Elements** | Beautiful read-only portals | Better than Swagger UI for public docs |
| **Spectral** | Spec linting with custom rulesets | CI gate |
| **oasdiff / openapi-diff** | Breaking-change detection | CI gate |
| **Prism / WireMock / Microcks** | Mock and validating proxy | Parallel development |
| **Schemathesis / Dredd** | Contract / property-based API testing | Finds 500s and schema violations |
| **springdoc-openapi, FastAPI, NestJS Swagger, tsoa** | Code-first generation | See [Spring Boot + springdoc](./spring-boot-springdoc-openapi.md) |

> **Production gotcha:** exposing `/swagger-ui` and `/v3/api-docs` on public production endpoints discloses your full attack surface (hidden/internal endpoints, parameter names, schemas). Gate behind authentication, an internal network, or publish a **sanitised** spec (`x-internal` filtering) instead.

## 7. Common Spec Pitfalls

| Pitfall | Effect | Fix |
|---|---|---|
| Missing `required` arrays | Generated clients treat everything as optional/nullable | Declare required properties explicitly |
| Same schema for request and response | `id` and `createdAt` show up as writable | Separate `CreateX`/`UpdateX`/`X` schemas |
| Free-form `type: object` | No validation, `Map<String,Object>` in SDKs | Define properties or `additionalProperties` schema |
| Inline duplicated error bodies | Drift between endpoints | `components/responses` |
| Unbounded strings/arrays | DoS vectors, no gateway validation | `maxLength`, `maxItems`, `maximum` |
| Examples not matching schema | Broken mocks/docs | Validate examples in CI (Spectral `oas3-valid-schema-example`) |
| Spec says `200`, server returns `201` | Contract drift | Contract tests (Schemathesis) |
| Enum closed in response | New value crashes clients | Document "unknown values must be tolerated" |

Next: [Spring Boot + springdoc-openapi](./spring-boot-springdoc-openapi.md).
