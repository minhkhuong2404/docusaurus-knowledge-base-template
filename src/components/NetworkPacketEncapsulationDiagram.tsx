import React, { useState, useEffect } from 'react';

const STAGES = [
  {
    id: 0, label: 'Stage 1: Application Data', color: '#38bdf8',
    layers: [
      { label: 'Application Payload', content: 'GET /api/v1/user HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJhb...', color: '#38bdf8', tag: 'L5 App' },
    ],
    note: 'The application produces raw data — an HTTP request body, JSON payload, or binary message. No headers from lower layers yet. This is the PDU at the Application layer: a "Message" or "Data".',
  },
  {
    id: 1, label: 'Stage 2: + TCP Segment Header', color: '#34d399',
    layers: [
      { label: 'TCP Header', content: 'SrcPort: 54321 | DstPort: 443\nSeq: 1001 | Ack: 5001\nFlags: PSH+ACK | Window: 65535', color: '#34d399', tag: 'L4 Transport' },
      { label: 'Application Payload', content: 'GET /api/v1/user HTTP/1.1...', color: '#38bdf8', tag: 'L5 Data' },
    ],
    note: 'TCP wraps the payload in a Segment header. Adds source/destination port numbers (process addressing), sequence number (for ordering), acknowledgement number (for reliability), flags (SYN/ACK/FIN/PSH), and receive window (flow control).',
  },
  {
    id: 2, label: 'Stage 3: + IP Packet Header', color: '#a78bfa',
    layers: [
      { label: 'IP Header', content: 'Version: 4 | TTL: 64 | Protocol: 6 (TCP)\nSrcIP: 192.168.1.50\nDstIP: 142.250.190.46', color: '#a78bfa', tag: 'L3 Network' },
      { label: 'TCP Header', content: 'SrcPort: 54321 | DstPort: 443 | Seq: 1001...', color: '#34d399', tag: 'L4 Segment' },
      { label: 'Application Payload', content: 'GET /api/v1/user...', color: '#38bdf8', tag: 'L5 Data' },
    ],
    note: 'IP wraps the TCP segment in a Packet header. Adds source/destination IP addresses (host addressing), TTL (hop limit — prevents infinite routing loops), and Protocol field (6=TCP, 17=UDP). Routers read only this header.',
  },
  {
    id: 3, label: 'Stage 4: + Ethernet Frame', color: '#fbbf24',
    layers: [
      { label: 'Ethernet Header', content: 'DstMAC: 00:1A:2B:3C:4D:5E\nSrcMAC: AA:BB:CC:DD:EE:FF\nEtherType: 0x0800 (IPv4)', color: '#fbbf24', tag: 'L2 Frame' },
      { label: 'IP Header', content: 'SrcIP: 192.168.1.50 → DstIP: 142.250.190.46', color: '#a78bfa', tag: 'L3 Packet' },
      { label: 'TCP Header', content: 'Port 54321 → 443 | Seq: 1001', color: '#34d399', tag: 'L4 Segment' },
      { label: 'Application Payload', content: 'GET /api/v1/user...', color: '#38bdf8', tag: 'L5 Data' },
      { label: 'Frame Check Sequence (FCS)', content: 'CRC32: 0xA1B2C3D4 — error detection', color: '#f97316', tag: 'L2 Trailer' },
    ],
    note: 'Ethernet wraps everything in a Frame with source/destination MAC addresses (local link addressing), EtherType (0x0800=IPv4), and a CRC32 trailer for error detection. Switches and NICs operate on frames — they strip and re-add this header at each hop.',
  },
];

export default function NetworkPacketEncapsulationDiagram(): React.JSX.Element {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [animStage, setAnimStage] = useState(0);

  useEffect(() => {
    if (!playing || animStage >= STAGES.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setStage(animStage); setAnimStage(s => s + 1); }, 1200);
    return () => clearTimeout(t);
  }, [playing, animStage]);

  const handlePlay = () => { setStage(0); setAnimStage(0); setPlaying(true); };
  const current = STAGES[stage];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Network Packet Encapsulation — Layer-by-Layer</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(52,211,153,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#34d399', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(52,211,153,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Stage tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {STAGES.map((s, i) => (
            <button key={s.id} onClick={() => { setPlaying(false); setStage(i); }}
              style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: stage === i ? `${s.color}18` : 'rgba(255,255,255,0.04)', color: stage === i ? s.color : 'var(--ifm-color-content-secondary)', boxShadow: stage === i ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Nested frame visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '16px' }}>
          {current.layers.map((layer, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: `${layer.color}0d`, border: `1.5px solid ${layer.color}35`, borderRadius: '8px', padding: '10px 12px', transition: 'all 0.4s ease' }}>
              <span style={{ fontSize: '9.5px', fontWeight: 700, color: layer.color, background: `${layer.color}18`, borderRadius: '4px', padding: '2px 6px', flexShrink: 0, marginTop: '1px', whiteSpace: 'nowrap' }}>{layer.tag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: layer.color, marginBottom: '3px' }}>{layer.label}</div>
                <pre style={{ margin: 0, fontSize: '10px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{layer.content}</pre>
              </div>
            </div>
          ))}
        </div>

        {/* Explanation */}
        <div style={{ background: `${current.color}0d`, border: `1px solid ${current.color}30`, borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, marginBottom: '5px' }}>{current.label}</div>
          <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{current.note}</p>
        </div>
      </div>
    </div>
  );
}
