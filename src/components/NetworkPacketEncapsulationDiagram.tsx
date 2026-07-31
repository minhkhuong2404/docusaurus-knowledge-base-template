import React, { useState } from 'react';

export default function NetworkPacketEncapsulationDiagram(): React.JSX.Element {
  const [stage, setStage] = useState<number>(4);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Network Packet Encapsulation Protocol Simulator (Header Wrapping)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {[4, 3, 2, 1].map(s => (
            <button
              key={s}
              onClick={() => setStage(s)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: stage === s ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: stage === s ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17',
                color: '#fff',
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
            >
              Stage {5 - s}: {s === 4 ? 'Application Data' : s === 3 ? '+ TCP Header' : s === 2 ? '+ IP Header' : '+ Ethernet Frame'}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#05070e', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: '12px' }}>
          {stage === 4 && <div style={{ color: '#38bdf8' }}>[ Application Payload: "GET /api/v1/user" ]</div>}
          {stage === 3 && <div style={{ color: '#fbbf24' }}>[ TCP SrcPort: 54321, DstPort: 443 | Payload: "GET /api/v1/user" ]</div>}
          {stage === 2 && <div style={{ color: '#a78bfa' }}>[ IP Src: 192.168.1.50, Dst: 142.250.190.46 | TCP Header | Payload ]</div>}
          {stage === 1 && <div style={{ color: '#34d399' }}>[ Ethernet MAC Src: aa:bb:cc:dd, Dst: 11:22:33:44 | IP Header | TCP Header | Payload | FCS ]</div>}
        </div>
      </div>
    </div>
  );
}
