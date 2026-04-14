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

## 🎯 DVA-C02 Exam Tips

:::tip[Quick Exam Rules]
- **Parameter Store vs Secrets Manager**: If the question mentions **automatic rotation** for RDS/Redshift/DocumentDB, the answer is **Secrets Manager**. If it mentions **free** or **basic configuration strings**, the answer is **SSM Parameter Store**.
- **KMS Encryption**: SecureStrings in SSM Parameter Store are encrypted using AWS KMS. You need BOTH `ssm:GetParameter` and `kms:Decrypt` permissions to read a SecureString.
- **CloudFormation**: To use a SecureString in CloudFormation, you MUST use dynamic references (`{{resolve:ssm-secure:...}}`). You cannot pass them via the `Parameters:` block default type `AWS::SSM::Parameter::Value<String>`.
- **Parameter Policies**: Use parameter policies to enforce expiration dates and receive notifications when parameters are about to expire.
- **Parameter Store vs Secrets Manager**: If the question mentions **automatic rotation** for RDS/Redshift/DocumentDB, the answer is **Secrets Manager**. If it mentions **free** or **basic configuration strings**, the answer is **SSM Parameter Store**.
:::

---

## 🧪 Practice Questions

**Q1.** An application needs to store database credentials securely. The credentials must be automatically rotated every 30 days without any custom Lambda code. Which AWS service should be used?

A) AWS KMS  
B) AWS Systems Manager Parameter Store  
C) AWS Secrets Manager  
D) Amazon S3  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Secrets Manager** natively supports automatic rotation of credentials for supported AWS databases like RDS. **SSM Parameter Store** does not support automatic rotation natively (you would have to write custom Lambda logic).
</details>

---

**Q2.** A developer is writing a CloudFormation template to deploy an RDS instance. They have stored the database password as a `SecureString` in SSM Parameter Store. How should they reference this password in the CloudFormation template?

A) Using `AWS::SSM::Parameter::Value<SecureString>` in the Parameters section  
B) Using a dynamic reference: `{{resolve:ssm-secure:/path/to/password:version}}`  
C) Storing an unencrypted string in the Parameters section  
D) Passing the password using the AWS CLI at deployment time  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — CloudFormation does not support `SecureString` types in the `Parameters` block. You MUST use a **dynamic reference** (`{{resolve:ssm-secure:...}}`) directly in the resource properties.
</details>

---

## 🔗 Resources

- [SSM Parameter Store User Guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [CloudFormation Dynamic References](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references.html)
