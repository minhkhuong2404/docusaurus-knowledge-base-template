---
id: intro
title: API Design, OpenAPI & Swagger Deep Dive
sidebar_label: Introduction
description: Senior-level API design handbook - OpenAPI/Swagger, contract-first workflow, naming conventions, resource modeling, errors, pagination, versioning, idempotency, security, governance and interview preparation.
tags:
  - technical-knowledge
  - api-design
  - openapi
  - swagger
  - intro
---

import OpenApiLifecycleDiagram from '@site/src/components/OpenApiLifecycleDiagram';

# API Design, OpenAPI & Swagger Deep Dive

> An API is a **long-lived public contract**. Code can be refactored tomorrow; a published field name lives for years because every consumer you cannot see has coded against it. Senior API design is mostly about *evolvability, consistency and failure semantics*, not about picking GET vs POST.

This group complements the broader [API Design - REST, gRPC & GraphQL](../system-design/api-design.md) overview and the [API Authentication & Security](../networking/api-authentication-security.md) page with the contract tooling (OpenAPI / Swagger), style guide and governance layer.

## The Contract Lifecycle

<OpenApiLifecycleDiagram />

## Reading Order

| # | Page | You will learn |
|---|---|---|
| 1 | [OpenAPI & Swagger Fundamentals](./openapi-swagger-fundamentals.md) | Swagger vs OpenAPI history, document anatomy, schemas, `oneOf`/`discriminator`, security schemes, webhooks, tooling |
| 2 | [Spring Boot + springdoc-openapi](./spring-boot-springdoc-openapi.md) | Generating specs from code, annotations, groups, security, polymorphism, `Pageable`, pitfalls |
| 3 | [Naming Conventions](./naming-conventions.md) | URLs, query params, JSON fields, headers, enums, operationIds, schema names, with a searchable rule book |
| 4 | [Resource Modeling & HTTP Semantics](./resource-modeling-http-semantics.md) | Resource design, custom actions, PUT vs PATCH, conditional requests, long-running operations, bulk APIs |
| 5 | [Errors, Pagination & Filtering](./errors-pagination-filtering.md) | RFC 9457 problem details, keyset vs offset pagination (with SQL), sorting, sparse fields, rate-limit headers |
| 6 | [Versioning & Evolution](./versioning-evolution.md) | Breaking-change catalog, versioning strategies, deprecation/Sunset, expand-contract, tolerant reader |
| 7 | [Reliability: Idempotency, Concurrency & Webhooks](./reliability-idempotency-webhooks.md) | Idempotency-Key implementation, ETag/If-Match, retries, webhook signing, AsyncAPI |
| 8 | [Contract Governance & Testing](./contract-governance-testing.md) | Design-first vs code-first, Spectral, oasdiff, Prism, Pact, Schemathesis, CI gates |
| 9 | [API Security Checklist (OWASP API Top 10)](./api-security-owasp-checklist.md) | BOLA, mass assignment, rate limiting, OAuth scopes in OpenAPI |
| 10 | [Interview Questions](./api-design-interview-questions.md) | Junior to staff-level Q&A and design prompts |

## Principles Every Page Builds On

1. **Consumers first.** Design from the client's task, not from your database tables.
2. **Consistency beats cleverness.** One way to paginate, one error format, one naming style - enforced by a linter, not by memory.
3. **Additive evolution.** Add optional fields; never repurpose, remove, narrow or rename.
4. **Explicit failure semantics.** Every operation documents which errors can happen and whether retrying is safe.
5. **The spec is executable.** It drives mocks, SDKs, tests, gateways and docs - so it must be validated in CI.
6. **Least privilege & least data.** Return only what the caller may see (BOLA, excessive data exposure).

## Swagger vs OpenAPI in One Paragraph

*Swagger* was the original name of both the specification and the tools (2011, Tony Tam / Reverb). In 2015 the spec was donated to the Linux Foundation as the **OpenAPI Initiative** and became the **OpenAPI Specification (OAS)**; versions 3.0 (2017) and 3.1 (2021, fully aligned with JSON Schema 2020-12) followed. **Swagger** now names SmartBear's tooling: Swagger UI, Swagger Editor, Swagger Codegen (the community fork is OpenAPI Generator). "Swagger 2.0" files are legacy; new work should target OAS 3.1.
