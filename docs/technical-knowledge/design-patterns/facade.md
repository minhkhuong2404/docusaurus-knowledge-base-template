---
id: facade
title: "Facade Pattern"
slug: facade
description: Explains the Facade pattern for exposing a simple interface over complex subsystems to reduce coupling.
tags: [design-patterns, java, structural, facade]
---

# Facade Pattern

> **Category:** Structural  
> **Intent:** Provide a simplified, unified interface to a complex subsystem.

---

## Overview

The Facade pattern provides a single class with a simplified interface that hides the complexity of an underlying subsystem. Instead of requiring clients to interact with multiple subsystem classes, the facade offers high-level methods that orchestrate the subsystem internally.

**Key characteristics:**
- A single entry point for a complex subsystem
- Clients use the facade; the subsystem classes remain accessible if needed
- Does not add new functionality — it simply organizes and simplifies access

---

## When to Use

- A subsystem has many classes and complex interactions
- You want to reduce coupling between client code and the subsystem
- Wrapping a complex library or legacy code with a cleaner API
- Providing a simple default interface while keeping advanced options accessible
- Layering a system (each layer provides a facade to the layer below)

---

## How It Works

### E-Commerce Order Processing

```java
// ── Complex subsystem classes ──

public class InventoryService {
    public boolean checkStock(String productId) {
        System.out.println("Checking stock for product: " + productId);
        return true;  // simplified
    }

    public void reserveStock(String productId, int quantity) {
        System.out.println("Reserved " + quantity + "x " + productId);
    }
}

public class PaymentService {
    public boolean validatePaymentMethod(String paymentMethod) {
        System.out.println("Validating payment method: " + paymentMethod);
        return true;
    }

    public String processPayment(String orderId, double amount, String paymentMethod) {
        System.out.println("Processing $" + amount + " payment for order " + orderId);
        return "TXN-" + orderId;
    }
}

public class ShippingService {
    public double calculateShipping(String address, double weight) {
        System.out.println("Calculating shipping to: " + address);
        return 9.99;
    }

    public String createShipment(String orderId, String address) {
        System.out.println("Creating shipment for order " + orderId);
        return "TRACK-" + orderId;
    }
}

public class NotificationService {
    public void sendOrderConfirmation(String email, String orderId, String trackingId) {
        System.out.println("Sending confirmation to " + email + " — Order: " + orderId + ", Tracking: " + trackingId);
    }
}

// ── Facade — simplified interface ──

public class OrderFacade {
    private final InventoryService inventory;
    private final PaymentService payment;
    private final ShippingService shipping;
    private final NotificationService notifications;

    public OrderFacade() {
        this.inventory = new InventoryService();
        this.payment = new PaymentService();
        this.shipping = new ShippingService();
        this.notifications = new NotificationService();
    }

    /**
     * One method replaces a multi-step orchestration across 4 services.
     */
    public String placeOrder(String productId, int quantity, String paymentMethod,
                             String address, String email) {
        // Step 1: Check inventory
        if (!inventory.checkStock(productId)) {
            throw new RuntimeException("Product " + productId + " is out of stock");
        }
        inventory.reserveStock(productId, quantity);

        // Step 2: Process payment
        if (!payment.validatePaymentMethod(paymentMethod)) {
            throw new RuntimeException("Invalid payment method");
        }
        double amount = quantity * 29.99;  // simplified pricing
        String transactionId = payment.processPayment("ORD-001", amount, paymentMethod);

        // Step 3: Arrange shipping
        String trackingId = shipping.createShipment("ORD-001", address);

        // Step 4: Notify customer
        notifications.sendOrderConfirmation(email, "ORD-001", trackingId);

        return trackingId;
    }
}

// ── Client — interacts with one simple method ──
OrderFacade facade = new OrderFacade();
String tracking = facade.placeOrder("PROD-42", 2, "CREDIT_CARD",
    "123 Main St, City", "customer@email.com");
```

### Home Theater Example

```java
public class HomeFacade {
    private final TV tv;
    private final SoundSystem sound;
    private final StreamingService streaming;
    private final Lights lights;

    public HomeFacade(TV tv, SoundSystem sound, StreamingService streaming, Lights lights) {
        this.tv = tv;
        this.sound = sound;
        this.streaming = streaming;
        this.lights = lights;
    }

    public void watchMovie(String movie) {
        lights.dim(20);
        tv.turnOn();
        tv.setInput("HDMI1");
        sound.turnOn();
        sound.setMode("SURROUND");
        sound.setVolume(50);
        streaming.login();
        streaming.play(movie);
    }

    public void endMovie() {
        streaming.stop();
        sound.turnOff();
        tv.turnOff();
        lights.dim(100);
    }
}

// Client: one call instead of 8
facade.watchMovie("Inception");
```

---

## Facade vs Adapter

| Aspect | Facade | Adapter |
|--------|--------|---------|
| **Purpose** | Simplify a complex API | Make incompatible interfaces compatible |
| **Direction** | Creates a new, simpler interface | Translates between existing interfaces |
| **Scope** | Wraps an entire subsystem | Wraps a single class |
| **Knowledge** | Knows the subsystem's internals | Knows only the adaptee |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Reduces complexity for clients | Can become a "god object" if it grows too large |
| Promotes loose coupling | Hides subsystem details — can mask performance issues |
| Provides a clear entry point | Oversimplification may limit access to advanced features |
| Easy to add layers of abstraction | Facade changes when subsystem changes |
| Simplifies testing for clients | |

---

## Interview Questions

**Q1: What is the Facade pattern and how does it simplify interactions with complex systems?**

The Facade pattern provides a simplified, unified interface to a complex subsystem of classes. It hides internal complexity behind a single interface, reducing the number of objects and interactions clients need to manage. Clients call one facade method instead of orchestrating multiple subsystem calls, making the code cleaner and more maintainable.

**Q2: How does the Facade pattern differ from the Adapter pattern?**

The Facade creates a new, simpler interface to reduce complexity — it wraps an entire subsystem. The Adapter translates one interface into another to make incompatible classes work together — it wraps a single class. Facade simplifies; Adapter enables compatibility.

**Q3: Can you provide an example of how to implement the Facade pattern in Java?**

An e-commerce order processing system with separate services for inventory, payment, shipping, and notifications. The `OrderFacade` provides a single `placeOrder()` method that internally checks stock, processes payment, arranges shipping, and sends confirmation. The client makes one call instead of coordinating four separate services.

**Q4: What are the advantages of using the Facade pattern in large applications?**

Reduced complexity — clear, high-level interface for clients. Loose coupling — clients don't depend on subsystem classes directly. Easier maintenance — subsystem changes don't ripple to client code. Improved testability — mock the facade instead of multiple subsystem classes. Clear system layering — each layer provides a facade to the layer below.

**Q5: In what situations would using the Facade pattern be a bad idea?**

When clients need direct, fine-grained access to subsystem features that the facade doesn't expose. When the facade becomes a "god class" that does too much. When hiding the subsystem masks important performance characteristics. When the overhead of maintaining the facade (keeping it in sync with subsystem changes) outweighs the simplification benefit.

---

## Advanced Editorial Pass: Facade as an Anti-Coupling Layer

### Strategic Benefits
- Reduces client coupling to subsystem churn and sequencing complexity.
- Creates a stable capability-oriented API for product teams.
- Improves migration safety by centralizing integration orchestration.

### Failure Modes
- Facade evolves into a god object with broad hidden logic.
- Teams bypass facade for convenience, fragmenting integration contracts.
- Facade error model becomes too generic to support good recovery decisions.

### Senior Engineering Heuristics
1. Keep facade methods aligned to business capabilities, not subsystem endpoints.
2. Preserve meaningful domain errors; do not over-flatten failure information.
3. Track bypass rates and enforce architecture boundaries where needed.

### Compare Next
- [Adapter Pattern](./adapter.md)
- [Proxy Pattern](./proxy.md)
- [Abstract Factory Pattern](./abstract-factory.md)
