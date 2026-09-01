import React, { useState } from 'react';

type RagTab = 'pipeline' | 'vector_search' | 'evolution' | 'rag_vs_finetune';
type PipelineMode = 'ingestion' | 'retrieval';

export default function RagArchitectureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<RagTab>('pipeline');
  const [pipelineMode, setPipelineMode] = useState<PipelineMode>('retrieval');
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.75);

  const chunks = [
    { id: 1, title: 'Chunk A: AWS S3 Pricing & Lifecycle Rules', score: 0.92, matched: true, text: 'S3 Standard charges $0.023/GB. Lifecycle policies automatically transition old objects to Glacier after 90 days.' },
    { id: 2, title: 'Chunk B: CloudWatch Metrics & S3 Alarms', score: 0.81, matched: true, text: 'Enable RequestMetrics to monitor S3 4xx/5xx errors and trigger SNS alerts via CloudWatch.' },
    { id: 3, title: 'Chunk C: Kafka Partition Replication', score: 0.34, matched: false, text: 'Kafka partitions replicate across brokers using KRaft quorum leader-follower logs.' },
    { id: 4, title: 'Chunk D: Docker Multi-Stage Builds', score: 0.18, matched: false, text: 'Multi-stage Docker builds reduce final image sizes by discarding intermediate SDK tools.' }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <path d="M11 8v6M8 11h6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          RAG (Retrieval-Augmented Generation) Architecture Visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'pipeline', label: '🔄 Ingestion & Retrieval Flows', color: '#38bdf8' },
            { id: 'vector_search', label: '🎯 Vector Similarity Search', color: '#34d399' },
            { id: 'evolution', label: '🚀 Naive ➔ Advanced ➔ Agentic', color: '#fbbf24' },
            { id: 'rag_vs_finetune', label: '⚖️ RAG vs Fine-Tuning', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as RagTab)}
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
        {/* TAB 1: PIPELINE WORKFLOW */}
        {activeTab === 'pipeline' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={() => setPipelineMode('retrieval')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${pipelineMode === 'retrieval' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  background: pipelineMode === 'retrieval' ? '#38bdf820' : 'rgba(255,255,255,0.02)',
                  color: pipelineMode === 'retrieval' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                  fontWeight: pipelineMode === 'retrieval' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ⚡ 1. Online Retrieval & Generation Flow (User Query ➔ LLM)
              </button>
              <button
                onClick={() => setPipelineMode('ingestion')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${pipelineMode === 'ingestion' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                  background: pipelineMode === 'ingestion' ? '#34d39920' : 'rgba(255,255,255,0.02)',
                  color: pipelineMode === 'ingestion' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  fontWeight: pipelineMode === 'ingestion' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📥 2. Offline Ingestion & Indexing Flow (Docs ➔ Vector DB)
              </button>
            </div>

            {/* SVG Pipeline Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="arrow-rag-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                  <marker id="arrow-rag-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                </defs>

                {pipelineMode === 'retrieval' ? (
                  <g transform="translate(15, 25)">
                    {/* 1. User Query */}
                    <rect x="0" y="20" width="125" height="85" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                    <text x="12" y="45" fill="#38bdf8" fontSize="11" fontWeight="700">1. User Query</text>
                    <text x="12" y="65" fill="#e0f2fe" fontSize="9">"What is S3 pricing</text>
                    <text x="12" y="80" fill="#e0f2fe" fontSize="9">after 90 days?"</text>

                    {/* Flow 1 to 2 */}
                    <path d="M 130 62 L 180 62" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-rag-blue)" className="interactive-diagram-flowing-path" />

                    {/* 2. Embedding Model */}
                    <rect x="185" y="20" width="135" height="85" rx="6" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" />
                    <text x="12" y="45" transform="translate(185, 0)" fill="#a78bfa" fontSize="11" fontWeight="700">2. Embedder</text>
                    <text x="12" y="65" transform="translate(185, 0)" fill="#e2e8f0" fontSize="9">text-embedding-3</text>
                    <text x="12" y="80" transform="translate(185, 0)" fill="#c4b5fd" fontSize="9">[0.21, -0.44, 0.89...]</text>

                    {/* Flow 2 to 3 */}
                    <path d="M 325 62 L 375 62" fill="none" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arrow-rag-blue)" className="interactive-diagram-flowing-path" />

                    {/* 3. Vector DB */}
                    <rect x="380" y="10" width="155" height="105" rx="6" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" strokeWidth="1.5" />
                    <text x="12" y="32" transform="translate(380, 0)" fill="#34d399" fontSize="11" fontWeight="700">3. Vector Database</text>
                    <text x="12" y="52" transform="translate(380, 0)" fill="#e2e8f0" fontSize="9">Qdrant / Pinecone / pgvector</text>
                    <text x="12" y="70" transform="translate(380, 0)" fill="#86efac" fontSize="9">🔍 Top-K Cosine Similarity</text>
                    <text x="12" y="90" transform="translate(380, 0)" fill="#86efac" fontSize="8">Fetches Chunks A & B</text>

                    {/* Flow 3 to 4 */}
                    <path d="M 540 62 L 590 62" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-rag-blue)" className="interactive-diagram-flowing-path" />

                    {/* 4. Augmented Prompt + LLM */}
                    <rect x="595" y="10" width="190" height="105" rx="6" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="12" y="32" transform="translate(595, 0)" fill="#fbbf24" fontSize="11" fontWeight="700">4. LLM Generation</text>
                    <text x="12" y="52" transform="translate(595, 0)" fill="#fef08a" fontSize="9">"Context: [Chunk A, B]"</text>
                    <text x="12" y="70" transform="translate(595, 0)" fill="#e2e8f0" fontSize="9">"Question: S3 pricing..."</text>
                    <text x="12" y="92" transform="translate(595, 0)" fill="#6ee7b7" fontSize="9" fontWeight="700">✨ 100% Grounded Answer</text>
                  </g>
                ) : (
                  <g transform="translate(15, 25)">
                    {/* Ingestion Steps */}
                    <rect x="0" y="20" width="135" height="85" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                    <text x="12" y="45" fill="#34d399" fontSize="11" fontWeight="700">1. Raw Documents</text>
                    <text x="12" y="65" fill="#e2e8f0" fontSize="9">PDFs, Markdown, Wiki</text>
                    <text x="12" y="80" fill="#94a3b8" fontSize="9">500MB corporate data</text>

                    <path d="M 140 62 L 195 62" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-rag-green)" className="interactive-diagram-flowing-path" />

                    <rect x="200" y="20" width="145" height="85" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                    <text x="12" y="45" transform="translate(200, 0)" fill="#38bdf8" fontSize="11" fontWeight="700">2. Chunking Engine</text>
                    <text x="12" y="65" transform="translate(200, 0)" fill="#e2e8f0" fontSize="9">Recursive Character Split</text>
                    <text x="12" y="80" transform="translate(200, 0)" fill="#93c5fd" fontSize="9">512 tokens + 50 overlap</text>

                    <path d="M 350 62 L 405 62" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-rag-green)" className="interactive-diagram-flowing-path" />

                    <rect x="410" y="20" width="145" height="85" rx="6" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" />
                    <text x="12" y="45" transform="translate(410, 0)" fill="#a78bfa" fontSize="11" fontWeight="700">3. Dense Embedder</text>
                    <text x="12" y="65" transform="translate(410, 0)" fill="#e2e8f0" fontSize="9">Embed chunks to vectors</text>
                    <text x="12" y="80" transform="translate(410, 0)" fill="#c4b5fd" fontSize="9">1536-dim coordinates</text>

                    <path d="M 560 62 L 615 62" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-rag-green)" className="interactive-diagram-flowing-path" />

                    <rect x="620" y="10" width="165" height="105" rx="6" fill="rgba(52, 211, 153, 0.25)" stroke="#34d399" strokeWidth="1.5" />
                    <text x="12" y="32" transform="translate(620, 0)" fill="#34d399" fontSize="11" fontWeight="700">4. Vector DB Index</text>
                    <text x="12" y="52" transform="translate(620, 0)" fill="#e2e8f0" fontSize="9">HNSW Graph Index</text>
                    <text x="12" y="70" transform="translate(620, 0)" fill="#86efac" fontSize="9">Stores Vector + Metadata</text>
                    <text x="12" y="90" transform="translate(620, 0)" fill="#86efac" fontSize="8">Ready for sub-ms search</text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}

        {/* TAB 2: VECTOR SIMILARITY SEARCH SIMULATOR */}
        {activeTab === 'vector_search' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)' }}>
                User Query: <strong style={{ color: '#38bdf8' }}>"How much does S3 cost and when does it move to Glacier?"</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Similarity Cutoff:</span>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={similarityThreshold}
                  onChange={e => setSimilarityThreshold(Number(e.target.value))}
                  style={{ cursor: 'pointer', width: '100px' }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                  {similarityThreshold.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {chunks.map(chunk => {
                const isPassed = chunk.score >= similarityThreshold;
                return (
                  <div
                    key={chunk.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: isPassed ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isPassed ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isPassed ? '#34d399' : '#94a3b8' }}>
                        {chunk.title}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isPassed ? '#34d39920' : 'rgba(255,255,255,0.06)',
                        color: isPassed ? '#34d399' : '#94a3b8',
                        fontFamily: 'monospace'
                      }}>
                        Score: {chunk.score.toFixed(2)} {isPassed ? '✓' : '✗'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                      {chunk.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: EVOLUTION (NAIVE TO AGENTIC RAG) */}
        {activeTab === 'evolution' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '14px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                1. Naive RAG (Basic)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '6px' }}>
                Embed query ➔ Top-K search ➔ Prompt LLM.
              </div>
              <div style={{ fontSize: '11px', color: '#f87171' }}>
                ⚠️ Flaws: Chunks cut off sentences; irrelevant top-k results pollute context; no query reformulation.
              </div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                2. Advanced RAG (Optimized)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '6px' }}>
                Pre-retrieval (Query Expansion, HyDE) + Post-retrieval (Cross-Encoder Re-ranking & Context Compression).
              </div>
              <div style={{ fontSize: '11px', color: '#34d399' }}>
                ✨ 80%+ retrieval precision with Cohere/BGE rerankers.
              </div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                3. Agentic RAG (Autonomous)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '6px' }}>
                Autonomous agent decides <em>when</em> to retrieve, routes between multiple vector DBs/SQL, self-evaluates context, and re-queries if answer is incomplete.
              </div>
              <div style={{ fontSize: '11px', color: '#fbbf24' }}>
                🚀 Self-correcting multi-hop reasoning.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RAG VS FINE-TUNING */}
        {activeTab === 'rag_vs_finetune' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '16px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                📚 RAG = Knowledge & Facts ("Open Book Exam")
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '8px' }}>
                <strong>Analogy:</strong> Looking up a patient's real-time chart before making a diagnosis.
              </div>
              <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Best for dynamic, changing, or private proprietary documentation.</li>
                <li>Provides verifiable source citations with zero retraining cost.</li>
                <li>Zero hallucination for enterprise SOPs, legal contracts, and logs.</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa', marginBottom: '8px' }}>
                🎓 Fine-Tuning = Form, Style & Behavior ("Medical School")
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '8px' }}>
                <strong>Analogy:</strong> Training a doctor in medical vocabulary, tone, and reasoning patterns.
              </div>
              <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Best for teaching specific output formats (JSON schemas, SQL dialets).</li>
                <li>Does NOT reliably update knowledge (still prone to hallucinating facts).</li>
                <li>Expensive GPU training and static snapshot cutoff.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
