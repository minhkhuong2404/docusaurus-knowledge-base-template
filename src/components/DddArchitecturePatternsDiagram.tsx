import React, { useState } from 'react';

interface ArchPattern {
  id: string;
  name: string;
  creator: string;
  color: string;
  layers: string[];
  keyConcept: string;
  codeStructure: string;
}

const ARCHITECTURES: ArchPattern[] = [
  {
    id: 'layered',
    name: 'Layered Architecture',
    creator: 'Traditional Enterprise',
    color: '#38bdf8',
    layers: ['Presentation Layer', 'Application Layer', 'Domain Layer', 'Infrastructure Layer'],
    keyConcept: 'Top-down strict flow: Outer presentation depends on application, application depends on domain, domain depends on infrastructure.',
    codeStructure: 'com.example.app.controller → com.example.app.service → com.example.app.domain → com.example.app.repository',
  },
  {
    id: 'hexagonal',
    name: 'Hexagonal Architecture (Ports & Adapters)',
    creator: 'Alistair Cockburn',
    color: '#34d399',
    layers: ['Primary/Driving Adapters (REST, CLI)', 'Primary Ports (Inbound Interfaces)', 'Core Domain Model', 'Secondary Ports (Outbound Interfaces)', 'Secondary/Driven Adapters (DB, Kafka)'],
    keyConcept: 'Decouples core application logic from external tech. Core defines Ports (interfaces); Adapters plug into Ports.',
    codeStructure: 'domain.model (pure) | domain.ports.in & out | infrastructure.adapters.persistence & messaging',
  },
  {
    id: 'onion',
    name: 'Onion Architecture',
    creator: 'Jeffrey Palermo',
    color: '#fbbf24',
    layers: ['Domain Model (Core)', 'Domain Services', 'Application Services (Use Cases)', 'Infrastructure & UI (Outer Ring)'],
    keyConcept: 'Concentric rings with strict Dependency Inversion Principle. All code points inward toward the Domain Core.',
    codeStructure: 'core.domain → core.services → application.usecases → infrastructure.persistence',
  },
  {
    id: 'clean',
    name: 'Clean Architecture',
    creator: 'Robert C. Martin (Uncle Bob)',
    color: '#a78bfa',
    layers: ['Entities (Enterprise Rules)', 'Use Cases (Application Rules)', 'Interface Adapters (Controllers, Gateways)', 'Frameworks & Drivers (Web, DB, UI)'],
    keyConcept: 'The Dependency Rule: Source code dependencies can ONLY point inward. Inner circles know nothing about outer circles.',
    codeStructure: 'entities → usecases → interface_adapters (controllers/presenters) → frameworks (spring/hibernate)',
  },
];

export default function DddArchitecturePatternsDiagram() {
  const [activeArch, setActiveArch] = useState<ArchPattern>(ARCHITECTURES[1]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>DDD Architectural Patterns Comparison Explorer</span>
      </div>

      {/* Architecture Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {ARCHITECTURES.map(a => (
          <button
            key={a.id}
            onClick={() => setActiveArch(a)}
            style={{
              flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11.5px', fontWeight: 700,
              background: activeArch.id === a.id ? `${a.color}20` : 'rgba(255,255,255,0.04)',
              color: activeArch.id === a.id ? a.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeArch.id === a.id ? `0 0 0 1.5px ${a.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* Layer Stack Representation */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: activeArch.color, textTransform: 'uppercase', marginBottom: '10px' }}>
          {activeArch.name} Layer Structure ({activeArch.creator})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {activeArch.layers.map((l, idx) => (
            <div
              key={l}
              style={{
                padding: '8px 12px', borderRadius: '6px', textAlign: 'center',
                background: `${activeArch.color}${Math.max(15, 40 - idx * 8).toString(16)}`,
                border: `1px solid ${activeArch.color}50`,
                color: 'var(--ifm-color-content)', fontSize: '12px', fontWeight: 700,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Details Card */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${activeArch.color}50` }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: activeArch.color, marginBottom: '6px' }}>
          Key Architectural Concept:
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '10px', lineHeight: '1.5' }}>
          {activeArch.keyConcept}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: activeArch.color, border: '1px solid rgba(255,255,255,0.08)' }}>
          Package Layout: {activeArch.codeStructure}
        </div>
      </div>
    </div>
  );
}
