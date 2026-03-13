---
id: schema-migrations
title: Schema Migrations
description: Managing database schema changes safely in production — Flyway, Liquibase, zero-downtime migration patterns, and rollback strategies.
tags: [database, migrations, flyway, liquibase, schema, zero-downtime, versioning, spring]
sidebar_position: 15
---

# Schema Migrations

## Why Managed Migrations?

Ad-hoc schema changes (running SQL scripts manually) lead to:
- Environments out of sync (dev ≠ staging ≠ prod)
- No audit trail of what changed and when
- Inconsistent state when multiple developers work simultaneously
- No rollback path

Migration tools solve this by **versioning schema changes as code**.

---

## Flyway

The most popular Java/Spring migration tool. Migrations are plain SQL (or Java) files versioned by name.

### Naming Convention

```
V{version}__{description}.sql
R{description}.sql   ← repeatable (no version, re-applied when changed)
U{version}__{description}.sql  ← undo (Flyway Teams)

Examples:
V1__create_users_table.sql
V2__add_orders_table.sql
V3__add_index_orders_user_id.sql
V3.1__add_status_column.sql    ← sub-versions
R__create_views.sql            ← repeatable migration
```

### Spring Boot Setup

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<!-- MySQL needs this too -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true     # for existing databases
    out-of-order: false           # reject out-of-order migrations
    validate-on-migrate: true     # checksum validation
    table: flyway_schema_history  # metadata table name
    placeholders:
      schema: myapp               # use ${schema} in SQL files
```

### Migration Files

```sql
-- V1__create_schema.sql
CREATE TABLE users (
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    email      VARCHAR(255) NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- V2__create_orders.sql
CREATE TABLE orders (
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id    BIGINT NOT NULL,
    total      DECIMAL(10, 2) NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- V3__add_orders_indexes.sql
CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_status_created ON orders (status, created_at);
```

### Flyway Schema History Table

```sql
SELECT * FROM flyway_schema_history;
-- installed_rank | version | description              | type | checksum   | installed_on        | success
-- 1              | 1       | create schema            | SQL  | 1234567890 | 2024-01-01 10:00:00 | true
-- 2              | 2       | create orders            | SQL  | 987654321  | 2024-01-02 09:00:00 | true
```

### Flyway Commands

```bash
# Maven plugin
mvn flyway:migrate    # apply pending migrations
mvn flyway:info       # show migration status
mvn flyway:validate   # verify checksums match files
mvn flyway:repair     # fix failed migration records
mvn flyway:clean      # DROP ALL objects (NEVER in production!)
mvn flyway:baseline   # mark existing DB as version N

# Gradle
./gradlew flywayMigrate
./gradlew flywayInfo
```

---

## Liquibase

More structured: changes are defined in XML, YAML, JSON, or SQL. Tracks changes via `changeSet` IDs.

### Spring Boot Setup

```xml
<dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
</dependency>
```

```yaml
spring:
  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.yaml
    enabled: true
```

### Changelog File (YAML)

```yaml
# db/changelog/db.changelog-master.yaml
databaseChangeLog:
  - include:
      file: db/changelog/001-create-users.yaml
  - include:
      file: db/changelog/002-create-orders.yaml
```

```yaml
# db/changelog/001-create-users.yaml
databaseChangeLog:
  - changeSet:
      id: 001-create-users
      author: alice
      changes:
        - createTable:
            tableName: users
            columns:
              - column:
                  name: id
                  type: BIGINT
                  autoIncrement: true
                  constraints:
                    primaryKey: true
              - column:
                  name: email
                  type: VARCHAR(255)
                  constraints:
                    nullable: false
                    unique: true
              - column:
                  name: created_at
                  type: TIMESTAMP
                  defaultValueComputed: CURRENT_TIMESTAMP
      rollback:
        - dropTable:
            tableName: users
```

### Liquibase vs Flyway

| | Flyway | Liquibase |
|--|--------|---------|
| Migration format | SQL (primary), Java | XML, YAML, JSON, SQL |
| DB-neutral syntax | ❌ (write SQL per DB) | ✅ (abstract change types) |
| Rollback support | ❌ (manual undo files) | ✅ (built-in rollback) |
| Diff tool | ❌ | ✅ (`generateChangeLog`) |
| Simplicity | Simpler | More complex |
| Spring Boot | ✅ Auto-configured | ✅ Auto-configured |
| Best for | SQL-first teams | Multi-DB, rollback-needed |

---

## Zero-Downtime Migration Patterns

The hardest part of schema changes is doing them without taking the app down.

### The Expand–Contract (Parallel Change) Pattern

Used for renaming columns, changing types, splitting tables.

```
Phase 1: EXPAND — add new structure (backward-compatible)
Phase 2: MIGRATE — backfill data, update app to write to both
Phase 3: CONTRACT — remove old structure
```

### Example: Rename Column `phone` → `phone_number`

```sql
-- Phase 1: Add new column (online, no downtime)
-- V10__add_phone_number_column.sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- Deploy app v2: writes to BOTH phone and phone_number
-- Reads from phone_number, falls back to phone

-- Phase 2: Backfill (run during low traffic or in batches)
-- V11__backfill_phone_number.sql
UPDATE users SET phone_number = phone WHERE phone_number IS NULL;

-- Phase 3: Contract (after all app instances use phone_number)
-- V12__drop_old_phone_column.sql
ALTER TABLE users DROP COLUMN phone;
```

### Example: Adding a NOT NULL Column

```sql
-- ❌ Breaks with downtime (every existing row violates constraint)
ALTER TABLE orders ADD COLUMN region VARCHAR(50) NOT NULL;

-- ✅ Zero-downtime: three migrations
-- V10: Add as nullable
ALTER TABLE orders ADD COLUMN region VARCHAR(50) NULL;

-- V11: Backfill (run in background)
UPDATE orders SET region = 'US' WHERE region IS NULL;

-- V12: Add NOT NULL constraint (after backfill + app always sets it)
ALTER TABLE orders ALTER COLUMN region SET NOT NULL;
-- PostgreSQL: fast if table is verified clean
-- MySQL: may rebuild table — use pt-online-schema-change for large tables
```

### Large Table Alterations

```bash
# MySQL: use pt-online-schema-change (no table lock)
pt-online-schema-change \
  --alter "ADD COLUMN region VARCHAR(50) NULL" \
  --host=localhost \
  --user=root \
  D=mydb,t=orders \
  --execute

# PostgreSQL: CREATE INDEX CONCURRENTLY (no table lock)
CREATE INDEX CONCURRENTLY idx_orders_region ON orders (region);
```

---

## Batch Backfill Strategy

Never run one giant UPDATE — it locks rows and fills undo logs.

```sql
-- ❌ Dangerous: locks all rows
UPDATE orders SET region = 'US' WHERE region IS NULL;

-- ✅ Batch update in chunks
DO $$
DECLARE
    rows_updated INT;
BEGIN
    LOOP
        UPDATE orders
        SET region = 'US'
        WHERE id IN (
            SELECT id FROM orders WHERE region IS NULL LIMIT 1000
        );

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        EXIT WHEN rows_updated = 0;

        PERFORM pg_sleep(0.1);  -- small pause between batches
    END LOOP;
END $$;
```

```java
// Spring Batch approach
@Scheduled(fixedDelay = 100)
@Transactional
public void backfillRegion() {
    int updated = jdbcTemplate.update(
        "UPDATE orders SET region = 'US' WHERE region IS NULL LIMIT 1000");
    if (updated == 0) scheduler.shutdown();
}
```

---

## Migration Testing

```java
// Test migrations with Testcontainers
@SpringBootTest
@Testcontainers
class MigrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0");

    @Test
    void allMigrationsApplySuccessfully() {
        Flyway flyway = Flyway.configure()
            .dataSource(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword())
            .load();

        MigrateResult result = flyway.migrate();
        assertThat(result.success).isTrue();
        assertThat(result.migrationsExecuted).isGreaterThan(0);
    }
}
```

---

## Common Migration Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Editing existing migration file | Checksum mismatch, `flyway:validate` fails | Never edit; add a new migration |
| Adding NOT NULL without default | Breaks in-flight transactions | Expand-contract pattern |
| Large ALTER TABLE | Locks table for minutes | Use pt-osc or `CONCURRENTLY` |
| Single giant UPDATE | Long transaction, lock contention | Batch update |
| `flyway:clean` in production | Drops all objects | Disable in prod config |
| Migration in same deploy as code | App might start before migration | Run migration before app deploy (init container) |

---

## Production Deployment Workflow

```
1. CI/CD pipeline:
   a. Run flyway:validate (confirm checksums match)
   b. Run migrations against staging
   c. Run integration tests against migrated DB
   d. If green → deploy to production

2. Production deploy order:
   a. Run db migrations (init container / pre-deploy hook)
   b. Deploy new app version
   c. Verify app health check passes

3. Rollback:
   a. App: redeploy previous version (must be backward-compatible with new schema)
   b. DB: apply undo migration / run reverse script
      (Flyway Community: manual SQL; Liquibase: rollback command)
```

---

## 🎯 Interview Questions

**Q1. What is a database migration tool and why is it needed?**
> Migration tools version database schema changes as code files that are tracked and applied in order. Without them, environments drift apart (dev ≠ prod), there's no audit trail, and onboarding new developers requires manual setup. Tools like Flyway and Liquibase ensure repeatable, consistent schema evolution across all environments.

**Q2. What is the Expand-Contract pattern in zero-downtime migrations?**
> A three-phase technique for schema changes that would otherwise require downtime. Expand: add new structure (column, table) alongside old — backward-compatible. Migrate: update app to write both old and new, backfill existing data. Contract: remove the old structure after all code uses the new. Each phase can be deployed independently.

**Q3. Why should you never edit an existing Flyway migration file after it's been applied?**
> Flyway stores a checksum of each applied migration in the schema history table. Editing a file changes its checksum, causing `flyway:validate` to fail (or migrate to abort with a checksum mismatch error). All changes must be made in new migration files with higher version numbers.

**Q4. How would you add a NOT NULL column to a large production table without downtime?**
> Three migrations: (1) Add the column as `NULL` — instant online DDL; (2) Backfill existing rows in small batches with a pause between each batch to avoid lock contention; (3) Add `NOT NULL` constraint after verifying all rows are populated and the app always sets the value on insert. For MySQL, use pt-online-schema-change for the final ALTER.

**Q5. What is the difference between Flyway and Liquibase?**
> Flyway uses versioned SQL files (or Java) — simple, SQL-first, no built-in rollback. Liquibase uses structured changelogs (XML/YAML/JSON/SQL) with abstract change types that generate DB-specific SQL — supports rollback, diff generation, and multi-DB deployment. Flyway is simpler; Liquibase is more powerful for teams needing portability and rollback.

**Q6. How do you safely backfill a column in a large table?**
> In small batches with pauses between them (e.g., 1000 rows, sleep 100ms) to avoid long-running transactions, excessive undo log growth, and row lock contention. Use a background job or scheduled task outside the main migration (since Flyway/Liquibase run synchronously at startup). Verify backfill completes before adding constraints.

**Q7. What is `baseline-on-migrate` in Flyway and when is it used?**
> When adding Flyway to an existing database that wasn't previously managed by Flyway, `baseline-on-migrate` marks the current schema state as version 1 (or a specified baseline version) without running any migration files at or below that version. This allows Flyway to take over management without re-running scripts that were already applied manually.

**Q8. How should database migrations be ordered in a CI/CD deployment pipeline?**
> Migrations should run *before* the new app version starts — typically as a Kubernetes init container, a pre-deploy hook, or a separate pipeline step. This ensures the schema is ready before any new code queries it. Migrations must be backward-compatible (new schema works with both old and new app version) to support rollback without a DB rollback.

---

## Advanced Editorial Pass: Migration Strategy for Zero-Downtime Delivery

### Senior Engineering Focus
- Design expand-contract flows that tolerate mixed-version deployments.
- Treat rollback and forward-fix as first-class migration outcomes.
- Coordinate schema and application rollout as one delivery unit.

### Failure Modes to Anticipate
- Breaking changes deployed before compatible application code.
- Long-running locks during high-traffic windows.
- Rollback paths that reintroduce data inconsistency.

### Practical Heuristics
1. Use phased migrations with compatibility windows.
2. Load-test migration scripts on production-like snapshots.
3. Automate migration safety checks in CI/CD.

### Compare Next
- [Database Design & Normalization](./database-design.md)
- [Replication & Partitioning](./replication-partitioning.md)
- [Backup & Recovery](./backup-recovery.md)
