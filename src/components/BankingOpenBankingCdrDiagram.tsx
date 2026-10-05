import React, { useState } from 'react';

interface CdrStep {
  id: number;
  actor: string;
  title: string;
  security: string;
  desc: string;
  flowFrom: string;
  flowTo: string;
  details: string[];
}

const CDR_STEPS: CdrStep[] = [
  {
    id: 1,
    actor: 'Consumer ➔ Fintech App (ADR)',
    title: '1. Consent Initiation & Scope Selection',
    security: 'Consumer Consent Directive (CDR Rules Part 4)',
    desc: 'The consumer requests financial management services in an Accredited Data Recipient (ADR) app. The consumer selects data clusters (Account Details, Balances, 36-Month Transaction History) and sets a 90-day sharing duration.',
    flowFrom: 'consumer',
    flowTo: 'adr',
    details: [
      'ADR presents explicit, unbundled consent dashboard per CDR Rules',
      'Clusters requested: Common Customer Data, Bank Accounts, Transaction Details',
      'Consent record created in ADR database in PENDING status'
    ]
  },
  {
    id: 2,
    actor: 'ADR ➔ ACCC CDR Register',
    title: '2. Dynamic Client Registration & Verification',
    security: 'FAPI 1.0 Advanced • Mutual TLS (mTLS) with CDR CA',
    desc: 'The ADR verifies the Data Holder bank endpoints against the official ACCC CDR Register. Mutual TLS authentication ensures both parties are licensed accredited participants under Australian federal law.',
    flowFrom: 'adr',
    flowTo: 'register',
    details: [
      'ADR presents X.509 certificate signed by ACCC Root CA',
      'ACCC Register validates ADR accreditation status (Unrestricted / Sponsored)',
      'Returns Data Holder (DH) OIDC Discovery document (.well-known/openid-configuration)'
    ]
  },
  {
    id: 3,
    actor: 'Consumer ➔ Data Holder Bank (DH)',
    title: '3. FAPI Hybrid / PKCE Authentication Flow',
    security: 'OAuth 2.0 PKCE • FAPI Private Key JWT • Direct Bank Login',
    desc: 'Consumer is redirected to the Data Holder bank secure portal. The consumer authenticates directly using existing banking credentials (MFA / Biometrics). The ADR NEVER sees or stores customer banking passwords.',
    flowFrom: 'consumer',
    flowTo: 'bank',
    details: [
      'Authorization code requested using PKCE code_challenge (S256)',
      'Strong Customer Authentication (SCA) via SMS OTP / Bank Mobile App Push',
      'Customer selects specific accounts to share (e.g. Transaction Account yes, Home Loan no)'
    ]
  },
  {
    id: 4,
    actor: 'Data Holder ➔ ADR App',
    title: '4. Token Issuance & Certificate Binding',
    security: 'RFC 8705 mTLS-Constrained Access Tokens • JARM Encrypted Response',
    desc: 'The Data Holder issues an Authorization Code via JWT Secured Authorization Response Mode (JARM). The ADR exchanges the code for a short-lived Access Token and Refresh Token bound to the ADR mTLS client certificate.',
    flowFrom: 'bank',
    flowTo: 'adr',
    details: [
      'Access Token lifetime: 10 minutes (strictly ephemeral)',
      'Token is cryptographically bound to ADR client certificate thumbprint (cnf claim)',
      'Refresh Token stored in hardware security module (HSM) with 90-day expiry'
    ]
  },
  {
    id: 5,
    actor: 'ADR ➔ CDR Resource API',
    title: '5. Standardized Resource Data Retrieval',
    security: 'REST JSON • CDR Specification v1.30.0 • x-v: 3',
    desc: 'The ADR calls standardized Data Holder Resource APIs. The bank validates the token, enforces consent boundaries, and returns structured financial JSON data for consumer analysis.',
    flowFrom: 'adr',
    flowTo: 'api',
    details: [
      'Calls GET /banking/accounts and GET /banking/accounts/{id}/transactions',
      'Bank validates active consent state, rate limits, and CDR API version header (x-v)',
      'Data streamed to ADR and sanitized according to privacy obligations'
    ]
  }
];

const CONSENT_STATES = [
  {
    name: 'PENDING',
    color: '#fbbf24',
    desc: 'Consent initiated by consumer. Awaiting bank authentication and explicit account confirmation.',
    sla: 'Expires in 1 hour if unconfirmed'
  },
  {
    name: 'ACTIVE',
    color: '#34d399',
    desc: 'Consent confirmed. ADR is authorized to access selected accounts for up to 90 days with automatic refresh.',
    sla: 'Max duration 365 days; default 90 days'
  },
  {
    name: 'REVOKED',
    color: '#f87171',
    desc: 'Consumer unilaterally revoked consent via Bank App or ADR settings. Takes effect immediately (< 5 mins).',
    sla: 'Immediate cessation of data access'
  },
  {
    name: 'EXPIRED',
    color: '#a78bfa',
    desc: 'Consent duration elapsed without renewal. Token automatically disabled; archived per record retention rules.',
    sla: 'Mandatory data deletion or de-identification'
  }
];

const DATA_SCOPES = [
  { code: 'bank:accounts.basic:read', name: 'Account Balances & Types', desc: 'Account numbers, BSB, nickname, product type, open/closed status.' },
  { code: 'bank:transactions:read', name: 'Transaction History', desc: '36 months of debits, credits, timestamps, merchant details, and descriptions.' },
  { code: 'bank:regular_payments:read', name: 'Direct Debits & PayTo', desc: 'Active direct debit authorisations and scheduled recurring biller mandates.' },
  { code: 'common:customer.basic:read', name: 'Customer Identity Data', desc: 'Full legal name, business ABN/ACN, and primary contact information.' }
];

export default function BankingOpenBankingCdrDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'flow' | 'states' | 'scopes'>('flow');
  const [activeStepId, setActiveStepId] = useState<number>(1);

  const currStep = CDR_STEPS.find(s => s.id === activeStepId) || CDR_STEPS[0];

  return (
    <div
      className="interactive-diagram-container"
      style={{
        fontFamily: 'var(--ifm-font-family-base)',
        backgroundColor: '#090b14',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '0',
        overflow: 'hidden',
        color: '#ffffff',
        marginBottom: '24px'
      }}
    >
      <style>{`
        @keyframes flowingDashCdr {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .anim-flowing-path-cdr {
          stroke-dasharray: 6 4;
          animation: flowingDashCdr 1.2s linear infinite;
        }
        @media (max-width: 768px) {
          .cdr-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 20px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0b0f19'
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#a78bfa', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em' }}>
            Open Banking & Consumer Data Right (CDR) Architecture
          </span>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>
            Australian Open Banking Standards: FAPI 1.0 Advanced, PKCE Authorization, and Consent Lifecycle
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ padding: '18px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'flow', label: '🔄 FAPI Consent & Authorization Pipeline', color: '#a78bfa' },
            { id: 'states', label: '📊 CDR Consent Lifecycle State Machine', color: '#38bdf8' },
            { id: 'scopes', label: '🛡️ Data Clusters & Permission Scopes', color: '#34d399' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}25` : 'rgba(255,255,255,0.03)',
                color: activeTab === t.id ? t.color : '#94a3b8',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ================= TAB 1: FAPI PIPELINE ================= */}
        {activeTab === 'flow' && (
          <div>
            {/* Step Selection Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {CDR_STEPS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveStepId(s.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: activeStepId === s.id ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.04)',
                    color: activeStepId === s.id ? '#a78bfa' : '#94a3b8',
                    boxShadow: activeStepId === s.id ? '0 0 0 1.5px #a78bfa' : '0 0 0 1px rgba(255,255,255,0.08)'
                  }}
                >
                  Step {s.id}: {s.title.split('. ')[1] || s.title}
                </button>
              ))}
            </div>

            {/* Split View: Visual SVG Topology + Detail Card */}
            <div className="cdr-split-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
              {/* Left Column: Visual Telemetry Flow */}
              <div
                style={{
                  backgroundColor: '#0d0f1e',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.05em' }}>
                    CDR FAPI 1.0 ADVANCED PROTOCOL TOPOLOGY
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(167,139,250,0.2)', color: '#a78bfa', fontWeight: 700 }}>
                    Step {activeStepId} of {CDR_STEPS.length}
                  </span>
                </div>

                <svg viewBox="0 0 600 240" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  <defs>
                    <pattern id="dot-grid-cdr" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.25" />
                    </pattern>
                    <marker id="arrow-cdr-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#a78bfa" />
                    </marker>
                    <marker id="arrow-cdr-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                    <marker id="arrow-cdr-mint" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                    </marker>
                  </defs>

                  <rect width="600" height="240" fill="url(#dot-grid-cdr)" rx="8" />

                  {/* Node 1: Consumer */}
                  <g transform="translate(20, 20)">
                    <rect width="120" height="60" rx="6" fill="#1e293b" stroke={activeStepId === 1 || activeStepId === 3 ? '#a78bfa' : '#475569'} strokeWidth="1.5" />
                    <text x="60" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Consumer</text>
                    <text x="60" y="42" textAnchor="middle" fill="#94a3b8" fontSize="9">End User Client</text>
                    <text x="60" y="52" textAnchor="middle" fill="#a78bfa" fontSize="8">Explicit Consent</text>
                  </g>

                  {/* Node 2: ADR Fintech */}
                  <g transform="translate(240, 20)">
                    <rect width="120" height="60" rx="6" fill="#1e293b" stroke={activeStepId === 1 || activeStepId === 2 || activeStepId === 4 || activeStepId === 5 ? '#38bdf8' : '#475569'} strokeWidth="1.5" />
                    <text x="60" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">ADR Fintech App</text>
                    <text x="60" y="42" textAnchor="middle" fill="#94a3b8" fontSize="9">Data Recipient</text>
                    <text x="60" y="52" textAnchor="middle" fill="#38bdf8" fontSize="8">mTLS Client</text>
                  </g>

                  {/* Node 3: ACCC Register */}
                  <g transform="translate(460, 20)">
                    <rect width="120" height="60" rx="6" fill="#1e293b" stroke={activeStepId === 2 ? '#fbbf24' : '#475569'} strokeWidth="1.5" />
                    <text x="60" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">ACCC CDR Register</text>
                    <text x="60" y="42" textAnchor="middle" fill="#94a3b8" fontSize="9">Regulatory PKI</text>
                    <text x="60" y="52" textAnchor="middle" fill="#fbbf24" fontSize="8">Trust Anchor</text>
                  </g>

                  {/* Node 4: Data Holder Bank Portal */}
                  <g transform="translate(130, 140)">
                    <rect width="140" height="60" rx="6" fill="#1e293b" stroke={activeStepId === 3 || activeStepId === 4 ? '#34d399' : '#475569'} strokeWidth="1.5" />
                    <text x="70" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Data Holder (Bank)</text>
                    <text x="70" y="42" textAnchor="middle" fill="#94a3b8" fontSize="9">OAuth PKCE Portal</text>
                    <text x="70" y="52" textAnchor="middle" fill="#34d399" fontSize="8">Direct Bank AuthN</text>
                  </g>

                  {/* Node 5: CDR Banking Resource API */}
                  <g transform="translate(370, 140)">
                    <rect width="140" height="60" rx="6" fill="#1e293b" stroke={activeStepId === 5 ? '#38bdf8' : '#475569'} strokeWidth="1.5" />
                    <text x="70" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">CDR Resource API</text>
                    <text x="70" y="42" textAnchor="middle" fill="#94a3b8" fontSize="9">GET /banking/accounts</text>
                    <text x="70" y="52" textAnchor="middle" fill="#38bdf8" fontSize="8">Bound Tokens Only</text>
                  </g>

                  {/* Connecting Paths */}
                  {/* Step 1: Consumer -> ADR */}
                  {activeStepId === 1 && (
                    <path
                      d="M 140 50 L 232 50"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                      className="anim-flowing-path-cdr"
                      markerEnd="url(#arrow-cdr-purple)"
                    />
                  )}

                  {/* Step 2: ADR -> Register */}
                  {activeStepId === 2 && (
                    <path
                      d="M 360 50 L 452 50"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2"
                      className="anim-flowing-path-cdr"
                      markerEnd="url(#arrow-cdr-purple)"
                    />
                  )}

                  {/* Step 3: Consumer -> Bank Portal */}
                  {activeStepId === 3 && (
                    <path
                      d="M 80 80 L 80 170 L 122 170"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                      className="anim-flowing-path-cdr"
                      markerEnd="url(#arrow-cdr-mint)"
                    />
                  )}

                  {/* Step 4: Bank -> ADR */}
                  {activeStepId === 4 && (
                    <path
                      d="M 220 140 L 280 88"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      className="anim-flowing-path-cdr"
                      markerEnd="url(#arrow-cdr-cyan)"
                    />
                  )}

                  {/* Step 5: ADR -> API */}
                  {activeStepId === 5 && (
                    <path
                      d="M 320 80 L 420 132"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      className="anim-flowing-path-cdr"
                      markerEnd="url(#arrow-cdr-cyan)"
                    />
                  )}
                </svg>
              </div>

              {/* Right Column: Step Detail Card */}
              <div
                style={{
                  backgroundColor: '#0c0e17',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase' }}>
                    {currStep.actor}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                    {currStep.title}
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {currStep.desc}
                </div>

                <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa' }}>SECURITY COMPLIANCE ENFORCEMENT:</div>
                  <div style={{ fontSize: '11px', color: '#e2e8f0', marginTop: '2px' }}>{currStep.security}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>EXECUTION CHECKLIST:</span>
                  {currStep.details.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10px', color: '#cbd5e1' }}>
                      <span style={{ color: '#a78bfa', fontWeight: 800 }}>•</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CONSENT STATE MACHINE ================= */}
        {activeTab === 'states' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>
              Under the Australian Consumer Data Right Act 2019, consumer consent is strictly stateful and consumer-centric. The consumer maintains unilateral revocation rights through their banking application at all times.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {CONSENT_STATES.map((st, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#0c0e17',
                    border: `1px solid ${st.color}50`,
                    borderLeft: `4px solid ${st.color}`,
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: st.color }}>{st.name}</span>
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: `${st.color}20`, color: st.color, fontWeight: 700 }}>
                      CDR RULE
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {st.desc}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                    ⏳ SLA: {st.sla}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: DATA SCOPES ================= */}
        {activeTab === 'scopes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>
              CDR mandates unbundled consent: Data Holders must never force "all or nothing" access. Consumers granularly select which accounts and clusters are shared.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {DATA_SCOPES.map((sc, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#0c0e17',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                    {sc.code}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                    {sc.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                    {sc.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
