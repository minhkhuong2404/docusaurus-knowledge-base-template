import React, { useState } from 'react';

type AbstractionType = 'kstream' | 'ktable' | 'globalktable';

interface StreamRecord {
  key: string;
  value: string;
  time: string;
  action: 'insert' | 'update' | 'tombstone';
}

const STREAM_EVENTS: StreamRecord[] = [
  { key: 'user-101', value: 'US - Silver', time: '10:00:01', action: 'insert' },
  { key: 'user-102', value: 'EU - Gold', time: '10:00:04', action: 'insert' },
  { key: 'user-101', value: 'US - Platinum', time: '10:00:12', action: 'update' },
  { key: 'user-103', value: 'APAC - Bronze', time: '10:00:15', action: 'insert' },
  { key: 'user-102', value: 'null (Delete)', time: '10:00:22', action: 'tombstone' }
];

export default function KafkaStreamsAbstractionsDiagram({ initialTab = 'kstream' }: { initialTab?: AbstractionType }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AbstractionType>(initialTab);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState<number>(2);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kstreams-abs-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Streams Abstractions: KStream vs KTable vs GlobalKTable
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'kstream', label: '1. KStream (Append-Only Event Stream)', color: '#38bdf8' },
            { id: 'ktable', label: '2. KTable (Partitioned Materialized State)', color: '#34d399' },
            { id: 'globalktable', label: '3. GlobalKTable (Replicated Lookup Cache)', color: '#fbbf24' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AbstractionType)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === tab.id ? `${tab.color}22` : 'rgba(255,255,255,0.04)',
                color: activeTab === tab.id ? tab.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === tab.id ? `0 0 0 1.5px ${tab.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SVG Flow Canvas with Moving Arrows */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', marginBottom: '14px', overflow: 'hidden' }}>
          <svg viewBox="0 0 680 150" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="abs-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
              </marker>
              <marker id="abs-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
              <marker id="abs-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
              </marker>
              <marker id="abs-arr-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* Left Node: Incoming Topic Log */}
            <rect x="25" y="45" width="130" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="90" y="70" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Kafka Topic</text>
            <text x="90" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">users-changelog</text>

            {activeTab === 'kstream' && (
              <g>
                <line x1="155" y1="75" x2="270" y2="75" stroke="rgba(56,189,248,0.25)" strokeWidth="2" />
                <line x1="155" y1="75" x2="270" y2="75" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#abs-arr-blue)" />

                <rect x="275" y="45" width="170" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="360" y="70" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">KStream Pipeline</text>
                <text x="360" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Append Every Record</text>

                <line x1="445" y1="75" x2="520" y2="75" stroke="rgba(56,189,248,0.25)" strokeWidth="2" />
                <line x1="445" y1="75" x2="520" y2="75" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#abs-arr-blue)" />

                <rect x="525" y="45" width="130" height="60" rx="8" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="590" y="70" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">Downstream</text>
                <text x="590" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">5 Individual Events</text>
              </g>
            )}

            {activeTab === 'ktable' && (
              <g>
                <line x1="155" y1="75" x2="270" y2="75" stroke="rgba(52,211,153,0.25)" strokeWidth="2" />
                <line x1="155" y1="75" x2="270" y2="75" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#abs-arr-green)" />

                <rect x="275" y="45" width="170" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="360" y="70" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">KTable (RocksDB)</text>
                <text x="360" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Primary Key Upsert</text>

                <line x1="445" y1="75" x2="520" y2="75" stroke="rgba(52,211,153,0.25)" strokeWidth="2" />
                <line x1="445" y1="75" x2="520" y2="75" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#abs-arr-green)" />

                <rect x="525" y="45" width="130" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="590" y="70" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">State Snapshot</text>
                <text x="590" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">2 Active Keys Stored</text>
              </g>
            )}

            {activeTab === 'globalktable' && (
              <g>
                <path d="M 155 65 L 270 35" stroke="rgba(251,191,36,0.25)" strokeWidth="2" fill="none" />
                <path d="M 155 65 L 270 35" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#abs-arr-amber)" />

                <path d="M 155 85 L 270 115" stroke="rgba(251,191,36,0.25)" strokeWidth="2" fill="none" />
                <path d="M 155 85 L 270 115" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#abs-arr-amber)" />

                <rect x="275" y="10" width="170" height="50" rx="8" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="360" y="32" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="700">Instance 1 Global Cache</text>
                <text x="360" y="48" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">100% Partitions Replicated</text>

                <rect x="275" y="90" width="170" height="50" rx="8" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="360" y="112" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="700">Instance 2 Global Cache</text>
                <text x="360" y="128" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">100% Partitions Replicated</text>

                <rect x="495" y="45" width="160" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="575" y="70" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Non-Key Joins</text>
                <text x="575" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Zero Co-Partitioning Req</text>
              </g>
            )}
          </svg>
        </div>

        {/* Split Grid */}
        <div className="kstreams-abs-grid" style={{ display: 'grid', gridTemplateColumns: '52% 48%', gap: '16px', alignItems: 'start' }}>
          {/* Left Visual Simulation Panel */}
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                INCOMING STREAM EVENTS
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Click an event to inspect state effect</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {STREAM_EVENTS.map((rec, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRecordIdx(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: selectedRecordIdx === idx ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.02)',
                    border: selectedRecordIdx === idx ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b' }}>{rec.time}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8' }}>{rec.key}</span>
                    <span style={{ fontSize: '11px', color: rec.action === 'tombstone' ? '#f87171' : '#e2e8f0' }}>➔ {rec.value}</span>
                  </div>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: rec.action === 'tombstone' ? '#f8717122' : rec.action === 'update' ? '#34d39922' : '#38bdf822',
                    color: rec.action === 'tombstone' ? '#f87171' : rec.action === 'update' ? '#34d399' : '#38bdf8'
                  }}>
                    {rec.action.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Simulated Target State View */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
                {activeTab === 'kstream' && 'Observed KStream Log (Every record is an independent fact)'}
                {activeTab === 'ktable' && 'Materialized KTable State (Primary-Key Upsert / Tombstone)'}
                {activeTab === 'globalktable' && 'GlobalKTable (In-Memory Lookup Cache on Every Instance)'}
              </div>

              {activeTab === 'kstream' && (
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>Append-Only Stream: 5 records stored</div>
                  <div>• `user-101` has <strong>2 separate facts</strong> recorded at 10:00:01 and 10:00:12.</div>
                  <div>• `user-102` has <strong>2 facts</strong> (including the tombstone delete record).</div>
                  <div>• Nothing is overwritten or deleted; downstream processors observe all 5 transitions.</div>
                </div>
              )}

              {activeTab === 'ktable' && (
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  <div style={{ color: '#34d399', fontWeight: 700, marginBottom: '4px' }}>Materialized State Table (2 Active Keys)</div>
                  <div>• `user-101` = <strong>"US - Platinum"</strong> (updated from Silver, old value overwritten).</div>
                  <div>• `user-102` = <strong>DELETED</strong> (tombstone received, removed from RocksDB).</div>
                  <div>• `user-103` = <strong>"APAC - Bronze"</strong>.</div>
                </div>
              )}

              {activeTab === 'globalktable' && (
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '4px' }}>Fully Replicated Cache Across 100% of Pods</div>
                  <div>• Every single instance hosts the complete user table in local memory/RocksDB.</div>
                  <div>• Enables Stream-GlobalTable joins on foreign/secondary keys without repartitioning.</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Reference & API Architecture Card */}
          <div className="interactive-diagram-details-card details-purple" style={{ minHeight: '320px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '4px' }}>
              DEEP-DIVE SPECIFICATION
            </div>

            {activeTab === 'kstream' && (
              <>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                  KStream: Unbounded Record Stream
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                  A <code>KStream</code> represents a continuous stream of independent facts (INSERT semantics). Each record stands on its own. If two records share key <code>"user-101"</code>, both are processed sequentially.
                </p>
                <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
                  <code style={{ fontSize: '11px', color: '#38bdf8', display: 'block', background: 'transparent' }}>
                    KStream&lt;String, String&gt; stream = builder.stream("orders-raw");
                  </code>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  <strong>Key Production Gotcha:</strong> Joining two KStreams requires a mandatory time window (<code>JoinWindows.ofTimeDifferenceWithNoGrace()</code>). Windowed joins create transient RocksDB join stores that buffer records for the window duration.
                </div>
              </>
            )}

            {activeTab === 'ktable' && (
              <>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                  KTable: Materialized Changelog Stream
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                  A <code>KTable</code> represents a changelog view of a table (UPSERT semantics). A new record with key <em>K</em> replaces the previous value for <em>K</em>. A record with a <code>null</code> value acts as a tombstone, deleting key <em>K</em>.
                </p>
                <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
                  <code style={{ fontSize: '11px', color: '#34d399', display: 'block', background: 'transparent' }}>
                    KTable&lt;String, String&gt; table = builder.table("user-profiles", Materialized.as("user-store"));
                  </code>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  <strong>Key Production Gotcha:</strong> KTables are backed by a local RocksDB store and a replicated Kafka changelog topic. If you restart an instance on a new host without persistent volumes, it must restore state by replaying the changelog.
                </div>
              </>
            )}

            {activeTab === 'globalktable' && (
              <>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                  GlobalKTable: Broadcast Reference Cache
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                  Unlike a regular <code>KTable</code> which is partitioned across instances, a <code>GlobalKTable</code> is populated with <strong>all partitions</strong> on every single Kafka Streams instance.
                </p>
                <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
                  <code style={{ fontSize: '11px', color: '#fbbf24', display: 'block', background: 'transparent' }}>
                    GlobalKTable&lt;String, String&gt; global = builder.globalTable("currency-rates");
                  </code>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  <strong>Key Production Gotcha:</strong> GlobalKTables consume more local memory/disk because all data is replicated to every instance. Only use for smaller lookup datasets (e.g. metadata, exchange rates, category dictionaries).
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
