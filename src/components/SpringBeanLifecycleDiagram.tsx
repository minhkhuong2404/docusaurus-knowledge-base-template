import React, { useState, useEffect } from 'react';

interface LifecycleStage {
  id: number;
  name: string;
  color: string;
  actions: string[];
  callbackCode: string;
  gotcha: string;
}

const LIFE_STAGES: LifecycleStage[] = [
  {
    id: 1,
    name: '1. Bean Definition Loading',
    color: '#38bdf8',
    actions: ['Scan @Component, @Service annotations', 'Read @Bean definitions from configuration classes', 'Parse XML bean declarations', 'Store configuration in BeanDefinitionRegistry'],
    callbackCode: 'BeanDefinitionRegistry.registerBeanDefinition()',
    gotcha: 'No instances are created yet. This phase is purely metadata assembly.',
  },
  {
    id: 2,
    name: '2. Instantiation (Constructor)',
    color: '#a78bfa',
    actions: ['Invoke bean constructor using reflection', 'Instantiate Bean Wrapper classes'],
    callbackCode: 'new MyBean()',
    gotcha: 'Avoid writing business logic inside constructors. Autowired dependencies are still null at this point!',
  },
  {
    id: 3,
    name: '3. Populate Properties (DI)',
    color: '#34d399',
    actions: ['Resolve dependencies from the IoC container context', 'Inject properties via setter or field injection', 'Inject constructor arguments'],
    callbackCode: '@Autowired field / setter injection',
    gotcha: 'Field injection is hard to unit test. Constructor injection is preferred since it guarantees non-null dependencies.',
  },
  {
    id: 4,
    name: '4. Aware Interfaces',
    color: '#fbbf24',
    actions: ['Invoke BeanNameAware.setBeanName()', 'Invoke BeanClassLoaderAware.setBeanClassLoader()', 'Invoke BeanFactoryAware.setBeanFactory()', 'Invoke ApplicationContextAware.setApplicationContext()'],
    callbackCode: 'implements ApplicationContextAware',
    gotcha: 'Coupled to Spring API framework. Use only when you need deep container level integration.',
  },
  {
    id: 5,
    name: '5. PostProcessor (Before Init)',
    color: '#f472b6',
    actions: ['Pass bean through all registered BeanPostProcessor classes', 'Evaluate postProcessBeforeInitialization()'],
    callbackCode: 'BeanPostProcessor.postProcessBeforeInitialization()',
    gotcha: 'Can alter, wrap, or replace the bean instance before D.I. initialization completes.',
  },
  {
    id: 6,
    name: '6. Initialization Callbacks',
    color: '#2dd4bf',
    actions: ['Execute @PostConstruct annotations', 'Invoke InitializingBean.afterPropertiesSet()', 'Invoke custom init-method defined in @Bean(initMethod = "...")'],
    callbackCode: '@PostConstruct public void init() { ... }',
    gotcha: 'The bean is initialized but not yet proxied for AOP annotations (like @Transactional or @Async) if they are handled in post-processors.',
  },
  {
    id: 7,
    name: '7. PostProcessor (After Init)',
    color: '#fb923c',
    actions: ['Pass bean through postProcessAfterInitialization()', 'CGLIB/JDK dynamic proxy objects are wrapped around the target bean (for @Transactional, @Async, @Cacheable)'],
    callbackCode: 'BeanPostProcessor.postProcessAfterInitialization()',
    gotcha: 'Spring replaces the raw target bean with a proxy object here. Autowired fields in other beans get this proxy.',
  },
  {
    id: 8,
    name: '8. Bean Ready (In Service)',
    color: '#a3e635',
    actions: ['Bean is fully cached inside the ApplicationContext Singleton scope', 'Serves client requests and handles application context transactions'],
    callbackCode: 'context.getBean(MyBean.class)',
    gotcha: 'By default, Spring beans are Singletons. Prototype scope beans skip the destruction phase.',
  },
  {
    id: 9,
    name: '9. Destruction Callbacks',
    color: '#ef4444',
    actions: ['Execute @PreDestroy annotations', 'Invoke DisposableBean.destroy()', 'Invoke custom destroy-method defined in @Bean(destroyMethod = "...")'],
    callbackCode: '@PreDestroy public void cleanup() { ... }',
    gotcha: 'Will only be called on application context shutdown. Ensure pools and sockets are closed to prevent memory leaks.',
  },
];

export default function SpringBeanLifecycleDiagram(): React.JSX.Element {
  const [activeStage, setActiveStage] = useState<number | null>(5); // Default to Init callbacks
  const [isPlaying, setIsPlaying] = useState(false);
  const [animIndex, setAnimIndex] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    if (animIndex >= LIFE_STAGES.length) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setActiveStage(animIndex);
      setAnimIndex(idx => idx + 1);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isPlaying, animIndex]);

  const startAnimation = () => {
    setActiveStage(null);
    setAnimIndex(0);
    setIsPlaying(true);
  };

  const selectedStage = activeStage !== null ? LIFE_STAGES[activeStage] : null;
  const themeColor = selectedStage ? selectedStage.color : '#34d399';

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>Spring Bean Lifecycle Phase Explorer</span>
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
          {isPlaying ? 'Animating...' : 'Animate Lifecycle'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Stages list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '380px', overflowY: 'auto' }}>
          {LIFE_STAGES.map((s, idx) => {
            const isSelected = activeStage === idx;
            return (
              <button
                key={s.id}
                onClick={() => { if (!isPlaying) setActiveStage(isSelected ? null : idx); }}
                style={{
                  padding: '10px 14px', borderRadius: '8px', border: 'none',
                  cursor: isPlaying ? 'not-allowed' : 'pointer', textAlign: 'left',
                  background: isSelected ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                  boxShadow: isSelected
                    ? `0 0 0 1.5px ${s.color}50`
                    : '0 0 0 1px rgba(255,255,255,0.07)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: isSelected ? s.color : 'var(--ifm-color-content)' }}>
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: selectedStage ? 'flex-start' : 'center',
        }}>
          {selectedStage ? (
            <div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: themeColor, display: 'block', marginBottom: '8px' }}>
                {selectedStage.name}
              </span>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  What happens
                </div>
                <ul style={{ paddingLeft: '16px', margin: 0 }}>
                  {selectedStage.actions.map((act, i) => (
                    <li key={i} style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginBottom: '3px', lineHeight: 1.4 }}>
                      {act}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Representative Method/Callback
                </div>
                <code style={{ fontSize: '11px', background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', padding: '3px 6px', borderRadius: '4px', display: 'inline-block' }}>
                  {selectedStage.callbackCode}
                </code>
              </div>

              <div style={{ background: `${themeColor}0e`, border: `1px solid ${themeColor}30`, borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: themeColor, marginBottom: '3px' }}>
                  💡 Senior Gotcha / Caution
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {selectedStage.gotcha}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Select a lifecycle stage on the left or click Animate Lifecycle to explore the complete instantiation/destruction sequence.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
