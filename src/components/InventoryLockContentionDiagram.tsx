import React, { useState } from 'react';

type ContentionMode = 'single_row' | 'skip_locked';

export default function InventoryLockContentionDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<ContentionMode>('skip_locked');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Flash Sale Inventory: Single-Row Counter vs. FOR UPDATE SKIP LOCKED
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setMode('single_row')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${mode === 'single_row' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
              background: mode === 'single_row' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255,255,255,0.04)',
              color: mode === 'single_row' ? '#f87171' : 'var(--ifm-color-content-secondary)',
              fontWeight: mode === 'single_row' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            ❌ Single-Row Counter (Serializing)
          </button>
          <button
            onClick={() => setMode('skip_locked')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${mode === 'skip_locked' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
              background: mode === 'skip_locked' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.04)',
              color: mode === 'skip_locked' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontWeight: mode === 'skip_locked' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            ✅ Unit-Row Pool (SKIP LOCKED)
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          {mode === 'single_row' ? (
            <svg viewBox="0 0 760 210" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="lock-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#f87171" /></marker>
                <marker id="lock-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
              </defs>

              {/* Single Row Item */}
              <g transform="translate(180, 25)">
                <rect width="400" height="60" rx="8" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="2" />
                <text x="200" y="26" textAnchor="middle" fill="#f87171" fontSize="13" fontWeight="800">
                  Item #101 Table Row: stock_count = 50
                </text>
                <text x="200" y="46" textAnchor="middle" fill="#fca5a5" fontSize="10">
                  🔒 Row Exclusive Lock Held by Transaction 1
                </text>
              </g>

              {/* Incoming Transactions */}
              {/* Tx 1 */}
              <g transform="translate(190, 135)">
                <rect width="110" height="45" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="55" y="22" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Tx 1 (Buyer A)</text>
                <text x="55" y="36" textAnchor="middle" fill="#86efac" fontSize="9">Active Lock ✅</text>
              </g>
              <path d="M 245 135 L 245 92" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#lock-green)" className="interactive-diagram-flowing-path" />

              {/* Tx 2 */}
              <g transform="translate(325, 135)">
                <rect width="110" height="45" rx="6" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x="55" y="22" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Tx 2 (Buyer B)</text>
                <text x="55" y="36" textAnchor="middle" fill="#fca5a5" fontSize="9">Blocked (Waiting ⏳)</text>
              </g>
              <path d="M 380 135 L 380 92" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#lock-red)" />

              {/* Tx 3 */}
              <g transform="translate(460, 135)">
                <rect width="110" height="45" rx="6" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x="55" y="22" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Tx 3 (Buyer C)</text>
                <text x="55" y="36" textAnchor="middle" fill="#fca5a5" fontSize="9">Blocked (Waiting ⏳)</text>
              </g>
              <path d="M 515 135 L 515 92" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#lock-red)" />
            </svg>
          ) : (
            <svg viewBox="0 0 760 210" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="skip-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
              </defs>

              {/* Multiple Unit Rows */}
              {/* Unit 1 */}
              <g transform="translate(60, 25)">
                <rect width="135" height="55" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="67" y="24" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Unit Row #1</text>
                <text x="67" y="42" textAnchor="middle" fill="#86efac" fontSize="9">Reserved by Tx 1</text>
              </g>

              {/* Unit 2 */}
              <g transform="translate(225, 25)">
                <rect width="135" height="55" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="67" y="24" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Unit Row #2</text>
                <text x="67" y="42" textAnchor="middle" fill="#86efac" fontSize="9">Reserved by Tx 2</text>
              </g>

              {/* Unit 3 */}
              <g transform="translate(390, 25)">
                <rect width="135" height="55" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="67" y="24" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Unit Row #3</text>
                <text x="67" y="42" textAnchor="middle" fill="#86efac" fontSize="9">Reserved by Tx 3</text>
              </g>

              {/* Unit 4 (Free) */}
              <g transform="translate(555, 25)">
                <rect width="135" height="55" rx="6" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="67" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Unit Row #4</text>
                <text x="67" y="42" textAnchor="middle" fill="#94a3b8" fontSize="9">Available (Unassigned)</text>
              </g>

              {/* Incoming Concurrent Transactions */}
              <g transform="translate(72, 135)">
                <rect width="110" height="45" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" strokeWidth="1.5" />
                <text x="55" y="22" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Tx 1</text>
                <text x="55" y="36" textAnchor="middle" fill="#cbd5e1" fontSize="9">Locks Unit 1</text>
              </g>
              <path d="M 127 135 L 127 88" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#skip-green)" className="interactive-diagram-flowing-path" />

              <g transform="translate(237, 135)">
                <rect width="110" height="45" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" strokeWidth="1.5" />
                <text x="55" y="22" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Tx 2</text>
                <text x="55" y="36" textAnchor="middle" fill="#cbd5e1" fontSize="9">Skips 1 ➔ Locks 2</text>
              </g>
              <path d="M 292 135 L 292 88" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#skip-green)" className="interactive-diagram-flowing-path" />

              <g transform="translate(402, 135)">
                <rect width="110" height="45" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" strokeWidth="1.5" />
                <text x="55" y="22" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Tx 3</text>
                <text x="55" y="36" textAnchor="middle" fill="#cbd5e1" fontSize="9">Skips 1,2 ➔ Locks 3</text>
              </g>
              <path d="M 457 135 L 457 88" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#skip-green)" className="interactive-diagram-flowing-path" />
            </svg>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(248, 113, 113, 0.08)', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
            <strong style={{ color: '#f87171', fontSize: '11px' }}>Single-Row Bottleneck:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              When thousands of shoppers buy the same hot sneaker, <code>SELECT FOR UPDATE</code> on a single counter row serializes every checkout. Database CPU stays low while connection pools starve waiting for row locks.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
            <strong style={{ color: '#34d399', fontSize: '11px' }}>Shopify 1-Row-Per-Unit Pattern:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              Representing inventory as individual rows combined with <code>FOR UPDATE SKIP LOCKED</code> allows hundreds of transactions to acquire locks simultaneously on distinct unit rows with <strong>zero blocking</strong>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
