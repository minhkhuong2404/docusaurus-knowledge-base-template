---
id: secure-sdlc
title: Secure SDLC & DevSecOps
sidebar_label: Secure SDLC
description: Embedding security into the software development lifecycle — threat modeling, SAST, DAST, SCA, secrets scanning, container security, and shift-left security practices for Java/Spring teams.
tags: [devsecops, sdlc, threat-modeling, sast, dast, sca, secrets-scanning, container-security, shift-left, java]
---

# Secure SDLC & DevSecOps

> "Shift left" = find security issues **earlier** in development, when they are far cheaper to fix.

---

## Cost of Fixing Vulnerabilities

| Phase Found | Relative Cost |
|---|---|
| Design | 1× |
| Development | 6× |
| Testing | 15× |
| Production | **100×** |

---

## The DevSecOps Pipeline

```
Code → Build → Test → Security Gate → Deploy → Monitor
 │       │       │           │            │         │
Dev    CI/CD   Unit    SAST/SCA/Secrets  Staging  DAST/
Tools  Tools   Tests    Scanning + IaC   Tests   Runtime
```

---

## Threat Modeling — STRIDE

| Threat | Description | Example |
|---|---|---|
| **S**poofing | Impersonating another user/service | Forged JWT, DNS spoofing |
| **T**ampering | Modifying data in transit/at rest | SQL injection, MITM |
| **R**epudiation | Denying actions taken | No audit log |
| **I**nformation Disclosure | Exposing unauthorized data | Error messages leak stack trace |
| **D**enial of Service | Making service unavailable | DDoS, resource exhaustion |
| **E**levation of Privilege | Gaining unauthorized permissions | IDOR, CSRF admin action |

### Threat Modeling Process

```
1. DIAGRAM — draw data flow diagram (DFD) with trust boundaries
2. IDENTIFY — for each data flow, apply STRIDE ("what can go wrong?")
3. MITIGATE — define control for each threat
4. VALIDATE — verify controls are implemented before release
```

---

## SAST — Static Application Security Testing

Analyzes source code without executing it.

```yaml
# GitHub Actions — SAST
name: Security Scan
on: [push, pull_request]
jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run SpotBugs + Find Security Bugs
        run: mvn spotbugs:check -Pspotbugs

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

```xml
<!-- pom.xml — SpotBugs + Find Security Bugs -->
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

**Common Java issues detected by Find Security Bugs:** SQL injection, XSS via output, hardcoded passwords, weak crypto (MD5, DES), insecure random (`java.util.Random`), path traversal.

---

## SCA — Software Composition Analysis

Scan dependencies for known CVEs.

```xml
<!-- OWASP Dependency Check -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>9.0.7</version>
    <configuration>
        <failBuildOnCVSS>7.0</failBuildOnCVSS>  <!-- Fail on High+ -->
    </configuration>
</plugin>
```

```yaml
# Dependabot — auto PRs for dependency updates
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "maven"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## Secrets Scanning

```yaml
# pre-commit hook — blocks commit if secrets detected
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

# GitHub Actions
  - name: Gitleaks Secret Scan
    uses: gitleaks/gitleaks-action@v2
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### When a Secret Is Leaked to Git

```
1. IMMEDIATELY rotate the credential (assume compromised)
2. Check access logs for unauthorized use
3. Remove from git history: git-filter-repo or BFG Repo Cleaner
4. Notify affected parties (AWS, users) if needed
5. Post-mortem: add pre-commit hooks, secrets scanning to CI
```

---

## Container Security

```yaml
# Trivy — scan Docker image in CI
  - name: Scan Docker image
    uses: aquasecurity/trivy-action@master
    with:
      image-ref: 'myapp:${{ github.sha }}'
      exit-code: '1'
      severity: 'CRITICAL,HIGH'
```

```dockerfile
# Secure Dockerfile
FROM eclipse-temurin:21-jre-alpine  # Minimal base — not full JDK

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser                        # Non-root user

COPY --from=builder /app/target/myapp.jar /app/myapp.jar
# Never: ENV API_KEY=secret123       ← Baked into image layers
```

```yaml
# Kubernetes security context
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
```

---

## IaC Security Scanning

```yaml
# Checkov — scan Terraform, CloudFormation, Kubernetes
  - name: Checkov IaC Scan
    uses: bridgecrewio/checkov-action@master
    with:
      directory: terraform/
      framework: terraform
```

**Common IaC findings:** S3 bucket publicly readable, security group open 0.0.0.0/0, RDS without encryption at rest, IAM wildcard permissions, CloudTrail disabled.

---

## Security Testing Checklist

### Pre-Commit (Developer)
- [ ] No hardcoded secrets (pre-commit Gitleaks hook)
- [ ] Dependencies up to date
- [ ] Input validation on all new endpoints
- [ ] Authorization checked in new endpoints

### CI Pipeline (Automated)
- [ ] SAST (SpotBugs + Find Security Bugs)
- [ ] SCA (OWASP Dependency Check)
- [ ] Secrets scan (Gitleaks)
- [ ] Container image scan (Trivy)
- [ ] IaC scan (Checkov)

### Pre-Release (Manual)
- [ ] Threat model reviewed for new features
- [ ] DAST scan against staging (OWASP ZAP)
- [ ] Penetration test (major releases)
- [ ] Security review of AuthN/AuthZ changes

---

## Interview Questions

1. What is "shift left" in security and why does it matter?
2. What is the difference between SAST and DAST?
3. What is SCA and what does it detect?
4. What is threat modeling? Describe the STRIDE framework.
5. How do you prevent secrets from being committed to git?
6. What should a secure Dockerfile look like?
7. How do you scan Docker container images for vulnerabilities in CI?
8. If a secret is accidentally committed to a public GitHub repo, what do you do immediately?
9. What IaC security checks should run on every Terraform plan?
10. What is a Security Champion and why is this role valuable?
