---
id: testing-concepts
title: Testing Concepts
sidebar_label: 🧪 Concepts & Best Practices
---

# Testing Concepts & Best Practices

Writing tests is an essential part of the Software Development Life Cycle (SDLC) that ensures your code works reliably and prevents regressions as the codebase evolves.

## Types of Tests

### Unit Testing
Unit tests isolate a specific section of code (typically a single class or function) and verify its correctness. They are fast, deterministic, and should not rely on external dependencies like databases, networks, or file systems. Mocks and stubs are heavily used to simulate these external interactions.

### Integration Testing
Integration tests evaluate how different modules or system components work together. They often involve checking communication with databases, message queues, and external APIs. These are slower than unit tests but provide higher confidence that the system works as a whole.

## Best Practices

### The FIRST Principles of Unit Testing
- **Fast**: Tests should run quickly. If they are slow, developers won't run them frequently.
- **Independent**: Tests should not rely on the state of other tests. They should be able to run in any order.
- **Repeatable**: Tests should produce the same results consistently, regardless of the environment.
- **Self-Validating**: Tests should automatically detect if they passed or failed, without requiring manual inspection.
- **Timely**: Tests should be written alongside the production code, ideally using Test-Driven Development (TDD) or immediately after feature implementation.

### Given-When-Then (BDD) / Arrange-Act-Assert
Structure your test methods clearly using the **Given-When-Then** or **Arrange-Act-Assert (AAA)** patterns.

```java
@Test
void calculateTotal_ShouldReturnSum() {
    // Arrange (Given): Set up the initial state and mock dependencies
    Order order = new Order(List.of(new Item(100), new Item(50)));
    
    // Act (When): Execute the method under test
    double total = calculator.calculateTotal(order);
    
    // Assert (Then): Verify the expected outcome
    assertEquals(150, total);
}
```

### Mocking vs Stubbing vs Spying
- **Mock**: Used to verify behavior. You check if a specific method was called with expected arguments.
- **Stub**: Used to provide predetermined responses to method calls during a test.
- **Spy**: A partial mock. It wraps a real object, allowing you to track its method calls while still executing its actual behavior unless specifically stubbed.

---

## Interview Questions

### Q: How do you decide what belongs in unit tests vs integration tests in a microservice?
**A:** Keep business rules and pure logic in unit tests. Put framework wiring, persistence, serialization, and network boundaries in integration tests.

### Q: What does a healthy test pyramid look like for backend services?
**A:** Many fast unit tests, a smaller layer of integration tests, and very few end-to-end tests for critical flows only.

### Q: How do you reduce flaky tests in CI?
**A:** Remove time and ordering dependencies, isolate shared state, control clocks/randomness, and avoid real external services in deterministic suites.

### Q: When should you use consumer-driven contract tests?
**A:** When teams evolve APIs independently and need strong compatibility checks between service providers and consumers.

### Q: What is the risk of over-mocking?
**A:** Tests become coupled to implementation details and pass even when real integration behavior is broken.

### Q: How do you test eventual consistency workflows?
**A:** Assert observable outcomes with retries/time bounds, verify emitted events, and validate idempotency rather than synchronous immediate state.

### Q: What is your strategy for testing failure modes?
**A:** Add tests for timeouts, retries, partial failures, dead-letter flows, and fallback behavior at each external boundary.

### Q: How do you measure test effectiveness beyond coverage percentage?
**A:** Track escaped defects, mutation score trends, flaky-test rate, and mean time to detect regressions in CI.
