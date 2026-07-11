import React, { useState } from 'react';

type AQSTab = 'STATE_ACQUIRE' | 'CLH_QUEUE' | 'UNPARK_SUCCESSOR';

interface AQSDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  overview: string;
  bullets: string[];
}

const AQS_DATA: Record<AQSTab, AQSDetails> = {
  STATE_ACQUIRE: {
    title: 'AQS Volatile State & CAS Acquisition',
    type: 'purple',
    overview: 'Acquiring a lock translates to an atomic CAS (Compare-And-Swap) operation on a single volatile integer.',
    bullets: [
      'volatile int state: Holds the synch status. 0 = free/unlocked. N > 0 = locked (and re-entry depth).',
      'CAS(0 -> 1): Thread A attempts to write 1 to state atomically. If successful, it claims ownership of the lock.',
      'Ownership tracking: The thread reference is saved in exclusiveOwnerThread for reentrancy checks.'
    ]
  },
  CLH_QUEUE: {
    title: 'CLH Queue: Park & Enqueue on Contention',
    type: 'cyan',
    overview: 'If CAS fails, the thread must block. AQS wraps it in a Node and enqueues it at the tail.',
    bullets: [
      'Double-linked FIFO queue: Nodes contain thread references and status flags (e.g. SIGNAL).',
      'CAS Tail Appending: Thread B uses CAS to point AQS tail to its new node, establishing head-to-tail links.',
      'LockSupport.park(): Once enqueued, the thread is suspended by the OS kernel, saving CPU cycles.'
    ]
  },
  UNPARK_SUCCESSOR: {
    title: 'Releasing the Lock: Unparking the Successor',
    type: 'green',
    overview: 'On release, AQS updates state and signals the head node successor thread.',
    bullets: [
      'State update: volatile state is decremented or reset back to 0.',
      'Locating successor: AQS inspects head.next to find the first blocked node.',
      'LockSupport.unpark(): The kernel wakes the successor thread to retry CAS(0 -> 1) acquisition.'
    ]
  }
};

export default function AQSArchitectureDiagram({ defaultTab = 'STATE_ACQUIRE' }: { defaultTab?: AQSTab }): React.JSX.Element {
  const [tab, setTab] = useState<AQSTab>(defaultTab);
  const [aqsState, setAqsState] = useState<number>(0);

  const selectedData = AQS_DATA[tab];

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
            tab === 'STATE_ACQUIRE' ? 'card-indicator-purple' : tab === 'CLH_QUEUE' ? 'card-indicator-cyan' : 'card-indicator-green'
          }`} />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🛠️</span>
            <span style={{ color: tab === 'STATE_ACQUIRE' ? '#a855f7' : tab === 'CLH_QUEUE' ? '#2dd4bf' : '#4ade80' }}>
              AQS: {tab === 'STATE_ACQUIRE' ? 'CAS State' : tab === 'CLH_QUEUE' ? 'CLH Queue' : 'Unpark Successor'}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setTab('STATE_ACQUIRE')}
            style={{
              background: tab === 'STATE_ACQUIRE' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'STATE_ACQUIRE' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'STATE_ACQUIRE' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            CAS State
          </button>
          <button 
            onClick={() => setTab('CLH_QUEUE')}
            style={{
              background: tab === 'CLH_QUEUE' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'CLH_QUEUE' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'CLH_QUEUE' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            CLH Queue
          </button>
          <button 
            onClick={() => setTab('UNPARK_SUCCESSOR')}
            style={{
              background: tab === 'UNPARK_SUCCESSOR' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'UNPARK_SUCCESSOR' ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'UNPARK_SUCCESSOR' ? '#4ade80' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            Unpark
          </button>
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

          {tab === 'STATE_ACQUIRE' && (
            /* STATE ACQUISITION FLOW */
            <g>
              <foreignObject x="250" y="10" width="200" height="30">
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => setAqsState(1)} style={{ background: '#a855f7', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem' }}>CAS(0 → 1)</button>
                  <button onClick={() => setAqsState(0)} style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem' }}>Release</button>
                </div>
              </foreignObject>

              {/* State box */}
              <g>
                <rect x="250" y="55" width="180" height="70" rx="6" ry="6" fill={aqsState === 1 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(74, 222, 128, 0.08)'} stroke={aqsState === 1 ? '#f87171' : '#4ade80'} strokeWidth="2" />
                <text x="340" y="78" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#cbd5e1', textAnchor: 'middle' }}>Volatile AQS State</text>
                <text x="340" y="105" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 18, fill: aqsState === 1 ? '#f87171' : '#4ade80', textAnchor: 'middle' }}>
                  {aqsState}
                </text>
              </g>

              {/* Thread A */}
              <g transform="translate(60, 60)">
                <rect width="120" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="#a855f7" />
                <text x="60" y="28" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Thread A</text>
                <text x="60" y="42" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#cbd5e1', textAnchor: 'middle' }}>ownerThread</text>
              </g>

              <path id="path-sa-1" d="M 180 90 L 244 90" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              {aqsState === 1 && <circle r="2.5" fill="#a855f7"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-sa-1" /></animateMotion></circle>}
            </g>
          )}

          {tab === 'CLH_QUEUE' && (
            /* CLH QUEUE ARCHITECTURE */
            <g>
              {/* Head node */}
              <g>
                <rect x="50" y="60" width="130" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
                <text x="115" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Head Node</text>
                <text x="115" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>[Thread: Dummy]</text>
              </g>

              {/* Node 1 */}
              <g>
                <rect x="270" y="60" width="140" height="60" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
                <text x="340" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Node 1</text>
                <text x="340" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#2dd4bf', textAnchor: 'middle' }}>[Thread: B (SIGNAL)]</text>
              </g>

              {/* Tail node */}
              <g>
                <rect x="490" y="60" width="130" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
                <text x="555" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Tail Node</text>
                <text x="555" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>[Thread: C (WAIT)]</text>
              </g>

              {/* Queue links */}
              <path d="M 180 82 L 264 82" fill="none" stroke="#2dd4bf" strokeWidth="1.2" markerEnd="url(#arrow-cyan)" />
              <path d="M 270 98 L 186 98" fill="none" stroke="#2dd4bf" strokeWidth="1.2" markerEnd="url(#arrow-cyan)" />

              <path d="M 410 82 L 484 82" fill="none" stroke="#2e354f" strokeWidth="1.2" />
              <path d="M 490 98 L 416 98" fill="none" stroke="#2e354f" strokeWidth="1.2" />
            </g>
          )}

          {tab === 'UNPARK_SUCCESSOR' && (
            /* UNPARKING SUCCESSOR FLOW */
            <g>
              {/* Head node */}
              <g>
                <rect x="50" y="60" width="130" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="#4ade80" strokeWidth="1.5" />
                <text x="115" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Released Head</text>
                <text x="115" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>[state = 0]</text>
              </g>

              {/* Successor Node 1 */}
              <g>
                <rect x="290" y="60" width="140" height="60" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke="#4ade80" strokeWidth="1.5" />
                <text x="360" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Successor Node</text>
                <text x="360" y="98" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: '#4ade80', textAnchor: 'middle' }}>[Thread B Wakes Up!]</text>
              </g>

              {/* Signal arrow */}
              <path id="path-us-1" d="M 180 90 L 284 90" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-us-1" /></animateMotion></circle>
              <text x="235" y="80" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 6.5, fill: '#4ade80', textAnchor: 'middle' }}>unpark()</text>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        tab === 'STATE_ACQUIRE' ? 'details-purple' : tab === 'CLH_QUEUE' ? 'details-cyan' : 'details-green'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            tab === 'STATE_ACQUIRE' ? 'card-indicator-purple' : tab === 'CLH_QUEUE' ? 'card-indicator-cyan' : 'card-indicator-green'
          }`} />
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
        💡 Toggle between CAS State, CLH Queue structure, and Unparking tabs to explore AbstractQueuedSynchronizer internals.
      </p>
    </div>
  );
}
