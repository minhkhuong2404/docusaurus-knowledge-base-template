---
id: backup-recovery
title: Backup & Recovery
description: RPO, RTO, backup strategies, point-in-time recovery, logical vs physical backups, and disaster recovery planning.
tags: [database, backup, recovery, rpo, rto, pitr, disaster-recovery, mysql, postgresql]
sidebar_position: 12
---

# Backup & Recovery

## Core Concepts

### RPO — Recovery Point Objective

**How much data loss is acceptable?**

> "If a disaster happens right now, how far back can we afford to restore to?"

- RPO = 0 → zero data loss (synchronous replication)
- RPO = 1 hour → up to 1 hour of data loss acceptable
- RPO = 24 hours → daily backup is sufficient

### RTO — Recovery Time Objective

**How fast must we recover?**

> "How long can the system be down before business impact is unacceptable?"

- RTO = 1 minute → hot standby, instant failover
- RTO = 1 hour → restore from replica or recent backup
- RTO = 24 hours → restore from daily backup is acceptable

```
Business Impact
     ↑
     │         ❌ Outage
     │
     │──────────────────→ RTO (must be back online by here)
     │
     │←── RPO ──→ (max data loss window)
Time: [last backup]  [disaster]  [RTO deadline]
```

---

## Backup Types

### Logical Backup

Exports data as SQL statements or structured format (CSV, JSON).

| Tool | Database | Output |
|------|---------|--------|
| `mysqldump` | MySQL | SQL INSERT statements |
| `pg_dump` / `pg_dumpall` | PostgreSQL | SQL or custom format |
| `mongodump` | MongoDB | BSON files |

```bash
# MySQL — logical backup
mysqldump -u root -p \
  --single-transaction \           # consistent snapshot (InnoDB)
  --routines \                     # include stored procedures
  --triggers \                     # include triggers
  --databases mydb > backup.sql

# Restore
mysql -u root -p mydb < backup.sql

# PostgreSQL — logical backup
pg_dump -U postgres -d mydb \
  --format=custom \                # compressed, parallel restore
  --file=mydb.dump

# Restore
pg_restore -U postgres -d mydb --parallel=4 mydb.dump

# Dump all databases including roles
pg_dumpall > full_backup.sql
```

**Pros:**
- Human-readable (SQL format)
- Portable across versions and OS
- Can restore individual tables

**Cons:**
- Slow for large DBs (must re-execute all INSERT/DDL)
- Point-in-time is coarse (snapshot at backup time)

---

### Physical Backup

Copies the raw data files directly.

| Tool | Database |
|------|---------|
| `xtrabackup` (Percona) | MySQL/MariaDB |
| `pg_basebackup` | PostgreSQL |
| File system snapshot (LVM, EBS snapshot) | Any |

```bash
# MySQL — physical backup (Percona XtraBackup)
xtrabackup --backup --user=root --password=secret \
  --target-dir=/backup/2024-01-15

# Prepare (apply redo log)
xtrabackup --prepare --target-dir=/backup/2024-01-15

# Restore (copy files to data dir)
xtrabackup --copy-back --target-dir=/backup/2024-01-15

# PostgreSQL — base backup
pg_basebackup -U replicator -D /backup/base \
  --wal-method=stream \           # stream WAL during backup
  --format=tar \
  --gzip \
  --progress
```

**Pros:**
- Fast backup and restore (file copy vs SQL execution)
- Consistent with InnoDB hot backup

**Cons:**
- Not portable across major versions or OS/hardware
- Can't restore individual tables easily

---

### Snapshot Backup

Use OS/cloud storage snapshots for instant backups:

```bash
# AWS EBS snapshot (via CLI or console)
aws ec2 create-snapshot \
  --volume-id vol-0abc123 \
  --description "MySQL backup $(date +%Y-%m-%d)"

# Must quiesce DB first (InnoDB: flush tables with read lock)
# Or use XtraBackup which handles consistency
```

---

## Point-In-Time Recovery (PITR)

Restore to any point in time using a **base backup** + **transaction logs (WAL/binlog)**.

### PostgreSQL PITR

```bash
# 1. Take a base backup
pg_basebackup -D /backup/base --wal-method=stream

# 2. Continuously archive WAL files
# postgresql.conf:
archive_mode = on
archive_command = 'cp %p /wal_archive/%f'

# 3. Restore to specific time
# Restore base backup to data dir, then create recovery.conf (PG11) or recovery signal file (PG12+)

# recovery.signal (PG 12+)
touch $PGDATA/recovery.signal

# postgresql.conf:
restore_command = 'cp /wal_archive/%f %p'
recovery_target_time = '2024-01-15 14:30:00'
recovery_target_action = 'promote'
```

### MySQL PITR

```bash
# 1. Enable binary logs
# my.cnf: log_bin = /var/log/mysql/mysql-bin.log

# 2. Take a full backup
mysqldump --single-transaction --master-data=2 mydb > full_backup.sql

# 3. Restore full backup
mysql mydb < full_backup.sql

# 4. Apply binlog from backup position to target time
mysqlbinlog \
  --start-position=154 \
  --stop-datetime="2024-01-15 14:30:00" \
  /var/log/mysql/mysql-bin.000001 | mysql mydb
```

---

## Backup Schedule Strategies

### Grandfather-Father-Son (GFS)

A tiered retention scheme:

```
Daily backups  (Son):        Keep last 7 days
Weekly backups (Father):     Keep last 4 weeks
Monthly backups (Grandfather): Keep last 12 months
Yearly backups:              Keep last N years

Storage: 7 + 4 + 12 + N backups instead of 365+
```

### Continuous WAL Archiving

Used with tools like **Barman** (PostgreSQL) or **AWS RDS automated backups**:

```
Base backup every night
WAL/binlog archived every 5 minutes (or continuously)
→ RPO = 5 minutes, any minute can be restored to
```

---

## Managed Database Backup (AWS RDS / Aurora)

```
Automated backups:
- Retention: 1–35 days
- Storage: Amazon S3 (automated)
- PITR: restore to any second within retention window

Manual snapshots:
- Kept until deleted
- Used for long-term retention

Aurora:
- Continuous backup to S3 (no backup window needed)
- PITR to any second
- Clone from snapshot in minutes
```

---

## Backup Verification

A backup that hasn't been tested is not a backup!

```bash
# Automated restore test
1. Restore latest backup to test environment
2. Run integrity checks
3. Verify data freshness (check latest timestamp)
4. Run smoke test queries
5. Alert if any step fails

# PostgreSQL data integrity
pg_dump mydb | pg_restore --schema-only  # verify structure
SELECT COUNT(*) FROM pg_catalog.pg_class WHERE relkind = 'r';  # count tables
```

---

## Disaster Recovery Checklist

```
□ RPO and RTO defined and agreed with business
□ Backup schedule matches RPO requirement
□ Offsite / cloud backup storage (not same datacenter)
□ Encryption at rest for backups
□ Backup verification automated (weekly restore test)
□ Runbook documented for recovery procedure
□ Standby replica for hot failover (if RTO < 1 hour)
□ Monitoring: alert on backup failure, replication lag
□ Tested: last full DR drill date recorded
```

---

## Spring Boot DB Migration with Flyway

```java
// Flyway manages schema versioning — critical for reproducible deploys
// src/main/resources/db/migration/V1__init.sql
// src/main/resources/db/migration/V2__add_orders_index.sql

// application.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
```

```sql
-- V2__add_orders_index.sql
CREATE INDEX CONCURRENTLY idx_orders_user_status
ON orders (user_id, status);
-- CONCURRENTLY: no table lock in PostgreSQL
```

:::tip
Always test migrations on a copy of production data before deploying. Use `CREATE INDEX CONCURRENTLY` (PostgreSQL) to avoid locking.
:::

---

## 🎯 Interview Questions

**Q1. What is the difference between RPO and RTO?**
> RPO (Recovery Point Objective) is how much data loss is acceptable — the maximum age of data that must be recovered. RTO (Recovery Time Objective) is how long the system can be down before recovery must be complete. They drive backup frequency and standby architecture decisions respectively.

**Q2. What is the difference between a logical and physical backup?**
> Logical: exports data as SQL or structured format (pg_dump, mysqldump). Human-readable, portable across versions, can restore individual tables. Slow to restore for large DBs. Physical: copies raw data files (pg_basebackup, xtrabackup). Fast to backup/restore, consistent hot backup for InnoDB. Not portable across OS/versions, harder to restore individual tables.

**Q3. What is Point-In-Time Recovery (PITR) and how does it work?**
> PITR lets you restore a database to any specific moment in time. It works by: taking a full base backup, then continuously archiving transaction logs (WAL for PostgreSQL, binlog for MySQL). To restore, replay the base backup then apply logs up to the target time. Provides fine-grained recovery with minimal data loss.

**Q4. What is the Grandfather-Father-Son backup strategy?**
> A tiered retention scheme: keep 7 daily (Son), 4 weekly (Father), 12 monthly (Grandfather) backups. Instead of keeping 365 daily backups, you keep 23 total. This balances recovery granularity, retention length, and storage cost.

**Q5. How would you achieve zero data loss (RPO = 0) for a critical database?**
> Use synchronous replication: write is only acknowledged to the client after being committed on the primary AND confirmed on at least one replica. PostgreSQL: `synchronous_commit = on` with a sync standby. MySQL: semi-synchronous with at least one ack. Trade-off: write latency increases by the network round-trip time to the replica.

**Q6. What happens if you restore a database but never tested the backup?**
> Backup files may be corrupt, incomplete, or incompatible with the current version. The restore procedure may have errors that would fail in a crisis. Data may be incomplete (backup didn't include all databases/tables). Always automate regular restore tests to a staging environment and verify data integrity.

**Q7. What is `--single-transaction` in mysqldump and why is it important?**
> `--single-transaction` issues a `START TRANSACTION` with `REPEATABLE READ` isolation before dumping, creating a consistent snapshot without locking tables (for InnoDB). Without it, running transactions could cause inconsistent data in the dump. This is essential for live backups of production InnoDB databases.

**Q8. How do you perform a schema migration with zero downtime?**
> Use backward-compatible migrations in phases: (1) add new column as nullable (no locking); (2) deploy app that writes to both old and new column; (3) backfill existing rows; (4) add NOT NULL + default; (5) deploy app using only new column; (6) drop old column. Use `CREATE INDEX CONCURRENTLY` (PostgreSQL) to avoid table locks on index creation. Tools: Flyway, Liquibase handle versioning.

---

## Advanced Editorial Pass: Backup and Recovery as Business Continuity Engineering

### Senior Engineering Focus
- Translate RPO/RTO into concrete technical controls and rehearsals.
- Treat restore validation as mandatory, not optional.
- Integrate backup strategy with schema changes and topology evolution.

### Failure Modes to Anticipate
- Backups succeed but restores fail due to untested procedures.
- Recovery times far above contractual objectives.
- Snapshot strategy missing critical transaction windows.

### Practical Heuristics
1. Run regular restore drills with timed objectives.
2. Automate integrity checks on backup artifacts.
3. Keep recovery runbooks versioned and role-specific.

### Compare Next
- [Replication & Partitioning](./replication-partitioning.md)
- [Schema Migrations](./schema-migrations.md)
- [Database Security](./database-security.md)
