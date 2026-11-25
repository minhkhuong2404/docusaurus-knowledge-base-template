import React, { useState } from 'react';

type TabKey = 'failure_paths' | 'three_layers' | 'batch_flow';

interface KafkaWorkerScalingProps {
  initialTab?: TabKey;
}

interface FailureCase {
  id: string;
  title: string;
  badge: string;
  color: string;
  summary: string;
  mechanism: string;
  dbEffect: string;
}

const FAILURE_CASES: FailureCase[] = [
  {
    id: 'check_then_act',
    title: '1. Check-Then-Act (Duplicate Document)',
    badge: 'Race Window',
    color: '#f87171',
    summary: 'Pod 1 and Pod 2 both run SELECT Document WHERE UserCode="U01" AND Date="2026-11-08", both see NULL, and both INSERT.',
    mechanism: 'Under default READ COMMITTED isolation, SELECT cannot lock a non-existent row. Wrapping SELECT + INSERT in a transaction does NOT prevent both pods from inserting. Using SERIALIZABLE causes gap-lock deadlocks on SQL Server/MySQL or 40001 serialization failures on PostgreSQL.',
    dbEffect: '2 Document rows created for (U01, 2026-11-08); TotalAmount is split across two records.',
  },
  {
    id: 'lost_update',
    title: '2. Read-Modify-Write Lost Update',
    badge: 'Overwritten Sum',
    color: '#fb923c',
    summary: 'Pod 1 and Pod 2 both read TotalAmount = 100 in memory. Pod 1 adds 50 -> writes 150; Pod 2 adds 70 -> writes 170.',
    mechanism: 'Entity Framework / ORM loads the entity into memory, mutates doc.TotalAmount += msg.Amount, and emits UPDATE Document SET TotalAmount = 170 WHERE Id = 1, silently overwriting Pod 1’s +50 increment.',
    dbEffect: 'Document.TotalAmount is 170 instead of 220 (50 vanishes permanently).',
  },
  {
    id: 'consumer_redelivery',
    title: '3. Consumer Rebalance / Offset Replay',
    badge: 'At-Least-Once',
    color: '#fbbf24',
    summary: 'Pod 1 commits the DB transaction, then crashes or rebalances before committing the Kafka offset (or auto-offset-store commits too early).',
    mechanism: 'When Kubernetes scales 1 -> 2 pods, Kafka triggers a rebalance. Uncommitted offsets are re-read by Pod 2, which inserts the same ticket a second time and adds Amount to TotalAmount again. Conversely, in .NET Confluent.Kafka (librdkafka), default EnableAutoOffsetStore=true marks offsets before DB commit—losing tickets on crash!',
    dbEffect: 'Same ticket counted twice in Transaction and TotalAmount (or lost on pod kill).',
  },
  {
    id: 'producer_duplicate',
    title: '4. Upstream Producer Duplicate Delivery',
    badge: '2 Offsets, 1 Ticket',
    color: '#a78bfa',
    summary: 'The upstream producer writes the exact same TicketNumber twice at two different Kafka offsets (e.g., offset 401 and offset 409).',
    mechanism: 'Happens via 3 paths: (a) ACK lost on network retry when librdkafka enable.idempotence is false by default; (b) Producer process restarts (new PID session, which idempotent producer cannot deduplicate across restarts); (c) Upstream job/application retry.',
    dbEffect: 'Even perfect consumer offset commits still process both offsets, doubling TotalAmount.',
  },
];

export default function KafkaWorkerScalingThreeLayerDefenseDiagram({
  initialTab = 'three_layers',
}: KafkaWorkerScalingProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [selectedFailure, setSelectedFailure] = useState<string>('check_then_act');
  const [selectedLockOption, setSelectedLockOption] = useState<'redis' | 'unique_idx' | 'key_table'>('unique_idx');

  const currentFailure = FAILURE_CASES.find(f => f.id === selectedFailure) || FAILURE_CASES[0];

  return (
    <div className="interactive-diagram-container" style={{ margin: '24px 0', fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .kws-split-grid {
          display: grid;
          grid-template-columns: 56% 44%;
          gap: 16px;
          align-items: start;
        }
        .kws-three-col {
          display: grid;
          grid-template-columns: 33.3% 33.3% 33.3%;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .kws-split-grid, .kws-three-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '14.5px' }}>
          Scaling Kafka Workers (1 &rarr; 2+ Pods): 3-Layer Defense Without Redis Locks
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('failure_paths')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeTab === 'failure_paths' ? '#f87171' : 'rgba(255,255,255,0.12)',
              backgroundColor: activeTab === 'failure_paths' ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'failure_paths' ? '#f87171' : '#94a3b8',
            }}
          >
            1. Why 2 Pods Corrupt Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('three_layers')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeTab === 'three_layers' ? '#34d399' : 'rgba(255,255,255,0.12)',
              backgroundColor: activeTab === 'three_layers' ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'three_layers' ? '#34d399' : '#94a3b8',
            }}
          >
            2. The 3-Layer Defense
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch_flow')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeTab === 'batch_flow' ? '#38bdf8' : 'rgba(255,255,255,0.12)',
              backgroundColor: activeTab === 'batch_flow' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'batch_flow' ? '#38bdf8' : '#94a3b8',
            }}
          >
            3. Short-Tx Batch Pipeline
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {activeTab === 'failure_paths' && (
          <div className="kws-split-grid">
            {/* Left SVG: 2 Pods Racing on Document + Transaction */}
            <div style={{ background: '#0d0f1e', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px' }}>
              <svg viewBox="0 0 540 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="kws-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
                  </marker>
                  <marker id="kws-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                  </marker>
                </defs>

                <text x="14" y="22" fill="#f87171" fontSize="11.5" fontWeight="700">
                  UNPROTECTED 2-POD SCALING: CHECK-THEN-ACT &amp; LOST UPDATE RACE
                </text>

                {/* Kafka Partitions */}
                <rect x="14" y="42" width="135" height="92" rx="8" fill="#0c0e17" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="81" y="62" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Kafka Topic</text>
                <text x="81" y="80" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">P0: Ticket #1 (U01, $50)</text>
                <text x="81" y="96" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">P1: Ticket #2 (U01, $70)</text>
                <text x="81" y="116" textAnchor="middle" fill="#f87171" fontSize="9">(No UserCode Key!)</text>

                {/* Arrows to Pods */}
                <path d="M 155 68 L 205 68" stroke="#fbbf24" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#kws-amber)" />
                <path d="M 155 110 L 205 168" stroke="#fbbf24" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#kws-amber)" />

                {/* Pod 1 */}
                <rect x="215" y="38" width="135" height="65" rx="8" fill="#0c0e17" stroke="#f87171" strokeWidth="1.5" />
                <text x="282" y="58" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Worker Pod 1</text>
                <text x="282" y="74" textAnchor="middle" fill="#94a3b8" fontSize="9.5">1. SELECT Doc &rarr; NULL</text>
                <text x="282" y="90" textAnchor="middle" fill="#f87171" fontSize="9.5">2. INSERT Doc ($50)</text>

                {/* Pod 2 */}
                <rect x="215" y="138" width="135" height="65" rx="8" fill="#0c0e17" stroke="#f87171" strokeWidth="1.5" />
                <text x="282" y="158" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Worker Pod 2</text>
                <text x="282" y="174" textAnchor="middle" fill="#94a3b8" fontSize="9.5">1. SELECT Doc &rarr; NULL</text>
                <text x="282" y="190" textAnchor="middle" fill="#f87171" fontSize="9.5">2. INSERT Doc ($70)</text>

                {/* Arrows to DB */}
                <path d="M 356 72 L 398 98" stroke="#f87171" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#kws-red)" />
                <path d="M 356 170 L 398 138" stroke="#f87171" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#kws-red)" />

                {/* Corrupted DB State */}
                <rect x="408" y="56" width="118" height="126" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="467" y="76" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="700">Relational DB</text>
                <text x="467" y="96" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">Doc #1: U01 $50</text>
                <text x="467" y="112" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">Doc #2: U01 $70</text>
                <text x="467" y="134" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="700">DUPLICATE DOCS!</text>
                <text x="467" y="150" textAnchor="middle" fill="#fbbf24" fontSize="8.5">Or Lost Update:</text>
                <text x="467" y="166" textAnchor="middle" fill="#fbbf24" fontSize="8.5">$100 &rarr; $170 (&ne; $220)</text>

                {/* Pre-check GroupId warning box */}
                <rect x="14" y="220" width="512" height="66" rx="8" fill="#0c0e17" stroke="rgba(251,191,36,0.4)" strokeWidth="1" />
                <text x="26" y="240" fill="#fbbf24" fontSize="10.5" fontWeight="700">
                  STEP 0 PRE-CHECK: Are Both Pods Sharing the Exact Same Fixed GroupId?
                </text>
                <text x="26" y="257" fill="#cbd5e1" fontSize="9.5">
                  • If GroupId appends Environment.MachineName or Guid.NewGuid(), every pod is a separate Consumer Group!
                </text>
                <text x="26" y="273" fill="#94a3b8" fontSize="9.5">
                  • Symptom: Topic has only 1 partition yet BOTH pods process messages, creating 2 Transactions for every ticket.
                </text>
              </svg>
            </div>

            {/* Right Column: Interactive 4 Failure Paths */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FAILURE_CASES.map((fc) => {
                const active = fc.id === selectedFailure;
                return (
                  <button
                    key={fc.id}
                    type="button"
                    onClick={() => setSelectedFailure(fc.id)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: active ? `1.5px solid ${fc.color}` : '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: active ? '#0c0e17' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: active ? fc.color : '#e2e8f0' }}>{fc.title}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', color: fc.color }}>
                        {fc.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>{fc.summary}</div>
                  </button>
                );
              })}

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0c0e17', border: `1px solid ${currentFailure.color}`, marginTop: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: currentFailure.color, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Under-the-Hood Engine Truth:
                </div>
                <div style={{ fontSize: '11.5px', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '8px' }}>
                  {currentFailure.mechanism}
                </div>
                <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 600 }}>
                  💥 Impact: {currentFailure.dbEffect}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'three_layers' && (
          <div>
            <div style={{ background: '#0d0f1e', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px', marginBottom: '14px' }}>
              <svg viewBox="0 0 780 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="kws-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="kws-emerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                  </marker>
                  <marker id="kws-purple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#a78bfa" />
                  </marker>
                </defs>

                <text x="16" y="22" fill="#34d399" fontSize="11.5" fontWeight="700">
                  THE 3-LAYER ARCHITECTURE: SINGLE-WRITER ROUTING + DB UNIQUE CONSTRAINTS + IDEMPOTENT TICKET FILTER
                </text>

                {/* Layer 1 */}
                <rect x="16" y="38" width="220" height="162" rx="10" fill="#0c0e17" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="126" y="60" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">LAYER 1: Partition by UserCode</text>
                <text x="126" y="80" textAnchor="middle" fill="#e2e8f0" fontSize="10">murmur2(UserCode) % numPartitions</text>
                <text x="126" y="102" textAnchor="middle" fill="#94a3b8" fontSize="9.5">• All tickets of U01 &rarr; Partition 0</text>
                <text x="126" y="118" textAnchor="middle" fill="#94a3b8" fontSize="9.5">• Single active consumer pod per key</text>
                <text x="126" y="134" textAnchor="middle" fill="#94a3b8" fontSize="9.5">• Re-key worker if upstream key is null</text>
                <text x="126" y="156" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="600">Still has gap during Rebalance!</text>
                <text x="126" y="174" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">EnableAutoOffsetStore = false</text>

                <path d="M 242 119 L 274 119" stroke="#38bdf8" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#kws-cyan)" />

                {/* Layer 2 */}
                <rect x="284" y="38" width="220" height="162" rx="10" fill="#0c0e17" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="394" y="60" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="700">LAYER 2: Unique Document Key</text>
                <text x="394" y="80" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace">UNIQUE(UserCode, DateOfIssue)</text>
                <text x="394" y="102" textAnchor="middle" fill="#94a3b8" fontSize="9.5">• DateOfIssue MUST be DATE (not datetime)</text>
                <text x="394" y="118" textAnchor="middle" fill="#94a3b8" fontSize="9.5">• Rejects 2nd Document during rebalance</text>
                <text x="394" y="134" textAnchor="middle" fill="#94a3b8" fontSize="9.5">• Loser rolls back &amp; retries UPDATE branch</text>
                <text x="394" y="156" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="600">Zero Redis Lock Needed!</text>
                <text x="394" y="174" textAnchor="middle" fill="#a78bfa" fontSize="9" fontFamily="monospace">Online DDL / DocumentKey table</text>

                <path d="M 510 119 L 542 119" stroke="#a78bfa" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#kws-purple)" />

                {/* Layer 3 */}
                <rect x="552" y="38" width="212" height="162" rx="10" fill="#0c0e17" stroke="#34d399" strokeWidth="1.5" />
                <text x="658" y="60" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">LAYER 3: Ticket Deduplication</text>
                <text x="658" y="80" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace">UNIQUE(TicketNumber)</text>
                <text x="658" y="102" textAnchor="middle" fill="#94a3b8" fontSize="9.5">• Dedup in-batch + SELECT existing first</text>
                <text x="658" y="118" textAnchor="middle" fill="#94a3b8" fontSize="9.5">• Compute new TotalAmount from net-new</text>
                <text x="658" y="134" textAnchor="middle" fill="#94a3b8" fontSize="9.5">• UNIQUE(TicketNumber) catches races</text>
                <text x="658" y="156" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="600">Immune to Replay &amp; Producer Retry</text>
                <text x="658" y="174" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="monospace">WHERE TotalAmount = @oldTotal</text>
              </svg>
            </div>

            {/* Interactive Comparison of the 3 Ways to Enforce Layer 2 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedLockOption('unique_idx')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: selectedLockOption === 'unique_idx' ? '1.5px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: selectedLockOption === 'unique_idx' ? 'rgba(52,211,153,0.18)' : '#0c0e17',
                  color: selectedLockOption === 'unique_idx' ? '#34d399' : '#94a3b8',
                }}
              >
                Option 2 (Best End-State): Unique Index on Document(UserCode, DateOfIssue)
              </button>
              <button
                type="button"
                onClick={() => setSelectedLockOption('key_table')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: selectedLockOption === 'key_table' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: selectedLockOption === 'key_table' ? 'rgba(56,189,248,0.18)' : '#0c0e17',
                  color: selectedLockOption === 'key_table' ? '#38bdf8' : '#94a3b8',
                }}
              >
                Option 3 (Stepping Stone): Dedicated DocumentKey Table / Filtered Index
              </button>
              <button
                type="button"
                onClick={() => setSelectedLockOption('redis')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: selectedLockOption === 'redis' ? '1.5px solid #f87171' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: selectedLockOption === 'redis' ? 'rgba(248,113,113,0.18)' : '#0c0e17',
                  color: selectedLockOption === 'redis' ? '#f87171' : '#94a3b8',
                }}
              >
                Option 1 (Anti-Pattern Here): Redis Distributed Lock
              </button>
            </div>

            {selectedLockOption === 'unique_idx' && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0c0e17', border: '1px solid #34d399', fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55 }}>
                <strong style={{ color: '#34d399' }}>Why Unique Index on Document(UserCode, DateOfIssue) Wins:</strong> Zero extra infrastructure, supports batching natively, and guarantees correctness across rebalances and redeliveries. Remember to type <code style={{ color: '#34d399' }}>DateOfIssue</code> as <code style={{ color: '#34d399' }}>DATE</code> (normalized to a single timezone)—if typed as <code style={{ color: '#f87171' }}>DATETIME</code>, <code style={{ color: '#f87171' }}>08:00</code> and <code style={{ color: '#f87171' }}>09:00</code> on the same day are distinct values and bypass the constraint! Create with Online DDL (<code style={{ color: '#38bdf8' }}>CREATE UNIQUE INDEX CONCURRENTLY</code> in Postgres, <code style={{ color: '#38bdf8' }}>WITH (ONLINE = ON)</code> in SQL Server, <code style={{ color: '#38bdf8' }}>ALGORITHM=INPLACE, LOCK=NONE</code> in MySQL).
              </div>
            )}
            {selectedLockOption === 'key_table' && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0c0e17', border: '1px solid #38bdf8', fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55 }}>
                <strong style={{ color: '#38bdf8' }}>When Legacy Duplicates Block Index Creation:</strong> If <code style={{ color: '#38bdf8' }}>Document</code> already contains duplicates that require business sign-off before merging, either create a <strong>Conditional/Filtered Unique Index</strong> (<code style={{ color: '#38bdf8' }}>WHERE Id &gt; @maxExistingId</code> in SQL Server / Postgres) or create a side-table <code style={{ color: '#38bdf8' }}>DocumentKey(UserCode, DateOfIssue, DocumentId)</code> pre-populated with <code style={{ color: '#38bdf8' }}>MIN(Id) GROUP BY UserCode, DateOfIssue</code> so workers immediately stop creating new duplicates while legacy cleanup proceeds safely.
              </div>
            )}
            {selectedLockOption === 'redis' && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0c0e17', border: '1px solid #f87171', fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55 }}>
                <strong style={{ color: '#f87171' }}>4 Reasons Redis Lock (`doc:UserCode:Date`) Is the Wrong Tool Here:</strong> (1) Adds an external SPOF when all state already lives in one relational DB; (2) <strong>TTL Dilemma:</strong> too long blocks pods after crash/redeploy, too short expires mid-GC/slow-DB pause and lets two pods write concurrently (no fencing token); (3) <strong>Batch Deadlocks:</strong> locking 300 `(UserCode, Date)` pairs for a 500-message batch requires sorted multi-key Lua scripts to avoid lock-ordering deadlocks; (4) Does <strong>not</strong> stop redelivered or producer-duplicated tickets anyway!
              </div>
            )}
          </div>
        )}

        {activeTab === 'batch_flow' && (
          <div>
            <div style={{ background: '#0d0f1e', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px', marginBottom: '12px' }}>
              <svg viewBox="0 0 780 185" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="kws-step-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="kws-commit-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                  </marker>
                </defs>

                <text x="14" y="22" fill="#38bdf8" fontSize="11.5" fontWeight="700">
                  4-STEP BATCH EXECUTION FLOW: PREPARE IN MEMORY FIRST, OPEN SHORT DB TRANSACTION LAST
                </text>

                {/* Step 1 */}
                <rect x="14" y="38" width="168" height="125" rx="8" fill="#0c0e17" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="98" y="58" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">1. In-App Batch Dedup</text>
                <text x="98" y="78" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">Deduplicate identical</text>
                <text x="98" y="93" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">TicketNumber inside</text>
                <text x="98" y="108" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">fetched batch + validate</text>
                <text x="98" y="142" textAnchor="middle" fill="#94a3b8" fontSize="9">(No DB Tx Open)</text>

                <path d="M 188 100 L 204 100" stroke="#38bdf8" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#kws-step-arrow)" />

                {/* Step 2 */}
                <rect x="212" y="38" width="174" height="125" rx="8" fill="#0c0e17" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="299" y="58" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">2. Filter Processed DB</text>
                <text x="299" y="78" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">SELECT TicketNumber</text>
                <text x="299" y="93" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">WHERE TicketNumber IN (..)</text>
                <text x="299" y="112" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">Remove already-stored</text>
                <text x="299" y="142" textAnchor="middle" fill="#94a3b8" fontSize="9">(If 0 left &rarr; StoreOffset)</text>

                <path d="M 392 100 L 408 100" stroke="#38bdf8" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#kws-step-arrow)" />

                {/* Step 3 */}
                <rect x="416" y="38" width="168" height="125" rx="8" fill="#0c0e17" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="500" y="58" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">3. Compute New Totals</text>
                <text x="500" y="78" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">Group remaining by</text>
                <text x="500" y="93" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">(UserCode, DateOfIssue)</text>
                <text x="500" y="110" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">Read current Document &amp;</text>
                <text x="500" y="125" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">compute new TotalAmount</text>
                <text x="500" y="142" textAnchor="middle" fill="#94a3b8" fontSize="9">(After Step 2 filter!)</text>

                <path d="M 590 100 L 606 100" stroke="#34d399" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#kws-commit-arrow)" />

                {/* Step 4 */}
                <rect x="614" y="38" width="152" height="125" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="690" y="58" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">4. Short DB Tx + Offset</text>
                <text x="690" y="76" textAnchor="middle" fill="#ffffff" fontSize="9">BEGIN TX</text>
                <text x="690" y="91" textAnchor="middle" fill="#cbd5e1" fontSize="9">• INSERT Transactions</text>
                <text x="690" y="106" textAnchor="middle" fill="#cbd5e1" fontSize="9">• INSERT/UPDATE Doc</text>
                <text x="690" y="121" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="700">COMMIT &rarr; StoreOffset()</text>
                <text x="690" y="142" textAnchor="middle" fill="#fbbf24" fontSize="8.5">On Unique Err: Retry Step 2</text>
              </svg>
            </div>

            <div className="kws-three-col">
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#0c0e17', border: '1px solid rgba(56,189,248,0.35)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Why Compute in App + Write Direct?</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  By filtering already-processed <code style={{ color: '#38bdf8' }}>TicketNumber</code> rows <em>before</em> reading <code style={{ color: '#38bdf8' }}>Document.TotalAmount</code>, the read total already reflects all prior commits. If a rebalance overlap occurs, <code style={{ color: '#34d399' }}>UNIQUE(TicketNumber)</code> or <code style={{ color: '#34d399' }}>WHERE TotalAmount = @old</code> aborts and retries from Step 2.
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#0c0e17', border: '1px solid rgba(167,139,250,0.35)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>.NET librdkafka Offset Safety</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  In <code style={{ color: '#a78bfa' }}>Confluent.Kafka</code>, background auto-commit runs every 5s and marks offsets as soon as <code style={{ color: '#a78bfa' }}>Consume()</code> returns! Set <code style={{ color: '#34d399' }}>EnableAutoOffsetStore = false</code> and call <code style={{ color: '#34d399' }}>consumer.StoreOffset(lastMsg)</code> strictly <strong>after</strong> <code style={{ color: '#34d399' }}>tx.Commit()</code>.
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#0c0e17', border: '1px solid rgba(52,211,153,0.35)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>Continuous Reconciliation Query</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  After chunked data cleanup, schedule a periodic invariant check comparing <code style={{ color: '#34d399' }}>d.TotalAmount &lt;&gt; SUM(t.Amount)</code> across <code style={{ color: '#34d399' }}>Document</code> and <code style={{ color: '#34d399' }}>Transaction</code>. Any row returned immediately flags an unguarded write path.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
