import React, { useState } from 'react';

interface SqlStep {
  step: number;
  keyword: string;
  name: string;
  color: string;
  description: string;
  whyItMatters: string;
}

const SQL_STEPS: SqlStep[] = [
  { step: 1, keyword: 'FROM', name: '1. FROM & JOIN', color: '#38bdf8', description: 'Identifies working tables and performs Cartesian product / JOIN match algorithms to create working dataset.', whyItMatters: 'Table aliases defined here become available to all subsequent steps.' },
  { step: 2, keyword: 'WHERE', name: '2. WHERE Filter', color: '#f87171', description: 'Filters raw individual rows before any aggregation happens.', whyItMatters: 'Cannot use aggregate functions (like COUNT/SUM) or SELECT aliases here!' },
  { step: 3, keyword: 'GROUP BY', name: '3. GROUP BY', color: '#fbbf24', description: 'Groups remaining rows by specified keys into summary buckets.', whyItMatters: 'All non-aggregated columns in SELECT must be included in GROUP BY.' },
  { step: 4, keyword: 'HAVING', name: '4. HAVING Filter', color: '#c084fc', description: 'Filters grouped summary buckets using aggregate conditions (e.g. HAVING COUNT(*) > 5).', whyItMatters: 'Filters grouped buckets, unlike WHERE which filters individual rows.' },
  { step: 5, keyword: 'SELECT', name: '5. SELECT & Expressions', color: '#34d399', description: 'Computes output expressions, window functions, and assigns column aliases.', whyItMatters: 'Column aliases are created NOW. That is why you CANNOT use a SELECT alias in WHERE/HAVING!' },
  { step: 6, keyword: 'DISTINCT', name: '6. DISTINCT', color: '#a78bfa', description: 'Removes duplicate rows from the computed result set.', whyItMatters: 'Requires sorting or hashing of full result set.' },
  { step: 7, keyword: 'ORDER BY', name: '7. ORDER BY', color: '#e879f9', description: 'Sorts final output rows by specified columns or aliases.', whyItMatters: 'Can use SELECT column aliases because SELECT executed in step 5!' },
  { step: 8, keyword: 'LIMIT / OFFSET', name: '8. LIMIT / OFFSET', color: '#94a3b8', description: 'Paginates output and returns specified subset of rows.', whyItMatters: 'Executed last — offsetting still requires computing preceding steps.' },
];

export default function SqlExecutionOrderDiagram(): React.JSX.Element {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(4); // Default to SELECT
  const activeStep = SQL_STEPS[activeStepIndex];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          SQL Order of Execution Pipeline (Logical Order vs Written Order)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Pipeline Step Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {SQL_STEPS.map((st, idx) => {
            const isSelected = idx === activeStepIndex;
            return (
              <button
                key={st.step}
                onClick={() => setActiveStepIndex(idx)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: isSelected ? `1px solid ${st.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? `${st.color}18` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {st.name}
              </button>
            );
          })}
        </div>

        {/* Selected Step Overview */}
        <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', borderLeft: `4px solid ${activeStep.color}`, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '16px', color: activeStep.color }}>
              Step {activeStep.step}: {activeStep.keyword}
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${activeStep.color}22`, color: activeStep.color, fontWeight: 700 }}>
              Logical Rank #{activeStep.step}
            </span>
          </div>

          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {activeStep.description}
          </p>

          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
            Why This Order Matters in Real Queries
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', backgroundColor: '#05070e', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', lineHeight: 1.4 }}>
            {activeStep.whyItMatters}
          </div>
        </div>
      </div>
    </div>
  );
}
