import React, { useState } from 'react';

const WORKLOADS = [
  { id: 'deploy', name: 'Deployment (Stateless Apps)', desc: 'Manages ReplicaSets for stateless web apps & microservices. Supports RollingUpdate and Recreate strategies.' },
  { id: 'sts', name: 'StatefulSet (Stateful Workloads)', desc: 'Provides unique, stable network identifiers (pod-0, pod-1), ordered deployment/scaling, and dedicated PersistentVolumeClaims per pod (e.g. Postgres, Kafka, Cassandra).' },
  { id: 'ds', name: 'DaemonSet (Node Daemons)', desc: 'Ensures exactly one copy of a Pod runs on every matching Worker Node (e.g. Fluentbit log collectors, Prometheus node-exporter, Datadog agents).' },
  { id: 'job', name: 'Job / CronJob (Batch Processing)', desc: 'Job creates Pods that run to completion and exit (exit 0). CronJob executes Jobs on a time-based schedule (e.g. 0 2 * * * DB backup).' }
];

const SERVICE_TYPES = [
  { id: 'clusterip', name: 'ClusterIP (Internal Only)', desc: 'Exposes Service on an internal cluster IP (e.g. 10.96.0.45). Reachable only from inside the cluster.' },
  { id: 'nodeport', name: 'NodePort (Host Port Binding)', desc: 'Exposes Service on each Node IP at a static port (range 30000-32767). Routes traffic to ClusterIP.' },
  { id: 'lb', name: 'LoadBalancer (Cloud Provider)', desc: 'Provisions an external Cloud Load Balancer (AWS ALB, GCP NLB) that forwards public traffic to NodePorts.' },
  { id: 'ingress', name: 'Ingress Controller (L7 HTTP Router)', desc: 'Manages external L7 HTTP/HTTPS routing rules, TLS termination, and path-based routing (/api ➔ service-a, /app ➔ service-b).' }
];

export default function KubernetesWorkloadsNetworkingDiagram({ initialTab = 'workloads' }: { initialTab?: 'workloads' | 'services' | 'storage' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'workloads' | 'services' | 'storage'>(initialTab);
  const [selectedWorkload, setSelectedWorkload] = useState<string>('deploy');
  const [selectedService, setSelectedService] = useState<string>('ingress');

  const currWorkload = WORKLOADS.find(w => w.id === selectedWorkload)!;
  const currService = SERVICE_TYPES.find(s => s.id === selectedService)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .k8s-workload-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kubernetes Workload Controllers, Services & Storage CSI Architecture
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'workloads', label: '📦 Workload Controllers (Deployment vs StatefulSet)', color: '#fbbf24' },
            { id: 'services', label: '🌐 K8s Networking & Services (ClusterIP ➔ Ingress)', color: '#38bdf8' },
            { id: 'storage', label: '💾 Storage CSI Architecture (StorageClass ➔ PVC ➔ PV)', color: '#34d399' }
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

        {/* Tab 1: Workload Controllers */}
        {activeTab === 'workloads' && (
          <div className="k8s-workload-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT CONTROLLER SPEC:
              </div>

              {WORKLOADS.map(w => {
                const isSel = w.id === selectedWorkload;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorkload(w.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#fbbf24' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSel ? '#fbbf24' : 'var(--ifm-color-content)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {w.name}
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-yellow" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px' }}>
                Workload Controller Architecture
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {currWorkload.name}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: 0 }}>
                {currWorkload.desc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Networking & Services */}
        {activeTab === 'services' && (
          <div className="k8s-workload-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT SERVICE ROUTING TYPE:
              </div>

              {SERVICE_TYPES.map(s => {
                const isSel = s.id === selectedService;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedService(s.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSel ? '#38bdf8' : 'var(--ifm-color-content)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {s.name}
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Networking & Service Traffic Flow
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {currService.name}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: 0 }}>
                {currService.desc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Storage CSI */}
        {activeTab === 'storage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              Kubernetes decouples storage consumption from implementation using 3 primary abstractions:
            </div>

            <div className="k8s-workload-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>1. StorageClass</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Defines storage profiles (e.g. <code>gp3-aws</code>, <code>pd-ssd-gcp</code>) and provisions PVs on demand via CSI plugin.
                </div>
              </div>

              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>2. PersistentVolumeClaim (PVC)</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  A developer's ticket requesting storage (e.g. "Give me 50GB ReadWriteOnce storage").
                </div>
              </div>

              <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>3. PersistentVolume (PV)</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  The actual physical storage resource in the cluster provisioned by administrator or StorageClass CSI plugin.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
