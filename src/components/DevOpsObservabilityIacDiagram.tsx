import React, { useState } from 'react';

const TERRAFORM_STAGES = [
  { step: '1. Code Definition', cmd: 'resource "aws_instance" "web" { ami = "..." }', desc: 'Define target infrastructure state declaratively in HashiCorp Configuration Language (HCL).' },
  { step: '2. Initialization', cmd: 'terraform init', desc: 'Downloads provider plugins (AWS, GCP, Azure, Helm) and configures backend state storage (S3 + DynamoDB lock).' },
  { step: '3. DAG Execution Plan', cmd: 'terraform plan', desc: 'Queries provider APIs, compares real-world infrastructure vs state file vs code, and constructs a Directed Acyclic Graph (DAG) of dependency execution.' },
  { step: '4. Apply & State Locking', cmd: 'terraform apply', desc: 'Acquires DynamoDB state lock, executes API calls concurrently along DAG nodes, and persists final state.' }
];

export default function DevOpsObservabilityIacDiagram({ initialTab = 'observability' }: { initialTab?: 'observability' | 'terraform' | 'iac' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'observability' | 'terraform' | 'iac'>(initialTab);
  const [activeTfStep, setActiveTfStep] = useState<number>(0);
  const [selectedPillar, setSelectedPillar] = useState<'metrics' | 'logs' | 'traces'>('metrics');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .obs-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          DevOps Observability Pillars & Terraform IaC DAG State Engine
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'observability', label: '📊 3 Pillars of Observability (Metrics, Logs, Traces)', color: '#38bdf8' },
            { id: 'terraform', label: '🏗️ Terraform DAG Engine & State Lifecycle', color: '#a78bfa' },
            { id: 'iac', label: '⚔️ Declarative (Terraform) vs Procedural (Ansible)', color: '#34d399' }
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

        {/* Tab 1: Observability Pillars */}
        {activeTab === 'observability' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'metrics', label: '1. Metrics (Prometheus / TSDB)', color: '#38bdf8' },
                { id: 'logs', label: '2. Logs (Loki / Fluentbit / ELK)', color: '#fbbf24' },
                { id: 'traces', label: '3. Distributed Traces (Jaeger / OpenTelemetry)', color: '#a78bfa' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPillar(p.id as any)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: selectedPillar === p.id ? `${p.color}25` : 'rgba(255,255,255,0.03)',
                    color: selectedPillar === p.id ? p.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: selectedPillar === p.id ? `0 0 0 1.5px ${p.color}` : 'none'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="interactive-diagram-details-card details-blue">
              {selectedPillar === 'metrics' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>Metrics: Aggregated Numeric Time-Series</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Low-overhead numeric data points sampled at fixed intervals (e.g. CPU %, Memory MB, Request Count, Latency p99). Best for high-level system health monitoring, dashboard alerts, and HPA autoscaling.
                  </p>
                </div>
              )}
              {selectedPillar === 'logs' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>Logs: Discrete Timestamped Events</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Text strings emitted by applications (e.g. stack traces, database queries, error messages). Essential for post-mortem debugging and root-cause investigation.
                  </p>
                </div>
              )}
              {selectedPillar === 'traces' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', marginBottom: '6px' }}>Distributed Traces: End-to-End Request Lifecycles</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Traces a single HTTP/gRPC request as it propagates through microservices. Uses W3C Trace Context (TraceId, SpanId) to identify latency bottlenecks across distributed network boundaries.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Terraform DAG Engine */}
        {activeTab === 'terraform' && (
          <div className="obs-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                TERRAFORM STATE EXECUTION STAGES:
              </div>

              {TERRAFORM_STAGES.map((st, idx) => {
                const isSel = idx === activeTfStep;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveTfStep(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isSel ? '#a78bfa' : 'var(--ifm-color-content)' }}>
                      {st.step}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-purple" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px' }}>
                Terraform State Engine & DAG Inspection
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {TERRAFORM_STAGES[activeTfStep].step}
              </div>
              <pre style={{ background: '#090b14', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', fontSize: '11px', overflowX: 'auto', margin: '0 0 10px' }}>
                {TERRAFORM_STAGES[activeTfStep].cmd}
              </pre>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                {TERRAFORM_STAGES[activeTfStep].desc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Declarative vs Procedural */}
        {activeTab === 'iac' && (
          <div className="obs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', marginBottom: '6px' }}>Declarative (Terraform)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 8px' }}>
                You define <strong>WHAT</strong> the desired end state should be (e.g. "I want 5 web servers"). Terraform calculates the diff vs current state file and creates/destroys resources automatically.
              </p>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>Procedural / Imperative (Ansible)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 8px' }}>
                You define <strong>HOW</strong> to perform configuration steps sequentially in Playbooks (e.g. "Step 1: apt-get update, Step 2: install nginx, Step 3: start service").
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
