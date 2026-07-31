import React, { useState } from 'react';

export default function GitConflictResolutionDiagram(): React.JSX.Element {
  const [resolution, setResolution] = useState<'conflict' | 'ours' | 'theirs' | 'both'>('conflict');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Interactive Merge Conflict Marker Inspector & Resolution Strategy
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          <button onClick={() => setResolution('conflict')} style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #f87171', backgroundColor: resolution === 'conflict' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            Raw Conflict Markers
          </button>
          <button onClick={() => setResolution('ours')} style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #38bdf8', backgroundColor: resolution === 'ours' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            Accept Current (Ours)
          </button>
          <button onClick={() => setResolution('theirs')} style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #fbbf24', backgroundColor: resolution === 'theirs' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            Accept Incoming (Theirs)
          </button>
          <button onClick={() => setResolution('both')} style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #34d399', backgroundColor: resolution === 'both' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            Combine Both
          </button>
        </div>

        <pre style={{ margin: 0, padding: '12px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.05)' }}>
          <code>
            {resolution === 'conflict' && `<<<<<<< HEAD (Current Change)\nconst timeout = 5000;\n=======\nconst timeout = 10000; // Updated for heavy queries\n>>>>>>> feature/timeout (Incoming Change)`}
            {resolution === 'ours' && `const timeout = 5000;`}
            {resolution === 'theirs' && `const timeout = 10000; // Updated for heavy queries`}
            {resolution === 'both' && `const DEFAULT_TIMEOUT = 5000;\nconst HEAVY_QUERY_TIMEOUT = 10000;`}
          </code>
        </pre>
      </div>
    </div>
  );
}
