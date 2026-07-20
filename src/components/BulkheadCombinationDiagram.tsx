import React, { useState } from 'react';

export default function BulkheadCombinationDiagram() {
  const [selectedLayer, setSelectedLayer] = useState<'bulkhead' | 'cb' | 'retry'>('bulkhead');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 17 22 12"/>
        </svg>
        <span>Resilience Stack — Bulkhead + Circuit Breaker + Retry</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="stack-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .stack-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Stack Layer Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontWeight: 'bold', marginBottom: '2px' }}>
            EXECUTION STACK (OUTER TO INNER):
          </div>

          <button onClick={() => setSelectedLayer('bulkhead')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: selectedLayer === 'bulkhead' ? '#38bdf818' : 'rgba(255,255,255,0.03)',
            boxShadow: selectedLayer === 'bulkhead' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.06)',
            transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>1. @Bulkhead (Outer Layer)</span>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Rejects when pool full</span>
          </button>

          <button onClick={() => setSelectedLayer('cb')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: selectedLayer === 'cb' ? '#a78bfa18' : 'rgba(255,255,255,0.03)',
            boxShadow: selectedLayer === 'cb' ? '0 0 0 1.5px #a78bfa50' : '0 0 0 1px rgba(255,255,255,0.06)',
            transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 'bold' }}>2. @CircuitBreaker (Middle Layer)</span>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Fails fast when OPEN</span>
          </button>

          <button onClick={() => setSelectedLayer('retry')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: selectedLayer === 'retry' ? '#34d39918' : 'rgba(255,255,255,0.03)',
            boxShadow: selectedLayer === 'retry' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.06)',
            transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 'bold' }}>3. @Retry (Inner Layer)</span>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Retries transient errors</span>
          </button>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{
          borderColor: selectedLayer === 'bulkhead' ? '#38bdf840' : selectedLayer === 'cb' ? '#a78bfa40' : '#34d39940'
        }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{
              color: selectedLayer === 'bulkhead' ? '#38bdf8' : selectedLayer === 'cb' ? '#a78bfa' : '#34d399'
            }}>
              {selectedLayer === 'bulkhead' ? '@Bulkhead Position' : selectedLayer === 'cb' ? '@CircuitBreaker Position' : '@Retry Position'}
            </h3>
          </div>

          <p style={{ fontSize: '12.5px', color: '#e2e8f0', marginTop: '8px' }}>
            {selectedLayer === 'bulkhead' && 'The Bulkhead wraps the outside. If the thread pool or semaphore queue is full, the request is rejected immediately WITHOUT acquiring thread permits or triggering retries.'}
            {selectedLayer === 'cb' && 'The CircuitBreaker sits inside the Bulkhead. When tripped OPEN, it short-circuits calls in 0ms before retries attempt execution.'}
            {selectedLayer === 'retry' && 'The Retry layer sits closest to the call. It handles 5xx/timeouts with backoff+jitter. Crucially, ignoreExceptions MUST include BulkheadFullException so load-shed rejections are NEVER retried!'}
          </p>

          <div style={{
            fontSize: '11.5px', padding: '10px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            marginTop: '10px'
          }}>
            <strong style={{ color: '#fbbf24' }}>Critical Exception Handling Rule:</strong>
            <pre style={{
              margin: '6px 0 0 0', padding: '6px 8px', background: '#090b14', borderRadius: '4px',
              color: '#34d399', fontSize: '10.5px', fontFamily: 'monospace'
            }}>
              ignoreExceptions:<br/>
              &nbsp;&ndash; BulkheadFullException # NEVER retry pool rejections!
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
