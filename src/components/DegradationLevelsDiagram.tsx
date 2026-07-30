import React, { useState } from 'react';

interface LevelDetail {
  id: number;
  label: string;
  name: string;
  color: string;
  statusText: string;
  features: { name: string; status: 'Available' | 'Degraded' | 'Offline'; details: string }[];
  snippet: string;
}

const LEVELS: LevelDetail[] = [
  {
    id: 0,
    label: 'Level 0',
    name: 'Full Functionality',
    color: '#34d399',
    statusText: 'All systems green. Normal latency and full database writes/reads.',
    features: [
      { name: 'Reads (Catalog, User profile)', status: 'Available', details: 'Directly from DB / local cache.' },
      { name: 'Writes (Orders, Checkouts)', status: 'Available', details: 'Transactions executed synchronously.' },
      { name: 'AI Recommendations', status: 'Available', details: 'Personalized models executed.' }
    ],
    snippet: `// Full latency path
public List<Product> getRecommendations(Long userId) {
    return recommendationService.getPersonalized(userId);
}`
  },
  {
    id: 1,
    label: 'Level 1',
    name: 'Graceful Degradation',
    color: '#fbbf24',
    statusText: 'Non-critical service fails. System automatically sheds heavy AI/personalization load.',
    features: [
      { name: 'Reads (Catalog, User profile)', status: 'Available', details: 'Serving from cache.' },
      { name: 'Writes (Orders, Checkouts)', status: 'Available', details: 'Direct DB writes active.' },
      { name: 'AI Recommendations', status: 'Degraded', details: 'Personalization offline. Fallback to cached Popular items.' }
    ],
    snippet: `// Fallback trigger via Hystrix/Resilience4j
@CircuitBreaker(name = "recommendations", fallbackMethod = "popularFallback")
public List<Product> getRecommendations(Long userId) {
    return recommendationService.getPersonalized(userId);
}

public List<Product> popularFallback(Long userId, Exception ex) {
    return productService.getMostPopularCached(); // Level 1 Fallback
}`
  },
  {
    id: 2,
    label: 'Level 2',
    name: 'Read-Only Mode',
    color: '#f97316',
    statusText: 'Database cluster experiences replication/write issues. System locks modifications to preserve consistency.',
    features: [
      { name: 'Reads (Catalog, User profile)', status: 'Available', details: 'Served entirely from read-replicas.' },
      { name: 'Writes (Orders, Checkouts)', status: 'Offline', details: 'Disabled. Users see transactional freeze alert.' },
      { name: 'AI Recommendations', status: 'Offline', details: 'Disabled completely.' }
    ],
    snippet: `// Interceptor checks global write-lock flag
public Order createOrder(OrderRequest req) {
    if (GlobalConfig.isReadOnlyMode()) {
        throw new ReadOnlySystemException("Transactions temporarily frozen");
    }
    return db.save(new Order(req));
}`
  },
  {
    id: 3,
    label: 'Level 3',
    name: 'Maintenance / Outage',
    color: '#f87171',
    statusText: 'Critical dependencies completely unresponsive. Edge router directs all traffic to static storage.',
    features: [
      { name: 'Reads (Catalog, User profile)', status: 'Offline', details: 'Unavailable.' },
      { name: 'Writes (Orders, Checkouts)', status: 'Offline', details: 'Unavailable.' },
      { name: 'AI Recommendations', status: 'Offline', details: 'Unavailable.' }
    ],
    snippet: `<!-- Cloudflare / CloudFront Edge Custom Error Page -->
<!DOCTYPE html>
<html>
<head><title>System Maintenance</title></head>
<body>
  <h1>We'll be right back</h1>
  <p>Our database is undergoing emergency maintenance.</p>
</body>
</html>`
  }
];

export default function DegradationLevelsDiagram() {
  const [selectedLevel, setSelectedLevel] = useState<number>(0);

  const level = LEVELS[selectedLevel];

  const getStatusColor = (status: 'Available' | 'Degraded' | 'Offline') => {
    if (status === 'Available') return '#34d399';
    if (status === 'Degraded') return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Graceful Degradation Levels</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '16px', alignItems: 'start' }} className="degrad-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .degrad-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Level Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {LEVELS.map(lvl => {
            const isSelected = selectedLevel === lvl.id;
            return (
              <button key={lvl.id} onClick={() => setSelectedLevel(lvl.id)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', textAlign: 'left',
                background: isSelected ? `${lvl.color}1c` : 'rgba(255,255,255,0.03)',
                boxShadow: isSelected ? `0 0 0 2px ${lvl.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.3s ease',
              }}>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: lvl.color,
                  boxShadow: isSelected ? `0 0 8px ${lvl.color}` : 'none'
                }} />
                <div>
                  <div style={{ fontWeight: 'bold', color: isSelected ? lvl.color : '#e2e8f0', fontSize: '13px' }}>
                    {lvl.label} — {lvl.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Explorer Panel */}
        <div className="interactive-diagram-details-card" style={{ borderColor: `${level.color}40` }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: level.color }}>{level.label}: {level.name}</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '14px' }}>
            {level.statusText}
          </p>

          {/* Features Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ifm-color-content-secondary)' }}>FEATURE MATRIX STATUS:</div>
            {level.features.map((f, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>{f.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px',
                    color: getStatusColor(f.status), background: `${getStatusColor(f.status)}15`
                  }}>{f.status}</span>
                  <span style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>{f.details}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Snippet Block */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px' }}>ARCHITECTURE / IMPLEMENTATION PATTERN:</div>
            <pre style={{
              margin: 0, padding: '10px', borderRadius: '8px', background: '#090b14',
              border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto',
              color: '#cbd5e1', fontSize: '11.5px', fontFamily: 'monospace'
            }}>
              <code>{level.snippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
