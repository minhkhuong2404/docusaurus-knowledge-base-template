---
id: cryptography-secure-design
title: Cryptography & Secure Design
sidebar_label: Cryptography
description: Practical cryptography for Java engineers — AES-GCM, RSA, HMAC, digital signatures, key management, secure random, constant-time comparisons. Pairs with the Keys, Signing & TLS doc.
tags: [cryptography, encryption, hashing, aes, rsa, hmac, digital-signature, key-management, java, spring]
---

# Cryptography & Secure Design

> You don't need to implement cryptographic algorithms — you need to **choose** and **use** them correctly. Most vulnerabilities come from misuse, not math.

:::tip Related
See [Keys, Signing & TLS](./keys-signing-tls) for deep dives into public/private keys, JWKS, MLE, and TLS internals.
:::

---

## Core Concepts at a Glance

| Concept | Purpose | Algorithm |
|---|---|---|
| Symmetric Encryption | Encrypt/decrypt with same key | AES-256-GCM |
| Asymmetric Encryption | Encrypt with public, decrypt with private | RSA-OAEP |
| Hashing | One-way fingerprint | SHA-256, SHA-3 |
| Password Hashing | Slow hash with salt | Argon2id, BCrypt |
| MAC | Prove message integrity + authenticity | HMAC-SHA256 |
| Digital Signature | Authenticity + non-repudiation | RSA-PSS, ECDSA |
| Key Exchange | Establish shared secret over public channel | ECDH |
| Authenticated Encryption | Confidentiality + integrity in one | AES-256-GCM |

---

## AES-GCM — Symmetric Encryption

AES-256-GCM provides **confidentiality** (encryption) AND **integrity** (authentication tag). Always prefer over AES-CBC.

```java
@Service
public class AesEncryptionService {
    private static final int KEY_SIZE  = 256;
    private static final int IV_SIZE   = 12;   // 96-bit IV for GCM
    private static final int TAG_LEN   = 128;  // Auth tag length

    private final SecretKey secretKey;

    public AesEncryptionService(@Value("${encryption.key}") String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String plaintext) throws Exception {
        // ⚠️ Generate FRESH random IV for EVERY encryption — never reuse!
        byte[] iv = new byte[IV_SIZE];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LEN, iv));
        byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

        // Prepend IV to ciphertext (IV is NOT secret, just must be unique per key)
        byte[] combined = new byte[IV_SIZE + encrypted.length];
        System.arraycopy(iv, 0, combined, 0, IV_SIZE);
        System.arraycopy(encrypted, 0, combined, IV_SIZE, encrypted.length);
        return Base64.getEncoder().encodeToString(combined);
    }

    public String decrypt(String ciphertext) throws Exception {
        byte[] combined = Base64.getDecoder().decode(ciphertext);
        byte[] iv        = Arrays.copyOfRange(combined, 0, IV_SIZE);
        byte[] encrypted = Arrays.copyOfRange(combined, IV_SIZE, combined.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LEN, iv));
        try {
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (AEADBadTagException e) {
            throw new TamperingDetectedException("Ciphertext was tampered with");
        }
    }

    public static String generateKey() throws Exception {
        KeyGenerator kg = KeyGenerator.getInstance("AES");
        kg.init(KEY_SIZE, new SecureRandom());
        return Base64.getEncoder().encodeToString(kg.generateKey().getEncoded());
    }
}
```

### Common AES Pitfalls

| Mistake | Consequence | Fix |
|---|---|---|
| Reusing IV with same key | Complete plaintext recovery | Always generate random IV per encryption |
| AES-CBC without MAC | Padding oracle attacks | Use AES-GCM (includes auth tag) |
| Hardcoded key | Key in repo/binary | Load from Vault / Secrets Manager |
| ECB mode | Patterns visible in ciphertext | Never use ECB |

---

## HMAC — Message Authentication Code

Proves **integrity + authenticity** of a message (requires a shared secret key).

```java
public String generateHmac(String message, String secretKey) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    SecretKeySpec keySpec = new SecretKeySpec(
        secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    mac.init(keySpec);
    return Base64.getEncoder().encodeToString(
        mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
}

// Webhook signature verification (e.g., GitHub, Stripe)
@PostMapping("/webhooks/payment")
public ResponseEntity<Void> receiveWebhook(
        @RequestHeader("X-Signature-256") String signature,
        @RequestBody String payload) {

    String expected = "sha256=" + generateHmac(payload, webhookSecret);

    // CRITICAL: constant-time comparison — prevents timing attacks
    if (!MessageDigest.isEqual(expected.getBytes(), signature.getBytes())) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    processWebhook(payload);
    return ResponseEntity.ok().build();
}
```

### HMAC vs Digital Signature

| | HMAC | Digital Signature |
|---|---|---|
| Key | Symmetric (shared secret) | Asymmetric (private/public pair) |
| Non-repudiation | ❌ Either party could generate | ✅ Only private key holder can sign |
| Performance | Fast | Slower |
| Use | Webhooks, internal services | JWTs, public APIs, code signing |

---

## Hashing

```java
// File integrity, fingerprinting (fast hash)
MessageDigest md = MessageDigest.getInstance("SHA-256");
byte[] hash = md.digest(fileBytes);
String hexHash = HexFormat.of().formatHex(hash);

// Use SHA-3 for new designs (SHA-256 still fine for non-password uses)
```

| Use Case | Algorithm | Notes |
|---|---|---|
| File integrity | SHA-256 | Fast, standard |
| Password storage | Argon2id / BCrypt | **Must** be slow + salted |
| HMAC / message auth | HMAC-SHA256 | Needs secret key |
| Digital certificates | SHA-256 | SHA-1 is broken for certs |

---

## Key Management

### Key Hierarchy

```
Master Key (HSM — Hardware Security Module)
    ↓ encrypts
Key Encryption Key (KEK) — stored in Vault
    ↓ encrypts
Data Encryption Key (DEK) — rotates frequently
    ↓ encrypts
Your Data
```

### Key Rotation with Version Tracking

```java
@Entity
public class EncryptedRecord {
    String encryptedData;
    int keyVersion; // Track which DEK version encrypted this record
}

@Transactional
public void rotateKeys(int oldVersion, int newVersion) {
    List<EncryptedRecord> records = repo.findByKeyVersion(oldVersion);
    for (EncryptedRecord record : records) {
        String plaintext = decrypt(record.getEncryptedData(), oldVersion);
        record.setEncryptedData(encrypt(plaintext, newVersion));
        record.setKeyVersion(newVersion);
        repo.save(record);
    }
}
```

---

## Secure Random Numbers

```java
// ✅ Always use SecureRandom for security-sensitive values
SecureRandom rng = new SecureRandom();

// Session tokens
byte[] token = new byte[32];
rng.nextBytes(token);
String sessionId = Base64.getUrlEncoder().withoutPadding().encodeToString(token);

// 6-digit OTP
int otp = rng.nextInt(1_000_000);

// ❌ NEVER use Math.random() or java.util.Random for security — predictable seed
```

---

## Constant-Time Comparisons

```java
// ❌ Vulnerable — early return leaks timing information
boolean bad = userToken.equals(storedToken);

// ✅ Constant-time — always takes the same time regardless of mismatch position
boolean safe = MessageDigest.isEqual(
    userToken.getBytes(StandardCharsets.UTF_8),
    storedToken.getBytes(StandardCharsets.UTF_8)
);
// Spring Security's PasswordEncoder.matches() is already constant-time
```

---

## Secure Design Principles

| Principle | Meaning |
|---|---|
| **Defense in Depth** | Multiple independent security controls |
| **Least Privilege** | Minimal permissions needed to function |
| **Fail Secure** | Default to deny on failure |
| **Don't Roll Your Own Crypto** | Use vetted libraries (BouncyCastle, JDK, Nimbus) |
| **Secure by Default** | Secure configuration out of the box |
| **Complete Mediation** | Check permissions on every access |
| **Open Design** | Security based on keys, not algorithm secrecy |

---

## Interview Questions

1. What is the difference between encryption and hashing? When do you use each?
2. Why is AES-GCM preferred over AES-CBC?
3. What is the difference between a MAC (HMAC) and a digital signature?
4. Why must IVs be unique (even if not secret) in AES-GCM?
5. What is hybrid encryption and why is it used instead of pure RSA?
6. What is a timing attack and how do you prevent it in Java?
7. What is key rotation and how do you implement it without losing access to old data?
8. Why is MD5 broken and what should you use instead for file integrity checks?
9. What is a rainbow table attack and why does salting prevent it?
10. What is the purpose of the GCM authentication tag?
