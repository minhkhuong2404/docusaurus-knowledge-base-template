import React, { useState } from 'react';

type CdcTab = 'pipeline' | 'dualwrite' | 'matrix';

interface PipelineNode {
  id: string;
  name: string;
  sub: string;
  color: string;
  desc: string;
}

const PIPELINE_NODES: PipelineNode[] = [
  { id: 'app', name: 'Application', sub: 'Spring Boot / Go', color: '#38bdf8', desc: 'Executes standard ACID transactions. Completely decoupled from messaging infrastructure.' },
  { id: 'wal', name: 'WAL / Binlog', sub: 'Postgres / MySQL Engine', color: '#fbbf24', desc: 'Append-only disk log written before memory buffer flush. Guarantees durability and crash consistency.' },
  { id: 'debezium', name: 'CDC Connector', sub: 'Debezium / Kafka Connect', color: '#2dd4bf', desc: 'Connects via logical replication protocol (pgoutput / replication slot). Tails log without querying tables.' },
  { id: 'kafka', name: 'Message Broker', sub: 'Kafka Partition Log', color: '#a78bfa', desc: 'Durable, partitioned event log. Preserves strict per-row key ordering with zero loss.' },
  { id: 'consumers', name: 'Downstream Sinks', sub: 'ES / Redis / Microservices', color: '#34d399', desc: 'Independent consumers receive before/after row diffs in real-time to update caches and search indexes.' }
];

export default function CdcArchitectureDiagram({ initialTab = 'pipeline' }: { initialTab?: CdcTab }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CdcTab>(initialTab);
  const [activeNode, setActiveNode] = useState<string>('debezium');
  const [selectedOperation, setSelectedOperation] = useState<'insert' | 'update' | 'delete'>('update');

  const selectedNodeObj = PIPELINE_NODES.find(n => n.id === activeNode) || PIPELINE_NODES[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .cdc-2col-grid {
            grid-template-columns: 1fr !important;
          }
          .cdc-tab-btn {
            font-size: 11px !important;
            padding: 6px 10px !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <line x1="12" y1="12" x2="20" y2="17" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Change Data Capture (CDC) &amp; Transaction Log Streaming Architecture
        </span>

        {/* Tab Navigation */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'pipeline', label: '⚡ 1. Log Tailing Pipeline', color: '#2dd4bf' },
            { id: 'dualwrite', label: '⚠️ 2. Dual-Write Hazard vs CDC', color: '#f87171' },
            { id: 'matrix', label: '📊 3. Pattern Comparison Matrix', color: '#38bdf8' }
          ].map(t => (
            <button
              key={t.id}
              className="cdc-tab-btn"
              onClick={() => setActiveTab(t.id as CdcTab)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.08)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.03)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* TAB 1: LOG TAILING PIPELINE */}
        {activeTab === 'pipeline' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              Click any architecture node below to inspect how committed transactions flow from the engine WAL directly into Kafka without querying tables.
            </div>

            {/* SVG Vector Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 230" className="interactive-diagram-svg">
                <defs>
                  <marker id="cdc-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
                  <marker id="cdc-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#fbbf24" /></marker>
                  <marker id="cdc-teal" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#2dd4bf" /></marker>
                  <marker id="cdc-purple" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#a78bfa" /></marker>
                  <marker id="cdc-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
                </defs>

                {/* 1. App Node */}
                <g transform="translate(25, 60)" onClick={() => setActiveNode('app')} style={{ cursor: 'pointer' }}>
                  <rect width="115" height="100" rx="8" fill={activeNode === 'app' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)'} stroke="#38bdf8" strokeWidth={activeNode === 'app' ? 2 : 1} />
                  <text x="57" y="32" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Application</text>
                  <text x="57" y="52" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9.5">REST API</text>
                  <text x="57" y="70" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Standard SQL</text>
                  <text x="57" y="85" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="600">Zero SDKs</text>
                </g>

                {/* Arrow App -> DB */}
                <path d="M 140 110 L 175 110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#cdc-blue)" className="interactive-diagram-flowing-path" />
                <text x="157" y="100" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="700">SQL Commit</text>

                {/* 2. Primary Database & WAL Box */}
                <g transform="translate(180, 40)" onClick={() => setActiveNode('wal')} style={{ cursor: 'pointer' }}>
                  <rect width="145" height="140" rx="10" fill={activeNode === 'wal' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.03)'} stroke="#fbbf24" strokeWidth={activeNode === 'wal' ? 2 : 1} />
                  <text x="72" y="24" textAnchor="middle" fill="#fbbf24" fontSize="11.5" fontWeight="800">PRIMARY DB</text>
                  <text x="72" y="40" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">PostgreSQL / MySQL</text>
                  <line x1="15" y1="48" x2="130" y2="48" stroke="rgba(255,255,255,0.1)" />

                  {/* WAL Log Sub-Block */}
                  <rect x="12" y="58" width="121" height="68" rx="6" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" strokeWidth="1" />
                  <text x="72" y="76" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="700">WAL / Binlog</text>
                  <text x="72" y="93" textAnchor="middle" fill="#fde68a" fontSize="8">Append-Only Disk</text>
                  <text x="72" y="110" textAnchor="middle" fill="#94a3b8" fontSize="7.5">LSN: 0/16B38D0</text>
                </g>

                {/* Arrow WAL -> Debezium */}
                <path d="M 325 125 L 360 125" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#cdc-amber)" className="interactive-diagram-flowing-path" />
                <text x="342" y="115" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="700">Replication</text>

                {/* 3. Debezium CDC Connector */}
                <g transform="translate(365, 55)" onClick={() => setActiveNode('debezium')} style={{ cursor: 'pointer' }}>
                  <rect width="135" height="110" rx="8" fill={activeNode === 'debezium' ? 'rgba(45, 212, 191, 0.22)' : 'rgba(255, 255, 255, 0.04)'} stroke="#2dd4bf" strokeWidth={activeNode === 'debezium' ? 2 : 1} />
                  <text x="67" y="26" textAnchor="middle" fill="#2dd4bf" fontSize="11" fontWeight="800">DEBEZIUM CDC</text>
                  <text x="67" y="44" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9">Kafka Connect Task</text>
                  <line x1="12" y1="52" x2="123" y2="52" stroke="rgba(255,255,255,0.1)" />
                  <text x="67" y="68" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Logical Decoding</text>
                  <text x="67" y="84" textAnchor="middle" fill="#2dd4bf" fontSize="8.5" fontWeight="600">Row State Diff</text>
                  <text x="67" y="98" textAnchor="middle" fill="#86efac" fontSize="7.5">Zero Table Locking</text>
                </g>

                {/* Arrow Debezium -> Kafka */}
                <path d="M 500 110 L 535 110" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#cdc-teal)" className="interactive-diagram-flowing-path" />
                <text x="517" y="100" textAnchor="middle" fill="#2dd4bf" fontSize="8" fontWeight="700">JSON/Avro</text>

                {/* 4. Kafka Broker */}
                <g transform="translate(540, 50)" onClick={() => setActiveNode('kafka')} style={{ cursor: 'pointer' }}>
                  <rect width="115" height="120" rx="8" fill={activeNode === 'kafka' ? 'rgba(167, 139, 250, 0.22)' : 'rgba(255, 255, 255, 0.04)'} stroke="#a78bfa" strokeWidth={activeNode === 'kafka' ? 2 : 1} />
                  <text x="57" y="26" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="800">KAFKA TOPIC</text>
                  <text x="57" y="44" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9">db.orders</text>
                  <line x1="10" y1="52" x2="105" y2="52" stroke="rgba(255,255,255,0.1)" />

                  <rect x="12" y="60" width="91" height="14" rx="2" fill="rgba(167,139,250,0.15)" />
                  <text x="57" y="71" textAnchor="middle" fill="#c4b5fd" fontSize="7.5">Partition 0: PKey=42</text>
                  <rect x="12" y="78" width="91" height="14" rx="2" fill="rgba(167,139,250,0.15)" />
                  <text x="57" y="89" textAnchor="middle" fill="#c4b5fd" fontSize="7.5">Partition 1: PKey=101</text>
                  <text x="57" y="107" textAnchor="middle" fill="#86efac" fontSize="8" fontWeight="600">Ordered by PK</text>
                </g>

                {/* Arrow Kafka -> Consumers */}
                <path d="M 655 110 L 685 110" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#cdc-purple)" className="interactive-diagram-flowing-path" />

                {/* 5. Downstream Consumers Box */}
                <g transform="translate(690, 40)" onClick={() => setActiveNode('consumers')} style={{ cursor: 'pointer' }}>
                  <rect width="90" height="140" rx="8" fill={activeNode === 'consumers' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.03)'} stroke="#34d399" strokeWidth={activeNode === 'consumers' ? 2 : 1} />
                  <text x="45" y="22" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="800">SINKS</text>
                  <line x1="10" y1="30" x2="80" y2="30" stroke="rgba(255,255,255,0.1)" />

                  <rect x="8" y="38" width="74" height="24" rx="4" fill="rgba(56,189,248,0.12)" />
                  <text x="45" y="53" textAnchor="middle" fill="#38bdf8" fontSize="8">Elasticsearch</text>

                  <rect x="8" y="68" width="74" height="24" rx="4" fill="rgba(251,191,36,0.12)" />
                  <text x="45" y="83" textAnchor="middle" fill="#fbbf24" fontSize="8">Redis Cache</text>

                  <rect x="8" y="98" width="74" height="24" rx="4" fill="rgba(52,211,153,0.12)" />
                  <text x="45" y="113" textAnchor="middle" fill="#34d399" fontSize="8">Data Lake</text>
                </g>
              </svg>
            </div>

            {/* Split Pane Details Card */}
            <div className="cdc-2col-grid" style={{ display: 'grid', gridTemplateColumns: '52% 48%', gap: '14px' }}>
              <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${selectedNodeObj.color}` }}>
                <div className="interactive-diagram-card-header" style={{ marginBottom: '8px' }}>
                  <span style={{ color: selectedNodeObj.color, fontWeight: 800, fontSize: '13.5px' }}>
                    {selectedNodeObj.name} ({selectedNodeObj.sub})
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: '0 0 8px 0' }}>
                  {selectedNodeObj.desc}
                </p>
                <div style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                  🔑 <strong>Key Invariant:</strong> Logical decoding reads directly from the engine WAL memory buffer/disk, causing zero table lock overhead and capturing hard deletes seamlessly.
                </div>
              </div>

              {/* Live JSON Payload Inspector */}
              <div style={{ background: 'rgba(0,0,0,0.35)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#2dd4bf' }}>Debezium CDC Envelope Payload</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['insert', 'update', 'delete'] as const).map(op => (
                      <button
                        key={op}
                        onClick={() => setSelectedOperation(op)}
                        style={{
                          padding: '2px 6px',
                          fontSize: '9.5px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          background: selectedOperation === op ? 'rgba(45,212,191,0.25)' : 'rgba(255,255,255,0.05)',
                          color: selectedOperation === op ? '#2dd4bf' : 'var(--ifm-color-content-secondary)',
                          fontWeight: 700
                        }}
                      >
                        {op.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <pre style={{ margin: 0, fontSize: '10.5px', background: 'transparent', color: '#e2e8f0', maxHeight: '130px', overflowY: 'auto' }}>
{selectedOperation === 'update' ? `{
  "op": "u",
  "ts_ms": 1726581200000,
  "before": { "id": 42, "status": "PENDING", "amt": 250 },
  "after":  { "id": 42, "status": "PAID",    "amt": 250 },
  "source": { "table": "orders", "lsn": 24023128 }
}` : selectedOperation === 'insert' ? `{
  "op": "c",
  "ts_ms": 1726581200000,
  "before": null,
  "after":  { "id": 101, "status": "CREATED", "amt": 99 },
  "source": { "table": "orders", "lsn": 24023250 }
}` : `{
  "op": "d",
  "ts_ms": 1726581200000,
  "before": { "id": 88, "status": "CANCELLED" },
  "after":  null,
  "source": { "table": "orders", "lsn": 24023390 }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DUAL WRITE HAZARD VS CDC */}
        {activeTab === 'dualwrite' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              Why application-layer dual writes create permanent silent data corruption during production outages.
            </div>

            <div className="cdc-2col-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px' }}>
              {/* Dual Write */}
              <div style={{ background: 'rgba(248, 113, 113, 0.06)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(248, 113, 113, 0.25)' }}>
                <div style={{ color: '#f87171', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                  ❌ Anti-Pattern: Dual-Write in App Code
                </div>
                <div style={{ fontSize: '11px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', marginBottom: '10px', color: '#fca5a5' }}>
                  <code>
                    orderRepo.save(order); // DB Write 1: OK<br />
                    // 💥 Crash / Network partition here<br />
                    kafkaTemplate.send(order); // Kafka Write 2: FAILED
                  </code>
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Zero Distributed Atomicity:</strong> DB commits, but Kafka fails. The DB has data; downstream search &amp; caches never hear about it.</li>
                  <li style={{ marginBottom: '4px' }}><strong>Out-of-Order Delivery:</strong> Concurrent app threads can commit to the DB in order A-B but publish to Kafka as B-A.</li>
                  <li><strong>Silent Drift:</strong> Requires complex manual reconciler scripts to detect discrepancies.</li>
                </ul>
              </div>

              {/* CDC Solution */}
              <div style={{ background: 'rgba(52, 211, 153, 0.06)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                <div style={{ color: '#34d399', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                  ✅ Modern Solution: CDC Log Tailing
                </div>
                <div style={{ fontSize: '11px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', marginBottom: '10px', color: '#86efac' }}>
                  <code>
                    orderRepo.save(order); // Single write to DB<br />
                    // Debezium tails WAL commit atomically<br />
                    // At-least-once delivery guaranteed!
                  </code>
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Strict Transaction Atomicity:</strong> If the DB transaction rolls back, nothing is emitted. If it commits, the WAL guarantees delivery.</li>
                  <li style={{ marginBottom: '4px' }}><strong>Preserves Native DB Commit Order:</strong> Log Sequence Numbers (LSN) guarantee sequential ordering per primary key.</li>
                  <li><strong>Zero Application Code Changes:</strong> Zero SDKs or double-write wrappers in Java/Go service code.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPARISON MATRIX */}
        {activeTab === 'matrix' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              Comparison of all four major data propagation architectures across mission-critical architectural criteria.
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'left' }}>
                    <th style={{ padding: '8px', color: '#38bdf8' }}>Criterion</th>
                    <th style={{ padding: '8px', color: '#94a3b8' }}>Polling</th>
                    <th style={{ padding: '8px', color: '#f87171' }}>Dual Write</th>
                    <th style={{ padding: '8px', color: '#fbbf24' }}>Transactional Outbox</th>
                    <th style={{ padding: '8px', color: '#34d399' }}>CDC Log Tailing</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { crit: 'Delivery Guarantee', poll: '⚠️ At-most-once', dual: '❌ None (Split-brain)', outbox: '✅ At-least-once', cdc: '✅ At-least-once' },
                    { crit: 'Propagation Latency', poll: '❌ High (poll interval)', dual: '✅ Sub-second', outbox: '✅ Sub-second', cdc: '✅ Real-time (<50ms)' },
                    { crit: 'Hard Deletes', poll: '❌ Invisible', dual: '⚠️ Fragile', outbox: '✅ Captured via table', cdc: '✅ Captured from WAL' },
                    { crit: 'App Code Impact', poll: '⚠️ updated_at column', dual: '❌ Changes everywhere', outbox: '⚠️ Outbox table write', cdc: '✅ Zero code changes' },
                    { crit: 'Database Load', poll: '❌ Heavy table scans', dual: '✅ Low', outbox: '⚠️ Extra INSERTs', cdc: '✅ Minimal (tailing)' }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{row.crit}</td>
                      <td style={{ padding: '8px', color: 'var(--ifm-color-content-secondary)' }}>{row.poll}</td>
                      <td style={{ padding: '8px', color: '#fca5a5' }}>{row.dual}</td>
                      <td style={{ padding: '8px', color: '#fef08a' }}>{row.outbox}</td>
                      <td style={{ padding: '8px', color: '#86efac', fontWeight: 700 }}>{row.cdc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
