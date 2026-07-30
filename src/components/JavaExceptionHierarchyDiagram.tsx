import React, { useState } from 'react';

interface ExceptionNode {
  id: string;
  name: string;
  category: 'root' | 'error' | 'unchecked' | 'checked';
  color: string;
  compilerRule: string;
  catchPolicy: string;
  examples: string[];
  description: string;
}

const EXCEPTION_NODES: ExceptionNode[] = [
  {
    id: 'throwable',
    name: 'Throwable',
    category: 'root',
    color: '#a78bfa',
    compilerRule: 'Base class for all errors and exceptions in Java.',
    catchPolicy: 'Do not catch Throwable directly in application code.',
    examples: ['java.lang.Throwable'],
    description: 'The superclass of all errors and exceptions in the Java language. Only instances of this class (or subclasses) can be thrown by JVM or throw statements.',
  },
  {
    id: 'error',
    name: 'Error',
    category: 'error',
    color: '#f87171',
    compilerRule: 'Unchecked — Represents serious JVM hardware or memory failures.',
    catchPolicy: 'NEVER catch Error — application cannot recover from JVM failures.',
    examples: ['OutOfMemoryError', 'StackOverflowError', 'NoClassDefFoundError'],
    description: 'Indicates serious problems that a reasonable application should not try to catch. Usually unrecoverable JVM faults.',
  },
  {
    id: 'unchecked',
    name: 'RuntimeException (Unchecked)',
    category: 'unchecked',
    color: '#34d399',
    compilerRule: 'Unchecked — Compiler does NOT require try-catch or throws declaration.',
    catchPolicy: 'Catch centrally in @RestControllerAdvice to return structured JSON error responses.',
    examples: ['NullPointerException', 'IllegalArgumentException', 'UserNotFoundException', 'IllegalStateException'],
    description: 'Subclasses of Exception that can be thrown during normal JVM operation. Used for programming bugs and custom business domain rule violations.',
  },
  {
    id: 'checked',
    name: 'Checked Exceptions (Exception Subclasses)',
    category: 'checked',
    color: '#fbbf24',
    compilerRule: 'Checked — Compiler MANDATES catch block or explicit throws signature.',
    catchPolicy: 'Catch locally or wrap in custom RuntimeException for clean API boundary propagation.',
    examples: ['IOException', 'SQLException', 'FileNotFoundException', 'ParseException'],
    description: 'Extends Exception directly (not RuntimeException). Represents recoverable external conditions such as network timeouts or missing files.',
  },
];

export default function JavaExceptionHierarchyDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<ExceptionNode>(EXCEPTION_NODES[2]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Java Exception Hierarchy &amp; Compiler Rules Explorer</span>
      </div>

      {/* Node Selector Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
        {EXCEPTION_NODES.map(node => {
          const isSelected = selected.id === node.id;
          return (
            <button
              key={node.id}
              onClick={() => setSelected(node)}
              style={{
                padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 700, textAlign: 'center',
                background: isSelected ? `${node.color}25` : 'rgba(255,255,255,0.03)',
                color: isSelected ? node.color : 'var(--ifm-color-content-secondary)',
                boxShadow: isSelected ? `0 0 0 1.5px ${node.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease',
              }}
            >
              {node.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Hierarchy Visual Canvas */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          {/* Root Throwable */}
          <div
            onClick={() => setSelected(EXCEPTION_NODES[0])}
            style={{
              width: '60%', padding: '10px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
              background: selected.id === 'throwable' ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.08)',
              border: '1.5px solid #a78bfa', color: '#a78bfa', fontWeight: 800, fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
          >
            java.lang.Throwable
          </div>

          <div style={{ fontSize: '14px', color: 'var(--ifm-color-content-secondary)', fontWeight: 800 }}>│</div>

          {/* Subclasses Branch */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '12px', width: '100%' }}>
            {/* Error Branch */}
            <div
              onClick={() => setSelected(EXCEPTION_NODES[1])}
              style={{
                padding: '12px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
                background: selected.id === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(248,113,113,0.08)',
                border: '1.5px solid #f87171', color: '#f87171', fontWeight: 800, fontSize: '12px',
                transition: 'all 0.2s ease',
              }}
            >
              Error (JVM Fatal)
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                OutOfMemoryError
              </div>
            </div>

            {/* Exception Sub-Branch */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div
                onClick={() => setSelected(EXCEPTION_NODES[2])}
                style={{
                  padding: '12px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
                  background: selected.id === 'unchecked' ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.08)',
                  border: '2px solid #34d399', color: '#34d399', fontWeight: 800, fontSize: '11.5px',
                  transition: 'all 0.2s ease',
                }}
              >
                RuntimeException
                <div style={{ fontSize: '9.5px', fontWeight: 600, color: '#34d399', marginTop: '4px' }}>
                  Unchecked (Domain &amp; Bugs)
                </div>
              </div>

              <div
                onClick={() => setSelected(EXCEPTION_NODES[3])}
                style={{
                  padding: '12px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
                  background: selected.id === 'checked' ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.08)',
                  border: '1.5px solid #fbbf24', color: '#fbbf24', fontWeight: 800, fontSize: '11.5px',
                  transition: 'all 0.2s ease',
                }}
              >
                Checked Exception
                <div style={{ fontSize: '9.5px', fontWeight: 600, color: '#fbbf24', marginTop: '4px' }}>
                  Enforced by Compiler
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Details Card */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${selected.color}50` }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: selected.color, marginBottom: '6px' }}>
          {selected.name}
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5', marginBottom: '8px' }}>
          {selected.description}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 10px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Compiler Rule</div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{selected.compilerRule}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 10px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Handling Policy</div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{selected.catchPolicy}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: selected.color, border: '1px solid rgba(255,255,255,0.08)' }}>
          Common Examples: {selected.examples.join(', ')}
        </div>
      </div>
    </div>
  );
}
