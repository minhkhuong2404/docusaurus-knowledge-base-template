import React, { useState, useEffect } from 'react';

interface StartupStep {
  id: number;
  time: string;
  phase: string;
  title: string;
  color: string;
  actions: string[];
  note: string;
}

const STARTUP_STEPS: StartupStep[] = [
  {
    id: 1,
    time: '0ms',
    phase: 'Instantiation',
    title: 'SpringApplication Instantiation',
    color: '#38bdf8',
    actions: ['Check classpath for web dependencies', 'Determine web environment type (Servlet, Reactive, None)', 'Locate Initializers & Listeners via META-INF/spring.factories'],
    note: 'Initializes early listeners to intercept startup events. No context exists yet.',
  },
  {
    id: 2,
    time: '200ms',
    phase: 'Environment Prep',
    title: 'Environment & Profile Loading',
    color: '#fbbf24',
    actions: ['Load OS system environment variables', 'Read application.properties / application.yml', 'Activate specific Spring Profiles', 'Merge into consolidated Environment bean'],
    note: 'Consolidates properties from YAML, profiles, and OS env vars. Binds environment configuration values.',
  },
  {
    id: 3,
    time: '500ms',
    phase: 'Context Create',
    title: 'ApplicationContext Initialization',
    color: '#a78bfa',
    actions: ['Instantiate AnnotationConfigServletWebServerApplicationContext', 'Register core internal processor beans', 'Apply initializers to Context'],
    note: 'Builds the empty bean container. Serves as parent/child context structure setup.',
  },
  {
    id: 4,
    time: '1200ms',
    phase: 'Auto-Config Scan',
    title: 'Auto-Configuration Deep Scan',
    color: '#f472b6',
    actions: ['Scan AutoConfiguration.imports classpath references', 'Evaluate conditional selectors (@ConditionalOnClass, @ConditionalOnMissingBean)', 'Register compatible configuration beans'],
    note: 'Spring Boot evaluates conditional boundaries to decide which libraries to bootstrap automatically.',
  },
  {
    id: 5,
    time: '2000ms',
    phase: 'User Beans Load',
    title: 'User Component scan & DI Graph',
    color: '#f97316',
    actions: ['Scan package routes from @SpringBootApplication class', 'Parse user-defined classes (@Service, @Repository, @Controller)', 'Instantiate custom beans', 'Perform dependency injection (@Autowired)', 'Execute @PostConstruct methods'],
    note: 'Builds the dependency tree of your code, hooks up connections, and performs constructor injection.',
  },
  {
    id: 6,
    time: '2700ms',
    phase: 'Server Boot',
    title: 'Embedded Web Server Startup',
    color: '#2dd4bf',
    actions: ['Bootstrap Tomcat, Jetty, or Undertow server engine', 'Bind TCP/IP port (default 8080)', 'Publish context to Servlet container'],
    note: 'Starts the listening server port only after the application configuration context is completely healthy.',
  },
  {
    id: 7,
    time: '3000ms',
    phase: 'Fired Runners',
    title: 'Application Ready Event & Runners',
    color: '#34d399',
    actions: ['Publish ApplicationReadyEvent', 'Invoke CommandLineRunner implementations', 'Invoke ApplicationRunner implementations', 'Print "Started Application in X seconds" in console'],
    note: 'Transitions to fully functional runtime loop. External metrics/log pipelines register readiness.',
  },
];

export default function SpringBootStartupTimelineDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(4); // Default to Auto-Config step
  const [isPlaying, setIsPlaying] = useState(false);
  const [animIndex, setAnimIndex] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    if (animIndex >= STARTUP_STEPS.length) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setActiveStep(animIndex);
      setAnimIndex(idx => idx + 1);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isPlaying, animIndex]);

  const startAnimation = () => {
    setActiveStep(null);
    setAnimIndex(0);
    setIsPlaying(true);
  };

  const selectedStep = activeStep !== null ? STARTUP_STEPS[activeStep] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>Spring Boot Startup Lifecycle Timeline</span>
        <button
          onClick={startAnimation}
          disabled={isPlaying}
          style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px',
            border: 'none', cursor: isPlaying ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: isPlaying ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)',
            color: isPlaying ? 'var(--ifm-color-content-secondary)' : '#38bdf8',
            boxShadow: isPlaying ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {isPlaying ? 'Animating...' : 'Animate Startup'}
        </button>
      </div>

      {/* Horizontal timeline bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', margin: '20px 10px 30px 10px', paddingBottom: '10px',
        overflowX: 'auto',
      }}>
        {/* Progress connector line */}
        <div style={{
          position: 'absolute', top: '23px', left: '20px', right: '20px', height: '3px',
          background: 'rgba(255,255,255,0.08)', zIndex: 1,
        }} />

        {STARTUP_STEPS.map((s, idx) => {
          const isCurrent = activeStep === idx;
          const isPassed = activeStep !== null && idx < activeStep;
          const stepColor = s.color;
          return (
            <div
              key={s.id}
              onClick={() => { if (!isPlaying) setActiveStep(idx); }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                zIndex: 2, cursor: isPlaying ? 'not-allowed' : 'pointer', minWidth: '70px',
              }}
            >
              {/* Time stamp label */}
              <span style={{
                fontSize: '10px', fontFamily: 'monospace', fontWeight: 700,
                color: isCurrent ? stepColor : '#64748b', marginBottom: '6px',
                transition: 'color 0.2s',
              }}>
                {s.time}
              </span>

              {/* Node node circle */}
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: isCurrent ? `${stepColor}25` : isPassed ? stepColor : '#1e293b',
                border: `2px solid ${isCurrent || isPassed ? stepColor : 'rgba(255,255,255,0.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isCurrent ? `0 0 10px ${stepColor}` : 'none',
                transition: 'all 0.3s ease',
              }}>
                {isPassed ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 800, color: isCurrent ? stepColor : '#64748b' }}>
                    {s.id}
                  </span>
                )}
              </div>

              {/* Phase name */}
              <span style={{
                fontSize: '9.5px', fontWeight: 600, marginTop: '8px',
                color: isCurrent ? stepColor : '#94a3b8', textTransform: 'uppercase',
                letterSpacing: '0.03em', textAlign: 'center', transition: 'color 0.2s',
              }}>
                {s.phase}
              </span>
            </div>
          );
        })}
      </div>

      {/* Details Area */}
      {selectedStep ? (
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: `1.5px solid ${selectedStep.color}40`, padding: '20px',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ color: selectedStep.color, fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Phase {selectedStep.id}: {selectedStep.title}
            </h4>
            <span style={{
              fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
              background: `${selectedStep.color}15`, color: selectedStep.color,
            }}>
              Est. time: {selectedStep.time}
            </span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px', fontStyle: 'italic' }}>
            {selectedStep.note}
          </p>

          <div style={{ fontSize: '10.5px', fontWeight: 700, color: selectedStep.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Key Lifecycle Actions
          </div>
          <ul style={{ paddingLeft: '16px', margin: 0 }}>
            {selectedStep.actions.map((act, i) => (
              <li key={i} style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginBottom: '4px', lineHeight: 1.4 }}>
                {act}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)' }}>
            Select a timeline node or click Animate Startup to watch the bootstrap flow.
          </span>
        </div>
      )}
    </div>
  );
}
