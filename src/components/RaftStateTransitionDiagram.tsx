import React, { useState } from 'react';

interface RaftStateDetail {
  id: string;
  name: string;
  color: string;
  role: string;
  transitions: string[];
  rules: string[];
}

const STATES: Record<string, RaftStateDetail> = {
  FOLLOWER: {
    id: 'FOLLOWER',
    name: 'Follower State',
    color: '#38bdf8',
    role: 'Default starting state. Passive; only responds to incoming RPC requests (heartbeats/prepares).',
    transitions: [
      'Election Timeout: If no heartbeat is received within a randomized window (e.g. 150-300ms), transitions to Candidate.',
    ],
    rules: [
      'Does not issue any commands.',
      'Redirects client writes/reads to the Leader.',
      'Votes for candidates in incoming RequestVote requests.',
    ],
  },
  CANDIDATE: {
    id: 'CANDIDATE',
    name: 'Candidate State',
    color: '#fbbf24',
    role: 'Temporary state active during leader election campaign rounds.',
    transitions: [
      'Majority Quorum: If votes from a majority of nodes are received, transitions to Leader.',
      'Valid Heartbeat: If a heartbeat from a new leader with equal or higher term is received, falls back to Follower.',
      'Split Vote Timeout: If no candidate reaches majority before timeout, increments term and restarts campaign.',
    ],
    rules: [
      'Increments the currentTerm on transition.',
      'Votes for self and broadcasts RequestVote RPCs to all peers.',
    ],
  },
  LEADER: {
    id: 'LEADER',
    name: 'Leader State',
    color: '#34d399',
    role: 'Elected manager of the replication log group. Handles all client writes.',
    transitions: [
      'Higher Term: If another node broadcasts a message with a higher currentTerm, steps down immediately to Follower.',
    ],
    rules: [
      'Sends regular heartbeat (AppendEntries) to maintain authority.',
      'Appends new log entries locally, replicates them, and commits when a majority acknowledges.',
    ],
  },
};

export default function RaftStateTransitionDiagram(): React.JSX.Element {
  const [activeState, setActiveState] = useState<string>('FOLLOWER');

  const current = STATES[activeState];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span style={{ color: '#34d399' }}>Raft Consensus State Machine Transitions</span>
      </div>

      <style>{`
        .raft-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .raft-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="raft-grid">
        
        {/* SVG State Diagram */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 210" className="interactive-diagram-svg">
            <defs>
              <marker id="raft-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="raft-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={current.color} />
              </marker>
            </defs>

            {/* State connection paths */}
            {/* Follower -> Candidate (Election timeout) */}
            <path d="M 75 80 L 138 125" fill="none" stroke={activeState === 'CANDIDATE' ? '#fbbf24' : 'rgba(148,163,184,0.2)'} strokeWidth={activeState === 'CANDIDATE' ? '2' : '1.2'}
                  className={activeState === 'CANDIDATE' ? 'interactive-diagram-flowing-path' : ''}
                  markerEnd={activeState === 'CANDIDATE' ? 'url(#raft-arr-color)' : 'url(#raft-arr)'} />
            <text x="88" y="110" fill="#94a3b8" fontSize="6.5">Election Timeout</text>

            {/* Candidate -> Leader (Majority votes) */}
            <path d="M 195 135 L 258 90" fill="none" stroke={activeState === 'LEADER' ? '#34d399' : 'rgba(148,163,184,0.2)'} strokeWidth={activeState === 'LEADER' ? '2' : '1.2'}
                  className={activeState === 'LEADER' ? 'interactive-diagram-flowing-path active-path-green' : ''}
                  markerEnd={activeState === 'LEADER' ? 'url(#raft-arr-color)' : 'url(#raft-arr)'} />
            <text x="240" y="125" fill="#94a3b8" fontSize="6.5">Quorum Majority</text>

            {/* Leader -> Follower (Higher term fallback) */}
            <path d="M 255 50 Q 175 30 95 50" fill="none" stroke={activeState === 'FOLLOWER' ? '#38bdf8' : 'rgba(148,163,184,0.2)'} strokeWidth={activeState === 'FOLLOWER' ? '2' : '1.2'}
                  className={activeState === 'FOLLOWER' ? 'interactive-diagram-flowing-path active-path-cyan' : ''}
                  markerEnd={activeState === 'FOLLOWER' ? 'url(#raft-arr-color)' : 'url(#raft-arr)'} />
            <text x="175" y="32" textAnchor="middle" fill="#94a3b8" fontSize="6.5">Discovers Higher Term</text>

            {/* Candidate -> Follower (Heartbeat / Leader found) */}
            <path d="M 135 140 L 75 80" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#raft-arr)" />
            <text x="135" y="90" textAnchor="middle" fill="#94a3b8" fontSize="5.5">Leader heartbeat</text>

            {/* Follower Node */}
            <g onClick={() => setActiveState('FOLLOWER')} style={{ cursor: 'pointer' }}>
              <circle cx="65" cy="65" r="24" fill={activeState === 'FOLLOWER' ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.8)'} stroke="#38bdf8" strokeWidth={activeState === 'FOLLOWER' ? '2' : '1.2'} />
              <text x="65" y="68" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="bold">Follower</text>
            </g>

            {/* Candidate Node */}
            <g onClick={() => setActiveState('CANDIDATE')} style={{ cursor: 'pointer' }}>
              <circle cx="165" cy="145" r="24" fill={activeState === 'CANDIDATE' ? 'rgba(251,191,36,0.15)' : 'rgba(15,23,42,0.8)'} stroke="#fbbf24" strokeWidth={activeState === 'CANDIDATE' ? '2' : '1.2'} />
              <text x="165" y="148" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="bold">Candidate</text>
            </g>

            {/* Leader Node */}
            <g onClick={() => setActiveState('LEADER')} style={{ cursor: 'pointer' }}>
              <circle cx="275" cy="65" r="24" fill={activeState === 'LEADER' ? 'rgba(52,211,153,0.15)' : 'rgba(15,23,42,0.8)'} stroke="#34d399" strokeWidth={activeState === 'LEADER' ? '2' : '1.2'} />
              <text x="275" y="68" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="bold">Leader</text>
            </g>

            <text x="175" y="195" textAnchor="middle" fill="#475569" fontSize="8" fontStyle="italic">
              💡 Click any state node to examine its transition behaviors.
            </text>
          </svg>
        </div>

        {/* Info panel */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div>
            <h3 style={{ color: current.color }}>{current.name}</h3>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {current.role}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Active Rules
            </span>
            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px' }}>
              {current.rules.map((rule, idx) => (
                <li key={idx} style={{ color: 'var(--ifm-color-content-secondary)', marginBottom: '3px', lineHeight: 1.4 }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Transitions
            </span>
            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px' }}>
              {current.transitions.map((trans, idx) => (
                <li key={idx} style={{ color: 'var(--ifm-color-content-secondary)', marginBottom: '3.5px', lineHeight: 1.4 }}>
                  {trans}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
