---
id: mediator
title: "Mediator Pattern"
slug: mediator
description: Explains the Mediator pattern used to reduce chaotic dependencies between objects by centralizing their communication.
tags: [design-patterns, java, behavioral, mediator]
---

# Mediator Pattern

> **Category:** Behavioral  
> **Intent:** Define an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly, and it lets you vary their interaction independently.

---

## Overview

When an application grows, the number of components usually increases. If objects communicate directly with one another, the system quickly resembles a plate of spaghetti (a "tightly coupled" matrix). A change in one object forces changes in multiple related objects.

The Mediator pattern solves this by introducing a central authority—a "Mediator" object. Instead of components talking directly to each other, they send messages to the mediator. The mediator knows the logic of how to route and process these messages, reducing the connections between objects from many-to-many to one-to-many.

**Key characteristics:**
- Extracts communication logic into a single dedicated class.
- Replaces tightly coupled peer-to-peer communication with a star topology centering on the mediator.
- Components only know about the Mediator interface, not about other components.

---

## When to Use

- When a system has a massive amount of interlocking, communicating classes making it hard to understand and maintain.
- Reusing a component is difficult because it relies on and communicates directly with multiple other specific components.
- You find yourself creating multiple subclasses of components just to change how they communicate.
- Commonly used in GUI programming (e.g., buttons, text boxes, and checkboxes affecting each others' states).

---

## How It Works

### Air Traffic Control Example

If planes communicated directly with each other to avoid colliding, it would be chaos. Instead, they all communicate with the Air Traffic Control (ATC) tower, which mediates and orchestrates their actions.

```java
// 1. Mediator Interface
public interface ATCMediator {
    void registerFlight(Flight flight);
    void requestTakeoff(Flight flight);
    void requestLanding(Flight flight);
}

// 2. Colleague Abstract Class / Interface
public abstract class Flight {
    protected ATCMediator mediator;
    private String flightNumber;

    public Flight(ATCMediator mediator, String flightNumber) {
        this.mediator = mediator;
        this.flightNumber = flightNumber;
        mediator.registerFlight(this);
    }
    
    public String getFlightNumber() { return flightNumber; }
    
    public void sendLandingRequest() {
        mediator.requestLanding(this);
    }
    
    public void sendTakeoffRequest() {
        mediator.requestTakeoff(this);
    }

    public abstract void receiveMessage(String msg);
}

// 3. Concrete Colleague
public class CommercialFlight extends Flight {

    public CommercialFlight(ATCMediator mediator, String flightNumber) {
        super(mediator, flightNumber);
    }

    @Override
    public void receiveMessage(String msg) {
        System.out.println("Flight " + getFlightNumber() + " received: " + msg);
    }
}

// 4. Concrete Mediator
public class ATCMediatorImpl implements ATCMediator {
    private List<Flight> flights = new ArrayList<>();
    private Flight currentlyLandingOrTakingOff;

    @Override
    public void registerFlight(Flight flight) {
        flights.add(flight);
    }

    @Override
    public void requestTakeoff(Flight flight) {
        if (currentlyLandingOrTakingOff == null) {
            currentlyLandingOrTakingOff = flight;
            System.out.println("ATC: Cleared for takeoff " + flight.getFlightNumber());
            // Notify others
            for (Flight f : flights) {
                if (f != flight) {
                    f.receiveMessage("Runway occupied by " + flight.getFlightNumber() + " taking off.");
                }
            }
            // After taking off, clear the runway
            currentlyLandingOrTakingOff = null;
        } else {
            System.out.println("ATC: Denied takeoff " + flight.getFlightNumber() + ", runway occupied.");
        }
    }

    @Override
    public void requestLanding(Flight flight) {
        if (currentlyLandingOrTakingOff == null) {
            currentlyLandingOrTakingOff = flight;
            System.out.println("ATC: Cleared to land " + flight.getFlightNumber());
            currentlyLandingOrTakingOff = null;
        } else {
            System.out.println("ATC: Denied landing " + flight.getFlightNumber() + ", runway occupied. Please hold.");
        }
    }
}
```

### Usage

```java
// Setup the Mediator
ATCMediator atc = new ATCMediatorImpl();

// Setup the colleagues (Flights)
Flight flight101 = new CommercialFlight(atc, "UA101");
Flight flight202 = new CommercialFlight(atc, "AA202");
Flight flight303 = new CommercialFlight(atc, "DL303");

// They only talk to ATC, not to each other.
flight101.sendTakeoffRequest();
flight202.sendLandingRequest(); 
```

**Output:**
```
ATC: Cleared for takeoff UA101
Flight AA202 received: Runway occupied by UA101 taking off.
Flight DL303 received: Runway occupied by UA101 taking off.
ATC: Cleared to land AA202
```

---

## Real-World Examples

| Framework/Library | Description |
|-------------------|-------------|
| **Spring MVC (`DispatcherServlet`)** | It acts as a Mediator between HTTP requests, handlers (controllers), and view resolvers. Controllers don't call views directly. |
| **Java Message Service (JMS) / Event Buses** | Topics and message brokers act as mediators. Producers publish to the broker; consumers read from it—they do not know each other. |
| `java.util.Timer` | Acts as a mediator between tasks (`TimerTask`) and the background thread. |

---

## Mediator vs. Observer vs. Facade

| Pattern | Goal / Intent | Topology |
|---------|---------------|----------|
| **Mediator** | Centralizes complex communication between *peers* (colleagues). They mutually affect each other. | Star (bidirectional) |
| **Observer** | One object broadcasts state changes to multiple listeners. | 1-to-many (unidirectional) |
| **Facade** | Provides a simplified interface to a complex subsystem. | 1-to-subsystem (structural) |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Decouples components, reducing dependencies from M*N to M+N. | The Mediator can quickly become a **God Object** (an architectural anti-pattern) if it handles too much logic. |
| Single Responsibility Principle: Extracts communication logic into one place. | Maintaining a massive mediator class can become a bottleneck. |
| Open/Closed Principle: You can add new mediators without modifying colleague classes. | |
| Makes colleagues completely reusable in other contexts (by injecting a blank mediator). | |

---

## Interview Questions

**Q1: What does the Mediator design pattern achieve?**

It restricts direct communications between a set of interacting objects and forces them to collaborate only via a mediator object. This reduces chaotic network-like "spaghetti" dependencies down to a clean star topology, decreasing coupling.

**Q2: How does the Mediator pattern differ from the Observer pattern?**

While both are behavioral patterns used to share communication, the Observer pattern creates a unidirectional 1-to-many relationship where publishers push events to subscribers who passively react. The Mediator pattern centrally orchestrates complex, bidirectional, many-to-many communications where multiple objects act both as senders and receivers interacting dynamically. *Note: They are often used together, where the Mediator uses the Observer pattern to notify colleagues.*

**Q3: What is the primary risk of using the Mediator pattern?**

Because all communication logic is centralized, the Mediator object can easily bloat into a monolithic, overly complex "God Object" that knows too much and does too much, making it harder to test and maintain than the original spaghetti code.

**Q4: How does `DispatcherServlet` in Spring behave like a Mediator?**

In Spring MVC, controllers do not invoke Views directly, nor do they process raw HTTP protocol details. The `DispatcherServlet` sits in the middle. It takes incoming HTTP traffic, asks the HandlerMapping for the correct Controller, executes the Controller, takes the returned Model, and asks the ViewResolver to render the response. It mediates the entire lifecycle.

---

## Advanced Editorial Pass: Mediator as an API Gateway or Broker

### Strategic Payoff
- Excellent for stateful GUI orchestration (disabling 'Submit' if 'Agree' checkbox isn't ticked, without coupling the checkbox to the submit button).
- In microservices, API Gateways and Message Brokers act as architectural-level Mediators, decoupling domains.
- Enhances testability; you can test colleagues in complete isolation by mocking the mediator.

### Non-Obvious Risks
- **The "God Object" Anti-pattern:** If a Mediator encapsulates business logic rather than just *routing* logic, it violates the Single Responsibility Principle and becomes impossible to maintain.
- **Hidden Complexity:** Moving the spaghetti from the classes into a single Mediator doesn't actually delete the spaghetti; it just puts it in one box.

### Implementation Heuristics
1. Keep the Mediator strictly focused on routing and coordination. It should tell components *when* to execute, but not *how*.
2. If the mediator logic gets too vast, consider splitting it using aspects of the Observer pattern (an event bus) rather than hardcoded method calls.
3. Use interfaces for both Mediators and Colleagues to prevent circular dependency build paths.

### Compare Next
- [Observer Pattern](./observer.md)
- [Facade Pattern](./facade.md)
- [Command Pattern](./command.md)
