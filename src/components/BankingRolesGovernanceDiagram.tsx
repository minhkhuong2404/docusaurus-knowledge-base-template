import React, { useState } from 'react';

const DEFENCE_LINES = [
  {
    line: '1st Line: Business & Technology (Owns & Manages Risk)',
    color: '#38bdf8',
    roles: ['Payments Engineering', 'Payments Operations', 'Core Banking Team', 'Product Owners'],
    desc: 'Day-to-day risk ownership. Executes transactions, builds resilient systems, enforces inline automated validation controls, and manages payment exceptions.',
    accountability: 'Direct P&L and operational accountability. Must operate within risk appetite set by 2nd line.'
  },
  {
    line: '2nd Line: Risk & Compliance (Independent Oversight & Rules)',
    color: '#fbbf24',
    roles: ['Compliance & MLRO', 'Financial Crime (AML/Sanctions)', 'Operational Risk', 'Cyber Security (CISO)'],
    desc: 'Sets risk management frameworks, compliance policies, and threshold limits. Conducts independent monitoring and challenges 1st line decisions.',
    accountability: 'Reports independently to CRO and Board Risk Committee. Has veto power over non-compliant releases.'
  },
  {
    line: '3rd Line: Internal Audit (Independent Assurance)',
    color: '#a78bfa',
    roles: ['Internal Audit Team', 'External Regulators (APRA, AUSTRAC, ASIC)'],
    desc: 'Provides independent, objective assurance to the Board Audit Committee on the effectiveness of 1st and 2nd line risk management controls.',
    accountability: 'Direct reporting line to the Board Audit Committee. Completely detached from executive management.'
  }
];

const AGILE_POD_ROLES = [
  { role: 'Payment Tech Lead / Senior Dev', focus: 'Architecture, non-blocking I/O, idempotency, Zero Downtime deployments.' },
  { role: 'Product Owner (Payments)', focus: 'Backlog prioritization, scheme mandate compliance, business value delivery.' },
  { role: 'Payment Ops SME', focus: 'Exception handling workflows, straight-through processing (STP) optimization.' },
  { role: 'Compliance Champion (2nd Line)', focus: 'Sanctions, AML, and regulatory audit trail sign-offs within sprint.' },
  { role: 'QA & Synthetic Test Engineer', focus: 'ISO 20022 message validation, mock scheme simulators, negative testing.' }
];

export default function BankingRolesGovernanceDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'defence' | 'agile' | 'escalation'>('defence');
  const [selectedLine, setSelectedLine] = useState<number>(0);

  const currLine = DEFENCE_LINES[selectedLine];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .roles-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Three Lines of Defence Risk Governance & Agile Payment Pod Topology
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'defence', label: '🛡️ Three Lines of Defence Governance (APRA CPS 230)', color: '#38bdf8' },
            { id: 'agile', label: '🚀 Agile Payment Pod Structure & Non-Functional Requirements', color: '#34d399' },
            { id: 'escalation', label: '🚨 Incident & Compliance Escalation Matrix', color: '#f87171' }
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

        {/* Tab 1: Three Lines of Defence */}
        {activeTab === 'defence' && (
          <div className="roles-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT LINE OF DEFENCE TO INSPECT:
              </div>

              {DEFENCE_LINES.map((line, idx) => {
                const isSel = idx === selectedLine;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedLine(idx)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: isSel ? `${line.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? line.color : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: isSel ? line.color : 'var(--ifm-color-content)' }}>
                      {line.line}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {line.roles.map(r => (
                        <code key={r} style={{ fontSize: '9.5px', background: `${line.color}15`, color: line.color, padding: '2px 5px', borderRadius: '4px' }}>
                          {r}
                        </code>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Line Details Card */}
            <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '280px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: currLine.color, textTransform: 'uppercase', marginBottom: '6px' }}>
                Governance & Regulatory Framework
              </div>

              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {currLine.line}
              </div>

              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
                {currLine.desc}
              </p>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Accountability & APRA CPS 230 Standard</div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: currLine.color, marginTop: '2px' }}>
                  {currLine.accountability}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Agile Payment Pod */}
        {activeTab === 'agile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              Agile Payment Engineering Pods operate under strict <strong>Non-Functional Requirements (NFRs)</strong>: 99.999% availability, sub-second latency, zero-downtime blue-green deployments, and mandatory dual-control approvals.
            </div>

            <div className="roles-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
                  👥 Cross-Functional Pod Composition
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {AGILE_POD_ROLES.map((r, idx) => (
                    <div key={idx} style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>
                      <strong>• {r.role}:</strong> <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{r.focus}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
                  🎯 Payment NFRs & Definition of Done (DoD)
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                  <li><strong>Idempotency Guaranteed:</strong> Unit/integration tests verify duplicate payload retry resilience.</li>
                  <li><strong>Synthetic Scheme Testing:</strong> Passes NPP / SWIFT simulator test suite without error.</li>
                  <li><strong>Audit Logging:</strong> Every state change logged with immutable trace IDs (UETR / EndToEndId).</li>
                  <li><strong>Compliance Sign-off:</strong> Sanctions & AML rules approved by 2nd Line Compliance.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Escalation Matrix */}
        {activeTab === 'escalation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { situation: 'NPP / RITS Scheme Outage', team: 'Scheme Operations + Tech On-Call', action: 'Failover to standby rail / queue messages', line: '1st Line' },
              { situation: 'Confirmed Sanctions Match (SDN Hit)', team: 'Compliance Manager / MLRO', action: 'Freeze account, block payment, file SMR with AUSTRAC', line: '2nd Line' },
              { situation: 'Payment Idempotency Defect / Duplicate Posting', team: 'Payments Tech Lead + Core Banking Ops', action: 'Trigger automated debit reversal (pacs.007) & hotfix', line: '1st Line' },
              { situation: 'Regulatory Audit Finding (APRA CPS 230)', team: 'Internal Audit + Chief Risk Officer', action: 'Formulate remediation plan within 30 days', line: '3rd Line' }
            ].map((esc, idx) => (
              <div key={idx} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>{esc.situation}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Contact: {esc.team} • Action: {esc.action}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                  {esc.line}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
