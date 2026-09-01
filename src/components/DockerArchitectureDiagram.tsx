import React, { useState } from 'react';

type DockerTab = 'engine' | 'internals' | 'multistage' | 'network';

const BUILD_STAGES = [
  { stage: 'Stage 1: Base Image', cmd: 'FROM maven:3.9-eclipse-temurin-21 AS builder', size: '650 MB', desc: 'Pull JDK & Maven build tools image.' },
  { stage: 'Stage 2: Dependency Cache', cmd: 'COPY pom.xml . && RUN mvn dependency:go-offline', size: '200 MB', desc: 'Cache Maven dependencies into an immutable image layer.' },
  { stage: 'Stage 3: Application Build', cmd: 'COPY src ./src && RUN mvn package -DskipTests', size: '45 MB', desc: 'Compile Java code and package executable JAR.' },
  { stage: 'Stage 4: Distroless Runtime', cmd: 'FROM gcr.io/distroless/java21-debian12', size: '180 MB', desc: 'Switch to minimal distroless OS (No shell, no package manager).' },
  { stage: 'Stage 5: Final Copy', cmd: 'COPY --from=builder /app/target/app.jar /app.jar', size: '225 MB Total', desc: 'Copy compiled artifact into distroless runtime layer.' }
];

export default function DockerArchitectureDiagram({ initialTab = 'internals' }: { initialTab?: DockerTab }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DockerTab>(initialTab);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('pid');
  const [selectedNetwork, setSelectedNetwork] = useState<'bridge' | 'host' | 'overlay' | 'macvlan'>('bridge');

  const namespaces = [
    { id: 'pid', name: 'PID Namespace', role: 'Process Isolation', desc: 'The container process sees itself as PID 1, while on the host OS it has a normal PID (e.g. 14230). Cannot see host processes.', color: '#38bdf8' },
    { id: 'net', name: 'NET Namespace', role: 'Network Stack', desc: 'Gives the container its own loopback (127.0.0.1), IP routing table, and virtual ethernet pair (veth) connected to docker0 bridge.', color: '#34d399' },
    { id: 'mnt', name: 'MNT Namespace', role: 'Filesystem Mounts', desc: 'Roots the container filesystem in its isolated rootfs (OverlayFS union mount), completely isolated from the host / directory.', color: '#fbbf24' },
    { id: 'ipc', name: 'IPC Namespace', role: 'Inter-Process Comm', desc: 'Prevents container processes from accessing shared memory segments, semaphores, or message queues of host or other containers.', color: '#a78bfa' },
    { id: 'uts', name: 'UTS Namespace', role: 'Hostname & Domain', desc: 'Allows the container to have its own independent hostname (e.g. "my-app-container") separate from the host node name.', color: '#f472b6' },
    { id: 'user', name: 'USER Namespace', role: 'User & Group IDs', desc: 'Maps container root (UID 0) to an unprivileged unallocated UID on the host (e.g. UID 10001), preventing host root escalation.', color: '#2dd4bf' }
  ];

  const currentNs = namespaces.find(n => n.id === selectedNamespace) || namespaces[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
          <path d="M12 12L2.1 12A10 10 0 0 0 12 22V12z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Docker Under the Hood: Kernel Internals & Architecture
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'internals', label: '🧠 Kernel Isolation (Under the Hood)', color: '#38bdf8' },
            { id: 'engine', label: '⚙️ Engine Pipeline', color: '#34d399' },
            { id: 'multistage', label: '🏗️ Multi-Stage Builder', color: '#fbbf24' },
            { id: 'network', label: '🌐 Network Drivers', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as DockerTab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: KERNEL ISOLATION INTERNALS */}
        {activeTab === 'internals' && (
          <div>
            <div style={{
              padding: '12px 16px',
              background: 'rgba(56, 189, 248, 0.06)',
              borderLeft: '4px solid #38bdf8',
              borderRadius: '0 8px 8px 0',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                Demystifying Containers: "A Container is Just an Isolated Linux Process"
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                Containers are <strong>not virtual machines</strong>. There is no hypervisor and no guest OS. A container is a standard Linux process isolated by the kernel using three foundational primitives: <strong>Namespaces</strong> (what it can see), <strong>Cgroups</strong> (what it can consume), and <strong>OverlayFS</strong> (how its filesystem is layered).
              </div>
            </div>

            {/* SVG Internals Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 200" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                  <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                </defs>

                {/* Host Linux Kernel */}
                <rect x="15" y="140" width="790" height="45" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#64748b" strokeWidth="1.5" />
                <text x="30" y="168" fill="#e2e8f0" fontSize="13" fontWeight="700">🐧 Shared Host Linux Kernel (Rings 0 & 3)</text>
                <text x="580" y="168" fill="#94a3b8" fontSize="11">Single kernel manages all containers</text>

                {/* Container 1 Process Box */}
                <g transform="translate(30, 20)">
                  <rect x="0" y="0" width="360" height="105" rx="8" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="15" y="24" fill="#38bdf8" fontSize="12" fontWeight="700">📦 Container Process (e.g. Node.js)</text>

                  {/* Namespaces shield */}
                  <rect x="15" y="38" width="155" height="50" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                  <text x="25" y="58" fill="#e0f2fe" fontSize="10" fontWeight="700">🛡️ Linux Namespaces</text>
                  <text x="25" y="75" fill="#93c5fd" fontSize="9">PID, NET, MNT, IPC</text>

                  {/* Cgroups barrier */}
                  <rect x="185" y="38" width="155" height="50" rx="4" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" />
                  <text x="195" y="58" fill="#34d399" fontSize="10" fontWeight="700">⚖️ Control Groups</text>
                  <text x="195" y="75" fill="#86efac" fontSize="9">Max 512MB RAM, 1 CPU</text>

                  <path d="M 180 106 L 180 120" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-blue)" className="interactive-diagram-flowing-path" />
                </g>

                {/* Container 2 OverlayFS Layering */}
                <g transform="translate(425, 20)">
                  <rect x="0" y="0" width="370" height="105" rx="8" fill="rgba(251, 191, 36, 0.1)" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="15" y="24" fill="#fbbf24" fontSize="12" fontWeight="700">📁 OverlayFS Union Filesystem</text>

                  {/* Upperdir */}
                  <rect x="15" y="38" width="340" height="24" rx="4" fill="rgba(52, 211, 153, 0.25)" stroke="#34d399" />
                  <text x="25" y="54" fill="#6ee7b7" fontSize="10" fontWeight="700">Container Layer (Read/Write - UpperDir)</text>

                  {/* Lowerdir */}
                  <rect x="15" y="66" width="340" height="24" rx="4" fill="rgba(251, 191, 36, 0.25)" stroke="#fbbf24" />
                  <text x="25" y="82" fill="#fde68a" fontSize="10">Image Layers (Read-Only - LowerDir / Base OS)</text>

                  <path d="M 185 106 L 185 120" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
                </g>
              </svg>
            </div>

            {/* Interactive Namespace Inspector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '6px', marginBottom: '12px' }}>
              {namespaces.map(ns => (
                <button
                  key={ns.id}
                  onClick={() => setSelectedNamespace(ns.id)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '6px',
                    border: `1px solid ${selectedNamespace === ns.id ? ns.color : 'rgba(255,255,255,0.08)'}`,
                    background: selectedNamespace === ns.id ? `${ns.color}20` : 'rgba(255,255,255,0.02)',
                    color: selectedNamespace === ns.id ? ns.color : 'var(--ifm-color-content-secondary)',
                    fontWeight: selectedNamespace === ns.id ? 700 : 500,
                    fontSize: '11px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {ns.name}
                </button>
              ))}
            </div>

            <div style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${currentNs.color}40`,
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: currentNs.color }}>
                  {currentNs.name} — {currentNs.role}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                {currentNs.desc}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ENGINE PIPELINE */}
        {activeTab === 'engine' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              The Docker Client communicates with the <code>dockerd</code> daemon over a UNIX socket or REST API. <code>dockerd</code> delegates low-level container management to <code>containerd</code> and OCI runtime <code>runc</code>.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {[
                { title: '1. Docker CLI Client', desc: 'Executes `docker run/build/pull`. Talks over REST API.', color: '#38bdf8' },
                { title: '2. Docker Daemon (dockerd)', desc: 'Manages images, volumes, network bridges, and API endpoints.', color: '#a78bfa' },
                { title: '3. containerd', desc: 'High-level OCI daemon. Handles image transfer, execution & storage.', color: '#fbbf24' },
                { title: '4. runc Engine', desc: 'Low-level OCI reference runtime. Configures namespaces & cgroups.', color: '#34d399' }
              ].map(step => (
                <div key={step.title} style={{ padding: '12px', background: `${step.color}0a`, border: `1px solid ${step.color}30`, borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: step.color, marginBottom: '4px' }}>{step.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MULTI-STAGE BUILDER */}
        {activeTab === 'multistage' && (
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
              {BUILD_STAGES.map((s, idx) => (
                <button
                  key={s.stage}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${activeStep === idx ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                    background: activeStep === idx ? '#34d39920' : 'rgba(255,255,255,0.02)',
                    color: activeStep === idx ? '#34d399' : 'var(--ifm-color-content-secondary)',
                    fontWeight: activeStep === idx ? 700 : 500,
                    fontSize: '11px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {s.stage.split(':')[0]}
                </button>
              ))}
            </div>

            <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>{BUILD_STAGES[activeStep].stage}</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#fbbf24' }}>Layer Size: {BUILD_STAGES[activeStep].size}</span>
              </div>
              <pre style={{ margin: '6px 0', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '4px', color: '#e2e8f0', fontSize: '12px' }}>
                <code>{BUILD_STAGES[activeStep].cmd}</code>
              </pre>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                {BUILD_STAGES[activeStep].desc}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NETWORK DRIVERS */}
        {activeTab === 'network' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {(['bridge', 'host', 'overlay', 'macvlan'] as const).map(net => (
                <button
                  key={net}
                  onClick={() => setSelectedNetwork(net)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${selectedNetwork === net ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                    background: selectedNetwork === net ? '#a78bfa20' : 'rgba(255,255,255,0.02)',
                    color: selectedNetwork === net ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
                    fontWeight: selectedNetwork === net ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {net} Driver
                </button>
              ))}
            </div>

            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
              {selectedNetwork === 'bridge' && (
                <div>
                  <strong style={{ color: '#38bdf8' }}>Bridge Network (Default):</strong> Creates a private internal network subnet (e.g. <code>172.17.0.0/16</code>) on the host with NAT firewall routing. Containers on the same bridge talk by IP.
                </div>
              )}
              {selectedNetwork === 'host' && (
                <div>
                  <strong style={{ color: '#34d399' }}>Host Network:</strong> Removes network isolation. The container shares the host network namespace directly. Zero NAT overhead, maximum throughput.
                </div>
              )}
              {selectedNetwork === 'overlay' && (
                <div>
                  <strong style={{ color: '#fbbf24' }}>Overlay Network:</strong> Enables multi-host VXLAN tunnel routing across different Docker daemons / Swarm / Kubernetes nodes.
                </div>
              )}
              {selectedNetwork === 'macvlan' && (
                <div>
                  <strong style={{ color: '#f472b6' }}>Macvlan Driver:</strong> Assigns a physical MAC address to each container, making it appear as a physical device on your corporate LAN router.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
