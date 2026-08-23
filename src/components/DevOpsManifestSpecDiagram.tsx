import React, { useState } from 'react';

export default function DevOpsManifestSpecDiagram({ initialTab = 'docker' }: { initialTab?: 'docker' | 'k8s' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'docker' | 'k8s'>(initialTab);
  const [selectedLayerIdx, setSelectedLayerIdx] = useState<number>(0);
  const [k8sKind, setK8sKind] = useState<'Deployment' | 'StatefulSet' | 'DaemonSet'>('Deployment');

  const dockerLayers = [
    { name: 'Layer 1: Base Alpine OS', hash: 'sha256:59bf1c350a... (5.8 MB)', desc: 'Minimal Linux rootfs containing busybox utilities and musl libc.', isBase: true, color: '#38bdf8' },
    { name: 'Layer 2: OpenJDK 17 Runtime', hash: 'sha256:7c92b2341e... (180 MB)', desc: 'Installed JDK binary runtime, shared across all microservices on host.', isBase: false, color: '#fbbf24' },
    { name: 'Layer 3: Dependencies (Maven/Gradle)', hash: 'sha256:88a101fbc3... (45 MB)', desc: 'Cached third-party dependencies; changes rarely between commits.', isBase: false, color: '#a78bfa' },
    { name: 'Layer 4: Application Jar Artifact', hash: 'sha256:32e4d0912a... (18 MB)', desc: 'Spring Boot executable fat jar compiled from CI pipeline.', isBase: false, color: '#34d399' },
    { name: 'UpperDir: Container Read-Write Layer', hash: 'Ephemerally created at docker run', desc: 'Copy-on-write scratch space. Discarded when container exits unless volume mounted.', isBase: false, color: '#f87171' }
  ];

  const currentLayer = dockerLayers[selectedLayerIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Docker Image Manifest (OCI) &amp; Kubernetes Spec Architecture
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('docker')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'docker' ? '1px solid #38bdf850' : '1px solid transparent',
              background: activeTab === 'docker' ? '#38bdf818' : 'transparent',
              color: activeTab === 'docker' ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
            }}
          >
            OCI Layer Composition
          </button>
          <button
            onClick={() => setActiveTab('k8s')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'k8s' ? '1px solid #38bdf850' : '1px solid transparent',
              background: activeTab === 'k8s' ? '#38bdf818' : 'transparent',
              color: activeTab === 'k8s' ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Kubernetes Spec
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab 1: Docker Image Manifest & Layers */}
        {activeTab === 'docker' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '55% 45%',
              gap: '16px',
              alignItems: 'start'
            }}>
              {/* Left Column: Layer Stack */}
              <div style={{
                background: '#090b14',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px' }}>
                  Click an OCI image layer to inspect overlay2 mount semantics:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '6px' }}>
                  {dockerLayers.map((layer, idx) => (
                    <button
                      key={layer.name}
                      onClick={() => setSelectedLayerIdx(idx)}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: selectedLayerIdx === idx ? `1px solid ${layer.color}` : '1px solid rgba(255,255,255,0.06)',
                        background: selectedLayerIdx === idx ? `${layer.color}20` : '#0d1117',
                        color: selectedLayerIdx === idx ? layer.color : 'var(--ifm-color-content)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '11px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{layer.name}</div>
                      <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>{layer.hash}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Details & OverlayFS */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: `1px solid ${currentLayer.color}40`,
                padding: '16px'
              }}>
                <div style={{ color: currentLayer.color, fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                  {currentLayer.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace', marginBottom: '10px' }}>
                  {currentLayer.hash}
                </div>

                <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', fontSize: '11.5px', lineHeight: 1.5, color: 'var(--ifm-color-content)', marginBottom: '12px' }}>
                  {currentLayer.desc}
                </div>

                <div style={{ background: '#090b14', padding: '8px 10px', borderRadius: '6px', fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>
                  <strong>Overlay2 Storage Driver:</strong> Read-only layers reside in `lowerdir` and are shared immutably across all running containers on the host machine.
                </div>
              </div>
            </div>
            <style>{`
              @media (max-width: 768px) {
                div[style*="grid-template-columns: 55% 45%"] {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </div>
        )}

        {/* Tab 2: Kubernetes Workload Spec */}
        {activeTab === 'k8s' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {(['Deployment', 'StatefulSet', 'DaemonSet'] as const).map((kind) => (
                <button
                  key={kind}
                  onClick={() => setK8sKind(kind)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: k8sKind === kind ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                    background: k8sKind === kind ? '#38bdf818' : '#090b14',
                    color: k8sKind === kind ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
                  }}
                >
                  {kind}
                </button>
              ))}
            </div>

            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '16px'
            }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
                Kubernetes Workload Spec: {k8sKind}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '11px' }}>
                <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700 }}>apiVersion &amp; kind</div>
                  <div style={{ color: 'var(--ifm-color-content-secondary)' }}>apps/v1 • {k8sKind}</div>
                </div>

                <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                  <div style={{ color: '#34d399', fontWeight: 700 }}>Pod Lifecycle Semantics</div>
                  <div style={{ color: 'var(--ifm-color-content-secondary)' }}>
                    {k8sKind === 'Deployment' ? 'Stateless replica set with rolling updates' : k8sKind === 'StatefulSet' ? 'Stable network identity (pod-0) & persistent storage' : 'Exactly one pod on every node in cluster'}
                  </div>
                </div>

                <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #fbbf24' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 700 }}>Probes &amp; Resources</div>
                  <div style={{ color: 'var(--ifm-color-content-secondary)' }}>Liveness / Readiness / Startup HTTP probes + CPU/RAM limits &amp; requests</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
