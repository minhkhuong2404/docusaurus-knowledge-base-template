import React, { useState } from 'react';

type DistMode = 'centralized' | 'localized';

export default function DistributedBloomFilterDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<DistMode>('centralized');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Distributed Bloom Filter Synchronization Architectures</span>
      </div>

      {/* Mode toggle tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(['centralized', 'localized'] as DistMode[]).map(m => {
          const isActive = mode === m;
          const label = m === 'centralized' ? 'Option A: Centralized Redis Bloom' : 'Option B: Local RAM + Asynchronous Sync';
          const color = m === 'centralized' ? '#38bdf8' : '#a78bfa';
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
          .dbf-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="dbf-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Side SVG Illustration */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ minHeight: '170px' }}>
          <svg viewBox="0 0 360 170" className="interactive-diagram-svg">
            {/* App servers */}
            <g>
              <rect x="30" y="25" width="80" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              <text x="70" y="44" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9" fontWeight="bold">App Pod 1</text>
              {mode === 'localized' && <text x="70" y="56" textAnchor="middle" fill="#a78bfa" fontSize="7">Local Bloom Filter</text>}
            </g>

            <g>
              <rect x="30" y="105" width="80" height="40" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              <text x="70" y="124" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9" fontWeight="bold">App Pod 2</text>
              {mode === 'localized' && <text x="70" y="136" textAnchor="middle" fill="#a78bfa" fontSize="7">Local Bloom Filter</text>}
            </g>

            {mode === 'centralized' ? (
              <g>
                {/* Central Redis */}
                <rect x="200" y="55" width="120" height="60" rx="6" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="260" y="82" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="800">Central Redis Bloom</text>
                <text x="260" y="96" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Synchronous queries</text>

                {/* Connection lines */}
                <path d="M 110 45 L 200 70" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,2" />
                <path d="M 110 125 L 200 100" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,2" />
              </g>
            ) : (
              <g>
                {/* Message Broker (Kafka / Redis PubSub) */}
                <rect x="200" y="55" width="120" height="60" rx="6" fill="rgba(167,139,250,0.08)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="260" y="82" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="800">Sync Bus (Pub/Sub)</text>
                <text x="260" y="96" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Async Bit Propagation</text>

                {/* Connection paths */}
                <path d="M 110 45 L 200 70" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
                <path d="M 200 95 L 110 125" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3,3" />
              </g>
            )}
          </svg>
        </div>

        {/* Right Side Info Details */}
        <div className="interactive-diagram-details-card" style={{ borderColor: mode === 'centralized' ? '#38bdf8' : '#a78bfa' }}>
          {mode === 'centralized' ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>🛡️ Centralized Redis Bloom (Strict Consistency)</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**Immediate updates**: Writes immediately set bits in Redis. Read checks see updates instantly across all pods.</li>
                <li>**Network overhead**: Checks require a synchronous Redis roundtrip (~1-2ms), which adds read path latency.</li>
                <li>**Standard Command**: Utilizes RedisBloom module commands (`BF.ADD`, `BF.EXISTS`).</li>
              </ul>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#a78bfa', marginBottom: '4px' }}>⚡ Local RAM + Async Propagation (Highest Speed)</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**Zero Network reads**: Lookup runs directly against local JVM memory in microseconds (0ms network cost).</li>
                <li>**Pub/Sub Broadcast**: Writes update local RAM and publish a bitmask update message to Kafka / Redis PubSub.</li>
                <li>**Eventual Consistency**: Peer pods consume the broadcast queue and update their local bit structures asynchronously.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
