import React, { useState } from 'react';

const ABA_RECORDS = [
  { type: 'Record 0: Descriptive Record', len: '120 chars', desc: 'File header. Contains BSB of processing bank, financial institution name, user ID number, description of payments (e.g. PAYROLL), date of processing.' },
  { type: 'Record 1: Detail Record', len: '120 chars', desc: 'Transaction record. Contains BSB, Account Number, Indicator (N/H), Transaction Code (13 debit, 50 credit), Amount, Title of Account, Lodgement Ref, Trace BSB & Account.' },
  { type: 'Record 7: File Control Record', len: '120 chars', desc: 'File footer / checksum. Contains BSB filler, Total File Net Amount, Total File Credit Amount, Total File Debit Amount, Total Count of Detail Records.' }
];

export default function BankingBatchReconciliationDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'aba' | 'recon' | 'liquidity'>('aba');
  const [selectedRecord, setSelectedRecord] = useState<number>(1);
  const [openingBal, setOpeningBal] = useState<number>(500); // $500M Nostro
  const [inflow, setInflow] = useState<number>(120); // +$120M
  const [outflow, setOutflow] = useState<number>(150); // -$150M

  const closingBal = openingBal + inflow - outflow;
  const targetReserve = 450; // $450M Target
  const surplusDeficit = closingBal - targetReserve;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .recon-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Batch BECS File Inspector, 3-Way Reconciliation & Intraday Liquidity Calculator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'aba', label: '📄 BECS ABA Batch File Monospace Schema Inspector', color: '#38bdf8' },
            { id: 'recon', label: '⚖️ 3-Way Reconciliation (Ledger vs Statement vs Rail)', color: '#34d399' },
            { id: 'liquidity', label: '🧮 Intraday Nostro Liquidity & EOD Sweep Calculator', color: '#fbbf24' }
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

        {/* Tab 1: ABA File Schema */}
        {activeTab === 'aba' && (
          <div className="recon-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                BECS ABA FILE RECORD TYPES:
              </div>

              {ABA_RECORDS.map((r, idx) => {
                const isSel = idx === selectedRecord;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedRecord(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isSel ? '#38bdf8' : 'var(--ifm-color-content)' }}>
                      {r.type}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '240px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Fixed 120-Byte Monospace Schema Spec
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                {ABA_RECORDS[selectedRecord].type}
              </div>
              <code style={{ fontSize: '10px', color: '#fbbf24', display: 'block', marginBottom: '8px' }}>
                Fixed Record Length: {ABA_RECORDS[selectedRecord].len}
              </code>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: 0 }}>
                {ABA_RECORDS[selectedRecord].desc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: 3-Way Reconciliation */}
        {activeTab === 'recon' && (
          <div className="recon-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>1. Core Banking Ledger</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                Internal customer debit/credit transactions posted to General Ledger (GL).
              </div>
            </div>

            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>2. SWIFT MT940 / camt.053</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                Bank statement message received daily from correspondent bank or central bank.
              </div>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>3. Auto-Matching Engine</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                Matches transactions by UETR/EndToEndId. Flags un-matched items for ops investigation.
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Liquidity Calculator */}
        {activeTab === 'liquidity' && (
          <div className="recon-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '12px' }}>
                INTRADAY LIQUIDITY & NOSTRO BALANCER ($M AUD)
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  OPENING NOSTRO BALANCE: <span style={{ color: '#38bdf8' }}>${openingBal}M</span>
                </label>
                <input type="range" min="100" max="1000" step="50" value={openingBal} onChange={e => setOpeningBal(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  INTRADAY INFLOWS (INBOUND SETTLEMENTS): <span style={{ color: '#34d399' }}>+${inflow}M</span>
                </label>
                <input type="range" min="10" max="500" step="10" value={inflow} onChange={e => setInflow(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  INTRADAY OUTFLOWS (OUTBOUND SETTLEMENTS): <span style={{ color: '#f87171' }}>-${outflow}M</span>
                </label>
                <input type="range" min="10" max="500" step="10" value={outflow} onChange={e => setOutflow(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>
            </div>

            <div className="interactive-diagram-details-card details-yellow">
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '10px' }}>
                EOD CLOSING POSITION & CENTRAL BANK SWEEP
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Calculated Closing Position:</span>
                  <span style={{ fontWeight: 800, color: '#38bdf8' }}>${closingBal}M</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Target Reserve Requirement:</span>
                  <span style={{ fontWeight: 800, color: '#a78bfa' }}>${targetReserve}M</span>
                </div>
              </div>

              <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>EOD LIQUIDITY STATUS</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: surplusDeficit >= 0 ? '#34d399' : '#f87171' }}>
                    {surplusDeficit >= 0 ? `Surplus +$${surplusDeficit}M` : `Deficit -$${Math.abs(surplusDeficit)}M`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
