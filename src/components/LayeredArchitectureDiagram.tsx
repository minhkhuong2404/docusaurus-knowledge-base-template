import React, { useState } from 'react';

interface Layer {
  name: string;
  badge: string;
  color: string;
  responsibilities: string;
}

const LAYERS: Layer[] = [
  { name: 'Presentation Layer', badge: 'Controllers / DTOs', color: '#f87171', responsibilities: 'Receives HTTP/GraphQL requests, parses DTOs, validates input syntax, and returns HTTP status codes.' },
  { name: 'Application Layer', badge: 'Use Cases', color: '#fbbf24', responsibilities: 'Orchestrates use-cases and transaction boundaries (@Transactional). Calls domain models & repositories.' },
  { name: 'Domain Layer', badge: 'Pure Domain Logic', color: '#34d399', responsibilities: 'Contains Entities, Value Objects, Aggregates, Domain Services, and Domain Events. Enforces invariants.' },
  { name: 'Infrastructure Layer', badge: 'Persistence & I/O', color: '#38bdf8', responsibilities: 'Implements repository interfaces using Spring Data JPA, Kafka producers, Redis caches, and HTTP clients.' },
];

export default function LayeredArchitectureDiagram() {
  const [selectedLayer, setSelectedLayer] = useState<Layer>(LAYERS[2]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 17 22 12"/>
        </svg>
        <span>Layered Architecture Pattern Explorer</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {LAYERS.map(l => {
            const isSelected = selectedLayer.name === l.name;
            return (
              <div
                key={l.name}
                onClick={() => setSelectedLayer(l)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                  background: isSelected ? `${l.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? l.color : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600, color: isSelected ? l.color : 'var(--ifm-color-content)' }}>
                  {l.name}
                </span>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: `${l.color}30`, color: l.color, fontWeight: 700 }}>
                  {l.badge}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: `1.5px solid ${selectedLayer.color}50`, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>{selectedLayer.name}:</strong> {selectedLayer.responsibilities}
      </div>
    </div>
  );
}
