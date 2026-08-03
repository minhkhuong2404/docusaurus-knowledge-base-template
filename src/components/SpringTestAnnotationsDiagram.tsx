import React, { useState } from 'react';

const ANNOTATION_LAYERS = [
  {
    layer: 'Layer 1: JUnit 5 (Test Runner & Lifecycle)',
    color: '#34d399',
    annotations: ['@Test', '@ParameterizedTest', '@BeforeEach', '@AfterEach', '@DisplayName', '@Nested', '@Tag'],
    desc: 'Pure Java test execution runner. Controls test method execution order, lifecycle setups, and report metadata. No Spring context loaded.'
  },
  {
    layer: 'Layer 2: Mockito (Test Doubles & Verifications)',
    color: '#38bdf8',
    annotations: ['@Mock', '@Spy', '@InjectMocks', '@Captor', '@ExtendWith(MockitoExtension.class)'],
    desc: 'In-memory test double framework. Creates dynamic bytecode proxies for interfaces and classes, stubbing method responses and verifying invocations.'
  },
  {
    layer: 'Layer 3: Spring Boot Test (Application Context Slices)',
    color: '#a78bfa',
    annotations: ['@SpringBootTest', '@WebMvcTest', '@DataJpaTest', '@RestClientTest', '@MockitoBean', '@MockitoSpyBean'],
    desc: 'Loads Spring Application Context (full or sliced). Injects real Spring beans, manages database transactions, and wires MVC web mocks.'
  }
];

const SLICED_TESTS = [
  { name: '@SpringBootTest', scope: 'Full Application Context', speed: '🐢 Slow (~3-10s)', loads: 'All Beans, Controllers, Services, Repositories, Security, Config', desc: 'Loads complete Spring IoC container. Best for full integration testing.' },
  { name: '@WebMvcTest', scope: 'Web Layer Only', speed: '⚡ Fast (~1s)', loads: 'Controllers, ControllerAdvice, JsonConverters, MockMvc', desc: 'Slices out Service & DB layers. Mocks services with @MockitoBean.' },
  { name: '@DataJpaTest', scope: 'JPA Database Layer Only', speed: '⚡ Fast (~1-2s)', loads: 'Repositories, Entities, TestEntityManager, In-Memory DB', desc: 'Rolls back database transaction automatically after each test.' },
  { name: '@RestClientTest', scope: 'REST Client Layer Only', speed: '⚡ Fast (~1s)', loads: 'RestTemplateBuilder, Jackson, MockRestServiceServer', desc: 'Tests outbound HTTP client requests without spinning up web server.' }
];

export default function SpringTestAnnotationsDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'layers' | 'slices' | 'migration'>('layers');
  const [selectedLayerIdx, setSelectedLayerIdx] = useState<number>(0);
  const [selectedSliceIdx, setSelectedSliceIdx] = useState<number>(1);

  const currLayer = ANNOTATION_LAYERS[selectedLayerIdx];
  const currSlice = SLICED_TESTS[selectedSliceIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .spring-annotations-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Spring Boot & JUnit 5 Testing Annotation Architecture & Sliced Test Decision Matrix
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'layers', label: '🏗️ 3-Layer Testing Architecture (JUnit ➔ Mockito ➔ Spring)', color: '#34d399' },
            { id: 'slices', label: '🍕 Sliced Test Decision Matrix (@WebMvcTest vs @DataJpaTest)', color: '#a78bfa' },
            { id: 'migration', label: '🔄 Spring Boot 3.4+ Migration (@MockBean ➔ @MockitoBean)', color: '#fbbf24' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: 3 Layers */}
        {activeTab === 'layers' && (
          <div className="spring-annotations-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT ANNOTATION LAYER:
              </div>

              {ANNOTATION_LAYERS.map((l, idx) => {
                const isSel = idx === selectedLayerIdx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedLayerIdx(idx)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: isSel ? `${l.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? l.color : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: isSel ? l.color : 'var(--ifm-color-content)' }}>
                      {l.layer}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Layer Details Card */}
            <div className="interactive-diagram-details-card details-purple" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: currLayer.color, textTransform: 'uppercase', marginBottom: '6px' }}>
                Layer Execution Scope
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {currLayer.layer}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                {currLayer.desc}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                <strong>Key Annotations:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {currLayer.annotations.map(a => (
                    <code key={a} style={{ fontSize: '10px', color: currLayer.color, background: `${currLayer.color}15`, padding: '2px 5px', borderRadius: '4px' }}>
                      {a}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Slices */}
        {activeTab === 'slices' && (
          <div className="spring-annotations-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT SPRING TEST SLICE:
              </div>

              {SLICED_TESTS.map((s, idx) => {
                const isSel = idx === selectedSliceIdx;
                return (
                  <div
                    key={s.name}
                    onClick={() => setSelectedSliceIdx(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSel ? '#a78bfa' : 'var(--ifm-color-content)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {s.name}
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-purple" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px' }}>
                Context Slice Specification
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                {currSlice.name}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                Speed: {currSlice.speed}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                {currSlice.desc}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                <strong>Loaded Beans:</strong> <span style={{ color: '#fbbf24' }}>{currSlice.loads}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: SB 3.4 Migration */}
        {activeTab === 'migration' && (
          <div className="spring-annotations-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '6px' }}>❌ Deprecated: @MockBean / @SpyBean</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                Deprecated in Spring Boot 3.4+. Existed in <code>org.springframework.boot.test.mock.mockito</code> package. Caused context caching pollution when misplaced.
              </p>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>✅ Modern: @MockitoBean / @MockitoSpyBean</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                First-class support in core Spring Framework 6.2+ / Spring Boot 3.4+. Located in <code>org.springframework.test.context.bean.override.mockito</code> package.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
