---
id: overview
title: AWS DVA-C02 Exam Overview
sidebar_label: "📋 Exam Overview"
slug: /aws
description: >
  Complete overview of the AWS Certified Developer – Associate (DVA-C02) exam.
  Covers exam domains, scoring, study strategy, and all topic areas with links
  to detailed study pages.
tags:
  - overview
  - exam-guide
  - dva-c02
  - aws-certification
  - study-plan
---

# AWS Certified Developer – Associate (DVA-C02)

> **Goal**: Validate your ability to develop, deploy, debug, and maintain cloud-based applications using AWS services.

---

## 🎯 Exam At a Glance

| Property | Detail |
|---|---|
| **Exam Code** | DVA-C02 |
| **Level** | Associate |
| **Duration** | 130 minutes |
| **Questions** | 65 (scored) + ~15 unscored (not marked) |
| **Format** | Multiple choice, Multiple response |
| **Passing Score** | 720 / 1000 |
| **Price** | $150 USD |
| **Validity** | 3 years |
| **Prerequisites** | 1+ year of AWS development experience recommended |

---

## 📊 Exam Domains & Weighting

| # | Domain | Weight |
|---|---|---|
| 1 | Development with AWS Services | **32%** |
| 2 | Security | **26%** |
| 3 | Deployment | **24%** |
| 4 | Troubleshooting and Optimization | **18%** |

:::tip Focus your time accordingly
Domain 1 + 2 = **58%** of the exam. Master Lambda, DynamoDB, S3, IAM, Cognito, and KMS first.
:::

---

## 🗺️ Study Roadmap

### Phase 1 — Foundations (Week 1-2)
- [ ] [IAM & Security Policies](/iam) — roles, policies, STS
- [ ] [Cognito](/iam/cognito) — User Pools vs Identity Pools
- [ ] [KMS & Encryption](/security/kms)
- [ ] [Secrets Manager & Parameter Store](/security/secrets-manager)

### Phase 2 — Core Compute & APIs (Week 3-4)
- [ ] [Lambda](/lambda) — triggers, invocation types, concurrency
- [ ] [API Gateway](/api-gateway) — REST vs HTTP vs WebSocket
- [ ] [Elastic Beanstalk](/beanstalk) — deployment modes
- [ ] [ECS & ECR](/containers/ecs-ecr)

### Phase 3 — Data & Storage (Week 5-6)
- [ ] [S3](/s3) — storage classes, versioning, encryption, presigned URLs
- [ ] [DynamoDB](/dynamodb) — partition keys, indexes, Streams, DAX
- [ ] [ElastiCache](/elasticache) — Redis vs Memcached

### Phase 4 — Messaging & Integration (Week 7)
- [ ] [SQS](/messaging/sqs) — standard vs FIFO, visibility timeout, DLQ
- [ ] [SNS](/messaging/sns) — fan-out pattern
- [ ] [Kinesis](/messaging/kinesis) — Data Streams vs Firehose
- [ ] [Step Functions](/step-functions)

### Phase 5 — CI/CD & Monitoring (Week 8)
- [ ] [CodeCommit, CodeBuild, CodeDeploy, CodePipeline](/cicd)
- [ ] [CloudFormation & SAM](/cloudformation)
- [ ] [CloudWatch](/monitoring/cloudwatch) — Logs, Metrics, Alarms
- [ ] [X-Ray](/monitoring/x-ray)

---

## 🏗️ Key AWS Services for DVA-C02

```
Compute         Lambda · Elastic Beanstalk · ECS/ECR · EC2
API             API Gateway · AppSync
Storage         S3 · EFS · EBS
Database        DynamoDB · RDS · ElastiCache
Messaging       SQS · SNS · EventBridge · Kinesis
Security        IAM · Cognito · KMS · Secrets Manager · SSM
CI/CD           CodeCommit · CodeBuild · CodeDeploy · CodePipeline
IaC             CloudFormation · SAM · CDK
Observability   CloudWatch · X-Ray · CloudTrail
Orchestration   Step Functions
```

---

## 📚 External Study Resources

### Official AWS
| Resource | Link |
|---|---|
| Exam Guide (PDF) | [Download](https://d1.awsstatic.com/training-and-certification/docs-dev-associate/AWS-Certified-Developer-Associate_Exam-Guide.pdf) |
| Sample Questions | [AWS Training](https://d1.awsstatic.com/training-and-certification/docs-dev-associate/AWS-Certified-Developer-Associate_Sample-Questions.pdf) |
| AWS Skill Builder | [skillbuilder.aws](https://skillbuilder.aws) |
| AWS Free Tier | [aws.amazon.com/free](https://aws.amazon.com/free) |
| AWS Workshops | [workshops.aws](https://workshops.aws) |

### Top Courses
| Resource | Notes |
|---|---|
| **Stephane Maarek (Udemy)** | 🌟 Best overall — covers every topic |
| **A Cloud Guru** | Good for beginners |
| **TutorialsDojo Practice Exams** | Best practice tests — very exam-like |
| **Whizlabs** | Extra practice questions |
| **freeCodeCamp YouTube** | Free full-length course |

### Practice Exam Platforms
- **TutorialsDojo** — highly recommended, closest to real exam
- **Whizlabs**
- **AWS Official Practice Exam** (2 free via Skill Builder)
- **Examtopics** — use with caution, verify answers

### Java/Spring Specific
Since you use **Java + Spring**, pay special attention to:
- [AWS SDK for Java v2](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/)
- [Spring Cloud AWS](https://spring.io/projects/spring-cloud-aws)
- [AWS Lambda with Java](https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html)

---

## 💡 General Exam Strategy

:::note Multiple Response Questions
For "select 2" or "select 3" questions, eliminate wrong answers first. There are no partial scores — you need all correct choices.
:::

:::caution Read carefully
AWS loves to hide keywords: *most cost-effective*, *least operational overhead*, *highly available*, *serverless*. These narrow the correct answer dramatically.
:::

:::tip Keyword → Service Mapping
| Keyword | Think of |
|---|---|
| Serverless | Lambda, DynamoDB, S3, API Gateway |
| Decoupling | SQS, SNS, EventBridge |
| Real-time streaming | Kinesis |
| Cache | ElastiCache (Redis/Memcached) or DAX |
| Secrets | Secrets Manager or Parameter Store |
| Tracing | X-Ray |
| Audit logs | CloudTrail |
| Blue/Green deploy | CodeDeploy or Beanstalk |
:::

---

## 🧪 Practice Questions — Overview Level

:::info
These questions test broad exam knowledge. Detailed questions are in each topic page.
:::

**Q1.** You have 65 questions and 130 minutes. How much average time do you have per question?
<details>
<summary>Answer</summary>
**2 minutes per question.** Flag hard questions and come back. Never leave blanks — there's no penalty for wrong answers.
</details>

**Q2.** Which domain has the highest weighting in the DVA-C02 exam?
<details>
<summary>Answer</summary>
**Domain 1: Development with AWS Services (32%).** Focus heavily on Lambda, DynamoDB, S3, and API Gateway.
</details>

**Q3.** A developer needs to pick between storing application secrets or database credentials. Which AWS service is purpose-built for **automatic rotation** of database credentials?
<details>
<summary>Answer</summary>
**AWS Secrets Manager** — it supports automatic rotation for RDS, Redshift, and DocumentDB. SSM Parameter Store does not natively rotate secrets.
</details>
