---
id: core-infrastructure-architecture
title: Full-Stack Production AWS Architecture Blueprint
sidebar_label: 🏗️ Production Architecture Blueprint
description: A complete, end-to-end cloud production architecture guide on AWS — covering Multi-AZ VPCs, ALB, EC2 Auto Scaling, RDS Multi-AZ, S3 Event Pipelines, Lambda, SQS, Secrets Manager, and KMS.
tags: [aws, vpc, architecture, alb, ec2, rds, s3, lambda, sqs, kms, secrets-manager, multi-az, production]
---

import AwsCoreArchitectureDiagram from '@site/src/components/AwsCoreArchitectureDiagram';

# Full-Stack Production AWS Architecture Blueprint

Rather than learning isolated AWS services in a vacuum, production cloud engineering requires understanding how services interconnect to form a resilient, highly available, and secure distributed system.

This guide provides an end-to-end architectural blueprint of a modern full-stack web and media application (such as a scalable photo-sharing platform) on AWS based on the [Cloud X Berry Masterclass](https://www.youtube.com/watch?v=7eP8U2CnKdA).

---

## Interactive AWS Production Architecture Visualizer

Explore the interactive visualizer below to inspect the Multi-AZ VPC topology, the event-driven S3 + Lambda media processing pipeline, and the security/secrets management mesh.

<AwsCoreArchitectureDiagram />

---

## 1. Network Topology: Multi-AZ Virtual Private Cloud (VPC)

The foundation of every secure AWS workload is a properly structured **Multi-AZ VPC** (e.g. `10.0.0.0/16`) spanning at least two Availability Zones (AZ-a and AZ-b):

| Availability Zone | Subnet Tier | CIDR Block | Hosted Infrastructure | Route Table Egress Target |
|---|---|---|---|---|
| **us-east-1a** | Public Subnet | `10.0.1.0/24` | ALB Node A, NAT Gateway A | Internet Gateway (`0.0.0.0/0 ➔ igw-xxx`) |
| **us-east-1a** | Private App Subnet | `10.0.10.0/24` | EC2 ASG Instance 1 (Spring Boot) | NAT Gateway A (`0.0.0.0/0 ➔ nat-xxx-a`) |
| **us-east-1a** | Isolated DB Subnet | `10.0.100.0/24` | Primary RDS PostgreSQL Instance | Local VPC only (No internet route) |
| **us-east-1b** | Public Subnet | `10.0.2.0/24` | ALB Node B, NAT Gateway B | Internet Gateway (`0.0.0.0/0 ➔ igw-xxx`) |
| **us-east-1b** | Private App Subnet | `10.0.20.0/24` | EC2 ASG Instance 2 (ASG Node) | NAT Gateway B (`0.0.0.0/0 ➔ nat-xxx-b`) |
| **us-east-1b** | Isolated DB Subnet | `10.0.200.0/24` | Synchronous Standby RDS Replica | Local VPC only (Synchronous disk replication) |

### Subnet Segmentation & Route Table Rules:
1. **Public Subnets (`10.0.1.0/24`, `10.0.2.0/24`):**
   * Route Table: `0.0.0.0/0` ➔ **Internet Gateway (IGW)**.
   * Houses public-facing resources: **Application Load Balancers (ALB)** and **NAT Gateways**.
2. **Private App Subnets (`10.0.10.0/24`, `10.0.20.0/24`):**
   * Route Table: `0.0.0.0/0` ➔ **NAT Gateway** in the corresponding AZ.
   * Houses backend application compute (**EC2 Auto Scaling Group** / ECS tasks). Instances can make outbound requests to download packages, but cannot be directly reached from the internet.
3. **Isolated Database Subnets (`10.0.100.0/24`, `10.0.200.0/24`):**
   * Route Table: Local VPC routing only (no route to IGW or NAT Gateway).
   * Houses **Amazon RDS Multi-AZ** clusters. Completely air-gapped from internet egress.

---

## 2. Defense-in-Depth: Security Group Chaining

Security groups act as stateful firewalls directly attached to Elastic Network Interfaces (ENIs). In production, never open ports to raw CIDR blocks when communicating between internal tiers:

| Tier / ENI Layer | Security Group Name | Inbound Protocol & Port | Allowed Source | Security Rationale |
|---|---|---|---|---|
| **Edge Load Balancer** | `sg-alb` | HTTPS (TCP 443) | `0.0.0.0/0` (Public Internet) | Public entry point terminating client TLS. |
| **Application Tier** | `sg-app-ec2` | HTTP (TCP 8080) | **Source Security Group: `sg-alb`** | Rejects direct internet traffic; only ALB can forward requests. |
| **Database Tier** | `sg-rds` | PostgreSQL (TCP 5432) | **Source Security Group: `sg-app-ec2`** | Only application instances can query the database. |

---

## 3. Asynchronous Media Pipeline: S3 + Lambda + SQS

When users upload photos or heavy files, routing large binary payloads through application servers wastes EC2 CPU, memory, and bandwidth.

### The Presigned URL + Event-Driven Pattern:

```
1. Mobile App ──[ 1. Request Upload URL ]──▶ EC2 App Server
2. Mobile App ◀──[ 2. Return S3 Presigned URL ]── EC2 App Server
3. Mobile App ──[ 3. Direct Binary PUT (15MB Photo) ]──▶ S3 Bucket (photos-raw)
                                                            │
                                             s3:ObjectCreated:* Event
                                                            ▼
                                                    AWS Lambda Resizer
                                                            │
                                             Writes 256x256 thumbnail
                                                            ▼
                                                   S3 Bucket (photos-thumb)
                                                            │
                                                   Enqueues AI task
                                                            ▼
                                                   Amazon SQS (AI Queue)
```

1. **Direct-to-S3 Presigned Uploads:** The client asks the backend for an authorized S3 Presigned URL. The client uploads directly to S3 via HTTP `PUT`, bypassing EC2 entirely.
2. **S3 Event Notifications:** S3 automatically triggers an **AWS Lambda function** upon object creation.
3. **Serverless Image Resizing:** Lambda reads the raw photo, creates optimized thumbnail variants, saves them to a public thumbnail bucket, and updates the database.
4. **SQS Decoupling for Heavy AI Work:** Lambda publishes an event message to an **Amazon SQS queue**, buffering work for asynchronous AI moderation workers.

---

## 4. Security, Secrets & KMS Envelope Encryption

### IAM Roles over Static Credentials
* Never embed AWS access keys (`AKIA...`) inside application code or `.env` files.
* Attach **IAM Instance Profiles** to EC2 and **Execution Roles** to Lambda. AWS STS automatically rotates temporary credentials every 6 hours without application intervention.

### Automated Credential Rotation (Secrets Manager + KMS)
* Database credentials and third-party API tokens are stored in **AWS Secrets Manager**, encrypted at rest using **AWS KMS (Key Management Service)**.
* Secrets Manager invokes an automated Lambda rotation function every 30 days to update the RDS master password and update the secret value simultaneously.

---

## 5. Production Reliability & Disaster Recovery Checklist

| Architectural Pillar | Production Requirement | Implementation Gotcha |
|---|---|---|
| **High Availability** | Multi-AZ Deployment across 2+ AZs | Ensure Multi-AZ NAT Gateways (one per AZ) to avoid cross-AZ data transfer fees and single points of failure. |
| **Database Failover** | Amazon RDS Multi-AZ Synchronous Replication | Multi-AZ standby replica does *not* accept read queries; create Read Replicas for scaling read workloads. |
| **Compute Elasticity** | EC2 Auto Scaling Group with Target Tracking | Use ALB `TargetResponseTime` or `RequestCountPerTarget` rather than raw CPU for responsive auto scaling. |
| **Storage Optimization** | S3 Lifecycle Rules | Transition raw uploads from S3 Standard to S3 Standard-IA (30 days) and S3 Glacier (90 days) to cut storage costs by 80%. |
| **Observability** | CloudWatch Alarms & X-Ray Distributed Tracing | Set alarms on ALB `5XXErrorRate > 1%` and SQS `ApproximateAgeOfOldestMessage > 300s`. |
