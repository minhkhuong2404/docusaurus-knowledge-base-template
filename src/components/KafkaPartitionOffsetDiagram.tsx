import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, direction: 'right' as const, label: 'Produce msg (key="ACC-99")', color: '#38bdf8', from: 'Producer', to: 'Leader (Broker 1)', note: 'Serialized → RecordBatch → Partitioner assigns partition 0' },
  { id: 2, direction: 'right' as const, label: 'Append offset 5', color: '#34d399', from: 'Leader (Broker 1)', to: 'Partition 0 Log', note: 'Record appended to .log segment. LEO advances to 6.' },
  { id: 3, direction: 'right' as const, label: 'FetchRequest (follower)', color: '#fbbf24', from: 'Partition 0 Log', to: 'Follower (Broker 2)', note: 'Follower sends FetchRequest for offsets >= its LEO. Receives offset 5 batch.' },
  { id: 4, direction: 'left' as const, label: 'FetchResponse + ACK', color: '#fbbf24', from: 'Follower (Broker 2)', to: 'Leader (Broker 1)', note: 'Follower confirms replication. Leader advances High Watermark to 5 (min ISR LEO).' },
  { id: 5, direction: 'left' as const, label: 'acks=all ACK', color: '#34d399', from: 'Leader (Broker 1)', to: 'Producer', note: 'Producer receives acknowledgement only after all ISR members have replicated.' },
  { id: 6, direction: 'right' as const, label: 'poll() up to HW=5', color: '#a78bfa', from: 'Consumer', to: 'Leader (Broker 1)', note: 'Consumer fetches records up to the High Watermark — never reads uncommitted data.' },
  { id: 7, direction: 'left' as const, label: 'commitSync(offset=6)', color: '#a78bfa', from: 'Leader (Broker 1)', to: 'Consumer', note: 'Consumer commits next offset (last + 1) to __consumer_offsets topic after processing.' },
];

const ACTORS = ['Producer', 'Leader (Broker 1)', 'Partition 0 Log', 'Follower (Broker 2)', 'Consumer'];
const ACTOR_COLORS: Record<string, string> = {
  'Producer': '#38bdf8', 'Leader (Broker 1)': '#34d399', 'Partition 0 Log': '#fbbf24', 'Follower (Broker 2)': '#fbbf24', 'Consumer': '#a78bfa',
};

export default function KafkaPartitionOffsetDiagram(): React.JSX.Element {
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Kafka Produce → Replicate → Consume Flow</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Actor columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '12px' }}>
          {ACTORS.map(a => (
            <div key={a} style={{ background: `${ACTOR_COLORS[a]}15`, border: `1.5px solid ${ACTOR_COLORS[a]}40`, borderRadius: '8px', padding: '8px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: ACTOR_COLORS[a], lineHeight: 1.3 }}>{a.replace(' ', '\n')}</div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STEPS.map((step, i) => {
            const isActive = activeStep !== null && i <= activeStep;
            const isCurrent = activeStep === i;
            const isRight = step.direction === 'right';
            return (
              <div key={step.id} onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: isActive ? 1 : activeStep !== null ? 0.25 : 0.65, transform: isCurrent ? 'translateY(0)' : 'translateY(2px)', transition: 'opacity 0.5s ease, transform 0.3s ease' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: step.color, minWidth: '18px', textAlign: 'right' }}>{step.id}</span>

                <div style={{ flex: 1, display: 'flex', flexDirection: isRight ? 'row' : 'row-reverse', alignItems: 'center', gap: '6px' }}>
                  <div style={{ flex: 1, height: '2px', background: `linear-gradient(${isRight ? '90deg' : '270deg'}, ${step.color}00, ${step.color})`, position: 'relative' }}>
                    <div style={{ position: 'absolute', [isRight ? 'right' : 'left']: '-1px', top: '-4px', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', [isRight ? 'borderLeft' : 'borderRight']: `8px solid ${step.color}` }} />
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: '6px', flexShrink: 0, maxWidth: '50%', background: `${step.color}18`, border: `1px solid ${step.color}40` }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '10.5px', color: step.color, fontWeight: 700 }}>{step.label}</div>
                    {isActive && <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>{step.note}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {activeStep === null && (
          <div className="interactive-diagram-helper-text" style={{ textAlign: 'center', marginTop: '12px' }}>
            Click any step or press Animate to walk through the produce-consume lifecycle
          </div>
        )}
      </div>
    </div>
  );
}