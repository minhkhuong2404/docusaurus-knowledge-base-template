---
id: long-running-tasks
title: Managing Long-Running Tasks
sidebar_label: Long-Running Tasks
description: A complete guide to managing async long-running operations — from the core async job pattern for beginners to task state machines, worker reliability, distributed scheduling, SSE/WebSocket progress, and production observability for senior engineers.
tags: [async, job-queue, background-tasks, polling, webhooks, progress-tracking, scheduling, system-design]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CoreAsyncJobPatternDiagram from '@site/src/components/CoreAsyncJobPatternDiagram';
import JobQueueArchitectureDiagram from '@site/src/components/JobQueueArchitectureDiagram';
import TaskStateMachineDiagram from '@site/src/components/TaskStateMachineDiagram';
import WebhookDeliveryDiagram from '@site/src/components/WebhookDeliveryDiagram';

# Managing Long-Running Tasks

:::info[Who this guide is for]
- **New learners** — start at [Why Long-Running Tasks Need Special Handling](#why-long-running-tasks-need-special-handling) and [The Core Async Job Pattern](#the-core-async-job-pattern) to understand the fundamental approach.
- **Senior engineers** — jump to [Task State Machine](#task-state-machine), [Worker Reliability & Exactly-Once Processing](#worker-reliability--exactly-once-processing), [Distributed Scheduling](#distributed-scheduling), or [Production Observability](#production-observability).
:::

---

## Why Long-Running Tasks Need Special Handling

HTTP is designed for **short request-response cycles**. A typical Nginx timeout is 60 seconds, an AWS ALB times out at 60 seconds, and a client's browser may abort after 30–60 seconds.

Operations that take more than 2–5 seconds — video transcoding, PDF generation, bulk data exports, ML inference, email campaigns — **cannot safely run inside an HTTP request handler** because:

1. **Thread exhaustion** — each blocked HTTP thread cannot serve other requests, causing your server to saturate under concurrent long operations.
2. **Client-side timeouts** — the client will give up and retry, potentially triggering duplicate processing.
3. **Load balancer timeouts** — the connection is terminated by infrastructure even if the server hasn't finished.
4. **No progress visibility** — the client sees nothing until the operation completes or fails.
5. **No retry safety** — if the server crashes mid-operation, there's no record of what state things are in.

:::note[The rule of thumb]
Any operation expected to take more than **2 seconds** should be made asynchronous.
:::

---

## The Core Async Job Pattern

The solution is a three-step pattern:

<CoreAsyncJobPatternDiagram />

### HTTP Status Codes

| Status | When to Use |
|:---|:---|
| `202 Accepted` | Job submitted successfully, processing not yet complete |
| `200 OK` | Job status or completed result returned in body |
| `303 See Other` | Redirect to the result resource (on completion) |
| `404 Not Found` | Job ID does not exist |
| `410 Gone` | Job result has expired and been cleaned up |

---

## REST API Design for Async Jobs

```java
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final JobService jobService;

    // Step 1: Submit job — returns immediately with 202
    @PostMapping
    public ResponseEntity<JobResponse> submitReport(@RequestBody @Valid ReportRequest req,
                                                     Authentication auth) {
        String jobId = jobService.submit(req, auth.getName());
        String statusUrl = "/api/reports/" + jobId;

        log.info("Report job {} submitted for user {}", jobId, auth.getName());

        return ResponseEntity
            .accepted()
            .header("Location", statusUrl)        // RFC-compliant: Location points to status
            .header("Retry-After", "5")           // Hint to client: poll after 5s
            .body(new JobResponse(jobId, JobStatus.PENDING, statusUrl));
    }

    // Step 2: Poll status
    @GetMapping("/{jobId}")
    public ResponseEntity<JobStatusResponse> getStatus(@PathVariable String jobId,
                                                        Authentication auth) {
        Job job = jobService.findByIdAndUser(jobId, auth.getName())
            .orElseThrow(() -> new JobNotFoundException(jobId));

        return switch (job.getStatus()) {
            case PENDING, QUEUED -> ResponseEntity.ok()
                .header("Retry-After", "3")  // poll again in 3s
                .body(JobStatusResponse.pending(job));

            case RUNNING -> ResponseEntity.ok()
                .header("Retry-After", "1")  // job is active — poll more frequently
                .body(JobStatusResponse.running(job));

            case COMPLETED -> ResponseEntity.status(HttpStatus.SEE_OTHER)
                .header("Location", "/api/reports/" + jobId + "/result")
                .body(JobStatusResponse.completed(job));

            case FAILED -> ResponseEntity.ok()
                .body(JobStatusResponse.failed(job));

            case DEAD -> ResponseEntity.ok()
                .body(JobStatusResponse.dead(job, "Job exceeded retry limit"));
        };
    }

    // Step 3: Fetch result
    @GetMapping("/{jobId}/result")
    public ResponseEntity<ReportResult> getResult(@PathVariable String jobId,
                                                   Authentication auth) {
        Job job = jobService.findByIdAndUser(jobId, auth.getName())
            .orElseThrow(() -> new JobNotFoundException(jobId));

        if (job.getStatus() != JobStatus.COMPLETED) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .build(); // 409 — job not yet complete
        }

        ReportResult result = jobService.getResult(jobId);
        return ResponseEntity.ok()
            .header("Cache-Control", "no-store") // results may be sensitive
            .body(result);
    }
}
```

---

## Job Queue Architecture

<JobQueueArchitectureDiagram />

---

## Task State Machine

A robust job system models the job lifecycle as a **state machine** to prevent invalid state transitions and enable clear recovery logic.

<TaskStateMachineDiagram />

```java
public enum JobStatus {
    PENDING,    // Created but not yet in queue
    QUEUED,     // In the message queue, awaiting a worker
    RUNNING,    // Worker is actively processing
    COMPLETED,  // Finished successfully
    FAILED,     // Failed this attempt, eligible for retry
    DEAD;       // Exceeded max retries — manual intervention needed

    public boolean isTerminal() {
        return this == COMPLETED || this == DEAD;
    }

    public boolean isRetryable() {
        return this == FAILED;
    }
}
```

```java
@Entity
@Table(name = "jobs")
@Data
@Builder
public class Job {
    @Id private String id;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    private String type;           // e.g., "REPORT_GENERATION"
    private String userId;
    private String payload;        // serialized job parameters (JSONB)
    private String resultKey;      // S3 key or DB reference for result

    private int progress;          // 0–100
    private String progressMessage;
    private String errorMessage;

    private int retryCount;
    private int maxRetries;        // configurable per job type

    private Instant createdAt;
    private Instant startedAt;
    private Instant completedAt;
    private Instant expiresAt;     // result TTL — clean up after X days

    public void transition(JobStatus newStatus) {
        // Prevent illegal transitions
        if (this.status.isTerminal()) {
            throw new IllegalStateException(
                "Cannot transition from terminal status " + this.status);
        }
        this.status = newStatus;
    }

    public boolean canRetry() {
        return this.retryCount < this.maxRetries;
    }
}
```

---

## Worker Implementation (Spring Boot + Kafka)

### Basic Worker

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class ReportWorker {

    private final JobRepository jobRepository;
    private final ReportGenerator reportGenerator;
    private final S3Service s3Service;
    private final ProgressTracker progressTracker;
    private final NotificationService notificationService;

    @KafkaListener(topics = "report-jobs", groupId = "report-workers", concurrency = "5")
    public void processJob(ReportJobMessage message, Acknowledgment ack) {
        String jobId = message.getJobId();
        log.info("Worker picked up job {}", jobId);

        Job job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            log.warn("Job {} not found — may have been deleted. Skipping.", jobId);
            ack.acknowledge(); // don't retry — message is stale
            return;
        }

        // Check for idempotency: don't re-process a completed job
        if (job.getStatus() == JobStatus.COMPLETED) {
            log.warn("Job {} already completed — duplicate message, skipping.", jobId);
            ack.acknowledge();
            return;
        }

        // Mark as RUNNING
        job.transition(JobStatus.RUNNING);
        job.setStartedAt(Instant.now());
        jobRepository.save(job);

        try {
            // Execute the job with progress updates
            ReportResult result = reportGenerator.generate(
                message.getReportParams(),
                (percent, msg) -> progressTracker.update(jobId, percent, msg)
            );

            // Store result
            String resultKey = s3Service.store(jobId, result);

            // Mark COMPLETED
            job.transition(JobStatus.COMPLETED);
            job.setResultKey(resultKey);
            job.setCompletedAt(Instant.now());
            job.setProgress(100);
            jobRepository.save(job);

            // Notify user
            notificationService.notifyComplete(job.getUserId(), jobId);
            log.info("Job {} completed successfully in {}ms", jobId,
                Duration.between(job.getStartedAt(), job.getCompletedAt()).toMillis());

            ack.acknowledge(); // commit Kafka offset after successful processing

        } catch (Exception e) {
            handleFailure(job, e);
            ack.acknowledge(); // always ack — retry is handled via re-queueing
        }
    }

    private void handleFailure(Job job, Exception e) {
        log.error("Job {} failed (attempt {}/{}): {}", 
            job.getId(), job.getRetryCount() + 1, job.getMaxRetries(), e.getMessage(), e);

        job.setRetryCount(job.getRetryCount() + 1);
        job.setErrorMessage(e.getMessage());

        if (job.canRetry()) {
            job.transition(JobStatus.FAILED);
            jobRepository.save(job);
            // Re-queue for retry (with delay via separate scheduler or DLQ re-drive)
        } else {
            job.transition(JobStatus.DEAD);
            jobRepository.save(job);
            notificationService.notifyFailed(job.getUserId(), job.getId(), e.getMessage());
        }
    }
}
```

---

## Worker Reliability & Exactly-Once Processing

### The "Double-Processing" Problem

When a worker processes a job and then crashes **before acknowledging the Kafka message**, the message becomes visible again (after the visibility timeout) and another worker picks it up. The job runs twice.

To handle this safely:

```java
@KafkaListener(topics = "report-jobs")
@Transactional // DB operations are atomic
public void processJob(ReportJobMessage message, Acknowledgment ack) {
    // Use optimistic locking or CAS to claim the job atomically
    int updated = jobRepository.claimJob(message.getJobId(), JobStatus.QUEUED, JobStatus.RUNNING);

    if (updated == 0) {
        // Another worker already claimed this job — skip
        log.info("Job {} already claimed by another worker", message.getJobId());
        ack.acknowledge();
        return;
    }

    // ... process the job
}
```

```java
public interface JobRepository extends JpaRepository<Job, String> {
    // Atomic compare-and-set: only transitions to RUNNING if currently QUEUED
    @Modifying
    @Query("UPDATE Job j SET j.status = :newStatus, j.startedAt = :now " +
           "WHERE j.id = :jobId AND j.status = :currentStatus")
    int claimJob(@Param("jobId") String jobId,
                 @Param("currentStatus") JobStatus currentStatus,
                 @Param("newStatus") JobStatus newStatus,
                 @Param("now") Instant now);
}
```

### Checkpoint Pattern for Resumable Jobs

For very long jobs (multi-hour data exports), use checkpoints to avoid restarting from zero on failure:

```java
@Service
public class ResumableExportJob {

    public void export(String jobId, ExportParams params) {
        Job job = jobRepository.findById(jobId).orElseThrow();

        // Load last checkpoint (if resuming after crash)
        int startPage = job.getCheckpoint() != null
            ? Integer.parseInt(job.getCheckpoint())
            : 0;

        int totalPages = dataRepository.countPages(params);

        for (int page = startPage; page < totalPages; page++) {
            List<Record> batch = dataRepository.fetchPage(page, params);
            exportService.writeBatch(jobId, batch);

            // Save checkpoint after each page
            jobRepository.saveCheckpoint(jobId, String.valueOf(page + 1));
            jobRepository.updateProgress(jobId, (page + 1) * 100 / totalPages);

            // Allow graceful shutdown check
            if (Thread.currentThread().isInterrupted()) {
                throw new JobInterruptedException("Export interrupted at page " + page);
            }
        }
    }
}
```

---

## Progress Tracking

### Store Progress in Redis

```java
@Service
@RequiredArgsConstructor
public class ProgressTracker {

    private final RedisTemplate<String, String> redis;

    public void update(String jobId, int percent, String message) {
        String key = "job:progress:" + jobId;
        Map<String, String> progress = Map.of(
            "percent",   String.valueOf(percent),
            "message",   message,
            "updatedAt", Instant.now().toString()
        );
        redis.opsForHash().putAll(key, progress);
        redis.expire(key, Duration.ofHours(24)); // TTL matches job result retention
    }

    public JobProgress get(String jobId) {
        Map<Object, Object> data = redis.opsForHash().entries("job:progress:" + jobId);
        if (data.isEmpty()) return JobProgress.unknown();
        return JobProgress.fromMap(data);
    }
}
```

### Real-Time Progress via Server-Sent Events (SSE)

SSE is a lightweight protocol — a persistent HTTP connection where the server pushes events. Ideal for progress bars.

```java
@GetMapping(value = "/api/jobs/{jobId}/progress", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamProgress(@PathVariable String jobId, Authentication auth) {
    // 5-minute max duration — client must reconnect for very long jobs
    SseEmitter emitter = new SseEmitter(300_000L);

    ScheduledFuture<?> task = scheduler.scheduleAtFixedRate(() -> {
        try {
            JobProgress progress = progressTracker.get(jobId);

            emitter.send(SseEmitter.event()
                .name("progress")
                .data(progress)
                .id(String.valueOf(System.currentTimeMillis())));

            if (progress.isTerminal()) {
                emitter.complete();
            }
        } catch (IOException e) {
            emitter.completeWithError(e); // client disconnected
        }
    }, 0, 1, TimeUnit.SECONDS);

    // Clean up the scheduled task when SSE connection closes
    emitter.onCompletion(() -> task.cancel(true));
    emitter.onTimeout(() -> task.cancel(true));
    emitter.onError(ex -> task.cancel(true));

    return emitter;
}
```

### Real-Time Progress via WebSocket

For bidirectional communication (user can pause/cancel the job):

```java
@Controller
@RequiredArgsConstructor
public class JobWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    // Worker calls this to push updates to subscribed clients
    public void pushProgress(String jobId, JobProgress progress) {
        messagingTemplate.convertAndSend(
            "/topic/jobs/" + jobId,  // client subscribes to this
            progress
        );
    }

    // Client can send a cancel command
    @MessageMapping("/jobs/{jobId}/cancel")
    public void cancelJob(@DestinationVariable String jobId, Principal user) {
        jobService.cancel(jobId, user.getName());
    }
}
```

---

## Webhooks (Push Callbacks)

Instead of the client polling, the server **pushes** a notification to a registered callback URL when the job completes.

<WebhookDeliveryDiagram />

### Reliable Webhook Delivery

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookDeliveryService {

    private final WebhookRepository webhookRepository;
    private final RestTemplate restTemplate;

    @Async("webhookExecutor")
    public void deliver(String webhookId, String callbackUrl, WebhookPayload payload) {
        int maxRetries = 5;
        long[] backoffMs = {1_000, 5_000, 30_000, 300_000, 1_800_000}; // 1s, 5s, 30s, 5m, 30m

        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                String signature = signPayload(payload); // HMAC-SHA256

                ResponseEntity<Void> response = restTemplate.exchange(
                    RequestEntity.post(URI.create(callbackUrl))
                        .header("X-Webhook-Id", webhookId)
                        .header("X-Webhook-Signature", signature)
                        .header("X-Webhook-Timestamp", String.valueOf(Instant.now().getEpochSecond()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(payload),
                    Void.class
                );

                if (response.getStatusCode().is2xxSuccessful()) {
                    webhookRepository.markDelivered(webhookId, attempt + 1);
                    log.info("Webhook {} delivered on attempt {}", webhookId, attempt + 1);
                    return;
                }

                log.warn("Webhook {} got non-2xx response: {} (attempt {})",
                    webhookId, response.getStatusCode(), attempt + 1);

            } catch (Exception e) {
                log.warn("Webhook {} delivery attempt {} failed: {}", webhookId, attempt + 1, e.getMessage());
            }

            if (attempt < maxRetries - 1) {
                sleep(backoffMs[attempt]);
            }
        }

        webhookRepository.markFailed(webhookId, "Exhausted " + maxRetries + " delivery attempts");
        log.error("Webhook {} permanently failed after {} attempts", webhookId, maxRetries);
    }

    private String signPayload(WebhookPayload payload) {
        // HMAC-SHA256 of payload JSON with the tenant's webhook secret
        byte[] secret = webhookSecretService.getSecret(payload.getTenantId());
        return HmacUtils.hmacSha256Hex(secret, payload.toJson());
    }
}
```

### Webhook Security

```java
// Consumer side: verify the webhook signature before processing
@PostMapping("/webhook")
public ResponseEntity<Void> handleWebhook(
        @RequestBody String rawBody,
        @RequestHeader("X-Webhook-Signature") String signature,
        @RequestHeader("X-Webhook-Timestamp") long timestamp) {

    // 1. Reject stale webhooks (replay attack prevention)
    if (Math.abs(Instant.now().getEpochSecond() - timestamp) > 300) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // 2. Verify HMAC signature
    String expectedSig = HmacUtils.hmacSha256Hex(webhookSecret, rawBody);
    if (!MessageDigest.isEqual(expectedSig.getBytes(), signature.getBytes())) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // 3. Process idempotently using X-Webhook-Id header
    // ...

    return ResponseEntity.ok().build();
}
```

---

## Job Scheduling

### Single-Node Scheduler (Spring `@Scheduled`)

```java
@Scheduled(cron = "0 0 2 * * ?")  // 2am daily — UTC
public void generateDailyReport() {
    jobService.submit(new DailyReportJobParams());
}
```

:::warning[Single-node only]
`@Scheduled` runs on **every instance** in a multi-node deployment. If you have 3 replicas, the job runs 3 times simultaneously.
:::

### Distributed Scheduling (ShedLock)

ShedLock uses a distributed lock provider (PostgreSQL, MySQL, Redis, DynamoDB, or Mongo) to ensure **only one node** executes a scheduled job at a time across a multi-instance cluster:

```java
@Scheduled(fixedDelay = 60_000)
@SchedulerLock(
    name = "generateDailyReport",
    lockAtMostFor  = "PT10M",  // release lock after 10m even if node crashes
    lockAtLeastFor = "PT5M"    // hold lock for at least 5m to prevent quick re-execution
)
public void generateDailyReport() {
    // Only one node executes this at a time across the entire cluster
    jobService.submit(new DailyReportJobParams());
}
```

```sql
-- ShedLock requires this table in your relational database
CREATE TABLE shedlock (
    name        VARCHAR(64)  NOT NULL,
    lock_until  TIMESTAMP(3) NOT NULL,
    locked_at   TIMESTAMP(3) NOT NULL,
    locked_by   VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
```

#### Deep Dive: `lockAtMostFor` vs `lockAtLeastFor` Mechanics

In high-concurrency multi-node environments, standard `@Scheduled` annotations trigger concurrently on all cluster nodes. ShedLock coordinates mutual exclusion using two complementary time bounds configured in ISO-8601 duration format (e.g. `PT10M` = 10 minutes, `PT30S` = 30 seconds):

```
Scenario A: Normal Execution (Finished quickly in 30s)
Time:  0s ───[Job Runs: 30s]─── 30s (Task Completes)
Lock:  [═════════════════════════════════════════════════] (Held until 5m due to lockAtLeastFor = "PT5M")
       ▲                                                 ▲
       Acquired (lock_until = now + 10m)                 Released at now + 5m (Prevents clock-skew re-execution)

Scenario B: Node Crash / Hard Kill during execution
Time:  0s ───[Job Running...]─── 2m (Node Dies: OOM / Pod Evicted / SIGKILL)
Lock:  [═══════════════════════════════════════════════════════════════════════════════════]
       ▲                                                                                   ▲
       Acquired (lock_until = now + 10m)                                                   Lock expires at 10m
                                                                                           (Allows other nodes to take over)
```

##### 1. `lockAtMostFor`: The Crash & Deadlock Safety Net
- **Purpose**: Defines the **maximum duration** the lock will be held under any circumstance, guaranteeing recovery if a node dies.
- **Under-the-Hood SQL (Acquisition)**:
  When a node attempts to acquire the lock, it performs an atomic Compare-And-Swap (CAS) update:
  ```sql
  UPDATE shedlock
  SET lock_until = :now + INTERVAL '10 MINUTE', -- lockAtMostFor
      locked_at  = :now,
      locked_by  = 'pod-billing-service-7df9f-x4k9q'
  WHERE name = 'generateDailyReport'
    AND lock_until <= :now;
  ```
- **If Node Crashes**: If the pod running the task terminates abruptly (JVM crash, OOM killer, node failure), no unlock script runs. The record remains in the database until `:now` surpasses `lock_until`. At that exact moment, another node's scheduler can acquire the lock. This prevents **orphaned locks** and permanent cluster deadlocks.
- **⚠️ Fatal Sizing Trap (Too Short)**:
  `lockAtMostFor` **MUST** be significantly longer than the maximum worst-case execution time of the task ($T_{\text{max}}$).
  - *Example*: If a report job usually takes 4 minutes, but occasionally takes 12 minutes under heavy data load, setting `lockAtMostFor = "PT10M"` is dangerous. At minute 10, the lock expires while Node 1 is still writing data. Node 2 observes an expired lock, acquires it, and begins executing the same job concurrently—resulting in **dual execution, duplicate records, and race conditions**.
  - **Rule of Thumb**: Set `lockAtMostFor` to **2x to 3x** your p99 expected job duration.

##### 2. `lockAtLeastFor`: Clock Skew & Fast Re-Execution Prevention
- **Purpose**: Defines the **minimum duration** the lock must be retained, even if the scheduled method finishes in a few milliseconds.
- **Under-the-Hood SQL (Normal Completion)**:
  When the method finishes execution normally, ShedLock does **not** immediately set `lock_until = :now`. Instead, it extends the lock to satisfy `lockAtLeastFor`:
  ```sql
  -- On normal method exit
  UPDATE shedlock
  SET lock_until = GREATEST(:now, locked_at + INTERVAL '5 MINUTE') -- lockAtLeastFor
  WHERE name = 'generateDailyReport'
    AND locked_by = 'pod-billing-service-7df9f-x4k9q';
  ```
- **Why `lockAtLeastFor` is Critical in Distributed Systems**:
  1. **Clock Drift between Nodes**: Even with NTP synchronization, distributed nodes in a cluster (AWS EC2, Kubernetes worker nodes) often experience clock skews of 100ms to several seconds. If Node A fires at `00:00:00.000`, finishes in 200ms, and drops the lock, Node B (whose clock lags by 1 second) reaches its scheduled trigger at `00:00:00.800` and executes the exact same job a second time!
  2. **Sub-second Jobs on Short Schedules**: If a lightweight job (e.g. cache invalidation) takes only 50ms to run, multiple nodes could fire sequentially in a split second without `lockAtLeastFor`.
  3. **Rolling Deployments & Pod Restarts**: Prevents a newly restarted pod from executing a scheduled batch job that just finished moments prior.
- **⚠️ Fatal Sizing Trap (Too Long)**:
  `lockAtLeastFor` **MUST** be strictly shorter than the scheduled execution interval ($T_{\text{interval}}$).
  - *Example*: If your task runs every 2 minutes (`@Scheduled(fixedRate = 120_000)`), but you set `lockAtLeastFor = "PT5M"`, the lock remains active when minute 2 and minute 4 arrive. Those scheduled runs will be skipped because the lock has not cleared!
  - **Rule of Thumb**: Set `lockAtLeastFor` to roughly **half the schedule interval** (e.g., for a 1-minute schedule, use 30s; for a 10-minute schedule, use 5m), ensuring it is greater than your cluster's maximum clock drift.

##### Summary Sizing Matrix

| Parameter | Role | Sizing Formula | Failure Mode if Too Short | Failure Mode if Too Long |
| :--- | :--- | :--- | :--- | :--- |
| **`lockAtMostFor`** | Dead node recovery / Crash safety net | `> 2x * max(job_duration)` | **Concurrent execution** (lock expires while job is still running) | Delayed failover if node crashes mid-job |
| **`lockAtLeastFor`** | Clock drift & rapid re-execution guard | `clock_drift < lockAtLeastFor < schedule_interval` | **Duplicate execution** on other nodes due to clock skew | **Skipped executions** (lock remains held when next schedule tick fires) |

### Enterprise Scheduler (Quartz Clustered)

Quartz persists job schedules and execution history in a database, enabling **full clustering with failover**:

```java
@Configuration
public class QuartzConfig {

    @Bean
    public SchedulerFactoryBean schedulerFactory(DataSource dataSource) {
        SchedulerFactoryBean factory = new SchedulerFactoryBean();
        factory.setDataSource(dataSource);

        Properties props = new Properties();
        props.setProperty("org.quartz.scheduler.instanceId", "AUTO"); // unique per node
        props.setProperty("org.quartz.jobStore.class",
            "org.quartz.impl.jdbcjobstore.JobStoreTX");
        props.setProperty("org.quartz.jobStore.isClustered", "true");
        props.setProperty("org.quartz.jobStore.clusterCheckinInterval", "20000");
        factory.setQuartzProperties(props);
        return factory;
    }

    @Bean
    public JobDetail reportJobDetail() {
        return JobBuilder.newJob(DailyReportJob.class)
            .withIdentity("dailyReport", "reporting")
            .storeDurably()
            .build();
    }

    @Bean
    public Trigger reportTrigger(JobDetail reportJobDetail) {
        return TriggerBuilder.newTrigger()
            .forJob(reportJobDetail)
            .withSchedule(CronScheduleBuilder.cronSchedule("0 0 2 * * ?")
                .withMisfireHandlingInstructionDoNothing()) // skip misfired runs
            .build();
    }
}
```

---

## Distributed Scheduling

### Comparison of Scheduling Approaches

| Approach | Multi-Node Safe | Persistence | Failover | Complexity | Best For |
|:---|:---|:---|:---|:---|:---|
| `@Scheduled` | ❌ No | No | No | Trivial | Single-node dev/test |
| ShedLock | ✅ Yes | Lock only | Automatic (lock TTL) | Low | Most production use cases |
| Quartz Clustered | ✅ Yes | Full history | Automatic | Medium | Complex scheduling, audit trail |
| Temporal.io | ✅ Yes | Full workflow | Automatic | High | Long-running durable workflows |
| AWS EventBridge | ✅ Yes | Managed | Managed | Low | AWS-native serverless jobs |

---

## Production Observability

### Job Metrics

```java
@Component
@RequiredArgsConstructor
public class JobMetrics {

    private final MeterRegistry registry;

    public void recordSubmitted(String jobType) {
        registry.counter("jobs.submitted", "type", jobType).increment();
    }

    public void recordCompleted(String jobType, Duration duration) {
        registry.timer("jobs.duration", "type", jobType, "result", "success")
                .record(duration);
        registry.counter("jobs.completed", "type", jobType).increment();
    }

    public void recordFailed(String jobType, int retryCount) {
        registry.counter("jobs.failed", "type", jobType,
                         "retry_count", String.valueOf(retryCount)).increment();
    }

    public void recordDead(String jobType) {
        registry.counter("jobs.dead", "type", jobType).increment();
    }

    public void recordQueueDepth(String jobType, long depth) {
        registry.gauge("jobs.queue_depth", Tags.of("type", jobType), depth);
    }

    public void recordWorkerUtilization(int active, int total) {
        registry.gauge("jobs.worker.active", active);
        registry.gauge("jobs.worker.total", total);
        registry.gauge("jobs.worker.utilization_pct",
            total > 0 ? (double) active / total * 100 : 0);
    }
}
```

**Key alerts:**

| Metric | Alert Threshold | Meaning |
|:---|:---|:---|
| `jobs.queue_depth` | > 10,000 | Workers can't keep up — scale out or investigate |
| `jobs.dead` rate | Any occurrence | Permanent failures — check DLQ and error logs |
| `jobs.duration` p99 | > expected timeout | Downstream slowness or deadlock in job |
| `jobs.worker.utilization_pct` | > 90% consistently | Auto-scale workers |
| Stale `RUNNING` jobs | > 2× expected job duration | Worker crashed without updating status |

### Finding Stale/Stuck Jobs

```java
@Scheduled(fixedDelay = 60_000) // every minute
public void detectStuckJobs() {
    // Jobs that have been RUNNING for more than 2× their expected duration
    Instant staleThreshold = Instant.now().minus(Duration.ofMinutes(30));
    List<Job> stuckJobs = jobRepository.findStuckJobs(staleThreshold);

    for (Job job : stuckJobs) {
        log.warn("Detected stuck job {} (status=RUNNING since {})", job.getId(), job.getStartedAt());
        alerting.alert(Alert.warn(
            "Stuck job detected",
            Map.of("jobId", job.getId(), "type", job.getType(), "startedAt", job.getStartedAt())
        ));

        // Optionally: mark as FAILED and re-queue for retry
        if (job.canRetry()) {
            job.transition(JobStatus.FAILED);
            jobRepository.save(job);
            jobQueue.requeue(job);
        }
    }
}
```

---

## Interview Questions

### Q: A worker processes a report job and writes the result to S3, but crashes before updating the job status in the database to COMPLETED. What happens when the message becomes visible again in SQS/Kafka?

**A:** Another worker picks up the message and processes the job again — writing the report to S3 a second time (overwriting or creating a duplicate key). To prevent this:
1. **Idempotency check** — before processing, check if `job.status == RUNNING` and `job.startedAt` is recent (within the visibility timeout window). If so, skip.
2. **Result key as idempotency key** — use the job ID as the S3 key. The second S3 write is identical and safe (overwrite).
3. **Atomic status update** — use a CAS (compare-and-set) DB update: `UPDATE jobs SET status='RUNNING' WHERE id=? AND status='QUEUED'`. Only one worker claims the job.

### Q: How do you design the polling endpoint to be cache-friendly for completed jobs?

**A:** For `RUNNING`/`PENDING` jobs: `Cache-Control: no-store, must-revalidate` — status changes frequently.
For `COMPLETED`/`FAILED` jobs (terminal states): `Cache-Control: public, max-age=3600` — terminal states never change, safe to cache at CDN/browser for 1 hour. This dramatically reduces DB load for popular completed jobs (e.g., a report viewed by many users).

### Q: How would you prevent a misfired Quartz job (e.g., server was down at 2am) from running 24 historical executions on restart?

**A:** Use `withMisfireHandlingInstructionDoNothing()` on the trigger. This discards misfired executions and waits for the next scheduled time. If the job **must** run (e.g., daily revenue report), use `withMisfireHandlingInstructionFireAndProceed()` — it fires once immediately on recovery and then resumes the normal schedule.

### Q: Design a system that processes 100,000 video transcoding jobs per day with progress reporting and failure retry.

**A:** Architecture:
- **Submit**: `POST /videos → 202 + job_id`. Job written to DB, message to SQS.
- **Workers**: Auto-scaling ECS/K8s workers (scale based on SQS queue depth), each running FFmpeg.
- **Progress**: Worker writes `{percent, step}` to Redis every 10s. Client polls via SSE or WebSocket.
- **Retry**: SQS visibility timeout (1hr). Failed jobs automatically reappear after 1hr. DLQ after 3 attempts.
- **Result**: Transcoded files stored in S3 with presigned URLs (24hr TTL) returned to client.
- **Scheduling**: Workers lock the job via `UPDATE SET status='RUNNING' WHERE status='QUEUED'` CAS before processing.
- **Observability**: Metrics on queue depth, worker utilization, p95 transcoding duration, DLQ depth. Alert if queue depth > 10,000 (scale event).

### Q: What is the difference between `lockAtMostFor` and `lockAtLeastFor` in ShedLock?

**A:** Both parameters govern distributed lock safety across multi-node clusters, but they defend against completely different failure modes:

1. **`lockAtMostFor` (Crash Recovery & Deadlock Prevention)**:
   - **Role**: Upper time bound for lock retention.
   - **Mechanism**: The lock row in the database/Redis is created with `lock_until = locked_at + lockAtMostFor`. If the executing node dies abruptly (JVM crash, OOM kill, network partition), the lock expires naturally after this duration, allowing other nodes to resume the schedule without human intervention.
   - **Gotcha**: If sized **too short** (shorter than actual task runtime), the lock expires while the task is still executing on Node 1. Node 2 will acquire the lock and run the task concurrently, causing **dual-write race conditions and data corruption**. Sizing formula: `lockAtMostFor > 2x * max(task_duration)`.

2. **`lockAtLeastFor` (Clock Skew & Rapid Re-execution Prevention)**:
   - **Role**: Lower time bound for lock retention.
   - **Mechanism**: Even if the scheduled method executes in 50 milliseconds, ShedLock will **not** immediately release the lock to the cluster. Upon method completion, it updates `lock_until = max(now, locked_at + lockAtLeastFor)`.
   - **Gotcha**: Protects against **clock skew across cluster nodes** (NTP drift of 1–2 seconds) and rapid re-triggers during rolling pod deployments. If sized **too long** (longer than the `@Scheduled` interval), subsequent scheduled ticks will be skipped because the lock is still held. Sizing formula: `clock_drift < lockAtLeastFor < schedule_interval`.

---

## ⚙️ Distributed Task Scheduler Internals: Storage Engines, Fencing Tokens & DAG Workflows

> **Reference**: [Sujeet Pro — Task Scheduler Design](https://sujeet.pro/articles/task-scheduler-design)

When scaling background job scheduling from a few cron jobs to millions of delayed tasks, recurring intervals, and multi-step workflows, engineers must choose the right **coordination mechanism** and defend against **zombie workers**.

### 1. The Four Execution Models

| Execution Model | Trigger Semantics | State & Next-Run Calculation | Production Example |
| :--- | :--- | :--- | :--- |
| **One-Time Delayed Task** | Fires once at `execute_at = T` (or after `delay = Δt`). | Transitions `SCHEDULED -> RUNNING -> COMPLETED`. | Send onboarding email 72h after signup; expire unpaid cart in 15m. |
| **Recurring Cron** | Fires on calendar schedule (`0 0 * * *` in `America/New_York`). | Upon dispatch (or completion), computes next calendar tick (handling DST transitions) and inserts next instance. | Nightly billing reconciliation; monthly invoice generation. |
| **Fixed-Interval / Rate** | Fires every $\Delta t$ seconds relative to last start (`fixedRate`) or last completion (`fixedDelay`). | Requires overlap policy (`SKIP_IF_RUNNING`, `BUFFER_ONE`, or `ALLOW_CONCURRENT`). | Health-check probes; metrics rollup every 60s. |
| **DAG Dependency Workflow** | Task $C$ runs only after parent tasks $A$ and $B$ both reach `COMPLETED`. | Tracks `in_degree` remaining parent count; triggers child when `remaining_parents == 0` (or via Temporal/Airflow state machine). | ETL pipeline (`Extract -> Transform -> Train Model -> Deploy`). |

---

### 2. Storage & Coordination Architectures Compared

How does the scheduler identify which tasks are due at timestamp `NOW()` without melting the database?

| Architecture | Core Mechanism | Complexity & Throughput | Failure Modes & Trade-Offs |
| :--- | :--- | :--- | :--- |
| **RDBMS `SELECT ... FOR UPDATE SKIP LOCKED`** | Poller threads run `SELECT id FROM jobs WHERE status='PENDING' AND execute_at <= NOW() ORDER BY execute_at LIMIT 100 FOR UPDATE SKIP LOCKED`. | **~5k – 15k jobs/sec** on tuned PostgreSQL with partial B+Tree index `WHERE status = 'PENDING'`. | Simple, ACID-transactional, zero external infra. Degrades if B+Tree bloats with dead tuples (`VACUUM` lag) or when polling across >500 worker threads. |
| **Redis Sorted Set (`ZSET`) Delayed Queue** | `ZADD scheduled_jobs <epoch_ms> <job_id>`. Poller executes a Lua script (`ZRANGEBYSCORE -inf NOW LIMIT 0 100` + `ZREM` + `LPUSH ready_queue`). | **~50k – 100k jobs/sec**; $O(\log N + M)$ poll cost. | Sub-second latency, but bounded by RAM cost and Redis AOF persistence durability window (`appendfsync everysec` can lose 1s of tasks on power loss). |
| **Hierarchical Hashed Timing Wheel** | In-memory circular array of time slots (Seconds $\to$ Minutes $\to$ Hours wheels) backed by an append-only WAL / DB. | **$O(1)$ insert/cancel, $O(1)$ tick advance**; handles **500k+ timers/sec** per node (used by Kafka Purgatory & Netty). | Purely in-memory index; requires loading only the upcoming window (e.g., next 15 minutes) from disk into the wheel to bound RAM usage. |
| **Time-Bucketed LSM Partitions (RocksDB / Cassandra)** | Partition key = `(time_bucket_minute, shard_id)`, clustering key = `(execute_at, job_id)`. | **100k+ writes/sec** horizontally scalable across nodes. | Avoids global index scans: workers only read the current minute's partition (`2026-11-14T10:42:shard_0..N`). Updating `execute_at` requires delete + re-insert. |

#### Production SQL Pattern: PostgreSQL `SKIP LOCKED` Queue Claiming
```sql
-- Partial index keeps the B+Tree tiny (only indexes unexecuted jobs!)
CREATE INDEX idx_jobs_pending_ready
ON jobs (execute_at ASC)
WHERE status = 'PENDING';

-- Worker atomic claim query (zero lock wait across 100 concurrent pollers):
WITH claimed AS (
    SELECT id
    FROM jobs
    WHERE status = 'PENDING'
      AND execute_at <= NOW()
    ORDER BY execute_at ASC
    LIMIT 50
    FOR UPDATE SKIP LOCKED
)
UPDATE jobs j
SET status          = 'RUNNING',
    locked_by       = :worker_id,
    lease_expires_at = NOW() + INTERVAL '60 seconds',
    fencing_token   = j.fencing_token + 1
FROM claimed
WHERE j.id = claimed.id
RETURNING j.*;
```

---

### 3. Lease Heartbeats & Zombie Worker Fencing (`fencing_token`)

A classic distributed systems bug occurs when **Worker 1** claims a job with a 60-second lease, hits a 75-second JVM Stop-The-World GC pause (or network stall), and wakes up **after** the scheduler has already expired its lease and reassigned the job to **Worker 2**:

```
Worker 1 (Zombie):  [Claims Job: token=1] ──(75s GC Pause...)────────────────► Writes Result (token=1) ❌ REJECTED!
Lease Timer:        |────── 60s Lease Expires! ──────|
Worker 2 (Active):                                   [Claims Job: token=2] ──► Writes Result (token=2) ✅ ACCEPTED!
```

- **Why Lease Timeouts Alone Are Not Enough**: Timeouts only tell the scheduler that Worker 1 *might* be dead; they do not stop Worker 1 from waking up and corrupting downstream state.
- **Monotonic Fencing Tokens (`attempt_number` / `fencing_token`)**:
  1. Every time a job is claimed or reassigned after lease expiry, the database atomically increments `fencing_token = fencing_token + 1`.
  2. Worker 1 receives `fencing_token = 1`; when its lease expires and Worker 2 claims the job, Worker 2 receives `fencing_token = 2`.
  3. Every state mutation, checkpoint save, or downstream storage write includes the token:
     ```sql
     UPDATE jobs
     SET status = 'COMPLETED', result_key = :s3Key
     WHERE id = :jobId AND fencing_token = :myFencingToken;
     ```
     If `rows_updated == 0`, Worker 1 immediately detects it has been fenced out and aborts execution.

---

### 4. Partitioned Leader / Sharded Poller Coordination

Instead of a single global scheduler leader (which becomes a bottleneck above ~20k jobs/sec) or uncoordinated pollers hammering every partition:
- Partition the `jobs` table or time-buckets into **$P$ virtual shards** (`shard_id = hash(job_id) % 256`).
- Use **etcd / ZooKeeper / Kafka Consumer Group rebalance protocol** to assign disjoint subsets of shards to active scheduler nodes (e.g., Node A owns shards `0..63`, Node B owns `64..127`).
- Each scheduler node pre-fetches upcoming jobs for its assigned shards over the next 60 seconds into a local **Hierarchical Timing Wheel**, achieving zero lock contention between nodes and instant failover via lease rebalance when a node dies.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Long-Running Tasks & Job Processing Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

When asked to design an async job processing or background task system, immediately establish four engineering invariants:
1. **Decouple Ingestion from Execution (`202 Accepted` + Durable State)**:
   - Never run operations $> 2\text{ seconds}$ synchronously on HTTP worker threads. Persist the job intent transactionally (using the **Transactional Outbox** pattern if paired with domain mutations) and return `202 Accepted` with a `Location` status URL and `Retry-After` header.
2. **Delivery vs. Effect Semantics**:
   - Explicitly state that **exact-once message delivery is physically impossible** across distributed networks; we engineer **At-Least-Once Delivery** (via leases, heartbeats, and visibility timeouts) paired with **Idempotent Side Effects + Monotonic Fencing Tokens** to achieve **Effectively-Once Execution**.
3. **Back-of-the-Envelope Sizing**:
   - Calculate **Concurrency via Little's Law ($L = \lambda \times W$)**: If the system processes $\lambda = 500\text{ jobs/sec}$ and each job takes $W = 10\text{ seconds}$ on average, you need at least $L = 5,000$ concurrent worker execution slots (plus $2\times$ headroom for retry storms).
4. **Operational Safety Nets**:
   - Enforce bounded retries with exponential backoff + full jitter, route poison-pill tasks to a **Dead-Letter Queue (DLQ)**, checkpoint multi-hour batch jobs so crashes resume from page $K$, and isolate noisy tenants into separate worker pools or priority queues.

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "Inside our `@Transactional` POST controller, we save the `Job` row to PostgreSQL and call `kafkaTemplate.send()` to enqueue the job. What goes wrong in production?"
* **Junior/Mid Answer:** "If Kafka fails, the `@Transactional` annotation rolls back the PostgreSQL insert, so everything stays consistent."
* **Principal Rebuttal:** "This is the classic **Dual-Write Race Condition** with two fatal failure modes:
  1. **Phantom Kafka Message**: `kafkaTemplate.send()` succeeds BEFORE the database transaction commits. A fast Kafka consumer picks up the message 5ms later and queries `SELECT * FROM jobs WHERE id = ?`—returning `null` (`JobNotFound`) because the PostgreSQL transaction hasn't committed yet (or worse, rolls back on commit due to a constraint violation!).
  2. **Orphaned DB Row**: The DB transaction commits, and the pod crashes 1ms later before `kafkaTemplate.send()` flushes. The job sits in `PENDING` forever.
  **The Fix**: Either use the **Transactional Outbox Pattern** (Debezium CDC / poller reads from the DB after commit) or let the `jobs` table itself act as the queue via `SELECT ... FOR UPDATE SKIP LOCKED`."

#### Trap 2: "We use a 5-minute lease timeout (`lockAtMostFor` / SQS Visibility Timeout). If a worker never takes more than 2 minutes, can two workers ever execute the same job concurrently?"
* **Junior/Mid Answer:** "No, because 5 minutes is more than 2x the maximum 2-minute job runtime, so the lease will never expire while the worker is alive."
* **Principal Rebuttal:** "Relying purely on wall-clock lease durations for mutual exclusion is unsafe. If Worker 1 suffers a **JVM Stop-The-World GC pause**, OS swap thrashing, or container CPU throttling for 5 minutes right before calling an external API, the lease expires on the scheduler, Worker 2 picks up the job, and then Worker 1 unfreezes—resulting in **both workers executing concurrently**. To guarantee safety, we attach a monotonically increasing **`fencing_token` (attempt number)** to every lease claim and require the storage layer or downstream resource to reject any write carrying `token < current_max_token`."

#### Trap 3: "100,000 users are waiting for their PDF exports, and each browser polls `GET /api/jobs/{id}` every second. Our database CPU is at 100%. How do you fix this?"
* **Junior/Mid Answer:** "Switch all clients from HTTP polling to WebSockets so they don't hit the database."
* **Principal Rebuttal:** "Maintaining 100,000 stateful WebSocket connections introduces stateful connection-draining headaches during deployments when simpler fixes eliminate 99% of the DB load:
  1. **Dynamic `Retry-After` Backoff**: Return `Retry-After: 2` initially, exponentially increasing to `15s` for long-running jobs, and jittering client poll intervals.
  2. **Read Progress from Redis / CDN Caching for Terminal States**: Workers write transient progress (`job:progress:{id}`) to Redis rather than PostgreSQL, and once a job hits `COMPLETED`/`FAILED`, return `Cache-Control: private, max-age=3600` so repeated polls never hit origin.
  3. **Server-Sent Events (SSE) over HTTP/2**: If real-time push is needed, use unidirectional SSE backed by Redis Pub/Sub—much lighter than bidirectional WebSockets."

#### Trap 4: "One enterprise customer submits a bulk batch of 500,000 low-priority report jobs, starving interactive 2-second jobs for all other customers for 4 hours."
* **Junior/Mid Answer:** "Auto-scale the Kubernetes worker pods based on queue depth."
* **Principal Rebuttal:** "Auto-scaling takes minutes, hits downstream database/API rate limits, and still lets one tenant monopolize shared FIFO partitions. We solve multi-tenant noisy-neighbor starvation via **Lane Isolation + Weighted Fair Queueing**:
  1. **Fast-Lane vs. Bulk-Lane Queues**: Route single interactive jobs to `jobs-interactive` and batch exports to `jobs-batch`, backed by dedicated worker pools.
  2. **Per-Tenant Concurrency Semaphores & Fair Scheduling**: Partition queues by `tenant_id` (or use Weighted Deficit Round-Robin polling) and enforce a Redis/DB concurrency cap (e.g., max 20 concurrent active jobs per tenant) so a 500,000-job spike only queues behind that tenant's own quota."

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Job Submission** | "Save job to DB and publish to Kafka in the controller." | "Eliminate dual-write bugs using **Transactional Outbox** or `SELECT ... FOR UPDATE SKIP LOCKED` with partial index `WHERE status = 'PENDING'`." |
| **Crash Recovery** | "Set a 10-minute lock timeout so stuck jobs retry." | "Use **short leases (30s) renewed via background heartbeats (10s)** paired with a monotonic **`fencing_token`** to fence out zombie workers." |
| **Multi-Hour Batch Jobs** | "Increase worker timeout to 6 hours and retry on failure." | "Implement **page/cursor Checkpointing** so a rescheduled worker resumes from the last committed offset instead of restarting from 0%." |
| **Delayed Scheduling** | "Run `SELECT * FROM jobs WHERE run_at <= NOW()` every second." | "Compare **RDBMS `SKIP LOCKED`**, **Redis ZSET + Lua**, **Hierarchical Timing Wheels ($O(1)$)**, and **Time-Bucketed LSM Partitions** by scale." |
| **Multi-Tenant Fairness** | "Use a single FIFO Kafka topic and scale workers." | "Separate **Fast vs. Bulk lanes**, enforce **per-tenant active concurrency limits**, and apply exponential backoff with full jitter on retries." |

---

## See Also

- [Dead Letter Queue (DLQ)](./dead-letter-queue.md) — Handling permanently failed job messages
- [Message Queues](./message-queues.md) — Kafka, SQS, RabbitMQ comparisons for job queues
- [Transactional Outbox Pattern](./outbox-pattern.md) — Reliable job submission as an event
- [Saga Pattern](./saga-pattern.md) — When a "job" is a multi-step distributed workflow
