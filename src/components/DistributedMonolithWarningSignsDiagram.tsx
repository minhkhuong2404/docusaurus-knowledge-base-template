import React, { useState } from 'react';

export default function DistributedMonolithWarningSignsDiagram() {
  const [activeTab, setActiveTab] = useState<'anti' | 'clean'>('anti');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Distributed Monolith Anti-Pattern Inspector</span>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('anti')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: activeTab === 'anti' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'anti' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'anti' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ❌ Distributed Monolith (Anti-Pattern)
        </button>
        <button
          onClick={() => setActiveTab('clean')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: activeTab === 'clean' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'clean' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'clean' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✅ Event-Driven Decoupled Microservices
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        {activeTab === 'anti' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1.5px solid #f87171', padding: '10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, color: '#f87171' }}>Service A</div>
              <div style={{ color: '#f87171', fontSize: '14px' }}>→ Sync HTTP →</div>
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1.5px solid #f87171', padding: '10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, color: '#f87171' }}>Service B</div>
              <div style={{ color: '#f87171', fontSize: '14px' }}>→ Sync HTTP →</div>
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1.5px solid #f87171', padding: '10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, color: '#f87171' }}>Service C</div>
              <div style={{ color: '#f87171', fontSize: '14px' }}>→ DB Lock →</div>
              <div style={{ background: 'rgba(248,113,113,0.2)', border: '1.5px dashed #f87171', padding: '10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, color: '#f87171' }}>Shared DB</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.3)', fontSize: '11.5px', color: '#f87171' }}>
                ⚠️ <strong>1. Synchronous Chains:</strong> One slow service C blocks threads in B and A, causing system-wide outage.
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.3)', fontSize: '11.5px', color: '#f87171' }}>
                ⚠️ <strong>2. Shared DB Schema:</strong> Schema changes in Service A break queries in Service B. Lockstep releases required.
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1.5px solid #38bdf8', padding: '10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, color: '#38bdf8' }}>Service A</div>
              <div style={{ color: '#34d399', fontSize: '14px' }}>→ Async Event →</div>
              <div style={{ background: 'rgba(52,211,153,0.15)', border: '1.5px solid #34d399', padding: '10px 16px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>Kafka Broker</div>
              <div style={{ color: '#34d399', fontSize: '14px' }}>→ Consume →</div>
              <div style={{ background: 'rgba(251,191,36,0.1)', border: '1.5px solid #fbbf24', padding: '10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, color: '#fbbf24' }}>Service B</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(52,211,153,0.3)', fontSize: '11.5px', color: '#34d399' }}>
                ✅ <strong>1. Temporal Decoupling:</strong> If Service B is down, events buffer safely in Kafka. Service A remains 100% available.
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(52,211,153,0.3)', fontSize: '11.5px', color: '#34d399' }}>
                ✅ <strong>2. Database Isolation:</strong> Each service owns its private database. Deployments occur 100% independently.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
