import React, { useState } from 'react';

interface Stage {
  id: number;
  name: string;
  badge: string;
  color: string;
  description: string;
  outputArtifact: string;
}

const STAGES: Stage[] = [
  {
    id: 1,
    name: '1. SQL Parser & Lexer',
    badge: 'Syntax Parsing',
    color: '#38bdf8',
    description: 'Converts raw SQL string into an Abstract Syntax Tree (AST). Validates syntax and table/column identifiers.',
    outputArtifact: 'Abstract Syntax Tree (AST) representation of query',
  },
  {
    id: 2,
    name: '2. Semantic Analyzer & Rewriter',
    badge: 'Query Rewrite',
    color: '#a78bfa',
    description: 'Checks permissions, applies view expansions, constant folding, and query rewrite rules (e.g. converting subqueries to JOINs).',
    outputArtifact: 'Logical Query Tree (Normalized Operators)',
  },
  {
    id: 3,
    name: '3. Cost-Based Optimizer (CBO)',
    badge: 'Cost Estimation',
    color: '#fbbf24',
    description: 'Uses table statistics (pg_statistic / histogram histograms, tuple counts, distinct values) to estimate I/O & CPU costs for thousands of potential execution trees.',
    outputArtifact: 'Lowest-Cost Physical Execution Plan (e.g. Index Scan + Hash Join)',
  },
  {
    id: 4,
    name: '4. Physical Executor',
    badge: 'Execution Engine',
    color: '#34d399',
    description: 'Executes physical plan node-by-node (Volcano iterator pattern), pulling tuple batches from disk buffer cache into memory.',
    outputArtifact: 'Final Result Set returned to client application',
  },
];

export default function QueryPlannerPipelineDiagram(): React.JSX.Element {
  const [activeStageId, setActiveStageId] = useState<number>(3); // Default to CBO
  const activeStage = STAGES[activeStageId - 1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Database Query Planner & Cost-Based Optimizer (CBO) Lifecycle
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Pipeline Stage Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {STAGES.map((st) => {
            const isSelected = st.id === activeStageId;
            return (
              <div
                key={st.id}
                onClick={() => setActiveStageId(st.id)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${st.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? `${st.color}15` : '#0c0e17',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: isSelected ? st.color : 'var(--ifm-color-content-secondary)', fontWeight: 700 }}>
                  STAGE {st.id}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#fff' : 'var(--ifm-color-content)', marginTop: '2px' }}>
                  {st.badge}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Card */}
        <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', borderLeft: `4px solid ${activeStage.color}`, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff', marginBottom: '6px' }}>
            {activeStage.name}
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {activeStage.description}
          </p>

          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
            Generated Stage Artifact
          </div>
          <div style={{ fontSize: '12.5px', fontFamily: 'monospace', color: activeStage.color, backgroundColor: '#05070e', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {activeStage.outputArtifact}
          </div>
        </div>
      </div>
    </div>
  );
}
