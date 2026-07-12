import React, { useState } from 'react';

type HandshakeType = '3way' | '4way';

export default function TcpHandshakesDiagram(): React.JSX.Element {
  const [type, setType] = useState<HandshakeType>('3way');
  const [step, setStep] = useState<number>(0);

  const handshakeSteps = [
    {
      title: '1. SYN (Synchronize)',
      direction: 'Client ──► Server',
      desc: 'Client sends a segment with SYN flag set, containing its Initial Sequence Number (ISN=x). Client moves to SYN_SENT state.',
      visual: 'SYN [seq=x] (ISN chosen randomly)'
    },
    {
      title: '2. SYN-ACK (Acknowledge + Sync)',
      direction: 'Client ◄── Server',
      desc: 'Server acknowledges client\'s sequence (ack=x+1) and sends its own sequence number (seq=y). Server enters SYN_RCVD.',
      visual: 'SYN-ACK [seq=y, ack=x+1]'
    },
    {
      title: '3. ACK (Acknowledge)',
      direction: 'Client ──► Server',
      desc: 'Client acknowledges server\'s sequence (ack=y+1). Both sides enter the ESTABLISHED state. Data transfer can now begin.',
      visual: 'ACK [ack=y+1]'
    }
  ];

  const terminationSteps = [
    {
      title: '1. FIN (Finish from Client)',
      direction: 'Client ──► Server',
      desc: 'Client has finished sending data. It sends a FIN segment. Client enters FIN_WAIT_1 state.',
      visual: 'FIN [seq=u]'
    },
    {
      title: '2. ACK (Ack from Server)',
      direction: 'Client ◄── Server',
      desc: 'Server acknowledges client\'s FIN (ack=u+1). Server enters CLOSE_WAIT. Client enters FIN_WAIT_2 (half-close: server can still send data).',
      visual: 'ACK [ack=u+1]'
    },
    {
      title: '3. FIN (Finish from Server)',
      direction: 'Client ◄── Server',
      desc: 'Server has finished sending all its data. It sends its own FIN segment. Server enters LAST_ACK.',
      visual: 'FIN [seq=v, ack=u+1]'
    },
    {
      title: '4. ACK (Final Ack from Client)',
      direction: 'Client ──► Server',
      desc: 'Client acknowledges server\'s FIN (ack=v+1). Client enters TIME_WAIT (waits 2 MSL, ~60s, to ensure ACK is received and old packets expire). Server closes.',
      visual: 'ACK [ack=v+1]'
    }
  ];

  const activeSteps = type === '3way' ? handshakeSteps : terminationSteps;
  const currentStep = Math.min(step, activeSteps.length - 1);

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🤝 TCP Handshake Sequences (3-Way & 4-Way)
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setType('3way'); setStep(0); }} style={{ background: type === '3way' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${type === '3way' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: type === '3way' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>3-Way Handshake</button>
          <button onClick={() => { setType('4way'); setStep(0); }} style={{ background: type === '4way' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${type === '4way' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: type === '4way' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>4-Way Teardown</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Step log */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{activeSteps[currentStep].title}</h4>
            <span style={{ fontSize: '0.7rem', color: '#a78bfa', display: 'block', marginBottom: '8px', fontFamily: 'monospace', fontWeight: 700 }}>
              {activeSteps[currentStep].direction}
            </span>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
              {activeSteps[currentStep].desc}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: '12px' }}>
            <button onClick={() => setStep(prev => Math.max(0, prev - 1))} disabled={step === 0} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: step === 0 ? '#475569' : '#e2e8f0', cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Back</button>
            <button onClick={() => setStep(prev => Math.min(activeSteps.length - 1, prev + 1))} disabled={step === activeSteps.length - 1} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: step === activeSteps.length - 1 ? '#475569' : '#e2e8f0', cursor: step === activeSteps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Next</button>
          </div>
        </div>

        {/* Packet content */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>TCP Segment Parameters</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.7rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {activeSteps[currentStep].visual}
          </pre>
        </div>
      </div>
    </div>
  );
}
