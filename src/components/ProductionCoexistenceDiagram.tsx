import React, { useState } from 'react';

export default function ProductionCoexistenceDiagram() {
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'deployment'>('lifecycle');
  const [deployStep, setDeployStep] = useState<number>(1);

  const deploySteps = [
    { step: 1, title: 'Step 1: 100% Traffic to v1', v1Percent: 100, v2Percent: 0, desc: 'Normal production traffic operating on v1 instances.' },
    { step: 2, title: 'Step 2: Deploy v2 & Health Check', v1Percent: 100, v2Percent: 0, desc: 'v2 pods deployed into target group. Load balancer probes /actuator/health until 200 OK.' },
    { step: 3, title: 'Step 3: 10% Canary Traffic to v2', v1Percent: 90, v2Percent: 10, desc: '10% of incoming requests routed to v2 to monitor error rates and latency.' },
    { step: 4, title: 'Step 4: 50% / 50% Traffic Split', v1Percent: 50, v2Percent: 50, desc: '50% split as confidence grows. Continuous automated rollback checks active.' },
    { step: 5, title: 'Step 5: 100% Traffic to v2 & Connection Drain', v1Percent: 0, v2Percent: 100, desc: 'Full cutover! v1 instances enter connection draining (30s) before clean termination.' }
  ];

  const currentDeploy = deploySteps[deployStep - 1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
        </svg>
        <span>Production Enterprise Topology & Zero-Downtime Deployment</span>

        {/* Tab selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setActiveTab('lifecycle')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'lifecycle' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'lifecycle' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'lifecycle' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Request Lifecycle
          </button>
          <button onClick={() => setActiveTab('deployment')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'deployment' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'deployment' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'deployment' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Zero-Downtime Flow
          </button>
        </div>
      </div>

      {activeTab === 'lifecycle' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontWeight: 'bold' }}>
            EVERY ENTERPRISE SECURITY & ROUTING LAYER (EDGE TO PRIVATE VPC):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
            <div style={{ padding: '8px', borderRadius: '6px', background: '#38bdf815', border: '1px solid #38bdf840' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8' }}>1. Client & DNS</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Route 53 / Geo-routing</div>
            </div>
            <div style={{ padding: '8px', borderRadius: '6px', background: '#a78bfa15', border: '1px solid #a78bfa40' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#a78bfa' }}>2. WAF & CDN</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Cloudflare / AWS WAF</div>
            </div>
            <div style={{ padding: '8px', borderRadius: '6px', background: '#34d39915', border: '1px solid #34d39940' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}>3. L4 Load Balancer</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>AWS NLB (TCP passthrough)</div>
            </div>
            <div style={{ padding: '8px', borderRadius: '6px', background: '#fbbf2415', border: '1px solid #fbbf2440' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fbbf24' }}>4. API Gateway</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Kong / Spring Gateway</div>
            </div>
            <div style={{ padding: '8px', borderRadius: '6px', background: '#2dd4bf15', border: '1px solid #2dd4bf40' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2dd4bf' }}>5. Private VPC App</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Spring Boot / gRPC</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '16px', alignItems: 'start' }} className="coexist-grid">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .coexist-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}} />

          {/* Deployment Step Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {deploySteps.map(s => {
              const isSelected = deployStep === s.step;
              return (
                <button key={s.step} onClick={() => setDeployStep(s.step)} style={{
                  padding: '8px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: isSelected ? '#34d39918' : 'rgba(255,255,255,0.03)',
                  boxShadow: isSelected ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: '11.5px', color: isSelected ? '#34d399' : '#e2e8f0', fontWeight: 'bold' }}>
                    {s.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#34d399' }}>{currentDeploy.title}</h3>
            </div>

            <p style={{ fontSize: '12.5px', color: '#e2e8f0', marginTop: '8px' }}>
              {currentDeploy.desc}
            </p>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <span>Traffic to v1 (Old Pods):</span>
                <strong style={{ color: '#f87171' }}>{currentDeploy.v1Percent}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <span>Traffic to v2 (Canary Pods):</span>
                <strong style={{ color: '#34d399' }}>{currentDeploy.v2Percent}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
