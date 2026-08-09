import React, { useState } from 'react';

type Mode = 'SATURATED' | 'MITIGATED';

export default function HotKeySaturationDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('SATURATED');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span style={{ color: '#34d399' }}>Hot Key Saturation &amp; L1 Near Cache Mitigation</span>
      </div>

      {/* Mode selectors */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {(['SATURATED', 'MITIGATED'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '6px 12px', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 700, fontSize: '11px',
              background: mode === m ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: mode === m ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${mode === m ? '#38bdf850' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            {m === 'SATURATED' ? '1. Hot Key Saturation (Overload)' : '2. L1 Cache + Key Replication (Healthy)'}
          </button>
        ))}
      </div>

      <style>{`
        .hotkey-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .hotkey-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="hotkey-grid">

        {/* SVG Viewport */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="hk-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="hk-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Requesters flow */}
            <text x="50" y="25" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">10,000 Reads/s</text>
            <path d="M 50 32 L 50 65" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5" markerEnd="url(#hk-arr)" />

            {mode === 'SATURATED' ? (
              <g>
                {/* Saturated shard */}
                <rect x="15" y="70" width="80" height="50" rx="5" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="1.5" />
                <text x="55" y="93" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">Redis Node A</text>
                <text x="55" y="105" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">CPU: 100% 💥</text>

                {/* Overrun NIC bottleneck */}
                <rect x="145" y="70" width="180" height="50" rx="5" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" />
                <text x="235" y="90" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">NIC Bandwidth Exhaustion</text>
                <text x="235" y="102" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">40 Gbps limit exceeded. Packets dropped.</text>

                {/* Connection links */}
                <path d="M 100 95 L 140 95" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" className="interactive-diagram-flowing-path" markerEnd="url(#hk-arr-color)" />
              </g>
            ) : (
              <g>
                {/* L1 Cache block */}
                <rect x="15" y="70" width="80" height="50" rx="5" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="55" y="93" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">L1 Near Cache</text>
                <text x="55" y="105" textAnchor="middle" fill="#cbd5e1" fontSize="6">9,900 reads hit (0ms)</text>

                {/* Replicated Redis Shards */}
                {/* Node A */}
                <rect x="145" y="40" width="80" height="40" rx="4" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1" />
                <text x="185" y="60" textAnchor="middle" fill="#38bdf8" fontSize="7" fontWeight="bold">Node A (key:0)</text>
                <text x="185" y="70" textAnchor="middle" fill="#94a3b8" fontSize="5.5">CPU: 5%</text>

                {/* Node B */}
                <rect x="245" y="40" width="80" height="40" rx="4" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1" />
                <text x="285" y="60" textAnchor="middle" fill="#38bdf8" fontSize="7" fontWeight="bold">Node B (key:1)</text>
                <text x="285" y="70" textAnchor="middle" fill="#94a3b8" fontSize="5.5">CPU: 4%</text>

                {/* Node C */}
                <rect x="195" y="105" width="80" height="40" rx="4" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1" />
                <text x="235" y="125" textAnchor="middle" fill="#38bdf8" fontSize="7" fontWeight="bold">Node C (key:2)</text>
                <text x="235" y="135" textAnchor="middle" fill="#94a3b8" fontSize="5.5">CPU: 5%</text>

                {/* Directed paths from L1 Misses */}
                <path d="M 100 85 L 140 70" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" markerEnd="url(#hk-arr)" />
                <path d="M 100 95 L 190 120" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" markerEnd="url(#hk-arr)" />
                <path d="M 100 75 Q 185 15 240 50" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" markerEnd="url(#hk-arr)" />
              </g>
            )}
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{
          borderLeft: `4px solid ${mode === 'SATURATED' ? '#ef4444' : '#34d399'}`,
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>

          <div>
            <h4 style={{ margin: 0, fontSize: '12px', color: mode === 'SATURATED' ? '#ef4444' : '#34d399' }}>
              {mode === 'SATURATED' ? 'Cache Shard Bottleneck' : 'L1 Near Cache + Hash Ring Replication'}
            </h4>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
            {mode === 'SATURATED' ? 'A single keyspace slot receives all read QPS. The physical CPU core hosting that shard pegs at 100%, and command execution queues backlog instantly.' : 'Local heap memory Caffeine intercept stores the value for a brief window (e.g. 2s), catching 99% of reads locally. Writes are replicated across random suffixes to split network load.'}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${mode === 'SATURATED' ? '#ef4444' : '#34d399'}`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '11px',
          }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Network Footprint
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {mode === 'SATURATED' ? 'Forces high server NIC bandwidth and network interface queuing delays.' : 'Reduces network traffic to caches by orders of magnitude.'}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
