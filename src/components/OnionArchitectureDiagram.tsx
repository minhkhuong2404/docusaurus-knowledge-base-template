import React, { useState } from 'react';

interface Ring {
  id: string;
  name: string;
  color: string;
  content: string;
}

const RINGS: Ring[] = [
  { id: 'core', name: 'Domain Model (Center Ring)', color: '#34d399', content: 'Entities, Value Objects, and Domain Services. Contains pure domain logic with zero external dependencies.' },
  { id: 'domain_svc', name: 'Domain Services Ring', color: '#38bdf8', content: 'Domain logic operations that span multiple entities (e.g. OrderPricingService).' },
  { id: 'app_svc', name: 'Application Services Ring', color: '#fbbf24', content: 'Use case workflows, application services, and transaction management.' },
  { id: 'infra', name: 'Infrastructure & UI (Outer Ring)', color: '#f87171', content: 'Frameworks, Spring Boot Controllers, JPA Repositories, Database drivers, and UI.' },
];

export default function OnionArchitectureDiagram() {
  const [selectedRing, setSelectedRing] = useState<Ring>(RINGS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
        <span>Onion Architecture Concentric Rings Explorer</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {RINGS.map(r => {
            const isSelected = selectedRing.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRing(r)}
                style={{
                  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                  background: isSelected ? `${r.color}25` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? r.color : 'rgba(255,255,255,0.08)'}`,
                  color: isSelected ? r.color : 'var(--ifm-color-content)', fontWeight: isSelected ? 800 : 600,
                  transition: 'all 0.2s ease',
                }}
              >
                {r.name}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: `1.5px solid ${selectedRing.color}50`, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>Dependency Inversion Rule:</strong> Outer rings depend on inner rings. Inner rings have zero awareness of outer rings. {selectedRing.content}
      </div>
    </div>
  );
}
