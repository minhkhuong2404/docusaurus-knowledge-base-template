import React, { useState } from 'react';

type Style = 'choreography' | 'orchestration';

export default function SagaCoordinationDiagram(): React.JSX.Element {
  const [style, setStyle] = useState<Style>('choreography');

  const services = ['OrderService', 'InventoryService', 'PaymentService'];
  const colors = ['#38bdf8', '#4ade80', '#a78bfa'];
  const boxW = 110, boxH = 36;

  // Choreography positions: evenly spaced
  const choreoX = [40, 285, 530];
  // Orchestration: orchestrator in center top, services in row below
  const orchServX = [40, 285, 530];
  const orchY = 130;
  const orchOrcX = 265, orchOrcY = 20;

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={style === 'choreography' ? '#38bdf8' : '#a78bfa'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle', transition: 'stroke 0.2s' }}>{style === 'choreography' ? (<><circle cx="12" cy="5" r="3" /><circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" /><path d="M9 7l-2 7" /><path d="M15 7l2 7" /><path d="M8 17h8" /></>) : (<><circle cx="12" cy="12" r="3" /><circle cx="12" cy="4" r="2" /><circle cx="4" cy="12" r="2" /><circle cx="20" cy="12" r="2" /><circle cx="12" cy="20" r="2" /><path d="M12 7v2" /><path d="M12 15v3" /><path d="M7 12H9" /><path d="M15 12h3" /></>)}</svg><span style={{ color: style === 'choreography' ? '#38bdf8' : '#a78bfa' }}>{style === 'choreography' ? 'Choreography' : 'Orchestration'}</span> — Coordination Style
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setStyle('choreography')} style={{ background: style === 'choreography' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${style === 'choreography' ? '#38bdf8' : 'rgba(255,255,255,0.07)'}`, borderRadius: 4, color: style === 'choreography' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>Choreography</button>
          <button onClick={() => setStyle('orchestration')} style={{ background: style === 'orchestration' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${style === 'orchestration' ? '#a78bfa' : 'rgba(255,255,255,0.07)'}`, borderRadius: 4, color: style === 'orchestration' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>Orchestration</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 210" className="interactive-diagram-svg">
          <defs>
            <marker id="coord-arr-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" /></marker>
            <marker id="coord-arr-purple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#a78bfa" /></marker>
            <marker id="coord-arr-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#4ade80" /></marker>
          </defs>

          {style === 'choreography' ? (
            <>
              {/* Service boxes in a row */}
              {services.map((svc, i) => (
                <g key={svc}>
                  <rect x={choreoX[i]} y={20} width={boxW} height={boxH} rx={5} fill={`${colors[i]}10`} stroke={colors[i]} strokeWidth={1.5} />
                  <text x={choreoX[i] + boxW / 2} y={42} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: colors[i], textAnchor: 'middle' }}>{svc}</text>
                </g>
              ))}

              {/* Bidirectional event arrows */}
              {[[0, 1], [1, 2]].map(([a, b]) => {
                const x1 = choreoX[a] + boxW, y = 38;
                const x2 = choreoX[b];
                const fwdId = `choreo-fwd-${a}`;
                const bkId = `choreo-bk-${a}`;
                return (
                  <g key={fwdId}>
                    <path id={fwdId} d={`M ${x1} ${y - 5} L ${x2} ${y - 5}`} fill="none" stroke="#38bdf8" strokeWidth={1.2} markerEnd="url(#coord-arr-cyan)" className="interactive-diagram-flowing-path" />
                    <circle r="2" fill="#38bdf8" opacity="0.8"><animateMotion dur="0.9s" repeatCount="indefinite"><mpath href={`#${fwdId}`} /></animateMotion></circle>
                    <path id={bkId} d={`M ${x2} ${y + 5} L ${x1} ${y + 5}`} fill="none" stroke="#4ade80" strokeWidth={1.2} markerEnd="url(#coord-arr-green)" className="interactive-diagram-flowing-path" />
                    <circle r="2" fill="#4ade80" opacity="0.8"><animateMotion dur="0.9s" repeatCount="indefinite" begin="0.45s"><mpath href={`#${bkId}`} /></animateMotion></circle>
                    {/* Event labels */}
                    <text x={(x1 + x2) / 2} y={y - 10} style={{ fontFamily: 'Inter', fontSize: 7, fill: '#38bdf8', textAnchor: 'middle', fontStyle: 'italic' }}>
                      {a === 0 ? '→ OrderCreated' : '→ StockReserved'}
                    </text>
                    <text x={(x1 + x2) / 2} y={y + 18} style={{ fontFamily: 'Inter', fontSize: 7, fill: '#4ade80', textAnchor: 'middle', fontStyle: 'italic' }}>
                      {a === 0 ? '← event reply' : '← event reply'}
                    </text>
                  </g>
                );
              })}

              {/* Insight boxes */}
              <rect x="40" y="80" width="600" height="110" rx="6" fill="rgba(56,189,248,0.04)" stroke="rgba(56,189,248,0.1)" />
              <text x="55" y="96" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#38bdf8' }}>Choreography Properties:</text>
              {[
                '• Each service reacts to events from the previous → workflow is implicit',
                '• No central controller — distributed decision-making',
                '• Decoupled in theory, but coupled by event contracts in practice',
                '• Simple 2–4 step flows: fine. Complex branching: workflow becomes invisible.',
              ].map((t, i) => (
                <text key={i} x="55" y={112 + i * 16} style={{ fontFamily: 'Inter', fontSize: 8, fill: '#94a3b8' }}>{t}</text>
              ))}
            </>
          ) : (
            <>
              {/* Orchestrator box */}
              <rect x={orchOrcX} y={orchOrcY} width={150} height={36} rx={6} fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth={2} />
              <text x={orchOrcX + 75} y={33} style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#a78bfa', textAnchor: 'middle' }}>Saga Orchestrator</text>
              <text x={orchOrcX + 75} y={48} style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#a78bfa80', textAnchor: 'middle' }}>State Machine</text>

              {/* Service boxes */}
              {services.map((svc, i) => (
                <g key={svc}>
                  <rect x={orchServX[i]} y={orchY} width={boxW} height={boxH} rx={5} fill={`${colors[i]}10`} stroke={colors[i]} strokeWidth={1.5} />
                  <text x={orchServX[i] + boxW / 2} y={orchY + 22} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: colors[i], textAnchor: 'middle' }}>{svc}</text>
                </g>
              ))}

              {/* Orchestrator → services arrows */}
              {services.map((_, i) => {
                const sx = orchServX[i] + boxW / 2;
                const cmdId = `orch-cmd-${i}`;
                const repId = `orch-rep-${i}`;
                return (
                  <g key={cmdId}>
                    <path id={cmdId} d={`M ${orchOrcX + 75} ${orchOrcY + 36} Q ${orchOrcX + 75} ${(orchOrcY + orchY) / 2} ${sx} ${orchY}`} fill="none" stroke="#a78bfa" strokeWidth={1.5} markerEnd="url(#coord-arr-purple)" className="interactive-diagram-flowing-path" />
                    <circle r="2.5" fill="#a78bfa" opacity="0.8"><animateMotion dur="0.9s" repeatCount="indefinite" begin={`${i * 0.3}s`}><mpath href={`#${cmdId}`} /></animateMotion></circle>
                    <path id={repId} d={`M ${sx} ${orchY} Q ${sx} ${(orchOrcY + orchY) / 2} ${orchOrcX + 75} ${orchOrcY + 36}`} fill="none" stroke="#4ade80" strokeWidth={1} strokeDasharray="4,3" markerEnd="url(#coord-arr-green)" />
                  </g>
                );
              })}

              {/* Labels */}
              <text x="340" y="95" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#a78bfa', textAnchor: 'middle', fontStyle: 'italic' }}>→ command  ← reply (dashed)</text>

              {/* Insight */}
              <rect x="40" y="175" width="600" height="30" rx="5" fill="rgba(167,139,250,0.05)" stroke="rgba(167,139,250,0.1)" />
              <text x="55" y="194" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#94a3b8' }}>• Explicit workflow in one place · Full audit log · Centralized compensation · Easier to debug</text>
            </>
          )}
        </svg>
      </div>

      <p className="interactive-diagram-helper-text">💡 Toggle to compare how the same saga plays out under each coordination style.</p>
    </div>
  );
}
