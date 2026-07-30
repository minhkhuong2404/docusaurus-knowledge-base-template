---
id: index
title: AWS Step Functions
sidebar_label: "🔁 Step Functions"
description: >
  AWS Step Functions for DVA-C02. Standard vs Express workflows, state types,
  error handling, Wait for Callback, Map state for parallel processing,
  and integration with Lambda, SQS, DynamoDB, and API Gateway.
tags:
  - step-functions
  - workflows
  - orchestration
  - state-machine
  - serverless
  - dva-c02
  - domain-1
---

# AWS Step Functions

> **Core concept**: Step Functions orchestrate multi-step workflows using **state machines** — coordinate Lambda, SQS, DynamoDB, ECS, and 200+ AWS services without writing glue code.

---

## 🔰 What Are Step Functions?

Step Functions is a **visual workflow orchestration service**. Instead of chaining Lambda functions together with custom code, you define a workflow as a state machine using JSON (Amazon States Language — ASL).

**Analogy**: Think of Step Functions like a flowchart that actually runs. Each box is a state that does something (call Lambda, write to DynamoDB, wait for approval), and arrows define the flow based on conditions and outcomes.

### When to Use Step Functions vs Alternatives

| Use Case | Step Functions | SQS | EventBridge |
|---|---|---|---|
| **Orchestration** (do A, then B, then C) | ✅ Best fit | ❌ | ❌ |
| **Decoupling** (A doesn't care when B runs) | ❌ | ✅ Best fit | ✅ |
| **Event routing** (route events to targets) | ❌ | ❌ | ✅ Best fit |
| **Human approval workflows** | ✅ (waitForTaskToken) | ❌ | ❌ |
| **Parallel fan-out** | ✅ (Map/Parallel) | ✅ (with Lambda) | ✅ |
| **Long-running processes** | ✅ (up to 1 year) | ❌ | ❌ |
| **Error handling with retries** | ✅ Built-in | Custom code | Custom code |

---

## Standard vs Express Workflows

| Feature | Standard | Express |
|---|---|---|
| **Max duration** | 1 year | 5 minutes |
| **Execution model** | Exactly-once | At-least-once (async) / At-most-once (sync) |
| **Execution history** | Full history in console (90 days) | CloudWatch Logs only |
| **Max execution rate** | 2,000/sec (soft limit) | 100,000/sec |
| **Pricing** | Per state transition ($0.025/1000) | Per execution + duration |
| **Use case** | Long business processes, human approval | High-volume event processing, IoT, streaming |

### Express Workflow Types

| Type | Invocation | Guarantee | Use Case |
|---|---|---|---|
| **Async Express** | `StartExecution` → immediate return | At-least-once | Fire-and-forget event processing |
| **Sync Express** | `StartSyncExecution` → wait for result | At-most-once | API Gateway backend, request/response |

:::tip[Exam Decision]
- Need **exactly-once** processing? → **Standard**
- Need **high throughput** (>2000/sec)? → **Express**
- Need to run for **>5 minutes**? → **Standard**
- Need **execution history** in console? → **Standard**
:::

---

## State Types

| State | Purpose | Key Properties |
|---|---|---|
| **`Task`** | Do work (invoke Lambda, call API, run ECS task) | `Resource`, `Parameters`, `Retry`, `Catch` |
| **`Choice`** | Branch based on conditions (if/else) | `Choices`, `Default` |
| **`Wait`** | Pause for duration or until timestamp | `Seconds`, `Timestamp`, `SecondsPath` |
| **`Parallel`** | Execute branches simultaneously | `Branches` (array of sub-state machines) |
| **`Map`** | Iterate over an array, processing each item | `ItemsPath`, `MaxConcurrency`, `Iterator` |
| **`Pass`** | Pass input to output (testing/transformation) | `Result`, `ResultPath` |
| **`Succeed`** | End workflow successfully | Terminal state |
| **`Fail`** | End workflow with error | `Error`, `Cause` |

---

## State Machine Definition (ASL)

### Complete Order Processing Example

```json
{
  "Comment": "E-Commerce Order Processing Workflow",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123:function:ValidateOrder",
      "Next": "CheckInventory",
      "Catch": [{
        "ErrorEquals": ["ValidationError"],
        "ResultPath": "$.error",
        "Next": "SendFailureNotification"
      }]
    },
    "CheckInventory": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:getItem",
      "Parameters": {
        "TableName": "Inventory",
        "Key": { "productId": { "S.$": "$.productId" } }
      },
      "ResultPath": "$.inventory",
      "Next": "IsInStock"
    },
    "IsInStock": {
      "Type": "Choice",
      "Choices": [{
        "Variable": "$.inventory.Item.quantity.N",
        "NumericGreaterThan": 0,
        "Next": "ProcessPayment"
      }],
      "Default": "NotifyOutOfStock"
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123:function:ProcessPayment",
      "Retry": [{
        "ErrorEquals": ["PaymentGatewayTimeout"],
        "IntervalSeconds": 2,
        "MaxAttempts": 3,
        "BackoffRate": 2.0
      }],
      "Catch": [{
        "ErrorEquals": ["PaymentDeclined"],
        "ResultPath": "$.error",
        "Next": "HandlePaymentError"
      }],
      "Next": "FulfillOrder"
    },
    "FulfillOrder": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "UpdateInventory",
          "States": {
            "UpdateInventory": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:us-east-1:123:function:UpdateInventory",
              "End": true
            }
          }
        },
        {
          "StartAt": "SendConfirmationEmail",
          "States": {
            "SendConfirmationEmail": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sns:publish",
              "Parameters": {
                "TopicArn": "arn:aws:sns:us-east-1:123:OrderConfirmations",
                "Message.$": "States.Format('Order {} confirmed', $.orderId)"
              },
              "End": true
            }
          }
        },
        {
          "StartAt": "CreateShipment",
          "States": {
            "CreateShipment": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:us-east-1:123:function:CreateShipment",
              "End": true
            }
          }
        }
      ],
      "Next": "OrderComplete"
    },
    "OrderComplete": { "Type": "Succeed" },
    "NotifyOutOfStock": { "Type": "Fail", "Error": "OutOfStock", "Cause": "Product not available" },
    "HandlePaymentError": { "Type": "Fail", "Error": "PaymentFailed", "Cause": "Payment was declined" },
    "SendFailureNotification": { "Type": "Fail", "Error": "ValidationFailed", "Cause": "Order validation failed" }
  }
}
```

---

## Error Handling

### Retry

Automatically retry failed states with exponential backoff:

```json
"Retry": [
  {
    "ErrorEquals": ["Lambda.ServiceException", "Lambda.TooManyRequestsException"],
    "IntervalSeconds": 1,
    "MaxAttempts": 3,
    "BackoffRate": 2.0
  },
  {
    "ErrorEquals": ["States.ALL"],
    "IntervalSeconds": 5,
    "MaxAttempts": 2,
    "BackoffRate": 3.0
  }
]
```

**Retry timeline**: `1s → 2s → 4s` (IntervalSeconds × BackoffRate^attempt)

### Catch

Handle specific errors gracefully:

```json
"Catch": [
  {
    "ErrorEquals": ["PaymentDeclined"],
    "ResultPath": "$.error",
    "Next": "HandlePaymentError"
  },
  {
    "ErrorEquals": ["States.ALL"],
    "ResultPath": "$.error",
    "Next": "GenericErrorHandler"
  }
]
```

### Built-in Error Types

| Error | When It Occurs |
|---|---|
| `States.ALL` | Matches all errors (catch-all) |
| `States.TaskFailed` | Task state failed |
| `States.Timeout` | State or execution timed out |
| `States.Permissions` | Insufficient IAM permissions |
| `States.ResultPathMatchFailure` | ResultPath can't be applied to input |
| `States.HeartbeatTimeout` | Task didn't send heartbeat in time |

:::tip[Error Handling Order]
Retry is evaluated **before** Catch. If all retries fail, then Catch is evaluated. Order matters — more specific errors should come first, `States.ALL` last.
:::

---

## Integration Patterns

### 1. Request-Response (Default)

Step Functions calls the service and moves to the next state immediately:

```json
"Resource": "arn:aws:states:::lambda:invoke"
```

### 2. Run a Job (.sync)

Step Functions calls the service and **waits** for it to complete:

```json
"Resource": "arn:aws:states:::ecs:runTask.sync"
```

Supported with: ECS, Glue, Batch, CodeBuild, SageMaker, EMR, Step Functions (nested)

### 3. Wait for Callback (.waitForTaskToken)

Step Functions pauses and waits for an external system to call `SendTaskSuccess/Failure`:

```json
"WaitForHumanApproval": {
  "Type": "Task",
  "Resource": "arn:aws:states:::sqs:sendMessage.waitForTaskToken",
  "Parameters": {
    "QueueUrl": "https://sqs.us-east-1.amazonaws.com/123/approval-queue",
    "MessageBody": {
      "taskToken.$": "$$.Task.Token",
      "orderId.$": "$.orderId",
      "approvalUrl.$": "States.Format('https://api.example.com/approve?token={}', $$.Task.Token)"
    }
  },
  "TimeoutSeconds": 86400,
  "Next": "ProcessApproval"
}
```

The external system (human, webhook, etc.) resumes the workflow:

```bash
# Approve
aws stepfunctions send-task-success \
    --task-token "AAAAKgAAAAIAA..." \
    --task-output '{"approved": true, "approver": "john@example.com"}'

# Reject
aws stepfunctions send-task-failure \
    --task-token "AAAAKgAAAAIAA..." \
    --error "Rejected" \
    --cause "Budget exceeded"
```

---

## Map State (Parallel Processing)

### Inline Map (small arrays)

```json
"ProcessOrders": {
  "Type": "Map",
  "ItemsPath": "$.orders",
  "MaxConcurrency": 10,
  "ItemProcessor": {
    "ProcessorConfig": { "Mode": "INLINE" },
    "StartAt": "ProcessSingleOrder",
    "States": {
      "ProcessSingleOrder": {
        "Type": "Task",
        "Resource": "arn:aws:lambda:...:ProcessOrder",
        "End": true
      }
    }
  },
  "Next": "SendSummary"
}
```

### Distributed Map (millions of items)

For processing massive datasets (S3 inventory, large CSV files):

```json
"ProcessLargeDataset": {
  "Type": "Map",
  "ItemProcessor": {
    "ProcessorConfig": {
      "Mode": "DISTRIBUTED",
      "ExecutionType": "EXPRESS"
    },
    "StartAt": "ProcessChunk",
    "States": {
      "ProcessChunk": {
        "Type": "Task",
        "Resource": "arn:aws:lambda:...:ProcessChunk",
        "End": true
      }
    }
  },
  "ItemReader": {
    "Resource": "arn:aws:states:::s3:getObject",
    "ReaderConfig": {
      "InputType": "CSV",
      "CSVHeaderLocation": "FIRST_ROW"
    },
    "Parameters": {
      "Bucket": "my-data-bucket",
      "Key": "input/large-dataset.csv"
    }
  },
  "MaxConcurrency": 1000,
  "Next": "Done"
}
```

---

## Direct Service Integrations (No Lambda Needed!)

Step Functions can call 200+ AWS services directly:

```json
"WriteToDatabase": {
  "Type": "Task",
  "Resource": "arn:aws:states:::dynamodb:putItem",
  "Parameters": {
    "TableName": "Orders",
    "Item": {
      "orderId": { "S.$": "$.orderId" },
      "status": { "S": "PROCESSING" },
      "createdAt": { "S.$": "$$.State.EnteredTime" }
    }
  },
  "Next": "SendNotification"
}
```

Common direct integrations:

| Service | Resource ARN |
|---|---|
| DynamoDB | `arn:aws:states:::dynamodb:putItem/getItem/updateItem` |
| SNS | `arn:aws:states:::sns:publish` |
| SQS | `arn:aws:states:::sqs:sendMessage` |
| ECS | `arn:aws:states:::ecs:runTask.sync` |
| Glue | `arn:aws:states:::glue:startJobRun.sync` |
| EventBridge | `arn:aws:states:::events:putEvents` |

:::tip[Cost Optimization]
Using direct service integrations avoids Lambda invocation costs. If Step Functions just needs to write to DynamoDB or send an SNS message, skip Lambda entirely.
:::

---

## Input/Output Processing

### Key Fields

| Field | Purpose | Example |
|---|---|---|
| `InputPath` | Filter input before processing | `"$.order"` — only pass the `order` field |
| `Parameters` | Build the input payload | Construct new JSON from input |
| `ResultSelector` | Filter the task result | Extract specific fields from API response |
| `ResultPath` | Where to place result in original input | `"$.taskResult"` — merge result into input |
| `OutputPath` | Filter final output | `"$.taskResult"` — pass only result downstream |

### Data Flow

```
Original Input → InputPath → Parameters → TASK → ResultSelector → ResultPath → OutputPath → Next State
```

```json
{
  "Type": "Task",
  "Resource": "arn:aws:states:::dynamodb:getItem",
  "InputPath": "$.orderDetails",
  "Parameters": {
    "TableName": "Products",
    "Key": { "productId": { "S.$": "$.productId" } }
  },
  "ResultSelector": {
    "productName.$": "$.Item.name.S",
    "price.$": "$.Item.price.N"
  },
  "ResultPath": "$.product",
  "OutputPath": "$",
  "Next": "CalculateTotal"
}
```

---

## 🏆 Best Practices

### Design
1. **Use direct service integrations** where possible — avoid Lambda for simple CRUD
2. **Keep Lambda functions small** — do one thing per function
3. **Use `ResultPath`** to preserve original input alongside task results
4. **Design for idempotency** — Standard workflows guarantee exactly-once but tasks may retry

### Error Handling
1. **Always add `Retry`** for transient errors on every Task state
2. **Use `States.ALL` as catch-all** as the last Catch entry
3. **Set `TimeoutSeconds`** on every Task to prevent stuck executions
4. **Use `HeartbeatSeconds`** for long-running tasks (ECS, Batch)

### Cost
1. **Use Express workflows** for high-volume, short-duration workflows
2. **Minimize state transitions** — each transition costs $0.025 per 1,000
3. **Use Map state instead of spawning child executions** where possible

---

## 🎯 DVA-C02 Exam Tips

:::tip[Step Functions Exam Cheat Sheet]
1. **Standard vs Express**: Express = 5 min max, at-least-once, high throughput. Standard = 1 year max, exactly-once
2. **Wait for Callback** = `.waitForTaskToken` — use for human approval, external webhooks
3. **Map state** = iterate over array (same logic per item). **Parallel** = different branches concurrently
4. **Distributed Map** = process millions of items from S3
5. **Retry before Catch** — retries are attempted first, then catch handlers
6. **`ResultPath: "$.error"`** in Catch — preserves original input and adds error info
7. **Direct integrations** save Lambda cost — DynamoDB, SNS, SQS, ECS don't need Lambda
8. **Express + API Gateway** = sync request/response for high-throughput APIs
9. **Error types**: `States.ALL` catches everything, `States.Timeout` for timeout
10. **Step Functions vs SQS**: Step Functions = orchestration (order matters). SQS = decoupling (order doesn't matter)
:::

---

## Practice Questions

**Q1.** A workflow needs to process each item in a list in parallel, up to 5 items at a time. Which state type achieves this?

A) `Parallel` state  
B) `Choice` state with conditions  
C) **`Map` state with `MaxConcurrency: 5`**  
D) Multiple `Task` states  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — `Map` iterates over an array, applying the same logic per item. `MaxConcurrency` controls parallelism. `Parallel` runs **different** branches, not the same one per item.
</details>

---

**Q2.** A payment workflow needs to pause for manual approval that may come hours later. Which pattern?

A) `Wait` state with a fixed duration  
B) Poll DynamoDB every minute  
C) **`Task` state with `.waitForTaskToken`**  
D) `Choice` state polling SQS  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — `.waitForTaskToken` pauses the workflow indefinitely. An external system calls `SendTaskSuccess/Failure` with the token to resume. No polling needed.
</details>

---

**Q3.** A Step Functions task retries 3 times with `IntervalSeconds: 2` and `BackoffRate: 2.0`. What are the wait times?

A) 2s, 2s, 2s  
B) **2s, 4s, 8s**  
C) 2s, 6s, 14s  
D) 1s, 2s, 4s  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Each retry waits `IntervalSeconds × BackoffRate^(attempt-1)`: 2×1=2s, 2×2=4s, 2×4=8s.
</details>

---

**Q4.** A workflow needs to write an order to DynamoDB. The team wants minimum cost. What approach?

A) Lambda function that calls DynamoDB SDK  
B) **Direct DynamoDB integration from Step Functions**  
C) API Gateway calling Lambda calling DynamoDB  
D) EventBridge rule triggering Lambda  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Step Functions direct service integration calls DynamoDB without needing a Lambda function, saving Lambda invocation costs.
</details>

---

**Q5.** An Express workflow processes 50,000 events per second. What execution guarantee does it provide?

A) Exactly-once  
B) **At-least-once (async) / At-most-once (sync)**  
C) At-most-once  
D) Best-effort  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Express workflows are async (at-least-once) by default. Sync Express (`StartSyncExecution`) provides at-most-once. Only Standard provides exactly-once.
</details>

---

**Q6.** Where should `States.ALL` be placed in a Catch configuration?

A) **Last — as the catch-all after specific errors**  
B) First — to handle all errors immediately  
C) It doesn't matter — order is not important  
D) States.ALL cannot be used in Catch  

<details>
<summary>✅ Answer & Explanation</summary>

**A** — Catch entries are evaluated in order. `States.ALL` should be **last** so specific errors are caught by their dedicated handlers first.
</details>

---

## 🔗 Resources

- [Step Functions Developer Guide](https://docs.aws.amazon.com/step-functions/latest/dg/)
- [Amazon States Language (ASL)](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html)
- [Step Functions Workflow Studio](https://docs.aws.amazon.com/step-functions/latest/dg/workflow-studio.html)
- [Service Integration Patterns](https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html)
- [Distributed Map](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-asl-use-map-state-distributed.html)
- [Serverless Land Patterns](https://serverlessland.com/patterns?services=step-functions)
