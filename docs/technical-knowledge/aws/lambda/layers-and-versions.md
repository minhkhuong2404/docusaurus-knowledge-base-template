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

> **Exam Weight**: These concepts appear in Domain 3 (Deployment) — especially alias-based traffic shifting and CodeDeploy integration.

---

## 🔰 Why Layers, Versions & Aliases?

Think of Lambda deployment like publishing a book:
- **Layers** = shared reference materials (appendix, glossary) used by multiple books
- **Versions** = published editions (1st edition, 2nd edition) — immutable once printed
- **Aliases** = bookmarks like "latest edition" or "bestseller" — pointers that can move

Without these features, you'd copy all dependencies into every function and have no safe way to roll back deployments.

---

## Lambda Layers

A layer is a **ZIP archive** containing libraries, custom runtimes, or data shared across multiple functions.

### Benefits

| Benefit | Description |
|---|---|
| **Smaller deployments** | Dependencies in layers aren't counted toward 50MB zip limit |
| **Code sharing** | Common utilities shared across 10+ functions |
| **Separate dependency management** | Update libraries without redeploying function code |
| **Faster deployments** | Only upload changed code, not unchanged dependencies |

### Layer Directory Structure

Each runtime expects files in a specific path under `/opt`:

| Runtime | Layer Path | Available At |
|---|---|---|
| **Java** | `java/lib/*.jar` | Classpath |
| **Python** | `python/lib/python3.x/site-packages/` | `sys.path` |
| **Node.js** | `nodejs/node_modules/` | `require()` path |
| **Custom** | `bin/`, `lib/` | `$PATH`, `$LD_LIBRARY_PATH` |

```
layer.zip
└── java/
    └── lib/
        ├── commons-lang3-3.14.0.jar
        ├── jackson-databind-2.17.0.jar
        └── aws-lambda-powertools-1.18.0.jar
```

### Creating and Publishing a Layer

```bash
# Step 1: Package dependencies
mkdir -p layer/java/lib
mvn dependency:copy-dependencies -DoutputDirectory=layer/java/lib
cd layer && zip -r ../my-deps-layer.zip .

# Step 2: Publish layer version
aws lambda publish-layer-version \
    --layer-name java-common-deps \
    --description "Shared Java dependencies v2.1" \
    --zip-file fileb://my-deps-layer.zip \
    --compatible-runtimes java17 java21 \
    --compatible-architectures x86_64 arm64

# Step 3: Attach to a function
aws lambda update-function-configuration \
    --function-name my-function \
    --layers arn:aws:lambda:us-east-1:123456789012:layer:java-common-deps:3
```

### SAM Template with Layers

```yaml
Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: com.example.Handler::handleRequest
      Runtime: java17
      Layers:
        - !Ref CommonDepsLayer           # Local layer
        - arn:aws:lambda:us-east-1:123456789012:layer:powertools:5  # External layer

  CommonDepsLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: common-deps
      Description: "Shared Java dependencies"
      ContentUri: layers/common-deps/
      CompatibleRuntimes: [java17, java21]
      RetentionPolicy: Retain  # Keep old versions when updating
    Metadata:
      BuildMethod: java17  # SAM builds the layer
```

### Cross-Account Layer Sharing

```bash
# Grant another account permission to use your layer
aws lambda add-layer-version-permission \
    --layer-name java-common-deps \
    --version-number 3 \
    --statement-id share-with-team \
    --principal 987654321098 \
    --action lambda:GetLayerVersion

# Grant to entire organization
aws lambda add-layer-version-permission \
    --layer-name java-common-deps \
    --version-number 3 \
    --statement-id share-with-org \
    --principal "*" \
    --organization-id o-abc123def4 \
    --action lambda:GetLayerVersion
```

### Layer Limits & Gotchas

:::note[Layer Limits]
| Limit | Value |
|---|---|
| Max layers per function | **5** |
| Total unzipped size (function + layers) | **250 MB** |
| Individual layer size | Part of the 250 MB total |
| Layer versions | Unlimited (but old versions count toward storage) |
:::

:::caution[Layer Gotchas]
- Layers are extracted to `/opt` — files merge. If two layers have the same file path, the **last layer wins**
- Layer content is **read-only** at runtime
- Updating a layer creates a **new version**. Existing functions keep using the old version until you explicitly update them
- Layers are **NOT automatically updated** across functions — each function pins a specific layer version
:::

---

## Lambda Versions

### $LATEST vs Published Versions

| Property | `$LATEST` | Published Version (1, 2, 3...) |
|---|---|---|
| **Mutability** | Mutable — changes with every deploy | **Immutable** — frozen snapshot |
| **Code** | Always current code | Code at time of publish |
| **Configuration** | Always current config | Config at time of publish |
| **Alias support** | Can be target of alias | Can be target of alias |
| **Production use** | ❌ Never | ✅ Always |

### Publishing a Version

```bash
# Publish current $LATEST as a new immutable version
aws lambda publish-version \
    --function-name my-function \
    --description "Release v2.1 - fixed payment bug"

# Response includes:
# "Version": "5"
# "FunctionArn": "arn:aws:lambda:us-east-1:123:function:my-function:5"
```

### Version ARN Format

```
Unqualified ARN:  arn:aws:lambda:us-east-1:123:function:my-function
                  → Invokes $LATEST

Qualified ARN:    arn:aws:lambda:us-east-1:123:function:my-function:5
                  → Invokes version 5

Alias ARN:        arn:aws:lambda:us-east-1:123:function:my-function:prod
                  → Invokes whatever version "prod" alias points to
```

:::caution[Exam Trap: $LATEST in Production]
Never point production traffic directly at `$LATEST`. Any `UpdateFunctionCode` immediately changes what production serves. Always publish a version and use aliases.
:::

---

## Lambda Aliases

Aliases are **named pointers** to one or two published versions. They enable:
- **Stable endpoints** — API Gateway points to `prod` alias, not a version number
- **Safe deployments** — shift traffic gradually between versions
- **Environment separation** — `dev`, `staging`, `prod` aliases

### Creating and Managing Aliases

```bash
# Create alias pointing to version 5
aws lambda create-alias \
    --function-name my-function \
    --name prod \
    --function-version 5 \
    --description "Production traffic"

# Update alias to point to version 6
aws lambda update-alias \
    --function-name my-function \
    --name prod \
    --function-version 6

# List aliases
aws lambda list-aliases --function-name my-function
```

### Weighted Alias Routing (Canary Deployments)

Route a percentage of traffic to a new version for testing:

```bash
# 90% to v5 (stable), 10% to v6 (canary)
aws lambda update-alias \
    --function-name my-function \
    --name prod \
    --function-version 5 \
    --routing-config '{"AdditionalVersionWeights": {"6": 0.1}}'
```

```
Incoming requests to my-function:prod
    ├── 90% → version 5 (stable)
    └── 10% → version 6 (canary/testing)
```

:::tip[Senior Insight]
Weighted routing is **random per-invocation**, not per-client. The same client may hit different versions on consecutive calls. This is fine for stateless functions but be careful with stateful patterns.
:::

### Common Alias Strategy

```
Environment Mapping:
  my-function:dev     → $LATEST   (auto-updates, for development)
  my-function:staging → version 12 (tested, pre-production)
  my-function:prod    → version 11 (stable, serving customers)
  
API Gateway Stages:
  /dev   → Lambda alias "dev"
  /staging → Lambda alias "staging"  
  /prod  → Lambda alias "prod"
```

### Aliases + Stage Variables (API Gateway)

```yaml
# API Gateway uses stage variable to resolve Lambda alias
Integration:
  Type: AWS_PROXY
  Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${MyFunction.Arn}:${stageVariables.lambdaAlias}/invocations"

# dev stage: lambdaAlias = "dev"
# prod stage: lambdaAlias = "prod"
```

---

## Aliases + CodeDeploy (Automated Traffic Shifting)

CodeDeploy integrates natively with Lambda aliases for **automated, safe deployments**:

### SAM Template with CodeDeploy

```yaml
MyFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: com.example.Handler::handleRequest
    Runtime: java17
    AutoPublishAlias: live   # Auto-creates alias "live" and publishes versions
    DeploymentPreference:
      Type: Canary10Percent5Minutes  # 10% for 5 min, then 100%
      Alarms:
        - !Ref FunctionErrorAlarm     # Roll back if alarm triggers
        - !Ref ApiGateway5xxAlarm
      Hooks:
        PreTraffic: !Ref PreTrafficTestFunction   # Run tests before shifting
        PostTraffic: !Ref PostTrafficTestFunction  # Run tests after shifting
```

### Deployment Strategies

| Strategy | Behavior |
|---|---|
| `Canary10Percent5Minutes` | 10% for 5 min, then 100% |
| `Canary10Percent10Minutes` | 10% for 10 min, then 100% |
| `Canary10Percent15Minutes` | 10% for 15 min, then 100% |
| `Canary10Percent30Minutes` | 10% for 30 min, then 100% |
| `Linear10PercentEvery1Minute` | +10% every minute |
| `Linear10PercentEvery2Minutes` | +10% every 2 minutes |
| `Linear10PercentEvery3Minutes` | +10% every 3 minutes |
| `Linear10PercentEvery10Minutes` | +10% every 10 minutes |
| `AllAtOnce` | Immediate 100% (fastest, riskiest) |

### Pre-Traffic Hook Example

```java
// This function runs BEFORE traffic shifts to the new version
public class PreTrafficHook implements RequestHandler<Map<String, Object>, Void> {
    private static final CodeDeployClient codeDeploy = CodeDeployClient.create();
    private static final LambdaClient lambda = LambdaClient.create();
    
    public Void handleRequest(Map<String, Object> event, Context context) {
        String deploymentId = (String) event.get("DeploymentId");
        String lifecycleEventHookExecutionId = (String) event.get("LifecycleEventHookExecutionId");
        
        try {
            // Invoke the NEW version to verify it works
            InvokeResponse response = lambda.invoke(InvokeRequest.builder()
                .functionName("my-function:live")  // Invoke via alias
                .payload(SdkBytes.fromUtf8String("{\"test\": true}"))
                .build());
            
            String status = response.statusCode() == 200 ? "Succeeded" : "Failed";
            
            codeDeploy.putLifecycleEventHookExecutionStatus(r -> r
                .deploymentId(deploymentId)
                .lifecycleEventHookExecutionId(lifecycleEventHookExecutionId)
                .status(status));
        } catch (Exception e) {
            codeDeploy.putLifecycleEventHookExecutionStatus(r -> r
                .deploymentId(deploymentId)
                .lifecycleEventHookExecutionId(lifecycleEventHookExecutionId)
                .status("Failed"));  // Triggers automatic rollback
        }
        return null;
    }
}
```

---

## 🏆 Best Practices

### Layer Management
1. **Version your layers** — use meaningful descriptions and track what changed
2. **Pin layer versions** — never rely on "latest" in production
3. **One layer per concern** — separate utility libs from AWS SDK from custom frameworks
4. **Use `RetentionPolicy: Retain`** in SAM to keep old layer versions for rollback
5. **Clean up old layer versions** — they count toward Lambda storage quota

### Version & Alias Strategy
1. **Always use aliases for API Gateway integration** — never reference a version number directly
2. **Use `AutoPublishAlias`** in SAM for automated version management
3. **Start with `Canary10Percent5Minutes`** — safest default deployment strategy
4. **Configure CloudWatch Alarms** as rollback triggers in CodeDeploy
5. **Test in PreTraffic hooks** — catch issues before any production traffic hits new code

---

## 🎯 DVA-C02 Exam Tips

:::tip[Quick Exam Rules]
1. **$LATEST is mutable** — never use in production. Publish a version + use alias
2. **Aliases point to versions** — publishing a new version does NOT auto-update aliases
3. **Max 5 layers per function** — total unzipped size ≤ 250 MB
4. **Layer updates create new versions** — existing functions keep the old version
5. **Weighted alias routing** — canary deployments shift traffic between two versions
6. **CodeDeploy + Lambda** = automated traffic shifting with rollback on alarm
7. **`AutoPublishAlias`** in SAM = automatic version publish + alias management
8. **Layer path**: Files extract to `/opt` → Java: `/opt/java/lib/`, Python: `/opt/python/`
9. **Alias ARN format**: `arn:aws:lambda:region:account:function:name:alias`
10. **Provisioned Concurrency** can only be set on a **published version or alias**, not $LATEST
:::

---

## 🧪 Practice Questions

**Q1.** A developer updates Lambda function code at `$LATEST` and publishes version 3. API Gateway points to the `prod` alias. Will prod users see the new code immediately?

A) Yes — aliases always reflect the latest code  
B) **No — `prod` alias still points to the previous version**  
C) Yes — published versions are automatically promoted  
D) No — `$LATEST` changes require a new deployment  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Aliases are explicit pointers to specific versions. Publishing a new version does NOT update any alias. You must call `UpdateAlias` to point `prod` to version 3.
</details>

---

**Q2.** A team wants to share Java utility JARs across 20 Lambda functions. What should they use?

A) Include JARs in every deployment package  
B) Store JARs in S3, download at runtime  
C) **Lambda Layers**  
D) Lambda SnapStart  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Layers package shared dependencies once and attach to multiple functions. Reduces deployment size and centralizes management.
</details>

---

**Q3.** A team deploys a new Lambda version with `Canary10Percent5Minutes`. After 2 minutes, error rates spike. What happens?

A) The canary percentage increases to 20%  
B) All traffic stays on the old version indefinitely  
C) **CodeDeploy automatically rolls back to the previous version**  
D) The developer must manually roll back  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — If CloudWatch Alarms are configured as rollback triggers, CodeDeploy automatically reverts the alias to the previous version when the alarm triggers.
</details>

---

**Q4.** A function uses 3 layers totaling 200 MB unzipped. The function code is 60 MB unzipped. Can this be deployed?

A) Yes — each component is under the individual limit  
B) **No — total unzipped size (260 MB) exceeds the 250 MB limit**  
C) Yes — layers don't count toward the size limit  
D) No — functions can only have 2 layers  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — The total unzipped size of function code + all layers must not exceed **250 MB**. 200 + 60 = 260 MB, which exceeds the limit.
</details>

---

**Q5.** Which feature allows Provisioned Concurrency to be configured?

A) Only `$LATEST`  
B) Only published versions  
C) Only aliases  
D) **Published versions or aliases (not $LATEST)**  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — Provisioned Concurrency requires a stable, immutable target. `$LATEST` changes with every deploy, so it cannot have Provisioned Concurrency. You must use a published version or an alias.
</details>

---

**Q6.** A developer has two layers both containing a file at `java/lib/utils.jar`. Which version of the file will the function use?

A) The file from the first layer listed  
B) **The file from the last layer listed**  
C) Lambda throws a conflict error  
D) Both files are available with different names  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Layers are extracted to `/opt` in order. If two layers have the same file path, the **last layer** in the list overwrites the previous one.
</details>

---

## 🔗 Resources

- [Lambda Layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
- [Lambda Versions](https://docs.aws.amazon.com/lambda/latest/dg/configuration-versions.html)
- [Lambda Aliases](https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html)
- [Traffic Shifting with Lambda](https://docs.aws.amazon.com/lambda/latest/dg/lambda-traffic-shifting-using-aliases.html)
- [SAM Safe Deployments](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/automating-updates-to-serverless-apps.html)
- [CodeDeploy with Lambda](https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html)
