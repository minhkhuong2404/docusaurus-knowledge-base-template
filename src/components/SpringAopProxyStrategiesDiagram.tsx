import React, { useState } from 'react';

interface StrategyDetails {
  name: string;
  color: string;
  desc: string;
  requirements: string[];
  limitations: string[];
  visualModel: string;
  codeConfig: string;
}

const STRATEGIES: Record<'jdk' | 'cglib', StrategyDetails> = {
  jdk: {
    name: 'JDK Dynamic Proxy (Interface-Based)',
    color: '#38bdf8',
    desc: 'Uses Java standard reflection proxies. The target class must implement at least one interface. Spring generates a proxy implementing these interfaces at runtime.',
    requirements: [
      'Target class must implement one or more interfaces (e.g. MyService implements IMyService).',
      'Autowired references must inject the interface type, not the concrete implementation class.',
    ],
    limitations: [
      'Cannot proxy concrete classes that do not implement interfaces.',
      'Class-cast exceptions occur if callers try to cast the autowired bean back to the concrete class type.',
    ],
    visualModel: 'Caller ──► Proxy (implements IService) ──► Target (implements IService)',
    codeConfig: `@Autowired\nprivate IOrderService orderService; // Wires the JDK Proxy interface`,
  },
  cglib: {
    name: 'CGLIB Proxy (Subclass-Based)',
    color: '#34d399',
    desc: 'Uses Code Generation Library to construct a dynamic subclass of the target class at runtime. Intercepts calls and delegates via super call overrides.',
    requirements: [
      'Target class does not require interfaces.',
      'Autowired references can inject the concrete class type directly (default in Spring Boot 2.x/3.x).',
    ],
    limitations: [
      'Cannot proxy final classes (fails to subclass).',
      'Cannot proxy final methods (fails to override).',
      'Default constructor is invoked twice during instantiation.',
    ],
    visualModel: 'Caller ──► Proxy (extends OrderService) ──► super.method() on Target class',
    codeConfig: `// Spring Boot default: spring.aop.proxy-target-class=true\n@Autowired\nprivate OrderService orderService; // Wires the CGLIB subclass`,
  },
};

export default function SpringAopProxyStrategiesDiagram(): React.JSX.Element {
  const [activeStrategy, setActiveStrategy] = useState<'jdk' | 'cglib'>('jdk');
  const current = STRATEGIES[activeStrategy];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span>Spring AOP Proxying Strategies: JDK vs. CGLIB</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['jdk', 'cglib'] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveStrategy(s)}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '13px',
              background: activeStrategy === s ? `${STRATEGIES[s].color}18` : 'rgba(255,255,255,0.04)',
              color: activeStrategy === s ? STRATEGIES[s].color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeStrategy === s ? `0 0 0 1.5px ${STRATEGIES[s].color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {STRATEGIES[s].name}
          </button>
        ))}
      </div>

      {/* Grid container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Left Side: Summary & Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Execution Flow
            </div>
            <code style={{ fontSize: '12px', color: '#e2e8f0', display: 'block', wordBreak: 'break-all' }}>
              {current.visualModel}
            </code>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Wiring Code Pattern
            </div>
            <pre style={{
              fontFamily: 'monospace', fontSize: '11px', margin: 0,
              background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px',
              color: '#e2e8f0', overflowX: 'auto',
            }}>
              {current.codeConfig}
            </pre>
          </div>
        </div>

        {/* Right Side: Requirements & Limitations */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Requirements
            </div>
            <ul style={{ paddingLeft: '16px', margin: 0 }}>
              {current.requirements.map((req, idx) => (
                <li key={idx} style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', marginBottom: '3px' }}>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Limitations / Gotchas
            </div>
            <ul style={{ paddingLeft: '16px', margin: 0 }}>
              {current.limitations.map((lim, idx) => (
                <li key={idx} style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '3px' }}>
                  {lim}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
