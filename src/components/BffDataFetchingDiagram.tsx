import React, { useState } from 'react';

export default function BffDataFetchingDiagram() {
  const [mode, setMode] = useState<'shared' | 'bff'>('bff');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span>Over-Fetching, Under-Fetching &amp; Change Coupling Explorer</span>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setMode('shared')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: mode === 'shared' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
            color: mode === 'shared' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: mode === 'shared' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ❌ Single Shared Monolithic API
        </button>
        <button
          onClick={() => setMode('bff')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: mode === 'bff' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: mode === 'bff' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: mode === 'bff' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✅ Dedicated BFF Per Client Type
        </button>
      </div>

      {/* Visualizer */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        {mode === 'shared' ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid #f87171', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>📱 Mobile App (3G/4G)</div>
                <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', fontWeight: 700 }}>Over-fetching (15KB JSON Payload)</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Needs 800 bytes for home screen, but receives 20 unneeded fields. Wastes mobile battery &amp; bandwidth.</div>
              </div>

              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid #f87171', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>🖥️ Web Dashboard</div>
                <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', fontWeight: 700 }}>Under-fetching (5 Sequential Roundtrips)</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>GET /user → GET /orders → GET /analytics → GET /tickets → GET /activity = 1,100ms total latency.</div>
              </div>
            </div>

            <div style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '11.5px', color: '#f87171', fontWeight: 600 }}>
              Change Coupling: Web team renaming <code>orderDate</code> → <code>createdAt</code> breaks 3M mobile devices unless legacy fields are preserved forever.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid #38bdf8', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>📱 Mobile BFF (Owned by Mobile Team)</div>
                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', fontWeight: 700 }}>800 Bytes Optimized Response</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Trims response down to 3 order fields &amp; 64px avatar thumbnail. Zero over-fetching.</div>
              </div>

              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid #34d399', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>🖥️ Web BFF (Owned by Web Team)</div>
                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', fontWeight: 700 }}>Parallel Fan-Out Aggregation (250ms)</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Uses <code>Mono.zip()</code> to fetch Profile, Orders, Analytics concurrently in one single call.</div>
              </div>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid #34d399', padding: '10px 14px', borderRadius: '8px', fontSize: '11.5px', color: '#34d399', fontWeight: 600 }}>
              Zero Team Coordination: Web team updates Web BFF DTO mapping instantly without requiring mobile app updates or global API versioning.
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {mode === 'shared' ? (
          <span><strong>The Monolithic API Bottleneck:</strong> A single shared API forces a compromise between sending huge bloated payloads to mobile clients or forcing web clients to make multiple sequential network calls.</span>
        ) : (
          <span><strong>The BFF Solution:</strong> Each client type owns its dedicated BFF layer. Payload sizing, response transformation, and API evolution occur independently per client team.</span>
        )}
      </div>
    </div>
  );
}
