import React, { useState } from 'react';

const CDR_STEPS = [
  {
    id: 1,
    actor: 'Consumer & ADR App',
    title: '1. Consent Request',
    desc: 'Consumer requests financial insights in Fintech App (ADR). App requests consent to read account & transaction data for 90 days.'
  },
  {
    id: 2,
    actor: 'CDR Register (ACCC)',
    title: '2. Participant Verification',
    desc: 'ADR App verifies Data Holder (DH Bank) endpoints on ACCC Register using FAPI / mTLS certificates.'
  },
  {
    id: 3,
    actor: 'Data Holder Bank',
    title: '3. OAuth 2.0 / FAPI Authentication',
    desc: 'Consumer redirected to Data Holder Bank login page (OAuth 2.0 PKCE Code flow). Consumer authenticates via existing online banking credentials.'
  },
  {
    id: 4,
    actor: 'Consumer',
    title: '4. Consent Approval Dashboard',
    desc: 'Consumer selects specific accounts to share, reviews requested data scopes, and approves consent.'
  },
  {
    id: 5,
    actor: 'Data Holder -> ADR',
    title: '5. Access Token Issued',
    desc: 'Data Holder issues short-lived Access Token & Refresh Token bound to ADR certificate.'
  },
  {
    id: 6,
    actor: 'ADR -> CDR API',
    title: '6. Standardized Data Fetch',
    desc: 'ADR calls GET /banking/accounts and GET /banking/accounts/{id}/transactions endpoints. Returns structured JSON.'
  }
];

export default function BankingOpenBankingCdrDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [stateTab, setStateTab] = useState<'flow' | 'state' | 'payload'>('flow');

  const currStep = CDR_STEPS.find(s => s.id === activeStep)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .cdr-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Open Banking Consumer Data Right (CDR) FAPI & Consent Architecture
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'flow', label: '🔄 FAPI Consent Authentication Flow', color: '#a78bfa' },
            { id: 'state', label: '📊 Consent Lifecycle State Machine', color: '#38bdf8' },
            { id: 'payload', label: '📄 CDR REST API Payload Inspector', color: '#34d399' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setStateTab(t.id as any)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: stateTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: stateTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: stateTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: FAPI Flow */}
        {stateTab === 'flow' && (
          <div className="cdr-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT CONSENT STAGE:
              </div>

              {CDR_STEPS.map(s => {
                const isSel = s.id === activeStep;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: isSel ? '#a78bfa' : 'var(--ifm-color-content)' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                        Actor: {s.actor}
                      </div>
                    </div>

                    <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700 }}>Inspect ➔</span>
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-purple" style={{ minHeight: '280px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '8px' }}>
                FAPI Protocol Stage Detail
              </div>

              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {currStep.title}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
                {currStep.desc}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>CDR Security Standard</div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                  Financial-grade API (FAPI 1.0 Advanced) • OAuth 2.0 PKCE • TLS 1.3
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Consent State Machine */}
        {stateTab === 'state' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              Under Australian CDR legislation, consumer consent follows a strict, stateful lifecycle. Consumers retain full right of revocation at any time.
            </div>

            <div className="cdr-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              {[
                { title: 'PENDING', desc: 'Consumer redirected to bank for authentication.', color: '#fbbf24' },
                { title: 'ACTIVE', desc: 'Consent approved. ADR calls APIs for up to 90 days.', color: '#34d399' },
                { title: 'EXPIRED', desc: 'Max duration (90 days) elapsed. Auto-stopped.', color: '#a78bfa' },
                { title: 'REVOKED', desc: 'Consumer manually revoked via Banking App.', color: '#f87171' }
              ].map((st, idx) => (
                <div key={idx} style={{ background: `${st.color}15`, border: `1px solid ${st.color}40`, borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: st.color }}>{st.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{st.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Payload Inspector */}
        {stateTab === 'payload' && (
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
              GET /cdr-au/v1/banking/accounts/12345/transactions Response Schema (JSON):
            </div>
            <pre style={{ margin: 0, color: '#38bdf8', fontSize: '11px', overflowX: 'auto', lineHeight: 1.4 }}>
{`{
  "data": {
    "transactions": [
      {
        "accountId": "12345678",
        "transactionId": "TXN-20260803-991",
        "type": "PAYMENT",
        "status": "POSTED",
        "description": "NPP Osko Payment from Alex Mercer",
        "amount": "500.00",
        "currency": "AUD",
        "postingDateTime": "2026-08-03T13:17:00+10:00",
        "reference": "Rent for June"
      }
    ]
  },
  "links": { "self": "https://api.bank.com.au/cdr-au/v1/banking/accounts/12345/transactions" }
}`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
