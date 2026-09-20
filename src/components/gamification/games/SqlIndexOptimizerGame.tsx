import React, { useState, useMemo } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { arcadeAudio } from '../../../utils/arcadeAudio';
import { SQL_OPTIMIZER_SCENARIOS, SqlOptimizerScenario, SqlTuningStrategy } from '../../../data/sqlOptimizerScenariosData';
import { Highlight, Prism } from 'prism-react-renderer';
import prismTheme from '../../../theme/prismTheme';

export default function SqlIndexOptimizerGame(): React.JSX.Element {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Junior' | 'Mid' | 'Senior' | 'Staff'>('all');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SQL_OPTIMIZER_SCENARIOS[0].id);
  const [chosenStrategyId, setChosenStrategyId] = useState<string | null>(null);
  const [hoveredStrategyId, setHoveredStrategyId] = useState<string | null>(null);
  const [activePlanTab, setActivePlanTab] = useState<'explain' | 'btree'>('explain');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [feedbackState, setFeedbackState] = useState<{ isOptimal: boolean; strategy: SqlTuningStrategy } | null>(null);

  // Solved tracking in localStorage
  const [solvedIds, setSolvedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('sql_optimizer_solved_challenges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markScenarioSolved = (id: string) => {
    setSolvedIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('sql_optimizer_solved_challenges', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const filteredScenarios = useMemo(() => {
    if (selectedDifficulty === 'all') return SQL_OPTIMIZER_SCENARIOS;
    return SQL_OPTIMIZER_SCENARIOS.filter((s) => s.difficulty === selectedDifficulty);
  }, [selectedDifficulty]);

  const currentScenario =
    filteredScenarios.find((s) => s.id === selectedScenarioId) ||
    filteredScenarios[0] ||
    SQL_OPTIMIZER_SCENARIOS[0];

  const handleSelectScenario = (id: string) => {
    arcadeAudio.playFlip();
    setSelectedScenarioId(id);
    setChosenStrategyId(null);
    setFeedbackState(null);
    setIsSimulating(false);
  };

  const handleSelectDifficulty = (diff: 'all' | 'Junior' | 'Mid' | 'Senior' | 'Staff') => {
    arcadeAudio.playBlip();
    setSelectedDifficulty(diff);
    const match = SQL_OPTIMIZER_SCENARIOS.find((s) => diff === 'all' || s.difficulty === diff);
    if (match) {
      setSelectedScenarioId(match.id);
      setChosenStrategyId(null);
      setFeedbackState(null);
    }
  };

  const handleChooseStrategy = (strat: SqlTuningStrategy) => {
    if (isSimulating) return;
    arcadeAudio.playLaser();
    setChosenStrategyId(strat.id);
    setIsSimulating(true);
    setFeedbackState(null);

    setTimeout(() => {
      setIsSimulating(false);
      setFeedbackState({ isOptimal: strat.isOptimal, strategy: strat });

      if (strat.isOptimal) {
        arcadeAudio.playVictory();
        markScenarioSolved(currentScenario.id);
        const earnedScore = (solvedIds.length + 1) * 150;
        addExp(60, `Optimized SQL Query: ${currentScenario.title}`);
        saveMiniGameScore('sql_optimizer', earnedScore);
        unlockAchievement('topic_database_sql');
        triggerFireworks(2500);
      } else {
        arcadeAudio.playError();
      }
    }, 800);
  };

  const costReductionPercent = useMemo(() => {
    if (!feedbackState) return 0;
    const initial = currentScenario.initialCost;
    const resulting = feedbackState.strategy.resultingCost;
    return Math.max(0, +(((initial - resulting) / initial) * 100).toFixed(1));
  }, [feedbackState, currentScenario]);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '22px',
        color: '#f8fafc',
      }}
    >
      {/* ── 1. Header Bar ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={currentScenario.id}
            onChange={(e) => handleSelectScenario(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#0f172a',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.82rem',
              fontWeight: 800,
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '340px',
            }}
          >
            {filteredScenarios.map((s, idx) => (
              <option key={s.id} value={s.id}>
                {solvedIds.includes(s.id) ? '✓ ' : ''}{idx + 1}. {s.title} ({s.difficulty})
              </option>
            ))}
          </select>

          {/* Difficulty Filter Pills */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['all', 'Junior', 'Mid', 'Senior', 'Staff'] as const).map((diff) => {
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => handleSelectDifficulty(diff)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isSelected ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: isSelected ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.74rem',
                    fontWeight: 750,
                    cursor: 'pointer',
                  }}
                >
                  {diff === 'all' ? 'All' : diff}
                </button>
              );
            })}
          </div>

          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {currentScenario.categoryLabel}
          </span>
        </div>

        <div style={{ padding: '5px 12px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '0.76rem', fontWeight: 800 }}>
          🏆 {solvedIds.length} / {SQL_OPTIMIZER_SCENARIOS.length} Scenarios Optimized
        </div>
      </div>

      {/* ── 2. Table Footprint & Business Context ── */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>{currentScenario.title}</span>
          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700 }}>
            🗄️ Table: {currentScenario.tableName} ({currentScenario.rowCount} • {currentScenario.tableSizeDisk})
          </span>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.45 }}>
          {currentScenario.businessContext}
        </div>
      </div>

      {/* ── 3. Slow SQL Query Syntax View ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
          Slow Production SQL Query:
        </div>
        <Highlight
          theme={prismTheme}
          code={currentScenario.slowQuery.trim()}
          language="sql"
          prism={Prism}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={className}
              style={{
                ...style,
                background: '#070a12',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px 14px',
                fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.82rem',
                lineHeight: 1.45,
                margin: 0,
                overflowX: 'auto',
              }}
            >
              {tokens.map((line, i) => (
                <div {...getLineProps({ line, key: i })} key={i}>
                  {line.map((token, key) => (
                    <span {...getTokenProps({ token, key })} key={key} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>

      {/* ── 4. Visual Execution Plan / B-Tree Simulator Tabs ── */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                arcadeAudio.playBlip();
                setActivePlanTab('explain');
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: activePlanTab === 'explain' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${activePlanTab === 'explain' ? '#34d399' : 'rgba(255, 255, 255, 0.1)'}`,
                color: activePlanTab === 'explain' ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ⚡ EXPLAIN ANALYZE Comparison
            </button>
            <button
              type="button"
              onClick={() => {
                arcadeAudio.playBlip();
                setActivePlanTab('btree');
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: activePlanTab === 'btree' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${activePlanTab === 'btree' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                color: activePlanTab === 'btree' ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              🌳 B-Tree vs Disk Scan Simulator
            </button>
          </div>

          {feedbackState && (
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: feedbackState.isOptimal ? '#34d399' : '#f87171' }}>
              {feedbackState.isOptimal ? `📉 -${costReductionPercent}% Cost Reduction!` : '⚠️ Cost Inefficient'}
            </span>
          )}
        </div>

        {/* TAB A: EXPLAIN Plan Tree */}
        {activePlanTab === 'explain' && (
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#0a0d16',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Left: Initial Unoptimized Plan */}
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Current Unoptimized Plan
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f87171' }}>
                  {currentScenario.initialCost.toLocaleString()} Cost
                </div>
                <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0' }}>
                  Execution Latency: <strong>{currentScenario.initialLatencyMs} ms</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#fca5a5', fontFamily: 'monospace', lineHeight: 1.4 }}>
                  {currentScenario.initialPlanSummary}
                </div>
              </div>

              {/* Right: Post-Tuning Plan */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: !feedbackState
                    ? 'rgba(255, 255, 255, 0.02)'
                    : feedbackState.isOptimal
                    ? 'rgba(52, 211, 153, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${
                    !feedbackState
                      ? 'rgba(255, 255, 255, 0.06)'
                      : feedbackState.isOptimal
                      ? 'rgba(52, 211, 153, 0.35)'
                      : 'rgba(245, 158, 11, 0.35)'
                  }`,
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: !feedbackState ? 'rgba(255, 255, 255, 0.4)' : feedbackState.isOptimal ? '#34d399' : '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Tuned Strategy Output {!feedbackState && '(Select Strategy Below)'}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: !feedbackState ? 'rgba(255, 255, 255, 0.3)' : feedbackState.isOptimal ? '#34d399' : '#fbbf24' }}>
                  {feedbackState ? `${feedbackState.strategy.resultingCost.toLocaleString()} Cost` : '---'}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0' }}>
                  Execution Latency: <strong>{feedbackState ? `${feedbackState.strategy.resultingLatencyMs} ms` : '---'}</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: feedbackState?.isOptimal ? '#86efac' : '#fde68a', fontFamily: 'monospace', lineHeight: 1.4 }}>
                  {feedbackState?.strategy.executionPlanSummary || 'Choose an index strategy to run EXPLAIN ANALYZE.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB B: B-Tree Traversal vs Disk Scan SVG */}
        {activePlanTab === 'btree' && (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#0a0d16',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '10px' }}>
              B-Tree O(log N) Direct Pointer Seek vs O(N) Sequential Table Scan
            </div>

            <svg viewBox="0 0 600 140" style={{ width: '100%', maxHeight: '140px' }}>
              {/* Sequential Scan Flow */}
              <rect x="20" y="20" width="220" height="40" rx="8" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1.5" />
              <text x="130" y="44" fill="#fca5a5" fontSize="11" fontWeight="bold" textAnchor="middle">
                Disk Full Table Scan (15,000,000 Rows)
              </text>
              <line x1="20" y1="70" x2="240" y2="70" stroke="#ef4444" strokeDasharray="4 4" strokeWidth="2" />
              <text x="130" y="90" fill="rgba(255, 255, 255, 0.5)" fontSize="10" textAnchor="middle">
                High I/O: Reads 4.8 GB of 8KB OS Blocks into RAM
              </text>

              {/* Arrow */}
              <text x="270" y="65" fill="rgba(255, 255, 255, 0.4)" fontSize="16" fontWeight="bold">
                VS
              </text>

              {/* B-Tree Seek Flow */}
              <rect x="320" y="15" width="80" height="24" rx="6" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" strokeWidth="1.5" />
              <text x="360" y="31" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">
                Root Page
              </text>

              <line x1="360" y1="40" x2="430" y2="55" stroke="#34d399" strokeWidth="1.5" />

              <rect x="400" y="55" width="90" height="24" rx="6" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" strokeWidth="1.5" />
              <text x="445" y="71" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">
                Branch Node
              </text>

              <line x1="445" y1="80" x2="520" y2="95" stroke="#34d399" strokeWidth="1.5" />

              <rect x="490" y="95" width="100" height="28" rx="6" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="540" y="113" fill="#bae6fd" fontSize="10" fontWeight="bold" textAnchor="middle">
                Leaf Tuple (0.8ms)
              </text>
            </svg>
            <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '6px' }}>
              A 3-level B-Tree index visits only 3 pages (24 KB) to locate records instead of reading millions of rows from storage!
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Indexing & Tuning Strategies Bank ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
          Select Indexing / Query Rewrite Strategy:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          {currentScenario.strategies.map((strat) => {
            const isChosen = chosenStrategyId === strat.id;
            const isHovered = hoveredStrategyId === strat.id && !isChosen;

            return (
              <div
                key={strat.id}
                onMouseEnter={() => setHoveredStrategyId(strat.id)}
                onMouseLeave={() => setHoveredStrategyId(null)}
                onClick={() => handleChooseStrategy(strat)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isChosen
                    ? strat.isOptimal
                      ? 'rgba(52, 211, 153, 0.18)'
                      : 'rgba(239, 68, 68, 0.18)'
                    : isHovered
                    ? 'rgba(56, 189, 248, 0.12)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isChosen
                    ? strat.isOptimal
                      ? '1.5px solid #34d399'
                      : '1.5px solid #ef4444'
                    : isHovered
                    ? '1.5px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: isSimulating ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isHovered ? '0 4px 14px rgba(56, 189, 248, 0.25)' : 'none',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  {strat.title}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: isChosen ? '#ffffff' : '#38bdf8', background: 'rgba(0, 0, 0, 0.3)', padding: '4px 6px', borderRadius: '4px', marginBottom: '6px', overflowX: 'auto' }}>
                  {strat.sqlCommand}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Click to execute EXPLAIN ANALYZE ➔
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. Engine Diagnostic Feedback ── */}
      {feedbackState && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '10px',
            background: feedbackState.isOptimal ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1.5px solid ${feedbackState.isOptimal ? '#34d399' : '#ef4444'}`,
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: feedbackState.isOptimal ? '#34d399' : '#fca5a5', marginBottom: '4px' }}>
            {feedbackState.isOptimal ? '✅ Query Optimized Successfully!' : '❌ Inefficient Database Strategy!'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.45 }}>
            {feedbackState.strategy.engineExplanation}
          </div>
        </div>
      )}

      {/* ── 7. Architectural Takeaway ── */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(251, 191, 36, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          fontSize: '0.8rem',
          color: '#fef3c7',
          lineHeight: 1.45,
        }}
      >
        <strong>🎓 Senior Database Takeaway:</strong> {currentScenario.keyTakeaway}
      </div>
    </div>
  );
}
