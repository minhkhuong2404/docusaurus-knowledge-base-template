import React, { useState } from 'react';

export default function ConcurrencyVsParallelismAnalogDiagram(): React.JSX.Element {
  const [isParallel, setIsParallel] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Analogy Control Bar */}
      <div 
        className="interactive-diagram-card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            className={`interactive-diagram-indicator-dot ${isParallel ? 'card-indicator-green' : 'card-indicator-cyan'}`} 
            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isParallel ? '#4ade80' : '#2dd4bf' }}
          />
          <h3 style={{ margin: '0 !important', fontSize: '0.95rem', fontWeight: 700, color: isParallel ? '#4ade80 !important' : '#2dd4bf !important' }}>
            ☕ Coffee Shop Analogy: {isParallel ? 'Parallelism (Multi-Counter)' : 'Concurrency (Single Cashier)'}
          </h3>
        </div>
        
        {/* Toggle Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setIsParallel(false)}
            style={{
              background: !isParallel ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: !isParallel ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: !isParallel ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Concurrency Mode
          </button>
          <button 
            onClick={() => setIsParallel(true)}
            style={{
              background: isParallel ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: isParallel ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: isParallel ? '#4ade80' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Parallelism Mode
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ height: '180px' }}>
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
            </marker>
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
            </marker>
          </defs>

          {!isParallel ? (
            /* CONCURRENCY VISUALS (1 Cashier, Interleaved Customers) */
            <g>
              {/* Single Queue on Left */}
              <text x="40" y="45" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#cbd5e1' }}>Customer Queue</text>
              <rect x="30" y="55" width="160" height="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" rx="6" />
              
              <circle cx="60" cy="90" r="14" fill="rgba(45, 212, 191, 0.1)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="60" y="94" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, fill: '#2dd4bf', textAnchor: 'middle' }}>C3</text>

              <circle cx="110" cy="90" r="14" fill="rgba(45, 212, 191, 0.1)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="110" y="94" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, fill: '#2dd4bf', textAnchor: 'middle' }}>C2</text>

              <circle cx="160" cy="90" r="14" fill="rgba(45, 212, 191, 0.15)" stroke="#2dd4bf" strokeWidth="2" />
              <text x="160" y="94" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>C1</text>

              {/* Single Cashier in Center */}
              <rect x="270" y="55" width="120" height="70" rx="8" ry="8" fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" strokeWidth="2.5" />
              <text x="330" y="87" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Cashier</text>
              <text x="330" y="105" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8.5, fill: '#a855f7', textAnchor: 'middle' }}>[1 Worker / CPU Core]</text>

              {/* Order Flow Arrow & Particle */}
              <path id="flow-concurrency" d="M 200 90 L 260 90" fill="none" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="3" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#flow-concurrency" />
                </animateMotion>
              </circle>

              {/* Output Task Actions */}
              <text x="470" y="45" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#cbd5e1' }}>Interleaved Tasks (Progressing)</text>
              <rect x="450" y="55" width="200" height="70" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" rx="6" />
              
              <text x="465" y="78" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9.5, fill: '#2dd4bf' }}>• Taking order from Cust 1...</text>
              <text x="465" y="100" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9.5, fill: '#a855f7' }}>• Switching: Takes Cust 2 order</text>
            </g>
          ) : (
            /* PARALLELISM VISUALS (2 Cashiers, Dual Queue Processing) */
            <g>
              {/* Queue 1 */}
              <circle cx="60" cy="55" r="13" fill="rgba(74, 222, 128, 0.1)" stroke="#4ade80" strokeWidth="1.5" />
              <text x="60" y="59" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#4ade80', textAnchor: 'middle' }}>C3</text>

              <circle cx="120" cy="55" r="13" fill="rgba(74, 222, 128, 0.15)" stroke="#4ade80" strokeWidth="2" />
              <text x="120" y="59" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>C1</text>

              {/* Queue 2 */}
              <circle cx="60" cy="125" r="13" fill="rgba(74, 222, 128, 0.1)" stroke="#4ade80" strokeWidth="1.5" />
              <text x="60" y="129" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#4ade80', textAnchor: 'middle' }}>C4</text>

              <circle cx="120" cy="125" r="13" fill="rgba(74, 222, 128, 0.15)" stroke="#4ade80" strokeWidth="2" />
              <text x="120" y="129" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>C2</text>

              {/* Cashier 1 */}
              <rect x="240" y="30" width="130" height="50" rx="6" ry="6" fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" strokeWidth="2" />
              <text x="305" y="55" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Cashier 1 [Core 0]</text>
              <text x="305" y="68" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#4ade80', textAnchor: 'middle' }}>Processing Cust 1</text>

              {/* Cashier 2 */}
              <rect x="240" y="100" width="130" height="50" rx="6" ry="6" fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" strokeWidth="2" />
              <text x="305" y="125" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Cashier 2 [Core 1]</text>
              <text x="305" y="138" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#4ade80', textAnchor: 'middle' }}>Processing Cust 2</text>

              {/* Flow Arrows & Particles */}
              <path id="flow-p1" d="M 160 55 L 230 55" fill="none" stroke="#4ade80" strokeWidth="2" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
              <circle r="3" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.8s" repeatCount="indefinite">
                  <mpath href="#flow-p1" />
                </animateMotion>
              </circle>

              <path id="flow-p2" d="M 160 125 L 230 125" fill="none" stroke="#4ade80" strokeWidth="2" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
              <circle r="3" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.8s" repeatCount="indefinite">
                  <mpath href="#flow-p2" />
                </animateMotion>
              </circle>

              {/* Output Task Actions */}
              <text x="450" y="25" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1' }}>Simultaneous execution (True Parallel)</text>
              <rect x="430" y="30" width="225" height="120" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.05)" rx="6" />
              
              <text x="445" y="60" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9.5, fill: '#4ade80' }}>⚡ Core 0 (Cashier 1):</text>
              <text x="460" y="76" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 9, fill: '#cbd5e1' }}>Taking order from Cust 1</text>

              <text x="445" y="110" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9.5, fill: '#4ade80' }}>⚡ Core 1 (Cashier 2):</text>
              <text x="460" y="126" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 9, fill: '#cbd5e1' }}>Taking order from Cust 2</text>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${isParallel ? 'details-green' : 'details-cyan'}`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${isParallel ? 'card-indicator-green' : 'card-indicator-cyan'}`} />
          <h3>{isParallel ? 'Parallelism: Physical Simultaneity' : 'Concurrency: Interleaved Structural Progress'}</h3>
        </div>
        {!isParallel ? (
          <div>
            <p><strong>Analogy Explanation:</strong> The cashier starts taking order 1. While order 1 is brewing, the cashier takes order 2. They switch back and forth.</p>
            <p><strong>System Mapping:</strong> A single CPU Core uses time-slicing (scheduling context switches) to run Task A and Task B. Progress is interleaved. Responsiveness is maintained, but tasks do not execute at the exact same physical clock cycle.</p>
          </div>
        ) : (
          <div>
            <p><strong>Analogy Explanation:</strong> Two cashiers run side-by-side, taking orders from Customer 1 and Customer 2 at the exact same physical instant.</p>
            <p><strong>System Mapping:</strong> Multiple CPU cores execute Task A and Task B concurrently. Tasks process physically in parallel. Increases throughput and gets heavy CPU-bound jobs finished faster.</p>
          </div>
        )}
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Use the tabs above to toggle between Concurrency (interleaved single-cashier orders) and Parallelism (simultaneous double-counter flows) mode.
      </p>
    </div>
  );
}
