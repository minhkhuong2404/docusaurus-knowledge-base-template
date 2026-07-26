import React, { useState } from 'react';

interface PatternItem {
  id: string;
  name: string;
  relationship: string;
  upstream: string;
  downstream: string;
  color: string;
  description: string;
}

const PATTERNS: PatternItem[] = [
  {
    id: 'publang',
    name: 'Published Language (PL / OHS)',
    relationship: 'Upstream → Downstream',
    upstream: 'Catalog Service (Publisher)',
    downstream: 'Checkout & Recommendation Services',
    color: '#38bdf8',
    description: 'The upstream context defines a stable, documented exchange format (JSON schema / Proto) for all consumers to consume.',
  },
  {
    id: 'acl',
    name: 'Anti-Corruption Layer (ACL)',
    relationship: 'Upstream → ACL → Downstream',
    upstream: 'Legacy SAP ERP (Legacy Schema)',
    downstream: 'Modern Billing Service (Clean Domain Model)',
    color: '#34d399',
    description: 'A translation layer placed on the downstream side to translate foreign schemas into clean internal domain objects, insulating the domain from legacy debt.',
  },
  {
    id: 'conformist',
    name: 'Conformist',
    relationship: 'Upstream ➔ Downstream (No Translation)',
    upstream: 'Stripe Payment Gateway API',
    downstream: 'Analytics Service',
    color: '#fbbf24',
    description: 'Downstream context accepts the upstream model as-is without any translation layer, conforming completely to the upstream schema.',
  },
  {
    id: 'shared',
    name: 'Shared Kernel',
    relationship: 'Context A ↔ Context B (Shared Code)',
    upstream: 'Order Service',
    downstream: 'Fulfillment Service',
    color: '#a78bfa',
    description: 'Two teams share a common subset of the domain model and database schema. Changes require mutual agreement between both teams.',
  },
];

export default function DddContextMappingDiagram() {
  const [selected, setSelected] = useState<PatternItem>(PATTERNS[1]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/>
          <circle cx="6" y="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
        </svg>
        <span>DDD Context Mapping Patterns Explorer</span>
      </div>

      {/* Pattern Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {PATTERNS.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700,
              background: selected.id === p.id ? `${p.color}20` : 'rgba(255,255,255,0.04)',
              color: selected.id === p.id ? p.color : 'var(--ifm-color-content-secondary)',
              boxShadow: selected.id === p.id ? `0 0 0 1.5px ${p.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Visual Canvas */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.4fr 1.2fr', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${selected.color}`, padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: selected.color }}>{selected.upstream}</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Upstream Context</div>
          </div>

          <div style={{ fontSize: '14px', color: selected.color, fontWeight: 800 }}>→</div>

          <div style={{ background: `${selected.color}15`, border: `2px solid ${selected.color}`, padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: selected.color }}>{selected.downstream}</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Downstream Context</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>Pattern Insight:</strong> {selected.description}
      </div>
    </div>
  );
}
