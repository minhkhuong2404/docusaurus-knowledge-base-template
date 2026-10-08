import React, { useState } from 'react';

type PersonaTab = 'swe' | 'bridge' | 'aie';

interface EvolutionPhase {
  id: PersonaTab;
  title: string;
  badge: string;
  color: string;
  mindset: string;
  dataPattern: string;
  queryModel: string;
  latencySla: string;
  failureMode: string;
  architectureStack: string[];
  responsibilities: string[];
}

const PHASES: Record<PersonaTab, EvolutionPhase> = {
  swe: {
    id: 'swe',
    title: '1. Traditional Software Engineer',
    badge: 'Deterministic Exact Match',
    color: '#34d399',
    mindset: 'Deterministic rules, boolean logic, ACID guarantees, relational joins.',
    dataPattern: 'Structured 2D tables, rigid schemas, normalized relations (1NF-3NF), exact primary/foreign keys.',
    queryModel: 'SQL exact predicates: WHERE user_id = 101 AND status = "ACTIVE"',
    latencySla: 'Single-digit ms (1 - 5 ms) via B-Tree index seek',
    failureMode: 'Deadlocks, unindexed table scans, N+1 query waterfalls, schema migration lockouts',
    architectureStack: ['PostgreSQL / MySQL', 'Redis (Cache / Locks)', 'Kafka / RabbitMQ', 'Spring Boot / Node.js / Go', 'Flyway / Liquibase'],
    responsibilities: [
      'Design normalized relational schemas and enforce referential integrity',
      'Optimize B-Tree / Hash indexes with Leftmost Prefix & ESR rules',
      'Manage connection pools (HikariCP) and thread pool saturation',
      'Maintain ACID boundaries across distributed services (Saga / Outbox)'
    ]
  },
  bridge: {
    id: 'bridge',
    title: '2. The Infrastructure Bridge (Vector DB)',
    badge: 'Geometric Manifolds & Semantic Storage',
    color: '#38bdf8',
    mindset: 'From discrete symbols to dense floating-point manifolds; probabilistic recall replacing exact matches.',
    dataPattern: 'High-dimensional embeddings (768..3072 dims) + sparse metadata payloads (tenant_id, timestamps, ACLs).',
    queryModel: 'ANN geometric similarity: ORDER BY embedding <=> query_vector LIMIT 5',
    latencySla: 'Sub-linear ANN search (2 - 10 ms) across 100M+ vectors',
    failureMode: 'HNSW memory exhaustion (OOM), embedding model drift across checkpoints, multi-tenant filter starvation',
    architectureStack: ['Qdrant / Milvus / Pinecone', 'pgvector (PostgreSQL extension)', 'HNSW & IVF-PQ Index Engines', 'OpenAI / Cohere / HuggingFace Embeddings'],
    responsibilities: [
      'Size dedicated RAM envelopes for resident HNSW proximity graphs',
      'Implement single-stage pre-filtering to prevent disconnected graph traps',
      'Configure Product Quantization (PQ) and Scalar Quantization (SQ8) to cut RAM 95%',
      'Build Blue/Green re-indexing pipelines for embedding checkpoint upgrades'
    ]
  },
  aie: {
    id: 'aie',
    title: '3. Full-Spectrum AI Systems Engineer',
    badge: 'Agentic Loops, RAG & Cognitive Infrastructure',
    color: '#c084fc',
    mindset: 'Systems engineering meets non-deterministic LLMs; orchestrating context, long-term memory, and tool actuation.',
    dataPattern: 'Dynamic document chunking graphs, hybrid dense/sparse vectors (BM25 + HNSW), episodic agent state, evaluation traces.',
    queryModel: 'Reciprocal Rank Fusion (RRF) + Cross-Encoder Reranking + LLM Context Injection',
    latencySla: 'End-to-End P99: 800ms - 2500ms (dominated by LLM TTFT & token streaming)',
    failureMode: 'Hallucination loops, context window saturation, tool invocation hallucination, toxic prompt injection',
    architectureStack: ['LangChain / LlamaIndex / Spring AI', 'Cross-Encoder Rerankers (bge-reranker)', 'Vector Stores + Hybrid Search', 'Observability (Langfuse / OpenTelemetry)'],
    responsibilities: [
      'Build semantic chunking pipelines preserving syntax and semantic continuity',
      'Design hybrid retrieval combining keyword precision (BM25) with vector recall',
      'Implement multi-agent memory tiers (working memory vs long-term vector store)',
      'Establish automated RAG evaluation suites (RAGAS: Faithfulness, Answer Relevance)'
    ]
  }
};

export default function SweToAiEngineerEvolutionDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<PersonaTab>('bridge');
  const phase = PHASES[activeTab];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 820px) {
          .evolution-split-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          The Engineering Evolution: Software Engineer ➔ Vector DB ➔ AI Engineer
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
          Click an evolutionary stage to inspect the technical upgrade
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {(Object.keys(PHASES) as PersonaTab[]).map((key) => {
            const item = PHASES[key];
            const isSelected = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isSelected ? `1.5px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${item.color}18` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '12px',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? `0 0 12px ${item.color}33` : 'none'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                {item.title}
              </button>
            );
          })}
        </div>

        {/* Selected Banner */}
        <div style={{
          backgroundColor: '#0c0e17',
          padding: '14px 18px',
          borderRadius: '10px',
          borderLeft: `4px solid ${phase.color}`,
          marginBottom: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{phase.title}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${phase.color}22`, color: phase.color, fontWeight: 700 }}>
              {phase.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
            <strong>Engineering Mindset:</strong> {phase.mindset}
          </p>
        </div>

        {/* Animated Architectural Pipeline Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: phase.color, fontWeight: 700, marginBottom: '8px' }}>
            System Dataflow & Semantic Pipeline
          </div>

          <svg viewBox="0 0 760 170" className="interactive-diagram-svg" style={{ maxHeight: '190px' }}>
            <defs>
              <marker id="evo-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill={phase.color} />
              </marker>
              <filter id="glowBallEvo" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Stage 1: Data Ingestion */}
            <g transform="translate(30, 25)">
              <rect width="180" height="95" rx="8" fill="#070913" stroke={activeTab === 'swe' ? '#34d399' : 'rgba(255,255,255,0.1)'} strokeWidth="1.5" />
              <text x="15" y="24" fill={activeTab === 'swe' ? '#34d399' : '#fff'} fontSize="11" fontWeight="700">
                {activeTab === 'swe' ? 'Relational OLTP Data' : 'Document & Text Corpus'}
              </text>
              <foreignObject x="12" y="32" width="156" height="55">
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.35 }}>
                  {activeTab === 'swe' ? 'Normalized rows, foreign keys, write-ahead log flush' : 'Semantic chunking, token slicing, markdown parsing'}
                </div>
              </foreignObject>
            </g>

            {/* Path 1 -> 2 */}
            <path id="evo-path-1" d="M 215 72 L 285 72" stroke={phase.color} strokeWidth="2.5" strokeDasharray="4 3" markerEnd="url(#evo-arrow)" />
            <circle r="4" fill={phase.color} filter="url(#glowBallEvo)">
              <animateMotion dur="1.8s" repeatCount="indefinite">
                <mpath href="#evo-path-1" />
              </animateMotion>
            </circle>

            {/* Stage 2: Core Storage / Vector Engine */}
            <g transform="translate(290, 25)">
              <rect width="200" height="95" rx="8" fill="#070913" stroke={activeTab === 'bridge' ? '#38bdf8' : 'rgba(255,255,255,0.1)'} strokeWidth="1.5" />
              <text x="15" y="24" fill={activeTab === 'bridge' ? '#38bdf8' : '#fff'} fontSize="11" fontWeight="700">
                {activeTab === 'swe' ? 'B-Tree / LSM Engine' : 'Vector Database (HNSW)'}
              </text>
              <foreignObject x="12" y="32" width="176" height="55">
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.35 }}>
                  {activeTab === 'swe' ? 'Slotted 8KB pages, exact B-Tree seek O(log N)' : 'Dense float32 embeddings, HNSW proximity graph skip walk'}
                </div>
              </foreignObject>
            </g>

            {/* Path 2 -> 3 */}
            <path id="evo-path-2" d="M 495 72 L 565 72" stroke={phase.color} strokeWidth="2.5" strokeDasharray="4 3" markerEnd="url(#evo-arrow)" />
            <circle r="4" fill={phase.color} filter="url(#glowBallEvo)">
              <animateMotion dur="1.8s" repeatCount="indefinite">
                <mpath href="#evo-path-2" />
              </animateMotion>
            </circle>

            {/* Stage 3: Consumer / Cognitive Application */}
            <g transform="translate(570, 25)">
              <rect width="160" height="95" rx="8" fill="#070913" stroke={activeTab === 'aie' ? '#c084fc' : 'rgba(255,255,255,0.1)'} strokeWidth="1.5" />
              <text x="15" y="24" fill={activeTab === 'aie' ? '#c084fc' : '#fff'} fontSize="11" fontWeight="700">
                {activeTab === 'swe' ? 'REST API Client' : 'LLM Agent / RAG'}
              </text>
              <foreignObject x="12" y="32" width="136" height="55">
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.35 }}>
                  {activeTab === 'swe' ? 'Deterministic JSON responses, DTO mapping' : 'Context-augmented generation, tool calling, memory'}
                </div>
              </foreignObject>
            </g>

            {/* Bottom annotation */}
            <text x="380" y="150" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10.5">
              Evolutionary Path: Traditional SWE backend discipline forms the necessary foundation for AI infrastructure
            </text>
          </svg>
        </div>

        {/* 2-Column Split: Mechanics vs Responsibilities */}
        <div className="evolution-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
          {/* Left Column: System Realities */}
          <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: phase.color, fontWeight: 700, marginBottom: '12px' }}>
              System Realities & Execution SLAs
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Data Pattern</div>
              <div style={{ fontSize: '12px', color: '#fff', marginTop: '2px' }}>{phase.dataPattern}</div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Query Model</div>
              <div style={{ fontSize: '11.5px', color: '#fbbf24', fontFamily: 'monospace', marginTop: '2px' }}>{phase.queryModel}</div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Target Latency SLA</div>
              <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 700, marginTop: '2px' }}>{phase.latencySla}</div>
            </div>

            <div>
              <div style={{ fontSize: '10.5px', color: '#f87171', textTransform: 'uppercase', fontWeight: 700 }}>Primary Failure Mode</div>
              <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '2px' }}>{phase.failureMode}</div>
            </div>
          </div>

          {/* Right Column: Key Upgrades & Tech Stack */}
          <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: phase.color, fontWeight: 700, marginBottom: '10px' }}>
              Core Responsibilities & Technical Capabilities
            </div>
            <ul style={{ margin: '0 0 14px 0', paddingLeft: '16px', fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              {phase.responsibilities.map((r, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
              ))}
            </ul>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Representative Tech Stack</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {phase.architectureStack.map((tech) => (
                  <span key={tech} style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
