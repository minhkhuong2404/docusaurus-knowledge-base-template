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

### 👶 Beginner Concept: The "Restaurant Kitchen"
Multithreading is famously difficult to learn. Imagine a massive, professional kitchen:
- **The Process:** This is the *entire kitchen building*. It has its own isolated walls, 5 ovens, and a giant walk-in fridge (The Heap Memory). If the kitchen building burns down, the restaurant next door is totally fine (Crash Isolation).
- **The Threads:** These are the *individual Chefs* working inside the kitchen. They all share the exact same ovens and fridge (Shared Memory). They each have their own personal cutting board (The Call Stack). 
  - **The Danger:** Because the chefs share the fridge, if Chef A takes the last onion, and Chef B blindly reaches for it at the exact same millisecond, you get a kitchen disaster (A Race Condition).

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

### 👶 Beginner Example: Seeing `start()` vs `run()` in Action

This example makes the difference unmistakable:

```java
public class StartVsRun {
    public static void main(String[] args) {
        Runnable task = () -> System.out.println(
            "Executing on: " + Thread.currentThread().getName()
        );

        Thread t1 = new Thread(task, "Worker-Thread");

        // ❌ Wrong — runs synchronously in main thread
        t1.run();    // Output: "Executing on: main"

        // ✅ Correct — spawns a new OS thread
        t1.start();  // Output: "Executing on: Worker-Thread"
    }
}
```

:::info[Interview Focus: `start()` vs `run()`]
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

:::tip[Interview Focus: Thread Control Methods]
**Q: What is the difference between `Thread.sleep()` and `Object.wait()`?** 1. **Lock Release:** `sleep()` does *not* release the monitor lock. `wait()` *releases* the lock, allowing other threads to enter the synchronized block.
2. **Origin:** `sleep()` is a static method in `Thread`. `wait()` is an instance method in `Object`.
3. **Usage Context:** `wait()` must be called inside a `synchronized` block/method. `sleep()` can be called anywhere.
:::

### Thread Coordination: `join()` and `interrupt()`

#### `Thread.join()` — Wait for Another Thread to Finish

`join()` makes the calling thread **block and wait** until the target thread completes. This is essential when one thread depends on the result of another.

```java
public class JoinExample {
    public static void main(String[] args) throws InterruptedException {
        Thread dataLoader = new Thread(() -> {
            System.out.println("Loading data from database...");
            try { Thread.sleep(2000); } catch (InterruptedException e) { /* ... */ }
            System.out.println("Data loaded.");
        });

        dataLoader.start();
        dataLoader.join();  // Main thread BLOCKS here until dataLoader finishes
        // join(5000) — wait at most 5 seconds, then continue regardless

        System.out.println("Processing data...");  // Guaranteed to run AFTER data is loaded
    }
}
```

#### `Thread.interrupt()` — Cooperative Cancellation

Java threads cannot be forcibly killed (`Thread.stop()` is deprecated). Instead, `interrupt()` sets a **flag** that the target thread must cooperatively check:

```java
Thread worker = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        // do work...
    }
    System.out.println("Worker noticed interrupt, cleaning up...");
});

worker.start();
Thread.sleep(1000);
worker.interrupt();  // Sets the interrupt flag — does NOT kill the thread

// If the thread is in sleep()/wait()/join(), an InterruptedException is thrown.
// Best practice: catch it and re-set the flag:
// catch (InterruptedException e) { Thread.currentThread().interrupt(); }
```

:::danger[Common Mistake: Swallowing InterruptedException]
Never write `catch (InterruptedException e) { /* ignore */ }`. This silently clears the interrupt flag, preventing upstream code from knowing the thread was interrupted. Always re-interrupt: `Thread.currentThread().interrupt()`.
:::

### Daemon Threads

Daemon threads are **background service threads** that the JVM terminates automatically when all non-daemon (user) threads finish. They are used for housekeeping tasks like garbage collection, monitoring, or background cache cleanup.

```java
Thread daemon = new Thread(() -> {
    while (true) {
        cleanExpiredCacheEntries();
        try { Thread.sleep(60_000); } catch (InterruptedException e) { break; }
    }
});
daemon.setDaemon(true);  // MUST be set BEFORE start()
daemon.start();

// When main() and all user threads finish, this daemon is killed automatically.
// ⚠️ Daemon threads do NOT run finally blocks or shutdown hooks on JVM exit!
```

> **Use case:** Log flushing, heartbeat pings, periodic metric collection — any task where abrupt termination is acceptable.

### Deadlock

Deadlock occurs when two or more threads are **blocked forever**, each waiting for a lock held by the other.

**Four necessary conditions:**
1. **Mutual exclusion** — resources cannot be shared.
2. **Hold and wait** — holding one lock while waiting for another.
3. **No preemption** — locks cannot be forcibly taken.
4. **Circular wait** — A waits for B, B waits for A.

#### 👶 Beginner Example: Deadlock in Code

```java
public class DeadlockDemo {
    private static final Object LOCK_A = new Object();
    private static final Object LOCK_B = new Object();

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            synchronized (LOCK_A) {                    // 1. t1 acquires LOCK_A
                System.out.println("T1: Holding LOCK_A, waiting for LOCK_B...");
                try { Thread.sleep(50); } catch (InterruptedException e) {}
                synchronized (LOCK_B) {                // 3. t1 waits for LOCK_B (held by t2) → DEADLOCK
                    System.out.println("T1: Got both locks!");
                }
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (LOCK_B) {                    // 2. t2 acquires LOCK_B
                System.out.println("T2: Holding LOCK_B, waiting for LOCK_A...");
                try { Thread.sleep(50); } catch (InterruptedException e) {}
                synchronized (LOCK_A) {                // 4. t2 waits for LOCK_A (held by t1) → DEADLOCK
                    System.out.println("T2: Got both locks!");
                }
            }
        });

        t1.start();
        t2.start();
        // Both threads hang forever. Use jstack <pid> or ThreadMXBean to detect.
    }
}

// FIX: Both threads acquire locks in the SAME order (LOCK_A → LOCK_B)
```

**Prevention:** Always acquire locks in a **consistent global order**.

### Deadlock vs Livelock vs Starvation

| Problem       | Behavior | Threads Blocked? | Example |
|:---|:---|:---|:---|
| **Deadlock**  | Threads wait for each other's locks **forever** | Yes — permanently blocked | T1 holds A, waits B; T2 holds B, waits A |
| **Livelock**  | Threads keep **reacting** to each other but make **no progress** | No — actively running, but useless | Two people in a hallway keep stepping aside for each other |
| **Starvation** | A thread **never gets CPU time** because higher-priority threads monopolize the scheduler | Partially — runnable but never scheduled | A low-priority thread never acquires a `ReentrantLock(fair=false)` |

:::tip[How to detect deadlocks in production]
1. **`jstack <pid>`** — prints all thread stack traces; JVM automatically detects and reports deadlock cycles.
2. **`ThreadMXBean.findDeadlockedThreads()`** — programmatic detection you can wire into health checks.
3. **`ReentrantLock.tryLock(timeout)`** — prevents deadlocks by failing instead of blocking forever.
:::

---

## 2. Synchronization Primitives

### 👶 Beginner Example: Race Condition in Action

Before learning synchronization, you must *see* what breaks without it:

```java
public class RaceConditionDemo {
    private static int counter = 0;

    public static void main(String[] args) throws InterruptedException {
        Runnable task = () -> {
            for (int i = 0; i < 100_000; i++) {
                counter++;  // NOT atomic: read → increment → write (3 steps)
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
// Fix: use synchronized, AtomicInteger, or ReentrantLock
```

> **Why?** Both threads read `counter = 5`, both compute `5 + 1 = 6`, both write `6`. One increment is **lost**. This is the classic "lost update" race condition.

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

:::tip[Interview Focus: Lock Escalation (JDK 1.6+)]
**Q: How did JDK 1.6 optimize `synchronized`?** To reduce the heavy OS-level context switching overhead, Java introduced **Lock Escalation**:
1. **Biased Locking:** Assumes only one thread will access the block. Marks the object header with the thread ID.
2. **Lightweight Locking:** If another thread requests the lock, it upgrades to a lightweight lock. The new thread uses CAS (Compare-And-Swap) to spin and wait for the lock.
3. **Heavyweight Locking:** If the spin-lock fails too many times (high contention), it escalates to a heavyweight lock, which delegates to the OS mutex, blocking threads entirely.
:::

### `volatile`

Ensures **visibility** and prevents JVM **instruction reordering**.

#### 👶 Beginner Concept: The "Whiteboard vs Pocket Notebook"
When a Chef (Thread) works, she doesn't want to constantly walk to the giant fridge (Main System RAM) just to check the temperature of an oven. So, she writes the temperature down in her personal *Pocket Notebook* (CPU L1 Cache).
- If Chef A updates the oven temp in her notebook, Chef B has *no idea* it changed because Chef B is looking at his own notebook! (A Visibility Problem).
- Adding the `volatile` keyword tells the Chefs: "Do not write this in your notebook. You must walk over and write this change on the giant shared Whiteboard (Main System RAM) for everyone to see instantly."

```java
private volatile boolean running = true;
// Writer thread
running = false;  // automatically flushes CPU cache to main RAM
```

#### 🧠 Senior Deep Dive: The MESI Protocol & False Sharing
At the hardware level, `volatile` triggers a **Memory Barrier** (StoreLoad). When a core writes to a volatile variable, it broadcasts an invalidation signal across the motherboard's bus.
- **The Cost:** The CPU's L1/L2 caches use the **MESI** (Modified, Exclusive, Shared, Invalid) cache coherence protocol. The broadcast forces all other CPU cores to mark their cached cache-lines as "Invalid," forcing them to fetch from slow main RAM on the next read.
- **False Sharing:** CPU caches load data in 64-byte chunks (Cache Lines). If two independent `volatile` variables sit next to each other in memory, changing Variable A invalidates the entire 64-byte line, destroying the cache for Variable B even though B never changed! Seniors fix this using `@Contended` (padding objects with blank bytes to force them into separate CPU cache lines).

:::danger[Interview Trap: Volatile Atomicity]
**Q: Does `volatile` guarantee thread safety for `i++`?** No. `volatile` does NOT provide atomicity. `count++` is a read-modify-write operation (3 steps). Multiple threads can still read the same initial value simultaneously. You need `AtomicInteger` or `synchronized` for atomicity.
:::

### 🧠 Double-Checked Locking Singleton (The Classic `volatile` Use Case)

The most famous real-world application of `volatile`. Without `volatile`, this pattern is **broken** due to instruction reordering:

```java
public class Singleton {
    // volatile prevents reordering of object construction steps
    private static volatile Singleton INSTANCE;

    private Singleton() { /* expensive initialization */ }

    public static Singleton getInstance() {
        if (INSTANCE == null) {                    // 1st check: avoid locking on every call
            synchronized (Singleton.class) {
                if (INSTANCE == null) {             // 2nd check: prevent double-creation
                    INSTANCE = new Singleton();
                }
            }
        }
        return INSTANCE;
    }
}
```

> **Why is `volatile` required?** `INSTANCE = new Singleton()` compiles to 3 steps: (1) allocate memory, (2) invoke constructor, (3) assign reference to `INSTANCE`. The JIT can reorder step 3 before step 2. Without `volatile`, Thread B can read a **non-null but uninitialized** `INSTANCE`, bypassing the `null` check and using an object whose constructor hasn't finished.

### Quick Comparison: `synchronized` vs `ReentrantLock`

| Feature | `synchronized` | `ReentrantLock` |
|:---|:---|:---|
| Lock/unlock scope | Lexical (block/method) | Programmatic (`lock()`/`unlock()`) |
| Fairness | Not configurable | `new ReentrantLock(true)` |
| Try-lock with timeout | ❌ Not possible | `tryLock(5, TimeUnit.SECONDS)` |
| Interruptible waiting | ❌ | `lockInterruptibly()` |
| Multiple conditions | Single wait-set per object | Multiple `Condition` objects |
| Performance (low contention) | Slightly faster (JVM optimized) | Slightly slower |
| Risk of forgetting unlock | Impossible (auto-released) | Must use `finally` block |
| **Recommendation** | Default choice for simple cases | Use when you need advanced features |

---

## 3. Locks & AQS

### Choosing a Locking Primitive

When coordinating access to shared mutable state in Java, select the simplest synchronization mechanism that satisfies your throughput, latency, and correctness requirements:

#### `synchronized`
Use when you need simple mutual exclusion with clear, lexical boundaries.
- **Optimized:** Fast under low/zero contention due to JVM lock escalation (biased/lightweight locking).
- **Limitations:** Cannot configure fairness, try-lock timeout, or interruptible lock acquisition.

```java
public synchronized void increment() {
    count++;
}
```

#### `ReentrantLock`
Use when you require advanced capabilities like timeouts, interruptible acquisition, fairness configuration, or multiple condition variables.

```java
private final ReentrantLock lock = new ReentrantLock();

public void update() {
    lock.lock();
    try {
        sharedState++;
    } finally {
        lock.unlock(); // ALWAYS unlock in a finally block
    }
}
```

#### `tryLock()` — Avoiding Deadlocks with Timeouts

```java
private final ReentrantLock lock = new ReentrantLock();

public boolean tryUpdate() {
    try {
        // Try to acquire for 2 seconds; if another thread holds it, give up gracefully
        if (lock.tryLock(2, TimeUnit.SECONDS)) {
            try {
                sharedState++;
                return true;
            } finally {
                lock.unlock();
            }
        } else {
            log.warn("Could not acquire lock within timeout — skipping update");
            return false;  // Fail fast instead of deadlocking
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return false;
    }
}
```

#### `Condition` Variables — Precise Thread Signaling

`Condition` is the `ReentrantLock` equivalent of `wait()`/`notify()`, but with the power of having **multiple wait-sets** on the same lock:

```java
// Producer-Consumer with Condition (more flexible than wait/notify)
public class BoundedBuffer<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull  = lock.newCondition();  // producers wait here
    private final Condition notEmpty = lock.newCondition();  // consumers wait here

    public BoundedBuffer(int capacity) { this.capacity = capacity; }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (queue.size() == capacity) {
                notFull.await();     // Release lock & wait; re-acquire on wake
            }
            queue.add(item);
            notEmpty.signal();       // Wake ONE waiting consumer
        } finally {
            lock.unlock();
        }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) {
                notEmpty.await();    // Release lock & wait; re-acquire on wake
            }
            T item = queue.remove();
            notFull.signal();        // Wake ONE waiting producer
            return item;
        } finally {
            lock.unlock();
        }
    }
}
```

> **Why Condition is better than `wait()`/`notify()`:** With `synchronized`, there is only ONE wait-set. `notifyAll()` wakes ALL waiting threads (both producers AND consumers), even though only one type can make progress. With two `Condition` objects, `signal()` wakes exactly the right thread.

#### `ReadWriteLock` (`ReentrantReadWriteLock`)
Use when read operations are significantly more frequent than write operations, allowing multiple threads to read concurrently while ensuring writes remain exclusive.

##### Real-World Use Case: In-Memory Configuration Cache

```java
public class ConfigCache {
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Map<String, String> cache = new HashMap<>();

    // Multiple threads can read concurrently — no blocking
    public String getConfig(String key) {
        rwLock.readLock().lock();
        try {
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    // Write lock blocks ALL readers AND writers — exclusive access
    public void reloadConfig(Map<String, String> newConfig) {
        rwLock.writeLock().lock();
        try {
            cache.clear();
            cache.putAll(newConfig);
            log.info("Config reloaded: {} entries", newConfig.size());
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
// Perfect when: config is read 1000x/sec but updated once every few minutes
```

#### `StampedLock`
Use in highly read-heavy workloads where standard read locks could starve writers. `StampedLock` supports **optimistic read** operations, which do not block writers. The reader acquires a version stamp, reads the values, and validates the stamp. If a write invalidated the stamp, the reader falls back to a blocking read lock.

```java
private final StampedLock lock = new StampedLock();

public double readWithOptimisticLock() {
    long stamp = lock.tryOptimisticRead();
    double currentVal = balance;
    if (!lock.validate(stamp)) { // Stale read detected?
        stamp = lock.readLock(); // Fallback to standard blocking read lock
        try {
            currentVal = balance;
        } finally {
            lock.unlockRead(stamp);
        }
    }
    return currentVal;
}
```

### 🧠 Complete Lock Comparison Matrix

| Feature | `synchronized` | `ReentrantLock` | `ReadWriteLock` | `StampedLock` |
|:---|:---|:---|:---|:---|
| Lock type | Exclusive | Exclusive | Shared read / Exclusive write | Optimistic read / Shared read / Exclusive write |
| Fairness | Not configurable | Configurable | Configurable | Not configurable |
| Try-lock / Timeout | ❌ | ✅ | ✅ | ✅ |
| Interruptible | ❌ | ✅ | ✅ | ✅ |
| Condition variables | 1 (implicit) | Multiple | Multiple (write lock only) | ❌ |
| Reentrant | ✅ | ✅ | ✅ | ❌ (not reentrant!) |
| Optimistic read | ❌ | ❌ | ❌ | ✅ |
| Best for | Simple mutual exclusion | Advanced locking needs | Read-heavy workloads | Ultra-read-heavy, write-rare |

:::danger[Interview Trap: StampedLock Is NOT Reentrant]
Unlike every other lock in Java, `StampedLock` is **not reentrant**. If a thread holding a `StampedLock` write lock tries to acquire it again, it will **deadlock itself**. Always ensure your code path doesn't recursively enter a stamped-locked section.
:::

### AQS (AbstractQueuedSynchronizer)

AQS is the **foundation framework** for `ReentrantLock`, `Semaphore`, `CountDownLatch`, and `CyclicBarrier`.

> [!TIP] 🧠 Senior Deep Dive
> Because AQS internals are one of the most rigorously tested topics in Senior Java interviews (involving the CLH queue, `LockSupport.park()`, and `Unsafe` memory management), we have dedicated an entire guide to it. 
> 
> 👉 **[Read the AbstractQueuedSynchronizer Deep Dive here](./java-aqs-internals)**

---

## 4. AQS Synchronization Utilities

While `ReentrantLock` provides basic mutual exclusion, the AQS framework powers several high-level coordination utilities essential for distributed systems and microservice architectures.

### 1. `CountDownLatch`
Allows one or more threads to wait until a set of operations being performed in other threads completes.
* **Mechanism:** Initialized with a count. The `await()` methods block until the current count reaches zero due to invocations of `countDown()`.
* **Reusability:** **Cannot be reset.** Once the count reaches zero, it stays zero.

#### Real-World Use Case: Microservice Health-Check Fan-Out

```java
// Application startup: wait for ALL dependent services to become healthy
public class ApplicationBootstrap {
    public void startApplication() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(3);

        executor.submit(() -> { waitForDatabase();     latch.countDown(); });
        executor.submit(() -> { waitForRedis();         latch.countDown(); });
        executor.submit(() -> { waitForMessageBroker(); latch.countDown(); });

        boolean ready = latch.await(30, TimeUnit.SECONDS); // Timeout after 30s
        if (!ready) throw new IllegalStateException("Dependent services not ready!");

        System.out.println("All services initialized. Starting application.");
        startHttpServer();
    }
}
```

### 2. `CyclicBarrier`
Allows a set of threads to all wait for each other to reach a common barrier point. 
* **Mechanism:** Initialized with the number of participating threads. Threads call `await()` when they reach the barrier. Once the last thread calls `await()`, the barrier is tripped, and all threads proceed.
* **Reusability:** **Can be reset** and reused after the barrier is tripped.

#### Real-World Use Case: Multi-Phase Parallel Computation

```java
// Simulation: all worker threads must complete phase N before any starts phase N+1
public class ParallelSimulation {
    private static final int WORKER_COUNT = 4;

    public static void main(String[] args) {
        // Optional barrier action runs after ALL threads arrive (before any proceed)
        CyclicBarrier barrier = new CyclicBarrier(WORKER_COUNT, 
            () -> System.out.println("--- All workers completed phase. Merging results... ---")
        );

        for (int i = 0; i < WORKER_COUNT; i++) {
            final int workerId = i;
            new Thread(() -> {
                try {
                    for (int phase = 1; phase <= 3; phase++) {
                        computePhase(workerId, phase);
                        barrier.await();  // Wait for ALL workers to finish this phase
                        // Barrier resets automatically — ready for next phase!
                    }
                } catch (Exception e) { e.printStackTrace(); }
            }).start();
        }
    }
}
```

### 3. `Semaphore`
Maintains a set of permits. `acquire()` blocks if necessary until a permit is available. `release()` adds a permit, potentially releasing a blocking acquirer. Used heavily for **rate limiting** or resource pooling.

#### Real-World Use Case: Database Connection Pool Limiting

```java
// Limit concurrent database connections to prevent overwhelming the DB
public class DatabaseConnectionPool {
    private final Semaphore semaphore;
    private final BlockingQueue<Connection> pool;

    public DatabaseConnectionPool(int maxConnections) {
        this.semaphore = new Semaphore(maxConnections, true); // fair=true
        this.pool = new ArrayBlockingQueue<>(maxConnections);
        // Pre-create connections...
    }

    public Connection borrowConnection() throws InterruptedException {
        semaphore.acquire();  // Block if all connections are in use
        return pool.take();
    }

    public void returnConnection(Connection conn) {
        pool.offer(conn);
        semaphore.release();  // Signal: a connection is available
    }
}
```

### 4. `Phaser` — The Flexible Barrier

`Phaser` is a **reusable** synchronization barrier that supports a **dynamic number of participants** (parties can register/deregister at any time). It subsumes the capabilities of both `CountDownLatch` and `CyclicBarrier`.

```java
// Dynamic participant registration — threads can join/leave between phases
Phaser phaser = new Phaser(1); // Register self (main thread)

for (int i = 0; i < 3; i++) {
    phaser.register();  // Dynamically add participant
    new Thread(() -> {
        System.out.println(Thread.currentThread().getName() + " arrived at phase " + phaser.getPhase());
        phaser.arriveAndAwaitAdvance(); // Wait for all parties

        System.out.println(Thread.currentThread().getName() + " completed phase 1");
        phaser.arriveAndDeregister();   // Done — leave the phaser
    }).start();
}

phaser.arriveAndAwaitAdvance(); // Main thread waits for phase 0
phaser.arriveAndDeregister();   // Main thread leaves
```

> **When to use `Phaser` over `CyclicBarrier`:** Use `Phaser` when the number of participating threads is not known in advance, or when threads need to join/leave between phases. Use `CyclicBarrier` when the participant count is fixed.

### 5. `Exchanger` — Two-Thread Data Swap

`Exchanger<V>` allows exactly **two threads** to swap data at a rendezvous point. Useful for pipeline-style processing where a producer and consumer exchange buffers.

```java
Exchanger<List<String>> exchanger = new Exchanger<>();

// Producer fills buffer, swaps with consumer's empty buffer
Thread producer = new Thread(() -> {
    List<String> buffer = new ArrayList<>();
    buffer.add("data1"); buffer.add("data2");
    List<String> emptyBuffer = exchanger.exchange(buffer); // swap
    // Now producer has consumer's empty buffer to refill
});
```

:::danger[Interview Trap: CountDownLatch vs CyclicBarrier vs Phaser]
**Q: What is the core difference between CountDownLatch, CyclicBarrier, and Phaser?**
1.  **Who is waiting?** In `CountDownLatch`, usually *one main thread* waits for *N other threads* to finish. In `CyclicBarrier`, *N threads* wait for *each other*. `Phaser` supports both patterns.
2.  **Reusability:** `CountDownLatch` count cannot be reset. `CyclicBarrier` resets automatically. `Phaser` advances to next phase automatically.
3.  **Dynamic parties:** Only `Phaser` supports adding/removing participants at runtime.
:::

---

## 5. Atomic Classes & CAS

### CAS (Compare-And-Swap)

CAS is a **lock-free** atomic operation supported by the CPU: "If the current value equals the expected value, update it. Otherwise, retry." Used extensively in `java.util.concurrent.atomic`.

### 👶 Beginner Example: `AtomicInteger` vs `synchronized`

```java
// ❌ Race condition without synchronization
private int unsafeCount = 0;
unsafeCount++;  // read-modify-write — NOT atomic

// ✅ Option 1: AtomicInteger (lock-free, usually faster)
private final AtomicInteger atomicCount = new AtomicInteger(0);
atomicCount.incrementAndGet();  // Single atomic CPU instruction (CAS loop)

// ✅ Option 2: synchronized (simpler, but acquires a lock)
private int syncCount = 0;
public synchronized void increment() { syncCount++; }
```

### `AtomicReference` & The CAS Loop Pattern

For atomically updating object references or custom logic:

```java
// Thread-safe immutable state update using CAS loop
private final AtomicReference<ImmutableConfig> config = 
    new AtomicReference<>(ImmutableConfig.defaults());

public void updateTimeout(int newTimeout) {
    ImmutableConfig prev, next;
    do {
        prev = config.get();                           // Read current
        next = prev.withTimeout(newTimeout);            // Create new version
    } while (!config.compareAndSet(prev, next));        // CAS: retry if someone else changed it
    // No locks needed! Thread-safe via optimistic concurrency.
}
```

### 🧠 Senior: `LongAdder` & `LongAccumulator` — High-Contention Counters

Under **high contention** (many threads incrementing the same counter), `AtomicLong` becomes a bottleneck because every thread CAS-retries on the same memory location. `LongAdder` solves this by **striping** the counter across multiple cells:

```java
// AtomicLong: all threads compete on ONE variable → CAS retries under contention
AtomicLong atomicCounter = new AtomicLong();
atomicCounter.incrementAndGet();  // Contention hotspot!

// LongAdder: each thread increments its own cell → aggregate on read
LongAdder adder = new LongAdder();
adder.increment();        // Thread writes to its own cell (no contention)
long total = adder.sum(); // Aggregates all cells (slightly expensive read)

// LongAccumulator: generalized version with custom accumulation function
LongAccumulator maxFinder = new LongAccumulator(Long::max, Long.MIN_VALUE);
maxFinder.accumulate(42);     // Thread-safe max tracking
long currentMax = maxFinder.get();
```

#### When to Use What?

| Class | Throughput under Contention | Read Cost | Use Case |
|:---|:---|:---|:---|
| `AtomicInteger/Long` | Degrades with thread count | Cheap (single read) | Low-to-moderate contention; need exact reads |
| `LongAdder` | Scales linearly | Moderate (`sum()` aggregates cells) | High-contention counters (metrics, request counts) |
| `LongAccumulator` | Scales linearly | Moderate | Custom reductions (max, min, running stats) |
| `synchronized` | Worst (OS mutex under contention) | Cheap | Complex multi-step operations |

:::info[Interview Focus: The ABA Problem]
**Q: What is the ABA problem in CAS and how is it solved?** If a value changes from A → B → A, CAS checks the value and sees 'A', incorrectly assuming it was never modified. This is dangerous for structures like lock-free linked lists.

**Concrete scenario:** Thread 1 reads head node A from a lock-free stack. Thread 2 pops A, pops B, then pushes A back. Thread 1's CAS succeeds (head is still A), but the stack structure has changed — node B is lost!

**Solution:** Use `AtomicStampedReference`. It appends a version stamp (integer) to the reference. The CAS operation now checks both the value AND the version stamp.

```java
AtomicStampedReference<String> ref = new AtomicStampedReference<>("A", 0);
int[] stampHolder = new int[1];
String current = ref.get(stampHolder);  // stampHolder[0] = current stamp

// CAS checks BOTH value AND stamp — detects A→B→A
boolean success = ref.compareAndSet(current, "B", stampHolder[0], stampHolder[0] + 1);
```
:::

---

## 6. Java Memory Model (JMM)

### 👶 Why Does This Matter?

> **If you skip this section**, you will one day write code that works perfectly on your MacBook but randomly fails on a 64-core production server. The JMM explains *why* — and it's because your laptop's single CPU doesn't expose the reordering and caching bugs that multi-core systems do.

The **Java Memory Model (JMM)** specifies the contract between the Java code, the JVM, and the physical CPU hardware regarding how memory reads and writes are propagated across threads. It provides a formal framework for visibility, ordering, and synchronization guarantees.

### 💾 Visibility, CPU Caches & Hardware Reality

In modern computers, processors execute instructions at gigahertz speeds, but reading from RAM takes hundreds of clock cycles (the memory wall). To bridge this latency gap, CPUs use L1, L2, and L3 hardware caches:

```
┌──────────┐      ┌──────────┐
│  Core 0  │      │  Core 1  │
│ ┌──────┐ │      │ ┌──────┐ │
│ │  L1  │ │      │ │  L1  │ │
│ └──────┘ │      │ └──────┘ │
└────┬─────┘      └────┬─────┘
     └─────────┬───────┘
           ┌───▼───┐
           │  L2   │
           └───┬───┘
           ┌───▼───┐
           │  L3   │ (Shared Cache)
           └───┬───┘
           ┌───▼───┐
           │  RAM  │ (Main Memory)
           └───────┘
```

When a thread modifies a variable:
1. It writes the change to its **local processor register** or private **store buffer**.
2. It propagates to the **L1/L2 cache** of that core.
3. It may take some time before the dirty cache line is flushed to the shared **L3 cache** or **main memory (RAM)**.
4. Meanwhile, a thread running on another core reads the variable from its *own* L1/L2 cache, seeing a stale value. This is the **visibility problem**.

### 🔄 Instruction Reordering & Data Races

To maximize CPU pipeline throughput, both the compiler (JIT) and the CPU execution engine are allowed to **reorder instructions** as long as the behavior remains identical within a single thread (**as-if-serial semantics**). However, in concurrent environments, reordering can cause catastrophic failures.

Consider the classic data race example:

```java
public class ReorderingExample {
    int x = 0;
    boolean ready = false;

    // Thread 1
    public void writer() {
        x = 42;          // Instruction A
        ready = true;    // Instruction B
    }

    // Thread 2
    public void reader() {
        if (ready) {     // Instruction C
            System.out.println(x); // Instruction D
        }
    }
}
```

Without synchronization:
- The JIT compiler or CPU can reorder `writer()` to execute **B before A** (since they are independent variables).
- If Thread 2 runs `reader()` at the exact moment Thread 1 completes B (`ready = true`) but not A (`x = 42`), Thread 2 will print **`0`** (which should be impossible sequentially!).
- JMM forbids this reordering if `ready` is declared `volatile`.

### 👶 Beginner Example: `synchronized` Establishes Happens-Before

```java
public class VisibilityExample {
    private int sharedData = 0;
    private final Object lock = new Object();

    public void writer() {
        synchronized (lock) {
            sharedData = 42;  // Write happens inside synchronized block
        } // Monitor unlock → happens-before...
    }

    public void reader() {
        synchronized (lock) {  // ...the next monitor lock on the same object
            System.out.println(sharedData);  // GUARANTEED to see 42
        }
    }
    // Without synchronized: reader might print 0 (stale cached value)
}
```

### 🔗 The 8 Happens-Before Rules

The JMM defines thread interactions using **happens-before** relationships. If action A *happens-before* action B, the JMM guarantees that all memory writes made by A are visible to B, and that the compiler/CPU cannot reorder A after B.

Here are the 8 formal happens-before rules defined by the Java Language Specification (JLS):

| Rule | Description |
|:---|:---|
| **1. Program Order Rule** | Within a single thread, each action happens-before any subsequent action in program order. |
| **2. Volatile Variable Rule** | A write to a `volatile` variable happens-before every subsequent read of that same variable. |
| **3. Monitor Lock Rule** | An unlock operation on a monitor (exiting a `synchronized` block) happens-before every subsequent lock operation on that same monitor. |
| **4. Thread Start Rule** | A call to `Thread.start()` on a thread happens-before any action in the started thread's `run()` method. |
| **5. Thread Join Rule** | All actions in a thread happen-before any other thread successfully returns from a `join()` call on that thread. |
| **6. Transitivity Rule** | If A happens-before B, and B happens-before C, then A happens-before C. |
| **7. Default Value Rule** | The initialization of default values for any object fields happens-before any actions in the constructor. |
| **8. Finalizer Rule** | The completion of an object's constructor happens-before the start of its finalizer. |

### 🛑 Memory Barriers (Fences)

To enforce happens-before relationships, the JVM inserts hardware-specific **memory barriers** (instructions that force the CPU to flush write buffers and invalidate read caches):

- **StoreStore:** Prevents writes before the barrier from being reordered with writes after the barrier.
- **LoadLoad:** Prevents reads before the barrier from being reordered with reads after the barrier.
- **StoreLoad:** A heavy fence. Flushes all writes to memory and blocks subsequent reads until flush completes.
- **LoadStore:** Prevents reads before the barrier from being reordered with writes after the barrier.

##### Volatile under the hood:
* Writing a `volatile` variable inserts: `[StoreStore] -> volatile_write -> [StoreLoad]`
* Reading a `volatile` variable inserts: `volatile_read -> [LoadLoad] -> [LoadStore]`

### ❄️ Final Field Guarantees (The Constructor Freeze)

In addition to happens-before, the JMM provides a special guarantee for `final` fields: **Safe Publication**.

When an object constructor completes, the JVM executes a **freeze action** on all `final` fields. If a reference to the object is published *after* the constructor completes, other threads are guaranteed to see the correctly initialized values of those `final` fields without any synchronization.

```java
public class ImmutableHolder {
    public final int value; // Final: guaranteed to be safely published
    public int nonFinalValue; // Non-final: may be seen as 0 by other threads!

    public ImmutableHolder() {
        this.value = 42;
        this.nonFinalValue = 99;
    }
}
```

> [!CAUTION]
> **Escape during construction:** If the constructor leaks the `this` reference (e.g., registering `this` to a listener inside the constructor), final field guarantees are completely voided, and other threads can see uninitialized state.

---

## 7. ThreadLocal

`ThreadLocal` provides **per-thread isolated variables**.

### 👶 Beginner Concept: Why Do We Need This?

`SimpleDateFormat` is **not thread-safe**. If 10 threads share one instance, dates get corrupted. Solutions:
1. Create a new instance every time → **wasteful** (object creation overhead)
2. `synchronized` → **slow** (serializes all date formatting)
3. `ThreadLocal` → **each thread gets its own instance** (no sharing, no locking)

```java
// Each thread gets its own SimpleDateFormat — no sharing, no locks
private static final ThreadLocal<SimpleDateFormat> dateFormat =
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

public String formatDate(Date date) {
    return dateFormat.get().format(date);  // Thread-safe!
}
```

### Real-World Use Case: Request-Scoped MDC Logging in Spring

```java
// In a Spring web filter — store request context per thread
public class RequestContextFilter implements Filter {
    private static final ThreadLocal<RequestContext> CONTEXT = new ThreadLocal<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) 
            throws IOException, ServletException {
        try {
            CONTEXT.set(new RequestContext(extractTraceId(req), extractUserId(req)));
            MDC.put("traceId", CONTEXT.get().traceId());  // SLF4J MDC uses ThreadLocal
            chain.doFilter(req, resp);
        } finally {
            CONTEXT.remove();  // CRITICAL: prevent memory leak in thread pool
            MDC.clear();
        }
    }

    public static RequestContext current() { return CONTEXT.get(); }
}
```

### `InheritableThreadLocal` — Parent-to-Child Propagation

Standard `ThreadLocal` values are invisible to child threads. `InheritableThreadLocal` copies the parent thread's value to child threads at creation time:

```java
InheritableThreadLocal<String> userId = new InheritableThreadLocal<>();
userId.set("user-123");

new Thread(() -> {
    System.out.println(userId.get()); // Prints "user-123" (inherited from parent)
}).start();
```

> **Limitation:** Works for `new Thread()` but **does NOT work with thread pools** (threads are reused, not newly created). For thread pools, use task-wrapping or the framework's built-in propagation (e.g., Spring's `TaskDecorator`).

### 🧠 Senior: `ScopedValues` (Java 21+ Preview) — The Modern Replacement

`ScopedValues` solves all the problems of `ThreadLocal`: no memory leaks, no mutable state, works natively with virtual threads, and automatically propagates to child scopes.

```java
// Immutable, scoped, no cleanup needed, virtual-thread-friendly
private static final ScopedValue<String> CURRENT_USER = ScopedValue.newInstance();

public void handleRequest(String userId) {
    ScopedValue.runWhere(CURRENT_USER, userId, () -> {
        // All code in this scope (including nested calls) can read CURRENT_USER
        processOrder();  // CURRENT_USER.get() returns userId
    });
    // Outside the scope, CURRENT_USER is no longer bound — no cleanup required
}
```

| Feature | `ThreadLocal` | `InheritableThreadLocal` | `ScopedValue` (Java 21+) |
|:---|:---|:---|:---|
| Mutability | Mutable (`set()`/`get()`) | Mutable | Immutable (bound per scope) |
| Memory leak risk | High (thread pool reuse) | High | None (auto-scoped) |
| Virtual thread support | ⚠️ Costly (cloned per VT) | ⚠️ Costly | ✅ Designed for VT |
| Child thread propagation | ❌ | ✅ (at creation only) | ✅ (structured concurrency) |
| Cleanup required? | Yes (`remove()`) | Yes | No |

:::danger[Interview Focus: Memory Leaks]
**Q: Why does ThreadLocal cause memory leaks and how do `WeakReferences` play a role?** Internally, each `Thread` has a `ThreadLocalMap`. The map uses `ThreadLocal` instances as **WeakReference** keys, but the values are strong references. If a `ThreadLocal` is garbage-collected, its key in the map becomes `null`, but the value remains referenced by the thread. In thread pools, where threads are never destroyed, this value lives forever.
**Fix:** Always call `threadLocal.remove()` in a `finally` block after use.
:::

---

## 8. Thread Pools & Executors

### 👶 Beginner: `ThreadPoolExecutor` Constructor Walkthrough

The `Executors` factory methods are convenient but dangerous. Understanding the raw constructor teaches you what's really happening:

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    4,                                // corePoolSize: always-alive threads
    8,                                // maximumPoolSize: max threads under load
    60, TimeUnit.SECONDS,             // keepAliveTime: idle non-core threads die after 60s
    new ArrayBlockingQueue<>(100),    // workQueue: bounded! (unbounded = OOM risk)
    new ThreadFactory() {             // threadFactory: name your threads!
        private final AtomicInteger counter = new AtomicInteger(1);
        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, "order-processor-" + counter.getAndIncrement());
            t.setDaemon(false);
            return t;
        }
    },
    new ThreadPoolExecutor.CallerRunsPolicy()  // rejectionHandler: backpressure
);
```

#### Task Lifecycle

```text
Task submitted
  → Is corePool full?
     NO  → Create new core thread to execute task
     YES → Is workQueue full?
            NO  → Add task to queue
            YES → Is maximumPoolSize reached?
                   NO  → Create new non-core thread
                   YES → Execute RejectionPolicy
```

> **Production rule of thumb:** Name your threads (`"order-processor-3"` instead of `"pool-1-thread-3"`) so thread dumps are readable during incidents.

### 🧠 Senior Deep Dive: The Mathematics of Thread Pool Starvation

Managing threads manually is an anti-pattern. The Executor framework decouples task submission from execution mechanics. However, blindly setting `corePoolSize` is a catastrophic senior mistake.

A poorly sized thread pool leads to CPU context-switching death or complete Application Starvation.

#### The Context Switch Cost
If your Linux server has 8 CPU cores, it can only physically execute 8 threads simultaneously. If you configure a Thread Pool of 5,000 threads, the Linux kernel has to rapidly switch the 8 physical cores between the 5,000 threads. 
- A context switch takes roughly **1 to 5 microseconds**.
- If it context switches 100,000 times a second, your CPU spends 50% of its power simply *managing* threads rather than executing your business logic!

#### The Sizing Formula (Interview Critical)
**1. CPU-Bound Tasks** (e.g., Video encoding, heavy math, sorting arrays)
* Formula: `N_threads = CPU_Cores + 1` 
* *Why?* Adding more threads than cores physically degrades performance due to Context Switching. The `+1` acts as a backup in case a working thread takes a page fault (memory swap).

**2. I/O-Bound Tasks** (e.g., DB queries, HTTP calls, File reads)
* Formula: `N_threads = CPU_Cores * Target_CPU_Utilization * (1 + Wait_Time / Compute_Time)`
* *Rule of Thumb:* If an API call takes 100ms, and compiling the JSON response takes 1ms... the thread is blocked waiting for the network 99% of the time! You need massively large Thread Pools (e.g., 200–500 threads) to ensure the physical CPU cores aren't just sitting idle while threads sleep waiting for network packets.

### `ScheduledExecutorService` — Periodic & Delayed Tasks

```java
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

// Run once after 5-second delay
scheduler.schedule(() -> sendReport(), 5, TimeUnit.SECONDS);

// Run every 30 seconds (fixed rate — starts every 30s regardless of task duration)
scheduler.scheduleAtFixedRate(() -> collectMetrics(), 0, 30, TimeUnit.SECONDS);

// Run with 30-second delay BETWEEN executions (waits for previous to finish)
scheduler.scheduleWithFixedDelay(() -> cleanupTempFiles(), 0, 30, TimeUnit.SECONDS);
```

> **`scheduleAtFixedRate` vs `scheduleWithFixedDelay`:** If your task takes 10s and interval is 30s — `fixedRate` fires at 0s, 30s, 60s. `fixedDelay` fires at 0s, 40s, 80s (30s gap *after* completion).

### Rejection Policies
1. `AbortPolicy` (Default): Throws `RejectedExecutionException`.
2. `CallerRunsPolicy`: Runs task in the caller's thread (acts as natural backpressure).
3. `DiscardPolicy`: Silently drops task.
4. `DiscardOldestPolicy`: Drops oldest unhandled request and retries.

:::tip[Interview Focus: Factory Methods]
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

:::info[Interview Focus: Work-Stealing]
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

### 🧠 Fork/Join vs Parallel Streams vs ExecutorService

| Feature | `ExecutorService` | `ForkJoinPool` | Parallel Streams |
|:---|:---|:---|:---|
| Task model | Independent tasks | Recursive divide-and-conquer | Data-parallel pipeline |
| Work stealing | ❌ | ✅ | ✅ (uses ForkJoinPool) |
| Best for | Independent I/O tasks | CPU-bound recursive problems | Collection processing |
| Queue | Single shared queue | Per-thread deque | Automatic (Spliterator) |
| Customization | Full control | Moderate | Minimal |
| Common pitfall | Pool starvation | Too-small threshold | Shared `commonPool()` contention |

:::danger[Fork/Join Pitfalls]
1. **Threshold too small:** If THRESHOLD is 1, you create millions of task objects. The object allocation overhead exceeds the parallelism benefit.
2. **Blocking I/O in Fork/Join:** Fork/Join is designed for CPU-bound work. Blocking I/O (HTTP calls, DB queries) will starve the pool.
3. **`fork()` then `fork()`:** Always `fork()` one side and `compute()` the other in-place. Forking both wastes threads.
:::

---

## 10. CompletableFuture

`CompletableFuture` (Java 8+) provides a powerful API for composing asynchronous, non-blocking operations. By default, it uses the `ForkJoinPool.commonPool()`.

### 👶 Real-World Example: Dashboard Data Aggregation

```java
// Fetch user profile and recent orders IN PARALLEL, then combine into a Dashboard
public CompletableFuture<Dashboard> loadDashboard(String userId) {
    ExecutorService ioPool = Executors.newVirtualThreadPerTaskExecutor();

    CompletableFuture<User> userFuture = CompletableFuture
        .supplyAsync(() -> userService.findById(userId), ioPool);

    CompletableFuture<List<Order>> ordersFuture = CompletableFuture
        .supplyAsync(() -> orderService.getRecentOrders(userId), ioPool);

    // thenCombine: runs AFTER both complete, merges results
    return userFuture.thenCombine(ordersFuture, (user, orders) -> {
        return new Dashboard(user, orders, calculateStats(orders));
    });
}

// Usage: non-blocking
loadDashboard("user-42").thenAccept(dashboard -> renderPage(dashboard));
```

#### Visual Pipeline

```text
                    ┌─────────────┐
                ┌──▶│  Fetch User  │──┐
  supplyAsync() │   └─────────────┘  │  thenCombine()   ┌───────────────┐
────────────────┤                    ├─────────────────▶│  Dashboard()  │
                │   ┌──────────────┐ │                   └───────────────┘
                └──▶│ Fetch Orders │──┘
                    └──────────────┘
```

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
| `ConcurrentSkipListMap`| Thread-safe **sorted** Map (like a concurrent `TreeMap`). O(log n) operations.        |
| `BlockingQueue`        | Interface for producer-consumer queues (`ArrayBlockingQueue`, `LinkedBlockingQueue`). |

### `ConcurrentHashMap` Atomic Operations

Beyond `get()`/`put()`, `ConcurrentHashMap` provides **atomic compute** methods that eliminate the need for external synchronization:

```java
ConcurrentHashMap<String, LongAdder> metrics = new ConcurrentHashMap<>();

// computeIfAbsent: atomically create entry if missing, then use it
metrics.computeIfAbsent("request_count", k -> new LongAdder()).increment();

// merge: atomically combine old and new values
ConcurrentHashMap<String, Integer> wordCounts = new ConcurrentHashMap<>();
wordCounts.merge("hello", 1, Integer::sum);  // If "hello" exists, add 1; else set 1

// compute: atomically read-modify-write
map.compute("key", (k, v) -> v == null ? 1 : v + 1);
```

> **Common mistake:** Using `map.get()` + `map.put()` is NOT atomic even with `ConcurrentHashMap`. Always use `compute()`, `merge()`, or `computeIfAbsent()` for atomic read-modify-write.

### `CopyOnWriteArrayList` — When to Use (and When NOT To)

```java
// ✅ Perfect for: event listener lists (written rarely, iterated frequently)
CopyOnWriteArrayList<EventListener> listeners = new CopyOnWriteArrayList<>();
listeners.add(new LoggingListener());     // Creates a new internal array (expensive)
for (EventListener l : listeners) {        // Iterates over a snapshot (lock-free, safe)
    l.onEvent(event);
}

// ❌ NEVER use for: frequently modified lists
// Each add/remove copies the ENTIRE array — O(n) per write operation
```

### `BlockingQueue` Implementation Comparison

| Implementation | Bound | Internal Structure | Fairness | Best For |
|:---|:---|:---|:---|:---|
| `ArrayBlockingQueue` | Bounded (fixed) | Single array | Configurable | General producer-consumer |
| `LinkedBlockingQueue` | Optionally bounded | Linked nodes | No | Higher throughput (separate head/tail locks) |
| `PriorityBlockingQueue` | Unbounded | Heap | No | Priority-ordered processing |
| `SynchronousQueue` | Zero capacity | No storage | Configurable | Direct hand-off (each `put()` blocks until `take()`) |
| `DelayQueue` | Unbounded | Heap | No | Scheduled/delayed task execution |
| `LinkedTransferQueue` | Unbounded | Linked nodes | No | Low-latency transfer (producer blocks until consumer takes) |

:::info[Interview Focus: ConcurrentHashMap 1.7 vs 1.8]
**Q: How did `ConcurrentHashMap` change from JDK 1.7 to 1.8?** * **JDK 1.7:** Used **Segment-based locking** (an array of Segments). Granularity was locked at the Segment level (default 16).
* **JDK 1.8:** Removed Segments. Uses a Node array + Linked List + Red-Black tree. Thread safety is achieved using **CAS + `synchronized`**. It locks only the *head node* of the specific bucket being modified, massively reducing lock contention.
:::

---

## 12. Virtual Threads (Java 21+)

Virtual threads (Project Loom) completely change the physical threading model of Java, solving the "thread-per-request" bottleneck without the callback-hell of Reactive Programming.

:::tip[🧠 Senior Deep Dive]
> Because Virtual Threads represent a fundamental paradigm shift in the JVM, altering everything from OS Carrier Threads to `ThreadLocal` allocations and `synchronized` pinning constraints, we have dedicated an entire architectural guide to it.
> 
> 👉 **[Read the Virtual Threads (Project Loom) Deep Dive here](./java-virtual-threads)**
:::

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

### CompletableFuture vs StructuredTaskScope

| Feature | `CompletableFuture` | `StructuredTaskScope` |
|:---|:---|:---|
| Thread lifecycle | Unstructured — tasks can outlive caller | Structured — tasks cannot outlive scope |
| Cancellation | Manual (easy to forget) | Automatic on scope close |
| Error propagation | Must chain `.exceptionally()` | `throwIfFailed()` propagates naturally |
| Thread dump readability | Flat — no parent-child relationship visible | Hierarchical — clear parent-child tree |
| Orphaned threads | ⚠️ Common pitfall | Impossible by design |
| Java version | 8+ | 21+ (preview) |
| **Best for** | Legacy code, complex async pipelines | New code with concurrent subtasks |

> **Key insight:** Unlike `CompletableFuture.allOf()`, structured concurrency ensures all forked threads terminate before the scope exits — either normally or cancelled. No orphaned background work.

### 🧠 Custom `StructuredTaskScope` — Aggregating Partial Results

You can extend `StructuredTaskScope` to implement custom completion policies, such as collecting all successful results even if some tasks fail:

```java
// Collect all successful results, ignore failures (e.g., best-effort fan-out)
public class CollectingScope<T> extends StructuredTaskScope<T> {
    private final ConcurrentLinkedQueue<T> results = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<Throwable> errors = new ConcurrentLinkedQueue<>();

    @Override
    protected void handleComplete(Subtask<? extends T> subtask) {
        if (subtask.state() == Subtask.State.SUCCESS) {
            results.add(subtask.get());
        } else if (subtask.state() == Subtask.State.FAILED) {
            errors.add(subtask.exception());
        }
    }

    public List<T> successfulResults() { return List.copyOf(results); }
    public List<Throwable> failures()   { return List.copyOf(errors); }
}

// Usage: query 5 replicas, use whatever responds successfully
try (var scope = new CollectingScope<SearchResult>()) {
    for (String replica : replicas) {
        scope.fork(() -> queryReplica(replica));
    }
    scope.join();
    List<SearchResult> results = scope.successfulResults(); // partial success OK
}
```

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

### Retry Pattern with Exponential Backoff

```java
public static <T> CompletableFuture<T> retryWithBackoff(
        Supplier<CompletableFuture<T>> action,
        int maxRetries,
        ScheduledExecutorService scheduler) {
    
    return action.get().thenApply(CompletableFuture::completedFuture)
        .exceptionally(ex -> {
            if (maxRetries <= 0) return CompletableFuture.failedFuture(ex);
            
            long delay = (long) Math.pow(2, 3 - maxRetries) * 1000; // 1s, 2s, 4s...
            CompletableFuture<T> delayed = new CompletableFuture<>();
            scheduler.schedule(
                () -> retryWithBackoff(action, maxRetries - 1, scheduler)
                    .whenComplete((val, err) -> {
                        if (err != null) delayed.completeExceptionally(err);
                        else delayed.complete(val);
                    }),
                delay, TimeUnit.MILLISECONDS
            );
            return delayed;
        })
        .thenCompose(Function.identity());
}

// Usage:
retryWithBackoff(() -> CompletableFuture.supplyAsync(() -> callFlakyApi()), 3, scheduler);
```

### Fan-Out / Fan-In — Parallel Service Calls

```java
// Query multiple search engines in parallel, aggregate results
public CompletableFuture<List<SearchResult>> fanOutSearch(String query) {
    List<SearchEngine> engines = List.of(googleEngine, bingEngine, duckEngine);
    
    // Fan-out: launch all searches in parallel
    List<CompletableFuture<List<SearchResult>>> futures = engines.stream()
        .map(engine -> CompletableFuture
            .supplyAsync(() -> engine.search(query), ioExecutor)
            .orTimeout(3, TimeUnit.SECONDS)
            .exceptionally(ex -> List.of()))  // Partial failure OK
        .toList();

    // Fan-in: wait for all, flatten results
    return CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new))
        .thenApply(v -> futures.stream()
            .flatMap(f -> f.join().stream())
            .distinct()
            .collect(Collectors.toList()));
}
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

### Poison Pill Shutdown Pattern

Gracefully stopping consumers without `Thread.interrupt()`:

```java
public class ProducerConsumerWithShutdown {
    private static final String POISON_PILL = "__SHUTDOWN__";
    private final BlockingQueue<String> queue = new ArrayBlockingQueue<>(100);

    // Producer: signals completion by sending a poison pill
    public void produce(List<String> items) {
        for (String item : items) {
            queue.put(item);
        }
        queue.put(POISON_PILL);  // Signal: "no more data"
    }

    // Consumer: processes until it receives the poison pill
    public void consume() {
        while (true) {
            String item = queue.take();
            if (POISON_PILL.equals(item)) {
                log.info("Received shutdown signal. Exiting.");
                break;  // Clean exit — no interrupt handling needed
            }
            process(item);
        }
    }
}
// For multiple consumers: send one POISON_PILL per consumer thread
```

### `BlockingQueue` Implementation Quick Guide

| Queue | When to Use |
|:---|:---|
| `ArrayBlockingQueue` | Default choice. Fixed capacity. Fair ordering optional. |
| `LinkedBlockingQueue` | Higher throughput than Array (separate head/tail locks). Optional bound. |
| `SynchronousQueue` | Direct hand-off. No buffering. Producer blocks until consumer takes. |
| `PriorityBlockingQueue` | Process highest-priority items first. Unbounded. |
| `DelayQueue` | Items only become available after a delay expires. |

### 🧠 Senior: LMAX Disruptor — Ultra-Low-Latency Alternative

For systems where `BlockingQueue` latency (microseconds from lock contention) is unacceptable (e.g., financial trading, game servers), the **LMAX Disruptor** achieves **nanosecond-level** inter-thread messaging:

- **Ring buffer** instead of linked list/array (cache-line friendly, pre-allocated)
- **No locks** — uses CAS + memory barriers only
- **Mechanical sympathy** — designed around CPU cache architecture
- Throughput: **100M+ messages/second** on commodity hardware

> When `BlockingQueue` gives you microsecond latency but you need nanoseconds, the Disruptor is the industry standard. Used by LMAX Exchange, Apache Log4j 2 (async loggers), and Hazelcast.

---

## Compare Next
- [JVM Internals: Memory, GC & Class Loading](./java-jvm.md)
- [Java I/O: Streams, NIO & I/O Models](./java-io.md)

---

## Interview Questions

### Q: How do you pick concurrency primitives in production services?
**A:** Follow the **hierarchy of simplicity**: (1) Start with **immutability** — if data doesn't change, no synchronization is needed. (2) Use **thread confinement** (e.g., `ThreadLocal`, actor model) to avoid sharing entirely. (3) Use **high-level utilities** (`ConcurrentHashMap`, `BlockingQueue`, `CompletableFuture`) before reaching for low-level locks. (4) Only use `synchronized` or `ReentrantLock` when you need fine-grained control over shared mutable state. The simpler the primitive, the fewer bugs.

### Q: What is the most common thread-pool failure pattern?
**A:** **Pool starvation** from blocking I/O on executors sized for CPU-bound tasks. Example: a `ForkJoinPool.commonPool()` with 8 threads serves an endpoint that makes HTTP calls taking 500ms each. After 8 concurrent requests, all threads are blocked waiting for network responses, and subsequent requests queue indefinitely. Fix: use separate I/O-bound pools sized with the formula `N = cores × (1 + wait/compute)`, or use virtual threads (Java 21+).

### Q: How do you design backpressure in asynchronous pipelines?
**A:** (1) **Bound your queues** — use `ArrayBlockingQueue(capacity)` instead of unbounded queues. (2) **Choose rejection policies intentionally** — `CallerRunsPolicy` naturally slows down producers when consumers are overwhelmed. (3) **Propagate load-shedding upstream** — return HTTP 429 or use circuit breakers to signal overload to callers. (4) **Monitor queue depth** as a key metric — growing queues indicate a consumer that can't keep up.

### Q: Why is lock ordering still relevant with modern utilities?
**A:** Even with `ReentrantLock` and `ConcurrentHashMap`, mixed synchronization paths can deadlock. Example: Service A acquires Lock-X then Lock-Y; Service B acquires Lock-Y then Lock-X. Modern tools don't prevent logical ordering violations. The fix is a **global lock ordering convention** (e.g., always acquire in alphabetical order by resource name) and using `tryLock(timeout)` to detect and recover from ordering mistakes.

### Q: When are virtual threads not a silver bullet?
**A:** (1) **CPU-bound work** — virtual threads don't add cores; you still need `N = cores + 1` threads. (2) **`synchronized` pinning** — a virtual thread inside a `synchronized` block pins its carrier thread, negating the benefit. Use `ReentrantLock` instead. (3) **External bottlenecks** — if your DB connection pool has 20 connections, 1 million virtual threads still queue at the pool. Virtual threads solve the *thread* bottleneck, not the *resource* bottleneck.

### Q: How do you evaluate CompletableFuture chains in code review?
**A:** Check these 5 things: (1) **Executor selection** — is `supplyAsync()` using a custom I/O executor, not the common pool? (2) **Error propagation** — does every chain have `.exceptionally()` or `.handle()`? Unhandled errors are silently swallowed. (3) **Timeout behavior** — is `orTimeout()` or `completeOnTimeout()` set for external calls? (4) **Cancellation** — does cancelling one future properly cancel dependent futures? (5) **Thread safety of shared state** — lambdas in the chain may execute on different threads.

### Q: What does senior-level concurrency testing include?
**A:** (1) **Deterministic stress tests** — use `CyclicBarrier` to force all threads to start simultaneously, maximizing race condition probability. (2) **Race-condition probes** — tools like `jcstress` (OpenJDK's concurrency stress testing harness) systematically explore thread interleavings. (3) **Latency assertions under contention** — verify P99 latency doesn't degrade beyond SLA when thread count increases. (4) **Deadlock detection** — programmatic `ThreadMXBean.findDeadlockedThreads()` in health checks.

### Q: Why is `SimpleDateFormat` not thread-safe, and what are the fixes?
**A:** `SimpleDateFormat` uses internal mutable state (a `Calendar` field) during formatting/parsing. When multiple threads share one instance, they corrupt each other's intermediate state, producing garbled dates or `NumberFormatException`. **Fixes:** (1) `ThreadLocal<SimpleDateFormat>` — one instance per thread. (2) `DateTimeFormatter` (Java 8+) — immutable and thread-safe by design. (3) Create a new instance per call (wasteful but correct). In modern Java, always use `DateTimeFormatter`.

### Q: How do you detect deadlocks in a production JVM?
**A:** (1) **`jstack <pid>`** — prints all thread stack traces; the JVM automatically detects and reports monitor deadlock cycles at the bottom of the output. (2) **`ThreadMXBean.findDeadlockedThreads()`** — programmatic API; wire this into a health-check endpoint or periodic monitoring. (3) **Thread dump analysis tools** — fastThread.io, IBM TDMA parse thread dumps and visualize lock chains. (4) **Prevention** — use `tryLock(timeout)` with `ReentrantLock` to avoid infinite blocking; log and alert on timeout.

### Q: When should you use `StampedLock` optimistic reads?
**A:** When your workload is **overwhelmingly read-heavy** (>95% reads) and reads are short operations. The optimistic read path avoids acquiring any lock — it grabs a stamp, reads data, then validates. If a writer intervened, it falls back to a standard read lock. **Do not use** if: (1) reads are long-running (validation failure wastes work), (2) writes are frequent (constant fallbacks negate the benefit), or (3) you need reentrancy (`StampedLock` is not reentrant — calling it recursively deadlocks).

### Q: How would you design a rate limiter using `Semaphore`?
**A:** Use a `Semaphore` with N permits representing the maximum concurrent requests. Each request `acquire()`s a permit before execution and `release()`s it in a `finally` block after. For time-based rate limiting (e.g., 100 requests/second), combine with a `ScheduledExecutorService` that periodically replenishes permits. Use `tryAcquire(timeout)` to fail fast instead of queuing indefinitely. For distributed rate limiting, use Redis + Lua scripts instead of in-process `Semaphore`.

### Q: What is the difference between `CompletableFuture` and Structured Concurrency?
**A:** `CompletableFuture` provides **unstructured** concurrency — tasks are fire-and-forget, with no guarantee that child tasks terminate when the parent does. This leads to orphaned threads, resource leaks, and unreadable thread dumps. `StructuredTaskScope` (Java 21+) enforces **structured** concurrency — child tasks cannot outlive their parent scope, cancellation is automatic, and thread dumps show a clear parent-child hierarchy. Use `CompletableFuture` for complex async pipelines in pre-Java-21 code; use `StructuredTaskScope` for new concurrent subtask patterns.
