---
id: serverless-patterns
title: Serverless Architecture Patterns
sidebar_label: "🌐 Serverless Patterns"
description: Advanced Serverless Integration Patterns for DVA-C02 and Senior Engineering roles. Orchestration vs Choreography, Saga Pattern, and Strangler Fig.
tags: [serverless, architecture, saga, eventbridge, step-functions, dva-c02]
---

# Serverless Architecture Patterns

As distributed serverless systems scale, orchestrating microservices correctly becomes paramount. Senior engineers must understand when to use EventBridge (Choreography) vs Step Functions (Orchestration).

---

## Orchestration vs Choreography

When microservice A needs to trigger microservice B, and then microservice C, you have two overarching architectural choices.

### 1. Orchestration (AWS Step Functions)
Like a conductor leading an orchestra. A central coordinator (Step Functions) explicitly commands the other services what to do and when.

- **Centralized Logic**: The State Machine knows the entire flow.
- **Tight Coupling**: The orchestrator must know about all the participants.
- **Error Handling**: Extremely easy. You can build `Catch` and `Retry` blocks directly into the visual workflow.
- **Synchronous/Asynchronous**: Can pause execution for up to 1 year waiting for a human or external callback (`.waitForTaskToken`).

### 2. Choreography (Amazon EventBridge / SNS)
Like dancers moving to music without a central conductor. Each service does its job, broadcasts an event ("Order Created"), and doesn't care who listens.

- **Decentralized Logic**: No single service knows the entire end-to-end flow.
- **Loose Coupling**: Services are completely independent. You can add a new microservice that listens to "Order Created" without modifying the Order service.
- **Error Handling**: Difficult. If a downstream service fails silently, tracking the failure across the distributed system requires heavy reliance on Distributed Tracing (AWS X-Ray).

---

## The Saga Pattern (Distributed Transactions)

In a monolithic PostgreSQL database, you have ACID transactions. If an order fails, the database rolls back the inventory deduction automatically.

In Serverless microservices, you cannot have a single database transaction spanning DynamoDB (Orders) and an external SaaS Payment Provider. 

The **Saga Pattern** solves distributed transactions by defining **compensating transactions**.

**Scenario:**
1. **Book Flight** (Success)
2. **Book Hotel** (Success)
3. **Book Rental Car** (Fails!)

Instead of a database rollback, a **Saga Orchestrator (AWS Step Functions)** executes the exact reverse operations:
1. **Cancel Hotel**
2. **Cancel Flight**

*This ensures data consistency across disjointed microservices.*

---

## The Strangler Fig Pattern

How do you migrate a giant legacy on-premise monolith to AWS Serverless without 12 months of downtime? You strangle it.

1. **Deploy an API Gateway** in front of the legacy monolith. Route 100% of traffic to the monolith.
2. **Re-write one feature** (e.g., User Authentication) as a Lambda function + DynamoDB table.
3. Configure API Gateway to route the `/auth` path to the new Lambda function, while all other paths still route to the monolith.
4. **Repeat** over exactly 12 months until the monolith receives 0% of traffic.
5. Decommission the monolith.

---

## 🎯 DVA-C02 Exam Tips

:::tip Quick Exam Rules
- **Strangler Fig**: Used to incrementally migrate a legacy monolith to serverless microservices piece by piece behind an API Gateway proxy.
- **Saga Pattern**: Solves "distributed transactions" in serverless. Handled best by Step Functions natively executing compensating transactions (rollbacks) if a later step fails.
- **Orchestration vs Choreography**: Step Functions = Orchestration (centralized). EventBridge/SNS = Choreography (decentralized).
- **Step Functions vs SQS**: Step Functions is for **orchestration** (coordinating multiple services in a specific order). SQS is for **decoupling** (decoupling services so they can fail independently).
- **Step Functions vs EventBridge**: Step Functions is for **orchestration** (coordinating multiple services in a specific order). EventBridge is for **event routing** (routing events between services).
- **Step Functions vs S3**: Step Functions is for **orchestration** (coordinating multiple services in a specific order). S3 is for **storage** (storing objects).
- **Step Functions vs SNS**: Step Functions is for **orchestration** (coordinating multiple services in a specific order). SNS is for **pub/sub** (publishing and subscribing to messages).
- **Step Functions vs SQS**: Step Functions is for **orchestration** (coordinating multiple services in a specific order). SQS is for **decoupling** (decoupling services so they can fail independently).
:::

---

## 🧪 Practice Questions

**Q1.** A company is migrating a large e-commerce monolithic application to a serverless microservices architecture. They want to ensure there is no downtime during the 6-month migration process. Which pattern should they use?

A) Saga Pattern  
B) Pub/Sub Pattern  
C) Strangler Fig Pattern  
D) Scatter-Gather Pattern  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — The **Strangler Fig pattern** is specifically designed for migrating legacy monoliths to microservices incrementally by placing an API Gateway (or proxy) in front and migrating routes one by one.
</details>

---

**Q2.** An application needs to process an order across four different microservices. If any step fails, the previous steps must be explicitly reversed. The development team wants to visualize this workflow and easily manage retries. Which AWS service is best suited?

A) Amazon SQS  
B) Amazon EventBridge  
C) AWS Step Functions  
D) Amazon SNS  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **AWS Step Functions** is the ideal choice for **Orchestration** and executing the **Saga Pattern**. It provides visual workflows, built-in error handling (`Catch`/`Retry`), and centralized state management. EventBridge would be Choreography (harder to manage rollbacks).
</details>
