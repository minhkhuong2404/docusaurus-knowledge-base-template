import React, { useState } from 'react';

type SagaStatus = 'STARTED' | 'STOCK_RESERVED' | 'STOCK_RESERVATION_FAILED' | 'PAYMENT_PROCESSED' | 'PAYMENT_FAILED' | 'NOTIFIED' | 'COMPLETED' | 'COMPENSATING' | 'CANCELLED' | 'MANUAL_INTERVENTION_REQUIRED';

interface StateInfo {
  label: string;
  color: string;
  description: string;
  x: number; y: number; w: number;
  terminal?: boolean;
  warning?: boolean;
}

const STATES: Record<SagaStatus, StateInfo> = {
  STARTED:                      { label: 'STARTED',                  color: '#38bdf8', description: 'Saga initiated. Initial state persisted. First command published.',               x: 20,  y: 10, w: 115 },
  STOCK_RESERVED:               { label: 'STOCK_RESERVED',           color: '#4ade80', description: 'Stock reservation succeeded. Ready to trigger payment.',                         x: 175, y: 10, w: 140 },
  PAYMENT_PROCESSED:            { label: 'PAYMENT_PROCESSED',        color: '#4ade80', description: 'Payment charged successfully. Notification step next.',                          x: 355, y: 10, w: 155 },
  NOTIFIED:                     { label: 'NOTIFIED',                  color: '#4ade80', description: 'Confirmation sent to customer.',                                                 x: 550, y: 10, w: 100 },
  COMPLETED:                    { label: 'COMPLETED ✅',              color: '#4ade80', description: 'Saga reached happy terminal state. Order confirmed.',                            x: 570, y: 75, w: 110, terminal: true },
  STOCK_RESERVATION_FAILED:     { label: 'STOCK_FAIL',               color: '#fb923c', description: 'Stock reservation failed (permanent). No compensation needed — nothing committed.', x: 175, y: 80, w: 100 },
  PAYMENT_FAILED:               { label: 'PAYMENT_FAILED',           color: '#f87171', description: 'Payment failed. Compensation will release the reserved stock.',                   x: 355, y: 80, w: 120 },
  COMPENSATING:                 { label: 'COMPENSATING',             color: '#f87171', description: 'Executing compensating transactions in reverse order.',                            x: 355, y: 150, w: 120 },
  CANCELLED:                    { label: 'CANCELLED ✅',              color: '#94a3b8', description: 'Saga fully compensated. Terminal state — order cancelled.',                       x: 175, y: 150, w: 115, terminal: true },
  MANUAL_INTERVENTION_REQUIRED: { label: 'MANUAL REQ ⚠️',           color: '#facc15', description: 'Compensation failed. PagerDuty fired. Ops team must resolve manually.',           x: 500, y: 150, w: 155, terminal: true, warning: true },
};

const EDGES: [SagaStatus, SagaStatus, string][] = [
  ['STARTED', 'STOCK_RESERVED', 'StockReserved'],
  ['STARTED', 'STOCK_RESERVATION_FAILED', 'StockFailed'],
  ['STOCK_RESERVED', 'PAYMENT_PROCESSED', 'PaymentOK'],
  ['STOCK_RESERVED', 'PAYMENT_FAILED', 'PaymentFail'],
  ['PAYMENT_PROCESSED', 'NOTIFIED', 'EmailSent'],
  ['NOTIFIED', 'COMPLETED', 'terminal'],
  ['STOCK_RESERVATION_FAILED', 'CANCELLED', 'terminal'],
  ['PAYMENT_FAILED', 'COMPENSATING', 'start comp'],
  ['COMPENSATING', 'CANCELLED', 'comp OK'],
  ['COMPENSATING', 'MANUAL_INTERVENTION_REQUIRED', 'comp failed'],
];

function nodeCenter(id: SagaStatus): [number, number] {
  const s = STATES[id];
  return [s.x + s.w / 2, s.y + 14];
}

export default function SagaStateMachineDiagram(): React.JSX.Element {
  const [active, setActive] = useState<SagaStatus | null>(null);

  const connected = active
    ? EDGES.flatMap(([f, t]) => {
        if (f === active) return [t];
        if (t === active) return [f];
        return [];
      })
    : [];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="interactive-diagram-indicator-dot card-indicator-cyan" />
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🤖 <span style={{ color: '#a78bfa' }}>Saga State Machine</span> — Order Saga Lifecycle
        </h3>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 690 195" className="interactive-diagram-svg">
          <defs>
            <marker id="ssm-arr-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#4ade80" /></marker>
            <marker id="ssm-arr-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#f87171" /></marker>
            <marker id="ssm-arr-orange" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#fb923c" /></marker>
            <marker id="ssm-arr-dim" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(100,116,139,0.3)" /></marker>
          </defs>

          {/* Edges */}
          {EDGES.map(([from, to, label]) => {
            const [x1, y1] = nodeCenter(from);
            const [x2, y2] = nodeCenter(to);
            const isActive = active === from || active === to;
            const isDimmed = active !== null && !isActive;
            const edgeId = `ssm-${from}-${to}`;
            const toState = STATES[to];
            const edgeColor = toState.warning ? '#facc15' : toState.terminal ? '#94a3b8' : toState.color === '#f87171' || toState.color === '#fb923c' ? '#f87171' : '#4ade80';
            const markerSuffix = isDimmed ? 'dim' : edgeColor === '#f87171' ? 'red' : edgeColor === '#fb923c' ? 'orange' : 'green';

            return (
              <g key={edgeId}>
                <path id={edgeId}
                  d={`M ${x1} ${y1 + 9} L ${x2} ${y2 - 8}`}
                  fill="none"
                  stroke={isDimmed ? 'rgba(100,116,139,0.1)' : isActive ? edgeColor : 'rgba(148,163,184,0.2)'}
                  strokeWidth={isActive ? 1.5 : 1}
                  markerEnd={`url(#ssm-arr-${markerSuffix})`}
                  style={{ transition: 'stroke 0.2s' }}
                />
                {isActive && label !== 'terminal' && (
                  <>
                    <circle r="2.5" fill={edgeColor} opacity="0.85">
                      <animateMotion dur="0.7s" repeatCount="indefinite"><mpath href={`#${edgeId}`} /></animateMotion>
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {/* State nodes */}
          {(Object.entries(STATES) as [SagaStatus, StateInfo][]).map(([id, s]) => {
            const isActive = active === id;
            const isConn = connected.includes(id);
            const isDimmed = active !== null && !isActive && !isConn;
            return (
              <g key={id} onClick={() => setActive(isActive ? null : id)} style={{ cursor: 'pointer' }}>
                <rect x={s.x} y={s.y} width={s.w} height={22} rx={4}
                  fill={isActive ? `${s.color}20` : isConn ? `${s.color}10` : 'rgba(15,23,42,0.65)'}
                  stroke={isActive ? s.color : isConn ? `${s.color}60` : 'rgba(255,255,255,0.07)'}
                  strokeWidth={isActive ? 2 : 1}
                  opacity={isDimmed ? 0.25 : 1}
                  style={{ transition: 'all 0.15s' }}
                />
                <text x={s.x + s.w / 2} y={s.y + 14}
                  style={{ fontFamily: 'Inter', fontSize: 7.5, fontWeight: isActive ? 800 : 600, fill: isDimmed ? 'rgba(100,116,139,0.3)' : isActive ? s.color : isConn ? s.color : '#64748b', textAnchor: 'middle', transition: 'fill 0.15s' }}>
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {active && STATES[active] && (
        <div className="interactive-diagram-details-card" style={{ borderColor: `${STATES[active].color}40`, background: `${STATES[active].color}08` }}>
          <div className="interactive-diagram-card-header">
            <span className="interactive-diagram-indicator-dot" style={{ background: STATES[active].color }} />
            <h3 style={{ color: STATES[active].color }}>{STATES[active].label}</h3>
            {STATES[active].terminal && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' }}>Terminal State</span>}
          </div>
          <p>{STATES[active].description}</p>
          {connected.length > 0 && (
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              <strong>Connected states:</strong> {connected.map(c => STATES[c].label).join(', ')}
            </p>
          )}
        </div>
      )}
      {!active && <p className="interactive-diagram-helper-text">💡 Click any state to highlight its transitions and see description.</p>}
    </div>
  );
}
