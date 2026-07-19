---
id: kafka-security-best-practices
title: Kafka Security Best Practices
sidebar_label: Security Best Practices
description: End-to-end Kafka security guide covering authentication, ACLs, TLS 1.3 encryption, Zero Trust architecture, network isolation, credential management, and monitoring security events.
tags:
- technical-knowledge
- kafka
- advanced
- security
---

# Kafka Security Best Practices

As Kafka deployments grow in scale and criticality, securing them becomes essential. A security breach can expose sensitive business data, break compliance requirements, and disrupt critical operations.

Modern streaming architectures involve multiple teams, microservices, and external partners sharing the same infrastructure — making strong access controls non-negotiable.

---

## The Security Checklist

| Layer | Control | Status |
|-------|---------|--------|
| **Authentication** | Enable SCRAM-SHA-512, mTLS, or OAuth 2.0 | Required |
| **Authorization** | Configure ACLs with deny-by-default | Required |
| **Encryption in transit** | TLS 1.3 for all listener connections | Required |
| **Encryption at rest** | Disk/filesystem encryption on broker logs | Required |
| **Network isolation** | Private subnets, firewall rules | Required |
| **Credential management** | Vault/Secrets Manager — no hardcoded credentials | Required |
| **Audit logging** | Authorizer logs → SIEM | Required |
| **Zero Trust** | Verify every connection including internal | Strongly Recommended |
| **Security testing** | Chaos engineering for auth flows | Recommended |

---

## 1. Authentication

Authentication ensures only verified clients connect to your cluster. See [Kafka Authentication — SASL, SSL & OAuth](./kafka-security-authentication.md) for full implementation details.

### Choosing an Authentication Mechanism

| Mechanism | Best For | Kafka 4.0+ Notes |
|-----------|----------|------------------|
| **SASL/SCRAM-SHA-512** | Most production deployments | Credentials stored in KRaft metadata log ✅ |
| **mTLS** | Container platforms, zero-trust | Certificate automation required |
| **OAuth 2.0 / OIDC** | Cloud-native, microservices | Growing standard, integrates with Okta/Azure AD/Keycloak |
| **SASL/GSSAPI (Kerberos)** | Enterprise with Active Directory | SSO integration |

**Kafka 4.0+ / KRaft**: SCRAM credentials are stored in the `__cluster_metadata` topic (previously ZooKeeper, removed in Kafka 4.0). This centralized management simplifies credential rotation without ZooKeeper downtime.

### Production SCRAM Configuration

```properties
# Broker (server.properties)
sasl.enabled.mechanisms=SCRAM-SHA-512
sasl.mechanism.inter.broker.protocol=SCRAM-SHA-512
security.inter.broker.protocol=SASL_SSL

# Listeners — separate internal and external with different auth
listeners=BROKER://0.0.0.0:9092,EXTERNAL://0.0.0.0:9093
listener.security.protocol.map=BROKER:SASL_SSL,EXTERNAL:SASL_SSL
inter.broker.listener.name=BROKER
```

```bash
# Create SCRAM credentials (KRaft mode)
kafka-configs.sh --bootstrap-server localhost:9092 \
  --alter \
  --add-config 'SCRAM-SHA-512=[password=strong-random-password]' \
  --entity-type users --entity-name payment-service
```

### OAuth 2.0 Configuration

```properties
# Broker — OAuth token validation
sasl.enabled.mechanisms=OAUTHBEARER
listener.name.sasl_ssl.oauthbearer.sasl.jaas.config=org.apache.kafka.common.security.oauthbearer.OAuthBearerLoginModule required;
listener.name.sasl_ssl.oauthbearer.sasl.server.callback.handler.class=io.strimzi.kafka.oauth.server.JaasServerOauthValidatorCallbackHandler
oauth.token.endpoint.uri=https://auth.company.com/oauth/token
oauth.jwks.endpoint.uri=https://auth.company.com/.well-known/jwks.json
oauth.valid.issuer.uri=https://auth.company.com
```

---

## 2. Authorization (ACLs)

Authentication identifies who is connecting; authorization controls what they can do.

See [Kafka ACLs & Authorization Patterns](./kafka-security-acls.md) for full coverage. Security-specific practices:

### Deny-by-Default

```properties
# Broker — CRITICAL security setting
authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer
allow.everyone.if.no.acl.found=false  # Deny access when no ACL matches
super.users=User:kafka-operator        # Minimize superusers
```

### Principle of Least Privilege

```bash
# WRONG: Wildcard access
kafka-acls.sh --add --allow-principal User:analytics-app \
  --operation All --topic '*'  # Never in production

# CORRECT: Explicit, minimal permissions
kafka-acls.sh --add --allow-principal User:analytics-app \
  --operation Read --operation Describe \
  --topic clickstream-events

kafka-acls.sh --add --allow-principal User:analytics-app \
  --operation Read --group analytics-group
```

### Team-Based Access via Prefixed ACLs

```bash
# Grant entire team access to their namespace
kafka-acls.sh --add --allow-principal User:payments-service \
  --operation Write --operation Describe \
  --resource-pattern-type prefixed --topic payments.
```

### Regular ACL Audits

```bash
# List all ACLs — export for review
kafka-acls.sh --bootstrap-server localhost:9092 --list > acls-audit-$(date +%Y%m%d).txt

# Find overly broad ACLs (wildcard topics)
kafka-acls.sh --bootstrap-server localhost:9092 --list | grep "ResourceName: \*"

# Check ACLs for specific principal
kafka-acls.sh --bootstrap-server localhost:9092 --list \
  --principal User:analytics-app
```

---

## 3. Encryption in Transit (TLS 1.3)

TLS protects data between clients and brokers, and between brokers themselves. **TLS 1.3 is the modern standard** — enforce it for all production deployments.

```properties
# Broker TLS configuration — enforce TLS 1.3
listeners=PLAINTEXT://localhost:9092,SSL://localhost:9093
ssl.keystore.location=/var/private/ssl/kafka.server.keystore.jks
ssl.keystore.password=${KEYSTORE_PASSWORD}
ssl.key.password=${KEY_PASSWORD}

# Enforce TLS 1.3 only
ssl.protocol=TLSv1.3
ssl.enabled.protocols=TLSv1.3

# Strong cipher suites
ssl.cipher.suites=TLS_AES_256_GCM_SHA384,TLS_AES_128_GCM_SHA256,TLS_CHACHA20_POLY1305_SHA256

# Require client authentication for mTLS
ssl.client.auth=required
ssl.truststore.location=/var/private/ssl/kafka.server.truststore.jks
ssl.truststore.password=${TRUSTSTORE_PASSWORD}
```

**Performance note**: TLS 1.3 overhead on modern hardware with AES-NI is < 5% throughput impact. TLS 1.3 also reduces connection handshake latency by 33% compared to TLS 1.2.

### Certificate Management Best Practices

- **Automate rotation**: Use cert-manager (Kubernetes), HashiCorp Vault, or AWS Certificate Manager
- **Rotation schedule**: Every 90 days or less
- **Monitor expiry**: Alert at 30 days, 14 days, 7 days before expiration
- **Separate trust stores**: Different trust stores for different security zones

```yaml
# cert-manager (Kubernetes) — auto-renew Kafka broker certs
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: kafka-broker-cert
spec:
  secretName: kafka-broker-tls
  duration: 2160h  # 90 days
  renewBefore: 720h  # Renew 30 days before expiry
  issuerRef:
    name: cluster-ca-issuer
    kind: ClusterIssuer
  dnsNames:
  - kafka-broker-0.kafka-brokers.kafka.svc.cluster.local
```

---

## 4. Encryption at Rest

Kafka stores messages in log files on broker disks. Protect this data for compliance and physical security:

**Filesystem-level encryption (Linux):**
```bash
# LUKS encryption for Kafka data directory
cryptsetup luksFormat /dev/sdb
cryptsetup open /dev/sdb kafka-data
mkfs.xfs /dev/mapper/kafka-data
mount /dev/mapper/kafka-data /var/kafka/logs
```

**Cloud provider options:**
- AWS: EBS volumes with AWS KMS encryption
- GCP: Persistent Disk with Cloud KMS
- Azure: Managed Disks with Azure Disk Encryption

**Application-level field encryption** (for highest sensitivity):
```java
// Encrypt PII fields before producing
String encryptedEmail = kmsClient.encrypt(customer.getEmail(), "kafka-pii-key");
CustomerEvent event = new CustomerEvent(customer.getId(), encryptedEmail, ...);
producer.send(new ProducerRecord<>("customers", customerId, event));
```

---

## 5. Network Security and Isolation

Defense-in-depth: multiple network layers protecting broker access.

```
Internet
  │  (blocked)
  ▼
Load Balancer / API Gateway  (port 443, TLS)
  │  (restricted)
  ▼
Application Subnet (microservices)
  │  (port 9093 SASL_SSL only)
  ▼
Kafka Broker Subnet (private, no internet)
  │  (port 9092 BROKER listener only)
  ▼
Controller Subnet (restricted to brokers/ops)
```

**AWS Security Group example:**
```hcl
# Allow only application subnet to reach brokers
resource "aws_security_group_rule" "kafka_client_access" {
  type              = "ingress"
  from_port         = 9093
  to_port           = 9093
  protocol          = "tcp"
  source_security_group_id = aws_security_group.application.id
  security_group_id = aws_security_group.kafka_broker.id
}

# Broker-to-broker replication (port 9092)
resource "aws_security_group_rule" "kafka_inter_broker" {
  type              = "ingress"
  from_port         = 9092
  to_port           = 9092
  protocol          = "tcp"
  self              = true
  security_group_id = aws_security_group.kafka_broker.id
}
```

---

## 6. Zero Trust Architecture

Zero Trust: **never trust, always verify** — every connection is authenticated and authorized regardless of network location.

**Core Zero Trust principles for Kafka:**

| Principle | Implementation |
|-----------|---------------|
| **Never trust, always verify** | Auth + encryption for every connection, including broker-to-broker |
| **Least privilege access** | Explicit ACLs per service account, no wildcards |
| **Assume breach** | Encrypt in transit everywhere, monitor for anomalies |
| **Verify explicitly** | OAuth 2.0, mTLS, or SCRAM — no IP-based trust |
| **Monitor continuously** | Track all access patterns and authorization decisions |
| **Microsegmentation** | Separate critical/sensitive topics from lower-sensitivity workloads |

**Kubernetes Zero Trust with Istio + Kafka:**
```yaml
# Istio AuthorizationPolicy — require mTLS from specific services
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: kafka-producer-policy
  namespace: kafka
spec:
  selector:
    matchLabels:
      app: kafka
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/payments/sa/payment-service"]
    to:
    - operation:
        ports: ["9093"]
```

---

## 7. Credential Management

Never hardcode credentials in application config or Docker images.

```java
// BAD: Hardcoded credentials
props.put("sasl.jaas.config",
    "required username=\"admin\" password=\"mysecretpassword\";");

// GOOD: Load from secrets manager
String password = secretsManager.getSecretValue("kafka/payment-service/password");
props.put("sasl.jaas.config",
    String.format("required username=\"payment-service\" password=\"%s\";", password));
```

**Vault dynamic secrets:**
```hcl
# HashiCorp Vault — generate time-limited Kafka credentials
vault write kafka/creds/payment-service-role \
  ttl=1h

# Returns:
# username: v-payment-service-abc123
# password: xyz789-expires-in-1h
```

**Kubernetes secrets (base minimum):**
```yaml
# Use External Secrets Operator to sync from Vault/AWS
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: kafka-producer-credentials
spec:
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: kafka-credentials
  data:
  - secretKey: password
    remoteRef:
      key: kafka/payment-service
      property: password
```

---

## 8. Monitoring Security Events

Security requires ongoing monitoring, not just initial configuration.

### Key Security Metrics to Monitor

| Metric | Alert Threshold | Meaning |
|--------|-----------------|---------|
| Failed authentication attempts | > 10/min | Brute force or misconfigured client |
| Authorization failures | > 5/min | ACL misconfiguration or intrusion attempt |
| TLS handshake failures | > 0 | Certificate issues or version mismatch |
| New connections from unexpected IPs | Any | Potential intrusion |
| Superuser activity | Any non-scheduled | Unauthorized admin access |

### Enabling Authorizer Debug Logging

```properties
# log4j.properties — log all authorization decisions
log4j.logger.kafka.authorizer.logger=DEBUG, authorizerAppender
log4j.additivity.kafka.authorizer.logger=false
log4j.appender.authorizerAppender=org.apache.log4j.RollingFileAppender
log4j.appender.authorizerAppender.File=/var/log/kafka/kafka-authorizer.log
log4j.appender.authorizerAppender.MaxFileSize=100MB
log4j.appender.authorizerAppender.MaxBackupIndex=10
```

### Audit Events to Ship to SIEM

- Authentication: successful logins, failures, new clients
- Authorization: denies, first-time access from new principals
- Admin operations: topic creation/deletion, ACL changes, config changes
- Quota throttling: clients hitting quota limits

---

## 9. Security Testing

Validate your security controls regularly — don't assume configuration is correct.

```bash
# Test that deny-by-default is working
# (Use a principal with no ACLs)
kafka-console-producer.sh --bootstrap-server localhost:9093 \
  --topic orders \
  --producer.config no-acl-client.properties
# Expected: TopicAuthorizationException

# Test that TLS is required (plaintext connection should fail)
kafka-console-producer.sh --bootstrap-server localhost:9092 \
  --topic orders
# Expected: SSL handshake failure / connection refused
```

**Chaos engineering for security:**
- Simulate expired certificates to verify rotation triggers
- Inject authentication failures to test monitoring alerts
- Test consumer behavior when ACLs are temporarily revoked
- Verify audit logs capture all expected events

---

## Interview Questions

**Q: What is the most important Kafka security configuration to set?**

> `allow.everyone.if.no.acl.found=false`. Without this, Kafka allows any authenticated principal to perform any operation if no ACL exists for the resource — effectively making authorization opt-in instead of mandatory. In production, access should be denied by default and explicitly granted, not the reverse.

**Q: Why is TLS 1.3 preferred over TLS 1.2 for Kafka?**

> TLS 1.3 removes vulnerable cipher suites and features present in TLS 1.2 (RC4, DES, EXPORT ciphers, RSA key exchange). It also reduces connection establishment to 1-RTT (instead of 2-RTT in TLS 1.2) — a 33% faster handshake. With AES-NI hardware acceleration on modern CPUs, the throughput overhead is less than 5%, making it both more secure and more performant.

**Q: What is the difference between authentication and authorization in Kafka?**

> Authentication verifies identity: "Who are you?" — handled by SASL mechanisms (SCRAM, GSSAPI, OAUTHBEARER) or TLS certificates. Authorization controls permissions: "What can you do?" — handled by ACLs evaluated by the StandardAuthorizer. Both are required. A properly authenticated client with no ACLs will be denied all operations when `allow.everyone.if.no.acl.found=false`.

**Q: What is Zero Trust and how does it apply to Kafka?**

> Zero Trust is a security model where no connection is trusted by default — every access request is verified regardless of network location. For Kafka: encrypt all connections including broker-to-broker (not just client-to-broker), authenticate every client with strong mechanisms (SCRAM/mTLS/OAuth), enforce least privilege with explicit ACLs, monitor all access patterns continuously, and segment critical topics from lower-sensitivity workloads. The key shift is not trusting internal network traffic.

---

## Related Topics

- [Kafka Authentication — SASL, SSL & OAuth](./kafka-security-authentication.md) — Deep dive into each authentication mechanism
- [Kafka ACLs & Authorization Patterns](./kafka-security-acls.md) — Granular authorization patterns
- [Kafka Data Governance](./kafka-data-governance.md) — Security as part of the broader governance framework
- [Monitoring & Operations](./monitoring-operations.md) — Metrics and alerting

## Sources

1. [Apache Kafka Security Documentation](https://kafka.apache.org/documentation/#security)
2. [OWASP API Security Project](https://owasp.org/www-project-api-security/)
3. [NIST Zero Trust Architecture (SP 800-207)](https://csrc.nist.gov/publications/detail/sp/800-207/final)
4. [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
5. [Strimzi OAuth 2.0 Documentation](https://github.com/strimzi/strimzi-kafka-oauth)
