import React, { useState } from 'react';

export default function SeniorArchitectureDeepDiveDiagram() {
  const [activeTab, setActiveTab] = useState<'tls' | 'antipattern' | 'wizard'>('tls');
  const [tlsOption, setTlsOption] = useState<'a' | 'b' | 'c'>('b');
  const [wizardAnswer, setWizardAnswer] = useState<string>('gateway');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span>Senior Architecture Reference & Decision Wizard</span>

        {/* Tab Controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setActiveTab('tls')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'tls' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'tls' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'tls' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            TLS Strategies
          </button>
          <button onClick={() => setActiveTab('antipattern')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'antipattern' ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'antipattern' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'antipattern' ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Anti-Pattern
          </button>
          <button onClick={() => setActiveTab('wizard')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'wizard' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'wizard' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'wizard' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Decision Wizard
          </button>
        </div>
      </div>

      {activeTab === 'tls' && (
        <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '16px', alignItems: 'start' }} className="senior-grid">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .senior-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}} />

          {/* TLS Strategy selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setTlsOption('a')} style={{
              padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: tlsOption === 'a' ? '#38bdf818' : 'rgba(255,255,255,0.03)',
              boxShadow: tlsOption === 'a' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.06)'
            }}>
              <strong style={{ fontSize: '12px', color: '#38bdf8' }}>Option A: Terminate at L4 NLB</strong>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Offloads crypto from Gateway. HTTP plain internally in VPC.</div>
            </button>

            <button onClick={() => setTlsOption('b')} style={{
              padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: tlsOption === 'b' ? '#34d39918' : 'rgba(255,255,255,0.03)',
              boxShadow: tlsOption === 'b' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.06)'
            }}>
              <strong style={{ fontSize: '12px', color: '#34d399' }}>Option B: Terminate at Gateway (Gold Standard)</strong>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>NLB TCP passthrough. Gateway handles full TLS certificate policy.</div>
            </button>

            <button onClick={() => setTlsOption('c')} style={{
              padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: tlsOption === 'c' ? '#a78bfa18' : 'rgba(255,255,255,0.03)',
              boxShadow: tlsOption === 'c' ? '0 0 0 1.5px #a78bfa50' : '0 0 0 1px rgba(255,255,255,0.06)'
            }}>
              <strong style={{ fontSize: '12px', color: '#a78bfa' }}>Option C: End-to-End mTLS</strong>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Zero-trust encryption directly to pods (PCI DSS / HIPAA).</div>
            </button>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: tlsOption === 'b' ? '#34d39940' : '#38bdf840' }}>
            <div className="interactive-diagram-card-header">
              <h3>Strategy Tradeoffs</h3>
            </div>
            <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '8px' }}>
              {tlsOption === 'a' && 'Option A: High CPU efficiency at gateway layer, but internal HTTP traffic flows in plaintext between NLB and Gateway.'}
              {tlsOption === 'b' && 'Option B: Most common production pattern. Gateway inspects SNI headers and applies granular TLS policies without exposing plaintext outside VPC.'}
              {tlsOption === 'c' && 'Option C: Zero-trust architecture. Mandatory for regulated banking & PCI DSS standards. Handled automatically via Service Mesh mTLS sidecars.'}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'antipattern' && (
        <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px' }} className="senior-grid">
          <div className="interactive-diagram-details-card" style={{ borderColor: '#f8717140' }}>
            <h4 style={{ color: '#f87171', margin: '0 0 6px 0', fontSize: '13px' }}>❌ Gateway Monolith Anti-Pattern</h4>
            <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
              Writing domain business rules (e.g. calculating loyalty points or tier discounts) inside gateway plugins creates tight coupling and breaks domain boundaries.
            </p>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
            <h4 style={{ color: '#34d399', margin: '0 0 6px 0', fontSize: '13px' }}>✅ Domain-Agnostic Gateway Boundary</h4>
            <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
              The gateway strictly enforces domain-agnostic perimeter concerns: JWT token validation, IP rate-limiting, and path routing. Business rules stay in services!
            </p>
          </div>
        </div>
      )}

      {activeTab === 'wizard' && (
        <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: '#34d399' }}>Component Selection Wizard</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0' }}>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="wizard" value="rp" checked={wizardAnswer === 'rp'} onChange={e => setWizardAnswer(e.target.value)} />
              Single server monolith needing TLS & static asset serving
            </label>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="wizard" value="l4" checked={wizardAnswer === 'l4'} onChange={e => setWizardAnswer(e.target.value)} />
              Scaling raw TCP connections (millions/sec) across instances
            </label>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="wizard" value="gateway" checked={wizardAnswer === 'gateway'} onChange={e => setWizardAnswer(e.target.value)} />
              Microservices platform needing JWT auth, per-client rate limits & routing
            </label>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="wizard" value="mesh" checked={wizardAnswer === 'mesh'} onChange={e => setWizardAnswer(e.target.value)} />
              Internal service-to-service zero-trust mTLS & automatic tracing
            </label>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', marginTop: '8px' }}>
            <strong style={{ color: '#34d399', fontSize: '12px' }}>Recommended Architecture Component:</strong>
            <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
              {wizardAnswer === 'rp' && '🛡️ Reverse Proxy (Nginx / Caddy)'}
              {wizardAnswer === 'l4' && '⚖️ Layer 4 Load Balancer (AWS NLB)'}
              {wizardAnswer === 'gateway' && '🚪 API Gateway (Kong / Spring Cloud Gateway)'}
              {wizardAnswer === 'mesh' && '🕸️ Service Mesh (Istio / Linkerd Sidecars)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
