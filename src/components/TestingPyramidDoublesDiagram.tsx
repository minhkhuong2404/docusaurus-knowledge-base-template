import React, { useState } from 'react';

const PYRAMID_LEVELS = [
  {
    id: 'unit',
    name: 'Unit Tests (70% Target Volume)',
    speed: '⚡ ~1 to 5 ms per test',
    scope: 'Isolated class / method logic in memory',
    dependencies: 'None — all external collaborators replaced with Mocks/Stubs',
    frameworks: 'JUnit 5, Mockito, AssertJ',
    desc: 'Focuses strictly on pure business logic within a single class. Fastest feedback loop during active development.',
    color: '#34d399'
  },
  {
    id: 'integration',
    name: 'Integration Tests (20% Target Volume)',
    speed: '🐢 ~100 ms to 3 seconds per test',
    scope: 'Component wiring, Database SQL, HTTP REST clients, Messaging',
    dependencies: 'Real/In-memory DB (H2/Testcontainers), Spring Context, WireMock',
    frameworks: 'Spring Boot Test, WebMvcTest, DataJpaTest, Testcontainers',
    desc: 'Verifies that multiple components work together correctly and that database queries, JSON serialization, and HTTP wiring function properly.',
    color: '#38bdf8'
  },
  {
    id: 'e2e',
    name: 'End-to-End (E2E) Tests (10% Target Volume)',
    speed: '🐌 ~10 seconds to several minutes per test',
    scope: 'Full user journey from frontend UI/API gateway to backend DB',
    dependencies: 'Fully deployed environment (Staging / Kubernetes / Cypress)',
    frameworks: 'Playwright, Cypress, Selenium, RestAssured',
    desc: 'Validates complete user flows through the live system. High confidence, but expensive to maintain and prone to environmental flakiness.',
    color: '#fbbf24'
  }
];

const DOUBLES_TYPES = [
  { type: 'Dummy', color: '#94a3b8', desc: 'Passed around but never actually used. Satisfies constructor/method parameter contracts.', example: 'new Customer("dummy@test.com") passed to a logger' },
  { type: 'Stub', color: '#38bdf8', desc: 'Provides hardcoded, pre-programmed answers to method calls. No interaction verification.', example: 'when(repo.findById(1L)).thenReturn(Optional.of(user))' },
  { type: 'Mock', color: '#34d399', desc: 'Pre-programmed with expectations. Enables verification of method call counts and arguments.', example: 'verify(emailService, times(1)).sendWelcomeEmail("user@test.com")' },
  { type: 'Spy', color: '#a78bfa', desc: 'Wraps a real object. Real methods run by default unless explicitly stubbed.', example: '@Spy List<String> list = new ArrayList<>(); // real add() called' },
  { type: 'Fake', color: '#fbbf24', desc: 'Has a working software implementation, but takes shortcuts not suitable for production.', example: 'InMemoryUserRepository using a ConcurrentHashMap instead of PostgreSQL' }
];

export default function TestingPyramidDoublesDiagram({ initialTab = 'pyramid' }: { initialTab?: 'pyramid' | 'doubles' | 'first' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'pyramid' | 'doubles' | 'first'>(initialTab);
  const [selectedLevelId, setSelectedLevelId] = useState<string>('unit');
  const [selectedDoubleIdx, setSelectedDoubleIdx] = useState<number>(2); // Default Mock

  const currLevel = PYRAMID_LEVELS.find(l => l.id === selectedLevelId)!;
  const currDouble = DOUBLES_TYPES[selectedDoubleIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .test-pyramid-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 22 22 22" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Test Pyramid Architecture & Test Doubles Taxonomy
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'pyramid', label: '🔺 Test Pyramid (70/20/10)', color: '#34d399' },
            { id: 'doubles', label: '🎭 Test Doubles Taxonomy', color: '#38bdf8' },
            { id: 'first', label: '⭐ FIRST Principles', color: '#fbbf24' }
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
        {/* TAB 1: TEST PYRAMID SVG VISUAL */}
        {activeTab === 'pyramid' && (
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
              <svg viewBox="0 0 820 200" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="pyr-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Left: Interactive SVG Pyramid */}
                <g transform="translate(60, 20)">
                  {/* Top Layer: E2E */}
                  <polygon
                    points="150,10 90,65 210,65"
                    fill={selectedLevelId === 'e2e' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(251, 191, 36, 0.15)'}
                    stroke="#fbbf24"
                    strokeWidth={selectedLevelId === 'e2e' ? '2.5' : '1.5'}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => setSelectedLevelId('e2e')}
                  />
                  <text x="150" y="52" fill="#fbbf24" fontSize="10" fontWeight="800" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                    E2E (10%)
                  </text>

                  {/* Mid Layer: Integration */}
                  <polygon
                    points="85,72 215,72 260,115 40,115"
                    fill={selectedLevelId === 'integration' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.15)'}
                    stroke="#38bdf8"
                    strokeWidth={selectedLevelId === 'integration' ? '2.5' : '1.5'}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => setSelectedLevelId('integration')}
                  />
                  <text x="150" y="100" fill="#38bdf8" fontSize="11" fontWeight="800" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                    INTEGRATION (20%)
                  </text>

                  {/* Base Layer: Unit */}
                  <polygon
                    points="35,122 265,122 300,165 0,165"
                    fill={selectedLevelId === 'unit' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(52, 211, 153, 0.15)'}
                    stroke="#34d399"
                    strokeWidth={selectedLevelId === 'unit' ? '2.5' : '1.5'}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => setSelectedLevelId('unit')}
                  />
                  <text x="150" y="150" fill="#34d399" fontSize="12" fontWeight="800" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                    UNIT TESTS (70% - FAST ⚡)
                  </text>
                </g>

                {/* Right: Dimension Indicators with Animated Conduits */}
                <g transform="translate(420, 25)">
                  <rect x="0" y="0" width="370" height="150" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.1)" />
                  <text x="15" y="25" fill="#ffffff" fontSize="11" fontWeight="700">Pyramid Trade-off Hierarchy</text>

                  <path d="M 20 50 L 340 50" fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#pyr-arrow)" className="interactive-diagram-flowing-path" />
                  <text x="25" y="44" fill="#fbbf24" fontSize="8.5" fontWeight="700">▲ Higher Cost, Slower Speed, Higher Flakiness (E2E)</text>

                  <path d="M 340 100 L 20 100" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#pyr-arrow)" className="interactive-diagram-flowing-path" />
                  <text x="25" y="94" fill="#34d399" fontSize="8.5" fontWeight="700">▼ Maximum Speed (~ms), Low Cost, Pure Isolation (Unit)</text>

                  <text x="20" y="132" fill="#94a3b8" fontSize="9">
                    💡 Click any pyramid tier on the left to inspect its scope and frameworks.
                  </text>
                </g>
              </svg>
            </div>

            {/* Level Detail Card */}
            <div className="test-pyramid-grid" style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '14px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PYRAMID_LEVELS.map(lvl => (
                  <div
                    key={lvl.id}
                    onClick={() => setSelectedLevelId(lvl.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: selectedLevelId === lvl.id ? `${lvl.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedLevelId === lvl.id ? lvl.color : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: selectedLevelId === lvl.id ? lvl.color : 'var(--ifm-color-content)' }}>
                      {lvl.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>{lvl.speed}</div>
                  </div>
                ))}
              </div>

              <div className="interactive-diagram-details-card details-cyan" style={{ minHeight: '160px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: currLevel.color, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Tier Inspection
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                  {currLevel.name}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>
                  {currLevel.desc}
                </p>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  <strong>Dependencies:</strong> {currLevel.dependencies}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                  <strong>Frameworks:</strong> <code style={{ color: currLevel.color }}>{currLevel.frameworks}</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEST DOUBLES TAXONOMY */}
        {activeTab === 'doubles' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '14px' }}>
              {DOUBLES_TYPES.map((d, idx) => (
                <button
                  key={d.type}
                  onClick={() => setSelectedDoubleIdx(idx)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${selectedDoubleIdx === idx ? d.color : 'rgba(255,255,255,0.08)'}`,
                    background: selectedDoubleIdx === idx ? `${d.color}20` : 'rgba(255,255,255,0.02)',
                    color: selectedDoubleIdx === idx ? d.color : 'var(--ifm-color-content-secondary)',
                    fontWeight: selectedDoubleIdx === idx ? 800 : 500,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {d.type}
                </button>
              ))}
            </div>

            <div style={{ padding: '16px', background: `${currDouble.color}08`, border: `1px solid ${currDouble.color}30`, borderRadius: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: currDouble.color, marginBottom: '6px' }}>
                🎭 Test Double: {currDouble.type}
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '12px' }}>
                {currDouble.desc}
              </p>
              <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>CODE EXAMPLE:</div>
                <code style={{ fontSize: '11.5px', color: '#86efac', fontFamily: 'monospace' }}>{currDouble.example}</code>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FIRST PRINCIPLES */}
        {activeTab === 'first' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {[
              { letter: 'F', title: 'Fast', desc: 'Tests must run in milliseconds so developers run them continuously on every file save.', color: '#34d399' },
              { letter: 'I', title: 'Independent', desc: 'Tests must never depend on the execution order or side effects of other tests.', color: '#38bdf8' },
              { letter: 'R', title: 'Repeatable', desc: 'Tests must produce identical results in any environment (local, CI, production replica).', color: '#fbbf24' },
              { letter: 'S', title: 'Self-Validating', desc: 'Tests must pass or fail with a boolean outcome — no manual log inspection.', color: '#a78bfa' },
              { letter: 'T', title: 'Timely', desc: 'Tests should be written just before or concurrently with production code (TDD mindset).', color: '#f472b6' }
            ].map(p => (
              <div key={p.letter} style={{ padding: '12px', background: `${p.color}08`, border: `1px solid ${p.color}30`, borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ background: p.color, color: '#000', fontWeight: 800, borderRadius: '4px', padding: '2px 6px', fontSize: '11px' }}>{p.letter}</span>
                  <strong style={{ color: p.color, fontSize: '12.5px' }}>{p.title}</strong>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
