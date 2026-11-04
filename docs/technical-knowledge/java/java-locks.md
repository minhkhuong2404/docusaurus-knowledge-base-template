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
import JavaReadWriteLockConvoyDiagram from '@site/src/components/JavaReadWriteLockConvoyDiagram';

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

---

## ReentrantLock vs synchronized

| Feature | `synchronized` | `ReentrantLock` |
|---|---|---|
| **Acquisition** | Implicit (block entry) | Explicit (`lock.lock()`) |
| **Release** | Implicit (block exit) | Explicit (`lock.unlock()` in `finally`) |
| **Timed Try-Lock** | ❌ Impossible | ✅ `tryLock(time, unit)` |
| **Interruptible** | ❌ Impossible | ✅ `lockInterruptibly()` |
| **Fairness Policy** | ❌ Non-fair only | ✅ Fair or Non-fair (`new ReentrantLock(true)`) |
| **Multiple Conditions** | ❌ 1 condition per monitor | ✅ Multiple `Condition` objects via `newCondition()` |

---

## AQS (AbstractQueuedSynchronizer)

AQS is the **internal backbone** for `ReentrantLock`, `Semaphore`, `CountDownLatch`, `CyclicBarrier`, and `Phaser`.

<AQSArchitectureDiagram />

### How AQS Works
AQS maintains a single volatile integer `state` and a FIFO variant of a **CLH Queue**:
- **`ReentrantLock`**: `state` represents hold count ($0 = \text{unlocked}$, $>0 = \text{reentrant lock depth}$).
- **`Semaphore`**: `state` represents available permit count.
- **`CountDownLatch`**: `state` represents remaining latch count.

---

## Choosing the Right Lock — Decision Tree

<LockDecisionTreeDiagram />

---

## Reentrancy, Lock Ownership & The `ReadWriteLock` Convoy Effect

Understanding the API surface of `ReentrantLock`, `ReentrantReadWriteLock`, and `StampedLock` is only half the battle. In production systems, locks fail due to subtle interactions between **ownership tracking**, **anti-writer-starvation heuristics**, and **blocking I/O inside critical sections**.

<JavaReadWriteLockConvoyDiagram initialTab="convoy" />

### 1. Reentrancy & Hold Count Mechanics

A lock is **reentrant** if a thread that already holds the lock can acquire it again without deadlocking itself. Both `synchronized` and `ReentrantLock` maintain an internal **hold count** (`state` in AQS) alongside an **owner reference** (`exclusiveOwnerThread`):
- First acquisition by Thread $T_1$: `owner = T1`, `holdCount = 1`.
- Nested acquisition (`outer()` calls `inner()` on the same lock): `owner == currentThread`, so `holdCount` increments to `2`.
- Each `unlock()` decrements `holdCount`. The lock is only released to other waiting threads when `holdCount == 0`.

:::warning[Non-Reentrant Primitives: Self-Deadlock Hazard]
Not all locks are reentrant! Calling acquire twice on the same thread with **`StampedLock`**, **`Semaphore(1)`**, or Go's **`sync.Mutex`** causes the thread to block waiting for itself forever:
```java
var stamped = new StampedLock();
long stamp = stamped.writeLock();
// ❌ Calling stamped.writeLock() again on the same thread hangs forever!
long second = stamped.tryWriteLock(); // Returns 0 (failed)
stamped.unlockWrite(stamp);
```
:::

### 2. Lock Ownership: What Knowing the Owner Enables (and Costs)

`synchronized`, `ReentrantLock`, and the write lock of `ReentrantReadWriteLock` record the exact owning `Thread`. This 8-byte reference unlocks four critical JVM capabilities:
1. **Reentrancy**: Distinguishing whether a lock request is a recursive reentry by the current owner or contention from another thread.
2. **Thread Dump Blame (`jstack -l`)**: When 200 threads block on a `ReentrantLock`, `jstack` prints the exact owner (`Locked ownable synchronizers: <0x...>`) under the holding thread's stack trace. Conversely, **`ReadWriteLock.readLock()`** (shared by multiple threads) and **`StampedLock`** (unowned) print `- None` in thread dumps, making it vastly harder to spot which thread is holding a read lock during an outage!
3. **Automatic Deadlock Cycle Detection**: Because each exclusive lock knows its owner, the JVM can traverse the directed wait-for graph (`Thread A -> Lock 1 -> Thread B -> Lock 2 -> Thread A`) and automatically print `Found one Java-level deadlock` in `jstack`. Replacing `ReentrantLock` with `Semaphore(1)` blinds the JVM's deadlock detector.
4. **`Condition.await()` State Restoration**: When a thread calls `condition.await()`, the lock atomically saves and releases its entire `holdCount` (even if `holdCount > 1`) and restores the exact depth upon waking up.

**The Cost of Ownership**: A lock with ownership **must be unlocked by the exact same thread that acquired it**. Acquiring a `ReentrantLock` on an HTTP worker thread and calling `unlock()` inside an async `CompletableFuture` callback throws `IllegalMonitorStateException` and permanently leaks the lock. When you must hold a concurrency permit across thread boundaries, use `Semaphore`.

### 3. The `lock()` Idiom & Fairness Trade-Off

Always invoke `lock()` or `lockInterruptibly()` **immediately before** `try`, never inside `try`:

```java
// ❌ WRONG: If lockInterruptibly() throws InterruptedException before acquiring the lock,
// finally still executes unlock(), throwing IllegalMonitorStateException and masking the root cause!
try {
    lock.lockInterruptibly();
    doWork();
} finally {
    lock.unlock();
}

// ✅ CORRECT: Only enter try block AFTER lock is held
lock.lockInterruptibly();
try {
    doWork();
} finally {
    lock.unlock();
}
```

- **Non-fair mode (default)**: Allows **barging**—if a running thread calls `lock()` at the exact instant the lock is released, it cuts in front of parked queue threads, avoiding an OS context switch (~1–10 µs) while a queued thread wakes up.
- **Fair mode (`new ReentrantLock(true)`)**: Enforces strict FIFO ordering but reduces total throughput significantly (`"often much slower"` per JDK Javadoc). Enable fair mode only when metrics prove tail-latency starvation.

---

### 4. Writer Starvation vs. The Production `ReadWriteLock` Convoy Outage

Textbook descriptions often claim that `ReadWriteLock` suffers from endless **writer starvation** if readers arrive continuously. While true for default `pthread_rwlock` on Linux, **Java's `ReentrantReadWriteLock` and Go's `sync.RWMutex` actively prevent writer starvation**:
- In Java's non-fair `ReentrantReadWriteLock`, `writerShouldBlock()` is false, while `readerShouldBlock()` checks `apparentFirstQueuedIsExclusive() / apparentlyFirstQueuedIsExclusive()`.
- **Rule**: Whenever a **Writer $W$** is waiting at the head of the AQS queue, **all new incoming Readers are blocked and queued behind $W$** (with a special exception allowing threads that *already hold* a read lock to re-acquire it via `ThreadLocalHoldCounter` so they don't self-deadlock—whereas Go's `sync.RWMutex` forbids recursive `RLock()` entirely!).

#### Anatomy of a Real Production Outage: The 20-Second ReadLock Convoy
Suppose a service caches 5,000 tenant feature flags (`5 MB` map) read 10,000 times/sec by 200 Tomcat threads using `rwl.readLock()`, reloaded once a minute via `rwl.writeLock()`. A background sync thread $R_1$ acquires `readLock()` and streams the map directly over a TCP socket to a DR region:
1. **`t = 0 ms`**: Network congestion drops DR bandwidth to `250 KB/s`. The OS TCP send buffer fills up, and $R_1$ blocks inside `SocketDispatcher.write0()` (Java sockets have **no write timeout**!). $R_1$ holds `readLock()` for **20 seconds**.
2. **`t = 100 ms`**: The minute-reload job $W$ calls `writeLock().lock()`. Because $R_1$ holds the read lock, $W$ parks at the **head of the AQS queue**.
3. **`t = 150 ms` (The Convoy Trap)**: Regular HTTP requests ($R_2 \dots R_{200}$) call `readLock().lock()`. Even though read locks are shared, `apparentFirstQueuedIsExclusive() / apparentlyFirstQueuedIsExclusive()` sees Writer $W$ at the head of the queue and **blocks every new reader behind $W$**!
4. **`t = 170 ms`**: At 10,000 req/s, **all 200 Tomcat threads park within 20 milliseconds**. The entire service freezes for 20 seconds—including endpoints that don't even touch `ConfigCache`!

#### Production Fixes for Read-Heavy Caches:
1. **Never perform I/O inside any lock** (especially a read lock!). Copy references in microseconds and perform socket/disk I/O outside `finally`.
2. **Copy-on-Write with `volatile` Immutable Snapshot** (Best for read-heavy, infrequent-write caches like `ConfigCache`):
   ```java
   public final class ConfigCache {
       private volatile Map<String, String> snapshot = Map.of(); // Immutable snapshot

       public String get(String key) { return snapshot.get(key); } // Lock-free! Never blocks
       public Map<String, String> all() { return snapshot; }       // Zero-copy return

       public synchronized void reload(Map<String, String> fresh) {
           snapshot = Map.copyOf(fresh); // Atomic reference swap
       }
   }
   ```
3. **`StampedLock` Optimistic Read**: Use `tryOptimisticRead()` + local primitive copy + `validate(stamp)` so readers never dirty shared cache lines or block writers.

---

### 5. Deadlock Prevention: Global Lock Ordering & Single-Lock Callback Deadlocks

```java
public static boolean transfer(Account from, Account to, long amount) throws InterruptedException {
    // ✅ Enforce deterministic global lock ordering by unique ID
    Account first = from.id < to.id ? from : to;
    Account second = first == from ? to : from;

    if (!first.lock.tryLock(200, TimeUnit.MILLISECONDS)) return false;
    try {
        if (!second.lock.tryLock(200, TimeUnit.MILLISECONDS)) return false;
        try {
            if (from.balance < amount) return false;
            from.balance -= amount;
            to.balance += amount;
            return true;
        } finally {
            second.lock.unlock();
        }
    } finally {
        first.lock.unlock();
    }
}
```

:::danger[The Single-Lock Listener Deadlock]
A deadlock can occur even with **only one lock**: if `OrderBook.update()` holds `lock` and invokes `listener.onChange()`, and the listener submits a task to an executor thread that calls `orderBook.snapshot()` (which needs `lock`) while `onChange()` synchronously `.get()`s that future, both threads wait on each other forever—and **`jstack` cannot detect this cycle** because one edge is a `Future.get()` wait rather than an ownable lock! **Rule**: Never invoke external callbacks or listeners while holding a lock.
:::

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Java Locking Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)
- **State Hardware & AQS Invariants First**: Explain that every lock balances **CPU cache-line contention** (CAS on AQS `volatile int state`) against **OS scheduler context switches** (`LockSupport.park()` costing ~1.5–10 µs + L1/L2 cache cold misses).
- **Challenge `ReadWriteLock` Reflexes**: Point out that `ReentrantReadWriteLock` is often **slower** than `synchronized` for short critical sections (e.g., a single `HashMap.get()`) because every `readLock()` still executes a shared atomic CAS on the AQS `state` word and updates per-thread `ThreadLocalHoldCounter`, causing L1 cache-line bouncing across cores.
- **Proactive Failure-Boundary Identification**: Highlight **convoy cascades** (slow reader + queued writer blocking all readers), **lock upgrade self-deadlocks** (holding readLock and requesting writeLock), and **JDK 21–23 Virtual Thread pinning** inside `synchronized` blocks containing I/O (fixed in JEP 491 / JDK 24).
- **Day-2 Observability**: Monitor `ReentrantReadWriteLock.getQueueLength()` vs `getReadLockCount()`—a spiking queue length with `readLockCount == 1` is the smoking gun of a reader convoy.

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "Since 99% of our requests only read from an in-memory `HashMap`, replacing `synchronized` with `ReentrantReadWriteLock` will make it much faster, right?"
* **Junior/Mid Answer:** *"Yes, because `synchronized` blocks all threads one by one, whereas `ReadWriteLock` allows all 99% of reader threads to read the `HashMap` in parallel without contention."*
* **Principal Rebuttal:**
  > *"For a fast O(1) lookup like `HashMap.get()` (~20–50 ns), `ReentrantReadWriteLock` frequently **degrades** throughput compared to `synchronized`. Even though read locks are logically shared, physically every `readLock().lock()` and `unlock()` must execute a `compareAndSet` on the shared `volatile int state` field inside AQS and update a `ThreadLocal` hold counter. Across 16+ CPU cores, all cores fight for exclusive ownership (`Modified` state in MESI) of that single 64-byte cache line—creating a hardware serialization bottleneck. `ReadWriteLock` only wins when the read critical section is long enough (e.g., iterating/copying thousands of entries) to amortize the atomic bookkeeping. For read-mostly caches, an immutable `Map.copyOf()` published via a `volatile` reference or `ConcurrentHashMap` eliminates read-side locking altogether."*

#### Trap 2: "If a thread holds `readLock()` and realizes it needs to update the cache, can it just call `writeLock().lock()` to upgrade?"
* **Junior/Mid Answer:** *"Yes, since `ReentrantReadWriteLock` is reentrant, the same thread can upgrade its read lock to a write lock."*
* **Principal Rebuttal:**
  > *"`ReentrantReadWriteLock` supports **lock downgrade** (acquiring `readLock` while holding `writeLock`, then releasing `writeLock`), but **strictly forbids lock upgrade**. If a thread holding a `readLock` calls `writeLock().lock()`, the write lock waits for all active read locks to reach 0—including the read lock held by the calling thread itself! The thread permanently self-deadlocks in the `WAITING` state. Worse, because read locks do not have a single owner in AQS, `jstack` will NOT report this as a Java-level deadlock. You must release `readLock()` first, acquire `writeLock()`, and re-verify the condition (since another writer may have mutated state in the gap)."*

#### Trap 3: "If multiple readers can hold a `ReadWriteLock` simultaneously, how can a single slow reader freeze all other readers?"
* **Junior/Mid Answer:** *"It can't. A slow reader only blocks writers; other readers will continue to acquire the shared read lock without waiting."*
* **Principal Rebuttal:**
  > *"That is only true until a single writer arrives. To prevent writer starvation, Java's `ReentrantReadWriteLock` implements `apparentFirstQueuedIsExclusive() / apparentlyFirstQueuedIsExclusive()`: as soon as one writer blocks waiting for the slow reader and sits at the head of the AQS queue, **every subsequent new reader is blocked behind that writer**. This creates a **lock convoy**: 1 slow reader (e.g., doing socket I/O inside a read lock) + 1 waiting writer = 100% of incoming reader threads parked, exhausting a 200-thread Tomcat pool in milliseconds."*

#### Trap 4: "Why not use `StampedLock` everywhere instead of `ReentrantReadWriteLock`?"
* **Junior/Mid Answer:** *"We should, because `StampedLock` is the newer Java 8 replacement and is always faster."*
* **Principal Rebuttal:**
  > *"`StampedLock` achieves zero-contention optimistic reads (`tryOptimisticRead()`) by stripping away two critical safety guarantees: it is **non-reentrant** and has **no ownership tracking**. If a method holding a `StampedLock` write lock calls a helper method that also acquires the write lock, the thread deadlocks itself. And because `StampedLock` does not record an owner thread, `jstack` shows `Locked ownable synchronizers: None`, making production hangs notoriously painful to debug. Use `StampedLock` strictly as a private internal primitive over flat primitive fields (never traversing object references before `validate(stamp)`)."*

### 3. Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
|:---|:---|:---|
| **Reentrancy vs Ownership** | *"Reentrant means a thread can lock twice."* | *"Ownership (`exclusiveOwnerThread` + `holdCount`) powers 4 things: reentrancy, `jstack` owner blame, automatic JVM deadlock cycle detection, and `Condition.await()` state save/restore—at the cost of forbidding cross-thread `unlock()`."* |
| **Writer Starvation & Convoy** | *"ReadWriteLock starves writers when readers are heavy."* | *"Java's `ReentrantReadWriteLock` blocks new readers when an exclusive writer heads the AQS queue (`apparentFirstQueuedIsExclusive`), trading writer starvation for **convoy risk** if any reader performs slow I/O."* |
| **Read-Heavy Config Cache** | *"Use `ReentrantReadWriteLock` around the `HashMap`."* | *"Use Copy-on-Write with an immutable `Map.copyOf()` stored in a `volatile` reference: readers pay 0 lock overhead and never convoy; writers synchronize and swap the pointer."* |
| **`StampedLock` Optimistic Read** | *"Call `tryOptimisticRead()` and use the object fields."* | *"Copy primitive fields into local stack variables first, call `validate(stamp)` (which issues a load fence), and fall back to a pessimistic `readLock()` if a writer interleaved. Never dereference objects before validating."* |

---

## Interview Questions

### Q1. What is the difference between `synchronized` and `ReentrantLock` in Java?
> `synchronized` is a language keyword providing implicit, block-scoped monitor locking managed automatically by the JVM. `ReentrantLock` is an explicit API implementation of the `Lock` interface backed by AbstractQueuedSynchronizer (AQS). `ReentrantLock` offers advanced capabilities unavailable in `synchronized`, such as interruptible lock acquisition (`lockInterruptibly()`), non-blocking or timed attempts (`tryLock()`), configurable fairness policies, and multiple wait-set conditions (`newCondition()`).

### Q2. How does lock escalation work for `synchronized` monitors in the JVM?
> Prior to JDK 15, the JVM escalated monitor locks through three stages stored in the object header's Mark Word: (1) **Biased Locking** (stamped with the owning thread ID, eliminating CAS overhead for single-thread locks); (2) **Lightweight Locking** (uses CAS spin-locking when a second thread contends for the monitor); (3) **Heavyweight Locking** (escalates to an OS-level kernel mutex when CAS spinning exceeds a threshold, parking waiting threads).

### Q3. Why does `volatile` guarantee visibility and ordering, but NOT atomicity?
> `volatile` forces memory reads and writes to bypass CPU L1/L2 caches and interact directly with main memory via memory barriers (preventing compiler and CPU reordering). However, compound operations like `count++` involve three distinct steps: read, modify, write. If two threads execute `count++` concurrently, both can read the same volatile value before either writes back, resulting in a lost update. Atomicity requires CAS primitives (`AtomicInteger`) or mutual exclusion (`ReentrantLock`).

### Q4. What is the difference between `CountDownLatch` and `CyclicBarrier`?
> `CountDownLatch` is a **one-shot** coordination utility where one or more threads wait until a counter reaches zero via `countDown()`. It cannot be reset. `CyclicBarrier` is a **reusable** synchronization point where a fixed number of threads must meet at a barrier via `await()` before any thread is allowed to proceed. `CyclicBarrier` automatically resets after all threads arrive and supports an optional barrier action runnable.

---

## See Also

- [AbstractQueuedSynchronizer (AQS) Deep Dive](./java-aqs-internals.md)
- [Java Concurrent Collections](../interview-questions/java/concurrent-collection-interview.md)
- [Java Virtual Threads & Concurrency](./java-virtual-threads.md)