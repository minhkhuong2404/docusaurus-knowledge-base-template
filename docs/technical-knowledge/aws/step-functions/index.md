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

> **Core concept**: Step Functions orchestrate multi-step workflows using **state machines** — coordinate Lambda, SQS, DynamoDB, ECS, and 200+ AWS services.

---

## Standard vs Express Workflows

| Feature | Standard | Express |
|---|---|---|
| **Max duration** | 1 year | 5 minutes |
| **Execution model** | Exactly-once | At-least-once |
| **Execution history** | Full history in console | CloudWatch Logs only |
| **Pricing** | Per state transition | Per execution + duration |
| **Use case** | Long-running business processes | High-volume, short workflows |

---

## State Types

| State | Purpose |
|---|---|
| `Task` | Do work (invoke Lambda, call API, etc.) |
| `Choice` | Branch based on conditions |
| `Wait` | Pause for a duration or until a timestamp |
| `Parallel` | Execute branches simultaneously |
| `Map` | Iterate over an array |
| `Pass` | Pass input to output (for testing/transformation) |
| `Succeed` | End the workflow successfully |
| `Fail` | End the workflow with an error |

---

## State Machine Definition (ASL)

```json
{
  "Comment": "Order Processing Workflow",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123:function:ValidateOrder",
      "Next": "ProcessPayment",
      "Catch": [{
        "ErrorEquals": ["ValidationError"],
        "Next": "SendFailureNotification"
      }]
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123:function:ProcessPayment",
      "Retry": [{
        "ErrorEquals": ["States.TaskFailed"],
        "IntervalSeconds": 2,
        "MaxAttempts": 3,
        "BackoffRate": 2.0
      }],
      "Next": "IsPaymentApproved"
    },
    "IsPaymentApproved": {
      "Type": "Choice",
      "Choices": [{
        "Variable": "$.paymentStatus",
        "StringEquals": "APPROVED",
        "Next": "FulfillOrder"
      }],
      "Default": "SendPaymentFailed"
    },
    "FulfillOrder": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "UpdateInventory",
          "States": {
            "UpdateInventory": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:...:UpdateInventory",
              "End": true
            }
          }
        },
        {
          "StartAt": "SendConfirmationEmail",
          "States": {
            "SendConfirmationEmail": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:...:SendEmail",
              "End": true
            }
          }
        }
      ],
      "End": true
    }
  }
}
```

---

## Error Handling

### Retry

```json
"Retry": [{
  "ErrorEquals": ["Lambda.ServiceException", "Lambda.TooManyRequestsException"],
  "IntervalSeconds": 1,
  "MaxAttempts": 3,
  "BackoffRate": 2.0   // 1s, 2s, 4s
}]
```

### Catch

```json
"Catch": [{
  "ErrorEquals": ["PaymentDeclined"],
  "ResultPath": "$.error",   // Preserve error info
  "Next": "HandlePaymentError"
}]
```

---

## Wait for Callback Pattern

For human approval or external system responses:

```json
"WaitForHumanApproval": {
  "Type": "Task",
  "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
  "Parameters": {
    "FunctionName": "SendApprovalEmail",
    "Payload": {
      "taskToken.$": "$$.Task.Token",
      "orderId.$": "$.orderId"
    }
  },
  "TimeoutSeconds": 86400,
  "Next": "ProcessApproval"
}
```

The Lambda sends a `taskToken` to the approver. They call `SendTaskSuccess` / `SendTaskFailure` to resume the workflow.

---

## Map State (Parallel Processing)

```json
"ProcessAllOrders": {
  "Type": "Map",
  "ItemsPath": "$.orders",
  "MaxConcurrency": 10,
  "Iterator": {
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

---

## 🧪 Practice Questions

**Q1.** A workflow needs to process each item in a list in parallel, up to 5 items at a time. Which state type achieves this?

A) `Parallel` state  
B) `Choice` state with conditions  
C) **`Map` state** with `MaxConcurrency: 5`  
D) Multiple `Task` states  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — The **Map** state iterates over an array, applying the same workflow to each item. `MaxConcurrency` controls parallelism. `Parallel` runs different branches simultaneously, not the same branch for each item.
</details>

---

**Q2.** A payment workflow needs to pause and wait for a manual approval that may come hours later via an API call. Which pattern enables this?

A) `Wait` state with a fixed duration  
B) Poll DynamoDB every minute for approval  
C) **`Task` state with `.waitForTaskToken`** (Callback pattern)  
D) `Choice` state polling an SQS queue  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — The **Callback pattern** (`waitForTaskToken`) pauses the workflow indefinitely. An external system calls `SendTaskSuccess` or `SendTaskFailure` with the token to resume. No polling, no fixed wait time.
</details>

---

## 🔗 Resources

- [Step Functions Developer Guide](https://docs.aws.amazon.com/step-functions/latest/dg/)
- [Amazon States Language (ASL)](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html)
- [Step Functions Workflow Studio](https://docs.aws.amazon.com/step-functions/latest/dg/workflow-studio.html)
- [Serverless Land Step Functions Patterns](https://serverlessland.com/patterns?services=step-functions)
