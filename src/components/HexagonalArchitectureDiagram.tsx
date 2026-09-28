import React, { useState } from 'react';

export default function HexagonalArchitectureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'hexagonal' | 'onion'>('hexagonal');
  const [selectedRing, setSelectedRing] = useState<number>(0);

  const ONION_LAYERS = [
    {
      name: 'Enterprise Business Rules (Entities)',
      color: '#34d399',
      desc: 'The innermost core. Encapsulates critical enterprise-wide business concepts and data structures. Completely independent of any framework, database, UI, or build tool.',
      examples: 'User, Order, Money, Account'
    },
    {
      name: 'Application Business Rules (Use Cases)',
      color: '#38bdf8',
      desc: 'Coordinates the flow of data to and from entities. Directs those entities to use their enterprise business rules to achieve the goals of the use case.',
      examples: 'CreateOrderUseCase, TransferFundsService'
    },
    {
      name: 'Interface Adapters (Controllers & Gateways)',
      color: '#a78bfa',
      desc: 'Translates data from the format most convenient for use cases/entities to the format most convenient for external agencies (web, database).',
      examples: 'OrderRestController, JpaOrderRepositoryAdapter'
    },
    {
      name: 'Frameworks & Drivers (External Web & DB)',
      color: '#f97316',
      desc: 'The outermost layer. Composed of tools, frameworks, and drivers like Spring Boot, PostgreSQL, Kafka, and Redis. Where glue code lives.',
      examples: 'Spring MVC, Hibernate, AWS SDK, Kafka Broker'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Hexagonal Architecture (Ports & Adapters) & Clean Architecture
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'hexagonal', label: '⬡ Ports & Adapters (Hexagonal)', color: '#38bdf8' },
            { id: 'onion', label: '🧅 Clean Architecture Onion', color: '#34d399' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: HEXAGONAL ARCHITECTURE */}
        {activeTab === 'hexagonal' && (
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="hex-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                  <marker id="hex-arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#a78bfa" />
                  </marker>
                </defs>

                {/* Driving Adapters (Left) */}
                <g transform="translate(15, 20)">
                  <rect x="0" y="0" width="160" height="180" rx="8" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#38bdf8" fontSize="11" fontWeight="700">Driving Adapters</text>
                  <text x="12" y="38" fill="#94a3b8" fontSize="8">(Primary / Input)</text>

                  <rect x="10" y="48" width="140" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="#38bdf8" />
                  <text x="16" y="65" fill="#ffffff" fontSize="8.5">🌐 REST Controller</text>

                  <rect x="10" y="80" width="140" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="#38bdf8" />
                  <text x="16" y="97" fill="#ffffff" fontSize="8.5">⚡ GraphQL Endpoint</text>

                  <rect x="10" y="112" width="140" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="#38bdf8" />
                  <text x="16" y="129" fill="#ffffff" fontSize="8.5">💻 CLI Command</text>

                  <rect x="10" y="144" width="140" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="#38bdf8" />
                  <text x="16" y="161" fill="#ffffff" fontSize="8.5">📩 Event Listener</text>
                </g>

                {/* Inward Flow Arrows to Input Port */}
                <path d="M 180 110 L 260 110" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#hex-arrow-blue)" className="interactive-diagram-flowing-path" />
                <text x="185" y="100" fill="#38bdf8" fontSize="8.5" fontWeight="700">Calls Inward</text>

                {/* Hexagon Domain Core & Ports (Center) */}
                <g transform="translate(265, 10)">
                  <rect x="0" y="0" width="290" height="200" rx="10" fill="rgba(15, 23, 42, 0.95)" stroke="#34d399" strokeWidth="2" />
                  <text x="15" y="24" fill="#34d399" fontSize="12" fontWeight="800">⬡ DOMAIN CORE (Pure Business)</text>

                  {/* Input Port Interface */}
                  <rect x="15" y="38" width="260" height="34" rx="4" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                  <text x="25" y="58" fill="#38bdf8" fontSize="9" fontWeight="700">«input port» OrderUseCase (Interface)</text>

                  {/* Domain Entities */}
                  <rect x="15" y="80" width="260" height="50" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                  <text x="25" y="100" fill="#ffffff" fontSize="9.5" fontWeight="700">Entities & Business Logic (POJOs)</text>
                  <text x="25" y="118" fill="#86efac" fontSize="8">ZERO framework dependencies, 100% testable</text>

                  {/* Output Port Interface */}
                  <rect x="15" y="138" width="260" height="48" rx="4" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" />
                  <text x="25" y="156" fill="#a78bfa" fontSize="9" fontWeight="700">«output port» OrderRepository (Interface)</text>
                  <text x="25" y="174" fill="#c4b5fd" fontSize="8">Domain OWNS this interface contract (DIP)</text>
                </g>

                {/* Inward Dependency Arrows from Output Adapters */}
                <path d="M 645 110 L 565 110" fill="none" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#hex-arrow-purple)" className="interactive-diagram-flowing-path" />
                <text x="575" y="100" fill="#a78bfa" fontSize="8.5" fontWeight="700">Implements</text>

                {/* Driven Adapters (Right) */}
                <g transform="translate(650, 20)">
                  <rect x="0" y="0" width="155" height="180" rx="8" fill="rgba(167, 139, 250, 0.08)" stroke="#a78bfa" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#a78bfa" fontSize="11" fontWeight="700">Driven Adapters</text>
                  <text x="12" y="38" fill="#94a3b8" fontSize="8">(Secondary / Output)</text>

                  <rect x="10" y="48" width="135" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="#a78bfa" />
                  <text x="16" y="65" fill="#ffffff" fontSize="8.5">🗄️ PostgreSQL Repo</text>

                  <rect x="10" y="80" width="135" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="#a78bfa" />
                  <text x="16" y="97" fill="#ffffff" fontSize="8.5">⚡ Redis Cache</text>

                  <rect x="10" y="112" width="135" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="#a78bfa" />
                  <text x="16" y="129" fill="#ffffff" fontSize="8.5">💳 Stripe Gateway</text>

                  <rect x="10" y="144" width="135" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="#a78bfa" />
                  <text x="16" y="161" fill="#ffffff" fontSize="8.5">📦 Kafka Producer</text>
                </g>
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '6px' }}>
                <strong style={{ color: '#38bdf8', fontSize: '12px' }}>Driving Adapters (Input):</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  Trigger domain use cases. REST controllers, GraphQL handlers, and CLI commands call the <strong>Input Port</strong>.
                </p>
              </div>

              <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '6px' }}>
                <strong style={{ color: '#34d399', fontSize: '12px' }}>Domain Core (Pure Center):</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  Contains business entities and rules. It has <strong>zero imports</strong> from Spring, Hibernate, or AWS.
                </p>
              </div>

              <div style={{ padding: '12px', background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '6px' }}>
                <strong style={{ color: '#a78bfa', fontSize: '12px' }}>Driven Adapters (Output):</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  Implement <strong>Output Ports</strong>. If you swap Postgres for DynamoDB or Stripe for Adyen, the domain core never changes!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLEAN ARCHITECTURE ONION */}
        {activeTab === 'onion' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '14px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)' }}>
                  CLICK A LAYER TO INSPECT:
                </div>
                {ONION_LAYERS.map((layer, idx) => (
                  <div
                    key={layer.name}
                    onClick={() => setSelectedRing(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${selectedRing === idx ? layer.color : 'rgba(255,255,255,0.08)'}`,
                      background: selectedRing === idx ? `${layer.color}18` : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: selectedRing === idx ? layer.color : 'var(--ifm-color-content)' }}>
                      Layer {idx + 1}: {layer.name.split('(')[0]}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px', background: `${ONION_LAYERS[selectedRing].color}08`, border: `1.5px solid ${ONION_LAYERS[selectedRing].color}35`, borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: ONION_LAYERS[selectedRing].color, marginBottom: '6px' }}>
                  {ONION_LAYERS[selectedRing].name}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '10px' }}>
                  {ONION_LAYERS[selectedRing].desc}
                </p>
                <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px' }}>
                  <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>TYPICAL CLASSES: </span>
                  <code style={{ fontSize: '11.5px', color: ONION_LAYERS[selectedRing].color }}>{ONION_LAYERS[selectedRing].examples}</code>
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  <strong>The Dependency Rule:</strong> Source code dependencies can only point <em>inwards</em> toward higher-level policies. Nothing in an inner circle can know anything at all about something in an outer circle.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
