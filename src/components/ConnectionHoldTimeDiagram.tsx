import React, { useState } from 'react';

export default function ConnectionHoldTimeDiagram(): React.JSX.Element {
  const [activeView, setActiveView] = useState<'timeline' | 'tags'>('timeline');

  const TAG_METRICS = [
    { tag: 'conn_tag:inventory_reservation', queryMs: 1.8, holdMs: 3.2, status: 'Healthy', color: '#34d399' },
    { tag: 'conn_tag:checkout_completion', queryMs: 2.1, holdMs: 58.4, status: 'BOTTLENECK', color: '#f87171' },
    { tag: 'conn_tag:cart_enrichment', queryMs: 0.9, holdMs: 24.1, status: 'Elevated', color: '#fbbf24' }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Query Execution Time vs. Connection Hold Time (The Starvation Paradox)
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[
            { id: 'timeline', label: '⏱️ Hold Timeline', color: '#f87171' },
            { id: 'tags', label: '🏷️ ProxySQL Attribution', color: '#38bdf8' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveView(t.id as any)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeView === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeView === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeView === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeView === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {activeView === 'timeline' && (
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 760 210" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Query Time vs Hold Time Visualizer */}
                {/* 1. Query Execution Time */}
                <g transform="translate(30, 20)">
                  <text x="0" y="16" fill="#34d399" fontSize="12" fontWeight="700">1. Query Execution Time (Inside MySQL Engine: ~2ms)</text>
                  <rect x="0" y="28" width="80" height="28" rx="4" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="40" y="46" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="700">SQL (2ms)</text>
                  <text x="95" y="46" fill="#94a3b8" fontSize="10">DB CPU &lt; 40% (Fast Engine)</text>
                </g>

                {/* 2. Connection Hold Time Bar */}
                <g transform="translate(30, 95)">
                  <text x="0" y="16" fill="#f87171" fontSize="12" fontWeight="700">2. Connection Hold Time (Socket Locked to Thread: ~58ms 💥)</text>

                  {/* Outer Hold Box */}
                  <rect x="0" y="28" width="700" height="42" rx="6" fill="rgba(248, 113, 113, 0.1)" stroke="#f87171" strokeWidth="1.5" />

                  {/* Sub-steps inside transaction */}
                  <g transform="translate(6, 34)">
                    {/* BEGIN */}
                    <rect x="0" y="0" width="80" height="30" rx="3" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.15)" />
                    <text x="40" y="19" textAnchor="middle" fill="#cbd5e1" fontSize="9">@Transactional</text>

                    {/* App Calc */}
                    <rect x="88" y="0" width="120" height="30" rx="3" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                    <text x="148" y="19" textAnchor="middle" fill="#fef08a" fontSize="9">Cart Pricing Calc (15ms)</text>

                    {/* JSON Parse */}
                    <rect x="216" y="0" width="110" height="30" rx="3" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                    <text x="271" y="19" textAnchor="middle" fill="#fef08a" fontSize="9">JSON Serialization (12ms)</text>

                    {/* SQL 1 */}
                    <rect x="334" y="0" width="80" height="30" rx="3" fill="rgba(52, 211, 153, 0.25)" stroke="#34d399" />
                    <text x="374" y="19" textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="700">SQL Query (2ms)</text>

                    {/* Response transform */}
                    <rect x="422" y="0" width="160" height="30" rx="3" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                    <text x="502" y="19" textAnchor="middle" fill="#fef08a" fontSize="9">DTO Transform / Logging (25ms)</text>

                    {/* COMMIT */}
                    <rect x="590" y="0" width="98" height="30" rx="3" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.15)" />
                    <text x="639" y="19" textAnchor="middle" fill="#cbd5e1" fontSize="9">COMMIT / Release</text>
                  </g>
                </g>

                {/* Brackets */}
                <text x="35" y="188" fill="#38bdf8" fontSize="10" fontWeight="700">▲ Connection Borrowed</text>
                <text x="615" y="188" fill="#34d399" fontSize="10" fontWeight="700">▲ Returned to Pool</text>
              </svg>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(248, 113, 113, 0.08)', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.2)', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              ⚠️ <strong>The Root Cause:</strong> A database socket is borrowed on <code>BEGIN</code> and remains locked until <code>COMMIT</code>. Only 2ms was spent doing database I/O, while 56ms was spent on CPU serialization, business calculations, and DTO conversion holding the socket idle!
            </div>
          </div>
        )}

        {activeView === 'tags' && (
          <div>
            <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#38bdf8' }}>SQL Process Comment Tag</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#34d399' }}>Avg Query Latency</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#f87171' }}>Total Connection Hold Time</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#fbbf24' }}>Diagnostic Status</th>
                  </tr>
                </thead>
                <tbody>
                  {TAG_METRICS.map(m => (
                    <tr key={m.tag} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#c4b5fd' }}>{m.tag}</td>
                      <td style={{ padding: '8px 12px', color: '#86efac' }}>{m.queryMs} ms</td>
                      <td style={{ padding: '8px 12px', color: m.color, fontWeight: 700 }}>{m.holdMs} ms</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: `${m.color}20`, color: m.color, fontSize: '10.5px', fontWeight: 700 }}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              💡 <strong>The Fix:</strong> Trimming the transaction boundaries to only encompass the SQL mutation and moving cart enrichment out of <code>@Transactional</code> reclaimed 50% of reads and 33% of primary transactions.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
