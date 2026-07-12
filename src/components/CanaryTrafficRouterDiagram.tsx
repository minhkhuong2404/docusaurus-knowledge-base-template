import React, { useState } from 'react';

type CanaryTab = 'ROUTING_SPLIT' | 'TESTS_RUNNING' | 'PROMOTION' | 'ROLLBACK';

interface CanaryDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'red';
  overview: string;
  bullets: string[];
}

const CANARY_DATA: Record<CanaryTab, CanaryDetails> = {
  ROUTING_SPLIT: {
    title: 'Canary Deployment Traffic Split',
    type: 'purple',
    overview: 'Initial canary phase routing a minor portion of traffic to the new release to limit potential blast radius.',
    bullets: [
      'Stable Instance (v1.0): Receives the majority (e.g., 95%) of user traffic.',
      'Canary Instance (v1.1): Receives a tiny sliver (e.g., 5%) of real traffic.',
      'Global Router / LB: Uses weighted routing or cookies to divide requests.'
    ]
  },
  TESTS_RUNNING: {
    title: 'Inflight Test Suite Execution',
    type: 'cyan',
    overview: 'Synthetic tests run concurrently on the live canary instance while monitoring performance and error metrics.',
    bullets: [
      'Synthetic traffic generator triggers automated API calls and core transaction checks against the Canary.',
      'Active health telemetry monitors error rates, latency percentiles, and memory/CPU metrics.',
      'Real users on the Canary are isolated to prevent test data leakage.'
    ]
  },
  PROMOTION: {
    title: 'Deployment Promotion to 100%',
    type: 'green',
    overview: 'Canary tests passed successfully. The router shifts 100% of user traffic to v1.1.',
    bullets: [
      'Test validation completes with 0 critical alerts.',
      'Traffic weights are progressively increased: 5% -> 25% -> 50% -> 100%.',
      'The legacy v1.0 instance is gracefully decommissioned.'
    ]
  },
  ROLLBACK: {
    title: 'Automatic Rollback on Test Failure',
    type: 'red',
    overview: 'A failure threshold is breached. The router instantly isolates the canary and redirects all traffic to the stable v1.0.',
    bullets: [
      'Synthetic tests or real user telemetry detect a spike in 5xx errors or high latencies.',
      'Automated rollback protocol triggers immediately without human intervention.',
      'Canary traffic is zeroed out (0%) to protect production users from further impact.'
    ]
  }
};

export default function CanaryTrafficRouterDiagram(): React.JSX.Element {
  const [tab, setTab] = useState<CanaryTab>('ROUTING_SPLIT');

  const selectedData = CANARY_DATA[tab];

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
          
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🐤</span>
            <span style={{ color: tab === 'ROUTING_SPLIT' ? '#a855f7' : tab === 'TESTS_RUNNING' ? '#2dd4bf' : tab === 'PROMOTION' ? '#4ade80' : '#f87171' }}>
              Canary Deployment: {tab === 'ROUTING_SPLIT' ? 'Traffic Split' : tab === 'TESTS_RUNNING' ? 'Inflight Tests' : tab === 'PROMOTION' ? 'Promotion' : 'Rollback'}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setTab('ROUTING_SPLIT')} style={{ background: tab === 'ROUTING_SPLIT' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: tab === 'ROUTING_SPLIT' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: tab === 'ROUTING_SPLIT' ? '#a855f7' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Traffic Split</button>
          <button onClick={() => setTab('TESTS_RUNNING')} style={{ background: tab === 'TESTS_RUNNING' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: tab === 'TESTS_RUNNING' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: tab === 'TESTS_RUNNING' ? '#2dd4bf' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Inflight Tests</button>
          <button onClick={() => setTab('PROMOTION')} style={{ background: tab === 'PROMOTION' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: tab === 'PROMOTION' ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: tab === 'PROMOTION' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Promotion</button>
          <button onClick={() => setTab('ROLLBACK')} style={{ background: tab === 'ROLLBACK' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: tab === 'ROLLBACK' ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: tab === 'ROLLBACK' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Rollback</button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" /></marker>
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" /></marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" /></marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" /></marker>
          </defs>

          {/* Traffic Router */}
          <g>
            <rect x="30" y="55" width="130" height="70" rx="6" ry="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="95" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Traffic Router</text>
            <text x="95" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#cbd5e1', textAnchor: 'middle' }}>(Load Balancer)</text>
          </g>

          {/* Stable Node */}
          <g>
            <rect x="290" y="25" width="150" height="50" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke={tab === 'ROLLBACK' || tab === 'ROUTING_SPLIT' ? '#a855f7' : 'rgba(255,255,255,0.05)'} />
            <text x="365" y="48" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Stable Instance (v1.0)</text>
            <text x="365" y="62" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#c084fc', textAnchor: 'middle' }}>
              {tab === 'PROMOTION' ? '0% Traffic (Retired)' : tab === 'ROLLBACK' ? '100% Traffic' : '95% Traffic'}
            </text>
          </g>

          {/* Canary Node */}
          <g>
            <rect x="290" y="105" width="150" height="50" rx="4" ry="4" fill={tab === 'TESTS_RUNNING' ? 'rgba(45, 212, 191, 0.05)' : tab === 'PROMOTION' ? 'rgba(74, 222, 128, 0.05)' : tab === 'ROLLBACK' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.02)'} stroke={tab === 'ROLLBACK' ? '#f87171' : tab === 'PROMOTION' ? '#4ade80' : tab === 'TESTS_RUNNING' ? '#2dd4bf' : 'rgba(255,255,255,0.05)'} strokeWidth={tab === 'ROUTING_SPLIT' ? 1 : 1.5} />
            <text x="365" y="128" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Canary Instance (v1.1)</text>
            <text x="365" y="142" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: tab === 'ROLLBACK' ? '#f87171' : tab === 'PROMOTION' ? '#4ade80' : '#2dd4bf', textAnchor: 'middle' }}>
              {tab === 'ROLLBACK' ? '0% Traffic (Rolled Back)' : tab === 'PROMOTION' ? '100% Traffic' : '5% Traffic'}
            </text>
          </g>

          {/* Inflight test engine node */}
          {(tab === 'TESTS_RUNNING' || tab === 'ROLLBACK') && (
            <g>
              <rect x="500" y="65" width="150" height="50" rx="4" ry="4" fill="rgba(255,255,255,0.01)" stroke={tab === 'ROLLBACK' ? '#f87171' : '#2dd4bf'} strokeWidth="1" strokeDasharray={tab === 'ROLLBACK' ? '3 3' : 'none'} />
              <text x="575" y="90" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: tab === 'ROLLBACK' ? '#f87171' : '#2dd4bf', textAnchor: 'middle' }}>
                {tab === 'ROLLBACK' ? '🚨 Tests Failed!' : '🧪 Inflight Test Suite'}
              </text>
              <text x="575" y="103" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>
                {tab === 'ROLLBACK' ? 'Error threshold breached' : 'Synthetic API validations'}
              </text>
            </g>
          )}

          {/* Connection vectors */}
          <g>
            {/* Stable flow path */}
            <path id="path-can-stable" d="M 160 80 L 284 55" fill="none" stroke={tab === 'PROMOTION' ? '#2e354f' : '#a855f7'} strokeWidth="1.5" markerEnd={tab === 'PROMOTION' ? 'none' : 'url(#arrow-purple)'} className={tab === 'PROMOTION' ? '' : 'interactive-diagram-flowing-path'} />
            {tab !== 'PROMOTION' && <circle r="2" fill="#a855f7"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-can-stable" /></animateMotion></circle>}

            {/* Canary flow path */}
            <path id="path-can-canary" d="M 160 100 L 284 125" fill="none" stroke={tab === 'ROLLBACK' ? '#f87171' : tab === 'PROMOTION' ? '#4ade80' : '#2dd4bf'} strokeWidth="1.5" markerEnd={tab === 'ROLLBACK' ? 'none' : tab === 'PROMOTION' ? 'url(#arrow-green)' : 'url(#arrow-cyan)'} className={tab === 'ROLLBACK' ? '' : 'interactive-diagram-flowing-path'} />
            {tab !== 'ROLLBACK' && <circle r="2" fill={tab === 'PROMOTION' ? '#4ade80' : '#2dd4bf'}><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-can-canary" /></animateMotion></circle>}

            {/* Test validation link */}
            {(tab === 'TESTS_RUNNING' || tab === 'ROLLBACK') && (
              <path d="M 440 130 L 494 100" fill="none" stroke={tab === 'ROLLBACK' ? '#f87171' : '#2dd4bf'} strokeWidth="1.2" strokeDasharray="3 3" />
            )}
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'cyan' ? 'details-cyan' : selectedData.type === 'green' ? 'details-green' : 'details-red'
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
        💡 Toggle between traffic split, testing, promotion, and rollback phases to see synthetic canary lifecycle loops.
      </p>
    </div>
  );
}
