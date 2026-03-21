---
id: rds-aurora
title: Amazon RDS & Aurora
sidebar_label: "🐘 RDS & Aurora"
description: >
  Amazon RDS and Aurora for DVA-C02. Multi-AZ vs Read Replicas, Aurora
  Serverless, RDS Proxy, IAM authentication, connection pooling,
  encryption, and common developer patterns with Java/Spring Boot.
tags:
  - rds
  - aurora
  - database
  - multi-az
  - read-replicas
  - rds-proxy
  - java
  - spring-boot
  - dva-c02
  - domain-1
---

# Amazon RDS & Aurora

> **Exam focus**: RDS appears in DVA-C02 mostly in **connection management**, **security** (IAM auth, encryption), and **scaling** scenarios. DynamoDB is tested far more, but know these RDS patterns.

---

## RDS Key Features

| Feature | Description |
|---|---|
| **Managed** | AWS handles patching, backups, failover |
| **Engines** | MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Db2 |
| **Multi-AZ** | Standby replica in another AZ — automatic failover |
| **Read Replicas** | Up to 15 read replicas — scale reads, cross-region possible |
| **Automated backups** | Daily snapshot + transaction logs → point-in-time restore |
| **Encryption** | KMS at rest, TLS in transit |

---

## Multi-AZ vs Read Replicas

| Feature | Multi-AZ | Read Replica |
|---|---|---|
| **Purpose** | High availability / DR | Read scalability |
| **Sync** | **Synchronous** replication | **Asynchronous** replication |
| **Failover** | ✅ Automatic (1–2 min DNS update) | ❌ No automatic failover |
| **Traffic** | Standby not accessible | ✅ Can read from replica |
| **Cross-region** | ❌ Same region | ✅ Cross-region possible |
| **Cost** | 2× instance cost | Additional instance |

:::tip Exam trap — Multi-AZ vs Read Replica
"High availability" → **Multi-AZ**
"Scale read traffic" → **Read Replica**
"DR across regions" → **Cross-region Read Replica**
They serve **different purposes** — you can use both simultaneously.
:::

---

## Aurora

Aurora is AWS's **cloud-native** relational database — up to 5× faster than MySQL, 3× faster than PostgreSQL.

### Aurora Architecture

```
Aurora Cluster Endpoint (writer)
   ├── Primary Instance (writer)
   ├── Aurora Replica 1 (reader)     ←── Reader Endpoint
   ├── Aurora Replica 2 (reader)
   └── Aurora Replica 3 (reader)

Shared distributed storage (6 copies across 3 AZs, auto-replicates)
Storage auto-grows: 10GB → up to 128TB
```

### Aurora vs RDS

| Feature | Aurora | RDS |
|---|---|---|
| **Storage** | Auto-grows, 6 copies across 3 AZs | Fixed EBS, 2 copies in 1 AZ |
| **Replicas** | Up to 15 | Up to 15 |
| **Failover** | < 30 seconds | 1–2 minutes |
| **Backtrack** | ✅ Rewind without restore | ❌ |
| **Global Database** | ✅ Cross-region < 1s replication | ❌ (only cross-region Read Replica) |
| **Cost** | ~20% more than RDS | Baseline |

### Aurora Serverless v2

- Automatically scales compute up/down in fine-grained increments
- Capacity in **ACUs** (Aurora Capacity Units)
- Scale to zero (v1 only — v2 has a minimum ACU)
- Perfect for variable/unpredictable workloads

---

## RDS Proxy

**Problem**: Lambda functions create a new DB connection on every invocation → connection pool exhaustion.

```
Without RDS Proxy:
Lambda (1000 concurrent) → 1000 DB connections → DB overwhelmed

With RDS Proxy:
Lambda (1000 concurrent) → RDS Proxy (pool: 20-100 connections) → DB
                                  (multiplexes + queues connections)
```

### Benefits
- Connection pooling — fewer DB connections
- **IAM authentication** passthrough
- Automatic failover routing (stays connected during Multi-AZ failover)
- Reduced Lambda cold start time (no connection re-establishment)

```java
// Spring Boot with RDS Proxy — same JDBC URL, just different endpoint
spring:
  datasource:
    url: jdbc:postgresql://my-proxy.proxy-xyz.us-east-1.rds.amazonaws.com:5432/mydb
    username: ${RDS_USERNAME}
    password: ${RDS_PASSWORD}  # Or use IAM auth token
```

---

## IAM Database Authentication

Skip the password — use an **IAM auth token** (15-minute TTL):

```java
RdsUtilities rdsUtilities = RdsUtilities.builder()
    .region(Region.US_EAST_1)
    .build();

String authToken = rdsUtilities.generateAuthenticationToken(builder -> builder
    .credentialsProvider(DefaultCredentialsProvider.create())
    .hostname("mydb.xyz.us-east-1.rds.amazonaws.com")
    .port(5432)
    .username("iam_user"));

// Use authToken as the JDBC password — valid for 15 minutes
Properties props = new Properties();
props.setProperty("user", "iam_user");
props.setProperty("password", authToken);
props.setProperty("ssl", "true");
Connection conn = DriverManager.getConnection(jdbcUrl, props);
```

**Requirements**: SSL must be enabled, IAM role needs `rds-db:connect` permission.

---

## Encryption

| State | Method |
|---|---|
| **At rest** | KMS CMK (set at creation time — cannot change on live DB) |
| **In transit** | SSL/TLS (enforce via parameter group or connection string) |
| **Encrypted snapshots** | Can copy to another region + re-encrypt with different key |

:::caution Encryption cannot be toggled
You **cannot encrypt an existing unencrypted RDS instance** directly. Workaround: create encrypted snapshot → restore to new encrypted instance.
:::

---

## Spring Boot Data Source Configuration

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}    # From Secrets Manager
    hikari:
      minimum-idle: 2
      maximum-pool-size: 10     # Keep low for Lambda!
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate        # Never 'create' or 'update' in prod
    show-sql: false
    properties:
      hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect
```

:::caution HikariCP pool size for Lambda
Lambda functions are short-lived — a pool size of 10 means each Lambda **execution environment** holds 10 connections. With 100 concurrent Lambdas = 1,000 connections. Use **RDS Proxy** to manage this.
:::

---

## Parameter Groups

Customize DB engine settings:

```
Parameter Group: my-postgres-params
  max_connections = 100
  shared_buffers = 256MB
  log_min_duration_statement = 1000  # Log queries > 1s
```

---

## 🧪 Practice Questions

**Q1.** A Lambda function connects to RDS PostgreSQL. Under high load (500 concurrent executions), the DB is getting `too many connections` errors. What is the MOST effective solution with the least code changes?

A) Increase RDS instance size  
B) Use DynamoDB instead  
C) Add an **RDS Proxy** between Lambda and RDS  
D) Reduce Lambda concurrency to 50  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **RDS Proxy** pools and multiplexes thousands of Lambda connections into a manageable number of actual DB connections. No code changes needed — just update the connection string to the proxy endpoint.
</details>

---

**Q2.** A production RDS MySQL database needs to handle increased read traffic without affecting the writer. What should the developer provision?

A) Multi-AZ standby  
B) A **Read Replica** and update app to route SELECTs to the replica endpoint  
C) Increase DB instance size  
D) Enable Aurora Serverless  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **Read Replicas** serve read traffic. Multi-AZ standby is for failover only — it doesn't serve traffic. The application must explicitly connect to the replica endpoint for reads (or Aurora reader endpoint handles this automatically).
</details>

---

**Q3.** A team needs to connect a Lambda function to RDS without storing database credentials anywhere. Which approach should they use?

A) Store credentials in Lambda environment variables  
B) Store credentials in Secrets Manager and fetch at init time  
C) **IAM database authentication** — generate a temporary auth token at connection time  
D) Use hardcoded credentials in the JAR  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **IAM database authentication** generates a short-lived (15-minute) auth token from the Lambda's IAM role — no passwords stored anywhere. Combine with RDS Proxy for connection pooling.

(B is also a valid and common approach, but C is "no credentials stored anywhere".)
</details>

---

**Q4.** A developer wants to encrypt an existing unencrypted RDS instance. What is the correct procedure?

A) Enable encryption in the RDS console settings  
B) Create an encrypted Read Replica  
C) Take a snapshot → copy snapshot with encryption enabled → restore to new instance  
D) Run `ALTER DATABASE ENCRYPT`  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — You cannot encrypt a running RDS instance directly. The procedure is: create snapshot → copy snapshot (enable encryption) → restore from encrypted snapshot to a new instance → update connection strings.
</details>

---

## 🔗 Resources

- [RDS User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/)
- [Aurora User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
- [RDS Proxy Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html)
- [IAM DB Authentication](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html)
- [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
