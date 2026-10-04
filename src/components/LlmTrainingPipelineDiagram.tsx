import React, { useState } from 'react';

interface StageData {
  id: string;
  name: string;
  shortName: string;
  phase: string;
  tokens: string;
  compute: string;
  loss: string;
  artifact: string;
  hardware: string;
  color: string;
  description: string;
  keyChallenge: string;
}

const STAGES: StageData[] = [
  {
    id: 'pretraining',
    name: '1. Pre-Training',
    shortName: 'Pre-Training',
    phase: 'Phase 1',
    tokens: '15+ Trillion Tokens',
    compute: '~10²⁵ FLOPs (Thousands of GPUs for months)',
    loss: 'L_CLM = - ∑ log P(w_t | w_<t)',
    artifact: 'Base Model (LLaMA-3-Base, DeepSeek-V3-Base)',
    hardware: '3D Parallelism: Tensor (TP) + Pipeline (PP) + ZeRO-3 Data Parallelism',
    color: '#38bdf8',
    description: 'Predicts the next token over trillions of tokens of web crawls, code repositories, books, and scientific papers. Establishes broad general knowledge and linguistic reasoning foundations.',
    keyChallenge: 'Hardware memory wall (16 bytes/param static Adam state) and long-running cluster fault tolerance (checkpointing / silent data corruption).',
  },
  {
    id: 'sft',
    name: '2. Supervised Fine-Tuning (SFT)',
    shortName: 'SFT Phase',
    phase: 'Phase 2',
    tokens: '10k–100k Curated Pairs',
    compute: 'Hundreds of GPU hours',
    loss: 'Cross-entropy loss masked strictly on completion tokens y',
    artifact: 'Instruct / Chat Model (Non-reasoning baseline)',
    hardware: 'Standard Data Parallelism / FSDP on 8–64 GPUs',
    color: '#34d399',
    description: 'Teaches conversational syntax, instruction adherence, and tool use conventions via curated prompt-response pairs. Gating loss solely on output tokens preserves pre-trained knowledge.',
    keyChallenge: 'Teacher-forcing distribution shift: model mimics conversational style without validating logical veracity or self-correction.',
  },
  {
    id: 'rl-post',
    name: '3. RL Post-Training',
    shortName: 'RL Post-Training',
    phase: 'Phase 3',
    tokens: 'Prompt Rollouts & Verifier Trajectories',
    compute: 'Iterative actor-critic rollouts & policy updates',
    loss: 'PPO, DPO, or GRPO (Group Relative Policy Optimization) with KL penalty',
    artifact: 'Reasoning Frontier Model (DeepSeek R1, o1) or Calibrated Decision Model (Jev)',
    hardware: 'Distributed Rollout Engine + Isolated Verification Sandboxes',
    color: '#fbbf24',
    description: 'Optimizes generation policies via reward signals: subjective human preferences (RLHF), automated compiler/math verifiers (RLVR), or epistemic calibration rules (RLCD).',
    keyChallenge: 'Reward hacking in RLHF (verbosity bias and sycophancy), or container escapes during hostile code execution in RLVR sandboxes.',
  },
];

export default function LlmTrainingPipelineDiagram(): React.JSX.Element {
  const [selectedStage, setSelectedStage] = useState<string>('pretraining');
  const [animating, setAnimating] = useState<boolean>(true);

  const activeStage = STAGES.find(s => s.id === selectedStage) || STAGES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '24px 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '14.5px' }}>
          End-to-End LLM Lifecycle: Physical Compute &amp; Artifact Progression
        </span>
        <button
          type="button"
          onClick={() => setAnimating(!animating)}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            backgroundColor: animating ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: animating ? '#38bdf8' : '#94a3b8',
            transition: 'all 0.15s ease',
          }}
        >
          {animating ? '● Flow Active' : '○ Flow Paused'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Helper Note */}
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
          Click any lifecycle phase to inspect its training objective, compute cluster footprint, loss mechanics, and resulting artifact:
        </div>

        {/* Visual Animated SVG Pipeline Canvas */}
        <div
          className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg"
          style={{
            padding: '16px 12px',
            marginBottom: '16px',
          }}
        >
          <svg width="100%" height="96" viewBox="0 0 760 96" style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <marker id="llm-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="llm-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#34d399" />
              </marker>
            </defs>

            {/* Stage 1: Pre-Training */}
            <g
              onClick={() => setSelectedStage('pretraining')}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x="8"
                y="18"
                width="196"
                height="60"
                rx="8"
                fill={selectedStage === 'pretraining' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(15, 23, 42, 0.85)'}
                stroke="#38bdf8"
                strokeWidth={selectedStage === 'pretraining' ? '2.5' : '1.2'}
              />
              <text x="106" y="42" textAnchor="middle" fill="#38bdf8" fontSize="12.5" fontWeight="700">
                1. Pre-Training
              </text>
              <text x="106" y="60" textAnchor="middle" fill="#94a3b8" fontSize="10.5">
                Trillions of Web/Code Tokens
              </text>
            </g>

            {/* Connecting Conduits Stage 1 -> Stage 2 */}
            <path
              d="M 204 48 L 268 48"
              stroke="#38bdf8"
              strokeWidth="2.2"
              fill="none"
              markerEnd="url(#llm-arrow-blue)"
              strokeDasharray={animating ? '5 4' : 'none'}
              className={animating ? 'interactive-diagram-flowing-path' : ''}
            />

            {/* Stage 2: SFT */}
            <g
              onClick={() => setSelectedStage('sft')}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x="276"
                y="18"
                width="196"
                height="60"
                rx="8"
                fill={selectedStage === 'sft' ? 'rgba(52, 211, 153, 0.22)' : 'rgba(15, 23, 42, 0.85)'}
                stroke="#34d399"
                strokeWidth={selectedStage === 'sft' ? '2.5' : '1.2'}
              />
              <text x="374" y="42" textAnchor="middle" fill="#34d399" fontSize="12.5" fontWeight="700">
                2. SFT (Supervised)
              </text>
              <text x="374" y="60" textAnchor="middle" fill="#94a3b8" fontSize="10.5">
                Instruction Demonstration
              </text>
            </g>

            {/* Connecting Conduits Stage 2 -> Stage 3 */}
            <path
              d="M 472 48 L 536 48"
              stroke="#34d399"
              strokeWidth="2.2"
              fill="none"
              markerEnd="url(#llm-arrow-green)"
              strokeDasharray={animating ? '5 4' : 'none'}
              className={animating ? 'interactive-diagram-flowing-path' : ''}
            />

            {/* Stage 3: RL Post-Training */}
            <g
              onClick={() => setSelectedStage('rl-post')}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x="544"
                y="18"
                width="208"
                height="60"
                rx="8"
                fill={selectedStage === 'rl-post' ? 'rgba(251, 191, 36, 0.22)' : 'rgba(15, 23, 42, 0.85)'}
                stroke="#fbbf24"
                strokeWidth={selectedStage === 'rl-post' ? '2.5' : '1.2'}
              />
              <text x="648" y="42" textAnchor="middle" fill="#fbbf24" fontSize="12.5" fontWeight="700">
                3. RL Post-Training
              </text>
              <text x="648" y="60" textAnchor="middle" fill="#94a3b8" fontSize="10.5">
                RLHF / RLVR / RLCD / Jev
              </text>
            </g>
          </svg>
        </div>

        {/* Stage Selector Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {STAGES.map((stg) => {
            const isSelected = selectedStage === stg.id;
            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => setSelectedStage(stg.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `2px solid ${stg.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? `${stg.color}20` : 'rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: isSelected ? stg.color : '#e2e8f0' }}>
                    {stg.name}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                    {stg.phase}
                  </span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  {stg.tokens}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Card */}
        <div
          style={{
            backgroundColor: '#0c0e17',
            border: `1.5px solid ${activeStage.color}50`,
            borderRadius: '10px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: activeStage.color }}>
              {activeStage.name} Details &amp; Operational Invariants
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', backgroundColor: `${activeStage.color}20`, color: activeStage.color, border: `1px solid ${activeStage.color}60` }}>
              Artifact: {activeStage.artifact}
            </span>
          </div>

          <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '14px' }}>
            {activeStage.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', marginBottom: '4px' }}>
                Mathematical Loss Formulation
              </div>
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '11px', padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#38bdf8', marginBottom: '12px' }}>
                {activeStage.loss}
              </div>

              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', marginBottom: '4px' }}>
                Distributed Compute Infrastructure
              </div>
              <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.4 }}>
                {activeStage.hardware}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', marginBottom: '4px' }}>
                Compute Budget &amp; Scale
              </div>
              <div style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '12px', lineHeight: 1.4 }}>
                {activeStage.compute}
              </div>

              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f87171', marginBottom: '4px' }}>
                Core Architectural Gotcha
              </div>
              <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.4, padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                {activeStage.keyChallenge}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
