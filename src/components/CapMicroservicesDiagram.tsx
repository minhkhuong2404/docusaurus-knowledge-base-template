import React, { useState } from 'react';

interface ServiceNode {
  id: string;
  name: string;
  tradeoff: 'AP' | 'CP';
  color: string;
  dbType: string;
  detail: string;
  cx: number;
  cy: number;
}

const SERVICES: ServiceNode[] = [
  {
    id: 'CATALOG',
    name: 'Product Catalog',
    tradeoff: 'AP',
    color: '#fbbf24',
    dbType: 'MongoDB / DynamoDB',
    detail: 'Product descriptions, tags, and media are read-heavy. Stale information (e.g. description updates taking 20s to propagate) is acceptable to guarantee ultra-high read availability globally.',
    cx: 80,
    cy: 50,
  },
  {
    id: 'SEARCH',
    name: 'Search Index',
    tradeoff: 'AP',
    color: '#fbbf24',
    dbType: 'Elasticsearch / Opensearch',
    detail: 'Catalog changes replicate asynchronously via event logs to search databases. Eventual consistency is expected; users might search for items that were updated seconds ago.',
    cx: 80,
    cy: 140,
  },
  {
    id: 'INVENTORY',
    name: 'Inventory Reserve',
    tradeoff: 'CP',
    color: '#ef4444',
    dbType: 'PostgreSQL / MySQL (Strict Locks)',
    detail: 'Oversells must be prevented. If the network splits, checkout operations for affected partitions must block or fail rather than risk double-selling the last stock item.',
    cx: 270,
    cy: 50,
  },
  {
    id: 'CHECKOUT',
    name: 'Checkout Order',
    tradeoff: 'CP',
    color: '#ef4444',
    dbType: 'Google Spanner / CockroachDB',
    detail: 'Orders must be processed atomically across payments and warehouse reserves. Uses distributed transactional consensus to ensure strong consistency.',
    cx: 270,
    cy: 140,
  },
];

export default function CapMicroservicesDiagram(): React.JSX.Element {
  const [activeId, setActiveId] = useState<string>('INVENTORY');

  const active = SERVICES.find(s => s.id === activeId) || SERVICES[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9"/>
          <rect x="14" y="3" width="7" height="5"/>
          <rect x="14" y="12" width="7" height="9"/>
          <rect x="3" y="16" width="7" height="5"/>
          <line x1="7" y1="7" x2="14" y2="5"/>
          <line x1="7" y1="18" x2="14" y2="15"/>
        </svg>
        <span style={{ color: '#34d399' }}>E-Commerce Microservice-Level CAP Boundaries</span>
      </div>

      <style>{`
        .micro-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .micro-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="micro-grid">
        
        {/* SVG Network Graph */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="mc-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.2)" />
              </marker>
            </defs>

            {/* Service connections */}
            {/* Catalog -> Search */}
            <path d="M 80 80 L 80 120" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Catalog -> Inventory */}
            <path d="M 125 50 L 225 50" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Checkout -> Inventory */}
            <path d="M 270 120 L 270 80" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Search -> Checkout */}
            <path d="M 125 140 L 225 140" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Nodes */}
            {SERVICES.map(node => {
              const isSelected = node.id === activeId;
              return (
                <g key={node.id} onClick={() => setActiveId(node.id)} style={{ cursor: 'pointer' }}>
                  {/* Node Box */}
                  <rect
                    x={node.cx - 45}
                    y={node.cy - 20}
                    width="90"
                    height="40"
                    rx="5"
                    fill={isSelected ? `${node.color}15` : 'rgba(15,23,42,0.7)'}
                    stroke={isSelected ? node.color : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isSelected ? '2' : '1'}
                    style={{ transition: 'all 0.2s' }}
                  />

                  {/* Node Title */}
                  <text x={node.cx} y={node.cy - 4} textAnchor="middle" fill="#e2e8f0" fontSize="7.5" fontWeight="bold">
                    {node.name}
                  </text>

                  {/* Trade-off Tag */}
                  <text x={node.cx} y={node.cy + 10} textAnchor="middle" fill={node.color} fontSize="7" fontWeight="bold">
                    {node.tradeoff} System
                  </text>
                </g>
              );
            })}

            <text x="175" y="190" textAnchor="middle" fill="#475569" fontSize="8" fontStyle="italic">
              💡 Click any service box to check its database requirements.
            </text>
          </svg>
        </div>

        {/* Info panel */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${active.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div>
            <h3 style={{ color: active.color }}>{active.name}</h3>
            <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Subsystem trade-off: {active.tradeoff}
            </span>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
            {active.detail}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${active.color}`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '11px',
            marginTop: '4px',
          }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Database Selection
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, fontFamily: 'monospace' }}>
              {active.dbType}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
