import React, { useState } from 'react';

export default function CqrsArchitectureDiagram() {
  const [activeSide, setActiveSide] = useState<'write' | 'read'>('write');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>CQRS High-Level Command &amp; Query Architecture</span>
      </div>

      {/* Path Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveSide('write')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: activeSide === 'write' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeSide === 'write' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeSide === 'write' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✏️ Write Path (Command Model &amp; Invariants)
        </button>
        <button
          onClick={() => setActiveSide('read')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: activeSide === 'read' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeSide === 'read' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeSide === 'read' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          🔍 Read Path (Query Model &amp; Denormalized Projections)
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        {activeSide === 'write' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#f87171' }}>POST /orders</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Command Payload</div>
            </div>

            <div style={{ background: 'rgba(248,113,113,0.15)', border: '2px solid #f87171', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>Command Handler</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Validates Invariants</div>
            </div>

            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>Normalized Write DB</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>PostgreSQL 3NF</div>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24' }}>Kafka Event Bus</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>OrderPlacedEvent</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24' }}>Kafka Event Stream</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>OrderPlacedEvent</div>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Event Projector</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Builds View Index</div>
            </div>

            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid #a78bfa', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#a78bfa' }}>Denormalized Read DB</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Elasticsearch / Mongo</div>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>GET /orders</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Instant Query API</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {activeSide === 'write' ? (
          <span><strong>Write Path:</strong> Commands mutate state on a clean, normalized Write DB enforcing domain invariants. On success, a domain event is published to Kafka.</span>
        ) : (
          <span><strong>Read Path:</strong> Event Projectors consume domain events asynchronously and update a denormalized Read DB (e.g. Elasticsearch) optimized for fast UI queries.</span>
        )}
      </div>
    </div>
  );
}
