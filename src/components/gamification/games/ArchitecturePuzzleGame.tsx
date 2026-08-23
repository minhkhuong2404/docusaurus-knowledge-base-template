import React, { useState, useMemo } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { SYSTEM_DESIGN_PUZZLES, PuzzleScenario } from '../../../data/systemDesignPuzzlesData';

export { PuzzleScenario, SYSTEM_DESIGN_PUZZLES };

interface DiagnosticFeedback {
  matchedCount: number;
  totalRequired: number;
  missingNodes: string[];
  extraNodes: string[];
  architecturalIssues: string[];
}

function analyzeArchitecture(
  selected: string[],
  correct: string[],
  availableNodes: { id: string; name: string; role: string }[]
): DiagnosticFeedback {
  const nodeMap = new Map(availableNodes.map((n) => [n.id, n]));
  const totalRequired = correct.length;

  let matchedCount = 0;
  selected.forEach((id, idx) => {
    if (idx < correct.length && id === correct[idx]) {
      matchedCount++;
    }
  });

  const missingNodes = correct.filter((id) => !selected.includes(id)).map((id) => nodeMap.get(id)?.name || id);
  const extraNodes = selected.filter((id) => !correct.includes(id)).map((id) => nodeMap.get(id)?.name || id);

  const architecturalIssues: string[] = [];

  // Check if client is first
  if (selected.length > 0 && selected[0] !== 'client' && correct.includes('client')) {
    architecturalIssues.push('Requests should initiate from the Client / Browser at the ingress of the pipeline.');
  }

  // Check caching layers vs databases
  const cacheIndices = selected.map((id, idx) => ({ id, idx })).filter((x) => x.id.includes('cache') || x.id.includes('redis') || x.id.includes('memcached') || x.id.includes('cdn'));
  const dbIndices = selected.map((id, idx) => ({ id, idx })).filter((x) => x.id.includes('db') || x.id.includes('postgres') || x.id.includes('mysql') || x.id.includes('mongo') || x.id.includes('dynamo') || x.id.includes('cassandra'));

  cacheIndices.forEach((cache) => {
    dbIndices.forEach((db) => {
      if (cache.idx > db.idx && !cache.id.includes('analytics')) {
        const cacheName = nodeMap.get(cache.id)?.name || 'Caching layer';
        const dbName = nodeMap.get(db.id)?.name || 'Primary Database';
        architecturalIssues.push(`${cacheName} is placed after ${dbName}. Read-through / Edge caching should shield the database.`);
      }
    });
  });

  // Check queue / kafka placement
  const queueIndices = selected.map((id, idx) => ({ id, idx })).filter((x) => x.id.includes('kafka') || x.id.includes('queue') || x.id.includes('sqs') || x.id.includes('kinesis') || x.id.includes('rabbit'));
  const gatewayIndices = selected.map((id, idx) => ({ id, idx })).filter((x) => x.id.includes('gateway') || x.id.includes('lb') || x.id.includes('load_balancer'));

  queueIndices.forEach((q) => {
    gatewayIndices.forEach((gw) => {
      if (q.idx < gw.idx) {
        const qName = nodeMap.get(q.id)?.name || 'Message Queue';
        const gwName = nodeMap.get(gw.id)?.name || 'Gateway';
        architecturalIssues.push(`${qName} is positioned before ${gwName}. Ingress traffic should pass through API Gateway / Load Balancer before message streams.`);
      }
    });
  });

  if (architecturalIssues.length === 0 && selected.length !== correct.length) {
    if (selected.length < correct.length) {
      architecturalIssues.push(`Pipeline is incomplete (${selected.length}/${correct.length} components connected). Missing critical architectural layers.`);
    } else {
      architecturalIssues.push(`Pipeline contains extra components (${selected.length} connected, target is ${correct.length}).`);
    }
  }

  return {
    matchedCount,
    totalRequired,
    missingNodes,
    extraNodes,
    architecturalIssues,
  };
}

function getNodeLayerBadge(nodeId: string, role: string): { label: string; color: string; bg: string } {
  const lower = (nodeId + ' ' + role).toLowerCase();
  if (lower.includes('client') || lower.includes('browser') || lower.includes('cdn') || lower.includes('gateway') || lower.includes('load balancer') || lower.includes('dns') || lower.includes('waf')) {
    return { label: '🌐 Ingress / Edge', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
  }
  if (lower.includes('service') || lower.includes('worker') || lower.includes('compute') || lower.includes('lambda') || lower.includes('aggregator') || lower.includes('controller') || lower.includes('engine') || lower.includes('token')) {
    return { label: '⚙️ Compute / Logic', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' };
  }
  if (lower.includes('cache') || lower.includes('redis') || lower.includes('memcached') || lower.includes('bloom')) {
    return { label: '⚡ Cache / RAM', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' };
  }
  if (lower.includes('db') || lower.includes('sql') || lower.includes('postgres') || lower.includes('mysql') || lower.includes('dynamo') || lower.includes('cassandra') || lower.includes('mongo') || lower.includes('store') || lower.includes('ledger')) {
    return { label: '🗄️ Primary DB', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' };
  }
  if (lower.includes('kafka') || lower.includes('queue') || lower.includes('sqs') || lower.includes('kinesis') || lower.includes('rabbit') || lower.includes('stream') || lower.includes('pubsub')) {
    return { label: '📨 Event Stream', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' };
  }
  return { label: '📊 OLAP / Storage', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)' };
}

export default function ArchitecturePuzzleGame() {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'big_tech' | 'real_time' | 'fintech' | 'distributed'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Medium' | 'Hard' | 'Staff+'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeScenarioId, setActiveScenarioId] = useState<string>(SYSTEM_DESIGN_PUZZLES[0].id);
  const [selectedSequence, setSelectedSequence] = useState<string[]>([]);
  const [simulationState, setSimulationState] = useState<'idle' | 'simulating' | 'success' | 'failed'>('idle');
  const [revealedAnswer, setRevealedAnswer] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [showDeepDive, setShowDeepDive] = useState<boolean>(true);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Solved tracking via localStorage
  const [solvedScenarios, setSolvedScenarios] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('system_design_solved_puzzles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Diagnostics, Hints & Copy State
  const [diagnostics, setDiagnostics] = useState<DiagnosticFeedback | null>(null);
  const [hintMessage, setHintMessage] = useState<string>('');
  const [copiedCheatSheet, setCopiedCheatSheet] = useState<boolean>(false);
  const [simulatedLatency, setSimulatedLatency] = useState<number>(0);

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

  // Filtered scenarios by category, difficulty, and search query
  const filteredScenarios = useMemo(() => {
    return SYSTEM_DESIGN_PUZZLES.filter((s) => {
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'all' || s.difficulty === selectedDifficulty;
      const matchQuery =
        !searchQuery.trim() ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchDiff && matchQuery;
    });
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const activeScenario =
    SYSTEM_DESIGN_PUZZLES.find((s) => s.id === activeScenarioId) ||
    filteredScenarios[0] ||
    SYSTEM_DESIGN_PUZZLES[0];

  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    setSelectedSequence([]);
    setSimulationState('idle');
    setRevealedAnswer(false);
    setActiveStep(-1);
    setDiagnostics(null);
    setHintMessage('');
  };

  const handleRandomChallenge = () => {
    const list = filteredScenarios.length > 0 ? filteredScenarios : SYSTEM_DESIGN_PUZZLES;
    const rand = list[Math.floor(Math.random() * list.length)];
    handleSelectScenario(rand.id);
  };

  const handleAddNode = (nodeId: string) => {
    if (selectedSequence.includes(nodeId) || simulationState === 'simulating') return;
    setSelectedSequence([...selectedSequence, nodeId]);
    setSimulationState('idle');
    setRevealedAnswer(false);
    setDiagnostics(null);
  };

  const handleRemoveNode = (nodeId: string) => {
    if (simulationState === 'simulating') return;
    setSelectedSequence(selectedSequence.filter((id) => id !== nodeId));
    setSimulationState('idle');
    setRevealedAnswer(false);
    setDiagnostics(null);
  };

  const handleMoveNodeLeft = (index: number) => {
    if (index <= 0 || simulationState === 'simulating') return;
    const newSeq = [...selectedSequence];
    const temp = newSeq[index - 1];
    newSeq[index - 1] = newSeq[index];
    newSeq[index] = temp;
    setSelectedSequence(newSeq);
    setSimulationState('idle');
    setDiagnostics(null);
  };

  const handleMoveNodeRight = (index: number) => {
    if (index >= selectedSequence.length - 1 || simulationState === 'simulating') return;
    const newSeq = [...selectedSequence];
    const temp = newSeq[index + 1];
    newSeq[index + 1] = newSeq[index];
    newSeq[index] = temp;
    setSelectedSequence(newSeq);
    setSimulationState('idle');
    setDiagnostics(null);
  };

  const handleClear = () => {
    if (simulationState === 'simulating') return;
    setSelectedSequence([]);
    setSimulationState('idle');
    setRevealedAnswer(false);
    setActiveStep(-1);
    setDiagnostics(null);
    setHintMessage('');
  };

  const handleGiveHint = () => {
    if (simulationState === 'simulating') return;
    const correct = activeScenario.correctSequence;
    
    let nextNeededId = '';
    for (let i = 0; i < correct.length; i++) {
      if (i >= selectedSequence.length || selectedSequence[i] !== correct[i]) {
        nextNeededId = correct[i];
        break;
      }
    }

    if (!nextNeededId) {
      setHintMessage('✨ Your pipeline is currently on the optimal track! Click "Test System Architecture".');
      return;
    }

    const nodeInfo = activeScenario.availableNodes.find((n) => n.id === nextNeededId);
    if (nodeInfo) {
      if (!selectedSequence.includes(nextNeededId)) {
        setSelectedSequence((prev) => [...prev, nextNeededId]);
      }
      setHintMessage(`💡 Hint: The next component in sequence is "${nodeInfo.name}" (${nodeInfo.role}). Connected to your pipeline.`);
      setSimulationState('idle');
      setDiagnostics(null);
    }
  };

  const handleShowAnswer = () => {
    if (simulationState === 'simulating') return;
    setSelectedSequence([...activeScenario.correctSequence]);
    setSimulationState('success');
    setRevealedAnswer(true);
    setActiveStep(-1);
    setShowDeepDive(true);
    setDiagnostics(null);
    setHintMessage('');
  };

  const handleSimulate = () => {
    if (selectedSequence.length === 0) return;
    setSimulationState('simulating');
    setRevealedAnswer(false);
    setActiveStep(0);
    setDiagnostics(null);
    setHintMessage('');
    setSimulatedLatency(0);

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setSimulatedLatency((prev) => prev + Math.floor(Math.random() * 3 + 2));
      if (step < selectedSequence.length) {
        setActiveStep(step);
      } else {
        clearInterval(interval);
        // Verify correctness
        const isCorrect =
          selectedSequence.length === activeScenario.correctSequence.length &&
          selectedSequence.every((val, index) => val === activeScenario.correctSequence[index]);

        if (isCorrect) {
          setSimulationState('success');
          setRevealedAnswer(false);
          markScenarioSolved(activeScenario.id);
          addExp(120, `Solved System Design Challenge: ${activeScenario.title}`);
          saveMiniGameScore('architecture_puzzle', 120);
          unlockAchievement('pipe_master');
          triggerFireworks(4500);
        } else {
          setSimulationState('failed');
          setRevealedAnswer(false);
          const diag = analyzeArchitecture(selectedSequence, activeScenario.correctSequence, activeScenario.availableNodes);
          setDiagnostics(diag);
        }
      }
    }, 450);
  };

  const handleCopyCheatSheet = () => {
    const text = `### System Design Breakdown: ${activeScenario.title}
**Domain**: ${activeScenario.categoryLabel} | **Difficulty**: ${activeScenario.difficulty}
**Scale**: ${activeScenario.scaleMetric} | **Traffic**: ${activeScenario.qps}

#### 🎯 Architecture Goal
${activeScenario.goal}

#### ⚡ Optimal Execution Pipeline
${activeScenario.correctSequence.map((id, i) => {
  const n = activeScenario.availableNodes.find((x) => x.id === id);
  return `${i + 1}. ${n ? n.name : id} — ${n ? n.role : ''}`;
}).join('\n')}

#### 💡 Deep Architectural Explanation
${activeScenario.explanation}

#### 🔑 Key System Design Interview Takeaways
${activeScenario.keyDesignTakeaways.map((t) => `- ${t}`).join('\n')}
`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedCheatSheet(true);
        setTimeout(() => setCopiedCheatSheet(false), 2500);
      });
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all: SYSTEM_DESIGN_PUZZLES.length,
      big_tech: SYSTEM_DESIGN_PUZZLES.filter((s) => s.category === 'big_tech').length,
      real_time: SYSTEM_DESIGN_PUZZLES.filter((s) => s.category === 'real_time').length,
      fintech: SYSTEM_DESIGN_PUZZLES.filter((s) => s.category === 'fintech').length,
      distributed: SYSTEM_DESIGN_PUZZLES.filter((s) => s.category === 'distributed').length,
    };
  }, []);

  const isCurrentSolved = solvedScenarios.includes(activeScenario.id);

  return (
    <div
      style={{
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: '1.5px solid rgba(56, 189, 248, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(56, 189, 248, 0.12)',
        padding: '28px',
        color: '#ffffff',
      }}
    >
      {/* ── 1. Top Header & Title ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1.5px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
            }}
          >
            {activeScenario.badge}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 900, fontSize: '1.35rem', color: '#ffffff' }}>
                System Design Arena
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background:
                    activeScenario.difficulty === 'Staff+'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : activeScenario.difficulty === 'Hard'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(52, 211, 153, 0.2)',
                  color:
                    activeScenario.difficulty === 'Staff+'
                      ? '#f87171'
                      : activeScenario.difficulty === 'Hard'
                      ? '#fbbf24'
                      : '#34d399',
                  border: `1px solid ${
                    activeScenario.difficulty === 'Staff+'
                      ? '#ef4444'
                      : activeScenario.difficulty === 'Hard'
                      ? '#f59e0b'
                      : '#10b981'
                  }`,
                }}
              >
                {activeScenario.difficulty}
              </span>

              {isCurrentSolved && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(52, 211, 153, 0.2)',
                    color: '#34d399',
                    border: '1px solid #34d399',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ✓ Solved
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Assemble the distributed architecture pipeline (inspired by HelloInterview problem breakdowns).
            </div>
          </div>
        </div>

        {/* Action Buttons & Solved Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🏆</span>
            <span>Mastery: {solvedScenarios.length} / {SYSTEM_DESIGN_PUZZLES.length}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowRules((prev) => !prev)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: showRules ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
              background: showRules ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: showRules ? '#38bdf8' : 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.82rem',
              fontWeight: 750,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📖</span>
            <span>{showRules ? 'Hide Rules' : 'How to Play'}</span>
          </button>

          {/* Random System Button */}
          <button
            type="button"
            onClick={handleRandomChallenge}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
              border: '1.5px solid #fbbf24',
              color: '#fbbf24',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 14px rgba(251, 191, 36, 0.25)',
            }}
          >
            <span>🎲</span>
            <span>Random System</span>
          </button>
        </div>
      </div>

      {/* 📖 ARCHITECTURE PUZZLE GUIDELINES PANEL */}
      {showRules && (
        <div
          style={{
            padding: '18px 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            marginBottom: '22px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📖</span>
            <span>Architecture Pipe Puzzle — How to Play & Design Guidelines</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.83rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45 }}>
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 750, color: '#38bdf8', marginBottom: '4px' }}>1. Flow of Execution</div>
              Assemble components in strict sequential order from client ingress ➔ compute/caching ➔ storage ➔ asynchronous background streams.
            </div>
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 750, color: '#fbbf24', marginBottom: '4px' }}>2. Reordering & Hints</div>
              Use the ◀ / ▶ shift buttons on pipeline tiles to reorder nodes without rebuilding. Use 💡 Hint if stuck.
            </div>
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 750, color: '#34d399', marginBottom: '4px' }}>3. Real-World Trade-Offs</div>
              Every completed system unlocks a senior breakdown covering replication, partitioning, and bottleneck mitigation.
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Filters & Scenario Selector ── */}
      <div style={{ marginBottom: '18px' }}>
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {[
            { id: 'all', label: `All Systems (${categoryCounts.all})`, icon: '🌐' },
            { id: 'big_tech', label: `Big Tech (${categoryCounts.big_tech})`, icon: '🏢' },
            { id: 'real_time', label: `Real-Time & Chat (${categoryCounts.real_time})`, icon: '⚡' },
            { id: 'fintech', label: `Fintech & Ledger (${categoryCounts.fintech})`, icon: '💳' },
            { id: 'distributed', label: `Distributed Infra (${categoryCounts.distributed})`, icon: '🛰️' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)',
                  fontSize: '0.82rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Difficulty & Search Bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'Medium', 'Hard', 'Staff+'].map((diff) => {
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {diff === 'all' ? 'All Difficulties' : diff}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search systems (e.g. Uber, Kafka, Stripe, Redis, Rate Limiter)..."
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Quick Scenario Jump Dropdown */}
          <div style={{ minWidth: '220px' }}>
            <select
              value={activeScenario.id}
              onChange={(e) => handleSelectScenario(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                background: '#0f172a',
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: 750,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {filteredScenarios.map((s, idx) => (
                <option key={s.id} value={s.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                  {solvedScenarios.includes(s.id) ? '✓ ' : ''}{idx + 1}. {s.badge} {s.title} ({s.difficulty})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 3. Horizontal Carousel of Filtered System Cards ── */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '18px' }}>
        {filteredScenarios.slice(0, 30).map((s) => {
          const isSelected = activeScenario.id === s.id;
          const isSolved = solvedScenarios.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectScenario(s.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(30, 41, 59, 0.8) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{s.badge}</span>
              <span>{s.title.replace('Design ', '').split(' / ')[0]}</span>
              {isSolved && <span style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 900 }}>✓</span>}
            </button>
          );
        })}
        {filteredScenarios.length > 30 && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)', whiteSpace: 'nowrap' }}>
            +{filteredScenarios.length - 30} more in dropdown above ➔
          </div>
        )}
      </div>

      {/* ── 4. Scale, Constraints & Architecture Goal ── */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '14px',
          background: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          marginBottom: '22px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
            <strong>📊 Scale:</strong> <span>{activeScenario.scaleMetric}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
            <strong>⚡ Traffic:</strong> <span>{activeScenario.qps}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc' }}>
            <strong>🏛️ Domain:</strong> <span>{activeScenario.categoryLabel}</span>
          </div>
        </div>

        <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#e0f2fe' }}>
          <span style={{ fontWeight: 800, color: '#38bdf8' }}>🎯 Architecture Goal: </span>
          {activeScenario.goal}
        </div>
      </div>

      {/* ── 5. Available Architecture Nodes (Palette) ── */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.65)' }}>
            Available System Nodes (Click to Connect into Pipeline):
          </div>
          <div style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 700 }}>
            Target Pipeline Length: {activeScenario.correctSequence.length} Components
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {activeScenario.availableNodes.map((node) => {
            const isUsed = selectedSequence.includes(node.id);
            const layer = getNodeLayerBadge(node.id, node.role);
            return (
              <button
                key={node.id}
                type="button"
                disabled={isUsed || simulationState === 'simulating'}
                onClick={() => handleAddNode(node.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isUsed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(30, 41, 59, 0.7)',
                  border: isUsed ? '1px dashed rgba(255, 255, 255, 0.15)' : `1px solid ${layer.color}66`,
                  color: isUsed ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: isUsed ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  boxShadow: isUsed ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{node.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{node.name}</span>
                    <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: layer.bg, color: layer.color, fontWeight: 700 }}>
                      {layer.label.split(' ')[0]}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: isUsed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)' }}>
                    {node.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 6. Assembly Pipeline Canvas with Step Highlights & Reordering ── */}
      <div
        style={{
          padding: '22px',
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: '20px',
          minHeight: '150px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.65)' }}>
              Active Execution Pipeline ({selectedSequence.length}/{activeScenario.correctSequence.length} Nodes Connected):
            </span>
            {simulationState === 'simulating' && (
              <span style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 700 }}>
                ⚡ Simulating Latency: {simulatedLatency}ms
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedSequence.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                disabled={simulationState === 'simulating'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                Clear Pipeline ✕
              </button>
            )}
          </div>
        </div>

        {selectedSequence.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 10px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.92rem' }}>
            Pipeline is empty. Click available nodes above in sequential execution order!
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {selectedSequence.map((nodeId, idx) => {
              const nodeInfo = activeScenario.availableNodes.find((n) => n.id === nodeId);
              if (!nodeInfo) return null;
              const isSimulatingThis = activeStep === idx;
              const layer = getNodeLayerBadge(nodeId, nodeInfo.role);

              return (
                <React.Fragment key={nodeId}>
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: isSimulatingThis
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.45) 0%, rgba(59, 130, 246, 0.35) 100%)'
                        : 'rgba(30, 41, 59, 0.9)',
                      border: isSimulatingThis ? '2px solid #38bdf8' : `1px solid ${layer.color}55`,
                      boxShadow: isSimulatingThis ? '0 0 24px rgba(56, 189, 248, 0.7)' : 'none',
                      transform: isSimulatingThis ? 'scale(1.06)' : 'scale(1)',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{nodeInfo.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#ffffff' }}>
                        {nodeInfo.name}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                        {nodeInfo.role}
                      </div>
                    </div>

                    {/* Reordering and remove buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveNodeLeft(idx)}
                        disabled={idx === 0 || simulationState === 'simulating'}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          color: idx === 0 ? 'rgba(255, 255, 255, 0.2)' : '#38bdf8',
                          fontSize: '10px',
                          cursor: idx === 0 ? 'default' : 'pointer',
                          padding: '2px 4px',
                          borderRadius: '4px',
                        }}
                        title="Shift node left"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveNodeRight(idx)}
                        disabled={idx === selectedSequence.length - 1 || simulationState === 'simulating'}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          color: idx === selectedSequence.length - 1 ? 'rgba(255, 255, 255, 0.2)' : '#38bdf8',
                          fontSize: '10px',
                          cursor: idx === selectedSequence.length - 1 ? 'default' : 'pointer',
                          padding: '2px 4px',
                          borderRadius: '4px',
                        }}
                        title="Shift node right"
                      >
                        ▶
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveNode(nodeId)}
                        disabled={simulationState === 'simulating'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.4)',
                          fontSize: '13px',
                          cursor: 'pointer',
                          padding: '0 4px',
                        }}
                        title="Remove node from pipeline"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {idx < selectedSequence.length - 1 && (
                    <span
                      style={{
                        fontSize: '1.2rem',
                        color: activeStep > idx ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)',
                        fontWeight: 900,
                        transition: 'color 0.2s ease',
                      }}
                    >
                      ➔
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Hint Notice Message ── */}
      {hintMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            color: '#fbbf24',
            fontSize: '0.85rem',
            fontWeight: 650,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{hintMessage}</span>
        </div>
      )}

      {/* ── 7. Simulation Actions & Validation Status ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={selectedSequence.length === 0 || simulationState === 'simulating'}
            onClick={handleSimulate}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
              border: '1px solid #38bdf8',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: selectedSequence.length > 0 && simulationState !== 'simulating' ? 'pointer' : 'not-allowed',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {simulationState === 'simulating' ? '🔄 Simulating Packet Transmission...' : '⚡ Test System Architecture'}
          </button>

          <button
            type="button"
            disabled={simulationState === 'simulating'}
            onClick={handleGiveHint}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: simulationState !== 'simulating' ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Reveal and attach the next optimal component in the sequence"
          >
            <span>💡</span>
            <span>Hint</span>
          </button>

          <button
            type="button"
            disabled={simulationState === 'simulating'}
            onClick={handleShowAnswer}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              color: '#fbbf24',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: simulationState !== 'simulating' ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Reveal the correct architecture pipeline and senior breakdown without gaining EXP"
          >
            <span>👁️</span>
            <span>Show Answer</span>
          </button>
        </div>

        {simulationState === 'success' && (
          <div
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: revealedAnswer ? 'rgba(251, 191, 36, 0.15)' : 'rgba(52, 211, 153, 0.18)',
              border: revealedAnswer ? '1.5px solid #fbbf24' : '1.5px solid #34d399',
              color: revealedAnswer ? '#fbbf24' : '#34d399',
              fontWeight: 800,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: revealedAnswer ? '0 0 16px rgba(251, 191, 36, 0.25)' : '0 0 16px rgba(52, 211, 153, 0.35)',
            }}
          >
            <span>{revealedAnswer ? '👁️ SOLUTION REVEALED (Study Mode — No EXP Awarded)' : '✓ ARCHITECTURE VERIFIED! +120 EXP'}</span>
          </div>
        )}

        {simulationState === 'failed' && (
          <div
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1.5px solid #ef4444',
              color: '#f87171',
              fontWeight: 800,
              fontSize: '0.9rem',
            }}
          >
            <span>❌ Architecture Flaw Detected: Review diagnostics below!</span>
          </div>
        )}
      </div>

      {/* ── 8. Intelligent Failure Diagnostics Panel ── */}
      {simulationState === 'failed' && diagnostics && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            marginBottom: '22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, color: '#f87171', fontSize: '0.92rem' }}>
              🔍 Intelligent Architecture Diagnostics ({diagnostics.matchedCount}/{diagnostics.totalRequired} Position Matches):
            </span>
          </div>

          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.5 }}>
            {diagnostics.architecturalIssues.map((issue, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {issue}
              </li>
            ))}
            {diagnostics.missingNodes.length > 0 && (
              <li style={{ marginBottom: '4px' }}>
                <strong>Missing components:</strong> {diagnostics.missingNodes.join(', ')}
              </li>
            )}
            {diagnostics.extraNodes.length > 0 && (
              <li style={{ marginBottom: '4px' }}>
                <strong>Unnecessary components:</strong> {diagnostics.extraNodes.join(', ')}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* ── 9. HelloInterview Deep Architecture Breakdown Card & Cheat Sheet Export ── */}
      {simulationState === 'success' && (
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            borderRadius: '14px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1.5px solid rgba(52, 211, 153, 0.4)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontWeight: 900, color: '#34d399', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💡 Senior Architecture Breakdown: {activeScenario.title}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCopyCheatSheet}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{copiedCheatSheet ? '✓' : '📋'}</span>
                <span>{copiedCheatSheet ? 'Copied to Clipboard!' : 'Copy Cheat Sheet'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeepDive(!showDeepDive)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {showDeepDive ? 'Collapse ▲' : 'Expand ▼'}
              </button>
            </div>
          </div>

          {showDeepDive && (
            <div>
              <div style={{ fontSize: '0.88rem', lineHeight: 1.5, color: '#e2e8f0', marginBottom: '14px' }}>
                {activeScenario.explanation}
              </div>

              <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#fbbf24', marginBottom: '6px' }}>
                🔑 Key System Design Interview Takeaways:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', lineHeight: 1.55, color: 'rgba(255, 255, 255, 0.85)' }}>
                {activeScenario.keyDesignTakeaways.map((takeaway, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    {takeaway}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
