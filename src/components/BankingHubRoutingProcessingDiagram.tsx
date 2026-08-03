import React, { useState } from 'react';

const HUB_STAGES = [
  { stage: '1. Channel Ingestion', desc: 'Ingests payment requests from Mobile App, Online Banking, Host-to-Host File, or Open Banking API.' },
  { stage: '2. Validation & Enrichment', desc: 'Validates schema syntax (ISO 20022 XML), checks duplicate MsgId/EndToEndId, enriches beneficiary details.' },
  { stage: '3. Sanctions & Fraud Screening', desc: 'Screens payer/payee against OFAC/UN sanctions watchlists and evaluates real-time fraud risk score.' },
  { stage: '4. Clearing Router Selection', desc: 'Intelligent router selects optimal rail (NPP for instant under $200k, BECS for batch payroll, SWIFT for cross-border).' },
  { stage: '5. Core Ledger Reservation', desc: 'Reserves customer funds in Core Banking System (CBS) and places authorization hold.' },
  { stage: '6. Scheme Dispatch & Confirmation', desc: 'Formats message (e.g. pacs.008) and dispatches to scheme rail; waits for pacs.002 status report.' }
];

export default function BankingHubRoutingProcessingDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'cop'>('pipeline');
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);
  const [payeeInputName, setPayeeInputName] = useState<string>('Nexus Supplies Ltd');
  const [targetAccountName] = useState<string>('Nexus Supplies Limited');

  // Simple string similarity for Confirmation of Payee (CoP)
  const isExact = payeeInputName.trim().toLowerCase() === targetAccountName.toLowerCase();
  const isClose = payeeInputName.trim().toLowerCase().includes('nexus supplies');
  const copStatus = isExact ? 'MATCH (Exact Match 100%)' : isClose ? 'CLOSE MATCH (Confidence 92%)' : 'NO MATCH (Warning: Name Discrepancy)';

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .hub-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Enterprise Payment Hub Architecture & Confirmation of Payee (CoP) Router
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'pipeline', label: '⚙️ Enterprise Payment Hub 6-Stage Processing Pipeline', color: '#a78bfa' },
            { id: 'cop', label: '🛡️ Confirmation of Payee (CoP) Fuzzy Matching Engine', color: '#34d399' }
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

        {/* Tab 1: Hub Pipeline */}
        {activeTab === 'pipeline' && (
          <div className="hub-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                PAYMENT HUB PIPELINE STAGES:
              </div>

              {HUB_STAGES.map((st, idx) => {
                const isSel = idx === activeStageIdx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveStageIdx(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isSel ? '#a78bfa' : 'var(--ifm-color-content)' }}>
                      {st.stage}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-purple" style={{ minHeight: '280px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px' }}>
                Stage Inspection & Execution Logic
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {HUB_STAGES[activeStageIdx].stage}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: 0 }}>
                {HUB_STAGES[activeStageIdx].desc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Confirmation of Payee */}
        {activeTab === 'cop' && (
          <div className="hub-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '12px' }}>
                CONFIRMATION OF PAYEE (CoP) SIMULATOR
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'block', marginBottom: '4px' }}>
                  TARGET BENEFICIARY REGISTERED NAME:
                </label>
                <input type="text" readOnly value={targetAccountName} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#090b14', color: '#a78bfa', fontSize: '11px', fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'block', marginBottom: '4px' }}>
                  PAYER ENTERED BENEFICIARY NAME:
                </label>
                <input
                  type="text"
                  value={payeeInputName}
                  onChange={e => setPayeeInputName(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #34d399', background: '#090b14', color: '#34d399', fontSize: '11px', fontWeight: 700 }}
                />
              </div>
            </div>

            <div className="interactive-diagram-details-card details-green">
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
                FUZZY MATCHING RESULT
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: isExact ? '#34d399' : isClose ? '#fbbf24' : '#f87171', marginBottom: '8px' }}>
                {copStatus}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                CoP prevents APP (Authorised Push Payment) invoice scams by querying the creditor bank before sending funds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
