import React, { useState } from 'react';

export default function ExternalizedConfigProblemDiagram() {
  const [mode, setMode] = useState<'baked' | 'runtime'>('runtime');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span>Externalized Configuration — 12-Factor App Principle III</span>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setMode('baked')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: mode === 'baked' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
            color: mode === 'baked' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: mode === 'baked' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ❌ Anti-Pattern: Config Baked Into JAR
        </button>
        <button
          onClick={() => setMode('runtime')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: mode === 'runtime' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: mode === 'runtime' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: mode === 'runtime' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✅ Best Practice: Runtime Configuration Injection
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        {mode === 'baked' ? (
          <div>
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1.5px solid #f87171', padding: '14px', borderRadius: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171' }}>order-service-v2.1.jar (Environment-Specific Content Baked In)</div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>
                application.properties: spring.datasource.url=jdbc:postgresql://prod-db... | stripe.key=sk_live_abc123
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', color: '#f87171' }}>
                ❌ <strong>Rebuild Needed:</strong> Changing a DB URL requires rebuilding the entire JAR (30m delay).
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', color: '#f87171' }}>
                ❌ <strong>Credential Leak:</strong> Production API keys stored inside source control and binary artifacts.
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399', padding: '10px 24px', borderRadius: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>Immutable Application Binary (order-service-v2.1.jar)</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Zero environment-specific content inside the JAR</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>Dev Environment</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Injected: dev-db, DEBUG log</div>
              </div>
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid #fbbf24', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24' }}>Staging Environment</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Injected: stg-db, INFO log</div>
              </div>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid #34d399', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>Production Environment</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Injected: prod-db, Vault secrets</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {mode === 'baked' ? (
          <span><strong style={{ color: '#f87171' }}>Config Baked Anti-Pattern:</strong> Storing environment settings inside the build artifact leads to silent configuration drift, credential leaks, and high deployment overhead.</span>
        ) : (
          <span><strong style={{ color: '#34d399' }}>12-Factor App Principle III:</strong> The exact same binary artifact is promoted from Dev → Staging → Production. Configuration flows in at runtime via Config Server, environment variables, and secret managers.</span>
        )}
      </div>
    </div>
  );
}
