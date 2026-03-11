---
id: java-concurrency
title: "Java Concurrency: Threads, Locks & Concurrent Utilities"
slug: java-concurrency
---

# Java Concurrency: Threads, Locks & Concurrent Utilities

A comprehensive guide to concurrent programming in Java — from thread basics and synchronization primitives to advanced utilities like `CompletableFuture` and virtual threads.

---

## 1. Threads & Processes

### Process vs Thread

| Aspect | Process | Thread |
|--------|---------|--------|
| Definition | Independent unit of execution with its own memory space | Lightweight unit of execution within a process |
| Memory | Isolated address space | Shares heap with other threads; has own stack |
| Communication | IPC (sockets, pipes, shared memory) | Shared variables (requires synchronization) |
| Cost | Expensive to create/switch | Cheaper to create/switch |
| Crash isolation | One process crash doesn't affect others | One thread crash can bring down the whole process |

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

### Thread Lifecycle States

```
NEW  →  RUNNABLE  ⇄  BLOCKED / WAITING / TIMED_WAITING  →  TERMINATED

NEW:            Thread created but start() not yet called
RUNNABLE:       Executing or ready to execute (includes OS "running" and "ready")
BLOCKED:        Waiting to acquire a monitor lock
WAITING:        Waiting indefinitely (Object.wait(), Thread.join(), LockSupport.park())
TIMED_WAITING:  Waiting with timeout (Thread.sleep(), Object.wait(timeout))
TERMINATED:     Run method completed or exception thrown
```

### Deadlock

Deadlock occurs when two or more threads are **blocked forever**, each waiting for a lock held by the other.

**Four necessary conditions:**
1. **Mutual exclusion** — resources cannot be shared
2. **Hold and wait** — holding one lock while waiting for another
3. **No preemption** — locks cannot be forcibly taken
4. **Circular wait** — A waits for B, B waits for A

**Prevention:** Always acquire locks in a **consistent global order**.

```java
// DEADLOCK-PRONE: inconsistent lock ordering
// Thread 1: lock(A) → lock(B)
// Thread 2: lock(B) → lock(A)

// SAFE: consistent ordering (always lock A before B)
synchronized (lockA) {
    synchronized (lockB) {
        // ...
    }
}
```

---

## 2. Synchronization Primitives

### synchronized

Java's built-in monitor lock. Can be applied to methods or blocks.

```java
// Synchronized method — locks on `this`
public synchronized void increment() {
    count++;
}

// Synchronized block — locks on specific object
public void increment() {
    synchronized (this) {
        count++;
    }
}

// Static synchronized — locks on the Class object
public static synchronized void staticMethod() { }
```

**How it works:** Every Java object has an associated **monitor**. `synchronized` acquires the monitor on entry and releases it on exit (even if an exception is thrown).

### volatile

Ensures **visibility** and prevents **instruction reordering** for a variable:

```java
private volatile boolean running = true;

// Writer thread
running = false;  // visible to all threads immediately

// Reader thread
while (running) {  // always reads the latest value
    // ...
}
```

**`volatile` does NOT provide atomicity.** `count++` on a volatile variable is still not thread-safe because it involves read-modify-write.

### synchronized vs volatile

| Feature | synchronized | volatile |
|---------|-------------|----------|
| Atomicity | ✅ | ❌ |
| Visibility | ✅ | ✅ |
| Can block | ✅ | ❌ |
| Use case | Compound operations | Simple flags/status |

---

## 3. Locks & AQS

### ReentrantLock

A more flexible alternative to `synchronized`:

```java
private final ReentrantLock lock = new ReentrantLock();

public void safeMethod() {
    lock.lock();
    try {
        // critical section
    } finally {
        lock.unlock();  // ALWAYS unlock in finally
    }
}
```

### ReentrantLock vs synchronized

| Feature | synchronized | ReentrantLock |
|---------|-------------|---------------|
| Lock acquisition | Implicit (block entry) | Explicit (`lock()`) |
| Unlock | Implicit (block exit) | Explicit (`unlock()`) |
| Fairness | Non-fair only | Configurable |
| Try lock | ❌ | ✅ `tryLock()` |
| Interruptible | ❌ | ✅ `lockInterruptibly()` |
| Condition variables | One (via `wait/notify`) | Multiple (`newCondition()`) |
| Performance | Similar (JDK 6+ optimizations) | Similar |

### AQS (AbstractQueuedSynchronizer)

AQS is the **foundation framework** for building synchronization primitives in `java.util.concurrent`. It manages a **state** variable and a **FIFO wait queue** of blocked threads.

**Built on AQS:**
- `ReentrantLock` — exclusive lock (state = lock count)
- `Semaphore` — shared lock (state = available permits)
- `CountDownLatch` — shared (state = count)
- `ReentrantReadWriteLock` — combined exclusive/shared

**Core idea:**
```
state = 0 → lock is free
state > 0 → lock is held

Thread tries CAS(state, 0, 1):
  Success → acquires lock, proceeds
  Failure → enqueued in CLH wait queue, parked (LockSupport.park)
```

### Optimistic vs Pessimistic Locking

| Strategy | Mechanism | Best For |
|----------|-----------|----------|
| **Pessimistic** | Lock before accessing (synchronized, ReentrantLock) | High contention, write-heavy |
| **Optimistic** | Read freely, verify before writing (CAS, version numbers) | Low contention, read-heavy |

---

## 4. Atomic Classes & CAS

### CAS (Compare-And-Swap)

CAS is a **lock-free** atomic operation: "If the current value equals the expected value, update it to the new value. Otherwise, do nothing."

```
CAS(address, expectedValue, newValue)
  → success: value at address is updated
  → failure: value was changed by another thread; retry
```

Implemented via CPU instructions (`cmpxchg` on x86) through `sun.misc.Unsafe`.

### Atomic Classes

`java.util.concurrent.atomic` provides lock-free thread-safe operations:

```java
// AtomicInteger
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();           // atomic i++
count.compareAndSet(1, 2);         // CAS
count.getAndUpdate(x -> x * 2);   // atomic function application

// AtomicReference
AtomicReference<String> ref = new AtomicReference<>("initial");
ref.compareAndSet("initial", "updated");

// LongAdder (high-contention counter — better than AtomicLong)
LongAdder adder = new LongAdder();
adder.increment();
long total = adder.sum();
```

### The ABA Problem

CAS checks if the value is the same, but it might have changed from A → B → A. The CAS succeeds even though the value was modified.

**Solution:** `AtomicStampedReference` adds a **version stamp**:

```java
AtomicStampedReference<Integer> ref = new AtomicStampedReference<>(1, 0);
int[] stamp = new int[1];
int value = ref.get(stamp);  // value=1, stamp[0]=0
ref.compareAndSet(1, 2, stamp[0], stamp[0] + 1);  // checks both value AND stamp
```

---

## 5. Java Memory Model (JMM)

### Why JMM Matters

Modern CPUs use **caches** and perform **instruction reordering** for performance. Without a memory model, threads may see stale or inconsistent data.

### JMM Guarantees

The JMM defines **happens-before** relationships — if action A happens-before action B, then A's effects are visible to B:

| Rule | Description |
|------|-------------|
| **Program order** | Each action in a thread happens-before the next action in that thread |
| **Monitor lock** | Releasing a lock happens-before acquiring the same lock |
| **volatile** | Writing a volatile variable happens-before reading it |
| **Thread start** | `thread.start()` happens-before any action in the started thread |
| **Thread join** | All actions in a thread happen-before `join()` returns |
| **Transitivity** | If A happens-before B, and B happens-before C, then A happens-before C |

### Memory Barriers

The JVM inserts **memory barriers** (fences) to enforce ordering:

- **LoadLoad:** Ensures loads before the barrier complete before loads after
- **StoreStore:** Ensures stores before the barrier are visible before stores after
- **LoadStore / StoreLoad:** Cross-type ordering

`volatile` writes insert a **StoreStore + StoreLoad** barrier; reads insert a **LoadLoad + LoadStore** barrier.

---

## 6. ThreadLocal

`ThreadLocal` provides **per-thread isolated variables** — each thread has its own independent copy.

```java
private static final ThreadLocal<SimpleDateFormat> dateFormat =
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

// Each thread gets its own SimpleDateFormat instance
String formatted = dateFormat.get().format(new Date());
```

### Internal Mechanism

Each `Thread` has a `ThreadLocalMap` (a custom hash map). When you call `threadLocal.get()`:

1. Get the current thread's `ThreadLocalMap`
2. Look up the entry keyed by the `ThreadLocal` instance
3. Return the value (or initialize it)

### Memory Leak Risk

`ThreadLocalMap` entries use **weak references** for keys (the `ThreadLocal` instance). If the `ThreadLocal` is garbage-collected, the key becomes `null` but the **value remains** — this is a memory leak, especially with thread pools where threads are reused.

**Always clean up:**

```java
try {
    threadLocal.set(value);
    // use value
} finally {
    threadLocal.remove();  // prevent memory leak
}
```

---

## 7. Thread Pools

### Why Thread Pools?

Creating threads is expensive. Thread pools **reuse** a fixed set of threads to execute tasks, reducing overhead and controlling concurrency.

### ThreadPoolExecutor Parameters

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    corePoolSize,       // threads to keep alive even when idle
    maximumPoolSize,    // maximum threads allowed
    keepAliveTime,      // idle time before excess threads are terminated
    timeUnit,           // unit for keepAliveTime
    workQueue,          // queue for tasks waiting to execute
    threadFactory,      // creates new threads (set names here!)
    rejectionHandler    // policy when queue is full and max threads reached
);
```

### Task Submission Flow

```
Submit task
    │
    ▼
Active threads < corePoolSize?  ──Yes──▶  Create new thread to run task
    │ No
    ▼
Work queue has space?  ──Yes──▶  Add task to queue
    │ No
    ▼
Active threads < maximumPoolSize?  ──Yes──▶  Create new thread to run task
    │ No
    ▼
Execute rejection policy
```

### Rejection Policies

| Policy | Behavior |
|--------|----------|
| `AbortPolicy` | Throws `RejectedExecutionException` (default) |
| `CallerRunsPolicy` | Runs the task in the caller's thread |
| `DiscardPolicy` | Silently discards the task |
| `DiscardOldestPolicy` | Discards the oldest queued task, then retries |

### Work Queue Selection

| Queue | Behavior | Use Case |
|-------|----------|----------|
| `LinkedBlockingQueue` | Unbounded (or bounded) | General purpose (caution: unbounded can cause OOM) |
| `ArrayBlockingQueue` | Bounded | Backpressure control |
| `SynchronousQueue` | Zero capacity (direct handoff) | High-throughput, maximumPoolSize = large |
| `PriorityBlockingQueue` | Priority-ordered | Tasks with different priorities |

### Best Practices

1. **Never use `Executors` factory methods in production** — `newFixedThreadPool` and `newSingleThreadExecutor` use unbounded queues (OOM risk); `newCachedThreadPool` allows unlimited threads.

2. **Always create `ThreadPoolExecutor` directly** with bounded queues and explicit max sizes.

3. **Name your threads** for debugging:
   ```java
   ThreadFactory factory = r -> {
       Thread t = new Thread(r);
       t.setName("order-processor-" + t.getId());
       return t;
   };
   ```

4. **Use separate pools for different workloads** — don't mix CPU-bound and I/O-bound tasks in the same pool.

5. **Monitor your pools** — track queue size, active threads, and completed tasks.

---

## 8. CompletableFuture

`CompletableFuture` (Java 8+) provides a powerful API for **composing asynchronous operations**.

### Basic Usage

```java
// Run async task
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // runs in ForkJoinPool.commonPool()
    return fetchDataFromAPI();
});

// Chain transformations
CompletableFuture<Integer> result = future
    .thenApply(data -> parse(data))        // transform result
    .thenApply(parsed -> parsed.length()); // chain another transformation

// Handle errors
result.exceptionally(ex -> {
    log.error("Failed", ex);
    return -1;  // fallback value
});
```

### Composition Patterns

```java
// Sequential composition (flatMap)
CompletableFuture<Order> order = getUserId()
    .thenCompose(userId -> getOrder(userId));       // result feeds into next

// Parallel composition (combine)
CompletableFuture<String> combined = getPrice()
    .thenCombine(getDiscount(), (price, discount) -> // both run in parallel
        applyDiscount(price, discount));

// Wait for all
CompletableFuture.allOf(future1, future2, future3).join();

// Wait for any (first to complete)
CompletableFuture.anyOf(future1, future2, future3).join();
```

### Custom Thread Pool

```java
ExecutorService pool = Executors.newFixedThreadPool(10);
CompletableFuture.supplyAsync(() -> heavyComputation(), pool);
```

> **Always provide a custom thread pool for I/O-bound tasks.** The common `ForkJoinPool` is shared across the entire JVM and is sized for CPU-bound work.

---

## 9. Concurrent Collections

| Collection | Description |
|-----------|-------------|
| `ConcurrentHashMap` | Segment-locked (JDK7) or CAS+synchronized (JDK8+) thread-safe Map |
| `CopyOnWriteArrayList` | Creates a new array copy on every write. Ideal for read-heavy, write-rare scenarios |
| `ConcurrentLinkedQueue` | Lock-free FIFO queue based on CAS |
| `BlockingQueue` | Interface for producer-consumer queues (`ArrayBlockingQueue`, `LinkedBlockingQueue`) |
| `ConcurrentSkipListMap` | Thread-safe sorted Map (skip list based) |

### CopyOnWriteArrayList

Every mutation (add, set, remove) copies the entire underlying array. Reads are lock-free.

```java
CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
list.add("item");  // creates a new internal array copy

// Safe to iterate while another thread modifies
for (String s : list) {
    // uses a snapshot — won't see concurrent modifications
}
```

**Use when:** Reads vastly outnumber writes (e.g., listener lists, configuration).

---

## 10. Virtual Threads (Java 21+)

Virtual threads are **lightweight threads** managed by the JVM (not the OS), introduced in Project Loom.

### Platform Threads vs Virtual Threads

| Aspect | Platform Thread | Virtual Thread |
|--------|----------------|----------------|
| Managed by | OS | JVM |
| Memory | ~1 MB stack | ~1 KB initial |
| Max count | Thousands | Millions |
| Blocking cost | Expensive (blocks OS thread) | Cheap (unmounts from carrier) |
| Use case | CPU-bound work | I/O-bound work (HTTP calls, DB queries) |

### Creating Virtual Threads

```java
// Direct creation
Thread vThread = Thread.ofVirtual().start(() -> {
    System.out.println("Running on: " + Thread.currentThread());
});

// Virtual thread executor — one virtual thread per task
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        executor.submit(() -> {
            // each task gets its own virtual thread
            Thread.sleep(Duration.ofSeconds(1));
            return "done";
        });
    }
}
```

### Key Considerations

- **Don't pool virtual threads** — they're cheap to create. Use `newVirtualThreadPerTaskExecutor()`.
- **Avoid `synchronized`** in virtual thread code — it pins the virtual thread to the carrier thread. Use `ReentrantLock` instead.
- **Best for I/O-bound tasks** — virtual threads yield when blocked on I/O, freeing carrier threads for other virtual threads.
- **Not faster for CPU-bound work** — they still need carrier (platform) threads for execution.

---

## 11. Producer-Consumer Pattern

A fundamental concurrency pattern where producer threads generate data and consumer threads process it, communicating via a shared buffer.

### Using wait/notify

```java
class BoundedBuffer<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;

    public BoundedBuffer(int capacity) { this.capacity = capacity; }

    public synchronized void produce(T item) throws InterruptedException {
        while (queue.size() == capacity) {
            wait(); // Buffer full — release lock and wait
        }
        queue.add(item);
        notifyAll(); // Wake up consumers
    }

    public synchronized T consume() throws InterruptedException {
        while (queue.isEmpty()) {
            wait(); // Buffer empty — release lock and wait
        }
        T item = queue.poll();
        notifyAll(); // Wake up producers
        return item;
    }
}
```

### Using BlockingQueue (Preferred)

```java
BlockingQueue<String> queue = new ArrayBlockingQueue<>(10);

// Producer
executor.submit(() -> {
    queue.put("item"); // Blocks if full
});

// Consumer
executor.submit(() -> {
    String item = queue.take(); // Blocks if empty
});
```

> **Always use `while` (not `if`) for wait conditions** to guard against spurious wakeups.

---

## 12. Synchronization Strategies Summary

| Mechanism | Visibility | Atomicity | Mutual Exclusion | Use Case |
|-----------|-----------|-----------|-----------------|----------|
| `volatile` | ✅ | ❌ (single read/write only) | ❌ | Flags, status variables |
| `synchronized` | ✅ | ✅ | ✅ | General-purpose locking |
| `ReentrantLock` | ✅ | ✅ | ✅ | Advanced locking (timeouts, fairness) |
| `Atomic*` classes | ✅ | ✅ (CAS-based) | ❌ | Counters, accumulators |
| `StampedLock` | ✅ | ✅ | ✅ | Optimistic read-heavy scenarios |
