import React, { useState } from 'react';

type EvolutionTab = 'h10' | 'h11' | 'h2' | 'h3' | 'matrix';

interface ProtocolSpec {
  name: string;
  year: string;
  rfc: string;
  transport: string;
  handshakeRtt: string;
  holBlocking: string;
  headerCompression: string;
  multiplexing: string;
  httpsSecurity: string;
  connectionMigration: string;
  primaryBottleneck: string;
}

const SPECS: Record<Exclude<EvolutionTab, 'matrix'>, ProtocolSpec> = {
  h10: {
    name: 'HTTP/1.0',
    year: '1996',
    rfc: 'RFC 1945',
    transport: 'TCP (1 connection per request)',
    handshakeRtt: '4 RTTs (TCP SYN + SSL 3.0 + Request)',
    holBlocking: 'Connection-Level: Total serialization per socket',
    headerCompression: 'None (Plaintext ASCII headers repeated)',
    multiplexing: 'None (Strictly 1 request at a time per socket)',
    httpsSecurity: 'SSL 2.0 / SSL 3.0 (No SNI support; 1 cert per IP)',
    connectionMigration: 'Impossible (Connection dies upon close)',
    primaryBottleneck: 'Repeated 3-way handshakes & slow-start reset on every single asset',
  },
  h11: {
    name: 'HTTP/1.1',
    year: '1997 / 1999',
    rfc: 'RFC 2616 / RFC 7230 / RFC 9112',
    transport: 'TCP with Keep-Alive pool (Max 6 parallel conns)',
    handshakeRtt: '3 RTTs initial (TCP + TLS 1.2), 1 RTT subsequent',
    holBlocking: 'Application-Level: FIFO response ordering per TCP socket',
    headerCompression: 'None (Plaintext ASCII; Cookies repeated every time)',
    multiplexing: 'Failed Pipelining (Disabled by all browsers)',
    httpsSecurity: 'TLS 1.0 – 1.2 with SNI (RFC 3546/6066) for Virtual Hosting',
    connectionMigration: 'Impossible (IP change breaks TCP 4-tuple)',
    primaryBottleneck: 'Head-of-Line blocking behind slow queries; domain sharding needed',
  },
  h2: {
    name: 'HTTP/2.0',
    year: '2015',
    rfc: 'RFC 7540 / RFC 9113',
    transport: 'Single TCP connection with Binary Framing Layer',
    handshakeRtt: '2-3 RTTs (TCP + TLS 1.2 with ALPN "h2")',
    holBlocking: 'TCP-Level: 1 lost TCP segment stalls ALL multiplexed streams',
    headerCompression: 'HPACK (Static table 61 entries + dynamic table + Huffman)',
    multiplexing: 'True binary stream interleaving over 1 TCP connection',
    httpsSecurity: 'TLS 1.2+ mandatory in practice; ALPN extension; blacklisted weak ciphers',
    connectionMigration: 'Impossible (Kernel TCP socket bound to IP 4-tuple)',
    primaryBottleneck: 'TCP-level packet loss stall; worse than HTTP/1.1 on lossy 3G/4G networks',
  },
  h3: {
    name: 'HTTP/3.0',
    year: '2022',
    rfc: 'RFC 9114 / RFC 9000 (QUIC)',
    transport: 'QUIC in user-space over UDP datagrams',
    handshakeRtt: '1 RTT initial (Transport + TLS 1.3 unified), 0-RTT resumption',
    holBlocking: 'Zero HoL Blocking: Lost packet isolates ONLY its own stream',
    headerCompression: 'QPACK (Decoupled stream-independent dynamic tables)',
    multiplexing: 'Independent streams over QUIC UDP frames',
    httpsSecurity: 'Mandatory TLS 1.3 embedded into QUIC; transport headers encrypted',
    connectionMigration: 'Native via 64-bit Connection ID (CID) across WiFi ➔ 5G roaming',
    primaryBottleneck: 'UDP kernel overhead & Middlebox/firewall UDP throttling (Port 443)',
  },
};

export default function HttpEvolutionDiagram(): React.JSX.Element {
  const [tab, setTab] = useState<EvolutionTab>('h2');
  const [h2PacketLoss, setH2PacketLoss] = useState<boolean>(true);
  const [h3Roaming, setH3Roaming] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ margin: '2rem 0', fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#38bdf8' }}>
            Protocol Evolution & Architecture: HTTP/1.0 ➔ 1.1 ➔ 2.0 ➔ 3.0
          </span>
        </div>

        {/* Tab switcher pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['h10', 'h11', 'h2', 'h3', 'matrix'] as EvolutionTab[]).map((t) => {
            const labels: Record<EvolutionTab, string> = {
              h10: 'HTTP/1.0',
              h11: 'HTTP/1.1',
              h2: 'HTTP/2.0',
              h3: 'HTTP/3.0 (QUIC)',
              matrix: 'Full Matrix 📊',
            };
            const isSelected = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#38bdf8' : '#94a3b8',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      {tab !== 'matrix' ? (
        <div>
          {/* Top Quick Specs Pill Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '8px 12px' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Year & Spec</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>{SPECS[tab].name} ({SPECS[tab].year})</div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{SPECS[tab].rfc}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '8px 12px' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Transport Protocol</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399' }}>{SPECS[tab].transport.split('(')[0]}</div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{SPECS[tab].handshakeRtt.split('(')[0]}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '8px 12px' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Head-of-Line Blocking</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: tab === 'h3' ? '#34d399' : '#f87171' }}>
                {tab === 'h3' ? 'Resolved (Zero HoL)' : tab === 'h2' ? 'TCP-Level HoL' : 'App-Level HoL'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{SPECS[tab].headerCompression.split('(')[0]}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '8px 12px' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>HTTPS & TLS Security</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#a78bfa' }}>
                {tab === 'h3' ? 'Integrated TLS 1.3' : tab === 'h2' ? 'TLS 1.2+ (ALPN h2)' : tab === 'h11' ? 'TLS 1.0-1.2 with SNI' : 'SSL 2.0/3.0 (No SNI)'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{SPECS[tab].connectionMigration.split('(')[0]}</div>
            </div>
          </div>

          {/* SVG Visual Model */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', marginBottom: '1.25rem' }}>
            {/* HTTP/1.0 SVG Canvas */}
            {tab === 'h10' && (
              <svg viewBox="0 0 760 220" className="interactive-diagram-svg">
                <defs>
                  <marker id="arrow-h10-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="arrow-h10-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#34d399" />
                  </marker>
                  <marker id="arrow-h10-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#f87171" />
                  </marker>
                </defs>

                {/* Client / Server Nodes */}
                <rect x="20" y="20" width="110" height="180" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="75" y="45" fill="#38bdf8" fontWeight="800" fontSize="13" textAnchor="middle">Browser</text>
                <text x="75" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">Client (1996)</text>
                <circle cx="75" cy="110" r="24" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" strokeDasharray="3 3" />
                <text x="75" y="115" fill="#38bdf8" fontSize="18" textAnchor="middle">💻</text>
                <text x="75" y="165" fill="#f87171" fontSize="10" fontWeight="700" textAnchor="middle">1 Socket Open</text>
                <text x="75" y="180" fill="#94a3b8" fontSize="9" textAnchor="middle">at any instant</text>

                <rect x="630" y="20" width="110" height="180" rx="8" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                <text x="685" y="45" fill="#34d399" fontWeight="800" fontSize="13" textAnchor="middle">Web Server</text>
                <text x="685" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">NCSA / Apache</text>
                <circle cx="685" cy="110" r="24" fill="rgba(52, 211, 153, 0.1)" stroke="#34d399" strokeDasharray="3 3" />
                <text x="685" y="115" fill="#34d399" fontSize="18" textAnchor="middle">🖥️</text>
                <text x="685" y="165" fill="#fbbf24" fontSize="10" fontWeight="700" textAnchor="middle">Port 80 / 443</text>
                <text x="685" y="180" fill="#94a3b8" fontSize="9" textAnchor="middle">SSL 3.0 (No SNI)</text>

                {/* Connection 1 */}
                <g>
                  <rect x="160" y="30" width="440" height="42" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" />
                  <path d="M 170 51 L 590 51" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-h10-blue)" className="interactive-diagram-flowing-path" />
                  <text x="175" y="44" fill="#38bdf8" fontSize="10" fontWeight="700">TCP Conn #1: HTML</text>
                  <text x="380" y="44" fill="#cbd5e1" fontSize="9" textAnchor="middle">3-Way Handshake ➔ GET /index.html ➔ 200 OK (HTML) ➔ FIN/ACK Closed</text>
                  <text x="585" y="65" fill="#f87171" fontSize="9" fontWeight="700" textAnchor="end">Socket Closed ✕</text>
                </g>

                {/* Connection 2 */}
                <g>
                  <rect x="160" y="85" width="440" height="42" rx="6" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 2" />
                  <path d="M 170 106 L 590 106" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#arrow-h10-blue)" />
                  <text x="175" y="99" fill="#fbbf24" fontSize="10" fontWeight="700">TCP Conn #2: CSS</text>
                  <text x="380" y="99" fill="#cbd5e1" fontSize="9" textAnchor="middle">NEW 3-Way Handshake ➔ GET /style.css ➔ 200 OK (CSS) ➔ FIN/ACK Closed</text>
                  <text x="585" y="120" fill="#f87171" fontSize="9" fontWeight="700" textAnchor="end">Socket Closed ✕</text>
                </g>

                {/* Connection 3 */}
                <g>
                  <rect x="160" y="140" width="440" height="42" rx="6" fill="#0f172a" stroke="#34d399" strokeWidth="1" strokeDasharray="4 2" />
                  <path d="M 170 161 L 590 161" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-h10-green)" />
                  <text x="175" y="154" fill="#34d399" fontSize="10" fontWeight="700">TCP Conn #3: Image</text>
                  <text x="380" y="154" fill="#cbd5e1" fontSize="9" textAnchor="middle">NEW 3-Way Handshake ➔ GET /logo.png ➔ 200 OK (PNG) ➔ FIN/ACK Closed</text>
                  <text x="585" y="175" fill="#f87171" fontSize="9" fontWeight="700" textAnchor="end">Socket Closed ✕</text>
                </g>

                <text x="380" y="208" fill="#f87171" fontSize="11" fontWeight="700" textAnchor="middle">
                  ⚠️ Severe Latency Penalty: 100 web assets = 100 complete TCP handshakes + 100 TCP Slow Start restarts!
                </text>
              </svg>
            )}

            {/* HTTP/1.1 SVG Canvas */}
            {tab === 'h11' && (
              <svg viewBox="0 0 760 220" className="interactive-diagram-svg">
                <defs>
                  <marker id="arrow-h11-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="arrow-h11-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#34d399" />
                  </marker>
                  <marker id="arrow-h11-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#f87171" />
                  </marker>
                </defs>

                {/* Client / Server Nodes */}
                <rect x="20" y="20" width="115" height="180" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="77" y="45" fill="#38bdf8" fontWeight="800" fontSize="13" textAnchor="middle">Browser</text>
                <text x="77" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">Pool (Max 6 Conns)</text>
                <circle cx="77" cy="110" r="24" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" />
                <text x="77" y="115" fill="#38bdf8" fontSize="18" textAnchor="middle">🌐</text>
                <text x="77" y="165" fill="#34d399" fontSize="10" fontWeight="700" textAnchor="middle">Keep-Alive: ON</text>
                <text x="77" y="180" fill="#cbd5e1" fontSize="9" textAnchor="middle">Socket Reuse</text>

                <rect x="625" y="20" width="115" height="180" rx="8" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="682" y="45" fill="#a78bfa" fontWeight="800" fontSize="13" textAnchor="middle">Origin Server</text>
                <text x="682" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">Nginx / Tomcat</text>
                <circle cx="682" cy="110" r="24" fill="rgba(167, 139, 250, 0.1)" stroke="#a78bfa" />
                <text x="682" y="115" fill="#a78bfa" fontSize="18" textAnchor="middle">🏢</text>
                <text x="682" y="165" fill="#38bdf8" fontSize="10" fontWeight="700" textAnchor="middle">TLS 1.2 + SNI</text>
                <text x="682" y="180" fill="#94a3b8" fontSize="9" textAnchor="middle">Virtual Hosting</text>

                {/* Persistent Socket 1 (HOL Blocked) */}
                <g>
                  <rect x="160" y="30" width="440" height="48" rx="6" fill="#0f172a" stroke="#f87171" strokeWidth="1.5" />
                  <text x="170" y="46" fill="#f87171" fontSize="10" fontWeight="800">TCP Socket #1 [STALLED BY SLOW DB QUERY]</text>
                  <rect x="170" y="52" width="160" height="18" rx="3" fill="rgba(248, 113, 113, 0.2)" stroke="#f87171" />
                  <text x="250" y="65" fill="#f87171" fontSize="9" fontWeight="700" textAnchor="middle">Req 1: /api/checkout (2.5s)</text>

                  <rect x="345" y="52" width="150" height="18" rx="3" fill="rgba(255, 255, 255, 0.04)" stroke="#94a3b8" strokeDasharray="2 2" />
                  <text x="420" y="65" fill="#94a3b8" fontSize="9" textAnchor="middle">Req 2: /api/user (BLOCKED)</text>

                  <text x="590" y="65" fill="#f87171" fontSize="10" fontWeight="800" textAnchor="end">HoL Blocked!</text>
                </g>

                {/* Persistent Socket 2 (Fast) */}
                <g>
                  <rect x="160" y="90" width="440" height="44" rx="6" fill="#0f172a" stroke="#34d399" strokeWidth="1" />
                  <text x="170" y="105" fill="#34d399" fontSize="10" fontWeight="700">TCP Socket #2 [REUSED - FAST PIPELINE]</text>
                  <rect x="170" y="110" width="140" height="18" rx="3" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" />
                  <text x="240" y="123" fill="#34d399" fontSize="9" textAnchor="middle">Req 3: /style.css (15ms)</text>
                  <rect x="320" y="110" width="140" height="18" rx="3" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" />
                  <text x="390" y="123" fill="#34d399" fontSize="9" textAnchor="middle">Req 4: /app.js (25ms)</text>
                </g>

                {/* Persistent Socket 3 (Domain Sharding) */}
                <g>
                  <rect x="160" y="145" width="440" height="44" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <text x="170" y="160" fill="#38bdf8" fontSize="10" fontWeight="700">TCP Socket #3 [Domain Shard: cdn.domain.com]</text>
                  <rect x="170" y="165" width="220" height="18" rx="3" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                  <text x="280" y="178" fill="#38bdf8" fontSize="9" textAnchor="middle">Req 5: /banner.webp (Chunked Transfer)</text>
                </g>

                <text x="380" y="210" fill="#fbbf24" fontSize="10" fontWeight="600" textAnchor="middle">
                  HTTP/1.1 added Keep-Alive & Chunked encoding, but FIFO response ordering causes Application-Level HoL blocking.
                </text>
              </svg>
            )}

            {/* HTTP/2.0 SVG Canvas */}
            {tab === 'h2' && (
              <svg viewBox="0 0 760 220" className="interactive-diagram-svg">
                <defs>
                  <marker id="arrow-h2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#a78bfa" />
                  </marker>
                </defs>

                {/* Client / Server Nodes */}
                <rect x="20" y="20" width="115" height="180" rx="8" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="77" y="45" fill="#a78bfa" fontWeight="800" fontSize="13" textAnchor="middle">Browser</text>
                <text x="77" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">Binary Framing</text>
                <circle cx="77" cy="110" r="24" fill="rgba(167, 139, 250, 0.1)" stroke="#a78bfa" />
                <text x="77" y="115" fill="#a78bfa" fontSize="18" textAnchor="middle">⚡</text>
                <text x="77" y="165" fill="#34d399" fontSize="10" fontWeight="700" textAnchor="middle">1 TCP Conn</text>
                <text x="77" y="180" fill="#cbd5e1" fontSize="9" textAnchor="middle">HPACK Compression</text>

                <rect x="625" y="20" width="115" height="180" rx="8" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="682" y="45" fill="#a78bfa" fontWeight="800" fontSize="13" textAnchor="middle">H2 Server</text>
                <text x="682" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">ALPN: "h2"</text>
                <circle cx="682" cy="110" r="24" fill="rgba(167, 139, 250, 0.1)" stroke="#a78bfa" />
                <text x="682" y="115" fill="#a78bfa" fontSize="18" textAnchor="middle">🚀</text>
                <text x="682" y="165" fill="#38bdf8" fontSize="10" fontWeight="700" textAnchor="middle">Stream Dep/Weights</text>
                <text x="682" y="180" fill="#cbd5e1" fontSize="9" textAnchor="middle">Flow Control Windows</text>

                {/* Single TCP Pipe Background */}
                <rect x="155" y="40" width="450" height="130" rx="10" fill="#0c101c" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="170" y="58" fill="#a78bfa" fontSize="11" fontWeight="800">Single Multiplexed TCP Connection (Kernel Socket Stream)</text>

                {/* Interleaved Binary Frames */}
                {/* Stream 1 */}
                <rect x="170" y="70" width="70" height="26" rx="4" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" />
                <text x="205" y="86" fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle">Str 1: HEAD</text>

                {/* Stream 3 */}
                <rect x="250" y="70" width="70" height="26" rx="4" fill="rgba(52, 211, 153, 0.25)" stroke="#34d399" />
                <text x="285" y="86" fill="#34d399" fontSize="9" fontWeight="700" textAnchor="middle">Str 3: DATA</text>

                {/* Stream 1 DROPPED PACKET (Simulated Loss) */}
                <rect
                  x="330"
                  y="70"
                  width="75"
                  height="26"
                  rx="4"
                  fill={h2PacketLoss ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.25)'}
                  stroke={h2PacketLoss ? '#ef4444' : '#38bdf8'}
                  strokeWidth={h2PacketLoss ? 2 : 1}
                />
                <text x="367" y="86" fill={h2PacketLoss ? '#fca5a5' : '#38bdf8'} fontSize="9" fontWeight="800" textAnchor="middle">
                  {h2PacketLoss ? '⚠️ Str 1: LOST' : 'Str 1: DATA'}
                </text>

                {/* Stream 5 */}
                <rect x="415" y="70" width="70" height="26" rx="4" fill="rgba(167, 139, 250, 0.25)" stroke="#a78bfa" />
                <text x="450" y="86" fill="#a78bfa" fontSize="9" fontWeight="700" textAnchor="middle">Str 5: HEAD</text>

                {/* Stream 3 */}
                <rect x="495" y="70" width="70" height="26" rx="4" fill="rgba(52, 211, 153, 0.25)" stroke="#34d399" />
                <text x="530" y="86" fill="#34d399" fontSize="9" fontWeight="700" textAnchor="middle">Str 3: DATA</text>

                {/* Kernel TCP Stall Diagnostic Callout */}
                {h2PacketLoss ? (
                  <g>
                    <rect x="170" y="112" width="420" height="46" rx="6" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1" />
                    <text x="180" y="128" fill="#fca5a5" fontSize="10" fontWeight="800">
                      🚨 TCP-Level Head-of-Line Blocking Triggered:
                    </text>
                    <text x="180" y="145" fill="#fecaca" fontSize="9">
                      Lost TCP segment for Stream 1 causes OS Kernel TCP buffer to block Streams 3 & 5 until retransmission completes!
                    </text>
                  </g>
                ) : (
                  <g>
                    <rect x="170" y="112" width="420" height="46" rx="6" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" strokeWidth="1" />
                    <text x="180" y="130" fill="#86efac" fontSize="10" fontWeight="700">
                      All binary frames interleaved seamlessly across single TCP pipe with HPACK compression.
                    </text>
                  </g>
                )}

                <text x="380" y="208" fill="#cbd5e1" fontSize="10" textAnchor="middle">
                  HTTP/2 solved application HoL with 9-byte binary frames, but inherited TCP's linear transport HoL blocking.
                </text>
              </svg>
            )}

            {/* HTTP/3.0 (QUIC) SVG Canvas */}
            {tab === 'h3' && (
              <svg viewBox="0 0 760 220" className="interactive-diagram-svg">
                <defs>
                  <marker id="arrow-h3" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#34d399" />
                  </marker>
                </defs>

                {/* Client / Server Nodes */}
                <rect x="20" y="20" width="115" height="180" rx="8" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                <text x="77" y="45" fill="#34d399" fontWeight="800" fontSize="13" textAnchor="middle">Mobile Client</text>
                <text x="77" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">{h3Roaming ? '5G (172.56.21.8)' : 'WiFi (192.168.1.5)'}</text>
                <circle cx="77" cy="110" r="24" fill="rgba(52, 211, 153, 0.1)" stroke="#34d399" />
                <text x="77" y="115" fill="#34d399" fontSize="18" textAnchor="middle">📱</text>
                <text x="77" y="165" fill="#38bdf8" fontSize="10" fontWeight="700" textAnchor="middle">CID: 0x8a92f4c1</text>
                <text x="77" y="180" fill="#cbd5e1" fontSize="9" textAnchor="middle">0-RTT Resumption</text>

                <rect x="625" y="20" width="115" height="180" rx="8" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                <text x="682" y="45" fill="#34d399" fontWeight="800" fontSize="13" textAnchor="middle">HTTP/3 Edge</text>
                <text x="682" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">Cloudflare / Envoy</text>
                <circle cx="682" cy="110" r="24" fill="rgba(52, 211, 153, 0.1)" stroke="#34d399" />
                <text x="682" y="115" fill="#34d399" fontSize="18" textAnchor="middle">🛡️</text>
                <text x="682" y="165" fill="#a78bfa" fontSize="10" fontWeight="700" textAnchor="middle">Embedded TLS 1.3</text>
                <text x="682" y="180" fill="#cbd5e1" fontSize="9" textAnchor="middle">QPACK Compression</text>

                {/* QUIC User-Space Container */}
                <rect x="155" y="30" width="450" height="150" rx="10" fill="#09131d" stroke="#34d399" strokeWidth="1.5" />
                <text x="170" y="48" fill="#34d399" fontSize="11" fontWeight="800">
                  QUIC / UDP Datagram Engine (User-Space Independent Streams)
                </text>

                {/* Stream 1 (Lost packet isolated to itself) */}
                <g>
                  <rect x="170" y="58" width="420" height="32" rx="4" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="1" />
                  <text x="180" y="78" fill="#fca5a5" fontSize="10" fontWeight="700">Stream 1: Checkout API (Packet #4 Lost)</text>
                  <text x="470" y="78" fill="#ef4444" fontSize="9" fontWeight="800">Isolated Recovery ➔</text>
                </g>

                {/* Stream 3 (Flowing smoothly!) */}
                <g>
                  <rect x="170" y="96" width="420" height="32" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1" />
                  <path d="M 180 112 L 570 112" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-h3)" className="interactive-diagram-flowing-path" />
                  <text x="180" y="110" fill="#86efac" fontSize="10" fontWeight="700">Stream 3: Style CSS (Uninterrupted Flowing Delivery!)</text>
                  <text x="575" y="110" fill="#34d399" fontSize="9" fontWeight="800" textAnchor="end">Active ✓</text>
                </g>

                {/* Stream 5 (Flowing smoothly!) */}
                <g>
                  <rect x="170" y="134" width="420" height="32" rx="4" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1" />
                  <path d="M 180 150 L 570 150" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-h3)" className="interactive-diagram-flowing-path" />
                  <text x="180" y="148" fill="#7dd3fc" fontSize="10" fontWeight="700">Stream 5: Avatar WebP (Zero Delay from Stream 1 Loss!)</text>
                  <text x="575" y="148" fill="#38bdf8" fontSize="9" fontWeight="800" textAnchor="end">Active ✓</text>
                </g>

                <text x="380" y="208" fill="#34d399" fontSize="10" fontWeight="700" textAnchor="middle">
                  QUIC replaces OS kernel TCP with UDP user-space: Packet loss on Stream 1 NEVER blocks Streams 3 or 5!
                </text>
              </svg>
            )}
          </div>

          {/* Interactive Simulation Controls */}
          {tab === 'h2' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.25rem', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>🧪 Incident Simulation:</span>
              <button
                type="button"
                onClick={() => setH2PacketLoss(!h2PacketLoss)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: h2PacketLoss ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                  color: h2PacketLoss ? '#f87171' : '#34d399',
                  border: `1px solid ${h2PacketLoss ? '#ef4444' : '#34d399'}`,
                }}
              >
                {h2PacketLoss ? '💥 Trigger 1 Packet Loss (HoL Active)' : '🟢 Normal Flow (Zero Loss)'}
              </button>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                Toggle to visualize why 2% packet loss severely degrades HTTP/2 over mobile cell towers.
              </span>
            </div>
          )}

          {tab === 'h3' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.25rem', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>🧪 Roaming Simulation:</span>
              <button
                type="button"
                onClick={() => setH3Roaming(!h3Roaming)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid #38bdf8',
                }}
              >
                {h3Roaming ? '📶 Roamed to 5G Cell (IP changed!)' : '🏠 On Home WiFi (192.168.1.5)'}
              </button>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                Connection ID (CID) persists the session across NAT/IP transitions without TCP re-handshake or TLS renegotiation.
              </span>
            </div>
          )}

          {/* Deep Architectural Breakdown Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '14px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚙️</span> Under-the-Hood Mechanics
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                {tab === 'h10' &&
                  'HTTP/1.0 uses a completely ephemeral transport model. Every resource fetch requires socket() -> connect() -> write() -> read() -> close(). The OS kernel maintains TIME_WAIT states on thousands of terminated sockets, exhausting ephemeral port ranges under moderate traffic.'}
                {tab === 'h11' &&
                  'HTTP/1.1 introduced persistent TCP connections via "Connection: keep-alive" (default in RFC 2616). It introduced the mandatory "Host:" header to unlock Name-Based Virtual Hosting. However, because responses must strictly match the FIFO request order on the same socket, a slow backend query on request 1 starves all subsequent requests on that socket.'}
                {tab === 'h2' &&
                  'HTTP/2 parses binary framing layers into 9-byte headers (Length, Type, Flags, Stream ID). Streams are multiplexed into interleaved frames over one TCP connection. HPACK maintains a 61-entry static table and sliding dynamic table to eliminate repetitive Cookie/Authorization headers. However, because TCP treats all frames as one monolithic byte stream, a dropped TCP packet blocks kernel delivery of all streams.'}
                {tab === 'h3' &&
                  'HTTP/3 replaces TCP with QUIC over UDP (RFC 9000). QUIC executes in user-space, implementing per-stream flow control and independent packet acknowledgment. Handshakes unify transport and TLS 1.3 encryption in 1 RTT (0-RTT on resumption). QPACK resolves HPACK head-of-line blocking by separating control streams from request payload streams.'}
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '14px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠️</span> Production Gotchas & Bottlenecks
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                {tab === 'h10' &&
                  'SSL 2.0 / 3.0 lacked Server Name Indication (SNI). Every secure domain required a unique dedicated IPv4 address. TCP Slow-Start had to restart on every asset, preventing the connection from ever utilizing high-bandwidth pipes.'}
                {tab === 'h11' &&
                  'Browsers worked around the 6-connection-per-domain limit via "Domain Sharding" (assets1.cdn.com, assets2.cdn.com), which tripled DNS lookups, TCP handshakes, and TLS session setups. HTTP Pipelining caused so many proxy corruption bugs that it was disabled across all major browsers.'}
                {tab === 'h2' &&
                  'On packet-loss networks (>2%), HTTP/2 is actually slower than HTTP/1.1 with 6 parallel connections! Furthermore, Server Push (PUSH_PROMISE) was so complex, race-condition prone, and cache-unaware that Google Chrome completely removed Server Push support in Chrome 106.'}
                {tab === 'h3' &&
                  'Many corporate firewalls and middleboxes block UDP traffic on port 443, mistaking it for UDP amplification attacks. Clients must implement graceful fallback to HTTP/2 over TCP via the "Alt-Svc: h3=\\":443\\"" header. Kernel UDP socket processing can also incur higher CPU usage without UDP Generic Segmentation Offload (GSO).'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Full Comparison Matrix Tab */
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
              color: '#e2e8f0',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ background: 'rgba(56, 189, 248, 0.08)', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <th style={{ padding: '10px 14px', color: '#38bdf8', fontWeight: 800 }}>Feature / Spec</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 700 }}>HTTP/1.0 (1996)</th>
                <th style={{ padding: '10px 14px', color: '#38bdf8', fontWeight: 700 }}>HTTP/1.1 (1999)</th>
                <th style={{ padding: '10px 14px', color: '#a78bfa', fontWeight: 700 }}>HTTP/2.0 (2015)</th>
                <th style={{ padding: '10px 14px', color: '#34d399', fontWeight: 800 }}>HTTP/3.0 (2022)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>RFC Standard</td>
                <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>RFC 1945</td>
                <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>RFC 2616 / 7230 / 9112</td>
                <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>RFC 7540 / 9113</td>
                <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 700 }}>RFC 9114 / 9000 (QUIC)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>Transport Layer</td>
                <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>TCP (1 request per conn)</td>
                <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>TCP (Keep-Alive, pool of 6)</td>
                <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>TCP (Single connection)</td>
                <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 700 }}>QUIC over UDP</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>Multiplexing</td>
                <td style={{ padding: '10px 14px', color: '#f87171' }}>None (Sequential)</td>
                <td style={{ padding: '10px 14px', color: '#fbbf24' }}>Pipelining (Broken/disabled)</td>
                <td style={{ padding: '10px 14px', color: '#a78bfa' }}>Binary Framing Multiplexing</td>
                <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 700 }}>Independent QUIC Streams</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>HoL Blocking</td>
                <td style={{ padding: '10px 14px', color: '#f87171' }}>Connection-Level</td>
                <td style={{ padding: '10px 14px', color: '#f87171' }}>Application-Level (FIFO)</td>
                <td style={{ padding: '10px 14px', color: '#f87171' }}>TCP-Level (Packet loss stall)</td>
                <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 800 }}>Zero HoL (Stream Isolated)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>Header Format</td>
                <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>Plaintext ASCII</td>
                <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>Plaintext ASCII</td>
                <td style={{ padding: '10px 14px', color: '#a78bfa' }}>HPACK (Static/Dynamic table)</td>
                <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 700 }}>QPACK (Out-of-order safe)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>HTTPS / Security</td>
                <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>SSL 2.0/3.0 (No SNI)</td>
                <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>TLS 1.0 - 1.2 with SNI</td>
                <td style={{ padding: '10px 14px', color: '#a78bfa' }}>TLS 1.2+ mandatory (ALPN h2)</td>
                <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 700 }}>TLS 1.3 native in QUIC</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>Connection Migration</td>
                <td style={{ padding: '10px 14px', color: '#f87171' }}>No</td>
                <td style={{ padding: '10px 14px', color: '#f87171' }}>No</td>
                <td style={{ padding: '10px 14px', color: '#f87171' }}>No</td>
                <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 800 }}>Yes (64-bit Connection ID)</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>Handshake Latency</td>
                <td style={{ padding: '10px 14px', color: '#f87171' }}>4 RTTs (TCP + SSL + Req)</td>
                <td style={{ padding: '10px 14px', color: '#fbbf24' }}>2-3 RTTs initial, 1 RTT warm</td>
                <td style={{ padding: '10px 14px', color: '#a78bfa' }}>2-3 RTTs (TCP + TLS + ALPN)</td>
                <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 800 }}>1 RTT cold, 0-RTT warm</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
