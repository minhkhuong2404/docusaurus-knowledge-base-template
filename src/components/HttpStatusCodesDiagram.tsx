import React, { useState } from 'react';

interface StatusCode {
  code: string;
  name: string;
  when: string;
  tip?: string;
  severity: 'success' | 'redirect' | 'client' | 'server';
}

const STATUS_GROUPS = [
  {
    id: '2xx',
    label: '2xx Success',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    codes: [
      { code: '200', name: 'OK', when: 'GET, PUT, PATCH, POST returning existing resource', tip: 'Most common success response — use when returning a body.' },
      { code: '201', name: 'Created', when: 'POST that creates a new resource', tip: 'Always include a Location header pointing to the new resource URI.' },
      { code: '202', name: 'Accepted', when: 'Async processing — request queued but not yet complete', tip: 'Return a job/status URL so the client can poll for completion.' },
      { code: '204', name: 'No Content', when: 'DELETE, POST actions with no response body', tip: 'Never return 200 with an empty body when 204 is more correct — it confuses clients.' },
      { code: '206', name: 'Partial Content', when: 'File download with Range header (video streaming)', tip: 'Used by video players and download managers to resume interrupted downloads.' },
    ] as (StatusCode & { tip?: string })[],
  },
  {
    id: '3xx',
    label: '3xx Redirect',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="5 12 12 5 19 12" /><line x1="12" y1="5" x2="12" y2="19" />
      </svg>
    ),
    codes: [
      { code: '301', name: 'Moved Permanently', when: 'Old URL is retired; update bookmarks and links', tip: 'Browsers cache 301 aggressively — use 302 first when testing.' },
      { code: '302', name: 'Found', when: 'Temporarily moved; keep using the original URL', tip: 'POST may silently become GET. Use 307 if method must be preserved.' },
      { code: '304', name: 'Not Modified', when: 'Conditional GET — client can use its cached copy', tip: 'Zero body transfer. Only works with If-None-Match or If-Modified-Since headers.' },
      { code: '307', name: 'Temporary Redirect', when: 'Temporary redirect preserving HTTP method', tip: 'Like 302 but POST stays POST. Use for API redirects involving mutations.' },
      { code: '308', name: 'Permanent Redirect', when: 'Permanent redirect preserving HTTP method', tip: 'Like 301 but method is preserved. Preferred over 301 for API clients.' },
    ] as (StatusCode & { tip?: string })[],
  },
  {
    id: '4xx',
    label: '4xx Client Error',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.10)',
    border: 'rgba(249,115,22,0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    codes: [
      { code: '400', name: 'Bad Request', when: 'Malformed JSON, missing required fields, parse failure', tip: 'Use for syntactically invalid input — the body can\'t even be parsed.' },
      { code: '401', name: 'Unauthorized', when: 'No token, expired token, invalid credentials', tip: 'Must include WWW-Authenticate header. Client should redirect to login.' },
      { code: '403', name: 'Forbidden', when: 'Authenticated but lacks permission for this action', tip: '"I know who you are, but you can\'t do this." Logging in again won\'t help.' },
      { code: '404', name: 'Not Found', when: 'Resource doesn\'t exist (or you\'re hiding its existence)', tip: 'You can return 404 intentionally for 403 resources to avoid information leaks.' },
      { code: '405', name: 'Method Not Allowed', when: 'Wrong method for this endpoint', tip: 'Include Allow header listing supported methods: Allow: GET, POST' },
      { code: '409', name: 'Conflict', when: 'Duplicate create, version conflict (optimistic locking)', tip: 'Common in distributed systems when two clients race to modify the same resource.' },
      { code: '410', name: 'Gone', when: 'Resource existed but was permanently deleted', tip: 'Use 410 over 404 when you want clients/crawlers to remove the link permanently.' },
      { code: '415', name: 'Unsupported Media Type', when: 'Sent XML when only JSON accepted', tip: 'Check Content-Type header. Always specify Accept in requests.' },
      { code: '422', name: 'Unprocessable Entity', when: 'Valid JSON but business rules violated', tip: 'Use when input parses but fails semantic validation (negative age, end before start).' },
      { code: '429', name: 'Too Many Requests', when: 'Rate limited — too many calls in time window', tip: 'Include Retry-After and X-RateLimit-Remaining headers.' },
    ] as (StatusCode & { tip?: string })[],
  },
  {
    id: '5xx',
    label: '5xx Server Error',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 22 2 22" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    codes: [
      { code: '500', name: 'Internal Server Error', when: 'Unhandled exception — catch-all for unexpected errors', tip: 'Log and alert immediately. Never expose stack traces in production responses.' },
      { code: '502', name: 'Bad Gateway', when: 'Gateway received invalid response from upstream', tip: 'Usually means upstream service crashed or returned garbage. Check upstream health.' },
      { code: '503', name: 'Service Unavailable', when: 'Service overloaded/down — maintenance mode, circuit breaker', tip: 'Always include Retry-After to prevent thundering herd on recovery.' },
      { code: '504', name: 'Gateway Timeout', when: 'Upstream didn\'t respond in time', tip: 'Tune upstream timeout thresholds and add circuit breakers for cascading failures.' },
    ] as (StatusCode & { tip?: string })[],
  },
];

const CONFUSION_PAIRS = [
  {
    left: { code: '400', label: '400 Bad Request' },
    right: { code: '422', label: '422 Unprocessable' },
    leftDesc: 'Body is syntactically malformed — can\'t even parse it',
    rightDesc: 'Parses fine but violates business rules',
    leftEx: '{"name": "Alice"   ← missing closing brace',
    rightEx: '{"age": -5}  ← valid JSON, but age can\'t be negative',
  },
  {
    left: { code: '401', label: '401 Unauthorized' },
    right: { code: '403', label: '403 Forbidden' },
    leftDesc: '"Who are you? I don\'t know you." → Not logged in / bad token',
    rightDesc: '"I know who you are, but you can\'t do this." → Insufficient role',
    leftEx: 'Fix: redirect to login or refresh token',
    rightEx: 'Fix: show "Access Denied" — login won\'t help',
  },
  {
    left: { code: '301', label: '301 Permanent' },
    right: { code: '307', label: '307 Temporary' },
    leftDesc: 'URL retired permanently — may change POST→GET',
    rightDesc: 'Temporary redirect — method ALWAYS preserved',
    leftEx: 'Use for retired URLs, SEO consolidation',
    rightEx: 'Use for API redirects with POST/PUT mutations',
  },
];

export default function HttpStatusCodesDiagram() {
  const [activeGroup, setActiveGroup] = useState('4xx');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [activePair, setActivePair] = useState(0);

  const group = STATUS_GROUPS.find(g => g.id === activeGroup)!;
  const selected = group.codes.find(c => c.code === selectedCode);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span>HTTP Response Status Codes — Interactive Explorer</span>
      </div>

      {/* Group tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {STATUS_GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => { setActiveGroup(g.id); setSelectedCode(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              background: activeGroup === g.id ? g.bg : 'rgba(255,255,255,0.04)',
              color: activeGroup === g.id ? g.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeGroup === g.id ? `0 0 0 1.5px ${g.border}, 0 2px 8px ${g.bg}` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ color: g.color }}>{g.icon}</span>
            {g.label}
          </button>
        ))}
      </div>

      {/* Code grid + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Left: code list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {group.codes.map(c => (
            <button
              key={c.code}
              onClick={() => setSelectedCode(selectedCode === c.code ? null : c.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', textAlign: 'left',
                background: selectedCode === c.code ? group.bg : 'rgba(255,255,255,0.03)',
                boxShadow: selectedCode === c.code
                  ? `0 0 0 1.5px ${group.border}`
                  : '0 0 0 1px rgba(255,255,255,0.07)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{
                fontFamily: 'monospace', fontWeight: 700, fontSize: '15px',
                color: group.color, minWidth: '36px',
              }}>
                {c.code}
              </span>
              <span style={{ color: 'var(--ifm-color-content)', fontSize: '13px', fontWeight: 500 }}>
                {c.name}
              </span>
            </button>
          ))}
        </div>

        {/* Right: detail panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          {selected ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: group.color, fontFamily: 'monospace' }}>
                  {selected.code}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>
                  {selected.name}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  When to use
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                  {selected.when}
                </div>
              </div>
              {selected.tip && (
                <div style={{
                  background: `${group.bg}`,
                  border: `1px solid ${group.border}`,
                  borderRadius: '8px', padding: '10px 12px',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: group.color, marginBottom: '4px' }}>
                    Pro tip
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                    {selected.tip}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px', color: group.color, opacity: 0.5 }}>
                {group.icon}
              </div>
              <div>Select a status code<br />to see details &amp; tips</div>
            </div>
          )}
        </div>
      </div>

      {/* Common confusion pairs */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Common Confusion Pairs
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {CONFUSION_PAIRS.map((p, i) => (
            <button
              key={i}
              onClick={() => setActivePair(i)}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                background: activePair === i ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                color: activePair === i ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
                boxShadow: activePair === i ? '0 0 0 1.5px rgba(139,92,246,0.4)' : '0 0 0 1px rgba(255,255,255,0.07)',
                transition: 'all 0.2s ease',
              }}
            >
              {p.left.code} vs {p.right.code}
            </button>
          ))}
        </div>

        {(() => {
          const pair = CONFUSION_PAIRS[activePair];
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { code: pair.left.code, label: pair.left.label, desc: pair.leftDesc, ex: pair.leftEx, color: '#f97316' },
                { code: pair.right.code, label: pair.right.label, desc: pair.rightDesc, ex: pair.rightEx, color: '#a78bfa' },
              ].map((side, si) => (
                <div key={si} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${side.color}40`,
                  borderRadius: '10px', padding: '14px 16px',
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 800, color: side.color, marginBottom: '6px' }}>
                    {side.label}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6, marginBottom: '8px' }}>
                    {side.desc}
                  </div>
                  <div style={{
                    fontFamily: 'monospace', fontSize: '11.5px',
                    background: 'rgba(0,0,0,0.25)', borderRadius: '6px',
                    padding: '8px 10px', color: side.color,
                  }}>
                    {side.ex}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
