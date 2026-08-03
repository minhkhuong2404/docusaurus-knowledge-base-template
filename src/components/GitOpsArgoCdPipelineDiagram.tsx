import React, { useState } from 'react';

const GITOPS_STEPS = [
  { step: '1. Developer Git Commit', actor: 'Developer / Git Repo', desc: 'Developer commits updated Kubernetes manifests / Helm values to GitHub. Git is the single source of truth.' },
  { step: '2. ArgoCD Webhook Event', actor: 'Git Repository', desc: 'Git triggers a push webhook event notifying the ArgoCD Application Controller.' },
  { step: '3. Drift Detection (OutOfSync)', actor: 'ArgoCD Controller', desc: 'ArgoCD compares desired state in Git vs live state in K8s cluster. Identifies drift (OutOfSync).' },
  { step: '4. Automated Reconciliation', actor: 'ArgoCD Application Engine', desc: 'ArgoCD applies new manifests to K8s kube-apiserver using service account RBAC tokens.' },
  { step: '5. Progressive Canary Rollout', actor: 'Argo Rollouts Engine', desc: 'Rolls out 20% traffic to new Pod version, monitors Prometheus metrics, auto-promotes to 100% or rolls back.' },
  { step: '6. Cluster State Synced', actor: 'K8s Cluster State', desc: 'Live cluster state matches Git repository state perfectly. Application status = Synced & Healthy.' }
];

export default function GitOpsArgoCdPipelineDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'rollout' | 'operator'>('pipeline');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [rolloutMode, setRolloutMode] = useState<'canary' | 'bluegreen'>('canary');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .gitops-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          GitOps ArgoCD Sync Pipeline & Kubernetes Operator Reconciler
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'pipeline', label: '🔄 GitOps Pull-Based Sync Pipeline (ArgoCD)', color: '#f97316' },
            { id: 'rollout', label: '🚀 Progressive Rollouts (Canary vs Blue-Green)', color: '#38bdf8' },
            { id: 'operator', label: '🤖 Kubernetes Operator Reconciliation Loop', color: '#34d399' }
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

        {/* Tab 1: Sync Pipeline */}
        {activeTab === 'pipeline' && (
          <div className="gitops-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                GITOPS RECONCILIATION STAGES:
              </div>

              {GITOPS_STEPS.map((st, idx) => {
                const isSel = idx === activeStep;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#f97316' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isSel ? '#f97316' : 'var(--ifm-color-content)' }}>
                      {st.step}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      Actor: {st.actor}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage Detail Card */}
            <div className="interactive-diagram-details-card details-red" style={{ minHeight: '300px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', marginBottom: '6px' }}>
                ArgoCD Reconciliation Engine Stage
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {GITOPS_STEPS[activeStep].step}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
                {GITOPS_STEPS[activeStep].desc}
              </p>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#38bdf8' }}>
                💡 <strong>GitOps Key Principle:</strong> Pull-based agents running <em>inside</em> the cluster eliminate the security vulnerability of exposing cluster SSH/kubeconfig credentials to external CI runners.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Rollouts */}
        {activeTab === 'rollout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setRolloutMode('canary')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  background: rolloutMode === 'canary' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)',
                  color: rolloutMode === 'canary' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                  boxShadow: rolloutMode === 'canary' ? '0 0 0 1.5px #38bdf8' : 'none'
                }}
              >
                🐤 Canary Deployment Strategy
              </button>
              <button
                onClick={() => setRolloutMode('bluegreen')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  background: rolloutMode === 'bluegreen' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.03)',
                  color: rolloutMode === 'bluegreen' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  boxShadow: rolloutMode === 'bluegreen' ? '0 0 0 1.5px #34d399' : 'none'
                }}
              >
                🔵🟢 Blue/Green Deployment Strategy
              </button>
            </div>

            <div className="interactive-diagram-details-card details-blue">
              {rolloutMode === 'canary' ? (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>Canary Rollout (Gradual Traffic Shifting)</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Routes 10% ➔ 20% ➔ 50% ➔ 100% of live production traffic to new version Pods. Argo Rollouts analyzes Prometheus error rates during pause intervals; if error rates spike &gt; 0.5%, it automatically aborts and rolls back.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>Blue/Green Rollout (Instant Switchover)</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Deploys new version (Green) alongside current active version (Blue). Once Green passes full integration tests, K8s Service selector is instantly updated to point 100% traffic to Green.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Operator Reconciler */}
        {activeTab === 'operator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              A Kubernetes Operator extends the K8s API by pairing a Custom Resource Definition (CRD) with a custom controller reconciliation loop.
            </div>

            <div className="gitops-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f97316', marginBottom: '4px' }}>1. Custom Resource (CRD)</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Defines domain-specific schema (e.g. <code>kind: PostgresCluster</code>).
                </div>
              </div>

              <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>2. Reconcile Loop</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Controller watches CR events: <code>Observe ➔ Compare ➔ Act</code>.
                </div>
              </div>

              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>3. Domain Automation</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Automates backups, failovers, schema upgrades, and scaling automatically.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
