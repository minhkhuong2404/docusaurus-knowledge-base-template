import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, direction: 'right' as const, label: 'serialize(key, value)', color: '#38bdf8', from: 'App Thread', to: 'Serializer', note: 'Key and value serialized to byte[] using configured Serializer (StringSerializer, AvroSerializer, etc.).' },
  { id: 2, direction: 'right' as const, label: 'partition(topic, key, meta)', color: '#38bdf8', from: 'Serializer', to: 'Partitioner', note: 'DefaultPartitioner: key != null → murmur2(key) % numPartitions. key == null → Sticky (batch to one partition until linger.ms or batch.size).' },
  { id: 3, direction: 'right' as const, label: 'accumulate(batch)', color: '#fbbf24', from: 'Partitioner', to: 'RecordAccumulator', note: 'Record appended to in-memory batch for the target partition. If batch is full (batch.size=16KB) or linger.ms elapsed → batch is ready for sending.' },
  { id: 4, direction: 'right' as const, label: 'drain → send(batch)', color: '#f97316', from: 'RecordAccumulator', to: 'Sender Thread', note: 'Background Sender thread wakes up, drains ready batches from the accumulator, and dispatches via NIO network client. Handles in-flight request tracking.' },
  { id: 5, direction: 'right' as const, label: 'ProduceRequest (acks=all)', color: '#34d399', from: 'Sender Thread', to: 'Broker Leader', note: 'RecordBatch sent to the leader broker for the partition. The broker appends to .log segment and waits for ISR acknowledgement based on acks setting.' },
  { id: 6, direction: 'left' as const, label: 'RecordMetadata (offset, ts)', color: '#34d399', from: 'Broker Leader', to: 'App Thread', note: 'On success, broker returns RecordMetadata containing assigned partition, offset, and timestamp. Callback is invoked on the I/O thread — avoid heavy work in callbacks.' },
  { id: 7, direction: 'right' as const, label: 'retry (if retriable error)', color: '#f87171', from: 'Sender Thread', to: 'Broker Leader', note: 'On retriable errors (NotLeaderForPartition, NetworkException), Sender retries up to retries times with retry.backoff.ms delay. Idempotent producers use PID+SeqNum for dedup.' },
];

export default function KafkaProducerConsumerFlowDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 900);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => { setActiveStep(null); setAnimStep(0); setPlaying(true); };

  const ACTORS = ['App Thread', 'Serializer', 'Partitioner', 'RecordAccumulator', 'Sender Thread', 'Broker Leader'];
  const ACTOR_COLORS: Record<string, string> = {
    'App Thread': '#38bdf8', 'Serializer': '#38bdf8', 'Partitioner': '#fbbf24',
    'RecordAccumulator': '#fbbf24', 'Sender Thread': '#f97316', 'Broker Leader': '#34d399',
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Kafka Producer Internal Pipeline</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(249,115,22,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#f97316', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(249,115,22,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Actor columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '12px' }}>
          {ACTORS.map(a => (
            <div key={a} style={{ background: `${ACTOR_COLORS[a]}15`, border: `1.5px solid ${ACTOR_COLORS[a]}35`, borderRadius: '7px', padding: '6px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: ACTOR_COLORS[a], lineHeight: 1.3 }}>{a}</div>
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
                style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', opacity: isActive ? 1 : activeStep !== null ? 0.22 : 0.6, transform: isCurrent ? 'translateY(0)' : 'translateY(2px)', transition: 'opacity 0.5s ease, transform 0.3s ease' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: step.color, minWidth: '16px', textAlign: 'right', paddingTop: '2px' }}>{step.id}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: isRight ? 'row' : 'row-reverse', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, height: '2px', background: `linear-gradient(${isRight ? '90deg' : '270deg'}, ${step.color}00, ${step.color})`, position: 'relative' }}>
                      <div style={{ position: 'absolute', [isRight ? 'right' : 'left']: '-1px', top: '-4px', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', [isRight ? 'borderLeft' : 'borderRight']: `8px solid ${step.color}` }} />
                    </div>
                    <div style={{ padding: '4px 10px', borderRadius: '6px', flexShrink: 0, background: `${step.color}18`, border: `1px solid ${step.color}40` }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '10.5px', color: step.color, fontWeight: 700 }}>{step.label}</div>
                    </div>
                  </div>
                  {isActive && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, paddingLeft: '4px' }}>
                      {step.note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {activeStep === null && (
          <div className="interactive-diagram-helper-text" style={{ textAlign: 'center', marginTop: '12px' }}>
            Click any step or press Animate to walk through the Kafka producer pipeline
          </div>
        )}
      </div>
    </div>
  );
}