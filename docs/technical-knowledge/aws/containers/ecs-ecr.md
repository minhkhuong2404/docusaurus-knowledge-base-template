---
id: ecs-ecr
title: ECS & ECR — Containers on AWS
sidebar_label: "🐳 ECS & ECR"
description: >
  Amazon ECS and ECR for DVA-C02. EC2 vs Fargate launch types, task
  definitions, services, IAM roles (Task vs Execution), network modes, 
  dynamic port mapping, ECR lifecycle policies, and CodeDeploy Blue/Green.
tags:
  - ecs
  - ecr
  - containers
  - docker
  - fargate
  - awsvpc
  - task-definition
  - codedeploy
  - dva-c02
  - domain-1
  - domain-3
---

# ECS & ECR — Containers on AWS

> **Core concept**: Amazon ECS (Elastic Container Service) is a container orchestration service that runs Docker containers. Amazon ECR (Elastic Container Registry) securely stores and manages your Docker images. 

---

## ECS Launch Types

When you create an ECS cluster or run a task, you choose how the underlying infrastructure is managed.

| Feature            | EC2 Launch Type                                                               | Fargate Launch Type                                                          |
| ------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Infrastructure** | You provision and manage EC2 instances.                                       | AWS manages the underlying servers.                                          |
| **Pricing**        | You pay for the EC2 instances, regardless of how many containers are running. | You pay exactly for the CPU and memory requested by your Tasks (per second). |
| **Network Mode**   | `bridge`, `host`, `awsvpc`, or `none`.                                        | **Must** use `awsvpc`.                                                       |
| **Maintenance**    | You are responsible for OS patching and scaling the EC2 Auto Scaling Group.   | No underlying OS to patch.                                                   |

:::tip Exam: Serverless Containers
If a scenario asks to run containers with the **lowest operational overhead** or without managing servers, the answer is always **Fargate**.
:::

---

## ECS Network Modes (Highly Testable!)

How containers communicate with the network is defined in the Task Definition.

### 1. `awsvpc` (Recommended & Fargate Default)
- **How it works:** Every ECS Task is allocated its own Elastic Network Interface (ENI) and a primary private IP address directly from your VPC subnet.
- **Benefits:** Tasks get the same networking properties as EC2 instances (you can attach Security Groups directly to the Task).
- **Exam Note:** This is **mandatory** for Fargate. 

### 2. `bridge` (Classic Docker)
- **How it works:** Tasks use Docker's default virtual network on the EC2 host.
- **Dynamic Port Mapping:** If you run two identical containers (e.g., Apache on port 80) on the *same* EC2 instance, they cannot both bind to host port 80. You set the host port to `0` in the Task Definition. The Application Load Balancer (ALB) will dynamically assign an ephemeral port (e.g., 32768) and route traffic correctly. 
- **Exam Note:** Requires an ALB. Cannot be used with Fargate.

### 3. `host`
- **How it works:** Bypasses Docker's network and maps container ports directly to the EC2 instance's ENI.
- **Drawback:** You cannot run more than one container of the same type on a single EC2 instance (port conflicts).

---

## IAM Roles for ECS (The Classic Exam Trap)

There are two completely distinct IAM roles associated with an ECS Task. You *must* know the difference.

| Role                    | Who assumes it?                   | What is it used for?                                                                     | Example Permissions                                                                   |
| ----------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Task Execution Role** | The ECS Agent / Container Runtime | Bootstrapping the container. Pulling the image from ECR, and pushing logs to CloudWatch. | `ecr:GetDownloadUrlForLayer`, `logs:CreateLogStream`, `secretsmanager:GetSecretValue` |
| **Task Role**           | Your Application Code             | What your actual code needs to do *after* the container is running.                      | `dynamodb:PutItem`, `s3:GetObject`, `sqs:SendMessage`                                 |

:::danger Never hardcode credentials
If an exam question mentions a containerized app needing access to DynamoDB, **never** inject AWS Access Keys as environment variables. Always assign a **Task Role** to the Task Definition.
:::

---

## Task Placement Strategies (EC2 Launch Type Only)

When using the EC2 launch type, ECS needs to decide *which* EC2 instance to place a new task on. 

1. **Binpack**: Places tasks on the instances with the *least* available CPU or memory. **Goal:** Minimize costs by packing instances tightly and leaving other instances empty so they can be scaled in.
2. **Spread**: Places tasks evenly across instances or Availability Zones. **Goal:** Maximize high availability.
3. **Random**: Places tasks randomly.

---

## Amazon ECR (Elastic Container Registry)

ECR is AWS's managed Docker registry (equivalent to Docker Hub).

### Key Features for the Exam
- **Image Scanning**: ECR can scan images for OS and programming language vulnerabilities. You can configure it to scan automatically "On Push" or trigger scans manually via the API.
- **Lifecycle Policies**: JSON rules that automatically clean up old images to save storage costs. 
  - *Example use case:* "Delete all `untagged` images older than 14 days" or "Keep only the 50 most recent `prod` images."
- **Cross-Region Replication**: You can configure ECR to automatically copy images to other regions for disaster recovery or faster global deployments.

### Pushing an Image
```bash
# 1. Get an auth token and pass it to docker login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# 2. Build the Docker image
docker build -t order-service .

# 3. Tag the image with the ECR repository URI
docker tag order-service:latest [123456789012.dkr.ecr.us-east-1.amazonaws.com/order-service:latest](https://123456789012.dkr.ecr.us-east-1.amazonaws.com/order-service:latest)

# 4. Push to ECR
docker push [123456789012.dkr.ecr.us-east-1.amazonaws.com/order-service:latest](https://123456789012.dkr.ecr.us-east-1.amazonaws.com/order-service:latest)
```

---

## Deployments & CodePipeline Integration

ECS Services support **Rolling Updates** by default (gradually replacing old tasks with new ones). 

For **Blue/Green Deployments**, you must use **AWS CodeDeploy**.
- CodeDeploy requires an `AppSpec.yaml` file specifically formatted for ECS.
- CodeDeploy manages shifting traffic at the Application Load Balancer (ALB) level between two Target Groups (Blue and Green).

**Example ECS `appspec.yaml`:**
```yaml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "arn:aws:ecs:us-east-1:111222333444:task-definition/my-task-def:2"
        LoadBalancerInfo:
          ContainerName: "my-app-container"
          ContainerPort: 8080
```

---

## 🧪 Practice Questions

**Q1.** A developer is migrating a legacy application to Amazon ECS using the EC2 launch type. The application consists of multiple identical microservice containers that must run on the same EC2 instances to maximize resource utilization. Each container listens on port 8080. How can the developer expose these containers through an Application Load Balancer (ALB) without port conflicts?

A) Use the `awsvpc` network mode and assign a static port to each container.  
B) Use the `bridge` network mode and set the host port to `0` in the Task Definition to enable Dynamic Port Mapping.  
C) Use the `host` network mode and map container port 8080 to host port 80.  
D) Create a custom Docker network and attach the ALB directly to the Docker network.  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Setting the host port to `0` enables **Dynamic Port Mapping**. The ECS agent assigns an ephemeral port to each container on the EC2 host and automatically registers that dynamic port with the ALB's Target Group.
</details>

---

**Q2.** An application running on AWS Fargate needs to upload files to an Amazon S3 bucket. However, the application is returning `403 Access Denied` errors. Which IAM role needs to be modified to grant the necessary `s3:PutObject` permissions?

A) The ECS Task Execution Role  
B) The EC2 Instance Profile  
C) The ECS Service Linked Role  
D) The ECS Task Role  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — The **Task Role** grants permissions to the application code running *inside* the container. The Task Execution role is only used by the ECS infrastructure to pull the image and push logs. (Because it's Fargate, there is no EC2 Instance Profile).
</details>

---

**Q3.** A company stores hundreds of Docker images in Amazon ECR. They want to reduce storage costs by automatically deleting any images that do not have a tag and are older than 30 days. How should they implement this?

A) Create a CloudWatch Event rule that triggers a Lambda function to delete the images.  
B) Configure an S3 Lifecycle rule on the underlying ECR bucket.  
C) Create an ECR Lifecycle Policy.  
D) Run a daily cron job inside an ECS container to execute `aws ecr batch-delete-image`.  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **ECR Lifecycle Policies** provide an automated, declarative way to manage the lifecycle of images in your repositories, exactly for this use case (filtering by tag status and age).
</details>

---

## 🔗 Resources

- [ECS Developer Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/)
- [ECR Lifecycle Policies](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html)
- [ECS Task Networking (`awsvpc`)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking.html)
- [CodeDeploy for ECS (AppSpec)](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-resources.html)
- [ECS IAM Roles](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
