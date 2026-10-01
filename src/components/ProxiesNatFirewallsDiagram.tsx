import React, { useState } from 'react';

type DiagramTab = 'proxies' | 'netfilter' | 'vpn';

interface ProxyModeInfo {
  id: 'forward' | 'reverse' | 'socks5';
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  clientVisibleIp: string;
  serverVisibleIp: string;
  dnsResolvedBy: string;
  tlsTerminatedAt: string;
  keyHeader: string;
  codeSnippet: string;
}

const PROXY_MODES: Record<'forward' | 'reverse' | 'socks5', ProxyModeInfo> = {
  forward: {
    id: 'forward',
    title: 'Forward Proxy (Client-Side Middlebox)',
    badge: 'Egress Gate',
    badgeColor: '#38bdf8',
    description: 'Acts on behalf of internal clients to access the external internet. Used for corporate egress policy, malware scanning, content filtering, and data loss prevention (DLP).',
    clientVisibleIp: '192.168.1.50 (Internal Client)',
    serverVisibleIp: '203.0.113.10 (Proxy Public IP)',
    dnsResolvedBy: 'Forward Proxy (avoids internal DNS leak)',
    tlsTerminatedAt: 'Origin Server (via HTTP CONNECT tunnel) or Proxy (via MITM Root CA inspection)',
    keyHeader: 'Proxy-Authorization: Basic ..., Forwarded: for=192.168.1.50',
    codeSnippet: `// Client initiates HTTP CONNECT tunnel for HTTPS:
CONNECT api.stripe.com:443 HTTP/1.1
Host: api.stripe.com:443
Proxy-Connection: keep-alive

// Proxy responds after establishing outbound TCP socket:
HTTP/1.1 200 Connection Established

// Blind byte streaming ensues between Client and Origin TLS!`
  },
  reverse: {
    id: 'reverse',
    title: 'Reverse Proxy (Server-Side Gateway / Envoy / Nginx)',
    badge: 'Ingress Gate',
    badgeColor: '#34d399',
    description: 'Acts on behalf of backend origin servers. Terminates client TLS handshakes, performs L7 URL routing, applies rate limiting, strips malicious headers, and shields private network topology.',
    clientVisibleIp: '198.51.100.25 (External Public User)',
    serverVisibleIp: '10.244.0.15 (Reverse Proxy Cluster IP)',
    dnsResolvedBy: 'Public DNS (resolves to Proxy VIP / Anycast IP)',
    tlsTerminatedAt: 'Reverse Proxy (Edge SSL offloading with HTTP/2 or HTTP/3 multiplexing)',
    keyHeader: 'X-Forwarded-For: 198.51.100.25, X-Forwarded-Proto: https, Forwarded: for=198.51.100.25;proto=https',
    codeSnippet: `// Reverse Proxy Nginx Configuration:
location /api/v1/ {
    proxy_pass http://upstream_microservice;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`
  },
  socks5: {
    id: 'socks5',
    title: 'SOCKS5 Protocol (RFC 1928 - Layer 5 Proxy)',
    badge: 'Layer 5 Circuit',
    badgeColor: '#a78bfa',
    description: 'Protocol-agnostic transport layer relay operating at OSI Layer 5. Supports both TCP and UDP forwarding, client authentication (GSSAPI, username/password), and remote domain resolution (SOCKS5a).',
    clientVisibleIp: '10.0.1.20 (Workstation)',
    serverVisibleIp: '198.51.100.77 (SOCKS5 Proxy IP)',
    dnsResolvedBy: 'SOCKS5 Proxy when using ATYP 0x03 (Domain Name resolution)',
    tlsTerminatedAt: 'End-to-end between Client and Destination (SOCKS is transparent to payload)',
    keyHeader: 'Binary Handshake: 0x05 (Ver) | 0x01 (Auth Methods) | 0x00 (No Auth)',
    codeSnippet: `// RFC 1928 SOCKS5 Connect Request:
+----+-----+-------+------+----------+----------+
|VER | CMD |  RSV  | ATYP | DST.ADDR | DST.PORT |
| 1  |  1  | X'00' |  1   | Variable |    2     |
+----+-----+-------+------+----------+----------+
// CMD 0x01=CONNECT, 0x02=BIND, 0x03=UDP ASSOCIATE
// ATYP 0x01=IPv4, 0x03=FQDN (Remote DNS), 0x04=IPv6`
  }
};

export default function ProxiesNatFirewallsDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DiagramTab>('proxies');
  const [proxyMode, setProxyMode] = useState<'forward' | 'reverse' | 'socks5'>('reverse');
  const [activeHook, setActiveHook] = useState<string>('PREROUTING');
  const [packetScenario, setPacketScenario] = useState<'inbound' | 'forward' | 'outbound'>('forward');

  const selectedProxy = PROXY_MODES[proxyMode];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid rgba(152, 162, 179, 0.25)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
          <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
            Middlebox Engine: Proxies, Linux Netfilter Stateful Firewalls &amp; VPN Encapsulation
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('proxies')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'proxies' ? '1px solid #38bdf8' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'proxies' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'proxies' ? '#0284c7' : 'var(--ifm-color-content)'
            }}
          >
            Proxy Topologies (L4/L7/SOCKS5)
          </button>
          <button
            onClick={() => setActiveTab('netfilter')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'netfilter' ? '1px solid #34d399' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'netfilter' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
              color: activeTab === 'netfilter' ? '#166534' : 'var(--ifm-color-content)'
            }}
          >
            Linux Netfilter &amp; Conntrack
          </button>
          <button
            onClick={() => setActiveTab('vpn')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'vpn' ? '1px solid #a78bfa' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'vpn' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
              color: activeTab === 'vpn' ? '#6b21a8' : 'var(--ifm-color-content)'
            }}
          >
            VPN TUN &amp; MSS Clamping
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: PROXIES */}
        {activeTab === 'proxies' && (
          <div>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {(['reverse', 'forward', 'socks5'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setProxyMode(mode)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: proxyMode === mode ? `1px solid ${PROXY_MODES[mode].badgeColor}` : '1px solid rgba(152, 162, 179, 0.3)',
                    backgroundColor: proxyMode === mode ? `${PROXY_MODES[mode].badgeColor}22` : 'var(--ifm-card-background-color, #f7fdf9)',
                    color: 'var(--ifm-color-content)'
                  }}
                >
                  {PROXY_MODES[mode].title.split(' ')[0]} Proxy
                </button>
              ))}
            </div>

            {/* SVG Visualizer */}
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '16px' }}>
              <svg viewBox="0 0 820 180" width="100%" height="auto" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arrow-proxy" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill={selectedProxy.badgeColor} />
                  </marker>
                  <marker id="arrow-return" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <style>{`
                    @keyframes flowDashes {
                      0% { stroke-dashoffset: 24; }
                      100% { stroke-dashoffset: 0; }
                    }
                    .flowing-conduit {
                      animation: flowDashes 1.2s linear infinite;
                    }
                  `}</style>
                </defs>

                {/* Client Node */}
                <g transform="translate(40, 45)">
                  <rect width="180" height="90" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#38bdf8" strokeWidth="2"/>
                  <text x="90" y="28" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="13">Client Machine</text>
                  <text x="90" y="48" textAnchor="middle" fill="#334155" fontSize="10">{proxyMode === 'forward' ? 'Internal Client: 192.168.1.50' : 'Public Client: 198.51.100.25'}</text>
                  <rect x="25" y="60" width="130" height="20" rx="4" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1"/>
                  <text x="90" y="74" textAnchor="middle" fill="#0284c7" fontWeight="600" fontSize="10">{proxyMode === 'forward' ? 'Explicit Proxy Configured' : 'Connects to FQDN / VIP'}</text>
                </g>

                {/* Path 1: Client to Middlebox */}
                <path d="M 226 75 L 344 75" fill="none" stroke={selectedProxy.badgeColor} strokeWidth="3" markerEnd="url(#arrow-proxy)" />
                <path d="M 226 75 L 344 75" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="5, 7" className="flowing-conduit" />
                <text x="285" y="65" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10" fontWeight="600">TCP Handshake 1</text>
                <text x="285" y="94" textAnchor="middle" fill="#64748b" fontSize="9">Client Socket: FD #4</text>

                {/* Middlebox Node */}
                <g transform="translate(350, 30)">
                  <rect width="200" height="120" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke={selectedProxy.badgeColor} strokeWidth="2.5"/>
                  <text x="100" y="26" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="13">{selectedProxy.title.split('(')[0]}</text>
                  <rect x="20" y="36" width="160" height="22" rx="4" fill={`${selectedProxy.badgeColor}22`} stroke={selectedProxy.badgeColor} strokeWidth="1"/>
                  <text x="100" y="51" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="600" fontSize="10">Connection Decoupling</text>
                  <text x="100" y="78" textAnchor="middle" fill="#334155" fontSize="10">Terminates Inbound Socket</text>
                  <text x="100" y="94" textAnchor="middle" fill="#334155" fontSize="10">Initiates Outbound Socket</text>
                  <text x="100" y="110" textAnchor="middle" fill="#64748b" fontSize="9">Pool / Keepalive Reuse</text>
                </g>

                {/* Path 2: Middlebox to Destination */}
                <path d="M 556 75 L 634 75" fill="none" stroke={selectedProxy.badgeColor} strokeWidth="3" markerEnd="url(#arrow-proxy)" />
                <path d="M 556 75 L 634 75" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="5, 7" className="flowing-conduit" />
                <text x="595" y="65" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10" fontWeight="600">TCP Handshake 2</text>
                <text x="595" y="94" textAnchor="middle" fill="#64748b" fontSize="9">Backend Socket: FD #9</text>

                {/* Destination Server Node */}
                <g transform="translate(640, 45)">
                  <rect width="160" height="90" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#10b981" strokeWidth="2"/>
                  <text x="80" y="28" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="13">{proxyMode === 'forward' ? 'Internet Origin' : 'Private Backend Pod'}</text>
                  <text x="80" y="48" textAnchor="middle" fill="#334155" fontSize="10">{proxyMode === 'forward' ? 'e.g. api.stripe.com' : 'Cluster IP: 10.244.1.88'}</text>
                  <rect x="15" y="60" width="130" height="20" rx="4" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" strokeWidth="1"/>
                  <text x="80" y="74" textAnchor="middle" fill="#15803d" fontWeight="600" fontSize="10">Sees Proxy IP as Source</text>
                </g>
              </svg>
            </div>

            {/* Detailed Spec Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
              <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: selectedProxy.badgeColor }}>Engine Details</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: `${selectedProxy.badgeColor}22`, color: 'var(--ifm-color-content)', border: `1px solid ${selectedProxy.badgeColor}` }}>
                    {selectedProxy.badge}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {selectedProxy.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                    <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Client Source IP</div>
                    <div style={{ color: 'var(--ifm-color-content)', fontWeight: 600, marginTop: '2px' }}>{selectedProxy.clientVisibleIp}</div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                    <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Destination Sees IP</div>
                    <div style={{ color: 'var(--ifm-color-content)', fontWeight: 600, marginTop: '2px' }}>{selectedProxy.serverVisibleIp}</div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                    <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>DNS Resolution Site</div>
                    <div style={{ color: 'var(--ifm-color-content)', fontWeight: 600, marginTop: '2px' }}>{selectedProxy.dnsResolvedBy}</div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                    <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>TLS Boundary</div>
                    <div style={{ color: 'var(--ifm-color-content)', fontWeight: 600, marginTop: '2px' }}>{selectedProxy.tlsTerminatedAt}</div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '11px' }}>
                  <span style={{ fontWeight: 600, color: '#0284c7' }}>Crucial Wire Header / Protocol: </span>
                  <code style={{ fontSize: '10px', backgroundColor: 'transparent', color: 'var(--ifm-color-content)' }}>{selectedProxy.keyHeader}</code>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div style={{ backgroundColor: 'var(--ifm-background-color, #f2f4f7)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Wire Protocol &amp; Config Pattern
                </div>
                <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', fontSize: '11px', lineHeight: 1.45, overflowX: 'auto', backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--ifm-color-content)' }}>
                  {selectedProxy.codeSnippet}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NETFILTER & STATEFUL FIREWALL */}
        {activeTab === 'netfilter' && (
          <div>
            {/* Scenario Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Simulate Packet Flow:</span>
              <button
                onClick={() => { setPacketScenario('forward'); setActiveHook('PREROUTING'); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: packetScenario === 'forward' ? '1px solid #34d399' : '1px solid rgba(152, 162, 179, 0.3)',
                  backgroundColor: packetScenario === 'forward' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                  color: 'var(--ifm-color-content)'
                }}
              >
                Forwarded (Router / K8s Node NAT)
              </button>
              <button
                onClick={() => { setPacketScenario('inbound'); setActiveHook('INPUT'); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: packetScenario === 'inbound' ? '1px solid #38bdf8' : '1px solid rgba(152, 162, 179, 0.3)',
                  backgroundColor: packetScenario === 'inbound' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: 'var(--ifm-color-content)'
                }}
              >
                Inbound to Local Socket (NGINX/App)
              </button>
              <button
                onClick={() => { setPacketScenario('outbound'); setActiveHook('OUTPUT'); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: packetScenario === 'outbound' ? '1px solid #fbbf24' : '1px solid rgba(152, 162, 179, 0.3)',
                  backgroundColor: packetScenario === 'outbound' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                  color: 'var(--ifm-color-content)'
                }}
              >
                Outbound from Local Process
              </button>
            </div>

            {/* Netfilter Architecture SVG */}
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '16px' }}>
              <svg viewBox="0 0 860 220" width="100%" height="auto" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="nf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
                  </marker>
                  <marker id="nf-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Wire Entry */}
                <g transform="translate(10, 80)">
                  <rect width="80" height="50" rx="6" fill="var(--ifm-background-color, #ffffff)" stroke="#64748b" strokeWidth="1.5"/>
                  <text x="40" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">NIC (eth0)</text>
                  <text x="40" y="38" textAnchor="middle" fill="#64748b" fontSize="9">DMA Ingress</text>
                </g>

                {/* PREROUTING */}
                <g transform="translate(120, 70)" onClick={() => setActiveHook('PREROUTING')} style={{ cursor: 'pointer' }}>
                  <rect width="120" height="70" rx="8" fill={activeHook === 'PREROUTING' ? 'rgba(56, 189, 248, 0.2)' : 'var(--ifm-background-color, #ffffff)'} stroke={activeHook === 'PREROUTING' ? '#0284c7' : '#98A2B3'} strokeWidth={activeHook === 'PREROUTING' ? 2.5 : 1.5}/>
                  <text x="60" y="25" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">PREROUTING</text>
                  <text x="60" y="42" textAnchor="middle" fill="#334155" fontSize="10">raw, conntrack</text>
                  <text x="60" y="56" textAnchor="middle" fill="#0284c7" fontWeight="600" fontSize="10">DNAT / mangle</text>
                </g>
                <path d="M 90 105 L 118 105" fill="none" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#nf-arrow)" />

                {/* Routing Decision 1 */}
                <g transform="translate(270, 75)">
                  <polygon points="35,0 70,30 35,60 0,30" fill="var(--ifm-background-color, #ffffff)" stroke="#f59e0b" strokeWidth="2"/>
                  <text x="35" y="34" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9" fontWeight="700">Route?</text>
                </g>
                <path d="M 240 105 L 268 105" fill="none" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#nf-arrow)" />

                {/* Branch 1: INPUT -> Local Process */}
                <path d="M 305 75 L 305 35 L 368 35" fill="none" stroke={packetScenario === 'inbound' ? '#38bdf8' : '#cbd5e1'} strokeWidth={packetScenario === 'inbound' ? 3 : 1.5} markerEnd="url(#nf-arrow-blue)" />
                <text x="325" y="28" fill="#38bdf8" fontSize="9" fontWeight="600">Local IP</text>

                <g transform="translate(370, 10)" onClick={() => setActiveHook('INPUT')} style={{ cursor: 'pointer' }}>
                  <rect width="110" height="50" rx="6" fill={activeHook === 'INPUT' ? 'rgba(56, 189, 248, 0.2)' : 'var(--ifm-background-color, #ffffff)'} stroke={activeHook === 'INPUT' ? '#0284c7' : '#98A2B3'} strokeWidth={activeHook === 'INPUT' ? 2.5 : 1.5}/>
                  <text x="55" y="22" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">INPUT Hook</text>
                  <text x="55" y="38" textAnchor="middle" fill="#334155" fontSize="10">filter (Drop unauthorized)</text>
                </g>

                <path d="M 480 35 L 528 35" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#nf-arrow-blue)" />

                <g transform="translate(530, 10)">
                  <rect width="120" height="50" rx="6" fill="var(--ifm-background-color, #ffffff)" stroke="#6366f1" strokeWidth="2"/>
                  <text x="60" y="22" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">Local Process</text>
                  <text x="60" y="38" textAnchor="middle" fill="#4338ca" fontSize="10">Nginx / Java Socket</text>
                </g>

                {/* Branch 2: FORWARD (Middlebox routing) */}
                <path d="M 340 105 L 378 105" fill="none" stroke={packetScenario === 'forward' ? '#10b981' : '#cbd5e1'} strokeWidth={packetScenario === 'forward' ? 3 : 1.5} markerEnd="url(#nf-arrow)" />
                <g transform="translate(380, 80)" onClick={() => setActiveHook('FORWARD')} style={{ cursor: 'pointer' }}>
                  <rect width="120" height="50" rx="8" fill={activeHook === 'FORWARD' ? 'rgba(52, 211, 153, 0.2)' : 'var(--ifm-background-color, #ffffff)'} stroke={activeHook === 'FORWARD' ? '#166534' : '#98A2B3'} strokeWidth={activeHook === 'FORWARD' ? 2.5 : 1.5}/>
                  <text x="60" y="22" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">FORWARD Hook</text>
                  <text x="60" y="38" textAnchor="middle" fill="#166534" fontWeight="600" fontSize="10">filter, mangle (MSS clamp)</text>
                </g>

                {/* Branch 3: Local Process -> OUTPUT */}
                <path d="M 590 60 L 590 155 L 512 155" fill="none" stroke={packetScenario === 'outbound' ? '#f59e0b' : '#cbd5e1'} strokeWidth={packetScenario === 'outbound' ? 3 : 1.5} />
                <g transform="translate(380, 145)" onClick={() => setActiveHook('OUTPUT')} style={{ cursor: 'pointer' }}>
                  <rect width="120" height="50" rx="6" fill={activeHook === 'OUTPUT' ? 'rgba(251, 191, 36, 0.2)' : 'var(--ifm-background-color, #ffffff)'} stroke={activeHook === 'OUTPUT' ? '#d97706' : '#98A2B3'} strokeWidth={activeHook === 'OUTPUT' ? 2.5 : 1.5}/>
                  <text x="60" y="22" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">OUTPUT Hook</text>
                  <text x="60" y="38" textAnchor="middle" fill="#92400e" fontSize="10">raw, conntrack, DNAT</text>
                </g>

                {/* POSTROUTING */}
                <path d="M 500 105 L 548 105" fill="none" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#nf-arrow)" />
                <path d="M 380 170 L 340 170 L 340 120 L 548 120" fill="none" stroke={packetScenario === 'outbound' ? '#f59e0b' : 'transparent'} strokeWidth="2" />
                <g transform="translate(550, 80)" onClick={() => setActiveHook('POSTROUTING')} style={{ cursor: 'pointer' }}>
                  <rect width="140" height="60" rx="8" fill={activeHook === 'POSTROUTING' ? 'rgba(167, 139, 250, 0.2)' : 'var(--ifm-background-color, #ffffff)'} stroke={activeHook === 'POSTROUTING' ? '#6b21a8' : '#98A2B3'} strokeWidth={activeHook === 'POSTROUTING' ? 2.5 : 1.5}/>
                  <text x="70" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">POSTROUTING</text>
                  <text x="70" y="42" textAnchor="middle" fill="#6b21a8" fontWeight="600" fontSize="10">SNAT / MASQUERADE</text>
                </g>

                {/* Wire Egress */}
                <path d="M 690 105 L 738 105" fill="none" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#nf-arrow)" />
                <g transform="translate(740, 80)">
                  <rect width="85" height="50" rx="6" fill="var(--ifm-background-color, #ffffff)" stroke="#64748b" strokeWidth="1.5"/>
                  <text x="42" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">Egress NIC</text>
                  <text x="42" y="38" textAnchor="middle" fill="#64748b" fontSize="9">eth1 / WAN</text>
                </g>
              </svg>
            </div>

            {/* Hook Inspector & Conntrack State Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
              <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>Inspected Hook: {activeHook}</span>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginTop: '6px', lineHeight: 1.5 }}>
                  {activeHook === 'PREROUTING' && 'Triggered before any routing decision is made. Conntrack defragments IP packets here, tracks connection state, and DNAT rules rewrite destination IP (e.g., Kubernetes NodePort translation to Pod ClusterIP).'}
                  {activeHook === 'FORWARD' && 'Triggered for packets passing through the machine (neither originating from nor addressed to local sockets). Stateful inspection evaluates iptables filter table. MTU clamp rules execute here.'}
                  {activeHook === 'INPUT' && 'Triggered after routing confirms the destination IP matches a local network interface. Evaluates host firewall rules (UFW, firewalld, iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT).'}
                  {activeHook === 'OUTPUT' && 'Triggered when a local userspace application calls sendto() / write() on a socket. Translates local socket destination (DNAT) and assigns routing interfaces.'}
                  {activeHook === 'POSTROUTING' && 'Triggered after the packet leaves routing and is about to be placed on the wire. Source NAT (SNAT) and dynamic IP MASQUERADE occur here to mask private subnets with the egress interface IP.'}
                </p>

                <div style={{ marginTop: '10px', fontSize: '11px', color: '#475569' }}>
                  <strong>Key Table Priority Order:</strong> <code style={{ color: 'var(--ifm-color-content)' }}>raw (-300) -&gt; mangle (-150) -&gt; nat (DNAT -100) -&gt; filter (0) -&gt; nat (SNAT 100)</code>
                </div>
              </div>

              {/* Conntrack States & DDoS Gotcha */}
              <div style={{ backgroundColor: 'var(--ifm-background-color, #f2f4f7)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', marginBottom: '8px' }}>
                  Conntrack Engine &amp; SYN Flood Vulnerability
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>Conntrack Table:</strong> Maintains a 5-tuple hash map in kernel memory (<code>src_ip, src_port, dst_ip, dst_port, proto</code>) tracking TCP states: <code>NEW</code>, <code>ESTABLISHED</code>, <code>RELATED</code>, <code>INVALID</code>.
                  </p>
                  <p style={{ margin: '0 0 6px 0', color: '#b91c1c' }}>
                    <strong>DDoS Failure Mode:</strong> Under a SYN Flood, conntrack allocates entries for every spoofed SYN packet. When <code>nf_conntrack_max</code> is reached, the kernel logs:
                  </p>
                  <pre style={{ margin: 0, padding: '6px', borderRadius: '4px', fontSize: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#991b1b' }}>
                    nf_conntrack: table full, dropping packet
                  </pre>
                  <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#475569' }}>
                    <strong>Remediation:</strong> Use <code>iptables -t raw -A PREROUTING -p tcp --dport 80 -j NOTRACK</code> or eBPF XDP to bypass conntrack entirely for high-volume edge traffic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VPN & MSS CLAMPING */}
        {activeTab === 'vpn' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '16px' }}>
              <svg viewBox="0 0 840 210" width="100%" height="auto" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="vpn-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#8b5cf6" />
                  </marker>
                </defs>

                {/* Userspace Application */}
                <g transform="translate(20, 20)">
                  <rect width="180" height="70" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#0ea5e9" strokeWidth="2"/>
                  <text x="90" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">Application (Userspace)</text>
                  <text x="90" y="42" textAnchor="middle" fill="#334155" fontSize="10">Sends 1460 Byte TCP Data</text>
                  <text x="90" y="58" textAnchor="middle" fill="#0284c7" fontSize="9">Target IP: 10.8.0.5</text>
                </g>

                {/* Kernel Socket & Virtual TUN Interface */}
                <path d="M 110 90 L 110 128" fill="none" stroke="#0ea5e9" strokeWidth="2" markerEnd="url(#vpn-arrow)" />
                <g transform="translate(20, 130)">
                  <rect width="180" height="65" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#8b5cf6" strokeWidth="2"/>
                  <text x="90" y="22" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">Virtual TUN (tun0)</text>
                  <text x="90" y="38" textAnchor="middle" fill="#6b21a8" fontSize="10">Layer 3 IP Packet Driver</text>
                  <text x="90" y="54" textAnchor="middle" fill="#475569" fontSize="9">MTU: 1420 bytes</text>
                </g>

                {/* WireGuard / IPsec Encapsulation Process */}
                <path d="M 200 160 L 268 160" fill="none" stroke="#8b5cf6" strokeWidth="2.5" markerEnd="url(#vpn-arrow)" />
                <g transform="translate(270, 110)">
                  <rect width="250" height="85" rx="8" fill="rgba(139, 92, 246, 0.1)" stroke="#8b5cf6" strokeWidth="2"/>
                  <text x="125" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">VPN Encapsulation Engine</text>
                  <text x="125" y="42" textAnchor="middle" fill="#334155" fontSize="10">Encrypts Inner IP Packet (ChaCha20-Poly1305)</text>
                  <text x="125" y="58" textAnchor="middle" fill="#6b21a8" fontSize="10">+ WireGuard Header (32B) + UDP (8B) + IPv4 (20B)</text>
                  <text x="125" y="74" textAnchor="middle" fill="#b91c1c" fontWeight="600" fontSize="10">Total Overhead: 60-80 Bytes!</text>
                </g>

                {/* Physical NIC */}
                <path d="M 520 160 L 588 160" fill="none" stroke="#8b5cf6" strokeWidth="2.5" markerEnd="url(#vpn-arrow)" />
                <g transform="translate(590, 110)">
                  <rect width="220" height="85" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#10b981" strokeWidth="2"/>
                  <text x="110" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">Physical NIC (eth0)</text>
                  <text x="110" y="42" textAnchor="middle" fill="#334155" fontSize="10">Outer Packet MTU: 1500 bytes</text>
                  <text x="110" y="58" textAnchor="middle" fill="#15803d" fontSize="10">Transmits via Public Internet</text>
                  <text x="110" y="74" textAnchor="middle" fill="#475569" fontSize="9">To Gateway: 198.51.100.1:51820</text>
                </g>

                {/* Explanatory Packet Breakdown Box */}
                <g transform="translate(270, 20)">
                  <rect width="540" height="70" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#f59e0b" strokeWidth="1.5"/>
                  <text x="270" y="20" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="11">Wire Packet Anatomy (Outer vs Inner)</text>
                  <g transform="translate(15, 30)">
                    <rect x="0" y="0" width="90" height="26" fill="#fed7aa" stroke="#f97316"/>
                    <text x="45" y="17" textAnchor="middle" fill="#7c2d12" fontSize="9" fontWeight="600">Outer IPv4 (20B)</text>
                    <rect x="90" y="0" width="70" height="26" fill="#fef08a" stroke="#ca8a04"/>
                    <text x="125" y="17" textAnchor="middle" fill="#713f12" fontSize="9" fontWeight="600">UDP (8B)</text>
                    <rect x="160" y="0" width="90" height="26" fill="#ddd6fe" stroke="#7c3aed"/>
                    <text x="205" y="17" textAnchor="middle" fill="#4c1d95" fontSize="9" fontWeight="600">WG Data (32B)</text>
                    <rect x="250" y="0" width="250" height="26" fill="#bbf7d0" stroke="#16a34a"/>
                    <text x="375" y="17" textAnchor="middle" fill="#14532d" fontSize="9" fontWeight="700">Encrypted Inner IP Packet (Payload &lt;= 1420B)</text>
                  </g>
                </g>
              </svg>
            </div>

            {/* Path MTU Blackhole & MSS Clamping Math */}
            <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
              <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#8b5cf6' }}>Path MTU Blackhole &amp; MSS Clamping Math</span>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginTop: '6px', lineHeight: 1.5 }}>
                  When standard clients negotiate TCP connections, they advertise an MSS of <code>1460</code> bytes (1500 MTU - 20 IPv4 - 20 TCP). When this packet enters a VPN tunnel, the added VPN header causes the physical packet to exceed the physical 1500-byte MTU.
                </p>
                <div style={{ padding: '8px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)', fontSize: '11px', marginTop: '8px' }}>
                  <div><strong>Standard MTU:</strong> 1500 Bytes</div>
                  <div><strong>WireGuard Overhead:</strong> 20B IPv4 + 8B UDP + 32B WG = <strong>60 Bytes</strong></div>
                  <div><strong>TUN Interface MTU:</strong> 1500 - 60 = <strong>1420 Bytes</strong></div>
                  <div><strong>Safe Clamped TCP MSS:</strong> 1420 - 40 (IP+TCP) = <strong>1380 Bytes</strong></div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--ifm-background-color, #f2f4f7)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
                  Production iptables / nftables Clamping Fix
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.45, margin: '0 0 8px 0' }}>
                  If firewalls block ICMP Type 3 Code 4 (Fragmentation Needed), Path MTU Discovery (PMTUD) fails silently, causing SSH/HTTPS connections to hang indefinitely on large responses. Apply TCP MSS clamping at the VPN gateway:
                </p>
                <pre style={{ margin: 0, padding: '8px', borderRadius: '4px', fontSize: '10px', backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--ifm-color-content)', overflowX: 'auto' }}>
{`# iptables rule: rewrite TCP SYN MSS to match PMTU
iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN \\
         -j TCPMSS --clamp-mss-to-pmtu

# nftables equivalent:
table ip filter {
    chain forward {
        type filter hook forward priority mangle;
        tcp flags syn tcp option maxseg size set rt mtu
    }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
