---
id: index
title: AWS CI/CD — CodeCommit, CodeBuild, CodeDeploy & CodePipeline
sidebar_label: "🔄 CI/CD Overview"
description: >
  Complete AWS CI/CD study guide for DVA-C02. CodeCommit, CodeBuild, CodeDeploy
  (deployment strategies), and CodePipeline. Includes blue/green, canary,
  rolling deployments and common exam patterns.
tags:
  - cicd
  - codecommit
  - codebuild
  - codedeploy
  - codepipeline
  - deployment
  - blue-green
  - canary
  - dva-c02
  - domain-3
---

# AWS CI/CD Pipeline

> **Exam Weight**: Domain 3 (Deployment) — 24% of exam. Know each tool's role and deployment strategies cold.

---

## The AWS CI/CD Stack

```
Developer pushes code
        ↓
  [CodeCommit]        ← Source control (Git)
        ↓
  [CodeBuild]         ← Build, test, package (like Jenkins/GitHub Actions)
        ↓
  [CodeDeploy]        ← Deploy to EC2/ECS/Lambda
        ↓
  [CodePipeline]      ← Orchestrates the whole flow
```

---

## CodeCommit

- **Fully managed Git** repository (like GitHub/GitLab, but AWS)
- Authentication: HTTPS (Git credentials or CodeCommit credentials) or SSH
- Integrated with IAM for access control
- Triggers: SNS, Lambda on push/PR events

:::note
AWS announced CodeCommit is no longer accepting new customers (July 2024). For the exam, it's still tested — but in practice, most teams use GitHub/GitLab with CodePipeline.
:::

---

## CodeBuild

### What It Does
- Compiles code, runs tests, produces artifacts
- **No servers to manage** — fully managed
- Uses **build environments** (Docker containers)
- Charges per **build minute**

### buildspec.yml

```yaml
version: 0.2

env:
  variables:
    TABLE_NAME: "orders-table"
  parameter-store:
    DB_PASSWORD: "/prod/myapp/db-password"   # From SSM
  secrets-manager:
    API_KEY: "prod/myapp/api-key"            # From Secrets Manager

phases:
  install:
    runtime-versions:
      java: corretto17
    commands:
      - echo "Installing dependencies..."

  pre_build:
    commands:
      - echo "Running tests..."
      - mvn test

  build:
    commands:
      - echo "Building..."
      - mvn package -DskipTests

  post_build:
    commands:
      - echo "Build complete"
      - aws s3 cp target/app.jar s3://my-artifacts/app.jar

artifacts:
  files:
    - target/app.jar
    - appspec.yml
    - scripts/**/*

cache:
  paths:
    - '/root/.m2/**/*'   # Cache Maven dependencies
```

### Key Features

| Feature | Description |
|---|---|
| **VPC Support** | Run builds inside your VPC to access private resources |
| **Local Builds** | `codebuild_build.sh` for local testing |
| **Test Reports** | JUnit/Cucumber XML → CodeBuild Test Reports |
| **Artifacts to S3** | Build output stored in S3 |
| **Environment Variables** | Plaintext, SSM Parameter Store, Secrets Manager |

---

## CodeDeploy

CodeDeploy automates deployments to:

| Target | Deployment Types Available |
|---|---|
| **EC2 / On-Premises** | In-Place, Blue/Green |
| **ECS** | Blue/Green (Canary, Linear, All-at-once) |
| **Lambda** | Canary, Linear, All-at-once |

### appspec.yml (EC2/On-Premises)

```yaml
version: 0.0
os: linux

files:
  - source: /target/app.jar
    destination: /opt/myapp/

hooks:
  ApplicationStop:
    - location: scripts/stop_server.sh
      timeout: 30
  BeforeInstall:
    - location: scripts/install_dependencies.sh
      timeout: 60
  AfterInstall:
    - location: scripts/configure_app.sh
  ApplicationStart:
    - location: scripts/start_server.sh
      timeout: 60
  ValidateService:
    - location: scripts/health_check.sh
      timeout: 30
```

### Deployment Strategies

#### EC2 In-Place (Rolling)

| Strategy | Description |
|---|---|
| `AllAtOnce` | Deploy to all instances simultaneously — downtime possible |
| `HalfAtATime` | Deploy to 50% at a time |
| `OneAtATime` | Safest — one instance at a time, slowest |
| `Custom` | Define your own percentage |

#### Blue/Green (EC2, ECS, Lambda)

```
Current (Blue): v1.0 — receiving 100% traffic
                    ↓
New (Green): v2.0 — deployed, health checked
                    ↓
Traffic shifted to Green
                    ↓
Blue kept for rollback window (configurable)
```

#### Lambda & ECS Deployment Configurations

```
Canary:
  LambdaCanary10Percent5Minutes   → 10% for 5 min, then 100%
  LambdaCanary10Percent30Minutes  → 10% for 30 min, then 100%

Linear:
  LambdaLinear10PercentEvery1Minute   → +10% every 1 min
  LambdaLinear10PercentEvery10Minutes → +10% every 10 min

All-at-Once:
  LambdaAllAtOnce  → instant 100% (fastest, no safety net)
```

### appspec.yml (Lambda)

```yaml
version: 0.0
Resources:
  - MyLambdaFunction:
      Type: AWS::Lambda::Function
      Properties:
        Name: "OrderProcessor"
        Alias: "live"
        CurrentVersion: "1"
        TargetVersion: "2"

Hooks:
  BeforeAllowTraffic: "PreTrafficCheckFunction"
  AfterAllowTraffic: "PostTrafficCheckFunction"
```

---

## CodePipeline

Orchestrates the full pipeline:

```
Source           Build           Test            Deploy
─────────────────────────────────────────────────────
CodeCommit  →  CodeBuild  →  CodeBuild  →  CodeDeploy
  (or                          (tests)      (or ECS,
 GitHub,                                    Beanstalk,
 S3)                                        CloudFormation)
```

### Key Features

| Feature | Description |
|---|---|
| **Manual Approval** | Pause pipeline for human sign-off before prod deploy |
| **Parallel Actions** | Run multiple build/test stages simultaneously |
| **Cross-Region** | Deploy to multiple regions |
| **Artifacts** | S3 bucket stores outputs between stages |
| **Notifications** | SNS, EventBridge on pipeline state changes |

---

## 🧪 Practice Questions

**Q1.** A team wants to deploy a new Lambda version gradually — send 10% of traffic to the new version for 5 minutes, then promote to 100% if healthy. Which CodeDeploy configuration should they use?

A) `LambdaLinear10PercentEvery1Minute`  
B) `LambdaCanary10Percent5Minutes`  
C) `LambdaAllAtOnce`  
D) `LambdaLinear10PercentEvery10Minutes`  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **Canary** shifts a small % of traffic first, waits, then promotes 100% if healthy. `LambdaCanary10Percent5Minutes` = 10% for 5 minutes → 100%. Linear shifts traffic incrementally in equal steps.
</details>

---

**Q2.** A CodeBuild project needs to fetch a database password from SSM Parameter Store during the build. How should this be configured?

A) Pass the password as a CodeBuild environment variable (plaintext)  
B) Reference it in `buildspec.yml` under `env.parameter-store`  
C) Use a Lambda function to retrieve the password before build  
D) Store the password in the source code repository  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — `buildspec.yml` supports `env.parameter-store` to securely retrieve SSM Parameter Store values at build time. The IAM role for CodeBuild needs `ssm:GetParameters` permission.
</details>

---

**Q3.** During a CodeDeploy deployment to EC2, the `ValidateService` hook fails. What does CodeDeploy do?

A) Continues deployment and logs the failure  
B) Skips the hook and completes deployment  
C) **Rolls back** the deployment to the previous version  
D) Sends a notification but doesn't roll back  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — If any hook (especially `ValidateService`) fails, CodeDeploy **rolls back** to the previous working version automatically.
</details>

---

**Q4.** A CodePipeline needs human approval before deploying to production. Which action type should be added between the staging and production stages?

A) CodeBuild — test stage  
B) **Manual Approval** action  
C) Lambda invoke  
D) SNS notification  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — CodePipeline's built-in **Manual Approval** action pauses the pipeline and sends an SNS notification to approvers. The pipeline proceeds only after approval.
</details>

---

## 🔗 Resources

- [CodeDeploy User Guide](https://docs.aws.amazon.com/codedeploy/latest/userguide/)
- [CodeBuild User Guide](https://docs.aws.amazon.com/codebuild/latest/userguide/)
- [CodePipeline User Guide](https://docs.aws.amazon.com/codepipeline/latest/userguide/)
- [appspec.yml Lambda Reference](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html#appspec-hooks-lambda)
