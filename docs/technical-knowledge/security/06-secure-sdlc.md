---
id: secure-sdlc
title: Secure SDLC & DevSecOps
sidebar_label: Secure SDLC
description: Embedding security into the software development lifecycle — threat modeling, SAST, DAST, SCA, secrets scanning, container security, and shift-left security practices for Java/Spring teams.
tags: [devsecops, sdlc, threat-modeling, sast, dast, sca, secrets-scanning, container-security, shift-left, java]
---

# Secure SDLC & DevSecOps

import DevSecOpsPipelineDiagram from '@site/src/components/DevSecOpsPipelineDiagram';


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

<DevSecOpsPipelineDiagram />

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

**Q1: What is "shift left" in security and why does it matter?**

> **"Shift Left"** means introducing security processes, checks, and considerations earlier in the software development lifecycle (SDLC) (e.g., during design, threat modeling, and coding) rather than waiting until coding is finished or during deployment.
> **Why it matters:** Fixing a security vulnerability in production or during deployment can cost up to 100x more than catching and fixing it during the initial design or writing stage.

---

**Q2: What is the difference between SAST and DAST?**

> * **SAST (Static Application Security Testing):** Analyzes the raw application source code, configuration files, or compiled binaries at rest without executing the code. It checks for structural issues like SQLi, weak crypto, or hardcoded credentials. It is fast but can suffer from high false-positive rates.
> * **DAST (Dynamic Application Security Testing):** Tests a running application from the outside, acting like a black-box attacker (e.g. scanning staging endpoints using OWASP ZAP). It intercepts inputs, flags issues like missing secure headers, active cross-site scripting paths, or SQL injection responses. It has a low false-positive rate but is slow and runs later in the SDLC.

---

**Q3: What is SCA and what does it detect?**

> **SCA (Software Composition Analysis):** Scans the project's third-party open-source dependencies (e.g. Maven, NPM, Gradle packages) against databases of known public vulnerabilities (like the National Vulnerability Database - NVD). It detects:
> 1. Outdated dependencies with known CVEs (e.g., Log4Shell).
> 2. License compliance risks (e.g. GPL copyleft licenses).
> 3. Transitive dependency vulnerabilities.

---

**Q4: What is threat modeling? Describe the STRIDE framework.**

> **Threat Modeling** is a structured engineering process for identifying potential security threats, vulnerabilities, and mitigations during the application design phase.
> **STRIDE Framework:**
> * **S - Spoofing:** Pretending to be someone else (mitigation: strong AuthN).
> * **T - Tampering:** Modifying data on disk or in transit (mitigation: integrity signatures, TLS).
> * **R - Repudiation:** Denying performing an action (mitigation: non-repudiation, secure audit logging).
> * **I - Information Disclosure:** Leaking private data (mitigation: encryption, ACLs).
> * **D - Denial of Service:** Crashing the server (mitigation: rate limits, firewalls).
> * **E - Elevation of Privilege:** Gaining unauthorized admin access (mitigation: strict AuthZ).

---

**Q5: How do you prevent secrets from being committed to git?**

> 1. **Client-side Git Hooks:** Run local pre-commit hooks (using tools like `gitleaks` or `trufflehog`) to scan local code changes for API keys, private keys, or passwords before allowing commits.
> 2. **Environment Configuration:** Enforce the use of `.env` files or environment variables; add all `.env` and credential files to the global `.gitignore`.
> 3. **Centralized Secret Manager:** Inject secrets at runtime using AWS Secrets Manager, HashiCorp Vault, or Spring Cloud Config Server rather than hardcoding.
> 4. **CI Secret Scanner:** Configure a blocker check in CI (e.g. GitHub secret scanning) that fails builds if secrets are pushed in commits.

---

**Q6: What should a secure Dockerfile look like?**

> A secure Dockerfile should follow these rules:
> 1. **Use Minimal Base Images:** Use distroless or Alpine base images to minimize the system attack surface.
> 2. **Run as Non-Root User:** Never run applications as the `root` user inside the container. Define a custom `USER` (e.g. `USER appuser`).
> 3. **Multi-Stage Builds:** Separate build dependencies from runtime dependencies to keep the final image size small.
> 4. **Pin Versions:** Specify explicit tags instead of `latest` (e.g., `eclipse-temurin:21-jre-alpine`).
> 5. **Read-only Filesystem:** Configure container runtimes to run with a read-only root filesystem where possible.

---

**Q7: How do you scan Docker container images for vulnerabilities in CI?**

> In the CI pipeline, add a container image scanning step using tools like **Trivy**, **Grype**, or **Snyk**. These tools inspect the built image layers, examine the installed OS packages (Alpine/Debian libraries) and application dependency files, and map them against vulnerability databases. The pipeline can be configured to fail the build if any Critical or High severity vulnerabilities are detected.

---

**Q8: If a secret is accidentally committed to a public GitHub repo, what do you do immediately?**

> 1. **Revoke Immediately:** Assume the secret is compromised instantly. Deactivate, delete, or rotate the key at the provider (AWS, Stripe, database).
> 2. **Purge History:** Use `git-filter-repo` or BFG Repo-Cleaner to rewrite the repository history, purging the secret completely from all commits, tags, and branches. A simple `git rm` is insufficient as the secret remains accessible in Git history.
> 3. **Audit Access Logs:** Review API and access logs for the compromised key to determine if it was exploited before revocation.

---

**Q9: What IaC security checks should run on every Terraform plan?**

> Configure static analysis tools like **TFLint**, **Checkov**, or **tfsec** to run on every commit or pull request. These scan IaC configurations to detect:
> * Publicly accessible S3 buckets.
> * Security groups allowing wildcard ingress (`0.0.0.0/0` on port 22).
> * Unencrypted database storage volumes.
> * Missing audit log settings.

---

**Q10: What is a Security Champion and why is this role valuable?**

> A Security Champion is a developer or engineer inside a product squad who acts as a liaison between the core Security Team and the development team.
> **Why valuable:** They embed security practices directly into daily development cycles, guide threat modeling during feature design, and help squads resolve security vulnerabilities, removing the bottleneck of relying solely on a separate, centralized security department.
