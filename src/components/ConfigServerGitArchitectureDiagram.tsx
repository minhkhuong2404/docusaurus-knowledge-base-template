import React, { useState } from 'react';

export default function ConfigServerGitArchitectureDiagram() {
  const [activeFlow, setActiveFlow] = useState<'fetch' | 'reload'>('fetch');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Spring Cloud Config Server Architecture &amp; Hot Reload Bus</span>
      </div>

      {/* Flow Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveFlow('fetch')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: activeFlow === 'fetch' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeFlow === 'fetch' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeFlow === 'fetch' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          📥 Startup Fetch Flow (Git → Config Server → Microservice)
        </button>
        <button
          onClick={() => setActiveFlow('reload')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: activeFlow === 'reload' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeFlow === 'reload' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeFlow === 'reload' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          🔥 Hot-Reload Flow (Webhook → Spring Cloud Bus → @RefreshScope)
        </button>
      </div>

      {/* Architecture Topology */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        {activeFlow === 'fetch' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>Git Repository (config-repo)</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>order-service-prod.yml</div>
            </div>
            <div style={{ fontSize: '16px', color: '#38bdf8' }}>→ Pull →</div>
            <div style={{ background: 'rgba(56,189,248,0.15)', border: '2px solid #38bdf8', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>Config Server (:8888)</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Serves resolved properties</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>POST /busrefresh Webhook</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>CI/CD Git push trigger</div>
            </div>
            <div style={{ fontSize: '16px', color: '#a78bfa' }}>→ Broadcast →</div>
            <div style={{ background: 'rgba(167,139,250,0.15)', border: '2px solid #a78bfa', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa' }}>Spring Cloud Bus (Kafka)</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>RefreshRemoteApplicationEvent</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {activeFlow === 'fetch' ? (
          <span><strong>Startup Initialization:</strong> On boot, microservices query Config Server at <code>http://config-server:8888</code> for profile-specific properties (e.g. <code>order-service-prod.yml</code>).</span>
        ) : (
          <span><strong>Zero-Downtime Hot Reload:</strong> Triggering <code>/actuator/busrefresh</code> publishes a refresh event to Kafka/RabbitMQ. All subscriber pods instantly refresh their <code>@RefreshScope</code> feature flags and timeouts without restarts.</span>
        )}
      </div>
    </div>
  );
}
