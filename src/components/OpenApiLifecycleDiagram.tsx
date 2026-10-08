import React, { useState } from 'react';

interface Stage {
  id: string;
  label: string;
  tool: string;
  color: string;
  gate: string;
  detail: string;
  command: string;
}

const STAGES: Stage[] = [
  {
    id: 'design',
    label: 'Design',
    tool: 'OpenAPI 3.1',
    color: '#38bdf8',
    gate: 'Review by API guild + consumers',
    detail: 'The spec is the contract and source of truth. Model resources, schemas, errors, security schemes, and examples BEFORE writing code. Consumers review via pull request.',
    command: 'openapi.yaml  (paths, components.schemas, securitySchemes)',
  },
  {
    id: 'lint',
    label: 'Lint',
    tool: 'Spectral',
    color: '#34d399',
    gate: 'Style guide rules pass (0 errors)',
    detail: 'Automated style guide: naming (kebab-case paths, camelCase fields), required descriptions, operationId uniqueness, 4xx/5xx problem responses, pagination parameters.',
    command: 'spectral lint openapi.yaml --ruleset .spectral.yaml --fail-severity=error',
  },
  {
    id: 'diff',
    label: 'Diff',
    tool: 'oasdiff',
    color: '#f87171',
    gate: 'No breaking changes vs. last release',
    detail: 'Compares the new spec with the published one. Flags removed fields, narrowed enums, new required request properties, changed types, removed responses. Breaking changes require a new major version.',
    command: 'oasdiff breaking published.yaml openapi.yaml --fail-on ERR',
  },
  {
    id: 'mock',
    label: 'Mock',
    tool: 'Prism',
    color: '#fbbf24',
    gate: 'Frontend/partners can integrate in parallel',
    detail: 'A mock server generated from the spec lets clients integrate before the backend exists. Prism can also run in proxy mode and validate real traffic against the contract.',
    command: 'prism mock openapi.yaml -p 4010',
  },
  {
    id: 'codegen',
    label: 'Codegen',
    tool: 'OpenAPI Generator',
    color: '#a78bfa',
    gate: 'Generated code compiles',
    detail: 'Generate server interfaces (so the controller cannot drift from the spec) and typed client SDKs. Keep generated code out of hand-edited files; regenerate on every spec change.',
    command: 'openapi-generator-cli generate -g spring -i openapi.yaml --additional-properties=interfaceOnly=true',
  },
  {
    id: 'contract',
    label: 'Contract Test',
    tool: 'Pact / Schemathesis',
    color: '#f97316',
    gate: 'Provider honours spec + consumer pacts',
    detail: 'Provider tests prove real responses match the schema (property-based fuzzing with Schemathesis). Consumer-driven contracts (Pact) prove providers do not break actual consumer expectations.',
    command: 'schemathesis run openapi.yaml --base-url http://localhost:8080 --checks all',
  },
  {
    id: 'publish',
    label: 'Publish',
    tool: 'Portal / Registry',
    color: '#2dd4bf',
    gate: 'Versioned artifact + changelog',
    detail: 'Publish the immutable spec version to a registry/developer portal (Redoc, Backstage, SwaggerHub), generate a changelog from the diff, announce deprecations with Sunset headers.',
    command: 'redocly build-docs openapi.yaml && git tag api-v1.4.0',
  },
];

const W = 82;
const GAP = 17;

export default function OpenApiLifecycleDiagram(): React.JSX.Element {
  const [active, setActive] = useState<string>('design');
  const current = STAGES.find((s) => s.id === active) ?? STAGES[0];
  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16v16H4z" />
            <path d="M8 9l-2 3 2 3M16 9l2 3-2 3M13 8l-2 8" />
          </svg>
          Design-First API Pipeline (click a stage)
        </h3>
      </div>
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 120" className="interactive-diagram-svg">
          <defs>
            <marker id="oa-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="context-stroke" />
            </marker>
          </defs>
          {STAGES.map((s, i) => {
            const x = 4 + i * (W + GAP);
            const isActive = s.id === active;
            return (
              <g key={s.id} onClick={() => setActive(s.id)} style={{ cursor: 'pointer' }}>
                <rect x={x} y="28" width={W} height="58" rx="7" fill={isActive ? 'rgba(255,255,255,0.07)' : '#0d0f1e'} stroke={s.color} strokeWidth={isActive ? 2.2 : 1.2} />
                <text x={x + W / 2} y="52" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10.5, fontWeight: 700, fill: s.color, textAnchor: 'middle' }}>{s.label}</text>
                <text x={x + W / 2} y="70" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 8, fill: '#94a3b8', textAnchor: 'middle' }}>{s.tool}</text>
                <text x={x + W / 2} y="20" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 8, fill: '#64748b', textAnchor: 'middle' }}>{`step ${i + 1}`}</text>
                {i < STAGES.length - 1 && (
                  <path className="interactive-diagram-flowing-path" d={`M ${x + W + 2} 57 L ${x + W + GAP - 3} 57`} stroke={s.color} strokeWidth="2" fill="none" markerEnd="url(#oa-arr)" />
                )}
              </g>
            );
          })}
          <text x="340" y="108" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 9, fill: '#94a3b8', textAnchor: 'middle' }}>Every stage is a CI gate: a failing stage blocks merge</text>
        </svg>
      </div>
      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: current.color, fontWeight: 700 }}>{current.label} · {current.tool}</p>
        <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{current.detail}</p>
        <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#e2e8f0' }}><strong>Gate:</strong> {current.gate}</p>
        <code style={{ display: 'block', fontSize: '0.74rem', color: '#e2e8f0', background: '#0c0e17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '6px 8px', overflowX: 'auto' }}>{current.command}</code>
      </div>
    </div>
  );
}
