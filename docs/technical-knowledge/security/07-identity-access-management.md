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

1. What is Single Sign-On (SSO) and what protocols enable it?
2. What is the difference between SAML 2.0 and OIDC for SSO?
3. Why are long-lived service account credentials a security risk?
4. What is IRSA (IAM Roles for Service Accounts) and how does it work?
5. What is Just-In-Time access and why is it preferred over standing privilege?
6. What is the principle of least privilege and how do you apply it in AWS IAM?
7. What is HashiCorp Vault and what problems does it solve?
8. How does Kubernetes RBAC work?
9. How do you secure sensitive configuration (DB passwords, API keys) in a Spring Boot microservice?
10. What is the difference between OAuth 2.0 delegation and SAML federation?
