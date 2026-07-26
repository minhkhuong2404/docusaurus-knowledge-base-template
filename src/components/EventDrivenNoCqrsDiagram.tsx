import React from 'react';

export default function EventDrivenNoCqrsDiagram() {
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Event-Driven Architecture Without CQRS</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.3fr 1.2fr 0.3fr 1.2fr', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1.5px solid #38bdf8', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>Order Service</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Order DB (Local State)</div>
          </div>

          <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 800 }}>→</div>

          <div style={{ background: 'rgba(251,191,36,0.15)', border: '2px solid #fbbf24', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>Kafka Broker</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>OrderPlaced Event</div>
          </div>

          <div style={{ fontSize: '14px', color: '#34d399', fontWeight: 800 }}>→</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
              Payment Service (Own DB)
            </div>
            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid #a78bfa', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#a78bfa' }}>
              Shipping Service (Own DB)
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>Inter-Service Decoupling:</strong> Services communicate exclusively via Kafka events, but each microservice internally maintains a standard CRUD database without separating internal read and write models.
      </div>
    </div>
  );
}
