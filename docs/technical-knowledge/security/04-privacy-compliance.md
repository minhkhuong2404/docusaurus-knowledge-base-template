---
id: privacy-compliance
title: Privacy & Compliance
sidebar_label: Privacy & Compliance
description: Engineering guide to GDPR, CCPA, PCI-DSS, HIPAA, and SOC 2 compliance — covering data classification, right to erasure, data minimization, consent management, audit logging, and privacy-by-design.
tags: [privacy, gdpr, ccpa, pci-dss, hipaa, soc2, compliance, data-classification, consent, audit-log, privacy-by-design]
---

# Privacy & Compliance

> Compliance is not just legal obligation — it's about building systems users can trust.

---

## Regulatory Landscape

| Regulation | Scope | Key Requirements |
|---|---|---|
| **GDPR** | EU/EEA personal data | Consent, right to erasure, DPO, breach notification 72h |
| **CCPA/CPRA** | California residents | Right to know, right to delete, opt-out of data sale |
| **PCI-DSS** | Payment card data | Cardholder data protection, vulnerability management |
| **HIPAA** | US health data (PHI) | Safeguards, minimum necessary, BAA agreements |
| **SOC 2** | SaaS trust criteria | Security, availability, confidentiality, privacy controls |

---

## Data Classification

| Class | Examples | Controls |
|---|---|---|
| **Public** | Marketing copy, product catalog | No special controls |
| **Internal** | Employee emails, internal docs | Access control |
| **Confidential** | Business strategies, contracts | Encryption, need-to-know |
| **Restricted / PII** | Names, emails, IPs | Encrypt at rest + transit, audit log |
| **Sensitive PII** | SSN, health data, biometrics | All above + masking, separate storage |
| **Regulated** | PCI card data, PHI | Strict compliance controls, isolated environments |

```java
@PiiField(category = PiiCategory.CONTACT)
private String email;

@PiiField(category = PiiCategory.FINANCIAL)
@Encrypted
private String bankAccountNumber;

@PiiField(category = PiiCategory.IDENTITY, regulated = Regulation.HIPAA)
@Encrypted
@AccessControlled(roles = {"CLINICIAN", "ADMIN"})
private String diagnosisCode;
```

---

## GDPR Key Requirements

### Right to Erasure

```java
@Service
@Transactional
public class ErasureService {

    public void eraseUser(Long userId) {
        // 1. Anonymize PII
        User user = userRepository.findById(userId).orElseThrow();
        user.setEmail("deleted_" + userId + "@deleted.invalid");
        user.setName("Deleted User");
        user.setPhoneNumber(null);
        user.setErasedAt(Instant.now());
        userRepository.save(user);

        // 2. Delete non-essential data
        activityRepository.deleteByUserId(userId);
        sessionRepository.deleteByUserId(userId);
        consentRepository.deleteByUserId(userId);

        // 3. Retain legally required records (billing, legal disputes)
        orderRepository.anonymizeUserReference(userId);

        // 4. Invalidate all sessions and tokens
        tokenRepository.invalidateAllForUser(userId);

        // 5. Notify downstream services via event
        eventPublisher.publishEvent(new UserErasedEvent(userId));
    }
}

// Downstream services clean up their own data
@KafkaListener(topics = "user-erased")
public void onUserErased(UserErasedEvent event) {
    searchIndexService.removeUser(event.getUserId());
    analyticsService.anonymize(event.getUserId());
}
```

### Data Minimization

```java
// ✅ Use projections — only return what the feature needs
public interface OrderSummaryProjection {
    String getOrderId();
    BigDecimal getTotal();
    String getStatus();
    // No PII returned
}
```

### Data Retention Policy

```java
@Scheduled(cron = "0 0 1 * * ?") // Daily at 1 AM
public void enforceRetentionPolicy() {
    Instant cutoff = Instant.now().minus(90, ChronoUnit.DAYS);
    activityRepository.deleteByCreatedAtBefore(cutoff);
    orderRepository.anonymizeOlderThan(Instant.now().minus(7 * 365, ChronoUnit.DAYS));
}
```

---

## PCI-DSS

### What You Must NEVER Store

```java
// ❌ NEVER store (even encrypted)
String cvv;
String fullMagneticStripe;
String pin;

// ✅ Store only tokenized reference
@Entity
public class PaymentMethod {
    String providerToken;   // e.g., Stripe: pm_1234...
    String last4;           // "1234" — OK for display
    String cardBrand;       // "Visa"
    String expiryMmYy;      // "12/26"
    // CVV never stored, ever.
}
```

**Best practice:** Use Stripe.js / Braintree — card data never hits your servers, only tokens do. Drastically reduces PCI scope.

---

## Audit Logging

```java
@Entity
@Immutable // Append-only — never update
public class AuditLog {
    @Id UUID id = UUID.randomUUID();
    String eventType;      // USER_LOGIN, DATA_ACCESSED, ROLE_CHANGED
    String actorId;
    String targetType;
    String targetId;
    String action;         // READ, WRITE, DELETE, EXPORT
    String ipAddress;
    String outcome;        // SUCCESS, FAILURE, DENIED
    String details;        // JSON context
    Instant occurredAt;
    String correlationId;
}

// Security events that MUST be logged
log.warn("LOGIN_FAILED user={} ip={} reason={}", username, ip, reason);
log.info("LOGIN_SUCCESS user={} ip={} mfa={}", username, ip, mfaUsed);
log.warn("ACCESS_DENIED user={} resource={}", user, resource);
log.warn("PRIVILEGE_ESCALATION_ATTEMPT user={} role={}", user, role);
log.info("DATA_EXPORT user={} records={}", username, count);

// NEVER log these
// log.info("Password: {}", password);   ❌ Credential leak
// log.info("Token: {}", jwtToken);      ❌ Token leak
// log.info("Card: {}", cardNumber);     ❌ PCI violation
```

---

## Data Masking & Pseudonymization

```java
public static String maskEmail(String email) {
    if (email == null) return null;
    int at = email.indexOf('@');
    return email.charAt(0) + "***" + email.substring(at);
    // alice@example.com → a***@example.com
}

public static String maskCard(String card) {
    return "****-****-****-" + card.substring(card.length() - 4);
}
```

---

## Breach Notification Requirements

| Regulation | Notify Authority | Notify Users |
|---|---|---|
| GDPR | Within 72 hours | If high risk to individuals |
| CCPA | N/A | If unencrypted PII exposed |
| HIPAA | Within 60 days | If PHI of 500+ individuals affected |

---

## Interview Questions

**Q1: What is GDPR and what are the 6 lawful bases for processing personal data?**

> **GDPR (General Data Protection Regulation)** is the EU's data protection and privacy regulation. To legally process personal data under GDPR, you must satisfy at least one of the 6 lawful bases:
> 1. **Consent:** The user has given clear, explicit consent for a specific purpose.
> 2. **Contract:** Processing is necessary to fulfill a contract with the user (e.g. shipping address for delivery).
> 3. **Legal Obligation:** Processing is necessary to comply with the law (e.g. tax reporting, financial audit laws).
> 4. **Vital Interests:** Processing is necessary to protect someone's life.
> 5. **Public Task:** Necessary to perform a task in the public interest.
> 6. **Legitimate Interests:** Necessary for your organization's business, provided it doesn't override the user's fundamental privacy rights.

---

**Q2: How do you implement the Right to Erasure in a microservices system?**

> Implementing the Right to Erasure (Right to be Forgotten) in a distributed system requires:
> 1. **Event-Driven Propagation:** Publish a `UserDeletedEvent` to a Kafka topic. All microservices containing copies or caches of user details must consume this event and delete corresponding local database records.
> 2. **Hard Deletes vs. Soft Deletes:** Remove the actual PII records completely (hard delete) or overwrite PII columns with scrubbed/anonymized values (e.g., `user_123` becomes `deleted_user_xyz`), preserving transactional consistency without retaining personal details.
> 3. **Backup Purges:** Document a backup lifecycle policy where PII is automatically removed from backups as tapes or snaps are rotated out.

---

**Q3: What is PCI-DSS and what card data must never be stored?**

> **PCI-DSS (Payment Card Industry Data Security Standard)** is a compliance framework for securing credit card transaction data.
> * **Never Store (even if encrypted):** Sensitive Authentication Data (SAD), which includes:
>   * Card verification codes (CVV, CVV2, CVC).
>   * Full magnetic stripe (track data).
>   * PIN blocks / PINs.
> * **May Store (with strict encryption, hashing, and masking):** Primary Account Number (PAN), cardholder name, and expiration date.

---

**Q4: What is the difference between anonymization and pseudonymization?**

> * **Anonymization:** Irreversibly alters personal data so that the individual can **never** be re-identified by any means (e.g., stripping all user identifiers and aggregating age ranges). Anonymized data is no longer subject to GDPR.
> * **Pseudonymization:** Replaces identifying fields with artificial identifiers or pseudonyms (e.g., mapping `user_id` to a random uuid `a98f-092c`). The data can still be linked back to the individual *if* combined with additional lookup information (held securely elsewhere). Pseudonymized data remains subject to GDPR.

---

**Q5: What data should appear in an audit log?**

> Audit logs verify compliance and trace system breaches. They must include:
> * **Who:** The user ID or actor initiating the event.
> * **What:** The action performed (e.g., `READ_RECORD`, `EXPORT_REPORT`).
> * **When:** Cryptographically accurate, synced timestamp.
> * **Where:** IP address, client user-agent, or server instance ID.
> * **Impact:** Success or failure status.
> * **Never log:** Sensitive PII, passwords, session cookies, JWTs, or credit card numbers.

---

**Q6: How do you implement data retention policies at scale?**

> 1. **Partitioning:** Partition database tables by date range (e.g. monthly partitions). Removing old logs or records becomes a fast metadata operation (`DROP PARTITION`) rather than slow, resource-intensive `DELETE` queries that lock tables.
> 2. **TTL (Time to Live) Indexes:** In NoSQL systems (MongoDB, DynamoDB, Redis), set TTL parameters on columns to automatically delete records after expiration.
> 3. **Object Lifecycle Rules:** In S3 or Cloud Storage, configure bucket lifecycle policies to automatically transition files to archive storage (Glacier) or permanently delete them after X days.

---

**Q7: What is data minimization and how do you apply it to API design?**

> **Data Minimization** is the principle that personal data collected must be adequate, relevant, and limited to only what is necessary for the specified purposes.
> * **API Application:** Design APIs that return only the fields requested by the client (using GraphQL or DTO projection templates) instead of returning entire database rows. For example, if a billing service only needs to check active status, do not return the user's phone, email, and address in the response payload.

---

**Q8: What is a Data Protection Officer (DPO) and when is one required?**

> A DPO is a designated compliance leader responsible for monitoring GDPR compliance, advising on data protection impact assessments, and acting as a point of contact for supervisory authorities.
> **Required When:**
> 1. The processing is carried out by a public authority.
> 2. The core activities consist of processing operations that require systematic, large-scale monitoring of individuals.
> 3. The core activities consist of large-scale processing of special categories of data (e.g., health records, criminal history).

---

**Q9: How do you mask PII in logs without losing debugging ability?**

> 1. **Structured Log Interceptors:** Implement a centralized logging layout patterns or filters (e.g., Logback/Log4j Appenders) that scan string outputs for regex matches (credit cards, emails, SSNs) and replace characters with asterisks (e.g. `****-****-****-1234`).
> 2. **Tokenization:** Replace database record references in logs with high-level correlation IDs. Developers can look up operational histories in developer dashboards without seeing raw PII.

---

**Q10: How do you handle Subject Access Requests (SAR) in a system with 10+ microservices?**

> 1. **Centralized Identity Mapping:** Maintain a core Identity Mapping database linking all pseudonyms/system-specific IDs back to the master User ID.
> 2. **Orchestration Flow:** Implement a worker service that consumes a SAR request, issues async RPC calls or events (e.g., `FetchUserDataRequest`) to all microservices, aggregates JSON payloads containing user information, and formats the output into a secure ZIP/PDF package for download.
> 3. **Data Access Governance:** Ensure the administrative portal executing the SAR extraction is strictly rate-limited and logged.
