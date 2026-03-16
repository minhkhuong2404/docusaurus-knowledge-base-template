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

> **Quick summary**: Free, hierarchical config/secret store. No auto-rotation. Use for configuration and lower-sensitivity secrets.

See also: [Secrets Manager vs SSM Parameter Store](./secrets-manager) for a detailed comparison.

---

## Parameter Tiers

| Tier | Max Size | Advanced Features | Cost |
|---|---|---|---|
| **Standard** | 4 KB | No | Free |
| **Advanced** | 8 KB | Parameter policies, change notifications | $0.05/month |

### Parameter Policies (Advanced Tier)

```json
// Notify before expiration
[{
  "Type": "Expiration",
  "Version": "1.0",
  "Attributes": { "Timestamp": "2025-12-31T00:00:00.000Z" }
}, {
  "Type": "ExpirationNotification",
  "Version": "1.0",
  "Attributes": {
    "Before": "15",
    "Unit": "Days"
  }
}]
```

---

## CloudFormation Integration

```yaml
# Reference SSM parameter directly in CloudFormation
Parameters:
  DbPassword:
    Type: AWS::SSM::Parameter::Value<String>
    Default: /prod/myapp/db-password

# Or using dynamic references (no Parameter section needed)
Resources:
  MyRdsInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      MasterUserPassword: "{{resolve:ssm-secure:/prod/myapp/db-password:1}}"
      #                                    ^^^                            ^
      #                              SecureString                   version
```

### Dynamic Reference Types

| Type | Syntax | Use |
|---|---|---|
| SSM | `{{resolve:ssm:/param/name}}` | String / StringList |
| SSM-Secure | `{{resolve:ssm-secure:/param/name}}` | SecureString |
| Secrets Manager | `{{resolve:secretsmanager:secret-id:SecretString:key}}` | Secrets |

---

## Lambda Integration

```java
// At Lambda init time (runs once per cold start)
private static final String DB_URL;
static {
    SsmClient ssm = SsmClient.create();
    DB_URL = ssm.getParameter(GetParameterRequest.builder()
        .name("/prod/myapp/db-url")
        .withDecryption(true)
        .build()).parameter().value();
}

// Handler uses DB_URL — no SSM call on warm invocations
public String handleRequest(Object event, Context context) {
    // use DB_URL
}
```

---

## 🔗 Resources

- [SSM Parameter Store User Guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [CloudFormation Dynamic References](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references.html)
