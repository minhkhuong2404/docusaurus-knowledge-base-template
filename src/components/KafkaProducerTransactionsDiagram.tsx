import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, direction: 'right' as const, label: 'initTransactions()', color: '#38bdf8', from: 'Producer', to: 'Transaction\nCoordinator', note: 'Producer sends InitProducerIdRequest to the Transaction Coordinator (a specific broker determined by hash of transactional.id). Receives a new PID + epoch, fencing any previous zombie producers with the same transactional.id.' },
  { id: 2, direction: 'right' as const, label: 'beginTransaction()', color: '#a78bfa', from: 'Producer', to: 'Local State', note: 'Client-side only — sets transactionState = IN_TRANSACTION. No network call. The broker is not notified until the first send().' },
  { id: 3, direction: 'right' as const, label: 'send(topicA, record)', color: '#fbbf24', from: 'Producer', to: 'Broker A\n(topic-A leader)', note: 'Records sent with transactional metadata (PID, epoch). Transaction Coordinator is notified to add topic-A partition to the ongoing transaction.' },
  { id: 4, direction: 'right' as const, label: 'send(topicB, record)', color: '#fbbf24', from: 'Producer', to: 'Broker B\n(topic-B leader)', note: 'Second topic written in the same transaction. Records from both brokers are held in an uncommitted state — consumers with isolation.level=read_committed cannot read them yet.' },
  { id: 5, direction: 'right' as const, label: 'commitTransaction()', color: '#34d399', from: 'Producer', to: 'Transaction\nCoordinator', note: 'Producer sends EndTransactionRequest(COMMIT) to the Transaction Coordinator. Coordinator logs COMMIT to its internal __transaction_state topic.' },
  { id: 6, direction: 'right' as const, label: 'WriteTxnMarkers → all partitions', color: '#34d399', from: 'Transaction\nCoordinator', to: 'Broker A + B', note: 'Coordinator sends WriteTxnMarkersRequest to all participating brokers. They write COMMIT markers to the partition logs. Records are now visible to read_committed consumers.' },
  { id: 7, direction: 'left' as const, label: 'Transaction complete ✓', color: '#34d399', from: 'Broker A + B', to: 'Producer', note: 'All commit markers written. The transaction is durably committed. Consumers with isolation.level=read_committed can now read the records from both topics atomically.' },
];

export default function KafkaProducerTransactionsDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 1000);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => { setActiveStep(null); setAnimStep(0); setPlaying(true); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Kafka Transactions — Multi-Topic Atomic Writes</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#a78bfa', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(167,139,250,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Required config */}
        <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', marginBottom: '6px' }}>Required Producer Config</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['transactional.id=my-producer-v1', 'enable.idempotence=true (auto)', 'acks=all (auto)'].map(cfg => (
              <code key={cfg} style={{ fontSize: '10.5px', color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '5px', padding: '2px 7px' }}>{cfg}</code>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '8px' }}>Consumer: <code style={{ fontSize: '10.5px', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '4px', padding: '1px 5px' }}>isolation.level=read_committed</code></div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STEPS.map((step, i) => {
            const isActive = activeStep !== null && i <= activeStep;
            const isCurrent = activeStep === i;
            const isRight = step.direction === 'right';
            return (
              <div key={step.id} onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', opacity: isActive ? 1 : activeStep !== null ? 0.2 : 0.65, transform: isCurrent ? 'translateY(0)' : 'translateY(2px)', transition: 'opacity 0.5s ease, transform 0.3s ease' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: step.color, minWidth: '16px', textAlign: 'right', paddingTop: '2px' }}>{step.id}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: isRight ? 'row' : 'row-reverse', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, height: '2px', background: `linear-gradient(${isRight ? '90deg' : '270deg'}, ${step.color}00, ${step.color})`, position: 'relative' }}>
                      <div style={{ position: 'absolute', [isRight ? 'right' : 'left']: '-1px', top: '-4px', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', [isRight ? 'borderLeft' : 'borderRight']: `8px solid ${step.color}` }} />
                    </div>
                    <div style={{ padding: '5px 10px', borderRadius: '6px', flexShrink: 0, background: `${step.color}18`, border: `1px solid ${step.color}40`, maxWidth: '55%' }}>
                      <code style={{ fontSize: '10.5px', color: step.color, fontWeight: 700 }}>{step.label}</code>
                    </div>
                  </div>
                  {isActive && (
                    <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, paddingLeft: '4px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', padding: '6px 8px', borderLeft: `2px solid ${step.color}50` }}>
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
            Animate to trace a complete Kafka transaction from beginTransaction() to COMMIT
          </div>
        )}
      </div>
    </div>
  );
}