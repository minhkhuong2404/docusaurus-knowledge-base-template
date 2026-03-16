---
id: exam-tips
title: 🎯 Exam Tips & Ultimate Cheatsheet
sidebar_label: "🎯 Exam Tips & Cheatsheet"
description: >
  DVA-C02 exam tips, keyword triggers, common traps, quick decision
  frameworks, and a full-service cheatsheet for last-minute review.
tags:
  - exam-tips
  - cheatsheet
  - quick-reference
  - dva-c02
  - study-guide
---

# 🎯 DVA-C02 — Exam Tips & Ultimate Cheatsheet

> Use this page for your **final review** the day before the exam.

---

## ⚡ Keyword → Service Mapping

| Keyword in question | Answer |
|---|---|
| **Serverless** | Lambda, DynamoDB, S3, API Gateway, Step Functions |
| **No servers to manage** | Lambda (code), Fargate (containers) |
| **Decouple** | SQS (queue), SNS (pub/sub), EventBridge |
| **Real-time streaming** | Kinesis Data Streams |
| **Load streaming to S3** | Kinesis Data Firehose |
| **Fan-out** | SNS → multiple SQS queues |
| **Ordered messages** | SQS FIFO or Kinesis (per shard) |
| **Exactly-once delivery** | SQS FIFO |
| **Cache** | ElastiCache Redis/Memcached, DAX (DynamoDB only) |
| **Leaderboard / sorted data** | ElastiCache Redis Sorted Sets |
| **Sub-millisecond reads** | DAX (DynamoDB) |
| **Audit trail / who called what** | CloudTrail |
| **App performance metrics** | CloudWatch |
| **Distributed tracing** | X-Ray |
| **Secrets with auto-rotation** | Secrets Manager |
| **Configuration / cheap secrets** | SSM Parameter Store |
| **Encrypt data > 4KB** | KMS Envelope Encryption (GenerateDataKey) |
| **Cross-account access** | IAM Role with trust policy + AssumeRole |
| **Confused deputy protection** | STS ExternalId |
| **User auth (sign in to app)** | Cognito User Pool |
| **AWS credentials for users** | Cognito Identity Pool |
| **Custom JWT claims** | Cognito Pre Token Generation trigger |
| **Direct S3 upload from browser** | S3 Presigned PUT URL |
| **S3 bucket encryption audit** | SSE-KMS (CloudTrail logs KMS calls) |
| **S3 query without download** | S3 Select |
| **Prevent S3 accidental delete** | S3 MFA Delete or Object Lock |
| **Immutable Lambda deployment** | Lambda Version + Alias |
| **Gradual Lambda traffic shift** | CodeDeploy Canary/Linear + Lambda Alias |
| **API throttling per customer** | API Gateway Usage Plans + API Keys |
| **API response caching** | API Gateway REST API cache |
| **API max timeout** | 29 seconds (API Gateway hard limit) |
| **Blue/Green on EC2** | CodeDeploy or Elastic Beanstalk |
| **IaC serverless** | SAM (`Transform: AWS::Serverless-2016-10-31`) |
| **IaC general** | CloudFormation |
| **Multi-account IaC** | CloudFormation StackSets |
| **Human approval in pipeline** | CodePipeline Manual Approval |
| **Background jobs from web tier** | SQS + Worker tier (Beanstalk) |
| **Orchestrate multi-step workflows** | Step Functions |
| **Long workflow (> 5 min)** | Step Functions Standard |
| **Short high-volume workflow** | Step Functions Express |
| **Human approval in workflow** | Step Functions Callback (waitForTaskToken) |
| **EC2 RAM metric** | CloudWatch Agent (not default!) |
| **Cold starts for Java Lambda** | SnapStart, Provisioned Concurrency |
| **Lambda shares code/libraries** | Lambda Layers |
| **Container without EC2 mgmt** | ECS Fargate |
| **Container app permissions** | ECS Task Role (not Execution Role!) |

---

## 🪤 Common Exam Traps

| Trap | Correct Answer |
|---|---|
| "Lambda retries on S3 event failure" | **2 retries** (async), not 3 |
| "SQS visibility timeout too short" | Messages processed **twice** |
| "EC2 MemoryUtilization alarm shows no data" | **CloudWatch Agent** not installed |
| "Secrets Manager vs Parameter Store" | **Secrets Manager** = rotation; **SSM** = cheap config |
| "DLQ vs Destinations" | **Destinations** = success + failure, more targets (prefer it) |
| "Lambda $LATEST in production" | Never — use **published version + alias** |
| "KMS encrypt large file" | **Envelope encryption** — KMS max 4KB |
| "CloudTrail vs CloudWatch" | CloudTrail = **API calls**; CloudWatch = **metrics/logs** |
| "Cognito User Pool vs Identity Pool" | **User Pool** = sign in; **Identity Pool** = AWS credentials |
| "ECS Task Role vs Execution Role" | **Task Role** = app perms; **Execution Role** = ECS agent perms |
| "SNS alone for job processing" | SNS has no retention — use **SNS → SQS** for reliability |
| "Standard Queue ordering" | **Best-effort** — use FIFO for guaranteed order |
| "Kinesis vs SQS for replay" | **Kinesis** supports replay; SQS messages deleted after consume |
| "API Gateway timeout" | **29 seconds** — NOT Lambda's 15 minutes |
| "SAM transform declaration" | `AWS::Serverless-2016-10-31` NOT `AWS::SAM-2016-10-31` |

---

## 📊 Domain-Specific Priorities

### Domain 1 — Development (32%)
Must-know services: **Lambda, DynamoDB, S3, API Gateway, SQS/SNS/Kinesis, Step Functions, ElastiCache**

### Domain 2 — Security (26%)
Must-know services: **IAM, Cognito, KMS, Secrets Manager, SSM, CloudTrail**

Key patterns:
- Use roles, never access keys
- Least privilege
- Encryption at rest + in transit
- Audit everything (CloudTrail)

### Domain 3 — Deployment (24%)
Must-know services: **CodeCommit, CodeBuild, CodeDeploy, CodePipeline, CloudFormation, SAM, Beanstalk, ECS/Fargate**

Key concepts: deployment strategies, blue/green, canary, rollback

### Domain 4 — Troubleshooting & Optimization (18%)
Must-know services: **CloudWatch, X-Ray, CloudTrail**

Key patterns:
- Metrics → Alarms → SNS actions
- Logs → Metric Filters → Alarms
- X-Ray Annotations for searchable traces
- X-Ray Segments/Subsegments for distributed tracing

---

## ⏱️ Exam Time Management

| Phase | Time |
|---|---|
| First pass (answer what you know) | ~70 minutes |
| Review flagged questions | ~40 minutes |
| Final review | ~20 minutes |
| **Buffer** | ~0 minutes (130 total) |

**Strategy**:
1. Answer easy questions first (< 30 seconds)
2. Flag uncertain questions — don't spend > 2 min each
3. Eliminate wrong answers first for hard questions
4. Never leave blanks — **guess if needed** (no penalty)

---

## 🔄 Last-Minute Service Quick Facts

| Service | Key Number |
|---|---|
| Lambda max timeout | **15 minutes** |
| Lambda max memory | **10,240 MB** |
| Lambda default concurrency | **1,000** per region |
| API Gateway timeout | **29 seconds** |
| SQS standard max retention | **14 days** |
| SQS visibility timeout max | **12 hours** |
| SQS FIFO throughput | **300 TPS** (3,000 with batching) |
| DynamoDB max transaction items | **100 items** |
| DynamoDB TTL deletion SLA | **within 48 hours** |
| Kinesis default retention | **24 hours** (max 365 days) |
| Kinesis shard write | **1 MB/s** or **1,000 records/s** |
| S3 presigned URL max expiry | **7 days** |
| KMS direct encrypt max size | **4 KB** |
| Cognito Access Token expiry | **1 hour** (default) |
| CloudTrail Event History | **90 days** |
| Step Functions Standard max | **1 year** |
| Step Functions Express max | **5 minutes** |
| CodeBuild cache type for Maven | **S3 cache** (`/root/.m2/**/*`) |

---

## 📚 Final Study Resources

| Resource | Priority |
|---|---|
| [TutorialsDojo Practice Exams](https://tutorialsdojo.com/courses/aws-certified-developer-associate-practice-exams/) | ⭐⭐⭐ Must do |
| [Stephane Maarek DVA-C02 (Udemy)](https://www.udemy.com/course/aws-certified-developer-associate-dva-c01/) | ⭐⭐⭐ Must do |
| [AWS Skill Builder Official Practice](https://skillbuilder.aws) | ⭐⭐ Recommended |
| [AWS DVA-C02 Exam Guide](https://d1.awsstatic.com/training-and-certification/docs-dev-associate/AWS-Certified-Developer-Associate_Exam-Guide.pdf) | ⭐⭐ Read once |
| [AWS Workshops (hands-on)](https://workshops.aws) | ⭐ Good for hands-on |
| [Whizlabs Practice Tests](https://www.whizlabs.com/aws-developer-associate/) | ⭐ Extra practice |

---

:::tip You've got this!
The best preparation is a combination of **watching/reading** all topics + **hands-on practice** in an AWS account + **practice exams** until you consistently score 80%+.

Target 80%+ on TutorialsDojo mocks before booking the real exam.
:::
