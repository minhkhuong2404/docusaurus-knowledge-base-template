import React, { useState } from 'react';

interface StrategyDetail {
  id: string;
  tabLabel: string;
  title: string;
  color: string;
  explanation: string;
  orderResult: string;
  impactNote: string;
  outcomeType: 'BAD' | 'GOOD';
}

const STRATEGIES: Record<string, StrategyDetail> = {
  STANDARD_DLQ: {
    id: 'STANDARD_DLQ',
    tabLabel: '1. Standard DLQ Routing',
    title: 'Standard DLQ (Out-of-Order Execution)',
    color: '#ef4444',
    explanation: 'When a message fails, it is moved to the DLQ. Subsequent messages are processed immediately. This maintains high throughput but breaks strict message ordering.',
    orderResult: 'Execution Order: TXN-100 → TXN-102 (First Delivery) → TXN-101 (Redriven later) ❌',
    impactNote: 'High Risk: If TXN-102 depends on state updates from TXN-101 (e.g., withdraw validation based on deposits), out-of-order execution causes permanent data corruption or negative balances.',
    outcomeType: 'BAD',
  },
  PAUSE_PARTITION: {
    id: 'PAUSE_PARTITION',
    tabLabel: '2. Pause Partition',
    title: 'Pause Partition (Ordering Preserved)',
    color: '#34d399',
    explanation: 'When a message fails, consumption from that partition is paused entirely. No subsequent messages are read. Human alert is triggered to resolve the blocker.',
    orderResult: 'Execution Order: TXN-100 → TXN-101 (Fixed & Reprocessed) → TXN-102 (Processed next) ✅',
    impactNote: 'High Consistency: Guarantees strict ordering. However, it sacrifices partition throughput — a single poison pill halts all operations for that partition until fixed.',
    outcomeType: 'GOOD',
  },
};

export default function DlqOrderingThroughputDiagram(): React.JSX.Element {
  const [activeStrategy, setActiveStrategy] = useState<string>('STANDARD_DLQ');

  const current = STRATEGIES[activeStrategy];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: '#34d399' }}>Ordering vs. Throughput Trade-off Layout</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {Object.values(STRATEGIES).map(strat => (
          <button
            key={strat.id}
            onClick={() => setActiveStrategy(strat.id)}
            style={{
              padding: '6px 12px', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 700, fontSize: '11px',
              background: activeStrategy === strat.id ? 'rgba(52,211,153,0.15)' : 'transparent',
              color: activeStrategy === strat.id ? '#34d399' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${activeStrategy === strat.id ? '#34d39950' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            {strat.tabLabel}
          </button>
        ))}
      </div>

      <style>{`
        .ordering-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .ordering-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="ordering-grid">

        {/* SVG Viewport */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="ord-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="ord-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={current.color} />
              </marker>
            </defs>

            {/* Queue items pipeline */}
            {/* Main pipeline track */}
            <line x1="20" y1="60" x2="220" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />

            {/* TXN Blocks in Queue */}
            {/* TXN-100 (Processed) */}
            <g>
              <rect x="235" y="45" width="55" height="30" rx="4" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.2" />
              <text x="262.5" y="63" textAnchor="middle" fill="#34d399" fontSize="7.5" fontWeight="bold">TXN-100</text>
            </g>

            {/* TXN-101 (The Blocker/Fail) */}
            {activeStrategy === 'STANDARD_DLQ' ? (
              <g>
                {/* Standard DLQ: routes to DLQ below */}
                <rect x="150" y="45" width="55" height="30" rx="4" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="1.2" />
                <text x="177.5" y="63" textAnchor="middle" fill="#ef4444" fontSize="7.5" fontWeight="bold">TXN-101 💥</text>

                {/* DLQ below */}
                <rect x="150" y="130" width="55" height="30" rx="4" fill="rgba(244,114,182,0.1)" stroke="#f472b6" strokeWidth="1.2" />
                <text x="177.5" y="148" textAnchor="middle" fill="#f472b6" fontSize="7" fontWeight="bold">DLQ</text>

                {/* Ingress to DLQ */}
                <path d="M 177.5 75 L 177.5 122" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3"
                  className="interactive-diagram-flowing-path" markerEnd="url(#ord-arr-color)" />
              </g>
            ) : (
              <g>
                {/* Pause Partition: blocks the queue here */}
                <rect x="150" y="45" width="55" height="30" rx="4" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="177.5" y="63" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontWeight="bold">TXN-101 💥</text>
                <text x="177.5" y="86" textAnchor="middle" fill="#fbbf24" fontSize="6.5" fontWeight="bold">PAUSED 🛑</text>
              </g>
            )}

            {/* TXN-102 (Next in line) */}
            {activeStrategy === 'STANDARD_DLQ' ? (
              <g>
                {/* Standard DLQ: TXN-102 bypasses and processes next */}
                <rect x="65" y="45" width="55" height="30" rx="4" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="92.5" y="63" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="bold">TXN-102</text>

                {/* Flow line bypassing 101 */}
                <path d="M 120 60 C 135 30, 210 30, 230 50" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2"
                  className="interactive-diagram-flowing-path" markerEnd="url(#ord-arr)" />
                <text x="165" y="24" textAnchor="middle" fill="#38bdf8" fontSize="6.5">Bypasses failed txn</text>
              </g>
            ) : (
              <g>
                {/* Pause Partition: TXN-102 is blocked and remains in queue */}
                <rect x="65" y="45" width="55" height="30" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <text x="92.5" y="63" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="bold">TXN-102</text>
                <text x="92.5" y="86" textAnchor="middle" fill="#ef4444" fontSize="6">Blocked in line 🔒</text>
              </g>
            )}

            {/* Consumer box */}
            <rect x="235" y="125" width="85" height="40" rx="5" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            <text x="277.5" y="142" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">Consumer</text>

            {activeStrategy === 'STANDARD_DLQ' ? (
              <text x="277.5" y="154" textAnchor="middle" fill="#38bdf8" fontSize="6.5">Processing TXN-102</text>
            ) : (
              <text x="277.5" y="154" textAnchor="middle" fill="#ef4444" fontSize="6.5">Consumer Starved 🛑</text>
            )}
          </svg>
        </div>

        {/* Info panel */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>

          <div>
            <h3 style={{ color: current.color }}>{current.title}</h3>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {current.explanation}
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${current.color}`,
            borderRadius: '4px',
            padding: '8px 10px',
            fontSize: '10.5px',
          }}>
            <span style={{ fontWeight: 'bold', color: current.color, display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Consistency Result
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, fontFamily: 'monospace' }}>
              {current.orderResult}
            </span>
          </div>

          <div style={{
            background: current.outcomeType === 'BAD' ? 'rgba(239,68,68,0.04)' : 'rgba(52,211,153,0.04)',
            border: `1px solid ${current.outcomeType === 'BAD' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)'}`,
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '11px',
          }}>
            <div style={{ fontSize: '8.5px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '3px' }}>
              {current.outcomeType === 'BAD' ? '💣 Data Corruption Risk' : '🛡️ Strict Safety Guarantee'}
            </div>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {current.impactNote}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
