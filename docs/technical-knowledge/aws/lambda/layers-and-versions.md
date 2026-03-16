---
id: layers-and-versions
title: Lambda Layers, Versions & Aliases
sidebar_label: "⚡ Layers & Versions"
description: >
  Lambda Layers, Versions, and Aliases for DVA-C02. Layer structure, sharing
  across functions, version immutability, alias routing for canary deployments,
  and $LATEST vs published versions.
tags:
  - lambda
  - layers
  - versions
  - aliases
  - canary
  - deployment
  - dva-c02
  - domain-3
---

# Lambda Layers, Versions & Aliases

---

## Lambda Layers

A layer is a **ZIP archive** containing libraries, custom runtime, or data that multiple functions can share.

### Benefits
- Reduce deployment package size
- Share common code (utilities, AWS SDK wrappers)
- Manage dependencies separately from function code

### Layer Structure

```
layer.zip
└── java/
    └── lib/
        └── my-shared-library.jar   ← Available at runtime classpath
```

```bash
# Create layer from dependencies
mkdir -p layer/java/lib
cp target/dependency/*.jar layer/java/lib/
cd layer && zip -r ../my-layer.zip .

# Publish layer
aws lambda publish-layer-version \
    --layer-name java-common-utils \
    --zip-file fileb://my-layer.zip \
    --compatible-runtimes java17 java21
```

### Attach to Function

```yaml
# SAM
MyFunction:
  Type: AWS::Serverless::Function
  Properties:
    Layers:
      - !Ref CommonUtilsLayer    # Up to 5 layers per function
      - arn:aws:lambda:us-east-1:123456789012:layer:my-layer:3

CommonUtilsLayer:
  Type: AWS::Serverless::LayerVersion
  Properties:
    LayerName: common-utils
    ContentUri: layers/common-utils/
    CompatibleRuntimes: [java17]
    RetentionPolicy: Retain
```

:::note Layer limits
- Max **5 layers** per function
- Total unzipped size (function + all layers) ≤ **250 MB**
:::

---

## Lambda Versions

| Concept | Description |
|---|---|
| `$LATEST` | Mutable — always the latest code. Cannot use in production routing |
| `Published Version` (1, 2, 3...) | Immutable snapshot — code + config frozen at publish time |

```bash
# Publish current $LATEST as a new version
aws lambda publish-version --function-name my-function
# Returns: FunctionArn: arn:aws:lambda:...:my-function:5
```

:::caution $LATEST is mutable
Never point production traffic directly at `$LATEST`. Use **aliases** pointing to published versions.
:::

---

## Lambda Aliases

Aliases are **named pointers** to one (or two) published versions:

```bash
# Create alias pointing to version 5
aws lambda create-alias \
    --function-name my-function \
    --name prod \
    --function-version 5

# Canary: 90% to v5, 10% to v6
aws lambda update-alias \
    --function-name my-function \
    --name prod \
    --routing-config AdditionalVersionWeights={"6"=0.1}
```

```
my-function:prod  →  90% → version 5 (stable)
                  →  10% → version 6 (canary)
```

### Common Alias Strategy

```
my-function:dev    → $LATEST  (development, always latest)
my-function:staging → version 10
my-function:prod   → version 9  (stable, tested)
```

### Aliases + CodeDeploy

CodeDeploy uses aliases to shift traffic between Lambda versions:

```yaml
# SAM: deploy with CodeDeploy canary
MyFunction:
  Type: AWS::Serverless::Function
  Properties:
    AutoPublishAlias: live
    DeploymentPreference:
      Type: Canary10Percent5Minutes
      Alarms:
        - !Ref ErrorAlarm
      Hooks:
        PreTraffic: !Ref PreTrafficHook
```

---

## 🧪 Practice Questions

**Q1.** A developer updates Lambda function code at `$LATEST` and publishes version 3. API Gateway points to the `prod` alias. Will prod users see the new code immediately?

A) Yes — aliases always reflect the latest code  
B) No — **`prod` alias still points to the previous version** until manually updated  
C) Yes — published versions are automatically promoted to aliases  
D) No — `$LATEST` changes require a new deployment  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Aliases are explicit pointers to specific versions. Publishing a new version does **not** automatically update any alias. You must call `UpdateAlias` to point `prod` to the new version.
</details>

---

**Q2.** A team wants to share a large set of Java utility libraries across 20 Lambda functions without repeating them in each deployment package. What should they use?

A) Include the JARs in every function's deployment package  
B) Store JARs in S3 and download at runtime  
C) **Lambda Layers** — package JARs in a layer, attach to all functions  
D) Lambda SnapStart  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Lambda Layers** are designed exactly for this — shared libraries packaged once and attached to multiple functions. Reduces deployment size and centralizes dependency management.
</details>

---

## 🔗 Resources

- [Lambda Layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
- [Lambda Versions](https://docs.aws.amazon.com/lambda/latest/dg/configuration-versions.html)
- [Lambda Aliases](https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html)
- [Traffic Shifting with Lambda](https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html#configuring-alias-routing)
