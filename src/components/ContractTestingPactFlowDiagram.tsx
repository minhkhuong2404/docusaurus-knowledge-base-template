import React, { useState } from 'react';

interface PactStep {
  id: number;
  title: string;
  actor: string;
  badge: string;
  color: string;
  action: string;
  details: string;
}

const PACT_STEPS: PactStep[] = [
  {
    id: 1,
    title: '1. Consumer Defines Expectation',
    actor: 'Order Service (Consumer)',
    badge: 'Unit Test Phase',
    color: '#38bdf8',
    action: 'Writes Pact unit test specifying expected path (/api/payments/charge), HTTP method, and response JSON schema.',
    details: 'Executes locally in consumer CI. Output: contract JSON artifact (e.g. order-service-payment-service.json).',
  },
  {
    id: 2,
    title: '2. Contract Published to Pact Broker',
    actor: 'Pact Broker (Central Repo)',
    badge: 'Artifact Publish',
    color: '#fbbf24',
    action: 'Consumer CI uploads the generated contract JSON to the shared Pact Broker instance with version tag v1.4.0.',
    details: 'The Pact Broker indexes the contract and marks it as "Pending Verification" by the Payment Service.',
  },
  {
    id: 3,
    title: '3. Provider Verification Test',
    actor: 'Payment Service (Provider)',
    badge: 'Provider CI Verification',
    color: '#34d399',
    action: 'Payment Service CI pulls contract from Pact Broker and replays requests against its local controllers with @State setup.',
    details: 'Verifies actual HTTP response status and field types match consumer expectations without running full E2E environments.',
  },
  {
    id: 4,
    title: '4. Deployment Guard (can-i-deploy)',
    actor: 'CI/CD Release Pipeline',
    badge: 'Production Gate',
    color: '#a78bfa',
    action: 'Pact Broker CLI runs `can-i-deploy --pacticipant order-service --version v1.4.0 --to-environment prod`.',
    details: 'If Provider has verified the contract → ✅ Deploy to Production. If verification failed or missing → ❌ Block CI Pipeline.',
  },
];

export default function ContractTestingPactFlowDiagram() {
  const [activeStep, setActiveStep] = useState<PactStep>(PACT_STEPS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>Consumer-Driven Contract Testing (Pact Flow) Interactive Lifecycle</span>
      </div>

      {/* Steps Navigation Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {PACT_STEPS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStep(s)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700,
              background: activeStep.id === s.id ? `${s.color}20` : 'rgba(255,255,255,0.04)',
              color: activeStep.id === s.id ? s.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeStep.id === s.id ? `0 0 0 1.5px ${s.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            Step {s.id}
          </button>
        ))}
      </div>

      {/* Visual Canvas */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.3fr 1.2fr 0.3fr 1.2fr', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: activeStep.id === 1 ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.08)', border: '1.5px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>Order Service</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Consumer</div>
          </div>

          <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 800 }}>➔</div>

          <div style={{ background: activeStep.id === 2 ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.08)', border: '2px solid #fbbf24', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>Pact Broker</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Contract JSON Index</div>
          </div>

          <div style={{ fontSize: '14px', color: '#34d399', fontWeight: 800 }}>➔</div>

          <div style={{ background: activeStep.id === 3 ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.08)', border: '1.5px solid #34d399', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>Payment Service</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Provider Verification</div>
          </div>
        </div>
      </div>

      {/* Step Detail Description */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${activeStep.color}50` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: activeStep.color }}>{activeStep.title}</span>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: `${activeStep.color}30`, color: activeStep.color, fontWeight: 700 }}>
            {activeStep.badge}
          </span>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5', marginBottom: '6px' }}>
          <strong>Action:</strong> {activeStep.action}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
          <strong>Execution Context:</strong> {activeStep.details}
        </div>
      </div>
    </div>
  );
}
