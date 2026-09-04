import React, { useState } from 'react';

export default function PostgresBrinIndexDiagram({ initialTab = 'architecture' }: { initialTab?: 'architecture' | 'benchmark' | 'correlation' | 'tuning' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'architecture' | 'benchmark' | 'correlation' | 'tuning'>(initialTab);
  
  // Benchmark state
  const [rowCountMillions, setRowCountMillions] = useState<number>(50);
  
  // Tuning state
  const [pagesPerRange, setPagesPerRange] = useState<number>(64);
  
  // Correlation demo state
  const [dataType, setDataType] = useState<'ordered' | 'random'>('ordered');

  // Math calculations for benchmark
  // Average row size ~ 200 bytes. 50M rows = 10 GB data
  const tableDataGb = (rowCountMillions * 1000000 * 200) / (1024 * 1024 * 1024);
  // B-Tree ~ 24 bytes per entry + tree nodes overhead ~ 1.1 GB for 50M rows
  const btreeSizeMb = (rowCountMillions * 1000000 * 24) / (1024 * 1024);
  // BRIN: 1 entry per (pagesPerRange * 8KB) block. With pagesPerRange=64, 1 block = 512KB.
  // 10GB table has ~20,000 blocks. Each BRIN entry is ~32 bytes -> 640 KB!
  const brinSizeKb = Math.max(32, Math.round(((tableDataGb * 1024 * 1024) / (pagesPerRange * 8)) * 0.032));

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .brin-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          PostgreSQL BRIN (Block Range Index) Architecture & Footprint Engine
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'architecture', label: '🔍 1. Block Ranges & Scan Mechanics', color: '#34d399' },
            { id: 'benchmark', label: '📊 2. BRIN vs B-Tree Footprint (99% Savings)', color: '#38bdf8' },
            { id: 'correlation', label: '⚠️ 3. Physical Correlation & UUID Trap', color: '#f87171' },
            { id: 'tuning', label: '⚙️ 4. pages_per_range Fine-Tuning', color: '#fbbf24' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '160px',
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

        {/* TAB 1: ARCHITECTURE & MECHANICS */}
        {activeTab === 'architecture' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px' }}>
              Query: <code>SELECT * FROM audit_logs WHERE created_at = '2026-08-01 06:30:00';</code>
            </div>

            {/* Visual Block Range Diagram */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="brin-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                  </marker>
                </defs>

                {/* Target Query Indicator */}
                <rect x="20" y="20" width="220" height="45" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="130" y="40" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Target Value:</text>
                <text x="130" y="55" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">2026-08-01 06:30:00</text>

                {/* Arrow to BRIN Summary in RAM */}
                <path d="M 240 42 L 300 42" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" className="interactive-diagram-flowing-path" markerEnd="url(#brin-arrow)" />

                {/* BRIN Summary in RAM */}
                <rect x="300" y="15" width="480" height="55" rx="6" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.2" />
                <text x="540" y="36" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">BRIN Summary Table (Stored in RAM, only ~64KB)</text>
                <text x="540" y="54" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Fast memory check evaluates Min/Max boundaries</text>

                {/* Range 0: Pages 0 -> 127 */}
                <rect x="20" y="100" width="230" height="110" rx="8" fill="rgba(248,113,113,0.08)" stroke="#f87171" strokeWidth="1.2" strokeDasharray="3 3" />
                <text x="135" y="125" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Block Range 0 (Pages 0-127)</text>
                <text x="135" y="145" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Min: 2026-08-01 00:00</text>
                <text x="135" y="162" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Max: 2026-08-01 04:30</text>
                <rect x="60" y="175" width="150" height="24" rx="4" fill="rgba(248,113,113,0.2)" />
                <text x="135" y="191" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">⏭️ SKIPPED (No match)</text>

                {/* Range 1: Pages 128 -> 255 (MATCH) */}
                <rect x="285" y="100" width="230" height="110" rx="8" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="2" />
                <text x="400" y="125" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Block Range 1 (Pages 128-255)</text>
                <text x="400" y="145" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">Min: 2026-08-01 04:31</text>
                <text x="400" y="162" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">Max: 2026-08-01 09:15</text>
                <rect x="325" y="175" width="150" height="24" rx="4" fill="rgba(52,211,153,0.3)" />
                <text x="400" y="191" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">🎯 MATCH: Reads Block</text>

                {/* Range 2: Pages 256 -> 383 */}
                <rect x="550" y="100" width="230" height="110" rx="8" fill="rgba(248,113,113,0.08)" stroke="#f87171" strokeWidth="1.2" strokeDasharray="3 3" />
                <text x="665" y="125" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Block Range 2 (Pages 256-383)</text>
                <text x="665" y="145" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Min: 2026-08-01 09:16</text>
                <text x="665" y="162" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Max: 2026-08-01 14:00</text>
                <rect x="590" y="175" width="150" height="24" rx="4" fill="rgba(248,113,113,0.2)" />
                <text x="665" y="191" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">⏭️ SKIPPED (No match)</text>
              </svg>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '4px', fontSize: '13px' }}>
                How PostgreSQL Executes a BRIN Scan
              </div>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'var(--ifm-color-content-secondary)' }}>
                Instead of indexing individual row pointers (CTIDs) like B-Tree, BRIN groups 128 disk pages (~1MB) into a <strong>Block Range</strong> and stores only its <code>[Min, Max]</code> summary. During query execution, Postgres quickly reads the tiny BRIN summary in RAM, skips 95%+ of irrelevant table pages, and only performs sequential I/O on the matching block ranges.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: BENCHMARK CALCULATOR */}
        {activeTab === 'benchmark' && (
          <div>
            <div className="brin-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', marginBottom: '14px' }}>
              {/* Slider */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
                  Table Size Simulator
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Row Count:</span>
                    <strong style={{ color: '#38bdf8' }}>{rowCountMillions} Million Rows</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={rowCountMillions}
                    onChange={e => setRowCountMillions(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    Estimated Table Heap Size: ~{tableDataGb.toFixed(1)} GB on disk.
                  </div>
                </div>

                {/* Side-by-side cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700 }}>B-Tree Index</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
                      {Math.round(btreeSizeMb)} MB
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      Pointers for every row. Causes shared_buffers cache thrashing.
                    </div>
                  </div>

                  <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>BRIN Index</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                      {brinSizeKb} KB
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      <strong>{Math.round((btreeSizeMb * 1024) / brinSizeKb).toLocaleString()}x smaller!</strong> Fits in a single page.
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison metrics table */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>
                  Architectural Metric Comparison
                </div>
                <table style={{ width: '100%', fontSize: '11px', color: 'var(--ifm-color-content)', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Metric</th>
                      <th style={{ textAlign: 'left', padding: '4px', color: '#f87171' }}>B-Tree</th>
                      <th style={{ textAlign: 'left', padding: '4px', color: '#34d399' }}>BRIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '6px 4px' }}><strong>RAM Footprint</strong></td>
                      <td style={{ color: '#f87171' }}>100s of MBs</td>
                      <td style={{ color: '#34d399' }}>&lt; 1 MB (Cached in RAM)</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '6px 4px' }}><strong>INSERT Overhead</strong></td>
                      <td style={{ color: '#f87171' }}>Tree traversal & page split</td>
                      <td style={{ color: '#34d399' }}>Instant min/max update</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '6px 4px' }}><strong>Creation Speed</strong></td>
                      <td style={{ color: '#f87171' }}>Minutes</td>
                      <td style={{ color: '#34d399' }}>Seconds</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 4px' }}><strong>Range Queries</strong></td>
                      <td style={{ color: '#38bdf8' }}>Fast</td>
                      <td style={{ color: '#34d399' }}>Extremely Fast</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CORRELATION & UUID TRAP */}
        {activeTab === 'correlation' && (
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setDataType('ordered')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: dataType === 'ordered' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
                  color: dataType === 'ordered' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  boxShadow: dataType === 'ordered' ? '0 0 0 1px #34d399' : 'none'
                }}
              >
                ✅ High Physical Correlation (e.g., created_at, auto-increment id)
              </button>
              <button
                onClick={() => setDataType('random')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: dataType === 'random' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
                  color: dataType === 'random' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  boxShadow: dataType === 'random' ? '0 0 0 1px #f87171' : 'none'
                }}
              >
                ❌ The UUID v4 Trap (Random Correlation)
              </button>
            </div>

            {/* Visual correlation demo */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              {dataType === 'ordered' ? (
                <div>
                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                    Correlation = 1.0 (Sequential Monotonic Append)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px' }}>
                    Block Ranges have discrete, non-overlapping min/max intervals. BRIN successfully skips 95%+ of table pages:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {['[0 - 250k]', '[250k - 500k]', '[500k - 750k]', '[750k - 1M]'].map((r, i) => (
                      <div key={i} style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Block {i}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>{r}</div>
                        <div style={{ fontSize: '9px', color: '#34d399', marginTop: '2px' }}>Clean Bounds</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                    Correlation ≈ 0.0 (Random UUID / Email Hashing)
                  </div>
                  <div style={{ fontSize: '11px', color: '#fca5a5', marginBottom: '10px' }}>
                    Because values are randomly distributed, every single block range contains min='000...' and max='fff...'. BRIN CANNOT SKIP ANY BLOCK!
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {['[000... - fff...]', '[000... - fff...]', '[000... - fff...]', '[000... - fff...]'].map((r, i) => (
                      <div key={i} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Block {i}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171' }}>{r}</div>
                        <div style={{ fontSize: '9px', color: '#f87171', marginTop: '2px' }}>💥 0 Blocks Skipped!</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SQL Verification snippet */}
            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                Pre-requisite SQL Audit: Check Physical Correlation
              </div>
              <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, color: '#e2e8f0' }}>
{`SELECT tablename, attname, correlation 
FROM pg_stats 
WHERE tablename = 'order_events' AND attname = 'created_at';`}
              </pre>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>
                Rule of Thumb: Only deploy BRIN if <code>abs(correlation) &gt; 0.90</code>. If correlation is below 0.7, stick with B-Tree or partition by date!
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TUNING PAGES_PER_RANGE */}
        {activeTab === 'tuning' && (
          <div>
            <div className="brin-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
                  Tuning pages_per_range (Default: 128)
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>pages_per_range:</span>
                    <strong style={{ color: '#fbbf24' }}>{pagesPerRange} Pages ({pagesPerRange * 8} KB per Block)</strong>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="256"
                    step="16"
                    value={pagesPerRange}
                    onChange={e => setPagesPerRange(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#fbbf24' }}
                  />
                </div>

                <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Granularity vs Size Trade-off:</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginTop: '2px' }}>
                    {pagesPerRange <= 32 && '🎯 Fine Granularity: Reads fewer disk pages per query, slightly larger index.'}
                    {pagesPerRange > 32 && pagesPerRange <= 128 && '⚖️ Balanced: Recommended production setting for time-series logs.'}
                    {pagesPerRange > 128 && '📦 Coarse Granularity: Tiny index, but reads more false-positive pages.'}
                  </div>
                </div>
              </div>

              {/* SQL DDL */}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  PostgreSQL BRIN Index DDL Manifest
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
{`-- Create BRIN Index with customized pages_per_range
CREATE INDEX idx_order_events_created_at_brin 
ON order_events 
USING brin (created_at) 
WITH (pages_per_range = ${pagesPerRange});

-- Periodic maintenance to summarize freshly appended blocks:
SELECT brin_summarize_new_values('idx_order_events_created_at_brin');`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
