import React, { useState } from 'react';

type Prefix = 24 | 26 | 30;

export default function IpAddressingCidrDiagram(): React.JSX.Element {
  const [prefix, setPrefix] = useState<Prefix>(26);

  const cidrData = {
    24: {
      mask: '255.255.255.0',
      binary: '11111111.11111111.11111111.00000000',
      hosts: '254 usable addresses (2^8 - 2)',
      desc: 'Typical Local Area Network (LAN) size. 1 network IP (.0) and 1 broadcast IP (.255).'
    },
    26: {
      mask: '255.255.255.192',
      binary: '11111111.11111111.11111111.11000000',
      hosts: '62 usable addresses (2^6 - 2)',
      desc: 'Formed by borrowing 2 host bits. Divides a /24 class C network into 4 equal size subnets.'
    },
    30: {
      mask: '255.255.255.252',
      binary: '11111111.11111111.11111111.11111100',
      hosts: '2 usable addresses (2^2 - 2)',
      desc: 'Point-to-point router link subnet. Minimal footprint: only 2 usable IPs, 1 network IP, and 1 broadcast IP.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🧮 Classless Inter-Domain Routing (CIDR) Calculator
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setPrefix(24)} style={{ background: prefix === 24 ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${prefix === 24 ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: prefix === 24 ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>/24 Prefix</button>
          <button onClick={() => setPrefix(26)} style={{ background: prefix === 26 ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${prefix === 26 ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: prefix === 26 ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>/26 Prefix</button>
          <button onClick={() => setPrefix(30)} style={{ background: prefix === 30 ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${prefix === 30 ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: prefix === 30 ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>/30 Prefix</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
          {/* Attributes */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: prefix === 24 ? '#38bdf8' : prefix === 26 ? '#a78bfa' : '#4ade80' }}>
              Subnet Mask: {cidrData[prefix].mask}
            </h4>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '6px' }}>
              Binary: {cidrData[prefix].binary}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700 }}>
              Capacity: {cidrData[prefix].hosts}
            </div>
          </div>

          {/* Description */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Usage & Design</h4>
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45 }}>
              {cidrData[prefix].desc}
            </p>
          </div>
        </div>

        {/* Subnetting Visualizer Tree */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#cbd5e1' }}>Subnetting Example: 192.168.10.0/24 divided into 4 x /26 subnets</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '10px' }}>
            <div style={{ padding: '6px', background: '#090b14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, textAlign: 'center', fontSize: '0.66rem' }}>
              <strong style={{ color: '#a78bfa' }}>Subnet 1</strong>
              <div style={{ color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>.0/26</div>
              <div style={{ color: '#64748b', fontSize: '0.6rem' }}>Range: .1 – .62</div>
            </div>
            <div style={{ padding: '6px', background: '#090b14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, textAlign: 'center', fontSize: '0.66rem' }}>
              <strong style={{ color: '#a78bfa' }}>Subnet 2</strong>
              <div style={{ color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>.64/26</div>
              <div style={{ color: '#64748b', fontSize: '0.6rem' }}>Range: .65 – .126</div>
            </div>
            <div style={{ padding: '6px', background: '#090b14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, textAlign: 'center', fontSize: '0.66rem' }}>
              <strong style={{ color: '#a78bfa' }}>Subnet 3</strong>
              <div style={{ color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>.128/26</div>
              <div style={{ color: '#64748b', fontSize: '0.6rem' }}>Range: .129 – .190</div>
            </div>
            <div style={{ padding: '6px', background: '#090b14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, textAlign: 'center', fontSize: '0.66rem' }}>
              <strong style={{ color: '#a78bfa' }}>Subnet 4</strong>
              <div style={{ color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>.192/26</div>
              <div style={{ color: '#64748b', fontSize: '0.6rem' }}>Range: .193 – .254</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
