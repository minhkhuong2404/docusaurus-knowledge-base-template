---
id: database-security
title: Database Security
description: Authentication, authorization, SQL injection, encryption at rest and in transit, auditing, and security best practices.
tags: [database, security, sql-injection, encryption, authentication, authorization, rbac, auditing]
sidebar_position: 13
---

# Database Security

## Authentication

### User Management (MySQL)

```sql
-- Create user
CREATE USER 'app_user'@'%' IDENTIFIED BY 'StrongPassword123!';
CREATE USER 'readonly'@'10.0.0.%' IDENTIFIED BY 'ReadPass!';  -- restrict by IP

-- Strong auth plugin (MySQL 8)
CREATE USER 'admin'@'localhost'
    IDENTIFIED WITH caching_sha2_password BY 'Password!';

-- Check current users
SELECT User, Host, plugin FROM mysql.user;

-- Remove user
DROP USER 'old_user'@'%';
```

### User Management (PostgreSQL)

```sql
-- Roles (PostgreSQL uses roles for both users and groups)
CREATE ROLE app_user LOGIN PASSWORD 'StrongPassword!';
CREATE ROLE readonly_role;  -- no LOGIN: group role

-- Grant membership
GRANT readonly_role TO app_user;

-- Connection limits
CREATE ROLE api_service LOGIN CONNECTION LIMIT 20 PASSWORD 'secret';

-- List roles
\du
SELECT rolname, rolcanlogin, rolsuper FROM pg_roles;
```

---

## Authorization — Principle of Least Privilege

Grant only the permissions required for the task.

### MySQL Privileges

```sql
-- Application user: only DML on specific DB
GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.* TO 'app_user'@'%';

-- Read-only replica user
GRANT SELECT ON myapp.* TO 'readonly'@'%';

-- Admin user (separate from app)
GRANT ALL PRIVILEGES ON myapp.* TO 'dba'@'localhost' WITH GRANT OPTION;

-- Revoke
REVOKE DELETE ON myapp.orders FROM 'app_user'@'%';

FLUSH PRIVILEGES;
SHOW GRANTS FOR 'app_user'@'%';
```

### PostgreSQL Privileges

```sql
-- Schema-level privileges
GRANT USAGE ON SCHEMA public TO app_user;

-- Table-level
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_role;

-- Sequence (for auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Row-Level Security (RLS) — powerful fine-grained control
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_orders ON orders
    USING (user_id = current_setting('app.current_user_id')::bigint);
-- Each user can only see/modify their own orders
```

---

## SQL Injection

The most critical database vulnerability: attacker manipulates queries by injecting SQL through user input.

### Vulnerable Code (Java)

```java
// ❌ NEVER DO THIS
String query = "SELECT * FROM users WHERE username = '" + username + "'";
// Input: ' OR '1'='1
// Result: SELECT * FROM users WHERE username = '' OR '1'='1'
// → Returns ALL users!

// Input: '; DROP TABLE users; --
// Result: Drops the entire table!
```

### Prevention: Parameterized Queries

```java
// ✅ PreparedStatement — always use this
String sql = "SELECT * FROM users WHERE username = ? AND password = ?";
PreparedStatement stmt = conn.prepareStatement(sql);
stmt.setString(1, username);
stmt.setString(2, hashedPassword);
ResultSet rs = stmt.executeQuery();

// ✅ JPA / Spring Data (auto-parameterized)
@Query("SELECT u FROM User u WHERE u.username = :username")
User findByUsername(@Param("username") String username);

// ✅ Named parameters with JdbcTemplate
String sql = "SELECT * FROM users WHERE username = :username";
MapSqlParameterSource params = new MapSqlParameterSource("username", username);
namedJdbcTemplate.queryForObject(sql, params, User.class);
```

### ❌ Common Mistakes That Still Allow Injection

```java
// ❌ Dynamic table/column names — can't use ? for identifiers
String sql = "SELECT * FROM " + tableName;  // DANGEROUS
// Fix: whitelist table names
Set<String> ALLOWED_TABLES = Set.of("users", "orders", "products");
if (!ALLOWED_TABLES.contains(tableName)) throw new IllegalArgumentException();

// ❌ LIKE with user input
String sql = "WHERE name LIKE '%" + userInput + "%'";
// Fix: parameterize and escape LIKE special chars
String sql = "WHERE name LIKE :pattern";
params.put("pattern", "%" + userInput.replace("%","\\%").replace("_","\\_") + "%");
```

### Second-Order SQL Injection

Data is safely stored initially but later used unsafely in another query. Prevention: always use parameterized queries, even when reading from DB.

---

## Encryption

### Encryption in Transit (TLS)

```ini
# MySQL: require TLS for remote connections
# my.cnf
[mysqld]
ssl-ca=/etc/mysql/ca.pem
ssl-cert=/etc/mysql/server-cert.pem
ssl-key=/etc/mysql/server-key.pem
require_secure_transport = ON

# Force TLS for specific user
ALTER USER 'app_user'@'%' REQUIRE SSL;
```

```yaml
# Spring: TLS DB connection
spring:
  datasource:
    url: jdbc:mysql://db-host:3306/mydb?useSSL=true&requireSSL=true&verifyServerCertificate=true
```

### Encryption at Rest

Options:
1. **Transparent Data Encryption (TDE)**: DB encrypts data files automatically (MySQL Enterprise, SQL Server, Oracle). Application transparent.
2. **File system encryption**: LUKS (Linux), encrypted EBS volumes (AWS). DB doesn't know about it.
3. **Application-level encryption**: encrypt sensitive fields before storing. DB sees ciphertext.

```java
// Application-level field encryption
@Convert(converter = EncryptedStringConverter.class)
@Column(name = "ssn")
private String socialSecurityNumber;

@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {
    public String convertToDatabaseColumn(String plain) {
        return AESUtil.encrypt(plain, SECRET_KEY);
    }
    public String convertToEntityAttribute(String encrypted) {
        return AESUtil.decrypt(encrypted, SECRET_KEY);
    }
}
```

### Column-Level Encryption (PostgreSQL pgcrypto)

```sql
-- Encrypt
INSERT INTO users (name, ssn)
VALUES ('Alice', pgp_sym_encrypt('123-45-6789', 'my_passphrase'));

-- Decrypt (only authorized users)
SELECT name, pgp_sym_decrypt(ssn::bytea, 'my_passphrase') AS ssn
FROM users;
```

---

## Password Storage

**Never store plaintext passwords!**

```java
// ✅ BCrypt (Spring Security default)
PasswordEncoder encoder = new BCryptPasswordEncoder(12); // cost factor 12
String hash = encoder.encode(plainPassword);
boolean matches = encoder.matches(plainPassword, hash);

// BCrypt hash example: $2a$12$... (includes salt + cost)

// ✅ Argon2 (preferred for new applications)
PasswordEncoder argon2 = new Argon2PasswordEncoder(
    16, 32, 1, 65536, 3);  // saltLength, hashLength, parallelism, memory, iterations
```

---

## Auditing

Track who did what and when.

### PostgreSQL Audit with pgaudit

```ini
# postgresql.conf
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'write, ddl'  # log INSERT/UPDATE/DELETE + DDL
pgaudit.log_client = on
pgaudit.log_relation = on
```

### Application-Level Audit Trail

```java
// Hibernate Envers: automatic audit tables
@Entity
@Audited  // creates users_AUD table automatically
public class User {
    @Id Long id;
    String email;
    String role;
}

// Query audit history
AuditReader reader = AuditReaderFactory.get(entityManager);
List<Number> revisions = reader.getRevisions(User.class, userId);
User userAtRevision = reader.find(User.class, userId, revisions.get(0));
```

---

## Security Hardening Checklist

```
Authentication:
  □ No default credentials (change root/postgres passwords)
  □ Require strong passwords
  □ Restrict remote access by IP where possible
  □ Use TLS for all connections (especially across network)
  □ Disable or restrict remote root login

Authorization:
  □ App DB user has only necessary privileges (no DROP, no CREATE)
  □ Separate users for read-only and read-write
  □ No shared credentials across environments (dev ≠ prod)
  □ Use connection-level IP restrictions

Application:
  □ All SQL uses parameterized queries / ORM
  □ No dynamic SQL with user input
  □ Secrets (DB passwords) in vault / env vars, never in code/git

Data:
  □ TDE or filesystem encryption at rest
  □ Sensitive fields (SSN, CC numbers) encrypted at column/app level
  □ Passwords hashed with bcrypt/argon2 (never MD5/SHA1)

Network:
  □ DB not publicly accessible (VPC, firewall, no public IP)
  □ DB port not exposed to internet
  □ SSL/TLS required for remote connections

Monitoring:
  □ Audit logging enabled for DDL and sensitive DML
  □ Failed login attempts logged and alerted
  □ Alerting on privilege escalation
```

---

## 🎯 Interview Questions

**Q1. What is SQL injection and how do you prevent it?**
> SQL injection is when an attacker inserts SQL code into a query through user input, manipulating the query's logic. Prevention: always use parameterized queries / prepared statements — never concatenate user input into SQL strings. Use an ORM (Hibernate/JPA) which parameterizes automatically. For dynamic identifiers, use a whitelist.

**Q2. What is the principle of least privilege in DB security?**
> Grant only the minimum permissions needed. The application DB user should only have SELECT, INSERT, UPDATE, DELETE on its own schema — never DROP TABLE, CREATE, or GRANT. DBAs have higher privileges. Separate read-only credentials for reporting queries. Restrict connections by source IP.

**Q3. What is the difference between encryption in transit and encryption at rest?**
> In transit: encrypts data over the network (TLS/SSL between app and DB) — prevents network eavesdropping. At rest: encrypts data files on disk (TDE, encrypted filesystems, or application-level field encryption) — prevents unauthorized access to physical storage. Production systems need both.

**Q4. How should passwords be stored in a database?**
> Never in plaintext or reversible encryption. Use a slow adaptive hashing algorithm: BCrypt or Argon2. These algorithms are intentionally slow (configurable cost factor) to resist brute-force attacks and automatically include a per-password salt (preventing rainbow table attacks). MD5 and SHA-1/SHA-256 are too fast and never acceptable for passwords.

**Q5. What is Row-Level Security (RLS) in PostgreSQL?**
> RLS policies control which rows a user can see or modify within a table. Each policy defines a predicate applied to every query. Useful for multi-tenant applications where tenant A should never access tenant B's data — enforced at the DB level, not just application level. Enabled with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

**Q6. What is second-order SQL injection?**
> Data is safely stored (parameterized write) but later retrieved and used unsafely in another dynamic query. Example: username `admin'--` is stored safely, but later a query like `"UPDATE users SET role='user' WHERE name='" + dbResult + "'"` is vulnerable. Prevention: always parameterize queries, including those reading from the database.

**Q7. How would you audit all changes to a sensitive table?**
> Options: DB-level audit extension (pgaudit for PostgreSQL, MySQL audit log plugin); application-level with Hibernate Envers (auto-creates `_AUD` tables with revision history); database triggers that INSERT to an audit table on UPDATE/DELETE; CDC tools like Debezium that capture row-level changes from WAL/binlog.

**Q8. Why shouldn't the database be directly accessible from the internet?**
> Exposure risks: brute-force authentication attacks, exploitation of unpatched vulnerabilities, data exfiltration if credentials are leaked. Databases should be in a private network (VPC), accessible only from application servers. Use jump hosts / bastion hosts or VPN for DBA access. The only ports exposed to the internet should be your application's API.

---

## Advanced Editorial Pass: Database Security with Operational Accountability

### Senior Engineering Focus
- Design least-privilege access at role and query boundary levels.
- Treat encryption, key management, and auditing as one control surface.
- Build detection and response workflows for anomalous access patterns.

### Failure Modes to Anticipate
- Privilege creep from temporary grants never revoked.
- Audit logs present but not actionable or correlated.
- Weak secret rotation practices exposing long-lived credentials.

### Practical Heuristics
1. Review privilege model on a fixed cadence with service owners.
2. Correlate audit trails with application identity context.
3. Automate credential rotation and break-glass procedures.

### Compare Next
- [Backup & Recovery](./backup-recovery.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
- [Performance & Monitoring](./performance-monitoring.md)
