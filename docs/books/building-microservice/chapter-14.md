---
sidebar_position: 15
title: 'Chapter 14: User Interfaces'
description: '**Part II — People**'
tags:
- books
- building-microservice
- chapter-14
---
# Chapter 14: User Interfaces

**Part II — People**

> Microservices often focus on backend services, but the frontend matters too. This chapter explores how to design user interfaces that work with — and benefit from — a microservice architecture.

---

## The UI in a Microservice World

Backend microservices are meaningless without a way for users to interact with them. The challenge: a user interface for a microservice-backed system must aggregate data and functionality from many services, often with different latencies and failure modes.

Two key questions:
1. **Who owns the UI?** (organizational)
2. **How do you compose it from multiple services?** (technical)

---

## Ownership Models

### The Dedicated Frontend Team (Common but Problematic)

A single frontend team owns all UI components. Backend teams build APIs; the frontend team consumes them.

```
Customer Profile Team (backend) ──────►┐
Orders Team (backend)            ──────►│  Frontend Team (UI)
Catalog Team (backend)           ──────►┘
```

Problems:
- **Bottleneck** — all UI work queues up with one team
- **Disconnection** — frontend team is far from business domain; loses context
- **Coordination overhead** — every feature requires coordination between backend teams and frontend team
- **Slow delivery** — three-team handoffs for every user-facing change

### The Stream-Aligned Team (Preferred)

Each team owns the UI *and* backend for their domain. End-to-end ownership.

```
Customer Profile Team: owns customer profile page + API
Orders Team: owns order history page + API
Catalog Team: owns catalog pages + API
```

Benefits: faster delivery, direct user empathy, independent deployability.

---

## UI Composition Patterns

Different teams owning different parts of the UI creates a composition challenge: how do you stitch multiple team-owned UI fragments into one coherent user experience?

### 1. Monolithic Frontend (Single Page Application)

One large SPA (React, Angular, Vue) consumes multiple backend APIs.

```
[ React SPA ]
  ├── /catalog → calls Catalog Service
  ├── /orders  → calls Orders Service
  └── /profile → calls Customer Service
```

**Pros:** Simple deployment, consistent UX, full-stack JavaScript.
**Cons:** All frontend code lives in one repo → frontend team becomes a bottleneck again; deployment coupling between frontend teams.

### 2. Micro Frontends

Each team owns a frontend *fragment* (a component, section, or page) that is independently deployable. The shell app composes them at runtime.

```
Shell App (Router + Layout)
  ├── /catalog → Catalog Fragment (Team A's deployed bundle)
  ├── /orders  → Orders Fragment (Team B's deployed bundle)
  └── /profile → Profile Fragment (Team C's deployed bundle)
```

**Implementation options:**
- **Module Federation** (Webpack 5) — dynamically load remote JavaScript modules
- **Web Components** — standard custom elements composable in any framework
- **iframes** — simple but limited (UX, performance, shared state difficulties)
- **Server-Side Includes (SSI)** — compose at the server/CDN level

**Webpack Module Federation:**
```javascript
// orders-app/webpack.config.js (Team B exposes their component)
plugins: [
  new ModuleFederationPlugin({
    name: "ordersApp",
    filename: "remoteEntry.js",
    exposes: {
      "./OrderHistory": "./src/components/OrderHistory",
    },
  }),
]

// shell-app/webpack.config.js (shell consumes it)
plugins: [
  new ModuleFederationPlugin({
    remotes: {
      ordersApp: "ordersApp@https://orders.example.com/remoteEntry.js",
    },
  }),
]

// Usage in shell
const OrderHistory = React.lazy(() => import("ordersApp/OrderHistory"));
```

### 3. Server-Side Rendering with Edge Composition

Each service renders its own HTML fragment. A reverse proxy or CDN assembles them at the edge using SSI or ESI (Edge Side Includes).

```
Browser → CDN/Edge (assembles fragments)
               ├── Header fragment from Navigation Service
               ├── Product section from Catalog Service
               └── Recommendations from Recommendation Service
```

**Pros:** SEO-friendly, fast initial load, no JavaScript required for composition.
**Cons:** More complex infrastructure; harder to share state between fragments.

---

## Backend for Frontend (BFF)

A common pattern: instead of having the mobile app and the web app both call individual microservices, create a dedicated **Backend for Frontend** service for each consumer type.

```
Mobile App  →  Mobile BFF  →  [ Catalog, Orders, Customer, ... ]
Web App     →  Web BFF     →  [ Catalog, Orders, Customer, ... ]
Partner API →  Partner BFF →  [ Catalog, Inventory, ... ]
```

Each BFF is tailored to its client's specific data needs:
- Aggregates calls to multiple services into one response
- Transforms data into the format the client needs
- Handles client-specific concerns (field selection, pagination, error format)

**Spring Boot BFF Example:**
```java
@RestController
@RequestMapping("/mobile/v1")
public class MobileBffController {

    // Mobile app needs order summary + customer info in one call
    @GetMapping("/dashboard/{customerId}")
    public MobileDashboardDto getDashboard(@PathVariable String customerId) {
        CustomerDto customer = customerClient.getCustomer(customerId);
        List<OrderSummaryDto> recentOrders = orderClient.getRecentOrders(customerId, 5);
        List<RecommendationDto> recommendations = recommendationClient.get(customerId, 4);

        return MobileDashboardDto.builder()
            .customerName(customer.getName())
            .recentOrders(recentOrders)
            .recommendations(recommendations)
            .build();
    }
}
```

### BFF vs. General-Purpose API Gateway

| | API Gateway | BFF |
|---|---|---|
| **Purpose** | General routing, auth, rate limiting | Client-specific data aggregation |
| **Content awareness** | None — dumb pipe | Knows client's data needs |
| **Coupling** | Low | Higher (but acceptable — owned by the frontend team) |
| **Typical implementation** | Kong, AWS API Gateway | Spring Boot app owned by frontend team |

---

## GraphQL as an Alternative

GraphQL allows clients to request exactly the data they need from a flexible schema. One GraphQL endpoint federates across multiple backend services.

```graphql
# Client specifies exactly what it needs
query {
  order(id: "ord-123") {
    id
    status
    customer {
      name
      email
    }
    items {
      product {
        name
        price
      }
      quantity
    }
  }
}
```

**Spring Boot + DGS (Netflix Domain Graph Service):**
```java
@DgsComponent
public class OrderDataFetcher {
    @DgsQuery
    public Order order(@InputArgument String id) {
        return orderService.getOrder(id);
    }

    @DgsData(parentType = "Order", field = "customer")
    public Customer customer(DgsDataFetchingEnvironment dfe) {
        Order order = dfe.getSource();
        return customerClient.getCustomer(order.getCustomerId());
    }
}
```

**GraphQL Federation** (Apollo Federation): each service exposes its own GraphQL subgraph; a gateway composes them into a unified schema. This aligns well with microservice team ownership.

---

## Summary

| Pattern | Best For |
|---|---|
| Dedicated frontend team | Small teams; early stage; consistent UX priority |
| Stream-aligned teams with micro frontends | Large orgs; independent team deployments |
| Micro Frontends (Module Federation) | Independent deployment per team's UI fragment |
| Backend for Frontend (BFF) | Aggregated, client-tailored APIs |
| GraphQL Federation | Flexible querying across multiple microservices |
