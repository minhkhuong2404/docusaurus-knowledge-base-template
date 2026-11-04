import React, { useState } from 'react';

type DiagramTab = 'calico_node' | 'bgp_topology' | 'reddit_outage';

export default function KubernetesCalicoBgpDiagram({ initialTab }: { initialTab?: DiagramTab }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DiagramTab>(initialTab || 'calico_node');
  const [selectedComp, setSelectedComp] = useState<string>('felix');
  const [topologyMode, setTopologyMode] = useState<'full_mesh' | 'route_reflector'>('route_reflector');
  const [outageStep, setOutageStep] = useState<number>(1);

  // Tab 1: Calico Node Component Details
  const CALICO_COMPONENTS: Record<string, { title: string; role: string; color: string; mechanics: string; configExample: string }> = {
    felix: {
      title: 'Felix (The Kernel Programmer)',
      role: 'Host Linux Kernel FIB & Firewall Sync Agent',
      color: '#38bdf8',
      mechanics: 'Runs as a daemon inside calico-node. Watches the Kubernetes API/datastore for workload endpoints and NetworkPolicies. Directly programs the Linux kernel FIB (ip route add <pod-ip> dev caliXXX) and configures iptables chains or eBPF maps for microsegmentation.',
      configExample: 'ip route add 10.244.1.15 dev cali4f981e scope link'
    },
    bird: {
      title: 'BIRD (The BGP Routing Engine)',
      role: 'Dynamic Border Gateway Protocol Daemon',
      color: '#34d399',
      mechanics: 'Userspace BGP daemon (Internet Routing Daemon). Listens on TCP port 179. Takes Pod CIDR blocks assigned to this node and advertises them via BGP routes to peer nodes or Route Reflectors. Listens for routes from peers and hands them to the kernel FIB.',
      configExample: 'calicoctl node status -> Peer 192.168.1.1: Established, routes: 10.244.0.0/16'
    },
    cni_plugin: {
      title: 'Calico CNI Plugin',
      role: 'Pod Sandbox Network Plumber (invoked by Kubelet)',
      color: '#fbbf24',
      mechanics: 'Binary executed by Kubelet via Container Runtime Interface (CRI) on Pod creation. Creates a veth pair (one end in Pod netns as eth0, other in host root netns as caliXXX). Invokes calico-ipam to assign an IP from the node CIDR block.',
      configExample: 'cat /etc/cni/net.d/10-calico.conflist -> type: calico, ipam: calico-ipam'
    },
    kernel_fib: {
      title: 'Linux Kernel FIB (Routing Table)',
      role: 'L3 Forwarding Information Base (OS Data Plane)',
      color: '#a78bfa',
      mechanics: 'The Linux kernel routing table. When a packet for 10.244.2.14 enters from a local container, the kernel matches the route programmed by BIRD/Felix: via 192.168.1.20 dev eth0. The host transmits raw L3 IP packets directly over the physical wire with zero overlay tunnel headers.',
      configExample: 'ip route show -> 10.244.2.0/26 via 192.168.1.20 dev eth0 proto bird'
    }
  };

  // Tab 3: Reddit Outage Steps
  const OUTAGE_STEPS = [
    {
      step: 1,
      title: 'Step 1: Steady State (K8s v1.23)',
      status: 'HEALTHY',
      statusColor: '#34d399',
      desc: 'Reddit operates a 1,000+ node "pet" cluster built with kubeadm. Control plane nodes hold the legacy node-role.kubernetes.io/master label. BGP Route Reflectors running on control plane nodes maintain healthy BGP peering sessions with all 1,000 worker nodes. Cross-node routing and CoreDNS resolution work perfectly.'
    },
    {
      step: 2,
      title: 'Step 2: The v1.24 Upgrade Trigger',
      status: 'BREAKING CHANGE',
      statusColor: '#fbbf24',
      desc: 'Engineers initiate an in-place upgrade to Kubernetes v1.24. In v1.24, Kubernetes officially strips the legacy node-role.kubernetes.io/master label (deprecated since v1.20) from control plane nodes, replacing it exclusively with node-role.kubernetes.io/control-plane.'
    },
    {
      step: 3,
      title: 'Step 3: PeerSelector Zero-Match Failure',
      status: 'CRITICAL FAILURE',
      statusColor: '#f87171',
      desc: 'Calico was configured with a BGPPeer custom resource targeting peerSelector: node-role.kubernetes.io/master == "". When the master label was stripped, peerSelector matched exactly ZERO nodes! Calico daemon immediately interpreted this as all Route Reflectors being decommissioned.'
    },
    {
      step: 4,
      title: 'Step 4: Cluster-wide Route Drop & CoreDNS Blackhole',
      status: 'PLATFORM OUTAGE',
      statusColor: '#ef4444',
      desc: 'All 1,000 worker nodes tore down BGP sessions with the Route Reflectors. BIRD flushed remote Pod CIDRs from the Linux kernel routing tables. Pods could no longer route packets across nodes. CoreDNS pods became unreachable. All microservice RPCs failed. Reddit went dark for 314 minutes.'
    },
    {
      step: 5,
      title: 'Step 5: The Fix & Staged 1% -> 100% Traffic Ramp-Up',
      status: 'RECOVERED',
      statusColor: '#2dd4bf',
      desc: 'The BGPPeer selector was updated to match control-plane. BGP sessions re-established and routes repopulated. Crucially, traffic was NOT restored at 100% immediately to prevent a thundering herd / cold cache stampede. SREs ramped traffic incrementally: 1%, 5%, 10%, 20%, 35%, 55%, 80%, to 100%.'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .calico-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
          <path d="M12 10v4" />
          <path d="m10 12 2 2 2-2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Calico BGP Routing & The Reddit Pi Day Outage Telemetry
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[
            { id: 'calico_node', label: '🛠️ Calico Node Anatomy', color: '#38bdf8' },
            { id: 'bgp_topology', label: '🌐 BGP Mesh vs Route Reflectors', color: '#34d399' },
            { id: 'reddit_outage', label: '💥 Reddit Outage Postmortem', color: '#f87171' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as DiagramTab)}
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
        {/* TAB 1: CALICO NODE ARCHITECTURE */}
        {activeTab === 'calico_node' && (
          <div>
            <div style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '12px' }}>
              Click any internal component below to inspect its under-the-hood engine mechanics, system calls, and configuration files.
            </div>

            <div className="calico-split-grid" style={{ display: 'grid', gridTemplateColumns: '56% 44%', gap: '16px', alignItems: 'start' }}>
              {/* Left Canvas: Node Structure */}
              <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '8px', padding: '12px', background: '#0d0f1e' }}>
                <svg viewBox="0 0 460 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <defs>
                    <marker id="calico-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" />
                    </marker>
                    <marker id="calico-arrow-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" />
                    </marker>
                  </defs>

                  {/* Worker Node Host Boundary */}
                  <rect x="10" y="10" width="440" height="280" rx="8" fill="rgba(15, 23, 42, 0.7)" stroke="#334155" strokeWidth="1.5" />
                  <text x="24" y="32" fill="#94a3b8" fontSize="11" fontWeight="700">WORKER NODE 1 (192.168.1.10)</text>

                  {/* Pod Namespace Box */}
                  <rect x="25" y="45" width="180" height="70" rx="6" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="35" y="65" fill="#34d399" fontSize="11" fontWeight="700">Pod Netns (10.244.1.5)</text>
                  <rect x="35" y="75" width="70" height="24" rx="4" fill="#047857" />
                  <text x="50" y="91" fill="#ffffff" fontSize="10" fontWeight="600">eth0</text>
                  <text x="115" y="91" fill="#94a3b8" fontSize="9">App Container</text>

                  {/* Veth Connection */}
                  <path d="M 105 87 C 150 87, 160 130, 110 138" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="3 3" />
                  <text x="145" y="112" fill="#34d399" fontSize="8">veth pair</text>

                  {/* Host Root Namespace caliXXX */}
                  <rect x="35" y="128" width="75" height="24" rx="4" fill="#1e293b" stroke="#34d399" />
                  <text x="44" y="144" fill="#86efac" fontSize="9.5" fontWeight="600">cali9b4c</text>

                  {/* Calico-node DaemonSet Box */}
                  <rect x="235" y="45" width="200" height="150" rx="6" fill="rgba(30, 41, 59, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="245" y="65" fill="#38bdf8" fontSize="11" fontWeight="700">calico-node DaemonSet</text>

                  {/* Clickable Felix Button */}
                  <g onClick={() => setSelectedComp('felix')} style={{ cursor: 'pointer' }}>
                    <rect x="245" y="78" width="180" height="32" rx="4" fill={selectedComp === 'felix' ? 'rgba(56, 189, 248, 0.3)' : '#0f172a'} stroke="#38bdf8" strokeWidth={selectedComp === 'felix' ? 2 : 1} />
                    <text x="255" y="98" fill="#e0f2fe" fontSize="10" fontWeight="700">⚙️ Felix (Kernel Programmer)</text>
                  </g>

                  {/* Clickable BIRD Button */}
                  <g onClick={() => setSelectedComp('bird')} style={{ cursor: 'pointer' }}>
                    <rect x="245" y="118" width="180" height="32" rx="4" fill={selectedComp === 'bird' ? 'rgba(52, 211, 153, 0.3)' : '#0f172a'} stroke="#34d399" strokeWidth={selectedComp === 'bird' ? 2 : 1} />
                    <text x="255" y="138" fill="#bbf7d0" fontSize="10" fontWeight="700">📡 BIRD (BGP Engine - Port 179)</text>
                  </g>

                  {/* Clickable CNI Plugin */}
                  <g onClick={() => setSelectedComp('cni_plugin')} style={{ cursor: 'pointer' }}>
                    <rect x="245" y="156" width="180" height="28" rx="4" fill={selectedComp === 'cni_plugin' ? 'rgba(251, 191, 36, 0.3)' : '#0f172a'} stroke="#fbbf24" strokeWidth={selectedComp === 'cni_plugin' ? 2 : 1} />
                    <text x="255" y="174" fill="#fef08a" fontSize="10" fontWeight="700">🔌 Calico CNI Plugin (Kubelet CRI)</text>
                  </g>

                  {/* Clickable Kernel FIB */}
                  <g onClick={() => setSelectedComp('kernel_fib')} style={{ cursor: 'pointer' }}>
                    <rect x="25" y="210" width="410" height="42" rx="6" fill={selectedComp === 'kernel_fib' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(15, 23, 42, 0.95)'} stroke="#a78bfa" strokeWidth={selectedComp === 'kernel_fib' ? 2 : 1.2} />
                    <text x="35" y="230" fill="#e9d5ff" fontSize="10.5" fontWeight="700">🧠 Linux Kernel FIB & Netfilter (Routing Table & iptables/eBPF)</text>
                    <text x="35" y="244" fill="#94a3b8" fontSize="8.5">10.244.2.0/26 via 192.168.1.20 dev eth0 (Direct L3 Routing - No Encap)</text>
                  </g>

                  {/* Physical eth0 */}
                  <rect x="180" y="260" width="100" height="22" rx="4" fill="#1e293b" stroke="#64748b" />
                  <text x="210" y="275" fill="#e2e8f0" fontSize="10" fontWeight="700">eth0</text>
                </svg>
              </div>

              {/* Right Panel: Detail Inspection */}
              <div style={{ background: '#0c0e17', border: `1px solid ${CALICO_COMPONENTS[selectedComp].color}`, borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: CALICO_COMPONENTS[selectedComp].color }} />
                  <span style={{ color: CALICO_COMPONENTS[selectedComp].color, fontWeight: 700, fontSize: '14px' }}>
                    {CALICO_COMPONENTS[selectedComp].title}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
                  {CALICO_COMPONENTS[selectedComp].role}
                </div>

                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '12px' }}>
                  {CALICO_COMPONENTS[selectedComp].mechanics}
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  SYSTEM & CONFIG TELEMETRY:
                </div>
                <pre style={{ margin: 0, padding: '8px', borderRadius: '4px', background: '#090b14', color: '#38bdf8', fontSize: '10px', overflowX: 'auto', border: '1px solid #1e293b' }}>
                  {CALICO_COMPONENTS[selectedComp].configExample}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BGP MESH VS ROUTE REFLECTOR */}
        {activeTab === 'bgp_topology' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setTopologyMode('full_mesh')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${topologyMode === 'full_mesh' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                  background: topologyMode === 'full_mesh' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(255,255,255,0.04)',
                  color: topologyMode === 'full_mesh' ? '#f87171' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ⚠️ Full-Mesh BGP (O(N²) Explosion)
              </button>
              <button
                onClick={() => setTopologyMode('route_reflector')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${topologyMode === 'route_reflector' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                  background: topologyMode === 'route_reflector' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.04)',
                  color: topologyMode === 'route_reflector' ? '#34d399' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✅ Route Reflectors (O(N) Hub-and-Spoke Scale)
              </button>
            </div>

            <div className="calico-split-grid" style={{ display: 'grid', gridTemplateColumns: '52% 48%', gap: '16px', alignItems: 'start' }}>
              <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '8px', padding: '12px', background: '#0d0f1e' }}>
                <svg viewBox="0 0 440 260" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  {topologyMode === 'full_mesh' ? (
                    <g>
                      <text x="220" y="24" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">
                        Full-Mesh BGP Peering: Every Node Peers With Every Node
                      </text>

                      {/* 5 Nodes in a ring, fully interconnected */}
                      <circle cx="220" cy="55" r="18" fill="#1e293b" stroke="#f87171" strokeWidth="2" />
                      <text x="220" y="59" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">Node 1</text>

                      <circle cx="340" cy="115" r="18" fill="#1e293b" stroke="#f87171" strokeWidth="2" />
                      <text x="340" y="119" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">Node 2</text>

                      <circle cx="300" cy="210" r="18" fill="#1e293b" stroke="#f87171" strokeWidth="2" />
                      <text x="300" y="214" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">Node 3</text>

                      <circle cx="140" cy="210" r="18" fill="#1e293b" stroke="#f87171" strokeWidth="2" />
                      <text x="140" y="214" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">Node 4</text>

                      <circle cx="100" cy="115" r="18" fill="#1e293b" stroke="#f87171" strokeWidth="2" />
                      <text x="100" y="119" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">Node 5</text>

                      {/* Fully connected lines */}
                      <line x1="220" y1="55" x2="340" y2="115" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="220" y1="55" x2="300" y2="210" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="220" y1="55" x2="140" y2="210" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="220" y1="55" x2="100" y2="115" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />

                      <line x1="340" y1="115" x2="300" y2="210" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="340" y1="115" x2="140" y2="210" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="340" y1="115" x2="100" y2="115" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />

                      <line x1="300" y1="210" x2="140" y2="210" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="300" y1="210" x2="100" y2="115" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />

                      <line x1="140" y1="210" x2="100" y2="115" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />

                      <rect x="130" y="235" width="180" height="20" rx="4" fill="rgba(248, 113, 113, 0.2)" stroke="#f87171" />
                      <text x="220" y="249" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="700">
                        N = 1000 ➔ 499,500 BGP Sessions!
                      </text>
                    </g>
                  ) : (
                    <g>
                      <text x="220" y="24" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">
                        Route Reflector (RR) Hub-and-Spoke Topology
                      </text>

                      {/* Central Route Reflectors */}
                      <rect x="150" y="50" width="140" height="42" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
                      <text x="220" y="68" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="700">Route Reflectors (RR)</text>
                      <text x="220" y="82" textAnchor="middle" fill="#6ee7b7" fontSize="8">Hosted on Control-Plane Nodes</text>

                      {/* Worker nodes at bottom */}
                      {[-140, -70, 0, 70, 140].map((offset, i) => (
                        <g key={i}>
                          <circle cx={220 + offset} cy="180" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                          <text x={220 + offset} y="184" textAnchor="middle" fill="#e0f2fe" fontSize="8" fontWeight="600">
                            W{i + 1}
                          </text>
                          {/* Directed BGP line to RR */}
                          <line x1={220 + offset} y1="164" x2="220" y2="92" stroke="#34d399" strokeWidth="1.5" className="interactive-diagram-flowing-path" />
                        </g>
                      ))}

                      <rect x="120" y="232" width="200" height="22" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                      <text x="220" y="247" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontWeight="700">
                        N = 1000, 3 RRs ➔ Only 3,000 BGP Sessions (99.4% drop!)
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Right Panel: Mathematical Analysis */}
              <div style={{ background: '#0c0e17', border: '1px solid #334155', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: topologyMode === 'full_mesh' ? '#f87171' : '#34d399', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px' }}>
                  {topologyMode === 'full_mesh' ? 'The O(N²) BGP Connection Meltdown' : 'Why Route Reflectors Save Large Clusters'}
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '12px' }}>
                  {topologyMode === 'full_mesh' ? (
                    <>
                      In default Calico configurations (<code>nodeToNodeMeshEnabled: true</code>), every node initiates a direct BGP peering session over TCP port 179 to every other node in the cluster.
                      <br /><br />
                      The total number of BGP TCP peering sessions is governed by:
                      <div style={{ padding: '6px 10px', background: '#090b14', borderRadius: '4px', margin: '8px 0', border: '1px solid #dc2626', color: '#fca5a5', fontFamily: 'monospace' }}>
                        Sessions = N × (N - 1) / 2
                      </div>
                      For a 100-node cluster: 4,950 sessions.<br />
                      For Reddit&apos;s 1,000-node cluster: <strong>499,500 persistent TCP connections!</strong>
                      <br /><br />
                      Every node must process keepalives and route advertisements from 999 peers. A single node flapping triggers a catastrophic flood of 999 BGP WITHDRAW/UPDATE messages across the entire network fabric.
                    </>
                  ) : (
                    <>
                      To bypass the $O(N^2)$ barrier, Calico supports <strong>BGP Route Reflectors (RFC 4456)</strong>.
                      <br /><br />
                      Instead of peering with all 999 peers, worker nodes act as <em>Route Reflector Clients</em> and peer ONLY with a designated quorum of 2–3 Route Reflectors:
                      <div style={{ padding: '6px 10px', background: '#090b14', borderRadius: '4px', margin: '8px 0', border: '1px solid #059669', color: '#86efac', fontFamily: 'monospace' }}>
                        Sessions = k × N (where k = 2 or 3 Route Reflectors)
                      </div>
                      For a 1,000-node cluster with 3 RRs: <strong>3,000 total sessions</strong> vs 499,500.
                      <br /><br />
                      <strong style={{ color: '#fbbf24' }}>Production Vulnerability at Reddit:</strong> Reddit co-located their Calico Route Reflectors directly onto their Kubernetes Control-Plane nodes!
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REDDIT OUTAGE STEP-BY-STEP SIMULATOR */}
        {activeTab === 'reddit_outage' && (
          <div>
            {/* Step Selector Buttons */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {OUTAGE_STEPS.map(s => (
                <button
                  key={s.step}
                  onClick={() => setOutageStep(s.step)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${outageStep === s.step ? s.statusColor : 'rgba(255,255,255,0.1)'}`,
                    background: outageStep === s.step ? `${s.statusColor}25` : 'rgba(255,255,255,0.04)',
                    color: outageStep === s.step ? s.statusColor : '#94a3b8',
                    fontWeight: outageStep === s.step ? 700 : 500,
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  Step {s.step}
                </button>
              ))}
            </div>

            {/* Current Step Banner */}
            <div style={{ background: '#0c0e17', border: `1px solid ${OUTAGE_STEPS[outageStep - 1].statusColor}`, borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: OUTAGE_STEPS[outageStep - 1].statusColor, fontWeight: 700, fontSize: '15px' }}>
                  {OUTAGE_STEPS[outageStep - 1].title}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', background: `${OUTAGE_STEPS[outageStep - 1].statusColor}20`, border: `1px solid ${OUTAGE_STEPS[outageStep - 1].statusColor}`, color: OUTAGE_STEPS[outageStep - 1].statusColor, fontSize: '10px', fontWeight: 700 }}>
                  {OUTAGE_STEPS[outageStep - 1].status}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.6 }}>
                {OUTAGE_STEPS[outageStep - 1].desc}
              </p>
            </div>

            {/* Visual Outage Diagnostic Matrix */}
            <div className="calico-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px' }}>
              {/* Box 1: The Fatal YAML Config */}
              <div style={{ background: '#090b14', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                  CALICO BGPPEER MANIFEST (THE TIME BOMB):
                </div>
                <pre style={{ margin: 0, padding: '8px', background: '#05070e', borderRadius: '4px', fontSize: '10.5px', color: '#e2e8f0', border: '1px solid #1e293b' }}>
{`apiVersion: projectcalico.org/v3
kind: BGPPeer
metadata:
  name: peer-with-route-reflectors
spec:
  nodeSelectors: all()
  # Fatal line: Kubernetes 1.24 removed this label!
  peerSelector: node-role.kubernetes.io/master == ''`}
                </pre>
                <div style={{ marginTop: '8px', fontSize: '10.5px', color: outageStep >= 3 ? '#f87171' : '#94a3b8' }}>
                  {outageStep >= 3
                    ? '❌ In K8s 1.24, peerSelector matches 0 nodes! All BGP peering collapses.'
                    : '✅ In K8s 1.23, peerSelector matches 3 master nodes.'}
                </div>
              </div>

              {/* Box 2: Cluster Traffic & Health Telemetry */}
              <div style={{ background: '#090b14', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                  SYSTEM HEALTH TELEMETRY:
                </div>
                <table style={{ width: '100%', fontSize: '11px', color: '#cbd5e1', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '4px 0', color: '#94a3b8' }}>BGP Peering Sessions:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700, color: outageStep === 4 ? '#ef4444' : outageStep === 5 ? '#2dd4bf' : '#34d399' }}>
                        {outageStep === 4 ? '0 / 3,000 (DOWN)' : outageStep >= 2 && outageStep <= 3 ? 'Flapping...' : '3,000 / 3,000 (ESTABLISHED)'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '4px 0', color: '#94a3b8' }}>Kernel Pod Routes:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700, color: outageStep === 4 ? '#ef4444' : '#34d399' }}>
                        {outageStep === 4 ? 'Flushed (No remote routes)' : 'Active (Direct L3 wire)'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '4px 0', color: '#94a3b8' }}>CoreDNS Resolution:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700, color: outageStep === 4 ? '#ef4444' : '#34d399' }}>
                        {outageStep === 4 ? 'NXDOMAIN / TIMEOUT' : '100% OK'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#94a3b8' }}>Public Traffic Load:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700, color: outageStep === 4 ? '#ef4444' : outageStep === 5 ? '#2dd4bf' : '#34d399' }}>
                        {outageStep === 4 ? '0% (Outage 314 mins)' : outageStep === 5 ? 'Staged (1% ➔ 100%)' : '100% Active'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
