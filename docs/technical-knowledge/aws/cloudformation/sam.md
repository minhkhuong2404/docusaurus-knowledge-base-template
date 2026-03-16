---
id: sam
title: AWS SAM (Serverless Application Model)
sidebar_label: "🚀 SAM"
description: >
  AWS SAM for DVA-C02. SAM template syntax, simplified resource types,
  sam local for local testing, SAM CLI commands, policy templates,
  and how SAM transforms to CloudFormation.
tags:
  - sam
  - serverless
  - cloudformation
  - iac
  - lambda
  - api-gateway
  - local-testing
  - dva-c02
  - domain-3
---

# AWS SAM — Serverless Application Model

> **Core concept**: SAM is a **superset of CloudFormation** with shorthand syntax for serverless resources. `sam build` + `sam deploy` → CloudFormation stack.

---

## SAM vs CloudFormation

| Feature | SAM | CloudFormation |
|---|---|---|
| Verbosity | Low (3 lines for a Lambda function) | High (20+ lines) |
| Transforms to | CloudFormation | N/A |
| Local testing | ✅ `sam local` | ❌ |
| Serverless focus | ✅ | General-purpose |

---

## SAM Template

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31   # ← Required SAM transform

Globals:
  Function:
    Runtime: java17
    MemorySize: 512
    Timeout: 30
    Environment:
      Variables:
        TABLE_NAME: !Ref OrdersTable

Resources:

  # Simplified Lambda definition (SAM)
  OrderProcessor:
    Type: AWS::Serverless::Function    # SAM resource type
    Properties:
      Handler: com.example.OrderHandler::handleRequest
      CodeUri: target/order-service.jar
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /orders
            Method: POST
        SqsTrigger:
          Type: SQS
          Properties:
            Queue: !GetAtt OrderQueue.Arn
            BatchSize: 10
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref OrdersTable

  # SAM creates API Gateway + Lambda integration automatically
  OrdersTable:
    Type: AWS::Serverless::SimpleTable    # DynamoDB table shorthand
    Properties:
      PrimaryKey:
        Name: orderId
        Type: String

  OrderQueue:
    Type: AWS::SQS::Queue
```

---

## SAM Resource Types

| SAM Type | Expands To |
|---|---|
| `AWS::Serverless::Function` | Lambda + IAM Role + Event Source Mappings |
| `AWS::Serverless::Api` | API Gateway REST API + Deployment + Stage |
| `AWS::Serverless::HttpApi` | API Gateway HTTP API |
| `AWS::Serverless::SimpleTable` | DynamoDB Table (simple PK) |
| `AWS::Serverless::Application` | Nested application from SAR |
| `AWS::Serverless::LayerVersion` | Lambda Layer |
| `AWS::Serverless::StateMachine` | Step Functions state machine |

---

## SAM Policy Templates

Instead of writing full IAM policies:

```yaml
Policies:
  - S3ReadPolicy:
      BucketName: !Ref MyBucket
  - DynamoDBCrudPolicy:
      TableName: !Ref MyTable
  - SQSSendMessagePolicy:
      QueueName: !GetAtt MyQueue.QueueName
  - SNSPublishMessagePolicy:
      TopicName: !GetAtt MyTopic.TopicName
  - VPCAccessPolicy: {}
```

---

## SAM CLI Commands

```bash
# Initialize new project from template
sam init

# Build (compiles Java, resolves dependencies)
sam build

# Local invoke (test single function)
sam local invoke OrderProcessor --event events/order.json

# Local API (starts local API Gateway)
sam local start-api --port 3000

# Local SQS/Kinesis simulation
sam local start-lambda

# Deploy to AWS (guided first time)
sam deploy --guided

# View CloudFormation change set before deploying
sam deploy --no-execute-changeset

# Stream logs
sam logs -n OrderProcessor --stack-name my-stack --tail

# Run unit tests
sam local invoke --event event.json
```

---

## SAM for Java — `sam build`

SAM understands Maven/Gradle:

```yaml
# In template.yaml
OrderProcessor:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: ./          # Project root (pom.xml must be here)
    Handler: com.example.Handler::handleRequest
    Runtime: java17
    BuildMethod: maven   # or gradle
```

```bash
# SAM will run: mvn package -P lambda
sam build
sam local invoke
```

---

## 🧪 Practice Questions

**Q1.** A developer wants to test a Lambda function locally with a simulated API Gateway event before deploying to AWS. What SAM CLI command should they use?

A) `sam deploy --dry-run`  
B) `sam local invoke`  
C) `sam local start-api`  
D) `sam test`  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — `sam local start-api` starts a local HTTP server that simulates API Gateway and invokes the Lambda function for each request. `sam local invoke` is for direct function invocation without HTTP.
</details>

---

**Q2.** What is the required CloudFormation transform declaration for a SAM template?

A) `Transform: AWS::SAM-2016-10-31`  
B) `Transform: AWS::Serverless-2016-10-31`  
C) `Version: SAM-2016`  
D) `SAMVersion: "2016-10-31"`  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — The exact string is `Transform: AWS::Serverless-2016-10-31`. Missing this causes the SAM resource types to be unrecognized by CloudFormation.
</details>

---

## 🔗 Resources

- [SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/)
- [SAM CLI Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [SAM Policy Templates](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-policy-templates.html)
- [AWS Serverless Application Repository](https://serverlessrepo.aws.amazon.com/)
