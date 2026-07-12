import React, { useState } from 'react';

type Step = 'cmd-inv' | 'reply-inv-ok' | 'reply-inv-fail' | 'cmd-pay' | 'reply-pay-ok' | 'reply-pay-fail' | 'cmd-notify' | 'comp-release';

const FLOW_STEPS: { id: Step; label: string; color: string; detail: string }[] = [
  { id: 'cmd-inv',       label: '① ReserveStock command',          color: '#38bdf8', detail: 'Orchestrator publishes ReserveStockCommand to inventory-commands topic. SagaId used as Kafka key → same partition.' },
  { id: 'reply-inv-ok',  label: '② StockReserved reply',          color: '#4ade80', detail: 'Inventory service processes command, commits reservation, publishes StockReserved to inventory-replies. Orchestrator handles reply async.' },
  { id: 'reply-inv-fail',label: '② StockReservationFailed reply',  color: '#f87171', detail: 'Inventory has no stock. Publishes StockReservationFailed. Orchestrator marks STOCK_RESERVATION_FAILED → CANCELLED.' },
  { id: 'cmd-pay',       label: '③ ProcessPayment command',        color: '#a78bfa', detail: 'After StockReserved: orchestrator publishes ProcessPaymentCommand to payment-commands. No thread blocked waiting.' },
  { id: 'reply-pay-ok',  label: '④ PaymentProcessed reply',        color: '#4ade80', detail: 'Payment succeeds. Publishes PaymentProcessed to payment-replies. Orchestrator sends notification command.' },
  { id: 'reply-pay-fail',label: '④ PaymentFailed reply',           color: '#f87171', detail: 'Payment fails. Orchestrator transitions to COMPENSATING, publishes ReleaseStock compensation command.' },
  { id: 'cmd-notify',    label: '⑤ SendConfirmation command',      color: '#fb923c', detail: 'Orchestrator publishes notification command. On reply: marks NOTIFIED → COMPLETED.' },
  { id: 'comp-release',  label: '⑤ ReleaseStock (compensation)',   color: '#f87171', detail: 'Compensation: orchestrator publishes ReleaseStockCommand. On StockReleased reply: marks CANCELLED.' },
];

export default function KafkaAsyncOrchestrationDiagram(): React.JSX.Element {
  const [active, setActive] = useState<Step | null>(null);

  const sel = active ? FLOW_STEPS.find(s => s.id === active) : null;

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="22" y1="3" x2="12" y2="10" /><line x1="2" y1="3" x2="12" y2="10" /></svg><span style={{ color: '#38bdf8' }}>Async Kafka Orchestration</span> — Command &amp; Reply Topics
        </h3>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            <marker id="kafka-arr-b" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" /></marker>
            <marker id="kafka-arr-g" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#4ade80" /></marker>
            <marker id="kafka-arr-r" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#f87171" /></marker>
            <marker id="kafka-arr-p" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#a78bfa" /></marker>
          </defs>

          {/* Orchestrator */}
          <rect x="230" y="10" width="220" height="36" rx="6" fill="rgba(167,139,250,0.1)" stroke="#a78bfa" strokeWidth="1.5" />
          <text x="340" y="27" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#a78bfa', textAnchor: 'middle' }}>Saga Orchestrator</text>
          <text x="340" y="40" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#a78bfa80', textAnchor: 'middle' }}>Non-blocking · publishes commands · handles replies</text>

          {/* Kafka topics: command left, reply right */}
          {[
            { x: 20,  y: 90, w: 155, label: 'inventory-commands', color: '#38bdf8', sub: '← ReserveStock / ReleaseStock' },
            { x: 20,  y: 140, w: 155, label: 'inventory-replies',  color: '#4ade80', sub: '→ StockReserved / StockFailed' },
            { x: 505, y: 90,  w: 155, label: 'payment-commands',   color: '#a78bfa', sub: '← ProcessPayment' },
            { x: 505, y: 140, w: 155, label: 'payment-replies',    color: '#4ade80', sub: '→ PaymentProcessed / Failed' },
          ].map(t => (
            <g key={t.label}>
              <rect x={t.x} y={t.y} width={t.w} height={36} rx="4" fill={`${t.color}08`} stroke={t.color} strokeWidth="1.2" strokeDasharray="4,2" />
              <text x={t.x + t.w / 2} y={t.y + 14} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: t.color, textAnchor: 'middle' }}>{t.label}</text>
              <text x={t.x + t.w / 2} y={t.y + 26} style={{ fontFamily: 'Inter', fontSize: 6.5, fill: '#64748b', textAnchor: 'middle' }}>{t.sub}</text>
            </g>
          ))}

          {/* Orch → inventory-commands */}
          <path id="k-oc" d="M 230 35 Q 120 35 120 90" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#kafka-arr-b)" className="interactive-diagram-flowing-path" />
          <circle r="2.5" fill="#38bdf8" opacity="0.85"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#k-oc" /></animateMotion></circle>

          {/* inventory-replies → Orch */}
          <path id="k-ri" d="M 120 140 Q 120 175 230 175 Q 230 46 230 46" fill="none" stroke="#4ade80" strokeWidth="1.2" markerEnd="url(#kafka-arr-g)" className="interactive-diagram-flowing-path" />
          <circle r="2.5" fill="#4ade80" opacity="0.85"><animateMotion dur="1s" repeatCount="indefinite" begin="0.5s"><mpath href="#k-ri" /></animateMotion></circle>

          {/* Orch → payment-commands */}
          <path id="k-pc" d="M 450 35 Q 560 35 560 90" fill="none" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#kafka-arr-p)" className="interactive-diagram-flowing-path" />
          <circle r="2.5" fill="#a78bfa" opacity="0.85"><animateMotion dur="1s" repeatCount="indefinite" begin="0.3s"><mpath href="#k-pc" /></animateMotion></circle>

          {/* payment-replies → Orch */}
          <path id="k-rp" d="M 560 140 Q 560 175 450 175 Q 450 46 450 46" fill="none" stroke="#4ade80" strokeWidth="1.2" markerEnd="url(#kafka-arr-g)" className="interactive-diagram-flowing-path" />
          <circle r="2.5" fill="#4ade80" opacity="0.85"><animateMotion dur="1s" repeatCount="indefinite" begin="0.8s"><mpath href="#k-rp" /></animateMotion></circle>

          {/* Kafka broker label */}
          <rect x="188" y="88" width="305" height="92" rx="5" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.05)" />
          <text x="340" y="105" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: 'rgba(255,255,255,0.2)', textAnchor: 'middle' }}>KAFKA BROKER</text>
          <text x="340" y="118" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: 'rgba(255,255,255,0.12)', textAnchor: 'middle' }}>SagaId used as message key → partition affinity</text>
          <text x="340" y="130" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: 'rgba(255,255,255,0.12)', textAnchor: 'middle' }}>Orchestrator thread never blocks</text>
          <text x="340" y="142" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: 'rgba(255,255,255,0.12)', textAnchor: 'middle' }}>Saga can span minutes / hours / human approval</text>
          <text x="340" y="154" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: 'rgba(255,255,255,0.12)', textAnchor: 'middle' }}>At-least-once delivery + idempotency = exactly-once effect</text>
          <text x="340" y="170" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: 'rgba(255,255,255,0.12)', textAnchor: 'middle' }}>notification-commands / notification-replies (not shown)</text>
        </svg>
      </div>

      {/* Step chips */}
      <div style={{ padding: '8px 1rem', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {FLOW_STEPS.map(s => (
          <button key={s.id} onClick={() => setActive(active === s.id ? null : s.id)}
            style={{ background: active === s.id ? `${s.color}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${active === s.id ? s.color : 'rgba(255,255,255,0.07)'}`, borderRadius: 4, color: active === s.id ? s.color : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
            {s.label}
          </button>
        ))}
      </div>

      {sel && (
        <div className="interactive-diagram-details-card" style={{ borderColor: `${sel.color}40`, background: `${sel.color}08` }}>
          <div className="interactive-diagram-card-header">
            
            <h3 style={{ color: sel.color }}>{sel.label}</h3>
          </div>
          <p>{sel.detail}</p>
        </div>
      )}
      {!sel && <p className="interactive-diagram-helper-text">💡 Click a step chip above to see what happens at that point in the async Kafka-based orchestration.</p>}
    </div>
  );
}
