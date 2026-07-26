import React, { useState } from 'react';

interface ContextItem {
  id: string;
  name: string;
  color: string;
  termMeaning: string;
  entities: string[];
  teamOwner: string;
}

const CONTEXTS: ContextItem[] = [
  { id: 'catalog', name: 'Catalog Context', color: '#38bdf8', termMeaning: 'Product = Display entity with marketing description, images, & list price', entities: ['Product', 'Category', 'Brand', 'Price'], teamOwner: 'Catalog Team' },
  { id: 'checkout', name: 'Checkout Context', color: '#34d399', termMeaning: 'Order = Transactional state with payment status, cart items, & line discounts', entities: ['Order', 'Cart', 'OrderLine', 'PaymentRef'], teamOwner: 'Checkout Team' },
  { id: 'inventory', name: 'Inventory Context', color: '#fbbf24', termMeaning: 'StockItem = Warehouse location, physical SKU count, & reservation hold', entities: ['StockItem', 'Warehouse', 'Location', 'Reservation'], teamOwner: 'Logistics Team' },
  { id: 'shipping', name: 'Shipping Context', color: '#a78bfa', termMeaning: 'Shipment = Carrier tracking number, package weight, & delivery address', entities: ['Shipment', 'Tracking', 'Carrier', 'Parcel'], teamOwner: 'Fulfillment Team' },
];

export default function DddBoundedContextsDiagram() {
  const [selected, setSelected] = useState<ContextItem>(CONTEXTS[1]);
  const [viewMode, setViewMode] = useState<'bounded' | 'microservice'>('bounded');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>DDD Bounded Contexts &amp; Microservices Boundary Mapping</span>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setViewMode('bounded')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: viewMode === 'bounded' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
            color: viewMode === 'bounded' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: viewMode === 'bounded' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          🧩 Ubiquitous Language &amp; Domain Boundaries
        </button>
        <button
          onClick={() => setViewMode('microservice')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: viewMode === 'microservice' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: viewMode === 'microservice' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: viewMode === 'microservice' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          🚀 1-to-1 Microservice &amp; Database Mapping
        </button>
      </div>

      {/* Context Grid */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {CONTEXTS.map(c => {
            const isSelected = selected.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                style={{
                  background: isSelected ? `${c.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? c.color : 'rgba(255,255,255,0.08)'}`,
                  padding: '14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: c.color }}>{c.name}</span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${c.color}30`, color: c.color, fontWeight: 700 }}>
                    {viewMode === 'bounded' ? c.teamOwner : 'Independent DB'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                  Entities: {c.entities.join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Card */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${selected.color}50` }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: selected.color, textTransform: 'uppercase' }}>
          {selected.name} Inspection
        </div>
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)', marginTop: '4px', marginBottom: '8px' }}>
          {selected.termMeaning}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
          {viewMode === 'bounded'
            ? `Bounded Context Principle: Words have exact meaning only inside their boundary. "Product" in Catalog contains pricing and images; in Checkout, it is merely an immutable line item reference.`
            : `Microservice Alignment: Each bounded context maps to a dedicated microservice container with its own private database, schema evolution, and deployment pipeline.`}
        </div>
      </div>
    </div>
  );
}
