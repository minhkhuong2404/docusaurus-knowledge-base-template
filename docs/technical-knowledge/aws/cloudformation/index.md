---
id: index
title: AWS CloudFormation
sidebar_label: "🏗️ CloudFormation"
description: >
  AWS CloudFormation for DVA-C02. Template anatomy, intrinsic functions,
  stacks, change sets, nested stacks, stack sets, drift detection, rollback,
  and deletion policies.
tags:
  - cloudformation
  - iac
  - infrastructure-as-code
  - templates
  - stacks
  - change-sets
  - dva-c02
  - domain-3
---

# AWS CloudFormation

> **Core concept**: CloudFormation provisions and manages AWS infrastructure as **code** (YAML or JSON templates).

---

## Template Anatomy

```yaml
AWSTemplateFormatVersion: "2010-09-09"  # Always this value
Description: "My Application Stack"

Parameters:           # Input values at deploy time
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

Resources:            # ← REQUIRED — at least one resource
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${Environment}-my-app-bucket"
      VersioningConfiguration:
        Status: Enabled

Outputs:              # Values to export or display
  BucketName:
    Value: !Ref MyBucket
    Export:
      Name: !Sub "${AWS::StackName}-BucketName"
```

---

## Intrinsic Functions (Exam Favorites!)

| Function | Purpose | Example |
|---|---|---|
| `!Ref` | Reference a parameter or resource | `!Ref Environment` |
| `!Sub` | String substitution | `!Sub "${Env}-bucket"` |
| `!GetAtt` | Get resource attribute | `!GetAtt MyLambda.Arn` |
| `!FindInMap` | Lookup value in Mappings | `!FindInMap [RegionMap, !Ref AWS::Region, AMI]` |
| `!If` | Conditional value | `!If [IsProduction, t3.large, t3.micro]` |
| `!Select` | Select from list | `!Select [0, !GetAZs '']` |
| `!Split` | Split string | `!Split [",", !Ref CidrBlocks]` |
| `!Join` | Join values | `!Join [":", [a, b, c]]` → `a:b:c` |
| `!ImportValue` | Import cross-stack export | `!ImportValue NetworkStack-VpcId` |

---

## Change Sets

```
Current Stack → Create Change Set → Review Changes → Execute Change Set → Updated Stack
```

- **Never execute directly in production** — always use change sets first
- Shows **what will be added, modified, replaced, or deleted**
- Resources marked `Replacement: True` will be destroyed and recreated

---

## Stack Policies

```json
{
  "Statement": [{
    "Effect": "Deny",
    "Action": "Update:Replace",
    "Principal": "*",
    "Resource": "LogicalResourceId/ProductionDatabase"
  }]
}
```

Prevents accidental updates/deletions of critical resources.

---

## DeletionPolicy

```yaml
MyDatabase:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: Retain    # Don't delete on stack deletion
  # Options: Delete (default), Retain, Snapshot
```

| Policy | Behavior |
|---|---|
| `Delete` | Resource is deleted when stack is deleted |
| `Retain` | Resource kept, stack disassociates |
| `Snapshot` | Take snapshot before deleting (RDS, EBS, ElastiCache) |

---

## Nested Stacks vs Stack Sets

| Feature | Nested Stacks | Stack Sets |
|---|---|---|
| **Purpose** | Modular templates within one account | Deploy same stack across multiple accounts/regions |
| **Root stack** | Parent orchestrates children | Admin account deploys to target accounts |
| **Use case** | VPC template, security groups template | Multi-account deployments (org-wide) |

---

## Cross-Stack References

```yaml
# Stack A — exports VPC ID
Outputs:
  VpcId:
    Value: !Ref MyVPC
    Export:
      Name: NetworkStack-VpcId  # Must be unique per region

# Stack B — imports VPC ID
Resources:
  MySubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !ImportValue NetworkStack-VpcId  # Reference cross-stack
```

---

## 🧪 Practice Questions

**Q1.** A CloudFormation stack is being updated and a new resource needs to **replace** an existing resource (e.g., an RDS parameter group change). Which CloudFormation feature allows the developer to preview this impact BEFORE executing the change?

A) Stack Drift Detection  
B) Change Set  
C) Stack Policy  
D) Rollback Configuration  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — A **Change Set** previews what will happen to each resource (Add/Modify/Remove/Replace) without actually making changes. Always use change sets for production updates.
</details>

---

**Q2.** A developer wants to ensure that an RDS database is NOT deleted when a CloudFormation stack is deleted (for data protection). What should they set?

A) Add a Stack Policy denying delete  
B) Set `DeletionPolicy: Retain` on the RDS resource  
C) Enable termination protection on the stack  
D) Use a Condition to skip deletion  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — `DeletionPolicy: Retain` on the RDS resource keeps it alive even when the stack is deleted. The stack will complete deletion and disassociate from the resource.
</details>

---

**Q3.** Which intrinsic function would you use to get the ARN of a Lambda function defined in the same template?

A) `!Ref MyLambdaFunction`  
B) `!GetAtt MyLambdaFunction.Arn`  
C) `!Sub "arn:aws:lambda::${MyLambdaFunction}"`  
D) `!FindInMap [Functions, Lambda, Arn]`  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — `!GetAtt` retrieves attributes of a resource. `!Ref` on a Lambda returns the function name (not ARN). `Arn` is the attribute name for the function ARN.
</details>

---

## 🔗 Resources

- [CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/latest/userguide/)
- [CloudFormation Resource Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html)
- [Intrinsic Function Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html)
- [cfn-lint (VS Code extension)](https://github.com/aws-cloudformation/cfn-lint)
