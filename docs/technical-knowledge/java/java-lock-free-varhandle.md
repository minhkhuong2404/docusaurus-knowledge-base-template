---
id: java-lock-free-varhandle
title: "Lock-Free Concurrency, CMPXCHG & VarHandle Memory Fences"
sidebar_label: "Lock-Free & VarHandle"
sidebar_position: 7
description: Comprehensive principal engineering guide to lock-free vs wait-free data structures, hardware CMPXCHG instructions, ABA problem resolution with AtomicStampedReference, and Java 9 VarHandle memory ordering modes.
tags: [java, concurrency, lock-free, wait-free, cas, cmpxchg, aba-problem, atomicstampedreference, varhandle, memory-fences]
---

# 🚀 Lock-Free Concurrency, CMPXCHG & VarHandle Memory Fences

In multi-threaded Java applications, traditional mutual exclusion primitives like `synchronized` and `ReentrantLock` enforce safety through OS-level thread suspension (mutexes). However, in high-throughput engines, thread parking and context switching introduce millisecond latency jitter and severe cache invalidation.

**Lock-free programming** abandons blocking mutexes in favor of atomic CPU hardware instructions (**`CMPXCHG`**) and fine-grained memory barriers via **`VarHandle`**.

---

## 1. Concurrency Progress Guarantees

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONCURRENCY PROGRESS GUARANTEES                                             │
│                                                                             │
│ 1. BLOCKING (Pessimistic Locking - synchronized, ReentrantLock)             │
│    • Threads wait on OS mutexes.                                            │
│    • If holding thread is suspended or preempted, all threads stall.        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. LOCK-FREE (Optimistic CAS Loops - AtomicInteger, ConcurrentLinkedQueue)  │
│    • System-wide progress is guaranteed.                                    │
│    • At least one thread is guaranteed to make progress in any finite step. │
│    • Individual threads may experience starvation under high contention.    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. WAIT-FREE (Deterministic Bound - LMAX RingBuffer single producer)       │
│    • Strongest guarantee: EVERY thread makes progress in bounded steps.     │
│    • Zero thread suspension; zero starvation loops.                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hardware Compare-And-Swap (CAS) & The ABA Problem

Lock-free algorithms rely on the CPU's native atomic instruction **`CMPXCHG`** (Compare-and-Exchange). On x86 multi-core processors, this instruction asserts the `LOCK` signal on the memory bus or locks the specific cache line:

```
[Thread Reads Memory: Value = A]
               │
               ▼
[Thread Prepares New Value: Value = B]
               │
               ▼
[CPU CMPXCHG: If Memory == A, then Memory = B, else Retry]
```

### The ABA Problem in Lock-Free Stacks
In a lock-free Treiber stack:
1. Thread 1 reads top of stack: node `A` (which points to node `B`).
2. Thread 1 is preempted by the OS scheduler before executing its CAS.
3. Thread 2 pops `A`, pops `B`, and then pushes `A` back onto the stack (top is `A`, pointing to `C`).
4. Thread 1 resumes: it checks if top is still `A`. It sees `A`, assumes nothing has changed, and swaps top to `B`.
5. **Memory Corruption**: Node `B` was already freed and unlinked, corrupting the stack structure!

### Resolution: Stamped References (`AtomicStampedReference`)
To solve the ABA problem, the JVM pairs the memory reference with a monotonically increasing integer **version tag (stamp)**:

```java
import java.util.concurrent.atomic.AtomicStampedReference;

public class LockFreeStackNode<T> {
    private final T value;
    private final AtomicStampedReference<LockFreeStackNode<T>> nextNode;

    public LockFreeStackNode(T value, LockFreeStackNode<T> next) {
        this.value = value;
        // Reference + Version Stamp (Starts at 0)
        this.nextNode = new AtomicStampedReference<>(next, 0);
    }

    public boolean updateNext(LockFreeStackNode<T> expectedNext, LockFreeStackNode<T> newNext) {
        int[] currentStamp = new int[1];
        LockFreeStackNode<T> currentRef = nextNode.get(currentStamp);

        if (currentRef != expectedNext) {
            return false;
        }

        // Atomically compares BOTH reference and integer stamp
        return nextNode.compareAndSet(
            expectedNext,
            newNext,
            currentStamp[0],
            currentStamp[0] + 1
        );
    }
}
```

---

## 3. Java 9 `VarHandle` Memory Ordering Modes

Historically, low-level lock-free code relied on `sun.misc.Unsafe`. In Java 9, **`java.lang.invoke.VarHandle`** introduced safe, standardized access to hardware memory barriers across four explicit ordering modes:

| Access Mode | Memory Fence Generated | Reordering Permissions | Hardware Use Case |
|---|---|---|---|
| **`get()` / `set()` (Plain)** | None | Full CPU & Compiler reordering permitted | Non-volatile data, local state |
| **`getOpaque()` / `setOpaque()`** | None (Program-order coherence only) | Prevents compiler tearing of 64-bit primitives | Non-synchronized loop counters |
| **`getAcquire()` / `setRelease()`** | **`LoadLoad` + `LoadStore`** / **`StoreStore` + `LoadStore`** | One-way barrier; prior writes cannot move past release | High-performance lock-free publisher-subscriber |
| **`getVolatile()` / `setVolatile()`** | **Full Barrier (`StoreLoad` / `MFENCE`)** | Zero reordering; enforces total sequential consistency | Concurrent state flags, multi-threaded coordinators |

```java
import java.lang.invoke.MethodHandles;
import java.lang.invoke.VarHandle;

public class SequenceBarrierExample {
    private static final VarHandle VALUE_HANDLE;
    private long sequence = 0L;

    static {
        try {
            VALUE_HANDLE = MethodHandles.lookup()
                .findVarHandle(SequenceBarrierExample.class, "sequence", long.class);
        } catch (ReflectiveOperationException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    public void publishSequence(long newSeq) {
        // Enforces StoreStore fence: All prior payload writes are flushed before updating sequence
        VALUE_HANDLE.setRelease(this, newSeq);
    }

    public long readSequence() {
        // Enforces LoadLoad fence: Ensures subsequent reads see data published with this sequence
        return (long) VALUE_HANDLE.getAcquire(this);
    }
}
```

---

## 4. Principal Architect Review Checklist

- [ ] **CAS Retry Loop Safeguards**: Do optimistic CAS retry loops include backoff policies or iteration limits to prevent thread starvation under extreme contention?
- [ ] **ABA Vulnerability Audit**: When building custom lock-free linked data structures, is node recycling guarded using version stamps (`AtomicStampedReference`)?
- [ ] **VarHandle vs. Volatile**: Are one-way barriers (`getAcquire` / `setRelease`) used instead of full `volatile` when total sequential consistency across all variables is not strictly required?
- [ ] **Contention Isolation**: Are volatile sequence numbers and counter fields padded against false sharing?

---

## Related Documentation

- [LMAX Disruptor Architecture: Ultra-Low-Latency RingBuffer](./java-lmax-disruptor.md)
- [Java Object Layout (JOL) & Cache Locality](./java-object-layout-memory.md)
- [Java Concurrency & Multithreading Internals](./java-concurrency.md)
- [AQS Architecture & Lock Implementation](./java-aqs-internals.md)
