import React, { useState } from 'react';

interface Header {
  name: string;
  purpose: string;
  example: string;
  note?: string;
}

const REQUEST_HEADERS: Header[] = [
  { name: 'Host', purpose: 'Target server (required in HTTP/1.1)', example: 'api.example.com', note: 'Virtual hosting relies on this to route one IP to many domains.' },
  { name: 'Authorization', purpose: 'Auth credentials', example: 'Bearer <token>', note: 'Never log this header. Use OAuth 2.0 Bearer tokens for APIs.' },
  { name: 'Content-Type', purpose: 'Request body format', example: 'application/json', note: 'Without this, servers may reject or misparse your body.' },
  { name: 'Accept', purpose: 'Acceptable response formats', example: 'application/json, text/html;q=0.9', note: 'q= values are "quality factors" — weights for content negotiation.' },
  { name: 'Accept-Encoding', purpose: 'Compression algorithms supported', example: 'gzip, deflate, br', note: 'br (Brotli) offers ~20% better compression than gzip for text.' },
  { name: 'Accept-Language', purpose: 'Language preference for i18n', example: 'en-US,en;q=0.9', note: 'Use for localizing API responses or serving locale-specific content.' },
  { name: 'Cache-Control', purpose: 'Caching directives from client', example: 'no-cache', note: 'Client can ask for fresh data by sending no-cache or no-store.' },
  { name: 'If-None-Match', purpose: 'Conditional GET — ETag check', example: '"abc123"', note: 'Server returns 304 if ETag matches — zero bytes transferred.' },
  { name: 'If-Modified-Since', purpose: 'Conditional GET — date check', example: 'Tue, 10 Mar 2026 00:00:00 GMT', note: 'Fallback when ETags are not available.' },
  { name: 'X-Forwarded-For', purpose: 'Client IP behind a proxy/LB', example: '203.0.113.5, 10.0.0.1', note: 'Can be spoofed — only trust if set by your own proxy/LB.' },
  { name: 'X-Request-ID', purpose: 'Correlation ID for distributed tracing', example: '550e8400-e29b-41d4-a716-446655440000', note: 'Echo this back in the response for end-to-end trace correlation.' },
  { name: 'Idempotency-Key', purpose: 'Makes POST safely retryable', example: '550e8400-e29b-41d4-a716-446655440000', note: 'Required by Stripe, Adyen for payments. Store+deduplicate in Redis.' },
  { name: 'Origin', purpose: 'CORS — request origin domain', example: 'https://app.example.com', note: 'Automatically set by browser for cross-origin requests.' },
];

const RESPONSE_HEADERS: Header[] = [
  { name: 'Content-Type', purpose: 'Response body format', example: 'application/json; charset=utf-8', note: 'Always include charset for text responses.' },
  { name: 'Content-Encoding', purpose: 'Compression applied to body', example: 'gzip', note: 'Client must decode before parsing body.' },
  { name: 'Content-Length', purpose: 'Body size in bytes', example: '1024', note: 'Required for persistent connections when body is not chunked.' },
  { name: 'Cache-Control', purpose: 'Caching policy for this response', example: 'public, max-age=3600', note: 'Controls CDN and browser caching behavior.' },
  { name: 'ETag', purpose: 'Resource fingerprint / version tag', example: '"d8e8fca2dc0f896f"', note: 'Hash of the response body — enables conditional requests.' },
  { name: 'Last-Modified', purpose: 'Last change timestamp of resource', example: 'Mon, 14 Mar 2026 09:00:00 GMT', note: 'Less precise than ETags (second resolution, clock skew issues).' },
  { name: 'Location', purpose: 'URL of new or redirected resource', example: '/api/orders/1001', note: 'Required on 201 Created and 301/302/307/308 redirects.' },
  { name: 'Retry-After', purpose: 'Seconds until retry is safe', example: '30', note: 'Include on 429 and 503 to prevent thundering herd retries.' },
  { name: 'X-Request-ID', purpose: 'Echoed correlation ID for tracing', example: '550e8400-e29b-41d4-a716-446655440000', note: 'Tie together logs across all services handling the same request.' },
];

const SECURITY_HEADERS: Header[] = [
  { name: 'Strict-Transport-Security', purpose: 'Force HTTPS for all future visits (HSTS)', example: 'max-age=31536000; includeSubDomains; preload', note: 'Once set, browser ignores HTTP for 1 year. Never set without working HTTPS.' },
  { name: 'X-Content-Type-Options', purpose: 'Prevent MIME-type sniffing', example: 'nosniff', note: 'Stops browsers from guessing content type — prevents content confusion attacks.' },
  { name: 'X-Frame-Options', purpose: 'Prevent clickjacking via iframes', example: 'DENY', note: 'Superseded by CSP frame-ancestors, but still widely used for compatibility.' },
  { name: 'Content-Security-Policy', purpose: 'XSS and injection prevention', example: "default-src 'self'; script-src 'self' https://cdn.trusted.com", note: 'Most powerful security header. Defines allowed sources for every content type.' },
  { name: 'Access-Control-Allow-Origin', purpose: 'CORS — allowed origin domains', example: 'https://app.example.com', note: 'Never use * with credentials — that is a critical security misconfiguration.' },
  { name: 'Access-Control-Allow-Methods', purpose: 'CORS — allowed HTTP methods', example: 'GET, POST, PUT, PATCH, DELETE', note: 'Only expose the methods your API actually supports.' },
  { name: 'Access-Control-Max-Age', purpose: 'Preflight response cache duration', example: '86400', note: 'Cache for 24h to avoid a preflight on every cross-origin request.' },
  { name: 'Permissions-Policy', purpose: 'Restrict browser feature access', example: 'geolocation=(), camera=(), microphone=()', note: 'Successor to Feature-Policy. Disable features the app doesn\'t need.' },
];

const TABS = [
  { id: 'request', label: 'Request Headers', icon: '📤', color: '#38bdf8', data: REQUEST_HEADERS },
  { id: 'response', label: 'Response Headers', icon: '📥', color: '#34d399', data: RESPONSE_HEADERS },
  { id: 'security', label: 'Security Headers', icon: '🔒', color: '#f87171', data: SECURITY_HEADERS },
];

export default function HttpHeadersDiagram() {
  const [activeTab, setActiveTab] = useState('request');
  const [selectedHeader, setSelectedHeader] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const tab = TABS.find(t => t.id === activeTab)!;
  const filtered = tab.data.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.purpose.toLowerCase().includes(search.toLowerCase())
  );
  const selected = tab.data.find(h => h.name === selectedHeader);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="10" x2="14" y2="10" /><line x1="4" y1="14" x2="18" y2="14" /><line x1="4" y1="18" x2="10" y2="18" />
        </svg>
        <span>HTTP Headers — Interactive Reference</span>
      </div>

      {/* Tab row + search */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setSelectedHeader(null); setSearch(''); }}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)',
              color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {t.label}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search headers…"
          value={search}
          onChange={e => { setSearch(e.target.value); setSelectedHeader(null); }}
          style={{
            marginLeft: 'auto', padding: '7px 12px', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)',
            fontSize: '12.5px', outline: 'none', width: '160px',
          }}
        />
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Header list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
          {filtered.map(h => (
            <button
              key={h.name}
              onClick={() => setSelectedHeader(selectedHeader === h.name ? null : h.name)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '9px 12px', borderRadius: '7px', border: 'none',
                cursor: 'pointer', textAlign: 'left',
                background: selectedHeader === h.name ? `${tab.color}15` : 'rgba(255,255,255,0.03)',
                boxShadow: selectedHeader === h.name
                  ? `0 0 0 1.5px ${tab.color}50`
                  : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              <code style={{
                fontSize: '11.5px', fontWeight: 700, color: tab.color,
                background: `${tab.color}15`, borderRadius: '4px',
                padding: '1px 5px', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {h.name}
              </code>
              <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                {h.purpose}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              No headers match "{search}"
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: selected ? 'flex-start' : 'center',
        }}>
          {selected ? (
            <div>
              <code style={{
                display: 'inline-block', fontWeight: 800, fontSize: '15px', color: tab.color,
                background: `${tab.color}15`, borderRadius: '6px', padding: '3px 8px', marginBottom: '12px',
              }}>
                {selected.name}
              </code>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: tab.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Purpose</div>
                <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>{selected.purpose}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: tab.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Example Value</div>
                <div style={{
                  fontFamily: 'monospace', fontSize: '12px',
                  background: 'rgba(0,0,0,0.25)', borderRadius: '6px',
                  padding: '8px 10px', color: '#e2e8f0', wordBreak: 'break-all',
                }}>
                  {selected.name}: {selected.example}
                </div>
              </div>
              {selected.note && (
                <div style={{
                  background: `${tab.color}12`, border: `1px solid ${tab.color}40`,
                  borderRadius: '8px', padding: '10px 12px',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: tab.color, marginBottom: '4px' }}>Note</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>{selected.note}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.4 }}>{tab.icon}</div>
              <div>Select a header to see<br />its purpose and example</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
