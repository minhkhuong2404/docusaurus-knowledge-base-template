import React, { useState } from 'react';

type CompanyId = 'google' | 'meta' | 'microsoft' | 'comparison';

const COMPANIES: { id: CompanyId; label: string; color: string; framework: string; overview: string; traits: { name: string; detail: string }[]; questions: string[]; strategy: string; interviewStyle: string }[] = [
  { id: 'google', label: 'Google', color: '#34d399', framework: 'Googleyness + Role-Related Knowledge',
    overview: 'Google uses structured interviews where every interviewer scores you on a defined rubric. Scores are aggregated by a hiring committee that never met you — your answers must be self-explanatory from written notes alone.',
    traits: [
      { name: 'Cognitive Humility', detail: 'Can you be wrong gracefully? Do you update your beliefs with new data?' },
      { name: 'Comfort with Ambiguity', detail: 'Can you operate in unstructured environments without excessive direction?' },
      { name: 'Fun to Work With', detail: 'Are you collaborative, low-ego, and someone people want on their team?' },
      { name: 'Genuine Care', detail: 'Do you care about building the right thing, not just completing tasks?' },
      { name: 'Intrinsic Motivation', detail: 'Do you do great work because you care, not just to impress?' },
    ],
    questions: ['Tell me about a time you received feedback that fundamentally changed how you work.', 'Describe a project where the requirements changed significantly mid-stream.', 'Tell me about a time you had to persuade someone who had more authority than you.', 'Tell me about a time when you realized a widely held belief in your team was wrong.'],
    strategy: 'Emphasize intellectual honesty. Show that you changed your mind when presented with better information. Show curiosity about the why behind decisions. The worst Google answer is overconfident.',
    interviewStyle: 'STAR-L variant expected (adds Learning component). Emphasis on intellectual honesty and nuanced thinking.'
  },
  { id: 'meta', label: 'Meta', color: '#38bdf8', framework: 'Impact + Move Fast',
    overview: 'Meta behavioral interviews weight scope and scale of impact heavily. They want to see that you move fast, ship things, and measure results. Numbers matter more here than at any other company.',
    traits: [
      { name: 'Move Fast', detail: 'Can you ship quickly while maintaining quality? Do you bias toward action?' },
      { name: 'Be Bold', detail: 'Are you willing to take risks and propose unconventional solutions?' },
      { name: 'Focus on Impact', detail: 'Do you prioritize the highest-impact work? Can you measure your contribution?' },
      { name: 'Build Social Value', detail: 'Do you think about how technology can connect and benefit people?' },
      { name: 'Be Open', detail: 'Are you transparent in communication? Do you share information broadly?' },
    ],
    questions: ['Tell me about the most impactful project you\'ve worked on and how you measured impact.', 'Describe a time you moved fast and iterated vs. planning extensively upfront.', 'Tell me about a time you had to make a tradeoff between speed and quality.', 'Describe a situation where you had to change direction quickly.'],
    strategy: 'Lead with numbers: users affected, revenue influenced, latency reduced, time saved. Meta interviewers want to see scale and measurement rigor.',
    interviewStyle: 'Impact-focused with hard numbers. Expect follow-ups asking "How did you measure that?" and "What was the actual number?"'
  },
  { id: 'microsoft', label: 'Microsoft', color: '#a78bfa', framework: 'Growth Mindset',
    overview: 'Microsoft assesses for growth mindset — the belief that abilities can be developed through dedication and hard work. CEO Satya Nadella transformed Microsoft\'s culture around this principle.',
    traits: [
      { name: 'Growth Mindset', detail: 'Do you believe abilities can be developed? Do you embrace challenges as learning opportunities?' },
      { name: 'Customer Obsession', detail: 'Do you empathize with customers and work to understand their needs deeply?' },
      { name: 'Diverse & Inclusive', detail: 'Do you value different perspectives? Do you create inclusive environments?' },
      { name: 'One Microsoft', detail: 'Can you collaborate across organizational boundaries for shared success?' },
      { name: 'Making a Difference', detail: 'Are you motivated by positive impact beyond just your immediate team?' },
    ],
    questions: ['Tell me about a time you failed and what you learned from it.', 'Describe a time you had to learn a completely new skill to succeed.', 'Tell me about a time you helped someone else grow or develop.', 'Describe how you handled receiving critical feedback.'],
    strategy: 'Stories about learning from failures are especially valued. Show genuine vulnerability and specific behavioral changes that resulted from learning moments.',
    interviewStyle: 'Emphasis on learning, adaptability, and how failures shaped your growth. "What did you learn?" is the most important follow-up.'
  },
];

const COMPARISON_ROWS = [
  { dimension: 'Core Framework', google: 'Googleyness', meta: 'Impact & Move Fast', microsoft: 'Growth Mindset' },
  { dimension: 'What They Value Most', google: 'Intellectual humility', meta: 'Scale of measurable impact', microsoft: 'Learning from failure' },
  { dimension: 'STAR Variant', google: 'STAR-L (Learning)', meta: 'STAR (heavy on metrics)', microsoft: 'STAR-L (Learning)' },
  { dimension: 'Follow-up Style', google: 'Deep conceptual probes', meta: '"What were the numbers?"', microsoft: '"What did you learn?"' },
  { dimension: 'Red Flag', google: 'Overconfidence', meta: 'No impact numbers', microsoft: 'Defensive about mistakes' },
  { dimension: 'Best Story Type', google: 'Changed your mind', meta: 'Shipped fast at scale', microsoft: 'Failed, then grew' },
];

export default function CompanyBehavioralDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CompanyId>('google');
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);

  const tabs: { id: CompanyId; label: string; color: string }[] = [
    { id: 'google', label: 'Google', color: '#34d399' },
    { id: 'meta', label: 'Meta', color: '#38bdf8' },
    { id: 'microsoft', label: 'Microsoft', color: '#a78bfa' },
    { id: 'comparison', label: 'Comparison', color: '#fbbf24' },
  ];

  const company = COMPANIES.find(c => c.id === activeTab);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .comp-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Company Behavioral Frameworks</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedTrait(null); }}
              style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        {company && activeTab !== 'comparison' && (
          <div>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: `${company.color}0a`, border: `1px solid ${company.color}20`, marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: company.color, marginBottom: '4px' }}>{company.framework}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>{company.overview}</div>
            </div>

            <div className="comp-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>Core Traits</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {company.traits.map(trait => {
                    const isActive = selectedTrait === trait.name;
                    return (
                      <button key={trait.name} onClick={() => setSelectedTrait(isActive ? null : trait.name)}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '10px', borderRadius: '7px', border: 'none', cursor: 'pointer', textAlign: 'left', background: isActive ? `${company.color}15` : 'rgba(255,255,255,0.03)', boxShadow: isActive ? `0 0 0 1.5px ${company.color}50` : '0 0 0 1px rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: company.color }}>{trait.name}</div>
                        {isActive && <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginTop: '2px' }}>{trait.detail}</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>Sample Questions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
                  {company.questions.map((q, i) => (
                    <div key={i} style={{ padding: '8px 10px', borderRadius: '6px', background: `${company.color}08`, border: `1px solid ${company.color}15`, fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>{q}</div>
                  ))}
                </div>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: company.color, marginBottom: '4px' }}>Story Strategy</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>{company.strategy}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '11px' }}>Dimension</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#34d399', fontWeight: 700, fontSize: '11px' }}>Google</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', fontWeight: 700, fontSize: '11px' }}>Meta</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', fontWeight: 700, fontSize: '11px' }}>Microsoft</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)', fontWeight: 600, fontSize: '11px' }}>{row.dimension}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--ifm-color-content-secondary)' }}>{row.google}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--ifm-color-content-secondary)' }}>{row.meta}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--ifm-color-content-secondary)' }}>{row.microsoft}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
