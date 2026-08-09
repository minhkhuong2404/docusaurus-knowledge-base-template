import React, { useState } from 'react';

export default function BankingClearingSettlementDiagram(): React.JSX.Element {
  const [activeModel, setActiveModel] = useState<'dns' | 'rtgs'>('dns');

  // Calculator State
  const [abTransfer, setAbTransfer] = useState<number>(1000000);
  const [baTransfer, setBaTransfer] = useState<number>(600000);
  const [acTransfer, setAcTransfer] = useState<number>(400000);
  const [caTransfer, setCaTransfer] = useState<number>(200000);
  const [bcTransfer, setBcTransfer] = useState<number>(100000);

  // Multilateral Net Calculations
  // Bank A: pays B (1M), pays C (400k), receives B (600k), receives C (200k)
  const bankANet = -abTransfer - acTransfer + baTransfer + caTransfer;
  // Bank B: receives A (1M), pays A (600k), pays C (100k)
  const bankBNet = abTransfer - baTransfer - bcTransfer;
  // Bank C: receives A (400k), pays A (200k), receives B (100k)
  const bankCNet = acTransfer - caTransfer + bcTransfer;

  const totalGrossVolume = abTransfer + baTransfer + acTransfer + caTransfer + bcTransfer;
  const totalNetLiquidity = (Math.abs(bankANet) + Math.abs(bankBNet) + Math.abs(bankCNet)) / 2;
  const liquiditySavingsPct = Math.round(((totalGrossVolume - totalNetLiquidity) / totalGrossVolume) * 100);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .clearing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Clearing & Settlement Architecture & Multilateral Netting Calculator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Model Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveModel('dns')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              background: activeModel === 'dns' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeModel === 'dns' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeModel === 'dns' ? '0 0 0 1.5px #fbbf24' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease'
            }}
          >
            📊 Deferred Net Settlement (DNS - BECS / BPAY)
          </button>
          <button
            onClick={() => setActiveModel('rtgs')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              background: activeModel === 'rtgs' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeModel === 'rtgs' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeModel === 'rtgs' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease'
            }}
          >
            ⚡ Real-Time Gross Settlement (RTGS - NPP / RITS)
          </button>
        </div>

        {/* Model Overview Card */}
        {activeModel === 'dns' ? (
          <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>
              Deferred Net Settlement (DNS) Mechanics
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              Payments are queued and batched during settlement windows. The Clearing House nets all bilateral obligations multilaterally, requiring central bank money (ESA) transfers <strong>only for the net residual difference</strong> at cut-off times.
            </div>
          </div>
        ) : (
          <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
              Real-Time Gross Settlement (RTGS) Mechanics
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              Every transaction is settled individually and continuously in real time across Reserve Bank Exchange Settlement Accounts (ESA). Settlement is final and irrevocable, eliminating credit risk but requiring high intraday ESA liquidity.
            </div>
          </div>
        )}

        {/* Multilateral Netting Interactive Calculator */}
        <div className="clearing-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
          {/* Controls Panel */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>INTERBANK BILATERAL PAYMENTS</span>
              <span>GROSS TOTAL: ${(totalGrossVolume / 1000).toFixed(0)}k</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Bank A ➔ Bank B ($)', val: abTransfer, set: setAbTransfer },
                { label: 'Bank B ➔ Bank A ($)', val: baTransfer, set: setBaTransfer },
                { label: 'Bank A ➔ Bank C ($)', val: acTransfer, set: setAcTransfer },
                { label: 'Bank C ➔ Bank A ($)', val: caTransfer, set: setCaTransfer },
                { label: 'Bank B ➔ Bank C ($)', val: bcTransfer, set: setBcTransfer }
              ].map((inp, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>{inp.label}</label>
                  <input
                    type="number"
                    step="50000"
                    value={inp.val}
                    onChange={e => inp.set(Number(e.target.value))}
                    style={{
                      width: '110px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: '#090b14',
                      color: '#34d399',
                      fontSize: '11px',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Results Panel */}
          <div className="interactive-diagram-details-card details-yellow" style={{ minHeight: '260px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '10px' }}>
              MULTILATERAL NET SETTLEMENT RESULTS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {/* Bank A Net */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: bankANet < 0 ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)', border: `1px solid ${bankANet < 0 ? '#f87171' : '#34d399'}` }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Bank A Net Position</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: bankANet < 0 ? '#f87171' : '#34d399' }}>
                  {bankANet < 0 ? `- $${Math.abs(bankANet).toLocaleString()} (PAYER)` : `+ $${bankANet.toLocaleString()} (RECEIVER)`}
                </span>
              </div>

              {/* Bank B Net */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: bankBNet < 0 ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)', border: `1px solid ${bankBNet < 0 ? '#f87171' : '#34d399'}` }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Bank B Net Position</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: bankBNet < 0 ? '#f87171' : '#34d399' }}>
                  {bankBNet < 0 ? `- $${Math.abs(bankBNet).toLocaleString()} (PAYER)` : `+ $${bankBNet.toLocaleString()} (RECEIVER)`}
                </span>
              </div>

              {/* Bank C Net */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: bankCNet < 0 ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)', border: `1px solid ${bankCNet < 0 ? '#f87171' : '#34d399'}` }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Bank C Net Position</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: bankCNet < 0 ? '#f87171' : '#34d399' }}>
                  {bankCNet < 0 ? `- $${Math.abs(bankCNet).toLocaleString()} (PAYER)` : `+ $${bankCNet.toLocaleString()} (RECEIVER)`}
                </span>
              </div>
            </div>

            {/* Liquidity Efficiency Metric */}
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                <span>Gross Transfers Required (RTGS): 5 transfers</span>
                <span>Net Settlements Required (DNS): 3 transfers</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                Liquidity Saving Efficiency: {liquiditySavingsPct}% Liquidity Conserved
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
