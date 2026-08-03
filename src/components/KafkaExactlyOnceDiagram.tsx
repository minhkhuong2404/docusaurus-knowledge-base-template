import React, { useState } from 'react';

export default function KafkaExactlyOnceDiagram({ initialTab = 'eos' }: { initialTab?: 'eos' | 'steps' | 'zombie' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'eos' | 'steps' | 'zombie'>(initialTab);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .eos-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Exactly-Once Semantics (EOS / 2PC Transactions) & Zombie Fencing
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'eos', label: '🛡️ Delivery Guarantees (At-Least-Once vs EOS)', color: '#fbbf24' },
            { id: 'steps', label: '🔄 2PC Transaction Coordinator Lifecycle', color: '#38bdf8' },
            { id: 'zombie', label: '🤺 Zombie Producer Fencing (Epoch Fencing)', color: '#f87171' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '150px',
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

        {/* Tab 1: EOS Comparison */}
        {activeTab === 'eos' && (
          <div className="eos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>At-Most-Once (acks=0)</div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4, margin: 0 }}>
                Fire-and-forget. Messages may be lost on network failure, but never duplicated. Lowest latency.
              </p>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>At-Least-Once (acks=all)</div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4, margin: 0 }}>
                Retries on failure guarantee zero data loss, but duplicate records may be processed by consumers.
              </p>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Exactly-Once (EOS)</div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4, margin: 0 }}>
                Idempotent producer + Transaction Coordinator guarantees zero loss AND zero duplicates across read-process-write stream pipelines.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: 2PC Steps */}
        {activeTab === 'steps' && (
          <div className="eos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>1. InitTransactions</div>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Producer requests PID & epoch fencing from Transaction Coordinator.</div>
            </div>

            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa' }}>2. AddPartitions</div>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Registers target topic partitions in <code>__transaction_state</code> topic.</div>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>3. Send & Offsets</div>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Writes records and attaches consumed input offsets atomically.</div>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>4. Commit Marker</div>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Writes <code>COMMIT</code> control batch. Consumers with <code>isolation.level=read_committed</code> reveal records.</div>
            </div>
          </div>
        )}

        {/* Tab 3: Zombie Fencing */}
        {activeTab === 'zombie' && (
          <div className="eos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '6px' }}>Zombie Producer (Old Instance - Epoch 0)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                Old producer paused by GC / network split recovers and calls <code>commitTransaction()</code> with <strong>Epoch 0</strong>.
              </p>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>Active Producer (New Instance - Epoch 1)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                New instance registered via <code>initTransactions()</code> bumps <strong>Epoch to 1</strong>. Transaction Coordinator immediately rejects Zombie write with <code>ProducerFencedException</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}