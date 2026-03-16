---
id: code-pipeline
title: AWS CodePipeline
sidebar_label: "🔁 CodePipeline"
description: >
  AWS CodePipeline for DVA-C02. Stages, actions, artifacts, manual approvals,
  cross-region pipelines, EventBridge integration, and multi-environment
  deployment patterns.
tags:
  - codepipeline
  - cicd
  - pipeline
  - automation
  - dva-c02
  - domain-3
---

# AWS CodePipeline

> **Core concept**: CodePipeline **orchestrates** your entire release process — source → build → test → deploy — end-to-end.

---

## Pipeline Anatomy

```
Stage 1: Source          Stage 2: Build         Stage 3: Deploy
──────────────────       ──────────────────      ──────────────────
Action: CodeCommit    →  Action: CodeBuild    →  Action: CodeDeploy
(output: source.zip)     (output: build.zip)     (to staging)
                                                       ↓
                         Stage 4: Approve       Stage 5: Deploy
                         ──────────────────      ──────────────────
                         Action: Manual      →  Action: CloudFormation
                         Approval                (to production)
```

---

## Action Types

| Category | Providers |
|---|---|
| **Source** | CodeCommit, S3, GitHub, ECR |
| **Build** | CodeBuild, Jenkins |
| **Test** | CodeBuild, Device Farm, third-party |
| **Deploy** | CodeDeploy, Beanstalk, ECS, CloudFormation, S3 |
| **Approval** | Manual approval |
| **Invoke** | Lambda, Step Functions |

---

## Artifact Store

Every stage passes artifacts via **S3**:

```
CodeCommit source → S3 artifact (source.zip)
                                ↓
                     CodeBuild reads → builds → outputs build.zip
                                                        ↓
                                            CodeDeploy reads build.zip
```

S3 artifacts are **encrypted with KMS** for cross-account pipelines.

---

## Manual Approval

```yaml
# CloudFormation
ApprovalStage:
  Type: StageDeclaration
  Name: ManualApproval
  Actions:
    - Name: ApproveProduction
      ActionTypeId:
        Category: Approval
        Owner: AWS
        Provider: Manual
        Version: "1"
      Configuration:
        NotificationArn: !Ref ApprovalSNSTopic
        CustomData: "Review test results at: https://dashboard.example.com"
        ExternalEntityLink: "https://jira.example.com/RELEASE-123"
```

---

## EventBridge Integration

React to pipeline state changes:

```json
// EventBridge rule: alert on pipeline failure
{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "state": ["FAILED"],
    "pipeline": ["my-prod-pipeline"]
  }
}
```

---

## 🧪 Practice Questions

**Q1.** A pipeline needs to deploy to staging automatically, then wait for a human to approve before deploying to production. Which CodePipeline action provides this?

A) A CodeBuild step with approval logic  
B) Lambda function that checks a DynamoDB approval flag  
C) **Manual Approval action** between staging and prod stages  
D) EventBridge rule that pauses the pipeline  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — CodePipeline's built-in **Manual Approval** action pauses execution and sends an SNS notification. The pipeline resumes only when an authorized user approves via console, CLI, or API.
</details>

---

**Q2.** Between stages in a CodePipeline, how are artifacts (build outputs) passed?

A) Directly via Lambda invocation  
B) Via an SQS message  
C) **Via S3 — each stage reads/writes to the pipeline's artifact store bucket**  
D) In-memory within the pipeline  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — CodePipeline uses an **S3 bucket as the artifact store**. Each stage's output is uploaded to S3, and the next stage downloads it. For cross-account pipelines, the S3 bucket and KMS key must allow cross-account access.
</details>

---

## 🔗 Resources

- [CodePipeline User Guide](https://docs.aws.amazon.com/codepipeline/latest/userguide/)
- [CodePipeline Action Reference](https://docs.aws.amazon.com/codepipeline/latest/userguide/reference-pipeline-structure.html)
- [Cross-Account Pipelines](https://docs.aws.amazon.com/codepipeline/latest/userguide/pipelines-create-cross-account.html)
