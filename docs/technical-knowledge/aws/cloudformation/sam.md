---
id: sam
title: AWS Serverless Application Model (SAM)
sidebar_label: "🚀 AWS SAM"
description: >
  AWS SAM for DVA-C02. SAM template syntax, safe deployments (CodeDeploy),
  sam local testing, SAM CLI commands (build, deploy, sync), policy templates,
  and how SAM transforms to CloudFormation.
tags:
  - sam
  - serverless
  - cloudformation
  - iac
  - lambda
  - api-gateway
  - local-testing
  - safe-deployments
  - dva-c02
  - domain-3
---

# AWS SAM (Serverless Application Model)

> **Core concept**: SAM is an open-source framework and a **superset of CloudFormation** designed specifically for serverless applications. It uses shorthand syntax that expands into full CloudFormation resources during deployment. 

---

## SAM vs CloudFormation

| Feature              | AWS SAM                                                     | AWS CloudFormation                                               |
| -------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| **Verbosity**        | Low (A few lines expands into IAM roles, APIs, and Lambdas) | High (Requires explicit definition of every underlying resource) |
| **Execution**        | Transforms into standard CloudFormation under the hood.     | Native execution.                                                |
| **Local Testing**    | ✅ Native support via `sam local` (uses Docker).             | ❌ Not supported natively.                                        |
| **Primary Use Case** | Serverless workloads (Lambda, API Gateway, DynamoDB).       | General-purpose AWS infrastructure.                              |

---

## SAM Template Anatomy

A SAM template requires a specific `Transform` directive to tell AWS how to process the shorthand syntax.

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31   # ← MANDATORY: Tells CFN this is a SAM template

# The Globals section prevents repetitive configuration
Globals:
  Function:
    Runtime: java21
    MemorySize: 512
    Timeout: 30
    Environment:
      Variables:
        TABLE_NAME: !Ref OrdersTable

Resources:
  # Simplified Lambda definition
  OrderProcessor:
    Type: AWS::Serverless::Function    # SAM-specific resource type
    Properties:
      Handler: com.example.OrderHandler::handleRequest
      CodeUri: target/order-service.jar
      
      # Implicit API Gateway Creation
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /orders
            Method: POST
            
      # SAM Policy Templates (Scoping permissions easily)
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref OrdersTable

  # Simplified DynamoDB Table
  OrdersTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      PrimaryKey:
        Name: orderId
        Type: String
```

---

## SAM Resource Types

Whenever you use one of these types, SAM generates all the required supporting infrastructure (like IAM execution roles, API Gateway Stages, and Lambda permissions).

| SAM Type                        | Expands To                                                            |
| ------------------------------- | --------------------------------------------------------------------- |
| `AWS::Serverless::Function`     | Lambda Function + IAM Execution Role + Event Source Mappings          |
| `AWS::Serverless::Api`          | API Gateway REST API + Deployment + Stage                             |
| `AWS::Serverless::HttpApi`      | API Gateway HTTP API + Stage                                          |
| `AWS::Serverless::SimpleTable`  | DynamoDB Table (Limited to a simple Partition Key)                    |
| `AWS::Serverless::Application`  | A nested application from the Serverless Application Repository (SAR) |
| `AWS::Serverless::LayerVersion` | Lambda Layer                                                          |
| `AWS::Serverless::StateMachine` | AWS Step Functions state machine                                      |

---

## Safe Deployments (Highly Testable!)

SAM integrates directly with **AWS CodeDeploy** to perform gradual traffic shifting (Canary or Linear deployments) for Lambda functions. 

To enable safe deployments, you only need to add two lines to your `AWS::Serverless::Function` properties:

```yaml
    Properties:
      # 1. SAM automatically creates a Lambda Alias (named 'live') and points it to the latest version
      AutoPublishAlias: live 
      
      # 2. SAM automatically creates a CodeDeploy application to shift traffic
      DeploymentPreference:
        Type: Canary10Percent10Minutes 
        # Other options: Linear10PercentEvery1Minute, AllAtOnce
        
        # (Optional) Pre-traffic and Post-traffic hooks for testing
        Hooks:
          PreTraffic: !Ref PreTrafficLambdaFunction
          PostTraffic: !Ref PostTrafficLambdaFunction
```

:::tip Exam Scenario: Pre-Traffic Hooks
If a `PreTraffic` hook Lambda function fails its tests and returns a "Failed" status to CodeDeploy, the deployment is **instantly rolled back**, and no traffic is shifted to the new Lambda version.
:::

---

## SAM CLI Commands (The Development Workflow)

The SAM CLI is heavily tested on the DVA-C02 exam. You must know the difference between building, syncing, deploying, and local testing.

### 1. Building and Deploying
| Command               | Purpose                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `sam init`            | Scaffolds a new project from a quick-start template.                                                                                      |
| `sam build`           | Compiles your code (e.g., runs Maven/Gradle for Java) and prepares the deployment artifacts in the `.aws-sam` folder.                     |
| `sam package`         | Zips your code and uploads it to an S3 bucket. (Largely replaced by `sam deploy --guided`).                                               |
| `sam deploy --guided` | Prompts you for stack names, regions, and parameters, then saves them to a `samconfig.toml` file. Packages and deploys to CloudFormation. |

### 2. Accelerated Development (`sam sync`)
:::info `sam sync` vs `sam deploy`
`sam deploy` goes through the slow CloudFormation stack update process. `sam sync --watch` bypasses CloudFormation for code-only updates, updating the Lambda API directly in seconds. **Only use `sam sync` in development environments.**
:::

### 3. Local Testing (Requires Docker)
| Command                           | Purpose                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sam local invoke "FunctionName"` | Runs your Lambda function locally once.                                                                                                                       |
| `sam local start-api`             | Spawns a local HTTP server that simulates API Gateway. Great for testing REST endpoints via Postman or curl.                                                  |
| `sam local start-lambda`          | Starts a local endpoint that emulates the AWS Lambda invoke API.                                                                                              |
| `sam local generate-event`        | Generates sample JSON payloads for various AWS services (e.g., `sam local generate-event s3 put` outputs a fake S3 upload event to test your Lambda against). |

---

## SAM Policy Templates

Instead of writing verbose IAM policy documents, AWS SAM provides predefined templates scoped to specific resources.

```yaml
Policies:
  - S3ReadPolicy:
      BucketName: !Ref MyBucket
  - DynamoDBCrudPolicy:
      TableName: !Ref MyTable
  - SQSSendMessagePolicy:
      QueueName: !GetAtt MyQueue.QueueName
```

---

## 🧪 Practice Questions

**Q1.** A developer is writing an AWS SAM template and wants to ensure that all AWS Lambda functions defined in the template default to a timeout of 30 seconds and use the `java21` runtime. What is the most efficient way to achieve this?

A) Define `Timeout` and `Runtime` in the `Parameters` section and reference them in every function.  
B) Use the `Globals` section at the top of the template to define `Timeout` and `Runtime` under the `Function` key.  
C) Create an AWS Systems Manager Parameter and reference it dynamically.  
D) Use a SAM Policy Template to enforce the configuration.  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — The `Globals` section in a SAM template is explicitly designed to define properties common to all Serverless Functions, APIs, or SimpleTables in the template, reducing code duplication.
</details>

---

**Q2.** A developer wants to test a Lambda function locally. The function expects an event payload from Amazon S3 when a new object is created. The developer does not know the exact JSON structure of an S3 event. Which SAM CLI command should they use to acquire this structure?

A) `sam local start-lambda s3`  
B) `sam build --template s3`  
C) `sam local invoke --mock s3`  
D) `sam local generate-event s3 put`  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — `sam local generate-event` is a built-in utility that generates sample JSON event payloads for over 50 AWS services, which you can pipe into a file or directly into `sam local invoke`.
</details>

---

**Q3.** A team wants to implement gradual deployments for a new AWS SAM Lambda function. They want to shift 10% of the traffic to the new version, wait 10 minutes, and if no errors occur, shift the remaining traffic. What configuration is required in the SAM template?

A) Add an Application Load Balancer in the `Resources` section with traffic splitting rules.  
B) Use the `AutoPublishAlias` property and set `DeploymentPreference` to `Canary10Percent10Minutes`.  
C) Add an `AWS::CodeDeploy::DeploymentGroup` resource and map it to the Lambda function.  
D) Write a custom Lambda Custom Resource to modify the API Gateway weights.  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — By simply defining `AutoPublishAlias` and a `DeploymentPreference` inside the `AWS::Serverless::Function` properties, SAM automatically provisions the necessary CodeDeploy resources under the hood to handle the traffic shifting.
</details>

---

**Q4.** A developer is rapidly iterating on a Lambda function's code in their IDE. They want their changes to be reflected in their AWS dev environment as quickly as possible without waiting for CloudFormation stack updates. Which command should they use?

A) `sam deploy --no-execute-changeset`  
B) `sam build --cached`  
C) `sam sync --watch`  
D) `sam local start-api`  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — `sam sync --watch` monitors your file system for changes. If you only change code (not infrastructure), it bypasses CloudFormation and uses AWS APIs to update the Lambda function directly, drastically reducing the deployment time during development.
</details>

---

## 🔗 Resources

- [SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/)
- [SAM CLI Command Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [SAM Safe Deployments (Traffic Shifting)](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/automating-updates-to-serverless-apps.html)
- [SAM Policy Templates Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-policy-templates.html)
- [SAM Template Anatomy and Globals](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification-template-anatomy.html)
