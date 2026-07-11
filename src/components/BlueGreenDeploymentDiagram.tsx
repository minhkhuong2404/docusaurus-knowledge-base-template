import React, { useState } from 'react';

type BGState = 'BLUE_ACTIVE' | 'GREEN_ACTIVE' | 'ROLLBACK';

interface BGDetails {
  title: string;
  type: 'blue' | 'green' | 'red';
  overview: string;
  bullets: string[];
}

const BG_DATA: Record<BGState, BGDetails> = {
  BLUE_ACTIVE: {
    title: 'Blue Environment Active (Pre-Switch)',
    type: 'blue',
    overview: 'Production traffic is locked to the stable Blue environment while the Green environment is prepared or validated.',
    bullets: [
      'Blue Environment (v1.0): Hosts the current live production code, serving 100% of user requests.',
      'Green Environment (v1.1): Deployed but isolated. Receives 0% live production traffic. Staging or smoke testing is executed here.',
      'Router: Traffic weights are hard-pointed to the Blue environment.'
    ]
  },
  GREEN_ACTIVE: {
    title: 'Green Environment Active (Post-Switch)',
    type: 'green',
    overview: 'Traffic has been atomically cut over to the new Green environment. Blue is kept warm.',
    bullets: [
      'Green Environment (v1.1): Promoted to production. Serves 100% of live user traffic.',
      'Blue Environment (v1.0): Receives 0% traffic, but is kept active in hot-standby mode.',
      'Transition speed: Cutover is near-instantaneous via router DNS or internal load-balancer rules.'
    ]
  },
  ROLLBACK: {
    title: 'Instant Rollback to Blue',
    type: 'red',
    overview: 'Errors were detected in the Green environment. Traffic is instantly cut back to the warm Blue instance.',
    bullets: [
      'Issue detected: Performance dashboards, synthetic checks, or logs signal defects on Green (v1.1).',
      'Atomic rollback: Router weights are instantly flipped back to the hot-standby Blue environment.',
      'Zero user downtime: Because Blue was kept warm and fully active, no user requests are dropped.'
    ]
  }
};

export default function BlueGreenDeploymentDiagram(): React.JSX.Element {
  const [state, setState] = useState<BGState>('BLUE_ACTIVE');

  const selectedData = BG_DATA[state];

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
            state === 'BLUE_ACTIVE' ? 'card-indicator-cyan' : state === 'GREEN_ACTIVE' ? 'card-indicator-green' : 'card-indicator-red'
          }`} />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔵🟢</span>
            <span style={{ color: state === 'BLUE_ACTIVE' ? '#38bdf8' : state === 'GREEN_ACTIVE' ? '#4ade80' : '#f87171' }}>
              Blue-Green: {state === 'BLUE_ACTIVE' ? 'Blue Live' : state === 'GREEN_ACTIVE' ? 'Green Live' : 'Rollback'}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setState('BLUE_ACTIVE')} style={{ background: state === 'BLUE_ACTIVE' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: state === 'BLUE_ACTIVE' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: state === 'BLUE_ACTIVE' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Active (Blue)</button>
          <button onClick={() => setState('GREEN_ACTIVE')} style={{ background: state === 'GREEN_ACTIVE' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: state === 'GREEN_ACTIVE' ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: state === 'GREEN_ACTIVE' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Switch (Green)</button>
          <button onClick={() => setState('ROLLBACK')} style={{ background: state === 'ROLLBACK' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: state === 'ROLLBACK' ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: state === 'ROLLBACK' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}>Rollback</button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" /></marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" /></marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" /></marker>
          </defs>

          {/* Traffic Router */}
          <g>
            <rect x="30" y="55" width="130" height="70" rx="6" ry="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="95" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Traffic Router</text>
            <text x="95" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#cbd5e1', textAnchor: 'middle' }}>(DNS / LB Swap)</text>
          </g>

          {/* Blue Environment Box */}
          <g>
            <rect x="290" y="25" width="160" height="50" rx="4" ry="4" fill={state === 'BLUE_ACTIVE' || state === 'ROLLBACK' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.02)'} stroke={state === 'BLUE_ACTIVE' || state === 'ROLLBACK' ? '#38bdf8' : 'rgba(255,255,255,0.05)'} strokeWidth="1.5" />
            <text x="370" y="48" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Blue Environment (v1.0)</text>
            <text x="370" y="62" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: state === 'BLUE_ACTIVE' || state === 'ROLLBACK' ? '#38bdf8' : '#475569', textAnchor: 'middle' }}>
              {state === 'GREEN_ACTIVE' ? '0% Traffic (Hot Standby)' : '100% Production'}
            </text>
          </g>

          {/* Green Environment Box */}
          <g>
            <rect x="290" y="105" width="160" height="50" rx="4" ry="4" fill={state === 'GREEN_ACTIVE' ? 'rgba(74, 222, 128, 0.05)' : 'rgba(255,255,255,0.02)'} stroke={state === 'GREEN_ACTIVE' ? '#4ade80' : state === 'ROLLBACK' ? '#f87171' : 'rgba(255,255,255,0.05)'} strokeWidth="1.5" />
            <text x="370" y="128" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Green Environment (v1.1)</text>
            <text x="370" y="142" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: state === 'GREEN_ACTIVE' ? '#4ade80' : state === 'ROLLBACK' ? '#f87171' : '#475569', textAnchor: 'middle' }}>
              {state === 'GREEN_ACTIVE' ? '100% Production' : state === 'ROLLBACK' ? '0% Traffic (Fault Detected)' : '0% Traffic (Validation)'}
            </text>
          </g>

          {/* Connections and flow animations */}
          <g>
            {/* Stable Blue connection */}
            <path id="path-bg-blue" d="M 160 80 L 284 55" fill="none" stroke={state === 'GREEN_ACTIVE' ? '#2e354f' : state === 'ROLLBACK' ? '#f87171' : '#38bdf8'} strokeWidth="1.5" markerEnd={state === 'GREEN_ACTIVE' ? 'none' : state === 'ROLLBACK' ? 'url(#arrow-red)' : 'url(#arrow-cyan)'} className={state === 'GREEN_ACTIVE' ? '' : 'interactive-diagram-flowing-path'} />
            {state !== 'GREEN_ACTIVE' && <circle r="2" fill={state === 'ROLLBACK' ? '#f87171' : '#38bdf8'}><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-bg-blue" /></animateMotion></circle>}

            {/* Stable Green connection */}
            <path id="path-bg-green" d="M 160 100 L 284 125" fill="none" stroke={state === 'GREEN_ACTIVE' ? '#4ade80' : '#2e354f'} strokeWidth="1.5" markerEnd={state === 'GREEN_ACTIVE' ? 'url(#arrow-green)' : 'none'} className={state === 'GREEN_ACTIVE' ? 'interactive-diagram-flowing-path' : ''} />
            {state === 'GREEN_ACTIVE' && <circle r="2" fill="#4ade80"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-bg-green" /></animateMotion></circle>}
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'blue' ? 'details-cyan' : selectedData.type === 'green' ? 'details-green' : 'details-red'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'blue' ? 'card-indicator-cyan' : selectedData.type === 'green' ? 'card-indicator-green' : 'card-indicator-red'
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
        💡 Use the controls above to trigger cutovers and mock active rollbacks between Blue and Green production setups.
      </p>
    </div>
  );
}
