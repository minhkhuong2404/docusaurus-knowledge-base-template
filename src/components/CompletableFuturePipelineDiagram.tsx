import React, { useState } from 'react';

type StepKey = 'FETCH_USER' | 'FETCH_ORDERS' | 'COMBINE';

interface StepDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  threadPool: string;
  latencyCost: string;
  explanation: string;
  details: string[];
}

const STEP_DATA: Record<StepKey, StepDetails> = {
  FETCH_USER: {
    title: 'CompletableFuture.supplyAsync(fetchUserData)',
    type: 'purple',
    threadPool: 'ForkJoinPool.commonPool-worker-1 (or custom fixed pool)',
    latencyCost: '100ms (Simulated I/O Block)',
    explanation: 'Forks a background thread to fetch user database details asynchronously without blocking the main calling thread.',
    details: [
      'Task is submitted to an ExecutorService queue.',
      'Main thread instantly returns a pending CompletableFuture proxy reference.'
    ]
  },
  FETCH_ORDERS: {
    title: 'CompletableFuture.supplyAsync(fetchOrderHistory)',
    type: 'cyan',
    threadPool: 'ForkJoinPool.commonPool-worker-2 (or custom fixed pool)',
    latencyCost: '150ms (Simulated Network Block)',
    explanation: 'Concurrently forks another background thread to call the orders service database or API.',
    details: [
      'Runs concurrently alongside the Fetch User task.',
      'Utilizes a separate thread to achieve overlapping progress (Concurrency).'
    ]
  },
  COMBINE: {
    title: 'userFuture.thenCombine(ordersFuture, mergeDashboard)',
    type: 'green',
    threadPool: 'Executes on the worker thread that finishes last, or the main thread if both are ready',
    latencyCost: 'Instant (cpu calculation)',
    explanation: 'Monitors the completion state of both futures. Once BOTH results are successfully populated, compiles them into a new Dashboard domain instance.',
    details: [
      'Non-blocking: Neither thread sits spin-waiting. The combiner fires as a callback trigger.',
      'Combines results (User details + Order list) safely and cleanly.'
    ]
  }
};

export default function CompletableFuturePipelineDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<StepKey>('COMBINE');

  const selectedData = STEP_DATA[activeStep];

  const getStroke = (key: StepKey) => {
    if (activeStep === key) {
      return STEP_DATA[key].type === 'purple' ? '#a855f7' : STEP_DATA[key].type === 'cyan' ? '#2dd4bf' : '#4ade80';
    }
    return STEP_DATA[key].type === 'purple' ? '#6b21a8' : STEP_DATA[key].type === 'cyan' ? '#0891b2' : '#15803d';
  };

  const getFill = (key: StepKey) => {
    if (activeStep === key) {
      return STEP_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : STEP_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(74, 222, 128, 0.15)';
    }
    return STEP_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : STEP_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : 'rgba(20, 83, 45, 0.05)';
  };

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 230" className="interactive-diagram-svg">
          <defs>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
            </marker>
            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
            </marker>
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
            </marker>
          </defs>

          {/* Fetch User Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('FETCH_USER')}>
            <rect
              x="40"
              y="30"
              width="200"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('FETCH_USER')}
              stroke={getStroke('FETCH_USER')}
              strokeWidth={activeStep === 'FETCH_USER' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeStep === 'FETCH_USER' && (
              <circle cx="230" cy="42" r="4.5" fill="#a855f7" className="interactive-diagram-pulse-dot" />
            )}
            <text x="140" y="58" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Fetch User Data</text>
            <text x="140" y="74" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#a855f7', textAnchor: 'middle' }}>CompletableFuture.supplyAsync()</text>
          </g>

          {/* Fetch Orders Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('FETCH_ORDERS')}>
            <rect
              x="40"
              y="130"
              width="200"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('FETCH_ORDERS')}
              stroke={getStroke('FETCH_ORDERS')}
              strokeWidth={activeStep === 'FETCH_ORDERS' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeStep === 'FETCH_ORDERS' && (
              <circle cx="230" cy="142" r="4.5" fill="#2dd4bf" className="interactive-diagram-pulse-dot" />
            )}
            <text x="140" y="158" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Fetch Order History</text>
            <text x="140" y="174" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#2dd4bf', textAnchor: 'middle' }}>CompletableFuture.supplyAsync()</text>
          </g>

          {/* Combined Dashboard Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('COMBINE')}>
            <rect
              x="420"
              y="75"
              width="210"
              height="70"
              rx="8"
              ry="8"
              fill={getFill('COMBINE')}
              stroke={getStroke('COMBINE')}
              strokeWidth={activeStep === 'COMBINE' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeStep === 'COMBINE' && (
              <circle cx="615" cy="87" r="4.5" fill="#4ade80" className="interactive-diagram-pulse-dot" />
            )}
            <text x="525" y="105" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Dashboard Instance</text>
            <text x="525" y="122" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>thenCombine(user, orders)</text>
            <text x="525" y="134" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#4ade80', textAnchor: 'middle' }}>[Trigger Callback]</text>
          </g>

          {/* CONNECTOR PATHS */}
          {/* User -> Combine */}
          <g>
            <path
              id="path-user-combine"
              d="M 240 60 L 420 100"
              fill="none"
              stroke={activeStep === 'FETCH_USER' || activeStep === 'COMBINE' ? '#a855f7' : '#2e354f'}
              strokeWidth={activeStep === 'FETCH_USER' || activeStep === 'COMBINE' ? '2.5' : '1.5'}
              markerEnd={activeStep === 'FETCH_USER' || activeStep === 'COMBINE' ? 'url(#arrow-purple)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'FETCH_USER' || activeStep === 'COMBINE' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeStep === 'FETCH_USER' || activeStep === 'COMBINE') && (
              <circle r="3" fill="#a855f7" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-user-combine" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Orders -> Combine */}
          <g>
            <path
              id="path-orders-combine"
              d="M 240 160 L 420 120"
              fill="none"
              stroke={activeStep === 'FETCH_ORDERS' || activeStep === 'COMBINE' ? '#2dd4bf' : '#2e354f'}
              strokeWidth={activeStep === 'FETCH_ORDERS' || activeStep === 'COMBINE' ? '2.5' : '1.5'}
              markerEnd={activeStep === 'FETCH_ORDERS' || activeStep === 'COMBINE' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'FETCH_ORDERS' || activeStep === 'COMBINE' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeStep === 'FETCH_ORDERS' || activeStep === 'COMBINE') && (
              <circle r="3" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-orders-combine" />
                </animateMotion>
              </circle>
            )}
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'green' ? 'card-indicator-green' : selectedData.type === 'purple' ? 'card-indicator-purple' : selectedData.type === 'cyan' ? 'card-indicator-cyan' : ''
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Running Thread / Pool:</strong> {selectedData.threadPool}</p>
        <p><strong>Latency Cost:</strong> <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{selectedData.latencyCost}</span></p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Pipeline Details:</strong>
            <ul>
              {selectedData.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on Fetch User Data, Fetch Order History, or the combined Dashboard Node above to inspect the CompletableFuture assembly pipeline.
      </p>
    </div>
  );
}
