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
| **ISO 27001** | Information security | ISMS, risk management, controls |

---

## Data Classification

Classify data **before** you build. Classification determines protection requirements.

| Class | Examples | Controls |
|---|---|---|
| **Public** | Marketing copy, product catalog | No special controls |
| **Internal** | Employee emails, internal docs | Access control, no public sharing |
| **Confidential** | Business strategies, contracts | Encryption, need-to-know access |
| **Restricted / PII** | Names, emails, addresses, IPs | Encrypt at rest + transit, minimal access, audit log |
| **Sensitive PII** | SSN, health data, biometrics, financial | All above + masking, enhanced auditing, separate storage |
| **Regulated** | PCI (card numbers), PHI | Strict compliance controls, isolated environments |

```java
// Data classification via annotations
@PiiField(category = PiiCategory.CONTACT)
private String email;

@PiiField(category = PiiCategory.FINANCIAL)
@Encrypted  // Encrypted at rest
private String bankAccountNumber;

@PiiField(category = PiiCategory.IDENTITY, regulated = Regulation.HIPAA)
@Encrypted
@AccessControlled(roles = {"CLINICIAN", "ADMIN"})
private String diagnosisCode;
```

---

## GDPR Key Requirements (Engineering View)

### Lawful Basis for Processing
Data may only be processed if one of these applies:
1. **Consent** — freely given, specific, informed, unambiguous
2. **Contract** — necessary to fulfill contract with user
3. **Legal obligation** — required by law
4. **Vital interests** — necessary to protect life
5. **Public task** — official authority
6. **Legitimate interests** — balanced against individual rights

```java
// Consent record — must be stored with timestamp and mechanism
@Entity
public class ConsentRecord {
    @Id UUID id;
    Long userId;
    String purpose;       // "marketing_emails", "analytics", "third_party_sharing"
    boolean granted;
    String mechanism;     // "signup_form_v2", "settings_page"
    String ipAddress;
    String userAgent;
    LocalDateTime recordedAt;
    String legalBasisVersion; // Version of privacy policy at time of consent
}
```

### Right to Access (Subject Access Request — SAR)
```java
@Service
public class SarService {
    // Return ALL data held about a user (within 30 days per GDPR)
    public UserDataExport exportAllData(Long userId) {
        return UserDataExport.builder()
            .profile(userRepository.findById(userId))
            .orders(orderRepository.findAllByUserId(userId))
            .activityLog(activityRepository.findAllByUserId(userId))
            .consents(consentRepository.findAllByUserId(userId))
            .communications(emailLogRepository.findAllByUserId(userId))
            .build();
    }
}
```

### Right to Erasure ("Right to Be Forgotten")
```java
@Service
@Transactional
public class ErasureService {

    public void eraseUser(Long userId) {
        // 1. Anonymize personally identifiable data
        User user = userRepository.findById(userId).orElseThrow();
        user.setEmail("deleted_" + userId + "@deleted.invalid");
        user.setName("Deleted User");
        user.setPhoneNumber(null);
        user.setDateOfBirth(null);
        user.setDeletedAt(Instant.now());
        user.setErasedAt(Instant.now());
        userRepository.save(user);

        // 2. Delete non-essential data
        activityRepository.deleteByUserId(userId);
        sessionRepository.deleteByUserId(userId);
        consentRepository.deleteByUserId(userId);

        // 3. Retain what's legally required (billing records, legal disputes)
        // Orders: anonymize user reference but keep financial records (legal obligation)
        orderRepository.anonymizeUserReference(userId);

        // 4. Invalidate all tokens/sessions
        tokenRepository.invalidateAllForUser(userId);

        // 5. Notify downstream systems (via event)
        eventPublisher.publishEvent(new UserErasedEvent(userId));
    }
}

// Downstream services listen and clean up their own data
@KafkaListener(topics = "user-erased")
public void onUserErased(UserErasedEvent event) {
    searchIndexService.removeUser(event.getUserId());
    recommendationService.deleteProfile(event.getUserId());
    analyticsService.anonymize(event.getUserId());
}
```

### Data Minimization
```java
// Only collect what you need — use projection DTOs
// ❌ Returns full entity including unnecessary PII
User user = userRepository.findById(id);

// ✅ Returns only what the feature needs
public interface OrderSummaryProjection {
    String getOrderId();
    BigDecimal getTotal();
    String getStatus();
    // No user PII returned
}

@Query("SELECT o.orderId AS orderId, o.total AS total, o.status AS status " +
       "FROM Order o WHERE o.userId = :userId")
List<OrderSummaryProjection> findOrderSummaries(@Param("userId") Long userId);
```

### Data Retention Policy
```java
// Automated data deletion after retention period
@Scheduled(cron = "0 0 1 * * ?") // Daily at 1 AM
public void enforceRetentionPolicy() {
    Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);

    // Delete activity logs older than 90 days
    activityRepository.deleteByCreatedAtBefore(cutoff);

    // Anonymize orders older than 7 years (legal retention period)
    orderRepository.anonymizeOlderThan(Instant.now().minus(7 * 365, ChronoUnit.DAYS));
}
```

---

## PCI-DSS (Payment Card Industry)

### What You Must NEVER Store
```java
// ❌ NEVER store (even encrypted)
String cvv;
String pin;
String fullMagneticStripe;
String chipData;

// ❌ Store only after masking
String cardNumber = "4111111111111111"; // Full PAN — violation
String cardNumber = "411111XXXXXX1111"; // Masked PAN — OK
// Or store only last 4 digits for display

// ✅ Instead: store payment provider's token
@Entity
public class PaymentMethod {
    @Id Long id;
    Long userId;
    String providerToken;     // Stripe token: pm_1234... (references actual card at Stripe)
    String last4;             // "1234" — OK to store for display
    String cardBrand;         // "Visa"
    String expiryMmYy;        // "12/26"
    // CVV never stored, ever.
}
```

### PCI Scope Reduction
```
Goal: Keep PCI scope as small as possible

Without tokenization:        With Stripe/Braintree tokenization:
Your App → handles card →    Your App → Stripe.js (card never hits your server)
Your DB stores card data →   Your DB stores token only
Your servers are in scope    Only Stripe is in scope

Massive reduction in compliance burden!
```

---

## HIPAA (Health Data in US)

### Protected Health Information (PHI)
18 identifiers that make health data PHI:
- Name, address, dates (birthdate, admission), phone, fax, email, SSN, medical record #, health plan #, account #, certificate #, device IDs, URLs, IP addresses, biometrics, photos, any unique identifier

### Technical Safeguards
```java
// Minimum Necessary — only access PHI for legitimate reason
@PreAuthorize("@hipaaAccessPolicy.canAccessPatient(authentication, #patientId)")
public PatientRecord getPatientRecord(Long patientId) { ... }

// Audit every access to PHI
@Aspect
@Component
public class HipaaAuditAspect {
    @Around("@annotation(hipaaAudit)")
    public Object auditPhiAccess(ProceedingJoinPoint jp, HipaaAudit hipaaAudit) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object result = jp.proceed();

        hipaaAuditLog.record(HipaaAuditEntry.builder()
            .userId(auth.getName())
            .action(hipaaAudit.action())
            .resourceType(hipaaAudit.resourceType())
            .resourceId(getResourceId(jp))
            .timestamp(Instant.now())
            .build());

        return result;
    }
}
```

---

## Audit Logging

Immutable audit trail for compliance and security investigations.

```java
@Entity
@Immutable // Never updated, only inserted
public class AuditLog {
    @Id UUID id = UUID.randomUUID();
    String eventType;       // USER_LOGIN, ORDER_CREATED, DATA_ACCESSED
    String actorId;         // Who did it
    String actorType;       // USER, SERVICE, ADMIN
    String targetType;      // RESOURCE type affected
    String targetId;        // RESOURCE id affected
    String action;          // READ, WRITE, DELETE, EXPORT
    String ipAddress;
    String userAgent;
    String outcome;         // SUCCESS, FAILURE, DENIED
    String details;         // JSON of relevant details
    Instant occurredAt;
    String correlationId;   // Link to distributed trace
}

// Append-only audit service
@Service
public class AuditService {
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW) // Separate transaction
    public void record(AuditEvent event) {
        AuditLog log = mapper.toLog(event);
        auditRepository.save(log);
        // Also write to WORM (Write-Once, Read-Many) storage for tamper-evidence
    }
}
```

### Audit Log Integrity
```
Tamper-evident chain: each log entry includes hash of previous entry
Entry N hash = SHA256(Entry N data + Entry N-1 hash)
→ Modifying any entry breaks the chain — detectable
```

---

## Privacy-by-Design Principles

| Principle | Engineering Action |
|---|---|
| Proactive, not reactive | Threat model data flows before building |
| Privacy as default | Opt-in for data collection, not opt-out |
| Privacy embedded | Data minimization in schema design |
| Full functionality | Privacy doesn't require sacrificing features |
| End-to-end security | Encrypt in transit AND at rest |
| Visibility/transparency | Users can see what data is held |
| Respect for users | Easy account deletion, data export |

---

## Data Masking & Pseudonymization

```java
// Mask PII in logs
@Slf4j
public class LoggingUtils {
    // ❌ Never log raw PII
    // log.info("User email: {}", user.getEmail());

    // ✅ Mask in logs
    public static String maskEmail(String email) {
        if (email == null) return null;
        int at = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(at);
        // user@example.com → u***@example.com
    }

    public static String maskCardNumber(String card) {
        return "****-****-****-" + card.substring(card.length() - 4);
    }
}

// Pseudonymization — replace real ID with consistent token (reversible by authorized party)
@Service
public class PseudonymizationService {
    @Autowired private TokenMappingRepository repo; // userId ↔ pseudonym

    public String pseudonymize(Long userId) {
        return repo.findByUserId(userId)
            .orElseGet(() -> {
                String token = UUID.randomUUID().toString();
                repo.save(new TokenMapping(userId, token));
                return token;
            })
            .getPseudonym();
    }
}
```

---

## Breach Notification Requirements

| Regulation | Notification to Authority | Notification to Users |
|---|---|---|
| GDPR | Within 72 hours | If high risk to individuals |
| CCPA | N/A (no authority notification) | If unencrypted PII exposed |
| HIPAA | Within 60 days | If PHI of 500+ individuals affected |

### Breach Response Checklist
- [ ] Detect and contain breach
- [ ] Assess scope: what data, how many users?
- [ ] Preserve evidence (logs, forensics)
- [ ] Notify legal & DPO immediately
- [ ] Notify regulators within required window
- [ ] Notify affected users if required
- [ ] Remediate root cause
- [ ] Post-incident review

---

## Interview Questions

1. What is GDPR and what are the 6 lawful bases for processing personal data?
2. How do you implement the Right to Erasure (GDPR Article 17) in a microservices system?
3. What is PCI-DSS and what card data must never be stored?
4. What is the difference between anonymization and pseudonymization?
5. What data should appear in an audit log?
6. How do you implement data retention policies at scale?
7. What is data minimization and how do you apply it to API design?
8. What is the difference between GDPR and HIPAA? When might both apply?
9. What does "Privacy by Design" mean in practice for a backend engineer?
10. How do you handle Subject Access Requests (SAR) in a system with 10+ microservices?
11. What is a Data Protection Officer (DPO) and when is one required?
12. How do you mask PII in logs without losing debugging ability?
