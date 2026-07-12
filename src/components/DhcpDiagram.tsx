import React, { useState } from 'react';

type Step = 'discover' | 'offer' | 'request' | 'ack';

export default function DhcpDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<Step>('discover');

  const steps = {
    discover: {
      title: '1. DHCP Discover',
      direction: 'Client ──► Server (Broadcast)',
      desc: 'Client wakes up without an IP. It broadcasts a Discover message looking for active DHCP servers.',
      payload: 'Source MAC: Client_MAC\nDest MAC: FF:FF:FF:FF:FF:FF\nSource IP: 0.0.0.0\nDest IP: 255.255.255.255'
    },
    offer: {
      title: '2. DHCP Offer',
      direction: 'Client ◄── Server (Unicast)',
      desc: 'DHCP server reserves an IP from its pool and unicasts an Offer containing configuration parameters.',
      payload: 'Offered IP: 192.168.1.100\nSubnet Mask: 255.255.255.0\nGateway: 192.168.1.1\nDNS: 8.8.8.8\nLease: 24 Hours'
    },
    request: {
      title: '3. DHCP Request',
      direction: 'Client ──► Server (Broadcast)',
      desc: 'Client broadcasts a Request, letting all DHCP servers on the subnet know it has accepted this specific offer.',
      payload: 'Requested IP: 192.168.1.100\nServer Identifier: 192.168.1.2'
    },
    ack: {
      title: '4. DHCP Ack',
      direction: 'Client ◄── Server (Unicast)',
      desc: 'Server commits the lease to its database and sends an Acknowledgment to confirm the client setup.',
      payload: 'Lease status: COMMITTED ✅\nTraffic: Session Active'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔄 DHCP Address Allocation Sequence (D-O-R-A)
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveStep('discover')} style={{ background: activeStep === 'discover' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeStep === 'discover' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeStep === 'discover' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Discover</button>
          <button onClick={() => setActiveStep('offer')} style={{ background: activeStep === 'offer' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeStep === 'offer' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeStep === 'offer' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Offer</button>
          <button onClick={() => setActiveStep('request')} style={{ background: activeStep === 'request' ? 'rgba(251,146,60,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeStep === 'request' ? '#fb923c' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeStep === 'request' ? '#fb923c' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Request</button>
          <button onClick={() => setActiveStep('ack')} style={{ background: activeStep === 'ack' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeStep === 'ack' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeStep === 'ack' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Ack</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Step description */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '0.9rem', color: '#e2e8f0' }}>{steps[activeStep].title}</h4>
            <span style={{ fontSize: '0.7rem', color: '#a78bfa', display: 'block', marginBottom: '8px', fontFamily: 'monospace', fontWeight: 700 }}>
              {steps[activeStep].direction}
            </span>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
              {steps[activeStep].desc}
            </p>
          </div>
        </div>

        {/* Message Payload */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Packet Payload Details</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.7rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {steps[activeStep].payload}
          </pre>
        </div>
      </div>
    </div>
  );
}
