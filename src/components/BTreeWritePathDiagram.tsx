import React, { useState } from 'react';

export default function BTreeWritePathDiagram(): React.JSX.Element {
  const [splitActive, setSplitActive] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const handleStep = (stepIdx: number) => {
    setActiveStep(stepIdx);
    if (stepIdx === 3) {
      setSplitActive(true);
    }
  };

  const handleReset = () => {
    setActiveStep(null);
    setSplitActive(false);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/>
          <line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/>
        </svg>
        <span>B-Tree Page Split & Write Amplification Path</span>
        <button
          onClick={handleReset}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--ifm-color-content)',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Reset Simulation
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 230" className="interactive-diagram-svg">
          {/* Index Root Node (value: 20) */}
          <g>
            <rect x="290" y="15" width="100" height="30" rx="4" fill="rgba(244,114,182,0.08)" stroke="#f472b6" strokeWidth="1.5" />
            <text x="340" y="34" textAnchor="middle" fill="#f472b6" fontSize="11" fontWeight="800">Root Node: [20]</text>
          </g>

          {/* Child pointers down */}
          <line x1="320" y1="45" x2="190" y2="75" stroke={activeStep !== null ? '#38bdf8' : 'rgba(255,255,255,0.15)'} strokeWidth={activeStep !== null ? 2 : 1} strokeDasharray={activeStep === 0 ? '3,3' : 'none'} />
          <line x1="360" y1="45" x2="490" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Left Intermediate Node (value: 10) */}
          <g>
            <rect x="140" y="75" width="100" height="30" rx="4" fill="rgba(244,114,182,0.08)" stroke="#f472b6" strokeWidth="1.5" />
            <text x="190" y="94" textAnchor="middle" fill="#f472b6" fontSize="11" fontWeight="800">Internal: [10]</text>
          </g>

          {/* Right Intermediate Node (value: 30) */}
          <g>
            <rect x="440" y="75" width="100" height="30" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <text x="490" y="94" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="11" fontWeight="700">Internal: [30]</text>
          </g>

          {/* Leaf node pointers */}
          <line x1="170" y1="105" x2="90" y2="145" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          
          {/* Path to the target leaf page */}
          <line x1="210" y1="105" x2="250" y2="145" stroke={activeStep !== null ? '#38bdf8' : 'rgba(255,255,255,0.15)'} strokeWidth={activeStep !== null ? 2 : 1} />

          {/* Leaf 1 (keys: 5, 8) */}
          <g>
            <rect x="40" y="145" width="80" height="35" rx="3" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x="80" y="166" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Leaf: [5, 8]</text>
          </g>

          {/* Leaf 2 (keys: 12, 14, 15 - FULL) */}
          {!splitActive ? (
            <g>
              <rect x="180" y="145" width="140" height="35" rx="3"
                fill={activeStep === 2 ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)'}
                stroke={activeStep === 2 ? '#fbbf24' : activeStep === 0 ? '#38bdf8' : 'rgba(255,255,255,0.2)'}
                strokeWidth={activeStep === 2 || activeStep === 0 ? 2 : 1}
              />
              <text x="250" y="166" textAnchor="middle" fill={activeStep === 2 ? '#fbbf24' : 'var(--ifm-color-content)'} fontSize="10.5" fontWeight="bold">
                Leaf: [12, 14, 15] (Full)
              </text>
              <text x="250" y="193" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="bold">Target Page for Key 13</text>
            </g>
          ) : (
            // After Split
            <g style={{ transition: 'opacity 0.4s' }}>
              {/* Old Leaf split */}
              <rect x="150" y="145" width="85" height="35" rx="3" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.5" />
              <text x="192" y="166" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">Leaf: [12, 13]</text>

              {/* New Allocated Leaf split */}
              <rect x="255" y="145" width="85" height="35" rx="3" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
              <text x="297" y="166" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="bold">Leaf: [14, 15]</text>

              <path d="M 192 105 L 297 145" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3,2" />
              <text x="245" y="200" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="bold">⚠️ Page Split: Allocated 1 new 8KB page</text>
            </g>
          )}

          {/* Leaf 3 (keys: 25, 28) */}
          <g>
            <rect x="370" y="145" width="100" height="35" rx="3" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x="420" y="166" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Leaf: [25, 28]</text>
          </g>

          {/* WAL buffer box */}
          <g>
            <rect x="530" y="15" width="130" height="45" rx="5"
              fill={activeStep === 1 ? 'rgba(251,191,36,0.1)' : 'rgba(0,0,0,0.2)'}
              stroke={activeStep === 1 ? '#fbbf24' : 'rgba(255,255,255,0.1)'}
              strokeWidth="1.5"
            />
            <text x="595" y="34" textAnchor="middle" fill={activeStep === 1 ? '#fbbf24' : 'var(--ifm-color-content-secondary)'} fontSize="10" fontWeight="700">WAL Append</text>
            <text x="595" y="46" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">
              {activeStep >= 1 ? '📝 LSN: key=13 inserted' : 'idle'}
            </text>
          </g>
        </svg>
      </div>

      {/* Action Simulation Steps */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <button
          onClick={() => handleStep(0)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 700,
            fontSize: '11.5px',
            cursor: 'pointer',
            background: activeStep === 0 ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
            color: activeStep === 0 ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeStep === 0 ? '0 0 0 1.5px #38bdf850' : 'none'
          }}
        >
          Step 1: Traverse Index
        </button>

        <button
          onClick={() => handleStep(1)}
          disabled={activeStep === null}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 700,
            fontSize: '11.5px',
            cursor: activeStep === null ? 'not-allowed' : 'pointer',
            background: activeStep === 1 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)',
            color: activeStep === 1 ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeStep === 1 ? '0 0 0 1.5px #fbbf2450' : 'none'
          }}
        >
          Step 2: Append WAL
        </button>

        <button
          onClick={() => handleStep(2)}
          disabled={activeStep === null || activeStep < 1}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 700,
            fontSize: '11.5px',
            cursor: activeStep === null || activeStep < 1 ? 'not-allowed' : 'pointer',
            background: activeStep === 2 ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)',
            color: activeStep === 2 ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeStep === 2 ? '0 0 0 1.5px #34d39950' : 'none'
          }}
        >
          Step 3: Modify Page in RAM
        </button>

        <button
          onClick={() => handleStep(3)}
          disabled={activeStep === null || activeStep < 2}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 700,
            fontSize: '11.5px',
            cursor: activeStep === null || activeStep < 2 ? 'not-allowed' : 'pointer',
            background: activeStep === 3 ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.03)',
            color: activeStep === 3 ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeStep === 3 ? '0 0 0 1.5px #f8717150' : 'none'
          }}
        >
          Step 4: Split Full Page
        </button>
      </div>

      {/* Description Panel */}
      <div className="interactive-diagram-details-card" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        {activeStep === 0 && (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            🔍 **Traversing**: The engine reads Root [20] &rarr; decides Key 13 belongs to left sub-tree ([10]) &rarr; determines Leaf [12, 14, 15] is the destination. If this leaf isn't in RAM (Buffer Pool), it requires a random disk read block load.
          </p>
        )}
        {activeStep === 1 && (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            📝 **WAL Durability**: Before mutating the actual index page, the operation logs the mutation description to the WAL buffer on disk sequentially. This protects against transaction loss if the server crashes immediately after.
          </p>
        )}
        {activeStep === 2 && (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            💻 **In-Memory Modification**: The target leaf page `[12, 14, 15]` is loaded into the database buffer pool and modified in RAM. The page is now marked **dirty**. But wait... the leaf is already at its capacity limit of 3 keys!
          </p>
        )}
        {activeStep === 3 && (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            💥 **Write Amplification (Page Split)**: Inserting Key 13 triggers a page split. The engine allocates a new 8KB page, redistributes keys (`[12, 13]` and `[14, 15]`), and updates the parent pointer in Node [10]. To write a single key, two pages had to be rewritten!
          </p>
        )}
        {activeStep === null && (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', textAlign: 'center' }}>
            Follow the steps above to insert Key 13 into the B-Tree and watch how a page split occurs when a node overflows.
          </p>
        )}
      </div>
    </div>
  );
}
