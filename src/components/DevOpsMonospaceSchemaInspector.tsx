import React, { useState } from 'react';

const DEVOPS_SCHEMAS = [
  {
    id: 'docker_manifest',
    name: '1. OCI / Docker Image Manifest Schema (JSON)',
    spec: `{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
  "config": {
    "mediaType": "application/vnd.docker.container.image.v1+json",
    "size": 7023,
    "digest": "sha256:b5b205e5d55b772b234b9e2617f6964a49f"
  },
  "layers": [
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 32654,
      "digest": "sha256:e7c0107a3c422b52b51039982701"
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 16724,
      "digest": "sha256:4b4a1b0213b2d1"
    }
  ]
}`,
    fields: [
      { name: 'schemaVersion', type: 'Integer (2)', desc: 'Specifies Docker Manifest v2 structure format.' },
      { name: 'config digest', type: 'SHA256 Hash', desc: 'Points to container JSON config containing ENV, Entrypoint, and CMD.' },
      { name: 'layers digest', type: 'Array[Layer]', desc: 'Content-addressable SHA256 tar.gz diff layers pulled sequentially.' }
    ]
  },
  {
    id: 'k8s_spec',
    name: '2. Kubernetes Deployment Manifest Schema (YAML)',
    spec: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service-deployment
  labels:
    app: payment-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      containers:
      - name: payment-api
        image: payment-service:v2.4.1
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"`,
    fields: [
      { name: 'apiVersion & kind', type: 'String', desc: 'Identifies resource API group (apps/v1) and object type (Deployment).' },
      { name: 'replicas', type: 'Integer (3)', desc: 'Desired pod instance count maintained by K8s DeploymentController.' },
      { name: 'containerPort', type: 'Integer (8080)', desc: 'Port exposed by container inside pod network namespace.' }
    ]
  }
];

export default function DevOpsMonospaceSchemaInspector({ initialSchemaIdx = 0 }: { initialSchemaIdx?: number }): React.JSX.Element {
  const [selectedSchemaIdx, setSelectedSchemaIdx] = useState<number>(initialSchemaIdx);
  const [selectedFieldIdx, setSelectedFieldIdx] = useState<number>(0);

  const currSchema = DEVOPS_SCHEMAS[selectedSchemaIdx];
  const currField = currSchema.fields[selectedFieldIdx] || currSchema.fields[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .devops-schema-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          DevOps Container Image & Kubernetes Manifest Monospace Schema Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Schema Switcher Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {DEVOPS_SCHEMAS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => { setSelectedSchemaIdx(idx); setSelectedFieldIdx(0); }}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: selectedSchemaIdx === idx ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
                color: selectedSchemaIdx === idx ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                boxShadow: selectedSchemaIdx === idx ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Main Monospace Inspector Grid */}
        <div className="devops-schema-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '12px', overflowX: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              MANIFEST STRUCTURE (MONOSPACE)
            </div>
            <pre style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '11px', color: '#e2e8f0', lineHeight: 1.45, margin: 0, background: 'transparent' }}>
              {currSchema.spec}
            </pre>
          </div>

          <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '260px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
              SCHEMA FIELD INSPECTOR
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {currSchema.fields.map((f, idx) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFieldIdx(idx)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    background: selectedFieldIdx === idx ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                    color: selectedFieldIdx === idx ? '#090b14' : 'var(--ifm-color-content)'
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
              {currField.name}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
              DataType: {currField.type}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
              {currField.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
