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
  { type: 'Dummy', desc: 'Passed around but never actually used. Satisfies constructor/method parameter contracts.', example: 'new Customer("dummy@test.com") passed to a logger' },
  { type: 'Stub', desc: 'Provides hardcoded, pre-programmed answers to method calls. No interaction verification.', example: 'when(repo.findById(1L)).thenReturn(Optional.of(user))' },
  { type: 'Mock', desc: 'Pre-programmed with expectations. Enables verification of method call counts and arguments.', example: 'verify(emailService, times(1)).sendWelcomeEmail("user@test.com")' },
  { type: 'Spy', desc: 'Wraps a real object. Real methods run by default unless explicitly stubbed.', example: '@Spy List<String> list = new ArrayList<>(); // real add() called' },
  { type: 'Fake', desc: 'Has a working software implementation, but takes shortcuts not suitable for production.', example: 'InMemoryUserRepository using a HashMap instead of PostgreSQL' }
];

export default function TestingPyramidDoublesDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'pyramid' | 'doubles' | 'first'>('pyramid');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('unit');
  const [selectedDoubleIdx, setSelectedDoubleIdx] = useState<number>(1);

  const currLevel = PYRAMID_LEVELS.find(l => l.id === selectedLevelId)!;
  const currDouble = DOUBLES_TYPES[selectedDoubleIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
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
          <polygon points="12 2 2 22 22 22 12 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Test Pyramid Architecture & Test Doubles Spectrum (Dummy, Stub, Mock, Spy, Fake)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'pyramid', label: '🔺 The Test Pyramid (Unit vs Integration vs E2E)', color: '#34d399' },
            { id: 'doubles', label: '🎭 Test Doubles Taxonomy (Stub vs Mock vs Spy)', color: '#38bdf8' },
            { id: 'first', label: '⚡ F.I.R.S.T. Principles & Arrange-Act-Assert (AAA)', color: '#fbbf24' }
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

        {/* Tab 1: Test Pyramid */}
        {activeTab === 'pyramid' && (
          <div className="test-pyramid-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT PYRAMID LEVEL:
              </div>

              {PYRAMID_LEVELS.map(l => {
                const isSel = l.id === selectedLevelId;
                return (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLevelId(l.id)}
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
                      {l.name}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      Execution Speed: {l.speed}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pyramid Level Detail Card */}
            <div className="interactive-diagram-details-card details-green" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: currLevel.color, textTransform: 'uppercase', marginBottom: '6px' }}>
                Level Specifications & Scope
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {currLevel.name}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                {currLevel.desc}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                <div><strong>Testing Scope:</strong> {currLevel.scope}</div>
                <div><strong>Dependencies:</strong> {currLevel.dependencies}</div>
                <div><strong>Standard Tools:</strong> <code style={{ color: currLevel.color }}>{currLevel.frameworks}</code></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Test Doubles */}
        {activeTab === 'doubles' && (
          <div className="test-pyramid-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT TEST DOUBLE TYPE:
              </div>

              {DOUBLES_TYPES.map((d, idx) => {
                const isSel = idx === selectedDoubleIdx;
                return (
                  <div
                    key={d.type}
                    onClick={() => setSelectedDoubleIdx(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSel ? '#38bdf8' : 'var(--ifm-color-content)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {d.type}
                  </div>
                );
              })}
            </div>

            {/* Test Double Details Card */}
            <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Test Double Taxonomy Inspection
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {currDouble.type}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                {currDouble.desc}
              </p>
              <pre style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', fontSize: '11px', overflowX: 'auto', margin: 0 }}>
                {currDouble.example}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: FIRST Principles */}
        {activeTab === 'first' && (
          <div className="test-pyramid-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
            {[
              { letter: 'F', title: 'Fast', desc: 'Unit tests run in milliseconds so developers run them continuously.' },
              { letter: 'I', title: 'Isolated', desc: 'Tests do not depend on each other or external state. Can run in parallel.' },
              { letter: 'R', title: 'Repeatable', desc: 'Produces identical results in any environment (Local, CI, Docker).' },
              { letter: 'S', title: 'Self-Validating', desc: 'Passes or fails automatically without human log inspection.' },
              { letter: 'T', title: 'Timely', desc: 'Written concurrently or prior to production code (TDD).' }
            ].map(item => (
              <div key={item.letter} style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24' }}>{item.letter}</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ifm-color-content)', margin: '2px 0' }}>{item.title}</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.3 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
