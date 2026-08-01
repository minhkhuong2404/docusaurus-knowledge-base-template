import React, { useState } from 'react';

const TOOLS = [
  { name: 'ping', layer: 'L3 Network', color: '#38bdf8', purpose: 'Test IP reachability and round-trip time', cmd: 'ping -c 4 8.8.8.8', output: '64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=12.3ms', detail: 'Sends ICMP Echo Request packets. Uses TTL to avoid infinite loops. Measures RTT. Non-response = host unreachable or ICMP blocked by firewall.' },
  { name: 'traceroute', layer: 'L3 Network', color: '#38bdf8', purpose: 'Trace packet hops to destination', cmd: 'traceroute api.example.com', output: '1. 192.168.1.1 (gateway) 1ms\n2. 10.0.0.1 (ISP) 8ms\n3. * * * (filtered)\n4. 142.250.190.46 45ms', detail: 'Sends packets with TTL=1,2,3… Each router decrements TTL and sends ICMP Time Exceeded back when TTL=0. Maps the path across the internet.' },
  { name: 'dig', layer: 'L5 App (DNS)', color: '#a78bfa', purpose: 'DNS lookup and record inspection', cmd: 'dig +short A api.example.com', output: '142.250.190.46\ndig NS example.com → ns1.example.com', detail: 'Queries DNS resolvers for any record type (A, AAAA, CNAME, MX, TXT, NS, SOA). Use @8.8.8.8 to query specific resolver. +trace for full resolution chain.' },
  { name: 'curl', layer: 'L5 App (HTTP)', color: '#34d399', purpose: 'HTTP request testing with full headers', cmd: 'curl -v -H "Authorization: Bearer tok" https://api.example.com/health', output: '< HTTP/2 200\n< content-type: application/json\n{"status":"ok"}', detail: 'Swiss-army HTTP client. -v shows TLS handshake + request/response headers. --resolve overrides DNS. -k skips TLS verification. --cert for mTLS. --http2 forces HTTP/2.' },
  { name: 'ss', layer: 'L4 Transport', color: '#fbbf24', purpose: 'Socket statistics — open connections and listening ports', cmd: 'ss -tlnp | grep 8080\nss -s  # summary', output: 'LISTEN 0 128 *:8080 *:*\nusers:("java",pid=12345,fd=42)', detail: 'Replacement for netstat. Shows TCP state (LISTEN, ESTABLISHED, TIME_WAIT, CLOSE_WAIT), socket buffers, and owning process. -t=TCP, -u=UDP, -l=listening, -p=process, -n=numeric.' },
  { name: 'tcpdump', layer: 'L2/L3 Capture', color: '#f97316', purpose: 'Capture and inspect live packet traffic', cmd: 'tcpdump -i eth0 -n port 443 -w capture.pcap', output: 'IP 192.168.1.50.54321 > 142.250.190.46.443:\nFlags [S], seq 1000', detail: 'Kernel packet capture using libpcap. Supports BPF filter syntax. -n=no DNS lookup, -i=interface, -w=write pcap, -r=read pcap, -X=hex+ASCII. Load .pcap in Wireshark for GUI analysis.' },
  { name: 'openssl', layer: 'L5/L4 TLS', color: '#f472b6', purpose: 'Test TLS certificates and TLS handshake', cmd: 'openssl s_client -connect api.example.com:443 -showcerts', output: 'depth=2 C=US, O=DigiCert Inc, CN=DigiCert Root\nVerify return code: 0 (ok)', detail: 'Tests TLS configuration: certificate chain, cipher suite negotiation, expiry. s_client opens a raw TLS connection. Use -tls1_3 to force TLSv1.3. Pipe GET after connection to test HTTP.' },
  { name: 'nmap', layer: 'L3/L4 Scan', color: '#f87171', purpose: 'Port scan and service discovery', cmd: 'nmap -sV -p 80,443,8080 192.168.1.0/24', output: 'PORT STATE SERVICE VERSION\n443/tcp open https nginx 1.24\n8080/tcp open http-proxy', detail: 'Network mapper. -sV=version detection, -O=OS detection, -sS=SYN scan (stealth), -sU=UDP scan. Use only on networks you own/have permission to scan. nmap output → Wireshark captures for analysis.' },
];

export default function NetworkTroubleshootingToolsDiagram(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>('ping');

  const filtered = TOOLS.filter(t =>
    t.name.includes(search.toLowerCase()) ||
    t.purpose.toLowerCase().includes(search.toLowerCase()) ||
    t.layer.toLowerCase().includes(search.toLowerCase())
  );
  const selectedTool = TOOLS.find(t => t.name === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .net-tools-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Network Troubleshooting Tools Reference</span>
        <input type="text" placeholder="Search tools…" value={search}
          onChange={e => { setSearch(e.target.value); setSelected(null); }}
          style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)', fontSize: '12.5px', outline: 'none', width: '140px' }} />
      </div>

      <div style={{ padding: '16px' }}>
        <div className="net-tools-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Tool list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {filtered.map(tool => (
              <button key={tool.name} onClick={() => setSelected(tool.name === selected ? null : tool.name)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', background: selected === tool.name ? `${tool.color}15` : 'rgba(255,255,255,0.03)', boxShadow: selected === tool.name ? `0 0 0 1.5px ${tool.color}50` : '0 0 0 1px rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}>
                <code style={{ fontSize: '12px', fontWeight: 700, color: tool.color, background: `${tool.color}15`, borderRadius: '5px', padding: '2px 7px', flexShrink: 0 }}>{tool.name}</code>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>{tool.purpose}</div>
                  <span style={{ fontSize: '9.5px', color: tool.color, marginTop: '2px', display: 'inline-block' }}>{tool.layer}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', padding: '12px', textAlign: 'center' }}>No tools match "{search}"</div>}
          </div>

          {/* Detail panel */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: selectedTool ? 'flex-start' : 'center', minHeight: '240px' }}>
            {selectedTool ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <code style={{ fontSize: '15px', fontWeight: 800, color: selectedTool.color }}>{selectedTool.name}</code>
                  <span style={{ fontSize: '10px', color: selectedTool.color, background: `${selectedTool.color}18`, borderRadius: '4px', padding: '2px 7px' }}>{selectedTool.layer}</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>{selectedTool.detail}</p>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '5px' }}>Example command</div>
                  <pre style={{ margin: 0, background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '8px 10px', fontSize: '10.5px', color: selectedTool.color, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{selectedTool.cmd}</pre>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '5px' }}>Sample output</div>
                  <pre style={{ margin: 0, background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '8px 10px', fontSize: '10px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{selectedTool.output}</pre>
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <div>Select a tool to see its layer, command, and output</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
