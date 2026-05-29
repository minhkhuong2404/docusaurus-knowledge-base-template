---
id: java-threads
title: "Java Threads & Processes"
slug: java-threads
description: A complete guide to threads, processes, lifecycles, and basic thread coordination (join, interrupt, daemon threads) in Java.
tags: [java, concurrency, threads, process]
---

# Java Threads & Processes

Concurrency in Java begins with understanding the execution units of the Operating System: Threads and Processes.

---

## 👶 Beginner Concept: The "Restaurant Kitchen"

Multithreading is famously difficult to learn. Imagine a massive, professional kitchen:
- **The Process:** This is the *entire kitchen building*. It has its own isolated walls, 5 ovens, and a giant walk-in fridge (The Heap Memory). If the kitchen building burns down, the restaurant next door is totally fine (Crash Isolation).
- **The Threads:** These are the *individual Chefs* working inside the kitchen. They all share the exact same ovens and fridge (Shared Memory). They each have their own personal cutting board (The Call Stack). 
  - **The Danger:** Because the chefs share the fridge, if Chef A takes the last onion, and Chef B blindly reaches for it at the exact same millisecond, you get a kitchen disaster (A Race Condition).

## Process vs Thread

| Aspect          | Process                                                 | Thread                                            |
| --------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Definition      | Independent unit of execution with its own memory space | Lightweight unit of execution within a process    |
| Memory          | Isolated address space                                  | Shares heap with other threads; has own stack     |
| Communication   | IPC (sockets, pipes, shared memory)                     | Shared variables (requires synchronization)       |
| Cost            | Expensive to create/switch                              | Cheaper to create/switch                          |
| Crash isolation | One process crash doesn't affect others                 | One thread crash can bring down the whole process |

## Creating Threads

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

## 👶 Beginner Example: Seeing `start()` vs `run()` in Action

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

## Thread Lifecycle States

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

## Thread Coordination: `join()` and `interrupt()`

### `Thread.join()` — Wait for Another Thread to Finish

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

### `Thread.interrupt()` — Cooperative Cancellation

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

## Daemon Threads

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

## Deadlock

Deadlock occurs when two or more threads are **blocked forever**, each waiting for a lock held by the other.

**Four necessary conditions:**
1. **Mutual exclusion** — resources cannot be shared.
2. **Hold and wait** — holding one lock while waiting for another.
3. **No preemption** — locks cannot be forcibly taken.
4. **Circular wait** — A waits for B, B waits for A.

### 👶 Beginner Example: Deadlock in Code

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

## Deadlock vs Livelock vs Starvation

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
