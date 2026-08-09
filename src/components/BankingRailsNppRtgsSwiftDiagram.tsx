import React, { useState } from 'react';

const RAILS = [
  {
    id: 'npp',
    name: 'NPP (New Payments Platform / Osko)',
    speed: 'Sub-Second Real-Time (24/7/365)',
    settlement: 'Real-Time Gross Settlement via Fast Settlement Service (FSS)',
    data: 'ISO 20022 Native (pacs.008 / PayTo pain.001)',
    desc: 'Australia’s modern real-time instant payment rail supporting PayID aliases, 280-character descriptions, and PayTo digital mandates.'
  },
  {
    id: 'swift',
    name: 'SWIFT gpi (Cross-Border Payments)',
    speed: 'Minutes to Hours (End-to-end tracked)',
    settlement: 'Correspondent Nostro / Vostro Accounts',
    data: 'ISO 20022 MX (pacs.008) replacing legacy MT103',
    desc: 'Global messaging network connecting 11,000+ financial institutions worldwide with transparent SLA tracking via UETR.'
  },
  {
    id: 'rtgs',
    name: 'RTGS / RITS (High-Value Wholesale)',
    speed: 'Real-Time Immediate',
    settlement: 'Central Bank Exchange Settlement Account (ESA)',
    data: 'ISO 20022 (pacs.009 / pacs.008 HVCS)',
    desc: 'High-value, time-critical interbank settlement system processing systemic wholesale transactions without credit risk.'
  },
  {
    id: 'bpay',
    name: 'BPAY (Bill Payment Network)',
    speed: 'Same-day / Next-day Batch',
    settlement: 'Deferred Net Settlement (DNS)',
    data: 'Biller Code + Customer Reference Number (CRN)',
    desc: 'Australian bill payment system allowing consumers to pay utilities, taxes, and invoices using Biller Codes.'
  }
];

export default function BankingRailsNppRtgsSwiftDiagram(): React.JSX.Element {
  const [activeRailId, setActiveRailId] = useState<string>('npp');
  const [activeTab, setActiveTab] = useState<'rails' | 'matrix' | 'translation'>('rails');

  const currRail = RAILS.find(r => r.id === activeRailId)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .rails-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Global Payment Rails Explorer (NPP vs SWIFT gpi vs RTGS vs BPAY)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'rails', label: '🌐 Payment Rails Architecture Switcher', color: '#38bdf8' },
            { id: 'matrix', label: '⚡ Settlement & Latency Comparison Matrix', color: '#34d399' },
            { id: 'translation', label: '🔄 ISO 20022 MX vs Legacy MT Message Mapping', color: '#fbbf24' }
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

        {/* Tab 1: Rails Architecture */}
        {activeTab === 'rails' && (
          <div className="rails-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT PAYMENT RAIL:
              </div>

              {RAILS.map(r => {
                const isSel = r.id === activeRailId;
                return (
                  <div
                    key={r.id}
                    onClick={() => setActiveRailId(r.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSel ? '#38bdf8' : 'var(--ifm-color-content)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {r.name}
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Rail Specifications & Topology
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {currRail.name}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                {currRail.desc}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                <div><strong>Speed:</strong> <span style={{ color: '#34d399' }}>{currRail.speed}</span></div>
                <div><strong>Settlement:</strong> <span style={{ color: '#fbbf24' }}>{currRail.settlement}</span></div>
                <div><strong>Data Standard:</strong> <code style={{ color: '#38bdf8' }}>{currRail.data}</code></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Latency & Settlement Matrix */}
        {activeTab === 'matrix' && (
          <div className="rails-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            {[
              { rail: 'NPP Osko', latency: '< 500ms', cutoff: 'None (24/7/365)', risk: 'Zero Credit Risk' },
              { rail: 'RTGS / RITS', latency: '< 2 seconds', cutoff: '17:15 AEST Cut-off', risk: 'Zero Credit Risk' },
              { rail: 'BECS Direct Entry', latency: '2-4 Hours (Batch)', cutoff: '5 Daily Sessions', risk: 'Overnight Credit Risk' },
              { rail: 'SWIFT gpi', latency: '5-30 Minutes', cutoff: 'Bank Specific', risk: 'Nostro Liquidity Risk' }
            ].map(m => (
              <div key={m.rail} style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>{m.rail}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>Latency: {m.latency}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Cut-off: {m.cutoff}</div>
                <div style={{ fontSize: '10px', color: '#fbbf24', marginTop: '4px' }}>{m.risk}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Message Mapping */}
        {activeTab === 'translation' && (
          <div className="rails-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { legacy: 'SWIFT MT103 (Single Customer)', iso: 'pacs.008.001.10', notes: 'Includes UETR, structured remittance, and detailed postal address' },
              { legacy: 'SWIFT MT202 (Bank Transfer)', iso: 'pacs.009.001.09', notes: 'Interbank financial institution transfer without customer info' },
              { legacy: 'SWIFT MT940 (End of Day Statement)', iso: 'camt.053.001.08', notes: 'Detailed account statement containing booked balance & entry details' }
            ].map(map => (
              <div key={map.legacy} style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171' }}>Legacy: {map.legacy}</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', margin: '4px 0' }}>ISO 20022: {map.iso}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>{map.notes}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
