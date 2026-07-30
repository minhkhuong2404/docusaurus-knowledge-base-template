---
id: ssm-parameter-store
title: SSM Parameter Store
sidebar_label: "⚙️ SSM Parameter Store"
description: >
  AWS Systems Manager Parameter Store for DVA-C02. Tiers, types, SecureString,
  hierarchy naming, GetParametersByPath, integration with Lambda/ECS/CloudFormation,
  and comparison with Secrets Manager.
tags:
  - ssm
  - parameter-store
  - configuration
  - security
  - secrets
  - dva-c02
  - domain-2
---

# SSM Parameter Store

> **Quick summary**: Free, hierarchical config/secret store. No auto-rotation. Best for application configuration and lower-sensitivity secrets.

See also: [Secrets Manager vs SSM Parameter Store](./secrets-manager) for a detailed comparison.

---

## 🔰 What Is Parameter Store?

Parameter Store is a **centralized, hierarchical configuration management service**. Think of it as a key-value store organized in folders — like a filesystem for configuration.

---

## Parameter Types & Tiers

### Types

| Type | Encryption | Use Case | Example |
|---|---|---|---|
| `String` | None | URLs, feature flags, config | `jdbc:mysql://db.example.com:3306/mydb` |
| `StringList` | None | Comma-separated values | `us-east-1,eu-west-1,ap-southeast-1` |
| `SecureString` | KMS encrypted | Passwords, API keys | `SuperSecret123!` |

### Tiers

| Feature | Standard | Advanced |
|---|---|---|
| **Max size** | 4 KB | 8 KB |
| **Max parameters** | 10,000 | 100,000 |
| **Parameter policies** | ❌ | ✅ (expiration, notification) |
| **Throughput** | 40 TPS (default) | Up to 10,000 TPS |
| **Cost** | **Free** | $0.05/month per parameter |
| **Higher throughput** | Extra charge | Included |

---

## Hierarchical Organization

```
/                              (root)
├── prod/
│   ├── myapp/
│   │   ├── db-url             String
│   │   ├── db-password        SecureString (KMS encrypted)
│   │   ├── db-port            String
│   │   ├── feature-flags      StringList
│   │   └── api-key            SecureString
│   └── shared/
│       ├── cors-origins       StringList
│       └── jwt-secret         SecureString
├── staging/
│   └── myapp/
│       ├── db-url             String
│       └── db-password        SecureString
└── dev/
    └── myapp/
        ├── db-url             String
        └── db-password        SecureString
```

### Benefits of Hierarchy

- **GetParametersByPath** — load all config for an environment in one call
- **IAM scoping** — restrict access by path prefix
- **Environment isolation** — same parameter names, different paths

```json
// IAM policy: Allow dev team access only to /dev/ parameters
{
  "Effect": "Allow",
  "Action": ["ssm:GetParameter*"],
  "Resource": "arn:aws:ssm:us-east-1:123456789012:parameter/dev/*"
}
```

---

## Java SDK Integration

### Lambda — Load Config at Init Time

```java
public class OrderHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private static final SsmClient SSM = SsmClient.create();
    private static final Map<String, String> CONFIG;
    
    // Load ALL config at init time (runs once per cold start)
    static {
        GetParametersByPathResponse response = SSM.getParametersByPath(
            GetParametersByPathRequest.builder()
                .path("/prod/myapp/")
                .withDecryption(true)
                .recursive(true)
                .build());
        
        CONFIG = response.parameters().stream()
            .collect(Collectors.toMap(
                p -> p.name().substring(p.name().lastIndexOf('/') + 1),  // Extract param name
                Parameter::value));
    }
    
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        String dbUrl = CONFIG.get("db-url");
        String apiKey = CONFIG.get("api-key");
        // Use cached config — no SSM calls on warm invocations
    }
}
```

### ECS Task Definition

```json
{
  "containerDefinitions": [{
    "name": "myapp",
    "secrets": [
      {
        "name": "DB_PASSWORD",
        "valueFrom": "arn:aws:ssm:us-east-1:123:parameter/prod/myapp/db-password"
      },
      {
        "name": "API_KEY",
        "valueFrom": "arn:aws:ssm:us-east-1:123:parameter/prod/myapp/api-key"
      }
    ]
  }]
}
```

---

## CloudFormation Integration

```yaml
# Method 1: Parameter section (String/StringList only, NOT SecureString)
Parameters:
  DbUrl:
    Type: AWS::SSM::Parameter::Value<String>
    Default: /prod/myapp/db-url

# Method 2: Dynamic references (works with ALL types including SecureString)
Resources:
  MyRdsInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: mysql
      # String parameter
      DBName: "{{resolve:ssm:/prod/myapp/db-name}}"
      # SecureString parameter (MUST use ssm-secure)
      MasterUserPassword: "{{resolve:ssm-secure:/prod/myapp/db-password:1}}"
      # Secrets Manager
      # MasterUserPassword: "{{resolve:secretsmanager:prod/db-secret:SecretString:password}}"
```

---

## Parameter Policies (Advanced Tier)

```json
// Expiration: Delete parameter after date
{
  "Type": "Expiration",
  "Version": "1.0",
  "Attributes": { "Timestamp": "2025-12-31T00:00:00.000Z" }
}

// Notification before expiration
{
  "Type": "ExpirationNotification",
  "Version": "1.0",
  "Attributes": { "Before": "15", "Unit": "Days" }
}

// Alert if not updated for N days
{
  "Type": "NoChangeNotification",
  "Version": "1.0",
  "Attributes": { "After": "90", "Unit": "Days" }
}
```

---

## SecureString & KMS

Reading a SecureString requires **TWO** permissions:

```json
{
  "Effect": "Allow",
  "Action": [
    "ssm:GetParameter",       // Permission to read the parameter
    "kms:Decrypt"             // Permission to decrypt with the KMS key
  ],
  "Resource": [
    "arn:aws:ssm:us-east-1:123:parameter/prod/myapp/*",
    "arn:aws:kms:us-east-1:123:key/my-key-id"
  ]
}
```

---

## Parameter Store vs Environment Variables

| Feature | SSM Parameter Store | Lambda Env Variables |
|---|---|---|
| **Max size** | 4-8 KB per param | 4 KB total |
| **Encryption** | KMS (SecureString) | KMS (optional) |
| **Centralized** | ✅ Shared across functions | ❌ Per-function |
| **Versioning** | ✅ | ❌ |
| **Hierarchy** | ✅ | ❌ |
| **Dynamic updates** | ✅ (next cold start) | ❌ (redeploy required) |
| **Cost** | Free (Standard) | Free |

---

## 🎯 DVA-C02 Exam Tips

:::tip[SSM Parameter Store Exam Cheat Sheet]
1. **Free** for Standard tier (up to 10,000 parameters)
2. **SecureString** needs BOTH `ssm:GetParameter` AND `kms:Decrypt` permissions
3. **CloudFormation SecureString** = MUST use `{{resolve:ssm-secure:...}}`
4. **GetParametersByPath** = load all config under a path prefix in one call
5. **No auto-rotation** — use custom Lambda or Secrets Manager instead
6. **Advanced tier** = parameter policies (expiration, notification)
7. **ECS secrets** can reference SSM parameters directly
8. **Hierarchy** enables IAM path-based access control
:::

---

## Practice Questions

**Q1.** CloudFormation template needs SecureString from SSM. How?

A) `AWS::SSM::Parameter::Value<SecureString>`  
B) **`{{resolve:ssm-secure:/path/to/param}}`**  
C) Direct string in template  
D) Custom resource  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — SecureString in CloudFormation requires dynamic references with `ssm-secure`. The Parameters section doesn't support SecureString type.
</details>

---

**Q2.** App needs auto-rotating DB password. Which service?

A) **Secrets Manager**  
B) SSM Parameter Store  
C) KMS  
D) IAM  

<details>
<summary>✅ Answer & Explanation</summary>

**A** — Secrets Manager has native auto-rotation for RDS. SSM Parameter Store has no built-in rotation.
</details>

---

**Q3.** Lambda reads SecureString but gets `AccessDeniedException`. Role has `ssm:GetParameter`. What's missing?

A) `ssm:DescribeParameters`  
B) **`kms:Decrypt` on the KMS key**  
C) `ssm:GetParameters`  
D) VPC endpoint  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — SecureString is encrypted with KMS. The role needs both `ssm:GetParameter` AND `kms:Decrypt`.
</details>

---

## 🔗 Resources

- [SSM Parameter Store Guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [CloudFormation Dynamic References](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references.html)
- [Parameter Store vs Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
