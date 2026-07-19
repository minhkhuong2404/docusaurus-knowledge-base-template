import React, { useState } from 'react';

type Mode = 'PUSH' | 'PULL' | 'HYBRID';

interface StrategyDetail {
  id: Mode;
  tabLabel: string;
  title: string;
  color: string;
  explanation: string;
  writeCost: string;
  readCost: string;
  proTips: string;
}

const STRATEGIES: StrategyDetail[] = [
  {
    id: 'PUSH',
    tabLabel: '1. Push (Fan-Out on Write)',
    title: 'Push Model (Pre-computed Timelines)',
    color: '#fbbf24',
    explanation: 'When a user posts, the system appends the post ID to every follower\'s pre-computed timeline in Redis. Reads are instantly served from memory.',
    writeCost: 'High Write Amplification: If a user has 1 million followers, 1 post causes 1,000,000 Redis appends.',
    readCost: 'Sub-millisecond: Reading feed is a single cache lookup (e.g. ZREVRANGE).',
    proTips: 'Ideal for standard users who post regularly and have modest follower counts.',
  },
  {
    id: 'PULL',
    tabLabel: '2. Pull (Fan-Out on Read)',
    title: 'Pull Model (Dynamic Query Merge)',
    color: '#38bdf8',
    explanation: 'Posts are written once to the database. No timelines are pre-computed. When a user reads their feed, the system queries the database to merge and sort posts of all followed users.',
    writeCost: 'O(1) Minimal: Writing a post is a single SQL/NoSQL insert.',
    readCost: 'O(N) High Query Latency: Reading a feed requires querying and sorting posts from all followed users dynamically.',
    proTips: 'Essential for high-follower celebrity accounts where push models would create massive database bottlenecks.',
  },
  {
    id: 'HYBRID',
    tabLabel: '3. Hybrid Feed Strategy',
    title: 'Hybrid Feed Model (Optimized)',
    color: '#34d399',
    explanation: 'Uses push models for standard users to guarantee fast reads. Bypasses push for celebrity accounts (>25k followers), pulling celebrity posts dynamically at query time.',
    writeCost: 'Balanced: Celebrity posts propagate instantly; normal posts pre-compute timelines asynchronously.',
    readCost: 'Ultra Fast: Combines Redis sorted set index with a light celebrity database union.',
    proTips: 'The standard architectural pattern for massive social networks (e.g., Twitter/X, Instagram).',
  },
];

export default function FanOutStrategiesDiagram(): React.JSX.Element {
  const [activeMode, setActiveMode] = useState<Mode>('HYBRID');

  const current = STRATEGIES.find(s => s.id === activeMode) || STRATEGIES[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="18" r="3"/>
          <circle cx="6" cy="6" r="3"/>
          <circle cx="18" cy="6" r="3"/>
          <line x1="6" y1="9" x2="17" y2="17"/>
          <line x1="8" y1="6" x2="15" y2="6"/>
        </svg>
        <span style={{ color: '#34d399' }}>Fan-Out Feed Strategy (Social Network Example)</span>
      </div>

      {/* Mode controls */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {STRATEGIES.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveMode(s.id)}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '11px',
              background: activeMode === s.id ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: activeMode === s.id ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${activeMode === s.id ? '#38bdf850' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            {s.tabLabel}
          </button>
        ))}
      </div>

      <style>{`
        .fanout-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .fanout-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="fanout-grid">
        
        {/* SVG Viewport */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="fan-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="fan-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={current.color} />
              </marker>
            </defs>

            {/* Poster User */}
            <g>
              <circle cx="45" cy="100" r="18" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="45" y="103" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">Poster A</text>
            </g>

            {activeMode === 'PUSH' ? (
              <g>
                {/* Push pipelines directly to multiple follower feeds */}
                <rect x="155" y="30" width="75" height="30" rx="3" fill="rgba(251,191,36,0.05)" stroke="#fbbf24" strokeWidth="1" />
                <text x="192.5" y="48" textAnchor="middle" fill="#fbbf24" fontSize="7">Follower 1 Feed</text>

                <rect x="155" y="85" width="75" height="30" rx="3" fill="rgba(251,191,36,0.05)" stroke="#fbbf24" strokeWidth="1" />
                <text x="192.5" y="103" textAnchor="middle" fill="#fbbf24" fontSize="7">Follower 2 Feed</text>

                <rect x="155" y="140" width="75" height="30" rx="3" fill="rgba(251,191,36,0.05)" stroke="#fbbf24" strokeWidth="1" />
                <text x="192.5" y="158" textAnchor="middle" fill="#fbbf24" fontSize="7">Follower N Feed</text>

                {/* Connections */}
                <path d="M 63 90 L 150 48" fill="none" stroke="#fbbf24" strokeWidth="1.2" className="interactive-diagram-flowing-path" markerEnd="url(#fan-arr-color)" />
                <path d="M 63 100 L 150 100" fill="none" stroke="#fbbf24" strokeWidth="1.2" className="interactive-diagram-flowing-path" markerEnd="url(#fan-arr-color)" />
                <path d="M 63 110 L 150 152" fill="none" stroke="#fbbf24" strokeWidth="1.2" className="interactive-diagram-flowing-path" markerEnd="url(#fan-arr-color)" />
              </g>
            ) : activeMode === 'PULL' ? (
              <g>
                {/* Pull: single write to database */}
                <rect x="145" y="75" width="80" height="50" rx="5" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="185" y="98" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="bold">Post Database</text>
                <text x="185" y="110" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">1 single write</text>

                <path d="M 63 100 L 140 100" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="interactive-diagram-flowing-path active-path-cyan" markerEnd="url(#fan-arr-color)" />

                {/* Readers query dynamically */}
                <rect x="265" y="75" width="70" height="50" rx="5" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x="300" y="98" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">Reader Feed</text>
                <text x="300" y="110" textAnchor="middle" fill="#ef4444" fontSize="6.5">Dynamic query</text>

                <path d="M 265 100 L 230 100" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#fan-arr)" />
              </g>
            ) : (
              <g>
                {/* Hybrid: checks follower count */}
                <rect x="135" y="45" width="80" height="45" rx="5" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.5" />
                <text x="175" y="62" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">Follower Check</text>
                <text x="175" y="74" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">&lt; 25k? Push</text>
                <text x="175" y="83" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">&gt; 25k? Pull</text>

                <path d="M 63 100 L 130 80" fill="none" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#fan-arr-color)" />

                {/* Split pathways */}
                <rect x="250" y="25" width="80" height="35" rx="3" fill="rgba(251,191,36,0.05)" stroke="#fbbf24" strokeWidth="1" />
                <text x="290" y="47" textAnchor="middle" fill="#fbbf24" fontSize="7">Push timelines</text>

                <rect x="250" y="130" width="80" height="35" rx="3" fill="rgba(56,189,248,0.05)" stroke="#38bdf8" strokeWidth="1" />
                <text x="290" y="152" textAnchor="middle" fill="#38bdf8" fontSize="7">Pull celebrities</text>

                <path d="M 215 55 L 245 42" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" markerEnd="url(#fan-arr)" />
                <path d="M 215 80 L 252 130" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" markerEnd="url(#fan-arr)" />
              </g>
            )}
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div>
            <h3 style={{ color: current.color }}>{current.title}</h3>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {current.explanation}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '10.5px' }}>
              <span style={{ fontWeight: 'bold', color: '#64748b' }}>Write performance:</span> <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{current.writeCost}</span>
            </div>
            <div style={{ fontSize: '10.5px' }}>
              <span style={{ fontWeight: 'bold', color: '#64748b' }}>Read performance:</span> <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{current.readCost}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Production Design Guideline
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>
              {current.proTips}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
