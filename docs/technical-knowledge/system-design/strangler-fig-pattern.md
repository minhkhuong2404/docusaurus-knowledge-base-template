---
id: strangler-fig-pattern
title: Strangler Fig Pattern
sidebar_label: Strangler Fig
description: Guide to the Strangler Fig pattern for migrating monoliths to microservices, incorporating routing, Anti-Corruption Layers (ACL), and data sync strategies.
tags: [system-design, microservices, migration, monolith, strangler-fig]
---

# Strangler Fig Pattern

The **Strangler Fig** pattern describes the incremental migration of a legacy monolithic application to a microservices architecture. Instead of a risky, high-stress "big-bang" rewrite, new features are built in new services, and legacy endpoints are gradually routed to these services over time until the monolith is retired.

It is named after the Australian strangler fig tree, which germinates in the branches of a host tree, slowly grows down to the ground, and eventually envelopes and replaces the original tree.

---

## The Migration Lifecycle

The migration is conducted across four sequential phases:

```text
Phase 1: Direct Monolith Routing
Client ──────► [ API Gateway / Reverse Proxy ] ──────► Monolith (Handles all traffic)

Phase 2: Split Routing (First Slice Extracted)
Client ──────► [ API Gateway / Reverse Proxy ] ──────┬──► Monolith (/orders/* is legacy)
                                                     └──► Order Service (/orders/* NEW)

Phase 3: Deep Extraction
Client ──────► [ API Gateway / Reverse Proxy ] ──────┬──► Monolith (/users/* remaining)
                                                     ├──► Order Service (/orders/*)
                                                     └──► Payment Service (/payments/*)

Phase 4: Monolith Retired
Client ──────► [ API Gateway / Reverse Proxy ] ──────┬──► Order Service (/orders/*)
                                                     ├──► Payment Service (/payments/*)
                                                     └──► User Service (/users/*)
```

---

## Key Migration Architecture & Components

Migrating a vertical slice (e.g., Orders) successfully requires several components:

```text
┌──────────────┐          ┌──────────────────────┐          ┌──────────────┐
│  New Micro-  │ ────────►│ Anti-Corruption Layer│ ────────►│    Legacy    │
│   service    │          │      (ACL Service)   │          │   Monolith   │
└──────────────┘          └──────────────────────┘          └──────────────┘
```

1. **Routing Layer (Gateway/Reverse Proxy)**: An Nginx, Kong, or Spring Cloud Gateway layer positioned in front of all services. It directs specific URI paths (e.g., `/api/v1/orders`) to the new microservice while sending everything else to the monolith.
2. **Anti-Corruption Layer (ACL)**: A translator layer that shields the clean domain model of the new microservice from the legacy database schemas and API designs of the monolith. The new service speaks to the ACL, and the ACL translates the request into legacy monolith formats.
3. **Data Synchronizer**: If both the monolith and the new service require access to the same database tables during the transition, data sync pipelines (e.g., Kafka events or CDC tools like Debezium) are used to synchronize state in near real-time.

---

## Example Gateway Setup (Nginx Migration Rules)

Configure your API Gateway to start intercepting and redirecting endpoints as they are migrated:

```nginx
# nginx.conf
server {
    listen 80;
    server_name api.myapp.com;

    # Migrated orders traffic goes to the new Spring Boot microservice
    location /api/v1/orders/ {
        proxy_pass http://order-service.prod.svc.cluster.local:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # All other legacy traffic falls back to the old monolith
    location / {
        proxy_pass http://legacy-monolith.prod.svc.cluster.local:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Pros vs. Cons

| Pros | Cons |
| :--- | :--- |
| **Drastically Reduced Risk**: Failures in new services are contained to single features; rollback is a simple gateway routing toggle. | **High Coordination Overhead**: Teams must run two environments, coordinate database schemas, and manage dual-write pipelines. |
| **Continuous Delivery**: Value is released to production in weeks rather than waiting for a multi-year big-bang project. | **Increased Latency**: Cross-system network calls (Monolith calling microservice via ACL) add latency. |
| **Team Learning**: Allows the engineering organization to learn distributed systems development gradually. | **Database Spaghetti**: Separating a shared monolithic database without breaking legacy reports is highly difficult. |

---

## Operational Migration Guardrails

- **Migrate Reads First**: Extract read-only endpoints (e.g., `/orders/{id}`) first. These have a low blast radius and do not require writing data to two separate databases.
- **Dual Writes and Shadowing**: For write paths, write to the new microservice database but shadow-write to the monolith database in the background. Run a data-verification job to compare records before turning off the legacy write path.
- **Keep Rollbacks Fast**: Avoid making database schema changes in the monolith that are impossible to roll back. Maintain routing toggle parameters in the API Gateway.
- **Don't share databases directly**: Never let the new microservice query the monolithic database tables directly. Force communication through APIs or an ACL.
