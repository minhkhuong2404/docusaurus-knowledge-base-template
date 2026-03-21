---
id: system-design
title: Phase 3 — System Design
sidebar_label: System Design
---

# Phase 3 — System Design

## Overview

The **System Design phase** translates approved requirements into a detailed technical blueprint. It defines the architecture, component interactions, data models, API contracts, and infrastructure topology that engineers will implement.

Good design decisions made here compound positively through development, testing, and maintenance. Poor design decisions become technical debt that is exponentially expensive to fix later.

---

## Goals

- Define High-Level Design (HLD) and Low-Level Design (LLD)
- Establish API contracts between services
- Design database schemas
- Plan for scalability, resilience, and security at the architecture level
- Identify and resolve technical risks before coding begins

---

## Entry Criteria

- Requirements phase is complete and approved
- Tech Lead and Architects are available
- NFRs (performance, availability, security) are documented

---

## High-Level Design (HLD)

HLD focuses on the big picture: system components, their relationships, and how data flows between them.

### Components of HLD

- **System context diagram** — shows the system and its external actors/integrations
- **Container diagram** — shows major deployable units (microservices, databases, queues)
- **Technology stack decisions** — justify choices (e.g., Spring Boot + PostgreSQL + Kafka)
- **Infrastructure topology** — cloud provider, regions, availability zones

### Example Technology Decisions

| Concern | Decision | Rationale |
|---|---|---|
| Backend framework | Spring Boot 3.x | Team expertise, ecosystem maturity |
| Database | PostgreSQL | ACID compliance, strong JSON support |
| Message broker | Apache Kafka | High throughput, replay capability |
| API style | REST + OpenAPI 3.0 | Broad tooling support |
| Auth | OAuth2 / Spring Security | Industry standard |
| Caching | Redis | Low latency, cluster support |
| Observability | Micrometer + Prometheus + Grafana | Spring-native integration |

---

## Low-Level Design (LLD)

LLD provides implementation-ready detail for each component.

### Package Structure (Spring Boot)

```
com.yourorg.service
├── api
│   ├── controller         # REST controllers (@RestController)
│   ├── dto                # Request/response DTOs
│   └── mapper             # DTO <-> Domain mappers (MapStruct)
├── domain
│   ├── model              # Domain entities
│   ├── service            # Business logic (@Service)
│   └── port               # Interfaces (hexagonal architecture)
├── infrastructure
│   ├── persistence        # JPA repositories, entity classes
│   ├── messaging          # Kafka producers/consumers
│   ├── external           # REST clients (OpenFeign / WebClient)
│   └── config             # Spring configuration classes
└── common
    ├── exception          # Custom exceptions and handlers
    ├── validation         # Custom validators
    └── util               # Utility classes
```

### API Contract Example (OpenAPI 3.0)

```yaml
openapi: 3.0.3
info:
  title: Transaction Service API
  version: 1.0.0

paths:
  /api/v1/transactions:
    get:
      summary: List transactions for authenticated user
      parameters:
        - name: fromDate
          in: query
          required: false
          schema:
            type: string
            format: date
        - name: toDate
          in: query
          required: false
          schema:
            type: string
            format: date
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Paginated transaction list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TransactionPage'
        '401':
          description: Unauthorized
        '422':
          description: Invalid date range

components:
  schemas:
    TransactionPage:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/TransactionDto'
        totalElements:
          type: integer
        totalPages:
          type: integer
    TransactionDto:
      type: object
      properties:
        id:
          type: string
          format: uuid
        amount:
          type: number
        currency:
          type: string
        description:
          type: string
        createdAt:
          type: string
          format: date-time
```

### Database Schema Design

```sql
-- Transactions table
CREATE TABLE transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    amount      NUMERIC(19, 4) NOT NULL,
    currency    CHAR(3) NOT NULL,
    description VARCHAR(255),
    status      VARCHAR(50) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_transactions_user_id        ON transactions(user_id);
CREATE INDEX idx_transactions_user_created   ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_status         ON transactions(status) WHERE status != 'COMPLETED';
```

---

## Design Review Checklist

- [ ] HLD reviewed and approved by Architecture Board
- [ ] API contracts reviewed by consuming teams
- [ ] Database design reviewed by DBA
- [ ] Security review completed (OWASP Top 10 considered)
- [ ] Performance NFRs addressed in design
- [ ] Resilience patterns defined (circuit breaker, retry, bulkhead)
- [ ] Observability hooks planned (metrics, traces, logs)
- [ ] Feature flags strategy defined

---

## Exit Criteria

- [ ] HLD document approved
- [ ] LLD documents for all services approved
- [ ] OpenAPI specs reviewed by API consumers
- [ ] Database schema approved by DBA/Tech Lead
- [ ] No blocking design questions remain
- [ ] Development environment and tooling is ready

---

:::tip Design Principle
Design for failure. Assume every external call will eventually fail and plan your circuit breakers, fallbacks, and retry policies in the design phase — not during an incident.
:::
