import React, { useState } from 'react';

export default function LaunchDarklyArchitectureDiagram() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'evaluation' | 'matrix'>('architecture');
  const [userTier, setUserTier] = useState<'beta' | 'regular' | 'vip'>('beta');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span>LaunchDarkly Enterprise Architecture &amp; Flag Evaluation Simulator</span>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('architecture')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: activeTab === 'architecture' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'architecture' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'architecture' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          🌐 Relay Proxy Architecture (Streaming SSE)
        </button>
        <button
          onClick={() => setActiveTab('evaluation')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: activeTab === 'evaluation' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'evaluation' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'evaluation' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ⚡ Local Evaluation Simulator (Microsecond Latency)
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: activeTab === 'matrix' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'matrix' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'matrix' ? '0 0 0 1.5px #fbbf24' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          📊 LaunchDarkly vs Spring Cloud Config
        </button>
      </div>

      {activeTab === 'architecture' && (
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>LaunchDarkly SaaS</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Flag Rules CDN</div>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>Relay Proxy (K8s Cluster)</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Internal SSE Hub &amp; Redis Cache</div>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24' }}>Spring Boot LD SDK</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>In-Memory Evaluation</div>
            </div>

            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid #a78bfa', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#a78bfa' }}>User Request Context</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>LDContext Evaluation (&lt;10µs)</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evaluation' && (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '10px' }}>
            Simulate User LDContext Target Rule Evaluation:
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              onClick={() => setUserTier('beta')}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700,
                background: userTier === 'beta' ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.04)',
                color: userTier === 'beta' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                border: userTier === 'beta' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              User A (Beta Tester)
            </button>
            <button
              onClick={() => setUserTier('vip')}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700,
                background: userTier === 'vip' ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.04)',
                color: userTier === 'vip' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                border: userTier === 'vip' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              User B (VIP Tier)
            </button>
            <button
              onClick={() => setUserTier('regular')}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700,
                background: userTier === 'regular' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.04)',
                color: userTier === 'regular' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                border: userTier === 'regular' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              User C (Regular User)
            </button>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: '11.5px', lineHeight: '1.6' }}>
            <div><span style={{ color: 'var(--ifm-color-content-secondary)' }}>LDContext: </span><span style={{ color: '#38bdf8' }}>{`key="usr-123", group="users", tier="${userTier}"`}</span></div>
            <div><span style={{ color: 'var(--ifm-color-content-secondary)' }}>Flag Evaluated: </span><span style={{ color: '#fbbf24' }}>"new-checkout-flow-v2"</span></div>
            <div>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Result: </span>
              <strong style={{ color: userTier === 'beta' || userTier === 'vip' ? '#34d399' : '#f87171' }}>
                {userTier === 'beta' || userTier === 'vip' ? 'true (Feature ENABLED)' : 'false (Fallback Control Flow)'}
              </strong>
            </div>
            <div style={{ fontSize: '10.5px', color: '#a78bfa', marginTop: '4px' }}>
              Evaluation Time: 4 microseconds (In-Memory rule engine — zero remote network calls).
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid #38bdf8', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>Spring Cloud Config (@RefreshScope)</div>
              <ul style={{ paddingLeft: '16px', margin: '8px 0 0 0', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
                <li>Best for infrastructure settings (timeouts, URLs, log levels)</li>
                <li>Global configuration (same value per instance)</li>
                <li>Requires <code>/busrefresh</code> trigger to update</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid #34d399', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>LaunchDarkly (Feature Management)</div>
              <ul style={{ paddingLeft: '16px', margin: '8px 0 0 0', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
                <li>Best for application feature toggles &amp; canary rollouts</li>
                <li>Per-user / per-tenant targeting rules (LDContext)</li>
                <li>Real-time SSE streaming (sub-second propagation worldwide)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>Architecture Principle:</strong> LaunchDarkly SDKs streaming SSE connection downloads rule definitions on startup and updates them in real time. Flag evaluation happens 100% in-memory inside the application process without incurring network calls or adding latency to incoming user requests.
      </div>
    </div>
  );
}
