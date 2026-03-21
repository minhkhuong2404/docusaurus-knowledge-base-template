---
id: index
title: AWS CloudFormation
sidebar_label: "🏗️ CloudFormation"
description: >
  AWS CloudFormation for DVA-C02. Template anatomy, intrinsic functions,
  pseudo parameters, dynamic references, custom resources, nested stacks, 
  drift detection, and deployment policies.
tags:
  - cloudformation
  - iac
  - infrastructure-as-code
  - templates
  - intrinsic-functions
  - change-sets
  - sam
  - dva-c02
  - domain-3
---

# AWS CloudFormation

> **Core concept**: CloudFormation provisions and manages AWS infrastructure as **code** (YAML or JSON templates). It ensures consistent, repeatable, and safe deployments across environments.

---

## Template Anatomy

```yaml
AWSTemplateFormatVersion: "2010-09-09"  # Always this value
Description: "My Application Stack"

Parameters:           # Input values at deploy time (Max 200)
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]
    Default: dev

Mappings:             # Lookup tables (e.g., AMI IDs per region)
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890

Conditions:           # Conditional resource creation
  IsProduction: !Equals [!Ref Environment, prod]

Transform:            # Defines macros/transforms applied to the template
  - AWS::Serverless-2016-10-31  # Used for AWS SAM templates

Resources:            # ← REQUIRED — at least one resource
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${Environment}-my-app-bucket"
      VersioningConfiguration:
        Status: Enabled

Outputs:              # Values to export or display on the console (Max 200)
  BucketName:
    Value: !Ref MyBucket
    Export:
      Name: !Sub "${AWS::StackName}-BucketName"
```

---

## Intrinsic Functions & Pseudo Parameters

### Pseudo Parameters (Built-in)
AWS provides predefined parameters that resolve at deployment time. You reference them using `!Ref`.
- `AWS::Region` (e.g., `us-east-1`)
- `AWS::AccountId` (e.g., `123456789012`)
- `AWS::StackName` (Name of the current stack)
- `AWS::NoValue` (Used to conditionally omit a property)

### Intrinsic Functions (Exam Favorites!)

| Function       | Purpose                                                      | Example                                           |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| `!Ref`         | Reference a parameter, resource ID, or pseudo parameter.     | `!Ref AWS::Region`                                |
| `!Sub`         | String substitution. Variables must be in `${}`.             | `!Sub "arn:aws:s3:::${MyBucket}"`                 |
| `!GetAtt`      | Get a specific resource attribute (like an ARN or DNS name). | `!GetAtt MyLambda.Arn`                            |
| `!FindInMap`   | Lookup value in Mappings.                                    | `!FindInMap [RegionMap, !Ref 'AWS::Region', AMI]` |
| `!If`          | Conditional value based on a defined Condition.              | `!If [IsProduction, t3.large, t3.micro]`          |
| `!Join`        | Join an array of values with a delimiter.                    | `!Join [":", [arn, aws, iam]]`                    |
| `!ImportValue` | Import a cross-stack exported output.                        | `!ImportValue NetworkStack-VpcId`                 |

---

## Dynamic References (Security Best Practice)

**Highly Testable:** You should NEVER hardcode passwords or sensitive data in CloudFormation. Instead, use Dynamic References to pull values from Systems Manager (SSM) Parameter Store or AWS Secrets Manager *during stack creation/update*.

```yaml
MyDatabase:
  Type: AWS::RDS::DBInstance
  Properties:
    # Resolves a secure string from Systems Manager
    MasterUsername: '{{resolve:ssm-secure:/db/username:1}}'
    # Resolves a secret from AWS Secrets Manager
    MasterUserPassword: '{{resolve:secretsmanager:MyDBSecret:SecretString:password}}'
```

---

## Controlling Resource Creation

### 1. `DependsOn`
CloudFormation usually determines dependency order automatically (e.g., if an EC2 instance references a Security Group, it builds the SG first). However, sometimes you must force the order manually using `DependsOn`.
- **Classic Exam Scenario:** An Elastic IP (`AWS::EC2::EIP`) needs to be attached to an EC2 instance, but the VPC must have an Internet Gateway attached first. You must add `DependsOn: MyVpcGatewayAttachment` to the EIP resource.

### 2. Custom Resources (Lambda Backed)
If you need CloudFormation to do something it doesn't natively support (e.g., emptying an S3 bucket before deleting it, or making an API call to a third-party service like GitHub/Stripe during deployment), you create a **Custom Resource**.
- You define an `AWS::CloudFormation::CustomResource`.
- You provide a `ServiceToken` pointing to the ARN of a Lambda function.
- CloudFormation triggers your Lambda with a `Create`, `Update`, or `Delete` event.

---

## Stack Management

### Change Sets
- **Never execute updates directly in production** — always generate a change set first.
- Previews **what will be added, modified, replaced, or deleted**.
- **Crucial:** If a resource is marked `Replacement: True`, CloudFormation will destroy the existing resource and create a new one (e.g., changing the name of an S3 bucket forces a replacement).

### Stack Policies
A JSON document applied to a stack that prevents accidental updates or deletions of critical resources (like production databases) during a stack update.

### Drift Detection
Detects if resources have been manually changed outside of CloudFormation (e.g., someone logged into the console and changed an EC2 security group rule).
- **Status:** Returns `IN_SYNC` or `DRIFTED`.
- Drift detection does *not* automatically revert the changes. You must manually fix the resource or update your template to match reality.

---

## DeletionPolicy

Controls what happens to a resource when the stack is deleted.

| Policy     | Behavior                                                        | Exam Use Case                                                          |
| ---------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `Delete`   | (Default) Resource is deleted when the stack is deleted.        | Dev/Test environments.                                                 |
| `Retain`   | Resource is kept intact, but the stack disassociates from it.   | S3 buckets or databases you want to keep after tearing down the stack. |
| `Snapshot` | Takes a final snapshot before deleting the underlying resource. | RDS databases, EBS volumes, or ElastiCache clusters.                   |

---

## Nested Stacks vs Stack Sets vs Cross-Stack References

| Approach                   | How it works                                                                                    | When to use                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Nested Stacks**          | Parent stack calls child stacks via `AWS::CloudFormation::Stack`.                               | Breaking a massive template into modular, reusable components (e.g., one template for VPC, one for ALBs) within a single app.     |
| **Cross-Stack References** | Stack A `Exports` a value; Stack B uses `!ImportValue`.                                         | Sharing resources *between* different applications or teams (e.g., Core Networking team exports the VPC ID for Dev teams to use). |
| **Stack Sets**             | Administrator account deploys the exact same template across multiple AWS accounts and regions. | Setting up baseline org-wide infrastructure (e.g., standard IAM roles or AWS Config rules in all member accounts).                |

:::warning Cross-Stack Reference Limitation
You **cannot** delete a stack if another stack is currently importing its exported values. You must first update the consuming stack to remove the `!ImportValue` reference.
:::

---

## 🧪 Practice Questions

**Q1.** A developer needs to pass a database password to an RDS instance provisioned via CloudFormation. Security policies mandate that passwords cannot be hardcoded in templates or passed as plain-text parameters. What is the most secure way to achieve this?

A) Use the `!FindInMap` intrinsic function to look up the password from a secure Mappings section.  
B) Encrypt the password using KMS and store the ciphertext in the template.  
C) Use a Dynamic Reference to retrieve the password from AWS Secrets Manager `{{resolve:secretsmanager:...}}`.  
D) Pass the password via an environment variable to a Lambda Custom Resource.  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Dynamic References** allow CloudFormation to securely pull values from Systems Manager (SSM) Parameter Store or AWS Secrets Manager exactly at deployment time, keeping the template completely clean of sensitive data.
</details>

---

**Q2.** An application consists of a Core Network stack and several independent Application stacks. The Application stacks need to place their EC2 instances into the subnets created by the Core Network stack. What is the best way to handle this dependency?

A) Combine all stacks into a single large CloudFormation template.  
B) Use Nested Stacks and pass the Subnet IDs as parameters to the child stacks.  
C) In the Core Network stack, use `Export` in the `Outputs` section to export the Subnet IDs. In the Application stacks, use the `!ImportValue` intrinsic function to retrieve them.  
D) Write a Lambda Custom Resource to query the AWS account for the Subnet IDs during the Application stack deployment.  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Cross-Stack References** (`Export` and `!ImportValue`) are the standard way to share resource identifiers between independent stacks managed by potentially different teams.
</details>

---

**Q3.** A developer updates a CloudFormation template to change the `BucketName` property of an existing `AWS::S3::Bucket`. When they create a Change Set, what will the action indicate for this S3 bucket?

A) Modify  
B) Retain  
C) Update  
D) Replace  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — You cannot rename an S3 bucket. Changing the `BucketName` property requires a **Replacement** (CloudFormation will create a new bucket, and delete the old one). This highlights why Change Sets are critical to review before executing!
</details>

---

**Q4.** A developer is deploying an API Gateway, but the deployment keeps failing because CloudFormation attempts to deploy the API methods before the associated Lambda functions are fully provisioned. How can this be fixed?

A) Add a WaitCondition to the Lambda functions.  
B) Use the `DependsOn` attribute on the API Gateway resources, pointing to the Lambda functions.  
C) Separate the API Gateway and Lambda functions into Nested Stacks.  
D) Increase the timeout of the CloudFormation stack creation.  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **`DependsOn`** forces CloudFormation to wait for a specific resource to be fully created before it begins creating the resource that declares the dependency.
</details>

---

## 🔗 Resources

- [CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/latest/userguide/)
- [Intrinsic Function Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html)
- [Using Dynamic References to Specify Template Values](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references.html)
- [Walkthrough: Cross-Stack Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/walkthrough-crossstackref.html)
- [Custom Resources](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-custom-resources.html)
```