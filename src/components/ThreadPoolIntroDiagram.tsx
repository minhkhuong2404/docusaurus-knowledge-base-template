import React, { useState } from 'react';

type IntroMode = 'WITHOUT_POOL' | 'WITH_POOL';

interface IntroDetails {
  title: string;
  type: 'purple' | 'cyan';
  overhead: string;
  explanation: string;
  bullets: string[];
}

const INTRO_DATA: Record<IntroMode, IntroDetails> = {
  WITHOUT_POOL: {
    title: 'Without a Pool: Spawning Threads Per Task',
    type: 'purple',
    overhead: '⚠️ High Overhead (~1ms creation, ~1ms destruction per task)',
    explanation: 'The JVM must request physical thread resources from the underlying operating system kernel for every single task, allocation of 1MB stack memory space, and context switching.',
    bullets: [
      'Task 1 -> Create Thread-1 -> Run Task -> Destroy Thread-1',
      'High OS kernel context-switching penalty under burst load.',
      'Risk of OutOfMemoryError (OOM) if thread count grows uncontrolled.'
    ]
  },
  WITH_POOL: {
    title: 'With a Pool: Thread Pre-Allocation and Reuse',
    type: 'cyan',
    overhead: '⚡ Zero Overhead (0ms lifecycle cost)',
    explanation: 'A fixed pool of worker threads are created once at bootstrap. Sockets or task queues hand payloads directly to active idle threads, preserving their stack memory space.',
    bullets: [
      'Pre-allocated threads sit in waiting loops, checking tasks from work queues.',
      'Saves high-concurrency CPU resource cycles by avoiding JVM system kernel allocations.',
      'Maintains stable memory footprint since stack allocations are capped by pool size.'
    ]
  }
};

export default function ThreadPoolIntroDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<IntroMode>('WITHOUT_POOL');

  const selectedData = INTRO_DATA[mode];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Control Tabs */}
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
          
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: mode === 'WITHOUT_POOL' ? '#a855f7' : '#2dd4bf' }}>
            🧵 Lifecycle Mode: {mode === 'WITHOUT_POOL' ? 'Thread-Per-Task' : 'ThreadPool Reuse'}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => setMode('WITHOUT_POOL')}
            style={{
              background: mode === 'WITHOUT_POOL' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: mode === 'WITHOUT_POOL' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: mode === 'WITHOUT_POOL' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            No Pool
          </button>
          <button 
            onClick={() => setMode('WITH_POOL')}
            style={{
              background: mode === 'WITH_POOL' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: mode === 'WITH_POOL' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: mode === 'WITH_POOL' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            With Pool
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 160" className="interactive-diagram-svg">
          <defs>
            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
            </marker>
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
          </defs>

          {mode === 'WITHOUT_POOL' && (
            /* WITHOUT POOL: CREATE/DESTROY ON DEMAND */
            <g>
              <text x="30" y="30" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1' }}>Thread Creation/Destruction Loop</text>
              
              {/* Task flow timeline */}
              <g>
                <rect x="30" y="55" width="80" height="25" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.06)" />
                <text x="70" y="71" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>Task 1</text>
                <path id="path-nopool-1" d="M 110 67 L 170 67" fill="none" stroke="#a855f7" strokeWidth="1" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
                <circle r="2" fill="#a855f7" className="interactive-diagram-flowing-dot"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#path-nopool-1" /></animateMotion></circle>

                <rect x="180" y="50" width="130" height="35" rx="4" ry="4" fill="rgba(239, 68, 68, 0.08)" stroke="#f87171" strokeWidth="1.5" />
                <text x="245" y="71" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8, fill: '#f87171', textAnchor: 'middle' }}>🛠️ Spawn OS Thread</text>

                <path id="path-nopool-run" d="M 310 67 L 370 67" fill="none" stroke="#a855f7" strokeWidth="1" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
                <circle r="2" fill="#a855f7" className="interactive-diagram-flowing-dot"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#path-nopool-run" /></animateMotion></circle>

                <rect x="380" y="50" width="100" height="35" rx="4" ry="4" fill="rgba(74, 222, 128, 0.08)" stroke="#4ade80" strokeWidth="1.5" />
                <text x="430" y="71" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8, fill: '#4ade80', textAnchor: 'middle' }}>⚙️ Execute Task</text>

                <path id="path-nopool-destroy" d="M 480 67 L 540 67" fill="none" stroke="#64748b" strokeWidth="1" markerEnd="url(#arrow-purple)" />

                <rect x="550" y="50" width="100" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="#475569" strokeWidth="1" />
                <text x="600" y="71" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8, fill: '#94a3b8', textAnchor: 'middle' }}>❌ Destroy Thread</text>
              </g>

              {/* Status helper */}
              <text x="30" y="125" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9.5, fill: '#fbbf24' }}>Overhead: Clogged by kernel allocation boundaries.</text>
            </g>
          )}

          {mode === 'WITH_POOL' && (
            /* WITH POOL: THREAD REUSE */
            <g>
              <text x="30" y="30" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1' }}>Warm Thread Pool Reusing Platform Threads</text>

              {/* Tasks queueing and flowing into warm pool */}
              <g>
                <rect x="30" y="45" width="80" height="25" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.06)" />
                <text x="70" y="61" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>Task A</text>

                <rect x="30" y="80" width="80" height="25" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.06)" />
                <text x="70" y="96" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>Task B</text>

                {/* Pool Boundary */}
                <rect x="250" y="40" width="380" height="90" rx="6" ry="6" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="2" />
                <text x="440" y="25" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#2dd4bf', textAnchor: 'middle' }}>ThreadPool Container</text>

                {/* Warm threads */}
                <rect x="270" y="55" width="100" height="35" rx="4" ry="4" fill="rgba(45, 212, 191, 0.15)" stroke="#2dd4bf" strokeWidth="1.5" />
                <text x="320" y="76" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#ffffff', textAnchor: 'middle' }}>Thread-1 (Active)</text>

                <rect x="390" y="55" width="100" height="35" rx="4" ry="4" fill="rgba(45, 212, 191, 0.15)" stroke="#2dd4bf" strokeWidth="1.5" />
                <text x="440" y="76" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#ffffff', textAnchor: 'middle' }}>Thread-2 (Active)</text>

                <rect x="510" y="55" width="100" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x="560" y="76" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#64748b', textAnchor: 'middle' }}>Thread-3 (Idle)</text>

                {/* Flow lines */}
                <path id="path-pool-a" d="M 110 57 L 260 70" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
                <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-pool-a" /></animateMotion></circle>

                <path id="path-pool-b" d="M 110 92 L 380 80" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
                <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#path-pool-b" /></animateMotion></circle>
              </g>

              {/* Status helper */}
              <text x="30" y="145" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9.5, fill: '#4ade80' }}>Overhead: Zero. Threads are kept alive in wait loops.</text>
            </g>
          )}
        </svg>
      </div>

      {/* Description Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Overhead Cost:</strong> <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{selectedData.overhead}</span></p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Execution Details:</strong>
            <ul>
              {selectedData.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Switch between "No Pool" and "With Pool" tabs to compare CPU/OS allocation boundaries.
      </p>
    </div>
  );
}
