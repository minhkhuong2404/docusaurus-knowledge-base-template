import React, { useState } from 'react';

interface CheckItem {
  text: string;
  note?: string;
}

interface ChecklistCategory {
  id: string;
  label: string;
  color: string;
  icon: React.JSX.Element;
  items: CheckItem[];
}

const CATEGORIES: ChecklistCategory[] = [
  {
    id: 'api-design',
    label: 'HTTP Methods & API Design',
    color: '#38bdf8',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    items: [
      { text: 'GET endpoints are truly read-only and safe to cache / prefetch', note: 'GETs must never mutate state — they can be prefetched by browsers.' },
      { text: 'POST returns 201 Created + Location header when creating resources', note: 'Location: /api/orders/1001 lets clients navigate to the new resource without a second lookup.' },
      { text: 'PUT is used for full replacement (not partial updates)', note: 'PUT must include the entire resource — omitted fields are cleared.' },
      { text: 'PATCH is used for partial updates (not full replacement)', note: 'Use JSON Merge Patch or JSON Patch (RFC 6902) for structured partial updates.' },
      { text: 'DELETE returns 204 No Content (not 200 with empty body)', note: '200 with empty body confuses clients — 204 is semantically correct.' },
      { text: 'Actions use POST (/orders/42/cancel), not GET', note: 'GET /cancel is dangerous — browser prefetching or link crawlers can trigger it.' },
      { text: 'Idempotency keys implemented for critical POST endpoints', note: 'Essential for payments, emails — prevents duplicate charges on network retry.' },
    ],
  },
  {
    id: 'status-codes',
    label: 'Status Codes',
    color: '#a78bfa',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    items: [
      { text: '401 returned for unauthenticated requests (with WWW-Authenticate header)', note: 'WWW-Authenticate: Bearer realm="api" is required by the HTTP spec.' },
      { text: '403 returned for authenticated-but-unauthorized requests', note: 'Never return 401 when the user is logged in — it misleads clients to re-authenticate.' },
      { text: '400 vs 422 used correctly (malformed vs semantically invalid)', note: '400 = can\'t parse the body. 422 = parsed fine but business rules violated.' },
      { text: '503 includes Retry-After header', note: 'Prevents thundering herd: all clients retry at the same time on recovery.' },
      { text: '429 includes Retry-After header and rate limit headers', note: 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset are de facto standards.' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    color: '#f87171',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    items: [
      { text: 'TLS 1.3 enabled; TLS 1.0 and 1.1 disabled', note: 'TLS 1.0/1.1 are vulnerable to POODLE, BEAST attacks and are PCI-DSS non-compliant.' },
      { text: 'HTTP redirects to HTTPS (301 redirect)', note: 'Never serve anything meaningful over plaintext HTTP in production.' },
      { text: 'HSTS configured with includeSubDomains and preload', note: 'max-age=31536000; includeSubDomains; preload — submit domain to HSTS preload list.' },
      { text: 'X-Content-Type-Options: nosniff on all responses', note: 'Prevents browsers from guessing MIME type — blocks content confusion exploits.' },
      { text: 'X-Frame-Options: DENY or CSP frame-ancestors: none', note: 'Prevents clickjacking — embedding your app in an invisible iframe to steal clicks.' },
      { text: 'Content-Security-Policy header configured', note: 'Reduces XSS attack surface by restricting allowed script/style/resource origins.' },
      { text: 'CORS allowlist uses explicit origins (no * with credentials)', note: '* + credentials = any website can make authenticated API calls as the user.' },
      { text: 'X-Forwarded-For only trusted from known proxies/load balancers', note: 'Anyone can spoof X-Forwarded-For — only trust it from your own infrastructure IPs.' },
    ],
  },
  {
    id: 'caching',
    label: 'Caching',
    color: '#34d399',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    items: [
      { text: 'Static assets have Cache-Control: public, max-age=31536000, immutable', note: 'Content hash in filename = safe to cache forever. immutable skips revalidation.' },
      { text: 'Authenticated API responses have Cache-Control: private or no-store', note: 'Never let CDN cache user-specific data — it will be served to other users.' },
      { text: 'Sensitive data (financial, PII) has Cache-Control: no-store', note: 'no-store = never stored anywhere — not disk, not RAM. Strongest privacy guarantee.' },
      { text: 'ETags implemented for expensive GET responses', note: 'ETag: "d8e8fca2dc0f896f" enables 304 Not Modified — saves full response transfer.' },
      { text: 'CDN caching configured with appropriate s-maxage', note: 's-maxage overrides max-age for CDN/proxies only — browser still uses max-age.' },
    ],
  },
  {
    id: 'observability',
    label: 'Observability',
    color: '#fbbf24',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    items: [
      { text: 'X-Request-ID header echoed on every response (distributed tracing)', note: 'Generate UUID in gateway, propagate through every service, echo back to client.' },
      { text: 'Request method and path included in access logs', note: 'Essential for debugging — logs without method+path are nearly useless.' },
      { text: '4xx and 5xx rates alerted separately', note: '4xx = client issues (spikes = abuse), 5xx = your issues (alert immediately).' },
      { text: 'Response time p50/p95/p99 tracked per endpoint', note: 'p99 catches outliers that p50 hides — long-tail latency hurts real users most.' },
    ],
  },
];

export default function ProductionChecklistDiagram() {
  const [activeCategory, setActiveCategory] = useState('api-design');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const toggleCheck = (key: string) => {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const category = CATEGORIES.find(c => c.id === activeCategory)!;
  const totalItems = category.items.length;
  const checkedItems = category.items.filter((_, i) => checked[`${activeCategory}-${i}`]).length;
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  const allTotal = CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  const allChecked = Object.values(checked).filter(Boolean).length;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        <span>Production Readiness Checklist</span>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <span style={{ color: '#34d399', fontWeight: 700 }}>{allChecked}</span>/{allTotal} total items checked
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {CATEGORIES.map(c => {
          const catChecked = c.items.filter((_, i) => checked[`${c.id}-${i}`]).length;
          const catTotal = c.items.length;
          const complete = catChecked === catTotal;
          return (
            <button
              key={c.id}
              onClick={() => { setActiveCategory(c.id); setExpandedNote(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 13px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontWeight: 600, fontSize: '12.5px',
                background: activeCategory === c.id ? `${c.color}18` : 'rgba(255,255,255,0.04)',
                color: activeCategory === c.id ? c.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeCategory === c.id ? `0 0 0 1.5px ${c.color}50` : '0 0 0 1px rgba(255,255,255,0.07)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ color: activeCategory === c.id ? c.color : 'var(--ifm-color-content-secondary)' }}>{c.icon}</span>
              {c.label}
              <span style={{
                fontSize: '11px', fontWeight: 700, marginLeft: '2px',
                color: complete ? '#34d399' : activeCategory === c.id ? c.color : 'var(--ifm-color-content-secondary)',
              }}>
                {catChecked}/{catTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            {checkedItems}/{totalItems} items in this section
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: progress === 100 ? '#34d399' : category.color }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '3px',
            width: `${progress}%`,
            background: progress === 100 ? '#34d399' : `linear-gradient(90deg, ${category.color}99, ${category.color})`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Checklist items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {category.items.map((item, i) => {
          const key = `${activeCategory}-${i}`;
          const isChecked = !!checked[key];
          const noteKey = `${key}-note`;
          const isExpanded = expandedNote === noteKey;
          return (
            <div key={i}>
              <div
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 12px', borderRadius: '8px',
                  background: isChecked ? `${category.color}0e` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isChecked ? category.color + '35' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all 0.2s ease', cursor: 'pointer',
                }}
                onClick={() => toggleCheck(key)}
              >
                {/* Checkbox */}
                <div style={{
                  width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                  border: `2px solid ${isChecked ? category.color : 'rgba(255,255,255,0.2)'}`,
                  background: isChecked ? category.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease', marginTop: '1px',
                }}>
                  {isChecked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: '13px', color: isChecked ? 'var(--ifm-color-content-secondary)' : 'var(--ifm-color-content)',
                    textDecoration: isChecked ? 'line-through' : 'none',
                    transition: 'all 0.2s ease', lineHeight: 1.5,
                  }}>
                    {item.text}
                  </span>
                  {item.note && (
                    <button
                      onClick={e => { e.stopPropagation(); setExpandedNote(isExpanded ? null : noteKey); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        marginLeft: '8px', padding: '1px 6px', borderRadius: '4px',
                        border: 'none', background: `${category.color}20`,
                        color: category.color, fontSize: '10.5px', fontWeight: 600,
                        cursor: 'pointer', verticalAlign: 'middle',
                      }}
                    >
                      {isExpanded ? 'hide' : 'why?'}
                    </button>
                  )}
                </div>
              </div>
              {item.note && isExpanded && (
                <div style={{
                  marginTop: '3px', marginLeft: '28px', padding: '8px 12px',
                  background: `${category.color}10`, border: `1px solid ${category.color}30`,
                  borderRadius: '6px', fontSize: '12.5px',
                  color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6,
                }}>
                  {item.note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {progress === 100 && (
        <div style={{
          marginTop: '16px', padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(52,211,153,0.12)', border: '1.5px solid rgba(52,211,153,0.35)',
          textAlign: 'center', fontSize: '13px', color: '#34d399', fontWeight: 600,
        }}>
          ✓ All {category.label} checks complete!
        </div>
      )}
    </div>
  );
}
