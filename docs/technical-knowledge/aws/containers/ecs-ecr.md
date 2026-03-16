---
id: ecs-ecr
title: ECS & ECR — Containers on AWS
sidebar_label: "🐳 ECS & ECR"
description: >
  Amazon ECS and ECR for DVA-C02. EC2 vs Fargate launch types, task
  definitions, services, IAM roles for tasks, service auto scaling,
  ECR image management, and integration with CodePipeline.
tags:
  - ecs
  - ecr
  - containers
  - docker
  - fargate
  - task-definition
  - dva-c02
  - domain-1
  - domain-3
---

# ECS & ECR — Containers on AWS

> **Core concept**: ECS runs Docker containers. ECR stores Docker images. Fargate removes the need to manage EC2 instances entirely.

---

## ECS Launch Types

| Feature | EC2 Launch Type | Fargate Launch Type |
|---|---|---|
| **Infrastructure** | You manage EC2 instances | AWS manages everything |
| **Cost** | Pay for EC2 regardless | Pay per task (CPU + memory) |
| **Control** | High (OS-level access) | Low (no SSH) |
| **Startup** | Faster (instances already running) | Slower (cold-start) |
| **GPU support** | ✅ | ❌ |
| **Best for** | Predictable, sustained workloads | Variable, serverless containers |

:::tip Exam: Serverless containers = Fargate
Any question about running containers without managing servers → **Fargate**
:::

---

## ECS Core Concepts

```
Cluster
  └── Service (keeps N tasks running, integrates with ALB)
        └── Task (one running instance of your container group)
              └── Container(s) (from Task Definition)
```

| Concept | Description |
|---|---|
| **Cluster** | Logical grouping of tasks/services |
| **Task Definition** | Blueprint — image, CPU, memory, env vars, volumes |
| **Task** | Running instance of a Task Definition |
| **Service** | Keeps desired count of tasks running, handles rolling updates |

---

## Task Definition

```json
{
  "family": "order-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123:role/orderServiceTaskRole",
  "containerDefinitions": [
    {
      "name": "order-service",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/order-service:latest",
      "portMappings": [{ "containerPort": 8080 }],
      "environment": [
        { "name": "SPRING_PROFILES_ACTIVE", "value": "prod" }
      ],
      "secrets": [
        { "name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:...:secret:db-pass" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/order-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

## IAM Roles for ECS

:::caution Two different roles!
This is a common exam trap:

| Role | Purpose |
|---|---|
| **Task Execution Role** | ECS agent needs: pull image from ECR, write logs to CloudWatch, read Secrets Manager |
| **Task Role** | Your container's app code needs: read DynamoDB, publish to SQS, write to S3 |
:::

```
ECS Agent (Task Execution Role)       Your App (Task Role)
─────────────────────────────         ──────────────────────
• Pull from ECR                        • DynamoDB access
• CloudWatch Logs                      • S3 access
• Secrets Manager (for env vars)       • SQS/SNS access
• SSM Parameter Store                  • Custom permissions
```

---

## Service Auto Scaling

```yaml
# CloudFormation
ScalableTarget:
  Type: AWS::ApplicationAutoScaling::ScalableTarget
  Properties:
    ServiceNamespace: ecs
    ScalableDimension: ecs:service:DesiredCount
    ResourceId: !Sub "service/${Cluster}/${Service.Name}"
    MinCapacity: 1
    MaxCapacity: 50

ScalingPolicy:
  Type: AWS::ApplicationAutoScaling::ScalingPolicy
  Properties:
    PolicyType: TargetTrackingScaling
    TargetTrackingScalingPolicyConfiguration:
      TargetValue: 70.0
      PredefinedMetricSpecification:
        PredefinedMetricType: ECSServiceAverageCPUUtilization
```

---

## Amazon ECR

| Feature | Description |
|---|---|
| **Private registry** | Per-account, per-region |
| **Public registry** | ECR Public (like Docker Hub) |
| **Image scanning** | On push or on demand (Snyk/Inspector) |
| **Lifecycle policies** | Auto-delete old images |
| **Cross-region** | Replicate images across regions |

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t order-service .
docker tag order-service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/order-service:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/order-service:latest
```

---

## CI/CD with ECS + CodePipeline

```
CodeCommit/GitHub
      ↓
   CodeBuild  ← builds Docker image, pushes to ECR
      ↓
  CodeDeploy  ← Blue/Green ECS deployment
      ↓
   ECS Service (new task definition with new image)
```

---

## 🧪 Practice Questions

**Q1.** A containerized Java app running on ECS needs to read from DynamoDB. The security team says no access keys should be used. What is the correct solution?

A) Set `AWS_ACCESS_KEY_ID` environment variable in the task definition  
B) Attach a **Task Role** (IAM role) with DynamoDB permissions to the task definition  
C) Use the Task Execution Role with DynamoDB permissions  
D) Store keys in Secrets Manager and inject them as environment variables  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — The **Task Role** grants permissions to the application code running in the container. The Task Execution Role is for the ECS agent itself (pull images, write logs). Never use access keys in containers.
</details>

---

**Q2.** A developer wants to run containers without managing any EC2 instances. Which ECS launch type should they use?

A) EC2 Launch Type  
B) ECS on Graviton  
C) **Fargate Launch Type**  
D) ECS Anywhere  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Fargate** is the serverless container option — no EC2 instances to manage. AWS provisions the underlying compute automatically.
</details>

---

## 🔗 Resources

- [ECS Developer Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/)
- [ECR User Guide](https://docs.aws.amazon.com/AmazonECR/latest/userguide/)
- [Fargate Task Networking](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking.html)
- [ECS Task Roles](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
