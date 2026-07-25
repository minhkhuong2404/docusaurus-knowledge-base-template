import React, { useState } from 'react';

interface ProxyType {
  id: string;
  name: string;
  badge: string;
  color: string;
  purpose: string;
  howItWorks: string;
  codePattern: string;
}

const PROXY_TYPES: ProxyType[] = [
  {
    id: 'lazy',
    name: '1. Virtual Proxy (Lazy Loading)',
    badge: 'LAZY LOAD',
    color: '#38bdf8', // Sky Blue
    purpose: 'Defers expensive object initialization (e.g., 50MB video/database connection) until the exact moment it is first invoked.',
    howItWorks: 'Proxy keeps a null reference to real service. On first method call, initializes real service and delegates.',
    codePattern: 'if (realService == null) {\n  realService = new HeavyDatabaseConnection();\n}\nrealService.query(sql);'
  },
  {
    id: 'protection',
    name: '2. Protection Proxy (Access Control)',
    badge: 'AUTH CHECK',
    color: '#f87171', // Red
    purpose: 'Enforces security credentials, role permissions, or OAuth scopes before delegating execution to sensitive operations.',
    howItWorks: 'Checks user credentials against security context. Throws AccessDeniedException if unauthorized.',
    codePattern: 'if (!user.hasRole("ADMIN")) {\n  throw new AccessDeniedException("Unauthorized");\n}\nrealService.deleteUser(id);'
  },
  {
    id: 'caching',
    name: '3. Caching Proxy (Result Memoization)',
    badge: 'CACHE STORE',
    color: '#34d399', // Emerald
    purpose: 'Stores results of expensive web API queries or database queries to instantly serve repeat requests.',
    howItWorks: 'Looks up query key in Redis/Memory cache. Returns cached result on hit; queries real service on miss.',
    codePattern: 'if (cache.contains(key)) return cache.get(key);\nResult res = realService.fetchData(key);\ncache.put(key, res);\nreturn res;'
  }
];

export default function ProxyDiagram() {
  const [activeId, setActiveId] = useState<string>('caching');
  const current = PROXY_TYPES.find(p => p.id === activeId) || PROXY_TYPES[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Proxy Design Pattern: Controlled Access Interception</span>
      </div>

      {/* Type Selector */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {PROXY_TYPES.map((p) => {
            const isActive = activeId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setActiveId(p.id)}
                style={{
                  background: isActive ? `${p.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? p.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: p.color, background: `${p.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {p.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {p.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Inspector */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.purpose}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Interception Mechanism
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {current.howItWorks}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Proxy Pattern Code
            </div>
            <pre style={{
              background: '#090b14',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--ifm-color-content)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {current.codePattern}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
