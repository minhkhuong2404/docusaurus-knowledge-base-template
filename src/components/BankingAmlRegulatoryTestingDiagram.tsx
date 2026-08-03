import React, { useState } from 'react';

const REG_REPORTS = [
  { code: 'SMR', name: 'Suspicious Matter Report', trigger: 'Any transaction or behavior suspecting money laundering, fraud, or tax evasion', dest: 'AUSTRAC / FinCEN' },
  { code: 'TTR', name: 'Threshold Transaction Report', trigger: 'Physical cash transactions of $10,000 AUD / USD or more', dest: 'AUSTRAC / FinCEN' },
  { code: 'IFTI', name: 'International Funds Transfer Instruction', trigger: 'Any inbound or outbound cross-border payment instruction regardless of amount', dest: 'AUSTRAC / Financial Intelligence Unit' }
];

export default function BankingAmlRegulatoryTestingDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'aml' | 'reg' | 'test'>('aml');
  const [kycRiskScore, setKycRiskScore] = useState<number>(35); // 0-100 risk

  const riskTier = kycRiskScore >= 70 ? 'HIGH RISK (Enhanced Due Diligence EDD)' : kycRiskScore >= 40 ? 'MEDIUM RISK (Standard Due Diligence SDD)' : 'LOW RISK (Simplified Due Diligence)';
  const riskColor = kycRiskScore >= 70 ? '#f87171' : kycRiskScore >= 40 ? '#fbbf24' : '#34d399';

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .aml-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          AML/CTF Transaction Monitoring, Regulatory Reporting & Test Harness Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'aml', label: '🛡️ Customer Risk Rating (KYC / EDD) Simulator', color: '#fbbf24' },
            { id: 'reg', label: '📊 Automated Regulatory Filing Matrix (SMR / TTR / IFTI)', color: '#38bdf8' },
            { id: 'test', label: '🧪 Synthetic Scheme Testing & Negative Test Suites', color: '#34d399' }
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

        {/* Tab 1: KYC Risk Simulator */}
        {activeTab === 'aml' && (
          <div className="aml-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '12px' }}>
                CUSTOMER KYC RISK CALCULATOR
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  CUSTOMER COMPOSITE RISK SCORE: <span style={{ color: riskColor }}>{kycRiskScore} / 100</span>
                </label>
                <input type="range" min="10" max="95" step="5" value={kycRiskScore} onChange={e => setKycRiskScore(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                Evaluates PEP (Politically Exposed Persons) status, high-risk jurisdiction, transaction volume, and beneficial ownership transparency.
              </div>
            </div>

            <div className="interactive-diagram-details-card details-yellow">
              <div style={{ fontSize: '11px', fontWeight: 700, color: riskColor, textTransform: 'uppercase', marginBottom: '6px' }}>
                DUE DILIGENCE REQUIREMENT
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: riskColor, marginBottom: '8px' }}>
                {riskTier}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                {kycRiskScore >= 70 ? 'Requires source of wealth verification, senior management sign-off, and continuous transaction monitoring.' : 'Standard automated verification via biometric passport / driver license database.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Regulatory Filing */}
        {activeTab === 'reg' && (
          <div className="aml-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {REG_REPORTS.map(r => (
              <div key={r.code} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>{r.code}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{r.name}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{r.trigger}</div>
                <div style={{ fontSize: '9.5px', color: '#fbbf24', marginTop: '6px' }}>Filing Target: {r.dest}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Testing */}
        {activeTab === 'test' && (
          <div className="aml-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>1. Synthetic ISO Simulator</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                Generates valid pacs.008 XML payloads with random UETRs to load-test payment hub.
              </div>
            </div>

            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>2. Negative Test Suite</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                Injects invalid accounts (AC01), corrupted tags, and sanctions hits to verify exception handling.
              </div>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>3. Mock Clearing Network</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                Simulates NPP / SWIFT network responses (pacs.002 ACCP/RJCT) in isolated staging environments.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
