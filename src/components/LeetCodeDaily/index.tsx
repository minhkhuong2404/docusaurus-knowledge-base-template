import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import { leetcodeProblems, LeetCodeProblem } from '../../data/leetcode-problems';
import dailyProblemData from '../../data/leetcode-daily-problem.json';

export default function LeetCodeDaily() {
  const [dailyProblem, setDailyProblem] = useState<LeetCodeProblem | null>(null);
  const [randomProblem, setRandomProblem] = useState<LeetCodeProblem | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [topicRandomProblem, setTopicRandomProblem] = useState<LeetCodeProblem | null>(null);
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    // Daily problem from fetched JSON
    setDailyProblem(dailyProblemData as LeetCodeProblem);

    if (leetcodeProblems.length === 0) return;

    // Initial random problem
    const randomIdx = Math.floor(Math.random() * leetcodeProblems.length);
    setRandomProblem(leetcodeProblems[randomIdx]);

    // Unique topics list
    const uniqueTopics = Array.from(new Set(leetcodeProblems.map(p => p.topic))).sort();
    setTopics(uniqueTopics);
    if (uniqueTopics.length > 0) {
      setSelectedTopic(uniqueTopics[0]);
      // Initial random from first topic
      const filtered = leetcodeProblems.filter(p => p.topic === uniqueTopics[0]);
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
    const filtered = leetcodeProblems.filter(p => p.topic === selectedTopic);
    if (filtered.length === 0) return;
    const randomIdx = Math.floor(Math.random() * filtered.length);
    setTopicRandomProblem(filtered[randomIdx]);
  };

  if (leetcodeProblems.length === 0) {
    return <div className={styles.container}>Loading LeetCode challenge data...</div>;
  }

  return (
    <div className={styles.container}>
      {/* 📅 SECTION 1: Daily Problem */}
      {dailyProblem && (
        <div>
          <h3 className={styles.sectionTitle}>📅 LeetCode Problem of the Day</h3>
          <div className={styles.card}>
            <div className={styles.metaRow}>
              <span className={`${styles.badge} ${styles.topicBadge}`}>{dailyProblem.topic}</span>
              <span className={`${styles.badge} ${styles[dailyProblem.difficulty]}`}>
                {dailyProblem.difficulty === 'easy' && '🟢 Easy'}
                {dailyProblem.difficulty === 'medium' && '🟡 Medium'}
                {dailyProblem.difficulty === 'hard' && '🔴 Hard'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-700)' }}>
                Problem #{dailyProblem.id}
              </span>
            </div>
            <h4 className={styles.cardTitle}>{dailyProblem.title}</h4>
            <div className={styles.ideaBox}>
              <p className={styles.ideaText}>
                <strong>Key Strategy:</strong> {dailyProblem.keyIdea}
              </p>
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <a
                href={dailyProblem.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btn}
              >
                Solve on LeetCode 🚀
              </a>
            </div>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {/* 🔀 SECTION 2: Random Leetcode Problem */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h3 className={styles.sectionTitle}>🔀 Random Challenge</h3>
          <div className={styles.card} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {randomProblem && (
              <div>
                <div className={styles.metaRow}>
                  <span className={`${styles.badge} ${styles.topicBadge}`}>{randomProblem.topic}</span>
                  <span className={`${styles.badge} ${styles[randomProblem.difficulty]}`}>
                    {randomProblem.difficulty === 'easy' && '🟢 Easy'}
                    {randomProblem.difficulty === 'medium' && '🟡 Medium'}
                    {randomProblem.difficulty === 'hard' && '🔴 Hard'}
                  </span>
                </div>
                <h4 className={styles.cardTitle}>{randomProblem.title}</h4>
                <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-700)' }}>
                  <strong>Key Idea:</strong> {randomProblem.keyIdea}
                </p>
              </div>
            )}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              {randomProblem && (
                <a
                  href={randomProblem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btn}
                >
                  Solve 🚀
                </a>
              )}
              <button onClick={handlePickRandomGlobal} className={styles.btnOutline}>
                Next Random 🔀
              </button>
            </div>
          </div>
        </div>

        {/* 🎯 SECTION 3: Random from Selected Topic */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h3 className={styles.sectionTitle}>🎯 Topic Explorer</h3>
          <div className={styles.card} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className={styles.controlGroup}>
                <select
                  value={selectedTopic}
                  onChange={(e) => {
                    setSelectedTopic(e.target.value);
                    const filtered = leetcodeProblems.filter(p => p.topic === e.target.value);
                    if (filtered.length > 0) {
                      setTopicRandomProblem(filtered[Math.floor(Math.random() * filtered.length)]);
                    }
                  }}
                  className={styles.select}
                >
                  {topics.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button onClick={handlePickRandomTopic} className={styles.btnOutline} style={{ padding: '0.6rem 1rem' }}>
                  Pick Random 🎯
                </button>
              </div>

              {topicRandomProblem && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div className={styles.metaRow}>
                    <span className={`${styles.badge} ${styles[topicRandomProblem.difficulty]}`}>
                      {topicRandomProblem.difficulty === 'easy' && '🟢 Easy'}
                      {topicRandomProblem.difficulty === 'medium' && '🟡 Medium'}
                      {topicRandomProblem.difficulty === 'hard' && '🔴 Hard'}
                    </span>
                  </div>
                  <h4 className={styles.cardTitle}>{topicRandomProblem.title}</h4>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-700)' }}>
                    <strong>Key Idea:</strong> {topicRandomProblem.keyIdea}
                  </p>
                </div>
              )}
            </div>

            {topicRandomProblem && (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <a
                  href={topicRandomProblem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btn}
                >
                  Solve 🚀
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
