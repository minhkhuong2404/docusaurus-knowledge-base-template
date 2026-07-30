import React, { useState } from 'react';

interface FailureMode {
  id: string;
  tabLabel: string;
  title: string;
  symptom: string;
  recovery: string;
  dilemma: string;
  color: string;
}

const MODES: Record<string, FailureMode> = {
  CRASH_BEFORE: {
    id: 'CRASH_BEFORE',
    tabLabel: '1. Crash Before Vote',
    title: 'Participant Crashes Before Voting',
    symptom: 'One database node drops offline while the coordinator is collecting votes.',
    recovery: 'The coordinator detects a message timeout, logs an ABORT decision, and commands all alive nodes to rollback.',
    dilemma: 'Clean Abort: No locking issues occur. The crashed node will roll back uncommitted work on restart.',
    color: '#fbbf24',
  },
  CRASH_AFTER: {
    id: 'CRASH_AFTER',
    tabLabel: '2. Crash After YES',
    title: 'Participant Crashes After Voting YES (The Blocking Problem)',
    symptom: 'A node votes YES, flushes its WAL replication logs, and immediately crashes. Row locks remain held.',
    recovery: 'On reboot, the node sees a durable PREPARE WAL record without a matching COMMIT/ABORT. It cannot unilaterally commit or abort.',
    dilemma: 'Blocking: The node must keep locks active (blocking other transactions) until it can contact the coordinator.',
    color: '#f87171',
  },
  COORD_CRASH: {
    id: 'COORD_CRASH',
    tabLabel: '3. Coordinator Crash',
    title: 'Coordinator Crashes After Logging Decision',
    symptom: 'The coordinator writes DECISION: COMMIT to its transaction log, then crashes before broadcasting COMMIT.',
    recovery: 'All participants wait in an in-doubt state. On coordinator reboot, it reads its log and drives the commit to completion.',
    dilemma: 'Availability window: System remains blocked for the duration of the coordinator reboot sequence.',
    color: '#a78bfa',
  },
  PARTITION: {
    id: 'PARTITION',
    tabLabel: '4. Network Partition',
    title: 'Network Partition Between Coordinator and Nodes',
    symptom: 'The network link fails. Participant A receives COMMIT and commits. Participant B is cut off.',
    recovery: 'Participant A is committed. Participant B is in-doubt and cannot decide unilaterally to prevent split-brain.',
    dilemma: 'Inconsistency vs Blocking: Choosing CAP Consistency leaves B locked permanently until the link heals.',
    color: '#f472b6',
  },
};

export default function TwoPhaseCommitFailureModesDiagram(): React.JSX.Element {
  const [activeMode, setActiveMode] = useState<string>('CRASH_AFTER');

  const current = MODES[activeMode];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ color: '#34d399' }}>2PC Distributed Failure Modes Explorer</span>
      </div>

      {/* Tabs list */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {Object.values(MODES).map(mode => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '11px',
              background: activeMode === mode.id ? 'rgba(248,113,113,0.15)' : 'transparent',
              color: activeMode === mode.id ? '#f87171' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${activeMode === mode.id ? '#f8717150' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            {mode.tabLabel}
          </button>
        ))}
      </div>

      <style>{`
        .fail-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .fail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="fail-grid">
        
        {/* SVG Visualization */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 220" className="interactive-diagram-svg">
            <defs>
              <marker id="fail-arr-default" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.25)" />
              </marker>
              <marker id="fail-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={current.color} />
              </marker>
            </defs>

            {/* Lines from Coordinator to nodes */}
            {/* Link to Node A */}
            <path d="M 175 40 L 95 120" fill="none" stroke={activeMode === 'PARTITION' ? '#34d399' : 'rgba(148,163,184,0.3)'} strokeWidth="1.5"
                  className={activeMode === 'PARTITION' ? 'interactive-diagram-flowing-path active-path-green' : ''}
                  markerEnd={activeMode === 'PARTITION' ? 'url(#fail-arr-color)' : 'url(#fail-arr-default)'} />

            {/* Link to Node B */}
            {activeMode === 'PARTITION' ? (
              <g>
                {/* Partitioned link */}
                <path d="M 175 40 L 255 120" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Partition indicator line */}
                <path d="M 205 60 L 225 80" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                <path d="M 225 60 L 205 80" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : (
              <path d="M 175 40 L 255 120" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#fail-arr-default)" />
            )}

            {/* Coordinator Node */}
            <g>
              <rect x="125" y="15" width="100" height="30" rx="5"
                    fill={activeMode === 'COORD_CRASH' ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.1)'}
                    stroke={activeMode === 'COORD_CRASH' ? '#ef4444' : '#38bdf8'} strokeWidth="1.5" />
              <text x="175" y="30" textAnchor="middle" fill={activeMode === 'COORD_CRASH' ? '#ef4444' : '#38bdf8'} fontSize="9" fontWeight="800">
                {activeMode === 'COORD_CRASH' ? 'Coordinator 💥' : 'Coordinator'}
              </text>
              {activeMode === 'COORD_CRASH' && (
                <text x="175" y="41" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontStyle="italic">CRASHED AFTER LOG</text>
              )}
            </g>

            {/* Participant A Node */}
            <g>
              <rect x="45" y="120" width="100" height="40" rx="5"
                    fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.5" />
              <text x="95" y="138" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="800">Node A (Payment)</text>
              <text x="95" y="150" textAnchor="middle" fill="#94a3b8" fontSize="7">
                {activeMode === 'PARTITION' ? '✅ COMMITTED' : '🔒 LOCKS ACTIVE'}
              </text>
            </g>

            {/* Participant B Node */}
            <g>
              <rect x="205" y="120" width="100" height="40" rx="5"
                    fill={activeMode === 'CRASH_BEFORE' || activeMode === 'CRASH_AFTER' ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.1)'}
                    stroke={activeMode === 'CRASH_BEFORE' || activeMode === 'CRASH_AFTER' ? '#ef4444' : '#fbbf24'} strokeWidth="1.5" />
              <text x="255" y="138" textAnchor="middle" fill={activeMode === 'CRASH_BEFORE' || activeMode === 'CRASH_AFTER' ? '#ef4444' : '#fbbf24'} fontSize="9" fontWeight="800">
                {activeMode === 'CRASH_BEFORE' || activeMode === 'CRASH_AFTER' ? 'Node B 💥' : 'Node B (Inventory)'}
              </text>
              <text x="255" y="150" textAnchor="middle" fill="#94a3b8" fontSize="7">
                {activeMode === 'CRASH_BEFORE' ? 'Offline (Pre-Vote)' : activeMode === 'CRASH_AFTER' ? 'Offline (In-Doubt)' : activeMode === 'PARTITION' ? '🔒 stuck in-doubt' : '🔒 LOCKS ACTIVE'}
              </text>
            </g>
          </svg>
        </div>

        {/* Info detail block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ borderLeft: `3px solid ${current.color}`, paddingLeft: '10px' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '12px', color: current.color }}>{current.title}</h4>
            <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
              {current.symptom}
            </p>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              System Recovery Action
            </div>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
              {current.recovery}
            </span>
          </div>

          <div style={{
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>
              Operational Impact / Dilemma
            </div>
            <span style={{ color: '#f87171', lineHeight: 1.45 }}>
              {current.dilemma}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
