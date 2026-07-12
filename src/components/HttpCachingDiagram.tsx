import React, { useState } from 'react';

type CacheTab = 'directives' | 'revalidation';

export default function HttpCachingDiagram(): React.JSX.Element {
  const [tab, setTab] = useState<CacheTab>('directives');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          💾 HTTP Caching Directives & Revalidation flow
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setTab('directives')} style={{ background: tab === 'directives' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${tab === 'directives' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: tab === 'directives' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Cache Directives</button>
          <button onClick={() => setTab('revalidation')} style={{ background: tab === 'revalidation' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${tab === 'revalidation' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: tab === 'revalidation' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Revalidation (ETag)</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Info card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          {tab === 'directives' ? (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Cache-Control Directives</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Controls how client browsers and CDNs cache the response.
                <br />• <strong>no-store</strong>: Absolutely no caching allowed.
                <br />• <strong>no-cache</strong>: Can cache but must revalidate with the origin server before serving.
                <br />• <strong>max-age=3600</strong>: Cache resource for up to 1 hour (3600 seconds) without checking.
              </p>
            </>
          ) : (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#a78bfa' }}>Conditional Requests & ETags</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                When cached resources expire, client checks validity:
                <br />1. Client sends header <code>If-None-Match: "xyz123"</code>.
                <br />2. If server data is unchanged, server responds with status <strong>304 Not Modified</strong> (no body, saving bandwidth).
              </p>
            </>
          )}
        </div>

        {/* Visual mapping */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Header Logs</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {tab === 'directives' ? (
`HTTP/1.1 200 OK
Cache-Control: max-age=3600, public
ETag: "w/123456"`
            ) : (
`Client ──► Server
  GET /index.html
  If-None-Match: "w/123456"

Client ◄── Server
  HTTP/1.1 304 Not Modified`
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
