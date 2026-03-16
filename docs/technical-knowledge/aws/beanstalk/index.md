---
id: index
title: AWS Elastic Beanstalk
sidebar_label: "🌱 Elastic Beanstalk"
description: >
  Elastic Beanstalk for DVA-C02. Deployment policies (All at once, Rolling,
  Rolling with additional batch, Immutable, Blue/Green), .ebextensions,
  environment tiers, platform versions, and Java Spring Boot deployment.
tags:
  - elastic-beanstalk
  - beanstalk
  - deployment
  - java
  - spring-boot
  - rolling
  - blue-green
  - dva-c02
  - domain-3
---

# AWS Elastic Beanstalk

> **Core concept**: Beanstalk is a **PaaS** — you upload your code (WAR/JAR), and AWS handles EC2, Auto Scaling, Load Balancer, and RDS provisioning.

---

## What Beanstalk Manages

```
You provide: Application code (JAR/WAR/ZIP)
Beanstalk provides:
  ├── EC2 instances (with Java runtime)
  ├── Auto Scaling Group
  ├── Load Balancer (ALB or CLB)
  ├── RDS (optional, not recommended for prod)
  ├── CloudWatch monitoring
  └── Deployment automation
```

:::note Still uses CloudFormation under the hood
Every Beanstalk environment is backed by a CloudFormation stack.
:::

---

## Environment Tiers

| Tier | Use Case | Infrastructure |
|---|---|---|
| **Web Server** | Handle HTTP requests | ELB + EC2 + Auto Scaling |
| **Worker** | Process background tasks from SQS | EC2 + SQS (no ELB) |

---

## Supported Java Platforms

- **Corretto 17 / 21** (Amazon-managed Java)
- **Tomcat** (deploy WAR files)
- **Docker** (any JVM version)
- **Multi-container Docker** (ECS under the hood)

---

## Deployment Policies

### 1. All at Once (Default)
```
[v1][v1][v1] → [v2][v2][v2]
```
- **Fastest**, but causes **downtime**
- Good for dev/test only

### 2. Rolling
```
[v1][v1][v1][v1]
→ [v2][v2][v1][v1]   ← batch 1 updating
→ [v2][v2][v2][v2]   ← batch 2 updating
```
- No downtime, reduced capacity during deployment
- If deploy fails: complex partial state to fix

### 3. Rolling with Additional Batch
```
[v1][v1][v1][v1]
→ [v1][v1][v1][v1][v2][v2]   ← add batch first
→ [v2][v2][v1][v1][v2][v2]
→ [v2][v2][v2][v2]            ← remove extra batch
```
- **Full capacity maintained** throughout
- Higher cost temporarily (extra instances)

### 4. Immutable
```
New ASG with v2 instances (all pass health check)
→ Swap into main ASG
→ Terminate old instances
```
- **Zero downtime**, fastest rollback (just terminate new ASG)
- Most expensive — doubles instance count temporarily

### 5. Blue/Green (Traffic Splitting)
```
Blue env (v1): 100% traffic
     ↓
Green env (v2): deployed, tested
     ↓
Swap CNAMEs (or weighted routing)
     ↓
Green: 100% traffic | Blue: kept for rollback
```
- Complete environment swap
- Rollback = swap CNAME back
- **Not a Beanstalk native feature** — done via Route 53 or swap URL

---

## Deployment Policy Comparison

| Policy | Downtime | Rollback Speed | Cost | Capacity |
|---|---|---|---|---|
| All at once | ✅ Yes | Re-deploy | Lowest | Full → Zero |
| Rolling | ❌ | Re-deploy | Normal | Reduced |
| Rolling + batch | ❌ | Re-deploy | Higher | Full |
| Immutable | ❌ | **Fast** (terminate) | **Highest** | Full → 2x |
| Blue/Green | ❌ | **Instant** (CNAME) | **2x** | Full |

---

## .ebextensions

Customize the environment with config files in `.ebextensions/` directory:

```yaml
# .ebextensions/jvm.config
option_settings:
  aws:elasticbeanstalk:container:java:jvmoptions:
    JVM Options: "-Xms512m -Xmx1024m -XX:+UseG1GC"

# .ebextensions/env.config
option_settings:
  aws:elasticbeanstalk:application:environment:
    SPRING_PROFILES_ACTIVE: prod
    DB_URL: "jdbc:postgresql://mydb.rds.amazonaws.com:5432/orders"
```

```yaml
# .ebextensions/cloudwatch.config — install CW agent
packages:
  yum:
    amazon-cloudwatch-agent: []
commands:
  01_start_cwagent:
    command: "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start"
```

---

## Procfile (Java)

```
# Procfile — at root of deployment ZIP
web: java -jar target/myapp.jar --server.port=5000
```

---

## Spring Boot Deployment

```bash
# Build JAR
mvn clean package

# Deploy via CLI
eb init my-app --region us-east-1 --platform corretto-17
eb create prod-env
eb deploy

# Or deploy JAR directly
eb deploy --staged
```

---

## 🧪 Practice Questions

**Q1.** A developer needs to deploy a new version to Elastic Beanstalk with **no downtime** and the ability to **instantly roll back** if issues are found. Which deployment policy is BEST?

A) Rolling  
B) All at Once  
C) Rolling with Additional Batch  
D) **Immutable**  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — **Immutable** deploys to a fresh set of instances. If anything is wrong, just terminate the new Auto Scaling Group — the old instances keep running. It's the fastest rollback of any in-place deployment strategy.

(Blue/Green is also valid but is more complex to set up.)
</details>

---

**Q2.** A Beanstalk deployment must maintain **full capacity throughout** the deployment (no reduced capacity). The cost of extra instances during deployment is acceptable. Which policy?

A) Rolling  
B) All at Once  
C) **Rolling with Additional Batch**  
D) Immutable  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Rolling with Additional Batch** adds extra instances first (maintaining full capacity), updates old batches, then removes the extras. Full capacity throughout, at a slightly higher temporary cost.
</details>

---

**Q3.** Where should Elastic Beanstalk environment configuration (JVM options, environment variables) be placed in the application package?

A) `application.properties`  
B) `beanstalk.yml`  
C) `.ebextensions/*.config` YAML files  
D) Lambda environment variables  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Beanstalk reads configuration from YAML/JSON files in the `.ebextensions/` directory in your deployment package. These configure option settings, run commands, install packages, etc.
</details>

---

## 🔗 Resources

- [Elastic Beanstalk Developer Guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/)
- [Beanstalk Deployment Policies](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.rolling-version-deploy.html)
- [Deploying Spring Boot to Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_Java.html)
- [.ebextensions Reference](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/ebextensions.html)
