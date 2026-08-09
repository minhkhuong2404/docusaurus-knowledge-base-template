import React, { useState } from 'react';

const BUILD_STAGES = [
  { stage: 'Stage 1: Base Image', cmd: 'FROM maven:3.9-eclipse-temurin-21 AS builder', size: '650 MB', desc: 'Pull JDK & Maven build tools image.' },
  { stage: 'Stage 2: Dependency Cache', cmd: 'COPY pom.xml . && RUN mvn dependency:go-offline', size: '200 MB', desc: 'Cache Maven dependencies into an immutable image layer.' },
  { stage: 'Stage 3: Application Build', cmd: 'COPY src ./src && RUN mvn package -DskipTests', size: '45 MB', desc: 'Compile Java code and package executable JAR.' },
  { stage: 'Stage 4: Distroless Runtime', cmd: 'FROM gcr.io/distroless/java21-debian12', size: '180 MB', desc: 'Switch to minimal distroless OS (No shell, no package manager).' },
  { stage: 'Stage 5: Final Copy', cmd: 'COPY --from=builder /app/target/app.jar /app.jar', size: '225 MB Total', desc: 'Copy compiled artifact into distroless runtime layer.' }
];

export default function DockerArchitectureDiagram({ initialTab = 'engine' }: { initialTab?: 'engine' | 'multistage' | 'network' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'engine' | 'multistage' | 'network'>(initialTab);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedNetwork, setSelectedNetwork] = useState<'bridge' | 'host' | 'overlay' | 'macvlan'>('bridge');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .docker-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
          <path d="M12 12L2.1 12A10 10 0 0 0 12 22V12z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Docker Architecture, Multi-Stage Build & Networking Engine
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'engine', label: '⚙️ Client-Daemon Architecture Engine', color: '#38bdf8' },
            { id: 'multistage', label: '🏗️ Multi-Stage Dockerfile Builder (Layer Optimization)', color: '#34d399' },
            { id: 'network', label: '🌐 Docker Network Drivers (Bridge, Host, Overlay)', color: '#fbbf24' }
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

        {/* Tab 1: Engine Pipeline */}
        {activeTab === 'engine' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              The Docker Client communicates with the <code>dockerd</code> daemon over a UNIX socket or REST API. <code>dockerd</code> delegates low-level container management to <code>containerd</code> and OCI runtime <code>runc</code>.
            </div>

            <div className="docker-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              {[
                { title: '1. Docker CLI Client', desc: 'Executes `docker run/build/pull`. Talks over REST API.', color: '#38bdf8' },
                { title: '2. Docker Daemon (dockerd)', desc: 'Manages images, volumes, network bridges, and API endpoints.', color: '#a78bfa' },
                { title: '3. containerd', desc: 'High-level OCI daemon. Handles image transfer, execution & storage.', color: '#fbbf24' },
                { title: '4. runc Engine', desc: 'Low-level OCI reference runtime. Configures namespaces & cgroups.', color: '#34d399' }
              ].map((comp, idx) => (
                <div key={idx} style={{ background: `${comp.color}15`, border: `1px solid ${comp.color}40`, borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: comp.color }}>{comp.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{comp.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Multi-Stage Builder */}
        {activeTab === 'multistage' && (
          <div className="docker-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT BUILD STAGE:
              </div>

              {BUILD_STAGES.map((st, idx) => {
                const isSel = idx === activeStep;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: isSel ? '#34d399' : 'var(--ifm-color-content)' }}>
                        {st.stage}
                      </div>
                      <code style={{ fontSize: '10px', color: '#fbbf24' }}>{st.size}</code>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      {st.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage Details */}
            <div className="interactive-diagram-details-card details-green" style={{ minHeight: '300px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '8px' }}>
                Dockerfile Instruction & Layer Cache
              </div>

              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {BUILD_STAGES[activeStep].stage}
              </div>

              <pre style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: '#34d399', fontSize: '11px', overflowX: 'auto', margin: '0 0 12px' }}>
                {BUILD_STAGES[activeStep].cmd}
              </pre>

              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Image Size Optimization Result</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                  Single-stage build: ~895 MB ➔ Multi-stage Distroless build: 225 MB (75% Reduction!)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Networking Drivers */}
        {activeTab === 'network' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'bridge', label: 'Bridge (Default NAT)', color: '#38bdf8' },
                { id: 'host', label: 'Host (Bypass Namespace)', color: '#34d399' },
                { id: 'overlay', label: 'Overlay (Multi-Host VXLAN)', color: '#a78bfa' },
                { id: 'macvlan', label: 'Macvlan (Direct MAC)', color: '#fbbf24' }
              ].map(net => (
                <button
                  key={net.id}
                  onClick={() => setSelectedNetwork(net.id as any)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: selectedNetwork === net.id ? `${net.color}25` : 'rgba(255,255,255,0.03)',
                    color: selectedNetwork === net.id ? net.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: selectedNetwork === net.id ? `0 0 0 1.5px ${net.color}` : 'none'
                  }}
                >
                  {net.label}
                </button>
              ))}
            </div>

            <div className="interactive-diagram-details-card details-yellow">
              {selectedNetwork === 'bridge' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>Bridge Driver (Default Single-Host NAT)</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Creates a virtual software bridge (e.g. <code>docker0</code>) on the host. Containers get private IPs (172.17.0.x) connected via virtual ethernet pairs (<code>veth</code>). Port forwarding uses iptables NAT rules.
                  </p>
                </div>
              )}
              {selectedNetwork === 'host' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>Host Driver (Bypass Network Isolation)</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Bypasses network namespace isolation. Container shares the host’s network stack directly (port 80 in container binds directly to host port 80). Maximum throughput, no NAT overhead.
                  </p>
                </div>
              )}
              {selectedNetwork === 'overlay' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', marginBottom: '6px' }}>Overlay Driver (Multi-Host VXLAN Tunneling)</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Creates a distributed virtual network across multiple physical Docker hosts (Swarm/K8s). Encapsulates L2 packets inside UDP/IP packets using VXLAN (Virtual Extensible LAN) tunneling.
                  </p>
                </div>
              )}
              {selectedNetwork === 'macvlan' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>Macvlan Driver (Direct Physical MAC Attachment)</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Assigns a unique physical MAC address to each container. Appears as a direct physical device on the physical network subnet (ideal for legacy apps requiring direct IP addressing).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
