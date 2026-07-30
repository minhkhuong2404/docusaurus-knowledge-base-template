import React, { useState } from 'react';

interface Step {
  step: number;
  title: string;
  codeSnippet: string;
  description: string;
  color: string;
}

const STEPS: Step[] = [
  {
    step: 1,
    title: '1. Maven Dependency Included',
    codeSnippet: '<dependency>\n  <groupId>com.company</groupId>\n  <artifactId>shared-service-chassis</artifactId>\n</dependency>',
    description: 'The target microservice includes the chassis JAR in pom.xml. No `@EnableChassis` annotation required in Spring Boot 3.',
    color: '#38bdf8',
  },
  {
    step: 2,
    title: '2. Imports Discovery',
    codeSnippet: '# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports\ncom.company.chassis.ChassisAutoConfiguration',
    description: 'Spring Boot 3 scans the classpath and locates the chassis AutoConfiguration registration entry point.',
    color: '#34d399',
  },
  {
    step: 3,
    title: '3. Root Auto-Configuration Evaluation',
    codeSnippet: '@AutoConfiguration\n@ConditionalOnWebApplication\n@Import({ MdcFilter.class, SecurityFilter.class, ExceptionHandler.class })\npublic class ChassisAutoConfiguration { ... }',
    description: 'Spring checks conditions (@ConditionalOnWebApplication). If true, it imports all infrastructure sub-configurations.',
    color: '#fbbf24',
  },
  {
    step: 4,
    title: '4. Conditional Bean Binding (@ConditionalOnMissingBean)',
    codeSnippet: '@Bean\n@ConditionalOnMissingBean\npublic RequestIdGenerator requestIdGenerator() { ... }',
    description: 'Chassis beans are registered ONLY if the target service hasn\'t declared its own custom bean, guaranteeing easy overrides.',
    color: '#a78bfa',
  },
];

export default function ChassisAutoConfigDiagram() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const current = STEPS.find(s => s.step === activeStep) || STEPS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span>Spring Boot 3 Auto-Configuration Lifecycle</span>
      </div>

      {/* Step Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {STEPS.map(s => (
          <button
            key={s.step}
            onClick={() => setActiveStep(s.step)}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11.5px', fontWeight: 700,
              background: activeStep === s.step ? `${s.color}20` : 'rgba(255,255,255,0.04)',
              color: activeStep === s.step ? s.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeStep === s.step ? `0 0 0 1.5px ${s.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            Step {s.step}
          </button>
        ))}
      </div>

      {/* Step Detail */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: current.color, marginBottom: '8px' }}>
          {current.title}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginBottom: '12px', lineHeight: '1.5' }}>
          {current.description}
        </div>
        <pre style={{ margin: 0, padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: current.color, fontSize: '11px', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.08)' }}>
          {current.codeSnippet}
        </pre>
      </div>
    </div>
  );
}
