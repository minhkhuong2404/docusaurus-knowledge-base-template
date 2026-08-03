import React, { useState } from 'react';

const MT_VS_MX = [
  { mt: ':20: TxRef', mx: 'CdtTrfTxInf/PmtId/InstrId', desc: 'Unique payment instruction reference' },
  { mt: ':21: RelatedRef', mx: 'CdtTrfTxInf/PmtId/EndToEndId', desc: 'End-to-end transaction tracking ID (E2E)' },
  { mt: ':32A: Amount', mx: 'IntrBkSttlmAmt + IntrBkSttlmDt', desc: 'Interbank settlement amount & date' },
  { mt: ':50K: Ordering Customer', mx: 'Dbtr/Nm + DbtrAcct/Id + Dbtr/PstlAdr', desc: 'Payer name, account number & full address' },
  { mt: ':52A: Ordering Institution', mx: 'DbtrAgt/FinInstnId/BICFI + LEI', desc: 'Debtor bank BIC + Legal Entity Identifier' },
  { mt: ':59: Beneficiary Customer', mx: 'Cdtr/Nm + CdtrAcct/Id + Cdtr/PstlAdr', desc: 'Payee name, account number & full address' },
  { mt: ':70: Remittance Info', mx: 'RmtInf/Strd (Invoice, Tax, Discounts)', desc: 'Unstructured 140 chars vs Rich Structured Remittance' },
  { mt: ':71A: Details of Charges', mx: 'ChrgBr (DEBT / CRED / SHAR)', desc: 'Charge bearer (OUR -> DEBT, BEN -> CRED, SHA -> SHAR)' }
];

export default function Iso20022MigrationDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'mapping' | 'remittance' | 'truncation' | 'timeline'>('mapping');
  const [selectedField, setSelectedField] = useState<number | null>(0);
  const [remittanceText, setRemittanceText] = useState<string>('INV-2026-8809');

  const activeFieldData = selectedField !== null ? MT_VS_MX[selectedField] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .iso-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          SWIFT ISO 20022 Migration (MT to MX) Interactive Explorer
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'mapping', label: '🔄 MT103 ↔ pacs.008 Mapping', color: '#38bdf8' },
            { id: 'remittance', label: '📄 Remittance (Unstructured vs Structured)', color: '#34d399' },
            { id: 'truncation', label: '⚠️ Data Truncation Risk Engine', color: '#f87171' },
            { id: 'timeline', label: '📅 Global Co-Existence Timeline', color: '#a78bfa' }
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
                fontWeight: 600,
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

        {/* Tab 1: Mapping Matrix */}
        {activeTab === 'mapping' && (
          <div className="iso-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT FIELD PAIR TO INSPECT:
              </div>
              {MT_VS_MX.map((item, idx) => {
                const isSel = selectedField === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedField(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '7px',
                      background: isSel ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <code style={{ fontSize: '11px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.mt.split(' ')[0]}
                      </code>
                      <span style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>
                        ➔ {item.mx.split('/')[item.mx.split('/').length - 1]}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#34d399' }}>Inspect ➔</span>
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '320px' }}>
              {activeFieldData ? (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Field Translation Specification
                  </div>

                  <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700 }}>LEGACY SWIFT MT FIELD</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)', marginTop: '2px' }}>
                      {activeFieldData.mt}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>ISO 20022 MX XSD PATH</div>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#34d399', marginTop: '2px', wordBreak: 'break-all' }}>
                      {activeFieldData.mx}
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                    <strong>Purpose:</strong> {activeFieldData.desc}
                  </div>

                  <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                    💡 <strong>Migration Tip:</strong> ISO 20022 introduces structured sub-elements for names, addresses (BuildingNo, StrtNm, PstCd, Ctry), and Legal Entity Identifiers (LEI) to replace unstructured text blocks.
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Tab 2: Remittance Comparison */}
        {activeTab === 'remittance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              Legacy SWIFT MT103 field <code>:70:</code> allows only 140 characters of unstructured free text. ISO 20022 <code>&lt;RmtInf&gt;</code> supports fully structured invoice, discount, and tax breakdowns enabling 100% automated ERP reconciliation.
            </div>

            <div className="iso-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Legacy MT103 */}
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '8px' }}>
                  ❌ Legacy MT103 Field :70: (Unstructured 140 Chars)
                </div>
                <pre style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fbbf24', fontSize: '11px', margin: 0 }}>
                  :70:/INV/20260803/USD5000 NET OF 2% DISC REF {remittanceText}
                </pre>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '8px' }}>
                  ⚠️ Requires manual human review to extract invoice number and discount calculation.
                </div>
              </div>

              {/* Modern ISO 20022 */}
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
                  ✅ ISO 20022 &lt;RmtInf&gt; (Structured XML Schema)
                </div>
                <pre style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#34d399', fontSize: '10.5px', margin: 0, overflowX: 'auto' }}>
{`<RmtInf>
  <Strd>
    <RfrdDocInf>
      <Tp><CdOrPrtry><Cd>CINV</Cd></CdOrPrtry></Tp>
      <Nb>${remittanceText}</Nb>
      <RltdDt>2026-08-03</RltdDt>
    </RfrdDocInf>
    <RfrdDocAmt>
      <DuePyblAmt Ccy="AUD">5000.00</DuePyblAmt>
      <DscntApldAmt Ccy="AUD">100.00</DscntApldAmt>
      <RmtdAmt Ccy="AUD">4900.00</RmtdAmt>
    </RfrdDocAmt>
  </Strd>
</RmtInf>`}
                </pre>
                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '8px' }}>
                  ⚡ Auto-matched by ERP ledger engine instantly without human intervention.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Truncation Risk Engine */}
        {activeTab === 'truncation' && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '6px' }}>
              ⚠️ Data Truncation Hazard (MX ➔ MT Translation)
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 14px' }}>
              During the co-existence period, if a modern ISO 20022 message is sent to a legacy MT system, long rich fields are truncated to fit 35-character limits.
            </p>

            <div style={{ background: '#090b14', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>ISO 20022 Full Creditor Name (140 chars max):</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', margin: '4px 0 10px' }}>
                "International Widget Manufacturing & Global Logistics Corporation Proprietary Limited"
              </div>

              <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700 }}>SWIFT MT103 Field :59: Truncated Result (35 chars max):</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginTop: '4px', fontFamily: 'monospace' }}>
                "International Widget Manufacturi"
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171' }}>1. Sanctions Failure</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Fuzzy screening misses sanctioned suffix or triggers false positive.</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>2. Account Mismatch</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Creditor Bank rejects payment because truncated name does not match account title.</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>3. SWIFT Mitigation</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>SWIFT Translator uses structured LEI & BIC headers to preserve identity.</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Timeline */}
        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { date: 'Nov 2021', title: 'SWIFT gpi Co-Existence Begins', desc: 'MT and MX messages both accepted on SWIFT network.', status: 'COMPLETED', color: '#34d399' },
              { date: 'Nov 2022', title: 'Full Cross-Border MX Go-Live', desc: 'pacs.008, pacs.009, pacs.004 ISO 20022 messaging live across major banks.', status: 'COMPLETED', color: '#34d399' },
              { date: 'Mar 2023', title: 'Mandatory UETR Tracking', desc: 'UETR (Unique End-to-End Transaction Reference) required on all messages.', status: 'COMPLETED', color: '#34d399' },
              { date: 'Nov 2025', title: 'Final SWIFT MT Decommissioning', desc: 'Cross-border MT103, MT202, MT940 retired. 100% ISO 20022 MX mandatory.', status: 'CRITICAL MILESTONE', color: '#f87171' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${item.color}40` }}>
                <div style={{ minWidth: '85px', fontSize: '12px', fontWeight: 800, color: item.color }}>{item.date}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{item.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: item.color, background: `${item.color}15`, padding: '3px 8px', borderRadius: '4px' }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
