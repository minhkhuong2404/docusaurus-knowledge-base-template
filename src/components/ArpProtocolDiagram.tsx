import React, { useState } from 'react';

type Step = 'broadcast' | 'reply' | 'cache';

export default function ArpProtocolDiagram(): React.JSX.Element {
  const [step, setStep] = useState<Step>('broadcast');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔄 Address Resolution Protocol (ARP) Sequence
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setStep('broadcast')} style={{ background: step === 'broadcast' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step === 'broadcast' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: step === 'broadcast' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>1. Broadcast Request</button>
          <button onClick={() => setStep('reply')} style={{ background: step === 'reply' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step === 'reply' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: step === 'reply' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>2. Unicast Reply</button>
          <button onClick={() => setStep('cache')} style={{ background: step === 'cache' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step === 'cache' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: step === 'cache' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>3. ARP Table Cache</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="arp-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Hosts */}
          <g transform="translate(100, 90)">
            <rect x="-60" y="-30" width="120" height="60" rx="5" fill="#0d1527" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="-5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#38bdf8', textAnchor: 'middle' }}>Host A (Sender)</text>
            <text x="0" y="8" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>IP: 192.168.1.1</text>
            <text x="0" y="18" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>MAC: 00:1A:..</text>
          </g>

          <g transform="translate(580, 90)">
            <rect x="-60" y="-30" width="120" height="60" rx="5" fill="#0d1527" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="0" y="-5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#a78bfa', textAnchor: 'middle' }}>Host B (Target)</text>
            <text x="0" y="8" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>IP: 192.168.1.10</text>
            <text x="0" y="18" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>MAC: AA:BB:..</text>
          </g>

          {/* Action flows */}
          {step === 'broadcast' && (
            <>
              <path id="arp-flow-bc" d="M 160 80 L 520 80" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arp-arr)" />
              <text x="340" y="70" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#38bdf8', textAnchor: 'middle' }}>Broadcast: Who has 192.168.1.10? Tell 192.168.1.1</text>
              <text x="340" y="115" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#f87171', textAnchor: 'middle' }}>Destination MAC: FF:FF:FF:FF:FF:FF (Sent to all ports on LAN)</text>
              <circle r="3.2" fill="#38bdf8"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#arp-flow-bc" /></animateMotion></circle>
            </>
          )}

          {step === 'reply' && (
            <>
              <path id="arp-flow-rep" d="M 520 100 L 160 100" fill="none" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arp-arr)" />
              <text x="340" y="125" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#a78bfa', textAnchor: 'middle' }}>Unicast: 192.168.1.10 is at AA:BB:CC:DD:EE:FF</text>
              <circle r="3.2" fill="#a78bfa"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#arp-flow-rep" /></animateMotion></circle>
            </>
          )}

          {step === 'cache' && (
            <>
              {/* Table box on Host A side */}
              <rect x="80" y="130" width="160" height="40" rx="3" fill="rgba(74,222,128,0.12)" stroke="#4ade80" strokeWidth="1" />
              <text x="160" y="145" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#4ade80', fontWeight: 800, textAnchor: 'middle' }}>ARP Cache Table</text>
              <text x="160" y="160" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>192.168.1.10 → AA:BB:CC:DD:EE:FF</text>
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        {step === 'broadcast' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Step 1: ARP Request</strong> — Host A knows the destination IP address (192.168.1.10) but does not have the hardware MAC address. It fires a Layer 2 Broadcast Frame, which every network interface on the local VLAN reads.
          </p>
        )}
        {step === 'reply' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Step 2: ARP Reply</strong> — Host B sees its own IP address in the broadcast query and replies directly (Unicast) to Host A with its hardware MAC address. Other network hosts simply discard the broadcast.
          </p>
        )}
        {step === 'cache' && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Step 3: Cache Entry</strong> — Host A writes the IP-to-MAC mapping into its memory cache. Subsequent packets sent to 192.168.1.10 wrap immediately using this MAC without triggering further network broadcasts (expires after ~20 minutes).
          </p>
        )}
      </div>
    </div>
  );
}
