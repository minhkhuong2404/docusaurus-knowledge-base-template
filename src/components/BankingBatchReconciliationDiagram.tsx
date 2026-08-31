import React, { useState } from 'react';

const ABA_RECORDS = [
  { type: 'Record 0: Descriptive Record (Header)', len: '120 chars', desc: 'File header. Contains BSB of processing bank, financial institution name, user ID number, description of payments (e.g. PAYROLL), and date of processing.' },
  { type: 'Record 1: Detail Record (Transactions)', len: '120 chars', desc: 'Individual transaction record. Contains destination BSB, Account Number, Indicator (N/H), Transaction Code (13 debit, 50 credit), Amount, Title of Account, Lodgement Ref, Trace BSB & Account.' },
  { type: 'Record 7: File Control Record (Trailer)', len: '120 chars', desc: 'File footer / checksum. Contains BSB filler, Total File Net Amount, Total File Credit Amount, Total File Debit Amount, and Total Count of Detail Records for automated reconciliation.' }
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
          Batch BECS File Pipeline, 3-Way Reconciliation & Intraday Liquidity Calculator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'aba', label: '📄 BECS ABA Batch File Pipeline & Record Structure', color: '#38bdf8' },
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

        {/* Animated Flow SVG Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', marginBottom: '14px', overflow: 'hidden' }}>
          <svg viewBox="0 0 680 140" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="recon-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
              </marker>
              <marker id="recon-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
              <marker id="recon-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
              </marker>
            </defs>

            {activeTab === 'aba' && (
              <g>
                <rect x="25" y="40" width="160" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="105" y="66" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Record 0: Header</text>
                <text x="105" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Descriptive Block</text>

                <line x1="185" y1="70" x2="260" y2="70" stroke="rgba(56,189,248,0.3)" strokeWidth="2" />
                <line x1="185" y1="70" x2="260" y2="70" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#recon-arr-blue)" />

                <rect x="265" y="40" width="180" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="355" y="66" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Record 1: Detail List</text>
                <text x="355" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">N individual transactions</text>

                <line x1="445" y1="70" x2="520" y2="70" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="445" y1="70" x2="520" y2="70" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#recon-arr-green)" />

                <rect x="525" y="40" width="130" height="60" rx="8" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="590" y="66" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Record 7: Trailer</text>
                <text x="590" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Control Total Hash</text>
              </g>
            )}

            {activeTab === 'recon' && (
              <g>
                <rect x="25" y="40" width="140" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="95" y="66" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Core GL Ledger</text>
                <text x="95" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Internal postings</text>

                <line x1="165" y1="70" x2="260" y2="70" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="165" y1="70" x2="260" y2="70" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#recon-arr-green)" />

                <rect x="265" y="40" width="180" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="355" y="66" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">3-Way Match Engine</text>
                <text x="355" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">EndToEndId / UETR</text>

                <line x1="445" y1="70" x2="520" y2="70" stroke="rgba(56,189,248,0.3)" strokeWidth="2" />
                <line x1="445" y1="70" x2="520" y2="70" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#recon-arr-blue)" />

                <rect x="525" y="40" width="130" height="60" rx="8" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="590" y="66" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">camt.053 Statement</text>
                <text x="590" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Central Bank Settlement</text>
              </g>
            )}

            {activeTab === 'liquidity' && (
              <g>
                <rect x="25" y="40" width="150" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="100" y="66" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Opening Balance</text>
                <text x="100" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">${openingBal}M Nostro</text>

                <line x1="175" y1="70" x2="250" y2="70" stroke="rgba(56,189,248,0.3)" strokeWidth="2" />
                <line x1="175" y1="70" x2="250" y2="70" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#recon-arr-blue)" />

                <rect x="255" y="40" width="180" height="60" rx="8" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="345" y="66" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Intraday RTGS Flows</text>
                <text x="345" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">+{inflow}M / -{outflow}M</text>

                <line x1="435" y1="70" x2="510" y2="70" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="435" y1="70" x2="510" y2="70" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#recon-arr-green)" />

                <rect x="515" y="40" width="140" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="585" y="66" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">EOD Closing Sweep</text>
                <text x="585" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">${closingBal}M Final</text>
              </g>
            )}
          </svg>
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
                Fixed 120-Byte Record Specification
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
                Rules engine matches on UETR, EndToEndId, Amount, Value Date, and Account numbers.
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Intraday Liquidity Calculator */}
        {activeTab === 'liquidity' && (
          <div>
            <div className="recon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  Opening Nostro Balance:
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>${openingBal}M</div>
                <input
                  type="range"
                  min={100}
                  max={1000}
                  step={50}
                  value={openingBal}
                  onChange={e => setOpeningBal(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px', accentColor: '#38bdf8' }}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  Intraday Inflows (+):
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>+${inflow}M</div>
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={20}
                  value={inflow}
                  onChange={e => setInflow(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px', accentColor: '#34d399' }}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  Intraday Outflows (-):
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171' }}>-${outflow}M</div>
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={20}
                  value={outflow}
                  onChange={e => setOutflow(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px', accentColor: '#f87171' }}
                />
              </div>
            </div>

            <div style={{
              background: surplusDeficit >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
              border: `1px solid ${surplusDeficit >= 0 ? '#34d399' : '#f87171'}`,
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: surplusDeficit >= 0 ? '#34d399' : '#f87171' }}>
                    PROJECTED CLOSING BALANCE: ${closingBal}M (Target Reserve: ${targetReserve}M)
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)', marginTop: '2px' }}>
                    {surplusDeficit >= 0 ? `Surplus of +$${surplusDeficit}M ➔ Automatic Overnight MM Sweep` : `Deficit of -$${Math.abs(surplusDeficit)}M ➔ Trigger Intraday Liquidity Facility (ILF)`}
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
