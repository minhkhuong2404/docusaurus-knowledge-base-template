import React, { useState } from 'react';

const LPS = [
  { id: 1, name: 'Customer Obsession', quote: 'Leaders start with the customer and work backwards.', color: '#f472b6', cluster: 'customer', testing: 'Do you think about the user first, or do you focus internally?', questions: ['Tell me about a time you sacrificed short-term metrics for long-term customer satisfaction.', 'Tell me about a time a customer was unhappy with your work.', 'When did you go above and beyond for a user?'], strategy: 'Include the user\'s actual pain point, your reasoning that centered the user, and a measurable improvement in their experience.' },
  { id: 2, name: 'Ownership', quote: 'Leaders never say "that\'s not my job."', color: '#a78bfa', cluster: 'ownership', testing: 'Do you take responsibility for outcomes, including when things go wrong?', questions: ['Tell me about a time you took ownership of something outside your job description.', 'Tell me about a failure and what you learned.', 'When did you see a problem and fix it without being asked?'], strategy: 'Emphasize I over we. Show you didn\'t wait for permission or someone else to step up. Include a long-term impact.' },
  { id: 3, name: 'Invent and Simplify', quote: 'Leaders expect and require innovation and invention from their teams.', color: '#38bdf8', cluster: 'technical', testing: 'Are you creative? Do you question the status quo?', questions: ['Tell me about a time you simplified a complex process.', 'When did you invent something new?', 'Tell me about a time you tried something unconventional.'], strategy: 'Show the before/after contrast. Quantify the simplification (e.g., reduced steps from 12 to 3, cut processing time by 60%).' },
  { id: 4, name: 'Are Right, A Lot', quote: 'Leaders have strong judgment and good instincts.', color: '#34d399', cluster: 'technical', testing: 'Can you make high-quality decisions? Do you seek diverse perspectives?', questions: ['Tell me about a time you made a decision that was unpopular but turned out to be correct.', 'Describe a time you changed your mind after getting new data.'], strategy: 'Show both confidence AND humility. The best answers show you were right AND explain how you updated your thinking.' },
  { id: 5, name: 'Learn and Be Curious', quote: 'Leaders are never done learning and always seek to improve themselves.', color: '#2dd4bf', cluster: 'growth', testing: 'Are you genuinely curious? Do you invest in your own growth?', questions: ['Tell me about a time you had to learn something completely new to complete a project.', 'How do you stay current with technology?'], strategy: 'Show intrinsic motivation for learning. Reference specific technologies, courses, or books. Show how learning directly improved your work.' },
  { id: 6, name: 'Hire and Develop the Best', quote: 'Leaders raise the performance bar with every hire and promotion.', color: '#a78bfa', cluster: 'ownership', testing: 'Do you invest in growing others? Do you recognize talent?', questions: ['Tell me about a time you mentored someone who went on to succeed.', 'Describe your approach to hiring.'], strategy: 'Show specific mentoring actions and measurable growth in the person you developed.' },
  { id: 7, name: 'Insist on the Highest Standards', quote: 'Leaders have relentlessly high standards.', color: '#fbbf24', cluster: 'technical', testing: 'Do you demand quality? Do you catch defects others miss?', questions: ['Tell me about a time you refused to compromise on quality.', 'Describe a time you raised the bar for your team.'], strategy: 'Show a specific quality standard you enforced and the measurable impact of maintaining it.' },
  { id: 8, name: 'Think Big', quote: 'Thinking small is a self-fulfilling prophecy.', color: '#38bdf8', cluster: 'technical', testing: 'Can you envision bold solutions? Do you think beyond the immediate task?', questions: ['Tell me about a time you proposed a bold idea.', 'Describe a project where you had to think at a scale larger than your role.'], strategy: 'Show vision AND execution. Big thinking without delivery is just talk.' },
  { id: 9, name: 'Bias for Action', quote: 'Speed matters in business. Many decisions are reversible.', color: '#f97316', cluster: 'ownership', testing: 'Do you act quickly? Can you distinguish reversible vs irreversible decisions?', questions: ['Tell me about a time you made a decision quickly with limited data.', 'Describe a time when you moved fast and iterated.'], strategy: 'Emphasize calculated speed, not recklessness. Show you assessed reversibility before acting.' },
  { id: 10, name: 'Frugality', quote: 'Accomplish more with less. Constraints breed resourcefulness.', color: '#34d399', cluster: 'customer', testing: 'Can you deliver results without excessive resources?', questions: ['Tell me about a time you achieved a result with very limited budget or resources.'], strategy: 'Show creativity within constraints. Quantify the savings or efficiency gains.' },
  { id: 11, name: 'Earn Trust', quote: 'Leaders listen attentively, speak candidly, and treat others respectfully.', color: '#f87171', cluster: 'growth', testing: 'Are you transparent? Do people trust your word?', questions: ['Tell me about a time you had to deliver tough feedback.', 'Describe a time you admitted you were wrong.'], strategy: 'Show vulnerability and honesty. The hardest answers (admitting mistakes, giving tough feedback) score highest.' },
  { id: 12, name: 'Dive Deep', quote: 'Leaders operate at all levels, stay connected to details, and audit frequently.', color: '#8b5cf6', cluster: 'technical', testing: 'Can you go deep into technical details? Do you trust-but-verify?', questions: ['Tell me about a time you found a problem by digging into the details.', 'Describe a time metrics told a different story than what people reported.'], strategy: 'Show specific technical depth. Mention exact metrics, logs, or code you investigated.' },
  { id: 13, name: 'Have Backbone; Disagree and Commit', quote: 'Leaders respectfully challenge decisions when they disagree.', color: '#f87171', cluster: 'growth', testing: 'Can you push back constructively? Can you commit after disagreeing?', questions: ['Tell me about a time you disagreed with your manager and what happened.', 'Describe a time you pushed back on a popular but incorrect decision.'], strategy: 'Show both halves: the respectful disagreement AND the full commitment after the decision was final.' },
  { id: 14, name: 'Deliver Results', quote: 'Leaders focus on the key inputs for their business and deliver them.', color: '#fbbf24', cluster: 'ownership', testing: 'Do you actually ship? Can you drive through obstacles?', questions: ['Tell me about a time you delivered a project under difficult circumstances.', 'Describe a time you had to prioritize ruthlessly to deliver.'], strategy: 'Quantify the delivery: on-time, under-budget, users served, revenue impacted. Show obstacle navigation.' },
  { id: 15, name: 'Strive to be Earth\'s Best Employer', quote: 'Leaders work to create a safer, more productive, higher performing, more diverse, and more just work environment.', color: '#2dd4bf', cluster: 'growth', testing: 'Do you care about the people around you? Do you create inclusive environments?', questions: ['Tell me about a time you advocated for a teammate who was struggling.', 'How do you contribute to an inclusive team environment?'], strategy: 'Show genuine empathy. Include specific actions that improved someone else\'s work experience.' },
  { id: 16, name: 'Success and Scale Bring Broad Responsibility', quote: 'We must be humble and thoughtful about even the secondary effects of our actions.', color: '#f472b6', cluster: 'customer', testing: 'Do you think about broader impact? Are you thoughtful about consequences?', questions: ['Tell me about a time you considered the broader implications of a technical decision.', 'Describe a time your work had unexpected consequences.'], strategy: 'Show systems thinking. Demonstrate awareness of ripple effects beyond your immediate team.' },
];

const CLUSTERS = [
  { id: 'all', label: 'All 16 LPs', color: '#38bdf8' },
  { id: 'customer', label: 'Customer', color: '#f472b6' },
  { id: 'ownership', label: 'Ownership', color: '#a78bfa' },
  { id: 'technical', label: 'Technical', color: '#38bdf8' },
  { id: 'growth', label: 'Growth', color: '#34d399' },
];

export default function AmazonLPDiagram(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [activeCluster, setActiveCluster] = useState('all');
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = LPS.filter(lp => {
    const matchesCluster = activeCluster === 'all' || lp.cluster === activeCluster;
    const matchesSearch = search === '' || lp.name.toLowerCase().includes(search.toLowerCase()) || lp.quote.toLowerCase().includes(search.toLowerCase());
    return matchesCluster && matchesSearch;
  });

  const sel = LPS.find(lp => lp.id === selected);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .alp-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Amazon Leadership Principles ({filtered.length})</span>
        <input type="text" placeholder="Search LPs…" value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
          style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)', fontSize: '12px', outline: 'none', width: '140px' }}/>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Cluster filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {CLUSTERS.map(c => (
            <button key={c.id} onClick={() => { setActiveCluster(c.id); setSelected(null); }}
              style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: activeCluster === c.id ? `${c.color}18` : 'rgba(255,255,255,0.04)', color: activeCluster === c.id ? c.color : 'var(--ifm-color-content-secondary)', boxShadow: activeCluster === c.id ? `0 0 0 1.5px ${c.color}50` : '0 0 0 1px rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Split pane */}
        <div className="alp-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '480px', overflowY: 'auto' }}>
            {filtered.map(lp => {
              const isActive = selected === lp.id;
              return (
                <button key={lp.id} onClick={() => setSelected(isActive ? null : lp.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', background: isActive ? `${lp.color}15` : 'rgba(255,255,255,0.03)', boxShadow: isActive ? `0 0 0 1.5px ${lp.color}50` : '0 0 0 1px rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}>
                  <div style={{ flexShrink: 0, width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${lp.color}20`, fontSize: '11px', fontWeight: 800, color: lp.color }}>{lp.id}</div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: lp.color }}>{lp.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', fontStyle: 'italic', lineHeight: 1.4, marginTop: '1px' }}>{lp.quote}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="interactive-diagram-details-card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: sel ? 'flex-start' : 'center' }}>
            {sel ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: sel.color }}>#{sel.id}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: sel.color }}>{sel.name}</span>
                </div>
                <div style={{ fontSize: '11px', fontStyle: 'italic', color: sel.color, opacity: 0.8, marginBottom: '10px' }}>{sel.quote}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>What They Test</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{sel.testing}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>Example Questions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                  {sel.questions.map((q, i) => (
                    <div key={i} style={{ padding: '6px 10px', borderRadius: '6px', background: `${sel.color}08`, border: `1px solid ${sel.color}15`, fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>{q}</div>
                  ))}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>Story Strategy</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>{sel.strategy}</div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click a Leadership Principle to see questions and strategies</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
