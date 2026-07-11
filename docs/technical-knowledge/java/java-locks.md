---
id: java-locks
title: "Java Locks & Synchronization"
slug: java-locks
description: Deep dive into Java locks and synchronization primitives — synchronized, volatile, ReentrantLock, ReadWriteLock, StampedLock, AQS, CountDownLatch, CyclicBarrier, Semaphore, Exchanger, and Phaser.
tags: [java, concurrency, locks, synchronization, countdown-latch, semaphore, cyclic-barrier, phaser]
---

import LockEscalationDiagram from '@site/src/components/LockEscalationDiagram';
import ConcurrencyCoordinationDiagram from '@site/src/components/ConcurrencyCoordinationDiagram';
import AQSArchitectureDiagram from '@site/src/components/AQSArchitectureDiagram';
import LockDecisionTreeDiagram from '@site/src/components/LockDecisionTreeDiagram';

# Java Locks & Synchronization

To coordinate thread execution and protect shared mutable state, Java provides synchronization primitives and highly flexible locking structures built on top of a common framework — AQS. Understanding these tools at a mechanical level is what separates engineers who "know the APIs" from engineers who can diagnose a deadlock in production at 2am.

This guide covers two conceptual groups:

- **Mutual-exclusion locks** (`synchronized`, `volatile`, `ReentrantLock`, `ReadWriteLock`, `StampedLock`) — control *which thread can run* in a given critical section.
- **Coordination utilities** (`CountDownLatch`, `CyclicBarrier`, `Semaphore`, `Exchanger`, `Phaser`) — control *when threads run relative to each other*, without necessarily protecting shared state.

Both groups ultimately build on the same foundation: **AQS**.

---

## Synchronization Primitives

### 👶 Beginner: Race Condition in Action

Before learning synchronization, you must *see* what breaks without it:

```java
public class RaceConditionDemo {
    private static int counter = 0;

    public static void main(String[] args) throws InterruptedException {
        Runnable task = () -> {
            for (int i = 0; i < 100_000; i++) {
                counter++;  // NOT atomic: read → increment → write (3 separate steps)
            }
        };

        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);
        t1.start(); t2.start();
        t1.join();  t2.join();

        // Expected: 200,000
        // Actual:   ~130,000–190,000 (varies every run!)
        System.out.println("Counter: " + counter);
    }
}
```

> **Why?** Both threads read `counter = 5`, both compute `5 + 1 = 6`, both write `6`. One increment is **lost**. This is the classic "lost update" — the root cause of most concurrency bugs in production.

---

### `synchronized`

Java's built-in monitor lock. Every Java object has an implicit monitor — `synchronized` gates entry to a block or method by acquiring that monitor.

```java
// Synchronized method — implicitly locks on `this`
public synchronized void increment() { count++; }

// Synchronized block — more granular; choose any Object as the lock
public void increment() {
    synchronized (this) { count++; }
}

// Static synchronized — locks on the Class object, not on `this`
public static synchronized void staticMethod() { }
```

#### 🧠 Senior Deep Dive: Lock Escalation (JDK 1.6+)

Naïve `synchronized` delegates to an OS-level mutex on every use — an expensive context switch. JDK 1.6 introduced **lock escalation** to minimize this cost through three progressive states stored in the object header (`mark word`):

1. **Biased Locking**: Assumes the block is accessed by only one thread. The JVM stamps the object header with the acquiring thread's ID. Subsequent lock/unlock by the *same* thread is essentially free — no CAS, no atomics, no OS call.
2. **Lightweight Locking**: A second thread requests the lock. Biased locking is revoked (costly — requires a safepoint). The new thread uses **CAS (Compare-And-Swap)** to spin-wait for the lock, burning CPU cycles rather than blocking.
3. **Heavyweight Locking**: If spinning fails beyond a threshold (default: ~10 iterations), the JVM escalates to a kernel-level mutex. The waiting thread is **descheduled** by the OS — no CPU wasted, but context-switch overhead is significant (~1–10μs).

<LockEscalationDiagram />

:::warning[JDK 15+ Note]
Biased locking was **deprecated in JDK 15** and **removed in JDK 21** because modern multi-threaded applications rarely exhibit single-thread access patterns, making the revocation overhead rarely worthwhile. If you're on JDK 21+, lock escalation starts directly at lightweight locking.
:::

---

### `volatile`

Ensures two things — **visibility** (a write in one thread is immediately visible to all other threads) and **ordering** (prevents CPU/JIT instruction reordering around the variable).

#### 👶 Beginner: The Whiteboard vs. Pocket Notebook

Each CPU core has its own cache (L1/L2). When a thread writes a variable, it first writes to *its core's cache*, not directly to main RAM. Other threads, reading from *their* caches, may see a stale value — a visibility problem.

`volatile` tells the JVM: "every read must come from main memory, every write must flush to main memory immediately." Think of it as replacing each thread's private pocket notebook with a shared public whiteboard.

```java
private volatile boolean running = true;

// Writer thread
running = false;   // flushes to main RAM; all cores see it immediately

// Reader thread
while (running) { /* do work */ }  // always reads from main RAM
```

#### 🧠 Senior Deep Dive: Memory Barriers and the MESI Protocol

At the hardware level, `volatile` translates to **memory barrier instructions** (e.g., `MFENCE` on x86, `DMB` on ARM) around reads and writes.

The underlying cache coherence mechanism is the **MESI protocol** — each cache line is in one of four states:

| State | Meaning |
|:---|:---|
| **M**odified | Line is dirty; only this core has it; main RAM is stale |
| **E**xclusive | Line is clean; only this core has it |
| **S**hared | Line is clean; multiple cores have copies |
| **I**nvalid | Line is stale; must be fetched before use |

When a volatile write occurs, the writing core broadcasts an **invalidation message** on the memory bus, forcing every other core's cached copy of that cache line to transition to `Invalid`. Their next read must then fetch from main RAM — which is the visibility guarantee `volatile` provides.

**False Sharing**: CPU caches operate on 64-byte chunks called **cache lines**. If two unrelated variables happen to reside on the same 64-byte line, a write to *either* one invalidates the entire line for all cores — even if the other variable never changed. This silently destroys cache efficiency for the innocent variable.

```java
// PROBLEM: counter1 and counter2 likely share a cache line
class Counters {
    volatile long counter1 = 0;
    volatile long counter2 = 0;   // Same cache line! Writing counter1 invalidates counter2's cache
}

// FIX: @Contended pads the field with extra bytes, forcing it onto its own cache line
// Requires JVM flag: -XX:-RestrictContended
class Counters {
    @jdk.internal.vm.annotation.Contended
    volatile long counter1 = 0;
    
    @jdk.internal.vm.annotation.Contended
    volatile long counter2 = 0;   // Now on its own cache line
}
```

:::danger[Interview Trap: Volatile Does NOT Guarantee Atomicity]
`volatile` ensures **visibility** and **ordering**, but NOT **atomicity**. `count++` is three steps: read, increment, write. Multiple threads can still read the same stale value simultaneously. Use `AtomicInteger` or `synchronized` for atomic compound operations.
:::

#### 🧠 The Classic `volatile` Use Case: Double-Checked Locking Singleton

```java
public class Singleton {
    // volatile prevents reordering of the 3 steps inside `new Singleton()`
    private static volatile Singleton INSTANCE;

    private Singleton() { /* expensive init */ }

    public static Singleton getInstance() {
        if (INSTANCE == null) {                    // 1st check: no lock needed if already initialized
            synchronized (Singleton.class) {
                if (INSTANCE == null) {            // 2nd check: inside lock, prevents double-creation
                    INSTANCE = new Singleton();
                }
            }
        }
        return INSTANCE;
    }
}
```

> **Why is `volatile` required?** `INSTANCE = new Singleton()` is not atomic — it compiles to (1) allocate memory, (2) run constructor, (3) assign reference. The JIT can legally reorder to (1) → (3) → (2). Without `volatile`, Thread B can read a non-null but **incompletely constructed** object, bypassing the null check and accessing uninitialized fields.

---

### Quick Comparison: `synchronized` vs `ReentrantLock`

| Feature | `synchronized` | `ReentrantLock` |
|:---|:---|:---|
| Lock/unlock scope | Lexical (block/method) | Programmatic (`lock()`/`unlock()`) |
| Fairness | Not configurable | `new ReentrantLock(true)` |
| Try-lock with timeout | ❌ | `tryLock(5, TimeUnit.SECONDS)` |
| Interruptible waiting | ❌ | `lockInterruptibly()` |
| Multiple conditions | Single wait-set per object | Multiple `Condition` objects |
| Performance (low contention) | Slightly faster (JVM optimized) | Slightly slower |
| Forget-to-unlock risk | Zero (auto-released by JVM) | Must use `finally` |
| **Recommendation** | Default for simple cases | Use when advanced features are needed |

---

## Explicit Locks

### `ReentrantLock`

Provides all the capabilities of `synchronized` plus programmatic control over lock acquisition.

```java
private final ReentrantLock lock = new ReentrantLock();

public void update() {
    lock.lock();
    try {
        sharedState++;
    } finally {
        lock.unlock(); // MUST be in finally — an exception must not leak the lock
    }
}
```

#### `tryLock()` — Avoiding Deadlocks with Timeouts

The most valuable feature `ReentrantLock` adds over `synchronized`: the ability to *give up* if a lock is unavailable.

```java
public boolean tryUpdate() {
    try {
        if (lock.tryLock(2, TimeUnit.SECONDS)) {
            try {
                sharedState++;
                return true;
            } finally {
                lock.unlock();
            }
        } else {
            log.warn("Could not acquire lock within timeout — skipping");
            return false;  // fail fast instead of deadlocking
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return false;
    }
}
```

#### `Condition` Variables — Precise Thread Signaling

`Condition` is `ReentrantLock`'s equivalent of `wait()`/`notify()`, but with the ability to have **multiple independent wait-sets** on the same lock — one of the most important correctness improvements over `synchronized`.

```java
public class BoundedBuffer<T> {
    private final Queue<T> queue    = new LinkedList<>();
    private final int capacity;
    private final ReentrantLock lock     = new ReentrantLock();
    private final Condition notFull      = lock.newCondition();  // producers wait here
    private final Condition notEmpty     = lock.newCondition();  // consumers wait here

    public BoundedBuffer(int capacity) { this.capacity = capacity; }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (queue.size() == capacity) notFull.await();
            queue.add(item);
            notEmpty.signal();       // wake exactly ONE waiting consumer
        } finally {
            lock.unlock();
        }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) notEmpty.await();
            T item = queue.remove();
            notFull.signal();        // wake exactly ONE waiting producer
            return item;
        } finally {
            lock.unlock();
        }
    }
}
```

> **Why two `Condition`s beat `notifyAll()`**: With `synchronized`, there is one wait-set. `notifyAll()` wakes every waiting thread — both producers and consumers — even though only one type can make progress. Pointless wake-ups burn CPU and induce contention. With two `Condition` objects, `signal()` wakes *exactly the right thread*: a producer signals a consumer, and vice versa.

:::tip[Always use `while`, not `if`, before `await()`]
Spurious wakeups can occur — a thread may wake up from `await()` without being signaled. Always re-check the condition in a `while` loop after returning from `await()`. This is non-optional.
:::

---

### `ReadWriteLock` (`ReentrantReadWriteLock`)

Optimizes for workloads where reads dominate writes: any number of threads can hold the **read lock** simultaneously, but the **write lock** is fully exclusive — it blocks all readers *and* other writers.

```java
public class ConfigCache {
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Map<String, String> cache = new HashMap<>();

    // Multiple threads read concurrently — no blocking among readers
    public String getConfig(String key) {
        rwLock.readLock().lock();
        try {
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    // Write lock blocks ALL readers and writers while active
    public void reloadConfig(Map<String, String> newConfig) {
        rwLock.writeLock().lock();
        try {
            cache.clear();
            cache.putAll(newConfig);
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
// Ideal: config read 10,000×/sec, reloaded once per minute
```

#### 🧠 Writer Starvation — The Hidden Failure Mode

`ReentrantReadWriteLock` in **non-fair mode** (the default) is biased toward readers. If new read requests arrive in a continuous stream, a waiting writer may never get the lock — this is **writer starvation**.

```java
// Fix: enable fair mode — waiting threads are granted the lock in FIFO order
private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock(true);
```

Fair mode solves starvation but reduces throughput for readers: they can no longer sneak in ahead of a waiting writer. The right choice depends on how critical write latency is versus read throughput. If reads are extremely frequent and writes are rare but time-sensitive (e.g., config reloads during incidents), fair mode is the right default.

#### Lock Downgrading

`ReentrantReadWriteLock` supports **downgrading** a write lock to a read lock atomically — useful when you want to continue reading the data you just wrote without a gap where another writer could interfere.

```java
public void updateAndRead() {
    rwLock.writeLock().lock();
    try {
        cache.put("key", "newValue");     // perform write

        rwLock.readLock().lock();         // acquire read lock WHILE still holding write lock
    } finally {
        rwLock.writeLock().unlock();      // release write lock — now only holding read lock
    }
    try {
        return cache.get("key");          // safe read — no other writer can enter
    } finally {
        rwLock.readLock().unlock();
    }
}
```

> **Important**: Lock *upgrading* (read → write) is **not supported** by `ReentrantReadWriteLock` — attempting it deadlocks, because the write lock waits for all read locks to release, including the one held by the upgrading thread. Use `StampedLock` if you need upgrade semantics.

---

### `StampedLock`

`StampedLock` is the highest-throughput locking option in Java for **ultra-read-heavy, write-rare workloads**. It adds a third mode — **optimistic read** — that doesn't actually acquire any lock at all.

```java
private final StampedLock lock = new StampedLock();
private double balance = 100.0;

public double readBalance() {
    // Step 1: Try an optimistic read — costs almost nothing (no lock acquired)
    long stamp = lock.tryOptimisticRead();
    double currentBalance = balance;

    // Step 2: Validate — did any writer intervene since the stamp was issued?
    if (!lock.validate(stamp)) {
        // Step 3: Validation failed — fall back to a proper read lock
        stamp = lock.readLock();
        try {
            currentBalance = balance;
        } finally {
            lock.unlockRead(stamp);
        }
    }
    return currentBalance;
}

public void deposit(double amount) {
    long stamp = lock.writeLock();
    try {
        balance += amount;
    } finally {
        lock.unlockWrite(stamp);
    }
}
```

**How optimistic read works**: `tryOptimisticRead()` returns a stamp (a version counter). The thread reads data *without acquiring any lock*. Then `validate(stamp)` checks whether any writer has modified the data since the stamp was issued. If not, the read was coherent and consistent — effectively free. If a write did occur, validate returns false and the thread falls back to a real read lock.

**When optimistic reads win big**: when reads are vastly more frequent than writes, the common case (no write occurred) is essentially zero-cost. Traditional read locks still involve an atomic CAS on every read, which creates cache-line contention at high concurrency. Optimistic reads avoid this entirely.

:::danger[StampedLock Critical Limitations]
**1. NOT reentrant.** A thread holding a `StampedLock` write lock that tries to acquire any lock again will deadlock itself.

**2. No `Condition` support.** Cannot create condition variables on a `StampedLock`.

**3. Not interruption-friendly by default.** Use `readLockInterruptibly()` or `writeLockInterruptibly()` if you need interruption support.

**4. Stamps are not capabilities.** Passing a stamp to another thread and having that thread release the lock with it will corrupt the lock's internal state. The same thread that acquires must release.
:::

---

### 🧠 Complete Lock Comparison Matrix

| Feature | `synchronized` | `ReentrantLock` | `ReadWriteLock` | `StampedLock` |
|:---|:---|:---|:---|:---|
| Lock type | Exclusive | Exclusive | Shared R / Exclusive W | Optimistic / Shared R / Exclusive W |
| Reentrant | ✅ | ✅ | ✅ | ❌ |
| Fairness configurable | ❌ | ✅ | ✅ | ❌ |
| Try-lock / Timeout | ❌ | ✅ | ✅ | ✅ |
| Interruptible | ❌ | ✅ | ✅ | ✅ (with `*Interruptibly`) |
| Condition variables | 1 implicit | Multiple | Multiple (write only) | ❌ |
| Optimistic read | ❌ | ❌ | ❌ | ✅ |
| Lock downgrade (W→R) | ❌ | ❌ | ✅ | ✅ |
| Lock upgrade (R→W) | ❌ | ❌ | ❌ | ✅ (`tryConvertToWriteLock`) |
| Best for | Simple mutual exclusion | Advanced control flow | Read-heavy, infrequent writes | Ultra-read-heavy, near-zero writes |

---

## Thread Coordination Utilities

The locks above are about *protection* — preventing concurrent access to shared state. The utilities below are about *coordination* — controlling the relative sequencing of thread execution. They are all built on AQS.

---

### `CountDownLatch`

A one-shot countdown gate: N threads decrement the latch by calling `countDown()`; one or more threads block on `await()` until the count reaches zero. **The count cannot be reset** — once a latch reaches zero, it stays zero permanently.

<ConcurrencyCoordinationDiagram defaultTab="LATCH" />

#### Real-World Use Case: Parallel Service Initialization

```java
public class ServiceBootstrap {

    public static void main(String[] args) throws InterruptedException {
        int serviceCount = 3;
        CountDownLatch readyLatch = new CountDownLatch(serviceCount);

        // Launch all services concurrently
        ExecutorService executor = Executors.newFixedThreadPool(serviceCount);

        executor.submit(() -> initService("DatabaseService",  2000, readyLatch));
        executor.submit(() -> initService("CacheService",     1000, readyLatch));
        executor.submit(() -> initService("MessageBroker",    1500, readyLatch));

        // Main thread blocks here until ALL 3 services report ready
        boolean allReady = readyLatch.await(10, TimeUnit.SECONDS);

        if (allReady) {
            System.out.println("All services ready — starting HTTP server");
        } else {
            System.err.println("Timeout: not all services initialized in time");
            System.exit(1);
        }

        executor.shutdown();
    }

    private static void initService(String name, long delayMs, CountDownLatch latch) {
        try {
            Thread.sleep(delayMs);
            System.out.printf("[%s] Initialized%n", name);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            latch.countDown();  // MUST be in finally — an exception must not prevent countdown
        }
    }
}
```

#### 🧠 Multiple Latches for Multi-Phase Start Sequences

A common pattern in integration tests: one latch signals that the "starting gun" has fired (unblocking all workers simultaneously), and a second latch waits for all workers to complete.

```java
public class StartingGunDemo {

    public static void main(String[] args) throws InterruptedException {
        int workerCount = 5;
        CountDownLatch startGun     = new CountDownLatch(1);           // 1 count — fires once
        CountDownLatch finishLine   = new CountDownLatch(workerCount); // N counts — one per worker

        ExecutorService pool = Executors.newFixedThreadPool(workerCount);
        for (int i = 0; i < workerCount; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    startGun.await();            // ALL workers block here until released
                    System.out.printf("Worker %d running%n", id);
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    finishLine.countDown();
                }
            });
        }

        System.out.println("Ready... Set...");
        Thread.sleep(500);
        startGun.countDown();                    // Release ALL workers simultaneously
        finishLine.await();                      // Wait for ALL workers to complete
        System.out.println("All workers done");
        pool.shutdown();
    }
}
```

#### CountDownLatch vs. `join()`

`Thread.join()` requires you to hold a reference to every thread you're waiting on, and cannot be used with thread pools. `CountDownLatch` decouples the "waiting" logic from thread references and works naturally with `ExecutorService`. Prefer `CountDownLatch` whenever threads come from a pool.

---

### `CyclicBarrier`

A **reusable** meeting point: N threads each call `await()` and block until all N have arrived. Then all N are released simultaneously, and the barrier resets for the next cycle. Optionally, a **barrier action** runs once when the last thread arrives, before any are released.

<ConcurrencyCoordinationDiagram defaultTab="BARRIER" />

#### Real-World Use Case: Parallel Matrix Computation

```java
public class ParallelMatrixProcessor {
    private final int[][] matrix;
    private final int threadCount;
    private final CyclicBarrier barrier;

    public ParallelMatrixProcessor(int[][] matrix, int threadCount) {
        this.matrix      = matrix;
        this.threadCount = threadCount;
        // Barrier action: runs on the last arriving thread before all are released
        this.barrier     = new CyclicBarrier(threadCount, this::mergeResults);
    }

    public void process() throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        int rowsPerThread    = matrix.length / threadCount;

        for (int t = 0; t < threadCount; t++) {
            final int startRow = t * rowsPerThread;
            final int endRow   = (t == threadCount - 1) ? matrix.length : startRow + rowsPerThread;
            pool.submit(() -> {
                for (int phase = 0; phase < 3; phase++) {    // 3 computation phases
                    processRows(startRow, endRow, phase);
                    try {
                        barrier.await();  // Wait for ALL threads to finish this phase
                        // Barrier resets automatically — same threads run next phase
                    } catch (InterruptedException | BrokenBarrierException e) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                }
            });
        }
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.MINUTES);
    }

    private void processRows(int start, int end, int phase) {
        System.out.printf("Processing rows %d-%d in phase %d%n", start, end, phase);
    }

    private void mergeResults() {
        System.out.println("All threads completed phase — merging results");
    }
}
```

#### 🧠 `BrokenBarrierException` — The Failure Mode to Handle

If any thread waiting at a `CyclicBarrier` is interrupted, or the barrier action throws, the barrier enters a **broken** state. All current and future `await()` calls on that barrier throw `BrokenBarrierException`. The barrier is permanently broken — it will never reset. You must create a new instance.

```java
// Handling a broken barrier
try {
    barrier.await();
} catch (BrokenBarrierException e) {
    log.error("Barrier broken — abandoning this computation batch");
    // Do NOT continue with this barrier instance; create a new one
    return;
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    return;
}
```

#### CountDownLatch vs. CyclicBarrier

| Aspect | `CountDownLatch` | `CyclicBarrier` |
|:---|:---|:---|
| Reusable | ❌ One-shot | ✅ Resets after each cycle |
| Who decrements | Any thread (typically worker threads) | The waiting threads themselves |
| Who waits | Typically a separate coordinating thread | All N threads wait for each other |
| Barrier action | ❌ | ✅ Runs once per cycle on last arrival |
| Broken state | N/A — doesn't break | ✅ Can enter broken state permanently |
| Best for | "Wait for N things to complete" | "All N threads rendezvous before continuing" |

---

### `Semaphore`

A **counting semaphore** that controls concurrent access to a **pool of resources**. The semaphore holds N permits. `acquire()` takes a permit (blocking if none available); `release()` returns a permit. Unlike locks, the thread that calls `release()` does not have to be the same thread that called `acquire()`.

<ConcurrencyCoordinationDiagram defaultTab="SEMAPHORE" />

#### Real-World Use Case: Database Connection Pool

```java
public class DatabaseConnectionPool {
    private final Semaphore semaphore;
    private final Queue<Connection> connections;

    public DatabaseConnectionPool(int poolSize) throws SQLException {
        this.semaphore   = new Semaphore(poolSize, true); // fair = true
        this.connections = new ConcurrentLinkedQueue<>();
        for (int i = 0; i < poolSize; i++) {
            connections.add(DriverManager.getConnection("jdbc:mysql://localhost/db", "user", "pass"));
        }
    }

    public Connection acquire() throws InterruptedException {
        semaphore.acquire();          // blocks until a connection is available
        return connections.poll();
    }

    public void release(Connection conn) {
        if (conn != null) {
            connections.offer(conn);
            semaphore.release();      // return permit — wakes a waiting thread
        }
    }
}
```

#### Real-World Use Case: Rate Limiter (Throttling)

```java
public class RateLimiter {
    private final Semaphore semaphore;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public RateLimiter(int maxRequestsPerSecond) {
        this.semaphore = new Semaphore(maxRequestsPerSecond);
        // Replenish all permits every second
        scheduler.scheduleAtFixedRate(
            () -> semaphore.release(maxRequestsPerSecond - semaphore.availablePermits()),
            1, 1, TimeUnit.SECONDS
        );
    }

    public boolean tryAcquire() {
        return semaphore.tryAcquire();   // non-blocking — returns false if over limit
    }

    public void shutdown() {
        scheduler.shutdown();
    }
}
```

#### 🧠 Semaphore Fairness

Like `ReentrantLock`, `Semaphore` can be constructed in **fair mode** (`new Semaphore(n, true)`), which grants permits in FIFO order. Non-fair (default) can be more throughput-efficient but allows thread starvation. For connection pools where every waiting caller deserves a fair chance, fair mode is the right default.

#### Semaphore vs. ReentrantLock

| Aspect | `Semaphore` | `ReentrantLock` |
|:---|:---|:---|
| Permit count | N permits (arbitrary) | 1 implicit permit |
| Who can release | **Any** thread | Must be the acquiring thread |
| Reentrant | ❌ (acquiring twice blocks) | ✅ |
| Use case | Resource pools, rate limiting | Mutual exclusion critical sections |

---

### `Exchanger`

A **bidirectional synchronization point** where exactly **two threads swap a single object**. Both threads call `exchange()` and block until the other arrives. Once both are present, they atomically swap their objects and both are released.

<ConcurrencyCoordinationDiagram defaultTab="EXCHANGER" />

#### Real-World Use Case: Double-Buffered Pipeline

```java
public class DoubleBufferedPipeline {
    private final Exchanger<List<String>> exchanger = new Exchanger<>();

    // Producer: fills a buffer, swaps with consumer, fills the other buffer
    public void producer() throws InterruptedException {
        List<String> fillingBuffer = new ArrayList<>();
        while (true) {
            for (int i = 0; i < 100; i++) {
                fillingBuffer.add("event-" + System.nanoTime());
            }
            // Hand off full buffer, receive an empty one from the consumer
            fillingBuffer = exchanger.exchange(fillingBuffer);
            fillingBuffer.clear();   // reuse the now-empty buffer
        }
    }

    // Consumer: receives full buffer, processes it, hands back empty buffer
    public void consumer() throws InterruptedException {
        List<String> processingBuffer = new ArrayList<>();
        while (true) {
            // Hand back processed (now empty) buffer, receive a full one from the producer
            processingBuffer = exchanger.exchange(processingBuffer);
            for (String event : processingBuffer) {
                process(event);   // process while producer refills the other buffer
            }
        }
    }

    private void process(String event) {
        System.out.println("Processing: " + event);
    }
}
```

> **Why this matters**: The double-buffer pattern eliminates idle time for both producer and consumer — while the consumer is processing one buffer, the producer is filling the other. The exchange point is the only moment either thread waits. This is the same principle used in graphics rendering (front/back buffers) and I/O streaming.

#### `Exchanger` limitations

`Exchanger` is strictly for **exactly two threads**. There's no built-in support for N-way exchanges. If you need N threads to share data at a barrier point, `CyclicBarrier` with a barrier action (which can perform the merge/swap) is the right tool.

---

### `Phaser`

`Phaser` is the most powerful and flexible coordination utility in Java — it generalizes *both* `CountDownLatch` and `CyclicBarrier` and adds dynamic registration.

**Key concepts:**
- **Phase number**: starts at 0, increments by 1 after every completed phase.
- **Registered parties**: threads that must arrive at each barrier before the phase advances.
- **Dynamic registration**: parties can `register()` and `arriveAndDeregister()` at runtime — unlike `CyclicBarrier` where the count is fixed at construction.

```java
Phaser phaser = new Phaser(1); // "1" registers the main thread as a party

// Dynamically register worker threads at runtime
for (int i = 0; i < 3; i++) {
    phaser.register();                  // add one more party
    new Thread(() -> {
        phaser.arriveAndAwaitAdvance(); // wait for phase 0
        // ... do phase 1 work ...
        phaser.arriveAndAwaitAdvance(); // wait for phase 1
        // ... do phase 2 work ...
        phaser.arriveAndDeregister();   // done — remove from future phases
    }).start();
}

phaser.arriveAndAwaitAdvance(); // main thread participates in phase 0
phaser.arriveAndDeregister();   // main thread is done
```

#### Real-World Use Case: Multi-Phase ETL Pipeline

```java
public class ETLPipeline {

    public void run(List<String> sourceFiles) throws InterruptedException {
        int workers = 4;
        // Register main thread + all workers
        Phaser phaser = new Phaser(1 + workers) {
            // Override onAdvance to run logic between phases, and to terminate
            @Override
            protected boolean onAdvance(int phase, int registeredParties) {
                System.out.printf("=== Phase %d complete. Parties: %d ===%n", phase, registeredParties);
                return registeredParties == 0; // terminate when no parties remain
            }
        };

        ExecutorService pool = Executors.newFixedThreadPool(workers);
        List<String> chunk   = sourceFiles;

        for (int w = 0; w < workers; w++) {
            final int workerId = w;
            pool.submit(() -> {
                try {
                    // PHASE 0: Extract
                    List<String> extracted = extract(chunk, workerId);
                    phaser.arriveAndAwaitAdvance();

                    // PHASE 1: Transform
                    List<String> transformed = transform(extracted, workerId);
                    phaser.arriveAndAwaitAdvance();

                    // PHASE 2: Load
                    load(transformed, workerId);
                    phaser.arriveAndDeregister();

                } catch (Exception e) {
                    phaser.arriveAndDeregister(); // always deregister on failure
                }
            });
        }

        // Main thread waits through all 3 phases
        phaser.arriveAndAwaitAdvance(); // phase 0 done
        phaser.arriveAndAwaitAdvance(); // phase 1 done
        phaser.arriveAndDeregister();   // main done, phase 2 completes via workers

        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.MINUTES);
    }

    private List<String> extract(List<String> data, int id)    { /* ... */ return data; }
    private List<String> transform(List<String> data, int id)  { /* ... */ return data; }
    private void load(List<String> data, int id)               { /* ... */ }
}
```

#### `Phaser` Termination

A `Phaser` terminates when `onAdvance()` returns `true`. After termination, `arriveAndAwaitAdvance()` returns immediately with a negative phase number (the terminated phase negated minus 1). You can check termination with `phaser.isTerminated()`.

#### 🧠 Phaser vs. CountDownLatch vs. CyclicBarrier

| Feature | `CountDownLatch` | `CyclicBarrier` | `Phaser` |
|:---|:---|:---|:---|
| Reusable | ❌ One-shot | ✅ Auto-reset | ✅ Multi-phase |
| Dynamic parties | ❌ Fixed at construction | ❌ Fixed at construction | ✅ `register()` / `deregister()` |
| Multiple phases | ❌ (needs multiple latches) | ❌ (same count per cycle) | ✅ Built-in phase counter |
| Barrier action | ❌ | ✅ (per cycle) | ✅ `onAdvance()` (per phase) |
| Tiered hierarchy | ❌ | ❌ | ✅ Can chain phasers as parent/child |
| Termination | N/A | Via `BrokenBarrierException` | Via `onAdvance()` returning `true` |
| Best for | One-time "all done" signal | N-thread rendezvous per iteration | Complex multi-phase, dynamic-party workflows |

---

## AQS (AbstractQueuedSynchronizer)

AQS is the **internal backbone** for `ReentrantLock`, `Semaphore`, `CountDownLatch`, `CyclicBarrier`, and `Phaser`. Understanding it is what truly differentiates a senior Java engineer's mental model of concurrency.

### The Core Idea

AQS manages a single `int state` (a volatile integer), a **CLH-variant queue** of waiting threads, and a set of protected methods that subclasses override to give the state semantic meaning:

<AQSArchitectureDiagram />

### How a Lock Acquisition Works Internally

```java
// This is conceptually what happens when you call lock.lock() on a ReentrantLock:

protected boolean tryAcquire(int acquires) {
    Thread current = Thread.currentThread();
    int c = getState();

    if (c == 0) {
        // Lock is free — try to atomically set state from 0 to 1
        if (compareAndSetState(0, 1)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    } else if (current == getExclusiveOwnerThread()) {
        // Reentrant acquisition — increment depth
        setState(c + acquires);
        return true;
    }
    return false;  // Failed to acquire — AQS will enqueue this thread in the CLH queue
}
```

When `tryAcquire` returns false, AQS:
1. Creates a `Node` for the thread and appends it to the CLH queue tail (using CAS to avoid locks on the queue itself).
2. Calls `LockSupport.park(thread)` — suspends the thread without busy-waiting (unlike spin-locks).
3. When the lock is released, the head node's successor is found and `LockSupport.unpark(successor)` wakes it.

### Why This Architecture Matters

Every high-level utility you've seen in this doc (`CountDownLatch`, `Semaphore`, etc.) is just a thin wrapper that tells AQS what the `state` integer *means*:

| Class | `state` meaning | `tryAcquire` / `tryRelease` semantics |
|:---|:---|:---|
| `ReentrantLock` | 0 = free, N = lock depth | Acquire: CAS(0 → 1); Release: decrement |
| `Semaphore` | N = available permits | Acquire: decrement if N > 0; Release: increment |
| `CountDownLatch` | N = remaining count | Acquire: succeed only if N == 0; Release: decrement |
| `CyclicBarrier` | Uses `ReentrantLock` + `Condition` internally | Not directly AQS subclass |

This is why all these primitives share the same queueing, parking, and unparking behavior — it's all AQS. The variation is only in the state-machine logic the subclass defines.

:::tip[Senior Interview Deep Dive]
Because AQS internals (CLH queue structure, `LockSupport.park()`, `Unsafe`-based CAS operations, and the `ConditionObject` inner class) are one of the most rigorously tested topics in Senior Java interviews, we have dedicated an entire guide to it.

👉 **[Read the AbstractQueuedSynchronizer Deep Dive](./java-aqs-internals)**
:::

---

## Choosing the Right Tool — Decision Guide

<LockDecisionTreeDiagram />

---

## Best Practices

1. **Always unlock in a `finally` block.** An exception between `lock()` and `unlock()` must not leave the lock permanently held — that deadlocks every other thread that ever needs it.

2. **Always use `while`, never `if`, before `await()`.** Spurious wakeups are real. A thread that returns from `await()` without being explicitly signaled must re-check its condition.

3. **Prefer `CountDownLatch` over raw `Thread.join()` in pooled environments.** Pools don't expose thread references; `CountDownLatch` decouples waiting from thread identity.

4. **Understand your fairness trade-off.** Fair mode (`ReentrantLock(true)`, `Semaphore(n, true)`, `ReentrantReadWriteLock(true)`) prevents starvation but reduces aggregate throughput. Non-fair mode maximizes throughput but allows individual threads to starve under high contention. Choose based on your latency SLA, not convenience.

5. **`StampedLock` requires disciplined usage.** Never call `lock()` twice from the same thread. Never pass stamps between threads. Keep stamped sections short and free of blocking calls.

6. **Use `Phaser` when `CountDownLatch` or `CyclicBarrier` require awkward workarounds** — multiple latches for multiple phases, or dynamically joining/leaving the barrier group. Those are signals that `Phaser` is the right fit.

7. **Monitor thread contention in production.** JVM thread dumps (`jstack`) and JFR (Java Flight Recorder) lock-contention events reveal which locks are hot. High contention on a `synchronized` block is often fixed by switching to `ReadWriteLock` or reducing critical section scope — not by always jumping to more complex primitives.