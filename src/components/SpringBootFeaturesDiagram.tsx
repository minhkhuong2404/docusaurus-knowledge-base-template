import React, { useState } from 'react';

interface FeatureInfo {
  name: string;
  desc: string;
  example: string;
}

const SPRING_CORES: FeatureInfo[] = [
  { name: 'IoC Container & DI', desc: 'Manages object lifecycles and dependency resolution.', example: '@Component, @Autowired, @Bean' },
  { name: 'AOP (Aspects)', desc: 'Decouples cross-cutting concerns like logging and transactions.', example: '@Aspect, @Around' },
  { name: 'Transaction Mgmt', desc: 'Provides consistent programmatic and declarative transaction boundaries.', example: '@Transactional' },
  { name: 'Spring MVC / Web', desc: 'Robust HTTP endpoint mapping, handler mapping, and REST controller support.', example: '@RestController, @GetMapping' },
  { name: 'Spring Security Integration', desc: 'Enterprise security, filter chains, and authorization hooks.', example: 'SecurityFilterChain, @PreAuthorize' },
];

const BOOT_ADDITIONS: FeatureInfo[] = [
  { name: 'Auto-Configuration', desc: 'Opinionated bean provisioning based on JARs found on the classpath.', example: '@SpringBootApplication' },
  { name: 'Starter Dependencies', desc: 'Pre-packaged dependency descriptors managing versions cleanly to avoid jar hell.', example: 'spring-boot-starter-web' },
  { name: 'Embedded Web Server', desc: 'Integrates Tomcat, Jetty, or Undertow inside the runtime JAR directly.', example: 'server.port=8080' },
  { name: 'Actuator Metrics', desc: 'Production-ready operational endpoints for health, metrics, and env configuration.', example: '/actuator/health, /actuator/prometheus' },
  { name: 'Externalized Config', desc: 'Flexible property loading overriding hierarchies from profiles, env vars, or YAML.', example: 'application.yml, Spring Profiles' },
];

export default function SpringBootFeaturesDiagram(): React.JSX.Element {
  const [activeGroup, setActiveGroup] = useState<'spring' | 'boot'>('boot');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const list = activeGroup === 'spring' ? SPRING_CORES : BOOT_ADDITIONS;
  const selected = list.find(f => f.name === selectedFeature);
  const themeColor = activeGroup === 'spring' ? '#38bdf8' : '#34d399';

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span>What Spring Boot Adds on Top of Spring</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => { setActiveGroup('spring'); setSelectedFeature(null); }}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            background: activeGroup === 'spring' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
            color: activeGroup === 'spring' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeGroup === 'spring' ? '0 0 0 1.5px rgba(56,189,248,0.4)' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          Spring Framework (Foundation)
        </button>
        <button
          onClick={() => { setActiveGroup('boot'); setSelectedFeature(null); }}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            background: activeGroup === 'boot' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
            color: activeGroup === 'boot' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeGroup === 'boot' ? '0 0 0 1.5px rgba(52,211,153,0.4)' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          Spring Boot additions (Accelerators)
        </button>
      </div>

      {/* Content layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Feature Buttons List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {list.map(f => (
            <button
              key={f.name}
              onClick={() => setSelectedFeature(selectedFeature === f.name ? null : f.name)}
              style={{
                display: 'flex', flexDirection: 'column', gap: '2px',
                padding: '10px 14px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', textAlign: 'left',
                background: selectedFeature === f.name ? `${themeColor}15` : 'rgba(255,255,255,0.03)',
                boxShadow: selectedFeature === f.name
                  ? `0 0 0 1.5px ${themeColor}50`
                  : '0 0 0 1px rgba(255,255,255,0.07)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: themeColor }}>{f.name}</span>
              <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)' }}>{f.desc}</span>
            </button>
          ))}
        </div>

        {/* Info detail card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: selected ? 'flex-start' : 'center',
        }}>
          {selected ? (
            <div>
              <h4 style={{ color: themeColor, fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0' }}>
                {selected.name}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '12px' }}>
                {selected.desc}
              </p>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Representative Keywords
                </div>
                <code style={{ fontSize: '11.5px', background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  {selected.example}
                </code>
              </div>

              <div style={{ background: `${themeColor}0e`, border: `1px solid ${themeColor}30`, borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: themeColor, marginBottom: '2px' }}>
                  Design Benefit
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {activeGroup === 'spring' 
                    ? 'Acts as standard framework capability enabling highly customized decoupled component designs.' 
                    : 'Removes boilerplate and manual orchestration, allowing teams to deliver business value within minutes.'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '12.5px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.3 }}>⚙️</div>
              Select a feature to explore code examples and design benefits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
