import React, { useState } from 'react';

type EosTab = 'txn_cycle' | 'zombie_fencing' | 'outbox';

export default function KafkaStreamsExactlyOnceDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<EosTab>('txn_cycle');
  const [txnOutcome, setTxnOutcome] = useState<'commit' | 'abort'>('commit');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kstreams-eos-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Interactive Exactly-Once V2: Transactions, 2PC & Zombie Fencing
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'txn_cycle', label: '1. Exactly-Once V2 Transaction Loop', color: '#34d399' },
            { id: 'zombie_fencing', label: '2. Zombie Producer Epoch Fencing', color: '#f87171' },
            { id: 'outbox', label: '3. End-to-End Outbox Pattern (DB + Kafka)', color: '#38bdf8' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as EosTab)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11.5px',
                background: activeTab === t.id ? `${t.color}22` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Animated SVG Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', marginBottom: '14px', overflow: 'hidden' }}>
          <svg viewBox="0 0 680 150" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="eos-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
              <marker id="eos-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#f87171" />
              </marker>
              <marker id="eos-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
              </marker>
            </defs>

            {activeTab === 'txn_cycle' && (
              <g>
                <rect x="25" y="45" width="130" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="90" y="70" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">1. Poll Record</text>
                <text x="90" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">beginTransaction()</text>

                <line x1="155" y1="75" x2="225" y2="75" stroke="rgba(56,189,248,0.3)" strokeWidth="2" />
                <line x1="155" y1="75" x2="225" y2="75" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#eos-arr-blue)" />

                <rect x="230" y="45" width="160" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="310" y="70" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">2. Stage Transforms</text>
                <text x="310" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">RocksDB + Producer Buffer</text>

                <line x1="390" y1="75" x2="465" y2="75" stroke={txnOutcome === 'commit' ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"} strokeWidth="2" />
                <line x1="390" y1="75" x2="465" y2="75" stroke={txnOutcome === 'commit' ? "#34d399" : "#f87171"} strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd={txnOutcome === 'commit' ? "url(#eos-arr-green)" : "url(#eos-arr-red)"} />

                <rect x="470" y="45" width="185" height="60" rx="8" fill={txnOutcome === 'commit' ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"} stroke={txnOutcome === 'commit' ? "#34d399" : "#f87171"} strokeWidth="1.5" />
                <text x="562" y="70" textAnchor="middle" fill={txnOutcome === 'commit' ? "#34d399" : "#f87171"} fontSize="11" fontWeight="700">
                  {txnOutcome === 'commit' ? '3. Commit 2PC Marker' : '3. Transaction Aborted'}
                </text>
                <text x="562" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">
                  {txnOutcome === 'commit' ? 'Outputs + Offsets Atomic' : 'Invisible to read_committed'}
                </text>
              </g>
            )}

            {activeTab === 'zombie_fencing' && (
              <g>
                <rect x="25" y="15" width="160" height="50" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="105" y="37" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="700">Zombie Instance (Old PID)</text>
                <text x="105" y="53" textAnchor="middle" fill="#fca5a5" fontSize="9">Epoch = 1 (Evicted)</text>

                <rect x="25" y="85" width="160" height="50" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="105" y="107" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">New Instance (Elected)</text>
                <text x="105" y="123" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Epoch = 2 (Active)</text>

                <line x1="185" y1="40" x2="280" y2="65" stroke="rgba(248,113,113,0.3)" strokeWidth="2" />
                <line x1="185" y1="40" x2="280" y2="65" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#eos-arr-red)" />

                <line x1="185" y1="110" x2="280" y2="85" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="185" y1="110" x2="280" y2="85" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#eos-arr-green)" />

                <rect x="285" y="45" width="180" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="375" y="70" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Transaction Coordinator</text>
                <text x="375" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Validates Producer Epoch</text>

                <line x1="465" y1="75" x2="535" y2="75" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="465" y1="75" x2="535" y2="75" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#eos-arr-green)" />

                <rect x="540" y="45" width="115" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="597" y="70" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">Epoch Fencing</text>
                <text x="597" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Rejects Old Writes</text>
              </g>
            )}

            {activeTab === 'outbox' && (
              <g>
                <rect x="25" y="45" width="130" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="90" y="70" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Spring Service</text>
                <text x="90" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">@Transactional</text>

                <line x1="155" y1="75" x2="235" y2="75" stroke="rgba(56,189,248,0.3)" strokeWidth="2" />
                <line x1="155" y1="75" x2="235" y2="75" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#eos-arr-blue)" />

                <rect x="240" y="45" width="160" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="320" y="70" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Relational DB</text>
                <text x="320" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Orders Table + Outbox Table</text>

                <line x1="400" y1="75" x2="480" y2="75" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="400" y1="75" x2="480" y2="75" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#eos-arr-green)" />

                <rect x="485" y="45" width="170" height="60" rx="8" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="570" y="70" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">Debezium CDC ➔ Kafka</text>
                <text x="570" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Idempotent Deduplication</text>
              </g>
            )}
          </svg>
        </div>

        {/* Details & Controls */}
        <div className="kstreams-eos-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', alignItems: 'start' }}>
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '8px' }}>
              TRANSACTION PARAMETERS
            </div>

            {activeTab === 'txn_cycle' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setTxnOutcome('commit')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: txnOutcome === 'commit' ? '#34d399' : 'rgba(255,255,255,0.04)',
                    color: txnOutcome === 'commit' ? '#090b14' : 'var(--ifm-color-content)'
                  }}
                >
                  Simulate Commit (Happy Path)
                </button>
                <button
                  onClick={() => setTxnOutcome('abort')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: txnOutcome === 'abort' ? '#f87171' : 'rgba(255,255,255,0.04)',
                    color: txnOutcome === 'abort' ? '#090b14' : 'var(--ifm-color-content)'
                  }}
                >
                  Simulate Crash / Abort
                </button>
              </div>
            )}

            {activeTab === 'zombie_fencing' && (
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                When an instance experiences a long GC pause, Kafka broker kicks it out and increments the Producer Epoch. When the zombie wakes up, broker rejects all writes with <code>FencedLeaderEpochException</code>.
              </div>
            )}

            {activeTab === 'outbox' && (
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                EOS v2 only guarantees atomicity within Kafka. For external databases, use the Transactional Outbox Pattern: business record and event written to DB atomically in 1 transaction, then relayed to Kafka via Debezium CDC.
              </div>
            )}
          </div>

          <div className="interactive-diagram-details-card details-green" style={{ minHeight: '160px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              GUARANTEE SPECIFICATION
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
              {activeTab === 'txn_cycle' ? 'Stream Thread Transactional Atomicity' : activeTab === 'zombie_fencing' ? 'Zombie Fencing via Epoch Counters' : 'Dual-Write Problem Solution'}
            </h4>
            <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, margin: 0 }}>
              {activeTab === 'txn_cycle' && 'In EOS V2 (Kafka 2.5+), one transactional producer is allocated per StreamThread. Consumer offset commits and output topic records commit atomically via 2-phase commit markers.'}
              {activeTab === 'zombie_fencing' && 'Guarantees that network-isolated or slow zombie instances can never overwrite valid state or write duplicate records after rebalance.'}
              {activeTab === 'outbox' && 'Eliminates the 2-phase dual write failure mode between Kafka Streams and PostgreSQL/MySQL.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
