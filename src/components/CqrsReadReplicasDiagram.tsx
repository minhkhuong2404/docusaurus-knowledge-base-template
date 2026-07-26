import React from 'react';

export default function CqrsReadReplicasDiagram() {
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
        </svg>
        <span>Read Replicas &amp; Caching Architecture</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1.5px solid #f87171', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>Primary SQL DB (Writes)</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>WAL / Binlog Streaming</div>
          </div>

          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1.5px solid #38bdf8', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>Read Replicas (Reads)</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Offloads SELECT Queries</div>
          </div>

          <div style={{ background: 'rgba(52,211,153,0.1)', border: '1.5px solid #34d399', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Redis Cache</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Sub-millisecond Read Cache</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>CRUD with Scalability:</strong> Offloads heavy read queries via database replication and Redis caching without restructuring the application model into full CQRS.
      </div>
    </div>
  );
}
