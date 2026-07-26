import React, { useState } from 'react';

export default function LaunchDarklyRelayProxyDiagram() {
  const [activeStep, setActiveStep] = useState<number>(1);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/>
          <line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span>LaunchDarkly Relay Proxy &amp; In-Memory Evaluation Architecture</span>
      </div>

      {/* Interactive Step Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 1, label: '1. Persistent SSE Stream (CDN → Relay Proxy)' },
          { id: 2, label: '2. Local Pod RAM Sync' },
          { id: 3, label: '3. In-Memory Evaluation (<10µs)' },
          { id: 4, label: '4. Redis Offline Fallback' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStep(s.id)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700,
              background: activeStep === s.id ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeStep === s.id ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeStep === s.id ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Topology Diagram */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.3fr 1.5fr 0.3fr 1.5fr', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: activeStep === 1 ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.08)', border: '1.5px solid #38bdf8', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>LaunchDarkly SaaS</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Global CDN Rules Engine</div>
          </div>

          <div style={{ fontSize: '16px', color: '#38bdf8', fontWeight: 800 }}>⇒</div>

          <div style={{ background: activeStep === 2 || activeStep === 4 ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.08)', border: '1.5px solid #34d399', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>K8s Relay Proxy</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Local Cluster Hub + Redis</div>
          </div>

          <div style={{ fontSize: '16px', color: '#34d399', fontWeight: 800 }}>⇒</div>

          <div style={{ background: activeStep === 3 ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.08)', border: '1.5px solid #fbbf24', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>Spring Boot Pod</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>LDClient In-RAM Engine</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {activeStep === 1 && <span><strong>1. Persistent SSE Stream:</strong> On startup, Relay Proxy maintains a single long-lived Server-Sent Events HTTP connection to LaunchDarkly's SaaS. Flag updates stream down instantly.</span>}
        {activeStep === 2 && <span><strong>2. Local Pod RAM Sync:</strong> Microservice pods connect to the Relay Proxy over the internal Kubernetes network, downloading rule definitions directly into JVM memory.</span>}
        {activeStep === 3 && <span><strong>3. In-Memory Evaluation (&lt;10µs):</strong> Code calls <code>ldClient.boolVariation("flag", context)</code>. Evaluation runs entirely inside RAM in microseconds with <strong>zero external network calls</strong> per user request.</span>}
        {activeStep === 4 && <span><strong>4. Redis Offline Resilience:</strong> If external internet connectivity to LaunchDarkly is cut, Relay Proxy serves flag rules from local Redis storage, ensuring zero downtime.</span>}
      </div>
    </div>
  );
}
