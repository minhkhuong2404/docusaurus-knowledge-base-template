import React, { useState } from 'react';

type DeadlockStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface StepInfo {
  title: string;
  desc: string;
  isDeadlocked: boolean;
}

const STEPS_DATA: Record<DeadlockStep, StepInfo> = {
  1: {
    title: 'Step 1: 200 Requests Arrive',
    desc: 'Tomcat accepts all requests into its network buffers. The first 10 worker threads instantly start executing.',
    isDeadlocked: false
  },
  2: {
    title: 'Step 2: Borrow 10 Connections',
    desc: 'Threads 1–10 query the HikariCP pool and successfully checkout all 10 available database connections.',
    isDeadlocked: false
  },
  3: {
    title: 'Step 3: Queue Remaining Threads',
    desc: 'Tomcat threads 11–200 try to borrow connections, but find the pool empty. They block and wait on the handoff queue (up to 30s connection-timeout).',
    isDeadlocked: false
  },
  4: {
    title: 'Step 4: Thread 1 Invokes Sub-Request',
    desc: 'While holding connection C1, Thread 1 makes an HTTP REST call to an internal utility endpoint /api/helper to complete its task.',
    isDeadlocked: false
  },
  5: {
    title: 'Step 5: Sub-Request Needs Connection',
    desc: 'The /api/helper request hits Tomcat. It is mapped to a worker thread, which immediately attempts to checkout a database connection to query helper tables.',
    isDeadlocked: false
  },
  6: {
    title: 'Step 6: Sub-Request Blocked',
    desc: 'Since all 10 connections are held by active threads (Threads 1-10), the sub-request thread is blocked, waiting for a connection.',
    isDeadlocked: true
  },
  7: {
    title: 'Step 7: Thread 1 Suspended',
    desc: 'Thread 1 is blocked waiting for the /api/helper HTTP call to return. Because it is waiting, it cannot proceed and therefore cannot release connection C1.',
    isDeadlocked: true
  },
  8: {
    title: 'Step 8: Circular Deadlock!',
    desc: 'Deadlock: Thread 1 is holding C1 and waiting for /api/helper. /api/helper is waiting for C1 (or any connection) to be returned. Circular dependency prevents all progress.',
    isDeadlocked: true
  }
};

export default function MismatchDeadlockDiagram(): React.JSX.Element {
  const [step, setStep] = useState<DeadlockStep>(1);

  const current = STEPS_DATA[step];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Controls */}
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
            className="interactive-diagram-indicator-dot card-indicator-red" 
            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f87171' }}
          />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🚫</span>
            <span style={{ color: '#f87171' }}>Deadlock Simulator: {current.title}</span>
          </h3>
        </div>

        {/* Stepper buttons */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button 
            disabled={step === 1}
            onClick={() => setStep(prev => (prev - 1) as DeadlockStep)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              color: step === 1 ? '#475569' : '#ffffff',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              padding: '2px 8px',
              fontSize: '0.8rem'
            }}
          >
            ◀ Back
          </button>
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1', width: '80px', textAlign: 'center' }}>
            Step {step} of 8
          </span>
          <button 
            disabled={step === 8}
            onClick={() => setStep(prev => (prev + 1) as DeadlockStep)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              color: step === 8 ? '#475569' : '#ffffff',
              cursor: step === 8 ? 'not-allowed' : 'pointer',
              padding: '2px 8px',
              fontSize: '0.8rem'
            }}
          >
            Next ▶
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
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

          {/* Tomcat Thread Pool Box */}
          <rect x="30" y="30" width="180" height="120" rx="6" ry="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
          <text x="120" y="50" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Tomcat Worker Threads</text>
          
          <rect x="45" y="65" width="70" height="35" rx="4" ry="4" fill={step >= 2 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)'} stroke={step >= 2 ? '#f87171' : 'rgba(255,255,255,0.06)'} />
          <text x="80" y="86" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: step >= 2 ? '#f87171' : '#cbd5e1', textAnchor: 'middle' }}>Thread 1</text>

          <rect x="125" y="65" width="70" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
          <text x="160" y="86" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Threads 2-10</text>

          <rect x="45" y="110" width="150" height="30" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
          <text x="120" y="128" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#94a3b8', textAnchor: 'middle' }}>Threads 11-200 (Blocked)</text>

          {/* HikariCP Connection Pool Box */}
          <rect x="470" y="30" width="180" height="120" rx="6" ry="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
          <text x="560" y="50" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>HikariCP Connection Pool</text>

          <rect x="485" y="65" width="150" height="35" rx="4" ry="4" fill={step >= 2 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)'} stroke={step >= 2 ? '#f87171' : 'rgba(255,255,255,0.06)'} />
          <text x="560" y="86" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: step >= 2 ? '#f87171' : '#cbd5e1', textAnchor: 'middle' }}>10 Checked-Out Conns</text>

          <rect x="485" y="110" width="150" height="30" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
          <text x="560" y="128" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#94a3b8', textAnchor: 'middle' }}>Remaining: 0 Available</text>

          {/* Deadlock loop lines */}
          {step >= 4 && (
            <g>
              {/* Thread 1 calling sub-request */}
              <path id="dl-call" d="M 120 75 Q 340 10 340 60" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 3" />
              <text x="340" y="45" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#fbbf24', textAnchor: 'middle' }}>Calls /api/helper</text>
            </g>
          )}

          {step >= 5 && (
            <g>
              {/* Sub request arriving on helper thread */}
              <rect x="290" y="60" width="100" height="40" rx="4" ry="4" fill="rgba(239,68,68,0.1)" stroke="#f87171" strokeWidth="1.5" />
              <text x="340" y="80" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#ffffff', textAnchor: 'middle' }}>Helper Request</text>
              <text x="340" y="93" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 6.5, fill: '#fbbf24', textAnchor: 'middle' }}>Needs DB Connection</text>
            </g>
          )}

          {step >= 6 && (
            <g>
              {/* Sub-request querying DB and blocking */}
              <path id="dl-query" d="M 390 80 L 464 80" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#arrow-red)" />
              <text x="427" y="73" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#f87171', textAnchor: 'middle' }}>BLOCKED</text>
            </g>
          )}

          {step >= 8 && (
            <g>
              {/* Circular block line */}
              <path d="M 485 82 Q 340 130 115 85" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-red)" />
              <text x="280" y="145" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#f87171', textAnchor: 'middle' }}>⚠️ CIRCULAR WAIT DEADLOCK</text>
            </g>
          )}
        </svg>
      </div>

      {/* Description Card */}
      <div 
        className="interactive-diagram-details-card"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${current.isDeadlocked ? '#f87171' : 'rgba(255, 255, 255, 0.05)'}`,
          borderRadius: '8px',
          padding: '12px 16px'
        }}
      >
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: current.isDeadlocked ? '#f87171' : '#ffffff' }}>
          {current.title}
        </h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#cbd5e1' }}>{current.desc}</p>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Step through the simulator using the controls above to understand how sub-requests cause starvation deadlocks.
      </p>
    </div>
  );
}
