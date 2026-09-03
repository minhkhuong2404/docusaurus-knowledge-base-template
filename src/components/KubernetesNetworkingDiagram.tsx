import React, { useState } from 'react';

type NetTab = 'layers' | 'kube_proxy';

export default function KubernetesNetworkingDiagram({ initialTab }: { initialTab?: NetTab }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<NetTab>(initialTab || 'layers');
  const [selectedLayer, setSelectedLayer] = useState<number>(1);

  const NET_LAYERS = [
    {
      name: '1. Container-to-Container',
      scope: 'Same Pod (Loopback)',
      color: '#34d399',
      desc: 'Containers inside the same Pod share the exact same Linux network namespace. They bind to different ports on 127.0.0.1 with zero network latency (kernel socket copy).',
      example: 'Spring Boot app on :8080 communicates with Envoy sidecar on :15001 via localhost.'
    },
    {
      name: '2. Pod-to-Pod (Cross-Node CNI)',
      scope: 'Node-to-Node Overlay',
      color: '#38bdf8',
      desc: 'Every Pod receives a real, unique IP in the cluster CIDR. Pods communicate directly across nodes without NAT via CNI plugins (Calico, Cilium, Flannel) using VXLAN/Geneve encapsulation.',
      example: 'Pod A (10.244.1.5) on Node 1 sends packets directly to Pod B (10.244.2.8) on Node 2.'
    },
    {
      name: '3. Pod-to-Service (ClusterIP)',
      scope: 'Internal Virtual IP (VIP)',
      color: '#fbbf24',
      desc: 'Services provide a stable virtual IP that never changes even when Pods scale or die. kube-proxy programs iptables, IPVS, or eBPF maps to load-balance traffic to healthy backing Pod IPs.',
      example: 'Calling http://order-service (10.96.0.45:80) round-robins packets across 3 backend replica pods.'
    },
    {
      name: '4. External-to-Service (Ingress / LB)',
      scope: 'Outside Traffic Ingress',
      color: '#a78bfa',
      desc: 'Exposes services to public internet users. Cloud Load Balancer (AWS ALB / GCP NLB) or Ingress Controller (Nginx, Envoy) terminates TLS and performs L7 path-based routing.',
      example: 'https://api.company.com/orders routes to the Ingress controller, which proxies to the ClusterIP Service.'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24" />
          <path d="m14.83 9.17 4.24-4.24" />
          <path d="m14.83 14.83 4.24 4.24" />
          <path d="m9.17 14.83-4.24 4.24" />
          <circle cx="12" cy="12" r="4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Kubernetes 4-Layer Networking & CNI Overlay Architecture
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[
            { id: 'layers', label: '🌐 4 Networking Layers', color: '#38bdf8' },
            { id: 'kube_proxy', label: '⚡ kube-proxy Data Path', color: '#34d399' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as NetTab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: 4 NETWORKING LAYERS */}
        {activeTab === 'layers' && (
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 250" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="k8s-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                  <marker id="k8s-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                  <marker id="k8s-arrow-amber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#fbbf24" />
                  </marker>
                </defs>

                {/* Layer 4: Ingress (Top) */}
                <g transform="translate(180, 10)">
                  <rect x="0" y="0" width="460" height="38" rx="6" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                  <text x="230" y="24" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="700">
                    🌍 External Client ➔ Ingress Controller / Cloud LoadBalancer (Port 443)
                  </text>
                </g>

                {/* Arrow Ingress -> Service VIP */}
                <path d="M 410 49 L 410 68" fill="none" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#k8s-arrow-blue)" className="interactive-diagram-flowing-path" />

                {/* Layer 3: Service VIP */}
                <g transform="translate(180, 70)">
                  <rect x="0" y="0" width="460" height="40" rx="6" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="230" y="25" textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="700">
                    ⚡ Service VIP: 10.96.0.45:80 (kube-proxy DNAT Load Balancing)
                  </text>
                </g>

                {/* Arrow Service VIP -> Worker Nodes */}
                <path d="M 300 112 L 200 135" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#k8s-arrow-blue)" className="interactive-diagram-flowing-path" />
                <path d="M 520 112 L 620 135" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#k8s-arrow-blue)" className="interactive-diagram-flowing-path" />

                {/* Layer 2: Worker Node 1 */}
                <g transform="translate(20, 138)">
                  <rect x="0" y="0" width="360" height="98" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="14" y="22" fill="#38bdf8" fontSize="11" fontWeight="700">Worker Node 1 (Host IP: 192.168.1.10)</text>

                  {/* Pod A */}
                  <rect x="12" y="32" width="160" height="54" rx="6" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" />
                  <text x="20" y="50" fill="#34d399" fontSize="10.5" fontWeight="700">Pod A (10.244.1.5)</text>
                  <text x="20" y="66" fill="#94a3b8" fontSize="8.5">veth0 ➔ br0 bridge</text>
                  <text x="20" y="78" fill="#86efac" fontSize="8">App Container (:8080)</text>

                  {/* Pod B (Sidecar local loop) */}
                  <rect x="185" y="32" width="160" height="54" rx="6" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" />
                  <text x="195" y="50" fill="#38bdf8" fontSize="10.5" fontWeight="700">Pod B (Sidecar Pod)</text>
                  <text x="195" y="66" fill="#cbd5e1" fontSize="8.5">127.0.0.1 localhost</text>
                  <text x="195" y="78" fill="#64748b" fontSize="8">Shared Net Namespace</text>
                </g>

                {/* Cross-Node CNI Tunnel */}
                <path d="M 382 185 L 435 185" fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray="3 3" markerEnd="url(#k8s-arrow-green)" className="interactive-diagram-flowing-path" />
                <text x="385" y="175" fill="#34d399" fontSize="8.5" fontWeight="700">VXLAN Tunnel</text>

                {/* Layer 2: Worker Node 2 */}
                <g transform="translate(440, 138)">
                  <rect x="0" y="0" width="360" height="98" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="14" y="22" fill="#38bdf8" fontSize="11" fontWeight="700">Worker Node 2 (Host IP: 192.168.1.11)</text>

                  {/* Pod C */}
                  <rect x="12" y="32" width="160" height="54" rx="6" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" />
                  <text x="20" y="50" fill="#34d399" fontSize="10.5" fontWeight="700">Pod C (10.244.2.8)</text>
                  <text x="20" y="66" fill="#94a3b8" fontSize="8.5">veth1 ➔ br0 bridge</text>
                  <text x="20" y="78" fill="#86efac" fontSize="8">Order Service Target</text>

                  {/* Pod D */}
                  <rect x="185" y="32" width="160" height="54" rx="6" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" />
                  <text x="195" y="50" fill="#fbbf24" fontSize="10.5" fontWeight="700">Pod D (10.244.2.9)</text>
                  <text x="195" y="66" fill="#cbd5e1" fontSize="8.5">Healthy Replica</text>
                  <text x="195" y="78" fill="#64748b" fontSize="8">No NAT Traversal</text>
                </g>
              </svg>
            </div>

            {/* Layer Selection Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {NET_LAYERS.map((layer, idx) => (
                <div
                  key={layer.name}
                  onClick={() => setSelectedLayer(idx)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedLayer === idx ? layer.color : 'rgba(255,255,255,0.08)'}`,
                    background: selectedLayer === idx ? `${layer.color}15` : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: selectedLayer === idx ? layer.color : 'var(--ifm-color-content)' }}>
                      {layer.name}
                    </span>
                    <span style={{ fontSize: '10px', color: layer.color, fontWeight: 700 }}>{layer.scope}</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                    {layer.desc}
                  </p>
                  <div style={{ fontSize: '10px', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '4px 6px', borderRadius: '4px' }}>
                    💡 <em>{layer.example}</em>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: KUBE-PROXY DATA PATH */}
        {activeTab === 'kube_proxy' && (
          <div>
            <div style={{ marginBottom: '14px', padding: '12px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              <strong>kube-proxy Data Path Evolution:</strong> kube-proxy does not proxy packets itself in modern clusters. Instead, it acts as a controller that syncs Service VIP rules into the Linux kernel using one of three implementations:
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#38bdf8' }}>Mode</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#34d399' }}>Kernel Mechanism</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#fbbf24' }}>Scaling Bottleneck</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#a78bfa' }}>Throughput / Latency</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#94a3b8' }}>userspace (Legacy)</td>
                    <td style={{ padding: '8px 12px' }}>Kernel ➔ User ➔ Kernel roundtrip</td>
                    <td style={{ padding: '8px 12px', color: '#f87171' }}>Context switches kill CPU at 100+ services</td>
                    <td style={{ padding: '8px 12px', color: '#f87171' }}>Slow (10,000 req/s)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#fbbf24' }}>iptables (Default)</td>
                    <td style={{ padding: '8px 12px' }}>Sequential Netfilter packet rules</td>
                    <td style={{ padding: '8px 12px', color: '#fbbf24' }}>O(N) rule evaluation; rule sync latency at 5,000+ services</td>
                    <td style={{ padding: '8px 12px' }}>Good (50,000 req/s)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#38bdf8' }}>IPVS (High Scale)</td>
                    <td style={{ padding: '8px 12px' }}>In-kernel IP Virtual Server Hash Tables</td>
                    <td style={{ padding: '8px 12px', color: '#34d399' }}>O(1) hash lookup; scales cleanly to 50,000+ services</td>
                    <td style={{ padding: '8px 12px', color: '#34d399' }}>High (150,000 req/s)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#34d399' }}>Cilium eBPF (Modern)</td>
                    <td style={{ padding: '8px 12px' }}>Bypasses iptables & conntrack entirely via eBPF</td>
                    <td style={{ padding: '8px 12px', color: '#34d399' }}>Zero iptables overhead; socket-level proxying</td>
                    <td style={{ padding: '8px 12px', color: '#34d399' }}>Maximum (300,000+ req/s)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
