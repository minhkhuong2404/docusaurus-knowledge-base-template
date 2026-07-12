import React, { useState } from 'react';

type StackLayer = 'app' | 'security' | 'transport' | 'network';

export default function QuicStackDiagram(): React.JSX.Element {
  const [activeLayer, setActiveLayer] = useState<StackLayer>('transport');

  const layerInfo = {
    app: {
      title: 'Application Layer',
      tcpStack: 'HTTP/1.1 or HTTP/2',
      quicStack: 'HTTP/3 (QPACK / Framing)',
      desc: 'HTTP/3 maps standard semantics (methods, headers) directly to independent QUIC streams, bypassing HPACK head-of-line bottlenecks by utilizing QPACK.'
    },
    security: {
      title: 'Security Layer (TLS)',
      tcpStack: 'TLS 1.2 or 1.3 (Optional Add-on)',
      quicStack: 'TLS 1.3 (Mandatory & Baked-in)',
      desc: 'In the classic stack, TLS is a wrapper on top of TCP. In QUIC, TLS 1.3 is fully integrated. Connection handshakes establish security parameters in a single round trip (1 RTT).'
    },
    transport: {
      title: 'Transport Layer',
      tcpStack: 'TCP (Stateful, Kernel-space)',
      quicStack: 'QUIC (Userspace multiplexing)',
      desc: 'TCP runs inside kernel space, making protocol changes slow (ossification). QUIC runs in userspace over UDP, allowing rapid deployment of new congestion control or flow control schemes.'
    },
    network: {
      title: 'Network / Internet Layer',
      tcpStack: 'IP (IPv4 or IPv6)',
      quicStack: 'IP (IPv4 or IPv6)',
      desc: 'Both stacks utilize IP routing at Layer 3 to send packets across networks.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📊 HTTP/2 (TCP) vs. HTTP/3 (QUIC) Stack Comparison
        </h3>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1rem' }}>
          
          {/* Classic Stack */}
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>Classic HTTP/2 Stack</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: '0.72rem' }}>
              <div onClick={() => setActiveLayer('app')} style={{ padding: '8px', background: activeLayer === 'app' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeLayer === 'app' ? '#38bdf8' : 'rgba(255,255,255,0.05)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer', color: '#cbd5e1' }}>
                HTTP/1.1 or HTTP/2
              </div>
              <div onClick={() => setActiveLayer('security')} style={{ padding: '8px', background: activeLayer === 'security' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeLayer === 'security' ? '#38bdf8' : 'rgba(255,255,255,0.05)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer', color: '#cbd5e1' }}>
                TLS (Optional Layer)
              </div>
              <div onClick={() => setActiveLayer('transport')} style={{ padding: '8px', background: activeLayer === 'transport' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeLayer === 'transport' ? '#38bdf8' : 'rgba(255,255,255,0.05)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer', color: '#cbd5e1' }}>
                TCP (Connection-oriented)
              </div>
              <div onClick={() => setActiveLayer('network')} style={{ padding: '8px', background: activeLayer === 'network' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeLayer === 'network' ? '#38bdf8' : 'rgba(255,255,255,0.05)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer', color: '#cbd5e1' }}>
                IP Routing
              </div>
            </div>
          </div>

          {/* QUIC Stack */}
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#a78bfa', textAlign: 'center' }}>Modern HTTP/3 Stack</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: '0.72rem' }}>
              <div onClick={() => setActiveLayer('app')} style={{ padding: '8px', background: activeLayer === 'app' ? 'rgba(167,139,250,0.12)' : '#0d1527', border: `1px solid ${activeLayer === 'app' ? '#a78bfa' : 'rgba(255,255,255,0.05)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer', color: '#cbd5e1' }}>
                HTTP/3 (QPACK / Frames)
              </div>
              <div onClick={() => setActiveLayer('security')} style={{ padding: '8px', background: activeLayer === 'security' ? 'rgba(167,139,250,0.12)' : '#0d1527', border: `1px solid ${activeLayer === 'security' ? '#a78bfa' : 'rgba(255,255,255,0.05)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer', color: '#cbd5e1' }}>
                QUIC (Mandatory TLS 1.3)
              </div>
              <div onClick={() => setActiveLayer('transport')} style={{ padding: '8px', background: activeLayer === 'transport' ? 'rgba(167,139,250,0.12)' : '#0d1527', border: `1px solid ${activeLayer === 'transport' ? '#a78bfa' : 'rgba(255,255,255,0.05)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer', color: '#cbd5e1' }}>
                UDP (Userspace sockets)
              </div>
              <div onClick={() => setActiveLayer('network')} style={{ padding: '8px', background: activeLayer === 'network' ? 'rgba(167,139,250,0.12)' : '#0d1527', border: `1px solid ${activeLayer === 'network' ? '#a78bfa' : 'rgba(255,255,255,0.05)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer', color: '#cbd5e1' }}>
                IP Routing
              </div>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>{layerInfo[activeLayer].title} Comparison</h4>
          <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '4px' }}>
            • TCP Stack: <strong>{layerInfo[activeLayer].tcpStack}</strong>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '8px' }}>
            • QUIC Stack: <strong>{layerInfo[activeLayer].quicStack}</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45 }}>
            {layerInfo[activeLayer].desc}
          </p>
        </div>
      </div>
      <p className="interactive-diagram-helper-text">💡 Tap on any layer box in either stack to compare their behaviors side-by-side.</p>
    </div>
  );
}
