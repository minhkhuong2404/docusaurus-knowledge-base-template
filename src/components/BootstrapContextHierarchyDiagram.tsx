import React, { useState } from 'react';

interface ContextNode {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  sourceFiles: string[];
  features: string[];
  precedence: string;
  desc: string;
}

const CONTEXTS: Record<string, ContextNode> = {
  BOOTSTRAP: {
    id: 'BOOTSTRAP',
    title: '1. Bootstrap Context (Parent)',
    subtitle: 'Initialized first, sets up environment foundations',
    color: '#a78bfa',
    sourceFiles: ['bootstrap.yml', 'bootstrap.properties'],
    features: [
      'Connects to remote Configuration Servers (Consul, Vault, Config Server)',
      'Decrypts cipher properties dynamically',
      'Loads remote environment credentials',
    ],
    precedence: 'High Precedence (serves as parent of main context)',
    desc: 'The bootstrap context prepares the global Spring Environment. Properties loaded here are inherited by the child application context. It remains active but unchanging once initialized.',
  },
  APPLICATION: {
    id: 'APPLICATION',
    title: '2. Application Context (Child)',
    subtitle: 'Initialized second, runs components & web server',
    color: '#34d399',
    sourceFiles: ['application.yml', 'application.properties', 'Spring Profiles'],
    features: [
      'Registers user @Components, @Services, @Controllers',
      'Initializes local DataSources, pools, and JPA entities',
      'Starts the embedded web server (Tomcat/Netty)',
    ],
    precedence: 'Standard Precedence (inherits parent properties, overrides local keys)',
    desc: 'The main runtime context where your application beans live. It is spawned after the environment properties are loaded and decrypted in the parent bootstrap context.',
  },
};

export default function BootstrapContextHierarchyDiagram(): React.JSX.Element {
  const [activeCtx, setActiveCtx] = useState<string | null>('BOOTSTRAP');

  const current = activeCtx ? CONTEXTS[activeCtx] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span>Bootstrap Context vs. Application Context Hierarchy</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Visual representation */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', justifyContent: 'center',
        }}>
          
          {/* Bootstrap Parent Box */}
          <div
            onClick={() => setActiveCtx('BOOTSTRAP')}
            style={{
              padding: '16px', borderRadius: '8px', cursor: 'pointer',
              background: activeCtx === 'BOOTSTRAP' ? 'rgba(167,135,250,0.15)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${activeCtx === 'BOOTSTRAP' ? '#a78bfa' : 'rgba(167,135,250,0.3)'}`,
              boxShadow: activeCtx === 'BOOTSTRAP' ? '0 0 10px rgba(167,135,250,0.2)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', textAlign: 'center' }}>
              Bootstrap Context (Parent)
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
              Loads bootstrap.yml · Config Server · Vault
            </div>
          </div>

          {/* Flow indicator line (Parent-to-Child Inheritance) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
            </svg>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Parent-Child Inheritance
            </span>
          </div>

          {/* Application Child Box */}
          <div
            onClick={() => setActiveCtx('APPLICATION')}
            style={{
              padding: '16px', borderRadius: '8px', cursor: 'pointer',
              background: activeCtx === 'APPLICATION' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${activeCtx === 'APPLICATION' ? '#34d399' : 'rgba(52,211,153,0.3)'}`,
              boxShadow: activeCtx === 'APPLICATION' ? '0 0 10px rgba(52,211,153,0.2)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', textAlign: 'center' }}>
              Application Context (Child)
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
              Loads application.yml · Beans · Web Server
            </div>
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
              <span style={{ fontSize: '15px', fontWeight: 800, color: current.color, display: 'block', marginBottom: '2px' }}>
                {current.title}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'block', marginBottom: '10px', fontStyle: 'italic' }}>
                {current.subtitle}
              </span>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Configuration Sources
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {current.sourceFiles.map(f => (
                    <code key={f} style={{ fontSize: '10.5px', background: 'rgba(0,0,0,0.3)', color: current.color, padding: '2px 6px', borderRadius: '4px' }}>
                      {f}
                    </code>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Precedence
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>
                  {current.precedence}
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Primary Features &amp; Actions
                </div>
                <ul style={{ paddingLeft: '16px', margin: 0 }}>
                  {current.features.map((f, i) => (
                    <li key={i} style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', marginBottom: '3px' }}>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ background: `${current.color}0e`, border: `1px solid ${current.color}30`, borderRadius: '8px', padding: '10px', marginTop: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, marginBottom: '2px' }}>
                  Architecture Note
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {current.desc}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Click on Parent or Child context box on the left to see configuration lifecycle details and inheritance rules.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
