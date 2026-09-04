import React, { useState } from 'react';

export default function KubernetesAdmissionWebhookDiagram({ initialTab = 'lifecycle' }: { initialTab?: 'lifecycle' | 'jsonpatch' | 'deadlock' | 'engines' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'jsonpatch' | 'deadlock' | 'engines'>(initialTab);
  const [activeStage, setActiveStage] = useState<number>(2); // 1 to 5
  const [simScenario, setSimScenario] = useState<'sidecar' | 'limits' | 'reject_latest' | 'root_check'>('sidecar');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .webhook-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kubernetes Dynamic Admission Controller: Mutating & Validating Webhooks
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'lifecycle', label: '🔄 1. API Server 5-Stage Request Pipeline', color: '#38bdf8' },
            { id: 'jsonpatch', label: '⚙️ 2. Mutating & Validating Simulator', color: '#34d399' },
            { id: 'deadlock', label: '⚠️ 3. failurePolicy & Cluster Deadlock Trap', color: '#f87171' },
            { id: 'engines', label: '🛡️ 4. Custom Code vs Kyverno vs OPA', color: '#fbbf24' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '160px',
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

        {/* TAB 1: API SERVER PIPELINE */}
        {activeTab === 'lifecycle' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px' }}>
              Click any stage in the <code>kube-apiserver</code> pipeline to inspect its role and privileges:
            </div>

            {/* Pipeline Stage Buttons */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[
                { stage: 1, name: '1. AuthN & AuthZ', color: '#38bdf8' },
                { stage: 2, name: '2. Mutating Webhooks (First!)', color: '#a78bfa' },
                { stage: 3, name: '3. Schema Validation', color: '#fbbf24' },
                { stage: 4, name: '4. Validating Webhooks (Last!)', color: '#34d399' },
                { stage: 5, name: '5. Persist to etcd', color: '#2dd4bf' }
              ].map(s => (
                <button
                  key={s.stage}
                  onClick={() => setActiveStage(s.stage)}
                  style={{
                    flex: 1,
                    minWidth: '130px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: activeStage === s.stage ? `${s.color}25` : 'rgba(255,255,255,0.05)',
                    color: activeStage === s.stage ? s.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: activeStage === s.stage ? `0 0 0 1px ${s.color}` : 'none'
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Pipeline Visual Flow SVG */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 160" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="pipe-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Stage Blocks */}
                {[
                  { x: 10, label: 'kubectl apply', sub: 'Client Request', color: '#94a3b8', num: 0 },
                  { x: 160, label: 'AuthN & AuthZ', sub: 'Cert & RBAC check', color: '#38bdf8', num: 1 },
                  { x: 310, label: 'Mutating Hooks', sub: 'Can Patch YAML', color: '#a78bfa', num: 2 },
                  { x: 460, label: 'Schema Check', sub: 'OpenAPI Spec', color: '#fbbf24', num: 3 },
                  { x: 610, label: 'Validating Hooks', sub: 'Allow or Reject', color: '#34d399', num: 4 }
                ].map((b, i) => (
                  <g key={i}>
                    <rect
                      x={b.x}
                      y="40"
                      width="120"
                      height="70"
                      rx="8"
                      fill={activeStage === b.num ? `${b.color}35` : 'rgba(255,255,255,0.04)'}
                      stroke={activeStage === b.num ? b.color : 'rgba(255,255,255,0.15)'}
                      strokeWidth={activeStage === b.num ? 2 : 1}
                    />
                    <text x={b.x + 60} y="68" textAnchor="middle" fill={activeStage === b.num ? b.color : 'var(--ifm-color-content)'} fontSize="11" fontWeight="700">
                      {b.label}
                    </text>
                    <text x={b.x + 60} y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">
                      {b.sub}
                    </text>

                    {i < 4 && (
                      <path
                        d={`M ${b.x + 120} 75 L ${b.x + 160} 75`}
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="interactive-diagram-flowing-path"
                        markerEnd="url(#pipe-arrow)"
                      />
                    )}
                  </g>
                ))}

                {/* Final etcd Block */}
                <path d="M 730 75 L 755 75" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#pipe-arrow)" />
                <rect
                  x="755"
                  y="40"
                  width="40"
                  height="70"
                  rx="6"
                  fill={activeStage === 5 ? 'rgba(45,212,191,0.3)' : 'rgba(45,212,191,0.1)'}
                  stroke="#2dd4bf"
                  strokeWidth="1.5"
                />
                <text x="775" y="72" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="700">etcd</text>
                <text x="775" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">DB</text>
              </svg>
            </div>

            {/* Stage Description Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: activeStage === 1 ? '#38bdf8' : activeStage === 2 ? '#a78bfa' : activeStage === 3 ? '#fbbf24' : activeStage === 4 ? '#34d399' : '#2dd4bf', marginBottom: '6px' }}>
                {activeStage === 1 && 'Stage 1: Authentication (AuthN) & Authorization (AuthZ)'}
                {activeStage === 2 && 'Stage 2: Mutating Admission Webhooks (Runs FIRST!)'}
                {activeStage === 3 && 'Stage 3: Object Schema & OpenAPI Validation'}
                {activeStage === 4 && 'Stage 4: Validating Admission Webhooks (Runs LAST!)'}
                {activeStage === 5 && 'Stage 5: Committed to etcd & Scheduler Notification'}
              </div>

              <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--ifm-color-content-secondary)' }}>
                {activeStage === 1 && (
                  <p style={{ margin: 0 }}>
                    Kube-apiserver verifies the client’s TLS certificate, OIDC bearer token, or ServiceAccount JWT, and checks RBAC permissions (Role/ClusterRole) to verify whether the actor has permission to create or modify the requested resource.
                  </p>
                )}
                {activeStage === 2 && (
                  <div>
                    <p style={{ margin: '0 0 6px 0' }}>
                      <strong>Why it runs first:</strong> Mutating webhooks can <em>modify (patch)</em> the object manifest before it is verified!
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Key Capabilities:</strong> Automatically injects sidecar containers (e.g., Istio Envoy, HashiCorp Vault Agent, Datadog/OpenTelemetry tracer), sets default memory/CPU requests, and injects organizational labels. If a webhook modifies the object, Kubernetes may re-run previous mutating webhooks up to an internal limit to ensure consistency.
                    </p>
                  </div>
                )}
                {activeStage === 3 && (
                  <p style={{ margin: 0 }}>
                    Kubernetes verifies that the resource conforms to its structural OpenAPI schema. If a mutating webhook injected an invalid field or malformed YAML property, the request fails right here with a schema validation error.
                  </p>
                )}
                {activeStage === 4 && (
                  <div>
                    <p style={{ margin: '0 0 6px 0' }}>
                      <strong>Why it runs last:</strong> Validating webhooks are strictly <em>read-only</em>. They observe the <em>final, fully-mutated state</em> of the object.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Key Capabilities:</strong> Performs policy enforcement. Can approve (<code>allowed: true</code>) or reject (<code>allowed: false</code>) the request with a human-readable 403 Forbidden message displayed directly in developer terminal. E.g., blocks images with <code>:latest</code> tag, disallows root users, or enforces corporate naming conventions.
                    </p>
                  </div>
                )}
                {activeStage === 5 && (
                  <p style={{ margin: 0 }}>
                    Once validated, the object is atomically written to <code>etcd</code>. The Controller Manager and Scheduler observe the new object via watch streams and commence Pod provisioning.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIMULATOR */}
        {activeTab === 'jsonpatch' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[
                { id: 'sidecar', label: '1. Sidecar Injection (Mutating)', type: 'Mutate' },
                { id: 'limits', label: '2. Default Limits Injection (Mutating)', type: 'Mutate' },
                { id: 'reject_latest', label: '3. Block :latest Tag (Validating)', type: 'Validate' },
                { id: 'root_check', label: '4. Block Root Container (Validating)', type: 'Validate' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSimScenario(s.id as any)}
                  style={{
                    flex: 1,
                    minWidth: '170px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: simScenario === s.id ? (s.type === 'Mutate' ? 'rgba(167,139,250,0.2)' : 'rgba(248,113,113,0.2)') : 'rgba(255,255,255,0.04)',
                    color: simScenario === s.id ? (s.type === 'Mutate' ? '#a78bfa' : '#f87171') : 'var(--ifm-color-content-secondary)',
                    boxShadow: simScenario === s.id ? `0 0 0 1px ${s.type === 'Mutate' ? '#a78bfa' : '#f87171'}` : 'none'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Split Manifest Preview */}
            <div className="webhook-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              {/* Left: Input YAML */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  Developer Submitted YAML (`kubectl apply`)
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
{simScenario === 'sidecar' && `apiVersion: v1
kind: Pod
metadata:
  name: payment-service
spec:
  containers:
    - name: payment-app
      image: company.registry/payment:v2.1`}
{simScenario === 'limits' && `apiVersion: v1
kind: Pod
metadata:
  name: batch-job
spec:
  containers:
    - name: worker
      image: company.registry/worker:v1.0
      # ⚠️ Developer forgot resource requests/limits!`}
{simScenario === 'reject_latest' && `apiVersion: v1
kind: Pod
metadata:
  name: insecure-app
spec:
  containers:
    - name: web
      image: docker.io/library/nginx:latest
      # ❌ Prohibited :latest tag on Production`}
{simScenario === 'root_check' && `apiVersion: v1
kind: Pod
metadata:
  name: root-app
spec:
  containers:
    - name: server
      image: company.registry/server:v1
      securityContext:
        runAsUser: 0 # ❌ Running as root!`}
                </pre>
              </div>

              {/* Right: Webhook Response */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: simScenario.startsWith('reject') || simScenario === 'root_check' ? '#f87171' : '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  {simScenario.startsWith('reject') || simScenario === 'root_check' ? '❌ Validating Webhook Rejection (403 Forbidden)' : '✅ Mutating Webhook RFC 6902 JSONPatch Response'}
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: simScenario.startsWith('reject') || simScenario === 'root_check' ? '#fca5a5' : '#86efac' }}>
{simScenario === 'sidecar' && `{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "response": {
    "allowed": true,
    "patchType": "JSONPatch",
    "patch": "[Base64-encoded: adds Envoy sidecar container & cert volume]"
  }
}`}
{simScenario === 'limits' && `{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "response": {
    "allowed": true,
    "patchType": "JSONPatch",
    "patch": "[Base64-encoded: sets resources.limits.cpu=500m, memory=512Mi]"
  }
}`}
{simScenario === 'reject_latest' && `{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "response": {
    "allowed": false,
    "status": {
      "code": 403,
      "message": "Error from server (Forbidden): Pod 'insecure-app' denied: image 'nginx:latest' uses forbidden ':latest' tag!"
    }
  }
}`}
{simScenario === 'root_check' && `{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "response": {
    "allowed": false,
    "status": {
      "code": 403,
      "message": "Error from server (Forbidden): Container 'server' must set securityContext.runAsNonRoot: true"
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CLUSTER DEADLOCK TRAP */}
        {activeTab === 'deadlock' && (
          <div>
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                💥 The Dreaded failurePolicy: Fail Cluster Reboot Deadlock
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
                If you set <code>failurePolicy: Fail</code> on a webhook intercepting Pods, and host that webhook server on the same Kubernetes cluster without namespace filtering:
                <br />
                <strong>Node Reboot ➔ Kube-apiserver tries to spin up Webhook Pod ➔ API server sends webhook request to Webhook Pod ➔ Webhook Pod is not running yet ➔ API call fails ➔ Webhook Pod CANNOT BE CREATED! ➔ CLUSTER DEADLOCK!</strong>
              </div>
            </div>

            <div className="webhook-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              {/* Dangerous configuration */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  ❌ Unsafe: Global Interception Without namespaceSelector
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, color: '#fca5a5' }}>
{`webhooks:
  - name: policy.company.com
    failurePolicy: Fail
    rules:
      - apiGroups: [""]
        resources: ["pods"]
        operations: ["CREATE"]
    # ⚠️ Missing namespaceSelector! Intercepts everything`}
                </pre>
              </div>

              {/* Safe configuration */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  ✅ Production Safe: Exclude Critical Control Plane Namespaces
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, color: '#86efac' }}>
{`webhooks:
  - name: policy.company.com
    failurePolicy: Fail
    namespaceSelector:
      matchExpressions:
        - key: kubernetes.io/metadata.name
          operator: NotIn
          values: ["kube-system", "security-tools"]`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ENGINES COMPARISON */}
        {activeTab === 'engines' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                  Custom Webhook (Go / Java)
                </div>
                <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '8px' }}>Pure Code Flexibility</div>
                <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '14px', lineHeight: '1.5' }}>
                  <li>Max performance and custom business logic (e.g. database lookups).</li>
                  <li>Requires building & maintaining container images, TLS certs, and web server.</li>
                  <li>Best for complex dynamic mutations (e.g., custom sidecar inject algorithms).</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                  Kyverno (Kubernetes Native)
                </div>
                <div style={{ fontSize: '10px', color: '#34d399', marginBottom: '8px' }}>Zero-Code YAML Policies</div>
                <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '14px', lineHeight: '1.5' }}>
                  <li>Policies declared purely in standard Kubernetes YAML CRDs (<code>ClusterPolicy</code>).</li>
                  <li>No learning curve: uses native K8s YAML syntax (no Rego language).</li>
                  <li>Supports Validation, Mutation, and Resource Generation.</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                  OPA Gatekeeper (Open Policy Agent)
                </div>
                <div style={{ fontSize: '10px', color: '#fbbf24', marginBottom: '8px' }}>Declarative Rego Engine</div>
                <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '14px', lineHeight: '1.5' }}>
                  <li>Industry standard for enterprise compliance and cross-cloud policy audits.</li>
                  <li>Uses <code>Rego</code> domain-specific language for deep inspection.</li>
                  <li>Supports complex multi-object queries and audit logging.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
