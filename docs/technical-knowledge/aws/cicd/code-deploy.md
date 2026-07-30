---
id: code-deploy
title: AWS CodeDeploy
sidebar_label: "🚀 CodeDeploy"
description: >
  AWS CodeDeploy deep dive for DVA-C02. Deployment groups, lifecycle hooks,
  rollbacks, appspec.yml for EC2, Lambda, and ECS, blue/green deployments,
  deployment configurations, and traffic shifting strategies.
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

> **Core concept**: CodeDeploy automates application deployments to EC2, Lambda, and ECS with traffic shifting, rollback, and lifecycle hooks.

---

## 🔰 What Is CodeDeploy?

CodeDeploy is like a smart deployment manager. Instead of manually updating your servers one by one, CodeDeploy orchestrates the rollout — shifting traffic gradually, running health checks, and automatically rolling back if something goes wrong.

---

## Deployment Targets

| Platform | Deployment Type | Agent | Traffic Control |
|---|---|---|---|
| **EC2/On-Premises** | In-place or Blue/Green | ✅ CodeDeploy Agent | ASG, tags |
| **Lambda** | Traffic shifting (aliases) | ❌ Not needed | Alias routing |
| **ECS** | Blue/Green (ALB) | ❌ Not needed | Target group swap |

---

## Deployment Strategies

### EC2 Deployment Strategies

| Strategy | Description | Downtime |
|---|---|---|
| **AllAtOnce** | Deploy to all instances simultaneously | ⚠️ Brief |
| **HalfAtATime** | Deploy to 50% of instances, then remaining | Minimal |
| **OneAtATime** | Deploy to one instance at a time | None |
| **Blue/Green** | Create new ASG, shift ALB traffic | None |

### Lambda Deployment Configurations

| Configuration | Behavior |
|---|---|
| **LambdaAllAtOnce** | Shift 100% traffic immediately |
| **LambdaCanary10Percent5Minutes** | 10% → wait 5 min → 90% |
| **LambdaCanary10Percent10Minutes** | 10% → wait 10 min → 90% |
| **LambdaCanary10Percent15Minutes** | 10% → wait 15 min → 90% |
| **LambdaCanary10Percent30Minutes** | 10% → wait 30 min → 90% |
| **LambdaLinear10PercentEvery1Minute** | 10% → 20% → ... → 100% (every 1 min) |
| **LambdaLinear10PercentEvery2Minutes** | 10% → 20% → ... → 100% (every 2 min) |
| **LambdaLinear10PercentEvery3Minutes** | 10% → 20% → ... → 100% (every 3 min) |
| **LambdaLinear10PercentEvery10Minutes** | 10% → 20% → ... → 100% (every 10 min) |

:::tip[Canary vs Linear]
- **Canary** = shift small %, wait, then shift ALL remaining
- **Linear** = shift same % at regular intervals until 100%
:::

### ECS Deployment Configurations

| Configuration | Behavior |
|---|---|
| **ECSAllAtOnce** | Shift 100% immediately |
| **ECSCanary10Percent5Minutes** | Same as Lambda canary |
| **ECSLinear10PercentEvery1Minute** | Same as Lambda linear |

---

## Lifecycle Hooks

### EC2/On-Premises Hook Order

```
ApplicationStop        ← Stop current app
    ↓
DownloadBundle         ← Download new revision from S3/GitHub
    ↓
BeforeInstall          ← Pre-install tasks (backup, decrypt)
    ↓
Install                ← Copy files to destination
    ↓
AfterInstall           ← Post-install (set permissions, config)
    ↓
ApplicationStart       ← Start the application
    ↓
ValidateService        ← Run health checks ← MOST IMPORTANT
```

### Lambda Hook Order

```
BeforeAllowTraffic     ← Run pre-traffic validation Lambda
    ↓
AllowTraffic           ← Traffic shifted to new version
    ↓
AfterAllowTraffic      ← Run post-traffic validation Lambda
```

### Pre-Traffic Hook Example (Lambda)

```java
public class PreTrafficHook implements RequestHandler<Map<String, Object>, Void> {
    
    private final CodeDeployClient codeDeploy = CodeDeployClient.create();
    
    public Void handleRequest(Map<String, Object> event, Context context) {
        String deploymentId = (String) event.get("DeploymentId");
        String lifecycleEventHookExecutionId = (String) event.get("LifecycleEventHookExecutionId");
        
        String status = "Succeeded";
        try {
            // Test the new Lambda version
            invokeNewVersion();
            validateResponse();
        } catch (Exception e) {
            status = "Failed";  // This triggers automatic rollback
        }
        
        codeDeploy.putLifecycleEventHookExecutionStatus(
            PutLifecycleEventHookExecutionStatusRequest.builder()
                .deploymentId(deploymentId)
                .lifecycleEventHookExecutionId(lifecycleEventHookExecutionId)
                .status(status)
                .build());
        
        return null;
    }
}
```

---

## appspec.yml

### Lambda

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
  - BeforeAllowTraffic: "arn:aws:lambda:us-east-1:123:function:PreTrafficHook"
  - AfterAllowTraffic: "arn:aws:lambda:us-east-1:123:function:PostTrafficHook"
```

### EC2

```yaml
version: 0.0
os: linux
files:
  - source: /
    destination: /var/www/html
permissions:
  - object: /var/www/html
    owner: apache
    group: apache
    mode: "755"
hooks:
  ApplicationStop:
    - location: scripts/stop-server.sh
      timeout: 120
  BeforeInstall:
    - location: scripts/install-deps.sh
      timeout: 300
  AfterInstall:
    - location: scripts/set-permissions.sh
  ApplicationStart:
    - location: scripts/start-server.sh
      timeout: 120
  ValidateService:
    - location: scripts/health-check.sh
      timeout: 60
```

### ECS Blue/Green

```yaml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "arn:aws:ecs:us-east-1:123:task-definition/my-task:2"
        LoadBalancerInfo:
          ContainerName: "api-container"
          ContainerPort: 8080
Hooks:
  - BeforeInstall: "LambdaValidateDatabases"
  - AfterInstall: "LambdaRunIntegrationTests"
  - AfterAllowTestTraffic: "LambdaVerifyGreenTargetGroup"
  - BeforeAllowTraffic: "LambdaCheckHealth"
  - AfterAllowTraffic: "LambdaVerifyProductionShifting"
```

---

## Rollback Behavior

| Trigger | Rollback |
|---|---|
| Any lifecycle hook fails | ✅ Automatic |
| CloudWatch alarm breached | ✅ Automatic (if configured) |
| Manual trigger | ✅ Via console/CLI |

:::tip[Important]
CodeDeploy "rollback" = **redeploy the previous revision**. It doesn't reverse changes — it deploys the old version as a new deployment.
:::

---

## Deployment Groups

| Config | Description |
|---|---|
| **Deployment group** | Target instances (EC2 tags, ASG, ECS service) |
| **Deployment config** | Traffic shifting strategy |
| **Service role** | IAM role for CodeDeploy |
| **Alarms** | CloudWatch alarms that trigger rollback |
| **Triggers** | SNS notifications on deployment events |
| **Auto-rollback** | Enable/disable on failure or alarm |

---

## 🎯 DVA-C02 Exam Tips

:::tip[CodeDeploy Exam Cheat Sheet]
1. **Canary** = shift small %, wait, shift rest. **Linear** = gradual increment
2. **Hook failure** = automatic rollback
3. **Rollback** = redeploy previous version (new deployment)
4. **EC2** supports in-place AND blue/green. **ECS** = blue/green only
5. **Lambda** uses aliases for traffic shifting
6. **BeforeAllowTraffic** = pre-traffic validation (Lambda platform)
7. **ValidateService** = health check (EC2 platform)
8. **appspec.yml** = mandatory deployment specification file
9. **CodeDeploy Agent** needed on EC2, NOT needed for Lambda/ECS
10. **ECS blue/green** requires ALB with two target groups
:::

---

## Practice Questions

**Q1.** ValidateService hook fails. What happens?

A) Deployment marked failed, no rollback  
B) **Automatic rollback to previous version**  
C) Hook retries 3 times  
D) Deployment continues with warning  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Any hook failure triggers automatic rollback by redeploying the last successful version.
</details>

---

**Q2.** 10% traffic to new Lambda, wait 5 min, then 100%. Which config?

A) LambdaLinear10PercentEvery1Minute  
B) LambdaAllAtOnce  
C) **LambdaCanary10Percent5Minutes**  
D) LambdaBlueGreen  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Canary10Percent5Minutes: 10% immediate → monitor 5 min → shift remaining 90%.
</details>

---

**Q3.** ECS Fargate needs zero-downtime deployment. Which strategy?

A) In-place  
B) Rolling update  
C) **Blue/Green with ALB target group swap**  
D) AllAtOnce  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — ECS Fargate with CodeDeploy supports only Blue/Green via ALB target group swapping.
</details>

---

## 🔗 Resources

- [CodeDeploy User Guide](https://docs.aws.amazon.com/codedeploy/latest/userguide/)
- [appspec.yml Reference](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html)
- [Deployment Configurations](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-configurations.html)
