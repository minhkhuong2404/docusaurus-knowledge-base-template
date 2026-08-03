import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'tech-leadership', label: 'Technical Leadership', color: '#38bdf8', count: '2–3', stories: [
    { id: 's1', title: 'The Time I Saved a Failing Project', prompt: 'A project heading toward disaster that you turned around.', power: 'Shows leadership, resilience, problem-solving', themes: ['leadership', 'deadline', 'ambiguity'] },
    { id: 's2', title: 'The Time I Changed Someone\'s Mind', prompt: 'Convinced a skeptical manager, team, or client to take your approach.', power: 'Shows communication, confidence, data-driven thinking', themes: ['conflict', 'leadership', 'innovation'] },
  ]},
  { id: 'conflict', label: 'Conflict & Disagreement', color: '#f87171', count: '2', stories: [
    { id: 's3', title: 'The Time I Had a Difficult Colleague', prompt: 'A relationship that required patience, empathy, and strategy.', power: 'Shows emotional intelligence, diplomacy', themes: ['conflict', 'teamwork'] },
    { id: 's4', title: 'The Time I Delivered Bad News', prompt: 'Told a client, manager, or team something they didn\'t want to hear.', power: 'Shows courage, transparency, communication', themes: ['conflict', 'leadership'] },
  ]},
  { id: 'failure', label: 'Failure & Mistakes', color: '#f97316', count: '2', stories: [
    { id: 's5', title: 'The Time I Made a Big Mistake', prompt: 'A bug, bad decision, or missed deadline that was your fault.', power: 'Shows ownership, growth mindset, maturity', themes: ['failure'] },
    { id: 's6', title: 'The Time I Failed to Deliver', prompt: 'When you couldn\'t meet expectations and how you handled it.', power: 'Shows accountability, communication under pressure', themes: ['failure', 'deadline'] },
  ]},
  { id: 'collaboration', label: 'Cross-functional Collaboration', color: '#34d399', count: '2', stories: [
    { id: 's7', title: 'The Time I Led Without Authority', prompt: 'Coordinated cross-team work without a formal management role.', power: 'Shows influence, leadership potential', themes: ['leadership', 'teamwork'] },
    { id: 's8', title: 'The Time I Solved an Ambiguous Problem', prompt: 'A task with no clear spec, conflicting inputs, or unknown scope.', power: 'Shows judgment, structuring thinking', themes: ['ambiguity', 'innovation'] },
  ]},
  { id: 'innovation', label: 'Innovation & Initiative', color: '#a78bfa', count: '1–2', stories: [
    { id: 's9', title: 'The Time I Took Initiative Without Being Asked', prompt: 'You saw a gap, proposed a solution, and drove it to completion.', power: 'Shows bias for action, ownership', themes: ['innovation', 'leadership'] },
    { id: 's10', title: 'The Time I Introduced a Process Improvement', prompt: 'Identified an inefficiency and implemented a better approach.', power: 'Shows continuous improvement, systemic thinking', themes: ['innovation', 'teamwork'] },
  ]},
  { id: 'customer', label: 'Customer & User Impact', color: '#f472b6', count: '1–2', stories: [
    { id: 's11', title: 'The Time I Went Above and Beyond for a User', prompt: 'When you sacrificed short-term metrics for long-term customer satisfaction.', power: 'Shows user empathy, quality mindset', themes: ['customer', 'innovation'] },
  ]},
];

const THEME_COLORS: Record<string, string> = {
  conflict: '#f87171', failure: '#f97316', leadership: '#a78bfa', ambiguity: '#8b5cf6',
  deadline: '#fbbf24', teamwork: '#34d399', innovation: '#38bdf8', customer: '#f472b6',
};

const PRACTICE_WEEKS = [
  { week: 1, label: 'Mine Memory', desc: 'Write 10 raw stories from your past experiences' },
  { week: 2, label: 'Apply STAR', desc: 'Structure all stories using STAR format, build mapping matrix' },
  { week: 3, label: 'Practice Delivery', desc: 'Record yourself delivering each story, aim for 2–3 minutes each' },
  { week: 4, label: 'Mock Interview', desc: 'Practice with a friend or AI interviewer, get feedback' },
];

export default function StoryBankDiagram(): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState('tech-leadership');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [weeksDone, setWeeksDone] = useState<Record<number, boolean>>({});

  const toggle = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }));
  const toggleWeek = (w: number) => setWeeksDone(d => ({ ...d, [w]: !d[w] }));

  const allStories = CATEGORIES.flatMap(c => c.stories);
  const totalChecked = allStories.filter(s => checked[s.id]).length;
  const pct = Math.round((totalChecked / allStories.length) * 100);

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .sb-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Story Bank Builder ({totalChecked}/{allStories.length} stories prepared)</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Progress bar */}
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#38bdf8', transition: 'width 0.4s ease', borderRadius: '3px' }}/>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => {
            const catChecked = cat.stories.filter(s => checked[s.id]).length;
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: isActive ? `${cat.color}18` : 'rgba(255,255,255,0.04)', color: isActive ? cat.color : 'var(--ifm-color-content-secondary)', boxShadow: isActive ? `0 0 0 1.5px ${cat.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
                {cat.label} ({catChecked}/{cat.stories.length})
              </button>
            );
          })}
        </div>

        {/* Story checklist + theme coverage */}
        <div className="sb-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeCat && (
              <>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  Recommended: {activeCat.count} stories for <span style={{ color: activeCat.color, fontWeight: 600 }}>{activeCat.label}</span>
                </div>
                {activeCat.stories.map(story => {
                  const isDone = !!checked[story.id];
                  return (
                    <div key={story.id} onClick={() => toggle(story.id)}
                      style={{ display: 'flex', gap: '10px', padding: '12px', borderRadius: '8px', cursor: 'pointer', background: isDone ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isDone ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.2s ease' }}>
                      <span style={{ fontSize: '14px', color: isDone ? '#34d399' : 'var(--ifm-color-content-secondary)', flexShrink: 0 }}>{isDone ? '✓' : '○'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', textDecoration: isDone ? 'line-through' : 'none', marginBottom: '3px' }}>{story.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '6px' }}>{story.prompt}</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {story.themes.map(theme => (
                            <code key={theme} style={{ fontSize: '9px', background: `${THEME_COLORS[theme] || '#38bdf8'}18`, color: THEME_COLORS[theme] || '#38bdf8', border: `1px solid ${THEME_COLORS[theme] || '#38bdf8'}30`, borderRadius: '3px', padding: '1px 5px' }}>{theme}</code>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Practice schedule */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '10px' }}>Practice Schedule</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PRACTICE_WEEKS.map(pw => {
                const isDone = !!weeksDone[pw.week];
                return (
                  <div key={pw.week} onClick={() => toggleWeek(pw.week)}
                    style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px', borderRadius: '7px', cursor: 'pointer', background: isDone ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isDone ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s ease' }}>
                    <span style={{ fontSize: '12px', color: isDone ? '#34d399' : 'var(--ifm-color-content-secondary)', flexShrink: 0 }}>{isDone ? '✓' : '○'}</span>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: isDone ? '#34d399' : '#38bdf8' }}>Week {pw.week}: {pw.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, marginTop: '2px' }}>{pw.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
