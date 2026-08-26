#!/usr/bin/env python3
"""
create_all_dsa_components.py
Generates 20 custom interactive React SVG diagram components (Weeks 1 to 20)
following DESIGNS.md guidelines and embeds them into the respective markdown files.
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMPONENTS_DIR = os.path.join(BASE_DIR, 'src', 'components')
DSA_DOCS_DIR = os.path.join(BASE_DIR, 'docs', 'technical-knowledge', 'dsa')

# ==============================================================================
# 20 COMPONENT DEFINITIONS
# ==============================================================================

COMPONENTS = {}

# ------------------------------------------------------------------------------
# 1. Week 1: Arrays, Strings & Prefix Sums
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek1ArraysDiagram'] = '''import React, { useState, useEffect } from 'react';

export default function DsaWeek1ArraysDiagram(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'build' | 'query'>('build');

  const nums = [3, 1, 4, 1, 5, 9, 2, 6];
  const prefix = [3, 4, 8, 9, 14, 23, 25, 31];

  const buildSteps = [
    { idx: 0, formula: 'Prefix[0] = nums[0] = 3', val: 3, desc: 'Base step: First element equals nums[0].' },
    { idx: 1, formula: 'Prefix[1] = Prefix[0] + nums[1] = 3 + 1 = 4', val: 4, desc: 'Accumulate sum of first 2 elements.' },
    { idx: 2, formula: 'Prefix[2] = Prefix[1] + nums[2] = 4 + 4 = 8', val: 8, desc: 'Accumulate sum of first 3 elements.' },
    { idx: 3, formula: 'Prefix[3] = Prefix[2] + nums[3] = 8 + 1 = 9', val: 9, desc: 'Accumulate sum of first 4 elements.' },
    { idx: 4, formula: 'Prefix[4] = Prefix[3] + nums[4] = 9 + 5 = 14', val: 14, desc: 'Accumulate sum of first 5 elements.' },
    { idx: 5, formula: 'Prefix[5] = Prefix[4] + nums[5] = 14 + 9 = 23', val: 23, desc: 'Accumulate sum of first 6 elements.' },
    { idx: 6, formula: 'Prefix[6] = Prefix[5] + nums[6] = 23 + 2 = 25', val: 25, desc: 'Accumulate sum of first 7 elements.' },
    { idx: 7, formula: 'Prefix[7] = Prefix[6] + nums[7] = 25 + 6 = 31', val: 31, desc: 'Complete Prefix Sum array: Total sum = 31.' },
  ];

  const querySteps = [
    { L: 2, R: 5, formula: 'Sum(2..5) = Prefix[5] - Prefix[1] = 23 - 4 = 19', expected: '4 + 1 + 5 + 9 = 19', desc: 'Query range [2..5] in O(1) time without looping!' },
    { L: 0, R: 4, formula: 'Sum(0..4) = Prefix[4] = 14', expected: '3 + 1 + 4 + 1 + 5 = 14', desc: 'Query starting at index 0 returns Prefix[R] directly.' },
    { L: 3, R: 7, formula: 'Sum(3..7) = Prefix[7] - Prefix[2] = 31 - 8 = 23', expected: '1 + 5 + 9 + 2 + 6 = 23', desc: 'Query suffix range [3..7] in O(1) time.' },
  ];

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      const maxSteps = activeMode === 'build' ? buildSteps.length - 1 : querySteps.length - 1;
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeMode]);

  const activeBuild = buildSteps[Math.min(currentStep, buildSteps.length - 1)];
  const activeQuery = querySteps[Math.min(currentStep, querySteps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Prefix Sum Array & Range Query Simulation
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { setActiveMode('build'); setCurrentStep(0); setIsPlaying(false); }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: activeMode === 'build' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              background: activeMode === 'build' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
              color: activeMode === 'build' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Array Construction
          </button>
          <button
            onClick={() => { setActiveMode('query'); setCurrentStep(0); setIsPlaying(false); }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: activeMode === 'query' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
              background: activeMode === 'query' ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.04)',
              color: activeMode === 'query' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            O(1) Range Query
          </button>
        </div>
      </div>

      {/* Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: isPlaying ? '#f87171' : '#38bdf8', color: '#090b14', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Animate'}
          </button>
          <button
            onClick={() => { setIsPlaying(false); setCurrentStep((s) => Math.max(0, s - 1)); }}
            disabled={currentStep === 0}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '12px', cursor: 'pointer' }}
          >
            ⏮ Prev
          </button>
          <button
            onClick={() => {
              const maxSteps = activeMode === 'build' ? buildSteps.length - 1 : querySteps.length - 1;
              setIsPlaying(false);
              setCurrentStep((s) => Math.min(maxSteps, s + 1));
            }}
            disabled={currentStep >= (activeMode === 'build' ? buildSteps.length - 1 : querySteps.length - 1)}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '12px', cursor: 'pointer' }}
          >
            Next ⏭
          </button>
          <button
            onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content-secondary)', fontSize: '12px', cursor: 'pointer' }}
          >
            🔄 Reset
          </button>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Step <strong>{currentStep + 1}</strong> of <strong>{activeMode === 'build' ? buildSteps.length : querySteps.length}</strong>
        </span>
      </div>

      {/* SVG Visualization Canvas */}
      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 680 180" style={{ width: '100%', minWidth: '550px', height: 'auto' }}>
          <defs>
            <pattern id="dot-grid-w1" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.04)" />
            </pattern>
            <marker id="arrow-w1" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid-w1)" rx="8" />

          {/* Original Array Row */}
          <text x="20" y="38" fill="#94a3b8" fontSize="11" fontWeight="700">Original nums[ ]</text>
          {nums.map((num, i) => {
            const isHighlight = activeMode === 'build' ? i === activeBuild.idx : (i >= activeQuery.L && i <= activeQuery.R);
            return (
              <g key={`num-${i}`} transform={`translate(${120 + i * 65}, 15)`}>
                <rect width="52" height="34" rx="6" fill={isHighlight ? 'rgba(56,189,248,0.22)' : 'rgba(255,255,255,0.03)'} stroke={isHighlight ? '#38bdf8' : 'rgba(255,255,255,0.12)'} strokeWidth={isHighlight ? 2 : 1} />
                <text x="26" y="22" textAnchor="middle" fill={isHighlight ? '#38bdf8' : '#e2e8f0'} fontSize="13" fontWeight="700">{num}</text>
                <text x="26" y="46" textAnchor="middle" fill="#64748b" fontSize="9">i={i}</text>
              </g>
            );
          })}

          {/* Animated Transition Arrow */}
          {activeMode === 'build' && (
            <path d={`M ${146 + activeBuild.idx * 65} 55 L ${146 + activeBuild.idx * 65} 95`} stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-w1)" />
          )}

          {/* Prefix Sum Array Row */}
          <text x="20" y="128" fill="#34d399" fontSize="11" fontWeight="700">Prefix Sum[ ]</text>
          {prefix.map((pVal, i) => {
            const isFilled = activeMode === 'build' ? i <= activeBuild.idx : true;
            const isCurrent = activeMode === 'build' ? i === activeBuild.idx : (i === activeQuery.R || i === activeQuery.L - 1);
            return (
              <g key={`pref-${i}`} transform={`translate(${120 + i * 65}, 105)`}>
                <rect width="52" height="34" rx="6" fill={isCurrent ? 'rgba(52,211,153,0.25)' : isFilled ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)'} stroke={isCurrent ? '#34d399' : isFilled ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'} strokeWidth={isCurrent ? 2 : 1} />
                <text x="26" y="22" textAnchor="middle" fill={isFilled ? '#34d399' : '#475569'} fontSize="13" fontWeight="700">
                  {isFilled ? pVal : '-'}
                </text>
                <text x="26" y="46" textAnchor="middle" fill="#64748b" fontSize="9">P[{i}]</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info & Metrics Card */}
      <div className="interactive-diagram-details-card details-blue" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: activeMode === 'build' ? '#38bdf8' : '#34d399', fontSize: '13px' }}>
            {activeMode === 'build' ? activeBuild.formula : activeQuery.formula}
          </span>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', color: '#fbbf24', fontWeight: 600 }}>
            Time: {activeMode === 'build' ? 'O(N) build' : 'O(1) lookup'} | Space: O(N)
          </span>
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
          {activeMode === 'build' ? activeBuild.desc : `${activeQuery.desc} Expected Sum: ${activeQuery.expected}`}
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 2. Week 2: Two Pointers & Sliding Window
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek2TwoPointersDiagram'] = '''import React, { useState, useEffect } from 'react';

export default function DsaWeek2TwoPointersDiagram(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mode, setMode] = useState<'twoptr' | 'window'>('twoptr');

  // Mode 1: Two Sum II (Sorted Array: target = 13)
  const nums2Sum = [2, 3, 5, 8, 11, 15];
  const steps2Sum = [
    { left: 0, right: 5, sum: 17, action: 'Sum = 2 + 15 = 17 > 13. Move Right pointer Left (R--)', targetMet: false },
    { left: 0, right: 4, sum: 13, action: 'Sum = 2 + 11 = 13 == 13. TARGET FOUND! Indices [0, 4]', targetMet: true },
  ];

  // Mode 2: Dynamic Sliding Window (Max sum subarray of size <= 3 or target sum <= 8)
  const windowArray = [2, 1, 5, 2, 3, 2];
  const stepsWindow = [
    { L: 0, R: 0, win: [2], sum: 2, desc: 'Expand right pointer: Window = [2], Sum = 2' },
    { L: 0, R: 1, win: [2, 1], sum: 3, desc: 'Expand right: Window = [2, 1], Sum = 3' },
    { L: 0, R: 2, win: [2, 1, 5], sum: 8, desc: 'Expand right: Window = [2, 1, 5], Sum = 8 (Target reached!)' },
    { L: 1, R: 2, win: [1, 5], sum: 6, desc: 'Shrink left pointer: Window = [1, 5], Sum = 6' },
    { L: 1, R: 3, win: [1, 5, 2], sum: 8, desc: 'Expand right: Window = [1, 5, 2], Sum = 8' },
  ];

  const steps = mode === 'twoptr' ? steps2Sum : stepsWindow;

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((s) => {
          if (s >= steps.length - 1) {
            setIsPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps, mode]);

  const active = steps[Math.min(currentStep, steps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Two Pointers & Sliding Window Simulation
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { setMode('twoptr'); setCurrentStep(0); setIsPlaying(false); }}
            style={{ padding: '4px 10px', borderRadius: '6px', border: mode === 'twoptr' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', background: mode === 'twoptr' ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.04)', color: mode === 'twoptr' ? '#34d399' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Convergent Two Pointers
          </button>
          <button
            onClick={() => { setMode('window'); setCurrentStep(0); setIsPlaying(false); }}
            style={{ padding: '4px 10px', borderRadius: '6px', border: mode === 'window' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', background: mode === 'window' ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.04)', color: mode === 'window' ? '#fbbf24' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Sliding Window
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: isPlaying ? '#f87171' : '#34d399', color: '#090b14', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
            {isPlaying ? '⏸ Pause' : '▶ Animate'}
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStep((s) => Math.max(0, s - 1)); }} disabled={currentStep === 0} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '12px', cursor: 'pointer' }}>
            ⏮ Prev
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStep((s) => Math.min(steps.length - 1, s + 1)); }} disabled={currentStep >= steps.length - 1} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '12px', cursor: 'pointer' }}>
            Next ⏭
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStep(0); }} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content-secondary)', fontSize: '12px', cursor: 'pointer' }}>
            🔄 Reset
          </button>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Step <strong>{currentStep + 1}</strong> of <strong>{steps.length}</strong>
        </span>
      </div>

      {/* SVG Canvas */}
      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 650 150" style={{ width: '100%', minWidth: '500px', height: 'auto' }}>
          <defs>
            <marker id="arrow-down-w2" viewBox="0 0 10 10" refX="5" refY="6" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 1 0 L 5 10 L 9 0 z" fill="#38bdf8" />
            </marker>
          </defs>

          {mode === 'twoptr' ? (
            <>
              {nums2Sum.map((val, i) => {
                const s = active as typeof steps2Sum[0];
                const isLeft = i === s.left;
                const isRight = i === s.right;
                const isTarget = s.targetMet && (isLeft || isRight);
                return (
                  <g key={`num-${i}`} transform={`translate(${100 + i * 80}, 50)`}>
                    <rect width="64" height="42" rx="8" fill={isTarget ? 'rgba(52,211,153,0.3)' : isLeft || isRight ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)'} stroke={isTarget ? '#34d399' : isLeft || isRight ? '#38bdf8' : 'rgba(255,255,255,0.12)'} strokeWidth={isTarget || isLeft || isRight ? 2 : 1} />
                    <text x="32" y="26" textAnchor="middle" fill={isTarget ? '#34d399' : isLeft || isRight ? '#38bdf8' : '#e2e8f0'} fontSize="15" fontWeight="700">{val}</text>
                    <text x="32" y="58" textAnchor="middle" fill="#64748b" fontSize="10">i={i}</text>

                    {isLeft && (
                      <g transform="translate(32, -15)">
                        <text x="0" y="-12" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">LEFT</text>
                        <path d="M 0 -8 L 0 5" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-down-w2)" />
                      </g>
                    )}
                    {isRight && (
                      <g transform="translate(32, -15)">
                        <text x="0" y="-12" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">RIGHT</text>
                        <path d="M 0 -8 L 0 5" stroke="#f87171" strokeWidth="2" markerEnd="url(#arrow-down-w2)" />
                      </g>
                    )}
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {windowArray.map((val, i) => {
                const s = active as typeof stepsWindow[0];
                const inWin = i >= s.L && i <= s.R;
                return (
                  <g key={`win-${i}`} transform={`translate(${100 + i * 75}, 50)`}>
                    <rect width="60" height="42" rx="8" fill={inWin ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.03)'} stroke={inWin ? '#fbbf24' : 'rgba(255,255,255,0.12)'} strokeWidth={inWin ? 2 : 1} />
                    <text x="30" y="26" textAnchor="middle" fill={inWin ? '#fbbf24' : '#e2e8f0'} fontSize="15" fontWeight="700">{val}</text>
                    <text x="30" y="58" textAnchor="middle" fill="#64748b" fontSize="10">i={i}</text>
                    {i === s.L && (
                      <text x="30" y="-10" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">L ↓</text>
                    )}
                    {i === s.R && (
                      <text x="30" y="-10" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">R ↓</text>
                    )}
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      {/* Action details */}
      <div className="interactive-diagram-details-card details-green" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: mode === 'twoptr' ? '#34d399' : '#fbbf24', fontSize: '13px', marginBottom: '4px' }}>
          {mode === 'twoptr' ? (active as any).action : (active as any).desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          {mode === 'twoptr' ? `Current Sum: ${(active as any).sum} vs Target: 13 | Single-pass O(N) convergence.` : `Window sum: ${(active as any).sum} | Expands right and contracts left in amortized O(N).`}
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 3. Week 3: Linked Lists & Pointers
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek3LinkedListDiagram'] = '''import React, { useState, useEffect } from 'react';

export default function DsaWeek3LinkedListDiagram(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [algo, setAlgo] = useState<'cycle' | 'reverse'>('cycle');

  // Cycle Detection (Floyd's Tortoise & Hare)
  const nodesCycle = [
    { id: 0, val: 3, x: 80, y: 80 },
    { id: 1, val: 2, x: 180, y: 80 },
    { id: 2, val: 0, x: 280, y: 80 },
    { id: 3, val: -4, x: 380, y: 80 },
  ];
  // Node 3 loops back to Node 1

  const cycleSteps = [
    { slow: 0, fast: 0, desc: 'Init: Slow (Tortoise, 1x) and Fast (Hare, 2x) both start at Head (Node 3).' },
    { slow: 1, fast: 2, desc: 'Step 1: Slow advances 1 step (Node 2), Fast advances 2 steps (Node 0).' },
    { slow: 2, fast: 1, desc: 'Step 2: Slow moves to Node 0, Fast loops back to Node 2.' },
    { slow: 3, fast: 3, desc: 'Step 3: Slow moves to Node -4, Fast loops to Node -4. SLOW == FAST -> CYCLE DETECTED! 🎉' },
  ];

  // In-Place Reversal: 1 -> 2 -> 3 -> 4 -> null
  const reverseSteps = [
    { prev: 'null', curr: 1, next: 2, desc: 'Init: prev = null, curr = Node(1), next = Node(2)' },
    { prev: 1, curr: 2, next: 3, desc: 'curr.next reversed to point to null. prev becomes Node(1), curr becomes Node(2).' },
    { prev: 2, curr: 3, next: 4, desc: 'curr.next reversed to point to Node(1). prev becomes Node(2), curr becomes Node(3).' },
    { prev: 3, curr: 4, next: 'null', desc: 'curr.next reversed to point to Node(2). prev becomes Node(3), curr becomes Node(4).' },
    { prev: 4, curr: 'null', next: 'null', desc: 'Finished! New Head is Node(4). Fully reversed in O(N) time and O(1) auxiliary space.' },
  ];

  const steps = algo === 'cycle' ? cycleSteps : reverseSteps;

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((s) => {
          if (s >= steps.length - 1) {
            setIsPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps, algo]);

  const active = steps[Math.min(currentStep, steps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="12" r="3" />
          <line x1="9" y1="12" x2="15" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Linked List Pointer Mechanics (Cycle & In-Place Reversal)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { setAlgo('cycle'); setCurrentStep(0); setIsPlaying(false); }}
            style={{ padding: '4px 10px', borderRadius: '6px', border: algo === 'cycle' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', background: algo === 'cycle' ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.04)', color: algo === 'cycle' ? '#a78bfa' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Floyd's Cycle (2x Fast/Slow)
          </button>
          <button
            onClick={() => { setAlgo('reverse'); setCurrentStep(0); setIsPlaying(false); }}
            style={{ padding: '4px 10px', borderRadius: '6px', border: algo === 'reverse' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: algo === 'reverse' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)', color: algo === 'reverse' ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            In-Place Reversal (3 Pointers)
          </button>
        </div>
      </div>

      {/* Playback bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: isPlaying ? '#f87171' : '#a78bfa', color: '#090b14', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
            {isPlaying ? '⏸ Pause' : '▶ Animate'}
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStep((s) => Math.max(0, s - 1)); }} disabled={currentStep === 0} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '12px', cursor: 'pointer' }}>
            ⏮ Prev
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStep((s) => Math.min(steps.length - 1, s + 1)); }} disabled={currentStep >= steps.length - 1} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '12px', cursor: 'pointer' }}>
            Next ⏭
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStep(0); }} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content-secondary)', fontSize: '12px', cursor: 'pointer' }}>
            🔄 Reset
          </button>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Step <strong>{currentStep + 1}</strong> of <strong>{steps.length}</strong>
        </span>
      </div>

      {/* SVG Canvas */}
      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 550 160" style={{ width: '100%', minWidth: '450px', height: 'auto' }}>
          <defs>
            <marker id="ll-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker id="cycle-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
            </marker>
          </defs>

          {algo === 'cycle' ? (
            <>
              {/* Directed edges */}
              <line x1="105" y1="80" x2="155" y2="80" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#ll-arrow)" />
              <line x1="205" y1="80" x2="255" y2="80" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#ll-arrow)" />
              <line x1="305" y1="80" x2="355" y2="80" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#ll-arrow)" />
              {/* Cycle back edge */}
              <path d="M 380 60 C 380 15, 180 15, 180 55" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#cycle-arrow)" />
              <text x="280" y="25" fill="#f87171" fontSize="10" fontWeight="700" textAnchor="middle">Cycle Back Edge</text>

              {/* Nodes */}
              {nodesCycle.map((n) => {
                const s = active as typeof cycleSteps[0];
                const isSlow = s.slow === n.id;
                const isFast = s.fast === n.id;
                const isMatch = isSlow && isFast;

                return (
                  <g key={`node-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
                    <circle r="22" fill={isMatch ? 'rgba(52,211,153,0.3)' : isSlow || isFast ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.04)'} stroke={isMatch ? '#34d399' : isSlow || isFast ? '#a78bfa' : 'rgba(255,255,255,0.18)'} strokeWidth={isMatch ? 3 : 2} />
                    <text textAnchor="middle" dy="5" fill="#ffffff" fontSize="13" fontWeight="700">{n.val}</text>

                    {/* Pointer Indicators */}
                    {isSlow && (
                      <g transform="translate(0, 38)">
                        <rect x="-24" y="-2" width="48" height="16" rx="4" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" />
                        <text textAnchor="middle" dy="10" fill="#38bdf8" fontSize="9" fontWeight="700">🐢 Slow</text>
                      </g>
                    )}
                    {isFast && (
                      <g transform={`translate(0, ${isSlow ? 56 : 38})`}>
                        <rect x="-24" y="-2" width="48" height="16" rx="4" fill="rgba(248,113,113,0.2)" stroke="#f87171" />
                        <text textAnchor="middle" dy="10" fill="#f87171" fontSize="9" fontWeight="700">🐇 Fast</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </>
          ) : (
            /* Reverse Linked List */
            <>
              {[1, 2, 3, 4].map((v, i) => {
                const s = active as typeof reverseSteps[0];
                const isCurr = s.curr === v;
                const isPrev = s.prev === v;
                return (
                  <g key={`rev-${v}`} transform={`translate(${80 + i * 110}, 75)`}>
                    <rect width="55" height="38" rx="8" fill={isCurr ? 'rgba(56,189,248,0.25)' : isPrev ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.03)'} stroke={isCurr ? '#38bdf8' : isPrev ? '#34d399' : 'rgba(255,255,255,0.12)'} strokeWidth="2" />
                    <text x="27" y="24" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700">{v}</text>
                    {i < 3 && (
                      <line x1="60" y1="19" x2="105" y2="19" stroke={i + 1 < (typeof s.prev === 'number' ? s.prev : 0) ? '#34d399' : '#38bdf8'} strokeWidth="2" markerEnd="url(#ll-arrow)" />
                    )}
                    {isPrev && <text x="27" y="-10" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">prev ↑</text>}
                    {isCurr && <text x="27" y="-10" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">curr ↑</text>}
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-purple" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Complexity: O(N) Time | O(1) Auxiliary Space.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 4. Week 4: Hash Tables & Sets
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek4HashTablesDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek4HashTablesDiagram(): React.JSX.Element {
  const [selectedKey, setSelectedKey] = useState<string>('apple');
  const [method, setMethod] = useState<'chaining' | 'probing'>('chaining');

  const keys = [
    { key: 'apple', hash: 3, val: '$1.50' },
    { key: 'banana', hash: 1, val: '$0.80' },
    { key: 'avocado', hash: 3, val: '$2.20' }, // collision with apple
    { key: 'cherry', hash: 5, val: '$3.00' },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Hash Table Collision Resolution (Separate Chaining vs Linear Probing)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setMethod('chaining')}
            style={{ padding: '4px 10px', borderRadius: '6px', border: method === 'chaining' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', background: method === 'chaining' ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.04)', color: method === 'chaining' ? '#fbbf24' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Separate Chaining
          </button>
          <button
            onClick={() => setMethod('probing')}
            style={{ padding: '4px 10px', borderRadius: '6px', border: method === 'probing' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: method === 'probing' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)', color: method === 'probing' ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Open Addressing (Linear Probing)
          </button>
        </div>
      </div>

      {/* Key selector */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>Select Key to Insert / Lookup:</span>
        {keys.map((k) => (
          <button
            key={k.key}
            onClick={() => setSelectedKey(k.key)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: selectedKey === k.key ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
              background: selectedKey === k.key ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.03)',
              color: selectedKey === k.key ? '#fbbf24' : '#e2e8f0',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            "{k.key}" (hash % 8 = {k.hash})
          </button>
        ))}
      </div>

      {/* SVG Canvas */}
      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 600 200" style={{ width: '100%', minWidth: '480px', height: 'auto' }}>
          <text x="20" y="24" fill="#94a3b8" fontSize="11" fontWeight="700">Hash Buckets (Table Size = 8)</text>

          {/* 8 Buckets */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((bIdx) => {
            const isMatchBucket = (selectedKey === 'apple' || selectedKey === 'avocado') ? bIdx === 3 : (selectedKey === 'banana' ? bIdx === 1 : bIdx === 5);
            return (
              <g key={`b-${bIdx}`} transform={`translate(20, ${40 + bIdx * 19})`}>
                <rect width="60" height="16" rx="3" fill={isMatchBucket ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.03)'} stroke={isMatchBucket ? '#fbbf24' : 'rgba(255,255,255,0.1)'} />
                <text x="30" y="12" textAnchor="middle" fill={isMatchBucket ? '#fbbf24' : '#64748b'} fontSize="10" fontWeight="700">[{bIdx}]</text>

                {/* Chaining Elements */}
                {method === 'chaining' ? (
                  <>
                    {bIdx === 1 && (
                      <g transform="translate(70, 0)">
                        <line x1="0" y1="8" x2="20" y2="8" stroke="#34d399" strokeWidth="1.5" />
                        <rect x="20" width="100" height="16" rx="3" fill="rgba(52,211,153,0.15)" stroke="#34d399" />
                        <text x="70" y="12" textAnchor="middle" fill="#34d399" fontSize="10">banana: $0.80</text>
                      </g>
                    )}
                    {bIdx === 3 && (
                      <g transform="translate(70, 0)">
                        <line x1="0" y1="8" x2="20" y2="8" stroke="#fbbf24" strokeWidth="1.5" />
                        <rect x="20" width="90" height="16" rx="3" fill="rgba(251,191,36,0.2)" stroke="#fbbf24" />
                        <text x="65" y="12" textAnchor="middle" fill="#fbbf24" fontSize="10">apple: $1.50</text>

                        <line x1="110" y1="8" x2="130" y2="8" stroke="#f87171" strokeWidth="1.5" />
                        <rect x="130" width="105" height="16" rx="3" fill="rgba(248,113,113,0.2)" stroke="#f87171" />
                        <text x="182" y="12" textAnchor="middle" fill="#f87171" fontSize="10">avocado: $2.20</text>
                      </g>
                    )}
                    {bIdx === 5 && (
                      <g transform="translate(70, 0)">
                        <line x1="0" y1="8" x2="20" y2="8" stroke="#38bdf8" strokeWidth="1.5" />
                        <rect x="20" width="90" height="16" rx="3" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" />
                        <text x="65" y="12" textAnchor="middle" fill="#38bdf8" fontSize="10">cherry: $3.00</text>
                      </g>
                    )}
                  </>
                ) : (
                  /* Linear Probing */
                  <>
                    {bIdx === 1 && <text x="75" y="12" fill="#34d399" fontSize="10">→ banana: $0.80</text>}
                    {bIdx === 3 && <text x="75" y="12" fill="#fbbf24" fontSize="10">→ apple: $1.50</text>}
                    {bIdx === 4 && <text x="75" y="12" fill="#f87171" fontSize="10">→ avocado: $2.20 (Probed from [3] to [4])</text>}
                    {bIdx === 5 && <text x="75" y="12" fill="#38bdf8" fontSize="10">→ cherry: $3.00</text>}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-amber" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '13px', marginBottom: '4px' }}>
          Collision Resolution Strategy: {method === 'chaining' ? 'Separate Chaining (Linked Nodes / Red-Black Tree)' : 'Open Addressing with Linear Probing'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          {method === 'chaining' ? 'Colliding entries form a linked bucket (or TreeBin when count >= 8 in Java HashMap). Load factor threshold = 0.75.' : 'Collisions probe sequentially (i + 1) % N until an empty slot is located. Requires low load factor to avoid primary clustering.'}
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 5. Week 5: Stacks, Queues & Monotonic
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek5MonotonicStackDiagram'] = '''import React, { useState, useEffect } from 'react';

export default function DsaWeek5MonotonicStackDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const arr = [2, 1, 2, 4, 3];
  // Next Greater Element simulation:
  const simSteps = [
    { i: 0, val: 2, stack: [2], result: [-1, -1, -1, -1, -1], desc: 'Push 2 onto stack. Stack: [2]' },
    { i: 1, val: 1, stack: [2, 1], result: [-1, -1, -1, -1, -1], desc: '1 < 2 -> Monotonic decreasing invariant maintained. Push 1. Stack: [2, 1]' },
    { i: 2, val: 2, stack: [2, 2], result: [-1, 2, -1, -1, -1], desc: '2 > top(1) -> Pop 1. Next greater for 1 is 2! Push 2. Stack: [2, 2]' },
    { i: 3, val: 4, stack: [4], result: [4, 2, 4, -1, -1], desc: '4 > top(2) -> Pop 2 (NGE=4), Pop 2 (NGE=4). Push 4. Stack: [4]' },
    { i: 4, val: 3, stack: [4, 3], result: [4, 2, 4, -1, -1], desc: '3 < 4 -> Push 3. Stack: [4, 3]. Complete! Unmatched elements get -1.' },
  ];

  useEffect(() => {
    let t: any;
    if (isPlaying) {
      t = setInterval(() => {
        setStep((s) => {
          if (s >= simSteps.length - 1) { setIsPlaying(false); return s; }
          return s + 1;
        });
      }, 1500);
    }
    return () => clearInterval(t);
  }, [isPlaying]);

  const active = simSteps[Math.min(step, simSteps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Monotonic Stack Simulation (Next Greater Element)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: isPlaying ? '#fbbf24' : '#f87171', color: '#090b14', fontWeight: 700, fontSize: '11.5px', cursor: 'pointer' }}>
            {isPlaying ? '⏸ Pause' : '▶ Animate'}
          </button>
          <button onClick={() => { setIsPlaying(false); setStep(0); }} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '11.5px', cursor: 'pointer' }}>
            🔄 Reset
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 580 160" style={{ width: '100%', minWidth: '460px', height: 'auto' }}>
          {/* Input Array */}
          <text x="20" y="25" fill="#94a3b8" fontSize="11" fontWeight="700">Input Array:</text>
          {arr.map((v, idx) => {
            const isCur = idx === active.i;
            return (
              <g key={`arr-${idx}`} transform={`translate(${110 + idx * 55}, 10)`}>
                <rect width="45" height="30" rx="5" fill={isCur ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.03)'} stroke={isCur ? '#f87171' : 'rgba(255,255,255,0.1)'} />
                <text x="22" y="20" textAnchor="middle" fill={isCur ? '#f87171' : '#e2e8f0'} fontSize="13" fontWeight="700">{v}</text>
              </g>
            );
          })}

          {/* Monotonic Stack Container */}
          <text x="20" y="90" fill="#38bdf8" fontSize="11" fontWeight="700">Monotonic Stack:</text>
          <rect x="130" y="70" width="180" height="35" rx="6" fill="rgba(56,189,248,0.05)" stroke="#38bdf8" strokeDasharray="3 3" />
          {active.stack.map((sVal, sIdx) => (
            <g key={`stack-${sIdx}`} transform={`translate(${140 + sIdx * 45}, 75)`}>
              <rect width="38" height="25" rx="4" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" />
              <text x="19" y="17" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">{sVal}</text>
            </g>
          ))}

          {/* Output NGE */}
          <text x="20" y="145" fill="#34d399" fontSize="11" fontWeight="700">Next Greater Result:</text>
          {active.result.map((resVal, rIdx) => (
            <g key={`res-${rIdx}`} transform={`translate(${145 + rIdx * 55}, 130)`}>
              <rect width="45" height="22" rx="4" fill="rgba(52,211,153,0.15)" stroke="#34d399" />
              <text x="22" y="16" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">{resVal}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-red" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#f87171', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Each element is pushed and popped at most once -> O(N) Total Time Complexity.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 6. Week 6: Binary Trees & BST
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek6BinaryTreeDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek6BinaryTreeDiagram(): React.JSX.Element {
  const [searchVal, setSearchVal] = useState<number>(7);
  const [traversal, setTraversal] = useState<'bst' | 'bfs'>('bst');

  // BST layout
  const nodes = [
    { id: 4, val: 4, x: 260, y: 35, left: 2, right: 7 },
    { id: 2, val: 2, x: 140, y: 90, left: 1, right: 3 },
    { id: 7, val: 7, x: 380, y: 90, left: 6, right: 9 },
    { id: 1, val: 1, x: 80, y: 150 },
    { id: 3, val: 3, x: 200, y: 150 },
    { id: 6, val: 6, x: 320, y: 150 },
    { id: 9, val: 9, x: 440, y: 150 },
  ];

  const searchPath = searchVal === 7 ? [4, 7] : searchVal === 3 ? [4, 2, 3] : searchVal === 6 ? [4, 7, 6] : [4, 2, 1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" />
          <circle cx="6" cy="19" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M12 8v4M8 17l4-5 4 5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Binary Search Tree (BST) Search & BFS Wavefront
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[1, 3, 6, 7].map((v) => (
            <button
              key={v}
              onClick={() => setSearchVal(v)}
              style={{
                padding: '3px 8px',
                borderRadius: '5px',
                border: searchVal === v ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                background: searchVal === v ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.03)',
                color: searchVal === v ? '#34d399' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Find {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 520 190" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          {/* Edges */}
          <line x1="260" y1="35" x2="140" y2="90" stroke={searchPath.includes(2) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(2) ? 3 : 1.5} />
          <line x1="260" y1="35" x2="380" y2="90" stroke={searchPath.includes(7) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(7) ? 3 : 1.5} />

          <line x1="140" y1="90" x2="80" y2="150" stroke={searchPath.includes(1) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(1) ? 3 : 1.5} />
          <line x1="140" y1="90" x2="200" y2="150" stroke={searchPath.includes(3) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(3) ? 3 : 1.5} />

          <line x1="380" y1="90" x2="320" y2="150" stroke={searchPath.includes(6) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(6) ? 3 : 1.5} />
          <line x1="380" y1="90" x2="440" y2="150" stroke={searchPath.includes(9) ? '#34d399' : 'rgba(255,255,255,0.15)'} strokeWidth={searchPath.includes(9) ? 3 : 1.5} />

          {/* Tree Nodes */}
          {nodes.map((n) => {
            const inPath = searchPath.includes(n.val);
            const isTarget = n.val === searchVal;
            return (
              <g key={`bst-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
                <circle r="18" fill={isTarget ? 'rgba(52,211,153,0.35)' : inPath ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.04)'} stroke={isTarget ? '#34d399' : inPath ? '#38bdf8' : 'rgba(255,255,255,0.2)'} strokeWidth={isTarget ? 3 : inPath ? 2 : 1} />
                <text textAnchor="middle" dy="5" fill={isTarget ? '#34d399' : '#ffffff'} fontSize="13" fontWeight="700">{n.val}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-green" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#34d399', fontSize: '13px', marginBottom: '4px' }}>
          Search Path for {searchVal}: {searchPath.join(' → ')} (Height Steps = {searchPath.length})
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          BST search eliminates half of remaining subtrees at each node -> O(log N) Time on balanced trees.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 7. Week 7: Graph Foundations (BFS / DFS)
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek7GraphFoundationsDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek7GraphFoundationsDiagram(): React.JSX.Element {
  const [traversal, setTraversal] = useState<'bfs' | 'dfs'>('bfs');

  const bfsOrder = [0, 1, 2, 3, 4];
  const dfsOrder = [0, 1, 3, 4, 2];

  const order = traversal === 'bfs' ? bfsOrder : dfsOrder;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="18" r="3" />
          <line x1="9" y1="6" x2="15" y2="6" />
          <line x1="6" y1="9" x2="6" y2="15" />
          <line x1="18" y1="9" x2="18" y2="15" />
          <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Graph Traversal Engine (BFS Queue vs DFS Recursion)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setTraversal('bfs')} style={{ padding: '4px 10px', borderRadius: '6px', border: traversal === 'bfs' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: traversal === 'bfs' ? 'rgba(56,189,248,0.2)' : 'transparent', color: traversal === 'bfs' ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
            BFS (Level Queue)
          </button>
          <button onClick={() => setTraversal('dfs')} style={{ padding: '4px 10px', borderRadius: '6px', border: traversal === 'dfs' ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)', background: traversal === 'dfs' ? 'rgba(244,114,182,0.2)' : 'transparent', color: traversal === 'dfs' ? '#f472b6' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
            DFS (Deep Stack)
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 180" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          {/* Edges */}
          <line x1="80" y1="90" x2="200" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="80" y1="90" x2="200" y2="140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="200" y1="40" x2="340" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="340" y1="40" x2="440" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="200" y1="140" x2="440" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

          {/* Graph Nodes with visit order badge */}
          {[
            { id: 0, x: 80, y: 90, label: 'Node 0 (Start)' },
            { id: 1, x: 200, y: 40, label: 'Node 1' },
            { id: 2, x: 200, y: 140, label: 'Node 2' },
            { id: 3, x: 340, y: 40, label: 'Node 3' },
            { id: 4, x: 440, y: 90, label: 'Node 4' },
          ].map((n) => {
            const visitRank = order.indexOf(n.id) + 1;
            return (
              <g key={`gnode-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
                <circle r="22" fill={traversal === 'bfs' ? 'rgba(56,189,248,0.25)' : 'rgba(244,114,182,0.25)'} stroke={traversal === 'bfs' ? '#38bdf8' : '#f472b6'} strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="12" fontWeight="700">{n.id}</text>
                <circle cx="16" cy="-16" r="10" fill="#fbbf24" />
                <text x="16" y="-13" textAnchor="middle" fill="#090b14" fontSize="9" fontWeight="800">#{visitRank}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-blue" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: traversal === 'bfs' ? '#38bdf8' : '#f472b6', fontSize: '13px', marginBottom: '4px' }}>
          {traversal === 'bfs' ? 'BFS Visit Order: 0 → 1 → 2 → 3 → 4 (Shortest unweighted path guaranteed)' : 'DFS Visit Order: 0 → 1 → 3 → 4 → 2 (Deep exploration with backtracking)'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Time Complexity: O(V + E) | Space Complexity: O(V) for visited set and queue/recursion stack.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 8. Week 8: Advanced Graph Concepts (Kahn's Topological Sort)
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek8TopologicalSortDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek8TopologicalSortDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(0);

  const steps = [
    { inDegree: [0, 1, 1, 2], queue: [0], processed: [], desc: 'Calculate In-Degrees: [0:0, 1:1, 2:1, 3:2]. Node 0 has in-degree 0 -> Enqueue [0].' },
    { inDegree: [0, 0, 0, 2], queue: [1, 2], processed: [0], desc: 'Pop Node 0 -> Decrement neighbors Node 1 & Node 2 in-degrees to 0. Enqueue [1, 2].' },
    { inDegree: [0, 0, 0, 1], queue: [2], processed: [0, 1], desc: 'Pop Node 1 -> Decrement neighbor Node 3 in-degree to 1. Queue: [2].' },
    { inDegree: [0, 0, 0, 0], queue: [3], processed: [0, 1, 2], desc: 'Pop Node 2 -> Decrement Node 3 in-degree to 0. Enqueue [3].' },
    { inDegree: [0, 0, 0, 0], queue: [], processed: [0, 1, 2, 3], desc: 'Pop Node 3 -> Valid Topological Ordering: [0, 1, 2, 3]! DAG verified (no cycle).' },
  ];

  const active = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Kahn's Topological Sort (In-Degree Reduction Engine)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '11px', cursor: 'pointer' }}>
            ⏮ Prev
          </button>
          <button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step >= steps.length - 1} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: '#2dd4bf', color: '#090b14', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            Next ⏭
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 160" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          <defs>
            <marker id="topo-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#2dd4bf" />
            </marker>
          </defs>

          {/* Directed Edges */}
          <line x1="100" y1="80" x2="200" y2="40" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#topo-arrow)" />
          <line x1="100" y1="80" x2="200" y2="120" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#topo-arrow)" />
          <line x1="240" y1="40" x2="340" y2="80" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#topo-arrow)" />
          <line x1="240" y1="120" x2="340" y2="80" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#topo-arrow)" />

          {/* DAG Nodes with In-Degrees */}
          {[
            { id: 0, x: 80, y: 80 },
            { id: 1, x: 220, y: 40 },
            { id: 2, x: 220, y: 120 },
            { id: 3, x: 360, y: 80 },
          ].map((n) => {
            const isDone = active.processed.includes(n.id);
            const inDeg = active.inDegree[n.id];
            return (
              <g key={`topo-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
                <circle r="22" fill={isDone ? 'rgba(52,211,153,0.3)' : inDeg === 0 ? 'rgba(45,212,191,0.25)' : 'rgba(255,255,255,0.03)'} stroke={isDone ? '#34d399' : inDeg === 0 ? '#2dd4bf' : 'rgba(255,255,255,0.15)'} strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="13" fontWeight="700">N{n.id}</text>
                <text x="0" y="36" textAnchor="middle" fill="#94a3b8" fontSize="10">in-deg: {inDeg}</text>
              </g>
            );
          })}

          {/* Queue box */}
          <g transform="translate(420, 40)">
            <text x="40" y="-10" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="700">In-Degree 0 Queue</text>
            <rect width="80" height="70" rx="6" fill="rgba(45,212,191,0.05)" stroke="#2dd4bf" strokeDasharray="3 3" />
            <text x="40" y="40" textAnchor="middle" fill="#2dd4bf" fontSize="14" fontWeight="700">
              {active.queue.length > 0 ? `[ ${active.queue.join(', ')} ]` : 'Empty'}
            </text>
          </g>
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-teal" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#2dd4bf', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Processed Order: [ {active.processed.join(', ')} ] | If processed count &lt; V, a cycle exists.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 9. Week 9: Binary Search
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek9BinarySearchDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek9BinarySearchDiagram(): React.JSX.Element {
  const [target, setTarget] = useState<number>(14);
  const [step, setStep] = useState<number>(0);

  const arr = [2, 5, 8, 12, 14, 19, 23, 31, 42];

  // Simulation steps for Target 14:
  // Step 0: L=0, R=8, Mid=4 (14) -> Found!
  const simSteps = [
    { L: 0, R: 8, mid: 4, midVal: 14, desc: 'Init: L=0, R=8. Mid = 4 (Value = 14). target 14 == arr[4] -> FOUND in 1 comparison!' },
    { L: 0, R: 3, mid: 1, midVal: 5, desc: 'If target was 8: L=0, R=3. Mid = 1 (Value = 5). 8 > 5 -> L = mid + 1 = 2.' },
    { L: 2, R: 3, mid: 2, midVal: 8, desc: 'L=2, R=3. Mid = 2 (Value = 8). target 8 == arr[2] -> FOUND in 2 comparisons!' },
  ];

  const active = simSteps[Math.min(step, simSteps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Binary Search Bisecting Search Space
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setStep(0)} style={{ padding: '3px 8px', borderRadius: '5px', border: step === 0 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#38bdf8', fontSize: '11px', cursor: 'pointer' }}>
            Target 14
          </button>
          <button onClick={() => setStep(1)} style={{ padding: '3px 8px', borderRadius: '5px', border: step >= 1 ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#34d399', fontSize: '11px', cursor: 'pointer' }}>
            Target 8 (2 Steps)
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 600 130" style={{ width: '100%', minWidth: '480px', height: 'auto' }}>
          {arr.map((val, i) => {
            const inRange = i >= active.L && i <= active.R;
            const isMid = i === active.mid;
            return (
              <g key={`bs-${i}`} transform={`translate(${40 + i * 58}, 40)`}>
                <rect width="48" height="36" rx="6" fill={isMid ? 'rgba(52,211,153,0.3)' : inRange ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.02)'} stroke={isMid ? '#34d399' : inRange ? '#38bdf8' : 'rgba(255,255,255,0.08)'} strokeWidth={isMid ? 2 : 1} />
                <text x="24" y="23" textAnchor="middle" fill={isMid ? '#34d399' : inRange ? '#38bdf8' : '#475569'} fontSize="13" fontWeight="700">{val}</text>
                <text x="24" y="48" textAnchor="middle" fill="#64748b" fontSize="9">i={i}</text>
                {i === active.L && <text x="24" y="-8" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">L ↓</text>}
                {i === active.R && <text x="24" y="-8" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">R ↓</text>}
                {isMid && <text x="24" y="65" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">MID ↑</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-blue" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Search Space Halving: N -> N/2 -> N/4 -> 1. Guarantees O(log N) Time Complexity.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 10. Week 10: Recursion & Backtracking
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek10BacktrackingDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek10BacktrackingDiagram(): React.JSX.Element {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 12l-4-4-4 4M12 16V8" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Backtracking State Tree Exploration & Pruning (Subsets of [1, 2])
        </span>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 520 180" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          {/* Root node */}
          <g transform="translate(260, 25)">
            <rect x="-35" y="-15" width="70" height="30" rx="6" fill="rgba(244,114,182,0.2)" stroke="#f472b6" />
            <text textAnchor="middle" dy="5" fill="#ffffff" fontSize="12" fontWeight="700">[ ]</text>
          </g>

          {/* Level 1 Edges */}
          <line x1="240" y1="40" x2="140" y2="80" stroke="#f472b6" strokeWidth="2" />
          <line x1="280" y1="40" x2="380" y2="80" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Level 1 Nodes */}
          <g transform="translate(140, 85)">
            <rect x="-40" y="-15" width="80" height="30" rx="6" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" />
            <text textAnchor="middle" dy="5" fill="#38bdf8" fontSize="12" fontWeight="700">Include 1: [1]</text>
          </g>
          <g transform="translate(380, 85)">
            <rect x="-40" y="-15" width="80" height="30" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" />
            <text textAnchor="middle" dy="5" fill="#94a3b8" fontSize="12">Exclude 1: [ ]</text>
          </g>

          {/* Level 2 Edges */}
          <line x1="120" y1="100" x2="80" y2="140" stroke="#34d399" strokeWidth="2" />
          <line x1="160" y1="100" x2="200" y2="140" stroke="#34d399" strokeWidth="2" />
          <line x1="360" y1="100" x2="320" y2="140" stroke="#34d399" strokeWidth="2" />
          <line x1="400" y1="100" x2="440" y2="140" stroke="#34d399" strokeWidth="2" />

          {/* Level 2 Leaf Subsets */}
          <g transform="translate(80, 150)">
            <rect x="-30" y="-12" width="60" height="24" rx="4" fill="rgba(52,211,153,0.2)" stroke="#34d399" />
            <text textAnchor="middle" dy="4" fill="#34d399" fontSize="11" fontWeight="700">[1, 2]</text>
          </g>
          <g transform="translate(200, 150)">
            <rect x="-30" y="-12" width="60" height="24" rx="4" fill="rgba(52,211,153,0.2)" stroke="#34d399" />
            <text textAnchor="middle" dy="4" fill="#34d399" fontSize="11" fontWeight="700">[1]</text>
          </g>
          <g transform="translate(320, 150)">
            <rect x="-30" y="-12" width="60" height="24" rx="4" fill="rgba(52,211,153,0.2)" stroke="#34d399" />
            <text textAnchor="middle" dy="4" fill="#34d399" fontSize="11" fontWeight="700">[2]</text>
          </g>
          <g transform="translate(440, 150)">
            <rect x="-30" y="-12" width="60" height="24" rx="4" fill="rgba(52,211,153,0.2)" stroke="#34d399" />
            <text textAnchor="middle" dy="4" fill="#34d399" fontSize="11" fontWeight="700">[ ]</text>
          </g>
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-pink" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#f472b6', fontSize: '13px', marginBottom: '4px' }}>
          Backtracking 3-Step Pattern: Choose -> Explore (Recurse) -> Un-choose (Backtrack state)
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Total Leaf States for N items = 2^N (Subsets) or N! (Permutations). Pruning eliminates invalid branches early.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 11. Week 11: Intervals & Sweep Line
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek11IntervalsDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek11IntervalsDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(0);

  const rawIntervals = [
    { start: 1, end: 3 },
    { start: 2, end: 6 },
    { start: 8, end: 10 },
    { start: 15, end: 18 }
  ];

  const steps = [
    { active: 0, merged: [{ start: 1, end: 3 }], desc: 'Sort by start time. Add [1, 3] to merged list.' },
    { active: 1, merged: [{ start: 1, end: 6 }], desc: '[2, 6] overlaps with [1, 3] (2 <= 3). Merge: new end = max(3, 6) = 6 -> [1, 6].' },
    { active: 2, merged: [{ start: 1, end: 6 }, { start: 8, end: 10 }], desc: '[8, 10] starts after 6 (8 > 6). No overlap -> Append [8, 10].' },
    { active: 3, merged: [{ start: 1, end: 6 }, { start: 8, end: 10 }, { start: 15, end: 18 }], desc: '[15, 18] starts after 10 (15 > 10). Append [15, 18]. Complete!' },
  ];

  const active = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Interval Merge & Timeline Overlap Visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '11px', cursor: 'pointer' }}>
            ⏮ Prev
          </button>
          <button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step >= steps.length - 1} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: '#fbbf24', color: '#090b14', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            Next ⏭
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 140" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          {/* Timeline axis */}
          <line x1="30" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {[0, 3, 6, 9, 12, 15, 18].map((t) => (
            <g key={`time-${t}`} transform={`translate(${40 + t * 24}, 40)`}>
              <line y1="-4" y2="4" stroke="rgba(255,255,255,0.3)" />
              <text y="16" textAnchor="middle" fill="#64748b" fontSize="9">{t}</text>
            </g>
          ))}

          {/* Raw Intervals */}
          {rawIntervals.map((intv, idx) => {
            const isCur = idx === active.active;
            const x = 40 + intv.start * 24;
            const w = (intv.end - intv.start) * 24;
            return (
              <g key={`intv-${idx}`} transform={`translate(${x}, 55)`}>
                <rect width={w} height="20" rx="4" fill={isCur ? 'rgba(251,191,36,0.3)' : 'rgba(56,189,248,0.2)'} stroke={isCur ? '#fbbf24' : '#38bdf8'} />
                <text x={w / 2} y="14" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">[{intv.start},{intv.end}]</text>
              </g>
            );
          })}

          {/* Merged Result */}
          <text x="30" y="105" fill="#34d399" fontSize="11" fontWeight="700">Merged:</text>
          {active.merged.map((m, idx) => {
            const x = 90 + m.start * 22;
            const w = (m.end - m.start) * 22;
            return (
              <g key={`m-${idx}`} transform={`translate(${x}, 92)`}>
                <rect width={Math.max(w, 40)} height="20" rx="4" fill="rgba(52,211,153,0.25)" stroke="#34d399" />
                <text x={Math.max(w, 40) / 2} y="14" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">[{m.start},{m.end}]</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-amber" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Sorting Step: O(N log N) -> Linear Merge Scan: O(N). Total Time: O(N log N).
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 12. Week 12: Heaps & Greedy
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek12HeapGreedyDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek12HeapGreedyDiagram(): React.JSX.Element {
  const [heapType, setHeapType] = useState<'min' | 'max'>('min');

  // Min-Heap Array representation: [2, 3, 5, 8, 9]
  // Parent = (i-1)//2, Left = 2*i + 1, Right = 2*i + 2
  const minHeap = [
    { val: 2, x: 260, y: 35 },
    { val: 3, x: 160, y: 85 },
    { val: 5, x: 360, y: 85 },
    { val: 8, x: 110, y: 140 },
    { val: 9, x: 210, y: 140 },
  ];

  const maxHeap = [
    { val: 9, x: 260, y: 35 },
    { val: 8, x: 160, y: 85 },
    { val: 5, x: 360, y: 85 },
    { val: 3, x: 110, y: 140 },
    { val: 2, x: 210, y: 140 },
  ];

  const nodes = heapType === 'min' ? minHeap : maxHeap;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 22 22 22" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Binary Heap Array-Tree Structure & Sift Mechanics
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setHeapType('min')} style={{ padding: '4px 10px', borderRadius: '6px', border: heapType === 'min' ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.1)', background: heapType === 'min' ? 'rgba(249,115,22,0.2)' : 'transparent', color: heapType === 'min' ? '#f97316' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
            Min-Heap (Root Min)
          </button>
          <button onClick={() => setHeapType('max')} style={{ padding: '4px 10px', borderRadius: '6px', border: heapType === 'max' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: heapType === 'max' ? 'rgba(56,189,248,0.2)' : 'transparent', color: heapType === 'max' ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
            Max-Heap (Root Max)
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 520 180" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          {/* Edges */}
          <line x1="260" y1="35" x2="160" y2="85" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="260" y1="35" x2="360" y2="85" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="160" y1="85" x2="110" y2="140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1="160" y1="85" x2="210" y2="140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

          {/* Nodes */}
          {nodes.map((n, i) => (
            <g key={`hp-${i}`} transform={`translate(${n.x}, ${n.y})`}>
              <circle r="20" fill={i === 0 ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.04)'} stroke={i === 0 ? '#f97316' : '#38bdf8'} strokeWidth="2" />
              <text textAnchor="middle" dy="5" fill="#ffffff" fontSize="13" fontWeight="700">{n.val}</text>
              <text x="0" y="32" textAnchor="middle" fill="#64748b" fontSize="9">idx={i}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-orange" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#f97316', fontSize: '13px', marginBottom: '4px' }}>
          Peek: O(1) | Push (Sift-Up): O(log N) | Pop Root (Sift-Down): O(log N)
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Array Memory Layout: [ {nodes.map((n) => n.val).join(', ')} ] eliminates object pointer overhead.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 13. Week 13: Dynamic Programming 1D
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek13Dp1dDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek13Dp1dDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(3);

  // Climbing stairs / Fibonacci: dp[i] = dp[i-1] + dp[i-2]
  const dp = [1, 1, 2, 3, 5, 8];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          1D Dynamic Programming State Transition Graph
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setStep(s)} style={{ padding: '3px 8px', borderRadius: '5px', border: step === s ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', background: step === s ? 'rgba(167,139,250,0.2)' : 'transparent', color: step === s ? '#a78bfa' : 'var(--ifm-color-content-secondary)', fontSize: '11px', cursor: 'pointer' }}>
              Step {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 140" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          <defs>
            <marker id="dp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#a78bfa" />
            </marker>
          </defs>

          {/* DAG State nodes */}
          {dp.map((val, i) => {
            const isTarget = i === step;
            const isDep1 = i === step - 1;
            const isDep2 = i === step - 2;
            return (
              <g key={`dp-${i}`} transform={`translate(${40 + i * 80}, 60)`}>
                <rect width="60" height="40" rx="8" fill={isTarget ? 'rgba(167,139,250,0.3)' : isDep1 || isDep2 ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)'} stroke={isTarget ? '#a78bfa' : isDep1 || isDep2 ? '#38bdf8' : 'rgba(255,255,255,0.1)'} strokeWidth={isTarget ? 2 : 1} />
                <text x="30" y="24" textAnchor="middle" fill={isTarget ? '#a78bfa' : '#ffffff'} fontSize="14" fontWeight="700">{i <= step ? val : '?'}</text>
                <text x="30" y="56" textAnchor="middle" fill="#64748b" fontSize="10">dp[{i}]</text>
              </g>
            );
          })}

          {/* Dependency curves */}
          {step >= 2 && (
            <>
              <path d={`M ${40 + (step - 1) * 80 + 30} 55 C ${40 + (step - 1) * 80 + 45} 25, ${40 + step * 80 + 15} 25, ${40 + step * 80 + 20} 55`} fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#dp-arrow)" />
              <path d={`M ${40 + (step - 2) * 80 + 30} 55 C ${40 + (step - 2) * 80 + 50} 5, ${40 + step * 80 + 10} 5, ${40 + step * 80 + 25} 55`} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#dp-arrow)" />
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-purple" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '13px', marginBottom: '4px' }}>
          Transition Formula: dp[{step}] = dp[{step - 1}] ({dp[step - 1]}) + dp[{step - 2}] ({dp[step - 2]}) = {dp[step]}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Transforms exponential O(2^N) recursion into linear O(N) Time and O(1) Rolling Space.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 14. Week 14: Dynamic Programming 2D
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek14Dp2dDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek14Dp2dDiagram(): React.JSX.Element {
  const [activeCell, setActiveCell] = useState<{ r: number; c: number }>({ r: 2, c: 2 });

  // Grid for LCS ("ABC", "AC")
  const s1 = " ABC";
  const s2 = " AC";

  const matrix = [
    [0, 0, 0],
    [0, 1, 1],
    [0, 1, 1],
    [0, 1, 2],
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          2D DP Matrix Grid Transition (LCS: "ABC" vs "AC")
        </span>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 450 170" style={{ width: '100%', minWidth: '380px', height: 'auto' }}>
          {/* Header columns */}
          {s2.split('').map((ch, cIdx) => (
            <text key={`col-${cIdx}`} x={120 + cIdx * 70} y="25" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">
              {ch === ' ' ? '∅' : ch}
            </text>
          ))}

          {/* Matrix rows */}
          {matrix.map((row, rIdx) => (
            <g key={`row-${rIdx}`} transform={`translate(50, ${40 + rIdx * 30})`}>
              <text x="20" y="20" fill="#38bdf8" fontSize="12" fontWeight="700">{s1[rIdx] === ' ' ? '∅' : s1[rIdx]}</text>
              {row.map((val, cIdx) => {
                const isSelected = activeCell.r === rIdx && activeCell.c === cIdx;
                return (
                  <g key={`cell-${rIdx}-${cIdx}`} transform={`translate(${50 + cIdx * 70}, 0)`} onClick={() => setActiveCell({ r: rIdx, c: cIdx })} style={{ cursor: 'pointer' }}>
                    <rect width="50" height="24" rx="4" fill={isSelected ? 'rgba(45,212,191,0.3)' : 'rgba(255,255,255,0.03)'} stroke={isSelected ? '#2dd4bf' : 'rgba(255,255,255,0.1)'} />
                    <text x="25" y="16" textAnchor="middle" fill={isSelected ? '#2dd4bf' : '#e2e8f0'} fontSize="11" fontWeight="700">{val}</text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-teal" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#2dd4bf', fontSize: '13px', marginBottom: '4px' }}>
          Cell [{activeCell.r}][{activeCell.c}]: Value = {matrix[activeCell.r][activeCell.c]}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          State Transition: if s1[i] == s2[j] -> 1 + dp[i-1][j-1] else max(dp[i-1][j], dp[i][j-1]). O(M * N) Time & Space.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 15. Week 15: Advanced Sliding Windows
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek15AdvancedSlidingWindowDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek15AdvancedSlidingWindowDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(0);

  const steps = [
    { L: 0, R: 5, win: 'ADOBEC', matched: 'A,B,C', desc: 'Expand R to index 5 ("ADOBEC") -> All target characters {A,B,C} matched! Valid window found (len=6).' },
    { L: 1, R: 5, win: 'DOBEC', matched: 'B,C', desc: 'Shrink L to 1 ("DOBEC") -> \'A\' count drops below requirement -> Window invalid, expand R again.' },
    { L: 9, R: 12, win: 'BANC', matched: 'A,B,C', desc: 'Later optimal window at [9..12] ("BANC") -> Len = 4 (Global Minimum Window Substring!).' },
  ];

  const active = steps[step];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
          <polyline points="17 2 12 7 7 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Minimum Window Substring Dynamic Frequency Match
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {steps.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} style={{ padding: '3px 8px', borderRadius: '5px', border: step === i ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)', background: step === i ? 'rgba(244,114,182,0.2)' : 'transparent', color: step === i ? '#f472b6' : 'var(--ifm-color-content-secondary)', fontSize: '11px', cursor: 'pointer' }}>
              State {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 120" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          <text x="20" y="25" fill="#94a3b8" fontSize="11" fontWeight="700">Target: "ABC" | Current Window Substring:</text>
          <rect x="20" y="45" width="280" height="45" rx="8" fill="rgba(244,114,182,0.2)" stroke="#f472b6" strokeWidth="2" />
          <text x="160" y="73" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="700">"{active.win}"</text>

          <g transform="translate(330, 45)">
            <rect width="180" height="45" rx="8" fill="rgba(52,211,153,0.15)" stroke="#34d399" />
            <text x="90" y="22" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">Matched Characters</text>
            <text x="90" y="38" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">{active.matched}</text>
          </g>
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-pink" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#f472b6', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Two Pointers + Hash Map Counter enables linear O(N) scan without redundant re-checks.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 16. Week 16: Tries & Prefix Trees
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek16TrieDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek16TrieDiagram(): React.JSX.Element {
  const [word, setWord] = useState<string>('app');

  const words = ['apple', 'app', 'bat'];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Trie (Prefix Tree) Multiway Tree Structure
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {words.map((w) => (
            <button key={w} onClick={() => setWord(w)} style={{ padding: '3px 8px', borderRadius: '5px', border: word === w ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: word === w ? 'rgba(56,189,248,0.2)' : 'transparent', color: word === w ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11px', cursor: 'pointer' }}>
              "{w}"
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 500 180" style={{ width: '100%', minWidth: '400px', height: 'auto' }}>
          {/* Root */}
          <circle cx="250" cy="30" r="16" fill="rgba(255,255,255,0.05)" stroke="#38bdf8" />
          <text x="250" y="34" textAnchor="middle" fill="#38bdf8" fontSize="10">ROOT</text>

          {/* Branches */}
          <line x1="240" y1="45" x2="160" y2="80" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="260" y1="45" x2="340" y2="80" stroke="#38bdf8" strokeWidth="1.5" />

          {/* Node 'a' & 'b' */}
          <g transform="translate(160, 85)">
            <circle r="15" fill={word.startsWith('a') ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.03)'} stroke="#38bdf8" />
            <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="12" fontWeight="700">a</text>
          </g>
          <g transform="translate(340, 85)">
            <circle r="15" fill={word.startsWith('b') ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.03)'} stroke="#38bdf8" />
            <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="12" fontWeight="700">b</text>
          </g>

          {/* Child 'p' under 'a' */}
          <line x1="160" y1="100" x2="160" y2="135" stroke="#38bdf8" strokeWidth="1.5" />
          <g transform="translate(160, 145)">
            <circle r="15" fill={word === 'app' ? 'rgba(52,211,153,0.35)' : 'rgba(56,189,248,0.2)'} stroke={word === 'app' ? '#34d399' : '#38bdf8'} strokeWidth={word === 'app' ? 2 : 1} />
            <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="12" fontWeight="700">p</text>
            <text x="24" y="4" fill="#34d399" fontSize="9" fontWeight="700">isEnd</text>
          </g>
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-blue" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px', marginBottom: '4px' }}>
          Prefix Search for "{word}": O(L) where L = word length (independent of dictionary size N!).
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Shared prefixes save space and enable high-speed autocomplete & IP routing table lookups.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 17. Week 17: Shortest Paths & MST
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek17ShortestPathMstDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek17ShortestPathMstDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(0);

  const steps = [
    { dist: [0, '∞', '∞', '∞'], relaxed: 'Init: Dist[0]=0, all other nodes = ∞.', desc: 'Start at Node 0. Push (0, Node 0) to Min-Priority Queue.' },
    { dist: [0, 4, 2, '∞'], relaxed: 'Relax edges from Node 0: Dist[1]=4, Dist[2]=2.', desc: 'Node 2 has smaller distance (2 < 4) -> Pop Node 2 next.' },
    { dist: [0, 3, 2, 7], relaxed: 'Relax edges from Node 2: Dist[1] updated to 2 + 1 = 3 (3 < 4)! Dist[3] = 7.', desc: 'Greedy distance relaxation updates optimal shortest path.' },
    { dist: [0, 3, 2, 5], relaxed: 'Relax edges from Node 1: Dist[3] updated to 3 + 2 = 5 (5 < 7)! Complete.', desc: 'All shortest distances finalized in O((V + E) log V).' },
  ];

  const active = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Dijkstra's Shortest Path Distance Relaxation
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '11px', cursor: 'pointer' }}>
            ⏮ Prev
          </button>
          <button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step >= steps.length - 1} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: '#34d399', color: '#090b14', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            Next ⏭
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 520 160" style={{ width: '100%', minWidth: '400px', height: 'auto' }}>
          {/* Weighted Edges */}
          <line x1="80" y1="80" x2="220" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <text x="140" y="50" fill="#fbbf24" fontSize="11" fontWeight="700">w=4</text>

          <line x1="80" y1="80" x2="220" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <text x="140" y="115" fill="#fbbf24" fontSize="11" fontWeight="700">w=2</text>

          <line x1="220" y1="120" x2="220" y2="40" stroke="#34d399" strokeWidth="2" strokeDasharray="3 3" />
          <text x="235" y="85" fill="#34d399" fontSize="11" fontWeight="700">w=1</text>

          <line x1="220" y1="40" x2="380" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <text x="310" y="55" fill="#fbbf24" fontSize="11" fontWeight="700">w=2</text>

          {/* Nodes with current dist */}
          {[
            { id: 0, x: 80, y: 80 },
            { id: 1, x: 220, y: 40 },
            { id: 2, x: 220, y: 120 },
            { id: 3, x: 380, y: 80 },
          ].map((n) => (
            <g key={`dijk-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
              <circle r="22" fill="rgba(52,211,153,0.2)" stroke="#34d399" strokeWidth="2" />
              <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="12" fontWeight="700">N{n.id}</text>
              <text x="0" y="36" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">dist: {active.dist[n.id]}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-green" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#34d399', fontSize: '13px', marginBottom: '4px' }}>
          {active.relaxed}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          {active.desc}
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 18. Week 18: Disjoint Set Union (DSU)
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek18DsuDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek18DsuDiagram(): React.JSX.Element {
  const [hasCompressed, setHasCompressed] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Disjoint Set Union (DSU) Path Compression Tree Flattening
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setHasCompressed(!hasCompressed)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#a78bfa', color: '#090b14', fontWeight: 700, fontSize: '11.5px', cursor: 'pointer' }}>
            {hasCompressed ? 'Reset Chain' : 'Apply Path Compression ✨'}
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 500 160" style={{ width: '100%', minWidth: '400px', height: 'auto' }}>
          {/* Root node 0 */}
          <g transform="translate(250, 35)">
            <circle r="20" fill="rgba(52,211,153,0.3)" stroke="#34d399" strokeWidth="2" />
            <text textAnchor="middle" dy="4" fill="#34d399" fontSize="12" fontWeight="700">Root 0</text>
          </g>

          {!hasCompressed ? (
            /* Linear chain 3 -> 2 -> 1 -> 0 */
            <>
              <line x1="250" y1="55" x2="250" y2="75" stroke="#a78bfa" strokeWidth="2" />
              <g transform="translate(250, 85)"><circle r="15" fill="rgba(255,255,255,0.05)" stroke="#a78bfa" /><text textAnchor="middle" dy="4" fill="#ffffff" fontSize="11">1</text></g>

              <line x1="250" y1="100" x2="250" y2="120" stroke="#a78bfa" strokeWidth="2" />
              <g transform="translate(250, 135)"><circle r="15" fill="rgba(255,255,255,0.05)" stroke="#a78bfa" /><text textAnchor="middle" dy="4" fill="#ffffff" fontSize="11">2</text></g>
            </>
          ) : (
            /* Flattened star graph directly pointing to Root 0 */
            <>
              <line x1="235" y1="45" x2="160" y2="105" stroke="#34d399" strokeWidth="2" />
              <g transform="translate(160, 115)"><circle r="16" fill="rgba(52,211,153,0.2)" stroke="#34d399" /><text textAnchor="middle" dy="4" fill="#ffffff" fontSize="11">1</text></g>

              <line x1="265" y1="45" x2="340" y2="105" stroke="#34d399" strokeWidth="2" />
              <g transform="translate(340, 115)"><circle r="16" fill="rgba(52,211,153,0.2)" stroke="#34d399" /><text textAnchor="middle" dy="4" fill="#ffffff" fontSize="11">2</text></g>
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-purple" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '13px', marginBottom: '4px' }}>
          {hasCompressed ? 'Flattened Tree: All nodes point directly to Root 0! Height = 1.' : 'Uncompressed Deep Chain: Traversing requires O(N) hops.'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          With Path Compression + Union by Rank, DSU achieves nearly O(1) amortized inverse Ackermann α(N) time!
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 19. Week 19: Bit Manipulation & Math
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek19BitManipulationDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek19BitManipulationDiagram(): React.JSX.Element {
  const [num, setNum] = useState<number>(12); // binary 1100

  // Brian Kernighan's algorithm: n & (n - 1) clears lowest set bit
  const nMinusOne = num > 0 ? num - 1 : 0;
  const cleared = num & nMinusOne;

  const toBinary = (n: number) => (n >>> 0).toString(2).padStart(8, '0');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Brian Kernighan's Bit Manipulation Trick (Clear LSB: n & (n - 1))
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[12, 14, 25, 40].map((v) => (
            <button key={v} onClick={() => setNum(v)} style={{ padding: '3px 8px', borderRadius: '5px', border: num === v ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: num === v ? 'rgba(56,189,248,0.2)' : 'transparent', color: num === v ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11px', cursor: 'pointer' }}>
              n = {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'var(--ifm-font-family-monospace, monospace)', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(56,189,248,0.1)', borderRadius: '6px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>n ({num}):</span>
            <span style={{ color: '#ffffff', letterSpacing: '2px' }}>{toBinary(num)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
            <span style={{ color: '#94a3b8' }}>n - 1 ({nMinusOne}):</span>
            <span style={{ color: '#e2e8f0', letterSpacing: '2px' }}>{toBinary(nMinusOne)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(52,211,153,0.15)', borderRadius: '6px', border: '1px solid #34d399' }}>
            <span style={{ color: '#34d399', fontWeight: 700 }}>n & (n - 1) = {cleared}:</span>
            <span style={{ color: '#34d399', fontWeight: 700, letterSpacing: '2px' }}>{toBinary(cleared)}</span>
          </div>
        </div>
      </div>

      <div className="interactive-diagram-details-card details-blue" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px', marginBottom: '4px' }}>
          Clears the lowest set bit in O(1) CPU instruction cycle!
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Counting set bits (Hamming Weight) takes O(k) iterations where k is the number of 1-bits, rather than checking all 32 bits.
        </div>
      </div>
    </div>
  );
}
'''

# ------------------------------------------------------------------------------
# 20. Week 20: Comprehensive Review & Systems (LRU Cache)
# ------------------------------------------------------------------------------
COMPONENTS['DsaWeek20LruCacheDiagram'] = '''import React, { useState } from 'react';

export default function DsaWeek20LruCacheDiagram(): React.JSX.Element {
  const [action, setAction] = useState<string>('init');

  // LRU with Capacity = 3: Head <-> [K1] <-> [K2] <-> [K3] <-> Tail
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          LRU Cache Architecture (Hash Map + Doubly Linked List)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setAction('get')} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: '#38bdf8', color: '#090b14', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            get(2) -> Move to Head
          </button>
          <button onClick={() => setAction('evict')} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: '#f87171', color: '#090b14', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            put(4) -> Evict LRU Tail
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 140" style={{ width: '100%', minWidth: '440px', height: 'auto' }}>
          <defs>
            <marker id="lru-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Dummy Head */}
          <g transform="translate(30, 45)">
            <rect width="60" height="35" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" />
            <text x="30" y="22" textAnchor="middle" fill="#94a3b8" fontSize="10">HEAD</text>
          </g>

          {/* Doubly Linked Nodes */}
          {[
            { key: action === 'get' ? 2 : (action === 'evict' ? 4 : 1), val: 'V1', pos: 120, label: 'Most Recent' },
            { key: action === 'get' ? 1 : 2, val: 'V2', pos: 230, label: 'Active' },
            { key: action === 'evict' ? 2 : 3, val: 'V3', pos: 340, label: action === 'evict' ? 'New LRU' : 'Least Recent' },
          ].map((n, i) => (
            <g key={`lru-${i}`} transform={`translate(${n.pos}, 45)`}>
              <rect width="80" height="35" rx="6" fill={i === 0 ? 'rgba(52,211,153,0.25)' : 'rgba(56,189,248,0.15)'} stroke={i === 0 ? '#34d399' : '#38bdf8'} strokeWidth="1.5" />
              <text x="40" y="22" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">[{n.key}: {n.val}]</text>
              <text x="40" y="50" textAnchor="middle" fill={i === 0 ? '#34d399' : '#64748b'} fontSize="9">{n.label}</text>
            </g>
          ))}

          {/* Dummy Tail */}
          <g transform="translate(450, 45)">
            <rect width="60" height="35" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" />
            <text x="30" y="22" textAnchor="middle" fill="#94a3b8" fontSize="10">TAIL</text>
          </g>

          {/* Connectors */}
          <line x1="90" y1="62" x2="120" y2="62" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#lru-arrow)" />
          <line x1="200" y1="62" x2="230" y2="62" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#lru-arrow)" />
          <line x1="310" y1="62" x2="340" y2="62" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#lru-arrow)" />
          <line x1="420" y1="62" x2="450" y2="62" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#lru-arrow)" />
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-amber" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '13px', marginBottom: '4px' }}>
          O(1) Get and O(1) Put Guarantees via Hash Table Lookup + Doubly Linked List Node Splice.
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          HashMap stores Key -> Node reference. Dummy Head and Tail sentinels eliminate edge-case null pointer checks.
        </div>
      </div>
    </div>
  );
}
'''

def write_components():
    print("=" * 70)
    print("Writing 20 DSA Interactive React Diagram Components...")
    print("=" * 70)
    for name, code in COMPONENTS.items():
        filepath = os.path.join(COMPONENTS_DIR, f"{name}.tsx")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"✓ Created {name}.tsx")

if __name__ == '__main__':
    write_components()
