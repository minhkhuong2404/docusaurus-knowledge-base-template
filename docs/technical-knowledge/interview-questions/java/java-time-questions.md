---
id: java-date-time-api
title: Java 8+ Date Time API
sidebar_label: Date Time API
description: Java 8+ Date Time API interview questions covering thread safety, Instant vs ZonedDateTime, Clock mocking, and Daylight Saving Time (DST) handling.
tags: [java, interview, java-8, date-time]
---

# Java 8+ Date Time API Interview Questions & Best Practices

---

## Core Questions & Best Practices

### Q1. What were the core flaws of the legacy Java Date-Time API (`java.util.Date`, `Calendar`, `SimpleDateFormat`)?
> 1. **Thread-Unsafety (Mutability)**: `java.util.Date` and `Calendar` objects are mutable. `SimpleDateFormat` maintains internal state in a shared `Calendar` field, causing race conditions and output corruption when accessed concurrently.
> 2. **Confusing Zero-Based Months**: Months were 0-indexed ($0 = \text{January}, 11 = \text{December}$), causing off-by-one bugs.
> 3. **Confusing Semantics**: `java.util.Date` represents an instant in UTC, but its `toString()` method formats output using the host JVM's default timezone, misleading developers into thinking it carries timezone state.

### Q2. How does the Java 8+ `java.time` package resolve thread-safety issues?
> All classes in `java.time` (`LocalDate`, `LocalTime`, `LocalDateTime`, `ZonedDateTime`, `Instant`, `Duration`, `Period`) are **immutable and value-based**. Methods like `.plusDays()` or `.withHour()` return a new instance instead of modifying the target object. `DateTimeFormatter` is completely stateless, making all formatters thread-safe and reusable across concurrent application threads.

### Q3. What is the difference between `Instant` and `ZonedDateTime`?
> `Instant` represents a specific epoch timestamp on the timeline in UTC ($00:00:00\text{ UTC}$ on Jan 1, 1970). It has no timezone or calendar concept and is used for machine timestamps, database persistence, and audit logging. `ZonedDateTime` combines a `LocalDateTime` with a `ZoneId` (e.g., `America/New_York`), accounting for Daylight Saving Time (DST) rules and UTC offsets.

### Q4. How do you test time-dependent logic deterministically in Java without using `System.currentTimeMillis()`?
> Inject an instance of `java.time.Clock` into your spring components (`Clock.systemUTC()`). In unit tests, inject a static, frozen time using `Clock.fixed(Instant, ZoneId)` or `Clock.offset()`. This eliminates system-clock dependency during test execution.

```java
// Production Dependency Injection
@Service
public class OrderService {
    private final Clock clock;
    public OrderService(Clock clock) { this.clock = clock; }

    public boolean isDiscountActive(LocalDate expiryDate) {
        return LocalDate.now(clock).isBefore(expiryDate);
    }
}

// Unit Test Setup (Frozen Time)
Clock frozenClock = Clock.fixed(Instant.parse("2026-06-01T00:00:00Z"), ZoneId.of("UTC"));
OrderService service = new OrderService(frozenClock);
```

### Q5. How does `ZonedDateTime` handle Daylight Saving Time (DST) transitions?
> When a local time falls into a DST **Gap** (Spring Forward, where 02:00 jumps to 03:00), `ZonedDateTime` automatically adjusts the local time forward by the gap duration. When a local time falls into an **Overlap** (Fall Back, where 02:00 repeats), `ZonedDateTime` defaults to using the earlier pre-transition offset.

---

## See Also

- [Java Core Concepts & JIT Internals](./core-java-questions.md)
- [Java 8 Tricky Interview Questions](./java-8-tricky-questions.md)
- [Tricky Java Interview Questions](./tricky-java-interview.md)
