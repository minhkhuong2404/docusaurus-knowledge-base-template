import React, { useState } from 'react';

type TabId = 'framework' | 'doublebooking' | 'lifecycle';

interface Node {
  id: string;
  label: string;
  sub: string;
  color: string;
}

const FRAMEWORK: Node[] = [
  { id: '1', label: '1. Requirements', sub: 'Functional, non-functional, scope cuts', color: '#38bdf8' },
  { id: '2', label: '2. Estimation', sub: 'QPS, storage, bandwidth, read/write ratio', color: '#34d399' },
  { id: '3', label: '3. API + Data Model', sub: 'Endpoints, idempotency, schema, indexes', color: '#fbbf24' },
  { id: '4', label: '4. High-Level Design', sub: 'Services, queues, caches, data flows', color: '#a78bfa' },
  { id: '5', label: '5. Deep Dives + Tradeoffs', sub: 'Bottlenecks, failure modes, extensions', color: '#f472b6' },
];

const STRATEGIES = [
  {
    name: 'Pessimistic lock',
    color: '#f87171',
    how: 'SELECT ... FOR UPDATE on the inventory row inside the booking transaction.',
    pros: 'Simple and always correct on a single primary.',
    cons: 'Lock contention on hot hotels; holds a row lock while calling payment (never do that).',
  },
  {
    name: 'Optimistic version',
    color: '#34d399',
    how: 'UPDATE inventory SET booked = booked + 1, version = version + 1 WHERE id = ? AND version = ?; retry on 0 rows.',
    pros: 'No locks held; scales for low-contention inventory.',
    cons: 'Retry storms under flash-sale contention.',
  },
  {
    name: 'Conditional decrement',
    color: '#38bdf8',
    how: 'UPDATE ... SET available = available - 1 WHERE room_type_id = ? AND date = ? AND available > 0.',
    pros: 'One atomic statement; no read-modify-write race; best default.',
    cons: 'Needs per-night rows; multi-night stays must update all nights in one transaction.',
  },
  {
    name: 'Hold with TTL',
    color: '#fbbf24',
    how: 'Create a PENDING reservation with expires_at (about 10 min), pay, then CONFIRM. A sweeper expires stale holds.',
    pros: 'Prevents holding DB locks across a slow payment call.',
    cons: 'Extra state machine and expiry job; inventory is temporarily unavailable.',
  },
];

const LIFECYCLE = ['SEARCH', 'HOLD (PENDING)', 'PAYMENT', 'CONFIRMED', 'CANCELLED / EXPIRED'];

const btn = (active: boolean, color: string): React.CSSProperties => ({
  padding: '6px 12px',
  borderRadius: 4,
  fontSize: '0.74rem',
  cursor: 'pointer',
  color: active ? color : '#94a3b8',
  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
  border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
});

export default function SeniorDesignCourseDiagram({ initialTab = 'framework' }: { initialTab?: TabId }): React.JSX.Element {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [sel, setSel] = useState<number>(0);
  const [step, setStep] = useState<number>(0);

  const strat = STRATEGIES[sel];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="5" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <circle cx="19" cy="6" r="2" />
          <path d="M6.5 7.5L11 16.5M17.5 7.5L13 16.5M7 6h10" />
        </svg>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>Senior Engineer Design Explorer</h3>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0.8rem 1rem 0', flexWrap: 'wrap' }}>
        <button style={btn(tab === 'framework', '#38bdf8')} onClick={() => setTab('framework')}>5-Step Framework</button>
        <button style={btn(tab === 'doublebooking', '#f87171')} onClick={() => setTab('doublebooking')}>Double-Booking Defenses</button>
        <button style={btn(tab === 'lifecycle', '#34d399')} onClick={() => setTab('lifecycle')}>Reservation Lifecycle</button>
      </div>

      <div className="interactive-diagram-grid-bg" style={{ padding: '1rem' }}>
        {tab === 'framework' && (
          <svg viewBox="0 0 700 120" width="100%" role="img" aria-label="Five step design framework">
            <defs>
              {FRAMEWORK.map((n) => (
                <marker key={n.id} id={`fw-arrow-${n.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0 0L10 5L0 10z" fill={n.color} />
                </marker>
              ))}
            </defs>
            {FRAMEWORK.map((n, i) => (
              <g key={n.id} onClick={() => setStep(i)} style={{ cursor: 'pointer' }}>
                <rect x={4 + i * 140} y={20} width={118} height={60} rx={8} fill="#0d0f1e" stroke={n.color} strokeWidth={step === i ? 3 : 1.2} />
                <text x={63 + i * 140} y={46} textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">{n.label}</text>
                <text x={63 + i * 140} y={64} textAnchor="middle" fontSize="8" fill="#94a3b8">step {n.id}</text>
                {i < FRAMEWORK.length - 1 && (
                  <path className="interactive-diagram-flowing-path" d={`M${128 + i * 140} 50H${140 + i * 140}`} stroke={n.color} strokeWidth="2" strokeDasharray="4 3" fill="none" markerEnd={`url(#fw-arrow-${n.id})`} />
                )}
              </g>
            ))}
          </svg>
        )}
        {tab === 'framework' && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#e2e8f0' }}>
            <strong style={{ color: FRAMEWORK[step].color }}>{FRAMEWORK[step].label}:</strong> {FRAMEWORK[step].sub}
          </p>
        )}

        {tab === 'doublebooking' && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {STRATEGIES.map((s, i) => (
                <button key={s.name} style={btn(sel === i, s.color)} onClick={() => setSel(i)}>{s.name}</button>
              ))}
            </div>
            <div style={{ background: '#0c0e17', border: `1px solid ${strat.color}`, borderRadius: 8, padding: '0.8rem 1rem' }}>
              <div style={{ color: strat.color, fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>{strat.name}</div>
              <div style={{ color: '#e2e8f0', fontSize: '0.78rem', marginBottom: 6 }}><strong>How:</strong> {strat.how}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}><strong>Pros:</strong> {strat.pros}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}><strong>Cons:</strong> {strat.cons}</div>
            </div>
          </div>
        )}

        {tab === 'lifecycle' && (
          <div>
            <svg viewBox="0 0 700 90" width="100%" role="img" aria-label="Reservation state lifecycle">
              <defs>
                <marker id="lc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0 0L10 5L0 10z" fill="#34d399" />
                </marker>
              </defs>
              {LIFECYCLE.map((s, i) => (
                <g key={s} onClick={() => setStep(i)} style={{ cursor: 'pointer' }}>
                  <rect x={4 + i * 140} y={20} width={118} height={46} rx={8} fill="#0d0f1e" stroke={i === 4 ? '#f87171' : '#34d399'} strokeWidth={step === i ? 3 : 1.2} />
                  <text x={63 + i * 140} y={47} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#ffffff">{s}</text>
                  {i < LIFECYCLE.length - 1 && (
                    <path className="interactive-diagram-flowing-path" d={`M${128 + i * 140} 43H${140 + i * 140}`} stroke="#34d399" strokeWidth="2" strokeDasharray="4 3" fill="none" markerEnd="url(#lc-arrow)" />
                  )}
                </g>
              ))}
            </svg>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#e2e8f0' }}>
              {step === 0 && 'Search reads from Elasticsearch (eventually consistent). Availability is re-verified at hold time.'}
              {step === 1 && 'A conditional decrement creates a PENDING hold with a TTL. No DB lock is kept open.'}
              {step === 2 && 'Payment is called with an idempotency key so client retries never double-charge.'}
              {step === 3 && 'Webhook or response flips the hold to CONFIRMED in a transaction and emits an outbox event.'}
              {step === 4 && 'Failure or TTL expiry releases inventory via a compensating increment (saga step).'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
