import React, { useState } from 'react';

const REVERSAL_SCENARIOS = [
  {
    id: 'return',
    title: '1. Payment Return (pacs.004)',
    initiator: 'Creditor Bank (Receiver)',
    reason: 'Cannot apply credit (Account closed AC01, Invalid account number, Deceased account)',
    flow: 'Creditor Bank ──[pacs.004]──► Debtor Bank (Returns funds immediately, no consent needed)',
    color: '#34d399'
  },
  {
    id: 'reversal',
    title: '2. Payment Reversal (pain.007 / pacs.007)',
    initiator: 'Debtor Bank / Originator (Sender)',
    reason: 'Sender error, duplicate transfer (DUPL), fraudulent origin (FRAD), or wrong amount (AM09)',
    flow: 'Customer ──[pain.007]──► Debtor Bank ──[pacs.007]──► Creditor Bank ──[pacs.004 FOCR]──► Debtor Bank',
    color: '#fbbf24'
  },
  {
    id: 'recall',
    title: '3. Formal Recall Request (camt.056)',
    initiator: 'Debtor Bank / SWIFT gpi',
    reason: 'Formal request to recall funds after settlement. Creditor bank must request beneficiary consent.',
    flow: 'Debtor Bank ──[camt.056]──► Creditor Bank (Investigates & responds with camt.029 Resolution or pacs.004 FOCR)',
    color: '#38bdf8'
  }
];

const REASON_CODES = [
  { code: 'DUPL', title: 'Duplicate Payment', desc: 'Same payment was submitted multiple times by error.' },
  { code: 'FRAD', title: 'Fraudulent Origin', desc: 'Payment was initiated through compromised credentials / scam.' },
  { code: 'UPAY', title: 'Undue Payment', desc: 'Payment was not authorized or due to beneficiary.' },
  { code: 'TECH', title: 'Technical Failure', desc: 'System glitch at sender bank duplicated transaction.' },
  { code: 'FOCR', title: 'Following Cancellation Request', desc: 'Response code when creditor bank accepts pacs.007/camt.056.' }
];

export default function BankingReversalRecallDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'matrix' | 'flow' | 'codes'>('matrix');
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(1);

  const currScenario = REVERSAL_SCENARIOS[selectedScenarioIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .reversal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          ISO 20022 Return (pacs.004) vs Reversal (pain.007/pacs.007) vs Recall (camt.056)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'matrix', label: '⚡ Return vs Reversal vs Recall Quick Reference', color: '#fbbf24' },
            { id: 'flow', label: '🔄 Reversal & Recall End-to-End Sequence Flow', color: '#38bdf8' },
            { id: 'codes', label: '📋 Reason Codes (DUPL, FRAD, FOCR)', color: '#34d399' }
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

        {/* Tab 1: Matrix */}
        {activeTab === 'matrix' && (
          <div className="reversal-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT PAYMENT EXCEPTION SCENARIO:
              </div>

              {REVERSAL_SCENARIOS.map((sc, idx) => {
                const isSel = idx === selectedScenarioIdx;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenarioIdx(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? `${sc.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? sc.color : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isSel ? sc.color : 'var(--ifm-color-content)' }}>
                      {sc.title}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-yellow" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: currScenario.color, textTransform: 'uppercase', marginBottom: '6px' }}>
                Message Action Protocol
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                {currScenario.title}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                Initiator: {currScenario.initiator}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>
                <strong>Reason:</strong> {currScenario.reason}
              </p>
              <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', fontSize: '10.5px', color: '#38bdf8' }}>
                {currScenario.flow}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Flow */}
        {activeTab === 'flow' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              End-to-End Reversal Sequence: If debtor bank submits <code>pacs.008</code> and then customer submits <code>pain.007</code>:
            </div>

            <div className="reversal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>Step 1: Customer Request</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Customer sends <code>pain.007</code> to Debtor Bank.</div>
              </div>

              <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>Step 2: Interbank Reversal</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Debtor Bank sends <code>pacs.007</code> to Creditor Bank.</div>
              </div>

              <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa' }}>Step 3: Consent Check</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Creditor Bank checks if funds credited; requests beneficiary consent if needed.</div>
              </div>

              <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>Step 4: FOCR Return</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Creditor Bank returns funds via <code>pacs.004</code> with reason code <code>FOCR</code>.</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Reason Codes */}
        {activeTab === 'codes' && (
          <div className="reversal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {REASON_CODES.map(c => (
              <div key={c.code} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>{c.code}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{c.title}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
