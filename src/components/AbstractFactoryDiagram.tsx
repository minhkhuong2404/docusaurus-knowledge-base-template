import React, { useState } from 'react';

interface ProductFamily {
  id: string;
  name: string;
  badge: string;
  color: string;
  factoryClass: string;
  products: {
    button: string;
    checkbox: string;
    textfield: string;
  };
  styleNote: string;
}

const FAMILIES: ProductFamily[] = [
  {
    id: 'mac',
    name: '1. macOS GUI Factory Family',
    badge: 'MAC FAMILY',
    color: '#38bdf8', // Sky Blue
    factoryClass: 'MacGUIFactory implements GUIFactory',
    products: {
      button: 'MacButton (rounded corner, Aqua shadow)',
      checkbox: 'MacCheckbox (blue checkmark toggle)',
      textfield: 'MacTextField (SF Pro font, smooth caret)'
    },
    styleNote: 'Guarantees all UI widgets match Apple Human Interface Guidelines consistently.'
  },
  {
    id: 'win',
    name: '2. Windows GUI Factory Family',
    badge: 'WIN FAMILY',
    color: '#a78bfa', // Purple
    factoryClass: 'WinGUIFactory implements GUIFactory',
    products: {
      button: 'WinButton (Fluent UI acrylic blur)',
      checkbox: 'WinCheckbox (square box with accent color)',
      textfield: 'WinTextField (Segoe UI font, clear button)'
    },
    styleNote: 'Guarantees all UI widgets adhere to Microsoft Fluent Design System specs.'
  }
];

export default function AbstractFactoryDiagram() {
  const [activeId, setActiveId] = useState<string>('mac');
  const activeFamily = FAMILIES.find(f => f.id === activeId) || FAMILIES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Abstract Factory Design Pattern: Families of Related Objects</span>
      </div>

      {/* Family Tabs */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {FAMILIES.map((fam) => {
            const isActive = activeId === fam.id;
            return (
              <div
                key={fam.id}
                onClick={() => setActiveId(fam.id)}
                style={{
                  background: isActive ? `${fam.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? fam.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: fam.color, background: `${fam.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {fam.badge}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {fam.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Family Matrix Panel */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activeFamily.color, marginBottom: '4px' }}>
          {activeFamily.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', fontFamily: 'monospace' }}>
          Factory: {activeFamily.factoryClass}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '10px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: activeFamily.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              Button Product
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>
              {activeFamily.products.button}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '10px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: activeFamily.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              Checkbox Product
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>
              {activeFamily.products.checkbox}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '10px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: activeFamily.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              TextField Product
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>
              {activeFamily.products.textfield}
            </div>
          </div>
        </div>

        <div style={{ background: `${activeFamily.color}15`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeFamily.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activeFamily.color }}>Family Consistency Guarantee: </strong>
          {activeFamily.styleNote}
        </div>
      </div>
    </div>
  );
}
