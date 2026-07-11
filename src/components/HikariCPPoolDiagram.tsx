import React, { useState } from 'react';

type HikariStep = 'THREAD_LOCAL' | 'SHARED_LIST' | 'HANDOFF_QUEUE';

interface HikariDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  latency: string;
  contention: string;
  explanation: string;
  bullets: string[];
}

const HIKARI_DATA: Record<HikariStep, HikariDetails> = {
  THREAD_LOCAL: {
    title: 'Step 1: Thread-Local Borrow (Fast Path)',
    type: 'purple',
    latency: '⚡ ~250 nanoseconds',
    contention: 'Zero contention (lock-free)',
    explanation: 'ConcurrentBag checks the calling thread\'s local list of connections. If a thread previously borrowed and returned a connection (e.g. C1), it acquires it immediately.',
    bullets: [
      'Bypasses all volatile read/write fences and synchronized locks.',
      'Saves high-concurrency CPU cycles by keeping local connection cache structures thread-confined.'
    ]
  },
  SHARED_LIST: {
    title: 'Step 2: Shared List Steal (Lock-Free CAS)',
    type: 'cyan',
    latency: '⚡ ~500 nanoseconds',
    contention: 'Low contention',
    explanation: 'If the thread-local list is empty or misses, the thread scans the master shared list containing all active connections in the bag.',
    bullets: [
      'Uses compare-and-swap (CAS) lock-free CPU instructions to claim an idle connection.',
      'Ensures multiple threads do not accidentally borrow the same connection simultaneously.'
    ]
  },
  HANDOFF_QUEUE: {
    title: 'Step 3: Handoff Queue (Parking State)',
    type: 'green',
    latency: '⏳ Waits up to connection-timeout (Default: 30s)',
    contention: 'High saturation fallback path',
    explanation: 'If all connections are fully checked out, the thread creates a SynchronousQueue handoff receiver and parks itself (using LockSupport.park()).',
    bullets: [
      'When another worker thread returns a connection, it offers it directly to the handoff queue, unparking the waiting thread.',
      'If the connection-timeout expires before unparking, the thread throws SQLTransientConnectionException.'
    ]
  }
};

export default function HikariCPPoolDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<HikariStep>('THREAD_LOCAL');

  const selectedData = HIKARI_DATA[activeStep];

  const getBorderColor = (key: HikariStep) => {
    if (activeStep === key) {
      return HIKARI_DATA[key].type === 'purple' ? '#a855f7' : HIKARI_DATA[key].type === 'cyan' ? '#2dd4bf' : '#4ade80';
    }
    return 'rgba(255, 255, 255, 0.08)';
  };

  const getNumColor = (key: HikariStep) => {
    if (activeStep === key) {
      return HIKARI_DATA[key].type === 'purple' ? '#c084fc' : HIKARI_DATA[key].type === 'cyan' ? '#67e8f9' : '#86efac';
    }
    return '#475569';
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Selector blocks */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '12px',
          margin: '0.8rem 0'
        }}
      >
        {(Object.keys(HIKARI_DATA) as HikariStep[]).map((key, idx) => {
          const step = HIKARI_DATA[key];
          return (
            <div
              key={key}
              onClick={() => setActiveStep(key)}
              style={{
                flex: '1 1 200px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1.5px solid ${getBorderColor(key)}`,
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeStep === key ? '0 4px 15px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: getNumColor(key) }}>STEP 0{idx + 1}</span>
                <span 
                  className="interactive-diagram-indicator-dot" 
                  style={{
                    backgroundColor: step.type === 'purple' ? '#a855f7' : step.type === 'cyan' ? '#2dd4bf' : '#4ade80',
                    width: activeStep === key ? '8px' : '5px',
                    height: activeStep === key ? '8px' : '5px',
                    opacity: activeStep === key ? 1 : 0.4
                  }}
                />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                {key === 'THREAD_LOCAL' ? 'Thread-Local' : key === 'SHARED_LIST' ? 'Shared List Steal' : 'Handoff Queue'}
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{step.latency}</p>
            </div>
          );
        })}
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'cyan' ? 'details-cyan' : 'details-green'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'purple' ? 'card-indicator-purple' : selectedData.type === 'cyan' ? 'card-indicator-cyan' : 'card-indicator-green'
          }`} />
          <h3>ConcurrentBag: {selectedData.title}</h3>
        </div>
        <p><strong>Latency Overhead:</strong> <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{selectedData.latency}</span></p>
        <p><strong>Thread Contention:</strong> {selectedData.contention}</p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>ConcurrentBag Mechanics:</strong>
            <ul>
              {selectedData.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on Step 01, 02, or 03 above to trace HikariCP connection acquisition internals.
      </p>
    </div>
  );
}
