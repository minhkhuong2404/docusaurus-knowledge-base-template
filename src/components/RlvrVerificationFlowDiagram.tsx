import React, { useState } from 'react';

type RLMode = 'rlvr' | 'rlhf' | 'rlcd';

interface RolloutResult {
  id: string;
  name: string;
  codeSnippet: string;
  sandboxCheck: string;
  passed: boolean;
  reward: number;
  grpoAdvantage: number;
  explanation: string;
}

const RLVR_ROLLOUTS: RolloutResult[] = [
  {
    id: 'rollout-1',
    name: 'Rollout y₁ (CoT + Verified Path)',
    codeSnippet: 'def is_palindrome(s: str) -> bool:\n    cleaned = [c.lower() for c in s if c.isalnum()]\n    return cleaned == cleaned[::-1]',
    sandboxCheck: 'PyTest Suite: 15/15 passed in isolated gVisor container (42ms)',
    passed: true,
    reward: 1.0,
    grpoAdvantage: 0.707,
    explanation: 'Strictly satisfies all boundary test cases (empty string, punctuation, unicode case-folding). Policy weights boosted via GRPO.',
  },
  {
    id: 'rollout-2',
    name: 'Rollout y₂ (Flawed Chain-of-Thought)',
    codeSnippet: 'def is_palindrome(s: str) -> bool:\n    return s == s[::-1]  # Fails punctuation/casing',
    sandboxCheck: 'PyTest Suite: 9 failed, 6 passed (AssertionError on "A man, a plan...")',
    passed: false,
    reward: -1.0,
    grpoAdvantage: -0.707,
    explanation: 'Deterministic verifier flags regression. Zero human subjective opinion involved; model penalizes unhandled edge cases.',
  },
];

export default function RlvrVerificationFlowDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<RLMode>('rlvr');
  const [selectedRollout, setSelectedRollout] = useState<string>('rollout-1');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '24px 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '14.5px' }}>
          RL Post-Training Mechanics: RLVR Verifier Loop &amp; GRPO vs RLHF
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setMode('rlvr')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: mode === 'rlvr' ? '#34d399' : 'rgba(255, 255, 255, 0.1)',
              backgroundColor: mode === 'rlvr' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: mode === 'rlvr' ? '#34d399' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            RLVR (Deterministic)
          </button>
          <button
            type="button"
            onClick={() => setMode('rlhf')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: mode === 'rlhf' ? '#a78bfa' : 'rgba(255, 255, 255, 0.1)',
              backgroundColor: mode === 'rlhf' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: mode === 'rlhf' ? '#a78bfa' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            RLHF (Human Pref)
          </button>
          <button
            type="button"
            onClick={() => setMode('rlcd')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: mode === 'rlcd' ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
              backgroundColor: mode === 'rlcd' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: mode === 'rlcd' ? '#fbbf24' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            RLCD (Calibrated)
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Interactive Mode Description */}
        {mode === 'rlvr' && (
          <div>
            <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginBottom: '14px', lineHeight: 1.45 }}>
              <strong style={{ color: '#34d399' }}>RLVR (Reinforcement Learning with Verifiable Rewards):</strong> The foundation of DeepSeek R1 and OpenAI o1. Rather than subjective human raters, candidate rollouts are executed against <strong style={{ color: '#ffffff' }}>isolated automated compilers and unit tests</strong>. Group Relative Policy Optimization (GRPO) calculates normalized advantage without requiring a dedicated memory-heavy critic network.
            </div>

            {/* SVG Visual Flow Graph with Flowing Conduits */}
            <div
              className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg"
              style={{
                padding: '16px 14px',
                marginBottom: '16px',
              }}
            >
              <svg width="100%" height="150" viewBox="0 0 760 150" style={{ display: 'block', overflow: 'visible' }}>
                <defs>
                  <marker id="rlvr-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#34d399" />
                  </marker>
                  <marker id="rlvr-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f87171" />
                  </marker>
                  <marker id="rlvr-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Prompt Node */}
                <rect x="10" y="50" width="160" height="50" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="90" y="72" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Coding / Math Prompt</text>
                <text x="90" y="88" textAnchor="middle" fill="#94a3b8" fontSize="10">Batch x ~ D_train</text>

                {/* Conduits from Prompt to Candidate Rollouts */}
                <path
                  d="M 170 65 C 210 65, 220 30, 260 30"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#rlvr-blue)"
                  strokeDasharray={isSimulating ? '5 4' : 'none'}
                  className={isSimulating ? 'interactive-diagram-flowing-path' : ''}
                />
                <path
                  d="M 170 85 C 210 85, 220 120, 260 120"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#rlvr-blue)"
                  strokeDasharray={isSimulating ? '5 4' : 'none'}
                  className={isSimulating ? 'interactive-diagram-flowing-path' : ''}
                />

                {/* Rollout 1 Node (Pass) */}
                <g onClick={() => setSelectedRollout('rollout-1')} style={{ cursor: 'pointer' }}>
                  <rect
                    x="270"
                    y="10"
                    width="180"
                    height="42"
                    rx="6"
                    fill={selectedRollout === 'rollout-1' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(15, 23, 42, 0.85)'}
                    stroke="#34d399"
                    strokeWidth={selectedRollout === 'rollout-1' ? '2.5' : '1.2'}
                  />
                  <text x="360" y="28" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Rollout y₁ (Pass)</text>
                  <text x="360" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9.5">CoT Reasoning Sequence</text>
                </g>

                {/* Rollout 2 Node (Fail) */}
                <g onClick={() => setSelectedRollout('rollout-2')} style={{ cursor: 'pointer' }}>
                  <rect
                    x="270"
                    y="98"
                    width="180"
                    height="42"
                    rx="6"
                    fill={selectedRollout === 'rollout-2' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(15, 23, 42, 0.85)'}
                    stroke="#f87171"
                    strokeWidth={selectedRollout === 'rollout-2' ? '2.5' : '1.2'}
                  />
                  <text x="360" y="116" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Rollout y₂ (Fail)</text>
                  <text x="360" y="132" textAnchor="middle" fill="#94a3b8" fontSize="9.5">Defective Logic Branch</text>
                </g>

                {/* Conduits from Rollouts to Sandbox Verifiers */}
                <path
                  d="M 450 31 L 520 31"
                  stroke="#34d399"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#rlvr-green)"
                  strokeDasharray={isSimulating ? '5 4' : 'none'}
                  className={isSimulating ? 'interactive-diagram-flowing-path' : ''}
                />
                <path
                  d="M 450 119 L 520 119"
                  stroke="#f87171"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#rlvr-red)"
                  strokeDasharray={isSimulating ? '5 4' : 'none'}
                  className={isSimulating ? 'interactive-diagram-flowing-path' : ''}
                />

                {/* Verifier Nodes */}
                <rect x="530" y="10" width="220" height="42" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="640" y="28" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Isolated Sandbox (PyTest Pass)</text>
                <text x="640" y="44" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">Reward r(y₁) = +1.0 | A₁ = +0.707</text>

                <rect x="530" y="98" width="220" height="42" rx="6" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1.5" />
                <text x="640" y="116" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Isolated Sandbox (Assertion Fail)</text>
                <text x="640" y="132" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">Reward r(y₂) = -1.0 | A₂ = -0.707</text>
              </svg>
            </div>

            {/* Rollout Inspection Split Pane */}
            <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              <div
                onClick={() => setSelectedRollout('rollout-1')}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selectedRollout === 'rollout-1' ? '2px solid #34d399' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: selectedRollout === 'rollout-1' ? 'rgba(52, 211, 153, 0.12)' : '#0c0e17',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#34d399' }}>Candidate y₁ (Correct)</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
                    Reward: +1.0
                  </span>
                </div>
                <pre style={{ fontSize: '10.5px', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', margin: '0 0 6px 0', color: '#e2e8f0' }}>
                  {RLVR_ROLLOUTS[0].codeSnippet}
                </pre>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                  ✓ {RLVR_ROLLOUTS[0].sandboxCheck}
                </div>
              </div>

              <div
                onClick={() => setSelectedRollout('rollout-2')}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selectedRollout === 'rollout-2' ? '2px solid #f87171' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: selectedRollout === 'rollout-2' ? 'rgba(248, 113, 113, 0.12)' : '#0c0e17',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#f87171' }}>Candidate y₂ (Flawed)</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(248, 113, 113, 0.2)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.4)' }}>
                    Reward: -1.0
                  </span>
                </div>
                <pre style={{ fontSize: '10.5px', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', margin: '0 0 6px 0', color: '#e2e8f0' }}>
                  {RLVR_ROLLOUTS[1].codeSnippet}
                </pre>
                <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>
                  ✗ {RLVR_ROLLOUTS[1].sandboxCheck}
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'rlhf' && (
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#0c0e17', border: '1.5px solid rgba(167, 139, 250, 0.4)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#a78bfa', marginBottom: '10px' }}>
              RLHF (Reinforcement Learning from Human Feedback) Architecture
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <strong style={{ fontSize: '11px', color: '#a78bfa' }}>Step 1: Pairwise Comparisons</strong>
                <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '4px 0 0 0' }}>
                  Annotators label preferred completion (y_w ≻ y_l) based on subjective helpfulness and conversational tone.
                </p>
              </div>
              <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <strong style={{ fontSize: '11px', color: '#a78bfa' }}>Step 2: Bradley-Terry RM</strong>
                <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '4px 0 0 0' }}>
                  Train scalar reward model r_ψ(x, y) minimizing logistic loss over pairwise score differences.
                </p>
              </div>
              <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <strong style={{ fontSize: '11px', color: '#a78bfa' }}>Step 3: PPO / DPO Optimization</strong>
                <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '4px 0 0 0' }}>
                  Update policy π_θ anchored by KL divergence penalty β D_KL to prevent policy collapse into gibberish.
                </p>
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
              ⚠️ <strong>Production Limitation:</strong> RLHF models suffer from <strong>Verbosity Bias</strong> (padding answers to appear authoritative) and <strong>Sycophancy</strong> (flattering incorrect user premises).
            </div>
          </div>
        )}

        {mode === 'rlcd' && (
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#0c0e17', border: '1.5px solid rgba(251, 191, 36, 0.4)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#fbbf24', marginBottom: '8px' }}>
              RLCD (Reinforcement Learning for Calibrated Decisions) Architecture
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '12px' }}>
              Unlike conversational generators, System 1 decision models (like TypeSafe Jev) optimize for <strong style={{ color: '#ffffff' }}>epistemic probability calibration</strong> via Proper Scoring Rules (Brier Score).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>Brier Score Loss</div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', padding: '6px 8px', borderRadius: '4px', backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#38bdf8' }}>
                  BS = 1/K ∑ (p_k - o_k)²
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Penalizes overconfidence quadratically: a model predicting 99% probability on an event that occurs only 60% of the time is heavily penalized.
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>Production SLA Guarantee</div>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, marginBottom: '4px' }}>
                  P(Correct | Stated Conf = 0.90) = 0.90
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Guarantees that across 100 historical automated transactions gated at 90% confidence, exactly 90 are empirically correct, enabling zero-touch automation.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
