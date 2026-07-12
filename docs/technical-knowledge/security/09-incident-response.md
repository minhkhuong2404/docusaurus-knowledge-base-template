---
id: incident-response
title: Incident Response & Security Operations
sidebar_label: Incident Response
description: Security incident response lifecycle, detection engineering, SIEM, forensics, vulnerability management, penetration testing, and security metrics for software engineers.
tags: [incident-response, siem, forensics, detection, vulnerability-management, pentesting, security-operations]
---

# Incident Response & Security Operations

import NistLifecycleDiagram from '@site/src/components/NistLifecycleDiagram';
import PostIncidentTemplateDiagram from '@site/src/components/PostIncidentTemplateDiagram';


> The question is not *whether* you'll have a security incident — it's whether you'll be **prepared** when it happens.

---

## Incident Response Lifecycle (NIST)

<NistLifecycleDiagram />

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

<PostIncidentTemplateDiagram />

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

**Q1: Describe the 6 phases of the NIST incident response lifecycle.**

> The **NIST SP 800-61** framework defines 4 core phases (which expand to 6 logical operational phases):
> 1. **Preparation:** Establishing tools, playbooks, communication channels, and training before an incident occurs.
> 2. **Detection & Analysis:** Identifying signs of a compromise (alerts, anomalies) and validating if they represent a real security incident.
> 3. **Containment:** Limiting the damage and preventing the threat from spreading (e.g. isolating networks or disabling accounts).
> 4. **Eradication:** Removing the threat components, malware, or compromised keys from the environment.
> 5. **Recovery:** Restoring systems to normal operation, verifying clean backups, and verifying security guards are active.
> 6. **Post-Incident Activity (Lessons Learned):** Conducting a post-mortem to analyze the incident root cause and improve future preparation.

---

**Q2: How do you contain a compromised user account in a microservices system?**

> 1. **Invalidate Active Sessions:** Delete the session record from the shared session store (Redis) or add the active token's `jti` to the revoked token blacklist.
> 2. **Disable the User Account:** Update the user database status to `DISABLED` or `SUSPENDED` to reject subsequent authentication requests.
> 3. **Trigger Token Rotation:** Force revocation of all issued refresh tokens associated with that user.
> 4. **Terminate Network Connections:** In high-severity scenarios, temporarily terminate active WebSocket connections or force API Gateways to drop the user's IP.

---

**Q3: What is dwell time and why does it matter?**

> **Dwell Time** is the duration between an attacker's initial breach of a system and the moment the security team detects the compromise.
> **Why it matters:** The longer an attacker stays inside the network undetected (high dwell time), the more time they have to perform reconnaissance, escalate privileges, exfiltrate sensitive data, or install persistent backdoors, drastically increasing the financial and reputational damage of the breach.

---

**Q4: What should a post-incident review cover?**

> A post-incident review (post-mortem) should cover:
> 1. **Timeline of events:** Exactly when the compromise occurred, when it was detected, and when containment was achieved.
> 2. **Root Cause Analysis (RCA):** How the attacker gained access and why initial defenses failed.
> 3. **Incident Response Performance:** What went well, what bottlenecks delayed response, and where playbooks were missing.
> 4. **Remediation Plan:** A list of actionable tickets with clear owners to patch the vulnerability and improve detection.
> 5. **No Blame Culture:** Focus on systemic process improvements rather than human error.

---

**Q5: What is CVSS and how does it drive remediation SLAs?**

> **CVSS (Common Vulnerability Scoring System)** is a standardized framework for rating the severity of software vulnerabilities on a scale from 0.0 to 10.0.
> **Remediation SLAs:** Organizations map CVSS scores to response timelines:
> * **Critical (9.0 - 10.0):** Patch within 24 to 48 hours.
> * **High (7.0 - 8.9):** Patch within 14 to 30 days.
> * **Medium (4.0 - 6.9):** Patch within 60 to 90 days.
> * **Low (0.1 - 3.9):** Address as part of scheduled maintenance.

---

**Q6: What is the difference between vulnerability assessment and penetration testing?**

> * **Vulnerability Assessment:** A systematic, automated scan of the environment to discover and catalog known vulnerabilities (e.g. running Nessus or Qualys). It flags potential issues but does not attempt to exploit them.
> * **Penetration Testing:** A manual, goal-oriented security assessment where ethical hackers actively attempt to exploit vulnerabilities and chain them together to bypass security controls, simulating a real-world target breach.

---

**Q7: What security events should trigger an alert in your system?**

> High-priority events that require security alerts:
> 1. Multiple consecutive failed login attempts on a single account (brute-force).
> 2. Successful login from an unexpected geographical location or new device profile.
> 3. Creation of new administrative users or roles.
> 4. Modification of critical security groups, firewall rules, or DNS settings.
> 5. Large data export requests or mass database reads matching exfiltration profiles.
> 6. Execution of unauthorized system processes or shell commands in containers.

---

**Q8: How do you handle a situation where an AWS access key is committed to GitHub?**

> 1. **Immediate Revocation:** Delete or deactivate the key in AWS IAM Console. Do not wait to rewrite git history.
> 2. **Scan AWS CloudTrail:** Audit the logs for the compromised key ID to verify if it was used to perform any actions (e.g. launching EC2 instances or creating new IAM profiles).
> 3. **Purge Git History:** Run BFG Repo-Cleaner or `git-filter-repo` to delete the secret from all repository commits and push the rewritten history.
> 4. **Eradication Check:** Terminate any unauthorized instances or resources launched during the compromise window.

---

**Q9: What metrics would you track to measure the effectiveness of a security program?**

> Key Security Metrics:
> * **MTTD (Mean Time to Detect):** Average time taken to discover a security incident.
> * **MTTR (Mean Time to Respond/Contain):** Average time taken to mitigate a breach after detection.
> * **Vulnerability Remediation Time:** Average time to patch vulnerabilities relative to SLAs.
> * **Phishing Fail Rate:** Percentage of employees who click mock phishing links in simulations.
> * **Coverage metrics:** Percentage of codebases covered by active SAST/SCA scanners.

---

**Q10: What is threat hunting and how does it differ from reactive incident response?**

> * **Reactive Incident Response:** Triggered by alerts from security monitors (e.g., SIEM, antivirus, WAF). You respond only after a security tool flags an event.
> * **Threat Hunting:** A proactive, hypothesis-driven search through logs, endpoints, and networks to identify stealthy attackers or anomalies that bypassed automated security alerts. It assumes the network has already been breached and looks for hidden footprints.
