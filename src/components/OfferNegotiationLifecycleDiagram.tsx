import React, { useState } from 'react';

type TabMode = 'pipeline' | 'compensation';

interface NegotiationStage {
  id: string;
  phase: string;
  title: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  summary: string;
  tactics: string[];
  scriptExample: string;
  trapToAvoid: string;
}

const NEGOTIATION_STAGES: NegotiationStage[] = [
  {
    id: 'resume',
    phase: 'STAGE 01',
    title: 'ATS Resume & Shortlist',
    color: '#38bdf8',
    x: 20,
    y: 50,
    w: 152,
    h: 72,
    summary: 'Pass the 10-second recruiter scan and ATS parser using single-column typography, employee referrals, and Google XYZ impact bullets.',
    tactics: [
      'Use Google XYZ formula: Accomplished [X] as measured by [Y], by doing [Z]',
      'Keep strictly to 1 page (<10 yrs exp), single column, standard section headers',
      'Secure internal employee referrals to bypass cold-application queues (3x–5x callback rate)',
    ],
    scriptExample: 'Engineered idempotent Kafka payment consumer (Z), reducing duplicate ledger postings by 99.98% across 14M daily txns (Y) to pass PCI-DSS audit (X).',
    trapToAvoid: 'Multi-column Canva templates, skill percentage bars, or listing duties ("Responsible for writing APIs") without quantified metrics.',
  },
  {
    id: 'anchor',
    phase: 'STAGE 02',
    title: 'Pre-Loop Anchor Deflection',
    color: '#a78bfa',
    x: 202,
    y: 50,
    w: 152,
    h: 72,
    summary: 'Never reveal current compensation or name a target number first during the initial recruiter screen.',
    tactics: [
      'Rule #3: Information is power—protect your baseline and let the company anchor first',
      'Ask the recruiter for the approved leveling band (Base + Equity + Bonus) under pay transparency laws',
      'Frame expectations around market value for the target level once scope is clear',
    ],
    scriptExample: '"I am focused on finding the right technical scope first. I trust your team pays competitively for L5—could you share the approved total comp band for this level?"',
    trapToAvoid: 'Giving a low number early out of fear—it sets a hard ceiling on your final offer weeks later.',
  },
  {
    id: 'batna',
    phase: 'STAGE 03',
    title: 'Sync Multi-Offer BATNA',
    color: '#34d399',
    x: 384,
    y: 50,
    w: 152,
    h: 72,
    summary: 'Schedule onsites in parallel across 3–4 companies so verbal offers land within the same 5-day window.',
    tactics: [
      'Rule #6: Have alternatives (BATNA)—competing offers are the #1 driver of out-of-band equity approvals',
      'Communicate timeline updates transparently to slow down fast-moving recruiters and speed up slow loops',
      'Never accept an offer on the spot over the phone; always request the full breakdown in writing',
    ],
    scriptExample: '"Thank you so much for the offer! I am super excited about the team. Could you send the written breakdown over email so I can review the equity and benefits details with my family?"',
    trapToAvoid: 'Falling for "exploding offer" artificial deadlines without politely requesting a 1-week extension to finish final rounds.',
  },
  {
    id: 'counter',
    phase: 'STAGE 04',
    title: 'Written Counter-Offer',
    color: '#fbbf24',
    x: 566,
    y: 50,
    w: 152,
    h: 72,
    summary: 'Negotiate Total Compensation (TC) systematically by pulling high-flexibility levers (RSU Equity + Sign-On Bonus + Leveling).',
    tactics: [
      'Rule #7 & #10: Proclaim clear reasons for every ask (competing offer data, Levels.fyi 75th percentile, forfeited unvested equity)',
      'Rule #5: Use a non-present decision partner ("My family and I...") to stay collaborative with the recruiter',
      'Target RSU grant and Year-1 Sign-On bonus when base salary hits the hard level cap',
    ],
    scriptExample: '"I really want to make [Company A] work. Right now [Company B] is at $340k TC. If we can bring the RSU grant up to $160k/yr and add a $35k sign-on to bridge my forfeited bonus, I am ready to sign this week."',
    trapToAvoid: 'Issuing an ultimatum without being willing to walk away, or negotiating piecemeal (asking for base today, then sign-on tomorrow).',
  },
  {
    id: 'decide',
    phase: 'STAGE 05',
    title: '5-Vector Company Choice',
    color: '#f472b6',
    x: 748,
    y: 50,
    w: 152,
    h: 72,
    summary: 'Evaluate final competing offers on Risk-Adjusted 4-Year Total Comp, Manager Quality, Promotion Velocity, and Engineering Brand.',
    tactics: [
      'Discount illiquid private startup paper equity by 50–80% when comparing against public liquid RSUs',
      'Check cliff/vesting schedules (e.g., 1-yr cliff vs monthly/quarterly vesting, backloaded 5/15/40/40 vs even 25/25/25/25)',
      'Interview your direct manager during a post-offer Reverse 1:1 before signing',
    ],
    scriptExample: 'Decision Formula: Score(Offer) = 0.35*(Liquid TC) + 0.25*(Manager & Team Health) + 0.20*(Level & Promo Velocity) + 0.20*(Tech Stack & Brand).',
    trapToAvoid: 'Optimizing purely for a $10k Year-1 cash bump while joining a toxic team with high on-call burnout and zero promotion path.',
  },
];

interface CompComponent {
  id: string;
  name: string;
  shareRange: string;
  flexibility: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  mechanics: string;
  negotiationStrategy: string;
  riskWatchout: string;
}

const COMP_COMPONENTS: CompComponent[] = [
  {
    id: 'base',
    name: '1. Base Salary (Fixed Cash)',
    shareRange: '40%–70% of TC',
    flexibility: 'Low–Medium Flexibility',
    color: '#38bdf8',
    x: 40,
    y: 35,
    w: 190,
    h: 64,
    mechanics: 'Guaranteed bi-weekly/monthly cash paycheck. Strictly bounded by internal HR leveling bands (e.g., L5 Base cap = $210k–$240k).',
    negotiationStrategy: 'Push to the 75th–90th percentile of the band, then pivot immediately to Equity and Sign-On when the recruiter hits the HR base cap.',
    riskWatchout: 'Compounds via annual merit raises (3–5%) and anchors your target bonus percentage.',
  },
  {
    id: 'equity',
    name: '2. Equity (RSUs / Options)',
    shareRange: '25%–55% of TC',
    flexibility: 'High Flexibility',
    color: '#34d399',
    x: 260,
    y: 35,
    w: 190,
    h: 64,
    mechanics: 'Public RSUs vest as liquid cash equivalents (usually over 4 years). Startup ISOs/NSOs or private RSUs require a liquidity event (IPO/tender).',
    negotiationStrategy: 'The single highest-leverage component for L5/L6+ engineers. Competing offers regularly unlock 30%–60% larger initial RSU grants.',
    riskWatchout: 'Check vesting skew (even 25%/yr vs Amazon 5/15/40/40), 1-year cliff, refresher grant policy, and 409A strike price / dilution.',
  },
  {
    id: 'signon',
    name: '3. Sign-On Bonus (Year 1 / 2)',
    shareRange: '5%–20% of Y1 TC',
    flexibility: 'Highest Flexibility',
    color: '#fbbf24',
    x: 480,
    y: 35,
    w: 190,
    h: 64,
    mechanics: 'One-time cash payment (paid in first paycheck or split across Year 1 & Year 2) that does not permanently inflate recurring payroll.',
    negotiationStrategy: 'Easiest lever for a recruiter to approve within 24 hours to bridge unvested stock or upcoming annual bonuses you forfeit by leaving.',
    riskWatchout: 'Read clawback clauses carefully: choose pro-rata monthly clawback over 100% full-repayment if you leave before 12 months.',
  },
  {
    id: 'bonus',
    name: '4. Annual Performance Bonus',
    shareRange: '10%–25% of Base',
    flexibility: 'Fixed by Level',
    color: '#a78bfa',
    x: 700,
    y: 35,
    w: 190,
    h: 64,
    mechanics: 'Target percentage of Base Salary (e.g., 15% at L5) multiplied by Individual Performance Multiplier × Company Multiplier.',
    negotiationStrategy: 'Target % is locked to level and cannot be negotiated directly—increase it indirectly by negotiating a higher Base Salary or an up-level.',
    riskWatchout: 'Check historical payout ratios and fiscal year cutoff dates (joining in Q4 may make you ineligible for the current cycle).',
  },
];

export default function OfferNegotiationLifecycleDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>('pipeline');
  const [selectedStageId, setSelectedStageId] = useState<string>('counter');
  const [selectedCompId, setSelectedCompId] = useState<string>('equity');

  const activeStage = NEGOTIATION_STAGES.find((s) => s.id === selectedStageId) ?? NEGOTIATION_STAGES[3];
  const activeComp = COMP_COMPONENTS.find((c) => c.id === selectedCompId) ?? COMP_COMPONENTS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .negotiation-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="interactive-diagram-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span style={{ color: '#34d399', fontWeight: 700 }}>
            Resume Shortlisting, Total Compensation &amp; Negotiation Engine
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              background: activeTab === 'pipeline' ? 'rgba(251, 191, 36, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'pipeline' ? '#fbbf24' : '#94a3b8',
              boxShadow: activeTab === 'pipeline' ? '0 0 0 1.5px rgba(251, 191, 36, 0.5)' : '0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            5-Stage Negotiation Flow
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compensation')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              background: activeTab === 'compensation' ? 'rgba(52, 211, 153, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'compensation' ? '#34d399' : '#94a3b8',
              boxShadow: activeTab === 'compensation' ? '0 0 0 1.5px rgba(52, 211, 153, 0.5)' : '0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            Total Compensation (TC) Levers
          </button>
        </div>
      </div>

      {activeTab === 'pipeline' ? (
        <div style={{ padding: '16px' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <svg viewBox="0 0 920 170" style={{ width: '100%', minWidth: '740px', height: 'auto', display: 'block' }}>
              <defs>
                {NEGOTIATION_STAGES.map((stage) => (
                  <marker
                    key={stage.id}
                    id={`neg-arr-${stage.id}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L8,3 z" fill={stage.color} />
                  </marker>
                ))}
              </defs>

              {NEGOTIATION_STAGES.slice(0, -1).map((stage, idx) => {
                const next = NEGOTIATION_STAGES[idx + 1];
                const x1 = stage.x + stage.w + 6;
                const y1 = stage.y + stage.h / 2;
                const x2 = next.x - 10;
                const y2 = next.y + next.h / 2;
                const pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
                return (
                  <g key={`${stage.id}-${next.id}`}>
                    <path d={pathD} stroke="rgba(148, 163, 184, 0.25)" strokeWidth="2" fill="none" />
                    <path
                      d={pathD}
                      stroke={stage.color}
                      strokeWidth="2.2"
                      fill="none"
                      className="interactive-diagram-flowing-path"
                      markerEnd={`url(#neg-arr-${stage.id})`}
                    />
                  </g>
                );
              })}

              {NEGOTIATION_STAGES.map((stage) => {
                const isSelected = stage.id === activeStage.id;
                return (
                  <g
                    key={stage.id}
                    onClick={() => setSelectedStageId(stage.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={stage.x}
                      y={stage.y}
                      width={stage.w}
                      height={stage.h}
                      rx={10}
                      fill={isSelected ? `${stage.color}24` : 'rgba(15, 23, 42, 0.9)'}
                      stroke={stage.color}
                      strokeWidth={isSelected ? 2.4 : 1.3}
                    />
                    <text x={stage.x + 12} y={stage.y + 22} fill={stage.color} fontSize="10" fontWeight="700">
                      {stage.phase}
                    </text>
                    <text x={stage.x + 12} y={stage.y + 42} fill="#ffffff" fontSize="11.5" fontWeight="700">
                      {stage.title}
                    </text>
                    <text x={stage.x + 12} y={stage.y + 58} fill="#94a3b8" fontSize="10">
                      Click for word-track
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div
            className="interactive-diagram-details-card"
            style={{
              borderLeft: `4px solid ${activeStage.color}`,
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: activeStage.color, marginBottom: '8px' }}>
              {activeStage.phase}: {activeStage.title}
            </div>
            <p style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '14px', lineHeight: 1.55 }}>
              {activeStage.summary}
            </p>

            <div className="negotiation-split-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                  Tactical Execution Playbook
                </div>
                {activeStage.tactics.map((t, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '6px', lineHeight: 1.5 }}>
                    • {t}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(52, 211, 153, 0.07)', border: '1px solid rgba(52, 211, 153, 0.28)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                    Exact Word-Track / Template
                  </div>
                  <div style={{ fontSize: '12px', color: '#ffffff', fontStyle: 'italic', lineHeight: 1.5 }}>
                    {activeStage.scriptExample}
                  </div>
                </div>
                <div style={{ background: 'rgba(248, 113, 113, 0.07)', border: '1px solid rgba(248, 113, 113, 0.28)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                    Fatal Trap to Avoid
                  </div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>
                    {activeStage.trapToAvoid}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <svg viewBox="0 0 920 210" style={{ width: '100%', minWidth: '740px', height: 'auto', display: 'block' }}>
              <defs>
                {COMP_COMPONENTS.map((c) => (
                  <marker
                    key={c.id}
                    id={`tc-arr-${c.id}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L8,3 z" fill={c.color} />
                  </marker>
                ))}
              </defs>

              {COMP_COMPONENTS.map((c) => {
                const isSelected = c.id === activeComp.id;
                const startX = c.x + c.w / 2;
                const startY = c.y + c.h + 6;
                const targetX = 460;
                const targetY = 142;
                const pathD = `M ${startX} ${startY} C ${startX} ${startY + 22}, ${targetX} ${targetY - 22}, ${targetX} ${targetY}`;
                return (
                  <g key={c.id}>
                    <path d={pathD} stroke="rgba(148, 163, 184, 0.22)" strokeWidth="1.8" fill="none" />
                    <path
                      d={pathD}
                      stroke={c.color}
                      strokeWidth={isSelected ? '2.5' : '1.8'}
                      fill="none"
                      className="interactive-diagram-flowing-path"
                      markerEnd={`url(#tc-arr-${c.id})`}
                    />
                    <g onClick={() => setSelectedCompId(c.id)} style={{ cursor: 'pointer' }}>
                      <rect
                        x={c.x}
                        y={c.y}
                        width={c.w}
                        height={c.h}
                        rx={10}
                        fill={isSelected ? `${c.color}24` : 'rgba(15, 23, 42, 0.9)'}
                        stroke={c.color}
                        strokeWidth={isSelected ? 2.4 : 1.3}
                      />
                      <text x={c.x + 12} y={c.y + 23} fill={c.color} fontSize="11.5" fontWeight="700">
                        {c.name}
                      </text>
                      <text x={c.x + 12} y={c.y + 41} fill="#ffffff" fontSize="11" fontWeight="600">
                        {c.shareRange}
                      </text>
                      <text x={c.x + 12} y={c.y + 55} fill="#94a3b8" fontSize="10">
                        {c.flexibility}
                      </text>
                    </g>
                  </g>
                );
              })}

              <rect
                x={255}
                y={148}
                width={410}
                height={46}
                rx={10}
                fill="rgba(15, 23, 42, 0.95)"
                stroke="#fbbf24"
                strokeWidth="2"
              />
              <text x={460} y={168} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                Annualized Total Compensation (TC) Formula
              </text>
              <text x={460} y={184} textAnchor="middle" fill="#fbbf24" fontSize="10.5">
                TC = Base + (4-Yr RSU Grant / 4) + (Target Bonus %) + (Amortized Sign-On)
              </text>
            </svg>
          </div>

          <div
            className="interactive-diagram-details-card"
            style={{
              borderLeft: `4px solid ${activeComp.color}`,
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: activeComp.color }}>
                {activeComp.name} ({activeComp.shareRange})
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: `${activeComp.color}20`,
                  color: activeComp.color,
                }}
              >
                {activeComp.flexibility}
              </span>
            </div>

            <div className="negotiation-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  Under-the-Hood Mechanics
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55, marginBottom: '10px' }}>
                  {activeComp.mechanics}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
                  Fine-Print &amp; Vesting Watchout
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {activeComp.riskWatchout}
                </div>
              </div>

              <div style={{ background: 'rgba(52, 211, 153, 0.07)', border: '1px solid rgba(52, 211, 153, 0.28)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                  Recruiter &amp; Comp Committee Negotiation Strategy
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55 }}>
                  {activeComp.negotiationStrategy}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
