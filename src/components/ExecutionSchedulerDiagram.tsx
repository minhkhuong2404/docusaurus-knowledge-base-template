import React, { useState } from 'react';

type InfoKey = 'CORE_0' | 'CORE_1' | 'CORE_2' | 'SWITCH' | 'CONTINUOUS';

interface InfoDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'red' | 'blue';
  overhead: string;
  explanation: string;
  keyPoints: string[];
}

const INFO_DATA: Record<InfoKey, InfoDetails> = {
  CORE_0: {
    title: 'Core 0 execution unit',
    type: 'purple',
    overhead: 'Context Switches cost ~10 to 50 microseconds',
    explanation: 'In Concurrency mode, Core 0 alternates execution slices. In Parallelism mode, Core 0 runs Task A continuously without interruption.',
    keyPoints: [
      'Concurrency: Executes Task A, then saves CPU registers, flushes L1 caches, loads Task B, and resumes.',
      'Parallelism: Task A runs on Core 0 with zero cache sharing conflicts or register thrashing.'
    ]
  },
  CORE_1: {
    title: 'Core 1 execution unit',
    type: 'cyan',
    overhead: 'Zero context switches (Independent Core)',
    explanation: 'Only available in Parallelism mode. Core 1 runs Task B physically at the exact same instant Core 0 is executing Task A.',
    keyPoints: [
      'Gives true physical parallelism.',
      'Utilizes native execution hardware pipelines.'
    ]
  },
  CORE_2: {
    title: 'Core 2 execution unit',
    type: 'green',
    overhead: 'Zero context switches (Independent Core)',
    explanation: 'Only available in Parallelism mode. Core 2 runs Task C physically at the exact same instant Core 0 and Core 1 are executing.',
    keyPoints: [
      'Permits multi-threaded workloads to scale linearly with the processor count.'
    ]
  },
  SWITCH: {
    title: 'Thread Context Switching',
    type: 'red',
    overhead: 'High CPU Overhead (10,000 to 50,000 clock cycles)',
    explanation: 'The operating system thread scheduler interrupts a running thread to give execution time to another thread.',
    keyPoints: [
      'Saves CPU registers, Program Counter (PC), and stack pointer values in the Thread Control Block (TCB).',
      'Flushes or invalidates CPU L1 instruction and data caches, creating latency until new caches are loaded.'
    ]
  },
  CONTINUOUS: {
    title: 'Continuous Parallel Execution',
    type: 'blue',
    overhead: 'Zero Scheduler Switch Overhead',
    explanation: 'Threads run without interruption on their assigned cores.',
    keyPoints: [
      'Maximizes CPU cache locality.',
      'Eliminates registers swapping and scheduler kernel-mode context switches.'
    ]
  }
};

export default function ExecutionSchedulerDiagram(): React.JSX.Element {
  const [isParallel, setIsParallel] = useState<boolean>(false);
  const [activeInfo, setActiveInfo] = useState<InfoKey>('CORE_0');

  const selectedData = INFO_DATA[activeInfo];

  const handleBlockClick = (key: InfoKey) => {
    setActiveInfo(key);
  };

  const getStroke = (key: InfoKey) => {
    if (activeInfo === key) {
      return INFO_DATA[key].type === 'purple' ? '#a855f7' : INFO_DATA[key].type === 'cyan' ? '#2dd4bf' : INFO_DATA[key].type === 'green' ? '#4ade80' : INFO_DATA[key].type === 'red' ? '#f87171' : '#3b82f6';
    }
    return INFO_DATA[key].type === 'purple' ? '#6b21a8' : INFO_DATA[key].type === 'cyan' ? '#0891b2' : INFO_DATA[key].type === 'green' ? '#15803d' : INFO_DATA[key].type === 'red' ? '#991b1b' : '#1d4ed8';
  };

  const getFill = (key: InfoKey) => {
    if (activeInfo === key) {
      return INFO_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : INFO_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : INFO_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : INFO_DATA[key].type === 'red' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)';
    }
    return INFO_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : INFO_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : INFO_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : INFO_DATA[key].type === 'red' ? 'rgba(127, 29, 29, 0.05)' : 'rgba(30, 58, 138, 0.05)';
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Schedulers Control Bar */}
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
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: isParallel ? '#4ade80' : '#2dd4bf' }}>
            🖥️ CPU Execution: {isParallel ? 'Multi-Core Parallelism' : 'Single-Core Concurrency'}
          </h3>
        </div>
        
        {/* Toggle Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => { setIsParallel(false); setActiveInfo('CORE_0'); }}
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
            Single-Core Time-Slice
          </button>
          <button 
            onClick={() => { setIsParallel(true); setActiveInfo('CONTINUOUS'); }}
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
            Multi-Core Parallel lines
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <text x="50" y="30" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8.5, fill: '#64748b' }}>Time ──▶</text>

          {!isParallel ? (
            /* CONCURRENCY VISUALS (Interleaved single core execution) */
            <g>
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('CORE_0')}>
                <rect x="30" y="50" width="80" height="40" fill="none" stroke="rgba(255,255,255,0.08)" />
                <text x="70" y="74" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#cbd5e1', textAnchor: 'middle' }}>Core 0</text>
              </g>

              {/* Task A slice 1 */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('CORE_0')}>
                <rect x="120" y="50" width="80" height="40" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" strokeWidth="1.5" />
                <text x="160" y="74" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Task A</text>
              </g>

              {/* Context Switch 1 */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('SWITCH')}>
                <line x1="200" y1="40" x2="200" y2="100" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" />
                <text x="200" y="115" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: '#f87171', textAnchor: 'middle' }}>Switch</text>
              </g>

              {/* Task B slice 1 */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('CORE_0')}>
                <rect x="210" y="50" width="80" height="40" fill="rgba(45, 212, 191, 0.15)" stroke="#2dd4bf" strokeWidth="1.5" />
                <text x="250" y="74" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Task B</text>
              </g>

              {/* Context Switch 2 */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('SWITCH')}>
                <line x1="290" y1="40" x2="290" y2="100" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" />
                <text x="290" y="115" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: '#f87171', textAnchor: 'middle' }}>Switch</text>
              </g>

              {/* Task A slice 2 */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('CORE_0')}>
                <rect x="300" y="50" width="80" height="40" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" strokeWidth="1.5" />
                <text x="340" y="74" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Task A</text>
              </g>

              {/* Context Switch 3 */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('SWITCH')}>
                <line x1="380" y1="40" x2="380" y2="100" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" />
                <text x="380" y="115" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: '#f87171', textAnchor: 'middle' }}>Switch</text>
              </g>

              {/* Task C slice 1 */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('CORE_0')}>
                <rect x="390" y="50" width="80" height="40" fill="rgba(74, 222, 128, 0.15)" stroke="#4ade80" strokeWidth="1.5" />
                <text x="430" y="74" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Task C</text>
              </g>
            </g>
          ) : (
            /* PARALLELISM VISUALS (Multiple continuous cores execution) */
            <g>
              {/* Core 0 Line */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('CORE_0')}>
                <rect x="30" y="40" width="80" height="30" fill="none" stroke="rgba(255,255,255,0.08)" />
                <text x="70" y="59" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#cbd5e1', textAnchor: 'middle' }}>Core 0</text>

                <rect x="130" y="40" width="480" height="30" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" strokeWidth="1.5" />
                <text x="370" y="59" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Task A (Continuous Parallel Execution)</text>
              </g>

              {/* Core 1 Line */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('CORE_1')}>
                <rect x="30" y="85" width="80" height="30" fill="none" stroke="rgba(255,255,255,0.08)" />
                <text x="70" y="104" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#cbd5e1', textAnchor: 'middle' }}>Core 1</text>

                <rect x="130" y="85" width="480" height="30" fill="rgba(45, 212, 191, 0.15)" stroke="#2dd4bf" strokeWidth="1.5" />
                <text x="370" y="104" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Task B (Continuous Parallel Execution)</text>
              </g>

              {/* Core 2 Line */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleBlockClick('CORE_2')}>
                <rect x="30" y="130" width="80" height="30" fill="none" stroke="rgba(255,255,255,0.08)" />
                <text x="70" y="149" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#cbd5e1', textAnchor: 'middle' }}>Core 2</text>

                <rect x="130" y="130" width="480" height="30" fill="rgba(74, 222, 128, 0.15)" stroke="#4ade80" strokeWidth="1.5" />
                <text x="370" y="149" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Task C (Continuous Parallel Execution)</text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'red' ? 'details-red' : selectedData.type === 'blue' ? 'details-blue' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'green' ? 'card-indicator-green' : selectedData.type === 'purple' ? 'card-indicator-purple' : selectedData.type === 'red' ? 'card-indicator-red' : selectedData.type === 'blue' ? 'card-indicator-blue' : 'card-indicator-cyan'
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>CPU Overhead:</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>{selectedData.overhead}</span></p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Execution Details:</strong>
            <ul>
              {selectedData.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on CPU core rows, task blocks, or context switch markers to analyze execution thread scheduler overheads.
      </p>
    </div>
  );
}
