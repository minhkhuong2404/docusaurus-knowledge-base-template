---
id: vpc-for-developers
title: VPC Fundamentals for Developers
sidebar_label: "🔌 VPC Fundamentals"
description: >
  VPC essentials for DVA-C02. Subnets, route tables, security groups vs
  NACLs, NAT Gateway, VPC Endpoints (Gateway vs Interface), bastion hosts,
  and common developer scenarios like Lambda-in-VPC and private RDS access.
tags:
  - vpc
  - networking
  - security-groups
  - nacl
  - nat-gateway
  - vpc-endpoints
  - lambda-vpc
  - dva-c02
  - domain-2
---

# VPC Fundamentals for Developers

> **Exam scope**: DVA-C02 tests VPC in the context of **Lambda, RDS, ElastiCache, and ECS** — not deep network engineering. Focus on the developer scenarios.

---

## VPC Building Blocks

```
VPC (10.0.0.0/16)
  ├── Public Subnet (10.0.1.0/24)  ← Internet Gateway attached → internet access
  │     ├── NAT Gateway
  │     └── Load Balancer
  │
  └── Private Subnet (10.0.10.0/24)  ← No direct internet route
        ├── Lambda (in VPC)
        ├── EC2 App Servers
        └── RDS / ElastiCache
```

---

## Security Groups vs Network ACLs

| Feature | Security Groups | Network ACLs (NACLs) |
|---|---|---|
| **Applies to** | EC2 instances, ENIs | Subnets |
| **State** | **Stateful** (return traffic auto-allowed) | **Stateless** (must define both inbound + outbound) |
| **Rules** | Allow only (no explicit deny) | Allow and Deny |
| **Evaluation** | All rules evaluated | Rules evaluated in order (lowest number first) |
| **Default behavior** | Deny all in, allow all out | Allow all (default NACL) |

:::tip Exam hint
**Stateful (Security Groups)**: If you allow inbound port 80, the response is automatically allowed out.
**Stateless (NACLs)**: You must explicitly allow BOTH inbound port 80 AND outbound ephemeral ports (1024–65535).
:::

---

## NAT Gateway

Allows **private subnet resources** (Lambda, EC2) to access the internet **outbound only**:

```
Private Lambda → NAT Gateway (public subnet) → Internet Gateway → Internet
                     ↑
                Elastic IP attached
```

- NAT Gateway must be in a **public subnet**
- Costs money per hour + per GB processed
- Fully managed (vs NAT Instance which requires maintenance)

:::caution Lambda in VPC needs NAT for internet
A Lambda function inside a VPC has **no internet access by default**. To call external APIs (Stripe, Twilio...), add a NAT Gateway.

**Cheaper alternative**: Use VPC Endpoints for AWS services (DynamoDB, S3, SQS) — no NAT needed.
:::

---

## VPC Endpoints

Access AWS services **privately** — traffic stays within AWS backbone, no internet required.

| Type | Services | Description |
|---|---|---|
| **Gateway Endpoint** | S3, DynamoDB | Free — added to route table |
| **Interface Endpoint (PrivateLink)** | Most AWS services (SQS, SNS, Lambda, Secrets Manager...) | ENI in your subnet — costs per hour + per GB |

```
# Without VPC Endpoint:
Lambda (private subnet) → NAT Gateway → Internet → DynamoDB endpoint
                          ($$$, public internet)

# With Gateway Endpoint for DynamoDB:
Lambda (private subnet) → VPC Endpoint → DynamoDB
                          (free, private, no NAT needed)
```

### When to Use VPC Endpoints
- Lambda in VPC accessing DynamoDB/S3 → **Gateway Endpoint** (free)
- Lambda in VPC accessing SQS, SNS, Secrets Manager → **Interface Endpoint**
- Eliminate NAT Gateway costs for AWS service traffic

---

## Lambda in VPC

```java
// SAM — Lambda in VPC
MyFunction:
  Type: AWS::Serverless::Function
  Properties:
    VpcConfig:
      SecurityGroupIds:
        - !Ref LambdaSecurityGroup
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2    # Multiple AZs for resilience
```

### Lambda + VPC Cold Starts

Previously, Lambda VPC cold starts were slow (ENI creation took ~10s). Since 2020, AWS uses **Hyperplane ENIs** — cold starts are similar to non-VPC functions.

### Common Lambda in VPC Pattern

```
Lambda (private subnet)
  ├── RDS / ElastiCache → via Security Group (same VPC)
  ├── DynamoDB / S3 → via Gateway VPC Endpoint (no internet)
  ├── SQS / Secrets Manager → via Interface VPC Endpoint
  └── External API (Stripe, etc.) → via NAT Gateway
```

---

## ECS in VPC

```yaml
# Fargate task in VPC — awsvpc network mode (required for Fargate)
TaskDefinition:
  NetworkMode: awsvpc   # Each task gets its own ENI and private IP
```

With `awsvpc`, you apply Security Groups directly to tasks — not to the host.

---

## 🧪 Practice Questions

**Q1.** A Lambda function in a VPC needs to call the DynamoDB API. No NAT Gateway is configured. What is the MOST cost-effective solution?

A) Add a NAT Gateway to allow internet access  
B) Move Lambda outside the VPC  
C) Add a **Gateway VPC Endpoint** for DynamoDB in the route table  
D) Use DynamoDB Local  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — A **Gateway VPC Endpoint for DynamoDB** is **free** and routes traffic through the AWS backbone — no internet required, no NAT costs. It's the recommended solution for Lambda accessing DynamoDB/S3 from within a VPC.
</details>

---

**Q2.** A Security Group allows inbound TCP port 443. A NACL also allows inbound TCP port 443 but has no outbound rule for ephemeral ports. What happens to HTTPS responses?

A) Responses flow normally — Security Groups handle the return traffic  
B) **Responses are blocked** — NACLs are stateless and require an explicit outbound ephemeral port rule  
C) The NACL is ignored because Security Group takes precedence  
D) Only the first packet is blocked  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **NACLs are stateless** — they don't automatically allow return traffic. You must add an outbound rule for ephemeral ports (1024–65535) to allow HTTPS responses. Security Groups are stateful, but both layers apply.
</details>

---

**Q3.** A Lambda function in a private VPC subnet needs to call an external HTTPS API (not an AWS service). What network component is required?

A) VPC Gateway Endpoint  
B) Internet Gateway  
C) **NAT Gateway** in a public subnet  
D) VPC Peering  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — For external internet access from a private subnet, you need a **NAT Gateway** in a public subnet. VPC Endpoints only work for AWS services. Internet Gateway allows internet access but must be attached to a public subnet and requires a public IP.
</details>

---

## 🔗 Resources

- [VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/)
- [VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-endpoints.html)
- [Lambda VPC Integration](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html)
- [Security Groups vs NACLs](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
