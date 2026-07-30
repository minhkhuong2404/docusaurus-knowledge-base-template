import React, { useState } from 'react';

export default function CapabilitiesSpectrumDiagram() {
  const [selectedStage, setSelectedStage] = useState<number>(4);

  const stages = [
    {
      id: 1, name: '1. Reverse Proxy Only',
      desc: 'Single monolith behind Nginx/Caddy. Provides TLS termination and static file caching.',
      bestFor: 'Single application server, simple monolithic deployments.',
      tools: 'Nginx, Caddy, HAProxy',
      color: '#38bdf8'
    },
    {
      id: 2, name: '2. Reverse Proxy + L4 LB',
      desc: 'AWS NLB distributes raw TCP connections to an Nginx cluster. High throughput, zero HTTP path routing.',
      bestFor: 'Scaling raw TCP connections (millions/sec) without path routing.',
      tools: 'AWS NLB + Nginx',
      color: '#34d399'
    },
    {
      id: 3, name: '3. L7 LB Path Routing',
      desc: 'AWS ALB routes requests by URL path (/api/users vs /api/orders) to separate target groups.',
      bestFor: 'Simple microservices without complex JWT validation or rate-limiting requirements.',
      tools: 'AWS ALB, HAProxy HTTP',
      color: '#a78bfa'
    },
    {
      id: 4, name: '4. Full Stack: L4 LB + Gateway',
      desc: 'AWS NLB -> API Gateway (Kong / Spring Cloud) -> Microservices. Handles JWT auth, per-client rate limits, and service discovery.',
      bestFor: 'Production enterprise microservices platform (Gold Standard).',
      tools: 'AWS NLB + Kong / Spring Cloud Gateway',
      color: '#fbbf24'
    },
    {
      id: 5, name: '5. Service Mesh + Gateway',
      desc: 'API Gateway handles North-South traffic (Client -> Cluster). Istio sidecars handle East-West traffic (mTLS between services inside cluster).',
      bestFor: 'Kubernetes multi-service clusters requiring zero-trust mTLS and distributed tracing.',
      tools: 'Kong Gateway + Istio / Linkerd',
      color: '#2dd4bf'
    }
  ];

  const current = stages.find(s => s.id === selectedStage)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Architectural Spectrum — Topologies 1 through 5</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '16px', alignItems: 'start' }} className="spectrum-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .spectrum-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Stage Selector List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {stages.map(st => {
            const isSelected = selectedStage === st.id;
            return (
              <button key={st.id} onClick={() => setSelectedStage(st.id)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: isSelected ? `${st.color}15` : 'rgba(255,255,255,0.03)',
                boxShadow: isSelected ? `0 0 0 1.5px ${st.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.2s'
              }}>
                <span style={{ fontSize: '12px', color: isSelected ? st.color : '#e2e8f0', fontWeight: isSelected ? 'bold' : 'normal' }}>
                  {st.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: `${current.color}40` }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: current.color }}>{current.name}</h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#e2e8f0', marginTop: '8px' }}>
            {current.desc}
          </p>

          <div style={{ fontSize: '11.5px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
            <div style={{ color: '#34d399', marginBottom: '4px' }}>🎯 <strong>Best For:</strong> {current.bestFor}</div>
            <div style={{ color: '#fbbf24' }}>🛠️ <strong>Common Tools:</strong> {current.tools}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
