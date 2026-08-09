import React, { useState } from 'react';

const COMPACTION_KEYS = [
  { key: 'user-101', records: [{ offset: 0, val: '{"name":"Alice","status":"ACTIVE"}' }, { offset: 4, val: '{"name":"Alice","status":"SUSPENDED"}' }], final: { offset: 4, val: '{"name":"Alice","status":"SUSPENDED"}' } },
  { key: 'user-102', records: [{ offset: 1, val: '{"name":"Bob","status":"ACTIVE"}' }], final: { offset: 1, val: '{"name":"Bob","status":"ACTIVE"}' } },
  { key: 'user-103', records: [{ offset: 2, val: '{"name":"Charlie","status":"ACTIVE"}' }, { offset: 5, val: 'null (Tombstone)' }], final: { offset: 5, val: 'null (Deleted after delete.retention.ms)' } }
];

export default function KafkaLogCompactionDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'compaction' | 'tombstone'>('compaction');
  const [selectedKeyIdx, setSelectedKeyIdx] = useState<number>(0);

  const currKey = COMPACTION_KEYS[selectedKeyIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .compaction-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Log Retention vs Log Compaction Cleaner Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'compaction', label: '🧹 Key-Based Log Compaction Engine', color: '#34d399' },
            { id: 'tombstone', label: '🪦 Tombstone Records & Key Deletion Lifecycle', color: '#fbbf24' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Compaction */}
        {activeTab === 'compaction' && (
          <div className="compaction-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT RECORD KEY TO INSPECT COMPACTION:
              </div>

              {COMPACTION_KEYS.map((k, idx) => {
                const isSel = idx === selectedKeyIdx;
                return (
                  <div
                    key={k.key}
                    onClick={() => setSelectedKeyIdx(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: isSel ? '#34d399' : 'var(--ifm-color-content)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Key: {k.key}
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-green" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
                COMPACTION CLEANER RESULT
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
                Key: {currKey.key}
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  DIRTY UNCOMPACTED LOG TRAIL:
                </div>
                {currKey.records.map(r => (
                  <div key={r.offset} style={{ fontSize: '11px', color: '#e2e8f0', background: '#090b14', padding: '4px 6px', borderRadius: '4px', marginBottom: '3px' }}>
                    Offset {r.offset}: <code style={{ color: '#38bdf8' }}>{r.val}</code>
                  </div>
                ))}
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                  CLEAN COMPACTED RETAINED RECORD:
                </div>
                <div style={{ fontSize: '11px', color: '#34d399', background: 'rgba(52,211,153,0.15)', padding: '6px', borderRadius: '4px', fontWeight: 700 }}>
                  Offset {currKey.final.offset}: {currKey.final.val}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tombstone */}
        {activeTab === 'tombstone' && (
          <div className="compaction-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>1. Publishing a Tombstone</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                To delete a key in a log-compacted topic, a producer writes a record with <code>Key = "user-103"</code> and <code>Value = null</code>.
              </p>
            </div>

            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '6px' }}>2. Tombstone Garbage Collection</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                Consumers see the <code>null</code> payload and delete key from local state. After <code>delete.retention.ms</code> (default 24h), the Cleaner thread purges tombstone.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}