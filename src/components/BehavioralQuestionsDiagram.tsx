import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All', color: '#38bdf8' },
  { id: 'conflict', label: 'Conflict', color: '#f87171' },
  { id: 'failure', label: 'Failure', color: '#f97316' },
  { id: 'leadership', label: 'Leadership', color: '#a78bfa' },
  { id: 'ambiguity', label: 'Ambiguity', color: '#8b5cf6' },
  { id: 'deadline', label: 'Deadline', color: '#fbbf24' },
  { id: 'teamwork', label: 'Teamwork', color: '#34d399' },
  { id: 'innovation', label: 'Innovation', color: '#38bdf8' },
  { id: 'customer', label: 'Customer', color: '#f472b6' },
];

const QUESTIONS = [
  { id: 1, q: 'Tell me about a time you disagreed with your manager.', cat: 'conflict', signal: 'Can you push back respectfully while still executing?', tips: 'Show you voiced concerns with data, respected the final decision, and delivered well.' },
  { id: 2, q: 'Tell me about a time you had a conflict with a peer or teammate.', cat: 'conflict', signal: 'Emotional intelligence, ability to collaborate under friction.', tips: 'Address it directly, listen actively, find common ground.' },
  { id: 3, q: 'Tell me about a time a stakeholder pushed back on your technical recommendation.', cat: 'conflict', signal: 'Confidence, data-driven communication, influence without authority.', tips: 'Back your recommendation with evidence and find a compromise.' },
  { id: 4, q: 'Tell me about a time you had to work with a difficult cross-functional partner.', cat: 'conflict', signal: 'Organizational awareness, patience, professional communication.', tips: 'Describe concrete steps to build rapport and alignment.' },
  { id: 5, q: 'Tell me about a time you disagreed with a team decision but still executed it.', cat: 'conflict', signal: 'Disagree and commit — can you execute against your preference?', tips: 'Show you voiced concern clearly, then committed fully without sabotage.' },
  { id: 6, q: 'Tell me about your biggest professional failure.', cat: 'failure', signal: 'Self-awareness, ownership, growth mindset.', tips: 'Own the failure fully, explain what you learned, show what changed.' },
  { id: 7, q: 'Tell me about a time you made a mistake that impacted production.', cat: 'failure', signal: 'Accountability, crisis management, process improvement.', tips: 'Show immediate ownership, clear mitigation steps, and permanent changes.' },
  { id: 8, q: 'Tell me about a time you missed a deadline.', cat: 'failure', signal: 'Planning, communication, accountability.', tips: 'Explain why honestly, when you communicated, what you changed.' },
  { id: 9, q: 'Tell me about a time your code caused a bug in production.', cat: 'failure', signal: 'Technical ownership, communication under pressure.', tips: 'How fast you identified it, how you communicated, what safeguard was added.' },
  { id: 10, q: 'Tell me about a time you received harsh criticism.', cat: 'failure', signal: 'Emotional resilience, coachability.', tips: 'Show you listened, extracted value, and changed behavior.' },
  { id: 11, q: 'Tell me about a time you led a project from start to finish.', cat: 'leadership', signal: 'End-to-end ownership, planning, execution.', tips: 'Show full lifecycle: planning, execution, measurement, retrospective.' },
  { id: 12, q: 'Tell me about a time you mentored a junior engineer.', cat: 'leadership', signal: 'Teaching ability, patience, force multiplication.', tips: 'Show specific teaching methods, measurable growth in the mentee.' },
  { id: 13, q: 'Tell me about a time you influenced a decision you weren\'t the owner of.', cat: 'leadership', signal: 'Influence without authority, persuasion.', tips: 'Show data-driven persuasion and respectful influence.' },
  { id: 14, q: 'Tell me about a time you had to make a decision with incomplete information.', cat: 'ambiguity', signal: 'Judgment under uncertainty, risk assessment.', tips: 'Show hypothesis-driven thinking and how you validated assumptions.' },
  { id: 15, q: 'Tell me about a time you dealt with ambiguous requirements.', cat: 'ambiguity', signal: 'Structuring chaos, stakeholder alignment.', tips: 'Show how you clarified scope, aligned stakeholders, and delivered.' },
  { id: 16, q: 'Tell me about a time you delivered under a tight deadline.', cat: 'deadline', signal: 'Prioritization, execution under pressure.', tips: 'Show clear prioritization, what you cut, and what you protected.' },
  { id: 17, q: 'Tell me about a time you had to juggle competing priorities.', cat: 'deadline', signal: 'Time management, strategic thinking.', tips: 'Show framework for prioritizing (impact vs effort, urgency vs importance).' },
  { id: 18, q: 'Tell me about a time you helped a struggling teammate.', cat: 'teamwork', signal: 'Empathy, team dynamics, collaboration.', tips: 'Show genuine concern, specific support actions, and the outcome.' },
  { id: 19, q: 'Tell me about a time you built consensus on a contentious technical decision.', cat: 'teamwork', signal: 'Facilitation, technical communication.', tips: 'Show structured decision-making process and inclusive collaboration.' },
  { id: 20, q: 'Tell me about a time you identified and solved a problem nobody asked you to.', cat: 'innovation', signal: 'Bias for action, initiative, ownership.', tips: 'Show you saw the gap, proposed a solution, and drove it to completion.' },
  { id: 21, q: 'Tell me about a time you simplified a complex process.', cat: 'innovation', signal: 'Systems thinking, efficiency mindset.', tips: 'Show before/after contrast with quantified improvement.' },
  { id: 22, q: 'Tell me about a time you went above and beyond for a customer or user.', cat: 'customer', signal: 'User empathy, quality mindset.', tips: 'Start with user pain point, show sacrifice for user experience, include measurable impact.' },
  { id: 23, q: 'Tell me about a time you advocated for the end user against business pressure.', cat: 'customer', signal: 'User advocacy, principled decision-making.', tips: 'Show you balanced business needs with user needs using data.' },
  { id: 24, q: 'Tell me about a time you had to adapt your communication style.', cat: 'teamwork', signal: 'Communication flexibility, audience awareness.', tips: 'Show different approaches for different stakeholders (technical vs non-technical).' },
  { id: 25, q: 'Tell me about a time you took a calculated risk.', cat: 'leadership', signal: 'Risk assessment, courage, judgment.', tips: 'Show the risk analysis, mitigation plan, and outcome (even if it failed).' },
];

export default function BehavioralQuestionsDiagram(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = QUESTIONS.filter(q => {
    const matchesCat = activeCat === 'all' || q.cat === activeCat;
    const matchesSearch = search === '' || q.q.toLowerCase().includes(search.toLowerCase()) || q.signal.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const catColor = CATEGORIES.find(c => c.id === activeCat)?.color || '#38bdf8';

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Behavioral Questions Reference ({filtered.length})</span>
        <input type="text" placeholder="Search questions…" value={search} onChange={e => { setSearch(e.target.value); setExpanded(null); }}
          style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)', fontSize: '12px', outline: 'none', width: '160px' }}/>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => { setActiveCat(cat.id); setExpanded(null); }}
              style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: activeCat === cat.id ? `${cat.color}18` : 'rgba(255,255,255,0.04)', color: activeCat === cat.id ? cat.color : 'var(--ifm-color-content-secondary)', boxShadow: activeCat === cat.id ? `0 0 0 1.5px ${cat.color}50` : '0 0 0 1px rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Question list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '500px', overflowY: 'auto' }}>
          {filtered.map(q => {
            const isExpanded = expanded === q.id;
            const qCatColor = CATEGORIES.find(c => c.id === q.cat)?.color || catColor;
            return (
              <div key={q.id} onClick={() => setExpanded(isExpanded ? null : q.id)}
                style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', background: isExpanded ? `${qCatColor}0d` : 'rgba(255,255,255,0.03)', border: `1px solid ${isExpanded ? `${qCatColor}30` : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <code style={{ fontSize: '10px', background: `${qCatColor}18`, color: qCatColor, border: `1px solid ${qCatColor}30`, borderRadius: '4px', padding: '2px 6px', flexShrink: 0 }}>Q{q.id}</code>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>{q.q}</div>
                    {isExpanded && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: qCatColor, marginBottom: '4px' }}>Signal Being Tested</div>
                        <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>{q.signal}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: qCatColor, marginBottom: '4px' }}>Key Points to Cover</div>
                        <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{q.tips}</div>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▶</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ifm-color-content-secondary)', fontSize: '12px' }}>No questions match your filter</div>
          )}
        </div>
      </div>
    </div>
  );
}
