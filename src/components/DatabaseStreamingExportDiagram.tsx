import React, { useState } from 'react';

export type StreamingTab = 'limit_offset' | 'keyset_seek' | 'jvm_vs_go' | 'net_write_timeout';

interface DatabaseStreamingExportDiagramProps {
  initialTab?: StreamingTab;
}

export default function DatabaseStreamingExportDiagram({
  initialTab = 'limit_offset',
}: DatabaseStreamingExportDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<StreamingTab>(initialTab);
  const [offsetValue, setOffsetValue] = useState<number>(4500000);
  const [javaMode, setJavaMode] = useState<'default_heap' | 'streaming_cursor' | 'server_cursor'>('default_heap');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .streaming-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          High-Volume Database Export: Keyset Pagination, JDBC Memory Buffers & net_write_timeout
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'limit_offset', label: '📉 1. LIMIT OFFSET Deep Crawl', color: '#f87171' },
            { id: 'keyset_seek', label: '⚡ 2. Keyset (Seek) Pagination', color: '#34d399' },
            { id: 'jvm_vs_go', label: '🧠 3. Go Stream vs Java JDBC Heap', color: '#fbbf24' },
            { id: 'net_write_timeout', label: '⏱️ 4. The net_write_timeout Incident', color: '#f472b6' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as StreamingTab)}
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
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: LIMIT OFFSET */}
        {activeTab === 'limit_offset' && (
          <div>
            <div style={{ marginBottom: '14px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
                  Simulate Offset Depth: {offsetValue.toLocaleString()} rows
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Traversed Rows: {(offsetValue + 1000).toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="5000000"
                step="100000"
                value={offsetValue}
                onChange={(e) => setOffsetValue(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div className="streaming-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg viewBox="0 0 500 180" style={{ width: '100%', height: 'auto' }}>
                  {/* B+Tree Root */}
                  <rect x="200" y="10" width="100" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" />
                  <text x="250" y="30" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">B+Tree Root</text>

                  {/* Leaf Level */}
                  <rect x="20" y="90" width="460" height="40" rx="4" fill="#0f172a" stroke="#64748b" />
                  {/* Discarded scan zone */}
                  <rect x="20" y="90" width={Math.min(410, (offsetValue / 5000000) * 410)} height="40" fill="rgba(248, 113, 113, 0.4)" />
                  {/* Returned slice */}
                  <rect x={Math.min(410, (offsetValue / 5000000) * 410) + 20} y="90" width="30" height="40" fill="#34d399" />

                  <text x="250" y="115" fill="#f8fafc" fontSize="11" fontWeight="700" textAnchor="middle">
                    Leaf Page Chains: Traversed & DISCARDED {(offsetValue).toLocaleString()} rows
                  </text>
                  <text x="250" y="155" fill="#f87171" fontSize="11" fontWeight="700" textAnchor="middle">
                    Cost: O(Offset + Limit) = {((offsetValue + 1000) / 1000000).toFixed(2)}M row evaluations!
                  </text>
                </svg>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                  The Flaw of `LIMIT 1000 OFFSET {offsetValue.toLocaleString()}`
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  <p>A B+Tree cannot jump to the <code>N-th</code> record in $O(1)$ time because leaf pages have variable record counts due to deletion and page splits.</p>
                  <p>To reach offset 4.5 million, InnoDB <strong>must physically traverse 4.5 million leaf entries</strong>, reading hundreds of pages from disk, thrashing the Buffer Pool LRU cache, only to discard 4,499,000 rows and return the last 1,000.</p>
                  <p style={{ color: '#f87171', fontWeight: 600 }}>Query time explodes from 5ms on page 1 to 45 seconds on page 4,500!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Keyset Seek */}
        {activeTab === 'keyset_seek' && (
          <div className="streaming-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                Seek-Based Keyset Query
              </div>
              <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{`-- Batch 1:
SELECT id, created_at, user_id, amount
FROM transactions
ORDER BY id ASC
LIMIT 5000;

-- Subsequent Batches (Seek directly to last seen ID):
SELECT id, created_at, user_id, amount
FROM transactions
WHERE id > :last_seen_id
ORDER BY id ASC
LIMIT 5000;`}
              </pre>
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '6px', border: '1px solid #34d399' }}>
                <span style={{ color: '#34d399', fontWeight: 700, fontSize: '11px' }}>Complexity: Strict O(log N + Limit)</span>
                <div style={{ fontSize: '10px', color: '#e2e8f0', marginTop: '4px' }}>
                  Direct B+Tree traversal straight to <code>:last_seen_id</code> (3-4 I/O reads), followed by scanning exactly 5,000 leaf rows. Zero wasted discards.
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                Keyset Pagination Gotchas & Edge Cases
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <strong>1. Non-Unique Sort Columns:</strong>
                <p>If ordering by <code>created_at</code>, multiple transactions can share the exact same microsecond timestamp. Paging with <code>WHERE created_at &gt; :last_ts</code> will skip records!
                <br /><span style={{ color: '#34d399' }}>Fix:</span> Use a composite tie-breaker: <code>WHERE (created_at, id) &gt; (:last_ts, :last_id)</code> backed by composite index <code>(created_at, id)</code>.</p>

                <strong>2. Index Coverage Requirement:</strong>
                <p>If your <code>WHERE</code> seek condition does not match the leading columns of an index, MySQL falls back to a full table scan or filesort, completely defeating keyset benefits.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: JVM Heap vs Go Stream */}
        {activeTab === 'jvm_vs_go' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[
                { id: 'default_heap', label: 'Java JDBC Default (OOM Crash)', color: '#f87171' },
                { id: 'streaming_cursor', label: 'MySQL Streaming (fetchSize=MIN_VALUE)', color: '#34d399' },
                { id: 'server_cursor', label: 'Server-Side Cursor (useCursorFetch=true)', color: '#38bdf8' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setJavaMode(m.id as typeof javaMode)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: javaMode === m.id ? `${m.color}25` : 'rgba(255,255,255,0.05)',
                    color: javaMode === m.id ? m.color : 'var(--ifm-color-content-secondary)',
                    border: `1px solid ${javaMode === m.id ? m.color : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="streaming-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: javaMode === 'default_heap' ? '#f87171' : '#34d399', marginBottom: '8px' }}>
                  {javaMode === 'default_heap' && "Default MySQL Connector/J Behavior"}
                  {javaMode === 'streaming_cursor' && "Row-by-Row Streaming Cursor"}
                  {javaMode === 'server_cursor' && "Server-Side Cursor Fetch"}
                </div>
                <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{javaMode === 'default_heap' && `Statement stmt = conn.createStatement();
// ❌ Reads all 5,000,000 rows into JVM memory!
ResultSet rs = stmt.executeQuery("SELECT * FROM 5m_table");
// java.lang.OutOfMemoryError: Java heap space`}

{javaMode === 'streaming_cursor' && `Statement stmt = conn.createStatement(
    ResultSet.TYPE_FORWARD_ONLY,
    ResultSet.CONCUR_READ_ONLY
);
// Magic value tells Connector/J to stream row-by-row
stmt.setFetchSize(Integer.MIN_VALUE);
ResultSet rs = stmt.executeQuery("SELECT * FROM 5m_table");`}

{javaMode === 'server_cursor' && `// JDBC URL: jdbc:mysql://host/db?useCursorFetch=true
Statement stmt = conn.createStatement();
stmt.setFetchSize(5000); // Batches 5,000 rows per round-trip
ResultSet rs = stmt.executeQuery("SELECT * FROM 5m_table");`}
                </pre>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                  Why Go Streams by Default while Java Buffers
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  <p>In Go, <code>rows, err := db.Query(...)</code> returns a <code>*sql.Rows</code> object that reads from the underlying TCP connection buffer row-by-row during <code>rows.Next()</code>. Memory consumption is constant (typically &lt; 10MB).</p>
                  <p>In standard Java JDBC, the specification expects <code>ResultSet</code> to be scrollable and inspectable by default. Hence, MySQL Connector/J buffers the entire multi-gigabyte dataset in memory unless explicitly instructed otherwise with <code>Integer.MIN_VALUE</code>.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: net_write_timeout */}
        {activeTab === 'net_write_timeout' && (
          <div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f472b6', marginBottom: '10px' }}>
                Data Pipeline & Socket Buffer Starvation Flow
              </div>
              <svg viewBox="0 0 620 140" style={{ width: '100%', height: 'auto' }}>
                <defs>
                  <marker id="arrow-flow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* MySQL Server Node */}
                <rect x="20" y="30" width="130" height="70" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="85" y="60" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">MySQL Server</text>
                <text x="85" y="80" fill="#94a3b8" fontSize="10" textAnchor="middle">Fast Producer</text>

                {/* Pipe 1 */}
                <path d="M 150 65 L 205 65" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,4" className="interactive-diagram-flowing-path" markerEnd="url(#arrow-flow)" />

                {/* OS Socket Buffer */}
                <rect x="210" y="25" width="160" height="80" rx="6" fill="rgba(244, 114, 182, 0.15)" stroke="#f472b6" strokeWidth="1.5" />
                <text x="290" y="50" fill="#f472b6" fontSize="11" fontWeight="700" textAnchor="middle">OS TCP Send Buffer</text>
                <rect x="230" y="65" width="120" height="15" rx="3" fill="#f472b6" />
                <text x="290" y="77" fill="#0f172a" fontSize="9" fontWeight="800" textAnchor="middle">BUFFER 100% FULL</text>
                <text x="290" y="95" fill="#fca5a5" fontSize="9" textAnchor="middle">TCP Window: 0 bytes</text>

                {/* Pipe 2 */}
                <path d="M 370 65 L 425 65" stroke="#f87171" strokeWidth="2" markerEnd="url(#arrow-flow)" />

                {/* Backend Client Node */}
                <rect x="430" y="30" width="170" height="70" rx="6" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="515" y="55" fill="#fbbf24" fontSize="11" fontWeight="700" textAnchor="middle">Export Worker / Pod</text>
                <text x="515" y="73" fill="#fca5a5" fontSize="10" textAnchor="middle">Slow Consumer</text>
                <text x="515" y="88" fill="#e2e8f0" fontSize="9" textAnchor="middle">(Heavy CSV formatting/GZIP)</text>
              </svg>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#f472b6', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                Why `net_write_timeout` Kills the Export after 60 Seconds
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>When streaming millions of rows, the MySQL server thread produces rows far faster than your backend pod can format, compress, or stream them out over HTTP to the client browser.</p>
                <p>The Linux OS TCP receive window shrinks to zero. The MySQL server socket send buffer fills completely. MySQL halts and waits for the socket buffer to drain.</p>
                <p>If the socket remains congested for longer than <code>net_write_timeout</code> (default <strong>60 seconds</strong> in MySQL), MySQL aborts the connection with <strong>Error 1160: Got an error writing communication packets</strong>.</p>
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '4px', borderLeft: '3px solid #38bdf8' }}>
                  <strong>The Production Fix:</strong>
                  <br />1. Asynchronous decoupling: buffer read chunks into a bounded memory queue (e.g. RingBuffer / Disruptor) and let workers process concurrently.
                  <br />2. Session adjustment: <code>SET SESSION net_write_timeout = 3600;</code> on the dedicated export connection.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
