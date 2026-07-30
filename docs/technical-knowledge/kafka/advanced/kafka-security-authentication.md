---
id: kafka-security-authentication
title: Kafka Authentication — SASL, SSL & OAuth
sidebar_label: Authentication (SASL/SSL/OAuth)
description: Configure Kafka authentication with SASL/PLAIN, SCRAM-SHA-512, GSSAPI (Kerberos), mTLS, and OAuth 2.0. Understand how KRaft mode affects credential management.
tags:
- technical-knowledge
- kafka
- advanced
- security
- authentication
---

# Kafka Authentication: SASL, SSL, and OAuth

Securing Apache Kafka clusters is critical for any production deployment. Authentication ensures that only authorized clients and services can access your data streams. Kafka supports multiple authentication mechanisms, each with distinct characteristics optimized for different deployment patterns.

Modern Kafka 4.0+ deployments support: **SASL/PLAIN**, **SASL/SCRAM-SHA-512**, **SASL/GSSAPI (Kerberos)**, **SASL/OAUTHBEARER**, and **SSL/TLS mutual certificate auth (mTLS)**.

---

## Why Authentication Matters

Without proper authentication, any client could connect to your cluster, publish malicious data, or consume confidential information. Authentication answers the fundamental question: **"Who are you?"** It works alongside:

- **Encryption** — protects data in transit
- **Authorization (ACLs)** — controls what authenticated users can do
- **Audit logging** — records who accessed what and when

In regulated industries (finance, healthcare), authentication is non-negotiable. Compliance frameworks such as **GDPR**, **HIPAA**, and **SOC 2** require proof that only identified entities access data systems.

---

## SASL Authentication

SASL (Simple Authentication and Security Layer) is a framework that separates authentication mechanisms from application protocols. Kafka supports four SASL mechanisms.

### SASL/PLAIN

The simplest mechanism — transmits username and password in cleartext. Always combine with SSL/TLS encryption.

```properties
# Client (producer/consumer)
security.protocol=SASL_SSL
sasl.mechanism=PLAIN
sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required \
  username="producer-app" \
  password="secure-password";
```

✅ Good for: development, testing, or when integrated with external secret rotation systems.  
❌ Never use without TLS in production.

---

### SASL/SCRAM (SHA-256 / SHA-512)

SCRAM (Salted Challenge Response Authentication Mechanism) avoids transmitting passwords over the network. Instead, it uses a cryptographic challenge-response protocol — the client proves knowledge of the password without revealing it.

**Kafka 4.0+ / KRaft mode**: SCRAM credentials are stored in the cluster's `__cluster_metadata` log (previously ZooKeeper, which was removed in Kafka 4.0). This centralized management makes SCRAM ideal for multi-tenant environments.

```properties
# Broker configuration
sasl.enabled.mechanisms=SCRAM-SHA-512
sasl.mechanism.inter.broker.protocol=SCRAM-SHA-512
# In KRaft mode, credentials are stored in metadata log automatically
```

Create credentials in KRaft mode:

```bash
kafka-configs --bootstrap-server localhost:9092 \
  --alter --add-config 'SCRAM-SHA-512=[password=secure-password]' \
  --entity-type users --entity-name producer-app
```

✅ **Recommended for most production deployments** — strong security with manageable operations.

---

### SASL/GSSAPI (Kerberos)

For enterprise environments with existing Active Directory or Kerberos infrastructure. Clients authenticate using Kerberos tickets rather than passwords, enabling single sign-on (SSO).

Requires: Key Distribution Center (KDC), proper DNS configuration, synchronized clocks. High complexity — best suited for large organizations with dedicated identity teams.

---

### SASL/OAUTHBEARER

Enables Kafka to validate **OAuth 2.0 bearer tokens (JWTs)**, bridging traditional Kafka auth with modern cloud-native identity providers (Keycloak, Okta, Azure AD, AWS Cognito).

```properties
# Client configuration
security.protocol=SASL_SSL
sasl.mechanism=OAUTHBEARER
sasl.jaas.config=org.apache.kafka.common.security.oauthbearer.OAuthBearerLoginModule required \
  clientId="kafka-client" \
  clientSecret="client-secret" \
  scope="kafka.cluster" \
  tokenEndpointUri="https://identity-provider.com/oauth2/token";

# Broker token validation
sasl.enabled.mechanisms=OAUTHBEARER
listener.name.sasl_ssl.oauthbearer.sasl.server.callback.handler.class=\
  org.apache.kafka.common.security.oauthbearer.secured.OAuthBearerValidatorCallbackHandler
listener.name.sasl_ssl.oauthbearer.sasl.jwks.endpoint.url=\
  https://identity-provider.com/.well-known/jwks.json
```

---

## SSL/TLS Certificate-Based Authentication (mTLS)

SSL/TLS serves dual purposes in Kafka:
1. **Encrypting network traffic**
2. **Authenticating clients** through mutual TLS (mTLS)

With mTLS, both the broker and client present certificates to verify their identities — eliminating password management entirely.

### How mTLS Works

1. Broker presents its certificate → client validates against its trust store
2. Client presents its certificate → broker validates and extracts the principal (identity)
3. Encrypted connection is established if both sides pass validation

```properties
# Client mTLS configuration
security.protocol=SSL
ssl.keystore.location=/var/private/ssl/client.keystore.jks
ssl.keystore.password=keystore-password
ssl.key.password=key-password
ssl.truststore.location=/var/private/ssl/client.truststore.jks
ssl.truststore.password=truststore-password
```

Modern automation tools — **cert-manager** (Kubernetes), **HashiCorp Vault**, **AWS Certificate Manager** — dramatically reduce the operational burden of mTLS at scale.

✅ Excellent for: Kubernetes, container platforms, zero-trust architectures.

---

## OAuth 2.0 Flow in Kafka

When a producer or consumer connects to Kafka with OAuth:

```
Client                 Identity Provider          Kafka Broker
  │                          │                        │
  │── Request token ─────────►│                        │
  │◄── JWT access token ──────│                        │
  │                          │                        │
  │── Connect with JWT ───────────────────────────────►│
  │                          │                        │
  │                          │  Validate JWT signature │
  │                          │  (via JWKS endpoint)    │
  │                          │  Check expiry/audience  │
  │                          │  Extract principal      │
  │◄── Authorized ────────────────────────────────────│
```

1. **Token Acquisition** — Client authenticates with IdP using client credentials, gets a JWT
2. **Connection with Token** — JWT sent to broker via SASL/OAUTHBEARER handshake
3. **Token Validation** — Broker verifies signature (JWKS), checks expiry, validates audience/issuer/scopes
4. **Principal Extraction** — Identity extracted from token's `sub` claim
5. **Authorization** — Kafka ACLs evaluated based on extracted principal

Tokens typically expire after **15–60 minutes**. Clients auto-refresh without service interruption.

OAuth shines in **microservices architectures** where services already authenticate with an IdP for other APIs. Modern service meshes like Istio can automate token acquisition and rotation.

---

## Choosing the Right Authentication Method

| Method | Best For | Complexity | Key Benefit | Kafka 4.0+ Notes |
|--------|----------|------------|-------------|------------------|
| SASL/PLAIN | Development, testing | Low | Simplicity | Use only with TLS |
| SASL/SCRAM-SHA-512 | Multi-tenant production | Medium | Centralized creds in KRaft metadata | ✅ **Recommended** |
| SASL/GSSAPI | Enterprise with Kerberos | High | SSO integration | Mature, well-supported |
| SSL/TLS (mTLS) | Container platforms, service mesh | Medium-High | No password management | Zero-trust architectures |
| OAuth 2.0 | Cloud-native, microservices | Medium | Token-based, time-limited access | **Growing adoption** |

**Common pattern**: Development uses SASL/PLAIN, production uses SCRAM-SHA-512, OAuth, or mTLS.

---

## Authentication Across the Streaming Ecosystem

Authentication extends beyond broker connections. Every component must authenticate:

| Component | Authentication Need |
|-----------|---------------------|
| **Kafka Connect** | Connectors authenticate to brokers |
| **Schema Registry** | Requires auth to verify client identity |
| **ksqlDB** | Queries run under authenticated principals |
| **Kafka Streams / Flink** | Applications authenticate as service accounts |
| **Admin tools** | Need strong auth to prevent unauthorized changes |

---

## KRaft Mode Impact on Authentication

In **Kafka 4.0+ with KRaft mode** (ZooKeeper is removed):

- **SCRAM credentials** are stored in `__cluster_metadata` topic (formerly ZooKeeper)
- **ACL storage** moves to the KRaft metadata log — faster propagation (ms vs seconds)
- **Controller role** is handled by KRaft quorum nodes — no external cluster to manage
- All auth mechanisms (SCRAM, OAuth, mTLS) are fully supported in KRaft

---

## Interview Questions

**Q: What's the difference between SASL/PLAIN and SASL/SCRAM?**

> SASL/PLAIN transmits credentials in cleartext (requires TLS to be safe). SASL/SCRAM uses a cryptographic challenge-response — the client proves knowledge of the password without sending it over the network. SCRAM is significantly more secure because even with network interception, the password cannot be extracted.

**Q: How are SCRAM credentials stored in Kafka 4.0+ (KRaft mode)?**

> In KRaft mode, SCRAM credentials are stored directly in the cluster's metadata log (`__cluster_metadata` topic), managed by the KRaft controller quorum. Previously in ZooKeeper-based clusters, they were stored in ZooKeeper znodes. KRaft mode simplifies this by eliminating the external ZooKeeper dependency.

**Q: How does mTLS authentication work in Kafka?**

> mTLS (mutual TLS) requires both broker and client to present X.509 certificates. The broker validates the client certificate against its trust store and extracts the principal identity from the certificate's CN (Common Name) or DN (Distinguished Name). The `ssl.principal.mapping.rules` configuration controls how the DN is mapped to a Kafka principal for ACL evaluation.

**Q: What is the OAuth flow in Kafka?**

> The client first obtains a JWT access token from the identity provider (e.g., Okta, Keycloak) using client credentials. It then presents this token to the Kafka broker via SASL/OAUTHBEARER. The broker validates the token's cryptographic signature against the IdP's public keys (fetched from the JWKS endpoint), checks expiry, validates audience/issuer claims, and extracts the principal identity from the `sub` claim. Standard ACLs then control what the authenticated principal can do.

**Q: When would you use SASL/GSSAPI over other mechanisms?**

> SASL/GSSAPI (Kerberos) is chosen when an organization already has an Active Directory or Kerberos KDC infrastructure. It provides single sign-on capabilities — users authenticate once to the Kerberos realm and get Kerberos tickets used across all systems including Kafka. The tradeoff is high operational complexity: synchronized clocks, proper DNS, and KDC maintenance. New cloud-native deployments prefer OAuth 2.0 instead.

---

## Related Topics

- [Kafka ACLs & Authorization Patterns](./kafka-security-acls.md) — Fine-grained access control built on top of authentication
- [Monitoring & Operations](./monitoring-operations.md) — Track authentication failures via broker metrics
- [KRaft vs ZooKeeper](../core/kraft-vs-zookeeper.md) — How KRaft mode affects credential storage

## Sources

1. [Apache Kafka Security Documentation](https://kafka.apache.org/documentation/#security) — Official Kafka 4.0+ security configuration
2. [KIP-500: Replace ZooKeeper with KRaft](https://cwiki.apache.org/confluence/display/KAFKA/KIP-500) — KRaft authentication credential storage details
3. [RFC 7628 — SASL OAuth](https://datatracker.ietf.org/doc/html/rfc7628) — SASL/OAUTHBEARER specification
4. [RFC 7519 — JWT](https://datatracker.ietf.org/doc/html/rfc7519) — OAuth access token standard
5. [Strimzi OAuth 2.0 Documentation](https://strimzi.io/docs/operators/latest/overview.html#security-oauth2) — Kubernetes-native OAuth for Kafka
