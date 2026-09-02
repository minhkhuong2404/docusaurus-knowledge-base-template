import React, { useState } from 'react';

type BatchTab = 'architecture' | 'chunk_lifecycle' | 'scaling_patterns' | 'chunk_calculator';

export default function SpringBatchArchDiagram({ initialTab = 'architecture' }: { initialTab?: BatchTab }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<BatchTab>(initialTab);
  const [datasetSize, setDatasetSize] = useState<number>(500000); // 500k items
  const [chunkSize, setChunkSize] = useState<number>(100);
  const [itemLatencyMs, setItemLatencyMs] = useState<number>(5); // 5ms per item

  // Calculations for calculator
  const totalTransactions = Math.ceil(datasetSize / chunkSize);
  const singleThreadedSeconds = (datasetSize * itemLatencyMs) / 1000;
  const multiThreadedSeconds = (datasetSize * itemLatencyMs) / (1000 * 8); // 8 threads
  const rollbackItemsOnFailure = chunkSize;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Spring Batch Architecture & Chunk Processing Engine
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'architecture', label: '🏗️ Core Architecture', color: '#a855f7' },
            { id: 'chunk_lifecycle', label: '⚡ Chunk Lifecycle & Tx', color: '#2dd4bf' },
            { id: 'scaling_patterns', label: '🚀 Scaling & Partitioning', color: '#38bdf8' },
            { id: 'chunk_calculator', label: '🧮 Chunk Sizing Calculator', color: '#fbbf24' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as BatchTab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: CORE ARCHITECTURE & METADATA */}
        {activeTab === 'architecture' && (
          <div>
            <div style={{
              padding: '12px 16px',
              background: 'rgba(168, 85, 247, 0.06)',
              borderLeft: '4px solid #a855f7',
              borderRadius: '0 8px 8px 0',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7', marginBottom: '4px' }}>
                Spring Batch Core Architecture & JobRepository State Machine
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                A <strong>JobLauncher</strong> starts a <strong>Job</strong> with unique <strong>JobParameters</strong>. A Job contains one or more <strong>Steps</strong>. All execution states (commits, skips, rollback points) are persisted atomically to the <strong>JobRepository</strong> (tables: <code>BATCH_JOB_INSTANCE</code>, <code>BATCH_JOB_EXECUTION</code>, <code>BATCH_STEP_EXECUTION</code>).
              </div>
            </div>

            {/* SVG Hierarchy */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="sb-arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#a855f7" />
                  </marker>
                  <marker id="sb-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                  <marker id="sb-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* 1. JobLauncher */}
                <g transform="translate(15, 45)">
                  <rect x="0" y="0" width="140" height="85" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <text x="12" y="26" fill="#ffffff" fontSize="11" fontWeight="700">🚀 JobLauncher</text>
                  <text x="12" y="46" fill="#94a3b8" fontSize="9">Trigger: REST / Cron</text>
                  <text x="12" y="66" fill="#a855f7" fontSize="8" fontWeight="700">+ JobParameters</text>
                </g>

                <path d="M 160 85 L 210 85" fill="none" stroke="#a855f7" strokeWidth="2" markerEnd="url(#sb-arrow-purple)" className="interactive-diagram-flowing-path" />

                {/* 2. Job Container */}
                <g transform="translate(215, 20)">
                  <rect x="0" y="0" width="310" height="135" rx="8" fill="rgba(168, 85, 247, 0.08)" stroke="#a855f7" strokeWidth="1.5" />
                  <text x="15" y="24" fill="#a855f7" fontSize="11" fontWeight="700">📦 Job: "monthlyInvoiceJob"</text>

                  {/* Step 1 */}
                  <rect x="15" y="38" width="130" height="40" rx="4" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                  <text x="25" y="58" fill="#38bdf8" fontSize="9" fontWeight="700">Step 1: Read CSV</text>
                  <text x="25" y="70" fill="#e2e8f0" fontSize="7.5">Chunked ETL</text>

                  {/* Step 2 */}
                  <rect x="165" y="38" width="130" height="40" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                  <text x="175" y="58" fill="#34d399" fontSize="9" fontWeight="700">Step 2: Generate PDF</text>
                  <text x="175" y="70" fill="#e2e8f0" fontSize="7.5">Bulk Storage Upload</text>

                  {/* Step 3 */}
                  <rect x="15" y="86" width="280" height="36" rx="4" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" />
                  <text x="25" y="104" fill="#fbbf24" fontSize="9" fontWeight="700">Step 3: Email Notification (Tasklet / Cleanup)</text>
                  <text x="25" y="116" fill="#e2e8f0" fontSize="7.5">Executes once upon Step 2 SUCCESS</text>
                </g>

                <path d="M 530 85 L 575 85" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#sb-arrow-green)" className="interactive-diagram-flowing-path" />

                {/* 3. JobRepository Metadata Engine */}
                <g transform="translate(580, 20)">
                  <rect x="0" y="0" width="220" height="135" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="15" y="24" fill="#34d399" fontSize="11" fontWeight="700">🗄️ JobRepository (DB)</text>
                  <rect x="15" y="35" width="190" height="24" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                  <text x="22" y="51" fill="#ffffff" fontSize="8" fontWeight="600">BATCH_JOB_INSTANCE</text>

                  <rect x="15" y="65" width="190" height="24" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                  <text x="22" y="81" fill="#ffffff" fontSize="8" fontWeight="600">BATCH_JOB_EXECUTION</text>

                  <rect x="15" y="95" width="190" height="24" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                  <text x="22" y="111" fill="#ffffff" fontSize="8" fontWeight="600">BATCH_STEP_EXECUTION (Commit Index)</text>
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* TAB 2: CHUNK LIFECYCLE & TRANSACTION BOUNDARY */}
        {activeTab === 'chunk_lifecycle' && (
          <div>
            <div style={{
              padding: '12px 16px',
              background: 'rgba(45, 212, 191, 0.06)',
              borderLeft: '4px solid #2dd4bf',
              borderRadius: '0 8px 8px 0',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#2dd4bf', marginBottom: '4px' }}>
                Chunk-Oriented Processing Loop (Read ➔ Process ➔ Write ➔ Commit)
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                Items are read <strong>one-by-one</strong> and passed to <code>ItemProcessor</code> until the chunk size (e.g. 100) is reached. <code>ItemWriter</code> receives the entire chunk list and executes a <strong>single bulk insert in 1 transaction</strong>. If an exception occurs, only that single chunk rolls back!
              </div>
            </div>

            {/* SVG Chunk Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Source */}
                <g transform="translate(15, 45)">
                  <rect x="0" y="0" width="120" height="80" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" />
                  <text x="12" y="30" fill="#94a3b8" fontSize="10" fontWeight="700">Data Source</text>
                  <text x="12" y="50" fill="#e2e8f0" fontSize="8">• CSV / JSON file</text>
                  <text x="12" y="65" fill="#e2e8f0" fontSize="8">• Database Cursor</text>
                </g>

                <path d="M 140 85 L 180 85" fill="none" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#sb-arrow-blue)" className="interactive-diagram-flowing-path" />

                {/* 1. ItemReader */}
                <g transform="translate(185, 35)">
                  <rect x="0" y="0" width="140" height="95" rx="6" fill="rgba(45, 212, 191, 0.12)" stroke="#2dd4bf" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#2dd4bf" fontSize="11" fontWeight="700">1. ItemReader</text>
                  <text x="12" y="44" fill="#ffffff" fontSize="9">Reads 1 item at a time</text>
                  <text x="12" y="62" fill="#94a3b8" fontSize="8">Loop until chunkSize=100</text>
                  <text x="12" y="80" fill="#a7f3d0" fontSize="8">Returns null at EOF</text>
                </g>

                <path d="M 330 85 L 370 85" fill="none" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#sb-arrow-blue)" className="interactive-diagram-flowing-path" />

                {/* 2. ItemProcessor */}
                <g transform="translate(375, 35)">
                  <rect x="0" y="0" width="150" height="95" rx="6" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#38bdf8" fontSize="11" fontWeight="700">2. ItemProcessor</text>
                  <text x="12" y="44" fill="#ffffff" fontSize="9">Transforms / Validates</text>
                  <text x="12" y="62" fill="#94a3b8" fontSize="8">Return null ➔ Skip item</text>
                  <text x="12" y="80" fill="#fecaca" fontSize="8">Skip/Retry Policy on err</text>
                </g>

                <path d="M 530 85 L 570 85" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#sb-arrow-green)" className="interactive-diagram-flowing-path" />

                {/* 3. ItemWriter & Tx Boundary */}
                <g transform="translate(575, 20)">
                  <rect x="0" y="0" width="225" height="130" rx="8" fill="rgba(52, 211, 153, 0.08)" stroke="#34d399" strokeWidth="2" strokeDasharray="4 4" />
                  <text x="15" y="22" fill="#34d399" fontSize="10" fontWeight="700">🛡️ Chunk Transaction Boundary</text>

                  <rect x="15" y="32" width="195" height="55" rx="4" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" />
                  <text x="22" y="52" fill="#34d399" fontSize="11" fontWeight="700">3. ItemWriter (Bulk)</text>
                  <text x="22" y="70" fill="#ffffff" fontSize="8">JdbcBatchItemWriter / JPA Bulk Insert</text>

                  <rect x="15" y="94" width="195" height="24" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="#34d399" />
                  <text x="25" y="110" fill="#86efac" fontSize="8" fontWeight="700">✅ COMMIT Chunk & Update StepExecution</text>
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* TAB 3: SCALING PATTERNS & PARTITIONING */}
        {activeTab === 'scaling_patterns' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                1. Multi-Threaded Step (Single JVM)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4, marginBottom: '8px' }}>
                Multiple threads concurrently execute the chunk loop.
              </div>
              <ul style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '16px', lineHeight: 1.5 }}>
                <li><code>TaskExecutor</code> runs multiple chunk transactions in parallel.</li>
                <li><strong>Trap:</strong> <code>ItemReader</code> MUST be synchronized (e.g. <code>SynchronizedItemStreamReader</code> or <code>JdbcPagingItemReader</code>).</li>
              </ul>
            </div>

            <div style={{ padding: '14px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                2. AsyncItemProcessor & AsyncItemWriter
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4, marginBottom: '8px' }}>
                Offloads slow transformation / REST APIs to thread pools.
              </div>
              <ul style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '16px', lineHeight: 1.5 }}>
                <li>Processor returns <code>Future&lt;O&gt;</code> immediately.</li>
                <li>Writer waits for futures to resolve before bulk inserting. 10x throughput boost for I/O bound processing.</li>
              </ul>
            </div>

            <div style={{ padding: '14px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                3. Local / Remote Partitioning (Recommended)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4, marginBottom: '8px' }}>
                Splits data by range into independent worker steps.
              </div>
              <ul style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '16px', lineHeight: 1.5 }}>
                <li><code>Partitioner</code> divides database IDs (e.g. 1-100K, 100K-200K).</li>
                <li>Each worker has its own isolated <code>StepExecution</code> and state. Fully thread-safe and cluster-scaleable!</li>
              </ul>
            </div>

            <div style={{ padding: '14px', background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa', marginBottom: '6px' }}>
                4. Remote Chunking (Messaging)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4, marginBottom: '8px' }}>
                Master reads and dispatches chunks over Kafka/RabbitMQ.
              </div>
              <ul style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '16px', lineHeight: 1.5 }}>
                <li>Workers across different JVMs process and write chunks.</li>
                <li>Ideal when processing CPU is heavy, but reading I/O is fast and centralized.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: CHUNK SIZING & THROUGHPUT CALCULATOR */}
        {activeTab === 'chunk_calculator' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>Dataset Size (Records):</div>
                <input
                  type="range"
                  min="10000"
                  max="2000000"
                  step="10000"
                  value={datasetSize}
                  onChange={e => setDatasetSize(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginTop: '4px', fontFamily: 'monospace' }}>
                  {datasetSize.toLocaleString()} records
                </div>
              </div>

              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>Chunk Size (Commit Interval):</div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={chunkSize}
                  onChange={e => setChunkSize(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginTop: '4px', fontFamily: 'monospace' }}>
                  {chunkSize} items / commit
                </div>
              </div>

              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>Item Processing Time (ms):</div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={itemLatencyMs}
                  onChange={e => setItemLatencyMs(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginTop: '4px', fontFamily: 'monospace' }}>
                  {itemLatencyMs} ms / record
                </div>
              </div>
            </div>

            {/* Output KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>Total DB Transactions</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                  {totalTransactions.toLocaleString()}
                </div>
              </div>

              <div style={{ padding: '12px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>Rollback Blast Radius</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f87171', marginTop: '2px' }}>
                  {rollbackItemsOnFailure} records
                </div>
              </div>

              <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>Single-Thread Time</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#fbbf24', marginTop: '2px' }}>
                  {(singleThreadedSeconds / 60).toFixed(1)} mins
                </div>
              </div>

              <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>Partitioned (8 Workers)</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
                  {(multiThreadedSeconds / 60).toFixed(1)} mins
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              <strong>Senior Rule of Thumb:</strong> Small chunks (10-50) incur high database commit transaction overhead; excessively large chunks (5,000+) increase memory heap pressure and result in massive rollback rework if 1 record fails. Optimal production chunk size is typically <strong>100 to 500</strong>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
