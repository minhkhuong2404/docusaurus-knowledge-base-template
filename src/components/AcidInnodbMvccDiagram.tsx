import React, { useState } from 'react';

interface VersionStep {
  step: number;
  balance: number;
  trxId: number;
  rollPtr: string;
  isReadViewVisible: boolean;
  explanation: string;
}

const RECONSTRUCTION_STEPS: VersionStep[] = [
  { step: 1, balance: 400, trxId: 200, rollPtr: '0x7f4a01', isReadViewVisible: false, explanation: 'Clustered Index tuple has DB_TRX_ID=200. Fails ReadView check (200 >= m_low_limit_id 200). Must follow DB_ROLL_PTR to Undo Log.' },
  { step: 2, balance: 500, trxId: 150, rollPtr: '0x7f4a00', isReadViewVisible: true, explanation: 'Undo record 1 has DB_TRX_ID=150. Passes ReadView check (150 < m_high_limit_id 160). Reconstructed in-memory tuple balance=500 is VISIBLE!' },
];

export default function AcidInnodbMvccDiagram(): React.JSX.Element {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'reconstruction' | 'comparison'>('reconstruction');

  const curr = RECONSTRUCTION_STEPS[currentStepIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .innodb-grid { grid-template-columns: 1fr !important; } }`}</style>

      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          MySQL InnoDB Hidden Fields & Version Reconstruction Stepper
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('reconstruction')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: activeTab === 'reconstruction' ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'reconstruction' ? '#f97316' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === 'reconstruction' ? '0 0 0 1.5px #f97316' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            Reconstruction Stepper
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: activeTab === 'comparison' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'comparison' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === 'comparison' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            PG vs InnoDB Matrix
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {activeTab === 'reconstruction' ? (
          <div className="innodb-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            
            {/* Left: Clustered Index Hidden Fields & Pointer Graph */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', marginBottom: '10px' }}>
                InnoDB Clustered Index Record Fields
              </div>

              {/* Record Header Fields Display */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.4)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#f97316', fontWeight: 700 }}>DB_TRX_ID</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>6 Bytes</div>
                  <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Txn #{curr.trxId}</div>
                </div>
                <div style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700 }}>DB_ROLL_PTR</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>7 Bytes</div>
                  <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>{curr.rollPtr}</div>
                </div>
                <div style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>DB_ROW_ID</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>6 Bytes</div>
                  <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Auto PK</div>
                </div>
              </div>

              {/* Stepper Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCurrentStepIdx(0)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: currentStepIdx === 0 ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.04)',
                    color: currentStepIdx === 0 ? '#f97316' : 'var(--ifm-color-content-secondary)',
                    boxShadow: currentStepIdx === 0 ? '0 0 0 1.5px #f97316' : '0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                >
                  Step 1: Check Page Tuple
                </button>
                <button
                  onClick={() => setCurrentStepIdx(1)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: currentStepIdx === 1 ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
                    color: currentStepIdx === 1 ? '#34d399' : 'var(--ifm-color-content-secondary)',
                    boxShadow: currentStepIdx === 1 ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                >
                  Step 2: Traverse Undo Chain
                </button>
              </div>
            </div>

            {/* Right: ReadView Evaluation & Explanation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px' }}>
                  ReadView Boundaries (active snapshot)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  <code>m_high_limit_id</code>: <strong>160</strong> (visible if &lt; 160)<br />
                  <code>m_low_limit_id</code>: <strong>200</strong> (invisible if &ge; 200)<br />
                  <code>m_ids</code>: <strong>[180, 195]</strong> (active uncommitted)
                </div>
              </div>

              <div style={{
                background: curr.isReadViewVisible ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                border: `1px solid ${curr.isReadViewVisible ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`,
                borderRadius: '8px',
                padding: '12px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: curr.isReadViewVisible ? '#34d399' : '#f87171', marginBottom: '4px' }}>
                  {curr.isReadViewVisible ? '✓ VISIBLE RECONSTRUCTED TUPLE' : '✗ INVISIBLE CLUSTERED TUPLE'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                  Extracted Balance: ${curr.balance}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  {curr.explanation}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Comparison Matrix Tab */
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)' }}>
                  <th style={{ padding: '10px 12px' }}>Dimension</th>
                  <th style={{ padding: '10px 12px', color: '#38bdf8' }}>PostgreSQL MVCC</th>
                  <th style={{ padding: '10px 12px', color: '#f97316' }}>MySQL InnoDB MVCC</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--ifm-color-content-secondary)' }}>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Tuple Storage</td>
                  <td style={{ padding: '10px 12px' }}>Multiple versions in main Heap pages</td>
                  <td style={{ padding: '10px 12px' }}>Single latest version in Clustered Index page</td>
                </tr>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Old Version Access</td>
                  <td style={{ padding: '10px 12px' }}>Reads older physical tuple directly from Heap</td>
                  <td style={{ padding: '10px 12px' }}>Reconstructs version in memory via Undo deltas</td>
                </tr>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Garbage Collection</td>
                  <td style={{ padding: '10px 12px' }}><code>VACUUM</code> daemon cleans dead Heap tuples</td>
                  <td style={{ padding: '10px 12px' }}>Purge Threads free undo log segments</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
