import React, { useState } from 'react';

export default function CascadingFailureDiagram() {
  const [withCircuitBreaker, setWithCircuitBreaker] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [threadState, setThreadState] = useState<'idle' | 'blocked' | 'protected'>('idle');

  const runSimulation = () => {
    setSimulating(true);
    if (!withCircuitBreaker) {
      setThreadState('blocked');
      setTimeout(() => setSimulating(false), 2500);
    } else {
      setThreadState('protected');
      setTimeout(() => {
        setThreadState('idle');
        setSimulating(false);
      }, 1500);
    }
  };

  const resetSim = (hasCB: boolean) => {
    setWithCircuitBreaker(hasCB);
    setThreadState('idle');
    setSimulating(false);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span>Cascading Failure vs. Circuit Breaker Protection</span>

        {/* Toggle controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => resetSim(false)} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: !withCircuitBreaker ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: !withCircuitBreaker ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: !withCircuitBreaker ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Without Circuit Breaker (Crash)
          </button>
          <button onClick={() => resetSim(true)} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: withCircuitBreaker ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: withCircuitBreaker ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: withCircuitBreaker ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            With Circuit Breaker (Fail Fast)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="cascade-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .cascade-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* SVG Panel */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 500 260" className="interactive-diagram">
            <defs>
              <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
              </marker>
              <marker id="arr-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#f87171" />
              </marker>
              <marker id="arr-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#34d399" />
              </marker>
            </defs>

            {/* Order Service Box */}
            <rect x="30" y="40" width="200" height="180" rx="10" fill="#0f172a" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <text x="130" y="65" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">Order Service</text>

            {/* Thread Pool slots */}
            <text x="50" y="90" fill="var(--ifm-color-content-secondary)" fontSize="10" fontWeight="bold">Thread Pool (Max 4):</text>
            {[1, 2, 3, 4].map(idx => {
              const yPos = 100 + (idx - 1) * 26;
              const isBlocked = threadState === 'blocked';
              const isProtected = threadState === 'protected';
              
              let slotColor = '#34d399';
              let statusText = 'IDLE (Free)';
              if (isBlocked) {
                slotColor = '#f87171';
                statusText = 'BLOCKED (30s timeout)';
              } else if (isProtected) {
                slotColor = '#38bdf8';
                statusText = '0ms Fast Fallback';
              }

              return (
                <g key={idx}>
                  <rect x="50" y={yPos} width="160" height="20" rx="4"
                        fill={`${slotColor}18`} stroke={slotColor} strokeWidth="1"
                        style={{ transition: 'all 0.3s' }} />
                  <text x="60" y={yPos + 14} fill={slotColor} fontSize="9.5" fontWeight="bold">
                    T{idx}: {statusText}
                  </text>
                </g>
              );
            })}

            {/* Downstream Payment Service */}
            <rect x="320" y="80" width="150" height="100" rx="10" 
                  fill={!withCircuitBreaker ? '#f8717118' : '#fbbf2418'} 
                  stroke={!withCircuitBreaker ? '#f87171' : '#fbbf24'} strokeWidth="1.5" />
            <text x="395" y="115" textAnchor="middle" fill={!withCircuitBreaker ? '#f87171' : '#fbbf24'} fontSize="11.5" fontWeight="bold">
              Payment Service
            </text>
            <text x="395" y="135" textAnchor="middle" fill={!withCircuitBreaker ? '#f87171' : '#fbbf24'} fontSize="9.5">
              {!withCircuitBreaker ? 'UNRESPONSIVE (Slow)' : 'DOWN (Tripped)'}
            </text>

            {/* Path Order -> Payment */}
            {!withCircuitBreaker ? (
              <g>
                <path d="M 230 130 L 312 130" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arr-red)" />
                <text x="270" y="120" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="bold">30s Hang</text>
              </g>
            ) : (
              <g>
                <path d="M 230 130 L 312 130" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="265" y1="120" x2="275" y2="140" stroke="#f87171" strokeWidth="2" />
                <text x="270" y="112" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">Intercepted (0ms)</text>
              </g>
            )}
          </svg>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: withCircuitBreaker ? '#34d39940' : '#f8717140' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: withCircuitBreaker ? '#34d399' : '#f87171' }}>
              {withCircuitBreaker ? 'Circuit OPEN: Short-Circuit Protection' : 'Cascading Thread Exhaustion'}
            </h3>
          </div>

          <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
            {!withCircuitBreaker
              ? 'When Payment Service hangs for 30s, calling threads in Order Service block waiting for response. High request volume quickly exhausts all worker threads — crashing Order Service completely!'
              : 'The Circuit Breaker detects downstream degradation and enters OPEN state. Requests fail fast in nanoseconds without consuming HTTP worker threads. Order Service remains healthy.'
            }
          </p>

          <div style={{ margin: '14px 0' }}>
            <button onClick={runSimulation} disabled={simulating} style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: withCircuitBreaker ? '#34d399' : '#f87171',
              color: '#090b14', fontWeight: 'bold', fontSize: '12px',
              cursor: simulating ? 'not-allowed' : 'pointer', opacity: simulating ? 0.6 : 1
            }}>
              {simulating ? 'Sending Requests...' : '⚡ Send 4 Concurrent Requests'}
            </button>
          </div>

          <div style={{ fontSize: '11.5px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
            <strong>Thread Pool Status:</strong>
            {threadState === 'blocked' ? (
              <div style={{ color: '#f87171', marginTop: '4px' }}>
                🚨 4/4 threads blocked waiting 30s! New incoming requests to /orders are REJECTED (HTTP 500). Cascading failure complete.
              </div>
            ) : threadState === 'protected' ? (
              <div style={{ color: '#34d399', marginTop: '4px' }}>
                🟢 Circuit OPEN! 4 requests failed fast (0ms) via fallback. 0 threads blocked. Order Service stays 100% available.
              </div>
            ) : (
              <div style={{ color: '#94a3b8', marginTop: '4px' }}>
                Click button to simulate concurrent traffic.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
