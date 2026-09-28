import React, { useState } from 'react';

interface Stage {
  id: string;
  name: string;
  phase: string;
  color: string;
  wipLimit: number;
  activeItems: number;
  leadTimeAvg: string;
  owner: string;
  keyActivities: string[];
  exitGate: string;
}

const PIPELINE_STAGES: Stage[] = [
  {
    id: 'discovery',
    name: '1. Discovery & 3 Amigos',
    phase: 'Problem Space',
    color: '#38bdf8',
    wipLimit: 4,
    activeItems: 3,
    leadTimeAvg: '2 - 4 days',
    owner: 'Product Owner, Tech Lead, QA Engineer',
    keyActivities: [
      'Problem validation and business hypothesis crafting',
      '3 Amigos session: Product (Why/What), Dev (How/Cost), QA (Edge cases & what could go wrong)',
      'Formulating Given-When-Then BDD acceptance criteria',
    ],
    exitGate: 'Meets Definition of Ready (DoR) with agreed acceptance criteria and test plan',
  },
  {
    id: 'ready-for-dev',
    name: '2. Ready for Dev (Backlog)',
    phase: 'Ready Queue',
    color: '#34d399',
    wipLimit: 6,
    activeItems: 5,
    leadTimeAvg: '1 - 3 days in queue',
    owner: 'Development Team (Pull system)',
    keyActivities: [
      'Story point estimation completed (Planning Poker Fibonacci)',
      'Architectural dependencies and schema migrations verified',
      'Environment variables and external API mock contracts staged',
    ],
    exitGate: 'Developer pulls top ticket into In Progress as soon as personal WIP allows',
  },
  {
    id: 'in-dev',
    name: '3. In Progress (Dev & Pairing)',
    phase: 'Implementation',
    color: '#fbbf24',
    wipLimit: 4,
    activeItems: 4,
    leadTimeAvg: '1 - 3 days',
    owner: 'Software Engineers (Pair / Mob)',
    keyActivities: [
      'Trunk-based or short-lived feature branch created (feature/JIRA-101)',
      'Test-Driven Development (TDD) / writing unit & slice tests first',
      'Pair programming on critical business logic or complex state machines',
    ],
    exitGate: 'All acceptance criteria implemented, 100% unit tests pass locally, PR opened',
  },
  {
    id: 'pr-review',
    name: '4. PR Review & CI Pipeline',
    phase: 'Peer Verification',
    color: '#a78bfa',
    wipLimit: 3,
    activeItems: 2,
    leadTimeAvg: '< 4 hours (SLA)',
    owner: 'Peer Reviewers & Automated CI',
    keyActivities: [
      'Automated CI: unit tests, SonarQube quality gate, Trivy security scan pass',
      'Peer review: code readability, idempotency, edge cases, logging & metrics',
      'SLA enforcement: PRs reviewed within 4 business hours to avoid inventory decay',
    ],
    exitGate: 'At least 2 senior approvals, zero unresolved comments, all CI green checks',
  },
  {
    id: 'qa-staging',
    name: '5. QA & Staging Verification',
    phase: 'System Validation',
    color: '#f97316',
    wipLimit: 3,
    activeItems: 2,
    leadTimeAvg: '0.5 - 1 day',
    owner: 'QA Automation Engineer & Dev',
    keyActivities: [
      'Automatic deployment to ephemeral preview or staging cluster',
      'Automated integration and contract tests run against real dependencies',
      'Exploratory testing for UX anomalies and edge case handling',
    ],
    exitGate: 'Definition of Done (DoD) verified; signed off for production deployment',
  },
  {
    id: 'release',
    name: '6. Progressive Rollout & Telemetry',
    phase: 'Production Operation',
    color: '#2dd4bf',
    wipLimit: 2,
    activeItems: 1,
    leadTimeAvg: 'Continuous / 1 hr',
    owner: 'On-Call Engineer & Release Ops',
    keyActivities: [
      'Canary deployment or feature-flag activation to 5% ➔ 25% ➔ 100% of traffic',
      'Monitoring Grafana APM dashboards: p99 latency, HTTP 5xx error rate, CPU/mem',
      'Automated rollback triggered if SLO error budget burns beyond threshold',
    ],
    exitGate: 'Feature flag fully enabled, telemetry stable, ticket moved to Done',
  },
];

export default function WayOfWorkingLifecycleDiagram(): React.JSX.Element {
  const [selectedStageId, setSelectedStageId] = useState<string>('discovery');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'wip-simulator' | 'team-norms'>('pipeline');
  const [wipMode, setWipMode] = useState<'unlimited' | 'controlled'>('controlled');

  const currentStage = PIPELINE_STAGES.find((s) => s.id === selectedStageId) || PIPELINE_STAGES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
            Engineering Way of Working (WoW) & Delivery Pipeline
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('pipeline')}
            style={{
              background: activeTab === 'pipeline' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'pipeline' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${activeTab === 'pipeline' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: activeTab === 'pipeline' ? 700 : 500,
            }}
          >
            Pipeline Flow
          </button>
          <button
            onClick={() => setActiveTab('wip-simulator')}
            style={{
              background: activeTab === 'wip-simulator' ? 'rgba(52, 211, 153, 0.2)' : 'transparent',
              color: activeTab === 'wip-simulator' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${activeTab === 'wip-simulator' ? '#34d399' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: activeTab === 'wip-simulator' ? 700 : 500,
            }}
          >
            WIP &amp; Little&apos;s Law
          </button>
          <button
            onClick={() => setActiveTab('team-norms')}
            style={{
              background: activeTab === 'team-norms' ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
              color: activeTab === 'team-norms' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${activeTab === 'team-norms' ? '#a78bfa' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: activeTab === 'team-norms' ? 700 : 500,
            }}
          >
            Team Norms &amp; SLAs
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {activeTab === 'pipeline' && (
          <div>
            {/* Stage Selector Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {PIPELINE_STAGES.map((st) => {
                const isSelected = st.id === selectedStageId;
                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStageId(st.id)}
                    style={{
                      background: isSelected ? `${st.color}25` : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? st.color : 'var(--ifm-color-content-secondary)',
                      border: `1px solid ${isSelected ? st.color : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '16px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {st.name}
                  </button>
                );
              })}
            </div>

            {/* Split layout: SVG pipeline (58%) + details panel (42%) */}
            <div className="wow-layout-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
              <style>{`
                @media (max-width: 820px) {
                  .wow-layout-grid {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>

              {/* Visual Pipeline SVG */}
              <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                <svg viewBox="0 0 620 380" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <defs>
                    <marker id="wow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                      <polygon points="0 0, 8 4, 0 8" fill="#38bdf8" />
                    </marker>
                    <marker id="wow-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                      <polygon points="0 0, 8 4, 0 8" fill="#34d399" />
                    </marker>
                  </defs>

                  {/* Flow conduits with dynamic moving arrows */}
                  {/* Row 1: Stages 1 ➔ 2 ➔ 3 */}
                  <path d="M 175,90 L 225,90" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
                  <path d="M 175,90 L 225,90" fill="none" className="interactive-diagram-flowing-path" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 6" markerEnd="url(#wow-arrow)" />

                  <path d="M 385,90 L 435,90" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
                  <path d="M 385,90 L 435,90" fill="none" className="interactive-diagram-flowing-path" stroke="#34d399" strokeWidth="3" strokeDasharray="6 6" markerEnd="url(#wow-arrow-green)" />

                  {/* Turn from Row 1 to Row 2: Stage 3 ➔ Stage 4 */}
                  <path d="M 515,130 C 515,180 515,190 515,220" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
                  <path d="M 515,130 C 515,180 515,190 515,220" fill="none" className="interactive-diagram-flowing-path" stroke="#fbbf24" strokeWidth="3" strokeDasharray="6 6" markerEnd="url(#wow-arrow)" />

                  {/* Row 2: Stages 4 ➔ 5 ➔ 6 (Right-to-left flow or snake) */}
                  <path d="M 435,270 L 385,270" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
                  <path d="M 435,270 L 385,270" fill="none" className="interactive-diagram-flowing-path" stroke="#a78bfa" strokeWidth="3" strokeDasharray="6 6" markerEnd="url(#wow-arrow)" />

                  <path d="M 225,270 L 175,270" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
                  <path d="M 225,270 L 175,270" fill="none" className="interactive-diagram-flowing-path" stroke="#f97316" strokeWidth="3" strokeDasharray="6 6" markerEnd="url(#wow-arrow)" />

                  {/* STAGE 1: Discovery & 3 Amigos */}
                  <g transform="translate(25, 45)" onClick={() => setSelectedStageId('discovery')} style={{ cursor: 'pointer' }}>
                    <rect
                      x="0" y="0" width="150" height="90" rx="8"
                      fill={selectedStageId === 'discovery' ? 'rgba(56, 189, 248, 0.22)' : '#101424'}
                      stroke={selectedStageId === 'discovery' ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}
                      strokeWidth={selectedStageId === 'discovery' ? 2 : 1}
                    />
                    <text x="12" y="24" fill="#38bdf8" fontSize="12" fontWeight="700">1. Discovery</text>
                    <text x="12" y="42" fill="#94a3b8" fontSize="10">3 Amigos &amp; BDD</text>
                    <rect x="12" y="58" width="60" height="18" rx="4" fill="rgba(56, 189, 248, 0.15)" />
                    <text x="18" y="71" fill="#38bdf8" fontSize="9" fontWeight="600">WIP: 3 / 4</text>
                  </g>

                  {/* STAGE 2: Ready for Dev */}
                  <g transform="translate(235, 45)" onClick={() => setSelectedStageId('ready-for-dev')} style={{ cursor: 'pointer' }}>
                    <rect
                      x="0" y="0" width="150" height="90" rx="8"
                      fill={selectedStageId === 'ready-for-dev' ? 'rgba(52, 211, 153, 0.22)' : '#101424'}
                      stroke={selectedStageId === 'ready-for-dev' ? '#34d399' : 'rgba(255, 255, 255, 0.15)'}
                      strokeWidth={selectedStageId === 'ready-for-dev' ? 2 : 1}
                    />
                    <text x="12" y="24" fill="#34d399" fontSize="12" fontWeight="700">2. Ready Queue</text>
                    <text x="12" y="42" fill="#94a3b8" fontSize="10">DoR Passed &amp; Sized</text>
                    <rect x="12" y="58" width="60" height="18" rx="4" fill="rgba(52, 211, 153, 0.15)" />
                    <text x="18" y="71" fill="#34d399" fontSize="9" fontWeight="600">WIP: 5 / 6</text>
                  </g>

                  {/* STAGE 3: In Progress (Dev & Pairing) */}
                  <g transform="translate(445, 45)" onClick={() => setSelectedStageId('in-dev')} style={{ cursor: 'pointer' }}>
                    <rect
                      x="0" y="0" width="150" height="90" rx="8"
                      fill={selectedStageId === 'in-dev' ? 'rgba(251, 191, 36, 0.22)' : '#101424'}
                      stroke={selectedStageId === 'in-dev' ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)'}
                      strokeWidth={selectedStageId === 'in-dev' ? 2 : 1}
                    />
                    <text x="12" y="24" fill="#fbbf24" fontSize="12" fontWeight="700">3. In Progress</text>
                    <text x="12" y="42" fill="#94a3b8" fontSize="10">TDD &amp; Pairing</text>
                    <rect x="12" y="58" width="60" height="18" rx="4" fill="rgba(251, 191, 36, 0.15)" />
                    <text x="18" y="71" fill="#fbbf24" fontSize="9" fontWeight="600">WIP: 4 / 4 (MAX)</text>
                  </g>

                  {/* STAGE 4: PR Review & CI */}
                  <g transform="translate(445, 225)" onClick={() => setSelectedStageId('pr-review')} style={{ cursor: 'pointer' }}>
                    <rect
                      x="0" y="0" width="150" height="90" rx="8"
                      fill={selectedStageId === 'pr-review' ? 'rgba(167, 139, 250, 0.22)' : '#101424'}
                      stroke={selectedStageId === 'pr-review' ? '#a78bfa' : 'rgba(255, 255, 255, 0.15)'}
                      strokeWidth={selectedStageId === 'pr-review' ? 2 : 1}
                    />
                    <text x="12" y="24" fill="#a78bfa" fontSize="12" fontWeight="700">4. PR Review</text>
                    <text x="12" y="42" fill="#94a3b8" fontSize="10">&lt; 4h SLA &amp; CI Gate</text>
                    <rect x="12" y="58" width="60" height="18" rx="4" fill="rgba(167, 139, 250, 0.15)" />
                    <text x="18" y="71" fill="#a78bfa" fontSize="9" fontWeight="600">WIP: 2 / 3</text>
                  </g>

                  {/* STAGE 5: QA & Staging */}
                  <g transform="translate(235, 225)" onClick={() => setSelectedStageId('qa-staging')} style={{ cursor: 'pointer' }}>
                    <rect
                      x="0" y="0" width="150" height="90" rx="8"
                      fill={selectedStageId === 'qa-staging' ? 'rgba(249, 115, 22, 0.22)' : '#101424'}
                      stroke={selectedStageId === 'qa-staging' ? '#f97316' : 'rgba(255, 255, 255, 0.15)'}
                      strokeWidth={selectedStageId === 'qa-staging' ? 2 : 1}
                    />
                    <text x="12" y="24" fill="#f97316" fontSize="12" fontWeight="700">5. QA &amp; Staging</text>
                    <text x="12" y="42" fill="#94a3b8" fontSize="10">E2E &amp; DoD Validation</text>
                    <rect x="12" y="58" width="60" height="18" rx="4" fill="rgba(249, 115, 22, 0.15)" />
                    <text x="18" y="71" fill="#f97316" fontSize="9" fontWeight="600">WIP: 2 / 3</text>
                  </g>

                  {/* STAGE 6: Release & Telemetry */}
                  <g transform="translate(25, 225)" onClick={() => setSelectedStageId('release')} style={{ cursor: 'pointer' }}>
                    <rect
                      x="0" y="0" width="150" height="90" rx="8"
                      fill={selectedStageId === 'release' ? 'rgba(45, 212, 191, 0.22)' : '#101424'}
                      stroke={selectedStageId === 'release' ? '#2dd4bf' : 'rgba(255, 255, 255, 0.15)'}
                      strokeWidth={selectedStageId === 'release' ? 2 : 1}
                    />
                    <text x="12" y="24" fill="#2dd4bf" fontSize="12" fontWeight="700">6. Rollout &amp; APM</text>
                    <text x="12" y="42" fill="#94a3b8" fontSize="10">Canary / Feature Flags</text>
                    <rect x="12" y="58" width="60" height="18" rx="4" fill="rgba(45, 212, 191, 0.15)" />
                    <text x="18" y="71" fill="#2dd4bf" fontSize="9" fontWeight="600">WIP: 1 / 2</text>
                  </g>

                  {/* Feedback line back to discovery for production learnings */}
                  <path d="M 100,225 L 100,135" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2" strokeDasharray="4 4" />
                  <path d="M 100,225 L 100,135" fill="none" className="interactive-diagram-flowing-path" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#wow-arrow)" />
                  <text x="108" y="185" fill="#38bdf8" fontSize="9" fontWeight="600">Observability Feedback</text>
                </svg>
              </div>

              {/* Stage Details Inspector */}
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
                  <span style={{ fontSize: '15px', fontWeight: 700, color: currentStage.color }}>
                    {currentStage.name}
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: `${currentStage.color}22`, color: currentStage.color, border: `1px solid ${currentStage.color}55` }}>
                    {currentStage.phase}
                  </span>
                </div>

                {/* Key Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>WIP CAPACITY</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: currentStage.activeItems >= currentStage.wipLimit ? '#fbbf24' : '#34d399' }}>
                      {currentStage.activeItems} of {currentStage.wipLimit} max
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>AVG STAGE TIME</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>{currentStage.leadTimeAvg}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                  <strong style={{ color: '#a78bfa' }}>Key Owners: </strong>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{currentStage.owner}</span>
                </div>

                {/* Activities */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                    ENGINEERING ACTIVITIES
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.45' }}>
                    {currentStage.keyActivities.map((act, idx) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>

                {/* Exit Gate */}
                <div style={{ background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '6px', padding: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '2px' }}>
                    EXIT GATE (PROMOTION CRITERIA)
                  </div>
                  <div style={{ fontSize: '11px', color: '#86efac', lineHeight: '1.4' }}>
                    {currentStage.exitGate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wip-simulator' && (
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: 0, color: '#34d399', fontSize: '16px' }}>Little&apos;s Law Simulator: Why WIP Limits Matter</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                  Mathematical relationship: <code>Cycle Time = WIP / Throughput</code>. Stop starting, start finishing.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setWipMode('unlimited')}
                  style={{
                    background: wipMode === 'unlimited' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: wipMode === 'unlimited' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                    border: `1px solid ${wipMode === 'unlimited' ? '#f87171' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Uncontrolled WIP (Multitasking)
                </button>
                <button
                  onClick={() => setWipMode('controlled')}
                  style={{
                    background: wipMode === 'controlled' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: wipMode === 'controlled' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                    border: `1px solid ${wipMode === 'controlled' ? '#34d399' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Strict WIP Limits (Flow Swarm)
                </button>
              </div>
            </div>

            {/* Comparison Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>TOTAL WORK IN PROGRESS</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: wipMode === 'unlimited' ? '#f87171' : '#34d399' }}>
                  {wipMode === 'unlimited' ? '28 items' : '8 items'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  {wipMode === 'unlimited' ? 'Context switching overload' : '1-2 items per engineer max'}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>AVERAGE CYCLE TIME</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: wipMode === 'unlimited' ? '#f87171' : '#38bdf8' }}>
                  {wipMode === 'unlimited' ? '18.4 days' : '3.2 days'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  {wipMode === 'unlimited' ? 'Tickets age in PR and QA queues' : 'Fast feedback & rapid turnaround'}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>TEAM THROUGHPUT</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: wipMode === 'unlimited' ? '#fbbf24' : '#34d399' }}>
                  {wipMode === 'unlimited' ? '1.5 items/day' : '2.5 items/day'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  {wipMode === 'unlimited' ? 'High waste & merge conflicts' : '+66% delivery velocity'}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>DEFECT ESCAPE RATE</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: wipMode === 'unlimited' ? '#f87171' : '#a78bfa' }}>
                  {wipMode === 'unlimited' ? '14.2%' : '2.1%'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  {wipMode === 'unlimited' ? 'Rushed reviews and fragmented focus' : 'High code review depth'}
                </div>
              </div>
            </div>

            {/* Visual Board representation */}
            <div style={{ background: 'rgba(10, 14, 26, 0.8)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                BOARD CONGESTION VISUALIZER ({wipMode === 'unlimited' ? 'Clogged System' : 'Smooth Flow System'})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {['Analysis & Ready', 'In Development', 'Code Review', 'QA & Staging'].map((colName, idx) => {
                  const count = wipMode === 'unlimited' ? [8, 9, 6, 5][idx] : [2, 3, 2, 1][idx];
                  const limit = [3, 4, 3, 2][idx];
                  const isExceeded = count > limit;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: isExceeded ? 'rgba(248, 113, 113, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isExceeded ? '#f87171' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '6px',
                        padding: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: isExceeded ? '#f87171' : 'var(--ifm-color-content)' }}>
                        <span>{colName}</span>
                        <span>{count} / {limit}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                        {Array.from({ length: count }).map((_, itemIdx) => (
                          <div
                            key={itemIdx}
                            style={{
                              width: '28px',
                              height: '18px',
                              borderRadius: '3px',
                              background: isExceeded ? '#f87171' : '#38bdf8',
                              fontSize: '9px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#000',
                            }}
                          >
                            T{itemIdx + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team-norms' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Norm 1: PR Turnaround SLA */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>Pull Request SLA (&lt; 4 Hours)</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: '1.45' }}>
                Unreviewed PRs represent uncommitted inventory that quickly rots into merge conflicts and blocked downstream work.
                Engineers prioritize reviewing inbound PRs over starting new tickets. Small PRs (&lt; 250 LOC) are required.
              </p>
            </div>

            {/* Norm 2: 70 / 20 / 10 Allocation */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#34d399' }}>70 / 20 / 10 Engineering Capacity</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: '1.45' }}>
                <strong>70%</strong> customer-facing feature delivery. <strong>20%</strong> technical debt remediation, framework upgrades, and architectural enablers. <strong>10%</strong> team learning, spikes, and innovation experiments.
              </p>
            </div>

            {/* Norm 3: 3 Amigos Requirement */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24' }}>Three Amigos Before Coding</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: '1.45' }}>
                No story moves to &quot;In Progress&quot; until Product (Business value), Dev (Implementation complexity), and QA (Edge cases &amp; test assertions) agree on the BDD Given-When-Then criteria. Eliminates rework before a single line of code is written.
              </p>
            </div>

            {/* Norm 4: Blameless Post-Mortems */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(244, 114, 182, 0.25)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f472b6' }}>Blameless Post-Mortem Culture</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: '1.45' }}>
                When production incidents occur, we assume all engineers acted with good intentions based on available info.
                The post-mortem focuses on systemic safety: automated guards, alerts, timeouts, and canary gates—never individual blame.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
