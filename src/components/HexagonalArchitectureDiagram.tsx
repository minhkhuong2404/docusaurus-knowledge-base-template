import React, { useState } from 'react';

export default function HexagonalArchitectureDiagram() {
  const [selectedSide, setSelectedSide] = useState<'primary' | 'core' | 'secondary'>('core');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
        </svg>
        <span>Hexagonal Architecture (Ports &amp; Adapters) Explorer</span>
      </div>

      {/* Side Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setSelectedSide('primary')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11.5px', fontWeight: 700,
            background: selectedSide === 'primary' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
            color: selectedSide === 'primary' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: selectedSide === 'primary' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          🔌 Primary / Driving Adapters (REST, CLI)
        </button>
        <button
          onClick={() => setSelectedSide('core')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11.5px', fontWeight: 700,
            background: selectedSide === 'core' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: selectedSide === 'core' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: selectedSide === 'core' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          🛡️ Application Core &amp; Ports
        </button>
        <button
          onClick={() => setSelectedSide('secondary')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11.5px', fontWeight: 700,
            background: selectedSide === 'secondary' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
            color: selectedSide === 'secondary' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
            boxShadow: selectedSide === 'secondary' ? '0 0 0 1.5px #fbbf24' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ⚙️ Secondary / Driven Adapters (DB, Kafka)
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: selectedSide === 'primary' ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.08)', border: '1.5px solid #38bdf8', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>Driving Adapters</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>REST Controllers · gRPC · CLI</div>
          </div>

          <div style={{ background: selectedSide === 'core' ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.08)', border: '2px solid #34d399', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>Hexagonal Core</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Domain Model &amp; Ports (Interfaces)</div>
          </div>

          <div style={{ background: selectedSide === 'secondary' ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.08)', border: '1.5px solid #fbbf24', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>Driven Adapters</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>PostgreSQL JPA · Kafka · Vault</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {selectedSide === 'primary' && <span><strong>Primary / Driving Adapters:</strong> Trigger actions in the application. They parse external HTTP requests and call the inbound Ports (Use Case interfaces) defined by the core.</span>}
        {selectedSide === 'core' && <span><strong>Application Core &amp; Ports:</strong> Pure domain business logic. It defines Inbound Ports for use cases and Outbound Ports (Repository interfaces) for persistence, with zero external infrastructure imports.</span>}
        {selectedSide === 'secondary' && <span><strong>Secondary / Driven Adapters:</strong> Called by the application core. They implement the outbound Port interfaces defined by the core to write to SQL databases, publish to Kafka, or call third-party APIs.</span>}
      </div>
    </div>
  );
}
