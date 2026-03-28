---
id: java-concurrency
title: "Java Concurrency: Threads, Locks & Concurrent Utilities"
slug: java-concurrency
description: Comprehensive guide to Java concurrency, covering threads, synchronization, locks, concurrent utilities, the Fork/Join framework, and async programming.
tags: [java, concurrency, multithreading, async, interview-prep]
---

# Java Concurrency: Threads, Locks & Concurrent Utilities

A comprehensive guide to concurrent programming in Java — from thread basics and synchronization primitives to advanced work-stealing algorithms like Fork/Join and modern virtual threads.

---

## 1. Threads & Processes

### Process vs Thread

| Aspect          | Process                                                 | Thread                                            |
| --------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Definition      | Independent unit of execution with its own memory space | Lightweight unit of execution within a process    |
| Memory          | Isolated address space                                  | Shares heap with other threads; has own stack     |
| Communication   | IPC (sockets, pipes, shared memory)                     | Shared variables (requires synchronization)       |
| Cost            | Expensive to create/switch                              | Cheaper to create/switch                          |
| Crash isolation | One process crash doesn't affect others                 | One thread crash can bring down the whole process |

### Creating Threads

```java
// 1. Extending Thread
class MyThread extends Thread {
    @Override
    public void run() { System.out.println("Running"); }
}
new MyThread().start();

// 2. Implementing Runnable (preferred — allows extending another class)
Runnable task = () -> System.out.println("Running");
new Thread(task).start();

// 3. Using Callable + FutureTask (returns a result)
Callable<Integer> callable = () -> 42;
FutureTask<Integer> future = new FutureTask<>(callable);
new Thread(future).start();
int result = future.get();  // blocks until complete

// 4. Using ExecutorService (production choice)
ExecutorService executor = Executors.newFixedThreadPool(4);
executor.submit(() -> System.out.println("Running"));
```

:::info Interview Focus: `start()` vs `run()`
**Q: Can we directly call the `run()` method instead of `start()`?** Calling `run()` directly executes the method synchronously in the *current* thread, just like any normal method call. It does not spawn a new thread. Calling `start()` registers the thread with the JVM and OS, transitioning it to the `RUNNABLE` state, which then invokes `run()` concurrently.
:::

### Thread Lifecycle States

```text
NEW  →  RUNNABLE  ⇄  BLOCKED / WAITING / TIMED_WAITING  →  TERMINATED
```
* **NEW:** Thread created but `start()` not yet called.
* **RUNNABLE:** Executing or ready to execute (includes OS "running" and "ready").
* **BLOCKED:** Waiting to acquire a monitor lock.
* **WAITING:** Waiting indefinitely (`Object.wait()`, `Thread.join()`, `LockSupport.park()`).
* **TIMED_WAITING:** Waiting with timeout (`Thread.sleep()`, `Object.wait(timeout)`).
* **TERMINATED:** Run method completed or exception thrown.

:::tip Interview Focus: Thread Control Methods
**Q: What is the difference between `Thread.sleep()` and `Object.wait()`?** 1. **Lock Release:** `sleep()` does *not* release the monitor lock. `wait()` *releases* the lock, allowing other threads to enter the synchronized block.
2. **Origin:** `sleep()` is a static method in `Thread`. `wait()` is an instance method in `Object`.
3. **Usage Context:** `wait()` must be called inside a `synchronized` block/method. `sleep()` can be called anywhere.
:::

### Deadlock

Deadlock occurs when two or more threads are **blocked forever**, each waiting for a lock held by the other.

**Four necessary conditions:**
1. **Mutual exclusion** — resources cannot be shared.
2. **Hold and wait** — holding one lock while waiting for another.
3. **No preemption** — locks cannot be forcibly taken.
4. **Circular wait** — A waits for B, B waits for A.

**Prevention:** Always acquire locks in a **consistent global order**.

---

## 2. Synchronization Primitives

### `synchronized`

Java's built-in monitor lock. Can be applied to methods or blocks.

```java
// Synchronized method — locks on `this`
public synchronized void increment() { count++; }

// Synchronized block — locks on specific object
public void increment() {
    synchronized (this) { count++; }
}

// Static synchronized — locks on the Class object
public static synchronized void staticMethod() { }
```

:::tip Interview Focus: Lock Escalation (JDK 1.6+)
**Q: How did JDK 1.6 optimize `synchronized`?** To reduce the heavy OS-level context switching overhead, Java introduced **Lock Escalation**:
1. **Biased Locking:** Assumes only one thread will access the block. Marks the object header with the thread ID.
2. **Lightweight Locking:** If another thread requests the lock, it upgrades to a lightweight lock. The new thread uses CAS (Compare-And-Swap) to spin and wait for the lock.
3. **Heavyweight Locking:** If the spin-lock fails too many times (high contention), it escalates to a heavyweight lock, which delegates to the OS mutex, blocking threads entirely.
:::

### `volatile`

Ensures **visibility** and prevents **instruction reordering**.

```java
private volatile boolean running = true;
// Writer thread
running = false;  // visible to all threads immediately
```

:::danger Interview Trap: Volatile Atomicity
**Q: Does `volatile` guarantee thread safety for `i++`?** No. `volatile` does NOT provide atomicity. `count++` is a read-modify-write operation (3 steps). Multiple threads can still read the same initial value simultaneously. You need `AtomicInteger` or `synchronized` for atomicity.
:::

---

## 3. Locks & AQS

### ReentrantLock vs `synchronized`

| Feature       | `synchronized`       | `ReentrantLock`                          |
| ------------- | -------------------- | ---------------------------------------- |
| Mechanism     | Implicit JVM Monitor | Explicit Java API (`lock()`, `unlock()`) |
| Fairness      | Non-fair only        | Configurable (Fair or Non-fair)          |
| Try lock      | ❌                    | ✅ `tryLock()`                            |
| Interruptible | ❌                    | ✅ `lockInterruptibly()`                  |
| Conditions    | One (`wait/notify`)  | Multiple (`newCondition()`)              |

### AQS (AbstractQueuedSynchronizer)

AQS is the **foundation framework** for `ReentrantLock`, `Semaphore`, `CountDownLatch`, and `CyclicBarrier`.

:::info Interview Focus: AQS Internals
**Q: How does AQS work internally?** AQS uses a `volatile int state` variable to represent shared resources and a **FIFO CLH (Craig, Landin, and Hagersten) bidirectional queue** to manage blocked threads. 
* If a thread tries to acquire a lock and `state` allows it, it modifies `state` via CAS. 
* If it fails, AQS wraps the thread in a Node, enqueues it, and parks the thread using `LockSupport.park()`. When the lock is released, the head of the queue is unparked.
:::

---

## 4. AQS Synchronization Utilities

While `ReentrantLock` provides basic mutual exclusion, the AQS framework powers several high-level coordination utilities essential for distributed systems and microservice architectures.

### 1. `CountDownLatch`
Allows one or more threads to wait until a set of operations being performed in other threads completes.
* **Mechanism:** Initialized with a count. The `await()` methods block until the current count reaches zero due to invocations of `countDown()`.
* **Reusability:** **Cannot be reset.** Once the count reaches zero, it stays zero.

```java
CountDownLatch latch = new CountDownLatch(3); // Wait for 3 services

// In 3 different initialization threads:
// ... do work ...
latch.countDown(); 

// In the main thread:
latch.await(); // Blocks until countDown() is called 3 times
System.out.println("All services initialized. Starting application.");
```

### 2. `CyclicBarrier`
Allows a set of threads to all wait for each other to reach a common barrier point. 
* **Mechanism:** Initialized with the number of participating threads. Threads call `await()` when they reach the barrier. Once the last thread calls `await()`, the barrier is tripped, and all threads proceed.
* **Reusability:** **Can be reset** and reused after the barrier is tripped.

### 3. `Semaphore`
Maintains a set of permits. `acquire()` blocks if necessary until a permit is available. `release()` adds a permit, potentially releasing a blocking acquirer. Used heavily for **rate limiting** or resource pooling.

```java
// Only allow 5 concurrent accesses
Semaphore semaphore = new Semaphore(5);

public void accessRateLimitedResource() {
    try {
        semaphore.acquire(); // takes 1 permit
        // ... execute external API call ...
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    } finally {
        semaphore.release(); // ALWAYS release in a finally block
    }
}
```

:::danger Interview Trap: CountDownLatch vs CyclicBarrier
**Q: What is the core difference between CountDownLatch and CyclicBarrier?**
1.  **Who is waiting?** In `CountDownLatch`, usually *one main thread* waits for *N other threads* to finish. In `CyclicBarrier`, *N threads* wait for *each other*.
2.  **Reusability:** `CountDownLatch` count cannot be reset. `CyclicBarrier` resets automatically.
:::

---

## 5. Atomic Classes & CAS

### CAS (Compare-And-Swap)

CAS is a **lock-free** atomic operation supported by the CPU: "If the current value equals the expected value, update it. Otherwise, retry." Used extensively in `java.util.concurrent.atomic`.

:::info Interview Focus: The ABA Problem
**Q: What is the ABA problem in CAS and how is it solved?** If a value changes from A → B → A, CAS checks the value and sees 'A', incorrectly assuming it was never modified. This is dangerous for structures like lock-free linked lists. 
**Solution:** Use `AtomicStampedReference`. It appends a version stamp (integer) to the reference. The CAS operation now checks both the value AND the version stamp.
:::

---

## 6. Java Memory Model (JMM)

The JMM defines **happens-before** relationships. If action A happens-before action B, A's effects are visible to B.

**Memory Barriers:** The JVM inserts memory barriers to enforce ordering:
* `volatile` writes insert a **StoreStore + StoreLoad** barrier.
* `volatile` reads insert a **LoadLoad + LoadStore** barrier.

---

## 7. ThreadLocal

`ThreadLocal` provides **per-thread isolated variables**.

```java
private static final ThreadLocal<SimpleDateFormat> dateFormat =
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
```

:::danger Interview Focus: Memory Leaks
**Q: Why does ThreadLocal cause memory leaks and how do `WeakReferences` play a role?** Internally, each `Thread` has a `ThreadLocalMap`. The map uses `ThreadLocal` instances as **WeakReference** keys, but the values are strong references. If a `ThreadLocal` is garbage-collected, its key in the map becomes `null`, but the value remains referenced by the thread. In thread pools, where threads are never destroyed, this value lives forever.
**Fix:** Always call `threadLocal.remove()` in a `finally` block after use.
:::

---

## 8. Thread Pools & Executors

Managing threads manually is an anti-pattern. The Executor framework decouples task submission from execution mechanics.

### Sizing a Thread Pool

A poorly sized thread pool leads to resource exhaustion or underutilization.

:::info Interview Focus: The Sizing Formula
**Q: How do you determine the optimal `corePoolSize` and `maximumPoolSize`?**
It strictly depends on the workload profile:
1.  **CPU-Bound Tasks** (e.g., encryption, heavy math, sorting):
    * Formula: `N_threads = CPU_Cores + 1` (The +1 acts as a backup if a working thread experiences a page fault).
2.  **I/O-Bound Tasks** (e.g., DB queries, HTTP calls, file reads):
    * Formula: `N_threads = CPU_Cores * Target_CPU_Utilization * (1 + Wait_Time / Compute_Time)`
    * *Rule of Thumb:* Usually `2N` or much higher. Since threads spend most of their time blocked waiting for I/O, you need more threads to keep the CPU busy.
:::

### Rejection Policies
1. `AbortPolicy` (Default): Throws `RejectedExecutionException`.
2. `CallerRunsPolicy`: Runs task in the caller's thread (acts as natural backpressure).
3. `DiscardPolicy`: Silently drops task.
4. `DiscardOldestPolicy`: Drops oldest unhandled request and retries.

:::tip Interview Focus: Factory Methods
**Q: Why do strict engineering guidelines forbid using `Executors` factory methods?** * `Executors.newFixedThreadPool()` uses an **unbounded** `LinkedBlockingQueue`. If tasks build up faster than they process, it will cause an OOM.
* `Executors.newCachedThreadPool()` allows `Integer.MAX_VALUE` maximum threads, leading to OOM by creating too many threads.
Always explicitly configure `ThreadPoolExecutor` to control queue sizes and thread limits.
:::

---

## 9. The Fork/Join Framework

Introduced in Java 7, the Fork/Join framework is designed for work that can be broken down recursively into smaller pieces (Divide and Conquer). It is the engine that powers `Arrays.parallelSort()` and parallel Streams.

### Core Components
* **`ForkJoinPool`**: The specialized executor.
* **`RecursiveTask<V>`**: A task that returns a result.
* **`RecursiveAction`**: A task that does not return a result.

### The Work-Stealing Algorithm
Standard thread pools use a single shared queue, which can become a bottleneck. The `ForkJoinPool` gives every worker thread its own double-ended queue (deque). 

:::info Interview Focus: Work-Stealing
**Q: How does Fork/Join prevent idle threads?**
If a worker thread finishes all the tasks in its own deque, it becomes a "thief." It looks at the deques of other busy worker threads and **steals tasks from the tail** (the oldest, largest chunks of work). This minimizes contention, because the owner thread operates on the head of the deque, while the thief operates on the tail.
:::

### Example: Array Summation
```java
public class SumTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 1000;
    private long[] array;
    private int start, end;

    public SumTask(long[] array, int start, int end) {
        this.array = array; this.start = start; this.end = end;
    }

    @Override
    protected Long compute() {
        if (end - start <= THRESHOLD) {
            long sum = 0;
            for (int i = start; i < end; i++) sum += array[i];
            return sum;
        } else {
            // Fork: divide task in half
            int mid = start + (end - start) / 2;
            SumTask left = new SumTask(array, start, mid);
            SumTask right = new SumTask(array, mid, end);
            
            left.fork(); // pushes to deque, executed asynchronously
            long rightResult = right.compute(); // compute right half in current thread
            long leftResult = left.join(); // block and wait for left half
            
            return leftResult + rightResult;
        }
    }
}

// Usage:
ForkJoinPool pool = ForkJoinPool.commonPool();
long total = pool.invoke(new SumTask(massiveArray, 0, massiveArray.length));
```

---

## 10. CompletableFuture

`CompletableFuture` (Java 8+) provides a powerful API for composing asynchronous, non-blocking operations. By default, it uses the `ForkJoinPool.commonPool()`.

```java
// Chain transformations and handle errors elegantly
CompletableFuture<Integer> result = CompletableFuture.supplyAsync(() -> fetchData())
    .thenApply(data -> parse(data))        
    .exceptionally(ex -> {
        log.error("Failed", ex);
        return -1;  // fallback value
    });

// Parallel composition (combine)
CompletableFuture<String> combined = getPrice()
    .thenCombine(getDiscount(), (price, discount) -> applyDiscount(price, discount));
```

> **Warning:** Always provide a custom `Executor` as the second argument to `supplyAsync()` if you are doing I/O-bound tasks. The common `ForkJoinPool` is sized for CPU-bound work and will quickly exhaust if blocked by database or network calls.

---

## 11. Concurrent Collections

| Collection             | Description                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `ConcurrentHashMap`    | Thread-safe Map. Read operations are entirely lock-free.                              |
| `CopyOnWriteArrayList` | Creates a new array copy on every write. Ideal for read-heavy scenarios.              |
| `BlockingQueue`        | Interface for producer-consumer queues (`ArrayBlockingQueue`, `LinkedBlockingQueue`). |

:::info Interview Focus: ConcurrentHashMap 1.7 vs 1.8
**Q: How did `ConcurrentHashMap` change from JDK 1.7 to 1.8?** * **JDK 1.7:** Used **Segment-based locking** (an array of Segments). Granularity was locked at the Segment level (default 16).
* **JDK 1.8:** Removed Segments. Uses a Node array + Linked List + Red-Black tree. Thread safety is achieved using **CAS + `synchronized`**. It locks only the *head node* of the specific bucket being modified, massively reducing lock contention.
:::

---

## 12. Virtual Threads (Java 21+)

Virtual threads are **lightweight threads** managed by the JVM, not the OS. They are designed for high-throughput I/O-bound workloads, solving the "thread-per-request" bottleneck.

* **Creation:** `Executors.newVirtualThreadPerTaskExecutor()`
* **Mechanism:** When a virtual thread makes a blocking I/O call, the JVM "unmounts" it from the underlying OS carrier thread (a ForkJoin worker), allowing the carrier thread to execute other virtual threads.
* **Rule of thumb:** Do not pool virtual threads (they are cheap to create). Avoid `synchronized` blocks inside them, as they "pin" the carrier thread; use `ReentrantLock` instead.

---

## 14. Structured Concurrency (Java 21+)

`StructuredTaskScope` enforces a discipline that child threads cannot outlive their parent — solving the "orphaned thread" problem common in `CompletableFuture` chains.

```java
// Structured Concurrency: all subtasks are scoped and managed together
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask<User>  user   = scope.fork(this::fetchUser);
    Subtask<Order> orders = scope.fork(this::fetchOrders);

    scope.join()           // wait for both
         .throwIfFailed(); // propagate first failure

    return new Dashboard(user.get(), orders.get());
} // scope closes — any unfinished subtasks are cancelled automatically
```

### ShutdownOnFailure vs ShutdownOnSuccess

| Policy | Behavior | Use case |
|---|---|---|
| `ShutdownOnFailure` | Cancel all subtasks if **any** fails | All results required |
| `ShutdownOnSuccess` | Cancel remaining once **one** succeeds | First-response-wins (redundant calls) |

```java
// ShutdownOnSuccess: try multiple sources, use fastest response
try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
    scope.fork(() -> fetchFromPrimaryDB());
    scope.fork(() -> fetchFromCache());
    scope.fork(() -> fetchFromReplica());

    scope.join();
    return scope.result();  // returns whichever completed first
}
```

> **Key insight:** Unlike `CompletableFuture.allOf()`, structured concurrency ensures all forked threads terminate before the scope exits — either normally or cancelled. No orphaned background work.

---

## 15. Advanced CompletableFuture Patterns

### Combining Multiple Futures

```java
// Get all results after allOf completes (workaround for allOf's Void return)
CompletableFuture<List<String>> allResults = CompletableFuture.allOf(future1, future2, future3)
    .thenApply(v -> Stream.of(future1, future2, future3)
        .map(CompletableFuture::join)  // safe — all completed
        .collect(Collectors.toList()));
```

### Error Handling

```java
CompletableFuture<User> future = CompletableFuture.supplyAsync(this::fetchUser)
    .exceptionally(ex -> User.anonymous())      // recover from error with default
    .handle((user, ex) -> {                     // always runs — inspect both
        if (ex != null) return User.anonymous();
        return user;
    })
    .whenComplete((user, ex) ->                 // side-effect logging only
        log.info("Completed: user={}, error={}", user, ex));
```

### Timeout (Java 9+)

```java
CompletableFuture<String> withTimeout = CompletableFuture
    .supplyAsync(this::slowExternalCall)
    .orTimeout(2, TimeUnit.SECONDS)                         // throws after 2s
    .completeOnTimeout("fallback", 2, TimeUnit.SECONDS);    // or return fallback
```

### `thenCompose` vs `thenApply`

```java
// thenApply: synchronous transform — adapts T → U
CompletableFuture<String> upper = future.thenApply(String::toUpperCase);

// thenCompose: flatMap — use when transform itself returns a CompletableFuture
// Prevents CompletableFuture<CompletableFuture<Order>>
CompletableFuture<Order> orders = userFuture
    .thenCompose(user -> fetchOrdersFor(user.getId()));
```

### Always use a custom executor for I/O

```java
// ❌ Uses ForkJoinPool.commonPool() — designed for CPU-bound, not blocking I/O
CompletableFuture.supplyAsync(() -> httpClient.fetch(url));

// ✅ Dedicated I/O executor (or virtual threads in Java 21)
ExecutorService ioExecutor = Executors.newVirtualThreadPerTaskExecutor();
CompletableFuture.supplyAsync(() -> httpClient.fetch(url), ioExecutor);
```

---

## 16. Producer-Consumer Pattern

A fundamental pattern where producer threads generate data and consumer threads process it, communicating via a shared buffer. 

While you can write this using `wait()/notifyAll()`, modern backend engineering relies on `BlockingQueue`:

```java
BlockingQueue<String> queue = new ArrayBlockingQueue<>(100);

// Producer
executor.submit(() -> {
    queue.put("payload"); // Blocks automatically if full
});

// Consumer
executor.submit(() -> {
    String payload = queue.take(); // Blocks automatically if empty
    process(payload);
});
```

---

## Compare Next
- [JVM Internals: Memory, GC & Class Loading](./java-jvm.md)
- [Java I/O: Streams, NIO & I/O Models](./java-io.md)

---

## Interview Questions

### Q: How do you pick concurrency primitives in production services?
**A:** Start with immutability and thread confinement, then use high-level utilities before low-level locks.

### Q: What is the most common thread-pool failure pattern?
**A:** Pool starvation from blocking I/O on executors sized for CPU-bound tasks.

### Q: How do you design backpressure in asynchronous pipelines?
**A:** Bound queues, apply rejection policies intentionally, and propagate load-shedding decisions upstream.

### Q: Why is lock ordering still relevant with modern utilities?
**A:** Mixed synchronization paths can still deadlock if lock acquisition order is inconsistent.

### Q: When are virtual threads not a silver bullet?
**A:** CPU-bound work, synchronized pinning, and external bottlenecks still limit throughput.

### Q: How do you evaluate CompletableFuture chains in code review?
**A:** Verify executor selection, error propagation, timeout behavior, and cancellation semantics.

### Q: What does senior-level concurrency testing include?
**A:** Deterministic stress scenarios, race-condition probes, and latency assertions under contention.
