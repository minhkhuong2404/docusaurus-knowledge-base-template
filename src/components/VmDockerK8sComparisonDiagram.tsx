import React, { useState } from 'react';

export default function VmDockerK8sComparisonDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'stack' | 'rings' | 'kernel' | 'calc'>('stack');
  const [activeStack, setActiveStack] = useState<'vm' | 'docker' | 'k8s'>('docker');
  const [containerCount, setContainerCount] = useState<number>(20);

  // Resource Calculations
  // VM: 1 OS = ~2GB RAM tax per VM. 20 VMs = 40GB OS overhead + app memory (100MB * 20 = 2GB) = 42GB total
  // Docker: 1 Host OS = ~2GB RAM tax. 20 containers = 20 * 100MB = 2GB + 2GB OS = 4GB total
  const vmRamOverhead = containerCount * 2.0; // 2GB OS tax per VM
  const vmAppRam = containerCount * 0.1; // 100MB app memory
  const vmTotalRam = vmRamOverhead + vmAppRam;

  const dockerHostOsRam = 2.0;
  const dockerAppRam = containerCount * 0.1;
  const dockerTotalRam = dockerHostOsRam + dockerAppRam;

  const ramSavedGb = (vmTotalRam - dockerTotalRam).toFixed(1);
  const densityMultiplier = (vmTotalRam / dockerTotalRam).toFixed(1);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .vm-k8s-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Virtual Machines vs Docker Containers vs Kubernetes Orchestration
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'stack', label: '🏗️ Stack Architecture Comparison', color: '#38bdf8' },
            { id: 'rings', label: '🔒 CPU Protection Rings (Ring 0 vs Ring -1)', color: '#a78bfa' },
            { id: 'kernel', label: '🧠 Linux Kernel Sandbox (Namespaces & cgroups)', color: '#34d399' },
            { id: 'calc', label: '🧮 Density & Resource Overhead Calculator', color: '#fbbf24' }
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

        {/* Tab 1: Stack Architecture */}
        {activeTab === 'stack' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'vm', label: '🖥️ Virtual Machines (Heavy OS Isolation)', color: '#fbbf24' },
                { id: 'docker', label: '🐳 Docker Containers (Shared Kernel Process)', color: '#38bdf8' },
                { id: 'k8s', label: '☸️ Kubernetes Pods (Distributed Orchestration)', color: '#34d399' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveStack(s.id as any)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: activeStack === s.id ? `${s.color}25` : 'rgba(255,255,255,0.03)',
                    color: activeStack === s.id ? s.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: activeStack === s.id ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="vm-k8s-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
              {/* Stack Layers Display */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  STACK LAYERS (TOP TO BOTTOM):
                </div>

                {activeStack === 'vm' && (
                  <>
                    <div style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid #fbbf24', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>
                      App 1 / App 2 / App 3 (User Space Bin/Libs)
                    </div>
                    <div style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
                      Guest OS Kernel (Full OS per VM - 1GB-4GB Tax)
                    </div>
                    <div style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid #a78bfa', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#a78bfa' }}>
                      Hypervisor (Type 1 VMX Root / Type 2 KVM/ESXi)
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                      Physical Bare-Metal Hardware (CPU, RAM, NIC, SSD)
                    </div>
                  </>
                )}

                {activeStack === 'docker' && (
                  <>
                    <div style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                      Container 1 / Container 2 / Container 3 (App Bin/Libs)
                    </div>
                    <div style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid #34d399', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                      Container Runtime Engine (dockerd / containerd / runc)
                    </div>
                    <div style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid #a78bfa', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#a78bfa' }}>
                      Host Linux OS Kernel (Shared cgroups, Namespaces, Syscalls)
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                      Physical Bare-Metal Hardware (CPU, RAM, NIC, SSD)
                    </div>
                  </>
                )}

                {activeStack === 'k8s' && (
                  <>
                    <div style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid #34d399', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                      Kubernetes Pod Sandbox (Main Container + Init/Sidecars)
                    </div>
                    <div style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                      K8s Worker Node Agents (kubelet, kube-proxy, CNI Plugin)
                    </div>
                    <div style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid #a78bfa', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#a78bfa' }}>
                      Control Plane Orchestrator (kube-apiserver, etcd, scheduler)
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                      Multi-Node Cloud / Hybrid Compute Cluster Nodes
                    </div>
                  </>
                )}
              </div>

              {/* Stack Details Card */}
              <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '260px' }}>
                {activeStack === 'vm' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '8px' }}>
                      Virtual Machines: Heavy Hardware Virtualization
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                      VMs emulate physical hardware via a Hypervisor. Each VM requires its own complete Guest OS kernel, memory manager, and init system.
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                      <li><strong>Boot Time:</strong> 30 seconds to several minutes.</li>
                      <li><strong>Isolation:</strong> Hardware-level hardware traps via CPU VT-x.</li>
                      <li><strong>Overhead:</strong> High — GBs of RAM consumed per Guest OS.</li>
                    </ul>
                  </div>
                )}

                {activeStack === 'docker' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
                      Docker Containers: Lightweight Kernel Process Isolation
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                      Containers are not virtual machines! They are regular Linux processes isolated by kernel Namespaces, cgroups, and capabilities.
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                      <li><strong>Boot Time:</strong> Sub-second (instant process fork).</li>
                      <li><strong>Isolation:</strong> Kernel-level sandboxing (shared kernel).</li>
                      <li><strong>Overhead:</strong> Near-zero — only application memory used.</li>
                    </ul>
                  </div>
                )}

                {activeStack === 'k8s' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
                      Kubernetes: Production Cluster Orchestration
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                      Kubernetes manages thousands of containerized Pods across distributed clusters. It provides automated scheduling, self-healing, rolling updates, and service discovery.
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                      <li><strong>Self-Healing:</strong> Restarts failed containers & reschedules lost nodes.</li>
                      <li><strong>Auto-Scaling:</strong> Horizontal Pod Autoscaler (HPA) based on CPU/RAM metrics.</li>
                      <li><strong>Declarative:</strong> Reconciles desired state defined in YAML vs live state.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Protection Rings */}
        {activeTab === 'rings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              CPUs enforce hardware security through <strong>Protection Rings</strong>. Hypervisors introduce a special hardware execution mode (VMX Root / Ring -1) to trap Guest OS kernel instructions.
            </div>

            <div className="vm-k8s-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid #38bdf8', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>Ring 3: User Space</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Unprivileged app code. Must execute <code>SYSCALL</code> for hardware I/O.</div>
              </div>

              <div style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid #34d399', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>Ring 0: Host OS Kernel</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Direct access to raw CPU instructions, Memory MMU, and devices.</div>
              </div>

              <div style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid #a78bfa', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa' }}>Ring -1: Hypervisor (VMM)</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Intel VT-x / AMD-V VMX Root mode. Intercepts Guest VM Exits.</div>
              </div>

              <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid #fbbf24', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>EPT / NPT Hardware MMU</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Translates Guest Physical Address directly to Host Physical Address.</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Linux Kernel Sandbox */}
        {activeTab === 'kernel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              Docker containers are built entirely on 3 native Linux kernel subsystem primitives:
            </div>

            <div className="vm-k8s-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>1. Linux Namespaces (Isolation)</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Isolates what a process can <strong>see</strong>:
                  <ul style={{ margin: '4px 0 0', paddingLeft: '14px' }}>
                    <li><code>PID</code>: Process IDs</li>
                    <li><code>NET</code>: Network Interfaces & Routing</li>
                    <li><code>MNT</code>: Mount Points & Filesystems</li>
                    <li><code>IPC</code>: Inter-process Communication</li>
                    <li><code>UTS</code>: Hostname & Domain</li>
                    <li><code>USER</code>: User & Group IDs</li>
                  </ul>
                </div>
              </div>

              <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>2. Control Groups - cgroups (Limits)</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Limits & meters what a process can <strong>use</strong>:
                  <ul style={{ margin: '4px 0 0', paddingLeft: '14px' }}>
                    <li><code>CPU</code>: Shares & CFS quota quotas</li>
                    <li><code>Memory</code>: RAM limits & OOM killer</li>
                    <li><code>BlkIO</code>: Disk read/write throttling</li>
                    <li><code>pids</code>: Max thread/process count</li>
                  </ul>
                </div>
              </div>

              <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>3. OverlayFS (Copy-on-Write)</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Layered Union Filesystem:
                  <ul style={{ margin: '4px 0 0', paddingLeft: '14px' }}>
                    <li><code>LowerDir</code>: Read-only image layers</li>
                    <li><code>UpperDir</code>: Read-write container layer</li>
                    <li><code>MergedDir</code>: Unified mount presented to app</li>
                    <li>Copy-on-Write (CoW) on file modification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Calculator */}
        {activeTab === 'calc' && (
          <div className="vm-k8s-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '12px' }}>
                WORKLOAD CONCURRENCY CALCULATOR
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  NUMBER OF APPLICATION SERVICES: <span style={{ color: '#34d399' }}>{containerCount}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={containerCount}
                  onChange={e => setContainerCount(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                Assumes each application service requires <strong>100MB RAM</strong> runtime memory and a VM Guest OS requires <strong>2.0GB RAM</strong> base footprint.
              </div>
            </div>

            <div className="interactive-diagram-details-card details-yellow">
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '10px' }}>
                RESOURCE FOOTPRINT COMPARISON
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Virtual Machines RAM Required:</span>
                  <span style={{ fontWeight: 800, color: '#f87171' }}>{vmTotalRam.toFixed(1)} GB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Docker Containers RAM Required:</span>
                  <span style={{ fontWeight: 800, color: '#34d399' }}>{dockerTotalRam.toFixed(1)} GB</span>
                </div>
              </div>

              <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>RAM SAVED</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>{ramSavedGb} GB</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>DENSITY MULTIPLIER</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>{densityMultiplier}x More Dense</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
