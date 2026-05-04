---
id: processing-and-ordering
title: Processing and Ordering
sidebar_label: Processing & Ordering
---

# Improving Processing Speed While Ensuring Ordering

One of the most complex architectural challenges in streaming systems is balancing **Throughput** (processing messages as fast as possible) with **Ordering** (processing messages exactly in the sequence they were generated).

By default in Kafka, you can have one or the other easily, but having both requires specific design patterns.

---

## 👶 For Beginners: The "Bank Teller" Analogy

Imagine a bank with a single massive line of customers (A Kafka Partition). 
You want to serve customers faster, so you hire 5 tellers (Threads) to serve the single line. 

- **The Problem**: If Alice (Deposit) and Bob (Withdrawal) are next in line for the *same* bank account, and Teller 1 takes Alice while Teller 2 takes Bob, Teller 2 might process the withdrawal faster than Teller 1 processes the deposit. The account might temporarily overdraft and fail the transaction. Order was broken!
- **The Solution (Key-Based Routing)**: You hire a "Manager" at the front of the line. The manager looks at the Account Number. They say: "All transactions for Account #123 *must* go to Teller 1. All transactions for Account #456 *must* go to Teller 2." 

Now, Teller 1 will process Alice's deposit, and Bob must wait his turn at Teller 1. Order is preserved for that specific account, but the bank is still processing 5 different accounts in parallel!

---

## 🧠 Deep Dive: The Parallel Consumer Pattern

In a standard Kafka consumer, a single thread executes the `poll()` loop *and* the processing logic. If processing takes 100ms, your maximum throughput for that partition is 10 messages per second.

To increase this without adding partitions (which breaks hash routing), you must introduce **Concurrency within the consumer**.

### How Key-Level Parallelism Works

The Parallel Consumer pattern separates the network I/O (`poll`) from the processing logic.

1. **The Poller Thread**: A single thread continuously calls `poll()`, fetching large batches of messages from Kafka.
2. **The Router**: The poller inspects the `Key` of every message.
3. **The Worker Pools**: Based on a hash of the Key, the router submits the message to a specific thread within a local Thread Pool.
   - Message Key `A` -> Thread 1
   - Message Key `B` -> Thread 2
   - Message Key `A` -> Thread 1 (Waits in Thread 1's local queue until the previous message is done).

This guarantees that messages with the same key are processed strictly sequentially by the same thread, while messages with different keys are processed concurrently.

### ⚠️ The Offset Committing Challenge

When you use async worker threads, you completely break Kafka's default offset management. 

If you fetch offsets 1 through 10, and Thread 2 finishes offset 10 instantly, but Thread 1 is still processing offset 1 (because it's a slow database write), **you cannot commit offset 10 back to Kafka**. If the application crashes, Kafka will think offsets 1-10 are done, and you will permanently lose the data from offset 1.

You must implement a **High-Water Mark / Sliding Window** commit strategy: You can only commit the highest offset where *all* preceding offsets have also completed.

---

## ✅ Best Practices & Solutions

1. **Use Confluent's Parallel Consumer**: Do not build the complex High-Water Mark offset commit logic yourself. Confluent provides an open-source Java library called `parallel-consumer` that handles key-based routing and safe, out-of-order offset tracking automatically.
2. **Batch Processing**: If you cannot use multithreading, consider batching. Instead of doing 500 individual `INSERT` statements to a database, group the messages by key in memory, and do a single `BULK INSERT`. You maintain order, but drastically reduce network I/O latency.
3. **The "Router Topic" Pattern (Fan-out)**: If your consumer is irredeemably slow, write a lightning-fast consumer whose *only* job is to read the main topic and immediately produce the messages into 10 smaller "sub-topics" based on the key. You can then attach standard consumers to those sub-topics to process them in parallel.
4. **Idempotency**: If you are using any form of async processing or retries, ensure your downstream systems (Databases, APIs) are idempotent. If a crash happens and a message is re-processed, it should not result in duplicate state.
