---
id: spring-batch
title: Spring Batch — Data Processing
description: Complete guide to Spring Batch, including Job configurations, Chunk-oriented processing, fault tolerance (Skip/Retry), and scaling massive datasets.
tags: [spring-batch, java, data-processing, backend, etl]
---

# 🏭 Spring Batch — Massive Data Processing

Spring Batch is a lightweight, comprehensive framework designed to enable the development of robust batch applications vital for the daily operations of enterprise systems. When you need to read 5 million rows from a CSV, transform the data, and write it to a database without blowing up your JVM memory, you use Spring Batch.

---

## 🏗️ 1. What is Spring Batch?

Spring Batch provides reusable functions essential in processing large volumes of records, including logging/tracing, transaction management, job processing statistics, job restart, skip, and resource management.

#### 👶 Beginner Concept: The "Factory Assembly Line" Analogy
Imagine you are building cars. 
- **Without Spring Batch (Standard Java Loop):** You hire one guy. He builds an entire car from scratch (Read), paints it (Process), and drives it to the lot (Write), then walks back to start the next car. He does this 10,000 times. If he gets sick on car 4,999, you have to start the ENTIRE process from car #1 tomorrow.
- **With Spring Batch:** You build an Assembly Line (`Job`). The line is broken into `Steps`. In the main Step, a robot arm grabs 100 chassis (`ItemReader`), another paints all 100 (`ItemProcessor`), and a truck takes all 100 to the lot together (`ItemWriter`). If the paint machine breaks, the line stops exactly at that batch, saves its progress, and you can press "Restart" tomorrow to resume exactly where it failed.

---

## ⚙️ 2. Core Architecture Components

A Spring Batch architecture revolves around a specific hierarchy:

```
JobLauncher
    │ (Runs)
    ▼
   Job (The entire Assembly Line)
    │ (Contains 1 to N)
    ▼
  Step (A specific phase)
    ├── ItemReader    (Read data from Source: DB, CSV, XML)
    ├── ItemProcessor (Transform/Filter data)
    └── ItemWriter    (Write data to Destination)
```

### The `JobRepository`
The secret weapon of Spring Batch is the **JobRepository**. It requires a database (like PostgreSQL or H2). Before Spring Batch processes a single row, it writes metadata to the database: "I am starting Job XYZ instance 45". After every chunk of data, it updates the database: "I successfully processed 500 rows". This is how it achieves its legendary **Restartability**.

---

## 🔁 3. Chunk-Oriented Processing

The most powerful feature of Spring Batch is **Chunk Processing**. It reads data one at a time, but processes and writes data in "chunks" (transactions).

```java
@Bean
public Step processCsvStep(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
    return new StepBuilder("processCsvStep", jobRepository)
        .<InputDto, OutputEntity>chunk(100, transactionManager) // Chunk size: 100
        .reader(csvReader())
        .processor(dataProcessor())
        .writer(databaseWriter())
        .build();
}
```

### The Chunk Lifecycle:
1. The **`ItemReader`** reads 1 item.
2. If the item is not null, it is added to a List.
3. Steps 1 & 2 repeat until the List size equals the `chunk` size (e.g., 100).
4. The entire List of 100 items is passed to the **`ItemProcessor`**. The processor transforms them one by one.
5. The processed List of 100 items is passed to the **`ItemWriter`** to be saved to the database in one massive bulk INSERT.
6. The database **Transaction Commits**. (If it fails here, the entire chunk of 100 rolls back).

---

## 🛡️ 4. Fault Tolerance (Skip & Retry)

When processing 5 million rows of external data, *some rows will be corrupted*. You cannot let one bad string crash a 6-hour job.

### Skip Logic
You can tell Spring Batch to simply skip bad records and keep going.

```java
@Bean
public Step skipStep(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
    return new StepBuilder("skipStep", jobRepository)
        .<InputDto, OutputEntity>chunk(100, transactionManager)
        .reader(reader())
        .processor(processor())
        .writer(writer())
        .faultTolerant()
        .skipLimit(10) // Allow up to 10 bad records
        .skip(DataIntegrityViolationException.class) // Only skip on this specific exception
        .build();
}
```

### Retry Logic
If writing to an external API (which might have a temporary network blip), you don't want to skip immediately; you want to retry.

```java
        .faultTolerant()
        .retryLimit(3)
        .retry(RestClientException.class) // Retry 3 times if the API fails
```

---

## 🧠 5. Senior Deep Dive: Scaling & Transaction Boundaries

Writing a simple Job is easy. Scaling it to process 50 million rows in 30 minutes requires senior-level architectural patterns.

### The Single Threaded Bottleneck
By default, Spring Batch executes sequentially on a single thread. It reads, then processes, then writes. If the `ItemProcessor` involves a slow external API call (e.g., 200ms per item), your chunk of 100 items takes 20 seconds. 5 million items = 11 days.

### Pattern 1: AsyncItemProcessor / AsyncItemWriter
Instead of processing synchronously, you wrap your processor in an `AsyncItemProcessor`. It immediately returns a `Future<OutputEntity>` and hands the work to a `ThreadPoolTaskExecutor`. The `AsyncItemWriter` gathers all the Futures, waits for them to resolve collectively, and bulk writes them.
*Use Case: Heavy I/O processing (calling external REST APIs).*

### Pattern 2: Multi-threaded Step
You configure a `TaskExecutor` directly on the Step. Now, multiple threads are executing the `Chunk` lifecycle independently. 
- **The Senior Trap:** Your `ItemReader` MUST be thread-safe. A standard `JdbcCursorItemReader` is NOT thread-safe (multiple threads will read the same row). You must use `SynchronizedItemStreamReader` or thread-safe equivalents like `JdbcPagingItemReader`.

### Pattern 3: Partitioning (The Gold Standard)
If a Multi-threaded Step is vertically scaling, Partitioning is horizontally scaling.
A **Master Step** looks at the database: *"We have 1 Million rows. I will create 10 Worker Steps. Worker 1 handles IDs 1-100k. Worker 2 handles IDs 100k-200k."*
The Master assigns these partitions to worker threads, or uses a message queue (like RabbitMQ) to distribute the worker steps across *completely different servers* (Remote Partitioning).
*Use Case: Astronomical data volumes requiring cluster-level parallelization.*

### The Chunk Transaction Boundary Risk
Seniors must deeply understand the chunk boundary. If you set a chunk size of 10,000 to "go faster", you create a massive Long-Running Transaction. The JVM must hold 10,000 massive objects in heap memory simultaneously (risking OutOfMemory errors), and the Database must lock tables for an extended duration (causing Deadlocks with live user traffic). 
**Optimal Chunk Size:** Usually between 100 and 1,000, depending strictly on the memory footprint of the Object being processed.
