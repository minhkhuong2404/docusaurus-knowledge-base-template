---
id: java-developer-interview-iris
title: Iris Java Developer Interview Experience & Questions [ 14 LPA+ ]
sidebar_label: Java Interview Questions
---

# Iris Java Developer Interview Experience & Questions [ 14 LPA+ ]

**Q: Explain your current project flow from API request to database. What part of the systems do you own completely? What was the last production bug you fixed and how did you debug it? What design decisions in your project didn't scale well initially?**
**A:** (This question is meant to be answered based on the candidate's personal experience level and specific project background.)

**Q: Give a real example where inheritance caused problems.**
**A:** In my project experience, we had a base user class and many subclasses like admin user and customer user. Later, a small change in base user validation broke multiple child classes unexpectedly. It created tight coupling, made debugging hard, and forced changes across many modules at the same time.

**Q: Where did you use composition and why?**
**A:** In my project, I used composition by building services using smaller components, like an order service using a payment service and a notification service. Instead of extending classes, I injected dependencies. This made the code loosely coupled, easy to test, and flexible because we could replace or modify one component without affecting the whole design.

**Q: How did a wrong `equals` and `hashCode` implementation break something?**
**A:** We used a user object as a key in a HashMap, but `equals` compared user ID while `hashCode` used the name. Because of this mismatch, the same user got stored as multiple keys and lookup failed. It caused duplicate cache entries and incorrect data being returned.

**Q: Why did you avoid using OOP and keep things simple?**
**A:** In my project, I avoided heavy OOP when the requirement was simple, like converting a request to a response or doing small validations. Instead of creating many classes and abstractions, I used simple utility methods and clear details. It reduced complexity and improved readability.

**Q: Why did you choose a Map instead of a List in one real scenario?**
**A:** In one of the modules, I needed to fetch customer details quickly using a customer ID. If I used a List, I would have to loop every time to find the match. So, I used a Map with a customer ID as the key, which gives fast O(1) lookup and improved the performance.

**Q: When did HashMap become a performance issue?**
**A:** HashMap becomes a performance issue when your operations stop being average and start degrading, usually due to many collisions. This happens with a bad hash code, weak key distribution, or an undersized map with frequent rehashing. Then lookups drift towards O(n) and latency spikes.

**Q: Have you ever replaced one collection with another for optimization?**
**A:** Yes, when profiling showed the collection choice was the bottleneck. For example, I replaced an ArrayList with a LinkedList for heavy middle insertions, and swapped a HashMap for an EnumMap when keys were enums. The goal was fewer allocations, faster lookups, and predictable performance.

**Q: Explain a bug caused by modifying a collection while iterating.**
**A:** A common bug happens when we loop over a list with a for-each and remove elements inside the loop. Java detects a structural change and throws a `ConcurrentModificationException`. The correct approach is using an iterator's `remove` method or collecting items to delete and removing them after iteration.

**Q: Why did you need multi-threading in your project?**
**A:** We needed multi-threading to improve throughput and responsiveness. Some tasks like calling external APIs, processing files, and generating reports were independent. By running them in parallel using thread pools, we reduced the waiting time, utilized the CPU better, and met latency SLAs under peak load.

**Q: What issue occurred due to shared mutable data?**
**A:** We faced a race condition because multiple threads updated the same mutable object without proper synchronization. Sometimes one thread overwrote another's changes. So counters were incorrect and data looked random. We fixed it by using immutability where possible, and atomic classes or locks for shared state.

**Q: Why didn't `synchronized` solve the problems completely?**
**A:** `synchronized` fixed correctness but it didn't fully solve performance and design issues. A single lock became a bottleneck under load, causing threads to block and latency to rise. Also, syncing the wrong scope still allowed visibility issues elsewhere. We improved it with finer-grained locks, atomics, and reducing shared state.

**Q: How did you decide the thread pool size?**
**A:** We decided the thread pool size based on workload type and measured bottlenecks. For CPU-bound tasks, I keep it near the number of cores to avoid context switching. For input/output bound tasks, we allow more threads because they spend their time waiting. Then we validate with a load test and metrics.

**Q: Where did streams make code worse instead of better?**
**A:** Streams made code worse when the logic needed complex branching, early exits, or detailed error handling. The stream pipeline became long and hard to debug, and performance suffered due to extra allocations. In those cases, a simple loop was clearer, faster, and easier to maintain.

**Q: Have you faced performance issues with streams?**
**A:** Yes, especially with large collections where a stream pipeline created many temporary objects and repeated boxing and unboxing. We also saw overhead from multiple intermediate operations like map, filter, and collect. After profiling, we replaced hot paths with plain loops or optimized collections and got better latency.

**Q: When did `Optional` create confusion?**
**A:** `Optional` created confusion when developers treated it like a normal field type and started passing `Optional` everywhere, even storing it in entities. That made an API noisy and hid real nullability rules. We teach using `Optional` mainly for return values, not parameters, and never for persistence models.

**Q: How did you use `CompletableFuture` in a real flow?**
**A:** I used `CompletableFuture` to run independent tasks in parallel, like fetching user details, order history, and recommendations from different services. Then I combined results by using `allOf` and `thenCombine` methods, handled failures with the `exceptionally` method, and returned a single aggregate response without blocking request threads.

**Q: How does Spring Boot simplify your daily work?**
**A:** Spring Boot simplifies daily work by removing setup overhead. Auto-configurations and starters give us sensible defaults, so we focus on business logic instead of wiring. Actuators help with health checks and metrics, and profiles make environment config clean. Overall, it speeds development and reduces production surprises.

**Q: How do you handle global exceptions?**
**A:** We handle global exceptions by using `@ControllerAdvice` with `@ExceptionHandler` methods. This centralizes error responses, keeps controllers clean, and ensures consistent HTTP status codes and messages. We also log with correlation IDs, map validation errors clearly, and avoid leaking internal stack traces to clients.

**Q: How do you validate request data properly?**
**A:** We validate the request data by using Bean Validation annotations like `@NotNull`, `@Size`, and `@Pattern` on DTOs and trigger them with the `@Valid` annotation in controller methods. For cross-field rules, we use custom validators, and we handle validation errors globally to return clear, consistent responses.

**Q: How do you manage config differences across environments?**
**A:** We manage config differences using Spring profiles and externalized configuration. Each environment gets its own application profile version like YAML, and sensitive values come from environment variables or a secret manager. We also keep safe default features flags when needed and verify configs via actuator and startup checks.

**Q: What checks do you do before deploying code to the production?**
**A:** Before deploying to production, we run a clear checklist: all unit and integration tests must pass, we review coverage for critical paths, check static analysis and security scans, validate configs for the target profile, and confirm DB migrations are safe. Finally, we do a smoke test with staging, review logs/metrics dashboards, and ensure rollback is ready.

**Q: Write the best way of implementing the Singleton design pattern.**
**A:** (This was asked as a coding question during the interview.)

**Q: Implement caching by using a Map.**
**A:** (This was asked as a coding question during the interview.)