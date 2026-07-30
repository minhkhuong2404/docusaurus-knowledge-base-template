import React, { useState } from 'react';

interface VerbItem {
  verb: string;
  action: string;
  urlExample: string;
  bodyAllowed: boolean;
  safe: boolean;
  idempotent: boolean;
  color: string;
}

const VERBS: VerbItem[] = [
  { verb: 'GET', action: 'Read / Retrieve resource', urlExample: 'GET /orders/42', bodyAllowed: false, safe: true, idempotent: true, color: '#34d399' },
  { verb: 'POST', action: 'Create resource / Action', urlExample: 'POST /orders', bodyAllowed: true, safe: false, idempotent: false, color: '#fbbf24' },
  { verb: 'PUT', action: 'Replace resource entirely', urlExample: 'PUT /orders/42', bodyAllowed: true, safe: false, idempotent: true, color: '#38bdf8' },
  { verb: 'PATCH', action: 'Partial resource update', urlExample: 'PATCH /orders/42', bodyAllowed: true, safe: false, idempotent: false, color: '#a78bfa' },
  { verb: 'DELETE', action: 'Remove target resource', urlExample: 'DELETE /orders/42', bodyAllowed: false, safe: false, idempotent: true, color: '#f87171' },
];

export default function ApiResourceDesignDiagram() {
  const [selectedVerb, setSelectedVerb] = useState<VerbItem>(VERBS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
        <span>Resource-Oriented REST Verb &amp; Attribute Explorer</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {VERBS.map(v => (
          <button
            key={v.verb}
            onClick={() => setSelectedVerb(v)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 800,
              background: selectedVerb.verb === v.verb ? `${v.color}20` : 'rgba(255,255,255,0.04)',
              color: selectedVerb.verb === v.verb ? v.color : 'var(--ifm-color-content-secondary)',
              boxShadow: selectedVerb.verb === v.verb ? `0 0 0 1.5px ${v.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {v.verb}
          </button>
        ))}
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: selectedVerb.color, marginBottom: '6px' }}>
          {selectedVerb.verb} — {selectedVerb.action}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', color: selectedVerb.color, marginBottom: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {selectedVerb.urlExample}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Request Body</div>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: selectedVerb.bodyAllowed ? '#34d399' : '#f87171' }}>
              {selectedVerb.bodyAllowed ? 'Allowed' : 'Not Allowed'}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Safe Method</div>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: selectedVerb.safe ? '#34d399' : '#f87171' }}>
              {selectedVerb.safe ? 'Safe (No Mutate)' : 'Unsafe (Mutates)'}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Idempotent</div>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: selectedVerb.idempotent ? '#34d399' : '#fbbf24' }}>
              {selectedVerb.idempotent ? 'Idempotent' : 'Non-Idempotent'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
