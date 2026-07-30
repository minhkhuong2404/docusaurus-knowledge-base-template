import React from 'react';

export default function CqrsCrudPatternDiagram() {
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        <span>Traditional 3-Tier CRUD Architecture</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.3fr 1.2fr 0.3fr 1.2fr', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>Client Apps</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Web / Mobile</div>
          </div>

          <div style={{ fontSize: '16px', color: '#38bdf8', fontWeight: 800 }}>⇄</div>

          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>Service Layer &amp; ORM</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Spring Data JPA</div>
          </div>

          <div style={{ fontSize: '16px', color: '#fbbf24', fontWeight: 800 }}>⇄</div>

          <div style={{ background: 'rgba(248,113,113,0.15)', border: '2px solid #f87171', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>Shared Relational DB</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Read Joins vs Write Locks</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>CRUD Bottleneck:</strong> Reads (complex SQL joins) and Writes (table lock contention and constraints) compete for CPU/disk resources on the exact same database schema.
      </div>
    </div>
  );
}
