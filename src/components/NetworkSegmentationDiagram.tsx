import React, { useState } from 'react';

const NODES = [
  { id: 'internet', label: 'Internet', subtitle: 'Untrusted zone', x: 30, y: 160, w: 110, h: 50, color: '#f87171',
    detail: { title: 'Internet (Untrusted Zone)', body: 'The public internet — all traffic from here is considered hostile by default. No authentication, no trust. Zero Trust architecture treats even internal traffic with the same skepticism.', tags: ['BGP routing', 'DDoS origin', 'DDOS mitigation at edge'] } },
  { id: 'fw1', label: 'Perimeter\nFirewall', subtitle: 'L3/L4 stateful', x: 200, y: 150, w: 110, h: 70, color: '#f97316',
    detail: { title: 'Perimeter Firewall (L3/L4)', body: 'Stateful packet inspection — tracks TCP connection state. Rules: allow TCP 443 from ANY to DMZ. Drop all others. IP allowlisting for VPN access. iptables / nftables / AWS Security Groups / GCP Firewall Rules.', tags: ['Stateful inspection', 'ip6tables', 'AWS Security Groups', 'Allow 443, Drop ALL'] } },
  { id: 'dmz', label: 'DMZ', subtitle: 'Demilitarized Zone', x: 375, y: 100, w: 200, h: 170, color: '#fbbf24',
    detail: { title: 'DMZ — Demilitarized Zone', body: 'Semi-trusted buffer zone between internet and internal network. Hosts publicly accessible services. If a DMZ host is compromised, the second firewall prevents lateral movement into the internal network.', tags: ['Public-facing services only', 'Second firewall behind', 'No direct DB access'] } },
  { id: 'waf', label: 'WAF / Load\nBalancer', subtitle: 'L7 aware', x: 390, y: 120, w: 165, h: 60, color: '#fbbf24',
    detail: { title: 'WAF + Layer 7 Load Balancer', body: 'Web Application Firewall blocks OWASP Top 10 attacks (SQLi, XSS, SSRF, Path Traversal). Load balancer distributes traffic across app servers using Round Robin, Least Connections, or IP-Hash. Handles TLS termination (decrypts HTTPS).', tags: ['OWASP Top 10 blocking', 'TLS termination', 'Round Robin / LC', 'AWS ALB + WAFv2'] } },
  { id: 'fw2', label: 'Internal\nFirewall', subtitle: 'L4 stateful', x: 620, y: 150, w: 110, h: 70, color: '#f97316',
    detail: { title: 'Internal Firewall (Second Layer)', body: 'Second firewall prevents lateral movement. Only allows traffic from DMZ servers to specific internal ports. Blocks DMZ → DB direct access. Enforces micro-segmentation between app tiers.', tags: ['Allow DMZ → App:8080 only', 'Block DMZ → DB:5432', 'Micro-segmentation'] } },
  { id: 'app', label: 'App Zone', subtitle: 'Java services', x: 785, y: 120, w: 170, h: 65, color: '#34d399',
    detail: { title: 'Application Zone (Internal)', body: 'Trusted internal network for app servers. No public internet access (outbound goes through NAT gateway or explicit proxy). Services communicate via service mesh (Istio/Envoy) with mTLS for in-cluster encryption. No hardcoded secrets — use Vault or AWS Secrets Manager.', tags: ['mTLS service-to-service', 'No public egress', 'Istio/Envoy sidecar', 'AWS Secrets Manager'] } },
  { id: 'db', label: 'DB Zone', subtitle: 'Isolated data tier', x: 785, y: 215, w: 170, h: 60, color: '#a78bfa',
    detail: { title: 'Database Zone (Isolated)', body: 'Most restricted zone. Only app servers on specific ports allowed in. No internet access in or out. Encryption at rest (AWS RDS encryption, PostgreSQL TDE). Audit logging enabled. Separate VPC/subnet with no IGW.', tags: ['Port 5432 from App only', 'Encryption at rest (AES-256)', 'VPC isolated subnet', 'Audit logs enabled'] } },
];

export default function NetworkSegmentationDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = NODES.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .netseg-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Network Segmentation &amp; Security Zones</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Click any zone to inspect</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="netseg-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 985 290" style={{ width: '100%', height: 'auto' }}>
              <defs>
                {['#f87171', '#f97316', '#fbbf24', '#34d399', '#a78bfa'].map(c => (
                  <marker key={c} id={`ns-arr-${c.slice(1)}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill={c} />
                  </marker>
                ))}
              </defs>

              {/* Zone backgrounds */}
              <rect x="370" y="88" width="218" height="186" rx="10" fill="rgba(251,191,36,0.06)" stroke="rgba(251,191,36,0.2)" strokeWidth="1.5" strokeDasharray="5 3" />
              <text x="479" y="282" textAnchor="middle" fill="rgba(251,191,36,0.5)" fontSize="9">DMZ</text>
              <rect x="780" y="108" width="185" height="178" rx="10" fill="rgba(52,211,153,0.04)" stroke="rgba(52,211,153,0.2)" strokeWidth="1.5" strokeDasharray="5 3" />
              <text x="870" y="293" textAnchor="middle" fill="rgba(52,211,153,0.5)" fontSize="9">Internal</text>

              {/* Arrows */}
              <line x1="145" y1="185" x2="196" y2="185" stroke="#f87171" strokeWidth="2" markerEnd="url(#ns-arr-f87171)" opacity="0.7" />
              <line x1="314" y1="185" x2="372" y2="175" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#ns-arr-fbbf24)" opacity="0.7" />
              <line x1="591" y1="175" x2="617" y2="185" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#ns-arr-fbbf24)" opacity="0.7" />
              <line x1="733" y1="185" x2="781" y2="152" stroke="#34d399" strokeWidth="2" markerEnd="url(#ns-arr-34d399)" opacity="0.7" />
              <line x1="733" y1="195" x2="781" y2="240" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#ns-arr-a78bfa)" opacity="0.7" />
              <line x1="872" y1="185" x2="872" y2="215" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#ns-arr-a78bfa)" opacity="0.5" strokeDasharray="4 2" />
              <text x="165" y="178" fill="#f87171" fontSize="8.5">HTTPS:443</text>
              <text x="630" y="178" fill="#34d399" fontSize="8.5">App:8080</text>

              {/* Nodes */}
              {NODES.map(n => {
                const isActive = selected === n.id;
                return (
                  <g key={n.id} onClick={() => setSelected(selected === n.id ? null : n.id)} style={{ cursor: 'pointer' }}>
                    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="8"
                      fill={isActive ? `${n.color}25` : `${n.color}10`}
                      stroke={n.color} strokeWidth={isActive ? 2 : 1.5}
                      opacity={selected && !isActive ? 0.3 : 1}
                      style={{ transition: 'all 0.25s ease' }} />
                    {n.label.split('\n').map((line, li) => (
                      <text key={li} x={n.x + n.w / 2} y={n.y + 20 + li * 15} textAnchor="middle" fill={n.color} fontSize="11" fontWeight="700" opacity={selected && !isActive ? 0.3 : 1}>{line}</text>
                    ))}
                    <text x={n.x + n.w / 2} y={n.y + n.h - 7} textAnchor="middle" fill={n.color} fontSize="8.5" opacity={selected && !isActive ? 0.25 : 0.65}>{n.subtitle}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className={`interactive-diagram-details-card ${selNode ? 'details-yellow' : 'details-gray'}`}
            style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: selNode ? 'flex-start' : 'center', transition: 'all 0.25s ease' }}>
            {selNode ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: selNode.color, marginBottom: '10px' }}>{selNode.detail.title}</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>{selNode.detail.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selNode.detail.tags.map(t => (
                    <code key={t} style={{ fontSize: '10.5px', background: `${selNode.color}18`, color: selNode.color, border: `1px solid ${selNode.color}40`, borderRadius: '5px', padding: '2px 7px' }}>{t}</code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>Click any security zone to see its rules and purpose</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
