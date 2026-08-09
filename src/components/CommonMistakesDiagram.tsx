import React, { useState } from 'react';

const MISTAKES = [
  { id: 1, title: 'Answering Hypothetically', severity: 'critical', color: '#f87171',
    diagnosis: 'The question asks for a past experience, but the candidate answers with what they would do.',
    bad: '"If I had a conflict with a teammate, I would first try to understand their perspective and then have a one-on-one conversation to resolve it…"',
    whyFails: 'Behavioral interviews are built on the premise that past behavior predicts future behavior. Hypothetical answers give the interviewer nothing to evaluate.',
    fix: 'Before every answer, run a 2-second mental check: "Am I telling them about something that actually happened?" A real but imperfect story outperforms a polished hypothetical every time.'
  },
  { id: 2, title: 'Using "We" Instead of "I"', severity: 'critical', color: '#f87171',
    diagnosis: 'The candidate describes team efforts instead of their individual contribution.',
    bad: '"We identified the problem, we redesigned the system, and we shipped it on time."',
    whyFails: 'The interviewer is evaluating YOU, not your team. Amazon\'s Bar Raisers specifically probe this with: "What was YOUR specific role?"',
    fix: 'Force yourself to use "I" for every action step. Before: "We decided to migrate." After: "I proposed the migration, built the proof-of-concept, and presented the business case."'
  },
  { id: 3, title: 'No Quantified Result', severity: 'critical', color: '#f87171',
    diagnosis: 'The story ends without a concrete outcome.',
    bad: '"It went well and everyone was happy with the outcome."',
    whyFails: 'Without numbers, the interviewer can\'t assess impact. Every result should be measurable: %, $, time saved, users impacted.',
    fix: 'If you don\'t have a number, say: "We didn\'t measure this specifically, but the qualitative impact was X — and if I did it again, I would instrument Y from the start."'
  },
  { id: 4, title: 'Story Too Long (> 4 minutes)', severity: 'medium', color: '#fbbf24',
    diagnosis: 'The candidate gives unnecessary backstory and loses the interviewer\'s attention.',
    bad: 'A 6-minute monologue where the Situation alone takes 2 minutes.',
    whyFails: 'The interviewer needs to cover 2–4 behavioral signals in 45 minutes. A 6-minute answer steals time from follow-ups and additional questions.',
    fix: 'Situation: 30 seconds. Task: 15 seconds. Action: 90 seconds. Result: 30 seconds. Total: 2–3 minutes. Practice with a timer.'
  },
  { id: 5, title: 'Blaming Others', severity: 'critical', color: '#f87171',
    diagnosis: 'The candidate positions themselves as the victim or hero against an incompetent antagonist.',
    bad: '"My manager made a terrible decision and it cost us 3 months."',
    whyFails: 'Blaming signals poor self-awareness and political immaturity. Even if the other person was objectively wrong.',
    fix: 'Reframe: "The decision was made to proceed, and in retrospect, I wish I had pushed back more forcefully with data earlier in the process."'
  },
  { id: 6, title: 'No Structure (Stream of Consciousness)', severity: 'medium', color: '#fbbf24',
    diagnosis: 'The candidate tells the story non-linearly, jumping between context, actions, and results randomly.',
    bad: 'Starts with the result, then backtracks to the situation, then adds more actions as they remember them.',
    whyFails: 'The interviewer takes structured notes. If your answer is a stream of consciousness, the notes become incoherent.',
    fix: 'Announce your structure: "Let me set up the situation, then walk you through what I did, and share the result." Then follow STAR sequentially.'
  },
  { id: 7, title: 'Choosing the Wrong Story', severity: 'medium', color: '#fbbf24',
    diagnosis: 'The story doesn\'t actually answer the question being asked.',
    bad: 'Question asks about conflict, candidate tells a story about a hard deadline with no interpersonal friction.',
    whyFails: 'The interviewer is scoring a specific signal. Even a great story about the wrong topic scores zero.',
    fix: 'Pause 5 seconds after the question. Identify the signal being tested. Then select a story from your Story Bank that directly addresses that signal.'
  },
  { id: 8, title: 'Cliché Learning Statements', severity: 'medium', color: '#fbbf24',
    diagnosis: 'The lesson learned is generic and could apply to any story.',
    bad: '"I learned that communication is really important."',
    whyFails: 'Generic lessons signal shallow reflection. The interviewer has heard this exact phrase 500 times.',
    fix: 'Be specific: "I now require written documentation of every architectural decision before implementation, with explicit sign-off from all affected teams."'
  },
  { id: 9, title: 'Defensive Under Probing', severity: 'critical', color: '#f87171',
    diagnosis: 'When the interviewer asks follow-up questions, the candidate becomes defensive or dismissive.',
    bad: '"I already explained that." or "There wasn\'t really another option."',
    whyFails: 'Follow-ups are how interviewers test depth. Defensiveness signals fragile confidence and poor coachability.',
    fix: 'Treat every follow-up as an opportunity to show more depth. "Great question — to go deeper on that, what I was thinking was…"'
  },
  { id: 10, title: 'Saying "No Questions" at the End', severity: 'medium', color: '#fbbf24',
    diagnosis: 'When asked "Do you have any questions?" the candidate says no.',
    bad: '"No, I think we covered everything."',
    whyFails: 'This signals low curiosity and low interest in the role. It\'s also a missed opportunity to evaluate the company.',
    fix: 'Always prepare 3–5 thoughtful questions. Tailor by interviewer type: technical depth for engineers, culture for managers, strategy for VPs.'
  },
];

export default function CommonMistakesDiagram(): React.JSX.Element {
  const [activeMistake, setActiveMistake] = useState(1);

  const mistake = MISTAKES.find(m => m.id === activeMistake)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>10 Interview-Killing Mistakes</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Mistake quick-nav grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '16px' }}>
          {MISTAKES.map(m => {
            const isActive = activeMistake === m.id;
            return (
              <button key={m.id} onClick={() => setActiveMistake(m.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '8px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: isActive ? `${m.color}18` : 'rgba(255,255,255,0.03)', boxShadow: isActive ? `0 0 0 1.5px ${m.color}50` : '0 0 0 1px rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: m.color }}>#{m.id}</span>
                <span style={{ fontSize: '8px', color: isActive ? m.color : 'var(--ifm-color-content-secondary)', textAlign: 'center', lineHeight: 1.3, fontWeight: isActive ? 600 : 400 }}>{m.title}</span>
              </button>
            );
          })}
        </div>

        {/* Mistake detail card */}
        <div style={{ padding: '18px', borderRadius: '12px', background: `${mistake.color}08`, border: `1px solid ${mistake.color}20` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: mistake.color }}>#{mistake.id}</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: mistake.color }}>{mistake.title}</span>
            <code style={{ fontSize: '10px', marginLeft: 'auto', background: mistake.severity === 'critical' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)', color: mistake.severity === 'critical' ? '#f87171' : '#fbbf24', border: `1px solid ${mistake.severity === 'critical' ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'}`, borderRadius: '4px', padding: '2px 8px', fontWeight: 700 }}>
              {mistake.severity === 'critical' ? 'CRITICAL' : 'MEDIUM'}
            </code>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>{mistake.diagnosis}</div>

          {/* Bad example */}
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12px', color: '#f87171', flexShrink: 0 }}>✗</span>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#f87171', marginBottom: '3px' }}>Bad Example</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>{mistake.bad}</div>
              </div>
            </div>
          </div>

          {/* Why it fails */}
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', marginBottom: '3px' }}>Why It Fails</div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>{mistake.whyFails}</div>
          </div>

          {/* Fix */}
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12px', color: '#34d399', flexShrink: 0 }}>✓</span>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', marginBottom: '3px' }}>The Fix</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>{mistake.fix}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
