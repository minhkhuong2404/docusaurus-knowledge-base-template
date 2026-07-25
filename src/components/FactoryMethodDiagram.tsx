import React, { useState } from 'react';

interface FactoryOption {
  id: string;
  name: string;
  badge: string;
  color: string;
  creatorClass: string;
  productClass: string;
  behavior: string;
}

const FACTORY_OPTIONS: FactoryOption[] = [
  {
    id: 'dialog-win',
    name: '1. Windows Dialog Creator',
    badge: 'WIN PRODUCT',
    color: '#38bdf8', // Sky Blue
    creatorClass: 'WindowsDialog extends Dialog',
    productClass: 'WindowsButton implements Button',
    behavior: 'Renders a native Windows OS button with Windows event listeners and theme styling.'
  },
  {
    id: 'dialog-mac',
    name: '2. Mac Dialog Creator',
    badge: 'MAC PRODUCT',
    color: '#a78bfa', // Purple
    creatorClass: 'MacDialog extends Dialog',
    productClass: 'MacButton implements Button',
    behavior: 'Renders a rounded macOS button with Cocoa event handlers and Aqua glassmorphism theme.'
  },
  {
    id: 'dialog-web',
    name: '3. HTML Web Dialog Creator',
    badge: 'WEB PRODUCT',
    color: '#34d399', // Emerald
    creatorClass: 'WebDialog extends Dialog',
    productClass: 'HtmlButton implements Button',
    behavior: 'Renders a standard DOM `<button>` element with JavaScript click event handlers.'
  }
];

export default function FactoryMethodDiagram() {
  const [activeId, setActiveId] = useState<string>('dialog-mac');
  const activeOpt = FACTORY_OPTIONS.find(f => f.id === activeId) || FACTORY_OPTIONS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Factory Method Design Pattern: Polymorphic Object Creation</span>
      </div>

      {/* Creator Grid Selector */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {FACTORY_OPTIONS.map((opt) => {
            const isActive = activeId === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setActiveId(opt.id)}
                style={{
                  background: isActive ? `${opt.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? opt.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: opt.color, background: `${opt.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {opt.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {opt.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Inspector Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activeOpt.color, marginBottom: '6px' }}>
          {activeOpt.name}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activeOpt.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Concrete Creator Subclass
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {activeOpt.creatorClass}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Instantiated Product Class
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {activeOpt.productClass}
            </div>
          </div>
        </div>

        <div style={{ background: `${activeOpt.color}15`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeOpt.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activeOpt.color }}>Polymorphic Behavior: </strong>
          {activeOpt.behavior}
        </div>
      </div>
    </div>
  );
}
