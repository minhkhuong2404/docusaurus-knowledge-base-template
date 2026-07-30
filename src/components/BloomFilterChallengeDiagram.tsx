import React, { useState } from 'react';

type ChallengeMode = 'hashset' | 'database' | 'bloom';

export default function BloomFilterChallengeDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<ChallengeMode>('hashset');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>The Scalability Challenge: Checking Key Membership</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(['hashset', 'database', 'bloom'] as ChallengeMode[]).map(m => {
          const isActive = mode === m;
          const label = m === 'hashset' ? 'Option 1: In-Memory Hash Set' : m === 'database' ? 'Option 2: Direct Database Queries' : 'Option 3: Bloom Filter Front-Shield';
          const color = m === 'hashset' ? '#f87171' : m === 'database' ? '#fbbf24' : '#34d399';
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11px',
                background: isActive ? `${color}18` : 'rgba(255,255,255,0.03)',
                color: isActive ? color : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? `0 0 0 1.5px ${color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.15s ease'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .bfc-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="bfc-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Side Visual Flow */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ minHeight: '150px' }}>
          <svg viewBox="0 0 360 150" className="interactive-diagram-svg">
            {/* Client request */}
            <rect x="20" y="50" width="70" height="40" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <text x="55" y="74" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9" fontWeight="bold">Client Pod</text>

            {mode === 'hashset' && (
              <g>
                <rect x="180" y="30" width="130" height="80" rx="6" fill="rgba(248,113,113,0.08)" stroke="#f87171" strokeWidth="1.5" />
                <text x="245" y="52" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="800">In-Memory Hash Set</text>
                <text x="245" y="70" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">RAM Size: 5.6 GB</text>
                <text x="245" y="85" textAnchor="middle" fill="#f87171" fontSize="7.5" fontWeight="bold">💥 MEMORY OVERFLOW (OOM)</text>
                <path d="M 90 70 L 172 70" fill="none" stroke="#f87171" strokeWidth="1.5" />
              </g>
            )}

            {mode === 'database' && (
              <g>
                <rect x="180" y="30" width="130" height="80" rx="6" fill="rgba(251,191,36,0.08)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="245" y="52" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="800">Database Server</text>
                <text x="245" y="70" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Disk I/O Latency: ~20ms</text>
                <text x="245" y="85" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontWeight="bold">⚠️ DB IOPS EXHAUSTED</text>
                <path d="M 90 70 L 172 70" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
              </g>
            )}

            {mode === 'bloom' && (
              <g>
                {/* Bloom Filter shield */}
                <rect x="130" y="35" width="90" height="70" rx="5" fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth="1.5" />
                <text x="175" y="58" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="800">Bloom Filter</text>
                <text x="175" y="72" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">12 MB RAM (0.1ms)</text>
                <text x="175" y="88" textAnchor="middle" fill="#34d399" fontSize="6.5" fontWeight="bold">Shields 99% of Misses</text>

                {/* DB */}
                <rect x="260" y="50" width="80" height="40" rx="4" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <text x="300" y="74" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Database</text>

                <path d="M 90 70 L 122 70" fill="none" stroke="#34d399" strokeWidth="1.5" />
                <path d="M 220 70 L 252 70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" strokeDasharray="3,3" />
              </g>
            )}
          </svg>
        </div>

        {/* Right Side Assessment */}
        <div className="interactive-diagram-details-card" style={{ borderColor: mode === 'bloom' ? '#34d399' : mode === 'database' ? '#fbbf24' : '#f87171' }}>
          {mode === 'hashset' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f87171', marginBottom: '4px' }}>🔴 Memory Exhaustion Risk</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**Heavy Memory footprint**: Storing 100 million user IDs or transaction hashes inside an app Hash Set takes ~5.6GB RAM.</li>
                <li>**GC Pause storms**: Big heaps lead to JVM garbage collection pauses, stalling all parallel threads.</li>
                <li>**Cost**: Scalability is blocked by memory overhead cost.</li>
              </ul>
            </div>
          )}
          {mode === 'database' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}>🟡 Database IOPS & Latency Bottleneck</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**Network & Disk overhead**: Direct queries take ~20ms due to database network roundtrips and random disk read reads.</li>
                <li>**Thread Starvation**: Concurrent query floods lock connection pool allocations, cascading up to client timeouts.</li>
                <li>**DB Saturation**: Bypassing cache layers saturates DB buffer pools.</li>
              </ul>
            </div>
          )}
          {mode === 'bloom' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>🟢 Efficient Bloom Shielding (Optimal)</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**Extremely Lean footprint**: 100 million keys occupy only **12MB** memory with a low 1% false positive rate setting.</li>
                <li>**Database Shield**: Bypasses DB checks completely for 99% of non-existent query lookups.</li>
                <li>**Fast Latency**: Bit-level hash checks execute in CPU cycles (microseconds).</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
