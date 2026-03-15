---
id: incident-response
title: Incident Response & Security Operations
sidebar_label: Incident Response
description: Security incident response lifecycle, SIEM, forensics, detection engineering, vulnerability management, penetration testing, and building a security operations program.
tags: [incident-response, siem, forensics, detection, vulnerability-management, pentesting, security-operations, soc]
---

# Incident Response & Security Operations

> The question is not whether you'll have a security incident — it's whether you'll be prepared when it happens.

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

### Incident Response Plan (IRP)
```markdown
## Incident Severity Levels

| Severity | Definition | Response Time | Escalation |
|---|---|---|---|
| P1 Critical | Production data breach, complete outage | 15 min | CTO, Legal, DPO |
| P2 High | Significant data exposure, major service degraded | 1 hour | Engineering Lead |
| P3 Medium | Limited exposure, service degraded | 4 hours | On-call Engineer |
| P4 Low | Minor security concern, no exposure | 24 hours | Next business day |

## Contacts
- Security team: security@example.com
- On-call engineer: PagerDuty
- Legal: legal@example.com / +1-555-0100
- Data Protection Officer: dpo@example.com

## Playbooks (per incident type)
- /playbooks/data-breach.md
- /playbooks/ransomware.md
- /playbooks/account-takeover.md
- /playbooks/ddos.md
```

---

## Phase 2: Detection

### Security Event Sources
```
Application Logs        → Failed logins, authorization failures, errors
Infrastructure Logs     → SSH logins, firewall blocks, network anomalies
Cloud Audit Logs        → AWS CloudTrail, GCP Cloud Audit, Azure Activity Log
Endpoint Detection      → EDR (CrowdStrike, SentinelOne) — malware, process anomalies
Network Monitoring      → Unusual outbound connections, data exfiltration
SIEM Platform           → Correlate and alert across all sources
```

### Detection Rules Examples
```
RULE: Multiple failed logins + successful login
  IF login_failure.count > 10 AND login_success.count == 1
  WITHIN 5 minutes
  FROM same source IP
  THEN: ALERT — possible credential stuffing + successful breach

RULE: Sensitive data export at unusual time
  IF data_export.user = admin
  AND data_export.time NOT BETWEEN 09:00 AND 18:00
  AND data_export.records > 10000
  THEN: ALERT — anomalous bulk data access

RULE: New admin user created
  IF event.type = "USER_ROLE_CHANGED"
  AND event.new_role = "ADMIN"
  THEN: ALERT — privilege escalation event
```

### Application-Level Detection
```java
// Structured security events for SIEM ingestion
@Service
public class SecurityEventPublisher {

    public void publishLoginFailure(String username, String ip, String reason) {
        SecurityEvent event = SecurityEvent.builder()
            .eventType("AUTH_FAILURE")
            .severity("MEDIUM")
            .username(username)
            .sourceIp(ip)
            .reason(reason)
            .timestamp(Instant.now())
            .build();
        log.warn("{}", toJson(event)); // SIEM ingests structured logs
        metricsService.increment("security.login.failure", "ip", ip);
    }

    public void publishSuspiciousActivity(String userId, String activity, Map<String, Object> context) {
        SecurityEvent event = SecurityEvent.builder()
            .eventType("SUSPICIOUS_ACTIVITY")
            .severity("HIGH")
            .userId(userId)
            .activity(activity)
            .context(context)
            .timestamp(Instant.now())
            .build();
        log.warn("{}", toJson(event));
        // Also send to Kafka for real-time processing
        kafkaTemplate.send("security-events", event);
    }
}
```

---

## Phase 3: Containment

### Immediate Containment Actions

```java
// Emergency user lockout
@PostMapping("/admin/security/lockout/{userId}")
@PreAuthorize("hasRole('SECURITY_ADMIN')")
public ResponseEntity<Void> emergencyLockout(@PathVariable Long userId,
        @RequestParam String reason) {
    // 1. Disable user account
    userRepository.findById(userId).ifPresent(user -> {
        user.setLocked(true);
        user.setLockReason(reason);
        userRepository.save(user);
    });

    // 2. Invalidate all active sessions
    sessionRepository.deleteAllByUserId(userId);

    // 3. Blacklist all JWT tokens for user
    String redisKey = "user:tokens:blacklist:" + userId;
    redis.opsForValue().set(redisKey, Instant.now().toString(),
        Duration.ofDays(7)); // Block all tokens issued before now

    // 4. Log the action (for audit trail)
    auditService.record(AuditEvent.securityAction(
        "EMERGENCY_LOCKOUT", userId, reason));

    return ResponseEntity.noContent().build();
}

// Check blacklist in JWT filter
public boolean isUserBlacklisted(Long userId, Instant tokenIssuedAt) {
    String blacklistedAt = redis.opsForValue().get(
        "user:tokens:blacklist:" + userId);
    if (blacklistedAt == null) return false;
    return tokenIssuedAt.isBefore(Instant.parse(blacklistedAt));
}
```

### Network Containment
```bash
# Isolate compromised instance (AWS CLI)
aws ec2 modify-instance-attribute \
  --instance-id i-1234567890abcdef0 \
  --groups sg-isolation-group  # Security group with NO inbound/outbound

# Block suspicious IP at WAF
aws wafv2 update-ip-set \
  --name BlockedIPs \
  --id <ip-set-id> \
  --addresses "1.2.3.4/32"

# Rotate compromised credentials immediately
aws iam delete-access-key --access-key-id AKIAIOSFODNN7EXAMPLE
aws iam create-access-key --user-name service-account
```

---

## Phase 4: Eradication

### Root Cause Analysis Questions
```
1. How did the attacker gain initial access?
   → Phishing? Vulnerability? Credential stuffing? Insider?

2. What did they do once inside?
   → Lateral movement? Data exfiltration? Persistence mechanisms?

3. What data was accessed or exfiltrated?
   → Which systems, which data, how much, for how long?

4. How long were they in the environment?
   → Dwell time: average breach dwell time is 200+ days

5. What persistence mechanisms did they install?
   → Backdoors, new user accounts, modified binaries, cron jobs
```

---

## Phase 5: Recovery

### Staged Recovery
```
1. Verify threat is eliminated before restoring
2. Restore from known-good backup (before compromise)
3. Patch the vulnerability that was exploited
4. Restore service gradually (not all at once)
5. Monitor closely for reinfection during recovery
6. Validate data integrity after restore
```

---

## Phase 6: Post-Incident Review (PIR)

```markdown
## Post-Incident Review Template

**Incident ID:** INC-2024-001
**Date:** 2024-01-15
**Severity:** P1 Critical
**Duration:** 4 hours 23 minutes

### Timeline
- 14:00 - Initial alert: anomalous S3 access
- 14:15 - On-call acknowledged
- 14:45 - Scope identified: 50,000 user records accessed
- 15:30 - Compromised credential rotated
- 16:30 - Systems restored
- 18:23 - All-clear declared

### Root Cause
Long-lived AWS access key exposed in public GitHub repo (committed 6 months ago).

### Contributing Factors
- No secrets scanning in CI pipeline
- Access key had overly broad S3 permissions
- No alert on unusual S3 GetObject patterns

### Impact
- 50,000 user email addresses accessed
- No passwords or payment data exposed
- GDPR notification required (sent within 72h)

### Action Items
| Action | Owner | Due Date | Status |
|---|---|---|---|
| Add Gitleaks to all repos | DevOps | 2024-01-22 | DONE |
| Audit all IAM access keys | Security | 2024-01-22 | IN PROGRESS |
| Add S3 CloudTrail alerting | Security | 2024-01-29 | TODO |
| Implement least-privilege IAM review | IAM team | 2024-02-15 | TODO |
```

---

## Vulnerability Management

### Vulnerability Lifecycle
```
Discover → Triage → Prioritize → Remediate → Verify → Close

Discovery sources:
  - SAST/SCA in CI pipeline
  - Penetration testing (quarterly)
  - Bug bounty program
  - Threat intelligence feeds (CISA KEV)
  - Internal security review
```

### CVSS Scoring & SLAs
| CVSS Score | Severity | Remediation SLA |
|---|---|---|
| 9.0 – 10.0 | Critical | 24 hours |
| 7.0 – 8.9 | High | 7 days |
| 4.0 – 6.9 | Medium | 30 days |
| 0.1 – 3.9 | Low | 90 days |

### Patch Management
```java
// Automated dependency update PR + auto-merge for patch versions
// Dependabot config:
groups:
  patch-updates:
    patterns: ["*"]
    update-types: ["patch"]
auto-merge: true  # Auto-merge patch updates that pass CI
```

---

## Penetration Testing

### Scope Definition
```markdown
## Pentest Scope

**In Scope:**
- Production: https://api.example.com
- Staging: https://staging.example.com
- IP ranges: 1.2.3.0/24

**Out of Scope:**
- Third-party services (Stripe, SendGrid)
- DDoS testing
- Social engineering

**Rules of Engagement:**
- No destructive testing (no data deletion)
- No testing outside business hours without prior approval
- Immediately notify security@example.com of critical findings
- All testing to be logged with timestamps
```

### Pentest Types
| Type | Who | Frequency | Depth |
|---|---|---|---|
| External pentest | 3rd party firm | Annual | Deep |
| Internal pentest | Security team | Quarterly | Deep |
| Web app pentest | 3rd party or internal | Per major release | Application focused |
| Bug bounty | Community | Continuous | Varies |
| Red team exercise | Specialist firm | Biennial | Full kill chain |

---

## Security Metrics

```
MTTD (Mean Time to Detect):      How long before breach is detected
MTTR (Mean Time to Respond):     How long to contain + remediate
MTTC (Mean Time to Contain):     How long to stop the spread
Dwell Time:                       MTTD — how long attacker was in environment
Alert Fatigue Rate:               % of alerts that are false positives

Targets:
  MTTD < 1 hour for P1
  MTTR < 4 hours for P1
  False positive rate < 10%
```

---

## Interview Questions

1. Describe the 6 phases of the NIST incident response lifecycle.
2. How do you contain a compromised user account in a microservices system?
3. What is dwell time and why does it matter?
4. What should a post-incident review cover?
5. What is CVSS and how does it drive remediation SLAs?
6. What is the difference between vulnerability assessment and penetration testing?
7. What security events should trigger an alert in your system?
8. How do you handle a situation where an AWS access key is accidentally committed to GitHub?
9. What metrics would you track to measure the effectiveness of a security program?
10. What is threat hunting and how does it differ from reactive incident response?
