import React, { useState, useEffect } from 'react';
import { leetcodeProblems, LeetCodeProblem } from '../../data/leetcode-problems';
import dailyProblemData from '../../data/leetcode-daily-problem.json';

export default function LeetCodeDaily(): React.JSX.Element {
  const [dailyProblem, setDailyProblem] = useState<LeetCodeProblem | null>(null);
  const [randomProblem, setRandomProblem] = useState<LeetCodeProblem | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [topicRandomProblem, setTopicRandomProblem] = useState<LeetCodeProblem | null>(null);
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    setDailyProblem(dailyProblemData as LeetCodeProblem);

    if (leetcodeProblems.length === 0) return;

    const randomIdx = Math.floor(Math.random() * leetcodeProblems.length);
    setRandomProblem(leetcodeProblems[randomIdx]);

    const uniqueTopics = Array.from(new Set(leetcodeProblems.map((p) => p.topic))).sort();
    setTopics(uniqueTopics);
    if (uniqueTopics.length > 0) {
      setSelectedTopic(uniqueTopics[0]);
      const filtered = leetcodeProblems.filter((p) => p.topic === uniqueTopics[0]);
      if (filtered.length > 0) {
        setTopicRandomProblem(filtered[Math.floor(Math.random() * filtered.length)]);
      }
    }
  }, []);

  const handlePickRandomGlobal = () => {
    if (leetcodeProblems.length === 0) return;
    const randomIdx = Math.floor(Math.random() * leetcodeProblems.length);
    setRandomProblem(leetcodeProblems[randomIdx]);
  };

  const handlePickRandomTopic = () => {
    if (!selectedTopic) return;
    const filtered = leetcodeProblems.filter((p) => p.topic === selectedTopic);
    if (filtered.length === 0) return;
    const randomIdx = Math.floor(Math.random() * filtered.length);
    setTopicRandomProblem(filtered[randomIdx]);
  };

  if (leetcodeProblems.length === 0) {
    return (
      <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', padding: '2rem', textAlign: 'center' }}>
        <div className="interactive-diagram-helper-text">Loading LeetCode challenges...</div>
      </div>
    );
  }

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`@media (max-width: 768px) { .lc-grid { grid-template-columns: 1fr !important; } }`}</style>
      
      {/* ── 1. Standard Diagram Header Bar (DESIGNS.md compliant) ── */}
      <div className="interactive-diagram-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>

        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          LeetCode Daily Challenge & Topic Explorer
        </span>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '9999px',
            background: 'rgba(249, 115, 22, 0.12)',
            color: '#f97316',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            marginLeft: '6px',
          }}
        >
          {leetcodeProblems.length} Curated Problems
        </span>

        <a
          href="https://leetcode.com/problemset/all/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto',
            padding: '5px 12px',
            borderRadius: '7px',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            fontWeight: 600,
            fontSize: '11.5px',
            background: 'rgba(249, 115, 22, 0.12)',
            color: '#f97316',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          LeetCode Official ↗
        </a>
      </div>

      {/* ── 2. Featured Problem of the Day ── */}
      {dailyProblem && (
        <div
          className="interactive-diagram-details-card details-yellow"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '1.25rem',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                ⭐ Problem of the Day
              </span>

              <span
                style={{
                  fontFamily: 'var(--ifm-font-family-monospace, monospace)',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--ifm-color-content-secondary)',
                }}
              >
                #{dailyProblem.id}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                {dailyProblem.topic}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background:
                    dailyProblem.difficulty === 'easy'
                      ? 'rgba(52, 211, 153, 0.12)'
                      : dailyProblem.difficulty === 'hard'
                      ? 'rgba(248, 113, 113, 0.12)'
                      : 'rgba(251, 191, 36, 0.12)',
                  color:
                    dailyProblem.difficulty === 'easy'
                      ? '#34d399'
                      : dailyProblem.difficulty === 'hard'
                      ? '#f87171'
                      : '#fbbf24',
                  border:
                    dailyProblem.difficulty === 'easy'
                      ? '1px solid rgba(52, 211, 153, 0.3)'
                      : dailyProblem.difficulty === 'hard'
                      ? '1px solid rgba(248, 113, 113, 0.3)'
                      : '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                {dailyProblem.difficulty === 'easy'
                  ? '🟢 Easy'
                  : dailyProblem.difficulty === 'hard'
                  ? '🔴 Hard'
                  : '🟡 Medium'}
              </span>
            </div>

            <a
              href={dailyProblem.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                background: '#f97316',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Solve on LeetCode 🚀
            </a>
          </div>

          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
            {dailyProblem.title}
          </div>

          <div
            style={{
              background: 'rgba(251, 191, 36, 0.06)',
              borderLeft: '3px solid #fbbf24',
              borderRadius: '0 8px 8px 0',
              padding: '10px 14px',
              fontSize: '12.5px',
              lineHeight: 1.5,
              color: 'var(--ifm-color-content)',
            }}
          >
            <strong style={{ color: '#fbbf24' }}>Key Algorithmic Strategy: </strong>
            <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{dailyProblem.keyIdea}</span>
          </div>
        </div>
      )}

      {/* ── 3. Split-Pane: Random Global Challenge & Topic Explorer ── */}
      <div className="lc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
        {/* Random Global Challenge Card */}
        <div
          className="interactive-diagram-details-card details-blue"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '1.25rem',
            borderRadius: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                🔀 Random Global Challenge
              </span>
              <button
                onClick={handlePickRandomGlobal}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--ifm-color-content)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Next Random 🔀
              </button>
            </div>

            {randomProblem && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--ifm-font-family-monospace, monospace)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--ifm-color-content-secondary)',
                    }}
                  >
                    #{randomProblem.id}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                    {randomProblem.topic}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color:
                        randomProblem.difficulty === 'easy'
                          ? '#34d399'
                          : randomProblem.difficulty === 'hard'
                          ? '#f87171'
                          : '#fbbf24',
                    }}
                  >
                    {randomProblem.difficulty === 'easy' ? '🟢 Easy' : randomProblem.difficulty === 'hard' ? '🔴 Hard' : '🟡 Medium'}
                  </span>
                </div>

                <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
                  {randomProblem.title}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--ifm-color-content)' }}>Key Idea:</strong> {randomProblem.keyIdea}
                </div>
              </>
            )}
          </div>

          {randomProblem && (
            <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <a
                href={randomProblem.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Solve on LeetCode ↗
              </a>
            </div>
          )}
        </div>

        {/* Topic Explorer Card */}
        <div
          className="interactive-diagram-details-card details-purple"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '1.25rem',
            borderRadius: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>
                🏷️ Topic Explorer
              </span>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select
                  value={selectedTopic}
                  onChange={(e) => {
                    setSelectedTopic(e.target.value);
                    const filtered = leetcodeProblems.filter((p) => p.topic === e.target.value);
                    if (filtered.length > 0) {
                      setTopicRandomProblem(filtered[Math.floor(Math.random() * filtered.length)]);
                    }
                  }}
                  style={{
                    background: '#090b14',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--ifm-color-content)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handlePickRandomTopic}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    background: 'rgba(168, 85, 247, 0.12)',
                    color: '#a855f7',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Pick 🎯
                </button>
              </div>
            </div>

            {topicRandomProblem && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--ifm-font-family-monospace, monospace)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--ifm-color-content-secondary)',
                    }}
                  >
                    #{topicRandomProblem.id}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
                    {topicRandomProblem.topic}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color:
                        topicRandomProblem.difficulty === 'easy'
                          ? '#34d399'
                          : topicRandomProblem.difficulty === 'hard'
                          ? '#f87171'
                          : '#fbbf24',
                    }}
                  >
                    {topicRandomProblem.difficulty === 'easy' ? '🟢 Easy' : topicRandomProblem.difficulty === 'hard' ? '🔴 Hard' : '🟡 Medium'}
                  </span>
                </div>

                <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
                  {topicRandomProblem.title}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--ifm-color-content)' }}>Key Idea:</strong> {topicRandomProblem.keyIdea}
                </div>
              </>
            )}
          </div>

          {topicRandomProblem && (
            <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <a
                href={topicRandomProblem.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  color: '#a855f7',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Solve on LeetCode ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
