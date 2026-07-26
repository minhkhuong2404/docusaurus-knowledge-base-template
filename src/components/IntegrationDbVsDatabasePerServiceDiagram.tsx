import React, { useState } from 'react';

export default function IntegrationDbVsDatabasePerServiceDiagram() {
  const [patternMode, setPatternMode] = useState<'shared' | 'perService'>('perService');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
        </svg>
        <span>Database-per-Service vs. Integration Database Anti-Pattern</span>
      </div>

      {/* Pattern Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setPatternMode('shared')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: patternMode === 'shared' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
            color: patternMode === 'shared' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: patternMode === 'shared' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ❌ Anti-Pattern: Shared Integration DB
        </button>
        <button
          onClick={() => setPatternMode('perService')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: patternMode === 'perService' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: patternMode === 'perService' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: patternMode === 'perService' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✅ Best Practice: Database-per-Service
        </button>
      </div>

      {/* Architecture Visualizer */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        {patternMode === 'shared' ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#f87171' }}>Order Service</div>
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#f87171' }}>Payment Service</div>
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#f87171' }}>User Service</div>
            </div>
            <div style={{ textAlign: 'center', color: '#f87171', fontSize: '18px', marginBottom: '8px' }}>↓↓↓</div>
            <div style={{ background: 'rgba(248,113,113,0.2)', border: '2px dashed #f87171', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#f87171' }}>SINGLE SHARED DATABASE SCHEMA</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Schema lock coupling · Query starvation · Uncontrolled table access</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid #38bdf8', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>Order Service</div>
              <div style={{ fontSize: '14px', margin: '8px 0' }}>↓</div>
              <div style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>Orders DB (Postgres)</div>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid #34d399', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Payment Service</div>
              <div style={{ fontSize: '14px', margin: '8px 0' }}>↓</div>
              <div style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid #34d399', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#34d399' }}>Payments DB (Postgres)</div>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid #fbbf24', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>Search Service</div>
              <div style={{ fontSize: '14px', margin: '8px 0' }}>↓</div>
              <div style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid #fbbf24', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>Elasticsearch</div>
            </div>
          </div>
        )}
      </div>

      {/* Tradeoff Explanation */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {patternMode === 'shared' ? (
          <div>
            <strong style={{ color: '#f87171' }}>Integration Database Hazards:</strong> Shared database schemas break service encapsulation, force synchronized deployments across multiple teams whenever a table column changes, and lead to unmanageable database locking and performance degradation.
          </div>
        ) : (
          <div>
            <strong style={{ color: '#34d399' }}>Database-per-Service Benefits:</strong> Each microservice encapsulates its storage technology (Postgres, Mongo, Redis, Elasticsearch) tailored to its workload. Schema changes occur completely independently without team coordination.
          </div>
        )}
      </div>
    </div>
  );
}
