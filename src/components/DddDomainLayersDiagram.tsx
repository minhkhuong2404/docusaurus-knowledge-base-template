import React, { useState } from 'react';

interface LayerItem {
  name: string;
  badge: string;
  color: string;
  components: string;
  rules: string;
}

const LAYERS: LayerItem[] = [
  {
    name: 'Presentation / User Interface Layer',
    badge: 'Outer Edge',
    color: '#f87171',
    components: 'REST Controllers, GraphQL Resolvers, CLI commands, DTO Mappers',
    rules: 'Handles HTTP requests/responses, deserializes DTOs, delegates to Application Services. Zero domain business logic.',
  },
  {
    name: 'Application Layer',
    badge: 'Use Case Coordinator',
    color: '#fbbf24',
    components: 'Application Services, Command Handlers, Transaction Managers (@Transactional), Security Guards',
    rules: 'Coordinates use cases: loads aggregates from repositories, invokes domain logic, saves aggregate, publishes domain events. No business invariants enforced here.',
  },
  {
    name: 'Domain Layer',
    badge: 'Pure Business Core',
    color: '#34d399',
    components: 'Entities, Value Objects, Aggregates, Domain Services, Invariants, Domain Events',
    rules: 'The heart of software. 100% pure Java/C# code with zero dependencies on frameworks, databases, or HTTP. Enforces business invariants.',
  },
  {
    name: 'Infrastructure Layer',
    badge: 'Framework Adapter',
    color: '#38bdf8',
    components: 'JPA Repositories, Kafka Event Publishers, Vault Clients, External REST API Adapters',
    rules: 'Implements interfaces (ports) declared in domain & application layers. Handles technical persistence and network calls.',
  },
];

export default function DddDomainLayersDiagram() {
  const [selectedLayer, setSelectedLayer] = useState<LayerItem>(LAYERS[2]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Classical 4-Layer DDD Architecture Explorer</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Layer Stack */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Dependency Direction (Inward → Domain is Central)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {LAYERS.map(l => {
              const isSelected = selectedLayer.name === l.name;
              return (
                <div
                  key={l.name}
                  onClick={() => setSelectedLayer(l)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                    background: isSelected ? `${l.color}20` : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${isSelected ? l.color : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: isSelected ? 800 : 600, color: isSelected ? l.color : 'var(--ifm-color-content)' }}>
                    {l.name}
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${l.color}30`, color: l.color, fontWeight: 700 }}>
                    {l.badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Layer Detail */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${selectedLayer.color}50` }}>
          <div style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: `${selectedLayer.color}20`, color: selectedLayer.color, display: 'inline-block', marginBottom: '8px' }}>
            {selectedLayer.badge}
          </div>

          <div style={{ fontSize: '14px', fontWeight: 800, color: selectedLayer.color, marginBottom: '8px' }}>
            {selectedLayer.name}
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
            <strong>Components:</strong> {selectedLayer.components}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
            {selectedLayer.rules}
          </div>
        </div>
      </div>
    </div>
  );
}
