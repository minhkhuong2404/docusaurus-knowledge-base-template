import React, { useState } from 'react';

export default function BulkheadIsolationDiagram() {
  const [mode, setMode] = useState<'shared' | 'bulkhead'>('bulkhead');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [paymentSlow, setPaymentSlow] = useState<boolean>(false);

  const triggerSim = () => {
    setSimulating(true);
    setPaymentSlow(true);
    setTimeout(() => setSimulating(false), 1200);
  };

  const resetSim = (newMode: 'shared' | 'bulkhead') => {
    setMode(newMode);
    setPaymentSlow(false);
    setSimulating(false);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="4"/>
          <line x1="10" y1="2" x2="10" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span>Bulkhead Isolation vs. Shared Thread Pool</span>

        {/* Toggle Controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => resetSim('shared')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: mode === 'shared' ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: mode === 'shared' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: mode === 'shared' ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Shared Pool (Starvation 💥)
          </button>
          <button onClick={() => resetSim('bulkhead')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: mode === 'bulkhead' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: mode === 'bulkhead' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: mode === 'bulkhead' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Bulkhead Pools (Isolated 🟢)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="isolation-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .isolation-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* SVG Panel */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 500 270" className="interactive-diagram">
            {mode === 'shared' ? (
              // SHARED THREAD POOL MODEL
              <g>
                <rect x="40" y="30" width="420" height="210" rx="10" 
                      fill={paymentSlow ? '#f871710e' : '#0f172a'} 
                      stroke={paymentSlow ? '#f87171' : 'rgba(255,255,255,0.15)'} strokeWidth="1.5" />
                <text x="250" y="55" textAnchor="middle" fill={paymentSlow ? '#f87171' : '#e2e8f0'} fontSize="13" fontWeight="bold">
                  Shared Tomcat Thread Pool (Max 200 Threads)
                </text>

                {/* Pool Status Bars */}
                <rect x="70" y="80" width="360" height="30" rx="6" fill="#f8717118" stroke="#f87171" strokeWidth="1" />
                <text x="250" y="100" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="bold">
                  {paymentSlow ? '100% Threads Blocked on Payment API (5s timeout)' : 'Active Traffic'}
                </text>

                <rect x="70" y="130" width="360" height="30" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <text x="250" y="150" textAnchor="middle" fill={paymentSlow ? '#f87171' : '#94a3b8'} fontSize="10.5">
                  GET /catalog ──► {paymentSlow ? 'REJECTED (HTTP 503 — No threads left)' : 'Healthy (50ms)'}
                </text>

                <rect x="70" y="180" width="360" height="30" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <text x="250" y="200" textAnchor="middle" fill={paymentSlow ? '#f87171' : '#94a3b8'} fontSize="10.5">
                  GET /user/profile ──► {paymentSlow ? 'REJECTED (HTTP 503 — No threads left)' : 'Healthy (30ms)'}
                </text>
              </g>
            ) : (
              // BULKHEAD COMPARTMENT MODEL
              <g>
                {/* Payment Bulkhead Pool */}
                <rect x="30" y="30" width="130" height="210" rx="8" 
                      fill={paymentSlow ? '#f8717112' : '#0f172a'} 
                      stroke={paymentSlow ? '#f87171' : '#64748b'} strokeWidth="1.5" />
                <text x="95" y="55" textAnchor="middle" fill={paymentSlow ? '#f87171' : '#e2e8f0'} fontSize="11" fontWeight="bold">Payment Pool</text>
                <text x="95" y="72" textAnchor="middle" fill="#64748b" fontSize="9">(Max 10 threads)</text>
                <rect x="42" y="90" width="106" height="130" rx="4" fill={paymentSlow ? '#f8717120' : '#34d39915'} />
                <text x="95" y="160" textAnchor="middle" fill={paymentSlow ? '#f87171' : '#34d399'} fontSize="10" fontWeight="bold">
                  {paymentSlow ? '10/10 Blocked' : 'Healthy'}
                </text>

                {/* Catalog Bulkhead Pool */}
                <rect x="185" y="30" width="130" height="210" rx="8" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
                <text x="250" y="55" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">Catalog Pool</text>
                <text x="250" y="72" textAnchor="middle" fill="#64748b" fontSize="9">(Max 20 threads)</text>
                <rect x="197" y="90" width="106" height="130" rx="4" fill="#34d39915" />
                <text x="250" y="160" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">
                  Healthy (50ms)
                </text>

                {/* User Bulkhead Pool */}
                <rect x="340" y="30" width="130" height="210" rx="8" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
                <text x="405" y="55" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">User Pool</text>
                <text x="405" y="72" textAnchor="middle" fill="#64748b" fontSize="9">(Max 15 threads)</text>
                <rect x="352" y="90" width="106" height="130" rx="4" fill="#34d39915" />
                <text x="405" y="160" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">
                  Healthy (30ms)
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: mode === 'bulkhead' ? '#34d39940' : '#f8717140' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: mode === 'bulkhead' ? '#34d399' : '#f87171' }}>
              {mode === 'bulkhead' ? 'Isolated Compartments (Healthy)' : 'Shared Pool Starvation (Crash)'}
            </h3>
          </div>

          <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
            {mode === 'shared'
              ? 'Without bulkheads, slow responses from Payment API block all 200 Tomcat worker threads. Catalog and User endpoints fail with HTTP 503 even though their backend services are perfectly healthy.'
              : 'With bulkheads, Payment API is isolated to a 10-thread compartment. When Payment slowness occurs, only its 10 threads block. Catalog and User profiles continue serving normal traffic.'
            }
          </p>

          <div style={{ margin: '14px 0' }}>
            <button onClick={triggerSim} disabled={simulating} style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: mode === 'bulkhead' ? '#34d399' : '#f87171',
              color: '#090b14', fontWeight: 'bold', fontSize: '12px',
              cursor: simulating ? 'not-allowed' : 'pointer', opacity: simulating ? 0.6 : 1
            }}>
              {simulating ? 'Simulating Degradation...' : '💥 Trigger Payment API Slowness (5s latency)'}
            </button>
          </div>

          <div style={{ fontSize: '11.5px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
            <strong>System Impact:</strong>
            {paymentSlow ? (
              mode === 'shared' ? (
                <div style={{ color: '#f87171', marginTop: '4px' }}>
                  🚨 200/200 threads exhausted! Entire microservice unresponsive to ALL user requests.
                </div>
              ) : (
                <div style={{ color: '#34d399', marginTop: '4px' }}>
                  🟢 Payment pool saturated (10/10 blocked). Catalog & User pools operating normally at 100% capacity!
                </div>
              )
            ) : (
              <div style={{ color: '#94a3b8', marginTop: '4px' }}>
                Click button to simulate Payment API slowness.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
