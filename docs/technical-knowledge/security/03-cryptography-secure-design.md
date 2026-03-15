---
id: cryptography-secure-design
title: Cryptography & Secure Design
sidebar_label: Cryptography
description: Practical cryptography for software engineers — symmetric and asymmetric encryption, hashing, MACs, digital signatures, TLS internals, key management, and secure coding patterns.
tags: [cryptography, encryption, hashing, tls, digital-signature, key-management, aes, rsa, elliptic-curve, secure-design]
---

# Cryptography & Secure Design

> You don't need to implement cryptographic algorithms — you need to **choose** and **use** them correctly. Most vulnerabilities come from misuse, not math.

---

## Core Concepts

| Concept | Purpose | Example Algorithm |
|---|---|---|
| **Symmetric Encryption** | Encrypt/decrypt with same key | AES-256-GCM |
| **Asymmetric Encryption** | Encrypt with public, decrypt with private | RSA-OAEP |
| **Hashing** | One-way fingerprint | SHA-256, SHA-3 |
| **Password Hashing** | Slow hash with salt | Argon2id, BCrypt |
| **MAC** | Authenticate message integrity | HMAC-SHA256 |
| **Digital Signature** | Authenticate + non-repudiation | RSA-PSS, ECDSA |
| **Key Exchange** | Establish shared secret over public channel | ECDH, DH |
| **TLS/HTTPS** | Combine all above for secure transport | TLS 1.3 |

---

## Symmetric Encryption

Same key encrypts and decrypts. Fast. Good for large data.

### AES-GCM (Recommended)

AES-256-GCM provides both **confidentiality** (encryption) and **integrity** (authentication tag). Prefer over AES-CBC.

```java
@Service
public class AesEncryptionService {
    private static final int KEY_SIZE = 256;
    private static final int IV_SIZE = 12;  // 96-bit IV for GCM
    private static final int TAG_LENGTH = 128; // GCM auth tag

    private final SecretKey secretKey;

    public AesEncryptionService(@Value("${encryption.key}") String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String plaintext) {
        byte[] iv = new byte[IV_SIZE];
        new SecureRandom().nextBytes(iv);  // Random IV every time!

        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey,
                new GCMParameterSpec(TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Prepend IV to ciphertext (IV is not secret, just must be unique)
            byte[] combined = new byte[IV_SIZE + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, IV_SIZE);
            System.arraycopy(encrypted, 0, combined, IV_SIZE, encrypted.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new EncryptionException("Encryption failed", e);
        }
    }

    public String decrypt(String ciphertext) {
        byte[] combined = Base64.getDecoder().decode(ciphertext);
        byte[] iv = Arrays.copyOfRange(combined, 0, IV_SIZE);
        byte[] encrypted = Arrays.copyOfRange(combined, IV_SIZE, combined.length);

        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (AEADBadTagException e) {
            throw new TamperingDetectedException("Ciphertext was tampered with");
        }
    }

    // Key generation (run once, store securely)
    public static String generateKey() {
        KeyGenerator kg = KeyGenerator.getInstance("AES");
        kg.init(KEY_SIZE, new SecureRandom());
        return Base64.getEncoder().encodeToString(kg.generateKey().getEncoded());
    }
}
```

### Common AES Pitfalls
| Mistake | Consequence | Fix |
|---|---|---|
| Reusing IV with same key | Complete plaintext recovery possible | Always generate random IV per encryption |
| AES-CBC without MAC | Padding oracle attacks | Use AES-GCM (includes auth tag) |
| Hardcoded key in code | Key exposed in repo/binary | Load from secrets manager |
| ECB mode (AES/ECB) | Patterns visible in ciphertext | Never use ECB — use GCM or CBC+HMAC |

---

## Asymmetric Encryption

Two keys: public (encrypt/verify) + private (decrypt/sign). Slower. Used for key exchange and signatures.

### RSA Key Generation & Usage
```java
// Key generation (done once, store private key securely)
KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
kpg.initialize(4096); // 2048 minimum, 4096 for long-lived keys
KeyPair keyPair = kpg.generateKeyPair();

// Encryption with RSA-OAEP (preferred over PKCS1 padding)
public byte[] encryptRsa(byte[] plaintext, PublicKey publicKey) {
    Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    cipher.init(Cipher.ENCRYPT_MODE, publicKey);
    return cipher.doFinal(plaintext);
    // Note: RSA is slow — only encrypt small data (e.g., an AES key)
    // For large data: hybrid encryption → encrypt data with AES, encrypt AES key with RSA
}
```

### Hybrid Encryption Pattern
```java
// Encrypt large payload: AES for data, RSA for AES key
public EncryptedPayload hybridEncrypt(byte[] data, PublicKey recipientKey) {
    // 1. Generate random AES key
    KeyGenerator kg = KeyGenerator.getInstance("AES");
    kg.init(256); SecretKey aesKey = kg.generateKey();

    // 2. Encrypt data with AES-GCM
    byte[] encryptedData = aesEncrypt(data, aesKey);

    // 3. Encrypt AES key with recipient's RSA public key
    byte[] encryptedKey = encryptRsa(aesKey.getEncoded(), recipientKey);

    return new EncryptedPayload(encryptedKey, encryptedData);
}
```

---

## Hashing

One-way function. Same input always produces same output. Cannot reverse.

```java
// General purpose hashing (file integrity, fingerprinting)
MessageDigest md = MessageDigest.getInstance("SHA-256");
byte[] hash = md.digest(data);
String hexHash = HexFormat.of().formatHex(hash);

// Use SHA-3 for new designs (SHA-256 still fine for most purposes)
MessageDigest md3 = MessageDigest.getInstance("SHA3-256");
```

### Use Cases
| Use Case | Algorithm | Notes |
|---|---|---|
| File integrity check | SHA-256 | Fast, good |
| Password storage | Argon2id / BCrypt | **Must** be slow + salted |
| HMAC / message auth | HMAC-SHA256 | Needs a secret key |
| Non-cryptographic hash | MurmurHash / xxHash | Faster, not for security |
| Digital certificates | SHA-256 | SHA-1 is broken for certs |

---

## HMAC — Message Authentication Code

Proves both integrity and authenticity of a message (requires shared secret key).

```java
// HMAC-SHA256
public String generateHmac(String message, String secretKey) {
    Mac mac = Mac.getInstance("HmacSHA256");
    SecretKeySpec keySpec = new SecretKeySpec(
        secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    mac.init(keySpec);
    return Base64.getEncoder().encodeToString(
        mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
}

// Use case: webhook signature verification
@PostMapping("/webhooks/payment")
public ResponseEntity<Void> receiveWebhook(
        @RequestHeader("X-Signature-256") String signature,
        @RequestBody String payload) {

    String expected = "sha256=" + generateHmac(payload, webhookSecret);

    // CRITICAL: constant-time comparison to prevent timing attacks
    if (!MessageDigest.isEqual(
            expected.getBytes(), signature.getBytes())) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    processWebhook(payload);
    return ResponseEntity.ok().build();
}
```

---

## Digital Signatures

Prove authenticity and non-repudiation. Signer uses **private key**; verifier uses **public key**.

```java
// Sign a document
public byte[] sign(byte[] data, PrivateKey privateKey) {
    Signature signer = Signature.getInstance("SHA256withECDSA"); // ECDSA — faster than RSA
    signer.initSign(privateKey);
    signer.update(data);
    return signer.sign();
}

// Verify signature
public boolean verify(byte[] data, byte[] signature, PublicKey publicKey) {
    Signature verifier = Signature.getInstance("SHA256withECDSA");
    verifier.initVerify(publicKey);
    verifier.update(data);
    return verifier.verify(signature);
}
```

### Signature vs MAC
| | MAC (HMAC) | Digital Signature |
|---|---|---|
| Key | Symmetric (shared) | Asymmetric (private/public) |
| Non-repudiation | ❌ (either party could generate) | ✅ (only private key holder) |
| Performance | Faster | Slower |
| Use | Internal service auth, webhooks | Public documents, JWTs (RS256) |

---

## TLS/HTTPS Internals

### TLS 1.3 Handshake (Simplified)
```
Client                         Server
  │                               │
  ├── ClientHello ──────────────→ │  (supported ciphers, key share)
  │ ←──────────────── ServerHello ┤  (chosen cipher, key share)
  │ ←──────────────── Certificate ┤  (server's X.509 cert)
  │ ←──────────── {Finished} ────┤  (encrypted, key derived)
  ├── {Finished} ───────────────→ │
  │                               │
  ├══ Encrypted Application Data ══════════════════ ┤
```

### What TLS Provides
| Property | Mechanism |
|---|---|
| **Confidentiality** | AES-256-GCM (session key) |
| **Integrity** | AEAD authentication tag |
| **Server Authentication** | X.509 certificate (signed by CA) |
| **Perfect Forward Secrecy** | ECDHE key exchange (session keys not derived from long-term key) |

### Perfect Forward Secrecy (PFS)
Even if the server's private key is later compromised, past sessions cannot be decrypted.
```
Session key = ECDH(server_ephemeral_private, client_ephemeral_public)
Server throws away ephemeral private key after session
→ No way to derive session key later, even with long-term private key
```

---

## Key Management

### Key Hierarchy
```
Master Key (Hardware Security Module — HSM)
  ↓ wraps
Key Encryption Key (KEK) — stored in Vault
  ↓ wraps
Data Encryption Key (DEK) — used for actual encryption
  ↓ encrypts
Data
```

### Key Rotation
```java
// Envelope encryption with versioned keys
@Entity
public class EncryptedRecord {
    @Column(name = "data")
    String encryptedData;

    @Column(name = "key_version")
    int keyVersion; // Track which key was used
}

// Rotate: re-encrypt with new key
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

// OTP
int otp = rng.nextInt(1_000_000); // 6-digit OTP

// ❌ Never use Math.random() or java.util.Random for security
// Random random = new Random(); // Predictable seed!
```

---

## Constant-Time Comparisons

Prevent timing attacks on secret comparisons.

```java
// ❌ Vulnerable — returns early on first mismatch (timing leak)
boolean vulnerable = userToken.equals(storedToken);

// ✅ Constant-time — always takes same time regardless of where mismatch is
boolean safe = MessageDigest.isEqual(
    userToken.getBytes(StandardCharsets.UTF_8),
    storedToken.getBytes(StandardCharsets.UTF_8)
);

// Spring Security already uses constant-time in PasswordEncoder.matches()
```

---

## Certificate Pinning (Mobile)

Verify server certificate beyond CA trust chain.

```java
// OkHttp certificate pinning (Android/mobile)
OkHttpClient client = new OkHttpClient.Builder()
    .certificatePinner(new CertificatePinner.Builder()
        .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
        .build())
    .build();
```

---

## Secure Design Principles

| Principle | Meaning |
|---|---|
| **Defense in Depth** | Multiple independent security controls |
| **Least Privilege** | Minimal permissions needed to function |
| **Fail Secure** | Default to deny on failure |
| **Separation of Concerns** | Auth logic separate from business logic |
| **Don't Roll Your Own Crypto** | Use vetted libraries (BouncyCastle, JDK) |
| **Secure by Default** | Secure configuration out of the box |
| **Complete Mediation** | Check permissions on every access |
| **Open Design** | Security based on keys, not algorithm secrecy |

---

## Interview Questions

1. What is the difference between encryption and hashing? When do you use each?
2. Why is AES-GCM preferred over AES-CBC?
3. What is the difference between a MAC (HMAC) and a digital signature?
4. What is Perfect Forward Secrecy and why does it matter?
5. What does TLS protect against? What does it NOT protect?
6. Why must IVs be unique (even if not secret) in AES-GCM?
7. What is hybrid encryption and why is it used instead of pure RSA?
8. What is a timing attack and how do you prevent it in Java?
9. What is key rotation and how do you implement it without losing access to old data?
10. Why is MD5 broken and what should you use instead for file integrity checks?
11. What is the difference between RSA-PKCS1 and RSA-OAEP padding?
12. What is a rainbow table attack and why does salting prevent it?
