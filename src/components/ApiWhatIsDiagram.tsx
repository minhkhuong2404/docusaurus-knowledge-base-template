import React, { useState } from 'react';

interface Protocol {
  id: string;
  name: string;
  badge: string;
  color: string;
  format: string;
  transport: string;
  bestFor: string;
  tradeoffs: string;
}

const PROTOCOLS: Protocol[] = [
  {
    id: 'rest',
    name: 'REST (Representational State Transfer)',
    badge: 'Public & Web Standard',
    color: '#38bdf8',
    format: 'JSON / XML',
    transport: 'HTTP/1.1 or HTTP/2',
    bestFor: 'Public-facing web/mobile APIs, third-party integrations, browser native fetching.',
    tradeoffs: 'Over-fetching/under-fetching data, higher payload verbosity than binary formats.',
  },
  {
    id: 'grpc',
    name: 'gRPC (Remote Procedure Call)',
    badge: 'Internal High Performance',
    color: '#34d399',
    format: 'Protobuf (Binary)',
    transport: 'HTTP/2 (Multiplexed Streams)',
    bestFor: 'Internal microservice-to-service communication, high-throughput low-latency systems.',
    tradeoffs: 'Requires Protobuf compiler tooling; not directly readable by standard web browser JS without proxy.',
  },
  {
    id: 'graphql',
    name: 'GraphQL (Query Language)',
    badge: 'Flexible Client-Driven Data',
    color: '#fbbf24',
    format: 'JSON (Custom Query DSL)',
    transport: 'HTTP POST (Single Endpoint)',
    bestFor: 'Mobile apps requiring exact, nested data shapes in a single network round-trip.',
    tradeoffs: 'N+1 query backend performance hazards, complex HTTP caching at gateway level.',
  },
  {
    id: 'websocket',
    name: 'WebSockets / SSE',
    badge: 'Real-Time Streaming',
    color: '#a78bfa',
    format: 'JSON / Raw Binary',
    transport: 'TCP Connection Upgrade',
    bestFor: 'Real-time live dashboards, notifications, collaborative editing, chat apps.',
    tradeoffs: 'Stateful server connections require socket gateway management and load balancer sticky sessions.',
  },
];

export default function ApiWhatIsDiagram() {
  const [selected, setSelected] = useState<Protocol>(PROTOCOLS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>API Protocol Selection &amp; Architecture Matrix</span>
      </div>

      {/* Protocol Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {PROTOCOLS.map(p => (
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
            {p.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Detail Card */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: selected.color }}>{selected.name}</span>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: `${selected.color}30`, color: selected.color, fontWeight: 700 }}>
            {selected.badge}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Data Format</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{selected.format}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Transport Protocol</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{selected.transport}</div>
          </div>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5', marginBottom: '6px' }}>
          <strong>Best Used For:</strong> {selected.bestFor}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
          <strong>Trade-offs:</strong> {selected.tradeoffs}
        </div>
      </div>
    </div>
  );
}
