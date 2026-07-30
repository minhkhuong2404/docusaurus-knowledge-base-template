import React, { useState } from 'react';

interface MappingItem {
  context: string;
  service: string;
  db: string;
  color: string;
  description: string;
}

const MAPPINGS: MappingItem[] = [
  { context: 'Catalog Context', service: 'Catalog Service', db: 'Catalog DB (Mongo / Postgres)', color: '#38bdf8', description: 'Manages product catalog data, marketing categories, and search indexes.' },
  { context: 'Checkout Context', service: 'Order Service', db: 'Orders DB (PostgreSQL ACID)', color: '#34d399', description: 'Handles order creation, cart state, transactional checks, and checkout lifecycle.' },
  { context: 'Inventory Context', service: 'Inventory Service', db: 'Inventory DB (Redis / SQL)', color: '#fbbf24', description: 'Tracks real-time SKU warehouse stock levels, reservations, and location holds.' },
  { context: 'Shipping Context', service: 'Shipping Service', db: 'Shipping DB (PostgreSQL)', color: '#a78bfa', description: 'Manages carrier integrations, tracking numbers, and package dispatch scheduling.' },
  { context: 'Payment Context', service: 'Payment Service', db: 'Payments DB (Secure Vault)', color: '#f87171', description: 'Handles Stripe/PayPal integration, idempotency tokens, and payment receipts.' },
];

export default function DddMicroservicesMappingDiagram() {
  const [selected, setSelected] = useState<MappingItem>(MAPPINGS[1]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/>
          <line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span>DDD Bounded Context to Microservice Boundary Mapping</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MAPPINGS.map(m => {
            const isSelected = selected.context === m.context;
            return (
              <div
                key={m.context}
                onClick={() => setSelected(m)}
                style={{
                  display: 'grid', gridTemplateColumns: '1.2fr 0.3fr 1.2fr 1.2fr', gap: '8px', alignItems: 'center',
                  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                  background: isSelected ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? m.color : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: m.color }}>{m.context}</div>
                <div style={{ fontSize: '12px', color: m.color, textAlign: 'center' }}>→</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{m.service}</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>{m.db}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: `1.5px solid ${selected.color}50`, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>Boundary Rule:</strong> Map 1 Bounded Context to 1 Microservice deployment boundary when team ownership aligns. {selected.description}
      </div>
    </div>
  );
}
