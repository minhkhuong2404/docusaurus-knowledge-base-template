import React, { useState } from 'react';

const THEMES = [
  { id: 'conflict', label: 'Conflict & Disagreement', color: '#f87171', icon: '⚔', stories: '2–3', testing: 'Communication, diplomacy, maturity, ability to disagree respectfully while maintaining relationships.', tips: ['Show you voiced concerns with data, not emotion', 'Emphasize resolution and what you learned', 'Never blame the other person — own your part'] },
  { id: 'failure', label: 'Failure & Mistakes', color: '#f97316', icon: '✗', stories: '2', testing: 'Self-awareness, ownership, growth mindset, ability to reflect honestly on mistakes.', tips: ['Own the failure fully — no blame-shifting', 'Show a specific, actionable lesson learned', 'Demonstrate behavioral change after the event'] },
  { id: 'leadership', label: 'Leadership & Influence', color: '#a78bfa', icon: '★', stories: '2–3', testing: 'Initiative, stakeholder management, ability to lead without formal authority.', tips: ['Use examples of leading cross-functional initiatives', 'Show influence through data and persuasion, not authority', 'Highlight times you led without being asked'] },
  { id: 'ambiguity', label: 'Ambiguity & Complexity', color: '#8b5cf6', icon: '?', stories: '2', testing: 'Problem-solving, judgment under uncertainty, comfort with incomplete information.', tips: ['Show how you structured an ambiguous problem', 'Demonstrate hypothesis-driven decision making', 'Emphasize gathering data before committing'] },
  { id: 'deadline', label: 'Deadline & Pressure', color: '#fbbf24', icon: '⏱', stories: '2', testing: 'Prioritization, resilience, delivery focus, ability to perform under stress.', tips: ['Show clear prioritization logic (MoSCoW, impact/effort)', 'Demonstrate early communication when timelines slip', 'Quantify what you delivered under constraint'] },
  { id: 'teamwork', label: 'Collaboration & Teamwork', color: '#34d399', icon: '⊕', stories: '2', testing: 'Empathy, communication, trust-building, cross-team coordination.', tips: ['Show genuine empathy for teammate constraints', 'Demonstrate proactive communication habits', 'Highlight how you built consensus across teams'] },
  { id: 'innovation', label: 'Innovation & Impact', color: '#38bdf8', icon: '◆', stories: '1–2', testing: 'Creativity, bias for action, outcome focus, willingness to challenge status quo.', tips: ['Show the before/after contrast with metrics', 'Demonstrate you drove the initiative, not just suggested it', 'Quantify adoption or impact of your innovation'] },
  { id: 'customer', label: 'Customer Obsession', color: '#f472b6', icon: '♡', stories: '1–2', testing: 'User empathy, quality mindset, working backwards from the customer.', tips: ['Start with the user pain point, not the technical problem', 'Show you sacrificed convenience for user experience', 'Include measurable user impact (NPS, churn, adoption)'] },
];

const COMPANIES = [
  { id: 'amazon', label: 'Amazon', color: '#f97316', framework: 'Leadership Principles (LPs)', detail: 'Amazon explicitly maps every behavioral question to one of their 16 Leadership Principles. Interviewers take structured notes on which LP you demonstrated. A Bar Raiser from another team attends every loop to maintain the hiring bar.', keyTraits: ['Customer Obsession', 'Ownership', 'Bias for Action', 'Dive Deep', 'Disagree and Commit'], interviewStyle: 'Deep-dive into 1–2 stories per LP with 5–10 follow-up probes.' },
  { id: 'google', label: 'Google', color: '#34d399', framework: 'Googleyness + Role-Related Knowledge', detail: 'Google assesses Googleyness (cognitive humility, comfort with ambiguity, collaboration) and general cognitive ability through behavioral signals. Scores are aggregated by a hiring committee that never met you.', keyTraits: ['Cognitive Humility', 'Comfort with Ambiguity', 'Fun to Work With', 'Genuine Care', 'Intrinsic Motivation'], interviewStyle: 'STAR-L variant expected (Learning component). Emphasis on intellectual honesty.' },
  { id: 'meta', label: 'Meta', color: '#38bdf8', framework: 'Impact & Move Fast', detail: 'Meta behavioral interviews weight scope and scale of impact heavily. They want to see that you move fast, ship things, and measure results. Numbers matter more here than at any other company.', keyTraits: ['Move Fast', 'Be Bold', 'Focus on Impact', 'Build Social Value', 'Be Open'], interviewStyle: 'Impact-focused with numbers: users affected, revenue influenced, time saved.' },
  { id: 'microsoft', label: 'Microsoft', color: '#a78bfa', framework: 'Growth Mindset', detail: 'Microsoft assesses for growth mindset — the belief that abilities can be developed through dedication and hard work. Stories about learning from failures are especially valued.', keyTraits: ['Growth Mindset', 'Customer Obsession', 'Diverse & Inclusive', 'One Microsoft', 'Making a Difference'], interviewStyle: 'Emphasis on learning, adaptability, and how failures shaped your growth.' },
];

const SCORES = [
  { level: 4, label: 'Strong Hire', color: '#34d399', criteria: 'Clear STAR structure, strong action with "I" throughout, measurable quantified result, demonstrated leadership principle, shows depth on follow-up probes.' },
  { level: 3, label: 'Hire', color: '#38bdf8', criteria: 'Good STAR structure, reasonable concrete actions, result mentioned with some quantification, shows competency in the assessed area.' },
  { level: 2, label: 'Lean No Hire', color: '#fbbf24', criteria: 'Vague or team-heavy actions ("we did it"), missing or unquantified result, hypothetical elements mixed in, lacks depth under probing.' },
  { level: 1, label: 'No Hire', color: '#f87171', criteria: 'No structure, hypothetical answer instead of real experience, poor self-awareness, blames others, defensive when probed.' },
];

type TabId = 'themes' | 'companies' | 'scoring';

export default function BehavioralOverviewDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('themes');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const tabs: { id: TabId; label: string; color: string }[] = [
    { id: 'themes', label: 'Big 8 Behavioral Themes', color: '#38bdf8' },
    { id: 'companies', label: 'Company Frameworks', color: '#34d399' },
    { id: 'scoring', label: 'Scoring Rubric', color: '#fbbf24' },
  ];

  const selTheme = THEMES.find(t => t.id === selectedTheme);
  const selCompany = COMPANIES.find(c => c.id === selectedCompany);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .bov-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Behavioral Interview Strategy Overview</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedTheme(null); setSelectedCompany(null); }}
              style={{ flex: 1, minWidth: '140px', padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'themes' && (
          <div className="bov-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {THEMES.map(theme => {
                const isActive = selectedTheme === theme.id;
                return (
                  <button key={theme.id} onClick={() => setSelectedTheme(isActive ? null : theme.id)}
                    style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', textAlign: 'left', background: isActive ? `${theme.color}18` : 'rgba(255,255,255,0.03)', boxShadow: isActive ? `0 0 0 1.5px ${theme.color}50` : '0 0 0 1px rgba(255,255,255,0.07)', transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', color: theme.color }}>{theme.icon}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: theme.color }}>{theme.label}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Prepare {theme.stories} stories</span>
                  </button>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: selTheme ? 'flex-start' : 'center' }}>
              {selTheme ? (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: selTheme.color, marginBottom: '6px' }}>{selTheme.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px', lineHeight: 1.6 }}>{selTheme.testing}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>Story Tips</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {selTheme.tips.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <span style={{ color: selTheme.color, fontSize: '11px', flexShrink: 0 }}>●</span>
                        <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click a theme to see what interviewers test and story tips</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="bov-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {COMPANIES.map(company => {
                const isActive = selectedCompany === company.id;
                return (
                  <button key={company.id} onClick={() => setSelectedCompany(isActive ? null : company.id)}
                    style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', textAlign: 'left', background: isActive ? `${company.color}18` : 'rgba(255,255,255,0.03)', boxShadow: isActive ? `0 0 0 1.5px ${company.color}50` : '0 0 0 1px rgba(255,255,255,0.07)', transition: 'all 0.2s ease' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: company.color }}>{company.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>{company.framework}</div>
                  </button>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card" style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: selCompany ? 'flex-start' : 'center' }}>
              {selCompany ? (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: selCompany.color, marginBottom: '4px' }}>{selCompany.label}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: selCompany.color, marginBottom: '8px', opacity: 0.8 }}>{selCompany.framework}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{selCompany.detail}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>Key Traits</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                    {selCompany.keyTraits.map(trait => (
                      <code key={trait} style={{ fontSize: '10px', background: `${selCompany.color}18`, color: selCompany.color, border: `1px solid ${selCompany.color}30`, borderRadius: '4px', padding: '3px 7px' }}>{trait}</code>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>Interview Style</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{selCompany.interviewStyle}</div>
                </div>
              ) : (
                <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click a company to see their behavioral framework</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scoring' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SCORES.map(score => (
              <div key={score.level} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px', borderRadius: '10px', background: `${score.color}0a`, border: `1px solid ${score.color}25`, transition: 'all 0.2s ease' }}>
                <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${score.color}20`, border: `1.5px solid ${score.color}40` }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: score.color }}>{score.level}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: score.color, marginBottom: '4px' }}>{score.label}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>{score.criteria}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
