import React, { useState } from 'react';

interface SingletonImplementation {
  id: string;
  name: string;
  badge: string;
  color: string;
  safety: string;
  howItWorks: string;
  codeSnippet: string;
}

const IMPLEMENTATIONS: SingletonImplementation[] = [
  {
    id: 'holder',
    name: '1. Bill Pugh Holder (Recommended)',
    badge: 'BEST PRACTICE',
    color: '#34d399', // Emerald
    safety: 'Thread-Safe, Lazy Loading, No Locking Overhead',
    howItWorks: 'Relies on JVM Class Loader guarantees. The static inner Holder class is not loaded into memory until getInstance() is invoked.',
    codeSnippet: 'public class Singleton {\n  private Singleton() {}\n  private static class Holder {\n    private static final Singleton INSTANCE = new Singleton();\n  }\n  public static Singleton getInstance() {\n    return Holder.INSTANCE;\n  }\n}'
  },
  {
    id: 'dcl',
    name: '2. Double-Checked Locking (DCL)',
    badge: 'THREAD-SAFE',
    color: '#38bdf8', // Sky Blue
    safety: 'Thread-Safe, Lazy Loading (Requires volatile)',
    howItWorks: 'Checks instance twice — before and after acquiring a lock on Singleton.class. Requires `volatile` to prevent instruction reordering.',
    codeSnippet: 'public class Singleton {\n  private static volatile Singleton instance;\n  private Singleton() {}\n  public static Singleton getInstance() {\n    if (instance == null) {\n      synchronized (Singleton.class) {\n        if (instance == null) instance = new Singleton();\n      }\n    }\n    return instance;\n  }\n}'
  },
  {
    id: 'enum',
    name: '3. Enum Singleton',
    badge: 'ATTACK PROOF',
    color: '#a78bfa', // Purple
    safety: 'Thread-Safe, Eager, Defends against Reflection & Serialization',
    howItWorks: 'Joshua Bloch (Effective Java) recommended approach. JVM handles instantiation and guarantees protection against reflection attacks.',
    codeSnippet: 'public enum Singleton {\n  INSTANCE;\n  public void doSomething() {\n    // Business logic\n  }\n}'
  },
  {
    id: 'naive',
    name: '4. Naive Lazy (Thread-Unsafe)',
    badge: 'UNSAFE',
    color: '#f87171', // Red
    safety: 'Thread-Unsafe (Multi-threading race hazard)',
    howItWorks: 'Creates new instance if null without synchronization. Two concurrent threads can both see instance==null and create duplicates.',
    codeSnippet: 'public class Singleton {\n  private static Singleton instance;\n  private Singleton() {}\n  public static Singleton getInstance() {\n    if (instance == null) { // Race condition!\n      instance = new Singleton();\n    }\n    return instance;\n  }\n}'
  }
];

export default function SingletonDiagram() {
  const [activeId, setActiveId] = useState<string>('holder');
  const current = IMPLEMENTATIONS.find(i => i.id === activeId) || IMPLEMENTATIONS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Singleton Design Pattern Implementations & Thread Safety</span>
      </div>

      {/* Implementation Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#0d0f1e',
        borderBottom: '1px solid #1e2342'
      }}>
        {IMPLEMENTATIONS.map((imp) => {
          const isActive = activeId === imp.id;
          return (
            <button
              key={imp.id}
              onClick={() => setActiveId(imp.id)}
              style={{
                background: isActive ? `${imp.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? imp.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: imp.color, background: `${imp.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                {imp.badge}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {imp.name.split('. ')[1]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '12px', color: current.color, fontWeight: 700, marginBottom: '12px' }}>
          {current.safety}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.howItWorks}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '6px' }}>
            Implementation Pattern
          </div>
          <pre style={{
            background: '#090b14',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '11px',
            color: 'var(--ifm-color-content)',
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace'
          }}>
            {current.codeSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
