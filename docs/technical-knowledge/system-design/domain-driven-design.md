---
id: domain-driven-design
title: Domain-Driven Design (DDD)
sidebar_label: Domain-Driven Design
description: Practical DDD for system design interviews and production architecture, including bounded contexts, aggregates, context mapping, and migration patterns.
tags: [ddd, bounded-context, aggregate, ubiquitous-language, context-mapping, domain-modeling, microservices]
---

# Domain-Driven Design (DDD)

> DDD helps teams model complex business domains with shared language and clear boundaries.

## Table of Contents

- [Beginner View](#beginner-view)
- [Core Building Blocks](#core-building-blocks)
  - [Entities](#entities)
  - [Value Objects](#value-objects)
  - [Aggregates and Aggregate Root](#aggregates-and-aggregate-root)
  - [Repositories](#repositories)
  - [Domain Services](#domain-services)
  - [Domain Events](#domain-events)
  - [Factories](#factories)
- [Strategic Design](#strategic-design)
  - [Bounded Contexts](#bounded-contexts)
  - [Ubiquitous Language](#ubiquitous-language)
  - [Context Mapping](#context-mapping)
  - [Domain Layers](#domain-layers)
- [Tactical Design](#tactical-design)
  - [Aggregate Design](#aggregate-design)
  - [Invariant Enforcement](#invariant-enforcement)
  - [Domain Event Handling](#domain-event-handling)
  - [Specification Pattern](#specification-pattern)
- [Senior Deep Dive](#senior-deep-dive)
  - [Context Mapping Patterns](#context-mapping-patterns)
  - [Aggregate Sizing Tradeoff](#aggregate-sizing-tradeoff)
  - [DDD and Microservices](#ddd-and-microservices)
  - [DDD and Event-Driven Architecture](#ddd-and-event-driven-architecture)
- [DDD Patterns](#ddd-patterns)
  - [Repository Pattern](#repository-pattern)
  - [Factory Pattern](#factory-pattern)
  - [Specification Pattern](#specification-pattern-1)
  - [Strategy Pattern](#strategy-pattern)
  - [Decorator Pattern](#decorator-pattern)
- [DDD Architecture Patterns](#ddd-architecture-patterns)
  - [Layered Architecture](#layered-architecture)
  - [Hexagonal Architecture](#hexagonal-architecture)
  - [Onion Architecture](#onion-architecture)
  - [Clean Architecture](#clean-architecture)
- [DDD Implementation Examples](#ddd-implementation-examples)
  - [E-Commerce Domain](#e-commerce-domain)
  - [Banking Domain](#banking-domain)
  - [Healthcare Domain](#healthcare-domain)
- [DDD and Database Design](#ddd-and-database-design)
  - [Aggregate Persistence](#aggregate-persistence)
  - [Value Object Persistence](#value-object-persistence)
  - [Event Sourcing](#event-sourcing)
  - [CQRS](#cqrs)
- [DDD Testing Strategies](#ddd-testing-strategies)
  - [Unit Testing](#unit-testing)
  - [Integration Testing](#integration-testing)
  - [Domain Testing](#domain-testing)
- [DDD Migration Patterns](#ddd-migration-patterns)
  - [Strangler Fig Pattern](#strangler-fig-pattern)
  - [Anti-Corruption Layer](#anti-corruption-layer)
  - [Parallel Run](#parallel-run)
- [Common Failure Modes](#common-failure-modes)
- [Production Checklist](#production-checklist)
- [Real-World Implementations](#real-world-implementations)
- [Integration Patterns](#integration-patterns)
- [Pros and Cons](#pros-and-cons)
- [Interview Questions](#interview-questions)
- [Senior Deep Dive: Advanced Topics](#senior-deep-dive-advanced-topics)
  - [Bounded Context Evolution](#bounded-context-evolution)
  - [Domain Event Versioning](#domain-event-versioning)
  - [Aggregate Concurrency](#aggregate-concurrency)
  - [DDD and Serverless](#ddd-and-serverless)
  - [DDD and GraphQL](#ddd-and-graphql)
- [Additional Resources](#additional-resources)
- [Best Practices](#best-practices)

---

## Beginner View

DDD is not just about entities and repositories. It is about designing software around business concepts:
- **Ubiquitous Language**: one shared vocabulary used by engineers and domain experts
- **Bounded Context**: an explicit boundary where terms and rules have one meaning
- **Model + Code Alignment**: code structure mirrors domain behavior, not just database tables

Example:
- In Checkout context, `Order` means payment lifecycle and fulfillment status
- In Analytics context, `Order` may be immutable event facts

Same word, different meaning. Separate contexts avoid semantic conflicts.

---

## Core Building Blocks

### Entities

Objects with stable identity over time.

```java
public class Customer {
    private final CustomerId id;
    private String email;
    private String name;
    private Instant createdAt;

    public Customer(CustomerId id, String email, String name) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.createdAt = Instant.now();
    }

    public void changeEmail(String newEmail) {
        if (!isValidEmail(newEmail)) {
            throw new IllegalArgumentException("Invalid email");
        }
        this.email = newEmail;
    }

    public CustomerId getId() {
        return id;
    }

    // Identity-based equality
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Customer customer = (Customer) o;
        return id.equals(customer.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}
```

### Value Objects

Immutable types defined by value, not identity.

```java
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount must be non-negative");
        }
        if (currency == null) {
            throw new IllegalArgumentException("Currency cannot be null");
        }
    }

    public Money add(Money other) {
        if (!currency.equals(other.currency())) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(amount.add(other.amount()), currency);
    }

    public Money subtract(Money other) {
        if (!currency.equals(other.currency())) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        BigDecimal result = amount.subtract(other.amount());
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Insufficient funds");
        }
        return new Money(result, currency);
    }

    public Money multiply(BigDecimal multiplier) {
        return new Money(amount.multiply(multiplier), currency);
    }

    // Value-based equality
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return amount.equals(money.amount) && currency.equals(money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount, currency);
    }
}

public record Email(String value) {
    public Email {
        if (!isValidEmail(value)) {
            throw new IllegalArgumentException("Invalid email format");
        }
    }

    private static boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }
}

public record Address(String street, String city, String state, String zipCode) {
    public Address {
        if (street == null || street.isBlank()) {
            throw new IllegalArgumentException("Street cannot be blank");
        }
        if (city == null || city.isBlank()) {
            throw new IllegalArgumentException("City cannot be blank");
        }
    }
}
```

### Aggregates and Aggregate Root

Aggregate is a consistency boundary. External code should change state via the root only.

```java
public class Order {
    private final OrderId id;
    private CustomerId customerId;
    private OrderStatus status;
    private final List<OrderLine> lines = new ArrayList<>();
    private Money totalAmount;
    private Instant createdAt;
    private Instant updatedAt;
    private final List<DomainEvent> domainEvents = new ArrayList<>();

    public Order(OrderId id, CustomerId customerId) {
        this.id = id;
        this.customerId = customerId;
        this.status = OrderStatus.DRAFT;
        this.totalAmount = Money.ZERO;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void addLine(ProductId productId, int quantity, Money unitPrice) {
        if (status != OrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot add line to non-draft order");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }

        OrderLine line = new OrderLine(productId, quantity, unitPrice);
        lines.add(line);
        recalculateTotal();
        updatedAt = Instant.now();
    }

    public void removeLine(OrderLineId lineId) {
        if (status != OrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot remove line from non-draft order");
        }

        lines.removeIf(line -> line.getId().equals(lineId));
        recalculateTotal();
        updatedAt = Instant.now();
    }

    public void place() {
        if (status != OrderStatus.DRAFT) {
            throw new IllegalStateException("Only draft orders can be placed");
        }
        if (lines.isEmpty()) {
            throw new IllegalStateException("Cannot place empty order");
        }

        this.status = OrderStatus.PLACED;
        this.updatedAt = Instant.now();
        registerEvent(new OrderPlacedEvent(id, customerId, totalAmount));
    }

    public void cancel() {
        if (status != OrderStatus.PLACED) {
            throw new IllegalStateException("Only placed orders can be cancelled");
        }

        this.status = OrderStatus.CANCELLED;
        this.updatedAt = Instant.now();
        registerEvent(new OrderCancelledEvent(id, customerId));
    }

    private void recalculateTotal() {
        Money total = lines.stream()
            .map(OrderLine::getTotalPrice)
            .reduce(Money.ZERO, Money::add);
        this.totalAmount = total;
    }

    private void registerEvent(DomainEvent event) {
        domainEvents.add(event);
    }

    public List<DomainEvent> pullDomainEvents() {
        List<DomainEvent> events = new ArrayList<>(domainEvents);
        domainEvents.clear();
        return events;
    }

    // Getters
    public OrderId getId() { return id; }
    public OrderStatus getStatus() { return status; }
    public List<OrderLine> getLines() { return List.copyOf(lines); }
    public Money getTotalAmount() { return totalAmount; }
}

public record OrderLineId(String value) {}
public record ProductId(String value) {}
public record CustomerId(String value) {}
public record OrderId(String value) {}

public enum OrderStatus {
    DRAFT, PLACED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
}
```

### Repositories

Repositories provide collection-like access to aggregates.

```java
public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(OrderId id);
    List<Order> findByCustomerId(CustomerId customerId);
    List<Order> findByStatus(OrderStatus status);
    void delete(OrderId id);
}

@Repository
public class JpaOrderRepository implements OrderRepository {
    private final OrderJpaRepository jpaRepository;

    @Override
    public Order save(Order order) {
        return jpaRepository.save(order);
    }

    @Override
    public Optional<Order> findById(OrderId id) {
        return jpaRepository.findById(id);
    }

    @Override
    public List<Order> findByCustomerId(CustomerId customerId) {
        return jpaRepository.findByCustomerId(customerId);
    }

    @Override
    public List<Order> findByStatus(OrderStatus status) {
        return jpaRepository.findByStatus(status);
    }

    @Override
    public void delete(OrderId id) {
        jpaRepository.deleteById(id);
    }
}
```

### Domain Services

Domain services contain business logic that doesn't naturally fit in entities or value objects.

```java
@Service
public class OrderPricingService {
    private final DiscountRepository discountRepository;
    private final TaxCalculator taxCalculator;

    public Money calculateTotal(Order order) {
        Money subtotal = order.getLines().stream()
            .map(OrderLine::getTotalPrice)
            .reduce(Money.ZERO, Money::add);

        Money discount = calculateDiscount(order);
        Money afterDiscount = subtotal.subtract(discount);
        Money tax = taxCalculator.calculate(afterDiscount);

        return afterDiscount.add(tax);
    }

    private Money calculateDiscount(Order order) {
        List<Discount> applicableDiscounts = discountRepository
            .findApplicableForOrder(order);

        return applicableDiscounts.stream()
            .map(discount -> discount.calculate(order))
            .reduce(Money.ZERO, Money::add);
    }
}

@Service
public class PaymentProcessingService {
    private final PaymentGateway paymentGateway;
    private final OrderRepository orderRepository;

    public PaymentResult processPayment(OrderId orderId, PaymentDetails details) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (order.getStatus() != OrderStatus.PLACED) {
            throw new IllegalStateException("Order is not ready for payment");
        }

        PaymentResult result = paymentGateway.charge(
            details,
            order.getTotalAmount()
        );

        if (result.isSuccess()) {
            order.confirm();
            orderRepository.save(order);
        }

        return result;
    }
}
```

### Domain Events

Domain events represent something that happened in the domain.

```java
public interface DomainEvent {
    Instant occurredOn();
    String eventType();
}

public record OrderPlacedEvent(
    OrderId orderId,
    CustomerId customerId,
    Money totalAmount,
    Instant occurredOn
) implements DomainEvent {

    public OrderPlacedEvent {
        if (occurredOn == null) {
            occurredOn = Instant.now();
        }
    }

    @Override
    public String eventType() {
        return "OrderPlaced";
    }
}

public record OrderCancelledEvent(
    OrderId orderId,
    CustomerId customerId,
    Instant occurredOn
) implements DomainEvent {

    public OrderCancelledEvent {
        if (occurredOn == null) {
            occurredOn = Instant.now();
        }
    }

    @Override
    public String eventType() {
        return "OrderCancelled";
    }
}

public record OrderShippedEvent(
    OrderId orderId,
    ShippingAddress shippingAddress,
    Instant occurredOn
) implements DomainEvent {

    public OrderShippedEvent {
        if (occurredOn == null) {
            occurredOn = Instant.now();
        }
    }

    @Override
    public String eventType() {
        return "OrderShipped";
    }
}
```

### Factories

Factories handle complex object creation logic.

```java
@Component
public class OrderFactory {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public Order createOrder(CreateOrderCommand command) {
        CustomerId customerId = new CustomerId(command.getCustomerId());

        Order order = new Order(
            orderRepository.nextId(),
            customerId
        );

        for (CreateOrderLineCommand lineCommand : command.getLines()) {
            Product product = productRepository.findById(
                new ProductId(lineCommand.getProductId())
            ).orElseThrow(() -> new ProductNotFoundException(lineCommand.getProductId()));

            order.addLine(
                product.getId(),
                lineCommand.getQuantity(),
                product.getPrice()
            );
        }

        return order;
    }
}
```

---

## Strategic Design

### Bounded Contexts

A bounded context is a distinct part of the domain model with its own ubiquitous language.

```
E-Commerce System Bounded Contexts:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Catalog       │    │   Checkout       │    │   Inventory     │
│                 │    │                 │    │                 │
│ - Product       │    │ - Order          │    │ - StockItem     │
│ - Category      │    │ - Cart           │    │ - Warehouse     │
│ - Price         │    │ - Payment        │    │ - Location      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                    ┌─────────────────┐
                    │   Shipping      │
                    │                 │
                    │ - Shipment     │
                    │ - Tracking     │
                    │ - Carrier      │
                    └─────────────────┘
```

### Ubiquitous Language

Ubiquitous language is a shared vocabulary used by both domain experts and developers.

**Example: E-Commerce Domain**

| Term | Meaning in Catalog Context | Meaning in Checkout Context |
|------|---------------------------|----------------------------|
| Product | Catalog item with price, description | Order line item reference |
| Order | N/A | Customer purchase with payment |
| Stock | Available quantity | Reserved quantity |
| Price | List price | Final price with discounts |

### Context Mapping

Context mapping defines relationships between bounded contexts.

```
Context Mapping Patterns:

Catalog (Upstream) ──[Published Language]──> Checkout (Downstream)
Checkout (Upstream) ──[ACL]──> Payment (Downstream)
Inventory (Upstream) ──[OHS]──> Shipping (Downstream)
```

### Domain Layers

```
┌─────────────────────────────────────────┐
│           User Interface               │
│         (Controllers, DTOs)             │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Application Layer               │
│      (Services, Use Cases)              │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│           Domain Layer                  │
│  (Entities, Value Objects, Events)      │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│        Infrastructure Layer             │
│    (Repositories, External Services)    │
└─────────────────────────────────────────┘
```

---

## Tactical Design

### Aggregate Design

**Guidelines for aggregate design:**

1. **Keep aggregates small**: 1-3 entities max
2. **Design for consistency**: Only include entities that must be consistent together
3. **Reference by ID**: Use IDs to reference other aggregates
4. **Enforce invariants**: All business rules enforced within aggregate

```java
// Good: Small, focused aggregate
public class Cart {
    private final CartId id;
    private CustomerId customerId;
    private final List<CartItem> items;
    private Money total;

    public void addItem(ProductId productId, int quantity) {
        // Enforce invariant: max 100 items
        if (items.size() >= 100) {
            throw new IllegalStateException("Cart cannot have more than 100 items");
        }
        items.add(new CartItem(productId, quantity));
        recalculateTotal();
    }
}

// Bad: Large aggregate with unrelated entities
public class Order {
    private final OrderId id;
    private final List<OrderLine> lines;
    private final Customer customer;        // Should be separate aggregate
    private final List<Payment> payments;   // Should be separate aggregate
    private final List<Shipment> shipments; // Should be separate aggregate
}
```

### Invariant Enforcement

Invariants are business rules that must always be true.

```java
public class Account {
    private final AccountId id;
    private Money balance;
    private final List<Transaction> transactions;

    public void withdraw(Money amount) {
        // Invariant: balance cannot be negative
        if (balance.compareTo(amount) < 0) {
            throw new InsufficientFundsException(balance, amount);
        }

        this.balance = balance.subtract(amount);
        transactions.add(new Transaction(TransactionType.WITHDRAWAL, amount));
    }

    public void deposit(Money amount) {
        // Invariant: deposits must be positive
        if (amount.compareTo(Money.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be positive");
        }

        this.balance = balance.add(amount);
        transactions.add(new Transaction(TransactionType.DEPOSIT, amount));
    }
}
```

### Domain Event Handling

```java
@Component
public class OrderEventHandler {
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;

    @EventListener
    public void handle(OrderPlacedEvent event) {
        // Reserve inventory
        inventoryService.reserveItems(event.orderId(), event.orderLines());

        // Send confirmation email
        notificationService.sendOrderConfirmation(event.customerId(), event.orderId());

        // Track analytics
        analyticsService.trackOrderPlaced(event);
    }

    @EventListener
    public void handle(OrderCancelledEvent event) {
        // Release inventory
        inventoryService.releaseItems(event.orderId());

        // Send cancellation notification
        notificationService.sendOrderCancellation(event.customerId(), event.orderId());
    }
}
```

### Specification Pattern

Specifications encapsulate business rules.

```java
public interface Specification<T> {
    boolean isSatisfiedBy(T candidate);
    Specification<T> and(Specification<T> other);
    Specification<T> or(Specification<T> other);
    Specification<T> not();
}

public abstract class AbstractSpecification<T> implements Specification<T> {
    @Override
    public Specification<T> and(Specification<T> other) {
        return new AndSpecification<>(this, other);
    }

    @Override
    public Specification<T> or(Specification<T> other) {
        return new OrSpecification<>(this, other);
    }

    @Override
    public Specification<T> not() {
        return new NotSpecification<>(this);
    }
}

public class EligibleForDiscountSpecification extends AbstractSpecification<Order> {
    @Override
    public boolean isSatisfiedBy(Order order) {
        return order.getTotalAmount().compareTo(new Money("100")) >= 0 &&
               order.getCustomer().isLoyal();
    }
}

public class InStockSpecification extends AbstractSpecification<Product> {
    private final InventoryService inventoryService;

    @Override
    public boolean isSatisfiedBy(Product product) {
        return inventoryService.getStock(product.getId()) > 0;
    }
}

// Usage
Specification<Order> discountSpec = new EligibleForDiscountSpecification();
if (discountSpec.isSatisfiedBy(order)) {
    applyDiscount(order);
}
```

---

## Senior Deep Dive

### Context Mapping Patterns

#### Published Language

Upstream context provides a stable, well-documented API.

```java
// Upstream: Catalog Service
@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {
    @GetMapping("/products/{id}")
    public ProductDTO getProduct(@PathVariable String id) {
        Product product = productService.findById(id);
        return ProductDTO.from(product);
    }
}

// Downstream: Checkout Service
@Service
public class CatalogIntegrationService {
    private final CatalogClient catalogClient;

    public Product getProduct(ProductId id) {
        ProductDTO dto = catalogClient.getProduct(id.getValue());
        return Product.fromDTO(dto);
    }
}
```

#### Anti-Corruption Layer (ACL)

ACL translates external models into internal domain models.

```java
@Service
public class PaymentAclService {
    private final ExternalPaymentGateway externalGateway;

    public PaymentResult processPayment(PaymentRequest request) {
        // Translate to external model
        ExternalPaymentRequest externalRequest = new ExternalPaymentRequest(
            request.getCardNumber(),
            request.getExpiryDate(),
            request.getCvv(),
            request.getAmount().getValue(),
            request.getCurrency()
        );

        // Call external service
        ExternalPaymentResponse response = externalGateway.charge(externalRequest);

        // Translate back to domain model
        if (response.isSuccess()) {
            return PaymentResult.success(
                new PaymentId(response.getTransactionId()),
                request.getAmount()
            );
        } else {
            return PaymentResult.failure(
                PaymentFailureReason.fromCode(response.getErrorCode())
            );
        }
    }
}
```

#### Conformist

Downstream accepts upstream model without translation.

```java
@Service
public class AnalyticsService {
    private final CatalogClient catalogClient;

    public void trackProductView(ProductId productId) {
        // Directly use upstream model
        ProductDTO product = catalogClient.getProduct(productId.getValue());
        analyticsRepository.recordView(product);
    }
}
```

### Aggregate Sizing Tradeoff

- **Too large aggregate**: heavy contention, low throughput
- **Too small aggregate**: invariant leakage across transactions

Use aggregate for invariants that must be atomic. Everything else uses async policies/process managers.

```java
// Large aggregate (bad for high-write systems)
public class Order {
    private final OrderId id;
    private final List<OrderLine> lines;
    private Customer customer;        // Separate aggregate
    private Payment payment;          // Separate aggregate
    private Shipment shipment;        // Separate aggregate
    private List<Refund> refunds;      // Separate aggregate
}

// Small aggregates (good for high-write systems)
public class Order {
    private final OrderId id;
    private final List<OrderLine> lines;
    private CustomerId customerId;    // Reference by ID
    private PaymentId paymentId;       // Reference by ID
}

public class Customer {
    private final CustomerId id;
    private String name;
    private String email;
}

public class Payment {
    private final PaymentId id;
    private OrderId orderId;          // Reference by ID
    private Money amount;
    private PaymentStatus status;
}
```

### DDD and Microservices

Do not map one entity to one service. Map one **bounded context** to one service boundary when team ownership and change cadence align.

```
DDD + Microservices Mapping:

Bounded Context          Microservice
─────────────────────────────────────
Catalog Context      →  Catalog Service
Checkout Context     →  Order Service
Inventory Context    →  Inventory Service
Shipping Context     →  Shipping Service
Payment Context      →  Payment Service
```

### DDD and Event-Driven Architecture

Use domain events to integrate contexts while preserving autonomy.

```java
public class Order {
    public Order place() {
        // domain mutation
        this.status = OrderStatus.PLACED;
        registerDomainEvent(new OrderPlaced(id));
        return this;
    }
}

// Event handler in Inventory context
@EventListener
public void handleOrderPlaced(OrderPlacedEvent event) {
    inventoryService.reserveItems(event.getOrderLines());
}

// Event handler in Shipping context
@EventListener
public void handleOrderPlaced(OrderPlacedEvent event) {
    shippingService.prepareShipment(event.getOrderId());
}
```

Pair with Outbox to avoid dual-write inconsistency.

---

## DDD Patterns

### Repository Pattern

```java
public interface Repository<T, ID> {
    T save(T entity);
    Optional<T> findById(ID id);
    List<T> findAll();
    void delete(ID id);
}

public class OrderRepositoryImpl implements OrderRepository {
    private final EntityManager entityManager;

    @Override
    public Order save(Order order) {
        if (order.getId() == null) {
            entityManager.persist(order);
            return order;
        } else {
            return entityManager.merge(order);
        }
    }

    @Override
    public Optional<Order> findById(OrderId id) {
        return Optional.ofNullable(entityManager.find(Order.class, id));
    }
}
```

### Factory Pattern

```java
public interface OrderFactory {
    Order createOrder(CreateOrderCommand command);
}

@Component
public class OrderFactoryImpl implements OrderFactory {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Override
    public Order createOrder(CreateOrderCommand command) {
        Order order = new Order(orderRepository.nextId());

        for (CreateOrderLineCommand line : command.getLines()) {
            Product product = productRepository.findById(line.getProductId())
                .orElseThrow(() -> new ProductNotFoundException(line.getProductId()));
            order.addLine(product.getId(), line.getQuantity(), product.getPrice());
        }

        return order;
    }
}
```

### Specification Pattern

```java
public interface Specification<T> {
    boolean isSatisfiedBy(T candidate);
}

public class OrderSpecification {
    public static Specification<Order> isEligibleForDiscount() {
        return order -> order.getTotalAmount().compareTo(new Money("100")) >= 0;
    }

    public static Specification<Order> hasLoyalCustomer() {
        return order -> order.getCustomer().isLoyal();
    }

    public static Specification<Order> canBeCancelled() {
        return order -> order.getStatus() == OrderStatus.PLACED &&
                       order.getCreatedAt().isAfter(Instant.now().minus(24, ChronoUnit.HOURS));
    }
}
```

### Strategy Pattern

```java
public interface PricingStrategy {
    Money calculatePrice(Order order);
}

@Service
public class RegularPricingStrategy implements PricingStrategy {
    @Override
    public Money calculatePrice(Order order) {
        return order.getLines().stream()
            .map(OrderLine::getTotalPrice)
            .reduce(Money.ZERO, Money::add);
    }
}

@Service
public class DiscountPricingStrategy implements PricingStrategy {
    private final DiscountService discountService;

    @Override
    public Money calculatePrice(Order order) {
        Money regularPrice = new RegularPricingStrategy().calculatePrice(order);
        Money discount = discountService.calculateDiscount(order);
        return regularPrice.subtract(discount);
    }
}
```

### Decorator Pattern

```java
public interface OrderService {
    Order createOrder(CreateOrderCommand command);
}

@Service
public class OrderServiceImpl implements OrderService {
    @Override
    public Order createOrder(CreateOrderCommand command) {
        // Create order logic
    }
}

@Service
public class OrderServiceWithValidation implements OrderService {
    private final OrderService delegate;

    @Override
    public Order createOrder(CreateOrderCommand command) {
        validateCommand(command);
        return delegate.createOrder(command);
    }

    private void validateCommand(CreateOrderCommand command) {
        // Validation logic
    }
}

@Service
public class OrderServiceWithLogging implements OrderService {
    private final OrderService delegate;
    private final Logger logger;

    @Override
    public Order createOrder(CreateOrderCommand command) {
        logger.info("Creating order: {}", command);
        Order order = delegate.createOrder(command);
        logger.info("Order created: {}", order.getId());
        return order;
    }
}
```

---

## DDD Architecture Patterns

### Layered Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Views, DTOs)             │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Application Layer               │
│  (Application Services, Use Cases)       │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│            Domain Layer                  │
│  (Entities, Value Objects, Domain       │
│   Services, Events)                      │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Infrastructure Layer             │
│  (Repositories, External Services,      │
│   Persistence, Messaging)               │
└─────────────────────────────────────────┘
```

### Hexagonal Architecture

```
                    ┌─────────────────┐
                    │   Application   │
                    │      Core       │
                    │                 │
                    │  ┌───────────┐  │
                    │  │  Domain   │  │
                    │  │  Model    │  │
                    │  └───────────┘  │
                    │                 │
                    │  ┌───────────┐  │
                    │  │  Ports    │  │
                    │  │ (Interfaces) │ │
                    │  └───────────┘  │
                    └─────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
    │   Primary    │ │   Primary   │ │  Secondary │
    │   Adapters   │ │   Adapters  │ │  Adapters  │
    │  (REST, CLI) │ │ (Database,  │ │ (Message   │
    │              │ │  File)      │ │  Queue)    │
    └──────────────┘ └─────────────┘ └────────────┘
```

### Onion Architecture

```
┌─────────────────────────────────────────┐
│         Infrastructure Layer            │
│  (Frameworks, Database, UI)             │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Application Layer                │
│  (Use Cases, Application Services)      │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│           Domain Layer                   │
│  (Entities, Value Objects, Domain       │
│   Services, Events)                      │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Domain Core                     │
│  (Core Business Logic)                   │
└─────────────────────────────────────────┘
```

### Clean Architecture

```
┌─────────────────────────────────────────┐
│         Frameworks & Drivers             │
│  (Web, Database, Devices, UI)            │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Interface Adapters              │
│  (Controllers, Presenters, Gateways)     │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Use Cases                        │
│  (Application Business Rules)            │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Entities                        │
│  (Enterprise Business Rules)            │
└─────────────────────────────────────────┘
```

---

## DDD Implementation Examples

### E-Commerce Domain

```java
// Entities
public class Product {
    private final ProductId id;
    private String name;
    private String description;
    private Money price;
    private int stock;
}

public class Order {
    private final OrderId id;
    private CustomerId customerId;
    private OrderStatus status;
    private final List<OrderLine> lines;
    private Money total;
}

// Value Objects
public record Money(BigDecimal amount, Currency currency) {}
public record Address(String street, String city, String state, String zip) {}
public record Email(String value) {}

// Aggregates
public class Cart {
    private final CartId id;
    private CustomerId customerId;
    private final List<CartItem> items;
}

// Domain Events
public record OrderPlacedEvent(OrderId orderId, CustomerId customerId, Money total) {}
public record ProductAddedEvent(ProductId productId, String name, Money price) {}
```

### Banking Domain

```java
// Entities
public class Account {
    private final AccountId id;
    private AccountNumber accountNumber;
    private Money balance;
    private AccountStatus status;
}

public class Transaction {
    private final TransactionId id;
    private AccountId accountId;
    private Money amount;
    private TransactionType type;
    private Instant timestamp;
}

// Value Objects
public record AccountNumber(String value) {}
public record Money(BigDecimal amount, Currency currency) {}
public record Iban(String value) {}

// Aggregates
public class Ledger {
    private final LedgerId id;
    private final List<LedgerEntry> entries;
}

// Domain Events
public record MoneyDepositedEvent(AccountId accountId, Money amount) {}
public record MoneyWithdrawnEvent(AccountId accountId, Money amount) {}
public record TransferCompletedEvent(AccountId fromId, AccountId toId, Money amount) {}
```

### Healthcare Domain

```java
// Entities
public class Patient {
    private final PatientId id;
    private String name;
    private DateOfBirth dateOfBirth;
    private MedicalRecord medicalRecord;
}

public class Appointment {
    private final AppointmentId id;
    private PatientId patientId;
    private DoctorId doctorId;
    private LocalDateTime scheduledTime;
    private AppointmentStatus status;
}

// Value Objects
public record DateOfBirth(LocalDate date) {}
public record MedicalRecordNumber(String value) {}
public record Prescription(String medication, String dosage) {}

// Aggregates
public class MedicalRecord {
    private final MedicalRecordId id;
    private PatientId patientId;
    private final List<Prescription> prescriptions;
    private final List<Diagnosis> diagnoses;
}

// Domain Events
public record AppointmentScheduledEvent(AppointmentId appointmentId, PatientId patientId) {}
public record AppointmentCompletedEvent(AppointmentId appointmentId, DoctorId doctorId) {}
public record PrescriptionIssuedEvent(PatientId patientId, String medication) {}
```

---

## DDD and Database Design

### Aggregate Persistence

```java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @Column(name = "id")
    private OrderId id;

    @Column(name = "customer_id")
    private CustomerId customerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private OrderStatus status;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_id")
    private List<OrderLine> lines = new ArrayList<>();

    @Embedded
    private Money totalAmount;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}

@Entity
@Table(name = "order_lines")
public class OrderLine {
    @Id
    @Column(name = "id")
    private OrderLineId id;

    @Column(name = "product_id")
    private ProductId productId;

    @Column(name = "quantity")
    private int quantity;

    @Embedded
    private Money unitPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    private Order order;
}
```

### Value Object Persistence

```java
@Embeddable
public class Money {
    @Column(name = "amount")
    private BigDecimal amount;

    @Column(name = "currency")
    private String currency;

    // Constructor, getters, business methods
}

@Embeddable
public class Address {
    @Column(name = "street")
    private String street;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "zip_code")
    private String zipCode;

    // Constructor, getters, business methods
}

@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @Column(name = "id")
    private CustomerId id;

    @Column(name = "name")
    private String name;

    @Embedded
    @AttributeOverride(name = "value", column = @Column(name = "email"))
    private Email email;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "street", column = @Column(name = "address_street")),
        @AttributeOverride(name = "city", column = @Column(name = "address_city")),
        @AttributeOverride(name = "state", column = @Column(name = "address_state")),
        @AttributeOverride(name = "zipCode", column = @Column(name = "address_zip"))
    })
    private Address address;
}
```

### Event Sourcing & CQRS

:::info[Deep Dive: CQRS & Event Sourcing]
For a comprehensive guide on separating read and write models, synchronization via Domain Events, and Event Sourcing theory, see the centralized **[CQRS & Event Sourcing](./cqrs.md)** page.
:::

---

## DDD Testing Strategies

### Unit Testing

```java
@Test
public void testOrderPlacement() {
    // Arrange
    Order order = new Order(new OrderId("1"), new CustomerId("1"));
    order.addLine(new ProductId("p1"), 2, new Money("10.00"));

    // Act
    order.place();

    // Assert
    assertEquals(OrderStatus.PLACED, order.getStatus());
    assertFalse(order.getDomainEvents().isEmpty());
    assertTrue(order.getDomainEvents().get(0) instanceof OrderPlacedEvent);
}

@Test
public void testCannotAddLineToPlacedOrder() {
    // Arrange
    Order order = new Order(new OrderId("1"), new CustomerId("1"));
    order.place();

    // Act & Assert
    assertThrows(IllegalStateException.class, () -> {
        order.addLine(new ProductId("p1"), 1, new Money("10.00"));
    });
}
```

### Integration Testing

```java
@SpringBootTest
@Transactional
public class OrderServiceIntegrationTest {
    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    public void testCreateOrder() {
        // Arrange
        CreateOrderCommand command = new CreateOrderCommand(
            "customer-1",
            List.of(new CreateOrderLineCommand("product-1", 2))
        );

        // Act
        OrderId orderId = orderService.createOrder(command);

        // Assert
        Order order = orderRepository.findById(orderId).orElseThrow();
        assertNotNull(order);
        assertEquals(1, order.getLines().size());
    }
}
```

### Domain Testing

```java
public class OrderDomainTest {
    @Test
    public void testOrderInvariant_Max100Lines() {
        Order order = new Order(new OrderId("1"), new CustomerId("1"));

        // Add 100 lines
        for (int i = 0; i < 100; i++) {
            order.addLine(new ProductId("p" + i), 1, new Money("10.00"));
        }

        // 101st line should fail
        assertThrows(IllegalStateException.class, () -> {
            order.addLine(new ProductId("p100"), 1, new Money("10.00"));
        });
    }

    @Test
    public void testMoneyValueObject() {
        Money money1 = new Money(new BigDecimal("10.00"), Currency.USD);
        Money money2 = new Money(new BigDecimal("10.00"), Currency.USD);
        Money money3 = new Money(new BigDecimal("20.00"), Currency.USD);

        assertEquals(money1, money2);
        assertNotEquals(money1, money3);
        assertEquals(new Money("30.00"), money1.add(money3));
    }
}
```

---

## DDD Migration Patterns

### Strangler Fig Pattern

Gradually replace legacy system with new DDD-based system.

```java
// Phase 1: Create new bounded context
@Service
public class NewOrderService {
    private final OrderRepository orderRepository;

    public Order createOrder(CreateOrderCommand command) {
        Order order = new Order(command);
        orderRepository.save(order);
        return order;
    }
}

// Phase 2: Route traffic based on feature flag
@Service
public class OrderRoutingService {
    private final NewOrderService newOrderService;
    private final LegacyOrderService legacyOrderService;
    private final FeatureFlagService featureFlagService;

    public Order createOrder(CreateOrderCommand command) {
        if (featureFlagService.isEnabled("new-order-service", command.getCustomerId())) {
            return newOrderService.createOrder(command);
        } else {
            return legacyOrderService.createOrder(command);
        }
    }
}

// Phase 3: Migrate all traffic
@Service
public class OrderService {
    private final OrderRepository orderRepository;

    public Order createOrder(CreateOrderCommand command) {
        Order order = new Order(command);
        orderRepository.save(order);
        return order;
    }
}
```

### Anti-Corruption Layer

```java
@Service
public class LegacyPaymentAcl {
    private final LegacyPaymentClient legacyClient;

    public PaymentResult processPayment(PaymentRequest request) {
        // Translate to legacy format
        LegacyPaymentRequest legacyRequest = new LegacyPaymentRequest(
            request.getCardNumber(),
            request.getExpiryDate(),
            request.getAmount().getValue()
        );

        // Call legacy system
        LegacyPaymentResponse response = legacyClient.charge(legacyRequest);

        // Translate to domain model
        if (response.isSuccess()) {
            return PaymentResult.success(new PaymentId(response.getTransactionId()));
        } else {
            return PaymentResult.failure(response.getErrorMessage());
        }
    }
}
```

### Parallel Run

Run both systems in parallel and compare results.

```java
@Service
public class ParallelOrderService {
    private final NewOrderService newOrderService;
    private final LegacyOrderService legacyOrderService;
    private final ComparisonService comparisonService;

    public Order createOrder(CreateOrderCommand command) {
        // Create order in both systems
        Order newOrder = newOrderService.createOrder(command);
        Order legacyOrder = legacyOrderService.createOrder(command);

        // Compare results
        comparisonService.compare(newOrder, legacyOrder);

        // Return new order
        return newOrder;
    }
}
```

---

## Common Failure Modes

- Team uses DDD vocabulary but keeps shared database schema across contexts
- Over-modeling simple CRUD domains (accidental complexity)
- "One microservice per aggregate" explosion causing operational overhead
- Missing ACL leads to model leakage and tight coupling
- Anemic domain models (entities with no behavior)
- God aggregates (too large, causing performance issues)
- Ignoring ubiquitous language, leading to confusion
- Over-engineering simple problems

---

## Production Checklist

- Every context has explicit owner and glossary
- Context contracts are versioned
- Critical invariants are inside aggregate transactions
- Cross-context workflows use saga/outbox patterns
- Observability includes context-level KPIs (latency, error, drift)
- Domain events are versioned and backward compatible
- Aggregates are sized appropriately for write throughput
- ACLs are in place for external integrations
- Testing covers domain invariants and business rules
- Documentation includes context maps and ubiquitous language

---

## Real-World Implementations

### Netflix

Netflix uses DDD principles for their content delivery and recommendation systems:
- Bounded contexts for content catalog, recommendations, user profiles
- Domain events for real-time personalization
- Event-driven architecture for scalability

### Amazon

Amazon applies DDD in their e-commerce platform:
- Separate bounded contexts for product catalog, order management, fulfillment
- Domain services for complex business logic
- Event-driven integration across services

### Uber

Uber uses DDD for their ride-sharing platform:
- Bounded contexts for rides, payments, driver management
- Domain events for real-time tracking
- Saga pattern for cross-service transactions

### Spotify

Spotify implements DDD for their music streaming service:
- Bounded contexts for music catalog, playlists, user profiles
- Domain events for personalized recommendations
- Event-driven architecture for real-time updates

---

## Integration Patterns

### Event-Driven Integration

```java
@Service
public class OrderIntegrationService {
    private final EventPublisher eventPublisher;

    public void placeOrder(Order order) {
        order.place();
        orderRepository.save(order);

        // Publish domain events
        order.pullDomainEvents().forEach(eventPublisher::publish);
    }
}

@KafkaListener(topics = "order-events")
public class OrderEventHandler {
    @EventListener
    public void handle(OrderPlacedEvent event) {
        inventoryService.reserveItems(event.getOrderLines());
        notificationService.sendConfirmation(event.getCustomerId());
    }
}
```

### API Integration

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderApplicationService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody CreateOrderRequest request) {
        CreateOrderCommand command = request.toCommand();
        Order order = orderService.createOrder(command);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String id) {
        Order order = orderService.getOrder(new OrderId(id));
        return ResponseEntity.ok(OrderResponse.from(order));
    }
}
```

### Saga Integration

```java
@Service
public class OrderSagaOrchestrator {
    @SagaOrchestrationStart
    public void handle(OrderPlacedEvent event) {
        sagaManager.createSaga(event.getOrderId())
            .step("reserveInventory")
            .invokeParticipant(inventoryService::reserve)
            .onCompensation(inventoryService::release)
            .step("processPayment")
            .invokeParticipant(paymentService::process)
            .onCompensation(paymentService::refund)
            .step("shipOrder")
            .invokeParticipant(shippingService::ship)
            .onCompensation(shippingService::cancel)
            .start();
    }
}
```

---

## Pros and Cons

### DDD Pros

- **Clear domain understanding**: Shared language between developers and domain experts
- **Maintainable code**: Business logic is centralized and well-organized
- **Testable**: Domain logic can be tested independently of infrastructure
- **Scalable**: Bounded contexts can be deployed as separate microservices
- **Flexible**: Easier to evolve and adapt to changing business requirements

### DDD Cons

- **Learning curve**: Requires understanding of DDD concepts and patterns
- **Overhead**: Additional layers and abstractions can increase complexity
- **Not suitable for simple domains**: CRUD applications may not benefit from DDD
- **Team alignment**: Requires collaboration between developers and domain experts
- **Initial effort**: More upfront design and modeling required

---

## Interview Questions

### Q: What is the difference between an aggregate and an entity?

**A:** An entity has stable identity across state changes, while an aggregate is a consistency boundary containing one or more entities/value objects. Only the aggregate root is modified from outside.

### Q: How do bounded contexts reduce accidental coupling in microservices?

**A:** They define explicit language and model boundaries per domain area, preventing shared ambiguous schemas. Teams evolve independently through contracts instead of hidden cross-service assumptions.

### Q: When should you use an anti-corruption layer?

**A:** Use ACL when integrating with legacy/external models you do not control. It translates concepts and protects your domain from upstream model leakage.

### Q: How do you choose aggregate boundaries for high-write systems?

**A:** Keep aggregates small and aligned to invariants that must be transactionally consistent. Split hot aggregates to reduce lock contention and increase write parallelism.

### Q: Why can one bounded context map to one service, but not always?

**A:** A bounded context is a conceptual boundary, not a mandatory deployment unit. One context may need multiple services for scale, or multiple small contexts may share one service early on.

### Q: How does DDD integrate with outbox and saga patterns?

**A:** Aggregates emit domain events; outbox publishes them reliably after commit; sagas coordinate cross-context workflows. This preserves local consistency while enabling eventual global consistency.

### Q: What are signs a team is over-applying DDD?

**A:** Excessive abstraction, ceremony-heavy modeling, and slow delivery for simple CRUD needs. If domain complexity is low, a simpler modular design is usually better.

### Q: How would you model payment and ledger contexts with different consistency needs?

**A:** Keep ledger as strongly consistent, append-only source of truth; let payment orchestration be eventually consistent with retries/compensation. Bridge with immutable events and strict reconciliation.

### Q: What is the difference between an entity and a value object?

**A:** Entities have identity and are defined by who they are, while value objects are defined by their attributes and have no identity. Entities are mutable, value objects are immutable.

### Q: How do you handle domain events in a distributed system?

**A:** Use the outbox pattern to ensure events are published atomically with state changes. Use message brokers for reliable delivery. Implement idempotent consumers to handle duplicate events.

### Q: What is the ubiquitous language and why is it important?

**A:** Ubiquitous language is a shared vocabulary used by both developers and domain experts. It ensures everyone understands the domain the same way, reducing miscommunication and improving code quality.

### Q: How do you design aggregates for high-throughput systems?

**A:** Keep aggregates small, minimize cross-aggregate references, use eventual consistency for non-critical operations, and consider splitting hot aggregates to reduce contention.

### Q: What is the difference between layered architecture and hexagonal architecture?

**A:** Layered architecture organizes code by technical layers (presentation, application, domain, infrastructure). Hexagonal architecture organizes by core domain and adapters, with the core having no dependencies on external systems.

### Q: How do you handle versioning of domain events?

**A:** Use event versioning, maintain backward compatibility, use schema evolution strategies, and provide event transformers for old event versions.

### Q: What is the specification pattern and when would you use it?

**A:** Specification pattern encapsulates business rules as reusable predicates. Use it when you have complex business rules that need to be combined and reused across the application.

### Q: How do you test domain logic in DDD?

**A:** Write unit tests for entities, value objects, and domain services. Test invariants and business rules. Use domain-specific language in tests to improve readability.

### Q: What is the difference between domain services and application services?

**A:** Domain services contain business logic that doesn't fit in entities or value objects. Application services orchestrate use cases and coordinate domain objects.

### Q: How do you handle cross-aggregate transactions?

**A:** Use eventual consistency, sagas, or domain events. Avoid distributed transactions when possible. Use compensating transactions for rollback.

### Q: What is the difference between CQRS and traditional CRUD?

**A:** CQRS separates read and write models, allowing independent optimization. Traditional CRUD uses the same model for both reads and writes, which can lead to performance issues in complex domains.

### Q: How do you migrate a legacy system to DDD?

**A:** Use the strangler fig pattern, create new bounded contexts incrementally, implement anti-corruption layers, and gradually replace legacy functionality.

---

## Senior Deep Dive: Advanced Topics

### Bounded Context Evolution

Bounded contexts evolve over time as the domain understanding deepens.

```java
// Phase 1: Monolithic context
public class OrderService {
    public Order createOrder(CreateOrderCommand command) {
        // Order creation, payment, shipping all in one
    }
}

// Phase 2: Split into bounded contexts
// Order Context
public class OrderContext {
    public Order createOrder(CreateOrderCommand command) {
        // Only order creation
    }
}

// Payment Context
public class PaymentContext {
    public Payment processPayment(PaymentCommand command) {
        // Only payment processing
    }
}

// Shipping Context
public class ShippingContext {
    public Shipment shipOrder(ShippingCommand command) {
        // Only shipping
    }
}

// Phase 3: Event-driven integration
public class OrderContext {
    public Order createOrder(CreateOrderCommand command) {
        Order order = new Order(command);
        orderRepository.save(order);
        eventPublisher.publish(new OrderCreatedEvent(order.getId()));
        return order;
    }
}
```

### Domain Event Versioning

```java
public interface DomainEvent {
    String eventType();
    String eventVersion();
    Instant occurredOn();
}

public record OrderPlacedEventV1(
    String orderId,
    String customerId,
    BigDecimal totalAmount
) implements DomainEvent {
    @Override
    public String eventType() { return "OrderPlaced"; }
    @Override
    public String eventVersion() { return "1.0"; }
    @Override
    public Instant occurredOn() { return Instant.now(); }
}

public record OrderPlacedEventV2(
    String orderId,
    String customerId,
    BigDecimal totalAmount,
    String currency,
    List<OrderLine> lines
) implements DomainEvent {
    @Override
    public String eventType() { return "OrderPlaced"; }
    @Override
    public String eventVersion() { return "2.0"; }
    @Override
    public Instant occurredOn() { return Instant.now(); }
}

// Event transformer
public class EventTransformer {
    public OrderPlacedEventV2 transform(OrderPlacedEventV1 v1) {
        return new OrderPlacedEventV2(
            v1.orderId(),
            v1.customerId(),
            v1.totalAmount(),
            "USD",
            List.of()
        );
    }
}
```

### Aggregate Concurrency

```java
public class Order {
    @Version
    private Long version;

    public void update(UpdateOrderCommand command) {
        // Business logic
        this.version++;
    }
}

// Optimistic concurrency control
@Service
public class OrderService {
    public void updateOrder(OrderId orderId, UpdateOrderCommand command) {
        try {
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
            order.update(command);
            orderRepository.save(order);
        } catch (OptimisticLockException e) {
            throw new ConcurrentModificationException("Order was modified by another transaction");
        }
    }
}
```

### DDD and Serverless

```java
// AWS Lambda function for order creation
public class CreateOrderHandler implements RequestHandler<CreateOrderRequest, OrderResponse> {
    private final OrderService orderService;

    @Override
    public OrderResponse handleRequest(CreateOrderRequest request, Context context) {
        CreateOrderCommand command = request.toCommand();
        Order order = orderService.createOrder(command);
        return OrderResponse.from(order);
    }
}

// Event-driven serverless architecture
public class OrderPlacedEventHandler implements RequestHandler<OrderPlacedEvent, Void> {
    private final InventoryService inventoryService;

    @Override
    public Void handleRequest(OrderPlacedEvent event, Context context) {
        inventoryService.reserveItems(event.getOrderLines());
        return null;
    }
}
```

### DDD and GraphQL

```java
// GraphQL schema for Order context
type Order {
    id: ID!
    customerId: ID!
    status: OrderStatus!
    lines: [OrderLine!]!
    totalAmount: Money!
}

type OrderLine {
    id: ID!
    productId: ID!
    quantity: Int!
    unitPrice: Money!
}

type Query {
    order(id: ID!): Order
    orders(customerId: ID!): [Order!]!
}

type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    cancelOrder(id: ID!): Order!
}

// GraphQL resolver
@Component
public class OrderQueryResolver implements GraphQLQueryResolver {
    private final OrderQueryService orderQueryService;

    public Order order(String id) {
        return orderQueryService.getOrder(new OrderId(id));
    }

    public List<Order> orders(String customerId) {
        return orderQueryService.getCustomerOrders(new CustomerId(customerId));
    }
}
```

---

## Additional Resources

### Books
- "Domain-Driven Design" by Eric Evans
- "Implementing Domain-Driven Design" by Vaughn Vernon
- "Patterns, Principles, and Practices of Domain-Driven Design" by Scott Millett
- "Domain-Driven Design Distilled" by Vaughn Vernon

### Papers
- "Domain-Driven Design Reference" by Eric Evans
- "Strategic Domain-Driven Design" by Alberto Brandolini

### Tools
- **ArchUnit**: Architecture testing
- **JPA**: ORM for persistence
- **Spring Data**: Repository pattern implementation
- **Axon Framework**: CQRS and event sourcing

### Communities
- **DDD Community**: https://dddcommunity.org/
- **Domain-Driven Design Slack**: DDD community Slack workspace

---

## Best Practices

### Domain Modeling
1. Start with ubiquitous language
2. Focus on business value, not technical implementation
3. Keep aggregates small and focused
4. Use value objects for immutability
5. Enforce invariants within aggregates

### Architecture
1. Separate domain from infrastructure
2. Use dependency inversion
3. Implement anti-corruption layers for external integrations
4. Design bounded contexts around business capabilities
5. Use events for cross-context communication

### Implementation
1. Write tests for domain logic
2. Use factories for complex object creation
3. Implement repositories for aggregate persistence
4. Use domain events for side effects
5. Handle concurrency with optimistic locking

### Team Collaboration
1. Involve domain experts in modeling sessions
2. Document ubiquitous language
3. Create context maps
4. Regularly review and refine domain models
5. Share knowledge across teams

### Evolution
1. Start with monolith, split when needed
2. Use strangler fig pattern for migration
3. Version domain events carefully
4. Plan for backward compatibility
5. Monitor and refactor regularly
