---
id: java-locks
title: "Java Locks & Synchronization"
slug: java-locks
description: Deep dive into Java locks and synchronization primitives, including synchronized, volatile, ReentrantLock, ReadWriteLock, StampedLock, and AQS.
tags: [java, concurrency, locks, synchronization]
---

# Java Locks & Synchronization

To coordinate thread execution and protect shared mutable state, Java provides synchronization primitives and highly flexible locking structures.

---

## Synchronization Primitives

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

## Locks & AQS

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
