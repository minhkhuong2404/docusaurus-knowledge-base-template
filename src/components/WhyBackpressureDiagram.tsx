import React, { useState } from 'react';

type BPState = 'none' | 'active';

export default function WhyBackpressureDiagram(): React.JSX.Element {
  const [state, setState] = useState<BPState>('active');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Why Backpressure is Not Optional — Spike Behavior</span>
      </div>

      {/* Mode selectors */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(['active', 'none'] as BPState[]).map(t => {
          const isActive = state === t;
          const label = t === 'active' ? 'With Bounded Queue & Rate Limiting (Stable)' : 'Without Backpressure (System Crash)';
          const color = t === 'active' ? '#34d399' : '#f87171';
          return (
            <button
              key={t}
              onClick={() => setState(t)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12.5px',
                background: isActive ? `${color}18` : 'rgba(255,255,255,0.04)',
                color: isActive ? color : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? `0 0 0 1.5px ${color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* SVG Visualization */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="bp-arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" /></marker>
            <marker id="bp-arr-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" /></marker>
            <marker id="bp-arr-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f97316" /></marker>
          </defs>

          {/* Traffic Spike inputs */}
          <g>
            <rect x="20" y="55" width="80" height="70" rx="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <text x="60" y="85" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10.5" fontWeight="800">Traffic Spike</text>
            <text x="60" y="98" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="bold">10k req/sec</text>
          </g>

          {state === 'active' ? (
            <g>
              {/* Rate Limiter */}
              <rect x="180" y="60" width="110" height="60" rx="6" fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth="1.5" />
              <text x="235" y="88" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="800">API Gateway</text>
              <text x="235" y="102" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Bounded Queue</text>

              {/* Database */}
              <rect x="420" y="60" width="100" height="60" rx="6" fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth="1.5" />
              <text x="470" y="90" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="800">Database Pool</text>
              <text x="470" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Stable (20 / 20)</text>

              {/* Flow Arrows */}
              <path id="bp-f1" d="M 100 90 L 172 90" fill="none" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#bp-arr-green)" className="interactive-diagram-flowing-path" />
              <circle r="3.5" fill="#34d399" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#bp-f1"/></animateMotion>
              </circle>

              <path id="bp-f2" d="M 290 90 L 412 90" fill="none" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#bp-arr-green)" className="interactive-diagram-flowing-path" />
              <circle r="3.5" fill="#34d399" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#bp-f2"/></animateMotion>
              </circle>

              {/* 429 Rejections */}
              <path id="bp-reject" d="M 235 60 C 235 20, 150 20, 150 40" fill="none" stroke="#f97316" strokeWidth="1.5" markerEnd="url(#bp-arr-orange)" />
              <text x="190" y="25" fill="#f97316" fontSize="9" fontWeight="bold">HTTP 429 (Rejected)</text>

              <text x="590" y="94" textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="bold">🟢 SYSTEM STABLE</text>
            </g>
          ) : (
            <g>
              {/* Unbounded Router */}
              <rect x="180" y="60" width="110" height="60" rx="6" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
              <text x="235" y="88" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="800">Unbounded Queue</text>
              <text x="235" y="102" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">Accepts all requests</text>

              {/* Exhausted DB */}
              <rect x="420" y="60" width="100" height="60" rx="6" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="2" strokeDasharray="3,3" />
              <text x="470" y="86" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="800">DB Exhausted</text>
              <text x="470" y="100" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Lock wait p99 &gt; 5s</text>
              <text x="470" y="112" textAnchor="middle" fill="#f87171" fontSize="7.5" fontWeight="bold">CPU 100% / Out of Conn</text>

              {/* Flow Arrows (rapid/aggressive) */}
              <path id="bp-f1-crash" d="M 100 90 L 172 90" fill="none" stroke="#f87171" strokeWidth="3" markerEnd="url(#bp-arr-red)" className="interactive-diagram-flowing-path" />
              <circle r="4" fill="#f87171" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.4s" repeatCount="indefinite"><mpath href="#bp-f1-crash"/></animateMotion>
              </circle>

              <path id="bp-f2-crash" d="M 290 90 L 412 90" fill="none" stroke="#f87171" strokeWidth="3" markerEnd="url(#bp-arr-red)" className="interactive-diagram-flowing-path" />
              <circle r="4" fill="#f87171" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.5s" repeatCount="indefinite"><mpath href="#bp-f2-crash"/></animateMotion>
              </circle>

              <text x="590" y="94" textAnchor="middle" fill="#f87171" fontSize="13" fontWeight="bold">💥 SYSTEM CRASH (OOM)</text>
            </g>
          )}
        </svg>
      </div>

      {/* Description details */}
      <div className="interactive-diagram-details-card" style={{ borderColor: state === 'active' ? '#34d399' : '#f87171' }}>
        {state === 'active' ? (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>🛡️ Stable System with Backpressure</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**Bounded Memory footprint**: Setting strict limits on in-memory buffers locks memory footprint, preventing heap exhaustion.</li>
              <li>**Client-Side Throttling**: Overflowing requests receive `HTTP 429 Too Many Requests` or `HTTP 503`, allowing clients to back off.</li>
              <li>**Core Protection**: The database operates within safe concurrent execution bounds, preserving response predictability for active sessions.</li>
            </ul>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f87171', marginBottom: '4px' }}>⚠️ Cascade Failure Path (Cascading Outage)</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**Memory Saturation**: Unbounded queues ingest millions of writes, leading to JVM Garbage Collection storms and eventual OOM crashes.</li>
              <li>**DB Thread Saturation**: HikariCP is exhausted. Threads block waiting for connections, cascading up to web container thread starvation.</li>
              <li>**Failure recovery time**: Rebuilding and starting the database cluster after a full crash can take hours of manual recovery.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
