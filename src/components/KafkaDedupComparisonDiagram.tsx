import React, { useState } from 'react';

const DEDUP_PATTERNS = [
  { name: '1. Producer Idempotency (Producer-Side)', scope: 'Single Partition per Producer Session', mechanism: 'Producer ID (PID) + Monotonic Sequence Number (0, 1, 2)', limit: 'Does not protect across producer restarts or multi-partition transactions.' },
  { name: '2. Transactional EOS (Stream-Side)', scope: 'Multi-Partition / Multi-Topic Read-Process-Write', mechanism: 'Two-Phase Commit (2PC) via Transaction Coordinator', limit: 'Requires read_committed isolation level on consumer.' },
  { name: '3. DB Idempotent Sink (Consumer-Side)', scope: 'End-to-End Application Sink', mechanism: 'Unique Constraint / UPSERT / Redis Deduplication Key', limit: 'Requires database unique key index on Message ID / Business Key.' }
];

export default function KafkaDedupComparisonDiagram(): React.JSX.Element {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const curr = DEDUP_PATTERNS[selectedIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .dedup-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Deduplication Strategies Comparison (Idempotence vs EOS vs Consumer UPSERT)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {DEDUP_PATTERNS.map((p, idx) => (
            <button
              key={p.name}
              onClick={() => setSelectedIdx(idx)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: selectedIdx === idx ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
                color: selectedIdx === idx ? '#34d399' : 'var(--ifm-color-content-secondary)',
                boxShadow: selectedIdx === idx ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="dedup-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '10px' }}>
              PATTERN SPECIFICATION
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Deduplication Scope:</strong> <span style={{ color: '#38bdf8' }}>{curr.scope}</span></div>
              <div><strong>Enforcement Mechanism:</strong> <span style={{ color: '#34d399' }}>{curr.mechanism}</span></div>
            </div>
          </div>

          <div className="interactive-diagram-details-card details-green">
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
              LIMITATIONS & BOUNDARIES
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
              {curr.name}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
              {curr.limit}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}