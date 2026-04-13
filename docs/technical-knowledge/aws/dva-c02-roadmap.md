---
id: dva-c02-roadmap
title: The Ultimate 8-Week DVA-C02 Study Roadmap
sidebar_label: "🗓️ 8-Week Roadmap"
description: >
  A comprehensive, structured 8-week timeline and study guide to help you 
  master the AWS Certified Developer – Associate (DVA-C02) exam efficiently.
tags:
  - roadmap
  - study-guide
  - timeline
  - dva-c02
  - certification
---

# The Ultimate 8-Week DVA-C02 Study Roadmap

> **Goal**: Pass the AWS Certified Developer – Associate (DVA-C02) exam within a structured, realistic timeframe while gaining practical, hands-on experience.

Preparing for the DVA-C02 exam requires a balance of theoretical understanding and hands-on implementation. The exam heavily features real-world scenarios, so "book knowledge" alone isn't enough.

This roadmap is designed for a **suitable timeline of 8 weeks**. 

## ⏱️ Commitment Guidelines
- **Time Required**: 10–12 hours per week
- **Breakdown**: 6 hours reading/video courses, 4 hours hands-on labs, 2 hours practice questions
- **Prerequisites**: Basic understanding of computing concepts and ideally 1+ year of coding experience (e.g., Java, Python, Node.js).

---

## 📅 Week-by-Week Breakdown

### Week 1: Identity & Security Foundations
*The exam heavily tests your ability to secure applications and manage permissions securely.*
- **Topics**: [IAM (Roles, Policies)](./iam), STS, and [Cognito (User Pools vs Identity Pools)](./iam/cognito).
- **Key Concepts**: AssumeRole, resource-based vs. identity-based policies, Web Identity Federation.
- **Hands-on Lab**: Create an IAM Role for a Lambda function. Configure a Cognito User Pool and authenticate a simple web app.
- **Milestone**: Understand the difference between Authentication (User Pools) and Authorization (Identity Pools).

### Week 2: Cryptography & Configuration
*Knowing how to store secrets and encrypt data server-side vs client-side is crucial.*
- **Topics**: [KMS](./security/kms), [Secrets Manager](./security/secrets-manager), and [SSM Parameter Store](./security/ssm-parameter-store).
- **Key Concepts**: Envelope encryption, KMS Key Policies, `kms:Decrypt`, Secrets Manager auto-rotation.
- **Hands-on Lab**: Create a SecureString in Parameter Store, encrypt it using a KMS KMS key, and retrieve it using the AWS CLI.
- **Milestone**: Knowing when to choose Secrets Manager (auto-rotation) vs Parameter Store (free, basic configuration).

### Week 3: Serverless Compute & APIs
*This is the core of the exam. You must master Lambda and API Gateway.*
- **Topics**: [Lambda Foundations](./lambda), [Lambda Layers & Versions](./lambda/layers-and-versions), and [API Gateway](./api-gateway).
- **Key Concepts**: Cold starts, Lambda execution environment, API Gateway integration types (Lambda Proxy vs Non-Proxy), Authorizers.
- **Hands-on Lab**: Build a serverless REST API using API Gateway triggering a Lambda function that returns JSON. Setup a Lambda Layer.
- **Milestone**: Memorize API Gateway error codes (e.g., 502 Bad Gateway for malformed Lambda proxy responses, 504 Gateway Timeout).

### Week 4: Containers & Legacy Compute
*Not everything is serverless. Understand managed compute environments.*
- **Topics**: [Elastic Beanstalk](./beanstalk) and [ECS & ECR](./containers/ecs-ecr).
- **Key Concepts**: Beanstalk deployment policies (All at once, Rolling, Blue/Green), ECS Fargate vs EC2, Task Definitions.
- **Hands-on Lab**: Deploy a sample Docker container to ECS Fargate. Push an image to ECR.
- **Milestone**: Understand how `.ebextensions` works in Elastic Beanstalk.

### Week 5: Storage & Cloud Databases (Part 1)
*Data persistence is a major exam domain. Start with S3 and basic DynamoDB.*
- **Topics**: [S3 Basics](./s3), [S3 Advanced](./s3/advanced), and [DynamoDB Basics](./dynamodb).
- **Key Concepts**: S3 Storage Classes, Presigned URLs, CORS, DynamoDB Partition Keys, Read/Write Capacity Units (RCU/WCU) math.
- **Hands-on Lab**: Host a static website on S3. Create a DynamoDB table and insert/query items using the AWS SDK (e.g., Java SDK).
- **Milestone**: Be able to calculate WCU/RCU for specific read/write patterns.

### Week 6: Advanced DBs & Caching
*Finish DynamoDB and learn how to optimize database performance.*
- **Topics**: [DynamoDB Advanced](./dynamodb/advanced), [RDS/Aurora](./rds-aurora), and [ElastiCache](./elasticache).
- **Key Concepts**: DynamoDB Streams, DAX vs Global Tables, LSI vs GSI, Redis vs Memcached.
- **Hands-on Lab**: Set up a DynamoDB Stream that triggers a Lambda function on table inserts.
- **Milestone**: Understand connection pooling for Serverless databases (RDS Proxy) and how GSIs work.

### Week 7: Messaging, Decoupling & Orchestration
*Building resilient, decoupled microservices.*
- **Topics**: [SQS](./messaging/sqs), [SNS](./messaging/sns), [Kinesis](./messaging/kinesis), and [Step Functions](./step-functions).
- **Key Concepts**: SNS Fan-out pattern, SQS Visibility Timeout, Kinesis Shards & partition keys, Step Functions Standard vs Express.
- **Hands-on Lab**: Create an SNS topic that fans out messages to two different SQS queues.
- **Milestone**: Knowing exactly when to use Kinesis (real-time stream, ordered, multiple consumers) versus SQS (decoupled queue, processed once).

### Week 8: CI/CD, IaC & Observability
*Deploying and debugging your infrastructure as code.*
- **Topics**: [Developer Tools (CodeCommit, CodeBuild, CodeDeploy)](./cicd), [CloudFormation/SAM](./cloudformation), [CloudWatch](./monitoring/cloudwatch), and [X-Ray](./monitoring/x-ray).
- **Key Concepts**: `buildspec.yml` vs `appspec.yml`, CloudFormation `Parameters` vs `Outputs`, X-Ray Annotations vs Metadata.
- **Hands-on Lab**: Deploy an application using AWS SAM. Add X-Ray tracing to a Lambda function to trace a request to DynamoDB.
- **Milestone**: Understand how CodeDeploy manages Blue/Green deployments for Lambda (Traffic Shifting).

---

## 🏁 Final Phase: The "Exam Prep" Week (Week 9)

Use the 9th week exclusively for practice exams and filling knowledge gaps. **Do not learn new material this week.**

1. **Take 2-3 Full Practice Exams**: Use platforms like TutorialsDojo or the official AWS Skill Builder exams. Take them under real testing conditions (130 minutes, no distractions).
2. **Review Incorrect Answers**: The most important part of practice exams is reading the explanations for the questions you got wrong.
3. **Review the Cheat Sheet**: Reread the [🎯 Exam Tips & Keyword Mapping](./exam-tips) document thoroughly.
4. **Sleep & Relax**: Don't cram the night before. 

## 💡 Daily Study Habits for Success

* **The 20-minute daily review**: Spend 20 minutes every morning reviewing Flashcards (or your own notes) from previous weeks to ensure you don't forget Week 1 topics by Week 8.
* **Whiteboarding**: Try to draw out architectures from memory (e.g., *Draw the SNS to SQS fan-out pattern with a Lambda worker*).
* **Deep dive into wrong answers**: In multiple-choice questions, it's not enough to know why the right answer is right; you must understand why the other 3 options are wrong.
