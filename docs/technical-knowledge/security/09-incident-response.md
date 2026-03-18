---
id: incident-response
title: Incident Response & Security Operations
sidebar_label: Incident Response
description: Security incident response lifecycle, detection engineering, SIEM, forensics, vulnerability management, penetration testing, and security metrics for software engineers.
tags: [incident-response, siem, forensics, detection, vulnerability-management, pentesting, security-operations]
---

# Incident Response & Security Operations

> The question is not *whether* you'll have a security incident — it's whether you'll be **prepared** when it happens.

---

## Incident Response Lifecycle (NIST)

```
1. PREPARATION    — Build IR capability before incidents happen
2. DETECTION      — Identify that an incident has occurred
3. CONTAINMENT    — Stop the damage from spreading
4. ERADICATION    — Remove the threat from environment
5. RECOVERY       — Restore systems to normal operation
6. POST-INCIDENT  — Learn and improve
```

---

## Phase 1: Preparation

### Severity Levels

| Severity | Definition | Response SLA | Escalation |
|---|---|---|---|
| P1 Critical | Production breach, complete outage | 15 min | CTO, Legal, DPO |
| P2 High | Significant data exposure, major degradation | 1 hour | Engineering Lead |
| P3 Medium | Limited exposure, degraded service | 4 hours | On-call Engineer |
| P4 Low | Minor concern, no exposure | 24 hours | Next business day |

---

## Phase 2: Detection

### Application-Level Detection

```java
@Service
public class SecurityEventPublisher {

    public void publishLoginFailure(String username, String ip, String reason) {
        log.warn("{}", Json.encode(Map.of(
            "eventType", "AUTH_FAILURE",
            "severity",  "MEDIUM",
            "username",  username,
            "sourceIp",  ip,
            "reason",    reason,
            "timestamp", Instant.now()
        )));
        metricsService.increment("security.login.failure", "ip", ip);
    }
}

// Detection rules in SIEM:
// RULE: 10+ login failures then success from same IP → credential stuffing + breach
// RULE: data_export.records > 10000 outside business hours → anomalous bulk access
// RULE: NEW admin user created → privilege escalation event
```

---

## Phase 3: Containment

```java
@PostMapping("/admin/security/lockout/{userId}")
@PreAuthorize("hasRole('SECURITY_ADMIN')")
public ResponseEntity<Void> emergencyLockout(@PathVariable Long userId,
        @RequestParam String reason) {
    // 1. Disable account
    userRepository.findById(userId).ifPresent(user -> {
        user.setLocked(true);
        userRepository.save(user);
    });

    // 2. Invalidate all sessions
    sessionRepository.deleteAllByUserId(userId);

    // 3. Blacklist all JWTs issued before now
    redis.opsForValue().set("user:tokens:blacklist:" + userId,
        Instant.now().toString(), Duration.ofDays(7));

    auditService.record(AuditEvent.securityAction("EMERGENCY_LOCKOUT", userId, reason));
    return ResponseEntity.noContent().build();
}

// Check in JWT filter
public boolean isUserBlacklisted(Long userId, Instant tokenIssuedAt) {
    String blacklistedAt = redis.opsForValue().get("user:tokens:blacklist:" + userId);
    if (blacklistedAt == null) return false;
    return tokenIssuedAt.isBefore(Instant.parse(blacklistedAt));
}
```

```bash
# Network containment — isolate compromised instance (AWS)
aws ec2 modify-instance-attribute \
  --instance-id i-1234567890abcdef0 \
  --groups sg-isolation-group   # SG with NO inbound/outbound

# Block IP at WAF
aws wafv2 update-ip-set --name BlockedIPs --addresses "1.2.3.4/32"

# Rotate compromised credentials immediately
aws iam delete-access-key --access-key-id AKIAIOSFODNN7EXAMPLE
```

---

## Phase 6: Post-Incident Review Template

```markdown
## Post-Incident Review — INC-2024-001

**Severity:** P1 Critical
**Duration:** 4h 23min

### Timeline
- 14:00 — Alert: anomalous S3 access pattern
- 14:15 — On-call acknowledged
- 14:45 — Scope: 50,000 user emails accessed
- 15:30 — Compromised credential rotated
- 18:23 — All-clear declared

### Root Cause
Long-lived AWS access key exposed in public GitHub repo (committed 6 months ago).

### Contributing Factors
- No secrets scanning in CI pipeline
- Access key had overly broad S3 permissions (s3:* on all buckets)
- No CloudTrail alert on unusual S3 GetObject patterns

### Action Items
| Action | Owner | Due |
|---|---|---|
| Add Gitleaks to all repos | DevOps | +7 days |
| Audit all IAM access keys | Security | +7 days |
| Add S3 CloudTrail alerting | Security | +14 days |
| Implement least-privilege IAM | IAM team | +30 days |
```

---

## Vulnerability Management

### CVSS Scoring & Remediation SLAs

| CVSS | Severity | SLA |
|---|---|---|
| 9.0–10.0 | Critical | 24 hours |
| 7.0–8.9 | High | 7 days |
| 4.0–6.9 | Medium | 30 days |
| 0.1–3.9 | Low | 90 days |

---

## Security Metrics

| Metric | Definition | Target |
|---|---|---|
| MTTD | Mean Time to Detect — how long before breach detected | < 1h for P1 |
| MTTR | Mean Time to Respond — contain + remediate | < 4h for P1 |
| Dwell Time | How long attacker was in environment undetected | < 24h |
| False Positive Rate | % of alerts that are false positives | < 10% |

---

## Interview Questions

1. Describe the 6 phases of the NIST incident response lifecycle.
2. How do you contain a compromised user account in a microservices system?
3. What is dwell time and why does it matter?
4. What should a post-incident review cover?
5. What is CVSS and how does it drive remediation SLAs?
6. What is the difference between vulnerability assessment and penetration testing?
7. What security events should trigger an alert in your system?
8. How do you handle a situation where an AWS access key is committed to GitHub?
9. What metrics would you track to measure the effectiveness of a security program?
10. What is threat hunting and how does it differ from reactive incident response?
