import React, { useState } from 'react';

export type DiagramTab = 'seek_filter' | 'esr_rule' | 'icp' | 'deferred_join' | 'force_index';

interface MysqlIndexBeyondEqualityDiagramProps {
  initialTab?: DiagramTab;
}

export default function MysqlIndexBeyondEqualityDiagram({
  initialTab = 'seek_filter',
}: MysqlIndexBeyondEqualityDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DiagramTab>(initialTab);

  // State for Tab 1: Seek vs Filter
  const [phonebookQuery, setPhonebookQuery] = useState<'shop_equals' | 'date_only'>('shop_equals');

  // State for Tab 2: ESR Rule
  const [esrOrder, setEsrOrder] = useState<'esr' | 'ers' | 'res'>('esr');

  // State for Tab 3: ICP
  const [icpMode, setIcpMode] = useState<'with_icp' | 'without_icp'>('with_icp');

  // State for Tab 4: Deferred Join
  const [joinStrategy, setJoinStrategy] = useState<'naive' | 'deferred'>('deferred');

  // State for Tab 5: FORCE INDEX
  const [forceScenario, setForceScenario] = useState<'valid_candidates' | 'empty_candidates'>('valid_candidates');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .index-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="m14 12 3 3 5-5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          MySQL Indexing Deep Dive: Seek vs Filter, ESR Rule, ICP & Deferred Join
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'seek_filter', label: '🎯 1. Seek vs Filter', color: '#38bdf8' },
            { id: 'esr_rule', label: '📐 2. The ESR Rule', color: '#34d399' },
            { id: 'icp', label: '⚡ 3. Index Condition Pushdown', color: '#fbbf24' },
            { id: 'deferred_join', label: '🚀 4. Deferred Join (148x Speedup)', color: '#a78bfa' },
            { id: 'force_index', label: '🎛️ 5. FORCE INDEX Candidate Matrix', color: '#f87171' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as DiagramTab)}
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
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SEEK VS FILTER (PHONEBOOK MECHANICS) */}
        {activeTab === 'seek_filter' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>
                  Index: <code>idx_shop_created(shop_id, created_at)</code> on 512,000 orders
                </span>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  A B-Tree composite index is a single physically sorted list, like a phonebook sorted by (Họ, Tên).
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPhonebookQuery('shop_equals')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: phonebookQuery === 'shop_equals' ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.06)',
                    color: phonebookQuery === 'shop_equals' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Query A: WHERE shop_id = 7
                </button>
                <button
                  onClick={() => setPhonebookQuery('date_only')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: phonebookQuery === 'date_only' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.06)',
                    color: phonebookQuery === 'date_only' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Query B: WHERE created_at = '2026-01-02'
                </button>
              </div>
            </div>

            {/* SVG Representation */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 280" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="seek-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="seek-arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
                  </marker>
                </defs>

                {/* Left side: Query Box */}
                <rect x="20" y="20" width="220" height="90" rx="8" fill="rgba(255,255,255,0.03)" stroke={phonebookQuery === 'shop_equals' ? '#38bdf8' : '#f87171'} strokeWidth="1.5" />
                <text x="35" y="44" fill="var(--ifm-color-content-secondary)" fontSize="10" fontWeight="700">INCOMING QUERY:</text>
                <text x="35" y="66" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700" fontFamily="monospace">
                  SELECT id FROM orders
                </text>
                <text x="35" y="86" fill={phonebookQuery === 'shop_equals' ? '#38bdf8' : '#f87171'} fontSize="12" fontWeight="700" fontFamily="monospace">
                  {phonebookQuery === 'shop_equals' ? "WHERE shop_id = 7;" : "WHERE created_at = '2026-01-02';"}
                </text>

                {/* Arrow connecting query to index */}
                {phonebookQuery === 'shop_equals' ? (
                  <>
                    <path d="M 240 65 C 290 65, 300 95, 340 95" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" className="interactive-diagram-flowing-path" markerEnd="url(#seek-arrow-blue)" />
                    <text x="270" y="55" fill="#38bdf8" fontSize="10" fontWeight="700">O(log N) SEEK</text>
                  </>
                ) : (
                  <>
                    <path d="M 240 65 C 290 65, 290 35, 340 35" stroke="#f87171" strokeWidth="2" strokeDasharray="4 4" className="interactive-diagram-flowing-path" markerEnd="url(#seek-arrow-red)" />
                    <text x="250" y="45" fill="#f87171" fontSize="10" fontWeight="700">NO SEEK POINT!</text>
                  </>
                )}

                {/* B-Tree Leaf Page Box */}
                <rect x="350" y="15" width="450" height="250" rx="8" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x="365" y="35" fill="var(--ifm-color-content-secondary)" fontSize="11" fontWeight="700">
                  B-TREE LEAF NODES (Physically ordered by shop_id ASC, created_at ASC):
                </text>

                {/* Leaf Entries */}
                {[
                  { row: 1, shop: 6, date: '2026-01-05', match: false },
                  { row: 2, shop: 6, date: '2026-02-11', match: false },
                  { row: 3, shop: 7, date: '2026-01-01', match: phonebookQuery === 'shop_equals' },
                  { row: 4, shop: 7, date: '2026-01-02', match: true },
                  { row: 5, shop: 7, date: '2026-01-03', match: phonebookQuery === 'shop_equals' },
                  { row: 6, shop: 7, date: '2026-01-04', match: phonebookQuery === 'shop_equals' },
                  { row: 7, shop: 7, date: '2026-01-05', match: phonebookQuery === 'shop_equals' },
                  { row: 8, shop: 8, date: '2026-01-02', match: phonebookQuery === 'date_only' },
                  { row: 9, shop: 9, date: '2026-01-02', match: phonebookQuery === 'date_only' },
                ].map((item, idx) => {
                  const yPos = 55 + idx * 22;
                  const isHighlighted = item.match;
                  const bgFill = isHighlighted
                    ? phonebookQuery === 'shop_equals'
                      ? 'rgba(56,189,248,0.2)'
                      : 'rgba(248,113,113,0.2)'
                    : 'transparent';
                  const textColor = isHighlighted
                    ? phonebookQuery === 'shop_equals'
                      ? '#38bdf8'
                      : '#f87171'
                    : 'var(--ifm-color-content-secondary)';

                  return (
                    <g key={idx}>
                      <rect x="360" y={yPos - 13} width="430" height="20" rx="4" fill={bgFill} />
                      <text x="375" y={yPos} fill="var(--ifm-color-content-secondary)" fontSize="10" fontFamily="monospace">
                        #{item.row}
                      </text>
                      <text x="410" y={yPos} fill={textColor} fontSize="11" fontFamily="monospace" fontWeight={isHighlighted ? 700 : 400}>
                        ({item.shop}, '{item.date}')
                      </text>
                      {item.shop === 7 && phonebookQuery === 'shop_equals' && idx === 2 && (
                        <text x="560" y={yPos} fill="#38bdf8" fontSize="10" fontWeight="700">
                          ◀ B-Tree jumps straight here (START)
                        </text>
                      )}
                      {item.shop === 7 && phonebookQuery === 'shop_equals' && idx === 6 && (
                        <text x="560" y={yPos} fill="#38bdf8" fontSize="10" fontWeight="700">
                          ◀ Stops immediately after shop_id &gt; 7 (END)
                        </text>
                      )}
                      {phonebookQuery === 'date_only' && item.date === '2026-01-02' && (
                        <text x="560" y={yPos} fill="#f87171" fontSize="10" fontWeight="700">
                          ◀ Match is isolated & scattered! Must scan all!
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Bottom summary indicator */}
                <rect x="20" y="130" width="220" height="135" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
                <text x="35" y="152" fill="var(--ifm-color-content-secondary)" fontSize="10" fontWeight="700">EXECUTION METRICS:</text>
                {phonebookQuery === 'shop_equals' ? (
                  <>
                    <text x="35" y="174" fill="#38bdf8" fontSize="12" fontWeight="700">type: ref (SEEK)</text>
                    <text x="35" y="195" fill="var(--ifm-color-content)" fontSize="11">Contiguous Cluster: YES</text>
                    <text x="35" y="215" fill="var(--ifm-color-content)" fontSize="11">Entries Checked: 5 rows</text>
                    <text x="35" y="235" fill="#34d399" fontSize="11" fontWeight="700">Latency: ~0.08 ms (O(log N))</text>
                  </>
                ) : (
                  <>
                    <text x="35" y="174" fill="#f87171" fontSize="12" fontWeight="700">type: index (FILTER)</text>
                    <text x="35" y="195" fill="var(--ifm-color-content)" fontSize="11">Contiguous Cluster: NO (Scattered)</text>
                    <text x="35" y="215" fill="var(--ifm-color-content)" fontSize="11">Entries Checked: 512,000 rows</text>
                    <text x="35" y="235" fill="#fbbf24" fontSize="11" fontWeight="700">Latency: ~14 ms (Full Leaf Scan)</text>
                  </>
                )}
              </svg>
            </div>

            {/* Insight Card */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px', marginBottom: '4px' }}>
                💡 Bản chất cơ học của Leftmost Prefix (Không phải luật tùy hứng)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                Index B-Tree được xếp theo thứ tự từ điển: cột đầu tiên quyết định phân vùng lớn. Cùng <code>shop_id = 7</code> thì các dòng nằm <strong>liền kề tuyệt đối</strong>, giúp B-Tree nhảy thẳng (seek). Ngược lại, nếu chỉ hỏi theo <code>created_at</code>, các dòng khớp nằm rải rác ở khắp các phân vùng của mọi shop. B-Tree buộc phải đọc lướt từ đầu đến cuối lá (Full Index Scan) để so sánh từng dòng.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ESR RULE (EQUALITY -> SORT -> RANGE) */}
        {activeTab === 'esr_rule' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>
                  Quy tắc vàng ESR: Equality (Bằng) ➔ Sort (Sắp) ➔ Range (Khoảng)
                </span>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  Target Query: <code>WHERE status = 'PAID' AND created_at &gt; '2026-01-01' ORDER BY priority DESC;</code>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEsrOrder('esr')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: esrOrder === 'esr' ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.06)',
                    color: esrOrder === 'esr' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Option 1: (E, S, R) - Chuẩn ESR
                </button>
                <button
                  onClick={() => setEsrOrder('ers')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: esrOrder === 'ers' ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)',
                    color: esrOrder === 'ers' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Option 2: (E, R, S) - Bẫy Range
                </button>
                <button
                  onClick={() => setEsrOrder('res')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: esrOrder === 'res' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.06)',
                    color: esrOrder === 'res' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Option 3: (R, E, S) - Sai từ đầu
                </button>
              </div>
            </div>

            {/* Split layout: Visual explanation & Pipeline */}
            <div className="index-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                  CẤU TRÚC INDEX COMPOSITE:
                </div>

                {esrOrder === 'esr' && (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(52,211,153,0.15)', border: '1px solid #34d399', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>1. EQUALITY (=)</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>status</div>
                        <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Narrows to 'PAID' partition</div>
                      </div>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(56,189,248,0.15)', border: '1px solid #38bdf8', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>2. SORT (ORDER)</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>priority</div>
                        <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Already sorted in partition!</div>
                      </div>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(251,191,36,0.15)', border: '1px solid #fbbf24', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700 }}>3. RANGE (&gt;, &lt;)</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>created_at</div>
                        <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Filters via ICP in leaf</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6, padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                      ✅ <strong>Hoàn toàn loại bỏ Using filesort!</strong> Vì <code>status</code> cố định, các entry tiếp theo đã sắp xếp sẵn theo <code>priority</code>. Database duyệt lá theo đúng chiều sort và kiểm tra <code>created_at &gt; ?</code> trực tiếp bằng ICP mà không cần gom dữ liệu lên RAM để sort lại.
                    </div>
                  </div>
                )}

                {esrOrder === 'ers' && (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(52,211,153,0.15)', border: '1px solid #34d399', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>1. EQUALITY (=)</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>status</div>
                        <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Narrows to 'PAID'</div>
                      </div>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(251,191,36,0.15)', border: '1px solid #fbbf24', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700 }}>2. RANGE (&gt;, &lt;)</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>created_at</div>
                        <div style={{ fontSize: '9px', color: '#f87171' }}>Shatters subsequent sort order!</div>
                      </div>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>3. SORT (ORDER)</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>priority</div>
                        <div style={{ fontSize: '9px', color: '#f87171' }}>Index sort useless! Filesort needed</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6, padding: '10px', background: 'rgba(248,113,113,0.08)', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.2)' }}>
                      ⚠️ <strong>Bẫy phá vỡ thứ tự:</strong> Khi gặp điều kiện khoảng <code>created_at &gt; '2026-01-01'</code>, các giá trị <code>priority</code> bị phân tán rải rác theo từng mốc thời gian khác nhau. Database không thể dùng index để sort được nữa $\to$ <strong>Using filesort bắt buộc phải xuất hiện!</strong>
                    </div>
                  </div>
                )}

                {esrOrder === 'res' && (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>1. RANGE (&gt;, &lt;)</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>created_at</div>
                        <div style={{ fontSize: '9px', color: '#f87171' }}>Immediate range seek</div>
                      </div>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>2. EQUALITY (=)</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>status</div>
                        <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Cannot seek; only filter</div>
                      </div>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>3. SORT (ORDER)</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>priority</div>
                        <div style={{ fontSize: '9px', color: '#f87171' }}>Filesort triggered</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6, padding: '10px', background: 'rgba(248,113,113,0.08)', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.2)' }}>
                      ❌ <strong>Tệ nhất:</strong> Đặt range lên đầu khiến cột 2 (<code>status</code>) và cột 3 (<code>priority</code>) hoàn toàn mất khả năng seek. Cả hai cột sau chỉ còn là filter và phải chịu toàn bộ chi phí `Using filesort`.
                    </div>
                  </div>
                )}
              </div>

              {/* EXPLAIN Execution Simulation Card */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                  KẾT QUẢ EXPLAIN TƯƠNG ỨNG:
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', color: 'var(--ifm-color-content)', lineHeight: 1.7, marginBottom: '10px' }}>
                  <div><strong>type:</strong> {esrOrder === 'esr' ? 'ref / range' : esrOrder === 'ers' ? 'range' : 'range'}</div>
                  <div><strong>key:</strong> {esrOrder === 'esr' ? 'idx_status_prio_date' : esrOrder === 'ers' ? 'idx_status_date_prio' : 'idx_date_status_prio'}</div>
                  <div>
                    <strong>Extra:</strong>{' '}
                    <span style={{ color: esrOrder === 'esr' ? '#34d399' : '#f87171', fontWeight: 700 }}>
                      {esrOrder === 'esr' ? 'Using index condition' : 'Using index condition; Using filesort'}
                    </span>
                  </div>
                  <div>
                    <strong>Filesort RAM Buffer:</strong>{' '}
                    <span style={{ color: esrOrder === 'esr' ? '#34d399' : '#f87171', fontWeight: 700 }}>
                      {esrOrder === 'esr' ? '0 KB (Zero-Sort)' : '8,400 KB (sort_buffer_size)'}
                    </span>
                  </div>
                  <div>
                    <strong>Latency:</strong>{' '}
                    <span style={{ color: esrOrder === 'esr' ? '#34d399' : esrOrder === 'ers' ? '#fbbf24' : '#f87171', fontWeight: 700 }}>
                      {esrOrder === 'esr' ? '1.2 ms' : esrOrder === 'ers' ? '48.5 ms' : '112.0 ms'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  <strong>Quy tắc bất di bất dịch:</strong> Trong một câu query, chỉ có duy nhất <strong>MỘT</strong> cột điều kiện khoảng (<code>&gt;, &lt;, BETWEEN, LIKE 'prefix%'</code>) được hưởng khả năng B-Tree Seek. Đặt nó sau equality và sort để tối đa hóa hiệu năng.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INDEX CONDITION PUSHDOWN (ICP) */}
        {activeTab === 'icp' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>
                  Index Condition Pushdown (ICP - Using index condition)
                </span>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  Query: <code>SELECT * FROM users WHERE zipcode = '70000' AND address LIKE '%Le Loi%';</code> | Index: <code>(zipcode, address)</code>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIcpMode('with_icp')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: icpMode === 'with_icp' ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.06)',
                    color: icpMode === 'with_icp' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Modern MySQL: With ICP (Pushdown Active)
                </button>
                <button
                  onClick={() => setIcpMode('without_icp')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: icpMode === 'without_icp' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.06)',
                    color: icpMode === 'without_icp' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Legacy (Pre-5.6 / ICP Disabled): Without ICP
                </button>
              </div>
            </div>

            {/* Visual Architecture Comparison */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 260" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="icp-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill={icpMode === 'with_icp' ? '#34d399' : '#f87171'} />
                  </marker>
                </defs>

                {/* Storage Engine InnoDB boundary */}
                <rect x="20" y="20" width="370" height="220" rx="8" fill="rgba(56,189,248,0.04)" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
                <text x="35" y="42" fill="#38bdf8" fontSize="11" fontWeight="700">STORAGE ENGINE (InnoDB)</text>

                {/* Index Leaf Pages */}
                <rect x="40" y="60" width="330" height="85" rx="6" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" />
                <text x="55" y="82" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">1. Index Leaf: idx_zipcode_address</text>
                <text x="55" y="100" fill="var(--ifm-color-content-secondary)" fontSize="10">Seek zipcode = '70000' $\to$ 10,000 index entries found</text>
                <text x="55" y="125" fill={icpMode === 'with_icp' ? '#34d399' : '#fbbf24'} fontSize="11" fontWeight="700">
                  {icpMode === 'with_icp'
                    ? '▶ ICP Filter: Evaluates address LIKE \'%Le Loi%\' HERE!'
                    : '▶ Legacy: Cannot evaluate non-prefix LIKE here!'}
                </text>

                {/* Clustered Index (Data Pages) */}
                <rect x="40" y="160" width="330" height="65" rx="6" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" />
                <text x="55" y="182" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">2. Clustered Table Heap (Disk / Buffer Pool)</text>
                <text x="55" y="205" fill={icpMode === 'with_icp' ? '#34d399' : '#f87171'} fontSize="11" fontWeight="700">
                  {icpMode === 'with_icp'
                    ? '▶ Random Lookups: ONLY 20 rows fetched! (-99.8%)'
                    : '▶ Random Lookups: 10,000 row fetches performed! (Disaster)'}
                </text>

                {/* Flow connection inside engine */}
                {icpMode === 'with_icp' ? (
                  <path d="M 205 145 L 205 160" stroke="#34d399" strokeWidth="2" strokeDasharray="3 3" className="interactive-diagram-flowing-path" markerEnd="url(#icp-arrow)" />
                ) : (
                  <path d="M 205 145 L 205 160" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" className="interactive-diagram-flowing-path" markerEnd="url(#icp-arrow)" />
                )}

                {/* Server Layer Boundary */}
                <rect x="430" y="20" width="370" height="220" rx="8" fill="rgba(167,139,250,0.04)" stroke="#a78bfa" strokeWidth="1" strokeDasharray="3 3" />
                <text x="445" y="42" fill="#a78bfa" fontSize="11" fontWeight="700">MYSQL SERVER LAYER</text>

                {/* SQL Handler Box */}
                <rect x="450" y="60" width="330" height="165" rx="6" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" />
                <text x="465" y="85" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">3. Query Execution & WHERE Evaluation</text>
                {icpMode === 'with_icp' ? (
                  <>
                    <text x="465" y="110" fill="var(--ifm-color-content-secondary)" fontSize="10">Rows received from Engine: 20 rows</text>
                    <text x="465" y="135" fill="#34d399" fontSize="11" fontWeight="700">Server work: Zero filtering needed</text>
                    <text x="465" y="160" fill="var(--ifm-color-content)" fontSize="10">Directly returns 20 rows to client.</text>
                    <text x="465" y="195" fill="#34d399" fontSize="12" fontWeight="700">Total Latency: ~1.4 ms</text>
                  </>
                ) : (
                  <>
                    <text x="465" y="110" fill="var(--ifm-color-content-secondary)" fontSize="10">Rows received from Engine: 10,000 rows</text>
                    <text x="465" y="135" fill="#f87171" fontSize="11" fontWeight="700">Server work: Iterates & tests LIKE on 10,000 rows</text>
                    <text x="465" y="160" fill="var(--ifm-color-content-secondary)" fontSize="10">Discards 9,980 rows in RAM. Keeps 20 rows.</text>
                    <text x="465" y="195" fill="#f87171" fontSize="12" fontWeight="700">Total Latency: ~82.0 ms</text>
                  </>
                )}

                {/* Connecting arrow from Engine to Server */}
                <path d="M 370 190 L 440 190" stroke={icpMode === 'with_icp' ? '#34d399' : '#f87171'} strokeWidth="2" strokeDasharray="3 3" className="interactive-diagram-flowing-path" markerEnd="url(#icp-arrow)" />
                <text x="380" y="180" fill={icpMode === 'with_icp' ? '#34d399' : '#f87171'} fontSize="9" fontWeight="700">
                  {icpMode === 'with_icp' ? '20 rows' : '10,000 rows'}
                </text>
              </svg>
            </div>

            {/* Note alert */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '13px', marginBottom: '4px' }}>
                ⚡ Phân biệt sống còn: "Using index" vs "Using index condition"
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                <strong>Using index (Covering Index):</strong> Toàn bộ dữ liệu truy vấn nằm trọn vẹn trong index. Engine <strong>không chạm vào bảng chính (clustered heap) một lần nào</strong>.<br />
                <strong>Using index condition (ICP):</strong> Index dùng để lọc bớt các dòng không khớp <em>trước khi</em> tra cứu bảng chính. Engine <strong>vẫn phải lookup về bảng</strong>, nhưng số lần lookup giảm ngoạn mục từ hàng vạn xuống chỉ còn số lượng thực sự khớp.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DEFERRED JOIN (LATE MATERIALIZATION) */}
        {activeTab === 'deferred_join' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>
                  Deferred Join (Late Materialization) - Tăng tốc 148 lần
                </span>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  Index: <code>(last_name, first_name)</code> | Query tìm <code>first_name = 'An5' LIMIT 100</code>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setJoinStrategy('naive')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: joinStrategy === 'naive' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.06)',
                    color: joinStrategy === 'naive' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Cách ngây thơ: SELECT * ... LIMIT 100
                </button>
                <button
                  onClick={() => setJoinStrategy('deferred')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: joinStrategy === 'deferred' ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)',
                    color: joinStrategy === 'deferred' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Cách tách bước: Deferred Join (JOIN Subquery)
                </button>
              </div>
            </div>

            {/* Architecture Flow */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              {joinStrategy === 'naive' ? (
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#f87171', marginBottom: '8px' }}>
                    SELECT * FROM contacts WHERE first_name = 'An5' LIMIT 100;
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px', padding: '12px', background: 'rgba(248,113,113,0.08)', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171' }}>EXECUTION PLAN</div>
                      <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                        <code>type: ALL</code> | Table scan on contacts
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>
                        Vì <code>SELECT *</code> đòi các cột <code>phone, city, note</code> ngoài index, optimizer <strong>loại bỏ Skip Scan</strong> (<code>query_references_nonkey_column</code>) và quét bảng!
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '240px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)' }}>HẬU QUẢ VẬN HÀNH</div>
                      <div style={{ fontSize: '12px', color: '#f87171', fontWeight: 700, marginTop: '4px' }}>
                        Quét qua 236,972 dòng để gom đủ 100 kết quả!
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                        Thời gian chạy: <strong>129 ~ 143 ms</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#a78bfa', marginBottom: '8px' }}>
                    SELECT c.* FROM contacts c<br />
                    JOIN (SELECT id FROM contacts WHERE first_name = 'An5' LIMIT 100) t ON t.id = c.id;
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px', padding: '12px', background: 'rgba(52,211,153,0.08)', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.2)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>BƯỚC 1: SUBQUERY TRONG INDEX</div>
                      <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                        <code>Covering index skip scan</code> trên <code>idx_name</code>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>
                        Chỉ lấy <code>id</code> (đã có sẵn trong lá index). Chạy hoàn toàn trên RAM/Buffer Pool, <strong>không chạm bảng dữ liệu lần nào</strong>!
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '240px', padding: '12px', background: 'rgba(167,139,250,0.08)', borderRadius: '8px', border: '1px solid rgba(167,139,250,0.2)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa' }}>BƯỚC 2: TRA PRIMARY KEY ĐÚNG 100 LẦN</div>
                      <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                        <code>Single-row index lookup</code> on PRIMARY (id=t.id)
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>
                        Thay vì kéo cả 237,000 dòng dữ liệu nặng nề, ta chỉ tra đúng 100 dòng theo khóa chính $O(1)$!
                      </div>
                      <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>
                        Thời gian chạy: <strong>0.87 ms (Nhanh hơn 148 lần!)</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Strategic takeaway */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '13px', marginBottom: '4px' }}>
                🚀 Triết lý thiết kế: Tách việc chọn dòng ra khỏi việc lấy dữ liệu
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                Khi gặp các câu query lọc phức tạp nhiều cột (có cả <code>LIKE '%...%'</code>, đa điều kiện khoảng, phân trang <code>OFFSET / LIMIT</code> sâu), đừng ép một câu đơn lẻ phải gánh hết. Hãy dùng <strong>Deferred Join</strong>: để index giải quyết việc lọc/sắp xếp trên danh sách <code>id</code> siêu nhẹ, sau đó mới JOIN ngược lại bảng chính để lấy toàn bộ cột.
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FORCE INDEX MATRIX */}
        {activeTab === 'force_index' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>
                  Bản chất của FORCE INDEX: Ép được cái gì và Không ép được cái gì?
                </span>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  "FORCE INDEX là băng gạc, không phải thuốc. Dán để cầm máu nhưng phải quay lại chữa chỗ đang chảy."
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setForceScenario('valid_candidates')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: forceScenario === 'valid_candidates' ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.06)',
                    color: forceScenario === 'valid_candidates' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Trường hợp 1: Có đường tồn tại (Ép thành công)
                </button>
                <button
                  onClick={() => setForceScenario('empty_candidates')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: forceScenario === 'empty_candidates' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.06)',
                    color: forceScenario === 'empty_candidates' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  }}
                >
                  Trường hợp 2: Tập ứng viên rỗng (FORCE bất lực)
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                BỐN CON ĐƯỜNG ĐI QUA INDEX (FORCE chỉ được chọn trong 4 đường này):
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--ifm-color-content-secondary)' }}>
                      <th style={{ padding: '8px' }}>Phương án</th>
                      <th style={{ padding: '8px' }}>Điều kiện cấu trúc để tồn tại</th>
                      <th style={{ padding: '8px' }}>Trường hợp 1 (Có đường)</th>
                      <th style={{ padding: '8px' }}>Trường hợp 2 (SELECT * non-prefix)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px', fontWeight: 700, color: '#38bdf8' }}>1. ref / eq_ref</td>
                      <td style={{ padding: '8px' }}>Cột tiền tố có điều kiện bằng (=)</td>
                      <td style={{ padding: '8px', color: '#34d399' }}>✅ Tồn tại</td>
                      <td style={{ padding: '8px', color: '#f87171' }}>❌ Rỗng (non-prefix)</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px', fontWeight: 700, color: '#34d399' }}>2. range</td>
                      <td style={{ padding: '8px' }}>Cột tiền tố có điều kiện khoảng (&gt;, &lt;, BETWEEN)</td>
                      <td style={{ padding: '8px', color: '#34d399' }}>✅ Tồn tại</td>
                      <td style={{ padding: '8px', color: '#f87171' }}>❌ Rỗng (no valid range)</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px', fontWeight: 700, color: '#fbbf24' }}>3. skip_scan</td>
                      <td style={{ padding: '8px' }}>MySQL 8.0+, cột đầu ít giá trị VÀ index phải covering</td>
                      <td style={{ padding: '8px', color: '#34d399' }}>✅ Tồn tại</td>
                      <td style={{ padding: '8px', color: '#f87171' }}>❌ Rỗng (SELECT * phá covering)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', fontWeight: 700, color: '#a78bfa' }}>4. index (Full Index Scan)</td>
                      <td style={{ padding: '8px' }}>Index covering HOẶC phục vụ ORDER BY</td>
                      <td style={{ padding: '8px', color: '#34d399' }}>✅ Tồn tại</td>
                      <td style={{ padding: '8px', color: '#f87171' }}>❌ Rỗng (không covering &amp; không ORDER BY)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '14px', padding: '10px', borderRadius: '6px', background: forceScenario === 'valid_candidates' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${forceScenario === 'valid_candidates' ? '#34d39950' : '#f8717150'}` }}>
                {forceScenario === 'valid_candidates' ? (
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                    🎯 <strong>Kết quả: FORCE INDEX thành công!</strong> Cả hai đường đều hợp lệ về mặt cấu trúc. Optimizer do thống kê lỗi (hoặc bẫy <code>ORDER BY ... LIMIT</code>) chọn sai table scan $\to$ Gán <code>FORCE INDEX</code> làm đội chi phí của table scan lên vô tận, ép optimizer chọn index mong muốn.
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                    🚨 <strong>Kết quả: FORCE INDEX hoàn toàn bị ngó lơ!</strong> Cả 4 ô ứng viên đều rỗng. Table scan là <em>"phương án chót không thể xóa bỏ"</em>. Khi không còn đường nào qua index khả thi về mặt cấu trúc, MySQL <strong>lặng lẽ quay về quét toàn bộ bảng (`type: ALL`)</strong> mà không báo bất kỳ lỗi hay warning nào!
                  </div>
                )}
              </div>
            </div>

            {/* Checklist */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 700, color: 'var(--ifm-color-content)', fontSize: '12px', marginBottom: '6px' }}>
                4 Tình huống hợp lệ duy nhất để cân nhắc FORCE / IGNORE INDEX:
              </div>
              <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Optimizer phân vân giữa 2 index đều dùng được và chọn sai con có chi phí thực tế đắt hơn.</li>
                <li>Bẫy <code>ORDER BY ... LIMIT nhỏ</code>: Optimizer quét index sắp sẵn hy vọng gặp may, nhưng điều kiện WHERE quá thưa khiến nó phải duyệt hàng trăm nghìn entry.</li>
                <li>Statistics (cardinality) bị cũ sau đợt cập nhật dữ liệu lớn (giải pháp lâu dài: chạy <code>ANALYZE TABLE</code>).</li>
                <li>Danh sách <code>IN (...)</code> quá dài vượt ngưỡng <code>eq_range_index_dive_limit</code> (mặc định 200), khiến optimizer chuyển sang ước lượng theo thống kê thay vì dive trực tiếp.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
