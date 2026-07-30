import React, { useState } from 'react';

export default function ChassisVersioningDiagram() {
  const [tab, setTab] = useState<'semver' | 'timeline'>('semver');
  const [selectedSemver, setSelectedSemver] = useState<'major' | 'minor' | 'patch'>('minor');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span>Chassis Versioning Contract &amp; Team Upgrade Governance</span>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setTab('semver')}
          style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: tab === 'semver' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
            color: tab === 'semver' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: tab === 'semver' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          Semantic Versioning Contract (vX.Y.Z)
        </button>
        <button
          onClick={() => setTab('timeline')}
          style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: tab === 'timeline' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: tab === 'timeline' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: tab === 'timeline' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          8-Week Upgrade Rollout Strategy
        </button>
      </div>

      {tab === 'semver' ? (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              onClick={() => setSelectedSemver('major')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: selectedSemver === 'major' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.03)',
                color: selectedSemver === 'major' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                border: `1px solid ${selectedSemver === 'major' ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
                fontWeight: 800, fontSize: '12px',
              }}
            >
              MAJOR (2.0.0) — Breaking Changes
            </button>
            <button
              onClick={() => setSelectedSemver('minor')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: selectedSemver === 'minor' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)',
                color: selectedSemver === 'minor' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                border: `1px solid ${selectedSemver === 'minor' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                fontWeight: 800, fontSize: '12px',
              }}
            >
              MINOR (2.3.0) — New Features
            </button>
            <button
              onClick={() => setSelectedSemver('patch')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: selectedSemver === 'patch' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.03)',
                color: selectedSemver === 'patch' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                border: `1px solid ${selectedSemver === 'patch' ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                fontWeight: 800, fontSize: '12px',
              }}
            >
              PATCH (2.3.1) — Bug Fixes
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
            {selectedSemver === 'major' && (
              <div>
                <strong style={{ color: '#f87171' }}>MAJOR Release (e.g. 2.0.0):</strong> Breaking architectural updates (e.g., upgrading from Spring Boot 2.7 Java 11 to Spring Boot 3 Java 17+). Requires scheduled sprint migration by all service teams.
              </div>
            )}
            {selectedSemver === 'minor' && (
              <div>
                <strong style={{ color: '#38bdf8' }}>MINOR Release (e.g. 2.3.0):</strong> Backward-compatible additions (e.g., adding Permissions-Policy header or new OTLP exporter). Auto-upgraded via Dependabot/Renovate PRs.
              </div>
            )}
            {selectedSemver === 'patch' && (
              <div>
                <strong style={{ color: '#34d399' }}>PATCH Release (e.g. 2.3.1):</strong> Backward-compatible bug fixes (e.g., fixing MDC context leak in WebFlux async threads). Merged automatically via CI.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>Week 1: Release</div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Chassis 2.4.0 tag pushed, changelog &amp; deprecation warnings published.</div>
          </div>
          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>Week 2: Scan</div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Telemetry report identifies services on legacy chassis versions &lt; 2.3.x.</div>
          </div>
          <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>Weeks 2-4: Upgrade</div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Service teams pull update during regular sprint cycles without emergency stops.</div>
          </div>
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171' }}>Week 8: EOL</div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Legacy version reaches EOL. CI builds fail for un-upgraded services.</div>
          </div>
        </div>
      )}
    </div>
  );
}
