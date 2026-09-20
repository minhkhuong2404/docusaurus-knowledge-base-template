import React, { useState, useMemo, useEffect } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { arcadeAudio } from '../../../utils/arcadeAudio';
import { SYSTEM_DESIGN_PUZZLES } from '../../../data/systemDesignPuzzlesData';
import type { PuzzleScenario } from '../../../data/systemDesignPuzzlesData';

export type { PuzzleScenario };
export { SYSTEM_DESIGN_PUZZLES };

interface ArchitectureMetrics {
  p99LatencyMs: number;
  throughputQps: string;
  availabilityPercent: number;
  monthlyCost: number;
  bottleneckNode?: string;
  bottleneckReason?: string;
}

export default function ArchitecturePuzzleGame() {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'big_tech' | 'real_time' | 'fintech' | 'distributed'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Medium' | 'Hard' | 'Staff+'>('all');
  const [activeScenarioId, setActiveScenarioId] = useState<string>(SYSTEM_DESIGN_PUZZLES[0].id);
  const [selectedSequence, setSelectedSequence] = useState<string[]>([]);
  const [simulationState, setSimulationState] = useState<'idle' | 'simulating' | 'success' | 'failed'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [activeSimulationMetrics, setActiveSimulationMetrics] = useState<ArchitectureMetrics | null>(null);
  const [showTakeaways, setShowTakeaways] = useState<boolean>(true);

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

  const nodeMap = useMemo(() => {
    return new Map(activeScenario.availableNodes.map((n) => [n.id, n]));
  }, [activeScenario]);

  const handleSelectScenario = (id: string) => {
    arcadeAudio.playFlip();
    setActiveScenarioId(id);
    setSelectedSequence([]);
    setSimulationState('idle');
    setFeedbackMessage('');
    setActiveSimulationMetrics(null);
  };

  const handleAddNode = (nodeId: string) => {
    if (selectedSequence.includes(nodeId)) return;
    arcadeAudio.playBlip();
    setSelectedSequence([...selectedSequence, nodeId]);
    setSimulationState('idle');
    setFeedbackMessage('');
    setActiveSimulationMetrics(null);
  };

  const handleRemoveNode = (nodeId: string) => {
    arcadeAudio.playBlip();
    setSelectedSequence(selectedSequence.filter((id) => id !== nodeId));
    setSimulationState('idle');
    setFeedbackMessage('');
    setActiveSimulationMetrics(null);
  };

  const handleMoveNode = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedSequence.length) return;
    arcadeAudio.playBlip();
    const newSeq = [...selectedSequence];
    const temp = newSeq[targetIdx];
    newSeq[targetIdx] = newSeq[index];
    newSeq[index] = temp;
    setSelectedSequence(newSeq);
    setSimulationState('idle');
    setActiveSimulationMetrics(null);
  };

  const handleClear = () => {
    arcadeAudio.playError();
    setSelectedSequence([]);
    setSimulationState('idle');
    setFeedbackMessage('');
    setActiveSimulationMetrics(null);
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
      arcadeAudio.playCorrect();
      setFeedbackMessage('✨ Current pipeline is on track! Click "🚀 Simulate Traffic & Load Test".');
      return;
    }
    if (!selectedSequence.includes(nextNeededId)) {
      setSelectedSequence((prev) => [...prev, nextNeededId]);
    }
    arcadeAudio.playBlip();
    const node = activeScenario.availableNodes.find((n) => n.id === nextNeededId);
    setFeedbackMessage(`💡 Architect Hint: Connect "${node?.name || nextNeededId}" into your pipeline.`);
  };

  // Analyze topology and calculate simulated metrics
  const evaluateArchitecture = (seq: string[], correct: string[]): ArchitectureMetrics => {
    const isExact = seq.length === correct.length && seq.every((id, idx) => id === correct[idx]);

    // Check for common architectural anti-patterns
    let bottleneckNode: string | undefined;
    let bottleneckReason: string | undefined;

    const hasClient = seq.includes('client');
    const hasGateway = seq.some((id) => id.includes('gateway') || id.includes('lb') || id.includes('balancer'));
    const hasCache = seq.some((id) => id.includes('redis') || id.includes('memcached') || id.includes('cache'));
    const hasDb = seq.some((id) => id.includes('db') || id.includes('sql') || id.includes('postgres') || id.includes('mongo'));
    const hasQueue = seq.some((id) => id.includes('kafka') || id.includes('rabbit') || id.includes('sqs') || id.includes('pulsar'));

    const cacheIdx = seq.findIndex((id) => id.includes('redis') || id.includes('cache'));
    const dbIdx = seq.findIndex((id) => id.includes('db') || id.includes('sql') || id.includes('postgres') || id.includes('mongo'));

    if (!hasClient && seq.length > 0) {
      bottleneckNode = seq[0];
      bottleneckReason = 'Missing Client entrypoint: All distributed requests originate from User/Client.';
    } else if (hasCache && hasDb && cacheIdx > dbIdx && dbIdx !== -1) {
      bottleneckNode = seq[dbIdx];
      bottleneckReason = 'Cache-Behind Hazard: Database is queried before the Cache check. Requests bypass memory hot-tier!';
    } else if (!isExact) {
      // Find first mismatched component
      for (let i = 0; i < Math.max(seq.length, correct.length); i++) {
        if (seq[i] !== correct[i]) {
          const expectedNode = nodeMap.get(correct[i]);
          const actualNode = nodeMap.get(seq[i]);
          bottleneckNode = actualNode?.name || seq[i] || 'Missing Layer';
          bottleneckReason = `Layer mismatch at step #${i + 1}. Expected "${expectedNode?.name || correct[i]}", but got "${actualNode?.name || 'Nothing'}". Check ingress and caching order!`;
          break;
        }
      }
    }

    if (isExact) {
      return {
        p99LatencyMs: 4.8,
        throughputQps: activeScenario.qps || '50,000 QPS',
        availabilityPercent: 99.99,
        monthlyCost: 2450,
      };
    } else {
      const penalty = Math.abs(correct.length - seq.length);
      return {
        p99LatencyMs: Math.min(8400, 320 + penalty * 850 + (hasCache ? 0 : 2200)),
        throughputQps: '1,420 QPS (Throttled)',
        availabilityPercent: Math.max(72.5, 99.9 - penalty * 6.5),
        monthlyCost: 4800,
        bottleneckNode,
        bottleneckReason,
      };
    }
  };

  const handleTestArchitecture = () => {
    if (selectedSequence.length === 0) {
      arcadeAudio.playError();
      setFeedbackMessage('⚠️ Connect at least 1 component to run traffic simulation.');
      return;
    }

    arcadeAudio.playLaser();
    setSimulationState('simulating');
    setFeedbackMessage('⚡ Simulating load test: injecting 50,000 requests/sec across connected topology...');

    setTimeout(() => {
      const correct = activeScenario.correctSequence;
      const metrics = evaluateArchitecture(selectedSequence, correct);
      setActiveSimulationMetrics(metrics);

      const isExactMatch =
        selectedSequence.length === correct.length &&
        selectedSequence.every((id, idx) => id === correct[idx]);

      if (isExactMatch) {
        setSimulationState('success');
        markScenarioSolved(activeScenario.id);
        addExp(50, `Solved System Architecture: ${activeScenario.title}`);
        saveMiniGameScore('architecture_puzzle', (solvedScenarios.length + 1) * 100);
        unlockAchievement('system_architect');
        arcadeAudio.playVictory();
        triggerFireworks(2500);
        setFeedbackMessage('✅ 200 OK! Perfect Architecture. High-throughput pipeline passes stress testing with sub-5ms p99 latency!');
      } else {
        setSimulationState('failed');
        arcadeAudio.playError();
        setFeedbackMessage(
          `❌ Simulation Bottleneck: ${metrics.bottleneckReason || 'Component order mismatch. Check caching, queue buffering, and persistence order.'}`
        );
      }
    }, 1200);
  };

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
      {/* ── CSS Keyframes for live packet animation ── */}
      <style>{`
        @keyframes flowPacketGlow {
          0% { stroke-dashoffset: 40; opacity: 0.3; }
          50% { opacity: 1; filter: drop-shadow(0 0 6px #38bdf8); }
          100% { stroke-dashoffset: 0; opacity: 0.3; }
        }
        @keyframes pulseSuccess {
          0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(52, 211, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
        }
        @keyframes pulseError {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>

      {/* ── 1. Header Bar with Filters ── */}
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
                  onClick={() => {
                    arcadeAudio.playBlip();
                    setSelectedDifficulty(diff as any);
                  }}
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

      {/* ── 2. System Objective & NFR Target ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.2rem' }}>{activeScenario.badge}</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{activeScenario.title}</span>
          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
            Scale: {activeScenario.scaleMetric}
          </span>
          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
            Target: {activeScenario.qps}
          </span>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
          {activeScenario.goal}
        </div>
      </div>

      {/* ── 3. Visual Pipeline Dropzone with Live Flow ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)' }}>
            Connected Architecture Pipeline ({selectedSequence.length}/{activeScenario.correctSequence.length} Components):
          </div>
          {simulationState === 'simulating' && (
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block', animation: 'flowPacketGlow 0.8s infinite' }} />
              Stress Testing Live Ingress Traffic...
            </span>
          )}
        </div>

        <div
          style={{
            minHeight: '84px',
            borderRadius: '14px',
            background: '#07090e',
            border:
              simulationState === 'success'
                ? '2px solid #34d399'
                : simulationState === 'failed'
                ? '2px solid #ef4444'
                : simulationState === 'simulating'
                ? '2px dashed #38bdf8'
                : '1px solid rgba(255, 255, 255, 0.1)',
            animation: simulationState === 'success' ? 'pulseSuccess 2s infinite' : simulationState === 'failed' ? 'pulseError 2s infinite' : 'none',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            position: 'relative',
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
              const isBottleneck = simulationState === 'failed' && activeSimulationMetrics?.bottleneckNode === (node?.name || nodeId);

              return (
                <React.Fragment key={nodeId}>
                  <div
                    onMouseEnter={() => setHoveredSeqNodeId(nodeId)}
                    onMouseLeave={() => setHoveredSeqNodeId(null)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: isBottleneck
                        ? 'rgba(239, 68, 68, 0.25)'
                        : isHovered
                        ? 'rgba(56, 189, 248, 0.22)'
                        : simulationState === 'success'
                        ? 'rgba(52, 211, 153, 0.16)'
                        : 'rgba(56, 189, 248, 0.12)',
                      border: isBottleneck
                        ? '2px solid #ef4444'
                        : isHovered
                        ? '1.5px solid #38bdf8'
                        : simulationState === 'success'
                        ? '1.5px solid #34d399'
                        : '1px solid rgba(56, 189, 248, 0.4)',
                      boxShadow: isHovered ? '0 4px 14px rgba(56, 189, 248, 0.3)' : 'none',
                      transform: isHovered ? 'translateY(-2px)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>#{idx + 1}</span>
                    <span style={{ fontSize: '1rem' }}>{node?.icon || '⚙️'}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 750, color: '#ffffff' }}>{node?.name || nodeId}</span>
                    <div style={{ display: 'flex', gap: '2px', marginLeft: '4px' }}>
                      {idx > 0 && (
                        <button type="button" onClick={() => handleMoveNode(idx, 'left')} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', fontSize: '0.7rem' }}>◀</button>
                      )}
                      {idx < selectedSequence.length - 1 && (
                        <button type="button" onClick={() => handleMoveNode(idx, 'right')} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', fontSize: '0.7rem' }}>▶</button>
                      )}
                      <button type="button" onClick={() => handleRemoveNode(nodeId)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, marginLeft: '2px' }}>✕</button>
                    </div>

                    {isBottleneck && (
                      <span
                        title="Bottleneck detected here!"
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ef4444',
                          color: '#fff',
                          fontSize: '0.65rem',
                          padding: '1px 5px',
                          borderRadius: '10px',
                          fontWeight: 800,
                        }}
                      >
                        ⚠️ Saturation
                      </span>
                    )}
                  </div>
                  {idx < selectedSequence.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', color: simulationState === 'simulating' ? '#38bdf8' : '#64748b', fontSize: '0.9rem' }}>
                      ➔
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      {/* ── 4. Live System SLA Telemetry Dashboard (Shows when tested) ── */}
      {activeSimulationMetrics && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
          }}
        >
          {/* Gauge 1: p99 Latency */}
          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontWeight: 800 }}>p99 Latency</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: activeSimulationMetrics.p99LatencyMs < 20 ? '#34d399' : '#f87171' }}>
              {activeSimulationMetrics.p99LatencyMs} ms
            </div>
            <div style={{ fontSize: '0.68rem', color: activeSimulationMetrics.p99LatencyMs < 20 ? '#34d399' : '#f87171' }}>
              {activeSimulationMetrics.p99LatencyMs < 20 ? '⚡ Ultra Low SLA' : '🚨 Severe Latency Spill'}
            </div>
          </div>

          {/* Gauge 2: Throughput */}
          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Capacity Throughput</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8' }}>
              {activeSimulationMetrics.throughputQps}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Sustained ingress load
            </div>
          </div>

          {/* Gauge 3: Availability SLA */}
          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Uptime SLA</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: activeSimulationMetrics.availabilityPercent >= 99.9 ? '#34d399' : '#fbbf24' }}>
              {activeSimulationMetrics.availabilityPercent.toFixed(2)}%
            </div>
            <div style={{ fontSize: '0.68rem', color: activeSimulationMetrics.availabilityPercent >= 99.9 ? '#34d399' : '#fbbf24' }}>
              {activeSimulationMetrics.availabilityPercent >= 99.9 ? '🛡️ Four Nines High' : '⚠️ Degraded SLA'}
            </div>
          </div>

          {/* Gauge 4: Cloud Cost */}
          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Est. Cloud Cost</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#c084fc' }}>
              ${activeSimulationMetrics.monthlyCost.toLocaleString()}/mo
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              FinOps optimized infra
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Available Components Bank ── */}
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

      {/* ── 6. Feedback & Diagnostics ── */}
      {feedbackMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background:
              simulationState === 'success'
                ? 'rgba(52, 211, 153, 0.15)'
                : simulationState === 'simulating'
                ? 'rgba(56, 189, 248, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${
              simulationState === 'success'
                ? '#34d399'
                : simulationState === 'simulating'
                ? '#38bdf8'
                : '#ef4444'
            }`,
            color:
              simulationState === 'success'
                ? '#34d399'
                : simulationState === 'simulating'
                ? '#38bdf8'
                : '#fca5a5',
            fontSize: '0.84rem',
            lineHeight: 1.45,
            marginBottom: '16px',
          }}
        >
          {feedbackMessage}
        </div>
      )}

      {/* ── 7. Architectural Takeaways Accordion (when solved or toggled) ── */}
      {simulationState === 'success' && activeScenario.keyDesignTakeaways && (
        <div
          style={{
            marginBottom: '16px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1.5px solid rgba(251, 191, 36, 0.4)',
          }}
        >
          <div
            onClick={() => setShowTakeaways(!showTakeaways)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#fbbf24',
              fontWeight: 800,
              fontSize: '0.88rem',
            }}
          >
            <span>🎓 HelloInterview Senior Architecture Deep-Dive ({activeScenario.title})</span>
            <span>{showTakeaways ? '▲ Hide' : '▼ View Takeaways'}</span>
          </div>

          {showTakeaways && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#f8fafc', lineHeight: 1.5 }}>
              <div style={{ marginBottom: '8px', color: 'rgba(255, 255, 255, 0.85)' }}>{activeScenario.explanation}</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255, 255, 255, 0.75)' }}>
                {activeScenario.keyDesignTakeaways.map((takeaway, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Test Button */}
      <button
        type="button"
        disabled={simulationState === 'simulating'}
        onClick={handleTestArchitecture}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          background: simulationState === 'simulating'
            ? 'rgba(56, 189, 248, 0.4)'
            : 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
          border: 'none',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '0.95rem',
          cursor: simulationState === 'simulating' ? 'wait' : 'pointer',
          boxShadow: '0 4px 16px rgba(56, 189, 248, 0.4)',
          transition: 'all 0.2s ease',
        }}
      >
        {simulationState === 'simulating' ? '⏳ Running Traffic Simulation...' : '🚀 Simulate Traffic & Load Test'}
      </button>
    </div>
  );
}
