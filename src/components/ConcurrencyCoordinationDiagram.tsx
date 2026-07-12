import React, { useState } from 'react';

type CoordTab = 'LATCH' | 'BARRIER' | 'SEMAPHORE' | 'EXCHANGER';

interface CoordDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'yellow';
  overview: string;
  bullets: string[];
}

const COORD_DATA: Record<CoordTab, CoordDetails> = {
  LATCH: {
    title: 'CountDownLatch (One-Shot Countdown)',
    type: 'purple',
    overview: 'A one-time gate. Coordinating thread waits at await() until the latch counter reaches 0.',
    bullets: [
      'Worker threads perform tasks independently and decrement count via countDown().',
      'The counting is unidirectional: once it hits 0, the latch remains open and cannot be reset.',
      'Perfect for coordinating app startup tasks, waiting for parallel data loads to complete, or boot sequences.'
    ]
  },
  BARRIER: {
    title: 'CyclicBarrier (Reusable Rendezvous Point)',
    type: 'cyan',
    overview: 'N threads must rendezvous at the barrier. When the last thread arrives, all are released together.',
    bullets: [
      'Unlike CountDownLatch, CyclicBarrier automatically resets back to its initial count after releasing threads.',
      'A configured optional barrier action runs once on the arriving thread before releasing the rest.',
      'Ideal for parallel algorithms (e.g. matrix multiplication, generation steps) that execute in cyclic phases.'
    ]
  },
  SEMAPHORE: {
    title: 'Semaphore (Resource Pool Controller)',
    type: 'green',
    overview: 'Controls concurrent access to a finite pool of resources using a set number of permits.',
    bullets: [
      'acquire() decrements the permit count. If zero, caller blocks in FIFO queue.',
      'release() increments the permit count and wakes up the next queued waiting thread.',
      'Used for connection throttling, rate-limiting, and managing shared hardware access.'
    ]
  },
  EXCHANGER: {
    title: 'Exchanger (Bidirectional Buffer Swap)',
    type: 'yellow',
    overview: 'A meeting point where exactly two threads atomically swap references to objects.',
    bullets: [
      'Each thread calls exchange() and blocks until its partner thread arrives.',
      'Both threads swap objects and resume execution with their new buffers.',
      'Commonly applied in producer-consumer pipelines using double-buffering to eliminate idle processing gaps.'
    ]
  }
};

export default function ConcurrencyCoordinationDiagram({ defaultTab = 'LATCH' }: { defaultTab?: CoordTab }): React.JSX.Element {
  const [tab, setTab] = useState<CoordTab>(defaultTab);

  // Latch State
  const [latchCount, setLatchCount] = useState<number>(3);

  // Barrier State
  const [barrierArrived, setBarrierArrived] = useState<number>(0);

  // Semaphore State
  const [permits, setPermits] = useState<number>(3);
  const [blockedSemCount, setBlockedSemCount] = useState<number>(0);

  // Exchanger State
  const [exchangeState, setExchangeState] = useState<'IDLE' | 'ARRIVED_1' | 'EXCHANGED'>('IDLE');

  const selectedData = COORD_DATA[tab];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Tab Selectors */}
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
          
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡</span>
            <span style={{ color: tab === 'LATCH' ? '#a855f7' : tab === 'BARRIER' ? '#2dd4bf' : tab === 'SEMAPHORE' ? '#4ade80' : '#fbbf24' }}>
              Coordination: {tab === 'LATCH' ? 'CountDownLatch' : tab === 'BARRIER' ? 'CyclicBarrier' : tab === 'SEMAPHORE' ? 'Semaphore' : 'Exchanger'}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setTab('LATCH')} style={{ background: tab === 'LATCH' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: tab === 'LATCH' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: tab === 'LATCH' ? '#a855f7' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Latch</button>
          <button onClick={() => setTab('BARRIER')} style={{ background: tab === 'BARRIER' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: tab === 'BARRIER' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: tab === 'BARRIER' ? '#2dd4bf' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Barrier</button>
          <button onClick={() => setTab('SEMAPHORE')} style={{ background: tab === 'SEMAPHORE' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: tab === 'SEMAPHORE' ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: tab === 'SEMAPHORE' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Semaphore</button>
          <button onClick={() => setTab('EXCHANGER')} style={{ background: tab === 'EXCHANGER' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: tab === 'EXCHANGER' ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: tab === 'EXCHANGER' ? '#fbbf24' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Exchanger</button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" /></marker>
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" /></marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" /></marker>
          </defs>

          {tab === 'LATCH' && (
            /* COUNTDOWN LATCH */
            <g>
              <foreignObject x="250" y="10" width="200" height="30">
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button disabled={latchCount === 0} onClick={() => setLatchCount(prev => Math.max(prev - 1, 0))} style={{ background: latchCount === 0 ? 'rgba(255,255,255,0.05)' : '#a855f7', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem' }}>countDown()</button>
                  <button onClick={() => setLatchCount(3)} style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem' }}>Reset</button>
                </div>
              </foreignObject>

              {/* Countdown Gate */}
              <g>
                <rect x="290" y="60" width="100" height="60" rx="6" ry="6" fill={latchCount === 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.08)'} stroke={latchCount === 0 ? '#4ade80' : '#f87171'} strokeWidth="2" />
                <text x="340" y="90" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Latch Gate</text>
                <text x="340" y="105" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 13, fill: latchCount === 0 ? '#4ade80' : '#f87171', textAnchor: 'middle' }}>
                  Count: {latchCount}
                </text>
              </g>

              {/* Workers */}
              <text x="80" y="65" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#c084fc' }}>Workers (Task Active)</text>
              <line x1="50" y1="90" x2="275" y2="90" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" strokeDasharray={latchCount === 0 ? 'none' : '3 3'} />
              
              {/* Coordinator */}
              <rect x="520" y="65" width="110" height="50" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke={latchCount === 0 ? '#4ade80' : '#94a3b8'} strokeWidth="1.5" />
              <text x="575" y="90" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Main Thread</text>
              <text x="575" y="103" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: latchCount === 0 ? '#4ade80' : '#f87171', textAnchor: 'middle' }}>
                {latchCount === 0 ? '🔓 Released' : '🔒 await() Blocked'}
              </text>

              <path d="M 400 90 L 505 90" fill="none" stroke={latchCount === 0 ? '#4ade80' : '#2e354f'} strokeWidth="1.5" markerEnd={latchCount === 0 ? 'url(#arrow-green)' : 'url(#arrow-purple)'} />
            </g>
          )}

          {tab === 'BARRIER' && (
            /* CYCLIC BARRIER */
            <g>
              <foreignObject x="250" y="10" width="200" height="30">
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button disabled={barrierArrived === 3} onClick={() => setBarrierArrived(prev => Math.min(prev + 1, 3))} style={{ background: barrierArrived === 3 ? 'rgba(255,255,255,0.05)' : '#2dd4bf', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Arrive Thread</button>
                  <button onClick={() => setBarrierArrived(0)} style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem' }}>Reset</button>
                </div>
              </foreignObject>

              {/* Barrier node */}
              <rect x="290" y="55" width="100" height="70" rx="6" ry="6" fill={barrierArrived === 3 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(45, 212, 191, 0.08)'} stroke={barrierArrived === 3 ? '#4ade80' : '#2dd4bf'} strokeWidth="2" />
              <text x="340" y="80" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>CyclicBarrier</text>
              <text x="340" y="95" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#cbd5e1', textAnchor: 'middle' }}>Arrived: {barrierArrived}/3</text>
              <text x="340" y="112" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 6.5, fill: barrierArrived === 3 ? '#4ade80' : '#94a3b8', textAnchor: 'middle' }}>
                {barrierArrived === 3 ? '🎉 Action Runs' : 'Waiting...'}
              </text>

              {/* Thread nodes */}
              <g>
                <rect x="30" y="45" width="100" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke={barrierArrived >= 1 ? '#2dd4bf' : 'rgba(255,255,255,0.05)'} />
                <text x="80" y="60" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Thread 1</text>
                <path d="M 130 57 L 275 80" fill="none" stroke={barrierArrived >= 1 ? '#2dd4bf' : '#2e354f'} strokeWidth="1" />

                <rect x="30" y="78" width="100" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke={barrierArrived >= 2 ? '#2dd4bf' : 'rgba(255,255,255,0.05)'} />
                <text x="80" y="93" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Thread 2</text>
                <path d="M 130 90 L 275 90" fill="none" stroke={barrierArrived >= 2 ? '#2dd4bf' : '#2e354f'} strokeWidth="1" />

                <rect x="30" y="110" width="100" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke={barrierArrived >= 3 ? '#2dd4bf' : 'rgba(255,255,255,0.05)'} />
                <text x="80" y="125" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Thread 3</text>
                <path d="M 130 122 L 275 100" fill="none" stroke={barrierArrived >= 3 ? '#2dd4bf' : '#2e354f'} strokeWidth="1" />
              </g>

              {/* Release vectors */}
              <g>
                <path d="M 400 90 L 515 90" fill="none" stroke={barrierArrived === 3 ? '#4ade80' : '#2e354f'} strokeWidth="1.5" markerEnd={barrierArrived === 3 ? 'url(#arrow-green)' : 'url(#arrow-cyan)'} />
                <rect x="530" y="65" width="115" height="50" rx="4" ry="4" fill="none" stroke={barrierArrived === 3 ? '#4ade80' : 'rgba(255,255,255,0.05)'} />
                <text x="587.5" y="95" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: barrierArrived === 3 ? '#4ade80' : '#475569', textAnchor: 'middle' }}>
                  {barrierArrived === 3 ? '🚀 All Released!' : 'Ready'}
                </text>
              </g>
            </g>
          )}

          {tab === 'SEMAPHORE' && (
            /* SEMAPHORE Perm Pool */
            <g>
              <foreignObject x="250" y="10" width="200" height="30">
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => {
                    if (permits > 0) {
                      setPermits(prev => prev - 1);
                    } else {
                      setBlockedSemCount(prev => prev + 1);
                    }
                  }} style={{ background: '#4ade80', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>acquire()</button>
                  <button onClick={() => {
                    if (blockedSemCount > 0) {
                      setBlockedSemCount(prev => prev - 1);
                    } else {
                      setPermits(prev => Math.min(prev + 1, 3));
                    }
                  }} style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem' }}>release()</button>
                </div>
              </foreignObject>

              {/* Permit Pool */}
              <g>
                <rect x="240" y="55" width="200" height="70" rx="6" ry="6" fill="rgba(74, 222, 128, 0.05)" stroke="#4ade80" strokeWidth="1.5" />
                <text x="340" y="75" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Semaphore Permits Pool</text>
                
                {/* Perm circles */}
                <g transform="translate(290, 85)">
                  <circle cx="15" cy="15" r="10" fill={permits >= 1 ? '#4ade80' : 'rgba(255,255,255,0.05)'} />
                  <circle cx="50" cy="15" r="10" fill={permits >= 2 ? '#4ade80' : 'rgba(255,255,255,0.05)'} />
                  <circle cx="85" cy="15" r="10" fill={permits >= 3 ? '#4ade80' : 'rgba(255,255,255,0.05)'} />
                </g>
              </g>

              {/* Waiting queue */}
              <g>
                <rect x="490" y="55" width="150" height="70" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
                <text x="565" y="75" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Wait List (Blocked)</text>
                <text x="565" y="100" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 12, fill: blockedSemCount > 0 ? '#f87171' : '#475569', textAnchor: 'middle' }}>
                  {blockedSemCount} Threads Waiting
                </text>
              </g>
            </g>
          )}

          {tab === 'EXCHANGER' && (
            /* EXCHANGER SWAP */
            <g>
              <foreignObject x="250" y="10" width="200" height="30">
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => {
                    if (exchangeState === 'IDLE') setExchangeState('ARRIVED_1');
                    else if (exchangeState === 'ARRIVED_1') setExchangeState('EXCHANGED');
                  }} style={{ background: '#fbbf24', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {exchangeState === 'IDLE' ? 'Arrive Producer' : exchangeState === 'ARRIVED_1' ? 'Arrive Consumer' : 'Complete'}
                  </button>
                  <button onClick={() => setExchangeState('IDLE')} style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem' }}>Reset</button>
                </div>
              </foreignObject>

              {/* Producer thread */}
              <g>
                <rect x="40" y="50" width="160" height="80" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="120" y="70" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>Producer Thread</text>
                <rect x="55" y="85" width="130" height="30" rx="3" ry="3" fill="rgba(251, 191, 36, 0.1)" stroke="#fbbf24" />
                <text x="120" y="103" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#fcd34d', textAnchor: 'middle' }}>
                  {exchangeState === 'EXCHANGED' ? 'Empty Buffer' : 'Full Buffer (A)'}
                </text>
              </g>

              {/* Exchanger point */}
              <g transform="translate(290, 65)">
                <circle cx="25" cy="25" r="25" fill="rgba(251, 191, 36, 0.05)" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 3" />
                <text x="25" y="29" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#fbbf24', textAnchor: 'middle' }}>⇄</text>
              </g>

              {/* Consumer thread */}
              <g>
                <rect x="440" y="50" width="160" height="80" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="520" y="70" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>Consumer Thread</text>
                <rect x="455" y="85" width="130" height="30" rx="3" ry="3" fill="rgba(74, 222, 128, 0.1)" stroke="#4ade80" />
                <text x="520" y="103" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#86efac', textAnchor: 'middle' }}>
                  {exchangeState === 'EXCHANGED' ? 'Full Buffer (A)' : 'Empty Buffer'}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        tab === 'LATCH' ? 'details-purple' : tab === 'BARRIER' ? 'details-cyan' : tab === 'SEMAPHORE' ? 'details-green' : 'details-yellow'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Overview:</strong> {selectedData.overview}</p>
        
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
        💡 Toggle between coordination tabs to check the lifecycle of different synchronization utilities.
      </p>
    </div>
  );
}
