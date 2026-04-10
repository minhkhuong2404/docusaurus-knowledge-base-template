---
id: chapter-09-lsp
title: "Chapter 9: LSP — The Liskov Substitution Principle"
sidebar_position: 3
description: >
  If S is a subtype of T, objects of type S must be substitutable for objects of type T without altering the correctness of the program. LSP governs not just inheritance but any interface contract — and its violation breaks architectural boundaries.
tags:
  - solid
  - lsp
  - liskov-substitution
  - design-principles
  - inheritance
  - contracts
---

# Chapter 9: LSP — The Liskov Substitution Principle

> _"If for each object o1 of type S there is an object o2 of type T such that for all programs P defined in terms of T, the behavior of P is unchanged when o1 is substituted for o2 then S is a subtype of T."_  
> — Barbara Liskov, 1988

## 🎓 For New Learners

### The Simple Version

If class `B` extends class `A`, you should be able to use `B` anywhere `A` is expected — and the program should still work correctly. No surprises. No special-casing. No checking `instanceof`.

The caller should never need to know which subtype it's dealing with.

### The Square/Rectangle Problem

The classic LSP violation: `Square` extends `Rectangle`.

```java
public class Rectangle {
    protected int width, height;
    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int area() { return width * height; }
}

public class Square extends Rectangle {
    @Override public void setWidth(int w) { width = height = w; }   // forces equal sides
    @Override public void setHeight(int h) { width = height = h; }  // forces equal sides
}
```

This breaks the caller's assumptions:

```java
void resizeAndTest(Rectangle r) {
    r.setWidth(5);
    r.setHeight(4);
    assert r.area() == 20;  // passes for Rectangle, FAILS for Square
}
```

`Square` is NOT substitutable for `Rectangle`. LSP is violated. The fix: don't use inheritance here. `Square` and `Rectangle` are different shapes with different contracts.

### Beyond Inheritance: LSP and Interfaces

Martin extends LSP to all interface contracts, not just class hierarchies. If you implement an interface, your implementation must honor the **full behavioral contract** that the interface implies — not just its method signatures.

A REST API is an implicit interface. If one service accepts `DELETE /orders/{id}` and responds with 200, and another service accepts the same route but returns 404 for valid IDs, callers cannot treat these uniformly. **LSP is violated at the architectural level**.

---

## 🔬 Senior Deep Dive

### LSP as a Contract Rule

LSP is fundamentally about **behavioral contracts**:

- **Preconditions** of a subtype method cannot be stronger than the supertype's
- **Postconditions** of a subtype method cannot be weaker than the supertype's
- **Invariants** of the supertype must be preserved by the subtype

Violations force callers to add `instanceof` checks, `if (type == X)` branches, or special-case handling — all of which violate OCP and make the code fragile.

### Architectural Impact: The REST Example

Martin's architectural example of LSP violation: a dispatch system routes REST calls to different taxi aggregators. All aggregators must honor the same REST contract. If one aggregator uses a different field name for driver ID (`driver_uuid` vs `driverId`), the dispatcher needs a special case. Every new aggregator might add a new special case.

This is LSP violation at the **service boundary** level. The fix: enforce a strict interface contract (schema) across all aggregators — or build an adapter per aggregator that translates to the canonical contract.

### Spring Patterns — Honoring LSP

```java
// Interface contract: findById returns Optional with the entity, or empty if not found
public interface OrderRepository {
    Optional<Order> findById(OrderId id);
}

// LSP violation: throws exception instead of returning empty Optional
@Repository
public class JpaOrderRepository implements OrderRepository {
    public Optional<Order> findById(OrderId id) {
        Order o = em.find(Order.class, id.value());
        if (o == null) throw new OrderNotFoundException(id);  // violates contract!
        return Optional.of(o);
    }
}

// LSP compliant
@Repository
public class JpaOrderRepository implements OrderRepository {
    public Optional<Order> findById(OrderId id) {
        return Optional.ofNullable(em.find(Order.class, id.value()));
    }
}
```

Callers written against the interface expect `Optional.empty()` for missing entities. Throwing an exception instead breaks their assumptions — LSP violation.

### Detecting LSP Violations

- `instanceof` checks in calling code → caller doesn't trust the contract
- `if (type == X) { special case }` in generic code → subtypes differ from the supertype contract
- Tests that pass for one implementation but fail for another with identical inputs → substitutability broken
- Overridden methods that weaken postconditions (return null when interface promises non-null)

### Relationship to Other Principles

- **LSP enables OCP**: OCP says "closed for modification." You can only extend through abstraction if subtypes are truly substitutable. LSP is the precondition for OCP to work.
- **LSP violated → ISP needed**: When subtypes can't honor the full contract, it often means the interface is too large. Splitting it (ISP) lets each subtype honor only the contract it can fulfill.

---

## Summary

| Concept | Key Point |
|---|---|
| LSP definition | Subtypes must be substitutable for their base types without breaking programs |
| Square/Rectangle | Classic example: geometric "is-a" doesn't mean substitutable |
| Beyond inheritance | Applies to all interface contracts, including REST APIs and microservice boundaries |
| Preconditions/postconditions | Subtypes can't strengthen preconditions or weaken postconditions |
| Violation signal | `instanceof` checks and special cases in calling code |
| Architecture impact | LSP violation at service level forces fragile dispatcher special-casing |
