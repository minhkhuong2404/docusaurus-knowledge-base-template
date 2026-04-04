---
id: long-running-tasks
title: Managing Long-Running Tasks
sidebar_label: Long-Running Tasks
description: Patterns for handling asynchronous long-running operations including job queues, progress tracking, async callbacks, webhooks, polling APIs, and task scheduling.
tags: [async, job-queue, background-tasks, polling, webhooks, progress-tracking, scheduling]
---

# Managing Long-Running Tasks

> Operations taking more than ~2 seconds should be made **asynchronous**. Never block an HTTP connection for a long operation.

---

## The Core Pattern: Async Job API

```
1. Client POSTs job request → API returns 202 Accepted + job_id
2. Job runs asynchronously in background
3. Client polls GET /jobs/{job_id}/status → {status, progress, result_url}
4. On completion → Client fetches result
```

### HTTP Status Codes
| Status | Meaning |
|---|---|
| `202 Accepted` | Job submitted, not yet complete |
| `200 OK` | Job complete, result in body |
| `303 See Other` | Redirect to result location |

---

## REST API Design for Async Jobs

```java
// Submit job
@PostMapping("/reports")
public ResponseEntity<JobResponse> generateReport(@RequestBody ReportRequest req) {
    String jobId = jobService.submit(req);
    return ResponseEntity
        .accepted()
        .header("Location", "/reports/" + jobId)
        .body(new JobResponse(jobId, JobStatus.PENDING));
}

// Poll status
@GetMapping("/reports/{jobId}")
public ResponseEntity<JobStatusResponse> getStatus(@PathVariable String jobId) {
    Job job = jobService.findById(jobId);

    return switch (job.getStatus()) {
        case PENDING, RUNNING -> ResponseEntity.ok(
            new JobStatusResponse(jobId, job.getStatus(), job.getProgress())
        );
        case COMPLETED -> ResponseEntity
            .status(HttpStatus.SEE_OTHER)
            .header("Location", "/reports/" + jobId + "/result")
            .build();
        case FAILED -> ResponseEntity.ok(
            new JobStatusResponse(jobId, FAILED, job.getErrorMessage())
        );
    };
}

// Get result
@GetMapping("/reports/{jobId}/result")
public ResponseEntity<ReportResult> getResult(@PathVariable String jobId) {
    return ResponseEntity.ok(jobService.getResult(jobId));
}
```

---

## Job Queue Architecture

```
API Server → Job Queue (Kafka / RabbitMQ / SQS / Redis)
                  ↓
            Worker Pool
          (auto-scalable)
                  ↓
           Result Store (DB / S3)
                  ↓
         Notification (webhook / SSE / email)
```

### Spring Boot + Kafka Workers
```java
@KafkaListener(topics = "report-jobs", concurrency = "5")
public void processJob(ReportJob job) {
    jobRepository.updateStatus(job.getId(), RUNNING);
    try {
        ReportResult result = reportGenerator.generate(job);
        String resultKey = s3Service.store(result);

        jobRepository.complete(job.getId(), resultKey);
        notificationService.notifyComplete(job.getUserId(), job.getId());
    } catch (Exception e) {
        jobRepository.fail(job.getId(), e.getMessage());
        log.error("Job {} failed", job.getId(), e);
    }
}
```

---

## Progress Tracking

### Store Progress in Redis
```java
@Service
public class ProgressTracker {
    @Autowired private RedisTemplate<String, String> redis;

    public void updateProgress(String jobId, int percent, String message) {
        String key = "job:progress:" + jobId;
        Map<String, String> progress = Map.of(
            "percent", String.valueOf(percent),
            "message", message,
            "updatedAt", Instant.now().toString()
        );
        redis.opsForHash().putAll(key, progress);
        redis.expire(key, Duration.ofHours(24));
    }

    public JobProgress getProgress(String jobId) {
        Map<Object, Object> data = redis.opsForHash()
            .entries("job:progress:" + jobId);
        return JobProgress.fromMap(data);
    }
}
```

### Real-Time Progress via SSE
```java
@GetMapping(value = "/jobs/{jobId}/progress", produces = TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamProgress(@PathVariable String jobId) {
    SseEmitter emitter = new SseEmitter(300_000L); // 5 min timeout

    scheduledExecutor.scheduleAtFixedRate(() -> {
        JobProgress progress = progressTracker.getProgress(jobId);
        emitter.send(progress);
        if (progress.isTerminal()) emitter.complete();
    }, 0, 1, TimeUnit.SECONDS);

    return emitter;
}
```

---

## Webhooks (Push Callbacks)

Instead of polling, the server POSTs to the client when done.

```
1. Client registers: POST /webhooks {url: "https://client.com/callback", events: ["job.complete"]}
2. Job completes → Server POSTs to callback URL
3. Client processes result
```

```java
@Service
public class WebhookService {
    @Async
    public void deliver(String callbackUrl, Object payload) {
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                restTemplate.postForEntity(callbackUrl, payload, Void.class);
                return; // Success
            } catch (Exception e) {
                log.warn("Webhook delivery attempt {} failed for {}", attempt, callbackUrl);
                if (attempt < maxRetries) {
                    Thread.sleep(exponentialBackoff(attempt)); // 2s, 4s, 8s
                }
            }
        }
        log.error("Webhook delivery failed after {} attempts", maxRetries);
    }

    private long exponentialBackoff(int attempt) {
        return (long) Math.pow(2, attempt) * 1000;
    }
}
```

### Webhook Security
- HMAC signature on payload: `X-Signature: sha256=<hmac>`
- Expiring timestamps to prevent replay attacks
- Retry with idempotency keys

---

## Job Scheduling (Cron / Delayed Jobs)

### Spring Scheduler (Single Node)
```java
@Scheduled(cron = "0 0 2 * * ?") // 2am daily
public void generateDailyReport() {
    jobService.submit(new DailyReportJob());
}
```

### Distributed Scheduling (Multi-Node)
Use distributed scheduler to prevent duplicate execution:

```java
// ShedLock — prevents concurrent execution across nodes
@Scheduled(fixedDelay = 60_000)
@SchedulerLock(name = "generateDailyReport", lockAtMostFor = "10m", lockAtLeastFor = "5m")
public void generateDailyReport() {
    // Only one node executes at a time
}
```

### Quartz Scheduler (Enterprise)
```java
@Bean
public JobDetail reportJobDetail() {
    return JobBuilder.newJob(ReportJob.class)
        .withIdentity("reportJob")
        .storeDurably()
        .build();
}

@Bean
public Trigger reportTrigger(JobDetail reportJobDetail) {
    return TriggerBuilder.newTrigger()
        .forJob(reportJobDetail)
        .withSchedule(CronScheduleBuilder.cronSchedule("0 0 2 * * ?"))
        .build();
}
```

---

## Dead Letter Queue (DLQ) — Failed Job Handling

```
Normal Queue → Worker (fails 3x) → Dead Letter Queue (DLQ)
                                          ↓
                                   Alert / Manual inspection / Replay
```

```yaml
# Spring Kafka DLQ config
spring:
  kafka:
    consumer:
      group-id: report-workers
    listener:
      ack-mode: manual_immediate
# Custom error handler → send to DLQ after N retries
```

---

## Task State Machine

```
PENDING → QUEUED → RUNNING → COMPLETED
                           ↘ FAILED → (retry) → RUNNING
                                    → (max retries) → DEAD
```

```java
public enum JobStatus {
    PENDING, QUEUED, RUNNING, COMPLETED, FAILED, DEAD;

    public boolean isTerminal() {
        return this == COMPLETED || this == DEAD;
    }
}
```

---

## Interview Questions

1. Why should long-running operations be made asynchronous? What's the risk of blocking?
2. How do you design a REST API for an async operation? What HTTP status codes apply?
3. What is a dead letter queue and when is it used?
4. How do you track progress of a long-running background job?
5. What are webhooks? What are their reliability challenges?
6. How do you prevent duplicate job execution in a distributed scheduler?
7. How would you design a system that processes video uploads asynchronously?
8. What happens if a worker crashes mid-job? How do you ensure the job is retried?
