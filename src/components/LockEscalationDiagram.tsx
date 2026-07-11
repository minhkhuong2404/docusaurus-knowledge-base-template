import React, { useState } from 'react';

type LockState = 'BIASED' | 'LIGHTWEIGHT' | 'HEAVYWEIGHT';

interface StateDetails {
  title: string;
  type: 'purple' | 'cyan' | 'red';
  tag: string;
  contention: string;
  overhead: string;
  bullets: string[];
}

const STATES_DATA: Record<LockState, StateDetails> = {
  BIASED: {
    title: 'Biased Locking (Single Thread Access)',
    type: 'purple',
    tag: '01 (Biased)',
    contention: 'None (Only 1 thread acquires)',
    overhead: 'Near-Zero (No CAS, no atomic CPU cycles)',
    bullets: [
      'JVM stamps the thread ID directly into the object\'s Mark Word header.',
      'Subsequent locking/unlocking by the same thread requires no synchronization operations.',
      'Highly optimized for single-threaded local execution paths (e.g. legacy Vector/Hashtable uses).'
    ]
  },
  LIGHTWEIGHT: {
    title: 'Lightweight Locking (Low/Brief Contention)',
    type: 'cyan',
    tag: '00 (Lightweight)',
    contention: 'Low (Threads request lock sequentially/briefly)',
    overhead: 'Low (CPU CAS spinning, no context switches)',
    bullets: [
      'Biased locking is revoked (requires a JVM safepoint transition).',
      'The lock-acquiring thread creates a Lock Record in its execution stack frame.',
      'Uses CAS (Compare-And-Swap) to spin-wait for the lock. If contention stays low, threads lock without blocking.'
    ]
  },
  HEAVYWEIGHT: {
    title: 'Heavyweight Locking (High/Sustained Contention)',
    type: 'red',
    tag: '10 (Heavyweight)',
    contention: 'High (Sustained concurrent access)',
    overhead: 'High (OS kernel context switches, thread scheduling)',
    bullets: [
      'Triggered when CAS spin-wait thresholds are exceeded (~10 iterations).',
      'An OS-level mutex (monitor object) is allocated to manage wait queues.',
      'Waiting threads are descheduled and parked by the kernel. Saves CPU cycles at the cost of context switch latency (~1–10µs).'
    ]
  }
};

export default function LockEscalationDiagram(): React.JSX.Element {
  const [state, setState] = useState<LockState>('BIASED');

  const selectedData = STATES_DATA[state];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Header controls */}
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
          <span className={`interactive-diagram-indicator-dot ${
            state === 'BIASED' ? 'card-indicator-purple' : state === 'LIGHTWEIGHT' ? 'card-indicator-cyan' : 'card-indicator-red'
          }`} />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔒</span>
            <span style={{ color: state === 'BIASED' ? '#a855f7' : state === 'LIGHTWEIGHT' ? '#2dd4bf' : '#f87171' }}>
              Lock Escalation: {state}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setState('BIASED')}
            style={{
              background: state === 'BIASED' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: state === 'BIASED' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: state === 'BIASED' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Biased
          </button>
          <button 
            onClick={() => setState('LIGHTWEIGHT')}
            style={{
              background: state === 'LIGHTWEIGHT' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: state === 'LIGHTWEIGHT' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: state === 'LIGHTWEIGHT' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Lightweight
          </button>
          <button 
            onClick={() => setState('HEAVYWEIGHT')}
            style={{
              background: state === 'HEAVYWEIGHT' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: state === 'HEAVYWEIGHT' ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: state === 'HEAVYWEIGHT' ? '#f87171' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Heavyweight
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
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
            </marker>
          </defs>

          {/* Biased State Box */}
          <g>
            <rect x="25" y="45" width="165" height="70" rx="6" ry="6" fill={state === 'BIASED' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.01)'} stroke={state === 'BIASED' ? '#a855f7' : 'rgba(255,255,255,0.05)'} strokeWidth={state === 'BIASED' ? 2 : 1} />
            <text x="107.5" y="70" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: state === 'BIASED' ? '#c084fc' : '#475569', textAnchor: 'middle' }}>Biased Locking</text>
            <rect x="55" y="83" width="105" height="20" rx="3" ry="3" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.05)" />
            <text x="107.5" y="96" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Mark Word: Thread-ID</text>
          </g>

          {/* Lightweight State Box */}
          <g>
            <rect x="250" y="45" width="180" height="70" rx="6" ry="6" fill={state === 'LIGHTWEIGHT' ? 'rgba(45, 212, 191, 0.1)' : 'rgba(255,255,255,0.01)'} stroke={state === 'LIGHTWEIGHT' ? '#2dd4bf' : 'rgba(255,255,255,0.05)'} strokeWidth={state === 'LIGHTWEIGHT' ? 2 : 1} />
            <text x="340" y="70" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: state === 'LIGHTWEIGHT' ? '#2dd4bf' : '#475569', textAnchor: 'middle' }}>Lightweight Locking</text>
            <rect x="270" y="83" width="140" height="20" rx="3" ry="3" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.05)" />
            <text x="340" y="96" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Mark: Stack Record Ptr</text>
          </g>

          {/* Heavyweight State Box */}
          <g>
            <rect x="490" y="45" width="165" height="70" rx="6" ry="6" fill={state === 'HEAVYWEIGHT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.01)'} stroke={state === 'HEAVYWEIGHT' ? '#f87171' : 'rgba(255,255,255,0.05)'} strokeWidth={state === 'HEAVYWEIGHT' ? 2 : 1} />
            <text x="572.5" y="70" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: state === 'HEAVYWEIGHT' ? '#f87171' : '#475569', textAnchor: 'middle' }}>Heavyweight Locking</text>
            <rect x="510" y="83" width="125" height="20" rx="3" ry="3" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.05)" />
            <text x="572.5" y="96" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Mark: Monitor Object Ptr</text>
          </g>

          {/* Transition Paths */}
          <g>
            <path id="path-trans-1" d="M 190 80 L 244 80" fill="none" stroke={state === 'LIGHTWEIGHT' ? '#2dd4bf' : '#2e354f'} strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className={state === 'LIGHTWEIGHT' ? 'interactive-diagram-flowing-path' : ''} />
            {state === 'LIGHTWEIGHT' && <circle r="2.5" fill="#2dd4bf"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-trans-1" /></animateMotion></circle>}

            <path id="path-trans-2" d="M 430 80 L 484 80" fill="none" stroke={state === 'HEAVYWEIGHT' ? '#f87171' : '#2e354f'} strokeWidth="1.5" markerEnd="url(#arrow-red)" className={state === 'HEAVYWEIGHT' ? 'interactive-diagram-flowing-path' : ''} />
            {state === 'HEAVYWEIGHT' && <circle r="2.5" fill="#f87171"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-trans-2" /></animateMotion></circle>}
          </g>

          {/* Bottom Labels */}
          <text x="107.5" y="135" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>No Contention</text>
          <text x="340" y="135" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>Brief / Low Contention</text>
          <text x="572.5" y="135" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>Sustained Contention</text>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        state === 'BIASED' ? 'details-purple' : state === 'LIGHTWEIGHT' ? 'details-cyan' : 'details-red'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            state === 'BIASED' ? 'card-indicator-purple' : state === 'LIGHTWEIGHT' ? 'card-indicator-cyan' : 'card-indicator-red'
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Overhead:</strong> <span style={{ color: state === 'BIASED' ? '#a855f7' : state === 'LIGHTWEIGHT' ? '#2dd4bf' : '#f87171', fontWeight: 'bold' }}>{selectedData.overhead}</span></p>
        <p><strong>Contention Level:</strong> {selectedData.contention}</p>
        
        <ul>
          <li><strong>Processing Mechanics:</strong>
            <ul>
              {selectedData.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Toggle the tabs above to step through Biased, Lightweight, and Heavyweight lock escalation stages.
      </p>
    </div>
  );
}
