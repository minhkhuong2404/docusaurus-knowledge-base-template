import React, { useState } from 'react';

export default function ServiceDiscoveryDiagram() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    { step: 1, title: 'Step 1: Logical Name Request', desc: 'Request arrives for lb://order-service/v1/orders. Gateway queries Service Registry (Eureka/Consul/CoreDNS) by logical name.', color: '#38bdf8' },
    { step: 2, title: 'Step 2: Registry Resolution', desc: 'Service Registry returns array of healthy pod IP endpoints: [10.0.1.5:8080, 10.0.1.6:8080].', color: '#a78bfa' },
    { step: 3, title: 'Step 3: Client-Side Load Balancing', desc: 'Gateway chooses healthy instance 10.0.1.5:8080 via Round-Robin and forwards request.', color: '#34d399' }
  ];

  const current = steps[activeStep - 1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>Dynamic Service Discovery Handshake</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '16px', alignItems: 'start' }} className="sd-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .sd-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Step Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {steps.map(s => {
            const isSelected = activeStep === s.step;
            return (
              <button key={s.step} onClick={() => setActiveStep(s.step)} style={{
                padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: isSelected ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                boxShadow: isSelected ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.2s'
              }}>
                <strong style={{ fontSize: '12px', color: isSelected ? s.color : '#e2e8f0' }}>{s.title}</strong>
              </button>
            );
          })}
        </div>

        {/* Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: `${current.color}40` }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: current.color }}>{current.title}</h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#e2e8f0', marginTop: '8px' }}>
            {current.desc}
          </p>
        </div>
      </div>
    </div>
  );
}
