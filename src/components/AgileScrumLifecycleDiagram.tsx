import React, { useState, useEffect } from 'react';

interface StageDetail {
  id: string;
  name: string;
  category: 'Ceremony' | 'Artifact' | 'Commitment';
  color: string;
  timebox: string;
  participants: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  antiPatterns: string[];
  bestPractices: string[];
}

const STAGES: StageDetail[] = [
  {
    id: 'product-backlog',
    name: '1. Product Backlog & Goal',
    category: 'Artifact',
    color: '#38bdf8',
    timebox: 'Continuous living backlog',
    participants: 'Product Owner (author & owner), Stakeholders, Developers (sizing)',
    purpose: 'Single source of truth for all requirements, features, bug fixes, and non-functional requirements ordered by business value and risk.',
    inputs: ['Customer feedback & user research', 'Business OKRs and market strategy', 'Technical spikes & architectural enablers'],
    outputs: ['Prioritized backlog items (Epics/User Stories)', 'Strategic Product Goal', 'Estimates & acceptance criteria'],
    antiPatterns: ['PO maintains a static 2-year waterfall Gantt chart', 'Developers commit to tickets without understanding business context', 'Backlog contains 500+ abandoned items without triage'],
    bestPractices: ['Maintain 2-3 sprints worth of "Ready" stories (DEEP: Detailed, Emergent, Estimated, Prioritized)', 'Regularly prune stories older than 3 months', 'Align all epics to quantifiable customer outcomes'],
  },
  {
    id: 'sprint-planning',
    name: '2. Sprint Planning',
    category: 'Ceremony',
    color: '#34d399',
    timebox: 'Max 2 hours per 1 week of sprint (e.g., 4h for a 2-week sprint)',
    participants: 'Whole Scrum Team: Product Owner, Scrum Master, Developers',
    purpose: 'Establishes the "Why", "What", and "How" of the sprint. The team crafts a unified Sprint Goal and selects work from the top of the backlog.',
    inputs: ['Prioritized Product Backlog (meeting DoR)', 'Team historic velocity & net capacity (leaves/on-call)', 'Previous retrospective commitments'],
    outputs: ['Unified Sprint Goal (business outcome, not task list)', 'Sprint Backlog (selected stories + decomposed engineering tasks)'],
    antiPatterns: ['PO unilaterally dictates story allocation to individual devs', 'Sprint Goal is merely "Complete all 12 tickets"', 'Team plans at 100% capacity without buffer for interrupts or bugs'],
    bestPractices: ['Plan to 75-80% capacity to absorb real-world friction', 'Part 1 focuses on the Sprint Goal and value; Part 2 focuses on technical execution and task breakdown', 'Ensure every engineer can explain how their tasks support the Sprint Goal'],
  },
  {
    id: 'sprint-backlog',
    name: '3. Sprint Backlog',
    category: 'Artifact',
    color: '#a78bfa',
    timebox: 'Duration of the sprint (1-4 weeks)',
    participants: 'Developers (sole owners of the Sprint Backlog)',
    purpose: 'Real-time forecast of the work required to achieve the Sprint Goal. Highly visible and modified dynamically as work progresses.',
    inputs: ['Selected user stories', 'Architectural tasks and testing requirements', 'Target sprint velocity'],
    outputs: ['Task-level Kanban board updates', 'Burndown chart data points', 'Identified impediments and technical dependencies'],
    antiPatterns: ['Stakeholders inject new ad-hoc work mid-sprint without PO triage', 'Developers work on pet projects not in the sprint scope', 'Tasks remain in "In Progress" for 10 days straight'],
    bestPractices: ['Only Developers can modify the Sprint Backlog once the sprint starts', 'Decompose stories into small tasks (under 1-2 days each)', 'Negotiate scope reduction with PO if roadblocks threaten the Sprint Goal without dropping quality'],
  },
  {
    id: 'daily-scrum',
    name: '4. Daily Scrum & Execution',
    category: 'Ceremony',
    color: '#fbbf24',
    timebox: 'Strictly 15 minutes every 24 hours',
    participants: 'Developers (active participants), Scrum Master (facilitates as needed), PO (optional observer)',
    purpose: 'Inspect progress toward the Sprint Goal and adapt the upcoming plan for the next 24 hours. Identify blockers immediately.',
    inputs: ['Previous day completed work', 'Current blockers & impediments', 'Remaining tasks against the Sprint Goal'],
    outputs: ['Adjusted daily plan', 'Identified blockers flagged for immediate resolution', 'Updated task board & burndown chart'],
    antiPatterns: ['Turned into a status report to the manager/Scrum Master', 'Deep-dive technical debugging that holds the whole team hostage', 'Engineers hide blockers out of fear or pride until sprint end'],
    bestPractices: ['Focus on progress toward the Sprint Goal, not just ticking off tickets', 'Take technical deep dives "offline" into a separate 16th-minute sidebar', 'Walk the board right-to-left (Done ➔ In Review ➔ In Progress) to encourage finishing over starting'],
  },
  {
    id: 'increment',
    name: '5. Potentially Shippable Increment',
    category: 'Artifact',
    color: '#2dd4bf',
    timebox: 'Produced continuously or by end of sprint',
    participants: 'Developers, QA, DevOps/Release engineering',
    purpose: 'A concrete stepping stone toward the Product Goal that strictly meets the Definition of Done (DoD). Must be usable and verified.',
    inputs: ['Implemented code', 'Automated unit, integration, and E2E test suites', 'Security & performance scan passes'],
    outputs: ['Deployable binary/container artifact', 'Updated system documentation', 'Release candidate notes'],
    antiPatterns: ['Considering code "Done" when it compiles locally but is untested in staging', 'Accumulating untested "Done" branches until a painful end-of-year release', 'Letting non-functional requirements (security, accessibility) slide'],
    bestPractices: ['Strictly enforce the Definition of Done (DoD) before calling any story complete', 'Automate CI/CD pipelines so every merge produces a tested artifact', 'Feature-flag unreleased logic so code can deploy without exposing incomplete UX'],
  },
  {
    id: 'sprint-review',
    name: '6. Sprint Review & Demo',
    category: 'Ceremony',
    color: '#f97316',
    timebox: 'Max 1 hour per 1 week of sprint (e.g., 2h for a 2-week sprint)',
    participants: 'Scrum Team + Key Stakeholders (Business, Users, Sponsors, Leadership)',
    purpose: 'Inspect the newly built Increment and adapt the Product Backlog. Showcase working software and gather authentic feedback from users.',
    inputs: ['Working Increment (live software, no PowerPoint)', 'Sprint Goal statement and outcome', 'Market or budget updates from PO'],
    outputs: ['Updated Product Backlog reflecting new stakeholder feedback', 'Agreed priority shifts for next sprint planning', 'Shared trust and alignment across business and tech'],
    antiPatterns: ['Demonstrating slides, Figma mockups, or architectural diagrams instead of working software', 'Treating it as a performance evaluation or pass/fail audit', 'Stakeholders fail to attend, leaving tech teams demoing to themselves'],
    bestPractices: ['Demo live software in a staging/production-like environment', 'Encourage stakeholders to interact with the software directly', 'Capture feedback as actionable backlog items on the spot'],
  },
  {
    id: 'sprint-retro',
    name: '7. Sprint Retrospective',
    category: 'Ceremony',
    color: '#f472b6',
    timebox: 'Max 45 mins per 1 week of sprint (e.g., 1.5h for a 2-week sprint)',
    participants: 'Scrum Team only (PO, SM, Developers) — Safe internal space',
    purpose: 'Inspect how the last sprint went regarding individuals, interactions, processes, tools, and DoD. Formulate 1-2 high-impact improvement actions.',
    inputs: ['Team observations (What went well, what went wrong, ideas)', 'Sprint metrics (Velocity, CFD, Cycle Time, escaped defects)', 'Previous retro action item statuses'],
    outputs: ['1-2 prioritized, measurable process improvement actions for the next sprint', 'Updated Definition of Done or team working agreements'],
    antiPatterns: ['Blaming individuals rather than diagnosing broken processes', 'Generating 20 complaints with zero owner or follow-through action', 'Skipping the retro because "we are too busy coding"'],
    bestPractices: ['Foster psychological safety: assume positive intent (Prime Directive)', 'Focus on actionable experiments the team controls directly', 'Always review progress on previous retro action items at the start'],
  },
  {
    id: 'refinement',
    name: '8. Backlog Refinement (Grooming)',
    category: 'Commitment',
    color: '#38bdf8',
    timebox: 'Ongoing (~5-10% of team capacity during the sprint)',
    participants: 'Product Owner, Developers, Business Analysts / Tech Leads',
    purpose: 'Progressively decompose epics, elaborate user stories, clarify acceptance criteria (BDD/3-Amigos), and provide relative estimates.',
    inputs: ['Raw high-level feature requests and architectural needs', 'Technical investigation (spike) results', 'Customer journey maps'],
    outputs: ['Sprint-ready stories satisfying the Definition of Ready (DoR)', 'Story point estimates (Planning Poker)', 'Clear testable acceptance criteria'],
    antiPatterns: ['Refining stories for the entire year ahead (premature optimization)', 'Developers see stories for the first time during Sprint Planning', 'Estimation becomes an adversarial debate over developer hours'],
    bestPractices: ['Keep 2 sprints worth of work refined and "Ready" ahead of planning', 'Use "3 Amigos" (PO, Dev, QA) to refine complex stories before team review', 'Break down stories larger than 8 points until they can fit into 1-3 days of work'],
  },
];

export default function AgileScrumLifecycleDiagram(): React.JSX.Element {
  const [activeStageId, setActiveStageId] = useState<string>('product-backlog');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const currentStageIndex = STAGES.findIndex((s) => s.id === activeStageId);
  const currentStage = STAGES[currentStageIndex] || STAGES[0];

  // Auto-playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStageId((prevId) => {
        const idx = STAGES.findIndex((s) => s.id === prevId);
        const nextIdx = (idx + 1) % STAGES.length;
        return STAGES[nextIdx].id;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
            Scrum Sprint Lifecycle & Empirical Feedback Loop
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)',
              color: isPlaying ? '#f87171' : '#34d399',
              border: `1px solid ${isPlaying ? '#f87171' : '#34d399'}`,
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {isPlaying ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                Pause Loop
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Play Loop
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ padding: '16px' }}>
        {/* Stage selection badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {STAGES.map((stage) => {
            const isActive = stage.id === activeStageId;
            return (
              <button
                key={stage.id}
                onClick={() => {
                  setActiveStageId(stage.id);
                  setIsPlaying(false);
                }}
                style={{
                  background: isActive ? `${stage.color}22` : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? stage.color : 'var(--ifm-color-content-secondary)',
                  border: `1px solid ${isActive ? stage.color : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {stage.name}
              </button>
            );
          })}
        </div>

        {/* Split Pane: SVG Loop Canvas (55%) + Details Panel (45%) */}
        <div className="scrum-layout-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          <style>{`
            @media (max-width: 820px) {
              .scrum-layout-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>

          {/* SVG Canvas with Flowing Arrows */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 680 440" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                {/* Arrowhead markers */}
                <marker id="scrum-arrow-cyan" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#38bdf8" />
                </marker>
                <marker id="scrum-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#34d399" />
                </marker>
                <marker id="scrum-arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#a78bfa" />
                </marker>
                <marker id="scrum-arrow-yellow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#fbbf24" />
                </marker>
                <marker id="scrum-arrow-orange" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#f97316" />
                </marker>
                <marker id="scrum-arrow-pink" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#f472b6" />
                </marker>
              </defs>

              {/* Central Sprint Cycle Oval Graphic */}
              <circle cx="340" cy="220" r="140" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2" strokeDasharray="4 4" />

              {/* Continuous Sprint Flow Path with Dynamic Moving Animation */}
              <path
                d="M 340,80 A 140,140 0 1,1 339.9,80"
                fill="none"
                stroke="rgba(52, 211, 153, 0.25)"
                strokeWidth="4"
              />
              <path
                d="M 340,80 A 140,140 0 1,1 339.9,80"
                fill="none"
                className="interactive-diagram-flowing-path"
                stroke="#34d399"
                strokeWidth="3"
                strokeDasharray="8 8"
              />

              {/* Feed-forward / Feedback loop from Retro back to Backlog Refinement */}
              <path
                d="M 230,320 C 140,360 80,240 85,145"
                fill="none"
                stroke="rgba(244, 114, 182, 0.4)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 230,320 C 140,360 80,240 85,145"
                fill="none"
                className="interactive-diagram-flowing-path"
                stroke="#f472b6"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                markerEnd="url(#scrum-arrow-pink)"
              />

              {/* Inner Center Label: 2-4 Week Sprint Cadence */}
              <g transform="translate(340, 210)" textAnchor="middle">
                <circle cx="0" cy="10" r="48" fill="#0b0e17" stroke="#34d399" strokeWidth="1.5" />
                <text y="-2" fill="#34d399" fontSize="13" fontWeight="700">SPRINT</text>
                <text y="14" fill="#94a3b8" fontSize="10" fontWeight="500">1 - 4 WEEKS</text>
                <text y="28" fill="#38bdf8" fontSize="9" fontWeight="600">INSPECT &amp; ADAPT</text>
              </g>

              {/* Interactive Nodes Positioned along the Lifecycle */}

              {/* 1. Product Backlog (Top Left Input) */}
              <g
                transform="translate(15, 75)"
                onClick={() => { setActiveStageId('product-backlog'); setIsPlaying(false); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="0" y="0" width="135" height="54" rx="8"
                  fill={activeStageId === 'product-backlog' ? 'rgba(56, 189, 248, 0.2)' : '#101424'}
                  stroke={activeStageId === 'product-backlog' ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth={activeStageId === 'product-backlog' ? 2 : 1}
                />
                <text x="12" y="22" fill="#38bdf8" fontSize="11" fontWeight="700">Product Backlog</text>
                <text x="12" y="40" fill="#94a3b8" fontSize="9">Ordered by value &amp; risk</text>
                {activeStageId === 'product-backlog' && (
                  <circle cx="125" cy="14" r="4" fill="#38bdf8" className="interactive-diagram-pulse-dot" />
                )}
              </g>

              {/* Connector: Backlog ➔ Refinement */}
              <path
                d="M 82,129 L 82,175"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                markerEnd="url(#scrum-arrow-cyan)"
              />

              {/* 8. Backlog Refinement */}
              <g
                transform="translate(15, 185)"
                onClick={() => { setActiveStageId('refinement'); setIsPlaying(false); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="0" y="0" width="135" height="54" rx="8"
                  fill={activeStageId === 'refinement' ? 'rgba(56, 189, 248, 0.2)' : '#101424'}
                  stroke={activeStageId === 'refinement' ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth={activeStageId === 'refinement' ? 2 : 1}
                />
                <text x="12" y="22" fill="#38bdf8" fontSize="11" fontWeight="700">Backlog Refinement</text>
                <text x="12" y="40" fill="#94a3b8" fontSize="9">DEEP &amp; 3-Amigos Ready</text>
                {activeStageId === 'refinement' && (
                  <circle cx="125" cy="14" r="4" fill="#38bdf8" className="interactive-diagram-pulse-dot" />
                )}
              </g>

              {/* Connector: Refinement / Backlog ➔ Sprint Planning */}
              <path
                d="M 150,102 C 200,102 220,65 270,65"
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                markerEnd="url(#scrum-arrow-green)"
              />

              {/* 2. Sprint Planning (Top Center) */}
              <g
                transform="translate(270, 38)"
                onClick={() => { setActiveStageId('sprint-planning'); setIsPlaying(false); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="0" y="0" width="140" height="54" rx="8"
                  fill={activeStageId === 'sprint-planning' ? 'rgba(52, 211, 153, 0.2)' : '#101424'}
                  stroke={activeStageId === 'sprint-planning' ? '#34d399' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth={activeStageId === 'sprint-planning' ? 2 : 1}
                />
                <text x="12" y="22" fill="#34d399" fontSize="11" fontWeight="700">Sprint Planning</text>
                <text x="12" y="40" fill="#94a3b8" fontSize="9">Why, What &amp; How</text>
                {activeStageId === 'sprint-planning' && (
                  <circle cx="130" cy="14" r="4" fill="#34d399" className="interactive-diagram-pulse-dot" />
                )}
              </g>

              {/* Connector: Planning ➔ Sprint Backlog */}
              <path
                d="M 410,65 C 460,65 480,95 505,100"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
                markerEnd="url(#scrum-arrow-purple)"
              />

              {/* 3. Sprint Backlog (Top Right) */}
              <g
                transform="translate(510, 75)"
                onClick={() => { setActiveStageId('sprint-backlog'); setIsPlaying(false); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="0" y="0" width="140" height="54" rx="8"
                  fill={activeStageId === 'sprint-backlog' ? 'rgba(167, 139, 250, 0.2)' : '#101424'}
                  stroke={activeStageId === 'sprint-backlog' ? '#a78bfa' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth={activeStageId === 'sprint-backlog' ? 2 : 1}
                />
                <text x="12" y="22" fill="#a78bfa" fontSize="11" fontWeight="700">Sprint Backlog</text>
                <text x="12" y="40" fill="#94a3b8" fontSize="9">Goal + Committed Scope</text>
                {activeStageId === 'sprint-backlog' && (
                  <circle cx="130" cy="14" r="4" fill="#a78bfa" className="interactive-diagram-pulse-dot" />
                )}
              </g>

              {/* 4. Daily Scrum & Execution (Right Middle) */}
              <g
                transform="translate(490, 195)"
                onClick={() => { setActiveStageId('daily-scrum'); setIsPlaying(false); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="0" y="0" width="155" height="54" rx="8"
                  fill={activeStageId === 'daily-scrum' ? 'rgba(251, 191, 36, 0.2)' : '#101424'}
                  stroke={activeStageId === 'daily-scrum' ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth={activeStageId === 'daily-scrum' ? 2 : 1}
                />
                <text x="12" y="22" fill="#fbbf24" fontSize="11" fontWeight="700">Daily Scrum (15m)</text>
                <text x="12" y="40" fill="#94a3b8" fontSize="9">Inspect progress &amp; sync</text>
                {activeStageId === 'daily-scrum' && (
                  <circle cx="145" cy="14" r="4" fill="#fbbf24" className="interactive-diagram-pulse-dot" />
                )}
              </g>

              {/* 5. Potentially Shippable Increment (Bottom Right) */}
              <g
                transform="translate(480, 315)"
                onClick={() => { setActiveStageId('increment'); setIsPlaying(false); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="0" y="0" width="165" height="54" rx="8"
                  fill={activeStageId === 'increment' ? 'rgba(45, 212, 191, 0.2)' : '#101424'}
                  stroke={activeStageId === 'increment' ? '#2dd4bf' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth={activeStageId === 'increment' ? 2 : 1}
                />
                <text x="12" y="22" fill="#2dd4bf" fontSize="11" fontWeight="700">Shippable Increment</text>
                <text x="12" y="40" fill="#94a3b8" fontSize="9">Strict Definition of Done</text>
                {activeStageId === 'increment' && (
                  <circle cx="155" cy="14" r="4" fill="#2dd4bf" className="interactive-diagram-pulse-dot" />
                )}
              </g>

              {/* 6. Sprint Review (Bottom Center) */}
              <g
                transform="translate(270, 345)"
                onClick={() => { setActiveStageId('sprint-review'); setIsPlaying(false); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="0" y="0" width="145" height="54" rx="8"
                  fill={activeStageId === 'sprint-review' ? 'rgba(249, 115, 22, 0.2)' : '#101424'}
                  stroke={activeStageId === 'sprint-review' ? '#f97316' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth={activeStageId === 'sprint-review' ? 2 : 1}
                />
                <text x="12" y="22" fill="#f97316" fontSize="11" fontWeight="700">Sprint Review (Demo)</text>
                <text x="12" y="40" fill="#94a3b8" fontSize="9">Inspect with stakeholders</text>
                {activeStageId === 'sprint-review' && (
                  <circle cx="135" cy="14" r="4" fill="#f97316" className="interactive-diagram-pulse-dot" />
                )}
              </g>

              {/* 7. Sprint Retrospective (Bottom Left) */}
              <g
                transform="translate(90, 290)"
                onClick={() => { setActiveStageId('sprint-retro'); setIsPlaying(false); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="0" y="0" width="150" height="54" rx="8"
                  fill={activeStageId === 'sprint-retro' ? 'rgba(244, 114, 182, 0.2)' : '#101424'}
                  stroke={activeStageId === 'sprint-retro' ? '#f472b6' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth={activeStageId === 'sprint-retro' ? 2 : 1}
                />
                <text x="12" y="22" fill="#f472b6" fontSize="11" fontWeight="700">Sprint Retrospective</text>
                <text x="12" y="40" fill="#94a3b8" fontSize="9">People, Process, Tools</text>
                {activeStageId === 'sprint-retro' && (
                  <circle cx="140" cy="14" r="4" fill="#f472b6" className="interactive-diagram-pulse-dot" />
                )}
              </g>
            </svg>
          </div>

          {/* Details Card for Selected Stage */}
          <div
            className="interactive-diagram-details-card"
            style={{
              padding: '16px',
              borderRadius: '10px',
              borderLeft: `4px solid ${currentStage.color}`,
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: currentStage.color }}>
                {currentStage.name}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: `${currentStage.color}22`,
                  color: currentStage.color,
                  border: `1px solid ${currentStage.color}55`,
                }}
              >
                {currentStage.category}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: '1.45', marginBottom: '12px' }}>
              {currentStage.purpose}
            </p>

            {/* Quick Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginBottom: '12px', fontSize: '12px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                <strong style={{ color: '#38bdf8' }}>⏱ Timebox: </strong>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{currentStage.timebox}</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                <strong style={{ color: '#34d399' }}>👥 Participants: </strong>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{currentStage.participants}</span>
              </div>
            </div>

            {/* Inputs & Outputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>INPUTS</div>
                <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.4' }}>
                  {currentStage.inputs.map((inp, i) => (
                    <li key={i}>{inp}</li>
                  ))}
                </ul>
              </div>
              <div style={{ background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>OUTPUTS</div>
                <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.4' }}>
                  {currentStage.outputs.map((out, i) => (
                    <li key={i}>{out}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Anti-Patterns & Red Flags */}
            <div style={{ background: 'rgba(248, 113, 113, 0.06)', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: '6px', padding: '8px', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                COMMON ANTI-PATTERNS
              </div>
              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: '#fca5a5', lineHeight: '1.4' }}>
                {currentStage.antiPatterns.map((ap, i) => (
                  <li key={i}>{ap}</li>
                ))}
              </ul>
            </div>

            {/* Best Practices */}
            <div style={{ background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '6px', padding: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                PRODUCTION BEST PRACTICES
              </div>
              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: '#86efac', lineHeight: '1.4' }}>
                {currentStage.bestPractices.map((bp, i) => (
                  <li key={i}>{bp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
