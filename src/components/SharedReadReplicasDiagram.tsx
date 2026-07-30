import React, { useState } from 'react';

export default function SharedReadReplicasDiagram() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
        </svg>
        <span>Shared Read Replicas Architecture &amp; Schema Coupling Hazards</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', alignItems: 'center' }}>
          {/* Owner Service & Master DB */}
          <div
            onMouseEnter={() => setHovered('primary')}
            onMouseLeave={() => setHovered(null)}
            style={{ background: 'rgba(56,189,248,0.08)', border: '1.5px solid #38bdf8', padding: '12px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>Order Service (Owner)</div>
            <div style={{ fontSize: '12px', margin: '6px 0' }}>↓ Writes</div>
            <div style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
              Primary DB (Master)
            </div>
          </div>

          {/* Replication Link */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>
              WAL / Binlog Replication
            </div>
            <div style={{ height: '3px', background: '#fbbf24', width: '100%', borderRadius: '2px' }} />
          </div>

          {/* Read Replica & Caller Service */}
          <div
            onMouseEnter={() => setHovered('replica')}
            onMouseLeave={() => setHovered(null)}
            style={{ background: 'rgba(167,139,250,0.08)', border: '1.5px solid #a78bfa', padding: '12px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#a78bfa' }}>Reporting Service (Caller)</div>
            <div style={{ fontSize: '12px', margin: '6px 0' }}>↓ Read-Only Queries</div>
            <div style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid #a78bfa', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#a78bfa' }}>
              Read Replica DB
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>Tradeoff Analysis:</strong> Shared Read Replicas simplify reporting queries without overloading the primary database master, but they recreate database schema coupling — any DDL change by the owner service will still break read queries in caller services.
      </div>
    </div>
  );
}
