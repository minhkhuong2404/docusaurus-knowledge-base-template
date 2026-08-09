import React, { useState, useEffect } from 'react';

interface LifecycleStep {
  id: number;
  title: string;
  actor: string;
  rail: string;
  isoMsg: string;
  color: string;
  summary: string;
  details: string[];
  samplePayload?: string;
}

const LIFECYCLE_STEPS: LifecycleStep[] = [
  {
    id: 1,
    title: '1. Payment Initiation',
    actor: 'Debtor / Payer App',
    rail: 'Customer-to-Bank',
    isoMsg: 'pain.001.001.11',
    color: '#38bdf8',
    summary: 'Payer enters payment details ($500 to BSB 062-000, Account 12345678) and submits instruction.',
    details: [
      'Customer authenticates via MFA (biometrics/OTP) in Mobile App or Corporate Treasury Portal.',
      'API packages payment parameters into ISO 20022 pain.001 (Customer Credit Transfer Initiation).',
      'System assigns an EndToEndId (E2E) for tracing through all downstream networks.'
    ],
    samplePayload: `<pain.001.001.11>
  <PmtInf>
    <PmtInfId>PMT-2026-0803-8891</PmtInfId>
    <PmtMtd>TRF</PmtMtd>
    <Dbtr><Nm>Alex Mercer</Nm></Dbtr>
    <DbtrAcct><Id><Othr><Id>99991234</Id></Othr></Id></DbtrAcct>
    <CdtTrfTxInf>
      <PmtId><EndToEndId>E2E-987654321</EndToEndId></PmtId>
      <Amt><InstdAmt Ccy="AUD">500.00</InstdAmt></Amt>
      <Cdtr><Nm>Jane Doe</Nm></Cdtr>
    </CdtTrfTxInf>
  </PmtInf>
</pain.001.001.11>`
  },
  {
    id: 2,
    title: '2. AuthN & AuthZ Checks',
    actor: 'Debtor Bank Gateway',
    rail: 'Internal Security',
    isoMsg: 'OAuth2 / FAPI',
    color: '#a78bfa',
    summary: 'Debtor Bank verifies identity, session tokens, and account permissions.',
    details: [
      'Validates bearer token & cryptographic digital signature.',
      'Verifies account state: active, open for debits, correct currency (AUD).',
      'Checks daily transaction limits ($10,000 retail limit vs $500 payment).'
    ]
  },
  {
    id: 3,
    title: '3. Available Balance Check',
    actor: 'Core Banking Engine',
    rail: 'Ledger Engine',
    isoMsg: 'Internal API',
    color: '#fbbf24',
    summary: 'Calculates Available Balance = Ledger Balance minus Pending Holds.',
    details: [
      'Ledger Balance ($1,200) - Active Holds ($200) = Available Balance ($1,000).',
      'Payment amount ($500) <= Available ($1,000) -> PASS.',
      'Generates a temporary balance reservation (hold) of $500.'
    ]
  },
  {
    id: 4,
    title: '4. Compliance & Risk Screening',
    actor: 'Sanctions & Fraud Engine',
    rail: 'Compliance Pipeline',
    isoMsg: 'Internal Decision Engine',
    color: '#f97316',
    summary: 'Screens all transaction parties for Sanctions, AML, Fraud, and Duplicates.',
    details: [
      'Duplicate Check: Verifies E2E-987654321 has not been processed within 72h.',
      'Sanctions Screening: Name & BIC matched against OFAC, UN, DFAT lists via Jaro-Winkler (>0.85).',
      'Fraud Scoring: ML model evaluates IP, velocity, geolocation, PayID lookup risk.',
      'AML Check: Detects structuring patterns or suspicious velocity anomalies.'
    ]
  },
  {
    id: 5,
    title: '5. Debtor Account Posting',
    actor: 'Debtor Bank Ledger',
    rail: 'Internal Ledger',
    isoMsg: 'camt.054 (Debit)',
    color: '#34d399',
    summary: 'Debtor account is formally debited and customer receives instant notification.',
    details: [
      'Converts balance hold into a immutable ledger posting entry.',
      'Generates camt.054 (BankToCustomerDebitCreditNotification) for payer app.',
      'Push notification sent: "You paid $500 to Jane Doe".'
    ],
    samplePayload: `<camt.054.001.10>
  <Ntfctn>
    <Id>NTF-DEBIT-991234</Id>
    <Ntry>
      <Amt Ccy="AUD">500.00</Amt>
      <CdtDbtInd>DBIT</CdtDbtInd>
      <Sts>BOOK</Sts>
      <NtryDtls><TxDtls><RmtInf><Ustrd>Rent for June</Ustrd></RmtInf></TxDtls></NtryDtls>
    </Ntry>
  </Ntfctn>
</camt.054.001.10>`
  },
  {
    id: 6,
    title: '6. Payment Rail Routing',
    actor: 'Payment Hub Router',
    rail: 'Routing Gateway',
    isoMsg: 'Scheme Dispatch',
    color: '#2dd4bf',
    summary: 'Determines optimal scheme rail (On-Us, NPP, RTGS, BECS, or SWIFT).',
    details: [
      'Checks if Creditor account is in same bank (On-Us: instant internal transfer).',
      'If Off-Us and real-time requested -> Routes to NPP / Osko (<15 sec).',
      'If high-value corporate payment -> Routes to HVCS / RITS RTGS.',
      'If batch/overnight -> Queues for BECS Direct Entry.'
    ]
  },
  {
    id: 7,
    title: '7. Interbank pacs.008 Message',
    actor: 'NPP / SWIFT Network',
    rail: 'Interbank Rail',
    isoMsg: 'pacs.008.001.10',
    color: '#38bdf8',
    summary: 'Debtor Bank transmits pacs.008 FI-to-FI Credit Transfer to Creditor Bank.',
    details: [
      'Packages full debtor/creditor details, instruct amount, and UETR.',
      'Message passed through clearing network securely with digital signatures.',
      'Creditor Bank receives message and parses transaction payload.'
    ],
    samplePayload: `<pacs.008.001.10>
  <GrpHdr>
    <MsgId>NPP-20260803-77192</MsgId>
    <SttlmInf><SttlmMtd>CLRG</SttlmMtd></SttlmInf>
  </GrpHdr>
  <CdtTrfTxInf>
    <PmtId>
      <EndToEndId>E2E-987654321</EndToEndId>
      <UETR>c56f9a12-8812-4210-9b87-112233445566</UETR>
    </PmtId>
    <IntrBkSttlmAmt Ccy="AUD">500.00</IntrBkSttlmAmt>
    <DbtrAgt><FinInstnId><BICFI>ANZBAU3M</BICFI></FinInstnId></DbtrAgt>
    <CdtrAgt><FinInstnId><BICFI>CBAAAU2S</BICFI></CdtrAgt>
  </CdtTrfTxInf>
</pacs.008.001.10>`
  },
  {
    id: 8,
    title: '8. Central Bank Settlement',
    actor: 'RBA Fast Settlement Service',
    rail: 'Settlement Engine',
    isoMsg: 'RITS / FSS RTGS',
    color: '#8b5cf6',
    summary: 'Irrevocable movement of central bank funds between Exchange Settlement Accounts (ESA).',
    details: [
      'RBA FSS debits ANZ ESA account by $500 and credits CBA ESA account by $500.',
      'Settlement is immediate, final, and non-reversible (Zero Credit Risk).',
      'For BECS: Obligations queued for end-of-day multilateral netting window.'
    ]
  },
  {
    id: 9,
    title: '9. Creditor Account Posting',
    actor: 'Creditor Bank Ledger',
    rail: 'Internal Ledger',
    isoMsg: 'camt.054 (Credit)',
    color: '#34d399',
    summary: 'Creditor account is credited with $500 and payee receives push notification.',
    details: [
      'Creditor Bank runs inbound sanctions/AML screening.',
      'Matches account number 12345678 to Jane Doe.',
      'Credits account ledger balance and sends camt.054 notification: "Received $500 from Alex Mercer".'
    ]
  },
  {
    id: 10,
    title: '10. Confirmation & pacs.002',
    actor: 'Creditor Bank -> Debtor Bank',
    rail: 'Interbank Ack',
    isoMsg: 'pacs.002.001.12',
    color: '#34d399',
    summary: 'Creditor Bank sends positive pacs.002 status report back to Debtor Bank.',
    details: [
      'Status code: ACTC (Accepted Technical Validation) / ACCP (Accepted Customer Profile).',
      'Debtor Bank receives confirmation and updates payment status to COMPLETED.',
      'Payer app shows green checkmark: "Payment Delivered Successfully".'
    ],
    samplePayload: `<pacs.002.001.12>
  <TxInfAndSts>
    <OrgnlEndToEndId>E2E-987654321</OrgnlEndToEndId>
    <OrgnlUETR>c56f9a12-8812-4210-9b87-112233445566</OrgnlUETR>
    <TxSts>ACCP</TxSts> <!-- Accepted Customer Profile / Credited -->
  </TxInfAndSts>
</pacs.002.001.12>`
  }
];

const SCENARIOS = [
  { id: 'happy', label: '✅ Happy Path (NPP Real-Time)', color: '#34d399', failStep: null },
  { id: 'funds', label: '❌ Insufficient Funds (Step 3 Fail)', color: '#fbbf24', failStep: 3 },
  { id: 'sanctions', label: '❌ Sanctions Block (Step 4 Fail)', color: '#f87171', failStep: 4 },
  { id: 'return', label: '↩️ Account Closed Return (Step 9 Return)', color: '#f97316', failStep: 9 }
];

export default function BankingPaymentLifecycleDiagram(): React.JSX.Element {
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [playing, setPlaying] = useState<boolean>(false);
  const [scenario, setScenario] = useState<string>('happy');
  const [showPayload, setShowPayload] = useState<boolean>(false);

  const selectedScenario = SCENARIOS.find(s => s.id === scenario)!;
  const currentStep = LIFECYCLE_STEPS.find(s => s.id === activeStepId)!;

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setActiveStepId(prev => {
        if (selectedScenario.failStep && prev >= selectedScenario.failStep) {
          setPlaying(false);
          return prev;
        }
        if (prev >= LIFECYCLE_STEPS.length) {
          setPlaying(false);
          return 1;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [playing, selectedScenario]);

  const handlePlay = () => {
    setActiveStepId(1);
    setPlaying(true);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .payment-lifecycle-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          End-to-End Payment Lifecycle Engine (10 Steps)
        </span>

        <button
          onClick={handlePlay}
          disabled={playing}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            cursor: playing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '12px',
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.18)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {playing ? '▶ Processing Step...' : '▶ Animate Lifecycle'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Scenario Switcher */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {SCENARIOS.map(sc => (
            <button
              key={sc.id}
              onClick={() => {
                setScenario(sc.id);
                setActiveStepId(1);
                setPlaying(false);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 600,
                background: scenario === sc.id ? `${sc.color}20` : 'rgba(255,255,255,0.04)',
                color: scenario === sc.id ? sc.color : 'var(--ifm-color-content-secondary)',
                boxShadow: scenario === sc.id ? `0 0 0 1.5px ${sc.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Horizontal Progress Bar */}
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
            {LIFECYCLE_STEPS.map(s => {
              const isActive = s.id === activeStepId;
              const isPassed = s.id < activeStepId;
              const isFailed = selectedScenario.failStep === s.id && activeStepId === s.id;
              
              let stepColor = s.color;
              if (isFailed) stepColor = '#f87171';
              else if (isPassed) stepColor = '#34d399';

              return (
                <button
                  key={s.id}
                  onClick={() => { setActiveStepId(s.id); setPlaying(false); }}
                  style={{
                    flex: 1,
                    minWidth: '40px',
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? `${stepColor}25` : isPassed ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
                    boxShadow: isActive ? `0 0 0 1.5px ${stepColor}` : 'none',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: stepColor }}>S{s.id}</div>
                  <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.isoMsg.split('.')[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid View */}
        <div className="payment-lifecycle-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* Step Timeline Graph */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>WORKFLOW STAGES</span>
              <span>SCENARIO: {selectedScenario.label}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {LIFECYCLE_STEPS.map(s => {
                const isActive = s.id === activeStepId;
                const isFailed = selectedScenario.failStep === s.id;
                const isBlocked = selectedScenario.failStep !== null && s.id > selectedScenario.failStep;

                let cardBg = 'rgba(255,255,255,0.03)';
                let cardBorder = 'rgba(255,255,255,0.08)';
                let statusBadge = <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>QUEUED</span>;

                if (isActive) {
                  if (isFailed) {
                    cardBg = 'rgba(248,113,113,0.15)';
                    cardBorder = '#f87171';
                    statusBadge = <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 800 }}>⛔ FAILED / BLOCKED</span>;
                  } else {
                    cardBg = `${s.color}20`;
                    cardBorder = s.color;
                    statusBadge = <span style={{ fontSize: '10px', color: s.color, fontWeight: 800 }}>⚡ PROCESSING</span>;
                  }
                } else if (s.id < activeStepId) {
                  cardBg = 'rgba(52,211,153,0.08)';
                  cardBorder = 'rgba(52,211,153,0.3)';
                  statusBadge = <span style={{ fontSize: '10px', color: '#34d399' }}>✓ COMPLETED</span>;
                } else if (isBlocked) {
                  cardBg = 'rgba(255,255,255,0.01)';
                  cardBorder = 'rgba(255,255,255,0.04)';
                  statusBadge = <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', opacity: 0.5 }}>SKIPPED</span>;
                }

                return (
                  <div
                    key={s.id}
                    onClick={() => { setActiveStepId(s.id); setPlaying(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      cursor: 'pointer',
                      opacity: isBlocked ? 0.4 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isActive ? s.color : 'rgba(255,255,255,0.1)',
                        color: isActive ? '#090b14' : 'var(--ifm-color-content)',
                        fontWeight: 800,
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {s.id}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: isActive ? s.color : 'var(--ifm-color-content)' }}>
                          {s.title}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                          {s.actor} • <code style={{ fontSize: '9.5px', color: s.color }}>{s.isoMsg}</code>
                        </div>
                      </div>
                    </div>

                    {statusBadge}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details & Payload Card */}
          <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: currentStep.color }}>
                {currentStep.title}
              </span>
              <button
                onClick={() => setShowPayload(!showPayload)}
                disabled={!currentStep.samplePayload}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: currentStep.samplePayload ? 'pointer' : 'not-allowed',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  background: showPayload ? `${currentStep.color}25` : 'rgba(255,255,255,0.06)',
                  color: currentStep.samplePayload ? currentStep.color : 'var(--ifm-color-content-secondary)'
                }}
              >
                {showPayload ? 'View Description' : 'View ISO Payload'}
              </button>
            </div>

            {selectedScenario.failStep === currentStep.id ? (
              <div style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                  ⛔ Failure Triggered at Step {currentStep.id}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  {selectedScenario.id === 'funds' && 'Core banking engine returned EXPIRED / INSUFFICIENT_FUNDS error code (RJCT). Available balance ($1,000) was lower than pending debits.'}
                  {selectedScenario.id === 'sanctions' && 'Sanctions matcher found >0.91 Jaro-Winkler hit against OFAC SDN list. Payment auto-held, compliance alert generated, pacs.002 status = RJCT.'}
                  {selectedScenario.id === 'return' && 'Creditor bank account 12345678 was CLOSED. Creditor Bank initiated a pacs.004 Payment Return to refund funds back to Debtor.'}
                </div>
              </div>
            ) : null}

            {!showPayload ? (
              <div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6, marginTop: 0, marginBottom: '14px' }}>
                  {currentStep.summary}
                </p>

                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Key Engine Operations:
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                  {currentStep.details.map((d, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>{d}</li>
                  ))}
                </ul>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>System Component</div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: currentStep.color }}>{currentStep.actor}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Protocol / Schema</div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399' }}>{currentStep.isoMsg}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: currentStep.color, marginBottom: '6px' }}>
                  ISO 20022 XML Snippet ({currentStep.isoMsg}):
                </div>
                <pre style={{
                  flex: 1,
                  background: '#070913',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '10.5px',
                  color: '#38bdf8',
                  overflowX: 'auto',
                  lineHeight: 1.4,
                  margin: 0
                }}>
                  {currentStep.samplePayload}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
