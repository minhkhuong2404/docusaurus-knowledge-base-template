import React, { useState } from 'react';

interface Stage {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  duration: string;
  what: string;
  signals: string[];
  tip: string;
}

const STAGES: Stage[] = [
  {
    id: 'recruiter',
    label: 'Recruiter Screen',
    sublabel: 'Phase 1',
    color: '#38bdf8',
    x: 20, y: 60, w: 140, h: 60,
    duration: '~30 min',
    what: 'High-level qualification check: experience, salary alignment, visa status, and communication skills.',
    signals: ['Resume walkthrough clarity', 'Stack & years of experience', 'Salary expectation fit', 'Logistical alignment'],
    tip: "Prepare a structured 90-second elevator pitch. Ask the recruiter for the salary range — don't give a number first.",
  },
  {
    id: 'oa',
    label: 'Online Assessment',
    sublabel: 'Phase 2',
    color: '#f97316',
    x: 200, y: 60, w: 140, h: 60,
    duration: '60–90 min',
    what: 'Automated coding platform (HackerRank, CodeSignal, LeetCode). 2–4 problems assessed by correctness, time, and memory.',
    signals: ['Correctness on hidden test cases', 'Time & space complexity', 'Edge case handling', 'Code quality'],
    tip: 'If stuck for >15 min on Q1, write a brute-force to secure partial credit then move on.',
  },
  {
    id: 'technical',
    label: 'Technical Rounds',
    sublabel: 'Phase 3',
    color: '#34d399',
    x: 380, y: 60, w: 140, h: 60,
    duration: '1–3 sessions × 45–60 min',
    what: 'Live coding, system design (RADIO framework), and low-level / object-oriented design rounds.',
    signals: ['Problem-solving flow', 'Communication while coding', 'System scalability thinking', 'SOLID & design patterns'],
    tip: 'Always clarify constraints for 5 min before coding. State brute-force first, then optimise.',
  },
  {
    id: 'behavioral',
    label: 'Behavioral Fit',
    sublabel: 'Phase 4',
    color: '#f472b6',
    x: 560, y: 60, w: 140, h: 60,
    duration: '45–60 min',
    what: 'Team collaboration, conflict resolution, failure recovery, and cultural alignment using the STAR method.',
    signals: ['Ownership & accountability', 'Conflict resolution style', 'Growth mindset', 'Leadership instinct'],
    tip: 'Prepare 6–8 STAR stories covering conflict, failure, leadership, and delivery under pressure.',
  },
  {
    id: 'offer',
    label: 'Offer & Negotiation',
    sublabel: 'Phase 5',
    color: '#fbbf24',
    x: 740, y: 60, w: 140, h: 60,
    duration: '1–5 business days',
    what: 'Verbal or written offer. This is the right moment to negotiate total compensation (base, equity, bonus, start date).',
    signals: ['Competing offers leverage', 'Level & scope alignment', 'Equity vesting schedule', 'Relocation / remote terms'],
    tip: 'Always negotiate. Research market rates (levels.fyi, Glassdoor). Ask about equity refresh cadence.',
  },
];

const EDGES = [
  { from: 'recruiter', to: 'oa',         label: 'Pass' },
  { from: 'oa',        to: 'technical',  label: 'Pass' },
  { from: 'technical', to: 'behavioral', label: 'Pass' },
  { from: 'behavioral',to: 'offer',      label: 'Pass' },
];

function arrowPath(from: Stage, to: Stage) {
  const x1 = from.x + from.w + 6;
  const y1 = from.y + from.h / 2;
  const x2 = to.x - 8;
  const y2 = to.y + to.h / 2;
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export default function InterviewPipelineDiagram() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedStage = STAGES.find(s => s.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .pipeline-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: '#34d399' }}>The Interview Pipeline</span>
        <span className="interactive-diagram-helper-text" style={{ marginLeft: 'auto', fontSize: '11px' }}>
          Click a stage to inspect
        </span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 920 180" style={{ width: '100%', minWidth: '720px', height: 'auto', display: 'block' }}>
          <defs>
            {STAGES.map(s => (
              <marker key={s.id} id={`arr-${s.id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={s.color} />
              </marker>
            ))}
          </defs>

          {EDGES.map((edge, i) => {
            const from = STAGES.find(s => s.id === edge.from)!;
            const to   = STAGES.find(s => s.id === edge.to)!;
            const isActive = selected === edge.from || selected === edge.to;
            const mx = (from.x + from.w + to.x) / 2;
            const my = from.y + from.h / 2 - 10;
            return (
              <g key={i}>
                <path
                  d={arrowPath(from, to)}
                  fill="none"
                  stroke={isActive ? from.color : 'rgba(255,255,255,0.18)'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  markerEnd={`url(#arr-${from.id})`}
                  style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }}
                />
                <text x={mx} y={my} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontWeight="600">
                  {edge.label}
                </text>
              </g>
            );
          })}

          {STAGES.map(stage => {
            const isActive = selected === stage.id;
            return (
              <g key={stage.id} onClick={() => setSelected(isActive ? null : stage.id)} style={{ cursor: 'pointer' }}>
                {isActive && (
                  <rect x={stage.x - 3} y={stage.y - 3} width={stage.w + 6} height={stage.h + 6}
                        rx="13" fill={`${stage.color}25`} />
                )}
                <rect
                  x={stage.x} y={stage.y} width={stage.w} height={stage.h}
                  rx="10"
                  fill={isActive ? `${stage.color}22` : `${stage.color}10`}
                  stroke={stage.color}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ transition: 'all 0.25s ease' }}
                />
                <text x={stage.x + stage.w / 2} y={stage.y + 18}
                      textAnchor="middle" fill={stage.color} fontSize="9" fontWeight="700" opacity="0.7">
                  {stage.sublabel}
                </text>
                <text x={stage.x + stage.w / 2} y={stage.y + 34}
                      textAnchor="middle" fill={stage.color} fontSize="11.5" fontWeight="700">
                  {stage.label}
                </text>
                <text x={stage.x + stage.w / 2} y={stage.y + 50}
                      textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9.5">
                  {stage.duration}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selectedStage ? (
        <div className="interactive-diagram-details-card" style={{ marginTop: '14px', padding: '18px 20px' }}>
          <div className="interactive-diagram-card-header">
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: selectedStage.color, flexShrink: 0 }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: selectedStage.color }}>
              {selectedStage.label}
            </span>
            <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)',
                           background: `${selectedStage.color}18`, border: `1px solid ${selectedStage.color}40`,
                           borderRadius: '6px', padding: '2px 8px' }}>
              {selectedStage.duration}
            </span>
            <button onClick={() => setSelected(null)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                             color: 'var(--ifm-color-content-secondary)', fontSize: '16px', lineHeight: 1 }}>
              ✕
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ifm-color-content)', margin: '10px 0 12px' }}>
            {selectedStage.what}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}
               className="pipeline-detail-grid">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: selectedStage.color,
                            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Evaluated Signals
              </div>
              {selectedStage.signals.map((sig, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px',
                                      fontSize: '12.5px', color: 'var(--ifm-color-content)',
                                      marginBottom: '5px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%',
                                background: selectedStage.color, flexShrink: 0 }} />
                  {sig}
                </div>
              ))}
            </div>
            <div style={{ background: `${selectedStage.color}0e`, border: `1px solid ${selectedStage.color}30`,
                          borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: selectedStage.color,
                            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Strategy Tip
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.6 }}>
                {selectedStage.tip}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="interactive-diagram-helper-text" style={{ textAlign: 'center', padding: '12px 0 4px' }}>
          Click any stage above to see evaluation criteria and strategy tips
        </p>
      )}
    </div>
  );
}
