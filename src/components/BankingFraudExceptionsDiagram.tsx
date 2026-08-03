import React, { useState } from 'react';

const EXCEPTION_STATES = [
  { id: 'stpfail', title: '1. STP Failure Trigger', desc: 'Payment fails automated validation (e.g. Invalid account number AC01, Insufficient funds AM04, Sanctions alert).', color: '#fbbf24' },
  { id: 'queue', title: '2. Exception Queue Routing', desc: 'Engine routes transaction to specific operational repair queue based on exception code.', color: '#38bdf8' },
  { id: 'repair', title: '3. Operator Manual Repair', desc: '1st Line Ops analyst inspects payload, corrects invalid BSB/account number, or requests customer confirmation.', color: '#a78bfa' },
  { id: 'resubmit', title: '4. Re-submission / Reversal', desc: 'Payment re-enters payment hub execution engine (pacs.008) or triggers automated return (pacs.004).', color: '#34d399' }
];

const FRAUD_RULES = [
  { rule: 'Rule 1: Velocity Spikes', condition: ' > 5 payments in 60 seconds from same device ID', risk: 'HIGH (Block & Alert)', score: '+45' },
  { rule: 'Rule 2: Geo-Distance Anomaly', condition: 'Login from Sydney ➔ Transaction from London within 10 mins', risk: 'HIGH (Step-up MFA / Freeze)', score: '+50' },
  { rule: 'Rule 3: First-time High Value', condition: 'Transfers > $10,000 to new beneficiary account', risk: 'MEDIUM (Delayed 24h Hold)', score: '+30' },
  { rule: 'Rule 4: Mule Account Pattern', condition: 'Rapid inflow followed by immediate withdrawal', risk: 'CRITICAL (AUSTRAC SMR File)', score: '+80' }
];

export default function BankingFraudExceptionsDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'fraud' | 'codes'>('lifecycle');
  const [activeStateIdx, setActiveStateIdx] = useState<number>(0);
  const [selectedCode, setSelectedCode] = useState<string>('AC01');

  const currState = EXCEPTION_STATES[activeStateIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .fraud-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Real-Time Payment Fraud Scoring & Exception Handling Engine
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'lifecycle', label: '🔄 Exception Handling State Machine (STP Fail ➔ Repair)', color: '#fbbf24' },
            { id: 'fraud', label: '⚡ Real-Time Fraud Rules & Risk Scoring Matrix', color: '#f87171' },
            { id: 'codes', label: '📋 ISO 20022 Return & Exception Codes Reference', color: '#38bdf8' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Exception State Machine */}
        {activeTab === 'lifecycle' && (
          <div className="fraud-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                EXCEPTION LIFECYCLE STAGES:
              </div>

              {EXCEPTION_STATES.map((st, idx) => {
                const isSel = idx === activeStateIdx;
                return (
                  <div
                    key={st.id}
                    onClick={() => setActiveStateIdx(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? `${st.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? st.color : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isSel ? st.color : 'var(--ifm-color-content)' }}>
                      {st.title}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-yellow" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: currState.color, textTransform: 'uppercase', marginBottom: '6px' }}>
                Exception Processing Inspection
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {currState.title}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: 0 }}>
                {currState.desc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Fraud Rules Matrix */}
        {activeTab === 'fraud' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
              Real-time payment engines calculate a composite risk score (0-100) before sending payments to scheme rails.
            </div>

            {FRAUD_RULES.map((fr, idx) => (
              <div key={idx} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>{fr.rule}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Condition: {fr.condition}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>{fr.risk}</div>
                  <code style={{ fontSize: '10px', color: '#f87171' }}>Score: {fr.score}</code>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Exception Codes */}
        {activeTab === 'codes' && (
          <div className="fraud-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            {[
              { code: 'AC01', title: 'Incorrect Account Number', action: 'Route to Ops Repair queue or return pacs.004' },
              { code: 'AM04', title: 'Insufficient Funds', action: 'Reject immediately or trigger retry after 2 hours' },
              { code: 'AG01', title: 'Payment Transaction Blocked', action: 'Compliance sanctions hold & manual disposition' },
              { code: 'MD01', title: 'No Mandate / Mandate Expired', action: 'Reject Direct Debit / PayTo authorization failure' }
            ].map(c => (
              <div key={c.code} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{c.code}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{c.title}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{c.action}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
