import React, { useState } from 'react';

interface FlyweightState {
  id: string;
  name: string;
  badge: string;
  color: string;
  memoryImpact: string;
  examples: string[];
  explanation: string;
}

const FLYWEIGHT_STATES: FlyweightState[] = [
  {
    id: 'intrinsic',
    name: '1. Intrinsic State (Shared Flyweight)',
    badge: 'SHARED IMMUTABLE',
    color: '#34d399', // Emerald
    memoryImpact: 'RAM Usage: 1 Single Shared Instance in Memory (100 KB total for 1,000,000 game trees)',
    examples: ['TreeType { name: "Oak", color: "Green", texture: "OakBole.png" }', 'ParticleType { sprite: "Bullet.png", speed: 50 }'],
    explanation: 'Immutable data that remains identical across thousands or millions of object instances. Stored once in the FlyweightFactory pool.'
  },
  {
    id: 'extrinsic',
    name: '2. Extrinsic State (Context Object)',
    badge: 'CONTEXT UNIQUE',
    color: '#fbbf24', // Amber
    memoryImpact: 'RAM Usage: Light primitives (X, Y coordinates + age) stored per individual entity',
    examples: ['TreeContext { x: 142.5, y: 88.0, health: 100, typeRef: oakFlyweight }', 'ParticleContext { x: 10, y: 45, opacity: 0.8 }'],
    explanation: 'Context-specific data that varies per instance. Passed into flyweight methods as method parameters during rendering.'
  }
];

export default function FlyweightDiagram() {
  const [activeId, setActiveId] = useState<string>('intrinsic');
  const current = FLYWEIGHT_STATES.find(s => s.id === activeId) || FLYWEIGHT_STATES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Flyweight Design Pattern: Intrinsic vs Extrinsic Memory Optimization</span>
      </div>

      {/* State Selector */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {FLYWEIGHT_STATES.map((s) => {
            const isActive = activeId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setActiveId(s.id)}
                style={{
                  background: isActive ? `${s.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? s.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: s.color, background: `${s.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {s.badge}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {s.name.split('. ')[1]}
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
        <div style={{ fontSize: '12px', color: current.color, fontWeight: 700, marginBottom: '12px' }}>
          {current.memoryImpact}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.explanation}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
            Data Representation Examples
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
            {current.examples.map((ex, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{ex}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
