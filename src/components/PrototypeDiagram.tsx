import React, { useState } from 'react';

interface PrototypeMode {
  id: string;
  name: string;
  badge: string;
  color: string;
  mechanism: string;
  referenceBehavior: string;
  codePattern: string;
}

const MODES: PrototypeMode[] = [
  {
    id: 'shallow',
    name: '1. Shallow Copy Cloning',
    badge: 'SHARED REF',
    color: '#fbbf24', // Amber
    mechanism: 'Copies primitive fields directly, but copies object references (pointers) to the exact same memory locations.',
    referenceBehavior: 'Modifying a nested object field in the clone MUTATES the original object!',
    codePattern: 'public Object clone() {\n  return super.clone(); // Shallow copy default\n}'
  },
  {
    id: 'deep',
    name: '2. Deep Copy Cloning',
    badge: 'INDEPENDENT',
    color: '#34d399', // Emerald
    mechanism: 'Recursively creates new instances of all nested objects and sub-structures.',
    referenceBehavior: 'Original and clone objects are 100% completely decoupled in heap memory.',
    codePattern: 'public Document clone() {\n  Document copy = new Document(this.title);\n  copy.author = new Author(this.author.name); // Deep copy nested ref\n  return copy;\n}'
  }
];

export default function PrototypeDiagram() {
  const [activeId, setActiveId] = useState<string>('deep');
  const current = MODES.find(m => m.id === activeId) || MODES[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Prototype Design Pattern: Object Cloning Mechanics</span>
      </div>

      {/* Mode Selector */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {MODES.map((m) => {
            const isActive = activeId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setActiveId(m.id)}
                style={{
                  background: isActive ? `${m.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? m.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: m.color, background: `${m.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {m.badge}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {m.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Inspector */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.mechanism}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Memory Reference Behavior
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {current.referenceBehavior}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Implementation Code Pattern
            </div>
            <pre style={{
              background: '#090b14',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--ifm-color-content)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {current.codePattern}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
