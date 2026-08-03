import React, { useState } from 'react';

export default function BankingCorePostingAccountingDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'posting' | 'accounting' | 'onoffus'>('posting');
  const [initialBalance, setInitialBalance] = useState<number>(1000); // $1000
  const [pendingHold, setPendingHold] = useState<number>(200); // $200 card pre-auth
  const [newTransaction, setNewTransaction] = useState<number>(150); // $150 transaction

  const bookedBalance = initialBalance;
  const availableBalance = initialBalance - pendingHold - newTransaction;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .posting-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Core Banking Ledger Posting Engine & Double-Entry Accounting Matrix
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'posting', label: '🧮 Real-Time Ledger Balance Simulator (Booked vs Available)', color: '#34d399' },
            { id: 'accounting', label: '⚖️ Double-Entry Accounting & Ledger Posting Matrix', color: '#38bdf8' },
            { id: 'onoffus', label: '🔁 On-Us (Internal) vs Off-Us (Interbank) Pipeline', color: '#fbbf24' }
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

        {/* Tab 1: Balance Simulator */}
        {activeTab === 'posting' && (
          <div className="posting-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '12px' }}>
                CUSTOMER ACCOUNT LEDGER CONTROLS
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  INITIAL BOOKED LEDGER BALANCE: <span style={{ color: '#38bdf8' }}>${initialBalance}</span>
                </label>
                <input type="range" min="500" max="5000" step="100" value={initialBalance} onChange={e => setInitialBalance(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  PENDING AUTHORIZATION HOLDS: <span style={{ color: '#fbbf24' }}>${pendingHold}</span>
                </label>
                <input type="range" min="0" max="500" step="50" value={pendingHold} onChange={e => setPendingHold(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  NEW OUTBOUND PAYMENT REQUEST: <span style={{ color: '#f87171' }}>${newTransaction}</span>
                </label>
                <input type="range" min="50" max="1000" step="50" value={newTransaction} onChange={e => setNewTransaction(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>
            </div>

            <div className="interactive-diagram-details-card details-green">
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '10px' }}>
                REAL-TIME BALANCE IMPACT
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Booked Ledger Balance (EOD):</span>
                  <span style={{ fontWeight: 800, color: '#38bdf8' }}>${bookedBalance}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Available Balance (Real-Time):</span>
                  <span style={{ fontWeight: 800, color: availableBalance >= 0 ? '#34d399' : '#f87171' }}>
                    ${availableBalance}
                  </span>
                </div>
              </div>

              <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>FUNDS AVAILABILITY DECISION</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: availableBalance >= 0 ? '#34d399' : '#f87171', marginTop: '2px' }}>
                  {availableBalance >= 0 ? '✅ APPROVED (Sufficient Funds)' : '❌ REJECTED (Insufficient Funds AM04)'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Double-Entry Matrix */}
        {activeTab === 'accounting' && (
          <div className="posting-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>1. Customer Debit Posting</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                <code>DEBIT: Customer Checking Account (Liability Account ↓)</code><br />
                Subtracts funds from customer balance in core banking database.
              </p>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>2. Interbank Settlement Credit</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                <code>CREDIT: Central Bank ESA Account / Nostro Account (Asset Account ↑)</code><br />
                Increases settled funds held at settlement house.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: On-Us vs Off-Us */}
        {activeTab === 'onoffus' && (
          <div className="posting-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>On-Us Payment (Internal Transfer)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                Payer and payee both hold accounts at the <strong>same bank</strong>. Instant ledger balance update within Core Banking. No clearing house or scheme fees incurred.
              </p>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>Off-Us Payment (Interbank Transfer)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                Payer and payee hold accounts at <strong>different financial institutions</strong>. Payment must route through external scheme rail (NPP, BECS, SWIFT) and undergo interbank clearing & settlement.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
