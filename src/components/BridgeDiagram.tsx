import React, { useState } from 'react';

interface BridgeCombination {
  id: string;
  name: string;
  badge: string;
  color: string;
  abstraction: string;
  implementation: string;
  result: string;
}

const COMBINATIONS: BridgeCombination[] = [
  {
    id: 'basic-tv',
    name: '1. Basic Remote + TV Implementation',
    badge: 'BASIC REMOTE',
    color: '#38bdf8', // Sky Blue
    abstraction: 'BasicRemoteControl (togglePower, volumeUp, volumeDown)',
    implementation: 'TvDevice implements DeviceInterface',
    result: 'Controls basic TV power and volume via IR signal.'
  },
  {
    id: 'adv-tv',
    name: '2. Advanced Remote + TV Implementation',
    badge: 'ADVANCED REMOTE',
    color: '#a78bfa', // Purple
    abstraction: 'AdvancedRemoteControl extends BasicRemoteControl (mute, setChannel)',
    implementation: 'TvDevice implements DeviceInterface',
    result: 'Adds mute toggle and numerical channel navigation to TV control.'
  },
  {
    id: 'adv-radio',
    name: '3. Advanced Remote + Smart Radio Implementation',
    badge: 'SMART RADIO',
    color: '#34d399', // Emerald
    abstraction: 'AdvancedRemoteControl extends BasicRemoteControl (mute, setFrequency)',
    implementation: 'RadioDevice implements DeviceInterface',
    result: 'Same Advanced Remote abstraction controls FM radio frequencies without code duplication!'
  }
];

export default function BridgeDiagram() {
  const [activeId, setActiveId] = useState<string>('adv-tv');
  const current = COMBINATIONS.find(c => c.id === activeId) || COMBINATIONS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Bridge Design Pattern: Abstraction vs Implementation Decoupling</span>
      </div>

      {/* Selector Grid */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {COMBINATIONS.map((c) => {
            const isActive = activeId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                style={{
                  background: isActive ? `${c.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? c.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: c.color, background: `${c.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {c.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {c.name.split('. ')[1]}
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Abstraction Layer
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {current.abstraction}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Implementation Layer
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {current.implementation}
            </div>
          </div>
        </div>

        <div style={{ background: `${current.color}15`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${current.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: current.color }}>Decoupled Runtime Behavior: </strong>
          {current.result}
        </div>
      </div>
    </div>
  );
}
