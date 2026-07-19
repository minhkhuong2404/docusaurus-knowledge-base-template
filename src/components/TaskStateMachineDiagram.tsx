import React, { useState } from 'react';

interface StateDetail {
  title: string;
  terminal: boolean;
  color: string;
  role: string;
  details: string[];
}

const STATES: Record<string, StateDetail> = {
  PENDING: {
    title: 'PENDING',
    terminal: false,
    color: '#fbbf24',
    role: 'Job record has been created in the database but not yet pushed to the queue.',
    details: [
      'Allows pre-allocation of job IDs for API response headers.',
      'Acts as a backup in case the queue dispatcher fails.',
      'Changes state immediately upon message queue acknowledgement.',
    ],
  },
  QUEUED: {
    title: 'QUEUED',
    terminal: false,
    color: '#38bdf8',
    role: 'Task resides inside the message broker waiting to be consumed.',
    details: [
      'Awaiting worker pool capacity to accept task.',
      'Eligible for priority queues if critical tags are matched.',
      'Can be returned to QUEUED state from FAILED if retry limits permit.',
    ],
  },
  RUNNING: {
    title: 'RUNNING',
    terminal: false,
    color: '#a78bfa',
    role: 'Worker pool has picked up the task and is actively executing it.',
    details: [
      'Worker regularly updates Redis with execution heartbeat.',
      'Holds lock timeout (visibility timeout) to prevent dual-processing.',
      'Triggers progress updates visible to SSE/WebSockets.',
    ],
  },
  COMPLETED: {
    title: 'COMPLETED (Terminal ✅)',
    terminal: true,
    color: '#34d399',
    role: 'Job finished successfully and results are permanent.',
    details: [
      'Artifact stored securely in Result Store.',
      'Resources reclaimed; locks and local cache cleared.',
      'Dispatches completion webhook to notify subscribers.',
    ],
  },
  FAILED: {
    title: 'FAILED',
    terminal: false,
    color: '#f97316',
    role: 'Execution thrown an unhandled exception during processing.',
    details: [
      'Saves stack trace error details to Metadata DB.',
      'Increments the task retry counter.',
      'If retry count < max, schedules a redelivery message back to QUEUED.',
    ],
  },
  DEAD: {
    title: 'DEAD (Terminal ☠️)',
    terminal: true,
    color: '#f87171',
    role: 'Exceeded maximum retry attempts. Abandoned for safety.',
    details: [
      'Prevents poison pill messages from crashing worker loops indefinitely.',
      'Requires human intervention or manual API admin action to retry.',
      'Notifies operations team via Slack/PagerDuty alerts.',
    ],
  },
};

export default function TaskStateMachineDiagram(): React.JSX.Element {
  const [selectedState, setSelectedState] = useState<string>('RUNNING');

  const current = STATES[selectedState];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Async Task State Machine Logic</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'center' }}>
        
        {/* SVG Area */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="state-mach-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />
              </marker>
            </defs>

            {/* Transitions */}
            {/* PENDING -> QUEUED */}
            <path id="t-pnd-qu" d="M 95 35 L 125 35" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-mach-arr)"
                  className={selectedState === 'PENDING' || selectedState === 'QUEUED' ? 'interactive-diagram-flowing-path active-path-cyan' : ''} />

            {/* QUEUED -> RUNNING */}
            <path id="t-qu-run" d="M 205 35 L 235 35" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-mach-arr)"
                  className={selectedState === 'QUEUED' || selectedState === 'RUNNING' ? 'interactive-diagram-flowing-path active-path-purple' : ''} />

            {/* RUNNING -> COMPLETED */}
            <path id="t-run-comp" d="M 275 50 L 275 105" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-mach-arr)"
                  className={selectedState === 'RUNNING' || selectedState === 'COMPLETED' ? 'interactive-diagram-flowing-path active-path-green' : ''} />

            {/* RUNNING -> FAILED */}
            <path id="t-run-fail" d="M 245 45 L 195 105" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-mach-arr)"
                  className={selectedState === 'RUNNING' || selectedState === 'FAILED' ? 'interactive-diagram-flowing-path active-path-yellow' : ''} />

            {/* FAILED -> QUEUED */}
            <path id="t-fail-qu" d="M 160 105 L 160 55" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-mach-arr)"
                  className={selectedState === 'FAILED' || selectedState === 'QUEUED' ? 'interactive-diagram-flowing-path active-path-cyan' : ''} />
            <text x="135" y="80" fill="#64748b" fontSize="7" fontWeight="bold">retry &lt; max</text>

            {/* FAILED -> DEAD */}
            <path id="t-fail-dead" d="M 125 120 L 95 120" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-mach-arr)"
                  className={selectedState === 'FAILED' || selectedState === 'DEAD' ? 'interactive-diagram-flowing-path active-path-red' : ''} />
            <text x="110" y="130" fill="#64748b" fontSize="7" fontWeight="bold">retry ≥ max</text>

            {/* PENDING State Node */}
            <g onClick={() => setSelectedState('PENDING')} style={{ cursor: 'pointer' }}>
              <rect x="15" y="20" width="80" height="30" rx="5"
                    fill={selectedState === 'PENDING' ? 'rgba(251,191,36,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedState === 'PENDING' ? '#fbbf24' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="55" y="38" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="800">
                PENDING
              </text>
            </g>

            {/* QUEUED State Node */}
            <g onClick={() => setSelectedState('QUEUED')} style={{ cursor: 'pointer' }}>
              <rect x="125" y="20" width="80" height="30" rx="5"
                    fill={selectedState === 'QUEUED' ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedState === 'QUEUED' ? '#38bdf8' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="165" y="38" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="800">
                QUEUED
              </text>
            </g>

            {/* RUNNING State Node */}
            <g onClick={() => setSelectedState('RUNNING')} style={{ cursor: 'pointer' }}>
              <rect x="235" y="20" width="80" height="30" rx="5"
                    fill={selectedState === 'RUNNING' ? 'rgba(167,135,250,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedState === 'RUNNING' ? '#a78bfa' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="275" y="38" textAnchor="middle" fill="#a78bfa" fontSize="9.5" fontWeight="800">
                RUNNING
              </text>
            </g>

            {/* COMPLETED State Node */}
            <g onClick={() => setSelectedState('COMPLETED')} style={{ cursor: 'pointer' }}>
              <rect x="235" y="110" width="80" height="30" rx="5"
                    fill={selectedState === 'COMPLETED' ? 'rgba(52,211,153,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedState === 'COMPLETED' ? '#34d399' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="275" y="128" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="800">
                COMPLETED
              </text>
            </g>

            {/* FAILED State Node */}
            <g onClick={() => setSelectedState('FAILED')} style={{ cursor: 'pointer' }}>
              <rect x="125" y="110" width="80" height="30" rx="5"
                    fill={selectedState === 'FAILED' ? 'rgba(249,115,22,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedState === 'FAILED' ? '#f97316' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="165" y="128" textAnchor="middle" fill="#f97316" fontSize="9.5" fontWeight="800">
                FAILED
              </text>
            </g>

            {/* DEAD State Node */}
            <g onClick={() => setSelectedState('DEAD')} style={{ cursor: 'pointer' }}>
              <rect x="15" y="110" width="80" height="30" rx="5"
                    fill={selectedState === 'DEAD' ? 'rgba(248,113,113,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedState === 'DEAD' ? '#f87171' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="55" y="128" textAnchor="middle" fill="#f87171" fontSize="9.5" fontWeight="800">
                DEAD
              </text>
            </g>

            <text x="175" y="170" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#475569', textAnchor: 'middle', fontStyle: 'italic' }}>
              💡 Click on nodes to check transitions rules.
            </text>
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: current.color }}>{current.title}</h3>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0 }}>
            {current.role}
          </p>
          <ul style={{ margin: 0, paddingLeft: '14px' }}>
            {current.details.map((detail, idx) => (
              <li key={idx} style={{ fontSize: '11px', color: 'var(--ifm-color-content)', marginBottom: '4px', lineHeight: 1.4 }}>
                {detail}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
