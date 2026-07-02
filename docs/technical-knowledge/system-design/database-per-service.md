---
id: database-per-service
title: Database per Service
sidebar_label: Database per Service
description: Technical guide to the Database-per-Service pattern, comparing data access options like API Composition, CQRS, and transaction management.
tags: [system-design, microservices, databases, cqrs, data-consistency]
---

# Database per Service

The **Database per Service** pattern requires that each microservice owns its private database. Other services cannot access this database directly. Instead, they must query or update data strictly via the owner service's public APIs (HTTP, gRPC, or events).

This is a fundamental pattern for achieving loose coupling in a microservices architecture.

---

## Why Shared Databases (Integration DB) Fail

In a monolithic application, different modules join tables freely. Exposing this database to multiple microservices creates a severe architectural bottleneck:

```text
Integration Database (Anti-pattern):
Order Service   ─┐
Payment Service  ├───► [ Single SQL Database ] ───► Tight schema coupling & lock contention
User Service    ─┘

Database per Service (Correct):
Order Service   ──► [ Orders DB ]   (Postgres - relational transactions)
Payment Service ──► [ Payments DB ] (Postgres - high security vault)
Search Service  ──► [ Search DB ]   (Elasticsearch - search indexes)
```

- **Schema Locking**: A simple table change (e.g., renaming a column in `users`) requires coordinated deployments across all services.
- **Resource Starvation**: A slow query written by the Order Service can consume all CPU threads on the database host, slowing down the completely unrelated User Service.
- **Technology Locking**: All services are forced to use the same database technology (e.g., Oracle SQL), even if one service would benefit from a Document DB (MongoDB) or Search Index (Elasticsearch).

---

## Cross-Service Data Retrieval Options

Since direct SQL joins (`JOIN orders ON users.id = orders.user_id`) are impossible, systems implement three options:

### 1. API Composition (Query-Time Aggregation)
The client or API Gateway requests data from each service in parallel and merges the results in code.

```text
API Gateway / Composor
  ├──► Fetch User Profile (User Service)
  └──► Fetch Recent Orders (Order Service)
  * Merge profiles and orders in code -> return aggregated JSON
```

- **Pros**: Easy to implement. Good for simple joins.
- **Cons**: Adds latency (multiple network calls) and memory overhead.

---

### 2. CQRS (Command Query Responsibility Segregation)
Builds a read-only database optimized for complex queries. The read-only service consumes events (e.g., `OrderCreated`, `CustomerUpdated`) and maintains a projection index (e.g., in Elasticsearch).

```text
Event Emitted ──► [ Message Broker ] ──► Read Projection Builder ──► [ Read-Optimized DB ]
                                                                     (e.g., Elasticsearch)
                                                                               ▲
                                                                  Queries ─────┘
```

- **Pros**: Fast, highly scalable queries. Avoids network join overhead.
- **Cons**: High complexity; read-model suffers from eventual consistency lag.

---

### 3. Shared Read Replicas (Read Only DB access)
The owner service writes to its primary database and replays transactions to a replica database. Selected caller services are permitted to read (but never write) from this replica.
- **Pros**: Simplifies complex reporting queries.
- **Cons**: Couples services to the database schema of the replica.

---

## Code Example: API Composition Aggregator

Below is a Spring Boot service implementing parallel queries using Java `CompletableFuture` to aggregate details across three remote APIs:

```java
@Service
@RequiredArgsConstructor
public class CustomerDashboardService {

    private final UserClient userClient;
    private final OrderClient orderClient;
    private final LoyaltyClient loyaltyClient;

    public DashboardData getDashboard(String customerId) throws Exception {
        // Trigger parallel requests
        CompletableFuture<UserDto> userFuture = 
            CompletableFuture.supplyAsync(() -> userClient.getUser(customerId));
            
        CompletableFuture<List<OrderDto>> ordersFuture = 
            CompletableFuture.supplyAsync(() -> orderClient.getOrders(customerId));
            
        CompletableFuture<Integer> pointsFuture = 
            CompletableFuture.supplyAsync(() -> loyaltyClient.getPoints(customerId));

        // Wait for all to complete with a strict global timeout
        CompletableFuture.allOf(userFuture, ordersFuture, pointsFuture)
            .get(2, TimeUnit.SECONDS);

        return DashboardData.builder()
            .profile(userFuture.join())
            .orders(ordersFuture.join())
            .loyaltyPoints(pointsFuture.join())
            .build();
    }
}
```

---

## Pros vs. Cons

| Pros | Cons |
| :--- | :--- |
| **Independent Deployability**: Services change their internal schemas freely without coordinating releases. | **Query Complexity**: Merging data across services requires custom API composition or complex CQRS setups. |
| **Polyglot Persistence**: Each service optimizes its storage technology (SQL, NoSQL, Elasticsearch, Redis). | **Transactional Complexity**: Distributed updates require Saga coordination patterns instead of simple ACID transactions. |
| **Resource Isolation**: Slow database operations are sandboxed to a single service domain. | **Operational Overhead**: Platform engineers must maintain, back up, and monitor N distinct databases. |

---

## Common Gotchas & Anti-Patterns

1. **Logical Shared Databases**: Running separate schemas inside the same physical database instance. While this solves schema coupling, it fails resource isolation; a database deadlock or CPU lockup in one service will still crash all other services.
2. **Sync Loop Joins**: Querying a list of 100 orders, and then making 100 synchronous HTTP requests to User Service to fetch customer profiles one by one (the N+1 query problem).
   - *Solution*: Provide batch APIs (`GET /users?ids=1,2,3...`).
3. **Data Drift**: If Event Sourcing or CQRS data-sync jobs fail silently, read models will display stale data indefinitely. Set up reconciler jobs to periodically compare record states.
