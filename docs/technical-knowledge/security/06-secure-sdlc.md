---
id: secure-sdlc
title: Secure SDLC & DevSecOps
sidebar_label: Secure SDLC
description: Embedding security into the software development lifecycle — threat modeling, SAST, DAST, SCA, secrets scanning, container security, IaC scanning, and shift-left security practices.
tags: [devsecops, sdlc, threat-modeling, sast, dast, sca, secrets-scanning, container-security, shift-left]
---

# Secure SDLC & DevSecOps

> "Shift left" = find security issues **earlier** in the development process when they are cheaper to fix.

---

## The DevSecOps Pipeline

```
Code → Build → Test → Security Gate → Deploy → Monitor
 │       │       │          │             │          │
Dev     CI     Unit      SAST/SCA/     Staging    DAST
Tools  Tools   Tests     Secrets       Tests     Runtime
                         Scanning                 Protection
```

### Cost of Fixing Vulnerabilities
| Phase Found | Relative Cost |
|---|---|
| Design | 1× |
| Development | 6× |
| Testing | 15× |
| Production | 100× |

---

## Threat Modeling

Structured approach to identifying what can go wrong **before** you build.

### STRIDE Framework
| Threat | Description | Example |
|---|---|---|
| **S**poofing | Impersonating another user/service | Forged JWT, DNS spoofing |
| **T**ampering | Modifying data in transit/at rest | SQL injection, man-in-the-middle |
| **R**epudiation | Denying actions taken | No audit log, deletable logs |
| **I**nformation Disclosure | Exposing data to unauthorized parties | Error messages leak stack trace |
| **D**enial of Service | Making service unavailable | DDoS, resource exhaustion |
| **E**levation of Privilege | Gaining unauthorized permissions | IDOR, CSRF admin action |

### Threat Modeling Process (4 Steps)
```
1. DIAGRAM — Draw data flow diagram (DFD)
   - Trust boundaries (where data crosses security zones)
   - Data stores, processes, external entities, data flows

2. IDENTIFY — For each element, apply STRIDE
   "What can go wrong with this data flow?"

3. MITIGATE — For each threat, define control
   "How do we prevent / detect / respond to this?"

4. VALIDATE — Verify controls are implemented
   "Is the mitigation actually in place?"
```

### Example: Payment API Threat Model
```
Data Flow: Client → HTTPS → API Gateway → Payment Service → Payment Processor

Trust Boundary 1: Internet / DMZ
  Threat: Spoofing (forged requests) → Control: mTLS + JWT validation
  Threat: DDoS → Control: WAF + rate limiting

Trust Boundary 2: API Gateway / Internal
  Threat: Tampering (modify payment amount) → Control: Sign requests, audit log
  Threat: Info Disclosure (card data in logs) → Control: Log masking, PCI controls

Payment Processor Integration:
  Threat: SSRF → Control: allowlist payment processor domains only
  Threat: Repudiation → Control: Immutable audit log with timestamps
```

---

## SAST — Static Application Security Testing

Analyzes source code without executing it.

```yaml
# GitHub Actions — SAST pipeline
name: Security Scan
on: [push, pull_request]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # SpotBugs + Find Security Bugs (Java-specific SAST)
      - name: Run SpotBugs Security Analysis
        run: mvn spotbugs:check -Pspotbugs

      # SonarQube / SonarCloud
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=my-project
            -Dsonar.java.source=21
```

```xml
<!-- pom.xml — SpotBugs with Find Security Bugs plugin -->
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <version>4.8.0</version>
    <dependencies>
        <dependency>
            <groupId>com.h3xstream.findsecbugs</groupId>
            <artifactId>findsecbugs-plugin</artifactId>
            <version>1.12.0</version>
        </dependency>
    </dependencies>
    <configuration>
        <effort>Max</effort>
        <threshold>Low</threshold>
        <failOnError>true</failOnError>
    </configuration>
</plugin>
```

**Common Java vulnerabilities detected by Find Security Bugs:**
- SQL injection
- XSS via response output
- Hardcoded passwords
- Weak cryptography (MD5, DES)
- Insecure random (`java.util.Random`)
- Path traversal in file operations

---

## SCA — Software Composition Analysis

Scan dependencies for known CVEs.

```xml
<!-- Maven OWASP Dependency Check -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>9.0.7</version>
    <configuration>
        <failBuildOnCVSS>7.0</failBuildOnCVSS>  <!-- Fail on High (7.0+) -->
        <suppressionFiles>
            <suppressionFile>dependency-check-suppressions.xml</suppressionFile>
        </suppressionFiles>
    </configuration>
    <executions>
        <execution>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
</plugin>
```

```yaml
# GitHub Dependabot — auto-create PRs for dependency updates
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "maven"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      spring-dependencies:
        patterns: ["org.springframework*"]
    ignore:
      - dependency-name: "org.apache.logging.log4j:log4j-core"
        versions: ["[2.0, 2.17.0)"]  # Known vulnerable range
```

---

## Secrets Scanning

Prevent credentials being committed to source control.

```yaml
# pre-commit hook — blocks commit if secrets detected
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

# GitHub Actions — scan on PR
  - name: Gitleaks Secret Scan
    uses: gitleaks/gitleaks-action@v2
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Common Secret Patterns Detected
```
AWS Access Keys:     AKIA[0-9A-Z]{16}
Private Keys:        -----BEGIN RSA PRIVATE KEY-----
API Keys:            api_key\s*=\s*["'][0-9a-zA-Z]{32}["']
DB URLs:             postgres://user:PASSWORD@host
JWT Secrets:         jwt.secret\s*=\s*["'][^"']{8,}["']
```

### What to Do When Secrets Are Leaked
```
1. IMMEDIATELY rotate the secret (assume it's compromised)
2. Check access logs for unauthorized use
3. Remove from git history (git-filter-repo, BFG Repo Cleaner)
4. Notify affected parties (AWS, users) if needed
5. Post-mortem: how to prevent recurrence
```

---

## DAST — Dynamic Application Security Testing

Tests running application from outside (like an attacker would).

```yaml
# OWASP ZAP baseline scan in CI
  - name: ZAP Baseline Scan
    uses: zaproxy/action-baseline@v0.9.0
    with:
      target: 'https://staging.example.com'
      rules_file_name: '.zap/rules.tsv'
      cmd_options: '-a'  # Include alpha passive scan rules
```

**Common DAST findings:**
- Missing security headers (X-Frame-Options, CSP, HSTS)
- Exposed sensitive endpoints
- Cookie flags missing (HttpOnly, Secure)
- Information disclosure in error messages
- Active attacks: SQL injection, XSS probe

---

## Container Security

### Image Scanning
```yaml
# Trivy — scan Docker image for CVEs
  - name: Scan Docker image
    uses: aquasecurity/trivy-action@master
    with:
      image-ref: 'myapp:${{ github.sha }}'
      format: 'sarif'
      exit-code: '1'          # Fail build on CRITICAL/HIGH
      severity: 'CRITICAL,HIGH'
      ignore-unfixed: true    # Ignore CVEs with no fix available
```

### Dockerfile Security Hardening
```dockerfile
# ✅ Use minimal base image
FROM eclipse-temurin:21-jre-alpine  # Not full JDK, not Debian

# ✅ Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# ✅ Read-only filesystem
# (set in Kubernetes securityContext)

# ✅ No secrets in image layers
# Don't do: ENV API_KEY=secret123  ← Baked into image

# ✅ Minimal image — only what you need
COPY --from=builder /app/target/myapp.jar /app/myapp.jar
# Don't copy full source tree

# ✅ Signed image
# docker trust sign myapp:latest
```

### Kubernetes Security Context
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000

      containers:
        - name: app
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true    # Can't write to container FS
            capabilities:
              drop: ["ALL"]                  # Drop all Linux capabilities
              add: ["NET_BIND_SERVICE"]      # Only what's needed
          volumeMounts:
            - name: tmp-volume
              mountPath: /tmp              # Writeable tmp area
      volumes:
        - name: tmp-volume
          emptyDir: {}
```

---

## Infrastructure as Code (IaC) Security

```yaml
# Checkov — IaC security scanner (Terraform, CloudFormation, Kubernetes)
  - name: Checkov IaC Scan
    uses: bridgecrewio/checkov-action@master
    with:
      directory: terraform/
      framework: terraform
      check: CKV_AWS_*   # Only AWS checks
      soft_fail: false
```

**Common IaC security issues:**
- S3 bucket publicly readable
- Security group open to 0.0.0.0/0 on all ports
- RDS instance without encryption at rest
- IAM role with `*` resource permissions
- CloudTrail disabled

---

## Security Champions Program

Embed security culture in engineering teams.

```
Security Champion Role:
  - 1 per squad — developer with security interest
  - Attends security team meetings
  - First point of contact for squad's security questions
  - Reviews PRs for security implications
  - Runs threat modeling sessions for new features
  - Not a security expert — a security-aware developer
```

---

## Security Testing Checklist

### Pre-commit (Developer)
- [ ] No hardcoded secrets (pre-commit hooks)
- [ ] Dependencies up to date
- [ ] Input validation on all endpoints
- [ ] Authorization checked in new endpoints

### CI Pipeline (Automated)
- [ ] SAST scan (SpotBugs + Find Security Bugs)
- [ ] SCA scan (OWASP Dependency Check)
- [ ] Secrets scan (Gitleaks)
- [ ] Container scan (Trivy)
- [ ] IaC scan (Checkov)

### Pre-release (Manual)
- [ ] Threat model reviewed for new features
- [ ] DAST scan against staging environment
- [ ] Penetration test (major releases)
- [ ] Security review of authentication/authorization changes

---

## Interview Questions

1. What is "shift left" in security and why does it matter?
2. What is the difference between SAST and DAST?
3. What is SCA and what does it detect?
4. What is threat modeling? Describe the STRIDE framework.
5. How do you prevent secrets from being committed to git?
6. What should a secure Dockerfile look like?
7. How do you scan Docker container images for vulnerabilities in a CI pipeline?
8. What is a Security Champion and why is this role valuable?
9. If a secret is accidentally committed to a public GitHub repo, what do you do?
10. What IaC security checks should run on every Terraform plan?
