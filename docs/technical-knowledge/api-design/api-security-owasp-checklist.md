---
id: api-security-owasp-checklist
title: API Security Checklist (OWASP API Top 10 2023)
sidebar_label: API Security Checklist
description: OWASP API Security Top 10 (2023) mapped to concrete Spring Boot and OpenAPI controls - BOLA, broken authentication, mass assignment, unrestricted resource consumption, SSRF, security misconfiguration, plus OAuth scopes in specs and gateway policy.
tags:
  - technical-knowledge
  - api-design
  - security
  - owasp
---

# API Security Checklist (OWASP API Top 10 - 2023)

Authentication mechanics (OAuth2, JWT, mTLS) live in [API Authentication & Security](../networking/api-authentication-security.md) and [API Security](../security/08-api-security.md). This page maps **design-level** risks to concrete controls and shows how to express them in the OpenAPI contract.

| # | Risk | One-line cause | Primary control |
|---|---|---|---|
| API1 | **Broken Object Level Authorization (BOLA)** | `GET /orders/42` doesn't check that order 42 belongs to the caller | Per-object authorization on every access |
| API2 | Broken Authentication | Weak tokens, no rate limit on login, JWT misvalidation | Standard flows, short-lived tokens, strict validation |
| API3 | Broken Object Property Level Authorization | Excessive data exposure + mass assignment | Explicit DTOs; per-field authorization |
| API4 | Unrestricted Resource Consumption | No limits on size, rate, cost | Quotas, pagination caps, timeouts, cost limits |
| API5 | Broken Function Level Authorization (BFLA) | Regular user can call `/admin/*` | Deny-by-default, role/scope checks per operation |
| API6 | Unrestricted Access to Sensitive Business Flows | Bots abuse purchase/coupon/signup flows | Behavioural limits, device attestation, step-up |
| API7 | Server-Side Request Forgery | API fetches user-supplied URLs | Allow-lists, egress controls |
| API8 | Security Misconfiguration | Open Swagger UI, verbose errors, permissive CORS | Hardened defaults, config-as-code scanning |
| API9 | Improper Inventory Management | Old `/v1` or shadow endpoints still live | API catalog, deprecation, gateway-only exposure |
| API10 | Unsafe Consumption of APIs | Trusting third-party API responses | Validate/limit upstream data, timeouts, TLS |

## API1 - BOLA (the #1 API vulnerability)

```java
// VULNERABLE: authenticated, but any user can read any order by guessing ids
@GetMapping("/orders/{id}")
Order get(@PathVariable String id) { return repo.findById(id).orElseThrow(); }

// FIXED: authorization is part of the query (also avoids loading then checking)
@GetMapping("/orders/{id}")
Order get(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
    return repo.findByIdAndCustomerId(id, jwt.getSubject())
               .orElseThrow(() -> new OrderNotFoundException(id));      // 404, not 403: don't reveal existence
}
```

- Don't rely on unguessable ids as security (they help, but are not authorization).
- Centralise with method security: `@PreAuthorize("@orderAuth.canRead(#id, authentication)")`.
- Multi-tenant: put `tenant_id` in every query (and use Postgres RLS as defence in depth).
- Tests: for every endpoint with an id, test **user A cannot access user B's object** (automated in CI).

## API3 - Mass Assignment & Excessive Data Exposure

```java
// VULNERABLE: binding request JSON directly onto the entity lets clients set role/balance/id
@PutMapping("/users/me")
User update(@RequestBody User body) { return repo.save(body); }

// FIXED: dedicated request DTO with only writable fields; map explicitly
public record UpdateProfileRequest(@Size(max = 80) String displayName, @Email String email) {}

@PutMapping("/users/me")
UserResponse update(@Valid @RequestBody UpdateProfileRequest body, @AuthenticationPrincipal Jwt jwt) {
    return mapper.toResponse(service.updateProfile(jwt.getSubject(), body));
}
```

Never return entities (password hashes, internal flags, other users' PII). Use response DTOs; in OpenAPI mark `readOnly` fields and keep `additionalProperties: false` on **request** schemas so unknown fields are rejected: `spring.jackson.deserialization.fail-on-unknown-properties=true` for requests.

## API4 - Resource Consumption

| Control | Where |
|---|---|
| Request body size limit (`server.tomcat.max-http-form-post-size`, `spring.servlet.multipart.max-file-size`, gateway `client_max_body_size`) | Edge + app |
| `maxItems`, `maxLength`, `maximum` in OpenAPI | Gateway validation + app |
| Page size cap (`limit <= 100`) | App |
| Rate limits per key/user/IP, with burst + sustained | Gateway ([algorithms](../system-design/api-design.md)) |
| Timeouts everywhere (client, server, DB, downstream) | App + infra |
| Query cost limits (GraphQL depth/complexity, batch size, expansion depth) | App |
| Async job quotas, concurrency caps per tenant | App |
| Expensive third-party calls (SMS/email) metered per account | App |

## API5 - Function-Level Authorization in the Contract

```yaml
paths:
  /admin/users/{id}:
    delete:
      operationId: deleteUserAsAdmin
      security:
        - oauth2: [admin:users:delete]       # scope required, enforced by gateway AND service
```

```java
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(a -> a
            .requestMatchers("/actuator/health/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/v1/orders/**").hasAuthority("SCOPE_orders:read")
            .requestMatchers("/api/v1/orders/**").hasAuthority("SCOPE_orders:write")
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().denyAll())                                  // deny by default
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}
```

The scope list in the spec is documentation **and** input for gateway policy generation; keep them identical by testing that every operation in `openapi.yaml` has a `security` entry (Spectral `operation-security-defined`).

## API8 - Misconfiguration Checklist

- [ ] Swagger UI / `/v3/api-docs` / `/actuator/*` not publicly exposed
- [ ] TLS 1.2+ only, HSTS, no HTTP; internal service-to-service via mTLS
- [ ] CORS: explicit origins (no `*` with credentials), explicit methods/headers, `Access-Control-Max-Age` set
- [ ] Generic error messages; no stack traces, SQL, framework banners (`server.error.include-stacktrace=never`)
- [ ] Security headers: `X-Content-Type-Options: nosniff`, `Cache-Control: no-store` on sensitive responses, `Content-Security-Policy` for any HTML
- [ ] Unused HTTP methods disabled (`TRACE`, unneeded `OPTIONS`)
- [ ] Secrets in a vault, not in repo/env dumps/spec examples
- [ ] Dependencies scanned (SCA) and base images patched

## API7 - SSRF

If the API fetches a user-provided URL (webhooks, image import, link previews): resolve DNS yourself, reject private/loopback/link-local/metadata ranges (`169.254.169.254`), restrict schemes (`https`), disable redirects or re-validate each hop, enforce size/time limits, and run from an egress-restricted network segment.

## API9 - Inventory

Maintain an API catalog with owners and lifecycle; enumerate gateway routes vs spec paths and alert on **undocumented routes** (shadow APIs) and **zombie versions**; remove debug/test endpoints before release; expose only through the gateway.

## Security Testing in the Pipeline

| Stage | Tool | Finds |
|---|---|---|
| Lint | Spectral security rules | Missing `security`, `http://` servers, unbounded inputs |
| SAST | Semgrep/CodeQL | Missing authz checks, injection |
| Contract fuzz | Schemathesis | 500s, schema violations, auth bypass hints |
| DAST | OWASP ZAP (import OpenAPI) | Injection, misconfig |
| Authz tests | Custom (two-user BOLA matrix) | API1/API5 |
| Runtime | WAF + anomaly detection on gateway | Abuse, scraping |

Next: [API Design Interview Questions](./api-design-interview-questions.md).
