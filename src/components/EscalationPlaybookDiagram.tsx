import React, { useState } from 'react';

interface Level {
  num: number;
  title: string;
  time: string;
  color: string;
  bullets: string[];
  action: string;
}

const LEVELS: Level[] = [
  {
    num: 1, title: 'Automatic Retry', time: '0–5 minutes · 5 attempts', color: '#38bdf8', action: 'Retry executor handles it automatically',
    bullets: ['Transient errors only (network, timeout, optimistic lock)', 'Exponential backoff + full jitter', 'Logged at WARN level', 'If all 5 attempts fail → escalate to Level 2'],
  },
  {
    num: 2, title: 'Recovery Job', time: '5–30 minutes', color: '#4ade80', action: 'Scheduled job re-drives from last persisted state',
    bullets: ['Runs every 60s, finds sagas not updated in 5min+', 'Re-reads persisted saga state → re-publishes last command', 'Logged at WARN level', 'Idempotency keys ensure safe re-drive'],
  },
  {
    num: 3, title: 'DLQ Routing', time: '30 minutes', color: '#fb923c', action: 'Move to dead-letter queue for isolation',
    bullets: ['Saga moved to DLQ table / dead-letter Kafka topic', 'Isolated from healthy saga processing pipeline', 'Logged at ERROR level', 'Operator can replay or skip from DLQ'],
  },
  {
    num: 4, title: 'Manual Intervention Required', time: 'Immediately on permanent failure', color: '#f87171', action: 'PagerDuty fires · operator action required',
    bullets: ['SagaStatus → MANUAL_INTERVENTION_REQUIRED', 'PagerDuty / alerting fires critical alert', 'Admin dashboard shows full saga history', 'Operator can: retry step, skip step, force cancel, create adjustment'],
  },
  {
    num: 5, title: 'Business Resolution', time: 'Post-pivot failures', color: '#facc15', action: 'Finance / ops team resolves out-of-band',
    bullets: ['Post-pivot: technical undo is impossible (parcel shipped, wire sent)', 'Create return request / refund record / financial adjustment', 'Finance / ops team notified for manual resolution', 'Regulatory audit trail preserved in saga_state table'],
  },
];

export default function EscalationPlaybookDiagram(): React.JSX.Element {
  const [active, setActive] = useState<number | null>(null);
  const sel = active !== null ? LEVELS.find(l => l.num === active) : null;

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="interactive-diagram-indicator-dot card-indicator-red" />
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🚨 <span style={{ color: '#f87171' }}>Escalation Playbook</span> — Saga Failure Response Levels
        </h3>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 160" className="interactive-diagram-svg">
          <defs>
            <marker id="esc-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(148,163,184,0.4)" /></marker>
          </defs>

          {LEVELS.map((level, i) => {
            const x = 15 + i * 132;
            const isActive = active === level.num;
            const isDimmed = active !== null && !isActive;
            return (
              <g key={level.num} onClick={() => setActive(isActive ? null : level.num)} style={{ cursor: 'pointer' }}>
                {/* Vertical bar */}
                <rect x={x} y={20} width={118} height={120} rx={6}
                  fill={isActive ? `${level.color}15` : 'rgba(15,23,42,0.65)'}
                  stroke={isActive ? level.color : 'rgba(255,255,255,0.07)'}
                  strokeWidth={isActive ? 2 : 1}
                  opacity={isDimmed ? 0.3 : 1}
                  style={{ transition: 'all 0.15s' }}
                />
                {/* Level badge */}
                <rect x={x + 8} y={28} width={28} height={20} rx={4} fill={`${level.color}25`} stroke={level.color} strokeWidth="1" />
                <text x={x + 22} y={42} style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: level.color, textAnchor: 'middle' }}>L{level.num}</text>

                <text x={x + 59} y={41} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: isActive ? level.color : '#94a3b8', textAnchor: 'middle' }}>{level.title}</text>
                <text x={x + 59} y={54} style={{ fontFamily: 'Inter', fontSize: 7, fill: '#475569', textAnchor: 'middle' }}>{level.time}</text>

                {/* Dots */}
                {level.bullets.slice(0, 3).map((b, j) => (
                  <g key={j}>
                    <circle cx={x + 14} cy={72 + j * 18} r={2.5} fill={level.color} opacity={isDimmed ? 0.2 : 0.7} />
                    <text x={x + 22} y={76 + j * 18} style={{ fontFamily: 'Inter', fontSize: 6.5, fill: isDimmed ? '#334155' : '#64748b' }}>{b.slice(0, 22)}</text>
                  </g>
                ))}

                {/* Arrow to next */}
                {i < LEVELS.length - 1 && (
                  <>
                    <path id={`esc-arr-${i}`} d={`M ${x + 118} 80 L ${x + 130} 80`} fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" markerEnd="url(#esc-arr)" />
                    {isActive && (
                      <circle r="2" fill={level.color} opacity="0.6">
                        <animateMotion dur="0.6s" repeatCount="indefinite"><mpath href={`#esc-arr-${i}`} /></animateMotion>
                      </circle>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {sel ? (
        <div className="interactive-diagram-details-card" style={{ borderColor: `${sel.color}40`, background: `${sel.color}08` }}>
          <div className="interactive-diagram-card-header">
            <span className="interactive-diagram-indicator-dot" style={{ background: sel.color }} />
            <h3 style={{ color: sel.color }}>Level {sel.num}: {sel.title}</h3>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: `${sel.color}15`, color: sel.color, border: `1px solid ${sel.color}40` }}>{sel.time}</span>
          </div>
          <p><strong>Action taken:</strong> {sel.action}</p>
          <ul>{sel.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
        </div>
      ) : (
        <p className="interactive-diagram-helper-text">💡 Click any level to see what happens at that escalation stage.</p>
      )}
    </div>
  );
}
