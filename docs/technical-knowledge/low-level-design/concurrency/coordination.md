---
id: coordination
title: "Concurrency: Coordination"
sidebar_label: Coordination
---

# Concurrency: Coordination

> Coordination is about threads **working together** — waiting for each other, signaling each other, and transferring data safely. Getting this wrong leads to deadlocks, livelocks, and starvation.

---

## Locks

### ReentrantLock — More Control Than `synchronized`

```java
public class TicketingSystem {
    private final ReentrantLock lock = new ReentrantLock();
    private final ReentrantLock.Condition seatsAvailable = lock.newCondition();
    private int availableSeats;

    public TicketingSystem(int seats) { this.availableSeats = seats; }

    // ReentrantLock advantages over synchronized:
    // 1. tryLock() — non-blocking attempt
    // 2. lockInterruptibly() — can be interrupted
    // 3. Multiple Conditions on same lock
    // 4. Fairness option

    public boolean bookSeat(long timeoutMs) throws InterruptedException {
        // Try to acquire lock within timeout — avoids indefinite blocking
        if (!lock.tryLock(timeoutMs, TimeUnit.MILLISECONDS)) {
            return false;  // Could not acquire lock in time
        }
        try {
            while (availableSeats == 0) {
                // Wait for seat to become available (with timeout)
                if (!seatsAvailable.await(timeoutMs, TimeUnit.MILLISECONDS)) {
                    return false;  // Timed out waiting
                }
            }
            availableSeats--;
            return true;
        } finally {
            lock.unlock();  // ALWAYS release in finally block
        }
    }

    public void releaseSeat() {
        lock.lock();
        try {
            availableSeats++;
            seatsAvailable.signal();  // Wake one waiting thread
        } finally {
            lock.unlock();
        }
    }
}
```

### ReadWriteLock — Concurrent Reads, Exclusive Writes

```java
public class ProductCatalog {
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock  = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    private final Map<String, Product> catalog = new HashMap<>();

    // Multiple readers can read simultaneously
    public Optional<Product> findById(String id) {
        readLock.lock();
        try {
            return Optional.ofNullable(catalog.get(id));
        } finally {
            readLock.unlock();
        }
    }

    public List<Product> search(String keyword) {
        readLock.lock();
        try {
            return catalog.values().stream()
                .filter(p -> p.getName().contains(keyword))
                .collect(Collectors.toList());
        } finally {
            readLock.unlock();
        }
    }

    // Only one writer can write; blocks all readers
    public void addProduct(Product product) {
        writeLock.lock();
        try {
            catalog.put(product.getId(), product);
        } finally {
            writeLock.unlock();
        }
    }
}
```

:::tip Interview Tip 🎯
Mention `ReadWriteLock` when your design has a **read-heavy** workload (e.g., product catalog, configuration, routing tables). Say: *"Since reads vastly outnumber writes here, I'll use a ReadWriteLock to allow concurrent reads while still protecting writes exclusively."*
:::

---

## Deadlock

A **deadlock** occurs when two or more threads are each waiting for a lock held by another — forming a cycle.

### Four Conditions for Deadlock (Coffman Conditions)
1. **Mutual exclusion** — at least one resource is non-shareable
2. **Hold and wait** — a thread holds one resource and waits for another
3. **No preemption** — resources can't be forcibly taken
4. **Circular wait** — A waits for B, B waits for A

```java
// ❌ Classic deadlock: transferring between two bank accounts
public class Account {
    private double balance;
    public synchronized void transfer(Account target, double amount) {
        synchronized (target) {  // Thread A locks this, waits for target
            // Thread B locks target, waits for this → DEADLOCK
            this.balance  -= amount;
            target.balance += amount;
        }
    }
}

// ✅ Fix 1: Lock ordering — always acquire locks in same global order
public void transfer(Account target, double amount) {
    Account first  = this.id < target.id ? this : target;  // lower ID first
    Account second = this.id < target.id ? target : this;

    synchronized (first) {
        synchronized (second) {
            this.balance  -= amount;
            target.balance += amount;
        }
    }
}

// ✅ Fix 2: tryLock with timeout — back off if can't acquire
public boolean transfer(Account target, double amount) throws InterruptedException {
    while (true) {
        if (this.lock.tryLock(10, TimeUnit.MILLISECONDS)) {
            try {
                if (target.lock.tryLock(10, TimeUnit.MILLISECONDS)) {
                    try {
                        this.balance  -= amount;
                        target.balance += amount;
                        return true;
                    } finally {
                        target.lock.unlock();
                    }
                }
            } finally {
                this.lock.unlock();
            }
        }
        Thread.sleep(1); // Back off before retrying
    }
}
```

---

## Semaphore

A **Semaphore** controls access to a finite number of resources. It maintains a permit count — `acquire()` decrements, `release()` increments.

```java
// Parking lot with limited spots
public class ParkingLot {
    private final Semaphore availableSpots;

    public ParkingLot(int totalSpots) {
        this.availableSpots = new Semaphore(totalSpots, true); // fair = FIFO
    }

    public boolean tryPark(Car car, long timeoutMs) throws InterruptedException {
        if (!availableSpots.tryAcquire(timeoutMs, TimeUnit.MILLISECONDS)) {
            System.out.println("Parking full — " + car.getPlate() + " turned away");
            return false;
        }
        System.out.println(car.getPlate() + " parked. Spots left: " + availableSpots.availablePermits());
        return true;
    }

    public void leave(Car car) {
        availableSpots.release();
        System.out.println(car.getPlate() + " left. Spots left: " + availableSpots.availablePermits());
    }
}

// Database connection pool with Semaphore
public class ConnectionPool {
    private final Semaphore semaphore;
    private final BlockingQueue<Connection> connections;

    public ConnectionPool(int size) {
        this.semaphore   = new Semaphore(size);
        this.connections = new LinkedBlockingQueue<>(size);
        for (int i = 0; i < size; i++) {
            connections.add(createConnection());
        }
    }

    public Connection acquire() throws InterruptedException {
        semaphore.acquire();            // Wait for a permit
        return connections.take();      // Get a connection
    }

    public void release(Connection conn) {
        connections.offer(conn);        // Return connection
        semaphore.release();            // Release the permit
    }
}
```

---

## CountDownLatch

Wait for N events to complete before proceeding. Count-down only — cannot be reset.

```java
// Integration test: wait for all services to start
public class ServiceOrchestrator {
    public void startAll() throws InterruptedException {
        int serviceCount = 3;
        CountDownLatch readyLatch = new CountDownLatch(serviceCount);

        ExecutorService executor = Executors.newFixedThreadPool(serviceCount);
        executor.submit(() -> { startDatabaseService(); readyLatch.countDown(); });
        executor.submit(() -> { startCacheService();    readyLatch.countDown(); });
        executor.submit(() -> { startApiGateway();      readyLatch.countDown(); });

        // Main thread waits here until all 3 services are ready
        boolean allStarted = readyLatch.await(30, TimeUnit.SECONDS);
        if (!allStarted) throw new TimeoutException("Services did not start in time");

        System.out.println("All services ready — opening traffic");
    }
}

// Parallel task execution with aggregation
public class ParallelReportBuilder {
    public Report build(ReportRequest request) throws InterruptedException {
        CountDownLatch latch     = new CountDownLatch(3);
        AtomicReference<SalesData>    sales   = new AtomicReference<>();
        AtomicReference<InventoryData> inv     = new AtomicReference<>();
        AtomicReference<CustomerData>  cust    = new AtomicReference<>();

        executor.submit(() -> { sales.set(fetchSales(request));     latch.countDown(); });
        executor.submit(() -> { inv.set(fetchInventory(request));   latch.countDown(); });
        executor.submit(() -> { cust.set(fetchCustomers(request));  latch.countDown(); });

        latch.await();  // Wait for all data fetches
        return new Report(sales.get(), inv.get(), cust.get());
    }
}
```

---

## CyclicBarrier

Wait for N threads to reach a common point — then **all proceed together**. Can be reused (unlike CountDownLatch).

```java
// Phased parallel processing (e.g., game loop synchronization)
public class ParallelSorter {
    private final int numThreads;
    private final CyclicBarrier barrier;

    public ParallelSorter(int numThreads) {
        this.numThreads = numThreads;
        // Barrier action runs when all threads arrive
        this.barrier = new CyclicBarrier(numThreads, () -> {
            System.out.println("Phase complete — merging results...");
        });
    }

    public void sort(int[] data) throws Exception {
        int chunkSize = data.length / numThreads;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);

        for (int i = 0; i < numThreads; i++) {
            final int start = i * chunkSize;
            final int end   = (i == numThreads - 1) ? data.length : start + chunkSize;

            executor.submit(() -> {
                // Phase 1: each thread sorts its chunk
                Arrays.sort(data, start, end);
                barrier.await();  // Wait for all chunks to be sorted

                // Phase 2: merge (only done once all chunks are sorted)
                // ...
                barrier.await();  // Barrier is cyclic — can await again
            });
        }
    }
}
```

---

## Producer-Consumer with BlockingQueue

```java
// Classic producer-consumer decoupled by a bounded queue
public class OrderProcessor {
    private final BlockingQueue<Order> orderQueue;
    private volatile boolean running = true;

    public OrderProcessor(int queueCapacity) {
        this.orderQueue = new LinkedBlockingQueue<>(queueCapacity);
    }

    // Producer — API thread
    public void submitOrder(Order order) throws InterruptedException {
        // put() blocks if queue is full (natural backpressure)
        orderQueue.put(order);
        System.out.println("Order submitted: " + order.getId() + " | Queue size: " + orderQueue.size());
    }

    // Consumer — background worker thread
    public void startProcessing() {
        Thread worker = new Thread(() -> {
            while (running || !orderQueue.isEmpty()) {
                try {
                    Order order = orderQueue.poll(1, TimeUnit.SECONDS);  // timeout avoids hang
                    if (order != null) {
                        processOrder(order);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
        worker.setDaemon(true);
        worker.start();
    }

    public void shutdown() { running = false; }
}
```

---

## Deadlock vs Livelock vs Starvation

| Issue | Description | Example | Fix |
|-------|-------------|---------|-----|
| **Deadlock** | Threads block forever waiting for each other | A waits for B's lock; B waits for A's | Lock ordering, timeouts |
| **Livelock** | Threads keep responding to each other but make no progress | Two threads keep backing off simultaneously | Randomized backoff, arbitration |
| **Starvation** | A thread never gets CPU/lock time | Low-priority thread perpetually preempted | Fair locks, priority management |

```java
// Livelock example and fix
// ❌ Both threads back off simultaneously — forever
while (!tryAcquire(lockA)) {
    release(lockB);
    Thread.sleep(10);  // both sleep for same duration — still collide!
    acquire(lockB);
}

// ✅ Randomized backoff breaks the symmetry
Random rng = new Random();
while (!tryAcquire(lockA)) {
    release(lockB);
    Thread.sleep(rng.nextInt(50));  // random backoff — they won't always collide
    acquire(lockB);
}
```

**Next →** [Concurrency — Scarcity](./scarcity)
