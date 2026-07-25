import React, { useState } from 'react';

interface AllocationItem {
  name: string;
  tokens: number;
  color: string;
  description: string;
}

export default function ContextWindowBudgetDiagram() {
  const [historyTurns, setHistoryTurns] = useState<number>(5);

  const totalWindow = 128000;
  const systemPromptTokens = 2000;
  const toolDefinitionsTokens = 4000;
  const ragDocsTokens = 20000;
  const taskContextTokens = 5000;
  const conversationHistoryTokens = historyTurns * 6000; // 6k per turn

  const usedTokens = systemPromptTokens + toolDefinitionsTokens + ragDocsTokens + taskContextTokens + conversationHistoryTokens;
  const remainingTokens = Math.max(0, totalWindow - usedTokens);
  const usedPercent = Math.min(100, Math.round((usedTokens / totalWindow) * 100));

  const ALLOCATIONS: AllocationItem[] = [
    { name: 'System Prompt', tokens: systemPromptTokens, color: '#38bdf8', description: 'Core agent instructions & behavioral guidelines' },
    { name: 'Tool Definitions (20 tools)', tokens: toolDefinitionsTokens, color: '#a78bfa', description: 'JSON schemas for available function tools' },
    { name: 'Retrieved RAG Docs', tokens: ragDocsTokens, color: '#fbbf24', description: 'Codebase files & external documentation chunks' },
    { name: 'Current Task Context', tokens: taskContextTokens, color: '#2dd4bf', description: 'Active user goal and current turn parameters' },
    { name: `Conversation History (${historyTurns} turns)`, tokens: conversationHistoryTokens, color: '#f87171', description: 'Accumulated turn history + tool observations' }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>The Context Window Budget Breakdown Simulator</span>
      </div>

      {/* Interactive Controls & Gauge */}
      <div style={{ padding: '20px', background: '#0d0f1e' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', fontWeight: 700, marginBottom: '4px' }}>
              Simulate Conversation History Growth:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min={1}
                max={18}
                value={historyTurns}
                onChange={(e) => setHistoryTurns(Number(e.target.value))}
                style={{ width: '180px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f87171' }}>
                {historyTurns} Conversation Turns ({conversationHistoryTokens.toLocaleString()} tokens)
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              Total Capacity: <strong>128,000 Tokens</strong>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: remainingTokens < 20000 ? '#f87171' : '#34d399' }}>
              {remainingTokens.toLocaleString()} Tokens Remaining ({100 - usedPercent}% Free)
            </div>
          </div>
        </div>

        {/* Visual Token Allocation Progress Bar */}
        <div style={{ background: '#13162b', borderRadius: '8px', padding: '4px', height: '24px', display: 'flex', overflow: 'hidden', border: '1px solid #1e2342', marginBottom: '20px' }}>
          {ALLOCATIONS.map((item, idx) => {
            const widthPct = (item.tokens / totalWindow) * 100;
            return (
              <div
                key={idx}
                title={`${item.name}: ${item.tokens.toLocaleString()} tokens`}
                style={{
                  width: `${widthPct}%`,
                  background: item.color,
                  height: '100%',
                  transition: 'width 0.3s ease'
                }}
              />
            );
          })}
          <div
            title={`Remaining for Reasoning: ${remainingTokens.toLocaleString()} tokens`}
            style={{
              width: `${(remainingTokens / totalWindow) * 100}%`,
              background: '#34d399',
              height: '100%',
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        {/* Breakdown List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {ALLOCATIONS.map((item, idx) => (
            <div key={idx} style={{ background: '#090b14', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${item.color}40` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {item.name}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: item.color, fontWeight: 700 }}>
                {item.tokens.toLocaleString()} tokens ({Math.round((item.tokens / totalWindow) * 100)}%)
              </div>
            </div>
          ))}
          <div style={{ background: '#090b14', padding: '10px 12px', borderRadius: '6px', border: '1px solid #34d39940' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                Remaining LLM Reasoning Space
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
              {remainingTokens.toLocaleString()} tokens ({Math.round((remainingTokens / totalWindow) * 100)}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
