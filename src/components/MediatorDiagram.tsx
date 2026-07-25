import React, { useState } from 'react';

interface CommunicationArchitecture {
  id: string;
  name: string;
  badge: string;
  color: string;
  topology: string;
  couplingDegree: string;
  explanation: string;
}

const ARCHITECTURES: CommunicationArchitecture[] = [
  {
    id: 'mesh',
    name: '1. Direct Mesh Coupling (No Mediator)',
    badge: 'HIGH COUPLING',
    color: '#f87171', // Red
    topology: 'N components hold direct references to each other (N * (N-1) connections)',
    couplingDegree: 'Tightly Coupled (O(N^2) complexity)',
    explanation: 'Every component must know about all other components. Modifying 1 component breaks multiple peer classes.'
  },
  {
    id: 'mediator',
    name: '2. Centralized Mediator Hub',
    badge: 'DECOUPLED HUB',
    color: '#34d399', // Emerald
    topology: 'Components communicate ONLY via central Mediator interface (N connections)',
    couplingDegree: 'Loosely Coupled (O(N) complexity)',
    explanation: 'Colleagues delegate notification events to Mediator hub. Mediator coordinates peer interactions in one place.'
  }
];

export default function MediatorDiagram() {
  const [activeId, setActiveId] = useState<string>('mediator');
  const current = ARCHITECTURES.find(a => a.id === activeId) || ARCHITECTURES[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="8" />
          <line x1="12" y1="16" x2="12" y2="22" />
          <line x1="2" y1="12" x2="8" y2="12" />
          <line x1="16" y1="12" x2="22" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Mediator Design Pattern: Centralized Inter-Component Coordination</span>
      </div>

      {/* Selector Grid */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {ARCHITECTURES.map((arch) => {
            const isActive = activeId === arch.id;
            return (
              <div
                key={arch.id}
                onClick={() => setActiveId(arch.id)}
                style={{
                  background: isActive ? `${arch.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? arch.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: arch.color, background: `${arch.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {arch.badge}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {arch.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '12px', color: current.color, fontWeight: 700, marginBottom: '12px' }}>
          Coupling Degree: {current.couplingDegree}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.explanation}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
            Connection Topology
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
            {current.topology}
          </div>
        </div>
      </div>
    </div>
  );
}
