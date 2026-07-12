import React, { useState } from 'react';

type ModelView = 'osi' | 'tcpip';

export default function OsiModelDiagram(): React.JSX.Element {
  const [view, setView] = useState<ModelView>('osi');
  const [activeLayer, setActiveLayer] = useState<number>(7);

  const osiLayers = [
    { num: 7, name: 'Application', pdu: 'Data', protocols: 'HTTP, DNS, SMTP, gRPC', desc: 'Provides network services directly to end-user applications (e.g. web browsers, email clients).' },
    { num: 6, name: 'Presentation', pdu: 'Data', protocols: 'TLS, SSL, JSON, JPEG', desc: 'Handles data formatting, translation, encryption, decryption, and compression.' },
    { num: 5, name: 'Session', pdu: 'Data', protocols: 'RPC, NetBIOS, PPTP', desc: 'Establishes, manages, and terminates dialogues (sessions) between local and remote applications.' },
    { num: 4, name: 'Transport', pdu: 'Segment (TCP) / Datagram (UDP)', protocols: 'TCP, UDP', desc: 'Responsible for end-to-end flow control, segmenting/reassembling data, and error recovery.' },
    { num: 3, name: 'Network', pdu: 'Packet', protocols: 'IP (v4/v6), ICMP, ARP', desc: 'Determines the best physical path for data routing across networks using logical IP addressing.' },
    { num: 2, name: 'Data Link', pdu: 'Frame', protocols: 'Ethernet, Wi-Fi (802.11), PPP', desc: 'Provides reliable node-to-node frame delivery over the same local network segment using hardware MAC addresses.' },
    { num: 1, name: 'Physical', pdu: 'Bit', protocols: 'Cat6 Ethernet, Fiber optics, USB', desc: 'Transmits raw unstructured bit streams over physical media (cables, light pulses, radio waves).' }
  ];

  const tcpipLayers = [
    { num: 4, name: 'Application', equivalent: 'OSI 5, 6, 7', pdu: 'Data', protocols: 'HTTP, HTTPS, DNS, SSH, SMTP', desc: 'Combines user-facing application services, encoding, formatting, and session logic into a single layer.' },
    { num: 3, name: 'Transport', equivalent: 'OSI 4', pdu: 'Segment / Datagram', protocols: 'TCP, UDP', desc: 'Manages connection-oriented (TCP) or connectionless (UDP) communication parameters between application processes.' },
    { num: 2, name: 'Internet', equivalent: 'OSI 3', pdu: 'Packet', protocols: 'IP, ICMP, ARP', desc: 'Routes data packets across multiple networks, determining optimal routes.' },
    { num: 1, name: 'Network Access', equivalent: 'OSI 1, 2', pdu: 'Frame / Bit', protocols: 'Ethernet, Wi-Fi, PPP', desc: 'Translates logical IP packets into physical network signals, framing, and hardware MAC addressing.' }
  ];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📊 OSI vs. TCP/IP Models Reference
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setView('osi'); setActiveLayer(7); }} style={{ background: view === 'osi' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${view === 'osi' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: view === 'osi' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>OSI Model (7 Layers)</button>
          <button onClick={() => { setView('tcpip'); setActiveLayer(4); }} style={{ background: view === 'tcpip' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${view === 'tcpip' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: view === 'tcpip' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>TCP/IP Model (4 Layers)</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          
          {/* Layer List Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {view === 'osi' ? (
              osiLayers.map((layer) => (
                <div
                  key={layer.num}
                  onClick={() => setActiveLayer(layer.num)}
                  style={{
                    background: activeLayer === layer.num ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${activeLayer === layer.num ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 6,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0' }}>
                    Layer {layer.num}: {layer.name}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {layer.protocols.split(',')[0]}
                  </span>
                </div>
              ))
            ) : (
              tcpipLayers.map((layer) => (
                <div
                  key={layer.num}
                  onClick={() => setActiveLayer(layer.num)}
                  style={{
                    background: activeLayer === layer.num ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${activeLayer === layer.num ? '#a78bfa' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 6,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0' }}>
                    Layer {layer.num}: {layer.name}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {layer.equivalent}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Layer Detail Card */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: view === 'osi' ? '#38bdf8' : '#a78bfa' }}>
                {view === 'osi' ? osiLayers[7 - activeLayer]?.name : tcpipLayers[4 - activeLayer]?.name} Layer
              </h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                {view === 'osi' ? osiLayers[7 - activeLayer]?.desc : tcpipLayers[4 - activeLayer]?.desc}
              </p>
            </div>
            
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                📦 <strong>PDU:</strong> {view === 'osi' ? osiLayers[7 - activeLayer]?.pdu : tcpipLayers[4 - activeLayer]?.pdu}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                ⚙️ <strong>Protocols:</strong> {view === 'osi' ? osiLayers[7 - activeLayer]?.protocols : tcpipLayers[4 - activeLayer]?.protocols}
              </div>
            </div>
          </div>

        </div>
      </div>
      <p className="interactive-diagram-helper-text">💡 Tap on different layers to view their responsibilities, protocol examples, and data units (PDUs).</p>
    </div>
  );
}
