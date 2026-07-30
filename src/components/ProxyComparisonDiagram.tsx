import React, { useState } from 'react';

export default function ProxyComparisonDiagram() {
  const [activeTab, setActiveTab] = useState<'types' | 'pipeline'>('types');
  const [pipelineStep, setPipelineStep] = useState<number>(1);

  const pipelineSteps = [
    { step: 1, title: '1. TLS Termination', desc: 'Proxy receives HTTPS request on port 443, decrypts TLS using certificate, and handles TLS handshake at the edge.', color: '#38bdf8' },
    { step: 2, title: '2. Request Rewriting & Header Injection', desc: 'Injects X-Real-IP, X-Forwarded-For, and X-Forwarded-Proto headers so backends know the original client IP.', color: '#a78bfa' },
    { step: 3, title: '3. Cache Lookup', desc: 'Checks local cache (RAM/Disk) for requested URL path. If static file or valid TTL cache hit, returns directly without touching backend!', color: '#34d399' },
    { step: 4, title: '4. Internal Forwarding', desc: 'Forwards plain HTTP request across private VPC subnet (10.0.1.15:8080) to backend application server.', color: '#fbbf24' },
    { step: 5, title: '5. Response Compression & Return', desc: 'Compresses backend response (gzip / Brotli), injects security headers (HSTS, CSP), and returns to client over TLS.', color: '#2dd4bf' },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Reverse Proxy Architecture & Internal Pipeline</span>

        {/* Tab Controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('types')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: activeTab === 'types' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'types' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'types' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Forward vs. Reverse Proxy
          </button>
          <button onClick={() => setActiveTab('pipeline')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: activeTab === 'pipeline' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'pipeline' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'pipeline' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Internal Request Pipeline
          </button>
        </div>
      </div>

      {activeTab === 'types' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }} className="proxy-types-grid">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .proxy-types-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}} />

          {/* Forward Proxy Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: '#38bdf840' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#38bdf8' }}>Forward Proxy (Client-Side)</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
              Acts on behalf of the <strong>Client</strong>. Sits in front of clients to mask client IP addresses, enforce corporate egress filtering, or bypass geo-restrictions.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <code>Client ──► [ Forward Proxy (VPN) ] ──► Internet ──► Server</code>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 0 0' }}>
                The target server only sees the proxy's IP. The client's true identity is hidden.
              </p>
            </div>
          </div>

          {/* Reverse Proxy Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#34d399' }}>Reverse Proxy (Server-Side)</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
              Acts on behalf of the <strong>Server</strong>. Sits in front of private backend servers to terminate TLS, cache static files, compress responses, and hide internal network topology.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <code>Client ──► Internet ──► [ Reverse Proxy (Nginx) ] ──► Backend App</code>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 0 0' }}>
                The client only sees the proxy's address (api.company.com). Backend IPs remain in a private subnet.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '16px', alignItems: 'start' }} className="proxy-types-grid">
          {/* Step Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pipelineSteps.map(s => {
              const isSelected = pipelineStep === s.step;
              return (
                <button key={s.step} onClick={() => setPipelineStep(s.step)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                  borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: isSelected ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                  boxShadow: isSelected ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                  transition: 'all 0.2s ease'
                }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 'bold', color: s.color,
                    background: `${s.color}20`, width: '22px', height: '22px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {s.step}
                  </span>
                  <span style={{ fontSize: '12px', color: isSelected ? '#ffffff' : '#e2e8f0', fontWeight: isSelected ? 'bold' : 'normal' }}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Step Detail Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: `${pipelineSteps[pipelineStep - 1].color}40` }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: pipelineSteps[pipelineStep - 1].color }}>
                {pipelineSteps[pipelineStep - 1].title}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '10px' }}>
              {pipelineSteps[pipelineStep - 1].desc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
