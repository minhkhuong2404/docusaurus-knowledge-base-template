---
id: postgresql-wal-replication-lag-playbook
title: "PostgreSQL WAL & Replication: The 380MB No-Op Update, Orphan Slots & 2 AM Disk-Full Playbook"
sidebar_label: "WAL, Replication & 2 AM Disk-Full Playbook"
description: "PostgreSQL Write-Ahead Logging and replication mechanics: why a no-op UPDATE generates 380MB of WAL, replication lag causes, orphan replication slots exhausting disk, silent archive_command failures, and the 2 AM 95% disk emergency playbook."
tags: [database, postgresql, wal, replication, replication-slot, archive-command, disk-full, runbook, sre]
sidebar_position: 9
---

import PostgresWalReplicationPlaybookDiagram from '@site/src/components/PostgresWalReplicationPlaybookDiagram';

# PostgreSQL WAL & Replication: The 380MB No-Op Update, Orphan Slots & 2 AM Disk-Full Playbook

In production database operations, one of the most stressful pages an on-call engineer can receive at 2:00 AM reads:

```text
ALERT: PostgreSQL disk space utilization is 96.4% on /var/lib/postgresql/data
Estimated time until 100% full: 18 minutes!
```

If disk capacity reaches 100%, PostgreSQL enters an immediate **PANIC** state and shuts down to protect data integrity. Once halted, restarting the database can fail because even crash recovery requires writing additional WAL records.

This article examines the physical causes of Write-Ahead Logging (WAL) amplification, explores why an `UPDATE` that "changes nothing" can generate hundreds of megabytes of WAL, and provides a **battle-tested emergency triage playbook** to reclaim disk space within minutes without corrupting replication.

<PostgresWalReplicationPlaybookDiagram initialTab="noop_wal" />

---

## 1. The 380MB No-Op Update: When "Changing Nothing" Costs Dearly

Consider a nightly maintenance job updating customer account statuses:

```sql
UPDATE accounts SET status = 'ACTIVE' WHERE tenant_id = 42;
```

Suppose all 1,000,000 accounts belonging to tenant 42 **are already in the `ACTIVE` state**. Developers often assume: *"No values are modified, so this statement is a no-op; the database will simply skip these rows."*

### Physical Storage Engine Reality in PostgreSQL
Unlike MySQL (which inspects prior column values and avoids writing if identical), PostgreSQL is an **Append-Only MVCC Storage Engine**:
1. By default, it **does not compare** incoming values against existing column data.
2. For each of the 1,000,000 rows, PostgreSQL executes:
   - Marks the existing tuple as dead by writing `xmax`.
   - Allocates and inserts a **completely new tuple** into the heap page.
   - Generates a **WAL Record** containing the full image of the newly inserted tuple and appends it to active WAL segments in `pg_wal/`.
3. If the table includes long text or JSON columns stored out-of-line in TOAST tables, TOAST pointers may also be rewritten.

```text
Physical Impact of a No-Op UPDATE on 1 Million Rows:
├── Actual Business Data Modified: 0 bytes
├── Dead Tuples Created in Heap: 1,000,000 tuples (requiring future VACUUM)
├── Total WAL Volume Generated: ~382 MB!
└── Replication Replay Lag on Standby: Spikes by 45 seconds!
```

### Production Prevention: Guard Predicates in SQL
Adding a single guard condition reduces generated WAL volume from **382MB to exactly 0 KB**:

```sql
-- ✅ Prevent redundant tuple generation using IS DISTINCT FROM (NULL-safe):
UPDATE accounts 
SET status = 'ACTIVE' 
WHERE tenant_id = 42 
  AND status IS DISTINCT FROM 'ACTIVE';
```

---

## 2. Orphan Replication Slots: The #1 Cause of Disk Exhaustion

In PostgreSQL streaming replication, a **Replication Slot** acts as a data retention guarantee:
- When a Standby replica or Change Data Capture (CDC) service (e.g., Debezium) connects, it creates a named replication slot.
- The slot tracks the consumer's acknowledged Log Sequence Number (**`restart_lsn`**).
- **PostgreSQL's Core Invariant**: *As long as an active or inactive replication slot has not confirmed reading a WAL segment, PostgreSQL CANNOT delete or recycle that WAL file, even after a checkpoint!*

<PostgresWalReplicationPlaybookDiagram initialTab="orphan_slots" />

### The Abandoned Slot Incident
1. An engineer spins up a local Debezium instance to test event streaming against the staging or production replica.
2. The testing session finishes, and the engineer terminates their local machine—**forgetting to drop the replication slot on the database**.
3. PostgreSQL observes the slot in `pg_replication_slots` with `active = false`.
4. Production transactions continue generating new 16MB WAL segments.
5. Because the abandoned slot is frozen at yesterday's LSN, **PostgreSQL retains every single WAL segment produced since that moment**!
6. The `pg_wal/` directory expands from 5GB to 50GB, 200GB, and 500GB until disk space reaches 100%.

### Query to Detect Orphan Replication Slots
```sql
SELECT 
    slot_name,
    slot_type,
    active,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_bytes
FROM pg_replication_slots
ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC;
```
If an inactive slot (`active = false`) is retaining tens or hundreds of gigabytes, you have identified the primary disk consumer.

---

## 3. `archive_command` Silent Failures: Indirect Disk Satiation

When Continuous Archiving (`archive_mode = on`) is configured to back up WAL segments to cloud storage (e.g., `aws s3 cp %p s3://backup/%f`):

<PostgresWalReplicationPlaybookDiagram initialTab="archive_fail" />

- PostgreSQL's Archiver process sequentially invokes the script defined in `archive_command`.
- **If the script exits with a non-zero return code** (due to expired IAM roles, permission errors, full destination buckets, or network timeouts):
  - PostgreSQL flags the segment as **unarchived**.
  - The archiver process **halts its queue and repeatedly retries that single file**!
  - No subsequent WAL segments can be deleted from `pg_wal/` because they must wait for the head of the archive queue to clear.
  - Normal read/write queries continue without error, while `pg_wal/` silently consumes disk space.

### Archiver Health Inspection
```sql
SELECT 
    archived_count,
    last_archived_wal,
    last_archived_time,
    failed_count,
    last_failed_wal,
    last_failed_time
FROM pg_stat_archiver;
```
If `failed_count > 0` and `last_failed_time > last_archived_time`, the archiver is blocked and accumulating backlog.

---

## 4. The 2:00 AM Emergency Playbook: Disk Utilization at 95%

<PostgresWalReplicationPlaybookDiagram initialTab="disk_playbook" />

When disk free space drops below 5%, execute the following structured recovery procedure:

### ⛔ CRITICAL RULE: NEVER RUN `rm` ON `pg_wal`!
Under intense panic, engineers sometimes run:
```bash
# ❌ THIS DESTROYS DATABASE INTEGRITY AND CRASH RECOVERY:
rm /var/lib/postgresql/data/pg_wal/*
```
Deleting active WAL files corrupts the transaction log, destroys replica synchronization, and makes crash recovery impossible. The database will fail to restart without manual catalog surgery and irreversible data loss!

---

### Safe 4-Step Disk Recovery Procedure

#### Step 1: Drop Abandoned Replication Slots
Inspect `pg_replication_slots`. If an inactive slot is holding back WAL, drop it immediately:
```sql
SELECT pg_drop_replication_slot('abandoned_slot_name');
```
*Note*: Dropping the slot unpins the WAL threshold, but PostgreSQL will not immediately delete files on disk until the next checkpoint. Proceed to Step 2.

#### Step 2: Issue a Forced Checkpoint
Run `CHECKPOINT` directly from a superuser session:
```sql
CHECKPOINT;
```
This forces PostgreSQL to flush dirty buffers and **recycle or remove all unpinned WAL files**, freeing gigabytes of disk space within 10 to 30 seconds.

#### Step 3: Temporarily Constrain `wal_keep_size`
If `wal_keep_size` is configured generously (e.g., `64GB` to cushion against replica network disconnects):
```sql
-- Temporarily reduce retention to free emergency disk capacity:
ALTER SYSTEM SET wal_keep_size = '2GB';
SELECT pg_reload_conf();
CHECKPOINT;
```

#### Step 4: Mitigate Archiver Stalls and Clean Temp Spills
If `archive_command` is broken and disk capacity is approaching 100%:
- Point the archive command temporarily to `/bin/true` to unblock WAL recycling during the incident:
  ```sql
  -- Emergency measure to prevent complete shutdown:
  ALTER SYSTEM SET archive_command = '/bin/true';
  SELECT pg_reload_conf();
  CHECKPOINT;
  ```
  *(Important: Taking this action creates an archive gap; schedule an immediate base backup once storage stabilizes).*
- Safely remove orphaned temporary files left behind by interrupted sort/hash operations:
  ```bash
  # Safe to remove: temporary spill files from crashed backend queries:
  rm -rf /var/lib/postgresql/data/base/pgsql_tmp/*
  ```
