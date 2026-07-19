import React, { useState } from 'react';

type LsmPhase = 'write' | 'flush' | 'compact';

export default function LsmTreeWritePathDiagram(): React.JSX.Element {
  const [phase, setPhase] = useState<LsmPhase>('write');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <span>LSM-Tree Write Path & Storage Architecture</span>
      </div>

      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(['write', 'flush', 'compact'] as LsmPhase[]).map(t => {
          const isActive = phase === t;
          const label = t === 'write' ? '1. App Write' : t === 'flush' ? '2. Memtable Flush' : '3. SSTable Compaction';
          const color = t === 'write' ? '#38bdf8' : t === 'flush' ? '#fbbf24' : '#34d399';
          return (
            <button
              key={t}
              onClick={() => setPhase(t)}
              style={{
                flex: 1,
                minWidth: '120px',
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

      {/* Diagram Canvas */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="lsm-arr-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" /></marker>
            <marker id="lsm-arr-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" /></marker>
            <marker id="lsm-arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" /></marker>
          </defs>

          {/* RAM Boundary */}
          <line x1="330" y1="10" x2="330" y2="170" stroke="rgba(255,255,255,0.1)" strokeDasharray="5,5" />
          <text x="165" y="20" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="bold" letterSpacing="0.05em">RAM (VOLATILE)</text>
          <text x="495" y="20" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="bold" letterSpacing="0.05em">DISK (PERSISTENT)</text>

          {phase === 'write' && (
            <g>
              {/* App Thread */}
              <rect x="20" y="60" width="80" height="50" rx="5" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="60" y="85" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="800">App Write</text>
              <text x="60" y="97" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Insert k3:v3</text>

              {/* Memtable in RAM */}
              <rect x="180" y="60" width="130" height="60" rx="6" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="245" y="80" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="800">Memtable (RAM)</text>
              <text x="245" y="94" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Sorted RB-Tree</text>
              <text x="245" y="106" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">[k3:v3, k7:v7]</text>

              {/* WAL on Disk */}
              <rect x="420" y="60" width="130" height="60" rx="6" fill="rgba(251,191,36,0.08)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="485" y="80" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="800">Commit Log (WAL)</text>
              <text x="485" y="94" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Sequential Append</text>
              <text x="485" y="106" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">log: append k3:v3</text>

              {/* Paths */}
              <path id="lsm-p1" d="M 100 85 L 172 85" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#lsm-arr-blue)" className="interactive-diagram-flowing-path" />
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#lsm-p1"/></animateMotion>
              </circle>

              <path id="lsm-p2" d="M 245 120 C 245 150, 485 150, 485 122" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#lsm-arr-amber)" />
            </g>
          )}

          {phase === 'flush' && (
            <g>
              {/* Memtable */}
              <rect x="100" y="55" width="150" height="60" rx="6" fill="rgba(251,191,36,0.08)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="175" y="77" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="800">Memtable (RAM Full)</text>
              <text x="175" y="91" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Capacity reached (~64MB)</text>
              <text x="175" y="103" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8.5">[k1, k3, k8]</text>

              {/* L0 SSTable */}
              <rect x="420" y="55" width="160" height="60" rx="6" fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth="1.5" />
              <text x="500" y="77" textAnchor="middle" fill="#34d399" fontSize="11.5" fontWeight="800">SSTable L0 (Disk)</text>
              <text x="500" y="91" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Immutable Sorted Array</text>
              <text x="500" y="103" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="bold">[k1:v1, k3:v3, k8:v8]</text>

              {/* Flush arrow */}
              <path id="lsm-flush" d="M 252 85 L 412 85" fill="none" stroke="#fbbf24" strokeWidth="2.5" markerEnd="url(#lsm-arr-amber)" className="interactive-diagram-flowing-path" />
              <circle r="3.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#lsm-flush"/></animateMotion>
              </circle>
              <text x="332" y="74" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="bold">Sequential Disk Flush</text>
            </g>
          )}

          {phase === 'compact' && (
            <g>
              {/* L0 SSTables */}
              <rect x="30" y="45" width="130" height="35" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              <text x="95" y="60" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">L0: [k1:v1, k3:v2]</text>
              <text x="95" y="72" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">(older run)</text>

              <rect x="30" y="95" width="130" height="35" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              <text x="95" y="110" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">L0: [k3:v3, k8:v8]</text>
              <text x="95" y="122" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">(newer run - overrides k3)</text>

              {/* Compactor */}
              <rect x="250" y="70" width="120" height="40" rx="5" fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth="1.5" />
              <text x="310" y="94" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="800">Compactor</text>

              {/* L1 SSTable */}
              <rect x="460" y="65" width="170" height="50" rx="5" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
              <text x="545" y="87" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="800">SSTable L1 (Merged)</text>
              <text x="545" y="101" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="bold">[k1:v1, k3:v3, k8:v8]</text>

              {/* Paths */}
              <path d="M 162 62 Q 206 62, 250 82" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              <path d="M 162 112 Q 206 112, 250 100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              
              <path id="lsm-comp" d="M 372 90 L 452 90" fill="none" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#lsm-arr-green)" className="interactive-diagram-flowing-path" />
              <circle r="3.5" fill="#34d399" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#lsm-comp"/></animateMotion>
              </circle>
              <text x="412" y="80" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">Merge-Sort</text>
            </g>
          )}
        </svg>
      </div>

      {/* Description Panel */}
      <div className="interactive-diagram-details-card" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        {phase === 'write' && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>⚡ App Write Phase (Zero Disk Reads)</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**Log Append**: Writes transaction details sequentially to the WAL for durability. Since disk writes are purely sequential, they are extremely fast.</li>
              <li>**Memtable Write**: Simultaneously inserts the key-value into a sorted Red-Black or Skip-list tree in RAM (Memtable).</li>
              <li>**Commit Return**: Immediately returns success. No random index lookups or locks are held. Throughput is maximum.</li>
            </ul>
          </div>
        )}
        {phase === 'flush' && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}>📂 Memtable Disk Flush Phase</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**Capacity Trigger**: When the in-memory Memtable gets full (~32MB - 64MB), it is locked and frozen.</li>
              <li>**SSTable Generation**: A background thread writes the frozen sorted key array sequentially to disk, creating an **SSTable L0** file.</li>
              <li>**Immutability**: SSTables are completely read-only. Updates are never written in-place, eliminating index page lock contentions.</li>
            </ul>
          </div>
        )}
        {phase === 'compact' && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>🔄 Background Compaction Phase</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**Why it is needed**: Because tables are immutable, key updates generate multiple entries across L0 files. Reads must scan all of them.</li>
              <li>**Merge-Sort Compactor**: Background process merges multiple SSTables (L0 &rarr; L1 &rarr; L2), resolving duplicate keys by keeping the newest version.</li>
              <li>**Deletions (Tombstones)**: Deletion is written as a marker ("Tombstone"). Compaction physically reclaims storage by discarding deleted records.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
