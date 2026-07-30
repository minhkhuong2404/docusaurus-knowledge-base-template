import React from 'react';

export default function CqrsPurePatternDiagram() {
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>CQRS Without Event Sourcing Architecture</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.3fr 1fr 0.3fr 1fr', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1.5px solid #f87171', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#f87171' }}>Normalized Write DB</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Postgres (3NF State)</div>
          </div>

          <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 800 }}>→</div>

          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1.5px solid #fbbf24', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24' }}>Kafka Event Bus</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Domain Events</div>
          </div>

          <div style={{ fontSize: '14px', color: '#34d399', fontWeight: 800 }}>→</div>

          <div style={{ background: 'rgba(52,211,153,0.1)', border: '1.5px solid #34d399', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>Denormalized Read DB</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Elasticsearch / Mongo</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>Pure CQRS:</strong> Writes update current state in a normalized SQL database; Domain Events stream via Kafka to build tailored read projections in MongoDB/Elasticsearch without requiring Event Sourcing.
      </div>
    </div>
  );
}
