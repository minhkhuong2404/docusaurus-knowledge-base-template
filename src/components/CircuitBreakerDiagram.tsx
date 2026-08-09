import React, { useState } from 'react';
import styles from './CircuitBreakerDiagram.module.css';

type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export default function CircuitBreakerDiagram(): React.JSX.Element {
  const [activeState, setActiveState] = useState<BreakerState>('CLOSED');

  return (
    <div className={"interactive-diagram-container"}>
      <div className={"interactive-diagram-svg-wrapper"}>
        <svg viewBox="0 0 650 380" className={"interactive-diagram-svg"}>
          <defs>
            {/* Gradients */}
            <linearGradient id="closedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a2a16" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            <linearGradient id="openGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b0707" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <linearGradient id="halfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3a1502" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Glowing Filters */}
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowYellow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Arrowhead Markers */}
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#4ade80" />
            </marker>
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
            </marker>
            <marker
              id="arrow-yellow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
            </marker>
          </defs>

          {/* Grid Background pattern overlay */}
          <rect width="650" height="380" rx="12" fill="#070913" className={"interactive-diagram-grid-bg"} />

          {/* TRANSITIONS (PATHS) */}
          
          {/* 1. CLOSED -> OPEN */}
          <g className={styles.transitionGroup}>
            <path
              id="path-closed-open"
              d="M 220 110 L 420 110"
              fill="none"
              stroke="#2e354f"
              strokeWidth="2.5"
              markerEnd="url(#arrow-red)"
              className={`${styles.transitionPath} ${activeState === 'CLOSED' ? styles.activePathRed : ''}`}
            />
            {/* Flowing arrow particle */}
            <circle r="4.5" fill="#f87171" filter="url(#glowRed)" className={"interactive-diagram-flowing-dot"}>
              <animateMotion dur="2.2s" repeatCount="indefinite">
                <mpath href="#path-closed-open" />
              </animateMotion>
            </circle>
          </g>

          {/* 2. OPEN -> HALF_OPEN */}
          <g className={styles.transitionGroup}>
            <path
              id="path-open-half"
              d="M 515 145 Q 515 290 418 290"
              fill="none"
              stroke="#2e354f"
              strokeWidth="2.5"
              markerEnd="url(#arrow-yellow)"
              className={`${styles.transitionPath} ${activeState === 'OPEN' ? styles.activePathYellow : ''}`}
            />
            {/* Flowing arrow particle */}
            <circle r="4.5" fill="#fbbf24" filter="url(#glowYellow)" className={"interactive-diagram-flowing-dot"}>
              <animateMotion dur="2.5s" repeatCount="indefinite">
                <mpath href="#path-open-half" />
              </animateMotion>
            </circle>
          </g>

          {/* 3. HALF_OPEN -> CLOSED */}
          <g className={styles.transitionGroup}>
            <path
              id="path-half-closed"
              d="M 240 290 Q 135 290 135 152"
              fill="none"
              stroke="#2e354f"
              strokeWidth="2.5"
              markerEnd="url(#arrow-green)"
              className={`${styles.transitionPath} ${activeState === 'HALF_OPEN' ? styles.activePathGreen : ''}`}
            />
            {/* Flowing arrow particle */}
            <circle r="4.5" fill="#4ade80" filter="url(#glowGreen)" className={"interactive-diagram-flowing-dot"}>
              <animateMotion dur="2.5s" repeatCount="indefinite">
                <mpath href="#path-half-closed" />
              </animateMotion>
            </circle>
          </g>

          {/* 4. HALF_OPEN -> OPEN */}
          <g className={styles.transitionGroup}>
            <path
              id="path-half-open"
              d="M 325 255 Q 325 145 422 145"
              fill="none"
              stroke="#2e354f"
              strokeWidth="2.5"
              markerEnd="url(#arrow-red)"
              className={`${styles.transitionPath} ${activeState === 'HALF_OPEN' ? styles.activePathRed : ''}`}
            />
            {/* Flowing arrow particle */}
            <circle r="4.5" fill="#f87171" filter="url(#glowRed)" className={"interactive-diagram-flowing-dot"}>
              <animateMotion dur="2.0s" repeatCount="indefinite">
                <mpath href="#path-half-open" />
              </animateMotion>
            </circle>
          </g>

          {/* Transition Labels */}
          {/* CLOSED -> OPEN */}
          <g className={styles.labelBg}>
            <rect x="235" y="82" width="180" height="20" rx="6" fill="#0c0e17" stroke="rgba(248, 113, 113, 0.25)" strokeWidth="1" />
            <text x="325" y="96" className={styles.labelTextRed}>Failure rate &gt; threshold</text>
          </g>

          {/* OPEN -> HALF_OPEN */}
          <g className={styles.labelBg}>
            <rect x="420" y="200" width="150" height="20" rx="6" fill="#0c0e17" stroke="rgba(251, 191, 36, 0.25)" strokeWidth="1" />
            <text x="495" y="214" className={styles.labelTextYellow}>Wait duration elapsed</text>
          </g>

          {/* HALF_OPEN -> CLOSED */}
          <g className={styles.labelBg}>
            <rect x="80" y="200" width="130" height="20" rx="6" fill="#0c0e17" stroke="rgba(74, 222, 128, 0.25)" strokeWidth="1" />
            <text x="145" y="214" className={styles.labelTextGreen}>Success in test</text>
          </g>

          {/* HALF_OPEN -> OPEN */}
          <g className={styles.labelBg}>
            <rect x="260" y="175" width="130" height="20" rx="6" fill="#0c0e17" stroke="rgba(248, 113, 113, 0.25)" strokeWidth="1" />
            <text x="325" y="189" className={styles.labelTextRed}>Failure in test</text>
          </g>


          {/* NODES (STATES) */}

          {/* CLOSED NODE */}
          <g
            className={`${styles.node} ${activeState === 'CLOSED' ? "node-active-green" : ''}`}
            onClick={() => setActiveState('CLOSED')}
          >
            <rect x="50" y="75" width="170" height="70" rx="14" fill="url(#closedGrad)" stroke="#4ade80" strokeWidth="2.5" />
            <text x="135" y="105" className={styles.nodeTitle}>CLOSED</text>
            <text x="135" y="125" className={styles.nodeDesc}>Normal Operations</text>
            <circle cx="210" cy="85" r="5.5" fill="#4ade80" className={"interactive-diagram-pulse-dot"} />
          </g>

          {/* OPEN NODE */}
          <g
            className={`${styles.node} ${activeState === 'OPEN' ? "node-active-red" : ''}`}
            onClick={() => setActiveState('OPEN')}
          >
            <rect x="430" y="75" width="170" height="70" rx="14" fill="url(#openGrad)" stroke="#f87171" strokeWidth="2.5" />
            <text x="515" y="105" className={styles.nodeTitle}>OPEN</text>
            <text x="515" y="125" className={styles.nodeDesc}>Calls Trip Instantly</text>
            <circle cx="590" cy="85" r="5.5" fill="#f87171" className={"interactive-diagram-pulse-dot"} />
          </g>

          {/* HALF-OPEN NODE */}
          <g
            className={`${styles.node} ${activeState === 'HALF_OPEN' ? "node-active-yellow" : ''}`}
            onClick={() => setActiveState('HALF_OPEN')}
          >
            <rect x="240" y="255" width="170" height="70" rx="14" fill="url(#halfGrad)" stroke="#fbbf24" strokeWidth="2.5" />
            <text x="325" y="285" className={styles.nodeTitle}>HALF-OPEN</text>
            <text x="325" y="305" className={styles.nodeDesc}>Test Requests</text>
            <circle cx="400" cy="265" r="5.5" fill="#fbbf24" className={"interactive-diagram-pulse-dot"} />
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={"interactive-diagram-details-card"}>
        {activeState === 'CLOSED' && (
          <div className={"details-green"}>
            <div className={"interactive-diagram-card-header"}>
              
              <h3>CLOSED STATE (Normal operations)</h3>
            </div>
            <p><strong>Behavior:</strong> All traffic passes normally through to the downstream microservice. All response times and success/failure outcomes are monitored.</p>
            <ul>
              <li><strong>Sliding Window:</strong> Resilience4j collects call results in a sliding window (count-based or time-based).</li>
              <li><strong>Trip Condition:</strong> If the failure rate exceeds the set threshold (e.g. 50%) or if the rate of slow calls exceeds a threshold, the breaker trips to <strong>OPEN</strong>.</li>
            </ul>
          </div>
        )}
        {activeState === 'OPEN' && (
          <div className={"details-red"}>
            <div className={"interactive-diagram-card-header"}>
              
              <h3>OPEN STATE (Calls trip instantly)</h3>
            </div>
            <p><strong>Behavior:</strong> All downstream calls fail-fast immediately without hitting the actual service, throwing a <code>CallNotPermittedException</code>.</p>
            <ul>
              <li><strong>Fallback:</strong> Fallback methods are executed immediately to return cached, stubbed, or friendly default responses to the client.</li>
              <li><strong>Cooldown:</strong> A configured wait duration runs (cooldown period). Once this timer expires, the breaker transitions to <strong>HALF-OPEN</strong>.</li>
            </ul>
          </div>
        )}
        {activeState === 'HALF_OPEN' && (
          <div className={"details-yellow"}>
            <div className={"interactive-diagram-card-header"}>
              
              <h3>HALF-OPEN STATE (Testing pipeline health)</h3>
            </div>
            <p><strong>Behavior:</strong> A configured, limited number of test requests are permitted to pass through to the downstream service to check if it has recovered.</p>
            <ul>
              <li><strong>Recovery:</strong> If all test calls succeed (or failures remain below the threshold), the breaker resets back to <strong>CLOSED</strong>.</li>
              <li><strong>Re-trip:</strong> If any test calls fail above the threshold, the breaker immediately trips back to <strong>OPEN</strong> and restarts the cooldown timer.</li>
            </ul>
          </div>
        )}
      </div>
      <p className={"interactive-diagram-helper-text"}>💡 Click on the nodes in the diagram above to inspect details and behavior of each state.</p>
    </div>
  );
}
