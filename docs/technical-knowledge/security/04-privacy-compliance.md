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

1. What is GDPR and what are the 6 lawful bases for processing personal data?
2. How do you implement the Right to Erasure in a microservices system?
3. What is PCI-DSS and what card data must never be stored?
4. What is the difference between anonymization and pseudonymization?
5. What data should appear in an audit log?
6. How do you implement data retention policies at scale?
7. What is data minimization and how do you apply it to API design?
8. What is a Data Protection Officer (DPO) and when is one required?
9. How do you mask PII in logs without losing debugging ability?
10. How do you handle Subject Access Requests (SAR) in a system with 10+ microservices?
