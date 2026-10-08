---
id: contract-governance-testing
title: API Contract Governance, Linting & Testing
sidebar_label: Governance & Testing
description: Run an API program at scale - design-first vs code-first, Spectral linting, oasdiff breaking-change gates, Prism mocks, OpenAPI Generator interfaces, Pact consumer-driven contracts, Schemathesis fuzzing, CI pipeline, API catalog and review process.
tags:
  - technical-knowledge
  - api-design
  - governance
  - testing
  - openapi
---

import OpenApiLifecycleDiagram from '@site/src/components/OpenApiLifecycleDiagram';

# API Contract Governance, Linting & Testing

Once more than one team consumes an API, "documentation" is not enough - you need **automated enforcement** of the contract.

## 1. Pipeline

<OpenApiLifecycleDiagram />

## 2. Design-First vs Code-First vs Hybrid

| Dimension | Design-first | Code-first | Hybrid (recommended for platforms) |
|---|---|---|---|
| Source of truth | Hand-written OpenAPI | Annotations/code | Spec for **new/changed** APIs; generated spec snapshot for legacy |
| Review | Contract reviewed by consumers before coding | After implementation | Both |
| Drift | Prevented (generated interfaces + tests) | Likely without snapshot tests | Controlled by CI diff |
| Tooling | OpenAPI Generator, Prism, Spectral | springdoc, FastAPI, NestJS | Both |
| Weakness | Spec writing skill; YAML noise | Accidental breaking changes, poor descriptions | Process discipline |

Choose by **blast radius**: public/partner/cross-team APIs -> design-first; single-team internal service -> code-first with a committed spec snapshot.

## 3. Spec Layout & Reuse

```
api/
  openapi.yaml              # root: info, servers, paths via $ref, security
  paths/orders.yaml
  components/
    schemas/Order.yaml
    parameters/Pagination.yaml
    responses/Errors.yaml
  .spectral.yaml
  CHANGELOG.md              # generated from oasdiff
```

Bundle for tooling: `redocly bundle api/openapi.yaml -o dist/openapi.yaml`. Share common components (Problem, pagination, security) via a **shared library repo** referenced by version tag so all APIs stay consistent.

## 4. Linting with Spectral

```bash
spectral lint api/openapi.yaml --ruleset .spectral.yaml --format junit --fail-severity error
```

Rule categories to enforce (see ruleset in [Naming Conventions](./naming-conventions.md)):

| Category | Examples |
|---|---|
| Naming | kebab paths, camelCase properties, `operationId` camelCase |
| Completeness | description on every operation/parameter, examples present, tags set, `servers` defined |
| Safety | `maxLength`/`maxItems`/`maximum` on inputs, security defined (global or per op), no `http://` servers |
| Consistency | 4xx/5xx use `application/problem+json`, pagination params standard, `Idempotency-Key` on unsafe POSTs |
| Hygiene | unused components, duplicate `operationId`, examples validate against schemas |

## 5. Breaking-Change Detection

```bash
git show origin/main:api/openapi.yaml > /tmp/base.yaml
oasdiff breaking /tmp/base.yaml api/openapi.yaml --fail-on ERR       # fails CI on breaking changes
oasdiff changelog /tmp/base.yaml api/openapi.yaml --format markdown   # PR comment / CHANGELOG
```

Escape hatch: breaking changes require a major version bump or an explicit, time-boxed waiver label reviewed by the API guild. Remember tools only catch **structural** breaks - semantic changes (meaning, default sort, rounding) need human review.

## 6. Mocking for Parallel Work

```bash
prism mock api/openapi.yaml -p 4010 --dynamic       # random valid data from schemas
prism proxy api/openapi.yaml https://staging.example.com --errors   # validates real traffic vs the contract
```

Good `examples` in the spec make mocks useful (return realistic values; include edge cases like empty lists and error bodies).

## 7. Server Stubs & Client SDKs

```bash
# Spring server interfaces (controllers implement generated interfaces; the compiler enforces the contract)
openapi-generator-cli generate -g spring -i api/openapi.yaml -o build/generated \
  --additional-properties=interfaceOnly=true,useSpringBoot3=true,useTags=true,documentationProvider=none,openApiNullable=false

# Typed TypeScript client
openapi-generator-cli generate -g typescript-fetch -i api/openapi.yaml -o clients/ts
```

```java
// Generated: interface OrdersApi { ResponseEntity<Order> getOrderById(String orderId); ... }
@RestController
public class OrdersController implements OrdersApi {
    @Override
    public ResponseEntity<Order> getOrderById(String orderId) { /* implement */ return null; }
}
```

Pitfalls: generated code is **not** a place for hand edits; commit templates/config not output (or publish SDKs as artifacts); pin generator versions (output changes between releases); review naming of generated models (`oneOf` quirks).

## 8. Testing the Contract

| Layer | Tool | What it proves |
|---|---|---|
| **Provider conformance** | Schemathesis, Dredd, RestAssured + `openapi-validator` | Real responses match the schema/status codes; no 500s on valid/invalid input (property-based fuzzing) |
| **Consumer-driven contracts** | Pact (broker + `can-i-deploy`) | Provider changes don't break what consumers actually use |
| **Schema validation in unit tests** | Atlassian `swagger-request-validator` | Controller IO validated against spec in `MockMvc` tests |
| **Compatibility** | oasdiff | Spec-to-spec backward compatibility |
| **Security** | OWASP ZAP/API scanning with the spec as input, Schemathesis auth tests | Broken auth, injection, BOLA candidates |
| **Performance** | k6/Gatling generated from the spec | SLO regression |

```bash
schemathesis run api/openapi.yaml --base-url http://localhost:8080 \
  --checks all --hypothesis-max-examples 200 --header "Authorization: Bearer $TOKEN"
```

```java
// Response validation in a Spring test with swagger-request-validator-mockmvc
private final OpenApiValidationMatchers openApi = OpenApiValidationMatchers.openApi().isValid("api/openapi.yaml");

@Test
void getOrderMatchesContract() throws Exception {
    mvc.perform(get("/api/v1/orders/ord_1")).andExpect(status().isOk()).andExpect(openApi.isValid("api/openapi.yaml"));
}
```

### Pact in 5 Lines of Theory

Consumer tests record "when I call X I expect Y" into a pact file -> published to a broker -> provider CI replays pacts against the real service -> `can-i-deploy` gates release if any consumer pact would break. It captures **actual usage**, so providers may freely change what no consumer uses.

## 9. CI Pipeline Example (GitHub Actions)

```yaml
name: api-contract
on: [pull_request]
jobs:
  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Lint
        run: npx @stoplight/spectral-cli lint api/openapi.yaml --fail-severity error
      - name: Breaking changes
        run: |
          git show origin/main:api/openapi.yaml > base.yaml
          docker run --rm -v "$PWD":/w -w /w tufin/oasdiff breaking base.yaml api/openapi.yaml --fail-on ERR
      - name: Generate server interfaces & compile
        run: ./mvnw -q -Pgenerate-api verify
      - name: Provider contract fuzz
        run: |
          ./mvnw -q spring-boot:start
          pipx run schemathesis run api/openapi.yaml --base-url http://localhost:8080 --checks all
```

## 10. Organisational Governance

| Practice | Detail |
|---|---|
| **API style guide** | One document, versioned, enforced by Spectral; exceptions are explicit |
| **API guild / review board** | Lightweight review for new public APIs (design review in PR, 48h SLA) - enable, don't gate |
| **API catalog** | Backstage/Apicurio/Postman: owner, lifecycle (`experimental` -> `beta` -> `stable` -> `deprecated`), SLO, docs, spec link |
| **Lifecycle labels** | `x-lifecycle`, stability promises per label |
| **Ownership** | Every API has a team, on-call, and a deprecation owner |
| **Telemetry** | Per-endpoint/client usage, error rate, latency; drives deprecation decisions |
| **Developer portal** | Redoc/Scalar docs, runnable examples, SDKs, changelog, status page |
| **Security gates** | Spec-driven authz review (scopes per operation), gateway policies generated from spec |

## 11. Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Spec generated at runtime only; nobody reviews diffs | Commit snapshot + CI diff |
| Spec lies (200 documented, 201 returned) | Conformance fuzzing |
| One mega-spec for 40 services | One spec per deployable API; shared components repo |
| Governance by committee that blocks delivery | Automated rules + self-service + opt-in review |
| SDK generation copied into repo and edited | Regenerate in CI; extend via wrappers |
| Mocks drifting from reality | Prism proxy/validation mode in staging |

Next: [API Security Checklist (OWASP API Top 10)](./api-security-owasp-checklist.md).
