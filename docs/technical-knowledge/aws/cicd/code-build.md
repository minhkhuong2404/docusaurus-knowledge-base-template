---
id: code-build
title: AWS CodeBuild
sidebar_label: "🔨 CodeBuild"
description: >
  AWS CodeBuild deep dive for DVA-C02. buildspec.yml phases, environment
  variables, artifacts, caching, VPC support, test reports, and
  Maven/Gradle Java integration.
tags:
  - codebuild
  - cicd
  - build
  - testing
  - java
  - maven
  - gradle
  - dva-c02
  - domain-3
---

# AWS CodeBuild

> **Core concept**: CodeBuild is a fully managed **continuous integration** service — no Jenkins servers to maintain.

---

## buildspec.yml Reference

```yaml
version: 0.2

run-as: root

env:
  variables:           # Plaintext env vars (visible in console)
    JAVA_HOME: "/usr/lib/jvm/java-17"
    
  parameter-store:     # Fetched from SSM at build start
    DB_URL: "/prod/myapp/db-url"
    
  secrets-manager:     # Fetched from Secrets Manager at build start
    DB_PASSWORD: "prod/myapp/db:password"
    API_KEY: "prod/myapp/api-key:key"

  exported-variables:  # Available to downstream CodePipeline stages
    - IMAGE_TAG

phases:
  install:
    runtime-versions:
      java: corretto17
    commands:
      - echo "Installing tools..."
      
  pre_build:
    commands:
      - echo "Logging in to ECR..."
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login ...
      - export IMAGE_TAG=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)

  build:
    commands:
      - echo "Build started on `date`"
      - mvn clean verify    # Compile + test + package
      - docker build -t my-app:$IMAGE_TAG .

  post_build:
    on-failure: ABORT    # ABORT or CONTINUE
    commands:
      - echo "Pushing image..."
      - docker push $ECR_REPO:$IMAGE_TAG
      - printf '[{"name":"app","imageUri":"%s"}]' $ECR_REPO:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
    - appspec.yaml
    - taskdef.json
  name: BuildOutput

secondary-artifacts:
  TestReports:
    files:
      - target/surefire-reports/**/*.xml
    discard-paths: no

reports:
  SurefireReports:
    files:
      - "target/surefire-reports/**/*.xml"
    file-format: JUNITXML
    discard-paths: no

cache:
  paths:
    - '/root/.m2/**/*'        # Maven local repo
    - '/root/.gradle/**/*'    # Gradle cache
```

---

## Built-in Environment Variables

| Variable | Value |
|---|---|
| `AWS_DEFAULT_REGION` | Region of the build |
| `AWS_ACCOUNT_ID` | Account ID |
| `CODEBUILD_BUILD_ID` | Unique build ID |
| `CODEBUILD_RESOLVED_SOURCE_VERSION` | Git commit SHA |
| `CODEBUILD_SOURCE_REPO_URL` | Source repository URL |

---

## Caching

| Cache Type | Location | Best For |
|---|---|---|
| **Local** | Build host (cleared between hosts) | Fast single-host builds |
| **S3** | Persisted across builds | Maven/Gradle dependencies |

```yaml
cache:
  type: S3
  location: my-bucket/codebuild-cache
  paths:
    - '/root/.m2/**/*'
```

---

## VPC Support

For builds that need to access private resources (RDS, ElastiCache, internal APIs):

```yaml
# CloudFormation
CodeBuildProject:
  Type: AWS::CodeBuild::Project
  Properties:
    VpcConfig:
      VpcId: !Ref VPC
      Subnets: [!Ref PrivateSubnet1, !Ref PrivateSubnet2]
      SecurityGroupIds: [!Ref BuildSecurityGroup]
```

:::caution NAT Gateway required
Builds in a VPC cannot reach the internet (for pulling Docker images, downloading Maven artifacts) unless a **NAT Gateway** is configured in the VPC.
:::

---

## Test Reports

```yaml
reports:
  MyTestReports:
    files:
      - "**/*.xml"
    base-directory: target/surefire-reports
    file-format: JUNITXML  # Or CUCUMBERJSON, TESTNGXML, VISUALSTUDIOTRX
```

Reports appear in the CodeBuild console with pass/fail trends.

---

## 🧪 Practice Questions

**Q1.** A CodeBuild project needs to access a private RDS instance during integration tests. What configuration is required?

A) Use RDS public endpoint  
B) Configure **VPC settings** (VPC, Subnets, Security Groups) on the CodeBuild project  
C) Allow `0.0.0.0/0` in the RDS security group  
D) Use RDS IAM Authentication  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Configure **VPC, subnets, and security groups** on the CodeBuild project. The build environment runs inside your VPC and can access private resources. Add a NAT Gateway if the build also needs internet access.
</details>

---

**Q2.** A developer wants to speed up Maven builds by reusing downloaded dependencies between builds. What should they configure?

A) Increase CodeBuild compute size  
B) Use a custom Docker image with pre-installed dependencies  
C) Configure **S3 cache** for `/root/.m2/**/*`  
D) Use buildspec `install` phase to pre-download  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **S3 caching** persists the Maven local repository between builds. CodeBuild uploads the cache to S3 after each build and downloads it at the start, dramatically reducing dependency download time.
</details>

---

## 🔗 Resources

- [CodeBuild User Guide](https://docs.aws.amazon.com/codebuild/latest/userguide/)
- [buildspec.yml Reference](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
- [CodeBuild Environment Variables](https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-env-vars.html)
- [Maven with CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-maven-5m.html)
