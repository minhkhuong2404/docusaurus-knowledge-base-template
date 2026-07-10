import React, { useState } from 'react';

type StepKey = 'SUBMISSION' | 'CORE_CHECK' | 'QUEUE_CHECK' | 'MAX_CHECK' | 'REJECTED';

interface StepDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'yellow' | 'red';
  action: string;
  explanation: string;
  keyPoints: string[];
}

const STEP_DATA: Record<StepKey, StepDetails> = {
  SUBMISSION: {
    title: '1. Task Submission',
    type: 'purple',
    action: 'executor.execute(Runnable task) invoked',
    explanation: 'A client thread submits a new Runnable task to the ThreadPoolExecutor instance.',
    keyPoints: [
      'Checks the pool state to verify if the executor is active (RUNNING).',
      'Determines the current active thread count relative to corePoolSize.'
    ]
  },
  CORE_CHECK: {
    title: '2. Core Pool Boundary Check',
    type: 'cyan',
    action: 'Compare active threads with corePoolSize',
    explanation: 'If the number of running worker threads is less than corePoolSize, the executor always spawns a new core worker thread to run this task.',
    keyPoints: [
      'Spawns a new core thread even if other core threads are currently sitting idle.',
      'If active threads >= corePoolSize, bypasses thread creation and tries to queue the task.'
    ]
  },
  QUEUE_CHECK: {
    title: '3. Work Queue Enqueueing',
    type: 'green',
    action: 'Attempt workQueue.offer(task)',
    explanation: 'If the core pool is saturated (active threads >= corePoolSize), the executor attempts to place the task into the blocking queue.',
    keyPoints: [
      'If the queue has space (NO), the task is queued until a thread becomes available to dequeue it (ForkJoinPool or LinkedBlockingQueue).',
      'If the queue is full (YES), the executor must check the maximum pool limits.'
    ]
  },
  MAX_CHECK: {
    title: '4. Max Pool Sizing Check',
    type: 'yellow',
    action: 'Compare active threads with maximumPoolSize',
    explanation: 'If the queue is completely full, the executor checks if it can allocate a temporary, non-core thread.',
    keyPoints: [
      'If active threads < maximumPoolSize (NO), spawns a new non-core thread to immediately run the task.',
      'Non-core threads will terminate if they remain idle for longer than keepAliveTime.',
      'If active threads >= maximumPoolSize (YES), the pool is fully saturated and must reject the task.'
    ]
  },
  REJECTED: {
    title: '5. Task Rejection Policy',
    type: 'red',
    action: 'Invoke RejectedExecutionHandler',
    explanation: 'The pool cannot accept the task. The configured RejectedExecutionHandler is executed to handle the backpressure.',
    keyPoints: [
      'AbortPolicy (Default): Throws RejectedExecutionException instantly.',
      'CallerRunsPolicy: The calling thread itself executes the task, slowing down task submission speed.',
      'DiscardPolicy: Silently drops the task without notifications.',
      'DiscardOldestPolicy: Drops the oldest unhandled task in the queue and retries execution.'
    ]
  }
};

export default function ThreadPoolLifecycleDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<StepKey>('CORE_CHECK');

  const selectedData = STEP_DATA[activeStep];

  const getStroke = (key: StepKey) => {
    if (activeStep === key) {
      return STEP_DATA[key].type === 'purple' ? '#a855f7' : STEP_DATA[key].type === 'cyan' ? '#2dd4bf' : STEP_DATA[key].type === 'green' ? '#4ade80' : STEP_DATA[key].type === 'yellow' ? '#fbbf24' : '#f87171';
    }
    return STEP_DATA[key].type === 'purple' ? '#6b21a8' : STEP_DATA[key].type === 'cyan' ? '#0891b2' : STEP_DATA[key].type === 'green' ? '#15803d' : STEP_DATA[key].type === 'yellow' ? '#d97706' : '#991b1b';
  };

  const getFill = (key: StepKey) => {
    if (activeStep === key) {
      return STEP_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : STEP_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : STEP_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : STEP_DATA[key].type === 'yellow' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    }
    return STEP_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : STEP_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : STEP_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : STEP_DATA[key].type === 'yellow' ? 'rgba(120, 53, 4, 0.05)' : 'rgba(127, 29, 29, 0.05)';
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
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
            <marker
              id="arrow-gray"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2e354f" />
            </marker>
          </defs>

          {/* Step 1: Submit */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('SUBMISSION')}>
            <rect
              x="20"
              y="90"
              width="100"
              height="50"
              rx="6"
              ry="6"
              fill={getFill('SUBMISSION')}
              stroke={getStroke('SUBMISSION')}
              strokeWidth={activeStep === 'SUBMISSION' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="70" y="120" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Task Submitted</text>
          </g>

          {/* Step 2: Core Check */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('CORE_CHECK')}>
            <rect
              x="160"
              y="90"
              width="110"
              height="50"
              rx="6"
              ry="6"
              fill={getFill('CORE_CHECK')}
              stroke={getStroke('CORE_CHECK')}
              strokeWidth={activeStep === 'CORE_CHECK' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="215" y="115" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Is corePool full?</text>
            <text x="215" y="128" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Active &lt; coreSize</text>
          </g>

          {/* Step 3: Queue Check */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('QUEUE_CHECK')}>
            <rect
              x="310"
              y="90"
              width="110"
              height="50"
              rx="6"
              ry="6"
              fill={getFill('QUEUE_CHECK')}
              stroke={getStroke('QUEUE_CHECK')}
              strokeWidth={activeStep === 'QUEUE_CHECK' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="365" y="115" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Is queue full?</text>
            <text x="365" y="128" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#cbd5e1', textAnchor: 'middle' }}>BlockingQueue.offer()</text>
          </g>

          {/* Step 4: Max Check */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('MAX_CHECK')}>
            <rect
              x="460"
              y="90"
              width="110"
              height="50"
              rx="6"
              ry="6"
              fill={getFill('MAX_CHECK')}
              stroke={getStroke('MAX_CHECK')}
              strokeWidth={activeStep === 'MAX_CHECK' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="515" y="115" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Is maxPool full?</text>
            <text x="515" y="128" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Active &lt; maxSize</text>
          </g>

          {/* Spawns (Actions on outcomes) */}
          {/* Action A: Create Core Thread */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('CORE_CHECK')}>
            <rect x="160" y="15" width="110" height="35" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke="#15803d" strokeWidth="1" />
            <text x="215" y="32" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>⚡ Start Core Thread</text>
          </g>

          {/* Action B: Enqueue Task */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('QUEUE_CHECK')}>
            <rect x="310" y="15" width="110" height="35" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke="#15803d" strokeWidth="1" />
            <text x="365" y="32" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>📥 Queue Runnable</text>
          </g>

          {/* Action C: Create Non-Core Thread */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('MAX_CHECK')}>
            <rect x="460" y="15" width="110" height="35" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke="#15803d" strokeWidth="1" />
            <text x="515" y="32" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>⚡ Start Non-Core</text>
          </g>

          {/* Action D: Rejection Policy */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStep('REJECTED')}>
            <rect
              x="600"
              y="90"
              width="60"
              height="50"
              rx="6"
              ry="6"
              fill={getFill('REJECTED')}
              stroke={getStroke('REJECTED')}
              strokeWidth={activeStep === 'REJECTED' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="630" y="120" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#f87171', textAnchor: 'middle' }}>REJECT</text>
          </g>

          {/* CONNECTOR ARROWS */}
          {/* Submit -> Core Check */}
          <g>
            <path
              id="path-submit-core"
              d="M 120 115 L 154 115"
              fill="none"
              stroke={activeStep === 'SUBMISSION' || activeStep === 'CORE_CHECK' ? '#2dd4bf' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeStep === 'SUBMISSION' || activeStep === 'CORE_CHECK' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'SUBMISSION' || activeStep === 'CORE_CHECK' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeStep === 'SUBMISSION' || activeStep === 'CORE_CHECK') && (
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-submit-core" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Core Check -> YES (Right) */}
          <g>
            <path
              id="path-core-queue"
              d="M 270 115 L 304 115"
              fill="none"
              stroke={activeStep === 'CORE_CHECK' || activeStep === 'QUEUE_CHECK' ? '#2dd4bf' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeStep === 'CORE_CHECK' || activeStep === 'QUEUE_CHECK' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'CORE_CHECK' || activeStep === 'QUEUE_CHECK' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeStep === 'CORE_CHECK' || activeStep === 'QUEUE_CHECK') && (
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-core-queue" />
                </animateMotion>
              </circle>
            )}
            <text x="287" y="108" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#2dd4bf', textAnchor: 'middle' }}>YES</text>
          </g>

          {/* Core Check -> NO (Up to Start Core) */}
          <g>
            <path
              id="path-core-start"
              d="M 215 90 L 215 56"
              fill="none"
              stroke={activeStep === 'CORE_CHECK' ? '#4ade80' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeStep === 'CORE_CHECK' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'CORE_CHECK' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {activeStep === 'CORE_CHECK' && (
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-core-start" />
                </animateMotion>
              </circle>
            )}
            <text x="223" y="75" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#4ade80' }}>NO</text>
          </g>

          {/* Queue Check -> YES (Right) */}
          <g>
            <path
              id="path-queue-max"
              d="M 420 115 L 454 115"
              fill="none"
              stroke={activeStep === 'QUEUE_CHECK' || activeStep === 'MAX_CHECK' ? '#2dd4bf' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeStep === 'QUEUE_CHECK' || activeStep === 'MAX_CHECK' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'QUEUE_CHECK' || activeStep === 'MAX_CHECK' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeStep === 'QUEUE_CHECK' || activeStep === 'MAX_CHECK') && (
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-queue-max" />
                </animateMotion>
              </circle>
            )}
            <text x="437" y="108" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#2dd4bf', textAnchor: 'middle' }}>YES</text>
          </g>

          {/* Queue Check -> NO (Up to Queue Task) */}
          <g>
            <path
              id="path-queue-enqueue"
              d="M 365 90 L 365 56"
              fill="none"
              stroke={activeStep === 'QUEUE_CHECK' ? '#4ade80' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeStep === 'QUEUE_CHECK' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'QUEUE_CHECK' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {activeStep === 'QUEUE_CHECK' && (
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-queue-enqueue" />
                </animateMotion>
              </circle>
            )}
            <text x="373" y="75" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#4ade80' }}>NO</text>
          </g>

          {/* Max Check -> YES (Right to Reject) */}
          <g>
            <path
              id="path-max-reject"
              d="M 570 115 L 594 115"
              fill="none"
              stroke={activeStep === 'MAX_CHECK' || activeStep === 'REJECTED' ? '#f87171' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeStep === 'MAX_CHECK' || activeStep === 'REJECTED' ? 'url(#arrow-red)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'MAX_CHECK' || activeStep === 'REJECTED' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeStep === 'MAX_CHECK' || activeStep === 'REJECTED') && (
              <circle r="2.5" fill="#f87171" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-max-reject" />
                </animateMotion>
              </circle>
            )}
            <text x="582" y="108" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#f87171', textAnchor: 'middle' }}>YES</text>
          </g>

          {/* Max Check -> NO (Up to Start Non-Core) */}
          <g>
            <path
              id="path-max-start"
              d="M 515 90 L 515 56"
              fill="none"
              stroke={activeStep === 'MAX_CHECK' ? '#4ade80' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeStep === 'MAX_CHECK' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'MAX_CHECK' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {activeStep === 'MAX_CHECK' && (
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-max-start" />
                </animateMotion>
              </circle>
            )}
            <text x="523" y="75" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#4ade80' }}>NO</text>
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'red' ? 'details-red' : selectedData.type === 'yellow' ? 'details-yellow' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'green' ? 'card-indicator-green' : selectedData.type === 'purple' ? 'card-indicator-purple' : selectedData.type === 'red' ? 'card-indicator-red' : selectedData.type === 'yellow' ? 'card-indicator-yellow' : 'card-indicator-cyan'
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Condition Check / Action:</strong> <span style={{ fontWeight: 'bold' }}>{selectedData.action}</span></p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Task Dispatch Decisions:</strong>
            <ul>
              {selectedData.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on decision blocks (Core check, Queue check, Max check, Rejection) in the pipeline to analyze execution allocations.
      </p>
    </div>
  );
}
