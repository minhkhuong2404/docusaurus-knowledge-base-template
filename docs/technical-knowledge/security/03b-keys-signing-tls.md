---
id: keys-signing-tls
title: Keys, Signing, JWKS & TLS
sidebar_label: Keys, Signing & TLS
description: Deep dive into public/private key cryptography, how signing payloads works, JWKS (JSON Web Key Sets), Message Level Encryption (MLE), and TLS internals — written for Java/Spring engineers.
tags: [security, cryptography, public-key, private-key, jwks, mle, tls, signing, jwt, rsa, ecdsa, tls-handshake]
---

# Keys, Signing, JWKS & TLS

> These concepts are the foundation of modern secure communications. Understanding them deeply separates engineers who "just use HTTPS" from engineers who can design secure systems.

---

## Public Key vs Private Key — The Core Idea

Asymmetric cryptography uses a **mathematically linked key pair**:

```
Private Key  →  kept SECRET by the owner (never shared, never transmitted)
Public Key   →  shared FREELY with anyone
```

The magic is that operations done with one key can only be undone with the other:

```
┌─────────────────────────────────────────────────────────────────┐
│                   Two Use Cases                                  │
├───────────────────────┬─────────────────────────────────────────┤
│  ENCRYPTION           │  SIGNING                                 │
│                       │                                          │
│  Encrypt:  PUBLIC key │  Sign:   PRIVATE key                    │
│  Decrypt: PRIVATE key │  Verify:  PUBLIC key                    │
│                       │                                          │
│  "Lock the box so     │  "Prove you wrote this —                │
│   only Alice can       │   anyone can verify"                    │
│   open it"             │                                          │
│                       │                                          │
│  Use: confidential    │  Use: JWT tokens, webhooks,              │
│  messages, MLE        │  document signing, code signing          │
└───────────────────────┴─────────────────────────────────────────┘
```

### Analogy

Think of a **padlock and key**:
- **Public key** = the open padlock you hand out to everyone
- **Private key** = the only key that opens the padlock

Anyone can lock (encrypt) a message using your padlock. Only you can unlock (decrypt) it.

For signing, invert the analogy: you seal a document with your private seal (private key), and anyone with a copy of your seal-stamp (public key) can verify the seal is genuine.

---

## Digital Signing — How It Works Step by Step

Signing proves **who created** a message and that it **hasn't been tampered with**.

```
SIGNING (done by the issuer — has private key):

  Original Payload → [Hash Function SHA-256] → Digest (32 bytes)
                                                    ↓
                                       [Encrypt with PRIVATE key]
                                                    ↓
                                              Signature

  Send: Payload + Signature together


VERIFICATION (done by recipient — has public key):

  Received Payload → [Hash Function SHA-256] → Digest A
  Received Signature → [Decrypt with PUBLIC key] → Digest B

  If Digest A == Digest B → ✅ Signature valid: payload not tampered, signer verified
  If Digest A != Digest B → ❌ Reject: payload was modified or wrong signer
```

### Why Sign the Hash, Not the Payload?

1. **Performance** — RSA/ECDSA is slow on large data. Hash is always 32 bytes regardless of payload size.
2. **Security property** — SHA-256 is a one-way function. You can't reconstruct the payload from the hash.

### Java Implementation

```java
// ─── Signing ───────────────────────────────────────────────────
public byte[] signPayload(byte[] payload, PrivateKey privateKey) throws Exception {
    Signature signer = Signature.getInstance("SHA256withRSA"); // or SHA256withECDSA
    signer.initSign(privateKey);
    signer.update(payload);
    return signer.sign(); // Returns the signature bytes
}

// ─── Verification ───────────────────────────────────────────────
public boolean verifySignature(byte[] payload, byte[] signature, PublicKey publicKey)
        throws Exception {
    Signature verifier = Signature.getInstance("SHA256withRSA");
    verifier.initVerify(publicKey);
    verifier.update(payload);
    return verifier.verify(signature); // true = valid signature
}

// ─── Key generation (run once, store private key in Vault) ──────
KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
kpg.initialize(4096, new SecureRandom());
KeyPair keyPair = kpg.generateKeyPair();

// Export for storage
String privateKeyPem = "-----BEGIN PRIVATE KEY-----\n"
    + Base64.getMimeEncoder().encodeToString(keyPair.getPrivate().getEncoded())
    + "\n-----END PRIVATE KEY-----";

String publicKeyPem = "-----BEGIN PUBLIC KEY-----\n"
    + Base64.getMimeEncoder().encodeToString(keyPair.getPublic().getEncoded())
    + "\n-----END PUBLIC KEY-----";
```

---

## JWT Signing — End to End

A JWT is a signed payload. The signature is computed over `Base64Url(header) + "." + Base64Url(payload)`.

```
JWT = Base64Url(header) + "." + Base64Url(payload) + "." + Base64Url(signature)
```

```java
// ─── Issuing a signed JWT (Auth Server) ─────────────────────────
@Service
public class JwtIssuerService {

    private final RSAPrivateKey privateKey;

    public String issueToken(String userId, List<String> roles) {
        return JWT.create()
            .withIssuer("https://auth.example.com")
            .withSubject(userId)
            .withAudience("https://api.example.com")
            .withIssuedAt(new Date())
            .withExpiresAt(Date.from(Instant.now().plus(15, MINUTES)))
            .withJWTId(UUID.randomUUID().toString())  // jti — for revocation
            .withClaim("roles", roles)
            .withKeyId("key-2024-01")  // kid — tells verifier which key to use
            .sign(Algorithm.RSA256(null, privateKey));
    }
}

// ─── Verifying a JWT (Resource Server / Spring Boot) ────────────
// Spring's JwtDecoder handles this automatically via JWKS
@Bean
public JwtDecoder jwtDecoder() {
    return JwtDecoders.fromIssuerLocation("https://auth.example.com");
    // Internally: fetches https://auth.example.com/.well-known/openid-configuration
    // → fetches jwks_uri → caches public keys → verifies signature on each request
}
```

---

## JWKS — JSON Web Key Sets

JWKS is the standard way for an authorization server to **publish its public keys** so resource servers can verify JWTs **without sharing a secret**.

### The Problem JWKS Solves

```
WITHOUT JWKS:
  Auth Server shares RSA private key secret → resource servers verify JWTs
  Problem: Any service with the secret can FORGE JWTs!

WITH JWKS (RS256):
  Auth Server keeps private key SECRET
  Auth Server publishes PUBLIC keys at: /.well-known/jwks.json
  Resource servers download public keys, verify signatures
  Result: Anyone can verify, but ONLY auth server can sign
```

### JWKS Endpoint Format

```json
// GET https://auth.example.com/.well-known/jwks.json
{
  "keys": [
    {
      "kty": "RSA",           // Key type
      "use": "sig",           // Usage: sig (signing) or enc (encryption)
      "alg": "RS256",         // Algorithm
      "kid": "key-2024-01",   // Key ID — matches JWT header "kid"
      "n": "sIwr7...",        // RSA modulus (Base64Url)
      "e": "AQAB"             // RSA exponent (Base64Url)
    },
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "key-2024-02",   // New key (rotation in progress)
      "n": "tLxa9...",
      "e": "AQAB"
    }
  ]
}
```

### How JWT Verification Works with JWKS

```
1. Resource server receives JWT with header: { "alg": "RS256", "kid": "key-2024-01" }

2. Resource server fetches JWKS (cached, refreshed periodically):
   GET https://auth.example.com/.well-known/jwks.json

3. Find key where jwks.kid == jwt.header.kid  →  "key-2024-01"

4. Reconstruct RSA PublicKey from (n, e) values

5. Verify JWT signature using the public key → ✅ or ❌
```

### Implementing a JWKS Endpoint in Spring Boot (Auth Server)

```java
@RestController
public class JwksController {

    private final KeyStore keyStore;

    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> jwks() {
        List<Map<String, Object>> keys = new ArrayList<>();

        // Publish all ACTIVE public keys (include both old and new during rotation)
        for (KeyPair keyPair : keyStore.getActiveKeyPairs()) {
            RSAPublicKey rsaPublic = (RSAPublicKey) keyPair.getPublic();
            keys.add(Map.of(
                "kty", "RSA",
                "use", "sig",
                "alg", "RS256",
                "kid", keyStore.getKeyId(keyPair),
                "n", Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(rsaPublic.getModulus().toByteArray()),
                "e", Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(rsaPublic.getPublicExponent().toByteArray())
            ));
        }

        return Map.of("keys", keys);
    }
}
```

### Key Rotation with JWKS — Zero Downtime Strategy

```
BEFORE ROTATION:
  JWKS: [key-2024-01 (active)]
  JWTs issued with: kid=key-2024-01

STEP 1 — Add new key to JWKS (both keys published):
  JWKS: [key-2024-01 (retiring), key-2024-02 (new)]
  Resource servers now accept tokens from EITHER key

STEP 2 — Switch signing to new key:
  New JWTs issued with: kid=key-2024-02
  Old tokens (kid=key-2024-01) still valid until expiry

STEP 3 — After all old tokens expire, remove old key:
  JWKS: [key-2024-02 (active)]

Result: Zero downtime, no coordinated deployment across services
```

```java
@Service
public class KeyRotationService {

    @Scheduled(cron = "0 0 2 1 * ?") // 1st of month at 2 AM
    public void rotateSigningKey() {
        KeyPair newKeyPair = generateRsaKeyPair(4096);
        String newKeyId = "key-" + YearMonth.now().toString();

        // 1. Add to JWKS (resource servers will pick it up on next cache refresh)
        keyStore.addKey(newKeyId, newKeyPair);

        // 2. Wait for JWKS cache TTL to expire (e.g., 5 minutes)
        // In practice: use a feature flag or delayed switch

        // 3. Switch new token signing to new key
        keyStore.setActiveSigningKey(newKeyId);

        // 4. Schedule removal of old key after max token TTL
        scheduler.schedule(() -> keyStore.removeKey(previousKeyId),
            Duration.ofMinutes(15 + 5)); // access token TTL + buffer
    }
}
```

### Spring Boot — Configure Resource Server with JWKS

```yaml
# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # Spring fetches + caches JWKS automatically
          jwk-set-uri: https://auth.example.com/.well-known/jwks.json
          # OR use issuer-uri and Spring finds JWKS via OpenID discovery
          issuer-uri: https://auth.example.com
```

```java
@Bean
public JwtDecoder jwtDecoder(@Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwksUri) {
    NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwksUri)
        .cache(Duration.ofMinutes(5))   // Cache JWKS for 5 minutes
        .build();

    // Add custom validators
    OAuth2TokenValidator<Jwt> validators = new DelegatingOAuth2TokenValidator<>(
        new JwtTimestampValidator(Duration.ofSeconds(30)), // 30s clock skew tolerance
        new JwtIssuerValidator("https://auth.example.com"),
        new JwtAudienceValidator("https://api.example.com")
    );

    decoder.setJwtValidator(validators);
    return decoder;
}
```

---

## JWS and JWE — JSON Web Signatures & Encryption

When working with JSON-formatted tokens (specifically **JSON Web Tokens / JWTs**), raw encryption or signing operations are structured into formalized envelopes standardized by the **JOSE (JSON Object Signing and Encryption)** Working Group. These standards ensure interoperability across different systems and programming languages.

- **JWS (JSON Web Signature - RFC 7515):** Focuses on **Authenticity and Integrity**.
- **JWE (JSON Web Encryption - RFC 7516):** Focuses on **Confidentiality**.

### 1. JSON Web Signature (JWS)

A JWS protects the payload against tampering and guarantees its source. The data inside a standard JWS is **base64url-encoded but readable (not encrypted)**. Anyone who intercepts the token can read the claims.

#### Structure of JWS (3 Parts)
$$JWS = \text{base64url}(Header) \ . \ \text{base64url}(Payload) \ . \ \text{base64url}(Signature)$$

* **Header:** Specifies the metadata, including the signing algorithm (e.g., `HS256` for HMAC, `RS256` for RSA signatures, `ES256` for ECDSA).
* **Payload:** The actual JSON claim set (e.g., user profile, roles, scopes).
* **Signature:** Generated by hash-signing the header and payload together with the secret or private key.

#### Nimbus JOSE Implementation: RSA-256 JWS Signing & Verification

```java
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

public class JwsService {

    // 1. Sign a payload using a Private RSA Key
    public String signPayload(String payloadContent, RSAPrivateKey privateKey) throws Exception {
        JWSSigner signer = new RSASSASigner(privateKey);
        
        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                .type(JOSEObjectType.JWT)
                .build();
                
        JWSObject jwsObject = new JWSObject(header, new Payload(payloadContent));
        jwsObject.sign(signer);
        
        return jwsObject.serialize(); // Output: Header.Payload.Signature
    }

    // 2. Verify and extract payload using a Public RSA Key
    public String verifyAndExtract(String serializedJws, RSAPublicKey publicKey) throws Exception {
        JWSObject jwsObject = JWSObject.parse(serializedJws);
        JWSVerifier verifier = new RSASSAVerifier(publicKey);
        
        if (!jwsObject.verify(verifier)) {
            throw new JWSVerificationException("JWS signature verification failed! Data tampered.");
        }
        
        return jwsObject.getPayload().toString();
    }
}
```

---

### 2. JSON Web Encryption (JWE)

A JWE encrypts the payload, ensuring that its contents are completely opaque to intermediate routers, clients, or interceptors. Only the holder of the corresponding decryption key can read it.

#### Structure of JWE (5 Parts)
$$JWE = \text{base64url}(Header) \ . \ \text{base64url}(EncryptedKey) \ . \ \text{base64url}(IV) \ . \ \text{base64url}(Ciphertext) \ . \ \text{base64url}(AuthTag)$$

1. **Protected Header:** Envelope parameters, defining the key management algorithm (`alg`) and symmetric content encryption algorithm (`enc`).
2. **Encrypted Key:** The symmetric Content Encryption Key (CEK), encrypted using the recipient's public key (RSA-OAEP).
3. **Initialization Vector (IV):** A random value required by the symmetric cipher (e.g., 96-bit for AES-GCM) to ensure uniqueness.
4. **Ciphertext:** The actual encrypted payload.
5. **Authentication Tag:** The integrity verification check tag generated by the AEAD cipher (AES-GCM) to prevent tampering.

#### Nimbus JOSE Implementation: RSA-OAEP + AES-GCM JWE Encryption & Decryption

```java
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

public class JweService {

    // 1. Encrypt payload using recipient's Public RSA Key
    public String encryptPayload(String payloadContent, RSAPublicKey publicKey) throws Exception {
        // alg: RSA-OAEP-256 for key wrapping; enc: AES-256-GCM for content encryption
        JWEHeader header = new JWEHeader.Builder(JWEAlgorithm.RSA_OAEP_256, EncryptionMethod.A256GCM)
                .contentType("JWT") // Indicator if nesting a JWS inside
                .build();
                
        JWEObject jweObject = new JWEObject(header, new Payload(payloadContent));
        jweObject.encrypt(new RSAEncrypter(publicKey));
        
        return jweObject.serialize(); // Output: Header.EncryptedKey.IV.Ciphertext.AuthTag
    }

    // 2. Decrypt payload using recipient's Private RSA Key
    public String decryptPayload(String serializedJwe, RSAPrivateKey privateKey) throws Exception {
        JWEObject jweObject = JWEObject.parse(serializedJwe);
        jweObject.decrypt(new RSADecrypter(privateKey));
        
        return jweObject.getPayload().toString();
    }
}
```

---

### JWS vs. JWE Comparison

| Dimension | JWS (JSON Web Signature) | JWE (JSON Web Encryption) |
| :--- | :--- | :--- |
| **Security Property** | Integrity and Authenticity (Non-repudiation). | Confidentiality and Integrity. |
| **Visibility** | Payload is base64-encoded, completely readable by anyone. | Payload is encrypted, completely opaque. |
| **Number of Parts** | 3 parts (`Header.Payload.Signature`). | 5 parts (`Header.Key.IV.Ciphertext.Tag`). |
| **Key Use** | Sender signs with Private Key (or shared secret); Recipient verifies with Public Key (or shared secret). | Sender encrypts with Recipient's Public Key; Recipient decrypts with Private Key. |
| **Use Cases** | Identity assertion, authorization tokens (standard JWTs), session exchange. | PII protection, passing API access keys in front-channel, sensitive payloads. |

---

### 🛡️ Production Best Practice: Nested JWT (Sign-then-Encrypt)

**The Problem with pure JWE:** Anyone can encrypt a payload with your public key and send you a valid JWE. While a JWE ensures the data wasn't modified in transit, it does **not** prove *who* generated the encrypted payload.

**The Solution:** Use a **Nested JWT**. 
1. The sender first signs the payload to create a **JWS**.
2. The sender then encrypts the signed JWS inside a **JWE** container using the recipient's public key.
3. The recipient decrypts the outer JWE envelope first, then validates the inner JWS signature. This guarantees both **Confidentiality** and **Authenticity**.

```java
// Conceptual flow using Nimbus
String claims = "{\"sub\":\"user123\",\"role\":\"admin\"}";

// Step 1: Sign (JWS)
String jwsToken = jwsService.signPayload(claims, senderPrivateKey);

// Step 2: Encrypt the JWS token itself (JWE)
String nestedJwt = jweService.encryptPayload(jwsToken, recipientPublicKey);
```

---

## Message-Level Encryption (MLE)

TLS protects the **transport layer** — but what happens when TLS is terminated at a proxy, load balancer, or API gateway? The payload travels in plaintext within your internal network.

```
Client → [HTTPS/TLS] → API Gateway (TLS terminated here)
                             ↓ PLAINTEXT inside data center
                        App Server → DB
```

**MLE encrypts the payload itself** — independent of the transport layer.

```
With MLE:
Client → [HTTPS/TLS] → API Gateway (TLS terminated here)
                             ↓ STILL ENCRYPTED (MLE)
                        App Server decrypts payload
```

### When to Use MLE

- **Payment APIs** — card data encrypted with bank's public key, decrypted only in HSM
- **Healthcare** — PHI encrypted end-to-end, only the treating application can decrypt
- **Open Banking** — regulatory requirement in some jurisdictions (e.g., RBI in India)
- **Highly regulated data** — must ensure not even internal proxies can see the data
- **Non-repudiation** — client signs the payload, proving they sent it

### MLE Request Pattern (Client Encrypts with Server's Public Key)

```
CLIENT                                    SERVER
─────                                    ──────
1. Fetch server's public key
   (from JWKS or pre-shared)

2. Generate random AES-256 key
   (Content Encryption Key — CEK)

3. Encrypt payload with CEK (AES-GCM)
   → ciphertext + IV + auth_tag

4. Encrypt CEK with server's RSA
   public key (RSA-OAEP)
   → encrypted_key

5. Package as JWE:
   Base64(header)
   .Base64(encrypted_key)              →  Receive JWE
   .Base64(IV)                            Decrypt encrypted_key with private key
   .Base64(ciphertext)                    Get CEK
   .Base64(auth_tag)                      Decrypt payload with CEK
                                          Verify auth_tag (integrity)
                                          Process plaintext payload ✅
```

### JWE (JSON Web Encryption) — The Standard for MLE

```
JWE Compact Serialization:
BASE64URL(header) . BASE64URL(encrypted_cek) . BASE64URL(iv) . BASE64URL(ciphertext) . BASE64URL(auth_tag)

Header example:
{
  "alg": "RSA-OAEP-256",   // Algorithm for encrypting the CEK
  "enc": "A256GCM",         // Algorithm for encrypting the payload
  "kid": "key-2024-01"      // Which server public key to use
}
```

```java
// ─── Client Side: Encrypt request payload ───────────────────────
@Service
public class MleClientService {

    private final RSAPublicKey serverPublicKey; // fetched from JWKS

    public String encryptPayload(String jsonPayload) throws Exception {
        // 1. Generate fresh CEK
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256, new SecureRandom());
        SecretKey cek = keyGen.generateKey();

        // 2. Encrypt CEK with server's RSA public key (RSA-OAEP)
        Cipher rsaCipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        rsaCipher.init(Cipher.ENCRYPT_MODE, serverPublicKey);
        byte[] encryptedCek = rsaCipher.doFinal(cek.getEncoded());

        // 3. Encrypt payload with CEK (AES-256-GCM)
        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);
        Cipher aesCipher = Cipher.getInstance("AES/GCM/NoPadding");
        aesCipher.init(Cipher.ENCRYPT_MODE, cek, new GCMParameterSpec(128, iv));
        byte[] ciphertext = aesCipher.doFinal(jsonPayload.getBytes(StandardCharsets.UTF_8));

        // 4. Build JWE-like structure
        return buildJwe(encryptedCek, iv, ciphertext);
    }
}

// ─── Server Side: Decrypt request payload ───────────────────────
@Service
public class MleServerService {

    private final RSAPrivateKey serverPrivateKey; // stored in Vault / HSM

    public String decryptPayload(String jweToken) throws Exception {
        JweParts parts = parseJwe(jweToken);

        // 1. Decrypt CEK with server's private key
        Cipher rsaCipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        rsaCipher.init(Cipher.DECRYPT_MODE, serverPrivateKey);
        byte[] cek = rsaCipher.doFinal(parts.encryptedCek());

        // 2. Decrypt payload with CEK
        SecretKey secretKey = new SecretKeySpec(cek, "AES");
        Cipher aesCipher = Cipher.getInstance("AES/GCM/NoPadding");
        aesCipher.init(Cipher.DECRYPT_MODE, secretKey,
            new GCMParameterSpec(128, parts.iv()));
        byte[] plaintext = aesCipher.doFinal(parts.ciphertext());
        // AEADBadTagException thrown if ciphertext was tampered with

        return new String(plaintext, StandardCharsets.UTF_8);
    }
}
```

### Using Nimbus JOSE + JWT Library (Recommended for Production)

```xml
<dependency>
    <groupId>com.nimbusds</groupId>
    <artifactId>nimbus-jose-jwt</artifactId>
    <version>9.37.3</version>
</dependency>
```

```java
// ─── Encrypt (client) ────────────────────────────────────────────
public String encryptWithJwe(Map<String, Object> payload, RSAPublicKey recipientPublicKey)
        throws Exception {
    JWEHeader header = new JWEHeader.Builder(
        JWEAlgorithm.RSA_OAEP_256,  // Key wrapping
        EncryptionMethod.A256GCM    // Content encryption
    ).keyID("key-2024-01").build();

    JWEObject jwe = new JWEObject(header,
        new Payload(new JSONObject(payload).toJSONString()));
    jwe.encrypt(new RSAEncrypter(recipientPublicKey));

    return jwe.serialize(); // 5-part dot-separated string
}

// ─── Decrypt (server) ────────────────────────────────────────────
public Map<String, Object> decryptJwe(String jweString, RSAPrivateKey privateKey)
        throws Exception {
    JWEObject jwe = JWEObject.parse(jweString);
    jwe.decrypt(new RSADecrypter(privateKey));
    return jwe.getPayload().toJSONObject();
}
```

---

## KeyStore vs. TrustStore in Java

In Java and Spring applications, private keys, public certificates, and trusted Certificate Authorities (CAs) are managed using two different storage files: the **KeyStore** and the **TrustStore**. Under the hood, both use the same binary file format (usually PKCS12), but they serve entirely opposite roles in authentication.

```
┌──────────────────────────────────────────────────────────┐
│                   Java Key Managers                      │
├────────────────────────────┬─────────────────────────────┤
│  KEYSTORE                  │  TRUSTSTORE                 │
│                            │                             │
│  "Who you are"             │  "Who you trust"            │
│  (Your Passport / ID)      │  (Your list of trusted CAs) │
│                            │                             │
│  - Stored Private Keys     │  - Stored Public Certs      │
│  - Stored Public Certs     │  - Used to verify others    │
│  - Used to identify self   │                             │
└────────────────────────────┴─────────────────────────────┘
```

### Detailed Comparison

| Attribute | KeyStore | TrustStore |
| :--- | :--- | :--- |
| **Primary Goal** | Prove your identity to others. | Verify the identity of others. |
| **Contains** | Your **Private Keys**, Key Pairs, and matching Public Certificates. | Public Certificates of **Trusted CAs** (e.g., Let's Encrypt, DigiCert) and self-signed certificates. |
| **Symmetric/Asymmetric** | Contains sensitive private key material. | Contains non-sensitive public certificates. |
| **Typical Use Case** | **TLS Server**: Holding the server's private key and certificate to serve HTTPS. <br/> **TLS Client (mTLS)**: Holding the client's private key to authenticate to the server. | **TLS Client**: Verifying that the server's certificate was signed by a trusted CA. <br/> **TLS Server (mTLS)**: Verifying that the client's certificate is trusted. |
| **Default formats** | PKCS12 (recommended, `.p12` or `.pfx`), legacy JKS (`.jks`). | PKCS12 (recommended, `.p12` or `.pfx`), legacy JKS (`.jks`). |
| **JVM Sizing / System Properties** | `-Djavax.net.ssl.keyStore`<br/>`-Djavax.net.ssl.keyStorePassword` | `-Djavax.net.ssl.trustStore`<br/>`-Djavax.net.ssl.trustStorePassword` |

---

### Programmatic Loading in Java

Here is how you load a KeyStore/TrustStore programmatically to build custom SSL context handlers (e.g., for custom web clients like `RestTemplate` or `WebClient`):

```java
import java.io.InputStream;
import java.security.KeyStore;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.SSLContext;

public class SslContextHelper {

    public SSLContext createSslContext(String keyStorePath, String keyStorePassword, 
                                       String trustStorePath, String trustStorePassword) throws Exception {
        
        // 1. Load the KeyStore (Who we are)
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (InputStream keyStoreStream = getClass().getClassLoader().getResourceAsStream(keyStorePath)) {
            keyStore.load(keyStoreStream, keyStorePassword.toCharArray());
        }
        
        KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        kmf.init(keyStore, keyStorePassword.toCharArray());

        // 2. Load the TrustStore (Who we trust)
        KeyStore trustStore = KeyStore.getInstance("PKCS12");
        try (InputStream trustStoreStream = getClass().getClassLoader().getResourceAsStream(trustStorePath)) {
            trustStore.load(trustStoreStream, trustStorePassword.toCharArray());
        }
        
        TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        tmf.init(trustStore);

        // 3. Initialize SSLContext with KeyManagers and TrustManagers
        SSLContext sslContext = SSLContext.getInstance("TLSv1.3");
        sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);
        
        return sslContext;
    }
}
```

---

### CLI Reference: Using JDK `keytool`

The JDK provides the `keytool` utility to manage KeyStores and TrustStores.

#### 1. Generate a self-signed key pair (KeyStore)
Creates a new PKCS12 keystore containing a private key and a self-signed certificate:
```bash
keytool -genkeypair \
  -alias server-alias \
  -keyalg RSA \
  -keysize 4096 \
  -storetype PKCS12 \
  -keystore keystore.p12 \
  -validity 365 \
  -storepass my-keystore-password
```

#### 2. Import a public certificate (TrustStore)
Imports an external certificate authority or partner certificate into your trusted store:
```bash
keytool -importcert \
  -alias trusted-ca-alias \
  -file ca-certificate.crt \
  -keystore truststore.p12 \
  -storepass my-truststore-password
```

#### 3. View contents of a store
List all certificates and private keys inside a store file:
```bash
keytool -list -v \
  -keystore keystore.p12 \
  -storepass my-keystore-password
```

---

### Spring Boot mTLS Configuration (Mutual TLS)

In a mutual TLS configuration, both the client and server must verify each other's identity. Thus, the Spring Boot application configuration requires both a `key-store` (to send its identity) and a `trust-store` (to verify the partner's identity):

```yaml
server:
  port: 8443
  ssl:
    enabled: true
    client-auth: need               # mTLS active: Server REQUIRES client cert
    # Server identity (KeyStore)
    key-store: classpath:server-keystore.p12
    key-store-password: ${SERVER_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: server-cert
    # Who the server trusts (TrustStore)
    trust-store: classpath:server-truststore.p12
    trust-store-password: ${SERVER_TRUSTSTORE_PASSWORD}
    trust-store-type: PKCS12
```

---

## TLS — Transport Layer Security

TLS provides **confidentiality**, **integrity**, and **server authentication** for data in transit.

### TLS 1.3 Handshake — Step by Step

```
CLIENT                                           SERVER
──────                                           ──────
ClientHello
  supported cipher suites: [TLS_AES_256_GCM_SHA384, ...]
  key_share: client's ECDH ephemeral public key
  ───────────────────────────────────────────────────→

                                      ServerHello
                                        chosen cipher: TLS_AES_256_GCM_SHA384
                                        key_share: server's ECDH ephemeral public key
                                      {Certificate}    ← server's X.509 cert (encrypted)
                                      {CertificateVerify}  ← signature over handshake
                                      {Finished}       ← HMAC over transcript
                                      ←───────────────────────────────────────────────

[Both sides derive session keys from ECDH shared secret]

{Finished}
───────────────────────────────────────────────────→

════════ Encrypted Application Data ════════════════
```

**Key insight:** In TLS 1.3, the server certificate is **encrypted** in transit. Only 1 round-trip needed (vs 2 in TLS 1.2).

### What TLS Provides (and Doesn't)

| Property | How | Notes |
|---|---|---|
| **Confidentiality** | AES-256-GCM session keys | Payload encrypted in transit |
| **Integrity** | AEAD authentication tag | Detects tampering in transit |
| **Server Authentication** | X.509 certificate + CA chain | Proves server identity |
| **Perfect Forward Secrecy** | ECDHE ephemeral keys | Past sessions safe even if private key leaked |
| ❌ Client Authentication | Not by default | Use mTLS or application-level auth |
| ❌ End-to-End | Only to TLS endpoint | Terminated at proxy → use MLE |
| ❌ Data at Rest | Not applicable | Use AES-GCM |

### X.509 Certificate Chain of Trust

```
Root CA (self-signed, pre-installed in OS/browser trust store)
    ↓ signs
Intermediate CA certificate
    ↓ signs
Server certificate (e.g., *.example.com)

Browser verification:
  1. Read server cert → find issuer
  2. Find intermediate CA cert (sent by server)
  3. Verify intermediate cert signed by root CA (trusted)
  4. Verify server cert signed by intermediate CA
  5. Verify cert hostname matches requested domain
  6. Verify cert not expired
  7. Check OCSP/CRL → cert not revoked
```

### Perfect Forward Secrecy (PFS)

```
WITHOUT PFS (old RSA key exchange):
  Session key encrypted with server's long-term RSA private key
  Attacker records traffic → 5 years later steals private key
  → Decrypts ALL past sessions ❌

WITH PFS (ECDHE):
  Session key = ECDH(server_ephemeral_privkey, client_ephemeral_pubkey)
  Both ephemeral keys discarded after session
  Even if server's long-term private key is compromised → past sessions safe ✅

TLS 1.3: PFS is MANDATORY (all cipher suites use ECDHE)
TLS 1.2: PFS requires ECDHE or DHE cipher suites (not RSA key exchange)
```

### TLS Configuration in Spring Boot

```yaml
# application.yml
server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: api-cert
    protocol: TLS
    enabled-protocols: TLSv1.3,TLSv1.2   # Never TLS 1.0, 1.1
    ciphers:
      - TLS_AES_256_GCM_SHA384              # TLS 1.3
      - TLS_CHACHA20_POLY1305_SHA256        # TLS 1.3
      - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384  # TLS 1.2
```

```java
// Enforce HTTPS via HSTS header
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.headers(headers -> headers
        .httpStrictTransportSecurity(hsts -> hsts
            .includeSubDomains(true)
            .maxAgeInSeconds(31_536_000)  // 1 year
            .preload(true)
        )
    );
    return http.build();
}

// HTTP → HTTPS redirect
@Bean
public TomcatServletWebServerFactory servletContainer() {
    TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
        @Override
        protected void postProcessContext(Context context) {
            SecurityConstraint constraint = new SecurityConstraint();
            constraint.setUserConstraint("CONFIDENTIAL"); // Force HTTPS
            SecurityCollection collection = new SecurityCollection();
            collection.addPattern("/*");
            constraint.addCollection(collection);
            context.addConstraint(constraint);
        }
    };
    tomcat.addAdditionalTomcatConnectors(httpToHttpsRedirectConnector());
    return tomcat;
}
```

### Certificate Pinning

Force the client to only trust **specific certificates**, not any CA-signed cert.

```java
// OkHttp — Android / backend HTTP client
OkHttpClient client = new OkHttpClient.Builder()
    .certificatePinner(new CertificatePinner.Builder()
        // Pin the SubjectPublicKeyInfo hash of expected cert
        .add("api.example.com",
             "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
        .add("api.example.com",
             "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=") // Backup pin
        .build())
    .build();
```

:::warning[Pinning risks]
Certificate pinning can cause app outages if the cert rotates without updating the pin. Always include a **backup pin** and have a cert rotation plan.
:::

---

## Encryption vs Signing — Decision Chart

```
Do you need confidentiality (hide the content)?
  YES → Encrypt
    Symmetric (fast, large data) → AES-256-GCM
    Asymmetric (key exchange)    → RSA-OAEP (encrypts AES key)
    Hybrid (recommended)         → AES-GCM for data + RSA-OAEP for AES key

Do you need authenticity (prove who sent it / detect tampering)?
  YES → Sign
    Shared secret available → HMAC-SHA256 (webhooks, internal services)
    No shared secret        → RSA / ECDSA digital signature (JWTs, public APIs)

Do you need BOTH?
  → Encrypt THEN Sign (or use authenticated encryption like AES-GCM)
  → JWE + JWS combined
  → TLS (does both at transport layer)
```

---

## Summary: Key Operations Table

| Operation | Key Used | Result | Example |
|---|---|---|---|
| Encrypt | Recipient's **public** key | Ciphertext only recipient can read | MLE request to server |
| Decrypt | Your **private** key | Plaintext | Server decrypts MLE request |
| Sign | Your **private** key | Signature proving your identity | JWT signing, webhook signing |
| Verify signature | Signer's **public** key | Confirmed authenticity + integrity | Verifying JWT, JWKS |
| TLS server auth | Server's **private** key signs handshake | Proves server is who it claims | Every HTTPS connection |

---

## Interview Questions

1. Explain the difference between encrypting and signing a payload. When would you use each?
2. If the server's private key is leaked, what past data is at risk? How does Perfect Forward Secrecy change this?
3. What is JWKS and how does a resource server use it to verify a JWT?
4. What is the `kid` (Key ID) in a JWT and why is it important for key rotation?
5. Explain how zero-downtime JWT key rotation works using JWKS.
6. What is JWE (JSON Web Encryption) and how does it differ from JWT (JWS)?
7. What is Message-Level Encryption and why is it needed if you already have TLS?
8. Walk through the TLS 1.3 handshake — what does each step accomplish?
9. What is a certificate chain of trust? What happens if an intermediate CA is compromised?
10. What is the difference between `RS256` and `ES256` for JWT signing?
11. Why is it unsafe to reuse an IV/nonce when using AES-GCM?
12. In hybrid encryption, why encrypt the AES key with RSA instead of using RSA directly?
