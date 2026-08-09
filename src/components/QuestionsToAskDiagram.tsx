import React, { useState } from 'react';

type InterviewerType = 'all' | 'manager' | 'engineer' | 'recruiter' | 'vp';
type CategoryType = 'all' | 'culture' | 'technical' | 'vision' | 'process';

interface QuestionItem {
  id: number;
  q: string;
  interviewer: 'manager' | 'engineer' | 'recruiter' | 'vp';
  cat: 'culture' | 'technical' | 'vision' | 'process';
  why: string;
  signal: string;
}

const QUESTIONS: QuestionItem[] = [
  { id: 1, q: "What does the team's biggest challenge look like right now, and how are you addressing it?", interviewer: 'manager', cat: 'culture', why: 'Tests how honest they are. A good manager will share real challenges.', signal: 'Transparency, current pain points' },
  { id: 2, q: "What do the best engineers on this team do that makes them stand out?", interviewer: 'manager', cat: 'culture', why: 'Reveals what the team actually values vs. what is in the job description.', signal: 'Team values, expectations' },
  { id: 3, q: "How does the team handle technical disagreements? Can you give me a recent example?", interviewer: 'manager', cat: 'culture', why: 'Tells you whether debate is encouraged or suppressed.', signal: 'Team psychology, psychological safety' },
  { id: 4, q: "What's the on-call culture like? How many incidents per month does the team handle?", interviewer: 'engineer', cat: 'technical', why: 'Critical for work-life balance. Real numbers reveal reality.', signal: 'Operational health, toil level' },
  { id: 5, q: "How does the team balance new feature work vs. technical debt?", interviewer: 'engineer', cat: 'technical', why: 'Tells you engineering maturity and whether quality is valued.', signal: 'Codebase health, engineering discipline' },
  { id: 6, q: "What is the testing and deployment pipeline like? How long from commit to production?", interviewer: 'engineer', cat: 'technical', why: 'Developer velocity and CI/CD maturity.', signal: 'DevOps maturity, shipping velocity' },
  { id: 7, q: "What does success look like for this role in the first 90 days?", interviewer: 'manager', cat: 'process', why: 'Shows focus on immediate value delivery and clear goal setting.', signal: 'Role clarity, onboarding support' },
  { id: 8, q: "What is the team's 1-year and 3-year strategic roadmap?", interviewer: 'vp', cat: 'vision', why: 'Demonstrates high-level business alignment and interest in long-term impact.', signal: 'Strategic thinking, business acumen' },
  { id: 9, q: "What is the biggest risk to the company/product over the next 12 months?", interviewer: 'vp', cat: 'vision', why: 'Shows executive-level awareness and analytical thinking.', signal: 'Market awareness, strategic alignment' },
  { id: 10, q: "What's the promotion process like for engineers on this team?", interviewer: 'recruiter', cat: 'process', why: 'Clarifies career growth frameworks without sounding entitled.', signal: 'Growth clarity, org structure' },
  { id: 11, q: "What made you join this company, and what keeps you here?", interviewer: 'recruiter', cat: 'culture', why: 'Personal perspective that builds rapport and reveals retention drivers.', signal: 'Company culture, employee morale' },
  { id: 12, q: "How are decisions made when product management and engineering disagree?", interviewer: 'vp', cat: 'culture', why: 'Reveals organizational balance of power between product and engineering.', signal: 'Cross-functional dynamic' },
];

const INTERVIEWER_TYPES: { id: InterviewerType; label: string; color: string }[] = [
  { id: 'all', label: 'All Roles', color: '#38bdf8' },
  { id: 'manager', label: 'Engineering Manager', color: '#34d399' },
  { id: 'engineer', label: 'Senior Engineer', color: '#a78bfa' },
  { id: 'vp', label: 'Director / VP', color: '#fbbf24' },
  { id: 'recruiter', label: 'Recruiter', color: '#f472b6' },
];

const CATEGORIES: { id: CategoryType; label: string; color: string }[] = [
  { id: 'all', label: 'All Categories', color: '#38bdf8' },
  { id: 'culture', label: 'Culture & Team', color: '#34d399' },
  { id: 'technical', label: 'Technical & Architecture', color: '#a78bfa' },
  { id: 'vision', label: 'Vision & Strategy', color: '#fbbf24' },
  { id: 'process', label: 'Process & Onboarding', color: '#2dd4bf' },
];

export default function QuestionsToAskDiagram(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [activeInterviewer, setActiveInterviewer] = useState<InterviewerType>('all');
  const [activeCat, setActiveCat] = useState<CategoryType>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = QUESTIONS.filter(item => {
    const matchesInterviewer = activeInterviewer === 'all' || item.interviewer === activeInterviewer;
    const matchesCat = activeCat === 'all' || item.cat === activeCat;
    const matchesSearch = search === '' || item.q.toLowerCase().includes(search.toLowerCase()) || item.why.toLowerCase().includes(search.toLowerCase());
    return matchesInterviewer && matchesCat && matchesSearch;
  });

  const selItem = QUESTIONS.find(q => q.id === selectedId);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .qta-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Smart Questions to Ask ({filtered.length})</span>
        <input type="text" placeholder="Search questions…" value={search} onChange={e => { setSearch(e.target.value); setSelectedId(null); }}
          style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)', fontSize: '12px', outline: 'none', width: '150px' }}/>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontWeight: 600, width: '70px' }}>Interviewer:</span>
            {INTERVIEWER_TYPES.map(t => (
              <button key={t.id} onClick={() => { setActiveInterviewer(t.id); setSelectedId(null); }}
                style={{ padding: '4px 9px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: activeInterviewer === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeInterviewer === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeInterviewer === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontWeight: 600, width: '70px' }}>Category:</span>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => { setActiveCat(c.id); setSelectedId(null); }}
                style={{ padding: '4px 9px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: activeCat === c.id ? `${c.color}18` : 'rgba(255,255,255,0.04)', color: activeCat === c.id ? c.color : 'var(--ifm-color-content-secondary)', boxShadow: activeCat === c.id ? `0 0 0 1.5px ${c.color}50` : '0 0 0 1px rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content grid */}
        <div className="qta-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
            {filtered.map(item => {
              const isActive = selectedId === item.id;
              const intObj = INTERVIEWER_TYPES.find(t => t.id === item.interviewer);
              const color = intObj?.color || '#2dd4bf';
              return (
                <button key={item.id} onClick={() => setSelectedId(isActive ? null : item.id)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', background: isActive ? `${color}15` : 'rgba(255,255,255,0.03)', boxShadow: isActive ? `0 0 0 1.5px ${color}50` : '0 0 0 1px rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)', lineHeight: 1.4, marginBottom: '4px' }}>"{item.q}"</div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <code style={{ fontSize: '9px', background: `${color}18`, color, border: `1px solid ${color}30`, borderRadius: '4px', padding: '1px 5px' }}>{intObj?.label}</code>
                    <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>● {item.cat}</span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '12px' }}>No questions match filters</div>
            )}
          </div>

          <div className="interactive-diagram-details-card" style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: selItem ? 'flex-start' : 'center' }}>
            {selItem ? (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '8px', lineHeight: 1.4 }}>"{selItem.q}"</div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  <code style={{ fontSize: '10px', background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)', borderRadius: '4px', padding: '2px 6px' }}>Target: {INTERVIEWER_TYPES.find(t => t.id === selItem.interviewer)?.label}</code>
                  <code style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', color: 'var(--ifm-color-content-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 6px' }}>{selItem.cat}</code>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>Why Ask This?</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>{selItem.why}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Signal Sent</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>{selItem.signal}</div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click any question to inspect rationale and signals</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
