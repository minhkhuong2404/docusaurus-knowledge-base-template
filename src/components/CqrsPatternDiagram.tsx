import React, { useState } from 'react';

export default function CqrsPatternDiagram() {
  const [activeTab, setActiveTab] = useState<'command' | 'query'>('command');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>CQRS (Command Query Responsibility Segregation) Architecture</span>
      </div>

      {/* Path Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('command')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: activeTab === 'command' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'command' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'command' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✍️ Write Path (Commands &amp; Event Sourcing)
        </button>
        <button
          onClick={() => setActiveTab('query')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: activeTab === 'query' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'query' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'query' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          🔍 Read Path (Projections &amp; Fast Search)
        </button>
      </div>

      {/* Architecture Visualizer */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        {activeTab === 'command' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>Command Client</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>CreateOrderCommand</div>
            </div>
            <div style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>Write Model (Postgres)</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>ACID Transactions</div>
            </div>
            <div style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid #fbbf24', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>Kafka Broker</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>OrderCreatedEvent</div>
            </div>
            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid #a78bfa', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa' }}>Projection Builder</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Async Worker</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Query Client / Mobile</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>GET /orders/search</div>
            </div>
            <div style={{ fontSize: '16px', color: '#34d399' }}>→ Fast Read →</div>
            <div style={{ background: 'rgba(52,211,153,0.2)', border: '2px solid #34d399', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>Read Model (Elasticsearch / Redis)</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Denormalized pre-joined indexes (&lt;10ms query)</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {activeTab === 'command' ? (
          <span><strong>Command Side:</strong> Optimized strictly for write operations, enforcing domain invariants and transaction integrity. State changes emit domain events to Kafka.</span>
        ) : (
          <span><strong>Query Side:</strong> Consumes domain events to build pre-joined, read-optimized search indices (e.g. Elasticsearch). Eliminates cross-service runtime joins completely.</span>
        )}
      </div>
    </div>
  );
}
