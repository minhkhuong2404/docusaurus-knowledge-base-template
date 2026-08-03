import React, { useState } from 'react';

export default function BankingCardPaymentFlowDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'auth' | 'fee' | 'chargeback'>('auth');
  const [saleAmount, setSaleAmount] = useState<number>(100);
  const [lcrEnabled, setLcrEnabled] = useState<boolean>(false);

  // Fee Calculation
  // Standard Visa/MC: MDR = 1.1% (Interchange 0.6%, Scheme 0.3%, Acquirer 0.2%)
  // eftpos (LCR): MDR = 0.3% (Interchange 0.15%, Scheme 0.05%, Acquirer 0.10%)
  const interchangeRate = lcrEnabled ? 0.0015 : 0.006;
  const schemeRate = lcrEnabled ? 0.0005 : 0.003;
  const acquirerRate = lcrEnabled ? 0.0010 : 0.002;

  const interchangeFee = saleAmount * interchangeRate;
  const schemeFee = saleAmount * schemeRate;
  const acquirerMargin = saleAmount * acquirerRate;
  const mdrTotal = interchangeFee + schemeFee + acquirerMargin;
  const merchantPayout = saleAmount - mdrTotal;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          4-Party Card Payment Scheme & Interchange Fee Engine
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'auth', label: '💳 4-Party Model & Auth Flow', color: '#38bdf8' },
            { id: 'fee', label: '🧮 MDR & Interchange Fee Calculator', color: '#34d399' },
            { id: 'chargeback', label: '🛡️ Chargeback & Dispute Lifecycle', color: '#f87171' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
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

        {/* Tab 1: 4-Party Model */}
        {activeTab === 'auth' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px', textAlignment: 'center' }}>
              {[
                { title: '1. Cardholder', sub: 'Payer / Customer', color: '#38bdf8' },
                { title: '2. Merchant', sub: 'POS / Online Store', color: '#fbbf24' },
                { title: '3. Acquirer Bank', sub: "Merchant's Bank", color: '#a78bfa' },
                { title: '4. Scheme Network', sub: 'Visa / Mastercard', color: '#f97316' },
                { title: '5. Issuer Bank', sub: "Customer's Bank", color: '#34d399' }
              ].map((node, idx) => (
                <div key={idx} style={{ background: `${node.color}15`, border: `1px solid ${node.color}50`, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: node.color }}>{node.title}</div>
                  <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>{node.sub}</div>
                </div>
              ))}
            </div>

            <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
                  ⚡ Step 1: Real-Time Authorization (Sub-Second)
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                  <li>Cardholder taps card at POS terminal.</li>
                  <li>POS forwards Auth Request to Acquiring Bank.</li>
                  <li>Acquirer passes to Card Scheme Network (Visa/MC).</li>
                  <li>Scheme routes to Issuing Bank.</li>
                  <li>Issuing Bank checks CVV/3DS, PIN, & places a <strong>HOLD</strong> on funds.</li>
                  <li>Returns 6-digit Auth Code back through chain to terminal.</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
                  🌙 Step 2: Clearing & Settlement (Overnight Batch)
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                  <li>Merchant submits end-of-day batch of Auth Codes to Acquirer.</li>
                  <li>Acquirer sends clearing records to Scheme.</li>
                  <li>Scheme calculates net interchange fees & notifies Issuer.</li>
                  <li>Issuer converts account hold into a <strong>final ledger debit</strong>.</li>
                  <li>Acquirer credits Merchant account (net of MDR fee).</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Fee Calculator */}
        {activeTab === 'fee' && (
          <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginBottom: '12px' }}>
                TRANSACTION FEE CONTROLS
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  PURCHASE SALE AMOUNT ($):
                </label>
                <input
                  type="number"
                  value={saleAmount}
                  onChange={e => setSaleAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: '#090b14',
                    color: '#34d399',
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              {/* LCR Switcher */}
              <div style={{ background: 'rgba(56,189,248,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>Least-Cost Routing (LCR / eftpos)</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Route debit card over domestic eftpos rail</div>
                  </div>
                  <button
                    onClick={() => setLcrEnabled(!lcrEnabled)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: lcrEnabled ? '#34d399' : 'rgba(255,255,255,0.1)',
                      color: lcrEnabled ? '#090b14' : 'var(--ifm-color-content)'
                    }}
                  >
                    {lcrEnabled ? 'ON (eftpos)' : 'OFF (Visa/MC)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Fee Breakdown Card */}
            <div className="interactive-diagram-details-card details-green">
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '10px' }}>
                MERCHANT DISCOUNT RATE (MDR) BREAKDOWN
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>1. Interchange Fee (to Issuer Bank):</span>
                  <span style={{ fontWeight: 700, color: '#fbbf24' }}>${interchangeFee.toFixed(2)} ({(interchangeRate * 100).toFixed(2)}%)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>2. Scheme Fee (to Visa / MC / eftpos):</span>
                  <span style={{ fontWeight: 700, color: '#f97316' }}>${schemeFee.toFixed(2)} ({(schemeRate * 100).toFixed(2)}%)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>3. Acquirer Margin (to Acquirer Bank):</span>
                  <span style={{ fontWeight: 700, color: '#a78bfa' }}>${acquirerMargin.toFixed(2)} ({(acquirerRate * 100).toFixed(2)}%)</span>
                </div>
              </div>

              <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>NET MERCHANT PAYOUT</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>${merchantPayout.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>TOTAL MDR COST</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#f87171' }}>-${mdrTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Chargeback Lifecycle */}
        {activeTab === 'chargeback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { step: '1. Customer Dispute', desc: 'Cardholder contacts Issuer: "I did not recognize this $500 payment".', code: 'Reason 10.4 (CNP Fraud)' },
              { step: '2. Provisional Credit & Chargeback', desc: 'Issuer gives customer provisional credit and submits Chargeback via Scheme.', code: 'Scheme Dispute Message' },
              { step: '3. Acquirer & Merchant Notice', desc: 'Acquirer receives chargeback, provisional debits merchant account, notifies merchant.', code: 'Representment Window' },
              { step: '4. Merchant Evidence / Accept', desc: 'Merchant uploads Proof of Delivery / Signed Receipt / 3DS Auth logs to dispute.', code: 'Compelling Evidence' },
              { step: '5. Arbitration', desc: 'Scheme rules on dispute. Winning party gets final settled funds.', code: 'Final Resolution' }
            ].map((c, idx) => (
              <div key={idx} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>{c.step}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>{c.desc}</div>
                </div>
                <code style={{ fontSize: '10px', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {c.code}
                </code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
