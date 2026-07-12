import React, { useState } from 'react';

type FlowMode = 'normal' | 'zero-window';

export default function TcpFlowControlDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<FlowMode>('normal');
  const [index, setIndex] = useState<number>(0);

  const steps = {
    normal: [
      {
        title: '1. Window Advertised (64KB)',
        desc: 'Receiver has empty buffers, advertising Window=64KB. Sender can fire segments without waiting.',
        data: ['ACKed: 1-1000', 'In-Flight: 1001-2000', 'Can Send: 2001-4000', 'Locked: >4000']
      },
      {
        title: '2. Bytes Sent & In-Flight',
        desc: 'Sender fires 1000 bytes. In-flight increases. Buffer space on receiver shrinks slightly.',
        data: ['ACKed: 1-1000', 'In-Flight: 1001-3000', 'Can Send: 3001-4000', 'Locked: >4000']
      },
      {
        title: '3. Acknowledged & Window Slides',
        desc: 'Receiver acknowledges bytes 1001-2000 (ACK 2001). The sliding window slides to the right.',
        data: ['ACKed: 1-2000', 'In-Flight: 2001-3000', 'Can Send: 3001-5000', 'Locked: >5000']
      }
    ],
    'zero-window': [
      {
        title: '1. Receiver Buffer Fills Up',
        desc: 'The slow application fails to read TCP buffer. Receiver buffers fill up, shrinking advertised window to 0.',
        data: ['ACKed: 1-1000', 'In-Flight: 1001-2000', 'Can Send: NONE', 'Locked: >2000']
      },
      {
        title: '2. Zero-Window Probe',
        desc: 'Sender pauses, but sends a 1-byte probe segment periodically to check if receiver buffer space has opened up.',
        data: ['ACKed: 1-1000', 'In-Flight: Probe (1 byte)', 'Can Send: NONE', 'Locked: >2000']
      },
      {
        title: '3. Buffer Cleared & Window Updates',
        desc: 'Receiver application reads data, clearing buffer space. Receiver sends Window Update to resume flow.',
        data: ['ACKed: 1-2000', 'In-Flight: None', 'Can Send: 2001-4000', 'Locked: >4000']
      }
    ]
  };

  const activeSteps = steps[mode];
  const currentStep = Math.min(index, activeSteps.length - 1);

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📦 Sliding Window Flow & Zero-Window Control
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setMode('normal'); setIndex(0); }} style={{ background: mode === 'normal' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'normal' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'normal' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Normal Flow</button>
          <button onClick={() => { setMode('zero-window'); setIndex(0); }} style={{ background: mode === 'zero-window' ? 'rgba(251,146,60,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'zero-window' ? '#fb923c' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'zero-window' ? '#fb923c' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Zero Window</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Step description */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{activeSteps[currentStep].title}</h4>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
              {activeSteps[currentStep].desc}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: '12px' }}>
            <button onClick={() => setIndex(prev => Math.max(0, prev - 1))} disabled={index === 0} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: index === 0 ? '#475569' : '#e2e8f0', cursor: index === 0 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Back</button>
            <button onClick={() => setIndex(prev => Math.min(activeSteps.length - 1, prev + 1))} disabled={index === activeSteps.length - 1} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: index === activeSteps.length - 1 ? '#475569' : '#e2e8f0', cursor: index === activeSteps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Next</button>
          </div>
        </div>

        {/* Visual blocks */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Buffer & Window Allocations</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeSteps[currentStep].data.map((item, idx) => (
              <div key={idx} style={{ padding: '6px 10px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.7rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                • {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
