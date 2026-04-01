---
id: java-aqs-internals
title: "AbstractQueuedSynchronizer (AQS) Internals"
slug: java-aqs-internals
description: "A senior deep dive into the JVM's AbstractQueuedSynchronizer: exploring the CLH queue, LockSupport.park(), and CAS state transitions in ReentrantLock."
tags: [java, concurrency, aqs, jvm, backend]
---

# 🧠 AQS (AbstractQueuedSynchronizer) Deep Dive

If you want to pass a Senior or Staff-level Java backend interview, you cannot just know *how* to use a `ReentrantLock`. You must know exactly *how it works under the hood*. 

Almost every high-level Java concurrency utility (`ReentrantLock`, `Semaphore`, `CountDownLatch`, `ReentrantReadWriteLock`) relies purely on one internal framework: The **AbstractQueuedSynchronizer (AQS)**.

---

## 1. Why AQS was Created

Before Java 5, the only way to synchronize threads was the `synchronized` keyword. 
- **The Problem:** `synchronized` delegated locking to the Operating System's Pthread Mutex. If a thread failed to get the lock, the OS would put the thread to sleep (a Heavyweight Context Switch).
- **The Solution:** Doug Lea wrote AQS purely in Java code to avoid asking the OS for help unless absolutely necessary.

---

## 2. The Core Architecture of AQS

AQS manages thread blocking and lock allocation using three fundamental pillars:

1. **The State** (`volatile int state`)
2. **The Queue** (A FIFO Doubly-Linked "CLH" Queue)
3. **The Pauser** (`LockSupport.park()`)

### Pillar 1: The State (`volatile int`)
AQS relies on a single volatile integer to represent the "Lock". 
- In `ReentrantLock`, `state = 0` means the lock is free. `state = 1` means it is locked. `state = 2` means the thread re-entered the lock twice.
- In `Semaphore(5)`, `state = 5`. Every `acquire()` drops the state by 1.

AQS changes this state using **CAS (Compare-And-Swap)** instructions via the `Unsafe` class, which execute atomically on the CPU hardware without OS intervention.

```java
// How AQS tries to acquire a lock (simplified)
protected final boolean compareAndSetState(int expect, int update) {
    return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
}
```

### Pillar 2: The CLH Synchronization Queue
If Thread A holds the lock, and Thread B wants the lock, Thread B will fail the CAS update. What happens to Thread B?

AQS wraps Thread B inside a `Node` object and adds it to a **bidirectional FIFO queue** (a variant of the Craig, Landin, and Hagersten queue).

```text
       [ Head Node ] ⇄ [ Node Thread B ] ⇄ [ Node Thread C ] 
       (Holding Lock)    (Waiting)           (Waiting)
```

**Why a queue?** 
1. It prevents "Lock Starvation" (Thread B is guaranteed to get the lock next).
2. It prevents the "Thundering Herd" problem. When Thread A releases the lock, it doesn't wake up 10,000 sleeping threads; it ONLY wakes up Thread B at the exact head of the queue.

### Pillar 3: LockSupport.park()
Once Thread B adds itself to the queue, it cannot just run a `while(true)` loop (a spin-lock) waiting for Thread A to finish. That would burn 100% of the CPU core doing nothing!

Instead, AQS uses `LockSupport.park()`.
- `park()` suspends the thread instantly without the massive overhead of traditional OS sleep events.
- When Thread A calculates it is done, it calls `LockSupport.unpark(Thread_B)`. 
- Thread B wakes up, runs a CAS check on the `state` again, succeeds, and enters the critical section!

---

## 3. The ReentrantLock Walkthrough

Let's trace exactly what happens when 3 threads try to execute `lock.lock()` simultaneously.

### Step 1: Thread 1 Arrives
- Thread 1 checks AQS `state`. It is `0`.
- Thread 1 executes a CAS: `compareAndSetState(0, 1)`. It succeeds!
- Thread 1 sets itself as the `exclusiveOwnerThread`. It enters your business logic.

### Step 2: Thread 2 Arrives
- Thread 2 checks AQS `state`. It is `1`.
- Thread 2 attempts CAS `compareAndSetState(0, 1)`. **It fails.**
- AQS creates a `Node` for Thread 2.
- AQS runs a CAS loop to safely attach Thread 2's Node to the `tail` of the CLH queue.
- Thread 2 realizes it is blocked, and calls `LockSupport.park()`. It goes to sleep.

### Step 3: Thread 3 Arrives
- Thread 3 goes through the exact same logic.
- AQS attaches Thread 3's Node behind Thread 2. Thread 3 goes to sleep.

### Step 4: Thread 1 Finishes
- Thread 1 calls `lock.unlock()`.
- AQS decrements `state` back to `0`.
- AQS checks the Head of the CLH queue and finds Thread 2.
- AQS calls `LockSupport.unpark(Thread_2)`.
- Thread 2 wakes up! It runs CAS `(0, 1)`, succeeds, and executes its business logic.

---

## 4. Fair vs Non-Fair Locks

When you create `new ReentrantLock()`, it defaults to **Non-Fair**.

#### 👶 Beginner Concept: The "DMV Wait Line"
- **Fair Lock:** When you walk into the DMV, you take a ticket and go to the absolute back of the line. You wait your turn perfectly.
- **Non-Fair Lock:** When you walk into the DMV, if the teller's window happens to be empty at the *exact millisecond* you walk in the door, you just run up and grab the teller, completely skipping the 50 people sleeping in chairs in the queue!

#### Why Non-Fair is the Default (And 10x Faster)
If Thread 1 releases the lock and calls `unpark(Thread 2)`, it physically takes Java a few microseconds to spin up Thread 2's CPU context and wake it from sleep. 

If Thread 4 arrives from the network at that exact millisecond, **Non-Fair AQS lets Thread 4 snatch the lock**. Thread 4 completes its task instantly and releases the lock *before Thread 2 even finishes waking up!* 

This maximizes CPU utilization tremendously by avoiding the dead-air gap of Thread 2's wake-up cycle.

---

## 5. Interview Questions

### Q: Why not use `synchronized` everywhere?
**A:** Post-Java 6, `synchronized` uses Lock Escalation and is extremely fast. However, it lacks advanced features that AQS provides: `tryLock()` (timeout if you can't get it instantly), Fair locking, and Interruptible locks (`lockInterruptibly()`).

### Q: How does AQS handle Reentrancy?
**A:** Before going to the queue, AQS checks `if (Thread.currentThread() == getExclusiveOwnerThread())`. If true, it just does `state = state + 1` natively without locking, allowing recursive method calls.

### Q: Why doesn't Thread B just `spin-wait` instead of `park()`?
**A:** AQS actually *does* spin wait for a tiny fraction of a microsecond before parking! It knows the lock might be released instantly. But if it spun forever, it would consume 100% of the CPU core, starving the OS. Parking is required for sustained blocking.
