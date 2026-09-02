import React, { useState } from 'react';

const ANNOTATION_LAYERS = [
  {
    id: 'junit',
    layer: 'Layer 1: JUnit 5 (Test Runner & Lifecycle)',
    color: '#34d399',
    annotations: ['@Test', '@ParameterizedTest', '@BeforeEach', '@AfterEach', '@DisplayName', '@Nested', '@Tag'],
    desc: 'Pure Java test execution runner. Controls test method execution order, lifecycle setups, and report metadata. No Spring context loaded.'
  },
  {
    id: 'mockito',
    layer: 'Layer 2: Mockito (Test Doubles & Verifications)',
    color: '#38bdf8',
    annotations: ['@Mock', '@Spy', '@InjectMocks', '@Captor', '@ExtendWith(MockitoExtension.class)'],
    desc: 'In-memory test double framework. Creates dynamic bytecode proxies for interfaces and classes, stubbing method responses and verifying invocations.'
  },
  {
    id: 'spring',
    layer: 'Layer 3: Spring Boot Test (Application Context Slices)',
    color: '#a78bfa',
    annotations: ['@SpringBootTest', '@WebMvcTest', '@DataJpaTest', '@RestClientTest', '@MockitoBean', '@MockitoSpyBean'],
    desc: 'Loads Spring Application Context (full or sliced). Injects real Spring beans, manages database transactions, and wires MVC web mocks.'
  }
];

const SLICED_TESTS = [
  { name: '@SpringBootTest', scope: 'Full Application Context', speed: '🐢 Slow (~3-10s)', loads: 'All Beans, Controllers, Services, Repositories, Security, Config', desc: 'Loads complete Spring IoC container. Best for full integration testing.', color: '#a78bfa' },
  { name: '@WebMvcTest', scope: 'Web Layer Only', speed: '⚡ Fast (~1s)', loads: 'Controllers, ControllerAdvice, JsonConverters, MockMvc', desc: 'Slices out Service & DB layers. Mocks services with @MockitoBean.', color: '#38bdf8' },
  { name: '@DataJpaTest', scope: 'JPA Database Layer Only', speed: '⚡ Fast (~1-2s)', loads: 'Repositories, Entities, TestEntityManager, In-Memory DB', desc: 'Rolls back database transaction automatically after each test.', color: '#34d399' },
  { name: '@RestClientTest', scope: 'REST Client Layer Only', speed: '⚡ Fast (~1s)', loads: 'RestTemplateBuilder, Jackson, MockRestServiceServer', desc: 'Tests outbound HTTP client requests without spinning up web server.', color: '#fbbf24' }
];

export default function SpringTestAnnotationsDiagram({ initialTab = 'layers' }: { initialTab?: 'layers' | 'slices' | 'migration' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'layers' | 'slices' | 'migration'>(initialTab);
  const [selectedLayerIdx, setSelectedLayerIdx] = useState<number>(0);
  const [selectedSliceIdx, setSelectedSliceIdx] = useState<number>(1);

  const currLayer = ANNOTATION_LAYERS[selectedLayerIdx];
  const currSlice = SLICED_TESTS[selectedSliceIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
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
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Spring Boot & JUnit 5 Testing Annotation Architecture & Slices
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'layers', label: '🏗️ 3-Layer Architecture', color: '#34d399' },
            { id: 'slices', label: '🍕 Sliced Context Matrix', color: '#a78bfa' },
            { id: 'migration', label: '🔄 Spring Boot 3.4+ Migration', color: '#fbbf24' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* SVG VISUAL PIPELINE (TAB 1 & TAB 2) */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
          <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="test-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
              </marker>
              <marker id="test-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
              </marker>
              <marker id="test-arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#a78bfa" />
              </marker>
            </defs>

            {activeTab === 'layers' && (
              <g transform="translate(15, 20)">
                {/* Layer 1: JUnit 5 */}
                <rect x="0" y="30" width="220" height="90" rx="8" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="15" y="55" fill="#34d399" fontSize="12" fontWeight="700">Layer 1: JUnit 5 Engine</text>
                <text x="15" y="75" fill="#e2e8f0" fontSize="9">@Test, @BeforeEach, @AfterEach</text>
                <text x="15" y="95" fill="#86efac" fontSize="8">• Lifecycle Execution Harness</text>
                <text x="15" y="108" fill="#86efac" fontSize="8">• 0ms Spring Context Overhead</text>

                <path d="M 225 75 L 285 75" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#test-arrow-green)" className="interactive-diagram-flowing-path" />

                {/* Layer 2: Mockito */}
                <rect x="290" y="30" width="220" height="90" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="305" y="55" fill="#38bdf8" fontSize="12" fontWeight="700">Layer 2: Mockito Doubles</text>
                <text x="305" y="75" fill="#e2e8f0" fontSize="9">@Mock, @Spy, @InjectMocks</text>
                <text x="305" y="95" fill="#93c5fd" fontSize="8">• Dynamic Bytecode Proxying</text>
                <text x="305" y="108" fill="#93c5fd" fontSize="8">• when().thenReturn() & verify()</text>

                <path d="M 515 75 L 575 75" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#test-arrow-blue)" className="interactive-diagram-flowing-path" />

                {/* Layer 3: Spring Boot Test */}
                <rect x="580" y="20" width="215" height="110" rx="8" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="595" y="45" fill="#a78bfa" fontSize="12" fontWeight="700">Layer 3: Spring IoC Test</text>
                <text x="595" y="65" fill="#e2e8f0" fontSize="9">@SpringBootTest / Slices</text>
                <text x="595" y="85" fill="#c4b5fd" fontSize="8">• TestContextManager IoC Slices</text>
                <text x="595" y="100" fill="#c4b5fd" fontSize="8">• @MockitoBean (Spring Boot 3.4+)</text>
                <text x="595" y="115" fill="#ffffff" fontSize="8">🐢 Slower (~1-5s context startup)</text>
              </g>
            )}

            {activeTab === 'slices' && (
              <g transform="translate(15, 20)">
                <rect x="0" y="10" width="790" height="135" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="20" y="35" fill="#a78bfa" fontSize="13" fontWeight="700">Spring Boot Sliced Context Boundaries</text>

                {/* WebMvcTest Slice */}
                <rect x="20" y="50" width="235" height="80" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="30" y="70" fill="#38bdf8" fontSize="11" fontWeight="700">🍕 @WebMvcTest</text>
                <text x="30" y="88" fill="#e2e8f0" fontSize="8.5">• Controllers + MockMvc</text>
                <text x="30" y="104" fill="#94a3b8" fontSize="8">• Services & DB MOCKED (Fast ⚡)</text>

                {/* DataJpaTest Slice */}
                <rect x="275" y="50" width="235" height="80" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                <text x="285" y="70" fill="#34d399" fontSize="11" fontWeight="700">🗄️ @DataJpaTest</text>
                <text x="285" y="88" fill="#e2e8f0" fontSize="8.5">• Repositories + TestEntityManager</text>
                <text x="285" y="104" fill="#86efac" fontSize="8">• Auto-rollback per test (Fast ⚡)</text>

                {/* Full SpringBootTest */}
                <rect x="530" y="50" width="235" height="80" rx="6" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                <text x="540" y="70" fill="#fbbf24" fontSize="11" fontWeight="700">📦 @SpringBootTest</text>
                <text x="540" y="88" fill="#e2e8f0" fontSize="8.5">• Full Application Context</text>
                <text x="540" y="104" fill="#fde047" fontSize="8">• Real Wiring & Security (🐢 Slow)</text>
              </g>
            )}

            {activeTab === 'migration' && (
              <g transform="translate(15, 20)">
                <rect x="0" y="25" width="340" height="95" rx="8" fill="rgba(248, 113, 113, 0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="15" y="50" fill="#f87171" fontSize="12" fontWeight="700">❌ Deprecated in Spring Boot 3.4+</text>
                <text x="15" y="72" fill="#fca5a5" fontSize="10">@MockBean & @SpyBean</text>
                <text x="15" y="92" fill="#e2e8f0" fontSize="8.5">• Tied to Spring Boot Test specific packages</text>

                <path d="M 350 75 L 430 75" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#test-arrow-green)" className="interactive-diagram-flowing-path" />
                <text x="360" y="65" fill="#34d399" fontSize="9" fontWeight="700">Upgrade</text>

                <rect x="440" y="25" width="350" height="95" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="455" y="50" fill="#34d399" fontSize="12" fontWeight="700">✅ New Standard (Spring Framework 6.2+)</text>
                <text x="455" y="72" fill="#86efac" fontSize="10">@MockitoBean & @MockitoSpyBean</text>
                <text x="455" y="92" fill="#e2e8f0" fontSize="8.5">• First-class core Spring Framework support</text>
              </g>
            )}
          </svg>
        </div>

        {/* Tab 1: 3 Layers Detail Selection */}
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
            <div className="interactive-diagram-details-card details-purple" style={{ minHeight: '220px' }}>
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

        {/* Tab 2: Slices Matrix */}
        {activeTab === 'slices' && (
          <div className="spring-annotations-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT SLICE ANNOTATION:
              </div>
              {SLICED_TESTS.map((s, idx) => {
                const isSel = idx === selectedSliceIdx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedSliceIdx(idx)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isSel ? `${s.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? s.color : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: isSel ? s.color : 'var(--ifm-color-content)' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>{s.scope}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: s.color, fontWeight: 700 }}>{s.speed}</span>
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-cyan" style={{ minHeight: '220px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: currSlice.color, textTransform: 'uppercase', marginBottom: '6px' }}>
                Slice Details
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {currSlice.name} — {currSlice.scope}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>
                {currSlice.desc}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px' }}>
                <strong>Loaded Beans / Components:</strong> {currSlice.loads}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Migration Details */}
        {activeTab === 'migration' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                Before (Spring Boot 3.3 and earlier):
              </div>
              <pre style={{ margin: 0, fontSize: '11px', color: '#fca5a5', fontFamily: 'monospace', background: '#090b14', padding: '10px', borderRadius: '6px' }}>
                <code>{`@WebMvcTest(OrderController.class)\nclass OrderControllerTest {\n    @MockBean // ← Deprecated\n    private OrderService orderService;\n\n    @SpyBean  // ← Deprecated\n    private OrderValidator validator;\n}`}</code>
              </pre>
            </div>

            <div style={{ padding: '14px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                After (Spring Boot 3.4+ / Spring Framework 6.2+):
              </div>
              <pre style={{ margin: 0, fontSize: '11px', color: '#86efac', fontFamily: 'monospace', background: '#090b14', padding: '10px', borderRadius: '6px' }}>
                <code>{`@WebMvcTest(OrderController.class)\nclass OrderControllerTest {\n    @MockitoBean // ← First-class Spring\n    private OrderService orderService;\n\n    @MockitoSpyBean // ← First-class Spring\n    private OrderValidator validator;\n}`}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
