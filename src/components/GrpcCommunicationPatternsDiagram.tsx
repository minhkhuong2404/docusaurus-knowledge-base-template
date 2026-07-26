import React, { useState } from 'react';

interface GrpcPattern {
  id: string;
  name: string;
  badge: string;
  color: string;
  flow: string;
  useCase: string;
}

const PATTERNS: GrpcPattern[] = [
  { id: 'unary', name: '1. Unary RPC', badge: 'Request-Response', color: '#38bdf8', flow: 'Client ── Request ──► Server ── Response ──► Client', useCase: 'Standard synchronous CRUD operations (e.g. GetOrder, UpdateUser).' },
  { id: 'server', name: '2. Server Streaming RPC', badge: 'Server Push Stream', color: '#34d399', flow: 'Client ── Request ──► Server ── Stream [Msg1, Msg2, Msg3...] ──► Client', useCase: 'Live order updates, log tailing, large file downloads.' },
  { id: 'client', name: '3. Client Streaming RPC', badge: 'Client Push Stream', color: '#fbbf24', flow: 'Client ── Stream [Msg1, Msg2, Msg3...] ──► Server ── Summary Response ──► Client', useCase: 'Bulk data uploads, metrics ingestion, batch file streaming.' },
  { id: 'bidi', name: '4. Bidirectional Streaming RPC', badge: 'Full Duplex (HTTP/2)', color: '#a78bfa', flow: 'Client ◄── Multiplexed Stream 1, Stream 2... ──► Server', useCase: 'Real-time chat, collaborative editing, interactive gaming sessions.' },
];

export default function GrpcCommunicationPatternsDiagram() {
  const [selected, setSelected] = useState<GrpcPattern>(PATTERNS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="8 21 3 21 3 16"/>
          <line x1="15" y1="15" x2="3" y2="21"/>
        </svg>
        <span>gRPC Communication Streaming Patterns Explorer</span>
      </div>

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
            {p.name.split(' ')[1]}
          </button>
        ))}
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: selected.color, marginBottom: '6px' }}>
          {selected.name} ({selected.badge})
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: selected.color, border: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
          {selected.flow}
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
          <strong>Target Use Case:</strong> {selected.useCase}
        </div>
      </div>
    </div>
  );
}
