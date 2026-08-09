import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, direction: 'right' as const, label: 'send(record, PID=5, Seq=0)', color: '#38bdf8', note: 'Idempotent producer assigned a unique Producer ID (PID) by the broker at startup. First record has Seq=0.' },
  { id: 2, direction: 'right' as const, label: 'Broker deduplicates: PID=5, Seq=0 (new)', color: '#34d399', note: 'Broker stores the latest (PID, Seq) pair per partition. This Seq=0 is new — write accepted. Offset 42 assigned.' },
  { id: 3, direction: 'left' as const, label: 'ACK(offset=42)', color: '#34d399', note: 'Producer receives successful ACK with offset 42. Everything normal.' },
  { id: 4, direction: 'right' as const, label: 'RETRY: send(PID=5, Seq=0) — network error', color: '#f87171', note: 'Network timeout! Producer retried with the same PID=5, Seq=0 — broker receives a duplicate ProduceRequest.' },
  { id: 5, direction: 'right' as const, label: 'Broker: PID=5, Seq=0 already seen → IGNORE', color: '#fbbf24', note: 'Broker detects (PID=5, Seq=0) was already committed. Silently ignores the duplicate write. No double-commit!' },
  { id: 6, direction: 'left' as const, label: 'ACK(offset=42) — deduplicated response', color: '#34d399', note: 'Broker returns the same original ACK. Producer callback fires once. Message appears exactly once in the partition log.' },
];

export default function KafkaProducerIdempotencyDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 900);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => { setActiveStep(null); setAnimStep(0); setPlaying(true); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Producer Idempotency — Exactly-Once Per Partition</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(52,211,153,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#34d399', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(52,211,153,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Config badge */}
        <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>Required Configuration</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['enable.idempotence=true', 'acks=all (auto-set)', 'retries=Integer.MAX_VALUE (auto-set)', 'max.in.flight=5 (max allowed)'].map(cfg => (
              <code key={cfg} style={{ fontSize: '10.5px', color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '5px', padding: '2px 7px' }}>{cfg}</code>
            ))}
          </div>
        </div>

        {/* Actor columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {[
            { label: 'Idempotent Producer', sub: 'PID=5, tracks Seq per partition', color: '#38bdf8' },
            { label: 'Broker Leader', sub: 'Stores (PID, Seq) → dedup table', color: '#34d399' },
          ].map(a => (
            <div key={a.label} style={{ background: `${a.color}12`, border: `1.5px solid ${a.color}35`, borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: a.color }}>{a.label}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '3px' }}>{a.sub}</div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STEPS.map((step, i) => {
            const isActive = activeStep !== null && i <= activeStep;
            const isCurrent = activeStep === i;
            const isRight = step.direction === 'right';
            const isRetry = i >= 3;
            return (
              <div key={step.id} onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', opacity: isActive ? 1 : activeStep !== null ? 0.22 : 0.65, transition: 'opacity 0.5s ease', position: 'relative' }}>
                {isRetry && i === 3 && (
                  <div style={{ position: 'absolute', left: '-8px', top: '-4px', fontSize: '9px', color: '#f87171', fontWeight: 700, background: 'rgba(248,113,113,0.15)', borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap' }}>
                    ⚠ Retry scenario
                  </div>
                )}
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: step.color, minWidth: '16px', textAlign: 'right', paddingTop: '2px', marginTop: isRetry && i === 3 ? '10px' : 0 }}>{step.id}</span>
                <div style={{ flex: 1, marginTop: isRetry && i === 3 ? '10px' : 0 }}>
                  <div style={{ display: 'flex', flexDirection: isRight ? 'row' : 'row-reverse', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, height: '2px', background: `linear-gradient(${isRight ? '90deg' : '270deg'}, ${step.color}00, ${step.color})`, position: 'relative' }}>
                      <div style={{ position: 'absolute', [isRight ? 'right' : 'left']: '-1px', top: '-4px', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', [isRight ? 'borderLeft' : 'borderRight']: `8px solid ${step.color}` }} />
                    </div>
                    <div style={{ padding: '4px 10px', borderRadius: '6px', flexShrink: 0, background: `${step.color}18`, border: `1px solid ${step.color}40` }}>
                      <code style={{ fontSize: '10.5px', color: step.color, fontWeight: 700 }}>{step.label}</code>
                    </div>
                  </div>
                  {isActive && <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, paddingLeft: '4px' }}>{step.note}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {activeStep === null && (
          <div className="interactive-diagram-helper-text" style={{ textAlign: 'center', marginTop: '12px' }}>
            Watch how PID + Sequence Number prevents duplicate writes on retry
          </div>
        )}
      </div>
    </div>
  );
}