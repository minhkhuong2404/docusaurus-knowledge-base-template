---
id: kafka-security-acls
title: Kafka ACLs & Authorization Patterns
sidebar_label: ACLs & Authorization
description: Kafka Access Control Lists (ACLs) for fine-grained authorization. Covers KRaft ACL storage, resource patterns, OAuth/OPA/RBAC integration, and at-scale management.
tags:
- technical-knowledge
- kafka
- advanced
- security
- acl
- authorization
---

# Kafka ACLs and Authorization Patterns

Access Control Lists (ACLs) provide the foundation for authorization in Kafka, enabling organizations to enforce fine-grained permissions across topics, consumer groups, and cluster operations. This article covers how Kafka ACLs work in **KRaft-based clusters (Kafka 4.0+)**, modern authorization patterns including OAuth 2.0 and Open Policy Agent, and practical approaches to managing access control at scale.

> **Prerequisites**: Authentication must be configured first. See [Kafka Authentication — SASL, SSL & OAuth](./kafka-security-authentication.md). Authorization is meaningless without knowing who is connecting.

---

## Understanding Kafka ACLs

A Kafka ACL defines which **principal** (authenticated identity) can perform a specific **operation** on a particular **resource**, and whether to **allow** or **deny** it.

### The Four ACL Components

| Component | Description | Example |
|-----------|-------------|---------|
| **Principal** | Authenticated identity | `User:payment-service` |
| **Resource** | Kafka resource type + name | `Topic:payments.completed` |
| **Operation** | The action attempted | `Write`, `Read`, `Describe` |
| **Permission Type** | Allow or Deny | `Allow` |

Example: *"User:analytics-app is allowed to Read from Topic:clickstream-events."*

Without this explicit permission, the analytics application would be denied access even if properly authenticated.

### ACL Storage in KRaft Mode

In **Kafka 4.0+ with KRaft**, ACLs are stored in the `__cluster_metadata` topic managed by the KRaft controllers. This replaced ZooKeeper-based ACL storage (removed in Kafka 4.0), providing:

- **Faster propagation** — metadata changes replicate via Kafka's native replication (ms vs seconds)
- **Simpler operations** — no external ZooKeeper cluster to manage
- **Consistent views** — all brokers read from the same replicated log, eliminating inconsistencies

### Enabling Authorization

```properties
# Broker configuration (server.properties)
authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer

# Deny access by default if no ACL found (CRITICAL for security)
allow.everyone.if.no.acl.found=false

# Superusers bypass all ACL checks
super.users=User:admin;User:kafka-operator
```

The **StandardAuthorizer** (Kafka 3.0+, replacing older AclAuthorizer) implements a **deny-by-default** model — access is denied unless an explicit Allow rule exists.

---

## Authorization Flow

When a producer attempts to write to a topic:

```
Client authenticates (SASL, mTLS, etc.)
        │
        ▼
Principal extracted → e.g., User:order-service
        │
        ▼
Client attempts Write operation on Topic:orders
        │
        ▼
StandardAuthorizer queries stored ACLs
        │
        ├── Allow ACL found? → PERMIT operation
        └── No matching ACL? → DENY (AuthorizationException)
```

:::warning[Common Mistake: Missing Describe Permission]
Almost all operations require **Describe** *in addition* to the primary operation. Missing Describe is the #1 ACL mistake.

- Producer: `Write` + `Describe` on topic
- Consumer: `Read` + `Describe` on topic, `Read` on consumer group
:::

---

## Resource Types and Operations

### Topic Operations

| Operation | Use Case |
|-----------|----------|
| `Read` | Consume messages |
| `Write` | Produce messages |
| `Create` | Auto-create topics |
| `Delete` | Delete the topic |
| `Describe` | View metadata (required with almost all ops) |
| `Alter` | Modify topic configuration |
| `AlterConfigs` | Modify topic-level configs |

### Consumer Group Operations

| Operation | Use Case |
|-----------|----------|
| `Read` | Join consumer group and consume |
| `Describe` | View group metadata and offsets |
| `Delete` | Delete the consumer group |

### Cluster Operations

| Operation | Use Case |
|-----------|----------|
| `Create` | Create topics at cluster level |
| `ClusterAction` | Execute cluster-level operations |
| `IdempotentWrite` | Enable idempotent producer writes |
| `AlterConfigs` | Modify broker configurations |

---

## Resource Pattern Types

Kafka supports three pattern types for flexible permission matching:

- **LITERAL** — Exact match. ACL for `topic:orders` only matches the topic named exactly "orders".
- **PREFIXED** — Prefix match. ACL for `topic:team-a.` matches `team-a.orders`, `team-a.payments`, etc.
- **WILDCARD** — `*` matches all resources of that type (use sparingly).

Prefixed patterns dramatically reduce ACL sprawl. Instead of 50 individual ACLs, one prefixed ACL covers an entire team's topics:

```bash
# Grant Team A write access to all their topics
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add \
  --allow-principal User:team-a-app \
  --operation Write \
  --operation Describe \
  --resource-pattern-type prefixed \
  --topic team-a.
# Covers: team-a.orders, team-a.payments, team-a.analytics
# Does NOT cover: team-b.orders or shared.events
```

---

## Practical ACL Examples

### Basic Producer

```bash
# Producer needs Write + Describe on the topic
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add \
  --allow-principal User:payment-service \
  --operation Write \
  --operation Describe \
  --topic payments.completed

# For idempotent producers, also grant IdempotentWrite on cluster
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add \
  --allow-principal User:payment-service \
  --operation IdempotentWrite \
  --cluster
```

### Basic Consumer

```bash
# Consumer needs Read + Describe on the topic
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add \
  --allow-principal User:analytics-service \
  --operation Read \
  --operation Describe \
  --topic payments.completed

# Consumer also needs Read on its consumer group
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add \
  --allow-principal User:analytics-service \
  --operation Read \
  --group analytics-group
```

### Kafka Streams / Flink Application

Stream processors need permissions for input topics, output topics, consumer groups, AND internal state topics:

```bash
# Input topic permissions
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add --allow-principal User:fraud-detector \
  --operation Read --operation Describe \
  --topic transactions.raw

# Output topic permissions
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add --allow-principal User:fraud-detector \
  --operation Write --operation Describe --operation Create \
  --topic transactions.fraud-alerts

# Consumer group for state management
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add --allow-principal User:fraud-detector \
  --operation Read --group fraud-detector-app

# Internal topics (Kafka Streams creates these automatically)
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add --allow-principal User:fraud-detector \
  --operation All \
  --resource-pattern-type prefixed \
  --topic fraud-detector-
```

---

## Authorization Patterns

### Team-Based Access Control

Organize ACLs around team boundaries using prefixed patterns:

- **Analytics team** → Read access to `clickstream.*`, `orders.*`, `inventory.*`
- **Orders team** → Full access to `orders.*` topics and consumer groups
- **Inventory team** → Full access to `inventory.*` topics and consumer groups

### Service-Based (Least Privilege)

Each microservice gets a unique principal with minimal required permissions:

- `User:payment-service` → Write `payments.completed`, Read `orders.validated`
- `User:notification-service` → Read `payments.completed`, `orders.shipped`
- `User:analytics-service` → Read from analytics-prefixed topics

This **principle of least privilege** minimizes blast radius if a service is compromised.

### Environment Separation

Common pattern with topic prefix-based separation within one cluster:

| Prefix | Environment | ACL Policy |
|--------|-------------|------------|
| `dev.` | Development | Relaxed, broad access |
| `staging.` | Staging | Semi-strict for testing |
| `prod.` | Production | Strict, explicit approval required |

---

## Modern Authorization Patterns

### OAuth 2.0 + OIDC Integration

OAuth/OIDC enables centralized identity management and single sign-on (SSO) without distributing long-lived credentials:

1. Client authenticates with IdP → gets JWT
2. JWT presented to Kafka via SASL/OAUTHBEARER
3. Kafka validates token, extracts principal from claims
4. Standard ACLs evaluated using extracted principal

```properties
# Broker OAuth configuration
sasl.enabled.mechanisms=OAUTHBEARER
listener.name.sasl_ssl.oauthbearer.sasl.jaas.config=org.apache.kafka.common.security.oauthbearer.OAuthBearerLoginModule required;
oauth.token.endpoint.uri=https://auth.company.com/oauth/token
oauth.jwks.endpoint.uri=https://auth.company.com/oauth/jwks
oauth.valid.issuer.uri=https://auth.company.com
```

Once OAuth authentication establishes identity, traditional ACLs control access.

### Open Policy Agent (OPA)

OPA provides **policy-based authorization using the Rego language**, decoupling authorization logic from Kafka's built-in ACL system:

```rego
package kafka.authz

import future.keywords.if

# Allow analytics team to read only during business hours
allow if {
    input.principal.name == "analytics-service"
    input.operation.name == "Read"
    is_business_hours
}

is_business_hours if {
    hour := time.clock(time.now_ns())[0]
    hour >= 9
    hour < 18
}

# Allow payment service full access to payments topics anytime
allow if {
    input.principal.name == "payment-service"
    startswith(input.resource.name, "payments.")
}
```

OPA decisions can be based on: principal identity, group membership, resource attributes, time of day, client IP, external data sources (LDAP, compliance systems).

### Role-Based Access Control (RBAC)

Traditional Kafka ACLs don't natively support roles, but RBAC can be implemented via:

1. **Group-based ACLs** — Use `Group:analysts` principals when your auth system supports group extraction from tokens
2. **Prefix-based role simulation** — Topic naming conventions with prefixed ACLs

```bash
# Define "analyst" role via topic prefix pattern
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add \
  --allow-principal User:alice \
  --allow-principal User:bob \
  --operation Read \
  --resource-pattern-type prefixed \
  --topic role-analysts.
```

3. **External RBAC** — LDAP/Active Directory mapping roles to Kafka principals
4. **Commercial platforms** — Conduktor provides native RBAC with visual role management

### Attribute-Based Access Control (ABAC)

ABAC extends authorization beyond identity to include resource and environment attributes:

- Grant access based on **data classification**: only principals with "PII-access" attribute can read PII-tagged topics
- **Environment rules**: production data only accessible from production networks
- **Project-based**: users can access topics tagged with their project ID
- **Compliance-driven**: GDPR-protected data requires additional authorization checks

---

## Managing ACLs at Scale

### Common Problems with Manual Management

- Typos in principal names or topic patterns
- Forgetting required permissions (e.g., `Describe` along with `Read`)
- Stale ACLs for decommissioned applications
- No audit trail for changes
- Inconsistent patterns across teams
- Authorization failures with unclear root causes

### Infrastructure-as-Code for ACLs

Treat ACLs as declarative infrastructure — version control, peer review, automated deployment:

```yaml
# acls/payment-service.yaml
principals:
  - name: payment-service
    type: User

acls:
  - resource: Topic
    name: payments.completed
    pattern: LITERAL
    operations: [Write, Describe]
    permission: Allow

  - resource: Topic
    name: orders.validated
    pattern: LITERAL
    operations: [Read, Describe]
    permission: Allow

  - resource: Group
    name: payment-service-group
    pattern: LITERAL
    operations: [Read]
    permission: Allow

  - resource: Cluster
    operations: [IdempotentWrite]
    permission: Allow
```

**Benefits**: version control history, peer review via PRs, rollback capability, documentation as code, consistency.

### Programmatic ACL Management via Admin API

```java
Properties props = new Properties();
props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
AdminClient admin = AdminClient.create(props);

AclBinding acl = new AclBinding(
    new ResourcePattern(ResourceType.TOPIC, "payments.completed", PatternType.LITERAL),
    new AccessControlEntry("User:payment-service", "*", AclOperation.WRITE, AclPermissionType.ALLOW)
);

admin.createAcls(Collections.singleton(acl)).all().get();
admin.close();
```

### Auditing ACLs

```bash
# List all ACLs in the cluster
kafka-acls.sh --bootstrap-server localhost:9092 --list

# ACLs for a specific principal
kafka-acls.sh --bootstrap-server localhost:9092 --list \
  --principal User:payment-service

# ACLs for a specific topic
kafka-acls.sh --bootstrap-server localhost:9092 --list \
  --topic payments.completed

# Export for backup/analysis
kafka-acls.sh --bootstrap-server localhost:9092 --list > acls-backup-$(date +%Y%m%d).txt
```

**Regular audit questions:**
- Which principals have wildcard access (`--topic '*'`)?
- Are there ACLs for decommissioned services?
- Do principals have more permissions than required?
- Are superusers properly restricted?

---

## Troubleshooting ACL Issues

### Producer Authorization Errors

```
TopicAuthorizationException: Not authorized to access topics: [payments.completed]
```

**Causes**: Missing Write or Describe permission, or principal name mismatch.

```bash
# Fix: Add both Write and Describe
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add --allow-principal User:payment-service \
  --operation Write --operation Describe \
  --topic payments.completed
```

```
ClusterAuthorizationException: Cluster authorization failed
```

**Cause**: Missing `IdempotentWrite` when using idempotent producer.

```bash
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add --allow-principal User:payment-service \
  --operation IdempotentWrite --cluster
```

### Consumer Authorization Errors

```
GroupAuthorizationException: Not authorized to access group: analytics-group
```

**Cause**: Missing Read permission on consumer group.

```bash
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add --allow-principal User:analytics-service \
  --operation Read --group analytics-group
```

### Debugging Techniques

**Enable authorization debug logging:**
```properties
# log4j.properties
log4j.logger.kafka.authorizer.logger=DEBUG
```
This logs every authorization decision with principal, resource, operation, and result.

**Check principal name extraction** — For mTLS, Kafka extracts the DN from the certificate. Verify with `ssl.principal.mapping.rules`:
```properties
# Map CN from cert DN to Kafka principal
ssl.principal.mapping.rules=RULE:^CN=(.*?),OU=.*$/$1/,DEFAULT
```

**Verify ACL propagation in KRaft:**
```bash
kafka-metadata-shell.sh --snapshot /var/lib/kafka/data/__cluster_metadata-0/*.checkpoint
grep "Processing ACL" /var/log/kafka/server.log
```

### Common Pitfalls

| Pitfall | Impact | Fix |
|---------|--------|-----|
| Missing `Describe` permission | Auth failures on all operations | Add `Describe` alongside every primary op |
| Principal name mismatch | ACL exists but never matches | Check exact principal format in broker logs |
| Consumer group wildcards | Unintended broad access | Use prefix patterns instead |
| Case sensitivity | `User:PaymentService` ≠ `User:paymentservice` | Standardize principal naming |
| ACLs added after deployment | App fails at startup | Create ACLs BEFORE deploying |

---

## Best Practices

1. **Deny-by-default**: Configure `allow.everyone.if.no.acl.found=false` in production.
2. **Service accounts**: Each application has its own principal — no shared credentials.
3. **Least privilege**: Wildcard ACLs (`--topic '*'`) should be rare and justified.
4. **Infrastructure-as-code**: Version control all ACL definitions with peer review.
5. **Separate admin access**: Limit cluster admin operations to a small operator set.
6. **Integrate with identity providers**: Use LDAP/AD/OAuth to leverage existing access controls.
7. **Monitor authorization failures**: Track `FailedProduceRequestsPerSec` and `AuthorizationException` errors.
8. **Test before production**: Validate ACL changes in staging before applying to production clusters.
9. **Use prefixed patterns**: Reduces ACL count while maintaining granularity.
10. **Plan for rotation**: Design ACLs so they survive credential rotation.

---

## Interview Questions

**Q: What is the difference between authentication and authorization in Kafka?**

> Authentication answers "Who are you?" — verifying identity via SASL, mTLS, or OAuth. Authorization answers "What can you do?" — ACLs determine which operations authenticated principals can perform on which resources. Both are required for production security.

**Q: Why does a Kafka consumer need ACLs on both the topic AND the consumer group?**

> Consuming requires two separate operations: reading from the topic (requires `Read` + `Describe` on the topic) and joining a consumer group (requires `Read` on the consumer group resource). The consumer group ACL controls who can join the group and commit offsets. Missing either causes `TopicAuthorizationException` or `GroupAuthorizationException`.

**Q: What is the deny-by-default model in Kafka ACLs?**

> When `allow.everyone.if.no.acl.found=false`, Kafka denies any operation that does not have an explicit Allow ACL. This is the secure default — if you forget to create an ACL, access is blocked rather than accidentally allowed. The StandardAuthorizer also evaluates Deny ACLs before Allow ACLs, so explicit Deny rules take precedence.

**Q: How do prefixed ACLs work and why are they useful?**

> Prefixed ACLs use `--resource-pattern-type prefixed` to match all resources that start with a specified string. For example, a prefixed ACL for `team-a.` matches `team-a.orders`, `team-a.payments`, and any future topics with that prefix — without needing to create individual ACLs. This eliminates ACL sprawl in multi-tenant environments and ensures new topics automatically inherit permissions if they follow the naming convention.

**Q: What is a Kafka superuser?**

> A superuser is a principal configured in `super.users` in broker config (e.g., `super.users=User:admin;User:kafka-operator`). Superusers bypass all ACL checks and can perform any operation on any resource. They are used for administrative automation — but should be strictly limited to avoid security risks.

---

## Related Topics

- [Kafka Authentication — SASL, SSL & OAuth](./kafka-security-authentication.md) — Identity verification that precedes authorization
- [Monitoring & Operations](./monitoring-operations.md) — Monitor authorization failure metrics
- [Kafka Streams Deep Dive](./kafka-streams-deep-dive.md) — Stream processors require complex multi-resource ACLs

## Sources

1. [Apache Kafka Security Documentation](https://kafka.apache.org/documentation/#security) — Official ACL configuration reference
2. [KIP-500: Replace ZooKeeper with KRaft](https://cwiki.apache.org/confluence/display/KAFKA/KIP-500) — ACL storage in KRaft metadata
3. [Open Policy Agent Documentation](https://www.openpolicyagent.org/docs/) — Policy-based authorization framework
4. [RFC 7628 — SASL OAuth](https://datatracker.ietf.org/doc/html/rfc7628) — OAuth SASL integration spec
