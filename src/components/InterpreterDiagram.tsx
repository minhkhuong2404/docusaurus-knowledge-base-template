import React, { useState } from 'react';

interface ExpressionType {
  id: string;
  name: string;
  badge: string;
  color: string;
  grammaticalRole: string;
  evalMethod: string;
  exampleExpression: string;
}

const EXPRESSIONS: ExpressionType[] = [
  {
    id: 'terminal',
    name: '1. Terminal Expression (Variables / Literals)',
    badge: 'LEAF LITERAL',
    color: '#38bdf8', // Sky Blue
    grammaticalRole: 'Leaf node in AST grammar tree representing primitive values or variable context lookups.',
    evalMethod: 'interpret(Context context) -> returns context.getValue("x")',
    exampleExpression: 'NumberExpression(5) or VariableExpression("x")'
  },
  {
    id: 'nonterminal',
    name: '2. Non-Terminal Expression (Operators)',
    badge: 'COMPOSITE OPERATOR',
    color: '#a78bfa', // Purple
    grammaticalRole: 'Branch node combining sub-expressions via mathematical or logical grammar rules (+, -, AND, OR).',
    evalMethod: 'interpret(Context context) -> left.interpret(context) + right.interpret(context)',
    exampleExpression: 'AddExpression(leftExpr, rightExpr) -> (5 + x)'
  }
];

export default function InterpreterDiagram() {
  const [activeId, setActiveId] = useState<string>('nonterminal');
  const current = EXPRESSIONS.find(e => e.id === activeId) || EXPRESSIONS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Interpreter Design Pattern: AST Expression Grammar Evaluation</span>
      </div>

      {/* Selector Grid */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {EXPRESSIONS.map((e) => {
            const isActive = activeId === e.id;
            return (
              <div
                key={e.id}
                onClick={() => setActiveId(e.id)}
                style={{
                  background: isActive ? `${e.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? e.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: e.color, background: `${e.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {e.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {e.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Inspector */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.grammaticalRole}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Evaluation Method Logic
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {current.evalMethod}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Example Grammar Expression
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {current.exampleExpression}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
