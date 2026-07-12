import React, { useState } from 'react';

export default function DataEncapsulationDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      layer: 'Application Layer',
      pdu: 'Data / Message',
      desc: 'Raw payload constructed by user applications (e.g. an HTTP GET request payload).',
      visual: '[ HTTP GET /index.html ]'
    },
    {
      layer: 'Transport Layer',
      pdu: 'Segment (TCP) / Datagram (UDP)',
      desc: 'Adds TCP or UDP header containing Source and Destination Ports for process-to-process delivery.',
      visual: '[TCP Source:49152 | Dest:443] [ HTTP GET /index.html ]'
    },
    {
      layer: 'Network Layer',
      pdu: 'Packet',
      desc: 'Adds IP header containing Source and Destination IP addresses to route data packets across networks.',
      visual: '[IP Source:192.168.1.15 | Dest:8.8.8.8] [TCP Header] [ HTTP Payload ]'
    },
    {
      layer: 'Data Link Layer',
      pdu: 'Frame',
      desc: 'Adds Ethernet Header (MAC addresses) and Trailer (CRC Checksum) for local hardware link delivery.',
      visual: '[Eth Source:00:1A:.. | Dest:10:9B:..] [IP Header] [TCP Header] [ Payload ] [CRC Trailer]'
    },
    {
      layer: 'Physical Layer',
      pdu: 'Bit',
      desc: 'Converts frames into raw electrical signals, light waves, or radio frequencies to send across physical wires/fiber cables.',
      visual: '01001000 01010100 01010100 01010000 00101111 ...'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📦 Data Encapsulation Down the Stack
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Step controller */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>
              {steps[activeStep].layer} (PDU: {steps[activeStep].pdu})
            </span>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.45 }}>
              {steps[activeStep].desc}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: '12px' }}>
            <button onClick={() => setActiveStep(prev => Math.max(0, prev - 1))} disabled={activeStep === 0} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === 0 ? '#475569' : '#e2e8f0', cursor: activeStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Back</button>
            <button onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))} disabled={activeStep === steps.length - 1} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === steps.length - 1 ? '#475569' : '#e2e8f0', cursor: activeStep === steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Next</button>
          </div>
        </div>

        {/* Visual packet state */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Packet Wrapping</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.66rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {steps[activeStep].visual}
          </pre>
        </div>
      </div>
    </div>
  );
}
