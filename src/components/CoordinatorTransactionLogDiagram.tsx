import React, { useState } from 'react';

interface LogEntry {
  id: number;
  state: string;
  timeOffset: string;
  desc: string;
  color: string;
  isDecision: boolean;
  recoveryNote: string;
}

const ENTRIES: LogEntry[] = [
  {
    id: 1,
    state: '[T1] STARTED',
    timeOffset: '+0.000s',
    desc: 'Transaction transaction scope initialized. Prepare broadcast starts.',
    color: '#38bdf8',
    isDecision: false,
    recoveryNote: 'If coordinator crashes now: No-op. On reboot, coordinator sees no prepare/decision and sends ABORT to clear any locks.',
  },
  {
    id: 2,
    state: '[T1] PREPARED',
    timeOffset: '+0.015s',
    desc: 'Coordinator registers all active participant branches (DB-A, DB-B).',
    color: '#38bdf8',
    isDecision: false,
    recoveryNote: 'If coordinator crashes now: Coordinator logs show preparing. On restart, queries nodes; since no decision was made, it aborts.',
  },
  {
    id: 3,
    state: '[T1] ALL VOTED YES',
    timeOffset: '+0.048s',
    desc: 'Coordinator receives positive prepares from all participant nodes.',
    color: '#34d399',
    isDecision: false,
    recoveryNote: 'If coordinator crashes now: Votes received but decision not flushed. On restart, coordinator will abort (safe fallback).',
  },
  {
    id: 4,
    state: '[T1] DECISION: COMMIT',
    timeOffset: '+0.050s',
    desc: 'POINT OF NO RETURN. Log block flushed durably to coordinator WAL via fsync().',
    color: '#34d399',
    isDecision: true,
    recoveryNote: 'If coordinator crashes now: On restart, coordinator tails WAL, sees COMMIT decision, and re-broadcasts COMMIT to nodes.',
  },
  {
    id: 5,
    state: '[T1] COMMIT SENT',
    timeOffset: '+0.052s',
    desc: 'Coordinator broadcasts Commit command to all participant branches.',
    color: '#a78bfa',
    isDecision: false,
    recoveryNote: 'If coordinator crashes now: Re-sends commit broadcast to any node that did not send ACK yet.',
  },
  {
    id: 6,
    state: '[T1] ACK RECEIVED',
    timeOffset: '+0.060s',
    desc: 'All participants confirmed success and released resource locks.',
    color: '#34d399',
    isDecision: false,
    recoveryNote: 'If coordinator crashes now: Transaction is completed. Locks released. Safe to mark completed.',
  },
  {
    id: 7,
    state: '[T1] COMPLETED',
    timeOffset: '+0.062s',
    desc: 'Transaction closed. State cleanup completed.',
    color: '#38bdf8',
    isDecision: false,
    recoveryNote: 'Clean finish. No recovery actions needed.',
  },
];

export default function CoordinatorTransactionLogDiagram(): React.JSX.Element {
  const [activeId, setActiveId] = useState<number>(4);

  const active = ENTRIES.find(e => e.id === activeId) || ENTRIES[3];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span style={{ color: '#34d399' }}>Coordinator Transaction Log Explorer</span>
      </div>

      <style>{`
        .coord-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .coord-grid {
            grid-template-columns: 1fr;
          }
        }
        .log-entry-item {
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .log-entry-item:hover {
          background: rgba(255,255,255,0.02);
          border-color: rgba(255,255,255,0.12);
        }
      `}</style>

      <div className="coord-grid">
        
        {/* Log list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ENTRIES.map(entry => {
            const isSelected = entry.id === activeId;
            return (
              <div
                key={entry.id}
                onClick={() => setActiveId(entry.id)}
                className="log-entry-item"
                style={{
                  borderLeft: `3px solid ${isSelected ? entry.color : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isSelected ? `0 0 8px ${entry.color}15` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>
                  <span>{entry.timeOffset}</span>
                  {entry.isDecision && (
                    <span style={{ color: '#ef4444', fontWeight: 900, textTransform: 'uppercase', fontSize: '8px' }}>
                      🔥 Point of No Return
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: isSelected ? entry.color : '#cbd5e1', fontWeight: 'bold', marginTop: '2px' }}>
                  {entry.state}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info panel */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${active.color}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '12px', color: active.color }}>
              Log Entry: {active.state}
            </h4>
            <span style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>
              Offset: {active.timeOffset}
            </span>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
            {active.desc}
          </div>

          <div style={{
            background: active.isDecision ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${active.isDecision ? '#ef4444' : active.color}`,
            borderRadius: '4px',
            padding: '8px 10px',
            fontSize: '11px',
            marginTop: '6px',
          }}>
            <span style={{ fontWeight: 'bold', color: active.isDecision ? '#ef4444' : '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8.5px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Crash Recovery Action
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
              {active.recoveryNote}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
