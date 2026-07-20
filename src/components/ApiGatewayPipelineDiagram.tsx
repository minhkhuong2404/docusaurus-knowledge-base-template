import React, { useState } from 'react';

export default function ApiGatewayPipelineDiagram() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'responsibilities'>('pipeline');
  const [activeStage, setActiveStage] = useState<number>(1);
  const [simOutcome, setSimOutcome] = useState<'success' | 'auth_fail' | 'rate_limit'>('success');

  const stages = [
    { id: 1, title: '1. TLS & Edge Entry', desc: 'Decrypts TLS at edge and matches public host header.', color: '#38bdf8' },
    { id: 2, title: '2. Authentication (JWT / API Key)', desc: 'Validates JWT signature & expiration. Injects X-User-Id header for backend.', color: '#a78bfa' },
    { id: 3, title: '3. Authorization (RBAC / Scopes)', desc: 'Checks if validated user holds required scopes (e.g. ROLE_ADMIN).', color: '#f472b6' },
    { id: 4, title: '4. Rate Limiting (Token Bucket)', desc: 'Queries Redis token bucket. Short-circuits with HTTP 429 if client quota exceeded.', color: '#fbbf24' },
    { id: 5, title: '5. Request Rewriting & Routing', desc: 'Rewrites URL paths (/v1/orders -> /api/orders) and resolves target IP from Service Discovery.', color: '#34d399' },
    { id: 6, title: '6. Protocol Translation & BFF', desc: 'Translates REST JSON payload to internal gRPC or aggregates multiple parallel calls.', color: '#2dd4bf' }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span>API Gateway Pipeline & Filter Chain</span>

        {/* Tab selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setActiveTab('pipeline')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'pipeline' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'pipeline' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'pipeline' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Pipeline Execution
          </button>
          <button onClick={() => setActiveTab('responsibilities')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'responsibilities' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'responsibilities' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'responsibilities' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Core Responsibilities
          </button>
        </div>
      </div>

      {activeTab === 'pipeline' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '16px', alignItems: 'start' }} className="gw-grid">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .gw-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}} />

          {/* Stage Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontWeight: 'bold', marginBottom: '2px' }}>
              FILTER CHAIN PIPELINE STAGES:
            </div>
            {stages.map(st => {
              const isSelected = activeStage === st.id;
              return (
                <button key={st.id} onClick={() => setActiveStage(st.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                  borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: isSelected ? `${st.color}15` : 'rgba(255,255,255,0.03)',
                  boxShadow: isSelected ? `0 0 0 1.5px ${st.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '11.5px', color: isSelected ? st.color : '#e2e8f0', fontWeight: isSelected ? 'bold' : 'normal' }}>
                    {st.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stage Detail Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: `${stages[activeStage - 1].color}40` }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: stages[activeStage - 1].color }}>
                {stages[activeStage - 1].title}
              </h3>
            </div>
            <p style={{ fontSize: '12.5px', color: '#e2e8f0', marginTop: '8px' }}>
              {stages[activeStage - 1].desc}
            </p>

            <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px' }}>
                TEST PIPELINE SIMULATION OUTCOME:
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setSimOutcome('success')} style={{
                  padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
                  background: simOutcome === 'success' ? '#34d39920' : 'rgba(255,255,255,0.04)',
                  color: simOutcome === 'success' ? '#34d399' : '#94a3b8'
                }}>
                  200 Success
                </button>
                <button onClick={() => setSimOutcome('auth_fail')} style={{
                  padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
                  background: simOutcome === 'auth_fail' ? '#f8717120' : 'rgba(255,255,255,0.04)',
                  color: simOutcome === 'auth_fail' ? '#f87171' : '#94a3b8'
                }}>
                  401 Auth Fail
                </button>
                <button onClick={() => setSimOutcome('rate_limit')} style={{
                  padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
                  background: simOutcome === 'rate_limit' ? '#fbbf2420' : 'rgba(255,255,255,0.04)',
                  color: simOutcome === 'rate_limit' ? '#fbbf24' : '#94a3b8'
                }}>
                  429 Rate Limited
                </button>
              </div>

              <div style={{ fontSize: '11.5px', marginTop: '8px', padding: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.02)' }}>
                {simOutcome === 'success' && <span style={{ color: '#34d399' }}>🟢 Pipeline complete: Request routed to downstream service over gRPC.</span>}
                {simOutcome === 'auth_fail' && <span style={{ color: '#f87171' }}>🚨 Stage 2 Short-Circuit: Invalid JWT token → Returned HTTP 401 Unauthorized immediately.</span>}
                {simOutcome === 'rate_limit' && <span style={{ color: '#fbbf24' }}>⚠️ Stage 4 Short-Circuit: Redis bucket empty → Returned HTTP 429 Too Many Requests immediately.</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }} className="gw-grid">
          <div className="interactive-diagram-details-card" style={{ borderColor: '#38bdf840' }}>
            <h4 style={{ color: '#38bdf8', margin: '0 0 6px 0', fontSize: '13px' }}>1. Perimeter Auth & AuthZ</h4>
            <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
              Validates tokens ONCE at the gateway. Injects trusted headers (<code>X-User-Id</code>) so microservices don't re-verify JWTs.
            </p>
          </div>
          <div className="interactive-diagram-details-card" style={{ borderColor: '#fbbf2440' }}>
            <h4 style={{ color: '#fbbf24', margin: '0 0 6px 0', fontSize: '13px' }}>2. Global & Per-Route Rate Limiting</h4>
            <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
              Enforces Token Bucket quotas via Redis. Prevents DDoS attacks and protects downstream database pools.
            </p>
          </div>
          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
            <h4 style={{ color: '#34d399', margin: '0 0 6px 0', fontSize: '13px' }}>3. Dynamic Service Discovery</h4>
            <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
              Resolves logical service names (<code>lb://order-service</code>) via Eureka/Consul/K8s DNS without hardcoding IPs.
            </p>
          </div>
          <div className="interactive-diagram-details-card" style={{ borderColor: '#a78bfa40' }}>
            <h4 style={{ color: '#a78bfa', margin: '0 0 6px 0', fontSize: '13px' }}>4. Protocol & BFF Translation</h4>
            <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
              Translates client REST JSON calls to internal gRPC or aggregates 3 microservice calls into 1 dashboard payload.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
