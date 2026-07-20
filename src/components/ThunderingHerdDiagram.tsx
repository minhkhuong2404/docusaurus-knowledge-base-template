import React, { useState } from 'react';

export default function ThunderingHerdDiagram() {
  const [withJitter, setWithJitter] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  const runSimulation = () => {
    setSimulating(true);
    setActiveStep(0);

    const interval = setInterval(() => {
      setActiveStep(s => {
        if (s >= 4) {
          clearInterval(interval);
          setSimulating(false);
          return 4;
        }
        return s + 1;
      });
    }, 600);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <span>Thundering Herd & Jitter Protection</span>

        {/* Toggle controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => { setWithJitter(false); setActiveStep(0); }} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: !withJitter ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: !withJitter ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: !withJitter ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Without Jitter (Spike Crash)
          </button>
          <button onClick={() => { setWithJitter(true); setActiveStep(0); }} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: withJitter ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: withJitter ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: withJitter ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            With Jitter (Smooth Recovery)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="herd-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .herd-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Traffic Simulation Visualizer */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 500 260" className="interactive-diagram">
            {/* Timeline Axis */}
            <line x1="40" y1="210" x2="460" y2="210" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <text x="40" y="230" fill="#64748b" fontSize="10">t = 0s (Fail)</text>
            <text x="250" y="230" fill="#64748b" fontSize="10" textAnchor="middle">t = 1.0s (First Retry Wave)</text>
            <text x="460" y="230" fill="#64748b" fontSize="10" textAnchor="end">t = 2.0s</text>

            {!withJitter ? (
              // SYNCHRONIZED PULSE WAVE
              <g>
                {/* 1,000 requests hitting simultaneously at t=1.0s */}
                <rect x="230" y={activeStep > 0 ? "50" : "190"} width="40" height={activeStep > 0 ? "160" : "20"} rx="4"
                      fill="#f87171" style={{ transition: 'all 0.5s ease' }} />
                <text x="250" y={activeStep > 0 ? "40" : "185"} textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="bold">
                  {activeStep > 0 ? "100% REQ SPIKE! (CRASH)" : "Idle"}
                </text>
              </g>
            ) : (
              // SMOOTH DISTRIBUTED JITTER WAVE
              <g>
                <rect x="120" y={activeStep >= 1 ? "140" : "200"} width="24" height={activeStep >= 1 ? "70" : "10"} rx="4" fill="#34d399" style={{ transition: 'all 0.4s' }} />
                <rect x="180" y={activeStep >= 2 ? "120" : "200"} width="24" height={activeStep >= 2 ? "90" : "10"} rx="4" fill="#34d399" style={{ transition: 'all 0.4s' }} />
                <rect x="250" y={activeStep >= 3 ? "110" : "200"} width="24" height={activeStep >= 3 ? "100" : "10"} rx="4" fill="#34d399" style={{ transition: 'all 0.4s' }} />
                <rect x="320" y={activeStep >= 4 ? "130" : "200"} width="24" height={activeStep >= 4 ? "80" : "10"} rx="4" fill="#34d399" style={{ transition: 'all 0.4s' }} />
                <rect x="390" y={activeStep >= 4 ? "160" : "200"} width="24" height={activeStep >= 4 ? "50" : "10"} rx="4" fill="#34d399" style={{ transition: 'all 0.4s' }} />
                
                <text x="250" y="30" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">
                  {activeStep > 0 ? "Distributed Load (~20% max peak)" : "Awaiting Simulation"}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: withJitter ? '#34d39940' : '#f8717140' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: withJitter ? '#34d399' : '#f87171' }}>
              {withJitter ? 'Jittered Retries (Healthy)' : 'Thundering Herd (Spike Cycle)'}
            </h3>
          </div>

          <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
            {!withJitter 
              ? 'Without jitter, thousands of callers retry at identical backoff intervals (t=1.0s, 2.0s, 4.0s). The recovering downstream service is immediately overwhelmed by a synchronized spike and crashes again.'
              : 'Jitter adds randomized noise to each backoff delay. Retries are distributed continuously across time, allowing the recovering service to process requests gradually.'
            }
          </p>

          <div style={{ margin: '14px 0' }}>
            <button onClick={runSimulation} disabled={simulating} style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: withJitter ? '#34d399' : '#f87171',
              color: '#090b14', fontWeight: 'bold', fontSize: '12px',
              cursor: simulating ? 'not-allowed' : 'pointer', opacity: simulating ? 0.6 : 1
            }}>
              {simulating ? 'Simulating Traffic...' : '⚡ Simulate Downstream Recovery'}
            </button>
          </div>

          <div style={{ fontSize: '11.5px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
            <strong>System Outcome:</strong>
            {!withJitter ? (
              <div style={{ color: '#f87171', marginTop: '4px' }}>
                🚨 Service recovered at t=0.9s, but was crashed at t=1.0s by 1,000 synchronized retries. Cycle repeats indefinitely!
              </div>
            ) : (
              <div style={{ color: '#34d399', marginTop: '4px' }}>
                🟢 Service recovered at t=0.9s. Retries hit gradually between t=0.7s and 2.0s. Max load capped at 20%. Service stays healthy!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
