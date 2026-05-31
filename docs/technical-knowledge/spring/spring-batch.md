---
id: spring-batch
title: Spring Batch — Complete Guide
sidebar_label: Spring Batch
description: A complete guide to Spring Batch — Job architecture, Chunk-oriented processing, ItemReader/Processor/Writer, fault tolerance, scaling patterns, transaction boundaries, and production monitoring.
tags: [spring-batch, java, data-processing, backend, etl, chunk-processing, partitioning, fault-tolerance]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Spring Batch — Complete Guide

:::info Who this guide is for
- **New learners** — start at [What is Spring Batch?](#what-is-spring-batch) and [Core Architecture](#core-architecture) to understand the foundational model.
- **Senior engineers** — jump to [Scaling Patterns](#scaling-patterns), [Transaction Boundaries](#chunk-transaction-boundaries), [Partitioning](#pattern-3-partitioning), or [Production Patterns](#production-patterns).
:::

---

## What is Spring Batch?

Spring Batch is a **lightweight, open-source framework for processing large volumes of data reliably**. It provides the infrastructure for batch workloads — reading millions of records, transforming them, writing the output — with built-in restart, skip, retry, and transaction management.

It does **not** schedule jobs (that is Quartz, `@Scheduled`, or a cron job). Spring Batch is the *engine* that runs when a scheduled trigger fires.

### The assembly line analogy

The clearest mental model: **a factory assembly line**.

| Factory concept | Spring Batch equivalent | What it does |
|----------------|------------------------|--------------|
| Assembly line | `Job` | The entire process from start to finish |
| Phase of the line | `Step` | One logical stage (e.g. read CSV → write to DB) |
| Robot arm that picks parts | `ItemReader` | Reads one record at a time from the source |
| Painting / welding robot | `ItemProcessor` | Transforms or filters each record |
| Truck that delivers in batches | `ItemWriter` | Writes a batch of records to the destination |
| Factory logbook | `JobRepository` | Records exactly where the line stopped — enables restart |

**Without Spring Batch (naive loop):**

```
Read row 1 → Process → Write | Read row 2 → Process → Write | ... × 5,000,000
```
- If it crashes at row 3,451,000 you start over from row 1.
- Everything runs in one giant transaction — one failure rolls back everything.
- No visibility into progress.

**With Spring Batch:**

```
Read 100 rows → Process 100 → Write 100 → COMMIT ✅
Read 100 rows → Process 100 → Write 100 → COMMIT ✅
... crash at row 3,451,000 ...
Restart → resumes from row 3,451,001 ✅
```

### When to use Spring Batch

| Use case | Spring Batch? | Why |
|---------|:------------:|-----|
| Nightly ETL — migrate 10M records from legacy DB to new schema | ✅ | Chunked transactions, restartability, parallel partitioning |
| Generate monthly invoices for 500K customers | ✅ | Sequential processing with audit trail, fault tolerance |
| Send bulk emails / notifications | ✅ | Rate-limiting with chunk size, skip bad addresses |
| Process uploaded CSV files asynchronously | ✅ | FlatFileItemReader + async job launch |
| Real-time event processing (per-event, millisecond latency) | ❌ | Use Kafka Streams or Spring Integration instead |
| A simple CRUD API with a scheduled cleanup query | ❌ | `@Scheduled` + `@Query` with `@Modifying` is simpler |
| Stream processing with complex windowing | ❌ | Apache Flink or Kafka Streams |

---

## Core Architecture

### Component hierarchy

```
JobLauncher
    │
    ▼
  Job  ─── JobParameters (unique run identifier)
    │
    ├── Step 1: Read CSV → Validate → Write to staging DB
    │     ├── ItemReader
    │     ├── ItemProcessor
    │     └── ItemWriter
    │
    ├── Step 2: Aggregate staging data → Write to reporting DB
    │
    └── Step 3: Send email summary → Archive CSV file

JobRepository (PostgreSQL / H2)
    └── Stores: JobInstance, JobExecution, StepExecution metadata
```

### Core components explained

| Component | Role | Example |
|-----------|------|---------|
| `Job` | Top-level batch process — a named sequence of Steps | `"monthlyInvoiceJob"` |
| `Step` | One processing phase within a Job | `"readCsvStep"`, `"writeDbStep"` |
| `ItemReader<I>` | Reads one item at a time from a source | `FlatFileItemReader`, `JdbcPagingItemReader` |
| `ItemProcessor<I, O>` | Transforms/filters one item, returns null to skip | Validate, enrich, convert |
| `ItemWriter<O>` | Writes a list (chunk) of items to a destination | `JdbcBatchItemWriter`, `JpaItemWriter` |
| `JobLauncher` | Starts a Job with given `JobParameters` | Triggered by REST, `@Scheduled`, or CLI |
| `JobRepository` | Persists Job/Step execution state to a DB | Enables restart, monitoring, deduplication |
| `JobParameters` | Key-value pairs that make a Job run unique | `{"date":"2024-01-15","file":"/data/jan.csv"}` |

### JobRepository — the restart engine

The `JobRepository` is what makes Spring Batch fundamentally different from a loop. Before processing a single row, it writes to its metadata tables:

```
"Job 'invoiceJob' with parameters {month=2024-01} — STARTED at 02:00:00"
```

After every successful chunk commit:
```
"Step 'processInvoices' — processed 500 rows, last committed item index = 500"
```

On crash, a restart reads this metadata and resumes from the exact chunk boundary. Without `JobRepository`, there is no restart — it is mandatory.

```yaml
# application.yaml — Spring Boot 3.x auto-configures JobRepository with your datasource
spring:
  batch:
    jdbc:
      initialize-schema: always   # creates BATCH_* metadata tables on startup
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
```

:::tip Use a dedicated schema for batch metadata
In production, isolate batch metadata in its own schema or database to prevent it from polluting your application's tables:
```yaml
spring.batch.jdbc.table-prefix: BATCH_   # default — all metadata tables prefixed BATCH_
```
:::

---

## Chunk-Oriented Processing

Chunk processing is the heart of Spring Batch. Instead of processing one record at a time (full transaction per record) or all records at once (one giant transaction), it processes in configurable **chunks** — each chunk is one database transaction.

### The chunk lifecycle

```
┌─────────────────────────── One Transaction ──────────────────────────────┐
│                                                                           │
│  Read item 1 ──→ [item1]                                                  │
│  Read item 2 ──→ [item1, item2]                                           │
│  ...                                                                      │
│  Read item 100 ─→ [item1 ... item100]   ← chunk size reached             │
│                         │                                                 │
│                   ItemProcessor                                           │
│              (transforms each item)                                       │
│                         │                                                 │
│                   [output1 ... output100]                                 │
│                         │                                                 │
│                   ItemWriter                                              │
│              (bulk INSERT all 100 at once)                                │
│                         │                                                 │
│                   COMMIT ✅                                                │
└───────────────────────────────────────────────────────────────────────────┘
Repeat until ItemReader returns null (source exhausted)
```

**Key property:** if the `ItemWriter` throws an exception mid-chunk, the **entire chunk of 100 rolls back** — not the entire job. The job can then retry or skip that chunk and continue from the next one.

### Basic step configuration

```java
@Configuration
@EnableBatchProcessing
public class BatchConfig {

    @Bean
    public Step processCsvStep(JobRepository jobRepository,
                               PlatformTransactionManager txManager,
                               ItemReader<UserCsvDto>      reader,
                               ItemProcessor<UserCsvDto, UserEntity> processor,
                               ItemWriter<UserEntity>      writer) {
        return new StepBuilder("processCsvStep", jobRepository)
            .<UserCsvDto, UserEntity>chunk(100, txManager)  // chunk size = 100
            .reader(reader)
            .processor(processor)
            .writer(writer)
            .build();
    }

    @Bean
    public Job importUsersJob(JobRepository jobRepository, Step processCsvStep) {
        return new JobBuilder("importUsersJob", jobRepository)
            .start(processCsvStep)
            .build();
    }
}
```

### Choosing chunk size

| Dataset / Item type | Recommended chunk size | Why |
|--------------------|----------------------|-----|
| Small items (< 1 KB each), fast write | 500–1000 | More items per transaction = fewer commits |
| Medium items (~5 KB each) with DB write | 100–500 | Balance between commit frequency and memory |
| Large items (> 50 KB), complex processor | 10–50 | Avoid heap bloat; smaller transaction window |
| External API write (per-item HTTP call) | 1–10 | API latency dominates; small chunk = faster retry |
| Chunk with Async processor | 50–200 | Futures resolve concurrently; larger batch improves throughput |

:::warning The large chunk size trap
Setting `chunk(10_000)` to reduce commits sounds efficient but creates:
- A **long-running DB transaction** — locks rows/tables for seconds, causing deadlocks with live user traffic.
- **10,000 large objects in JVM heap simultaneously** — OutOfMemoryError risk.
- On failure, the entire 10,000-item chunk rolls back — losing more work and making retry more expensive.

**Rule of thumb:** start at 100, measure memory + throughput, tune upward cautiously.
:::

---

## ItemReader — Reading Data

`ItemReader<T>` reads one item per call. Spring Batch calls it repeatedly until it returns `null`, which signals the end of input.

<Tabs>
  <TabItem value="flatfile" label="CSV / Flat File">

```java
@Bean
public FlatFileItemReader<UserCsvDto> csvReader() {
    return new FlatFileItemReaderBuilder<UserCsvDto>()
        .name("userCsvReader")
        .resource(new FileSystemResource("/data/users.csv"))
        .delimited()
            .delimiter(",")
            .names("id", "firstName", "lastName", "email", "status")
        .targetType(UserCsvDto.class)
        .linesToSkip(1)                      // skip header row
        .encoding("UTF-8")
        .build();
}
```

**For very large files**, enable buffered reading:
```java
.bufferedReaderFactory((resource, encoding) ->
    new BufferedReader(new InputStreamReader(resource.getInputStream(), encoding), 65536))
```

  </TabItem>
  <TabItem value="jdbc-paging" label="JDBC Paging (thread-safe)">

```java
// JdbcPagingItemReader — thread-safe, recommended for multi-threaded steps
@Bean
public JdbcPagingItemReader<UserEntity> jdbcPagingReader(DataSource dataSource) {
    Map<String, Order> sortKeys = Map.of("id", Order.ASCENDING);

    return new JdbcPagingItemReaderBuilder<UserEntity>()
        .name("userPagingReader")
        .dataSource(dataSource)
        .selectClause("SELECT id, first_name, last_name, email, status")
        .fromClause("FROM users")
        .whereClause("WHERE status = 'PENDING' AND created_at < :cutoff")
        .parameterValues(Map.of("cutoff", LocalDate.now().minusDays(30)))
        .sortKeys(sortKeys)           // REQUIRED — deterministic ordering for paging
        .pageSize(100)                // fetches 100 rows per JDBC round trip
        .rowMapper(new BeanPropertyRowMapper<>(UserEntity.class))
        .build();
}
```

  </TabItem>
  <TabItem value="jdbc-cursor" label="JDBC Cursor (single-thread only)">

```java
// JdbcCursorItemReader — fastest for single-threaded steps; NOT thread-safe
@Bean
public JdbcCursorItemReader<UserEntity> jdbcCursorReader(DataSource dataSource) {
    return new JdbcCursorItemReaderBuilder<UserEntity>()
        .name("userCursorReader")
        .dataSource(dataSource)
        .sql("SELECT id, first_name, email FROM users WHERE status = 'PENDING'")
        .rowMapper(new BeanPropertyRowMapper<>(UserEntity.class))
        .fetchSize(100)               // JDBC prefetch batch size
        .build();
}
// ⚠️ Do NOT use this in a multi-threaded Step — multiple threads will read the same rows
```

  </TabItem>
  <TabItem value="jpa" label="JPA / Repository">

```java
@Bean
public RepositoryItemReader<User> jpaReader(UserRepository repo) {
    return new RepositoryItemReaderBuilder<User>()
        .name("userJpaReader")
        .repository(repo)
        .methodName("findByStatus")
        .arguments(List.of("PENDING"))
        .sorts(Map.of("id", Sort.Direction.ASC))  // required for stable paging
        .pageSize(100)
        .build();
}
```

  </TabItem>
  <TabItem value="composite" label="CompositeItemReader (multiple sources)">

```java
// Read from multiple sources sequentially in one Step
@Bean
public ItemReader<UserCsvDto> compositeReader() {
    SynchronizedItemStreamReader<UserCsvDto> reader1 =
        new SynchronizedItemStreamReader<>();
    reader1.setDelegate(csvReaderForFileA());

    SynchronizedItemStreamReader<UserCsvDto> reader2 =
        new SynchronizedItemStreamReader<>();
    reader2.setDelegate(csvReaderForFileB());

    return new CompositeItemStreamReader<>(List.of(reader1, reader2));
}
```

  </TabItem>
</Tabs>

### ItemReader comparison

| Reader | Thread-safe | Use for | Notes |
|--------|:-----------:|---------|-------|
| `FlatFileItemReader` | ❌ | CSV, fixed-width, delimited files | Wrap with `SynchronizedItemStreamReader` for multi-thread |
| `JdbcCursorItemReader` | ❌ | Large DB reads, single-threaded steps | Fastest; holds open DB cursor |
| `JdbcPagingItemReader` | ✅ | DB reads in multi-threaded steps | Uses `LIMIT/OFFSET`; requires stable sort key |
| `JpaPagingItemReader` | ✅ | JPA entity reads | Manages its own EntityManager per page |
| `RepositoryItemReader` | ✅ | Spring Data repositories | Convenient; less control over SQL |
| `JsonItemReader` | ❌ | JSON array files | Jackson-based |
| `AxonFrameworkEventReader` | N/A | Event store replay | Specialised |

---

## ItemProcessor — Transforming Data

`ItemProcessor<I, O>` receives one item, returns the transformed output, or returns `null` to **filter** (skip) the item without counting it as an error.

```java
@Component
public class UserProcessor implements ItemProcessor<UserCsvDto, UserEntity> {

    @Override
    public UserEntity process(UserCsvDto csv) throws Exception {
        // Return null to silently filter this item — it will not be passed to the writer
        if (csv.getEmail() == null || !csv.getEmail().contains("@")) {
            log.warn("Filtering invalid email for user id={}", csv.getId());
            return null;   // ← filtered item
        }

        return UserEntity.builder()
            .externalId(csv.getId())
            .firstName(csv.getFirstName().trim())
            .lastName(csv.getLastName().trim())
            .email(csv.getEmail().toLowerCase())
            .status(Status.PENDING)
            .importedAt(Instant.now())
            .build();
    }
}
```

### CompositeItemProcessor — chaining processors

When transformation has multiple distinct stages, compose them rather than building one monolithic processor:

```java
@Bean
public CompositeItemProcessor<UserCsvDto, UserEntity> compositeProcessor(
        ValidationProcessor validationProcessor,
        EnrichmentProcessor enrichmentProcessor,
        MappingProcessor    mappingProcessor) {

    CompositeItemProcessor<UserCsvDto, UserEntity> processor = new CompositeItemProcessor<>();
    processor.setDelegates(List.of(
        validationProcessor,   // Stage 1: validate fields
        enrichmentProcessor,   // Stage 2: call external API to enrich
        mappingProcessor       // Stage 3: map to entity
    ));
    return processor;
}
```

---

## ItemWriter — Writing Data

`ItemWriter<T>` receives a **`Chunk<T>`** (the full list of processed items) and writes them all at once. This is where bulk INSERT happens.

<Tabs>
  <TabItem value="jdbc" label="JDBC Batch Writer">

```java
@Bean
public JdbcBatchItemWriter<UserEntity> jdbcWriter(DataSource dataSource) {
    return new JdbcBatchItemWriterBuilder<UserEntity>()
        .dataSource(dataSource)
        .sql("""
            INSERT INTO users (external_id, first_name, last_name, email, status, imported_at)
            VALUES (:externalId, :firstName, :lastName, :email, :status, :importedAt)
            ON CONFLICT (external_id) DO UPDATE
              SET first_name  = EXCLUDED.first_name,
                  last_name   = EXCLUDED.last_name,
                  status      = EXCLUDED.status
            """)
        .beanMapped()    // maps named SQL params to entity field names
        .assertUpdates(false)  // set true to fail if a row wasn't inserted/updated
        .build();
}
```

  </TabItem>
  <TabItem value="jpa" label="JPA Writer">

```java
@Bean
public JpaItemWriter<UserEntity> jpaWriter(EntityManagerFactory emf) {
    JpaItemWriter<UserEntity> writer = new JpaItemWriter<>();
    writer.setEntityManagerFactory(emf);
    // Uses EntityManager.merge() — handles insert and update automatically
    // Warning: triggers dirty checking per entity — slower than JdbcBatchItemWriter
    return writer;
}
```

  </TabItem>
  <TabItem value="file" label="Flat File Writer">

```java
@Bean
public FlatFileItemWriter<UserEntity> csvWriter() {
    return new FlatFileItemWriterBuilder<UserEntity>()
        .name("userCsvWriter")
        .resource(new FileSystemResource("/output/users-processed.csv"))
        .delimited()
            .delimiter(",")
            .names("id", "firstName", "email", "status")
        .headerCallback(w -> w.write("id,firstName,email,status"))
        .shouldDeleteIfExists(true)
        .build();
}
```

  </TabItem>
  <TabItem value="composite" label="CompositeItemWriter (multiple targets)">

```java
// Write to two destinations in one chunk — both succeed or both roll back
@Bean
public CompositeItemWriter<UserEntity> compositeWriter(
        JdbcBatchItemWriter<UserEntity> dbWriter,
        FlatFileItemWriter<UserEntity>  auditWriter) {

    CompositeItemWriter<UserEntity> writer = new CompositeItemWriter<>();
    writer.setDelegates(List.of(dbWriter, auditWriter));
    return writer;
}
```

  </TabItem>
</Tabs>

---

## Multi-Step Jobs and Flow Control

A `Job` can contain multiple `Step`s executed conditionally based on the outcome of previous steps.

### Sequential steps

```java
@Bean
public Job etlJob(JobRepository repo, Step extract, Step transform, Step load) {
    return new JobBuilder("etlJob", repo)
        .start(extract)
        .next(transform)
        .next(load)
        .build();
}
```

### Conditional flow with exit codes

```java
@Bean
public Job conditionalJob(JobRepository repo,
                           Step validateStep,
                           Step processStep,
                           Step errorReportStep) {
    return new JobBuilder("conditionalJob", repo)
        .start(validateStep)
            .on("FAILED")   .to(errorReportStep)  // if validate fails → report
            .on("COMPLETED").to(processStep)       // if validate passes → process
        .from(processStep)
            .on("*")        .end()                 // any outcome → done
        .from(errorReportStep)
            .on("*")        .fail()                // mark Job as FAILED after report
        .build();
}
```

### JobParameters — making runs unique

Every `JobInstance` is uniquely identified by `Job name + JobParameters`. Running the same job with the same parameters twice is rejected (idempotency guard):

```java
// Launching a job programmatically
@Service
public class BatchLaunchService {

    @Autowired private JobLauncher jobLauncher;
    @Autowired private Job importUsersJob;

    public void launch(String filePath) throws Exception {
        JobParameters params = new JobParametersBuilder()
            .addString("filePath", filePath)
            .addLocalDateTime("runAt", LocalDateTime.now()) // makes it unique per run
            .toJobParameters();

        JobExecution execution = jobLauncher.run(importUsersJob, params);
        log.info("Job status: {}", execution.getStatus());
    }
}
```

---

## Fault Tolerance — Skip and Retry

### Skip — ignore bad records

```java
@Bean
public Step tolerantStep(JobRepository repo, PlatformTransactionManager tx) {
    return new StepBuilder("tolerantStep", repo)
        .<UserCsvDto, UserEntity>chunk(100, tx)
        .reader(reader())
        .processor(processor())
        .writer(writer())
        .faultTolerant()
            .skipLimit(50)                                  // allow up to 50 skipped items total
            .skip(ValidationException.class)                // skip on validation error
            .skip(DataIntegrityViolationException.class)    // skip on DB constraint violation
            .noSkip(FileNotFoundException.class)            // never skip — always fail
        .build();
}
```

**Skip lifecycle:** when an exception matches the skip list, Spring Batch retries the chunk item-by-item (binary search isolation). The offending item is skipped, the rest of the chunk is committed normally.

### SkipListener — log what you skipped

```java
@Component
public class UserSkipListener implements SkipListener<UserCsvDto, UserEntity> {

    @Override
    public void onSkipInRead(Throwable t) {
        log.warn("Skipped during READ: {}", t.getMessage());
    }

    @Override
    public void onSkipInProcess(UserCsvDto item, Throwable t) {
        log.warn("Skipped during PROCESS: item={}, reason={}", item.getId(), t.getMessage());
    }

    @Override
    public void onSkipInWrite(UserEntity item, Throwable t) {
        log.warn("Skipped during WRITE: entity={}, reason={}", item.getExternalId(), t.getMessage());
        // Write to a dead-letter table for manual review
        deadLetterRepository.save(new DeadLetter(item, t.getMessage()));
    }
}

// Register on the step:
.faultTolerant()
.skipLimit(50)
.skip(ValidationException.class)
.listener(userSkipListener)
```

### Retry — transient failures

Use retry for **transient** failures where the same operation may succeed on a second attempt (network blip, optimistic lock, temporary API rate limit):

```java
.faultTolerant()
    .retryLimit(3)                          // up to 3 attempts per item
    .retry(OptimisticLockingFailureException.class)
    .retry(ResourceAccessException.class)   // RestTemplate / network timeout
    .noRetry(DataIntegrityViolationException.class)  // don't retry constraint violations
    .backOffPolicy(new ExponentialBackOffPolicy())    // wait 1s, 2s, 4s between retries
```

### Skip vs Retry — when to use each

| | Skip | Retry |
|-|------|-------|
| **Use for** | Permanently bad data (invalid email, corrupt row) | Transient failures (network, lock contention) |
| **Outcome** | Item is discarded | Same item is re-attempted |
| **Audit** | Log to dead-letter table | Log retry attempts |
| **Example exception** | `ValidationException`, `DataIntegrityViolationException` | `ResourceAccessException`, `OptimisticLockingFailureException` |

---

## Listeners — Hooks into the Job Lifecycle

```java
@Component
public class JobCompletionListener implements JobExecutionListener {

    @Override
    public void beforeJob(JobExecution jobExecution) {
        log.info("Job '{}' starting with params: {}",
            jobExecution.getJobInstance().getJobName(),
            jobExecution.getJobParameters());
    }

    @Override
    public void afterJob(JobExecution jobExecution) {
        if (jobExecution.getStatus() == BatchStatus.COMPLETED) {
            log.info("Job completed. Items: read={}, written={}, skipped={}",
                jobExecution.getStepExecutions().stream()
                    .mapToLong(s -> s.getReadCount()).sum(),
                jobExecution.getStepExecutions().stream()
                    .mapToLong(s -> s.getWriteCount()).sum(),
                jobExecution.getStepExecutions().stream()
                    .mapToLong(s -> s.getSkipCount()).sum());
        } else {
            log.error("Job FAILED: {}", jobExecution.getFailureExceptions());
            alertService.notifyJobFailure(jobExecution);
        }
    }
}

// Register on the job:
@Bean
public Job importJob(JobRepository repo, Step step, JobCompletionListener listener) {
    return new JobBuilder("importJob", repo)
        .listener(listener)
        .start(step)
        .build();
}
```

---

## Scaling Patterns

A single-threaded job reading 50 million rows with a 200ms processor per item takes 115 days. Senior engineers know when and how to scale.

### Pattern 1 — Multi-threaded Step

Run multiple threads executing the chunk lifecycle in parallel within a single step. Each thread reads → processes → writes its own chunk independently.

```java
@Bean
public Step multiThreadedStep(JobRepository repo, PlatformTransactionManager tx) {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(4);
    executor.setMaxPoolSize(8);
    executor.setQueueCapacity(25);
    executor.setThreadNamePrefix("batch-worker-");
    executor.initialize();

    return new StepBuilder("multiThreadedStep", repo)
        .<UserCsvDto, UserEntity>chunk(100, tx)
        .reader(synchronizedReader())     // ← MUST be thread-safe
        .processor(processor())           // stateless — thread-safe by default
        .writer(writer())                 // JdbcBatchItemWriter is thread-safe
        .taskExecutor(executor)
        .throttleLimit(4)                 // max concurrent chunks
        .build();
}

// CRITICAL: wrap non-thread-safe readers
@Bean
public SynchronizedItemStreamReader<UserCsvDto> synchronizedReader() {
    SynchronizedItemStreamReader<UserCsvDto> reader = new SynchronizedItemStreamReader<>();
    reader.setDelegate(csvReader());      // FlatFileItemReader is NOT thread-safe
    return reader;
}
```

:::danger Thread-safety of ItemReader is the most common multi-threaded mistake
`FlatFileItemReader` and `JdbcCursorItemReader` are **not thread-safe** — multiple threads will read the same rows or corrupt the file position. Always use `SynchronizedItemStreamReader` for file readers, or switch to `JdbcPagingItemReader` (inherently thread-safe) for database readers.
:::

### Pattern 2 — AsyncItemProcessor / AsyncItemWriter

The processor submits work to a thread pool and immediately returns a `Future<O>`. The `AsyncItemWriter` waits for all futures in the chunk to resolve, then bulk-writes. Ideal when the processor makes slow external API calls.

```java
@Bean
public AsyncItemProcessor<UserCsvDto, UserEntity> asyncProcessor(
        UserProcessor delegate,
        ThreadPoolTaskExecutor executor) {

    AsyncItemProcessor<UserCsvDto, UserEntity> async = new AsyncItemProcessor<>();
    async.setDelegate(delegate);
    async.setTaskExecutor(executor);
    return async;
}

@Bean
public AsyncItemWriter<UserEntity> asyncWriter(JdbcBatchItemWriter<UserEntity> delegate) {
    AsyncItemWriter<UserEntity> async = new AsyncItemWriter<>();
    async.setDelegate(delegate);
    return async;
}

@Bean
public Step asyncProcessingStep(JobRepository repo, PlatformTransactionManager tx) {
    return new StepBuilder("asyncStep", repo)
        .<UserCsvDto, Future<UserEntity>>chunk(100, tx)  // note: Future<> generic type
        .reader(reader())
        .processor(asyncProcessor(...))
        .writer(asyncWriter(...))
        .build();
}
```

**Throughput model:**

```
Sync:  100 items × 200ms/item = 20 seconds per chunk
Async (10 threads): 100 items / 10 threads × 200ms = 2 seconds per chunk  → 10× faster
```

### Pattern 3: Partitioning

Partitioning splits a dataset into non-overlapping **partitions** and assigns each to an independent **worker step**. Workers execute fully in parallel — either on the same JVM (local) or across multiple servers (remote).

#### How partitioning works

```
Master Step (Partitioner)
    │
    ├── Partition 1: user_id 1–100,000        → Worker Step 1
    ├── Partition 2: user_id 100,001–200,000  → Worker Step 2
    ├── Partition 3: user_id 200,001–300,000  → Worker Step 3
    └── Partition 4: user_id 300,001–400,000  → Worker Step 4
                                                (all run in parallel)
```

#### Local partitioning (same JVM)

```java
// Step 1: Define how to split the dataset
@Component
public class UserPartitioner implements Partitioner {

    @Autowired private JdbcTemplate jdbcTemplate;

    @Override
    public Map<String, ExecutionContext> partition(int gridSize) {
        Long minId = jdbcTemplate.queryForObject("SELECT MIN(id) FROM users", Long.class);
        Long maxId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM users", Long.class);
        long rangeSize = (maxId - minId) / gridSize + 1;

        Map<String, ExecutionContext> partitions = new HashMap<>();
        for (int i = 0; i < gridSize; i++) {
            long start = minId + (i * rangeSize);
            long end   = Math.min(start + rangeSize - 1, maxId);

            ExecutionContext ctx = new ExecutionContext();
            ctx.putLong("minId", start);
            ctx.putLong("maxId", end);
            partitions.put("partition-" + i, ctx);
        }
        return partitions;  // e.g. {partition-0: {minId:1, maxId:100000}, ...}
    }
}

// Step 2: Worker step reads only its assigned partition range
@Bean
@StepScope  // CRITICAL — new instance per partition execution context
public JdbcPagingItemReader<UserEntity> partitionedReader(
        DataSource ds,
        @Value("#{stepExecutionContext['minId']}") Long minId,
        @Value("#{stepExecutionContext['maxId']}") Long maxId) {

    return new JdbcPagingItemReaderBuilder<UserEntity>()
        .name("partitionedUserReader")
        .dataSource(ds)
        .selectClause("SELECT *")
        .fromClause("FROM users")
        .whereClause("WHERE id >= :minId AND id <= :maxId")
        .parameterValues(Map.of("minId", minId, "maxId", maxId))
        .sortKeys(Map.of("id", Order.ASCENDING))
        .pageSize(100)
        .rowMapper(new BeanPropertyRowMapper<>(UserEntity.class))
        .build();
}

// Step 3: Wire the master + worker steps
@Bean
public Step workerStep(JobRepository repo, PlatformTransactionManager tx) {
    return new StepBuilder("workerStep", repo)
        .<UserEntity, UserEntity>chunk(100, tx)
        .reader(partitionedReader(null, null, null))  // Spring injects at runtime
        .processor(processor())
        .writer(writer())
        .build();
}

@Bean
public Step masterStep(JobRepository repo, UserPartitioner partitioner) {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(4);
    executor.initialize();

    return new StepBuilder("masterStep", repo)
        .partitioner("workerStep", partitioner)
        .step(workerStep(null, null))
        .gridSize(4)              // 4 partitions → 4 worker threads
        .taskExecutor(executor)
        .build();
}
```

#### Remote partitioning (across servers)

For truly massive datasets (hundreds of millions of rows), distribute worker steps across multiple server instances via a message queue:

```
Master (Server A)          Message Queue (RabbitMQ / Kafka)
    │                              │
    ├── Partition 1 message ──→   ├──→ Worker Server B processes partition 1
    ├── Partition 2 message ──→   ├──→ Worker Server C processes partition 2
    ├── Partition 3 message ──→   ├──→ Worker Server D processes partition 3
    └── Partition 4 message ──→   └──→ Worker Server E processes partition 4
```

```yaml
# Requires spring-batch-integration dependency
spring:
  batch:
    remote-partitioning:
      polling-interval: 1000ms
```

### Scaling pattern comparison

| Pattern | Complexity | Best for | Limitation |
|---------|-----------|---------|-----------|
| Single-threaded | Low | < 1M simple records | Bottleneck at slow processors |
| Multi-threaded Step | Medium | I/O-bound reads + fast processor | Reader must be thread-safe |
| AsyncItemProcessor | Medium | Heavy external API calls in processor | Complex Future generics |
| Local Partitioning | High | 1M–100M records, single server | Limited by one JVM's threads |
| Remote Partitioning | Very high | 100M+ records, multiple servers | Requires messaging infrastructure |

---

## Chunk Transaction Boundaries

Understanding what happens at the JVM and database level during a chunk transaction is essential for diagnosing performance problems.

### What a chunk transaction controls

```
BEGIN TRANSACTION
│
├─ JDBC batch INSERT (100 rows) ─→ table-level lock held
│
├─ BATCH_STEP_EXECUTION UPDATE ─→ "commit count = N" recorded in JobRepository
│
COMMIT
│
└─ Lock released — live user traffic can proceed
```

**Lock duration** = time to process 100 items + time to bulk INSERT them. A chunk of 1000 items with a slow processor holds locks for 10× longer, blocking concurrent user writes to the same table.

### Transaction isolation and batch conflicts

```java
// If batch writes to a table that live users also write to,
// consider running batch in READ COMMITTED (default) not REPEATABLE READ
@Bean
public Step stepWithExplicitIsolation(JobRepository repo) {
    DefaultTransactionAttribute attr = new DefaultTransactionAttribute();
    attr.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
    attr.setTimeout(30);  // fail if transaction takes > 30 seconds

    return new StepBuilder("step", repo)
        .<In, Out>chunk(100, transactionManager)
        .reader(reader())
        .writer(writer())
        .transactionAttribute(attr)
        .build();
}
```

### The optimal chunk size formula

```
Target chunk duration = 1–5 seconds (keeps locks short, throughput high)

Chunk size = (Target duration in seconds × Items per second)

Example:
  Processor speed: 500 items/sec
  Writer speed: 2000 items/sec  → bottleneck is processor at 500/sec
  Target duration: 2 seconds
  → Chunk size = 500 × 2 = 1000 items

  BUT: if each item is 5 KB:
  → 1000 × 5 KB = 5 MB in heap per chunk thread
  → With 4 threads: 20 MB — acceptable
  → With 20 MB items: 1000 × 20 MB = 20 GB — OutOfMemoryError → reduce chunk size
```

---

## Production Patterns

<details>
<summary>🔬 Senior deep-dive: @StepScope and @JobScope</summary>

`@StepScope` creates a new bean instance per Step execution, injecting the current `StepExecutionContext` into it. This is **mandatory** for partitioned readers (each worker needs its own reader with its own ID range):

```java
@Bean
@StepScope  // ← creates one instance per step execution
public FlatFileItemReader<UserCsvDto> scopedReader(
        @Value("#{jobParameters['filePath']}") String filePath) {
    // filePath is injected from JobParameters at runtime — not at bean creation
    return new FlatFileItemReaderBuilder<UserCsvDto>()
        .resource(new FileSystemResource(filePath))
        .build();
}
```

Without `@StepScope`, `@Value("#{jobParameters[...]}")` is resolved at application startup — before any Job has run — and the value is `null`.

**`@JobScope`** is similar but scoped to the entire Job execution rather than a single Step. Use it for beans that must be shared across all steps of one job run but recreated for each new job run.

</details>

<details>
<summary>🔬 Senior deep-dive: idempotency and re-runnability</summary>

Spring Batch prevents re-running a completed `JobInstance` by default — the same job name + same parameters = "already done". But real production systems must handle re-runs:

**Strategy 1: Include a unique run timestamp in parameters**
```java
new JobParametersBuilder()
    .addString("file", "/data/users.csv")
    .addLocalDateTime("runAt", LocalDateTime.now())  // unique per trigger
    .toJobParameters();
```
Downside: every trigger is a new instance — you lose the "don't run the same file twice" protection.

**Strategy 2: Make the processor idempotent using `ON CONFLICT`**
```sql
INSERT INTO users (external_id, ...)
VALUES (...)
ON CONFLICT (external_id) DO UPDATE SET ...
```
Now re-running the same file is safe — duplicate rows update rather than fail.

**Strategy 3: Explicit deduplication check**
```java
@Override
public UserEntity process(UserCsvDto csv) {
    if (userRepository.existsByExternalId(csv.getId())) {
        return null;  // skip — already imported
    }
    return mapper.toEntity(csv);
}
```

</details>

<details>
<summary>🔬 Senior deep-dive: monitoring with Actuator and Micrometer</summary>

Spring Batch exposes metrics automatically via Micrometer when `spring-boot-actuator` is on the classpath:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, batch
  metrics:
    tags:
      application: my-batch-app
```

**Key metrics to monitor:**

| Metric | Alert condition |
|--------|----------------|
| `spring.batch.job.duration` | > expected SLA (e.g. must finish before 6 AM) |
| `spring.batch.step.duration` | Sudden spike → processor bottleneck |
| `spring.batch.chunk.write.duration` | Spike → DB write contention or lock |
| `spring.batch.item.skip.count` | Rising → data quality degradation |
| `hikaricp.connections.pending` | > 0 sustained → connection pool pressure from batch |

```java
// Custom metric: track business-level KPI alongside technical metrics
@Component
public class BatchMetricsListener implements StepExecutionListener {

    @Autowired private MeterRegistry meterRegistry;

    @Override
    public void afterStep(StepExecution stepExecution) {
        meterRegistry.counter("batch.users.imported",
                "job", stepExecution.getJobExecution().getJobInstance().getJobName(),
                "status", stepExecution.getStatus().name())
            .increment(stepExecution.getWriteCount());
    }
}
```

</details>

<details>
<summary>🔬 Senior deep-dive: JDBC batch performance tuning</summary>

Even with `JdbcBatchItemWriter`, writes can be slow if JDBC batching is not enabled at the driver level:

```yaml
# application.yaml — enable JDBC batching for PostgreSQL and MySQL
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb?reWriteBatchedInserts=true
    # PostgreSQL: reWriteBatchedInserts=true rewrites N individual INSERTs
    # into one multi-row INSERT — 3–5× faster

  jpa:
    properties:
      hibernate:
        jdbc.batch_size: 100           # must match chunk size
        order_inserts: true            # group same-table inserts together
        order_updates: true
        generate_statistics: false     # turn off in production
```

**Batch INSERT performance comparison (10,000 rows, PostgreSQL):**

| Approach | Time |
|---------|------|
| 10,000 individual INSERTs | ~8 seconds |
| `JdbcBatchItemWriter` without `reWriteBatchedInserts` | ~3 seconds |
| `JdbcBatchItemWriter` + `reWriteBatchedInserts=true` | ~0.4 seconds |
| `COPY FROM` (PostgreSQL native bulk load) | ~0.1 seconds |

For absolute maximum throughput, bypass `JdbcBatchItemWriter` and use PostgreSQL's `COPY` command via a custom writer:

```java
@Component
public class PostgresCopyWriter implements ItemWriter<UserEntity> {

    @Autowired private DataSource dataSource;

    @Override
    public void write(Chunk<? extends UserEntity> chunk) throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            CopyManager cm = ((PGConnection) conn.unwrap(Connection.class)).getCopyAPI();
            StringBuilder sb = new StringBuilder();
            for (UserEntity u : chunk) {
                sb.append(u.getExternalId()).append('\t')
                  .append(u.getEmail()).append('\n');
            }
            cm.copyIn("COPY users(external_id, email) FROM STDIN", 
                      new StringReader(sb.toString()));
        }
    }
}
```

</details>

---

## Testing Spring Batch Jobs

```java
@SpringBatchTest          // provides JobLauncherTestUtils, JobRepositoryTestUtils
@SpringBootTest
@ActiveProfiles("test")
class ImportUsersJobTest {

    @Autowired private JobLauncherTestUtils jobLauncherTestUtils;
    @Autowired private JobRepositoryTestUtils jobRepositoryTestUtils;
    @Autowired private UserRepository userRepository;

    @BeforeEach
    void cleanBatchMetadata() {
        // Remove previous job executions from in-memory H2 so tests don't conflict
        jobRepositoryTestUtils.removeJobExecutions();
    }

    @Test
    void importUsersJob_completes_and_persists_users() throws Exception {
        // Provide job parameters (e.g. point to a test CSV file)
        JobParameters params = new JobParametersBuilder()
            .addString("filePath", "classpath:test-data/users.csv")
            .addLocalDateTime("runAt", LocalDateTime.now())
            .toJobParameters();

        JobExecution execution = jobLauncherTestUtils.launchJob(params);

        // Assert job status
        assertThat(execution.getStatus()).isEqualTo(BatchStatus.COMPLETED);

        // Assert step metrics
        StepExecution stepExecution = execution.getStepExecutions().iterator().next();
        assertThat(stepExecution.getReadCount()).isEqualTo(5);
        assertThat(stepExecution.getWriteCount()).isEqualTo(4);  // 1 filtered by processor
        assertThat(stepExecution.getSkipCount()).isEqualTo(0);

        // Assert business outcome
        assertThat(userRepository.count()).isEqualTo(4);
        assertThat(userRepository.findByEmail("alice@example.com")).isPresent();
    }

    @Test
    void importUsersJob_skips_invalid_rows_and_completes() throws Exception {
        JobParameters params = new JobParametersBuilder()
            .addString("filePath", "classpath:test-data/users-with-corrupt-rows.csv")
            .addLocalDateTime("runAt", LocalDateTime.now())
            .toJobParameters();

        JobExecution execution = jobLauncherTestUtils.launchJob(params);

        assertThat(execution.getStatus()).isEqualTo(BatchStatus.COMPLETED);

        StepExecution step = execution.getStepExecutions().iterator().next();
        assertThat(step.getSkipCount()).isGreaterThan(0);
        assertThat(step.getWriteCount()).isGreaterThan(0);  // some rows still succeeded
    }

    @Test
    void testStepInIsolation() throws Exception {
        // Test a single step without running the full job
        JobExecution execution = jobLauncherTestUtils.launchStep("processCsvStep");
        assertThat(execution.getStatus()).isEqualTo(BatchStatus.COMPLETED);
    }
}
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `JdbcCursorItemReader` in a multi-threaded Step | Multiple threads read the same row — data corruption | Use `JdbcPagingItemReader` or wrap with `SynchronizedItemStreamReader` |
| `FlatFileItemReader` in a multi-threaded Step | Concurrent file position access — corrupted reads | Wrap with `SynchronizedItemStreamReader` |
| Missing `@StepScope` on partitioned readers | All workers share one reader instance — same ID range processed by all | Add `@StepScope` and use `@Value("#{stepExecutionContext[...]}")` |
| Very large chunk size (> 1000) for complex items | OOM risk; long-held DB locks causing deadlocks with live traffic | Tune to 100–500; measure heap per item |
| `@Modifying` bulk updates inside a Step processor | Bypasses L1 cache — stale entity reads after bulk update | Use `clearAutomatically = true` or avoid mixing bulk DML with entity reads |
| Re-running a job with identical parameters | Spring Batch rejects it — `JobInstanceAlreadyCompleteException` | Add a unique `runAt` timestamp parameter or use `JobParametersIncrementer` |
| No `SkipListener` with `skipLimit` | Skipped items are silently discarded — no audit trail | Always add a `SkipListener` that writes to a dead-letter table |
| Not enabling `reWriteBatchedInserts` (PostgreSQL) | Individual INSERT per row despite using batch writer — 10× slower | Add `reWriteBatchedInserts=true` to the JDBC URL |

---

## 🎯 Interview Questions

**Q1. What is Spring Batch and how does it differ from `@Scheduled` tasks?**
> `@Scheduled` is a trigger mechanism — it runs a method at a time interval. Spring Batch is a processing engine for large-volume data with built-in chunk transactions, restartability, skip/retry, and execution metadata. `@Scheduled` can *trigger* a Spring Batch job, but Spring Batch does the actual work. A `@Scheduled` method that loops over a million records has no transaction management, no progress tracking, and no restart capability — if it crashes at item 900,000 you start from zero.

**Q2. What is chunk-oriented processing and why is it better than processing one record at a time?**
> Chunk processing groups N records into one database transaction. One-at-a-time processing means one commit per record — 1 million records = 1 million commits, each with transaction overhead. One-giant-transaction means locking the table for the entire job duration and losing all work on failure. Chunking is the middle ground: every N records commit together — fewer commits than per-record, shorter lock windows than one transaction, and on failure only the current chunk rolls back, not the entire job.

**Q3. What is the JobRepository and why is it mandatory?**
> The `JobRepository` persists Job and Step execution metadata to a relational database. Before processing starts, it records the Job instance and parameters. After every successful chunk, it updates the Step's commit count. On restart after a crash, Spring Batch reads this metadata to know exactly which chunk committed last and resumes from there. Without it there is no restart, no deduplication (running the same job twice), and no execution history.

**Q4. Why can't you use `JdbcCursorItemReader` in a multi-threaded Step?**
> `JdbcCursorItemReader` holds a single JDBC `ResultSet` cursor on a database connection. The cursor has a current position (the next row to return). Multiple threads calling `read()` concurrently will advance the same cursor — some threads will read the same row, others will skip rows, producing duplicate and missing data. The fix is `JdbcPagingItemReader` (uses independent `LIMIT/OFFSET` queries per call — inherently thread-safe) or wrapping with `SynchronizedItemStreamReader` (serialises all read calls with a lock).

**Q5. Explain partitioning and when you would use it over a multi-threaded Step.**
> Partitioning splits a dataset into non-overlapping ranges and assigns each to an independent worker step with its own reader, processor, and writer. A multi-threaded Step runs multiple threads sharing one reader on the same JVM. Partitioning is used when: (1) the dataset is so large that one JVM's thread count isn't enough, (2) you need remote partitioning across multiple servers for horizontal scaling, or (3) the ItemReader is not safely shareable across threads and partitioning is cleaner than synchronization. Each worker in a partitioned step is a completely independent processing unit with its own transaction boundary.

**Q6. (Senior) What is the risk of a large chunk size, and how do you determine the optimal value?**
> Large chunk sizes hold a database transaction open for longer — increasing lock contention with concurrent user traffic and risking deadlocks. They also load more objects into the JVM heap simultaneously — risking OutOfMemoryError for large objects. Optimal chunk size depends on: (1) item size in bytes (smaller items → larger chunks), (2) processor speed (slower processor → smaller chunks to reduce lock duration), (3) acceptable lock duration (target 1–5 seconds per chunk). Start at 100, measure heap usage per thread × number of threads, and tune upward while monitoring P99 write latency on the target table.

**Q7. (Senior) How does `AsyncItemProcessor` improve throughput, and what is its trade-off?**
> `AsyncItemProcessor` submits each item to a thread pool and returns a `Future<O>` immediately — the calling thread then moves on to submit the next item rather than blocking. The `AsyncItemWriter` receives a chunk of `Future`s, waits for all to resolve, and bulk-writes the results. This parallelises the processor stage — 100 items with a 200ms API call each take 20 seconds synchronously but ~2 seconds with a 10-thread pool (10× improvement). Trade-offs: the generic type becomes `Future<O>` which complicates wiring; if any future in a chunk throws, the entire chunk fails; and thread pool size must be tuned against the external dependency's rate limits and your connection pool capacity.

---

## See Also

- [Spring Data JPA: Custom Queries with @Query](./spring-data-jpa-custom-query.md)
- [Spring Exception Handling — @RestControllerAdvice](./spring-exception-handling.md)
- [HikariCP Connection Pool Tuning](./jpa-vs-hibernate.md#1-connection-pool-exhaustion-hikaricp)
- [Database Transaction Management](./spring-data-jpa-transactions.md)