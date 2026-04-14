---
id: code-deploy
title: AWS CodeDeploy
sidebar_label: "🚀 CodeDeploy"
description: >
  AWS CodeDeploy deep dive for DVA-C02. Deployment groups, lifecycle hooks,
  rollbacks, appspec.yml for EC2 and Lambda, blue/green deployments,
  and integration with ECS.
tags:
  - codedeploy
  - deployment
  - blue-green
  - canary
  - rollback
  - hooks
  - appspec
  - dva-c02
  - domain-3
---

# AWS CodeDeploy

---

## Deployment Lifecycle Event Hooks

### EC2/On-Premises Hook Order

```
ApplicationStop
     ↓
DownloadBundle
     ↓
BeforeInstall
     ↓
Install
     ↓
AfterInstall
     ↓
ApplicationStart
     ↓
ValidateService     ← Run health checks here
```

### Lambda Hook Order

```
BeforeAllowTraffic   ← Run pre-traffic validation Lambda
     ↓
AllowTraffic         ← Traffic shifted to new version
     ↓
AfterAllowTraffic    ← Run post-traffic validation Lambda
```

---

## Rollback Behavior

| Trigger | Rollback? |
|---|---|
| Deployment failure (any hook fails) | ✅ Automatic |
| CloudWatch Alarm threshold breached | ✅ Automatic (if configured) |
| Manual rollback | ✅ Manual via console/CLI |

:::tip
CodeDeploy "rollback" redeploys the **previous revision**, it doesn't reverse the deployment — it deploys the old version again.
:::

---

## appspec.yml — Lambda

```yaml
version: 0.0
Resources:
  - MyLambdaFunction:
      Type: AWS::Lambda::Function
      Properties:
        Name: "OrderProcessor"
        Alias: "live"
        CurrentVersion: !Sub "${LambdaVersion1}"
        TargetVersion: !Sub "${LambdaVersion2}"
Hooks:
  - BeforeAllowTraffic: !Sub "arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:PreTrafficHook"
  - AfterAllowTraffic: !Sub "arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:PostTrafficHook"
```

---

## appspec.yaml — ECS (Blue/Green)

CodeDeploy is the standard tool for safely performing Blue/Green deployments for ECS Fargate containers. CodeDeploy shifts traffic on the Application Load Balancer from the Blue target group to the Green target group.

```yaml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "arn:aws:ecs:region:account-id:task-definition/my-task:2"
        LoadBalancerInfo:
          ContainerName: "api-container"
          ContainerPort: 8080
Hooks:
  - BeforeInstall: "LambdaFunctionToValidateDatabases"
  - AfterInstall: "LambdaFunctionToRunIntegrationTests"
  - AfterAllowTestTraffic: "LambdaFunctionToVerifyGreenTargetGroup"
  - BeforeAllowTraffic: "LambdaFunctionToCheckHealth"
  - AfterAllowTraffic: "LambdaFunctionToVerifyProductionShifting"
```

---

## Deployment Group

| Config | Description |
|---|---|
| **Deployment group** | Target instances (by EC2 tags, ASG, or ECS service) |
| **Deployment config** | Traffic shifting strategy |
| **Service role** | IAM role for CodeDeploy |
| **Alarms** | CloudWatch alarms that trigger rollback |
| **Triggers** | SNS on deployment events |

---

## 🎯 DVA-C02 Exam Tips

:::tip
Quick Exam Rules
:::
- **Rollbacks**: If any lifecycle hook fails (especially `ValidateService`), CodeDeploy will **automatically roll back** to the last known good version.
- **In-place vs Blue/Green**: EC2 supports in-place and blue/green. **ECS Fargate only supports Blue/Green deployments** (via ALB traffic shifting).
- **Lambda Hooks**: For Lambda, use `BeforeAllowTraffic` and `AfterAllowTraffic`.
- **EC2 vs Lambda**: For EC2, CodeDeploy installs the agent on the instance. For Lambda, it manages versions and aliases.
:::

---

## 🧪 Practice Questions

**Q1.** A CodeDeploy deployment fails during the `ValidateService` hook. What happens next?

A) Deployment is marked failed but no rollback  
B) **CodeDeploy rolls back to the previous version**  
C) CodeDeploy retries the hook 3 times  
D) CodeDeploy skips the hook and continues  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Any hook failure causes CodeDeploy to **automatically roll back** to the last successful deployment.
</details>

---

**Q2.** Which CodeDeploy deployment configuration sends 10% of traffic to a new Lambda version, waits 5 minutes monitoring CloudWatch alarms, then shifts 100%?

A) `LambdaLinear10PercentEvery1Minute`  
B) `LambdaAllAtOnce`  
C) `LambdaCanary10Percent5Minutes`  
D) `LambdaBlueGreen`  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Canary10Percent5Minutes** = shift 10% traffic → monitor for 5 minutes → if healthy, shift remaining 90%.
</details>

---

## 🔗 Resources

- [CodeDeploy User Guide](https://docs.aws.amazon.com/codedeploy/latest/userguide/)
- [appspec.yml Lambda Reference](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html)
- [CodeDeploy Deployment Configurations](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-configurations.html)
