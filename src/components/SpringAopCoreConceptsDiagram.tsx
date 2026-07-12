import React, { useState } from 'react';

interface ConceptDetail {
  name: string;
  color: string;
  role: string;
  gotcha: string;
}

const CONCEPTS: Record<string, ConceptDetail> = {
  CLIENT: {
    name: '1. Caller (Client)',
    color: '#38bdf8',
    role: 'Calls methods on the bean (e.g., orderService.createOrder()). Believes it holds a direct reference to the raw target object.',
    gotcha: 'Bypasses AOP entirely if methods are called internally (self-invocation via "this.method()") because the call does not pass through the proxy.',
  },
  PROXY: {
    name: '2. Spring AOP Proxy',
    color: '#a78bfa',
    role: 'Generated wrapper (CGLIB subclass or JDK Dynamic Proxy). Intercepts all incoming invocations on public methods.',
    gotcha: 'Cannot proxy final classes, final methods, or private methods. Forces CGLIB by default in Spring Boot 2.x/3.x.',
  },
  ADVICE: {
    name: '3. Advice (@Around/@Before)',
    color: '#fbbf24',
    role: 'The code injected at Join Points. Runs before, after, or around target execution (e.g. opening a @Transactional connection).',
    gotcha: '@Around advice must explicitly invoke ProceedingJoinPoint.proceed() or the target method will never execute!',
  },
  TARGET: {
    name: '4. Target Object',
    color: '#34d399',
    role: 'The raw, framework-free user bean class containing pure business logic (e.g., OrderServiceImpl).',
    gotcha: 'Knows nothing about proxies or aspects. Retains its plain Java execution boundaries.',
  },
};

export default function SpringAopCoreConceptsDiagram(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<string | null>('PROXY');

  const current = selectedNode ? CONCEPTS[selectedNode] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Spring AOP Proxy Interception Architecture</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Visual Graph representation */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '10px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', justifyContent: 'center',
        }}>
          
          {/* Client Caller */}
          <div
            onClick={() => setSelectedNode('CLIENT')}
            style={{
              padding: '10px', borderRadius: '6px', cursor: 'pointer', textAlign: 'center',
              background: selectedNode === 'CLIENT' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${selectedNode === 'CLIENT' ? '#38bdf8' : 'rgba(255,255,255,0.05)'}`,
              color: '#38bdf8', fontSize: '12px', fontWeight: 700, transition: 'all 0.2s',
            }}
          >
            Caller Client (User Thread)
          </div>

          <div style={{ textAlign: 'center', fontSize: '10px', color: '#475569' }}>▼ invokes method</div>

          {/* Proxy Object Container */}
          <div
            onClick={() => setSelectedNode('PROXY')}
            style={{
              padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
              background: selectedNode === 'PROXY' ? 'rgba(167,135,250,0.15)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${selectedNode === 'PROXY' ? '#a78bfa' : 'rgba(167,135,250,0.4)'}`,
              color: '#a78bfa', fontSize: '13px', fontWeight: 800, transition: 'all 0.2s',
              boxShadow: selectedNode === 'PROXY' ? '0 0 10px rgba(167,135,250,0.2)' : 'none',
            }}
          >
            Spring AOP Proxy Wrapper
            <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600, marginTop: '3px' }}>
              CGLIB Subclass Proxy / JDK Proxy
            </div>

            {/* Injected Advice Node inside proxy */}
            <div
              onClick={(e) => { e.stopPropagation(); setSelectedNode('ADVICE'); }}
              style={{
                marginTop: '8px', padding: '6px', borderRadius: '4px', cursor: 'pointer',
                background: selectedNode === 'ADVICE' ? 'rgba(251,191,36,0.2)' : 'rgba(0,0,0,0.2)',
                border: `1.2px solid ${selectedNode === 'ADVICE' ? '#fbbf24' : 'rgba(255,255,255,0.08)'}`,
                color: '#fbbf24', fontSize: '11px', fontWeight: 700, transition: 'all 0.2s',
              }}
            >
              Advice Interceptor (@Before, @Around)
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '10px', color: '#475569' }}>▼ delegates on proceed()</div>

          {/* Target Bean */}
          <div
            onClick={() => setSelectedNode('TARGET')}
            style={{
              padding: '10px', borderRadius: '6px', cursor: 'pointer', textAlign: 'center',
              background: selectedNode === 'TARGET' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${selectedNode === 'TARGET' ? '#34d399' : 'rgba(255,255,255,0.05)'}`,
              color: '#34d399', fontSize: '12px', fontWeight: 700, transition: 'all 0.2s',
            }}
          >
            Target Object (Raw Bean Entity)
          </div>

        </div>

        {/* Details Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: current ? 'flex-start' : 'center',
        }}>
          {current ? (
            <div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: current.color, display: 'block', marginBottom: '8px' }}>
                {current.name}
              </span>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Architecture Role
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  {current.role}
                </div>
              </div>

              <div style={{ background: `${current.color}0e`, border: `1px solid ${current.color}30`, borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, marginBottom: '3px' }}>
                  ⚠️ Critical Gotcha / Trap
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {current.gotcha}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Click on any component blocks in the proxy pipeline diagram on the left to see runtime AOP details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
