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

> **Core concept**: KMS manages encryption keys for AWS services (S3, EBS, RDS) and your applications. Understanding envelope encryption and key policies is critical for the exam.

---

## 🔰 What Is KMS?

KMS is a **managed encryption key service**. Think of it as a secure vault where AWS keeps your master keys. You never see the actual key material — you just tell KMS to encrypt/decrypt data, and it does it inside FIPS 140-2 validated hardware.

---

## Key Types

| Type | Description | Rotation | Cost | Audit |
|---|---|---|---|---|
| **AWS Managed Key** | Auto-created per service (e.g., `aws/s3`) | Annual (automatic) | Free | CloudTrail |
| **Customer Managed Key (CMK)** | You create and manage | Configurable | $1/month + API calls | CloudTrail |
| **AWS Owned Key** | Shared across customers | AWS managed | Free | ❌ No |

### Key Material Origins

| Source | Description | Use Case |
|---|---|---|
| **KMS** (default) | AWS generates and stores | Most common |
| **External** (BYOK) | You import your own key | Regulatory requirements |
| **CloudHSM** | Stored in your HSM cluster | Full control, FIPS 140-2 Level 3 |
| **External Key Store** | Key material in external HSM | Data sovereignty |

---

## Envelope Encryption (Critical Concept!)

KMS can directly encrypt only **4 KB** of data. For larger data, use **envelope encryption**:

```
ENCRYPTION:
  1. Call KMS: GenerateDataKey(CMK-ID)
  2. KMS returns:
     - Plaintext Data Key (DEK)
     - Encrypted Data Key (encrypted with CMK)
  3. Use Plaintext DEK to encrypt your data locally
  4. Store: Encrypted Data + Encrypted DEK
  5. Delete Plaintext DEK from memory!

DECRYPTION:
  1. Call KMS: Decrypt(Encrypted DEK)
  2. KMS returns: Plaintext DEK
  3. Use Plaintext DEK to decrypt your data locally
```

```java
KmsClient kms = KmsClient.create();

// Generate data key
GenerateDataKeyResponse keyResponse = kms.generateDataKey(
    GenerateDataKeyRequest.builder()
        .keyId("arn:aws:kms:us-east-1:123:key/my-key-id")
        .keySpec(DataKeySpec.AES_256)
        .build());

byte[] plaintextKey = keyResponse.plaintext().asByteArray();   // Use to encrypt data
byte[] encryptedKey = keyResponse.ciphertextBlob().asByteArray(); // Store with ciphertext

// Encrypt data locally with plaintextKey using AES-256
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(plaintextKey, "AES"));
byte[] encryptedData = cipher.doFinal(plainData);

// IMPORTANT: Clear plaintext key from memory
Arrays.fill(plaintextKey, (byte) 0);

// Later: Decrypt the data key
DecryptResponse decryptResponse = kms.decrypt(
    DecryptRequest.builder()
        .ciphertextBlob(SdkBytes.fromByteArray(encryptedKey))
        .build());
byte[] decryptedKey = decryptResponse.plaintext().asByteArray();
```

### GenerateDataKey vs GenerateDataKeyWithoutPlaintext

| API | Returns | Use Case |
|---|---|---|
| `GenerateDataKey` | Plaintext DEK + Encrypted DEK | Immediate encryption |
| `GenerateDataKeyWithoutPlaintext` | Only Encrypted DEK | Pre-generate keys for later use |

---

## KMS API Operations

| API | Description | Max Data |
|---|---|---|
| `Encrypt` | Encrypt data directly | 4 KB |
| `Decrypt` | Decrypt ciphertext | N/A |
| `GenerateDataKey` | Get plaintext + encrypted DEK | N/A |
| `GenerateDataKeyWithoutPlaintext` | Get only encrypted DEK | N/A |
| `ReEncrypt` | Re-encrypt under different key (plaintext never leaves KMS) | 4 KB |
| `CreateKey` | Create a new CMK | N/A |
| `DescribeKey` | Get key metadata | N/A |
| `EnableKeyRotation` | Enable automatic annual rotation | N/A |

---

## Key Policies

Every CMK has a **key policy** (resource-based). Without a key policy granting access, even IAM admin policies won't work:

### Default Key Policy

```json
{
  "Sid": "Enable IAM policies",
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::123456789012:root" },
  "Action": "kms:*",
  "Resource": "*"
}
```

This default policy allows IAM policies to grant KMS access. Without it, NO ONE can use the key.

### Custom Key Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Allow Lambda to decrypt",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::123456789012:role/LambdaRole" },
      "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
      "Resource": "*"
    },
    {
      "Sid": "Allow key admin",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::123456789012:user/KeyAdmin" },
      "Action": ["kms:Create*", "kms:Describe*", "kms:Enable*", "kms:List*",
                  "kms:Put*", "kms:Update*", "kms:Revoke*", "kms:Disable*",
                  "kms:Get*", "kms:Delete*", "kms:ScheduleKeyDeletion"],
      "Resource": "*"
    }
  ]
}
```

### KMS Grants

Grants provide **temporary, programmatic** access to a KMS key:

```java
kms.createGrant(CreateGrantRequest.builder()
    .keyId("arn:aws:kms:us-east-1:123:key/my-key")
    .granteePrincipal("arn:aws:iam::123456789012:role/TempRole")
    .operations(GrantOperation.ENCRYPT, GrantOperation.DECRYPT)
    .build());
```

Use grants when you need to delegate KMS access dynamically (e.g., during EBS volume attachment).

---

## Key Rotation

| Rotation Type | CMK | AWS Managed |
|---|---|---|
| **Automatic** | Annual (opt-in) | Annual (always on) |
| **Manual** | Create new key, update alias | N/A |
| **Backing key** | Old versions kept for decryption | Same |

```bash
# Enable automatic rotation
aws kms enable-key-rotation --key-id my-key-id

# Check rotation status
aws kms get-key-rotation-status --key-id my-key-id
```

:::tip[How Rotation Works]
KMS keeps ALL previous key versions (backing keys). Old ciphertext can still be decrypted. Only new encryptions use the new key version. You don't need to re-encrypt existing data.
:::

---

## Multi-Region Keys

```
Primary Key (us-east-1) ←→ Replica Key (eu-west-1)
Same key ID, same key material
Encrypt in us-east-1 → Decrypt in eu-west-1 (no cross-region API call!)
```

**Use cases**: Global DynamoDB tables, cross-region S3 replication, disaster recovery

---

## KMS with AWS Services

| Service | Encryption | Key Type |
|---|---|---|
| **S3** | SSE-KMS | AWS Managed or CMK |
| **EBS** | Volume encryption | AWS Managed or CMK |
| **RDS** | At-rest encryption | AWS Managed or CMK |
| **DynamoDB** | At-rest encryption | AWS Owned, AWS Managed, or CMK |
| **Lambda** | Env variable encryption | AWS Managed or CMK |
| **Secrets Manager** | Secret encryption | AWS Managed or CMK |

---

## KMS API Throttling

| Limit | Value |
|---|---|
| **Encrypt/Decrypt** | 5,500–30,000 RPS (region-dependent) |
| **GenerateDataKey** | Same as above |
| **Shared quota** | All cryptographic operations share the quota |

:::caution[Throttling at Scale]
If Lambda invoked 10,000 times/sec, each calling `kms:Decrypt`:
- **Problem**: Hits KMS throttling → `ThrottlingException`
- **Fix 1**: Use **Data Key Caching** (AWS Encryption SDK) — cache plaintext DEK in memory
- **Fix 2**: Use **S3 Bucket Keys** (reduces per-object KMS calls by 99%)
- **Fix 3**: Request KMS quota increase
:::

---

## 🏆 Best Practices

1. **Use CMKs** for sensitive data (full control, audit trail)
2. **Enable automatic rotation** for all CMKs
3. **Separate key admin from key usage** in key policies
4. **Use grants** for temporary access (revoke when done)
5. **Cache data keys** to reduce KMS API calls
6. **Use S3 Bucket Keys** with SSE-KMS to avoid throttling
7. **Never expose plaintext DEK** — delete from memory after use

---

## 🎯 DVA-C02 Exam Tips

:::tip[KMS Exam Cheat Sheet]
1. **Envelope encryption** = for data >4KB. GenerateDataKey → encrypt locally
2. **ReEncrypt** = re-encrypt without exposing plaintext (server-side only)
3. **Key policy required** — IAM policies alone can't grant KMS access without it
4. **Automatic rotation** keeps old backing keys (no re-encryption needed)
5. **Multi-region keys** = same key material in multiple regions
6. **ThrottlingException** → cache data keys or use S3 Bucket Keys
7. **BYOK** (imported keys) cannot be auto-rotated
8. **KMS + CloudTrail** = every Encrypt/Decrypt call is logged
9. **SSE-KMS** adds audit trail but costs per-API call
10. **Grants** = temporary programmatic KMS access
:::

---

## 🧪 Practice Questions

**Q1.** Lambda needs to encrypt a 50MB file. Which approach?

A) Call `kms:Encrypt` with 50MB  
B) **Envelope encryption — GenerateDataKey + encrypt locally**  
C) SSE-S3  
D) GenerateDataKey 50 times  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — KMS encrypts max 4KB directly. Use envelope encryption: generate a data key, encrypt data locally, store encrypted DEK alongside ciphertext.
</details>

---

**Q2.** Re-encrypt S3 objects from Key A to Key B without exposing plaintext. Which API?

A) Decrypt → Encrypt  
B) **ReEncrypt**  
C) GenerateDataKey  
D) RotateKey  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — `ReEncrypt` performs server-side re-encryption entirely within KMS. Plaintext never leaves KMS.
</details>

---

**Q3.** High-throughput Lambda with SSE-KMS gets `ThrottlingException`. Best fix?

A) Switch to SSE-S3  
B) **Enable S3 Bucket Keys**  
C) Increase Lambda memory  
D) Use larger KMS key  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — S3 Bucket Keys generate a bucket-level key that derives per-object keys, reducing KMS API calls by ~99%.
</details>

---

**Q4.** A CMK has automatic rotation enabled. What happens to data encrypted with the old key version?

A) Data must be re-encrypted manually  
B) **Old key version is kept — data decrypts normally**  
C) Data becomes inaccessible  
D) KMS auto re-encrypts all data  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — KMS keeps all previous backing key versions. Old ciphertext references the old key version and decrypts normally. Only new encryptions use the new version.
</details>

---

## 🔗 Resources

- [KMS Developer Guide](https://docs.aws.amazon.com/kms/latest/developerguide/)
- [AWS Encryption SDK for Java](https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/java.html)
- [KMS Key Policies](https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html)
- [Envelope Encryption](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping)
- [Multi-Region Keys](https://docs.aws.amazon.com/kms/latest/developerguide/multi-region-keys-overview.html)
