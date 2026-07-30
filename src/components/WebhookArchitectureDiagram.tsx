import React, { useState } from 'react';

export default function WebhookArchitectureDiagram() {
  const [activeStep, setActiveStep] = useState<number>(1);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span>Receiving Webhooks at Scale — High-Throughput Asynchronous Architecture</span>
      </div>

      {/* Interactive Step Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 1, label: '1. Incoming Webhook POST' },
          { id: 2, label: '2. HMAC Verification Guard' },
          { id: 3, label: '3. Fast 200 OK & Kafka Queue' },
          { id: 4, label: '4. Async Consumer & Dedup' },
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

      {/* Topology Canvas */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: activeStep === 1 ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.08)', border: '1.5px solid #38bdf8', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>Event Provider</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Stripe / GitHub / Shopify</div>
          </div>

          <div style={{ background: activeStep === 2 ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.08)', border: '1.5px solid #fbbf24', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>Webhook Controller</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>HMAC Verification Guard</div>
          </div>

          <div style={{ background: activeStep === 3 ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.08)', border: '1.5px solid #34d399', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Kafka / SQS Topic</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Durable Buffer (&lt;20ms 200 OK)</div>
          </div>

          <div style={{ background: activeStep === 4 ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.08)', border: '1.5px solid #a78bfa', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#a78bfa' }}>Background Workers</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Idempotency + DB Write</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {activeStep === 1 && <span><strong>1. Incoming Event POST:</strong> The provider delivers a signed HTTP POST request containing raw JSON bytes and an <code>X-Signature-256</code> or <code>Stripe-Signature</code> header.</span>}
        {activeStep === 2 && <span><strong>2. Zero-Trust HMAC Guard:</strong> Spring Boot verifies the SHA-256 signature in constant-time before parsing JSON. Invalid signatures immediately return <code>401 Unauthorized</code> to block forged requests.</span>}
        {activeStep === 3 && <span><strong>3. Fast Response Pattern:</strong> To prevent provider timeouts (which trigger aggressive retries), the raw payload is enqueued into Kafka/SQS and an HTTP 200 OK is returned in <strong>&lt;20 milliseconds</strong>.</span>}
        {activeStep === 4 && <span><strong>4. Asynchronous Business Logic:</strong> Background workers consume from Kafka, check Redis/DB for duplicate <code>eventId</code>s (idempotency key), and perform heavyweight database updates or notification dispatches.</span>}
      </div>
    </div>
  );
}
