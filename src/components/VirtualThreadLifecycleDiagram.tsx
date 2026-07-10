import React, { useState } from 'react';

type StateKey = 'MOUNTED_PARSE' | 'UNMOUNTED_DB' | 'MOUNTED_PROCESS' | 'UNMOUNTED_HTTP' | 'CARRIER_THREAD';

interface StateDetails {
  title: string;
  type: 'green' | 'red' | 'cyan' | 'purple';
  status: string;
  carrierAction: string;
  explanation: string;
  keyPoints: string[];
}

const STATE_DATA: Record<StateKey, StateDetails> = {
  MOUNTED_PARSE: {
    title: 'Mounted State: Parse Request (VT#42)',
    type: 'green',
    status: 'Running (Mounted on Carrier Thread)',
    carrierAction: 'Executing VT#42 CPU instructions',
    explanation: 'The scheduler mounts Virtual Thread #42 onto an active Carrier Thread. The carrier executing thread starts executing the JVM bytecode.',
    keyPoints: [
      'Mounting copies the stack frames of VT#42 from the heap to the carrier thread\'s stack memory.',
      'During this time, Thread.currentThread() returns VT#42, not the carrier thread.'
    ]
  },
  UNMOUNTED_DB: {
    title: 'Unmounted State: Blocking DB Query (VT#42)',
    type: 'red',
    status: 'Yielded / Blocked (Unmounted from Carrier)',
    carrierAction: 'Serves VT#99 & VT#7 (Work-stealing)',
    explanation: 'VT#42 executes a database query which requires blocking network I/O. The JVM intercepts the blocking operation (via modified SocketImpl or NIO channels).',
    keyPoints: [
      'Instead of blocking the OS thread, the JVM yields the continuation of VT#42, copying its stack frames back to the heap.',
      'The Carrier Thread is instantly released to pick up other virtual threads from the scheduling queue.'
    ]
  },
  MOUNTED_PROCESS: {
    title: 'Mounted State: Process Result (VT#42)',
    type: 'green',
    status: 'Running (Resumed / Re-mounted)',
    carrierAction: 'Executing VT#42 parsing logic',
    explanation: 'The database response returns. The JVM wakes up VT#42 and adds it back to the ForkJoinPool scheduler queue.',
    keyPoints: [
      'An available Carrier Thread (could be a different physical OS thread!) dequeues VT#42, mounts it, and restores its stack frames.',
      'Execution resumes precisely where it yielded (continuations).'
    ]
  },
  UNMOUNTED_HTTP: {
    title: 'Unmounted State: Blocking HTTP Call (VT#42)',
    type: 'red',
    status: 'Yielded / Blocked (Unmounted from Carrier)',
    carrierAction: 'Serves VT#55 (Work-stealing)',
    explanation: 'VT#42 calls a remote HTTP service. The thread is unmounted again, allowing the OS carrier thread to remain 100% utilized.',
    keyPoints: [
      'Maximizes throughput — system handles millions of concurrent connections with just a few core OS threads.',
      'Once the HTTP client completes, the thread is rescheduled, mounted a final time, and terminates.'
    ]
  },
  CARRIER_THREAD: {
    title: 'Carrier Thread (OS Thread Pool)',
    type: 'purple',
    status: 'ForkJoinPool-1-worker-1 (Active)',
    carrierAction: 'Continuously work-steals virtual threads',
    explanation: 'A fixed-size pool of platform (OS) threads dedicated to executing virtual threads.',
    keyPoints: [
      'Size defaults to the number of available CPU processors.',
      'Uses work-stealing queues to balance processing loads dynamically.',
      'Never blocks on Virtual Thread I/O operations.'
    ]
  }
};

export default function VirtualThreadLifecycleDiagram(): React.JSX.Element {
  const [activeState, setActiveState] = useState<StateKey>('MOUNTED_PARSE');

  const selectedData = STATE_DATA[activeState];

  const getStroke = (key: StateKey) => {
    if (activeState === key) {
      return STATE_DATA[key].type === 'green' ? '#4ade80' : STATE_DATA[key].type === 'red' ? '#f87171' : STATE_DATA[key].type === 'cyan' ? '#2dd4bf' : '#a855f7';
    }
    return STATE_DATA[key].type === 'green' ? '#15803d' : STATE_DATA[key].type === 'red' ? '#991b1b' : STATE_DATA[key].type === 'cyan' ? '#0891b2' : '#6b21a8';
  };

  const getFill = (key: StateKey) => {
    if (activeState === key) {
      return STATE_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : STATE_DATA[key].type === 'red' ? 'rgba(239, 68, 68, 0.15)' : STATE_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(168, 85, 247, 0.15)';
    }
    return STATE_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : STATE_DATA[key].type === 'red' ? 'rgba(127, 29, 29, 0.05)' : STATE_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : 'rgba(30, 27, 75, 0.05)';
  };

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 230" className="interactive-diagram-svg">
          <defs>
            <marker
              id="arrow-down-green"
              viewBox="0 0 10 10"
              refX="5"
              refY="6"
              markerWidth="5"
              markerHeight="5"
              orient="90"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
            </marker>
            <marker
              id="arrow-up-green"
              viewBox="0 0 10 10"
              refX="5"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="270"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
            </marker>
            <marker
              id="arrow-gray"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2e354f" />
            </marker>
          </defs>

          {/* Virtual Thread #42 Timeline */}
          <text x="20" y="30" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#2dd4bf' }}>Virtual Thread #42 Tasks:</text>
          
          {/* Step 1: Parse (Mounted) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveState('MOUNTED_PARSE')}>
            <rect
              x="20"
              y="40"
              width="135"
              height="45"
              rx="6"
              ry="6"
              fill={getFill('MOUNTED_PARSE')}
              stroke={getStroke('MOUNTED_PARSE')}
              strokeWidth={activeState === 'MOUNTED_PARSE' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="87" y="62" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>1. Parse Request</text>
            <text x="87" y="75" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#4ade80', textAnchor: 'middle' }}>[Mounted]</text>
          </g>

          {/* Step 2: DB Query (Yielded) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveState('UNMOUNTED_DB')}>
            <rect
              x="180"
              y="40"
              width="135"
              height="45"
              rx="6"
              ry="6"
              fill={getFill('UNMOUNTED_DB')}
              stroke={getStroke('UNMOUNTED_DB')}
              strokeWidth={activeState === 'UNMOUNTED_DB' ? '2.5' : '1.5'}
              strokeDasharray={activeState === 'UNMOUNTED_DB' ? 'none' : '4 4'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="247" y="62" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>2. DB Query I/O</text>
            <text x="247" y="75" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#f87171', textAnchor: 'middle' }}>[Yielded to Heap]</text>
          </g>

          {/* Step 3: Process (Mounted) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveState('MOUNTED_PROCESS')}>
            <rect
              x="340"
              y="40"
              width="135"
              height="45"
              rx="6"
              ry="6"
              fill={getFill('MOUNTED_PROCESS')}
              stroke={getStroke('MOUNTED_PROCESS')}
              strokeWidth={activeState === 'MOUNTED_PROCESS' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="407" y="62" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>3. Process Result</text>
            <text x="407" y="75" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#4ade80', textAnchor: 'middle' }}>[Mounted]</text>
          </g>

          {/* Step 4: HTTP (Yielded) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveState('UNMOUNTED_HTTP')}>
            <rect
              x="500"
              y="40"
              width="145"
              height="45"
              rx="6"
              ry="6"
              fill={getFill('UNMOUNTED_HTTP')}
              stroke={getStroke('UNMOUNTED_HTTP')}
              strokeWidth={activeState === 'UNMOUNTED_HTTP' ? '2.5' : '1.5'}
              strokeDasharray={activeState === 'UNMOUNTED_HTTP' ? 'none' : '4 4'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="572" y="62" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>4. HTTP Calling</text>
            <text x="572" y="75" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#f87171', textAnchor: 'middle' }}>[Yielded to Heap]</text>
          </g>

          {/* Carrier Thread (OS Scheduler) */}
          <text x="20" y="125" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#a855f7' }}>Carrier Thread timeline (ForkJoinPool worker):</text>
          
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveState('CARRIER_THREAD')}>
            <rect x="20" y="135" width="625" height="50" fill="rgba(168, 85, 247, 0.04)" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1.5" rx="6" ry="6" />
            
            {/* Task VT#42 (Parse) */}
            <rect x="30" y="142" width="90" height="35" rx="4" ry="4" fill="rgba(74, 222, 128, 0.1)" stroke={activeState === 'MOUNTED_PARSE' ? '#4ade80' : '#15803d'} strokeWidth={activeState === 'MOUNTED_PARSE' ? '2' : '1'} />
            <text x="75" y="163" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>VT#42 (Parse)</text>

            {/* Task VT#99 */}
            <rect x="130" y="142" width="90" height="35" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#0891b2" strokeWidth="1" />
            <text x="175" y="163" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#cbd5e1', textAnchor: 'middle' }}>VT#99 (DB)</text>

            {/* Task VT#7 */}
            <rect x="230" y="142" width="90" height="35" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#0891b2" strokeWidth="1" />
            <text x="275" y="163" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#cbd5e1', textAnchor: 'middle' }}>VT#7 (Auth)</text>

            {/* Task VT#42 (Process) */}
            <rect x="330" y="142" width="90" height="35" rx="4" ry="4" fill="rgba(74, 222, 128, 0.1)" stroke={activeState === 'MOUNTED_PROCESS' ? '#4ade80' : '#15803d'} strokeWidth={activeState === 'MOUNTED_PROCESS' ? '2' : '1'} />
            <text x="375" y="163" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>VT#42 (Proc)</text>

            {/* Task VT#55 */}
            <rect x="430" y="142" width="90" height="35" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#0891b2" strokeWidth="1" />
            <text x="475" y="163" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#cbd5e1', textAnchor: 'middle' }}>VT#55 (API)</text>

            {/* Task VT#42 (Serialize) */}
            <rect x="530" y="142" width="105" height="35" rx="4" ry="4" fill="rgba(74, 222, 128, 0.1)" stroke="#15803d" strokeWidth="1" />
            <text x="582" y="163" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>VT#42 (Serial)</text>
          </g>

          {/* MOUNT/UNMOUNT SCHEDULING FLOW LINES */}
          {activeState === 'MOUNTED_PARSE' && (
            <g>
              <path
                id="path-mount-parse"
                d="M 75 85 L 75 136"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2.5"
                markerEnd="url(#arrow-down-green)"
                strokeDasharray="4 4"
                className="interactive-diagram-flowing-path"
              />
              <circle r="3" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-mount-parse" />
                </animateMotion>
              </circle>
            </g>
          )}
          {activeState === 'MOUNTED_PROCESS' && (
            <g>
              <path
                id="path-unmount-process"
                d="M 375 135 L 375 91"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2.5"
                markerEnd="url(#arrow-up-green)"
                strokeDasharray="4 4"
                className="interactive-diagram-flowing-path"
              />
              <circle r="3" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-unmount-process" />
                </animateMotion>
              </circle>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'red' ? 'details-red' : 'details-purple'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'green' ? 'card-indicator-green' : selectedData.type === 'red' ? 'card-indicator-red' : 'card-indicator-purple'
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Status:</strong> <span style={{ fontWeight: 'bold' }}>{selectedData.status}</span></p>
        <p><strong>Carrier Thread Action:</strong> {selectedData.carrierAction}</p>
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
        💡 Click on VT#42 task steps (Parse, DB Query, Process, HTTP) or the Carrier Thread timeline to see scheduling mount/unmount flows.
      </p>
    </div>
  );
}
