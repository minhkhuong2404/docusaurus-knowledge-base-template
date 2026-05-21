---
id: correctness
title: "Concurrency: Correctness"
sidebar_label: Correctness
---

# Concurrency: Correctness

> Correctness is the foundation of concurrent programming. Before thinking about performance, ensure your code produces the **right answer** in all thread-interleaving scenarios.

---

## Why Concurrency Is Critical in LLD Interviews

Any LLD problem involving shared state — parking lot spots, movie seats, inventory counts — must handle concurrent access. An interviewer asking *"what happens when two users book the same seat simultaneously?"* is testing whether you think concurrently.

:::tip[Interview Tip 🎯]
**Proactively bring up concurrency.** Don't wait to be asked. After designing your classes say: *"Now let me think about concurrency — this `availableSeats` counter will be accessed by multiple threads simultaneously, so I need to make it thread-safe."*
:::

---

## Core Concepts

### Atomicity

An operation is **atomic** if it completes in a single, indivisible step — no other thread can observe a partial result.

```java
// ❌ Not atomic: read-modify-write is THREE operations
public class Counter {
    private int count = 0;

    public void increment() {
        count++;  // READ count, ADD 1, WRITE back — another thread can interrupt between these!
    }
}

// Thread A reads count = 5
// Thread B reads count = 5
// Thread A writes count = 6
// Thread B writes count = 6  ← Lost update! Should be 7.

// ✅ Atomic using synchronized
public class Counter {
    private int count = 0;

    public synchronized void increment() { count++; }
    public synchronized int get() { return count; }
}

// ✅ Better: use AtomicInteger (lock-free, faster)
public class Counter {
    private final AtomicInteger count = new AtomicInteger(0);

    public void increment() { count.incrementAndGet(); }  // CAS loop — atomic
    public int get() { return count.get(); }
}
```

### Visibility

A change made by one thread may not be **visible** to another thread due to CPU caches and instruction reordering.

```java
// ❌ Visibility problem: thread B may never see flag = true
public class StopFlag {
    private boolean running = true;  // Not volatile!

    public void stop() {
        running = false;  // Thread A writes to CPU cache
    }

    public void doWork() {
        while (running) {  // Thread B reads stale cached value — infinite loop!
            // ... work
        }
    }
}

// ✅ volatile ensures writes are immediately visible to all threads
public class StopFlag {
    private volatile boolean running = true;

    public void stop() { running = false; }
    public void doWork() {
        while (running) { /* ... */ }
    }
}
```

### The happens-before Relationship

Java's memory model defines **happens-before**: if action A happens-before action B, then A's effects are guaranteed to be visible to B.

Key happens-before rules:
- `synchronized` block exit → `synchronized` block entry (on same lock)
- `volatile` write → subsequent `volatile` read (on same variable)
- `Thread.start()` → any action in the started thread
- Thread completion → `Thread.join()` return

---

## Data Races

A **data race** occurs when two threads access the same variable concurrently, at least one access is a write, and they're not synchronized.

```java
// ❌ Classic data race: bank transfer
public class BankAccount {
    private double balance;

    public void transfer(BankAccount target, double amount) {
        if (balance >= amount) {          // Thread A checks
            // Thread B also checks here — both see sufficient balance!
            balance -= amount;            // Thread A deducts
            target.balance += amount;     // Thread A adds
            // Thread B also deducts and adds — money created from nothing!
        }
    }
}
```

```java
// ✅ Fix: synchronize on both accounts (careful of deadlock — see Coordination)
public void transfer(BankAccount other, double amount) {
    // Always lock in consistent order to avoid deadlock
    BankAccount first  = this.id < other.id ? this : other;
    BankAccount second = this.id < other.id ? other : this;

    synchronized (first) {
        synchronized (second) {
            if (this.balance >= amount) {
                this.balance -= amount;
                other.balance += amount;
            } else {
                throw new InsufficientFundsException();
            }
        }
    }
}
```

---

## Thread-Safe Collections

| Need | Use |
|------|-----|
| Thread-safe list with many reads | `CopyOnWriteArrayList` |
| Thread-safe map | `ConcurrentHashMap` |
| Thread-safe queue (producer-consumer) | `LinkedBlockingQueue` |
| Thread-safe set | `ConcurrentHashMap.newKeySet()` |
| Thread-safe deque | `ConcurrentLinkedDeque` |
| Priority queue | `PriorityBlockingQueue` |

```java
// ConcurrentHashMap atomic operations
ConcurrentHashMap<String, Integer> inventory = new ConcurrentHashMap<>();

// ✅ Atomic: check-then-act in one step
inventory.compute("ITEM-001", (key, current) -> {
    if (current == null || current == 0) throw new OutOfStockException();
    return current - 1;
});

// ✅ Atomic: put if absent (useful for caching)
inventory.computeIfAbsent("ITEM-002", key -> loadFromDatabase(key));

// ✅ Atomic conditional update
inventory.merge("ITEM-003", 10, Integer::sum); // add 10 to existing value
```

---

## The Synchronized Pitfalls

### Pitfall 1: Synchronizing on the Wrong Object

```java
// ❌ Each instance synchronizes on "this" — no mutual exclusion between instances
public class BadCache {
    private static final Map<String, Object> CACHE = new HashMap<>();

    public synchronized Object get(String key) {  // "this" lock — different per instance!
        return CACHE.get(key);
    }
}

// ✅ Synchronize on the shared resource
public class GoodCache {
    private static final Map<String, Object> CACHE = new HashMap<>();
    private static final Object LOCK = new Object();  // shared lock

    public Object get(String key) {
        synchronized (LOCK) {
            return CACHE.get(key);
        }
    }
}
```

### Pitfall 2: Holding Locks Too Long

```java
// ❌ Holds lock during slow I/O — blocks all other threads
public synchronized void saveAndNotify(Order order) {
    database.save(order);        // Slow I/O — holding lock!
    emailService.send(order);    // Slow network — holding lock!
    cache.put(order.getId(), order);
}

// ✅ Minimize critical section
public void saveAndNotify(Order order) {
    database.save(order);     // Do slow work outside lock
    emailService.send(order); // Do slow work outside lock

    synchronized (this) {
        cache.put(order.getId(), order);  // Only synchronize the shared state update
    }
}
```

### Pitfall 3: Compound Actions Without Atomicity

```java
// ❌ Check-then-act: not atomic even though each operation is synchronized
public synchronized boolean isEmpty() { return count == 0; }
public synchronized void remove() { count--; }

// In caller:
if (!queue.isEmpty()) {  // Thread A: isEmpty() returns false
    queue.remove();      // Thread B removes between these two lines!
    // Thread A: remove() on empty queue — bug!
}

// ✅ Make the compound action atomic
public synchronized void removeIfPresent() {
    if (count > 0) count--;  // check-and-act in one synchronized block
}
```

---

## Java Memory Model in Practice

```java
// Safe publication of objects across threads
public class SafePublication {

    // ✅ volatile guarantees both visibility and ordering
    private volatile Config config;

    public void updateConfig(Config newConfig) {
        config = newConfig;  // Write is visible to all subsequent reads
    }

    // ✅ final fields are safely published after constructor completes
    public static class ImmutablePoint {
        private final int x;
        private final int y;

        public ImmutablePoint(int x, int y) {
            this.x = x;
            this.y = y;
            // After constructor, x and y are safely visible to all threads
        }
    }

    // ✅ Immutable objects are always thread-safe
    public record Money(long cents, String currency) {}  // Java record — immutable by default
}
```

### 🧠 Senior Deep Dive: Hardware Reality & Advanced Patterns

While new learners focus on software locks (`synchronized`), senior engineers must understand hardware implications.

#### 1. False Sharing (The Cache Line Problem)
Modern CPUs fetch memory from RAM in 64-byte chunks called **Cache Lines**. If two threads update two completely independent `volatile` variables that happen to sit next to each other in memory (in the same cache line), the CPU's cache coherence protocol (MESI) will constantly invalidate the entire cache line across cores. This causes a massive invisible performance penalty.
* **The Fix**: Use the `@Contended` annotation in Java to pad the variables with empty bytes, forcing them into separate CPU cache lines.

#### 2. The Double-Checked Locking (DCL) Trap
A classic singleton pattern mistake that tests your knowledge of instruction reordering.

```java
// ❌ BROKEN Double-Checked Locking (if instance is not volatile)
public class Singleton {
    private static Singleton instance; // Missing volatile!

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton(); // The danger lies here!
                }
            }
        }
        return instance;
    }
}
```
**Why it fails**: `instance = new Singleton()` is not atomic. It involves 3 steps: (1) allocate memory, (2) call the constructor, and (3) assign the reference. The JVM/CPU might reorder step 3 *before* step 2. A second thread could check `instance == null`, see it's false, and return a partially constructed object!
* **The Fix**: You **MUST** declare `private static volatile Singleton instance;`. The `volatile` keyword inserts a memory barrier that prevents this specific instruction reordering.

---

## Interview Concurrency Checklist

When you present a design, ask yourself:

| Question | If yes → |
|----------|----------|
| Is there shared mutable state? | Synchronize access or use concurrent collections |
| Is there a read-modify-write? | Make it atomic (AtomicInteger or synchronized block) |
| Is there a check-then-act? | Make the compound action atomic |
| Is there a field written by one thread, read by another? | Mark `volatile` or use synchronization |
| Are collections shared across threads? | Use concurrent collection variants |
| Does a class *look* thread-safe but have compound operations? | Document the need for external synchronization |

**Next →** [Concurrency — Coordination](./coordination)
