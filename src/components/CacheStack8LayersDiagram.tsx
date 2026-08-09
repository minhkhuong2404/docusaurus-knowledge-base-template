import React, { useState } from 'react';

type TabType = 'stack' | 'latency' | 'busting' | 'matrix';

interface LayerInfo {
  id: number;
  name: string;
  category: 'client_edge' | 'app_layer' | 'storage_hardware';
  latency: string;
  control: string;
  invalidation: string;
  tech: string;
  desc: string;
  color: string;
}

const LAYERS: LayerInfo[] = [
  {
    id: 1,
    name: '1. Browser HTTP Cache',
    category: 'client_edge',
    latency: '0 ms (Local)',
    control: 'No Remote Control (URL Hashing required)',
    invalidation: 'Impossible remotely; rely on URL content hash',
    tech: 'Disk Cache, Memory Cache, Service Worker',
    desc: 'Runs on end-user device. Requests served directly from local disk/memory without touching the network.',
    color: '#34d399'
  },
  {
    id: 2,
    name: '2. CDN / Edge Network',
    category: 'client_edge',
    latency: '10 - 30 ms',
    control: 'API Purge / Cache-Control Headers',
    invalidation: 'Purge API call (takes a few seconds to propagate globally)',
    tech: 'Cloudflare, AWS CloudFront, Fastly, Akamai',
    desc: 'Geographically distributed PoPs caching static assets and public API responses close to the user.',
    color: '#2dd4bf'
  },
  {
    id: 3,
    name: '3. Reverse Proxy / Gateway',
    category: 'client_edge',
    latency: '1 - 5 ms',
    control: 'Direct SSH / Proxy Admin API',
    invalidation: 'Instant (purge module, `varnishadm`, or reload)',
    tech: 'NGINX, Varnish Cache, HAProxy, Envoy',
    desc: 'Perimeter cache in front of backend servers. Caches full HTML pages, public JSON fragments, and micro-caches.',
    color: '#38bdf8'
  },
  {
    id: 4,
    name: '4. In-Process App Cache (L1)',
    category: 'app_layer',
    latency: '< 100 ns (RAM local)',
    control: '100% Application Code Control',
    invalidation: 'Instant inside local node JVM/Process heap',
    tech: 'Caffeine (Java), Guava, Ristretto (Go), Node Map',
    desc: 'Lives inside application process heap memory. Ultra-fast, zero network overhead, but NOT shared across cluster nodes.',
    color: '#a78bfa'
  },
  {
    id: 5,
    name: '5. Distributed Cache (L2)',
    category: 'app_layer',
    latency: '0.5 - 2 ms (Network)',
    control: '100% Application Code Control',
    invalidation: 'Instant (`DEL key` command execution)',
    tech: 'Redis Cluster, KeyDB, Memcached',
    desc: 'Shared external cache across all app servers. Provides a single source of cache truth over network TCP sockets.',
    color: '#8b5cf6'
  },
  {
    id: 6,
    name: '6. Database Buffer Pool',
    category: 'storage_hardware',
    latency: '100 - 500 µs',
    control: 'DBMS Engine Automatic (LRU / Clock)',
    invalidation: 'Automatic on page write / transaction commit',
    tech: 'MySQL InnoDB Buffer Pool, Postgres Shared Buffers',
    desc: 'Shared database RAM caching data blocks and index pages to prevent physical disk I/O reads.',
    color: '#fbbf24'
  },
  {
    id: 7,
    name: '7. OS Page Cache',
    category: 'storage_hardware',
    latency: '1 - 10 µs',
    control: 'Linux VFS Kernel Subsystem',
    invalidation: 'Automatic via dirty page flush / sync',
    tech: 'Linux Kernel VFS, `readahead()`, `mmap()`',
    desc: 'Unallocated OS RAM utilized by Linux kernel to cache filesystem disk blocks for fast file I/O.',
    color: '#f97316'
  },
  {
    id: 8,
    name: '8. CPU L1 / L2 / L3 Cache',
    category: 'storage_hardware',
    latency: '0.5 - 15 ns',
    control: 'Hardware CPU Cache Coherence (MESI)',
    invalidation: 'Automatic Hardware Invalidation Cycles',
    tech: 'CPU Hardware SRAM (L1 0.5ns, L2 7ns, L3 15ns)',
    desc: 'Silicon SRAM caches directly inside processor die to feed execution units without stalling for DRAM.',
    color: '#f87171'
  }
];

const LATENCY_NUMBERS = [
  { item: 'CPU L1 Cache Reference', time: '0.5 ns', ratio: '1x (Baseline)', bar: 2, color: '#f87171' },
  { item: 'CPU L2 Cache Reference', time: '7 ns', ratio: '14x', bar: 5, color: '#f87171' },
  { item: 'Main RAM Memory Read', time: '100 ns', ratio: '200x', bar: 12, color: '#a78bfa' },
  { item: 'NVMe SSD Random 4KB Read', time: '20-70 µs', ratio: '40,000x - 140,000x', bar: 35, color: '#fbbf24' },
  { item: 'Redis Network Round-Trip (Same DC)', time: '500 µs (0.5 ms)', ratio: '1,000,000x', bar: 55, color: '#8b5cf6' },
  { item: 'Rotational Hard Disk Seek', time: '10 ms', ratio: '20,000,000x', bar: 80, color: '#f97316' },
  { item: 'Transatlantic Packet (CA ↔ NL ↔ CA)', time: '150 ms', ratio: '300,000,000x', bar: 100, color: '#ec4899' }
];

export default function CacheStack8LayersDiagram({ initialTab = 'stack' }: { initialTab?: TabType }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedLayer, setSelectedLayer] = useState<number>(5); // Default Redis

  const currentLayer = LAYERS.find(l => l.id === selectedLayer) || LAYERS[4];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>The 8-Layer Cache Stack & Invalidation Safety Model</span>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { id: 'stack', label: '1. The 8-Layer Stack' },
          { id: 'latency', label: '2. Jeff Dean Latency Scale' },
          { id: 'busting', label: '3. Invalidation & Cache Busting' },
          { id: 'matrix', label: '4. Placement & Safety Matrix' }
        ].map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255, 255, 255, 0.08)',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .cs-grid-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      {/* TAB 1: THE 8-LAYER STACK */}
      {activeTab === 'stack' && (
        <div className="cs-grid-split" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* Stack Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
              Request Path (Top to Bottom)
            </div>

            {/* Edge / Client Section Badge */}
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '2px 6px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '4px', width: 'fit-content' }}>
              Before App Code Runs (Layers 1-3)
            </div>

            {LAYERS.slice(0, 3).map(layer => {
              const isSelected = selectedLayer === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? `${layer.color}18` : 'rgba(255, 255, 255, 0.02)',
                    borderLeft: `4px solid ${layer.color}`,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isSelected ? `0 0 0 1px ${layer.color}` : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: isSelected ? layer.color : 'var(--ifm-color-content)' }}>
                      {layer.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                      {layer.tech}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: layer.color, background: `${layer.color}12`, padding: '2px 8px', borderRadius: '4px' }}>
                    {layer.latency}
                  </div>
                </div>
              );
            })}

            {/* App Controlled Section Badge */}
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '2px 6px', background: 'rgba(167, 139, 250, 0.08)', borderRadius: '4px', width: 'fit-content', marginTop: '6px' }}>
              Controlled by App Code (Layers 4-5)
            </div>

            {LAYERS.slice(3, 5).map(layer => {
              const isSelected = selectedLayer === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? `${layer.color}18` : 'rgba(255, 255, 255, 0.02)',
                    borderLeft: `4px solid ${layer.color}`,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isSelected ? `0 0 0 1px ${layer.color}` : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: isSelected ? layer.color : 'var(--ifm-color-content)' }}>
                      {layer.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                      {layer.tech}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: layer.color, background: `${layer.color}12`, padding: '2px 8px', borderRadius: '4px' }}>
                    {layer.latency}
                  </div>
                </div>
              );
            })}

            {/* Storage & Hardware Badge */}
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '2px 6px', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '4px', width: 'fit-content', marginTop: '6px' }}>
              Below App Code (Layers 6-8)
            </div>

            {LAYERS.slice(5, 8).map(layer => {
              const isSelected = selectedLayer === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? `${layer.color}18` : 'rgba(255, 255, 255, 0.02)',
                    borderLeft: `4px solid ${layer.color}`,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isSelected ? `0 0 0 1px ${layer.color}` : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: isSelected ? layer.color : 'var(--ifm-color-content)' }}>
                      {layer.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                      {layer.tech}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: layer.color, background: `${layer.color}12`, padding: '2px 8px', borderRadius: '4px' }}>
                    {layer.latency}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Layer Detail Inspector */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${currentLayer.color}40`,
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: currentLayer.color }}>
                {currentLayer.name}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.5', marginBottom: '14px' }}>
              {currentLayer.desc}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Typical Latency</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: currentLayer.color }}>{currentLayer.latency}</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Control & Management</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>{currentLayer.control}</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Invalidation / Purge Capability</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>{currentLayer.invalidation}</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Technologies</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>{currentLayer.tech}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JEFF DEAN LATENCY SCALE */}
      {activeTab === 'latency' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(234, 179, 8, 0.08)', borderLeft: '4px solid #eab308', padding: '10px 14px', borderRadius: '4px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            <strong>Critical System Design Takeaway:</strong> Developers often call Redis "RAM speed". In reality, Redis resides at the <strong>Network Latency tier (~0.5 ms / 500,000 ns)</strong>, which is <strong>5,000x slower</strong> than in-process heap RAM (100 ns). Redis is fast compared to DB queries, but not compared to application memory.
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '14px' }}>
              Latency Numbers Every Computer Scientist Should Know (Jeff Dean Scale)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {LATENCY_NUMBERS.map((n, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                    <span style={{ color: 'var(--ifm-color-content)' }}>{n.item}</span>
                    <span style={{ color: n.color }}>{n.time} <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>({n.ratio})</span></span>
                  </div>
                  <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${n.bar}%`, background: n.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BROWSER CACHE BUSTING */}
      {activeTab === 'busting' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="cs-grid-split">
            {/* The Trap */}
            <div style={{ background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                The Invalidation Trap
              </div>
              <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content)', paddingLeft: '16px', margin: 0, lineHeight: '1.6' }}>
                <li><strong>Redis Delete:</strong> 1 command (`DEL key`) &rarr; Instant.</li>
                <li><strong>CDN Purge:</strong> API Request &rarr; Takes a few seconds.</li>
                <li><strong>Browser Cache:</strong> NO remote handle exists. You CANNOT issue an API call to clear a user browser cache!</li>
                <li>Setting <code>Cache-Control: max-age=86400</code> locks user browsers for 24 hours. Hotfixes will NOT reach impacted users.</li>
              </ul>
            </div>

            {/* The Solution */}
            <div style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                The Content Hash Solution
              </div>
              <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content)', paddingLeft: '16px', margin: 0, lineHeight: '1.6' }}>
                <li><strong>Do NOT try to evict. Change the URL!</strong></li>
                <li>Embed hash into bundle filename: <code>app.9f3c2b.js</code>.</li>
                <li>Set <code>Cache-Control: max-age=31536000, immutable</code>.</li>
                <li><strong>Single Mandate:</strong> <code>index.html</code> MUST be set to <code>no-cache</code> so it always fetches the newest bundle filename.</li>
              </ul>
            </div>
          </div>

          {/* Workflow Diagram */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
              Content Hashing & Cache Busting Flow
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--ifm-color-content)', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', lineHeight: '1.8' }}>
              <div>1. User requests GET /index.html &rarr; <span style={{ color: '#fbbf24' }}>Header: Cache-Control: no-cache</span> (Always revalidate)</div>
              <div>2. index.html references &lt;script src=&quot;<span style={{ color: '#34d399' }}>/static/app.9f3c2b.js</span>&quot;&gt;</div>
              <div>3. User requests GET /static/app.9f3c2b.js &rarr; <span style={{ color: '#34d399' }}>Header: Cache-Control: max-age=31536000, immutable</span></div>
              <div>4. Build deployment: Asset modified &rarr; New hash: <span style={{ color: '#a78bfa' }}>/static/app.7d81e4.js</span></div>
              <div>5. Next visit: GET /index.html yields new script tag &rarr; Browser hits new URL &rarr; All 4 layers miss <strong>EXACTLY ONCE</strong> & cache new file!</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PLACEMENT & SAFETY MATRIX */}
      {activeTab === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
            Caching at the wrong layer causes catastrophic data leaks (e.g. User A seeing User B's account session). Always check target placement rules:
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Data Category</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Recommended Cache Layer</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8' }}>TTL & Policy</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Critical Safety Rule</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Static Assets (JS/CSS/Images)</td>
                  <td style={{ padding: '8px 10px', color: '#34d399' }}>CDN + Browser Cache</td>
                  <td style={{ padding: '8px 10px' }}>1 Year (`max-age=31536000, immutable`)</td>
                  <td style={{ padding: '8px 10px', color: 'var(--ifm-color-content-secondary)' }}>Must embed Content Hash in filename.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Public Pages / Shared Feeds</td>
                  <td style={{ padding: '8px 10px', color: '#2dd4bf' }}>Reverse Proxy / CDN Edge</td>
                  <td style={{ padding: '8px 10px' }}>30-60s (`stale-while-revalidate`)</td>
                  <td style={{ padding: '8px 10px', color: 'var(--ifm-color-content-secondary)' }}>Must NOT contain session cookies or user PII.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>User Private Profile / Auth Data</td>
                  <td style={{ padding: '8px 10px', color: '#8b5cf6' }}>Distributed Redis / Auth App</td>
                  <td style={{ padding: '8px 10px' }}>Short TTL (5-15 mins) / Revocation bus</td>
                  <td style={{ padding: '8px 10px', color: '#f87171', fontWeight: 700 }}>NEVER cache on public CDN without `Cache-Control: private`.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Config & Feature Flags</td>
                  <td style={{ padding: '8px 10px', color: '#a78bfa' }}>In-Process App Cache (L1)</td>
                  <td style={{ padding: '8px 10px' }}>1-5 mins + Redis Pub/Sub invalidation</td>
                  <td style={{ padding: '8px 10px', color: 'var(--ifm-color-content-secondary)' }}>Must have cross-node invalidation channel for instant toggles.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
