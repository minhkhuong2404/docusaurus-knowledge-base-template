import React, { useState } from 'react';

interface ArchetypeData {
	id: string;
	tableName: string;
	subtitle: string;
	badge: string;
	badgeColor: string;
	originStory: string;
	symptoms: string[];
	blastRadius: {
		storage: string;
		locking: string;
		riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
	};
	mockDdl: string;
	remediationPattern: string;
	remediationSql: string;
	svgTopology: {
		flowTitle: string;
		sourceNode: string;
		badNode: string;
		goodNode: string;
		trapDetail: string;
	};
}

const ARCHETYPES: ArchetypeData[] = [
	{
		id: 'customers-new',
		tableName: 'Customers_new',
		subtitle: 'Abandoned Dual-Write & Shadow Table Migration',
		badge: 'Migration Tombstone',
		badgeColor: '#f87171',
		originStory:
			'Created in 2019 to replace the legacy Customers table during a zero-downtime refactor. Both tables are still live, both had rows inserted today, and nobody knows which one the core billing service actually reads. A helper view `vw_Customers` quietly UNIONs them together, turning simple index lookups into full scans.',
		symptoms: [
			'Both original and _new tables receive concurrent INSERT/UPDATE traffic',
			'Application contains hardcoded conditional logic switching between tables',
			'Quiet helper view `vw_Customers` performs full UNION ALL scans across both tables',
			'Subsequent variants exist: `Customers_new_final`, `Customers_new_final_v2`',
		],
		blastRadius: {
			storage: '2x write amplification on every customer registration',
			locking: 'Distributed transaction lock contention across dual writes',
			riskLevel: 'CRITICAL',
		},
		mockDdl: `-- The classic migration abandonment trap
CREATE TABLE Customers (
    CustomerID INT PRIMARY KEY,
    FullName VARCHAR(100)
);

CREATE TABLE Customers_new (
    CustomerID INT, -- Missing PK in rush!
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    Email VARCHAR(100)
);

-- The 'temporary' bridge view that broke optimizer cardinality
CREATE VIEW vw_Customers AS
SELECT CustomerID, FullName, NULL AS Email FROM Customers
UNION ALL
SELECT CustomerID, FirstName + ' ' + LastName, Email FROM Customers_new;`,
		remediationPattern: 'Expand-Contract (Strangler Fig) Schema Evolution',
		remediationSql: `-- STEP 1: Add new columns directly to base table in backward-compatible mode
ALTER TABLE Customers ADD COLUMN IF NOT EXISTS first_name VARCHAR(50);
ALTER TABLE Customers ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);

-- STEP 2: Backfill asynchronously in batches using primary key range scans
UPDATE Customers 
SET first_name = split_part(FullName, ' ', 1),
    last_name = split_part(FullName, ' ', 2)
WHERE CustomerID BETWEEN 1 AND 10000 AND first_name IS NULL;

-- STEP 3: Switch app writes via feature flag, verify CDC sync, and DROP shadow table
DROP TABLE IF EXISTS Customers_new CASCADE;`,
		svgTopology: {
			flowTitle: 'The Abandoned Dual-Write Trap vs Clean Expand-Contract',
			sourceNode: 'App Ingestion Layer',
			badNode: 'Dual-Write Split (Customers vs Customers_new)',
			goodNode: 'Single Schema + Feature Flag Migration',
			trapDetail: 'UNION view destroys query planner cardinality estimates',
		},
	},
	{
		id: 'sheet1',
		tableName: 'Sheet1 / Sheet1$',
		subtitle: 'Unconstrained Spreadsheet Wizard Ingestion',
		badge: 'Unconstrained Trap',
		badgeColor: '#fbbf24',
		originStory:
			'Imported via SQL Server Management Studio or pgAdmin import wizard at 4:30 PM on a Friday before a major business meeting. Contains Column3 holding critical regional discount rates. It has no primary key, no NOT NULL constraints, and has become the single source of truth for finance.',
		symptoms: [
			'Column names like `Column1`, `F1`, or default Excel headers (`Sheet1$`)',
			'All columns defined as nullable VARCHAR(MAX) or TEXT regardless of actual data',
			'No primary key, foreign key, or check constraints',
			'Core finance or pricing stored procedures rely on string parsing logic',
		],
		blastRadius: {
			storage: 'Unbounded heap table bloat with zero indexing and forward pointer scans',
			locking: 'Exclusive table locks on updates due to lack of index seeks',
			riskLevel: 'HIGH',
		},
		mockDdl: `-- Imported directly by wizard with default settings
CREATE TABLE [Sheet1$] (
    [Column1] NVARCHAR(255) NULL,
    [Column2] NVARCHAR(255) NULL,
    [Column3] NVARCHAR(255) NULL, -- Actually Regional Discount %!
    [Column4] FLOAT NULL
);
-- Notice: No primary key, duplicate rows allowed, empty strings mixed with NULL`,
		remediationPattern: 'Dedicated Staging Schema & Strict Contract Ingestion',
		remediationSql: `-- 1. Isolate ad-hoc wizard imports to an explicit staging schema
CREATE SCHEMA staging;

-- 2. Define strict production target table with domain constraints
CREATE TABLE pricing.regional_discounts (
    region_code VARCHAR(10) PRIMARY KEY,
    discount_pct NUMERIC(5,2) NOT NULL CHECK (discount_pct BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Ingest with explicit type casting and sanitization validation
INSERT INTO pricing.regional_discounts (region_code, discount_pct)
SELECT 
    TRIM(Column1), 
    CAST(TRIM(Column3) AS NUMERIC(5,2))
FROM staging.Sheet1_raw
WHERE Column1 IS NOT NULL AND Column3 ~ '^[0-9]+(\.[0-9]+)?$'
ON CONFLICT (region_code) DO UPDATE 
SET discount_pct = EXCLUDED.discount_pct;`,
		svgTopology: {
			flowTitle: 'Direct Wizard Dump vs Sanitized Staging Pipeline',
			sourceNode: 'Finance Excel File',
			badNode: 'Raw Import into [dbo].[Sheet1$] (No Constraints)',
			goodNode: 'staging.raw ➔ Type Validator ➔ pricing.discounts (PK)',
			trapDetail: 'Missing PK enables silent duplicates and catastrophic price bugs',
		},
	},
	{
		id: 'tmp-fix',
		tableName: 'tmp_fix_20180312',
		subtitle: 'Emergency Outage Hotfix Table Kept for 7+ Years',
		badge: 'Zombie Hotfix',
		badgeColor: '#f97316',
		originStory:
			'Created at 2:00 AM during a critical production incident to salvage corrupt orders before a hotfix script ran. The incident was closed at 4:00 AM with a promise to "drop the table first thing in the morning". Seven years later, it has been backed up 2,500 times and survived 3 major database engine upgrades.',
		symptoms: [
			'Table name contains timestamps, ticket IDs, or phrases like `_fix_`, `_patch_`',
			'Zero reads recorded in system performance views (`sys.dm_db_index_usage_stats`)',
			'Table owner is an inactive database user or former contractor',
			'Backed up nightly across multi-terabyte snapshot schedules out of institutional fear',
		],
		blastRadius: {
			storage: 'Multi-gigabyte backup and replication bloat multiplied across replicas',
			locking: 'Maintenance windows delayed by vacuum, checkdb, and reindex tasks',
			riskLevel: 'MEDIUM',
		},
		mockDdl: `-- Created during 2 AM Sev-1 outage
CREATE TABLE tmp_fix_20180312 AS 
SELECT * FROM orders 
WHERE status = 'CORRUPTED' AND created_at >= '2018-03-11';
-- Intended lifetime: 4 hours
-- Actual lifetime: 7+ years`,
		remediationPattern: 'Automated Post-Mortem Decommissioning & Schema Reapers',
		remediationSql: `-- 1. Verify zero read/write activity in query metrics
SELECT relname, seq_scan, idx_scan, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables 
WHERE relname LIKE 'tmp_%' OR relname LIKE 'fix_%';

-- 2. Rename to quarantine schema with scheduled expiration date
ALTER TABLE tmp_fix_20180312 SET SCHEMA quarantine;
COMMENT ON TABLE quarantine.tmp_fix_20180312 
IS 'Scheduled for auto-drop on 2026-10-01. Contact SRE Lead.';

-- 3. Take one cold cold-storage parquet snapshot to S3 before final purge
-- DROP TABLE quarantine.tmp_fix_20180312;`,
		svgTopology: {
			flowTitle: 'Permanent Emergency Hotfix vs Ephemeral Scratch Lifecycles',
			sourceNode: 'Production Sev-1 Incident',
			badNode: 'Ad-hoc tmp_fix table in dbo schema (Retained forever)',
			goodNode: 'Ephemeral scratch schema with automated 7-day TTL drop',
			trapDetail: 'Every snapshot backs up dead tables across all replicas',
		},
	},
	{
		id: 'settings',
		tableName: 'Settings',
		subtitle: 'Single-Row 41-Column Anti-Pattern without Primary Key',
		badge: 'Race-Condition Risk',
		badgeColor: '#a78bfa',
		originStory:
			'Contains 41 columns including Flag1 through Flag12, Flag1_New through Flag4_New, and a BIT column called `Temp` that has been set to 1 since 2014. Because "there will only ever be one row", it lacks a primary key. When a concurrency glitch inserted a second row in 2021, all `SELECT Flag7 FROM Settings` queries returned two rows, crashing the order checkout service for 40 minutes.',
		symptoms: [
			'Single row holding global application switches and feature toggles',
			'Cryptic column names (`Flag7`, `Flag1_New`, `Temp`, `MiscValue`)',
			'No primary key or unique constraint enforcing single-row cardinality',
			'Frequent SELECT * queries on every HTTP request causing buffer pool thrashing',
		],
		blastRadius: {
			storage: 'Minimal bytes, but high lock escalation and cache invalidation churn',
			locking: 'Exclusive row locks during flag flips lock all read connections',
			riskLevel: 'CRITICAL',
		},
		mockDdl: `-- The fragile single-row trap
CREATE TABLE Settings (
    Flag1 BIT,
    Flag2 BIT,
    Flag7 BIT, -- Warehouse label printer breaks if this is 0!
    Temp BIT DEFAULT 1,
    MaxConnections INT
);
-- DANGER: No PK! An accidental 'INSERT INTO Settings' crashes the application!`,
		remediationPattern: 'Enforced Single-Row CHECK Constraint or Key-Value Configuration',
		remediationSql: `-- Approach A: Enforce Exactly One Row via Check Constraint & Primary Key
CREATE TABLE app_config (
    singleton_id INT PRIMARY KEY DEFAULT 1,
    enable_warehouse_printing BOOLEAN NOT NULL DEFAULT TRUE,
    max_checkout_retries INT NOT NULL DEFAULT 3,
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_single_row CHECK (singleton_id = 1)
);

-- Approach B: Strongly Typed Key-Value Schema for dynamic settings
CREATE TABLE system_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    description TEXT NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`,
		svgTopology: {
			flowTitle: 'Unconstrained Settings Table vs Enforced Singleton Pattern',
			sourceNode: 'Application Cluster',
			badNode: 'Settings (No PK, Multi-row INSERT breaks app)',
			goodNode: 'app_config (CHECK singleton_id = 1 & Strong Typing)',
			trapDetail: 'Concurrent insert turns singleton into multi-row crash',
		},
	},
	{
		id: 'audit-log',
		tableName: 'AuditLog',
		subtitle: 'Write-Only 900M Row Unindexed Black Hole',
		badge: 'Performance Landmine',
		badgeColor: '#f87171',
		originStory:
			'Created because a compliance auditor in 2017 requested an audit trail. Nine hundred million rows have been written since, but it has never been queried once. Nightly backups and replication streams faithfully replicate every gigabyte. Worse: it has no index on `created_at`. When an auditor finally requests logs for a specific day, the query runs for 14 hours and causes an OOM crash.',
		symptoms: [
			'Pure write-only workload with 0 index seeks or reads in execution metrics',
			'Hundreds of millions of rows stored in a single flat unpartitioned table',
			'Missing indexes on `created_at` or `user_id` due to write-speed optimization',
			'No retention policy, partition dropping, or automated archival pipeline',
		],
		blastRadius: {
			storage: 'Consumes 60%+ of total database volume and backup window duration',
			locking: 'Autovacuum or maintenance locks stall live transaction processing',
			riskLevel: 'CRITICAL',
		},
		mockDdl: `-- Flat unpartitioned 900M row sink
CREATE TABLE AuditLog (
    LogID BIGINT IDENTITY PRIMARY KEY,
    Action VARCHAR(100),
    Payload TEXT,
    LogDate DATETIME DEFAULT GETDATE()
);
-- Fatal omission: No index on LogDate! Querying a date range requires a 900M row scan!`,
		remediationPattern: 'Declarative Range Partitioning & Asynchronous Cold Archival',
		remediationSql: `-- 1. Declarative Range Partitioning by Timestamp
CREATE TABLE audit_logs (
    id BIGSERIAL,
    action VARCHAR(100) NOT NULL,
    user_id BIGINT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);

-- 2. Automatically drop or detach partitions older than 90 days (Instant O(1) drop!)
-- ALTER TABLE audit_logs DETACH PARTITION audit_logs_2025_01;
-- DROP TABLE audit_logs_2025_01;

-- 3. Offload historical events to S3 / ClickHouse via Kafka/Debezium CDC`,
		svgTopology: {
			flowTitle: 'Unpartitioned 900M Log Sink vs Declarative Partition Lifecycle',
			sourceNode: 'Transactional Services',
			badNode: 'AuditLog (Unpartitioned, No Date Index, 900M Rows)',
			goodNode: 'audit_logs (Partition by Month + pg_partman + Cold S3)',
			trapDetail: 'Unindexed 900M table scan triggers memory exhaustion during audit',
		},
	},
	{
		id: 'backup-table',
		tableName: 'Backup_DoNotDelete',
		subtitle: '40GB Fear-Protected Zombie Snapshot',
		badge: 'Fear-Based Artifact',
		badgeColor: '#38bdf8',
		originStory:
			'A 40-gigabyte snapshot created by an engineer right before a risky schema migration in 2019. The migration succeeded, but the table was never dropped because of the intimidating uppercase name. Years later, nobody knows what it contains, but nobody dares to drop it.',
		symptoms: [
			'Table name uses alarmist phrases: `_DoNotDelete`, `_PARACHUTE`, `_BEFORE_MIGRATION`',
			'Columns do not match any entity currently used by the production code',
			'Oldest row and newest row share the exact same timestamp (static snapshot)',
			'Zero read or write queries recorded in database performance counters',
		],
		blastRadius: {
			storage: 'Wasted SSD storage and RAM buffer pool contamination during index checks',
			locking: 'Longer DB failover times during disaster recovery restoration',
			riskLevel: 'MEDIUM',
		},
		mockDdl: `-- The fear-based parachute table
CREATE TABLE Backup_DoNotDelete AS 
SELECT * FROM payments_v1;
-- 40GB table stored on fast NVMe SSD storage for 5+ years without a single read`,
		remediationPattern: 'Point-In-Time-Recovery (PITR) & Ephemeral Object Tagging',
		remediationSql: `-- 1. Verify schema ownership and last access time
SELECT schemaname, relname, pg_size_pretty(pg_total_relation_size(relid)) as total_size,
       last_seq_scan, last_idx_scan
FROM pg_stat_user_tables
WHERE relname ILIKE '%backup%' OR relname ILIKE '%donotdelete%';

-- 2. Export table data to cloud object storage (Parquet / pg_dump)
-- pg_dump -t 'Backup_DoNotDelete' dbname | gzip > backup_donotdelete_2019.sql.gz
-- aws s3 cp backup_donotdelete_2019.sql.gz s3://company-db-archives/2019/

-- 3. Safely DROP table from hot production database
DROP TABLE "Backup_DoNotDelete";`,
		svgTopology: {
			flowTitle: 'Hot Production Parachute Table vs Cloud Cold Archival',
			sourceNode: 'Engineer Pre-Migration',
			badNode: 'Backup_DoNotDelete on Hot NVMe (40GB idle for 6 years)',
			goodNode: 'PITR WAL Archival + Compressed S3 Dump + Instant DROP',
			trapDetail: 'Fear of deleting unknown tables drains expensive primary SSD space',
		},
	},
	{
		id: 'dev-scratch',
		tableName: 'AKTest / jm_temp / priya_wrk',
		subtitle: 'Abandoned Personal Developer Scratch Tables',
		badge: 'Ghost Scratchpad',
		badgeColor: '#2dd4bf',
		originStory:
			'Created by a developer testing a quick query or reproducing a bug directly in production. The developer left the company 5 years ago, their corporate credentials were wiped, but their personal initials remain immortalized in the database schema catalog.',
		symptoms: [
			'Named after personal initials, nicknames, or dev tags (`AKTest`, `mike_debug`)',
			'Contains 4 rows with test strings like "asdf", "test1234", "123"',
			'Created directly in the default `dbo` or `public` schema instead of local dev DB',
			'Backed up every single night across all disaster recovery sites',
		],
		blastRadius: {
			storage: 'Small footprint (8KB - 64KB), but high schema catalog clutter',
			locking: 'Pollutes ORM schema generation, schema diffs, and migration tools',
			riskLevel: 'MEDIUM',
		},
		mockDdl: `-- Personal developer scratchpad in production
CREATE TABLE AKTest (
    id INT,
    note VARCHAR(50)
);

INSERT INTO AKTest VALUES (1, 'test'), (2, 'asdf'), (3, NULL);`,
		remediationPattern: 'Local Ephemeral Containers & Strict Production DDL RBAC',
		remediationSql: `-- 1. Revoke direct CREATE TABLE permissions in production from standard roles
REVOKE CREATE ON SCHEMA public FROM developers;
REVOKE CREATE ON SCHEMA dbo FROM app_users;

-- 2. Enforce schema changes exclusively via automated CI/CD migration pipelines
-- (Flyway, Liquibase, Atlas, or Prisma Migrate)

-- 3. Purge orphaned scratch tables
DROP TABLE IF EXISTS "AKTest";
DROP TABLE IF EXISTS "jm_temp";
DROP TABLE IF EXISTS "priya_wrk";`,
		svgTopology: {
			flowTitle: 'Production Scratch Testing vs Containerized Isolation',
			sourceNode: 'Developer Debugging Session',
			badNode: 'Ad-hoc table directly in production dbo/public schema',
			goodNode: 'Local Testcontainers / Ephemeral Branch Database (Neon/Supabase)',
			trapDetail: 'Direct prod DDL access leaves permanent orphaned artifacts',
		},
	},
];

export default function DatabaseArchetypesHygieneDiagram(): React.JSX.Element {
	const [activeTab, setActiveTab] = useState<string>('customers-new');
	const [activeView, setActiveView] = useState<'topology' | 'ddl' | 'remediation'>('topology');

	const currentItem = ARCHETYPES.find((item) => item.id === activeTab) || ARCHETYPES[0];

	return (
		<div
			className="interactive-diagram-container"
			style={{
				fontFamily: 'var(--ifm-font-family-base)',
				backgroundColor: 'var(--ifm-card-background-color, #1e293b)',
				borderRadius: '12px',
				border: '1px solid var(--ifm-color-emphasis-300, #334155)',
				padding: '1.25rem',
				margin: '1.5rem 0',
				boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
			}}
		>
			<style>{`
				@media (max-width: 768px) {
					.responsive-grid-archetypes {
						grid-template-columns: 1fr !important;
					}
					.archetype-tab-row {
						overflow-x: auto;
						padding-bottom: 0.5rem;
					}
				}
				@keyframes flowDash {
					to {
						stroke-dashoffset: -24;
					}
				}
				.interactive-diagram-flowing-path {
					stroke-dasharray: 6, 6;
					animation: flowDash 1.2s linear infinite;
				}
			`}</style>

			{/* Header */}
			<div
				className="interactive-diagram-header"
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					borderBottom: '1px solid var(--ifm-color-emphasis-200, #334155)',
					paddingBottom: '0.85rem',
					marginBottom: '1rem',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#38bdf8"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<ellipse cx="12" cy="5" rx="9" ry="3" />
						<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
						<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
					</svg>
					<div>
						<h3
							style={{
								margin: 0,
								fontSize: '1.15rem',
								fontWeight: 700,
								color: '#38bdf8',
								letterSpacing: '-0.02em',
							}}
						>
							Production Database Anti-Pattern Archetypes
						</h3>
						<span
							style={{
								fontSize: '0.82rem',
								color: 'var(--ifm-color-content-secondary, #94a3b8)',
							}}
						>
							Interactive Anatomy, Blast Radius &amp; Zero-Downtime Remediation Runbook
						</span>
					</div>
				</div>

				<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
					<span
						style={{
							fontSize: '0.75rem',
							padding: '0.2rem 0.5rem',
							borderRadius: '6px',
							fontWeight: 600,
							backgroundColor:
								currentItem.blastRadius.riskLevel === 'CRITICAL'
									? 'rgba(248, 113, 113, 0.15)'
									: 'rgba(251, 191, 36, 0.15)',
							color:
								currentItem.blastRadius.riskLevel === 'CRITICAL' ? '#f87171' : '#fbbf24',
							border: `1px solid ${
								currentItem.blastRadius.riskLevel === 'CRITICAL' ? '#f87171' : '#fbbf24'
							}`,
						}}
					>
						Risk: {currentItem.blastRadius.riskLevel}
					</span>
				</div>
			</div>

			{/* Archetype Selector Tabs */}
			<div
				className="archetype-tab-row"
				style={{
					display: 'flex',
					gap: '0.4rem',
					overflowX: 'auto',
					marginBottom: '1rem',
					borderBottom: '1px solid var(--ifm-color-emphasis-200, #334155)',
					paddingBottom: '0.5rem',
				}}
			>
				{ARCHETYPES.map((item) => {
					const isSelected = item.id === activeTab;
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => setActiveTab(item.id)}
							style={{
								padding: '0.45rem 0.75rem',
								borderRadius: '6px',
								border: isSelected
									? `1px solid ${item.badgeColor}`
									: '1px solid transparent',
								backgroundColor: isSelected
									? 'rgba(56, 189, 248, 0.12)'
									: 'transparent',
								color: isSelected ? item.badgeColor : 'var(--ifm-color-content-secondary, #94a3b8)',
								fontWeight: isSelected ? 700 : 500,
								fontSize: '0.85rem',
								cursor: 'pointer',
								whiteSpace: 'nowrap',
								transition: 'all 0.2s ease',
							}}
						>
							{item.tableName}
						</button>
					);
				})}
			</div>

			{/* Main Grid: Left Anatomy + Right Interactive Canvas/Views */}
			<div
				className="responsive-grid-archetypes"
				style={{
					display: 'grid',
					gridTemplateColumns: '48% 52%',
					gap: '1rem',
					alignItems: 'start',
				}}
			>
				{/* Left Column: Context, Origin, Symptoms, Blast Radius */}
				<div
					style={{
						backgroundColor: 'rgba(15, 23, 42, 0.65)',
						borderRadius: '8px',
						border: '1px solid var(--ifm-color-emphasis-200, #334155)',
						padding: '1rem',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '0.6rem',
						}}
					>
						<span
							style={{
								fontSize: '1.05rem',
								fontWeight: 700,
								color: '#f8fafc',
								fontFamily: 'monospace',
							}}
						>
							{currentItem.tableName}
						</span>
						<span
							style={{
								fontSize: '0.72rem',
								padding: '0.2rem 0.5rem',
								borderRadius: '4px',
								backgroundColor: `${currentItem.badgeColor}20`,
								color: currentItem.badgeColor,
								fontWeight: 600,
								border: `1px solid ${currentItem.badgeColor}60`,
							}}
						>
							{currentItem.badge}
						</span>
					</div>

					<p
						style={{
							fontSize: '0.86rem',
							color: 'var(--ifm-color-content, #e2e8f0)',
							lineHeight: '1.45',
							marginBottom: '0.85rem',
						}}
					>
						{currentItem.originStory}
					</p>

					<div style={{ marginBottom: '0.85rem' }}>
						<span
							style={{
								fontSize: '0.78rem',
								textTransform: 'uppercase',
								letterSpacing: '0.05em',
								color: '#94a3b8',
								fontWeight: 700,
							}}
						>
							Production Symptoms
						</span>
						<ul
							style={{
								margin: '0.4rem 0 0 0',
								paddingLeft: '1.2rem',
								fontSize: '0.82rem',
								color: 'var(--ifm-color-content-secondary, #cbd5e1)',
								lineHeight: '1.5',
							}}
						>
							{currentItem.symptoms.map((sym, idx) => (
								<li key={idx} style={{ marginBottom: '0.25rem' }}>
									{sym}
								</li>
							))}
						</ul>
					</div>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '0.5rem',
							padding: '0.6rem',
							borderRadius: '6px',
							backgroundColor: 'rgba(0,0,0,0.3)',
							border: '1px solid rgba(255,255,255,0.05)',
							fontSize: '0.78rem',
						}}
					>
						<div>
							<span style={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>
								Storage / IO Blast:
							</span>
							<span style={{ color: '#fca5a5', fontWeight: 500 }}>
								{currentItem.blastRadius.storage}
							</span>
						</div>
						<div>
							<span style={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>
								Locking Impact:
							</span>
							<span style={{ color: '#fed7aa', fontWeight: 500 }}>
								{currentItem.blastRadius.locking}
							</span>
						</div>
					</div>
				</div>

				{/* Right Column: Interactive Mode Switcher (Topology SVG / Mock DDL / Remediation SQL) */}
				<div
					style={{
						backgroundColor: 'rgba(15, 23, 42, 0.65)',
						borderRadius: '8px',
						border: '1px solid var(--ifm-color-emphasis-200, #334155)',
						padding: '1rem',
					}}
				>
					{/* Sub-view switcher buttons */}
					<div
						style={{
							display: 'flex',
							gap: '0.4rem',
							marginBottom: '0.75rem',
							borderBottom: '1px solid rgba(255,255,255,0.08)',
							paddingBottom: '0.5rem',
						}}
					>
						<button
							type="button"
							onClick={() => setActiveView('topology')}
							style={{
								padding: '0.35rem 0.65rem',
								borderRadius: '4px',
								fontSize: '0.78rem',
								fontWeight: 600,
								cursor: 'pointer',
								border:
									activeView === 'topology'
										? '1px solid #38bdf8'
										: '1px solid transparent',
								backgroundColor:
									activeView === 'topology'
										? 'rgba(56, 189, 248, 0.15)'
										: 'transparent',
								color: activeView === 'topology' ? '#38bdf8' : '#94a3b8',
							}}
						>
							Visual Data Flow
						</button>
						<button
							type="button"
							onClick={() => setActiveView('ddl')}
							style={{
								padding: '0.35rem 0.65rem',
								borderRadius: '4px',
								fontSize: '0.78rem',
								fontWeight: 600,
								cursor: 'pointer',
								border:
									activeView === 'ddl'
										? '1px solid #f87171'
										: '1px solid transparent',
								backgroundColor:
									activeView === 'ddl'
										? 'rgba(248, 113, 113, 0.15)'
										: 'transparent',
								color: activeView === 'ddl' ? '#f87171' : '#94a3b8',
							}}
						>
							Anti-Pattern DDL
						</button>
						<button
							type="button"
							onClick={() => setActiveView('remediation')}
							style={{
								padding: '0.35rem 0.65rem',
								borderRadius: '4px',
								fontSize: '0.78rem',
								fontWeight: 600,
								cursor: 'pointer',
								border:
									activeView === 'remediation'
										? '1px solid #34d399'
										: '1px solid transparent',
								backgroundColor:
									activeView === 'remediation'
										? 'rgba(52, 211, 153, 0.15)'
										: 'transparent',
								color: activeView === 'remediation' ? '#34d399' : '#94a3b8',
							}}
						>
							Fix &amp; Remediation SQL
						</button>
					</div>

					{/* View 1: Animated Flowing SVG Topology */}
					{activeView === 'topology' && (
						<div>
							<div
								style={{
									fontSize: '0.8rem',
									color: '#38bdf8',
									fontWeight: 600,
									marginBottom: '0.5rem',
								}}
							>
								{currentItem.svgTopology.flowTitle}
							</div>
							<svg
								viewBox="0 0 460 210"
								style={{
									width: '100%',
									height: 'auto',
									borderRadius: '6px',
									backgroundColor: '#090d16',
									border: '1px solid #1e293b',
								}}
							>
								<defs>
									<pattern
										id="grid-dots"
										x="0"
										y="0"
										width="16"
										height="16"
										patternUnits="userSpaceOnUse"
									>
										<circle cx="2" cy="2" r="1" fill="#1e293b" />
									</pattern>
									<marker
										id="arrow-red"
										markerWidth="8"
										markerHeight="8"
										refX="6"
										refY="3.5"
										orient="auto"
									>
										<polygon points="0 0, 7 3.5, 0 7" fill="#f87171" />
									</marker>
									<marker
										id="arrow-green"
										markerWidth="8"
										markerHeight="8"
										refX="6"
										refY="3.5"
										orient="auto"
									>
										<polygon points="0 0, 7 3.5, 0 7" fill="#34d399" />
									</marker>
								</defs>

								<rect width="460" height="210" fill="url(#grid-dots)" />

								{/* Source Node */}
								<g transform="translate(15, 80)">
									<rect
										width="110"
										height="45"
										rx="6"
										fill="#1e293b"
										stroke="#38bdf8"
										strokeWidth="1.5"
									/>
									<text
										x="55"
										y="22"
										textAnchor="middle"
										fill="#38bdf8"
										fontSize="10"
										fontWeight="bold"
									>
										Workload Source
									</text>
									<text
										x="55"
										y="36"
										textAnchor="middle"
										fill="#94a3b8"
										fontSize="8"
									>
										{currentItem.svgTopology.sourceNode}
									</text>
								</g>

								{/* Bad Path Flow (Top Branch) */}
								<path
									d="M 125 95 C 160 95, 170 45, 205 45"
									fill="none"
									stroke="#f87171"
									strokeWidth="1.8"
									className="interactive-diagram-flowing-path"
									markerEnd="url(#arrow-red)"
								/>

								{/* Bad Node */}
								<g transform="translate(210, 20)">
									<rect
										width="235"
										height="50"
										rx="6"
										fill="#271417"
										stroke="#f87171"
										strokeWidth="1.5"
									/>
									<text
										x="10"
										y="18"
										fill="#fca5a5"
										fontSize="9.5"
										fontWeight="bold"
									>
										Anti-Pattern Trap:
									</text>
									<text x="10" y="32" fill="#cbd5e1" fontSize="8">
										{currentItem.svgTopology.badNode}
									</text>
									<text x="10" y="44" fill="#f87171" fontSize="7.5" fontStyle="italic">
										{currentItem.svgTopology.trapDetail}
									</text>
								</g>

								{/* Good Path Flow (Bottom Branch) */}
								<path
									d="M 125 110 C 160 110, 170 160, 205 160"
									fill="none"
									stroke="#34d399"
									strokeWidth="1.8"
									className="interactive-diagram-flowing-path"
									markerEnd="url(#arrow-green)"
								/>

								{/* Good Node */}
								<g transform="translate(210, 135)">
									<rect
										width="235"
										height="50"
										rx="6"
										fill="#0d281e"
										stroke="#34d399"
										strokeWidth="1.5"
									/>
									<text
										x="10"
										y="18"
										fill="#6ee7b7"
										fontSize="9.5"
										fontWeight="bold"
									>
										Production Best Practice:
									</text>
									<text x="10" y="32" fill="#cbd5e1" fontSize="8">
										{currentItem.svgTopology.goodNode}
									</text>
									<text x="10" y="44" fill="#34d399" fontSize="7.5" fontWeight="600">
										Zero-Downtime Safe Contract Evolution
									</text>
								</g>
							</svg>
							<div
								style={{
									fontSize: '0.75rem',
									color: '#94a3b8',
									marginTop: '0.4rem',
									textAlign: 'center',
								}}
							>
								Moving dashed lines trace data path traversal and optimizer routing
							</div>
						</div>
					)}

					{/* View 2: Mock Anti-Pattern DDL */}
					{activeView === 'ddl' && (
						<div>
							<div
								style={{
									fontSize: '0.78rem',
									color: '#f87171',
									fontWeight: 600,
									marginBottom: '0.35rem',
								}}
							>
								Vulnerable Schema Definition
							</div>
							<pre
								style={{
									backgroundColor: '#090d16',
									padding: '0.75rem',
									borderRadius: '6px',
									fontSize: '0.78rem',
									color: '#cbd5e1',
									overflowX: 'auto',
									lineHeight: '1.4',
									border: '1px solid #334155',
									margin: 0,
								}}
							>
								<code>{currentItem.mockDdl}</code>
							</pre>
						</div>
					)}

					{/* View 3: Remediation Pattern & Production SQL */}
					{activeView === 'remediation' && (
						<div>
							<div
								style={{
									fontSize: '0.8rem',
									color: '#34d399',
									fontWeight: 700,
									marginBottom: '0.35rem',
								}}
							>
								Pattern: {currentItem.remediationPattern}
							</div>
							<pre
								style={{
									backgroundColor: '#090d16',
									padding: '0.75rem',
									borderRadius: '6px',
									fontSize: '0.78rem',
									color: '#a7f3d0',
									overflowX: 'auto',
									lineHeight: '1.4',
									border: '1px solid #064e3b',
									margin: 0,
								}}
							>
								<code>{currentItem.remediationSql}</code>
							</pre>
						</div>
					)}
				</div>
			</div>

			{/* Footer: Quick SQL Server & PostgreSQL Table Audit Script Toggle */}
			<div
				style={{
					marginTop: '1rem',
					padding: '0.75rem',
					borderRadius: '8px',
					backgroundColor: 'rgba(30, 41, 59, 0.6)',
					border: '1px solid var(--ifm-color-emphasis-200, #334155)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					flexWrap: 'wrap',
					gap: '0.5rem',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#fbbf24"
						strokeWidth="2"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					<span style={{ fontSize: '0.82rem', color: '#f1f5f9' }}>
						<strong>Audit Tip:</strong> Run catalog scans regularly on{' '}
						<code>sys.dm_db_index_usage_stats</code> (SQL Server) or{' '}
						<code>pg_stat_user_tables</code> (Postgres) to identify zero-read zombie tables.
					</span>
				</div>
			</div>
		</div>
	);
}
