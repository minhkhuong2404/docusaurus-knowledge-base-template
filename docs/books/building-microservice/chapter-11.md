---
sidebar_position: 12
title: "Chapter 11: Security"
---

# Chapter 11: Security

**Part II — Implementation**

> Microservices create a larger attack surface than monoliths, but also more opportunity to defend in depth. This chapter covers the security principles and concrete practices every microservice team should know.

---

## The Security Paradox of Microservices

Microservices **increase** the attack surface: more services, more network calls, more credentials, more infrastructure to harden.

But they also **improve** security: smaller blast radius per service, ability to isolate sensitive services on restricted networks, and more granular access controls.

The outcome depends entirely on how you approach security.

---

## Core Security Principles

### Principle of Least Privilege

Grant every service, user, and component only the minimum permissions needed — and only for the time period needed.

- A read-only reporting service should only have `SELECT` on specific tables — never write access
- A service account for Service A should only be able to call Service B's specific endpoints — not everything
- Credentials should have short expiry times; rotate them regularly

### Defense in Depth

Don't rely on a single security layer. Build multiple overlapping controls:
- Network firewall
- Service-to-service mTLS
- API Gateway authentication
- Per-service authorization
- Data encryption at rest and in transit

Like a castle: multiple walls, a moat, a keep. Breach one layer and you still face others.

### Automation
Manually rotating secrets, patching libraries, and auditing access is error-prone and doesn't scale. Automate:
- Secret rotation (Vault, AWS Secrets Manager)
- Dependency scanning (OWASP Dependency Check, Snyk)
- Security policy enforcement (OPA, Kyverno)

---

## The Five Functions of Cybersecurity (NIST Framework)

| Function | Question | Example |
|---|---|---|
| **Identify** | What do we have? | Asset inventory, threat modeling |
| **Protect** | How do we prevent attacks? | Encryption, auth, patching |
| **Detect** | How do we know we're under attack? | Log monitoring, anomaly detection |
| **Respond** | What do we do during an attack? | Incident response runbook |
| **Recover** | How do we get back to normal? | Backups, runbook, communication plan |

Most teams invest heavily in *Protect*, under-invest in *Detect* and *Recover*. You will be breached eventually — plan for it.

---

## Credentials and Secrets Management

### Never Store Secrets in Code or Config Files
```java
// BAD — never do this
String dbPassword = "my-super-secret-password";

// BAD — also never do this
spring.datasource.password=my-super-secret-password  // in application.properties committed to Git
```

### Use a Secrets Manager
- **HashiCorp Vault** — full-featured secrets management
- **AWS Secrets Manager / Parameter Store** — managed AWS solution
- **Kubernetes Secrets** — built-in but stored base64 (not encrypted at rest by default; use Sealed Secrets or external-secrets operator)

**Spring Boot + AWS Secrets Manager:**
```yaml
# application.yml
spring:
  config:
    import: "aws-secretsmanager:/prod/order-service/"
```
Secrets are fetched from AWS at startup and injected as Spring properties. Never touch the file.

---

## Transport Security: HTTPS and mTLS

### External-Facing Services: HTTPS (TLS)
All traffic between clients (browsers, mobile apps) and your API Gateway must use TLS. Handle TLS termination at the load balancer or API Gateway.

### Internal Service-to-Service: Mutual TLS (mTLS)
In mTLS, **both sides** present certificates. This means:
- Service A proves its identity to Service B (not just the reverse)
- Network snooping yields encrypted, unreadable traffic
- A compromised service can't impersonate another

Managing certificates manually is painful. Use a **service mesh** (Istio, Linkerd) to handle mTLS automatically:
```yaml
# Istio PeerAuthentication — enforce mTLS for all services in namespace
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
```

---

## Authentication and Authorization

### Authentication: Who Are You?
Verify the identity of callers. The dominant pattern is **OAuth 2.0 + OpenID Connect (OIDC)** with a central Identity Provider (IdP).

Common IdPs: **Keycloak** (open-source), Auth0, AWS Cognito, Okta.

**Token flow:**
1. User authenticates with IdP → receives JWT access token
2. Client sends token in `Authorization: Bearer <token>` header
3. Service validates token (signature, expiry, audience)

### JWT Validation in Spring Security
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/orders").hasAuthority("SCOPE_orders:read")
                .requestMatchers(HttpMethod.POST, "/orders").hasAuthority("SCOPE_orders:write")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.decoder(jwtDecoder()))
            );
        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return JwtDecoders.fromIssuerLocation("https://idp.example.com/realms/myapp");
    }
}
```

### Authorization: What Can You Do?

Two models:

**Centralized (in the service):** Each service verifies the JWT's claims/scopes.

**Fine-grained (OPA — Open Policy Agent):** Complex authorization policies externalized to a policy engine. Services call OPA for authorization decisions.

```java
// Simple scope check
@PreAuthorize("hasAuthority('SCOPE_orders:write')")
public Order createOrder(CreateOrderRequest request) { ... }
```

### Service-to-Service Authentication
When Service A calls Service B, Service B needs to know it's talking to Service A (not an attacker who compromised the network).

Options:
1. **mTLS** — certificate identifies the calling service (infrastructure-level)
2. **Service account tokens** (Kubernetes) — each service gets a Kubernetes ServiceAccount token
3. **JWT service tokens** — Service A requests a token from the IdP scoped to call Service B

---

## Securing Data

### Encryption at Rest
Encrypt sensitive data in the database. Options:
- Database-level encryption (PostgreSQL `pgcrypto`, MySQL TDE)
- Application-level encryption (AES-256 before storing)
- Secrets/key management with Vault

```java
// Example: encrypt PII before storing
@Column(name = "card_number")
@Convert(converter = AesEncryptionConverter.class)
private String cardNumber;
```

### Encryption in Transit
Always TLS for any network traffic — even internal service-to-service calls.

### Data Minimization
Don't log or store data you don't need. PII in logs creates compliance and security risks.

```java
// Don't log sensitive fields
log.info("Processing payment for customerId={}", customerId);  // OK
log.info("Card number: {}", cardNumber);  // NEVER
```

---

## Summary

| Area | Best Practice |
|---|---|
| Secrets | Use Vault / AWS Secrets Manager; never commit to Git |
| Transport | HTTPS externally; mTLS internally (via service mesh) |
| Authentication | OAuth 2.0 + OIDC + JWT; validate at every service |
| Authorization | Principle of least privilege; scopes per service |
| Defense in depth | Network isolation + app auth + data encryption |
| Detect & Respond | Log security events; have an incident response plan |
