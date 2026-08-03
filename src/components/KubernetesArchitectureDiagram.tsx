import React, { useState } from 'react';

const CONTROL_PLANE_COMPONENTS = [
  { id: 'apiserver', name: 'kube-apiserver', role: 'API Gateway & Validation', desc: 'Central hub. All kubectl calls & internal agents authenticate & validate YAML schemas via apiserver.' },
  { id: 'etcd', name: 'etcd Key-Value Store', role: 'Distributed State Database', desc: 'Consistent & highly-available key-value store using Raft consensus. Holds entire cluster desired state.' },
  { id: 'scheduler', name: 'kube-scheduler', role: 'Pod Node Placement', desc: 'Watches newly created Pods without assigned nodes. Selects optimal worker node based on CPU/RAM requests, taints, and affinity.' },
  { id: 'controller', name: 'kube-controller-manager', role: 'Control Loop Reconciler', desc: 'Runs background reconciliation loops (DeploymentController, NodeController, EndpointsController) to ensure live state matches desired state.' }
];

const WORKER_NODE_COMPONENTS = [
  { id: 'kubelet', name: 'kubelet Agent', role: 'Node Primary Daemon', desc: 'Communicates with kube-apiserver. Interacts with Container Runtime via CRI to pull images and start/monitor containers.' },
  { id: 'kubeproxy', name: 'kube-proxy', role: 'Network Proxy & Load Balancer', desc: 'Maintains network rules on node. Handles Service ClusterIP routing via iptables, IPVS, or eBPF (Cilium).' },
  { id: 'runtime', name: 'Container Runtime (containerd)', role: 'OCI Exec Engine', desc: 'Executes actual container processes inside Linux cgroups/namespaces requested by kubelet.' }
];

export default function KubernetesArchitectureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'architecture' | 'podlifecycle' | 'probes'>('architecture');
  const [selectedComp, setSelectedComp] = useState<string>('apiserver');
  const [podState, setPodState] = useState<'pending' | 'creating' | 'running' | 'failed'>('running');

  const activeCompData = [...CONTROL_PLANE_COMPONENTS, ...WORKER_NODE_COMPONENTS].find(c => c.id === selectedComp)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .k8s-arch-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kubernetes Architecture, Control Plane & Pod Lifecycle Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'architecture', label: '☸️ Cluster Topology (Control Plane vs Worker Nodes)', color: '#34d399' },
            { id: 'podlifecycle', label: '🔄 Pod Lifecycle State Machine (Pending ➔ Running)', color: '#38bdf8' },
            { id: 'probes', label: '🛡️ Health Probes (Liveness vs Readiness vs Startup)', color: '#fbbf24' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Architecture Topology */}
        {activeTab === 'architecture' && (
          <div className="k8s-arch-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Control Plane Block */}
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', marginBottom: '8px', textTransform: 'uppercase' }}>
                  CONTROL PLANE NODES (MASTER):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {CONTROL_PLANE_COMPONENTS.map(c => {
                    const isSel = selectedComp === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedComp(c.id)}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          background: isSel ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSel ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                          cursor: 'pointer',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: isSel ? '#34d399' : 'var(--ifm-color-content)'
                        }}
                      >
                        {c.name}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Worker Node Block */}
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px', textTransform: 'uppercase' }}>
                  WORKER NODES (COMPUTE):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {WORKER_NODE_COMPONENTS.map(c => {
                    const isSel = selectedComp === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedComp(c.id)}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          background: isSel ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isSel ? '#38bdf8' : 'var(--ifm-color-content)',
                          textAlign: 'center'
                        }}
                      >
                        {c.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Details Panel */}
            <div className="interactive-diagram-details-card details-green" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
                Subsystem Component Inspection
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                {activeCompData.name}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '10px' }}>
                Role: {activeCompData.role}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: 0 }}>
                {activeCompData.desc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Pod Lifecycle */}
        {activeTab === 'podlifecycle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'pending', label: '1. Pending', color: '#fbbf24' },
                { id: 'creating', label: '2. ContainerCreating', color: '#a78bfa' },
                { id: 'running', label: '3. Running (Healthy)', color: '#34d399' },
                { id: 'failed', label: '4. CrashLoopBackOff', color: '#f87171' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setPodState(st.id as any)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: podState === st.id ? `${st.color}25` : 'rgba(255,255,255,0.03)',
                    color: podState === st.id ? st.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: podState === st.id ? `0 0 0 1.5px ${st.color}` : 'none'
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="interactive-diagram-details-card details-blue">
              {podState === 'pending' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>Pending Phase</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Pod YAML accepted by <code>kube-apiserver</code> and saved in <code>etcd</code>. <code>kube-scheduler</code> is binding Pod to a suitable Worker Node based on resource requests.
                  </p>
                </div>
              )}
              {podState === 'creating' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', marginBottom: '4px' }}>ContainerCreating Phase</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    <code>kubelet</code> on worker node receives Pod spec. Container runtime is pulling container images, attaching CNI IP address, mounting Secrets/ConfigMaps, and executing Init Containers.
                  </p>
                </div>
              )}
              {podState === 'running' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>Running Phase (Passing Probes)</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    All main containers started successfully. Readiness Probes passing ➔ K8s Service Endpoint Controller routes live user traffic to this Pod.
                  </p>
                </div>
              )}
              {podState === 'failed' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>CrashLoopBackOff Phase</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Container exited with non-zero exit code or failed Liveness Probe. <code>kubelet</code> automatically restarts container with exponential backoff delay (10s ➔ 20s ➔ 40s... up to 5 minutes).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Probes */}
        {activeTab === 'probes' && (
          <div className="k8s-arch-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>1. Startup Probe</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                Disables Liveness/Readiness probes during legacy slow application boots. If failed: container is killed and restarted.
              </div>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>2. Readiness Probe</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                Determines if Pod should receive network traffic. If failed: Pod IP is removed from Service Endpoints (no restart).
              </div>
            </div>

            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>3. Liveness Probe</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                Detects deadlocks or unrecoverable freezes. If failed: <code>kubelet</code> kills container and triggers restart policy.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
