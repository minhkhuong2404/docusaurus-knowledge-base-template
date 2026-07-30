---
id: terraform
title: Terraform Comprehensive Guide & Cookbook
sidebar_label: Terraform
description: An exhaustive, 1000-line deep dive into Terraform with extensive practical code examples, CLI commands, state manipulation, and advanced architectures.
tags: [devops, iac, terraform, infrastructure, beginner, advanced, deep-dive]
---

# Terraform: The Exhaustive Guide & Cookbook

Welcome to the definitive, most comprehensive guide on HashiCorp Terraform. This document serves not only as theoretical knowledge but as a practical cookbook filled with hundreds of lines of code examples, real-world use cases, and command-line execution examples.

---

## Part 1: The Fundamentals (Beginner)

### 1. What is Infrastructure as Code (IaC)?
**Infrastructure as Code (IaC)** replaces manual click-ops in the cloud console with version-controlled text files.

### 2. The Core Workflow in Action
Let's see the four main commands in action.

**1. Initialize (`terraform init`)**
Downloads the AWS provider plugin into `.terraform/`.
```bash
# Basic init
terraform init

# Init and force upgrade of provider plugins
terraform init -upgrade

# Reconfigure the backend (useful when moving state from local to S3)
terraform init -reconfigure
```

**2. Plan (`terraform plan`)**
Shows what will happen without actually doing it.
```bash
# Basic plan
terraform plan

# Save the plan to a file (Guarantees exactly this plan is applied)
terraform plan -out=tfplan

# Target a specific resource (Useful for emergency fixes)
terraform plan -target=aws_instance.web
```

**3. Apply (`terraform apply`)**
Executes the changes.
```bash
# Apply interactively
terraform apply

# Apply a saved plan
terraform apply tfplan

# Apply without asking for 'yes' (DANGEROUS, use only in CI/CD)
terraform apply -auto-approve
```

**4. Destroy (`terraform destroy`)**
Tears down the infrastructure.
```bash
# Destroy everything interactively
terraform destroy

# Destroy only a specific resource
terraform destroy -target=aws_s3_bucket.my_bucket
```

### 3. A Complete Basic Example: Deploying an EC2 Instance
Here is a complete, working example of deploying a web server on AWS.

```hcl
# main.tf

# 1. Define the Provider
provider "aws" {
  region  = "us-east-1"
  profile = "my-aws-profile" # Uses ~/.aws/credentials
}

# 2. Define Variables
variable "instance_type" {
  type    = string
  default = "t2.micro"
}

# 3. Data Source: Get the latest Ubuntu 20.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical's AWS Account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }
}

# 4. Resource: Security Group
resource "aws_security_group" "web_sg" {
  name        = "web-server-sg"
  description = "Allow HTTP and SSH traffic"

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # All protocols
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 5. Resource: The EC2 Instance
resource "aws_instance" "web_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y nginx
              systemctl start nginx
              EOF

  tags = {
    Name        = "MyWebServer"
    Environment = "Dev"
  }
}

# 6. Output: The Public IP
output "web_server_ip" {
  value       = aws_instance.web_server.public_ip
  description = "Connect via: http://${aws_instance.web_server.public_ip}"
}
```

---

## Part 2: Intermediate Concepts & Examples

### 1. State Management: Configuring a Remote Backend
If you use the above code in a team, you must configure a remote backend.

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "company-terraform-state-bucket"
    key            = "web-server/terraform.tfstate"
    region         = "us-east-1"
    
    # DynamoDB table must have a Primary Key named 'LockID'
    dynamodb_table = "terraform-state-locks" 
    
    encrypt        = true
  }
}
```

### 2. Meta-Arguments in Practice

#### `count` vs `for_each`
Never use `count` when creating multiple unique resources. Use `for_each`.

**Bad (Using count):**
```hcl
variable "user_names" {
  type    = list(string)
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "bad_users" {
  count = length(var.user_names)
  name  = var.user_names[count.index]
}
```
*Why it's bad:* If you delete "bob", the list becomes `["alice", "charlie"]`. Terraform sees index `1` changed from "bob" to "charlie". It will destroy Bob, and rename/recreate Charlie.

**Good (Using for_each):**
```hcl
variable "user_names_set" {
  type    = set(string)
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "good_users" {
  for_each = var.user_names_set
  name     = each.key
}
```
*Why it's good:* Resources are indexed by their string name (`aws_iam_user.good_users["bob"]`). Deleting Bob only destroys Bob.

### 3. Dynamic Blocks
When you have a variable number of nested blocks (like ingress rules).

```hcl
variable "ingress_ports" {
  type    = list(number)
  default = [80, 443, 8080]
}

resource "aws_security_group" "dynamic_sg" {
  name = "dynamic-sg"

  dynamic "ingress" {
    for_each = var.ingress_ports
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
```

### 4. `for` Expressions and Built-in Functions
Data transformation directly in Terraform.

```hcl
variable "servers" {
  type = map(string)
  default = {
    web = "10.0.1.10"
    db  = "10.0.1.20"
  }
}

output "server_urls" {
  # Transforms map to list of strings
  value = [for name, ip in var.servers : "http://${ip}:8080"]
}
# Output: ["http://10.0.1.10:8080", "http://10.0.1.20:8080"]

output "subnet_calculation" {
  # cidrsubnet(prefix, newbits, netnum)
  value = cidrsubnet("10.0.0.0/16", 8, 2)
}
# Output: "10.0.2.0/24"
```

---

## Part 3: Advanced State Manipulation (Expert)

When things go wrong in production, you use state commands.

**1. Importing Existing Infrastructure**
Someone manually created an S3 bucket named `my-manual-bucket`. You want to manage it.
1. Write the code:
   ```hcl
   resource "aws_s3_bucket" "my_bucket" {
     bucket = "my-manual-bucket"
   }
   ```
2. Run the import command:
   ```bash
   terraform import aws_s3_bucket.my_bucket my-manual-bucket
   ```
3. Run `terraform plan` to see if your code matches reality.

**2. Removing a Resource from State**
You want to delete the Terraform code for a database, but you **DO NOT** want Terraform to destroy the actual database.
```bash
# 1. Remove it from the state file
terraform state rm aws_db_instance.my_database

# 2. Delete the code from main.tf
# 3. Run terraform plan (It should say "No changes")
```

**3. Moving/Renaming Resources**
You refactored your code and changed the logical name from `aws_instance.web` to `aws_instance.frontend`.
If you just run apply, Terraform will destroy `web` and create `frontend`. To prevent this:
```bash
terraform state mv aws_instance.web aws_instance.frontend
```

---

## Part 4: Terragrunt & Directory Layouts

### Why Terragrunt?
Terraform Workspaces share the same code and backend. A mistake in the `prod` workspace can destroy production.
Terragrunt wraps Terraform, keeping configurations completely isolated per directory while keeping code DRY.

### Example Terragrunt Architecture

**1. The Root `terragrunt.hcl` (Defines the backend for all environments):**
```hcl
# live/terragrunt.hcl
remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket         = "my-company-tg-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "my-lock-table"
  }
}
```

**2. The Environment `terragrunt.hcl` (Calls the module):**
```hcl
# live/prod/vpc/terragrunt.hcl
include {
  path = find_in_parent_folders()
}

terraform {
  source = "git::git@github.com:my-company/terraform-modules.git//vpc?ref=v1.0.0"
}

inputs = {
  environment = "prod"
  cidr_block  = "10.100.0.0/16"
}
```

**Commands:**
```bash
# Instead of terraform apply, you run:
terragrunt apply

# To apply all modules in dev at once:
cd live/dev
terragrunt run-all apply
```

---

## Part 5: Terratest (Go)

Enterprise IaC must be tested. Terratest is the standard.

```go
package test

import (
	"testing"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestAwsS3Bucket(t *testing.T) {
	// Retryable errors in case of eventual consistency
	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../modules/s3-bucket",

		Vars: map[string]interface{}{
			"bucket_name": "my-terratest-bucket-12345",
		},
	})

	// Defer the destroy so it always runs, even if the test fails
	defer terraform.Destroy(t, terraformOptions)

	// Run terraform init and apply
	terraform.InitAndApply(t, terraformOptions)

	// Fetch the output
	bucketArn := terraform.Output(t, terraformOptions, "bucket_arn")

	// Verify the output matches our expectation
	assert.Equal(t, "arn:aws:s3:::my-terratest-bucket-12345", bucketArn)
}
```
Run the test: `go test -v -timeout 30m`

---

## Part 6: CDKTF (Cloud Development Kit for Terraform)

For developers who prefer general-purpose languages over HCL.

**Example in TypeScript:**
```typescript
import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider, ec2 } from "@cdktf/provider-aws";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      region: "us-west-2",
    });

    new ec2.Instance(this, "MyEc2Instance", {
      ami: "ami-0123456789abcdef0",
      instanceType: "t2.micro",
      tags: {
        Name: "CDKTF-Instance",
      },
    });
  }
}

const app = new App();
new MyStack(app, "hello-cdktf");
app.synth();
```
Run `cdktf deploy` to provision.

---

## Interview Questions

### Use Case: Zero-Downtime Database Migration
You need to change the instance class of an RDS database. Terraform will try to do it in-place, which causes downtime.
**Best Practice:** Use a Blue/Green deployment strategy. Terraform handles the creation of the new (Green) RDS instance alongside the old one. Once replication is caught up, you update your Route53 or application config in Terraform to point to the Green database. Once verified, you delete the Blue database code.

### Interview Questions

**1. Explain the `terraform taint` command and its modern alternative.**
*Answer:* `terraform taint aws_instance.web` used to mark a resource as degraded, forcing Terraform to destroy and recreate it on the next `apply`. In Terraform 0.15+, `taint` is deprecated. The modern approach is to use the `-replace` flag: `terraform apply -replace="aws_instance.web"`.

**2. How do you handle sensitive variables like DB passwords in Terraform?**
*Answer:* 
1. Pass them via environment variables: `export TF_VAR_db_password="supersecret"`.
2. Do not define a `default` in `variables.tf`.
3. Mark the output as sensitive: `output "db_pass" { value = var.db_password; sensitive = true }` so it isn't printed to the console.
4. (Best Practice) Don't pass them to Terraform at all. Use `data "aws_secretsmanager_secret"` to fetch them dynamically during the run, or generate a random password using the `random_password` provider and store it directly into Secrets Manager.

**3. What is a "Provider Block" versus a "Provider Configuration"?**
*Answer:* You define required providers in the `terraform { required_providers { ... } }` block to tell Terraform which plugin to download. You configure the provider (e.g., setting the AWS region or authentication details) in the `provider "aws" { ... }` block. You can also have multiple provider configurations using the `alias` meta-argument (e.g., managing resources in both `us-east-1` and `eu-west-1` in the same code).
