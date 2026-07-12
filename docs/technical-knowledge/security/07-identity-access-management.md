---
id: identity-access-management
title: Identity & Access Management (IAM)
sidebar_label: IAM
description: SSO, federated identity, directory services, service accounts, PAM, just-in-time access, and cloud IAM best practices for AWS and Kubernetes — for Java/Spring engineers.
tags: [iam, sso, saml, oidc, ldap, service-accounts, pam, just-in-time, cloud-iam, aws-iam, kubernetes-rbac, vault]
---

# Identity & Access Management (IAM)

> IAM answers: **who can access what, when, and how** — for both humans and machine identities.

---

## Single Sign-On (SSO)

One login grants access to multiple applications.

### SAML 2.0 (Enterprise)

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
        .saml2Login(saml -> saml
            .relyingPartyRegistrationRepository(relyingPartyRegistrations())
        )
        .saml2Logout(Customizer.withDefaults())
        .build();
}

@Bean
public RelyingPartyRegistrationRepository relyingPartyRegistrations() {
    RelyingPartyRegistration registration = RelyingPartyRegistrations
        .fromMetadataLocation("https://okta.com/app/metadata")
        .registrationId("okta")
        .entityId("https://myapp.example.com/saml")
        .build();
    return new InMemoryRelyingPartyRegistrationRepository(registration);
}
```

### OIDC SSO (Modern)

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .oauth2Login(oauth -> oauth
            .userInfoEndpoint(ui -> ui
                .userService(customOidcUserService())
            )
        )
        .build();
}

// Map IdP groups (Okta, Azure AD) to Spring Security roles
@Service
public class CustomOidcUserService extends OidcUserService {
    @Override
    public OidcUser loadUser(OidcUserRequest request) {
        OidcUser user = super.loadUser(request);
        List<GrantedAuthority> authorities = mapGroupsToRoles(
            user.getClaimAsStringList("groups")
        );
        return new DefaultOidcUser(authorities, user.getIdToken(), user.getUserInfo());
    }
}
```

### SAML 2.0 vs OIDC

| | SAML 2.0 | OIDC |
|---|---|---|
| Format | XML assertions | JSON / JWT |
| Use | Enterprise SSO, legacy systems | Modern web/mobile apps |
| Complexity | High | Lower |
| Supports SPA/mobile | Poorly | Yes (Authorization Code + PKCE) |

---

## Service Accounts & Workload Identity

### The Problem with Static Credentials

```
Static API key → must be stored somewhere → secrets sprawl
               → must be rotated manually → often not rotated
               → if leaked → permanent access until revoked
```

### Kubernetes IRSA (IAM Roles for Service Accounts — AWS)

```yaml
# Service Account annotated with IAM Role ARN
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-service
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/PaymentServiceRole
```

```java
// Java SDK automatically picks up temporary IRSA credentials — no static keys
S3Client s3 = S3Client.builder()
    .region(Region.US_EAST_1)
    .credentialsProvider(DefaultCredentialsProvider.create())
    .build();
```

### HashiCorp Vault Dynamic Secrets

```java
// Service fetches temporary DB credentials from Vault (valid 1 hour)
@Bean
@VaultPropertySource(value = "database/creds/my-role", renewal = LeaseRenewal.ROTATE)
public DataSource dataSource(
        @Value("${username}") String username,
        @Value("${password}") String password) {
    return DataSourceBuilder.create()
        .url(dbUrl)
        .username(username)  // Unique per lease, auto-rotated
        .password(password)
        .build();
}
```

---

## Just-In-Time (JIT) Access

```
Traditional: Admin always has production DB access (24/7 standing privilege)

JIT Model:
  Engineer requests access → Manager approves (Slack/PagerDuty)
  → Access granted for 4 hours → All actions logged
  → Access automatically revoked after 4 hours

Tools: CyberArk, HashiCorp Boundary, AWS IAM Identity Center
```

---

## AWS IAM Best Practices

```json
// Least privilege — specific resource ARNs, not wildcard
{
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::my-uploads-bucket/*"
  }]
}
```

### IAM Anti-Patterns

| Anti-Pattern | Risk | Fix |
|---|---|---|
| Use root account daily | Complete account compromise | Never use root for ops |
| Wildcard `"Resource": "*"` | Over-privilege | Scope to specific ARNs |
| Long-lived access keys | Credential theft | Use IAM roles + IRSA |
| Shared credentials | No audit trail | One identity per service |
| Admin role for CI/CD | Full blast radius if pipeline breached | Minimal permissions |

---

## Kubernetes RBAC

```yaml
# Role — what actions on what resources (namespace-scoped)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "watch", "list"]

# RoleBinding — bind to service account
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-binding
subjects:
  - kind: ServiceAccount
    name: monitoring-service
    namespace: monitoring
roleRef:
  kind: Role
  name: pod-reader
```

---

## Interview Questions

**Q1: What is Single Sign-On (SSO) and what protocols enable it?**

> **Single Sign-On (SSO)** is an authentication mechanism that allows a user to authenticate once and gain access to multiple independent applications without re-entering credentials.
> **Protocols:**
> 1. **OIDC (OpenID Connect):** Modern, lightweight protocol built on OAuth 2.0. Uses JSON Web Tokens (JWT) to exchange identity information. Ideal for web and mobile applications.
> 2. **SAML 2.0 (Security Assertion Markup Language):** Legacy, XML-based enterprise protocol. Widely used for enterprise SaaS integrations.

---

**Q2: What is the difference between SAML 2.0 and OIDC for SSO?**

> * **SAML 2.0:** Uses XML schemas for exchanging assertion data. Heavily reliant on browser redirects via POST requests containing signed XML. It is complex, verbose, and difficult to use in native mobile applications.
> * **OIDC:** Built on JSON and HTTP REST principles. It utilizes the OAuth 2.0 flow to issue an `id_token` (JWT format), which is easily parsed by SPAs and native mobile apps. It is simpler to implement and much more resource-efficient.

---

**Q3: Why are long-lived service account credentials a security risk?**

> Long-lived service credentials (like permanent AWS IAM Access Keys or database root credentials stored in config files):
> 1. **No Expiry:** If leaked or committed to Git, they provide indefinite, unmonitored access to the target infrastructure until manually rotated or revoked.
> 2. **Lack of Visibility:** Because they don't expire, organizations often lose track of who is using them, making rotation risky due to fear of breaking legacy systems.
> **Mitigation:** Use short-lived, dynamically generated, or federated credentials (such as AWS STS, GCP Workload Identity, or HashiCorp Vault dynamic database roles).

---

**Q4: What is IRSA (IAM Roles for Service Accounts) and how does it work?**

> **IRSA** is an AWS EKS feature that allows Kubernetes Pods to assume AWS IAM roles directly, achieving fine-grained permission control:
> 1. EKS acts as an OIDC identity provider.
> 2. You associate a Kubernetes ServiceAccount with an AWS IAM Role via annotations.
> 3. EKS mounts an OIDC token into the Pod.
> 4. The AWS SDK in the Pod automatically uses the token to call AWS STS (`AssumeRoleWithWebIdentity`), receiving temporary AWS credentials. This eliminates the need to attach broad node-level permissions or hardcode static credentials inside container images.

---

**Q5: What is Just-In-Time access and why is it preferred over standing privilege?**

> **Just-In-Time (JIT) Access** grants elevated privileges (like database write or admin portal access) only when requested, and automatically revokes them after a set time limit (e.g., 2 hours).
> **Why preferred:** It eliminates "standing privileges" (having admin rights permanently). This dramatically reduces the attack surface: if a developer's credentials are stolen, they only yield standard low-privilege rights unless active JIT escalation is triggered and approved, limiting potential damage.

---

**Q6: What is the principle of least privilege and how do you apply it in AWS IAM?**

> **Least Privilege** states that a user or system process must only be granted the minimum permissions required to perform its task, and no more.
> **Application in AWS IAM:**
> * Avoid wildcard actions (e.g., `s3:*` on `*`). Specify precise APIs (`s3:GetObject`, `s3:PutObject`).
> * Define tight resource scope boundaries (e.g., limit S3 actions to `arn:aws:s3:::my-app-bucket/*` instead of `*`).
> * Use Condition blocks (e.g., restrict API execution to a specific VPC endpoint or IP CIDR range).

---

**Q7: What is HashiCorp Vault and what problems does it solve?**

> HashiCorp Vault is a centralized secrets management system. It solves:
> 1. **Secret Sprawl:** Keeps secrets out of application code, config files, and environment variables.
> 2. **Static Credentials Risk:** Generates **dynamic secrets** on the fly (e.g., creating a database user that expires after 1 hour).
> 3. **Data Encryption:** Provides encryption-as-a-service, allowing applications to encrypt data without handling raw encryption keys.
> 4. **Detailed Audit Trails:** Logs every request to view or edit secrets.

---

**Q8: How does Kubernetes RBAC work?**

> Kubernetes RBAC manages authorization within a cluster using four primary API resources:
> * **Role:** Defines a set of permissions (rules) indicating what actions (verbs: `get`, `list`, `create`) can be performed on which resources (nouns: `pods`, `services`) within a **specific namespace**.
> * **ClusterRole:** Same as Role, but applies **cluster-wide** (governing cluster nodes, namespaces, or persistent volumes).
> * **RoleBinding:** Assigns a Role's permissions to a subject (User, Group, or ServiceAccount) within a namespace.
> * **ClusterRoleBinding:** Binds a ClusterRole's permissions cluster-wide to a subject.

---

**Q9: How do you secure sensitive configuration (DB passwords, API keys) in a Spring Boot microservice?**

> 1. **Externalize Secrets:** Never hardcode secrets in `application.yml`. Use placeholders like `spring.datasource.password=${DB_PASSWORD}`.
> 2. **Config Servers:** Load configuration properties dynamically from a secure central server (e.g., Spring Cloud Config Server integrated with HashiCorp Vault or AWS Secrets Manager).
> 3. **Kubernetes Secrets:** In Kubernetes, map secrets to environment variables or mount them as files inside the container memory.
> 4. **Encryption:** Use Jasypt to encrypt database passwords directly inside the property files, passing the decryption key at application startup (`-Djasypt.encryptor.password=...`).

---

**Q10: What is the difference between OAuth 2.0 delegation and SAML federation?**

> * **OAuth 2.0 Delegation:** Grants a third-party application limited access to a user's API resources (e.g. "Let this scheduling app read my Google Calendar events") using an access token, without giving the app the user's password.
> * **SAML Federation:** Focuses on cross-domain single sign-on (SSO). It allows a user to authenticate at an Identity Provider (IdP) and access applications at a Service Provider (SP) (e.g., "Log in using corporate Okta to access Slack"). It shares identity assertions rather than API delegation tokens.
