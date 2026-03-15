---
id: identity-access-management
title: Identity & Access Management (IAM)
sidebar_label: IAM
description: Identity and access management patterns including SSO, federated identity, directory services, service accounts, PAM, just-in-time access, and cloud IAM best practices for AWS and Kubernetes.
tags: [iam, sso, saml, ldap, service-accounts, pam, just-in-time-access, cloud-iam, aws-iam, kubernetes-rbac]
---

# Identity & Access Management (IAM)

> IAM answers: **who can access what, when, and how** — for both human users and machine identities.

---

## Identity Types

| Type | Description | Examples |
|---|---|---|
| **Human identity** | Individual users | Employees, contractors, customers |
| **Service identity** | Applications and services | Microservices, CI/CD pipelines |
| **Device identity** | Machines and endpoints | Servers, laptops, IoT devices |
| **Workload identity** | Cloud workloads | Lambda functions, K8s pods |

---

## Single Sign-On (SSO)

One login grants access to multiple applications.

### SAML 2.0 (Enterprise SSO)
```
User → App (Service Provider)
     → Redirect to IdP (Okta, Azure AD)
     → User authenticates at IdP
     → IdP sends signed XML assertion to App
     → App validates assertion → grants access
```

```java
// Spring Boot SAML 2.0
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
// Spring Boot OIDC SSO
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/public/**").permitAll()
            .anyRequest().authenticated()
        )
        .oauth2Login(oauth -> oauth
            .userInfoEndpoint(ui -> ui
                .userService(customOidcUserService()) // Map IdP claims to app roles
            )
            .successHandler(authSuccessHandler())
        )
        .build();
}

// Map Okta/Azure AD groups to Spring Security roles
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

---

## Directory Services (LDAP / Active Directory)

Central repository for user accounts and groups.

```java
// Spring Security LDAP authentication
@Configuration
public class LdapSecurityConfig {
    @Bean
    public AuthenticationManager authenticationManager(
            LdapAuthenticator authenticator,
            LdapAuthoritiesPopulator authoritiesPopulator) {
        LdapAuthenticationProvider provider =
            new LdapAuthenticationProvider(authenticator, authoritiesPopulator);
        return new ProviderManager(provider);
    }

    @Bean
    public LdapAuthenticator bindAuthenticator(BaseLdapPathContextSource ctx) {
        BindAuthenticator auth = new BindAuthenticator(ctx);
        auth.setUserDnPatterns(new String[]{"uid={0},ou=people,dc=example,dc=com"});
        return auth;
    }

    @Bean
    public LdapAuthoritiesPopulator authoritiesPopulator(BaseLdapPathContextSource ctx) {
        DefaultLdapAuthoritiesPopulator populator =
            new DefaultLdapAuthoritiesPopulator(ctx, "ou=groups,dc=example,dc=com");
        populator.setGroupRoleAttribute("cn");
        populator.setRolePrefix("ROLE_");
        return populator;
    }
}
```

---

## Service Accounts and Workload Identity

How services authenticate to other services.

### The Problem with Long-Lived Service Credentials
```
Approach: Give service a username/password or static API key
Problems:
  - Must be rotated manually
  - Credentials must be stored somewhere (secrets sprawl)
  - If leaked, attacker has permanent access
  - Hard to trace which service used the credential
```

### Kubernetes Service Accounts + IRSA (AWS)
```yaml
# K8s Service Account with AWS IAM role annotation
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-service
  namespace: production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/PaymentServiceRole

# Deployment uses the service account
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      serviceAccountName: payment-service
      # Pod receives temporary AWS credentials via OIDC — no static keys!
```

```java
// Java code uses default credential chain — picks up IRSA automatically
S3Client s3 = S3Client.builder()
    .region(Region.US_EAST_1)
    .credentialsProvider(DefaultCredentialsProvider.create()) // Auto-discovers
    .build();
```

### HashiCorp Vault Dynamic Secrets
```java
// Service fetches a temporary DB password from Vault (valid for 1 hour)
@Configuration
public class VaultDatabaseConfig {
    @Bean
    @VaultPropertySource(value = "database/creds/my-role", renewal = LeaseRenewal.ROTATE)
    public DataSource dataSource(
            @Value("${username}") String username,
            @Value("${password}") String password) {
        return DataSourceBuilder.create()
            .url(dbUrl)
            .username(username)   // Temporary, Vault-generated
            .password(password)   // Rotated automatically
            .build();
    }
}
// No static passwords! Vault generates unique DB user per lease.
```

---

## Privileged Access Management (PAM)

Control, audit, and time-limit privileged access.

### Just-In-Time (JIT) Access
```
Traditional: Admin always has production DB access (24/7)
JIT Model:
  Engineer requests access → Manager approves → Access granted for 4 hours
  → All actions logged → Access automatically revoked after 4 hours

Tools: CyberArk, BeyondTrust, HashiCorp Boundary, AWS IAM Identity Center
```

### Break-Glass (Emergency Access)
```
Highly sensitive, always-logged emergency access procedure:
  1. Incident declared
  2. Break-glass account used (requires 2-person authorization)
  3. Session recorded (video + keystrokes)
  4. Alert sent to security team + management
  5. Access auto-expires after incident
  6. Full audit review after incident
```

---

## AWS IAM Best Practices

```json
// Principle of least privilege — specific, not wildcard
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-uploads-bucket/*"
      // NOT "Resource": "*"
    }
  ]
}

// Service Control Policy — prevent privilege escalation
{
  "Effect": "Deny",
  "Action": [
    "iam:CreateUser",
    "iam:AttachUserPolicy",
    "iam:CreateAccessKey"
  ],
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "aws:PrincipalArn": "arn:aws:iam::123456789:role/BootstrapRole"
    }
  }
}
```

### IAM Anti-Patterns
| Anti-Pattern | Risk | Fix |
|---|---|---|
| Use root account | Single point of complete compromise | Never use root for day-to-day ops |
| Wildcard resource `*` | Over-privilege | Scope to specific resource ARNs |
| Long-lived access keys | Credential theft | Use roles + IRSA instead |
| Shared credentials | No attribution in audit | One identity per service/user |
| Admin role for CI/CD | Blast radius huge if pipeline compromised | Minimal permissions for pipeline role |

---

## Kubernetes RBAC

```yaml
# Role — what actions are allowed on what resources (namespace-scoped)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "watch", "list"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list"]

# RoleBinding — bind role to service account
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: monitoring-service
    namespace: monitoring
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

---

## Identity Federation

Allow users from one organization to access resources in another.

```
Cross-Account AWS Access:
  Account A (Production) → Account B (Tooling)
  Account B role trusts Account A role:

{
  "Principal": {
    "AWS": "arn:aws:iam::ACCOUNT_A:role/DeployRole"
  },
  "Action": "sts:AssumeRole"
}

// Java — assume cross-account role
StsClient sts = StsClient.create();
AssumeRoleResponse response = sts.assumeRole(r -> r
    .roleArn("arn:aws:iam::ACCOUNT_B:role/DeployRole")
    .roleSessionName("deployment-session")
    .durationSeconds(3600)
);
AwsSessionCredentials tempCreds = AwsSessionCredentials.create(
    response.credentials().accessKeyId(),
    response.credentials().secretAccessKey(),
    response.credentials().sessionToken()
);
```

---

## Interview Questions

1. What is Single Sign-On (SSO) and what protocols enable it?
2. What is the difference between SAML 2.0 and OIDC for SSO?
3. Why are long-lived service account credentials a security risk?
4. What is IRSA (IAM Roles for Service Accounts) and how does it work?
5. What is Just-In-Time access and why is it preferred over standing privilege?
6. What is the principle of least privilege and how do you apply it in AWS IAM?
7. What is a Service Control Policy (SCP) in AWS Organizations?
8. How does Kubernetes RBAC work?
9. What is HashiCorp Vault and what problems does it solve?
10. What is the difference between authentication delegation (OAuth) and identity federation (SAML)?
