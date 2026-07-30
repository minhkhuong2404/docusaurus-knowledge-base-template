import React, { useState } from 'react';

interface Circle {
  id: string;
  name: string;
  color: string;
  concept: string;
}

const CIRCLES: Circle[] = [
  { id: 'entities', name: 'Entities (Enterprise Business Rules)', color: '#34d399', concept: 'Encapsulate enterprise-wide business rules. Objects with methods or data structures used across multiple applications.' },
  { id: 'usecases', name: 'Use Cases (Application Business Rules)', color: '#38bdf8', concept: 'Contains application-specific business rules. Directs data flow to and from entities to achieve use case goals.' },
  { id: 'adapters', name: 'Interface Adapters (Controllers / Presenters)', color: '#fbbf24', concept: 'Converts data from format convenient for use cases/entities into format convenient for DB or Web UI.' },
  { id: 'frameworks', name: 'Frameworks & Drivers (Web / DB / UI)', color: '#a78bfa', concept: 'Outer layer composed of frameworks (Spring Boot, React, Hibernate). Pure glue code.' },
];

export default function CleanArchitectureDiagram() {
  const [selectedCircle, setSelectedCircle] = useState<Circle>(CIRCLES[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="7"/>
          <circle cx="12" cy="12" r="4"/>
        </svg>
        <span>Clean Architecture (Robert C. Martin) Concentric Circles</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {CIRCLES.map(c => {
            const isSelected = selectedCircle.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCircle(c)}
                style={{
                  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                  background: isSelected ? `${c.color}25` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? c.color : 'rgba(255,255,255,0.08)'}`,
                  color: isSelected ? c.color : 'var(--ifm-color-content)', fontWeight: isSelected ? 800 : 600,
                  transition: 'all 0.2s ease',
                }}
              >
                {c.name}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: `1.5px solid ${selectedCircle.color}50`, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>The Dependency Rule:</strong> Source code dependencies can ONLY point inward toward Enterprise Entities. {selectedCircle.concept}
      </div>
    </div>
  );
}
