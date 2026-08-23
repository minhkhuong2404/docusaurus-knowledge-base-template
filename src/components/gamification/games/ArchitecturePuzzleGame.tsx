import React, { useState, useMemo } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { SYSTEM_DESIGN_PUZZLES, PuzzleScenario } from '../../../data/systemDesignPuzzlesData';

export { PuzzleScenario, SYSTEM_DESIGN_PUZZLES };

export default function ArchitecturePuzzleGame() {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'big_tech' | 'real_time' | 'fintech' | 'distributed'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Medium' | 'Hard' | 'Staff+'>('all');
  const [activeScenarioId, setActiveScenarioId] = useState<string>(SYSTEM_DESIGN_PUZZLES[0].id);
  const [selectedSequence, setSelectedSequence] = useState<string[]>([]);
  const [simulationState, setSimulationState] = useState<'idle' | 'success' | 'failed'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Hover states for nodes
  const [hoveredBankNodeId, setHoveredBankNodeId] = useState<string | null>(null);
  const [hoveredSeqNodeId, setHoveredSeqNodeId] = useState<string | null>(null);

  const [solvedScenarios, setSolvedScenarios] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('system_design_solved_puzzles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markScenarioSolved = (scenarioId: string) => {
    setSolvedScenarios((prev) => {
      if (prev.includes(scenarioId)) return prev;
      const updated = [...prev, scenarioId];
      try {
        localStorage.setItem('system_design_solved_puzzles', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const filteredScenarios = useMemo(() => {
    return SYSTEM_DESIGN_PUZZLES.filter((s) => {
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'all' || s.difficulty === selectedDifficulty;
      return matchCat && matchDiff;
    });
  }, [selectedCategory, selectedDifficulty]);

  const activeScenario =
    SYSTEM_DESIGN_PUZZLES.find((s) => s.id === activeScenarioId) ||
    filteredScenarios[0] ||
    SYSTEM_DESIGN_PUZZLES[0];

  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    setSelectedSequence([]);
    setSimulationState('idle');
    setFeedbackMessage('');
  };

  const handleAddNode = (nodeId: string) => {
    if (selectedSequence.includes(nodeId)) return;
    setSelectedSequence([...selectedSequence, nodeId]);
    setSimulationState('idle');
    setFeedbackMessage('');
  };

  const handleRemoveNode = (nodeId: string) => {
    setSelectedSequence(selectedSequence.filter((id) => id !== nodeId));
    setSimulationState('idle');
    setFeedbackMessage('');
  };

  const handleMoveNode = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedSequence.length) return;
    const newSeq = [...selectedSequence];
    const temp = newSeq[targetIdx];
    newSeq[targetIdx] = newSeq[index];
    newSeq[index] = temp;
    setSelectedSequence(newSeq);
    setSimulationState('idle');
  };

  const handleClear = () => {
    setSelectedSequence([]);
    setSimulationState('idle');
    setFeedbackMessage('');
  };

  const handleGiveHint = () => {
    const correct = activeScenario.correctSequence;
    let nextNeededId = '';
    for (let i = 0; i < correct.length; i++) {
      if (i >= selectedSequence.length || selectedSequence[i] !== correct[i]) {
        nextNeededId = correct[i];
        break;
      }
    }
    if (!nextNeededId) {
      setFeedbackMessage('✨ Current pipeline is on track! Click "Test System Architecture".');
      return;
    }
    if (!selectedSequence.includes(nextNeededId)) {
      setSelectedSequence((prev) => [...prev, nextNeededId]);
    }
    const node = activeScenario.availableNodes.find((n) => n.id === nextNeededId);
    setFeedbackMessage(`💡 Hint: Connect "${node?.name || nextNeededId}" into your pipeline.`);
  };

  const handleTestArchitecture = () => {
    const correct = activeScenario.correctSequence;
    const isExactMatch =
      selectedSequence.length === correct.length &&
      selectedSequence.every((id, idx) => id === correct[idx]);

    if (isExactMatch) {
      setSimulationState('success');
      markScenarioSolved(activeScenario.id);
      addExp(50, `Solved System Architecture: ${activeScenario.title}`);
      saveMiniGameScore('architecture_puzzle', (solvedScenarios.length + 1) * 100);
      unlockAchievement('system_architect');
      triggerFireworks(2500);
      setFeedbackMessage('✅ Perfect System Design! Pipeline handles target throughput with resilient caching and failover.');
    } else {
      setSimulationState('failed');
      setFeedbackMessage(`❌ Component order mismatch or missing layers (${selectedSequence.length}/${correct.length} connected). Check caching & ingress placement.`);
    }
  };

  const nodeMap = useMemo(() => {
    return new Map(activeScenario.availableNodes.map((n) => [n.id, n]));
  }, [activeScenario]);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        color: '#f8fafc',
      }}
    >
      {/* ── 1. Compact Header Bar ── */}
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
        {/* System Scenario Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          <select
            value={activeScenario.id}
            onChange={(e) => handleSelectScenario(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#0f172a',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontSize: '0.82rem',
              fontWeight: 800,
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '320px',
            }}
          >
            {filteredScenarios.map((s, idx) => (
              <option key={s.id} value={s.id}>
                {solvedScenarios.includes(s.id) ? '✓ ' : ''}{idx + 1}. {s.title} ({s.difficulty})
              </option>
            ))}
          </select>

          {/* Difficulty Pills */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['all', 'Medium', 'Hard', 'Staff+'].map((diff) => {
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff as any)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
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
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={handleGiveHint}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
              fontSize: '0.75rem',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            💡 Hint
          </button>
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.75rem',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            🗑️ Clear
          </button>
          <div style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: 800 }}>
            🏆 {solvedScenarios.length} / {SYSTEM_DESIGN_PUZZLES.length} Solved
          </div>
        </div>
      </div>

      {/* ── 2. System Objective ── */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '1.2rem' }}>{activeScenario.badge}</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{activeScenario.title}</span>
          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
            {activeScenario.scaleMetric}
          </span>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
          {activeScenario.goal}
        </div>
      </div>

      {/* ── 3. Visual Pipeline Dropzone ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
          Connected Architecture Pipeline ({selectedSequence.length}/{activeScenario.correctSequence.length} Components):
        </div>

        <div
          style={{
            minHeight: '76px',
            borderRadius: '12px',
            background: '#07090e',
            border: simulationState === 'success' ? '1.5px solid #34d399' : simulationState === 'failed' ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {selectedSequence.length === 0 ? (
            <div style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              Click available components below to assemble the data ingestion & query pipeline in sequential order.
            </div>
          ) : (
            selectedSequence.map((nodeId, idx) => {
              const node = nodeMap.get(nodeId);
              const isHovered = hoveredSeqNodeId === nodeId;
              return (
                <React.Fragment key={nodeId}>
                  <div
                    onMouseEnter={() => setHoveredSeqNodeId(nodeId)}
                    onMouseLeave={() => setHoveredSeqNodeId(null)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isHovered ? 'rgba(56, 189, 248, 0.22)' : 'rgba(56, 189, 248, 0.12)',
                      border: isHovered ? '1.5px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.4)',
                      boxShadow: isHovered ? '0 4px 14px rgba(56, 189, 248, 0.3)' : 'none',
                      transform: isHovered ? 'translateY(-2px)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>#{idx + 1}</span>
                    <span style={{ fontSize: '0.9rem' }}>{node?.icon || '⚙️'}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 750, color: '#ffffff' }}>{node?.name || nodeId}</span>
                    <div style={{ display: 'flex', gap: '2px', marginLeft: '4px' }}>
                      {idx > 0 && (
                        <button type="button" onClick={() => handleMoveNode(idx, 'left')} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', fontSize: '0.7rem' }}>◀</button>
                      )}
                      {idx < selectedSequence.length - 1 && (
                        <button type="button" onClick={() => handleMoveNode(idx, 'right')} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', fontSize: '0.7rem' }}>▶</button>
                      )}
                      <button type="button" onClick={() => handleRemoveNode(nodeId)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, marginLeft: '2px' }}>✕</button>
                    </div>
                  </div>
                  {idx < selectedSequence.length - 1 && (
                    <span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>➔</span>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      {/* ── 4. Available Components Bank ── */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
          Available System Components (Click to Connect):
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeScenario.availableNodes.map((node) => {
            const isAdded = selectedSequence.includes(node.id);
            const isHovered = hoveredBankNodeId === node.id && !isAdded;
            return (
              <button
                key={node.id}
                type="button"
                disabled={isAdded}
                onMouseEnter={() => setHoveredBankNodeId(node.id)}
                onMouseLeave={() => setHoveredBankNodeId(null)}
                onClick={() => {
                  setHoveredBankNodeId(null);
                  handleAddNode(node.id);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isAdded ? 'rgba(255, 255, 255, 0.02)' : isHovered ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: isAdded ? '1px dashed rgba(255, 255, 255, 0.08)' : isHovered ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isAdded ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
                  boxShadow: isHovered ? '0 4px 14px rgba(56, 189, 248, 0.3)' : 'none',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: isAdded ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{node.icon}</span>
                <span>{node.name}</span>
                <span style={{ fontSize: '0.68rem', color: isHovered ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)' }}>({node.role})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. Feedback & Verification ── */}
      {feedbackMessage && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: simulationState === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${simulationState === 'success' ? '#34d399' : '#ef4444'}`,
            color: simulationState === 'success' ? '#34d399' : '#fca5a5',
            fontSize: '0.82rem',
            lineHeight: 1.4,
            marginBottom: '14px',
          }}
        >
          {feedbackMessage}
        </div>
      )}

      {/* Test Button */}
      <button
        type="button"
        onClick={handleTestArchitecture}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
          border: 'none',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '0.95rem',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(56, 189, 248, 0.4)',
        }}
      >
        🚀 Test System Architecture
      </button>
    </div>
  );
}
