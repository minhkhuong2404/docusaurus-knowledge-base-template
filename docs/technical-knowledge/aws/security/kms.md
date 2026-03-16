---
id: kms
title: AWS KMS (Key Management Service)
sidebar_label: "🔑 KMS"
description: >
  AWS KMS for DVA-C02. CMKs vs AWS-managed keys, envelope encryption,
  key policies, grants, key rotation, multi-region keys, and KMS API limits
  with Java examples.
tags:
  - kms
  - encryption
  - security
  - cmk
  - envelope-encryption
  - key-rotation
  - dva-c02
  - domain-2
---

# AWS KMS — Key Management Service

> **Core concept**: KMS manages encryption keys. AWS services use KMS internally (S3 SSE-KMS, RDS, EBS). You can also use KMS directly in your apps.

---

## Key Types

| Type | Description | Rotation | Use |
|---|---|---|---|
| **AWS Managed Key** | Auto-created when you enable encryption in a service | Every 1 year (automatic) | Service-default encryption |
| **Customer Managed Key (CMK)** | You create and control | You configure (annual or manual) | Full control, cross-account, custom policies |
| **AWS-Owned Key** | Shared across customers, not visible | AWS managed | Free, no audit trail |

---

## CMK Key Material

| Source | Description |
|---|---|
| **KMS** (default) | AWS generates and stores key material |
| **External** (BYOK) | You import your own key material |
| **CloudHSM** | Key material stored in a hardware security module |

---

## Envelope Encryption

KMS directly encrypts data up to **4KB**. For larger data, use **envelope encryption**:

```
Your Plaintext Data (large)
          │
          ▼
  Generate Data Key (DEK)
  ┌──────────────────────────────────┐
  │ Plaintext DEK → encrypt data     │
  │ Encrypted DEK → stored with data │
  └──────────────────────────────────┘
          │
          ▼
  Store: Encrypted Data + Encrypted DEK

  To Decrypt:
  KMS decrypts the Encrypted DEK → Plaintext DEK → decrypts data
```

```java
KmsClient kms = KmsClient.create();

// Generate a data key
GenerateDataKeyResponse keyResponse = kms.generateDataKey(
    GenerateDataKeyRequest.builder()
        .keyId("arn:aws:kms:us-east-1:123456789012:key/my-key-id")
        .keySpec(DataKeySpec.AES_256)
        .build());

byte[] plaintextKey = keyResponse.plaintext().asByteArray();   // Encrypt data locally
byte[] encryptedKey = keyResponse.ciphertextBlob().asByteArray(); // Store alongside ciphertext

// Decrypt data key later
DecryptResponse decryptResponse = kms.decrypt(
    DecryptRequest.builder()
        .ciphertextBlob(SdkBytes.fromByteArray(encryptedKey))
        .build());
```

---

## KMS API Operations

| API | Description |
|---|---|
| `Encrypt` | Encrypt up to 4KB directly |
| `Decrypt` | Decrypt ciphertext |
| `GenerateDataKey` | Get plaintext + encrypted DEK |
| `GenerateDataKeyWithoutPlaintext` | Get only encrypted DEK (encrypt later) |
| `ReEncrypt` | Re-encrypt under a different key (plaintext never leaves KMS) |
| `DescribeKey` | Get key metadata |

---

## Key Policies

Every CMK has a **resource-based policy**. Without a key policy that grants access, IAM policies alone won't work:

```json
{
  "Sid": "Allow Lambda role to use this key",
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::123456789012:role/LambdaRole" },
  "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
  "Resource": "*"
}
```

---

## KMS Limits (API Throttling!)

| API | Default TPS |
|---|---|
| Encrypt / Decrypt | 5,500 – 30,000/s (region-dependent) |
| GenerateDataKey | Same |

:::caution Throttling at scale
If your Lambda is called 10,000 times/second and each call does `kms:Decrypt`, you'll hit KMS throttling.

**Fix**: Use **Data Key Caching** (with AWS Encryption SDK) — cache the plaintext DEK in memory, reducing KMS calls.
:::

---

## 🧪 Practice Questions

**Q1.** A Lambda function needs to encrypt a 50MB file before storing it in S3. Which approach should the developer use?

A) Call `kms:Encrypt` with the 50MB file  
B) Use Envelope Encryption — generate a data key and encrypt locally  
C) Use S3 SSE-S3  
D) Call `kms:GenerateDataKey` 50 times  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — KMS can only encrypt data up to **4KB** directly. For larger data, use **envelope encryption**: `GenerateDataKey` → encrypt data locally with the plaintext DEK → store encrypted DEK alongside ciphertext → delete plaintext DEK from memory.
</details>

---

**Q2.** A developer wants to re-encrypt S3 objects that were encrypted with Key A, using Key B instead, without ever exposing the plaintext. Which KMS API should they use?

A) Decrypt → Encrypt  
B) `ReEncrypt`  
C) `GenerateDataKey`  
D) `RotateKey`  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — `ReEncrypt` performs a server-side re-encryption entirely within KMS. The plaintext never leaves KMS and never appears in your code.
</details>

---

## 🔗 Resources

- [KMS Developer Guide](https://docs.aws.amazon.com/kms/latest/developerguide/)
- [AWS Encryption SDK for Java](https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/java.html)
- [KMS Key Policies](https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html)
