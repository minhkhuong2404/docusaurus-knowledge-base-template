import React, { useState } from 'react';

export default function CopyPasteProblemDiagram() {
  const [mode, setMode] = useState<'without' | 'with'>('without');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span>Copy-Paste Problem vs. Microservice Chassis Standardization</span>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setMode('without')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: mode === 'without' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
            color: mode === 'without' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: mode === 'without' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ❌ Without Chassis (Copy-Paste Isolation)
        </button>
        <button
          onClick={() => setMode('with')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: mode === 'with' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: mode === 'with' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: mode === 'with' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✅ With Microservice Chassis (Single Shared Dependency)
        </button>
      </div>

      {/* Visualizer */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        {mode === 'without' ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid #f87171', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>Team A: order-service</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Log format: <code>{"{trace_id: ...}"}</code></div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>Error: <code>{"{error: ...}"}</code></div>
                <div style={{ fontSize: '10.5px', color: '#f87171', fontWeight: 600, marginTop: '4px' }}>❌ Missing custom health</div>
              </div>

              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid #f87171', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>Team B: payment-service</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Log format: <code>{"{traceId: ...}"}</code></div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>Error: <code>{"{message: ..., code: ...}"}</code></div>
                <div style={{ fontSize: '10.5px', color: '#f87171', fontWeight: 600, marginTop: '4px' }}>❌ Missing security headers</div>
              </div>

              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid #f87171', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>Team C: user-service</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Log format: Plain text</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>Error: 500 HTML stacktrace</div>
                <div style={{ fontSize: '10.5px', color: '#f87171', fontWeight: 600, marginTop: '4px' }}>❌ No Resilience4j circuit breaker</div>
              </div>
            </div>

            <div style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '11.5px', color: '#f87171', fontWeight: 600 }}>
              Result: 30 services = 8 different log formats, 5 error schemas, broken Kibana queries, and 3-week onboarding per new service.
            </div>
          </div>
        ) : (
          <div>
            {/* Chassis Hub Visualizer */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399', padding: '10px 24px', borderRadius: '10px', boxShadow: '0 0 15px rgba(52,211,153,0.2)' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>shared-service-chassis.jar (v2.3.1)</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Auto-configures MDC, OTel, ExceptionHandler, SecurityHeaders, Actuator</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>order-service</div>
                <div style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>✓ Chassis Auto-Configured</div>
              </div>
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>payment-service</div>
                <div style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>✓ Chassis Auto-Configured</div>
              </div>
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>user-service</div>
                <div style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>✓ Chassis Auto-Configured</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {mode === 'without' ? (
          <span><strong>The Copy-Paste Nightmare:</strong> When teams copy-paste infrastructure code, small discrepancies accumulate into unmaintainable log fragmentation, inconsistent API error contracts, and security vulnerabilities.</span>
        ) : (
          <span><strong>The Chassis Advantage:</strong> Teams add one Maven dependency <code>shared-service-chassis</code>. Infrastructure is initialized automatically via Spring Boot auto-configuration, reducing onboarding time from 3 weeks to 30 minutes.</span>
        )}
      </div>
    </div>
  );
}
