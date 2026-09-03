import React, { useState } from 'react';

type Phase = 'cold' | 'warm' | 'shutdown';

export default function AwsLambdaLifecycleDiagram(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('cold');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          AWS Lambda Execution Lifecycle: Cold Start vs. Warm Reuse
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setPhase('cold')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${phase === 'cold' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
              background: phase === 'cold' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
              color: phase === 'cold' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              fontWeight: phase === 'cold' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            ❄️ 1. Cold Start (Init)
          </button>
          <button
            onClick={() => setPhase('warm')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${phase === 'warm' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
              background: phase === 'warm' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.04)',
              color: phase === 'warm' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontWeight: phase === 'warm' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            🔥 2. Warm Invoke (Reuse)
          </button>
          <button
            onClick={() => setPhase('shutdown')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${phase === 'shutdown' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
              background: phase === 'shutdown' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255,255,255,0.04)',
              color: phase === 'shutdown' ? '#f87171' : 'var(--ifm-color-content-secondary)',
              fontWeight: phase === 'shutdown' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            🛑 3. Freeze &amp; Shutdown
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          {phase === 'cold' ? (
            <svg viewBox="0 0 760 190" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="cold-arr" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
              </defs>

              {/* Step 1: Download */}
              <g transform="translate(25, 45)">
                <rect width="155" height="75" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="77" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">1. Download Code</text>
                <text x="77" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9">Fetches ZIP from S3</text>
                <text x="77" y="58" textAnchor="middle" fill="#64748b" fontSize="8.5">or ECR Container</text>
              </g>

              {/* Step 2: MicroVM */}
              <g transform="translate(210, 45)">
                <rect width="155" height="75" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="77" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">2. Firecracker VM</text>
                <text x="77" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9">Isolates microVM</text>
                <text x="77" y="58" textAnchor="middle" fill="#64748b" fontSize="8.5">Dedicated cgroups/ENI</text>
              </g>

              {/* Step 3: Runtime Init */}
              <g transform="translate(395, 45)">
                <rect width="155" height="75" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="77" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">3. Boot Runtime</text>
                <text x="77" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9">JVM / Node.js / Python</text>
                <text x="77" y="58" textAnchor="middle" fill="#64748b" fontSize="8.5">Bootstrap environment</text>
              </g>

              {/* Step 4: Run Static Init */}
              <g transform="translate(580, 45)">
                <rect width="155" height="75" rx="8" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="77" y="24" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">4. Run Static Init</text>
                <text x="77" y="44" textAnchor="middle" fill="#c4b5fd" fontSize="9">DB Pools &amp; SDK Clients</text>
                <text x="77" y="58" textAnchor="middle" fill="#94a3b8" fontSize="8.5">Up to 10s (Unbilled)</text>
              </g>

              {/* Connecting Paths */}
              <path d="M 180 82 L 205 82" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#cold-arr)" className="interactive-diagram-flowing-path" />
              <path d="M 365 82 L 390 82" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#cold-arr)" className="interactive-diagram-flowing-path" />
              <path d="M 550 82 L 575 82" fill="none" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#cold-arr)" className="interactive-diagram-flowing-path" />

              <text x="380" y="160" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">
                ⚡ Init Phase: Occurs only on first request or autoscaling surge (Cold Start latency)
              </text>
            </svg>
          ) : phase === 'warm' ? (
            <svg viewBox="0 0 760 190" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="warm-arr" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
              </defs>

              {/* Cached MicroVM Container */}
              <g transform="translate(100, 35)">
                <rect width="560" height="95" rx="10" fill="rgba(52, 211, 153, 0.1)" stroke="#34d399" strokeWidth="2" />
                <text x="280" y="24" textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="800">
                  Active Execution Environment (Warm Firecracker Instance)
                </text>

                <g transform="translate(30, 38)">
                  <rect width="230" height="42" rx="6" fill="rgba(15, 23, 42, 0.7)" stroke="#34d399" strokeWidth="1" />
                  <text x="115" y="25" textAnchor="middle" fill="#86efac" fontSize="10">
                    Cached DB Connection &amp; AWS Clients ✅
                  </text>
                </g>

                <g transform="translate(300, 38)">
                  <rect width="230" height="42" rx="6" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="115" y="20" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">
                    5. Execute Handler()
                  </text>
                  <text x="115" y="34" textAnchor="middle" fill="#86efac" fontSize="9">
                    Only Billed Phase (~5ms – 100ms)
                  </text>
                </g>
              </g>

              {/* Flow Arrow */}
              <path d="M 390 85 L 425 85" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#warm-arr)" className="interactive-diagram-flowing-path" />

              <text x="380" y="162" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">
                🚀 Warm Invocation: Skips Init entirely! Sub-10ms latency execution.
              </text>
            </svg>
          ) : (
            <svg viewBox="0 0 760 190" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="shut-arr" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#f87171" /></marker>
              </defs>

              <g transform="translate(100, 35)">
                <rect width="250" height="80" rx="8" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="125" y="30" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="700">6. Environment Frozen</text>
                <text x="125" y="50" textAnchor="middle" fill="#fcd34d" fontSize="9.5">Execution paused between invokes</text>
                <text x="125" y="65" textAnchor="middle" fill="#94a3b8" fontSize="8.5">Background threads halted</text>
              </g>

              <g transform="translate(410, 35)">
                <rect width="250" height="80" rx="8" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1.5" />
                <text x="125" y="30" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">7. MicroVM Reclaimed</text>
                <text x="125" y="50" textAnchor="middle" fill="#fca5a5" fontSize="9.5">After ~5–15 mins idle time</text>
                <text x="125" y="65" textAnchor="middle" fill="#ef4444" fontSize="8.5">Environment destroyed</text>
              </g>

              <path d="M 350 75 L 405 75" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#shut-arr)" className="interactive-diagram-flowing-path" />

              <text x="380" y="155" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">
                ⚠️ Background processing trap: Never spawn background threads expecting them to run after handler returns!
              </text>
            </svg>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <strong style={{ color: '#38bdf8', fontSize: '11px' }}>Static Scope Optimization:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              Declare database pools, HTTP clients, and KMS decryptions outside the handler function (in static/global scope) so they persist across warm invocations.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
            <strong style={{ color: '#34d399', fontSize: '11px' }}>Provisioned Concurrency:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              Pre-warms instances ahead of traffic spikes to keep initialization time at 0ms for strict p99 SLA web applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
