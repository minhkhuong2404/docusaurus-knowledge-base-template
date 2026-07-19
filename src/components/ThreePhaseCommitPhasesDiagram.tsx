import React, { useState } from 'react';

interface PhaseDetail {
  id: string;
  name: string;
  subLabel: string;
  color: string;
  role: string;
  actions: string[];
  unilateralTimeout: string;
  timeoutDetails: string;
}

const PHASES: Record<string, PhaseDetail> = {
  CAN_COMMIT: {
    id: 'CAN_COMMIT',
    name: '1. CanCommit',
    subLabel: 'Voting Round',
    color: '#38bdf8',
    role: 'Coordinator asks participants if they are able to commit the transaction.',
    actions: [
      'Participants check constraints, schemas, and resource availability.',
      'No locks are acquired yet; no WAL record is written.',
      'Participants vote YES (can commit) or NO (abort).',
    ],
    unilateralTimeout: 'SAFE ABORT',
    timeoutDetails: 'If a participant times out waiting for the coordinator, it can unilaterally ABORT. Since no locks are held and no logs are written, state consistency is preserved.',
  },
  PRE_COMMIT: {
    id: 'PRE_COMMIT',
    name: '2. PreCommit',
    subLabel: 'Lock + Promise',
    color: '#fbbf24',
    role: 'Coordinator enters PreCommit state and broadcasts the prepare action.',
    actions: [
      'Participants acquire database row locks.',
      'Participants write transaction changes to WAL on durable disk.',
      'Participants return a READY acknowledgment to the coordinator.',
    ],
    unilateralTimeout: 'SAFE COMMIT / QUORUM',
    timeoutDetails: 'If a participant times out waiting for DoCommit, it knows every participant voted YES. It can safely commit because all nodes are guaranteed to have prepared.',
  },
  DO_COMMIT: {
    id: 'DO_COMMIT',
    name: '3. DoCommit',
    subLabel: 'Final Apply',
    color: '#34d399',
    role: 'Coordinator confirms all READY signals and logs commit state.',
    actions: [
      'Coordinator broadcasts DoCommit message to all participants.',
      'Participants apply transaction changes permanently.',
      'Participants release row locks and return completion ACK.',
    ],
    unilateralTimeout: 'COMMIT SUCCESS',
    timeoutDetails: 'Nodes apply the commit durably. On network timeout, they proceed to commit and clean up locked states.',
  },
};

export default function ThreePhaseCommitPhasesDiagram(): React.JSX.Element {
  const [activePhase, setActivePhase] = useState<string>('PRE_COMMIT');

  const current = PHASES[activePhase];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span style={{ color: '#34d399' }}>Three-Phase Commit (3PC) Phase Transitions</span>
      </div>

      <style>{`
        .phases-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .phases-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="phases-grid">
        
        {/* Horizontal phases flow chart */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <svg viewBox="0 0 350 160" className="interactive-diagram-svg">
            <defs>
              <marker id="phases-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.25)" />
              </marker>
              <marker id="phases-arr-active" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={current.color} />
              </marker>
            </defs>

            {/* Stepper connections */}
            {/* CanCommit -> PreCommit */}
            <path id="flow-p1-p2" d="M 104 80 L 112 80" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5"
                  className={activePhase === 'PRE_COMMIT' || activePhase === 'CAN_COMMIT' ? 'interactive-diagram-flowing-path active-path-cyan' : ''}
                  markerEnd={activePhase === 'PRE_COMMIT' || activePhase === 'CAN_COMMIT' ? 'url(#phases-arr-active)' : 'url(#phases-arr)'} />
            
            {/* PreCommit -> DoCommit */}
            <path id="flow-p2-p3" d="M 214 80 L 242 80" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5"
                  className={activePhase === 'PRE_COMMIT' || activePhase === 'DO_COMMIT' ? 'interactive-diagram-flowing-path active-path-yellow' : ''}
                  markerEnd={activePhase === 'PRE_COMMIT' || activePhase === 'DO_COMMIT' ? 'url(#phases-arr-active)' : 'url(#phases-arr)'} />

            {/* CanCommit Node */}
            <g onClick={() => setActivePhase('CAN_COMMIT')} style={{ cursor: 'pointer' }}>
              <rect x="10" y="55" width="90" height="50" rx="6"
                    fill={activePhase === 'CAN_COMMIT' ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={activePhase === 'CAN_COMMIT' ? '#38bdf8' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="55" y="78" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="800">
                CanCommit
              </text>
              <text x="55" y="90" textAnchor="middle" fill="#64748b" fontSize="7" fontStyle="italic">
                (Voting)
              </text>
            </g>

            {/* PreCommit Node */}
            <g onClick={() => setActivePhase('PRE_COMMIT')} style={{ cursor: 'pointer' }}>
              <rect x="120" y="55" width="90" height="50" rx="6"
                    fill={activePhase === 'PRE_COMMIT' ? 'rgba(251,191,36,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={activePhase === 'PRE_COMMIT' ? '#fbbf24' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="165" y="78" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="800">
                PreCommit
              </text>
              <text x="165" y="90" textAnchor="middle" fill="#64748b" fontSize="7" fontStyle="italic">
                (Lock &amp; Promise)
              </text>
            </g>

            {/* DoCommit Node */}
            <g onClick={() => setActivePhase('DO_COMMIT')} style={{ cursor: 'pointer' }}>
              <rect x="250" y="55" width="90" height="50" rx="6"
                    fill={activePhase === 'DO_COMMIT' ? 'rgba(52,211,153,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={activePhase === 'DO_COMMIT' ? '#34d399' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="295" y="78" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="800">
                DoCommit
              </text>
              <text x="295" y="90" textAnchor="middle" fill="#64748b" fontSize="7" fontStyle="italic">
                (Final Apply)
              </text>
            </g>

            <text x="175" y="138" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#475569', textAnchor: 'middle', fontStyle: 'italic' }}>
              💡 Click on stages to check timeout actions.
            </text>
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div>
            <h3 style={{ color: current.color }}>{current.name}</h3>
            <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {current.subLabel}
            </span>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {current.role}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Round Actions
            </span>
            <ul style={{ margin: 0, paddingLeft: '14px' }}>
              {current.actions.map((action, idx) => (
                <li key={idx} style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '3px', lineHeight: 1.45 }}>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${current.color}`,
            borderRadius: '4px',
            padding: '8px 10px',
            fontSize: '11px',
            marginTop: '4px',
          }}>
            <span style={{ fontWeight: 'bold', color: current.color, display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              TIMEOUT UNILATERAL DECISION: {current.unilateralTimeout}
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
              {current.timeoutDetails}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
